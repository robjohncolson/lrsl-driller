/**
 * Grid Wars Panel UI
 * Provides a collapsible panel for territory claiming and avatar display
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
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="display:flex;align-items:center;gap:4px;background:#1e293b;padding:4px 8px;border-radius:4px;">
              <span style="color:#22d3ee;">⚡</span>
              <span id="gw-points-display" style="font-weight:bold;color:#67e8f9;font-size:1rem;">0</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;background:#1e293b;padding:4px 8px;border-radius:4px;" title="Cluster size (+1 bonus per 5 cells)">
              <span style="color:#a855f7;">◆</span>
              <span id="gw-cluster-display" style="font-weight:bold;color:#c084fc;font-size:1rem;">0</span>
            </div>
            <button id="gw-help-btn" style="background:transparent;border:1px solid #374151;color:#9ca3af;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:0.75rem;" title="How to Play">?</button>
          </div>
        </div>

        <!-- Help Section (collapsible) -->
        <div id="gw-help" style="display:none;padding:12px 16px;background:#1e293b;border-bottom:1px solid #166534;font-size:0.75rem;line-height:1.5;">
          <div style="color:#00ff41;font-weight:bold;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">How to Play</div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">1.</span> <strong style="color:#e2e8f0;">Earn Points</strong> - Answer drill questions correctly!<br>
            <span style="font-size:0.65rem;color:#64748b;margin-left:12px;">Gold = 4pts | Silver = 3pts | Bronze = 2pts | Tin = 1pt</span><br>
            <span style="font-size:0.65rem;color:#a855f7;margin-left:12px;">Cluster bonus: +1 pt per 5 connected cells (max +3)</span>
          </div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">2.</span> <strong style="color:#e2e8f0;">Move</strong> - Use arrow keys to move your dot around the map
          </div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">3.</span> <strong style="color:#e2e8f0;">Claim</strong> - Press SPACEBAR to claim territory (10 pts)
          </div>

          <div style="color:#94a3b8;">
            <span style="color:#22d3ee;">4.</span> <strong style="color:#e2e8f0;">Health</strong> - Stay near your territory to stay healthy!
          </div>

          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;color:#64748b;font-size:0.65rem;">
            Controls: Arrow keys = Move | Spacebar = Claim | Click = Claim cell
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

          <!-- Action button -->
          <div style="padding:8px 12px;background:#1f2937;">
            <div style="font-size:0.65rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Actions</div>
            <div style="display:flex;gap:8px;">
              <button class="gw-action-btn" data-action="claim" data-cost="10" style="flex:1;">
                □ Claim Territory<span class="gw-cost">10⚡</span>
              </button>
            </div>
          </div>

          <!-- Buffs Display -->
          <div id="gw-buffs" style="display:none;padding:8px 12px;background:#1e1e2e;border-top:1px solid #374151;">
            <div style="font-size:0.65rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Active Buffs</div>
            <div id="gw-buffs-list" style="font-size:0.7rem;color:#00ff41;"></div>
          </div>

          <!-- Contested Cells Alert -->
          <div id="gw-contested" style="display:none;padding:8px 12px;background:#2d1f1f;border-top:1px solid #ff333380;">
            <div style="display:flex;align-items:center;gap:4px;font-size:0.7rem;color:#ff6666;">
              <span style="animation:pulse 1s infinite;">!</span>
              <span id="gw-contested-text">0 cells under attack</span>
            </div>
          </div>

          <!-- Status -->
          <div style="padding:8px 12px;font-size:0.75rem;color:#6b7280;border-top:1px solid #374151;">
            <span id="gw-status">Click a cell to claim territory</span>
          </div>

          <!-- Class Goal Progress -->
          <div style="padding:8px 12px;background:#0f172a;border-top:1px solid #374151;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:0.65rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Class Goal</span>
              <span id="gw-goal-text" style="font-size:0.7rem;color:#67e8f9;">0 / 200</span>
            </div>
            <div style="height:6px;background:#1e293b;border-radius:3px;overflow:hidden;">
              <div id="gw-goal-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#00ff41,#22d3ee);transition:width 0.3s;"></div>
            </div>
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
    this.container.querySelectorAll('.gw-action-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        // For now, just enable "claim" mode
        this.updateStatus('Click a cell on the map to claim it');
      });
    });

    // Keyboard controls
    this.setupKeyboardControls();
  }

  /**
   * Setup keyboard controls for avatar movement
   * Arrow keys: move avatar
   * Spacebar: claim territory at current position
   */
  setupKeyboardControls() {
    // Store bound handler for potential cleanup
    this._keydownHandler = (e) => this.handleKeydown(e);
    document.addEventListener('keydown', this._keydownHandler);
  }

  /**
   * Handle keydown events for avatar movement
   */
  async handleKeydown(e) {
    // Only handle when panel is expanded
    if (!this.isExpanded) return;

    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const keyToDirection = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right'
    };

    const direction = keyToDirection[e.key];

    if (direction) {
      e.preventDefault();
      await this.handleMovement(direction);
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      await this.handleClaimAtPosition();
    }
  }

  /**
   * Handle avatar movement
   */
  async handleMovement(direction) {
    if (!this.state) return;

    try {
      await this.state.moveAvatar(direction);
      this.syncRendererState();

      // Show position in status
      const pos = this.state.getPlayerPosition();
      if (pos) {
        this.updateStatus(`Position: (${pos.x}, ${pos.y})`);
      }
    } catch (err) {
      this.updateStatus(`Move failed: ${err.message}`);
    }
  }

  /**
   * Claim territory at current avatar position
   */
  async handleClaimAtPosition() {
    if (!this.state) return;

    const pos = this.state.getPlayerPosition();
    if (!pos) {
      this.updateStatus('Move first to spawn on the map!');
      return;
    }

    try {
      await this.state.claimTerritory(pos.x, pos.y);
      this.updateStatus(`Claimed (${pos.x}, ${pos.y})!`);
      this.syncRendererState();
      this.updateButtonStates();
      this.updatePointsDisplay();
    } catch (err) {
      this.updateStatus(`Claim failed: ${err.message}`);
    }
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
   * Handle canvas click - claim territory
   */
  async onCanvasClick(e) {
    const cell = this.renderer.mouseToGrid(e.clientX, e.clientY);
    if (!cell) return;

    this.selectedCell = cell;
    this.renderer.pulseCell(cell.x, cell.y, '#ffffff', 300);

    // Try to claim the territory
    try {
      await this.state.claimTerritory(cell.x, cell.y);
      this.updateStatus(`Claimed (${cell.x}, ${cell.y})!`);

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

    // Clear and reload territories with all data
    this.renderer.territories = {};
    for (const t of renderState.territories) {
      this.renderer.setTerritory(t.x, t.y, t.owner, {
        strength: t.strength,
        contested_by: t.contested_by,
        node_type: t.node_type
      });
    }

    // Update avatars
    this.renderer.setAvatars(renderState.players || []);

    // Update surge cell
    if (renderState.surge) {
      this.renderer.setSurgeCell(renderState.surge.x, renderState.surge.y, renderState.surge.expiresIn);
    } else {
      this.renderer.setSurgeCell(null, null, null);
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
   * Update cluster size display
   */
  updateClusterDisplay() {
    const clusterEl = this.container.querySelector('#gw-cluster-display');
    if (clusterEl) {
      clusterEl.textContent = this.state?.getLargestCluster() || 0;
    }
  }

  /**
   * Update class goal progress display
   */
  updateClassGoalDisplay() {
    const textEl = this.container.querySelector('#gw-goal-text');
    const barEl = this.container.querySelector('#gw-goal-bar');

    if (!this.state) return;

    const goal = this.state.getClassGoal();
    const current = goal.current || 0;
    const target = goal.target || 200;
    const percent = Math.min(100, (current / target) * 100);

    if (textEl) {
      textEl.textContent = `${current} / ${target}`;
    }
    if (barEl) {
      barEl.style.width = `${percent}%`;
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
    this.updateClusterDisplay();
    this.updateClassGoalDisplay();
    this.updateBuffsDisplay();
    this.updateContestedDisplay();
  }

  /**
   * Update active buffs display
   */
  updateBuffsDisplay() {
    const buffsContainer = this.container.querySelector('#gw-buffs');
    const buffsList = this.container.querySelector('#gw-buffs-list');
    if (!buffsContainer || !buffsList || !this.state) return;

    const buffs = this.state.getActiveBuffs();
    const buffItems = [];

    if (buffs.amplifier && buffs.amplifier.remaining > 0) {
      buffItems.push(`<span style="color:#ff00ff;">AMPLIFIER: +3 pts (${buffs.amplifier.remaining} left)</span>`);
    }

    if (buffs.beacon && new Date(buffs.beacon.expires) > new Date()) {
      const remaining = Math.max(0, Math.floor((new Date(buffs.beacon.expires) - new Date()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      buffItems.push(`<span style="color:#00ffff;">BEACON: +2 regen range (${mins}:${secs.toString().padStart(2, '0')})</span>`);
    }

    if (buffs.anchor && new Date(buffs.anchor.expires) > new Date()) {
      const remaining = Math.max(0, Math.floor((new Date(buffs.anchor.expires) - new Date()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      buffItems.push(`<span style="color:#ffbf00;">ANCHOR: Immune to contest (${mins}:${secs.toString().padStart(2, '0')})</span>`);
    }

    if (buffItems.length > 0) {
      buffsContainer.style.display = 'block';
      buffsList.innerHTML = buffItems.join('<br>');
    } else {
      buffsContainer.style.display = 'none';
    }
  }

  /**
   * Update contested cells warning display
   */
  updateContestedDisplay() {
    const contestedContainer = this.container.querySelector('#gw-contested');
    const contestedText = this.container.querySelector('#gw-contested-text');
    if (!contestedContainer || !contestedText || !this.state) return;

    const contested = this.state.getMyContestedCells();

    if (contested.length > 0) {
      contestedContainer.style.display = 'block';
      contestedText.textContent = `${contested.length} cell${contested.length > 1 ? 's' : ''} under attack!`;
    } else {
      contestedContainer.style.display = 'none';
    }
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
