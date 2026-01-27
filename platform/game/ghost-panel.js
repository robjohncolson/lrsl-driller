/**
 * Ghost Panel
 *
 * UI component for the Ghost game mode.
 * Features a sliding panel from the right with tabbed content.
 * Supports "My Ghost", "Battle", and "Class View" (teacher only) tabs.
 */

import { MazeRenderer, parseLeaderboardData } from '../core/ghost-maze-renderer.js';
import { getRatingTier, ELO_CONFIG } from '../core/ghost-battle-engine.js';
import { BattleViz } from '../core/ghost-battle-viz.js';

export class GhostPanel {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container element to render panel into
   * @param {string} options.serverUrl - Server URL for API calls
   * @param {string} options.username - Current user's username
   * @param {boolean} options.isTeacher - Whether current user is a teacher
   * @param {Object} options.manifest - Cartridge manifest
   * @param {Function} options.onClose - Callback when panel is closed
   */
  constructor(options) {
    this.container = options.container;
    this.serverUrl = options.serverUrl;
    this.username = options.username;
    this.isTeacher = options.isTeacher || false;
    this.manifest = options.manifest;
    this.onClose = options.onClose || (() => {});

    this.isVisible = false;
    this.activeTab = 'my-ghost';
    this.ghostProfile = null;

    // 3D Maze renderer state
    this.mazeRenderer = null;
    this.mazeInitialized = false;
    this.mazeError = null;
    this.playerProgress = options.playerProgress || null;

    // Class view state (teacher only)
    this.classGhosts = [];
    this.classViewLoading = false;
    this.classViewError = null;
    this.classPeriod = options.classPeriod || null;
    this.cartridgeId = options.manifest?.meta?.id || null;

    // Battle state
    this.battleRating = null;
    this.battleHistory = [];
    this.availableOpponents = [];
    this.battleViz = null;
    this.isBattleLoading = false;
    this.battleDataInitialized = false;

    // Bind escape key handler
    this._handleEscapeKey = this._handleEscapeKey.bind(this);

    this._render();
    this._addStyles();
    this._attachEventListeners();
  }

  /**
   * Show the panel
   */
  show() {
    this.isVisible = true;
    const panel = this.container.querySelector('.ghost-panel');
    if (panel) {
      panel.classList.add('visible');
    }
    // Add escape key listener
    document.addEventListener('keydown', this._handleEscapeKey);

    // Initialize maze renderer if "My Ghost" tab is active and not yet initialized
    if (this.activeTab === 'my-ghost' && !this.mazeInitialized && !this.mazeError) {
      this._initMazeRenderer();
    }

    // Handle resize when panel becomes visible
    if (this.mazeRenderer) {
      // Trigger resize after CSS transition completes
      setTimeout(() => {
        this.mazeRenderer._handleResize();
      }, 350); // Match the 0.3s transition duration + buffer
    }
  }

  /**
   * Hide the panel
   */
  hide() {
    this.isVisible = false;
    const panel = this.container.querySelector('.ghost-panel');
    if (panel) {
      panel.classList.remove('visible');
    }
    // Remove escape key listener
    document.removeEventListener('keydown', this._handleEscapeKey);
    this.onClose();
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set the active tab
   * @param {string} tabName - 'my-ghost', 'battle', or 'class-view'
   */
  setActiveTab(tabName) {
    const validTabs = ['my-ghost', 'battle', 'class-view'];
    if (!validTabs.includes(tabName)) return;

    // Don't allow non-teachers to access class-view
    if (tabName === 'class-view' && !this.isTeacher) return;

    const previousTab = this.activeTab;
    this.activeTab = tabName;
    this._updateTabs();

    // Lazy-load maze renderer when "My Ghost" tab is first activated
    if (tabName === 'my-ghost' && !this.mazeInitialized && !this.mazeError) {
      this._initMazeRenderer();
    }

    // Load battle data when Battle tab is activated
    if (tabName === 'battle' && !this.battleDataInitialized) {
      this._initBattleTab();
    }

    // Handle class view tab activation
    if (tabName === 'class-view') {
      this._activateClassView();
    } else if (previousTab === 'class-view') {
      // Switching away from class view
      this._deactivateClassView();
    }
  }

  /**
   * Update the ghost profile display
   * @param {Object} profile - Ghost profile data
   */
  updateGhostProfile(profile) {
    this.ghostProfile = profile;
    this._updateMyGhostTab();

    // Update ghost position in 3D maze if renderer is initialized
    if (this.mazeRenderer && profile) {
      this.mazeRenderer.updateGhost(profile);
    }
  }

  /**
   * Update player progress data
   * @param {Object} progress - Player progress from game engine
   */
  updatePlayerProgress(progress) {
    this.playerProgress = progress;

    // Update maze renderer progress if initialized
    if (this.mazeRenderer && progress) {
      this.mazeRenderer.updateProgress(progress);
    }
  }

  /**
   * Cleanup resources
   */
  dispose() {
    document.removeEventListener('keydown', this._handleEscapeKey);

    // Dispose maze renderer
    if (this.mazeRenderer) {
      this.mazeRenderer.dispose();
      this.mazeRenderer = null;
    }
    this.mazeInitialized = false;

    // Dispose battle viz
    if (this.battleViz) {
      this.battleViz.dispose();
      this.battleViz = null;
    }

    this.container.innerHTML = '';
  }

  /**
   * Handle escape key press
   */
  _handleEscapeKey(event) {
    if (event.key === 'Escape' && this.isVisible) {
      // If battle viz is visible, hide it instead of the panel
      if (this.battleViz && this.battleViz.isVisible()) {
        this.battleViz.hide();
        return;
      }
      this.hide();
    }
  }

  /**
   * Render the panel HTML
   */
  _render() {
    this.container.innerHTML = `
      <div class="ghost-panel">
        <div class="ghost-panel-header">
          <h3 class="ghost-panel-title">Ghost</h3>
          <button class="ghost-panel-close" aria-label="Close panel">&times;</button>
        </div>

        <div class="ghost-panel-tabs">
          <button class="ghost-tab active" data-tab="my-ghost">My Ghost</button>
          <button class="ghost-tab" data-tab="battle">Battle</button>
          ${this.isTeacher ? '<button class="ghost-tab" data-tab="class-view">Class View</button>' : ''}
        </div>

        <div class="ghost-panel-content">
          <div class="ghost-tab-content" data-tab-content="my-ghost">
            <!-- 3D Maze Visualization Container -->
            <div class="ghost-maze-container" id="ghost-maze-container">
              <div class="ghost-maze-loading">
                <div class="ghost-placeholder-icon">👻</div>
                <p>Loading 3D visualization...</p>
              </div>
            </div>

            <!-- Ghost Stats Display -->
            <div class="ghost-stats-panel">
              <div class="ghost-stat">
                <span class="ghost-stat-label">Proficiency</span>
                <span class="ghost-stat-value" id="ghost-proficiency">--%</span>
              </div>
              <div class="ghost-stat">
                <span class="ghost-stat-label">Interactions</span>
                <span class="ghost-stat-value" id="ghost-interactions">--</span>
              </div>
              <div class="ghost-stat">
                <span class="ghost-stat-label">Current Level</span>
                <span class="ghost-stat-value ghost-stat-level" id="ghost-current-level">--</span>
              </div>
            </div>

            <!-- Legacy stats for backward compatibility -->
            <div class="ghost-stats hidden">
              <div class="ghost-stat">
                <span class="ghost-stat-label">Problems Solved</span>
                <span class="ghost-stat-value" id="ghost-problems-solved">--</span>
              </div>
              <div class="ghost-stat">
                <span class="ghost-stat-label">Ghost Level</span>
                <span class="ghost-stat-value" id="ghost-level">--</span>
              </div>
            </div>
          </div>

          <div class="ghost-tab-content hidden" data-tab-content="battle">
            ${this._renderBattleTabContent()}
          </div>

          <div class="ghost-tab-content hidden" data-tab-content="class-view">
            <div class="ghost-class-view">
              <div class="ghost-maze-container" id="ghost-maze-container-class">
                <div class="ghost-maze-loading">
                  <div class="ghost-placeholder-icon">👻</div>
                  <p>Select Class View tab to load ghosts...</p>
                </div>
              </div>
              <div class="ghost-class-stats">
                <div class="ghost-class-stat">
                  <span class="ghost-class-stat-value">--</span>
                  <span class="ghost-class-stat-label">Students</span>
                </div>
                <div class="ghost-class-stat">
                  <span class="ghost-class-stat-value">--%</span>
                  <span class="ghost-class-stat-label">Avg Proficiency</span>
                </div>
                <div class="ghost-class-stat ghost-class-stat-highlight">
                  <span class="ghost-class-stat-value">--</span>
                  <span class="ghost-class-stat-label">Most Active</span>
                </div>
              </div>
              <div class="ghost-class-list-header">
                <span class="ghost-list-col">Student</span>
                <span class="ghost-list-col ghost-list-col-center">Proficiency</span>
                <span class="ghost-list-col ghost-list-col-right">Interactions</span>
              </div>
              <div class="ghost-class-list" id="ghost-class-list">
                <div class="ghost-list-empty">
                  <p>Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Battle Viz container (outside panel for full-screen overlay) -->
      <div id="ghost-battle-viz-container"></div>
    `;
  }

  /**
   * Render the Battle tab content HTML
   * @returns {string}
   */
  _renderBattleTabContent() {
    return `
      <div class="ghost-battle-content">
        <!-- Rating Display Section -->
        <div class="ghost-battle-rating-section">
          <div class="ghost-battle-rating-display">
            <div class="ghost-battle-tier-badge" id="battle-tier-badge">
              <span class="tier-icon" id="battle-tier-icon">--</span>
            </div>
            <div class="ghost-battle-rating-info">
              <div class="ghost-battle-rating-value" id="battle-rating-value">1200</div>
              <div class="ghost-battle-tier-name" id="battle-tier-name">Gold</div>
            </div>
          </div>
          <div class="ghost-battle-record" id="battle-record">
            <span class="record-wins">0W</span>
            <span class="record-losses">0L</span>
            <span class="record-draws">0D</span>
          </div>
        </div>

        <!-- Battle Actions Section -->
        <div class="ghost-battle-actions">
          <button class="ghost-battle-btn ghost-battle-random" id="battle-random-btn">
            <span class="battle-icon">🎲</span>
            <span>Random Battle</span>
            <span class="battle-btn-spinner hidden" id="random-spinner"></span>
          </button>

          <div class="ghost-battle-challenge-section">
            <label class="ghost-battle-label">Challenge Specific Player</label>
            <div class="ghost-battle-challenge-row">
              <select class="ghost-battle-select" id="battle-opponent-select">
                <option value="">-- Select Opponent --</option>
              </select>
              <button class="ghost-battle-btn ghost-battle-challenge" id="battle-challenge-btn" disabled>
                <span class="battle-icon">⚔️</span>
                <span>Challenge</span>
                <span class="battle-btn-spinner hidden" id="challenge-spinner"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Battle History Section -->
        <div class="ghost-battle-history-section">
          <h4 class="ghost-battle-history-title">Recent Battles</h4>
          <div class="ghost-battle-history-list" id="battle-history-list">
            <div class="ghost-battle-history-loading">
              <div class="ghost-loading-spinner"></div>
              <p>Loading battle history...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Close button
    const closeBtn = this.container.querySelector('.ghost-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Tab buttons
    const tabButtons = this.container.querySelectorAll('.ghost-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        this.setActiveTab(tabName);
      });
    });
  }

  /**
   * Attach battle-specific event listeners (called after battle tab init)
   */
  _attachBattleEventListeners() {
    // Random battle button
    const randomBtn = this.container.querySelector('#battle-random-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => this._handleRandomBattle());
    }

    // Opponent select change
    const opponentSelect = this.container.querySelector('#battle-opponent-select');
    if (opponentSelect) {
      opponentSelect.addEventListener('change', () => {
        const challengeBtn = this.container.querySelector('#battle-challenge-btn');
        if (challengeBtn) {
          challengeBtn.disabled = !opponentSelect.value;
        }
      });
    }

    // Challenge button
    const challengeBtn = this.container.querySelector('#battle-challenge-btn');
    if (challengeBtn) {
      challengeBtn.addEventListener('click', () => this._handleSpecificChallenge());
    }
  }

  /**
   * Update tab states and content visibility
   */
  _updateTabs() {
    // Update tab button states
    const tabButtons = this.container.querySelectorAll('.ghost-tab');
    tabButtons.forEach(btn => {
      const tabName = btn.getAttribute('data-tab');
      if (tabName === this.activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update content visibility
    const tabContents = this.container.querySelectorAll('.ghost-tab-content');
    tabContents.forEach(content => {
      const tabName = content.getAttribute('data-tab-content');
      if (tabName === this.activeTab) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });
  }

  /**
   * Update the My Ghost tab with profile data
   */
  _updateMyGhostTab() {
    if (!this.ghostProfile) return;

    // Update new stats panel
    const proficiencyEl = this.container.querySelector('#ghost-proficiency');
    const interactionsEl = this.container.querySelector('#ghost-interactions');
    const currentLevelEl = this.container.querySelector('#ghost-current-level');

    if (proficiencyEl) {
      const proficiency = this.ghostProfile.proficiency_score || this.ghostProfile.proficiency || 0;
      proficiencyEl.textContent = `${(proficiency * 100).toFixed(0)}%`;
    }

    if (interactionsEl) {
      const interactions = this.ghostProfile.total_interactions || this.ghostProfile.interactions || 0;
      interactionsEl.textContent = interactions;
    }

    if (currentLevelEl) {
      const levelName = this._getLevelDisplayName(this.ghostProfile.currentLevel);
      currentLevelEl.textContent = levelName || '--';
      currentLevelEl.title = this.ghostProfile.currentLevel || '';
    }

    // Update legacy stats for backward compatibility
    const problemsSolvedEl = this.container.querySelector('#ghost-problems-solved');
    const levelEl = this.container.querySelector('#ghost-level');

    if (problemsSolvedEl && this.ghostProfile.problemsSolved !== undefined) {
      problemsSolvedEl.textContent = this.ghostProfile.problemsSolved;
    }

    if (levelEl && this.ghostProfile.level !== undefined) {
      levelEl.textContent = this.ghostProfile.level;
    }
  }

  /**
   * Update class period (for filtering class view)
   * @param {string} period - Class period (A-G)
   */
  setClassPeriod(period) {
    this.classPeriod = period;
    // Refresh class view if currently active
    if (this.activeTab === 'class-view') {
      this._loadClassGhosts();
    }
  }

  /**
   * Activate class view mode
   */
  async _activateClassView() {
    // Initialize maze renderer if needed (for class view)
    if (!this.mazeInitialized && !this.mazeError) {
      await this._initMazeRenderer();
    }

    // Set class view mode on renderer
    if (this.mazeRenderer) {
      this.mazeRenderer.setClassViewMode(true);
    }

    // Load class ghosts
    await this._loadClassGhosts();
  }

  /**
   * Deactivate class view mode
   */
  _deactivateClassView() {
    if (this.mazeRenderer) {
      this.mazeRenderer.setClassViewMode(false);

      // Move canvas back to My Ghost container
      this._attachMazeToMyGhostTab();
    }
  }

  /**
   * Attach maze canvas to My Ghost tab container
   */
  _attachMazeToMyGhostTab() {
    if (!this.mazeRenderer || !this.mazeRenderer.renderer) return;

    const myGhostContainer = this.container.querySelector('#ghost-maze-container');
    const canvas = this.mazeRenderer.renderer.domElement;

    if (!myGhostContainer || !canvas) return;

    // Move canvas to My Ghost container if not already there
    if (canvas.parentElement !== myGhostContainer) {
      myGhostContainer.innerHTML = ''; // Clear loading placeholder
      myGhostContainer.appendChild(canvas);

      // Trigger resize after moving
      setTimeout(() => {
        this.mazeRenderer._handleResize();
      }, 50);
    }
  }

  /**
   * Load all ghosts for class view
   */
  async _loadClassGhosts() {
    if (!this.cartridgeId) {
      this._showClassViewError('No cartridge loaded');
      return;
    }

    this.classViewLoading = true;
    this.classViewError = null;
    this._renderClassViewContent();

    try {
      // Build URL with optional class period filter
      let url = `${this.serverUrl}/api/ghost/${this.cartridgeId}/leaderboard`;
      if (this.classPeriod) {
        url += `?class_period=${this.classPeriod}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ghosts: ${response.status}`);
      }

      const data = await response.json();
      this.classGhosts = data.ghosts || [];

      // Parse leaderboard data to add currentLevel based on proficiency
      if (this.mazeRenderer && this.mazeRenderer.nodes) {
        this.classGhosts = parseLeaderboardData(this.classGhosts, this.mazeRenderer.nodes);
      }

      // Show all ghosts in 3D view
      if (this.mazeRenderer) {
        this.mazeRenderer.showAllGhosts(this.classGhosts);
      }

      this.classViewLoading = false;
      this._renderClassViewContent();

    } catch (error) {
      console.error('[GhostPanel] Failed to load class ghosts:', error);
      this.classViewLoading = false;
      this.classViewError = error.message;
      this._renderClassViewContent();
    }
  }

  /**
   * Render class view content based on current state
   */
  _renderClassViewContent() {
    const container = this.container.querySelector('[data-tab-content="class-view"]');
    if (!container) return;

    // Loading state
    if (this.classViewLoading) {
      container.innerHTML = `
        <div class="ghost-class-view">
          <div class="ghost-maze-container" id="ghost-maze-container-class"></div>
          <div class="ghost-class-loading">
            <div class="ghost-loading-spinner"></div>
            <p>Loading class ghosts...</p>
          </div>
        </div>
      `;
      return;
    }

    // Error state
    if (this.classViewError) {
      container.innerHTML = `
        <div class="ghost-class-view">
          <div class="ghost-maze-container" id="ghost-maze-container-class"></div>
          <div class="ghost-class-error">
            <div class="ghost-placeholder-icon">⚠️</div>
            <p>${this.classViewError}</p>
            <button class="ghost-retry-btn" onclick="this.closest('.ghost-panel').dispatchEvent(new CustomEvent('retry-class-view'))">
              Retry
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Calculate class stats
    const stats = this._calculateClassStats();

    // Render full class view
    container.innerHTML = `
      <div class="ghost-class-view">
        <!-- 3D Maze Visualization (reuses the initialized renderer) -->
        <div class="ghost-maze-container" id="ghost-maze-container-class">
          ${!this.mazeInitialized ? `
            <div class="ghost-maze-loading">
              <div class="ghost-placeholder-icon">👻</div>
              <p>3D visualization loading...</p>
            </div>
          ` : ''}
        </div>

        <!-- Class Stats Summary -->
        <div class="ghost-class-stats">
          <div class="ghost-class-stat">
            <span class="ghost-class-stat-value">${stats.totalStudents}</span>
            <span class="ghost-class-stat-label">Students</span>
          </div>
          <div class="ghost-class-stat">
            <span class="ghost-class-stat-value">${stats.averageProficiency}%</span>
            <span class="ghost-class-stat-label">Avg Proficiency</span>
          </div>
          <div class="ghost-class-stat ghost-class-stat-highlight">
            <span class="ghost-class-stat-value">${stats.mostActiveStudent || '--'}</span>
            <span class="ghost-class-stat-label">Most Active</span>
          </div>
        </div>

        <!-- Ghost List -->
        <div class="ghost-class-list-header">
          <span class="ghost-list-col">Student</span>
          <span class="ghost-list-col ghost-list-col-center">Proficiency</span>
          <span class="ghost-list-col ghost-list-col-right">Interactions</span>
        </div>
        <div class="ghost-class-list" id="ghost-class-list">
          ${this._renderGhostList()}
        </div>
      </div>
    `;

    // Attach event listener for retry button
    container.addEventListener('retry-class-view', () => {
      this._loadClassGhosts();
    });

    // Move the 3D canvas to class view container if needed
    this._attachMazeToClassView();

    // Attach click handlers to ghost list items
    this._attachGhostListHandlers();
  }

  /**
   * Render the ghost list HTML
   * @returns {string} HTML string
   */
  _renderGhostList() {
    if (this.classGhosts.length === 0) {
      return `
        <div class="ghost-list-empty">
          <p>No student ghosts found for this cartridge.</p>
        </div>
      `;
    }

    // Sort by proficiency descending (already sorted from API, but ensure)
    const sorted = [...this.classGhosts].sort((a, b) =>
      (b.proficiency_score || 0) - (a.proficiency_score || 0)
    );

    return sorted.map((ghost, index) => {
      const proficiency = ((ghost.proficiency_score || 0) * 100).toFixed(0);
      const interactions = ghost.total_interactions || 0;
      const colorClass = this._getGhostColorClass(ghost.color);

      return `
        <div class="ghost-list-item" data-username="${ghost.username}" tabindex="0">
          <span class="ghost-list-rank">${index + 1}</span>
          <span class="ghost-list-indicator ${colorClass}"></span>
          <span class="ghost-list-username">@${ghost.username}</span>
          <span class="ghost-list-proficiency">${proficiency}%</span>
          <span class="ghost-list-interactions">${interactions}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Calculate class statistics
   * @returns {Object} Stats object
   */
  _calculateClassStats() {
    if (this.classGhosts.length === 0) {
      return {
        totalStudents: 0,
        averageProficiency: 0,
        mostActiveStudent: null
      };
    }

    const totalStudents = this.classGhosts.length;

    // Calculate average proficiency
    const totalProficiency = this.classGhosts.reduce((sum, g) =>
      sum + (g.proficiency_score || 0), 0);
    const averageProficiency = ((totalProficiency / totalStudents) * 100).toFixed(0);

    // Find most active student (highest interactions)
    const mostActive = this.classGhosts.reduce((max, g) =>
      (g.total_interactions || 0) > (max?.total_interactions || 0) ? g : max
    , null);

    return {
      totalStudents,
      averageProficiency,
      mostActiveStudent: mostActive?.username || null
    };
  }

  /**
   * Get CSS class for ghost color
   * @param {string} color - Ghost color name
   * @returns {string} CSS class
   */
  _getGhostColorClass(color) {
    const colorMap = {
      white: 'ghost-color-white',
      yellow: 'ghost-color-yellow',
      orange: 'ghost-color-orange',
      red: 'ghost-color-red',
      indigo: 'ghost-color-indigo'
    };
    return colorMap[color] || 'ghost-color-white';
  }

  /**
   * Attach maze canvas to class view container
   */
  _attachMazeToClassView() {
    if (!this.mazeRenderer || !this.mazeRenderer.renderer) return;

    const classContainer = this.container.querySelector('#ghost-maze-container-class');
    const myGhostContainer = this.container.querySelector('#ghost-maze-container');
    const canvas = this.mazeRenderer.renderer.domElement;

    if (!classContainer || !canvas) return;

    // Move canvas to class view container
    if (canvas.parentElement !== classContainer) {
      classContainer.appendChild(canvas);

      // Trigger resize after moving
      setTimeout(() => {
        this.mazeRenderer._handleResize();
      }, 50);
    }
  }

  /**
   * Attach click handlers to ghost list items
   */
  _attachGhostListHandlers() {
    const listItems = this.container.querySelectorAll('.ghost-list-item');
    listItems.forEach(item => {
      item.addEventListener('click', () => {
        const username = item.getAttribute('data-username');
        this._focusOnGhost(username);
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const username = item.getAttribute('data-username');
          this._focusOnGhost(username);
        }
      });
    });
  }

  /**
   * Focus camera on a specific ghost
   * @param {string} username - Ghost username
   */
  _focusOnGhost(username) {
    if (!this.mazeRenderer) return;

    // Update visual selection
    const listItems = this.container.querySelectorAll('.ghost-list-item');
    listItems.forEach(item => {
      if (item.getAttribute('data-username') === username) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    // Focus camera on ghost
    const profile = this.mazeRenderer.focusOnGhost(username);
    if (profile) {
      console.log(`[GhostPanel] Focused on ghost: ${username}`);
    }
  }

  /**
   * Show error in class view
   * @param {string} message - Error message
   */
  _showClassViewError(message) {
    this.classViewError = message;
    this.classViewLoading = false;
    this._renderClassViewContent();
  }

  // ============================================
  // BATTLE TAB METHODS
  // ============================================

  /**
   * Initialize the Battle tab - fetch rating, history, and opponents
   */
  async _initBattleTab() {
    if (!this.cartridgeId || !this.username) {
      this._showBattleError('Unable to load battle data');
      return;
    }

    this.battleDataInitialized = true;
    this._attachBattleEventListeners();

    // Initialize BattleViz
    const vizContainer = this.container.querySelector('#ghost-battle-viz-container');
    if (vizContainer && !this.battleViz) {
      this.battleViz = new BattleViz(vizContainer);
    }

    // Fetch all battle data in parallel
    try {
      await Promise.all([
        this._fetchBattleRating(),
        this._fetchBattleHistory(),
        this._fetchAvailableOpponents()
      ]);
    } catch (error) {
      console.error('[GhostPanel] Error initializing battle tab:', error);
    }
  }

  /**
   * Fetch user's battle rating
   */
  async _fetchBattleRating() {
    if (!this.cartridgeId || !this.username) return;

    try {
      const response = await fetch(
        `${this.serverUrl}/api/ghost/${this.cartridgeId}/battle/rating/${encodeURIComponent(this.username)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.battleRating = data;
      this._updateRatingDisplay();
    } catch (error) {
      console.error('[GhostPanel] Failed to fetch battle rating:', error);
      // Show default rating
      this.battleRating = {
        rating: ELO_CONFIG?.initialRating || 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        tier: { name: 'Gold', icon: 'gold' }
      };
      this._updateRatingDisplay();
    }
  }

  /**
   * Update the rating display in the UI
   */
  _updateRatingDisplay() {
    if (!this.battleRating) return;

    const ratingValue = this.container.querySelector('#battle-rating-value');
    const tierName = this.container.querySelector('#battle-tier-name');
    const tierIcon = this.container.querySelector('#battle-tier-icon');
    const tierBadge = this.container.querySelector('#battle-tier-badge');
    const record = this.container.querySelector('#battle-record');

    if (ratingValue) {
      ratingValue.textContent = this.battleRating.rating;
    }

    // Get tier from rating or use provided tier
    const tier = this.battleRating.tier || getRatingTier(this.battleRating.rating);

    if (tierName) {
      tierName.textContent = tier.name;
    }

    if (tierIcon) {
      // Use emoji icons for tiers
      const tierEmojis = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎',
        diamond: '👑'
      };
      tierIcon.textContent = tierEmojis[tier.icon] || '🏆';
    }

    if (tierBadge) {
      // Add tier class for styling
      tierBadge.className = `ghost-battle-tier-badge tier-${tier.icon}`;
    }

    if (record) {
      const wins = this.battleRating.wins || 0;
      const losses = this.battleRating.losses || 0;
      const draws = this.battleRating.draws || 0;
      record.innerHTML = `
        <span class="record-wins">${wins}W</span>
        <span class="record-losses">${losses}L</span>
        <span class="record-draws">${draws}D</span>
      `;
    }
  }

  /**
   * Fetch battle history
   */
  async _fetchBattleHistory() {
    if (!this.cartridgeId || !this.username) return;

    const historyList = this.container.querySelector('#battle-history-list');

    try {
      const response = await fetch(
        `${this.serverUrl}/api/ghost/${this.cartridgeId}/battle/history/${encodeURIComponent(this.username)}?limit=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.battleHistory = data.battles || [];
      this._renderBattleHistory();
    } catch (error) {
      console.error('[GhostPanel] Failed to fetch battle history:', error);
      if (historyList) {
        historyList.innerHTML = `
          <div class="ghost-battle-history-empty">
            <p>No battles yet. Start your first battle!</p>
          </div>
        `;
      }
    }
  }

  /**
   * Render battle history list
   */
  _renderBattleHistory() {
    const historyList = this.container.querySelector('#battle-history-list');
    if (!historyList) return;

    if (!this.battleHistory || this.battleHistory.length === 0) {
      historyList.innerHTML = `
        <div class="ghost-battle-history-empty">
          <p>No battles yet. Start your first battle!</p>
        </div>
      `;
      return;
    }

    const historyHTML = this.battleHistory.map(battle => {
      const isChallenger = battle.challenger_username === this.username;
      const opponent = isChallenger ? battle.defender_username : battle.challenger_username;
      const won = battle.winner === this.username;
      const draw = battle.winner_side === 0;

      // Calculate rating change for display
      let ratingChange = 0;
      if (isChallenger) {
        ratingChange = (battle.challenger_rating_after || 0) - (battle.challenger_rating_before || 0);
      } else {
        ratingChange = (battle.defender_rating_after || 0) - (battle.defender_rating_before || 0);
      }

      const resultClass = draw ? 'draw' : (won ? 'win' : 'loss');
      const resultText = draw ? 'DRAW' : (won ? 'WIN' : 'LOSS');
      const ratingChangeText = ratingChange >= 0 ? `+${ratingChange}` : `${ratingChange}`;
      const ratingChangeClass = ratingChange >= 0 ? 'positive' : 'negative';

      const date = new Date(battle.created_at);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return `
        <div class="ghost-battle-history-item ${resultClass}" data-battle-id="${battle.id}">
          <div class="battle-history-opponent">
            <span class="opponent-name">${opponent}</span>
            <span class="battle-date">${dateStr}</span>
          </div>
          <div class="battle-history-result">
            <span class="result-badge ${resultClass}">${resultText}</span>
            <span class="rating-change ${ratingChangeClass}">${ratingChangeText}</span>
          </div>
        </div>
      `;
    }).join('');

    historyList.innerHTML = historyHTML;

    // Add click handlers for replay
    const items = historyList.querySelectorAll('.ghost-battle-history-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const battleId = item.dataset.battleId;
        this._viewBattleReplay(battleId);
      });
    });
  }

  /**
   * Fetch available opponents for challenge
   */
  async _fetchAvailableOpponents() {
    if (!this.cartridgeId) return;

    const select = this.container.querySelector('#battle-opponent-select');
    if (!select) return;

    try {
      // Use the battle leaderboard endpoint to get users with ghosts
      const response = await fetch(
        `${this.serverUrl}/api/ghost/${this.cartridgeId}/battle/leaderboard?limit=50`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.availableOpponents = (data.rankings || []).filter(
        r => r.username !== this.username
      );
      this._renderOpponentSelect();
    } catch (error) {
      console.error('[GhostPanel] Failed to fetch opponents:', error);
      select.innerHTML = '<option value="">No opponents available</option>';
    }
  }

  /**
   * Render the opponent select dropdown
   */
  _renderOpponentSelect() {
    const select = this.container.querySelector('#battle-opponent-select');
    if (!select) return;

    if (!this.availableOpponents || this.availableOpponents.length === 0) {
      select.innerHTML = '<option value="">No opponents available</option>';
      return;
    }

    const optionsHTML = this.availableOpponents.map(opponent => {
      const tier = opponent.tier || getRatingTier(opponent.rating);
      const tierEmojis = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎',
        diamond: '👑'
      };
      const tierEmoji = tierEmojis[tier.icon] || '';
      return `<option value="${opponent.username}">${opponent.username} ${tierEmoji} (${opponent.rating})</option>`;
    }).join('');

    select.innerHTML = `
      <option value="">-- Select Opponent --</option>
      ${optionsHTML}
    `;
  }

  /**
   * Handle random battle button click
   */
  async _handleRandomBattle() {
    if (this.isBattleLoading) return;

    if (!this.cartridgeId || !this.username) return;

    const randomBtn = this.container.querySelector('#battle-random-btn');
    const spinner = this.container.querySelector('#random-spinner');

    try {
      this.isBattleLoading = true;
      if (randomBtn) randomBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');

      const response = await fetch(
        `${this.serverUrl}/api/ghost/${this.cartridgeId}/battle/challenge`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            challengeType: 'random'
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      this._handleBattleResult(result);
    } catch (error) {
      console.error('[GhostPanel] Random battle failed:', error);
      this._showBattleNotification(error.message || 'Battle failed', 'error');
    } finally {
      this.isBattleLoading = false;
      if (randomBtn) randomBtn.disabled = false;
      if (spinner) spinner.classList.add('hidden');
    }
  }

  /**
   * Handle specific challenge button click
   */
  async _handleSpecificChallenge() {
    if (this.isBattleLoading) return;

    if (!this.cartridgeId || !this.username) return;

    const select = this.container.querySelector('#battle-opponent-select');
    const opponentUsername = select?.value;
    if (!opponentUsername) return;

    const challengeBtn = this.container.querySelector('#battle-challenge-btn');
    const spinner = this.container.querySelector('#challenge-spinner');

    try {
      this.isBattleLoading = true;
      if (challengeBtn) challengeBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');

      const response = await fetch(
        `${this.serverUrl}/api/ghost/${this.cartridgeId}/battle/challenge`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            opponentUsername,
            challengeType: 'specific'
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      this._handleBattleResult(result);
    } catch (error) {
      console.error('[GhostPanel] Challenge failed:', error);
      this._showBattleNotification(error.message || 'Challenge failed', 'error');
    } finally {
      this.isBattleLoading = false;
      if (challengeBtn) challengeBtn.disabled = !select?.value;
      if (spinner) spinner.classList.add('hidden');
    }
  }

  /**
   * Handle battle result from API
   * @param {Object} result - Battle result from API
   */
  _handleBattleResult(result) {
    if (result.status !== 'complete' || !result.result) {
      this._showBattleNotification('Battle pending...', 'info');
      return;
    }

    const battleResult = result.result;
    const won = battleResult.winner === this.username;
    const draw = battleResult.winnerSide === 0;

    // Determine rating change for current user
    const isChallenger = battleResult.challenger?.username === this.username;
    const myStats = isChallenger ? battleResult.challenger : battleResult.defender;
    const ratingChange = (myStats?.ratingAfter || 0) - (myStats?.ratingBefore || 0);

    // Update local rating
    if (myStats) {
      this.battleRating = {
        ...this.battleRating,
        rating: myStats.ratingAfter,
        wins: (this.battleRating?.wins || 0) + (won ? 1 : 0),
        losses: (this.battleRating?.losses || 0) + (!won && !draw ? 1 : 0),
        draws: (this.battleRating?.draws || 0) + (draw ? 1 : 0)
      };
      this._updateRatingDisplay();
    }

    // Show result notification
    const resultText = draw ? 'Draw!' : (won ? 'Victory!' : 'Defeat!');
    const ratingText = ratingChange >= 0 ? `+${ratingChange}` : `${ratingChange}`;
    this._showBattleNotification(`${resultText} (${ratingText} rating)`, won ? 'success' : (draw ? 'info' : 'warning'));

    // Refresh battle history
    this._fetchBattleHistory();

    // Show battle replay if BattleViz is available
    if (this.battleViz && result.battleId) {
      this._viewBattleReplay(result.battleId, battleResult);
    }
  }

  /**
   * View a battle replay
   * @param {string|number} battleId - Battle ID to replay
   * @param {Object} cachedResult - Optional cached result data
   */
  async _viewBattleReplay(battleId, cachedResult = null) {
    if (!this.battleViz) {
      console.warn('[GhostPanel] BattleViz not initialized');
      return;
    }

    // If we have cached result, use it directly
    if (cachedResult && cachedResult.challenger && cachedResult.defender) {
      const challengerChange = (cachedResult.challenger.ratingAfter || 0) - (cachedResult.challenger.ratingBefore || 0);
      const defenderChange = (cachedResult.defender.ratingAfter || 0) - (cachedResult.defender.ratingBefore || 0);

      // Create mock battle data for viz (basic version without full problem sequence)
      this.battleViz.loadBattle(
        {
          winner: cachedResult.winnerSide,
          challenger: { totalTime: cachedResult.challenger.time, correctCount: cachedResult.challenger.correct },
          defender: { totalTime: cachedResult.defender.time, correctCount: cachedResult.defender.correct },
          problems: [] // Full replay needs battle log
        },
        cachedResult.challenger.username,
        cachedResult.defender.username,
        { challengerChange, defenderChange }
      );
      return;
    }

    // Otherwise fetch full battle details
    if (!this.cartridgeId) return;

    try {
      const response = await fetch(
        `${this.serverUrl}/api/ghost/${this.cartridgeId}/battle/${battleId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const battle = await response.json();

      // Load into BattleViz
      const challengerChange = (battle.challenger_rating_after || 0) - (battle.challenger_rating_before || 0);
      const defenderChange = (battle.defender_rating_after || 0) - (battle.defender_rating_before || 0);

      // Parse battle log if available
      const battleLog = battle.battle_log || {};

      this.battleViz.loadBattle(
        {
          winner: battle.winner_side,
          challenger: { totalTime: battle.challenger_time, correctCount: battle.challenger_correct },
          defender: { totalTime: battle.defender_time, correctCount: battle.defender_correct },
          problems: battleLog.problems || []
        },
        battle.challenger_username,
        battle.defender_username,
        { challengerChange, defenderChange }
      );
    } catch (error) {
      console.error('[GhostPanel] Failed to load battle replay:', error);
      this._showBattleNotification('Failed to load replay', 'error');
    }
  }

  /**
   * Show a battle notification/toast
   * @param {string} message - Message to display
   * @param {string} type - 'success', 'error', 'warning', 'info'
   */
  _showBattleNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `ghost-battle-notification ${type}`;
    notification.textContent = message;

    // Add to panel content
    const content = this.container.querySelector('.ghost-panel-content');
    if (content) {
      content.insertBefore(notification, content.firstChild);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  }

  /**
   * Show error message in battle tab
   * @param {string} message - Error message
   */
  _showBattleError(message) {
    const battleContent = this.container.querySelector('[data-tab-content="battle"]');
    if (battleContent) {
      battleContent.innerHTML = `
        <div class="ghost-placeholder">
          <div class="ghost-placeholder-icon">⚠️</div>
          <h4>Battle Unavailable</h4>
          <p>${message}</p>
        </div>
      `;
    }
  }

  /**
   * Get display name for a level ID
   * @param {string} levelId - Level/mode ID
   * @returns {string} Display name or abbreviated ID
   */
  _getLevelDisplayName(levelId) {
    if (!levelId) return null;

    // Try to find the mode name from manifest
    if (this.manifest && this.manifest.modes) {
      const mode = this.manifest.modes.find(m => m.id === levelId);
      if (mode && mode.name) {
        // Extract shortened name (e.g., "4.1a" from "4.1a: Random Process Definition")
        const colonIndex = mode.name.indexOf(':');
        if (colonIndex > 0) {
          return mode.name.substring(0, colonIndex);
        }
        // Truncate if too long
        return mode.name.length > 15 ? mode.name.substring(0, 12) + '...' : mode.name;
      }
    }

    // Fall back to showing the ID in a readable format
    return levelId.replace(/-/g, ' ').replace(/^l(\d+)/, 'Level $1');
  }

  /**
   * Initialize the 3D maze renderer
   */
  async _initMazeRenderer() {
    // Use the appropriate container based on active tab
    const containerId = this.activeTab === 'class-view'
      ? '#ghost-maze-container-class'
      : '#ghost-maze-container';
    const container = this.container.querySelector(containerId);
    if (!container) {
      console.warn('[GhostPanel] Maze container not found:', containerId);
      return;
    }

    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
      this._showMazeError('3D visualization unavailable', 'Three.js library not loaded');
      this.mazeError = new Error('Three.js not loaded');
      return;
    }

    // Check for valid manifest
    if (!this.manifest || !this.manifest.modes || this.manifest.modes.length === 0) {
      this._showMazeError('3D visualization unavailable', 'No cartridge loaded');
      this.mazeError = new Error('No manifest');
      return;
    }

    try {
      // Show loading state
      container.innerHTML = `
        <div class="ghost-maze-loading">
          <div class="ghost-loading-spinner"></div>
          <p>Initializing 3D maze...</p>
        </div>
      `;

      // Create maze renderer
      this.mazeRenderer = new MazeRenderer(container, this.manifest, this.playerProgress);

      // Listen for maze events
      container.addEventListener('maze-ready', () => {
        console.log('[GhostPanel] Maze renderer ready');

        // Update ghost position if we have a profile
        if (this.ghostProfile) {
          this.mazeRenderer.updateGhost(this.ghostProfile);
        }
      });

      container.addEventListener('maze-error', (event) => {
        console.error('[GhostPanel] Maze error:', event.detail.error);
        this._showMazeError('3D visualization unavailable', event.detail.error.message);
        this.mazeError = event.detail.error;
      });

      container.addEventListener('maze-node-selected', (event) => {
        console.log('[GhostPanel] Node selected:', event.detail.nodeId);
        // Could be used to navigate to that level
      });

      // Initialize the renderer
      await this.mazeRenderer.init();
      this.mazeInitialized = true;

    } catch (error) {
      console.error('[GhostPanel] Failed to initialize maze renderer:', error);
      this._showMazeError('3D visualization unavailable', error.message);
      this.mazeError = error;
    }
  }

  /**
   * Show error message in maze container
   * @param {string} title - Error title
   * @param {string} message - Error details
   */
  _showMazeError(title, message) {
    const container = this.container.querySelector('#ghost-maze-container');
    if (!container) return;

    container.innerHTML = `
      <div class="ghost-maze-error">
        <div class="ghost-placeholder-icon">⚠️</div>
        <h4>${title}</h4>
        <p>${message || 'Please try reloading the page.'}</p>
      </div>
    `;
  }

  /**
   * Add styles for the panel
   */
  _addStyles() {
    if (document.getElementById('ghost-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'ghost-panel-styles';
    style.textContent = `
      .ghost-panel {
        position: fixed;
        top: 0;
        right: -400px;
        width: 380px;
        height: 100vh;
        background: #0d1117;
        border-left: 1px solid #00d4ff33;
        box-shadow: -4px 0 20px rgba(0, 212, 255, 0.1);
        z-index: 1000;
        transition: right 0.3s ease-in-out;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }

      .ghost-panel.visible {
        right: 0;
      }

      .ghost-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #00d4ff33;
        background: linear-gradient(180deg, #1a1f2e 0%, #0d1117 100%);
      }

      .ghost-panel-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #00d4ff;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ghost-panel-title::before {
        content: '👻';
      }

      .ghost-panel-close {
        background: transparent;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: color 0.2s;
      }

      .ghost-panel-close:hover {
        color: #00d4ff;
      }

      .ghost-panel-tabs {
        display: flex;
        border-bottom: 1px solid #00d4ff33;
        background: #161b22;
      }

      .ghost-tab {
        flex: 1;
        padding: 12px 16px;
        background: transparent;
        border: none;
        color: #9ca3af;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .ghost-tab:hover {
        color: #f9fafb;
        background: rgba(0, 212, 255, 0.05);
      }

      .ghost-tab.active {
        color: #00d4ff;
        background: rgba(0, 212, 255, 0.1);
      }

      .ghost-tab.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #00d4ff;
      }

      .ghost-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .ghost-tab-content {
        display: block;
      }

      .ghost-tab-content.hidden {
        display: none;
      }

      .ghost-placeholder {
        text-align: center;
        padding: 20px;
      }

      .ghost-placeholder-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.8;
      }

      .ghost-placeholder h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #f9fafb;
      }

      .ghost-placeholder p {
        margin: 0 0 20px 0;
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.5;
      }

      .ghost-stats {
        display: flex;
        gap: 16px;
        justify-content: center;
        margin-top: 24px;
      }

      .ghost-stat {
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-radius: 8px;
        padding: 16px 24px;
        text-align: center;
      }

      .ghost-stat-label {
        display: block;
        font-size: 11px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .ghost-stat-value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: #00d4ff;
      }

      .ghost-battle-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 20px 0;
      }

      .ghost-battle-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-radius: 8px;
        color: #f9fafb;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ghost-battle-btn:hover:not(:disabled) {
        background: rgba(0, 212, 255, 0.1);
        border-color: #00d4ff;
      }

      .ghost-battle-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .battle-icon {
        font-size: 20px;
      }

      .ghost-coming-soon {
        color: #6b7280;
        font-style: italic;
        font-size: 13px;
      }

      /* 3D Maze Container */
      .ghost-maze-container {
        width: 100%;
        height: 300px;
        background: #0a0a12;
        border: 1px solid #00d4ff33;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        margin-bottom: 16px;
      }

      .ghost-maze-container canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
      }

      .ghost-maze-loading,
      .ghost-maze-error {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 20px;
      }

      .ghost-maze-loading p,
      .ghost-maze-error p {
        color: #9ca3af;
        font-size: 13px;
        margin: 8px 0 0 0;
      }

      .ghost-maze-error h4 {
        color: #f9fafb;
        margin: 8px 0;
        font-size: 14px;
      }

      .ghost-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #00d4ff33;
        border-top-color: #00d4ff;
        border-radius: 50%;
        animation: ghost-spin 1s linear infinite;
      }

      @keyframes ghost-spin {
        to { transform: rotate(360deg); }
      }

      /* Stats Panel below 3D view */
      .ghost-stats-panel {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .ghost-stats-panel .ghost-stat {
        flex: 1;
        min-width: 90px;
        max-width: 120px;
      }

      .ghost-stat-level {
        font-size: 16px !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
      }

      /* Scrollbar styling */
      .ghost-panel-content::-webkit-scrollbar {
        width: 6px;
      }

      .ghost-panel-content::-webkit-scrollbar-track {
        background: #161b22;
      }

      .ghost-panel-content::-webkit-scrollbar-thumb {
        background: #00d4ff33;
        border-radius: 3px;
      }

      .ghost-panel-content::-webkit-scrollbar-thumb:hover {
        background: #00d4ff66;
      }

      /* Class View Styles */
      .ghost-class-view {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      #ghost-maze-container-class {
        width: 100%;
        height: 250px;
        background: #0a0a12;
        border: 1px solid #00d4ff33;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
      }

      #ghost-maze-container-class canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
      }

      .ghost-class-stats {
        display: flex;
        gap: 12px;
        justify-content: space-between;
      }

      .ghost-class-stat {
        flex: 1;
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
      }

      .ghost-class-stat-value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: #00d4ff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ghost-class-stat-label {
        display: block;
        font-size: 10px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .ghost-class-stat-highlight .ghost-class-stat-value {
        color: #00ff88;
      }

      .ghost-class-list-header {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-radius: 8px 8px 0 0;
        font-size: 11px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .ghost-list-col {
        flex: 1;
      }

      .ghost-list-col-center {
        text-align: center;
      }

      .ghost-list-col-right {
        text-align: right;
      }

      .ghost-class-list {
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-top: none;
        border-radius: 0 0 8px 8px;
        max-height: 200px;
        overflow-y: auto;
      }

      .ghost-list-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid #00d4ff1a;
        cursor: pointer;
        transition: background 0.15s;
      }

      .ghost-list-item:last-child {
        border-bottom: none;
      }

      .ghost-list-item:hover {
        background: rgba(0, 212, 255, 0.08);
      }

      .ghost-list-item:focus {
        outline: none;
        background: rgba(0, 212, 255, 0.1);
      }

      .ghost-list-item.selected {
        background: rgba(0, 212, 255, 0.15);
        border-left: 3px solid #00d4ff;
      }

      .ghost-list-rank {
        width: 24px;
        font-size: 12px;
        color: #6b7280;
        font-weight: 600;
      }

      .ghost-list-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 10px;
        box-shadow: 0 0 6px currentColor;
      }

      .ghost-color-white {
        background: #ffffff;
        color: #ffffff;
      }

      .ghost-color-yellow {
        background: #ffff44;
        color: #ffff44;
      }

      .ghost-color-orange {
        background: #ff8844;
        color: #ff8844;
      }

      .ghost-color-red {
        background: #ff4444;
        color: #ff4444;
      }

      .ghost-color-indigo {
        background: #8844ff;
        color: #8844ff;
      }

      .ghost-list-username {
        flex: 1;
        font-size: 13px;
        color: #f9fafb;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ghost-list-proficiency {
        width: 60px;
        text-align: center;
        font-size: 13px;
        color: #00d4ff;
        font-weight: 600;
      }

      .ghost-list-interactions {
        width: 60px;
        text-align: right;
        font-size: 13px;
        color: #9ca3af;
      }

      .ghost-list-empty {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-size: 13px;
      }

      .ghost-class-loading,
      .ghost-class-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }

      .ghost-class-loading p,
      .ghost-class-error p {
        color: #9ca3af;
        font-size: 13px;
        margin: 8px 0 0 0;
      }

      .ghost-retry-btn {
        margin-top: 12px;
        padding: 8px 16px;
        background: #00d4ff22;
        border: 1px solid #00d4ff66;
        border-radius: 6px;
        color: #00d4ff;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ghost-retry-btn:hover {
        background: #00d4ff33;
        border-color: #00d4ff;
      }

      /* Class list scrollbar */
      .ghost-class-list::-webkit-scrollbar {
        width: 6px;
      }

      .ghost-class-list::-webkit-scrollbar-track {
        background: #161b22;
      }

      .ghost-class-list::-webkit-scrollbar-thumb {
        background: #00d4ff33;
        border-radius: 3px;
      }

      .ghost-class-list::-webkit-scrollbar-thumb:hover {
        background: #00d4ff66;
      }

      /* ========================================
         BATTLE TAB STYLES
         ======================================== */

      .ghost-battle-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* Rating Display Section */
      .ghost-battle-rating-section {
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .ghost-battle-rating-display {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ghost-battle-tier-badge {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%);
        border: 2px solid #00d4ff33;
      }

      .ghost-battle-tier-badge.tier-bronze {
        background: linear-gradient(135deg, #cd7f32 0%, #8b4513 100%);
        border-color: #cd7f32;
      }

      .ghost-battle-tier-badge.tier-silver {
        background: linear-gradient(135deg, #c0c0c0 0%, #808080 100%);
        border-color: #c0c0c0;
      }

      .ghost-battle-tier-badge.tier-gold {
        background: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
        border-color: #ffd700;
      }

      .ghost-battle-tier-badge.tier-platinum {
        background: linear-gradient(135deg, #e5e4e2 0%, #8b8b8b 100%);
        border-color: #e5e4e2;
      }

      .ghost-battle-tier-badge.tier-diamond {
        background: linear-gradient(135deg, #b9f2ff 0%, #00d4ff 100%);
        border-color: #00d4ff;
      }

      .ghost-battle-rating-info {
        display: flex;
        flex-direction: column;
      }

      .ghost-battle-rating-value {
        font-size: 28px;
        font-weight: 700;
        color: #f9fafb;
        line-height: 1;
      }

      .ghost-battle-tier-name {
        font-size: 13px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .ghost-battle-record {
        display: flex;
        gap: 12px;
        font-size: 13px;
        font-weight: 600;
      }

      .record-wins {
        color: #22c55e;
      }

      .record-losses {
        color: #ef4444;
      }

      .record-draws {
        color: #9ca3af;
      }

      /* Battle Actions Section */
      .ghost-battle-actions {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .ghost-battle-random {
        justify-content: center;
        background: linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%);
        border-color: #00d4ff66;
      }

      .ghost-battle-random:hover:not(:disabled) {
        background: linear-gradient(135deg, #2a2f4e 0%, #1d1f27 100%);
        border-color: #00d4ff;
        box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
      }

      .ghost-battle-challenge-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ghost-battle-label {
        font-size: 12px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .ghost-battle-challenge-row {
        display: flex;
        gap: 8px;
      }

      .ghost-battle-select {
        flex: 1;
        padding: 12px 14px;
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-radius: 8px;
        color: #f9fafb;
        font-size: 14px;
        cursor: pointer;
        outline: none;
      }

      .ghost-battle-select:focus {
        border-color: #00d4ff;
      }

      .ghost-battle-select option {
        background: #161b22;
        color: #f9fafb;
      }

      .ghost-battle-challenge {
        padding: 12px 16px;
        white-space: nowrap;
      }

      .battle-btn-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #00d4ff33;
        border-top-color: #00d4ff;
        border-radius: 50%;
        animation: ghost-spin 0.8s linear infinite;
        margin-left: 8px;
      }

      .battle-btn-spinner.hidden {
        display: none;
      }

      /* Battle History Section */
      .ghost-battle-history-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ghost-battle-history-title {
        margin: 0;
        font-size: 14px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .ghost-battle-history-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 240px;
        overflow-y: auto;
      }

      .ghost-battle-history-loading,
      .ghost-battle-history-empty {
        text-align: center;
        padding: 20px;
        color: #9ca3af;
        font-size: 13px;
      }

      .ghost-battle-history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        background: #161b22;
        border: 1px solid #00d4ff22;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ghost-battle-history-item:hover {
        background: rgba(0, 212, 255, 0.05);
        border-color: #00d4ff44;
      }

      .ghost-battle-history-item.win {
        border-left: 3px solid #22c55e;
      }

      .ghost-battle-history-item.loss {
        border-left: 3px solid #ef4444;
      }

      .ghost-battle-history-item.draw {
        border-left: 3px solid #9ca3af;
      }

      .battle-history-opponent {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .opponent-name {
        font-size: 14px;
        color: #f9fafb;
        font-weight: 500;
      }

      .battle-date {
        font-size: 11px;
        color: #6b7280;
      }

      .battle-history-result {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .result-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .result-badge.win {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      .result-badge.loss {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .result-badge.draw {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
      }

      .rating-change {
        font-size: 13px;
        font-weight: 600;
      }

      .rating-change.positive {
        color: #22c55e;
      }

      .rating-change.negative {
        color: #ef4444;
      }

      /* Battle Notifications */
      .ghost-battle-notification {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        text-align: center;
        animation: slide-in 0.3s ease-out;
      }

      .ghost-battle-notification.success {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid #22c55e;
        color: #22c55e;
      }

      .ghost-battle-notification.error {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        color: #ef4444;
      }

      .ghost-battle-notification.warning {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid #f59e0b;
        color: #f59e0b;
      }

      .ghost-battle-notification.info {
        background: rgba(0, 212, 255, 0.15);
        border: 1px solid #00d4ff;
        color: #00d4ff;
      }

      .ghost-battle-notification.fade-out {
        opacity: 0;
        transition: opacity 0.3s ease-out;
      }

      @keyframes slide-in {
        from {
          transform: translateY(-10px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Battle history scrollbar */
      .ghost-battle-history-list::-webkit-scrollbar {
        width: 6px;
      }

      .ghost-battle-history-list::-webkit-scrollbar-track {
        background: #161b22;
      }

      .ghost-battle-history-list::-webkit-scrollbar-thumb {
        background: #00d4ff33;
        border-radius: 3px;
      }

      .ghost-battle-history-list::-webkit-scrollbar-thumb:hover {
        background: #00d4ff66;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Create a toolbar button that toggles the Ghost panel
 * @returns {HTMLButtonElement} The ghost button element
 */
export function createGhostButton() {
  const button = document.createElement('button');
  button.className = 'ghost-toolbar-btn';
  button.innerHTML = '👻';
  button.title = 'Ghost Mode';
  button.setAttribute('aria-label', 'Toggle Ghost panel');

  // Add button styles if not present
  if (!document.getElementById('ghost-button-styles')) {
    const style = document.createElement('style');
    style.id = 'ghost-button-styles';
    style.textContent = `
      .ghost-toolbar-btn {
        background: #161b22;
        border: 1px solid #00d4ff33;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ghost-toolbar-btn:hover {
        background: rgba(0, 212, 255, 0.1);
        border-color: #00d4ff;
        transform: scale(1.05);
      }

      .ghost-toolbar-btn:active {
        transform: scale(0.95);
      }

      .ghost-toolbar-btn.active {
        background: rgba(0, 212, 255, 0.2);
        border-color: #00d4ff;
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  return button;
}

export default GhostPanel;
