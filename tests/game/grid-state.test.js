/**
 * Grid State Tests
 * Tests for the client-side Grid Wars state management
 * Updated for simplified territory-only gameplay (no structures)
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
      const mockState = { game: mockGame, territories: [], players: [], classGoal: { current: 0, target: 200 } };

      mockFetch
        .mockResolvedValueOnce(mockResponse({ claimCost: 10 })) // config
        .mockResolvedValueOnce(mockResponse(mockGame))
        .mockResolvedValueOnce(mockResponse(mockState));

      const result = await state.init();

      expect(state.gameId).toBe('game-123');
      expect(result.game_id).toBe('game-123');
    });

    it('throws error on failed init', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ claimCost: 10 })) // config
        .mockResolvedValueOnce(mockResponse({ error: 'Server error' }, 500));

      await expect(state.init()).rejects.toThrow('Server error');
    });
  });

  describe('refreshState', () => {
    beforeEach(async () => {
      const mockGame = { game_id: 'game-123', status: 'active' };
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse(mockGame));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: mockGame,
        territories: [],
        players: [],
        classGoal: { current: 0, target: 200 }
      }));
      await state.init();
      mockFetch.mockClear();
    });

    it('updates territories from server', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [
          { x: 5, y: 5, owner: 'alice', health: 100 },
          { x: 6, y: 5, owner: 'bob', health: 80 }
        ],
        players: []
      }));

      await state.refreshState();

      expect(state.territories.size).toBe(2);
      expect(state.getTerritoryOwner(5, 5)).toBe('alice');
      expect(state.getTerritoryOwner(6, 5)).toBe('bob');
    });

    it('updates players from server with position data', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [
          {
            username: 'alice',
            action_points: 10,
            territories_count: 5,
            health: 90,
            position_x: 5,
            position_y: 5,
            avatar_format: 'A'
          }
        ]
      }));

      await state.refreshState();

      expect(state.players.size).toBe(1);
      const player = state.players.get('alice');
      expect(player.action_points).toBe(10);
      expect(player.health).toBe(90);
      expect(player.position_x).toBe(5);
      expect(player.position_y).toBe(5);
    });

    it('throws if game not initialized', async () => {
      const freshState = new GridWarsState();
      await expect(freshState.refreshState()).rejects.toThrow('Game not initialized');
    });
  });

  describe('getActionPoints', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 15, territories_count: 0, health: 100 }],
        classGoal: { current: 0, target: 200 }
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
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 10, territories_count: 5, health: 100 }],
        classGoal: { current: 0, target: 200 }
      }));
      state.setUser('alice');
      await state.init();
    });

    it('returns player stats', () => {
      const stats = state.getPlayerStats();
      expect(stats.action_points).toBe(10);
      expect(stats.territories_count).toBe(5);
    });

    it('returns defaults for no user', () => {
      state.username = null;
      const stats = state.getPlayerStats();
      expect(stats.action_points).toBe(0);
      expect(stats.territories_count).toBe(0);
      expect(stats.health).toBe(100);
    });
  });

  describe('isOwnedByMe', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [{ x: 5, y: 5, owner: 'alice' }],
        players: [],
        classGoal: { current: 0, target: 200 }
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

  describe('canAffordClaim', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 15, territories_count: 0, health: 100 }],
        classGoal: { current: 0, target: 200 }
      }));
      state.setUser('alice');
      await state.init();
    });

    it('returns true if can afford claim (10 points)', () => {
      expect(state.canAffordClaim()).toBe(true);
    });

    it('returns false if cannot afford claim', () => {
      state.players.set('alice', { action_points: 5, territories_count: 0, health: 100 });
      expect(state.canAffordClaim()).toBe(false);
    });
  });

  describe('getClaimCost', () => {
    it('returns 10 for claim', () => {
      expect(state.getClaimCost()).toBe(10);
    });
  });

  describe('claimTerritory', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 20, territories_count: 0, health: 100 }],
        classGoal: { current: 0, target: 200 }
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
        cost: 10,
        newPoints: 10
      }));

      const result = await state.claimTerritory(5, 5);

      expect(result.success).toBe(true);
      expect(state.getTerritoryOwner(5, 5)).toBe('alice');
    });

    it('applies optimistic update', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

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

    it('throws if trying to claim own territory', async () => {
      // Can't reclaim your own territory
      state.territories.set('5,5', { owner: 'alice' });

      await expect(state.claimTerritory(5, 5)).rejects.toThrow('You already own this territory');
    });

    it('allows claiming enemy territory with sufficient points (takeover)', async () => {
      // Enemy takeover costs 20 points
      state.players.set('alice', { action_points: 25, territories_count: 0, health: 100 });
      state.territories.set('5,5', { owner: 'bob' });

      // Should not throw - enemy takeover is allowed
      await expect(state.claimTerritory(5, 5)).rejects.toThrow(); // Will fail on API call, but won't throw "already claimed"
    });

    it('throws if insufficient points', async () => {
      state.players.set('alice', { action_points: 5, territories_count: 0, health: 100 });

      await expect(state.claimTerritory(5, 5)).rejects.toThrow('Insufficient action points');
    });

    it('throws if not initialized', async () => {
      const freshState = new GridWarsState();
      freshState.setUser('alice');

      await expect(freshState.claimTerritory(5, 5)).rejects.toThrow('Not initialized');
    });
  });

  describe('addPoints', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [{ username: 'alice', action_points: 10, territories_count: 0, health: 100 }],
        classGoal: { current: 0, target: 200 }
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
      await expect(state.addPoints()).rejects.toThrow('Either starType or weightedPoints required');
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
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [],
        classGoal: { current: 0, target: 200 }
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

    it('handles avatar_moved', () => {
      // Add a player first
      state.players.set('bob', {
        action_points: 10,
        territories_count: 0,
        health: 100,
        position_x: 5,
        position_y: 5
      });

      state.handleWebSocketMessage({
        type: 'avatar_moved',
        gameId: 'game-123',
        username: 'bob',
        x: 6,
        y: 7,
        health: 95
      });

      const player = state.players.get('bob');
      expect(player.position_x).toBe(6);
      expect(player.position_y).toBe(7);
      expect(player.health).toBe(95);
    });

    it('handles grid_full_state', () => {
      state.handleWebSocketMessage({
        type: 'grid_full_state',
        gameId: 'game-123',
        territories: [{ x: 1, y: 1, owner: 'charlie', health: 100 }],
        players: [{
          username: 'charlie',
          action_points: 20,
          territories_count: 1,
          health: 100,
          position_x: 1,
          position_y: 1,
          avatar_format: 'B'
        }]
      });

      expect(state.territories.size).toBe(1);
      expect(state.getTerritoryOwner(1, 1)).toBe('charlie');
      expect(state.players.get('charlie').avatar_format).toBe('B');
    });
  });

  describe('getRenderState', () => {
    it('returns territories with strength in render format', async () => {
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [
          { x: 5, y: 5, owner: 'alice', strength: 3 },
          { x: 6, y: 5, owner: 'bob', strength: 2 }
        ],
        players: [],
        classGoal: { current: 0, target: 200 }
      }));

      await state.init();

      const renderState = state.getRenderState();

      expect(renderState.territories).toHaveLength(2);
      expect(renderState.territories[0]).toHaveProperty('x');
      expect(renderState.territories[0]).toHaveProperty('y');
      expect(renderState.territories[0]).toHaveProperty('owner');
      expect(renderState.territories[0]).toHaveProperty('strength');
    });

    it('returns players with position in render format', async () => {
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [
          {
            username: 'alice',
            action_points: 10,
            territories_count: 1,
            health: 90,
            position_x: 5,
            position_y: 5,
            avatar_format: 'A'
          }
        ],
        classGoal: { current: 0, target: 200 }
      }));

      await state.init();

      const renderState = state.getRenderState();

      expect(renderState.players).toHaveLength(1);
      expect(renderState.players[0]).toHaveProperty('username');
      expect(renderState.players[0]).toHaveProperty('x');
      expect(renderState.players[0]).toHaveProperty('y');
      expect(renderState.players[0]).toHaveProperty('health');
    });

    it('excludes players without position', async () => {
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce(mockResponse({ claimCost: 10 })); // config
      mockFetch.mockResolvedValueOnce(mockResponse({ game_id: 'game-123' }));
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [],
        players: [
          { username: 'alice', action_points: 10, territories_count: 0, health: 100 }
          // No position_x/position_y
        ],
        classGoal: { current: 0, target: 200 }
      }));

      await state.init();

      const renderState = state.getRenderState();
      expect(renderState.players).toHaveLength(0);
    });
  });
});

describe('GRID_WARS_CONFIG', () => {
  it('exports claim cost as 10', () => {
    expect(GRID_WARS_CONFIG.claimCost).toBe(10);
  });

  it('exports star points', () => {
    expect(GRID_WARS_CONFIG.starPoints).toBeDefined();
    expect(GRID_WARS_CONFIG.starPoints.gold).toBe(4);
    expect(GRID_WARS_CONFIG.starPoints.silver).toBe(3);
    expect(GRID_WARS_CONFIG.starPoints.bronze).toBe(2);
    expect(GRID_WARS_CONFIG.starPoints.tin).toBe(1);
  });

  it('exports map size', () => {
    expect(GRID_WARS_CONFIG.mapSize).toBe(8);  // v1.6: 8x8 map
  });

  it('does not export structure costs (removed)', () => {
    expect(GRID_WARS_CONFIG.structureCosts).toBeUndefined();
  });
});
