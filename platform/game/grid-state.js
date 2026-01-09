/**
 * Grid Wars State Management
 * Client-side state management for the Grid Wars game
 * Handles API calls, local state caching, and real-time updates
 */

// Default server URL (Railway production)
const DEFAULT_SERVER_URL = 'https://lrsl-driller-production.up.railway.app';

// Game config (must match server - will be fetched from server on init)
// v1.2.1: Added 3-tier activity pricing, boot bonus, visual dimming
export let GRID_WARS_CONFIG = {
  claimCost: 10,

  // v1.2.1: 3-tier activity-based pricing
  takeoverCostCold: 15,      // >10min since defender's last answer
  takeoverCostWarm: 20,      // 2-10min since defender's last answer
  takeoverCostActive: 25,    // <2min since defender's last answer

  // Legacy alias
  takeoverCostBase: 15,

  nodeClaimCost: 15,
  surgeCost: 5,
  starPoints: {
    gold: 4,
    silver: 3,
    bronze: 2,
    tin: 1
  },
  mapSize: 20,
  classGoalTarget: 200,
  classGoalBonus: 10,
  maxContiguityBonus: 5,

  // v1.2.1: Boot bonus
  bootBonus: 15,

  maxCellStrength: 3,

  // v1.2.1: Activity windows (seconds)
  activeWindowSeconds: 120,   // <2min = ACTIVE
  warmWindowSeconds: 600,     // 2-10min = WARM
  activeDrillingWindow: 120,  // Legacy alias

  // v1.2.1: Visual dimming
  dimmingMinOpacity: 0.3,
  dimmingFadeMinutes: 15,

  beaconDuration: 300,
  anchorDuration: 180,
  amplifierCharges: 5,
  amplifierBonus: 3,
  surgeDuration: 90,
  nodePositions: []
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
    this.territories = new Map(); // "x,y" -> { owner, claimed_at, strength, node_type }
    this.players = new Map();     // username -> { action_points, territories_count, largest_cluster, health, position_x, position_y, active_buffs, last_answer_at }
    this.classGoal = { current: 0, target: GRID_WARS_CONFIG.classGoalTarget };
    this.surge = null;            // { x, y, expiresIn } or null

    // Event callbacks
    // v1.2: Removed onContestationAlert (contestation system removed)
    this.onStateChange = options.onStateChange || null;
    this.onError = options.onError || null;
    this.onPointsEarned = options.onPointsEarned || null;
    this.onTerritoryChanged = options.onTerritoryChanged || null;
    this.onClassGoalReached = options.onClassGoalReached || null;
    this.onBuffAcquired = options.onBuffAcquired || null;
    this.onSurgeActivated = options.onSurgeActivated || null;
    this.onBootBonus = options.onBootBonus || null;         // v1.2.1
    this.onResyncRequest = options.onResyncRequest || null; // v1.2.1

    // v1.2.1: Sequence tracking for gap detection
    this._expectedSeq = null;
    this._lastSeq = 0;

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
      // Fetch config from server
      try {
        const configResponse = await fetch(`${this.serverUrl}/api/grid-wars/config`);
        if (configResponse.ok) {
          const serverConfig = await configResponse.json();
          Object.assign(GRID_WARS_CONFIG, serverConfig);
        }
      } catch (configErr) {
        console.warn('Failed to fetch Grid Wars config, using defaults:', configErr);
      }

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
          strength: t.strength || GRID_WARS_CONFIG.maxCellStrength,
          node_type: t.node_type || null
        });
      }

      this.players.clear();
      for (const p of state.players) {
        this.players.set(p.username, {
          action_points: p.action_points,
          territories_count: p.territories_count,
          largest_cluster: p.largest_cluster || 0,
          health: p.health || 100,
          position_x: p.position_x,
          position_y: p.position_y,
          avatar_format: p.avatar_format,
          active_buffs: p.active_buffs || {},
          last_answer_at: p.last_answer_at || null,
          updated_at: p.updated_at
        });
      }

      // Update class goal
      if (state.classGoal) {
        this.classGoal = state.classGoal;
      }

      // Update surge
      this.surge = state.surge || null;

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
      return { action_points: 0, territories_count: 0, largest_cluster: 0, health: 100 };
    }
    const player = this.players.get(this.username);
    return player || { action_points: 0, territories_count: 0, largest_cluster: 0, health: 100 };
  }

  /**
   * Get current player's largest cluster size
   */
  getLargestCluster() {
    if (!this.username) return 0;
    const player = this.players.get(this.username);
    return player?.largest_cluster || 0;
  }

  /**
   * Get class goal progress
   */
  getClassGoal() {
    return this.classGoal;
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
   * Get cost to claim/takeover a territory at position
   * v1.2: Returns { base, active, isEnemy } for activity-based pricing
   * - Inactive defender: base cost (15 pts)
   * - Active defender: active cost (25 pts)
   * - Client shows base cost; actual cost determined server-side
   */
  getClaimCostAt(x, y) {
    const owner = this.getTerritoryOwner(x, y);
    if (!owner) {
      return { cost: GRID_WARS_CONFIG.claimCost, isEnemy: false }; // Neutral = 10
    } else if (owner === this.username) {
      return null; // Own territory - can't reclaim
    } else {
      // v1.2: Return both costs so UI can show dynamic pricing info
      return {
        cost: GRID_WARS_CONFIG.takeoverCostBase,        // Show base cost (15)
        activeCost: GRID_WARS_CONFIG.takeoverCostActive, // Active defender cost (25)
        isEnemy: true,
        defender: owner
      };
    }
  }

  /**
   * Check if player can afford to claim/takeover at position
   * v1.2: Uses base cost for affordability check (actual cost may be higher for active defenders)
   */
  canAffordClaimAt(x, y) {
    const costInfo = this.getClaimCostAt(x, y);
    if (costInfo === null) return false; // Own territory
    return this.getActionPoints() >= costInfo.cost;
  }

  /**
   * Claim or takeover a territory
   * v1.2: Cost determined server-side for enemy takeover (activity-based pricing)
   */
  async claimTerritory(x, y) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    // Validate locally first
    const currentOwner = this.getTerritoryOwner(x, y);
    if (currentOwner === this.username) {
      throw new Error('You already own this territory');
    }

    const costInfo = this.getClaimCostAt(x, y);
    // Use base cost for optimistic update; server determines actual cost
    const estimatedCost = costInfo.cost;
    if (this.getActionPoints() < estimatedCost) {
      throw new Error('Insufficient action points');
    }

    // Optimistic update (may be adjusted when server responds)
    this._applyOptimisticClaim(x, y, estimatedCost, currentOwner);

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
        this._rollbackOptimisticClaim(x, y, estimatedCost);
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
      player.position_x = result.position?.x ?? result.x;
      player.position_y = result.position?.y ?? result.y;
      player.health = result.health || 100;

      // v1.2.1: Handle boot bonus
      if (result.bootBonus && result.bootBonus > 0) {
        player.action_points = result.actionPoints || result.bootBonus;
        if (this.onBootBonus) {
          this.onBootBonus({ points: result.bootBonus });
        }
      }

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
   * Get current player's active buffs
   */
  getActiveBuffs() {
    if (!this.username) return {};
    const player = this.players.get(this.username);
    return player?.active_buffs || {};
  }

  // v1.2: Removed getMyContestedCells (contestation system removed)

  /**
   * Get surge cell info
   */
  getSurge() {
    return this.surge;
  }

  // v1.2: Removed reinforceCell (contestation system removed)

  /**
   * Handle WebSocket messages for real-time updates
   */
  handleWebSocketMessage(message) {
    if (!message.gameId || message.gameId !== this.gameId) {
      return; // Not for this game
    }

    // v1.2.1: Sequence gap detection
    if (message.seq !== undefined) {
      if (message.type === 'state_snapshot') {
        // State snapshots reset our expected sequence
        this._expectedSeq = message.seq;
        this._lastSeq = message.seq;
      } else if (this._expectedSeq !== null && message.seq !== this._expectedSeq) {
        // Gap detected - request resync
        console.warn(`[GridWarsState] Sequence gap: expected ${this._expectedSeq}, got ${message.seq}`);
        this._requestResync(this._lastSeq, this._expectedSeq);
        return; // Don't process this message, wait for resync
      }
      this._lastSeq = message.seq;
      this._expectedSeq = message.seq + 1;
    }

    switch (message.type) {
      case 'territory_claimed':
        this.territories.set(`${message.x},${message.y}`, {
          owner: message.username,
          claimed_at: new Date().toISOString(),
          strength: GRID_WARS_CONFIG.maxCellStrength,
          node_type: message.nodeType || null
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
          health: 100,
          active_buffs: {}
        };
        player.action_points = message.total;
        player.last_answer_at = new Date().toISOString();
        this.players.set(message.username, player);
        if (message.username === this.username && this.onPointsEarned) {
          this.onPointsEarned({
            points: message.points,
            total: message.total,
            starType: message.starType,
            amplifierBonus: message.amplifierBonus
          });
        }
        this._emitStateChange();
        break;

      case 'grid_full_state':
      case 'state_snapshot':
        // v1.2: Full state sync from server (e.g., after reconnection)
        if (message.territories && message.players) {
          this.territories.clear();
          for (const t of message.territories) {
            this.territories.set(`${t.x},${t.y}`, {
              owner: t.owner,
              claimed_at: t.claimed_at || new Date().toISOString(),
              strength: t.strength || GRID_WARS_CONFIG.maxCellStrength,
              node_type: t.node_type || null
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
              avatar_format: p.avatar_format,
              active_buffs: p.active_buffs || {},
              last_answer_at: p.last_answer_at || null
            });
          }

          // v1.2: Also update class goal and surge from snapshot
          if (message.classGoal) {
            this.classGoal = message.classGoal;
          }
          if (message.surge) {
            this.surge = message.surge;
          }

          this._emitStateChange();
        } else {
          // No embedded data, refresh from server
          this.refreshState();
        }
        break;

      case 'grid_delta':
        // v1.2: Delta compression - apply batched updates
        if (message.updates && Array.isArray(message.updates)) {
          for (const update of message.updates) {
            // Process each update based on its type, adding gameId
            this.handleWebSocketMessage({ ...update, gameId: message.gameId });
          }
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

      case 'class_goal_updated':
        // Update class goal progress
        if (message.current !== undefined) {
          this.classGoal.current = message.current;
        }
        if (message.target !== undefined) {
          this.classGoal.target = message.target;
        }
        this._emitStateChange();
        break;

      case 'class_goal_reached':
        // Class goal achieved - all players rewarded
        this.classGoal = {
          current: message.current || this.classGoal.target,
          target: this.classGoal.target
        };
        if (this.onClassGoalReached) {
          this.onClassGoalReached({
            bonusPoints: message.bonusPoints,
            playersRewarded: message.playersRewarded
          });
        }
        this._emitStateChange();
        break;

      // v1.2: Removed contestation_started, contestation_cleared, territory_reinforced handlers

      case 'cell_flipped_neutral':
      case 'cell_decayed':
        // Remove territory
        this.territories.delete(`${message.x},${message.y}`);
        if (message.previousOwner) {
          this._updatePlayerTerritoriesCount(message.previousOwner, -1);
        }
        if (this.onTerritoryChanged) {
          this.onTerritoryChanged({ x: message.x, y: message.y, owner: null, action: 'lost' });
        }
        this._emitStateChange();
        break;

      case 'cell_strength_changed':
        // Update cell strength
        const decayingTerritory = this.territories.get(`${message.x},${message.y}`);
        if (decayingTerritory) {
          decayingTerritory.strength = message.strength;
        }
        this._emitStateChange();
        break;

      case 'buff_acquired':
        // Update player buffs
        if (message.username === this.username) {
          const myPlayer = this.players.get(this.username);
          if (myPlayer && message.buff) {
            myPlayer.active_buffs = myPlayer.active_buffs || {};
            if (message.buff.type === 'amplifier') {
              myPlayer.active_buffs.amplifier = { remaining: message.buff.charges };
            } else if (message.buff.type === 'beacon') {
              myPlayer.active_buffs.beacon = { expires: new Date(Date.now() + message.buff.duration * 1000).toISOString() };
            } else if (message.buff.type === 'anchor') {
              myPlayer.active_buffs.anchor = { expires: new Date(Date.now() + message.buff.duration * 1000).toISOString() };
            }
          }
          if (this.onBuffAcquired) {
            this.onBuffAcquired(message.buff);
          }
        }
        this._emitStateChange();
        break;

      case 'surge_activated':
        this.surge = {
          x: message.x,
          y: message.y,
          expiresIn: message.expiresIn
        };
        if (this.onSurgeActivated) {
          this.onSurgeActivated(this.surge);
        }
        this._emitStateChange();
        break;

      case 'surge_expired':
      case 'surge_claimed':
        this.surge = null;
        this._emitStateChange();
        break;

      case 'territory_lost':
        // Our territory was taken over by someone else
        if (message.username === this.username) {
          // Update local territory (it now belongs to the attacker)
          const lostTerritory = this.territories.get(`${message.x},${message.y}`);
          if (lostTerritory) {
            lostTerritory.owner = message.takenBy;
            lostTerritory.claimed_at = new Date().toISOString();
          }
          this._updatePlayerTerritoriesCount(this.username, -1);

          if (this.onTerritoryChanged) {
            this.onTerritoryChanged({
              x: message.x,
              y: message.y,
              owner: message.takenBy,
              action: 'taken',
              previousOwner: this.username
            });
          }
        }
        this._emitStateChange();
        break;
    }
  }

  /**
   * Get state for rendering
   * Returns data in format expected by GridRenderer
   * v1.2: Removed contested_by (contestation system removed)
   */
  getRenderState() {
    const territories = [];
    for (const [key, data] of this.territories) {
      const [x, y] = key.split(',').map(Number);
      // v1.2.1: Include owner's last_answer_at for visual dimming
      const ownerData = data.owner ? this.players.get(data.owner) : null;
      territories.push({
        x,
        y,
        owner: data.owner,
        strength: data.strength,
        node_type: data.node_type,
        ownerLastAnswer: ownerData?.last_answer_at || null
      });
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

    return {
      territories,
      players,
      surge: this.surge
    };
  }

  // ============================================
  // Private methods
  // ============================================

  _applyOptimisticClaim(x, y, cost, previousOwner = null) {
    // Store old territory data for potential rollback
    const oldTerritory = this.territories.get(`${x},${y}`);

    this.territories.set(`${x},${y}`, {
      owner: this.username,
      claimed_at: new Date().toISOString(),
      strength: GRID_WARS_CONFIG.maxCellStrength,
      node_type: oldTerritory?.node_type || null
    });
    this._updatePlayerPoints(-cost);
    this._updatePlayerTerritoriesCount(this.username, 1);

    // If takeover, decrement previous owner's count
    if (previousOwner) {
      this._updatePlayerTerritoriesCount(previousOwner, -1);
    }

    this._pendingActions.push({ type: 'claim', x, y, cost, previousOwner, oldTerritory });
  }

  _rollbackOptimisticClaim(x, y, cost) {
    const pendingAction = this._pendingActions.find(
      a => a.type === 'claim' && a.x === x && a.y === y
    );

    // Restore previous territory or delete
    if (pendingAction?.oldTerritory) {
      this.territories.set(`${x},${y}`, pendingAction.oldTerritory);
    } else {
      this.territories.delete(`${x},${y}`);
    }

    this._updatePlayerPoints(cost);
    this._updatePlayerTerritoriesCount(this.username, -1);

    // Restore previous owner's count if was takeover
    if (pendingAction?.previousOwner) {
      this._updatePlayerTerritoriesCount(pendingAction.previousOwner, 1);
    }

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

  /**
   * v1.2.1: Request state resync when sequence gap detected
   */
  _requestResync(lastSeq, expectedSeq) {
    console.log(`[GridWarsState] Requesting resync (last=${lastSeq}, expected=${expectedSeq})`);
    if (this.onResyncRequest) {
      this.onResyncRequest({
        type: 'resync_request',
        gameId: this.gameId,
        lastSeq,
        expectedSeq
      });
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
