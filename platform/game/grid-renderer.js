/**
 * Grid Wars - Canvas-based Grid Renderer
 * Spectre/Battlezone aesthetic (early 90s wireframe)
 * Now with avatar display!
 */

export class GridRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Grid dimensions
    this.gridSize = options.gridSize || 20;
    this.cellSize = options.cellSize || 30;

    // Color palette (Spectre aesthetic)
    this.colors = {
      void: '#0a0a0a',
      gridDark: '#0d2818',
      gridLine: '#1a4a2a',
      gridBright: '#00ff41',
      cyan: '#00ffff',
      magenta: '#ff00ff',
      amber: '#ffbf00',
      white: '#ffffff',
      red: '#ff3333',
      // Territory colors (neon, semi-transparent)
      territories: [
        '#00ffff80', // cyan
        '#ff00ff80', // magenta
        '#ffbf0080', // amber
        '#00ff4180', // green
        '#ff668080', // pink
        '#8080ff80', // purple
        '#80ffff80', // light cyan
        '#ffff0080', // yellow
      ]
    };

    // Game state
    this.territories = {}; // { "x,y": { owner: "username", color: 0 } }
    this.avatars = [];     // [{ username, x, y, health, emoji, text }]

    // Player color assignments
    this.playerColors = {}; // { "username": colorIndex }
    this.nextColorIndex = 0;

    // Animation state
    this.animationFrame = 0;
    this.pulsingCells = []; // [{ x, y, startTime, duration, color }]

    // Hover state
    this.hoveredCell = null;

    // Resize handling
    this.resize();

    // Start render loop
    this.startRenderLoop();
  }

  /**
   * Resize canvas to fit container
   */
  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;

    // Get container size, ensuring minimum of 50px to avoid negative/zero calculations
    const containerSize = Math.max(50, Math.min(container.clientWidth, container.clientHeight));
    const size = Math.min(containerSize, this.gridSize * this.cellSize + 2);

    // Skip if container is hidden (size would be 0)
    if (size < 10) return;

    // Set canvas size (accounting for device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(dpr, dpr);

    // Recalculate cell size (ensure positive)
    this.cellSize = Math.max(1, (size - 2) / this.gridSize);
    this.displaySize = size;
  }

  /**
   * Get color for a player (assigns if new)
   */
  getPlayerColor(username) {
    if (!this.playerColors[username]) {
      this.playerColors[username] = this.nextColorIndex;
      this.nextColorIndex = (this.nextColorIndex + 1) % this.colors.territories.length;
    }
    return this.colors.territories[this.playerColors[username]];
  }

  /**
   * Get solid color for a player (for structures)
   */
  getPlayerSolidColor(username) {
    const color = this.getPlayerColor(username);
    return color.slice(0, 7); // Remove alpha
  }

  /**
   * Set territory ownership
   */
  setTerritory(x, y, owner) {
    if (owner) {
      this.territories[`${x},${y}`] = { owner, color: this.getPlayerColor(owner) };
    } else {
      delete this.territories[`${x},${y}`];
    }
  }

  /**
   * Set avatar positions
   */
  setAvatars(avatars) {
    this.avatars = avatars || [];
  }

  /**
   * Add a pulse animation to a cell
   */
  pulseCell(x, y, color = this.colors.gridBright, duration = 500) {
    this.pulsingCells.push({
      x, y,
      startTime: performance.now(),
      duration,
      color
    });
  }

  /**
   * Set hovered cell
   */
  setHoveredCell(x, y) {
    this.hoveredCell = x !== null ? { x, y } : null;
  }

  /**
   * Convert mouse position to grid coordinates
   */
  mouseToGrid(mouseX, mouseY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((mouseX - rect.left) / this.cellSize);
    const y = Math.floor((mouseY - rect.top) / this.cellSize);

    if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
      return { x, y };
    }
    return null;
  }

  /**
   * Main render function
   */
  render() {
    // Skip rendering if canvas is too small (hidden panel)
    if (this.cellSize < 1 || this.displaySize < 10) {
      return;
    }

    const ctx = this.ctx;
    const now = performance.now();
    this.animationFrame++;

    // Clear with void color
    ctx.fillStyle = this.colors.void;
    ctx.fillRect(0, 0, this.displaySize, this.displaySize);

    // Draw territories (background layer)
    this.drawTerritories(ctx);

    // Draw grid lines
    this.drawGrid(ctx);

    // Draw avatars
    this.drawAvatars(ctx, now);

    // Draw pulse animations
    this.drawPulses(ctx, now);

    // Draw hover highlight
    this.drawHover(ctx, now);

    // Draw scanlines for retro effect
    this.drawScanlines(ctx);
  }

  /**
   * Draw the base grid
   */
  drawGrid(ctx) {
    ctx.strokeStyle = this.colors.gridLine;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= this.gridSize; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.cellSize + 0.5, 0);
      ctx.lineTo(x * this.cellSize + 0.5, this.gridSize * this.cellSize);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.gridSize; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.cellSize + 0.5);
      ctx.lineTo(this.gridSize * this.cellSize, y * this.cellSize + 0.5);
      ctx.stroke();
    }

    // Draw corner markers for grid reference
    ctx.fillStyle = this.colors.gridBright;
    const markerSize = 3;
    // Top-left
    ctx.fillRect(0, 0, markerSize, markerSize);
    // Top-right
    ctx.fillRect(this.gridSize * this.cellSize - markerSize, 0, markerSize, markerSize);
    // Bottom-left
    ctx.fillRect(0, this.gridSize * this.cellSize - markerSize, markerSize, markerSize);
    // Bottom-right
    ctx.fillRect(this.gridSize * this.cellSize - markerSize, this.gridSize * this.cellSize - markerSize, markerSize, markerSize);
  }

  /**
   * Draw territories (filled cells)
   */
  drawTerritories(ctx) {
    for (const [key, territory] of Object.entries(this.territories)) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = territory.color;
      ctx.fillRect(
        x * this.cellSize + 1,
        y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );
    }
  }

  /**
   * Draw player avatars
   */
  drawAvatars(ctx, now) {
    for (const avatar of this.avatars) {
      const cx = avatar.x * this.cellSize + this.cellSize / 2;
      const cy = avatar.y * this.cellSize + this.cellSize / 2;
      const color = this.getPlayerSolidColor(avatar.username);

      // Pulsing effect based on health
      const healthRatio = (avatar.health || 100) / 100;
      const pulse = Math.sin(now / 400) * 0.15 + 0.85;

      // Draw avatar circle
      const radius = this.cellSize * 0.35;

      // Outer glow (health indicator)
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = healthRatio > 0.5 ? color : this.colors.red;
      ctx.lineWidth = 2;
      ctx.globalAlpha = pulse;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Inner circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw emoji if available
      if (avatar.emoji) {
        ctx.font = `${this.cellSize * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(avatar.emoji, cx, cy);
      }

      // Health bar below avatar
      if (healthRatio < 1) {
        const barWidth = this.cellSize * 0.7;
        const barHeight = 3;
        const barX = cx - barWidth / 2;
        const barY = cy + radius + 4;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        ctx.fillStyle = healthRatio > 0.5 ? '#00ff41' : healthRatio > 0.25 ? '#ffbf00' : '#ff3333';
        ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
      }
    }
  }

  /**
   * Draw pulse animations
   */
  drawPulses(ctx, now) {
    this.pulsingCells = this.pulsingCells.filter(pulse => {
      const elapsed = now - pulse.startTime;
      if (elapsed > pulse.duration) return false;

      const progress = elapsed / pulse.duration;
      const alpha = 1 - progress;
      const scale = 1 + progress * 0.5;

      const cx = pulse.x * this.cellSize + this.cellSize / 2;
      const cy = pulse.y * this.cellSize + this.cellSize / 2;
      const size = (this.cellSize / 2) * scale;

      ctx.strokeStyle = pulse.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha;
      ctx.strokeRect(cx - size, cy - size, size * 2, size * 2);
      ctx.globalAlpha = 1;

      return true;
    });
  }

  /**
   * Draw hover highlight
   */
  drawHover(ctx, now) {
    if (!this.hoveredCell) return;

    const { x, y } = this.hoveredCell;
    const pulse = Math.sin(now / 150) * 0.3 + 0.7;

    ctx.strokeStyle = this.colors.white;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse;
    ctx.strokeRect(
      x * this.cellSize + 2,
      y * this.cellSize + 2,
      this.cellSize - 4,
      this.cellSize - 4
    );
    ctx.globalAlpha = 1;
  }

  /**
   * Draw scanlines for retro CRT effect
   */
  drawScanlines(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < this.displaySize; y += 3) {
      ctx.fillRect(0, y, this.displaySize, 1);
    }
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    const loop = () => {
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  /**
   * Load full game state
   */
  loadState(state) {
    if (state.territories) {
      this.territories = {};
      for (const t of state.territories) {
        this.setTerritory(t.x, t.y, t.owner);
      }
    }
    if (state.players) {
      this.avatars = state.players;
    }
  }
}

export default GridRenderer;
