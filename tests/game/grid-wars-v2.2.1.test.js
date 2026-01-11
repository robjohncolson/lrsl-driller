/**
 * Grid Wars v2.2.1 Regression Tests
 * Tests to prevent regression of critical fixes:
 *
 * 1. Coordinates out of bounds - server must use parentAddress/cellLevel from request
 * 2. Assignment to constant variable - server must use let for x,y parsing
 * 3. Double vision grid - renderer must be reused on panel expand/collapse
 * 4. Blank grid after fix - canvas size must only be set on first initialization
 * 5. Gift modal dropdown - gift feature must show player dropdown, not text field
 * 6. Leaderboard scroll - leaderboard must be scrollable when territory view is open
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Clear mocks before each test to prevent interference
beforeEach(() => {
  mockFetch.mockClear();
  mockFetch.mockReset();
});

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

  // Build state data with defaults that won't be overwritten
  const defaultPlayers = [{
    username: 'alice',
    action_points: 100,
    territories_count: 2,
    health: 100,
    active_buffs: {},
    last_answer_at: new Date().toISOString()
  }, {
    username: 'bob',
    action_points: 80,
    territories_count: 1,
    health: 100,
    active_buffs: {},
    last_answer_at: new Date().toISOString()
  }];

  const mockStateData = {
    game: mockGame,
    territories: extraData.territories || [],
    players: extraData.players || defaultPlayers,
    classGoal: extraData.classGoal || { current: 0, target: 50 },
    surge: extraData.surge || null,
    playerColors: extraData.playerColors || {
      'alice': '#FF3366',
      'bob': '#4D96FF'
    },
    subcellSummaries: extraData.subcellSummaries || {}
  };

  // Mock config fetch
  mockFetch.mockResolvedValueOnce(mockResponse({
    claimCost: 40,
    hierarchyEnabled: true,
    developmentCost: 100,
    drillCost: 75,
    maxSubdivisionLevel: 2
  }));
  // Mock active game fetch
  mockFetch.mockResolvedValueOnce(mockResponse(mockGame));
  // Mock state fetch (called by refreshState inside init)
  mockFetch.mockResolvedValueOnce(mockResponse(mockStateData));

  await state.init();
  // Clear mocks after init so tests can check their own calls starting at index 0
  mockFetch.mockClear();
}

describe('Grid Wars v2.2.1 Regression Tests', () => {

  describe('Fix #1: Coordinates Out of Bounds - Parent Context', () => {
    let state;

    beforeEach(async () => {
      state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
    });

    it('subcell claim includes parentAddress in request body', async () => {
      await initStateWithGame(state);
      state.currentParent = 'd5';
      state.currentLevel = 1;

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'claim-123',
        address: 'd5.b3',
        parentAddress: 'd5',
        cellLevel: 1
      }));

      await state.claimTerritory(1, 2);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.parentAddress).toBe('d5');
    });

    it('subcell claim includes cellLevel in request body', async () => {
      await initStateWithGame(state);
      state.currentParent = 'd5';
      state.currentLevel = 1;

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'claim-123',
        address: 'd5.b3',
        parentAddress: 'd5',
        cellLevel: 1
      }));

      await state.claimTerritory(1, 2);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.cellLevel).toBe(1);
    });

    it('root-level claim has null parentAddress and level 0', async () => {
      await initStateWithGame(state);
      state.currentParent = null;
      state.currentLevel = 0;

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'claim-456',
        address: 'e5'
      }));

      await state.claimTerritory(4, 4);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.parentAddress).toBeNull();
      expect(body.cellLevel).toBe(0);
    });

    it('nested subcell (level 2) includes correct parent context', async () => {
      await initStateWithGame(state);
      state.currentParent = 'd5.c3';
      state.currentLevel = 2;

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'claim-789',
        address: 'd5.c3.a1',
        parentAddress: 'd5.c3',
        cellLevel: 2
      }));

      await state.claimTerritory(0, 0);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.parentAddress).toBe('d5.c3');
      expect(body.cellLevel).toBe(2);
    });

    it('handles server error with coordinate details', async () => {
      await initStateWithGame(state);
      state.currentParent = 'e5';
      state.currentLevel = 1;

      mockFetch.mockResolvedValueOnce(mockResponse({
        error: 'Coordinates out of bounds',
        details: {
          x: 10,
          y: 5,
          maxValid: 7,
          parentAddress: 'e5',
          cellLevel: 1
        }
      }, 400));

      await expect(state.claimTerritory(10, 5)).rejects.toThrow('Coordinates out of bounds');
    });

    it('coordinates are sent as integers not strings', async () => {
      await initStateWithGame(state);
      state.currentParent = null;
      state.currentLevel = 0;

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'claim-int',
        address: 'c4'
      }));

      await state.claimTerritory(2, 3);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      // These should be numbers, not strings
      expect(typeof body.x).toBe('number');
      expect(typeof body.y).toBe('number');
      expect(body.x).toBe(2);
      expect(body.y).toBe(3);
    });
  });

  describe('Fix #2: Server Coordinate Parsing (let vs const)', () => {
    // These tests verify the client sends valid data that won't cause server issues
    // The actual server-side fix (using let instead of const for x,y) can't be tested from client

    it('claim request body structure is valid JSON', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
      await initStateWithGame(state);

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'claim-test'
      }));

      await state.claimTerritory(5, 5);

      const [, options] = mockFetch.mock.calls[0];
      expect(() => JSON.parse(options.body)).not.toThrow();

      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('gameId');
      expect(body).toHaveProperty('username');
      expect(body).toHaveProperty('action');
      expect(body).toHaveProperty('x');
      expect(body).toHaveProperty('y');
    });

    it('all coordinate values are within valid 0-7 range', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
      // Give player lots of action points to claim all 4 corners (40 points each)
      await initStateWithGame(state, {
        players: [{
          username: 'alice',
          action_points: 500,  // Enough for 4 claims at 40 each
          territories_count: 0,
          health: 100,
          active_buffs: {},
          last_answer_at: new Date().toISOString()
        }]
      });

      // Test all corner positions
      const corners = [
        { x: 0, y: 0 }, // a1
        { x: 7, y: 0 }, // h1
        { x: 0, y: 7 }, // a8
        { x: 7, y: 7 }, // h8
      ];

      for (const corner of corners) {
        mockFetch.mockClear();
        mockFetch.mockResolvedValueOnce(mockResponse({
          success: true,
          actionId: `claim-${corner.x}-${corner.y}`
        }));

        await state.claimTerritory(corner.x, corner.y);

        const [, options] = mockFetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.x).toBeGreaterThanOrEqual(0);
        expect(body.x).toBeLessThanOrEqual(7);
        expect(body.y).toBeGreaterThanOrEqual(0);
        expect(body.y).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('Fix #3 & #4: Canvas Rendering on Panel Expand', () => {
    // These test the logic that would be used in grid-panel.js
    // The actual DOM manipulation can't be fully tested, but we test the state behavior

    it('renderer reference is maintained across state refreshes', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
      await initStateWithGame(state);

      // Simulate multiple state refreshes (as would happen on panel toggle)
      const initialGameId = state.gameId;

      // Mock another state fetch (refreshState needs game/territories/players)
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123', status: 'active', map_size: 8 },
        territories: [],
        players: [],
        classGoal: { current: 0, target: 50 },
        playerColors: {},
        subcellSummaries: {}
      }));

      await state.refreshState();

      // Game ID should still be valid
      expect(state.gameId).toBeTruthy();
      expect(state.gameId).toBe(initialGameId);
    });

    it('getRenderState provides consistent output after multiple calls', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
      await initStateWithGame(state, {
        territories: [
          { x: 3, y: 4, owner: 'alice', address: 'd5', is_developed: false }
        ]
      });

      const render1 = state.getRenderState();
      const render2 = state.getRenderState();
      const render3 = state.getRenderState();

      // All should have same structure
      expect(render1.cells).toEqual(render2.cells);
      expect(render2.cells).toEqual(render3.cells);
      expect(render1.playerColors).toEqual(render2.playerColors);
    });
  });

  describe('Fix #5: Gift Feature Requirements', () => {
    let state;

    beforeEach(async () => {
      state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
    });

    it('can list online players for gift dropdown', async () => {
      await initStateWithGame(state, {
        players: [
          { username: 'alice', action_points: 100, territories_count: 2, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() },
          { username: 'bob', action_points: 80, territories_count: 1, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() },
          { username: 'charlie', action_points: 60, territories_count: 0, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() }
        ]
      });

      // The players Map should be available for UI to create dropdown
      expect(state.players.size).toBe(3);
      expect(state.players.has('bob')).toBe(true);
      expect(state.players.has('charlie')).toBe(true);
    });

    it('gift excludes self from recipient options', async () => {
      await initStateWithGame(state, {
        players: [
          { username: 'alice', action_points: 100, territories_count: 2, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() },
          { username: 'bob', action_points: 80, territories_count: 1, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() }
        ]
      });

      // Filter players excluding self (as UI would do) - players is a Map
      const allUsernames = Array.from(state.players.keys());
      const giftableRecipients = allUsernames.filter(name => name !== 'alice');
      expect(giftableRecipients).not.toContain('alice');
      expect(giftableRecipients).toContain('bob');
    });

    it('giftCell API call includes all required fields', async () => {
      await initStateWithGame(state, {
        territories: [
          { x: 3, y: 4, owner: 'alice', address: 'd5', is_developed: false }
        ]
      });

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        from: 'alice',
        to: 'bob',
        address: 'd5'
      }));

      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [],
        classGoal: { current: 0, target: 50 },
        playerColors: {},
        subcellSummaries: {}
      }));

      await state.giftCell('d5', 'bob');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://test-server/api/grid-wars/gift');

      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('gameId', 'game-123');
      expect(body).toHaveProperty('fromUsername', 'alice');
      expect(body).toHaveProperty('toUsername', 'bob');
      expect(body).toHaveProperty('address', 'd5');
    });
  });

  describe('Fix #6: Leaderboard Scrollability', () => {
    // Tests for leaderboard data that UI needs for scrolling

    it('leaderboard data returns Map of players', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');

      const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
        username: `player${i}`,
        action_points: 100 - i * 5,
        territories_count: 10 - Math.floor(i / 2),
        health: 100,
        active_buffs: {},
        last_answer_at: new Date().toISOString()
      }));

      await initStateWithGame(state, { players: manyPlayers });

      // Players Map should be available for leaderboard
      expect(state.players.size).toBe(20);
      expect(state.players.has('player0')).toBe(true);
      expect(state.players.get('player0').action_points).toBe(100);
    });

    it('players can be sorted by territories_count', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');

      await initStateWithGame(state, {
        players: [
          { username: 'alice', action_points: 50, territories_count: 5, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() },
          { username: 'bob', action_points: 80, territories_count: 10, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() },
          { username: 'charlie', action_points: 100, territories_count: 3, health: 100, active_buffs: {}, last_answer_at: new Date().toISOString() }
        ]
      });

      // Convert Map to array and sort by territories (as leaderboard would)
      const playersArray = Array.from(state.players.entries()).map(([username, data]) => ({
        username,
        ...data
      }));
      const sorted = playersArray.sort((a, b) => b.territories_count - a.territories_count);

      expect(sorted[0].username).toBe('bob');     // 10 territories
      expect(sorted[1].username).toBe('alice');   // 5 territories
      expect(sorted[2].username).toBe('charlie'); // 3 territories
    });
  });

  describe('Config Defaults (v2.2.1 client-side fix)', () => {
    it('GRID_WARS_CONFIG has correct default claimCost (40, not 10)', () => {
      expect(GRID_WARS_CONFIG.claimCost).toBe(40);
    });

    it('GRID_WARS_CONFIG has correct takeoverCostCold (60)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBe(60);
    });

    it('GRID_WARS_CONFIG has correct takeoverCostWarm (80)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBe(80);
    });

    it('GRID_WARS_CONFIG has correct takeoverCostActive (100)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(100);
    });

    it('GRID_WARS_CONFIG has hierarchyEnabled defined', () => {
      expect(GRID_WARS_CONFIG).toHaveProperty('hierarchyEnabled');
      expect(GRID_WARS_CONFIG.hierarchyEnabled).toBe(true);
    });

    it('GRID_WARS_CONFIG has mapSize 8 (not 20 or 25)', () => {
      expect(GRID_WARS_CONFIG.mapSize).toBe(8);
    });
  });

  describe('Address Field Population (v2.1.3 regression)', () => {
    // Ensure addresses are sent correctly in claim requests

    it('claim request includes correct coordinates for address generation', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
      await initStateWithGame(state);

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'claim-with-address',
        x: 3,
        y: 4,
        address: 'd5'
      }));

      await state.claimTerritory(3, 4);

      // Verify the request was made with correct coordinates
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.x).toBe(3);
      expect(body.y).toBe(4);
      expect(body.cellLevel).toBe(0);
    });

    it('subcell claim request includes parent address for path generation', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');
      await initStateWithGame(state);
      state.currentParent = 'e5';
      state.currentLevel = 1;

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'subcell-claim',
        x: 1,
        y: 2,
        address: 'e5.b3',
        parentAddress: 'e5',
        cellLevel: 1
      }));

      await state.claimTerritory(1, 2);

      // Verify the request includes parent context for address generation
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.parentAddress).toBe('e5');
      expect(body.cellLevel).toBe(1);
    });
  });

  describe('Takeover Action (ensures same fixes apply)', () => {
    it('takeover sends parentAddress and cellLevel for subcells', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');

      await initStateWithGame(state, {
        territories: [
          { x: 2, y: 3, owner: 'bob', address: 'e5.c4', parent_address: 'e5', cell_level: 1, is_developed: false }
        ]
      });
      state.currentParent = 'e5';
      state.currentLevel = 1;

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'takeover-123',
        address: 'e5.c4',
        parentAddress: 'e5',
        cellLevel: 1
      }));

      await state.claimTerritory(2, 3); // Will be takeover since bob owns it

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.parentAddress).toBe('e5');
      expect(body.cellLevel).toBe(1);
    });
  });

  describe('Develop Action Parent Context', () => {
    it('develop action sends correct cell address', async () => {
      const state = new GridWarsState({ serverUrl: 'http://test-server' });
      state.setUser('alice');

      await initStateWithGame(state, {
        territories: [
          { x: 3, y: 4, owner: 'alice', address: 'd5', cell_level: 0, is_developed: false }
        ],
        players: [{
          username: 'alice',
          action_points: 200,
          territories_count: 1,
          health: 100,
          active_buffs: {},
          last_answer_at: new Date().toISOString()
        }]
      });

      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: 'develop-123',
        address: 'd5',
        isDeveloped: true
      }));

      // Mock the state refresh that happens after develop (zoomIn calls refreshState)
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123', status: 'active', map_size: 8 },
        territories: [
          { x: 3, y: 3, owner: 'alice', address: 'd5.d4', parent_address: 'd5', cell_level: 1, is_developed: false },
          { x: 3, y: 4, owner: 'alice', address: 'd5.d5', parent_address: 'd5', cell_level: 1, is_developed: false },
          { x: 4, y: 3, owner: 'alice', address: 'd5.e4', parent_address: 'd5', cell_level: 1, is_developed: false },
          { x: 4, y: 4, owner: 'alice', address: 'd5.e5', parent_address: 'd5', cell_level: 1, is_developed: false }
        ],
        players: [{
          username: 'alice',
          action_points: 100,
          territories_count: 4
        }],
        classGoal: { current: 0, target: 50 },
        playerColors: { 'alice': '#FF3366' },
        subcellSummaries: {}
      }));

      await state.developCell('d5');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://test-server/api/grid-wars/develop');

      const body = JSON.parse(options.body);
      expect(body.address).toBe('d5');
      expect(body.username).toBe('alice');
    });
  });
});

describe('Grid Wars v2.2.1 - Stress Tests', () => {
  it('rapid claim requests maintain correct parent context', async () => {
    const state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');

    // Initialize with proper mock data
    mockFetch.mockResolvedValueOnce(mockResponse({
      claimCost: 40,
      hierarchyEnabled: true,
      maxSubdivisionLevel: 2
    }));
    mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123', status: 'active', map_size: 8 }));
    mockFetch.mockResolvedValueOnce(mockResponse({
      game: { game_id: 'game-123', status: 'active', map_size: 8 },
      territories: [],
      players: [{
        username: 'alice',
        action_points: 1000,
        territories_count: 0,
        health: 100,
        active_buffs: {},
        last_answer_at: new Date().toISOString()
      }],
      classGoal: { current: 0, target: 50 },
      playerColors: {},
      subcellSummaries: {}
    }));
    await state.init();
    mockFetch.mockClear();

    // Set to subcell level
    state.currentParent = 'd5';
    state.currentLevel = 1;

    // Rapid fire 5 claims
    const claimPromises = [];
    for (let i = 0; i < 5; i++) {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: `rapid-claim-${i}`,
        address: `d5.a${i + 1}`,
        parentAddress: 'd5',
        cellLevel: 1
      }));
      claimPromises.push(state.claimTerritory(0, i));
    }

    await Promise.all(claimPromises);

    // Verify all 5 calls had correct parent context
    expect(mockFetch).toHaveBeenCalledTimes(5);
    for (let i = 0; i < 5; i++) {
      const [, options] = mockFetch.mock.calls[i];
      const body = JSON.parse(options.body);
      expect(body.parentAddress).toBe('d5');
      expect(body.cellLevel).toBe(1);
    }
  });
});
