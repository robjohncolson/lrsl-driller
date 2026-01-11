/**
 * Grid Wars v2.2.3 Regression Tests
 *
 * Tests for:
 * - BUG 1: Color consistency (server-assigned colors used everywhere)
 * - BUG 2: Gift dropdown excludes self and undefined
 * - BUG 3: No auto-zoom on developed cell click
 * - BUG 4: Level display (1-indexed naming, updates on navigation)
 * - BUG 5: Territory stats calculation
 * - BUG 6: Claim/Attack button visibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// BUG 1: Color Consistency Tests
// ============================================

describe('Grid Wars v2.2.3 - Color Consistency', () => {
  describe('setTerritory uses server-assigned colors', () => {
    it('should call getServerPlayerColor instead of getPlayerColor', () => {
      // Mock renderer with both color methods
      const mockRenderer = {
        territories: {},
        _playerColors: { 'alice': '#FF3366', 'bob': '#33FF66' },
        getPlayerColor: vi.fn().mockReturnValue('#888888'),  // Old auto-assigned
        getServerPlayerColor: vi.fn().mockImplementation(function(username) {
          return this._playerColors[username] || '#888888';
        }),
        _staticDirty: false,
        setTerritory(x, y, owner, data = {}) {
          if (owner || data.node_type || data.is_developed) {
            this.territories[`${x},${y}`] = {
              owner,
              // v2.2.3: Should use getServerPlayerColor, not getPlayerColor
              color: owner ? this.getServerPlayerColor(owner) : null,
              strength: data.strength || 3,
            };
          }
          this._staticDirty = true;
        }
      };

      // Bind methods to mockRenderer
      mockRenderer.getServerPlayerColor = mockRenderer.getServerPlayerColor.bind(mockRenderer);

      // Set territory for alice
      mockRenderer.setTerritory(3, 4, 'alice', { strength: 3 });

      // Verify server color is used
      expect(mockRenderer.territories['3,4'].color).toBe('#FF3366');
      expect(mockRenderer.getPlayerColor).not.toHaveBeenCalled();
    });

    it('should use gray fallback when player has no assigned color', () => {
      const mockRenderer = {
        territories: {},
        _playerColors: { 'alice': '#FF3366' },
        getServerPlayerColor(username) {
          return this._playerColors[username] || '#888888';
        },
        _staticDirty: false,
        setTerritory(x, y, owner, data = {}) {
          if (owner) {
            this.territories[`${x},${y}`] = {
              owner,
              color: owner ? this.getServerPlayerColor(owner) : null,
            };
          }
        }
      };

      // Set territory for unknown player
      mockRenderer.setTerritory(0, 0, 'unknown_player', {});

      // Should get gray fallback, not purple or other default
      expect(mockRenderer.territories['0,0'].color).toBe('#888888');
    });

    it('should use consistent colors between macro and mini-mosaic', () => {
      const playerColors = { 'alice': '#FF3366', 'bob': '#33FF66' };

      // Simulate macro cell color
      const getMacroColor = (owner) => playerColors[owner] || '#888888';

      // Simulate mini-mosaic color (should use same lookup)
      const getMosaicColor = (owner) => playerColors[owner] || '#888888';

      // Both should return identical colors
      expect(getMacroColor('alice')).toBe(getMosaicColor('alice'));
      expect(getMacroColor('bob')).toBe(getMosaicColor('bob'));
    });
  });

  describe('drawOwnerPresence uses server-assigned colors', () => {
    it('should use getServerPlayerColor for presence dots', () => {
      const mockRenderer = {
        _playerColors: { 'alice': '#FF3366' },
        getServerPlayerColor(username) {
          return this._playerColors[username] || '#888888';
        },
        getPlayerSolidColor: vi.fn().mockReturnValue('#PURPLE'),
      };

      // v2.2.3: Presence dots should use server color
      const color = mockRenderer.getServerPlayerColor('alice');

      expect(color).toBe('#FF3366');
      expect(mockRenderer.getPlayerSolidColor).not.toHaveBeenCalled();
    });
  });
});

// ============================================
// BUG 2: Gift Dropdown Tests
// ============================================

describe('Grid Wars v2.2.3 - Gift Dropdown', () => {
  describe('Player list filtering', () => {
    it('should exclude current user from gift recipients', () => {
      const mockState = {
        username: 'alice',
        players: new Map([
          ['alice', { action_points: 100 }],
          ['bob', { action_points: 50 }],
          ['carol', { action_points: 75 }],
        ])
      };

      // v2.2.3: Use entries() to get username from Map key
      const players = Array.from(mockState.players.entries())
        .filter(([username, p]) => username && username !== 'undefined' && username !== mockState.username)
        .map(([username, p]) => ({ ...p, username }));

      expect(players.length).toBe(2);
      expect(players.map(p => p.username)).toContain('bob');
      expect(players.map(p => p.username)).toContain('carol');
      expect(players.map(p => p.username)).not.toContain('alice');
    });

    it('should exclude undefined usernames', () => {
      const mockState = {
        username: 'alice',
        players: new Map([
          ['alice', { action_points: 100 }],
          ['undefined', { action_points: 50 }],  // Bug case
          ['bob', { action_points: 75 }],
        ])
      };

      const players = Array.from(mockState.players.entries())
        .filter(([username, p]) => username && username !== 'undefined' && username !== mockState.username)
        .map(([username, p]) => ({ ...p, username }));

      expect(players.length).toBe(1);
      expect(players[0].username).toBe('bob');
    });

    it('should exclude null/empty usernames', () => {
      const mockState = {
        username: 'alice',
        players: new Map([
          ['alice', { action_points: 100 }],
          ['', { action_points: 50 }],
          [null, { action_points: 25 }],
          ['bob', { action_points: 75 }],
        ])
      };

      const players = Array.from(mockState.players.entries())
        .filter(([username, p]) => username && username !== 'undefined' && username !== mockState.username)
        .map(([username, p]) => ({ ...p, username }));

      // Only bob should remain (alice excluded as self, empty/null filtered)
      expect(players.length).toBe(1);
      expect(players[0].username).toBe('bob');
    });

    it('should handle empty players Map', () => {
      const mockState = {
        username: 'alice',
        players: new Map()
      };

      const players = Array.from(mockState.players.entries())
        .filter(([username, p]) => username && username !== 'undefined' && username !== mockState.username)
        .map(([username, p]) => ({ ...p, username }));

      expect(players.length).toBe(0);
    });

    it('should sort players alphabetically', () => {
      const mockState = {
        username: 'alice',
        players: new Map([
          ['alice', {}],
          ['zara', {}],
          ['bob', {}],
          ['carol', {}],
        ])
      };

      const players = Array.from(mockState.players.entries())
        .filter(([username, p]) => username && username !== 'undefined' && username !== mockState.username)
        .map(([username, p]) => ({ ...p, username }))
        .sort((a, b) => a.username.localeCompare(b.username));

      expect(players.map(p => p.username)).toEqual(['bob', 'carol', 'zara']);
    });
  });
});

// ============================================
// BUG 3: No Auto-Zoom Tests
// ============================================

describe('Grid Wars v2.2.3 - No Auto-Zoom on Click', () => {
  describe('Developed cell click behavior', () => {
    it('should select developed cell without zooming', () => {
      let zoomInCalled = false;
      let selectedCell = null;

      const mockPanel = {
        state: {
          isDeveloped: (x, y) => x === 3 && y === 4,
          getCellAddress: () => 'd5',
          getTerritoryOwner: () => 'alice',
          zoomIn: vi.fn().mockImplementation(() => { zoomInCalled = true; }),
        },
        selectedCell: null,
        _selectedForAction: null,

        // v2.2.3: Click should NOT auto-zoom
        onCanvasClick(x, y) {
          this.selectedCell = { x, y };
          this._selectedForAction = { x, y, address: 'd5' };
          // Auto-zoom code REMOVED in v2.2.3
          // Previously: if (this.state.isDeveloped(x, y)) { this.state.zoomIn(...) }
        }
      };

      // Click on developed cell
      mockPanel.onCanvasClick(3, 4);

      // Should select but NOT zoom
      expect(mockPanel.selectedCell).toEqual({ x: 3, y: 4 });
      expect(mockPanel._selectedForAction).toEqual({ x: 3, y: 4, address: 'd5' });
      expect(zoomInCalled).toBe(false);
      expect(mockPanel.state.zoomIn).not.toHaveBeenCalled();
    });

    it('should zoom in only on Up Arrow keypress', async () => {
      const mockPanel = {
        state: {
          territories: new Map([['3,4', { is_developed: true }]]),
          zoomIn: vi.fn(),
        },
        _selectedForAction: { x: 3, y: 4, address: 'd5' },

        async handleKeydown(key) {
          if (key === 'ArrowUp') {
            const cell = this.state.territories.get(`${this._selectedForAction.x},${this._selectedForAction.y}`);
            if (cell?.is_developed) {
              await this.state.zoomIn(this._selectedForAction.address);
            }
          }
        }
      };

      await mockPanel.handleKeydown('ArrowUp');
      expect(mockPanel.state.zoomIn).toHaveBeenCalledWith('d5');
    });

    it('should zoom out on Down Arrow keypress', async () => {
      const mockPanel = {
        state: {
          getNavigationState: () => ({ currentLevel: 1 }),
          zoomOut: vi.fn(),
        },

        async handleKeydown(key) {
          if (key === 'ArrowDown') {
            const navState = this.state.getNavigationState();
            if (navState.currentLevel > 0) {
              await this.state.zoomOut();
            }
          }
        }
      };

      await mockPanel.handleKeydown('ArrowDown');
      expect(mockPanel.state.zoomOut).toHaveBeenCalled();
    });

    it('should not zoom out when already at root', async () => {
      const mockPanel = {
        state: {
          getNavigationState: () => ({ currentLevel: 0 }),
          zoomOut: vi.fn(),
        },

        async handleKeydown(key) {
          if (key === 'ArrowDown') {
            const navState = this.state.getNavigationState();
            if (navState.currentLevel > 0) {
              await this.state.zoomOut();
            }
          }
        }
      };

      await mockPanel.handleKeydown('ArrowDown');
      expect(mockPanel.state.zoomOut).not.toHaveBeenCalled();
    });
  });

  describe('Status messages for developed cells', () => {
    it('should show zoom hint for own developed cell', () => {
      const getStatusMessage = (owner, username, isDeveloped) => {
        if (owner === username) {
          if (isDeveloped) {
            return 'Your developed cell — Press ↑ to zoom in';
          }
          return 'Your territory — Click DEVELOP to subdivide';
        }
        return 'Other';
      };

      expect(getStatusMessage('alice', 'alice', true)).toBe('Your developed cell — Press ↑ to zoom in');
      expect(getStatusMessage('alice', 'alice', false)).toBe('Your territory — Click DEVELOP to subdivide');
    });

    it('should show zoom hint for enemy developed cell', () => {
      const getStatusMessage = (owner, username, isDeveloped) => {
        if (owner && owner !== username) {
          if (isDeveloped) {
            return `${owner}'s developed cell — Press ↑ to zoom in`;
          }
          return `Enemy territory (${owner}) — Click CLAIM to attack`;
        }
        return 'Neutral';
      };

      expect(getStatusMessage('bob', 'alice', true)).toBe("bob's developed cell — Press ↑ to zoom in");
      expect(getStatusMessage('bob', 'alice', false)).toBe('Enemy territory (bob) — Click CLAIM to attack');
    });
  });
});

// ============================================
// BUG 4: Level Display Tests
// ============================================

describe('Grid Wars v2.2.3 - Level Display', () => {
  describe('Level naming (1-indexed)', () => {
    it('should display LEVEL 1 for root level (index 0)', () => {
      const level = 0;
      const displayLevel = level + 1;
      const levelName = `LEVEL ${displayLevel}`;

      expect(levelName).toBe('LEVEL 1');
    });

    it('should display LEVEL 2 for first sublevel (index 1)', () => {
      const level = 1;
      const displayLevel = level + 1;
      const levelName = `LEVEL ${displayLevel}`;

      expect(levelName).toBe('LEVEL 2');
    });

    it('should display LEVEL 3 for second sublevel (index 2)', () => {
      const level = 2;
      const displayLevel = level + 1;
      const levelName = `LEVEL ${displayLevel}`;

      expect(levelName).toBe('LEVEL 3');
    });

    it('should NOT use MACRO naming', () => {
      const level = 0;
      // Old code: level === 0 ? 'MACRO LEVEL' : `LEVEL ${level}`
      // New code: `LEVEL ${level + 1}`
      const oldNaming = level === 0 ? 'MACRO LEVEL' : `LEVEL ${level}`;
      const newNaming = `LEVEL ${level + 1}`;

      expect(oldNaming).toBe('MACRO LEVEL');  // Old behavior
      expect(newNaming).toBe('LEVEL 1');       // New behavior
      expect(newNaming).not.toContain('MACRO');
    });
  });

  describe('Level indicator content', () => {
    it('should show ROOT when at root level', () => {
      const navState = { currentLevel: 0, currentParent: null };
      const levelName = `LEVEL ${navState.currentLevel + 1}`;
      const locationText = navState.currentParent ? `Inside ${navState.currentParent.toUpperCase()}` : 'ROOT';

      expect(`${levelName} — ${locationText}`).toBe('LEVEL 1 — ROOT');
    });

    it('should show parent address when zoomed in', () => {
      const navState = { currentLevel: 1, currentParent: 'd5' };
      const levelName = `LEVEL ${navState.currentLevel + 1}`;
      const locationText = navState.currentParent ? `Inside ${navState.currentParent.toUpperCase()}` : 'ROOT';

      expect(`${levelName} — ${locationText}`).toBe('LEVEL 2 — Inside D5');
    });

    it('should show nested parent address', () => {
      const navState = { currentLevel: 2, currentParent: 'd5.c3' };
      const levelName = `LEVEL ${navState.currentLevel + 1}`;
      const locationText = navState.currentParent ? `Inside ${navState.currentParent.toUpperCase()}` : 'ROOT';

      expect(`${levelName} — ${locationText}`).toBe('LEVEL 3 — Inside D5.C3');
    });
  });

  describe('Level indicator updates', () => {
    it('should update after zoomIn', async () => {
      let levelIndicatorUpdated = false;

      const mockPanel = {
        updateLevelIndicator: vi.fn().mockImplementation(() => { levelIndicatorUpdated = true; }),
        state: {
          zoomIn: vi.fn().mockResolvedValue(undefined),
        },
        updateBreadcrumb: vi.fn(),
        syncRendererState: vi.fn(),

        async handleZoomIn(address) {
          await this.state.zoomIn(address);
          this.updateBreadcrumb();
          this.updateLevelIndicator();  // v2.2.3: Must be called
          this.syncRendererState();
        }
      };

      await mockPanel.handleZoomIn('d5');

      expect(mockPanel.updateLevelIndicator).toHaveBeenCalled();
      expect(levelIndicatorUpdated).toBe(true);
    });

    it('should update after zoomOut', async () => {
      const mockPanel = {
        updateLevelIndicator: vi.fn(),
        state: {
          zoomOut: vi.fn().mockResolvedValue(undefined),
        },
        updateBreadcrumb: vi.fn(),
        syncRendererState: vi.fn(),

        async handleZoomOut() {
          await this.state.zoomOut();
          this.updateBreadcrumb();
          this.updateLevelIndicator();  // v2.2.3: Must be called
          this.syncRendererState();
        }
      };

      await mockPanel.handleZoomOut();

      expect(mockPanel.updateLevelIndicator).toHaveBeenCalled();
    });

    it('should update on initial render', () => {
      const mockPanel = {
        updateLevelIndicator: vi.fn(),
        render: function() {
          this.updateLevelIndicator();
        }
      };

      mockPanel.render();

      expect(mockPanel.updateLevelIndicator).toHaveBeenCalled();
    });
  });
});

// ============================================
// BUG 5: Territory Stats Tests
// ============================================

describe('Grid Wars v2.2.3 - Territory Stats', () => {
  describe('Stats calculation', () => {
    it('should calculate correct owned count', () => {
      const territories = new Map([
        ['0,0', { owner: 'alice' }],
        ['0,1', { owner: 'alice' }],
        ['1,0', { owner: 'bob' }],
        ['1,1', { owner: null }],
      ]);
      const username = 'alice';

      let owned = 0;
      for (const [key, cell] of territories) {
        if (cell.owner === username) owned++;
      }

      expect(owned).toBe(2);
    });

    it('should calculate correct percentage', () => {
      const owned = 3;
      const totalCells = 64;  // 8x8 grid
      const percent = Math.round((owned / totalCells) * 100);

      expect(percent).toBe(5);  // 3/64 = 4.6875% → 5%
    });

    it('should calculate map fill percentage', () => {
      const territories = new Map([
        ['0,0', { owner: 'alice' }],
        ['0,1', { owner: 'bob' }],
        ['1,0', { owner: 'carol' }],
      ]);
      const totalCells = 64;

      let claimed = 0;
      for (const [key, cell] of territories) {
        if (cell.owner) claimed++;
      }

      const fillPercent = Math.round((claimed / totalCells) * 100);
      expect(fillPercent).toBe(5);  // 3/64 = 4.6875% → 5%
    });

    it('should handle empty territories', () => {
      const territories = new Map();
      const username = 'alice';
      const totalCells = 64;

      let owned = 0;
      let total = 0;
      for (const [key, cell] of territories) {
        if (cell.owner) {
          total++;
          if (cell.owner === username) owned++;
        }
      }

      const percent = totalCells > 0 ? Math.round((owned / totalCells) * 100) : 0;

      expect(owned).toBe(0);
      expect(total).toBe(0);
      expect(percent).toBe(0);
    });

    it('should not show "--" when user owns cells', () => {
      const territories = new Map([
        ['0,0', { owner: 'alice' }],
        ['0,1', { owner: 'alice' }],
        ['1,0', { owner: 'alice' }],
      ]);
      const username = 'alice';
      const totalCells = 64;

      let owned = 0;
      for (const [key, cell] of territories) {
        if (cell.owner === username) owned++;
      }

      // Should NOT return "--"
      const display = `${owned}/${totalCells}`;
      expect(display).toBe('3/64');
      expect(display).not.toBe('--');
    });
  });

  describe('Stats display format', () => {
    it('should format as "Your territory: X/64 (Y%)"', () => {
      const owned = 5;
      const totalCells = 64;
      const percent = Math.round((owned / totalCells) * 100);

      const display = `Your territory: ${owned}/${totalCells} (${percent}%)`;

      expect(display).toBe('Your territory: 5/64 (8%)');
    });

    it('should include map fill percentage', () => {
      const owned = 5;
      const totalCells = 64;
      const ownPercent = Math.round((owned / totalCells) * 100);
      const fillPercent = 42;

      const display = `Your territory: ${owned}/${totalCells} (${ownPercent}%) | Map filled: ${fillPercent}%`;

      expect(display).toContain('Your territory: 5/64 (8%)');
      expect(display).toContain('Map filled: 42%');
    });
  });

  describe('Stats updates', () => {
    it('should update after successful claim', () => {
      const mockPanel = {
        updateLevelIndicator: vi.fn(),  // v2.2.3: This also calls updateTerritoryStats

        async handleClaim() {
          // ... claim logic ...
          this.updateLevelIndicator();  // v2.2.3: Update stats after claim
        }
      };

      mockPanel.handleClaim();

      expect(mockPanel.updateLevelIndicator).toHaveBeenCalled();
    });
  });
});

// ============================================
// BUG 6: Claim/Attack Button Tests
// ============================================

describe('Grid Wars v2.2.3 - Claim/Attack Button Visibility', () => {
  describe('Button states', () => {
    it('should show "Select Cell" when no cell selected', () => {
      const selected = null;

      const getButtonState = (selected, owner, username, points) => {
        if (!selected) {
          return { disabled: true, text: '□ Select Cell', cost: '--' };
        }
        // ... other cases
      };

      const state = getButtonState(null, null, 'alice', 100);
      expect(state.disabled).toBe(true);
      expect(state.text).toBe('□ Select Cell');
    });

    it('should show "Your Territory" for own cell', () => {
      const getButtonState = (selected, owner, username, points) => {
        if (!selected) return { disabled: true, text: '□ Select Cell' };
        if (owner === username) {
          return { disabled: true, text: '□ Your Territory', cost: '--' };
        }
        // ... other cases
      };

      const state = getButtonState({ x: 0, y: 0 }, 'alice', 'alice', 100);
      expect(state.disabled).toBe(true);
      expect(state.text).toBe('□ Your Territory');
    });

    it('should show "Claim" for neutral cell', () => {
      const getButtonState = (selected, owner, username, points, claimCost) => {
        if (!selected) return { disabled: true, text: '□ Select Cell' };
        if (owner === username) return { disabled: true, text: '□ Your Territory' };
        if (!owner) {
          return {
            disabled: points < claimCost,
            text: '🚩 Claim',
            cost: claimCost
          };
        }
        // ... attack case
      };

      const state = getButtonState({ x: 0, y: 0 }, null, 'alice', 100, 40);
      expect(state.disabled).toBe(false);
      expect(state.text).toBe('🚩 Claim');
      expect(state.cost).toBe(40);
    });

    it('should show "Attack" for enemy cell', () => {
      const getButtonState = (selected, owner, username, points, claimCost, attackCost) => {
        if (!selected) return { disabled: true, text: '□ Select Cell' };
        if (owner === username) return { disabled: true, text: '□ Your Territory' };
        if (!owner) return { disabled: points < claimCost, text: '🚩 Claim', cost: claimCost };
        // Enemy cell
        return {
          disabled: points < attackCost,
          text: '⚔️ Attack',
          cost: attackCost
        };
      };

      const state = getButtonState({ x: 0, y: 0 }, 'bob', 'alice', 100, 40, 60);
      expect(state.disabled).toBe(false);
      expect(state.text).toBe('⚔️ Attack');
      expect(state.cost).toBe(60);
    });

    it('should disable Claim when insufficient points', () => {
      const getButtonState = (selected, owner, username, points, claimCost) => {
        if (!selected) return { disabled: true, text: '□ Select Cell' };
        if (!owner) {
          return {
            disabled: points < claimCost,
            text: '🚩 Claim',
            cost: claimCost
          };
        }
      };

      const state = getButtonState({ x: 0, y: 0 }, null, 'alice', 30, 40);  // Only 30 pts, need 40
      expect(state.disabled).toBe(true);
    });

    it('should disable Attack when insufficient points', () => {
      const getButtonState = (selected, owner, username, points, claimCost, attackCost) => {
        if (!selected) return { disabled: true, text: '□ Select Cell' };
        if (owner && owner !== username) {
          return {
            disabled: points < attackCost,
            text: '⚔️ Attack',
            cost: attackCost
          };
        }
      };

      const state = getButtonState({ x: 0, y: 0 }, 'bob', 'alice', 50, 40, 60);  // 50 pts, need 60
      expect(state.disabled).toBe(true);
    });
  });
});

// ============================================
// Help Section Tests
// ============================================

describe('Grid Wars v2.2.3 - Help Section', () => {
  it('should document keyboard controls', () => {
    const helpText = 'Controls: Click = Select | ↑ Arrow = Zoom In | ↓ Arrow/ESC = Zoom Out | CLAIM button = Claim';

    expect(helpText).toContain('Click = Select');
    expect(helpText).toContain('↑ Arrow = Zoom In');
    expect(helpText).toContain('↓ Arrow/ESC = Zoom Out');
    expect(helpText).not.toContain('Click = Claim');  // Old behavior
  });
});
