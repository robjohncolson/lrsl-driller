/**
 * Teacher View Tests
 * Tests for the teacher map display and state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TeacherView } from '../../platform/game/teacher-view.js';

describe('TeacherView', () => {
  let teacherView;
  let mockFetch;
  let mockRenderer;

  const mockResponse = (data, ok = true) => ({
    ok,
    json: () => Promise.resolve(data)
  });

  // Mock active game response
  const mockActiveGame = {
    game_id: 'test-game',
    status: 'active',
    wave_number: 0
  };

  // Mock state response
  const mockGameState = {
    game_id: 'test-game',
    territories: [
      { x: 5, y: 5, owner: 'alice' },
      { x: 6, y: 5, owner: 'alice' },
      { x: 7, y: 7, owner: 'bob' }
    ],
    structures: [
      { x: 5, y: 5, structure_type: 'tower', owner: 'alice' },
      { x: 7, y: 7, structure_type: 'wall', owner: 'bob' }
    ],
    players: [
      { username: 'alice', action_points: 10, territories_count: 2, structures_count: 1 },
      { username: 'bob', action_points: 5, territories_count: 1, structures_count: 1 }
    ],
    wave_number: 0
  };

  // Mock leaderboard response
  const mockLeaderboard = [
    { username: 'alice', action_points: 10, territories_count: 2, structures_count: 1 },
    { username: 'bob', action_points: 5, territories_count: 1, structures_count: 1 }
  ];

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockRenderer = {
      loadState: vi.fn(),
      setTerritory: vi.fn(),
      setStructure: vi.fn(),
      setEnemies: vi.fn(),
      pulseCell: vi.fn(),
      getPlayerColor: vi.fn(() => '#00ffff80')
    };

    teacherView = new TeacherView({
      serverUrl: 'http://localhost:3000',
      renderer: mockRenderer
    });
  });

  describe('constructor', () => {
    it('initializes with default values', () => {
      expect(teacherView.gameId).toBeNull();
      expect(teacherView.territories).toEqual([]);
      expect(teacherView.structures).toEqual([]);
      expect(teacherView.players).toEqual([]);
      expect(teacherView.connected).toBe(false);
    });

    it('accepts custom server URL', () => {
      expect(teacherView.serverUrl).toBe('http://localhost:3000');
    });

    it('computes WebSocket URL correctly', () => {
      expect(teacherView.wsUrl).toBe('ws://localhost:3000');

      const httpsView = new TeacherView({ serverUrl: 'https://example.com' });
      expect(httpsView.wsUrl).toBe('wss://example.com');
    });
  });

  describe('fetchActiveGame', () => {
    it('fetches and stores active game', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(mockActiveGame));

      await teacherView.fetchActiveGame();

      expect(teacherView.gameId).toBe('test-game');
      expect(teacherView.game).toEqual(mockActiveGame);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/grid-wars/games/active');
    });

    it('throws on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, false));

      await expect(teacherView.fetchActiveGame()).rejects.toThrow('Failed to fetch active game');
    });
  });

  describe('refresh', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(mockActiveGame));
      await teacherView.fetchActiveGame();
    });

    it('fetches game state and leaderboard', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse(mockGameState))
        .mockResolvedValueOnce(mockResponse(mockLeaderboard));

      await teacherView.refresh();

      expect(teacherView.territories).toHaveLength(3);
      expect(teacherView.structures).toHaveLength(2);
      expect(teacherView.players).toHaveLength(2);
    });

    it('updates renderer with state', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse(mockGameState))
        .mockResolvedValueOnce(mockResponse(mockLeaderboard));

      await teacherView.refresh();

      expect(mockRenderer.loadState).toHaveBeenCalledWith(
        expect.objectContaining({
          territories: expect.any(Array),
          structures: expect.any(Array)
        })
      );
    });

    it('calls onStateChange callback', async () => {
      const onStateChange = vi.fn();
      teacherView.onStateChange = onStateChange;

      mockFetch
        .mockResolvedValueOnce(mockResponse(mockGameState))
        .mockResolvedValueOnce(mockResponse(mockLeaderboard));

      await teacherView.refresh();

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          territoriesCount: 3,
          structuresCount: 2,
          totalPoints: 15
        })
      );
    });

    it('calls onPlayersChange callback', async () => {
      const onPlayersChange = vi.fn();
      teacherView.onPlayersChange = onPlayersChange;

      mockFetch
        .mockResolvedValueOnce(mockResponse(mockGameState))
        .mockResolvedValueOnce(mockResponse(mockLeaderboard));

      await teacherView.refresh();

      expect(onPlayersChange).toHaveBeenCalledWith(expect.any(Array));
      expect(onPlayersChange.mock.calls[0][0]).toHaveLength(2);
    });
  });

  describe('WebSocket message handling', () => {
    beforeEach(() => {
      teacherView.gameId = 'test-game';
    });

    it('handles territory_claimed message', () => {
      const onStateChange = vi.fn();
      teacherView.onStateChange = onStateChange;

      teacherView.handleMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'alice',
        x: 10,
        y: 10
      });

      expect(teacherView.territories).toContainEqual(
        expect.objectContaining({ x: 10, y: 10, owner: 'alice' })
      );
      expect(mockRenderer.setTerritory).toHaveBeenCalledWith(10, 10, 'alice');
      expect(mockRenderer.pulseCell).toHaveBeenCalledWith(10, 10, '#00ff41', 500);
      expect(onStateChange).toHaveBeenCalled();
    });

    it('handles structure_built message', () => {
      const onStateChange = vi.fn();
      teacherView.onStateChange = onStateChange;

      teacherView.handleMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'bob',
        x: 12,
        y: 12,
        structureType: 'tower'
      });

      expect(teacherView.structures).toContainEqual(
        expect.objectContaining({ x: 12, y: 12, structure_type: 'tower', owner: 'bob' })
      );
      expect(mockRenderer.setStructure).toHaveBeenCalledWith(12, 12, 'tower', 'bob');
      expect(mockRenderer.pulseCell).toHaveBeenCalledWith(12, 12, '#00ffff', 500);
      expect(onStateChange).toHaveBeenCalled();
    });

    it('handles structure_destroyed message', () => {
      // Setup: add a structure first
      teacherView.structures = [{ x: 5, y: 5, structure_type: 'wall', owner: 'alice' }];
      teacherView.players = [{ username: 'alice', structures_count: 1 }];

      teacherView.handleMessage({
        type: 'structure_destroyed',
        gameId: 'test-game',
        x: 5,
        y: 5
      });

      expect(teacherView.structures).toHaveLength(0);
      expect(mockRenderer.setStructure).toHaveBeenCalledWith(5, 5, null);
      expect(mockRenderer.pulseCell).toHaveBeenCalledWith(5, 5, '#ff3333', 500);
    });

    it('handles points_earned message', () => {
      teacherView.players = [{ username: 'alice', action_points: 5 }];

      teacherView.handleMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'alice',
        points: 4,
        total: 9
      });

      expect(teacherView.players[0].action_points).toBe(9);
    });

    it('handles points_earned for new player', () => {
      teacherView.handleMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'charlie',
        points: 3,
        total: 3
      });

      expect(teacherView.players).toContainEqual(
        expect.objectContaining({ username: 'charlie', action_points: 3 })
      );
    });

    it('handles wave_started message', () => {
      teacherView.handleMessage({
        type: 'wave_started',
        gameId: 'test-game',
        waveNumber: 1,
        enemies: [
          { x: 0, y: 10, hp: 100 },
          { x: 19, y: 10, hp: 100 }
        ]
      });

      expect(teacherView.waveNumber).toBe(1);
      expect(mockRenderer.setEnemies).toHaveBeenCalledWith([
        { x: 0, y: 10, hp: 100 },
        { x: 19, y: 10, hp: 100 }
      ]);
    });

    it('handles enemy_moved message', () => {
      teacherView.handleMessage({
        type: 'enemy_moved',
        gameId: 'test-game',
        enemies: [{ x: 1, y: 10, hp: 90 }]
      });

      expect(mockRenderer.setEnemies).toHaveBeenCalledWith([{ x: 1, y: 10, hp: 90 }]);
    });

    it('ignores messages for different game', () => {
      teacherView.handleMessage({
        type: 'territory_claimed',
        gameId: 'other-game',
        username: 'alice',
        x: 1,
        y: 1
      });

      expect(teacherView.territories).toHaveLength(0);
      expect(mockRenderer.setTerritory).not.toHaveBeenCalled();
    });

    it('handles presence_snapshot message', () => {
      teacherView.players = [
        { username: 'alice', online: false },
        { username: 'bob', online: false }
      ];

      teacherView.handleMessage({
        type: 'presence_snapshot',
        users: ['alice']
      });

      expect(teacherView.onlineUsers).toEqual(['alice']);
      expect(teacherView.players[0].online).toBe(true);
      expect(teacherView.players[1].online).toBe(false);
    });

    it('handles user_online message', () => {
      teacherView.players = [{ username: 'bob', online: false }];

      teacherView.handleMessage({
        type: 'user_online',
        username: 'bob'
      });

      expect(teacherView.onlineUsers).toContain('bob');
      expect(teacherView.players[0].online).toBe(true);
    });

    it('handles user_offline message', () => {
      teacherView.onlineUsers = ['alice', 'bob'];
      teacherView.players = [
        { username: 'alice', online: true },
        { username: 'bob', online: true }
      ];

      teacherView.handleMessage({
        type: 'user_offline',
        username: 'alice'
      });

      expect(teacherView.onlineUsers).toEqual(['bob']);
      expect(teacherView.players[0].online).toBe(false);
      expect(teacherView.players[1].online).toBe(true);
    });
  });

  describe('getStats', () => {
    it('returns computed statistics', () => {
      teacherView.territories = [
        { x: 1, y: 1, owner: 'alice' },
        { x: 2, y: 2, owner: 'bob' }
      ];
      teacherView.structures = [
        { x: 1, y: 1, structure_type: 'tower', owner: 'alice' }
      ];
      teacherView.players = [
        { username: 'alice', action_points: 10, online: true },
        { username: 'bob', action_points: 5, online: false }
      ];
      teacherView.waveNumber = 2;

      const stats = teacherView.getStats();

      expect(stats).toEqual({
        territoriesCount: 2,
        structuresCount: 1,
        playersCount: 2,
        onlineCount: 1,
        totalPoints: 15,
        waveNumber: 2
      });
    });
  });

  describe('territory count tracking', () => {
    it('updates player territory count on claim', () => {
      teacherView.players = [{ username: 'alice', territories_count: 0 }];
      teacherView.gameId = 'test-game';

      teacherView.handleMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'alice',
        x: 1,
        y: 1
      });

      expect(teacherView.players[0].territories_count).toBe(1);
    });

    it('creates player record if not exists', () => {
      teacherView.gameId = 'test-game';

      teacherView.handleMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'newplayer',
        x: 1,
        y: 1
      });

      expect(teacherView.players).toContainEqual(
        expect.objectContaining({ username: 'newplayer', territories_count: 1 })
      );
    });
  });

  describe('structure count tracking', () => {
    it('updates player structure count on build', () => {
      teacherView.players = [{ username: 'alice', structures_count: 0 }];
      teacherView.gameId = 'test-game';

      teacherView.handleMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'alice',
        x: 1,
        y: 1,
        structureType: 'tower'
      });

      expect(teacherView.players[0].structures_count).toBe(1);
    });

    it('decrements count on destruction', () => {
      teacherView.structures = [{ x: 1, y: 1, structure_type: 'tower', owner: 'alice' }];
      teacherView.players = [{ username: 'alice', structures_count: 1 }];
      teacherView.gameId = 'test-game';

      teacherView.handleMessage({
        type: 'structure_destroyed',
        gameId: 'test-game',
        x: 1,
        y: 1
      });

      expect(teacherView.players[0].structures_count).toBe(0);
    });
  });

  describe('disconnect', () => {
    it('cleans up resources', () => {
      teacherView.pollInterval = setInterval(() => {}, 1000);
      teacherView.connected = true;

      teacherView.disconnect();

      expect(teacherView.connected).toBe(false);
      expect(teacherView.pollInterval).toBeNull();
    });
  });
});

describe('Teacher View Statistics', () => {
  it('calculates total points correctly', () => {
    const view = new TeacherView({});
    view.players = [
      { username: 'a', action_points: 10 },
      { username: 'b', action_points: 20 },
      { username: 'c', action_points: 15 }
    ];

    const stats = view.getStats();
    expect(stats.totalPoints).toBe(45);
  });

  it('counts online players correctly', () => {
    const view = new TeacherView({});
    view.players = [
      { username: 'a', online: true },
      { username: 'b', online: true },
      { username: 'c', online: false },
      { username: 'd', online: false }
    ];

    const stats = view.getStats();
    expect(stats.onlineCount).toBe(2);
  });
});
