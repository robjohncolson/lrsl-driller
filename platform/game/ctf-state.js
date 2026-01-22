/**
 * CTF State Management
 *
 * Handles API calls and state for the Linear CTF game.
 * Each cartridge has one CTF game per class period.
 */

import { CTF_CONFIG } from '../../shared/ctf.config.js';

export class CTFState {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.cartridgeId = null;
    this.username = null;
    this.classPeriod = null;
    this.teacherPassword = null; // v4.3.4: For authenticated teacher actions

    // Game state
    this.frontPosition = CTF_CONFIG.startPosition;
    this.bluePoints = 0;
    this.redPoints = 0;
    this.winner = null;
    this.blueTeam = [];
    this.redTeam = [];
    this.userTeam = null;

    // v4.3.4: Server config with dynamic pointsPerMove
    this.config = { ...CTF_CONFIG };
    this.totalPlayers = 0;

    // Session state
    this.sessionStatus = 'idle';
    this.sessionStartTime = null;
    this.sessionEndTime = null;
    this.sessionStartedAt = null;
    this.sessionEndedAt = null;
    this.endReason = null;
    this.tiebreakerWinner = null;

    // Tiebreaker state
    this.tiebreakerStatus = null;

    // Callbacks
    this.onStateChange = null;
    this.onFrontMoved = null;
    this.onVictory = null;
    this.onTeamsUpdated = null;
    this.onSessionStarted = null;
    this.onSessionEnded = null;
    this.onSessionWarning = null;
    this.onTiebreakerStarting = null;
    this.onTiebreakerMatchStart = null;
    this.onTiebreakerMatchEnd = null;
    this.onTiebreakerComplete = null;
  }

  /**
   * Initialize state for a cartridge and class period
   * v4.3.4: Added teacherPassword parameter for authenticated actions
   */
  async init(cartridgeId, username, classPeriod, teacherPassword = null) {
    this.cartridgeId = cartridgeId;
    this.username = username;
    this.classPeriod = classPeriod;
    this.teacherPassword = teacherPassword;

    if (!classPeriod) {
      console.warn('CTFState: No class period provided');
      return null;
    }

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
      console.error('CTFState switchPeriod error:', err);
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

    const url = new URL(`${this.serverUrl}/api/ctf/${this.cartridgeId}/state`);
    url.searchParams.set('class_period', this.classPeriod);
    if (this.username) {
      url.searchParams.set('username', this.username);
    }

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch CTF state: ${response.status}`);
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

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/join`, {
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

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/points`, {
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
      // Don't throw for session-related rejections - just return null
      if (data.error === 'Session not active') {
        console.log('CTF points rejected: session not active');
        return null;
      }
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
   * v4.3.4: Now includes teacher password for authentication
   */
  async resetGame(preserveTeams = true) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (this.teacherPassword) {
      headers['x-teacher-password'] = this.teacherPassword;
    }

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/reset`, {
      method: 'POST',
      headers,
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

    const url = new URL(`${this.serverUrl}/api/ctf/${this.cartridgeId}/leaderboard`);
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

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/assign-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments,
        class_period: this.classPeriod
      })
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
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const url = new URL(`${this.serverUrl}/api/ctf/${this.cartridgeId}/player/${encodeURIComponent(username)}`);
    url.searchParams.set('class_period', this.classPeriod);

    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove player');
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

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/session/configure`, {
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

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/session/start`, {
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

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/session/stop`, {
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
    this.endReason = result.endReason;

    if (this.onStateChange) this.onStateChange();
    if (this.onSessionEnded) this.onSessionEnded(result);
    return result;
  }

  /**
   * Get session status with timer
   */
  async getSessionStatus() {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const url = new URL(`${this.serverUrl}/api/ctf/${this.cartridgeId}/session/status`);
    url.searchParams.set('class_period', this.classPeriod);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch session status');
    }

    return response.json();
  }

  // ============================================
  // TIEBREAKER
  // ============================================

  /**
   * Get tiebreaker status
   */
  async getTiebreakerStatus() {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const url = new URL(`${this.serverUrl}/api/ctf/${this.cartridgeId}/tiebreaker/status`);
    url.searchParams.set('class_period', this.classPeriod);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch tiebreaker status');
    }

    const result = await response.json();
    this.tiebreakerStatus = result;
    return result;
  }

  /**
   * Mark champion as ready
   */
  async confirmReady(matchNumber) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/tiebreaker/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        username: this.username,
        match_number: matchNumber
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to confirm ready');
    }

    return response.json();
  }

  /**
   * Start a tiebreaker match (teacher only)
   */
  async startTiebreakerMatch(matchNumber) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/tiebreaker/start-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        match_number: matchNumber
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to start match');
    }

    return response.json();
  }

  /**
   * Record match result (from Pong game)
   */
  async recordMatchResult(matchNumber, winner, blueScore, redScore) {
    if (!this.classPeriod) {
      throw new Error('class_period is required');
    }

    const response = await fetch(`${this.serverUrl}/api/ctf/${this.cartridgeId}/tiebreaker/match-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        match_number: matchNumber,
        winner,
        blue_score: blueScore,
        red_score: redScore
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to record match result');
    }

    return response.json();
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
          // Reset points for all players
          this.blueTeam = this.blueTeam.map(p => ({
            ...p,
            points_contributed: 0,
            session_points: 0
          }));
          this.redTeam = this.redTeam.map(p => ({
            ...p,
            points_contributed: 0,
            session_points: 0
          }));
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

      // Session messages
      case 'ctf_session_configured':
        this.sessionStartTime = message.startTime;
        this.sessionEndTime = message.endTime;
        this.sessionStatus = 'scheduled';
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_session_started':
        this.sessionStatus = 'active';
        this.sessionStartedAt = message.startedAt;
        if (this.onSessionStarted) this.onSessionStarted(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_session_warning':
        if (this.onSessionWarning) this.onSessionWarning(message.minutesRemaining);
        break;

      case 'ctf_session_ended':
        this.sessionStatus = message.requiresTiebreaker ? 'tiebreaker' : 'ended';
        this.endReason = message.reason;
        if (this.onSessionEnded) this.onSessionEnded(message);
        if (this.onStateChange) this.onStateChange();
        break;

      // Tiebreaker messages
      case 'ctf_tiebreaker_starting':
        this.sessionStatus = 'tiebreaker';
        this.tiebreakerStatus = {
          blueChampions: message.blueChampions,
          redChampions: message.redChampions,
          currentMatch: 0
        };
        if (this.onTiebreakerStarting) this.onTiebreakerStarting(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_tiebreaker_ready':
        // Could track ready states if needed
        break;

      case 'ctf_tiebreaker_match_start':
        if (this.tiebreakerStatus) {
          this.tiebreakerStatus.currentMatch = message.matchNumber;
        }
        if (this.onTiebreakerMatchStart) this.onTiebreakerMatchStart(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_tiebreaker_match_end':
        if (this.onTiebreakerMatchEnd) this.onTiebreakerMatchEnd(message);
        if (this.onStateChange) this.onStateChange();
        break;

      case 'ctf_tiebreaker_complete':
        this.sessionStatus = 'ended';
        this.tiebreakerWinner = message.winner;
        this.winner = message.winner;
        if (this.onTiebreakerComplete) this.onTiebreakerComplete(message);
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

    // v4.3.4: Store server config with dynamic pointsPerMove
    if (state.config) {
      this.config = state.config;
    }
    if (state.totalPlayers !== undefined) {
      this.totalPlayers = state.totalPlayers;
    }

    // Session state
    this.sessionStatus = state.sessionStatus || 'idle';
    this.sessionStartTime = state.sessionStartTime;
    this.sessionEndTime = state.sessionEndTime;
    this.sessionStartedAt = state.sessionStartedAt;
    this.sessionEndedAt = state.sessionEndedAt;
    this.endReason = state.endReason;
    this.tiebreakerWinner = state.tiebreakerWinner;

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
      player.session_points = (player.session_points || 0) + addedPoints;
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
      teamList.push({ username, team, points_contributed: 0, session_points: 0 });
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
   * v4.3.4: Uses dynamic pointsPerMove from server config
   */
  getProgressToNextMove() {
    // How many points does each team need to move the front line one more position?
    const ppm = this.config?.pointsPerMove || CTF_CONFIG.pointsPerMove;
    const blueRemainder = this.bluePoints % ppm;
    const redRemainder = this.redPoints % ppm;

    return {
      blue: {
        current: blueRemainder,
        needed: ppm - blueRemainder
      },
      red: {
        current: redRemainder,
        needed: ppm - redRemainder
      },
      pointsPerMove: ppm,
      totalPlayers: this.totalPlayers
    };
  }

  /**
   * Check if session is currently active (points can be added)
   */
  canAddPoints() {
    return this.sessionStatus === 'active' || this.sessionStatus === 'idle';
  }
}
