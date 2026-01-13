/**
 * Pong Panel - Main UI component for Pong Duel system
 * Handles challenge flow, game rendering, and leaderboard
 *
 * v1.0: Initial implementation
 */

import { PONG_CONFIG } from '../../shared/pong.config.js';
import { PongGame } from './pong-game.js';
import { PongRenderer } from './pong-renderer.js';

export class PongPanel {
  constructor(container, config) {
    this._container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this._gameId = config.gameId;
    this._username = config.username;
    this._serverUrl = config.serverUrl;
    this._playerColors = config.playerColors || {};
    this._tokens = config.tokens || PONG_CONFIG.startingTokens;
    this._duelsEnabled = config.duelsEnabled !== false;

    // Current state
    this._activeGame = null;
    this._renderer = null;
    this._pendingChallenge = null;       // Challenge I sent
    this._incomingChallenge = null;      // Challenge sent to me
    this._pendingAcceptAfterSubmit = null;
    this._challengeTimerInterval = null;
    this._pendingChallengeInterval = null;  // v3.0.1: Timer for attacker pending UI
    this._pollInterval = null;              // v3.0.1: Polling fallback interval
    this._leaderboardData = [];
    this._wsConnected = false;              // v3.0.1: WebSocket connection status

    // Spectator game (watching others duel)
    this._spectatorGame = null;
    this._spectatorRenderer = null;

    // Callbacks
    this._onChallenge = config.onChallenge || (() => {});

    // Create UI
    if (this._container) {
      this._createUI();
      this._loadLeaderboard();
    }
  }

  /**
   * Create the panel UI
   */
  _createUI() {
    this._container.innerHTML = `
      <div class="pong-panel" style="background:#111827;color:#00ff41;font-family:monospace;border-radius:0;overflow:hidden;">
        <!-- Header -->
        <div class="pong-header" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#0f172a;border-bottom:1px solid #166534;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:bold;font-size:1rem;">PONG DUEL</span>
            <span id="pong-connection" style="font-size:10px;color:#ef4444;" title="Disconnected">●</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="pong-tokens" style="background:#1e293b;padding:4px 8px;border-radius:4px;font-size:0.85rem;">
              <span style="color:#fbbf24;">Token:</span> ${this._tokens}
            </span>
            <span id="pong-status" style="font-size:0.7rem;color:#6b7280;">
              ${this._duelsEnabled ? 'Ready' : 'Disabled'}
            </span>
          </div>
        </div>

        <!-- Game Area (hidden by default) -->
        <div id="pong-game-area" style="display:none;padding:8px;background:#030712;">
          <canvas id="pong-canvas"></canvas>
        </div>

        <!-- Challenge Toast (hidden by default) -->
        <div id="pong-challenge-toast" style="display:none;padding:12px;background:linear-gradient(135deg,#1e3a5f,#0f172a);border:2px solid #22d3ee;">
          <!-- Populated dynamically -->
        </div>

        <!-- Spectator Mini-View (hidden by default) -->
        <div id="pong-spectator-view" style="display:none;padding:8px;background:#1e293b;border-bottom:1px solid #374151;">
          <div style="font-size:0.65rem;color:#6b7280;margin-bottom:4px;">LIVE DUEL</div>
          <canvas id="pong-spectator-canvas" style="width:100%;max-width:200px;"></canvas>
        </div>

        <!-- Leaderboard -->
        <div class="pong-leaderboard" style="border-top:1px solid #374151;">
          <div style="padding:6px 8px;background:#0a0a0a;display:flex;align-items:center;justify-content:space-between;">
            <span style="color:#fbbf24;font-size:0.7rem;font-weight:bold;">ARENA RANKINGS</span>
            <span id="pong-my-rank" style="color:#6b7280;font-size:0.6rem;">--</span>
          </div>
          <div id="pong-leaderboard-content" style="padding:8px;background:#0f172a;max-height:150px;overflow-y:auto;font-size:0.65rem;">
            <div style="color:#6b7280;text-align:center;font-style:italic;">No duels yet</div>
          </div>
        </div>
      </div>

      <style>
        .pong-panel {
          max-height: 400px;
          overflow-y: auto;
        }
        #pong-canvas {
          display: block;
          margin: 0 auto;
          border: 1px solid #166534;
          border-radius: 4px;
        }
        #pong-spectator-canvas {
          border: 1px solid #374151;
          border-radius: 4px;
        }
        .pong-btn {
          background: transparent;
          border: 1px solid #166534;
          color: #00ff41;
          padding: 8px 16px;
          font-family: inherit;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pong-btn:hover:not(:disabled) {
          border-color: #00ff41;
          background: rgba(0, 255, 65, 0.1);
        }
        .pong-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pong-btn-accept {
          background: #0a4a0a;
          border-color: #22c55e;
        }
        .pong-btn-decline {
          background: #4a0a0a;
          border-color: #ef4444;
        }
        .pong-btn-pending {
          background: #4a4a0a;
          border-color: #fbbf24;
        }
        #pong-leaderboard-content::-webkit-scrollbar {
          width: 4px;
        }
        #pong-leaderboard-content::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
      </style>
    `;

    // Initialize canvas
    const canvas = this._container.querySelector('#pong-canvas');
    if (canvas) {
      canvas.width = PONG_CONFIG.courtWidth;
      canvas.height = PONG_CONFIG.courtHeight;
    }
  }

  /**
   * Set challenge tokens
   * @param {number} tokens
   */
  setTokens(tokens) {
    this._tokens = tokens;
    const el = this._container?.querySelector('#pong-tokens');
    if (el) {
      el.innerHTML = `<span style="color:#fbbf24;">Token:</span> ${tokens}`;
    }
  }

  /**
   * Get current tokens
   * @returns {number}
   */
  getTokens() {
    return this._tokens;
  }

  /**
   * Set player colors
   * @param {Object} colors - { username: colorHex }
   */
  setPlayerColors(colors) {
    this._playerColors = colors;
    if (this._renderer) {
      this._renderer.setPlayerColors(colors);
    }
  }

  /**
   * Set duels enabled state
   * @param {boolean} enabled
   */
  setDuelsEnabled(enabled) {
    this._duelsEnabled = enabled;
    const statusEl = this._container?.querySelector('#pong-status');
    if (statusEl) {
      statusEl.textContent = enabled ? 'Ready' : 'Disabled';
      statusEl.style.color = enabled ? '#22c55e' : '#ef4444';
    }
  }

  /**
   * v3.0.1: Set WebSocket connection status
   * @param {boolean} connected
   */
  setConnectionStatus(connected) {
    this._wsConnected = connected;
    const el = this._container?.querySelector('#pong-connection');
    if (el) {
      el.style.color = connected ? '#22c55e' : '#ef4444';
      el.title = connected ? 'Connected' : 'Disconnected';
    }
    console.log('[PongPanel] Connection status:', connected ? 'Connected' : 'Disconnected');
  }

  /**
   * Initiate a challenge (called from Grid Wars attack UI)
   * @param {string} defenderUsername
   * @param {string} territoryAddress
   * @param {number} attackCost
   * @returns {Promise<boolean>} Success
   */
  async initiateChallenge(defenderUsername, territoryAddress, attackCost) {
    console.log('[PongPanel] Initiating challenge:', {
      me: this._username,
      defender: defenderUsername,
      territory: territoryAddress,
      cost: attackCost
    });

    if (!this._duelsEnabled) {
      console.log('[PongPanel] Challenge blocked - duels disabled');
      this._showToast('Duels are currently disabled', 'error');
      return false;
    }

    if (this._tokens < PONG_CONFIG.tokenCostPerDuel) {
      console.log('[PongPanel] Challenge blocked - not enough tokens:', this._tokens);
      this._showToast(`Not enough tokens! Need ${PONG_CONFIG.tokenCostPerDuel}, have ${this._tokens}`, 'error');
      return false;
    }

    try {
      console.log('[PongPanel] Sending challenge request to server...');
      const response = await fetch(`${this._serverUrl}/api/pong/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this._gameId,
          attackerUsername: this._username,
          defenderUsername: defenderUsername,
          territoryAddress: territoryAddress,
          attackCost: attackCost
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[PongPanel] Challenge failed:', error);
        this._showToast(`Challenge failed: ${error.error}`, 'error');
        return false;
      }

      const data = await response.json();
      console.log('[PongPanel] Challenge created successfully:', data.duelId);
      this._pendingChallenge = data.duelId;
      this.setTokens(this._tokens - PONG_CONFIG.tokenCostPerDuel);

      // v3.0.1: Show pending challenge status
      this._showPendingChallenge({
        duelId: data.duelId,
        defender: defenderUsername,
        territory: territoryAddress,
        expiresAt: new Date(Date.now() + PONG_CONFIG.challengeTimeoutSeconds * 1000)
      });

      this._showToast('Challenge sent! Waiting for response...', 'info');
      return true;
    } catch (e) {
      console.error('[PongPanel] Challenge network error:', e);
      this._showToast('Challenge failed: Network error', 'error');
      return false;
    }
  }

  /**
   * Show incoming challenge toast
   * @param {Object} challenge - Challenge data from server
   */
  showIncomingChallenge(challenge) {
    this._incomingChallenge = challenge;

    const toast = this._container?.querySelector('#pong-challenge-toast');
    if (!toast) return;

    const attackerColor = this._playerColors[challenge.attacker] || '#ffffff';

    toast.style.display = 'block';
    toast.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:0.7rem;color:#6b7280;margin-bottom:4px;">DUEL CHALLENGE</div>
        <div style="font-size:1.2rem;font-weight:bold;color:${attackerColor};margin-bottom:4px;">
          ${challenge.attacker}
        </div>
        <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:12px;">
          wants <span style="color:#fbbf24;">${challenge.territory.toUpperCase()}</span>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px;">
          <button id="pong-accept" class="pong-btn pong-btn-accept">ACCEPT</button>
          <button id="pong-after-submit" class="pong-btn pong-btn-pending">AFTER SUBMIT</button>
          <button id="pong-decline" class="pong-btn pong-btn-decline">DECLINE</button>
        </div>
        <div id="pong-challenge-timer" style="font-size:0.65rem;color:#6b7280;">
          ${PONG_CONFIG.challengeTimeoutSeconds}s
        </div>
      </div>
    `;

    // Wire up buttons
    toast.querySelector('#pong-accept')?.addEventListener('click', () => this._acceptChallenge());
    toast.querySelector('#pong-after-submit')?.addEventListener('click', () => this._acceptAfterSubmit());
    toast.querySelector('#pong-decline')?.addEventListener('click', () => this._declineChallenge());

    // Start countdown timer
    const expiresAt = new Date(challenge.expiresAt).getTime();
    const timerEl = toast.querySelector('#pong-challenge-timer');

    this._challengeTimerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      if (timerEl) timerEl.textContent = `${remaining}s`;

      if (remaining <= 0) {
        clearInterval(this._challengeTimerInterval);
        this._hideIncomingChallenge();
      }
    }, 1000);
  }

  /**
   * Hide incoming challenge toast
   */
  _hideIncomingChallenge() {
    this._incomingChallenge = null;
    if (this._challengeTimerInterval) {
      clearInterval(this._challengeTimerInterval);
      this._challengeTimerInterval = null;
    }

    const toast = this._container?.querySelector('#pong-challenge-toast');
    if (toast) toast.style.display = 'none';
  }

  /**
   * v3.0.1: Show pending challenge status for attacker
   * @param {Object} challenge - { duelId, defender, territory, expiresAt }
   */
  _showPendingChallenge(challenge) {
    console.log('[PongPanel] Showing pending challenge status:', challenge);

    const toast = this._container?.querySelector('#pong-challenge-toast');
    if (!toast) return;

    const defenderColor = this._playerColors[challenge.defender] || '#ffffff';

    toast.style.display = 'block';
    toast.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:0.7rem;color:#fbbf24;margin-bottom:4px;">⏳ CHALLENGE PENDING</div>
        <div style="font-size:1rem;font-weight:bold;color:${defenderColor};margin-bottom:4px;">
          Waiting for ${challenge.defender}
        </div>
        <div style="font-size:0.75rem;color:#9ca3af;margin-bottom:8px;">
          Target: <span style="color:#fbbf24;">${challenge.territory.toUpperCase()}</span>
        </div>
        <div id="pong-pending-timer" style="font-size:0.8rem;color:#6b7280;">
          ${PONG_CONFIG.challengeTimeoutSeconds}s
        </div>
        <div style="font-size:0.6rem;color:#4b5563;margin-top:8px;">
          If declined, you can proceed with normal attack
        </div>
      </div>
    `;

    // Start countdown timer
    const timerEl = toast.querySelector('#pong-pending-timer');
    const expiresAt = challenge.expiresAt.getTime();

    if (this._pendingChallengeInterval) {
      clearInterval(this._pendingChallengeInterval);
    }

    this._pendingChallengeInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      if (timerEl) timerEl.textContent = `${remaining}s`;

      if (remaining <= 0) {
        this._clearPendingChallenge();
      }
    }, 1000);

    // Start polling fallback in case WebSocket missed the response
    this._startChallengePolling(challenge.duelId);
  }

  /**
   * v3.0.1: Clear pending challenge status
   */
  _clearPendingChallenge() {
    console.log('[PongPanel] Clearing pending challenge status');

    if (this._pendingChallengeInterval) {
      clearInterval(this._pendingChallengeInterval);
      this._pendingChallengeInterval = null;
    }

    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }

    this._pendingChallenge = null;

    const toast = this._container?.querySelector('#pong-challenge-toast');
    if (toast) toast.style.display = 'none';
  }

  /**
   * v3.0.1: Polling fallback for challenge status
   * @param {string} duelId
   */
  _startChallengePolling(duelId) {
    console.log('[PongPanel] Starting challenge polling for:', duelId);

    this._pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this._serverUrl}/api/pong/duel/${duelId}/status`);
        const data = await response.json();

        console.log('[PongPanel] Poll result:', data);

        if (data.phase === 'countdown' || data.phase === 'active') {
          console.log('[PongPanel] Duel started! Clearing pending state');
          this._clearPendingChallenge();
        } else if (data.phase === 'cancelled') {
          console.log('[PongPanel] Duel cancelled');
          this._clearPendingChallenge();
        }
      } catch (e) {
        console.error('[PongPanel] Poll failed:', e);
      }
    }, 2000);  // Poll every 2 seconds
  }

  /**
   * Accept the incoming challenge
   */
  async _acceptChallenge() {
    if (!this._incomingChallenge) return;

    try {
      await fetch(`${this._serverUrl}/api/pong/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this._gameId,
          duelId: this._incomingChallenge.duelId,
          username: this._username
        })
      });

      this._hideIncomingChallenge();
    } catch (e) {
      console.error('[PongPanel] Accept failed:', e);
    }
  }

  /**
   * Set to accept after next drill submission
   */
  _acceptAfterSubmit() {
    if (!this._incomingChallenge) return;

    this._pendingAcceptAfterSubmit = this._incomingChallenge;

    const toast = this._container?.querySelector('#pong-challenge-toast');
    if (toast) {
      toast.innerHTML = `
        <div style="text-align:center;">
          <div style="color:#fbbf24;font-size:0.85rem;">Waiting for your submission...</div>
          <div style="font-size:0.7rem;color:#6b7280;margin-top:8px;">Duel will start after you submit</div>
          <button id="pong-cancel-pending" class="pong-btn" style="margin-top:12px;">CANCEL</button>
        </div>
      `;

      toast.querySelector('#pong-cancel-pending')?.addEventListener('click', () => {
        this._pendingAcceptAfterSubmit = null;
        this._hideIncomingChallenge();
      });
    }
  }

  /**
   * Called after a drill submission - triggers pending accept
   */
  onDrillSubmit() {
    if (this._pendingAcceptAfterSubmit) {
      this._incomingChallenge = this._pendingAcceptAfterSubmit;
      this._pendingAcceptAfterSubmit = null;
      this._acceptChallenge();
    }
  }

  /**
   * Decline the incoming challenge
   */
  async _declineChallenge() {
    if (!this._incomingChallenge) return;

    try {
      await fetch(`${this._serverUrl}/api/pong/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this._gameId,
          duelId: this._incomingChallenge.duelId,
          username: this._username
        })
      });
    } catch (e) {
      console.error('[PongPanel] Decline failed:', e);
    }

    this._hideIncomingChallenge();
  }

  /**
   * Start a match (called when countdown begins)
   * @param {Object} data - pong_countdown message data
   */
  _startMatch(data) {
    const isParticipant = data.attacker === this._username || data.defender === this._username;

    // Create game instance
    const game = new PongGame({
      duelId: data.duelId,
      gameId: this._gameId,
      username: this._username,
      serverUrl: this._serverUrl,
      isAttacker: data.attacker === this._username,
      attacker: data.attacker,
      defender: data.defender,
      territory: data.territory,
      onStateChange: () => {},
      onEnd: (result) => this._onMatchEnd(result),
      onScore: (scorer) => this._renderer?.playSound('score'),
      onHit: (side) => this._renderer?.playSound('hit')
    });

    game.paddles.attacker.height = data.attackerPaddle;
    game.paddles.defender.height = data.defenderPaddle;
    game.phase = 'countdown';
    game.countdownSeconds = data.countdownSeconds;

    if (isParticipant) {
      // Full-screen mode for participants
      this._activeGame = game;

      const gameArea = this._container?.querySelector('#pong-game-area');
      const canvas = this._container?.querySelector('#pong-canvas');

      if (gameArea && canvas) {
        gameArea.style.display = 'block';

        this._renderer = new PongRenderer(canvas);
        this._renderer.setGame(game);
        this._renderer.setPlayerColors(this._playerColors);
        this._renderer.initAudio();
        this._renderer.startRenderLoop();

        // Enable touch controls
        game.enableTouchControls(canvas);
      }
    } else {
      // Spectator mini-view
      this._spectatorGame = game;

      const spectatorView = this._container?.querySelector('#pong-spectator-view');
      const spectatorCanvas = this._container?.querySelector('#pong-spectator-canvas');

      if (spectatorView && spectatorCanvas) {
        spectatorView.style.display = 'block';
        spectatorCanvas.width = PONG_CONFIG.spectatorWidth;
        spectatorCanvas.height = PONG_CONFIG.spectatorHeight;

        this._spectatorRenderer = new PongRenderer(spectatorCanvas, {
          width: PONG_CONFIG.spectatorWidth,
          height: PONG_CONFIG.spectatorHeight,
          isSpectator: true
        });
        this._spectatorRenderer.setGame(game);
        this._spectatorRenderer.setPlayerColors(this._playerColors);
        this._spectatorRenderer.startRenderLoop();
      }
    }

    this._hideIncomingChallenge();
  }

  /**
   * Handle match end
   * @param {Object} result - pong_end message data
   */
  _onMatchEnd(result) {
    const isWin = result.winner === this._username;

    // Play appropriate sound
    if (this._activeGame?.isParticipant()) {
      this._renderer?.playSound(isWin ? 'win' : 'lose');
    }

    // Refresh leaderboard
    setTimeout(() => this._loadLeaderboard(), 500);

    // Hide game area after delay
    setTimeout(() => {
      const gameArea = this._container?.querySelector('#pong-game-area');
      if (gameArea) gameArea.style.display = 'none';

      const spectatorView = this._container?.querySelector('#pong-spectator-view');
      if (spectatorView) spectatorView.style.display = 'none';

      this._cleanupGame();
    }, 3000);
  }

  /**
   * Clean up active game resources
   */
  _cleanupGame() {
    if (this._activeGame) {
      this._activeGame.destroy();
      this._activeGame = null;
    }
    if (this._renderer) {
      this._renderer.destroy();
      this._renderer = null;
    }
    if (this._spectatorGame) {
      this._spectatorGame.destroy();
      this._spectatorGame = null;
    }
    if (this._spectatorRenderer) {
      this._spectatorRenderer.destroy();
      this._spectatorRenderer = null;
    }
  }

  /**
   * Handle WebSocket messages
   * @param {Object} message - Server message
   */
  handleMessage(message) {
    // v3.0.1: Enhanced logging for debugging message delivery
    console.log('[PongPanel] Received message:', message.type, {
      seq: message.seq,
      me: this._username,
      attacker: message.attacker,
      defender: message.defender
    });

    switch (message.type) {
      case 'pong_challenge':
        console.log('[PongPanel] Challenge received - defender:', message.defender, 'me:', this._username);
        if (message.defender === this._username) {
          console.log('[PongPanel] I am the defender! Showing challenge toast...');
          this.showIncomingChallenge(message);
        } else if (message.attacker === this._username) {
          console.log('[PongPanel] I am the attacker - challenge was sent successfully');
        }
        break;

      case 'pong_countdown':
        console.log('[PongPanel] Countdown received for duel:', message.duelId);
        // Clear pending challenge UI if I was the attacker
        if (message.attacker === this._username) {
          console.log('[PongPanel] I am the attacker - clearing pending state, starting match');
          this._clearPendingChallenge();
        }
        if (message.attacker === this._username || message.defender === this._username ||
            this._shouldSpectate(message)) {
          this._startMatch(message);
        }
        break;

      case 'pong_start':
      case 'pong_tick':
      case 'pong_score':
      case 'pong_hit':
        // Route to active game
        if (this._activeGame) {
          this._activeGame.handleServerMessage(message);
        }
        if (this._spectatorGame) {
          this._spectatorGame.handleServerMessage(message);
        }
        break;

      case 'pong_end':
        if (this._activeGame) {
          this._activeGame.handleServerMessage(message);
        }
        if (this._spectatorGame) {
          this._spectatorGame.handleServerMessage(message);
        }
        break;

      case 'pong_declined':
        if (message.attacker === this._username) {
          console.log('[PongPanel] Challenge declined, clearing pending state');
          this._clearPendingChallenge();
          const reason = message.reason === 'timeout' ? 'timed out' : 'declined';
          this._showToast(`Challenge ${reason}. You can proceed with normal attack.`, 'info');
        }
        break;

      case 'pong_toggle':
        this.setDuelsEnabled(message.enabled);
        break;

      case 'token_granted':
        if (message.username === this._username) {
          this.setTokens(message.tokens);
          this._showToast(`+${message.tokensGranted} Token from rent!`, 'success');
        }
        break;
    }
  }

  /**
   * Check if we should spectate a duel
   * @param {Object} message
   * @returns {boolean}
   */
  _shouldSpectate(message) {
    // For now, always show spectator view for any active duel
    // Could add logic to only show duels involving neighbors, etc.
    return !this._activeGame && !this._spectatorGame;
  }

  /**
   * Load leaderboard data
   */
  async _loadLeaderboard() {
    try {
      const response = await fetch(`${this._serverUrl}/api/pong/leaderboard/${this._gameId}`);
      const data = await response.json();

      this._leaderboardData = data.players || [];
      this._renderLeaderboard();
    } catch (e) {
      console.error('[PongPanel] Leaderboard load failed:', e);
    }
  }

  /**
   * Render leaderboard content
   */
  _renderLeaderboard() {
    const content = this._container?.querySelector('#pong-leaderboard-content');
    if (!content) return;

    if (this._leaderboardData.length === 0) {
      content.innerHTML = '<div style="color:#6b7280;text-align:center;font-style:italic;">No duels yet</div>';
      return;
    }

    content.innerHTML = this._leaderboardData.slice(0, 10).map((p, i) => {
      const color = this._playerColors[p.username] || '#888';
      const isMe = p.username === this._username;
      const record = `${p.wins}W / ${p.losses}L`;

      return `
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1e293b;${isMe ? 'background:rgba(0,255,65,0.1);margin:0 -8px;padding:4px 8px;' : ''}">
          <span style="color:${color};">${i + 1}. ${p.username}</span>
          <span style="color:#6b7280;font-size:0.6rem;">${record}</span>
        </div>
      `;
    }).join('');

    // Update my rank
    const myRankEl = this._container?.querySelector('#pong-my-rank');
    const myIndex = this._leaderboardData.findIndex(p => p.username === this._username);
    if (myRankEl) {
      myRankEl.textContent = myIndex >= 0 ? `Rank: #${myIndex + 1}` : '--';
    }
  }

  /**
   * Show a toast notification
   * @param {string} message
   * @param {'info'|'success'|'error'} type
   */
  _showToast(message, type = 'info') {
    // Use the global toast system if available
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      console.log(`[PongPanel] ${type}: ${message}`);
    }
  }

  /**
   * Destroy the panel and clean up
   */
  destroy() {
    this._cleanupGame();

    if (this._challengeTimerInterval) {
      clearInterval(this._challengeTimerInterval);
    }

    if (this._container) {
      this._container.innerHTML = '';
    }
  }
}

export default PongPanel;
