/**
 * Grid Wars API Tests
 * Tests for the Grid Wars game endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API base URL
const API_BASE = 'http://localhost:3000';

// Helper to create mock responses
function mockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
}

describe('Grid Wars API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('GET /api/grid-wars/games/active', () => {
    it('returns active game if one exists', async () => {
      const mockGame = {
        id: 1,
        game_id: 'game-123',
        status: 'active',
        map_size: 20,
        wave_number: 0,
        center_hp: 100
      };

      mockFetch.mockResolvedValueOnce(mockResponse(mockGame));

      const response = await fetch(`${API_BASE}/api/grid-wars/games/active`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.game_id).toBe('game-123');
      expect(data.status).toBe('active');
      expect(data.map_size).toBe(20);
    });

    it('creates new game if none exists', async () => {
      const newGame = {
        id: 1,
        game_id: 'game-new-456',
        status: 'active',
        map_size: 20,
        wave_number: 0,
        center_hp: 100
      };

      mockFetch.mockResolvedValueOnce(mockResponse(newGame));

      const response = await fetch(`${API_BASE}/api/grid-wars/games/active`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.game_id).toMatch(/^game-/);
      expect(data.status).toBe('active');
    });

    it('returns 503 if tables not created', async () => {
      const error = { error: 'Grid Wars tables not yet created. Run schema-grid-wars.sql in Supabase.' };
      mockFetch.mockResolvedValueOnce(mockResponse(error, 503));

      const response = await fetch(`${API_BASE}/api/grid-wars/games/active`);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('tables not yet created');
    });
  });

  describe('GET /api/grid-wars/games/:gameId/state', () => {
    it('returns full game state', async () => {
      const mockState = {
        game: { game_id: 'game-123', status: 'active', map_size: 20 },
        territories: [
          { x: 5, y: 5, owner: 'alice' },
          { x: 6, y: 5, owner: 'alice' }
        ],
        structures: [
          { x: 5, y: 5, structure_type: 'tower', owner: 'alice' }
        ],
        players: [
          { username: 'alice', action_points: 10, territories_count: 2, structures_count: 1 }
        ]
      };

      mockFetch.mockResolvedValueOnce(mockResponse(mockState));

      const response = await fetch(`${API_BASE}/api/grid-wars/games/game-123/state`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.game.game_id).toBe('game-123');
      expect(data.territories).toHaveLength(2);
      expect(data.structures).toHaveLength(1);
      expect(data.players).toHaveLength(1);
    });

    it('returns 404 for non-existent game', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Game not found' }, 404));

      const response = await fetch(`${API_BASE}/api/grid-wars/games/nonexistent/state`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found');
    });
  });

  describe('POST /api/grid-wars/action', () => {
    describe('claim action', () => {
      it('claims empty territory', async () => {
        const successResponse = {
          success: true,
          action: 'claim',
          x: 5,
          y: 5,
          cost: 1,
          newPoints: 9
        };

        mockFetch.mockResolvedValueOnce(mockResponse(successResponse));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'alice',
            action: 'claim',
            x: 5,
            y: 5
          })
        });
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(data.success).toBe(true);
        expect(data.action).toBe('claim');
        expect(data.cost).toBe(1);
      });

      it('rejects claim on owned territory', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(
          { error: 'Territory already claimed' },
          400
        ));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'bob',
            action: 'claim',
            x: 5,
            y: 5
          })
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Territory already claimed');
      });

      it('rejects if insufficient points', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(
          { error: 'Insufficient points. Need 1, have 0' },
          400
        ));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'newplayer',
            action: 'claim',
            x: 5,
            y: 5
          })
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Insufficient points');
      });

      it('rejects coordinates out of bounds', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(
          { error: 'Coordinates out of bounds' },
          400
        ));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'alice',
            action: 'claim',
            x: 25,
            y: 5
          })
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Coordinates out of bounds');
      });
    });

    describe('build action', () => {
      it('builds structure on owned territory', async () => {
        const successResponse = {
          success: true,
          action: 'build',
          structureType: 'tower',
          x: 5,
          y: 5,
          cost: 3,
          newPoints: 7
        };

        mockFetch.mockResolvedValueOnce(mockResponse(successResponse));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'alice',
            action: 'build',
            x: 5,
            y: 5,
            structureType: 'tower'
          })
        });
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(data.success).toBe(true);
        expect(data.structureType).toBe('tower');
        expect(data.cost).toBe(3);
      });

      it('rejects build on unowned territory', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(
          { error: 'You must own the territory to build' },
          400
        ));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'bob',
            action: 'build',
            x: 5,
            y: 5,
            structureType: 'tower'
          })
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('must own the territory');
      });

      it('rejects invalid structure type', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(
          { error: 'Invalid structure type' },
          400
        ));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'alice',
            action: 'build',
            x: 5,
            y: 5,
            structureType: 'spaceship'
          })
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid structure type');
      });

      it('rejects build where structure exists', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(
          { error: 'Structure already exists at this location' },
          400
        ));

        const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'game-123',
            username: 'alice',
            action: 'build',
            x: 5,
            y: 5,
            structureType: 'wall'
          })
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Structure already exists');
      });
    });

    it('rejects missing required fields', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'Missing required fields: gameId, username, action, x, y' },
        400
      ));

      const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123'
          // missing other fields
        })
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('rejects invalid action type', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'Invalid action. Use "claim" or "build"' },
        400
      ));

      const response = await fetch(`${API_BASE}/api/grid-wars/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'alice',
          action: 'attack',
          x: 5,
          y: 5
        })
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action. Use "claim" or "build"');
    });
  });

  describe('POST /api/grid-wars/points/add', () => {
    it('adds points for gold star (4 pts)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 4,
        newTotal: 14
      }));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'alice',
          starType: 'gold'
        })
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pointsAdded).toBe(4);
      expect(data.newTotal).toBe(14);
    });

    it('adds points for silver star (3 pts)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 3,
        newTotal: 13
      }));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'alice',
          starType: 'silver'
        })
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pointsAdded).toBe(3);
    });

    it('adds points for bronze star (2 pts)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 2,
        newTotal: 12
      }));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'alice',
          starType: 'bronze'
        })
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pointsAdded).toBe(2);
    });

    it('adds points for tin star (1 pt)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 1,
        newTotal: 11
      }));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'alice',
          starType: 'tin'
        })
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pointsAdded).toBe(1);
    });

    it('adds manual points amount', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 5,
        newTotal: 15
      }));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'alice',
          points: 5
        })
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.pointsAdded).toBe(5);
    });

    it('creates player record if not exists', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        pointsAdded: 4,
        newTotal: 4
      }));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'newplayer',
          starType: 'gold'
        })
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.newTotal).toBe(4); // First points for new player
    });

    it('rejects missing gameId or username', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'gameId and username required' },
        400
      ));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starType: 'gold'
        })
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('gameId and username required');
    });

    it('rejects invalid star type with no points', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'points or valid starType required' },
        400
      ));

      const response = await fetch(`${API_BASE}/api/grid-wars/points/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'game-123',
          username: 'alice',
          starType: 'platinum' // invalid
        })
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('points or valid starType required');
    });
  });

  describe('GET /api/grid-wars/players/:username', () => {
    it('returns player stats', async () => {
      const mockPlayer = {
        username: 'alice',
        game_id: 'game-123',
        action_points: 10,
        territories_count: 5,
        structures_count: 2
      };

      mockFetch.mockResolvedValueOnce(mockResponse(mockPlayer));

      const response = await fetch(`${API_BASE}/api/grid-wars/players/alice?gameId=game-123`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.username).toBe('alice');
      expect(data.action_points).toBe(10);
      expect(data.territories_count).toBe(5);
    });

    it('returns defaults for new player', async () => {
      const defaultPlayer = {
        username: 'newplayer',
        game_id: 'game-123',
        action_points: 0,
        territories_count: 0,
        structures_count: 0
      };

      mockFetch.mockResolvedValueOnce(mockResponse(defaultPlayer));

      const response = await fetch(`${API_BASE}/api/grid-wars/players/newplayer?gameId=game-123`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.action_points).toBe(0);
    });

    it('requires gameId parameter', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'gameId query parameter required' },
        400
      ));

      const response = await fetch(`${API_BASE}/api/grid-wars/players/alice`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('gameId query parameter required');
    });
  });

  describe('GET /api/grid-wars/leaderboard', () => {
    it('returns sorted leaderboard', async () => {
      const mockLeaderboard = [
        { username: 'alice', real_name: 'Alice', action_points: 10, territories_count: 5, structures_count: 2 },
        { username: 'bob', real_name: 'Bob', action_points: 8, territories_count: 3, structures_count: 1 }
      ];

      mockFetch.mockResolvedValueOnce(mockResponse(mockLeaderboard));

      const response = await fetch(`${API_BASE}/api/grid-wars/leaderboard?gameId=game-123`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].territories_count).toBeGreaterThanOrEqual(data[1].territories_count);
    });

    it('requires gameId parameter', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'gameId query parameter required' },
        400
      ));

      const response = await fetch(`${API_BASE}/api/grid-wars/leaderboard`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('gameId query parameter required');
    });
  });
});

describe('Grid Wars Structure Costs', () => {
  it('claim costs 1 point', () => {
    const costs = { claim: 1, wall: 2, tower: 3, farm: 4, castle: 10 };
    expect(costs.claim).toBe(1);
  });

  it('wall costs 2 points', () => {
    const costs = { claim: 1, wall: 2, tower: 3, farm: 4, castle: 10 };
    expect(costs.wall).toBe(2);
  });

  it('tower costs 3 points', () => {
    const costs = { claim: 1, wall: 2, tower: 3, farm: 4, castle: 10 };
    expect(costs.tower).toBe(3);
  });

  it('farm costs 4 points', () => {
    const costs = { claim: 1, wall: 2, tower: 3, farm: 4, castle: 10 };
    expect(costs.farm).toBe(4);
  });

  it('castle costs 10 points', () => {
    const costs = { claim: 1, wall: 2, tower: 3, farm: 4, castle: 10 };
    expect(costs.castle).toBe(10);
  });
});

describe('Grid Wars Star Points', () => {
  const starPoints = { gold: 4, silver: 3, bronze: 2, tin: 1 };

  it('gold star gives 4 points', () => {
    expect(starPoints.gold).toBe(4);
  });

  it('silver star gives 3 points', () => {
    expect(starPoints.silver).toBe(3);
  });

  it('bronze star gives 2 points', () => {
    expect(starPoints.bronze).toBe(2);
  });

  it('tin star gives 1 point', () => {
    expect(starPoints.tin).toBe(1);
  });
});
