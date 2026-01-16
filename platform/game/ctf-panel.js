/**
 * CTF Panel
 *
 * Main UI component for the Linear CTF game.
 * Combines state management, rendering, and team UI.
 */

import { CTFState } from './ctf-state.js';
import { CTFRenderer } from './ctf-renderer.js';
import { CTF_CONFIG } from '../../shared/ctf.config.js';

export class CTFPanel {
  constructor(container, serverUrl) {
    this.container = container;
    this.serverUrl = serverUrl;
    this.state = new CTFState(serverUrl);
    this.renderer = null;

    this.isTeacher = false;
    this.allUsers = []; // For teacher team assignment

    // Wire up state callbacks
    this.state.onStateChange = () => this._onStateChange();
    this.state.onFrontMoved = (msg) => this._onFrontMoved(msg);
    this.state.onVictory = (winner) => this._onVictory(winner);
    this.state.onTeamsUpdated = () => this._onTeamsUpdated();

    this._render();
  }

  /**
   * Initialize for a cartridge
   */
  async init(cartridgeId, username, isTeacher = false) {
    this.isTeacher = isTeacher;
    await this.state.init(cartridgeId, username);
    this._updateUI();

    // Initialize renderer after DOM is ready
    const canvas = this.container.querySelector('#ctf-canvas');
    if (canvas) {
      this.renderer = new CTFRenderer(canvas);
      this.renderer.render(this.state);
    }
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
    const oldPosition = this.state.frontPosition;
    const result = await this.state.addPoints(points, starType);

    if (result && result.frontPosition !== oldPosition && this.renderer) {
      this.renderer.animateFrontMove(oldPosition, result.frontPosition, this.state);
    }

    return result;
  }

  /**
   * Render the panel HTML
   */
  _render() {
    this.container.innerHTML = `
      <div class="ctf-panel">
        <div class="ctf-header">
          <h3>Capture The Flag</h3>
          <span class="ctf-status" id="ctf-status"></span>
        </div>

        <canvas id="ctf-canvas" style="width: 100%; height: 100px;"></canvas>

        <div class="ctf-scores">
          <div class="ctf-score blue">
            <span class="team-name">Blue</span>
            <span class="team-points" id="blue-points">0</span>
          </div>
          <div class="ctf-score red">
            <span class="team-name">Red</span>
            <span class="team-points" id="red-points">0</span>
          </div>
        </div>

        <div class="ctf-teams">
          <div class="ctf-team blue">
            <h4>Blue Team</h4>
            <ul id="blue-team-list"></ul>
          </div>
          <div class="ctf-team red">
            <h4>Red Team</h4>
            <ul id="red-team-list"></ul>
          </div>
        </div>

        <div class="ctf-join" id="ctf-join" style="display: none;">
          <p>Choose your team:</p>
          <button class="btn-blue" id="join-blue">Join Blue</button>
          <button class="btn-red" id="join-red">Join Red</button>
        </div>

        <div class="ctf-your-team" id="ctf-your-team" style="display: none;">
          <p>Your team: <strong id="your-team-name"></strong></p>
        </div>

        <div class="ctf-teacher" id="ctf-teacher" style="display: none;">
          <h4>Teacher Controls</h4>
          <div class="teacher-actions">
            <button id="ctf-reset-keep">Reset (Keep Teams)</button>
            <button id="ctf-reset-clear">Reset (Clear Teams)</button>
          </div>
          <div class="team-assignment">
            <h5>Assign Teams</h5>
            <select id="user-select" multiple size="8"></select>
            <div class="assign-buttons">
              <button id="assign-blue">→ Blue</button>
              <button id="assign-red">→ Red</button>
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
    // Join buttons
    this.container.querySelector('#join-blue')?.addEventListener('click', () => {
      this._joinTeam('blue');
    });
    this.container.querySelector('#join-red')?.addEventListener('click', () => {
      this._joinTeam('red');
    });

    // Teacher controls
    this.container.querySelector('#ctf-reset-keep')?.addEventListener('click', () => {
      this.state.resetGame(true);
    });
    this.container.querySelector('#ctf-reset-clear')?.addEventListener('click', () => {
      this.state.resetGame(false);
    });

    // Team assignment
    this.container.querySelector('#assign-blue')?.addEventListener('click', () => {
      this._assignSelectedToTeam('blue');
    });
    this.container.querySelector('#assign-red')?.addEventListener('click', () => {
      this._assignSelectedToTeam('red');
    });
    this.container.querySelector('#assign-auto')?.addEventListener('click', () => {
      this._autoBalanceTeams();
    });
  }

  /**
   * Add styles
   */
  _addStyles() {
    if (document.getElementById('ctf-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'ctf-panel-styles';
    style.textContent = `
      .ctf-panel {
        padding: 10px;
        background: #1f2937;
        border-radius: 8px;
        color: #f9fafb;
      }

      .ctf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .ctf-header h3 {
        margin: 0;
        font-size: 16px;
      }

      .ctf-status {
        font-size: 12px;
        color: #9ca3af;
      }

      #ctf-canvas {
        background: #111827;
        border-radius: 4px;
        margin-bottom: 10px;
      }

      .ctf-scores {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
      }

      .ctf-score {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 20px;
        border-radius: 4px;
      }

      .ctf-score.blue {
        background: #1d4ed8;
      }

      .ctf-score.red {
        background: #b91c1c;
      }

      .ctf-score .team-name {
        font-size: 12px;
        text-transform: uppercase;
      }

      .ctf-score .team-points {
        font-size: 24px;
        font-weight: bold;
      }

      .ctf-teams {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .ctf-team {
        flex: 1;
        padding: 8px;
        border-radius: 4px;
        background: #374151;
      }

      .ctf-team.blue {
        border-left: 3px solid #3b82f6;
      }

      .ctf-team.red {
        border-left: 3px solid #ef4444;
      }

      .ctf-team h4 {
        margin: 0 0 5px 0;
        font-size: 14px;
      }

      .ctf-team ul {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 100px;
        overflow-y: auto;
        font-size: 12px;
      }

      .ctf-team li {
        padding: 2px 0;
        display: flex;
        justify-content: space-between;
      }

      .ctf-team li .points {
        color: #9ca3af;
      }

      .ctf-join {
        text-align: center;
        padding: 10px;
        background: #374151;
        border-radius: 4px;
      }

      .ctf-join p {
        margin: 0 0 10px 0;
      }

      .ctf-join button {
        padding: 8px 20px;
        margin: 0 5px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }

      .btn-blue {
        background: #3b82f6;
        color: white;
      }

      .btn-red {
        background: #ef4444;
        color: white;
      }

      .ctf-your-team {
        text-align: center;
        padding: 8px;
        background: #374151;
        border-radius: 4px;
      }

      .ctf-your-team p {
        margin: 0;
      }

      .ctf-teacher {
        margin-top: 15px;
        padding: 10px;
        background: #374151;
        border-radius: 4px;
        border: 1px dashed #6b7280;
      }

      .ctf-teacher h4 {
        margin: 0 0 10px 0;
        color: #fbbf24;
      }

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

      .teacher-actions button:hover {
        background: #6b7280;
      }

      .team-assignment h5 {
        margin: 0 0 5px 0;
        font-size: 13px;
      }

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

      .assign-buttons #assign-blue {
        background: #3b82f6;
        color: white;
      }

      .assign-buttons #assign-red {
        background: #ef4444;
        color: white;
      }

      .assign-buttons #assign-auto {
        background: #6b7280;
        color: white;
      }

      .ctf-victory-banner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 40px;
        border-radius: 8px;
        font-size: 24px;
        font-weight: bold;
        animation: pulse 1s infinite;
      }

      .ctf-victory-banner.blue {
        background: #3b82f6;
        color: white;
      }

      .ctf-victory-banner.red {
        background: #ef4444;
        color: white;
      }

      @keyframes pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update UI from current state
   */
  _updateUI() {
    // Update scores
    const bluePointsEl = this.container.querySelector('#blue-points');
    const redPointsEl = this.container.querySelector('#red-points');
    if (bluePointsEl) bluePointsEl.textContent = this.state.bluePoints;
    if (redPointsEl) redPointsEl.textContent = this.state.redPoints;

    // Update team lists
    this._updateTeamList('blue', this.state.blueTeam);
    this._updateTeamList('red', this.state.redTeam);

    // Show/hide join section
    const joinSection = this.container.querySelector('#ctf-join');
    const yourTeamSection = this.container.querySelector('#ctf-your-team');

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
    const teacherPanel = this.container.querySelector('#ctf-teacher');
    if (teacherPanel) {
      teacherPanel.style.display = this.isTeacher ? 'block' : 'none';
    }

    // Update status
    const statusEl = this.container.querySelector('#ctf-status');
    if (statusEl) {
      if (this.state.winner) {
        statusEl.textContent = `${this.state.winner.toUpperCase()} wins!`;
      } else {
        const progress = this.state.getProgressToNextMove();
        const blueToNext = progress.blue.needed;
        const redToNext = progress.red.needed;
        statusEl.textContent = `Blue: ${blueToNext} to move | Red: ${redToNext} to move`;
      }
    }

    // Render canvas
    if (this.renderer) {
      this.renderer.render(this.state);
    }
  }

  /**
   * Update a team's player list
   */
  _updateTeamList(team, players) {
    const listEl = this.container.querySelector(`#${team}-team-list`);
    if (!listEl) return;

    listEl.innerHTML = players
      .sort((a, b) => b.points_contributed - a.points_contributed)
      .map(p => `
        <li>
          <span class="name">${p.username}</span>
          <span class="points">${p.points_contributed} pts</span>
        </li>
      `).join('');
  }

  /**
   * Update teacher panel with available users
   */
  _updateTeacherPanel() {
    const select = this.container.querySelector('#user-select');
    if (!select) return;

    // Get users not yet assigned
    const assignedUsernames = new Set([
      ...this.state.blueTeam.map(p => p.username),
      ...this.state.redTeam.map(p => p.username)
    ]);

    const unassigned = this.allUsers.filter(u => !assignedUsernames.has(u.username));

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

    // Shuffle and split evenly
    const shuffled = unassigned.sort(() => Math.random() - 0.5);
    const midpoint = Math.ceil(shuffled.length / 2);

    // Balance based on current team sizes
    const blueSize = this.state.blueTeam.length;
    const redSize = this.state.redTeam.length;

    const assignments = shuffled.map((username, i) => {
      // Assign to smaller team, alternating for equal sizes
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
   * Front moved callback
   */
  _onFrontMoved(msg) {
    // Animate if renderer exists
    if (this.renderer && msg.frontPosition !== this.state.frontPosition) {
      this.renderer.animateFrontMove(this.state.frontPosition, msg.frontPosition, this.state);
    }
  }

  /**
   * Victory callback
   */
  _onVictory(winner) {
    // Show victory banner
    const banner = document.createElement('div');
    banner.className = `ctf-victory-banner ${winner}`;
    banner.textContent = `${winner.toUpperCase()} WINS!`;
    this.container.appendChild(banner);

    // Remove after 5 seconds
    setTimeout(() => banner.remove(), 5000);
  }

  /**
   * Teams updated callback
   */
  _onTeamsUpdated() {
    this._updateUI();
    if (this.isTeacher) {
      this._updateTeacherPanel();
    }
  }
}
