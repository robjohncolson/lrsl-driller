/**
 * Grid State Tests
 * Tests for the client-side Grid Wars state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG, resetGridWarsState } from '../../platform/game/grid-state.js';

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

describe('GridWarsState', () => {
  let state;

  beforeEach(() => {
    resetGridWarsState();
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
  });

  describe('constructor', () => {
    it('initializes with default values', () => {
      const s = new GridWarsState();
      expect(s.username).toBeNull();
      expect(s.gameId).toBeNull();
      expect(s.territories.size).toBe(0);
      expect(s.structures.size).toBe(0);
      expect(s.players.size).toBe(0);
    });

    it('accepts custom server URL', () => {
      const s = new GridWarsState({ serverUrl: 'http://custom-server' });
      expect(s.serverUrl).toBe('http://custom-server');
    });

    it('accepts initial username', () => {
      const s = new GridWarsState({ username: 'alice' });
      expect(s.username).toBe('alice');
    });
  });

  describe('setUser', () => {
    it('sets the username', () => {
      state.setUser('bob');
      expect(state.username).toBe('bob');
    });
  });

  describe('init', () => {
    it('fetches active game and sets gameId', async () => {
      const mockGame = { game_id: 'game-123', status: 'active', map_size: 20 };
      const mockState = { game: mockGame, territories: [], structures: [], players: [] };

      mockFetch
        .mockResolvedValueOnce(mockResponse(mockGame))
        .mockResolvedValueOnce(mockResponse(mockState));

      const result = await state.init();

      expect(state.gameId).toBe('game-123');
      expect(result.game_id).toBe('game-123');
    });

    it('throws error on failed init', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Server error' }, 500));

      await expect(state.init()).rejects.toThrow('Server error');
    });
  });

  describe('refreshState', () => {
    beforeEach(async () => {
      const mockGame = { game_id: 'game-123', status: 'active' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockGame));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: mockGame,
        territories: [],
        structures: [],
        players: []
      }));
      await state.init();
      mockFetch.mockClear();
    });

    it('updates territories from server', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [
          { x: 5, y: 5, owner: 'alice' },
          { x: 6, y: 5, owner: 'bob' }
        ],
        structures: [],
        players: []
      }));

      await state.refreshState();

      expect(state.territories.size).toBe(2);
      expect(state.getTerritoryOwner(5, 5)).toBe('alice');
      expect(state.getTerritoryOwner(6, 5)).toBe('bob');
    });

    it('updates structures from server', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [
          { x: 5, y: 5, structure_type: 'tower', owner: 'alice', health: 100 }
        ],
        players: []
      }));

      await state.refreshState();

      expect(state.structures.size).toBe(1);
      const structure = state.getStructure(5, 5);
      expect(structure.structure_type).toBe('tower');
      expect(structure.owner).toBe('alice');
    });

    it('updates players from server', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [],
        players: [
          { username: 'alice', action_points: 10, territories_count: 5, structures_count: 2 }
        ]
      }));

      await state.refreshState();

      expect(state.players.size).toBe(1);
      expect(state.players.get('alice').action_points).toBe(10);
    });

    it('throws if game not initialized', async () => {
      const freshState = new GridWarsState();
      await expect(freshState.refreshState()).rejects.toThrow('Game not initialized');
    });
  });

  describe('getActionPoints', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [],
        players: [{ username: 'alice', action_points: 15, territories_count: 0, structures_count: 0 }]
      }));
      state.setUser('alice');
      await state.init();
    });

    it('returns current player action points', () => {
      expect(state.getActionPoints()).toBe(15);
    });

    it('returns 0 if no user set', () => {
      state.username = null;
      expect(state.getActionPoints()).toBe(0);
    });

    it('returns 0 if player not in cache', () => {
      state.setUser('nonexistent');
      expect(state.getActionPoints()).toBe(0);
    });
  });

  describe('getPlayerStats', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [],
        players: [{ username: 'alice', action_points: 10, territories_count: 5, structures_count: 2 }]
      }));
      state.setUser('alice');
      await state.init();
    });

    it('returns player stats', () => {
      const stats = state.getPlayerStats();
      expect(stats.action_points).toBe(10);
      expect(stats.territories_count).toBe(5);
      expect(stats.structures_count).toBe(2);
    });

    it('returns defaults for no user', () => {
      state.username = null;
      const stats = state.getPlayerStats();
      expect(stats.action_points).toBe(0);
      expect(stats.territories_count).toBe(0);
    });
  });

  describe('isOwnedByMe', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [{ x: 5, y: 5, owner: 'alice' }],
        structures: [],
        players: []
      }));
      state.setUser('alice');
      await state.init();
    });

    it('returns true if owned by current user', () => {
      expect(state.isOwnedByMe(5, 5)).toBe(true);
    });

    it('returns false if owned by someone else', () => {
      state.territories.set('6,6', { owner: 'bob' });
      expect(state.isOwnedByMe(6, 6)).toBe(false);
    });

    it('returns false if not owned', () => {
      expect(state.isOwnedByMe(0, 0)).toBe(false);
    });
  });

  describe('canAfford', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [],
        players: [{ username: 'alice', action_points: 5, territories_count: 0, structures_count: 0 }]
      }));
      state.setUser('alice');
      await state.init();
    });

    it('returns true if can afford claim (1 point)', () => {
      expect(state.canAfford('claim')).toBe(true);
    });

    it('returns true if can afford wall (2 points)', () => {
      expect(state.canAfford('build', 'wall')).toBe(true);
    });

    it('returns true if can afford tower (3 points)', () => {
      expect(state.canAfford('build', 'tower')).toBe(true);
    });

    it('returns true if can afford farm (4 points)', () => {
      expect(state.canAfford('build', 'farm')).toBe(true);
    });

    it('returns false if cannot afford castle (10 points)', () => {
      expect(state.canAfford('build', 'castle')).toBe(false);
    });

    it('returns false for invalid structure type', () => {
      expect(state.canAfford('build', 'spaceship')).toBe(false);
    });
  });

  describe('getActionCost', () => {
    it('returns 1 for claim', () => {
      expect(state.getActionCost('claim')).toBe(1);
    });

    it('returns correct costs for structures', () => {
      expect(state.getActionCost('build', 'wall')).toBe(2);
      expect(state.getActionCost('build', 'tower')).toBe(3);
      expect(state.getActionCost('build', 'farm')).toBe(4);
      expect(state.getActionCost('build', 'castle')).toBe(10);
    });

    it('returns 0 for invalid action', () => {
      expect(state.getActionCost('attack')).toBe(0);
    });
  });

  describe('claimTerritory', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [],
        players: [{ username: 'alice', action_points: 10, territories_count: 0, structures_count: 0 }]
      }));
      state.setUser('alice');
      await state.init();
      mockFetch.mockClear();
    });

    it('claims territory successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        action: 'claim',
        x: 5,
        y: 5,
        cost: 1,
        newPoints: 9
      }));

      const result = await state.claimTerritory(5, 5);

      expect(result.success).toBe(true);
      expect(state.getTerritoryOwner(5, 5)).toBe('alice');
    });

    it('applies optimistic update', async () => {
      // Set up the mock before starting the async operation
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      // Start the claim but don't await yet
      const claimPromise = state.claimTerritory(5, 5);

      // Check optimistic update was applied immediately
      expect(state.getTerritoryOwner(5, 5)).toBe('alice');

      await claimPromise;
    });

    it('rolls back on failure', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Server error' }, 500));

      await expect(state.claimTerritory(5, 5)).rejects.toThrow();

      // Should have rolled back
      expect(state.getTerritoryOwner(5, 5)).toBeNull();
    });

    it('throws if territory already claimed', async () => {
      state.territories.set('5,5', { owner: 'bob' });

      await expect(state.claimTerritory(5, 5)).rejects.toThrow('Territory already claimed');
    });

    it('throws if insufficient points', async () => {
      state.players.set('alice', { action_points: 0, territories_count: 0, structures_count: 0 });

      await expect(state.claimTerritory(5, 5)).rejects.toThrow('Insufficient action points');
    });

    it('throws if not initialized', async () => {
      const freshState = new GridWarsState();
      freshState.setUser('alice');

      await expect(freshState.claimTerritory(5, 5)).rejects.toThrow('Not initialized');
    });
  });

  describe('buildStructure', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [{ x: 5, y: 5, owner: 'alice' }],
        structures: [],
        players: [{ username: 'alice', action_points: 10, territories_count: 1, structures_count: 0 }]
      }));
      state.setUser('alice');
      await state.init();
      mockFetch.mockClear();
    });

    it('builds structure successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        action: 'build',
        structureType: 'tower',
        x: 5,
        y: 5,
        cost: 3,
        newPoints: 7
      }));

      const result = await state.buildStructure(5, 5, 'tower');

      expect(result.success).toBe(true);
      expect(state.getStructure(5, 5).structure_type).toBe('tower');
    });

    it('throws if not owned by user', async () => {
      await expect(state.buildStructure(0, 0, 'tower')).rejects.toThrow('must own the territory');
    });

    it('throws if structure already exists', async () => {
      state.structures.set('5,5', { structure_type: 'wall', owner: 'alice' });

      await expect(state.buildStructure(5, 5, 'tower')).rejects.toThrow('Structure already exists');
    });

    it('throws if insufficient points', async () => {
      state.players.set('alice', { action_points: 2, territories_count: 1, structures_count: 0 });

      await expect(state.buildStructure(5, 5, 'tower')).rejects.toThrow('Insufficient');
    });
  });

  describe('addPoints', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [],
        players: [{ username: 'alice', action_points: 10, territories_count: 0, structures_count: 0 }]
      }));
      state.setUser('alice');
      await state.init();
      mockFetch.mockClear();
    });

    it('adds points for star type', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 4,
        newTotal: 14
      }));

      const result = await state.addPoints('gold');

      expect(result.pointsAdded).toBe(4);
      expect(result.newTotal).toBe(14);
      expect(state.getActionPoints()).toBe(14);
    });

    it('adds manual points amount', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 5,
        newTotal: 15
      }));

      const result = await state.addPoints(null, 5);

      expect(result.pointsAdded).toBe(5);
    });

    it('throws if neither starType nor points provided', async () => {
      await expect(state.addPoints()).rejects.toThrow('Either starType or pointsAmount required');
    });

    it('calls onPointsEarned callback', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 4,
        newTotal: 14
      }));

      const onPointsEarned = vi.fn();
      state.onPointsEarned = onPointsEarned;

      await state.addPoints('gold');

      expect(onPointsEarned).toHaveBeenCalledWith({
        points: 4,
        total: 14,
        starType: 'gold'
      });
    });
  });

  describe('handleWebSocketMessage', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        structures: [],
        players: []
      }));
      state.setUser('alice');
      await state.init();
    });

    it('ignores messages for different game', () => {
      const onStateChange = vi.fn();
      state.onStateChange = onStateChange;

      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'other-game',
        x: 5,
        y: 5,
        username: 'bob'
      });

      expect(onStateChange).not.toHaveBeenCalled();
    });

    it('handles territory_claimed', () => {
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'game-123',
        x: 5,
        y: 5,
        username: 'bob'
      });

      expect(state.getTerritoryOwner(5, 5)).toBe('bob');
    });

    it('handles structure_built', () => {
      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'game-123',
        x: 5,
        y: 5,
        structureType: 'tower',
        username: 'bob'
      });

      expect(state.getStructure(5, 5).structure_type).toBe('tower');
    });

    it('handles points_earned', () => {
      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'game-123',
        username: 'alice',
        points: 4,
        total: 14,
        starType: 'gold'
      });

      expect(state.getActionPoints()).toBe(14);
    });

    it('handles structure_destroyed', () => {
      state.structures.set('5,5', { structure_type: 'wall', owner: 'alice' });

      state.handleWebSocketMessage({
        type: 'structure_destroyed',
        gameId: 'game-123',
        x: 5,
        y: 5
      });

      expect(state.getStructure(5, 5)).toBeNull();
    });
  });

  describe('getRenderState', () => {
    it('returns territories in render format', async () => {
      // Set up fresh mocks for this test
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [
          { x: 5, y: 5, owner: 'alice' },
          { x: 6, y: 5, owner: 'bob' }
        ],
        structures: [
          { x: 5, y: 5, structure_type: 'tower', owner: 'alice' }
        ],
        players: []
      }));

      await state.init();

      const renderState = state.getRenderState();

      expect(renderState.territories).toHaveLength(2);
      expect(renderState.territories[0]).toHaveProperty('x');
      expect(renderState.territories[0]).toHaveProperty('y');
      expect(renderState.territories[0]).toHaveProperty('owner');
    });

    it('returns structures in render format', async () => {
      // Set up fresh mocks for this test
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [{ x: 5, y: 5, owner: 'alice' }],
        structures: [
          { x: 5, y: 5, structure_type: 'tower', owner: 'alice' }
        ],
        players: []
      }));

      await state.init();

      const renderState = state.getRenderState();

      expect(renderState.structures).toHaveLength(1);
      expect(renderState.structures[0]).toHaveProperty('x');
      expect(renderState.structures[0]).toHaveProperty('y');
      expect(renderState.structures[0]).toHaveProperty('type');
      expect(renderState.structures[0]).toHaveProperty('owner');
    });
  });
});

describe('GRID_WARS_CONFIG', () => {
  it('exports structure costs', () => {
    expect(GRID_WARS_CONFIG.structureCosts).toBeDefined();
    expect(GRID_WARS_CONFIG.structureCosts.claim).toBe(1);
    expect(GRID_WARS_CONFIG.structureCosts.wall).toBe(2);
    expect(GRID_WARS_CONFIG.structureCosts.tower).toBe(3);
    expect(GRID_WARS_CONFIG.structureCosts.farm).toBe(4);
    expect(GRID_WARS_CONFIG.structureCosts.castle).toBe(10);
  });

  it('exports star points', () => {
    expect(GRID_WARS_CONFIG.starPoints).toBeDefined();
    expect(GRID_WARS_CONFIG.starPoints.gold).toBe(4);
    expect(GRID_WARS_CONFIG.starPoints.silver).toBe(3);
    expect(GRID_WARS_CONFIG.starPoints.bronze).toBe(2);
    expect(GRID_WARS_CONFIG.starPoints.tin).toBe(1);
  });

  it('exports map size', () => {
    expect(GRID_WARS_CONFIG.mapSize).toBe(20);
  });
});
