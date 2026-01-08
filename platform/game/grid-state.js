/**
 * Grid Wars State Management
 * Client-side state management for the Grid Wars game
 * Handles API calls, local state caching, and real-time updates
 */

// Default server URL (Railway production)
const DEFAULT_SERVER_URL = 'https://lrsl-driller-production.up.railway.app';

// Game config (must match server)
export const GRID_WARS_CONFIG = {
  claimCost: 10,
  starPoints: {
    gold: 4,
    silver: 3,
    bronze: 2,
    tin: 1
  },
  mapSize: 20
};

/**
 * Grid Wars State Manager
 * Manages the client-side state of a Grid Wars game
 */
export class GridWarsState {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || DEFAULT_SERVER_URL;
    this.username = options.username || null;
    this.gameId = null;

    // Local state cache
    this.game = null;
    this.territories = new Map(); // "x,y" -> { owner, claimed_at, health }
    this.players = new Map();     // username -> { action_points, territories_count, health, position_x, position_y }

    // Event callbacks
    this.onStateChange = options.onStateChange || null;
    this.onError = options.onError || null;
    this.onPointsEarned = options.onPointsEarned || null;
    this.onTerritoryChanged = options.onTerritoryChanged || null;

    // Pending state for optimistic updates
    this._pendingActions = [];
  }

  /**
   * Set the current user
   */
  setUser(username) {
    this.username = username;
  }

  /**
   * Initialize connection and load game state
   */
  async init() {
    try {
      // Get or create active game
      const response = await fetch(`${this.serverUrl}/api/grid-wars/games/active`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get active game');
      }

      this.game = await response.json();
      this.gameId = this.game.game_id;

      // Load full state
      await this.refreshState();

      return this.game;
    } catch (err) {
      this._handleError('init', err);
      throw err;
    }
  }

  /**
   * Refresh full game state from server
   */
  async refreshState() {
    if (!this.gameId) {
      throw new Error('Game not initialized. Call init() first.');
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/games/${this.gameId}/state`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch game state');
      }

      const state = await response.json();

      // Update local caches
      this.game = state.game;

      this.territories.clear();
      for (const t of state.territories) {
        this.territories.set(`${t.x},${t.y}`, {
          owner: t.owner,
          claimed_at: t.claimed_at,
          health: t.health || 100
        });
      }

      this.players.clear();
      for (const p of state.players) {
        this.players.set(p.username, {
          action_points: p.action_points,
          territories_count: p.territories_count,
          health: p.health || 100,
          position_x: p.position_x,
          position_y: p.position_y,
          avatar_format: p.avatar_format,
          updated_at: p.updated_at
        });
      }

      this._emitStateChange();
      return state;
    } catch (err) {
      this._handleError('refreshState', err);
      throw err;
    }
  }

  /**
   * Get current player's action points
   */
  getActionPoints() {
    if (!this.username) return 0;
    const player = this.players.get(this.username);
    return player?.action_points || 0;
  }

  /**
   * Get current player's stats
   */
  getPlayerStats() {
    if (!this.username) {
      return { action_points: 0, territories_count: 0, health: 100 };
    }
    const player = this.players.get(this.username);
    return player || { action_points: 0, territories_count: 0, health: 100 };
  }

  /**
   * Check if a cell is owned by anyone
   */
  getTerritoryOwner(x, y) {
    const territory = this.territories.get(`${x},${y}`);
    return territory?.owner || null;
  }

  /**
   * Check if a cell is owned by current user
   */
  isOwnedByMe(x, y) {
    return this.getTerritoryOwner(x, y) === this.username;
  }

  /**
   * Check if player can afford to claim
   */
  canAffordClaim() {
    return this.getActionPoints() >= GRID_WARS_CONFIG.claimCost;
  }

  /**
   * Get cost to claim territory
   */
  getClaimCost() {
    return GRID_WARS_CONFIG.claimCost;
  }

  /**
   * Claim a territory
   */
  async claimTerritory(x, y) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    // Validate locally first
    if (this.getTerritoryOwner(x, y)) {
      throw new Error('Territory already claimed');
    }

    if (!this.canAffordClaim()) {
      throw new Error('Insufficient action points');
    }

    // Optimistic update
    const cost = GRID_WARS_CONFIG.claimCost;
    this._applyOptimisticClaim(x, y, cost);

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username,
          action: 'claim',
          x,
          y
        })
      });

      if (!response.ok) {
        const error = await response.json();
        // Rollback optimistic update
        this._rollbackOptimisticClaim(x, y, cost);
        throw new Error(error.error || 'Failed to claim territory');
      }

      const result = await response.json();

      // Notify
      if (this.onTerritoryChanged) {
        this.onTerritoryChanged({ x, y, owner: this.username, action: 'claim' });
      }

      this._emitStateChange();
      return result;
    } catch (err) {
      this._handleError('claimTerritory', err);
      throw err;
    }
  }

  /**
   * Add points (called when star is earned)
   * Can be called with starType or direct points amount
   */
  async addPoints(starType = null, pointsAmount = null) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    const body = {
      gameId: this.gameId,
      username: this.username
    };

    if (starType) {
      body.starType = starType;
    } else if (pointsAmount) {
      body.points = pointsAmount;
    } else {
      throw new Error('Either starType or pointsAmount required');
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add points');
      }

      const result = await response.json();

      // Update local cache
      const player = this.players.get(this.username) || {
        action_points: 0,
        territories_count: 0,
        structures_count: 0
      };
      player.action_points = result.newTotal;
      this.players.set(this.username, player);

      // Notify
      if (this.onPointsEarned) {
        this.onPointsEarned({
          points: result.pointsAdded,
          total: result.newTotal,
          starType
        });
      }

      this._emitStateChange();
      return result;
    } catch (err) {
      this._handleError('addPoints', err);
      throw err;
    }
  }

  /**
   * Initialize player avatar on the map
   * Auto-spawns at a calculated position based on username
   */
  async initAvatar() {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/avatar/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize avatar');
      }

      const result = await response.json();

      // Update local player state
      const player = this.players.get(this.username) || {
        action_points: 0,
        territories_count: 0,
        health: 100
      };
      player.position_x = result.x;
      player.position_y = result.y;
      player.health = result.health || 100;
      this.players.set(this.username, player);

      this._emitStateChange();
      return result;
    } catch (err) {
      this._handleError('initAvatar', err);
      throw err;
    }
  }

  /**
   * Move player avatar in a direction
   * @param {'up'|'down'|'left'|'right'} direction
   */
  async moveAvatar(direction) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    const player = this.players.get(this.username);

    // If no position, initialize first
    if (player?.position_x === undefined || player?.position_y === undefined) {
      await this.initAvatar();
      return; // First move just initializes
    }

    // Calculate new position
    let newX = player.position_x;
    let newY = player.position_y;

    switch (direction) {
      case 'up':    newY = Math.max(0, newY - 1); break;
      case 'down':  newY = Math.min(GRID_WARS_CONFIG.mapSize - 1, newY + 1); break;
      case 'left':  newX = Math.max(0, newX - 1); break;
      case 'right': newX = Math.min(GRID_WARS_CONFIG.mapSize - 1, newX + 1); break;
    }

    // Skip if no movement
    if (newX === player.position_x && newY === player.position_y) {
      return;
    }

    // Optimistic update
    player.position_x = newX;
    player.position_y = newY;
    this._emitStateChange();

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/avatar/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username,
          x: newX,
          y: newY
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move avatar');
      }

      const result = await response.json();

      // Update health from server
      player.health = result.health;
      this._emitStateChange();

      return result;
    } catch (err) {
      this._handleError('moveAvatar', err);
      // Don't throw - movement is optimistic
    }
  }

  /**
   * Get current player's position
   */
  getPlayerPosition() {
    if (!this.username) return null;
    const player = this.players.get(this.username);
    if (player?.position_x !== undefined && player?.position_y !== undefined) {
      return { x: player.position_x, y: player.position_y };
    }
    return null;
  }

  /**
   * Check if player has avatar on map
   */
  hasAvatar() {
    return this.getPlayerPosition() !== null;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    if (!this.gameId) {
      throw new Error('Game not initialized');
    }

    try {
      const response = await fetch(
        `${this.serverUrl}/api/grid-wars/leaderboard?gameId=${this.gameId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (err) {
      this._handleError('getLeaderboard', err);
      throw err;
    }
  }

  /**
   * Handle WebSocket messages for real-time updates
   */
  handleWebSocketMessage(message) {
    if (!message.gameId || message.gameId !== this.gameId) {
      return; // Not for this game
    }

    switch (message.type) {
      case 'territory_claimed':
        this.territories.set(`${message.x},${message.y}`, {
          owner: message.username,
          claimed_at: new Date().toISOString(),
          health: 100
        });
        this._updatePlayerTerritoriesCount(message.username, 1);
        if (this.onTerritoryChanged) {
          this.onTerritoryChanged(message);
        }
        this._emitStateChange();
        break;

      case 'points_earned':
        const player = this.players.get(message.username) || {
          action_points: 0,
          territories_count: 0,
          health: 100
        };
        player.action_points = message.total;
        this.players.set(message.username, player);
        if (message.username === this.username && this.onPointsEarned) {
          this.onPointsEarned({
            points: message.points,
            total: message.total,
            starType: message.starType
          });
        }
        this._emitStateChange();
        break;

      case 'grid_full_state':
        // Full state sync from server (e.g., after reconnection)
        if (message.territories && message.players) {
          this.territories.clear();
          for (const t of message.territories) {
            this.territories.set(`${t.x},${t.y}`, {
              owner: t.owner,
              claimed_at: t.claimed_at || new Date().toISOString(),
              health: t.health || 100
            });
          }

          this.players.clear();
          for (const p of message.players) {
            this.players.set(p.username, {
              action_points: p.action_points || 0,
              territories_count: p.territories_count || 0,
              health: p.health || 100,
              position_x: p.position_x,
              position_y: p.position_y,
              avatar_format: p.avatar_format
            });
          }

          this._emitStateChange();
        } else {
          // No embedded data, refresh from server
          this.refreshState();
        }
        break;

      case 'avatar_moved':
        // Update player position
        const movedPlayer = this.players.get(message.username);
        if (movedPlayer) {
          movedPlayer.position_x = message.x;
          movedPlayer.position_y = message.y;
          movedPlayer.health = message.health;
          this._emitStateChange();
        }
        break;
    }
  }

  /**
   * Get state for rendering
   * Returns data in format expected by GridRenderer
   */
  getRenderState() {
    const territories = [];
    for (const [key, data] of this.territories) {
      const [x, y] = key.split(',').map(Number);
      territories.push({ x, y, owner: data.owner, health: data.health });
    }

    const players = [];
    for (const [username, data] of this.players) {
      if (data.position_x !== undefined && data.position_y !== undefined) {
        players.push({
          username,
          x: data.position_x,
          y: data.position_y,
          health: data.health,
          avatar_format: data.avatar_format
        });
      }
    }

    return { territories, players };
  }

  // ============================================
  // Private methods
  // ============================================

  _applyOptimisticClaim(x, y, cost) {
    this.territories.set(`${x},${y}`, {
      owner: this.username,
      claimed_at: new Date().toISOString(),
      health: 100
    });
    this._updatePlayerPoints(-cost);
    this._updatePlayerTerritoriesCount(this.username, 1);
    this._pendingActions.push({ type: 'claim', x, y, cost });
  }

  _rollbackOptimisticClaim(x, y, cost) {
    this.territories.delete(`${x},${y}`);
    this._updatePlayerPoints(cost);
    this._updatePlayerTerritoriesCount(this.username, -1);
    this._pendingActions = this._pendingActions.filter(
      a => !(a.type === 'claim' && a.x === x && a.y === y)
    );
    this._emitStateChange();
  }

  _updatePlayerPoints(delta) {
    if (!this.username) return;
    const player = this.players.get(this.username) || {
      action_points: 0,
      territories_count: 0,
      health: 100
    };
    player.action_points = Math.max(0, player.action_points + delta);
    this.players.set(this.username, player);
  }

  _updatePlayerTerritoriesCount(username, delta) {
    const player = this.players.get(username) || {
      action_points: 0,
      territories_count: 0,
      health: 100
    };
    player.territories_count = Math.max(0, player.territories_count + delta);
    this.players.set(username, player);
  }

  _emitStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getRenderState());
    }
  }

  _handleError(operation, error) {
    console.error(`GridWarsState.${operation} error:`, error);
    if (this.onError) {
      this.onError({ operation, error: error.message || error });
    }
  }
}

/**
 * Singleton instance for easy import
 */
let _instance = null;

export function getGridWarsState(options = {}) {
  if (!_instance) {
    _instance = new GridWarsState(options);
  }
  return _instance;
}

export function resetGridWarsState() {
  _instance = null;
}
