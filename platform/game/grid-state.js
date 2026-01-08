/**
 * Grid Wars State Management
 * Client-side state management for the Grid Wars game
 * Handles API calls, local state caching, and real-time updates
 */

// Default server URL (Railway production)
const DEFAULT_SERVER_URL = 'https://lrsl-trainer-production.up.railway.app';

// Structure costs and star points (must match server)
export const GRID_WARS_CONFIG = {
  structureCosts: {
    claim: 1,
    wall: 2,
    tower: 3,
    farm: 4,
    castle: 10
  },
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
    this.territories = new Map(); // "x,y" -> { owner, claimed_at }
    this.structures = new Map();  // "x,y" -> { structure_type, owner, health }
    this.players = new Map();     // username -> { action_points, territories_count, structures_count }

    // Event callbacks
    this.onStateChange = options.onStateChange || null;
    this.onError = options.onError || null;
    this.onPointsEarned = options.onPointsEarned || null;
    this.onTerritoryChanged = options.onTerritoryChanged || null;
    this.onStructureBuilt = options.onStructureBuilt || null;

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
          claimed_at: t.claimed_at
        });
      }

      this.structures.clear();
      for (const s of state.structures) {
        this.structures.set(`${s.x},${s.y}`, {
          structure_type: s.structure_type,
          owner: s.owner,
          health: s.health,
          built_at: s.built_at
        });
      }

      this.players.clear();
      for (const p of state.players) {
        this.players.set(p.username, {
          action_points: p.action_points,
          territories_count: p.territories_count,
          structures_count: p.structures_count,
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
      return { action_points: 0, territories_count: 0, structures_count: 0 };
    }
    const player = this.players.get(this.username);
    return player || { action_points: 0, territories_count: 0, structures_count: 0 };
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
   * Get structure at a cell
   */
  getStructure(x, y) {
    return this.structures.get(`${x},${y}`) || null;
  }

  /**
   * Check if an action is affordable
   */
  canAfford(action, structureType = null) {
    const points = this.getActionPoints();

    if (action === 'claim') {
      return points >= GRID_WARS_CONFIG.structureCosts.claim;
    }

    if (action === 'build' && structureType) {
      const cost = GRID_WARS_CONFIG.structureCosts[structureType];
      return cost !== undefined && points >= cost;
    }

    return false;
  }

  /**
   * Get cost of an action
   */
  getActionCost(action, structureType = null) {
    if (action === 'claim') {
      return GRID_WARS_CONFIG.structureCosts.claim;
    }
    if (action === 'build' && structureType) {
      return GRID_WARS_CONFIG.structureCosts[structureType] || 0;
    }
    return 0;
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

    if (!this.canAfford('claim')) {
      throw new Error('Insufficient action points');
    }

    // Optimistic update
    const cost = GRID_WARS_CONFIG.structureCosts.claim;
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
   * Build a structure
   */
  async buildStructure(x, y, structureType) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    // Validate locally first
    if (!this.isOwnedByMe(x, y)) {
      throw new Error('You must own the territory to build');
    }

    if (this.getStructure(x, y)) {
      throw new Error('Structure already exists at this location');
    }

    if (!this.canAfford('build', structureType)) {
      throw new Error('Insufficient action points');
    }

    // Optimistic update
    const cost = GRID_WARS_CONFIG.structureCosts[structureType];
    this._applyOptimisticBuild(x, y, structureType, cost);

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username,
          action: 'build',
          x,
          y,
          structureType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        // Rollback optimistic update
        this._rollbackOptimisticBuild(x, y, structureType, cost);
        throw new Error(error.error || 'Failed to build structure');
      }

      const result = await response.json();

      // Notify
      if (this.onStructureBuilt) {
        this.onStructureBuilt({ x, y, structureType, owner: this.username });
      }

      this._emitStateChange();
      return result;
    } catch (err) {
      this._handleError('buildStructure', err);
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
          claimed_at: new Date().toISOString()
        });
        this._updatePlayerTerritoriesCount(message.username, 1);
        if (this.onTerritoryChanged) {
          this.onTerritoryChanged(message);
        }
        this._emitStateChange();
        break;

      case 'structure_built':
        this.structures.set(`${message.x},${message.y}`, {
          structure_type: message.structureType,
          owner: message.username,
          health: 100,
          built_at: new Date().toISOString()
        });
        this._updatePlayerStructuresCount(message.username, 1);
        if (this.onStructureBuilt) {
          this.onStructureBuilt(message);
        }
        this._emitStateChange();
        break;

      case 'points_earned':
        const player = this.players.get(message.username) || {
          action_points: 0,
          territories_count: 0,
          structures_count: 0
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

      case 'structure_destroyed':
        this.structures.delete(`${message.x},${message.y}`);
        this._emitStateChange();
        break;

      case 'grid_full_state':
        // Full state sync from server (e.g., after reconnection)
        if (message.territories && message.structures && message.players) {
          // Apply state directly from message
          this.territories.clear();
          for (const t of message.territories) {
            this.territories.set(`${t.x},${t.y}`, {
              owner: t.owner,
              claimed_at: t.claimed_at || new Date().toISOString()
            });
          }

          this.structures.clear();
          for (const s of message.structures) {
            this.structures.set(`${s.x},${s.y}`, {
              structure_type: s.structure_type,
              owner: s.owner,
              health: s.health || 100,
              built_at: s.built_at || new Date().toISOString()
            });
          }

          this.players.clear();
          for (const p of message.players) {
            this.players.set(p.username, {
              action_points: p.action_points || 0,
              territories_count: p.territories_count || 0,
              structures_count: p.structures_count || 0
            });
          }

          this._emitStateChange();
        } else {
          // No embedded data, refresh from server
          this.refreshState();
        }
        break;

      // Wave messages (Phase 6)
      case 'wave_started':
        // Store wave state for future use
        if (this.onWaveStarted) {
          this.onWaveStarted(message);
        }
        break;

      case 'enemy_moved':
        // Update enemy positions for future use
        if (this.onEnemyMoved) {
          this.onEnemyMoved(message);
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
      territories.push({ x, y, owner: data.owner });
    }

    const structures = [];
    for (const [key, data] of this.structures) {
      const [x, y] = key.split(',').map(Number);
      structures.push({ x, y, type: data.structure_type, owner: data.owner });
    }

    return { territories, structures };
  }

  // ============================================
  // Private methods
  // ============================================

  _applyOptimisticClaim(x, y, cost) {
    this.territories.set(`${x},${y}`, {
      owner: this.username,
      claimed_at: new Date().toISOString()
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

  _applyOptimisticBuild(x, y, structureType, cost) {
    this.structures.set(`${x},${y}`, {
      structure_type: structureType,
      owner: this.username,
      health: 100,
      built_at: new Date().toISOString()
    });
    this._updatePlayerPoints(-cost);
    this._updatePlayerStructuresCount(this.username, 1);
    this._pendingActions.push({ type: 'build', x, y, structureType, cost });
  }

  _rollbackOptimisticBuild(x, y, structureType, cost) {
    this.structures.delete(`${x},${y}`);
    this._updatePlayerPoints(cost);
    this._updatePlayerStructuresCount(this.username, -1);
    this._pendingActions = this._pendingActions.filter(
      a => !(a.type === 'build' && a.x === x && a.y === y)
    );
    this._emitStateChange();
  }

  _updatePlayerPoints(delta) {
    if (!this.username) return;
    const player = this.players.get(this.username) || {
      action_points: 0,
      territories_count: 0,
      structures_count: 0
    };
    player.action_points = Math.max(0, player.action_points + delta);
    this.players.set(this.username, player);
  }

  _updatePlayerTerritoriesCount(username, delta) {
    const player = this.players.get(username) || {
      action_points: 0,
      territories_count: 0,
      structures_count: 0
    };
    player.territories_count = Math.max(0, player.territories_count + delta);
    this.players.set(username, player);
  }

  _updatePlayerStructuresCount(username, delta) {
    const player = this.players.get(username) || {
      action_points: 0,
      territories_count: 0,
      structures_count: 0
    };
    player.structures_count = Math.max(0, player.structures_count + delta);
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
