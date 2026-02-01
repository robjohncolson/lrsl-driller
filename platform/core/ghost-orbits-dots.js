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
  WIN_THRESHOLD: 0.90,        // 90% ownership = win (legacy)
  COLLISION_RADIUS: 15,       // Ghost collision radius with dots
  DOT_RADIUS: 10,             // Visual radius of dots
  PULSE_SPEED: 3,             // Speed of pulsing animation
  // 12-orbits style: dots start stationary, get bumped by ghosts
  DOT_MASS: 1.0,              // Dot mass equal to ghost (ghost = 1.0) for fair billiard physics
  TOUCH_TO_CLAIM: false,      // False = touching enemy dot kills you (need spacebar to claim)
  // Friction/decay for moving dots (underwater billiard feel - slow and floaty)
  FRICTION: 0.995,            // Velocity retention per frame (higher = dots coast longer)
  MIN_SPEED: 0.1,             // Below this speed, dot stops completely
  BUMP_SPEED_SCALE: 0.3,      // Scale factor for bump velocity (slower = more underwater)
  // 12-orbits Arena: win condition
  WIN_SCORE: 10,              // Points needed to win
  WIN_LEAD: 2,                // Must lead by this many points
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

    // 12-orbits style: dots start stationary, get bumped by ghosts
    this.vx = 0;
    this.vy = 0;
    this.mass = DOT_CONFIG.DOT_MASS; // Dot mass (ghost = 1.0)
  }

  /**
   * Update dot position and handle wall bouncing (12-orbits style)
   * Dots start stationary and get bumped by ghosts
   * @param {number} dt - Delta time in seconds
   * @param {number} arenaWidth - Arena width
   * @param {number} arenaHeight - Arena height
   */
  update(dt, arenaWidth, arenaHeight) {
    // Skip if stationary
    if (this.vx === 0 && this.vy === 0) return;

    // Move dot
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Elastic wall bouncing (angle of incidence = angle of reflection)
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = -this.vx;
    } else if (this.x + this.radius > arenaWidth) {
      this.x = arenaWidth - this.radius;
      this.vx = -this.vx;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy;
    } else if (this.y + this.radius > arenaHeight) {
      this.y = arenaHeight - this.radius;
      this.vy = -this.vy;
    }

    // Apply friction
    this.vx *= DOT_CONFIG.FRICTION;
    this.vy *= DOT_CONFIG.FRICTION;

    // Stop if very slow
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed < DOT_CONFIG.MIN_SPEED) {
      this.vx = 0;
      this.vy = 0;
    }
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
   * Update all dots (12-orbits style: moving dots with wall bouncing)
   * @param {number} dt - Delta time in seconds
   * @param {number} arenaWidth - Arena width (defaults to arenaSize)
   * @param {number} arenaHeight - Arena height (defaults to arenaSize)
   */
  update(dt, arenaWidth = this.arenaSize, arenaHeight = this.arenaSize) {
    for (const dot of this.dots.values()) {
      // Move dot and handle wall bouncing
      dot.update(dt, arenaWidth, arenaHeight);

      // Update pulse phase for visual effect
      dot.pulsePhase += dt * DOT_CONFIG.PULSE_SPEED;
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
   * @param {number} flipWindow - Custom flip window in ms (optional, defaults to DOT_CONFIG.FLIP_WINDOW_MS)
   * @returns {boolean}
   */
  wasSpacebarPressedRecently(ghostId, flipWindow = DOT_CONFIG.FLIP_WINDOW_MS) {
    const pressTime = this.recentSpacebarPresses.get(ghostId);
    if (!pressTime) return false;
    return (Date.now() - pressTime) < flipWindow;
  }

  /**
   * Check dot interaction when ghost moves through arena
   * Returns object describing what happened
   * Also applies billiard bump physics to dots on contact
   * @param {string} ghostId - 'player' or 'shadow'
   * @param {number} x - Ghost X position
   * @param {number} y - Ghost Y position
   * @param {string} ghostColor - Ghost's color for claiming
   * @param {Object} options - Optional parameters for NN-influenced gameplay
   * @param {number} options.radius - Ghost collision radius (default: DOT_CONFIG.COLLISION_RADIUS)
   * @param {number} options.claimRadius - Multiplier for claim reach (default: 1.0)
   * @param {number} options.flipWindow - Custom flip timing window in ms (default: DOT_CONFIG.FLIP_WINDOW_MS)
   * @param {number} options.vx - Ghost X velocity (for bump physics)
   * @param {number} options.vy - Ghost Y velocity (for bump physics)
   * @returns {Object|null} - { type: 'claimed'|'flipped'|'damaged', dot: Dot } or null
   */
  checkDotInteraction(ghostId, x, y, ghostColor, options = {}) {
    // Support legacy call signature: checkDotInteraction(ghostId, x, y, ghostColor, radius)
    if (typeof options === 'number') {
      options = { radius: options };
    }

    const radius = (options.radius || DOT_CONFIG.COLLISION_RADIUS) * (options.claimRadius || 1.0);
    const flipWindow = options.flipWindow || DOT_CONFIG.FLIP_WINDOW_MS;
    const currentTime = Date.now();
    const touchToClaim = DOT_CONFIG.TOUCH_TO_CLAIM;
    const ghostVx = options.vx || 0;
    const ghostVy = options.vy || 0;

    for (const dot of this.dots.values()) {
      if (!dot.collidesWith(x, y, radius)) continue;

      // Skip if we just touched this dot (debounce)
      if (dot.lastTouchedBy === ghostId && (currentTime - dot.lastTouchTime) < 500) {
        continue;
      }

      // Skip own dots (handled by checkOwnDotCollision for billiard bounce)
      if (dot.ownerId === ghostId) continue;

      if (dot.isNeutral()) {
        // Neutral dot - claim it and bump it (billiard style)
        dot.claim(ghostId, ghostColor);
        dot.lastTouchedBy = ghostId;
        dot.lastTouchTime = currentTime;

        // Apply bump physics (both ghost and dot exchange momentum)
        const newGhostVel = this._applyBumpPhysics(dot, x, y, ghostVx, ghostVy);

        return { type: 'claimed', dot, ghostVelocity: newGhostVel };
      }

      if (dot.isOwnedByOpponent(ghostId)) {
        dot.lastTouchedBy = ghostId;
        dot.lastTouchTime = currentTime;

        // 12-orbits style: just touch to steal (no spacebar, no damage)
        if (touchToClaim) {
          dot.claim(ghostId, ghostColor);
          const newGhostVel = this._applyBumpPhysics(dot, x, y, ghostVx, ghostVy);
          return { type: 'flipped', dot, ghostVelocity: newGhostVel };
        }

        // Legacy mode: need spacebar to flip, otherwise damage
        const hadSpacebar = this.wasSpacebarPressedRecently(ghostId, flipWindow);
        if (hadSpacebar) {
          // Flip the dot to our color and bump it
          dot.claim(ghostId, ghostColor);
          const newGhostVel = this._applyBumpPhysics(dot, x, y, ghostVx, ghostVy);
          return { type: 'flipped', dot, ghostVelocity: newGhostVel };
        } else {
          // Touched without spacebar - damage!
          return { type: 'damaged', dot };
        }
      }
    }

    return null;
  }

  /**
   * Apply bump physics to a dot from ghost collision (billiard style)
   * Both ghost and dot exchange momentum
   * @private
   * @returns {Object} - { ghostVx, ghostVy } new ghost velocity (in ghost units ~5)
   */
  _applyBumpPhysics(dot, ghostX, ghostY, ghostVx, ghostVy) {
    // Calculate direction from ghost to dot
    const dx = dot.x - ghostX;
    const dy = dot.y - ghostY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return { ghostVx, ghostVy };

    // Normalize collision normal (points from ghost to dot)
    const nx = dx / dist;
    const ny = dy / dist;

    // Ghost velocity in px/s (stored as ~5 units = pixels per frame)
    // Apply bump speed scale for underwater feel
    const speedScale = DOT_CONFIG.BUMP_SPEED_SCALE || 0.3;
    const scaledGhostVx = ghostVx * 60 * speedScale;
    const scaledGhostVy = ghostVy * 60 * speedScale;

    // Relative velocity (ghost - dot, but dot is stationary or slow)
    const relVx = scaledGhostVx - dot.vx;
    const relVy = scaledGhostVy - dot.vy;
    const relVelNormal = relVx * nx + relVy * ny;

    // Only bump if moving toward each other
    if (relVelNormal <= 0) return { ghostVx, ghostVy };

    // Mass-based elastic collision (equal mass = velocity swap along normal)
    const ghostMass = 1.0;
    const dotMass = dot.mass || DOT_CONFIG.DOT_MASS;
    const totalMass = ghostMass + dotMass;
    const ghostCoeff = (2 * dotMass) / totalMass;
    const dotCoeff = (2 * ghostMass) / totalMass;

    // New velocities
    const newGhostVx = scaledGhostVx - ghostCoeff * relVelNormal * nx;
    const newGhostVy = scaledGhostVy - ghostCoeff * relVelNormal * ny;
    const newDotVx = dot.vx + dotCoeff * relVelNormal * nx;
    const newDotVy = dot.vy + dotCoeff * relVelNormal * ny;

    // Apply to dot
    dot.vx = newDotVx;
    dot.vy = newDotVy;

    // Return ghost velocity (scaled back to ghost units)
    return {
      ghostVx: newGhostVx / 60,
      ghostVy: newGhostVy / 60
    };
  }

  /**
   * Check for collision with own dots and apply billiard physics
   * Both ghost and dot bounce off each other (mass-based elastic collision)
   * Ghost mass = 1.0, Dot mass = DOT_CONFIG.DOT_MASS (0.5)
   * @param {string} ghostId - 'player' or 'shadow'
   * @param {number} x - Ghost X position
   * @param {number} y - Ghost Y position
   * @param {number} vx - Ghost X velocity (small units ~5)
   * @param {number} vy - Ghost Y velocity (small units ~5)
   * @param {number} ghostRadius - Ghost collision radius
   * @returns {Object|null} - { dot, ghostVelocity: {x, y} } if collision occurred
   */
  checkOwnDotCollision(ghostId, x, y, vx, vy, ghostRadius = DOT_CONFIG.COLLISION_RADIUS) {
    const ghostMass = 1.0;

    for (const dot of this.dots.values()) {
      // Only check OWN dots
      if (dot.ownerId !== ghostId) continue;

      if (!dot.collidesWith(x, y, ghostRadius)) continue;

      // Calculate collision normal (from dot center to ghost center)
      const dx = x - dot.x;
      const dy = y - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) continue; // Exactly overlapping, skip

      // Normalize collision normal
      const nx = dx / dist;
      const ny = dy / dist;

      // Ghost velocity is stored in small units (~5), scale up for physics
      // Apply bump speed scale for underwater feel
      const speedScale = DOT_CONFIG.BUMP_SPEED_SCALE || 0.3;
      const scaledVx = vx * 60 * speedScale;
      const scaledVy = vy * 60 * speedScale;

      // Relative velocity of ghost with respect to dot (dot velocity already in px/s)
      const relVx = scaledVx - dot.vx;
      const relVy = scaledVy - dot.vy;

      // Relative velocity along collision normal
      const relVelNormal = relVx * nx + relVy * ny;

      // Only collide if moving toward each other
      if (relVelNormal > 0) continue;

      // Mass-based elastic collision
      // v1' = v1 - (2*m2/(m1+m2)) * relVelNormal * n
      // v2' = v2 + (2*m1/(m1+m2)) * relVelNormal * n
      const dotMass = dot.mass || DOT_CONFIG.DOT_MASS;
      const totalMass = ghostMass + dotMass;
      const ghostCoeff = (2 * dotMass) / totalMass;  // How much ghost velocity changes
      const dotCoeff = (2 * ghostMass) / totalMass;  // How much dot velocity changes

      // Calculate new velocities (dot in px/s, ghost scaled back to small units)
      const newGhostVx = (scaledVx - ghostCoeff * relVelNormal * nx) / 60;
      const newGhostVy = (scaledVy - ghostCoeff * relVelNormal * ny) / 60;
      const newDotVx = dot.vx + dotCoeff * relVelNormal * nx;
      const newDotVy = dot.vy + dotCoeff * relVelNormal * ny;

      // Apply new velocities to dot
      dot.vx = newDotVx;
      dot.vy = newDotVy;

      // Separate the objects to prevent sticking
      const overlap = (ghostRadius + dot.radius) - dist;
      if (overlap > 0) {
        // Push apart along normal (dot moves more since it's lighter)
        const dotPushRatio = ghostMass / totalMass;
        dot.x -= nx * overlap * dotPushRatio;
        dot.y -= ny * overlap * dotPushRatio;
      }

      return {
        dot,
        ghostVelocity: { x: newGhostVx, y: newGhostVy },
        separation: { x: nx * overlap * (dotMass / totalMass), y: ny * overlap * (dotMass / totalMass) }
      };
    }

    return null;
  }

  /**
   * Get neutral dots for magnetism calculation
   * @returns {Dot[]}
   */
  getNeutralDots() {
    return this.getDotsByState(DotState.NEUTRAL);
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

}

export {
  Dot,
  DotManager,
  DotState,
  DOT_CONFIG
};
