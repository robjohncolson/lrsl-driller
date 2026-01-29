/**
 * Ghost Orbits Arena Renderer
 *
 * Canvas-based 2D renderer for the Ghost Orbits territory game.
 * Handles physics simulation, rendering, input, and trail system.
 *
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

// Arena sizing
const MIN_ARENA_SIZE = 800; // Increased from 600 for more maneuvering space
const MAX_ARENA_SIZE = 1400;
const SPACE_PER_PLAYER = 80;

// Physics
const THRUST_FORCE = 0.5;
const BASE_ENERGY_COST = 5;
const MAX_ENERGY = 100;
const ENERGY_REGEN_RATE = 8; // per second
const WALL_BOUNCE_VELOCITY_LOSS = 0.2;
const BASE_RADIUS = 10;
const FRICTION = 0.995; // Slight friction to prevent infinite acceleration

// Trail system
const TRAIL_SEGMENT_INTERVAL = 50; // ms between trail segments
const BASE_TRAIL_WIDTH = 3;
const BASE_TRAIL_DURATION = 5000; // ms before fade
const TRAIL_ALPHA = 0.6;

// Territory grid
const GRID_SIZE = 20; // pixels per cell

// Rendering
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

// Colors
const COLORS = {
  background: '#0a0a12',
  gridLines: '#112244',
  ghostTiers: [
    '#4488ff',  // Tier 0: Electric blue
    '#00ff88',  // Tier 1: Neon green
    '#ffdd00',  // Tier 2: Gold
    '#ff8844',  // Tier 3: Orange
    '#ff44ff',  // Tier 4: Magenta
  ],
  textPrimary: '#ffffff',
  textSecondary: '#88aacc'
};

// Input keys
const INPUT_KEYS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 }
};

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
 * Calculate distance between two points
 * @param {Object} a - First point {x, y}
 * @param {Object} b - Second point {x, y}
 * @returns {number} Distance
 */
function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 * @param {Object} v - Vector {x, y}
 * @returns {Object} Normalized vector
 */
function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Calculate arena size based on player count
 * @param {number} playerCount - Number of players
 * @returns {number} Arena size in pixels
 */
function calculateArenaSize(playerCount) {
  const baseSize = MIN_ARENA_SIZE + (playerCount - 1) * SPACE_PER_PLAYER;
  return Math.min(Math.max(baseSize, MIN_ARENA_SIZE), MAX_ARENA_SIZE);
}

// ============================================================================
// GHOST CLASS
// ============================================================================

/**
 * Ghost entity with physics and rendering properties
 */
class Ghost {
  /**
   * Create a new Ghost
   * @param {Object} options - Ghost options
   * @param {string} options.id - Unique identifier
   * @param {number} options.x - Initial X position
   * @param {number} options.y - Initial Y position
   * @param {string} options.color - Ghost color
   * @param {number} [options.tier=0] - Ghost tier (0-4)
   * @param {Object} [options.nnProperties] - Neural network derived properties
   * @param {Object} [options.pattern] - Fractal pattern from NN weights
   */
  constructor(options) {
    this.id = options.id;
    this.position = { x: options.x, y: options.y };

    // Random initial velocity for perpetual motion
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };

    this.color = options.color || COLORS.ghostTiers[options.tier || 0];
    this.tier = options.tier || 0;

    // NN-derived properties with defaults
    const nn = options.nnProperties || {};
    this.mass = nn.mass || 1.0;
    this.thrustEfficiency = nn.thrustEfficiency || 1.0;
    this.trailDuration = nn.trailDuration || 1.0;
    this.energyRegen = nn.energyRegen || 1.0;
    this.trailWidth = nn.trailWidth || 1.0;

    // Fractal pattern (visual DNA from NN weights)
    this.pattern = options.pattern || null;
    this.patternCanvas = null;
    if (this.pattern) {
      this._createPatternCanvas();
    }

    // Energy system
    this.energy = MAX_ENERGY;
    this.maxEnergy = MAX_ENERGY;

    // Trail timing
    this.lastTrailTime = 0;

    // Input state
    this.thrustDirection = { x: 0, y: 0 };
    this.isThrusting = false;

    // Flash effect (for hit feedback)
    this.flashColor = null;
    this.flashUntil = 0;
  }

  /**
   * Create a canvas texture from the fractal pattern
   * @private
   */
  _createPatternCanvas() {
    if (!this.pattern || typeof document === 'undefined') {
      console.log('[Ghost] No pattern to create canvas from');
      return;
    }

    console.log('[Ghost] Creating pattern canvas, size:', this.pattern.width, 'x', this.pattern.height);
    const canvas = document.createElement('canvas');
    canvas.width = this.pattern.width;
    canvas.height = this.pattern.height;
    const ctx = canvas.getContext('2d');

    // Create ImageData from pattern
    const imageData = new ImageData(
      new Uint8ClampedArray(this.pattern.data),
      this.pattern.width,
      this.pattern.height
    );
    ctx.putImageData(imageData, 0, 0);

    // Tint with ghost color
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.patternCanvas = canvas;
    console.log('[Ghost] Pattern canvas created successfully');
  }

  /**
   * Get the radius based on mass
   * @returns {number} Radius in pixels
   */
  get radius() {
    return BASE_RADIUS * this.mass;
  }

  /**
   * Apply thrust in a direction
   * @param {Object} direction - Direction vector {x, y}
   * @returns {boolean} Whether thrust was applied
   */
  applyThrust(direction) {
    const energyCost = BASE_ENERGY_COST / this.thrustEfficiency;

    if (this.energy >= energyCost) {
      const normalized = normalize(direction);
      const force = THRUST_FORCE * this.thrustEfficiency;

      this.velocity.x += normalized.x * force;
      this.velocity.y += normalized.y * force;
      this.energy -= energyCost;
      this.isThrusting = true;

      return true;
    }

    this.isThrusting = false;
    return false;
  }

  /**
   * Update energy regeneration
   * @param {number} deltaTime - Time since last update in seconds
   */
  updateEnergy(deltaTime) {
    const regenAmount = ENERGY_REGEN_RATE * this.energyRegen * deltaTime;
    this.energy = Math.min(this.energy + regenAmount, this.maxEnergy);
  }

  /**
   * Update position based on velocity
   * @param {number} deltaTime - Time since last update in seconds
   */
  updatePosition(deltaTime) {
    // Apply friction
    this.velocity.x *= FRICTION;
    this.velocity.y *= FRICTION;

    // Update position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  /**
   * Handle wall collision
   * @param {number} arenaSize - Size of the arena
   * @returns {boolean} Whether a collision occurred
   */
  handleWallCollision(arenaSize) {
    let collided = false;
    const radius = this.radius;

    // Left wall
    if (this.position.x - radius < 0) {
      this.position.x = radius;
      this.velocity.x = Math.abs(this.velocity.x) * (1 - WALL_BOUNCE_VELOCITY_LOSS);
      collided = true;
    }

    // Right wall
    if (this.position.x + radius > arenaSize) {
      this.position.x = arenaSize - radius;
      this.velocity.x = -Math.abs(this.velocity.x) * (1 - WALL_BOUNCE_VELOCITY_LOSS);
      collided = true;
    }

    // Top wall
    if (this.position.y - radius < 0) {
      this.position.y = radius;
      this.velocity.y = Math.abs(this.velocity.y) * (1 - WALL_BOUNCE_VELOCITY_LOSS);
      collided = true;
    }

    // Bottom wall
    if (this.position.y + radius > arenaSize) {
      this.position.y = arenaSize - radius;
      this.velocity.y = -Math.abs(this.velocity.y) * (1 - WALL_BOUNCE_VELOCITY_LOSS);
      collided = true;
    }

    return collided;
  }

  /**
   * Check if it's time to drop a trail segment
   * @param {number} currentTime - Current timestamp
   * @returns {boolean} Whether to drop a trail
   */
  shouldDropTrail(currentTime) {
    if (currentTime - this.lastTrailTime >= TRAIL_SEGMENT_INTERVAL) {
      this.lastTrailTime = currentTime;
      return true;
    }
    return false;
  }

  /**
   * Create a trail segment at current position
   * @returns {Object} Trail segment
   */
  createTrailSegment() {
    return {
      position: { x: this.position.x, y: this.position.y },
      color: this.color,
      width: BASE_TRAIL_WIDTH * this.trailWidth,
      createdAt: Date.now(),
      duration: BASE_TRAIL_DURATION * this.trailDuration,
      ownerId: this.id
    };
  }
}

// ============================================================================
// ARENA CLASS
// ============================================================================

/**
 * Arena manages the game space, trails, and territory
 */
class Arena {
  /**
   * Create a new Arena
   * @param {number} size - Arena size in pixels
   */
  constructor(size) {
    this.size = size;
    this.trails = [];

    // Territory grid
    this.gridWidth = Math.ceil(size / GRID_SIZE);
    this.gridHeight = Math.ceil(size / GRID_SIZE);
    this.grid = new Array(this.gridWidth * this.gridHeight).fill(null);

    // Territory coverage (0-1 per cell, per player)
    // Stores {playerId: coverage} for each cell
    this.gridCoverage = new Array(this.gridWidth * this.gridHeight).fill(null).map(() => ({}));
    this.lastTerritoryUpdate = Date.now();

    // Decay rate (% per second)
    this.TERRITORY_DECAY_RATE = 0.02; // 2% per second - takes 50 seconds to fully decay
  }

  /**
   * Resize the arena
   * @param {number} newSize - New size in pixels
   */
  resize(newSize) {
    this.size = newSize;
    this.gridWidth = Math.ceil(newSize / GRID_SIZE);
    this.gridHeight = Math.ceil(newSize / GRID_SIZE);
    this.grid = new Array(this.gridWidth * this.gridHeight).fill(null);
    this.gridCoverage = new Array(this.gridWidth * this.gridHeight).fill(null).map(() => ({}));
  }

  /**
   * Add a trail segment
   * @param {Object} segment - Trail segment
   */
  addTrail(segment) {
    this.trails.push(segment);
  }

  /**
   * Update trails - remove expired ones and update territory
   */
  updateTrails() {
    const now = Date.now();

    // Remove expired trails
    this.trails = this.trails.filter(segment => {
      const age = now - segment.createdAt;
      return age < segment.duration;
    });

    // Update territory grid
    this.updateTerritory();
  }

  /**
   * Update territory grid based on active trails with decay
   */
  updateTerritory() {
    const now = Date.now();
    const deltaTime = (now - this.lastTerritoryUpdate) / 1000; // seconds
    this.lastTerritoryUpdate = now;

    // Apply decay to all coverage values
    const decayAmount = this.TERRITORY_DECAY_RATE * deltaTime;
    for (let i = 0; i < this.gridCoverage.length; i++) {
      const cellCoverage = this.gridCoverage[i];
      for (const playerId of Object.keys(cellCoverage)) {
        cellCoverage[playerId] -= decayAmount;
        if (cellCoverage[playerId] <= 0.01) {
          delete cellCoverage[playerId];
        }
      }
    }

    // Active trails ADD coverage (refresh territory)
    for (const segment of this.trails) {
      if (now - segment.createdAt < segment.duration) {
        const cellX = Math.floor(segment.position.x / GRID_SIZE);
        const cellY = Math.floor(segment.position.y / GRID_SIZE);

        if (cellX >= 0 && cellX < this.gridWidth && cellY >= 0 && cellY < this.gridHeight) {
          const idx = cellY * this.gridWidth + cellX;
          const coverage = this.gridCoverage[idx];
          // Add coverage (trail refreshes territory)
          coverage[segment.ownerId] = Math.min(1.0, (coverage[segment.ownerId] || 0) + 0.1);
        }
      }
    }

    // Determine cell ownership (player with most coverage)
    for (let i = 0; i < this.grid.length; i++) {
      const cellCoverage = this.gridCoverage[i];
      let maxCoverage = 0;
      let owner = null;

      for (const [playerId, cov] of Object.entries(cellCoverage)) {
        if (cov > maxCoverage) {
          maxCoverage = cov;
          owner = playerId;
        }
      }

      this.grid[i] = owner;
    }
  }

  /**
   * Get territory percentage for a ghost
   * @param {string} ghostId - Ghost identifier
   * @returns {number} Percentage of territory owned (0-100)
   */
  getTerritoryPercent(ghostId) {
    const owned = this.grid.filter(cell => cell === ghostId).length;
    return (owned / this.grid.length) * 100;
  }

  /**
   * Get all territory percentages
   * @param {Array<Ghost>} ghosts - Array of ghosts
   * @returns {Map<string, number>} Map of ghost ID to territory percentage
   */
  getAllTerritoryPercents(ghosts) {
    const percents = new Map();
    for (const ghost of ghosts) {
      percents.set(ghost.id, this.getTerritoryPercent(ghost.id));
    }
    return percents;
  }

  /**
   * Get spawn positions distributed around the arena edges
   * @param {number} playerCount - Number of players
   * @returns {Array<Object>} Array of spawn positions
   */
  getSpawnPositions(playerCount) {
    const positions = [];
    const margin = this.size * 0.1;
    const radius = (this.size / 2) - margin;
    const centerX = this.size / 2;
    const centerY = this.size / 2;

    for (let i = 0; i < playerCount; i++) {
      const angle = (i / playerCount) * Math.PI * 2;
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }

    return positions;
  }
}

// ============================================================================
// GHOST ORBITS RENDERER CLASS
// ============================================================================

/**
 * Main renderer class for Ghost Orbits arena
 */
class GhostOrbitsRenderer {
  /**
   * Create a new GhostOrbitsRenderer
   * @param {HTMLElement} container - Container element for the canvas
   * @param {Object} [options] - Renderer options
   * @param {number} [options.playerCount=1] - Initial player count
   * @param {Function} [options.onExit] - Callback when ESC is pressed
   * @param {Function} [options.onWallBounce] - Callback when ghost bounces off wall
   */
  constructor(containerOrOptions, options = {}) {
    // Handle both: new Renderer(element, opts) and new Renderer({ container, ...opts })
    if (containerOrOptions instanceof HTMLElement) {
      this.container = containerOrOptions;
      this.options = options;
    } else {
      this.container = containerOrOptions.container;
      this.options = containerOrOptions;
    }

    // Calculate arena size
    const playerCount = options.playerCount || 1;
    const arenaSize = calculateArenaSize(playerCount);

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = arenaSize;
    this.canvas.height = arenaSize;
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.border = '2px solid ' + COLORS.gridLines;
    this.canvas.style.borderRadius = '4px';
    this.ctx = this.canvas.getContext('2d');

    // Create arena
    this.arena = new Arena(arenaSize);

    // Ghost storage
    this.ghosts = new Map();
    this.localGhostId = null;

    // Wells storage (synced from controller)
    this.wells = [];

    // Void zone
    this.voidZone = null;

    // Animation time for pulsing effects
    this.animationTime = 0;

    // Timing
    this.lastFrameTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;

    // Input state
    this.keysPressed = new Set();

    // Bind methods
    this.update = this.update.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Append canvas to container
    this.container.appendChild(this.canvas);

    // Setup input handlers
    this.setupInputHandlers();

    // Setup responsive canvas scaling
    this._setupResponsiveCanvas();
  }

  /**
   * Setup responsive canvas scaling with ResizeObserver
   * @private
   */
  _setupResponsiveCanvas() {
    if (typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(entries => {
      const container = entries[0].target;
      if (!container || !this.canvas) return;

      const scale = Math.min(
        container.clientWidth / this.canvas.width,
        container.clientHeight / this.canvas.height,
        1 // Don't scale up beyond native size
      );
      this.canvas.style.transform = `scale(${scale})`;
      this.canvas.style.transformOrigin = 'top center';
    });

    if (this.canvas.parentElement) {
      resizeObserver.observe(this.canvas.parentElement);
    }
    this.resizeObserver = resizeObserver; // Store for cleanup
  }

  /**
   * Initialize the renderer (for compatibility - actual init is in constructor)
   * @returns {Promise<void>}
   */
  async init() {
    // Initialization is done in constructor
    // This method exists for API compatibility with controller
    return Promise.resolve();
  }

  /**
   * Setup keyboard input handlers
   */
  setupInputHandlers() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Remove input handlers
   */
  removeInputHandlers() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    // Ignore keypresses when user is typing in an input field
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // ESC to exit
    if (event.key === 'Escape') {
      if (this.options.onExit) {
        this.options.onExit();
      }
      return;
    }

    // Movement keys
    if (INPUT_KEYS[event.key]) {
      event.preventDefault();
      this.keysPressed.add(event.key);
    }
  }

  /**
   * Handle keyup events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyUp(event) {
    if (INPUT_KEYS[event.key]) {
      this.keysPressed.delete(event.key);
    }
  }

  /**
   * Set a key as pressed or released (for external control)
   * @param {string} key - Key name (ArrowUp, ArrowDown, etc.)
   * @param {boolean} pressed - Whether the key is pressed
   */
  setKeyPressed(key, pressed) {
    if (pressed) {
      this.keysPressed.add(key);
    } else {
      this.keysPressed.delete(key);
    }
  }

  /**
   * Add a ghost to the arena
   * @param {Object} ghostOptions - Ghost constructor options
   * @param {boolean} [isLocal=false] - Whether this is the local player's ghost
   * @returns {Ghost} The created ghost
   */
  addGhost(ghostOptions, isLocal = false) {
    const ghost = new Ghost(ghostOptions);
    this.ghosts.set(ghost.id, ghost);

    if (isLocal) {
      this.localGhostId = ghost.id;
    }

    return ghost;
  }

  /**
   * Remove a ghost from the arena
   * @param {string} ghostId - Ghost identifier
   */
  removeGhost(ghostId) {
    this.ghosts.delete(ghostId);
    if (this.localGhostId === ghostId) {
      this.localGhostId = null;
    }
  }

  /**
   * Get the local player's ghost
   * @returns {Ghost|null} Local ghost or null
   */
  getLocalGhost() {
    return this.localGhostId ? this.ghosts.get(this.localGhostId) : null;
  }

  /**
   * Get all ghosts in the arena
   * @returns {Ghost[]} Array of all ghosts
   */
  getAllGhosts() {
    return Array.from(this.ghosts.values());
  }

  /**
   * Flash a ghost with a color for visual feedback
   * @param {string} ghostId - Ghost identifier
   * @param {string} color - Flash color (e.g., '#ff4444')
   * @param {number} duration - Flash duration in milliseconds
   */
  flashGhost(ghostId, color, duration) {
    const ghost = this.ghosts.get(ghostId);
    if (!ghost) return;

    ghost.flashColor = color;
    ghost.flashUntil = Date.now() + duration;
  }

  /**
   * Resize the arena based on player count
   * @param {number} playerCount - Number of players
   */
  resizeArena(playerCount) {
    const newSize = calculateArenaSize(playerCount);
    this.canvas.width = newSize;
    this.canvas.height = newSize;
    this.arena.resize(newSize);
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.update);
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main update loop
   * @param {number} currentTime - Current timestamp from requestAnimationFrame
   */
  update(currentTime) {
    if (!this.isRunning) return;

    // Calculate delta time in seconds
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Update animation time
    this.animationTime += deltaTime;

    // Process input for local ghost
    this.processInput();

    // Update physics
    this.updatePhysics(deltaTime, currentTime);

    // Call external physics callback if set (for gravity wells, orbits, etc.)
    if (this.onPhysicsUpdate) {
      this.onPhysicsUpdate(deltaTime, currentTime);
    }

    // Update trails
    this.arena.updateTrails();

    // Render
    this.render();

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.update);
  }

  /**
   * Set callback for external physics updates (gravity wells, territory, etc.)
   * @param {Function} callback - Called each frame with (deltaTime, currentTime)
   */
  setPhysicsCallback(callback) {
    this.onPhysicsUpdate = callback;
  }

  /**
   * Process input and apply to local ghost
   * NOTE: v2 mode - Arrow keys disabled, movement controlled by Records (Space) only
   */
  processInput() {
    // v2: NO thrust from arrow keys - ghosts move at constant velocity
    // and only change direction via Records (Space key to orbit/release)
    // This method kept for compatibility but thrust is disabled
    const localGhost = this.getLocalGhost();
    if (!localGhost) return;

    // Just ensure thrusting flag is off
    localGhost.isThrusting = false;
  }

  /**
   * Update physics for all ghosts
   * @param {number} deltaTime - Time since last update in seconds
   * @param {number} currentTime - Current timestamp
   */
  updatePhysics(deltaTime, currentTime) {
    for (const ghost of this.ghosts.values()) {
      // Update energy
      ghost.updateEnergy(deltaTime);

      // Update position
      ghost.updatePosition(deltaTime);

      // Handle wall collisions
      const bounced = ghost.handleWallCollision(this.arena.size);
      if (bounced && this.options.onWallBounce) {
        this.options.onWallBounce(ghost);
      }

      // v2: No automatic trail dropping - trails only from collected dots
    }
  }

  /**
   * Render the arena and all entities
   */
  render() {
    const ctx = this.ctx;
    const size = this.arena.size;

    // Clear with background color
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, size, size);

    // Render grid lines (subtle)
    this.renderGrid();

    // Render territory overlay (legacy, kept for compatibility)
    this.renderTerritory();

    // Render void zone (legacy, disabled in v2)
    this.renderVoidZone();

    // Render records (spinning plates)
    this.renderGravityWells();

    // Render territory dots (v3)
    this.renderDots();

    // Render ghosts
    this.renderGhosts();
  }

  /**
   * Render subtle grid lines
   */
  renderGrid() {
    const ctx = this.ctx;
    const size = this.arena.size;

    ctx.strokeStyle = COLORS.gridLines;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    // Vertical lines
    for (let x = GRID_SIZE; x < size; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = GRID_SIZE; y < size; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Render territory overlay
   */
  renderTerritory() {
    const ctx = this.ctx;
    const grid = this.arena.grid;
    const gridWidth = this.arena.gridWidth;
    const gridHeight = this.arena.gridHeight;

    // Helper function to check if a cell is on the edge of territory
    const isEdgeCell = (x, y, ownerId) => {
      const neighbors = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;
        const neighborOwner = grid[ny * gridWidth + nx];
        if (neighborOwner !== ownerId) return true;
      }
      return false;
    };

    // Render territory fills
    ctx.globalAlpha = 0.25;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const owner = grid[y * gridWidth + x];
        if (owner) {
          const ghost = this.ghosts.get(owner);
          if (ghost) {
            ctx.fillStyle = ghost.color;
            ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
          }
        }
      }
    }

    ctx.globalAlpha = 1;

    // Render cell borders for owned territory
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const owner = grid[y * gridWidth + x];
        if (owner) {
          const ghost = this.ghosts.get(owner);
          if (ghost) {
            const isEdge = isEdgeCell(x, y, owner);

            // Draw border with higher alpha for edge cells
            ctx.strokeStyle = ghost.color;
            ctx.globalAlpha = isEdge ? 0.6 : 0.4;
            ctx.lineWidth = 1;
            ctx.strokeRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
          }
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Render void zone
   */
  renderVoidZone() {
    if (!this.voidZone) return;

    const ctx = this.ctx;
    const { x, y, radius } = this.voidZone;

    // Pulsing effect
    const pulse = Math.sin(this.animationTime * 2) * 0.2 + 0.8;

    // Outer glow
    const outerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    outerGradient.addColorStop(0, 'rgba(40, 0, 60, 0)');
    outerGradient.addColorStop(0.6, `rgba(40, 0, 60, ${0.3 * pulse})`);
    outerGradient.addColorStop(1, 'rgba(40, 0, 60, 0)');
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core dark circle
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    coreGradient.addColorStop(0, `rgba(20, 0, 30, ${0.8 * pulse})`);
    coreGradient.addColorStop(1, `rgba(40, 0, 60, ${0.5 * pulse})`);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing border
    ctx.strokeStyle = `rgba(80, 0, 120, ${0.6 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Render all records (v2 - spinning plates)
   */
  renderGravityWells() {
    if (!this.wells || this.wells.length === 0) return;

    for (const record of this.wells) {
      this.renderRecord(record);
    }
  }

  /**
   * Render a single record (spinning plate) - v2 style
   * Records are neutral gray circles with spinning indicators
   * @param {Object} record - Record data
   */
  renderRecord(record) {
    const ctx = this.ctx;

    // Handle both flat {x, y} and nested {position: {x, y}} formats
    const x = record.position ? record.position.x : record.x;
    const y = record.position ? record.position.y : record.y;
    const radius = record.radius || 50;
    const captureRadius = record.captureRadius || 70;
    const spinAngle = record.spinAngle || 0;
    const clockwise = record.clockwise !== undefined ? record.clockwise : true;

    // Guard against invalid coordinates
    if (!isFinite(x) || !isFinite(y)) {
      console.warn('[Renderer] Invalid record coordinates:', record);
      return;
    }

    // Record colors - neutral gray/dark theme
    const recordColor = '#555566';
    const grooveColor = '#333344';
    const centerColor = '#888899';
    const highlightColor = '#aabbcc';

    // Highlight if ghost is near (within capture range)
    let isHighlighted = false;
    for (const ghost of this.ghosts.values()) {
      const dist = distance(ghost.position, { x, y });
      if (dist < captureRadius) {
        isHighlighted = true;
        break;
      }
    }

    // Outer capture zone (subtle glow when ghost is near)
    if (isHighlighted) {
      ctx.globalAlpha = 0.15;
      const captureGradient = ctx.createRadialGradient(x, y, radius, x, y, captureRadius);
      captureGradient.addColorStop(0, highlightColor);
      captureGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = captureGradient;
      ctx.beginPath();
      ctx.arc(x, y, captureRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Main record disc (vinyl record look)
    const discGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    discGradient.addColorStop(0, centerColor);
    discGradient.addColorStop(0.15, recordColor);
    discGradient.addColorStop(0.9, grooveColor);
    discGradient.addColorStop(1, recordColor);
    ctx.fillStyle = discGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Record grooves (spinning lines to show rotation)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spinAngle);

    const numGrooves = 6;
    ctx.strokeStyle = grooveColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;

    for (let i = 0; i < numGrooves; i++) {
      const angle = (i / numGrooves) * Math.PI * 2;
      const innerR = radius * 0.25;
      const outerR = radius * 0.85;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // Spin direction indicator (arc arrow)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spinAngle);

    const arrowRadius = radius * 0.7;
    const arrowAngle = Math.PI * 0.4; // Arc length
    const arrowStart = clockwise ? 0 : Math.PI;
    const arrowEnd = clockwise ? -arrowAngle : Math.PI + arrowAngle;

    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, arrowRadius, arrowStart, arrowEnd, clockwise);
    ctx.stroke();

    // Arrow head
    const arrowHeadAngle = arrowEnd;
    const arrowHeadX = Math.cos(arrowHeadAngle) * arrowRadius;
    const arrowHeadY = Math.sin(arrowHeadAngle) * arrowRadius;
    const headSize = 6;
    const headAngle = arrowHeadAngle + (clockwise ? -Math.PI / 2 : Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(arrowHeadX, arrowHeadY);
    ctx.lineTo(
      arrowHeadX + Math.cos(headAngle + 0.5) * headSize,
      arrowHeadY + Math.sin(headAngle + 0.5) * headSize
    );
    ctx.moveTo(arrowHeadX, arrowHeadY);
    ctx.lineTo(
      arrowHeadX + Math.cos(headAngle - 0.5) * headSize,
      arrowHeadY + Math.sin(headAngle - 0.5) * headSize
    );
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();

    // Center spindle (like a vinyl record)
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Spindle hole
    ctx.fillStyle = '#222233';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Outer edge highlight
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // If ghost is currently orbiting this record, show orbit path
    if (record.currentOrbiter) {
      const orbiterGhost = this.ghosts.get(record.currentOrbiter);
      if (orbiterGhost) {
        const orbitRadius = distance(orbiterGhost.position, { x, y });
        ctx.strokeStyle = orbiterGhost.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }
  }

  /**
   * Render all trails
   */
  renderTrails() {
    const ctx = this.ctx;
    const now = Date.now();

    for (const segment of this.arena.trails) {
      const age = now - segment.createdAt;
      const lifePercent = 1 - (age / segment.duration);

      if (lifePercent <= 0) continue;

      ctx.globalAlpha = lifePercent * TRAIL_ALPHA;
      ctx.fillStyle = segment.color;
      ctx.beginPath();
      ctx.arc(segment.position.x, segment.position.y, segment.width, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Render all ghosts
   */
  renderGhosts() {
    for (const ghost of this.ghosts.values()) {
      this.renderGhost(ghost);
    }
  }

  /**
   * Render a single ghost
   * @param {Ghost} ghost - Ghost to render
   */
  renderGhost(ghost) {
    const ctx = this.ctx;
    const { x, y } = ghost.position;
    const radius = ghost.radius;

    // Check if ghost is orbiting (indicated by isOrbiting property set by controller)
    const isOrbiting = ghost.isOrbiting || false;

    // Check for flash effect
    const currentTime = Date.now();
    const isFlashing = ghost.flashUntil > currentTime;
    const displayColor = isFlashing ? ghost.flashColor : ghost.color;

    // Outer glow (more intense when orbiting)
    const glowIntensity = isOrbiting ? 2.0 : 1.5;
    const glowAlpha = isOrbiting ? 0.5 : 0.3;
    const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * glowIntensity);
    gradient.addColorStop(0, displayColor);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = glowAlpha;
    ctx.beginPath();
    ctx.arc(x, y, radius * glowIntensity, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Orbiting ring indicator
    if (isOrbiting) {
      const pulse = Math.sin(this.animationTime * 4) * 0.2 + 0.8;
      ctx.strokeStyle = lighten(displayColor, 0.5);
      ctx.globalAlpha = 0.6 * pulse;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Core body
    ctx.fillStyle = displayColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw fractal pattern if available
    if (ghost.patternCanvas) {
      ctx.save();
      // Clip to ghost circle
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
      ctx.clip();

      // Draw pattern centered on ghost, scaled to fit
      const patternSize = radius * 2;
      ctx.globalAlpha = 0.7;
      ctx.drawImage(
        ghost.patternCanvas,
        x - patternSize / 2,
        y - patternSize / 2,
        patternSize,
        patternSize
      );
      ctx.restore();
    }

    // Membrane (border)
    ctx.strokeStyle = lighten(ghost.color, 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Energy indicator (small arc at bottom)
    const energyPercent = ghost.energy / ghost.maxEnergy;
    const energyArcStart = Math.PI * 0.6;
    const energyArcEnd = energyArcStart + (Math.PI * 0.8 * energyPercent);

    ctx.strokeStyle = energyPercent > 0.3 ? '#00ff88' : '#ff4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, energyArcStart, energyArcEnd);
    ctx.stroke();

    // Thrust indicator (particles when thrusting) - not shown when orbiting
    if (ghost.isThrusting && !isOrbiting) {
      this.renderThrustParticles(ghost);
    }
  }

  /**
   * Render thrust particles behind a ghost
   * @param {Ghost} ghost - Ghost that is thrusting
   */
  renderThrustParticles(ghost) {
    const ctx = this.ctx;
    const { x, y } = ghost.position;

    // Particles opposite to velocity direction
    const vx = -ghost.velocity.x;
    const vy = -ghost.velocity.y;
    const len = Math.sqrt(vx * vx + vy * vy);

    if (len < 0.1) return;

    const nx = vx / len;
    const ny = vy / len;

    ctx.fillStyle = ghost.color;
    ctx.globalAlpha = 0.5;

    // Draw 3 small particles
    for (let i = 0; i < 3; i++) {
      const dist = ghost.radius + 5 + Math.random() * 10;
      const spread = (Math.random() - 0.5) * 0.5;
      const px = x + nx * dist + spread * ny * 10;
      const py = y + ny * dist - spread * nx * 10;
      const size = 2 + Math.random() * 3;

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Get current territory percentages
   * @returns {Map<string, number>} Map of ghost ID to territory percentage
   */
  getTerritoryPercents() {
    return this.arena.getAllTerritoryPercents(Array.from(this.ghosts.values()));
  }

  /**
   * Update state from server (multiplayer sync)
   * @param {Object} state - Arena state from server
   * @param {Array} state.ghosts - Ghost positions and properties
   * @param {Array} state.trails - Trail segments
   * @param {Object} state.territory - Territory ownership
   * @param {number} state.arenaSize - Arena size
   */
  updateState(state) {
    if (!state) return;

    // Update arena size if changed
    if (state.arenaSize && state.arenaSize !== this.arena.size) {
      this.resizeArena(Math.ceil(state.arenaSize / 80)); // Convert to player count estimate
    }

    // Update ghosts from server state
    if (state.ghosts) {
      // Remove ghosts that are no longer in server state
      const serverGhostIds = new Set(state.ghosts.map(g => g.id));
      for (const [id] of this.ghosts) {
        if (!serverGhostIds.has(id)) {
          this.removeGhost(id);
        }
      }

      // Update or add ghosts
      for (const ghostData of state.ghosts) {
        let ghost = this.ghosts.get(ghostData.id);
        if (ghost) {
          // Update existing ghost position and velocity
          ghost.position.x = ghostData.x;
          ghost.position.y = ghostData.y;
          if (ghostData.vx !== undefined) ghost.velocity.x = ghostData.vx;
          if (ghostData.vy !== undefined) ghost.velocity.y = ghostData.vy;
          if (ghostData.energy !== undefined) ghost.energy = ghostData.energy;
        } else {
          // Add new ghost
          this.addGhost({
            id: ghostData.id,
            x: ghostData.x,
            y: ghostData.y,
            color: ghostData.color,
            tier: ghostData.tier,
            nnProperties: ghostData.nnProperties
          }, ghostData.id === this.localGhostId);
        }
      }
    }

    // Update trails from server state
    if (state.trails) {
      this.arena.trails = state.trails.map(t => ({
        position: { x: t.x, y: t.y },
        color: t.color,
        width: t.width || 3,
        createdAt: t.createdAt || Date.now(),
        duration: t.duration || 5000,
        ownerId: t.ownerId
      }));
    }
  }

  /**
   * Update local ghost properties (called when NN updates)
   * @param {Object} properties - New ghost properties from NN mapper
   */
  updateLocalGhostProperties(properties) {
    const localGhost = this.getLocalGhost();
    if (localGhost && properties) {
      localGhost.mass = properties.mass || localGhost.mass;
      localGhost.thrustEfficiency = properties.thrustEfficiency || localGhost.thrustEfficiency;
      localGhost.trailDuration = properties.trailDuration || localGhost.trailDuration;
      localGhost.energyRegen = properties.energyRegen || localGhost.energyRegen;
      localGhost.trailWidth = properties.trailWidth || localGhost.trailWidth;
      if (properties.color) localGhost.color = properties.color;
    }
  }

  /**
   * Update wells from physics engine
   * @param {Array} wells - Array of well objects
   */
  updateWells(wells) {
    this.wells = wells || [];
  }

  /**
   * Update void zone configuration
   * @param {Object} voidZone - Void zone config with x, y, radius
   */
  updateVoidZone(voidZone) {
    this.voidZone = voidZone;
  }

  /**
   * Update ghost orbital state
   * @param {string} ghostId - Ghost ID
   * @param {boolean} isOrbiting - Whether ghost is orbiting
   */
  updateGhostOrbitState(ghostId, isOrbiting) {
    const ghost = this.ghosts.get(ghostId);
    if (ghost) {
      ghost.isOrbiting = isOrbiting;
    }
  }

  // ============================================
  // v3: TERRITORY DOTS
  // ============================================

  /**
   * Update territory dots (v3)
   * @param {Array} dots - Array of Dot objects with ownership
   */
  updateDots(dots) {
    this.territoryDots = dots || [];
  }

  /**
   * Render territory dots (v3)
   * - Neutral dots: white/gray
   * - Owned dots: owner's color with glow
   */
  renderDots() {
    if (!this.territoryDots || this.territoryDots.length === 0) return;

    const ctx = this.ctx;

    for (const dot of this.territoryDots) {
      const { x, y, radius, pulsePhase, state, ownerColor } = dot;

      // Pulsing effect (stronger for neutral, subtle for owned)
      const isNeutral = state === 'NEUTRAL';
      const pulseStrength = isNeutral ? 0.25 : 0.15;
      const pulse = Math.sin(pulsePhase || 0) * pulseStrength + (1 - pulseStrength);
      const visualRadius = radius * pulse;

      // Determine dot color based on ownership
      const dotColor = isNeutral ? '#aabbcc' : (ownerColor || '#ffffff');

      // Outer glow (larger for owned dots)
      const glowSize = isNeutral ? 1.5 : 2.0;
      ctx.globalAlpha = isNeutral ? 0.2 : 0.35;
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, visualRadius * glowSize);
      glowGradient.addColorStop(0, dotColor);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, visualRadius * glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Main dot body
      ctx.globalAlpha = isNeutral ? 0.7 : 0.9;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(x, y, visualRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight (subtle shine)
      ctx.globalAlpha = isNeutral ? 0.4 : 0.5;
      ctx.fillStyle = lighten(dotColor, 0.4);
      ctx.beginPath();
      ctx.arc(x - visualRadius * 0.2, y - visualRadius * 0.2, visualRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Border ring for owned dots
      if (!isNeutral) {
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = lighten(dotColor, 0.3);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, visualRadius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }

  /**
   * Clean up and destroy the renderer
   */
  destroy() {
    this.stop();
    this.removeInputHandlers();

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.ghosts.clear();
    this.arena.trails = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  GhostOrbitsRenderer,
  Ghost,
  Arena,
  // Constants
  MIN_ARENA_SIZE,
  MAX_ARENA_SIZE,
  SPACE_PER_PLAYER,
  THRUST_FORCE,
  BASE_ENERGY_COST,
  MAX_ENERGY,
  ENERGY_REGEN_RATE,
  WALL_BOUNCE_VELOCITY_LOSS,
  BASE_RADIUS,
  TRAIL_SEGMENT_INTERVAL,
  BASE_TRAIL_WIDTH,
  BASE_TRAIL_DURATION,
  TRAIL_ALPHA,
  GRID_SIZE,
  COLORS,
  // Utilities
  calculateArenaSize,
  lighten,
  distance,
  normalize
};
