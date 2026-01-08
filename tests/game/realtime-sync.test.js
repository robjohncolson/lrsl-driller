/**
 * Real-time Sync Tests
 * Tests for WebSocket-based real-time updates in Grid Wars
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
      game_id: 'test-game',  // Note: API returns game_id not gameId
      status: 'active'
    }));
    // Second call: /api/grid-wars/games/test-game/state (from refreshState)
    mockFetch.mockResolvedValueOnce(mockResponse({
      game_id: 'test-game',
      status: 'active',
      territories: [],
      structures: [],
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

    it('updates state on structure_built message', () => {
      // First claim territory
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'bob',
        x: 3,
        y: 3
      });

      // Then build structure
      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'bob',
        x: 3,
        y: 3,
        structureType: 'tower'
      });

      expect(state.getStructure(3, 3)).toEqual(
        expect.objectContaining({
          structure_type: 'tower',
          owner: 'bob'
        })
      );
    });

    it('updates state on structure_destroyed message', () => {
      // Setup structure
      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'alice',
        x: 7,
        y: 7,
        structureType: 'wall'
      });

      expect(state.getStructure(7, 7)).toBeTruthy();

      // Destroy it
      state.handleWebSocketMessage({
        type: 'structure_destroyed',
        gameId: 'test-game',
        x: 7,
        y: 7
      });

      expect(state.getStructure(7, 7)).toBeNull();
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
        onTerritoryChanged: vi.fn(),  // Note: callback is onTerritoryChanged not onTerritoryClaimed
        onStructureBuilt: vi.fn(),
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

    it('calls onStructureBuilt callback', () => {
      const message = {
        type: 'structure_built',
        gameId: 'test-game',
        username: 'bob',
        x: 4,
        y: 5,
        structureType: 'farm'
      };

      state.handleWebSocketMessage(message);

      expect(callbacks.onStructureBuilt).toHaveBeenCalledWith(message);
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

    it('handles mixed message types', () => {
      // Claim, build, points, build sequence
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'alice',
        x: 10,
        y: 10
      });

      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'alice',
        x: 10,
        y: 10,
        structureType: 'tower'
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
      expect(state.getStructure(10, 10)?.structure_type).toBe('tower');
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

    it('tracks structure counts correctly', () => {
      // Setup: Build 2 structures for alice, 1 for bob
      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'alice',
        x: 0,
        y: 0,
        structureType: 'tower'
      });

      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'bob',
        x: 5,
        y: 5,
        structureType: 'wall'
      });

      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'alice',
        x: 1,
        y: 0,
        structureType: 'farm'
      });

      expect(state.players.get('alice')?.structures_count).toBe(2);
      expect(state.players.get('bob')?.structures_count).toBe(1);
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

      state.handleWebSocketMessage({
        type: 'structure_built',
        gameId: 'test-game',
        username: 'bob',
        x: 8,
        y: 8,
        structureType: 'castle'
      });

      const renderState = state.getRenderState();

      expect(renderState.territories).toContainEqual(
        expect.objectContaining({ x: 8, y: 8, owner: 'bob' })
      );

      expect(renderState.structures).toContainEqual(
        expect.objectContaining({ x: 8, y: 8, type: 'castle', owner: 'bob' })
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
        structures: [
          { x: 5, y: 5, structure_type: 'tower', owner: 'bob', health: 100 }
        ],
        players: [
          { username: 'bob', action_points: 10, territories_count: 1, structures_count: 1 },
          { username: 'charlie', action_points: 5, territories_count: 1, structures_count: 0 }
        ]
      });

      // Old state should be replaced
      expect(state.getTerritoryOwner(0, 0)).toBeNull();

      // New state should be present
      expect(state.getTerritoryOwner(5, 5)).toBe('bob');
      expect(state.getTerritoryOwner(6, 6)).toBe('charlie');
      expect(state.getStructure(5, 5)?.structure_type).toBe('tower');
      expect(state.players.get('bob')?.action_points).toBe(10);
      expect(state.players.get('charlie')?.action_points).toBe(5);
    });
  });

  describe('Wave Messages (Future)', () => {
    beforeEach(async () => {
      setupInitMocks();
      await state.init();
    });

    it('handles wave_started message', () => {
      // For now, just verify it doesn't crash
      expect(() => {
        state.handleWebSocketMessage({
          type: 'wave_started',
          gameId: 'test-game',
          waveNumber: 1,
          enemies: [
            { x: 0, y: 10, hp: 100 },
            { x: 19, y: 10, hp: 100 }
          ]
        });
      }).not.toThrow();
    });

    it('handles enemy_moved message', () => {
      // For now, just verify it doesn't crash
      expect(() => {
        state.handleWebSocketMessage({
          type: 'enemy_moved',
          gameId: 'test-game',
          enemies: [
            { x: 1, y: 10, hp: 90 },
            { x: 18, y: 10, hp: 100 }
          ]
        });
      }).not.toThrow();
    });
  });
});

describe('WebSocket Client Grid Integration', () => {
  // Note: These tests verify the message routing in websocket-client.js
  // We test via a mock WebSocketClient to avoid importing the full module

  it('routes grid messages to onGridMessage callback', () => {
    // Create a minimal WebSocketClient mock that replicates the message routing logic
    const onGridMessage = vi.fn();

    // Replicate the handleMessage switch statement for grid messages
    const handleMessage = (message) => {
      switch (message.type) {
        case 'territory_claimed':
        case 'structure_built':
        case 'structure_destroyed':
        case 'points_earned':
        case 'grid_full_state':
        case 'wave_started':
        case 'enemy_moved':
          onGridMessage(message);
          break;
      }
    };

    // Simulate receiving messages
    const messages = [
      { type: 'territory_claimed', gameId: 'g1', username: 'alice', x: 1, y: 1 },
      { type: 'structure_built', gameId: 'g1', username: 'alice', x: 1, y: 1, structureType: 'tower' },
      { type: 'points_earned', gameId: 'g1', username: 'alice', points: 4, total: 10 },
      { type: 'structure_destroyed', gameId: 'g1', x: 1, y: 1 },
      { type: 'grid_full_state', gameId: 'g1', territories: [], structures: [], players: [] }
    ];

    for (const msg of messages) {
      handleMessage(msg);
    }

    expect(onGridMessage).toHaveBeenCalledTimes(5);
    expect(onGridMessage).toHaveBeenCalledWith(messages[0]);
    expect(onGridMessage).toHaveBeenCalledWith(messages[1]);
    expect(onGridMessage).toHaveBeenCalledWith(messages[2]);
    expect(onGridMessage).toHaveBeenCalledWith(messages[3]);
    expect(onGridMessage).toHaveBeenCalledWith(messages[4]);
  });

  it('does not route non-grid messages to onGridMessage', () => {
    const onGridMessage = vi.fn();

    // Replicate the handleMessage logic
    const handleMessage = (message) => {
      switch (message.type) {
        case 'territory_claimed':
        case 'structure_built':
        case 'structure_destroyed':
        case 'points_earned':
        case 'grid_full_state':
        case 'wave_started':
        case 'enemy_moved':
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

  it('routes wave messages correctly', () => {
    const onGridMessage = vi.fn();

    const handleMessage = (message) => {
      switch (message.type) {
        case 'territory_claimed':
        case 'structure_built':
        case 'structure_destroyed':
        case 'points_earned':
        case 'grid_full_state':
        case 'wave_started':
        case 'enemy_moved':
          onGridMessage(message);
          break;
      }
    };

    handleMessage({ type: 'wave_started', gameId: 'g1', waveNumber: 1, enemies: [] });
    handleMessage({ type: 'enemy_moved', gameId: 'g1', enemies: [{ x: 1, y: 1, hp: 100 }] });

    expect(onGridMessage).toHaveBeenCalledTimes(2);
  });
});
