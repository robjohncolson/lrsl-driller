/**
 * Grid Wars - Canvas-based Grid Renderer
 * Spectre/Battlezone aesthetic (early 90s wireframe)
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
    this.structures = {};  // { "x,y": { type: "tower"|"farm"|"wall"|"castle", owner: "username" } }
    this.enemies = [];     // [{ x, y, hp }]
    this.centerCastle = { x: 10, y: 10 }; // Center of 20x20

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
    const size = Math.min(container.clientWidth, container.clientHeight, this.gridSize * this.cellSize + 2);

    // Set canvas size (accounting for device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(dpr, dpr);

    // Recalculate cell size
    this.cellSize = (size - 2) / this.gridSize;
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
   * Set structure at position
   */
  setStructure(x, y, type, owner) {
    if (type) {
      this.structures[`${x},${y}`] = { type, owner };
    } else {
      delete this.structures[`${x},${y}`];
    }
  }

  /**
   * Set enemy positions
   */
  setEnemies(enemies) {
    this.enemies = enemies;
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

    // Draw center castle
    this.drawCenterCastle(ctx, now);

    // Draw structures
    this.drawStructures(ctx, now);

    // Draw enemies
    this.drawEnemies(ctx, now);

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
   * Draw the center castle (objective)
   */
  drawCenterCastle(ctx, now) {
    const x = this.centerCastle.x;
    const y = this.centerCastle.y;
    const centerX = x * this.cellSize + this.cellSize / 2;
    const centerY = y * this.cellSize + this.cellSize / 2;

    // Pulsing glow
    const pulse = Math.sin(now / 500) * 0.3 + 0.7;

    // Outer glow
    ctx.fillStyle = `rgba(255, 191, 0, ${0.2 * pulse})`;
    ctx.fillRect(
      (x - 1) * this.cellSize,
      (y - 1) * this.cellSize,
      this.cellSize * 3,
      this.cellSize * 3
    );

    // Castle symbol (wireframe)
    ctx.strokeStyle = this.colors.amber;
    ctx.lineWidth = 2;

    const size = this.cellSize * 0.6;

    // Castle base
    ctx.beginPath();
    ctx.rect(centerX - size/2, centerY - size/2, size, size);
    ctx.stroke();

    // Castle towers (corners)
    const towerSize = size * 0.3;
    ctx.fillStyle = this.colors.amber;
    ctx.fillRect(centerX - size/2 - towerSize/4, centerY - size/2 - towerSize/4, towerSize, towerSize);
    ctx.fillRect(centerX + size/2 - towerSize + towerSize/4, centerY - size/2 - towerSize/4, towerSize, towerSize);
    ctx.fillRect(centerX - size/2 - towerSize/4, centerY + size/2 - towerSize + towerSize/4, towerSize, towerSize);
    ctx.fillRect(centerX + size/2 - towerSize + towerSize/4, centerY + size/2 - towerSize + towerSize/4, towerSize, towerSize);
  }

  /**
   * Draw structures (towers, farms, walls, castles)
   */
  drawStructures(ctx, now) {
    for (const [key, structure] of Object.entries(this.structures)) {
      const [x, y] = key.split(',').map(Number);
      const centerX = x * this.cellSize + this.cellSize / 2;
      const centerY = y * this.cellSize + this.cellSize / 2;
      const color = this.getPlayerSolidColor(structure.owner);

      switch (structure.type) {
        case 'tower':
          this.drawTower(ctx, centerX, centerY, color, now);
          break;
        case 'farm':
          this.drawFarm(ctx, centerX, centerY, color);
          break;
        case 'wall':
          this.drawWall(ctx, x, y, color);
          break;
        case 'castle':
          this.drawPlayerCastle(ctx, centerX, centerY, color, now);
          break;
      }
    }
  }

  /**
   * Draw a tower (triangle/pyramid shape)
   */
  drawTower(ctx, cx, cy, color, now) {
    const size = this.cellSize * 0.35;
    const pulse = Math.sin(now / 300) * 0.15 + 0.85;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Triangle pointing up
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx - size, cy + size * 0.7);
    ctx.lineTo(cx + size, cy + size * 0.7);
    ctx.closePath();
    ctx.stroke();

    // Glowing center dot
    ctx.fillStyle = color;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /**
   * Draw a farm (diamond shape)
   */
  drawFarm(ctx, cx, cy, color) {
    const size = this.cellSize * 0.3;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Diamond
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.stroke();

    // Inner dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw a wall segment
   */
  drawWall(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
      x * this.cellSize + this.cellSize * 0.2,
      y * this.cellSize + this.cellSize * 0.2,
      this.cellSize * 0.6,
      this.cellSize * 0.6
    );

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x * this.cellSize + this.cellSize * 0.15,
      y * this.cellSize + this.cellSize * 0.15,
      this.cellSize * 0.7,
      this.cellSize * 0.7
    );
  }

  /**
   * Draw a player's castle (larger structure)
   */
  drawPlayerCastle(ctx, cx, cy, color, now) {
    const size = this.cellSize * 0.4;
    const pulse = Math.sin(now / 400) * 0.2 + 0.8;

    // Outer square
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - size, cy - size, size * 2, size * 2);

    // Inner square
    ctx.strokeRect(cx - size * 0.5, cy - size * 0.5, size, size);

    // Corner dots
    ctx.fillStyle = color;
    ctx.globalAlpha = pulse;
    const dotSize = size * 0.2;
    ctx.fillRect(cx - size - dotSize/2, cy - size - dotSize/2, dotSize, dotSize);
    ctx.fillRect(cx + size - dotSize/2, cy - size - dotSize/2, dotSize, dotSize);
    ctx.fillRect(cx - size - dotSize/2, cy + size - dotSize/2, dotSize, dotSize);
    ctx.fillRect(cx + size - dotSize/2, cy + size - dotSize/2, dotSize, dotSize);
    ctx.globalAlpha = 1;
  }

  /**
   * Draw enemies
   */
  drawEnemies(ctx, now) {
    for (const enemy of this.enemies) {
      const cx = enemy.x * this.cellSize + this.cellSize / 2;
      const cy = enemy.y * this.cellSize + this.cellSize / 2;
      const size = this.cellSize * 0.35;

      // Pulsing effect
      const pulse = Math.sin(now / 200 + enemy.x + enemy.y) * 0.2 + 0.8;

      ctx.strokeStyle = this.colors.magenta;
      ctx.fillStyle = `rgba(255, 0, 255, ${0.3 * pulse})`;
      ctx.lineWidth = 2;

      // X shape for enemy
      ctx.beginPath();
      ctx.moveTo(cx - size, cy - size);
      ctx.lineTo(cx + size, cy + size);
      ctx.moveTo(cx + size, cy - size);
      ctx.lineTo(cx - size, cy + size);
      ctx.stroke();

      // Center glow
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
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
    if (state.structures) {
      this.structures = {};
      for (const s of state.structures) {
        this.setStructure(s.x, s.y, s.type, s.owner);
      }
    }
    if (state.enemies) {
      this.enemies = state.enemies;
    }
  }
}

export default GridRenderer;
