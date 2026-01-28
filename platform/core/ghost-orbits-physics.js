/**
 * Ghost Orbits - Physics Engine (v2 - 12 Orbits Style)
 *
 * Handles records (spinning plates), constant-velocity movement, and orbital mechanics.
 * NO gravity - ghosts fly in straight lines and use records to change direction.
 *
 * @module ghost-orbits-physics
 * @version 2.0.0
 */

// Physics constants
const PHYSICS = {
  // Movement - constant velocity, no thrust
  GHOST_SPEED: 5, // Constant movement speed (pixels per frame at 60fps)

  // Records (spinning plates)
  RECORD_CAPTURE_RADIUS: 60, // How close to be able to latch onto record
  RECORD_MIN_ORBIT_RADIUS: 20, // Minimum orbit distance from center
  RECORD_ANGULAR_SPEED: 2.5, // Base radians per second

  // Dodge mechanic
  DODGE_SPEED_MULTIPLIER: 1.8, // Speed boost during dodge
  DODGE_DURATION: 0.3, // Seconds
  DODGE_COOLDOWN: 1.0, // Seconds between dodges
};

/**
 * Vector helper class for 2D physics calculations
 */
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar) {
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magnitudeSquared() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2(0, 0);
    return this.divide(mag);
  }

  distanceTo(v) {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  perpendicular() {
    return new Vector2(-this.y, this.x);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  static fromAngle(angle, magnitude = 1) {
    return new Vector2(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }
}

/**
 * Represents a Record (spinning plate) in the arena - 12 Orbits style
 * Records are NEUTRAL tools - no ownership, no gravity, just direction changers
 */
class Record {
  constructor(config) {
    this.id = config.id || `record_${Date.now()}_${Math.random()}`;
    this.position = new Vector2(config.x, config.y);
    this.radius = config.radius || 40; // Visual radius of the record
    this.captureRadius = config.captureRadius || PHYSICS.RECORD_CAPTURE_RADIUS;

    // Spinning properties
    this.angularSpeed = config.angularSpeed || PHYSICS.RECORD_ANGULAR_SPEED;
    this.spinAngle = 0; // Current rotation for visual effect
    this.clockwise = config.clockwise !== undefined ? config.clockwise : Math.random() < 0.5;

    // Currently orbiting ghost (for visual feedback only)
    this.currentOrbiter = null;

    this.createdAt = Date.now();
  }

  /**
   * Update record spin animation
   * @param {number} deltaTime - Time elapsed
   */
  update(deltaTime) {
    const direction = this.clockwise ? -1 : 1;
    this.spinAngle += direction * this.angularSpeed * deltaTime * 0.3; // Slower visual spin
    this.spinAngle = this.spinAngle % (Math.PI * 2);
  }

  /**
   * Check if a position is within capture range
   * @param {Vector2} pos - Position to check
   * @returns {boolean}
   */
  isInCaptureRange(pos) {
    const dist = this.position.distanceTo(pos);
    return dist <= this.captureRadius && dist >= PHYSICS.RECORD_MIN_ORBIT_RADIUS;
  }

  /**
   * Get orbital velocity at given radius
   * Constant angular velocity means linear velocity = angular * radius
   * @param {number} radius - Orbit radius
   * @returns {number} Orbital speed
   */
  getOrbitalSpeed(radius) {
    return this.angularSpeed * radius;
  }
}

/**
 * Tracks orbital state for a ghost locked onto a record
 */
class OrbitState {
  constructor(recordId, radius, angularVelocity, angle, clockwise) {
    this.recordId = recordId;
    this.radius = radius; // Fixed at entry distance
    this.angularVelocity = angularVelocity; // rad/s
    this.angle = angle; // Current angle on the orbit
    this.clockwise = clockwise;
    this.enteredAt = Date.now();
  }

  /**
   * Update orbit position
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    const direction = this.clockwise ? -1 : 1;
    this.angle += direction * Math.abs(this.angularVelocity) * deltaTime;
    // Normalize angle to [0, 2π]
    this.angle = this.angle % (Math.PI * 2);
    if (this.angle < 0) this.angle += Math.PI * 2;
  }

  /**
   * Get current position on orbit
   * @param {Vector2} recordPosition - Center of the record
   * @returns {Vector2}
   */
  getPosition(recordPosition) {
    return new Vector2(
      recordPosition.x + Math.cos(this.angle) * this.radius,
      recordPosition.y + Math.sin(this.angle) * this.radius
    );
  }

  /**
   * Get tangential velocity (for release)
   * @returns {Vector2}
   */
  getVelocity() {
    const speed = Math.abs(this.angularVelocity * this.radius);
    const direction = this.clockwise ? -1 : 1;
    // Tangent is perpendicular to radial direction
    const tangentAngle = this.angle + direction * (Math.PI / 2);
    return Vector2.fromAngle(tangentAngle, speed);
  }
}

/**
 * Main Physics Engine for Ghost Orbits v2 (12 Orbits Style)
 * NO gravity - constant velocity movement with records for direction change
 */
class PhysicsEngine {
  constructor(arenaSize) {
    this.arenaSize = arenaSize || { width: 800, height: 800 };
    this.records = new Map(); // Records (spinning plates)
    this.orbitStates = new Map(); // ghostId -> OrbitState
  }

  // ============================================
  // RECORD MANAGEMENT
  // ============================================

  /**
   * Add a record (spinning plate) to the arena
   * @param {Object} config - Record configuration
   * @returns {Record}
   */
  addRecord(config) {
    const record = new Record(config);
    this.records.set(record.id, record);
    return record;
  }

  /**
   * Remove a record
   * @param {string} recordId
   */
  removeRecord(recordId) {
    this.records.delete(recordId);
    // Release any ghosts orbiting this record
    for (const [ghostId, orbitState] of this.orbitStates.entries()) {
      if (orbitState.recordId === recordId) {
        this.orbitStates.delete(ghostId);
      }
    }
  }

  /**
   * Get all records (for backwards compatibility, also aliased as getWells)
   * @returns {Record[]}
   */
  getRecords() {
    return Array.from(this.records.values());
  }

  // Alias for backwards compatibility with renderer
  getWells() {
    return this.getRecords();
  }

  /**
   * Get a specific record
   * @param {string} recordId
   * @returns {Record|undefined}
   */
  getRecord(recordId) {
    return this.records.get(recordId);
  }

  /**
   * Clear all records
   */
  clearRecords() {
    this.records.clear();
    this.orbitStates.clear();
  }

  // Alias for backwards compatibility
  clearWells() {
    this.clearRecords();
  }

  // ============================================
  // ORBIT MANAGEMENT
  // ============================================

  /**
   * Check if ghost is currently orbiting
   * @param {string} ghostId
   * @returns {boolean}
   */
  isGhostOrbiting(ghostId) {
    return this.orbitStates.has(ghostId);
  }

  /**
   * Get orbit state for a ghost
   * @param {string} ghostId
   * @returns {OrbitState|undefined}
   */
  getOrbitState(ghostId) {
    return this.orbitStates.get(ghostId);
  }

  /**
   * Request orbit entry - button-press triggered (Space key)
   * @param {string} ghostId - Ghost ID
   * @param {Object|Vector2} ghostPos - Ghost position {x, y}
   * @param {Object|Vector2} ghostVel - Ghost velocity (for determining orbit direction)
   * @returns {Record|null} - Record being orbited, or null if not near any
   */
  requestOrbitEntry(ghostId, ghostPos, ghostVel) {
    // Already orbiting?
    if (this.orbitStates.has(ghostId)) {
      console.log('[Physics] requestOrbitEntry: already orbiting');
      return null;
    }

    // Convert to Vector2 if needed
    const pos = ghostPos instanceof Vector2
      ? ghostPos
      : new Vector2(ghostPos.x, ghostPos.y);

    // Find nearest record within capture radius
    let nearestRecord = null;
    let minDistance = Infinity;

    for (const record of this.records.values()) {
      const distance = record.position.distanceTo(pos);

      if (record.isInCaptureRange(pos) && distance < minDistance) {
        minDistance = distance;
        nearestRecord = record;
      }
    }

    if (!nearestRecord) {
      // Debug: show distances to all records
      console.log(`[Physics] requestOrbitEntry: no record in range at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
      for (const record of this.records.values()) {
        const dist = record.position.distanceTo(pos);
        console.log(`  - ${record.id}: ${dist.toFixed(0)}px (capture: ${record.captureRadius}, min: ${PHYSICS.RECORD_MIN_ORBIT_RADIUS})`);
      }
      return null;
    }

    // Lock into orbit at current distance (entry radius)
    this._lockIntoOrbit(ghostId, nearestRecord, minDistance, ghostPos, ghostVel);
    nearestRecord.currentOrbiter = ghostId;
    return nearestRecord;
  }

  /**
   * Lock ghost into orbit at entry radius
   * @private
   */
  _lockIntoOrbit(ghostId, record, radius, ghostPos, ghostVel) {
    // Calculate entry angle (from record center to ghost)
    const angle = Math.atan2(
      ghostPos.y - record.position.y,
      ghostPos.x - record.position.x
    );

    // Convert to Vector2 if needed (controller may pass plain objects)
    const velVector = ghostVel instanceof Vector2
      ? ghostVel
      : new Vector2(ghostVel.x || 0, ghostVel.y || 0);
    const posVector = ghostPos instanceof Vector2
      ? ghostPos
      : new Vector2(ghostPos.x, ghostPos.y);

    // Determine orbit direction based on velocity
    // If moving counter-clockwise relative to record, orbit that way
    const toRecord = record.position.subtract(posVector);
    const tangentDir = toRecord.normalize().perpendicular();
    const tangentVel = velVector.dot(tangentDir);

    // If velocity is very small, use record's preferred direction
    const velMagnitude = velVector.magnitude();
    const clockwise = velMagnitude < 0.5 ? record.clockwise : tangentVel < 0;

    // Use record's angular speed
    const angularVelocity = record.angularSpeed;

    const orbitState = new OrbitState(record.id, radius, angularVelocity, angle, clockwise);
    this.orbitStates.set(ghostId, orbitState);

    console.log(`[Physics] Orbit entry: ${ghostId} at radius ${radius.toFixed(0)}px, ${clockwise ? 'CW' : 'CCW'}`);
  }

  /**
   * Release from orbit - returns tangential velocity
   * @param {string} ghostId
   * @returns {Vector2|null} - Release velocity, or null if not orbiting
   */
  releaseFromOrbit(ghostId) {
    const orbitState = this.orbitStates.get(ghostId);
    if (!orbitState) return null;

    const record = this.records.get(orbitState.recordId);
    if (record) {
      record.currentOrbiter = null;
    }

    // Get tangential velocity at release
    const releaseVelocity = orbitState.getVelocity();

    // Normalize to constant ghost speed
    const normalized = releaseVelocity.normalize().multiply(PHYSICS.GHOST_SPEED);

    this.orbitStates.delete(ghostId);

    console.log(`[Physics] Orbit release: ${ghostId} velocity (${normalized.x.toFixed(1)}, ${normalized.y.toFixed(1)})`);
    return normalized;
  }

  // ============================================
  // MAIN PHYSICS UPDATE
  // ============================================

  /**
   * Main physics update - constant velocity movement, no gravity
   * @param {Object[]} ghosts - Array of ghost objects with x, y, vx, vy
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(ghosts, deltaTime) {
    // Update all records (spin animation)
    for (const record of this.records.values()) {
      record.update(deltaTime);
    }

    // Update each ghost
    for (const ghost of ghosts) {
      if (this.isGhostOrbiting(ghost.id)) {
        this._updateOrbitingGhost(ghost, deltaTime);
      } else {
        this._updateFreeFlight(ghost, deltaTime);
      }
    }
  }

  /**
   * Update ghost in orbit
   * @private
   */
  _updateOrbitingGhost(ghost, deltaTime) {
    const orbitState = this.orbitStates.get(ghost.id);
    if (!orbitState) return;

    const record = this.records.get(orbitState.recordId);
    if (!record) {
      // Record was removed - release ghost
      this.orbitStates.delete(ghost.id);
      return;
    }

    // Update orbit angle
    orbitState.update(deltaTime);

    // Set ghost position on orbit
    const pos = orbitState.getPosition(record.position);
    ghost.x = pos.x;
    ghost.y = pos.y;

    // Set velocity to tangential (for smooth release)
    const vel = orbitState.getVelocity();
    ghost.vx = vel.x;
    ghost.vy = vel.y;
  }

  /**
   * Update ghost in free flight - constant velocity, wall bouncing
   * @private
   */
  _updateFreeFlight(ghost, deltaTime) {
    // Ensure ghost has velocity
    if (ghost.vx === undefined) ghost.vx = PHYSICS.GHOST_SPEED;
    if (ghost.vy === undefined) ghost.vy = 0;

    // Normalize to constant speed (no acceleration, no drag)
    const speed = Math.sqrt(ghost.vx * ghost.vx + ghost.vy * ghost.vy);
    if (speed > 0.1) {
      const scale = PHYSICS.GHOST_SPEED / speed;
      ghost.vx *= scale;
      ghost.vy *= scale;
    } else {
      // If ghost is stationary, give it a random direction
      const angle = Math.random() * Math.PI * 2;
      ghost.vx = Math.cos(angle) * PHYSICS.GHOST_SPEED;
      ghost.vy = Math.sin(angle) * PHYSICS.GHOST_SPEED;
    }

    // Update position
    ghost.x += ghost.vx * deltaTime * 60;
    ghost.y += ghost.vy * deltaTime * 60;

    // Wall bouncing
    const margin = 10; // Small margin to prevent sticking
    if (ghost.x < margin) {
      ghost.x = margin;
      ghost.vx = Math.abs(ghost.vx);
    } else if (ghost.x > this.arenaSize.width - margin) {
      ghost.x = this.arenaSize.width - margin;
      ghost.vx = -Math.abs(ghost.vx);
    }

    if (ghost.y < margin) {
      ghost.y = margin;
      ghost.vy = Math.abs(ghost.vy);
    } else if (ghost.y > this.arenaSize.height - margin) {
      ghost.y = this.arenaSize.height - margin;
      ghost.vy = -Math.abs(ghost.vy);
    }
  }

  // ============================================
  // BACKWARDS COMPATIBILITY METHODS
  // ============================================

  // These methods exist for compatibility with old code

  addWell(wellConfig) {
    // Convert old well config to record config
    return this.addRecord({
      id: wellConfig.id,
      x: wellConfig.x,
      y: wellConfig.y,
      radius: wellConfig.orbitRadius || 60,
      captureRadius: wellConfig.captureRadius || PHYSICS.RECORD_CAPTURE_RADIUS,
    });
  }

  removeWell(wellId) {
    return this.removeRecord(wellId);
  }

  getWell(wellId) {
    return this.getRecord(wellId);
  }

  getWellsByOwner(ownerId) {
    // Records have no ownership in v2
    return [];
  }

  countWellsByOwner(ownerId) {
    return 0;
  }

  getWellOwner(wellId) {
    // Records have no ownership
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if position is within capture range of a record
 * @param {Vector2} ghostPos - Ghost position
 * @param {Record} record - Record to check
 * @returns {boolean}
 */
function isInCaptureRange(ghostPos, record) {
  return record.isInCaptureRange(ghostPos);
}

/**
 * Get position on orbit at given angle
 * @param {Record} record - The record
 * @param {number} angle - Angle in radians
 * @param {number} radius - Orbit radius
 * @returns {Vector2}
 */
function getOrbitPosition(record, angle, radius) {
  radius = radius || record.radius;
  return new Vector2(
    record.position.x + Math.cos(angle) * radius,
    record.position.y + Math.sin(angle) * radius
  );
}

/**
 * Get angle from record center to a point
 * @param {Record} record - The record
 * @param {Vector2} point - Target point
 * @returns {number} Angle in radians
 */
function getAngleToPoint(record, point) {
  return Math.atan2(
    point.y - record.position.y,
    point.x - record.position.x
  );
}

/**
 * Check if two ghosts are colliding
 * @param {Object} ghost1
 * @param {Object} ghost2
 * @param {number} collisionRadius - Collision radius for each ghost (default 15)
 * @returns {boolean}
 */
function areGhostsColliding(ghost1, ghost2, collisionRadius = 15) {
  const dx = ghost1.x - ghost2.x;
  const dy = ghost1.y - ghost2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < collisionRadius * 2;
}

export {
  PhysicsEngine,
  Record,
  OrbitState,
  Vector2,
  PHYSICS,
  isInCaptureRange,
  getOrbitPosition,
  getAngleToPoint,
  areGhostsColliding,
};
