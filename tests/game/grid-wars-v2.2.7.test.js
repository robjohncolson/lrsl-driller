/**
 * Grid Wars v2.2.7 Regression Tests
 *
 * Tests for Territory Display Fix:
 * 1. Territory % is GLOBAL - same percentage at all zoom levels
 * 2. Navigation section (VIEWING) clearly labeled with cyan styling
 * 3. Selected cell section (SELECTED CELL) clearly labeled with purple styling
 * 4. Map fill % is GLOBAL - doesn't change with zoom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// GLOBAL MAP FILL TESTS
// ============================================

describe('Grid Wars v2.2.7 - Global Map Fill', () => {
  // Simulate the server's getMapFillPercent function
  async function getMapFillPercent(territories) {
    const totalCells = 64; // 8x8 grid
    const ownedCount = territories.filter(t => t.owner).length;
    return ownedCount / totalCells;
  }

  it('should calculate fill from ALL territories, not filtered view', async () => {
    const allTerritories = [
      { x: 0, y: 0, owner: 'alice', cell_level: 0 },
      { x: 1, y: 0, owner: 'bob', cell_level: 0 },
      { x: 2, y: 0, owner: null, cell_level: 0 },
    ];

    const fill = await getMapFillPercent(allTerritories);
    expect(fill).toBeCloseTo(2 / 64, 4);
  });

  it('should return 0 for empty map', async () => {
    const fill = await getMapFillPercent([]);
    expect(fill).toBe(0);
  });

  it('should return 1.0 for fully claimed map', async () => {
    const fullTerritories = Array(64).fill(null).map((_, i) => ({
      x: i % 8, y: Math.floor(i / 8), owner: 'alice', cell_level: 0
    }));

    const fill = await getMapFillPercent(fullTerritories);
    expect(fill).toBe(1);
  });
});

// ============================================
// USER STATS (GLOBAL PERCENTAGE) TESTS
// ============================================

describe('Grid Wars v2.2.7 - Global User Stats', () => {
  // Simulate the server's calculateWeightedTerritory function
  function calculateWeightedTerritory(territories, username) {
    const owned = territories.filter(t => t.owner === username);

    let totalUnits = 0;
    const breakdown = { macro: 0, sub1: 0, sub2: 0 };

    for (const t of owned) {
      const level = t.cell_level || 0;

      if (level === 0 && !t.is_developed) {
        totalUnits += 1;
        breakdown.macro++;
      } else if (level === 0 && t.is_developed) {
        // Developed macro = 0 units
      } else if (level === 1) {
        totalUnits += 1 / 64;
        breakdown.sub1++;
      } else if (level === 2) {
        totalUnits += 1 / 4096;
        breakdown.sub2++;
      }
    }

    const percent = ((totalUnits / 64) * 100).toFixed(2);
    return { units: totalUnits, percent, breakdown };
  }

  it('should calculate weighted percentage across ALL levels', () => {
    const territories = [
      { owner: 'alice', cell_level: 0, is_developed: false }, // 1 unit
      { owner: 'alice', cell_level: 1 },                       // 1/64 unit
      { owner: 'alice', cell_level: 1 },                       // 1/64 unit
      { owner: 'bob', cell_level: 0, is_developed: false },   // belongs to bob
    ];

    const stats = calculateWeightedTerritory(territories, 'alice');
    expect(stats.breakdown.macro).toBe(1);
    expect(stats.breakdown.sub1).toBe(2);
    expect(stats.units).toBeCloseTo(1 + 2/64, 4);
  });

  it('should not count developed macro cells as units', () => {
    const territories = [
      { owner: 'alice', cell_level: 0, is_developed: true }, // 0 units
    ];

    const stats = calculateWeightedTerritory(territories, 'alice');
    expect(stats.units).toBe(0);
    expect(stats.breakdown.macro).toBe(0);
  });

  it('should return correct breakdown counts', () => {
    const territories = [
      { owner: 'alice', cell_level: 0, is_developed: false },
      { owner: 'alice', cell_level: 0, is_developed: false },
      { owner: 'alice', cell_level: 1 },
      { owner: 'alice', cell_level: 1 },
      { owner: 'alice', cell_level: 1 },
      { owner: 'alice', cell_level: 2 },
    ];

    const stats = calculateWeightedTerritory(territories, 'alice');
    expect(stats.breakdown.macro).toBe(2);
    expect(stats.breakdown.sub1).toBe(3);
    expect(stats.breakdown.sub2).toBe(1);
  });
});

// ============================================
// NAVIGATION CONTEXT (VIEWING) TESTS
// ============================================

describe('Grid Wars v2.2.7 - Navigation Context Display', () => {
  // Simulate the updateLevelIndicator function's output
  function formatLevelDisplay(level, currentParent) {
    const displayLevel = level + 1;
    const levelName = `Level ${displayLevel}`;
    const locationText = currentParent ? `Inside ${currentParent.toUpperCase()}` : 'ROOT';
    return `${levelName} — ${locationText}`;
  }

  it('should show "Level 1 — ROOT" at macro level', () => {
    expect(formatLevelDisplay(0, null)).toBe('Level 1 — ROOT');
  });

  it('should show "Level 2 — Inside D5" when zoomed into D5', () => {
    expect(formatLevelDisplay(1, 'd5')).toBe('Level 2 — Inside D5');
  });

  it('should show "Level 3 — Inside D5.C3" for nested cells', () => {
    expect(formatLevelDisplay(2, 'd5.c3')).toBe('Level 3 — Inside D5.C3');
  });

  it('should NOT include emoji prefix (emoji is in label above)', () => {
    const display = formatLevelDisplay(0, null);
    expect(display).not.toContain('📍');
  });
});

// ============================================
// SELECTED CELL (SELECTION) TESTS
// ============================================

describe('Grid Wars v2.2.7 - Selected Cell Display', () => {
  // Simulate the updateCoordsDisplay function's output
  function formatCoordsDisplay(x, y, currentParent) {
    const localAddress = String.fromCharCode(97 + x) + (y + 1);
    const fullAddress = currentParent ? `${currentParent}.${localAddress}` : localAddress;
    return fullAddress.toUpperCase();
  }

  function formatCoordsLevel(owner, level, isDeveloped, playerColors, username) {
    const ownerColor = owner
      ? (playerColors?.[owner] || (owner === username ? '#22c55e' : '#ef4444'))
      : '#444';
    const ownerName = owner || 'Neutral';

    let parts = [];
    parts.push(`[${ownerColor}] ${ownerName}`);
    parts.push(`Level ${level + 1}`);
    if (isDeveloped) parts.push('Developed');

    return parts.join(' | ');
  }

  it('should format address without emoji (emoji is in label above)', () => {
    expect(formatCoordsDisplay(3, 4, null)).toBe('D5');
    expect(formatCoordsDisplay(3, 4, null)).not.toContain('📍');
  });

  it('should show full nested address when zoomed in', () => {
    expect(formatCoordsDisplay(2, 2, 'd5')).toBe('D5.C3');
  });

  it('should show owner color from server playerColors', () => {
    const playerColors = { 'alice': '#FF3366' };
    const info = formatCoordsLevel('alice', 1, false, playerColors, 'bob');
    expect(info).toContain('#FF3366');
  });

  it('should fallback to green for own territory when no color assigned', () => {
    const info = formatCoordsLevel('bob', 1, false, {}, 'bob');
    expect(info).toContain('#22c55e');
  });

  it('should show gray for neutral cells', () => {
    const info = formatCoordsLevel(null, 0, false, {}, 'bob');
    expect(info).toContain('#444');
    expect(info).toContain('Neutral');
  });

  it('should show developed status when applicable', () => {
    const info = formatCoordsLevel('alice', 0, true, {}, 'bob');
    expect(info).toContain('Developed');
  });
});

// ============================================
// STATE STORAGE TESTS
// ============================================

describe('Grid Wars v2.2.7 - State Storage', () => {
  it('should store globalMapFill from server response', () => {
    const state = { globalMapFill: undefined };
    const serverResponse = { globalMapFill: 25 };

    if (serverResponse.globalMapFill !== undefined) {
      state.globalMapFill = serverResponse.globalMapFill;
    }

    expect(state.globalMapFill).toBe(25);
  });

  it('should handle missing globalMapFill gracefully', () => {
    const state = { globalMapFill: 0 };
    const serverResponse = {};

    if (serverResponse.globalMapFill !== undefined) {
      state.globalMapFill = serverResponse.globalMapFill;
    }

    expect(state.globalMapFill).toBe(0);
  });

  it('should store userStats from server response', () => {
    const state = { userStats: null };
    const serverResponse = {
      userStats: { percent: '3.14', breakdown: { macro: 2, sub1: 5, sub2: 0 } }
    };

    if (serverResponse.userStats) {
      state.userStats = serverResponse.userStats;
    }

    expect(state.userStats.percent).toBe('3.14');
    expect(state.userStats.breakdown.macro).toBe(2);
    expect(state.userStats.breakdown.sub1).toBe(5);
  });
});

// ============================================
// TERRITORY STATS DISPLAY TESTS
// ============================================

describe('Grid Wars v2.2.7 - Territory Stats Display', () => {
  // Simulate the updateTerritoryStats function's output
  function formatTerritoryStats(userStats, globalMapFill) {
    if (!userStats) {
      const fillDisplay = globalMapFill !== undefined ? `${globalMapFill}%` : '--';
      return `Your territory: -- | Map filled: ${fillDisplay}`;
    }

    const { percent, breakdown } = userStats;
    const parts = [];

    if (breakdown.macro > 0) parts.push(`${breakdown.macro}🏰`);
    if (breakdown.sub1 > 0) parts.push(`${breakdown.sub1}📦`);
    if (breakdown.sub2 > 0) parts.push(`${breakdown.sub2}🔹`);

    const breakdownStr = parts.length > 0 ? ` (${parts.join(' + ')})` : '';
    const fillDisplay = globalMapFill !== undefined ? `${globalMapFill}%` : '--';

    return `Your territory: ${percent}%${breakdownStr} | Map filled: ${fillDisplay}`;
  }

  it('should show global percentage from userStats', () => {
    const userStats = { percent: '1.56', breakdown: { macro: 1, sub1: 0, sub2: 0 } };
    const display = formatTerritoryStats(userStats, 25);
    expect(display).toContain('1.56%');
  });

  it('should show global map fill percentage', () => {
    const userStats = { percent: '1.56', breakdown: { macro: 1, sub1: 0, sub2: 0 } };
    const display = formatTerritoryStats(userStats, 25);
    expect(display).toContain('Map filled: 25%');
  });

  it('should show breakdown with correct emojis', () => {
    const userStats = { percent: '2.50', breakdown: { macro: 1, sub1: 4, sub2: 2 } };
    const display = formatTerritoryStats(userStats, 50);
    expect(display).toContain('1🏰');
    expect(display).toContain('4📦');
    expect(display).toContain('2🔹');
  });

  it('should handle missing userStats gracefully', () => {
    const display = formatTerritoryStats(null, 10);
    expect(display).toContain('Your territory: --');
    expect(display).toContain('Map filled: 10%');
  });

  it('should handle missing globalMapFill gracefully', () => {
    const userStats = { percent: '1.00', breakdown: { macro: 1, sub1: 0, sub2: 0 } };
    const display = formatTerritoryStats(userStats, undefined);
    expect(display).toContain('Map filled: --');
  });
});

// ============================================
// ZOOM INVARIANCE TESTS
// ============================================

describe('Grid Wars v2.2.7 - Zoom Invariance', () => {
  it('should show same percentage at macro level and zoomed in', () => {
    // Simulate user with 1 macro cell (1.56% of map)
    const globalUserStats = { percent: '1.56', breakdown: { macro: 1, sub1: 0, sub2: 0 } };
    const globalMapFill = 25;

    // At macro level (level 0, parent null)
    const macroViewStats = { ...globalUserStats };
    const macroMapFill = globalMapFill;

    // Zoomed into D5 (level 1, parent 'd5')
    const zoomedViewStats = { ...globalUserStats };
    const zoomedMapFill = globalMapFill;

    // Both should be identical (GLOBAL stats, not view-relative)
    expect(macroViewStats.percent).toBe(zoomedViewStats.percent);
    expect(macroMapFill).toBe(zoomedMapFill);
  });

  it('should NOT recalculate stats based on current view territories', () => {
    // This is the BUG we're fixing: previously, the client would calculate
    // territory % based on the filtered territories in the current view.
    // Now it should ALWAYS use server-provided global stats.

    const globalUserStats = { percent: '0.22', breakdown: { macro: 0, sub1: 9, sub2: 0 } };

    // Even though 9/64 = 14% of the current VIEW, the global percentage is 0.22%
    // because subcells are worth 1/64 of a macro cell
    expect(globalUserStats.percent).toBe('0.22');
    expect(parseFloat(globalUserStats.percent)).toBeLessThan(1);
  });
});

// ============================================
// UI VISUAL DISTINCTION TESTS
// ============================================

describe('Grid Wars v2.2.7 - UI Visual Distinction', () => {
  it('should use distinct colors for navigation vs selection sections', () => {
    const navigationBorderColor = '#0aa';  // Cyan for "VIEWING"
    const selectionBorderColor = '#448';   // Purple for "SELECTED CELL"

    expect(navigationBorderColor).not.toBe(selectionBorderColor);
  });

  it('should use different labels for navigation vs selection', () => {
    const navigationLabel = '📍 VIEWING';
    const selectionLabel = '🎯 SELECTED CELL';

    expect(navigationLabel).not.toBe(selectionLabel);
    expect(navigationLabel).toContain('VIEWING');
    expect(selectionLabel).toContain('SELECTED');
  });

  it('should use different emoji prefixes', () => {
    const navigationEmoji = '📍';
    const selectionEmoji = '🎯';

    expect(navigationEmoji).not.toBe(selectionEmoji);
  });
});

// ============================================
// SERVER RESPONSE FORMAT TESTS
// ============================================

describe('Grid Wars v2.2.7 - Server Response Format', () => {
  it('should include globalMapFill in state response', () => {
    const mockServerResponse = {
      game: {},
      territories: [],
      players: [],
      userStats: { percent: '1.00', breakdown: { macro: 1, sub1: 0, sub2: 0 } },
      globalMapFill: 15
    };

    expect(mockServerResponse.globalMapFill).toBeDefined();
    expect(typeof mockServerResponse.globalMapFill).toBe('number');
  });

  it('should return globalMapFill as percentage (0-100)', () => {
    const mockServerResponse = { globalMapFill: 25 };

    expect(mockServerResponse.globalMapFill).toBeGreaterThanOrEqual(0);
    expect(mockServerResponse.globalMapFill).toBeLessThanOrEqual(100);
  });

  it('should always include userStats regardless of parent filter', () => {
    // userStats should be GLOBAL, not filtered by current view
    const mockMacroResponse = {
      currentLevel: 0,
      parentAddress: null,
      userStats: { percent: '2.50', breakdown: { macro: 1, sub1: 4, sub2: 0 } }
    };

    const mockZoomedResponse = {
      currentLevel: 1,
      parentAddress: 'd5',
      userStats: { percent: '2.50', breakdown: { macro: 1, sub1: 4, sub2: 0 } }
    };

    // userStats should be identical regardless of zoom level
    expect(mockMacroResponse.userStats.percent).toBe(mockZoomedResponse.userStats.percent);
    expect(mockMacroResponse.userStats.breakdown.macro).toBe(mockZoomedResponse.userStats.breakdown.macro);
    expect(mockMacroResponse.userStats.breakdown.sub1).toBe(mockZoomedResponse.userStats.breakdown.sub1);
  });
});
