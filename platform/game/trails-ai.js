/**
 * Ghost Orbits - Trails Mode AI
 *
 * Simple reactive AI for Trails mode that:
 * 1. Seeks nearest sphere when trail length is low
 * 2. Evades nearby trails by scanning ahead
 * 3. Enters orbit when trail danger ahead
 * 4. Releases from orbit when tangent direction is safe
 * 5. Shoots at player when favorable angle
 *
 * @module trails-ai
 * @version 1.0.0
 */

/**
 * Calculate distance between two points
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}}
 */
function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/**
 * AI behavior priorities
 */
const AI_PRIORITY = {
  EVADE_TRAIL: 1,     // Highest - avoid death
  SHOOT_PLAYER: 2,    // Second - attack when safe
  SEEK_SPHERE: 3,     // Third - collect ammo
  PATROL: 4           // Lowest - wander
};

/**
 * AI configuration
 */
const AI_CONFIG = {
  // Trail detection
  TRAIL_LOOK_AHEAD: 120,       // How far ahead to scan for trails
  TRAIL_DANGER_RADIUS: 40,     // Radius to consider trail dangerous
  TRAIL_SCAN_ANGLES: 8,        // Number of directions to check

  // Sphere seeking
  LOW_AMMO_THRESHOLD: 3,       // Seek spheres when trail < this
  SPHERE_ATTRACT_RANGE: 300,   // Range to seek spheres from

  // Orbit behavior
  MIN_ORBIT_TIME: 500,         // Minimum time to stay in orbit (ms)
  SHOOT_ANGLE_THRESHOLD: 0.3,  // Radians tolerance for shot alignment

  // Prediction
  PLAYER_PREDICT_TIME: 0.5,    // Seconds ahead to predict player position

  // Random exploration
  WANDER_CHANGE_INTERVAL: 2000, // ms between wander direction changes
  WANDER_SPEED: 1.0
};

/**
 * Trails Mode AI
 */
export class TrailsAI {
  /**
   * Create TrailsAI instance
   * @param {Object} config
   * @param {number} config.arenaSize
   * @param {string} config.ghostId
   */
  constructor(config) {
    this.arenaSize = config.arenaSize || 800;
    this.ghostId = config.ghostId || 'shadow_self';

    // State
    this.currentPriority = AI_PRIORITY.PATROL;
    this.targetPosition = null;
    this.orbitEntryTime = 0;

    // Wander state
    this.wanderDirection = this._randomDirection();
    this.lastWanderChange = 0;

    // Decision cache (prevent oscillation)
    this.lastDecision = { wantsOrbit: false, wantsRelease: false };
    this.decisionLockUntil = 0;
  }

  /**
   * Update AI and return decisions
   * @param {number} dt - Delta time in seconds
   * @param {Object} gameState - Current game state
   * @returns {{wantsOrbit: boolean, wantsRelease: boolean, moveDirection: {x: number, y: number}|null}}
   */
  update(dt, gameState) {
    const currentTime = gameState.currentTime || Date.now();

    // Don't change decisions too quickly
    if (currentTime < this.decisionLockUntil) {
      return this.lastDecision;
    }

    const {
      selfX, selfY, selfVx, selfVy, selfIsOrbiting, selfTrailLength,
      playerX, playerY, playerVx, playerVy,
      trails, spheres, records, arenaSize
    } = gameState;

    // Calculate velocity magnitude
    const selfSpeed = Math.sqrt(selfVx * selfVx + selfVy * selfVy);
    const velocityDir = selfSpeed > 0.1
      ? normalize(selfVx, selfVy)
      : this.wanderDirection;

    // Check for trail danger ahead
    const trailDanger = this._detectTrailDanger(selfX, selfY, velocityDir, trails);

    // Find nearest record (safe zone)
    const nearestRecord = this._findNearestRecord(selfX, selfY, records);

    // Find nearest sphere
    const nearestSphere = this._findNearestSphere(selfX, selfY, spheres);

    // Predict player position
    const predictedPlayerX = playerX + playerVx * AI_CONFIG.PLAYER_PREDICT_TIME;
    const predictedPlayerY = playerY + playerVy * AI_CONFIG.PLAYER_PREDICT_TIME;

    let decision = {
      wantsOrbit: false,
      wantsRelease: false,
      moveDirection: null
    };

    if (selfIsOrbiting) {
      // Currently orbiting - decide when to release
      decision = this._handleOrbiting(
        selfX, selfY, nearestRecord, trails,
        predictedPlayerX, predictedPlayerY,
        selfTrailLength, currentTime
      );
    } else {
      // Free flight - decide behavior
      if (trailDanger.isDangerous && nearestRecord) {
        // Priority 1: EVADE - enter orbit if trail danger ahead
        const distToRecord = distance(selfX, selfY, nearestRecord.x, nearestRecord.y);
        if (distToRecord < nearestRecord.captureRadius) {
          decision.wantsOrbit = true;
          this.orbitEntryTime = currentTime;
          this.currentPriority = AI_PRIORITY.EVADE_TRAIL;
        } else {
          // Move toward nearest record
          decision.moveDirection = normalize(
            nearestRecord.x - selfX,
            nearestRecord.y - selfY
          );
        }
      } else if (selfTrailLength < AI_CONFIG.LOW_AMMO_THRESHOLD && nearestSphere) {
        // Priority 3: SEEK SPHERE - low on ammo
        decision.moveDirection = normalize(
          nearestSphere.x - selfX,
          nearestSphere.y - selfY
        );
        this.currentPriority = AI_PRIORITY.SEEK_SPHERE;
      } else {
        // Priority 4: PATROL - wander around
        decision.moveDirection = this._updateWander(currentTime);
        this.currentPriority = AI_PRIORITY.PATROL;
      }
    }

    // Lock decision briefly to prevent oscillation
    this.lastDecision = decision;
    this.decisionLockUntil = currentTime + 100; // 100ms lock

    return decision;
  }

  /**
   * Handle behavior while orbiting
   * @private
   */
  _handleOrbiting(selfX, selfY, record, trails, playerX, playerY, trailLength, currentTime) {
    const decision = { wantsOrbit: false, wantsRelease: false, moveDirection: null };

    // Minimum orbit time
    if (currentTime - this.orbitEntryTime < AI_CONFIG.MIN_ORBIT_TIME) {
      return decision;
    }

    if (!record) {
      decision.wantsRelease = true;
      return decision;
    }

    // Check 8 exit directions for safety
    const safeAngles = this._findSafeExitAngles(selfX, selfY, record, trails);

    if (safeAngles.length === 0) {
      // No safe exit - stay in orbit
      return decision;
    }

    // Check if any safe angle aligns with player direction (for shooting)
    if (trailLength > 0) {
      const toPlayerAngle = Math.atan2(playerY - selfY, playerX - selfX);

      for (const angle of safeAngles) {
        const angleDiff = Math.abs(this._normalizeAngle(angle - toPlayerAngle));
        if (angleDiff < AI_CONFIG.SHOOT_ANGLE_THRESHOLD) {
          // Good shot angle - release to shoot
          decision.wantsRelease = true;
          this.currentPriority = AI_PRIORITY.SHOOT_PLAYER;
          return decision;
        }
      }
    }

    // Release if safe and no specific reason to stay
    if (safeAngles.length >= 4) { // At least half the directions are safe
      decision.wantsRelease = true;
    }

    return decision;
  }

  /**
   * Detect trail danger ahead of movement
   * @private
   */
  _detectTrailDanger(x, y, velocityDir, trails) {
    const lookAhead = AI_CONFIG.TRAIL_LOOK_AHEAD;
    const dangerRadius = AI_CONFIG.TRAIL_DANGER_RADIUS;

    // Check point ahead
    const checkX = x + velocityDir.x * lookAhead;
    const checkY = y + velocityDir.y * lookAhead;

    let closestTrailDist = Infinity;
    let isDangerous = false;

    for (const trail of trails) {
      // Skip own old trail (handled by game logic)
      const dist = distance(checkX, checkY, trail.x, trail.y);
      if (dist < dangerRadius) {
        isDangerous = true;
        closestTrailDist = Math.min(closestTrailDist, dist);
      }
    }

    // Also check immediate vicinity
    for (const trail of trails) {
      const dist = distance(x, y, trail.x, trail.y);
      if (dist < dangerRadius * 0.5) {
        isDangerous = true;
        closestTrailDist = Math.min(closestTrailDist, dist);
      }
    }

    return { isDangerous, closestTrailDist };
  }

  /**
   * Find safe exit angles from orbit
   * @private
   */
  _findSafeExitAngles(x, y, record, trails) {
    const safeAngles = [];
    const numAngles = AI_CONFIG.TRAIL_SCAN_ANGLES;
    const lookAhead = AI_CONFIG.TRAIL_LOOK_AHEAD;
    const dangerRadius = AI_CONFIG.TRAIL_DANGER_RADIUS;

    for (let i = 0; i < numAngles; i++) {
      const angle = (i / numAngles) * Math.PI * 2;
      const checkX = x + Math.cos(angle) * lookAhead;
      const checkY = y + Math.sin(angle) * lookAhead;

      let isSafe = true;

      // Check if this direction has trails
      for (const trail of trails) {
        const dist = distance(checkX, checkY, trail.x, trail.y);
        if (dist < dangerRadius) {
          isSafe = false;
          break;
        }
      }

      // Also make sure we're not exiting into a wall
      if (checkX < 50 || checkX > this.arenaSize - 50 ||
          checkY < 50 || checkY > this.arenaSize - 50) {
        isSafe = false;
      }

      if (isSafe) {
        safeAngles.push(angle);
      }
    }

    return safeAngles;
  }

  /**
   * Find nearest record (safe zone)
   * @private
   */
  _findNearestRecord(x, y, records) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const record of records) {
      const rx = record.position?.x || record.x;
      const ry = record.position?.y || record.y;
      const dist = distance(x, y, rx, ry);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = {
          x: rx,
          y: ry,
          radius: record.radius || 50,
          captureRadius: record.captureRadius || 70
        };
      }
    }

    return nearest;
  }

  /**
   * Find nearest active sphere
   * @private
   */
  _findNearestSphere(x, y, spheres) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const sphere of spheres) {
      if (sphere.state !== 'ACTIVE') continue;

      const dist = distance(x, y, sphere.x, sphere.y);

      if (dist < nearestDist && dist < AI_CONFIG.SPHERE_ATTRACT_RANGE) {
        nearestDist = dist;
        nearest = sphere;
      }
    }

    return nearest;
  }

  /**
   * Update wander direction
   * @private
   */
  _updateWander(currentTime) {
    if (currentTime - this.lastWanderChange > AI_CONFIG.WANDER_CHANGE_INTERVAL) {
      this.wanderDirection = this._randomDirection();
      this.lastWanderChange = currentTime;
    }

    return this.wanderDirection;
  }

  /**
   * Generate random direction
   * @private
   */
  _randomDirection() {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  }

  /**
   * Normalize angle to -PI to PI
   * @private
   */
  _normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  /**
   * Reset AI state
   */
  reset() {
    this.currentPriority = AI_PRIORITY.PATROL;
    this.targetPosition = null;
    this.orbitEntryTime = 0;
    this.wanderDirection = this._randomDirection();
    this.lastWanderChange = 0;
    this.lastDecision = { wantsOrbit: false, wantsRelease: false };
    this.decisionLockUntil = 0;
  }
}

export default TrailsAI;
