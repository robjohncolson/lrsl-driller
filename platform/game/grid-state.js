/**
 * Grid Wars State Management
 * Client-side state management for the Grid Wars game
 * Handles API calls, local state caching, and real-time updates
 */

// Default server URL (Railway production)
const DEFAULT_SERVER_URL = 'https://lrsl-driller-production.up.railway.app';

// Game config (must match server - will be fetched from server on init)
// v1.3: Updated activity windows, added spam prevention
// v2.1.3: Updated defaults to match server config (40 claim cost, etc.)
export let GRID_WARS_CONFIG = {
  claimCost: 40,

  // v1.3: 3-tier activity-based pricing
  takeoverCostCold: 60,      // >8min since defender's last answer
  takeoverCostWarm: 80,      // 3-8min since defender's last answer
  takeoverCostActive: 100,   // <3min since defender's last answer

  // Legacy alias
  takeoverCostBase: 60,

  nodeClaimCost: 60,
  surgeCost: 20,
  starPoints: {
    gold: 4,
    silver: 3,
    bronze: 2,
    tin: 1
  },
  mapSize: 8,  // v1.6.2: Default to 8x8 (v1.6 config)
  classGoalTarget: 50,  // v1.6.2: Adjusted for 64 cells (was 200)
  classGoalBonus: 10,
  maxContiguityBonus: 5,

  // v1.2.1: Boot bonus (v2.1.3: updated to match server)
  bootBonus: 30,

  maxCellStrength: 3,

  // v1.3: Activity windows (seconds)
  activeWindowSeconds: 180,   // <3min = ACTIVE
  warmWindowSeconds: 480,     // 3-8min = WARM
  activeDrillingWindow: 120,  // Legacy alias

  // v1.2.1: Visual dimming
  dimmingMinOpacity: 0.3,
  dimmingFadeMinutes: 15,

  beaconDuration: 300,
  anchorDuration: 180,
  amplifierCharges: 5,
  amplifierBonus: 3,
  surgeDuration: 90,
  nodePositions: [],

  // v1.3: Spam prevention
  spamWindowSeconds: 60,
  spamThreshold: 3,
  spamCooldownSeconds: 30,

  // v1.3: Soft point ceiling
  pointCeilingEnabled: true,
  pointCeilingScaleFactor: 0.1,
  pointCeilingMinPoints: 10,

  // v1.3: AFK erosion
  afkThresholdSeconds: 900,
  afkErosionIntervalMs: 60000,
  afkErosionStrength: 1,

  // v2.0: Hierarchical subdivision defaults
  hierarchyEnabled: true,
  maxSubdivisionLevel: 2,
  developmentCost: 100,
  drillCost: 75,
  drillSaturationThreshold: 85,
  ownerRetentionCells: ['d4', 'd5', 'e4', 'e5'],
  attackerDrillCell: 'a1'
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

    // v1.5: Scarcity and combat state
    this.scarcityPhase = null;    // { phase, multiplier, message } or null
    this.bountyTargets = [];      // Array of usernames with bounties
    this.velocityTier = null;     // { tier, discount, velocity } - current player's velocity

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
    this.onClaimStatusChange = options.onClaimStatusChange || null; // v1.2.1
    this.onCooldownChange = options.onCooldownChange || null; // v1.3
    this.onSystemEvent = options.onSystemEvent || null;     // v1.3.1
    this.onSessionEnded = options.onSessionEnded || null;   // v1.3.2
    this.onSessionResumed = options.onSessionResumed || null; // v1.3.2
    this.onGameReset = options.onGameReset || null;         // v1.3.2
    this.onBountyClaimed = options.onBountyClaimed || null; // v1.5
    this.onAfkDecay = options.onAfkDecay || null;           // v1.5
    this.onScarcityChange = options.onScarcityChange || null; // v1.5
    this.onLeaderboardUpdate = options.onLeaderboardUpdate || null; // v1.6

    // v1.3.2: Session state
    this._sessionFrozen = false;
    this._sessionSummary = null;

    // v1.2.1: Sequence tracking for gap detection
    this._expectedSeq = null;
    this._lastSeq = 0;

    // v1.2.1: Claim ID counter for tracking pending claims
    this._claimIdCounter = 0;

    // Pending state for optimistic updates
    this._pendingActions = [];

    // v1.3: Spam prevention cooldown tracking
    this._cooldownUntil = null;

    // v1.3: Action ID reconciliation - resync handling
    this._resyncInProgress = false;
    this._pendingActionsQueue = [];

    // v2.0: Hierarchy navigation state
    this.currentParent = null;    // null = root level, "d5" = inside d5
    this.currentLevel = 0;

    // v2.2: Player colors and subcell summaries for mini-mosaic rendering
    this.playerColors = {};       // { username: "#FF3366" }
    this.subcellSummaries = {};   // { "d5": [[{owner, is_developed}, ...], ...] }
    this.breadcrumb = [];         // ["d5", "c3"] for d5.c3
    this.parentCell = null;       // Parent cell info when zoomed in

    // v2.0: Hierarchy event callbacks
    this.onCellDeveloped = options.onCellDeveloped || null;
    this.onCellDrilled = options.onCellDrilled || null;
    this.onNavigate = options.onNavigate || null;
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
   * v2.0: Supports hierarchy navigation via parent parameter
   */
  async refreshState() {
    if (!this.gameId) {
      throw new Error('Game not initialized. Call init() first.');
    }

    try {
      // v2.0: Include parent in request URL for hierarchy support
      let url = `${this.serverUrl}/api/grid-wars/games/${this.gameId}/state`;
      if (this.currentParent) {
        url += `?parent=${encodeURIComponent(this.currentParent)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch game state');
      }

      const state = await response.json();

      // v2.1.2: Debug logging for state response
      console.log('[GridWarsState] refreshState response:', {
        territoriesCount: state.territories?.length || 0,
        playersCount: state.players?.length || 0,
        currentLevel: state.currentLevel,
        gameId: state.game?.id
      });

      // Update local caches
      this.game = state.game;

      // v2.0: Update hierarchy navigation state
      if (state.currentLevel !== undefined) {
        this.currentLevel = state.currentLevel;
      }
      if (state.breadcrumb !== undefined) {
        this.breadcrumb = state.breadcrumb;
      }
      if (state.parentCell !== undefined) {
        this.parentCell = state.parentCell;
      }

      this.territories.clear();
      for (const t of state.territories) {
        this.territories.set(`${t.x},${t.y}`, {
          owner: t.owner,
          claimed_at: t.claimed_at,
          strength: t.strength || GRID_WARS_CONFIG.maxCellStrength,
          node_type: t.node_type || null,
          // v2.0: Hierarchy fields
          address: t.address || null,
          parent_address: t.parent_address || null,
          is_developed: t.is_developed || false,
          cell_level: t.cell_level || 0
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

      // v2.2: Store player colors and subcell summaries for mini-mosaic rendering
      if (state.playerColors) {
        this.playerColors = state.playerColors;
      }
      if (state.subcellSummaries) {
        this.subcellSummaries = state.subcellSummaries;
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
   * v1.3.2: Check if session is frozen
   */
  isSessionFrozen() {
    return this._sessionFrozen;
  }

  /**
   * v1.3.2: Get session summary (if session has ended)
   */
  getSessionSummary() {
    return this._sessionSummary;
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
   * v1.3: Calculate scaled cost based on player's current points
   * Uses logarithmic scaling to slow down high-point players
   */
  _calculateScaledCost(baseCost) {
    if (!GRID_WARS_CONFIG.pointCeilingEnabled) {
      return baseCost;
    }

    const playerPoints = this.getActionPoints();
    const minPoints = GRID_WARS_CONFIG.pointCeilingMinPoints;
    const scaleFactor = GRID_WARS_CONFIG.pointCeilingScaleFactor;

    const scale = 1 + scaleFactor * Math.log10(Math.max(playerPoints, minPoints));
    return Math.ceil(baseCost * scale);
  }

  /**
   * Get cost to claim/takeover a territory at position
   * v1.2: Returns { base, active, isEnemy } for activity-based pricing
   * v1.3: Includes effectiveCost (scaled based on player points)
   * - Inactive defender: base cost (15 pts)
   * - Active defender: active cost (25 pts)
   * - Client shows effective cost; actual cost determined server-side
   */
  getClaimCostAt(x, y) {
    const owner = this.getTerritoryOwner(x, y);
    if (!owner) {
      const baseCost = GRID_WARS_CONFIG.claimCost;
      return {
        cost: this._calculateScaledCost(baseCost),  // v1.3: Show scaled cost
        baseCost,
        isEnemy: false
      };
    } else if (owner === this.username) {
      return null; // Own territory - can't reclaim
    } else {
      // v1.2: Return both costs so UI can show dynamic pricing info
      // v1.3: Scale costs based on player points
      const baseCost = GRID_WARS_CONFIG.takeoverCostBase;
      const activeCostBase = GRID_WARS_CONFIG.takeoverCostActive;
      return {
        cost: this._calculateScaledCost(baseCost),          // Scaled base cost
        baseCost,
        activeCost: this._calculateScaledCost(activeCostBase), // Scaled active cost
        activeCostBase,
        isEnemy: true,
        defender: owner
      };
    }
  }

  /**
   * Check if player can afford to claim/takeover at position
   * v1.3: Uses scaled cost for affordability check
   */
  canAffordClaimAt(x, y) {
    const costInfo = this.getClaimCostAt(x, y);
    if (costInfo === null) return false; // Own territory
    return this.getActionPoints() >= costInfo.cost;
  }

  // ============================================
  // v1.3: SPAM PREVENTION / COOLDOWN
  // ============================================

  /**
   * Check if user is currently in cooldown
   */
  isInCooldown() {
    return this._cooldownUntil && Date.now() < this._cooldownUntil;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getCooldownRemaining() {
    if (!this._cooldownUntil) return 0;
    return Math.max(0, Math.ceil((this._cooldownUntil - Date.now()) / 1000));
  }

  /**
   * Report a wrong answer to the server
   * Called when drill grading returns 'I' (incorrect)
   * @returns {Promise<object>} { inCooldown, cooldownRemaining, message }
   */
  async reportWrongAnswer() {
    if (!this.gameId || !this.username) {
      console.warn('[GridWarsState] Cannot report wrong answer: no gameId or username');
      return { inCooldown: false, cooldownRemaining: 0 };
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/wrong-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username
        })
      });

      const result = await response.json();

      if (result.inCooldown) {
        this._cooldownUntil = Date.now() + result.cooldownRemaining * 1000;
        if (this.onCooldownChange) {
          this.onCooldownChange({
            inCooldown: true,
            remaining: result.cooldownRemaining,
            message: result.message
          });
        }
      }

      return result;
    } catch (err) {
      console.error('[GridWarsState] Failed to report wrong answer:', err);
      return { inCooldown: false, cooldownRemaining: 0 };
    }
  }

  /**
   * Check cooldown status from server
   * Used on reconnection or page load
   */
  async checkCooldownStatus() {
    if (!this.gameId || !this.username) return { inCooldown: false };

    try {
      const response = await fetch(
        `${this.serverUrl}/api/grid-wars/cooldown?gameId=${this.gameId}&username=${this.username}`
      );
      const result = await response.json();

      if (result.inCooldown) {
        this._cooldownUntil = Date.now() + result.cooldownRemaining * 1000;
        if (this.onCooldownChange) {
          this.onCooldownChange({
            inCooldown: true,
            remaining: result.cooldownRemaining,
            message: `SYSTEM RECALIBRATING (${result.cooldownRemaining}s remaining)`
          });
        }
      } else {
        this._cooldownUntil = null;
      }

      return result;
    } catch (err) {
      console.error('[GridWarsState] Failed to check cooldown status:', err);
      return { inCooldown: false };
    }
  }

  /**
   * Claim or takeover a territory
   * v1.2: Cost determined server-side for enemy takeover (activity-based pricing)
   * v1.2.1: Enhanced with claim status tracking (pending/confirmed/rejected)
   * v1.3: Uses UUID actionId for reliable reconciliation
   */
  async claimTerritory(x, y) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    // v1.3: Check if in resync mode - queue action instead
    if (this._resyncInProgress) {
      this._pendingActionsQueue = this._pendingActionsQueue || [];
      this._pendingActionsQueue.push({ type: 'claim', x, y });
      console.log('[GridWarsState] Claim queued during resync');
      return { queued: true };
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

    // v1.3: Generate UUID for this action (replaces counter-based claimId)
    const actionId = crypto.randomUUID();

    // Optimistic update (may be adjusted when server responds)
    this._applyOptimisticClaim(x, y, estimatedCost, currentOwner, actionId);

    try {
      // v2.1.5: Include parent context for subcell claims
      const response = await fetch(`${this.serverUrl}/api/grid-wars/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username,
          action: 'claim',
          actionId,  // v1.3: Include actionId for reconciliation
          x,
          y,
          parentAddress: this.currentParent,  // v2.1.5: null for macro, "e5" for subcell
          cellLevel: this.currentLevel         // v2.1.5: 0 for macro, 1+ for subcell
        })
      });

      if (!response.ok) {
        const error = await response.json();
        // Rollback optimistic update
        this._rollbackOptimisticClaim(x, y, estimatedCost, actionId);
        throw new Error(error.error || 'Failed to claim territory');
      }

      const result = await response.json();

      // v1.3: Verify actionId matches
      if (result.actionId && result.actionId !== actionId) {
        console.warn(`[GridWarsState] ActionId mismatch: sent ${actionId}, received ${result.actionId}`);
      }

      // v1.3: Apply authoritative cell state if provided
      if (result.authoritativeCell) {
        this._applyAuthoritativeCell(result.authoritativeCell);
      }

      // Confirm the claim by actionId
      this._confirmClaim(x, y, actionId);

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
   * Can be called with starType, direct points amount, or both
   * If both provided, uses pre-calculated weightedPoints (level-adjusted scoring)
   */
  async addPoints(starType = null, weightedPoints = null) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    const body = {
      gameId: this.gameId,
      username: this.username
    };

    // If weightedPoints provided (level-adjusted), use that
    // Otherwise fall back to starType for server to calculate
    if (weightedPoints != null && weightedPoints > 0) {
      body.points = weightedPoints;
      if (starType) body.starType = starType; // Include for logging/tracking
    } else if (starType) {
      body.starType = starType;
    } else {
      throw new Error('Either starType or weightedPoints required');
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
   * v1.4: Get multi-dimensional leaderboard (Scholar, Banker, General)
   */
  async getMultiLeaderboard(limit = 5) {
    if (!this.gameId) {
      throw new Error('Game not initialized');
    }

    try {
      const url = new URL(`${this.serverUrl}/api/grid-wars/leaderboard/multi`);
      url.searchParams.set('gameId', this.gameId);
      url.searchParams.set('limit', limit);
      if (this.username) {
        url.searchParams.set('username', this.username);
      }

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch multi-leaderboard');
      }

      return await response.json();
    } catch (err) {
      this._handleError('getMultiLeaderboard', err);
      throw err;
    }
  }

  /**
   * v1.4: Check if uplink is active (answered within uplinkRequiredSeconds)
   */
  isUplinkActive() {
    if (!this.username) return false;
    const player = this.players.get(this.username);
    if (!player?.last_answer_at) return false;

    const timeout = (GRID_WARS_CONFIG.uplinkRequiredSeconds || 600) * 1000;
    const elapsed = Date.now() - new Date(player.last_answer_at).getTime();
    return elapsed < timeout;
  }

  /**
   * v1.4: Get uplink time remaining in seconds
   */
  getUplinkTimeRemaining() {
    if (!this.username) return 0;
    const player = this.players.get(this.username);
    if (!player?.last_answer_at) return 0;

    const timeout = (GRID_WARS_CONFIG.uplinkRequiredSeconds || 600) * 1000;
    const elapsed = Date.now() - new Date(player.last_answer_at).getTime();
    return Math.max(0, Math.floor((timeout - elapsed) / 1000));
  }

  /**
   * v1.4: Get current earning multiplier based on empire size
   */
  getEarningMultiplier() {
    if (!GRID_WARS_CONFIG.diminishingReturnsEnabled) return 1.0;

    const stats = this.getPlayerStats();
    const territoriesCount = stats.territories || 0;
    const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold || 25;
    const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier || 0.5;
    const factor = GRID_WARS_CONFIG.diminishingReturnsFactor || 0.005;

    if (territoriesCount > threshold) {
      const excess = territoriesCount - threshold;
      return Math.max(minMultiplier, 1 - (excess * factor));
    }
    return 1.0;
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

  // ============================================
  // v2.0: HIERARCHY NAVIGATION
  // ============================================

  /**
   * v2.0: Navigate into a developed cell
   * @param {string} address - Cell address to zoom into
   */
  async zoomIn(address) {
    this.currentParent = address;
    this.currentLevel = address.split('.').length;
    this.breadcrumb = address.split('.');

    await this.refreshState();

    if (this.onNavigate) {
      this.onNavigate({
        action: 'zoomIn',
        address,
        level: this.currentLevel,
        breadcrumb: this.breadcrumb
      });
    }

    this._emitStateChange();
  }

  /**
   * v2.0: Navigate up one level
   */
  async zoomOut() {
    if (!this.currentParent) return; // Already at root

    const parts = this.currentParent.split('.');
    parts.pop();

    this.currentParent = parts.length ? parts.join('.') : null;
    this.currentLevel = parts.length;
    this.breadcrumb = parts;

    await this.refreshState();

    if (this.onNavigate) {
      this.onNavigate({
        action: 'zoomOut',
        address: this.currentParent,
        level: this.currentLevel,
        breadcrumb: this.breadcrumb
      });
    }

    this._emitStateChange();
  }

  /**
   * v2.0: Navigate directly to a specific level
   * @param {string|null} address - Target address (null for root)
   */
  async zoomTo(address) {
    if (!address) {
      this.currentParent = null;
      this.currentLevel = 0;
      this.breadcrumb = [];
    } else {
      this.currentParent = address;
      this.currentLevel = address.split('.').length;
      this.breadcrumb = address.split('.');
    }

    await this.refreshState();

    if (this.onNavigate) {
      this.onNavigate({
        action: 'zoomTo',
        address: this.currentParent,
        level: this.currentLevel,
        breadcrumb: this.breadcrumb
      });
    }

    this._emitStateChange();
  }

  /**
   * v2.0: Get current navigation state
   */
  getNavigationState() {
    return {
      currentParent: this.currentParent,
      currentLevel: this.currentLevel,
      breadcrumb: this.breadcrumb,
      canZoomOut: this.currentParent !== null,
      parentCell: this.parentCell
    };
  }

  /**
   * v2.0: Check if a cell is developed (can zoom in)
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isDeveloped(x, y) {
    const territory = this.territories.get(`${x},${y}`);
    return territory?.is_developed || false;
  }

  /**
   * v2.0: Get cell address at position
   * @param {number} x
   * @param {number} y
   * @returns {string|null}
   */
  getCellAddress(x, y) {
    const territory = this.territories.get(`${x},${y}`);
    return territory?.address || null;
  }

  // ============================================
  // v2.0: DEVELOP & DRILL ACTIONS
  // ============================================

  /**
   * v2.0: Develop (subdivide) a cell you own
   * Costs 100 points, creates 64 subcells, owner keeps center 4
   * @param {string} address - Cell address to develop
   */
  async developCell(address) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/develop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username,
          address
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to develop cell');
      }

      const result = await response.json();

      // Auto-zoom into the developed cell
      await this.zoomIn(address);

      if (this.onCellDeveloped) {
        this.onCellDeveloped({
          address,
          subcellsCreated: result.subcellsCreated,
          ownerRetained: result.ownerRetained,
          cost: result.cost
        });
      }

      return result;
    } catch (err) {
      this._handleError('developCell', err);
      throw err;
    }
  }

  /**
   * v2.0: Drill into an enemy cell (force subdivision)
   * Only available at 85%+ saturation
   * Costs 75 points, attacker gets corner a1, defender keeps center 4
   * @param {string} targetAddress - Enemy cell address to drill
   */
  async drillCell(targetAddress) {
    if (!this.gameId || !this.username) {
      throw new Error('Not initialized or no user set');
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/drill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          username: this.username,
          targetAddress
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to drill cell');
      }

      const result = await response.json();

      // Auto-zoom into the drilled cell
      await this.zoomIn(targetAddress);

      if (this.onCellDrilled) {
        this.onCellDrilled({
          address: targetAddress,
          attackerCell: result.attackerCell,
          defenderCells: result.defenderCells,
          cost: result.cost
        });
      }

      return result;
    } catch (err) {
      this._handleError('drillCell', err);
      throw err;
    }
  }

  /**
   * v2.0: Check if drilling is available (map saturation >= 85%)
   */
  canDrill() {
    if (!GRID_WARS_CONFIG.hierarchyEnabled) return false;

    const threshold = GRID_WARS_CONFIG.drillSaturationThreshold || 85;
    const fillPercent = this.scarcityPhase?.fillPercent || 0;
    return fillPercent >= threshold;
  }

  /**
   * v1.5: Get current scarcity phase info
   * @returns {object|null} { phase, multiplier, message, fillPercent }
   */
  getScarcityPhase() {
    return this.scarcityPhase;
  }

  /**
   * v1.5: Get list of bounty target usernames
   * @returns {string[]} Array of usernames with bounties
   */
  getBountyTargets() {
    return this.bountyTargets;
  }

  /**
   * v1.5: Check if a player is a bounty target
   * @param {string} username
   * @returns {boolean}
   */
  isBountyTarget(username) {
    return this.bountyTargets.includes(username);
  }

  /**
   * v1.5: Get current player's velocity tier
   * @returns {{ tier: string, discount: number, velocity: number }|null}
   */
  getVelocityTier() {
    return this.velocityTier;
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
      case 'auto_surge_activated':  // v1.3.1: Auto-surge uses same UI as manual surge
        this.surge = {
          x: message.x,
          y: message.y,
          expiresIn: message.expiresIn
        };
        if (this.onSurgeActivated) {
          this.onSurgeActivated(this.surge);
        }
        // v1.3.1: Handle auto-surge message for toast
        if (message.type === 'auto_surge_activated' && this.onSystemEvent) {
          this.onSystemEvent({ event: 'auto_surge', message: message.message });
        }
        this._emitStateChange();
        break;

      // v1.3.1: System events (for toast notifications)
      case 'system_event':
        if (this.onSystemEvent) {
          this.onSystemEvent({ event: message.event, message: message.message });
        }
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

      // v1.3: AFK erosion notification
      case 'afk_erosion':
        const erosionKey = `${message.x},${message.y}`;
        if (message.died) {
          // Cell was neutralized
          this.territories.delete(erosionKey);
          if (message.previousOwner) {
            this._updatePlayerTerritoriesCount(message.previousOwner, -1);
          }
        } else {
          // Cell strength reduced
          const erodingTerritory = this.territories.get(erosionKey);
          if (erodingTerritory) {
            erodingTerritory.strength = message.strength;
          }
        }

        // Notify if this affects current user
        if ((message.previousOwner === this.username || message.owner === this.username)
            && this.onTerritoryChanged) {
          this.onTerritoryChanged({
            x: message.x,
            y: message.y,
            owner: message.died ? null : message.owner,
            action: 'afk_erosion',
            message: message.message
          });
        }
        this._emitStateChange();
        break;

      // v1.3.2: Session ended (Grid Wars frozen, drills still work)
      case 'session_ended':
        this._sessionFrozen = true;
        this._sessionSummary = message.summary;
        if (this.onSessionEnded) {
          this.onSessionEnded({
            summary: message.summary,
            rankings: message.rankings
          });
        }
        this._emitStateChange();
        break;

      // v1.3.2: Session resumed (Grid Wars unfrozen)
      case 'session_resumed':
        this._sessionFrozen = false;
        this._sessionSummary = null;
        if (this.onSessionResumed) {
          this.onSessionResumed();
        }
        this._emitStateChange();
        break;

      // v1.3.2: Game reset (all territories and points cleared)
      case 'game_reset':
        this.territories.clear();
        this.players.clear();
        this.classGoal = { current: 0, target: GRID_WARS_CONFIG.classGoalTarget };
        this.surge = null;
        this._sessionFrozen = false;
        this._sessionSummary = null;
        this.scarcityPhase = null;  // v1.5
        this.bountyTargets = [];    // v1.5
        if (this.onGameReset) {
          this.onGameReset();
        }
        // Refresh state from server to get updated player data (boot bonus)
        this.refreshState();
        break;

      // v1.5: AFK decay (24hr grace, cell returns to neutral)
      case 'afk_decay':
        const decayKey = `${message.x},${message.y}`;
        this.territories.delete(decayKey);
        if (message.previousOwner) {
          this._updatePlayerTerritoriesCount(message.previousOwner, -1);
        }

        // Notify if this affects current user
        if (message.previousOwner === this.username && this.onAfkDecay) {
          this.onAfkDecay({
            x: message.x,
            y: message.y,
            message: message.message
          });
        }

        if (this.onTerritoryChanged) {
          this.onTerritoryChanged({
            x: message.x,
            y: message.y,
            owner: null,
            action: 'afk_decay',
            message: message.message
          });
        }
        this._emitStateChange();
        break;

      // v1.5: Bounty claimed notification
      case 'bounty_claimed':
        // Notify if attacker or defender is current user
        if ((message.attacker === this.username || message.defender === this.username)
            && this.onBountyClaimed) {
          this.onBountyClaimed({
            attacker: message.attacker,
            defender: message.defender,
            bonus: message.bonus,
            x: message.x,
            y: message.y,
            message: message.message,
            isAttacker: message.attacker === this.username
          });
        }

        // Show system event for everyone
        if (this.onSystemEvent) {
          this.onSystemEvent({
            event: 'bounty_claimed',
            message: message.message
          });
        }
        break;

      // v1.5: Scarcity phase update
      case 'scarcity_update':
        const oldPhase = this.scarcityPhase?.phase;
        this.scarcityPhase = {
          phase: message.phase,
          multiplier: message.multiplier,
          message: message.message,
          fillPercent: message.fillPercent
        };

        // Notify if phase changed
        if (oldPhase !== message.phase && this.onScarcityChange) {
          this.onScarcityChange(this.scarcityPhase);
        }
        this._emitStateChange();
        break;

      // v1.5: Bounty targets update
      case 'bounty_targets_update':
        this.bountyTargets = message.targets || [];
        this._emitStateChange();
        break;

      // v1.5: Velocity tier update (sent after point events)
      case 'velocity_update':
        if (message.username === this.username) {
          this.velocityTier = {
            tier: message.tier,
            discount: message.discount,
            velocity: message.velocity
          };
          this._emitStateChange();
        }
        break;

      // v1.6: Leaderboard update (real-time sync)
      case 'leaderboard_update':
        if (this.onLeaderboardUpdate) {
          this.onLeaderboardUpdate(message.leaderboard);
        }
        break;

      // v2.0: Cell developed (subdivided)
      case 'cell_developed':
        // Update local territory to show as developed
        for (const [key, territory] of this.territories) {
          if (territory.address === message.address) {
            territory.is_developed = true;
            break;
          }
        }

        // Notify
        if (this.onCellDeveloped) {
          this.onCellDeveloped({
            address: message.address,
            developer: message.developer,
            newCells: message.newCells,
            ownerRetained: message.ownerRetained
          });
        }

        // Show system event
        if (this.onSystemEvent) {
          this.onSystemEvent({
            event: 'cell_developed',
            message: `${message.developer} developed ${message.address}!`
          });
        }

        this._emitStateChange();
        break;

      // v2.0: Cell drilled (forced subdivision by attacker)
      case 'cell_drilled':
        // Update local territory to show as developed
        for (const [key, territory] of this.territories) {
          if (territory.address === message.address) {
            territory.is_developed = true;
            break;
          }
        }

        // Notify
        if (this.onCellDrilled) {
          this.onCellDrilled({
            address: message.address,
            attacker: message.attacker,
            defender: message.defender,
            attackerGained: message.attackerGained,
            defenderRetained: message.defenderRetained
          });
        }

        // Show system event
        if (this.onSystemEvent) {
          this.onSystemEvent({
            event: 'cell_drilled',
            message: `${message.attacker} drilled into ${message.defender}'s ${message.address}!`
          });
        }

        this._emitStateChange();
        break;
    }
  }

  /**
   * Get state for rendering
   * Returns data in format expected by GridRenderer
   * v1.2: Removed contested_by (contestation system removed)
   * v1.2.1: Added pending flag for claim status visualization
   * v2.0: Added hierarchy fields (address, is_developed) and navigation state
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
        ownerLastAnswer: ownerData?.last_answer_at || null,
        pending: data.pending || false, // v1.2.1: Include pending status
        isBountyTarget: data.owner ? this.bountyTargets.includes(data.owner) : false, // v1.5
        // v2.0: Hierarchy fields
        address: data.address || null,
        is_developed: data.is_developed || false,
        cell_level: data.cell_level || 0
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
      surge: this.surge,
      scarcityPhase: this.scarcityPhase,   // v1.5
      bountyTargets: this.bountyTargets,   // v1.5
      // v2.0: Hierarchy navigation state
      currentParent: this.currentParent,
      currentLevel: this.currentLevel,
      breadcrumb: this.breadcrumb,
      parentCell: this.parentCell,
      // v2.2: Player colors and subcell summaries for mini-mosaic
      playerColors: this.playerColors,
      subcellSummaries: this.subcellSummaries
    };
  }

  /**
   * v2.2: Get player color
   * @param {string} username
   * @returns {string|null} Hex color or null
   */
  getPlayerColor(username) {
    return this.playerColors[username] || null;
  }

  /**
   * v2.2: Get subcell summary for a developed cell
   * @param {string} address
   * @returns {Array|null} 8x8 grid of {owner, is_developed} or null
   */
  getSubcellSummary(address) {
    return this.subcellSummaries[address] || null;
  }

  /**
   * v2.2: Gift a cell to another player
   * @param {string} address - Cell address to gift
   * @param {string} toUsername - Recipient username
   * @returns {Promise<Object>} Result from server
   */
  async giftCell(address, toUsername) {
    if (!this.gameId || !this.username) {
      throw new Error('Game not initialized');
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: this.gameId,
          fromUsername: this.username,
          toUsername,
          address
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gift failed');
      }

      const result = await response.json();

      // Refresh state to get updated territories
      await this.refreshState();

      return result;
    } catch (err) {
      this._handleError('giftCell', err);
      throw err;
    }
  }

  // ============================================
  // Private methods
  // ============================================

  _applyOptimisticClaim(x, y, cost, previousOwner = null, claimId = null) {
    // Store old territory data for potential rollback
    const oldTerritory = this.territories.get(`${x},${y}`);

    this.territories.set(`${x},${y}`, {
      owner: this.username,
      claimed_at: new Date().toISOString(),
      strength: GRID_WARS_CONFIG.maxCellStrength,
      node_type: oldTerritory?.node_type || null,
      pending: true // v1.2.1: Mark as pending
    });
    this._updatePlayerPoints(-cost);
    this._updatePlayerTerritoriesCount(this.username, 1);

    // If takeover, decrement previous owner's count
    if (previousOwner) {
      this._updatePlayerTerritoriesCount(previousOwner, -1);
    }

    this._pendingActions.push({ type: 'claim', x, y, cost, previousOwner, oldTerritory, claimId });

    // v1.2.1: Emit pending status
    if (this.onClaimStatusChange) {
      this.onClaimStatusChange({ x, y, status: 'pending', claimId });
    }
  }

  /**
   * v1.2.1: Confirm a successful claim
   */
  _confirmClaim(x, y, claimId) {
    const pendingAction = this._pendingActions.find(
      a => a.type === 'claim' && a.claimId === claimId
    );

    if (pendingAction) {
      // Remove pending flag from territory
      const territory = this.territories.get(`${x},${y}`);
      if (territory) {
        delete territory.pending;
      }

      // Remove from pending actions
      this._pendingActions = this._pendingActions.filter(
        a => a.claimId !== claimId
      );

      // Emit confirmed status
      if (this.onClaimStatusChange) {
        this.onClaimStatusChange({ x, y, status: 'confirmed', claimId });
      }
    }
  }

  _rollbackOptimisticClaim(x, y, cost, claimId = null) {
    const pendingAction = this._pendingActions.find(
      a => a.type === 'claim' && (claimId ? a.claimId === claimId : (a.x === x && a.y === y))
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
      a => !(claimId ? a.claimId === claimId : (a.type === 'claim' && a.x === x && a.y === y))
    );

    // v1.2.1: Emit rejected status
    if (this.onClaimStatusChange) {
      this.onClaimStatusChange({ x, y, status: 'rejected', claimId });
    }

    this._emitStateChange();
  }

  /**
   * v1.3: Apply authoritative cell state from server
   * Ensures client state matches server exactly after claim is confirmed
   */
  _applyAuthoritativeCell(cell) {
    if (!cell || cell.x === undefined || cell.y === undefined) return;

    const key = `${cell.x},${cell.y}`;
    const currentTerritory = this.territories.get(key);

    // Only update if different from current state
    if (!currentTerritory ||
        currentTerritory.owner !== cell.owner ||
        currentTerritory.strength !== cell.strength) {
      this.territories.set(key, {
        owner: cell.owner,
        claimed_at: cell.claimed_at,
        strength: cell.strength,
        node_type: cell.node_type || null
      });
      console.log(`[GridWarsState] Applied authoritative cell at ${key}: owner=${cell.owner}`);
    }
  }

  /**
   * v1.3: Enter resync mode - queue new actions until snapshot received
   */
  _enterResyncMode() {
    this._resyncInProgress = true;
    this._pendingActionsQueue = [];
    console.log('[GridWarsState] Entering resync mode');
  }

  /**
   * v1.3: Exit resync mode and replay queued actions
   */
  async _exitResyncMode() {
    this._resyncInProgress = false;
    const queuedActions = [...this._pendingActionsQueue];
    this._pendingActionsQueue = [];
    console.log(`[GridWarsState] Exiting resync mode, replaying ${queuedActions.length} queued actions`);

    // Replay queued actions
    for (const action of queuedActions) {
      if (action.type === 'claim') {
        try {
          await this.claimTerritory(action.x, action.y);
        } catch (err) {
          console.warn('[GridWarsState] Failed to replay queued claim:', err.message);
        }
      }
    }
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
   * v1.3: Enters resync mode to queue incoming actions
   */
  _requestResync(lastSeq, expectedSeq) {
    console.log(`[GridWarsState] Requesting resync (last=${lastSeq}, expected=${expectedSeq})`);

    // v1.3: Enter resync mode to queue new actions
    this._enterResyncMode();

    if (this.onResyncRequest) {
      this.onResyncRequest({
        type: 'resync_request',
        gameId: this.gameId,
        lastSeq,
        expectedSeq
      });
    }
  }

  /**
   * v1.3: Called after resync snapshot is received and applied
   * Should be called by grid-panel.js after refreshState() completes
   */
  async completeResync() {
    if (!this._resyncInProgress) {
      console.log('[GridWarsState] completeResync called but not in resync mode');
      return;
    }
    await this._exitResyncMode();
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
