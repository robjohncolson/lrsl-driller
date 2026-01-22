/**
 * Game Mode Manager
 *
 * Orchestrates switching between different competitive game modes (CTF, KotH).
 * Each game mode has its own state, panel, and renderer that implement a common interface.
 */

import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';
import { CTFPanel } from './ctf-panel.js';

export class GameModeManager {
  constructor(container, serverUrl) {
    this.container = container;
    this.serverUrl = serverUrl;

    // Current settings
    this.cartridgeId = null;
    this.username = null;
    this.isTeacher = false;
    this.userClassPeriod = null;
    this.teacherPassword = null;

    // Current mode
    this.currentMode = GAME_MODE_CONFIG.defaults.gameMode;
    this.currentTiebreakerType = GAME_MODE_CONFIG.defaults.tiebreakerType;

    // Active panel instance
    this.activePanel = null;

    // Mode panels cache
    this.panels = {
      ctf: null,
      koth: null
    };

    // Callbacks
    this.onModeChange = null;
    this.onTiebreakerTypeChange = null;

    // Lazy-load KotHPanel to avoid circular dependencies
    this.KotHPanel = null;
  }

  /**
   * Initialize for a cartridge
   */
  async init(cartridgeId, username, isTeacher = false, userClassPeriod = null, teacherPassword = null) {
    this.cartridgeId = cartridgeId;
    this.username = username;
    this.isTeacher = isTeacher;
    this.userClassPeriod = userClassPeriod;
    this.teacherPassword = teacherPassword;

    // Fetch current game mode settings from server
    try {
      const settings = await this._fetchSettings();
      this.currentMode = settings.gameMode || GAME_MODE_CONFIG.defaults.gameMode;
      this.currentTiebreakerType = settings.tiebreakerType || GAME_MODE_CONFIG.defaults.tiebreakerType;
    } catch (err) {
      console.warn('Failed to fetch game mode settings, using defaults:', err);
    }

    // Initialize the active game mode panel
    await this._activateMode(this.currentMode);

    return this.activePanel;
  }

  /**
   * Fetch current game mode settings from server
   */
  async _fetchSettings() {
    const period = this.isTeacher ? (this.userClassPeriod || 'A') : this.userClassPeriod;
    if (!period) {
      return {
        gameMode: GAME_MODE_CONFIG.defaults.gameMode,
        tiebreakerType: GAME_MODE_CONFIG.defaults.tiebreakerType
      };
    }

    const url = new URL(`${this.serverUrl}/api/game-mode/${this.cartridgeId}/settings`);
    url.searchParams.set('class_period', period);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch game mode settings');
    }

    return response.json();
  }

  /**
   * Update game mode settings on server
   */
  async _saveSettings(gameMode, tiebreakerType) {
    const period = this.isTeacher ? (this.userClassPeriod || 'A') : this.userClassPeriod;
    if (!period) {
      throw new Error('Class period required to save settings');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (this.teacherPassword) {
      headers['x-teacher-password'] = this.teacherPassword;
    }

    const response = await fetch(`${this.serverUrl}/api/game-mode/${this.cartridgeId}/settings?class_period=${period}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        game_mode: gameMode,
        tiebreaker_type: tiebreakerType
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save settings');
    }

    return response.json();
  }

  /**
   * Switch to a different game mode
   */
  async switchMode(mode) {
    if (!GAME_MODE_CONFIG.modes[mode.toUpperCase()]) {
      throw new Error(`Invalid game mode: ${mode}`);
    }

    if (mode === this.currentMode) return;

    // Cleanup current panel
    if (this.activePanel && this.activePanel.destroy) {
      this.activePanel.destroy();
    }

    // Save new settings if teacher
    if (this.isTeacher) {
      try {
        await this._saveSettings(mode, this.currentTiebreakerType);
      } catch (err) {
        console.error('Failed to save game mode:', err);
      }
    }

    this.currentMode = mode;
    await this._activateMode(mode);

    if (this.onModeChange) {
      this.onModeChange(mode);
    }
  }

  /**
   * Switch tiebreaker type
   */
  async switchTiebreakerType(type) {
    if (!Object.values(GAME_MODE_CONFIG.tiebreakers).includes(type)) {
      throw new Error(`Invalid tiebreaker type: ${type}`);
    }

    if (type === this.currentTiebreakerType) return;

    // Save new settings if teacher
    if (this.isTeacher) {
      try {
        await this._saveSettings(this.currentMode, type);
      } catch (err) {
        console.error('Failed to save tiebreaker type:', err);
      }
    }

    this.currentTiebreakerType = type;

    if (this.onTiebreakerTypeChange) {
      this.onTiebreakerTypeChange(type);
    }
  }

  /**
   * Activate a game mode panel
   */
  async _activateMode(mode) {
    // Clear container
    this.container.innerHTML = '';

    // Add teacher mode/tiebreaker selector if teacher
    if (this.isTeacher) {
      this._renderModeSelector();
    }

    // Create sub-container for the panel
    const panelContainer = document.createElement('div');
    panelContainer.id = 'game-mode-panel-container';
    this.container.appendChild(panelContainer);

    if (mode === 'ctf') {
      // Use existing CTFPanel
      if (!this.panels.ctf) {
        this.panels.ctf = new CTFPanel(panelContainer, this.serverUrl);
      } else {
        // Re-render in new container
        this.panels.ctf.container = panelContainer;
        this.panels.ctf._render();
      }

      this.activePanel = this.panels.ctf;
      // v4.3.4: Pass teacherPassword for authenticated actions
      await this.activePanel.init(
        this.cartridgeId,
        this.username,
        this.isTeacher,
        this.userClassPeriod,
        this.teacherPassword
      );
    } else if (mode === 'koth') {
      // Lazy-load KotHPanel
      if (!this.KotHPanel) {
        const module = await import('./koth-panel.js');
        this.KotHPanel = module.KotHPanel;
      }

      if (!this.panels.koth) {
        this.panels.koth = new this.KotHPanel(panelContainer, this.serverUrl);
      } else {
        this.panels.koth.container = panelContainer;
        this.panels.koth._render();
      }

      this.activePanel = this.panels.koth;
      // v4.3.4: Pass teacherPassword for authenticated actions
      await this.activePanel.init(
        this.cartridgeId,
        this.username,
        this.isTeacher,
        this.userClassPeriod,
        this.teacherPassword
      );
    }

    return this.activePanel;
  }

  /**
   * Render the game mode and tiebreaker selector (teacher only)
   */
  _renderModeSelector() {
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'game-mode-selector';
    selectorDiv.innerHTML = `
      <div class="mode-selector-row">
        <label>
          Game Mode:
          <select id="game-mode-select">
            <option value="ctf" ${this.currentMode === 'ctf' ? 'selected' : ''}>
              ${GAME_MODE_CONFIG.labels.modes.ctf}
            </option>
            <option value="koth" ${this.currentMode === 'koth' ? 'selected' : ''}>
              ${GAME_MODE_CONFIG.labels.modes.koth}
            </option>
          </select>
        </label>
        <label>
          Tiebreaker:
          <select id="tiebreaker-select">
            <option value="pong" ${this.currentTiebreakerType === 'pong' ? 'selected' : ''}>
              ${GAME_MODE_CONFIG.labels.tiebreakers.pong}
            </option>
            <option value="quick_calc" ${this.currentTiebreakerType === 'quick_calc' ? 'selected' : ''}>
              ${GAME_MODE_CONFIG.labels.tiebreakers.quick_calc}
            </option>
            <option value="reflex_duel" ${this.currentTiebreakerType === 'reflex_duel' ? 'selected' : ''}>
              ${GAME_MODE_CONFIG.labels.tiebreakers.reflex_duel}
            </option>
          </select>
        </label>
      </div>
    `;

    // Add styles
    this._addModeSelectorStyles();

    // Add event listeners
    const modeSelect = selectorDiv.querySelector('#game-mode-select');
    const tiebreakerSelect = selectorDiv.querySelector('#tiebreaker-select');

    modeSelect.addEventListener('change', (e) => {
      this.switchMode(e.target.value);
    });

    tiebreakerSelect.addEventListener('change', (e) => {
      this.switchTiebreakerType(e.target.value);
    });

    this.container.appendChild(selectorDiv);
  }

  /**
   * Add CSS styles for mode selector
   */
  _addModeSelectorStyles() {
    if (document.getElementById('game-mode-selector-styles')) return;

    const style = document.createElement('style');
    style.id = 'game-mode-selector-styles';
    style.textContent = `
      .game-mode-selector {
        background: #374151;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 10px;
      }

      .mode-selector-row {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }

      .game-mode-selector label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #d1d5db;
        font-size: 13px;
      }

      .game-mode-selector select {
        background: #1f2937;
        color: #f9fafb;
        border: 1px solid #4b5563;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 13px;
        cursor: pointer;
      }

      .game-mode-selector select:hover {
        border-color: #6b7280;
      }

      .game-mode-selector select:focus {
        outline: none;
        border-color: #3b82f6;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle WebSocket message
   * Routes to the appropriate panel based on message type
   */
  handleMessage(message) {
    // Route CTF messages
    if (message.type?.startsWith('ctf_') && this.panels.ctf) {
      this.panels.ctf.handleMessage(message);
    }

    // Route KotH messages
    if (message.type?.startsWith('koth_') && this.panels.koth) {
      this.panels.koth.handleMessage(message);
    }

    // Route game mode setting changes
    if (message.type === 'game_mode_changed') {
      if (message.cartridgeId === this.cartridgeId &&
          message.classPeriod === this.userClassPeriod) {
        this.currentMode = message.gameMode;
        this.currentTiebreakerType = message.tiebreakerType;
        this._activateMode(message.gameMode);
      }
    }
  }

  /**
   * Add points from a star (delegates to active panel)
   */
  async addPoints(points, starType) {
    if (this.activePanel && typeof this.activePanel.addPoints === 'function') {
      return this.activePanel.addPoints(points, starType);
    }
    return null;
  }

  /**
   * Set available users for team assignment (delegates to active panel)
   */
  setAvailableUsers(users) {
    if (this.activePanel && typeof this.activePanel.setAvailableUsers === 'function') {
      this.activePanel.setAvailableUsers(users);
    }
  }

  /**
   * Set online users (delegates to active panel for filtering)
   */
  setOnlineUsers(usernames) {
    if (this.activePanel && typeof this.activePanel.setOnlineUsers === 'function') {
      this.activePanel.setOnlineUsers(usernames);
    }
  }

  /**
   * Get current game mode
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Get current tiebreaker type
   */
  getTiebreakerType() {
    return this.currentTiebreakerType;
  }

  /**
   * Get display label for current mode
   */
  getModeLabel() {
    return GAME_MODE_CONFIG.labels.modes[this.currentMode] || this.currentMode;
  }

  /**
   * Get display label for current tiebreaker
   */
  getTiebreakerLabel() {
    return GAME_MODE_CONFIG.labels.tiebreakers[this.currentTiebreakerType] || this.currentTiebreakerType;
  }

  /**
   * Check if points can be added in current mode
   */
  canAddPoints() {
    if (this.activePanel && typeof this.activePanel.canAddPoints === 'function') {
      return this.activePanel.canAddPoints();
    }
    // Default: check state if available
    if (this.activePanel?.state?.canAddPoints) {
      return this.activePanel.state.canAddPoints();
    }
    return true;
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.panels.ctf?.destroy) {
      this.panels.ctf.destroy();
    }
    if (this.panels.koth?.destroy) {
      this.panels.koth.destroy();
    }
    this.panels = { ctf: null, koth: null };
    this.activePanel = null;
  }
}
