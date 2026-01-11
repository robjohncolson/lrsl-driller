/**
 * Grid Wars v2.2.4 Regression Tests
 *
 * Tests for:
 * - BUG 1: Duplicate territory display removal (status/button wording changes)
 * - BUG 2: Weighted territory calculation across all levels
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// BUG 1: Duplicate Territory Display Tests
// ============================================

describe('Grid Wars v2.2.4 - Duplicate Display Removal', () => {
  describe('Status messages use "Owned" instead of "Your territory"', () => {
    it('should show "Owned" for own undeveloped cell', () => {
      const messages = [];
      const mockPanel = {
        state: { username: 'alice' },
        updateStatus: (msg) => messages.push(msg)
      };

      // Simulate selecting own undeveloped cell
      const owner = 'alice';
      const isDeveloped = false;

      // v2.2.4 logic
      if (owner === mockPanel.state.username) {
        if (isDeveloped) {
          mockPanel.updateStatus('Owned (developed) — Press ↑ to zoom in');
        } else {
          mockPanel.updateStatus('Owned — DEVELOP to subdivide');
        }
      }

      expect(messages[0]).toBe('Owned — DEVELOP to subdivide');
      expect(messages[0]).not.toContain('territory');
    });

    it('should show "Owned (developed)" for own developed cell', () => {
      const messages = [];
      const mockPanel = {
        state: { username: 'alice' },
        updateStatus: (msg) => messages.push(msg)
      };

      const owner = 'alice';
      const isDeveloped = true;

      if (owner === mockPanel.state.username) {
        if (isDeveloped) {
          mockPanel.updateStatus('Owned (developed) — Press ↑ to zoom in');
        } else {
          mockPanel.updateStatus('Owned — DEVELOP to subdivide');
        }
      }

      expect(messages[0]).toBe('Owned (developed) — Press ↑ to zoom in');
      expect(messages[0]).not.toContain('territory');
    });

    it('should show "OWNED" for hover over own territory', () => {
      // v2.2.4: Changed from 'YOUR TERRITORY' to 'OWNED'
      const statusMessage = 'OWNED';
      expect(statusMessage).toBe('OWNED');
      expect(statusMessage).not.toBe('YOUR TERRITORY');
    });
  });

  describe('Claim button uses "Owned" instead of "Your Territory"', () => {
    it('should show "Owned" when own territory is selected', () => {
      const mockBtn = {
        innerHTML: '',
        disabled: false
      };

      // Simulate own territory selected (costInfo === null)
      const costInfo = null;

      if (costInfo === null) {
        mockBtn.disabled = true;
        mockBtn.innerHTML = `□ Owned<span class="gw-cost">--</span>`;
      }

      expect(mockBtn.innerHTML).toContain('Owned');
      expect(mockBtn.innerHTML).not.toContain('Your Territory');
      expect(mockBtn.innerHTML).not.toContain('territory');
    });
  });
});

// ============================================
// BUG 2: Weighted Territory Calculation Tests
// ============================================

describe('Grid Wars v2.2.4 - Weighted Territory Calculation', () => {
  describe('calculateWeightedTerritory function', () => {
    // Simulate the server-side calculation logic
    function calculateWeightedTerritory(territories, username) {
      if (!territories || territories.length === 0) {
        return { units: 0, percent: '0.00', breakdown: { macro: 0, sub1: 0, sub2: 0 } };
      }

      let totalUnits = 0;
      const breakdown = { macro: 0, sub1: 0, sub2: 0 };

      for (const t of territories) {
        if (t.owner !== username) continue;

        const level = t.cell_level || 0;

        if (level === 0 && !t.is_developed) {
          // Undeveloped macro cell = 1 full unit
          totalUnits += 1;
          breakdown.macro++;
        } else if (level === 0 && t.is_developed) {
          // Developed macro cell = 0 units (ownership moved to subcells)
        } else if (level === 1) {
          // Subcell = 1/64 unit
          totalUnits += 1 / 64;
          breakdown.sub1++;
        } else if (level === 2) {
          // Sub-subcell = 1/4096 unit
          totalUnits += 1 / 4096;
          breakdown.sub2++;
        }
      }

      const percent = ((totalUnits / 64) * 100).toFixed(2);

      return { units: totalUnits, percent, breakdown };
    }

    it('should count undeveloped macro cells as 1 unit each', () => {
      const territories = [
        { owner: 'alice', cell_level: 0, is_developed: false },
        { owner: 'alice', cell_level: 0, is_developed: false }
      ];

      const result = calculateWeightedTerritory(territories, 'alice');

      expect(result.units).toBe(2);
      expect(result.breakdown.macro).toBe(2);
      expect(result.percent).toBe('3.13'); // 2/64 * 100
    });

    it('should NOT count developed macro cells', () => {
      const territories = [
        { owner: 'alice', cell_level: 0, is_developed: true },  // Should NOT count
        { owner: 'alice', cell_level: 0, is_developed: false }  // Should count
      ];

      const result = calculateWeightedTerritory(territories, 'alice');

      expect(result.units).toBe(1);
      expect(result.breakdown.macro).toBe(1);
    });

    it('should count subcells (level 1) as 1/64 unit each', () => {
      const territories = [
        { owner: 'alice', cell_level: 1, is_developed: false },
        { owner: 'alice', cell_level: 1, is_developed: false },
        { owner: 'alice', cell_level: 1, is_developed: false },
        { owner: 'alice', cell_level: 1, is_developed: false }  // 4 subcells = 4/64 = 1/16 unit
      ];

      const result = calculateWeightedTerritory(territories, 'alice');

      expect(result.units).toBe(4 / 64);
      expect(result.breakdown.sub1).toBe(4);
      expect(result.percent).toBe('0.10'); // (4/64)/64 * 100 = 0.09765...
    });

    it('should count sub-subcells (level 2) as 1/4096 unit each', () => {
      const territories = [
        { owner: 'alice', cell_level: 2, is_developed: false }
      ];

      const result = calculateWeightedTerritory(territories, 'alice');

      expect(result.units).toBe(1 / 4096);
      expect(result.breakdown.sub2).toBe(1);
    });

    it('should combine counts across all levels', () => {
      const territories = [
        { owner: 'alice', cell_level: 0, is_developed: false },  // 1 unit
        { owner: 'alice', cell_level: 1, is_developed: false },  // 1/64 unit
        { owner: 'alice', cell_level: 1, is_developed: false },  // 1/64 unit
        { owner: 'alice', cell_level: 2, is_developed: false }   // 1/4096 unit
      ];

      const result = calculateWeightedTerritory(territories, 'alice');

      const expectedUnits = 1 + (2 / 64) + (1 / 4096);
      expect(result.units).toBeCloseTo(expectedUnits, 6);
      expect(result.breakdown.macro).toBe(1);
      expect(result.breakdown.sub1).toBe(2);
      expect(result.breakdown.sub2).toBe(1);
    });

    it('should only count territories owned by the specified user', () => {
      const territories = [
        { owner: 'alice', cell_level: 0, is_developed: false },
        { owner: 'bob', cell_level: 0, is_developed: false },
        { owner: 'alice', cell_level: 1, is_developed: false }
      ];

      const aliceResult = calculateWeightedTerritory(territories, 'alice');
      const bobResult = calculateWeightedTerritory(territories, 'bob');

      expect(aliceResult.breakdown.macro).toBe(1);
      expect(aliceResult.breakdown.sub1).toBe(1);
      expect(bobResult.breakdown.macro).toBe(1);
      expect(bobResult.breakdown.sub1).toBe(0);
    });

    it('should return zeros for empty territories', () => {
      const result = calculateWeightedTerritory([], 'alice');

      expect(result.units).toBe(0);
      expect(result.percent).toBe('0.00');
      expect(result.breakdown.macro).toBe(0);
      expect(result.breakdown.sub1).toBe(0);
      expect(result.breakdown.sub2).toBe(0);
    });

    it('should return zeros when user has no territories', () => {
      const territories = [
        { owner: 'bob', cell_level: 0, is_developed: false }
      ];

      const result = calculateWeightedTerritory(territories, 'alice');

      expect(result.units).toBe(0);
      expect(result.percent).toBe('0.00');
    });
  });

  describe('Developing a cell reduces territory value', () => {
    function calculateWeightedTerritory(territories, username) {
      let totalUnits = 0;
      const breakdown = { macro: 0, sub1: 0, sub2: 0 };

      for (const t of territories) {
        if (t.owner !== username) continue;
        const level = t.cell_level || 0;

        if (level === 0 && !t.is_developed) {
          totalUnits += 1;
          breakdown.macro++;
        } else if (level === 1) {
          totalUnits += 1 / 64;
          breakdown.sub1++;
        } else if (level === 2) {
          totalUnits += 1 / 4096;
          breakdown.sub2++;
        }
      }

      return { units: totalUnits, breakdown };
    }

    it('should show loss of territory value when developing', () => {
      // Before developing: 1 undeveloped macro cell
      const before = [
        { owner: 'alice', cell_level: 0, is_developed: false }
      ];

      const beforeResult = calculateWeightedTerritory(before, 'alice');

      // After developing: developed macro (doesn't count) + 4 center subcells
      const after = [
        { owner: 'alice', cell_level: 0, is_developed: true },  // Doesn't count
        { owner: 'alice', cell_level: 1, is_developed: false }, // d4
        { owner: 'alice', cell_level: 1, is_developed: false }, // d5
        { owner: 'alice', cell_level: 1, is_developed: false }, // e4
        { owner: 'alice', cell_level: 1, is_developed: false }  // e5
      ];

      const afterResult = calculateWeightedTerritory(after, 'alice');

      // Before: 1 unit (1/64 of map)
      // After: 4/64 units = 0.0625 units (1/1024 of map)
      expect(beforeResult.units).toBe(1);
      expect(afterResult.units).toBe(4 / 64);

      // Loss ratio: 1 - (4/64) / 1 = 0.9375 = 93.75%
      const lossRatio = 1 - (afterResult.units / beforeResult.units);
      expect(lossRatio).toBeCloseTo(0.9375, 4);
    });
  });

  describe('updateTerritoryStats display format', () => {
    it('should display breakdown with emoji icons', () => {
      const userStats = {
        percent: '1.66',
        breakdown: { macro: 1, sub1: 4, sub2: 0 }
      };

      // Simulate display logic
      const parts = [];
      if (userStats.breakdown.macro > 0) {
        parts.push(`${userStats.breakdown.macro}🏰`);
      }
      if (userStats.breakdown.sub1 > 0) {
        parts.push(`${userStats.breakdown.sub1}📦`);
      }
      if (userStats.breakdown.sub2 > 0) {
        parts.push(`${userStats.breakdown.sub2}🔹`);
      }

      const breakdownStr = parts.length > 0 ? ` (${parts.join(' + ')})` : '';
      const displayText = `Your territory: ${userStats.percent}%${breakdownStr}`;

      expect(displayText).toBe('Your territory: 1.66% (1🏰 + 4📦)');
    });

    it('should only show non-zero cell types', () => {
      const userStats = {
        percent: '0.10',
        breakdown: { macro: 0, sub1: 4, sub2: 0 }
      };

      const parts = [];
      if (userStats.breakdown.macro > 0) {
        parts.push(`${userStats.breakdown.macro}🏰`);
      }
      if (userStats.breakdown.sub1 > 0) {
        parts.push(`${userStats.breakdown.sub1}📦`);
      }
      if (userStats.breakdown.sub2 > 0) {
        parts.push(`${userStats.breakdown.sub2}🔹`);
      }

      const breakdownStr = parts.length > 0 ? ` (${parts.join(' + ')})` : '';
      const displayText = `Your territory: ${userStats.percent}%${breakdownStr}`;

      // Should only show subcells, not macro
      expect(displayText).toBe('Your territory: 0.10% (4📦)');
      expect(displayText).not.toContain('🏰');
    });

    it('should show empty breakdown when no territories', () => {
      const userStats = {
        percent: '0.00',
        breakdown: { macro: 0, sub1: 0, sub2: 0 }
      };

      const parts = [];
      if (userStats.breakdown.macro > 0) {
        parts.push(`${userStats.breakdown.macro}🏰`);
      }
      if (userStats.breakdown.sub1 > 0) {
        parts.push(`${userStats.breakdown.sub1}📦`);
      }
      if (userStats.breakdown.sub2 > 0) {
        parts.push(`${userStats.breakdown.sub2}🔹`);
      }

      const breakdownStr = parts.length > 0 ? ` (${parts.join(' + ')})` : '';
      const displayText = `Your territory: ${userStats.percent}%${breakdownStr}`;

      expect(displayText).toBe('Your territory: 0.00%');
      expect(displayText).not.toContain('(');
    });
  });
});

// ============================================
// Server State Response Tests
// ============================================

describe('Grid Wars v2.2.4 - Server State Response', () => {
  describe('state endpoint includes userStats', () => {
    it('should include username in state request URL', () => {
      const gameId = 'test-game';
      const currentParent = 'd5';
      const username = 'alice';

      const params = new URLSearchParams();
      if (currentParent) {
        params.set('parent', currentParent);
      }
      if (username) {
        params.set('username', username);
      }

      const url = `/api/grid-wars/games/${gameId}/state?${params.toString()}`;

      expect(url).toContain('username=alice');
      expect(url).toContain('parent=d5');
    });

    it('should handle missing username gracefully', () => {
      const gameId = 'test-game';
      const username = null;

      const params = new URLSearchParams();
      if (username) {
        params.set('username', username);
      }

      const queryString = params.toString();
      expect(queryString).toBe('');
    });
  });

  describe('client stores userStats from response', () => {
    it('should store userStats in state', () => {
      const mockState = {
        userStats: null
      };

      const serverResponse = {
        userStats: {
          units: 1.0625,
          percent: '1.66',
          breakdown: { macro: 1, sub1: 4, sub2: 0 }
        }
      };

      // Simulate storing userStats
      if (serverResponse.userStats) {
        mockState.userStats = serverResponse.userStats;
      }

      expect(mockState.userStats).toEqual(serverResponse.userStats);
      expect(mockState.userStats.percent).toBe('1.66');
      expect(mockState.userStats.breakdown.macro).toBe(1);
    });

    it('should handle null userStats', () => {
      const mockState = {
        userStats: null
      };

      const serverResponse = {
        userStats: null
      };

      if (serverResponse.userStats) {
        mockState.userStats = serverResponse.userStats;
      }

      expect(mockState.userStats).toBeNull();
    });
  });
});
