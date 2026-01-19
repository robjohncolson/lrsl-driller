/**
 * Reflex Duel Tiebreaker Game
 *
 * A reaction time racing game for tiebreaker matches.
 * Wait for the flash, then tap as fast as possible.
 * Early tap gives point to opponent.
 * First to 5 points wins.
 */

import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

export class ReflexDuel {
  constructor(container, wsClient, matchInfo, onMatchEnd) {
    this.container = container;
    this.wsClient = wsClient;
    this.matchInfo = matchInfo;
    this.onMatchEnd = onMatchEnd;

    // Config
    this.config = GAME_MODE_CONFIG.reflexDuel;

    // Game state
    this.blueScore = 0;
    this.redScore = 0;
    this.isRunning = false;
    this.isHost = false;

    // Round state
    this.roundNumber = 0;
    this.roundState = 'waiting'; // waiting, ready, flash, result
    this.flashTime = null;
    this.blueTapTime = null;
    this.redTapTime = null;
    this.roundTimer = null;

    // DOM
    this.canvas = null;
    this.ctx = null;

    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div class="reflex-duel-container">
        <div class="rd-header">
          <span class="rd-player blue">${this.matchInfo.bluePlayer || 'Blue'}</span>
          <span class="rd-score">
            <span id="rd-blue-score">0</span>
            <span> - </span>
            <span id="rd-red-score">0</span>
          </span>
          <span class="rd-player red">${this.matchInfo.redPlayer || 'Red'}</span>
        </div>
        <canvas id="rd-canvas"></canvas>
        <div class="rd-instructions">
          <p>Wait for the GREEN flash, then TAP/CLICK as fast as possible!</p>
          <p>Tap early = opponent gets the point</p>
          <p>First to ${this.config.pointsToWin} wins!</p>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#rd-canvas');
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.ctx = this.canvas.getContext('2d');

    this._addStyles();
    this._attachEventListeners();
    this._render();
  }

  _addStyles() {
    if (document.getElementById('reflex-duel-styles')) return;

    const style = document.createElement('style');
    style.id = 'reflex-duel-styles';
    style.textContent = `
      .reflex-duel-container {
        background: #1f2937;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }

      .rd-header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-bottom: 10px;
      }

      .rd-player {
        font-weight: bold;
        padding: 4px 12px;
        border-radius: 4px;
      }

      .rd-player.blue { background: #3b82f6; color: white; }
      .rd-player.red { background: #ef4444; color: white; }

      .rd-score {
        font-size: 24px;
        font-weight: bold;
        color: white;
      }

      #rd-canvas {
        display: block;
        margin: 10px auto;
        border-radius: 8px;
        cursor: pointer;
      }

      .rd-instructions {
        margin-top: 10px;
        color: #9ca3af;
        font-size: 12px;
      }

      .rd-instructions p { margin: 4px 0; }
    `;
    document.head.appendChild(style);
  }

  _attachEventListeners() {
    // Click/tap to respond
    this.canvas.addEventListener('click', () => this._handleTap());
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._handleTap();
    });

    // Keyboard space/enter also works
    document.addEventListener('keydown', this._keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._handleTap();
      }
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'reflex_round_start':
        this._receiveRoundStart(message);
        break;

      case 'reflex_flash':
        this._receiveFlash(message);
        break;

      case 'reflex_tap':
        this._receiveTap(message);
        break;

      case 'reflex_result':
        this._receiveResult(message);
        break;
    }
  }

  /**
   * Set whether this client is the host (blue player)
   */
  setHost(isHost) {
    this.isHost = isHost;
  }

  /**
   * Start the game
   */
  start() {
    this.isRunning = true;
    this.blueScore = 0;
    this.redScore = 0;
    this.roundNumber = 0;

    if (this.isHost) {
      this._startNewRound();
    }
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false;
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
  }

  /**
   * Start a new round (host only)
   */
  _startNewRound() {
    if (!this.isHost || !this.isRunning) return;

    this.roundNumber++;
    this.roundState = 'waiting';
    this.flashTime = null;
    this.blueTapTime = null;
    this.redTapTime = null;

    // Broadcast round start
    if (this.wsClient) {
      this.wsClient.send({
        type: 'reflex_round_start',
        matchNumber: this.matchInfo.matchNumber,
        roundNumber: this.roundNumber
      });
    }

    this._render();

    // Random delay before flash
    const delay = this.config.minDelayMs +
      Math.random() * (this.config.maxDelayMs - this.config.minDelayMs);

    setTimeout(() => {
      this.roundState = 'ready';
      this._render();

      // Small ready period
      setTimeout(() => {
        if (this.roundState === 'ready') {
          this._triggerFlash();
        }
      }, 500);
    }, 1000);

    this.roundTimer = setTimeout(() => {
      this._triggerFlash();
    }, delay);
  }

  /**
   * Receive round start from host
   */
  _receiveRoundStart(message) {
    if (this.isHost) return;

    this.roundNumber = message.roundNumber;
    this.roundState = 'waiting';
    this.flashTime = null;
    this.blueTapTime = null;
    this.redTapTime = null;

    this._render();
  }

  /**
   * Trigger the flash (host only)
   */
  _triggerFlash() {
    if (!this.isHost || this.roundState === 'flash' || this.roundState === 'result') return;

    this.roundState = 'flash';
    this.flashTime = Date.now();

    // Broadcast flash
    if (this.wsClient) {
      this.wsClient.send({
        type: 'reflex_flash',
        matchNumber: this.matchInfo.matchNumber,
        roundNumber: this.roundNumber,
        flashTime: this.flashTime
      });
    }

    this._render();

    // Auto-resolve after 3 seconds if no one tapped
    setTimeout(() => {
      if (this.roundState === 'flash' && !this.blueTapTime && !this.redTapTime) {
        // Both missed - redraw
        this._resolveRound();
      }
    }, 3000);
  }

  /**
   * Receive flash from host
   */
  _receiveFlash(message) {
    if (this.isHost) return;

    this.roundState = 'flash';
    this.flashTime = message.flashTime;
    this._render();
  }

  /**
   * Handle player tap
   */
  _handleTap() {
    if (!this.isRunning) return;

    const team = this.isHost ? 'blue' : 'red';
    const tapTime = Date.now();

    // Broadcast tap
    if (this.wsClient) {
      this.wsClient.send({
        type: 'reflex_tap',
        matchNumber: this.matchInfo.matchNumber,
        roundNumber: this.roundNumber,
        team,
        tapTime
      });
    }

    // Record locally
    if (team === 'blue') {
      if (this.blueTapTime) return; // Already tapped
      this.blueTapTime = tapTime;
    } else {
      if (this.redTapTime) return;
      this.redTapTime = tapTime;
    }

    // Check for early tap
    if (this.roundState === 'waiting' || this.roundState === 'ready') {
      // Early! Opponent gets point
      this._scoreEarly(team);
      return;
    }

    // If host and both have tapped (or just us), resolve
    if (this.isHost && (this.blueTapTime || this.redTapTime)) {
      // Wait a moment for opponent's tap to arrive
      setTimeout(() => this._resolveRound(), 100);
    }

    this._render();
  }

  /**
   * Receive tap from opponent
   */
  _receiveTap(message) {
    if (message.roundNumber !== this.roundNumber) return;

    if (message.team === 'blue') {
      this.blueTapTime = message.tapTime;
    } else {
      this.redTapTime = message.tapTime;
    }

    // Check for early tap
    if (this.roundState === 'waiting' || this.roundState === 'ready') {
      this._scoreEarly(message.team);
      return;
    }

    // If host and both tapped, resolve
    if (this.isHost && this.blueTapTime && this.redTapTime) {
      this._resolveRound();
    }

    this._render();
  }

  /**
   * Score an early tap (opponent gets point)
   */
  _scoreEarly(earlyTeam) {
    const winner = earlyTeam === 'blue' ? 'red' : 'blue';
    this._awardPoint(winner, 'early', null, null);
  }

  /**
   * Resolve the round after flash (host only)
   */
  _resolveRound() {
    if (!this.isHost || this.roundState === 'result') return;

    this.roundState = 'result';

    let winner = null;
    let reason = '';

    if (this.blueTapTime && this.redTapTime) {
      // Both tapped - compare times
      const blueReaction = this.blueTapTime - this.flashTime;
      const redReaction = this.redTapTime - this.flashTime;
      const diff = Math.abs(blueReaction - redReaction);

      if (diff <= this.config.tieThresholdMs) {
        // Tie - redraw
        reason = 'tie';
      } else if (blueReaction < redReaction) {
        winner = 'blue';
        reason = 'faster';
      } else {
        winner = 'red';
        reason = 'faster';
      }
    } else if (this.blueTapTime) {
      winner = 'blue';
      reason = 'only';
    } else if (this.redTapTime) {
      winner = 'red';
      reason = 'only';
    } else {
      // Neither tapped - redraw
      reason = 'timeout';
    }

    const blueReaction = this.blueTapTime ? this.blueTapTime - this.flashTime : null;
    const redReaction = this.redTapTime ? this.redTapTime - this.flashTime : null;

    if (winner) {
      this._awardPoint(winner, reason, blueReaction, redReaction);
    } else {
      // Redraw
      this._render();
      setTimeout(() => {
        if (this.isRunning) this._startNewRound();
      }, 1500);
    }
  }

  /**
   * Award a point
   */
  _awardPoint(winner, reason, blueReaction, redReaction) {
    this.roundState = 'result';

    if (winner === 'blue') {
      this.blueScore++;
    } else {
      this.redScore++;
    }

    this._updateScoreDisplay();

    // Broadcast result
    if (this.wsClient) {
      this.wsClient.send({
        type: 'reflex_result',
        matchNumber: this.matchInfo.matchNumber,
        roundNumber: this.roundNumber,
        winner,
        reason,
        blueReaction,
        redReaction,
        blueScore: this.blueScore,
        redScore: this.redScore
      });
    }

    this._render();

    // Check for game win
    if (this.blueScore >= this.config.pointsToWin || this.redScore >= this.config.pointsToWin) {
      this.stop();
      const gameWinner = this.blueScore >= this.config.pointsToWin ? 'blue' : 'red';
      if (this.onMatchEnd) {
        this.onMatchEnd(gameWinner, this.blueScore, this.redScore);
      }
    } else if (this.isHost) {
      // Start next round
      setTimeout(() => {
        if (this.isRunning) this._startNewRound();
      }, 2000);
    }
  }

  /**
   * Receive result from host
   */
  _receiveResult(message) {
    this.roundState = 'result';
    this.blueScore = message.blueScore;
    this.redScore = message.redScore;
    this._updateScoreDisplay();
    this._render();

    if (this.blueScore >= this.config.pointsToWin || this.redScore >= this.config.pointsToWin) {
      this.stop();
      const winner = this.blueScore >= this.config.pointsToWin ? 'blue' : 'red';
      if (this.onMatchEnd) {
        this.onMatchEnd(winner, this.blueScore, this.redScore);
      }
    }
  }

  /**
   * Update score display
   */
  _updateScoreDisplay() {
    const blueEl = this.container.querySelector('#rd-blue-score');
    const redEl = this.container.querySelector('#rd-red-score');
    if (blueEl) blueEl.textContent = this.blueScore;
    if (redEl) redEl.textContent = this.redScore;
  }

  /**
   * Render the canvas
   */
  _render() {
    const { ctx, config, canvas } = this;
    const { colors } = config;
    const width = canvas.width;
    const height = canvas.height;

    // Background color based on state
    let bgColor;
    let message = '';
    let subMessage = '';

    switch (this.roundState) {
      case 'waiting':
        bgColor = colors.waiting;
        message = 'WAIT...';
        subMessage = 'Do not tap yet!';
        break;

      case 'ready':
        bgColor = colors.ready;
        message = 'GET READY...';
        subMessage = 'Flash coming soon!';
        break;

      case 'flash':
        bgColor = colors.flash;
        message = 'GO!';
        subMessage = 'TAP NOW!';
        break;

      case 'result':
        bgColor = colors.background;
        const lastWinner = this.blueScore > this.redScore ? 'BLUE' :
                          this.redScore > this.blueScore ? 'RED' : null;
        if (lastWinner) {
          message = `${lastWinner} scores!`;
        } else {
          message = 'REDRAW';
        }
        break;

      default:
        bgColor = colors.background;
        message = 'Ready?';
    }

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw main message
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, width / 2, height / 2 - 20);

    // Draw sub message
    if (subMessage) {
      ctx.font = '18px sans-serif';
      ctx.fillText(subMessage, width / 2, height / 2 + 30);
    }

    // Draw round number
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.roundNumber}`, 10, 20);

    // Draw reaction times if in result state
    if (this.roundState === 'result' && this.flashTime) {
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      if (this.blueTapTime) {
        const blueReaction = this.blueTapTime - this.flashTime;
        ctx.fillStyle = colors.blue;
        ctx.fillText(`Blue: ${blueReaction}ms`, 10, height - 30);
      }
      ctx.textAlign = 'right';
      if (this.redTapTime) {
        const redReaction = this.redTapTime - this.flashTime;
        ctx.fillStyle = colors.red;
        ctx.fillText(`Red: ${redReaction}ms`, width - 10, height - 30);
      }
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    document.removeEventListener('keydown', this._keyHandler);
  }
}
