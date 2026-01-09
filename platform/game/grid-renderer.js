/**
 * Grid Wars - Canvas-based Grid Renderer
 * Spectre/Battlezone aesthetic (early 90s wireframe)
 * v1.2: Removed contestation effects, enhanced direction chevron
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

    // Avatar wake trails: { username -> [{ x, y, timestamp }] }
    this.avatarWakes = {};
    // Last known avatar positions for direction tracking
    this.lastAvatarPositions = {};

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
   * Set territory ownership with extended data
   * v1.2: Removed contested_by (contestation system removed)
   * v1.2.1: Added ownerLastAnswer for visual dimming
   */
  setTerritory(x, y, owner, data = {}) {
    if (owner || data.node_type) {
      this.territories[`${x},${y}`] = {
        owner,
        color: owner ? this.getPlayerColor(owner) : null,
        strength: data.strength || 3,
        node_type: data.node_type || null,
        ownerLastAnswer: data.ownerLastAnswer || null  // v1.2.1
      };
    } else {
      delete this.territories[`${x},${y}`];
    }
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
    this.drawTerritories(ctx, now);

    // Draw resource nodes (unclaimed)
    this.drawResourceNodes(ctx, now);

    // Draw surge cell
    this.drawSurgeCell(ctx, now);

    // Draw grid lines
    this.drawGrid(ctx);

    // Draw avatar wake trails (before avatars)
    this.drawAvatarWakes(ctx, now);

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
   * Draw territories (filled cells) with strength-based and activity-based dimming
   * v1.2: Removed contestation flicker and warning border effects
   * v1.2.1: Added activity-based dimming (territories fade as owner becomes inactive)
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

      ctx.fillStyle = territory.color;
      ctx.globalAlpha = strengthOpacity * activityOpacity * 0.5; // Combined opacity

      ctx.fillRect(
        x * this.cellSize + 1,
        y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );

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
   * v1.2: Removed contested_by (contestation system removed)
   * v1.2.1: Added ownerLastAnswer for visual dimming
   */
  loadState(state) {
    if (state.territories) {
      this.territories = {};
      for (const t of state.territories) {
        this.setTerritory(t.x, t.y, t.owner, {
          strength: t.strength,
          node_type: t.node_type,
          ownerLastAnswer: t.ownerLastAnswer  // v1.2.1
        });
      }
    }
    if (state.players) {
      this.avatars = state.players;
    }
    if (state.surge) {
      this.setSurgeCell(state.surge.x, state.surge.y, state.surge.expiresIn);
    } else {
      this.surgeCell = null;
    }
  }
}

export default GridRenderer;
