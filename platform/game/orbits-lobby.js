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
      onLobbyCountdown: (data) => this._handleLobbyCountdown(data),
      onWaiting: (data) => this._handleWaiting(data),
      onMatchStart: (data) => this._handleMatchStart(data),
      onError: (data) => this._handleError(data)
    });

    // Room state
    this.roomCode = null;
    this.players = [];
    this.isHost = false;
    this.canStart = false;

    // Lobby countdown info
    this.lobbyInfo = null;

    // Match countdown
    this.countdownValue = 0;

    // Create UI
    this._createUI();
  }

  // ----------------------------------------
  // UI CREATION
  // ----------------------------------------

  _createUI() {
    // Main overlay/modal
    this.overlay = document.createElement('div');
    this.overlay.className = 'orbits-lobby-overlay';
    this.overlay.innerHTML = `
      <div class="orbits-lobby-panel">
        <div class="orbits-lobby-header">
          <h2>Ghost Orbits - Multiplayer</h2>
          <div class="orbits-lobby-header-btns">
            <button class="orbits-lobby-minimize" title="Minimize">─</button>
            <button class="orbits-lobby-close" title="Close">&times;</button>
          </div>
        </div>
        <div class="orbits-lobby-content">
          <!-- Content injected by state -->
        </div>
      </div>
    `;

    // Minimized indicator (floating pill)
    this.minimizedIndicator = document.createElement('div');
    this.minimizedIndicator.className = 'orbits-lobby-minimized';
    this.minimizedIndicator.innerHTML = `
      <span class="orbits-lobby-minimized-icon">🎮</span>
      <span class="orbits-lobby-minimized-text">Waiting...</span>
      <span class="orbits-lobby-minimized-count">0/8</span>
    `;

    // Toast notification container
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'orbits-lobby-toast-container';

    // State
    this.isMinimized = false;

    // Add styles
    this._addStyles();

    // Event listeners
    this.overlay.querySelector('.orbits-lobby-close').addEventListener('click', () => {
      this.close();
    });

    this.overlay.querySelector('.orbits-lobby-minimize').addEventListener('click', () => {
      this._minimize();
    });

    this.minimizedIndicator.addEventListener('click', () => {
      this._restore();
    });

    // Update content
    this._updateContent();
  }

  /**
   * Minimize the lobby modal
   */
  _minimize() {
    this.isMinimized = true;
    this.overlay.classList.add('minimized');

    // Update minimized indicator
    this._updateMinimizedIndicator();

    // Show the indicator
    if (!this.minimizedIndicator.parentNode) {
      document.body.appendChild(this.minimizedIndicator);
    }
    this.minimizedIndicator.classList.add('visible');
  }

  /**
   * Restore the lobby modal from minimized state
   */
  _restore() {
    this.isMinimized = false;
    this.overlay.classList.remove('minimized');
    this.minimizedIndicator.classList.remove('visible');
  }

  /**
   * Update the minimized indicator with current state
   */
  _updateMinimizedIndicator() {
    const textEl = this.minimizedIndicator.querySelector('.orbits-lobby-minimized-text');
    const countEl = this.minimizedIndicator.querySelector('.orbits-lobby-minimized-count');

    const maxPlayers = this.lobbyInfo?.maxPlayers || 8;
    const playerCount = this.players.length;
    const seconds = this.lobbyInfo?.secondsRemaining;

    if (seconds !== undefined && seconds > 0) {
      textEl.textContent = `Starting in ${seconds}s`;
    } else if (playerCount < 2) {
      textEl.textContent = 'Waiting...';
    } else {
      textEl.textContent = 'Ready!';
    }

    countEl.textContent = `${playerCount}/${maxPlayers}`;
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} [type='info'] - Toast type (info, success, game-ready)
   * @param {Function} [onClick] - Click handler
   */
  _showToast(message, type = 'info', onClick = null) {
    // Ensure toast container is in DOM
    if (!this.toastContainer.parentNode) {
      document.body.appendChild(this.toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `orbits-lobby-toast ${type}`;
    toast.innerHTML = `
      <span class="orbits-lobby-toast-icon">${type === 'game-ready' ? '🎮' : 'ℹ️'}</span>
      <span class="orbits-lobby-toast-message">${message}</span>
    `;

    if (onClick) {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', () => {
        onClick();
        toast.remove();
      });
    }

    // Auto-dismiss after 10 seconds (unless it's game-ready)
    if (type !== 'game-ready') {
      setTimeout(() => toast.remove(), 10000);
    }

    this.toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    return toast;
  }

  /**
   * Clear all toasts
   */
  _clearToasts() {
    this.toastContainer.innerHTML = '';
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

      .orbits-lobby-header-btns {
        display: flex;
        gap: 4px;
      }

      .orbits-lobby-minimize {
        background: none;
        border: none;
        color: #888;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .orbits-lobby-minimize:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      /* Minimized state */
      .orbits-lobby-overlay.minimized {
        display: none;
      }

      .orbits-lobby-minimized {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4a 100%);
        border: 2px solid #4488ff;
        border-radius: 50px;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        z-index: 10001;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(68, 136, 255, 0.3);
      }

      .orbits-lobby-minimized.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .orbits-lobby-minimized:hover {
        border-color: #66aaff;
        box-shadow: 0 4px 25px rgba(68, 136, 255, 0.5);
        transform: translateY(-2px);
      }

      .orbits-lobby-minimized-icon {
        font-size: 20px;
      }

      .orbits-lobby-minimized-text {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
      }

      .orbits-lobby-minimized-count {
        background: #4488ff;
        color: #fff;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      /* Toast notifications */
      .orbits-lobby-toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10002;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .orbits-lobby-toast {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4a 100%);
        border: 2px solid #4a4a6a;
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        max-width: 300px;
      }

      .orbits-lobby-toast.visible {
        opacity: 1;
        transform: translateX(0);
      }

      .orbits-lobby-toast.game-ready {
        border-color: #44cc88;
        animation: toast-pulse 1s ease-in-out infinite;
      }

      @keyframes toast-pulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(68, 204, 136, 0.3); }
        50% { box-shadow: 0 4px 30px rgba(68, 204, 136, 0.6); }
      }

      .orbits-lobby-toast-icon {
        font-size: 24px;
      }

      .orbits-lobby-toast-message {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
      }

      .orbits-lobby-toast.game-ready .orbits-lobby-toast-message {
        color: #44cc88;
      }

      .orbits-lobby-content {
        padding: 20px;
      }

      .orbits-lobby-mode-selector {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }

      .orbits-lobby-mode-selector label {
        font-size: 14px;
        color: #aaa;
        white-space: nowrap;
      }

      #orbits-lobby-mode-select {
        flex: 1;
        padding: 10px 14px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(68, 136, 255, 0.4);
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      #orbits-lobby-mode-select:hover {
        border-color: rgba(68, 136, 255, 0.8);
      }

      #orbits-lobby-mode-select:focus {
        outline: none;
        border-color: #4488ff;
        box-shadow: 0 0 8px rgba(68, 136, 255, 0.4);
      }

      #orbits-lobby-mode-select option {
        background: #1a1f2e;
        color: #fff;
        padding: 8px;
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

      .orbits-lobby-menu-btn.small {
        padding: 12px;
        font-size: 14px;
      }

      .orbits-lobby-menu-btn.orbits-play-now {
        padding: 20px;
        font-size: 20px;
        background: linear-gradient(135deg, #44cc88 0%, #22aa66 100%);
        margin-bottom: 8px;
      }

      .orbits-lobby-menu-btn.orbits-play-now:hover {
        box-shadow: 0 4px 16px rgba(68, 204, 136, 0.5);
      }

      .orbits-lobby-menu-btn.orbits-add-ai {
        padding: 12px;
        font-size: 14px;
        background: linear-gradient(135deg, #8844ff 0%, #6622dd 100%);
        margin-bottom: 4px;
      }

      .orbits-lobby-menu-btn.orbits-add-ai:hover {
        box-shadow: 0 4px 16px rgba(136, 68, 255, 0.5);
      }

      .orbits-lobby-ai-section {
        text-align: center;
        margin: 16px 0;
        padding: 12px;
        background: rgba(136, 68, 255, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(136, 68, 255, 0.3);
      }

      .orbits-lobby-ai-hint {
        font-size: 11px;
        color: #888;
        margin: 0;
      }

      .orbits-lobby-start-now {
        text-align: center;
        margin: 16px 0;
        padding: 12px;
        background: rgba(68, 255, 136, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(68, 255, 136, 0.3);
      }

      .orbits-start-now-btn {
        background: linear-gradient(135deg, #44cc88 0%, #22aa66 100%) !important;
      }

      .orbits-start-now-btn:disabled {
        background: #3a3a5a !important;
        opacity: 0.7;
        cursor: default;
      }

      .orbits-lobby-start-hint {
        font-size: 11px;
        color: #888;
        margin: 8px 0 0 0;
      }

      .orbits-lobby-player.ai-player {
        background: linear-gradient(135deg, #2a2a4a 0%, #3a2a5a 100%);
        border: 1px solid rgba(136, 68, 255, 0.3);
      }

      .orbits-lobby-quick-play {
        text-align: center;
        margin-bottom: 16px;
      }

      .orbits-lobby-quick-hint {
        font-size: 12px;
        color: #888;
        margin: 0;
      }

      .orbits-lobby-divider {
        text-align: center;
        margin: 20px 0;
        color: #666;
        font-size: 12px;
      }

      .orbits-lobby-divider span {
        background: #1a1a2e;
        padding: 0 12px;
        position: relative;
      }

      .orbits-lobby-divider::before {
        content: '';
        position: absolute;
        left: 20px;
        right: 20px;
        top: 50%;
        height: 1px;
        background: #4a4a6a;
      }

      .orbits-lobby-private {
        text-align: center;
      }

      .orbits-lobby-private-label {
        font-size: 12px;
        color: #888;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .orbits-lobby-private-btns {
        display: flex;
        gap: 12px;
      }

      .orbits-lobby-private-btns .orbits-lobby-menu-btn {
        flex: 1;
        margin-bottom: 0;
      }

      .orbits-lobby-room-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .orbits-lobby-timer {
        text-align: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, #44cc88 0%, #22aa66 100%);
        border-radius: 8px;
      }

      .orbits-lobby-timer-label {
        font-size: 10px;
        color: rgba(255,255,255,0.8);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .orbits-lobby-timer-value {
        font-size: 24px;
        font-weight: 700;
        color: #fff;
      }

      .orbits-lobby-player-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .orbits-lobby-info {
        text-align: center;
        padding: 12px;
        margin-bottom: 16px;
        color: #888;
        font-size: 12px;
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

      .orbits-lobby-status {
        font-size: 16px;
        font-weight: 500;
        color: #aaa;
        padding: 8px 0;
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

      /* Server toggle in menu */
      .orbits-lobby-server-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #3a3a5a;
        font-size: 13px;
      }

      .orbits-server-label {
        color: #888;
      }

      .orbits-server-name {
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
      }

      .orbits-server-name.cloud {
        background: #224466;
        color: #88ccff;
      }

      .orbits-server-name.local {
        background: #226644;
        color: #88ffaa;
      }

      .orbits-server-name.lan {
        background: #664422;
        color: #ffcc88;
      }

      .orbits-server-name.auto {
        background: #444466;
        color: #aaaacc;
      }

      .orbits-server-change {
        background: none;
        border: 1px solid #4a4a6a;
        color: #888;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .orbits-server-change:hover {
        border-color: #6a6a8a;
        color: #fff;
      }

      /* Server selector screen */
      .orbits-server-selector h3 {
        text-align: center;
        margin-bottom: 16px;
        color: #ccc;
        font-size: 16px;
      }

      .orbits-server-option {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 14px 16px;
        margin-bottom: 10px;
        background: #2a2a4a;
        border: 2px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .orbits-server-option:hover {
        background: #3a3a5a;
        border-color: #4a4a6a;
      }

      .orbits-server-option.selected {
        border-color: #4488ff;
        background: #2a3a5a;
      }

      .orbits-server-icon {
        font-size: 24px;
      }

      .orbits-server-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .orbits-server-option-name {
        font-weight: 600;
        color: #fff;
        font-size: 14px;
      }

      .orbits-server-option-desc {
        color: #888;
        font-size: 11px;
      }

      .orbits-lan-input {
        display: none;
        margin-top: 12px;
        padding: 12px;
        background: #1a1a2e;
        border-radius: 8px;
      }

      .orbits-lan-input.visible {
        display: block;
      }

      .orbits-lan-input label {
        display: block;
        font-size: 12px;
        color: #888;
        margin-bottom: 8px;
      }

      .orbits-lan-input .orbits-lobby-input {
        width: 100%;
        margin-bottom: 8px;
      }

      .orbits-lan-input .orbits-lobby-btn {
        width: 100%;
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
    const serverInfo = this._getServerInfo();
    return `
      <div class="orbits-lobby-quick-play">
        <button class="orbits-lobby-menu-btn orbits-play-now" data-action="quick-join">
          🎮 Play Now
        </button>
        <p class="orbits-lobby-quick-hint">Jump into a game with up to 8 players</p>
      </div>
      <div class="orbits-lobby-server-toggle">
        <span class="orbits-server-label">Server:</span>
        <span class="orbits-server-name ${serverInfo.type}">${serverInfo.display}</span>
        <button class="orbits-server-change" data-action="change-server">Change</button>
      </div>
    `;
  }

  /**
   * Get current server info for display
   */
  _getServerInfo() {
    const savedUrl = localStorage.getItem('orbits_server_url');

    // Handle special 'cloud' value (explicit cloud preference)
    if (savedUrl === 'cloud') {
      return { type: 'cloud', display: 'Cloud', url: 'wss://lrsl-driller-production.up.railway.app' };
    }

    if (savedUrl) {
      // Extract just the host for display
      try {
        const url = new URL(savedUrl.replace('ws://', 'http://').replace('wss://', 'https://'));
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return { type: 'local', display: 'Local (this PC)', url: savedUrl };
        }
        return { type: 'lan', display: `LAN (${url.hostname})`, url: savedUrl };
      } catch {
        return { type: 'custom', display: 'Custom', url: savedUrl };
      }
    }

    // No preference - will auto-detect
    return { type: 'auto', display: 'Auto', url: null };
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
    const maxPlayers = this.lobbyInfo?.maxPlayers || 8;
    const lobbySeconds = this.lobbyInfo?.secondsRemaining;
    const playerCount = this.players.length;
    const humanCount = this.lobbyInfo?.humanPlayerCount || playerCount;
    const canAddAI = this.isHost && playerCount < maxPlayers;
    const startNowVotes = this.lobbyInfo?.startNowVotes || 0;
    const canStartNow = this.lobbyInfo?.canStartNow && humanCount >= 2;

    // Determine status message
    let statusMessage;
    if (playerCount < 2) {
      statusMessage = '⏳ Waiting for players...';
    } else if (lobbySeconds === null || lobbySeconds === undefined) {
      statusMessage = '✓ Ready to start!';
    } else {
      statusMessage = '✓ Starting soon...';
    }

    return `
      <div class="orbits-lobby-room-header">
        <div class="orbits-lobby-status">
          ${statusMessage}
        </div>
        ${lobbySeconds !== null && lobbySeconds !== undefined ? `
          <div class="orbits-lobby-timer">
            <div class="orbits-lobby-timer-label">Starting in</div>
            <div class="orbits-lobby-timer-value">${lobbySeconds}s</div>
          </div>
        ` : ''}
      </div>

      <div class="orbits-lobby-players">
        <div class="orbits-lobby-players-title">
          Players (${playerCount}/${maxPlayers})
        </div>
        <div class="orbits-lobby-player-grid">
          ${this.players.map(p => `
            <div class="orbits-lobby-player ${p.isAI ? 'ai-player' : ''}">
              <div class="orbits-lobby-player-color" style="background: ${p.color}"></div>
              <div class="orbits-lobby-player-name">
                ${p.username}${p.playerId === this.network.playerId ? ' (You)' : ''}${p.isAI ? ' 🤖' : ''}
              </div>
              <span class="orbits-lobby-player-status ${p.ready ? 'ready' : 'not-ready'}">
                ${p.ready ? '✓' : '...'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      ${canAddAI ? `
        <div class="orbits-lobby-ai-section">
          <button class="orbits-lobby-menu-btn orbits-add-ai" data-action="add-ai">
            🤖 Add AI Player
          </button>
          <p class="orbits-lobby-ai-hint">Fill empty slots with AI opponents</p>
        </div>
      ` : ''}

      ${canStartNow ? `
        <div class="orbits-lobby-start-now">
          <button class="orbits-lobby-menu-btn orbits-start-now-btn" data-action="start-now">
            ⚡ Start Now ${startNowVotes > 0 ? `(${startNowVotes}/${humanCount})` : ''}
          </button>
          <p class="orbits-lobby-start-hint">All players must agree to start early</p>
        </div>
      ` : ''}

      <div class="orbits-lobby-info">
        <p>${playerCount < 2 ? 'Invite friends to join!' : 'Game starts automatically, or vote to start now'}</p>
      </div>

      <div class="orbits-lobby-actions">
        <button class="orbits-lobby-menu-btn secondary" data-action="leave">
          Leave
        </button>
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
    // Quick join (Play Now) button
    const quickJoinBtn = content.querySelector('[data-action="quick-join"]');
    if (quickJoinBtn) {
      quickJoinBtn.addEventListener('click', () => {
        this._quickJoin();
      });
    }

    // Server change button
    const changeServerBtn = content.querySelector('[data-action="change-server"]');
    if (changeServerBtn) {
      changeServerBtn.addEventListener('click', () => {
        this._showServerSelector();
      });
    }
  }

  /**
   * Show server selection modal
   */
  _showServerSelector() {
    const serverInfo = this._getServerInfo();
    const content = this.overlay.querySelector('.orbits-lobby-content');

    content.innerHTML = `
      <button class="orbits-lobby-back-btn" data-action="back-to-menu">
        &larr; Back
      </button>
      <div class="orbits-server-selector">
        <h3>Choose Server</h3>

        <button class="orbits-server-option ${serverInfo.type === 'cloud' ? 'selected' : ''}" data-server="cloud">
          <span class="orbits-server-icon">☁️</span>
          <span class="orbits-server-details">
            <span class="orbits-server-option-name">Cloud Server</span>
            <span class="orbits-server-option-desc">Play with anyone online</span>
          </span>
        </button>

        <button class="orbits-server-option ${serverInfo.type === 'local' ? 'selected' : ''}" data-server="local">
          <span class="orbits-server-icon">💻</span>
          <span class="orbits-server-details">
            <span class="orbits-server-option-name">This Computer</span>
            <span class="orbits-server-option-desc">Server running on this PC</span>
          </span>
        </button>

        <button class="orbits-server-option ${serverInfo.type === 'lan' ? 'selected' : ''}" data-server="lan">
          <span class="orbits-server-icon">🏠</span>
          <span class="orbits-server-details">
            <span class="orbits-server-option-name">Classroom / LAN</span>
            <span class="orbits-server-option-desc">Connect to teacher's server</span>
          </span>
        </button>

        <div class="orbits-lan-input ${serverInfo.type === 'lan' ? 'visible' : ''}" id="orbits-lan-section">
          <label>Server IP Address:</label>
          <input type="text" class="orbits-lobby-input" id="orbits-lan-ip"
                 placeholder="192.168.1.100"
                 value="${serverInfo.type === 'lan' ? this._extractIp(serverInfo.url) : ''}">
          <button class="orbits-lobby-btn" id="orbits-lan-connect">Connect</button>
        </div>
      </div>
    `;

    this._attachServerSelectorListeners(content);
  }

  /**
   * Extract IP from WebSocket URL
   */
  _extractIp(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url.replace('ws://', 'http://').replace('wss://', 'https://'));
      return parsed.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Attach listeners to server selector
   */
  _attachServerSelectorListeners(content) {
    // Back button
    content.querySelector('[data-action="back-to-menu"]').addEventListener('click', () => {
      this._updateContent();
    });

    // Server options
    content.querySelectorAll('.orbits-server-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const server = btn.dataset.server;

        // Update selected state
        content.querySelectorAll('.orbits-server-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Show/hide LAN input
        const lanSection = content.querySelector('#orbits-lan-section');
        if (server === 'lan') {
          lanSection.classList.add('visible');
          content.querySelector('#orbits-lan-ip').focus();
        } else {
          lanSection.classList.remove('visible');
          // Immediately apply for cloud and local
          this._applyServerChoice(server);
        }
      });
    });

    // LAN connect button
    const lanConnectBtn = content.querySelector('#orbits-lan-connect');
    const lanIpInput = content.querySelector('#orbits-lan-ip');

    lanConnectBtn.addEventListener('click', () => {
      const ip = lanIpInput.value.trim();
      if (ip) {
        this._applyServerChoice('lan', ip);
      }
    });

    lanIpInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const ip = lanIpInput.value.trim();
        if (ip) {
          this._applyServerChoice('lan', ip);
        }
      }
    });
  }

  /**
   * Apply server choice and reconnect
   */
  _applyServerChoice(type, ip = null) {
    let newUrl;

    switch (type) {
      case 'cloud':
        // Store 'cloud' to indicate explicit cloud preference (skips auto-discovery)
        localStorage.setItem('orbits_server_url', 'cloud');
        newUrl = 'wss://lrsl-driller-production.up.railway.app';
        break;
      case 'local':
        newUrl = 'ws://localhost:3001';
        localStorage.setItem('orbits_server_url', newUrl);
        break;
      case 'lan':
        newUrl = `ws://${ip}:3001`;
        localStorage.setItem('orbits_server_url', newUrl);
        break;
    }

    // Update network controller with new URL
    this.serverUrl = newUrl;
    this.network.serverUrl = newUrl;

    // Disconnect and show confirmation
    if (this.network.ws) {
      this.network.disconnect();
    }

    // Show toast and return to menu
    this._showToast(`Connected to ${type === 'cloud' ? 'Cloud' : type === 'local' ? 'Local' : 'LAN'} server`);
    this._updateContent();
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

    const addAIBtn = content.querySelector('[data-action="add-ai"]');
    if (addAIBtn) {
      addAIBtn.addEventListener('click', () => {
        this.network.addAIPlayer();
      });
    }

    const startNowBtn = content.querySelector('[data-action="start-now"]');
    if (startNowBtn) {
      startNowBtn.addEventListener('click', () => {
        this.network.voteStartNow();
        // Disable button after voting
        startNowBtn.disabled = true;
        startNowBtn.textContent = '✓ Voted!';
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

  /**
   * Quick join - find or create a public room
   */
  async _quickJoin() {
    this._setState(LobbyState.CREATING);
    try {
      const result = await this.network.quickJoin('arena');
      this.roomCode = result.roomCode;
      this.isHost = false;
      this._setState(LobbyState.IN_ROOM);
    } catch (error) {
      // Check if it's a "game in progress" error
      if (error.message && error.message.includes('in progress')) {
        this.error = 'All games are currently in progress. Try Solo vs AI mode instead, or wait a moment and try again.';
      } else {
        this.error = error.message || 'Failed to find game';
      }
      this._setState(LobbyState.ERROR);
    }
  }

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

    // Update minimized indicator if minimized
    if (this.isMinimized) {
      this._updateMinimizedIndicator();
    }
  }

  _handleCountdown({ secondsRemaining }) {
    this.countdownValue = secondsRemaining;
    this._setState(LobbyState.COUNTDOWN);
  }

  _handleLobbyCountdown(data) {
    const prevInfo = this.lobbyInfo;

    // Update lobby countdown info
    this.lobbyInfo = {
      secondsRemaining: data.secondsRemaining,  // null = waiting for players
      playersNeeded: data.playersNeeded,
      playerCount: data.playerCount,
      humanPlayerCount: data.humanPlayerCount || data.playerCount,
      maxPlayers: data.maxPlayers,
      startNowVotes: data.startNowVotes || 0,
      canStartNow: data.canStartNow || false
    };

    // Update the room display if we're in the room
    if (this.state === LobbyState.IN_ROOM) {
      // Only do partial update if structure hasn't changed
      // Full re-render if canStartNow changed (button visibility)
      const structureChanged = prevInfo?.canStartNow !== this.lobbyInfo.canStartNow;

      if (structureChanged) {
        this._updateContent();
      } else {
        // Just update the dynamic text elements
        this._updateLobbyTimerDisplay();
      }
    }

    // Update minimized indicator if minimized
    if (this.isMinimized) {
      this._updateMinimizedIndicator();
    }
  }

  /**
   * Update just the timer and vote count without rebuilding DOM
   * @private
   */
  _updateLobbyTimerDisplay() {
    const content = this.overlay.querySelector('.orbits-lobby-content');
    if (!content) return;

    // Update timer value
    const timerValue = content.querySelector('.orbits-lobby-timer-value');
    if (timerValue && this.lobbyInfo.secondsRemaining !== null) {
      timerValue.textContent = `${this.lobbyInfo.secondsRemaining}s`;
    }

    // Update timer visibility
    const timer = content.querySelector('.orbits-lobby-timer');
    if (timer) {
      timer.style.display = this.lobbyInfo.secondsRemaining !== null ? '' : 'none';
    }

    // Update start now button vote count (if not already voted)
    const startNowBtn = content.querySelector('[data-action="start-now"]');
    if (startNowBtn && !startNowBtn.disabled) {
      const votes = this.lobbyInfo.startNowVotes;
      const humanCount = this.lobbyInfo.humanPlayerCount;
      startNowBtn.textContent = `⚡ Start Now ${votes > 0 ? `(${votes}/${humanCount})` : ''}`;
    }

    // Update status message
    const status = content.querySelector('.orbits-lobby-status');
    if (status) {
      const playerCount = this.players.length;
      if (playerCount < 2) {
        status.textContent = '⏳ Waiting for players...';
      } else if (this.lobbyInfo.secondsRemaining === null) {
        status.textContent = '✓ Ready to start!';
      } else {
        status.textContent = '✓ Starting soon...';
      }
    }
  }

  _handleWaiting(data) {
    // Timer expired but not enough players - reset lobby info
    console.log('[OrbitsLobby] Waiting for more players:', data);
    this.lobbyInfo = {
      secondsRemaining: undefined,
      playersNeeded: data.playersNeeded,
      playerCount: data.playerCount,
      maxPlayers: 8
    };

    // Update the room display
    if (this.state === LobbyState.IN_ROOM) {
      this._updateContent();
    }

    // Update minimized indicator
    if (this.isMinimized) {
      this._updateMinimizedIndicator();
    }
  }

  _handleMatchStart(data) {
    // Store match data for when user clicks to join
    this._pendingMatchData = data;

    // If minimized, show toast notification instead of auto-launching
    if (this.isMinimized) {
      this._clearToasts();
      this._showToast('Game is ready! Click to play', 'game-ready', () => {
        this._launchMatch();
      });

      // Hide the minimized indicator
      this.minimizedIndicator.classList.remove('visible');
      return;
    }

    // Not minimized - launch immediately
    this._launchMatch();
  }

  /**
   * Launch the match (called when ready to play)
   */
  _launchMatch() {
    const data = this._pendingMatchData;
    if (!data) return;

    this._pendingMatchData = null;
    this._clearToasts();

    // Hide lobby UI but DON'T disconnect - game needs the network!
    this.hide();

    // Clean up minimized indicator
    if (this.minimizedIndicator.parentNode) {
      this.minimizedIndicator.remove();
    }
    this.isMinimized = false;

    // Clean up toasts
    if (this.toastContainer.parentNode) {
      this.toastContainer.remove();
    }

    // Start the game with the active network connection
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

    // Clean up minimized indicator
    if (this.minimizedIndicator.parentNode) {
      this.minimizedIndicator.remove();
    }
    this.isMinimized = false;

    // Clean up toasts
    this._clearToasts();
    if (this.toastContainer.parentNode) {
      this.toastContainer.remove();
    }

    this.network.disconnect();
    this.onExit();
  }

  /**
   * Get the network controller (for use in game)
   */
  getNetworkController() {
    return this.network;
  }

  /**
   * Update the server URL (called when discovery finds a different server)
   * @param {string} newUrl - New WebSocket server URL
   */
  updateServerUrl(newUrl) {
    if (newUrl === this.serverUrl) return;

    console.log('[OrbitsLobby] Updating server URL:', newUrl);
    this.serverUrl = newUrl;

    // Update network controller
    if (this.network) {
      // Disconnect if connected to old server
      if (this.network.ws) {
        this.network.disconnect();
      }
      this.network.serverUrl = newUrl;
    }

    // Re-render menu to show updated server info
    if (this.state === LobbyState.MENU) {
      this._updateContent();
    }
  }

  /**
   * Reset lobby state after a match ends
   * Prepares the lobby to be shown again for a new match
   */
  reset() {
    console.log('[OrbitsLobby] Resetting lobby state');

    // Reset internal state
    this.state = LobbyState.MENU;
    this.error = null;
    this.roomCode = null;
    this.players = [];
    this.isHost = false;
    this.canStart = false;
    this.lobbyInfo = null;
    this.countdownValue = 0;

    // Ensure network is disconnected
    if (this.network) {
      this.network.disconnect();
    }

    // Clean up minimized indicator
    if (this.minimizedIndicator.parentNode) {
      this.minimizedIndicator.remove();
    }
    this.isMinimized = false;

    // Clear toasts
    this._clearToasts();

    // Update UI to show menu
    this._updateContent();
  }
}

export default OrbitsLobby;
