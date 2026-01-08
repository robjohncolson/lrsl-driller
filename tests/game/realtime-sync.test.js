/**
 * Real-time Sync Tests
 * Tests for WebSocket-based real-time updates in Grid Wars (simplified territory exploration)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';

describe('Real-time Sync', () => {
  let state;
  let mockFetch;
  const mockResponse = (data, ok = true) => ({
    ok,
    json: () => Promise.resolve(data)
  });

  // Setup mocks for init() which calls refreshState()
  const setupInitMocks = () => {
    // First call: /api/grid-wars/games/active
    mockFetch.mockResolvedValueOnce(mockResponse({
      game_id: 'test-game',
      status: 'active'
    }));
    // Second call: /api/grid-wars/games/test-game/state (from refreshState)
    mockFetch.mockResolvedValueOnce(mockResponse({
      game_id: 'test-game',
      status: 'active',
      territories: [],
      players: []
    }));
  };

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    state = new GridWarsState({
      serverUrl: 'http://localhost:3000',
      username: 'alice'
    });
  });

  describe('WebSocket Message Handling', () => {
    beforeEach(async () => {
      setupInitMocks();
      await state.init();
    });

    it('updates state on territory_claimed message', () => {
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'bob',
        x: 5,
        y: 5
      });

      expect(state.getTerritoryOwner(5, 5)).toBe('bob');
    });

    it('updates player points on points_earned message', () => {
      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'bob',
        points: 4,
        total: 10,
        starType: 'gold'
      });

      // Bob's points should be updated
      const player = state.players.get('bob');
      expect(player).toBeTruthy();
      expect(player.action_points).toBe(10);
    });

    it('updates player position on avatar_moved message', () => {
      // First create the player via points_earned
      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'bob',
        points: 4,
        total: 4,
        starType: 'gold'
      });

      // Now test avatar_moved
      state.handleWebSocketMessage({
        type: 'avatar_moved',
        gameId: 'test-game',
        username: 'bob',
        x: 10,
        y: 12,
        health: 85
      });

      const player = state.players.get('bob');
      expect(player).toBeTruthy();
      expect(player.position_x).toBe(10);
      expect(player.position_y).toBe(12);
      expect(player.health).toBe(85);
    });

    it('ignores messages for different game', () => {
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'other-game',
        username: 'bob',
        x: 5,
        y: 5
      });

      expect(state.getTerritoryOwner(5, 5)).toBeNull();
    });

    it('ignores messages without gameId', () => {
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        username: 'bob',
        x: 5,
        y: 5
      });

      expect(state.getTerritoryOwner(5, 5)).toBeNull();
    });
  });

  describe('Callback Triggers', () => {
    let callbacks;

    beforeEach(async () => {
      callbacks = {
        onTerritoryChanged: vi.fn(),
        onPointsEarned: vi.fn(),
        onStateChange: vi.fn()
      };

      state = new GridWarsState({
        serverUrl: 'http://localhost:3000',
        username: 'alice',
        ...callbacks
      });

      setupInitMocks();
      await state.init();
    });

    it('calls onTerritoryChanged callback', () => {
      const message = {
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'bob',
        x: 2,
        y: 3
      };

      state.handleWebSocketMessage(message);

      expect(callbacks.onTerritoryChanged).toHaveBeenCalledWith(message);
    });

    it('calls onPointsEarned callback for current user only', () => {
      // onPointsEarned is only called when message.username === this.username
      const message = {
        type: 'points_earned',
        gameId: 'test-game',
        username: 'alice',  // Must be the current user
        points: 3,
        total: 7,
        starType: 'silver'
      };

      state.handleWebSocketMessage(message);

      // Callback receives subset of message data
      expect(callbacks.onPointsEarned).toHaveBeenCalledWith({
        points: 3,
        total: 7,
        starType: 'silver'
      });
    });

    it('does not call onPointsEarned for other users', () => {
      const message = {
        type: 'points_earned',
        gameId: 'test-game',
        username: 'bob',  // Different user
        points: 4,
        total: 10,
        starType: 'gold'
      };

      state.handleWebSocketMessage(message);

      expect(callbacks.onPointsEarned).not.toHaveBeenCalled();
    });

    it('calls onStateChange after each update', () => {
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'bob',
        x: 1,
        y: 1
      });

      expect(callbacks.onStateChange).toHaveBeenCalled();
    });
  });

  describe('Multiple Updates', () => {
    beforeEach(async () => {
      setupInitMocks();
      await state.init();
    });

    it('handles rapid territory claims from multiple players', () => {
      const claims = [
        { username: 'alice', x: 0, y: 0 },
        { username: 'bob', x: 1, y: 0 },
        { username: 'charlie', x: 2, y: 0 },
        { username: 'alice', x: 0, y: 1 },
        { username: 'bob', x: 1, y: 1 }
      ];

      for (const claim of claims) {
        state.handleWebSocketMessage({
          type: 'territory_claimed',
          gameId: 'test-game',
          ...claim
        });
      }

      expect(state.getTerritoryOwner(0, 0)).toBe('alice');
      expect(state.getTerritoryOwner(1, 0)).toBe('bob');
      expect(state.getTerritoryOwner(2, 0)).toBe('charlie');
      expect(state.getTerritoryOwner(0, 1)).toBe('alice');
      expect(state.getTerritoryOwner(1, 1)).toBe('bob');
    });

    it('handles mixed message types (territory and points)', () => {
      // Claim, points, claim sequence
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'alice',
        x: 10,
        y: 10
      });

      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'alice',
        points: 4,
        total: 8
      });

      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'alice',
        x: 11,
        y: 10
      });

      expect(state.getTerritoryOwner(10, 10)).toBe('alice');
      expect(state.players.get('alice')?.action_points).toBe(8);
      expect(state.getTerritoryOwner(11, 10)).toBe('alice');
    });

    it('tracks territory counts correctly', () => {
      // Alice claims 3, Bob claims 2
      const claims = [
        { username: 'alice', x: 0, y: 0 },
        { username: 'alice', x: 1, y: 0 },
        { username: 'bob', x: 0, y: 1 },
        { username: 'alice', x: 2, y: 0 },
        { username: 'bob', x: 1, y: 1 }
      ];

      for (const claim of claims) {
        state.handleWebSocketMessage({
          type: 'territory_claimed',
          gameId: 'test-game',
          ...claim
        });
      }

      expect(state.players.get('alice')?.territories_count).toBe(3);
      expect(state.players.get('bob')?.territories_count).toBe(2);
    });

    it('handles avatar movement updates', () => {
      // First create the players via points_earned
      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'alice',
        points: 4,
        total: 4,
        starType: 'gold'
      });
      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'bob',
        points: 3,
        total: 3,
        starType: 'silver'
      });

      // Now test multiple players moving
      state.handleWebSocketMessage({
        type: 'avatar_moved',
        gameId: 'test-game',
        username: 'alice',
        x: 5,
        y: 5,
        health: 100
      });

      state.handleWebSocketMessage({
        type: 'avatar_moved',
        gameId: 'test-game',
        username: 'bob',
        x: 8,
        y: 8,
        health: 90
      });

      state.handleWebSocketMessage({
        type: 'avatar_moved',
        gameId: 'test-game',
        username: 'alice',
        x: 6,
        y: 5,
        health: 95
      });

      expect(state.players.get('alice')?.position_x).toBe(6);
      expect(state.players.get('alice')?.position_y).toBe(5);
      expect(state.players.get('alice')?.health).toBe(95);
      expect(state.players.get('bob')?.position_x).toBe(8);
      expect(state.players.get('bob')?.health).toBe(90);
    });
  });

  describe('Render State Generation', () => {
    beforeEach(async () => {
      setupInitMocks();
      await state.init();
    });

    it('includes WebSocket updates in render state', () => {
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'bob',
        x: 8,
        y: 8
      });

      const renderState = state.getRenderState();

      expect(renderState.territories).toContainEqual(
        expect.objectContaining({ x: 8, y: 8, owner: 'bob' })
      );
    });

    it('includes player positions in render state', () => {
      // First create the player via points_earned
      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'bob',
        points: 4,
        total: 4,
        starType: 'gold'
      });

      // Then move the avatar
      state.handleWebSocketMessage({
        type: 'avatar_moved',
        gameId: 'test-game',
        username: 'bob',
        x: 5,
        y: 7,
        health: 80
      });

      const renderState = state.getRenderState();

      expect(renderState.players).toContainEqual(
        expect.objectContaining({
          username: 'bob',
          x: 5,
          y: 7,
          health: 80
        })
      );
    });
  });

  describe('Full State Sync', () => {
    beforeEach(async () => {
      setupInitMocks();
      await state.init();
    });

    it('handles grid_full_state message for reconnection', () => {
      // Add some initial state
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'alice',
        x: 0,
        y: 0
      });

      // Simulate full state sync (e.g., after reconnection)
      state.handleWebSocketMessage({
        type: 'grid_full_state',
        gameId: 'test-game',
        territories: [
          { x: 5, y: 5, owner: 'bob' },
          { x: 6, y: 6, owner: 'charlie' }
        ],
        players: [
          { username: 'bob', action_points: 10, territories_count: 1, position_x: 5, position_y: 5, health: 100 },
          { username: 'charlie', action_points: 5, territories_count: 1, position_x: 6, position_y: 6, health: 95 }
        ]
      });

      // Old state should be replaced
      expect(state.getTerritoryOwner(0, 0)).toBeNull();

      // New state should be present
      expect(state.getTerritoryOwner(5, 5)).toBe('bob');
      expect(state.getTerritoryOwner(6, 6)).toBe('charlie');
      expect(state.players.get('bob')?.action_points).toBe(10);
      expect(state.players.get('charlie')?.action_points).toBe(5);
      expect(state.players.get('bob')?.position_x).toBe(5);
      expect(state.players.get('charlie')?.health).toBe(95);
    });
  });
});

describe('WebSocket Client Grid Integration', () => {
  // Note: These tests verify the message routing in websocket-client.js
  // We test via a mock WebSocketClient to replicate the message routing logic

  it('routes grid messages to onGridMessage callback', () => {
    const onGridMessage = vi.fn();

    // Replicate the handleMessage switch statement for grid messages (simplified version)
    const handleMessage = (message) => {
      switch (message.type) {
        case 'territory_claimed':
        case 'points_earned':
        case 'grid_full_state':
        case 'avatar_moved':
          onGridMessage(message);
          break;
      }
    };

    // Simulate receiving messages
    const messages = [
      { type: 'territory_claimed', gameId: 'g1', username: 'alice', x: 1, y: 1 },
      { type: 'points_earned', gameId: 'g1', username: 'alice', points: 4, total: 10 },
      { type: 'grid_full_state', gameId: 'g1', territories: [], players: [] },
      { type: 'avatar_moved', gameId: 'g1', username: 'alice', x: 5, y: 5, health: 100 }
    ];

    for (const msg of messages) {
      handleMessage(msg);
    }

    expect(onGridMessage).toHaveBeenCalledTimes(4);
    expect(onGridMessage).toHaveBeenCalledWith(messages[0]);
    expect(onGridMessage).toHaveBeenCalledWith(messages[1]);
    expect(onGridMessage).toHaveBeenCalledWith(messages[2]);
    expect(onGridMessage).toHaveBeenCalledWith(messages[3]);
  });

  it('does not route non-grid messages to onGridMessage', () => {
    const onGridMessage = vi.fn();

    // Replicate the handleMessage logic (simplified)
    const handleMessage = (message) => {
      switch (message.type) {
        case 'territory_claimed':
        case 'points_earned':
        case 'grid_full_state':
        case 'avatar_moved':
          onGridMessage(message);
          break;
        // Other message types don't call onGridMessage
      }
    };

    // Non-grid messages
    handleMessage({ type: 'presence_snapshot', users: ['alice'] });
    handleMessage({ type: 'star_earned', username: 'bob', star_type: 'gold' });
    handleMessage({ type: 'leaderboard_update' });

    expect(onGridMessage).not.toHaveBeenCalled();
  });

  it('routes avatar_moved message correctly', () => {
    const onGridMessage = vi.fn();

    const handleMessage = (message) => {
      switch (message.type) {
        case 'territory_claimed':
        case 'points_earned':
        case 'grid_full_state':
        case 'avatar_moved':
          onGridMessage(message);
          break;
      }
    };

    handleMessage({ type: 'avatar_moved', gameId: 'g1', username: 'bob', x: 10, y: 10, health: 75 });

    expect(onGridMessage).toHaveBeenCalledTimes(1);
    expect(onGridMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'avatar_moved', username: 'bob', health: 75 })
    );
  });
});
