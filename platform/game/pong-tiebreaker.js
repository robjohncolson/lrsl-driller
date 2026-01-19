/**
 * Pong Tiebreaker Game
 *
 * A minimal Pong implementation for CTF tiebreaker matches.
 * Blue player is authoritative for ball physics (host).
 */

import { CTF_CONFIG } from '../../shared/ctf.config.js';

export class PongTiebreaker {
  constructor(container, wsClient, matchInfo, onMatchEnd) {
    this.container = container;
    this.wsClient = wsClient;
    this.matchInfo = matchInfo; // { matchNumber, bluePlayer, redPlayer }
    this.onMatchEnd = onMatchEnd;

    // Canvas setup
    this.canvas = null;
    this.ctx = null;
    this.width = CTF_CONFIG.pongCanvasWidth;
    this.height = CTF_CONFIG.pongCanvasHeight;

    // Game state
    this.blueScore = 0;
    this.redScore = 0;
    this.pointsToWin = CTF_CONFIG.pongPointsToWin;
    this.isRunning = false;
    this.isHost = false; // Blue player is host

    // Paddle state
    this.paddleHeight = CTF_CONFIG.pongPaddleHeight;
    this.paddleWidth = CTF_CONFIG.pongPaddleWidth;
    this.paddleSpeed = CTF_CONFIG.pongPaddleSpeed;

    this.bluePaddle = {
      y: this.height / 2 - this.paddleHeight / 2,
      dy: 0
    };
    this.redPaddle = {
      y: this.height / 2 - this.paddleHeight / 2,
      dy: 0
    };

    // Ball state
    this.ballRadius = CTF_CONFIG.pongBallRadius;
    this.ballSpeed = CTF_CONFIG.pongBallSpeed;
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      dx: this.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
      dy: this.ballSpeed * (Math.random() - 0.5)
    };

    // Input state
    this.keysPressed = {};

    // Animation frame
    this.animationFrame = null;

    this._init();
  }

  _init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.cssText = `
      display: block;
      margin: 10px auto;
      background: #111827;
      border-radius: 4px;
    `;
    this.ctx = this.canvas.getContext('2d');

    // Create container HTML
    this.container.innerHTML = `
      <div class="pong-container">
        <div class="pong-header">
          <span class="pong-player blue">${this.matchInfo.bluePlayer || 'Blue'}</span>
          <span class="pong-score">
            <span id="pong-blue-score">0</span>
            <span> - </span>
            <span id="pong-red-score">0</span>
          </span>
          <span class="pong-player red">${this.matchInfo.redPlayer || 'Red'}</span>
        </div>
        <div id="pong-canvas-container"></div>
        <div class="pong-instructions">
          <p>Use W/S or Arrow keys to move your paddle</p>
          <p>First to ${this.pointsToWin} points wins!</p>
        </div>
      </div>
    `;

    // Insert canvas
    const canvasContainer = this.container.querySelector('#pong-canvas-container');
    canvasContainer.appendChild(this.canvas);

    // Add styles
    this._addStyles();

    // Setup input handlers
    this._setupInput();

    // Setup WebSocket handlers
    this._setupWebSocket();

    // Initial render
    this._render();
  }

  _addStyles() {
    if (document.getElementById('pong-styles')) return;

    const style = document.createElement('style');
    style.id = 'pong-styles';
    style.textContent = `
      .pong-container {
        background: #1f2937;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }

      .pong-header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-bottom: 10px;
      }

      .pong-player {
        font-weight: bold;
        padding: 4px 12px;
        border-radius: 4px;
      }

      .pong-player.blue { background: #3b82f6; color: white; }
      .pong-player.red { background: #ef4444; color: white; }

      .pong-score {
        font-size: 24px;
        font-weight: bold;
        color: white;
      }

      .pong-instructions {
        margin-top: 10px;
        color: #9ca3af;
        font-size: 12px;
      }

      .pong-instructions p {
        margin: 4px 0;
      }
    `;
    document.head.appendChild(style);
  }

  _setupInput() {
    // Keyboard input
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
    document.addEventListener('keyup', this._handleKeyUp.bind(this));

    // Touch input for mobile
    this.canvas.addEventListener('touchstart', this._handleTouch.bind(this));
    this.canvas.addEventListener('touchmove', this._handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this._handleTouchEnd.bind(this));
  }

  _handleKeyDown(e) {
    this.keysPressed[e.key] = true;
  }

  _handleKeyUp(e) {
    this.keysPressed[e.key] = false;
  }

  _handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const y = touch.clientY - rect.top;

    // Determine which paddle to move based on which side was touched
    const isLeftSide = touch.clientX - rect.left < this.width / 2;

    if (isLeftSide) {
      // Move blue paddle toward touch
      if (y < this.bluePaddle.y + this.paddleHeight / 2) {
        this.bluePaddle.dy = -this.paddleSpeed;
      } else {
        this.bluePaddle.dy = this.paddleSpeed;
      }
    } else {
      // Move red paddle toward touch
      if (y < this.redPaddle.y + this.paddleHeight / 2) {
        this.redPaddle.dy = -this.paddleSpeed;
      } else {
        this.redPaddle.dy = this.paddleSpeed;
      }
    }
  }

  _handleTouchEnd(e) {
    this.bluePaddle.dy = 0;
    this.redPaddle.dy = 0;
  }

  _setupWebSocket() {
    if (!this.wsClient) return;

    this.wsClient.onMessage((msg) => {
      if (msg.type === 'pong_paddle_update') {
        this._receivePaddleUpdate(msg);
      } else if (msg.type === 'pong_ball_sync') {
        this._receiveBallSync(msg);
      } else if (msg.type === 'pong_point_scored') {
        this._receivePointScored(msg);
      }
    });
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
    this._resetBall();
    this._gameLoop();
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Main game loop
   */
  _gameLoop() {
    if (!this.isRunning) return;

    this._update();
    this._render();

    this.animationFrame = requestAnimationFrame(this._gameLoop.bind(this));
  }

  /**
   * Update game state
   */
  _update() {
    // Update paddle positions from keyboard input
    this._updatePaddleInput();

    // Move paddles
    this.bluePaddle.y = Math.max(0,
      Math.min(this.height - this.paddleHeight,
        this.bluePaddle.y + this.bluePaddle.dy));
    this.redPaddle.y = Math.max(0,
      Math.min(this.height - this.paddleHeight,
        this.redPaddle.y + this.redPaddle.dy));

    // Only host updates ball physics
    if (this.isHost) {
      this._updateBall();
    }
  }

  _updatePaddleInput() {
    // Blue paddle: W/S or Arrow keys
    if (this.keysPressed['w'] || this.keysPressed['W'] || this.keysPressed['ArrowUp']) {
      this.bluePaddle.dy = -this.paddleSpeed;
    } else if (this.keysPressed['s'] || this.keysPressed['S'] || this.keysPressed['ArrowDown']) {
      this.bluePaddle.dy = this.paddleSpeed;
    } else if (!this.keysPressed) {
      this.bluePaddle.dy = 0;
    }

    // Send paddle update if moved
    if (this.bluePaddle.dy !== 0) {
      this._sendPaddleUpdate('blue', this.bluePaddle.y);
    }
  }

  _updateBall() {
    // Move ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Top/bottom collision
    if (this.ball.y - this.ballRadius <= 0 ||
        this.ball.y + this.ballRadius >= this.height) {
      this.ball.dy *= -1;
      this.ball.y = Math.max(this.ballRadius,
        Math.min(this.height - this.ballRadius, this.ball.y));
    }

    // Paddle collision
    // Blue paddle (left)
    if (this.ball.dx < 0 &&
        this.ball.x - this.ballRadius <= this.paddleWidth &&
        this.ball.y >= this.bluePaddle.y &&
        this.ball.y <= this.bluePaddle.y + this.paddleHeight) {
      this.ball.dx = Math.abs(this.ball.dx) * 1.05; // Speed up slightly
      this.ball.dy += (this.ball.y - (this.bluePaddle.y + this.paddleHeight / 2)) * 0.1;
      this.ball.x = this.paddleWidth + this.ballRadius;
    }

    // Red paddle (right)
    if (this.ball.dx > 0 &&
        this.ball.x + this.ballRadius >= this.width - this.paddleWidth &&
        this.ball.y >= this.redPaddle.y &&
        this.ball.y <= this.redPaddle.y + this.paddleHeight) {
      this.ball.dx = -Math.abs(this.ball.dx) * 1.05;
      this.ball.dy += (this.ball.y - (this.redPaddle.y + this.paddleHeight / 2)) * 0.1;
      this.ball.x = this.width - this.paddleWidth - this.ballRadius;
    }

    // Scoring
    if (this.ball.x < 0) {
      // Red scores
      this._scorePoint('red');
    } else if (this.ball.x > this.width) {
      // Blue scores
      this._scorePoint('blue');
    }

    // Sync ball position to other player
    this._sendBallSync();
  }

  _scorePoint(team) {
    if (team === 'blue') {
      this.blueScore++;
    } else {
      this.redScore++;
    }

    this._updateScoreDisplay();
    this._sendPointScored(team);

    // Check for win
    if (this.blueScore >= this.pointsToWin || this.redScore >= this.pointsToWin) {
      this.stop();
      const winner = this.blueScore >= this.pointsToWin ? 'blue' : 'red';
      if (this.onMatchEnd) {
        this.onMatchEnd(winner, this.blueScore, this.redScore);
      }
    } else {
      this._resetBall();
    }
  }

  _resetBall() {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.dx = this.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    this.ball.dy = this.ballSpeed * (Math.random() - 0.5);
  }

  _updateScoreDisplay() {
    const blueScoreEl = this.container.querySelector('#pong-blue-score');
    const redScoreEl = this.container.querySelector('#pong-red-score');
    if (blueScoreEl) blueScoreEl.textContent = this.blueScore;
    if (redScoreEl) redScoreEl.textContent = this.redScore;
  }

  /**
   * Render the game
   */
  _render() {
    const { ctx, width, height } = this;

    // Clear
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = CTF_CONFIG.colors.blue;
    ctx.fillRect(0, this.bluePaddle.y, this.paddleWidth, this.paddleHeight);

    ctx.fillStyle = CTF_CONFIG.colors.red;
    ctx.fillRect(width - this.paddleWidth, this.redPaddle.y,
      this.paddleWidth, this.paddleHeight);

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // WebSocket methods
  _sendPaddleUpdate(team, y) {
    if (!this.wsClient) return;
    this.wsClient.send({
      type: 'pong_paddle_update',
      matchNumber: this.matchInfo.matchNumber,
      team,
      y
    });
  }

  _receivePaddleUpdate(msg) {
    if (msg.team === 'blue') {
      this.bluePaddle.y = msg.y;
    } else {
      this.redPaddle.y = msg.y;
    }
  }

  _sendBallSync() {
    if (!this.wsClient || !this.isHost) return;
    this.wsClient.send({
      type: 'pong_ball_sync',
      matchNumber: this.matchInfo.matchNumber,
      ball: this.ball
    });
  }

  _receiveBallSync(msg) {
    if (this.isHost) return; // Host doesn't receive ball sync
    this.ball = { ...msg.ball };
  }

  _sendPointScored(team) {
    if (!this.wsClient) return;
    this.wsClient.send({
      type: 'pong_point_scored',
      matchNumber: this.matchInfo.matchNumber,
      team,
      blueScore: this.blueScore,
      redScore: this.redScore
    });
  }

  _receivePointScored(msg) {
    this.blueScore = msg.blueScore;
    this.redScore = msg.redScore;
    this._updateScoreDisplay();
    this._resetBall();

    // Check for win
    if (this.blueScore >= this.pointsToWin || this.redScore >= this.pointsToWin) {
      this.stop();
      const winner = this.blueScore >= this.pointsToWin ? 'blue' : 'red';
      if (this.onMatchEnd) {
        this.onMatchEnd(winner, this.blueScore, this.redScore);
      }
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    document.removeEventListener('keydown', this._handleKeyDown.bind(this));
    document.removeEventListener('keyup', this._handleKeyUp.bind(this));
  }
}
