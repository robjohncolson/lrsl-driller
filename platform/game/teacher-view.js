/**
 * Teacher View - State management for the teacher map display
 * Handles WebSocket connection and state synchronization
 */

export class TeacherView {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || null;
    this.renderer = options.renderer || null;

    // Callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onConnectionChange = options.onConnectionChange || (() => {});
    this.onPlayersChange = options.onPlayersChange || (() => {});

    // State
    this.gameId = null;
    this.game = null;
    this.territories = [];
    this.players = [];
    this.onlineUsers = [];

    // WebSocket
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.heartbeatInterval = null;

    // Polling fallback (if WebSocket fails)
    this.pollInterval = null;
  }

  /**
   * Get WebSocket URL from server URL
   */
  get wsUrl() {
    if (!this.serverUrl) return null;
    return this.serverUrl.replace('https://', 'wss://').replace('http://', 'ws://');
  }

  /**
   * Initialize the teacher view
   */
  async init() {
    try {
      // Fetch active game
      await this.fetchActiveGame();

      // Connect WebSocket
      this.connectWebSocket();

      // Fetch initial state
      await this.refresh();

      return true;
    } catch (err) {
      console.error('TeacherView init error:', err);
      // Start polling as fallback
      this.startPolling();
      return false;
    }
  }

  /**
   * Fetch active game
   */
  async fetchActiveGame() {
    const response = await fetch(`${this.serverUrl}/api/grid-wars/games/active`);
    if (!response.ok) {
      throw new Error('Failed to fetch active game');
    }
    this.game = await response.json();
    this.gameId = this.game.game_id;
  }

  /**
   * Refresh full state from server
   */
  async refresh() {
    if (!this.gameId) {
      await this.fetchActiveGame();
    }

    try {
      // Fetch game state
      const stateResponse = await fetch(`${this.serverUrl}/api/grid-wars/games/${this.gameId}/state`);
      if (stateResponse.ok) {
        const state = await stateResponse.json();
        this.applyState(state);
      }

      // Fetch leaderboard for player info
      const leaderboardResponse = await fetch(`${this.serverUrl}/api/grid-wars/leaderboard?gameId=${this.gameId}`);
      if (leaderboardResponse.ok) {
        this.players = await leaderboardResponse.json();
        this.emitPlayersChange();
      }

      this.emitStateChange();
    } catch (err) {
      console.error('TeacherView refresh error:', err);
    }
  }

  /**
   * Apply state from server
   */
  applyState(state) {
    this.territories = state.territories || [];

    // Update renderer
    if (this.renderer) {
      this.renderer.loadState({
        territories: this.territories,
        players: state.players || []
      });
    }
  }

  /**
   * Connect to WebSocket server
   */
  connectWebSocket() {
    if (!this.wsUrl) return;
    if (this.ws) return;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('Teacher WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);

        // Identify as teacher
        this.send({ type: 'identify', username: '_teacher', role: 'teacher' });

        // Start heartbeat
        this.heartbeatInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'heartbeat', username: '_teacher' });
          }
        }, 30000);

        // Stop polling if it was running
        this.stopPolling();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (err) {
          console.warn('WebSocket message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('Teacher WebSocket disconnected');
        this.connected = false;
        this.ws = null;
        clearInterval(this.heartbeatInterval);
        this.onConnectionChange(false);

        // Attempt reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connectWebSocket(), 5000 * this.reconnectAttempts);
        } else {
          // Fall back to polling
          this.startPolling();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Teacher WebSocket error:', err);
      };
    } catch (err) {
      console.warn('Teacher WebSocket connection failed:', err);
      this.startPolling();
    }
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'presence_snapshot':
        this.onlineUsers = message.users || [];
        this.updateOnlineStatus();
        break;

      case 'user_online':
        if (!this.onlineUsers.includes(message.username)) {
          this.onlineUsers.push(message.username);
        }
        this.updateOnlineStatus();
        break;

      case 'user_offline':
        this.onlineUsers = this.onlineUsers.filter(u => u !== message.username);
        this.updateOnlineStatus();
        break;

      case 'territory_claimed':
        if (message.gameId === this.gameId) {
          this.handleTerritoryClaimed(message);
        }
        break;

      case 'points_earned':
        if (message.gameId === this.gameId) {
          this.handlePointsEarned(message);
        }
        break;

      case 'grid_full_state':
        if (message.gameId === this.gameId) {
          this.applyState(message);
          this.emitStateChange();
        }
        break;

      case 'avatar_moved':
        if (message.gameId === this.gameId) {
          // Update player position
          const player = this.players.find(p => p.username === message.username);
          if (player) {
            player.position_x = message.x;
            player.position_y = message.y;
            player.health = message.health;
          }
          // Re-render avatars
          if (this.renderer) {
            this.renderer.setAvatars(this.players.filter(p => p.position_x !== undefined));
          }
          this.emitStateChange();
        }
        break;
    }
  }

  /**
   * Handle territory claimed
   */
  handleTerritoryClaimed(message) {
    const existing = this.territories.find(t => t.x === message.x && t.y === message.y);
    if (existing) {
      existing.owner = message.username;
    } else {
      this.territories.push({ x: message.x, y: message.y, owner: message.username });
    }

    if (this.renderer) {
      this.renderer.setTerritory(message.x, message.y, message.username);
      this.renderer.pulseCell(message.x, message.y, '#00ff41', 500);
    }

    this.updatePlayerTerritoryCount(message.username, 1);
    this.emitStateChange();
  }

  /**
   * Handle points earned
   */
  handlePointsEarned(message) {
    const player = this.players.find(p => p.username === message.username);
    if (player) {
      player.action_points = message.total;
    } else {
      this.players.push({
        username: message.username,
        action_points: message.total,
        territories_count: 0
      });
    }
    this.emitPlayersChange();
    this.emitStateChange();
  }

  /**
   * Update player territory count
   */
  updatePlayerTerritoryCount(username, delta) {
    const player = this.players.find(p => p.username === username);
    if (player) {
      player.territories_count = (player.territories_count || 0) + delta;
    } else {
      this.players.push({
        username,
        action_points: 0,
        territories_count: Math.max(0, delta)
      });
    }
    this.emitPlayersChange();
  }

  /**
   * Update online status for players
   */
  updateOnlineStatus() {
    for (const player of this.players) {
      player.online = this.onlineUsers.includes(player.username);
    }
    this.emitPlayersChange();
  }

  /**
   * Start polling as fallback
   */
  startPolling() {
    if (this.pollInterval) return;

    console.log('Starting polling fallback');
    this.pollInterval = setInterval(() => this.refresh(), 10000);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Emit state change
   */
  emitStateChange() {
    const totalPoints = this.players.reduce((sum, p) => sum + (p.action_points || 0), 0);

    this.onStateChange({
      territoriesCount: this.territories.length,
      totalPoints
    });
  }

  /**
   * Emit players change
   */
  emitPlayersChange() {
    this.onPlayersChange([...this.players]);
  }

  /**
   * Get computed statistics
   */
  getStats() {
    const totalPoints = this.players.reduce((sum, p) => sum + (p.action_points || 0), 0);
    const onlineCount = this.players.filter(p => p.online).length;

    return {
      territoriesCount: this.territories.length,
      playersCount: this.players.length,
      onlineCount,
      totalPoints
    };
  }

  /**
   * End the current session and calculate rankings
   * Returns ranking data for display
   *
   * v1.2 Design Note: This is OPTIONAL functionality.
   * Grid Wars runs continuously without defined sessions.
   * Teachers can call this anytime to get rankings, but
   * there's no prompt, auto-end, or required flow.
   */
  async endSession() {
    if (!this.gameId) {
      throw new Error('No active game');
    }

    // Calculate rankings from current data
    const rankings = this.calculateRankings();

    // Broadcast session end to all players
    this.send({
      type: 'session_ended',
      gameId: this.gameId,
      rankings
    });

    return rankings;
  }

  /**
   * Calculate rankings for end-of-session ceremony
   */
  calculateRankings() {
    const playersWithData = this.players.filter(p => p.territories_count > 0 || p.action_points > 0);

    if (playersWithData.length === 0) {
      return null;
    }

    // Territory Leader: Largest cluster or most territories
    const territoryLeader = [...playersWithData].sort((a, b) => {
      const aCluster = a.largest_cluster || a.territories_count || 0;
      const bCluster = b.largest_cluster || b.territories_count || 0;
      return bCluster - aCluster;
    })[0];

    // Top Scholar: Most points earned
    const topScholar = [...playersWithData].sort((a, b) => {
      return (b.action_points || 0) - (a.action_points || 0);
    })[0];

    // Top Claimer: Most territories
    const topClaimer = [...playersWithData].sort((a, b) => {
      return (b.territories_count || 0) - (a.territories_count || 0);
    })[0];

    // Online Champion: Highest points among online players
    const onlinePlayers = playersWithData.filter(p => p.online);
    const onlineChampion = onlinePlayers.length > 0
      ? [...onlinePlayers].sort((a, b) => (b.action_points || 0) - (a.action_points || 0))[0]
      : null;

    return {
      territoryLeader: territoryLeader ? {
        username: territoryLeader.username,
        name: territoryLeader.real_name || territoryLeader.username,
        score: territoryLeader.largest_cluster || territoryLeader.territories_count || 0
      } : null,
      topScholar: topScholar ? {
        username: topScholar.username,
        name: topScholar.real_name || topScholar.username,
        score: topScholar.action_points || 0
      } : null,
      topClaimer: topClaimer ? {
        username: topClaimer.username,
        name: topClaimer.real_name || topClaimer.username,
        score: topClaimer.territories_count || 0
      } : null,
      onlineChampion: onlineChampion ? {
        username: onlineChampion.username,
        name: onlineChampion.real_name || onlineChampion.username,
        score: onlineChampion.action_points || 0
      } : null,
      totalPlayers: playersWithData.length,
      totalTerritories: this.territories.length,
      totalPoints: playersWithData.reduce((sum, p) => sum + (p.action_points || 0), 0)
    };
  }

  /**
   * Reset the game (start new session)
   */
  async resetGame() {
    try {
      const response = await fetch(`${this.serverUrl}/api/grid-wars/games/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: this.gameId })
      });

      if (response.ok) {
        // Refresh to get new game state
        await this.fetchActiveGame();
        await this.refresh();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Reset game error:', err);
      return false;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    clearInterval(this.heartbeatInterval);
    this.stopPolling();
    this.connected = false;
  }
}

export default TeacherView;
