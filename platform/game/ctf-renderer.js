/**
 * CTF Canvas Renderer
 *
 * Draws the linear tug-of-war lane showing the front line position.
 * Includes session timer overlay and warning states.
 */

import { CTF_CONFIG } from '../../shared/ctf.config.js';

export class CTFRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    // Overlay state
    this.warningMinutes = null;
    this.sessionStatus = 'idle';

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
   * Render the CTF lane
   * v4.3.4: Uses dynamic pointsPerMove from state.config
   */
  render(state) {
    const { ctx, width, height } = this;
    const { frontPosition, winner, bluePoints, redPoints, sessionStatus, config } = state;
    // v4.3.4: Use dynamic pointsPerMove from state config, fallback to CTF_CONFIG
    const { colors, laneLength, blueFlag, redFlag } = CTF_CONFIG;
    const pointsPerMove = config?.pointsPerMove || CTF_CONFIG.pointsPerMove;

    // Update session status from state
    this.sessionStatus = sessionStatus || 'idle';

    // Clear
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate cell dimensions
    const padding = 10;
    const availableWidth = width - padding * 2;
    const cellWidth = availableWidth / laneLength;
    const cellHeight = Math.min(60, height - 40);
    const laneY = (height - cellHeight) / 2;

    // Draw cells
    for (let i = 0; i < laneLength; i++) {
      const x = padding + i * cellWidth;

      // Determine cell color
      let fillColor;
      if (i < frontPosition) {
        // Blue territory
        fillColor = colors.blue;
      } else if (i > frontPosition) {
        // Red territory
        fillColor = colors.red;
      } else {
        // Front line cell (contested)
        fillColor = colors.frontLine;
      }

      // Draw cell
      ctx.fillStyle = fillColor;
      ctx.fillRect(x + 1, laneY, cellWidth - 2, cellHeight);

      // Draw cell border
      ctx.strokeStyle = colors.background;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, laneY, cellWidth - 2, cellHeight);
    }

    // Draw flags
    this._drawFlag(padding + cellWidth / 2, laneY - 5, 'blue');
    this._drawFlag(padding + (laneLength - 0.5) * cellWidth, laneY - 5, 'red');

    // Draw front line marker
    const frontX = padding + frontPosition * cellWidth + cellWidth / 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(frontX, laneY - 10);
    ctx.lineTo(frontX, laneY + cellHeight + 10);
    ctx.stroke();

    // Draw progress bars under the lane
    const progressY = laneY + cellHeight + 15;
    const progressHeight = 8;
    const blueProgress = (bluePoints % pointsPerMove) / pointsPerMove;
    const redProgress = (redPoints % pointsPerMove) / pointsPerMove;

    // Blue progress (left side)
    const blueBarWidth = width / 2 - padding * 2;
    ctx.fillStyle = colors.blueDark;
    ctx.fillRect(padding, progressY, blueBarWidth, progressHeight);
    ctx.fillStyle = colors.blue;
    ctx.fillRect(padding, progressY, blueBarWidth * blueProgress, progressHeight);

    // Red progress (right side)
    const redBarX = width / 2 + padding;
    ctx.fillStyle = colors.redDark;
    ctx.fillRect(redBarX, progressY, blueBarWidth, progressHeight);
    ctx.fillStyle = colors.red;
    ctx.fillRect(redBarX + blueBarWidth * (1 - redProgress), progressY, blueBarWidth * redProgress, progressHeight);

    // Draw session status indicator (top left)
    this._drawSessionIndicator();

    // Draw warning overlay if session ending soon
    if (this.warningMinutes !== null && this.sessionStatus === 'active') {
      this._drawWarningOverlay();
    }

    // Draw victory overlay if game is won
    if (winner) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = winner === 'blue' ? colors.blue : colors.red;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${winner.toUpperCase()} WINS!`, width / 2, height / 2);
    }

    // Draw tiebreaker overlay if in tiebreaker mode
    if (this.sessionStatus === 'tiebreaker' && !winner) {
      this._drawTiebreakerOverlay();
    }
  }

  /**
   * Draw a flag icon
   */
  _drawFlag(x, y, team) {
    const { ctx } = this;
    const color = team === 'blue' ? CTF_CONFIG.colors.blue : CTF_CONFIG.colors.red;

    // Flag pole
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 20);
    ctx.stroke();

    // Flag
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + 12, y - 15);
    ctx.lineTo(x, y - 10);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw session status indicator
   */
  _drawSessionIndicator() {
    const { ctx, width } = this;

    // Session status badge in top-left
    const statusColors = {
      idle: '#6b7280',
      scheduled: '#3b82f6',
      active: '#10b981',
      tiebreaker: '#f59e0b',
      ended: '#ef4444'
    };

    const color = statusColors[this.sessionStatus] || '#6b7280';

    // Small status dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(15, 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw warning overlay for session ending soon
   */
  _drawWarningOverlay() {
    const { ctx, width, height } = this;

    // Pulsing border based on urgency
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
   * Draw tiebreaker overlay
   */
  _drawTiebreakerOverlay() {
    const { ctx, width, height } = this;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Tiebreaker text
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TIEBREAKER', width / 2, height / 2);
  }

  /**
   * Animate front line movement
   */
  animateFrontMove(fromPosition, toPosition, state, duration = 500) {
    const startTime = performance.now();
    const diff = toPosition - fromPosition;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      state.frontPosition = fromPosition + diff * eased;
      this.render(state);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        state.frontPosition = toPosition;
        this.render(state);
      }
    };

    requestAnimationFrame(animate);
  }
}
