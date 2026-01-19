/**
 * KotH Canvas Renderer
 *
 * Renders the King of the Hill game state including:
 * - Central hill with control indicator
 * - Rolling totals as bar charts
 * - Banked time displays
 * - Session status overlay
 */

import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

export class KotHRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    // Config
    this.config = GAME_MODE_CONFIG.koth;
    this.colors = this.config.colors;

    // Overlay state
    this.warningMinutes = null;
    this.sessionStatus = 'idle';

    // Animation state
    this.hillGlowPhase = 0;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  /**
   * Set warning state for session ending soon
   */
  setWarningMinutes(minutes) {
    this.warningMinutes = minutes;
  }

  /**
   * Set session status for overlay rendering
   */
  setSessionStatus(status) {
    this.sessionStatus = status;
  }

  /**
   * Render the KotH game state
   */
  render(state) {
    const { ctx, width, height, colors } = this;

    // Update session status from state
    this.sessionStatus = state.sessionStatus || 'idle';

    // Clear
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate layout
    const padding = 15;
    const hillCenterX = width / 2;
    const hillCenterY = height / 2 - 10;
    const hillRadius = Math.min(40, (height - 80) / 2);

    // Draw rolling totals bars
    this._drawRollingBars(state, padding, hillCenterY + hillRadius + 20);

    // Draw banked time displays
    this._drawBankedTime(state, padding);

    // Draw central hill
    this._drawHill(state, hillCenterX, hillCenterY, hillRadius);

    // Draw session status indicator
    this._drawSessionIndicator();

    // Draw warning overlay if session ending soon
    if (this.warningMinutes !== null && this.sessionStatus === 'active') {
      this._drawWarningOverlay();
    }

    // Draw victory overlay if game is won
    if (state.winner) {
      this._drawVictoryOverlay(state.winner);
    }

    // Draw tiebreaker overlay if in tiebreaker mode
    if (this.sessionStatus === 'tiebreaker' && !state.winner) {
      this._drawTiebreakerOverlay();
    }

    // Update animation phase
    this.hillGlowPhase = (this.hillGlowPhase + 0.05) % (Math.PI * 2);
  }

  /**
   * Draw the central hill with control indicator
   */
  _drawHill(state, cx, cy, radius) {
    const { ctx, colors } = this;
    const holder = state.currentHillHolder;

    // Draw glow effect if someone controls the hill
    if (holder) {
      const glowColor = holder === 'blue' ? colors.blueGlow : colors.redGlow;
      const glowRadius = radius + 10 + Math.sin(this.hillGlowPhase) * 5;

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw hill base
    ctx.fillStyle = holder ? (holder === 'blue' ? colors.blue : colors.red) : colors.neutral;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw hill stroke
    ctx.strokeStyle = colors.hillStroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw crown/hill icon
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${radius * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2655', cx, cy); // Chess queen as hill icon

    // Draw "HILL" label below
    ctx.font = '10px sans-serif';
    ctx.fillText('HILL', cx, cy + radius + 12);

    // Draw holder label
    if (holder) {
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(holder.toUpperCase(), cx, cy - radius - 8);
    }
  }

  /**
   * Draw rolling totals as progress bars
   */
  _drawRollingBars(state, padding, y) {
    const { ctx, width, colors } = this;

    const barWidth = (width - padding * 3) / 2;
    const barHeight = 16;

    // Max for scaling (use max of both or minimum 20)
    const maxTotal = Math.max(20, state.blueRollingTotal || 0, state.redRollingTotal || 0);

    // Blue bar (left)
    const blueWidth = Math.max(0, (state.blueRollingTotal || 0) / maxTotal) * barWidth;
    ctx.fillStyle = '#1d4ed8'; // Dark blue background
    ctx.fillRect(padding, y, barWidth, barHeight);
    ctx.fillStyle = colors.blue;
    ctx.fillRect(padding, y, blueWidth, barHeight);

    // Blue label
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.blueRollingTotal || 0}`, padding + 5, y + barHeight / 2);

    // Red bar (right, fills from right to left)
    const redBarX = padding * 2 + barWidth;
    const redWidth = Math.max(0, (state.redRollingTotal || 0) / maxTotal) * barWidth;
    ctx.fillStyle = '#991b1b'; // Dark red background
    ctx.fillRect(redBarX, y, barWidth, barHeight);
    ctx.fillStyle = colors.red;
    ctx.fillRect(redBarX + barWidth - redWidth, y, redWidth, barHeight);

    // Red label
    ctx.textAlign = 'right';
    ctx.fillText(`${state.redRollingTotal || 0}`, redBarX + barWidth - 5, y + barHeight / 2);

    // Labels above bars
    ctx.fillStyle = colors.decayBar;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Rolling Points', padding, y - 5);
    ctx.textAlign = 'right';
    ctx.fillText('Rolling Points', width - padding, y - 5);
  }

  /**
   * Draw banked time displays
   */
  _drawBankedTime(state, padding) {
    const { ctx, width, colors } = this;

    const y = 15;

    // Blue banked time (left)
    ctx.fillStyle = colors.blue;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this._formatTime(state.blueBankedSeconds || 0), padding, y);

    ctx.fillStyle = colors.decayBar;
    ctx.font = '10px sans-serif';
    ctx.fillText('BLUE BANKED', padding, y + 22);

    // Red banked time (right)
    ctx.fillStyle = colors.red;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(this._formatTime(state.redBankedSeconds || 0), width - padding, y);

    ctx.fillStyle = colors.decayBar;
    ctx.font = '10px sans-serif';
    ctx.fillText('RED BANKED', width - padding, y + 22);
  }

  /**
   * Format seconds as MM:SS
   */
  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Draw session status indicator
   */
  _drawSessionIndicator() {
    const { ctx, width } = this;

    const statusColors = {
      idle: '#6b7280',
      scheduled: '#3b82f6',
      active: '#10b981',
      tiebreaker: '#f59e0b',
      ended: '#ef4444'
    };

    const color = statusColors[this.sessionStatus] || '#6b7280';

    // Status dot in center top
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(width / 2, 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw warning overlay for session ending soon
   */
  _drawWarningOverlay() {
    const { ctx, width, height } = this;

    const urgency = this.warningMinutes <= 1 ? 'danger' : 'warning';
    const borderColor = urgency === 'danger' ? '#ef4444' : '#f59e0b';

    // Pulsing effect
    const pulse = Math.sin(Date.now() / (urgency === 'danger' ? 200 : 500)) * 0.3 + 0.7;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.globalAlpha = pulse;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    ctx.globalAlpha = 1;
  }

  /**
   * Draw victory overlay
   */
  _drawVictoryOverlay(winner) {
    const { ctx, width, height, colors } = this;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = winner === 'blue' ? colors.blue : colors.red;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${winner.toUpperCase()} WINS!`, width / 2, height / 2);
  }

  /**
   * Draw tiebreaker overlay
   */
  _drawTiebreakerOverlay() {
    const { ctx, width, height } = this;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TIEBREAKER', width / 2, height / 2);
  }

  /**
   * Animate hill control change
   */
  animateHillChange(fromHolder, toHolder, state, duration = 500) {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Flash effect during transition
      if (progress < 0.5) {
        this.hillGlowPhase = Math.PI * progress * 4; // Rapid glow
      }

      this.render(state);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}
