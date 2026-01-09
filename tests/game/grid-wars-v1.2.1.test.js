/**
 * Grid Wars v1.2.1 Tests
 * Tests for the visibility, economy, and resilience update:
 * - 3-tier activity pricing (ACTIVE/WARM/COLD)
 * - Boot bonus for new players
 * - Sequence gap detection + resync
 * - Visual dimming (ownerLastAnswer in render state)
 * - Config centralization verification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG, resetGridWarsState } from '../../platform/game/grid-state.js';

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

// Helper to create mock responses
function mockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
}

describe('Grid Wars v1.2.1 Features', () => {
  describe('3-Tier Activity Pricing Config', () => {
    it('has correct 3-tier cost values', () => {
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBe(15);   // >10min inactive
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBe(20);   // 2-10min inactive
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(25); // <2min inactive
    });

    it('has correct activity window thresholds', () => {
      expect(GRID_WARS_CONFIG.activeWindowSeconds).toBe(120);  // 2 minutes
      expect(GRID_WARS_CONFIG.warmWindowSeconds).toBe(600);    // 10 minutes
    });

    it('maintains legacy alias for backwards compatibility', () => {
      expect(GRID_WARS_CONFIG.takeoverCostBase).toBe(15);
      expect(GRID_WARS_CONFIG.activeDrillingWindow).toBe(120);
    });
  });

  describe('Boot Bonus', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'newplayer';
    });

    it('has correct boot bonus config value', () => {
      expect(GRID_WARS_CONFIG.bootBonus).toBe(15);
    });

    it('has onBootBonus callback slot', () => {
      expect(state.onBootBonus).toBeNull();

      const callback = vi.fn();
      state.onBootBonus = callback;
      expect(state.onBootBonus).toBe(callback);
    });

    it('calls onBootBonus when initAvatar returns bootBonus', async () => {
      const onBootBonus = vi.fn();
      state.onBootBonus = onBootBonus;

      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        x: 10,
        y: 10,
        health: 100,
        bootBonus: 15,
        actionPoints: 15
      }));

      await state.initAvatar();

      expect(onBootBonus).toHaveBeenCalledWith({ points: 15 });
    });

    it('does not call onBootBonus when bootBonus is 0', async () => {
      const onBootBonus = vi.fn();
      state.onBootBonus = onBootBonus;

      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        x: 10,
        y: 10,
        health: 100,
        bootBonus: 0
      }));

      await state.initAvatar();

      expect(onBootBonus).not.toHaveBeenCalled();
    });

    it('does not call onBootBonus when bootBonus is absent', async () => {
      const onBootBonus = vi.fn();
      state.onBootBonus = onBootBonus;

      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        x: 10,
        y: 10,
        health: 100
      }));

      await state.initAvatar();

      expect(onBootBonus).not.toHaveBeenCalled();
    });

    it('updates action_points from boot bonus response', async () => {
      state.players.set('newplayer', { action_points: 0, territories_count: 0, health: 100 });

      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        x: 10,
        y: 10,
        health: 100,
        bootBonus: 15,
        actionPoints: 15
      }));

      await state.initAvatar();

      expect(state.getActionPoints()).toBe(15);
    });
  });

  describe('Sequence Gap Detection', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('initializes sequence tracking as null/0', () => {
      expect(state._expectedSeq).toBeNull();
      expect(state._lastSeq).toBe(0);
    });

    it('has onResyncRequest callback slot', () => {
      expect(state.onResyncRequest).toBeNull();

      const callback = vi.fn();
      state.onResyncRequest = callback;
      expect(state.onResyncRequest).toBe(callback);
    });

    it('sets expected sequence from state_snapshot', () => {
      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 42,
        territories: [],
        players: []
      });

      // After processing seq 42, we expect seq 43 next
      expect(state._expectedSeq).toBe(43);
      expect(state._lastSeq).toBe(42);
    });

    it('increments expected sequence after processing message', () => {
      // Initialize with a snapshot
      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 10,
        territories: [],
        players: []
      });

      // After processing seq 10, expect seq 11 next
      expect(state._expectedSeq).toBe(11);
      expect(state._lastSeq).toBe(10);

      // Process the next message (seq 11)
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        seq: 11,
        x: 5,
        y: 5,
        username: 'alice'
      });

      // Now expect seq 12 next
      expect(state._expectedSeq).toBe(12);
      expect(state._lastSeq).toBe(11);
    });

    it('detects sequence gap and requests resync', () => {
      const onResyncRequest = vi.fn();
      state.onResyncRequest = onResyncRequest;

      // Initialize with sequence 10
      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 10,
        territories: [],
        players: []
      });

      // After seq 10, expected is 11, last is 10

      // Skip to sequence 15 (missing 11, 12, 13, 14)
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        seq: 15,
        x: 5,
        y: 5,
        username: 'bob'
      });

      expect(onResyncRequest).toHaveBeenCalledWith({
        type: 'resync_request',
        gameId: 'test-game',
        lastSeq: 10,
        expectedSeq: 11
      });
    });

    it('does not apply message when gap detected', () => {
      const onResyncRequest = vi.fn();
      state.onResyncRequest = onResyncRequest;

      // Initialize with sequence 10
      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 10,
        territories: [],
        players: []
      });

      // Skip to sequence 15
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        seq: 15,
        x: 5,
        y: 5,
        username: 'bob'
      });

      // Message should NOT have been applied
      expect(state.territories.has('5,5')).toBe(false);
    });

    it('processes messages without seq when expectedSeq is null', () => {
      // Before any state_snapshot, messages without seq should work
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        x: 5,
        y: 5,
        username: 'alice'
      });

      expect(state.territories.get('5,5').owner).toBe('alice');
    });

    it('state_snapshot resets expected sequence', () => {
      const onResyncRequest = vi.fn();
      state.onResyncRequest = onResyncRequest;

      // Initialize with sequence 10
      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 10,
        territories: [],
        players: []
      });

      // Receive new snapshot with different sequence (simulates resync)
      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 100,
        territories: [{ x: 1, y: 1, owner: 'charlie', strength: 3 }],
        players: []
      });

      // Should reset to new sequence (expect seq 101 next)
      expect(state._expectedSeq).toBe(101);
      expect(state._lastSeq).toBe(100);

      // No resync request should be triggered (snapshots reset, not gap)
      expect(onResyncRequest).not.toHaveBeenCalled();

      // Snapshot data should be applied
      expect(state.territories.get('1,1').owner).toBe('charlie');
    });
  });

  describe('Visual Dimming (ownerLastAnswer)', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('has correct visual dimming config values', () => {
      expect(GRID_WARS_CONFIG.dimmingMinOpacity).toBe(0.3);
      expect(GRID_WARS_CONFIG.dimmingFadeMinutes).toBe(15);
    });

    it('getRenderState includes ownerLastAnswer for territories', () => {
      const lastAnswerTime = new Date().toISOString();

      // Add player with last_answer_at
      state.players.set('bob', {
        action_points: 50,
        territories_count: 1,
        health: 100,
        last_answer_at: lastAnswerTime
      });

      // Add territory owned by bob
      state.territories.set('5,5', {
        owner: 'bob',
        strength: 3,
        node_type: null
      });

      const renderState = state.getRenderState();

      expect(renderState.territories).toHaveLength(1);
      expect(renderState.territories[0].ownerLastAnswer).toBe(lastAnswerTime);
    });

    it('getRenderState returns null ownerLastAnswer for unknown owners', () => {
      // Add territory with owner not in players map
      state.territories.set('5,5', {
        owner: 'unknown',
        strength: 3,
        node_type: null
      });

      const renderState = state.getRenderState();

      expect(renderState.territories[0].ownerLastAnswer).toBeNull();
    });

    it('getRenderState returns null ownerLastAnswer when owner has no last_answer_at', () => {
      // Add player without last_answer_at
      state.players.set('bob', {
        action_points: 50,
        territories_count: 1,
        health: 100
      });

      state.territories.set('5,5', {
        owner: 'bob',
        strength: 3,
        node_type: null
      });

      const renderState = state.getRenderState();

      expect(renderState.territories[0].ownerLastAnswer).toBeNull();
    });

    it('updates last_answer_at on points_earned message', () => {
      state.players.set('bob', {
        action_points: 10,
        territories_count: 0,
        health: 100
      });

      const beforeTime = new Date();

      state.handleWebSocketMessage({
        type: 'points_earned',
        gameId: 'test-game',
        username: 'bob',
        points: 4,
        total: 14,
        starType: 'gold'
      });

      const player = state.players.get('bob');
      expect(player.last_answer_at).toBeDefined();

      const answerTime = new Date(player.last_answer_at);
      expect(answerTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('preserves last_answer_at in state_snapshot', () => {
      const lastAnswerTime = '2025-01-08T12:00:00.000Z';

      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 1,
        territories: [],
        players: [
          {
            username: 'bob',
            action_points: 50,
            territories_count: 5,
            health: 100,
            last_answer_at: lastAnswerTime
          }
        ]
      });

      const player = state.players.get('bob');
      expect(player.last_answer_at).toBe(lastAnswerTime);
    });
  });

  describe('Config Centralization', () => {
    it('exports all v1.2.1 config values', () => {
      // Core costs
      expect(GRID_WARS_CONFIG.claimCost).toBeDefined();
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBeDefined();
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBeDefined();
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBeDefined();

      // Activity windows
      expect(GRID_WARS_CONFIG.activeWindowSeconds).toBeDefined();
      expect(GRID_WARS_CONFIG.warmWindowSeconds).toBeDefined();

      // Boot bonus
      expect(GRID_WARS_CONFIG.bootBonus).toBeDefined();

      // Visual dimming
      expect(GRID_WARS_CONFIG.dimmingMinOpacity).toBeDefined();
      expect(GRID_WARS_CONFIG.dimmingFadeMinutes).toBeDefined();

      // Other core values
      expect(GRID_WARS_CONFIG.nodeClaimCost).toBeDefined();
      expect(GRID_WARS_CONFIG.surgeCost).toBeDefined();
      expect(GRID_WARS_CONFIG.mapSize).toBeDefined();
      expect(GRID_WARS_CONFIG.maxCellStrength).toBeDefined();
      expect(GRID_WARS_CONFIG.classGoalTarget).toBeDefined();
      expect(GRID_WARS_CONFIG.classGoalBonus).toBeDefined();
      expect(GRID_WARS_CONFIG.maxContiguityBonus).toBeDefined();
      expect(GRID_WARS_CONFIG.starPoints).toBeDefined();
    });

    it('star points have correct values', () => {
      expect(GRID_WARS_CONFIG.starPoints.gold).toBe(4);
      expect(GRID_WARS_CONFIG.starPoints.silver).toBe(3);
      expect(GRID_WARS_CONFIG.starPoints.bronze).toBe(2);
      expect(GRID_WARS_CONFIG.starPoints.tin).toBe(1);
    });

    it('buff durations are configured', () => {
      expect(GRID_WARS_CONFIG.beaconDuration).toBe(300);  // 5 min
      expect(GRID_WARS_CONFIG.anchorDuration).toBe(180);  // 3 min
      expect(GRID_WARS_CONFIG.amplifierCharges).toBe(5);
      expect(GRID_WARS_CONFIG.amplifierBonus).toBe(3);
    });

    it('surge duration is configured', () => {
      expect(GRID_WARS_CONFIG.surgeDuration).toBe(90);  // 1.5 min
    });
  });

  describe('Callback Initialization', () => {
    it('initializes all v1.2.1 callbacks as null', () => {
      resetGridWarsState();
      const state = new GridWarsState();

      expect(state.onBootBonus).toBeNull();
      expect(state.onResyncRequest).toBeNull();
    });

    it('accepts callbacks in constructor options', () => {
      resetGridWarsState();
      const onBootBonus = vi.fn();
      const onResyncRequest = vi.fn();

      const state = new GridWarsState({
        onBootBonus,
        onResyncRequest
      });

      expect(state.onBootBonus).toBe(onBootBonus);
      expect(state.onResyncRequest).toBe(onResyncRequest);
    });
  });

  describe('Activity Tier Calculation (Client Display)', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 50, territories_count: 5, health: 100 });
    });

    it('getClaimCostAt returns base cost for enemy territory', () => {
      state.territories.set('5,5', { owner: 'bob' });
      state.players.set('bob', { action_points: 30, territories_count: 1, health: 100 });

      const costInfo = state.getClaimCostAt(5, 5);

      expect(costInfo.cost).toBe(GRID_WARS_CONFIG.takeoverCostBase); // 15
      expect(costInfo.activeCost).toBe(GRID_WARS_CONFIG.takeoverCostActive); // 25
      expect(costInfo.isEnemy).toBe(true);
      expect(costInfo.defender).toBe('bob');
    });

    it('getClaimCostAt includes WARM cost in config', () => {
      // The WARM cost (20) exists in config for server-side use
      // Client shows binary ACTIVE/COLD but server uses 3-tier
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBe(20);

      // Verify it's between COLD and ACTIVE
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBeGreaterThan(GRID_WARS_CONFIG.takeoverCostCold);
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBeLessThan(GRID_WARS_CONFIG.takeoverCostActive);
    });
  });
});
