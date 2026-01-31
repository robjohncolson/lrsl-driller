/**
 * Ghost Orbits - Blizzard Mode AI
 *
 * AI for solo mode Blizzard practice. Priorities:
 * 1. Intercept spheres heading toward own barrier (defense)
 * 2. Return neutral/own spheres toward enemy barrier
 * 3. Flip enemy spheres heading toward own barrier
 * 4. Patrol defense zone when no immediate threats
 *
 * The AI focuses on defense first, as letting spheres through scores for opponent.
 *
 * @module blizzard-ai
 * @version 1.0.0
 */

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

// ============================================
// AI CONFIGURATION
// ============================================

const AI_CONFIG = {
  // Defense zone
  DEFENSE_Y_MARGIN: 0.3,        // Stay within 30% of own barrier
  DANGER_ZONE_TIME: 2.0,        // Seconds before sphere reaches barrier = urgent

  // Targeting
  INTERCEPT_RANGE: 300,         // Max distance to chase a sphere
  PREDICTION_TIME: 0.5,         // Seconds ahead to predict sphere position

  // Patrol
  PATROL_Y_MIN: 0.6,            // Patrol between 60% and 80% of arena (for team 1)
  PATROL_Y_MAX: 0.8,
  PATROL_SPEED: 0.8,
  WANDER_CHANGE_INTERVAL: 2000, // ms between direction changes

  // Orbit behavior
  MIN_ORBIT_TIME: 400,          // Minimum time in orbit before releasing
  ORBIT_ESCAPE_RANGE: 100       // Exit orbit if sphere within this range
};

// ============================================
// BLIZZARD AI CLASS
// ============================================

/**
 * AI for Blizzard mode solo practice
 */
export class BlizzardAI {
  /**
   * Create BlizzardAI instance
   * @param {Object} config
   * @param {number} config.arenaWidth
   * @param {number} config.arenaHeight
   * @param {number} config.teamId - AI's team (0 or 1)
   * @param {string} config.ghostId
   */
  constructor(config) {
    this.arenaWidth = config.arenaWidth || 1200;
    this.arenaHeight = config.arenaHeight || 800;
    this.teamId = config.teamId || 1;
    this.ghostId = config.ghostId || 'shadow_self';

    // Calculate defense zone based on team
    // Team 0 defends top (barrier at 5%), Team 1 defends bottom (barrier at 95%)
    this.ownBarrierY = this.teamId === 0
      ? this.arenaHeight * 0.05
      : this.arenaHeight * 0.95;

    this.enemyBarrierY = this.teamId === 0
      ? this.arenaHeight * 0.95
      : this.arenaHeight * 0.05;

    // State
    this.targetSphere = null;
    this.orbitEntryTime = 0;

    // Patrol state
    this.wanderDirection = this._randomHorizontalDirection();
    this.lastWanderChange = 0;

    // Decision cache
    this.lastDecision = { wantsOrbit: false, wantsRelease: false, moveDirection: null };
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
      selfX, selfY, selfVx, selfVy, selfIsOrbiting,
      spheres, barriers, records, arenaWidth, arenaHeight
    } = gameState;

    let decision = {
      wantsOrbit: false,
      wantsRelease: false,
      moveDirection: null
    };

    if (selfIsOrbiting) {
      // Currently orbiting - decide when to release
      decision = this._handleOrbiting(selfX, selfY, spheres, records, currentTime);
    } else {
      // Free flight - prioritize actions
      decision = this._handleFreeFlight(selfX, selfY, selfVx, selfVy, spheres, records, currentTime);
    }

    // Lock decision briefly to prevent oscillation
    this.lastDecision = decision;
    this.decisionLockUntil = currentTime + 80;

    return decision;
  }

  /**
   * Handle behavior while orbiting
   * @private
   */
  _handleOrbiting(selfX, selfY, spheres, records, currentTime) {
    const decision = { wantsOrbit: false, wantsRelease: false, moveDirection: null };

    // Minimum orbit time
    if (currentTime - this.orbitEntryTime < AI_CONFIG.MIN_ORBIT_TIME) {
      return decision;
    }

    // Check if there's a threatening sphere nearby - exit to intercept
    const urgentSphere = this._findMostUrgentSphere(selfX, selfY, spheres);
    if (urgentSphere) {
      const dist = distance(selfX, selfY, urgentSphere.x, urgentSphere.y);
      if (dist < AI_CONFIG.ORBIT_ESCAPE_RANGE) {
        decision.wantsRelease = true;
        return decision;
      }
    }

    // Otherwise stay in orbit briefly, then release
    if (currentTime - this.orbitEntryTime > AI_CONFIG.MIN_ORBIT_TIME * 2) {
      decision.wantsRelease = true;
    }

    return decision;
  }

  /**
   * Handle free flight behavior
   * @private
   */
  _handleFreeFlight(selfX, selfY, selfVx, selfVy, spheres, records, currentTime) {
    const decision = { wantsOrbit: false, wantsRelease: false, moveDirection: null };

    // Priority 1: Intercept spheres heading toward own barrier
    const urgentSphere = this._findMostUrgentSphere(selfX, selfY, spheres);

    if (urgentSphere) {
      // Move to intercept
      const interceptPoint = this._calculateInterceptPoint(selfX, selfY, urgentSphere);
      decision.moveDirection = normalize(
        interceptPoint.x - selfX,
        interceptPoint.y - selfY
      );
      this.targetSphere = urgentSphere.id;
      return decision;
    }

    // Priority 2: Chase neutral spheres to return them
    const neutralSphere = this._findNearestNeutralSphere(selfX, selfY, spheres);
    if (neutralSphere) {
      decision.moveDirection = normalize(
        neutralSphere.x - selfX,
        neutralSphere.y - selfY
      );
      this.targetSphere = neutralSphere.id;
      return decision;
    }

    // Priority 3: Chase own spheres to speed them up
    const ownSphere = this._findNearestOwnSphere(selfX, selfY, spheres);
    if (ownSphere) {
      decision.moveDirection = normalize(
        ownSphere.x - selfX,
        ownSphere.y - selfY
      );
      return decision;
    }

    // Priority 4: Patrol defense zone
    decision.moveDirection = this._updatePatrol(selfX, selfY, currentTime);
    this.targetSphere = null;

    // Check if near a record and should enter orbit to wait
    const nearestRecord = this._findNearestRecord(selfX, selfY, records);
    if (nearestRecord) {
      const dist = distance(selfX, selfY, nearestRecord.x, nearestRecord.y);
      if (dist < nearestRecord.captureRadius && Math.random() < 0.1) {
        decision.wantsOrbit = true;
        this.orbitEntryTime = currentTime;
      }
    }

    return decision;
  }

  /**
   * Find the most urgent sphere (heading toward own barrier)
   * @private
   */
  _findMostUrgentSphere(selfX, selfY, spheres) {
    let mostUrgent = null;
    let shortestTime = AI_CONFIG.DANGER_ZONE_TIME;

    for (const sphere of spheres) {
      // Check if sphere is heading toward our barrier
      const headingTowardUs = this.teamId === 0
        ? sphere.velocityY < 0  // Team 0: barrier at top, sphere moving up
        : sphere.velocityY > 0; // Team 1: barrier at bottom, sphere moving down

      if (!headingTowardUs) continue;

      // Skip own spheres (they score for us if they pass enemy barrier)
      if (sphere.teamId === this.teamId) continue;

      // Calculate time to reach our barrier
      const distanceToBarrier = Math.abs(sphere.y - this.ownBarrierY);
      const verticalSpeed = Math.abs(sphere.velocityY);
      const timeToBarrier = verticalSpeed > 0 ? distanceToBarrier / verticalSpeed : Infinity;

      // Check if we can intercept it
      const distToSphere = distance(selfX, selfY, sphere.x, sphere.y);
      if (distToSphere > AI_CONFIG.INTERCEPT_RANGE) continue;

      if (timeToBarrier < shortestTime) {
        shortestTime = timeToBarrier;
        mostUrgent = sphere;
      }
    }

    return mostUrgent;
  }

  /**
   * Calculate intercept point for a moving sphere
   * @private
   */
  _calculateInterceptPoint(selfX, selfY, sphere) {
    // Predict where sphere will be
    const predictedX = sphere.x + sphere.velocityX * AI_CONFIG.PREDICTION_TIME;
    const predictedY = sphere.y + sphere.velocityY * AI_CONFIG.PREDICTION_TIME;

    // Clamp to arena bounds
    return {
      x: Math.max(50, Math.min(this.arenaWidth - 50, predictedX)),
      y: Math.max(50, Math.min(this.arenaHeight - 50, predictedY))
    };
  }

  /**
   * Find nearest neutral sphere
   * @private
   */
  _findNearestNeutralSphere(selfX, selfY, spheres) {
    let nearest = null;
    let nearestDist = AI_CONFIG.INTERCEPT_RANGE;

    for (const sphere of spheres) {
      if (sphere.teamId !== null) continue;

      const dist = distance(selfX, selfY, sphere.x, sphere.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = sphere;
      }
    }

    return nearest;
  }

  /**
   * Find nearest sphere owned by our team
   * @private
   */
  _findNearestOwnSphere(selfX, selfY, spheres) {
    let nearest = null;
    let nearestDist = AI_CONFIG.INTERCEPT_RANGE;

    for (const sphere of spheres) {
      if (sphere.teamId !== this.teamId) continue;

      // Only chase if it's heading the wrong way (toward our barrier)
      const headingWrongWay = this.teamId === 0
        ? sphere.velocityY < 0
        : sphere.velocityY > 0;

      if (!headingWrongWay) continue;

      const dist = distance(selfX, selfY, sphere.x, sphere.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = sphere;
      }
    }

    return nearest;
  }

  /**
   * Find nearest record
   * @private
   */
  _findNearestRecord(selfX, selfY, records) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const record of records) {
      const rx = record.position?.x || record.x;
      const ry = record.position?.y || record.y;
      const dist = distance(selfX, selfY, rx, ry);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = {
          x: rx,
          y: ry,
          radius: record.radius || 45,
          captureRadius: record.captureRadius || 65
        };
      }
    }

    return nearest;
  }

  /**
   * Update patrol behavior
   * @private
   */
  _updatePatrol(selfX, selfY, currentTime) {
    // Calculate defense zone bounds based on team
    const minY = this.teamId === 0
      ? this.arenaHeight * 0.1
      : this.arenaHeight * AI_CONFIG.PATROL_Y_MIN;
    const maxY = this.teamId === 0
      ? this.arenaHeight * (1 - AI_CONFIG.PATROL_Y_MIN)
      : this.arenaHeight * AI_CONFIG.PATROL_Y_MAX;

    // Stay in defense zone
    let targetY = selfY;
    if (selfY < minY) {
      targetY = minY + 50;
    } else if (selfY > maxY) {
      targetY = maxY - 50;
    }

    // Change horizontal direction periodically
    if (currentTime - this.lastWanderChange > AI_CONFIG.WANDER_CHANGE_INTERVAL) {
      this.wanderDirection = this._randomHorizontalDirection();
      this.lastWanderChange = currentTime;
    }

    // Combine patrol direction with staying in zone
    let dirX = this.wanderDirection.x;
    let dirY = 0;

    if (targetY !== selfY) {
      dirY = targetY > selfY ? 1 : -1;
    }

    // Bounce off horizontal walls
    if (selfX < 100) {
      dirX = Math.abs(dirX);
    } else if (selfX > this.arenaWidth - 100) {
      dirX = -Math.abs(dirX);
    }

    return normalize(dirX, dirY);
  }

  /**
   * Generate random horizontal direction
   * @private
   */
  _randomHorizontalDirection() {
    const x = Math.random() > 0.5 ? 1 : -1;
    return { x, y: 0 };
  }

  /**
   * Reset AI state
   */
  reset() {
    this.targetSphere = null;
    this.orbitEntryTime = 0;
    this.wanderDirection = this._randomHorizontalDirection();
    this.lastWanderChange = 0;
    this.lastDecision = { wantsOrbit: false, wantsRelease: false, moveDirection: null };
    this.decisionLockUntil = 0;
  }
}

export default BlizzardAI;
