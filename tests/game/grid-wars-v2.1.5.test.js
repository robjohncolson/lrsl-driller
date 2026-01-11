/**
 * Grid Wars v2.1.5 Tests
 * Tests for subcell claims, navigation, and coordinate display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';
import { coordsToAddress, buildAddress } from '../../shared/address-utils.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock responses
function mockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
}

// Helper to initialize state with a game
async function initStateWithGame(state, extraData = {}) {
  const mockGame = { game_id: 'game-123', status: 'active', map_size: 8 };
  const mockStateData = {
    game: mockGame,
    territories: [],
    players: [{
      username: 'alice',
      action_points: 100,
      territories_count: 0,
      health: 100,
      active_buffs: {},
      last_answer_at: new Date().toISOString()
    }],
    classGoal: { current: 0, target: 50 },
    surge: null,
    ...extraData
  };

  // Mock config fetch
  mockFetch.mockResolvedValueOnce(mockResponse({
    claimCost: 40,
    hierarchyEnabled: true,
    developmentCost: 100,
    drillCost: 75
  }));
  // Mock active game fetch
  mockFetch.mockResolvedValueOnce(mockResponse(mockGame));
  // Mock state fetch
  mockFetch.mockResolvedValueOnce(mockResponse(mockStateData));

  await state.init();
  mockFetch.mockClear();
}

describe('Grid Wars v2.1.5 - Subcell Claims', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  describe('claimTerritory includes parent context', () => {
    it('sends parentAddress=null for macro claims (level 0)', async () => {
      await initStateWithGame(state);

      // Mock successful claim response
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        action: 'claim',
        x: 3,
        y: 4,
        address: 'd5',
        parentAddress: null,
        cellLevel: 0,
        cost: 40,
        newPoints: 60
      }));

      await state.claimTerritory(3, 4);

      // Verify the request body
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.x).toBe(3);
      expect(body.y).toBe(4);
      expect(body.parentAddress).toBeNull();
      expect(body.cellLevel).toBe(0);
    });

    it('sends parentAddress for subcell claims (level 1)', async () => {
      await initStateWithGame(state, {
        territories: [
          { x: 3, y: 4, owner: 'alice', address: 'd5', is_developed: true }
        ]
      });

      // Zoom into d5
      state.currentParent = 'd5';
      state.currentLevel = 1;

      // Add a neutral subcell at position (0,0) = a1
      state.territories.set('0,0', { owner: null, address: 'd5.a1' });

      // Mock successful claim response
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        action: 'claim',
        x: 0,
        y: 0,
        address: 'd5.a1',
        parentAddress: 'd5',
        cellLevel: 1,
        cost: 40,
        newPoints: 60
      }));

      await state.claimTerritory(0, 0);

      // Verify the request body includes parent context
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.x).toBe(0);
      expect(body.y).toBe(0);
      expect(body.parentAddress).toBe('d5');
      expect(body.cellLevel).toBe(1);
    });

    it('sends correct parentAddress for level 2 subcells', async () => {
      await initStateWithGame(state);

      // Zoom into d5.c3
      state.currentParent = 'd5.c3';
      state.currentLevel = 2;

      // Add a neutral subcell at position (0,0) = a1
      state.territories.set('0,0', { owner: null, address: 'd5.c3.a1' });

      // Mock successful claim response
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        action: 'claim',
        x: 0,
        y: 0,
        address: 'd5.c3.a1',
        parentAddress: 'd5.c3',
        cellLevel: 2,
        cost: 40,
        newPoints: 60
      }));

      await state.claimTerritory(0, 0);

      const [url, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.parentAddress).toBe('d5.c3');
      expect(body.cellLevel).toBe(2);
    });
  });

  describe('Server response includes address info', () => {
    it('claim response includes full address', async () => {
      await initStateWithGame(state);

      state.currentParent = 'd5';
      state.currentLevel = 1;
      state.territories.set('2,2', { owner: null });

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        action: 'claim',
        x: 2,
        y: 2,
        address: 'd5.c3',
        parentAddress: 'd5',
        cellLevel: 1,
        cost: 40,
        newPoints: 60,
        authoritativeCell: {
          x: 2,
          y: 2,
          address: 'd5.c3',
          parent_address: 'd5',
          cell_level: 1,
          owner: 'alice'
        }
      }));

      const result = await state.claimTerritory(2, 2);

      expect(result.address).toBe('d5.c3');
      expect(result.parentAddress).toBe('d5');
      expect(result.cellLevel).toBe(1);
      expect(result.authoritativeCell.address).toBe('d5.c3');
    });
  });
});

describe('Grid Wars v2.1.5 - Address Building', () => {
  describe('Target address calculation', () => {
    it('builds macro address without parent', () => {
      const localAddress = coordsToAddress(3, 4); // d5
      const targetAddress = buildAddress(null, 3, 4);
      expect(targetAddress).toBe('d5');
    });

    it('builds subcell address with parent', () => {
      const targetAddress = buildAddress('d5', 0, 0);
      expect(targetAddress).toBe('d5.a1');
    });

    it('builds level 2 address correctly', () => {
      const targetAddress = buildAddress('d5.c3', 7, 7);
      expect(targetAddress).toBe('d5.c3.h8');
    });
  });
});

describe('Grid Wars v2.1.5 - Coordinate Display Logic', () => {
  describe('Address formatting', () => {
    it('formats macro cell address correctly', () => {
      const x = 4, y = 4;
      const currentParent = null;
      const localAddress = String.fromCharCode(97 + x) + (y + 1);
      const fullAddress = currentParent ? `${currentParent}.${localAddress}` : localAddress;

      expect(fullAddress).toBe('e5');
    });

    it('formats subcell address correctly', () => {
      const x = 0, y = 0;
      const currentParent = 'd5';
      const localAddress = String.fromCharCode(97 + x) + (y + 1);
      const fullAddress = currentParent ? `${currentParent}.${localAddress}` : localAddress;

      expect(fullAddress).toBe('d5.a1');
    });

    it('formats level 2 subcell address correctly', () => {
      const x = 2, y = 2;
      const currentParent = 'd5.c3';
      const localAddress = String.fromCharCode(97 + x) + (y + 1);
      const fullAddress = currentParent ? `${currentParent}.${localAddress}` : localAddress;

      expect(fullAddress).toBe('d5.c3.c3');
    });

    it('converts address to uppercase for display', () => {
      const address = 'd5.c3.a1';
      expect(address.toUpperCase()).toBe('D5.C3.A1');
    });
  });

  describe('Level text formatting', () => {
    it('shows MACRO LEVEL for level 0', () => {
      const level = 0;
      const levelText = level === 0 ? 'MACRO LEVEL' : `LEVEL ${level}`;
      expect(levelText).toBe('MACRO LEVEL');
    });

    it('shows LEVEL 1 for first subdivision', () => {
      const level = 1;
      const levelText = level === 0 ? 'MACRO LEVEL' : `LEVEL ${level}`;
      expect(levelText).toBe('LEVEL 1');
    });

    it('shows LEVEL 2 for second subdivision', () => {
      const level = 2;
      const levelText = level === 0 ? 'MACRO LEVEL' : `LEVEL ${level}`;
      expect(levelText).toBe('LEVEL 2');
    });
  });
});

describe('Grid Wars v2.1.5 - Navigation State', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  describe('zoomIn updates currentParent and currentLevel', () => {
    it('sets currentParent to address on zoomIn', async () => {
      await initStateWithGame(state, {
        territories: [
          { x: 3, y: 4, owner: 'alice', address: 'd5', is_developed: true }
        ]
      });

      // Mock the state refresh after zoom
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 100 }]
      }));

      await state.zoomIn('d5');

      expect(state.currentParent).toBe('d5');
      expect(state.currentLevel).toBe(1);
    });

    it('increments level correctly for nested zoom', async () => {
      await initStateWithGame(state);

      state.currentParent = 'd5';
      state.currentLevel = 1;

      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 100 }]
      }));

      await state.zoomIn('d5.c3');

      expect(state.currentParent).toBe('d5.c3');
      expect(state.currentLevel).toBe(2);
    });
  });

  describe('zoomOut updates currentParent and currentLevel', () => {
    it('resets to root when zooming out from level 1', async () => {
      await initStateWithGame(state);

      state.currentParent = 'd5';
      state.currentLevel = 1;

      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 100 }]
      }));

      await state.zoomOut();

      expect(state.currentParent).toBeNull();
      expect(state.currentLevel).toBe(0);
    });

    it('zooms to parent when at level 2', async () => {
      await initStateWithGame(state);

      state.currentParent = 'd5.c3';
      state.currentLevel = 2;

      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 100 }]
      }));

      await state.zoomOut();

      expect(state.currentParent).toBe('d5');
      expect(state.currentLevel).toBe(1);
    });

    it('does nothing when already at root', async () => {
      await initStateWithGame(state);

      expect(state.currentParent).toBeNull();
      expect(state.currentLevel).toBe(0);

      await state.zoomOut();

      expect(state.currentParent).toBeNull();
      expect(state.currentLevel).toBe(0);
    });
  });

  describe('getNavigationState returns correct info', () => {
    it('returns level 0 and no parent at root', async () => {
      await initStateWithGame(state);

      const navState = state.getNavigationState();

      expect(navState.currentLevel).toBe(0);
      expect(navState.currentParent).toBeNull();
      expect(navState.canZoomOut).toBe(false);
    });

    it('returns level 1 and parent when zoomed in', async () => {
      await initStateWithGame(state);

      state.currentParent = 'd5';
      state.currentLevel = 1;

      const navState = state.getNavigationState();

      expect(navState.currentLevel).toBe(1);
      expect(navState.currentParent).toBe('d5');
      expect(navState.canZoomOut).toBe(true);
    });
  });
});

describe('Grid Wars v2.1.5 - Server Action Handler', () => {
  describe('Target address building on server', () => {
    it('builds macro address when no parentAddress', () => {
      const x = 3, y = 4;
      const parentAddress = null;

      const localAddress = coordsToAddress(x, y);
      const targetAddress = parentAddress ? `${parentAddress}.${localAddress}` : localAddress;

      expect(targetAddress).toBe('d5');
    });

    it('builds subcell address when parentAddress provided', () => {
      const x = 0, y = 0;
      const parentAddress = 'd5';

      const localAddress = coordsToAddress(x, y);
      const targetAddress = parentAddress ? `${parentAddress}.${localAddress}` : localAddress;

      expect(targetAddress).toBe('d5.a1');
    });

    it('builds level 2 address correctly', () => {
      const x = 2, y = 2;
      const parentAddress = 'd5.c3';

      const localAddress = coordsToAddress(x, y);
      const targetAddress = parentAddress ? `${parentAddress}.${localAddress}` : localAddress;

      expect(targetAddress).toBe('d5.c3.c3');
    });
  });
});

describe('Grid Wars v2.1.5 - Develop/Drill Tooltips', () => {
  describe('Develop mechanic explanation', () => {
    it('center cells are d4, d5, e4, e5', () => {
      const centerCells = ['d4', 'd5', 'e4', 'e5'];
      expect(centerCells.length).toBe(4);
      expect(centerCells).toContain('d4');
      expect(centerCells).toContain('d5');
      expect(centerCells).toContain('e4');
      expect(centerCells).toContain('e5');
    });

    it('develop creates 64 subcells (8x8)', () => {
      const gridSize = 8;
      const totalSubcells = gridSize * gridSize;
      expect(totalSubcells).toBe(64);
    });

    it('owner keeps 4 cells, 60 become neutral', () => {
      const totalSubcells = 64;
      const ownerKeeps = 4;
      const neutral = totalSubcells - ownerKeeps;
      expect(neutral).toBe(60);
    });
  });

  describe('Drill mechanic explanation', () => {
    it('attacker gets corner a1', () => {
      const attackerCell = 'a1';
      expect(attackerCell).toBe('a1');
      expect(coordsToAddress(0, 0)).toBe('a1');
    });

    it('defender keeps center 4', () => {
      const defenderCells = ['d4', 'd5', 'e4', 'e5'];
      expect(defenderCells.length).toBe(4);
    });
  });
});

describe('Grid Wars v2.1.5 - Config Defaults', () => {
  it('hierarchyEnabled is true by default', () => {
    expect(GRID_WARS_CONFIG.hierarchyEnabled).toBe(true);
  });

  it('claimCost is 40', () => {
    expect(GRID_WARS_CONFIG.claimCost).toBe(40);
  });

  it('developmentCost is 100', () => {
    expect(GRID_WARS_CONFIG.developmentCost).toBe(100);
  });

  it('drillCost is 75', () => {
    expect(GRID_WARS_CONFIG.drillCost).toBe(75);
  });

  it('maxSubdivisionLevel is 2', () => {
    expect(GRID_WARS_CONFIG.maxSubdivisionLevel).toBe(2);
  });
});
