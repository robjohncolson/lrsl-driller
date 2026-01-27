/**
 * ghost-battle-viz.js
 * Battle replay visualization component
 *
 * Features:
 * - Animated race track showing ghost progress
 * - Play/pause and speed controls
 * - Correct/incorrect flash indicators
 * - Final results with rating changes
 */

// ============================================
// CONFIGURATION
// ============================================

export const VIZ_CONFIG = {
  trackWidth: 600,           // Track width in pixels
  trackHeight: 80,           // Track height per ghost
  problemCount: 10,          // Problems per battle
  ghostSize: 28,             // Ghost sphere diameter
  flashDuration: 300,        // Flash effect duration (ms)
  defaultSpeed: 1,           // Default playback speed
  speeds: [1, 2, 4],         // Available speed options
  animationFPS: 60,          // Target frame rate
  timeDisplayFPS: 10         // Time display update rate
};

export const COLORS = {
  challenger: '#4488ff',     // Blue
  challengerGlow: 'rgba(68, 136, 255, 0.5)',
  defender: '#ff4444',       // Red
  defenderGlow: 'rgba(255, 68, 68, 0.5)',
  correct: '#00ff88',        // Green
  incorrect: '#ff4444',      // Red
  track: '#1a1a2e',          // Dark track
  trackLine: '#2a2a4e',      // Track lines
  trackBorder: '#3a3a5e',    // Track border
  problemEmpty: '#333344',   // Unsolved problem
  problemSolving: '#00ffff', // Currently solving
  highlight: '#00ffff',      // Cyan highlight
  textPrimary: '#ffffff',
  textSecondary: '#888899'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse battle timeline into keyframe format
 * @param {Object} battleData - Battle results from ghost-battle-engine
 * @returns {Object} { challenger: [], defender: [], totalDuration }
 */
export function parseTimeline(battleData) {
  const challengerKeyframes = [];
  const defenderKeyframes = [];

  let challengerTime = 0;
  let defenderTime = 0;

  for (const problem of battleData.problems) {
    // Challenger keyframes
    challengerKeyframes.push({
      problemIndex: problem.index,
      startTime: challengerTime,
      endTime: challengerTime + problem.challenger.result.time,
      correct: problem.challenger.result.correct,
      difficulty: problem.difficulty
    });
    challengerTime += problem.challenger.result.time;

    // Defender keyframes
    defenderKeyframes.push({
      problemIndex: problem.index,
      startTime: defenderTime,
      endTime: defenderTime + problem.defender.result.time,
      correct: problem.defender.result.correct,
      difficulty: problem.difficulty
    });
    defenderTime += problem.defender.result.time;
  }

  return {
    challenger: challengerKeyframes,
    defender: defenderKeyframes,
    totalDuration: Math.max(challengerTime, defenderTime)
  };
}

/**
 * Calculate total battle duration
 * @param {Object} battleData - Battle results
 * @returns {number} Duration in seconds
 */
export function calculateTotalDuration(battleData) {
  return Math.max(
    battleData.challenger.totalTime,
    battleData.defender.totalTime
  );
}

/**
 * Get ghost state at a specific time
 * @param {Object[]} keyframes - Ghost keyframes
 * @param {number} currentTime - Current replay time
 * @returns {Object} { completedProblems, currentProblemIndex, currentProblemProgress, results }
 */
export function getGhostStateAtTime(keyframes, currentTime) {
  let completedProblems = 0;
  let currentProblemIndex = 0;
  let currentProblemProgress = 0;
  const results = [];

  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i];

    if (currentTime >= kf.endTime) {
      // Problem completed
      completedProblems++;
      results.push({ correct: kf.correct, completed: true });
    } else if (currentTime >= kf.startTime) {
      // Currently solving
      currentProblemIndex = i;
      const elapsed = currentTime - kf.startTime;
      const duration = kf.endTime - kf.startTime;
      currentProblemProgress = Math.min(elapsed / duration, 1);
      results.push({ correct: null, completed: false });
      break;
    } else {
      // Not yet started
      results.push({ correct: null, completed: false });
    }
  }

  // Fill remaining problems
  while (results.length < keyframes.length) {
    results.push({ correct: null, completed: false });
  }

  return {
    completedProblems,
    currentProblemIndex,
    currentProblemProgress,
    totalProgress: (completedProblems + currentProblemProgress) / keyframes.length,
    results
  };
}

/**
 * Format seconds to mm:ss display
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Easing function for smooth animations
 * @param {number} t - Progress 0-1
 * @returns {number}
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ============================================
// BATTLE VIZ CLASS
// ============================================

/**
 * BattleViz class - orchestrates battle replay visualization
 */
export class BattleViz {
  /**
   * @param {HTMLElement} container - Container element for the viz
   */
  constructor(container) {
    this.container = container;

    // State
    this.battleData = null;
    this.keyframes = null;
    this.challengerName = '';
    this.defenderName = '';
    this.ratingChanges = { challengerChange: 0, defenderChange: 0 };

    // Playback state
    this.isPlaying = false;
    this.currentTime = 0;
    this.playbackSpeed = VIZ_CONFIG.defaultSpeed;
    this.totalDuration = 0;

    // Animation state
    this.animationFrameId = null;
    this.lastTimestamp = 0;
    this.lastTimeDisplayUpdate = 0;

    // Flash tracking
    this.lastChallengerCompleted = 0;
    this.lastDefenderCompleted = 0;

    // DOM references (set in _buildUI)
    this.panel = null;
    this.trackCanvas = null;
    this.ctx = null;
    this.problemIndicators = { challenger: [], defender: [] };
    this.timeDisplay = null;
    this.totalTimeDisplay = null;
    this.playBtn = null;
    this.speedBtns = {};
    this.resultsPanel = null;

    // Event handlers (bound for removal)
    this._boundAnimate = this._animate.bind(this);
    this._boundKeyHandler = this._handleKeydown.bind(this);

    // Build initial UI
    this._buildUI();
  }

  /**
   * Load battle data and prepare for playback
   * @param {Object} battleData - Battle results from ghost-battle-engine
   * @param {string} challengerName - Challenger display name
   * @param {string} defenderName - Defender display name
   * @param {Object} ratingChanges - { challengerChange, defenderChange }
   */
  loadBattle(battleData, challengerName, defenderName, ratingChanges = {}) {
    this.battleData = battleData;
    this.challengerName = challengerName || 'Challenger';
    this.defenderName = defenderName || 'Defender';
    this.ratingChanges = {
      challengerChange: ratingChanges.challengerChange || 0,
      defenderChange: ratingChanges.defenderChange || 0
    };

    // Parse timeline into keyframes
    this.keyframes = parseTimeline(battleData);
    this.totalDuration = this.keyframes.totalDuration;

    // Reset playback state
    this.currentTime = 0;
    this.isPlaying = false;
    this.lastChallengerCompleted = 0;
    this.lastDefenderCompleted = 0;

    // Update UI
    this._updateNames();
    this._updateTimeDisplay();
    this._hideResults();
    this._render();

    // Show panel
    this.show();
  }

  /**
   * Start or resume playback
   */
  play() {
    if (this.isPlaying) return;
    if (this.currentTime >= this.totalDuration) {
      this.reset();
    }

    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this._updatePlayButton();
    this.animationFrameId = requestAnimationFrame(this._boundAnimate);
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this._updatePlayButton();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Set playback speed
   * @param {number} speed - 1, 2, or 4
   */
  setSpeed(speed) {
    if (!VIZ_CONFIG.speeds.includes(speed)) return;
    this.playbackSpeed = speed;
    this._updateSpeedButtons();
  }

  /**
   * Skip to end of replay
   */
  skipToEnd() {
    this.pause();
    this.currentTime = this.totalDuration;
    this._render();
    this._showResults();
  }

  /**
   * Reset replay to beginning
   */
  reset() {
    this.pause();
    this.currentTime = 0;
    this.lastChallengerCompleted = 0;
    this.lastDefenderCompleted = 0;
    this._hideResults();
    this._render();
    this._updateTimeDisplay();
  }

  /**
   * Show the replay panel
   */
  show() {
    if (this.panel) {
      this.panel.classList.remove('hidden');
    }
    document.addEventListener('keydown', this._boundKeyHandler);
  }

  /**
   * Hide the replay panel
   */
  hide() {
    this.pause();
    if (this.panel) {
      this.panel.classList.add('hidden');
    }
    document.removeEventListener('keydown', this._boundKeyHandler);
  }

  /**
   * Check if panel is visible
   * @returns {boolean}
   */
  isVisible() {
    return this.panel && !this.panel.classList.contains('hidden');
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.pause();
    document.removeEventListener('keydown', this._boundKeyHandler);

    // Clear references
    this.battleData = null;
    this.keyframes = null;
    this.ctx = null;

    // Remove DOM elements
    if (this.panel && this.panel.parentElement) {
      this.panel.remove();
    }
  }

  // ============================================
  // PRIVATE METHODS - UI BUILDING
  // ============================================

  /**
   * Build the replay panel UI
   */
  _buildUI() {
    // Create main panel
    this.panel = document.createElement('div');
    this.panel.id = 'battle-replay-panel';
    this.panel.className = 'hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center';
    this.panel.innerHTML = this._getPanelHTML();

    // Append to container
    this.container.appendChild(this.panel);

    // Get DOM references
    this.trackCanvas = this.panel.querySelector('#battle-track-canvas');
    this.ctx = this.trackCanvas?.getContext('2d');
    this.timeDisplay = this.panel.querySelector('#replay-current-time');
    this.totalTimeDisplay = this.panel.querySelector('#replay-total-time');
    this.playBtn = this.panel.querySelector('#replay-play-pause');
    this.resultsPanel = this.panel.querySelector('#battle-results');

    // Speed buttons
    this.speedBtns = {
      1: this.panel.querySelector('#replay-speed-1x'),
      2: this.panel.querySelector('#replay-speed-2x'),
      4: this.panel.querySelector('#replay-speed-4x')
    };

    // Problem indicators
    for (let i = 0; i < VIZ_CONFIG.problemCount; i++) {
      this.problemIndicators.challenger.push(
        this.panel.querySelector(`#challenger-problem-${i}`)
      );
      this.problemIndicators.defender.push(
        this.panel.querySelector(`#defender-problem-${i}`)
      );
    }

    // Attach event listeners
    this._attachEventListeners();
  }

  /**
   * Get panel HTML template
   * @returns {string}
   */
  _getPanelHTML() {
    const problemDots = (prefix) => {
      let html = '';
      for (let i = 0; i < VIZ_CONFIG.problemCount; i++) {
        html += `<div id="${prefix}-problem-${i}" class="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-600 transition-all duration-200"></div>`;
      }
      return html;
    };

    return `
      <div class="bg-slate-900 rounded-lg shadow-2xl w-[95%] max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-cyan-400">Battle Replay</h2>
          <button id="battle-replay-close" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <!-- Combatant Info -->
        <div class="flex justify-between items-center mb-6">
          <div class="text-center flex-1">
            <div class="text-lg font-semibold text-blue-400" id="challenger-display-name">Challenger</div>
            <div class="text-sm text-gray-500">Challenger</div>
          </div>
          <div class="text-2xl font-bold text-cyan-300 px-4">VS</div>
          <div class="text-center flex-1">
            <div class="text-lg font-semibold text-red-400" id="defender-display-name">Defender</div>
            <div class="text-sm text-gray-500">Defender</div>
          </div>
        </div>

        <!-- Race Track Canvas -->
        <div class="mb-4 relative">
          <canvas id="battle-track-canvas" width="${VIZ_CONFIG.trackWidth}" height="${VIZ_CONFIG.trackHeight * 2 + 40}"
            class="w-full bg-slate-800 rounded-lg"></canvas>
        </div>

        <!-- Problem Progress Indicators -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-blue-400 w-20">Challenger</span>
            <div class="flex gap-2">${problemDots('challenger')}</div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-red-400 w-20">Defender</span>
            <div class="flex gap-2">${problemDots('defender')}</div>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="flex items-center justify-center gap-3 mb-4">
          <button id="replay-play-pause" class="w-12 h-12 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white text-xl transition-colors">
            <span id="play-icon">&#9654;</span>
          </button>
          <div class="flex gap-1">
            <button id="replay-speed-1x" class="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded text-sm text-white transition-colors">1x</button>
            <button id="replay-speed-2x" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors">2x</button>
            <button id="replay-speed-4x" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors">4x</button>
          </div>
          <button id="replay-skip" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors">Skip</button>
          <button id="replay-reset" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors">Reset</button>
        </div>

        <!-- Time Display -->
        <div class="text-center text-gray-400 mb-4">
          <span id="replay-current-time" class="text-lg font-mono">0:00</span>
          <span class="text-gray-600"> / </span>
          <span id="replay-total-time" class="text-lg font-mono">0:00</span>
        </div>

        <!-- Results Panel (hidden until complete) -->
        <div id="battle-results" class="hidden mt-6 p-4 bg-slate-800 rounded-lg">
          <!-- Winner Banner -->
          <div id="winner-banner" class="text-center mb-4">
            <div class="text-2xl font-bold text-yellow-400" id="winner-text">VICTORY!</div>
            <div class="text-lg text-cyan-300" id="winner-name"></div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-400" id="result-challenger-correct">0</div>
              <div class="text-sm text-gray-500">Correct</div>
              <div class="text-lg text-blue-300 mt-2" id="result-challenger-time">0:00</div>
              <div class="text-sm text-gray-500">Time</div>
              <div class="text-lg mt-2" id="result-challenger-rating">+0</div>
              <div class="text-sm text-gray-500">Rating</div>
            </div>
            <div class="flex items-center justify-center">
              <div class="text-4xl text-gray-600">vs</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-400" id="result-defender-correct">0</div>
              <div class="text-sm text-gray-500">Correct</div>
              <div class="text-lg text-red-300 mt-2" id="result-defender-time">0:00</div>
              <div class="text-sm text-gray-500">Time</div>
              <div class="text-lg mt-2" id="result-defender-rating">+0</div>
              <div class="text-sm text-gray-500">Rating</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to UI elements
   */
  _attachEventListeners() {
    // Close button
    const closeBtn = this.panel.querySelector('#battle-replay-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Play/pause
    this.playBtn?.addEventListener('click', () => this.togglePlay());

    // Speed buttons
    this.speedBtns[1]?.addEventListener('click', () => this.setSpeed(1));
    this.speedBtns[2]?.addEventListener('click', () => this.setSpeed(2));
    this.speedBtns[4]?.addEventListener('click', () => this.setSpeed(4));

    // Skip and reset
    this.panel.querySelector('#replay-skip')?.addEventListener('click', () => this.skipToEnd());
    this.panel.querySelector('#replay-reset')?.addEventListener('click', () => this.reset());

    // Click outside to close
    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.hide();
      }
    });
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e
   */
  _handleKeydown(e) {
    if (!this.isVisible()) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlay();
        break;
      case 'Escape':
        this.hide();
        break;
      case '1':
        this.setSpeed(1);
        break;
      case '2':
        this.setSpeed(2);
        break;
      case '4':
        this.setSpeed(4);
        break;
      case 's':
      case 'S':
        this.skipToEnd();
        break;
      case 'r':
      case 'R':
        this.reset();
        break;
    }
  }

  // ============================================
  // PRIVATE METHODS - UI UPDATES
  // ============================================

  /**
   * Update combatant name displays
   */
  _updateNames() {
    const challengerEl = this.panel.querySelector('#challenger-display-name');
    const defenderEl = this.panel.querySelector('#defender-display-name');

    if (challengerEl) challengerEl.textContent = this.challengerName;
    if (defenderEl) defenderEl.textContent = this.defenderName;

    // Update total time display
    if (this.totalTimeDisplay) {
      this.totalTimeDisplay.textContent = formatTime(this.totalDuration);
    }
  }

  /**
   * Update play button icon
   */
  _updatePlayButton() {
    const playIcon = this.panel.querySelector('#play-icon');
    if (playIcon) {
      playIcon.innerHTML = this.isPlaying ? '&#10074;&#10074;' : '&#9654;';
    }
  }

  /**
   * Update speed button states
   */
  _updateSpeedButtons() {
    for (const [speed, btn] of Object.entries(this.speedBtns)) {
      if (!btn) continue;
      if (parseInt(speed) === this.playbackSpeed) {
        btn.classList.remove('bg-slate-700');
        btn.classList.add('bg-cyan-700');
      } else {
        btn.classList.remove('bg-cyan-700');
        btn.classList.add('bg-slate-700');
      }
    }
  }

  /**
   * Update time display
   */
  _updateTimeDisplay() {
    if (this.timeDisplay) {
      this.timeDisplay.textContent = formatTime(this.currentTime);
    }
  }

  /**
   * Hide results panel
   */
  _hideResults() {
    if (this.resultsPanel) {
      this.resultsPanel.classList.add('hidden');
    }
  }

  /**
   * Show and populate results panel
   */
  _showResults() {
    if (!this.resultsPanel || !this.battleData) return;

    this.resultsPanel.classList.remove('hidden');

    // Winner text
    const winnerText = this.panel.querySelector('#winner-text');
    const winnerName = this.panel.querySelector('#winner-name');

    if (this.battleData.winner === 1) {
      winnerText.textContent = 'VICTORY!';
      winnerText.className = 'text-2xl font-bold text-yellow-400';
      winnerName.textContent = `${this.challengerName} wins!`;
    } else if (this.battleData.winner === 2) {
      winnerText.textContent = 'VICTORY!';
      winnerText.className = 'text-2xl font-bold text-yellow-400';
      winnerName.textContent = `${this.defenderName} wins!`;
    } else {
      winnerText.textContent = 'DRAW';
      winnerText.className = 'text-2xl font-bold text-gray-400';
      winnerName.textContent = 'It\'s a tie!';
    }

    // Stats
    const setEl = (id, value) => {
      const el = this.panel.querySelector(id);
      if (el) el.textContent = value;
    };

    setEl('#result-challenger-correct', this.battleData.challenger.correctCount);
    setEl('#result-defender-correct', this.battleData.defender.correctCount);
    setEl('#result-challenger-time', formatTime(this.battleData.challenger.totalTime));
    setEl('#result-defender-time', formatTime(this.battleData.defender.totalTime));

    // Rating changes with color
    const challengerRatingEl = this.panel.querySelector('#result-challenger-rating');
    const defenderRatingEl = this.panel.querySelector('#result-defender-rating');

    if (challengerRatingEl) {
      const change = this.ratingChanges.challengerChange;
      challengerRatingEl.textContent = (change >= 0 ? '+' : '') + change;
      challengerRatingEl.className = `text-lg mt-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`;
    }

    if (defenderRatingEl) {
      const change = this.ratingChanges.defenderChange;
      defenderRatingEl.textContent = (change >= 0 ? '+' : '') + change;
      defenderRatingEl.className = `text-lg mt-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`;
    }
  }

  // ============================================
  // PRIVATE METHODS - ANIMATION
  // ============================================

  /**
   * Main animation loop
   * @param {number} timestamp
   */
  _animate(timestamp) {
    if (!this.isPlaying) return;

    // Calculate delta time
    const deltaMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Advance replay time
    const deltaSeconds = (deltaMs / 1000) * this.playbackSpeed;
    this.currentTime = Math.min(
      this.currentTime + deltaSeconds,
      this.totalDuration
    );

    // Render current state
    this._render();

    // Update time display (throttled)
    if (timestamp - this.lastTimeDisplayUpdate > 1000 / VIZ_CONFIG.timeDisplayFPS) {
      this._updateTimeDisplay();
      this.lastTimeDisplayUpdate = timestamp;
    }

    // Check for completion
    if (this.currentTime >= this.totalDuration) {
      this._onReplayComplete();
    } else {
      this.animationFrameId = requestAnimationFrame(this._boundAnimate);
    }
  }

  /**
   * Called when replay finishes
   */
  _onReplayComplete() {
    this.isPlaying = false;
    this._updatePlayButton();
    this._updateTimeDisplay();
    this._showResults();
  }

  /**
   * Render current state
   */
  _render() {
    if (!this.keyframes) return;

    // Get ghost states
    const challengerState = getGhostStateAtTime(this.keyframes.challenger, this.currentTime);
    const defenderState = getGhostStateAtTime(this.keyframes.defender, this.currentTime);

    // Draw race track
    this._drawTrack(challengerState, defenderState);

    // Update problem indicators
    this._updateProblemIndicators(challengerState, defenderState);

    // Check for flash effects
    this._checkFlashEffects(challengerState, defenderState);
  }

  /**
   * Draw the race track canvas
   * @param {Object} challengerState
   * @param {Object} defenderState
   */
  _drawTrack(challengerState, defenderState) {
    if (!this.ctx || !this.trackCanvas) return;

    const ctx = this.ctx;
    const width = this.trackCanvas.width;
    const height = this.trackCanvas.height;
    const trackHeight = VIZ_CONFIG.trackHeight;
    const ghostSize = VIZ_CONFIG.ghostSize;

    // Clear canvas
    ctx.fillStyle = COLORS.track;
    ctx.fillRect(0, 0, width, height);

    // Draw track lanes
    const laneY = [20, 20 + trackHeight + 20];

    for (let lane = 0; lane < 2; lane++) {
      const y = laneY[lane];

      // Track background
      ctx.fillStyle = lane === 0 ? 'rgba(68, 136, 255, 0.1)' : 'rgba(255, 68, 68, 0.1)';
      ctx.fillRect(10, y, width - 20, trackHeight);

      // Track border
      ctx.strokeStyle = lane === 0 ? COLORS.challenger : COLORS.defender;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, y, width - 20, trackHeight);

      // Problem dividers
      const segmentWidth = (width - 20) / VIZ_CONFIG.problemCount;
      ctx.strokeStyle = COLORS.trackLine;
      ctx.lineWidth = 1;
      for (let i = 1; i < VIZ_CONFIG.problemCount; i++) {
        const x = 10 + i * segmentWidth;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + trackHeight);
        ctx.stroke();
      }

      // Problem numbers
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < VIZ_CONFIG.problemCount; i++) {
        const x = 10 + (i + 0.5) * segmentWidth;
        ctx.fillText((i + 1).toString(), x, y + trackHeight - 5);
      }
    }

    // Draw ghost spheres
    const trackInnerWidth = width - 20 - ghostSize;
    const startX = 10 + ghostSize / 2;

    // Challenger ghost (top lane)
    const challengerX = startX + challengerState.totalProgress * trackInnerWidth;
    const challengerY = laneY[0] + trackHeight / 2;
    this._drawGhost(ctx, challengerX, challengerY, COLORS.challenger, COLORS.challengerGlow);

    // Defender ghost (bottom lane)
    const defenderX = startX + defenderState.totalProgress * trackInnerWidth;
    const defenderY = laneY[1] + trackHeight / 2;
    this._drawGhost(ctx, defenderX, defenderY, COLORS.defender, COLORS.defenderGlow);

    // Draw finish line
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width - 15, 0);
    ctx.lineTo(width - 15, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw a ghost sphere
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @param {string} glowColor
   */
  _drawGhost(ctx, x, y, color, glowColor) {
    const radius = VIZ_CONFIG.ghostSize / 2;

    // Outer glow
    const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core sphere
    const coreGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.3, color);
    coreGradient.addColorStop(1, color);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Update problem indicator dots
   * @param {Object} challengerState
   * @param {Object} defenderState
   */
  _updateProblemIndicators(challengerState, defenderState) {
    const updateIndicators = (indicators, results, currentIndex, progress) => {
      for (let i = 0; i < indicators.length; i++) {
        const el = indicators[i];
        if (!el) continue;

        const result = results[i];

        if (result.completed) {
          if (result.correct) {
            el.className = 'w-6 h-6 rounded-full bg-green-500 border-2 border-green-400 transition-all duration-200';
          } else {
            el.className = 'w-6 h-6 rounded-full bg-red-500 border-2 border-red-400 transition-all duration-200';
          }
        } else if (i === currentIndex && progress > 0) {
          el.className = 'w-6 h-6 rounded-full bg-cyan-500 border-2 border-cyan-400 animate-pulse transition-all duration-200';
        } else {
          el.className = 'w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-600 transition-all duration-200';
        }
      }
    };

    updateIndicators(
      this.problemIndicators.challenger,
      challengerState.results,
      challengerState.currentProblemIndex,
      challengerState.currentProblemProgress
    );

    updateIndicators(
      this.problemIndicators.defender,
      defenderState.results,
      defenderState.currentProblemIndex,
      defenderState.currentProblemProgress
    );
  }

  /**
   * Check for and trigger flash effects
   * @param {Object} challengerState
   * @param {Object} defenderState
   */
  _checkFlashEffects(challengerState, defenderState) {
    // Challenger flash
    if (challengerState.completedProblems > this.lastChallengerCompleted) {
      const lastCompleted = this.keyframes.challenger[this.lastChallengerCompleted];
      if (lastCompleted) {
        this._triggerFlash('challenger', lastCompleted.correct);
      }
      this.lastChallengerCompleted = challengerState.completedProblems;
    }

    // Defender flash
    if (defenderState.completedProblems > this.lastDefenderCompleted) {
      const lastCompleted = this.keyframes.defender[this.lastDefenderCompleted];
      if (lastCompleted) {
        this._triggerFlash('defender', lastCompleted.correct);
      }
      this.lastDefenderCompleted = defenderState.completedProblems;
    }
  }

  /**
   * Trigger a flash effect for answer completion
   * @param {string} ghost - 'challenger' or 'defender'
   * @param {boolean} correct
   */
  _triggerFlash(ghost, correct) {
    // Flash the indicator that just completed
    const completedIndex = ghost === 'challenger'
      ? this.lastChallengerCompleted
      : this.lastDefenderCompleted;

    const indicator = this.problemIndicators[ghost][completedIndex];
    if (!indicator) return;

    // Add flash class
    const flashClass = correct ? 'ring-4 ring-green-400' : 'ring-4 ring-red-400';
    indicator.classList.add(...flashClass.split(' '));

    // Remove after duration
    setTimeout(() => {
      indicator.classList.remove(...flashClass.split(' '));
    }, VIZ_CONFIG.flashDuration);
  }
}
