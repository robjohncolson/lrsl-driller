/**
 * Ghost Orbits Controller
 *
 * Main game controller that orchestrates all Ghost Orbits components.
 * Manages the full game lifecycle including WebSocket communication,
 * state machine transitions, and component coordination.
 *
 * @version 1.0.0
 */

// Component imports
import { GhostOrbitsRenderer } from '../core/ghost-orbits-renderer.js';
import { GhostOrbitsAudio } from '../core/ghost-orbits-audio.js';
import { GhostOrbitsPanel } from './ghost-orbits-panel.js';
import { GhostPropertiesMapper } from '../core/ghost-orbits-nn-mapper.js';
import { PhysicsEngine, PHYSICS } from '../core/ghost-orbits-physics.js';
import { TerritorySystem } from '../core/ghost-orbits-territory.js';
import { ShadowAI, PatternRecorder } from './ghost-orbits-shadow-ai.js';
import { DotManager, DOT_CONFIG } from '../core/ghost-orbits-dots.js';
import { ArenaMode } from './arena-mode.js';

/**
 * Game states for the Ghost Orbits state machine
 */
export const GameState = {
  IDLE: 'idle',               // Not in arena
  CONNECTING: 'connecting',   // Joining WebSocket room
  COUNTDOWN: 'countdown',     // 3-2-1-GO
  PLAYING: 'playing',         // Active gameplay
  ELIMINATED: 'eliminated',   // Waiting for star to rejoin
  SPECTATING: 'spectating',   // Future: watching others play
  ROUND_END: 'round_end',     // Showing results
  INTERMISSION: 'intermission' // Between rounds
};

/**
 * Round configuration constants for WebSocket Arena mode (multiplayer)
 * NOTE: These values mirror server's ARENA_CONFIG in ghost-orbits-manager.js
 * v4.8.1: In WS mode, always use server-provided values (roundTimeRemaining from state broadcasts)
 */
const ROUND_CONFIG = {
  countdownDuration: 3000,      // 3 seconds (matches server)
  roundDuration: 150000,        // 2.5 minutes (matches server)
  intermissionDuration: 10000,  // 10 seconds (matches server)
  minPlayers: 1,
  targetPlayers: 8,
  territoryThreshold: 0.70     // 70% territory to win (matches server)
};

/**
 * Win condition constants for SOLO MODE ONLY (vs Shadow Self)
 * v3 Dot Territory: Higher threshold + shorter rounds for fast-paced solo play
 * NOTE: These are NOT used in WS Arena mode - server is authoritative there
 */
const WIN_CONDITIONS = {
  DOT_THRESHOLD: 0.90,         // 90% dots = win (v3 solo)
  ROUND_DURATION: 120000,      // 120 seconds - faster paced than WS arena
  // Legacy (unused in v3):
  DOMINATION_THRESHOLD: 0.70,
  DOMINATION_HOLD_TIME: 5000,
  ABSORPTION_MASS_RATIO: 1.2
};

/**
 * Input key codes for movement
 */
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

/**
 * GhostOrbitsController class
 *
 * Orchestrates all Ghost Orbits game components and manages
 * the complete game lifecycle.
 */
export class GhostOrbitsController {
  /**
   * @param {Object} options - Controller options
   * @param {HTMLElement} options.container - Container element for the game overlay
   * @param {string} options.username - Current player's username
   * @param {string} options.cartridgeId - Current cartridge ID
   * @param {string} options.periodId - Class period ID
   * @param {Object} options.ghostProfile - Player's ghost profile from NN
   * @param {string} options.serverUrl - WebSocket server URL
   * @param {Function} [options.onExit] - Callback when player exits arena
   * @param {Function} [options.onStateChange] - Callback when game state changes
   */
  constructor(options) {
    // Required options
    this.container = options.container;
    this.username = options.username;
    this.cartridgeId = options.cartridgeId;
    this.periodId = options.periodId;
    this.ghostProfile = options.ghostProfile;
    this.serverUrl = options.serverUrl || this._getDefaultServerUrl();

    // Callbacks
    this.onExit = options.onExit || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // Game state
    this.state = GameState.IDLE;
    this.previousState = null;
    this.currentSessionGolds = 0;
    this.starsSpent = 0;        // Total stars consumed this session
    this.matchesPlayed = 0;     // Number of matches played (for escalating cost)
    this.needsRejoin = false;
    this.roundNumber = 0;

    // Arena state from server
    this.arenaState = null;
    this.playerList = new Map();
    this.eliminationInfo = null;
    this.roundResults = null;

    // Countdown state
    this.countdownValue = 0;
    this.countdownTimer = null;

    // Components (initialized in init())
    this.renderer = null;
    this.audio = null;
    this.panel = null;
    this.propertiesMapper = null;
    this.physicsEngine = null;
    this.territorySystem = null;

    // WebSocket
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
    this._reconnectTimeout = null;

    // Input handling
    this.inputEnabled = false;
    this.activeKeys = new Set();
    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._boundKeyUp = this._handleKeyUp.bind(this);

    // Ghost properties (derived from NN)
    this.ghostProperties = null;

    // Ghost movement state
    this.ghostMovementState = 'FREE_FLIGHT'; // FREE_FLIGHT or ORBITING

    // Dodge state (v2 Phase 3)
    this.isDodging = false;
    this.dodgeEndTime = 0;
    this.dodgeCooldownEnd = 0;

    // Void zone configuration (center of arena)
    this.voidZone = null;

    // Match state tracking (for solo mode win conditions)
    this.matchStartTime = null;
    this.matchTimeRemaining = null;
    this.dominationStartTime = new Map(); // playerId -> timestamp when domination began
    this.matchResult = null; // null, 'player_win', or 'shadow_win'
    this.winCondition = null; // 'domination', 'absorption', or 'timeout'

    // Lives system (v2 - trail collision takes a life, not instant death)
    this.playerLives = 3;
    this.shadowLives = 3;
    this.playerInvulnerableUntil = 0; // Brief invulnerability after being hit
    this.shadowInvulnerableUntil = 0;
    this.invulnerabilityDuration = 1500; // 1.5 seconds of invulnerability after hit

    // Match stats tracking (for stat leveling)
    this.matchStats = {
      energyDepletionCount: 0,      // Times energy hit 0
      territoryClaimRate: 0,         // Territory % per second
      timeSpentOrbiting: 0,          // Seconds in orbit vs free flight
      absorptionAttempts: 0,         // Near-collisions where mass was close
      totalGameTime: 0               // Total time for rate calculations
    };

    // Shadow Self (AI opponent) - now managed by ArenaMode
    this.shadowAI = null;
    this.shadowGhostId = 'shadow_self';
    this.shadowMovementState = 'FREE_FLIGHT';
    this.patternRecorder = null;
    this.lastPatternRecordTime = 0; // Throttle pattern recording
    this.shadowGeneration = 1; // Loaded from localStorage

    // Game mode (ArenaMode for solo vs Shadow Self)
    this.mode = null;

    // Bind methods for event handlers
    this._boundOnVisibilityChange = this._handleVisibilityChange.bind(this);
  }

  /**
   * Initialize all game components
   * @returns {Promise<void>}
   */
  async init() {
    console.log('[GhostOrbits] Initializing controller...');

    try {
      // Initialize ghost properties mapper
      console.log('[GhostOrbits] Creating properties mapper...');
      this.propertiesMapper = new GhostPropertiesMapper();

      // Calculate ghost properties from NN profile
      if (this.ghostProfile) {
        console.log('[GhostOrbits] Ghost profile has weights:', !!this.ghostProfile.weights);
        this.ghostProperties = this.propertiesMapper.mapProfile(this.ghostProfile);
        console.log('[GhostOrbits] Ghost properties:', this.ghostProperties);
        console.log('[GhostOrbits] Pattern generated:', !!this.ghostProperties?.pattern);
        if (this.ghostProperties?.pattern) {
          console.log('[GhostOrbits] Pattern size:', this.ghostProperties.pattern.width, 'x', this.ghostProperties.pattern.height);
        }

        // v3: Apply NN-influenced invulnerability duration from respawnSpeed property
        // respawnSpeed ranges from 1.2s (best) to 2.0s (worst)
        if (this.ghostProperties?.respawnSpeed !== undefined) {
          this.invulnerabilityDuration = this.ghostProperties.respawnSpeed * 1000; // Convert to ms
          console.log('[GhostOrbits] Invulnerability duration from NN:', this.invulnerabilityDuration, 'ms');
        }
      }

      // Load and apply saved ghost stat upgrades
      this._loadGhostStats();

      // Initialize HUD panel FIRST - it creates the overlay structure
      console.log('[GhostOrbits] Creating panel...');
      this.panel = new GhostOrbitsPanel({
        container: this.container,
        onClose: () => this.exitArena(),
        onReturnToPractice: () => this.exitArena(),
        onRematch: () => this._handleRematch()
      });
      await this.panel.init();
      console.log('[GhostOrbits] Panel created, overlayElement:', this.panel.overlayElement);

      // Store reference to the overlay the panel created
      this.overlay = this.container.querySelector('.ghost-orbits-overlay');
      console.log('[GhostOrbits] Overlay reference:', this.overlay);

      // Initialize audio
      console.log('[GhostOrbits] Creating audio...');
      this.audio = new GhostOrbitsAudio();
      this.audio.init();

      // Get arena size from renderer
      const arenaSize = this.renderer?.arena?.size || 800;

      // Initialize physics engine
      console.log('[GhostOrbits] Creating physics engine...');
      this.physicsEngine = new PhysicsEngine({
        width: arenaSize,
        height: arenaSize
      });

      // Initialize dots system (v3 - territory dots)
      console.log('[GhostOrbits] Creating dots system...');
      this.dotManager = new DotManager(arenaSize, { dotCount: 50, dotRadius: 10 });

      // Initialize territory system (legacy)
      console.log('[GhostOrbits] Creating territory system...');
      this.territorySystem = new TerritorySystem(arenaSize, arenaSize);

      // Initialize renderer into panel's arena container
      const canvasContainer = this.panel.getArenaContainer();
      console.log('[GhostOrbits] Arena container:', canvasContainer);
      if (canvasContainer) {
        console.log('[GhostOrbits] Creating renderer...');
        this.renderer = new GhostOrbitsRenderer({
          container: canvasContainer,
          ghostProperties: this.ghostProperties,
          onWallBounce: (ghost) => {
            if (this.audio) this.audio.playBounce();
          }
        });
        await this.renderer.init();
        console.log('[GhostOrbits] Renderer created');

        // Setup physics callback so gravity wells work each frame
        this.renderer.setPhysicsCallback((deltaTime, currentTime) => {
          this._updatePhysicsFrame(deltaTime, currentTime);
        });

        // Setup initial arena configuration (after renderer is ready)
        this._setupInitialArena(arenaSize);

        // Sync wells and void zone to renderer
        this.renderer.updateWells(this.physicsEngine.getWells());
        this.renderer.updateVoidZone(this.voidZone);
      } else {
        console.warn('[GhostOrbits] No arena container found!');
      }

      // Load star economy state (persists across page loads)
      this._loadStarEconomy();

      // Setup visibility change handler
      document.addEventListener('visibilitychange', this._boundOnVisibilityChange);

      console.log('[GhostOrbits] Controller initialized successfully');
    } catch (error) {
      console.error('[GhostOrbits] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get the cost for the next match (escalating: 1, 2, 3, 4...)
   * @returns {number} Star cost for the next match
   */
  getNextMatchCost() {
    return this.matchesPlayed + 1;
  }

  /**
   * Get available stars
   * @returns {number} Stars available to spend
   */
  getAvailableStars() {
    // Stars are directly consumed from currentSessionGolds, so available = current
    return this.currentSessionGolds;
  }

  /**
   * Check if player can afford the next match
   * @returns {boolean} True if player has enough stars
   */
  canAffordNextMatch() {
    return this.getAvailableStars() >= this.getNextMatchCost();
  }

  /**
   * Check if arena is currently unlocked for the player
   * @returns {boolean}
   */
  isUnlocked() {
    return this.canAffordNextMatch();
  }

  /**
   * Consume stars for entering a match
   * @private
   */
  _consumeStarsForMatch() {
    const cost = this.getNextMatchCost();
    this.matchesPlayed++;

    // Actually consume the stars (reduce the count, don't just track as "spent")
    this.currentSessionGolds -= cost;

    console.log(`[GhostOrbits] Consumed ${cost} stars. Remaining: ${this.currentSessionGolds}, Matches played: ${this.matchesPlayed}, Next cost: ${this.getNextMatchCost()}`);

    // Update the visual gold count
    const goldCountEl = document.getElementById('gold-count');
    if (goldCountEl) {
      goldCountEl.textContent = this.currentSessionGolds;
      console.log(`[GhostOrbits] Updated gold display to ${this.currentSessionGolds}`);
    }
  }

  /**
   * Update gold star counts
   * @param {number} currentGolds - Current session gold count
   */
  updateGoldCount(currentGolds) {
    this.currentSessionGolds = currentGolds;

    // If eliminated and earned a star, trigger rejoin
    if (this.needsRejoin && this.state === GameState.ELIMINATED) {
      this.handleStarEarned();
    }
  }

  /**
   * Enter the arena - show overlay and connect to server
   * @returns {Promise<void>}
   */
  async enterArena() {
    console.log('[GhostOrbits] enterArena() called, state:', this.state);

    if (this.state !== GameState.IDLE) {
      console.warn('[GhostOrbits] Cannot enter arena - not in IDLE state');
      return;
    }

    if (!this.isUnlocked()) {
      console.warn('[GhostOrbits] Cannot enter arena - not enough stars');
      return;
    }

    // Consume stars for this match
    const cost = this.getNextMatchCost();
    console.log(`[GhostOrbits] Entering arena (cost: ${cost} stars)...`);
    this._consumeStarsForMatch();

    // Show overlay
    console.log('[GhostOrbits] Calling _showOverlay()...');
    this._showOverlay();
    console.log('[GhostOrbits] Overlay should now be visible');

    // Enable input
    this._enableInput();

    // Update generation display
    if (this.panel) {
      this.panel.updateGeneration(this.shadowGeneration);
    }

    // Add local player's ghost to the renderer
    if (this.renderer) {
      const arenaSize = this.renderer.arena?.size || 800;
      // Player spawns bottom-left area
      const playerSpawnX = arenaSize * 0.2;
      const playerSpawnY = arenaSize * 0.8;

      console.log('[GhostOrbits] Adding local ghost at', playerSpawnX, playerSpawnY);
      console.log('[GhostOrbits] Ghost properties:', this.ghostProperties);
      this.renderer.addGhost({
        id: this.username || 'player',
        x: playerSpawnX,
        y: playerSpawnY,
        color: this.ghostProperties?.color || '#4488ff',
        tier: this.ghostProperties?.tier || 0,
        pattern: this.ghostProperties?.pattern || null,
        nnProperties: {
          mass: this.ghostProperties?.mass || 1.0,
          thrustEfficiency: this.ghostProperties?.thrustEfficiency || 1.0,
          trailDuration: this.ghostProperties?.trailDuration || 1.0,
          energyRegen: this.ghostProperties?.energyRegen || 1.0,
          trailWidth: this.ghostProperties?.trailWidth || 1.0
        }
      }, true); // true = this is the local player's ghost

      // Spawn Shadow Self (AI opponent) in solo mode
      this._spawnShadow(arenaSize);

      // Initialize ArenaMode (manages dots, shadow AI, lives, win conditions)
      await this._initArenaMode(arenaSize);

      // Verify ghosts were created
      console.log('[GhostOrbits] Ghost creation verification:', {
        ghostsCount: this.renderer.ghosts?.size,
        localGhostId: this.renderer.localGhostId,
        localGhostExists: !!this.renderer.getLocalGhost(),
        shadowGhostExists: !!this.renderer.ghosts?.get(this.shadowGhostId),
        ghostIds: Array.from(this.renderer.ghosts?.keys() || [])
      });

      // Start the renderer animation loop
      this.renderer.start();
      console.log('[GhostOrbits] Renderer started, isRunning:', this.renderer.isRunning);
    }

    // Solo mode - no WebSocket, start immediately
    console.log('[GhostOrbits] Starting solo mode vs Shadow Self');
    this.startMatchTimer();

    // Set to playing state (allows input)
    this._setState(GameState.PLAYING);
  }

  /**
   * Exit the arena and return to practice mode
   */
  exitArena() {
    console.log('[GhostOrbits] Exiting arena...');

    // Send leave message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this._sendMessage({ type: 'leave_arena' });
    }

    // Clean up
    this._disconnectWebSocket();
    this._disableInput();
    this._hideOverlay();
    this._clearCountdown();

    // Reset state
    this.needsRejoin = false;
    this.arenaState = null;
    this.eliminationInfo = null;
    this.roundResults = null;

    // Reset escalating cost counter (only applies to consecutive rematches within a session)
    this.matchesPlayed = 0;
    this.starsSpent = 0;

    // Save star economy state
    this._saveStarEconomy();

    this._setState(GameState.IDLE);

    // Notify callback
    this.onExit();
  }

  /**
   * Handle player elimination
   * @param {Object} info - Elimination info from server
   */
  handleElimination(info) {
    console.log('[GhostOrbits] Player eliminated:', info);

    this.eliminationInfo = info;
    this.needsRejoin = true;
    this._setState(GameState.ELIMINATED);

    // Play elimination sound
    if (this.audio) {
      this.audio.playEliminated();
    }

    // Update panel to show elimination UI
    if (this.panel) {
      this.panel.showEliminated({
        eliminatedBy: info.by,
        finalTerritory: info.territoryPercent,
        timeRemaining: Math.ceil((info.roundTimeRemaining || 0) / 1000),
        playersRemaining: info.playersAlive || 0,
        placement: info.placement || '?'
      });
    }

    // Disable input but keep watching
    this.inputEnabled = false;
  }

  /**
   * Handle gold star earned while eliminated (rejoin trigger)
   */
  handleStarEarned() {
    if (!this.needsRejoin || this.state !== GameState.ELIMINATED) {
      return;
    }

    console.log('[GhostOrbits] Star earned - requesting rejoin');
    this.needsRejoin = false;

    // Send rejoin request to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this._sendMessage({ type: 'earned_star' });
    }

    // Re-enable input
    this.inputEnabled = true;

    // Play rejoin sound
    if (this.audio) {
      this.audio.playRejoin();
    }
  }

  /**
   * Update ghost profile (called when NN updates)
   * @param {Object} profile - Updated ghost profile
   */
  updateGhostProfile(profile) {
    this.ghostProfile = profile;

    if (this.propertiesMapper) {
      this.ghostProperties = this.propertiesMapper.mapProfile(profile);

      // Update renderer with new properties
      if (this.renderer) {
        this.renderer.updateLocalGhostProperties(this.ghostProperties);
      }
    }
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose() {
    console.log('[GhostOrbits] Disposing controller...');

    // Exit arena if active
    if (this.state !== GameState.IDLE) {
      this.exitArena();
    }

    // Remove event listeners
    document.removeEventListener('visibilitychange', this._boundOnVisibilityChange);
    this._disableInput();

    // Dispose components
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    if (this.audio) {
      // Audio doesn't have dispose, just clear reference
      this.audio = null;
    }

    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }

    // Stop pattern recorder
    if (this.patternRecorder) {
      this.patternRecorder.stop();
      this.patternRecorder = null;
    }

    this.overlay = null;

    // Clear state
    this.arenaState = null;
    this.playerList.clear();
  }

  // ============================================
  // ARENA SETUP
  // ============================================

  /**
   * Setup initial arena with Records (spinning plates) - v2 style
   * @param {number} arenaSize - Arena size in pixels
   * @private
   */
  _setupInitialArena(arenaSize) {
    console.log('[GhostOrbits] Setting up v2 arena with Records...');

    // Add 8 Records covering the arena (4 corners + 4 sides for more maneuvering space)
    const recordPositions = [
      // Corner records
      { x: arenaSize * 0.2, y: arenaSize * 0.2, clockwise: false },
      { x: arenaSize * 0.8, y: arenaSize * 0.2, clockwise: true },
      { x: arenaSize * 0.2, y: arenaSize * 0.8, clockwise: true },
      { x: arenaSize * 0.8, y: arenaSize * 0.8, clockwise: false },
      // Side records
      { x: arenaSize * 0.15, y: arenaSize * 0.5, clockwise: true },
      { x: arenaSize * 0.85, y: arenaSize * 0.5, clockwise: false },
      { x: arenaSize * 0.5, y: arenaSize * 0.15, clockwise: true },
      { x: arenaSize * 0.5, y: arenaSize * 0.85, clockwise: false },
    ];

    for (let i = 0; i < recordPositions.length; i++) {
      const pos = recordPositions[i];
      this.physicsEngine.addRecord({
        id: `record_${i}`,
        x: pos.x,
        y: pos.y,
        radius: 40,
        captureRadius: 60,
        clockwise: pos.clockwise,
        angularSpeed: 2.0 + Math.random() * 1.0,
      });
    }

    // No void zone in v2
    this.voidZone = null;

    // Initialize dots (v2) - pass records to avoid spawning on top
    if (this.dotManager) {
      this.dotManager.initialize(this.physicsEngine.getRecords());
      console.log('[GhostOrbits] Initialized', this.dotManager.getDots().length, 'dots');
    }

    console.log('[GhostOrbits] Arena setup complete with', recordPositions.length, 'records');
  }

  /**
   * Spawn Shadow Self AI opponent
   * @param {number} arenaSize - Arena size in pixels
   * @private
   */
  _spawnShadow(arenaSize) {
    // Load shadow generation from localStorage
    this._loadShadowGeneration();

    // Shadow spawns at opposite side from player, but NOT near neutral well corners
    // Neutral wells are at 15% and 85% margins, so spawn at ~70% to avoid them
    // Also place slightly lower (35%) to give room to maneuver
    const shadowSpawnX = arenaSize * 0.70;
    const shadowSpawnY = arenaSize * 0.35;

    // Get complementary color for shadow
    const playerColor = this.ghostProperties?.color || '#4488ff';
    const shadowColor = this._getComplementaryColor(playerColor);

    console.log(`[GhostOrbits] Spawning Shadow Self (Gen ${this.shadowGeneration}) at`, shadowSpawnX, shadowSpawnY);
    console.log('[GhostOrbits] Shadow color:', shadowColor, '(complement of', playerColor, ')');

    // Set owner colors for dot territory system (v3)
    if (this.dotManager) {
      this.dotManager.setOwnerColors(playerColor, shadowColor);
    }

    // Add shadow ghost to renderer with same properties as player
    this.renderer.addGhost({
      id: this.shadowGhostId,
      x: shadowSpawnX,
      y: shadowSpawnY,
      color: shadowColor,
      tier: this.ghostProperties?.tier || 0,
      pattern: this.ghostProperties?.pattern || null,
      isShadow: true, // Flag for special rendering
      nnProperties: {
        mass: this.ghostProperties?.mass || 1.0,
        thrustEfficiency: this.ghostProperties?.thrustEfficiency || 1.0,
        trailDuration: this.ghostProperties?.trailDuration || 1.0,
        energyRegen: this.ghostProperties?.energyRegen || 1.0,
        trailWidth: this.ghostProperties?.trailWidth || 1.0
      }
    }, false); // false = not local player

    // NOTE: ShadowAI and PatternRecorder are now created by ArenaMode
    // which is initialized in _initArenaMode() after this method
    console.log('[GhostOrbits] Shadow ghost added to renderer');
  }

  /**
   * Initialize ArenaMode for solo vs Shadow Self gameplay
   * @param {number} arenaSize - Arena size in pixels
   * @private
   */
  async _initArenaMode(arenaSize) {
    // Load shadow generation from localStorage
    this._loadShadowGeneration();

    // Load stored patterns
    const storedPatterns = this._loadStoredPatterns();

    // Create and initialize ArenaMode
    this.mode = new ArenaMode({
      arenaSize,
      ghostProperties: this.ghostProperties,
      cartridgeId: this.cartridgeId,
      username: this.username,
      physicsEngine: this.physicsEngine,
      patterns: storedPatterns,
      shadowGeneration: this.shadowGeneration
    });

    await this.mode.init({ arenaSize, physicsEngine: this.physicsEngine });

    // Sync mode's dotManager with controller's dotManager reference
    this.dotManager = this.mode.getDotManager();

    // Sync mode's shadowAI with controller's reference (for compatibility)
    this.shadowAI = this.mode.getShadowAI();
    this.patternRecorder = this.mode.getPatternRecorder();

    console.log('[GhostOrbits] ArenaMode initialized');
  }

  /**
   * Get complementary color (180° rotation on color wheel)
   * @param {string} hexColor - Hex color string (#RRGGBB)
   * @returns {string} Complementary hex color
   * @private
   */
  _getComplementaryColor(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Convert RGB to HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;

    let h, s;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
      }
    }

    // Rotate hue by 180° (0.5)
    h = (h + 0.5) % 1;

    // Convert HSL back to RGB
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
      rOut = gOut = bOut = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      rOut = hue2rgb(p, q, h + 1/3);
      gOut = hue2rgb(p, q, h);
      bOut = hue2rgb(p, q, h - 1/3);
    }

    // Convert to hex
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`;
  }

  /**
   * Load shadow generation from localStorage
   * @private
   */
  _loadShadowGeneration() {
    const key = `${this.cartridgeId}_shadow_generation`;
    const stored = localStorage.getItem(key);
    this.shadowGeneration = stored ? parseInt(stored, 10) : 1;
  }

  /**
   * Save shadow generation to localStorage
   * @private
   */
  _saveShadowGeneration() {
    const key = `${this.cartridgeId}_shadow_generation`;
    localStorage.setItem(key, this.shadowGeneration.toString());
  }

  /**
   * Load stored player patterns from localStorage
   * @returns {Array} Array of pattern chunks
   * @private
   */
  _loadStoredPatterns() {
    const key = `${this.cartridgeId}_shadow_patterns`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('[GhostOrbits] Failed to parse stored patterns:', e);
      }
    }
    return [];
  }

  /**
   * Save player patterns to localStorage
   * @param {Array} patterns - Pattern chunks to save
   * @private
   */
  _saveStoredPatterns(patterns) {
    const key = `${this.cartridgeId}_shadow_patterns`;
    try {
      // Keep only last 20 chunks to avoid storage bloat
      const trimmed = patterns.slice(-20);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[GhostOrbits] Failed to save patterns:', e);
    }
  }

  // ============================================
  // STATE MACHINE
  // ============================================

  /**
   * Set the game state
   * @param {string} newState - New game state
   * @private
   */
  _setState(newState) {
    if (this.state === newState) return;

    this.previousState = this.state;
    this.state = newState;

    console.log(`[GhostOrbits] State: ${this.previousState} -> ${newState}`);

    // Notify callback
    this.onStateChange(newState, this.previousState);

    // Handle state-specific logic
    this._handleStateTransition(newState);
  }

  /**
   * Handle state transition side effects
   * @param {string} state - New state
   * @private
   */
  _handleStateTransition(state) {
    switch (state) {
      case GameState.CONNECTING:
        // Show connecting indicator (panel will show loading state)
        this.inputEnabled = false;
        break;

      case GameState.COUNTDOWN:
        // Input disabled during countdown
        this.inputEnabled = false;
        break;

      case GameState.PLAYING:
        // Enable input for gameplay
        this.inputEnabled = true;
        // Start renderer animation loop
        if (this.renderer) {
          this.renderer.start();
        }
        // Start match timer for solo mode
        if (this.previousState === GameState.COUNTDOWN || this.previousState === GameState.CONNECTING) {
          this.startMatchTimer();
        }
        break;

      case GameState.ELIMINATED:
        // Input disabled, show elimination UI
        this.inputEnabled = false;
        break;

      case GameState.ROUND_END:
        // Input disabled during results
        this.inputEnabled = false;
        break;

      case GameState.INTERMISSION:
        // Waiting for next round
        this.inputEnabled = false;
        break;

      case GameState.IDLE:
        // Clean state
        this.inputEnabled = false;
        this.needsRejoin = false;
        // Stop renderer
        if (this.renderer) {
          this.renderer.stop();
        }
        break;
    }
  }

  // ============================================
  // WEBSOCKET COMMUNICATION
  // ============================================

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>}
   * @private
   */
  _connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = this._buildWebSocketUrl();
      console.log('[GhostOrbits] Connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[GhostOrbits] WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        this._handleWebSocketMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('[GhostOrbits] WebSocket closed:', event.code);
        this._handleWebSocketClose(event);
      };

      this.ws.onerror = (error) => {
        console.error('[GhostOrbits] WebSocket error:', error);
        reject(error);
      };

      // Timeout for connection
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Disconnect WebSocket
   * @private
   */
  _disconnectWebSocket() {
    // Clear any pending reconnect timeout
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect attempts
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event
   * @private
   */
  _handleWebSocketClose(event) {
    // Don't reconnect if intentionally closed or in IDLE state
    if (this.state === GameState.IDLE) return;

    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[GhostOrbits] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      // Clear any existing reconnect timeout to prevent accumulation
      if (this._reconnectTimeout) {
        clearTimeout(this._reconnectTimeout);
      }

      this._reconnectTimeout = setTimeout(() => {
        this._reconnectTimeout = null;
        this._connectWebSocket()
          .then(() => {
            // Re-send join message
            this._sendMessage({
              type: 'join_arena',
              cartridgeId: this.cartridgeId,
              periodId: this.periodId,
              username: this.username,
              ghostProfile: this.ghostProfile,
              rejoin: true
            });
          })
          .catch(() => {
            this._handleWebSocketClose(event);
          });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[GhostOrbits] Max reconnection attempts reached');
      this.exitArena();
    }
  }

  /**
   * Send message to server
   * @param {Object} message - Message to send
   * @private
   */
  _sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {string} data - Raw message data
   * @private
   */
  _handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'arena_state':
          this._handleArenaState(message);
          break;

        case 'round_start':
          this._handleRoundStart(message);
          break;

        case 'round_end':
          this._handleRoundEnd(message);
          break;

        case 'eliminated':
          this._handleEliminatedMessage(message);
          break;

        case 'player_joined':
          this._handlePlayerJoined(message);
          break;

        case 'player_left':
          this._handlePlayerLeft(message);
          break;

        case 'rejoin_accepted':
          this._handleRejoinAccepted(message);
          break;

        case 'countdown':
          this._handleCountdown(message);
          break;

        case 'intermission':
          this._handleIntermission(message);
          break;

        case 'error':
          this._handleServerError(message);
          break;

        default:
          console.log('[GhostOrbits] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[GhostOrbits] Failed to parse message:', error);
    }
  }

  /**
   * Handle arena_state message
   * @param {Object} message
   * @private
   */
  _handleArenaState(message) {
    this.arenaState = {
      ghosts: message.ghosts || [],
      trails: message.trails || [],
      territory: message.territory || {},
      arenaSize: message.arenaSize || 800,
      roundTimeRemaining: message.roundTimeRemaining
    };

    // Update game systems
    this._updateGameSystems();

    // Update renderer
    if (this.renderer) {
      this.renderer.updateState(this.arenaState);
    }

    // Update panel with territory info (convert to array format panel expects)
    if (this.panel && this.arenaState.territory) {
      const territories = Object.entries(this.arenaState.territory).map(([username, data]) => ({
        username,
        percent: data.percent || 0,
        color: data.color || '#4488ff',
        isPlayer: username === this.username
      }));
      this.panel.updateTerritory(territories);

      if (typeof this.arenaState.roundTimeRemaining === 'number') {
        this.panel.updateTimer(Math.ceil(this.arenaState.roundTimeRemaining / 1000));
      }
    }
  }

  /**
   * Update physics each frame (called from renderer's game loop)
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {number} currentTime - Current timestamp
   * @private
   */
  _updatePhysicsFrame(deltaTime, currentTime) {
    // Don't process physics if match has ended
    if (this.state !== GameState.PLAYING) {
      return;
    }

    if (!this.physicsEngine || !this.territorySystem) {
      return;
    }

    const localGhost = this.renderer?.getLocalGhost();
    if (!localGhost) return;

    // Handle dodge timing
    if (this.isDodging && currentTime >= this.dodgeEndTime) {
      // Dodge duration expired - end dodge
      this.isDodging = false;

      // Restore normal speed (remove the boost multiplier)
      const speedReduction = 1 / PHYSICS.DODGE_SPEED_MULTIPLIER;
      localGhost.velocity.x *= speedReduction;
      localGhost.velocity.y *= speedReduction;

      // Return to previous movement state (FREE_FLIGHT or ORBITING)
      if (this.ghostMovementState === 'DODGING') {
        // Determine if ghost is currently orbiting
        if (this.physicsEngine.isGhostOrbiting?.(this.username)) {
          this.ghostMovementState = 'ORBITING';
        } else {
          this.ghostMovementState = 'FREE_FLIGHT';
        }
      }

      console.log('[GhostOrbits] Dodge ended, returned to normal speed');
    }

    // v2: No automatic trail dropping - trails only come from collected dots
    // Territory system disabled in v2

    // Check for wells to spawn from territory (disabled in v2)
    const wellsToSpawn = [];
    if (wellsToSpawn.length > 0) {
      console.log('[Territory Debug] Wells to spawn:', wellsToSpawn);
    }
    for (const wellInfo of wellsToSpawn) {
      this.physicsEngine.addWell({
        id: wellInfo.id,
        x: wellInfo.x,
        y: wellInfo.y,
        type: wellInfo.type,
        ownerId: wellInfo.ownerId
      });
      if (this.audio) this.audio.playWellSpawn?.();
    }

    // Check for wells to despawn
    const wellsToDespawn = this.territorySystem.getWellsToDespawn();
    for (const wellId of wellsToDespawn) {
      this.physicsEngine.removeWell(wellId);
    }

    // Clear the spawn queues
    this.territorySystem.clearWellSpawnQueue();

    // Sync wells to renderer
    this.renderer.updateWells(this.physicsEngine.getWells());

    // Prepare player ghost data for physics engine
    const ghostData = {
      id: this.username,
      x: localGhost.position.x,
      y: localGhost.position.y,
      vx: localGhost.velocity.x,
      vy: localGhost.velocity.y,
      ownerId: this.username,
      mass: localGhost.mass
    };

    // Get shadow ghost from renderer
    const shadowGhost = this.renderer?.ghosts?.get(this.shadowGhostId);
    let shadowData = null;

    // Get AI decision from mode (mode owns ShadowAI and PatternRecorder)
    // Mode.step() runs regardless of shadowGhost, so dot logic always executes
    if (this.mode) {
      // Build input state for mode's AI update
      const modeInput = {
        ghostMovementState: this.ghostMovementState,
        shadowMovementState: this.shadowMovementState,
        shadowGhost: shadowGhost,
        activeKeys: this.activeKeys
      };

      // Mode updates ShadowAI and returns decision (single source of truth)
      this.mode.step(deltaTime, currentTime, localGhost, modeInput);

      // Apply AI decision from mode (only if shadow exists)
      const aiDecision = modeInput.aiDecision;
      if (shadowGhost) {
        // Check if shadow should release from orbit
        if (this.shadowMovementState === 'ORBITING') {
          const releaseDir = aiDecision?.releaseDirection;
          if (releaseDir) {
            console.log(`[GhostOrbits] Shadow AI releasing from orbit: ${releaseDir}`);
            const releaseVel = this.physicsEngine.releaseFromOrbit(this.shadowGhostId, releaseDir);
            if (releaseVel) {
              shadowGhost.velocity.x = releaseVel.x;
              shadowGhost.velocity.y = releaseVel.y;
              this.shadowMovementState = 'FREE_FLIGHT';
            }
          }
        }

        // Apply AI input to shadow ghost (if in free flight)
        if (this.shadowMovementState === 'FREE_FLIGHT') {
          const aiInput = aiDecision?.inputDirection;
          if (aiInput && (aiInput.x !== 0 || aiInput.y !== 0)) {
            shadowGhost.applyThrust(aiInput);
          }
        }
      }

      // Handle player interaction results from mode
      if (modeInput.playerInteraction) {
        const interaction = modeInput.playerInteraction;
        if (interaction.type === 'claimed') {
          if (this.audio) this.audio.playOrbitCapture?.();
        } else if (interaction.type === 'flipped') {
          console.log('[GhostOrbits] Player flipped enemy dot!');
          if (this.audio) this.audio.playVictory?.();
        } else if (interaction.type === 'damaged' && modeInput.damageResult) {
          const damageResult = modeInput.damageResult;
          console.log(`[GhostOrbits] Player damaged! Lives remaining: ${damageResult.livesRemaining}`);

          // Sync lives from mode
          this.playerLives = damageResult.livesRemaining;
          this.playerInvulnerableUntil = damageResult.invulnerableUntil;

          if (this.panel?.updateLives) {
            this.panel.updateLives(this.playerLives);
          }
          if (this.renderer?.flashGhost) {
            this.renderer.flashGhost(this.username, '#ff4444', 300);
          }
          if (this.audio) this.audio.playDamage?.();
        }
      }

      // Handle shadow interaction results from mode
      if (modeInput.shadowInteraction) {
        const interaction = modeInput.shadowInteraction;
        if (interaction.type === 'flipped') {
          console.log('[GhostOrbits] Shadow flipped player dot!');
        } else if (interaction.type === 'damaged' && modeInput.shadowDamageResult) {
          const damageResult = modeInput.shadowDamageResult;
          console.log(`[GhostOrbits] Shadow damaged! Lives remaining: ${damageResult.livesRemaining}`);

          // Sync lives from mode
          this.shadowLives = damageResult.livesRemaining;
          this.shadowInvulnerableUntil = damageResult.invulnerableUntil;

          if (this.renderer?.flashGhost) {
            this.renderer.flashGhost(this.shadowGhostId, '#ff4444', 300);
          }
        }
      }

      // Sync dots to renderer
      const renderData = this.mode.getRenderData();
      this.renderer?.updateDots?.(renderData.dots);

      // Check for match end via mode
      const endCondition = this.mode.checkEndCondition();
      if (endCondition.ended) {
        // Convert winner dots
        const winner = endCondition.winner === 'player' ? 'player' : 'shadow';
        const winnerColor = winner === 'player'
          ? (localGhost.color || '#4488ff')
          : (shadowGhost?.color || '#ff4444');
        this.dotManager.convertAllToWinner(winner, winnerColor);
        this.renderer?.updateDots?.(this.dotManager.getDots());

        const result = endCondition.winner === 'player' ? 'player_win' : 'shadow_win';
        this._handleMatchEnd(result, endCondition.reason);
        return;
      }

      // Update UI with scoreboard from mode
      const scoreboard = this.mode.getScoreboard();
      if (this.panel) {
        if (this.panel.updateDotCounts) {
          this.panel.updateDotCounts(scoreboard.playerScore, scoreboard.opponentScore, scoreboard.totalDots);
        }
        if (this.panel.updateLives) {
          this.panel.updateLives(scoreboard.playerLives);
        }
        if (scoreboard.timeRemaining !== undefined) {
          const secondsRemaining = Math.ceil(scoreboard.timeRemaining / 1000);
          this.panel.updateTimer(secondsRemaining);
        }
      }

      // Sync lives from mode (in case mode updated them)
      this.playerLives = scoreboard.playerLives;
      this.shadowLives = scoreboard.opponentLives;
      this.matchTimeRemaining = scoreboard.timeRemaining;

      // Apply magnetism force from mode (pulls toward neutral dots)
      if (modeInput.magnetismForce) {
        localGhost.velocity.x += modeInput.magnetismForce.x;
        localGhost.velocity.y += modeInput.magnetismForce.y;
      }

      // Prepare shadow data for physics
      if (shadowGhost) {
        shadowData = {
          id: this.shadowGhostId,
          x: shadowGhost.position.x,
          y: shadowGhost.position.y,
          vx: shadowGhost.velocity.x,
          vy: shadowGhost.velocity.y,
          ownerId: this.shadowGhostId,
          mass: shadowGhost.mass
        };
      }
    } else if (shadowGhost) {
      // Legacy: No mode, just prepare shadow data
      shadowData = {
        id: this.shadowGhostId,
        x: shadowGhost.position.x,
        y: shadowGhost.position.y,
        vx: shadowGhost.velocity.x,
        vy: shadowGhost.velocity.y,
        ownerId: this.shadowGhostId,
        mass: shadowGhost.mass
      };
    }

    // Update physics engine with both ghosts
    const ghostsToUpdate = shadowData ? [ghostData, shadowData] : [ghostData];
    this.physicsEngine.update(ghostsToUpdate, deltaTime);

    // Check if player ghost is in locked orbit
    if (this.physicsEngine.isGhostOrbiting(this.username)) {
      if (this.ghostMovementState !== 'ORBITING') {
        console.log('[GhostOrbits] Ghost locked into stable orbit');
        this.ghostMovementState = 'ORBITING';
        this.renderer.updateGhostOrbitState?.(this.username, true);
        if (this.audio) this.audio.playOrbitCapture?.();
      }
      localGhost.position.x = ghostData.x;
      localGhost.position.y = ghostData.y;
      localGhost.velocity.x = ghostData.vx;
      localGhost.velocity.y = ghostData.vy;
    } else {
      if (this.ghostMovementState !== 'FREE_FLIGHT') {
        console.log('[GhostOrbits] Ghost released from orbit');
        this.ghostMovementState = 'FREE_FLIGHT';
        this.renderer.updateGhostOrbitState?.(this.username, false);
      }
      localGhost.velocity.x = ghostData.vx;
      localGhost.velocity.y = ghostData.vy;
    }

    // Check if shadow ghost is in locked orbit
    if (shadowGhost && shadowData) {
      if (this.physicsEngine.isGhostOrbiting(this.shadowGhostId)) {
        if (this.shadowMovementState !== 'ORBITING') {
          console.log('[GhostOrbits] Shadow locked into orbit');
          this.shadowMovementState = 'ORBITING';
          this.shadowAI?.enterOrbit?.();
        }
        shadowGhost.position.x = shadowData.x;
        shadowGhost.position.y = shadowData.y;
        shadowGhost.velocity.x = shadowData.vx;
        shadowGhost.velocity.y = shadowData.vy;
      } else {
        if (this.shadowMovementState !== 'FREE_FLIGHT') {
          this.shadowMovementState = 'FREE_FLIGHT';
        }
        shadowGhost.velocity.x = shadowData.vx;
        shadowGhost.velocity.y = shadowData.vy;
      }

      // Update shadow energy
      shadowGhost.updateEnergy(deltaTime);
    }

    // Check void zone for player (drain energy if inside)
    if (this.voidZone) {
      const dx = localGhost.position.x - this.voidZone.x;
      const dy = localGhost.position.y - this.voidZone.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.voidZone.radius) {
        const drainAmount = this.voidZone.energyDrain * deltaTime;
        localGhost.energy = Math.max(0, localGhost.energy - drainAmount);
      }

      // Check void zone for shadow too
      if (shadowGhost) {
        const sdx = shadowGhost.position.x - this.voidZone.x;
        const sdy = shadowGhost.position.y - this.voidZone.y;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);

        if (sdist < this.voidZone.radius) {
          const drainAmount = this.voidZone.energyDrain * deltaTime;
          shadowGhost.energy = Math.max(0, shadowGhost.energy - drainAmount);
        }
      }
    }

    // NOTE: Dot magnetism is now handled by ArenaMode.step() and returned via modeInput.magnetismForce
    // The controller applies it in the mode handling block above

    // Track match stats for stat leveling (legacy: only runs without mode)
    if (this.state === GameState.PLAYING && this.matchStartTime && !this.mode) {
      this._trackMatchStats(localGhost, shadowGhost, deltaTime);

      // Update timer display in solo mode
      if (this.panel && this.matchTimeRemaining !== null) {
        const secondsRemaining = Math.ceil(this.matchTimeRemaining / 1000);
        this.panel.updateTimer(secondsRemaining);
      }
    }

    // Check win conditions (only in PLAYING state for solo mode, and only if no mode)
    if (this.state === GameState.PLAYING && this.matchStartTime && !this.mode) {
      this._checkWinConditions(currentTime);
    }
  }

  /**
   * Record player pattern for Shadow AI learning
   * @private
   */
  _recordPlayerPattern(localGhost, currentTime) {
    if (!this.patternRecorder) return;

    // Throttle to once every 100ms to reduce per-frame allocations
    // (60fps = ~6 frames between records, reduces allocations by ~83%)
    if (currentTime - this.lastPatternRecordTime < 100) return;
    this.lastPatternRecordTime = currentTime;

    const shadowGhost = this.renderer?.ghosts?.get(this.shadowGhostId);

    // Calculate context data
    let nearestWellDist = Infinity;
    for (const well of this.physicsEngine.getWells()) {
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

    let voidDist = Infinity;
    if (this.voidZone) {
      const dx = localGhost.position.x - this.voidZone.x;
      const dy = localGhost.position.y - this.voidZone.y;
      voidDist = Math.sqrt(dx * dx + dy * dy);
    }

    // Get current input direction
    let inputDir = null;
    if (this.activeKeys.size > 0) {
      inputDir = { x: 0, y: 0 };
      for (const key of this.activeKeys) {
        const dir = INPUT_KEYS[key];
        if (dir) {
          inputDir.x += dir.x;
          inputDir.y += dir.y;
        }
      }
    }

    // v4.8.1: Use dotManager for v3 territory (dot ownership), fallback to legacy territorySystem
    const territoryPercent = this.dotManager
      ? this.dotManager.getOwnershipPercent('player')
      : (this.territorySystem?.getTerritoryPercent?.(this.username) || 0);

    this.patternRecorder.record({
      timestamp: currentTime,
      x: localGhost.position.x,
      y: localGhost.position.y,
      vx: localGhost.velocity.x,
      vy: localGhost.velocity.y,
      inputDirection: inputDir,
      state: this.ghostMovementState === 'ORBITING' ? 'orbiting' : 'free',
      energy: localGhost.energy,
      nearestWellDistance: nearestWellDist,
      territoryPercent: territoryPercent,
      enemyDistance: enemyDist,
      enemyMassRatio: enemyMassRatio,
      voidDistance: voidDist
    });
  }

  /**
   * Build game state object for Shadow AI
   * @private
   */
  _buildShadowGameState(localGhost, shadowGhost) {
    const wells = this.physicsEngine.getWells().map(w => ({
      position: w.position,
      ownerId: w.ownerId,
      type: w.type
    }));

    // v4.8.1: Use dotManager for v3 territory (dot ownership), fallback to legacy territorySystem
    const territoryPercent = this.dotManager
      ? this.dotManager.getOwnershipPercent('shadow')
      : (this.territorySystem?.getTerritoryPercent?.(this.shadowGhostId) || 0);

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
      wells: wells,
      territoryPercent: territoryPercent,
      voidX: this.voidZone?.x || 0,
      voidY: this.voidZone?.y || 0
    };
  }

  /**
   * Check if shadow is near a player-owned dot (for flip mechanic AI)
   * @param {Object} shadowGhost - Shadow ghost object
   * @returns {boolean}
   * @private
   */
  _isShadowNearEnemyDot(shadowGhost) {
    if (!this.dotManager || !shadowGhost) return false;

    const dots = this.dotManager.getDots();
    const checkRadius = DOT_CONFIG.COLLISION_RADIUS * 2; // Look ahead a bit

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
   * Update game systems from server state (WebSocket)
   * @private
   */
  _updateGameSystems() {
    // This is called on WebSocket arena_state messages
    // Most physics is now handled by _updatePhysicsFrame
    if (this.renderer) {
      this.renderer.updateWells(this.physicsEngine?.getWells() || []);
    }
  }

  /**
   * Handle round_start message
   * @param {Object} message
   * @private
   */
  _handleRoundStart(message) {
    this.roundNumber = message.roundNumber || this.roundNumber + 1;

    // Start countdown
    this.countdownValue = message.countdown || 3;
    this._setState(GameState.COUNTDOWN);

    // Update round display
    if (this.panel) {
      this.panel.updateRound(this.roundNumber);
      this.panel.showCountdown(this.countdownValue);
    }

    // Play countdown sound
    if (this.audio) {
      this.audio.playCountdown();
    }

    // Start countdown timer
    this._startCountdown();
  }

  /**
   * Handle round_end message
   * @param {Object} message
   * @private
   */
  _handleRoundEnd(message) {
    this.roundResults = message.results;
    this._setState(GameState.ROUND_END);

    // Update panel with results
    if (this.panel && this.roundResults) {
      // Mark current player in rankings
      const rankings = (this.roundResults.rankings || []).map(r => ({
        ...r,
        isPlayer: r.username === this.username
      }));
      this.panel.showResults({
        ...this.roundResults,
        rankings
      });
    }

    // Play victory sound for winner
    if (this.audio && this.roundResults?.winner === this.username) {
      this.audio.playVictory();
    }
  }

  /**
   * Handle eliminated message
   * @param {Object} message
   * @private
   */
  _handleEliminatedMessage(message) {
    this.handleElimination({
      by: message.by,
      territoryPercent: message.territoryPercent,
      roundTimeRemaining: message.roundTimeRemaining,
      playersAlive: message.playersAlive
    });
  }

  /**
   * Handle player_joined message
   * @param {Object} message
   * @private
   */
  _handlePlayerJoined(message) {
    this.playerList.set(message.username, {
      username: message.username,
      ghostProfile: message.ghostProfile
    });

    // Play notification sound for other players joining
    if (this.audio && message.username !== this.username) {
      this.audio.playBounce(); // Use bounce as a subtle join notification
    }
  }

  /**
   * Handle player_left message
   * @param {Object} message
   * @private
   */
  _handlePlayerLeft(message) {
    this.playerList.delete(message.username);
  }

  /**
   * Handle rejoin_accepted message
   * @param {Object} message
   * @private
   */
  _handleRejoinAccepted(message) {
    console.log('[GhostOrbits] Rejoin accepted');
    this._setState(GameState.PLAYING);

    // Reset to active view
    if (this.panel) {
      this.panel.resetToActiveView();
    }
  }

  /**
   * Handle countdown message
   * @param {Object} message
   * @private
   */
  _handleCountdown(message) {
    this.countdownValue = message.value;

    if (this.panel) {
      this.panel.showCountdown(this.countdownValue);
    }

    if (this.audio) {
      if (this.countdownValue > 0) {
        this.audio.playCountdown();
      } else {
        this.audio.playGo();
        this._setState(GameState.PLAYING);
      }
    }
  }

  /**
   * Handle intermission message
   * @param {Object} message
   * @private
   */
  _handleIntermission(message) {
    this._setState(GameState.INTERMISSION);
    // Intermission is handled by results view with countdown
  }

  /**
   * Handle server error message
   * @param {Object} message
   * @private
   */
  _handleServerError(message) {
    console.error('[GhostOrbits] Server error:', message.error);
    // Could show error toast, but for now just log it
  }

  // ============================================
  // INPUT HANDLING
  // ============================================

  /**
   * Enable keyboard input
   * @private
   */
  _enableInput() {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
  }

  /**
   * Disable keyboard input
   * @private
   */
  _disableInput() {
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    this.activeKeys.clear();
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyDown(event) {
    // Ignore keypresses when user is typing in an input field
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // ESC to exit - only when panel is visible
    if (event.code === 'Escape') {
      if (this.panel && this.panel.isVisible) {
        event.preventDefault();
        this.exitArena();
      }
      return;
    }

    // Only process game input when enabled and in PLAYING state
    if (!this.inputEnabled || this.state !== GameState.PLAYING) {
      return;
    }

    // v3: Space key is the ONLY control
    // - On record (ORBITING): launch off
    // - Flying (FREE_FLIGHT) + near record: land on record (safe)
    // - Flying + pressing spacebar: registers for flip mechanic timing
    if (event.code === 'Space') {
      event.preventDefault();
      if (event.repeat) return; // Don't repeat on held key

      const localGhost = this.renderer?.getLocalGhost();
      if (!localGhost) return;

      // Register spacebar press for flip mechanic (v3)
      // This must happen BEFORE orbit entry/exit to enable flip timing
      // Route through mode.applyInput for single source of truth
      if (this.mode) {
        this.mode.applyInput('spacebar', {}, localGhost);
      } else if (this.dotManager) {
        // Fallback for non-mode operation
        this.dotManager.registerSpacebarPress('player');
      }

      // Check if currently on a record (orbiting = safe)
      if (this.ghostMovementState === 'ORBITING') {
        // Launch off the record
        const releaseVelocity = this.physicsEngine.releaseFromOrbit(this.username);
        if (releaseVelocity) {
          console.log('[GhostOrbits] Launched from record via Space key');
          localGhost.velocity.x = releaseVelocity.x;
          localGhost.velocity.y = releaseVelocity.y;
          this.ghostMovementState = 'FREE_FLIGHT';
          this.renderer?.updateGhostOrbitState?.(this.username, false);
          if (this.audio) this.audio.playBounce?.();
        }
      } else {
        // Try to land on a record if near one
        const ghostPos = {
          x: localGhost.position?.x ?? 0,
          y: localGhost.position?.y ?? 0
        };
        const ghostVel = {
          x: localGhost.velocity?.x ?? 0,
          y: localGhost.velocity?.y ?? 0
        };

        // v3: Pass orbitalSpeed multiplier from NN properties
        const record = this.physicsEngine.requestOrbitEntry(
          this.username,
          ghostPos,
          ghostVel,
          { orbitalSpeedMultiplier: this.ghostProperties?.orbitalSpeed || 1.0 }
        );

        if (record) {
          console.log('[GhostOrbits] Landed on record via Space key:', record.id, 'speed:', this.ghostProperties?.orbitalSpeed || 1.0);
          this.ghostMovementState = 'ORBITING';
          this.renderer?.updateGhostOrbitState?.(this.username, true);
          if (this.audio) this.audio.playOrbitCapture?.();
        }
        // If not near a record, spacebar still registered for flip mechanic
      }
      return;
    }

    // v3: No dodge mechanic (removed Shift key)
    // v3: No arrow key movement (ghosts move at constant velocity)

    // v2: Arrow keys do NOT apply thrust or affect ghost movement
    // Ghosts move at constant velocity and only change direction via Records (Space key)
    // Arrow key movement code commented out below:

    /*
    // Check for movement keys
    const direction = INPUT_KEYS[event.code];
    if (direction) {
      event.preventDefault();
      this.activeKeys.add(event.code);

      // Sync key state with renderer (so its processInput works)
      if (this.renderer) {
        // Convert event.code to event.key format for renderer
        const keyName = event.code.replace('Key', '').replace('Arrow', 'Arrow');
        this.renderer.setKeyPressed(event.key, true);
      }

      // If orbiting, release with slingshot
      if (this.ghostMovementState === 'ORBITING' && this.physicsEngine) {
        const directionName = this._getDirectionName(event.code);
        const releaseVelocity = this.physicsEngine.releaseFromOrbit(this.username, directionName);

        if (releaseVelocity) {
          console.log('[GhostOrbits] Slingshot release:', directionName, releaseVelocity);
          this.ghostMovementState = 'FREE_FLIGHT';

          // Update local ghost velocity if we have renderer
          if (this.renderer) {
            const localGhost = this.renderer.getLocalGhost();
            if (localGhost) {
              localGhost.velocity.x = releaseVelocity.x;
              localGhost.velocity.y = releaseVelocity.y;
            }
          }
        }
      }

      // Send input to server
      this._sendMessage({
        type: 'input',
        direction: direction,
        thrust: true
      });

      // Play thrust sound (only on first press, not repeat)
      if (this.audio && !event.repeat) {
        this.audio.playThrust();
      }
    }
    */
  }

  /**
   * Convert key code to direction name for physics engine
   * @param {string} code - Key code
   * @returns {string} Direction name
   * @private
   */
  _getDirectionName(code) {
    const directionMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      KeyW: 'up',
      KeyS: 'down',
      KeyA: 'left',
      KeyD: 'right'
    };
    return directionMap[code] || 'up';
  }

  /**
   * Handle keyup event
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyUp(event) {
    // Ignore keypresses when user is typing in an input field
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if (!this.inputEnabled) return;

    // v2: Arrow keys do NOT apply thrust or affect ghost movement
    // Commenting out arrow key release handling:

    /*
    const direction = INPUT_KEYS[event.code];
    if (direction && this.activeKeys.has(event.code)) {
      this.activeKeys.delete(event.code);

      // Sync key state with renderer
      if (this.renderer) {
        this.renderer.setKeyPressed(event.key, false);
      }

      // Send release to server
      this._sendMessage({
        type: 'input',
        direction: direction,
        thrust: false
      });
    }
    */
  }

  // ============================================
  // UI HELPERS
  // ============================================


  /**
   * Show the game overlay
   * @private
   */
  _showOverlay() {
    if (this.panel) {
      this.panel.show();
    }
  }

  /**
   * Hide the game overlay
   * @private
   */
  _hideOverlay() {
    console.log('[GhostOrbits] _hideOverlay called, panel exists:', !!this.panel);
    if (this.panel) {
      this.panel.hide();
    }
  }

  /**
   * Start the countdown display
   * @private
   */
  _startCountdown() {
    this._clearCountdown();

    this.countdownTimer = setInterval(() => {
      this.countdownValue--;

      if (this.panel) {
        this.panel.showCountdown(this.countdownValue);
      }

      if (this.audio) {
        if (this.countdownValue > 0) {
          this.audio.playCountdown();
        } else {
          this.audio.playGo();
        }
      }

      if (this.countdownValue <= 0) {
        this._clearCountdown();
        this._setState(GameState.PLAYING);
      }
    }, 1000);
  }

  /**
   * Clear countdown timer
   * @private
   */
  _clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }


  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Build WebSocket URL for arena connection
   * @returns {string}
   * @private
   */
  _buildWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = this.serverUrl.replace(/^https?:/, protocol);
    return `${baseUrl}/ws/ghost-orbits?cartridge=${this.cartridgeId}&period=${this.periodId}`;
  }

  /**
   * Get default server URL
   * @returns {string}
   * @private
   */
  _getDefaultServerUrl() {
    // Use same logic as app.html
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return 'https://lrsl-driller-production.up.railway.app';
  }

  /**
   * Load star economy state from localStorage
   * @private
   */
  _loadStarEconomy() {
    // Note: matchesPlayed is NOT persisted - escalating cost only applies
    // to consecutive rematches within a single arena session
    const key = `ghostOrbits_starEconomy_${this.cartridgeId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.starsSpent = data.starsSpent || 0;
        // matchesPlayed stays at 0 (set in constructor)
      } catch (e) {
        this.starsSpent = 0;
      }
    }
  }

  /**
   * Save star economy state to localStorage
   * @private
   */
  _saveStarEconomy() {
    // Note: matchesPlayed is NOT persisted - escalating cost only applies
    // to consecutive rematches within a single arena session
    const key = `ghostOrbits_starEconomy_${this.cartridgeId}`;
    localStorage.setItem(key, JSON.stringify({
      starsSpent: this.starsSpent
    }));
  }

  /**
   * Reset star economy (e.g., when cartridge changes or daily reset)
   */
  resetStarEconomy() {
    this.starsSpent = 0;
    this.matchesPlayed = 0;
    const key = `ghostOrbits_starEconomy_${this.cartridgeId}`;
    localStorage.removeItem(key);
    console.log('[GhostOrbits] Star economy reset');
  }

  /**
   * Handle page visibility change
   * @private
   */
  _handleVisibilityChange() {
    if (document.hidden && this.state === GameState.PLAYING) {
      // Could pause or show warning when tab is hidden
      console.log('[GhostOrbits] Page hidden while playing');
    }
  }

  // ============================================
  // WIN CONDITION DETECTION (SOLO MODE)
  // ============================================

  /**
   * Check win conditions each physics frame (v3 - territory dots)
   * @param {number} currentTime - Current timestamp in milliseconds
   * @private
   */
  _checkWinConditions(currentTime) {
    if (!this.matchStartTime || this.matchResult !== null) {
      return; // Match hasn't started or already ended
    }

    // Update time remaining
    const elapsed = currentTime - this.matchStartTime;
    this.matchTimeRemaining = WIN_CONDITIONS.ROUND_DURATION - elapsed;

    // 1. Check timeout condition (time ran out)
    if (elapsed >= WIN_CONDITIONS.ROUND_DURATION) {
      this._handleTimeoutWin();
      return;
    }

    // v3: Territory win (90% dots) is checked in the dot interaction loop
    // and handled there immediately when threshold is reached.
    // Lives-based elimination is also handled in dot interaction loop.
  }

  /**
   * Check for domination win condition
   * @param {number} currentTime - Current timestamp
   * @private
   */
  _checkDominationWin(currentTime) {
    if (!this.territorySystem) return;

    const territoryPercents = this.territorySystem.getAllTerritoryPercents();

    for (const [playerId, percent] of territoryPercents) {
      if (percent >= WIN_CONDITIONS.DOMINATION_THRESHOLD) {
        // Player has 70%+ territory
        if (!this.dominationStartTime.has(playerId)) {
          // Started dominating
          this.dominationStartTime.set(playerId, currentTime);
          console.log(`[GhostOrbits] ${playerId} started dominating with ${(percent * 100).toFixed(1)}% territory`);
        } else {
          // Check if held for required time
          const dominationDuration = currentTime - this.dominationStartTime.get(playerId);
          if (dominationDuration >= WIN_CONDITIONS.DOMINATION_HOLD_TIME) {
            // Domination win!
            const winner = playerId === this.username ? 'player_win' : 'shadow_win';
            this._handleMatchEnd(winner, 'domination');
            return;
          }
        }
      } else {
        // Lost domination
        if (this.dominationStartTime.has(playerId)) {
          console.log(`[GhostOrbits] ${playerId} lost domination at ${(percent * 100).toFixed(1)}% territory`);
          this.dominationStartTime.delete(playerId);
        }
      }
    }
  }

  /**
   * Check for absorption win condition (ghost collision)
   * @private
   */
  _checkAbsorptionWin() {
    if (!this.renderer) return;

    const localGhost = this.renderer.getLocalGhost();
    if (!localGhost) return;

    // Skip collision check if player is dodging (invulnerable)
    if (this.isDodging) {
      return;
    }

    // Get all ghosts (including shadow)
    const allGhosts = this.renderer.getAllGhosts();
    if (!allGhosts || allGhosts.length < 2) return;

    // Find shadow ghost (any ghost that isn't the local player)
    const shadowGhost = allGhosts.find(g => g.id !== this.username);
    if (!shadowGhost) return;

    // Check if ghosts are colliding
    const dx = localGhost.position.x - shadowGhost.position.x;
    const dy = localGhost.position.y - shadowGhost.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const playerRadius = (localGhost.mass || 1.0) * 15; // Base radius from NN mass
    const shadowRadius = (shadowGhost.mass || 1.0) * 15;
    const combinedRadius = playerRadius + shadowRadius;

    if (distance < combinedRadius) {
      // Collision detected - check mass ratio
      const playerMass = localGhost.mass || 1.0;
      const shadowMass = shadowGhost.mass || 1.0;

      if (playerMass >= shadowMass * WIN_CONDITIONS.ABSORPTION_MASS_RATIO) {
        // Player absorbs shadow
        this._handleMatchEnd('player_win', 'absorption');
      } else if (shadowMass >= playerMass * WIN_CONDITIONS.ABSORPTION_MASS_RATIO) {
        // Shadow absorbs player
        this._handleMatchEnd('shadow_win', 'absorption');
      }
      // If masses are too close, no absorption occurs
    }
  }

  /**
   * Handle timeout win condition (v3 - based on dot ownership)
   * @private
   */
  _handleTimeoutWin() {
    if (!this.dotManager) return;

    const playerPercent = this.dotManager.getOwnershipPercent('player');
    const shadowPercent = this.dotManager.getOwnershipPercent('shadow');

    console.log(`[GhostOrbits] Timeout! Player: ${(playerPercent * 100).toFixed(1)}%, Shadow: ${(shadowPercent * 100).toFixed(1)}%`);

    // Winner is whoever has more dots (or tie goes to player)
    const winner = playerPercent >= shadowPercent ? 'player_win' : 'shadow_win';
    this._handleMatchEnd(winner, 'timeout');
  }

  /**
   * Handle match end
   * @param {string} winner - 'player_win' or 'shadow_win'
   * @param {string} condition - 'domination', 'absorption', or 'timeout'
   * @private
   */
  _handleMatchEnd(winner, condition) {
    if (this.matchResult !== null) {
      return; // Already ended
    }

    console.log(`[GhostOrbits] Match ended: ${winner} via ${condition}`);

    this.matchResult = winner;
    this.winCondition = condition;

    // Sync result to mode (if mode exists)
    if (this.mode) {
      this.mode.setMatchResult(winner, condition);
    }

    // Get pattern recorder from mode (single source of truth)
    const patternRecorder = this.mode?.getPatternRecorder() || this.patternRecorder;

    // Handle Shadow Self progression system
    if (winner === 'player_win') {
      // Player victory - apply stat upgrade and level up shadow
      // Use mode's stat analysis when available (mode tracks stats during match)
      const weakestStat = this.mode?.analyzeWeakestStat() || this._analyzeMatchStats();
      this._applyStatUpgrade(weakestStat);

      // Increment shadow generation (via mode if available)
      if (this.mode) {
        this.shadowGeneration = this.mode.incrementShadowGeneration();
      } else {
        this.shadowGeneration++;
      }
      this._saveShadowGeneration();
      console.log(`[GhostOrbits] Shadow Self leveled up to Generation ${this.shadowGeneration}`);

      // Save patterns from this match (player's winning moves)
      if (patternRecorder) {
        const recordedPatterns = patternRecorder.getPatterns();
        const existingPatterns = this._loadStoredPatterns();
        const allPatterns = [...existingPatterns, ...(recordedPatterns?.chunks || [])];
        this._saveStoredPatterns(allPatterns);
        console.log(`[GhostOrbits] Saved ${recordedPatterns?.chunks?.length || 0} winning patterns`);
        patternRecorder.stop();
      }
    } else {
      // Shadow victory - save shadow's winning patterns
      if (patternRecorder) {
        const recordedPatterns = patternRecorder.getPatterns();
        const existingPatterns = this._loadStoredPatterns();
        const allPatterns = [...existingPatterns, ...(recordedPatterns?.chunks || [])];
        this._saveStoredPatterns(allPatterns);
        console.log(`[GhostOrbits] Shadow learned from victory, saved ${recordedPatterns?.chunks?.length || 0} patterns`);
        patternRecorder.stop();
      }
    }

    // Log current star economy state
    const nextCost = this.getNextMatchCost();
    const available = this.getAvailableStars();
    console.log(`[GhostOrbits] Match ended. Next match cost: ${nextCost}, Available stars: ${available}, Can afford: ${available >= nextCost}`);

    // Transition to ROUND_END state
    this._setState(GameState.ROUND_END);

    // Play appropriate sound
    if (this.audio) {
      if (winner === 'player_win') {
        this.audio.playVictory?.();
      } else {
        this.audio.playEliminated?.();
      }
    }

    // Show results in panel
    if (this.panel) {
      // v3: Use dot ownership percentage
      const playerPercent = this.dotManager?.getOwnershipPercent('player') || 0;

      const resultsData = {
        winner: winner === 'player_win' ? 'player' : 'shadow',
        condition: this._getWinConditionText(condition),
        playerTerritory: (playerPercent * 100).toFixed(1),
        timeElapsed: Math.ceil((Date.now() - this.matchStartTime) / 1000)
      };

      // Add rematch cost info
      resultsData.nextMatchCost = this.getNextMatchCost();
      resultsData.availableStars = this.getAvailableStars();
      resultsData.canRematch = this.canAffordNextMatch();

      // Add stat upgrade info for victory
      if (winner === 'player_win') {
        const weakestStat = this._getWeakestStatName();
        resultsData.statUpgrade = this._formatStatUpgrade(weakestStat);
      }

      this.panel.showResults(resultsData);
    }

    // Emit event for external handlers
    if (this.onStateChange) {
      this.onStateChange(GameState.ROUND_END, GameState.PLAYING);
    }
  }

  /**
   * Get human-readable win condition text (v3)
   * @param {string} condition - Win condition type
   * @returns {string}
   * @private
   */
  _getWinConditionText(condition) {
    const texts = {
      territory: 'Dot Domination (90%)',
      elimination: 'Elimination',
      timeout: 'Time Limit',
      // Legacy (kept for compatibility):
      domination: 'Territory Domination',
      absorption: 'Absorption'
    };
    return texts[condition] || condition;
  }

  /**
   * Start match timer (call when entering PLAYING state in solo mode)
   */
  startMatchTimer() {
    this.matchStartTime = Date.now();
    this.dominationStartTime.clear();
    this.matchResult = null;
    this.winCondition = null;

    // If mode exists, let it handle reset (it manages dots, lives, timing)
    if (this.mode) {
      this.mode.reset();
      // Sync state from mode (mode is single source of truth for timing/lives)
      const scoreboard = this.mode.getScoreboard();
      this.playerLives = scoreboard.playerLives;
      this.shadowLives = scoreboard.opponentLives;
      this.matchTimeRemaining = scoreboard.timeRemaining;
      this.playerInvulnerableUntil = 0;
      this.shadowInvulnerableUntil = 0;
      // Sync dotManager reference
      this.dotManager = this.mode.getDotManager();
    } else {
      // Legacy: Use controller constants when no mode
      this.matchTimeRemaining = WIN_CONDITIONS.ROUND_DURATION;
      // Reset lives (v3 system - 3 lives each)
      this.playerLives = 3;
      this.shadowLives = 3;
      this.playerInvulnerableUntil = 0;
      this.shadowInvulnerableUntil = 0;
      // Legacy: Reset dots to neutral (v3)
      if (this.dotManager) {
        this.dotManager.reset();
        // Re-initialize dots with current records
        const records = this.physicsEngine?.getRecords() || [];
        this.dotManager.initialize(records);
      }
    }

    // Reset match stats
    this.matchStats = {
      energyDepletionCount: 0,
      territoryClaimRate: 0,
      timeSpentOrbiting: 0,
      absorptionAttempts: 0,
      totalGameTime: 0
    };

    // Update lives display
    if (this.panel?.updateLives) {
      this.panel.updateLives(this.playerLives);
    }

    // Show help screen on first match (v3)
    if (this.panel?.showHelpScreen && !this._hasShownHelp) {
      this._hasShownHelp = true;
      // Give player extended invulnerability while reading help (30 seconds max)
      this.playerInvulnerableUntil = Date.now() + 30000;
      // Also set in mode if it exists
      if (this.mode) {
        this.mode.setPlayerInvulnerableUntil(this.playerInvulnerableUntil);
      }
      // Show help immediately, remove invulnerability when dismissed
      this.panel.showHelpScreen(() => {
        // Help dismissed - reset invulnerability to normal respawn duration
        const respawnDuration = (this.ghostProperties?.respawnSpeed || 2) * 1000;
        this.playerInvulnerableUntil = Date.now() + respawnDuration;
        if (this.mode) {
          this.mode.setPlayerInvulnerableUntil(this.playerInvulnerableUntil);
        }
      });
    }

    console.log('[GhostOrbits] Match timer started, lives reset to 3');
  }

  /**
   * Get time remaining in match (for UI display)
   * @returns {string} Time remaining formatted as MM:SS
   */
  getTimeRemaining() {
    if (this.matchTimeRemaining === null || this.matchTimeRemaining < 0) {
      return '0:00';
    }

    const totalSeconds = Math.ceil(this.matchTimeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get match state for external access
   * @returns {Object} Match state information
   */
  getMatchState() {
    return {
      startTime: this.matchStartTime,
      timeRemaining: this.matchTimeRemaining,
      result: this.matchResult,
      winCondition: this.winCondition,
      formattedTime: this.getTimeRemaining()
    };
  }

  // ============================================
  // SHADOW SELF PROGRESSION SYSTEM
  // ============================================

  /**
   * Track match statistics during gameplay
   * @param {Object} localGhost - Player's ghost
   * @param {Object} shadowGhost - Shadow's ghost
   * @param {number} deltaTime - Time since last frame
   * @private
   */
  _trackMatchStats(localGhost, shadowGhost, deltaTime) {
    if (!localGhost) return;

    this.matchStats.totalGameTime += deltaTime;

    // Track energy depletion
    if (localGhost.energy <= 0) {
      this.matchStats.energyDepletionCount++;
    }

    // Track time spent orbiting
    if (this.ghostMovementState === 'ORBITING') {
      this.matchStats.timeSpentOrbiting += deltaTime;
    }

    // Track territory claim rate (calculate running average)
    if (this.territorySystem) {
      const currentTerritory = this.territorySystem.getTerritoryPercent?.(this.username) || 0;
      // Weighted average to smooth out spikes
      const timeWeight = Math.min(this.matchStats.totalGameTime, 1.0);
      this.matchStats.territoryClaimRate = (this.matchStats.territoryClaimRate * (1 - timeWeight * 0.1)) +
                                           (currentTerritory / Math.max(this.matchStats.totalGameTime, 1.0)) * (timeWeight * 0.1);
    }

    // Track near-collisions (absorption attempts)
    if (shadowGhost) {
      const dx = localGhost.position.x - shadowGhost.position.x;
      const dy = localGhost.position.y - shadowGhost.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const playerRadius = (localGhost.mass || 1.0) * 15;
      const shadowRadius = (shadowGhost.mass || 1.0) * 15;
      const nearCollisionRadius = (playerRadius + shadowRadius) * 1.5; // 50% margin

      if (distance < nearCollisionRadius) {
        // Near collision - check if masses are close (risky absorption attempt)
        const playerMass = localGhost.mass || 1.0;
        const shadowMass = shadowGhost.mass || 1.0;
        const massRatio = Math.max(playerMass, shadowMass) / Math.min(playerMass, shadowMass);

        if (massRatio < WIN_CONDITIONS.ABSORPTION_MASS_RATIO * 1.2) {
          // Masses are close - this was a risky absorption attempt
          this.matchStats.absorptionAttempts++;
        }
      }
    }
  }

  /**
   * Analyze match statistics to determine weakest stat
   * @returns {string} Name of stat to upgrade ('mass', 'energyRegen', 'trailDuration', 'trailWidth', 'thrustEfficiency')
   * @private
   */
  _analyzeMatchStats() {
    console.log('[GhostOrbits] Analyzing match stats:', this.matchStats);

    const weaknesses = [];

    // Energy depletion analysis
    const energyDepletionRate = this.matchStats.energyDepletionCount / Math.max(this.matchStats.totalGameTime, 1.0);
    if (energyDepletionRate > 0.1) { // More than once per 10 seconds
      weaknesses.push({ stat: 'energyRegen', score: energyDepletionRate });
      console.log('[GhostOrbits] Energy weakness detected:', energyDepletionRate.toFixed(3), 'depletions/sec');
    }

    // Territory claim rate analysis
    const avgTerritoryPerSec = this.matchStats.territoryClaimRate;
    if (avgTerritoryPerSec < 0.005) { // Less than 0.5% per second
      // Could be trail duration or trail width
      weaknesses.push({ stat: 'trailDuration', score: 0.01 - avgTerritoryPerSec });
      weaknesses.push({ stat: 'trailWidth', score: (0.01 - avgTerritoryPerSec) * 0.9 }); // Slight preference for duration
      console.log('[GhostOrbits] Territory weakness detected:', avgTerritoryPerSec.toFixed(4), 'percent/sec');
    }

    // Absorption attempt analysis
    if (this.matchStats.absorptionAttempts > 5) {
      // Got into risky situations - mass might be weak
      weaknesses.push({ stat: 'mass', score: this.matchStats.absorptionAttempts / 10 });
      console.log('[GhostOrbits] Mass weakness detected:', this.matchStats.absorptionAttempts, 'risky encounters');
    }

    // Orbit time analysis
    const orbitPercent = this.matchStats.timeSpentOrbiting / Math.max(this.matchStats.totalGameTime, 1.0);
    if (orbitPercent > 0.4) { // Spent more than 40% of time in orbit
      // Might indicate difficulty catching enemy - thrust efficiency weak
      weaknesses.push({ stat: 'thrustEfficiency', score: orbitPercent - 0.3 });
      console.log('[GhostOrbits] Thrust weakness detected:', (orbitPercent * 100).toFixed(1), '% time orbiting');
    }

    // Find highest scoring weakness
    if (weaknesses.length > 0) {
      weaknesses.sort((a, b) => b.score - a.score);
      const chosenStat = weaknesses[0].stat;
      console.log('[GhostOrbits] Weakest stat identified:', chosenStat, 'score:', weaknesses[0].score.toFixed(3));
      return chosenStat;
    }

    // Default: upgrade a random stat if no clear weakness
    const allStats = ['mass', 'energyRegen', 'trailDuration', 'trailWidth', 'thrustEfficiency'];
    const randomStat = allStats[Math.floor(Math.random() * allStats.length)];
    console.log('[GhostOrbits] No clear weakness, upgrading random stat:', randomStat);
    return randomStat;
  }

  /**
   * Apply stat upgrade to ghost properties
   * @param {string} statName - Name of stat to upgrade
   * @private
   */
  _applyStatUpgrade(statName) {
    if (!this.ghostProperties) {
      console.warn('[GhostOrbits] Cannot upgrade stat - no ghost properties');
      return;
    }

    const UPGRADE_AMOUNT = 0.05;
    const MAX_STAT = 1.5; // From spec section 7

    // Get current value
    const currentValue = this.ghostProperties[statName] || 1.0;
    const newValue = Math.min(currentValue + UPGRADE_AMOUNT, MAX_STAT);

    console.log(`[GhostOrbits] Upgrading ${statName}: ${currentValue.toFixed(2)} -> ${newValue.toFixed(2)}`);

    // Apply upgrade to ghost properties
    this.ghostProperties[statName] = newValue;

    // Save to localStorage
    this._saveGhostStats();

    // Update renderer with new properties
    if (this.renderer) {
      this.renderer.updateLocalGhostProperties(this.ghostProperties);
    }

    console.log(`[GhostOrbits] ${statName} upgraded by +${UPGRADE_AMOUNT.toFixed(2)}`);
  }

  /**
   * Load saved ghost stat upgrades from localStorage
   * @private
   */
  _loadGhostStats() {
    const key = `${this.cartridgeId}_ghost_stats`;
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        const savedStats = JSON.parse(stored);
        console.log('[GhostOrbits] Loading saved ghost stats:', savedStats);

        // Merge saved stats with current properties
        if (this.ghostProperties) {
          for (const [statName, value] of Object.entries(savedStats)) {
            if (typeof value === 'number' && this.ghostProperties.hasOwnProperty(statName)) {
              this.ghostProperties[statName] = value;
              console.log(`[GhostOrbits] Loaded ${statName}: ${value.toFixed(2)}`);
            }
          }
        }
      } catch (e) {
        console.warn('[GhostOrbits] Failed to parse saved ghost stats:', e);
      }
    } else {
      console.log('[GhostOrbits] No saved ghost stats found, using base properties');
    }
  }

  /**
   * Save ghost stat upgrades to localStorage
   * @private
   */
  _saveGhostStats() {
    if (!this.ghostProperties) return;

    const key = `${this.cartridgeId}_ghost_stats`;

    // Save only the upgradeable stats
    const statsToSave = {
      mass: this.ghostProperties.mass || 1.0,
      thrustEfficiency: this.ghostProperties.thrustEfficiency || 1.0,
      trailDuration: this.ghostProperties.trailDuration || 1.0,
      energyRegen: this.ghostProperties.energyRegen || 1.0,
      trailWidth: this.ghostProperties.trailWidth || 1.0
    };

    try {
      localStorage.setItem(key, JSON.stringify(statsToSave));
      console.log('[GhostOrbits] Saved ghost stats:', statsToSave);
    } catch (e) {
      console.warn('[GhostOrbits] Failed to save ghost stats:', e);
    }
  }

  /**
   * Get the name of the weakest stat from match analysis
   * @returns {string} Stat name
   * @private
   */
  _getWeakestStatName() {
    // Use mode's stat analysis when available (mode tracks stats during match)
    return this.mode?.analyzeWeakestStat() || this._analyzeMatchStats();
  }

  /**
   * Format stat upgrade for display
   * @param {string} statName - Name of stat that was upgraded
   * @returns {string} Formatted upgrade text (e.g., "Mass +0.05")
   * @private
   */
  _formatStatUpgrade(statName) {
    const UPGRADE_AMOUNT = 0.05;
    const statDisplayNames = {
      mass: 'Mass',
      thrustEfficiency: 'Thrust',
      trailDuration: 'Trail Duration',
      energyRegen: 'Energy Regen',
      trailWidth: 'Trail Width'
    };

    const displayName = statDisplayNames[statName] || statName;
    return `${displayName} +${UPGRADE_AMOUNT.toFixed(2)}`;
  }

  /**
   * Handle rematch request (player wants to play again after defeat)
   * @private
   */
  _handleRematch() {
    const cost = this.getNextMatchCost();
    console.log(`[GhostOrbits] Rematch requested (cost: ${cost} stars)`);

    // Check if player has enough stars
    if (!this.canAffordNextMatch()) {
      console.warn(`[GhostOrbits] Cannot rematch - need ${cost} stars, have ${this.getAvailableStars()}`);
      // The UI should already show a disabled button, but just in case,
      // exit gracefully without an intrusive alert
      this.exitArena();
      return;
    }

    // Consume stars for this rematch
    this._consumeStarsForMatch();

    // Reset match state
    this.matchResult = null;
    this.winCondition = null;
    this.dominationStartTime.clear();

    // Get arena size early (needed for setup)
    const arenaSize = this.renderer?.arena?.size || 800;

    // Clear the results screen and re-mount canvas
    if (this.panel) {
      this.panel.resetToActiveView();

      // Re-mount canvas to new arena container (resetToActiveView recreates the DOM)
      if (this.renderer) {
        const newContainer = this.panel.getArenaContainer();
        if (newContainer) {
          // Use the new remountCanvas method which handles ResizeObserver re-setup
          this.renderer.remountCanvas(newContainer);
        }
      }
    }

    // PHASE 1: Clear all game state BEFORE re-initializing
    // Reset physics engine - clear records first
    if (this.physicsEngine) {
      this.physicsEngine.clearRecords();
      this.physicsEngine.orbitStates.clear();
      this.physicsEngine.arenaSize = { width: arenaSize, height: arenaSize };
    }

    // Reset dots and trails (mode handles dots if present)
    if (this.mode) {
      // Mode will reset its dots in startMatchTimer -> mode.reset()
      this.dotManager = this.mode.getDotManager();
    } else if (this.dotManager) {
      this.dotManager.reset();
    }
    if (this.trailManager) {
      this.trailManager.clear();
    }

    // Clear territory
    if (this.territorySystem) {
      this.territorySystem.clearAll?.();
    }

    // PHASE 2: Re-setup arena with fresh records and dots
    this._setupInitialArena(arenaSize);

    // PHASE 3: Reset or recreate ghosts
    if (this.renderer) {
      // Reset or recreate player ghost
      let localGhost = this.renderer.getLocalGhost();
      if (localGhost) {
        // Ghost exists - just reset position
        localGhost.position.x = arenaSize * 0.2;
        localGhost.position.y = arenaSize * 0.8;
        localGhost.velocity.x = 3;
        localGhost.velocity.y = -3;
        localGhost.energy = 1.0;
        localGhost.isOrbiting = false;
      } else {
        // Ghost missing - recreate it
        console.log('[GhostOrbits] Rematch: Recreating local ghost');
        this.renderer.addGhost({
          id: this.username || 'player',
          x: arenaSize * 0.2,
          y: arenaSize * 0.8,
          color: this.ghostProperties?.color || '#4488ff',
          tier: this.ghostProperties?.tier || 0,
          pattern: this.ghostProperties?.pattern || null,
          nnProperties: {
            mass: this.ghostProperties?.mass || 1.0,
            thrustEfficiency: this.ghostProperties?.thrustEfficiency || 1.0,
            trailDuration: this.ghostProperties?.trailDuration || 1.0,
            energyRegen: this.ghostProperties?.energyRegen || 1.0,
            trailWidth: this.ghostProperties?.trailWidth || 1.0
          }
        }, true);
      }

      // Reset or recreate shadow ghost
      let shadowGhost = this.renderer.ghosts?.get(this.shadowGhostId);
      if (shadowGhost) {
        // Ghost exists - just reset position
        shadowGhost.position.x = arenaSize * 0.7;
        shadowGhost.position.y = arenaSize * 0.35;
        shadowGhost.velocity.x = -3;
        shadowGhost.velocity.y = 3;
        shadowGhost.energy = 1.0;
        shadowGhost.isOrbiting = false;
      } else {
        // Ghost missing - recreate it
        console.log('[GhostOrbits] Rematch: Recreating shadow ghost');
        const playerColor = this.ghostProperties?.color || '#4488ff';
        const shadowColor = this._getComplementaryColor(playerColor);
        this.renderer.addGhost({
          id: this.shadowGhostId,
          x: arenaSize * 0.7,
          y: arenaSize * 0.35,
          color: shadowColor,
          tier: this.ghostProperties?.tier || 0,
          pattern: this.ghostProperties?.pattern || null,
          isShadow: true,
          nnProperties: {
            mass: this.ghostProperties?.mass || 1.0,
            thrustEfficiency: this.ghostProperties?.thrustEfficiency || 1.0,
            trailDuration: this.ghostProperties?.trailDuration || 1.0,
            energyRegen: this.ghostProperties?.energyRegen || 1.0,
            trailWidth: this.ghostProperties?.trailWidth || 1.0
          }
        }, false);
      }

      // Reset movement states
      this.ghostMovementState = 'FREE_FLIGHT';
      this.shadowMovementState = 'FREE_FLIGHT';

      // Verify ghosts exist after rematch setup
      console.log('[GhostOrbits] Rematch ghost verification:', {
        ghostsCount: this.renderer.ghosts?.size,
        localGhostExists: !!this.renderer.getLocalGhost(),
        shadowGhostExists: !!this.renderer.ghosts?.get(this.shadowGhostId)
      });
    }

    // PHASE 4: Sync ALL visual state to renderer
    if (this.renderer) {
      // Sync records/wells
      this.renderer.updateWells(this.physicsEngine.getWells());
      this.renderer.updateVoidZone(this.voidZone);
      // Sync dots (critical - was missing!)
      this.renderer.updateDots(this.dotManager?.getDots() || []);
    }

    // PHASE 5: Reset AI and recording systems (mode handles these if present)
    if (this.mode) {
      // Mode will reset patternRecorder and shadowAI in mode.reset()
      this.patternRecorder = this.mode.getPatternRecorder();
      this.shadowAI = this.mode.getShadowAI();
    } else {
      if (this.patternRecorder) {
        this.patternRecorder.clear();
        this.patternRecorder.start();
      }
      if (this.shadowAI) {
        this.shadowAI.reset?.();
      }
    }

    // PHASE 6: Start the match timer FIRST (before render loop starts)
    this.startMatchTimer();

    // PHASE 7: Re-sync ALL visual state after startMatchTimer (it re-initializes dots)
    if (this.renderer) {
      this.renderer.updateWells(this.physicsEngine.getWells());
      this.renderer.updateDots(this.dotManager?.getDots() || []);
    }

    // PHASE 8: NOW set state to PLAYING (starts render loop with correct data)
    // Force restart the renderer to ensure fresh animation loop
    if (this.renderer) {
      this.renderer.stop();
      this.renderer._logNextRender = true;
    }
    this._setState(GameState.PLAYING);

    // DIAGNOSTIC: Log state after rematch setup
    console.log('[GhostOrbits] Rematch diagnostics:', {
      state: this.state,
      matchStartTime: this.matchStartTime,
      matchTimeRemaining: this.matchTimeRemaining,
      rendererRunning: this.renderer?.isRunning,
      wellsCount: this.renderer?.wells?.length,
      dotsCount: this.renderer?.territoryDots?.length,
      ghostsCount: this.renderer?.ghosts?.size,
      localGhostId: this.renderer?.localGhostId,
      localGhostExists: !!this.renderer?.getLocalGhost(),
      physicsRecordsCount: this.physicsEngine?.getRecords()?.length,
      dotManagerDotsCount: this.dotManager?.getDots()?.length
    });

    console.log('[GhostOrbits] Rematch started with full re-initialization');
  }
}

export default GhostOrbitsController;
