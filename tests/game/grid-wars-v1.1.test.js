/**
 * Grid Wars v1.1 Tests
 * Tests for the clarity update features:
 * - Avatar visibility (diamond cursor, wake trails)
 * - Direct territory takeover (20 pts for enemy cells)
 * - Audio feedback module
 * - End-of-session rankings
 * - Simplified buffs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';
import { TeacherView } from '../../platform/game/teacher-view.js';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock window for browser-dependent code
global.window = {
  devicePixelRatio: 1,
  requestAnimationFrame: vi.fn(cb => setTimeout(cb, 16)),
  cancelAnimationFrame: vi.fn()
};
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.cancelAnimationFrame = global.window.cancelAnimationFrame;

// Import GridRenderer after window mock is set up
const { GridRenderer } = await import('../../platform/game/grid-renderer.js');

describe('Grid Wars v1.1 Features', () => {
  describe('Avatar Wake Tracking', () => {
    let renderer;
    let mockCanvas;
    let mockCtx;

    beforeEach(() => {
      mockCtx = {
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        fillText: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
      };
      mockCanvas = {
        getContext: () => mockCtx,
        width: 600,
        height: 600,
        style: {},
        parentElement: { clientWidth: 600, clientHeight: 600 }
      };
      renderer = new GridRenderer(mockCanvas, { gridSize: 20, cellSize: 30 });
      renderer.stopRenderLoop(); // Prevent animation loop in tests
    });

    it('initializes with empty wake trails', () => {
      expect(renderer.avatarWakes).toEqual({});
      expect(renderer.lastAvatarPositions).toEqual({});
    });

    it('tracks avatar movement and creates wake trail', () => {
      // First position
      renderer.setAvatars([{ username: 'alice', x: 5, y: 5 }]);
      expect(renderer.lastAvatarPositions['alice']).toBeDefined();
      expect(renderer.lastAvatarPositions['alice'].x).toBe(5);
      expect(renderer.lastAvatarPositions['alice'].y).toBe(5);

      // Move to new position
      renderer.setAvatars([{ username: 'alice', x: 6, y: 5 }]);
      expect(renderer.avatarWakes['alice']).toBeDefined();
      expect(renderer.avatarWakes['alice'].length).toBe(1);
      expect(renderer.avatarWakes['alice'][0].x).toBe(5);
      expect(renderer.avatarWakes['alice'][0].y).toBe(5);
    });

    it('limits wake trail to 3 positions', () => {
      renderer.setAvatars([{ username: 'alice', x: 0, y: 0 }]);
      renderer.setAvatars([{ username: 'alice', x: 1, y: 0 }]);
      renderer.setAvatars([{ username: 'alice', x: 2, y: 0 }]);
      renderer.setAvatars([{ username: 'alice', x: 3, y: 0 }]);
      renderer.setAvatars([{ username: 'alice', x: 4, y: 0 }]);

      expect(renderer.avatarWakes['alice'].length).toBe(3);
      // Most recent positions first
      expect(renderer.avatarWakes['alice'][0].x).toBe(3);
      expect(renderer.avatarWakes['alice'][1].x).toBe(2);
      expect(renderer.avatarWakes['alice'][2].x).toBe(1);
    });

    it('calculates movement direction correctly', () => {
      expect(renderer.getDirection(0, 0, 1, 0)).toBe('right');
      expect(renderer.getDirection(1, 0, 0, 0)).toBe('left');
      expect(renderer.getDirection(0, 0, 0, 1)).toBe('down');
      expect(renderer.getDirection(0, 1, 0, 0)).toBe('up');
    });

    it('stores direction on avatar after movement', () => {
      renderer.setAvatars([{ username: 'alice', x: 5, y: 5 }]);
      renderer.setAvatars([{ username: 'alice', x: 6, y: 5 }]);

      expect(renderer.lastAvatarPositions['alice'].direction).toBe('right');
    });
  });

  describe('Direct Territory Takeover', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 30, territories_count: 0, health: 100 });
    });

    // v1.2: Updated pricing - activity-based takeover costs
    it('has activity-based takeover costs in config', () => {
      expect(GRID_WARS_CONFIG.takeoverCostBase).toBe(15);    // Inactive defender
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(25);  // Active defender
    });

    // v1.2: getClaimCostAt now returns cost info object
    it('returns correct cost for neutral cell', () => {
      const costInfo = state.getClaimCostAt(5, 5);
      expect(costInfo.cost).toBe(GRID_WARS_CONFIG.claimCost); // 10
      expect(costInfo.isEnemy).toBe(false);
    });

    it('returns base cost and active cost for enemy cell', () => {
      state.territories.set('5,5', { owner: 'bob' });
      const costInfo = state.getClaimCostAt(5, 5);
      expect(costInfo.cost).toBe(GRID_WARS_CONFIG.takeoverCostBase); // 15
      expect(costInfo.activeCost).toBe(GRID_WARS_CONFIG.takeoverCostActive); // 25
      expect(costInfo.isEnemy).toBe(true);
    });

    it('returns null for own cell', () => {
      state.territories.set('5,5', { owner: 'alice' });
      const cost = state.getClaimCostAt(5, 5);
      expect(cost).toBeNull();
    });

    it('canAffordClaimAt returns true for affordable neutral cell', () => {
      expect(state.canAffordClaimAt(5, 5)).toBe(true);
    });

    it('canAffordClaimAt returns true for affordable enemy cell', () => {
      state.territories.set('5,5', { owner: 'bob' });
      expect(state.canAffordClaimAt(5, 5)).toBe(true);
    });

    it('canAffordClaimAt returns false for own cell', () => {
      state.territories.set('5,5', { owner: 'alice' });
      expect(state.canAffordClaimAt(5, 5)).toBe(false);
    });

    it('canAffordClaimAt returns false when points insufficient for takeover', () => {
      // v1.2: Base takeover cost is now 15 (was 20), so need less than 15 to test
      state.players.set('alice', { action_points: 14, territories_count: 0, health: 100 });
      state.territories.set('5,5', { owner: 'bob' });
      expect(state.canAffordClaimAt(5, 5)).toBe(false);
    });
  });

  describe('Territory Lost WebSocket Handler', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 30, territories_count: 5, health: 100 });
      state.territories.set('5,5', { owner: 'alice' });
    });

    it('handles territory_lost message for own territory', () => {
      const onTerritoryChanged = vi.fn();
      state.onTerritoryChanged = onTerritoryChanged;

      state.handleWebSocketMessage({
        type: 'territory_lost',
        gameId: 'test-game',
        username: 'alice',
        x: 5,
        y: 5,
        takenBy: 'bob'
      });

      // Territory should now belong to bob
      const territory = state.territories.get('5,5');
      expect(territory.owner).toBe('bob');

      // Callback should be called
      expect(onTerritoryChanged).toHaveBeenCalledWith({
        x: 5,
        y: 5,
        owner: 'bob',
        action: 'taken',
        previousOwner: 'alice'
      });
    });

    it('decrements territory count when losing territory', () => {
      state.handleWebSocketMessage({
        type: 'territory_lost',
        gameId: 'test-game',
        username: 'alice',
        x: 5,
        y: 5,
        takenBy: 'bob'
      });

      const player = state.players.get('alice');
      expect(player.territories_count).toBe(4);
    });
  });

  describe('Teacher View Rankings', () => {
    let teacherView;

    beforeEach(() => {
      teacherView = new TeacherView({ serverUrl: 'http://localhost:3001' });
      teacherView.gameId = 'test-game';
    });

    it('calculates rankings with multiple players', () => {
      teacherView.players = [
        { username: 'alice', real_name: 'Alice', action_points: 50, territories_count: 10, largest_cluster: 8, online: true },
        { username: 'bob', real_name: 'Bob', action_points: 80, territories_count: 5, largest_cluster: 5, online: false },
        { username: 'carol', real_name: 'Carol', action_points: 30, territories_count: 15, largest_cluster: 12, online: true }
      ];
      teacherView.territories = Array(30).fill({ owner: 'someone' });

      const rankings = teacherView.calculateRankings();

      expect(rankings).not.toBeNull();
      expect(rankings.territoryLeader.name).toBe('Carol'); // largest_cluster = 12
      expect(rankings.topScholar.name).toBe('Bob'); // 80 points
      expect(rankings.topClaimer.name).toBe('Carol'); // 15 territories
      expect(rankings.onlineChampion.name).toBe('Alice'); // 50 points, online
      expect(rankings.totalPlayers).toBe(3);
      expect(rankings.totalTerritories).toBe(30);
      expect(rankings.totalPoints).toBe(160);
    });

    it('returns null for empty player list', () => {
      teacherView.players = [];
      const rankings = teacherView.calculateRankings();
      expect(rankings).toBeNull();
    });

    it('returns null when no players have points or territories', () => {
      teacherView.players = [
        { username: 'alice', action_points: 0, territories_count: 0 }
      ];
      const rankings = teacherView.calculateRankings();
      expect(rankings).toBeNull();
    });

    it('handles players without largest_cluster by using territories_count', () => {
      teacherView.players = [
        { username: 'alice', action_points: 10, territories_count: 5 },
        { username: 'bob', action_points: 5, territories_count: 8 }
      ];
      teacherView.territories = Array(13).fill({});

      const rankings = teacherView.calculateRankings();

      // Bob should be territory leader with 8 territories (no largest_cluster field)
      expect(rankings.territoryLeader.name).toBe('bob');
      expect(rankings.territoryLeader.score).toBe(8);
    });

    it('onlineChampion is null when no players online', () => {
      teacherView.players = [
        { username: 'alice', action_points: 50, territories_count: 10, online: false },
        { username: 'bob', action_points: 80, territories_count: 5, online: false }
      ];
      teacherView.territories = [];

      const rankings = teacherView.calculateRankings();

      expect(rankings.onlineChampion).toBeNull();
    });
  });

  describe('Audio Module', () => {
    it('exports sounds object with required methods', async () => {
      // Dynamic import to test module exports
      const { sounds, initAudio, setAudioEnabled } = await import('../../platform/game/audio.js');

      expect(typeof sounds.claim).toBe('function');
      expect(typeof sounds.takeover).toBe('function');
      expect(typeof sounds.points).toBe('function');
      expect(typeof sounds.alert).toBe('function');
      expect(typeof sounds.move).toBe('function');
      expect(typeof sounds.error).toBe('function');
      expect(typeof sounds.victory).toBe('function');
      expect(typeof sounds.sessionEnd).toBe('function');
      expect(typeof initAudio).toBe('function');
      expect(typeof setAudioEnabled).toBe('function');
    });
  });

  describe('Simplified Buffs', () => {
    it('all node positions in config are amplifier type', () => {
      // This tests the client-side expectation
      // The server config should have all nodes as 'amplifier'
      const nodeTypes = GRID_WARS_CONFIG.nodePositions?.map(n => n.type) || [];

      // If nodePositions is defined, all should be amplifier
      if (nodeTypes.length > 0) {
        nodeTypes.forEach(type => {
          expect(type).toBe('amplifier');
        });
      }
    });

    it('amplifierBonus is defined in config', () => {
      expect(GRID_WARS_CONFIG.amplifierBonus).toBe(3);
    });

    it('amplifierCharges is defined in config', () => {
      expect(GRID_WARS_CONFIG.amplifierCharges).toBe(5);
    });
  });

  describe('Optimistic Claim with Takeover', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 30, territories_count: 2, health: 100 });
      state.players.set('bob', { action_points: 20, territories_count: 5, health: 100 });
    });

    it('optimistic claim updates territory to new owner', () => {
      state.territories.set('5,5', { owner: 'bob', node_type: null });

      state._applyOptimisticClaim(5, 5, 20, 'bob');

      const territory = state.territories.get('5,5');
      expect(territory.owner).toBe('alice');
    });

    it('optimistic claim decrements previous owner territory count', () => {
      state.territories.set('5,5', { owner: 'bob', node_type: null });

      state._applyOptimisticClaim(5, 5, 20, 'bob');

      const bob = state.players.get('bob');
      expect(bob.territories_count).toBe(4);
    });

    it('optimistic claim increments new owner territory count', () => {
      state.territories.set('5,5', { owner: 'bob', node_type: null });

      state._applyOptimisticClaim(5, 5, 20, 'bob');

      const alice = state.players.get('alice');
      expect(alice.territories_count).toBe(3);
    });

    it('rollback restores previous owner', () => {
      state.territories.set('5,5', { owner: 'bob', node_type: null, strength: 3 });

      state._applyOptimisticClaim(5, 5, 20, 'bob');
      state._rollbackOptimisticClaim(5, 5, 20);

      const territory = state.territories.get('5,5');
      expect(territory.owner).toBe('bob');
    });

    it('rollback restores territory counts', () => {
      state.territories.set('5,5', { owner: 'bob', node_type: null, strength: 3 });

      state._applyOptimisticClaim(5, 5, 20, 'bob');
      state._rollbackOptimisticClaim(5, 5, 20);

      const alice = state.players.get('alice');
      const bob = state.players.get('bob');
      expect(alice.territories_count).toBe(2);
      expect(bob.territories_count).toBe(5);
    });
  });
});
