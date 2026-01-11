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
      },
      // v1.6: Real-time leaderboard updates
      onLeaderboardUpdate: (leaderboard) => {
        this._leaderboardData = leaderboard;
        this.renderLeaderboardContent();
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
            <!-- v1.5: Scarcity phase indicator -->
            <div id="gw-scarcity-status" style="display:none;align-items:center;gap:4px;background:#1e293b;padding:4px 8px;border-radius:4px;" title="Land scarcity phase">
              <span id="gw-scarcity-icon" style="color:#00ff41;">🌱</span>
              <span id="gw-scarcity-text" style="font-weight:bold;color:#67e8f9;font-size:0.6rem;">LAND RUSH</span>
            </div>
            <!-- v1.5: Velocity tier indicator -->
            <div id="gw-velocity-status" style="display:none;align-items:center;gap:4px;background:#1e293b;padding:4px 8px;border-radius:4px;" title="Earning velocity (pts/min)">
              <span id="gw-velocity-icon" style="color:#67e8f9;">❄️</span>
              <span id="gw-velocity-text" style="font-weight:bold;color:#67e8f9;font-size:0.6rem;">IDLE</span>
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
            <span style="color:#22d3ee;">2.</span> <strong style="color:#e2e8f0;">Claim</strong> - Click a cell to claim (40 pts) or takeover enemy territory
          </div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">3.</span> <strong style="color:#e2e8f0;">Develop</strong> - Subdivide your cell into 64 subcells (100 pts)<br>
            <span style="font-size:0.65rem;color:#64748b;margin-left:12px;">You keep the center 4 subcells, others become unclaimed</span>
          </div>

          <div style="color:#94a3b8;margin-bottom:8px;">
            <span style="color:#22d3ee;">4.</span> <strong style="color:#e2e8f0;">Drill</strong> - Force-subdivide an enemy cell at 85%+ map fill (75 pts)<br>
            <span style="font-size:0.65rem;color:#64748b;margin-left:12px;">You get the corner cell, they keep the center 4</span>
          </div>

          <div style="color:#94a3b8;">
            <span style="color:#22d3ee;">5.</span> <strong style="color:#e2e8f0;">Navigate</strong> - Click to select, ↑ to zoom into developed cells, ↓/ESC to zoom out
          </div>

          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;color:#64748b;font-size:0.65rem;">
            Controls: Click = Select | ↑ Arrow = Zoom In | ↓ Arrow/ESC = Zoom Out | CLAIM button = Claim
          </div>
        </div>

        <!-- Main Toggle Header -->
        <div id="gw-toggle" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#1f2937;cursor:pointer;border-bottom:1px solid #374151;">
          <div style="font-size:0.7rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Map & Actions</div>
          <span id="gw-expand-icon" style="color:#9ca3af;font-size:0.8rem;">▼</span>
        </div>

        <!-- Expandable content -->
        <div id="gw-content" style="display:none;">
          <!-- v2.0: Breadcrumb Navigation -->
          <div id="gw-breadcrumb" style="display:none;padding:6px 12px;background:#0a0a0a;border-bottom:1px solid #166534;font-size:0.7rem;">
            <span id="gw-breadcrumb-content" style="color:#22d3ee;">MAP</span>
          </div>

          <!-- v2.2.3: Level Indicator (always visible, prominent) -->
          <div id="gw-level-indicator" style="padding:8px 12px;background:rgba(0,255,255,0.05);border-bottom:1px solid #166534;text-align:center;">
            <div id="gw-level-display" style="font-size:16px;font-weight:bold;color:#0ff;text-shadow:0 0 8px #0ff40;">
              📍 LEVEL 1 — ROOT
            </div>
            <div id="gw-territory-stats" style="font-size:11px;color:#6b7280;margin-top:4px;">
              Your territory: -- | Total claimed: --
            </div>
          </div>

          <!-- Mini Grid -->
          <div style="padding:8px;background:#030712;">
            <div id="gw-canvas-container" style="position:relative;width:280px;height:280px;margin:0 auto;background:#000;border:1px solid #14532d;border-radius:4px;overflow:hidden;">
              <canvas id="gw-canvas"></canvas>
            </div>
          </div>

          <!-- v2.1.5: Selected Cell Coordinates -->
          <div id="gw-coords-section" style="display:none;padding:8px 12px;background:#0f172a;border-bottom:1px solid #1e3a5f;">
            <div id="gw-coords-display" style="font-size:16px;font-weight:bold;color:#22d3ee;font-family:monospace;text-align:center;">
              📍 --
            </div>
            <div id="gw-coords-level" style="font-size:10px;color:#64748b;text-align:center;margin-top:2px;">
              Click a cell to select
            </div>
          </div>

          <!-- Action button -->
          <div style="padding:8px 12px;background:#1f2937;">
            <div style="font-size:0.65rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Actions</div>
            <div style="display:flex;gap:8px;">
              <button class="gw-action-btn" data-action="claim" style="flex:1;" disabled>
                □ Select Cell<span class="gw-cost">--</span>
              </button>
            </div>
            <!-- v2.0: Develop/Drill buttons (hidden by default) -->
            <div id="gw-hierarchy-actions" style="display:none;margin-top:8px;border-top:1px solid #374151;padding-top:8px;">
              <button id="gw-develop-btn" class="gw-action-btn" style="display:none;width:100%;background:#1e3a5f;border-color:#22d3ee;" disabled>
                🏗️ DEVELOP<span class="gw-cost">100⚡</span>
              </button>
              <!-- v2.1.5: Tooltip explaining develop mechanic -->
              <div id="gw-develop-hint" style="display:none;font-size:10px;color:#64748b;margin-top:4px;text-align:center;">
                Creates 64 subcells. You keep center 4. Other 60 become neutral.
              </div>
              <button id="gw-drill-btn" class="gw-action-btn" style="display:none;width:100%;background:#5f1e1e;border-color:#ef4444;margin-top:6px;" disabled>
                ⛏️ DRILL IN<span class="gw-cost">75⚡</span>
              </button>
              <div id="gw-drill-hint" style="display:none;font-size:10px;color:#64748b;margin-top:4px;text-align:center;">
                Force-subdivide enemy cell. You get corner (a1), they keep center 4.
              </div>
              <!-- v2.2: Gift button -->
              <button id="gw-gift-btn" class="gw-action-btn" style="display:none;width:100%;background:#2d4a2d;border-color:#22c55e;margin-top:6px;">
                🎁 GIFT<span class="gw-cost">FREE</span>
              </button>
              <div id="gw-gift-hint" style="display:none;font-size:10px;color:#64748b;margin-top:4px;text-align:center;">
                Give this cell to another player (no cost).
              </div>
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

          <!-- v1.6.1: Single Leaderboard (territory count only) -->
          <div id="gw-leaderboard-section" style="border-top:1px solid #374151;">
            <div style="padding:6px 8px;background:#0a0a0a;display:flex;align-items:center;justify-content:space-between;">
              <span style="color:#fbbf24;font-size:0.7rem;font-weight:bold;">🏰 TERRITORY HELD</span>
              <span id="gw-my-rank" style="color:#6b7280;font-size:0.6rem;">Rank: --</span>
            </div>
            <div id="gw-leaderboard-content" style="padding:8px;background:#0f172a;max-height:250px;overflow-y:auto;font-size:0.65rem;">
              <div style="color:#6b7280;text-align:center;">Loading...</div>
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
        /* v2.0: Breadcrumb styles */
        .gw-breadcrumb-part {
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 3px;
          transition: background 0.2s;
        }
        .gw-breadcrumb-part:hover {
          background: rgba(34, 211, 238, 0.2);
        }
        .gw-breadcrumb-separator {
          color: #6b7280;
          margin: 0 4px;
        }
        /* v1.6: Leaderboard styles (single view, no tabs) */
        #gw-leaderboard-content::-webkit-scrollbar {
          width: 4px;
        }
        #gw-leaderboard-content::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
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
    this.updateLevelIndicator();  // v2.2.3: Initial level display

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

    // v2.2.1: Action button - claim selected cell (not auto-claim on canvas click)
    this.container.querySelectorAll('.gw-action-btn[data-action="claim"]').forEach(btn => {
      btn.addEventListener('click', () => this.handleClaimButtonClick());
    });

    // Keyboard controls
    this.setupKeyboardControls();

    // v1.6: Single leaderboard (no tabs)
    this._leaderboardData = null;

    // v2.0: Develop button
    const developBtn = this.container.querySelector('#gw-develop-btn');
    if (developBtn) {
      developBtn.addEventListener('click', () => this.handleDevelop());
    }

    // v2.0: Drill button
    const drillBtn = this.container.querySelector('#gw-drill-btn');
    if (drillBtn) {
      drillBtn.addEventListener('click', () => this.handleDrill());
    }

    // v2.2: Gift button
    const giftBtn = this.container.querySelector('#gw-gift-btn');
    if (giftBtn) {
      giftBtn.addEventListener('click', () => this.handleGift());
    }
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
   * v2.0: Escape/Backspace now zoom out when inside a developed cell
   */
  async handleKeydown(e) {
    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // v2.0: Escape/Backspace - zoom out if inside a developed cell
    if (e.key === 'Escape' || e.key === 'Backspace') {
      const navState = this.state?.getNavigationState?.();
      if (navState && navState.currentLevel > 0) {
        e.preventDefault();
        await this.state.zoomOut();
        this.updateBreadcrumb();
        this.updateLevelIndicator();  // v2.2.3: Update level on zoom
        this.syncRendererState();
        return;
      }
      // Fallback: ESC collapses panel if at root level
      if (e.key === 'Escape' && this.isExpanded) {
        e.preventDefault();
        this.toggleExpand();
        return;
      }
      return;
    }

    // Only handle movement when panel is expanded
    if (!this.isExpanded) return;

    // v2.1.5: Arrow key navigation in hierarchy mode
    if (GRID_WARS_CONFIG.hierarchyEnabled) {
      // Arrow Up - zoom into selected developed cell
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this._selectedForAction?.address) {
          const cell = this.state.territories.get(`${this._selectedForAction.x},${this._selectedForAction.y}`);
          if (cell?.is_developed) {
            await this.state.zoomIn(this._selectedForAction.address);
            this.updateBreadcrumb();
            this.updateLevelIndicator();  // v2.2.3: Update level on zoom
            this.syncRendererState();
            this.updateHierarchyActions();
            this.updateStatus(`Zoomed into ${this._selectedForAction.address.toUpperCase()}`);
          } else {
            this.updateStatus('Select a developed cell (🔲) to zoom in');
          }
        }
        return;
      }

      // Arrow Down - zoom out
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const navState = this.state?.getNavigationState?.();
        if (navState && navState.currentLevel > 0) {
          await this.state.zoomOut();
          this.updateBreadcrumb();
          this.updateLevelIndicator();  // v2.2.3: Update level on zoom
          this.syncRendererState();
          this.updateHierarchyActions();
          this.updateStatus('Zoomed out');
        } else {
          this.updateStatus('Already at root level');
        }
        return;
      }

      // Spacebar can still claim at selected cell
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (this._selectedForAction) {
          await this.handleClaimAtPosition();
        }
      }
      return;
    }

    // Legacy mode: arrow key movement
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
      // Own territory - v2.2.4: Changed wording to avoid duplication
      this.updateStatus('OWNED');
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
   * Claim territory at current avatar position or selected cell
   * v2.2.1: Works with selected cell when in hierarchy mode
   */
  async handleClaimAtPosition() {
    if (!this.state) return;

    // v2.2.1: In hierarchy mode, use selected cell instead of avatar position
    if (GRID_WARS_CONFIG.hierarchyEnabled && this._selectedForAction) {
      await this.handleClaimButtonClick();
      return;
    }

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
      this.updateClaimButton();

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
   * v2.2.1: Fixed to prevent double rendering - reuse existing renderer if present
   * v2.2.2: Fixed blank grid - ensure minimum canvas size of 200px
   */
  initCanvas() {
    const canvas = this.container.querySelector('#gw-canvas');
    if (!canvas) return;

    // v1.6.2: Use config mapSize instead of hardcoded 20
    const mapSize = GRID_WARS_CONFIG.mapSize || 8;

    // v2.2.1: Only create renderer if it doesn't exist, otherwise just resize and redraw
    if (this.renderer) {
      // Renderer exists - resize (handles canvas size internally) and mark dirty to redraw
      this.renderer.resize();
      this.renderer._staticDirty = true;  // Force redraw of static layer
      this.syncRendererState();
      return;
    }

    // First time initialization - set canvas size
    // v2.2.3: Use explicit container dimensions (280px set in HTML)
    // The container has fixed width:280px;height:280px, so use that directly
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    // Use container dimensions if available, otherwise fall back to 280 (the explicit HTML value)
    const size = (containerWidth > 0 && containerHeight > 0)
      ? Math.min(containerWidth, containerHeight, 300)
      : 280;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    console.log('[GridPanel] Creating renderer with mapSize:', mapSize, 'size:', size, 'containerWidth:', containerWidth);

    this.renderer = new GridRenderer(canvas, {
      gridSize: mapSize,
      cellSize: size / mapSize
    });

    // v2.0: Enable presence dots mode (replaces moveable avatars)
    // v2.1.2: Added logging to verify mode is enabled
    console.log('[GridPanel] hierarchyEnabled:', GRID_WARS_CONFIG.hierarchyEnabled);
    if (GRID_WARS_CONFIG.hierarchyEnabled) {
      this.renderer.setUsePresenceDots(true);
      console.log('[GridPanel] Presence dots mode ENABLED (chevrons disabled)');
    } else {
      console.log('[GridPanel] Legacy avatar mode (chevrons visible)');
    }

    // Mouse events on canvas - only add once
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
      // v2.2.3: Delay canvas init until after browser layout recalculation
      // Using requestAnimationFrame ensures the container has proper dimensions
      requestAnimationFrame(() => {
        this.initCanvas();
      });
      // v1.4: Refresh multi-leaderboard
      this.refreshMultiLeaderboard();
    } else {
      content.style.display = 'none';
      icon.textContent = '▼';
    }
  }

  /**
   * Handle canvas click - SELECT cell (v2.2.1: no longer auto-claims)
   * v2.0: Click on developed cell zooms in
   * v2.2.1: Click = select, CLAIM button = claim (no auto-claim)
   */
  async onCanvasClick(e) {
    const cell = this.renderer.mouseToGrid(e.clientX, e.clientY);
    if (!cell) return;

    this.selectedCell = cell;
    this.renderer.pulseCell(cell.x, cell.y, '#ffffff', 300);

    // v2.1.5: Update coordinate display
    this.updateCoordsDisplay(cell.x, cell.y);

    // v2.2.3: Removed auto-zoom on developed cell click
    // Click now just selects the cell; use Up Arrow to zoom into developed cells

    const owner = this.state.getTerritoryOwner(cell.x, cell.y);

    // v2.0: Show develop/drill actions for selected cell
    this.updateHierarchyActions(cell.x, cell.y, owner);

    // v2.2.1: Store selected cell for action button handlers
    const localAddress = String.fromCharCode(97 + cell.x) + (cell.y + 1);
    const fullAddress = this.state?.currentParent
      ? `${this.state.currentParent}.${localAddress}`
      : localAddress;
    this._selectedForAction = {
      x: cell.x,
      y: cell.y,
      address: fullAddress,
      owner
    };

    // v2.2.1: Draw persistent selection highlight (cyan border)
    if (this.renderer) {
      this.renderer.setSelectedCell(cell.x, cell.y);
    }

    // v2.2.4: Update status based on cell state (no auto-claim, no auto-zoom)
    // Changed wording to avoid "territory" duplication with stats display
    const isDeveloped = this.state?.isDeveloped?.(cell.x, cell.y);
    if (owner === this.state.username) {
      if (isDeveloped) {
        this.updateStatus('Owned (developed) — Press ↑ to zoom in');
      } else {
        this.updateStatus('Owned — DEVELOP to subdivide');
      }
    } else if (owner) {
      if (isDeveloped) {
        this.updateStatus(`${owner}'s developed cell — Press ↑ to zoom in`);
      } else {
        this.updateStatus(`Enemy territory (${owner}) — Click CLAIM to attack`);
      }
    } else {
      this.updateStatus(`Neutral cell — Click CLAIM to capture`);
    }

    // v2.2.1: Update claim button state
    this.updateClaimButton();
  }

  /**
   * v2.2.1: Update claim button text and state based on selected cell
   */
  updateClaimButton() {
    const claimBtn = this.container.querySelector('.gw-action-btn[data-action="claim"]');
    if (!claimBtn) return;

    const selected = this._selectedForAction;
    if (!selected) {
      claimBtn.disabled = true;
      claimBtn.innerHTML = `□ Select Cell<span class="gw-cost">--</span>`;
      return;
    }

    const points = this.state?.getActionPoints() || 0;
    const costInfo = this.state?.getClaimCostAt(selected.x, selected.y);

    if (costInfo === null) {
      // Own territory - can't claim - v2.2.4: Changed wording
      claimBtn.disabled = true;
      claimBtn.innerHTML = `□ Owned<span class="gw-cost">--</span>`;
    } else if (costInfo.isEnemy) {
      // Enemy territory - show attack
      claimBtn.disabled = points < costInfo.cost;
      claimBtn.innerHTML = `⚔️ Attack<span class="gw-cost">${costInfo.cost}⚡</span>`;
    } else {
      // Neutral - show claim
      claimBtn.disabled = points < costInfo.cost;
      claimBtn.innerHTML = `🚩 Claim<span class="gw-cost">${costInfo.cost}⚡</span>`;
    }
  }

  /**
   * v2.2.1: Handle CLAIM button click (separate from canvas click)
   */
  async handleClaimButtonClick() {
    if (!this._selectedForAction || !this.state) {
      this.updateStatus('Select a cell first');
      return;
    }

    const { x, y, owner } = this._selectedForAction;

    // Can't claim own territory
    if (owner === this.state.username) {
      this.updateStatus('You already own this territory');
      return;
    }

    const isTakeover = !!owner;

    try {
      await this.state.claimTerritory(x, y);
      if (isTakeover) {
        sounds.takeover();
        this.updateStatus(`Took over (${x}, ${y})!`);
      } else {
        sounds.claim();
        this.updateStatus(`Claimed (${x}, ${y})!`);
      }

      this.syncRendererState();
      this.updateButtonStates();
      this.updatePointsDisplay();
      this.updateClaimButton();
      this.updateLevelIndicator();  // v2.2.3: Update stats after claim

      // Clear selection after successful claim
      this._selectedForAction = null;
      this.selectedCell = null;
      if (this.renderer) {
        this.renderer.setSelectedCell(null, null);
      }
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
   * v2.0: Added hierarchy data (is_developed, address, cell_level), presence dots
   * v2.1.2: Added debug logging for territory sync
   */
  syncRendererState() {
    if (!this.renderer || !this.state) return;

    const renderState = this.state.getRenderState();

    // v2.1.2: Debug logging
    const ownedCount = renderState.territories.filter(t => t.owner).length;
    console.log('[GridPanel] syncRendererState:', {
      totalTerritories: renderState.territories.length,
      ownedTerritories: ownedCount,
      players: renderState.players?.length || 0,
      currentLevel: renderState.currentLevel,
      currentParent: renderState.currentParent
    });

    // Clear and reload territories with all data
    this.renderer.territories = {};
    for (const t of renderState.territories) {
      this.renderer.setTerritory(t.x, t.y, t.owner, {
        strength: t.strength,
        node_type: t.node_type,
        is_developed: t.is_developed,  // v2.0
        address: t.address,            // v2.0
        cell_level: t.cell_level       // v2.0
      });
    }

    // v2.0: Update online players for presence dots
    if (GRID_WARS_CONFIG.hierarchyEnabled && this.renderer.setOnlinePlayers) {
      const onlinePlayers = (renderState.players || []).map(p => p.username);
      this.renderer.setOnlinePlayers(onlinePlayers);
    }

    // v2.2: Update player colors and subcell summaries for mini-mosaic rendering
    if (renderState.playerColors && this.renderer.setPlayerColors) {
      this.renderer.setPlayerColors(renderState.playerColors);
    }
    if (renderState.subcellSummaries && this.renderer.setSubcellSummaries) {
      this.renderer.setSubcellSummaries(renderState.subcellSummaries);
    }

    // Update avatars (legacy - only used when presence dots disabled)
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
   * v1.5: Update scarcity phase display
   */
  updateScarcityDisplay() {
    const container = this.container.querySelector('#gw-scarcity-status');
    const iconEl = this.container.querySelector('#gw-scarcity-icon');
    const textEl = this.container.querySelector('#gw-scarcity-text');

    if (!container || !this.state) return;

    const scarcity = this.state.getScarcityPhase();

    if (!scarcity || scarcity.phase === 'EXPANSION') {
      // Hide during expansion phase (land is plentiful)
      container.style.display = 'none';
      return;
    }

    // Show and update based on phase
    container.style.display = 'flex';

    // Set icon and text based on phase
    const phaseStyles = {
      TENSION: { icon: '⚡', color: '#fbbf24', text: 'TIGHTENING' },
      SCARCITY: { icon: '🔥', color: '#ef4444', text: 'SCARCE' },
      SATURATION: { icon: '💎', color: '#a855f7', text: 'FULL' }
    };

    const style = phaseStyles[scarcity.phase] || phaseStyles.TENSION;

    if (iconEl) iconEl.textContent = style.icon;
    if (textEl) {
      textEl.textContent = style.text;
      textEl.style.color = style.color;
    }

    container.title = scarcity.message || `Land scarcity: ${scarcity.phase}`;
  }

  /**
   * v1.5: Update velocity tier display
   */
  updateVelocityDisplay() {
    const container = this.container.querySelector('#gw-velocity-status');
    const iconEl = this.container.querySelector('#gw-velocity-icon');
    const textEl = this.container.querySelector('#gw-velocity-text');

    if (!container || !this.state) return;

    const velocity = this.state.getVelocityTier ? this.state.getVelocityTier() : null;

    if (!velocity || velocity.tier === 'IDLE') {
      // Hide when idle (no bonus)
      container.style.display = 'none';
      return;
    }

    // Show and update based on tier
    container.style.display = 'flex';

    // Set icon and text based on tier
    const tierStyles = {
      BLAZING: { icon: '🔥', color: '#ef4444', text: 'BLAZING' },
      FLOWING: { icon: '⚡', color: '#fbbf24', text: 'FLOWING' },
      ACTIVE: { icon: '💧', color: '#22d3ee', text: 'ACTIVE' }
    };

    const style = tierStyles[velocity.tier] || tierStyles.ACTIVE;

    if (iconEl) iconEl.textContent = style.icon;
    if (textEl) {
      textEl.textContent = style.text;
      textEl.style.color = style.color;
    }

    const discountPct = Math.round((velocity.discount || 0) * 100);
    container.title = `Velocity: ${velocity.tier} (${discountPct}% off attacks)`;
  }

  /**
   * Update class goal progress display
   * v1.6.1: Class Goal UI removed - this is now a no-op for backwards compatibility
   */
  updateClassGoalDisplay() {
    // No-op: Class Goal UI removed in v1.6.1
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
   * v2.0: Added breadcrumb update
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
    this.updateScarcityDisplay();    // v1.5
    this.updateVelocityDisplay();    // v1.5
    this.updateBreadcrumb();         // v2.0
    this.updateLevelIndicator();     // v2.2.3
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
   * v1.6: Fetch and update single leaderboard (lifetime_earned only)
   */
  async refreshLeaderboard() {
    if (!this.state) {
      console.warn('[GridPanel] refreshLeaderboard: no state');
      return;
    }

    try {
      // Use the unified leaderboard which returns lifetime_earned
      this._leaderboardData = await this.state.getLeaderboard(10);
      this.renderLeaderboardContent();
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      const contentEl = this.container?.querySelector('#gw-leaderboard-content');
      if (contentEl) {
        contentEl.innerHTML = '<div style="color:#ef4444;text-align:center;">Failed to load</div>';
      }
    }
  }

  /**
   * v1.6: Render single leaderboard content
   * v2.0: Shows macro + subcell counts when hierarchy is enabled
   * v2.2: Added player colors for visual identification
   */
  renderLeaderboardContent() {
    const contentEl = this.container?.querySelector('#gw-leaderboard-content');
    if (!contentEl) return;

    const entries = this._leaderboardData || [];
    // v2.2: Get player colors from state
    const playerColors = this.state?.playerColors || {};

    if (entries.length === 0) {
      contentEl.innerHTML = '<div style="color:#6b7280;text-align:center;">No data yet</div>';
      return;
    }

    // v2.0: Sort by weighted score (macro cells count more than subcells)
    // Each macro cell is worth 64 subcells for ranking purposes
    const sortedEntries = [...entries].sort((a, b) => {
      const aScore = (a.macro_cells || 0) * 64 + (a.sub_cells || 0);
      const bScore = (b.macro_cells || 0) * 64 + (b.sub_cells || 0);
      // Fallback to territories_count if v2.0 fields not present
      if (aScore === 0 && bScore === 0) {
        return (b.territories_count || 0) - (a.territories_count || 0);
      }
      return bScore - aScore;
    });

    // Find current player's rank (in sorted order)
    const myIndex = sortedEntries.findIndex(e => e.username === this.state?.username);
    const myRankEl = this.container?.querySelector('#gw-my-rank');
    if (myRankEl) {
      myRankEl.textContent = myIndex >= 0 ? `Rank: #${myIndex + 1}` : 'Rank: --';
      myRankEl.style.color = myIndex >= 0 ? '#fbbf24' : '#6b7280';
    }

    const html = sortedEntries.map((entry, i) => {
      const isMe = entry.username === this.state?.username;
      const name = entry.real_name || entry.username || 'Unknown';
      const displayName = name.length > 12 ? name.slice(0, 10) + '...' : name;

      // v2.2: Get player color
      const playerColor = playerColors[entry.username] || '#888';

      // v2.0: Show macro + sub cells if hierarchy data present
      const macro = entry.macro_cells || 0;
      const sub = entry.sub_cells || 0;
      const hasHierarchy = macro > 0 || sub > 0;

      let cellDisplay;
      if (hasHierarchy && GRID_WARS_CONFIG.hierarchyEnabled) {
        // Format: "3 + 12 📦" (macro + subcells)
        cellDisplay = sub > 0
          ? `${macro} + ${sub} 📦`
          : `${macro} 🏰`;
      } else {
        // Legacy: just show total
        const cells = entry.territories_count || 0;
        cellDisplay = `${cells} 🏰`;
      }

      // v2.2: Colored leaderboard with player color swatch
      return `
        <div class="gw-lb-entry${isMe ? ' my-entry' : ''}" style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #222;${isMe ? 'background:rgba(0,255,65,0.1);margin:0 -4px;padding:4px;border-radius:3px;' : ''}">
          <span style="width:14px;height:14px;background:${playerColor};border-radius:3px;box-shadow:0 0 4px ${playerColor}40;flex-shrink:0;"></span>
          <span style="color:${isMe ? '#00ff41' : playerColor};font-weight:bold;flex:1;text-shadow:0 0 8px ${playerColor}40;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i + 1}. ${displayName}</span>
          <span style="color:#aaa;font-size:11px;font-family:monospace;">${cellDisplay}</span>
        </div>
      `;
    }).join('');

    contentEl.innerHTML = html;
  }

  // v1.6: Aliases for backwards compatibility
  async refreshMultiLeaderboard() {
    return this.refreshLeaderboard();
  }

  updateMyRanks() {
    // No-op in v1.6 (single leaderboard handles this in renderLeaderboardContent)
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

  // ============================================
  // v2.0: HIERARCHY NAVIGATION METHODS
  // ============================================

  /**
   * v2.0: Update breadcrumb navigation display
   */
  updateBreadcrumb() {
    const breadcrumbContainer = this.container?.querySelector('#gw-breadcrumb');
    const breadcrumbContent = this.container?.querySelector('#gw-breadcrumb-content');
    if (!breadcrumbContainer || !breadcrumbContent || !this.state) return;

    const navState = this.state.getNavigationState?.() || { currentLevel: 0, breadcrumb: [] };

    if (navState.currentLevel === 0) {
      // At root level - hide breadcrumb
      breadcrumbContainer.style.display = 'none';
      return;
    }

    // Show breadcrumb when zoomed in
    breadcrumbContainer.style.display = 'block';

    // Build breadcrumb HTML
    const parts = ['MAP', ...navState.breadcrumb.map(p => p.toUpperCase())];
    const html = parts.map((part, i) => {
      const isLast = i === parts.length - 1;
      const address = i === 0 ? null : navState.breadcrumb.slice(0, i).join('.');

      if (isLast) {
        // Current location - not clickable
        return `<span style="color:#00ff41;font-weight:bold;">${part}</span>`;
      } else {
        // Clickable ancestor
        return `<span class="gw-breadcrumb-part" data-address="${address || ''}">${part}</span><span class="gw-breadcrumb-separator">›</span>`;
      }
    }).join('');

    breadcrumbContent.innerHTML = html;

    // Add click handlers
    breadcrumbContent.querySelectorAll('.gw-breadcrumb-part').forEach(el => {
      el.addEventListener('click', async () => {
        const address = el.dataset.address || null;
        await this.state.zoomTo(address);
        this.updateBreadcrumb();
        this.syncRendererState();
        this.updateHierarchyActions();
      });
    });
  }

  /**
   * v2.0: Update develop/drill button visibility based on selected cell
   * v2.2: Added gift button for owned cells
   */
  updateHierarchyActions(x = null, y = null, owner = null) {
    const container = this.container?.querySelector('#gw-hierarchy-actions');
    const developBtn = this.container?.querySelector('#gw-develop-btn');
    const drillBtn = this.container?.querySelector('#gw-drill-btn');
    const giftBtn = this.container?.querySelector('#gw-gift-btn');
    const developHint = this.container?.querySelector('#gw-develop-hint');
    const drillHint = this.container?.querySelector('#gw-drill-hint');
    const giftHint = this.container?.querySelector('#gw-gift-hint');

    if (!container || !developBtn || !drillBtn || !this.state) return;

    // Hide all by default
    container.style.display = 'none';
    developBtn.style.display = 'none';
    drillBtn.style.display = 'none';
    if (giftBtn) giftBtn.style.display = 'none';
    if (developHint) developHint.style.display = 'none';
    if (drillHint) drillHint.style.display = 'none';
    if (giftHint) giftHint.style.display = 'none';

    // Check if hierarchy is enabled
    if (!GRID_WARS_CONFIG.hierarchyEnabled) return;

    // No cell selected
    if (x === null || y === null) {
      this._selectedForAction = null;
      return;
    }

    // Store selected cell for action
    const address = this.state.getCellAddress(x, y);
    this._selectedForAction = { x, y, address, owner };

    // v2.2: Show gift button for owned cells (even if developed)
    if (owner === this.state.username && giftBtn) {
      container.style.display = 'block';
      giftBtn.style.display = 'block';
      if (giftHint) giftHint.style.display = 'block';
    }

    // Check if cell is already developed
    if (this.state.isDeveloped?.(x, y)) {
      return; // Already developed - no develop/drill actions available
    }

    const points = this.state.getActionPoints();
    const navState = this.state.getNavigationState?.() || { currentLevel: 0 };

    // Check if at max subdivision level
    const maxLevel = GRID_WARS_CONFIG.maxSubdivisionLevel || 2;
    if (navState.currentLevel >= maxLevel) {
      return; // Can't subdivide further
    }

    container.style.display = 'block';

    // DEVELOP button - for own territory
    if (owner === this.state.username) {
      developBtn.style.display = 'block';
      if (developHint) developHint.style.display = 'block';
      const cost = GRID_WARS_CONFIG.developmentCost || 100;
      developBtn.disabled = points < cost;
      developBtn.querySelector('.gw-cost').textContent = `${cost}⚡`;
    }

    // DRILL button - for enemy territory at 85%+ saturation
    if (owner && owner !== this.state.username) {
      const canDrill = this.state.canDrill?.() || false;
      if (canDrill) {
        drillBtn.style.display = 'block';
        if (drillHint) drillHint.style.display = 'block';
        const cost = GRID_WARS_CONFIG.drillCost || 75;
        drillBtn.disabled = points < cost;
        drillBtn.querySelector('.gw-cost').textContent = `${cost}⚡`;
      }
    }
  }

  /**
   * v2.0: Handle DEVELOP button click
   */
  async handleDevelop() {
    if (!this._selectedForAction || !this.state) return;

    const { address } = this._selectedForAction;
    if (!address) {
      this.updateStatus('No cell selected for development');
      return;
    }

    try {
      await this.state.developCell(address);
      sounds.claim();
      this.showToast(`Developed ${address.toUpperCase()} — Zoom in to claim subcells!`);
      this.syncRendererState();
      this.updateHierarchyActions();
      this._selectedForAction = null;
    } catch (err) {
      sounds.error();
      this.updateStatus(`Develop failed: ${err.message}`);
    }
  }

  /**
   * v2.2: Handle GIFT button click
   * v2.2.1: Shows dropdown with online players instead of text prompt
   */
  async handleGift() {
    if (!this._selectedForAction || !this.state) return;

    const { address } = this._selectedForAction;
    if (!address) {
      this.updateStatus('No cell selected for gifting');
      return;
    }

    // v2.2.3: Get list of other players (exclude self)
    // Fix: Use entries() since username is the Map key, not a property on the value
    const players = Array.from(this.state.players?.entries() || [])
      .filter(([username, p]) => username && username !== 'undefined' && username !== this.state.username)
      .map(([username, p]) => ({ ...p, username }))
      .sort((a, b) => a.username.localeCompare(b.username));

    if (players.length === 0) {
      this.updateStatus('No other players to gift to');
      return;
    }

    // Create modal with dropdown
    const modal = document.createElement('div');
    modal.id = 'gw-gift-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); display: flex; align-items: center;
      justify-content: center; z-index: 10000;
    `;
    modal.innerHTML = `
      <div style="background:#1a1a2e; border:1px solid #374151; border-radius:8px;
                  padding:20px; max-width:300px; width:90%;">
        <div style="color:#fbbf24; font-size:14px; font-weight:bold; margin-bottom:12px;">
          🎁 Gift ${address.toUpperCase()}
        </div>
        <div style="color:#9ca3af; font-size:12px; margin-bottom:12px;">
          Select a player to receive this cell:
        </div>
        <select id="gw-gift-recipient" style="width:100%; padding:8px; background:#0a0a0a;
                border:1px solid #374151; border-radius:4px; color:#e5e7eb; font-size:13px;
                margin-bottom:16px;">
          ${players.map(p => `<option value="${p.username}">${p.username} (${p.territories_count || 0} cells)</option>`).join('')}
        </select>
        <div style="display:flex; gap:8px;">
          <button id="gw-gift-cancel" style="flex:1; padding:8px; background:#374151;
                  border:none; border-radius:4px; color:#e5e7eb; cursor:pointer;">
            Cancel
          </button>
          <button id="gw-gift-confirm" style="flex:1; padding:8px; background:#22c55e;
                  border:none; border-radius:4px; color:#000; cursor:pointer; font-weight:bold;">
            Gift
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle modal interactions
    const closeModal = () => modal.remove();
    modal.querySelector('#gw-gift-cancel').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    modal.querySelector('#gw-gift-confirm').onclick = async () => {
      const recipient = modal.querySelector('#gw-gift-recipient').value;
      closeModal();

      try {
        await this.state.giftCell(address, recipient);
        sounds.claim();
        this.showToast(`Gifted ${address.toUpperCase()} to ${recipient}!`);
        this.syncRendererState();
        this.updateHierarchyActions();
        this._selectedForAction = null;
      } catch (err) {
        sounds.error();
        this.updateStatus(`Gift failed: ${err.message}`);
      }
    };
  }

  /**
   * v2.1.5: Update coordinate display
   */
  updateCoordsDisplay(x, y) {
    const coordsSection = this.container.querySelector('#gw-coords-section');
    const coordsDisplay = this.container.querySelector('#gw-coords-display');
    const coordsLevel = this.container.querySelector('#gw-coords-level');

    if (!coordsSection || !coordsDisplay || !coordsLevel) return;

    if (x === undefined || y === undefined) {
      coordsSection.style.display = 'none';
      return;
    }

    coordsSection.style.display = 'block';

    // Build the full address
    const localAddress = String.fromCharCode(97 + x) + (y + 1);
    const currentParent = this.state?.currentParent;
    const fullAddress = currentParent ? `${currentParent}.${localAddress}` : localAddress;
    const level = this.state?.currentLevel || 0;

    // Get owner info
    const territory = this.state?.territories?.get(`${x},${y}`);
    const owner = territory?.owner;
    const isDeveloped = territory?.is_developed;

    // Display address
    coordsDisplay.innerHTML = `📍 ${fullAddress.toUpperCase()}`;

    // Display level and owner info
    // v2.2.3: Use 1-indexed level naming (LEVEL 1, 2, 3 instead of MACRO, LEVEL 1, 2)
    let levelText = `LEVEL ${level + 1}`;
    if (owner) {
      const ownerColor = owner === this.state.username ? '#22c55e' : '#ef4444';
      levelText += ` • <span style="color:${ownerColor};">${owner}</span>`;
    } else {
      levelText += ' • <span style="color:#64748b;">Neutral</span>';
    }
    if (isDeveloped) {
      levelText += ' • <span style="color:#22d3ee;">🔲 Developed</span>';
    }
    coordsLevel.innerHTML = levelText;
  }

  /**
   * v2.2.3: Update level indicator display
   * Called after navigation (zoom in/out) and on initial render
   */
  updateLevelIndicator() {
    const levelDisplay = this.container?.querySelector('#gw-level-display');
    if (!levelDisplay || !this.state) return;

    const navState = this.state.getNavigationState?.() || { currentLevel: 0, currentParent: null };
    const level = navState.currentLevel;

    // v2.2.3: Level naming is 1-indexed (Level 1, Level 2, Level 3)
    const displayLevel = level + 1;
    const levelName = `LEVEL ${displayLevel}`;

    // Show parent address when zoomed in
    let locationText;
    if (navState.currentParent) {
      locationText = `Inside ${navState.currentParent.toUpperCase()}`;
    } else {
      locationText = 'ROOT';
    }

    levelDisplay.innerHTML = `📍 ${levelName} — ${locationText}`;

    // Also update territory stats
    this.updateTerritoryStats();
  }

  /**
   * v2.2.4: Update territory stats display with weighted calculation
   * Uses server-provided userStats that accounts for all levels
   * Display format: "Your territory: X.XX% (N🏰 + M📦)" where:
   * - 🏰 = macro cells (undeveloped, level 0)
   * - 📦 = subcells (level 1)
   * - 🔹 = sub-subcells (level 2)
   */
  updateTerritoryStats() {
    const statsEl = this.container?.querySelector('#gw-territory-stats');
    if (!statsEl || !this.state) return;

    const userStats = this.state.userStats;
    const territories = this.state.territories;
    const username = this.state.username;

    // Calculate map fill percent from current level's territories
    let total = 0;
    const totalCells = (GRID_WARS_CONFIG.mapSize || 8) ** 2;
    for (const [key, cell] of territories || []) {
      if (cell.owner) {
        total++;
      }
    }
    const fillPercent = totalCells > 0 ? Math.round((total / totalCells) * 100) : 0;

    // Use weighted stats from server if available
    if (userStats) {
      const { percent, breakdown } = userStats;
      const parts = [];

      // Build breakdown string with emoji icons
      if (breakdown.macro > 0) {
        parts.push(`${breakdown.macro}🏰`);
      }
      if (breakdown.sub1 > 0) {
        parts.push(`${breakdown.sub1}📦`);
      }
      if (breakdown.sub2 > 0) {
        parts.push(`${breakdown.sub2}🔹`);
      }

      const breakdownStr = parts.length > 0 ? ` (${parts.join(' + ')})` : '';

      statsEl.innerHTML = `Your territory: <span style="color:#22c55e;font-weight:bold;">${percent}%</span>${breakdownStr} | Map filled: <span style="color:#fbbf24;">${fillPercent}%</span>`;
    } else {
      // Fallback: count at current level only (less accurate)
      let owned = 0;
      for (const [key, cell] of territories || []) {
        if (cell.owner === username) {
          owned++;
        }
      }
      const percent = totalCells > 0 ? Math.round((owned / totalCells) * 100) : 0;
      statsEl.innerHTML = `Your territory: <span style="color:#22c55e;font-weight:bold;">${owned}/${totalCells}</span> (${percent}%) | Map filled: <span style="color:#fbbf24;">${fillPercent}%</span>`;
    }
  }

  /**
   * v2.0: Handle DRILL button click
   */
  async handleDrill() {
    if (!this._selectedForAction || !this.state) return;

    const { address } = this._selectedForAction;
    if (!address) {
      this.updateStatus('No cell selected for drilling');
      return;
    }

    try {
      await this.state.drillCell(address);
      sounds.takeover();
      this.showToast(`Drilled into ${address.toUpperCase()} — You got the corner!`);
      this.syncRendererState();
      this.updateHierarchyActions();
      this._selectedForAction = null;
    } catch (err) {
      sounds.error();
      this.updateStatus(`Drill failed: ${err.message}`);
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
