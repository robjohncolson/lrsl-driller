/**
 * Ghost Orbits - Blizzard Mode (12-Orbits Style)
 *
 * Team-based dot territory game. Players claim and smash dots toward
 * enemy goals. Dots crossing a goal score for the attacking team.
 *
 * Key mechanics (from 12-orbits "Blizzard" game):
 * - Touch to claim: Collision instantly claims dot and smashes it away
 * - Billiard physics: Dot flies AWAY from player center on collision
 * - Dash = Power hit: 1.5x velocity boost (no invulnerability)
 * - Goal-based scoring: Dot crossing enemy goal = 1 point
 *
 * Win conditions:
 * - Score Limit: First team to 15 points
 * - Timeout: Most points after 1 minute
 * - Mercy Rule: 10-point lead = instant win
 *
 * @module blizzard-mode
 * @version 2.0.0
 */

import { OrbitsMode } from '../core/orbits-mode-interface.js';
import { BlizzardAI } from './blizzard-ai.js';
import { WIDE_MAP, getAbsoluteRecordPositions, getAbsoluteBarriers } from './orbits-maps.js';

// ============================================
// CONFIGURATION
// ============================================

export const BLIZZARD_CONFIG = {
  // Teams
  TEAM_COUNT: 2,

  // Dots (replacing spheres)
  DOT_RADIUS: 10,
  DOT_BASE_SPEED: 300,        // px/s when smashed
  DOT_DRIFT_SPEED: 20,        // px/s initial drift
  DOT_FRICTION: 0.998,        // Very low friction
  TOUCH_RADIUS: 25,           // Collision radius

  // Dash (power hit, NOT invulnerability)
  DASH_DURATION: 400,         // ms (spin animation)
  DASH_POWER_MULTIPLIER: 1.5, // 1.5x velocity on smash

  // Spawner
  INITIAL_DOTS: 8,
  MAX_DOTS: 15,
  SPAWN_INTERVAL: 2500,       // ms

  // Win conditions
  SCORE_LIMIT: 15,
  ROUND_DURATION_MS: 60000,   // 1 minute rounds
  MERCY_LEAD: 10
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique ID
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

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
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ============================================
// BLIZZARD DOT CLASS
// ============================================

/**
 * A dot that can be claimed and smashed toward goals
 * Simpler than BlizzardSphere - uses billiard physics
 */
class BlizzardDot {
  /**
   * Create a new BlizzardDot
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {number} driftSpeed - Initial drift velocity
   */
  constructor(x, y, driftSpeed) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.radius = BLIZZARD_CONFIG.DOT_RADIUS;

    // Random drift direction
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * driftSpeed;
    this.vy = Math.sin(angle) * driftSpeed;

    this.teamId = null;  // null = neutral (white)
    this.lastTouchedBy = null;
  }

  /**
   * Update dot position with physics
   * @param {number} dt - Delta time in seconds
   * @param {number} arenaWidth - Arena width
   * @param {number} arenaHeight - Arena height
   */
  update(dt, arenaWidth, arenaHeight) {
    // Apply very low friction
    this.vx *= BLIZZARD_CONFIG.DOT_FRICTION;
    this.vy *= BLIZZARD_CONFIG.DOT_FRICTION;

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Top/bottom wall bounce
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
    }
    if (this.y > arenaHeight - this.radius) {
      this.y = arenaHeight - this.radius;
      this.vy = -Math.abs(this.vy);
    }
    // Left/right = scoring zones (no bounce, handled by goal check)
  }

  /**
   * Serialize for network/rendering
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
      vx: this.vx,
      vy: this.vy,
      teamId: this.teamId,
      lastTouchedBy: this.lastTouchedBy
    };
  }
}

// ============================================
// BLIZZARD MODE CLASS
// ============================================

/**
 * Blizzard Mode - 12-Orbits Style Dot Territory
 * @extends OrbitsMode
 */
export class BlizzardMode extends OrbitsMode {
  /**
   * Create Blizzard mode instance
   * @param {Object} config - Mode configuration
   * @param {number} config.arenaWidth - Arena width in pixels
   * @param {number} config.arenaHeight - Arena height in pixels
   * @param {Object} config.ghostProperties - Player's NN-derived properties
   * @param {string} config.cartridgeId - Cartridge ID for localStorage
   * @param {string} config.username - Player's username
   * @param {Object} [config.physicsEngine] - Physics engine reference
   */
  constructor(config) {
    super(config);

    // Arena configuration (use WIDE_MAP defaults if not provided)
    this.arenaWidth = config.arenaWidth || WIDE_MAP.arenaWidth;
    this.arenaHeight = config.arenaHeight || WIDE_MAP.arenaHeight;
    this.ghostProperties = config.ghostProperties || {};
    this.cartridgeId = config.cartridgeId || 'default';
    this.username = config.username || 'player';
    this.physicsEngine = config.physicsEngine || null;

    // Team assignments: playerId -> teamId (0 or 1)
    this.teams = new Map();
    this.teamScores = [0, 0];

    // Team colors
    this.teamColors = [
      config.ghostProperties?.color || '#4488ff',  // Team 0 (player's team)
      this._getComplementaryColor(config.ghostProperties?.color || '#4488ff')  // Team 1
    ];

    // Entities (dots replace spheres)
    this.dots = [];
    this.barriers = [];

    // Spawn system
    this.lastDotSpawn = 0;

    // Dash state (for power hit detection)
    this.playerDashUntil = 0;
    this.shadowDashUntil = 0;

    // Match timing
    this.matchStartTime = null;
    this.matchTimeRemaining = BLIZZARD_CONFIG.ROUND_DURATION_MS;

    // Match result
    this.matchResult = null;
    this.winCondition = null;

    // Shadow AI (for solo mode)
    this.shadowAI = null;
    this.shadowGhostId = 'shadow_self';
    this.shadowMovementState = 'FREE_FLIGHT';

    // Player assignment
    this.playerTeamId = 0;  // Local player is always team 0
  }

  /**
   * Initialize the blizzard mode
   * @param {Object} [config] - Additional configuration
   * @returns {Promise<void>}
   */
  async init(config = {}) {
    if (config.arenaWidth) this.arenaWidth = config.arenaWidth;
    if (config.arenaHeight) this.arenaHeight = config.arenaHeight;
    if (config.physicsEngine) this.physicsEngine = config.physicsEngine;

    // Setup barriers
    this._initializeBarriers();

    // Setup records for physics engine
    this._initializeRecords();

    // Assign teams (solo mode: player = team 0, shadow = team 1)
    this.teams.set('player', 0);
    this.teams.set(this.shadowGhostId, 1);

    // Initialize Shadow AI
    this.shadowAI = new BlizzardAI({
      arenaWidth: this.arenaWidth,
      arenaHeight: this.arenaHeight,
      teamId: 1,
      ghostId: this.shadowGhostId
    });

    // Reset match state
    this.matchStartTime = performance.now();
    this.matchTimeRemaining = BLIZZARD_CONFIG.ROUND_DURATION_MS;
    this.teamScores = [0, 0];
    this.lastDotSpawn = performance.now();
    this.matchResult = null;
    this.winCondition = null;

    // Spawn initial dots
    this._spawnInitialDots();

    this.initialized = true;
    console.log(`[BlizzardMode] Initialized with ${this.dots.length} dots, arena ${this.arenaWidth}x${this.arenaHeight}`);
  }

  /**
   * Initialize barriers at left and right (vertical barriers - pong/air hockey style)
   * @private
   */
  _initializeBarriers() {
    this.barriers = [
      {
        id: 'barrier_0',
        x: 0,
        teamId: 0,
        height: this.arenaHeight,
        orientation: 'vertical'
      },
      {
        id: 'barrier_1',
        x: this.arenaWidth,
        teamId: 1,
        height: this.arenaHeight,
        orientation: 'vertical'
      }
    ];
  }

  /**
   * Initialize records from WIDE_MAP
   * @private
   */
  _initializeRecords() {
    if (!this.physicsEngine) return;

    const recordPositions = getAbsoluteRecordPositions({
      ...WIDE_MAP,
      arenaWidth: this.arenaWidth,
      arenaHeight: this.arenaHeight
    });

    for (const record of recordPositions) {
      this.physicsEngine.addRecord(record);
    }

    console.log(`[BlizzardMode] Added ${recordPositions.length} records to arena`);
  }

  /**
   * Spawn initial dots from center emitter
   * @private
   */
  _spawnInitialDots() {
    const emitterConfig = WIDE_MAP.dotEmitter;
    const count = emitterConfig.initialDots;

    for (let i = 0; i < count; i++) {
      this._spawnDotAtCenter();
    }
  }

  /**
   * Spawn a dot at center with random drift
   * @private
   * @returns {BlizzardDot}
   */
  _spawnDotAtCenter() {
    const emitterConfig = WIDE_MAP.dotEmitter;
    const x = this.arenaWidth * emitterConfig.x;
    // Spawn in vertical range with some margin
    const y = this.arenaHeight * 0.1 + Math.random() * this.arenaHeight * 0.8;

    const dot = new BlizzardDot(x, y, emitterConfig.driftSpeed);
    this.dots.push(dot);
    return dot;
  }

  /**
   * Per-frame update
   * @param {number} dt - Delta time in seconds
   * @param {number} time - Current timestamp in ms
   * @param {Object} localGhost - Player ghost object
   * @param {Object} input - Input state
   */
  step(dt, time, localGhost, input) {
    if (!this.initialized || this.matchResult !== null) return;

    const currentTime = time || performance.now();

    // Update match time
    if (this.matchStartTime) {
      const elapsed = currentTime - this.matchStartTime;
      this.matchTimeRemaining = BLIZZARD_CONFIG.ROUND_DURATION_MS - elapsed;
    }

    // Check dot spawner
    this._checkDotSpawner(currentTime);

    // Update all dots
    this._updateDots(dt);

    // Check player collision with dots
    this._checkPlayerDotCollisions(localGhost, input, currentTime);

    // Check shadow collision with dots
    if (input.shadowGhost) {
      this._checkShadowDotCollisions(input.shadowGhost, input, currentTime);
    }

    // Check goal collisions (scoring)
    this._checkGoalCollisions();

    // Update Shadow AI
    if (this.shadowAI && input.shadowGhost) {
      const gameState = this._buildAIGameState(localGhost, input.shadowGhost, currentTime);
      const aiDecision = this.shadowAI.update(dt, gameState);
      input.aiDecision = aiDecision;
    }
  }

  /**
   * Check if it's time to spawn more dots
   * @private
   */
  _checkDotSpawner(currentTime) {
    const emitterConfig = WIDE_MAP.dotEmitter;

    if (this.dots.length < emitterConfig.maxDots &&
        currentTime - this.lastDotSpawn > emitterConfig.spawnInterval) {
      this._spawnDotAtCenter();
      this.lastDotSpawn = currentTime;
    }
  }

  /**
   * Update all dot positions
   * @private
   */
  _updateDots(dt) {
    for (const dot of this.dots) {
      dot.update(dt, this.arenaWidth, this.arenaHeight);
    }
  }

  /**
   * Check player collision with dots - smash mechanics
   * @private
   */
  _checkPlayerDotCollisions(localGhost, input, currentTime) {
    if (!localGhost) return;

    const playerTeamId = this.teams.get('player');
    const playerOnRecord = input.ghostMovementState === 'ORBITING';

    // Don't interact while orbiting
    if (playerOnRecord) return;

    const ghostX = localGhost.position.x;
    const ghostY = localGhost.position.y;
    const isDashing = currentTime < this.playerDashUntil;

    for (const dot of this.dots) {
      const dist = distance(ghostX, ghostY, dot.x, dot.y);

      if (dist < BLIZZARD_CONFIG.TOUCH_RADIUS + dot.radius) {
        this._handleDotCollision(dot, 'player', playerTeamId, ghostX, ghostY, isDashing);
        input.dotInteraction = { type: 'smashed', dotId: dot.id };
        break; // Only interact with one dot per frame
      }
    }
  }

  /**
   * Check shadow collision with dots - smash mechanics
   * @private
   */
  _checkShadowDotCollisions(shadowGhost, input, currentTime) {
    const shadowTeamId = this.teams.get(this.shadowGhostId);
    const shadowOnRecord = input.shadowMovementState === 'ORBITING';

    if (shadowOnRecord) return;

    const ghostX = shadowGhost.position.x;
    const ghostY = shadowGhost.position.y;
    const isDashing = currentTime < this.shadowDashUntil;

    for (const dot of this.dots) {
      const dist = distance(ghostX, ghostY, dot.x, dot.y);

      if (dist < BLIZZARD_CONFIG.TOUCH_RADIUS + dot.radius) {
        this._handleDotCollision(dot, this.shadowGhostId, shadowTeamId, ghostX, ghostY, isDashing);
        break;
      }
    }
  }

  /**
   * Handle dot collision - billiard-style smash physics
   * Dot flies AWAY from player center, boosted if dashing
   * @private
   */
  _handleDotCollision(dot, playerId, teamId, ghostX, ghostY, isDashing) {
    // 1. Take ownership
    dot.teamId = teamId;
    dot.lastTouchedBy = playerId;

    // 2. Calculate direction (ball flies AWAY from player center)
    const dx = dot.x - ghostX;
    const dy = dot.y - ghostY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    // 3. Apply smash velocity (boosted if dashing)
    const speed = BLIZZARD_CONFIG.DOT_BASE_SPEED *
      (isDashing ? BLIZZARD_CONFIG.DASH_POWER_MULTIPLIER : 1.0);

    dot.vx = dirX * speed;
    dot.vy = dirY * speed;

    console.log(`[BlizzardMode] Dot ${dot.id} smashed by ${playerId} (team ${teamId})${isDashing ? ' with POWER HIT!' : ''}`);
  }

  /**
   * Check dot collisions with goals (scoring)
   *
   * Scoring rules:
   * - Left edge = Team 0's goal, Right edge = Team 1's goal
   * - Team's dot crossing enemy goal = 1 point
   * - Neutral dots crossing edges = despawn (no score)
   *
   * @private
   */
  _checkGoalCollisions() {
    const dotsToRemove = [];

    for (const dot of this.dots) {
      // Left goal (Team 0's goal) - Team 1 scores
      if (dot.x - dot.radius <= 0) {
        if (dot.teamId === 1) {
          this.teamScores[1]++;
          console.log(`[BlizzardMode] Team 1 scores! (${this.teamScores[0]}-${this.teamScores[1]})`);
        }
        // Neutral dots just despawn (no score)
        dotsToRemove.push(dot.id);
      }
      // Right goal (Team 1's goal) - Team 0 scores
      else if (dot.x + dot.radius >= this.arenaWidth) {
        if (dot.teamId === 0) {
          this.teamScores[0]++;
          console.log(`[BlizzardMode] Team 0 scores! (${this.teamScores[0]}-${this.teamScores[1]})`);
        }
        dotsToRemove.push(dot.id);
      }
    }

    this.dots = this.dots.filter(d => !dotsToRemove.includes(d.id));
  }

  /**
   * Set player dash state (for power hit detection)
   * @param {number} dashUntil - Timestamp when dash ends
   */
  setPlayerDashing(dashUntil) {
    this.playerDashUntil = dashUntil;
  }

  /**
   * Set shadow dash state (for power hit detection)
   * @param {number} dashUntil - Timestamp when dash ends
   */
  setShadowDashing(dashUntil) {
    this.shadowDashUntil = dashUntil;
  }

  /**
   * Handle player input
   * @param {string} type - Input type ('spacebar', 'orbit_exit')
   * @param {Object} data - Input data
   * @param {Object} ghost - Ghost that triggered input
   * @returns {Object|null}
   */
  applyInput(type, data, ghost) {
    // Blizzard mode doesn't use spacebar timing mechanics for flips
    // Dot interaction is automatic on touch
    // Spacebar is used for dash (power hit) in controller
    return null;
  }

  /**
   * Get current scoreboard
   * @returns {Object}
   */
  getScoreboard() {
    return {
      playerScore: this.teamScores[0],
      opponentScore: this.teamScores[1],
      playerLives: Infinity,  // No elimination in Blizzard
      opponentLives: Infinity,
      timeRemaining: Math.max(0, this.matchTimeRemaining),
      team0Score: this.teamScores[0],
      team1Score: this.teamScores[1],
      dotCount: this.dots.length
    };
  }

  /**
   * Check if match has ended
   * @returns {Object}
   */
  checkEndCondition() {
    if (this.matchResult !== null) {
      return {
        ended: true,
        winner: this.matchResult === 'player_win' ? 'player' : 'opponent',
        reason: this.winCondition
      };
    }

    // Check score limit
    if (this.teamScores[0] >= BLIZZARD_CONFIG.SCORE_LIMIT) {
      this.matchResult = 'player_win';
      this.winCondition = 'score_limit';
      return {
        ended: true,
        winner: 'player',
        reason: 'score_limit'
      };
    }

    if (this.teamScores[1] >= BLIZZARD_CONFIG.SCORE_LIMIT) {
      this.matchResult = 'shadow_win';
      this.winCondition = 'score_limit';
      return {
        ended: true,
        winner: 'opponent',
        reason: 'score_limit'
      };
    }

    // Check mercy rule
    const lead = Math.abs(this.teamScores[0] - this.teamScores[1]);
    if (lead >= BLIZZARD_CONFIG.MERCY_LEAD) {
      this.matchResult = this.teamScores[0] > this.teamScores[1] ? 'player_win' : 'shadow_win';
      this.winCondition = 'mercy';
      return {
        ended: true,
        winner: this.matchResult === 'player_win' ? 'player' : 'opponent',
        reason: 'mercy'
      };
    }

    // Check timeout
    if (this.matchTimeRemaining <= 0) {
      if (this.teamScores[0] > this.teamScores[1]) {
        this.matchResult = 'player_win';
      } else if (this.teamScores[1] > this.teamScores[0]) {
        this.matchResult = 'shadow_win';
      } else {
        // Tie goes to player
        this.matchResult = 'player_win';
      }
      this.winCondition = 'timeout';

      return {
        ended: true,
        winner: this.matchResult === 'player_win' ? 'player' : 'opponent',
        reason: 'timeout'
      };
    }

    return { ended: false };
  }

  /**
   * Get render data
   * @returns {Object}
   */
  getRenderData() {
    return {
      // Blizzard dots for renderer
      blizzardDots: this.dots.map(d => ({
        ...d.toJSON(),
        teamColor: d.teamId !== null ? this.teamColors[d.teamId] : null
      })),
      barriers: this.barriers.map(b => ({
        ...b,
        teamColor: this.teamColors[b.teamId]
      })),
      teamScores: [...this.teamScores],
      teamColors: [...this.teamColors],
      records: this.physicsEngine?.getRecords() || []
    };
  }

  /**
   * Get entity by type
   * @param {string} type - Entity type
   * @param {string} [id] - Entity ID
   * @returns {Object|Array|null}
   */
  getEntityByType(type, id) {
    switch (type) {
      case 'dot':
        if (id) {
          return this.dots.find(d => d.id === id) || null;
        }
        return this.dots;

      case 'barrier':
        if (id) {
          return this.barriers.find(b => b.id === id) || null;
        }
        return this.barriers;

      case 'record':
        if (id) {
          return this.physicsEngine?.getRecords().find(r => r.id === id) || null;
        }
        return this.physicsEngine?.getRecords() || [];

      case 'shadow':
        return { id: this.shadowGhostId };

      default:
        return null;
    }
  }

  /**
   * Handle damage (NO-OP in Blizzard mode - no elimination)
   * @returns {Object}
   */
  handleDamage(target, source, type) {
    // Blizzard mode has no elimination - players cannot be damaged
    return { blocked: true, livesRemaining: Infinity };
  }

  /**
   * Serialize state for sync
   * @returns {Object}
   */
  serializeState() {
    return {
      type: 'BlizzardMode',
      teamScores: [...this.teamScores],
      matchTimeRemaining: this.matchTimeRemaining,
      dots: this.dots.map(d => d.toJSON()),
      barriers: this.barriers,
      matchResult: this.matchResult,
      winCondition: this.winCondition
    };
  }

  /**
   * Get initial entities
   * @returns {Object}
   */
  getInitialEntities() {
    return {
      dots: this.dots.map(d => d.toJSON()),
      barriers: this.barriers,
      records: this.physicsEngine?.getRecords() || [],
      ghosts: []
    };
  }

  /**
   * Reset for rematch
   */
  reset() {
    console.log('[BlizzardMode] Resetting for rematch');

    // Reset scores
    this.teamScores = [0, 0];

    // Reset timing
    this.matchStartTime = performance.now();
    this.matchTimeRemaining = BLIZZARD_CONFIG.ROUND_DURATION_MS;
    this.matchResult = null;
    this.winCondition = null;

    // Reset spawn timer
    this.lastDotSpawn = performance.now();

    // Reset dash states
    this.playerDashUntil = 0;
    this.shadowDashUntil = 0;

    // Clear and respawn dots
    this.dots = [];
    this._spawnInitialDots();

    // Reset AI
    if (this.shadowAI) {
      this.shadowAI.reset();
    }

    this.shadowMovementState = 'FREE_FLIGHT';
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.dots = [];
    this.barriers = [];
    this.teams.clear();
    this.shadowAI = null;
    super.dispose();
  }

  // ============================================
  // ACCESSORS FOR CONTROLLER COMPATIBILITY
  // ============================================

  /**
   * Get Shadow AI instance
   * @returns {BlizzardAI|null}
   */
  getShadowAI() {
    return this.shadowAI;
  }

  /**
   * Get match result
   * @returns {string|null}
   */
  getMatchResult() {
    return this.matchResult;
  }

  /**
   * Get win condition
   * @returns {string|null}
   */
  getWinCondition() {
    return this.winCondition;
  }

  /**
   * Set match result
   * @param {string} result
   * @param {string} condition
   */
  setMatchResult(result, condition) {
    this.matchResult = result;
    this.winCondition = condition;
  }

  /**
   * Get round duration config
   * @returns {number}
   */
  getRoundDuration() {
    return BLIZZARD_CONFIG.ROUND_DURATION_MS;
  }

  /**
   * Get player lives (always Infinity in Blizzard)
   * @returns {number}
   */
  getPlayerLives() {
    return Infinity;
  }

  /**
   * Get shadow lives (always Infinity in Blizzard)
   * @returns {number}
   */
  getShadowLives() {
    return Infinity;
  }

  /**
   * Get team scores
   * @returns {Array<number>}
   */
  getTeamScores() {
    return [...this.teamScores];
  }

  /**
   * Get team ID for a player
   * @param {string} playerId
   * @returns {number|null}
   */
  getTeamId(playerId) {
    return this.teams.get(playerId) ?? null;
  }

  /**
   * Get arena dimensions
   * @returns {{width: number, height: number}}
   */
  getArenaDimensions() {
    return {
      width: this.arenaWidth,
      height: this.arenaHeight
    };
  }

  /**
   * Get dots array (for AI and renderer)
   * @returns {Array}
   */
  getDots() {
    return this.dots;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Get complementary color
   * @param {string} hexColor - Hex color
   * @returns {string}
   * @private
   */
  _getComplementaryColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;

    let h, s;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
      }
    }

    h = (h + 0.5) % 1;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let rOut, gOut, bOut;
    if (s === 0) {
      rOut = gOut = bOut = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      rOut = hue2rgb(p, q, h + 1/3);
      gOut = hue2rgb(p, q, h);
      bOut = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`;
  }

  /**
   * Build game state for AI
   * @private
   */
  _buildAIGameState(localGhost, shadowGhost, currentTime) {
    return {
      selfX: shadowGhost.position.x,
      selfY: shadowGhost.position.y,
      selfVx: shadowGhost.velocity.x,
      selfVy: shadowGhost.velocity.y,
      selfIsOrbiting: this.shadowMovementState === 'ORBITING',
      selfTeamId: 1,
      playerX: localGhost.position.x,
      playerY: localGhost.position.y,
      playerVx: localGhost.velocity.x,
      playerVy: localGhost.velocity.y,
      playerTeamId: 0,
      dots: this.dots.map(d => d.toJSON()),
      barriers: this.barriers,
      records: this.physicsEngine?.getRecords() || [],
      arenaWidth: this.arenaWidth,
      arenaHeight: this.arenaHeight,
      teamScores: [...this.teamScores],
      currentTime
    };
  }
}

export default BlizzardMode;
