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
    this.structures = [];
    this.players = [];
    this.onlineUsers = [];
    this.waveNumber = 0;

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
    this.waveNumber = this.game.wave_number || 0;
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
    this.structures = state.structures || [];
    this.waveNumber = state.wave_number || 0;

    // Update renderer
    if (this.renderer) {
      this.renderer.loadState({
        territories: this.territories,
        structures: this.structures.map(s => ({
          x: s.x,
          y: s.y,
          type: s.structure_type,
          owner: s.owner
        })),
        enemies: state.enemies || []
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

      case 'structure_built':
        if (message.gameId === this.gameId) {
          this.handleStructureBuilt(message);
        }
        break;

      case 'structure_destroyed':
        if (message.gameId === this.gameId) {
          this.handleStructureDestroyed(message);
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

      case 'wave_started':
        if (message.gameId === this.gameId) {
          this.waveNumber = message.waveNumber;
          if (this.renderer && message.enemies) {
            this.renderer.setEnemies(message.enemies);
          }
          this.emitStateChange();
        }
        break;

      case 'enemy_moved':
        if (message.gameId === this.gameId && this.renderer) {
          this.renderer.setEnemies(message.enemies || []);
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
   * Handle structure built
   */
  handleStructureBuilt(message) {
    const existing = this.structures.find(s => s.x === message.x && s.y === message.y);
    if (existing) {
      existing.structure_type = message.structureType;
      existing.owner = message.username;
    } else {
      this.structures.push({
        x: message.x,
        y: message.y,
        structure_type: message.structureType,
        owner: message.username
      });
    }

    if (this.renderer) {
      this.renderer.setStructure(message.x, message.y, message.structureType, message.username);
      this.renderer.pulseCell(message.x, message.y, '#00ffff', 500);
    }

    this.updatePlayerStructureCount(message.username, 1);
    this.emitStateChange();
  }

  /**
   * Handle structure destroyed
   */
  handleStructureDestroyed(message) {
    const index = this.structures.findIndex(s => s.x === message.x && s.y === message.y);
    if (index !== -1) {
      const structure = this.structures[index];
      this.updatePlayerStructureCount(structure.owner, -1);
      this.structures.splice(index, 1);
    }

    if (this.renderer) {
      this.renderer.setStructure(message.x, message.y, null);
      this.renderer.pulseCell(message.x, message.y, '#ff3333', 500);
    }

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
        territories_count: 0,
        structures_count: 0
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
        territories_count: Math.max(0, delta),
        structures_count: 0
      });
    }
    this.emitPlayersChange();
  }

  /**
   * Update player structure count
   */
  updatePlayerStructureCount(username, delta) {
    const player = this.players.find(p => p.username === username);
    if (player) {
      player.structures_count = (player.structures_count || 0) + delta;
      this.emitPlayersChange();
    }
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
      structuresCount: this.structures.length,
      totalPoints,
      waveNumber: this.waveNumber
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
      structuresCount: this.structures.length,
      playersCount: this.players.length,
      onlineCount,
      totalPoints,
      waveNumber: this.waveNumber
    };
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
