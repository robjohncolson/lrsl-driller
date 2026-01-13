/**
 * Pong Renderer - Canvas rendering and sound effects
 * Draws the pong court, paddles, ball, scores, and overlays
 *
 * v1.0: Initial implementation
 */

import { PONG_CONFIG } from '../../shared/pong.config.js';

export class PongRenderer {
  constructor(canvas, options = {}) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = options.width || PONG_CONFIG.courtWidth;
    canvas.height = options.height || PONG_CONFIG.courtHeight;

    this._game = null;
    this._playerColors = {};
    this._isSpectator = options.isSpectator || false;

    // Animation
    this._lastTime = 0;
    this._animationId = null;

    // Audio context (lazy init)
    this._audioCtx = null;
  }

  /**
   * Set the game instance to render
   * @param {PongGame} game
   */
  setGame(game) {
    this._game = game;
  }

  /**
   * Set player colors for paddles
   * @param {Object} colors - { username: colorHex }
   */
  setPlayerColors(colors) {
    this._playerColors = colors;
  }

  /**
   * Initialize audio context (must be called from user gesture)
   */
  initAudio() {
    if (!this._audioCtx) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._audioCtx;
  }

  /**
   * Play a sound using oscillator
   * @param {string} soundName - 'hit', 'score', 'win', 'lose'
   */
  playSound(soundName) {
    if (!this._audioCtx) return;

    const config = PONG_CONFIG.sounds[soundName];
    if (!config) return;

    try {
      if (config.frequencies) {
        // Multi-tone sound (win/lose)
        config.frequencies.forEach((freq, i) => {
          const osc = this._audioCtx.createOscillator();
          const gain = this._audioCtx.createGain();

          osc.type = config.type || 'sine';
          osc.frequency.value = freq;

          gain.gain.setValueAtTime(0.3, this._audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this._audioCtx.currentTime + config.duration);

          osc.connect(gain);
          gain.connect(this._audioCtx.destination);

          const startTime = this._audioCtx.currentTime + (i * 0.1);
          osc.start(startTime);
          osc.stop(startTime + config.duration);
        });
      } else {
        // Single-tone sound (hit/score)
        const osc = this._audioCtx.createOscillator();
        const gain = this._audioCtx.createGain();

        osc.type = config.type || 'sine';
        osc.frequency.value = config.frequency;

        gain.gain.setValueAtTime(0.3, this._audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this._audioCtx.currentTime + config.duration);

        osc.connect(gain);
        gain.connect(this._audioCtx.destination);

        osc.start();
        osc.stop(this._audioCtx.currentTime + config.duration);
      }
    } catch (e) {
      // Ignore audio errors
    }
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    const loop = (timestamp) => {
      const deltaMs = timestamp - this._lastTime;
      this._lastTime = timestamp;

      // Update countdown if needed
      if (this._game) {
        this._game.updateCountdown(deltaMs);
      }

      this.render();
      this._animationId = requestAnimationFrame(loop);
    };

    this._animationId = requestAnimationFrame(loop);
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  /**
   * Main render function
   */
  render() {
    const ctx = this._ctx;
    const game = this._game;

    if (!game) {
      this._renderWaiting();
      return;
    }

    // Clear canvas
    ctx.fillStyle = PONG_CONFIG.colors.background;
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    // Draw center line
    this._drawCenterLine();

    // Draw paddles
    this._drawPaddle('attacker', game.paddles.attacker, PONG_CONFIG.paddleMargin);
    this._drawPaddle('defender', game.paddles.defender,
      PONG_CONFIG.courtWidth - PONG_CONFIG.paddleMargin - PONG_CONFIG.paddleWidth);

    // Draw ball
    this._drawBall(game.ball);

    // Draw score
    this._drawScore(game.score);

    // Draw timer
    this._drawTimer(game.timeRemaining);

    // Draw phase-specific overlays
    switch (game.phase) {
      case 'countdown':
        this._drawCountdown(game.countdownSeconds);
        break;
      case 'finished':
        this._drawResult(game.result);
        break;
    }

    // Draw spectator indicator
    if (this._isSpectator) {
      this._drawSpectatorBadge();
    }
  }

  /**
   * Render waiting state (no active game)
   */
  _renderWaiting() {
    const ctx = this._ctx;

    ctx.fillStyle = PONG_CONFIG.colors.background;
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.fillStyle = '#444';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Waiting for duel...', this._canvas.width / 2, this._canvas.height / 2);
  }

  /**
   * Draw center dotted line
   */
  _drawCenterLine() {
    const ctx = this._ctx;

    ctx.strokeStyle = PONG_CONFIG.colors.centerLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);

    ctx.beginPath();
    ctx.moveTo(this._canvas.width / 2, 0);
    ctx.lineTo(this._canvas.width / 2, this._canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * Draw a paddle with glow effect
   * @param {'attacker'|'defender'} side
   * @param {Object} paddle - { y, height }
   * @param {number} x - X position
   */
  _drawPaddle(side, paddle, x) {
    const ctx = this._ctx;
    const game = this._game;

    // Get player color
    const username = side === 'attacker' ? game?.attacker : game?.defender;
    const color = this._playerColors[username] || '#ffffff';

    // Draw paddle
    ctx.fillStyle = color;
    ctx.fillRect(x, paddle.y, PONG_CONFIG.paddleWidth, paddle.height);

    // Glow effect
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillRect(x, paddle.y, PONG_CONFIG.paddleWidth, paddle.height);
    ctx.restore();
  }

  /**
   * Draw the ball
   * @param {Object} ball - { x, y }
   */
  _drawBall(ball) {
    const ctx = this._ctx;

    ctx.fillStyle = PONG_CONFIG.colors.ball;
    ctx.beginPath();
    ctx.arc(
      ball.x + PONG_CONFIG.ballSize / 2,
      ball.y + PONG_CONFIG.ballSize / 2,
      PONG_CONFIG.ballSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Ball glow
    ctx.save();
    ctx.shadowColor = PONG_CONFIG.colors.ball;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw score display
   * @param {Object} score - { attacker, defender }
   */
  _drawScore(score) {
    const ctx = this._ctx;

    ctx.fillStyle = PONG_CONFIG.colors.scoreText;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Attacker score (left)
    ctx.fillText(score.attacker.toString(), this._canvas.width / 4, 20);

    // Defender score (right)
    ctx.fillText(score.defender.toString(), (this._canvas.width * 3) / 4, 20);
  }

  /**
   * Draw timer
   * @param {number} timeRemaining - Seconds remaining
   */
  _drawTimer(timeRemaining) {
    const ctx = this._ctx;

    const isWarning = timeRemaining <= 10;
    ctx.fillStyle = isWarning ? PONG_CONFIG.colors.timerWarning : PONG_CONFIG.colors.timerNormal;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.ceil(timeRemaining)}s`, this._canvas.width / 2, 10);
  }

  /**
   * Draw countdown overlay
   * @param {number} seconds - Seconds remaining in countdown
   */
  _drawCountdown(seconds) {
    const ctx = this._ctx;

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    // Countdown number
    ctx.fillStyle = PONG_CONFIG.colors.countdownText;
    ctx.font = 'bold 96px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayNum = Math.ceil(seconds);
    if (displayNum > 0) {
      ctx.fillText(displayNum.toString(), this._canvas.width / 2, this._canvas.height / 2);
    } else {
      ctx.fillText('GO!', this._canvas.width / 2, this._canvas.height / 2);
    }

    // Player names
    ctx.font = '18px monospace';
    ctx.fillStyle = this._playerColors[this._game?.attacker] || '#fff';
    ctx.fillText(this._game?.attacker || 'Attacker', this._canvas.width / 4, this._canvas.height - 50);

    ctx.fillStyle = this._playerColors[this._game?.defender] || '#fff';
    ctx.fillText(this._game?.defender || 'Defender', (this._canvas.width * 3) / 4, this._canvas.height - 50);

    // Territory at stake
    ctx.fillStyle = '#ffcc00';
    ctx.font = '14px monospace';
    ctx.fillText(`Fighting for: ${(this._game?.territory || '').toUpperCase()}`, this._canvas.width / 2, this._canvas.height - 20);
  }

  /**
   * Draw result overlay
   * @param {Object} result - Match result from server
   */
  _drawResult(result) {
    if (!result) return;

    const ctx = this._ctx;
    const game = this._game;
    const isWin = result.winner === game?.username;
    const isParticipant = game?.isParticipant();

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isParticipant) {
      if (isWin) {
        // Victory screen
        ctx.fillStyle = PONG_CONFIG.colors.victoryText;
        ctx.font = 'bold 56px monospace';
        ctx.fillText('VICTORY!', this._canvas.width / 2, this._canvas.height / 2 - 50);

        ctx.fillStyle = result.isAttackerWin ? '#ffcc00' : '#00ccff';
        ctx.font = '20px monospace';
        const message = result.isAttackerWin
          ? `You conquered ${result.territory.toUpperCase()}!`
          : `${result.territory.toUpperCase()} defended!`;
        ctx.fillText(message, this._canvas.width / 2, this._canvas.height / 2 + 10);
      } else {
        // Defeat screen
        ctx.fillStyle = PONG_CONFIG.colors.defeatText;
        ctx.font = 'bold 56px monospace';
        ctx.fillText('DEFEAT', this._canvas.width / 2, this._canvas.height / 2 - 50);

        ctx.fillStyle = '#888';
        ctx.font = '20px monospace';
        ctx.fillText(`${result.winner} wins`, this._canvas.width / 2, this._canvas.height / 2 + 10);

        // Consolation
        ctx.fillStyle = PONG_CONFIG.colors.consolationText;
        ctx.font = '18px monospace';
        ctx.fillText(`+${result.consolation} pts consolation`, this._canvas.width / 2, this._canvas.height / 2 + 45);
      }
    } else {
      // Spectator view
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('MATCH OVER', this._canvas.width / 2, this._canvas.height / 2 - 40);

      const winnerColor = this._playerColors[result.winner] || '#00ff00';
      ctx.fillStyle = winnerColor;
      ctx.font = '24px monospace';
      ctx.fillText(`${result.winner} wins!`, this._canvas.width / 2, this._canvas.height / 2 + 10);

      ctx.fillStyle = '#888';
      ctx.font = '16px monospace';
      ctx.fillText(`${result.score.attacker} - ${result.score.defender}`, this._canvas.width / 2, this._canvas.height / 2 + 45);
    }
  }

  /**
   * Draw spectator badge
   */
  _drawSpectatorBadge() {
    const ctx = this._ctx;

    ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
    ctx.fillRect(this._canvas.width - 90, 5, 85, 22);

    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('SPECTATING', this._canvas.width - 10, 10);
  }

  /**
   * Create a smaller spectator canvas
   * @returns {HTMLCanvasElement}
   */
  createSpectatorCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = PONG_CONFIG.spectatorWidth;
    canvas.height = PONG_CONFIG.spectatorHeight;
    return canvas;
  }

  /**
   * Render to a spectator-sized canvas
   * @param {HTMLCanvasElement} targetCanvas
   */
  renderToSpectatorCanvas(targetCanvas) {
    const ctx = targetCanvas.getContext('2d');

    // Scale down the main canvas to spectator size
    ctx.drawImage(
      this._canvas,
      0, 0, this._canvas.width, this._canvas.height,
      0, 0, targetCanvas.width, targetCanvas.height
    );
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopRenderLoop();

    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }
  }
}

export default PongRenderer;
