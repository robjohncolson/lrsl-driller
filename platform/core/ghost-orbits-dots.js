/**
 * Ghost Orbits - Dot Territory System (v3)
 *
 * Dots are territory markers that persist on the field.
 * - Touch unclaimed dot = claim it for your color
 * - Touch opponent's dot + spacebar = flip to your color
 * - Touch opponent's dot WITHOUT spacebar = lose a life
 * - 90% dots one color = win (remaining auto-convert)
 *
 * @module ghost-orbits-dots
 * @version 3.0.0
 */

/**
 * Dot ownership states
 */
const DotState = {
  NEUTRAL: 'NEUTRAL',         // Available to claim
  PLAYER_OWNED: 'PLAYER',     // Owned by player
  SHADOW_OWNED: 'SHADOW'      // Owned by shadow/opponent
};

/**
 * Configuration for dot territory system
 */
const DOT_CONFIG = {
  FLIP_WINDOW_MS: 250,        // Spacebar must be pressed within 250ms of touching enemy dot
  WIN_THRESHOLD: 0.90,        // 90% ownership = win
  COLLISION_RADIUS: 15,       // Ghost collision radius with dots
  DOT_RADIUS: 10,             // Visual radius of dots
  PULSE_SPEED: 3,             // Speed of pulsing animation
};

/**
 * Represents a territory dot in the arena
 */
class Dot {
  constructor(config) {
    this.id = config.id || `dot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius || DOT_CONFIG.DOT_RADIUS;
    this.state = DotState.NEUTRAL;
    this.ownerId = null;       // 'player', 'shadow', or null
    this.ownerColor = null;    // Color of owner for rendering
    this.pulsePhase = Math.random() * Math.PI * 2; // For visual pulse effect
    this.lastTouchedBy = null; // Track who last touched this dot
    this.lastTouchTime = 0;    // When it was last touched
  }

  /**
   * Check if a position collides with this dot
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Collision radius
   * @returns {boolean}
   */
  collidesWith(x, y, radius = DOT_CONFIG.COLLISION_RADIUS) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + radius;
  }

  /**
   * Claim this dot for an owner
   * @param {string} ownerId - 'player' or 'shadow'
   * @param {string} color - Hex color for the owner
   */
  claim(ownerId, color) {
    this.ownerId = ownerId;
    this.ownerColor = color;
    this.state = ownerId === 'player' ? DotState.PLAYER_OWNED : DotState.SHADOW_OWNED;
  }

  /**
   * Reset dot to neutral state
   */
  reset() {
    this.state = DotState.NEUTRAL;
    this.ownerId = null;
    this.ownerColor = null;
    this.lastTouchedBy = null;
    this.lastTouchTime = 0;
  }

  /**
   * Check if dot is owned by opponent of given ghostId
   * @param {string} ghostId - 'player' or 'shadow'
   * @returns {boolean}
   */
  isOwnedByOpponent(ghostId) {
    if (this.state === DotState.NEUTRAL) return false;
    return this.ownerId !== ghostId;
  }

  /**
   * Check if dot is neutral (unclaimed)
   * @returns {boolean}
   */
  isNeutral() {
    return this.state === DotState.NEUTRAL;
  }
}

/**
 * Manages all territory dots in the arena
 */
class DotManager {
  constructor(arenaSize, options = {}) {
    this.arenaSize = arenaSize;
    this.dots = new Map(); // id -> Dot
    this.dotCount = options.dotCount || 50;
    this.dotRadius = options.dotRadius || DOT_CONFIG.DOT_RADIUS;
    this.margin = options.margin || 30; // Distance from arena edges
    this.recordAvoidRadius = options.recordAvoidRadius || 90; // Don't spawn near records

    // Track spacebar presses for flip mechanic
    this.recentSpacebarPresses = new Map(); // ghostId -> timestamp

    // Colors for ownership
    this.playerColor = options.playerColor || '#4488ff';
    this.shadowColor = options.shadowColor || '#ff4444';
  }

  /**
   * Set owner colors
   * @param {string} playerColor - Hex color for player
   * @param {string} shadowColor - Hex color for shadow
   */
  setOwnerColors(playerColor, shadowColor) {
    this.playerColor = playerColor;
    this.shadowColor = shadowColor;
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

    console.log(`[DotManager] Initialized ${this.dots.size} territory dots`);
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
   * Register a spacebar press for flip mechanic timing
   * @param {string} ghostId - 'player' or 'shadow'
   */
  registerSpacebarPress(ghostId) {
    this.recentSpacebarPresses.set(ghostId, Date.now());
  }

  /**
   * Check if spacebar was pressed recently (within flip window)
   * @param {string} ghostId - 'player' or 'shadow'
   * @returns {boolean}
   */
  wasSpacebarPressedRecently(ghostId) {
    const pressTime = this.recentSpacebarPresses.get(ghostId);
    if (!pressTime) return false;
    return (Date.now() - pressTime) < DOT_CONFIG.FLIP_WINDOW_MS;
  }

  /**
   * Check dot interaction when ghost moves through arena
   * Returns object describing what happened
   * @param {string} ghostId - 'player' or 'shadow'
   * @param {number} x - Ghost X position
   * @param {number} y - Ghost Y position
   * @param {string} ghostColor - Ghost's color for claiming
   * @param {number} radius - Ghost collision radius
   * @returns {Object|null} - { type: 'claimed'|'flipped'|'damaged', dot: Dot } or null
   */
  checkDotInteraction(ghostId, x, y, ghostColor, radius = DOT_CONFIG.COLLISION_RADIUS) {
    const currentTime = Date.now();

    for (const dot of this.dots.values()) {
      if (!dot.collidesWith(x, y, radius)) continue;

      // Skip if we just touched this dot (debounce)
      if (dot.lastTouchedBy === ghostId && (currentTime - dot.lastTouchTime) < 500) {
        continue;
      }

      if (dot.isNeutral()) {
        // Neutral dot - claim it
        dot.claim(ghostId, ghostColor);
        dot.lastTouchedBy = ghostId;
        dot.lastTouchTime = currentTime;
        return { type: 'claimed', dot };
      }

      if (dot.isOwnedByOpponent(ghostId)) {
        // Opponent's dot - check for flip or damage
        const hadSpacebar = this.wasSpacebarPressedRecently(ghostId);

        dot.lastTouchedBy = ghostId;
        dot.lastTouchTime = currentTime;

        if (hadSpacebar) {
          // Flip the dot to our color
          dot.claim(ghostId, ghostColor);
          return { type: 'flipped', dot };
        } else {
          // Touched without spacebar - damage!
          return { type: 'damaged', dot };
        }
      }

      // Own dot - no action needed
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
   * Get dots owned by a specific ghost
   * @param {string} ownerId - 'player' or 'shadow'
   * @returns {Dot[]}
   */
  getDotsByOwner(ownerId) {
    return Array.from(this.dots.values()).filter(d => d.ownerId === ownerId);
  }

  /**
   * Count dots by owner
   * @param {string} ownerId - 'player' or 'shadow'
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
   * Get total dot count
   * @returns {number}
   */
  getTotalDots() {
    return this.dots.size;
  }

  /**
   * Get ownership percentage for a ghost
   * @param {string} ownerId - 'player' or 'shadow'
   * @returns {number} - Percentage (0-1)
   */
  getOwnershipPercent(ownerId) {
    if (this.dots.size === 0) return 0;
    return this.countDotsByOwner(ownerId) / this.dots.size;
  }

  /**
   * Check if someone has won (90%+ ownership)
   * @returns {string|null} - 'player', 'shadow', or null
   */
  checkWinner() {
    const playerPercent = this.getOwnershipPercent('player');
    const shadowPercent = this.getOwnershipPercent('shadow');

    if (playerPercent >= DOT_CONFIG.WIN_THRESHOLD) {
      return 'player';
    }
    if (shadowPercent >= DOT_CONFIG.WIN_THRESHOLD) {
      return 'shadow';
    }
    return null;
  }

  /**
   * Convert all remaining dots to winner's color (called when winner determined)
   * @param {string} winnerId - 'player' or 'shadow'
   * @param {string} winnerColor - Winner's color
   */
  convertAllToWinner(winnerId, winnerColor) {
    for (const dot of this.dots.values()) {
      if (dot.ownerId !== winnerId) {
        dot.claim(winnerId, winnerColor);
      }
    }
  }

  /**
   * Reset all dots to neutral
   */
  reset() {
    for (const dot of this.dots.values()) {
      dot.reset();
    }
    this.recentSpacebarPresses.clear();
  }

  /**
   * Update dots (for animations)
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    // Update pulse phase for visual effect
    for (const dot of this.dots.values()) {
      dot.pulsePhase += deltaTime * DOT_CONFIG.PULSE_SPEED;
      if (dot.pulsePhase > Math.PI * 2) {
        dot.pulsePhase -= Math.PI * 2;
      }
    }

    // Clean up old spacebar presses
    const now = Date.now();
    for (const [ghostId, pressTime] of this.recentSpacebarPresses.entries()) {
      if (now - pressTime > DOT_CONFIG.FLIP_WINDOW_MS * 2) {
        this.recentSpacebarPresses.delete(ghostId);
      }
    }
  }
}

export {
  Dot,
  DotManager,
  DotState,
  DOT_CONFIG
};
