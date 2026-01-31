/**
 * Ghost Orbits - Mode Interface
 *
 * Base class defining the contract for game modes in Ghost Orbits.
 * Modes encapsulate game-specific logic (win conditions, entity behaviors,
 * scoring) while the controller handles mode-agnostic orchestration
 * (state machine, physics, rendering, audio, WebSocket).
 *
 * Current modes:
 * - ArenaMode: Solo vs Shadow Self with dot territory mechanics
 *
 * Future modes:
 * - TrailsMode: Trail-based territory claiming
 * - BlizzardMode: Environmental hazards
 * - MultiballMode: Multiple ghost entities
 *
 * @module orbits-mode-interface
 * @version 1.0.0
 */

/**
 * @typedef {Object} ModeConfig
 * @property {number} arenaSize - Arena size in pixels
 * @property {Object} ghostProperties - Player's NN-derived ghost properties
 * @property {string} cartridgeId - Current cartridge ID for localStorage keys
 * @property {string} username - Player's username
 * @property {Object} [physicsEngine] - Reference to PhysicsEngine
 * @property {Object} [patterns] - Stored player patterns for AI
 */

/**
 * @typedef {Object} Scoreboard
 * @property {number} playerScore - Player's score (e.g., dot count)
 * @property {number} opponentScore - Opponent's score
 * @property {number} playerLives - Player's remaining lives
 * @property {number} opponentLives - Opponent's remaining lives
 * @property {number} timeRemaining - Time remaining in ms
 * @property {number} [playerPercent] - Player's territory percentage (0-1)
 * @property {number} [opponentPercent] - Opponent's territory percentage (0-1)
 */

/**
 * @typedef {Object} EndCondition
 * @property {boolean} ended - Whether the match has ended
 * @property {string} [winner] - 'player' or 'opponent' if ended
 * @property {string} [reason] - Win condition ('territory', 'elimination', 'timeout')
 */

/**
 * @typedef {Object} RenderData
 * @property {Array} dots - Territory dots to render
 * @property {Array} records - Record/well positions (safe zones)
 * @property {Array} ghosts - Ghost entities to render
 * @property {Array} [effects] - Visual effects (flashes, particles)
 */

/**
 * @typedef {Object} DamageEvent
 * @property {string} targetId - ID of entity taking damage ('player' or 'shadow')
 * @property {string} sourceId - ID of damage source
 * @property {string} type - Damage type ('dot_collision', 'trail_hit', etc.)
 * @property {Object} [position] - Position where damage occurred
 */

/**
 * Base class for Ghost Orbits game modes
 * @abstract
 */
export class OrbitsMode {
  /**
   * Create a new mode instance
   * @param {ModeConfig} config - Mode configuration
   */
  constructor(config) {
    if (this.constructor === OrbitsMode) {
      throw new Error('OrbitsMode is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.initialized = false;
  }

  /**
   * Initialize the mode with arena configuration
   * Called once when entering the arena
   * @param {ModeConfig} config - Mode configuration
   * @returns {Promise<void>}
   * @abstract
   */
  async init(config) {
    throw new Error('init() must be implemented by subclass');
  }

  /**
   * Per-frame update (called at 60Hz from game loop)
   * @param {number} dt - Delta time in seconds
   * @param {number} time - Current timestamp in ms
   * @param {Object} ghost - Local player ghost object
   * @param {Object} input - Current input state
   * @returns {void}
   * @abstract
   */
  step(dt, time, ghost, input) {
    throw new Error('step() must be implemented by subclass');
  }

  /**
   * Handle player input (spacebar, etc.)
   * @param {string} type - Input type ('spacebar', 'move', etc.)
   * @param {Object} data - Input data (position, direction, etc.)
   * @param {Object} ghost - Ghost that triggered input
   * @returns {Object|null} Result of input (e.g., {claimed: true, dot: {...}})
   * @abstract
   */
  applyInput(type, data, ghost) {
    throw new Error('applyInput() must be implemented by subclass');
  }

  /**
   * Get current scoreboard state
   * @returns {Scoreboard}
   * @abstract
   */
  getScoreboard() {
    throw new Error('getScoreboard() must be implemented by subclass');
  }

  /**
   * Check if match has ended and determine winner
   * @returns {EndCondition}
   * @abstract
   */
  checkEndCondition() {
    throw new Error('checkEndCondition() must be implemented by subclass');
  }

  /**
   * Get data needed for rendering
   * @returns {RenderData}
   * @abstract
   */
  getRenderData() {
    throw new Error('getRenderData() must be implemented by subclass');
  }

  /**
   * Query entities by type
   * @param {string} type - Entity type ('dot', 'record', 'ghost', etc.)
   * @param {string} [id] - Optional specific entity ID
   * @returns {Object|Array|null} Entity or array of entities
   */
  getEntityByType(type, id) {
    // Default implementation - subclasses can override
    return null;
  }

  /**
   * Process damage to an entity
   * @param {string} target - Target entity ID ('player' or 'shadow')
   * @param {string} source - Source of damage
   * @param {string} type - Damage type
   * @returns {Object} Damage result {livesRemaining, eliminated, invulnerableUntil}
   * @abstract
   */
  handleDamage(target, source, type) {
    throw new Error('handleDamage() must be implemented by subclass');
  }

  /**
   * Serialize mode state for multiplayer sync
   * @returns {Object} Serializable state object
   */
  serializeState() {
    // Default implementation - subclasses can override for multiplayer
    return {
      type: this.constructor.name,
      initialized: this.initialized
    };
  }

  /**
   * Get initial entities to spawn at match start
   * @returns {Object} {dots: [...], ghosts: [...], records: [...]}
   */
  getInitialEntities() {
    // Default implementation - subclasses should override
    return {
      dots: [],
      ghosts: [],
      records: []
    };
  }

  /**
   * Reset mode for rematch
   * Clears game state but preserves configuration
   * @returns {void}
   * @abstract
   */
  reset() {
    throw new Error('reset() must be implemented by subclass');
  }

  /**
   * Cleanup mode resources
   * Called when exiting the arena
   * @returns {void}
   */
  dispose() {
    this.initialized = false;
  }
}

export default OrbitsMode;
