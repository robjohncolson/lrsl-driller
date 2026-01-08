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
    console.log('[GridPanel] init called for', username);
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
      console.log('[GridPanel] Calling state.init()...');
      await this.state.init();
      console.log('[GridPanel] state.init() success, calling createUI()...');
      this.createUI();
      console.log('[GridPanel] createUI() done, container innerHTML length:', this.container?.innerHTML?.length);
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
    } else {
      this.container = container;
    }
  }

  /**
   * Create the panel UI
   */
  createUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="grid-wars-panel" style="background:#111827;color:#00ff41;font-family:monospace;border-radius:0;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.3);">
        <!-- Header (always visible) -->
        <div id="gw-header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#0f172a;border-bottom:1px solid #166534;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">🎮</span>
            <span style="font-weight:bold;color:#00ff41;font-size:1.1rem;">GRID WARS</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="display:flex;align-items:center;gap:4px;background:#1e293b;padding:4px 8px;border-radius:4px;">
              <span style="color:#22d3ee;">⚡</span>
              <span id="gw-points-display" style="font-weight:bold;color:#67e8f9;font-size:1.1rem;">0</span>
            </div>
            <button id="gw-help-btn" style="background:transparent;border:1px solid #374151;color:#9ca3af;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:0.75rem;" title="How to Play">?</button>
          </div>
        </div>

        <!-- Help Section (collapsible) -->
        <div id="gw-help" style="display:none;padding:12px 16px;background:#1e293b;border-bottom:1px solid #166534;font-size:0.75rem;line-height:1.5;">
          <div style="color:#00ff41;font-weight:bold;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">How to Play</div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">1.</span> <strong style="color:#e2e8f0;">Earn Points</strong> - Answer drill questions correctly!<br>
            <span style="font-size:0.65rem;color:#64748b;margin-left:12px;">Gold ⭐ = 4pts | Silver = 3pts | Bronze = 2pts | Tin = 1pt</span>
          </div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">2.</span> <strong style="color:#e2e8f0;">Claim Territory</strong> - Click a grid cell, then click "Claim" (1⚡)
          </div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">3.</span> <strong style="color:#e2e8f0;">Build Structures</strong> - On your territory, build:
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:8px 0;padding:8px;background:#0f172a;border-radius:4px;">
            <div style="color:#00ff41;"><span style="opacity:0.7;">■</span> Wall (2⚡) - Defense</div>
            <div style="color:#00ff41;"><span style="opacity:0.7;">▲</span> Tower (3⚡) - Attack</div>
            <div style="color:#00ffff;"><span style="opacity:0.7;">◇</span> Farm (4⚡) - +Points</div>
            <div style="color:#ffbf00;"><span style="opacity:0.7;">★</span> Castle (10⚡) - HQ</div>
          </div>

          <div style="color:#94a3b8;">
            <span style="color:#22d3ee;">4.</span> <strong style="color:#e2e8f0;">Compete!</strong> - Build the biggest empire with your class!
          </div>
        </div>

        <!-- Main Toggle Header -->
        <div id="gw-toggle" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#1f2937;cursor:pointer;border-bottom:1px solid #374151;">
          <div style="font-size:0.7rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Map & Actions</div>
          <span id="gw-expand-icon" style="color:#9ca3af;font-size:0.8rem;">▼</span>
        </div>

        <!-- Expandable content -->
        <div id="gw-content" style="display:none;">
          <!-- Mini Grid -->
          <div style="padding:8px;background:#030712;">
            <div style="aspect-ratio:1;max-width:100%;margin:0 auto;background:#000;border:1px solid #14532d;border-radius:4px;overflow:hidden;">
              <canvas id="gw-canvas" style="width:100%;height:100%;"></canvas>
            </div>
          </div>

          <!-- Action buttons -->
          <div style="padding:8px 12px;background:#1f2937;">
            <div style="font-size:0.65rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Build Actions</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">
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
          <div style="padding:8px 12px;font-size:0.75rem;color:#6b7280;border-top:1px solid #374151;">
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
          max-height: 100vh;
          overflow-y: auto;
        }
        #gw-help-btn:hover {
          border-color: #00ff41;
          color: #00ff41;
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

    // Help button toggle
    const helpBtn = this.container.querySelector('#gw-help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.toggleHelp());
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
   * Toggle help section visibility
   */
  toggleHelp() {
    const help = this.container.querySelector('#gw-help');
    const btn = this.container.querySelector('#gw-help-btn');
    if (!help) return;

    const isVisible = help.style.display !== 'none';
    help.style.display = isVisible ? 'none' : 'block';
    if (btn) {
      btn.style.borderColor = isVisible ? '#374151' : '#00ff41';
      btn.style.color = isVisible ? '#9ca3af' : '#00ff41';
    }
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
      content.style.display = 'block';
      icon.textContent = '▲';
      // Refresh state when expanding
      this.state.refreshState().catch(() => {});
      // Re-init canvas after showing
      this.initCanvas();
    } else {
      content.style.display = 'none';
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
