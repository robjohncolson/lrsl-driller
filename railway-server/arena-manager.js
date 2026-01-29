/**
 * Ghost Arena Multiplayer Manager
 * Persistent drop-in/drop-out multiplayer arena for ghost battles
 *
 * Features:
 * - Single persistent arena room (singleton pattern)
 * - Dynamic player join/leave with state preservation
 * - 15-second reconnect grace window
 * - Ghost backfill for solo players
 *
 * @version 1.0.0
 */

// ============================================
// CONFIGURATION
// ============================================

const ARENA_CONFIG = {
  // Reconnect handling
  reconnectGraceWindow: 15000,     // 15 seconds to reconnect
  disconnectCheckInterval: 1000,   // Check for disconnected players every second

  // Ghost backfill
  soloPlayerThreshold: 5000,       // 5 seconds alone before ghost spawns
  ghostBackfillCheckInterval: 1000, // Check for ghost backfill every second

  // Player settings
  initialLives: 3,
  maxLives: 5,
  activityTimeout: 300000,         // 5 minutes of inactivity = auto-remove

  // Spawn positioning
  spawnRadius: 0.8,                // Spawn at 80% of arena radius
  spawnJitter: 50                  // Random offset in pixels
};

// Player connection states
const ConnectionState = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting'
};

// ============================================
// PLAYER CLASS
// ============================================

/**
 * Represents a player in the arena
 */
class Player {
  constructor(playerId, playerData) {
    this.id = playerId;
    this.name = playerData.name || playerId;
    this.position = { x: 0, y: 0 };
    this.lives = ARENA_CONFIG.initialLives;
    this.isGhost = false;
    this.lastActivity = Date.now();
    this.connectionState = ConnectionState.CONNECTED;
    this.disconnectedAt = null;

    // Neural network derived properties (passed from client's ghost system)
    this.ghostProperties = playerData.ghostProperties || null;

    // Visual properties
    this.color = playerData.color || this.generateColor(playerId);
  }

  /**
   * Generate a consistent color from player ID
   */
  generateColor(playerId) {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * Update last activity timestamp
   */
  touch() {
    this.lastActivity = Date.now();
  }

  /**
   * Mark player as disconnected
   */
  disconnect() {
    this.connectionState = ConnectionState.DISCONNECTED;
    this.disconnectedAt = Date.now();
  }

  /**
   * Mark player as reconnected
   */
  reconnect() {
    this.connectionState = ConnectionState.CONNECTED;
    this.disconnectedAt = null;
    this.touch();
  }

  /**
   * Check if player is within reconnect grace window
   */
  isWithinGraceWindow() {
    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      return false;
    }
    return Date.now() - this.disconnectedAt < ARENA_CONFIG.reconnectGraceWindow;
  }

  /**
   * Check if player has been inactive too long
   */
  isInactive() {
    return Date.now() - this.lastActivity > ARENA_CONFIG.activityTimeout;
  }

  /**
   * Lose a life, return true if still alive
   */
  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives > 0;
  }

  /**
   * Serialize player state for network transmission
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      lives: this.lives,
      isGhost: this.isGhost,
      lastActivity: this.lastActivity,
      connectionState: this.connectionState,
      color: this.color,
      ghostProperties: this.ghostProperties
    };
  }
}

// ============================================
// GHOST BACKFILL CLASS
// ============================================

/**
 * AI ghost that fills in when only one human is present
 */
class GhostBackfill extends Player {
  constructor(sourcePlayer) {
    // Create ghost from source player's properties
    super(`ghost_${sourcePlayer.id}`, {
      name: `${sourcePlayer.name}'s Ghost`,
      ghostProperties: sourcePlayer.ghostProperties,
      color: sourcePlayer.color
    });

    this.isGhost = true;
    this.sourcePlayerId = sourcePlayer.id;
    this.lives = 1;  // Ghost only has one life
    this.canRespawn = false;  // Ghost never respawns
  }

  /**
   * Ghost loses life (and is permanently eliminated)
   */
  loseLife() {
    this.lives = 0;
    return false;  // Ghost is permanently dead
  }
}

// ============================================
// ARENA SINGLETON CLASS
// ============================================

/**
 * Persistent arena room - singleton pattern
 * One room always running, no lobby required
 */
class Arena {
  constructor(broadcastFn) {
    // Broadcast function for sending messages to connected clients
    this.broadcast = broadcastFn || (() => {});

    // Active players (human and ghost)
    this.players = new Map();  // playerId -> Player

    // Disconnected players awaiting reconnect
    this.disconnectedPlayers = new Map();  // playerId -> Player

    // Ghost backfill tracking
    this.ghostBackfill = null;  // Currently active ghost backfill
    this.soloSince = null;      // Timestamp when player became alone

    // Neutral dots converted from leaving players
    this.neutralDots = [];

    // Arena state
    this.arenaSize = 800;
    this.isRunning = true;

    // Start maintenance intervals
    this.startMaintenanceLoops();

    console.log('[Ghost Arena] Persistent arena initialized');
  }

  // ----------------------------------------
  // PLAYER MANAGEMENT
  // ----------------------------------------

  /**
   * Add a player to the arena
   * @param {string} playerId - Unique player identifier
   * @param {object} playerData - Player configuration { name, ghostProperties, color }
   * @returns {object} - Join result with spawn position
   */
  joinArena(playerId, playerData) {
    console.log(`[Ghost Arena] Player joining: ${playerId}`);

    // Check if this is a reconnect
    if (this.disconnectedPlayers.has(playerId)) {
      return this.handleReconnect(playerId);
    }

    // Check if already in arena
    if (this.players.has(playerId)) {
      const existing = this.players.get(playerId);
      existing.touch();
      return {
        success: true,
        reconnected: false,
        player: existing.toJSON(),
        message: 'Already in arena'
      };
    }

    // Create new player
    const player = new Player(playerId, playerData);
    player.position = this.getSpawnPosition();

    this.players.set(playerId, player);

    // Check if ghost backfill should leave
    this.checkGhostBackfillLeave();

    // Broadcast player join
    this.broadcastPlayerJoin(player);

    // Reset solo tracking since we have a new player
    this.updateSoloTracking();

    return {
      success: true,
      reconnected: false,
      player: player.toJSON(),
      spawnPosition: player.position,
      arenaSize: this.arenaSize,
      players: this.getPlayerList()
    };
  }

  /**
   * Remove a player from the arena
   * @param {string} playerId - Player to remove
   * @returns {object} - Leave result
   */
  leaveArena(playerId) {
    console.log(`[Ghost Arena] Player leaving: ${playerId}`);

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, message: 'Player not in arena' };
    }

    // Mark as disconnected and move to grace window tracking
    player.disconnect();
    this.players.delete(playerId);
    this.disconnectedPlayers.set(playerId, player);

    // Convert player's dots to neutral
    this.convertDotsToNeutral(playerId);

    // Broadcast player leave
    this.broadcastPlayerLeave(playerId);

    // Update solo tracking
    this.updateSoloTracking();

    return {
      success: true,
      message: 'Moved to reconnect grace window'
    };
  }

  /**
   * Handle a player reconnecting within grace window
   */
  handleReconnect(playerId) {
    const player = this.disconnectedPlayers.get(playerId);

    if (!player) {
      return { success: false, message: 'No disconnected player found' };
    }

    if (!player.isWithinGraceWindow()) {
      // Grace window expired, treat as new join
      this.disconnectedPlayers.delete(playerId);
      return { success: false, message: 'Grace window expired' };
    }

    console.log(`[Ghost Arena] Player reconnecting: ${playerId}`);

    // Restore player to active
    player.reconnect();
    this.disconnectedPlayers.delete(playerId);
    this.players.set(playerId, player);

    // Check if ghost should leave
    this.checkGhostBackfillLeave();

    // Broadcast reconnect
    this.broadcast({
      type: 'player_reconnected',
      playerId: playerId,
      player: player.toJSON()
    });

    // Update solo tracking
    this.updateSoloTracking();

    return {
      success: true,
      reconnected: true,
      player: player.toJSON(),
      arenaSize: this.arenaSize,
      players: this.getPlayerList()
    };
  }

  /**
   * Get spawn position for a new player
   */
  getSpawnPosition() {
    const playerCount = this.getHumanPlayerCount();
    const angle = (playerCount * Math.PI * 2) / Math.max(playerCount + 1, 4);
    const radius = (this.arenaSize / 2) * ARENA_CONFIG.spawnRadius;

    // Add some jitter to avoid exact overlaps
    const jitterX = (Math.random() - 0.5) * ARENA_CONFIG.spawnJitter;
    const jitterY = (Math.random() - 0.5) * ARENA_CONFIG.spawnJitter;

    return {
      x: this.arenaSize / 2 + Math.cos(angle) * radius + jitterX,
      y: this.arenaSize / 2 + Math.sin(angle) * radius + jitterY
    };
  }

  /**
   * Convert a leaving player's dots to neutral
   */
  convertDotsToNeutral(playerId) {
    // This would integrate with the game's dot system
    // For now, track that conversion should happen
    this.neutralDots.push({
      fromPlayerId: playerId,
      convertedAt: Date.now()
    });

    this.broadcast({
      type: 'dots_converted_neutral',
      playerId: playerId
    });
  }

  // ----------------------------------------
  // GHOST BACKFILL
  // ----------------------------------------

  /**
   * Update solo player tracking
   */
  updateSoloTracking() {
    const humanCount = this.getHumanPlayerCount();

    if (humanCount === 1) {
      if (!this.soloSince) {
        this.soloSince = Date.now();
        console.log('[Ghost Arena] Solo player detected, starting backfill timer');
      }
    } else {
      this.soloSince = null;
    }
  }

  /**
   * Check if ghost backfill should spawn
   */
  checkGhostBackfillSpawn() {
    // Only spawn if exactly 1 human and no ghost already
    if (this.getHumanPlayerCount() !== 1 || this.ghostBackfill) {
      return;
    }

    // Check if solo long enough
    if (!this.soloSince || Date.now() - this.soloSince < ARENA_CONFIG.soloPlayerThreshold) {
      return;
    }

    // Get the solo human player
    const humanPlayer = this.getHumanPlayers()[0];
    if (!humanPlayer) return;

    console.log(`[Ghost Arena] Spawning ghost backfill for ${humanPlayer.id}`);

    // Create ghost from human's properties
    this.ghostBackfill = new GhostBackfill(humanPlayer);
    this.ghostBackfill.position = this.getSpawnPosition();

    // Add to players
    this.players.set(this.ghostBackfill.id, this.ghostBackfill);

    // Broadcast ghost spawn
    this.broadcast({
      type: 'ghost_backfill_spawned',
      ghost: this.ghostBackfill.toJSON(),
      sourcePlayerId: humanPlayer.id
    });
  }

  /**
   * Check if ghost backfill should leave
   * Ghost leaves when a second human joins (after ghost's current life ends)
   */
  checkGhostBackfillLeave() {
    if (!this.ghostBackfill) return;

    // If 2+ humans, mark ghost for removal after death
    if (this.getHumanPlayerCount() >= 2) {
      console.log('[Ghost Arena] Second human joined, ghost will leave after death');

      // If ghost is already dead, remove immediately
      if (this.ghostBackfill.lives <= 0) {
        this.removeGhostBackfill();
      }
      // Otherwise, ghost continues until it dies (canRespawn is already false)
    }
  }

  /**
   * Remove ghost backfill from arena
   */
  removeGhostBackfill() {
    if (!this.ghostBackfill) return;

    const ghostId = this.ghostBackfill.id;
    console.log(`[Ghost Arena] Removing ghost backfill: ${ghostId}`);

    this.players.delete(ghostId);

    this.broadcast({
      type: 'ghost_backfill_removed',
      ghostId: ghostId
    });

    this.ghostBackfill = null;
  }

  /**
   * Handle ghost backfill death
   */
  handleGhostBackfillDeath() {
    if (!this.ghostBackfill) return;

    console.log('[Ghost Arena] Ghost backfill died');

    // Ghost never respawns
    this.removeGhostBackfill();

    // If solo again, start new timer for next ghost
    this.updateSoloTracking();
  }

  // ----------------------------------------
  // PLAYER QUERIES
  // ----------------------------------------

  /**
   * Get list of all current players (for state sync)
   */
  getPlayerList() {
    const players = [];
    for (const [id, player] of this.players) {
      players.push(player.toJSON());
    }
    return players;
  }

  /**
   * Get only human players
   */
  getHumanPlayers() {
    const humans = [];
    for (const [id, player] of this.players) {
      if (!player.isGhost) {
        humans.push(player);
      }
    }
    return humans;
  }

  /**
   * Get count of human players
   */
  getHumanPlayerCount() {
    let count = 0;
    for (const [id, player] of this.players) {
      if (!player.isGhost) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get a specific player
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Check if player is in arena
   */
  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  // ----------------------------------------
  // BROADCAST HELPERS
  // ----------------------------------------

  /**
   * Broadcast player join event
   */
  broadcastPlayerJoin(player) {
    this.broadcast({
      type: 'player_joined',
      player: player.toJSON(),
      playerCount: this.players.size,
      humanCount: this.getHumanPlayerCount()
    });
  }

  /**
   * Broadcast player leave event
   */
  broadcastPlayerLeave(playerId) {
    this.broadcast({
      type: 'player_left',
      playerId: playerId,
      playerCount: this.players.size,
      humanCount: this.getHumanPlayerCount()
    });
  }

  /**
   * Broadcast full arena state
   */
  broadcastFullState() {
    this.broadcast({
      type: 'arena_state',
      players: this.getPlayerList(),
      arenaSize: this.arenaSize,
      ghostBackfillActive: !!this.ghostBackfill
    });
  }

  // ----------------------------------------
  // MAINTENANCE
  // ----------------------------------------

  /**
   * Start background maintenance loops
   */
  startMaintenanceLoops() {
    // Check for expired disconnected players
    this.disconnectCheckInterval = setInterval(() => {
      this.cleanupDisconnectedPlayers();
    }, ARENA_CONFIG.disconnectCheckInterval);

    // Check for ghost backfill needs
    this.ghostBackfillInterval = setInterval(() => {
      this.checkGhostBackfillSpawn();
    }, ARENA_CONFIG.ghostBackfillCheckInterval);

    // Check for inactive players
    this.activityCheckInterval = setInterval(() => {
      this.cleanupInactivePlayers();
    }, 60000);  // Check every minute
  }

  /**
   * Stop maintenance loops
   */
  stopMaintenanceLoops() {
    if (this.disconnectCheckInterval) {
      clearInterval(this.disconnectCheckInterval);
    }
    if (this.ghostBackfillInterval) {
      clearInterval(this.ghostBackfillInterval);
    }
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
  }

  /**
   * Clean up players whose grace window has expired
   */
  cleanupDisconnectedPlayers() {
    const now = Date.now();
    const toRemove = [];

    for (const [playerId, player] of this.disconnectedPlayers) {
      if (!player.isWithinGraceWindow()) {
        toRemove.push(playerId);
      }
    }

    for (const playerId of toRemove) {
      console.log(`[Ghost Arena] Grace window expired for: ${playerId}`);
      this.disconnectedPlayers.delete(playerId);

      this.broadcast({
        type: 'player_grace_expired',
        playerId: playerId
      });
    }
  }

  /**
   * Clean up players who have been inactive too long
   */
  cleanupInactivePlayers() {
    const toRemove = [];

    for (const [playerId, player] of this.players) {
      if (!player.isGhost && player.isInactive()) {
        toRemove.push(playerId);
      }
    }

    for (const playerId of toRemove) {
      console.log(`[Ghost Arena] Removing inactive player: ${playerId}`);
      this.leaveArena(playerId);
    }
  }

  /**
   * Update player activity (called on input)
   */
  updatePlayerActivity(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.touch();
    }
  }

  // ----------------------------------------
  // LIFECYCLE
  // ----------------------------------------

  /**
   * Destroy the arena (cleanup)
   */
  destroy() {
    console.log('[Ghost Arena] Destroying arena');
    this.stopMaintenanceLoops();
    this.players.clear();
    this.disconnectedPlayers.clear();
    this.ghostBackfill = null;
    this.isRunning = false;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let arenaInstance = null;

/**
 * Get or create the singleton arena instance
 * @param {function} broadcastFn - Function to broadcast messages to clients
 */
function getArena(broadcastFn) {
  if (!arenaInstance) {
    arenaInstance = new Arena(broadcastFn);
  }
  return arenaInstance;
}

/**
 * Reset the arena (for testing or server restart)
 */
function resetArena() {
  if (arenaInstance) {
    arenaInstance.destroy();
    arenaInstance = null;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Singleton accessors
  getArena,
  resetArena,

  // Classes (for testing)
  Arena,
  Player,
  GhostBackfill,

  // Configuration
  ARENA_CONFIG,
  ConnectionState
};
