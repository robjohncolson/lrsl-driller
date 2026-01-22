/**
 * KotH Panel
 *
 * Main UI component for the King of the Hill game mode.
 * Combines state management, rendering, and team UI.
 * Supports per-period games and timed sessions.
 */

import { KotHState } from './koth-state.js';
import { KotHRenderer } from './koth-renderer.js';
import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

export class KotHPanel {
  constructor(container, serverUrl) {
    this.container = container;
    this.serverUrl = serverUrl;
    this.state = new KotHState(serverUrl);
    this.renderer = null;

    this.isTeacher = false;
    this.userClassPeriod = null;
    this.teacherPassword = null; // v4.3.4: For authenticated teacher actions
    this.allUsers = [];

    // Timer intervals
    this.timerInterval = null;
    this.bankingInterval = null;

    // Wire up state callbacks
    this.state.onStateChange = () => this._onStateChange();
    this.state.onHillControlChanged = (msg) => this._onHillControlChanged(msg);
    this.state.onSessionStarted = (msg) => this._onSessionStarted(msg);
    this.state.onSessionEnded = (msg) => this._onSessionEnded(msg);
    this.state.onSessionWarning = (min) => this._onSessionWarning(min);

    this._render();
  }

  /**
   * Initialize for a cartridge
   * v4.3.4: Added teacherPassword parameter for authenticated teacher actions
   */
  async init(cartridgeId, username, isTeacher = false, userClassPeriod = null, teacherPassword = null) {
    this.isTeacher = isTeacher;
    this.userClassPeriod = userClassPeriod;
    this.teacherPassword = teacherPassword;

    const initialPeriod = isTeacher ? (userClassPeriod || 'A') : userClassPeriod;

    if (!initialPeriod && !isTeacher) {
      this._showNoPeriodMessage();
      return null;
    }

    await this.state.init(cartridgeId, username, initialPeriod, teacherPassword);
    this._updateUI();

    // Initialize renderer after DOM is ready
    const canvas = this.container.querySelector('#koth-canvas');
    if (canvas) {
      this.renderer = new KotHRenderer(canvas);
      this.renderer.render(this.state);
    }

    // Start timers if needed
    this._startTimerIfNeeded();
    this._startBankingIfNeeded();

    return this.state;
  }

  /**
   * Set available users (for teacher team assignment)
   */
  setAvailableUsers(users) {
    this.allUsers = users;
    if (this.isTeacher) {
      this._updateTeacherPanel();
    }
  }

  /**
   * Handle WebSocket message
   */
  handleMessage(message) {
    this.state.handleWebSocketMessage(message);
  }

  /**
   * Add points from a star (called by app.html on star earned)
   */
  async addPoints(points, starType) {
    if (!this.state.canAddPoints()) {
      console.log('KotH: Cannot add points - session status:', this.state.sessionStatus);
      return null;
    }

    const result = await this.state.addPoints(points, starType);

    if (result && this.renderer) {
      this.renderer.render(this.state);
    }

    return result;
  }

  /**
   * Check if points can be added
   */
  canAddPoints() {
    return this.state.canAddPoints();
  }

  /**
   * Show message for students without assigned class period
   */
  _showNoPeriodMessage() {
    this.container.innerHTML = `
      <div class="koth-panel">
        <div class="koth-header">
          <h3>King of the Hill</h3>
        </div>
        <div class="no-period-warning">
          <p>Please ask your teacher to assign your class period before joining KotH.</p>
        </div>
      </div>
    `;
    this._addStyles();
  }

  /**
   * Render the panel HTML
   */
  _render() {
    const validPeriods = GAME_MODE_CONFIG.validPeriods;

    this.container.innerHTML = `
      <div class="koth-panel">
        <div class="koth-header">
          <h3>King of the Hill</h3>
          <span class="koth-status" id="koth-status"></span>
        </div>

        ${this.isTeacher ? `
        <div class="period-selector">
          <label>Class Period:</label>
          <select id="koth-period-select">
            ${validPeriods.map(p => `<option value="${p}">Period ${p}</option>`).join('')}
          </select>
        </div>
        ` : ''}

        <div class="session-status" id="session-status-bar" style="display: none;">
          <span class="status-badge" id="session-badge">IDLE</span>
          <span class="countdown" id="session-countdown"></span>
        </div>

        <canvas id="koth-canvas" style="width: 100%; height: 140px;"></canvas>

        <div class="koth-teams">
          <div class="koth-team blue">
            <h4>Blue Team</h4>
            <ul id="blue-team-list"></ul>
          </div>
          <div class="koth-team red">
            <h4>Red Team</h4>
            <ul id="red-team-list"></ul>
          </div>
        </div>

        <div class="koth-join" id="koth-join" style="display: none;">
          <p>Choose your team:</p>
          <button class="btn-blue" id="join-blue">Join Blue</button>
          <button class="btn-red" id="join-red">Join Red</button>
        </div>

        <div class="koth-your-team" id="koth-your-team" style="display: none;">
          <p>Your team: <strong id="your-team-name"></strong></p>
        </div>

        <div class="koth-teacher" id="koth-teacher" style="display: none;">
          <h4>Teacher Controls</h4>

          <div class="session-controls">
            <h5>Session Timer</h5>
            <div class="session-time-inputs">
              <label>Start: <input type="time" id="session-start-time"></label>
              <label>End: <input type="time" id="session-end-time"></label>
            </div>
            <div class="session-buttons">
              <button id="configure-session">Schedule</button>
              <button id="start-session-now">Start Now</button>
              <button id="stop-session">Stop</button>
            </div>
          </div>

          <div class="teacher-actions">
            <button id="koth-reset-keep">Reset (Keep Teams)</button>
            <button id="koth-reset-clear">Reset (Clear All)</button>
          </div>

          <div class="team-assignment">
            <h5>Assign Teams</h5>
            <select id="user-select" multiple size="8"></select>
            <div class="assign-buttons">
              <button id="assign-blue">\u2192 Blue</button>
              <button id="assign-red">\u2192 Red</button>
              <button id="assign-auto">Auto Balance</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this._attachEventListeners();
    this._addStyles();
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Period selector (teacher only)
    this.container.querySelector('#koth-period-select')?.addEventListener('change', async (e) => {
      const period = e.target.value;
      await this.state.switchPeriod(period);
      this._updateUI();
      if (this.renderer) {
        this.renderer.render(this.state);
      }
      this._startTimerIfNeeded();
      this._startBankingIfNeeded();
    });

    // Join buttons
    this.container.querySelector('#join-blue')?.addEventListener('click', () => this._joinTeam('blue'));
    this.container.querySelector('#join-red')?.addEventListener('click', () => this._joinTeam('red'));

    // Session controls
    this.container.querySelector('#configure-session')?.addEventListener('click', () => this._configureSession());
    this.container.querySelector('#start-session-now')?.addEventListener('click', () => this._startSessionNow());
    this.container.querySelector('#stop-session')?.addEventListener('click', () => this._stopSession());

    // Teacher controls
    this.container.querySelector('#koth-reset-keep')?.addEventListener('click', () => this.state.resetGame(true));
    this.container.querySelector('#koth-reset-clear')?.addEventListener('click', () => this.state.resetGame(false));

    // Team assignment
    this.container.querySelector('#assign-blue')?.addEventListener('click', () => this._assignSelectedToTeam('blue'));
    this.container.querySelector('#assign-red')?.addEventListener('click', () => this._assignSelectedToTeam('red'));
    this.container.querySelector('#assign-auto')?.addEventListener('click', () => this._autoBalanceTeams());
  }

  /**
   * Add styles
   */
  _addStyles() {
    if (document.getElementById('koth-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'koth-panel-styles';
    style.textContent = `
      .koth-panel {
        padding: 10px;
        background: #1f2937;
        border-radius: 8px;
        color: #f9fafb;
      }

      .koth-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .koth-header h3 {
        margin: 0;
        font-size: 16px;
      }

      .koth-status {
        font-size: 12px;
        color: #9ca3af;
      }

      .period-selector {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .period-selector label { font-size: 13px; }

      .period-selector select {
        padding: 4px 8px;
        border-radius: 4px;
        background: #374151;
        color: white;
        border: 1px solid #4b5563;
      }

      .session-status {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        padding: 8px;
        background: #374151;
        border-radius: 4px;
      }

      .status-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
      }

      .status-badge.idle { background: #6b7280; }
      .status-badge.scheduled { background: #3b82f6; }
      .status-badge.active { background: #10b981; }
      .status-badge.tiebreaker { background: #f59e0b; }
      .status-badge.ended { background: #ef4444; }

      .countdown { font-size: 14px; font-weight: bold; }
      .countdown.warning { color: #f59e0b; animation: pulse 1s infinite; }
      .countdown.danger { color: #ef4444; animation: pulse 0.5s infinite; }

      .no-period-warning {
        text-align: center;
        padding: 20px;
        background: #374151;
        border-radius: 4px;
        border: 2px dashed #f59e0b;
      }

      .no-period-warning p { margin: 0; color: #f59e0b; }

      #koth-canvas {
        background: #111827;
        border-radius: 4px;
        margin-bottom: 10px;
      }

      .koth-teams {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .koth-team {
        flex: 1;
        padding: 8px;
        border-radius: 4px;
        background: #374151;
      }

      .koth-team.blue { border-left: 3px solid #3b82f6; }
      .koth-team.red { border-left: 3px solid #ef4444; }

      .koth-team h4 { margin: 0 0 5px 0; font-size: 14px; }

      .koth-team ul {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 100px;
        overflow-y: auto;
        font-size: 12px;
      }

      .koth-team li {
        padding: 2px 0;
        display: flex;
        justify-content: space-between;
      }

      .koth-team li .points { color: #9ca3af; }

      .koth-join {
        text-align: center;
        padding: 10px;
        background: #374151;
        border-radius: 4px;
      }

      .koth-join p { margin: 0 0 10px 0; }

      .koth-join button {
        padding: 8px 20px;
        margin: 0 5px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }

      .btn-blue { background: #3b82f6; color: white; }
      .btn-red { background: #ef4444; color: white; }

      .koth-your-team {
        text-align: center;
        padding: 8px;
        background: #374151;
        border-radius: 4px;
      }

      .koth-your-team p { margin: 0; }

      .koth-teacher {
        margin-top: 15px;
        padding: 10px;
        background: #374151;
        border-radius: 4px;
        border: 1px dashed #6b7280;
      }

      .koth-teacher h4 { margin: 0 0 10px 0; color: #fbbf24; }
      .koth-teacher h5 { margin: 10px 0 5px 0; font-size: 13px; color: #9ca3af; }

      .session-controls {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #4b5563;
      }

      .session-time-inputs {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
      }

      .session-time-inputs label { font-size: 12px; }

      .session-time-inputs input {
        padding: 4px;
        border-radius: 4px;
        background: #1f2937;
        color: white;
        border: 1px solid #4b5563;
      }

      .session-buttons {
        display: flex;
        gap: 8px;
      }

      .session-buttons button {
        flex: 1;
        padding: 6px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        background: #4b5563;
        color: white;
      }

      .session-buttons button:hover { background: #6b7280; }
      #start-session-now { background: #10b981; }
      #stop-session { background: #ef4444; }

      .teacher-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .teacher-actions button {
        flex: 1;
        padding: 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: #4b5563;
        color: white;
      }

      .teacher-actions button:hover { background: #6b7280; }

      .team-assignment select {
        width: 100%;
        background: #1f2937;
        color: white;
        border: 1px solid #4b5563;
        border-radius: 4px;
        padding: 5px;
        margin-bottom: 10px;
      }

      .assign-buttons {
        display: flex;
        gap: 5px;
      }

      .assign-buttons button {
        flex: 1;
        padding: 6px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .assign-buttons #assign-blue { background: #3b82f6; color: white; }
      .assign-buttons #assign-red { background: #ef4444; color: white; }
      .assign-buttons #assign-auto { background: #6b7280; color: white; }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update UI from current state
   */
  _updateUI() {
    // Update team lists
    this._updateTeamList('blue', this.state.blueTeam);
    this._updateTeamList('red', this.state.redTeam);

    // Update session status bar
    this._updateSessionStatusBar();

    // Show/hide join section
    const joinSection = this.container.querySelector('#koth-join');
    const yourTeamSection = this.container.querySelector('#koth-your-team');

    if (this.state.userTeam) {
      if (joinSection) joinSection.style.display = 'none';
      if (yourTeamSection) {
        yourTeamSection.style.display = 'block';
        const teamName = this.container.querySelector('#your-team-name');
        if (teamName) {
          teamName.textContent = this.state.userTeam.toUpperCase();
          teamName.style.color = this.state.userTeam === 'blue' ? '#3b82f6' : '#ef4444';
        }
      }
    } else if (!this.isTeacher) {
      if (joinSection) joinSection.style.display = 'block';
      if (yourTeamSection) yourTeamSection.style.display = 'none';
    }

    // Show/hide teacher panel
    const teacherPanel = this.container.querySelector('#koth-teacher');
    if (teacherPanel) {
      teacherPanel.style.display = this.isTeacher ? 'block' : 'none';
    }

    // Update game status
    const statusEl = this.container.querySelector('#koth-status');
    if (statusEl) {
      if (this.state.winner) {
        statusEl.textContent = `${this.state.winner.toUpperCase()} wins!`;
      } else if (this.state.currentHillHolder) {
        statusEl.textContent = `${this.state.currentHillHolder.toUpperCase()} controls the hill`;
      } else {
        statusEl.textContent = 'Hill contested';
      }
    }

    // Render canvas
    if (this.renderer) {
      this.renderer.render(this.state);
    }
  }

  /**
   * Update session status bar
   */
  _updateSessionStatusBar() {
    const statusBar = this.container.querySelector('#session-status-bar');
    const badge = this.container.querySelector('#session-badge');

    if (!statusBar || !badge) return;

    const status = this.state.sessionStatus;
    statusBar.style.display = (status !== 'idle' || this.isTeacher) ? 'flex' : 'none';

    badge.textContent = status.toUpperCase();
    badge.className = `status-badge ${status}`;
  }

  /**
   * Start countdown timer if session is active
   */
  _startTimerIfNeeded() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.state.sessionStatus === 'active' && this.state.sessionEndTime) {
      this.timerInterval = setInterval(() => this._updateCountdown(), 1000);
      this._updateCountdown();
    }
  }

  /**
   * Start banking interval if session is active
   */
  _startBankingIfNeeded() {
    if (this.bankingInterval) {
      clearInterval(this.bankingInterval);
      this.bankingInterval = null;
    }

    if (this.state.sessionStatus === 'active') {
      // Banking happens server-side, but we can update UI every second
      this.bankingInterval = setInterval(() => {
        if (this.renderer) {
          this.renderer.render(this.state);
        }
      }, 1000);
    }
  }

  /**
   * Update countdown display
   */
  _updateCountdown() {
    const countdownEl = this.container.querySelector('#session-countdown');
    if (!countdownEl) return;

    if (this.state.sessionStatus !== 'active' || !this.state.sessionEndTime) {
      countdownEl.textContent = '';
      countdownEl.className = 'countdown';
      return;
    }

    const now = new Date();
    const [hours, minutes] = this.state.sessionEndTime.split(':');
    const endTime = new Date(now);
    endTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }

    const remainingMs = endTime.getTime() - now.getTime();
    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);

    if (remainingMs <= 0) {
      countdownEl.textContent = 'Ending...';
      countdownEl.className = 'countdown danger';
    } else {
      countdownEl.textContent = `${remainingMin}:${remainingSec.toString().padStart(2, '0')} remaining`;

      if (remainingMin < 1) {
        countdownEl.className = 'countdown danger';
      } else if (remainingMin < 5) {
        countdownEl.className = 'countdown warning';
      } else {
        countdownEl.className = 'countdown';
      }
    }
  }

  /**
   * Update a team's player list
   */
  _updateTeamList(team, players) {
    const listEl = this.container.querySelector(`#${team}-team-list`);
    if (!listEl) return;

    listEl.innerHTML = players
      .sort((a, b) => (b.session_points || 0) - (a.session_points || 0))
      .map(p => `
        <li>
          <span class="name">${p.username}</span>
          <span class="points">${p.session_points || 0} pts</span>
        </li>
      `).join('');
  }

  /**
   * Update teacher panel with available users
   */
  _updateTeacherPanel() {
    const select = this.container.querySelector('#user-select');
    if (!select) return;

    const periodUsers = this.allUsers.filter(u =>
      !this.state.classPeriod || u.class_period === this.state.classPeriod
    );

    const assignedUsernames = new Set([
      ...this.state.blueTeam.map(p => p.username),
      ...this.state.redTeam.map(p => p.username)
    ]);

    const unassigned = periodUsers.filter(u => !assignedUsernames.has(u.username));

    select.innerHTML = unassigned.map(u => `
      <option value="${u.username}">${u.real_name || u.username}</option>
    `).join('');
  }

  /**
   * Join a team
   */
  async _joinTeam(team) {
    try {
      await this.state.joinTeam(team);
      this._updateUI();
    } catch (err) {
      console.error('Failed to join team:', err);
      alert('Failed to join team: ' + err.message);
    }
  }

  /**
   * Configure session times
   */
  async _configureSession() {
    const startInput = this.container.querySelector('#session-start-time');
    const endInput = this.container.querySelector('#session-end-time');

    if (!startInput?.value || !endInput?.value) {
      alert('Please set both start and end times');
      return;
    }

    try {
      await this.state.configureSession(startInput.value, endInput.value);
      this._updateUI();
    } catch (err) {
      console.error('Failed to configure session:', err);
      alert('Failed to configure session: ' + err.message);
    }
  }

  /**
   * Start session immediately
   */
  async _startSessionNow() {
    try {
      await this.state.startSession();
      this._updateUI();
      this._startTimerIfNeeded();
      this._startBankingIfNeeded();
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start session: ' + err.message);
    }
  }

  /**
   * Stop current session
   */
  async _stopSession() {
    try {
      await this.state.stopSession();
      this._updateUI();
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.bankingInterval) {
        clearInterval(this.bankingInterval);
        this.bankingInterval = null;
      }
    } catch (err) {
      console.error('Failed to stop session:', err);
      alert('Failed to stop session: ' + err.message);
    }
  }

  /**
   * Assign selected users to a team (teacher)
   */
  async _assignSelectedToTeam(team) {
    const select = this.container.querySelector('#user-select');
    if (!select) return;

    const selectedUsernames = Array.from(select.selectedOptions).map(o => o.value);
    if (selectedUsernames.length === 0) return;

    const assignments = selectedUsernames.map(username => ({ username, team }));

    try {
      await this.state.assignTeams(assignments);
      this._updateTeacherPanel();
    } catch (err) {
      console.error('Failed to assign teams:', err);
      alert('Failed to assign teams: ' + err.message);
    }
  }

  /**
   * Auto-balance teams (teacher)
   */
  async _autoBalanceTeams() {
    const select = this.container.querySelector('#user-select');
    if (!select) return;

    const unassigned = Array.from(select.options).map(o => o.value);
    if (unassigned.length === 0) return;

    const shuffled = unassigned.sort(() => Math.random() - 0.5);
    const midpoint = Math.ceil(shuffled.length / 2);

    const blueSize = this.state.blueTeam.length;
    const redSize = this.state.redTeam.length;

    const assignments = shuffled.map((username, i) => {
      let team;
      if (blueSize + (i < midpoint ? 1 : 0) <= redSize + (i >= midpoint ? 1 : 0)) {
        team = i < midpoint ? 'blue' : 'red';
      } else {
        team = i < midpoint ? 'red' : 'blue';
      }
      return { username, team };
    });

    try {
      await this.state.assignTeams(assignments);
      this._updateTeacherPanel();
    } catch (err) {
      console.error('Failed to auto-balance:', err);
      alert('Failed to auto-balance teams: ' + err.message);
    }
  }

  /**
   * State change callback
   */
  _onStateChange() {
    this._updateUI();
  }

  /**
   * Hill control changed callback
   */
  _onHillControlChanged(msg) {
    if (this.renderer) {
      this.renderer.animateHillChange(null, msg.holder, this.state);
    }
  }

  /**
   * Session started callback
   */
  _onSessionStarted(msg) {
    this._startTimerIfNeeded();
    this._startBankingIfNeeded();
  }

  /**
   * Session ended callback
   */
  _onSessionEnded(msg) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.bankingInterval) {
      clearInterval(this.bankingInterval);
      this.bankingInterval = null;
    }

    if (msg.requiresTiebreaker) {
      console.log('Tiebreaker required!');
    }
  }

  /**
   * Session warning callback
   */
  _onSessionWarning(minutesRemaining) {
    console.log(`Warning: ${minutesRemaining} minute(s) remaining!`);
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.bankingInterval) {
      clearInterval(this.bankingInterval);
      this.bankingInterval = null;
    }
  }
}
