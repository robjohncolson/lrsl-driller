/**
 * CTF State Management
 *
 * Handles API calls and state for the Linear CTF game.
 * Each cartridge has its own CTF game instance.
 */

import { CTF_CONFIG } from '../../shared/ctf.config.js';

export class CTFState {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.cartridgeId = null;
    this.username = null;

    // Game state
    this.frontPosition = CTF_CONFIG.startPosition;
    this.bluePoints = 0;
    this.redPoints = 0;
    this.winner = null;
    this.blueTeam = [];
    this.redTeam = [];
    this.userTeam = null;

    // Callbacks
    this.onStateChange = null;
    this.onFrontMoved = null;
    this.onVictory = null;
    this.onTeamsUpdated = null;
  }

  /**
   * Initialize state for a cartridge
   */
  async init(cartridgeId, username) {
    this.cartridgeId = cartridgeId;
    this.username = username;

    try {
      const state = await this.fetchState();
      this._updateLocalState(state);
      return state;
    } catch (err) {
      console.error('CTFState init error:', err);
      throw err;
    }
  }

  /**
   * Fetch current game state from server
   */
  async fetchState() {
    const url = new URL(`${this.serverUrl}/api/ctf/${this.cartridgeId}/state`);
    if (this.username) {
      url.searchParams.set('username', this.username);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CTF state: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Join a team
   */
  async joinTeam(team) {
    if (!this.username) {
      throw new Error('Username required to join team');
    }

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, team })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to join team');
    }

    this.userTeam = team;
    if (this.onStateChange) this.onStateChange();
    return response.json();
  }

  /**
   * Add points (called when star is earned)
   */
  async addPoints(points, starType) {
    if (!this.username) {
      console.warn('No username set, cannot add points');
      return null;
    }

    if (!this.userTeam) {
      console.warn('User not assigned to a team, cannot add points');
      return null;
    }

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        points,
        starType
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to add points');
    }

    const result = await response.json();

    // Update local state
    this.frontPosition = result.frontPosition;
    this.bluePoints = result.bluePoints;
    this.redPoints = result.redPoints;
    this.winner = result.winner;

    if (this.onStateChange) this.onStateChange();
    return result;
  }

  /**
   * Reset game (teacher only)
   */
  async resetGame(preserveTeams = true) {
    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preserveTeams })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to reset game');
    }

    // Refresh state
    const state = await this.fetchState();
    this._updateLocalState(state);
    return state;
  }

  /**
   * Get team leaderboards
   */
  async getLeaderboard() {
    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/leaderboard`);
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return response.json();
  }

  /**
   * Bulk assign teams (teacher only)
   */
  async assignTeams(assignments) {
    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/assign-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to assign teams');
    }

    // Refresh state
    const state = await this.fetchState();
    this._updateLocalState(state);
    return state;
  }

  /**
   * Remove player from game (teacher only)
   */
  async removePlayer(username) {
    const response = await fetch(
      `${this.serverUrl}/api/ctf/${this.cartridgeId}/player/${encodeURIComponent(username)}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove player');
    }

    // Refresh state
    const state = await this.fetchState();
    this._updateLocalState(state);
    return state;
  }

  /**
   * Handle WebSocket message
   */
  handleWebSocketMessage(message) {
    // Only process messages for our cartridge
    if (message.cartridgeId && message.cartridgeId !== this.cartridgeId) {
      return;
    }

    switch (message.type) {
      case 'ctf_front_moved':
        this.frontPosition = message.frontPosition;
        this.bluePoints = message.bluePoints;
        this.redPoints = message.redPoints;
        if (this.onFrontMoved) this.onFrontMoved(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_points':
        // Update team rosters with new points
        this._updatePlayerPoints(message.username, message.team, message.points);
        this.frontPosition = message.frontPosition;
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_victory':
        this.winner = message.winner;
        this.frontPosition = message.finalPosition;
        if (this.onVictory) this.onVictory(message.winner);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_reset':
        this.frontPosition = CTF_CONFIG.startPosition;
        this.bluePoints = 0;
        this.redPoints = 0;
        this.winner = null;
        if (!message.preserveTeams) {
          this.blueTeam = [];
          this.redTeam = [];
          this.userTeam = null;
        } else {
          // Reset points for all players
          this.blueTeam = this.blueTeam.map(p => ({ ...p, points_contributed: 0 }));
          this.redTeam = this.redTeam.map(p => ({ ...p, points_contributed: 0 }));
        }
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_player_joined':
        this._addPlayerToTeam(message.username, message.team);
        if (message.username === this.username) {
          this.userTeam = message.team;
        }
        if (this.onTeamsUpdated) this.onTeamsUpdated();
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_teams_updated':
        // Refresh full state to get accurate team lists
        this.fetchState().then(state => {
          this._updateLocalState(state);
          if (this.onTeamsUpdated) this.onTeamsUpdated();
        });
        break;

      case 'ctf_player_removed':
        this._removePlayerFromTeams(message.username);
        if (message.username === this.username) {
          this.userTeam = null;
        }
        if (this.onTeamsUpdated) this.onTeamsUpdated();
        if (this.onStateChange) this.onStateChange();
        break;
    }
  }

  /**
   * Update local state from server response
   */
  _updateLocalState(state) {
    this.frontPosition = state.frontPosition;
    this.bluePoints = state.bluePoints;
    this.redPoints = state.redPoints;
    this.winner = state.winner;
    this.blueTeam = state.blueTeam || [];
    this.redTeam = state.redTeam || [];
    this.userTeam = state.userTeam;

    if (this.onStateChange) this.onStateChange();
  }

  /**
   * Update a player's points in local state
   */
  _updatePlayerPoints(username, team, addedPoints) {
    const teamList = team === 'blue' ? this.blueTeam : this.redTeam;
    const player = teamList.find(p => p.username === username);
    if (player) {
      player.points_contributed = (player.points_contributed || 0) + addedPoints;
    }
  }

  /**
   * Add a player to a team in local state
   */
  _addPlayerToTeam(username, team) {
    // Remove from other team first
    this._removePlayerFromTeams(username);

    const teamList = team === 'blue' ? this.blueTeam : this.redTeam;
    if (!teamList.find(p => p.username === username)) {
      teamList.push({ username, team, points_contributed: 0 });
    }
  }

  /**
   * Remove a player from all teams in local state
   */
  _removePlayerFromTeams(username) {
    this.blueTeam = this.blueTeam.filter(p => p.username !== username);
    this.redTeam = this.redTeam.filter(p => p.username !== username);
  }

  /**
   * Get progress to next position move
   */
  getProgressToNextMove() {
    // How many points does each team need to move the front line one more position?
    const blueRemainder = this.bluePoints % CTF_CONFIG.pointsPerMove;
    const redRemainder = this.redPoints % CTF_CONFIG.pointsPerMove;

    return {
      blue: {
        current: blueRemainder,
        needed: CTF_CONFIG.pointsPerMove - blueRemainder
      },
      red: {
        current: redRemainder,
        needed: CTF_CONFIG.pointsPerMove - redRemainder
      }
    };
  }
}
