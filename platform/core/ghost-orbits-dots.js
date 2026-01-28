/**
 * Ghost Orbits - Dots & Trail System (v2)
 *
 * Collectible dots and Snake-style trail following.
 * Dots are collected by touching them, forming a chain behind the ghost.
 * Trail is deadly to the opponent.
 *
 * @module ghost-orbits-dots
 * @version 2.0.0
 */

/**
 * Dot states
 */
const DotState = {
  NEUTRAL: 'NEUTRAL',     // Available to collect
  COLLECTED: 'COLLECTED', // Part of a ghost's trail
  RESPAWNING: 'RESPAWNING' // Temporarily unavailable (optional)
};

/**
 * Represents a collectible dot in the arena
 */
class Dot {
  constructor(config) {
    this.id = config.id || `dot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius || 8;
    this.state = DotState.NEUTRAL;
    this.ownerId = null; // Ghost that collected this dot
    this.pulsePhase = Math.random() * Math.PI * 2; // For visual pulse effect
  }

  /**
   * Check if a position collides with this dot
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Collision radius
   * @returns {boolean}
   */
  collidesWith(x, y, radius = 15) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + radius;
  }

  /**
   * Collect this dot for a ghost
   * @param {string} ownerId - Ghost ID
   */
  collect(ownerId) {
    this.state = DotState.COLLECTED;
    this.ownerId = ownerId;
  }

  /**
   * Reset dot to neutral state
   */
  reset() {
    this.state = DotState.NEUTRAL;
    this.ownerId = null;
  }
}

/**
 * Manages all dots in the arena
 */
class DotManager {
  constructor(arenaSize, options = {}) {
    this.arenaSize = arenaSize;
    this.dots = new Map(); // id -> Dot
    this.dotCount = options.dotCount || 50;
    this.dotRadius = options.dotRadius || 8;
    this.margin = options.margin || 30; // Distance from arena edges
    this.recordAvoidRadius = options.recordAvoidRadius || 90; // Don't spawn near records
    this.respawnEnabled = options.respawnEnabled || false;
    this.respawnDelay = options.respawnDelay || 5000; // ms
  }

  /**
   * Initialize dots, avoiding record positions
   * @param {Array} records - Array of record objects with position
   */
  initialize(records = []) {
    this.dots.clear();

    for (let i = 0; i < this.dotCount; i++) {
      const dot = this._createDotAvoidingRecords(records, i);
      if (dot) {
        this.dots.set(dot.id, dot);
      }
    }

    console.log(`[DotManager] Initialized ${this.dots.size} dots`);
  }

  /**
   * Create a dot at a random position, avoiding records
   * @private
   */
  _createDotAvoidingRecords(records, index) {
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = this.margin + Math.random() * (this.arenaSize - 2 * this.margin);
      const y = this.margin + Math.random() * (this.arenaSize - 2 * this.margin);

      // Check if too close to any record
      let tooClose = false;
      for (const record of records) {
        const rx = record.position ? record.position.x : record.x;
        const ry = record.position ? record.position.y : record.y;
        const dx = x - rx;
        const dy = y - ry;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.recordAvoidRadius) {
          tooClose = true;
          break;
        }
      }

      // Check if too close to existing dots
      if (!tooClose) {
        for (const existingDot of this.dots.values()) {
          const dx = x - existingDot.x;
          const dy = y - existingDot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < this.dotRadius * 3) {
            tooClose = true;
            break;
          }
        }
      }

      if (!tooClose) {
        return new Dot({
          id: `dot_${index}`,
          x,
          y,
          radius: this.dotRadius
        });
      }
    }

    // Fallback: place anywhere
    return new Dot({
      id: `dot_${index}`,
      x: this.margin + Math.random() * (this.arenaSize - 2 * this.margin),
      y: this.margin + Math.random() * (this.arenaSize - 2 * this.margin),
      radius: this.dotRadius
    });
  }

  /**
   * Check for dot collection by a ghost
   * @param {string} ghostId - Ghost ID
   * @param {number} x - Ghost X position
   * @param {number} y - Ghost Y position
   * @param {number} radius - Ghost collision radius
   * @returns {Dot|null} Collected dot or null
   */
  checkCollection(ghostId, x, y, radius = 15) {
    for (const dot of this.dots.values()) {
      if (dot.state === DotState.NEUTRAL && dot.collidesWith(x, y, radius)) {
        dot.collect(ghostId);
        return dot;
      }
    }
    return null;
  }

  /**
   * Get all dots
   * @returns {Dot[]}
   */
  getDots() {
    return Array.from(this.dots.values());
  }

  /**
   * Get dots by state
   * @param {string} state - DotState value
   * @returns {Dot[]}
   */
  getDotsByState(state) {
    return Array.from(this.dots.values()).filter(d => d.state === state);
  }

  /**
   * Get dots collected by a specific ghost
   * @param {string} ownerId - Ghost ID
   * @returns {Dot[]}
   */
  getDotsByOwner(ownerId) {
    return Array.from(this.dots.values()).filter(d => d.ownerId === ownerId);
  }

  /**
   * Count dots by owner
   * @param {string} ownerId - Ghost ID
   * @returns {number}
   */
  countDotsByOwner(ownerId) {
    return this.getDotsByOwner(ownerId).length;
  }

  /**
   * Count neutral dots
   * @returns {number}
   */
  countNeutralDots() {
    return this.getDotsByState(DotState.NEUTRAL).length;
  }

  /**
   * Reset all dots to neutral
   */
  reset() {
    for (const dot of this.dots.values()) {
      dot.reset();
    }
  }

  /**
   * Update dots (for respawn, animations, etc.)
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    // Update pulse phase for visual effect
    for (const dot of this.dots.values()) {
      dot.pulsePhase += deltaTime * 3;
      if (dot.pulsePhase > Math.PI * 2) {
        dot.pulsePhase -= Math.PI * 2;
      }
    }
  }
}

/**
 * Snake-style trail that follows the ghost
 * Collected dots form a chain behind the ghost
 */
class Trail {
  constructor(ownerId, options = {}) {
    this.ownerId = ownerId;
    this.segments = []; // Array of {x, y, dotId}
    this.spacing = options.spacing || 18; // Pixels between segments
    this.color = options.color || '#ffffff';
  }

  /**
   * Add a collected dot to the trail
   * @param {Dot} dot - The collected dot
   * @param {number} headX - Ghost head X position
   * @param {number} headY - Ghost head Y position
   */
  addDot(dot, headX, headY) {
    // Position at the end of the trail (or behind ghost if first)
    let x, y;

    if (this.segments.length === 0) {
      // First segment: position behind ghost
      x = headX;
      y = headY;
    } else {
      // Add at end of trail
      const last = this.segments[this.segments.length - 1];
      x = last.x;
      y = last.y;
    }

    this.segments.push({
      x,
      y,
      dotId: dot.id,
      radius: dot.radius
    });

    console.log(`[Trail] Added dot ${dot.id}, trail length: ${this.segments.length}`);
  }

  /**
   * Update trail to follow ghost head (Snake-style)
   * @param {number} headX - Ghost X position
   * @param {number} headY - Ghost Y position
   */
  update(headX, headY) {
    if (this.segments.length === 0) return;

    // First segment follows ghost head
    const first = this.segments[0];
    const dx0 = headX - first.x;
    const dy0 = headY - first.y;
    const dist0 = Math.sqrt(dx0 * dx0 + dy0 * dy0);

    if (dist0 > this.spacing) {
      const ratio = (dist0 - this.spacing) / dist0;
      first.x += dx0 * ratio;
      first.y += dy0 * ratio;
    }

    // Each subsequent segment follows the one ahead
    for (let i = 1; i < this.segments.length; i++) {
      const current = this.segments[i];
      const target = this.segments[i - 1];

      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > this.spacing) {
        const ratio = (dist - this.spacing) / dist;
        current.x += dx * ratio;
        current.y += dy * ratio;
      }
    }
  }

  /**
   * Check if a position collides with this trail
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} radius - Collision radius
   * @param {number} skipFirst - Number of segments to skip from head (grace period)
   * @returns {boolean}
   */
  collidesWith(x, y, radius = 15, skipFirst = 3) {
    for (let i = skipFirst; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const dx = x - seg.x;
      const dy = y - seg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < seg.radius + radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all trail segments
   * @returns {Array}
   */
  getSegments() {
    return this.segments;
  }

  /**
   * Get trail length (number of collected dots)
   * @returns {number}
   */
  get length() {
    return this.segments.length;
  }

  /**
   * Clear the trail
   */
  clear() {
    this.segments = [];
  }
}

/**
 * Manages all trails in the arena
 */
class TrailManager {
  constructor() {
    this.trails = new Map(); // ghostId -> Trail
  }

  /**
   * Create or get a trail for a ghost
   * @param {string} ghostId - Ghost ID
   * @param {string} color - Trail color
   * @returns {Trail}
   */
  getOrCreateTrail(ghostId, color) {
    if (!this.trails.has(ghostId)) {
      this.trails.set(ghostId, new Trail(ghostId, { color }));
    }
    return this.trails.get(ghostId);
  }

  /**
   * Get trail for a ghost
   * @param {string} ghostId - Ghost ID
   * @returns {Trail|undefined}
   */
  getTrail(ghostId) {
    return this.trails.get(ghostId);
  }

  /**
   * Update all trails
   * @param {Map} ghostPositions - Map of ghostId -> {x, y}
   */
  update(ghostPositions) {
    for (const [ghostId, trail] of this.trails.entries()) {
      const pos = ghostPositions.get(ghostId);
      if (pos) {
        trail.update(pos.x, pos.y);
      }
    }
  }

  /**
   * Check if a ghost collides with any enemy trail
   * @param {string} ghostId - Ghost to check
   * @param {number} x - Ghost X position
   * @param {number} y - Ghost Y position
   * @param {number} radius - Collision radius
   * @returns {string|null} Owner ID of the trail hit, or null
   */
  checkCollision(ghostId, x, y, radius = 15) {
    for (const [ownerId, trail] of this.trails.entries()) {
      // Skip own trail
      if (ownerId === ghostId) continue;

      // For enemy trails, check ALL segments (skipFirst = 0)
      // The skipFirst=3 default is only for self-collision prevention
      if (trail.collidesWith(x, y, radius, 0)) {
        console.log(`[TrailManager] Collision! ${ghostId} hit ${ownerId}'s trail (${trail.length} segments)`);
        return ownerId;
      }
    }
    return null;
  }

  /**
   * Get all trails
   * @returns {Trail[]}
   */
  getTrails() {
    return Array.from(this.trails.values());
  }

  /**
   * Clear all trails
   */
  clear() {
    this.trails.clear();
  }

  /**
   * Clear trail for a specific ghost
   * @param {string} ghostId - Ghost ID
   */
  clearTrail(ghostId) {
    const trail = this.trails.get(ghostId);
    if (trail) {
      trail.clear();
    }
  }
}

export {
  Dot,
  DotManager,
  DotState,
  Trail,
  TrailManager
};
