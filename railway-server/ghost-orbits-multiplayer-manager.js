/**
 * Ghost Orbits - Multiplayer Manager
 * Server-authoritative game state management for online 1v1 Ghost Orbits matches.
 *
 * Architecture:
 * - Rooms identified by 6-char codes (e.g., "ABC123")
 * - Lobby state: players join, ready up, host starts
 * - Match state: server runs 60Hz simulation, broadcasts 20Hz snapshots
 * - Server-authoritative: clients send inputs only, server runs physics
 *
 * @version 1.0.0 (Phase 3)
 * @see ghost-orbits-spec.md sections 143-150
 */

// ============================================
// CONFIGURATION
// ============================================

const MULTIPLAYER_CONFIG = {
  // Room settings
  roomCodeLength: 6,
  maxPlayersPerRoom: 8,   // 8-player free-for-all
  minPlayersToStart: 2,   // Minimum players needed to start
  maxPlayersPerTeam: 6,   // For Blizzard mode
  roomTimeoutMs: 600000,  // 10 min inactive room cleanup

  // Matchmaking
  lobbyWaitTime: 20000,   // 20 seconds max wait in lobby before auto-start
  autoReadyDelay: 2000,   // 2 seconds after joining before auto-ready

  // Timing
  tickRate: 60,           // Hz - simulation rate
  tickIntervalMs: 1000 / 60,
  snapshotRate: 20,       // Hz - network send rate
  countdownDuration: 3000, // 3 seconds

  // Match settings (Arena mode defaults - scaled for 8 players)
  roundDuration: 180000,  // 3 minutes (longer for more players)
  dotCount: 100,          // More dots for 8 players
  initialLives: 3,
  winThreshold: 0.60,     // 60% territory wins (lower threshold for more players)

  // Blizzard mode settings
  blizzard: {
    arenaWidth: 1200,
    arenaHeight: 800,
    roundDuration: 300000, // 5 minutes
    scoreLimit: 15,
    mercyLead: 10,
    sphereRadius: 15,
    sphereBaseSpeed: 80,
    sphereMaxSpeed: 200,
    returnSpeedBoost: 1.1,
    touchRadius: 30,
    barrierYTop: 0.05,
    barrierYBottom: 0.95,
    wave1: { count: 3, delay: 3000, speed: 80 },
    wave2: { count: 5, delay: 2000, speed: 120 },
    wave3: { count: 8, delay: 1000, speed: 160 },
    wave1Duration: 30000,
    wave2Duration: 60000
  },

  // Collision radii (match single-player Arena for parity)
  dotClaimRadius: 15,     // How close to claim/interact with a dot
  dotDamageRadius: 15,    // How close to take damage from enemy dot

  // Input buffer
  inputBufferSize: 10,    // Max queued inputs per player
  inputGracePeriodMs: 100 // Accept inputs slightly in the past
};

// Room states
const RoomState = {
  LOBBY: 'lobby',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  ENDED: 'ended'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing chars
  let code = '';
  for (let i = 0; i < MULTIPLAYER_CONFIG.roomCodeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generatePlayerId() {
  return 'p_' + Math.random().toString(36).substring(2, 10);
}

// ============================================
// VECTOR2 CLASS
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
// PLAYER CLASS
// ============================================

class MultiplayerGhost {
  constructor(playerId, username, color, spawnPos, arenaSize) {
    this.playerId = playerId;
    this.username = username;
    this.color = color;
    this.arenaSize = arenaSize;

    // Position and velocity
    this.position = spawnPos.clone();
    this.velocity = new Vector2(0, 0);
    this.baseSpeed = 200; // px/s

    // State
    this.lives = MULTIPLAYER_CONFIG.initialLives;
    this.isAlive = true;
    this.invulnerableUntil = 0;

    // Movement state
    this.movementState = 'FREE_FLIGHT';
    this.orbitingRecordId = null;
    this.orbitAngle = 0;

    // Spin/dash state
    this.isSpinning = false;
    this.spinStartTime = 0;
    this.spinDuration = 400;  // 400ms dash
    this.isInvulnerable = false;
    this.speedBoostUntil = 0;

    // Input buffer for spacebar presses
    this.inputBuffer = [];
    this.lastSpacebarTime = 0;
  }

  update(dt, records) {
    if (!this.isAlive) return;

    const now = Date.now();

    // Update spin state
    if (this.isSpinning && now > this.spinStartTime + this.spinDuration) {
      this.isSpinning = false;
    }

    // Update invulnerability (from spin/dash)
    this.isInvulnerable = now < this.invulnerableUntil;

    // Normalize speed after boost expires
    if (now > this.speedBoostUntil && this.movementState === 'FREE_FLIGHT') {
      const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
      if (speed > this.baseSpeed * 1.1) {  // If still boosted
        const scale = this.baseSpeed / speed;
        this.velocity.x *= scale;
        this.velocity.y *= scale;
      }
    }

    if (this.movementState === 'FREE_FLIGHT') {
      // Move in current direction
      this.position.add(this.velocity.clone().multiply(dt));

      // Wall bounce
      this._handleWallBounce();

      // Check for record capture
      for (const record of records) {
        const dist = this.position.distanceTo(new Vector2(record.x, record.y));
        if (dist < record.captureRadius && this._checkSpacebarInput()) {
          this._enterOrbit(record);
          break;
        }
      }
    } else if (this.movementState === 'ORBITING') {
      // Orbit around record
      const record = records.find(r => r.id === this.orbitingRecordId);
      if (record) {
        this.orbitAngle += record.orbitSpeed * dt;
        this.position.x = record.x + Math.cos(this.orbitAngle) * record.orbitRadius;
        this.position.y = record.y + Math.sin(this.orbitAngle) * record.orbitRadius;

        // Check for launch
        if (this._checkSpacebarInput()) {
          this._exitOrbit(record);
        }
      } else {
        // Record not found, force exit
        this.movementState = 'FREE_FLIGHT';
      }
    }
  }

  _handleWallBounce() {
    const radius = 15; // Ghost visual radius
    if (this.position.x < radius) {
      this.position.x = radius;
      this.velocity.x = Math.abs(this.velocity.x);
    }
    if (this.position.x > this.arenaSize - radius) {
      this.position.x = this.arenaSize - radius;
      this.velocity.x = -Math.abs(this.velocity.x);
    }
    if (this.position.y < radius) {
      this.position.y = radius;
      this.velocity.y = Math.abs(this.velocity.y);
    }
    if (this.position.y > this.arenaSize - radius) {
      this.position.y = this.arenaSize - radius;
      this.velocity.y = -Math.abs(this.velocity.y);
    }
  }

  _checkSpacebarInput() {
    // Check if there's a recent spacebar press in buffer
    const now = Date.now();
    const recentInput = this.inputBuffer.find(
      i => i.action === 'PRESS' && now - i.timestamp < 250
    );
    if (recentInput) {
      // Consume the input
      this.inputBuffer = this.inputBuffer.filter(i => i !== recentInput);
      this.lastSpacebarTime = now;
      return true;
    }
    return false;
  }

  _enterOrbit(record) {
    this.movementState = 'ORBITING';
    this.orbitingRecordId = record.id;
    // Calculate entry angle
    const dx = this.position.x - record.x;
    const dy = this.position.y - record.y;
    this.orbitAngle = Math.atan2(dy, dx);
    this.velocity = new Vector2(0, 0);
  }

  _exitOrbit(record) {
    this.movementState = 'FREE_FLIGHT';
    this.orbitingRecordId = null;
    // Tangent launch
    const tangentAngle = this.orbitAngle + Math.PI / 2;
    const launchSpeed = record.orbitSpeed * record.orbitRadius * 1.5;
    this.velocity = Vector2.fromAngle(tangentAngle).multiply(Math.max(launchSpeed, this.baseSpeed));
  }

  addInput(input) {
    const now = Date.now();

    // Update lastSpacebarTime for any PRESS action
    // This is used by dot flip timing checks (independent of orbit logic)
    if (input.action === 'PRESS') {
      this.lastSpacebarTime = now;

      // Trigger dash/spin when in FREE_FLIGHT (not orbiting a record)
      if (this.movementState === 'FREE_FLIGHT' && !this.isSpinning) {
        this.isSpinning = true;
        this.spinStartTime = now;
        this.speedBoostUntil = now + 400;  // 400ms speed boost
        this.invulnerableUntil = now + 400;  // 400ms invulnerability

        // Apply speed boost (2.2x)
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > 0) {
          const boost = 2.2;
          this.velocity.x *= boost;
          this.velocity.y *= boost;
        }
        console.log(`[Orbits MP] Player ${this.playerId.slice(-4)} triggered DASH/SPIN (speed boost + invulnerability)`);
      }
    }

    // Add to buffer, remove old inputs
    this.inputBuffer.push({
      ...input,
      receivedAt: now
    });
    // Keep buffer small
    if (this.inputBuffer.length > MULTIPLAYER_CONFIG.inputBufferSize) {
      this.inputBuffer.shift();
    }
  }

  takeDamage() {
    const now = Date.now();
    // Check both regular invulnerability and spin invulnerability
    if (now < this.invulnerableUntil || this.isInvulnerable) return false;

    this.lives--;
    this.invulnerableUntil = now + 1500; // 1.5s invulnerability

    if (this.lives <= 0) {
      this.isAlive = false;
    }
    return true;
  }

  toJSON() {
    const now = Date.now();
    return {
      playerId: this.playerId,
      username: this.username,
      color: this.color,
      x: this.position.x,
      y: this.position.y,
      vx: this.velocity.x,
      vy: this.velocity.y,
      lives: this.lives,
      isAlive: this.isAlive,
      movementState: this.movementState,
      orbitingRecordId: this.orbitingRecordId,
      invulnerable: now < this.invulnerableUntil || this.isInvulnerable,
      isSpinning: this.isSpinning,
      spinProgress: this.isSpinning ? (now - this.spinStartTime) / this.spinDuration : 0
    };
  }
}

// ============================================
// DOT CLASS (Territory)
// ============================================

class Dot {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = 0;  // velocity x
    this.vy = 0;  // velocity y
    this.ownerId = null; // null = neutral
    this.ownerColor = null;  // for client rendering
    this.radius = 10;
    this.mass = 1.0;  // mass for physics
    this.flipWindowUntil = 0;
  }

  update(dt, arenaSize) {
    if (this.vx === 0 && this.vy === 0) return;

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wall bounce (elastic)
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius > arenaSize) {
      this.x = arenaSize - this.radius;
      this.vx = -Math.abs(this.vx);
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
    } else if (this.y + this.radius > arenaSize) {
      this.y = arenaSize - this.radius;
      this.vy = -Math.abs(this.vy);
    }

    // Friction
    this.vx *= 0.995;
    this.vy *= 0.995;

    // Stop if slow
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed < 5) {  // 5 px/s threshold
      this.vx = 0;
      this.vy = 0;
    }
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      ownerId: this.ownerId,
      ownerColor: this.ownerColor,
      radius: this.radius
    };
  }
}

// ============================================
// RECORD CLASS (Orbit Points)
// ============================================

class Record {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = 40;         // Visual radius
    this.captureRadius = 60;  // Capture trigger radius
    this.orbitRadius = 50;    // Distance ghosts orbit at
    this.orbitSpeed = 3;      // Radians per second
    this.angle = Math.random() * Math.PI * 2; // Spinning animation
  }

  update(dt) {
    this.angle += this.orbitSpeed * 0.5 * dt; // Visual spin
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
      angle: this.angle
    };
  }
}

// ============================================
// BLIZZARD SPHERE CLASS (Team-based mode)
// ============================================

class BlizzardSphere {
  constructor(id, x, y, velocityX, velocityY, config) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.radius = config?.sphereRadius || 15;
    this.speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    this.teamId = null; // null = neutral
    this.lastTouchedBy = null;
    this.returnCount = 0;
    this.maxSpeed = config?.sphereMaxSpeed || 200;
  }

  update(dt, arenaWidth, arenaHeight, barrierYTop, barrierYBottom) {
    // Move
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Bounce off side walls
    if (this.x < this.radius) {
      this.x = this.radius;
      this.velocityX = Math.abs(this.velocityX);
    } else if (this.x > arenaWidth - this.radius) {
      this.x = arenaWidth - this.radius;
      this.velocityX = -Math.abs(this.velocityX);
    }

    // Check barrier crossing (returns barrier id if crossed, null otherwise)
    const topBarrierY = arenaHeight * barrierYTop;
    const bottomBarrierY = arenaHeight * barrierYBottom;

    if (this.y < topBarrierY) {
      return { crossed: true, barrierTeam: 0 }; // Team 0's barrier (at top)
    } else if (this.y > bottomBarrierY) {
      return { crossed: true, barrierTeam: 1 }; // Team 1's barrier (at bottom)
    }

    return { crossed: false };
  }

  returnToward(targetY, speedBoost = 1.1) {
    // Redirect sphere toward target barrier
    const direction = targetY > this.y ? 1 : -1;
    this.speed = Math.min(this.speed * speedBoost, this.maxSpeed);

    // Keep some horizontal movement for variety
    const angle = (Math.random() - 0.5) * 0.3; // Small random horizontal component
    this.velocityX = Math.sin(angle) * this.speed * 0.3;
    this.velocityY = direction * this.speed * 0.95;

    this.returnCount++;
  }

  flip(newTeamId, targetY) {
    this.teamId = newTeamId;
    this.returnToward(targetY);
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      radius: this.radius,
      teamId: this.teamId,
      lastTouchedBy: this.lastTouchedBy,
      returnCount: this.returnCount
    };
  }
}

// ============================================
// ROOM CLASS
// ============================================

class MultiplayerRoom {
  constructor(roomCode, hostId, hostUsername, mode, onGlobalStateChange) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.mode = mode || 'arena';
    this.onGlobalStateChange = onGlobalStateChange || (() => {});
    this.createdAt = Date.now();
    this.lastActivity = Date.now();

    // State
    this.state = RoomState.LOBBY;

    // Players: playerId -> { ws, username, ready, ghost }
    this.players = new Map();
    // 8 distinct player colors
    this.playerColors = [
      '#4488ff', // Blue
      '#ff4444', // Red
      '#44ff44', // Green
      '#ffff44', // Yellow
      '#ff44ff', // Magenta
      '#44ffff', // Cyan
      '#ff8844', // Orange
      '#aa44ff'  // Purple
    ];

    // Add host
    this.players.set(hostId, {
      ws: null,
      username: hostUsername,
      ready: false,
      ghost: null,
      color: this.playerColors[0]
    });

    // Match state (initialized on start)
    this.arenaSize = 800;
    this.arenaWidth = 800;
    this.arenaHeight = 800;
    this.ghosts = new Map();      // playerId -> MultiplayerGhost
    this.dots = [];
    this.records = [];
    this.matchStartTime = null;
    this.matchTimeRemaining = MULTIPLAYER_CONFIG.roundDuration;
    this.tick = 0;

    // Team support (for Blizzard mode)
    this.teamAssignments = new Map(); // playerId -> teamId (0 or 1)
    this.teamScores = [0, 0];
    this.teamColors = ['#4488ff', '#ff4444']; // Blue team, Red team

    // Blizzard mode state
    this.blizzardSpheres = [];
    this.barriers = [];
    this.currentWave = 1;
    this.lastSpawnTime = 0;
    this.sphereIdCounter = 0;

    // Game loop
    this.tickInterval = null;
    this.lastTickTime = null;

    // Public matchmaking state
    this.isPublic = false;
    this.lobbyStartTime = null;
    this.lobbyTimer = null;
    this.autoReadyTimers = new Map(); // playerId -> timeout

    console.log(`[Orbits MP] Room ${roomCode} created by ${hostUsername}`);
  }

  // ----------------------------------------
  // PLAYER MANAGEMENT
  // ----------------------------------------

  addPlayer(playerId, username, ws) {
    if (this.state !== RoomState.LOBBY) {
      return { success: false, error: 'Room not in lobby state' };
    }

    // Check room capacity based on mode
    const maxPlayers = this.mode === 'blizzard'
      ? MULTIPLAYER_CONFIG.maxPlayersPerTeam * 2
      : MULTIPLAYER_CONFIG.maxPlayersPerRoom;

    if (this.players.size >= maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    const colorIndex = this.players.size;
    this.players.set(playerId, {
      ws,
      username,
      ready: false,
      ghost: null,
      color: this.playerColors[colorIndex] || '#888888'
    });

    // Auto-assign team for Blizzard mode (balance teams)
    if (this.mode === 'blizzard') {
      const team0Count = Array.from(this.teamAssignments.values()).filter(t => t === 0).length;
      const team1Count = Array.from(this.teamAssignments.values()).filter(t => t === 1).length;
      const assignedTeam = team0Count <= team1Count ? 0 : 1;
      this.teamAssignments.set(playerId, assignedTeam);
      console.log(`[Orbits MP] ${username} assigned to team ${assignedTeam}`);
    }

    this.lastActivity = Date.now();

    // For public rooms: auto-ready after delay
    if (this.isPublic) {
      const autoReadyTimer = setTimeout(() => {
        this.setPlayerReady(playerId, true);
        this._checkAutoStart();
      }, MULTIPLAYER_CONFIG.autoReadyDelay);
      this.autoReadyTimers.set(playerId, autoReadyTimer);

      // Start lobby timer when we have minimum players
      if (this.players.size >= MULTIPLAYER_CONFIG.minPlayersToStart && !this.lobbyTimer) {
        this._startLobbyTimer();
      }

      // Auto-start immediately if room is full
      if (this.players.size >= maxPlayers) {
        this._triggerAutoStart();
      }
    }

    this._broadcastRoomState();

    console.log(`[Orbits MP] ${username} joined room ${this.roomCode} (${this.players.size}/${maxPlayers})`);
    return { success: true };
  }

  /**
   * Add an AI player to the room
   * @returns {{success: boolean, error?: string}}
   */
  addAIPlayer() {
    if (this.state !== RoomState.LOBBY) {
      return { success: false, error: 'Can only add AI in lobby' };
    }

    const maxPlayers = this.mode === 'blizzard'
      ? MULTIPLAYER_CONFIG.maxPlayersPerTeam * 2
      : MULTIPLAYER_CONFIG.maxPlayersPerRoom;

    if (this.players.size >= maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    // Generate AI player
    const aiId = 'ai_' + Math.random().toString(36).substring(2, 8);
    const aiNames = ['Shadow', 'Phantom', 'Specter', 'Ghost', 'Spirit', 'Wraith', 'Shade', 'Echo'];
    const usedNames = new Set(Array.from(this.players.values()).map(p => p.username));
    let aiName = aiNames.find(n => !usedNames.has(n)) || `Bot_${this.players.size + 1}`;

    const colorIndex = this.players.size;
    this.players.set(aiId, {
      ws: null,
      username: aiName,
      ready: true, // AI is always ready
      ghost: null,
      color: this.playerColors[colorIndex] || '#888888',
      isAI: true
    });

    // Track AI players
    if (!this.aiPlayers) this.aiPlayers = new Set();
    this.aiPlayers.add(aiId);

    // Auto-assign team for Blizzard mode
    if (this.mode === 'blizzard') {
      const team0Count = Array.from(this.teamAssignments.values()).filter(t => t === 0).length;
      const team1Count = Array.from(this.teamAssignments.values()).filter(t => t === 1).length;
      const assignedTeam = team0Count <= team1Count ? 0 : 1;
      this.teamAssignments.set(aiId, assignedTeam);
    }

    this.lastActivity = Date.now();
    this._broadcastRoomState();

    console.log(`[Orbits MP] AI player ${aiName} added to room ${this.roomCode}`);

    // Check if we can auto-start now
    this._checkAutoStart();

    return { success: true, playerId: aiId };
  }

  /**
   * Start the lobby countdown timer
   * @private
   */
  _startLobbyTimer() {
    if (this.lobbyTimer) return;

    this.lobbyStartTime = Date.now();
    console.log(`[Orbits MP] Room ${this.roomCode} lobby timer started (${MULTIPLAYER_CONFIG.lobbyWaitTime}ms)`);

    this.lobbyTimer = setTimeout(() => {
      this._triggerAutoStart();
    }, MULTIPLAYER_CONFIG.lobbyWaitTime);

    // Broadcast countdown updates
    this._broadcastLobbyCountdown();
  }

  /**
   * Broadcast lobby countdown to all players
   * @private
   */
  _broadcastLobbyCountdown() {
    if (this.state !== RoomState.LOBBY || !this.lobbyStartTime) return;

    const elapsed = Date.now() - this.lobbyStartTime;
    const remaining = Math.max(0, MULTIPLAYER_CONFIG.lobbyWaitTime - elapsed);
    const secondsRemaining = Math.ceil(remaining / 1000);

    this._broadcastToRoom({
      type: 'orbits_lobby_countdown',
      payload: {
        secondsRemaining,
        playersNeeded: Math.max(0, MULTIPLAYER_CONFIG.minPlayersToStart - this.players.size),
        playerCount: this.players.size,
        maxPlayers: MULTIPLAYER_CONFIG.maxPlayersPerRoom
      }
    });

    // Continue broadcasting every second
    if (remaining > 0 && this.state === RoomState.LOBBY) {
      setTimeout(() => this._broadcastLobbyCountdown(), 1000);
    }
  }

  /**
   * Check if we should auto-start the game
   * @private
   */
  _checkAutoStart() {
    if (this.state !== RoomState.LOBBY) return;
    if (!this.isPublic) return;

    // Check if all players are ready
    let allReady = true;
    for (const [, player] of this.players) {
      if (!player.ready) {
        allReady = false;
        break;
      }
    }

    // Start if all ready and minimum players met
    if (allReady && this.players.size >= MULTIPLAYER_CONFIG.minPlayersToStart) {
      this._triggerAutoStart();
    }
  }

  /**
   * Trigger auto-start of the match
   * @private
   */
  _triggerAutoStart() {
    if (this.state !== RoomState.LOBBY) return;

    // Not enough players - reset timer and keep waiting
    if (this.players.size < MULTIPLAYER_CONFIG.minPlayersToStart) {
      console.log(`[Orbits MP] Room ${this.roomCode} not enough players (${this.players.size}/${MULTIPLAYER_CONFIG.minPlayersToStart}), resetting timer`);

      // Notify players we're still waiting
      this._broadcastToRoom({
        type: 'orbits_waiting',
        payload: {
          message: 'Waiting for more players...',
          playerCount: this.players.size,
          playersNeeded: MULTIPLAYER_CONFIG.minPlayersToStart - this.players.size
        }
      });

      // Reset the lobby timer
      this.lobbyTimer = null;
      this.lobbyStartTime = null;
      this._startLobbyTimer();
      return;
    }

    // Clear lobby timer
    if (this.lobbyTimer) {
      clearTimeout(this.lobbyTimer);
      this.lobbyTimer = null;
    }

    // Clear auto-ready timers
    for (const timer of this.autoReadyTimers.values()) {
      clearTimeout(timer);
    }
    this.autoReadyTimers.clear();

    // Mark all players as ready
    for (const [, player] of this.players) {
      player.ready = true;
    }

    console.log(`[Orbits MP] Room ${this.roomCode} auto-starting with ${this.players.size} players`);
    this.startCountdown();
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);
    this.ghosts.delete(playerId);
    this.teamAssignments.delete(playerId);

    console.log(`[Orbits MP] ${player.username} left room ${this.roomCode}`);

    // If host left, assign new host
    if (playerId === this.hostId && this.players.size > 0) {
      this.hostId = this.players.keys().next().value;
      console.log(`[Orbits MP] New host: ${this.players.get(this.hostId)?.username}`);
    }

    // If match running and only one player left, end match
    if (this.state === RoomState.PLAYING && this.players.size <= 1) {
      const remainingPlayerId = this.players.keys().next().value;
      this._endMatch(remainingPlayerId, 'opponent_left');
    }

    this._broadcastRoomState();
    this.lastActivity = Date.now();
  }

  setPlayerReady(playerId, ready) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.ready = ready;
    this.lastActivity = Date.now();
    this._broadcastRoomState();
  }

  setPlayerWs(playerId, ws) {
    const player = this.players.get(playerId);
    if (player) {
      player.ws = ws;
      // Broadcast room state so this player sees current state
      this._broadcastRoomState();
    }
  }

  // ----------------------------------------
  // MATCH LIFECYCLE
  // ----------------------------------------

  canStart() {
    if (this.state !== RoomState.LOBBY) return false;
    if (this.players.size < 2) return false;
    for (const [, player] of this.players) {
      if (!player.ready) return false;
    }
    return true;
  }

  startCountdown() {
    if (!this.canStart()) {
      return { success: false, error: 'Cannot start: not all players ready' };
    }

    this.state = RoomState.COUNTDOWN;
    this._broadcastToRoom({
      type: 'orbits_countdown',
      payload: { secondsRemaining: 3 }
    });

    // Countdown sequence
    setTimeout(() => this._broadcastToRoom({
      type: 'orbits_countdown',
      payload: { secondsRemaining: 2 }
    }), 1000);

    setTimeout(() => this._broadcastToRoom({
      type: 'orbits_countdown',
      payload: { secondsRemaining: 1 }
    }), 2000);

    setTimeout(() => this._startMatch(), MULTIPLAYER_CONFIG.countdownDuration);

    console.log(`[Orbits MP] Room ${this.roomCode} starting countdown`);
    return { success: true };
  }

  _startMatch() {
    if (this.state !== RoomState.COUNTDOWN) return;

    this.state = RoomState.PLAYING;
    this.matchStartTime = Date.now();
    this.tick = 0;

    // Notify global state change (game started)
    this.onGlobalStateChange();

    // Initialize arena based on mode
    if (this.mode === 'blizzard') {
      this._initializeBlizzardArena();
      this.matchTimeRemaining = MULTIPLAYER_CONFIG.blizzard.roundDuration;
    } else {
      this._initializeArena();
      this.matchTimeRemaining = MULTIPLAYER_CONFIG.roundDuration;
    }

    // Build players payload with team info
    const playersPayload = Array.from(this.players.entries()).map(([id, p]) => ({
      playerId: id,
      username: p.username,
      color: p.color,
      teamId: this.teamAssignments.get(id) ?? null
    }));

    // Build match start payload based on mode
    const matchStartPayload = {
      seed: this.matchStartTime,
      mode: this.mode,
      arenaSize: this.arenaSize,
      arenaWidth: this.arenaWidth,
      arenaHeight: this.arenaHeight,
      players: playersPayload,
      records: this.records.map(r => r.toJSON())
    };

    if (this.mode === 'blizzard') {
      matchStartPayload.teamAssignments = Object.fromEntries(this.teamAssignments);
      matchStartPayload.teamScores = this.teamScores;
      matchStartPayload.teamColors = this.teamColors;
      matchStartPayload.barriers = this.barriers;
      matchStartPayload.blizzardSpheres = this.blizzardSpheres.map(s => s.toJSON());
    } else {
      matchStartPayload.dots = this.dots.map(d => d.toJSON());
    }

    // Broadcast match start
    this._broadcastToRoom({
      type: 'orbits_match_start',
      payload: matchStartPayload
    });

    // Start game loop
    this._startGameLoop();

    console.log(`[Orbits MP] Room ${this.roomCode} match started (mode: ${this.mode})`);
  }

  _initializeArena() {
    // Scale arena size based on player count (larger for more players)
    const playerCount = this.players.size;
    this.arenaSize = playerCount <= 4 ? 800 : 1000;

    // Create records (orbit points) - more for larger arenas
    this.records = [];
    const recordPositions = playerCount <= 4 ? [
      // Standard 8 records for small games
      { x: 0.20, y: 0.20 }, { x: 0.50, y: 0.20 }, { x: 0.80, y: 0.20 },
      { x: 0.20, y: 0.50 }, { x: 0.80, y: 0.50 },
      { x: 0.20, y: 0.80 }, { x: 0.50, y: 0.80 }, { x: 0.80, y: 0.80 }
    ] : [
      // 12 records for 8-player games
      { x: 0.15, y: 0.15 }, { x: 0.40, y: 0.15 }, { x: 0.60, y: 0.15 }, { x: 0.85, y: 0.15 },
      { x: 0.15, y: 0.40 }, { x: 0.85, y: 0.40 },
      { x: 0.15, y: 0.60 }, { x: 0.85, y: 0.60 },
      { x: 0.15, y: 0.85 }, { x: 0.40, y: 0.85 }, { x: 0.60, y: 0.85 }, { x: 0.85, y: 0.85 }
    ];
    recordPositions.forEach((pos, i) => {
      this.records.push(new Record(
        `record_${i}`,
        pos.x * this.arenaSize,
        pos.y * this.arenaSize
      ));
    });

    // Scale dot count based on player count
    const dotCount = Math.min(MULTIPLAYER_CONFIG.dotCount, 50 + (playerCount * 10));

    // Create dots (territory) - avoid records
    this.dots = [];
    for (let i = 0; i < dotCount; i++) {
      let x, y, valid;
      let attempts = 0;
      do {
        x = Math.random() * (this.arenaSize - 100) + 50;
        y = Math.random() * (this.arenaSize - 100) + 50;
        valid = true;
        // Check distance from records
        for (const record of this.records) {
          const dist = Math.sqrt((x - record.x) ** 2 + (y - record.y) ** 2);
          if (dist < record.radius + 30) {
            valid = false;
            break;
          }
        }
        attempts++;
      } while (!valid && attempts < 100);

      this.dots.push(new Dot(`dot_${i}`, x, y));
    }

    // Create player ghosts - spawn around the edges
    // 8 spawn positions evenly distributed around the perimeter
    const spawnPositions = [
      new Vector2(this.arenaSize * 0.15, this.arenaSize * 0.15),  // Top-left
      new Vector2(this.arenaSize * 0.50, this.arenaSize * 0.10),  // Top-center
      new Vector2(this.arenaSize * 0.85, this.arenaSize * 0.15),  // Top-right
      new Vector2(this.arenaSize * 0.90, this.arenaSize * 0.50),  // Right-center
      new Vector2(this.arenaSize * 0.85, this.arenaSize * 0.85),  // Bottom-right
      new Vector2(this.arenaSize * 0.50, this.arenaSize * 0.90),  // Bottom-center
      new Vector2(this.arenaSize * 0.15, this.arenaSize * 0.85),  // Bottom-left
      new Vector2(this.arenaSize * 0.10, this.arenaSize * 0.50)   // Left-center
    ];

    this.ghosts.clear();
    let spawnIndex = 0;
    for (const [playerId, player] of this.players) {
      const ghost = new MultiplayerGhost(
        playerId,
        player.username,
        player.color,
        spawnPositions[spawnIndex % spawnPositions.length],
        this.arenaSize
      );
      // Initial velocity pointing toward center
      const toCenter = new Vector2(
        this.arenaSize / 2 - ghost.position.x,
        this.arenaSize / 2 - ghost.position.y
      ).normalize().multiply(ghost.baseSpeed * 0.5);
      ghost.velocity = toCenter;

      this.ghosts.set(playerId, ghost);
      player.ghost = ghost;
      spawnIndex++;
    }
  }

  /**
   * Initialize Blizzard mode arena (WIDE map with barriers)
   * @private
   */
  _initializeBlizzardArena() {
    const cfg = MULTIPLAYER_CONFIG.blizzard;

    // Set arena dimensions (WIDE map: 1200x800)
    this.arenaWidth = cfg.arenaWidth;
    this.arenaHeight = cfg.arenaHeight;
    this.arenaSize = Math.max(this.arenaWidth, this.arenaHeight);

    // Reset team scores
    this.teamScores = [0, 0];

    // Create barriers
    this.barriers = [
      { y: cfg.barrierYTop * this.arenaHeight, teamId: 0 },    // Team 0's barrier at top
      { y: cfg.barrierYBottom * this.arenaHeight, teamId: 1 }  // Team 1's barrier at bottom
    ];

    // Create records (6 in WIDE layout)
    this.records = [];
    const recordPositions = [
      { x: 0.15, y: 0.25 }, { x: 0.50, y: 0.25 }, { x: 0.85, y: 0.25 },
      { x: 0.15, y: 0.75 }, { x: 0.50, y: 0.75 }, { x: 0.85, y: 0.75 }
    ];
    recordPositions.forEach((pos, i) => {
      this.records.push(new Record(
        `record_${i}`,
        pos.x * this.arenaWidth,
        pos.y * this.arenaHeight
      ));
    });

    // Initialize spheres (start with wave 1)
    this.blizzardSpheres = [];
    this.currentWave = 1;
    this.lastSpawnTime = Date.now();
    this._spawnBlizzardSpheres(cfg.wave1.count, cfg.wave1.speed);

    // Create player ghosts based on team
    const team0Spawns = [
      new Vector2(this.arenaWidth * 0.25, this.arenaHeight * 0.15),
      new Vector2(this.arenaWidth * 0.50, this.arenaHeight * 0.15),
      new Vector2(this.arenaWidth * 0.75, this.arenaHeight * 0.15)
    ];
    const team1Spawns = [
      new Vector2(this.arenaWidth * 0.25, this.arenaHeight * 0.85),
      new Vector2(this.arenaWidth * 0.50, this.arenaHeight * 0.85),
      new Vector2(this.arenaWidth * 0.75, this.arenaHeight * 0.85)
    ];

    const team0Indices = { current: 0 };
    const team1Indices = { current: 0 };

    this.ghosts.clear();
    for (const [playerId, player] of this.players) {
      const teamId = this.teamAssignments.get(playerId) || 0;
      const spawns = teamId === 0 ? team0Spawns : team1Spawns;
      const indices = teamId === 0 ? team0Indices : team1Indices;
      const spawnPos = spawns[indices.current % spawns.length];
      indices.current++;

      const ghost = new MultiplayerGhost(
        playerId,
        player.username,
        this.teamColors[teamId],
        spawnPos,
        Math.max(this.arenaWidth, this.arenaHeight)
      );

      // Initial velocity pointing toward center
      const toCenter = new Vector2(
        this.arenaWidth / 2 - ghost.position.x,
        this.arenaHeight / 2 - ghost.position.y
      ).normalize().multiply(ghost.baseSpeed * 0.5);
      ghost.velocity = toCenter;

      // Store arena dimensions for wall bouncing
      ghost.arenaWidth = this.arenaWidth;
      ghost.arenaHeight = this.arenaHeight;

      this.ghosts.set(playerId, ghost);
      player.ghost = ghost;
    }

    console.log(`[Orbits MP] Blizzard arena initialized: ${this.arenaWidth}x${this.arenaHeight}, ${this.blizzardSpheres.length} spheres`);
  }

  /**
   * Spawn Blizzard spheres
   * @private
   */
  _spawnBlizzardSpheres(count, speed) {
    for (let i = 0; i < count; i++) {
      // Spawn in center third of arena
      const x = this.arenaWidth * (0.33 + Math.random() * 0.34);
      const y = this.arenaHeight * 0.5;

      // Random direction (mostly vertical)
      const angle = (Math.random() - 0.5) * 0.5; // Small horizontal variance
      const direction = Math.random() > 0.5 ? 1 : -1;
      const velocityX = Math.sin(angle) * speed * 0.3;
      const velocityY = direction * speed;

      const sphere = new BlizzardSphere(
        `sphere_${this.sphereIdCounter++}`,
        x, y,
        velocityX, velocityY,
        MULTIPLAYER_CONFIG.blizzard
      );
      this.blizzardSpheres.push(sphere);
    }
  }

  // ----------------------------------------
  // GAME LOOP
  // ----------------------------------------

  _startGameLoop() {
    this.lastTickTime = performance.now();

    this.tickInterval = setInterval(() => {
      const now = performance.now();
      const dt = (now - this.lastTickTime) / 1000; // Convert to seconds
      this.lastTickTime = now;

      this._tick(dt);
    }, MULTIPLAYER_CONFIG.tickIntervalMs);
  }

  _stopGameLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  _tick(dt) {
    if (this.state !== RoomState.PLAYING) return;

    this.tick++;

    // Update match time based on mode
    const roundDuration = this.mode === 'blizzard'
      ? MULTIPLAYER_CONFIG.blizzard.roundDuration
      : MULTIPLAYER_CONFIG.roundDuration;
    this.matchTimeRemaining = roundDuration - (Date.now() - this.matchStartTime);

    // Update records (visual spin)
    for (const record of this.records) {
      record.update(dt);
    }

    // Update ghosts
    for (const [, ghost] of this.ghosts) {
      ghost.update(dt, this.records);
    }

    // Update AI players
    this._updateAIPlayers(dt);

    // Mode-specific logic
    if (this.mode === 'blizzard') {
      this._tickBlizzard(dt);
    } else {
      // Update dots physics
      for (const dot of this.dots) {
        dot.update(dt, this.arenaSize);
      }
      // Check dot collisions
      this._checkDotCollisions();
      // Check ghost-to-ghost collisions (billiard physics)
      this._checkGhostGhostCollisions();
      // Check ghost-to-ghost damage via dots
      this._checkDotDamage();
    }

    // Check end conditions
    this._checkEndConditions();

    // Broadcast snapshot at 20Hz (every 3rd tick at 60Hz)
    if (this.tick % 3 === 0) {
      this._broadcastSnapshot();
    }
  }

  /**
   * Update AI player behavior
   * @private
   */
  _updateAIPlayers(dt) {
    if (!this.aiPlayers || this.aiPlayers.size === 0) return;

    for (const aiId of this.aiPlayers) {
      const ghost = this.ghosts.get(aiId);
      if (!ghost || !ghost.isAlive) continue;

      // AI behavior: simple target-seeking
      if (ghost.movementState === 'FREE_FLIGHT') {
        // Find nearest target based on mode
        let target = null;
        let minDist = Infinity;

        if (this.mode === 'blizzard') {
          // Target spheres
          for (const sphere of this.blizzardSpheres) {
            const dist = ghost.position.distanceTo(new Vector2(sphere.x, sphere.y));
            if (dist < minDist) {
              minDist = dist;
              target = { x: sphere.x, y: sphere.y };
            }
          }
        } else {
          // Target unclaimed or enemy dots
          for (const dot of this.dots) {
            if (dot.ownerId !== aiId) {
              const dist = ghost.position.distanceTo(new Vector2(dot.x, dot.y));
              if (dist < minDist) {
                minDist = dist;
                target = { x: dot.x, y: dot.y };
              }
            }
          }
        }

        // Steer toward target
        if (target) {
          const dx = target.x - ghost.position.x;
          const dy = target.y - ghost.position.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            // Blend current velocity with target direction (smooth steering)
            const targetVx = (dx / len) * ghost.baseSpeed;
            const targetVy = (dy / len) * ghost.baseSpeed;
            ghost.velocity.x = ghost.velocity.x * 0.95 + targetVx * 0.05;
            ghost.velocity.y = ghost.velocity.y * 0.95 + targetVy * 0.05;
          }
        }

        // Random spacebar press near dots/spheres (for claiming/flipping)
        if (minDist < 30 && Math.random() < 0.1) {
          ghost.addInput({ action: 'PRESS', timestamp: Date.now() });
        }
      } else if (ghost.movementState === 'ORBITING') {
        // Exit orbit randomly after a bit
        if (Math.random() < 0.02) {
          ghost.addInput({ action: 'PRESS', timestamp: Date.now() });
        }
      }

      // Occasionally try to enter orbit near records
      if (ghost.movementState === 'FREE_FLIGHT') {
        for (const record of this.records) {
          const dist = ghost.position.distanceTo(new Vector2(record.x, record.y));
          if (dist < record.captureRadius && Math.random() < 0.01) {
            ghost.addInput({ action: 'PRESS', timestamp: Date.now() });
            break;
          }
        }
      }
    }
  }

  /**
   * Blizzard mode tick logic
   * @private
   */
  _tickBlizzard(dt) {
    const cfg = MULTIPLAYER_CONFIG.blizzard;
    const now = Date.now();
    const elapsed = now - this.matchStartTime;

    // Update wave progression
    if (this.currentWave === 1 && elapsed > cfg.wave1Duration) {
      this.currentWave = 2;
      this._spawnBlizzardSpheres(cfg.wave2.count - cfg.wave1.count, cfg.wave2.speed);
      console.log(`[Orbits MP] Room ${this.roomCode} wave 2 started`);
    } else if (this.currentWave === 2 && elapsed > cfg.wave2Duration) {
      this.currentWave = 3;
      this._spawnBlizzardSpheres(cfg.wave3.count - cfg.wave2.count, cfg.wave3.speed);
      console.log(`[Orbits MP] Room ${this.roomCode} wave 3 started`);
    }

    // Update spheres and check barrier crossings
    const spheresToRemove = [];
    for (const sphere of this.blizzardSpheres) {
      const result = sphere.update(
        dt,
        this.arenaWidth,
        this.arenaHeight,
        cfg.barrierYTop,
        cfg.barrierYBottom
      );

      if (result.crossed) {
        // Score for the opposing team if sphere is owned by the attacking team
        const attackingTeam = result.barrierTeam === 0 ? 1 : 0; // Opposite of barrier team
        if (sphere.teamId === attackingTeam) {
          this.teamScores[attackingTeam]++;
          this._broadcastEvent('BLIZZARD_SCORE', {
            teamId: attackingTeam,
            sphereId: sphere.id,
            teamScores: this.teamScores
          });
          console.log(`[Orbits MP] Team ${attackingTeam} scored! Scores: ${this.teamScores}`);
        }
        spheresToRemove.push(sphere);
      }
    }

    // Remove scored spheres and respawn
    for (const sphere of spheresToRemove) {
      const index = this.blizzardSpheres.indexOf(sphere);
      if (index > -1) {
        this.blizzardSpheres.splice(index, 1);
      }
    }

    // Respawn spheres to maintain count
    const waveConfig = this.currentWave === 1 ? cfg.wave1 :
      this.currentWave === 2 ? cfg.wave2 : cfg.wave3;
    const spawnDelay = waveConfig.delay;
    if (this.blizzardSpheres.length < waveConfig.count && now - this.lastSpawnTime > spawnDelay) {
      this._spawnBlizzardSpheres(1, waveConfig.speed);
      this.lastSpawnTime = now;
    }

    // Check ghost-sphere collisions
    this._checkBlizzardSphereCollisions();
  }

  /**
   * Check ghost-sphere collisions in Blizzard mode
   * @private
   */
  _checkBlizzardSphereCollisions() {
    const cfg = MULTIPLAYER_CONFIG.blizzard;
    const touchRadius = cfg.touchRadius;

    for (const [playerId, ghost] of this.ghosts) {
      if (!ghost.isAlive || ghost.movementState === 'ORBITING') continue;

      const playerTeam = this.teamAssignments.get(playerId);
      const enemyBarrierY = playerTeam === 0
        ? this.arenaHeight * cfg.barrierYBottom  // Team 0 shoots toward bottom
        : this.arenaHeight * cfg.barrierYTop;    // Team 1 shoots toward top

      for (const sphere of this.blizzardSpheres) {
        const dist = ghost.position.distanceTo(new Vector2(sphere.x, sphere.y));

        if (dist < touchRadius) {
          if (sphere.teamId === null) {
            // Neutral sphere - claim and return
            sphere.teamId = playerTeam;
            sphere.lastTouchedBy = playerId;
            sphere.returnToward(enemyBarrierY, cfg.returnSpeedBoost);
            this._broadcastEvent('SPHERE_CLAIMED', {
              playerId,
              sphereId: sphere.id,
              teamId: playerTeam
            });
          } else if (sphere.teamId === playerTeam) {
            // Own sphere - boost toward enemy
            sphere.lastTouchedBy = playerId;
            sphere.returnToward(enemyBarrierY, cfg.returnSpeedBoost);
            this._broadcastEvent('SPHERE_RETURNED', {
              playerId,
              sphereId: sphere.id
            });
          } else {
            // Enemy sphere - flip it
            sphere.flip(playerTeam, enemyBarrierY);
            sphere.lastTouchedBy = playerId;
            this._broadcastEvent('SPHERE_FLIPPED', {
              playerId,
              sphereId: sphere.id,
              teamId: playerTeam
            });
          }
        }
      }
    }
  }

  /**
   * Apply billiard bump physics when a ghost collides with a dot
   * @private
   */
  _applyBumpPhysics(dot, ghost) {
    const dx = dot.x - ghost.position.x;
    const dy = dot.y - ghost.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;

    // Ghost velocity (server uses ~300 px/s, scale for physics)
    const ghostVx = ghost.velocity.x || 0;
    const ghostVy = ghost.velocity.y || 0;

    // Relative velocity along collision normal
    const relVx = ghostVx - dot.vx;
    const relVy = ghostVy - dot.vy;
    const relVelNormal = relVx * nx + relVy * ny;

    // Only bump if approaching
    if (relVelNormal <= 0) return;

    // Equal mass elastic collision: transfer velocity along normal
    const bumpScale = 0.5;  // Dampen for "underwater" feel
    dot.vx += relVelNormal * nx * bumpScale;
    dot.vy += relVelNormal * ny * bumpScale;
  }

  _checkDotCollisions() {
    const claimRadius = MULTIPLAYER_CONFIG.dotClaimRadius;

    for (const [playerId, ghost] of this.ghosts) {
      if (!ghost.isAlive || ghost.movementState === 'ORBITING') continue;

      for (const dot of this.dots) {
        const dist = ghost.position.distanceTo(new Vector2(dot.x, dot.y));

        // Debug: Log close approaches to dots (within 2x claim radius)
        if (dist < claimRadius * 2 && this.tick % 30 === 0) {
          console.log(`[Orbits MP] Ghost ${playerId.slice(-4)} near dot ${dot.id}: dist=${dist.toFixed(1)}, claimRadius=${claimRadius}, neutral=${dot.ownerId === null}`);
        }

        if (dist < claimRadius) {
          const now = Date.now();

          // Apply bump physics when ghost touches dot
          this._applyBumpPhysics(dot, ghost);

          if (dot.ownerId === null) {
            // Claim neutral dot
            dot.ownerId = playerId;
            dot.ownerColor = ghost.color;
            console.log(`[Orbits MP] Dot ${dot.id} claimed by ${playerId} with color ${ghost.color}`);
            this._broadcastEvent('DOT_CLAIMED', { playerId, dotId: dot.id });
          } else if (dot.ownerId !== playerId) {
            // Enemy dot - check for flip window
            if (now < dot.flipWindowUntil) {
              // Within flip window, can flip
              dot.ownerId = playerId;
              dot.ownerColor = ghost.color;
              dot.flipWindowUntil = 0;
              this._broadcastEvent('DOT_FLIPPED', { playerId, dotId: dot.id });
            } else {
              // Set flip window for spacebar timing
              dot.flipWindowUntil = now + 250;
            }
          }
        }
      }
    }
  }

  /**
   * Check ghost-to-ghost collisions and apply billiard physics
   * @private
   */
  _checkGhostGhostCollisions() {
    const ghostRadius = 12;  // Match client GHOST_RADIUS
    const combinedRadius = ghostRadius * 2;
    const ghostArray = Array.from(this.ghosts.values());

    for (let i = 0; i < ghostArray.length; i++) {
      for (let j = i + 1; j < ghostArray.length; j++) {
        const ghost1 = ghostArray[i];
        const ghost2 = ghostArray[j];

        if (!ghost1.isAlive || !ghost2.isAlive) continue;

        const dx = ghost2.position.x - ghost1.position.x;
        const dy = ghost2.position.y - ghost1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= combinedRadius || dist === 0) continue;

        // Collision normal (from ghost1 to ghost2)
        const nx = dx / dist;
        const ny = dy / dist;

        // Relative velocity
        const relVx = ghost1.velocity.x - ghost2.velocity.x;
        const relVy = ghost1.velocity.y - ghost2.velocity.y;
        const relVelNormal = relVx * nx + relVy * ny;

        // Only collide if approaching
        if (relVelNormal <= 0) continue;

        // Equal mass elastic collision: swap velocity components along normal
        const ghost1NormalSpeed = ghost1.velocity.x * nx + ghost1.velocity.y * ny;
        const ghost2NormalSpeed = ghost2.velocity.x * nx + ghost2.velocity.y * ny;

        ghost1.velocity.x += (ghost2NormalSpeed - ghost1NormalSpeed) * nx;
        ghost1.velocity.y += (ghost2NormalSpeed - ghost1NormalSpeed) * ny;
        ghost2.velocity.x += (ghost1NormalSpeed - ghost2NormalSpeed) * nx;
        ghost2.velocity.y += (ghost1NormalSpeed - ghost2NormalSpeed) * ny;

        // Separate ghosts to prevent sticking
        const overlap = combinedRadius - dist;
        ghost1.position.x -= nx * overlap * 0.5;
        ghost1.position.y -= ny * overlap * 0.5;
        ghost2.position.x += nx * overlap * 0.5;
        ghost2.position.y += ny * overlap * 0.5;
      }
    }
  }

  _checkDotDamage() {
    const damageRadius = MULTIPLAYER_CONFIG.dotDamageRadius;

    for (const [playerId, ghost] of this.ghosts) {
      if (!ghost.isAlive || ghost.movementState === 'ORBITING') continue;
      // Skip damage if invulnerable (includes spin invulnerability)
      if (ghost.isInvulnerable || Date.now() < ghost.invulnerableUntil) continue;

      for (const dot of this.dots) {
        if (dot.ownerId !== null && dot.ownerId !== playerId) {
          const dist = ghost.position.distanceTo(new Vector2(dot.x, dot.y));
          if (dist < damageRadius) {
            // Check if player has spacebar press to flip
            const hasFlipInput = ghost.lastSpacebarTime > Date.now() - 250;
            if (hasFlipInput && Date.now() < dot.flipWindowUntil) {
              // Successful flip - no damage
              continue;
            }

            // Take damage
            const damaged = ghost.takeDamage();
            if (damaged) {
              this._broadcastEvent('DAMAGE', {
                playerId,
                lives: ghost.lives,
                sourceId: dot.ownerId
              });
            }
          }
        }
      }
    }
  }

  _checkEndConditions() {
    if (this.mode === 'blizzard') {
      this._checkBlizzardEndConditions();
      return;
    }

    // Count territory
    const dotCounts = new Map();
    for (const [playerId] of this.players) {
      dotCounts.set(playerId, 0);
    }
    for (const dot of this.dots) {
      if (dot.ownerId && dotCounts.has(dot.ownerId)) {
        dotCounts.set(dot.ownerId, dotCounts.get(dot.ownerId) + 1);
      }
    }

    // Check territory win (90%)
    const totalDots = this.dots.length;
    for (const [playerId, count] of dotCounts) {
      if (count / totalDots >= MULTIPLAYER_CONFIG.winThreshold) {
        this._endMatch(playerId, 'territory');
        return;
      }
    }

    // Check elimination
    let aliveCount = 0;
    let lastAlive = null;
    for (const [playerId, ghost] of this.ghosts) {
      if (ghost.isAlive) {
        aliveCount++;
        lastAlive = playerId;
      }
    }
    if (aliveCount === 1 && this.ghosts.size > 1) {
      this._endMatch(lastAlive, 'elimination');
      return;
    }

    // Check timeout
    if (this.matchTimeRemaining <= 0) {
      // Winner is whoever has more dots (ties go to first player for consistency)
      let winnerId = null;
      let maxDots = -1;
      for (const [playerId, count] of dotCounts) {
        if (count > maxDots) {
          maxDots = count;
          winnerId = playerId;
        }
      }
      // If still null (no dots claimed), pick first player as winner
      if (winnerId === null && this.players.size > 0) {
        winnerId = this.players.keys().next().value;
      }
      this._endMatch(winnerId, 'timeout');
    }
  }

  /**
   * Check Blizzard mode end conditions
   * @private
   */
  _checkBlizzardEndConditions() {
    const cfg = MULTIPLAYER_CONFIG.blizzard;

    // Score limit win
    if (this.teamScores[0] >= cfg.scoreLimit) {
      this._endBlizzardMatch(0, 'score_limit');
      return;
    }
    if (this.teamScores[1] >= cfg.scoreLimit) {
      this._endBlizzardMatch(1, 'score_limit');
      return;
    }

    // Mercy rule
    const lead = Math.abs(this.teamScores[0] - this.teamScores[1]);
    if (lead >= cfg.mercyLead) {
      const winningTeam = this.teamScores[0] > this.teamScores[1] ? 0 : 1;
      this._endBlizzardMatch(winningTeam, 'mercy_rule');
      return;
    }

    // Timeout
    if (this.matchTimeRemaining <= 0) {
      // Team with more points wins
      const winningTeam = this.teamScores[0] >= this.teamScores[1] ? 0 : 1;
      this._endBlizzardMatch(winningTeam, 'timeout');
    }
  }

  /**
   * End Blizzard match with team winner
   * @private
   */
  _endBlizzardMatch(winningTeam, reason) {
    if (this.state !== RoomState.PLAYING) return;

    this.state = RoomState.ENDED;
    this._stopGameLoop();

    // Notify global state change (game ended)
    this.onGlobalStateChange();

    // Build stats per player
    const stats = {};
    for (const [playerId, player] of this.players) {
      const teamId = this.teamAssignments.get(playerId);
      stats[playerId] = {
        teamId,
        username: player.username,
        isWinner: teamId === winningTeam
      };
    }

    this._broadcastToRoom({
      type: 'orbits_match_end',
      payload: {
        winnerTeam: winningTeam,
        condition: reason,
        teamScores: this.teamScores,
        stats
      }
    });

    console.log(`[Orbits MP] Room ${this.roomCode} Blizzard match ended: Team ${winningTeam} won by ${reason}`);
  }

  _endMatch(winnerId, reason) {
    if (this.state !== RoomState.PLAYING) return;

    this.state = RoomState.ENDED;
    this._stopGameLoop();

    // Notify global state change (game ended)
    this.onGlobalStateChange();

    // Calculate final scores
    const dotCounts = new Map();
    for (const [playerId] of this.players) {
      dotCounts.set(playerId, 0);
    }
    for (const dot of this.dots) {
      if (dot.ownerId && dotCounts.has(dot.ownerId)) {
        dotCounts.set(dot.ownerId, dotCounts.get(dot.ownerId) + 1);
      }
    }

    const finalScores = {};
    const stats = {};
    for (const [playerId, player] of this.players) {
      const ghost = this.ghosts.get(playerId);
      finalScores[playerId] = dotCounts.get(playerId) || 0;
      stats[playerId] = {
        dots: dotCounts.get(playerId) || 0,
        livesRemaining: ghost?.lives || 0,
        username: player.username
      };
    }

    this._broadcastToRoom({
      type: 'orbits_match_end',
      payload: {
        winner: winnerId,
        winnerUsername: this.players.get(winnerId)?.username,
        condition: reason,
        finalScores,
        stats
      }
    });

    console.log(`[Orbits MP] Room ${this.roomCode} match ended: ${this.players.get(winnerId)?.username} won by ${reason}`);
  }

  // ----------------------------------------
  // INPUT HANDLING
  // ----------------------------------------

  handleInput(playerId, input) {
    if (this.state !== RoomState.PLAYING) return;

    const ghost = this.ghosts.get(playerId);
    if (!ghost) return;

    ghost.addInput({
      action: input.action,
      timestamp: input.t || Date.now()
    });

    this.lastActivity = Date.now();
  }

  // ----------------------------------------
  // REMATCH
  // ----------------------------------------

  voteRematch(playerId, vote) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.rematchVote = vote;
    this.lastActivity = Date.now();

    // Check if all voted yes
    let allVotedYes = true;
    for (const [, p] of this.players) {
      if (p.rematchVote !== true) {
        allVotedYes = false;
        break;
      }
    }

    if (allVotedYes && this.state === RoomState.ENDED) {
      // Reset for rematch
      this.state = RoomState.LOBBY;
      for (const [, p] of this.players) {
        p.ready = false;
        p.rematchVote = undefined;
        p.ghost = null;
      }
      this._broadcastRoomState();
      console.log(`[Orbits MP] Room ${this.roomCode} reset for rematch`);
    }
  }

  // ----------------------------------------
  // BROADCASTING
  // ----------------------------------------

  _broadcastToRoom(message) {
    const payload = JSON.stringify(message);
    for (const [, player] of this.players) {
      if (player.ws && player.ws.readyState === 1) {
        player.ws.send(payload);
      }
    }
  }

  _broadcastRoomState() {
    const players = Array.from(this.players.entries()).map(([id, p]) => ({
      playerId: id,
      username: p.username,
      ready: p.ready,
      color: p.color,
      isHost: id === this.hostId,
      isAI: p.isAI || false,
      teamId: this.teamAssignments.get(id) ?? null
    }));

    const payload = {
      roomCode: this.roomCode,
      state: this.state,
      hostId: this.hostId,
      players,
      mode: this.mode,
      canStart: this.canStart()
    };

    // Include team info for Blizzard mode
    if (this.mode === 'blizzard') {
      payload.teamAssignments = Object.fromEntries(this.teamAssignments);
      payload.teamColors = this.teamColors;
    }

    this._broadcastToRoom({
      type: 'orbits_room_state',
      payload
    });
  }

  _broadcastSnapshot() {
    const ghosts = [];
    for (const [, ghost] of this.ghosts) {
      const ghostData = ghost.toJSON();
      // Include team ID in ghost data for Blizzard mode
      if (this.mode === 'blizzard') {
        ghostData.teamId = this.teamAssignments.get(ghost.playerId);
      }
      ghosts.push(ghostData);
    }

    const payload = {
      tick: this.tick,
      time: Math.max(0, this.matchTimeRemaining),
      ghosts,
      records: this.records.map(r => r.toJSON())
    };

    if (this.mode === 'blizzard') {
      payload.blizzardSpheres = this.blizzardSpheres.map(s => s.toJSON());
      payload.teamScores = this.teamScores;
      payload.barriers = this.barriers;
      payload.currentWave = this.currentWave;
    } else {
      const scores = {};
      const dotCounts = new Map();
      for (const [playerId] of this.players) {
        dotCounts.set(playerId, 0);
      }
      for (const dot of this.dots) {
        if (dot.ownerId && dotCounts.has(dot.ownerId)) {
          dotCounts.set(dot.ownerId, dotCounts.get(dot.ownerId) + 1);
        }
      }
      for (const [playerId, count] of dotCounts) {
        scores[playerId] = count;
      }
      payload.dots = this.dots.map(d => d.toJSON());
      payload.scores = scores;
    }

    this._broadcastToRoom({
      type: 'orbits_snapshot',
      payload
    });
  }

  _broadcastEvent(event, data) {
    this._broadcastToRoom({
      type: 'orbits_event',
      payload: { event, ...data }
    });
  }

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------

  isStale() {
    return Date.now() - this.lastActivity > MULTIPLAYER_CONFIG.roomTimeoutMs;
  }

  destroy() {
    this._stopGameLoop();
    this.players.clear();
    this.ghosts.clear();
    this.dots = [];
    this.records = [];
    console.log(`[Orbits MP] Room ${this.roomCode} destroyed`);
  }
}

// ============================================
// MULTIPLAYER MANAGER CLASS
// ============================================

class OrbitsMultiplayerManager {
  constructor() {
    this.rooms = new Map();  // roomCode -> MultiplayerRoom
    this.playerRooms = new Map();  // playerId -> roomCode

    // Global broadcast callback (set by server.js)
    this.onLobbyStatusChange = null;

    // Cleanup stale rooms every minute
    this.cleanupInterval = setInterval(() => this._cleanupStaleRooms(), 60000);
  }

  /**
   * Get current public lobby status for display to all users
   * @returns {{playerCount: number, gameInProgress: boolean}}
   */
  getLobbyStatus() {
    // Find the public room (there should only be one active at a time)
    for (const [, room] of this.rooms) {
      if (room.isPublic) {
        return {
          playerCount: room.players.size,
          gameInProgress: room.state === RoomState.PLAYING || room.state === RoomState.COUNTDOWN
        };
      }
    }
    return { playerCount: 0, gameInProgress: false };
  }

  /**
   * Broadcast lobby status to all connected clients
   */
  broadcastLobbyStatus() {
    if (this.onLobbyStatusChange) {
      this.onLobbyStatusChange(this.getLobbyStatus());
    }
  }

  // ----------------------------------------
  // ROOM MANAGEMENT
  // ----------------------------------------

  createRoom(hostUsername, mode) {
    // Generate unique room code
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    const hostId = generatePlayerId();
    const room = new MultiplayerRoom(roomCode, hostId, hostUsername, mode, () => this.broadcastLobbyStatus());
    this.rooms.set(roomCode, room);
    this.playerRooms.set(hostId, roomCode);

    return {
      success: true,
      roomCode,
      playerId: hostId
    };
  }

  joinRoom(roomCode, username) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const playerId = generatePlayerId();
    const result = room.addPlayer(playerId, username, null);

    if (result.success) {
      this.playerRooms.set(playerId, roomCode);
      return {
        success: true,
        roomCode: room.roomCode,
        playerId
      };
    }

    return result;
  }

  /**
   * Quick join - find an available public room or create one
   * This is the main entry point for casual matchmaking
   * @param {string} username - Player's username
   * @param {string} [mode='arena'] - Game mode
   * @returns {{success: boolean, roomCode?: string, playerId?: string, error?: string}}
   */
  quickJoin(username, mode = 'arena') {
    // Find an existing public room with space
    for (const [roomCode, room] of this.rooms) {
      if (room.isPublic &&
          room.mode === mode &&
          room.state === RoomState.LOBBY &&
          room.players.size < MULTIPLAYER_CONFIG.maxPlayersPerRoom) {
        // Found a room with space - join it
        const playerId = generatePlayerId();
        const result = room.addPlayer(playerId, username, null);

        if (result.success) {
          this.playerRooms.set(playerId, roomCode);
          console.log(`[Orbits MP] ${username} quick-joined room ${roomCode} (${room.players.size} players)`);
          this.broadcastLobbyStatus();
          return {
            success: true,
            roomCode: room.roomCode,
            playerId
          };
        }
      }
    }

    // No available room - create a new public room
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    const hostId = generatePlayerId();
    const room = new MultiplayerRoom(roomCode, hostId, username, mode, () => this.broadcastLobbyStatus());
    room.isPublic = true;

    this.rooms.set(roomCode, room);
    this.playerRooms.set(hostId, roomCode);

    // Start lobby timer immediately for public rooms
    room._startLobbyTimer();

    console.log(`[Orbits MP] ${username} created public room ${roomCode}`);
    this.broadcastLobbyStatus();
    return {
      success: true,
      roomCode,
      playerId: hostId
    };
  }

  leaveRoom(playerId) {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (room) {
      room.removePlayer(playerId);

      // Delete room if empty
      if (room.players.size === 0) {
        room.destroy();
        this.rooms.delete(roomCode);
      }
    }

    this.playerRooms.delete(playerId);
    this.broadcastLobbyStatus();
  }

  rejoinRoom(roomCode, playerId, username, ws) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Check if this playerId exists in the room
    const existingPlayer = room.players.get(playerId);
    if (existingPlayer) {
      // Resume existing session - just update the WebSocket reference
      existingPlayer.ws = ws;
      this.playerRooms.set(playerId, roomCode);

      // Broadcast room state to sync the rejoined player
      room._broadcastRoomState();

      return {
        success: true,
        roomCode: room.roomCode,
        playerId,
        isHost: playerId === room.hostId
      };
    }

    // PlayerId not found - they may have been removed. Try fresh join if room isn't full
    if (room.players.size < MULTIPLAYER_CONFIG.maxPlayersPerRoom && room.state === RoomState.LOBBY) {
      const newPlayerId = generatePlayerId();
      const result = room.addPlayer(newPlayerId, username, ws);
      if (result.success) {
        this.playerRooms.set(newPlayerId, roomCode);
        return {
          success: true,
          roomCode: room.roomCode,
          playerId: newPlayerId,
          isHost: false
        };
      }
    }

    return { success: false, error: 'Cannot rejoin - session expired or room full' };
  }

  // ----------------------------------------
  // MESSAGE HANDLERS
  // ----------------------------------------

  handleMessage(playerId, ws, message) {
    const roomCode = this.playerRooms.get(playerId);
    const room = roomCode ? this.rooms.get(roomCode) : null;

    switch (message.type) {
      case 'orbits_ready':
        if (room) {
          room.setPlayerReady(playerId, message.payload?.ready ?? true);
        }
        break;

      case 'orbits_start':
        if (room && playerId === room.hostId) {
          const result = room.startCountdown();
          if (!result.success) {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: result.error }
            }));
          }
        }
        break;

      case 'orbits_input':
        if (room) {
          room.handleInput(playerId, message.payload);
        }
        break;

      case 'orbits_vote_rematch':
        if (room) {
          room.voteRematch(playerId, message.payload?.vote ?? true);
        }
        break;
    }
  }

  setPlayerWs(playerId, ws) {
    const roomCode = this.playerRooms.get(playerId);
    const room = roomCode ? this.rooms.get(roomCode) : null;
    if (room) {
      room.setPlayerWs(playerId, ws);
    }
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase());
  }

  getPlayerRoom(playerId) {
    const roomCode = this.playerRooms.get(playerId);
    return roomCode ? this.rooms.get(roomCode) : null;
  }

  // ----------------------------------------
  // STATS
  // ----------------------------------------

  getActiveRooms() {
    const active = [];
    for (const [roomCode, room] of this.rooms) {
      active.push({
        roomCode,
        state: room.state,
        playerCount: room.players.size,
        mode: room.mode,
        hostUsername: room.players.get(room.hostId)?.username
      });
    }
    return active;
  }

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------

  _cleanupStaleRooms() {
    const stale = [];
    for (const [roomCode, room] of this.rooms) {
      if (room.isStale()) {
        stale.push(roomCode);
      }
    }
    for (const roomCode of stale) {
      const room = this.rooms.get(roomCode);
      if (room) {
        // Remove player mappings
        for (const [playerId] of room.players) {
          this.playerRooms.delete(playerId);
        }
        room.destroy();
        this.rooms.delete(roomCode);
      }
    }
    if (stale.length > 0) {
      console.log(`[Orbits MP] Cleaned up ${stale.length} stale rooms`);
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    for (const [, room] of this.rooms) {
      room.destroy();
    }
    this.rooms.clear();
    this.playerRooms.clear();
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  OrbitsMultiplayerManager,
  MultiplayerRoom,
  MultiplayerGhost,
  BlizzardSphere,
  MULTIPLAYER_CONFIG,
  RoomState
};
