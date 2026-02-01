/**
 * Ghost Orbits - Arena Mode
 *
 * Solo vs Shadow Self mode with dot territory mechanics.
 * Players compete to control 90% of territory dots while avoiding damage.
 *
 * Win conditions:
 * - Territory: First to 90% dot ownership
 * - Elimination: Opponent loses all 3 lives
 * - Timeout: Higher dot count when timer expires
 *
 * @module arena-mode
 * @version 1.0.0
 */

import { OrbitsMode } from '../core/orbits-mode-interface.js';
import { DotManager, DOT_CONFIG } from '../core/ghost-orbits-dots.js';
import { ShadowAI, PatternRecorder } from './ghost-orbits-shadow-ai.js';

/**
 * Arena mode configuration constants
 */
const ARENA_CONFIG = {
  ROUND_DURATION: 120000,        // 120 seconds
  DOT_COUNT: 50,                 // Number of territory dots
  DOT_RADIUS: 10,                // Dot visual radius
  INITIAL_LIVES: 3,              // Starting lives for each player
  INVULNERABILITY_DURATION: 1500, // 1.5s after taking damage
  WIN_THRESHOLD: 0.90            // 90% dots = win
};

/**
 * Arena Mode - Solo vs Shadow Self with dot territory
 * @extends OrbitsMode
 */
export class ArenaMode extends OrbitsMode {
  /**
   * Create Arena mode instance
   * @param {Object} config - Mode configuration
   * @param {number} config.arenaSize - Arena size in pixels
   * @param {Object} config.ghostProperties - Player's NN-derived properties
   * @param {string} config.cartridgeId - Cartridge ID for localStorage
   * @param {string} config.username - Player's username
   * @param {Object} [config.physicsEngine] - Physics engine reference
   * @param {Object} [config.patterns] - Stored player patterns for AI
   * @param {number} [config.shadowGeneration] - Shadow AI generation level
   */
  constructor(config) {
    super(config);

    // Arena configuration
    this.arenaSize = config.arenaSize || 800;
    this.ghostProperties = config.ghostProperties || {};
    this.cartridgeId = config.cartridgeId || 'default';
    this.username = config.username || 'player';
    this.physicsEngine = config.physicsEngine || null;

    // Shadow AI configuration
    this.shadowGeneration = config.shadowGeneration || 1;
    this.storedPatterns = config.patterns || null;

    // Game systems (initialized in init())
    this.dotManager = null;
    this.shadowAI = null;
    this.patternRecorder = null;

    // Lives system
    this.playerLives = ARENA_CONFIG.INITIAL_LIVES;
    this.shadowLives = ARENA_CONFIG.INITIAL_LIVES;
    this.playerInvulnerableUntil = 0;
    this.shadowInvulnerableUntil = 0;
    this.invulnerabilityDuration = config.ghostProperties?.respawnSpeed
      ? config.ghostProperties.respawnSpeed * 1000
      : ARENA_CONFIG.INVULNERABILITY_DURATION;

    // Match timing
    this.matchStartTime = null;
    this.matchTimeRemaining = ARENA_CONFIG.ROUND_DURATION;

    // Match result
    this.matchResult = null;
    this.winCondition = null;

    // Shadow state tracking
    this.shadowGhostId = 'shadow_self';
    this.shadowMovementState = 'FREE_FLIGHT';
    this.lastPatternRecordTime = 0;

    // Stats tracking for progression
    this.matchStats = {
      energyDepletionCount: 0,
      territoryClaimRate: 0,
      timeSpentOrbiting: 0,
      absorptionAttempts: 0,
      totalGameTime: 0
    };

    // Colors
    this.playerColor = config.ghostProperties?.color || '#4488ff';
    this.shadowColor = this._getComplementaryColor(this.playerColor);
  }

  /**
   * Initialize the arena mode
   * @param {Object} [config] - Additional configuration
   * @returns {Promise<void>}
   */
  async init(config = {}) {
    if (config.arenaSize) this.arenaSize = config.arenaSize;
    if (config.physicsEngine) this.physicsEngine = config.physicsEngine;

    // Get records from physics engine for dot placement
    const records = this.physicsEngine?.getRecords() || [];

    // Initialize dot manager
    this.dotManager = new DotManager(this.arenaSize, {
      dotCount: ARENA_CONFIG.DOT_COUNT,
      dotRadius: ARENA_CONFIG.DOT_RADIUS,
      playerColor: this.playerColor,
      shadowColor: this.shadowColor
    });
    this.dotManager.initialize(records);

    // Initialize Shadow AI
    this.shadowAI = new ShadowAI(
      {
        mass: this.ghostProperties?.mass || 1.0,
        thrust: this.ghostProperties?.thrustEfficiency || 1.0,
        trailDuration: this.ghostProperties?.trailDuration || 1.0,
        energyRegen: this.ghostProperties?.energyRegen || 1.0,
        trailWidth: this.ghostProperties?.trailWidth || 1.0
      },
      this.shadowGeneration,
      this.storedPatterns
    );

    // Initialize pattern recorder
    this.patternRecorder = new PatternRecorder();
    this.patternRecorder.start();

    // Reset match state
    this.matchStartTime = Date.now();
    this.matchTimeRemaining = ARENA_CONFIG.ROUND_DURATION;
    this.playerLives = ARENA_CONFIG.INITIAL_LIVES;
    this.shadowLives = ARENA_CONFIG.INITIAL_LIVES;
    this.playerInvulnerableUntil = 0;
    this.shadowInvulnerableUntil = 0;
    this.matchResult = null;
    this.winCondition = null;

    this.initialized = true;
    console.log(`[ArenaMode] Initialized with ${this.dotManager.getDots().length} dots, Shadow Gen ${this.shadowGeneration}`);
  }

  /**
   * Per-frame update
   * @param {number} dt - Delta time in seconds
   * @param {number} time - Current timestamp in ms
   * @param {Object} localGhost - Player ghost object
   * @param {Object} input - Input state {ghostMovementState, activeKeys, shadowGhost, shadowMovementState}
   */
  step(dt, time, localGhost, input) {
    if (!this.initialized || this.matchResult !== null) return;

    const currentTime = time || Date.now();

    // Update match time
    if (this.matchStartTime) {
      const elapsed = currentTime - this.matchStartTime;
      this.matchTimeRemaining = ARENA_CONFIG.ROUND_DURATION - elapsed;
    }

    // Update dot animations
    this.dotManager.update(dt);

    // Track stats
    this._trackMatchStats(localGhost, input.shadowGhost, dt);

    // Record player patterns for Shadow AI learning
    this._recordPlayerPattern(localGhost, input, currentTime);

    // Update Shadow AI if we have shadow ghost
    if (this.shadowAI && input.shadowGhost) {
      const gameState = this._buildShadowGameState(localGhost, input.shadowGhost);
      const aiDecision = this.shadowAI.update(dt, gameState);

      // Return AI decision for controller to apply
      input.aiDecision = aiDecision;
    }

    // Check dot interactions for player
    const playerOnRecord = input.ghostMovementState === 'ORBITING';
    // Use Date.now() for invulnerability check since setPlayerInvulnerableUntil uses Date.now()
    const now = Date.now();
    if (!playerOnRecord && now > this.playerInvulnerableUntil) {
      const interaction = this.dotManager.checkDotInteraction(
        'player',
        localGhost.position.x,
        localGhost.position.y,
        this.playerColor,
        {
          claimRadius: this.ghostProperties?.claimRadius || 1.0,
          flipWindow: this.ghostProperties?.flipWindow || 250,
          vx: localGhost.velocity.x,
          vy: localGhost.velocity.y
        }
      );

      if (interaction) {
        input.playerInteraction = interaction;

        if (interaction.type === 'damaged') {
          const damageResult = this.handleDamage('player', 'dot', 'dot_collision');
          input.damageResult = damageResult;
        } else if (interaction.ghostVelocity) {
          // Billiard physics: ghost velocity changed from bumping dot
          input.playerBilliardBounce = {
            x: interaction.ghostVelocity.ghostVx,
            y: interaction.ghostVelocity.ghostVy
          };
        }
      }
    }

    // Check dot interactions for shadow
    const shadowOnRecord = input.shadowMovementState === 'ORBITING';
    if (input.shadowGhost && !shadowOnRecord && now > this.shadowInvulnerableUntil) {
      // Shadow AI: register spacebar if near enemy dot
      const nearEnemyDot = this._isShadowNearEnemyDot(input.shadowGhost);
      if (nearEnemyDot && Math.random() < 0.7) {
        this.dotManager.registerSpacebarPress('shadow');
      }

      const interaction = this.dotManager.checkDotInteraction(
        'shadow',
        input.shadowGhost.position.x,
        input.shadowGhost.position.y,
        this.shadowColor,
        {
          vx: input.shadowGhost.velocity.x,
          vy: input.shadowGhost.velocity.y
        }
      );

      if (interaction) {
        input.shadowInteraction = interaction;

        if (interaction.type === 'damaged') {
          const damageResult = this.handleDamage('shadow', 'dot', 'dot_collision');
          input.shadowDamageResult = damageResult;
        } else if (interaction.ghostVelocity) {
          // Billiard physics: shadow velocity changed from bumping dot
          input.shadowBilliardBounce = {
            x: interaction.ghostVelocity.ghostVx,
            y: interaction.ghostVelocity.ghostVy
          };
        }
      }
    }

    // Calculate dot magnetism (NN-influenced pull toward unclaimed dots)
    if (!playerOnRecord) {
      const magnetism = this.ghostProperties?.dotMagnetism || 0;

      if (magnetism > 0) {
        const neutralDots = this.dotManager.getNeutralDots();

        if (neutralDots.length > 0) {
          // Find nearest unclaimed dot
          let nearestDot = null;
          let nearestDist = Infinity;

          for (const dot of neutralDots) {
            const dx = dot.x - localGhost.position.x;
            const dy = dot.y - localGhost.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < nearestDist && dist > 20) { // Ignore dots too close
              nearestDist = dist;
              nearestDot = dot;
            }
          }

          // Calculate magnetism force toward nearest neutral dot
          if (nearestDot && nearestDist < 200) { // Only within 200px range
            const dx = nearestDot.x - localGhost.position.x;
            const dy = nearestDot.y - localGhost.position.y;

            // Normalize and scale by magnetism strength and inverse distance
            const force = magnetism * (1 - nearestDist / 200) * 0.5;
            const nx = dx / nearestDist;
            const ny = dy / nearestDist;

            // Return magnetism force for controller to apply
            input.magnetismForce = { x: nx * force, y: ny * force };
          }
        }
      }
    }

    // 12-orbits style: billiard collision with own dots
    if (!playerOnRecord) {
      const ownDotCollision = this.dotManager.checkOwnDotCollision(
        'player',
        localGhost.position.x,
        localGhost.position.y,
        localGhost.velocity.x,
        localGhost.velocity.y,
        12 // Ghost radius
      );

      if (ownDotCollision) {
        // Apply billiard bounce to player ghost
        input.playerBilliardBounce = ownDotCollision.ghostVelocity;
        if (ownDotCollision.separation) {
          input.playerSeparation = ownDotCollision.separation;
        }
      }
    }

    // Shadow billiard collision with own dots
    if (input.shadowGhost && !shadowOnRecord) {
      const shadowDotCollision = this.dotManager.checkOwnDotCollision(
        'shadow',
        input.shadowGhost.position.x,
        input.shadowGhost.position.y,
        input.shadowGhost.velocity.x,
        input.shadowGhost.velocity.y,
        12 // Ghost radius
      );

      if (shadowDotCollision) {
        input.shadowBilliardBounce = shadowDotCollision.ghostVelocity;
        if (shadowDotCollision.separation) {
          input.shadowSeparation = shadowDotCollision.separation;
        }
      }
    }

    // Ghost-ghost collision (billiard bounce)
    if (input.shadowGhost) {
      const ghostCollision = this.checkGhostGhostCollision(localGhost, input.shadowGhost);

      if (ghostCollision) {
        // Override any previous bounce with ghost-ghost collision
        input.playerBilliardBounce = ghostCollision.ghost1Velocity;
        input.shadowBilliardBounce = ghostCollision.ghost2Velocity;
        input.playerSeparation = { x: -ghostCollision.separation.x, y: -ghostCollision.separation.y };
        input.shadowSeparation = ghostCollision.separation;
      }
    }
  }

  /**
   * Handle player input
   * @param {string} type - Input type ('spacebar')
   * @param {Object} data - Input data
   * @param {Object} ghost - Ghost that triggered input
   * @returns {Object|null}
   */
  applyInput(type, data, ghost) {
    if (type === 'spacebar') {
      // Register spacebar for flip mechanic timing
      const ghostId = ghost.id === this.shadowGhostId ? 'shadow' : 'player';
      this.dotManager.registerSpacebarPress(ghostId);
      return { registered: true };
    }
    return null;
  }

  /**
   * Get current scoreboard
   * @returns {Object}
   */
  getScoreboard() {
    const playerDots = this.dotManager?.countDotsByOwner('player') || 0;
    const shadowDots = this.dotManager?.countDotsByOwner('shadow') || 0;
    const totalDots = this.dotManager?.getTotalDots() || 1;

    return {
      playerScore: playerDots,
      opponentScore: shadowDots,
      playerLives: this.playerLives,
      opponentLives: this.shadowLives,
      timeRemaining: Math.max(0, this.matchTimeRemaining),
      playerPercent: playerDots / totalDots,
      opponentPercent: shadowDots / totalDots,
      totalDots
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

    // Check territory win (90% dots)
    const winner = this.dotManager?.checkWinner();
    if (winner) {
      this.matchResult = winner === 'player' ? 'player_win' : 'shadow_win';
      this.winCondition = 'territory';
      return {
        ended: true,
        winner: winner === 'player' ? 'player' : 'opponent',
        reason: 'territory'
      };
    }

    // Check elimination
    if (this.playerLives <= 0) {
      this.matchResult = 'shadow_win';
      this.winCondition = 'elimination';
      return {
        ended: true,
        winner: 'opponent',
        reason: 'elimination'
      };
    }

    if (this.shadowLives <= 0) {
      this.matchResult = 'player_win';
      this.winCondition = 'elimination';
      return {
        ended: true,
        winner: 'player',
        reason: 'elimination'
      };
    }

    // Check timeout
    if (this.matchTimeRemaining <= 0) {
      const playerPercent = this.dotManager?.getOwnershipPercent('player') || 0;
      const shadowPercent = this.dotManager?.getOwnershipPercent('shadow') || 0;

      this.matchResult = playerPercent >= shadowPercent ? 'player_win' : 'shadow_win';
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
      dots: this.dotManager?.getDots() || [],
      records: this.physicsEngine?.getRecords() || [],
      ghosts: [],  // Controller manages ghost rendering
      effects: []
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
          return this.dotManager?.getDots().find(d => d.id === id) || null;
        }
        return this.dotManager?.getDots() || [];

      case 'record':
        if (id) {
          return this.physicsEngine?.getRecords().find(r => r.id === id) || null;
        }
        return this.physicsEngine?.getRecords() || [];

      case 'shadow':
        return { id: this.shadowGhostId, generation: this.shadowGeneration };

      default:
        return null;
    }
  }

  /**
   * Handle damage to entity
   * @param {string} target - 'player' or 'shadow'
   * @param {string} source - Damage source
   * @param {string} type - Damage type
   * @returns {Object}
   */
  handleDamage(target, source, type) {
    const currentTime = Date.now();

    if (target === 'player') {
      if (currentTime < this.playerInvulnerableUntil) {
        return { blocked: true, livesRemaining: this.playerLives };
      }

      this.playerLives--;
      this.playerInvulnerableUntil = currentTime + this.invulnerabilityDuration;

      console.log(`[ArenaMode] Player damaged! Lives: ${this.playerLives}`);

      return {
        livesRemaining: this.playerLives,
        eliminated: this.playerLives <= 0,
        invulnerableUntil: this.playerInvulnerableUntil
      };
    }

    if (target === 'shadow') {
      if (currentTime < this.shadowInvulnerableUntil) {
        return { blocked: true, livesRemaining: this.shadowLives };
      }

      this.shadowLives--;
      this.shadowInvulnerableUntil = currentTime + this.invulnerabilityDuration;

      console.log(`[ArenaMode] Shadow damaged! Lives: ${this.shadowLives}`);

      return {
        livesRemaining: this.shadowLives,
        eliminated: this.shadowLives <= 0,
        invulnerableUntil: this.shadowInvulnerableUntil
      };
    }

    return { blocked: true };
  }

  /**
   * Serialize state for sync
   * @returns {Object}
   */
  serializeState() {
    return {
      type: 'ArenaMode',
      playerLives: this.playerLives,
      shadowLives: this.shadowLives,
      matchTimeRemaining: this.matchTimeRemaining,
      dots: this.dotManager?.getDots().map(d => ({
        id: d.id,
        x: d.x,
        y: d.y,
        ownerId: d.ownerId,
        state: d.state
      })) || [],
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
      dots: this.dotManager?.getDots() || [],
      ghosts: [],
      records: this.physicsEngine?.getRecords() || []
    };
  }

  /**
   * Reset for rematch
   */
  reset() {
    console.log('[ArenaMode] Resetting for rematch');

    // Reset lives
    this.playerLives = ARENA_CONFIG.INITIAL_LIVES;
    this.shadowLives = ARENA_CONFIG.INITIAL_LIVES;
    this.playerInvulnerableUntil = 0;
    this.shadowInvulnerableUntil = 0;

    // Reset timing
    this.matchStartTime = Date.now();
    this.matchTimeRemaining = ARENA_CONFIG.ROUND_DURATION;
    this.matchResult = null;
    this.winCondition = null;

    // Reset dots
    if (this.dotManager) {
      this.dotManager.reset();
      const records = this.physicsEngine?.getRecords() || [];
      this.dotManager.initialize(records);
    }

    // Reset pattern recorder
    if (this.patternRecorder) {
      this.patternRecorder.clear();
      this.patternRecorder.start();
    }

    // Reset stats
    this.matchStats = {
      energyDepletionCount: 0,
      territoryClaimRate: 0,
      timeSpentOrbiting: 0,
      absorptionAttempts: 0,
      totalGameTime: 0
    };

    this.shadowMovementState = 'FREE_FLIGHT';
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.patternRecorder) {
      this.patternRecorder.stop();
      this.patternRecorder = null;
    }
    this.dotManager = null;
    this.shadowAI = null;
    super.dispose();
  }

  // ============================================
  // ACCESSORS FOR CONTROLLER COMPATIBILITY
  // ============================================

  /**
   * Get dot manager (for controller to sync to renderer)
   * @returns {DotManager|null}
   */
  getDotManager() {
    return this.dotManager;
  }

  /**
   * Get Shadow AI instance
   * @returns {ShadowAI|null}
   */
  getShadowAI() {
    return this.shadowAI;
  }

  /**
   * Get pattern recorder
   * @returns {PatternRecorder|null}
   */
  getPatternRecorder() {
    return this.patternRecorder;
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
   * Set match result (called by controller when ending match)
   * @param {string} result - 'player_win' or 'shadow_win'
   * @param {string} condition - 'territory', 'elimination', or 'timeout'
   */
  setMatchResult(result, condition) {
    this.matchResult = result;
    this.winCondition = condition;
  }

  /**
   * Get shadow generation
   * @returns {number}
   */
  getShadowGeneration() {
    return this.shadowGeneration;
  }

  /**
   * Increment shadow generation (on player win)
   */
  incrementShadowGeneration() {
    this.shadowGeneration++;
    return this.shadowGeneration;
  }

  /**
   * Get match stats
   * @returns {Object}
   */
  getMatchStats() {
    return this.matchStats;
  }

  /**
   * Analyze match stats to determine weakest stat for upgrade
   * @returns {string} Name of the weakest stat
   */
  analyzeWeakestStat() {
    console.log('[ArenaMode] Analyzing match stats:', this.matchStats);

    const weaknesses = [];

    // Energy depletion analysis
    const energyDepletionRate = this.matchStats.energyDepletionCount / Math.max(this.matchStats.totalGameTime, 1.0);
    if (energyDepletionRate > 0.1) { // More than once per 10 seconds
      weaknesses.push({ stat: 'energyRegen', score: energyDepletionRate });
      console.log('[ArenaMode] Energy weakness detected:', energyDepletionRate.toFixed(3), 'depletions/sec');
    }

    // Territory claim rate analysis
    const avgTerritoryPerSec = this.matchStats.territoryClaimRate;
    if (avgTerritoryPerSec < 0.005) { // Less than 0.5% per second
      // Could be trail duration or trail width
      weaknesses.push({ stat: 'trailDuration', score: 0.01 - avgTerritoryPerSec });
      weaknesses.push({ stat: 'trailWidth', score: (0.01 - avgTerritoryPerSec) * 0.9 }); // Slight preference for duration
      console.log('[ArenaMode] Territory weakness detected:', avgTerritoryPerSec.toFixed(4), 'percent/sec');
    }

    // Absorption attempt analysis
    if (this.matchStats.absorptionAttempts > 5) {
      // Got into risky situations - mass might be weak
      weaknesses.push({ stat: 'mass', score: this.matchStats.absorptionAttempts / 10 });
      console.log('[ArenaMode] Mass weakness detected:', this.matchStats.absorptionAttempts, 'risky encounters');
    }

    // Orbit time analysis
    const orbitPercent = this.matchStats.timeSpentOrbiting / Math.max(this.matchStats.totalGameTime, 1.0);
    if (orbitPercent > 0.4) { // Spent more than 40% of time in orbit
      // Might indicate difficulty catching enemy - thrust efficiency weak
      weaknesses.push({ stat: 'thrustEfficiency', score: orbitPercent - 0.3 });
      console.log('[ArenaMode] Thrust weakness detected:', (orbitPercent * 100).toFixed(1), '% time orbiting');
    }

    // Find highest scoring weakness
    if (weaknesses.length > 0) {
      weaknesses.sort((a, b) => b.score - a.score);
      const chosenStat = weaknesses[0].stat;
      console.log('[ArenaMode] Weakest stat identified:', chosenStat, 'score:', weaknesses[0].score.toFixed(3));
      return chosenStat;
    }

    // Default: upgrade a random stat if no clear weakness
    const allStats = ['mass', 'energyRegen', 'trailDuration', 'trailWidth', 'thrustEfficiency'];
    const randomStat = allStats[Math.floor(Math.random() * allStats.length)];
    console.log('[ArenaMode] No clear weakness, upgrading random stat:', randomStat);
    return randomStat;
  }

  /**
   * Get round duration config
   * @returns {number} Round duration in milliseconds
   */
  getRoundDuration() {
    return ARENA_CONFIG.ROUND_DURATION;
  }

  /**
   * Get player lives
   * @returns {number}
   */
  getPlayerLives() {
    return this.playerLives;
  }

  /**
   * Get shadow lives
   * @returns {number}
   */
  getShadowLives() {
    return this.shadowLives;
  }

  /**
   * Check if player is invulnerable
   * @returns {boolean}
   */
  isPlayerInvulnerable() {
    return Date.now() < this.playerInvulnerableUntil;
  }

  /**
   * Check if shadow is invulnerable
   * @returns {boolean}
   */
  isShadowInvulnerable() {
    return Date.now() < this.shadowInvulnerableUntil;
  }

  /**
   * Get invulnerability end time for player
   * @returns {number}
   */
  getPlayerInvulnerableUntil() {
    return this.playerInvulnerableUntil;
  }

  /**
   * Get invulnerability end time for shadow
   * @returns {number}
   */
  getShadowInvulnerableUntil() {
    return this.shadowInvulnerableUntil;
  }

  /**
   * Set player invulnerability (e.g., for help screen)
   * @param {number} until - Timestamp until which player is invulnerable
   */
  setPlayerInvulnerableUntil(until) {
    this.playerInvulnerableUntil = until;
  }

  /**
   * Set shadow invulnerability (e.g., for dash)
   * @param {number} until - Timestamp until which shadow is invulnerable
   */
  setShadowInvulnerableUntil(until) {
    this.shadowInvulnerableUntil = until;
  }

  // ============================================
  // COLLISION PHYSICS
  // ============================================

  /**
   * Check for ghost-ghost collision and apply billiard physics
   * Both ghosts bounce off each other elastically
   * @param {Object} ghost1 - First ghost object
   * @param {Object} ghost2 - Second ghost object
   * @returns {Object|null} - { ghost1Velocity, ghost2Velocity, separation } if collision occurred
   */
  checkGhostGhostCollision(ghost1, ghost2) {
    if (!ghost1 || !ghost2) return null;

    const ghost1Radius = 12; // BASE_RADIUS from renderer
    const ghost2Radius = 12;
    const combinedRadius = ghost1Radius + ghost2Radius;

    const dx = ghost2.position.x - ghost1.position.x;
    const dy = ghost2.position.y - ghost1.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // No collision
    if (dist >= combinedRadius || dist === 0) return null;

    // Normalize collision normal (from ghost1 to ghost2)
    const nx = dx / dist;
    const ny = dy / dist;

    // Relative velocity of ghost1 with respect to ghost2
    const relVx = ghost1.velocity.x - ghost2.velocity.x;
    const relVy = ghost1.velocity.y - ghost2.velocity.y;

    // Relative velocity along collision normal
    // Positive = ghost1 approaching ghost2, Negative = separating
    const relVelNormal = relVx * nx + relVy * ny;

    // Only collide if moving toward each other (positive relVelNormal)
    if (relVelNormal <= 0) return null;

    // Elastic collision (equal mass): swap velocity components along normal
    const ghost1NormalSpeed = ghost1.velocity.x * nx + ghost1.velocity.y * ny;
    const ghost2NormalSpeed = ghost2.velocity.x * nx + ghost2.velocity.y * ny;

    // Each ghost gets the other's normal component
    const newGhost1Vx = ghost1.velocity.x + (ghost2NormalSpeed - ghost1NormalSpeed) * nx;
    const newGhost1Vy = ghost1.velocity.y + (ghost2NormalSpeed - ghost1NormalSpeed) * ny;
    const newGhost2Vx = ghost2.velocity.x + (ghost1NormalSpeed - ghost2NormalSpeed) * nx;
    const newGhost2Vy = ghost2.velocity.y + (ghost1NormalSpeed - ghost2NormalSpeed) * ny;

    // Calculate separation to prevent sticking
    const overlap = combinedRadius - dist;
    const separationX = nx * overlap * 0.5;
    const separationY = ny * overlap * 0.5;

    return {
      ghost1Velocity: { x: newGhost1Vx, y: newGhost1Vy },
      ghost2Velocity: { x: newGhost2Vx, y: newGhost2Vy },
      separation: { x: separationX, y: separationY }
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
   * Build game state for Shadow AI
   * @private
   */
  _buildShadowGameState(localGhost, shadowGhost) {
    const wells = this.physicsEngine?.getWells().map(w => ({
      position: w.position,
      ownerId: w.ownerId,
      type: w.type,
      captureRadius: w.captureRadius
    })) || [];

    const records = this.physicsEngine?.getRecords().map(r => ({
      position: { x: r.x, y: r.y },
      captureRadius: r.captureRadius || 70,
      id: r.id
    })) || [];

    const territoryPercent = this.dotManager?.getOwnershipPercent('shadow') || 0;

    // Get dot information for AI targeting
    const dots = this.dotManager?.getDots().map(d => ({
      x: d.x,
      y: d.y,
      ownerId: d.ownerId,
      state: d.state
    })) || [];

    return {
      selfX: shadowGhost.position.x,
      selfY: shadowGhost.position.y,
      selfVx: shadowGhost.velocity.x,
      selfVy: shadowGhost.velocity.y,
      selfEnergy: shadowGhost.energy,
      selfIsOrbiting: this.shadowMovementState === 'ORBITING',
      playerX: localGhost.position.x,
      playerY: localGhost.position.y,
      playerVx: localGhost.velocity.x,
      playerVy: localGhost.velocity.y,
      playerMass: localGhost.mass,
      wells: records, // Use records as "wells" for orbit detection
      dots: dots,
      territoryPercent: territoryPercent,
      arenaWidth: this.arenaSize,
      arenaHeight: this.arenaSize,
      voidX: 0,
      voidY: 0
    };
  }

  /**
   * Check if shadow is near a player-owned dot
   * @private
   */
  _isShadowNearEnemyDot(shadowGhost) {
    if (!this.dotManager || !shadowGhost) return false;

    const dots = this.dotManager.getDots();
    const checkRadius = DOT_CONFIG.COLLISION_RADIUS * 2;

    for (const dot of dots) {
      if (dot.ownerId === 'player') {
        const dx = shadowGhost.position.x - dot.x;
        const dy = shadowGhost.position.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < checkRadius) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Record player pattern for Shadow AI learning
   * @private
   */
  _recordPlayerPattern(localGhost, input, currentTime) {
    if (!this.patternRecorder) return;

    // Throttle to once every 100ms
    if (currentTime - this.lastPatternRecordTime < 100) return;
    this.lastPatternRecordTime = currentTime;

    const shadowGhost = input.shadowGhost;

    // Calculate context data
    let nearestWellDist = Infinity;
    const wells = this.physicsEngine?.getWells() || [];
    for (const well of wells) {
      const dx = localGhost.position.x - well.position.x;
      const dy = localGhost.position.y - well.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestWellDist) nearestWellDist = dist;
    }

    let enemyDist = Infinity;
    let enemyMassRatio = 1.0;
    if (shadowGhost) {
      const dx = localGhost.position.x - shadowGhost.position.x;
      const dy = localGhost.position.y - shadowGhost.position.y;
      enemyDist = Math.sqrt(dx * dx + dy * dy);
      enemyMassRatio = (shadowGhost.mass || 1.0) / (localGhost.mass || 1.0);
    }

    // Get current input direction
    let inputDir = null;
    if (input.activeKeys?.size > 0) {
      inputDir = { x: 0, y: 0 };
      const INPUT_KEYS = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 },
        KeyS: { x: 0, y: 1 },
        KeyA: { x: -1, y: 0 },
        KeyD: { x: 1, y: 0 }
      };
      for (const key of input.activeKeys) {
        const dir = INPUT_KEYS[key];
        if (dir) {
          inputDir.x += dir.x;
          inputDir.y += dir.y;
        }
      }
    }

    const territoryPercent = this.dotManager?.getOwnershipPercent('player') || 0;

    this.patternRecorder.record({
      timestamp: currentTime,
      x: localGhost.position.x,
      y: localGhost.position.y,
      vx: localGhost.velocity.x,
      vy: localGhost.velocity.y,
      inputDirection: inputDir,
      state: input.ghostMovementState === 'ORBITING' ? 'orbiting' : 'free',
      energy: localGhost.energy,
      nearestWellDistance: nearestWellDist,
      territoryPercent: territoryPercent,
      enemyDistance: enemyDist,
      enemyMassRatio: enemyMassRatio,
      voidDistance: Infinity
    });
  }

  /**
   * Track match statistics
   * @private
   */
  _trackMatchStats(localGhost, shadowGhost, deltaTime) {
    if (!localGhost) return;

    this.matchStats.totalGameTime += deltaTime;

    if (localGhost.energy <= 0) {
      this.matchStats.energyDepletionCount++;
    }

    // Track territory claim rate
    const currentTerritory = this.dotManager?.getOwnershipPercent('player') || 0;
    const timeWeight = Math.min(this.matchStats.totalGameTime, 1.0);
    this.matchStats.territoryClaimRate = (this.matchStats.territoryClaimRate * (1 - timeWeight * 0.1)) +
                                         (currentTerritory / Math.max(this.matchStats.totalGameTime, 1.0)) * (timeWeight * 0.1);

    // Track near-collisions
    if (shadowGhost) {
      const dx = localGhost.position.x - shadowGhost.position.x;
      const dy = localGhost.position.y - shadowGhost.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const playerRadius = (localGhost.mass || 1.0) * 15;
      const shadowRadius = (shadowGhost.mass || 1.0) * 15;
      const nearCollisionRadius = (playerRadius + shadowRadius) * 1.5;

      if (distance < nearCollisionRadius) {
        const playerMass = localGhost.mass || 1.0;
        const shadowMass = shadowGhost.mass || 1.0;
        const massRatio = Math.max(playerMass, shadowMass) / Math.min(playerMass, shadowMass);

        if (massRatio < 1.44) { // WIN_CONDITIONS.ABSORPTION_MASS_RATIO * 1.2
          this.matchStats.absorptionAttempts++;
        }
      }
    }
  }
}

export default ArenaMode;
