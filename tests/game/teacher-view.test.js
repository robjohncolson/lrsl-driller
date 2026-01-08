/**
 * Teacher View Tests
 * Tests for the teacher map display and state management (simplified territory game)
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
    status: 'active'
  };

  // Mock state response (simplified - no structures)
  const mockGameState = {
    game_id: 'test-game',
    territories: [
      { x: 5, y: 5, owner: 'alice' },
      { x: 6, y: 5, owner: 'alice' },
      { x: 7, y: 7, owner: 'bob' }
    ],
    players: [
      { username: 'alice', action_points: 10, territories_count: 2, position_x: 5, position_y: 5, health: 100 },
      { username: 'bob', action_points: 5, territories_count: 1, position_x: 7, position_y: 7, health: 95 }
    ]
  };

  // Mock leaderboard response
  const mockLeaderboard = [
    { username: 'alice', action_points: 10, territories_count: 2 },
    { username: 'bob', action_points: 5, territories_count: 1 }
  ];

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockRenderer = {
      loadState: vi.fn(),
      setTerritory: vi.fn(),
      setAvatars: vi.fn(),
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
          players: expect.any(Array)
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

    it('handles avatar_moved message', () => {
      teacherView.players = [{ username: 'alice', position_x: 5, position_y: 5, health: 100 }];

      teacherView.handleMessage({
        type: 'avatar_moved',
        gameId: 'test-game',
        username: 'alice',
        x: 8,
        y: 10,
        health: 85
      });

      expect(teacherView.players[0].position_x).toBe(8);
      expect(teacherView.players[0].position_y).toBe(10);
      expect(teacherView.players[0].health).toBe(85);
      expect(mockRenderer.setAvatars).toHaveBeenCalled();
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

    it('handles grid_full_state message', () => {
      teacherView.handleMessage({
        type: 'grid_full_state',
        gameId: 'test-game',
        territories: [
          { x: 1, y: 1, owner: 'alice' },
          { x: 2, y: 2, owner: 'bob' }
        ],
        players: [
          { username: 'alice', action_points: 15, position_x: 1, position_y: 1, health: 100 },
          { username: 'bob', action_points: 8, position_x: 2, position_y: 2, health: 90 }
        ]
      });

      expect(teacherView.territories).toHaveLength(2);
      expect(mockRenderer.loadState).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns computed statistics', () => {
      teacherView.territories = [
        { x: 1, y: 1, owner: 'alice' },
        { x: 2, y: 2, owner: 'bob' }
      ];
      teacherView.players = [
        { username: 'alice', action_points: 10, online: true },
        { username: 'bob', action_points: 5, online: false }
      ];

      const stats = teacherView.getStats();

      expect(stats).toEqual({
        territoriesCount: 2,
        playersCount: 2,
        onlineCount: 1,
        totalPoints: 15
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

  it('counts territories correctly', () => {
    const view = new TeacherView({});
    view.territories = [
      { x: 0, y: 0, owner: 'alice' },
      { x: 1, y: 1, owner: 'bob' },
      { x: 2, y: 2, owner: 'alice' }
    ];

    const stats = view.getStats();
    expect(stats.territoriesCount).toBe(3);
  });
});
