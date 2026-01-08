/**
 * Grid Wars Panel UI
 * Provides a collapsible panel for viewing action points and building
 */

import { GridWarsState, GRID_WARS_CONFIG } from './grid-state.js';
import { GridRenderer } from './grid-renderer.js';

export class GridPanel {
  constructor(options = {}) {
    this.container = options.container || null;
    this.serverUrl = options.serverUrl || null;
    this.username = options.username || null;
    this.onError = options.onError || console.error;

    // State
    this.state = null;
    this.renderer = null;
    this.isExpanded = false;
    this.selectedCell = null;
    this.selectedAction = null;

    // Callbacks
    this.onPointsChange = options.onPointsChange || null;
  }

  /**
   * Initialize the Grid Wars panel
   */
  async init(username) {
    this.username = username;

    // Create state manager
    this.state = new GridWarsState({
      serverUrl: this.serverUrl,
      username: this.username,
      onStateChange: () => this.render(),
      onError: this.onError,
      onPointsEarned: (data) => {
        if (this.onPointsChange) {
          this.onPointsChange(data);
        }
      }
    });

    try {
      await this.state.init();
      this.createUI();
      return true;
    } catch (err) {
      console.error('GridPanel init error:', err);
      // Don't throw - Grid Wars is optional feature
      return false;
    }
  }

  /**
   * Set the container element
   */
  setContainer(container) {
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
      console.log('[GridPanel] setContainer:', container, '-> found:', this.container);
    } else {
      this.container = container;
      console.log('[GridPanel] setContainer (element):', this.container);
    }
  }

  /**
   * Create the panel UI
   */
  createUI() {
    console.log('[GridPanel] createUI called, container:', this.container);
    if (!this.container) {
      console.warn('[GridPanel] No container - UI not created');
      return;
    }

    this.container.innerHTML = `
      <div class="grid-wars-panel bg-gray-900 text-green-400 font-mono rounded-lg overflow-hidden border border-green-800 shadow-lg">
        <!-- Header (always visible) -->
        <div class="grid-wars-header flex items-center justify-between px-3 py-2 bg-gray-800 cursor-pointer hover:bg-gray-750" id="gw-toggle">
          <div class="flex items-center gap-2">
            <span class="text-lg">🎮</span>
            <span class="font-bold text-green-400">GRID WARS</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <span class="text-cyan-400">⚡</span>
              <span id="gw-points-display" class="font-bold text-cyan-300">0</span>
            </div>
            <span id="gw-expand-icon" class="text-gray-400">▼</span>
          </div>
        </div>

        <!-- Expandable content -->
        <div id="gw-content" class="hidden">
          <!-- Mini Grid -->
          <div class="p-2 bg-gray-950">
            <div class="aspect-square max-w-full mx-auto bg-black border border-green-900 rounded overflow-hidden">
              <canvas id="gw-canvas" class="w-full h-full"></canvas>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="px-3 py-2 bg-gray-800 space-y-2">
            <div class="text-xs text-gray-400 uppercase tracking-wide">Build Actions</div>
            <div class="grid grid-cols-3 gap-1">
              <button class="gw-action-btn" data-action="claim" data-cost="1">
                □ Claim<span class="gw-cost">1⚡</span>
              </button>
              <button class="gw-action-btn" data-action="wall" data-cost="2">
                ■ Wall<span class="gw-cost">2⚡</span>
              </button>
              <button class="gw-action-btn" data-action="tower" data-cost="3">
                ▲ Tower<span class="gw-cost">3⚡</span>
              </button>
              <button class="gw-action-btn gw-btn-cyan" data-action="farm" data-cost="4">
                ◇ Farm<span class="gw-cost">4⚡</span>
              </button>
              <button class="gw-action-btn gw-btn-amber" data-action="castle" data-cost="10">
                ★ Castle<span class="gw-cost">10⚡</span>
              </button>
            </div>
          </div>

          <!-- Status -->
          <div class="px-3 py-2 text-xs text-gray-500 border-t border-gray-700">
            <span id="gw-status">Click grid to select, then click action</span>
          </div>
        </div>
      </div>

      <style>
        .gw-action-btn {
          background: transparent;
          border: 1px solid #1a4a2a;
          color: #00ff41;
          padding: 0.375rem 0.5rem;
          font-family: inherit;
          font-size: 0.625rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
        }
        .gw-action-btn:hover:not(:disabled) {
          border-color: #00ff41;
          background: rgba(0, 255, 65, 0.1);
          box-shadow: 0 0 10px #00ff4140;
        }
        .gw-action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .gw-action-btn.selected {
          border-color: #00ffff;
          background: rgba(0, 255, 255, 0.2);
        }
        .gw-btn-cyan {
          border-color: #00ffff40;
          color: #00ffff;
        }
        .gw-btn-amber {
          border-color: #ffbf0040;
          color: #ffbf00;
        }
        .gw-cost {
          font-size: 0.5rem;
          opacity: 0.7;
        }
        .grid-wars-panel {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
      </style>
    `;

    this.setupEventListeners();
    this.initCanvas();
    this.updateButtonStates();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle expand/collapse
    const toggle = this.container.querySelector('#gw-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggleExpand());
    }

    // Action buttons
    this.container.querySelectorAll('.gw-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.selectAction(action);
      });
    });
  }

  /**
   * Initialize the canvas renderer
   */
  initCanvas() {
    const canvas = this.container.querySelector('#gw-canvas');
    if (!canvas) return;

    // Set canvas size
    const container = canvas.parentElement;
    const size = Math.min(container.offsetWidth, 300);
    canvas.width = size;
    canvas.height = size;

    this.renderer = new GridRenderer(canvas, {
      gridSize: 20,
      cellSize: size / 20
    });

    // Mouse events on canvas
    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));

    // Initial render
    this.syncRendererState();
  }

  /**
   * Toggle panel expansion
   */
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const content = this.container.querySelector('#gw-content');
    const icon = this.container.querySelector('#gw-expand-icon');

    if (this.isExpanded) {
      content.classList.remove('hidden');
      icon.textContent = '▲';
      // Refresh state when expanding
      this.state.refreshState().catch(() => {});
    } else {
      content.classList.add('hidden');
      icon.textContent = '▼';
    }
  }

  /**
   * Select an action
   */
  selectAction(action) {
    this.selectedAction = action;

    // Update button states
    this.container.querySelectorAll('.gw-action-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.action === action);
    });

    this.updateStatus(`Selected: ${action.toUpperCase()}. Click a cell to build.`);
  }

  /**
   * Handle canvas click
   */
  async onCanvasClick(e) {
    const cell = this.renderer.mouseToGrid(e.clientX, e.clientY);
    if (!cell) return;

    this.selectedCell = cell;
    this.renderer.pulseCell(cell.x, cell.y, '#ffffff', 300);

    if (!this.selectedAction) {
      this.updateStatus(`Selected (${cell.x}, ${cell.y}). Choose an action.`);
      return;
    }

    // Execute action
    try {
      if (this.selectedAction === 'claim') {
        await this.state.claimTerritory(cell.x, cell.y);
        this.updateStatus(`Claimed (${cell.x}, ${cell.y})!`);
      } else {
        // First claim if not owned, then build
        if (!this.state.isOwnedByMe(cell.x, cell.y)) {
          await this.state.claimTerritory(cell.x, cell.y);
        }
        await this.state.buildStructure(cell.x, cell.y, this.selectedAction);
        this.updateStatus(`Built ${this.selectedAction} at (${cell.x}, ${cell.y})!`);
      }

      this.syncRendererState();
      this.updateButtonStates();
      this.updatePointsDisplay();
    } catch (err) {
      this.updateStatus(`Error: ${err.message}`);
    }
  }

  /**
   * Handle canvas mouse move
   */
  onCanvasMouseMove(e) {
    const cell = this.renderer.mouseToGrid(e.clientX, e.clientY);
    if (cell) {
      this.renderer.setHoveredCell(cell.x, cell.y);
    }
  }

  /**
   * Sync renderer state from state manager
   */
  syncRendererState() {
    if (!this.renderer || !this.state) return;

    const renderState = this.state.getRenderState();

    // Clear and reload
    this.renderer.territories = {};
    this.renderer.structures = {};

    for (const t of renderState.territories) {
      this.renderer.setTerritory(t.x, t.y, t.owner);
    }

    for (const s of renderState.structures) {
      this.renderer.setStructure(s.x, s.y, s.type, s.owner);
    }
  }

  /**
   * Update action button states based on current points
   */
  updateButtonStates() {
    const points = this.state?.getActionPoints() || 0;

    this.container.querySelectorAll('.gw-action-btn').forEach(btn => {
      const cost = parseInt(btn.dataset.cost) || 0;
      btn.disabled = points < cost;
    });
  }

  /**
   * Update points display
   */
  updatePointsDisplay() {
    const pointsEl = this.container.querySelector('#gw-points-display');
    if (pointsEl) {
      pointsEl.textContent = this.state?.getActionPoints() || 0;
    }
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    const statusEl = this.container.querySelector('#gw-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  /**
   * Render/update the panel
   */
  render() {
    this.syncRendererState();
    this.updateButtonStates();
    this.updatePointsDisplay();
  }

  /**
   * Add points (called when star is earned)
   */
  async addPointsFromStar(starType) {
    if (!this.state) return;

    try {
      await this.state.addPoints(starType);
      this.updatePointsDisplay();
      this.updateButtonStates();
    } catch (err) {
      console.error('Failed to add Grid Wars points:', err);
    }
  }

  /**
   * Get current action points
   */
  getActionPoints() {
    return this.state?.getActionPoints() || 0;
  }

  /**
   * Handle WebSocket message
   */
  handleWebSocketMessage(message) {
    if (this.state) {
      this.state.handleWebSocketMessage(message);
    }
  }
}

// Singleton instance
let _panel = null;

export function getGridPanel(options = {}) {
  if (!_panel) {
    _panel = new GridPanel(options);
  }
  return _panel;
}

export function resetGridPanel() {
  _panel = null;
}
