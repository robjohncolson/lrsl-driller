/**
 * Tiebreaker Manager
 *
 * Orchestrates tiebreaker series (best of 3) using different minigames.
 * Handles champion selection, ready checks, match flow, and results.
 */

import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';
import { PongTiebreaker } from './pong-tiebreaker.js';

export class TiebreakerManager {
  constructor(container, serverUrl, wsClient) {
    this.container = container;
    this.serverUrl = serverUrl;
    this.wsClient = wsClient;

    // Context
    this.cartridgeId = null;
    this.classPeriod = null;
    this.gameMode = null;
    this.username = null;
    this.isTeacher = false;

    // Tiebreaker settings
    this.tiebreakerType = GAME_MODE_CONFIG.defaults.tiebreakerType;
    this.matchesToWin = GAME_MODE_CONFIG.series.matchesToWin;

    // Champions
    this.blueChampions = [];
    this.redChampions = [];

    // Series state
    this.currentMatchNumber = 0;
    this.blueMatchWins = 0;
    this.redMatchWins = 0;
    this.matches = []; // Array of match results

    // Current match state
    this.currentMatch = null;
    this.activeMinigame = null;

    // Lazy-loaded minigame classes
    this.minigameClasses = {
      pong: PongTiebreaker,
      quick_calc: null,
      reflex_duel: null
    };

    // Callbacks
    this.onSeriesComplete = null;
    this.onMatchComplete = null;
    this.onMatchStart = null;

    // UI elements
    this.matchContainer = null;

    this._render();
  }

  /**
   * Initialize tiebreaker for a game
   */
  async init(cartridgeId, classPeriod, gameMode, username, isTeacher, tiebreakerType) {
    this.cartridgeId = cartridgeId;
    this.classPeriod = classPeriod;
    this.gameMode = gameMode;
    this.username = username;
    this.isTeacher = isTeacher;
    this.tiebreakerType = tiebreakerType || GAME_MODE_CONFIG.defaults.tiebreakerType;

    // Reset state
    this.currentMatchNumber = 0;
    this.blueMatchWins = 0;
    this.redMatchWins = 0;
    this.matches = [];
    this.blueChampions = [];
    this.redChampions = [];

    // Fetch tiebreaker status from server
    try {
      const status = await this._fetchStatus();
      this._updateFromServerState(status);
    } catch (err) {
      console.error('Failed to fetch tiebreaker status:', err);
    }

    this._updateUI();
  }

  /**
   * Set champions for the series
   */
  setChampions(blueChampions, redChampions) {
    this.blueChampions = blueChampions;
    this.redChampions = redChampions;
    this._updateUI();
  }

  /**
   * Start the next match
   */
  async startMatch(matchNumber) {
    if (!this.isTeacher) {
      console.warn('Only teachers can start matches');
      return;
    }

    // Validate match can be started
    if (matchNumber <= this.matches.length) {
      console.warn('Match already played');
      return;
    }

    if (this.blueMatchWins >= this.matchesToWin || this.redMatchWins >= this.matchesToWin) {
      console.warn('Series already decided');
      return;
    }

    // Get players for this match
    const matchIndex = matchNumber - 1;
    const bluePlayer = this.blueChampions[matchIndex]?.username;
    const redPlayer = this.redChampions[matchIndex]?.username;

    if (!bluePlayer || !redPlayer) {
      console.warn('Missing player for match');
      return;
    }

    // Notify server to start match
    try {
      await this._startMatchOnServer(matchNumber);
    } catch (err) {
      console.error('Failed to start match:', err);
      return;
    }

    this.currentMatchNumber = matchNumber;
    await this._launchMinigame(bluePlayer, redPlayer);
  }

  /**
   * Handle match result from minigame
   */
  async _handleMatchResult(winner, blueScore, redScore) {
    // Record result locally
    this.matches.push({
      matchNumber: this.currentMatchNumber,
      winner,
      blueScore,
      redScore
    });

    if (winner === 'blue') {
      this.blueMatchWins++;
    } else {
      this.redMatchWins++;
    }

    // Report to server
    try {
      await this._recordMatchResult(this.currentMatchNumber, winner, blueScore, redScore);
    } catch (err) {
      console.error('Failed to record match result:', err);
    }

    // Cleanup minigame
    if (this.activeMinigame?.destroy) {
      this.activeMinigame.destroy();
    }
    this.activeMinigame = null;
    this.currentMatch = null;

    // Check if series is complete
    const seriesWinner = this._checkSeriesWinner();

    if (this.onMatchComplete) {
      this.onMatchComplete({
        matchNumber: this.currentMatchNumber,
        winner,
        blueScore,
        redScore,
        seriesWinner
      });
    }

    if (seriesWinner) {
      if (this.onSeriesComplete) {
        this.onSeriesComplete(seriesWinner, this.blueMatchWins, this.redMatchWins);
      }
    }

    this._updateUI();
  }

  /**
   * Check if series has a winner
   */
  _checkSeriesWinner() {
    if (this.blueMatchWins >= this.matchesToWin) {
      return 'blue';
    }
    if (this.redMatchWins >= this.matchesToWin) {
      return 'red';
    }
    return null;
  }

  /**
   * Launch the appropriate minigame
   */
  async _launchMinigame(bluePlayer, redPlayer) {
    // Ensure match container exists
    if (!this.matchContainer) {
      this.matchContainer = document.createElement('div');
      this.matchContainer.className = 'tiebreaker-match-container';
      this.container.appendChild(this.matchContainer);
    }
    this.matchContainer.innerHTML = '';

    const matchInfo = {
      matchNumber: this.currentMatchNumber,
      bluePlayer,
      redPlayer
    };

    // Determine if current user is a player
    const isBluePlayer = this.username === bluePlayer;
    const isRedPlayer = this.username === redPlayer;
    const isPlayer = isBluePlayer || isRedPlayer;

    if (this.onMatchStart) {
      this.onMatchStart(matchInfo);
    }

    switch (this.tiebreakerType) {
      case 'pong':
        this.activeMinigame = new PongTiebreaker(
          this.matchContainer,
          this.wsClient,
          matchInfo,
          (winner, blueScore, redScore) => this._handleMatchResult(winner, blueScore, redScore)
        );
        if (isBluePlayer) {
          this.activeMinigame.setHost(true);
        }
        if (isPlayer) {
          this.activeMinigame.start();
        }
        break;

      case 'quick_calc':
        await this._launchQuickCalc(matchInfo, isBluePlayer, isRedPlayer);
        break;

      case 'reflex_duel':
        await this._launchReflexDuel(matchInfo, isBluePlayer, isRedPlayer);
        break;

      default:
        console.error('Unknown tiebreaker type:', this.tiebreakerType);
    }
  }

  /**
   * Launch Quick Calc minigame
   */
  async _launchQuickCalc(matchInfo, isBluePlayer, isRedPlayer) {
    // Lazy load QuickCalc
    if (!this.minigameClasses.quick_calc) {
      const module = await import('./quick-calc.js');
      this.minigameClasses.quick_calc = module.QuickCalc;
    }

    this.activeMinigame = new this.minigameClasses.quick_calc(
      this.matchContainer,
      this.wsClient,
      matchInfo,
      (winner, blueScore, redScore) => this._handleMatchResult(winner, blueScore, redScore)
    );

    if (isBluePlayer) {
      this.activeMinigame.setHost(true);
    }
    if (isBluePlayer || isRedPlayer) {
      this.activeMinigame.start();
    }
  }

  /**
   * Launch Reflex Duel minigame
   */
  async _launchReflexDuel(matchInfo, isBluePlayer, isRedPlayer) {
    // Lazy load ReflexDuel
    if (!this.minigameClasses.reflex_duel) {
      const module = await import('./reflex-duel.js');
      this.minigameClasses.reflex_duel = module.ReflexDuel;
    }

    this.activeMinigame = new this.minigameClasses.reflex_duel(
      this.matchContainer,
      this.wsClient,
      matchInfo,
      (winner, blueScore, redScore) => this._handleMatchResult(winner, blueScore, redScore)
    );

    if (isBluePlayer) {
      this.activeMinigame.setHost(true);
    }
    if (isBluePlayer || isRedPlayer) {
      this.activeMinigame.start();
    }
  }

  /**
   * Mark champion as ready
   */
  async confirmReady(matchNumber) {
    const response = await fetch(`${this.serverUrl}/api/tiebreaker/${this.cartridgeId}/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        game_mode: this.gameMode,
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
   * Fetch tiebreaker status from server
   */
  async _fetchStatus() {
    const url = new URL(`${this.serverUrl}/api/tiebreaker/${this.cartridgeId}/status`);
    url.searchParams.set('class_period', this.classPeriod);
    url.searchParams.set('game_mode', this.gameMode);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch tiebreaker status');
    }

    return response.json();
  }

  /**
   * Start match on server
   */
  async _startMatchOnServer(matchNumber) {
    const response = await fetch(`${this.serverUrl}/api/tiebreaker/${this.cartridgeId}/start-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        game_mode: this.gameMode,
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
   * Record match result on server
   */
  async _recordMatchResult(matchNumber, winner, blueScore, redScore) {
    const response = await fetch(`${this.serverUrl}/api/tiebreaker/${this.cartridgeId}/match-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_period: this.classPeriod,
        game_mode: this.gameMode,
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

  /**
   * Update local state from server response
   */
  _updateFromServerState(status) {
    if (status.blueChampions) {
      this.blueChampions = status.blueChampions;
    }
    if (status.redChampions) {
      this.redChampions = status.redChampions;
    }
    if (status.matches) {
      this.matches = status.matches;
      this.blueMatchWins = status.matches.filter(m => m.winner === 'blue').length;
      this.redMatchWins = status.matches.filter(m => m.winner === 'red').length;
    }
  }

  /**
   * Handle WebSocket message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'tiebreaker_champions_selected':
        this.blueChampions = message.blueChampions || [];
        this.redChampions = message.redChampions || [];
        this._updateUI();
        break;

      case 'tiebreaker_ready':
        // Update ready state in UI
        this._updateReadyState(message.username, message.team, message.matchNumber);
        break;

      case 'tiebreaker_match_start':
        if (message.matchNumber && !this.activeMinigame) {
          this.currentMatchNumber = message.matchNumber;
          this._launchMinigame(message.bluePlayer, message.redPlayer);
        }
        break;

      case 'tiebreaker_match_end':
        // Update from server's authoritative result
        if (message.matchNumber === this.currentMatchNumber) {
          // Let _handleMatchResult deal with it if we're running the game
          // Otherwise just update state
          if (!this.activeMinigame) {
            this.matches.push({
              matchNumber: message.matchNumber,
              winner: message.winner,
              blueScore: message.blueScore,
              redScore: message.redScore
            });
            if (message.winner === 'blue') this.blueMatchWins++;
            else this.redMatchWins++;
            this._updateUI();
          }
        }
        break;

      case 'tiebreaker_series_complete':
        this._updateUI();
        if (this.onSeriesComplete) {
          this.onSeriesComplete(message.winner, message.blueWins, message.redWins);
        }
        break;
    }

    // Forward minigame-specific messages to active minigame
    if (this.activeMinigame) {
      // Pong messages
      if (message.type?.startsWith('pong_')) {
        if (this.activeMinigame._receivePaddleUpdate && message.type === 'pong_paddle_update') {
          this.activeMinigame._receivePaddleUpdate(message);
        } else if (this.activeMinigame._receiveBallSync && message.type === 'pong_ball_sync') {
          this.activeMinigame._receiveBallSync(message);
        } else if (this.activeMinigame._receivePointScored && message.type === 'pong_point_scored') {
          this.activeMinigame._receivePointScored(message);
        }
      }

      // Quick Calc messages
      if (message.type?.startsWith('quick_calc_') && this.activeMinigame.handleMessage) {
        this.activeMinigame.handleMessage(message);
      }

      // Reflex Duel messages
      if (message.type?.startsWith('reflex_') && this.activeMinigame.handleMessage) {
        this.activeMinigame.handleMessage(message);
      }
    }
  }

  /**
   * Update ready state for a player
   */
  _updateReadyState(username, team, matchNumber) {
    const matchIndex = matchNumber - 1;
    const champions = team === 'blue' ? this.blueChampions : this.redChampions;
    const champion = champions[matchIndex];
    if (champion && champion.username === username) {
      champion.ready = true;
      this._updateUI();
    }
  }

  /**
   * Render initial UI
   */
  _render() {
    this.container.innerHTML = `
      <div class="tiebreaker-panel">
        <div class="tiebreaker-header">
          <h3>Tiebreaker</h3>
          <span class="tiebreaker-type" id="tiebreaker-type-label"></span>
        </div>

        <div class="series-score">
          <div class="team-score blue">
            <span class="team-name">Blue</span>
            <span class="wins" id="blue-series-wins">0</span>
          </div>
          <div class="vs">vs</div>
          <div class="team-score red">
            <span class="wins" id="red-series-wins">0</span>
            <span class="team-name">Red</span>
          </div>
        </div>

        <div class="champions-grid">
          <div class="champions blue">
            <h4>Blue Champions</h4>
            <ul id="blue-champions-list"></ul>
          </div>
          <div class="champions red">
            <h4>Red Champions</h4>
            <ul id="red-champions-list"></ul>
          </div>
        </div>

        <div class="match-history" id="match-history"></div>

        <div class="teacher-controls" id="tiebreaker-teacher-controls" style="display: none;">
          <button id="start-next-match" class="btn-primary">Start Match</button>
        </div>
      </div>
    `;

    this._addStyles();
    this._attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    this.container.querySelector('#start-next-match')?.addEventListener('click', () => {
      const nextMatch = this.matches.length + 1;
      this.startMatch(nextMatch);
    });
  }

  /**
   * Add styles
   */
  _addStyles() {
    if (document.getElementById('tiebreaker-manager-styles')) return;

    const style = document.createElement('style');
    style.id = 'tiebreaker-manager-styles';
    style.textContent = `
      .tiebreaker-panel {
        padding: 15px;
        background: #1f2937;
        border-radius: 8px;
        color: #f9fafb;
      }

      .tiebreaker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .tiebreaker-header h3 {
        margin: 0;
        font-size: 18px;
      }

      .tiebreaker-type {
        font-size: 12px;
        padding: 2px 8px;
        background: #374151;
        border-radius: 4px;
        color: #9ca3af;
      }

      .series-score {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
        padding: 15px;
        background: #111827;
        border-radius: 8px;
      }

      .team-score {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      .team-score.blue .wins { color: #3b82f6; }
      .team-score.red .wins { color: #ef4444; }

      .team-score .wins {
        font-size: 36px;
        font-weight: bold;
      }

      .team-score .team-name {
        font-size: 12px;
        text-transform: uppercase;
        color: #9ca3af;
      }

      .vs {
        font-size: 14px;
        color: #6b7280;
      }

      .champions-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
      }

      .champions {
        padding: 10px;
        background: #374151;
        border-radius: 6px;
      }

      .champions.blue { border-left: 3px solid #3b82f6; }
      .champions.red { border-left: 3px solid #ef4444; }

      .champions h4 {
        margin: 0 0 10px 0;
        font-size: 13px;
        color: #9ca3af;
      }

      .champions ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .champions li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        font-size: 13px;
      }

      .champions li .rank {
        color: #6b7280;
        margin-right: 8px;
      }

      .champions li .velocity {
        color: #9ca3af;
        font-size: 11px;
      }

      .champions li.ready::after {
        content: '\\2713';
        color: #10b981;
        margin-left: 8px;
      }

      .match-history {
        margin-bottom: 15px;
      }

      .match-result {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #374151;
        border-radius: 4px;
        margin-bottom: 5px;
        font-size: 13px;
      }

      .match-result.blue-win { border-left: 3px solid #3b82f6; }
      .match-result.red-win { border-left: 3px solid #ef4444; }

      .teacher-controls {
        text-align: center;
        padding-top: 10px;
        border-top: 1px solid #374151;
      }

      .btn-primary {
        padding: 10px 30px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-primary:disabled {
        background: #4b5563;
        cursor: not-allowed;
      }

      .tiebreaker-match-container {
        margin: 15px 0;
        padding: 15px;
        background: #111827;
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update UI from current state
   */
  _updateUI() {
    // Update type label
    const typeLabel = this.container.querySelector('#tiebreaker-type-label');
    if (typeLabel) {
      typeLabel.textContent = GAME_MODE_CONFIG.labels.tiebreakers[this.tiebreakerType] || this.tiebreakerType;
    }

    // Update series score
    const blueWins = this.container.querySelector('#blue-series-wins');
    const redWins = this.container.querySelector('#red-series-wins');
    if (blueWins) blueWins.textContent = this.blueMatchWins;
    if (redWins) redWins.textContent = this.redMatchWins;

    // Update champions lists
    this._updateChampionsList('blue', this.blueChampions);
    this._updateChampionsList('red', this.redChampions);

    // Update match history
    this._updateMatchHistory();

    // Show/hide teacher controls
    const teacherControls = this.container.querySelector('#tiebreaker-teacher-controls');
    if (teacherControls) {
      const seriesComplete = this._checkSeriesWinner() !== null;
      teacherControls.style.display = (this.isTeacher && !seriesComplete) ? 'block' : 'none';

      const startBtn = teacherControls.querySelector('#start-next-match');
      if (startBtn) {
        startBtn.disabled = this.activeMinigame !== null;
        startBtn.textContent = `Start Match ${this.matches.length + 1}`;
      }
    }
  }

  /**
   * Update champions list for a team
   */
  _updateChampionsList(team, champions) {
    const list = this.container.querySelector(`#${team}-champions-list`);
    if (!list) return;

    list.innerHTML = champions.map((c, i) => `
      <li class="${c.ready ? 'ready' : ''}">
        <span>
          <span class="rank">#${i + 1}</span>
          ${c.username}
        </span>
        <span class="velocity">${c.velocity?.toFixed(2) || '0.00'} pts/min</span>
      </li>
    `).join('');
  }

  /**
   * Update match history display
   */
  _updateMatchHistory() {
    const history = this.container.querySelector('#match-history');
    if (!history) return;

    history.innerHTML = this.matches.map(m => `
      <div class="match-result ${m.winner}-win">
        <span>Match ${m.matchNumber}</span>
        <span>${m.blueScore} - ${m.redScore}</span>
        <span>${m.winner.toUpperCase()} wins</span>
      </div>
    `).join('');
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.activeMinigame?.destroy) {
      this.activeMinigame.destroy();
    }
    this.activeMinigame = null;
  }
}
