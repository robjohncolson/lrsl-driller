/**
 * Ghost Arena - Server-Authoritative Game State
 *
 * Persistent multiplayer dot-territory game with orbital mechanics.
 * Server owns all game state - players move on orbital paths, claim dots with spacebar.
 *
 * @module arena-game-state
 * @version 1.0.0
 */

// ============================================
// CONFIGURATION
// ============================================

const ARENA_CONFIG = {
  // Scaling formulas (based on player count)
  BASE_ARENA_SIZE: 800,
  ARENA_SCALE_FACTOR: 0.3,

  // Dots
  BASE_DOT_COUNT: 30,
  DOTS_PER_PLAYER: 15,
  DOT_RADIUS: 10,

  // Orbits
  BASE_ORBIT_COUNT: 3,
  MAX_ORBIT_COUNT: 12,
  MIN_ORBIT_RADIUS: 80,
  MAX_ORBIT_RADIUS_FACTOR: 0.4, // Max radius as fraction of arena size

  // Physics
  TICK_RATE: 30, // fps
  TICK_INTERVAL: 1000 / 30, // ~33ms
  PLAYER_SPEED: 4, // pixels per frame
  ANGULAR_SPEED: 2.0, // radians per second

  // Dot mechanics
  SPACEBAR_WINDOW_MIN: 250, // ms - flip window start
  SPACEBAR_WINDOW_MAX: 350, // ms - flip window end
  CLAIM_RADIUS: 25, // pixels - how close to claim a dot

  // Idle penalty
  IDLE_TIMEOUT: 10000, // 10 seconds
  IDLE_DOT_LOSS_INTERVAL: 1000, // lose 1 dot per second when idle

  // Lives
  STARTING_LIVES: 3,

  // Win condition
  RECONNECT_WINDOW: 15000, // 15 seconds before declaring winner

  // Player properties
  BASE_CLAIM_RADIUS: 1.0,
  PLAYER_COLLISION_RADIUS: 15,
};

// ============================================
// VECTOR2 HELPER CLASS
// ============================================

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static fromAngle(angle, magnitude = 1) {
    return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }

  toJSON() {
    return { x: this.x, y: this.y };
  }
}

// ============================================
// PLAYER CLASS
// ============================================

class Player {
  constructor(id, username, color, spawnOrbit, arenaSize) {
    this.id = id;
    this.username = username;
    this.color = color || this.generateColor(username);

    // Position and velocity
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    // Orbital state
    this.orbitIndex = spawnOrbit;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbiting = true;
    this.clockwise = Math.random() < 0.5;

    // Game state
    this.dots = new Set(); // IDs of owned dots
    this.lives = ARENA_CONFIG.STARTING_LIVES;
    this.isGhost = false; // AI ghost (vs human player)
    this.isAlive = true;
    this.isConnected = true;
    this.disconnectedAt = null;

    // Input state
    this.lastSpacebar = 0;
    this.lastActivity = Date.now();
    this.inputDirection = new Vector2(0, 0); // Current input direction

    // Properties (can be influenced by NN profile)
    this.claimRadius = ARENA_CONFIG.BASE_CLAIM_RADIUS;
    this.orbitalSpeedMultiplier = 1.0;
  }

  generateColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      color: this.color,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      orbitIndex: this.orbitIndex,
      orbitAngle: this.orbitAngle,
      orbiting: this.orbiting,
      clockwise: this.clockwise,
      dotCount: this.dots.size,
      lives: this.lives,
      isGhost: this.isGhost,
      isAlive: this.isAlive,
      claimRadius: this.claimRadius,
    };
  }
}

// ============================================
// DOT CLASS
// ============================================

const DotState = {
  NEUTRAL: 'neutral',
  CLAIMED: 'claimed',
};

class Dot {
  constructor(id, x, y, orbitIndex) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.orbitIndex = orbitIndex; // Which orbit this dot is on
    this.owner = null; // playerId or null
    this.state = DotState.NEUTRAL;
    this.lastClaimTime = 0;
  }

  claim(playerId) {
    this.owner = playerId;
    this.state = DotState.CLAIMED;
    this.lastClaimTime = Date.now();
  }

  reset() {
    this.owner = null;
    this.state = DotState.NEUTRAL;
    this.lastClaimTime = 0;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      orbitIndex: this.orbitIndex,
      owner: this.owner,
      state: this.state,
    };
  }
}

// ============================================
// ORBIT CLASS
// ============================================

class Orbit {
  constructor(id, cx, cy, radius) {
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
  }

  getPositionAtAngle(angle) {
    return new Vector2(
      this.cx + Math.cos(angle) * this.radius,
      this.cy + Math.sin(angle) * this.radius
    );
  }

  toJSON() {
    return {
      id: this.id,
      cx: this.cx,
      cy: this.cy,
      radius: this.radius,
    };
  }
}

// ============================================
// ARENA GAME STATE CLASS
// ============================================

class ArenaGameState {
  constructor(options = {}) {
    this.id = options.id || `arena_${Date.now()}`;
    this.broadcast = options.broadcast || (() => {});

    // Core state
    this.players = new Map(); // id -> Player
    this.dots = new Map(); // id -> Dot
    this.orbits = []; // Array of Orbit objects
    this.arenaSize = ARENA_CONFIG.BASE_ARENA_SIZE;

    // Game state
    this.isRunning = false;
    this.tickInterval = null;
    this.lastTickTime = Date.now();
    this.lastDeltaState = null;

    // Idle tracking
    this.lastIdlePenaltyTime = Date.now();

    // Pending inputs (batched per tick)
    this.pendingSpacebars = new Map(); // playerId -> timestamp

    // Win condition tracking
    this.potentialWinner = null;
    this.winCheckStartTime = null;
  }

  // ============================================
  // SCALING FORMULAS
  // ============================================

  /**
   * Calculate arena size based on player count
   * Formula: 800 * (1 + sqrt(playerCount) * 0.3)
   */
  calculateArenaSize(playerCount) {
    const count = Math.max(1, playerCount);
    return Math.floor(
      ARENA_CONFIG.BASE_ARENA_SIZE * (1 + Math.sqrt(count) * ARENA_CONFIG.ARENA_SCALE_FACTOR)
    );
  }

  /**
   * Calculate dot count based on player count
   * Formula: 30 + (playerCount * 15)
   */
  calculateDotCount(playerCount) {
    const count = Math.max(1, playerCount);
    return ARENA_CONFIG.BASE_DOT_COUNT + (count * ARENA_CONFIG.DOTS_PER_PLAYER);
  }

  /**
   * Calculate orbit count based on player count
   * Formula: min(3 + playerCount, 12)
   */
  calculateOrbitCount(playerCount) {
    const count = Math.max(1, playerCount);
    return Math.min(ARENA_CONFIG.BASE_ORBIT_COUNT + count, ARENA_CONFIG.MAX_ORBIT_COUNT);
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize or reinitialize the arena for a given player count
   */
  initialize(playerCount = 1) {
    this.arenaSize = this.calculateArenaSize(playerCount);
    this.initializeOrbits(playerCount);
    this.initializeDots(playerCount);

    console.log(`[ArenaGameState] Initialized: size=${this.arenaSize}, orbits=${this.orbits.length}, dots=${this.dots.size}`);
  }

  /**
   * Create orbits (concentric circles in arena center)
   */
  initializeOrbits(playerCount) {
    this.orbits = [];
    const orbitCount = this.calculateOrbitCount(playerCount);
    const centerX = this.arenaSize / 2;
    const centerY = this.arenaSize / 2;
    const maxRadius = this.arenaSize * ARENA_CONFIG.MAX_ORBIT_RADIUS_FACTOR;
    const minRadius = ARENA_CONFIG.MIN_ORBIT_RADIUS;

    for (let i = 0; i < orbitCount; i++) {
      // Distribute orbits evenly between min and max radius
      const t = orbitCount > 1 ? i / (orbitCount - 1) : 0.5;
      const radius = minRadius + t * (maxRadius - minRadius);

      const orbit = new Orbit(i, centerX, centerY, radius);
      this.orbits.push(orbit);
    }
  }

  /**
   * Create dots distributed evenly on orbits
   */
  initializeDots(playerCount) {
    this.dots.clear();
    const dotCount = this.calculateDotCount(playerCount);
    const dotsPerOrbit = Math.ceil(dotCount / this.orbits.length);

    let dotId = 0;
    for (let orbitIndex = 0; orbitIndex < this.orbits.length; orbitIndex++) {
      const orbit = this.orbits[orbitIndex];
      const dotsOnThisOrbit = Math.min(dotsPerOrbit, dotCount - dotId);

      for (let j = 0; j < dotsOnThisOrbit && dotId < dotCount; j++) {
        const angle = (j / dotsOnThisOrbit) * Math.PI * 2;
        const pos = orbit.getPositionAtAngle(angle);

        const dot = new Dot(`dot_${dotId}`, pos.x, pos.y, orbitIndex);
        this.dots.set(dot.id, dot);
        dotId++;
      }
    }
  }

  // ============================================
  // PLAYER MANAGEMENT
  // ============================================

  /**
   * Add a player to the arena
   */
  addPlayer(id, username, profile = {}) {
    if (this.players.has(id)) {
      // Player reconnecting
      const player = this.players.get(id);
      player.isConnected = true;
      player.disconnectedAt = null;
      player.lastActivity = Date.now();
      console.log(`[ArenaGameState] Player reconnected: ${username}`);
      return player;
    }

    // Choose spawn orbit (distribute players across orbits)
    const spawnOrbit = this.players.size % this.orbits.length;

    const player = new Player(id, username, profile.color, spawnOrbit, this.arenaSize);

    // Apply NN profile properties if available
    if (profile.claimRadius) player.claimRadius = profile.claimRadius;
    if (profile.orbitalSpeedMultiplier) player.orbitalSpeedMultiplier = profile.orbitalSpeedMultiplier;
    player.isGhost = profile.isGhost || false;

    // Set initial position on orbit
    if (this.orbits[spawnOrbit]) {
      const pos = this.orbits[spawnOrbit].getPositionAtAngle(player.orbitAngle);
      player.x = pos.x;
      player.y = pos.y;
    }

    this.players.set(id, player);

    // Reinitialize if this significantly changes player count
    const currentCount = this.players.size;
    const expectedArenaSize = this.calculateArenaSize(currentCount);
    if (Math.abs(expectedArenaSize - this.arenaSize) > 100) {
      this.rescaleArena();
    }

    console.log(`[ArenaGameState] Player added: ${username} (id=${id})`);
    return player;
  }

  /**
   * Remove a player from the arena
   */
  removePlayer(id) {
    const player = this.players.get(id);
    if (!player) return;

    // Return dots to neutral
    for (const dotId of player.dots) {
      const dot = this.dots.get(dotId);
      if (dot) dot.reset();
    }

    this.players.delete(id);
    console.log(`[ArenaGameState] Player removed: ${player.username}`);

    // Check win condition
    this.checkWinCondition();
  }

  /**
   * Get the number of players in the arena
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Mark player as disconnected (for reconnect window)
   */
  disconnectPlayer(id) {
    const player = this.players.get(id);
    if (!player) return;

    player.isConnected = false;
    player.disconnectedAt = Date.now();
    console.log(`[ArenaGameState] Player disconnected: ${player.username}`);
  }

  /**
   * Rescale arena when player count changes significantly
   */
  rescaleArena() {
    const playerCount = this.players.size;
    const newArenaSize = this.calculateArenaSize(playerCount);
    const scaleFactor = newArenaSize / this.arenaSize;

    // Scale orbits
    this.initializeOrbits(playerCount);

    // Scale dots (maintain relative positions)
    for (const dot of this.dots.values()) {
      dot.x *= scaleFactor;
      dot.y *= scaleFactor;
    }

    // Scale player positions
    for (const player of this.players.values()) {
      player.x *= scaleFactor;
      player.y *= scaleFactor;
    }

    this.arenaSize = newArenaSize;

    // Reinitialize dots if needed
    const expectedDotCount = this.calculateDotCount(playerCount);
    if (Math.abs(expectedDotCount - this.dots.size) > 10) {
      this.initializeDots(playerCount);
    }
  }

  // ============================================
  // INPUT HANDLING
  // ============================================

  /**
   * Process spacebar input from a player
   */
  processSpacebar(playerId) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    const now = Date.now();
    player.lastSpacebar = now;
    player.lastActivity = now;
    this.pendingSpacebars.set(playerId, now);
  }

  /**
   * Process movement input (switch orbits, change direction)
   */
  processMovement(playerId, input) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    player.lastActivity = Date.now();

    if (input.switchOrbit !== undefined) {
      // Switch to different orbit
      const newOrbit = Math.max(0, Math.min(this.orbits.length - 1, input.switchOrbit));
      player.orbitIndex = newOrbit;
    }

    if (input.changeDirection !== undefined) {
      player.clockwise = input.changeDirection;
    }

    if (input.leaveOrbit !== undefined && input.leaveOrbit) {
      player.orbiting = false;
      // Set velocity tangent to current orbit
      const tangentAngle = player.orbitAngle + (player.clockwise ? -Math.PI / 2 : Math.PI / 2);
      player.vx = Math.cos(tangentAngle) * ARENA_CONFIG.PLAYER_SPEED;
      player.vy = Math.sin(tangentAngle) * ARENA_CONFIG.PLAYER_SPEED;
    }

    if (input.joinOrbit !== undefined && input.joinOrbit) {
      // Try to join nearest orbit
      this.tryJoinOrbit(player);
    }
  }

  /**
   * Try to join the nearest orbit
   */
  tryJoinOrbit(player) {
    let nearestOrbit = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < this.orbits.length; i++) {
      const orbit = this.orbits[i];
      const dx = player.x - orbit.cx;
      const dy = player.y - orbit.cy;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      const distToOrbit = Math.abs(distToCenter - orbit.radius);

      if (distToOrbit < nearestDist && distToOrbit < ARENA_CONFIG.CLAIM_RADIUS * 2) {
        nearestDist = distToOrbit;
        nearestOrbit = i;
      }
    }

    if (nearestOrbit >= 0) {
      const orbit = this.orbits[nearestOrbit];
      player.orbitIndex = nearestOrbit;
      player.orbitAngle = Math.atan2(player.y - orbit.cy, player.x - orbit.cx);
      player.orbiting = true;
      player.vx = 0;
      player.vy = 0;
    }
  }

  // ============================================
  // PHYSICS LOOP (30fps)
  // ============================================

  /**
   * Start the physics loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(), ARENA_CONFIG.TICK_INTERVAL);
    console.log(`[ArenaGameState] Game loop started`);
  }

  /**
   * Stop the physics loop
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    console.log(`[ArenaGameState] Game loop stopped`);
  }

  /**
   * Main physics tick
   */
  tick() {
    const now = Date.now();
    const deltaTime = (now - this.lastTickTime) / 1000; // seconds
    this.lastTickTime = now;

    // Update all players
    for (const player of this.players.values()) {
      if (!player.isAlive) continue;
      this.updatePlayer(player, deltaTime);
    }

    // Process spacebar inputs for dot claiming
    this.processSpacebarInputs();

    // Check for collisions
    this.checkCollisions();

    // Apply idle penalties
    this.applyIdlePenalties(now);

    // Check disconnected players
    this.checkDisconnectedPlayers(now);

    // Check win condition
    this.checkWinCondition();

    // Clear pending inputs
    this.pendingSpacebars.clear();
  }

  /**
   * Update a single player's position
   */
  updatePlayer(player, deltaTime) {
    if (player.orbiting) {
      // Move along orbit
      const orbit = this.orbits[player.orbitIndex];
      if (!orbit) return;

      const angularSpeed = ARENA_CONFIG.ANGULAR_SPEED * player.orbitalSpeedMultiplier;
      const direction = player.clockwise ? -1 : 1;
      player.orbitAngle += direction * angularSpeed * deltaTime;

      // Normalize angle
      player.orbitAngle = player.orbitAngle % (Math.PI * 2);
      if (player.orbitAngle < 0) player.orbitAngle += Math.PI * 2;

      // Update position
      const pos = orbit.getPositionAtAngle(player.orbitAngle);
      player.x = pos.x;
      player.y = pos.y;

      // Calculate tangential velocity
      const tangentAngle = player.orbitAngle + (player.clockwise ? -Math.PI / 2 : Math.PI / 2);
      const speed = angularSpeed * orbit.radius;
      player.vx = Math.cos(tangentAngle) * speed;
      player.vy = Math.sin(tangentAngle) * speed;
    } else {
      // Free movement
      player.x += player.vx * deltaTime * 60;
      player.y += player.vy * deltaTime * 60;

      // Wall bouncing
      const margin = ARENA_CONFIG.PLAYER_COLLISION_RADIUS;
      if (player.x < margin) {
        player.x = margin;
        player.vx = Math.abs(player.vx);
      } else if (player.x > this.arenaSize - margin) {
        player.x = this.arenaSize - margin;
        player.vx = -Math.abs(player.vx);
      }

      if (player.y < margin) {
        player.y = margin;
        player.vy = Math.abs(player.vy);
      } else if (player.y > this.arenaSize - margin) {
        player.y = this.arenaSize - margin;
        player.vy = -Math.abs(player.vy);
      }
    }
  }

  /**
   * Process spacebar inputs for dot claiming/flipping
   */
  processSpacebarInputs() {
    for (const [playerId, spacebarTime] of this.pendingSpacebars) {
      const player = this.players.get(playerId);
      if (!player || !player.isAlive) continue;

      // Find dots within claim radius
      const claimDist = ARENA_CONFIG.CLAIM_RADIUS * player.claimRadius;

      for (const dot of this.dots.values()) {
        const dx = player.x - dot.x;
        const dy = player.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= claimDist) {
          if (dot.state === DotState.NEUTRAL) {
            // Claim neutral dot
            this.claimDot(player, dot);
          } else if (dot.owner !== playerId) {
            // Flip opponent's dot
            this.flipDot(player, dot);
          }
        }
      }
    }
  }

  /**
   * Claim a neutral dot
   */
  claimDot(player, dot) {
    dot.claim(player.id);
    player.dots.add(dot.id);

    console.log(`[ArenaGameState] ${player.username} claimed dot ${dot.id}`);
  }

  /**
   * Flip an opponent's dot to player's ownership
   */
  flipDot(player, dot) {
    const previousOwner = this.players.get(dot.owner);
    if (previousOwner) {
      previousOwner.dots.delete(dot.id);
    }

    dot.claim(player.id);
    player.dots.add(dot.id);

    console.log(`[ArenaGameState] ${player.username} flipped dot ${dot.id} from ${previousOwner?.username || 'unknown'}`);
  }

  // ============================================
  // COLLISION DETECTION
  // ============================================

  /**
   * Check all collisions (player-dot without spacebar = damage)
   */
  checkCollisions() {
    const now = Date.now();

    for (const player of this.players.values()) {
      if (!player.isAlive) continue;

      for (const dot of this.dots.values()) {
        if (dot.state !== DotState.CLAIMED || dot.owner === player.id) continue;

        const dx = player.x - dot.x;
        const dy = player.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= ARENA_CONFIG.PLAYER_COLLISION_RADIUS + ARENA_CONFIG.DOT_RADIUS) {
          // Check if spacebar was pressed in the valid window (250-350ms ago)
          const timeSinceSpacebar = now - player.lastSpacebar;
          const validFlip = timeSinceSpacebar >= ARENA_CONFIG.SPACEBAR_WINDOW_MIN &&
                           timeSinceSpacebar <= ARENA_CONFIG.SPACEBAR_WINDOW_MAX;

          if (validFlip) {
            // Flip the dot
            this.flipDot(player, dot);
          } else {
            // Damage - lose a life
            this.damagePlayer(player);
          }
        }
      }
    }
  }

  /**
   * Player takes damage (loses 1 life)
   */
  damagePlayer(player) {
    player.lives--;
    console.log(`[ArenaGameState] ${player.username} lost a life (${player.lives} remaining)`);

    if (player.lives <= 0) {
      this.eliminatePlayer(player.id);
    }
  }

  /**
   * Eliminate a player (loses all lives, dots go neutral)
   */
  eliminatePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.isAlive = false;

    // Return all dots to neutral
    for (const dotId of player.dots) {
      const dot = this.dots.get(dotId);
      if (dot) dot.reset();
    }
    player.dots.clear();

    console.log(`[ArenaGameState] ${player.username} eliminated`);

    this.broadcast({
      type: 'player_eliminated',
      playerId: player.id,
      username: player.username,
      arenaId: this.id,
    });

    this.checkWinCondition();
  }

  // ============================================
  // IDLE PENALTY SYSTEM
  // ============================================

  /**
   * Apply idle penalties (10+ seconds no spacebar = lose dots)
   */
  applyIdlePenalties(now) {
    if (now - this.lastIdlePenaltyTime < ARENA_CONFIG.IDLE_DOT_LOSS_INTERVAL) return;
    this.lastIdlePenaltyTime = now;

    for (const player of this.players.values()) {
      if (!player.isAlive || player.dots.size === 0) continue;

      const idleTime = now - player.lastActivity;
      if (idleTime >= ARENA_CONFIG.IDLE_TIMEOUT) {
        // Lose one dot (convert to neutral)
        const dotIds = Array.from(player.dots);
        if (dotIds.length > 0) {
          const dotToLose = dotIds[Math.floor(Math.random() * dotIds.length)];
          const dot = this.dots.get(dotToLose);
          if (dot) {
            dot.reset();
            player.dots.delete(dotToLose);
            console.log(`[ArenaGameState] ${player.username} lost dot ${dotToLose} (idle penalty)`);
          }
        }
      }
    }
  }

  /**
   * Check for disconnected players past reconnect window
   */
  checkDisconnectedPlayers(now) {
    for (const [id, player] of this.players) {
      if (!player.isConnected && player.disconnectedAt) {
        if (now - player.disconnectedAt > ARENA_CONFIG.RECONNECT_WINDOW) {
          // Remove player after reconnect window
          this.removePlayer(id);
        }
      }
    }
  }

  // ============================================
  // WIN CONDITION
  // ============================================

  /**
   * Check if there's a winner (only 1 player/ghost remains)
   */
  checkWinCondition() {
    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    const connectedAlive = alivePlayers.filter(p => p.isConnected ||
      (p.disconnectedAt && Date.now() - p.disconnectedAt < ARENA_CONFIG.RECONNECT_WINDOW));

    if (connectedAlive.length === 1 && this.players.size > 1) {
      const winner = connectedAlive[0];

      // Track potential winner for reconnect window
      if (this.potentialWinner !== winner.id) {
        this.potentialWinner = winner.id;
        this.winCheckStartTime = Date.now();
        console.log(`[ArenaGameState] Potential winner: ${winner.username} (waiting for reconnect window)`);
        return null;
      }

      // Check if reconnect window has passed
      if (Date.now() - this.winCheckStartTime >= ARENA_CONFIG.RECONNECT_WINDOW) {
        console.log(`[ArenaGameState] Winner: ${winner.username}`);
        return winner;
      }
    } else {
      // Reset win tracking
      this.potentialWinner = null;
      this.winCheckStartTime = null;
    }

    if (connectedAlive.length === 0 && this.players.size > 0) {
      console.log(`[ArenaGameState] No players remaining - draw`);
      return { draw: true };
    }

    return null;
  }

  /**
   * Check if the only opponent was a ghost
   */
  wasOnlyGhostOpponent() {
    const players = Array.from(this.players.values());
    const humans = players.filter(p => !p.isGhost);
    const ghosts = players.filter(p => p.isGhost);
    return humans.length === 1 && ghosts.length >= 1;
  }

  /**
   * Handle player input (direction and spacebar)
   */
  handleInput(playerId, direction, spacebar) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    // Update direction
    if (direction) {
      player.inputDirection = new Vector2(direction.x || 0, direction.y || 0);
    }

    // Track spacebar press
    if (spacebar) {
      player.lastSpacebar = Date.now();
      this.pendingSpacebars.set(playerId, Date.now());
    }
  }

  // ============================================
  // STATE SYNC
  // ============================================

  /**
   * Get full game state (for new joiners)
   */
  getGameState() {
    const players = {};
    for (const [id, player] of this.players) {
      players[id] = player.toJSON();
    }

    const dots = {};
    for (const [id, dot] of this.dots) {
      dots[id] = dot.toJSON();
    }

    return {
      arenaId: this.id,
      arenaSize: this.arenaSize,
      isRunning: this.isRunning,
      players,
      dots,
      orbits: this.orbits.map(o => o.toJSON()),
      playerCount: this.players.size,
      aliveCount: Array.from(this.players.values()).filter(p => p.isAlive).length,
    };
  }

  /**
   * Get delta state (changes since last tick for updates)
   */
  getDeltaState() {
    const players = {};
    for (const [id, player] of this.players) {
      // Only include position/velocity for minimal updates
      players[id] = {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        orbitAngle: player.orbitAngle,
        orbiting: player.orbiting,
        dotCount: player.dots.size,
        lives: player.lives,
        isAlive: player.isAlive,
      };
    }

    // Only include dots that changed recently
    const recentDots = {};
    const recentThreshold = ARENA_CONFIG.TICK_INTERVAL * 2;
    const now = Date.now();

    for (const [id, dot] of this.dots) {
      if (now - dot.lastClaimTime < recentThreshold || dot.lastClaimTime === 0) {
        recentDots[id] = {
          x: dot.x,
          y: dot.y,
          owner: dot.owner,
          state: dot.state,
        };
      }
    }

    return {
      arenaId: this.id,
      tick: this.lastTickTime,
      players,
      dots: recentDots,
    };
  }

  // ============================================
  // CLEANUP
  // ============================================

  destroy() {
    this.stop();
    this.players.clear();
    this.dots.clear();
    this.orbits = [];
    this.pendingSpacebars.clear();
    console.log(`[ArenaGameState] Destroyed`);
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  ArenaGameState,
  Player,
  Dot,
  Orbit,
  DotState,
  Vector2,
  ARENA_CONFIG,
};
