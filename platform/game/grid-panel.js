/**
 * Grid Wars Panel UI
 * Provides a collapsible panel for territory claiming and avatar display
 */

import { GridWarsState, GRID_WARS_CONFIG } from './grid-state.js';
import { GridRenderer } from './grid-renderer.js';
import { sounds, initAudio } from './audio.js';

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
        sounds.points();
        if (this.onPointsChange) {
          this.onPointsChange(data);
        }
      },
      onTerritoryChanged: (data) => {
        // Play alert sound when our territory is taken
        if (data.action === 'taken' && data.previousOwner === this.username) {
          sounds.alert();
        }
        // v1.3: Show toast for AFK erosion
        if (data.action === 'afk_erosion' && data.message) {
          sounds.alert();
          this.showToast(data.message);
        }
      },
      // v1.2.1: Boot bonus notification
      onBootBonus: (data) => {
        sounds.points();
        this.showToast(`BOOT BONUS: +${data.points} pts — Claim your first territory!`);
      },
      // v1.3: Spam prevention cooldown
      onCooldownChange: (data) => {
        if (data.inCooldown) {
          this._showCooldownOverlay(data.remaining);
        } else {
          this._hideCooldownOverlay();
        }
      },
      // v1.3.2: Resync request - delayed indicator, panel-local
      onResyncRequest: async (data) => {
        console.log('[GridPanel] Resync requested, fetching fresh state...');

        // Clear any existing delay timer
        if (this._resyncDelayTimer) {
          clearTimeout(this._resyncDelayTimer);
        }

        // Wait 2 seconds before showing indicator (in case resync is fast)
        this._resyncDelayTimer = setTimeout(() => {
          this._showResyncIndicator();
        }, 2000);

        try {
          await this.state.refreshState();
          await this.state.completeResync();

          // Clear timer and hide indicator - silent completion
          clearTimeout(this._resyncDelayTimer);
          this._hideResyncIndicator();
        } catch (err) {
          console.error('[GridPanel] Resync failed:', err);
          clearTimeout(this._resyncDelayTimer);
          this._hideResyncIndicator();
          // Only show error toast
          this.showToast('SYNC FAILED - REFRESH PAGE');
        }
      },
      // v1.3.1: System events (auto-surge, etc.)
      onSystemEvent: (data) => {
        if (data.event === 'auto_surge') {
          sounds.alert();
          this.showToast(data.message || 'UPLINK DETECTED — New sectors available');
        }
      },
      // v1.3.2: Session ended - show rankings overlay
      onSessionEnded: (data) => {
        sounds.alert();
        this._showSessionEndOverlay(data.summary, data.rankings);
      },
      // v1.3.2: Session resumed - close overlay if open
      onSessionResumed: () => {
        const overlay = document.getElementById('gw-session-end-overlay');
        if (overlay) overlay.remove();
        this.showToast('SESSION RESUMED');
      },
      // v1.3.2: Game reset - refresh display
      onGameReset: () => {
        const overlay = document.getElementById('gw-session-end-overlay');
        if (overlay) overlay.remove();
        this.showToast('MAP RESET — Starting fresh!');
        this.render();
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
            <!-- v1.4: Uplink status indicator -->
            <div id="gw-uplink-status" style="display:flex;align-items:center;gap:4px;background:#1e293b;padding:4px 8px;border-radius:4px;" title="Uplink status - must answer drills to claim">
              <span id="gw-uplink-icon" style="color:#00ff41;">📡</span>
              <span id="gw-uplink-text" style="font-weight:bold;color:#67e8f9;font-size:0.7rem;">--:--</span>
            </div>
            <button id="gw-help-btn" style="background:transparent;border:1px solid #374151;color:#9ca3af;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:0.75rem;" title="How to Play">?</button>
          </div>
        </div>

        <!-- v1.3.2: Objective Section (always visible) -->
        <div id="gw-objective" style="padding:8px 12px;background:#0a0a0a;border-bottom:1px solid #166534;">
          <div style="color:#ffbf00;font-size:0.65rem;margin-bottom:4px;display:flex;align-items:center;gap:4px;">
            <span>🎯</span>
            <span style="text-transform:uppercase;letter-spacing:0.05em;font-weight:bold;">OBJECTIVE</span>
          </div>
          <div style="color:#9ca3af;font-size:0.6rem;line-height:1.3;margin-bottom:6px;">
            Claim territory • Earn points • Dominate the map
          </div>
          <div style="display:flex;gap:12px;font-size:0.7rem;">
            <div style="color:#00ff41;">
              <span style="color:#6b7280;">Cells:</span> <span id="gw-my-cells" style="font-weight:bold;">0</span>
            </div>
            <div style="color:#22d3ee;">
              <span style="color:#6b7280;">Pts:</span> <span id="gw-my-points" style="font-weight:bold;">0</span>
            </div>
            <div id="gw-leader-info" style="color:#a855f7;font-size:0.65rem;">--</div>
          </div>
        </div>

        <!-- v1.3.2: Underdog Banner (shows when eligible) -->
        <div id="gw-underdog-banner" style="display:none;background:linear-gradient(90deg,#4c1d95,#7c3aed);padding:8px 12px;border-bottom:1px solid #166534;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:1rem;">🔥</span>
              <span style="color:#fff;font-weight:bold;font-size:0.7rem;text-transform:uppercase;">COMEBACK BONUS</span>
            </div>
            <div style="color:#c4b5fd;font-size:0.7rem;">
              <span id="gw-underdog-original" style="text-decoration:line-through;opacity:0.7;">10</span>
              <span style="color:#00ff41;font-weight:bold;margin-left:4px;"><span id="gw-underdog-discounted">5</span>⚡</span>
            </div>
          </div>
        </div>

        <!-- v1.4: Diminishing Returns Banner (shows when multiplier < 1.0) -->
        <div id="gw-diminishing-banner" style="display:none;background:#1e293b;padding:6px 12px;border-bottom:1px solid #374151;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:0.9rem;">📉</span>
            <span style="color:#fbbf24;font-size:0.7rem;">EMPIRE OVERHEAD: Earning at <span id="gw-earning-rate" style="font-weight:bold;">100</span>%</span>
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
            <span style="color:#22d3ee;">3.</span> <strong style="color:#e2e8f0;">Claim</strong> - Press SPACEBAR to claim (10 pts) or takeover (20 pts)
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

          <!-- v1.2: Removed contested cells alert (contestation system removed) -->

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

          <!-- v1.4: Multi-Dimensional Leaderboard -->
          <div id="gw-leaderboard-section" style="border-top:1px solid #374151;">
            <div style="display:flex;background:#0a0a0a;">
              <button class="gw-lb-tab gw-lb-tab-active" data-tab="scholar" style="flex:1;padding:6px 4px;background:transparent;border:none;color:#fbbf24;font-size:0.6rem;cursor:pointer;border-bottom:2px solid #fbbf24;font-family:inherit;">
                🎓 Scholar
              </button>
              <button class="gw-lb-tab" data-tab="banker" style="flex:1;padding:6px 4px;background:transparent;border:none;color:#6b7280;font-size:0.6rem;cursor:pointer;border-bottom:2px solid transparent;font-family:inherit;">
                💰 Banker
              </button>
              <button class="gw-lb-tab" data-tab="general" style="flex:1;padding:6px 4px;background:transparent;border:none;color:#6b7280;font-size:0.6rem;cursor:pointer;border-bottom:2px solid transparent;font-family:inherit;">
                ⚔️ General
              </button>
            </div>
            <div id="gw-leaderboard-content" style="padding:8px;background:#0f172a;max-height:120px;overflow-y:auto;font-size:0.65rem;">
              <div style="color:#6b7280;text-align:center;">Loading...</div>
            </div>
            <div id="gw-my-ranks" style="padding:6px 8px;background:#0a0a0a;font-size:0.6rem;color:#6b7280;text-align:center;border-top:1px solid #1e293b;">
              Your rank: <span id="gw-rank-scholar">--</span> · <span id="gw-rank-banker">--</span> · <span id="gw-rank-general">--</span>
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
        /* v1.4: Leaderboard tab styles */
        .gw-lb-tab:hover {
          color: #9ca3af;
        }
        .gw-lb-tab-active {
          color: #fbbf24 !important;
          border-bottom-color: #fbbf24 !important;
        }
        .gw-lb-tab[data-tab="banker"].gw-lb-tab-active {
          color: #22d3ee !important;
          border-bottom-color: #22d3ee !important;
        }
        .gw-lb-tab[data-tab="general"].gw-lb-tab-active {
          color: #a855f7 !important;
          border-bottom-color: #a855f7 !important;
        }
        .gw-lb-entry {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          border-bottom: 1px solid #1e293b;
        }
        .gw-lb-entry:last-child {
          border-bottom: none;
        }
        .gw-lb-entry.my-entry {
          background: rgba(0, 255, 65, 0.1);
          margin: 0 -8px;
          padding: 3px 8px;
        }
      </style>
    `;

    this.setupEventListeners();
    this.initCanvas();
    this.updateButtonStates();
    this.updatePointsDisplay();
    this.updateClusterDisplay();
    this.updateClassGoalDisplay();

    // v1.4: Load leaderboard data on initial render
    this.refreshMultiLeaderboard();

    // Show onboarding overlay for first-time users
    this.showOnboardingIfNeeded();
  }

  /**
   * Show onboarding overlay for first-time users
   */
  showOnboardingIfNeeded() {
    // Safe localStorage check with tracking prevention fallback
    try {
      if (localStorage.getItem('gridwars_onboarded')) {
        return; // Already onboarded
      }
    } catch (e) {
      // localStorage blocked (Safari tracking prevention) - skip onboarding
      console.warn('[GridWars] localStorage blocked, skipping onboarding check');
      return;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'gw-onboarding';
    overlay.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:monospace;">
        <div style="background:#0f172a;border:2px solid #00ff41;padding:32px 40px;max-width:400px;text-align:center;box-shadow:0 0 40px rgba(0,255,65,0.3);">
          <div style="font-size:1.5rem;color:#00ff41;margin-bottom:24px;text-shadow:0 0 10px #00ff4180;">
            ⚡ GRID WARS ⚡
          </div>

          <div style="text-align:left;color:#e2e8f0;font-size:0.9rem;line-height:1.8;">
            <div style="margin-bottom:8px;">
              <span style="color:#22d3ee;">📝</span> Answer questions → Earn points
            </div>
            <div style="margin-bottom:8px;">
              <span style="color:#22d3ee;">🎯</span> Press SPACE → Claim territory
            </div>
            <div style="margin-bottom:8px;">
              <span style="color:#22d3ee;">🔗</span> Connect cells → Earn bonus points
            </div>
            <div style="margin-bottom:16px;">
              <span style="color:#22d3ee;">🏆</span> Biggest connected empire wins!
            </div>
          </div>

          <button id="gw-onboarding-dismiss" style="
            background:transparent;
            border:2px solid #00ff41;
            color:#00ff41;
            padding:12px 32px;
            font-family:inherit;
            font-size:1rem;
            cursor:pointer;
            text-transform:uppercase;
            transition:all 0.2s;
          ">START PLAYING</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Dismiss on button click
    const dismissBtn = document.getElementById('gw-onboarding-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        overlay.remove();
        try { localStorage.setItem('gridwars_onboarded', 'true'); } catch (e) { /* ignore */ }
      });

      // Hover effect
      dismissBtn.addEventListener('mouseenter', () => {
        dismissBtn.style.background = 'rgba(0,255,65,0.2)';
        dismissBtn.style.boxShadow = '0 0 20px rgba(0,255,65,0.4)';
      });
      dismissBtn.addEventListener('mouseleave', () => {
        dismissBtn.style.background = 'transparent';
        dismissBtn.style.boxShadow = 'none';
      });
    }

    // Also dismiss on overlay click (outside the modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay.firstElementChild) return; // Don't dismiss if clicking the modal
      if (e.target.closest('[style*="background:#0f172a"]')) return;
      overlay.remove();
      try { localStorage.setItem('gridwars_onboarded', 'true'); } catch (e) { /* ignore */ }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Initialize audio on first interaction
    const initAudioOnce = () => {
      initAudio();
      this.container.removeEventListener('click', initAudioOnce);
    };
    this.container.addEventListener('click', initAudioOnce);

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

    // v1.4: Leaderboard tab switching
    this.container.querySelectorAll('.gw-lb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchLeaderboardTab(tabName);
      });
    });

    // v1.4: Current leaderboard tab
    this._currentLeaderboardTab = 'scholar';
    this._leaderboardData = null;
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
    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // ESC key collapses panel (works even when collapsed, no-op)
    if (e.key === 'Escape' && this.isExpanded) {
      e.preventDefault();
      this.toggleExpand();
      return;
    }

    // Only handle movement when panel is expanded
    if (!this.isExpanded) return;

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
      sounds.move();
      this.syncRendererState();

      // Show action affordance based on current position
      this.updateActionAffordance();
    } catch (err) {
      this.updateStatus(`Move failed: ${err.message}`);
    }
  }

  /**
   * Update status to show what action is available at current position
   * v1.2.1: Shows activity tier (ACTIVE/COLD) for enemy territories
   */
  updateActionAffordance() {
    const pos = this.state.getPlayerPosition();
    if (!pos) {
      this.updateStatus('Use arrow keys to move');
      return;
    }

    const owner = this.state.getTerritoryOwner(pos.x, pos.y);
    const points = this.state.getActionPoints();

    if (!owner) {
      // Neutral cell
      if (points >= GRID_WARS_CONFIG.claimCost) {
        this.updateStatus(`[SPACE] CLAIM (${GRID_WARS_CONFIG.claimCost} pts)`);
      } else {
        this.updateStatus(`NEED ${GRID_WARS_CONFIG.claimCost - points} MORE POINTS`);
      }
    } else if (owner === this.state.username) {
      // Own territory
      this.updateStatus('YOUR TERRITORY');
    } else {
      // Enemy territory - v1.2.1: Show activity tier
      const defenderData = this.state.players.get(owner);
      const { cost, tier } = this._getActivityTierCost(defenderData);

      if (points >= cost) {
        this.updateStatus(`[HOLD] OVERWRITE (${cost} pts) — ${tier}`);
      } else {
        this.updateStatus(`NEED ${cost - points} MORE POINTS`);
      }
    }
  }

  /**
   * v1.3: Calculate activity tier and cost for enemy territory
   * Shows all 3 tiers: ACTIVE/WARM/COLD matching server pricing
   */
  _getActivityTierCost(defenderData) {
    if (!defenderData?.last_answer_at) {
      // No activity data = COLD
      return {
        cost: GRID_WARS_CONFIG.takeoverCostCold || GRID_WARS_CONFIG.takeoverCostBase || 15,
        tier: 'COLD'
      };
    }

    const timeSinceAnswer = (Date.now() - new Date(defenderData.last_answer_at).getTime()) / 1000;
    const activeWindow = GRID_WARS_CONFIG.activeWindowSeconds || 180;
    const warmWindow = GRID_WARS_CONFIG.warmWindowSeconds || 480;

    if (timeSinceAnswer < activeWindow) {
      // <3min = ACTIVE
      return {
        cost: GRID_WARS_CONFIG.takeoverCostActive || 25,
        tier: 'ACTIVE'
      };
    } else if (timeSinceAnswer < warmWindow) {
      // 3-8min = WARM
      return {
        cost: GRID_WARS_CONFIG.takeoverCostWarm || 20,
        tier: 'WARM'
      };
    } else {
      // >8min = COLD
      return {
        cost: GRID_WARS_CONFIG.takeoverCostCold || GRID_WARS_CONFIG.takeoverCostBase || 15,
        tier: 'COLD'
      };
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

    const owner = this.state.getTerritoryOwner(pos.x, pos.y);

    // Can't claim own territory
    if (owner === this.state.username) {
      this.updateStatus('You already own this territory');
      return;
    }

    const isTakeover = !!owner;

    try {
      await this.state.claimTerritory(pos.x, pos.y);
      if (isTakeover) {
        sounds.takeover();
        this.updateStatus(`Took over (${pos.x}, ${pos.y})!`);
      } else {
        sounds.claim();
        this.updateStatus(`Claimed (${pos.x}, ${pos.y})!`);
      }
      this.syncRendererState();
      this.updateButtonStates();
      this.updatePointsDisplay();

      // Update action affordance after claim
      setTimeout(() => this.updateActionAffordance(), 100);
    } catch (err) {
      sounds.error();
      this.updateStatus(`${isTakeover ? 'Takeover' : 'Claim'} failed: ${err.message}`);
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
   * Enable teacher-specific controls (wave management, etc.)
   * Called when user is authenticated as teacher
   */
  enableTeacherControls() {
    this._isTeacher = true;
    console.log('[GridWars] Teacher controls enabled');
    // Teacher controls are handled through the separate teacher-view.js
    // This method exists to prevent init errors when called from app.html
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
      // v1.4: Refresh multi-leaderboard
      this.refreshMultiLeaderboard();
    } else {
      content.style.display = 'none';
      icon.textContent = '▼';
    }
  }

  /**
   * Handle canvas click - claim/takeover territory
   */
  async onCanvasClick(e) {
    const cell = this.renderer.mouseToGrid(e.clientX, e.clientY);
    if (!cell) return;

    this.selectedCell = cell;
    this.renderer.pulseCell(cell.x, cell.y, '#ffffff', 300);

    const owner = this.state.getTerritoryOwner(cell.x, cell.y);

    // Can't claim own territory
    if (owner === this.state.username) {
      this.updateStatus('You already own this territory');
      return;
    }

    const isTakeover = !!owner;

    // Try to claim/takeover the territory
    try {
      await this.state.claimTerritory(cell.x, cell.y);
      if (isTakeover) {
        sounds.takeover();
        this.updateStatus(`Took over (${cell.x}, ${cell.y})!`);
      } else {
        sounds.claim();
        this.updateStatus(`Claimed (${cell.x}, ${cell.y})!`);
      }

      this.syncRendererState();
      this.updateButtonStates();
      this.updatePointsDisplay();
    } catch (err) {
      sounds.error();
      // v1.4: Handle UPLINK OFFLINE error specifically
      if (err.message.includes('UPLINK OFFLINE')) {
        this.updateStatus('UPLINK OFFLINE - Answer a drill to claim!');
        this.showToast('Answer a drill question to restore your uplink');
      } else {
        this.updateStatus(`Error: ${err.message}`);
      }
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
   * v1.2: Removed contested_by (contestation system removed)
   */
  syncRendererState() {
    if (!this.renderer || !this.state) return;

    const renderState = this.state.getRenderState();

    // Clear and reload territories with all data
    this.renderer.territories = {};
    for (const t of renderState.territories) {
      this.renderer.setTerritory(t.x, t.y, t.owner, {
        strength: t.strength,
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
   * v1.2.1: Show a toast notification that auto-dismisses
   */
  showToast(message, duration = 3000) {
    // Create toast element if it doesn't exist
    let toast = this.container.querySelector('#gw-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gw-toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
        color: #000;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0, 255, 65, 0.4);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        text-align: center;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';

    // Auto-dismiss
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
  }

  /**
   * v1.3: Show cooldown overlay when spam prevention triggers
   * Dims avatar and shows countdown timer
   */
  _showCooldownOverlay(seconds) {
    // Create overlay if it doesn't exist
    let overlay = document.querySelector('#gw-cooldown-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'gw-cooldown-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ffbf00;
        font-family: monospace;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; color: #ff6666;">
        ⚠ SYSTEM RECALIBRATING
      </div>
      <div id="gw-cooldown-timer" style="font-size: 2.5rem; font-weight: bold; color: #ffbf00;">
        ${seconds}s
      </div>
      <div style="font-size: 0.75rem; color: #888; margin-top: 12px;">
        Too many incorrect answers in quick succession
      </div>
    `;
    overlay.style.display = 'flex';

    // Update countdown every second
    if (this._cooldownInterval) {
      clearInterval(this._cooldownInterval);
    }
    this._cooldownInterval = setInterval(() => {
      const remaining = this.state?.getCooldownRemaining() || 0;
      if (remaining <= 0) {
        this._hideCooldownOverlay();
      } else {
        const timer = overlay.querySelector('#gw-cooldown-timer');
        if (timer) timer.textContent = `${remaining}s`;
      }
    }, 1000);
  }

  /**
   * v1.3: Hide cooldown overlay
   */
  _hideCooldownOverlay() {
    const overlay = document.querySelector('#gw-cooldown-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    if (this._cooldownInterval) {
      clearInterval(this._cooldownInterval);
      this._cooldownInterval = null;
    }
  }

  /**
   * Render/update the panel
   * v1.2: Removed updateContestedDisplay (contestation system removed)
   */
  render() {
    this.syncRendererState();
    this.updateButtonStates();
    this.updatePointsDisplay();
    this.updateClusterDisplay();
    this.updateClassGoalDisplay();
    this.updateBuffsDisplay();
    this.updateActionAffordance();
    this.updateObjectiveDisplay();   // v1.3.2
    this.updateUnderdogDisplay();    // v1.3.2
    this.updateUplinkStatus();       // v1.4
    this.updateDiminishingDisplay(); // v1.4
  }

  /**
   * Update active buffs display (simplified - all nodes are now Amplifier/Power Nodes)
   */
  updateBuffsDisplay() {
    const buffsContainer = this.container.querySelector('#gw-buffs');
    const buffsList = this.container.querySelector('#gw-buffs-list');
    if (!buffsContainer || !buffsList || !this.state) return;

    const buffs = this.state.getActiveBuffs();
    const buffItems = [];

    // All nodes are now Amplifier type (Power Nodes)
    if (buffs.amplifier && buffs.amplifier.remaining > 0) {
      buffItems.push(`<span style="color:#ff00ff;">POWER NODE: +${GRID_WARS_CONFIG.amplifierBonus} pts/answer (${buffs.amplifier.remaining} left)</span>`);
    }

    if (buffItems.length > 0) {
      buffsContainer.style.display = 'block';
      buffsList.innerHTML = buffItems.join('<br>');
    } else {
      buffsContainer.style.display = 'none';
    }
  }

  // v1.2: Removed updateContestedDisplay (contestation system removed)

  /**
   * Add points (called when star is earned)
   * @param {string} starType - 'gold', 'silver', 'bronze', 'tin'
   * @param {number} weightedPoints - Pre-calculated weighted points (optional)
   */
  async addPointsFromStar(starType, weightedPoints = null) {
    if (!this.state) return;

    try {
      await this.state.addPoints(starType, weightedPoints);
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

  /**
   * v1.3.2: Update objective display (cells, points, leader info)
   */
  updateObjectiveDisplay() {
    const cellsEl = this.container?.querySelector('#gw-my-cells');
    const pointsEl = this.container?.querySelector('#gw-my-points');
    const leaderEl = this.container?.querySelector('#gw-leader-info');

    if (!this.state) return;

    const myStats = this.state.getPlayerStats();

    if (cellsEl) cellsEl.textContent = myStats.territories_count || 0;
    if (pointsEl) pointsEl.textContent = myStats.action_points || 0;

    // Find territory leader
    if (leaderEl) {
      const players = Array.from(this.state.players.values());
      const playersWithNames = players.map((p, i) => ({
        ...p,
        username: Array.from(this.state.players.keys())[i]
      }));
      const sortedByTerritory = playersWithNames
        .filter(p => (p.territories_count || 0) > 0)
        .sort((a, b) => (b.territories_count || 0) - (a.territories_count || 0));

      const leader = sortedByTerritory[0];

      if (leader && leader.username !== this.username && (leader.territories_count || 0) > 0) {
        leaderEl.textContent = `Leader: ${leader.username} (${leader.territories_count})`;
        leaderEl.style.color = '#a855f7';
      } else if (leader && leader.username === this.username) {
        leaderEl.textContent = "👑 You're leading!";
        leaderEl.style.color = '#00ff41';
      } else {
        leaderEl.textContent = 'No territories claimed yet';
        leaderEl.style.color = '#6b7280';
      }
    }
  }

  /**
   * v1.3.2: Update underdog banner visibility
   * Shows when player has 0 territories and answered recently
   */
  updateUnderdogDisplay() {
    const banner = this.container?.querySelector('#gw-underdog-banner');
    if (!banner || !this.state) return;

    const myStats = this.state.getPlayerStats();
    const hasNoTerritory = (myStats.territories_count || 0) === 0;

    // Check if answered recently (within underdog activity window)
    const lastAnswer = myStats.last_answer_at;
    const answeredRecently = lastAnswer &&
      (Date.now() - new Date(lastAnswer).getTime()) < (GRID_WARS_CONFIG.underdogActivityWindowMs || 180000);

    const showBanner = hasNoTerritory && answeredRecently && GRID_WARS_CONFIG.underdogEnabled;

    if (showBanner) {
      banner.style.display = 'block';
      // Update prices
      const originalEl = this.container.querySelector('#gw-underdog-original');
      const discountedEl = this.container.querySelector('#gw-underdog-discounted');
      const baseCost = GRID_WARS_CONFIG.claimCost || 10;
      const discount = GRID_WARS_CONFIG.underdogDiscount || 0.5;
      const minCost = GRID_WARS_CONFIG.underdogMinCost || 5;
      const discountedCost = Math.max(minCost, Math.floor(baseCost * discount));

      if (originalEl) originalEl.textContent = baseCost;
      if (discountedEl) discountedEl.textContent = discountedCost;
    } else {
      banner.style.display = 'none';
    }
  }

  /**
   * v1.4: Update uplink status indicator
   */
  updateUplinkStatus() {
    const iconEl = this.container?.querySelector('#gw-uplink-icon');
    const textEl = this.container?.querySelector('#gw-uplink-text');
    if (!iconEl || !textEl || !this.state) return;

    if (this.state.isUplinkActive()) {
      const remaining = this.state.getUplinkTimeRemaining();
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      iconEl.textContent = '📡';
      iconEl.style.color = '#00ff41';
      textEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
      textEl.style.color = '#67e8f9';
    } else {
      iconEl.textContent = '📡';
      iconEl.style.color = '#ef4444';
      textEl.textContent = 'OFF';
      textEl.style.color = '#ef4444';
    }
  }

  /**
   * v1.4: Update diminishing returns banner
   */
  updateDiminishingDisplay() {
    const banner = this.container?.querySelector('#gw-diminishing-banner');
    const rateEl = this.container?.querySelector('#gw-earning-rate');
    if (!banner || !this.state) return;

    const multiplier = this.state.getEarningMultiplier();

    if (multiplier < 1.0) {
      banner.style.display = 'block';
      if (rateEl) rateEl.textContent = Math.round(multiplier * 100);
    } else {
      banner.style.display = 'none';
    }
  }

  /**
   * v1.4: Switch leaderboard tab
   */
  switchLeaderboardTab(tabName) {
    this._currentLeaderboardTab = tabName;

    // Update tab styles
    this.container.querySelectorAll('.gw-lb-tab').forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabName;
      tab.classList.toggle('gw-lb-tab-active', isActive);
    });

    // Re-render with current data
    this.renderLeaderboardContent();
  }

  /**
   * v1.4: Fetch and update multi-leaderboard
   */
  async refreshMultiLeaderboard() {
    if (!this.state) {
      console.warn('[GridPanel] refreshMultiLeaderboard: no state');
      return;
    }

    try {
      this._leaderboardData = await this.state.getMultiLeaderboard(5);
      this.renderLeaderboardContent();
      this.updateMyRanks();
    } catch (err) {
      console.error('Failed to fetch multi-leaderboard:', err);
      // Show error state instead of staying on "Loading..."
      const contentEl = this.container?.querySelector('#gw-leaderboard-content');
      if (contentEl) {
        contentEl.innerHTML = '<div style="color:#ef4444;text-align:center;">Failed to load</div>';
      }
    }
  }

  /**
   * v1.4: Render leaderboard content for current tab
   */
  renderLeaderboardContent() {
    const contentEl = this.container?.querySelector('#gw-leaderboard-content');
    if (!contentEl || !this._leaderboardData) return;

    const tab = this._currentLeaderboardTab;
    const entries = this._leaderboardData[tab] || [];

    if (entries.length === 0) {
      contentEl.innerHTML = '<div style="color:#6b7280;text-align:center;">No data yet</div>';
      return;
    }

    const colors = {
      scholar: '#fbbf24',
      banker: '#22d3ee',
      general: '#a855f7'
    };
    const color = colors[tab] || '#9ca3af';

    const html = entries.map((entry, i) => {
      const isMe = entry.username === this.state?.username;
      const name = entry.real_name || entry.username || 'Unknown';
      const displayName = name.length > 12 ? name.slice(0, 10) + '...' : name;
      return `
        <div class="gw-lb-entry${isMe ? ' my-entry' : ''}">
          <span style="color:${isMe ? '#00ff41' : '#e2e8f0'};">${i + 1}. ${displayName}</span>
          <span style="color:${color};font-weight:bold;">${entry.value}</span>
        </div>
      `;
    }).join('');

    contentEl.innerHTML = html;
  }

  /**
   * v1.4: Update my ranks display
   */
  updateMyRanks() {
    const data = this._leaderboardData;
    if (!data?.playerRanks) return;

    const scholarEl = this.container?.querySelector('#gw-rank-scholar');
    const bankerEl = this.container?.querySelector('#gw-rank-banker');
    const generalEl = this.container?.querySelector('#gw-rank-general');

    if (scholarEl && data.playerRanks.scholar) {
      scholarEl.textContent = `#${data.playerRanks.scholar.rank}`;
      scholarEl.style.color = '#fbbf24';
    }
    if (bankerEl && data.playerRanks.banker) {
      bankerEl.textContent = `#${data.playerRanks.banker.rank}`;
      bankerEl.style.color = '#22d3ee';
    }
    if (generalEl && data.playerRanks.general) {
      generalEl.textContent = `#${data.playerRanks.general.rank}`;
      generalEl.style.color = '#a855f7';
    }
  }

  /**
   * v1.3.2: Show resync indicator (panel-local, not global toast)
   */
  _showResyncIndicator() {
    let indicator = this.container?.querySelector('#gw-resync-indicator');
    if (!indicator && this.container) {
      indicator = document.createElement('div');
      indicator.id = 'gw-resync-indicator';
      indicator.style.cssText = `
        position: absolute;
        top: 8px;
        right: 48px;
        background: #1e293b;
        color: #fbbf24;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.65rem;
        display: none;
        align-items: center;
        gap: 4px;
        z-index: 10;
      `;
      indicator.innerHTML = '<span style="animation:spin 1s linear infinite;">⟳</span> SYNCING';
      const header = this.container.querySelector('#gw-header');
      if (header) {
        header.style.position = 'relative';
        header.appendChild(indicator);
      }
    }
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }

  /**
   * v1.3.2: Hide resync indicator
   */
  _hideResyncIndicator() {
    const indicator = this.container?.querySelector('#gw-resync-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * v1.3.2: Show session end overlay with rankings
   */
  _showSessionEndOverlay(summary, rankings) {
    // Remove existing overlay if present
    const existing = document.getElementById('gw-session-end-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gw-session-end-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
    `;

    const rankingsHtml = (rankings || []).map((r, i) => `
      <div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center;${i === 0 ? 'color:#ffbf00;font-weight:bold;font-size:1rem;' : 'color:#e2e8f0;'}">
        <span>${i === 0 ? '👑' : `#${i + 1}`} ${r.username}</span>
        <span>${r.territories} cells</span>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="background:#0f172a;border:2px solid #00ff41;border-radius:8px;padding:24px 32px;max-width:400px;text-align:center;">
        <div style="font-size:1.5rem;color:#00ff41;margin-bottom:8px;">🏆 SESSION COMPLETE</div>
        <div style="color:#9ca3af;font-size:0.85rem;margin-bottom:20px;">
          ${summary?.mapFillPercent || 0}% map claimed • ${summary?.playerCount || 0} players
        </div>
        <div style="text-align:left;border:1px solid #374151;border-radius:4px;overflow:hidden;margin-bottom:16px;">
          ${rankingsHtml || '<div style="padding:12px;color:#6b7280;text-align:center;">No rankings available</div>'}
        </div>
        <div style="color:#64748b;font-size:0.75rem;margin-bottom:16px;">
          Drills still work • Grid Wars paused
        </div>
        <button id="gw-session-end-close" style="
          background: #374151;
          color: #e2e8f0;
          border: none;
          padding: 8px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-family: monospace;
          font-size: 0.85rem;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close button handler
    document.getElementById('gw-session-end-close')?.addEventListener('click', () => {
      overlay.remove();
    });
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
