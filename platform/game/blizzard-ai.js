/**
 * Ghost Orbits - Blizzard Mode AI (12-Orbits Style)
 *
 * AI for solo mode Blizzard practice. Pong/air hockey style (horizontal play).
 * Targets dots instead of spheres, uses smash physics.
 *
 * Priorities:
 * 1. Intercept enemy dots heading toward own goal (defense)
 * 2. Smash neutral dots toward enemy goal
 * 3. Redirect own dots heading wrong way
 * 4. Patrol defense zone when no immediate threats
 *
 * Key features:
 * - Dash decision for power hits (1.5x velocity)
 * - Billiard physics awareness
 * - Goal-based scoring understanding
 *
 * @module blizzard-ai
 * @version 2.0.0
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
  // Defense zone (pong/air hockey style - horizontal play)
  DEFENSE_X_MARGIN: 0.3,        // Stay within 30% of own barrier
  DANGER_ZONE_TIME: 1.5,        // Seconds before dot reaches goal = urgent

  // Targeting
  INTERCEPT_RANGE: 400,         // Max distance to chase a dot
  PREDICTION_TIME: 0.3,         // Seconds ahead to predict dot position

  // Patrol (horizontal defense zones)
  PATROL_X_MIN: 0.6,            // Patrol between 60% and 80% of arena width (for team 1)
  PATROL_X_MAX: 0.8,
  PATROL_SPEED: 0.8,
  WANDER_CHANGE_INTERVAL: 2000, // ms between direction changes

  // Orbit behavior
  MIN_ORBIT_TIME: 400,          // Minimum time in orbit before releasing
  ORBIT_ESCAPE_RANGE: 100,      // Exit orbit if dot within this range

  // Dash (power hit) behavior
  DASH_RANGE: 50,               // Distance to dot to consider dashing
  DASH_CHANCE: 0.6              // 60% chance to power hit when close
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

    // Calculate defense zone based on team (pong/air hockey style - horizontal play)
    // Team 0 defends LEFT (goal at x=0), Team 1 defends RIGHT (goal at x=width)
    this.ownGoalX = this.teamId === 0 ? 0 : this.arenaWidth;
    this.enemyGoalX = this.teamId === 0 ? this.arenaWidth : 0;

    // State
    this.targetDot = null;
    this.orbitEntryTime = 0;

    // Patrol state (vertical movement for horizontal gameplay)
    this.wanderDirection = this._randomVerticalDirection();
    this.lastWanderChange = 0;

    // Decision cache
    this.lastDecision = {
      wantsOrbit: false,
      wantsRelease: false,
      wantsDash: false,
      moveDirection: null
    };
    this.decisionLockUntil = 0;
  }

  /**
   * Update AI and return decisions
   * @param {number} dt - Delta time in seconds
   * @param {Object} gameState - Current game state
   * @returns {{wantsOrbit: boolean, wantsRelease: boolean, wantsDash: boolean, moveDirection: {x: number, y: number}|null}}
   */
  update(dt, gameState) {
    const currentTime = gameState.currentTime || Date.now();

    // Don't change decisions too quickly
    if (currentTime < this.decisionLockUntil) {
      return this.lastDecision;
    }

    const {
      selfX, selfY, selfVx, selfVy, selfIsOrbiting,
      dots, barriers, records, arenaWidth, arenaHeight
    } = gameState;

    let decision = {
      wantsOrbit: false,
      wantsRelease: false,
      wantsDash: false,
      moveDirection: null
    };

    if (selfIsOrbiting) {
      // Currently orbiting - decide when to release
      decision = this._handleOrbiting(selfX, selfY, dots, records, currentTime);
    } else {
      // Free flight - prioritize actions
      decision = this._handleFreeFlight(selfX, selfY, selfVx, selfVy, dots, records, currentTime);
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
  _handleOrbiting(selfX, selfY, dots, records, currentTime) {
    const decision = {
      wantsOrbit: false,
      wantsRelease: false,
      wantsDash: false,
      moveDirection: null
    };

    // Minimum orbit time
    if (currentTime - this.orbitEntryTime < AI_CONFIG.MIN_ORBIT_TIME) {
      return decision;
    }

    // Check if there's a threatening dot nearby - exit to intercept
    const urgentDot = this._findMostUrgentDot(selfX, selfY, dots);
    if (urgentDot) {
      const dist = distance(selfX, selfY, urgentDot.x, urgentDot.y);
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
  _handleFreeFlight(selfX, selfY, selfVx, selfVy, dots, records, currentTime) {
    const decision = {
      wantsOrbit: false,
      wantsRelease: false,
      wantsDash: false,
      moveDirection: null
    };

    // Priority 1: Intercept enemy dots heading toward own goal
    const urgentDot = this._findMostUrgentDot(selfX, selfY, dots);

    if (urgentDot) {
      // Move to intercept
      const interceptPoint = this._calculateInterceptPoint(selfX, selfY, urgentDot);
      decision.moveDirection = normalize(
        interceptPoint.x - selfX,
        interceptPoint.y - selfY
      );
      this.targetDot = urgentDot.id;

      // Check if should dash for power hit
      const dist = distance(selfX, selfY, urgentDot.x, urgentDot.y);
      decision.wantsDash = this._shouldDash(dist, urgentDot);

      return decision;
    }

    // Priority 2: Chase neutral dots to claim and smash
    const neutralDot = this._findNearestNeutralDot(selfX, selfY, dots);
    if (neutralDot) {
      decision.moveDirection = normalize(
        neutralDot.x - selfX,
        neutralDot.y - selfY
      );
      this.targetDot = neutralDot.id;

      // Dash to power hit neutral dots toward enemy goal
      const dist = distance(selfX, selfY, neutralDot.x, neutralDot.y);
      decision.wantsDash = this._shouldDash(dist, neutralDot);

      return decision;
    }

    // Priority 3: Chase own dots heading wrong way (toward own goal)
    const wrongWayDot = this._findWrongWayDot(selfX, selfY, dots);
    if (wrongWayDot) {
      decision.moveDirection = normalize(
        wrongWayDot.x - selfX,
        wrongWayDot.y - selfY
      );

      const dist = distance(selfX, selfY, wrongWayDot.x, wrongWayDot.y);
      decision.wantsDash = this._shouldDash(dist, wrongWayDot);

      return decision;
    }

    // Priority 4: Patrol defense zone
    decision.moveDirection = this._updatePatrol(selfX, selfY, currentTime);
    this.targetDot = null;

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
   * Find the most urgent dot (enemy dot heading toward own goal)
   * @private
   */
  _findMostUrgentDot(selfX, selfY, dots) {
    let mostUrgent = null;
    let shortestTime = AI_CONFIG.DANGER_ZONE_TIME;

    for (const dot of dots) {
      // Check if dot is heading toward our goal (horizontal play)
      const headingTowardUs = this.teamId === 0
        ? dot.vx < 0  // Team 0: goal at left, dot moving left
        : dot.vx > 0; // Team 1: goal at right, dot moving right

      if (!headingTowardUs) continue;

      // Skip own dots (they score for us if they pass enemy goal)
      if (dot.teamId === this.teamId) continue;

      // Calculate time to reach our goal (horizontal distance)
      const distanceToGoal = Math.abs(dot.x - this.ownGoalX);
      const horizontalSpeed = Math.abs(dot.vx);
      const timeToGoal = horizontalSpeed > 0 ? distanceToGoal / horizontalSpeed : Infinity;

      // Check if we can intercept it
      const distToDot = distance(selfX, selfY, dot.x, dot.y);
      if (distToDot > AI_CONFIG.INTERCEPT_RANGE) continue;

      if (timeToGoal < shortestTime) {
        shortestTime = timeToGoal;
        mostUrgent = dot;
      }
    }

    return mostUrgent;
  }

  /**
   * Calculate intercept point for a moving dot
   * @private
   */
  _calculateInterceptPoint(selfX, selfY, dot) {
    // Predict where dot will be
    const predictedX = dot.x + dot.vx * AI_CONFIG.PREDICTION_TIME;
    const predictedY = dot.y + dot.vy * AI_CONFIG.PREDICTION_TIME;

    // Clamp to arena bounds
    return {
      x: Math.max(50, Math.min(this.arenaWidth - 50, predictedX)),
      y: Math.max(50, Math.min(this.arenaHeight - 50, predictedY))
    };
  }

  /**
   * Find nearest neutral dot
   * @private
   */
  _findNearestNeutralDot(selfX, selfY, dots) {
    let nearest = null;
    let nearestDist = AI_CONFIG.INTERCEPT_RANGE;

    for (const dot of dots) {
      if (dot.teamId !== null) continue;

      const dist = distance(selfX, selfY, dot.x, dot.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = dot;
      }
    }

    return nearest;
  }

  /**
   * Find own dot heading wrong way (toward own goal)
   * @private
   */
  _findWrongWayDot(selfX, selfY, dots) {
    let nearest = null;
    let nearestDist = AI_CONFIG.INTERCEPT_RANGE;

    for (const dot of dots) {
      if (dot.teamId !== this.teamId) continue;

      // Check if heading wrong way (toward our goal - horizontal)
      const headingWrongWay = this.teamId === 0
        ? dot.vx < 0  // Team 0: wrong way is moving left (toward own goal)
        : dot.vx > 0; // Team 1: wrong way is moving right (toward own goal)

      if (!headingWrongWay) continue;

      const dist = distance(selfX, selfY, dot.x, dot.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = dot;
      }
    }

    return nearest;
  }

  /**
   * Decide if AI should dash for power hit
   * @private
   */
  _shouldDash(distToDot, dot) {
    if (distToDot > AI_CONFIG.DASH_RANGE) return false;

    // Higher chance to dash for:
    // - Neutral dots (claim with power)
    // - Enemy dots heading toward us
    // - Own dots heading wrong way
    return Math.random() < AI_CONFIG.DASH_CHANCE;
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
          radius: record.radius || 70,
          captureRadius: record.captureRadius || 70
        };
      }
    }

    return nearest;
  }

  /**
   * Update patrol behavior (pong/air hockey style - stay in defensive X zone)
   * @private
   */
  _updatePatrol(selfX, selfY, currentTime) {
    // Calculate defense zone bounds based on team (horizontal play)
    // Team 0 stays on LEFT side, Team 1 stays on RIGHT side
    const minX = this.teamId === 0
      ? this.arenaWidth * 0.05                    // Team 0: stay near left
      : this.arenaWidth * AI_CONFIG.PATROL_X_MIN; // Team 1: stay on right side
    const maxX = this.teamId === 0
      ? this.arenaWidth * (1 - AI_CONFIG.PATROL_X_MIN)  // Team 0: don't go too far right
      : this.arenaWidth * 0.95;                         // Team 1: stay near right

    // Stay in defensive X zone
    let targetX = selfX;
    if (selfX < minX) {
      targetX = minX + 50;
    } else if (selfX > maxX) {
      targetX = maxX - 50;
    }

    // Change vertical direction periodically (patrol up/down like a goalie)
    if (currentTime - this.lastWanderChange > AI_CONFIG.WANDER_CHANGE_INTERVAL) {
      this.wanderDirection = this._randomVerticalDirection();
      this.lastWanderChange = currentTime;
    }

    // Combine patrol direction with staying in zone
    let dirX = 0;
    let dirY = this.wanderDirection.y;

    if (targetX !== selfX) {
      dirX = targetX > selfX ? 1 : -1;
    }

    // Bounce off vertical walls (top/bottom)
    if (selfY < 100) {
      dirY = Math.abs(dirY);
    } else if (selfY > this.arenaHeight - 100) {
      dirY = -Math.abs(dirY);
    }

    return normalize(dirX, dirY);
  }

  /**
   * Generate random vertical direction (for goalie-style patrol)
   * @private
   */
  _randomVerticalDirection() {
    const y = Math.random() > 0.5 ? 1 : -1;
    return { x: 0, y };
  }

  /**
   * Reset AI state
   */
  reset() {
    this.targetDot = null;
    this.orbitEntryTime = 0;
    this.wanderDirection = this._randomVerticalDirection();
    this.lastWanderChange = 0;
    this.lastDecision = {
      wantsOrbit: false,
      wantsRelease: false,
      wantsDash: false,
      moveDirection: null
    };
    this.decisionLockUntil = 0;
  }
}

export default BlizzardAI;
