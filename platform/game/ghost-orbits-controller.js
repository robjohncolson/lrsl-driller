/**
 * Ghost Orbits Controller - Network-Synced Multiplayer
 *
 * Thin client controller that:
 * - Captures input (WASD/arrows, spacebar, escape)
 * - Sends inputs to server via WebSocket
 * - Receives and applies state from server
 * - Manages rendering (client-side only)
 *
 * Server owns all game state - no local physics simulation.
 *
 * @version 2.0.0 - Network-synced multiplayer
 */

// Component imports
import { GhostOrbitsRenderer } from '../core/ghost-orbits-renderer.js';
import { GhostOrbitsAudio } from '../core/ghost-orbits-audio.js';
import { GhostOrbitsPanel } from './ghost-orbits-panel.js';
import { GhostPropertiesMapper } from '../core/ghost-orbits-nn-mapper.js';

/**
 * Game states for the Ghost Orbits state machine
 */
export const GameState = {
  IDLE: 'idle',               // Not in arena
  CONNECTING: 'connecting',   // Joining WebSocket room
  WAITING: 'waiting',         // In lobby, waiting for players
  COUNTDOWN: 'countdown',     // 3-2-1-GO
  PLAYING: 'playing',         // Active gameplay
  ELIMINATED: 'eliminated',   // Lost all lives, can spectate
  SPECTATING: 'spectating',   // Watching others play
  ROUND_END: 'round_end',     // Showing results
  INTERMISSION: 'intermission' // Between rounds
};

/**
 * Input key codes for movement direction
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
 * GhostOrbitsController class - Network-Synced Multiplayer
 *
 * Acts as an input/render bridge between player and server.
 * Server is authoritative - client only sends inputs and renders state.
 */
export class GhostOrbitsController {
  /**
   * @param {Object} options - Controller options
   * @param {HTMLElement} options.container - Container element for the game overlay
   * @param {string} options.username - Current player's username
   * @param {string} options.cartridgeId - Current cartridge ID
   * @param {string} options.periodId - Class period ID
   * @param {Object} options.ghostProfile - Player's ghost profile from NN
   * @param {number} options.goldStars - Player's current gold star count
   * @param {number} options.points - Player's current total points
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
    this.goldStars = options.goldStars || 0;
    this.points = options.points || 0;
    this.serverUrl = options.serverUrl || this._getDefaultServerUrl();

    // Callbacks
    this.onExit = options.onExit || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onStatsUpdate = options.onStatsUpdate || (() => {});

    // Game state
    this.state = GameState.IDLE;
    this.previousState = null;
    this.playerId = null; // Assigned by server on join

    // Server state (received from WebSocket)
    this.serverState = {
      players: {},
      dots: {},
      orbits: [],
      arenaSize: 800,
      playerCount: 0,
      aliveCount: 0
    };

    // Interpolation state for smooth rendering
    this.interpolationBuffer = new Map(); // playerId -> { prev, next, timestamp }
    this.interpolationDelay = 100; // ms - buffer for smoothing

    // Components (initialized in init())
    this.renderer = null;
    this.audio = null;
    this.panel = null;
    this.propertiesMapper = null;

    // Ghost properties (derived from NN)
    this.ghostProperties = null;

    // WebSocket
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this._reconnectTimeout = null;

    // Input handling
    this.inputEnabled = false;
    this.activeDirection = { x: 0, y: 0 };
    this.spacebarPressed = false;
    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._boundKeyUp = this._handleKeyUp.bind(this);

    // Spectator mode
    this.isSpectating = false;
    this.spectateTargetId = null; // Player ID to follow camera

    // Gold tracking for unlock
    this.currentGolds = 0;
    this.lastSessionGolds = parseInt(localStorage.getItem('orbits_lastSessionGolds') || '0');

    // Animation frame for render loop
    this._animationFrameId = null;
    this._lastRenderTime = 0;

    // Bind methods
    this._boundOnVisibilityChange = this._handleVisibilityChange.bind(this);
  }

  /**
   * Update the current gold count for unlock tracking
   * @param {number} golds - Current gold star count
   */
  updateGoldCount(golds) {
    this.currentGolds = golds;
    this.goldStars = golds;
  }

  /**
   * Update gold stars and points for arena entry
   * @param {number} goldStars - Current gold star count
   * @param {number} points - Current total points
   */
  updateStats(goldStars, points) {
    this.goldStars = goldStars;
    this.points = points;
    this.currentGolds = goldStars;
  }

  /**
   * Check if arena is unlocked (earned new gold since last session)
   * @returns {boolean}
   */
  isUnlocked() {
    return this.currentGolds > this.lastSessionGolds;
  }

  /**
   * Save current golds as the session baseline
   */
  saveSessionGolds() {
    this.lastSessionGolds = this.currentGolds;
    localStorage.setItem('orbits_lastSessionGolds', String(this.currentGolds));
  }

  /**
   * Initialize all game components
   * @returns {Promise<void>}
   */
  async init() {
    console.log('[GhostOrbits] Initializing network-synced controller...');

    try {
      // Initialize ghost properties mapper
      this.propertiesMapper = new GhostPropertiesMapper();

      // Calculate ghost properties from NN profile
      if (this.ghostProfile) {
        this.ghostProperties = this.propertiesMapper.mapProfile(this.ghostProfile);
        console.log('[GhostOrbits] Ghost properties:', this.ghostProperties);
      }

      // Initialize HUD panel FIRST - it creates the overlay structure
      this.panel = new GhostOrbitsPanel({
        container: this.container,
        onClose: () => this.exitArena(),
        onReturnToPractice: () => this.exitArena(),
        onSpectate: () => this._enterSpectatorMode(),
        onRematch: () => this._requestRematch()
      });
      await this.panel.init();

      // Store reference to the overlay
      this.overlay = this.container.querySelector('.ghost-orbits-overlay');

      // Initialize audio
      this.audio = new GhostOrbitsAudio();
      this.audio.init();

      // Initialize renderer into panel's arena container
      const canvasContainer = this.panel.getArenaContainer();
      if (canvasContainer) {
        this.renderer = new GhostOrbitsRenderer({
          container: canvasContainer,
          ghostProperties: this.ghostProperties,
          onWallBounce: () => {
            if (this.audio) this.audio.playBounce();
          }
        });
        await this.renderer.init();
      }

      // Setup visibility change handler
      document.addEventListener('visibilitychange', this._boundOnVisibilityChange);

      console.log('[GhostOrbits] Controller initialized successfully');
    } catch (error) {
      console.error('[GhostOrbits] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Enter the arena - show overlay and connect to server
   * @returns {Promise<void>}
   */
  async enterArena() {
    if (this.state !== GameState.IDLE) {
      console.warn('[GhostOrbits] Cannot enter arena - not in IDLE state');
      return;
    }

    console.log('[GhostOrbits] Entering arena...');
    this._setState(GameState.CONNECTING);

    // Show overlay
    this._showOverlay();

    // Enable input
    this._enableInput();

    // Connect to WebSocket
    try {
      await this._connectWebSocket();

      // First identify to server
      this._sendMessage({
        type: 'identify',
        username: this.username
      });

      // Small delay to ensure identify is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Then send join message with required entry data
      this._sendMessage({
        type: 'global_arena_join',
        username: this.username,
        goldStars: this.goldStars,
        points: this.points,
        ghostProperties: this.ghostProfile
      });

      console.log('[GhostOrbits] Connected to arena');
    } catch (error) {
      console.error('[GhostOrbits] Failed to connect:', error);
      this._setState(GameState.IDLE);
      this._hideOverlay();
    }
  }

  /**
   * Exit the arena and return to practice mode
   */
  exitArena() {
    console.log('[GhostOrbits] Exiting arena...');

    // Send leave message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this._sendMessage({ type: 'global_arena_leave' });
    }

    // Clean up
    this._disconnectWebSocket();
    this._disableInput();
    this._hideOverlay();
    this._stopRenderLoop();

    // Reset state
    this.playerId = null;
    this.serverState = {
      players: {},
      dots: {},
      orbits: [],
      arenaSize: 800,
      playerCount: 0,
      aliveCount: 0
    };
    this.interpolationBuffer.clear();
    this.isSpectating = false;
    this.spectateTargetId = null;

    this._setState(GameState.IDLE);

    // Notify callback
    this.onExit();
  }

  /**
   * Apply server state update
   * Called when receiving arena_state or arena_delta messages
   * @param {Object} state - Server state object
   */
  applyServerState(state) {
    const now = performance.now();

    // Update arena configuration
    if (state.arenaSize) {
      this.serverState.arenaSize = state.arenaSize;
    }
    if (state.playerCount !== undefined) {
      this.serverState.playerCount = state.playerCount;
    }
    if (state.aliveCount !== undefined) {
      this.serverState.aliveCount = state.aliveCount;
    }

    // Update orbits
    if (state.orbits) {
      this.serverState.orbits = state.orbits;
      // Note: renderer.updateOrbits may not exist yet - orbits are rendered from serverState
    }

    // Update players with interpolation
    if (state.players) {
      for (const [id, playerData] of Object.entries(state.players)) {
        // Store previous state for interpolation
        const prevPlayer = this.serverState.players[id];
        if (prevPlayer) {
          this.interpolationBuffer.set(id, {
            prev: { x: prevPlayer.x, y: prevPlayer.y },
            next: { x: playerData.x, y: playerData.y },
            timestamp: now
          });
        }

        // Update current state
        this.serverState.players[id] = {
          ...this.serverState.players[id],
          ...playerData
        };
      }
    }

    // Update dots
    if (state.dots) {
      for (const [id, dotData] of Object.entries(state.dots)) {
        this.serverState.dots[id] = {
          ...this.serverState.dots[id],
          ...dotData
        };
      }
    }

    // Update panel UI
    this._updatePanelFromState();
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
      this.audio = null;
    }

    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }

    this.overlay = null;
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
        this.inputEnabled = false;
        if (this.panel) this.panel.showConnecting();
        break;

      case GameState.WAITING:
        this.inputEnabled = false;
        if (this.panel) this.panel.showWaiting(this.serverState.playerCount);
        break;

      case GameState.COUNTDOWN:
        this.inputEnabled = false;
        break;

      case GameState.PLAYING:
        this.inputEnabled = true;
        this.isSpectating = false;
        if (this.panel) this.panel.showGameView();
        this._startRenderLoop();
        break;

      case GameState.ELIMINATED:
        this.inputEnabled = false;
        // Can still render (watching), but no input sent
        break;

      case GameState.SPECTATING:
        this.inputEnabled = false;
        this.isSpectating = true;
        // Keep rendering, allow camera controls
        break;

      case GameState.ROUND_END:
        this.inputEnabled = false;
        break;

      case GameState.INTERMISSION:
        this.inputEnabled = false;
        break;

      case GameState.IDLE:
        this.inputEnabled = false;
        this._stopRenderLoop();
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

        // Make WebSocket available globally for panel
        window.arenaWs = this.ws;

        resolve();
      };

      this.ws.onmessage = (event) => {
        this._handleWebSocketMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('[GhostOrbits] WebSocket closed:', event.code);
        window.arenaWs = null;
        this._handleWebSocketClose(event);
      };

      this.ws.onerror = (error) => {
        console.error('[GhostOrbits] WebSocket error:', error);
        reject(error);
      };

      // Connection timeout
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
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    window.arenaWs = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event
   * @private
   */
  _handleWebSocketClose(event) {
    if (this.state === GameState.IDLE) return;

    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[GhostOrbits] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      if (this._reconnectTimeout) {
        clearTimeout(this._reconnectTimeout);
      }

      this._reconnectTimeout = setTimeout(async () => {
        this._reconnectTimeout = null;
        try {
          await this._connectWebSocket();

          // Re-identify first
          this._sendMessage({
            type: 'identify',
            username: this.username
          });

          await new Promise(resolve => setTimeout(resolve, 100));

          // Then rejoin
          this._sendMessage({
            type: 'global_arena_rejoin',
            username: this.username,
            ghostProfile: this.ghostProfile,
            playerId: this.playerId
          });
        } catch (err) {
          this._handleWebSocketClose(event);
        }
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
   * Send input to server
   * @private
   */
  _sendInput() {
    if (!this.inputEnabled || this.isSpectating) return;

    this._sendMessage({
      type: 'global_arena_input',
      direction: { ...this.activeDirection },
      spacebar: this.spacebarPressed
    });
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
        case 'arena_joined':
          this._handleArenaJoined(message);
          break;

        case 'arena_state':
        case 'game_state':
          this._handleArenaState(message);
          break;

        case 'arena_delta':
        case 'game_delta':
          this._handleArenaDelta(message);
          break;

        case 'player_joined':
          this._handlePlayerJoined(message);
          break;

        case 'player_left':
          this._handlePlayerLeft(message);
          break;

        case 'player_eliminated':
          this._handlePlayerEliminated(message);
          break;

        case 'arena_winner':
          this._handleArenaWinner(message);
          break;

        case 'countdown':
          this._handleCountdown(message);
          break;

        case 'round_start':
          this._handleRoundStart(message);
          break;

        case 'round_end':
          this._handleRoundEnd(message);
          break;

        case 'arena_entry_failed':
          this._handleEntryFailed(message);
          break;

        case 'ghost_backfill_spawned':
          console.log('[GhostOrbits] Ghost backfill spawned:', message.ghostId);
          break;

        case 'user_online':
        case 'user_offline':
        case 'presence_snapshot':
          // Presence messages - ignore for now
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
   * Handle arena_joined message (server confirmed join)
   * @param {Object} message
   * @private
   */
  _handleArenaJoined(message) {
    console.log('[GhostOrbits] Joined arena:', message);
    this.playerId = message.playerId;

    // Update local stats with server-returned values (after bet deduction)
    if (typeof message.newGoldStars === 'number') {
      this.goldStars = message.newGoldStars;
      this.currentGolds = message.newGoldStars;
    }
    if (typeof message.newPoints === 'number') {
      this.points = message.newPoints;
    }

    // Notify UI to update gold star / points display
    this.onStatsUpdate(this.goldStars, this.points);

    // Store bet amount for display
    this.currentBet = message.bet || 0;
    this.currentPot = message.pot || 0;

    // Update panel with pot info
    if (this.panel) {
      this.panel.updatePot(this.currentPot);
    }

    // Apply initial full state
    if (message.gameState) {
      this.applyServerState(message.gameState);
    }

    // Transition to waiting or playing based on arena state
    // Note: isRunning is inside gameState, not directly on message
    const isRunning = message.gameState?.isRunning || message.isRunning;
    if (isRunning) {
      this._setState(GameState.PLAYING);
    } else {
      this._setState(GameState.WAITING);
    }
  }

  /**
   * Handle arena_entry_failed message (server rejected join)
   * @param {Object} message
   * @private
   */
  _handleEntryFailed(message) {
    console.error('[GhostOrbits] Entry failed:', message.error);

    // Show error to user
    if (this.panel) {
      this.panel.showError(message.error || 'Failed to enter arena');
    }

    // Clean up and return to idle state
    this._disconnectWebSocket();
    this._disableInput();
    this._hideOverlay();
    this._setState(GameState.IDLE);
  }

  /**
   * Handle arena_state message (full state sync)
   * @param {Object} message
   * @private
   */
  _handleArenaState(message) {
    this.applyServerState(message);
  }

  /**
   * Handle arena_delta message (incremental state update)
   * @param {Object} message
   * @private
   */
  _handleArenaDelta(message) {
    this.applyServerState(message);
  }

  /**
   * Handle player_joined message
   * @param {Object} message
   * @private
   */
  _handlePlayerJoined(message) {
    console.log('[GhostOrbits] Player joined:', message.username);

    // Add to local state
    this.serverState.players[message.playerId] = {
      id: message.playerId,
      username: message.username,
      color: message.color,
      x: message.x || 0,
      y: message.y || 0,
      lives: message.lives || 3,
      dotCount: 0,
      isAlive: true
    };

    // Update player count
    this.serverState.playerCount = Object.keys(this.serverState.players).length;

    // Play join sound
    if (this.audio && message.playerId !== this.playerId) {
      this.audio.playBounce?.();
    }

    // Update panel
    if (this.panel) {
      this.panel.updatePlayerCount(this.serverState.playerCount);
    }
  }

  /**
   * Handle player_left message
   * @param {Object} message
   * @private
   */
  _handlePlayerLeft(message) {
    console.log('[GhostOrbits] Player left:', message.username);

    // Remove from local state
    delete this.serverState.players[message.playerId];
    this.interpolationBuffer.delete(message.playerId);

    // Update player count
    this.serverState.playerCount = Object.keys(this.serverState.players).length;

    // Update panel
    if (this.panel) {
      this.panel.updatePlayerCount(this.serverState.playerCount);
    }
  }

  /**
   * Handle player_eliminated message
   * @param {Object} message
   * @private
   */
  _handlePlayerEliminated(message) {
    console.log('[GhostOrbits] Player eliminated:', message.username);

    // Update player state
    if (this.serverState.players[message.playerId]) {
      this.serverState.players[message.playerId].isAlive = false;
    }

    // Check if it's the local player
    if (message.playerId === this.playerId) {
      this._setState(GameState.ELIMINATED);

      if (this.audio) {
        this.audio.playEliminated?.();
      }

      if (this.panel) {
        this.panel.showEliminated({
          placement: message.placement || '?',
          playersRemaining: message.playersAlive || 0
        });
      }
    }
  }

  /**
   * Handle arena_winner message
   * @param {Object} message
   * @private
   */
  _handleArenaWinner(message) {
    console.log('[GhostOrbits] Arena winner:', message.winner);

    const isLocalWinner = message.winnerId === this.playerId;

    this._setState(GameState.ROUND_END);

    if (this.audio) {
      if (isLocalWinner) {
        this.audio.playVictory?.();
      } else {
        this.audio.playEliminated?.();
      }
    }

    if (this.panel) {
      this.panel.showResults({
        winner: message.winner,
        isLocalWinner,
        stats: message.stats
      });
    }
  }

  /**
   * Handle countdown message
   * @param {Object} message
   * @private
   */
  _handleCountdown(message) {
    this._setState(GameState.COUNTDOWN);

    if (this.panel) {
      this.panel.showCountdown(message.value);
    }

    if (this.audio) {
      if (message.value > 0) {
        this.audio.playCountdown?.();
      } else {
        this.audio.playGo?.();
      }
    }

    // Transition to playing when countdown reaches 0
    if (message.value <= 0) {
      this._setState(GameState.PLAYING);
    }
  }

  /**
   * Handle round_start message
   * @param {Object} message
   * @private
   */
  _handleRoundStart(message) {
    console.log('[GhostOrbits] Round starting:', message.roundNumber);
    this._setState(GameState.COUNTDOWN);

    if (this.panel) {
      this.panel.showCountdown(message.countdown || 3);
    }
  }

  /**
   * Handle round_end message
   * @param {Object} message
   * @private
   */
  _handleRoundEnd(message) {
    console.log('[GhostOrbits] Round ended');
    this._setState(GameState.ROUND_END);

    if (this.panel) {
      this.panel.showResults(message.results);
    }
  }

  /**
   * Handle server error message
   * @param {Object} message
   * @private
   */
  _handleServerError(message) {
    console.error('[GhostOrbits] Server error:', message.error);
    // Could show error toast
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
    this.activeDirection = { x: 0, y: 0 };
    this.spacebarPressed = false;
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyDown(event) {
    // Ignore when typing in input fields
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // ESC to exit
    if (event.code === 'Escape') {
      if (this.panel && this.panel.isVisible) {
        event.preventDefault();
        this.exitArena();
      }
      return;
    }

    // Spacebar handling
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat && !this.spacebarPressed) {
        this.spacebarPressed = true;
        this._sendInput();

        if (this.audio) {
          this.audio.playBounce?.();
        }
      }
      return;
    }

    // Movement keys - only when playing and not spectating
    if (!this.inputEnabled || this.isSpectating) return;

    const direction = INPUT_KEYS[event.code];
    if (direction) {
      event.preventDefault();

      // Update active direction
      const newDir = { ...this.activeDirection };
      newDir.x = Math.max(-1, Math.min(1, newDir.x + direction.x));
      newDir.y = Math.max(-1, Math.min(1, newDir.y + direction.y));

      // Only send if direction changed
      if (newDir.x !== this.activeDirection.x || newDir.y !== this.activeDirection.y) {
        this.activeDirection = newDir;
        this._sendInput();
      }
    }
  }

  /**
   * Handle keyup event
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyUp(event) {
    // Ignore when typing in input fields
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Spacebar release
    if (event.code === 'Space') {
      if (this.spacebarPressed) {
        this.spacebarPressed = false;
        this._sendInput();
      }
      return;
    }

    // Movement keys - only when playing and not spectating
    if (!this.inputEnabled || this.isSpectating) return;

    const direction = INPUT_KEYS[event.code];
    if (direction) {
      // Update active direction
      const newDir = { ...this.activeDirection };
      newDir.x = Math.max(-1, Math.min(1, newDir.x - direction.x));
      newDir.y = Math.max(-1, Math.min(1, newDir.y - direction.y));

      // Only send if direction changed
      if (newDir.x !== this.activeDirection.x || newDir.y !== this.activeDirection.y) {
        this.activeDirection = newDir;
        this._sendInput();
      }
    }
  }

  // ============================================
  // RENDERING
  // ============================================

  /**
   * Start the render loop
   * @private
   */
  _startRenderLoop() {
    if (this._animationFrameId) return;

    this._lastRenderTime = performance.now();
    this._renderLoop();

    if (this.renderer) {
      this.renderer.start();
    }
  }

  /**
   * Stop the render loop
   * @private
   */
  _stopRenderLoop() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    if (this.renderer) {
      this.renderer.stop();
    }
  }

  /**
   * Main render loop
   * @private
   */
  _renderLoop() {
    const now = performance.now();
    const deltaTime = (now - this._lastRenderTime) / 1000;
    this._lastRenderTime = now;

    // Interpolate player positions for smooth rendering
    this._interpolatePositions(now);

    // Update renderer with current state
    if (this.renderer) {
      this._updateRenderer();
    }

    // Continue loop
    this._animationFrameId = requestAnimationFrame(() => this._renderLoop());
  }

  /**
   * Interpolate player positions for smooth rendering
   * @param {number} now - Current timestamp
   * @private
   */
  _interpolatePositions(now) {
    for (const [playerId, buffer] of this.interpolationBuffer) {
      const player = this.serverState.players[playerId];
      if (!player || !buffer.prev || !buffer.next) continue;

      const elapsed = now - buffer.timestamp;
      const t = Math.min(elapsed / this.interpolationDelay, 1);

      // Linear interpolation
      player.renderX = buffer.prev.x + (buffer.next.x - buffer.prev.x) * t;
      player.renderY = buffer.prev.y + (buffer.next.y - buffer.prev.y) * t;
    }
  }

  /**
   * Update renderer with current server state
   * @private
   */
  _updateRenderer() {
    if (!this.renderer) return;

    // Convert server state to renderer format
    const ghosts = [];
    for (const [id, player] of Object.entries(this.serverState.players)) {
      if (!player.isAlive) continue;

      ghosts.push({
        id,
        x: player.renderX ?? player.x,
        y: player.renderY ?? player.y,
        vx: player.vx || 0,
        vy: player.vy || 0,
        color: player.color,
        isLocal: id === this.playerId,
        orbiting: player.orbiting,
        orbitAngle: player.orbitAngle,
        dotCount: player.dotCount,
        lives: player.lives
      });
    }

    // Convert dots
    const dots = [];
    for (const [id, dot] of Object.entries(this.serverState.dots)) {
      dots.push({
        id,
        x: dot.x,
        y: dot.y,
        owner: dot.owner,
        state: dot.state,
        color: dot.owner ? this.serverState.players[dot.owner]?.color : null
      });
    }

    // Update renderer
    this.renderer.updateState({
      ghosts,
      dots,
      orbits: this.serverState.orbits,
      arenaSize: this.serverState.arenaSize
    });

    // Update camera to follow local player or spectate target
    const followId = this.isSpectating ? this.spectateTargetId : this.playerId;
    if (followId && this.serverState.players[followId]) {
      const target = this.serverState.players[followId];
      this.renderer.setCameraTarget(target.renderX ?? target.x, target.renderY ?? target.y);
    }
  }

  /**
   * Update panel UI from current state
   * @private
   */
  _updatePanelFromState() {
    if (!this.panel) return;

    // Update player list
    const playerList = Object.values(this.serverState.players).map(p => ({
      id: p.id,
      username: p.username,
      color: p.color,
      dotCount: p.dotCount,
      lives: p.lives,
      isAlive: p.isAlive,
      isLocal: p.id === this.playerId
    }));
    this.panel.updatePlayerList(playerList);

    // Update local player's lives
    const localPlayer = this.serverState.players[this.playerId];
    if (localPlayer) {
      this.panel.updateLives?.(localPlayer.lives);
    }

    // Update player count
    this.panel.updatePlayerCount?.(this.serverState.playerCount);
  }

  // ============================================
  // SPECTATOR MODE
  // ============================================

  /**
   * Enter spectator mode after elimination
   * @private
   */
  _enterSpectatorMode() {
    console.log('[GhostOrbits] Entering spectator mode');

    this._setState(GameState.SPECTATING);

    // Find a player to follow (first alive player)
    const alivePlayers = Object.entries(this.serverState.players)
      .filter(([id, p]) => p.isAlive);

    if (alivePlayers.length > 0) {
      this.spectateTargetId = alivePlayers[0][0];
      console.log('[GhostOrbits] Spectating:', alivePlayers[0][1].username);
    }

    if (this.panel) {
      this.panel.showSpectating(this.spectateTargetId);
    }
  }

  /**
   * Switch spectator camera to next player
   */
  spectateNext() {
    if (!this.isSpectating) return;

    const alivePlayers = Object.entries(this.serverState.players)
      .filter(([id, p]) => p.isAlive);

    if (alivePlayers.length === 0) return;

    const currentIndex = alivePlayers.findIndex(([id]) => id === this.spectateTargetId);
    const nextIndex = (currentIndex + 1) % alivePlayers.length;
    this.spectateTargetId = alivePlayers[nextIndex][0];

    console.log('[GhostOrbits] Now spectating:', alivePlayers[nextIndex][1].username);
  }

  // ============================================
  // REMATCH
  // ============================================

  /**
   * Request rematch (rejoin queue)
   * @private
   */
  _requestRematch() {
    console.log('[GhostOrbits] Requesting rematch');

    this._sendMessage({
      type: 'request_rematch'
    });

    // Reset local state
    this.interpolationBuffer.clear();
    this.isSpectating = false;
    this.spectateTargetId = null;

    this._setState(GameState.WAITING);

    if (this.panel) {
      this.panel.showWaiting(this.serverState.playerCount);
    }
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
    if (this.panel) {
      this.panel.hide();
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
    return `${baseUrl}/ws/global-arena`;
  }

  /**
   * Get default server URL
   * @returns {string}
   * @private
   */
  _getDefaultServerUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return 'https://lrsl-driller-production.up.railway.app';
  }

  /**
   * Handle page visibility change
   * @private
   */
  _handleVisibilityChange() {
    if (document.hidden && this.state === GameState.PLAYING) {
      console.log('[GhostOrbits] Page hidden while playing');
      // Optionally send idle input to prevent AFK penalty
      this._sendMessage({
        type: 'global_arena_input',
        direction: { x: 0, y: 0 },
        spacebar: false,
        idle: true
      });
    }
  }

  // ============================================
  // PUBLIC GETTERS
  // ============================================

  /**
   * Get current game state
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * Get local player info
   * @returns {Object|null}
   */
  getLocalPlayer() {
    return this.serverState.players[this.playerId] || null;
  }

  /**
   * Get all players
   * @returns {Object}
   */
  getPlayers() {
    return this.serverState.players;
  }

  /**
   * Check if connected to server
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default GhostOrbitsController;
