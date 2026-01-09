/**
 * Grid Wars v1.2 Tests
 * Tests for the cleanup and balance update:
 * - Activity-based takeover pricing
 * - Network optimizations (delta handling, state snapshots)
 * - Enhanced avatar chevron
 * - Optional session end
 * - Contestation removal verification
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

describe('Grid Wars v1.2 Features', () => {
  describe('Activity-Based Takeover Pricing', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 50, territories_count: 5, health: 100 });
      state.players.set('bob', { action_points: 30, territories_count: 3, health: 100 });
    });

    it('has correct activity-based config values', () => {
      expect(GRID_WARS_CONFIG.takeoverCostBase).toBe(15);
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(25);
      expect(GRID_WARS_CONFIG.activeDrillingWindow).toBe(120); // v1.2.1: extended to 2 minutes
    });

    it('getClaimCostAt returns cost info object for neutral cell', () => {
      const costInfo = state.getClaimCostAt(5, 5);

      expect(costInfo).toEqual({
        cost: GRID_WARS_CONFIG.claimCost,
        isEnemy: false
      });
    });

    it('getClaimCostAt returns both pricing tiers for enemy cell', () => {
      state.territories.set('5,5', { owner: 'bob' });
      const costInfo = state.getClaimCostAt(5, 5);

      expect(costInfo.cost).toBe(GRID_WARS_CONFIG.takeoverCostBase);
      expect(costInfo.activeCost).toBe(GRID_WARS_CONFIG.takeoverCostActive);
      expect(costInfo.isEnemy).toBe(true);
      expect(costInfo.defender).toBe('bob');
    });

    it('getClaimCostAt returns null for own cell', () => {
      state.territories.set('5,5', { owner: 'alice' });
      const costInfo = state.getClaimCostAt(5, 5);

      expect(costInfo).toBeNull();
    });

    it('canAffordClaimAt uses base cost for enemy territory check', () => {
      // With 50 points, can afford base takeover (15)
      state.territories.set('5,5', { owner: 'bob' });
      expect(state.canAffordClaimAt(5, 5)).toBe(true);

      // With 14 points, cannot afford base takeover (15)
      state.players.set('alice', { action_points: 14, territories_count: 5, health: 100 });
      expect(state.canAffordClaimAt(5, 5)).toBe(false);
    });

    it('canAffordClaimAt checks for neutral territory cost', () => {
      // With 10 points exactly, can afford neutral claim
      state.players.set('alice', { action_points: 10, territories_count: 5, health: 100 });
      expect(state.canAffordClaimAt(5, 5)).toBe(true);

      // With 9 points, cannot afford neutral claim
      state.players.set('alice', { action_points: 9, territories_count: 5, health: 100 });
      expect(state.canAffordClaimAt(5, 5)).toBe(false);
    });
  });

  describe('Network Optimizations - State Snapshots', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 30, territories_count: 0, health: 100 });
    });

    it('handles state_snapshot message correctly', () => {
      const onTerritoryChanged = vi.fn();
      state.onTerritoryChanged = onTerritoryChanged;

      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        territories: [
          { x: 0, y: 0, owner: 'alice', strength: 2, node_type: null },
          { x: 1, y: 0, owner: 'bob', strength: 1, node_type: 'amplifier' }
        ],
        players: [
          { username: 'alice', action_points: 100, territories_count: 1 },
          { username: 'bob', action_points: 50, territories_count: 1 }
        ]
      });

      // Verify territories were set
      expect(state.territories.get('0,0').owner).toBe('alice');
      expect(state.territories.get('0,0').strength).toBe(2);
      expect(state.territories.get('1,0').owner).toBe('bob');
      expect(state.territories.get('1,0').node_type).toBe('amplifier');

      // Verify players were updated
      expect(state.players.get('alice').action_points).toBe(100);
      expect(state.players.get('bob').action_points).toBe(50);
    });

    it('clears existing territories on state_snapshot', () => {
      // Pre-populate with old data
      state.territories.set('10,10', { owner: 'oldplayer', strength: 1 });

      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        territories: [
          { x: 0, y: 0, owner: 'alice', strength: 1, node_type: null }
        ],
        players: []
      });

      // Old territory should be cleared
      expect(state.territories.has('10,10')).toBe(false);
      expect(state.territories.size).toBe(1);
    });
  });

  describe('Network Optimizations - Delta Compression', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 30, territories_count: 0, health: 100 });
    });

    it('handles grid_delta message with multiple updates', () => {
      const onTerritoryChanged = vi.fn();
      state.onTerritoryChanged = onTerritoryChanged;

      state.handleWebSocketMessage({
        type: 'grid_delta',
        gameId: 'test-game',
        updates: [
          { type: 'territory_claimed', x: 0, y: 0, username: 'alice' },
          { type: 'territory_claimed', x: 1, y: 0, username: 'bob' },
          { type: 'cell_strength_changed', x: 0, y: 0, strength: 2 }
        ]
      });

      // Verify both claims were applied
      expect(state.territories.get('0,0').owner).toBe('alice');
      expect(state.territories.get('1,0').owner).toBe('bob');

      // Verify strength update was applied
      expect(state.territories.get('0,0').strength).toBe(2);
    });

    it('handles grid_delta with decay updates', () => {
      // Pre-populate territory
      state.territories.set('5,5', { owner: 'bob', strength: 3, node_type: null });
      state.players.set('bob', { action_points: 10, territories_count: 1, health: 100 });

      state.handleWebSocketMessage({
        type: 'grid_delta',
        gameId: 'test-game',
        updates: [
          { type: 'cell_decayed', x: 5, y: 5, owner: null, strength: 0, previousOwner: 'bob' }
        ]
      });

      // Territory should be removed after decay to 0
      expect(state.territories.has('5,5')).toBe(false);
    });

    it('ignores grid_delta for different game', () => {
      state.handleWebSocketMessage({
        type: 'grid_delta',
        gameId: 'different-game',
        updates: [
          { type: 'territory_claimed', x: 0, y: 0, username: 'alice' }
        ]
      });

      expect(state.territories.size).toBe(0);
    });
  });

  describe('Enhanced Avatar Chevron', () => {
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
      renderer.stopRenderLoop();
    });

    it('tracks direction changes correctly', () => {
      // Start position
      renderer.setAvatars([{ username: 'alice', x: 5, y: 5 }]);

      // Move right
      renderer.setAvatars([{ username: 'alice', x: 6, y: 5 }]);
      expect(renderer.lastAvatarPositions['alice'].direction).toBe('right');

      // Move down
      renderer.setAvatars([{ username: 'alice', x: 6, y: 6 }]);
      expect(renderer.lastAvatarPositions['alice'].direction).toBe('down');

      // Move left
      renderer.setAvatars([{ username: 'alice', x: 5, y: 6 }]);
      expect(renderer.lastAvatarPositions['alice'].direction).toBe('left');

      // Move up
      renderer.setAvatars([{ username: 'alice', x: 5, y: 5 }]);
      expect(renderer.lastAvatarPositions['alice'].direction).toBe('up');
    });

    it('preserves direction when avatar stays in place', () => {
      renderer.setAvatars([{ username: 'alice', x: 5, y: 5 }]);
      renderer.setAvatars([{ username: 'alice', x: 6, y: 5 }]); // Move right
      renderer.setAvatars([{ username: 'alice', x: 6, y: 5 }]); // Stay in place

      // Direction should be preserved
      expect(renderer.lastAvatarPositions['alice'].direction).toBe('right');
    });

    it('manages wake trails for multiple avatars', () => {
      renderer.setAvatars([
        { username: 'alice', x: 0, y: 0 },
        { username: 'bob', x: 10, y: 10 }
      ]);

      renderer.setAvatars([
        { username: 'alice', x: 1, y: 0 },
        { username: 'bob', x: 11, y: 10 }
      ]);

      expect(renderer.avatarWakes['alice'].length).toBe(1);
      expect(renderer.avatarWakes['bob'].length).toBe(1);
      // Wake entries include timestamp for fade effect
      expect(renderer.avatarWakes['alice'][0].x).toBe(0);
      expect(renderer.avatarWakes['alice'][0].y).toBe(0);
      expect(renderer.avatarWakes['bob'][0].x).toBe(10);
      expect(renderer.avatarWakes['bob'][0].y).toBe(10);
    });
  });

  describe('Optional Session End', () => {
    let teacherView;

    beforeEach(() => {
      teacherView = new TeacherView({ serverUrl: 'http://localhost:3001' });
      teacherView.gameId = 'test-game';
      teacherView.ws = {
        readyState: 1, // WebSocket.OPEN
        send: vi.fn()
      };
    });

    it('endSession is callable at any time', async () => {
      teacherView.players = [
        { username: 'alice', action_points: 50, territories_count: 10 }
      ];
      teacherView.territories = Array(10).fill({});

      const rankings = await teacherView.endSession();

      expect(rankings).not.toBeNull();
      expect(rankings.totalPlayers).toBe(1);
    });

    it('endSession broadcasts to players via WebSocket', async () => {
      teacherView.players = [
        { username: 'alice', action_points: 50, territories_count: 10, largest_cluster: 8 }
      ];
      teacherView.territories = Array(10).fill({});

      await teacherView.endSession();

      expect(teacherView.ws.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(teacherView.ws.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('session_ended');
      expect(sentMessage.gameId).toBe('test-game');
    });

    it('calculateRankings works without session boundaries', () => {
      teacherView.players = [
        { username: 'alice', real_name: 'Alice', action_points: 100, territories_count: 20, largest_cluster: 15, online: true },
        { username: 'bob', real_name: 'Bob', action_points: 80, territories_count: 15, largest_cluster: 10, online: false }
      ];
      teacherView.territories = Array(35).fill({});

      const rankings = teacherView.calculateRankings();

      expect(rankings.territoryLeader.name).toBe('Alice');
      expect(rankings.topScholar.name).toBe('Alice');
      expect(rankings.topClaimer.name).toBe('Alice');
      expect(rankings.onlineChampion.name).toBe('Alice');
    });
  });

  describe('Contestation Removal Verification', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('config does not have contestation settings', () => {
      expect(GRID_WARS_CONFIG.contestationWindow).toBeUndefined();
      expect(GRID_WARS_CONFIG.contestationCost).toBeUndefined();
    });

    it('GridWarsState does not have contestation methods', () => {
      expect(state.getMyContestedCells).toBeUndefined();
      expect(state.reinforceCell).toBeUndefined();
    });

    it('ignores legacy contested message', () => {
      // Old contested messages should be silently ignored
      state.handleWebSocketMessage({
        type: 'cell_contested',
        gameId: 'test-game',
        x: 5,
        y: 5,
        contestedBy: 'bob'
      });

      // Should not throw, territory should not exist
      expect(state.territories.has('5,5')).toBe(false);
    });

    it('territory objects do not have contested_by field', () => {
      state.territories.set('5,5', { owner: 'alice', strength: 2, node_type: null });

      const territory = state.territories.get('5,5');
      expect(territory.contested_by).toBeUndefined();
    });
  });

  describe('Territory Strength (Retained from v3)', () => {
    let state;

    beforeEach(() => {
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 50, territories_count: 2, health: 100 });
    });

    it('new claims start at max strength', () => {
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        username: 'alice',
        x: 5,
        y: 5
      });

      // New claims always start at max strength (3)
      expect(state.territories.get('5,5').strength).toBe(GRID_WARS_CONFIG.maxCellStrength);
    });

    it('handles cell_strength_changed message', () => {
      state.territories.set('5,5', { owner: 'alice', strength: 1, node_type: null });

      state.handleWebSocketMessage({
        type: 'cell_strength_changed',
        gameId: 'test-game',
        x: 5,
        y: 5,
        strength: 2
      });

      expect(state.territories.get('5,5').strength).toBe(2);
    });

    it('handles cell_decayed message', () => {
      state.territories.set('5,5', { owner: 'bob', strength: 1, node_type: null });

      state.handleWebSocketMessage({
        type: 'cell_decayed',
        gameId: 'test-game',
        x: 5,
        y: 5,
        owner: null,
        strength: 0
      });

      expect(state.territories.has('5,5')).toBe(false);
    });
  });

  describe('Resource Nodes (Retained from v3)', () => {
    it('only amplifier nodes in config', () => {
      const nodePositions = GRID_WARS_CONFIG.nodePositions || [];

      for (const node of nodePositions) {
        expect(node.type).toBe('amplifier');
      }
    });

    it('amplifier bonus and charges configured', () => {
      expect(GRID_WARS_CONFIG.amplifierBonus).toBe(3);
      expect(GRID_WARS_CONFIG.amplifierCharges).toBe(5);
    });
  });
});
