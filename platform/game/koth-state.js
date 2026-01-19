/**
 * King of the Hill State Management
 *
 * Handles API calls and state for the King of the Hill game mode.
 * Points decay over a rolling 7-minute window.
 * Hill holder banks time while controlling the hill.
 */

import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

export class KotHState {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.cartridgeId = null;
    this.username = null;
    this.classPeriod = null;

    // Game state
    this.blueBankedSeconds = 0;
    this.redBankedSeconds = 0;
    this.blueRollingTotal = 0;
    this.redRollingTotal = 0;
    this.currentHillHolder = null;
    this.hillControlSince = null;
    this.winner = null;
    this.blueTeam = [];
    this.redTeam = [];
    this.userTeam = null;

    // Session state
    this.sessionStatus = 'idle';
    this.sessionStartTime = null;
    this.sessionEndTime = null;
    this.sessionStartedAt = null;
    this.sessionEndedAt = null;
    this.endReason = null;
    this.tiebreakerWinner = null;

    // Config
    this.config = GAME_MODE_CONFIG.koth;

    // Callbacks
    this.onStateChange = null;
    this.onHillControlChanged = null;
    this.onPointsDecayed = null;
    this.onTimeBanked = null;
    this.onSessionStarted = null;
    this.onSessionEnded = null;
    this.onSessionWarning = null;
  }

  /**
   * Initialize state for a cartridge and class period
   */
  async init(cartridgeId, username, classPeriod) {
    this.cartridgeId = cartridgeId;
    this.username = username;
    this.classPeriod = classPeriod;

    if (!classPeriod) {
      console.warn('KotHState: No class period provided');
      return null;
    }

    try {
      const state = await this.fetchState();
      this._updateLocalState(state);
      return state;
    } catch (err) {
      console.error('KotHState init error:', err);
      throw err;
    }
  }

  /**
   * Change the class period (for teacher switching between periods)
   */
  async switchPeriod(classPeriod) {
    this.classPeriod = classPeriod;
    if (!classPeriod) return null;

    try {
      const state = await this.fetchState();
      this._updateLocalState(state);
      return state;
    } catch (err) {
      console.error('KotHState switchPeriod error:', err);
      throw err;
    }
  }

  /**
   * Fetch current game state from server
   */
  async fetchState() {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const url = new URL(`${this.serverUrl}/api/koth/${this.cartridgeId}/state`);
    url.searchParams.set('class_period', this.classPeriod);
    if (this.username) {
      url.searchParams.set('username', this.username);
    }

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch KotH state: ${response.status}`);
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

    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/koth/${this.cartridgeId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        team,
        class_period: this.classPeriod
      })
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

    if (!this.classPeriod) {
      console.warn('No class period set, cannot add points');
      return null;
    }

    const response = await fetch(`${this.serverUrl}/api/koth/${this.cartridgeId}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        points,
        starType,
        class_period: this.classPeriod
      })
    });

    if (!response.ok) {
      const data = await response.json();
      if (data.error === 'Session not active') {
        console.log('KotH points rejected: session not active');
        return null;
      }
      throw new Error(data.error || 'Failed to add points');
    }

    const result = await response.json();

    // Update local state
    this.blueRollingTotal = result.blueRollingTotal;
    this.redRollingTotal = result.redRollingTotal;
    this.currentHillHolder = result.hillHolder;

    if (this.onStateChange) this.onStateChange();
    return result;
  }

  /**
   * Reset game (teacher only)
   */
  async resetGame(preserveTeams = true) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/koth/${this.cartridgeId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preserveTeams,
        class_period: this.classPeriod
      })
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
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const url = new URL(`${this.serverUrl}/api/koth/${this.cartridgeId}/leaderboard`);
    url.searchParams.set('class_period', this.classPeriod);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return response.json();
  }

  /**
   * Bulk assign teams (teacher only)
   */
  async assignTeams(assignments) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    // KotH uses same pattern as CTF - players join individually
    // For bulk assignment, make multiple join calls
    const results = [];
    for (const { username, team } of assignments) {
      try {
        const response = await fetch(`${this.serverUrl}/api/koth/${this.cartridgeId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            team,
            class_period: this.classPeriod
          })
        });
        if (response.ok) {
          results.push({ username, team, success: true });
        }
      } catch (err) {
        results.push({ username, team, success: false, error: err.message });
      }
    }

    // Refresh state
    const state = await this.fetchState();
    this._updateLocalState(state);
    return state;
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Configure session times (teacher only)
   */
  async configureSession(startTime, endTime) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/koth/${this.cartridgeId}/session/configure`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        start_time: startTime,
        end_time: endTime
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to configure session');
    }

    const result = await response.json();
    this.sessionStartTime = result.startTime;
    this.sessionEndTime = result.endTime;
    this.sessionStatus = 'scheduled';

    if (this.onStateChange) this.onStateChange();
    return result;
  }

  /**
   * Start session manually (teacher only)
   */
  async startSession(durationMinutes = null) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/koth/${this.cartridgeId}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        duration_minutes: durationMinutes
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to start session');
    }

    const result = await response.json();
    this.sessionStatus = 'active';
    this.sessionStartedAt = result.startedAt;

    if (this.onStateChange) this.onStateChange();
    if (this.onSessionStarted) this.onSessionStarted(result);
    return result;
  }

  /**
   * Stop session manually (teacher only)
   */
  async stopSession() {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/koth/${this.cartridgeId}/session/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to stop session');
    }

    const result = await response.json();
    this.sessionStatus = result.sessionStatus;
    this.endReason = 'manual';

    if (this.onStateChange) this.onStateChange();
    if (this.onSessionEnded) this.onSessionEnded(result);
    return result;
  }

  // ============================================
  // WEBSOCKET HANDLING
  // ============================================

  /**
   * Handle WebSocket message
   */
  handleWebSocketMessage(message) {
    // Only process messages for our cartridge and period
    if (message.cartridgeId && message.cartridgeId !== this.cartridgeId) {
      return;
    }
    if (message.classPeriod && message.classPeriod !== this.classPeriod) {
      return;
    }

    switch (message.type) {
      case 'koth_hill_control_changed':
        this.currentHillHolder = message.holder;
        this.hillControlSince = message.since;
        if (this.onHillControlChanged) this.onHillControlChanged(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_points':
        this.blueRollingTotal = message.blueTotal;
        this.redRollingTotal = message.redTotal;
        this._updatePlayerPoints(message.username, message.team, message.points);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_points_decayed':
        this.blueRollingTotal = message.blueTotal;
        this.redRollingTotal = message.redTotal;
        if (this.onPointsDecayed) this.onPointsDecayed(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_time_banked':
        if (message.team === 'blue') {
          this.blueBankedSeconds = message.totalSeconds;
        } else {
          this.redBankedSeconds = message.totalSeconds;
        }
        if (this.onTimeBanked) this.onTimeBanked(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_player_joined':
        this._addPlayerToTeam(message.username, message.team);
        if (message.username === this.username) {
          this.userTeam = message.team;
        }
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_reset':
        this.blueBankedSeconds = 0;
        this.redBankedSeconds = 0;
        this.blueRollingTotal = 0;
        this.redRollingTotal = 0;
        this.currentHillHolder = null;
        this.hillControlSince = null;
        this.winner = null;
        this.sessionStatus = 'idle';
        this.sessionStartedAt = null;
        this.sessionEndedAt = null;
        this.endReason = null;
        this.tiebreakerWinner = null;
        if (!message.preserveTeams) {
          this.blueTeam = [];
          this.redTeam = [];
          this.userTeam = null;
        } else {
          this.blueTeam = this.blueTeam.map(p => ({ ...p, session_points: 0 }));
          this.redTeam = this.redTeam.map(p => ({ ...p, session_points: 0 }));
        }
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_session_configured':
        this.sessionStartTime = message.startTime;
        this.sessionEndTime = message.endTime;
        this.sessionStatus = 'scheduled';
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_session_started':
        this.sessionStatus = 'active';
        this.sessionStartedAt = message.startedAt;
        if (this.onSessionStarted) this.onSessionStarted(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'koth_session_warning':
        if (this.onSessionWarning) this.onSessionWarning(message.minutesRemaining);
        break;

      case 'koth_session_ended':
        this.sessionStatus = message.requiresTiebreaker ? 'tiebreaker' : 'ended';
        this.endReason = message.reason;
        this.winner = message.winner;
        this.blueBankedSeconds = message.blueBankedSeconds;
        this.redBankedSeconds = message.redBankedSeconds;
        if (this.onSessionEnded) this.onSessionEnded(message);
        if (this.onStateChange) this.onStateChange();
        break;
    }
  }

  /**
   * Update local state from server response
   */
  _updateLocalState(state) {
    this.blueBankedSeconds = state.blueBankedSeconds || 0;
    this.redBankedSeconds = state.redBankedSeconds || 0;
    this.blueRollingTotal = state.blueRollingTotal || 0;
    this.redRollingTotal = state.redRollingTotal || 0;
    this.currentHillHolder = state.currentHillHolder;
    this.hillControlSince = state.hillControlSince;
    this.winner = state.winner;
    this.blueTeam = state.blueTeam || [];
    this.redTeam = state.redTeam || [];
    this.userTeam = state.userTeam;

    // Session state
    this.sessionStatus = state.sessionStatus || 'idle';
    this.sessionStartTime = state.sessionStartTime;
    this.sessionEndTime = state.sessionEndTime;
    this.sessionStartedAt = state.sessionStartedAt;
    this.sessionEndedAt = state.sessionEndedAt;
    this.endReason = state.endReason;
    this.tiebreakerWinner = state.tiebreakerWinner;

    if (state.config) {
      this.config = state.config;
    }

    if (this.onStateChange) this.onStateChange();
  }

  /**
   * Update a player's points in local state
   */
  _updatePlayerPoints(username, team, addedPoints) {
    const teamList = team === 'blue' ? this.blueTeam : this.redTeam;
    const player = teamList.find(p => p.username === username);
    if (player) {
      player.session_points = (player.session_points || 0) + addedPoints;
      player.total_points = (player.total_points || 0) + addedPoints;
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
      teamList.push({ username, team, session_points: 0, total_points: 0 });
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
   * Check if session is currently active (points can be added)
   */
  canAddPoints() {
    return this.sessionStatus === 'active' || this.sessionStatus === 'idle';
  }

  /**
   * Format banked time as MM:SS
   */
  formatBankedTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
