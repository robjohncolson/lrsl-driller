/**
 * Quick Calc Tiebreaker Game
 *
 * A mental math race minigame for tiebreaker matches.
 * Players solve basic arithmetic problems (2-digit numbers).
 * First to 5 correct answers wins.
 */

import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

export class QuickCalc {
  constructor(container, wsClient, matchInfo, onMatchEnd) {
    this.container = container;
    this.wsClient = wsClient;
    this.matchInfo = matchInfo;
    this.onMatchEnd = onMatchEnd;

    // Config
    this.config = GAME_MODE_CONFIG.quickCalc;

    // Game state
    this.blueScore = 0;
    this.redScore = 0;
    this.isRunning = false;
    this.isHost = false; // Blue player is host

    // Current problem
    this.currentProblem = null;
    this.correctAnswer = null;
    this.problemNumber = 0;

    // Lockout state
    this.blueLocked = false;
    this.redLocked = false;
    this.blueLockedUntil = 0;
    this.redLockedUntil = 0;

    // Timeout timer
    this.timeoutTimer = null;
    this.problemStartTime = 0;

    // DOM elements
    this.canvas = null;
    this.ctx = null;
    this.answerInput = null;

    this._init();
  }

  _init() {
    // Create canvas and input
    this.container.innerHTML = `
      <div class="quick-calc-container">
        <div class="quick-calc-header">
          <span class="qc-player blue">${this.matchInfo.bluePlayer || 'Blue'}</span>
          <span class="qc-score">
            <span id="qc-blue-score">0</span>
            <span> - </span>
            <span id="qc-red-score">0</span>
          </span>
          <span class="qc-player red">${this.matchInfo.redPlayer || 'Red'}</span>
        </div>
        <canvas id="qc-canvas"></canvas>
        <div class="qc-input-area">
          <input type="number" id="qc-answer" placeholder="?" autocomplete="off" inputmode="numeric">
          <button id="qc-submit">Submit</button>
        </div>
        <div class="qc-instructions">
          <p>First to ${this.config.pointsToWin} correct answers wins!</p>
          <p>Wrong answer = 1 second lockout</p>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#qc-canvas');
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.ctx = this.canvas.getContext('2d');

    this.answerInput = this.container.querySelector('#qc-answer');

    this._addStyles();
    this._attachEventListeners();
    this._setupWebSocket();
    this._render();
  }

  _addStyles() {
    if (document.getElementById('quick-calc-styles')) return;

    const style = document.createElement('style');
    style.id = 'quick-calc-styles';
    style.textContent = `
      .quick-calc-container {
        background: #1f2937;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }

      .quick-calc-header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-bottom: 10px;
      }

      .qc-player {
        font-weight: bold;
        padding: 4px 12px;
        border-radius: 4px;
      }

      .qc-player.blue { background: #3b82f6; color: white; }
      .qc-player.red { background: #ef4444; color: white; }

      .qc-score {
        font-size: 24px;
        font-weight: bold;
        color: white;
      }

      #qc-canvas {
        display: block;
        margin: 10px auto;
        background: #111827;
        border-radius: 4px;
      }

      .qc-input-area {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 15px 0;
      }

      #qc-answer {
        width: 120px;
        padding: 10px 15px;
        font-size: 24px;
        text-align: center;
        background: #374151;
        color: white;
        border: 2px solid #4b5563;
        border-radius: 8px;
        outline: none;
      }

      #qc-answer:focus {
        border-color: #3b82f6;
      }

      #qc-answer.locked {
        background: #6b7280;
        border-color: #ef4444;
      }

      #qc-submit {
        padding: 10px 25px;
        font-size: 18px;
        font-weight: bold;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }

      #qc-submit:hover { background: #2563eb; }
      #qc-submit:disabled { background: #4b5563; cursor: not-allowed; }

      .qc-instructions {
        margin-top: 10px;
        color: #9ca3af;
        font-size: 12px;
      }

      .qc-instructions p { margin: 4px 0; }
    `;
    document.head.appendChild(style);
  }

  _attachEventListeners() {
    this.answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this._submitAnswer();
      }
    });

    this.container.querySelector('#qc-submit').addEventListener('click', () => {
      this._submitAnswer();
    });
  }

  _setupWebSocket() {
    if (!this.wsClient) return;

    // WebSocket message handling is done via handleMessage
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'quick_calc_problem':
        this._receiveProblem(message);
        break;

      case 'quick_calc_answer':
        this._receiveAnswer(message);
        break;

      case 'quick_calc_point':
        this._receivePoint(message);
        break;

      case 'quick_calc_lockout':
        this._receiveLockout(message);
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
    this.problemNumber = 0;

    if (this.isHost) {
      this._generateAndBroadcastProblem();
    }

    this.answerInput.focus();
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  /**
   * Generate a new problem (host only)
   */
  _generateAndBroadcastProblem() {
    if (!this.isHost || !this.isRunning) return;

    const { minNumber, maxNumber, operations } = this.config;

    const a = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    const b = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    const op = operations[Math.floor(Math.random() * operations.length)];

    let answer;
    let displayOp = op;
    switch (op) {
      case '+': answer = a + b; break;
      case '-':
        // Ensure positive result
        const larger = Math.max(a, b);
        const smaller = Math.min(a, b);
        answer = larger - smaller;
        this.currentProblem = { a: larger, b: smaller, op };
        displayOp = '-';
        break;
      case '*':
        // Use smaller numbers for multiplication
        const m1 = Math.floor(Math.random() * 12) + 2;
        const m2 = Math.floor(Math.random() * 12) + 2;
        answer = m1 * m2;
        this.currentProblem = { a: m1, b: m2, op };
        displayOp = '\u00d7';
        break;
    }

    if (op !== '-' && op !== '*') {
      this.currentProblem = { a, b, op };
    }

    this.correctAnswer = answer;
    this.problemNumber++;
    this.problemStartTime = Date.now();

    // Broadcast to opponent
    if (this.wsClient) {
      this.wsClient.send({
        type: 'quick_calc_problem',
        matchNumber: this.matchInfo.matchNumber,
        problem: this.currentProblem,
        answer: this.correctAnswer,
        problemNumber: this.problemNumber
      });
    }

    this._render();
    this._startTimeout();
  }

  /**
   * Receive a problem from host
   */
  _receiveProblem(message) {
    if (this.isHost) return; // Host generates problems

    this.currentProblem = message.problem;
    this.correctAnswer = message.answer;
    this.problemNumber = message.problemNumber;
    this.problemStartTime = Date.now();

    this._render();
    this._startTimeout();

    this.answerInput.focus();
  }

  /**
   * Start timeout timer for current problem
   */
  _startTimeout() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }

    this.timeoutTimer = setTimeout(() => {
      // Problem timed out - generate new one
      if (this.isHost && this.isRunning) {
        this._generateAndBroadcastProblem();
      }
    }, this.config.timeoutMs);
  }

  /**
   * Submit an answer
   */
  _submitAnswer() {
    if (!this.isRunning || !this.currentProblem) return;

    const team = this.isHost ? 'blue' : 'red';

    // Check lockout
    const now = Date.now();
    if (team === 'blue' && this.blueLockedUntil > now) {
      return; // Still locked
    }
    if (team === 'red' && this.redLockedUntil > now) {
      return;
    }

    const answer = parseInt(this.answerInput.value, 10);
    this.answerInput.value = '';

    if (isNaN(answer)) return;

    // Broadcast answer attempt
    if (this.wsClient) {
      this.wsClient.send({
        type: 'quick_calc_answer',
        matchNumber: this.matchInfo.matchNumber,
        team,
        answer,
        problemNumber: this.problemNumber
      });
    }

    // Check locally
    if (answer === this.correctAnswer) {
      this._scorePoint(team);
    } else {
      this._applyLockout(team);
    }
  }

  /**
   * Receive an answer from opponent
   */
  _receiveAnswer(message) {
    if (message.problemNumber !== this.problemNumber) return;

    if (message.answer === this.correctAnswer) {
      this._scorePoint(message.team);
    } else {
      this._applyLockout(message.team);
    }
  }

  /**
   * Score a point for a team
   */
  _scorePoint(team) {
    if (team === 'blue') {
      this.blueScore++;
    } else {
      this.redScore++;
    }

    this._updateScoreDisplay();

    // Broadcast
    if (this.wsClient) {
      this.wsClient.send({
        type: 'quick_calc_point',
        matchNumber: this.matchInfo.matchNumber,
        team,
        blueScore: this.blueScore,
        redScore: this.redScore
      });
    }

    // Check for win
    if (this.blueScore >= this.config.pointsToWin || this.redScore >= this.config.pointsToWin) {
      this.stop();
      const winner = this.blueScore >= this.config.pointsToWin ? 'blue' : 'red';
      if (this.onMatchEnd) {
        this.onMatchEnd(winner, this.blueScore, this.redScore);
      }
    } else if (this.isHost) {
      // Generate next problem
      setTimeout(() => {
        this._generateAndBroadcastProblem();
      }, 500);
    }
  }

  /**
   * Receive point notification
   */
  _receivePoint(message) {
    this.blueScore = message.blueScore;
    this.redScore = message.redScore;
    this._updateScoreDisplay();

    if (this.blueScore >= this.config.pointsToWin || this.redScore >= this.config.pointsToWin) {
      this.stop();
      const winner = this.blueScore >= this.config.pointsToWin ? 'blue' : 'red';
      if (this.onMatchEnd) {
        this.onMatchEnd(winner, this.blueScore, this.redScore);
      }
    }
  }

  /**
   * Apply lockout to a team
   */
  _applyLockout(team) {
    const lockUntil = Date.now() + this.config.lockoutMs;

    if (team === 'blue') {
      this.blueLockedUntil = lockUntil;
      this.blueLocked = true;
    } else {
      this.redLockedUntil = lockUntil;
      this.redLocked = true;
    }

    // Update input styling
    if ((team === 'blue' && this.isHost) || (team === 'red' && !this.isHost)) {
      this.answerInput.classList.add('locked');
      setTimeout(() => {
        this.answerInput.classList.remove('locked');
        if (team === 'blue') this.blueLocked = false;
        else this.redLocked = false;
      }, this.config.lockoutMs);
    }

    // Broadcast
    if (this.wsClient) {
      this.wsClient.send({
        type: 'quick_calc_lockout',
        matchNumber: this.matchInfo.matchNumber,
        team
      });
    }

    this._render();
  }

  /**
   * Receive lockout notification
   */
  _receiveLockout(message) {
    const lockUntil = Date.now() + this.config.lockoutMs;

    if (message.team === 'blue') {
      this.blueLockedUntil = lockUntil;
      this.blueLocked = true;
      setTimeout(() => { this.blueLocked = false; this._render(); }, this.config.lockoutMs);
    } else {
      this.redLockedUntil = lockUntil;
      this.redLocked = true;
      setTimeout(() => { this.redLocked = false; this._render(); }, this.config.lockoutMs);
    }

    this._render();
  }

  /**
   * Update score display
   */
  _updateScoreDisplay() {
    const blueEl = this.container.querySelector('#qc-blue-score');
    const redEl = this.container.querySelector('#qc-red-score');
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

    // Clear
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    if (!this.currentProblem) {
      // Waiting for problem
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Get Ready...', width / 2, height / 2);
      return;
    }

    // Draw problem
    const { a, b, op } = this.currentProblem;
    let displayOp = op;
    if (op === '*') displayOp = '\u00d7';

    ctx.fillStyle = colors.problem;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${a} ${displayOp} ${b} = ?`, width / 2, height / 2 - 20);

    // Draw timer bar
    const elapsed = Date.now() - this.problemStartTime;
    const remaining = Math.max(0, this.config.timeoutMs - elapsed);
    const progress = remaining / this.config.timeoutMs;

    const barWidth = width - 40;
    const barHeight = 8;
    const barX = 20;
    const barY = height - 30;

    ctx.fillStyle = '#374151';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = progress > 0.3 ? colors.timer : colors.incorrect;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Draw lockout indicators
    if (this.blueLocked) {
      ctx.fillStyle = colors.lockout;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('LOCKED', 20, 25);
    }

    if (this.redLocked) {
      ctx.fillStyle = colors.lockout;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('LOCKED', width - 20, 25);
    }

    // Request next frame for timer animation
    if (this.isRunning && remaining > 0) {
      requestAnimationFrame(() => this._render());
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
  }
}
