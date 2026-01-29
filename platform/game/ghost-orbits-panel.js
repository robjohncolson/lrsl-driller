/**
 * Ghost Orbits Panel - Multiplayer Arena UI
 *
 * Full-screen overlay UI for the Ghost Orbits multiplayer arena.
 * Provides lobby entry, in-game HUD, elimination/rejoin flow, and victory screens.
 *
 * @version 2.0.0 - Global multiplayer arena
 */

export class GhostOrbitsPanel {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container element to mount the panel into
   * @param {Function} options.onClose - Callback when close button is clicked
   * @param {Function} options.onReturnToPractice - Callback when returning to practice
   * @param {Function} options.onRematch - Callback when player chooses to rematch (deprecated)
   * @param {Function} options.onEnterArena - Callback when player wants to enter arena
   * @param {Function} options.onRejoin - Callback when eliminated player wants to rejoin
   * @param {Function} options.onSpectate - Callback when player wants to spectate
   * @param {Function} options.onLeave - Callback when player leaves arena
   * @param {Function} options.onSendInput - Callback to send player input (direction, spacebar)
   * @param {Object} options.wsClient - WebSocket client for arena communication
   */
  constructor(options) {
    this.container = options.container;
    this.onClose = options.onClose || (() => {});
    this.onReturnToPractice = options.onReturnToPractice || (() => {});
    this.onRematch = options.onRematch || (() => {}); // Legacy
    this.onEnterArena = options.onEnterArena || (() => {});
    this.onRejoin = options.onRejoin || (() => {});
    this.onSpectate = options.onSpectate || (() => {});
    this.onLeave = options.onLeave || (() => {});
    this.onSendInput = options.onSendInput || (() => {});
    this.wsClient = options.wsClient || null;

    this.isVisible = false;
    this.currentRound = 1;
    this.timerSeconds = 0;
    this.playerTerritories = [];
    this.isEliminated = false;
    this.eliminatedStats = null;
    this.resultsData = null;

    // Multiplayer arena state
    this.currentView = 'lobby'; // 'lobby', 'game', 'eliminated', 'spectating', 'winner'
    this.potAmount = 0;
    this.entryStarCost = 1;
    this.entryPointCost = 100;
    this.playerLives = 3;
    this.maxLives = 3;
    this.playersInArena = [];
    this.localPlayerId = null;
    this.isSpectating = false;

    // Bind escape key handler
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleGameInput = this._handleGameInput.bind(this);

    // Store help screen key handler for cleanup
    this._helpKeyHandler = null;

    this._render();
    this._addStyles();
    this._attachEventListeners();
  }

  /**
   * Initialize the panel (for API compatibility)
   * @returns {Promise<void>}
   */
  async init() {
    return Promise.resolve();
  }

  /**
   * Show the panel
   */
  show() {
    console.log('[GhostOrbitsPanel] show() called, isVisible:', this.isVisible);
    if (this.isVisible) return;

    this.isVisible = true;
    if (this.overlayElement) {
      this.overlayElement.classList.add('visible');
    }

    // Add keyboard listener
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Hide the panel
   */
  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    if (this.overlayElement) {
      this.overlayElement.classList.remove('visible');
    }

    // Remove keyboard listener
    document.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('keydown', this._handleGameInput);
    document.removeEventListener('keyup', this._handleGameInput);
  }

  // ==========================================================================
  // HELPER METHODS FOR STATE ACCESS
  // ==========================================================================

  /**
   * Get player's current gold stars
   * @returns {number}
   */
  getPlayerGoldStars() {
    // Try DOM first (fastest)
    const goldCount = document.getElementById('gold-count');
    if (goldCount) {
      return parseInt(goldCount.textContent || '0', 10);
    }
    // Fallback to localStorage
    const cartridgeId = this._getCurrentCartridgeId();
    const starsKey = `driller_${cartridgeId}_stars`;
    try {
      const stars = JSON.parse(localStorage.getItem(starsKey) || '{}');
      return stars.gold || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get player's current points
   * @returns {number}
   */
  getPlayerPoints() {
    // Try DOM first
    const pointsEl = document.getElementById('total-points');
    if (pointsEl) {
      return parseInt(pointsEl.textContent || '0', 10);
    }
    // Fallback to localStorage
    const cartridgeId = this._getCurrentCartridgeId();
    const stateKey = `driller_${cartridgeId}_gameState`;
    try {
      const state = JSON.parse(localStorage.getItem(stateKey) || '{}');
      return state.totalPoints || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get ghost properties from ghost engine
   * @returns {Object|null}
   */
  getGhostProperties() {
    // Access through window global if available
    if (window.GhostEngine?.getGhostProfile) {
      const profile = window.GhostEngine.getGhostProfile();
      if (profile?.weights) {
        return profile.weights;
      }
    }
    return null;
  }

  /**
   * Update local state after bet/payout
   * @param {number} newGoldStars
   * @param {number} newPoints
   */
  updateLocalState(newGoldStars, newPoints) {
    const cartridgeId = this._getCurrentCartridgeId();

    // Update DOM
    const goldCountEl = document.getElementById('gold-count');
    const pointsEl = document.getElementById('total-points');
    if (goldCountEl) goldCountEl.textContent = newGoldStars;
    if (pointsEl) pointsEl.textContent = newPoints;

    // Update localStorage stars
    const starsKey = `driller_${cartridgeId}_stars`;
    try {
      const stars = JSON.parse(localStorage.getItem(starsKey) || '{}');
      stars.gold = newGoldStars;
      localStorage.setItem(starsKey, JSON.stringify(stars));
    } catch (e) {
      console.warn('[GhostOrbitsPanel] Failed to update stars in localStorage:', e);
    }

    // Update localStorage points
    const stateKey = `driller_${cartridgeId}_gameState`;
    try {
      const state = JSON.parse(localStorage.getItem(stateKey) || '{}');
      state.totalPoints = newPoints;
      localStorage.setItem(stateKey, JSON.stringify(state));
    } catch (e) {
      console.warn('[GhostOrbitsPanel] Failed to update points in localStorage:', e);
    }
  }

  /**
   * Get current cartridge ID
   * @private
   */
  _getCurrentCartridgeId() {
    // Try window global
    if (window.currentCartridgeId) {
      return window.currentCartridgeId;
    }
    // Try platform global
    if (window.platform?.currentCartridge?.manifest?.meta?.id) {
      return window.platform.currentCartridge.manifest.meta.id;
    }
    return 'unknown';
  }

  // ==========================================================================
  // WEBSOCKET INTEGRATION
  // ==========================================================================

  /**
   * Set WebSocket client for arena communication
   * @param {Object} wsClient
   */
  setWebSocketClient(wsClient) {
    this.wsClient = wsClient;
  }

  /**
   * Send arena join request
   */
  sendArenaJoin() {
    if (!this.wsClient?.send) {
      console.warn('[GhostOrbitsPanel] No WebSocket client available');
      return;
    }
    this.wsClient.send({
      type: 'global_arena_join',
      goldStars: this.getPlayerGoldStars(),
      points: this.getPlayerPoints(),
      ghostProperties: this.getGhostProperties()
    });
  }

  /**
   * Send player input to server
   * @param {Object} input - { direction: {x, y}, spacebar: boolean }
   */
  sendArenaInput(input) {
    if (!this.wsClient?.send) return;
    this.wsClient.send({
      type: 'global_arena_input',
      ...input
    });
  }

  /**
   * Send leave arena request
   */
  sendArenaLeave() {
    if (!this.wsClient?.send) return;
    this.wsClient.send({
      type: 'global_arena_leave'
    });
  }

  /**
   * Send rejoin request
   */
  sendArenaRejoin() {
    if (!this.wsClient?.send) return;
    this.wsClient.send({
      type: 'global_arena_rejoin',
      goldStars: this.getPlayerGoldStars(),
      points: this.getPlayerPoints()
    });
  }

  /**
   * Handle incoming WebSocket message
   * @param {Object} message
   */
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'arena_joined':
        this._handleArenaJoined(message);
        break;
      case 'arena_entry_failed':
        this._handleEntryFailed(message);
        break;
      case 'game_state':
        this._handleGameState(message);
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
      case 'rejoin_success':
        this._handleRejoinSuccess(message);
        break;
      case 'rejoin_failed':
        this._handleRejoinFailed(message);
        break;
      case 'pot_update':
        this.updatePot(message.pot);
        break;
    }
  }

  _handleArenaJoined(message) {
    this.localPlayerId = message.playerId;
    this.potAmount = message.pot || 0;
    this.playersInArena = message.players || [];
    this.playerLives = message.lives || 3;
    this.entryPointCost = message.pointCost || 100;

    // Deduct entry cost from local state
    const newGold = this.getPlayerGoldStars() - this.entryStarCost;
    const newPoints = this.getPlayerPoints() - this.entryPointCost;
    this.updateLocalState(newGold, newPoints);

    this.showGameView();
  }

  _handleEntryFailed(message) {
    alert(message.reason || 'Failed to join arena');
    this.showLobbyView();
  }

  _handleGameState(message) {
    // Update positions, dots, lives, etc.
    if (message.players) {
      this.playersInArena = message.players;
      this._updatePlayerList();
    }
    if (message.pot !== undefined) {
      this.updatePot(message.pot);
    }
    if (message.localLives !== undefined) {
      this.updateLives(message.localLives);
    }
    if (message.timer !== undefined) {
      this.updateTimer(message.timer);
    }
  }

  _handlePlayerJoined(message) {
    this.playersInArena.push(message.player);
    this._updatePlayerList();
    if (message.pot !== undefined) {
      this.updatePot(message.pot);
    }
  }

  _handlePlayerLeft(message) {
    this.playersInArena = this.playersInArena.filter(p => p.id !== message.playerId);
    this._updatePlayerList();
  }

  _handlePlayerEliminated(message) {
    if (message.playerId === this.localPlayerId) {
      this.showEliminatedView({
        placement: message.placement,
        pot: message.pot,
        playersRemaining: message.playersRemaining
      });
    } else {
      // Another player eliminated
      this.playersInArena = this.playersInArena.filter(p => p.id !== message.playerId);
      this._updatePlayerList();
    }
  }

  _handleArenaWinner(message) {
    if (message.winnerId === this.localPlayerId) {
      this.showWinnerView({
        payout: message.payout,
        playersDefeated: message.playersDefeated
      });
      // Add payout to local state
      const newPoints = this.getPlayerPoints() + message.payout;
      this.updateLocalState(this.getPlayerGoldStars(), newPoints);
    } else {
      // Someone else won
      this.showSpectatorWinView({
        winnerName: message.winnerName,
        payout: message.payout
      });
    }
  }

  _handleRejoinSuccess(message) {
    this.localPlayerId = message.playerId;
    this.playerLives = message.lives || 3;

    // Deduct rejoin cost
    const newGold = this.getPlayerGoldStars() - this.entryStarCost;
    const newPoints = this.getPlayerPoints() - message.pointCost;
    this.updateLocalState(newGold, newPoints);

    this.showGameView();
  }

  _handleRejoinFailed(message) {
    alert(message.reason || 'Failed to rejoin');
  }

  // ==========================================================================
  // VIEW MANAGEMENT
  // ==========================================================================

  /**
   * Show lobby/entry view
   */
  showLobbyView() {
    this.currentView = 'lobby';
    this.isEliminated = false;
    this._renderLobbyView();
  }

  /**
   * Show active game view
   */
  showGameView() {
    this.currentView = 'game';
    this.isEliminated = false;
    this.isSpectating = false;

    // Re-render to game HUD
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    this._render();
    this._attachEventListeners();
    this.overlayElement?.classList.add('visible');

    // Enable game input
    document.addEventListener('keydown', this._handleGameInput);
    document.addEventListener('keyup', this._handleGameInput);
  }

  /**
   * Show eliminated view with rejoin options
   * @param {Object} data
   */
  showEliminatedView(data) {
    this.currentView = 'eliminated';
    this.isEliminated = true;
    this.eliminatedStats = data;

    // Disable game input
    document.removeEventListener('keydown', this._handleGameInput);
    document.removeEventListener('keyup', this._handleGameInput);

    this._renderEliminatedView();
  }

  /**
   * Show spectator view
   */
  showSpectatorView() {
    this.currentView = 'spectating';
    this.isSpectating = true;
    this._renderSpectatorView();
  }

  /**
   * Show winner view
   * @param {Object} data - { payout, playersDefeated }
   */
  showWinnerView(data) {
    this.currentView = 'winner';
    this._renderWinnerView(data);
  }

  /**
   * Show view when someone else wins
   * @param {Object} data - { winnerName, payout }
   */
  showSpectatorWinView(data) {
    this._renderSpectatorWinView(data);
  }

  /**
   * Show connecting state while waiting for server
   */
  showConnecting() {
    this.currentView = 'connecting';
    this._renderConnectingView();
  }

  /**
   * Render connecting/loading view
   * @private
   */
  _renderConnectingView() {
    if (!this.overlayElement) return;

    this.overlayElement.innerHTML = `
      <div class="orbits-connecting-view">
        <div class="connecting-content">
          <div class="connecting-spinner"></div>
          <h2 class="connecting-title">Connecting to Arena...</h2>
          <p class="connecting-message">Please wait</p>
          <button class="connecting-cancel-btn" id="connecting-cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach cancel listener
    const cancelBtn = this.overlayElement.querySelector('#connecting-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.onClose();
      });
    }
  }

  /**
   * Show error message and close button
   * @param {string} errorMessage - Error message to display
   */
  showError(errorMessage) {
    this.currentView = 'error';
    this._renderErrorView(errorMessage);
  }

  /**
   * Render error view
   * @param {string} message - Error message
   * @private
   */
  _renderErrorView(message) {
    if (!this.overlayElement) return;

    this.overlayElement.innerHTML = `
      <div class="orbits-error-view">
        <div class="error-content">
          <div class="error-icon">!</div>
          <h2 class="error-title">Entry Failed</h2>
          <p class="error-message">${message}</p>
          <button class="error-close-btn" id="error-close-btn">Close</button>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach close listener
    const closeBtn = this.overlayElement.querySelector('#error-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.onClose();
      });
    }
  }

  /**
   * Show waiting/lobby state with player count
   * @param {number} playerCount - Number of players in arena
   */
  showWaiting(playerCount) {
    this.currentView = 'waiting';
    this.showLobbyView();
    this.updatePlayerCount(playerCount);
  }

  /**
   * Show spectating mode for a specific player
   * @param {string} targetPlayerId - ID of player being spectated
   */
  showSpectating(targetPlayerId) {
    this.currentView = 'spectating';
    this.isSpectating = true;
    this._renderSpectatorView();
  }

  /**
   * Update player list in the arena (public wrapper)
   * @param {Array} players - List of player objects with id, username, color, lives
   */
  updatePlayerList(players) {
    if (Array.isArray(players)) {
      this.playersInArena = players;
    }
    this._updatePlayerList();
  }

  // ==========================================================================
  // HUD UPDATE METHODS
  // ==========================================================================

  /**
   * Update the timer display
   * @param {number} seconds - Remaining seconds
   */
  updateTimer(seconds) {
    this.timerSeconds = seconds;
    const timerEl = this.overlayElement?.querySelector('#orbits-timer');
    if (timerEl) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timerEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

      timerEl.classList.remove('warning', 'danger');
      if (seconds <= 30) {
        timerEl.classList.add('danger');
      } else if (seconds <= 60) {
        timerEl.classList.add('warning');
      }
    }
  }

  /**
   * Update pot display
   * @param {number} amount
   */
  updatePot(amount) {
    this.potAmount = amount;
    const potEl = this.overlayElement?.querySelector('#arena-pot');
    if (potEl) {
      potEl.textContent = `${amount} pts`;
    }
    // Also update lobby pot if visible
    const lobbyPotEl = this.overlayElement?.querySelector('#lobby-pot-amount');
    if (lobbyPotEl) {
      lobbyPotEl.textContent = amount;
    }
  }

  /**
   * Update lives display
   * @param {number} lives - Remaining lives (0-3)
   */
  updateLives(lives) {
    this.playerLives = lives;
    const livesEl = this.overlayElement?.querySelector('#orbits-lives');
    if (livesEl) {
      const hearts = [];
      for (let i = 0; i < this.maxLives; i++) {
        hearts.push(i < lives ? '\u2665' : '\u2661'); // Filled or empty heart
      }
      livesEl.textContent = hearts.join(' ');

      livesEl.classList.remove('warning', 'danger');
      if (lives === 1) {
        livesEl.classList.add('danger');
      } else if (lives === 2) {
        livesEl.classList.add('warning');
      }
    }
  }

  /**
   * Update player count indicator
   * @param {number} count
   */
  updatePlayerCount(count) {
    const countEl = this.overlayElement?.querySelector('#arena-player-count');
    if (countEl) {
      countEl.textContent = `${count} player${count !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Update round display
   * @param {number} round
   */
  updateRound(round) {
    this.currentRound = round;
    const roundEl = this.overlayElement?.querySelector('#orbits-round');
    if (roundEl) {
      roundEl.textContent = `Round ${round}`;
    }
  }

  /**
   * Update the dot count display (for dot territory mode)
   * @param {number} playerDots
   * @param {number} shadowDots
   * @param {number} targetDots
   */
  updateDotCounts(playerDots, shadowDots, targetDots) {
    const dotCountEl = this.overlayElement?.querySelector('#orbits-dot-count');
    if (dotCountEl) {
      dotCountEl.textContent = `You: ${playerDots}/${targetDots}`;
    }
  }

  /**
   * Update mini player list
   * @private
   */
  _updatePlayerList() {
    const listEl = this.overlayElement?.querySelector('#arena-player-list');
    if (!listEl) return;

    const html = this.playersInArena.slice(0, 6).map(p => {
      const isLocal = p.id === this.localPlayerId;
      const livesStr = '\u2665'.repeat(p.lives || 0);
      return `
        <div class="arena-player-item ${isLocal ? 'local' : ''}">
          <span class="player-color" style="background: ${p.color || '#4488ff'}"></span>
          <span class="player-name">${isLocal ? 'You' : p.username}</span>
          <span class="player-lives">${livesStr}</span>
        </div>
      `;
    }).join('');

    if (this.playersInArena.length > 6) {
      listEl.innerHTML = html + `<div class="arena-player-more">+${this.playersInArena.length - 6} more</div>`;
    } else {
      listEl.innerHTML = html || '<div class="arena-player-empty">Waiting for players...</div>';
    }

    this.updatePlayerCount(this.playersInArena.length);
  }

  /**
   * Update territory bar (for territory mode)
   * @param {Array} territories
   */
  updateTerritory(territories) {
    this.playerTerritories = territories;
    const territoryBar = this.overlayElement?.querySelector('#orbits-territory-bar');
    if (!territoryBar) return;

    const segmentsHtml = territories
      .filter(t => t.percent > 0)
      .sort((a, b) => b.percent - a.percent)
      .map(t => {
        const displayName = t.isPlayer ? 'You' : `@${t.username}`;
        return `
          <span class="territory-segment" style="background-color: ${t.color}; flex-basis: ${t.percent}%;">
            <span class="territory-label">${displayName} ${Math.round(t.percent)}%</span>
          </span>
        `;
      })
      .join('');

    territoryBar.innerHTML = segmentsHtml || '<span class="territory-empty">No territory claimed</span>';
  }

  /**
   * Show countdown before game starts
   * @param {number} number
   */
  showCountdown(number) {
    let countdownOverlay = this.overlayElement?.querySelector('.orbits-countdown-overlay');

    if (!countdownOverlay && this.overlayElement) {
      countdownOverlay = document.createElement('div');
      countdownOverlay.className = 'orbits-countdown-overlay';
      const arenaContainer = this.overlayElement.querySelector('.orbits-arena-container');
      if (arenaContainer) {
        arenaContainer.appendChild(countdownOverlay);
      }
    }

    if (!countdownOverlay) return;

    if (number === 0) {
      countdownOverlay.innerHTML = '<span class="countdown-text countdown-go">GO!</span>';
      countdownOverlay.classList.add('visible');

      setTimeout(() => {
        countdownOverlay.classList.remove('visible');
        setTimeout(() => countdownOverlay.remove(), 300);
      }, 800);
    } else if (number > 0) {
      countdownOverlay.innerHTML = `<span class="countdown-text">${number}</span>`;
      countdownOverlay.classList.add('visible');
    } else {
      countdownOverlay.classList.remove('visible');
    }
  }

  // ==========================================================================
  // HELP SCREEN
  // ==========================================================================

  /**
   * Show the help screen overlay (updated for multiplayer arena)
   * @param {Function} [onDismiss]
   */
  showHelpScreen(onDismiss) {
    if (!this.overlayElement) return;

    const helpOverlay = document.createElement('div');
    helpOverlay.className = 'orbits-help-overlay';
    helpOverlay.innerHTML = `
      <div class="help-content">
        <h2 class="help-title">MULTIPLAYER ARENA</h2>

        <div class="help-section">
          <div class="help-icon">&#128176;</div>
          <div class="help-text">
            <strong>Entry Fee:</strong> 1 Gold Star + Points to enter. Winner takes the pot!
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">&#9899;</div>
          <div class="help-text">
            <strong>Claim Dots:</strong> Touch neutral (gray) dots to claim them for points.
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">&#128308;</div>
          <div class="help-text">
            <strong>Danger:</strong> Touch enemy dots WITHOUT spacebar = lose a life!
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">&#9211;</div>
          <div class="help-text">
            <strong>Flip:</strong> Press SPACE when touching enemy dot to flip it to your color.
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">&#128190;</div>
          <div class="help-text">
            <strong>Safe Zones:</strong> Land on records (spinning plates) - you're safe there!
          </div>
        </div>

        <div class="help-section help-goal">
          <div class="help-icon">&#127942;</div>
          <div class="help-text">
            <strong>Win:</strong> Be the last player standing! Eliminated players can rejoin.
          </div>
        </div>

        <div class="help-controls">
          <p><strong>ARROWS/WASD</strong> = Move | <strong>SPACEBAR</strong> = Land/Launch/Flip</p>
        </div>

        <button class="help-dismiss-btn">GOT IT! [SPACE]</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .orbits-help-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
      }
      .help-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #4488ff;
        border-radius: 12px;
        padding: 24px 32px;
        max-width: 500px;
        text-align: left;
        box-shadow: 0 0 40px rgba(68, 136, 255, 0.3);
      }
      .help-title {
        text-align: center;
        color: #4488ff;
        font-size: 28px;
        margin: 0 0 20px 0;
        text-shadow: 0 0 10px rgba(68, 136, 255, 0.5);
      }
      .help-section {
        display: flex;
        align-items: flex-start;
        margin: 12px 0;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      .help-section.help-goal {
        background: rgba(68, 136, 255, 0.15);
        border: 1px solid rgba(68, 136, 255, 0.3);
      }
      .help-icon {
        font-size: 24px;
        margin-right: 12px;
        min-width: 32px;
        text-align: center;
      }
      .help-text {
        color: #ddd;
        line-height: 1.4;
      }
      .help-text strong {
        color: #fff;
      }
      .help-controls {
        text-align: center;
        margin: 20px 0 16px 0;
        padding: 12px;
        background: rgba(68, 136, 255, 0.1);
        border-radius: 8px;
        color: #aaddff;
      }
      .help-controls strong {
        color: #4488ff;
      }
      .help-dismiss-btn {
        display: block;
        width: 100%;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        color: #fff;
        background: linear-gradient(135deg, #4488ff 0%, #2266cc 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .help-dismiss-btn:hover {
        transform: scale(1.02);
        box-shadow: 0 0 20px rgba(68, 136, 255, 0.5);
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    helpOverlay.appendChild(style);

    const dismiss = () => {
      helpOverlay.style.animation = 'fadeIn 0.2s ease-out reverse';
      setTimeout(() => {
        helpOverlay.remove();
        if (onDismiss) onDismiss();
      }, 200);
    };

    helpOverlay.querySelector('.help-dismiss-btn').addEventListener('click', dismiss);

    const handleKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        document.removeEventListener('keydown', handleKey);
        this._helpKeyHandler = null;
        dismiss();
      }
    };
    this._helpKeyHandler = handleKey;
    document.addEventListener('keydown', handleKey);

    const arenaContainer = this.overlayElement.querySelector('.orbits-arena-container');
    if (arenaContainer) {
      arenaContainer.appendChild(helpOverlay);
    }
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  /**
   * Render the main panel HTML (game view)
   * @private
   */
  _render() {
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'ghost-orbits-overlay';
    this.overlayElement.innerHTML = `
      <!-- Header Bar -->
      <div class="orbits-header">
        <div class="orbits-header-left">
          <button class="orbits-close-btn" aria-label="Close Arena">&times;</button>
          <h2 class="orbits-title">Ghost Arena</h2>
        </div>
        <div class="orbits-header-center">
          <div class="arena-pot-display">
            <span class="pot-label">POT:</span>
            <span class="pot-amount" id="arena-pot">${this.potAmount} pts</span>
          </div>
          <span class="orbits-timer" id="orbits-timer">--:--</span>
          <span class="orbits-dot-count" id="orbits-dot-count"></span>
          <span class="orbits-lives" id="orbits-lives">\u2665 \u2665 \u2665</span>
        </div>
        <div class="orbits-header-right">
          <span class="arena-player-count" id="arena-player-count">${this.playersInArena.length} players</span>
        </div>
      </div>

      <!-- Main Arena Area -->
      <div class="orbits-arena-container">
        <div class="orbits-arena-canvas-mount">
          <!-- Game canvas will be mounted here -->
        </div>

        <!-- Mini Player List (overlay) -->
        <div class="arena-player-list-container">
          <div class="arena-player-list" id="arena-player-list">
            <div class="arena-player-empty">Waiting for players...</div>
          </div>
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="orbits-footer">
        <div class="orbits-territory-bar" id="orbits-territory-bar">
          <span class="territory-empty">Waiting for game...</span>
        </div>
        <div class="orbits-footer-info">
          <div class="orbits-footer-left">
            <span class="orbits-territory-text" id="orbits-territory-text"></span>
          </div>
          <div class="orbits-footer-controls">
            <span class="orbits-control-hint">[ARROWS: move] [SPACE: land/flip]</span>
          </div>
          <div class="orbits-footer-right">
            <span class="orbits-exit-hint">[ESC to leave]</span>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.overlayElement);
  }

  /**
   * Render lobby/entry view
   * @private
   */
  _renderLobbyView() {
    if (!this.overlayElement) return;

    const goldStars = this.getPlayerGoldStars();
    const points = this.getPlayerPoints();
    const canEnter = goldStars >= this.entryStarCost && points >= this.entryPointCost;

    this.overlayElement.innerHTML = `
      <div class="orbits-lobby-view">
        <div class="lobby-content">
          <h1 class="lobby-title">GHOST ARENA</h1>
          <p class="lobby-subtitle">Last one standing wins the pot!</p>

          <!-- Pot Display -->
          <div class="lobby-pot-box">
            <span class="lobby-pot-label">CURRENT POT</span>
            <span class="lobby-pot-amount" id="lobby-pot-amount">${this.potAmount}</span>
            <span class="lobby-pot-unit">points</span>
          </div>

          <!-- Entry Cost -->
          <div class="lobby-entry-cost">
            <span class="entry-cost-label">Entry Fee:</span>
            <span class="entry-cost-value">${this.entryStarCost} \u2B50 + ${this.entryPointCost} pts</span>
          </div>

          <!-- Your Balance -->
          <div class="lobby-balance">
            <span>Your balance: ${goldStars} \u2B50 | ${points} pts</span>
          </div>

          <!-- Players in Arena -->
          <div class="lobby-players-box">
            <h3 class="lobby-players-title">Players in Arena (${this.playersInArena.length})</h3>
            <div class="lobby-players-list" id="lobby-players-list">
              ${this.playersInArena.length > 0
                ? this.playersInArena.map(p => `
                    <div class="lobby-player-item">
                      <span class="player-color" style="background: ${p.color || '#4488ff'}"></span>
                      <span class="player-name">${p.username}</span>
                    </div>
                  `).join('')
                : '<div class="lobby-no-players">No players yet - be the first!</div>'
              }
            </div>
          </div>

          <!-- Enter Button -->
          <button class="lobby-enter-btn ${canEnter ? '' : 'disabled'}" id="lobby-enter-btn" ${canEnter ? '' : 'disabled'}>
            ${canEnter ? 'Enter Arena' : 'Not Enough Resources'}
          </button>

          <!-- Help Link -->
          <button class="lobby-help-btn" id="lobby-help-btn">How to Play</button>

          <!-- Close Button -->
          <button class="lobby-close-btn" id="lobby-close-btn">Back to Practice</button>
        </div>
      </div>
    `;

    // Re-attach event listeners
    this._attachLobbyListeners();
  }

  /**
   * Attach lobby-specific event listeners
   * @private
   */
  _attachLobbyListeners() {
    const enterBtn = this.overlayElement?.querySelector('#lobby-enter-btn');
    const helpBtn = this.overlayElement?.querySelector('#lobby-help-btn');
    const closeBtn = this.overlayElement?.querySelector('#lobby-close-btn');

    if (enterBtn && !enterBtn.disabled) {
      enterBtn.addEventListener('click', () => {
        this._showEntryConfirmDialog();
      });
    }

    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        this.showHelpScreen();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.onReturnToPractice();
      });
    }
  }

  /**
   * Show entry confirmation dialog
   * @private
   */
  _showEntryConfirmDialog() {
    const modal = document.createElement('div');
    modal.className = 'orbits-confirm-modal';
    modal.innerHTML = `
      <div class="confirm-modal-content">
        <h2 class="confirm-title">Enter Arena?</h2>
        <p class="confirm-message">You will bet:</p>
        <div class="confirm-cost">
          <span>${this.entryStarCost} \u2B50 Gold Star</span>
          <span>${this.entryPointCost} Points</span>
        </div>
        <p class="confirm-note">If you win, you'll receive the entire pot!</p>
        <div class="confirm-actions">
          <button class="confirm-yes-btn" id="confirm-yes-btn">Enter!</button>
          <button class="confirm-no-btn" id="confirm-no-btn">Cancel</button>
        </div>
      </div>
    `;

    this.overlayElement?.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });

    const yesBtn = modal.querySelector('#confirm-yes-btn');
    const noBtn = modal.querySelector('#confirm-no-btn');

    yesBtn?.addEventListener('click', () => {
      modal.remove();
      this.sendArenaJoin();
      this.onEnterArena();
    });

    noBtn?.addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Render eliminated player view
   * @private
   */
  _renderEliminatedView() {
    if (!this.overlayElement) return;

    const stats = this.eliminatedStats || {};
    const placement = stats.placement || '?';
    const playersRemaining = stats.playersRemaining || 0;
    const potAmount = stats.pot || this.potAmount;

    const goldStars = this.getPlayerGoldStars();
    const points = this.getPlayerPoints();
    const canRejoin = goldStars >= this.entryStarCost && points >= this.entryPointCost;

    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    this.overlayElement.innerHTML = `
      <div class="orbits-eliminated-view">
        <div class="eliminated-content">
          <div class="eliminated-icon">
            <span class="ghost-absorbed">&#128123;</span>
          </div>
          <h1 class="eliminated-title">ELIMINATED!</h1>

          <div class="eliminated-stats">
            <div class="eliminated-stat">
              <span class="stat-value">${getOrdinal(placement)}</span>
              <span class="stat-label">Place</span>
            </div>
            <div class="eliminated-stat">
              <span class="stat-value">${playersRemaining}</span>
              <span class="stat-label">Remaining</span>
            </div>
          </div>

          <div class="eliminated-pot-info">
            <p>Current pot: <strong>${potAmount} pts</strong></p>
          </div>

          <div class="eliminated-actions">
            <button class="eliminated-rejoin-btn ${canRejoin ? '' : 'disabled'}" id="eliminated-rejoin-btn" ${canRejoin ? '' : 'disabled'}>
              ${canRejoin ? `Rejoin (${this.entryStarCost} \u2B50 + ${this.entryPointCost} pts)` : 'Need more stars to rejoin'}
            </button>
            <button class="eliminated-spectate-btn" id="eliminated-spectate-btn">Spectate</button>
            <button class="eliminated-leave-btn" id="eliminated-leave-btn">Leave Arena</button>
          </div>

          <div class="eliminated-balance">
            <span>Your balance: ${goldStars} \u2B50 | ${points} pts</span>
          </div>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach button listeners
    const rejoinBtn = this.overlayElement.querySelector('#eliminated-rejoin-btn');
    const spectateBtn = this.overlayElement.querySelector('#eliminated-spectate-btn');
    const leaveBtn = this.overlayElement.querySelector('#eliminated-leave-btn');

    if (rejoinBtn && canRejoin) {
      rejoinBtn.addEventListener('click', () => {
        this.sendArenaRejoin();
        this.onRejoin();
      });
    }

    if (spectateBtn) {
      spectateBtn.addEventListener('click', () => {
        this.showSpectatorView();
        this.onSpectate();
      });
    }

    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => {
        this.sendArenaLeave();
        this.onLeave();
        this.onReturnToPractice();
      });
    }
  }

  /**
   * Render spectator view
   * @private
   */
  _renderSpectatorView() {
    if (!this.overlayElement) return;

    // Re-render game view but with spectator badge
    if (this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    this._render();
    this._attachEventListeners();
    this.overlayElement?.classList.add('visible');

    // Add spectator indicator
    const header = this.overlayElement.querySelector('.orbits-header');
    if (header) {
      const spectatorBadge = document.createElement('span');
      spectatorBadge.className = 'spectator-badge';
      spectatorBadge.textContent = 'SPECTATING';
      header.querySelector('.orbits-header-left')?.appendChild(spectatorBadge);
    }
  }

  /**
   * Render winner view
   * @param {Object} data - { payout, playersDefeated }
   * @private
   */
  _renderWinnerView(data) {
    if (!this.overlayElement) return;

    const payout = data.payout || 0;
    const playersDefeated = data.playersDefeated || 0;

    this.overlayElement.innerHTML = `
      <div class="orbits-winner-view">
        <div class="winner-content">
          <div class="winner-icon-container">
            <div class="winner-icon">&#127942;</div>
            <div class="winner-sparkles">
              <span class="sparkle">&#10024;</span>
              <span class="sparkle">&#10024;</span>
              <span class="sparkle">&#10024;</span>
              <span class="sparkle">&#10024;</span>
            </div>
          </div>

          <h1 class="winner-title">YOU WON!</h1>
          <p class="winner-subtitle">Last one standing!</p>

          <div class="winner-payout-box">
            <span class="payout-label">PAYOUT</span>
            <span class="payout-amount">+${payout}</span>
            <span class="payout-unit">points</span>
          </div>

          <div class="winner-stats">
            <div class="winner-stat">
              <span class="stat-value">${playersDefeated}</span>
              <span class="stat-label">Players Defeated</span>
            </div>
          </div>

          <div class="winner-actions">
            <button class="winner-again-btn" id="winner-again-btn">Play Again</button>
            <button class="winner-leave-btn" id="winner-leave-btn">Leave Arena</button>
          </div>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach button listeners
    const againBtn = this.overlayElement.querySelector('#winner-again-btn');
    const leaveBtn = this.overlayElement.querySelector('#winner-leave-btn');

    if (againBtn) {
      againBtn.addEventListener('click', () => {
        this.showLobbyView();
      });
    }

    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => {
        this.sendArenaLeave();
        this.onLeave();
        this.onReturnToPractice();
      });
    }
  }

  /**
   * Render view when someone else wins
   * @param {Object} data - { winnerName, payout }
   * @private
   */
  _renderSpectatorWinView(data) {
    if (!this.overlayElement) return;

    const winnerName = data.winnerName || 'Unknown';
    const payout = data.payout || 0;

    this.overlayElement.innerHTML = `
      <div class="orbits-spectator-win-view">
        <div class="spectator-win-content">
          <div class="spectator-win-icon">&#127942;</div>
          <h1 class="spectator-win-title">GAME OVER</h1>
          <p class="spectator-win-subtitle">Winner: <strong>${winnerName}</strong></p>
          <p class="spectator-win-payout">Won ${payout} points!</p>

          <div class="spectator-win-actions">
            <button class="spectator-again-btn" id="spectator-again-btn">Play Again</button>
            <button class="spectator-leave-btn" id="spectator-leave-btn">Leave Arena</button>
          </div>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    const againBtn = this.overlayElement.querySelector('#spectator-again-btn');
    const leaveBtn = this.overlayElement.querySelector('#spectator-leave-btn');

    if (againBtn) {
      againBtn.addEventListener('click', () => {
        this.showLobbyView();
      });
    }

    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => {
        this.sendArenaLeave();
        this.onLeave();
        this.onReturnToPractice();
      });
    }
  }

  // ==========================================================================
  // LEGACY METHODS (for backward compatibility)
  // ==========================================================================

  /**
   * @deprecated Use showLobbyView() instead
   */
  resetToActiveView() {
    this.showGameView();
  }

  /**
   * Show eliminated (legacy)
   * @deprecated Use showEliminatedView() instead
   */
  showEliminated(stats) {
    this.showEliminatedView(stats);
  }

  /**
   * Show results (legacy - for solo mode)
   * @deprecated
   */
  showResults(data) {
    if (data.winner === 'player') {
      this._renderVictoryScreen(data);
    } else {
      this._renderDefeatScreen(data);
    }
  }

  /**
   * Legacy victory screen
   * @private
   */
  _renderVictoryScreen(data) {
    this.showWinnerView({ payout: 0, playersDefeated: 1 });
  }

  /**
   * Legacy defeat screen
   * @private
   */
  _renderDefeatScreen(data) {
    this.showEliminatedView({ placement: 2, playersRemaining: 1 });
  }

  /**
   * Show round results (legacy)
   * @deprecated
   */
  showRoundResults(results) {
    this.resultsData = results;
  }

  /**
   * Update generation display (legacy)
   */
  updateGeneration(generation) {
    // No-op for multiplayer
  }

  /**
   * Show rematch prompt (legacy)
   * @deprecated
   */
  showRematchPrompt(onRematch, onExit) {
    // Redirect to eliminated view
    this.showEliminatedView({});
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle keyboard events (panel-level)
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyDown(event) {
    if (event.key === 'Escape' && this.isVisible) {
      if (this.currentView === 'game' || this.currentView === 'spectating') {
        // Confirm before leaving during game
        if (confirm('Leave the arena? You will lose your entry fee.')) {
          this.sendArenaLeave();
          this.onLeave();
          this.onClose();
        }
      } else {
        this.onClose();
      }
    }
  }

  /**
   * Handle game input (movement and spacebar)
   * @param {KeyboardEvent} event
   * @private
   */
  _handleGameInput(event) {
    if (this.isSpectating || this.isEliminated) return;

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

    if (event.type === 'keydown') {
      if (INPUT_KEYS[event.code]) {
        event.preventDefault();
        this.sendArenaInput({
          direction: INPUT_KEYS[event.code],
          spacebar: false
        });
        this.onSendInput({ direction: INPUT_KEYS[event.code], spacebar: false });
      } else if (event.code === 'Space') {
        event.preventDefault();
        this.sendArenaInput({
          direction: null,
          spacebar: true
        });
        this.onSendInput({ direction: null, spacebar: true });
      }
    }
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    const closeBtn = this.overlayElement?.querySelector('.orbits-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.currentView === 'game') {
          if (confirm('Leave the arena? You will lose your entry fee.')) {
            this.sendArenaLeave();
            this.onLeave();
            this.onClose();
          }
        } else {
          this.onClose();
        }
      });
    }
  }

  /**
   * Get the arena container element
   * @returns {HTMLElement|null}
   */
  getArenaContainer() {
    return this.overlayElement?.querySelector('.orbits-arena-canvas-mount') || null;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    document.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('keydown', this._handleGameInput);
    document.removeEventListener('keyup', this._handleGameInput);

    if (this._helpKeyHandler) {
      document.removeEventListener('keydown', this._helpKeyHandler);
      this._helpKeyHandler = null;
    }

    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    this.overlayElement = null;
  }

  // ==========================================================================
  // STYLES
  // ==========================================================================

  /**
   * Add styles for the panel
   * @private
   */
  _addStyles() {
    if (document.getElementById('ghost-orbits-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'ghost-orbits-panel-styles';
    style.textContent = `
      /* ===========================================
         GHOST ORBITS PANEL - MULTIPLAYER ARENA
         =========================================== */

      .ghost-orbits-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #0a0a12;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', system-ui, sans-serif;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .ghost-orbits-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      /* -------------------------------------------
         HEADER BAR
         ------------------------------------------- */

      .orbits-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: linear-gradient(180deg, #1a1f2e 0%, #0d1117 100%);
        border-bottom: 1px solid #112244;
        flex-shrink: 0;
      }

      .orbits-header-left,
      .orbits-header-center,
      .orbits-header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .orbits-header-left {
        flex: 1;
      }

      .orbits-header-center {
        flex: 0 0 auto;
      }

      .orbits-header-right {
        flex: 1;
        justify-content: flex-end;
      }

      .orbits-close-btn {
        background: transparent;
        border: 1px solid #88aacc44;
        border-radius: 4px;
        color: #88aacc;
        font-size: 24px;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        line-height: 1;
        padding: 0;
      }

      .orbits-close-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
        color: #ffffff;
      }

      .orbits-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: 0.5px;
      }

      .spectator-badge {
        background: #f59e0b;
        color: #000;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        margin-left: 12px;
      }

      /* Pot Display */
      .arena-pot-display {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
        border: 1px solid #ffd700;
        border-radius: 6px;
      }

      .pot-label {
        font-size: 12px;
        color: #ffd700;
        font-weight: 600;
        text-transform: uppercase;
      }

      .pot-amount {
        font-size: 18px;
        font-weight: 700;
        color: #ffd700;
        font-variant-numeric: tabular-nums;
      }

      .arena-player-count {
        font-size: 14px;
        color: #88aacc;
        padding: 6px 12px;
        background: rgba(136, 170, 204, 0.1);
        border: 1px solid #112244;
        border-radius: 4px;
      }

      .orbits-timer {
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        font-variant-numeric: tabular-nums;
      }

      .orbits-timer.warning {
        color: #f59e0b;
        animation: timer-pulse 1s infinite;
      }

      .orbits-timer.danger {
        color: #ef4444;
        animation: timer-pulse 0.5s infinite;
      }

      .orbits-dot-count {
        font-size: 14px;
        color: #88aacc;
        margin-left: 12px;
      }

      .orbits-lives {
        font-size: 20px;
        color: #ff4444;
        margin-left: 20px;
        letter-spacing: 4px;
      }

      .orbits-lives.warning {
        color: #f59e0b;
        animation: lives-pulse 1s infinite;
      }

      .orbits-lives.danger {
        color: #ef4444;
        animation: lives-pulse 0.5s infinite;
      }

      @keyframes timer-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      @keyframes lives-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      /* -------------------------------------------
         ARENA CONTAINER
         ------------------------------------------- */

      .orbits-arena-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        position: relative;
        overflow: hidden;
        background:
          linear-gradient(rgba(17, 34, 68, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.3) 1px, transparent 1px);
        background-size: 40px 40px;
        background-position: center center;
      }

      .orbits-arena-canvas-mount {
        width: 100%;
        height: 100%;
        max-width: 1000px;
        max-height: 800px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .orbits-arena-canvas-mount canvas {
        max-width: 100%;
        max-height: calc(100vh - 120px);
        object-fit: contain;
        border: 2px solid #112244;
        border-radius: 8px;
        box-shadow:
          0 0 20px rgba(68, 136, 255, 0.1),
          inset 0 0 60px rgba(0, 0, 0, 0.5);
      }

      /* Mini Player List */
      .arena-player-list-container {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10;
      }

      .arena-player-list {
        background: rgba(10, 10, 18, 0.85);
        border: 1px solid #112244;
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 140px;
      }

      .arena-player-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        font-size: 13px;
        color: #88aacc;
      }

      .arena-player-item.local {
        color: #4488ff;
        font-weight: 600;
      }

      .arena-player-item .player-color {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .arena-player-item .player-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arena-player-item .player-lives {
        color: #ff4444;
        font-size: 11px;
      }

      .arena-player-more {
        font-size: 11px;
        color: #6b7280;
        padding: 4px 0;
      }

      .arena-player-empty {
        font-size: 12px;
        color: #6b7280;
        text-align: center;
      }

      /* -------------------------------------------
         COUNTDOWN OVERLAY
         ------------------------------------------- */

      .orbits-countdown-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 10, 18, 0.8);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
        z-index: 10;
      }

      .orbits-countdown-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .countdown-text {
        font-size: 120px;
        font-weight: 700;
        color: #ffffff;
        text-shadow:
          0 0 20px rgba(68, 136, 255, 0.8),
          0 0 40px rgba(68, 136, 255, 0.4);
        animation: countdown-pop 0.5s ease-out;
      }

      .countdown-go {
        color: #00ff88;
        text-shadow:
          0 0 20px rgba(0, 255, 136, 0.8),
          0 0 40px rgba(0, 255, 136, 0.4);
      }

      @keyframes countdown-pop {
        0% { transform: scale(1.5); opacity: 0; }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); opacity: 1; }
      }

      /* -------------------------------------------
         FOOTER BAR
         ------------------------------------------- */

      .orbits-footer {
        flex-shrink: 0;
        background: linear-gradient(180deg, #0d1117 0%, #1a1f2e 100%);
        border-top: 1px solid #112244;
        padding: 12px 20px;
      }

      .orbits-territory-bar {
        display: flex;
        height: 24px;
        background: #0a0a12;
        border: 1px solid #112244;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .territory-segment {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: flex-basis 0.5s ease;
        min-width: 0;
        overflow: hidden;
      }

      .territory-label {
        font-size: 11px;
        font-weight: 600;
        color: #ffffff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 6px;
      }

      .territory-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #88aacc;
        font-size: 12px;
      }

      .orbits-footer-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .orbits-footer-left,
      .orbits-footer-right {
        flex: 1;
      }

      .orbits-footer-controls {
        flex: 0 0 auto;
      }

      .orbits-footer-right {
        text-align: right;
      }

      .orbits-territory-text {
        font-size: 13px;
        color: #88aacc;
      }

      .orbits-control-hint,
      .orbits-exit-hint {
        font-size: 12px;
        color: #4b5563;
      }

      /* -------------------------------------------
         LOBBY VIEW
         ------------------------------------------- */

      .orbits-lobby-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(68, 136, 255, 0.08) 0%, transparent 60%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .lobby-content {
        text-align: center;
        max-width: 450px;
        width: 100%;
      }

      .lobby-title {
        font-size: 48px;
        font-weight: 700;
        color: #4488ff;
        margin: 0 0 8px 0;
        text-shadow: 0 0 20px rgba(68, 136, 255, 0.5);
        letter-spacing: 3px;
      }

      .lobby-subtitle {
        font-size: 18px;
        color: #88aacc;
        margin: 0 0 30px 0;
      }

      .lobby-pot-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px;
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
        border: 2px solid #ffd700;
        border-radius: 12px;
        margin-bottom: 20px;
      }

      .lobby-pot-label {
        font-size: 12px;
        color: #ffd700;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .lobby-pot-amount {
        font-size: 56px;
        font-weight: 700;
        color: #ffd700;
        line-height: 1;
        margin: 8px 0;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      }

      .lobby-pot-unit {
        font-size: 16px;
        color: #88aacc;
      }

      .lobby-entry-cost {
        font-size: 16px;
        color: #ffffff;
        margin-bottom: 8px;
      }

      .entry-cost-label {
        color: #88aacc;
      }

      .entry-cost-value {
        font-weight: 600;
        color: #4488ff;
      }

      .lobby-balance {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
      }

      .lobby-players-box {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #112244;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
      }

      .lobby-players-title {
        font-size: 14px;
        color: #88aacc;
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .lobby-players-list {
        max-height: 120px;
        overflow-y: auto;
      }

      .lobby-player-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: rgba(136, 170, 204, 0.05);
        border-radius: 4px;
        margin-bottom: 4px;
      }

      .lobby-player-item .player-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .lobby-player-item .player-name {
        font-size: 14px;
        color: #ffffff;
      }

      .lobby-no-players {
        font-size: 13px;
        color: #6b7280;
        padding: 12px;
      }

      .lobby-enter-btn {
        width: 100%;
        padding: 16px 32px;
        font-size: 20px;
        font-weight: 700;
        color: #ffffff;
        background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 16px rgba(68, 136, 255, 0.4);
        margin-bottom: 12px;
      }

      .lobby-enter-btn:hover:not(.disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(68, 136, 255, 0.5);
      }

      .lobby-enter-btn.disabled {
        background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        cursor: not-allowed;
        box-shadow: none;
      }

      .lobby-help-btn {
        background: transparent;
        border: 1px solid #88aacc44;
        color: #88aacc;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        margin-right: 12px;
      }

      .lobby-help-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
      }

      .lobby-close-btn {
        background: transparent;
        border: 1px solid #88aacc44;
        color: #88aacc;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .lobby-close-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
      }

      /* -------------------------------------------
         CONFIRM MODAL
         ------------------------------------------- */

      .orbits-confirm-modal {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 10, 18, 0.85);
        z-index: 100;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .orbits-confirm-modal.visible {
        opacity: 1;
      }

      .confirm-modal-content {
        background: linear-gradient(180deg, #1a1f2e 0%, #0d1117 100%);
        border: 2px solid #4488ff;
        border-radius: 12px;
        padding: 32px 40px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(68, 136, 255, 0.3);
      }

      .confirm-title {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 12px 0;
      }

      .confirm-message {
        font-size: 16px;
        color: #88aacc;
        margin: 0 0 16px 0;
      }

      .confirm-cost {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        background: rgba(68, 136, 255, 0.1);
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .confirm-cost span {
        font-size: 18px;
        font-weight: 600;
        color: #4488ff;
      }

      .confirm-note {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 24px 0;
      }

      .confirm-actions {
        display: flex;
        gap: 12px;
      }

      .confirm-yes-btn,
      .confirm-no-btn {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .confirm-yes-btn {
        background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(68, 136, 255, 0.3);
      }

      .confirm-yes-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(68, 136, 255, 0.4);
      }

      .confirm-no-btn {
        background: rgba(136, 170, 204, 0.1);
        border: 1px solid #88aacc44;
        color: #88aacc;
      }

      .confirm-no-btn:hover {
        background: rgba(136, 170, 204, 0.15);
        border-color: #88aacc;
      }

      /* -------------------------------------------
         ELIMINATED VIEW
         ------------------------------------------- */

      .orbits-eliminated-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .eliminated-content {
        text-align: center;
        max-width: 500px;
      }

      .eliminated-icon {
        margin-bottom: 20px;
      }

      .ghost-absorbed {
        font-size: 80px;
        filter: grayscale(1) opacity(0.5);
        animation: ghost-fade 2s infinite;
      }

      @keyframes ghost-fade {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.05); }
      }

      .eliminated-title {
        font-size: 42px;
        font-weight: 700;
        color: #ef4444;
        margin: 0 0 30px 0;
        text-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        letter-spacing: 2px;
      }

      .eliminated-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-bottom: 24px;
      }

      .eliminated-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .eliminated-stat .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: #ffffff;
      }

      .eliminated-stat .stat-label {
        font-size: 13px;
        color: #88aacc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .eliminated-pot-info {
        font-size: 16px;
        color: #88aacc;
        margin-bottom: 24px;
      }

      .eliminated-pot-info strong {
        color: #ffd700;
      }

      .eliminated-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }

      .eliminated-rejoin-btn {
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 700;
        color: #ffffff;
        background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(68, 136, 255, 0.3);
      }

      .eliminated-rejoin-btn:hover:not(.disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(68, 136, 255, 0.4);
      }

      .eliminated-rejoin-btn.disabled {
        background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        cursor: not-allowed;
        box-shadow: none;
      }

      .eliminated-spectate-btn,
      .eliminated-leave-btn {
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        background: transparent;
        border: 1px solid #88aacc44;
        border-radius: 6px;
        color: #88aacc;
        cursor: pointer;
        transition: all 0.2s;
      }

      .eliminated-spectate-btn:hover,
      .eliminated-leave-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
      }

      .eliminated-balance {
        font-size: 14px;
        color: #6b7280;
      }

      /* -------------------------------------------
         WINNER VIEW
         ------------------------------------------- */

      .orbits-winner-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(255, 215, 0, 0.08) 0%, transparent 60%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .winner-content {
        text-align: center;
        max-width: 500px;
        animation: victory-fade-in 0.6s ease-out;
      }

      @keyframes victory-fade-in {
        0% { opacity: 0; transform: scale(0.9) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }

      .winner-icon-container {
        position: relative;
        margin-bottom: 20px;
      }

      .winner-icon {
        font-size: 100px;
        animation: victory-bounce 1s ease-in-out infinite;
      }

      @keyframes victory-bounce {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.05); }
      }

      .winner-sparkles {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 200px;
        pointer-events: none;
      }

      .winner-sparkles .sparkle {
        position: absolute;
        font-size: 24px;
        animation: sparkle-float 2s ease-in-out infinite;
      }

      .winner-sparkles .sparkle:nth-child(1) { top: 10%; left: 20%; animation-delay: 0s; }
      .winner-sparkles .sparkle:nth-child(2) { top: 15%; right: 15%; animation-delay: 0.5s; }
      .winner-sparkles .sparkle:nth-child(3) { bottom: 20%; left: 15%; animation-delay: 1s; }
      .winner-sparkles .sparkle:nth-child(4) { bottom: 25%; right: 20%; animation-delay: 1.5s; }

      @keyframes sparkle-float {
        0%, 100% { opacity: 0; transform: translateY(0) scale(0); }
        50% { opacity: 1; transform: translateY(-20px) scale(1); }
      }

      .winner-title {
        font-size: 56px;
        font-weight: 700;
        color: #ffd700;
        margin: 0 0 10px 0;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3);
        letter-spacing: 3px;
      }

      .winner-subtitle {
        font-size: 18px;
        color: #88aacc;
        margin: 0 0 30px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .winner-payout-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 32px;
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.05) 100%);
        border: 2px solid #00ff88;
        border-radius: 12px;
        margin-bottom: 24px;
      }

      .payout-label {
        font-size: 12px;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .payout-amount {
        font-size: 48px;
        font-weight: 700;
        color: #00ff88;
        line-height: 1;
        margin: 8px 0;
        text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
      }

      .payout-unit {
        font-size: 16px;
        color: #88aacc;
      }

      .winner-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-bottom: 30px;
      }

      .winner-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .winner-stat .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: #ffffff;
      }

      .winner-stat .stat-label {
        font-size: 13px;
        color: #88aacc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .winner-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .winner-again-btn {
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 700;
        color: #000;
        background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
      }

      .winner-again-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
      }

      .winner-leave-btn {
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 600;
        background: transparent;
        border: 1px solid #88aacc44;
        border-radius: 8px;
        color: #88aacc;
        cursor: pointer;
        transition: all 0.2s;
      }

      .winner-leave-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
      }

      /* -------------------------------------------
         SPECTATOR WIN VIEW
         ------------------------------------------- */

      .orbits-spectator-win-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(68, 136, 255, 0.05) 0%, transparent 50%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .spectator-win-content {
        text-align: center;
        max-width: 450px;
      }

      .spectator-win-icon {
        font-size: 80px;
        margin-bottom: 20px;
      }

      .spectator-win-title {
        font-size: 36px;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 12px 0;
      }

      .spectator-win-subtitle {
        font-size: 20px;
        color: #88aacc;
        margin: 0 0 8px 0;
      }

      .spectator-win-subtitle strong {
        color: #ffd700;
      }

      .spectator-win-payout {
        font-size: 16px;
        color: #00ff88;
        margin: 0 0 30px 0;
      }

      .spectator-win-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .spectator-again-btn {
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 700;
        color: #ffffff;
        background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(68, 136, 255, 0.3);
      }

      .spectator-again-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(68, 136, 255, 0.4);
      }

      .spectator-leave-btn {
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 600;
        background: transparent;
        border: 1px solid #88aacc44;
        border-radius: 8px;
        color: #88aacc;
        cursor: pointer;
        transition: all 0.2s;
      }

      .spectator-leave-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
      }

      /* -------------------------------------------
         CONNECTING VIEW
         ------------------------------------------- */

      .orbits-connecting-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(68, 136, 255, 0.08) 0%, transparent 60%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .connecting-content {
        text-align: center;
        max-width: 400px;
      }

      .connecting-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(68, 136, 255, 0.2);
        border-top-color: #4488ff;
        border-radius: 50%;
        margin: 0 auto 24px auto;
        animation: connecting-spin 1s linear infinite;
      }

      @keyframes connecting-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .connecting-title {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 12px 0;
      }

      .connecting-message {
        font-size: 16px;
        color: #88aacc;
        margin: 0 0 24px 0;
      }

      .connecting-cancel-btn {
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        background: transparent;
        border: 1px solid #88aacc44;
        border-radius: 6px;
        color: #88aacc;
        cursor: pointer;
        transition: all 0.2s;
      }

      .connecting-cancel-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
      }

      /* -------------------------------------------
         ERROR VIEW
         ------------------------------------------- */

      .orbits-error-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(255, 68, 68, 0.08) 0%, transparent 60%),
          linear-gradient(rgba(68, 34, 34, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(68, 34, 34, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .error-content {
        text-align: center;
        max-width: 400px;
      }

      .error-icon {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(255, 68, 68, 0.5);
        border-radius: 50%;
        margin: 0 auto 24px auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
        color: #ff4444;
      }

      .error-title {
        font-size: 28px;
        font-weight: 700;
        color: #ff6666;
        margin: 0 0 12px 0;
      }

      .error-message {
        font-size: 16px;
        color: #cc8888;
        margin: 0 0 24px 0;
      }

      .error-close-btn {
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        background: transparent;
        border: 1px solid #ff444444;
        border-radius: 6px;
        color: #ff6666;
        cursor: pointer;
        transition: all 0.2s;
      }

      .error-close-btn:hover {
        background: rgba(255, 68, 68, 0.1);
        border-color: #ff4444;
      }

      /* -------------------------------------------
         RESPONSIVE ADJUSTMENTS
         ------------------------------------------- */

      @media (max-width: 768px) {
        .orbits-header {
          padding: 10px 12px;
        }

        .orbits-title {
          font-size: 16px;
        }

        .orbits-timer {
          font-size: 18px;
        }

        .pot-amount {
          font-size: 14px;
        }

        .orbits-arena-container {
          padding: 10px;
        }

        .arena-player-list-container {
          top: 10px;
          right: 10px;
        }

        .orbits-footer {
          padding: 10px 12px;
        }

        .territory-label {
          font-size: 10px;
        }

        .lobby-title {
          font-size: 32px;
        }

        .lobby-pot-amount {
          font-size: 40px;
        }

        .eliminated-title,
        .winner-title {
          font-size: 32px;
        }

        .countdown-text {
          font-size: 80px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

export default GhostOrbitsPanel;
