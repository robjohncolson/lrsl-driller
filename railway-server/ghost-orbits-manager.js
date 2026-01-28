/**
 * Ghost Orbits Arena Manager
 * Server-side game state management for the Ghost Orbits territory game
 *
 * @version 1.0.0
 * @see ghost-orbits-spec.md
 */

// ============================================
// CONFIGURATION
// ============================================

const ARENA_CONFIG = {
  // Arena sizing
  minArenaSize: 600,
  maxArenaSize: 1400,
  spacePerPlayer: 80,
  gridSize: 20,  // pixels per territory cell

  // Round timing
  countdownDuration: 3000,     // 3 seconds
  roundDuration: 150000,       // 2.5 minutes
  intermissionDuration: 10000, // 10 seconds

  // Game mechanics
  tickRate: 20,               // Hz
  tickInterval: 50,           // ms (1000/20)

  // End conditions
  territoryThreshold: 0.7,    // 70% territory wins

  // Physics
  thrustForce: 0.5,
  maxVelocity: 8,
  friction: 0.98,
  wallBounceRestitution: 0.8,
  baseEnergyCost: 0.1,
  energyRegenRate: 0.02,
  maxEnergy: 1.0,

  // Collision
  massAbsorptionThreshold: 1.2,  // 20% larger required to absorb
  massGainRatio: 0.5,

  // Trail settings
  trailSegmentInterval: 50,   // ms between trail segments
  baseTrailWidth: 3,
  baseTrailDuration: 5000,    // ms before fade

  // Ghost properties (base values)
  baseGhostRadius: 15,
  baseMass: 1.0,

  // Minimum players
  minPlayersToStart: 1,
  targetPlayers: 8
};

// Round states
const RoundState = {
  WAITING: 'waiting',
  COUNTDOWN: 'countdown',
  ACTIVE: 'active',
  ENDED: 'ended',
  INTERMISSION: 'intermission'
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

  static fromAngle(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  toJSON() {
    return { x: this.x, y: this.y };
  }
}

// ============================================
// GHOST CLASS
// ============================================

class Ghost {
  constructor(username, profile, spawnPosition, arenaSize) {
    this.username = username;
    this.position = spawnPosition.clone();
    this.velocity = this.randomVelocity();
    this.energy = ARENA_CONFIG.maxEnergy;
    this.isAlive = true;
    this.eliminatedBy = null;
    this.lastTrailTime = 0;

    // Properties derived from NN (from profile or defaults)
    this.properties = this.calculateProperties(profile);

    // Calculated values
    this.mass = ARENA_CONFIG.baseMass * this.properties.mass;
    this.radius = ARENA_CONFIG.baseGhostRadius * Math.sqrt(this.mass);
    this.color = profile?.color || this.generateColor(username);
  }

  randomVelocity() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    return Vector2.fromAngle(angle).multiply(speed);
  }

  calculateProperties(profile) {
    // Default properties if no NN profile
    if (!profile || !profile.proficiency_score) {
      return {
        mass: 1.0,
        thrustEfficiency: 1.0,
        trailDuration: 1.0,
        energyRegen: 1.0,
        trailWidth: 1.0
      };
    }

    // Map proficiency_score (0-1) to properties
    const score = profile.proficiency_score;

    return {
      // Mass: 0.5 - 1.5 (based on accuracy)
      mass: 0.5 + score,

      // Thrust efficiency: 0.7 - 1.3 (based on speed)
      thrustEfficiency: 0.7 + score * 0.6,

      // Trail duration: 0.5 - 1.5 (inverse of hint usage)
      trailDuration: 0.5 + score,

      // Energy regen: 0.7 - 1.3
      energyRegen: 0.7 + score * 0.6,

      // Trail width: 0.8 - 1.2 (based on accuracy)
      trailWidth: 0.8 + score * 0.4
    };
  }

  generateColor(username) {
    // Generate consistent color from username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  applyThrust(direction) {
    if (!this.isAlive) return;

    const thrustPower = this.properties.thrustEfficiency;
    const energyCost = ARENA_CONFIG.baseEnergyCost / thrustPower;

    if (this.energy >= energyCost) {
      const thrust = direction.clone().normalize().multiply(
        ARENA_CONFIG.thrustForce * thrustPower
      );
      this.velocity.add(thrust);
      this.energy -= energyCost;

      // Clamp velocity
      const speed = this.velocity.length();
      if (speed > ARENA_CONFIG.maxVelocity) {
        this.velocity.normalize().multiply(ARENA_CONFIG.maxVelocity);
      }
    }
  }

  update(deltaTime, arenaSize) {
    if (!this.isAlive) return;

    // Update position
    this.position.add(this.velocity.clone().multiply(deltaTime / 16.67));

    // Apply friction
    this.velocity.multiply(ARENA_CONFIG.friction);

    // Regenerate energy
    this.energy = Math.min(
      this.energy + ARENA_CONFIG.energyRegenRate * this.properties.energyRegen * (deltaTime / 16.67),
      ARENA_CONFIG.maxEnergy
    );

    // Wall collisions (bounce)
    if (this.position.x - this.radius < 0) {
      this.position.x = this.radius;
      this.velocity.x = Math.abs(this.velocity.x) * ARENA_CONFIG.wallBounceRestitution;
    }
    if (this.position.x + this.radius > arenaSize) {
      this.position.x = arenaSize - this.radius;
      this.velocity.x = -Math.abs(this.velocity.x) * ARENA_CONFIG.wallBounceRestitution;
    }
    if (this.position.y - this.radius < 0) {
      this.position.y = this.radius;
      this.velocity.y = Math.abs(this.velocity.y) * ARENA_CONFIG.wallBounceRestitution;
    }
    if (this.position.y + this.radius > arenaSize) {
      this.position.y = arenaSize - this.radius;
      this.velocity.y = -Math.abs(this.velocity.y) * ARENA_CONFIG.wallBounceRestitution;
    }
  }

  eliminate(byUsername) {
    this.isAlive = false;
    this.eliminatedBy = byUsername;
  }

  gainMass(amount) {
    this.mass += amount;
    this.radius = ARENA_CONFIG.baseGhostRadius * Math.sqrt(this.mass);
  }

  toJSON() {
    return {
      username: this.username,
      position: this.position.toJSON(),
      velocity: this.velocity.toJSON(),
      energy: this.energy,
      mass: this.mass,
      radius: this.radius,
      color: this.color,
      isAlive: this.isAlive,
      properties: this.properties
    };
  }
}

// ============================================
// TRAIL SEGMENT CLASS
// ============================================

class TrailSegment {
  constructor(position, ownerId, color, width, duration) {
    this.position = position.clone();
    this.ownerId = ownerId;
    this.color = color;
    this.width = width;
    this.createdAt = Date.now();
    this.duration = duration;
  }

  isExpired() {
    return Date.now() - this.createdAt > this.duration;
  }

  getLifePercent() {
    const age = Date.now() - this.createdAt;
    return Math.max(0, 1 - age / this.duration);
  }

  toJSON() {
    return {
      position: this.position.toJSON(),
      ownerId: this.ownerId,
      color: this.color,
      width: this.width,
      lifePercent: this.getLifePercent()
    };
  }
}

// ============================================
// ARENA CLASS
// ============================================

class Arena {
  constructor(cartridgeId, periodId, broadcast) {
    this.cartridgeId = cartridgeId;
    this.periodId = periodId;
    this.broadcast = broadcast;

    // Game state
    this.state = RoundState.WAITING;
    this.roundNumber = 0;
    this.roundStartTime = null;
    this.countdownStartTime = null;
    this.intermissionStartTime = null;

    // Players
    this.ghosts = new Map();  // username -> Ghost
    this.pendingPlayers = new Map();  // username -> profile (for mid-round joins)
    this.playerInputs = new Map();  // username -> { direction: Vector2, thrust: boolean }

    // Arena
    this.arenaSize = ARENA_CONFIG.minArenaSize;
    this.gridWidth = Math.floor(this.arenaSize / ARENA_CONFIG.gridSize);
    this.gridHeight = Math.floor(this.arenaSize / ARENA_CONFIG.gridSize);
    this.territory = new Array(this.gridWidth * this.gridHeight).fill(null);

    // Trails
    this.trails = [];

    // Game loop
    this.tickInterval = null;
    this.lastTickTime = Date.now();

    // Round results
    this.lastRoundResults = null;
  }

  // ----------------------------------------
  // PLAYER MANAGEMENT
  // ----------------------------------------

  addPlayer(username, ghostProfile) {
    console.log(`[Ghost Orbits] ${username} joining arena ${this.cartridgeId}:${this.periodId}`);

    if (this.state === RoundState.WAITING || this.state === RoundState.INTERMISSION) {
      // Can join immediately
      this.createGhost(username, ghostProfile);
      this.broadcastMessage({
        type: 'player_joined',
        username,
        arenaId: this.getArenaId()
      });
      this.checkStartConditions();
    } else {
      // Queue for next round or rejoin mid-round
      this.pendingPlayers.set(username, ghostProfile);
      this.broadcastMessage({
        type: 'player_joined',
        username,
        arenaId: this.getArenaId(),
        queued: true
      });
    }

    return { success: true, state: this.state };
  }

  removePlayer(username) {
    console.log(`[Ghost Orbits] ${username} leaving arena ${this.cartridgeId}:${this.periodId}`);

    this.ghosts.delete(username);
    this.pendingPlayers.delete(username);
    this.playerInputs.delete(username);

    this.broadcastMessage({
      type: 'player_left',
      username,
      arenaId: this.getArenaId()
    });

    // Check if round should end (no players left)
    if (this.state === RoundState.ACTIVE && this.getAliveCount() === 0) {
      this.endRound('no_players');
    }
  }

  createGhost(username, profile) {
    const spawnPos = this.getSpawnPosition(this.ghosts.size);
    const ghost = new Ghost(username, profile, spawnPos, this.arenaSize);
    this.ghosts.set(username, ghost);
  }

  spawnPendingPlayer(username) {
    const profile = this.pendingPlayers.get(username);
    if (!profile) return;

    this.pendingPlayers.delete(username);
    this.createGhost(username, profile);

    this.broadcastMessage({
      type: 'player_spawned',
      username,
      arenaId: this.getArenaId()
    });
  }

  playerEarnedStar(username) {
    // Allow rejoin if round is active and player was eliminated
    if (this.state === RoundState.ACTIVE) {
      const ghost = this.ghosts.get(username);
      if (ghost && !ghost.isAlive) {
        // Respawn the ghost
        const spawnPos = this.getSpawnPosition(this.ghosts.size);
        ghost.position = spawnPos;
        ghost.velocity = ghost.randomVelocity();
        ghost.isAlive = true;
        ghost.eliminatedBy = null;
        ghost.energy = ARENA_CONFIG.maxEnergy;
        ghost.mass = ARENA_CONFIG.baseMass * ghost.properties.mass;
        ghost.radius = ARENA_CONFIG.baseGhostRadius * Math.sqrt(ghost.mass);

        this.broadcastMessage({
          type: 'player_respawned',
          username,
          arenaId: this.getArenaId()
        });
      } else if (this.pendingPlayers.has(username)) {
        // Spawn queued player
        this.spawnPendingPlayer(username);
      }
    }
  }

  // ----------------------------------------
  // INPUT HANDLING
  // ----------------------------------------

  processInput(username, direction, thrust) {
    if (this.state !== RoundState.ACTIVE) return;

    const ghost = this.ghosts.get(username);
    if (!ghost || !ghost.isAlive) return;

    this.playerInputs.set(username, {
      direction: new Vector2(direction.x, direction.y),
      thrust
    });
  }

  // ----------------------------------------
  // ARENA CALCULATIONS
  // ----------------------------------------

  calculateArenaSize(playerCount) {
    const baseSize = ARENA_CONFIG.minArenaSize +
      (playerCount - 1) * ARENA_CONFIG.spacePerPlayer;
    return Math.min(baseSize, ARENA_CONFIG.maxArenaSize);
  }

  getSpawnPosition(playerIndex) {
    const margin = this.arenaSize * 0.1;
    const playerCount = Math.max(this.ghosts.size, 1);
    const angle = (playerIndex / playerCount) * Math.PI * 2;
    const radius = (this.arenaSize / 2) - margin;

    return new Vector2(
      this.arenaSize / 2 + Math.cos(angle) * radius,
      this.arenaSize / 2 + Math.sin(angle) * radius
    );
  }

  getArenaId() {
    return `${this.cartridgeId}:${this.periodId}`;
  }

  // ----------------------------------------
  // ROUND LIFECYCLE
  // ----------------------------------------

  checkStartConditions() {
    if (this.state !== RoundState.WAITING) return;

    const playerCount = this.ghosts.size;
    if (playerCount >= ARENA_CONFIG.minPlayersToStart) {
      this.startCountdown();
    }
  }

  startCountdown() {
    console.log(`[Ghost Orbits] Starting countdown for ${this.getArenaId()}`);

    this.state = RoundState.COUNTDOWN;
    this.countdownStartTime = Date.now();
    this.roundNumber++;

    // Resize arena for current player count
    this.arenaSize = this.calculateArenaSize(this.ghosts.size);
    this.gridWidth = Math.floor(this.arenaSize / ARENA_CONFIG.gridSize);
    this.gridHeight = Math.floor(this.arenaSize / ARENA_CONFIG.gridSize);
    this.territory = new Array(this.gridWidth * this.gridHeight).fill(null);

    // Reposition all ghosts to spawn positions
    let index = 0;
    for (const [username, ghost] of this.ghosts) {
      ghost.position = this.getSpawnPosition(index);
      ghost.velocity = new Vector2(0, 0);
      ghost.isAlive = true;
      ghost.eliminatedBy = null;
      index++;
    }

    // Clear trails
    this.trails = [];

    this.broadcastMessage({
      type: 'round_start',
      roundNumber: this.roundNumber,
      countdown: ARENA_CONFIG.countdownDuration,
      arenaSize: this.arenaSize,
      arenaId: this.getArenaId()
    });

    // Schedule round start
    setTimeout(() => this.startRound(), ARENA_CONFIG.countdownDuration);
  }

  startRound() {
    if (this.state !== RoundState.COUNTDOWN) return;

    console.log(`[Ghost Orbits] Round ${this.roundNumber} starting for ${this.getArenaId()}`);

    this.state = RoundState.ACTIVE;
    this.roundStartTime = Date.now();

    // Give initial velocity to all ghosts
    for (const [username, ghost] of this.ghosts) {
      ghost.velocity = ghost.randomVelocity();
    }

    // Start game loop
    this.startGameLoop();

    // Schedule round end
    setTimeout(() => {
      if (this.state === RoundState.ACTIVE) {
        this.endRound('time_limit');
      }
    }, ARENA_CONFIG.roundDuration);
  }

  endRound(reason) {
    if (this.state !== RoundState.ACTIVE) return;

    console.log(`[Ghost Orbits] Round ${this.roundNumber} ended: ${reason}`);

    this.state = RoundState.ENDED;
    this.stopGameLoop();

    // Calculate final results
    const results = this.calculateResults();
    this.lastRoundResults = results;

    this.broadcastMessage({
      type: 'round_end',
      roundNumber: this.roundNumber,
      reason,
      results,
      arenaId: this.getArenaId()
    });

    // Start intermission
    setTimeout(() => this.startIntermission(), 1000);
  }

  startIntermission() {
    this.state = RoundState.INTERMISSION;
    this.intermissionStartTime = Date.now();

    // Add pending players
    for (const [username, profile] of this.pendingPlayers) {
      this.createGhost(username, profile);
    }
    this.pendingPlayers.clear();

    this.broadcastMessage({
      type: 'intermission',
      duration: ARENA_CONFIG.intermissionDuration,
      arenaId: this.getArenaId()
    });

    // Schedule next countdown
    setTimeout(() => {
      if (this.ghosts.size >= ARENA_CONFIG.minPlayersToStart) {
        this.startCountdown();
      } else {
        this.state = RoundState.WAITING;
        this.broadcastMessage({
          type: 'waiting_for_players',
          arenaId: this.getArenaId()
        });
      }
    }, ARENA_CONFIG.intermissionDuration);
  }

  calculateResults() {
    const territoryPercents = new Map();
    let totalCells = this.territory.length;

    // Count territory per ghost
    const territoryCounts = new Map();
    for (const cell of this.territory) {
      if (cell) {
        territoryCounts.set(cell, (territoryCounts.get(cell) || 0) + 1);
      }
    }

    // Calculate percentages and build rankings
    const rankings = [];
    for (const [username, ghost] of this.ghosts) {
      const count = territoryCounts.get(username) || 0;
      const percent = count / totalCells;
      territoryPercents.set(username, percent);

      rankings.push({
        username,
        territory: Math.round(percent * 100),
        isAlive: ghost.isAlive,
        mass: ghost.mass
      });
    }

    // Sort by territory descending
    rankings.sort((a, b) => b.territory - a.territory);

    // Determine winner
    let winner = null;
    if (rankings.length > 0) {
      winner = rankings[0].username;
    }

    return {
      winner,
      rankings,
      roundNumber: this.roundNumber
    };
  }

  // ----------------------------------------
  // GAME LOOP
  // ----------------------------------------

  startGameLoop() {
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(), ARENA_CONFIG.tickInterval);
  }

  stopGameLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  tick() {
    if (this.state !== RoundState.ACTIVE) return;

    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;

    // Process inputs
    this.processInputs();

    // Update physics
    this.updatePhysics(deltaTime);

    // Update trails
    this.updateTrails(now);

    // Check collisions
    this.checkCollisions();

    // Update territory
    this.updateTerritory();

    // Check end conditions
    this.checkEndConditions();

    // Broadcast state
    this.broadcastState();
  }

  processInputs() {
    for (const [username, input] of this.playerInputs) {
      const ghost = this.ghosts.get(username);
      if (ghost && ghost.isAlive && input.thrust) {
        ghost.applyThrust(input.direction);
      }
    }
    // Don't clear inputs - they persist until changed
  }

  updatePhysics(deltaTime) {
    for (const [username, ghost] of this.ghosts) {
      ghost.update(deltaTime, this.arenaSize);
    }
  }

  updateTrails(now) {
    // Remove expired trails
    this.trails = this.trails.filter(trail => !trail.isExpired());

    // Add new trail segments
    for (const [username, ghost] of this.ghosts) {
      if (!ghost.isAlive) continue;

      if (now - ghost.lastTrailTime >= ARENA_CONFIG.trailSegmentInterval) {
        const segment = new TrailSegment(
          ghost.position,
          username,
          ghost.color,
          ARENA_CONFIG.baseTrailWidth * ghost.properties.trailWidth,
          ARENA_CONFIG.baseTrailDuration * ghost.properties.trailDuration
        );
        this.trails.push(segment);
        ghost.lastTrailTime = now;
      }
    }
  }

  checkCollisions() {
    const ghosts = Array.from(this.ghosts.values()).filter(g => g.isAlive);

    for (let i = 0; i < ghosts.length; i++) {
      for (let j = i + 1; j < ghosts.length; j++) {
        const ghostA = ghosts[i];
        const ghostB = ghosts[j];

        const distance = ghostA.position.distanceTo(ghostB.position);
        const minDistance = ghostA.radius + ghostB.radius;

        if (distance < minDistance) {
          this.handleCollision(ghostA, ghostB);
        }
      }
    }
  }

  handleCollision(ghostA, ghostB) {
    const massA = ghostA.mass;
    const massB = ghostB.mass;

    if (massA > massB * ARENA_CONFIG.massAbsorptionThreshold) {
      // A absorbs B
      ghostB.eliminate(ghostA.username);
      ghostA.gainMass(massB * ARENA_CONFIG.massGainRatio);

      this.broadcastMessage({
        type: 'eliminated',
        victim: ghostB.username,
        by: ghostA.username,
        arenaId: this.getArenaId()
      });
    } else if (massB > massA * ARENA_CONFIG.massAbsorptionThreshold) {
      // B absorbs A
      ghostA.eliminate(ghostB.username);
      ghostB.gainMass(massA * ARENA_CONFIG.massGainRatio);

      this.broadcastMessage({
        type: 'eliminated',
        victim: ghostA.username,
        by: ghostB.username,
        arenaId: this.getArenaId()
      });
    } else {
      // Elastic collision (similar sizes)
      this.elasticCollision(ghostA, ghostB);
    }
  }

  elasticCollision(ghostA, ghostB) {
    // Simple elastic collision
    const normal = ghostB.position.clone().sub(ghostA.position).normalize();
    const relativeVel = ghostA.velocity.clone().sub(ghostB.velocity);
    const velAlongNormal = relativeVel.x * normal.x + relativeVel.y * normal.y;

    // Only resolve if moving towards each other
    if (velAlongNormal > 0) return;

    const massSum = ghostA.mass + ghostB.mass;
    const impulseScalar = -2 * velAlongNormal / massSum;

    const impulse = normal.clone().multiply(impulseScalar);
    ghostA.velocity.add(impulse.clone().multiply(ghostB.mass));
    ghostB.velocity.sub(impulse.clone().multiply(ghostA.mass));

    // Separate ghosts
    const overlap = (ghostA.radius + ghostB.radius) - ghostA.position.distanceTo(ghostB.position);
    if (overlap > 0) {
      const separation = normal.clone().multiply(overlap / 2);
      ghostA.position.sub(separation);
      ghostB.position.add(separation);
    }
  }

  updateTerritory() {
    // Reset territory
    this.territory.fill(null);

    const now = Date.now();

    // Active trails claim cells (newer overwrites older)
    // Process oldest to newest so newer trails overwrite
    const activeTrails = this.trails
      .filter(t => !t.isExpired())
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const trail of activeTrails) {
      const cellX = Math.floor(trail.position.x / ARENA_CONFIG.gridSize);
      const cellY = Math.floor(trail.position.y / ARENA_CONFIG.gridSize);

      if (cellX >= 0 && cellX < this.gridWidth && cellY >= 0 && cellY < this.gridHeight) {
        this.territory[cellY * this.gridWidth + cellX] = trail.ownerId;
      }
    }
  }

  checkEndConditions() {
    // Check last ghost standing
    const aliveCount = this.getAliveCount();
    if (aliveCount <= 1 && this.ghosts.size > 1) {
      this.endRound('last_standing');
      return;
    }

    // Check territory threshold
    const totalCells = this.territory.length;
    const territoryCounts = new Map();

    for (const cell of this.territory) {
      if (cell) {
        territoryCounts.set(cell, (territoryCounts.get(cell) || 0) + 1);
      }
    }

    for (const [username, count] of territoryCounts) {
      if (count / totalCells >= ARENA_CONFIG.territoryThreshold) {
        this.endRound('territory_threshold');
        return;
      }
    }
  }

  getAliveCount() {
    let count = 0;
    for (const [, ghost] of this.ghosts) {
      if (ghost.isAlive) count++;
    }
    return count;
  }

  // ----------------------------------------
  // STATE SYNCHRONIZATION
  // ----------------------------------------

  broadcastState() {
    const state = this.getState();
    this.broadcastMessage({
      type: 'arena_state',
      ...state
    });
  }

  getState() {
    const ghosts = {};
    for (const [username, ghost] of this.ghosts) {
      ghosts[username] = ghost.toJSON();
    }

    // Only send non-expired trails
    const activeTrails = this.trails
      .filter(t => !t.isExpired())
      .map(t => t.toJSON());

    // Calculate territory percentages
    const territoryPercents = {};
    const totalCells = this.territory.length;
    const territoryCounts = new Map();

    for (const cell of this.territory) {
      if (cell) {
        territoryCounts.set(cell, (territoryCounts.get(cell) || 0) + 1);
      }
    }

    for (const [username] of this.ghosts) {
      const count = territoryCounts.get(username) || 0;
      territoryPercents[username] = Math.round((count / totalCells) * 100);
    }

    return {
      arenaId: this.getArenaId(),
      state: this.state,
      roundNumber: this.roundNumber,
      arenaSize: this.arenaSize,
      ghosts,
      trails: activeTrails,
      territory: this.territory,
      territoryPercents,
      playerCount: this.ghosts.size,
      aliveCount: this.getAliveCount(),
      roundTimeRemaining: this.getRoundTimeRemaining()
    };
  }

  getRoundTimeRemaining() {
    if (this.state !== RoundState.ACTIVE || !this.roundStartTime) {
      return null;
    }
    const elapsed = Date.now() - this.roundStartTime;
    return Math.max(0, ARENA_CONFIG.roundDuration - elapsed);
  }

  broadcastMessage(message) {
    if (this.broadcast) {
      this.broadcast({
        ...message,
        cartridgeId: this.cartridgeId,
        periodId: this.periodId
      });
    }
  }

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------

  destroy() {
    this.stopGameLoop();
    this.ghosts.clear();
    this.pendingPlayers.clear();
    this.playerInputs.clear();
    this.trails = [];
    this.territory = [];
  }
}

// ============================================
// ARENA MANAGER CLASS
// ============================================

class ArenaManager {
  constructor(broadcast) {
    this.arenas = new Map();  // arenaId -> Arena
    this.broadcast = broadcast;
  }

  getArenaId(cartridgeId, periodId) {
    return `${cartridgeId}:${periodId}`;
  }

  getOrCreateArena(cartridgeId, periodId) {
    const arenaId = this.getArenaId(cartridgeId, periodId);

    if (!this.arenas.has(arenaId)) {
      console.log(`[Ghost Orbits] Creating arena ${arenaId}`);
      const arena = new Arena(cartridgeId, periodId, this.broadcast);
      this.arenas.set(arenaId, arena);
    }

    return this.arenas.get(arenaId);
  }

  getArena(cartridgeId, periodId) {
    return this.arenas.get(this.getArenaId(cartridgeId, periodId));
  }

  // ----------------------------------------
  // MESSAGE HANDLERS
  // ----------------------------------------

  handleJoinArena(username, cartridgeId, periodId, ghostProfile) {
    const arena = this.getOrCreateArena(cartridgeId, periodId);
    return arena.addPlayer(username, ghostProfile);
  }

  handleLeaveArena(username, cartridgeId, periodId) {
    const arena = this.getArena(cartridgeId, periodId);
    if (arena) {
      arena.removePlayer(username);

      // Clean up empty arenas
      if (arena.ghosts.size === 0 && arena.pendingPlayers.size === 0) {
        console.log(`[Ghost Orbits] Destroying empty arena ${arena.getArenaId()}`);
        arena.destroy();
        this.arenas.delete(this.getArenaId(cartridgeId, periodId));
      }
    }
  }

  handleInput(username, cartridgeId, periodId, direction, thrust) {
    const arena = this.getArena(cartridgeId, periodId);
    if (arena) {
      arena.processInput(username, direction, thrust);
    }
  }

  handleEarnedStar(username, cartridgeId, periodId) {
    const arena = this.getArena(cartridgeId, periodId);
    if (arena) {
      arena.playerEarnedStar(username);
    }
  }

  // ----------------------------------------
  // STATE QUERIES
  // ----------------------------------------

  getArenaState(cartridgeId, periodId) {
    const arena = this.getArena(cartridgeId, periodId);
    if (arena) {
      return arena.getState();
    }
    return null;
  }

  getActiveArenas() {
    const active = [];
    for (const [arenaId, arena] of this.arenas) {
      active.push({
        arenaId,
        cartridgeId: arena.cartridgeId,
        periodId: arena.periodId,
        state: arena.state,
        playerCount: arena.ghosts.size,
        roundNumber: arena.roundNumber
      });
    }
    return active;
  }

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------

  destroyArena(cartridgeId, periodId) {
    const arenaId = this.getArenaId(cartridgeId, periodId);
    const arena = this.arenas.get(arenaId);
    if (arena) {
      arena.destroy();
      this.arenas.delete(arenaId);
    }
  }

  destroyAll() {
    for (const [, arena] of this.arenas) {
      arena.destroy();
    }
    this.arenas.clear();
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  ArenaManager,
  Arena,
  Ghost,
  Vector2,
  ARENA_CONFIG,
  RoundState
};
