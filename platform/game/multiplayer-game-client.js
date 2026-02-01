/**
 * Ghost Orbits - Multiplayer Game Client
 *
 * Main orchestrator connecting network to rendering for multiplayer matches.
 * Handles game lifecycle, input, and coordinates renderer/panel updates.
 *
 * @version 1.0.0
 */

import { MultiplayerRenderer } from './multiplayer-renderer.js';
import { MultiplayerPanel } from './multiplayer-panel.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const CLIENT_STATE = {
  INITIALIZING: 'initializing',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  ENDED: 'ended'
};

// ============================================================================
// MULTIPLAYER GAME CLIENT
// ============================================================================

/**
 * MultiplayerGameClient - Orchestrates multiplayer game rendering and input
 */
export class MultiplayerGameClient {
  /**
   * Create a new multiplayer game client
   * @param {Object} config - Client configuration
   * @param {Object} config.network - OrbitsNetworkController instance
   * @param {HTMLElement} config.container - Container for game UI
   * @param {Function} [config.onComplete] - Callback when match ends
   */
  constructor(config) {
    this.network = config.network;
    this.container = config.container;
    this.onComplete = config.onComplete || (() => {});

    // Game state
    this.state = CLIENT_STATE.INITIALIZING;
    this.myPlayerId = null;
    this.matchData = null;
    this.lastSnapshot = null;

    // UI components
    this.renderer = null;
    this.panel = null;
    this.gameContainer = null;

    // Input handling
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
    this._keysPressed = new Set();

    // Network callbacks (saved for cleanup)
    this._savedCallbacks = null;

    // Animation frame
    this._animationFrameId = null;
  }

  /**
   * Start the multiplayer game
   * @param {Object} matchData - Match start data from server
   */
  start(matchData) {
    this.matchData = matchData;
    this.myPlayerId = matchData.myPlayerId;

    console.log('[MultiplayerGameClient] Starting match', {
      playerId: this.myPlayerId,
      players: matchData.players?.length,
      arenaSize: matchData.arenaSize
    });

    // Create game container (full-screen overlay)
    this._createGameContainer();

    // Initialize renderer
    const arenaWidth = matchData.arenaWidth || matchData.arenaSize || 800;
    const arenaHeight = matchData.arenaHeight || matchData.arenaSize || 800;

    this.renderer = new MultiplayerRenderer(this.gameContainer, {
      arenaWidth,
      arenaHeight
    });
    this.renderer.setMyPlayerId(this.myPlayerId);

    // Initialize HUD panel
    this.panel = new MultiplayerPanel(this.gameContainer);
    this.panel.setMyPlayerId(this.myPlayerId);

    // Bind network callbacks
    this._bindNetworkCallbacks();

    // Bind input handlers
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);

    // Set state
    this.state = CLIENT_STATE.PLAYING;

    // Initial render with match data
    this._renderInitialState();

    // Start render loop
    this._startRenderLoop();

    console.log('[MultiplayerGameClient] Game started');
  }

  /**
   * Create the full-screen game container
   * @private
   */
  _createGameContainer() {
    this.gameContainer = document.createElement('div');
    this.gameContainer.className = 'multiplayer-game-container';
    this.gameContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #0a0a12;
      z-index: 9999;
    `;

    this.container.appendChild(this.gameContainer);
  }

  /**
   * Bind callbacks to network controller
   * @private
   */
  _bindNetworkCallbacks() {
    // Save original callbacks so we can restore them
    this._savedCallbacks = {
      onSnapshot: this.network.onSnapshot,
      onMatchEnd: this.network.onMatchEnd,
      onEvent: this.network.onEvent,
      onCountdown: this.network.onCountdown
    };

    // Override with our handlers
    this.network.onSnapshot = (data) => this._onSnapshot(data);
    this.network.onMatchEnd = (data) => this._onMatchEnd(data);
    this.network.onEvent = (data) => this._onEvent(data);
    this.network.onCountdown = (data) => this._onCountdown(data);
  }

  /**
   * Restore original network callbacks
   * @private
   */
  _restoreNetworkCallbacks() {
    if (this._savedCallbacks) {
      this.network.onSnapshot = this._savedCallbacks.onSnapshot;
      this.network.onMatchEnd = this._savedCallbacks.onMatchEnd;
      this.network.onEvent = this._savedCallbacks.onEvent;
      this.network.onCountdown = this._savedCallbacks.onCountdown;
      this._savedCallbacks = null;
    }
  }

  /**
   * Render initial state from match data
   * @private
   */
  _renderInitialState() {
    if (!this.matchData) return;

    // Convert match data to snapshot format for initial render
    const initialSnapshot = {
      tick: 0,
      time: 120, // Default 2 minutes
      ghosts: this.matchData.players?.map(p => ({
        id: p.playerId,
        x: p.spawnX || this.matchData.arenaWidth / 2,
        y: p.spawnY || this.matchData.arenaHeight / 2,
        color: p.color,
        username: p.username,
        lives: 3,
        score: 0,
        invulnerable: false
      })) || [],
      dots: this.matchData.dots || [],
      records: this.matchData.records || []
    };

    this.lastSnapshot = initialSnapshot;
    this.renderer.render(initialSnapshot);
    this.panel.update(initialSnapshot);
  }

  /**
   * Start the render loop
   * @private
   */
  _startRenderLoop() {
    const loop = () => {
      if (this.state === CLIENT_STATE.ENDED) return;

      // Re-render last snapshot (for smooth animations/trails)
      if (this.lastSnapshot) {
        this.renderer.render(this.lastSnapshot);
      }

      this._animationFrameId = requestAnimationFrame(loop);
    };

    this._animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Handle incoming game snapshot
   * @param {Object} snapshot - Server game snapshot
   * @private
   */
  _onSnapshot(snapshot) {
    if (this.state !== CLIENT_STATE.PLAYING) return;

    // Normalize ghost data: server sends playerId, client expects id
    if (snapshot.ghosts) {
      snapshot.ghosts = snapshot.ghosts.map(g => ({
        ...g,
        id: g.playerId || g.id  // Ensure id is set from playerId
      }));
    }

    this.lastSnapshot = snapshot;

    // Debug: Log game state occasionally (every 2 seconds at 60Hz)
    if (snapshot.tick % 120 === 0) {
      // Log claimed dots with actual color values
      const claimedDots = snapshot.dots?.filter(d => d.ownerId) || [];
      if (claimedDots.length > 0) {
        // Show first 3 dots with full details
        const sample = claimedDots.slice(0, 3);
        console.log(`[MultiplayerClient] Claimed dots (${claimedDots.length} total), sample:`,
          sample.map(d => `id=${d.id}, owner=${d.ownerId?.slice(-4)}, color=${d.ownerColor}`).join(' | ')
        );
      }

      // Log all ghosts with spin state
      if (snapshot.ghosts?.length > 0) {
        console.log(`[MultiplayerClient] Ghosts:`,
          snapshot.ghosts.map(g => `${g.username || g.id?.slice(-4)}: spin=${g.isSpinning}, progress=${g.spinProgress?.toFixed(2) || 0}`).join(' | ')
        );
      }
    }

    // Render and update HUD
    this.renderer.render(snapshot);
    this.panel.update(snapshot);
  }

  /**
   * Handle countdown events
   * @param {Object} data - Countdown data
   * @private
   */
  _onCountdown(data) {
    if (this.panel) {
      this.panel.showCountdown(data.secondsRemaining);
    }
  }

  /**
   * Handle game events
   * @param {Object} data - Event data
   * @private
   */
  _onEvent(data) {
    if (!this.panel) return;

    const isMe = data.playerId === this.myPlayerId;
    const playerName = isMe ? 'You' : `Player ${data.playerId?.slice(-4) || '???'}`;

    switch (data.event) {
      case 'dot_claimed':
        this.panel.showEvent(`${playerName} claimed a dot!`, 'claim');
        break;

      case 'dot_flipped':
        this.panel.showEvent(`${playerName} flipped a dot!`, 'flip');
        break;

      case 'player_damaged':
        if (isMe) {
          this.panel.showEvent(`You took damage! (${data.lives} lives left)`, 'damage');
        } else {
          this.panel.showEvent(`${playerName} took damage!`, 'info');
        }
        break;

      case 'player_eliminated':
        if (isMe) {
          this.panel.showEvent('You were eliminated!', 'damage');
        } else {
          this.panel.showEvent(`${playerName} was eliminated!`, 'info');
        }
        break;

      default:
        // Unknown event type
        break;
    }
  }

  /**
   * Handle match end
   * @param {Object} data - Match end data
   * @private
   */
  _onMatchEnd(data) {
    console.log('[MultiplayerGameClient] Match ended:', data);
    this.state = CLIENT_STATE.ENDED;

    // Show results overlay
    this._showResults(data);
  }

  /**
   * Show match results
   * @param {Object} results - Match results data
   * @private
   */
  _showResults(results) {
    const overlay = document.createElement('div');
    overlay.className = 'mp-results-overlay';

    const isWinner = results.isWinner;
    const winnerName = results.winnerUsername || 'Unknown';
    const condition = this._formatCondition(results.condition);

    overlay.innerHTML = `
      <div class="mp-results-panel">
        <h2 class="mp-results-title ${isWinner ? 'winner' : 'loser'}">
          ${isWinner ? 'Victory!' : 'Defeat'}
        </h2>
        <p class="mp-results-subtitle">
          ${isWinner ? 'You won!' : `${winnerName} wins!`}
        </p>
        <p class="mp-results-condition">${condition}</p>

        <div class="mp-results-scores">
          <h3>Final Scores</h3>
          ${this._renderFinalScores(results.finalScores)}
        </div>

        <button class="mp-results-btn" id="mp-results-close">
          Return to Menu
        </button>
      </div>
    `;

    // Add styles
    if (!document.getElementById('mp-results-styles')) {
      const style = document.createElement('style');
      style.id = 'mp-results-styles';
      style.textContent = `
        .mp-results-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.85);
          z-index: 1000;
          animation: results-fade-in 0.5s ease;
        }

        @keyframes results-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .mp-results-panel {
          background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4a 100%);
          border: 2px solid #4a4a6a;
          border-radius: 16px;
          padding: 32px 48px;
          text-align: center;
          color: #fff;
          max-width: 400px;
          animation: results-slide-up 0.5s ease;
        }

        @keyframes results-slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .mp-results-title {
          font-size: 48px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .mp-results-title.winner {
          color: #44cc88;
          text-shadow: 0 0 20px rgba(68, 204, 136, 0.5);
        }

        .mp-results-title.loser {
          color: #ff6666;
          text-shadow: 0 0 20px rgba(255, 102, 102, 0.3);
        }

        .mp-results-subtitle {
          font-size: 18px;
          color: #aaa;
          margin: 0 0 4px 0;
        }

        .mp-results-condition {
          font-size: 14px;
          color: #666;
          margin: 0 0 24px 0;
        }

        .mp-results-scores {
          margin-bottom: 24px;
        }

        .mp-results-scores h3 {
          font-size: 14px;
          color: #888;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .mp-results-score-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mp-results-score-entry {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .mp-results-score-entry.is-me {
          background: rgba(68, 136, 255, 0.2);
          border: 1px solid rgba(68, 136, 255, 0.4);
        }

        .mp-results-score-name {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mp-results-score-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .mp-results-score-value {
          font-weight: 600;
          color: #4488ff;
        }

        .mp-results-btn {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .mp-results-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(68, 136, 255, 0.4);
        }

        .mp-results-btn:active {
          transform: translateY(0);
        }
      `;
      document.head.appendChild(style);
    }

    this.gameContainer.appendChild(overlay);

    // Handle close button
    overlay.querySelector('#mp-results-close').addEventListener('click', () => {
      this.destroy();
      this.onComplete(results);
    });
  }

  /**
   * Format win condition for display
   * @param {string} condition - Win condition string
   * @returns {string} Formatted condition
   * @private
   */
  _formatCondition(condition) {
    switch (condition) {
      case 'territory':
        return 'Won by territory control (90%)';
      case 'elimination':
        return 'Won by elimination';
      case 'timeout':
        return 'Time expired - most territory wins';
      default:
        return condition || '';
    }
  }

  /**
   * Render final scores list
   * @param {Object} finalScores - Score map {playerId: score}
   * @returns {string} HTML string
   * @private
   */
  _renderFinalScores(finalScores) {
    if (!finalScores || !this.lastSnapshot?.ghosts) {
      return '<p class="mp-results-no-scores">No scores available</p>';
    }

    // Sort players by score
    const entries = Object.entries(finalScores).sort((a, b) => b[1] - a[1]);

    let html = '<div class="mp-results-score-list">';

    for (const [playerId, score] of entries) {
      const ghost = this.lastSnapshot.ghosts.find(g => g.id === playerId);
      const isMe = playerId === this.myPlayerId;
      const name = ghost?.username || `Player ${playerId.slice(-4)}`;
      const color = ghost?.color || '#4488ff';

      html += `
        <div class="mp-results-score-entry ${isMe ? 'is-me' : ''}">
          <span class="mp-results-score-name">
            <span class="mp-results-score-color" style="background: ${color}"></span>
            ${this._escapeHtml(name)}
          </span>
          <span class="mp-results-score-value">${score}</span>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event
   * @private
   */
  _onKeyDown(event) {
    if (this.state !== CLIENT_STATE.PLAYING) return;

    // Prevent default for game keys
    if (event.code === 'Space') {
      event.preventDefault();

      // Only send if not already pressed (prevent key repeat)
      if (!this._keysPressed.has('Space')) {
        this._keysPressed.add('Space');
        this.network.sendSpacebarPress();
      }
    }

    // Escape to show pause/exit menu (future feature)
    if (event.code === 'Escape') {
      event.preventDefault();
      // TODO: Show pause menu
    }
  }

  /**
   * Handle keyup events
   * @param {KeyboardEvent} event
   * @private
   */
  _onKeyUp(event) {
    if (event.code === 'Space') {
      this._keysPressed.delete('Space');
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clean up all resources
   */
  destroy() {
    console.log('[MultiplayerGameClient] Destroying');

    this.state = CLIENT_STATE.ENDED;

    // Stop render loop
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    // Remove input listeners
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);

    // Restore network callbacks
    this._restoreNetworkCallbacks();

    // Destroy renderer
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    // Destroy panel
    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
    }

    // Remove game container
    if (this.gameContainer && this.gameContainer.parentNode) {
      this.gameContainer.parentNode.removeChild(this.gameContainer);
    }
    this.gameContainer = null;

    // Clear state
    this._keysPressed.clear();
    this.lastSnapshot = null;
    this.matchData = null;
  }
}

export default MultiplayerGameClient;
