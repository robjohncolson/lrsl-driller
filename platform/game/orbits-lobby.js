/**
 * Ghost Orbits - Multiplayer Lobby UI
 *
 * Provides UI for creating/joining multiplayer rooms,
 * ready-up flow, and match starting.
 *
 * @version 1.0.0 (Phase 3)
 */

import { OrbitsNetworkController, NetworkState, RoomState } from './orbits-network-controller.js';

/**
 * Lobby UI states
 */
export const LobbyState = {
  MENU: 'menu',           // Show create/join options
  CREATING: 'creating',   // Creating room
  JOINING: 'joining',     // Entering room code
  IN_ROOM: 'in_room',     // In lobby, waiting for players
  COUNTDOWN: 'countdown', // Match starting
  ERROR: 'error'          // Error state
};

/**
 * OrbitsLobby - Multiplayer lobby UI component
 */
export class OrbitsLobby {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container element
   * @param {string} options.serverUrl - WebSocket server URL
   * @param {string} options.username - Player's username
   * @param {Function} [options.onMatchStart] - Callback when match starts
   * @param {Function} [options.onExit] - Callback when user exits lobby
   */
  constructor(options) {
    this.container = options.container;
    this.serverUrl = options.serverUrl;
    this.username = options.username;
    this.onMatchStart = options.onMatchStart || (() => {});
    this.onExit = options.onExit || (() => {});

    // State
    this.state = LobbyState.MENU;
    this.error = null;

    // Network controller
    this.network = new OrbitsNetworkController({
      serverUrl: this.serverUrl,
      username: this.username,
      onStateChange: (data) => this._handleNetworkStateChange(data),
      onRoomUpdate: (data) => this._handleRoomUpdate(data),
      onCountdown: (data) => this._handleCountdown(data),
      onMatchStart: (data) => this._handleMatchStart(data),
      onError: (data) => this._handleError(data)
    });

    // Room state
    this.roomCode = null;
    this.players = [];
    this.isHost = false;
    this.canStart = false;

    // Countdown
    this.countdownValue = 0;

    // Create UI
    this._createUI();
  }

  // ----------------------------------------
  // UI CREATION
  // ----------------------------------------

  _createUI() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'orbits-lobby-overlay';
    this.overlay.innerHTML = `
      <div class="orbits-lobby-panel">
        <div class="orbits-lobby-header">
          <h2>Ghost Orbits - Multiplayer</h2>
          <button class="orbits-lobby-close">&times;</button>
        </div>
        <div class="orbits-lobby-content">
          <!-- Content injected by state -->
        </div>
      </div>
    `;

    // Add styles
    this._addStyles();

    // Event listeners
    this.overlay.querySelector('.orbits-lobby-close').addEventListener('click', () => {
      this.close();
    });

    // Update content
    this._updateContent();
  }

  _addStyles() {
    if (document.getElementById('orbits-lobby-styles')) return;

    const style = document.createElement('style');
    style.id = 'orbits-lobby-styles';
    style.textContent = `
      .orbits-lobby-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }

      .orbits-lobby-panel {
        background: #1a1a2e;
        border: 2px solid #4a4a6a;
        border-radius: 12px;
        width: 400px;
        max-width: 90vw;
        color: #fff;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      }

      .orbits-lobby-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #4a4a6a;
      }

      .orbits-lobby-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .orbits-lobby-close {
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .orbits-lobby-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .orbits-lobby-content {
        padding: 20px;
      }

      .orbits-lobby-menu-btn {
        display: block;
        width: 100%;
        padding: 16px;
        margin-bottom: 12px;
        background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
        border: none;
        border-radius: 8px;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.1s, box-shadow 0.1s;
      }

      .orbits-lobby-menu-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(68, 136, 255, 0.4);
      }

      .orbits-lobby-menu-btn:active {
        transform: translateY(0);
      }

      .orbits-lobby-menu-btn.secondary {
        background: linear-gradient(135deg, #666 0%, #444 100%);
      }

      .orbits-lobby-input-group {
        margin-bottom: 16px;
      }

      .orbits-lobby-input-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #aaa;
      }

      .orbits-lobby-input {
        width: 100%;
        padding: 12px 16px;
        background: #2a2a4a;
        border: 2px solid #4a4a6a;
        border-radius: 8px;
        color: #fff;
        font-size: 18px;
        text-align: center;
        letter-spacing: 4px;
        text-transform: uppercase;
        box-sizing: border-box;
      }

      .orbits-lobby-input:focus {
        outline: none;
        border-color: #4488ff;
      }

      .orbits-lobby-room-code {
        text-align: center;
        padding: 20px;
        background: #2a2a4a;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .orbits-lobby-room-code-label {
        font-size: 12px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 8px;
      }

      .orbits-lobby-room-code-value {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 6px;
        color: #4488ff;
      }

      .orbits-lobby-players {
        margin-bottom: 20px;
      }

      .orbits-lobby-players-title {
        font-size: 14px;
        color: #888;
        margin-bottom: 12px;
      }

      .orbits-lobby-player {
        display: flex;
        align-items: center;
        padding: 12px;
        background: #2a2a4a;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .orbits-lobby-player-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 12px;
      }

      .orbits-lobby-player-name {
        flex: 1;
        font-weight: 500;
      }

      .orbits-lobby-player-status {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .orbits-lobby-player-status.ready {
        background: #22aa44;
        color: #fff;
      }

      .orbits-lobby-player-status.not-ready {
        background: #666;
        color: #ccc;
      }

      .orbits-lobby-player-status.host {
        background: #ffaa00;
        color: #000;
      }

      .orbits-lobby-actions {
        display: flex;
        gap: 12px;
      }

      .orbits-lobby-actions button {
        flex: 1;
      }

      .orbits-lobby-countdown {
        text-align: center;
        padding: 40px 20px;
      }

      .orbits-lobby-countdown-value {
        font-size: 72px;
        font-weight: 700;
        color: #4488ff;
        animation: pulse 0.5s ease-in-out;
      }

      .orbits-lobby-countdown-text {
        font-size: 18px;
        color: #888;
        margin-top: 12px;
      }

      @keyframes pulse {
        0% { transform: scale(1.2); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      .orbits-lobby-error {
        background: #442222;
        border: 1px solid #ff4444;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        color: #ff8888;
      }

      .orbits-lobby-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        color: #888;
        font-size: 14px;
        cursor: pointer;
        padding: 8px 0;
        margin-bottom: 16px;
      }

      .orbits-lobby-back-btn:hover {
        color: #fff;
      }

      .orbits-lobby-waiting {
        text-align: center;
        padding: 20px;
        color: #888;
      }

      .orbits-lobby-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #4a4a6a;
        border-top-color: #4488ff;
        border-radius: 50%;
        margin: 0 auto 16px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // ----------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------

  _setState(newState) {
    this.state = newState;
    this._updateContent();
  }

  _updateContent() {
    const content = this.overlay.querySelector('.orbits-lobby-content');

    switch (this.state) {
      case LobbyState.MENU:
        content.innerHTML = this._renderMenu();
        this._attachMenuListeners(content);
        break;

      case LobbyState.CREATING:
        content.innerHTML = this._renderCreating();
        break;

      case LobbyState.JOINING:
        content.innerHTML = this._renderJoining();
        this._attachJoiningListeners(content);
        break;

      case LobbyState.IN_ROOM:
        content.innerHTML = this._renderRoom();
        this._attachRoomListeners(content);
        break;

      case LobbyState.COUNTDOWN:
        content.innerHTML = this._renderCountdown();
        break;

      case LobbyState.ERROR:
        content.innerHTML = this._renderError();
        this._attachErrorListeners(content);
        break;
    }
  }

  // ----------------------------------------
  // RENDER METHODS
  // ----------------------------------------

  _renderMenu() {
    return `
      <button class="orbits-lobby-menu-btn" data-action="create">
        Create Room
      </button>
      <button class="orbits-lobby-menu-btn secondary" data-action="join">
        Join Room
      </button>
    `;
  }

  _renderCreating() {
    return `
      <div class="orbits-lobby-waiting">
        <div class="orbits-lobby-spinner"></div>
        <div>Creating room...</div>
      </div>
    `;
  }

  _renderJoining() {
    return `
      <button class="orbits-lobby-back-btn" data-action="back">
        &larr; Back
      </button>
      <div class="orbits-lobby-input-group">
        <label>Enter Room Code</label>
        <input type="text" class="orbits-lobby-input"
               maxlength="6" placeholder="ABC123"
               autocomplete="off" autocapitalize="characters">
      </div>
      <button class="orbits-lobby-menu-btn" data-action="submit-join">
        Join
      </button>
    `;
  }

  _renderRoom() {
    const myPlayer = this.players.find(p => p.playerId === this.network.playerId);
    const isReady = myPlayer?.ready || false;

    return `
      <div class="orbits-lobby-room-code">
        <div class="orbits-lobby-room-code-label">Room Code</div>
        <div class="orbits-lobby-room-code-value">${this.roomCode}</div>
      </div>

      <div class="orbits-lobby-players">
        <div class="orbits-lobby-players-title">Players (${this.players.length}/2)</div>
        ${this.players.map(p => `
          <div class="orbits-lobby-player">
            <div class="orbits-lobby-player-color" style="background: ${p.color}"></div>
            <div class="orbits-lobby-player-name">
              ${p.username}${p.playerId === this.network.playerId ? ' (You)' : ''}
            </div>
            ${p.isHost ? `
              <span class="orbits-lobby-player-status host">Host</span>
            ` : `
              <span class="orbits-lobby-player-status ${p.ready ? 'ready' : 'not-ready'}">
                ${p.ready ? 'Ready' : 'Not Ready'}
              </span>
            `}
          </div>
        `).join('')}

        ${this.players.length < 2 ? `
          <div class="orbits-lobby-waiting">
            Waiting for opponent to join...
          </div>
        ` : ''}
      </div>

      <div class="orbits-lobby-actions">
        <button class="orbits-lobby-menu-btn secondary" data-action="leave">
          Leave
        </button>
        ${this.isHost ? `
          <button class="orbits-lobby-menu-btn" data-action="start"
                  ${!this.canStart ? 'disabled style="opacity: 0.5; cursor: not-allowed"' : ''}>
            Start Match
          </button>
        ` : `
          <button class="orbits-lobby-menu-btn" data-action="ready">
            ${isReady ? 'Not Ready' : 'Ready'}
          </button>
        `}
      </div>
    `;
  }

  _renderCountdown() {
    return `
      <div class="orbits-lobby-countdown">
        <div class="orbits-lobby-countdown-value">${this.countdownValue}</div>
        <div class="orbits-lobby-countdown-text">Match starting...</div>
      </div>
    `;
  }

  _renderError() {
    return `
      <div class="orbits-lobby-error">
        ${this.error || 'An error occurred'}
      </div>
      <button class="orbits-lobby-menu-btn" data-action="back-to-menu">
        Back to Menu
      </button>
    `;
  }

  // ----------------------------------------
  // EVENT LISTENERS
  // ----------------------------------------

  _attachMenuListeners(content) {
    content.querySelector('[data-action="create"]').addEventListener('click', () => {
      this._createRoom();
    });
    content.querySelector('[data-action="join"]').addEventListener('click', () => {
      this._setState(LobbyState.JOINING);
    });
  }

  _attachJoiningListeners(content) {
    content.querySelector('[data-action="back"]').addEventListener('click', () => {
      this._setState(LobbyState.MENU);
    });

    const input = content.querySelector('.orbits-lobby-input');
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this._joinRoom(input.value);
      }
    });

    content.querySelector('[data-action="submit-join"]').addEventListener('click', () => {
      this._joinRoom(input.value);
    });

    // Focus input
    setTimeout(() => input.focus(), 100);
  }

  _attachRoomListeners(content) {
    const leaveBtn = content.querySelector('[data-action="leave"]');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => {
        this.network.leaveRoom();
        this._setState(LobbyState.MENU);
      });
    }

    const startBtn = content.querySelector('[data-action="start"]');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.network.startMatch();
      });
    }

    const readyBtn = content.querySelector('[data-action="ready"]');
    if (readyBtn) {
      readyBtn.addEventListener('click', () => {
        const myPlayer = this.players.find(p => p.playerId === this.network.playerId);
        this.network.setReady(!myPlayer?.ready);
      });
    }
  }

  _attachErrorListeners(content) {
    content.querySelector('[data-action="back-to-menu"]').addEventListener('click', () => {
      this.error = null;
      this._setState(LobbyState.MENU);
    });
  }

  // ----------------------------------------
  // NETWORK ACTIONS
  // ----------------------------------------

  async _createRoom() {
    this._setState(LobbyState.CREATING);
    try {
      const result = await this.network.createRoom('arena');
      this.roomCode = result.roomCode;
      this.isHost = true;
      this._setState(LobbyState.IN_ROOM);
    } catch (error) {
      this.error = error.message || 'Failed to create room';
      this._setState(LobbyState.ERROR);
    }
  }

  async _joinRoom(roomCode) {
    if (!roomCode || roomCode.length < 6) {
      this.error = 'Please enter a valid 6-character room code';
      this._setState(LobbyState.ERROR);
      return;
    }

    this._setState(LobbyState.CREATING); // Reuse creating state for loading
    try {
      const result = await this.network.joinRoom(roomCode);
      this.roomCode = result.roomCode;
      this.isHost = false;
      this._setState(LobbyState.IN_ROOM);
    } catch (error) {
      this.error = error.message || 'Failed to join room';
      this._setState(LobbyState.ERROR);
    }
  }

  // ----------------------------------------
  // NETWORK CALLBACKS
  // ----------------------------------------

  _handleNetworkStateChange({ oldState, newState }) {
    console.log(`[OrbitsLobby] Network state: ${oldState} -> ${newState}`);
  }

  _handleRoomUpdate(data) {
    this.players = data.players;
    this.isHost = data.isHost;
    this.canStart = data.canStart;
    this.roomCode = data.roomCode;

    if (data.state === RoomState.LOBBY && this.state !== LobbyState.COUNTDOWN) {
      this._setState(LobbyState.IN_ROOM);
    }
  }

  _handleCountdown({ secondsRemaining }) {
    this.countdownValue = secondsRemaining;
    this._setState(LobbyState.COUNTDOWN);
  }

  _handleMatchStart(data) {
    // Close lobby and start the game
    this.close();
    this.onMatchStart({
      ...data,
      network: this.network // Pass network controller for ongoing communication
    });
  }

  _handleError(data) {
    this.error = data.error || data.message || 'An error occurred';
    this._setState(LobbyState.ERROR);
  }

  // ----------------------------------------
  // PUBLIC METHODS
  // ----------------------------------------

  /**
   * Show the lobby UI
   */
  show() {
    this.container.appendChild(this.overlay);
  }

  /**
   * Hide the lobby UI
   */
  hide() {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }

  /**
   * Close the lobby and disconnect
   */
  close() {
    this.hide();
    this.network.disconnect();
    this.onExit();
  }

  /**
   * Get the network controller (for use in game)
   */
  getNetworkController() {
    return this.network;
  }
}

export default OrbitsLobby;
