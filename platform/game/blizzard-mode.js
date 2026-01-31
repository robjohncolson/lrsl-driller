/**
 * Ghost Orbits - Blizzard Mode
 *
 * Team-based, no-elimination arena defense game. Two teams defend barriers
 * (goal lines) while returning drifting spheres toward the enemy.
 * Spheres crossing a barrier score for the opposing team.
 *
 * Key differentiator: Players cannot be eliminated - pure score-based
 * gameplay that's lag-tolerant and beginner-friendly.
 *
 * Win conditions:
 * - Score Limit: First team to 15 points
 * - Timeout: Most points after 5 minutes
 * - Mercy Rule: 10-point lead = instant win
 *
 * @module blizzard-mode
 * @version 1.0.0
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
  MAX_PER_TEAM: 6,

  // Barriers (relative y positions)
  BARRIER_Y_TOP: 0.05,
  BARRIER_Y_BOTTOM: 0.95,

  // Spheres
  SPHERE_RADIUS: 15,
  SPHERE_BASE_SPEED: 80,        // px/s
  SPHERE_MAX_SPEED: 200,        // px/s
  RETURN_SPEED_BOOST: 1.1,      // 10% per return
  TOUCH_RADIUS: 30,             // Collision radius for player touch

  // Spawn waves
  WAVE_1_DURATION: 30000,       // First 30 seconds
  WAVE_2_DURATION: 60000,       // First 60 seconds (includes wave 1)
  WAVE_1: { count: 3, delay: 3000, speed: 80 },
  WAVE_2: { count: 5, delay: 2000, speed: 120 },
  WAVE_3: { count: 8, delay: 1000, speed: 160 },

  // Win conditions
  SCORE_LIMIT: 15,
  ROUND_DURATION_MS: 300000,    // 5 minutes
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
// BLIZZARD SPHERE CLASS
// ============================================

/**
 * A drifting sphere that players return toward enemies
 */
class BlizzardSphere {
  /**
   * Create a new BlizzardSphere
   * @param {Object} options
   * @param {number} options.x - Initial x position
   * @param {number} options.y - Initial y position
   * @param {number} options.velocityX - Initial x velocity
   * @param {number} options.velocityY - Initial y velocity
   * @param {number} options.speed - Base speed
   */
  constructor(options) {
    this.id = generateId();
    this.x = options.x;
    this.y = options.y;
    this.radius = BLIZZARD_CONFIG.SPHERE_RADIUS;
    this.velocityX = options.velocityX || 0;
    this.velocityY = options.velocityY || 0;
    this.speed = options.speed || BLIZZARD_CONFIG.SPHERE_BASE_SPEED;

    // Ownership
    this.teamId = null;           // null = neutral
    this.lastTouchedBy = null;    // playerId who last touched
    this.returnCount = 0;         // Times returned (affects speed)

    // Animation
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  /**
   * Update sphere position
   * @param {number} dt - Delta time in seconds
   * @param {number} arenaWidth - Arena width
   * @param {number} arenaHeight - Arena height
   */
  update(dt, arenaWidth, arenaHeight) {
    // Move sphere
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Update animation
    this.pulsePhase += dt * 3;

    // Side wall bounce
    if (this.x < this.radius) {
      this.x = this.radius;
      this.velocityX = Math.abs(this.velocityX);
    }
    if (this.x > arenaWidth - this.radius) {
      this.x = arenaWidth - this.radius;
      this.velocityX = -Math.abs(this.velocityX);
    }
  }

  /**
   * Return the sphere toward a target y direction
   * @param {string} playerId - Player who returned it
   * @param {number} targetTeamId - Team ID of the target barrier (0=top, 1=bottom)
   * @param {number} [newTeamId] - New team ownership (null for neutral)
   */
  return(playerId, targetTeamId, newTeamId = null) {
    this.lastTouchedBy = playerId;
    this.teamId = newTeamId;
    this.returnCount++;

    // Calculate new velocity toward target barrier
    const targetY = targetTeamId === 0 ? 0 : Infinity; // 0 = top barrier, 1 = bottom barrier
    const dirY = targetTeamId === 0 ? -1 : 1;

    // Add some horizontal variance based on touch position
    const horizontalVariance = (Math.random() - 0.5) * 0.3;

    // Calculate boosted speed
    const boostedSpeed = Math.min(
      this.speed * Math.pow(BLIZZARD_CONFIG.RETURN_SPEED_BOOST, this.returnCount),
      BLIZZARD_CONFIG.SPHERE_MAX_SPEED
    );

    // Normalize and apply velocity
    const len = Math.sqrt(horizontalVariance * horizontalVariance + 1);
    this.velocityX = (horizontalVariance / len) * boostedSpeed;
    this.velocityY = (dirY / len) * boostedSpeed;
    this.speed = boostedSpeed;
  }

  /**
   * Flip sphere to new team ownership
   * @param {string} playerId - Player who flipped it
   * @param {number} newTeamId - New team ID
   */
  flip(playerId, newTeamId) {
    this.lastTouchedBy = playerId;
    this.teamId = newTeamId;

    // Reverse y direction
    this.velocityY = -this.velocityY;
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
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      speed: this.speed,
      teamId: this.teamId,
      lastTouchedBy: this.lastTouchedBy,
      returnCount: this.returnCount,
      pulsePhase: this.pulsePhase
    };
  }
}

// ============================================
// BLIZZARD MODE CLASS
// ============================================

/**
 * Blizzard Mode - Team-based sphere defense
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

    // Entities
    this.spheres = [];
    this.barriers = [];

    // Spawn system
    this.currentWave = 1;
    this.lastSpawnTime = 0;
    this.spheresSpawnedThisWave = 0;

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
    this.matchStartTime = Date.now();
    this.matchTimeRemaining = BLIZZARD_CONFIG.ROUND_DURATION_MS;
    this.teamScores = [0, 0];
    this.currentWave = 1;
    this.lastSpawnTime = Date.now();
    this.spheresSpawnedThisWave = 0;
    this.matchResult = null;
    this.winCondition = null;

    // Spawn initial spheres
    this._spawnInitialSpheres();

    this.initialized = true;
    console.log(`[BlizzardMode] Initialized with ${this.spheres.length} spheres, arena ${this.arenaWidth}x${this.arenaHeight}`);
  }

  /**
   * Initialize barriers at top and bottom
   * @private
   */
  _initializeBarriers() {
    this.barriers = [
      {
        id: 'barrier_0',
        y: this.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_TOP,
        teamId: 0,
        width: this.arenaWidth
      },
      {
        id: 'barrier_1',
        y: this.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_BOTTOM,
        teamId: 1,
        width: this.arenaWidth
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
   * Spawn initial spheres in center zone
   * @private
   */
  _spawnInitialSpheres() {
    const waveConfig = this._getWaveConfig();

    for (let i = 0; i < waveConfig.count; i++) {
      this._spawnSphere(waveConfig.speed);
    }
    this.spheresSpawnedThisWave = waveConfig.count;
  }

  /**
   * Get current wave configuration
   * @private
   * @returns {Object} Wave config with count, delay, speed
   */
  _getWaveConfig() {
    switch (this.currentWave) {
      case 1: return BLIZZARD_CONFIG.WAVE_1;
      case 2: return BLIZZARD_CONFIG.WAVE_2;
      default: return BLIZZARD_CONFIG.WAVE_3;
    }
  }

  /**
   * Spawn a new sphere in the center zone
   * @private
   * @param {number} speed - Initial speed
   * @returns {BlizzardSphere}
   */
  _spawnSphere(speed) {
    const spawnZone = WIDE_MAP.sphereSpawnZone;
    const x = this.arenaWidth * 0.1 + Math.random() * this.arenaWidth * 0.8;
    const y = this.arenaHeight * spawnZone.minY +
              Math.random() * this.arenaHeight * (spawnZone.maxY - spawnZone.minY);

    // Random initial direction (mostly vertical)
    const dirY = Math.random() > 0.5 ? 1 : -1;
    const dirX = (Math.random() - 0.5) * 0.4;
    const len = Math.sqrt(dirX * dirX + dirY * dirY);

    const sphere = new BlizzardSphere({
      x,
      y,
      velocityX: (dirX / len) * speed,
      velocityY: (dirY / len) * speed,
      speed
    });

    this.spheres.push(sphere);
    return sphere;
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

    const currentTime = time || Date.now();

    // Update match time
    if (this.matchStartTime) {
      const elapsed = currentTime - this.matchStartTime;
      this.matchTimeRemaining = BLIZZARD_CONFIG.ROUND_DURATION_MS - elapsed;

      // Update wave based on elapsed time
      this._updateWave(elapsed);
    }

    // Check spawn timing
    this._checkSpawnTimer(currentTime);

    // Update all spheres
    this._updateSpheres(dt);

    // Check player collision with spheres
    this._checkPlayerSphereCollisions(localGhost, input, currentTime);

    // Check shadow collision with spheres
    if (input.shadowGhost) {
      this._checkShadowSphereCollisions(input.shadowGhost, input, currentTime);
    }

    // Check barrier collisions (scoring)
    this._checkBarrierCollisions();

    // Update Shadow AI
    if (this.shadowAI && input.shadowGhost) {
      const gameState = this._buildAIGameState(localGhost, input.shadowGhost, currentTime);
      const aiDecision = this.shadowAI.update(dt, gameState);
      input.aiDecision = aiDecision;
    }
  }

  /**
   * Update wave number based on elapsed time
   * @private
   */
  _updateWave(elapsed) {
    if (elapsed < BLIZZARD_CONFIG.WAVE_1_DURATION) {
      if (this.currentWave !== 1) {
        this.currentWave = 1;
        this.spheresSpawnedThisWave = 0;
      }
    } else if (elapsed < BLIZZARD_CONFIG.WAVE_2_DURATION) {
      if (this.currentWave !== 2) {
        this.currentWave = 2;
        this.spheresSpawnedThisWave = 0;
      }
    } else {
      if (this.currentWave !== 3) {
        this.currentWave = 3;
        this.spheresSpawnedThisWave = 0;
      }
    }
  }

  /**
   * Check if it's time to spawn more spheres
   * @private
   */
  _checkSpawnTimer(currentTime) {
    const waveConfig = this._getWaveConfig();
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;

    // Spawn if delay has passed and we haven't hit the limit
    if (timeSinceLastSpawn >= waveConfig.delay) {
      // Keep sphere count manageable (max 15 at once)
      if (this.spheres.length < 15) {
        this._spawnSphere(waveConfig.speed);
        this.lastSpawnTime = currentTime;
        this.spheresSpawnedThisWave++;
      }
    }
  }

  /**
   * Update all sphere positions
   * @private
   */
  _updateSpheres(dt) {
    for (const sphere of this.spheres) {
      sphere.update(dt, this.arenaWidth, this.arenaHeight);
    }
  }

  /**
   * Check player collision with spheres
   * @private
   */
  _checkPlayerSphereCollisions(localGhost, input, currentTime) {
    if (!localGhost) return;

    const playerTeamId = this.teams.get('player');
    const playerOnRecord = input.ghostMovementState === 'ORBITING';

    // Don't interact while orbiting
    if (playerOnRecord) return;

    for (const sphere of this.spheres) {
      const dist = distance(localGhost.position.x, localGhost.position.y, sphere.x, sphere.y);

      if (dist < BLIZZARD_CONFIG.TOUCH_RADIUS) {
        this._handleSphereTouch(sphere, 'player', playerTeamId, input);
        break; // Only interact with one sphere per frame
      }
    }
  }

  /**
   * Check shadow collision with spheres
   * @private
   */
  _checkShadowSphereCollisions(shadowGhost, input, currentTime) {
    const shadowTeamId = this.teams.get(this.shadowGhostId);
    const shadowOnRecord = input.shadowMovementState === 'ORBITING';

    if (shadowOnRecord) return;

    for (const sphere of this.spheres) {
      const dist = distance(shadowGhost.position.x, shadowGhost.position.y, sphere.x, sphere.y);

      if (dist < BLIZZARD_CONFIG.TOUCH_RADIUS) {
        this._handleSphereTouch(sphere, this.shadowGhostId, shadowTeamId, input);
        break;
      }
    }
  }

  /**
   * Handle sphere touch by a player
   * @private
   */
  _handleSphereTouch(sphere, playerId, playerTeamId, input) {
    const enemyTeamId = playerTeamId === 0 ? 1 : 0;

    if (sphere.teamId === null) {
      // Neutral sphere: CLAIM + RETURN toward enemy
      sphere.return(playerId, enemyTeamId, playerTeamId);
      input.sphereInteraction = { type: 'claimed', sphereId: sphere.id };
    } else if (sphere.teamId === playerTeamId) {
      // Own sphere: RETURN toward enemy (speed boost)
      sphere.return(playerId, enemyTeamId, playerTeamId);
      input.sphereInteraction = { type: 'returned', sphereId: sphere.id };
    } else {
      // Enemy sphere: FLIP + RETURN (becomes your team's)
      sphere.flip(playerId, playerTeamId);
      sphere.return(playerId, enemyTeamId, playerTeamId);
      input.sphereInteraction = { type: 'flipped', sphereId: sphere.id };
    }
  }

  /**
   * Check sphere collisions with barriers (scoring)
   *
   * Scoring rules:
   * - When a sphere crosses a barrier, the team that SENT it toward that barrier scores
   * - A team scores by getting spheres past the ENEMY barrier
   * - Team 0 attacks bottom barrier (team 1's goal), Team 1 attacks top barrier (team 0's goal)
   * - Only the team that owns the sphere can score (prevents own goals)
   * - Neutral spheres don't score (must be claimed first)
   *
   * @private
   */
  _checkBarrierCollisions() {
    const spheresToRemove = [];

    for (const sphere of this.spheres) {
      for (const barrier of this.barriers) {
        // Check if sphere crossed the barrier
        const barrierHit = barrier.teamId === 0
          ? sphere.y - sphere.radius <= barrier.y  // Top barrier (team 0's goal)
          : sphere.y + sphere.radius >= barrier.y; // Bottom barrier (team 1's goal)

        if (barrierHit) {
          // Determine which team attacked this barrier successfully
          // Top barrier (team 0's goal) → Team 1 scores if they own the sphere
          // Bottom barrier (team 1's goal) → Team 0 scores if they own the sphere
          const attackingTeam = barrier.teamId === 0 ? 1 : 0;

          // Only score if the sphere is owned by the attacking team
          // This prevents own goals and requires claiming spheres to score
          if (sphere.teamId === attackingTeam) {
            this.teamScores[attackingTeam]++;
            console.log(`[BlizzardMode] Team ${attackingTeam} scores! (${this.teamScores[0]}-${this.teamScores[1]})`);
          }

          spheresToRemove.push(sphere.id);
          break;
        }
      }
    }

    // Remove scored spheres
    this.spheres = this.spheres.filter(s => !spheresToRemove.includes(s.id));
  }

  /**
   * Handle player input
   * @param {string} type - Input type ('spacebar', 'orbit_exit')
   * @param {Object} data - Input data
   * @param {Object} ghost - Ghost that triggered input
   * @returns {Object|null}
   */
  applyInput(type, data, ghost) {
    // Blizzard mode doesn't use spacebar timing mechanics
    // Sphere interaction is automatic on touch
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
      sphereCount: this.spheres.length,
      wave: this.currentWave
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
        // Tie goes to player (sudden death would be better but simpler for now)
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
      blizzardSpheres: this.spheres.map(s => ({
        ...s.toJSON(),
        teamColor: s.teamId !== null ? this.teamColors[s.teamId] : null
      })),
      barriers: this.barriers.map(b => ({
        ...b,
        teamColor: this.teamColors[b.teamId]
      })),
      teamScores: [...this.teamScores],
      teamColors: [...this.teamColors],
      wave: this.currentWave,
      dots: [],  // No dots in Blizzard mode
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
      case 'sphere':
        if (id) {
          return this.spheres.find(s => s.id === id) || null;
        }
        return this.spheres;

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
      wave: this.currentWave,
      spheres: this.spheres.map(s => s.toJSON()),
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
      spheres: this.spheres.map(s => s.toJSON()),
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
    this.matchStartTime = Date.now();
    this.matchTimeRemaining = BLIZZARD_CONFIG.ROUND_DURATION_MS;
    this.matchResult = null;
    this.winCondition = null;

    // Reset waves
    this.currentWave = 1;
    this.lastSpawnTime = Date.now();
    this.spheresSpawnedThisWave = 0;

    // Clear and respawn spheres
    this.spheres = [];
    this._spawnInitialSpheres();

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
    this.spheres = [];
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
      spheres: this.spheres.map(s => s.toJSON()),
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
