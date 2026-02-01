/**
 * Ghost Orbits - Multiplayer Renderer
 *
 * Canvas-based renderer for multiplayer game state.
 * Renders server-authoritative snapshots for Ghost Orbits arena battles.
 *
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  background: '#e8e8e8',           // Light gray (was dark)
  gridLines: '#cccccc',            // Light gray grid (was dark)
  dotNeutral: '#ffffff',           // White neutral dots
  trailsRecord: '#b0b0b0',         // Gray records
  trailsRecordCenter: '#707070',   // Darker center
  textPrimary: '#222222',          // Dark text for light bg
  textSecondary: '#666666',        // Gray text
  arenaBorder: '#4488ff'           // Blue border
};

const GHOST_RADIUS = 12;  // Match single-player BASE_RADIUS
const DOT_RADIUS = 10;    // Match single-player

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Lighten a hex color by a percentage
 * @param {string} color - Hex color string
 * @param {number} percent - Amount to lighten (0-1)
 * @returns {string} Lightened hex color
 */
function lighten(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(255 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Darken a color by a percentage
 * @param {string} color - Hex color string
 * @param {number} percent - Amount to darken (0-1)
 * @returns {string} Darkened hex color
 */
function darken(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const factor = 1 - percent;
  const R = Math.max(0, Math.floor((num >> 16) * factor));
  const G = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * factor));
  const B = Math.max(0, Math.floor((num & 0x0000FF) * factor));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// ============================================================================
// MULTIPLAYER RENDERER
// ============================================================================

/**
 * MultiplayerRenderer - Canvas renderer for multiplayer game state
 */
export class MultiplayerRenderer {
  /**
   * Create a new multiplayer renderer
   * @param {HTMLElement} container - Container element for the canvas
   * @param {Object} [options] - Renderer options
   * @param {number} [options.arenaWidth] - Arena width in pixels
   * @param {number} [options.arenaHeight] - Arena height in pixels
   */
  constructor(container, options = {}) {
    this.container = container;
    this.arenaWidth = options.arenaWidth || 800;
    this.arenaHeight = options.arenaHeight || 800;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'multiplayer-arena-canvas';
    this.ctx = this.canvas.getContext('2d');

    // Track my player ID for highlighting
    this.myPlayerId = null;

    // Viewport scaling
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Initialize canvas
    this._initCanvas();

    // Bind resize handler
    this._boundResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._boundResize);

    // Append to container
    this.container.appendChild(this.canvas);
  }

  /**
   * Initialize canvas dimensions and styling
   * @private
   */
  _initCanvas() {
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '1';

    this._handleResize();
  }

  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas dimensions
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale context for high DPI
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Calculate scale to fit arena in viewport with padding
    const padding = 40;
    const scaleX = (rect.width - padding * 2) / this.arenaWidth;
    const scaleY = (rect.height - padding * 2) / this.arenaHeight;
    this.scale = Math.min(scaleX, scaleY);

    // Center the arena
    this.offsetX = (rect.width - this.arenaWidth * this.scale) / 2;
    this.offsetY = (rect.height - this.arenaHeight * this.scale) / 2;
  }

  /**
   * Set the local player ID for highlighting
   * @param {string} playerId - Local player's ID
   */
  setMyPlayerId(playerId) {
    this.myPlayerId = playerId;
  }

  /**
   * Set arena dimensions
   * @param {number} width - Arena width
   * @param {number} height - Arena height
   */
  setArenaDimensions(width, height) {
    this.arenaWidth = width;
    this.arenaHeight = height;
    this._handleResize();
  }

  /**
   * Main render method - renders a server snapshot
   * @param {Object} snapshot - Server game snapshot
   */
  render(snapshot) {
    if (!snapshot) return;

    const ctx = this.ctx;
    const rect = this.container.getBoundingClientRect();

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Save context and apply viewport transform
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Draw arena border
    this._drawArenaBorder();

    // Draw grid
    this._drawGrid();

    // Draw records (safe zones)
    if (snapshot.records) {
      this._drawRecords(snapshot.records);
    }

    // Draw dots
    if (snapshot.dots) {
      this._drawDots(snapshot.dots);
    }

    // Draw ghosts
    if (snapshot.ghosts) {
      this._drawGhosts(snapshot.ghosts);
    }

    // Restore context
    ctx.restore();
  }

  /**
   * Draw arena border
   * @private
   */
  _drawArenaBorder() {
    const ctx = this.ctx;

    ctx.strokeStyle = COLORS.arenaBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.arenaWidth, this.arenaHeight);
  }

  /**
   * Draw background grid
   * @private
   */
  _drawGrid() {
    const ctx = this.ctx;
    const gridSize = 40;

    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = COLORS.gridLines;
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = gridSize; x < this.arenaWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.arenaHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = gridSize; y < this.arenaHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.arenaWidth, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw record safe zones (flat 12-orbits style)
   * @param {Array} records - Array of record objects
   * @private
   */
  _drawRecords(records) {
    const ctx = this.ctx;

    for (const record of records) {
      const radius = record.radius || 70;

      // Flat gray fill (no gradient, no border - 12-orbits style)
      ctx.fillStyle = COLORS.trailsRecord;
      ctx.beginPath();
      ctx.arc(record.x, record.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Center dot: darker gray (12-orbits style)
      ctx.fillStyle = COLORS.trailsRecordCenter;
      ctx.beginPath();
      ctx.arc(record.x, record.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw territory dots (flat 12-orbits style)
   * @param {Array} dots - Array of dot objects
   * @private
   */
  _drawDots(dots) {
    const ctx = this.ctx;

    // Debug: Log first claimed dot color once per second
    if (!this._lastDotDebug || Date.now() - this._lastDotDebug > 2000) {
      const claimed = dots.filter(d => d.ownerId);
      if (claimed.length > 0) {
        console.log(`[Renderer] Drawing ${claimed.length} claimed dots. First dot color: "${claimed[0].ownerColor}", ownerId: "${claimed[0].ownerId}"`);
        this._lastDotDebug = Date.now();
      }
    }

    for (const dot of dots) {
      const isNeutral = !dot.ownerId;

      if (isNeutral) {
        // Neutral: white fill, NO border (12-orbits style)
        ctx.fillStyle = COLORS.dotNeutral;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Claimed: owner color with inner darker ring (12-orbits style)
        const fillColor = dot.ownerColor || COLORS.dotNeutral;

        // Outer fill (ghost color)
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring: 25% darker, slightly smaller radius
        ctx.strokeStyle = darken(fillColor, 0.25);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS - 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  /**
   * Update ghost trails - DISABLED (no trails in Trails mode style)
   * @param {Array} ghosts - Array of ghost objects
   * @private
   */
  _updateTrails(ghosts) {
    // No trails in multiplayer - matches single-player Trails mode style
    return;
  }

  /**
   * Draw ghost trails - DISABLED (no trails in Trails mode style)
   * @private
   */
  _drawTrails() {
    // No trails in multiplayer - matches single-player Trails mode style
    return;
  }

  /**
   * Draw all ghosts (flat 12-orbits style)
   * @param {Array} ghosts - Array of ghost objects
   * @private
   */
  _drawGhosts(ghosts) {
    const ctx = this.ctx;

    for (const ghost of ghosts) {
      const isMe = ghost.id === this.myPlayerId;
      const color = ghost.color || '#4488ff';
      const isOrbiting = ghost.isOrbiting || false;
      const isSpinning = ghost.isSpinning || false;
      const spinProgress = ghost.spinProgress || 0;

      // Calculate direction angle from velocity
      let dirAngle = 0;
      if (ghost.vx !== undefined && ghost.vy !== undefined) {
        if (ghost.vx !== 0 || ghost.vy !== 0) {
          dirAngle = Math.atan2(ghost.vy, ghost.vx);
        }
      }

      // Invulnerability effect: pulsing opacity
      if (ghost.invulnerable) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
      }

      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(dirAngle);

      // Spin animation: scale effect to simulate 3D flip
      let scaleX = 1;
      let scaleY = 1;
      if (isSpinning) {
        // Front flip effect: Y-scale oscillates to simulate rotation
        // cos gives: 1 -> 0 -> -1 -> 0 -> 1 over full rotation
        const flipAngle = spinProgress * Math.PI * 2;  // Full 360° rotation
        scaleY = Math.cos(flipAngle);
        // Prevent complete disappearance
        scaleY = scaleY >= 0 ? Math.max(0.1, scaleY) : Math.min(-0.1, scaleY);

        // Pop effect: slight size increase during spin
        const popScale = 1 + Math.sin(spinProgress * Math.PI) * 0.3;
        scaleX *= popScale;
        scaleY *= popScale;
      }

      ctx.scale(scaleX, scaleY);

      // Simple filled circle (no glow/gradient - 12-orbits style)
      // Darken color when "backside" is showing (negative scaleY)
      ctx.fillStyle = scaleY < 0 ? darken(color, 0.4) : color;
      ctx.beginPath();
      ctx.arc(0, 0, GHOST_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Direction arrow (heart-shaped, 12-orbits style)
      // Don't draw arrow when backside is showing
      if (scaleY > 0) {
        this._drawDirectionArrow(ctx, GHOST_RADIUS, isOrbiting);
      }

      ctx.restore();

      // "You" indicator ring for local player (outside transform)
      if (isMe) {
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, GHOST_RADIUS + 4, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.textPrimary;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Reset alpha
      ctx.globalAlpha = 1;

      // Draw username above ghost
      if (ghost.username) {
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Text shadow (light for dark text)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(ghost.username, ghost.x + 1, ghost.y - GHOST_RADIUS - 7);

        // Text (dark for light background)
        ctx.fillStyle = isMe ? COLORS.textPrimary : COLORS.textSecondary;
        ctx.fillText(ghost.username, ghost.x, ghost.y - GHOST_RADIUS - 8);
      }
    }
  }

  /**
   * Draw heart-shaped direction arrow (12-orbits style)
   * @param {CanvasRenderingContext2D} ctx - Canvas context (already translated/rotated)
   * @param {number} radius - Ghost radius
   * @param {boolean} isOrbiting - Whether ghost is in safe orbit
   * @private
   */
  _drawDirectionArrow(ctx, radius, isOrbiting) {
    const triangleSize = radius * 0.9;
    const triangleDist = radius * 0.1;
    const tipX = triangleDist + triangleSize;
    const backX = triangleDist - triangleSize * 0.4;
    const halfHeight = triangleSize * 0.5;
    const notchDepth = triangleSize * 0.35;

    ctx.beginPath();
    ctx.moveTo(tipX, 0);                           // Front tip
    ctx.lineTo(backX, -halfHeight);                // Top back corner
    // Curved back with heart-like notch
    ctx.quadraticCurveTo(backX + notchDepth, 0, backX, halfHeight);
    ctx.closePath();

    if (isOrbiting) {
      // Safe: OUTLINE arrow only
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Vulnerable: FILLED arrow
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  /**
   * Convert hex color to rgba string
   * @param {string} hex - Hex color string
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} RGBA color string
   * @private
   */
  _hexToRgba(hex, alpha) {
    if (!hex) return `rgba(68, 136, 255, ${alpha})`;

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(68, 136, 255, ${alpha})`;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Clean up resources
   */
  destroy() {
    window.removeEventListener('resize', this._boundResize);

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.ctx = null;
    this.canvas = null;
  }
}

export default MultiplayerRenderer;
