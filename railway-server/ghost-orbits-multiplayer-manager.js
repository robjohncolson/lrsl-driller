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
  maxPlayersPerRoom: 2,  // 1v1 for Phase 3
  roomTimeoutMs: 600000, // 10 min inactive room cleanup

  // Timing
  tickRate: 60,           // Hz - simulation rate
  tickIntervalMs: 1000 / 60,
  snapshotRate: 20,       // Hz - network send rate
  countdownDuration: 3000, // 3 seconds

  // Match settings (Arena mode defaults)
  roundDuration: 120000,  // 2 minutes
  dotCount: 50,
  initialLives: 3,
  winThreshold: 0.90,

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

    // Input buffer for spacebar presses
    this.inputBuffer = [];
    this.lastSpacebarTime = 0;
  }

  update(dt, records) {
    if (!this.isAlive) return;

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
    if (now < this.invulnerableUntil) return false;

    this.lives--;
    this.invulnerableUntil = now + 1500; // 1.5s invulnerability

    if (this.lives <= 0) {
      this.isAlive = false;
    }
    return true;
  }

  toJSON() {
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
      invulnerable: Date.now() < this.invulnerableUntil
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
    this.ownerId = null; // null = neutral
    this.radius = 10;
    this.flipWindowUntil = 0;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      ownerId: this.ownerId
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
// ROOM CLASS
// ============================================

class MultiplayerRoom {
  constructor(roomCode, hostId, hostUsername, mode, broadcast) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.mode = mode || 'arena';
    this.broadcast = broadcast;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();

    // State
    this.state = RoomState.LOBBY;

    // Players: playerId -> { ws, username, ready, ghost }
    this.players = new Map();
    this.playerColors = ['#4488ff', '#ff4444', '#44ff44', '#ffff44'];

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
    this.ghosts = new Map();      // playerId -> MultiplayerGhost
    this.dots = [];
    this.records = [];
    this.matchStartTime = null;
    this.matchTimeRemaining = MULTIPLAYER_CONFIG.roundDuration;
    this.tick = 0;

    // Game loop
    this.tickInterval = null;
    this.lastTickTime = null;

    console.log(`[Orbits MP] Room ${roomCode} created by ${hostUsername}`);
  }

  // ----------------------------------------
  // PLAYER MANAGEMENT
  // ----------------------------------------

  addPlayer(playerId, username, ws) {
    if (this.state !== RoomState.LOBBY) {
      return { success: false, error: 'Room not in lobby state' };
    }
    if (this.players.size >= MULTIPLAYER_CONFIG.maxPlayersPerRoom) {
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

    this.lastActivity = Date.now();
    this._broadcastRoomState();

    console.log(`[Orbits MP] ${username} joined room ${this.roomCode}`);
    return { success: true };
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);
    this.ghosts.delete(playerId);

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
    this.matchTimeRemaining = MULTIPLAYER_CONFIG.roundDuration;
    this.tick = 0;

    // Initialize arena
    this._initializeArena();

    // Broadcast match start
    this._broadcastToRoom({
      type: 'orbits_match_start',
      payload: {
        seed: this.matchStartTime,
        mode: this.mode,
        arenaSize: this.arenaSize,
        players: Array.from(this.players.entries()).map(([id, p]) => ({
          playerId: id,
          username: p.username,
          color: p.color
        })),
        records: this.records.map(r => r.toJSON()),
        dots: this.dots.map(d => d.toJSON())
      }
    });

    // Start game loop
    this._startGameLoop();

    console.log(`[Orbits MP] Room ${this.roomCode} match started`);
  }

  _initializeArena() {
    // Calculate arena size based on player count
    this.arenaSize = 800;

    // Create records (orbit points) - 8 in a grid pattern
    this.records = [];
    const recordPositions = [
      { x: 0.20, y: 0.20 }, { x: 0.50, y: 0.20 }, { x: 0.80, y: 0.20 },
      { x: 0.20, y: 0.50 }, { x: 0.80, y: 0.50 },
      { x: 0.20, y: 0.80 }, { x: 0.50, y: 0.80 }, { x: 0.80, y: 0.80 }
    ];
    recordPositions.forEach((pos, i) => {
      this.records.push(new Record(
        `record_${i}`,
        pos.x * this.arenaSize,
        pos.y * this.arenaSize
      ));
    });

    // Create dots (territory) - avoid records
    this.dots = [];
    for (let i = 0; i < MULTIPLAYER_CONFIG.dotCount; i++) {
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

    // Create player ghosts at opposite corners
    const spawnPositions = [
      new Vector2(this.arenaSize * 0.15, this.arenaSize * 0.85),
      new Vector2(this.arenaSize * 0.85, this.arenaSize * 0.15)
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

    // Update match time
    this.matchTimeRemaining = MULTIPLAYER_CONFIG.roundDuration - (Date.now() - this.matchStartTime);

    // Update records (visual spin)
    for (const record of this.records) {
      record.update(dt);
    }

    // Update ghosts
    for (const [, ghost] of this.ghosts) {
      ghost.update(dt, this.records);
    }

    // Check dot collisions
    this._checkDotCollisions();

    // Check ghost-to-ghost damage via dots
    this._checkDotDamage();

    // Check end conditions
    this._checkEndConditions();

    // Broadcast snapshot at 20Hz (every 3rd tick at 60Hz)
    if (this.tick % 3 === 0) {
      this._broadcastSnapshot();
    }
  }

  _checkDotCollisions() {
    const claimRadius = MULTIPLAYER_CONFIG.dotClaimRadius;

    for (const [playerId, ghost] of this.ghosts) {
      if (!ghost.isAlive || ghost.movementState === 'ORBITING') continue;

      for (const dot of this.dots) {
        const dist = ghost.position.distanceTo(new Vector2(dot.x, dot.y));

        if (dist < claimRadius) {
          const now = Date.now();

          if (dot.ownerId === null) {
            // Claim neutral dot
            dot.ownerId = playerId;
            this._broadcastEvent('DOT_CLAIMED', { playerId, dotId: dot.id });
          } else if (dot.ownerId !== playerId) {
            // Enemy dot - check for flip window
            if (now < dot.flipWindowUntil) {
              // Within flip window, can flip
              dot.ownerId = playerId;
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

  _checkDotDamage() {
    const damageRadius = MULTIPLAYER_CONFIG.dotDamageRadius;

    for (const [playerId, ghost] of this.ghosts) {
      if (!ghost.isAlive || ghost.movementState === 'ORBITING') continue;
      if (Date.now() < ghost.invulnerableUntil) continue;

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

  _endMatch(winnerId, reason) {
    if (this.state !== RoomState.PLAYING) return;

    this.state = RoomState.ENDED;
    this._stopGameLoop();

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
      isHost: id === this.hostId
    }));

    this._broadcastToRoom({
      type: 'orbits_room_state',
      payload: {
        roomCode: this.roomCode,
        state: this.state,
        hostId: this.hostId,
        players,
        mode: this.mode,
        canStart: this.canStart()
      }
    });
  }

  _broadcastSnapshot() {
    const ghosts = [];
    for (const [, ghost] of this.ghosts) {
      ghosts.push(ghost.toJSON());
    }

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

    this._broadcastToRoom({
      type: 'orbits_snapshot',
      payload: {
        tick: this.tick,
        time: Math.max(0, this.matchTimeRemaining),
        ghosts,
        dots: this.dots.map(d => d.toJSON()),
        records: this.records.map(r => r.toJSON()),
        scores
      }
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

    // Cleanup stale rooms every minute
    this.cleanupInterval = setInterval(() => this._cleanupStaleRooms(), 60000);
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
    const room = new MultiplayerRoom(roomCode, hostId, hostUsername, mode);
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
  MULTIPLAYER_CONFIG,
  RoomState
};
