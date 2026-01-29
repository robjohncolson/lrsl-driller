/**
 * Ghost Orbits Panel
 *
 * Full-screen overlay UI for the Ghost Orbits territory game.
 * Provides the HUD, arena container, and various game state views.
 *
 * @see ghost-orbits-spec.md sections 9.1-9.3
 */

export class GhostOrbitsPanel {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container element to mount the panel into
   * @param {Function} options.onClose - Callback when close button is clicked
   * @param {Function} options.onReturnToPractice - Callback when returning to practice (from eliminated view)
   * @param {Function} options.onRematch - Callback when player chooses to rematch
   */
  constructor(options) {
    this.container = options.container;
    this.onClose = options.onClose || (() => {});
    this.onReturnToPractice = options.onReturnToPractice || (() => {});
    this.onRematch = options.onRematch || (() => {});

    this.isVisible = false;
    this.currentRound = 1;
    this.timerSeconds = 0;
    this.playerTerritories = [];
    this.isEliminated = false;
    this.eliminatedStats = null;
    this.resultsData = null;

    // Bind escape key handler
    this._handleKeyDown = this._handleKeyDown.bind(this);

    this._render();
    this._addStyles();
    this._attachEventListeners();
  }

  /**
   * Initialize the panel (for API compatibility)
   * @returns {Promise<void>}
   */
  async init() {
    // Initialization is done in constructor
    return Promise.resolve();
  }

  /**
   * Show the panel
   */
  show() {
    console.log('[GhostOrbitsPanel] show() called, isVisible:', this.isVisible, 'overlayElement:', this.overlayElement);
    if (this.isVisible) return;

    this.isVisible = true;
    if (this.overlayElement) {
      this.overlayElement.classList.add('visible');
      console.log('[GhostOrbitsPanel] Added visible class, classList:', this.overlayElement.classList.toString());
    } else {
      console.error('[GhostOrbitsPanel] No overlayElement!');
    }

    // Add keyboard listener
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Hide the panel
   */
  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    if (this.overlayElement) {
      this.overlayElement.classList.remove('visible');
    }

    // Remove keyboard listener
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Update the timer display
   * @param {number} seconds - Remaining seconds
   */
  updateTimer(seconds) {
    this.timerSeconds = seconds;
    const timerEl = this.overlayElement?.querySelector('#orbits-timer');
    if (timerEl) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timerEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

      // Add warning classes for low time
      timerEl.classList.remove('warning', 'danger');
      if (seconds <= 30) {
        timerEl.classList.add('danger');
      } else if (seconds <= 60) {
        timerEl.classList.add('warning');
      }
    }
  }

  /**
   * Update the Shadow generation display
   * @param {number} generation - Current Shadow generation number
   */
  updateGeneration(generation) {
    const genEl = this.overlayElement?.querySelector('#orbits-generation');
    if (genEl) {
      genEl.textContent = `Shadow Gen ${generation}`;
    }
  }

  /**
   * Update the round display
   * @param {number} round - Current round number
   */
  updateRound(round) {
    this.currentRound = round;
    const roundEl = this.overlayElement?.querySelector('#orbits-round');
    if (roundEl) {
      roundEl.textContent = `Round ${round}`;
    }
  }

  /**
   * Update the lives display
   * @param {number} lives - Remaining lives (0-3)
   */
  updateLives(lives) {
    const livesEl = this.overlayElement?.querySelector('#orbits-lives');
    if (livesEl) {
      // Display hearts (filled or empty)
      const hearts = [];
      for (let i = 0; i < 3; i++) {
        if (i < lives) {
          hearts.push('♥'); // Filled heart
        } else {
          hearts.push('♡'); // Empty heart
        }
      }
      livesEl.textContent = hearts.join(' ');

      // Add warning class if low on lives
      livesEl.classList.remove('warning', 'danger');
      if (lives === 1) {
        livesEl.classList.add('danger');
      } else if (lives === 2) {
        livesEl.classList.add('warning');
      }
    }
  }

  /**
   * Update the dot count display
   * @param {number} playerDots - Number of dots collected by player
   * @param {number} shadowDots - Number of dots collected by shadow
   * @param {number} targetDots - Target number of dots to win
   */
  updateDotCounts(playerDots, shadowDots, targetDots) {
    const dotCountEl = this.overlayElement?.querySelector('#orbits-dot-count');
    if (dotCountEl) {
      dotCountEl.textContent = `Player: ${playerDots}/${targetDots} | Shadow: ${shadowDots}/${targetDots}`;
    }
  }

  /**
   * Update territory bar with player percentages
   * @param {Array<{username: string, percent: number, color: string, isPlayer: boolean}>} territories
   */
  updateTerritory(territories) {
    this.playerTerritories = territories;
    const territoryBar = this.overlayElement?.querySelector('#orbits-territory-bar');
    if (!territoryBar) return;

    // Build the territory segments
    const segmentsHtml = territories
      .filter(t => t.percent > 0)
      .sort((a, b) => b.percent - a.percent)
      .map(t => {
        const displayName = t.isPlayer ? 'You' : `@${t.username}`;
        return `
          <span class="territory-segment" style="background-color: ${t.color}; flex-basis: ${t.percent}%;">
            <span class="territory-label">${displayName} ${Math.round(t.percent)}%</span>
          </span>
        `;
      })
      .join('');

    territoryBar.innerHTML = segmentsHtml || '<span class="territory-empty">No territory claimed</span>';

    // Also update the text display below the bar
    const territoryText = this.overlayElement?.querySelector('#orbits-territory-text');
    if (territoryText) {
      const textParts = territories
        .filter(t => t.percent > 0)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 4)
        .map(t => {
          const displayName = t.isPlayer ? 'You' : `@${t.username}`;
          return `<span style="color: ${t.color}">${displayName} ${Math.round(t.percent)}%</span>`;
        });

      // Add "others" if more than 4 players
      const shown = territories.filter(t => t.percent > 0).slice(0, 4);
      const others = territories.filter(t => t.percent > 0).slice(4);
      if (others.length > 0) {
        const othersPercent = others.reduce((sum, t) => sum + t.percent, 0);
        textParts.push(`<span class="territory-others">others ${Math.round(othersPercent)}%</span>`);
      }

      territoryText.innerHTML = `Territory: ${textParts.join(' | ')}`;
    }
  }

  /**
   * Show countdown before round starts
   * @param {number} number - Countdown number (3, 2, 1, or 0 for "GO!")
   */
  showCountdown(number) {
    let countdownOverlay = this.overlayElement?.querySelector('.orbits-countdown-overlay');

    if (!countdownOverlay && this.overlayElement) {
      countdownOverlay = document.createElement('div');
      countdownOverlay.className = 'orbits-countdown-overlay';
      const arenaContainer = this.overlayElement.querySelector('.orbits-arena-container');
      if (arenaContainer) {
        arenaContainer.appendChild(countdownOverlay);
      }
    }

    if (!countdownOverlay) return;

    if (number === 0) {
      countdownOverlay.innerHTML = '<span class="countdown-text countdown-go">GO!</span>';
      countdownOverlay.classList.add('visible');

      // Remove after animation
      setTimeout(() => {
        countdownOverlay.classList.remove('visible');
        setTimeout(() => countdownOverlay.remove(), 300);
      }, 800);
    } else if (number > 0) {
      countdownOverlay.innerHTML = `<span class="countdown-text">${number}</span>`;
      countdownOverlay.classList.add('visible');
    } else {
      // Hide countdown
      countdownOverlay.classList.remove('visible');
    }
  }

  /**
   * Show eliminated player view
   * @param {Object} stats
   * @param {number} stats.finalTerritory - Final territory percentage
   * @param {number} stats.placement - Final placement (1st, 2nd, etc.)
   * @param {number} stats.playersRemaining - How many players still alive
   * @param {number} stats.timeRemaining - Seconds remaining in round
   * @param {string} stats.eliminatedBy - Username of player who absorbed you (optional)
   */
  showEliminated(stats) {
    this.isEliminated = true;
    this.eliminatedStats = stats;
    this._renderEliminatedView();
  }

  /**
   * Show round results (for multiplayer or renamed to match the requirement)
   * @param {Object} results
   * @param {Array<{username: string, territory: number, eliminations: number, placement: number}>} results.rankings
   * @param {string} results.winner - Username of winner
   * @param {boolean} results.isNextRoundStarting - Whether another round is starting
   * @param {number} results.intermissionSeconds - Seconds until next round
   */
  showRoundResults(results) {
    this.resultsData = results;
    this._renderResultsView();
  }

  /**
   * Show victory/defeat screen for solo Shadow Self mode
   * @param {Object} data - Match results data
   * @param {string} data.winner - 'player' or 'shadow'
   * @param {string} data.condition - Win condition text (e.g., 'Territory Domination')
   * @param {number} data.playerTerritory - Player's final territory %
   * @param {number} data.timeElapsed - Match duration in seconds
   * @param {string} [data.statUpgrade] - Stat that was upgraded (for victory only, e.g., 'Mass +0.05')
   */
  showResults(data) {
    if (data.winner === 'player') {
      this._renderVictoryScreen(data);
    } else {
      this._renderDefeatScreen(data);
    }
  }

  /**
   * Show rematch prompt (called when player has stars to rejoin)
   * @param {Function} onRematch - Callback when player chooses to rematch
   * @param {Function} onExit - Callback when player chooses to exit
   */
  showRematchPrompt(onRematch, onExit) {
    this._renderRematchPrompt(onRematch, onExit);
  }

  /**
   * Reset to active game view (clear eliminated/results)
   */
  resetToActiveView() {
    this.isEliminated = false;
    this.eliminatedStats = null;
    this.resultsData = null;

    // Remove the old overlay and re-render
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    this._render();
    this._attachEventListeners();
    this.overlayElement?.classList.add('visible');
  }

  /**
   * Get the arena container element where the game canvas should be mounted
   * @returns {HTMLElement|null}
   */
  getArenaContainer() {
    return this.overlayElement?.querySelector('.orbits-arena-canvas-mount') || null;
  }

  /**
   * Show the help screen overlay (v3 - explains Dot Territory rules)
   * @param {Function} [onDismiss] - Optional callback when help is dismissed
   */
  showHelpScreen(onDismiss) {
    if (!this.overlayElement) return;

    // Create help overlay
    const helpOverlay = document.createElement('div');
    helpOverlay.className = 'orbits-help-overlay';
    helpOverlay.innerHTML = `
      <div class="help-content">
        <h2 class="help-title">DOT TERRITORY</h2>

        <div class="help-section">
          <div class="help-icon">&#9899;</div>
          <div class="help-text">
            <strong>Claim Dots:</strong> Touch neutral (gray) dots to claim them.
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">&#128308;</div>
          <div class="help-text">
            <strong>Danger:</strong> Touch enemy dots WITHOUT spacebar = lose a life!
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">&#9211;</div>
          <div class="help-text">
            <strong>Flip:</strong> Press SPACE when touching enemy dot to flip it to your color.
          </div>
        </div>

        <div class="help-section">
          <div class="help-icon">&#128190;</div>
          <div class="help-text">
            <strong>Safe:</strong> Land on records (spinning plates) - you're safe there!
          </div>
        </div>

        <div class="help-section help-goal">
          <div class="help-icon">&#127942;</div>
          <div class="help-text">
            <strong>Win:</strong> Claim 90% of dots OR eliminate opponent (3 lives each).
          </div>
        </div>

        <div class="help-controls">
          <p><strong>SPACEBAR</strong> = Land on record / Launch off / Flip enemy dots</p>
        </div>

        <button class="help-dismiss-btn">GOT IT! [SPACE]</button>
      </div>
    `;

    // Add styles for help overlay
    const style = document.createElement('style');
    style.textContent = `
      .orbits-help-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
      }
      .help-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #4488ff;
        border-radius: 12px;
        padding: 24px 32px;
        max-width: 500px;
        text-align: left;
        box-shadow: 0 0 40px rgba(68, 136, 255, 0.3);
      }
      .help-title {
        text-align: center;
        color: #4488ff;
        font-size: 28px;
        margin: 0 0 20px 0;
        text-shadow: 0 0 10px rgba(68, 136, 255, 0.5);
      }
      .help-section {
        display: flex;
        align-items: flex-start;
        margin: 12px 0;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      .help-section.help-goal {
        background: rgba(68, 136, 255, 0.15);
        border: 1px solid rgba(68, 136, 255, 0.3);
      }
      .help-icon {
        font-size: 24px;
        margin-right: 12px;
        min-width: 32px;
        text-align: center;
      }
      .help-text {
        color: #ddd;
        line-height: 1.4;
      }
      .help-text strong {
        color: #fff;
      }
      .help-controls {
        text-align: center;
        margin: 20px 0 16px 0;
        padding: 12px;
        background: rgba(68, 136, 255, 0.1);
        border-radius: 8px;
        color: #aaddff;
      }
      .help-controls strong {
        color: #4488ff;
      }
      .help-dismiss-btn {
        display: block;
        width: 100%;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        color: #fff;
        background: linear-gradient(135deg, #4488ff 0%, #2266cc 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .help-dismiss-btn:hover {
        transform: scale(1.02);
        box-shadow: 0 0 20px rgba(68, 136, 255, 0.5);
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    helpOverlay.appendChild(style);

    // Dismiss handler
    const dismiss = () => {
      helpOverlay.style.animation = 'fadeIn 0.2s ease-out reverse';
      setTimeout(() => {
        helpOverlay.remove();
        if (onDismiss) onDismiss();
      }, 200);
    };

    // Click button to dismiss
    helpOverlay.querySelector('.help-dismiss-btn').addEventListener('click', dismiss);

    // Space key to dismiss
    const handleKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        document.removeEventListener('keydown', handleKey);
        dismiss();
      }
    };
    document.addEventListener('keydown', handleKey);

    // Add to arena container
    const arenaContainer = this.overlayElement.querySelector('.orbits-arena-container');
    if (arenaContainer) {
      arenaContainer.appendChild(helpOverlay);
    }
  }

  /**
   * Cleanup resources
   */
  dispose() {
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    this.overlayElement = null;
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event
   */
  _handleKeyDown(event) {
    if (event.key === 'Escape' && this.isVisible) {
      // If eliminated, return to practice; otherwise close
      if (this.isEliminated) {
        this.onReturnToPractice();
      } else {
        this.onClose();
      }
    }
  }

  /**
   * Render the main panel HTML
   */
  _render() {
    console.log('[GhostOrbitsPanel] _render() called, container:', this.container);
    // Create overlay element (don't replace container's content)
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'ghost-orbits-overlay';
    console.log('[GhostOrbitsPanel] Created overlayElement:', this.overlayElement);
    this.overlayElement.innerHTML = `
      <!-- Header Bar -->
      <div class="orbits-header">
        <div class="orbits-header-left">
          <button class="orbits-close-btn" aria-label="Close Ghost Orbits">&times;</button>
          <h2 class="orbits-title">Ghost Orbits</h2>
          <span class="orbits-generation" id="orbits-generation">Shadow Gen 1</span>
        </div>
        <div class="orbits-header-center">
          <span class="orbits-timer" id="orbits-timer">--:--</span>
          <span class="orbits-dot-count" id="orbits-dot-count">Player: 0/25 | Shadow: 0/25</span>
          <span class="orbits-lives" id="orbits-lives">♥ ♥ ♥</span>
        </div>
        <div class="orbits-header-right">
          <span class="orbits-round" id="orbits-round">Round ${this.currentRound}</span>
        </div>
      </div>

      <!-- Main Arena Area -->
      <div class="orbits-arena-container">
        <div class="orbits-arena-canvas-mount">
          <!-- Game canvas will be mounted here -->
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="orbits-footer">
        <div class="orbits-territory-bar" id="orbits-territory-bar">
          <span class="territory-empty">Waiting for game...</span>
        </div>
        <div class="orbits-footer-info">
          <div class="orbits-footer-left">
            <span class="orbits-territory-text" id="orbits-territory-text">Territory: --</span>
          </div>
          <div class="orbits-footer-controls">
            <span class="orbits-control-hint">[SPACE: land/launch from records]</span>
          </div>
          <div class="orbits-footer-right">
            <span class="orbits-exit-hint">[ESC to exit to practice]</span>
          </div>
        </div>
      </div>
    `;

    // Append to container (not replace)
    this.container.appendChild(this.overlayElement);
  }

  /**
   * Render eliminated player view
   */
  _renderEliminatedView() {
    if (!this.overlayElement) return;

    const stats = this.eliminatedStats || {};
    const placement = stats.placement || '?';
    const territory = stats.finalTerritory || 0;
    const timeRemaining = stats.timeRemaining || 0;
    const playersRemaining = stats.playersRemaining || 0;

    const minutes = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

    // Get ordinal suffix
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    this.overlayElement.innerHTML = `
      <div class="orbits-eliminated-view">
        <div class="eliminated-content">
          <div class="eliminated-icon">
            <span class="ghost-absorbed">&#128123;</span>
          </div>
          <h1 class="eliminated-title">YOU WERE ABSORBED</h1>

          <div class="eliminated-stats">
            <div class="eliminated-stat">
              <span class="stat-value">${Math.round(territory)}%</span>
              <span class="stat-label">Final Territory</span>
            </div>
            <div class="eliminated-stat">
              <span class="stat-value">${getOrdinal(placement)}</span>
              <span class="stat-label">Place</span>
            </div>
          </div>

          <div class="eliminated-rejoin-box">
            <p class="rejoin-prompt">Earn 1 Gold Star to rejoin!</p>
            <button class="orbits-return-btn" id="orbits-return-btn">Return to Practice</button>
          </div>

          <div class="eliminated-round-info">
            <p>Round continues: <strong>${timeDisplay}</strong> remaining</p>
            <p>Players alive: <strong>${playersRemaining}</strong></p>
          </div>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach return button listener
    const returnBtn = this.overlayElement.querySelector('#orbits-return-btn');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => this.onReturnToPractice());
    }
  }

  /**
   * Render round results view (for multiplayer)
   */
  _renderResultsView() {
    if (!this.overlayElement) return;

    const results = this.resultsData || {};
    const rankings = results.rankings || [];
    const winner = results.winner;
    const isNextRound = results.isNextRoundStarting;
    const intermission = results.intermissionSeconds || 10;

    const rankingsHtml = rankings.slice(0, 8).map((r, i) => {
      const isWinner = r.username === winner;
      const placeClass = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : '';

      return `
        <div class="results-rank-row ${placeClass} ${isWinner ? 'winner' : ''}">
          <span class="rank-position">${i + 1}</span>
          <span class="rank-username">${r.isPlayer ? 'You' : `@${r.username}`}</span>
          <span class="rank-territory">${Math.round(r.territory)}%</span>
          <span class="rank-eliminations">${r.eliminations} KO${r.eliminations !== 1 ? 's' : ''}</span>
        </div>
      `;
    }).join('');

    this.overlayElement.innerHTML = `
      <div class="orbits-results-view">
        <div class="results-content">
          <h1 class="results-title">Round Complete</h1>

          ${winner ? `
            <div class="results-winner">
              <span class="winner-crown">&#128081;</span>
              <span class="winner-name">${winner}</span>
              <span class="winner-label">WINNER</span>
            </div>
          ` : ''}

          <div class="results-rankings">
            <div class="results-header-row">
              <span>#</span>
              <span>Player</span>
              <span>Territory</span>
              <span>Eliminations</span>
            </div>
            ${rankingsHtml}
          </div>

          <div class="results-next">
            ${isNextRound ? `
              <p>Next round starting in <strong id="results-countdown">${intermission}</strong> seconds...</p>
            ` : `
              <p>Game over! Return to practice.</p>
              <button class="orbits-return-btn" id="orbits-return-btn">Return to Practice</button>
            `}
          </div>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach return button listener if present
    const returnBtn = this.overlayElement.querySelector('#orbits-return-btn');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => this.onReturnToPractice());
    }
  }

  /**
   * Render victory screen for Shadow Self mode
   * @param {Object} data - Victory data
   * @private
   */
  _renderVictoryScreen(data) {
    if (!this.overlayElement) return;

    const condition = data.condition || 'Victory';
    const territory = Math.round(data.playerTerritory) || 0;
    const timeElapsed = data.timeElapsed || 0;
    const statUpgrade = data.statUpgrade || 'Mass +0.05';

    const minutes = Math.floor(timeElapsed / 60);
    const secs = timeElapsed % 60;
    const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

    this.overlayElement.innerHTML = `
      <div class="orbits-victory-view">
        <div class="victory-content">
          <div class="victory-icon-container">
            <div class="victory-icon">&#127942;</div>
            <div class="victory-sparkles">
              <span class="sparkle">&#10024;</span>
              <span class="sparkle">&#10024;</span>
              <span class="sparkle">&#10024;</span>
              <span class="sparkle">&#10024;</span>
            </div>
          </div>

          <h1 class="victory-title">VICTORY!</h1>
          <p class="victory-subtitle">${condition}</p>

          <div class="victory-stats">
            <div class="victory-stat">
              <span class="stat-value">${territory}%</span>
              <span class="stat-label">Territory</span>
            </div>
            <div class="victory-stat">
              <span class="stat-value">${timeDisplay}</span>
              <span class="stat-label">Time</span>
            </div>
          </div>

          <div class="victory-upgrade-box">
            <div class="upgrade-icon">&#11014;</div>
            <p class="upgrade-text">${statUpgrade}</p>
            <p class="upgrade-subtitle">Ghost evolved!</p>
          </div>

          <button class="orbits-continue-btn" id="orbits-continue-btn">Continue to Practice</button>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach continue button listener
    const continueBtn = this.overlayElement.querySelector('#orbits-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => this.onReturnToPractice());
    }
  }

  /**
   * Render defeat screen for Shadow Self mode
   * @param {Object} data - Defeat data
   * @param {boolean} [data.canRematch=false] - Whether rematch is currently available
   * @private
   */
  _renderDefeatScreen(data) {
    if (!this.overlayElement) return;

    const condition = data.condition || 'Defeat';
    const territory = Math.round(data.playerTerritory) || 0;
    const timeElapsed = data.timeElapsed || 0;
    const canRematch = data.canRematch !== false; // Default to true for backwards compatibility

    const minutes = Math.floor(timeElapsed / 60);
    const secs = timeElapsed % 60;
    const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

    // Build the rematch button HTML based on availability
    const rematchButtonHtml = canRematch
      ? `<button class="orbits-rematch-btn" id="orbits-rematch-btn">Rematch (1 Gold Star)</button>`
      : `<button class="orbits-rematch-btn orbits-rematch-btn-disabled" id="orbits-rematch-btn" disabled>Earn a Gold Star to Rematch</button>`;

    this.overlayElement.innerHTML = `
      <div class="orbits-defeat-view">
        <div class="defeat-content">
          <div class="defeat-icon">&#128123;</div>
          <h1 class="defeat-title">DEFEATED</h1>
          <p class="defeat-subtitle">${condition}</p>

          <div class="defeat-stats">
            <div class="defeat-stat">
              <span class="stat-value">${territory}%</span>
              <span class="stat-label">Territory</span>
            </div>
            <div class="defeat-stat">
              <span class="stat-value">${timeDisplay}</span>
              <span class="stat-label">Time</span>
            </div>
          </div>

          <div class="defeat-message-box">
            <p class="defeat-message">Shadow learned from this match</p>
            <p class="defeat-submessage">It will be stronger next time...</p>
          </div>

          <div class="defeat-actions">
            ${rematchButtonHtml}
            <button class="orbits-return-btn" id="orbits-return-btn">Return to Practice</button>
          </div>
        </div>
      </div>
    `;

    this.overlayElement.classList.add('visible');

    // Attach button listeners
    const rematchBtn = this.overlayElement.querySelector('#orbits-rematch-btn');
    const returnBtn = this.overlayElement.querySelector('#orbits-return-btn');

    if (rematchBtn && canRematch) {
      rematchBtn.addEventListener('click', () => {
        // Show rematch prompt or handle directly
        if (this.onRematch) {
          this.onRematch();
        }
      });
    }

    if (returnBtn) {
      returnBtn.addEventListener('click', () => this.onReturnToPractice());
    }
  }

  /**
   * Render rematch prompt modal
   * @param {Function} onRematch - Callback when player chooses to rematch
   * @param {Function} onExit - Callback when player chooses to exit
   * @private
   */
  _renderRematchPrompt(onRematch, onExit) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'orbits-rematch-modal';
    modal.innerHTML = `
      <div class="rematch-modal-content">
        <h2 class="rematch-title">Rematch?</h2>
        <p class="rematch-message">Challenge your Shadow Self again?</p>
        <p class="rematch-cost">Cost: 1 Gold Star</p>
        <div class="rematch-actions">
          <button class="rematch-yes-btn" id="rematch-yes-btn">Yes, Rematch!</button>
          <button class="rematch-no-btn" id="rematch-no-btn">No, Exit</button>
        </div>
      </div>
    `;

    this.overlayElement?.appendChild(modal);

    // Fade in
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });

    // Attach button listeners
    const yesBtn = modal.querySelector('#rematch-yes-btn');
    const noBtn = modal.querySelector('#rematch-no-btn');

    if (yesBtn) {
      yesBtn.addEventListener('click', () => {
        modal.remove();
        onRematch();
      });
    }

    if (noBtn) {
      noBtn.addEventListener('click', () => {
        modal.remove();
        onExit();
      });
    }
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Close button
    const closeBtn = this.overlayElement?.querySelector('.orbits-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.onClose());
    }
  }

  /**
   * Add styles for the panel
   */
  _addStyles() {
    if (document.getElementById('ghost-orbits-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'ghost-orbits-panel-styles';
    style.textContent = `
      /* ===========================================
         GHOST ORBITS PANEL - TRON AESTHETIC
         =========================================== */

      .ghost-orbits-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #0a0a12;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', system-ui, sans-serif;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .ghost-orbits-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      /* -------------------------------------------
         HEADER BAR
         ------------------------------------------- */

      .orbits-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: linear-gradient(180deg, #1a1f2e 0%, #0d1117 100%);
        border-bottom: 1px solid #112244;
        flex-shrink: 0;
      }

      .orbits-header-left,
      .orbits-header-center,
      .orbits-header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .orbits-header-left {
        flex: 1;
      }

      .orbits-header-center {
        flex: 0 0 auto;
      }

      .orbits-header-right {
        flex: 1;
        justify-content: flex-end;
      }

      .orbits-close-btn {
        background: transparent;
        border: 1px solid #88aacc44;
        border-radius: 4px;
        color: #88aacc;
        font-size: 24px;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        line-height: 1;
        padding: 0;
      }

      .orbits-close-btn:hover {
        background: rgba(136, 170, 204, 0.1);
        border-color: #88aacc;
        color: #ffffff;
      }

      .orbits-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: 0.5px;
      }

      .orbits-generation {
        font-size: 13px;
        font-weight: 500;
        color: #88aacc;
        padding: 4px 12px;
        background: rgba(136, 170, 204, 0.05);
        border: 1px solid #112244;
        border-radius: 4px;
        margin-left: 12px;
      }

      .orbits-round {
        font-size: 16px;
        font-weight: 600;
        color: #88aacc;
        padding: 6px 16px;
        background: rgba(136, 170, 204, 0.1);
        border: 1px solid #112244;
        border-radius: 4px;
      }

      .orbits-timer {
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        font-variant-numeric: tabular-nums;
      }

      .orbits-timer.warning {
        color: #f59e0b;
        animation: timer-pulse 1s infinite;
      }

      .orbits-timer.danger {
        color: #ef4444;
        animation: timer-pulse 0.5s infinite;
      }

      .orbits-dot-count {
        font-size: 16px;
        font-weight: 600;
        color: #88aacc;
        font-variant-numeric: tabular-nums;
        margin-left: 20px;
        padding: 6px 16px;
        background: rgba(136, 170, 204, 0.1);
        border: 1px solid #112244;
        border-radius: 4px;
      }

      .orbits-lives {
        font-size: 20px;
        color: #ff4444;
        margin-left: 20px;
        letter-spacing: 4px;
      }

      .orbits-lives.warning {
        color: #f59e0b;
        animation: lives-pulse 1s infinite;
      }

      .orbits-lives.danger {
        color: #ef4444;
        animation: lives-pulse 0.5s infinite;
      }

      @keyframes timer-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      @keyframes lives-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      /* -------------------------------------------
         ARENA CONTAINER
         ------------------------------------------- */

      .orbits-arena-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        position: relative;
        overflow: hidden;
        background:
          linear-gradient(rgba(17, 34, 68, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.3) 1px, transparent 1px);
        background-size: 40px 40px;
        background-position: center center;
      }

      .orbits-arena-canvas-mount {
        width: 100%;
        height: 100%;
        max-width: 1000px;
        max-height: 800px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .orbits-arena-canvas-mount canvas {
        max-width: 100%;
        max-height: calc(100vh - 120px);
        object-fit: contain;
        border: 2px solid #112244;
        border-radius: 8px;
        box-shadow:
          0 0 20px rgba(68, 136, 255, 0.1),
          inset 0 0 60px rgba(0, 0, 0, 0.5);
      }

      /* -------------------------------------------
         COUNTDOWN OVERLAY
         ------------------------------------------- */

      .orbits-countdown-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 10, 18, 0.8);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
        z-index: 10;
      }

      .orbits-countdown-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .countdown-text {
        font-size: 120px;
        font-weight: 700;
        color: #ffffff;
        text-shadow:
          0 0 20px rgba(68, 136, 255, 0.8),
          0 0 40px rgba(68, 136, 255, 0.4);
        animation: countdown-pop 0.5s ease-out;
      }

      .countdown-go {
        color: #00ff88;
        text-shadow:
          0 0 20px rgba(0, 255, 136, 0.8),
          0 0 40px rgba(0, 255, 136, 0.4);
      }

      @keyframes countdown-pop {
        0% {
          transform: scale(1.5);
          opacity: 0;
        }
        50% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* -------------------------------------------
         FOOTER BAR
         ------------------------------------------- */

      .orbits-footer {
        flex-shrink: 0;
        background: linear-gradient(180deg, #0d1117 0%, #1a1f2e 100%);
        border-top: 1px solid #112244;
        padding: 12px 20px;
      }

      .orbits-territory-bar {
        display: flex;
        height: 24px;
        background: #0a0a12;
        border: 1px solid #112244;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .territory-segment {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: flex-basis 0.5s ease;
        min-width: 0;
        overflow: hidden;
      }

      .territory-label {
        font-size: 11px;
        font-weight: 600;
        color: #ffffff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 6px;
      }

      .territory-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #88aacc;
        font-size: 12px;
      }

      .orbits-footer-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .orbits-footer-left,
      .orbits-footer-right {
        flex: 1;
      }

      .orbits-footer-controls {
        flex: 0 0 auto;
      }

      .orbits-footer-right {
        text-align: right;
      }

      .orbits-territory-text {
        font-size: 13px;
        color: #88aacc;
      }

      .territory-others {
        color: #6b7280;
      }

      .orbits-control-hint,
      .orbits-exit-hint {
        font-size: 12px;
        color: #4b5563;
      }

      /* -------------------------------------------
         ELIMINATED VIEW
         ------------------------------------------- */

      .orbits-eliminated-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .eliminated-content {
        text-align: center;
        max-width: 500px;
      }

      .eliminated-icon {
        margin-bottom: 20px;
      }

      .ghost-absorbed {
        font-size: 80px;
        filter: grayscale(1) opacity(0.5);
        animation: ghost-fade 2s infinite;
      }

      @keyframes ghost-fade {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.05); }
      }

      .eliminated-title {
        font-size: 42px;
        font-weight: 700;
        color: #ef4444;
        margin: 0 0 30px 0;
        text-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        letter-spacing: 2px;
      }

      .eliminated-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-bottom: 30px;
      }

      .eliminated-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .eliminated-stat .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: #ffffff;
      }

      .eliminated-stat .stat-label {
        font-size: 13px;
        color: #88aacc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .eliminated-rejoin-box {
        background: rgba(68, 136, 255, 0.1);
        border: 2px solid #4488ff;
        border-radius: 12px;
        padding: 24px 32px;
        margin-bottom: 30px;
      }

      .rejoin-prompt {
        font-size: 20px;
        font-weight: 600;
        color: #4488ff;
        margin: 0 0 16px 0;
      }

      .orbits-return-btn {
        background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
        border: none;
        border-radius: 8px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        padding: 14px 32px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(68, 136, 255, 0.3);
      }

      .orbits-return-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(68, 136, 255, 0.4);
      }

      .orbits-return-btn:active {
        transform: translateY(0);
      }

      .eliminated-round-info {
        color: #88aacc;
        font-size: 14px;
      }

      .eliminated-round-info p {
        margin: 8px 0;
      }

      .eliminated-round-info strong {
        color: #ffffff;
      }

      /* -------------------------------------------
         RESULTS VIEW
         ------------------------------------------- */

      .orbits-results-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(68, 136, 255, 0.05) 0%, transparent 50%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .results-content {
        text-align: center;
        max-width: 600px;
        width: 100%;
      }

      .results-title {
        font-size: 32px;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 20px 0;
        letter-spacing: 1px;
      }

      .results-winner {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.02) 100%);
        border: 2px solid #ffd700;
        border-radius: 12px;
      }

      .winner-crown {
        font-size: 48px;
        margin-bottom: 8px;
      }

      .winner-name {
        font-size: 28px;
        font-weight: 700;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
      }

      .winner-label {
        font-size: 12px;
        color: #88aacc;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-top: 4px;
      }

      .results-rankings {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #112244;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 24px;
      }

      .results-header-row {
        display: grid;
        grid-template-columns: 40px 1fr 80px 100px;
        padding: 10px 16px;
        background: rgba(136, 170, 204, 0.1);
        font-size: 11px;
        font-weight: 600;
        color: #88aacc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #112244;
      }

      .results-rank-row {
        display: grid;
        grid-template-columns: 40px 1fr 80px 100px;
        padding: 12px 16px;
        border-bottom: 1px solid #112244;
        transition: background 0.2s;
      }

      .results-rank-row:last-child {
        border-bottom: none;
      }

      .results-rank-row:hover {
        background: rgba(68, 136, 255, 0.05);
      }

      .results-rank-row.first {
        background: rgba(255, 215, 0, 0.1);
      }

      .results-rank-row.second {
        background: rgba(192, 192, 192, 0.05);
      }

      .results-rank-row.third {
        background: rgba(205, 127, 50, 0.05);
      }

      .results-rank-row.winner .rank-username {
        color: #ffd700;
      }

      .rank-position {
        font-size: 16px;
        font-weight: 700;
        color: #88aacc;
      }

      .results-rank-row.first .rank-position {
        color: #ffd700;
      }

      .results-rank-row.second .rank-position {
        color: #c0c0c0;
      }

      .results-rank-row.third .rank-position {
        color: #cd7f32;
      }

      .rank-username {
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
        text-align: left;
      }

      .rank-territory {
        font-size: 14px;
        font-weight: 600;
        color: #4488ff;
      }

      .rank-eliminations {
        font-size: 13px;
        color: #88aacc;
      }

      .results-next {
        margin-top: 20px;
        color: #88aacc;
        font-size: 16px;
      }

      .results-next strong {
        color: #ffffff;
        font-variant-numeric: tabular-nums;
      }

      .results-next .orbits-return-btn {
        margin-top: 16px;
      }

      /* -------------------------------------------
         VICTORY SCREEN (SHADOW SELF MODE)
         ------------------------------------------- */

      .orbits-victory-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(255, 215, 0, 0.08) 0%, transparent 60%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .victory-content {
        text-align: center;
        max-width: 500px;
        animation: victory-fade-in 0.6s ease-out;
      }

      @keyframes victory-fade-in {
        0% {
          opacity: 0;
          transform: scale(0.9) translateY(20px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .victory-icon-container {
        position: relative;
        margin-bottom: 20px;
      }

      .victory-icon {
        font-size: 100px;
        animation: victory-bounce 1s ease-in-out infinite;
      }

      @keyframes victory-bounce {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.05); }
      }

      .victory-sparkles {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 200px;
        pointer-events: none;
      }

      .victory-sparkles .sparkle {
        position: absolute;
        font-size: 24px;
        animation: sparkle-float 2s ease-in-out infinite;
      }

      .victory-sparkles .sparkle:nth-child(1) {
        top: 10%;
        left: 20%;
        animation-delay: 0s;
      }

      .victory-sparkles .sparkle:nth-child(2) {
        top: 15%;
        right: 15%;
        animation-delay: 0.5s;
      }

      .victory-sparkles .sparkle:nth-child(3) {
        bottom: 20%;
        left: 15%;
        animation-delay: 1s;
      }

      .victory-sparkles .sparkle:nth-child(4) {
        bottom: 25%;
        right: 20%;
        animation-delay: 1.5s;
      }

      @keyframes sparkle-float {
        0%, 100% {
          opacity: 0;
          transform: translateY(0) scale(0);
        }
        50% {
          opacity: 1;
          transform: translateY(-20px) scale(1);
        }
      }

      .victory-title {
        font-size: 56px;
        font-weight: 700;
        color: #ffd700;
        margin: 0 0 10px 0;
        text-shadow:
          0 0 20px rgba(255, 215, 0, 0.6),
          0 0 40px rgba(255, 215, 0, 0.3);
        letter-spacing: 3px;
      }

      .victory-subtitle {
        font-size: 18px;
        color: #88aacc;
        margin: 0 0 30px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .victory-stats {
        display: flex;
        justify-content: center;
        gap: 50px;
        margin-bottom: 30px;
      }

      .victory-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .victory-stat .stat-value {
        font-size: 40px;
        font-weight: 700;
        color: #ffffff;
      }

      .victory-stat .stat-label {
        font-size: 13px;
        color: #88aacc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .victory-upgrade-box {
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.05) 100%);
        border: 2px solid #00ff88;
        border-radius: 12px;
        padding: 24px 32px;
        margin-bottom: 30px;
        position: relative;
        overflow: hidden;
      }

      .victory-upgrade-box::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg,
          transparent,
          rgba(0, 255, 136, 0.1),
          transparent
        );
        animation: upgrade-shine 2s infinite;
      }

      @keyframes upgrade-shine {
        0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
      }

      .upgrade-icon {
        font-size: 36px;
        margin-bottom: 8px;
      }

      .upgrade-text {
        font-size: 24px;
        font-weight: 700;
        color: #00ff88;
        margin: 0;
        text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
      }

      .upgrade-subtitle {
        font-size: 14px;
        color: #88aacc;
        margin: 4px 0 0 0;
      }

      .orbits-continue-btn {
        background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
        border: none;
        border-radius: 8px;
        color: #000000;
        font-size: 18px;
        font-weight: 700;
        padding: 16px 40px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
      }

      .orbits-continue-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
      }

      .orbits-continue-btn:active {
        transform: translateY(0);
      }

      /* -------------------------------------------
         DEFEAT SCREEN (SHADOW SELF MODE)
         ------------------------------------------- */

      .orbits-defeat-view {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background:
          radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
          linear-gradient(rgba(17, 34, 68, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 34, 68, 0.2) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      .defeat-content {
        text-align: center;
        max-width: 500px;
        animation: defeat-fade-in 0.6s ease-out;
      }

      @keyframes defeat-fade-in {
        0% {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .defeat-icon {
        font-size: 100px;
        margin-bottom: 20px;
        filter: grayscale(0.5) opacity(0.7);
        animation: defeat-float 3s ease-in-out infinite;
      }

      @keyframes defeat-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      .defeat-title {
        font-size: 48px;
        font-weight: 700;
        color: #8b5cf6;
        margin: 0 0 10px 0;
        text-shadow:
          0 0 20px rgba(139, 92, 246, 0.4),
          0 0 40px rgba(139, 92, 246, 0.2);
        letter-spacing: 2px;
      }

      .defeat-subtitle {
        font-size: 18px;
        color: #88aacc;
        margin: 0 0 30px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .defeat-stats {
        display: flex;
        justify-content: center;
        gap: 50px;
        margin-bottom: 30px;
      }

      .defeat-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .defeat-stat .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: #ffffff;
      }

      .defeat-stat .stat-label {
        font-size: 13px;
        color: #88aacc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .defeat-message-box {
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid #8b5cf6;
        border-radius: 8px;
        padding: 20px 24px;
        margin-bottom: 30px;
      }

      .defeat-message {
        font-size: 18px;
        font-weight: 600;
        color: #8b5cf6;
        margin: 0 0 8px 0;
      }

      .defeat-submessage {
        font-size: 14px;
        color: #88aacc;
        margin: 0;
        font-style: italic;
      }

      .defeat-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .orbits-rematch-btn {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        border: none;
        border-radius: 8px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 700;
        padding: 14px 32px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }

      .orbits-rematch-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
      }

      .orbits-rematch-btn:active {
        transform: translateY(0);
      }

      .orbits-rematch-btn-disabled {
        background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        cursor: not-allowed;
        opacity: 0.7;
        box-shadow: none;
      }

      .orbits-rematch-btn-disabled:hover {
        transform: none;
        box-shadow: none;
      }

      /* -------------------------------------------
         REMATCH MODAL
         ------------------------------------------- */

      .orbits-rematch-modal {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 10, 18, 0.85);
        z-index: 100;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .orbits-rematch-modal.visible {
        opacity: 1;
      }

      .rematch-modal-content {
        background: linear-gradient(180deg, #1a1f2e 0%, #0d1117 100%);
        border: 2px solid #4488ff;
        border-radius: 12px;
        padding: 32px 40px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(68, 136, 255, 0.3);
      }

      .rematch-title {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 16px 0;
      }

      .rematch-message {
        font-size: 16px;
        color: #88aacc;
        margin: 0 0 8px 0;
      }

      .rematch-cost {
        font-size: 14px;
        color: #ffd700;
        font-weight: 600;
        margin: 0 0 24px 0;
      }

      .rematch-actions {
        display: flex;
        gap: 12px;
      }

      .rematch-yes-btn,
      .rematch-no-btn {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .rematch-yes-btn {
        background: linear-gradient(135deg, #4488ff 0%, #2266dd 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(68, 136, 255, 0.3);
      }

      .rematch-yes-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(68, 136, 255, 0.4);
      }

      .rematch-no-btn {
        background: rgba(136, 170, 204, 0.1);
        border: 1px solid #88aacc44;
        color: #88aacc;
      }

      .rematch-no-btn:hover {
        background: rgba(136, 170, 204, 0.15);
        border-color: #88aacc;
      }

      /* -------------------------------------------
         RESPONSIVE ADJUSTMENTS
         ------------------------------------------- */

      @media (max-width: 768px) {
        .orbits-header {
          padding: 10px 12px;
        }

        .orbits-title {
          font-size: 16px;
        }

        .orbits-timer {
          font-size: 14px;
        }

        .orbits-arena-container {
          padding: 10px;
        }

        .orbits-footer {
          padding: 10px 12px;
        }

        .territory-label {
          font-size: 10px;
        }

        .eliminated-title {
          font-size: 28px;
        }

        .eliminated-stats {
          gap: 24px;
        }

        .eliminated-stat .stat-value {
          font-size: 28px;
        }

        .countdown-text {
          font-size: 80px;
        }

        .victory-title,
        .defeat-title {
          font-size: 36px;
        }

        .victory-stats,
        .defeat-stats {
          gap: 30px;
        }

        .victory-stat .stat-value,
        .defeat-stat .stat-value {
          font-size: 32px;
        }

        .victory-icon,
        .defeat-icon {
          font-size: 70px;
        }

        .upgrade-text {
          font-size: 20px;
        }

        .orbits-continue-btn,
        .orbits-rematch-btn {
          font-size: 16px;
          padding: 12px 28px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

export default GhostOrbitsPanel;
