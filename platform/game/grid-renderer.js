/**
 * Grid Wars - Canvas-based Grid Renderer
 * Spectre/Battlezone aesthetic (early 90s wireframe)
 * v1.2: Removed contestation effects, enhanced direction chevron
 * v1.2.1: 3-layer canvas system for performance optimization
 * v1.3: Use config for dimming parameters
 */

import { GRID_WARS_CONFIG } from '../../shared/gridwars.config.js';

export class GridRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // v1.2.1: Create layered canvas system
    // Layer 1 (Static): Grid lines, territories - redraw on change only
    // Layer 2 (Dynamic): Avatars, wakes, pulses - redraw every frame
    // Layer 3 (UI): Hover highlight - redraw every frame
    this._createLayeredCanvases(canvas);

    // Grid dimensions - v2.2.1: Default to 8 (v1.6+ config) and validate
    this.gridSize = options.gridSize || 8;
    this.cellSize = options.cellSize || 30;

    // v2.2.1: Log initial dimensions for debugging
    console.log('[GridRenderer] constructor:', {
      gridSize: this.gridSize,
      cellSize: this.cellSize,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });

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
      surge: '#ffffff',
      nodeAmplifier: '#ff00ff',  // Magenta (all nodes are now power nodes)
      nodeBeacon: '#ff00ff',     // Same as amplifier (unified power nodes)
      nodeAnchor: '#ff00ff',     // Same as amplifier (unified power nodes)
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
    // v1.2: Removed contested_by from territories (contestation system removed)
    this.territories = {}; // { "x,y": { owner, strength, node_type } }
    this.avatars = [];     // [{ username, x, y, health, emoji, text }]
    this.resourceNodes = []; // [{ x, y, type, owner }]
    this.surgeCell = null;   // { x, y, expiresIn }

    // Player color assignments
    this.playerColors = {}; // { "username": colorIndex }
    this.nextColorIndex = 0;

    // Animation state
    this.animationFrame = 0;
    this.pulsingCells = []; // [{ x, y, startTime, duration, color }]

    // Hover state
    this.hoveredCell = null;

    // v2.2.1: Selected cell (persistent highlight, separate from hover)
    this.selectedCell = null;

    // Avatar wake trails: { username -> [{ x, y, timestamp }] }
    this.avatarWakes = {};
    // Last known avatar positions for direction tracking
    this.lastAvatarPositions = {};

    // v2.0: Presence dots mode (replaces moveable avatars)
    this._usePresenceDots = false;
    this._onlinePlayers = new Set(); // Set of usernames currently online

    // v2.2: Player colors and subcell summaries for mini-mosaic rendering
    this._playerColors = {};         // { username: "#FF3366" }
    this._subcellSummaries = {};     // { "d5": [[{owner, is_developed}, ...], ...] }

    // v1.2.1: Static layer dirty flag - redraw static layer when true
    this._staticDirty = true;

    // Resize handling
    this.resize();

    // Start render loop
    this.startRenderLoop();
  }

  /**
   * v1.2.1: Create layered canvas system for performance
   * Static layer only redraws on territory changes
   */
  _createLayeredCanvases(mainCanvas) {
    const parent = mainCanvas.parentElement;
    if (!parent) return;

    // Skip in test environment (no document.createElement with style support)
    if (typeof document === 'undefined' || !document.createElement) return;

    try {
      // Ensure parent has relative positioning for absolute canvas stacking
      if (typeof getComputedStyle !== 'undefined' && getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }

      // Create static layer (z-index: 1) - grid lines and territories
      this._staticCanvas = document.createElement('canvas');
      this._staticCanvas.style.cssText = 'position:absolute;top:0;left:0;z-index:1;pointer-events:none;';
      this._staticCtx = this._staticCanvas.getContext('2d');

      // Create dynamic layer (z-index: 2) - avatars, wakes, pulses
      this._dynamicCanvas = document.createElement('canvas');
      this._dynamicCanvas.style.cssText = 'position:absolute;top:0;left:0;z-index:2;pointer-events:none;';
      this._dynamicCtx = this._dynamicCanvas.getContext('2d');

      // Create UI layer (z-index: 3) - hover, pending claims
      this._uiCanvas = document.createElement('canvas');
      this._uiCanvas.style.cssText = 'position:absolute;top:0;left:0;z-index:3;pointer-events:none;';
      this._uiCtx = this._uiCanvas.getContext('2d');

      // Main canvas becomes the base (z-index: 0) - just background
      mainCanvas.style.cssText = 'position:absolute;top:0;left:0;z-index:0;';

      // Insert canvases
      parent.appendChild(this._staticCanvas);
      parent.appendChild(this._dynamicCanvas);
      parent.appendChild(this._uiCanvas);
    } catch (e) {
      // Silently fall back to single canvas in test environment
      console.warn('Layer canvas creation skipped:', e.message);
    }
  }

  /**
   * Resize canvas to fit container
   * v1.2.1: Also resizes all layer canvases
   * v2.2.1: Enhanced with minimum size guarantee and logging
   */
  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;

    // v2.2.3: Get container size, with fallback to 280 (explicit HTML dimensions)
    // Use clientWidth/Height if available, otherwise use 280px as the known container size
    const clientW = container.clientWidth;
    const clientH = container.clientHeight;
    const containerSize = (clientW > 0 && clientH > 0)
      ? Math.min(clientW, clientH)
      : 280;
    // v2.2.1: Ensure minimum size of 200px even if container reports smaller
    const size = Math.max(200, containerSize);

    // v2.2.1: Log resize for debugging
    console.log('[GridRenderer] resize:', {
      containerSize,
      size,
      clientW,
      clientH,
      gridSize: this.gridSize,
      calculatedCellSize: (size - 2) / this.gridSize
    });

    // Skip if somehow still too small (shouldn't happen with 200px minimum)
    if (size < 50) {
      console.warn('[GridRenderer] resize: size too small, skipping', size);
      return;
    }

    // Set canvas size (accounting for device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1;

    // Helper to resize a canvas
    const resizeCanvas = (canvas, ctx) => {
      if (!canvas) return;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(dpr, dpr);
    };

    // Resize main canvas
    resizeCanvas(this.canvas, this.ctx);

    // v1.2.1: Resize layer canvases
    resizeCanvas(this._staticCanvas, this._staticCtx);
    resizeCanvas(this._dynamicCanvas, this._dynamicCtx);
    resizeCanvas(this._uiCanvas, this._uiCtx);

    // Recalculate cell size (ensure positive)
    this.cellSize = Math.max(1, (size - 2) / this.gridSize);
    this.displaySize = size;

    // v1.2.1: Mark static layer as dirty after resize
    this._staticDirty = true;
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
   * Set territory ownership with extended data
   * v1.2: Removed contested_by (contestation system removed)
   * v1.2.1: Added ownerLastAnswer for visual dimming, pending for claim status
   * v1.2.1: Sets static dirty flag for layer optimization
   */
  setTerritory(x, y, owner, data = {}) {
    if (owner || data.node_type || data.is_developed) {
      this.territories[`${x},${y}`] = {
        owner,
        // v2.2.3: Use server-assigned colors (via _playerColors) instead of auto-assigned
        color: owner ? this.getServerPlayerColor(owner) : null,
        strength: data.strength || 3,
        node_type: data.node_type || null,
        ownerLastAnswer: data.ownerLastAnswer || null,  // v1.2.1
        pending: data.pending || false,  // v1.2.1: Claim status
        isBountyTarget: data.isBountyTarget || false,  // v1.5
        // v2.0: Hierarchy fields
        address: data.address || null,
        is_developed: data.is_developed || false,
        cell_level: data.cell_level || 0
      };
    } else {
      delete this.territories[`${x},${y}`];
    }
    // v1.2.1: Mark static layer as dirty
    this._staticDirty = true;
  }

  /**
   * Set surge cell location
   */
  setSurgeCell(x, y, expiresIn) {
    if (x !== null && y !== null) {
      this.surgeCell = { x, y, expiresIn };
    } else {
      this.surgeCell = null;
    }
  }

  /**
   * Set avatar positions with wake tracking
   */
  setAvatars(avatars) {
    const now = performance.now();
    const newAvatars = avatars || [];

    // Track movement for wake trails
    for (const avatar of newAvatars) {
      const key = avatar.username;
      const lastPos = this.lastAvatarPositions[key];

      if (lastPos && (lastPos.x !== avatar.x || lastPos.y !== avatar.y)) {
        // Avatar moved - add previous position to wake trail
        if (!this.avatarWakes[key]) {
          this.avatarWakes[key] = [];
        }
        this.avatarWakes[key].unshift({ x: lastPos.x, y: lastPos.y, timestamp: now });
        // Keep only last 3 wake positions
        this.avatarWakes[key] = this.avatarWakes[key].slice(0, 3);

        // Store direction of movement
        avatar.direction = this.getDirection(lastPos.x, lastPos.y, avatar.x, avatar.y);
      } else if (lastPos) {
        // Keep previous direction
        avatar.direction = lastPos.direction;
      }

      // Update last known position
      this.lastAvatarPositions[key] = {
        x: avatar.x,
        y: avatar.y,
        direction: avatar.direction || 'right'
      };
    }

    this.avatars = newAvatars;
  }

  /**
   * Get direction of movement
   */
  getDirection(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
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
   * v2.2.1: Set selected cell (persistent highlight)
   */
  setSelectedCell(x, y) {
    this.selectedCell = (x !== null && y !== null) ? { x, y } : null;
    // Force redraw to show selection
    this._staticDirty = true;
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
   * v1.2.1: Uses 3-layer canvas system for performance
   * - Static layer: Grid, territories (redraw only when dirty)
   * - Dynamic layer: Avatars, wakes, pulses (redraw every frame)
   * - UI layer: Hover (redraw every frame)
   * v2.2.1: Added diagnostic checks for grid sizing issues
   */
  render() {
    // v2.2.1: Enhanced skip logic with warning
    if (this.cellSize < 1 || this.displaySize < 10) {
      // Only warn once per second to avoid console spam
      if (!this._lastRenderWarning || Date.now() - this._lastRenderWarning > 1000) {
        console.warn('[GridRenderer] render skipped: cellSize=', this.cellSize, 'displaySize=', this.displaySize);
        this._lastRenderWarning = Date.now();
      }
      return;
    }

    // v2.2.1: Sanity check - if grid seems wrong, log diagnostic
    const expectedGridPixels = this.gridSize * this.cellSize;
    if (expectedGridPixels < this.displaySize * 0.5 && !this._hasLoggedSizeWarning) {
      console.warn('[GridRenderer] Grid appears too small:', {
        gridSize: this.gridSize,
        cellSize: this.cellSize,
        expectedPixels: expectedGridPixels,
        displaySize: this.displaySize
      });
      this._hasLoggedSizeWarning = true;
    }

    const ctx = this.ctx;
    const now = performance.now();
    this.animationFrame++;

    // v1.2.1: Check if we have layer canvases (may not exist if parent wasn't ready)
    const hasLayers = this._staticCtx && this._dynamicCtx && this._uiCtx;

    if (hasLayers) {
      // === LAYERED RENDERING ===

      // Base layer: just background
      ctx.fillStyle = this.colors.void;
      ctx.fillRect(0, 0, this.displaySize, this.displaySize);

      // Static layer: Only redraw when dirty (territories changed)
      if (this._staticDirty) {
        const staticCtx = this._staticCtx;
        staticCtx.clearRect(0, 0, this.displaySize, this.displaySize);

        // Draw grid lines
        this.drawGrid(staticCtx);

        // Draw territories (without pending - those go on dynamic layer)
        this.drawTerritoriesStatic(staticCtx, now);

        // Draw resource nodes (unclaimed)
        this.drawResourceNodes(staticCtx, now);

        // Draw surge cell
        this.drawSurgeCell(staticCtx, now);

        this._staticDirty = false;
      }

      // Dynamic layer: Redraw every frame
      const dynamicCtx = this._dynamicCtx;
      dynamicCtx.clearRect(0, 0, this.displaySize, this.displaySize);

      // Draw pending territories (animated)
      this.drawTerritoriesPending(dynamicCtx, now);

      // v2.0: Draw presence dots instead of moveable avatars
      if (this._usePresenceDots) {
        this.drawOwnerPresence(dynamicCtx, now);
      } else {
        // Legacy: Draw avatar wake trails and avatars
        this.drawAvatarWakes(dynamicCtx, now);
        this.drawAvatars(dynamicCtx, now);
      }

      // Draw pulse animations
      this.drawPulses(dynamicCtx, now);

      // UI layer: Redraw every frame
      const uiCtx = this._uiCtx;
      uiCtx.clearRect(0, 0, this.displaySize, this.displaySize);

      // Draw hover highlight
      this.drawHover(uiCtx, now);

      // Scanlines on base layer
      this.drawScanlines(ctx);

    } else {
      // === FALLBACK: Single canvas rendering ===

      // Clear with void color
      ctx.fillStyle = this.colors.void;
      ctx.fillRect(0, 0, this.displaySize, this.displaySize);

      // Draw territories (background layer)
      this.drawTerritories(ctx, now);

      // Draw resource nodes (unclaimed)
      this.drawResourceNodes(ctx, now);

      // Draw surge cell
      this.drawSurgeCell(ctx, now);

      // Draw grid lines
      this.drawGrid(ctx);

      // v2.0: Draw presence dots instead of moveable avatars
      if (this._usePresenceDots) {
        this.drawOwnerPresence(ctx, now);
      } else {
        // Legacy: Draw avatar wake trails and avatars
        this.drawAvatarWakes(ctx, now);
        this.drawAvatars(ctx, now);
      }

      // Draw pulse animations
      this.drawPulses(ctx, now);

      // Draw hover highlight
      this.drawHover(ctx, now);

      // Draw scanlines for retro effect
      this.drawScanlines(ctx);
    }
  }

  /**
   * v1.2.1: Draw non-pending territories (for static layer)
   */
  drawTerritoriesStatic(ctx, now) {
    for (const [key, territory] of Object.entries(this.territories)) {
      // Skip pending territories (drawn on dynamic layer)
      if (territory.pending) continue;

      const [x, y] = key.split(',').map(Number);

      // Skip unclaimed resource nodes (drawn separately)
      if (territory.node_type && !territory.owner) continue;

      // Calculate opacity based on strength (3 = full, 1 = dim)
      const strengthOpacity = territory.strength ? territory.strength / 3 : 1;

      // Calculate activity-based dimming (v1.3: use config values)
      let activityOpacity = 1;
      if (territory.ownerLastAnswer) {
        const minutesSinceAnswer = (Date.now() - new Date(territory.ownerLastAnswer).getTime()) / 60000;
        const fadeMinutes = GRID_WARS_CONFIG.dimmingFadeMinutes || 15;
        const minOpacity = GRID_WARS_CONFIG.dimmingMinOpacity || 0.3;
        activityOpacity = Math.max(minOpacity, 1 - (minutesSinceAnswer / fadeMinutes) * (1 - minOpacity));
      }

      ctx.fillStyle = territory.color;
      ctx.globalAlpha = strengthOpacity * activityOpacity * 0.5;

      ctx.fillRect(
        x * this.cellSize + 1,
        y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );

      // v1.5: Draw bounty target glow (golden border, static version)
      if (territory.isBountyTarget) {
        ctx.strokeStyle = '#FFD700'; // Gold
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x * this.cellSize,
          y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
      }

      ctx.globalAlpha = 1;

      // Draw node indicator if claimed
      if (territory.node_type && territory.owner) {
        this.drawNodeIndicator(ctx, x, y, territory.node_type, now);
      }

      // v2.0: Draw developed cell indicator (subdivision icon)
      if (territory.is_developed) {
        this.drawDevelopedIndicator(ctx, x, y, now);
      }
    }
  }

  /**
   * v2.0: Draw developed cell indicator (shows cell is subdivided)
   * v2.2: Updated to show mini-mosaic of subcell ownership instead of just grid lines
   */
  drawDevelopedIndicator(ctx, x, y, now) {
    const territory = this.territories[`${x},${y}`];
    const address = territory?.address;

    // v2.2: If we have subcell summaries, draw a mini-mosaic
    if (address && this._subcellSummaries[address]) {
      this.drawMiniMosaic(ctx, x, y, address, now);
      return;
    }

    // Fallback to legacy indicator if no subcell data
    const centerX = x * this.cellSize + this.cellSize / 2;
    const centerY = y * this.cellSize + this.cellSize / 2;
    const size = this.cellSize - 8;
    const startX = centerX - size / 2;
    const startY = centerY - size / 2;

    // Draw mini 3x3 grid lines to suggest subdivision
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.lineWidth = 0.5;

    for (let i = 1; i < 3; i++) {
      const offset = (size / 3) * i;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(startX + offset, startY);
      ctx.lineTo(startX + offset, startY + size);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(startX, startY + offset);
      ctx.lineTo(startX + size, startY + offset);
      ctx.stroke();
    }

    // Draw pulsing zoom indicator in center
    const pulseOpacity = 0.5 + 0.3 * Math.sin(now / 500);
    ctx.fillStyle = `rgba(0, 255, 255, ${pulseOpacity})`;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', centerX, centerY);

    // Reset
    ctx.lineWidth = 1;
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  /**
   * v2.2: Draw mini-mosaic showing subcell ownership inside a developed cell
   * Shows an 8x8 grid of colored squares representing subcell ownership
   */
  drawMiniMosaic(ctx, cellX, cellY, address, now) {
    const summary = this._subcellSummaries[address];
    if (!summary) return;

    const px = cellX * this.cellSize + 1;
    const py = cellY * this.cellSize + 1;
    const cellSize = this.cellSize - 2;
    const miniSize = cellSize / 8;

    // Draw each subcell
    for (let my = 0; my < 8; my++) {
      for (let mx = 0; mx < 8; mx++) {
        const subcell = summary[my]?.[mx];
        const mpx = px + mx * miniSize;
        const mpy = py + my * miniSize;

        if (subcell?.is_developed && miniSize > 4) {
          // RECURSIVE: This subcell is ALSO developed
          // Draw a simplified pattern to indicate nested subdivision
          this.drawTinyMosaic(ctx, mpx, mpy, miniSize, subcell.owner);
        } else if (subcell?.owner) {
          // Draw colored square for owned subcell
          const color = this.getServerPlayerColor(subcell.owner);
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(mpx, mpy, miniSize, miniSize);
          ctx.globalAlpha = 1;
        } else {
          // Neutral subcell - dark background
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(mpx, mpy, miniSize, miniSize);
        }
      }
    }

    // Draw subtle grid lines between subcells
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 8; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(px + i * miniSize, py);
      ctx.lineTo(px + i * miniSize, py + cellSize);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(px, py + i * miniSize);
      ctx.lineTo(px + cellSize, py + i * miniSize);
      ctx.stroke();
    }

    // Draw border around the whole mosaic
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, cellSize, cellSize);

    ctx.lineWidth = 1;
  }

  /**
   * v2.2: Draw tiny mosaic pattern for deeply nested developed cells
   * Shows a simplified checkerboard pattern to indicate further subdivision
   */
  drawTinyMosaic(ctx, px, py, size, primaryOwner) {
    const baseColor = primaryOwner ? this.getServerPlayerColor(primaryOwner) : '#444';
    const darkColor = this.darkenColor(baseColor, 0.3);

    // Draw 4x4 checkerboard pattern to indicate subdivision
    const tinySize = size / 4;
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const isEven = (tx + ty) % 2 === 0;
        ctx.fillStyle = isEven ? baseColor : darkColor;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(px + tx * tinySize, py + ty * tinySize, tinySize, tinySize);
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * v2.2: Darken a hex color by a given amount
   * @param {string} hex - Hex color (e.g. "#FF3366" or "#F36")
   * @param {number} amount - Amount to darken (0-1)
   * @returns {string} Darkened hex color
   */
  darkenColor(hex, amount) {
    // Handle short hex format
    let color = hex.replace('#', '');
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }

    const num = parseInt(color, 16);
    const r = Math.max(0, (num >> 16) - Math.floor(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.floor(255 * amount));
    const b = Math.max(0, (num & 0x0000FF) - Math.floor(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * v1.2.1: Draw pending territories with animation (for dynamic layer)
   */
  drawTerritoriesPending(ctx, now) {
    for (const [key, territory] of Object.entries(this.territories)) {
      // Only draw pending territories
      if (!territory.pending) continue;

      const [x, y] = key.split(',').map(Number);

      // Calculate opacity based on strength
      const strengthOpacity = territory.strength ? territory.strength / 3 : 1;

      // Fast pulse between 0.4 and 1.0 for pending claims
      const pendingOpacity = 0.7 + 0.3 * Math.sin(now / 100);

      ctx.fillStyle = territory.color;
      ctx.globalAlpha = strengthOpacity * pendingOpacity * 0.5;

      ctx.fillRect(
        x * this.cellSize + 1,
        y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );

      // Draw pending indicator border
      ctx.strokeStyle = territory.color;
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(now / 100);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(
        x * this.cellSize + 2,
        y * this.cellSize + 2,
        this.cellSize - 4,
        this.cellSize - 4
      );
      ctx.setLineDash([]);

      ctx.globalAlpha = 1;
    }
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
   * Draw territories (filled cells) with strength-based and activity-based dimming
   * v1.2: Removed contestation flicker and warning border effects
   * v1.2.1: Added activity-based dimming (territories fade as owner becomes inactive)
   * v1.2.1: Added pending claim pulsing effect
   */
  drawTerritories(ctx, now) {
    for (const [key, territory] of Object.entries(this.territories)) {
      const [x, y] = key.split(',').map(Number);

      // Skip unclaimed resource nodes (drawn separately)
      if (territory.node_type && !territory.owner) continue;

      // Calculate opacity based on strength (3 = full, 1 = dim)
      const strengthOpacity = territory.strength ? territory.strength / 3 : 1;

      // v1.2.1: Calculate activity-based dimming
      let activityOpacity = 1;
      if (territory.ownerLastAnswer) {
        const minutesSinceAnswer = (Date.now() - new Date(territory.ownerLastAnswer).getTime()) / 60000;
        // Linear fade: 100% at 0min -> 30% at 15min
        const fadeMinutes = 15;
        const minOpacity = 0.3;
        activityOpacity = Math.max(minOpacity, 1 - (minutesSinceAnswer / fadeMinutes) * (1 - minOpacity));
      }

      // v1.2.1: Pending claim pulsing effect
      let pendingOpacity = 1;
      if (territory.pending) {
        // Fast pulse between 0.4 and 1.0 for pending claims
        pendingOpacity = 0.7 + 0.3 * Math.sin(now / 100);
      }

      ctx.fillStyle = territory.color;
      ctx.globalAlpha = strengthOpacity * activityOpacity * pendingOpacity * 0.5; // Combined opacity

      ctx.fillRect(
        x * this.cellSize + 1,
        y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );

      // v1.2.1: Draw pending indicator border
      if (territory.pending) {
        ctx.strokeStyle = territory.color;
        ctx.globalAlpha = 0.8 + 0.2 * Math.sin(now / 100);
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(
          x * this.cellSize + 2,
          y * this.cellSize + 2,
          this.cellSize - 4,
          this.cellSize - 4
        );
        ctx.setLineDash([]);
      }

      // v1.5: Draw bounty target glow (golden pulsing border)
      if (territory.isBountyTarget) {
        const glowIntensity = 0.5 + 0.3 * Math.sin(now / 300); // Slow pulse
        ctx.strokeStyle = '#FFD700'; // Gold
        ctx.globalAlpha = glowIntensity;
        ctx.lineWidth = 3;
        ctx.strokeRect(
          x * this.cellSize,
          y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
      }

      ctx.globalAlpha = 1;

      // Draw node indicator if claimed
      if (territory.node_type && territory.owner) {
        this.drawNodeIndicator(ctx, x, y, territory.node_type, now);
      }
    }
  }

  /**
   * Draw unclaimed resource nodes
   */
  drawResourceNodes(ctx, now) {
    for (const [key, territory] of Object.entries(this.territories)) {
      if (!territory.node_type || territory.owner) continue;

      const [x, y] = key.split(',').map(Number);
      const cx = x * this.cellSize + this.cellSize / 2;
      const cy = y * this.cellSize + this.cellSize / 2;

      // Get node color
      const nodeColor = this.colors[`node${territory.node_type.charAt(0).toUpperCase() + territory.node_type.slice(1)}`] || this.colors.cyan;

      // Pulsing effect
      const pulse = Math.sin(now / 500) * 0.3 + 0.7;
      const size = this.cellSize * 0.3;

      // Draw diamond shape
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);

      // Outer glow
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = pulse;
      ctx.strokeRect(-size, -size, size * 2, size * 2);

      // Inner fill
      ctx.fillStyle = nodeColor;
      ctx.globalAlpha = pulse * 0.3;
      ctx.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);

      ctx.restore();

      // Draw expanding ring
      const ringPhase = (now % 2000) / 2000;
      const ringSize = size + ringPhase * this.cellSize * 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, ringSize, 0, Math.PI * 2);
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = (1 - ringPhase) * 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Draw node indicator on claimed territory
   */
  drawNodeIndicator(ctx, x, y, nodeType, now) {
    const cx = x * this.cellSize + this.cellSize / 2;
    const cy = y * this.cellSize + this.cellSize / 2;
    const nodeColor = this.colors[`node${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`] || this.colors.cyan;

    // Small diamond icon
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = nodeColor;
    ctx.lineWidth = 1;
    const size = this.cellSize * 0.15;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  }

  /**
   * Draw surge cell with bright glow effect
   */
  drawSurgeCell(ctx, now) {
    if (!this.surgeCell) return;

    const { x, y } = this.surgeCell;
    const cx = x * this.cellSize + this.cellSize / 2;
    const cy = y * this.cellSize + this.cellSize / 2;

    // Bright white glow
    const pulse = Math.sin(now / 150) * 0.3 + 0.7;

    // Background glow
    ctx.fillStyle = this.colors.surge;
    ctx.globalAlpha = pulse * 0.4;
    ctx.fillRect(
      x * this.cellSize + 1,
      y * this.cellSize + 1,
      this.cellSize - 2,
      this.cellSize - 2
    );

    // Expanding/contracting ring
    const ringPhase = (now % 1000) / 1000;
    const ringSize = this.cellSize * 0.2 + Math.sin(ringPhase * Math.PI * 2) * this.cellSize * 0.15;

    ctx.beginPath();
    ctx.arc(cx, cy, ringSize, 0, Math.PI * 2);
    ctx.strokeStyle = this.colors.surge;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse;
    ctx.stroke();

    // Outer expanding ring
    const outerRingPhase = (now % 1500) / 1500;
    const outerRingSize = this.cellSize * 0.3 + outerRingPhase * this.cellSize * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRingSize, 0, Math.PI * 2);
    ctx.strokeStyle = this.colors.surge;
    ctx.lineWidth = 1;
    ctx.globalAlpha = (1 - outerRingPhase) * 0.6;
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  /**
   * Draw avatar wake trails (fading trail behind movement)
   */
  drawAvatarWakes(ctx, now) {
    const wakeDuration = 2000; // 2 seconds fade

    for (const [username, wake] of Object.entries(this.avatarWakes)) {
      const color = this.getPlayerSolidColor(username);

      wake.forEach((pos, i) => {
        const age = now - pos.timestamp;
        if (age > wakeDuration) return; // Skip expired wake positions

        // Calculate opacity based on position in trail and age
        // Position: 0 = most recent = brightest
        const positionOpacity = [0.6, 0.4, 0.2][i] || 0.1;
        const ageOpacity = 1 - (age / wakeDuration);
        const finalOpacity = positionOpacity * ageOpacity;

        if (finalOpacity <= 0) return;

        ctx.globalAlpha = finalOpacity;
        ctx.fillStyle = color;
        ctx.fillRect(
          pos.x * this.cellSize + 2,
          pos.y * this.cellSize + 2,
          this.cellSize - 4,
          this.cellSize - 4
        );
      });
    }

    ctx.globalAlpha = 1;

    // Clean up old wake entries
    for (const username of Object.keys(this.avatarWakes)) {
      this.avatarWakes[username] = this.avatarWakes[username].filter(
        pos => (now - pos.timestamp) < wakeDuration
      );
      if (this.avatarWakes[username].length === 0) {
        delete this.avatarWakes[username];
      }
    }
  }

  /**
   * Draw player avatars with diamond cursor style
   */
  drawAvatars(ctx, now) {
    for (const avatar of this.avatars) {
      const cx = avatar.x * this.cellSize + this.cellSize / 2;
      const cy = avatar.y * this.cellSize + this.cellSize / 2;
      const color = this.getPlayerSolidColor(avatar.username);
      const healthRatio = (avatar.health || 100) / 100;

      // Blink effect (800ms cycle, opacity 60% to 100%)
      const blink = 0.6 + 0.4 * Math.abs(Math.sin(now / 400));

      // Diamond size (1.5x cell size, so 0.7 radius from center)
      const size = this.cellSize * 0.7;

      ctx.save();

      // White diamond outline
      ctx.globalAlpha = blink;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size);           // Top
      ctx.lineTo(cx + size, cy);           // Right
      ctx.lineTo(cx, cy + size);           // Bottom
      ctx.lineTo(cx - size, cy);           // Left
      ctx.closePath();
      ctx.stroke();

      // Inner glow in player color
      ctx.globalAlpha = blink * 0.3;
      ctx.fillStyle = color;
      ctx.fill();

      // Direction indicator (chevron inside diamond)
      // v1.2: Enhanced - larger size and thicker lines for better visibility
      ctx.globalAlpha = blink;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;  // v1.2: was 1.5, now thicker
      ctx.lineCap = 'round';
      const chevronSize = size * 0.45;  // v1.2: was 0.3, now larger
      const direction = avatar.direction || 'right';

      ctx.beginPath();
      switch (direction) {
        case 'up':
          ctx.moveTo(cx - chevronSize, cy + chevronSize * 0.4);
          ctx.lineTo(cx, cy - chevronSize * 0.4);
          ctx.lineTo(cx + chevronSize, cy + chevronSize * 0.4);
          break;
        case 'down':
          ctx.moveTo(cx - chevronSize, cy - chevronSize * 0.4);
          ctx.lineTo(cx, cy + chevronSize * 0.4);
          ctx.lineTo(cx + chevronSize, cy - chevronSize * 0.4);
          break;
        case 'left':
          ctx.moveTo(cx + chevronSize * 0.4, cy - chevronSize);
          ctx.lineTo(cx - chevronSize * 0.4, cy);
          ctx.lineTo(cx + chevronSize * 0.4, cy + chevronSize);
          break;
        case 'right':
        default:
          ctx.moveTo(cx - chevronSize * 0.4, cy - chevronSize);
          ctx.lineTo(cx + chevronSize * 0.4, cy);
          ctx.lineTo(cx - chevronSize * 0.4, cy + chevronSize);
          break;
      }
      ctx.stroke();

      ctx.restore();

      // Health indicator - ring around diamond (only if damaged)
      if (healthRatio < 1) {
        const ringRadius = size + 4;
        const healthAngle = healthRatio * Math.PI * 2;

        // Background ring (dark)
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        // Health arc (colored by health level)
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, -Math.PI / 2, -Math.PI / 2 + healthAngle);
        ctx.strokeStyle = healthRatio > 0.5 ? '#00ff41' : healthRatio > 0.25 ? '#ffbf00' : '#ff3333';
        ctx.lineWidth = 2;
        ctx.globalAlpha = blink;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  // ============================================
  // v2.0: PRESENCE DOTS (replaces moveable avatars)
  // ============================================

  /**
   * v2.0: Enable/disable presence dots mode
   * When enabled, shows small dots on owned cells instead of moveable avatars
   * v2.1.2: Added logging
   */
  setUsePresenceDots(enabled) {
    this._usePresenceDots = enabled;
    console.log('[GridRenderer] setUsePresenceDots:', enabled);
  }

  /**
   * v2.0: Set the list of online players (for presence dots)
   * @param {string[]} players - Array of usernames currently online
   */
  setOnlinePlayers(players) {
    this._onlinePlayers = new Set(players || []);
  }

  /**
   * v2.2: Set player colors from server
   * @param {Object} colors - { username: "#FF3366" }
   */
  setPlayerColors(colors) {
    this._playerColors = colors || {};
    this._staticDirty = true;
  }

  /**
   * v2.2: Set subcell summaries for mini-mosaic rendering
   * @param {Object} summaries - { "d5": [[{owner, is_developed}, ...], ...] }
   */
  setSubcellSummaries(summaries) {
    this._subcellSummaries = summaries || {};
    this._staticDirty = true;
  }

  /**
   * v2.2: Get player color from server-assigned colors or fallback
   * @param {string} username
   * @returns {string} Hex color
   */
  getServerPlayerColor(username) {
    return this._playerColors[username] || this.getPlayerSolidColor(username);
  }

  /**
   * v2.0: Draw owner presence dots on cells owned by online players
   * Shows small green dot in bottom-right corner of each owned cell
   * v2.1.2: Fixed - extract x,y from key string instead of undefined cell properties
   */
  drawOwnerPresence(ctx, now) {
    const dotRadius = Math.max(3, this.cellSize * 0.12);
    const blink = 0.7 + 0.3 * Math.abs(Math.sin(now / 600)); // Slow pulse

    for (const [key, cell] of Object.entries(this.territories)) {
      if (!cell.owner) continue;
      if (!this._onlinePlayers.has(cell.owner)) continue;

      // v2.1.2: Extract x,y from key (format: "x,y")
      const [x, y] = key.split(',').map(Number);

      // Cell is owned by an online player - show presence dot
      const cx = x * this.cellSize + this.cellSize - dotRadius - 3;
      const cy = y * this.cellSize + this.cellSize - dotRadius - 3;
      // v2.2.3: Use server-assigned colors
      const color = this.getServerPlayerColor(cell.owner);

      ctx.save();
      ctx.globalAlpha = blink;

      // Outer glow
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius + 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = blink * 0.3;
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff41'; // Green for "online"
      ctx.globalAlpha = blink;
      ctx.fill();

      // White center
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = blink * 0.8;
      ctx.fill();

      ctx.restore();
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
   * Draw hover and selection highlights
   * v2.2.1: Added persistent selection highlight (cyan) separate from hover (white)
   */
  drawHover(ctx, now) {
    // v2.2.1: Draw selection highlight first (cyan, persistent)
    if (this.selectedCell) {
      const { x, y } = this.selectedCell;
      const pulse = 0.6 + 0.4 * Math.sin(now / 300);

      ctx.strokeStyle = '#00ffff'; // Cyan for selection
      ctx.lineWidth = 3;
      ctx.globalAlpha = pulse;
      ctx.strokeRect(
        x * this.cellSize + 2,
        y * this.cellSize + 2,
        this.cellSize - 4,
        this.cellSize - 4
      );
      ctx.globalAlpha = 1;
    }

    // Draw hover highlight (white, follows mouse)
    if (this.hoveredCell) {
      const { x, y } = this.hoveredCell;

      // Don't draw hover if it's the same as selection
      if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
        return;
      }

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
   * v1.2: Removed contested_by (contestation system removed)
   * v1.2.1: Added ownerLastAnswer for visual dimming, pending for claim status
   * v2.0: Added hierarchy fields (address, is_developed, cell_level)
   * v2.1.2: Added debug logging
   */
  loadState(state) {
    if (state.territories) {
      this.territories = {};
      for (const t of state.territories) {
        this.setTerritory(t.x, t.y, t.owner, {
          strength: t.strength,
          node_type: t.node_type,
          ownerLastAnswer: t.ownerLastAnswer,  // v1.2.1
          pending: t.pending,  // v1.2.1
          isBountyTarget: t.isBountyTarget,  // v1.5
          // v2.0: Hierarchy fields
          address: t.address,
          is_developed: t.is_developed,
          cell_level: t.cell_level
        });
      }
      // v2.1.2: Debug log
      const ownedCount = Object.values(this.territories).filter(t => t.owner).length;
      console.log('[GridRenderer] loadState:', {
        totalTerritories: Object.keys(this.territories).length,
        ownedTerritories: ownedCount,
        usePresenceDots: this._usePresenceDots
      });
    }
    if (state.players) {
      this.avatars = state.players;
    }
    if (state.surge) {
      this.setSurgeCell(state.surge.x, state.surge.y, state.surge.expiresIn);
    } else {
      this.surgeCell = null;
    }

    // v2.0: Store navigation state for renderer use
    this.currentLevel = state.currentLevel || 0;
    this.currentParent = state.currentParent || null;
    this.breadcrumb = state.breadcrumb || [];
  }
}

export default GridRenderer;
