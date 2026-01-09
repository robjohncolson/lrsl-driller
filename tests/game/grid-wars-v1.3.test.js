/**
 * Grid Wars v1.3 Tests
 * Tests for the economic sustainability and network hardening update:
 * - Tier semantics: Updated activity windows (3min/8min)
 * - Spam prevention: Wrong answer tracking, cooldown system
 * - Soft point ceiling: Logarithmic cost scaling
 * - AFK erosion: Edge cell erosion for inactive players
 * - Action ID reconciliation: UUID per claim, resync mode
 * - Telemetry: Config values and counters
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG, resetGridWarsState } from '../../platform/game/grid-state.js';
import { GRID_WARS_CONFIG as SHARED_CONFIG } from '../../shared/gridwars.config.js';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock crypto.randomUUID for testing
const mockUUID = 'test-uuid-1234-5678-9abc';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID)
});

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

describe('Grid Wars v1.3 Features', () => {
  describe('Tier Semantics - Activity Windows', () => {
    it('has correct activity window config values', () => {
      // v1.3: 3 minutes ACTIVE, 8 minutes WARM
      expect(GRID_WARS_CONFIG.activeWindowSeconds).toBe(180);  // 3 minutes
      expect(GRID_WARS_CONFIG.warmWindowSeconds).toBe(480);    // 8 minutes
    });

    it('has correct 3-tier cost values', () => {
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBe(15);   // >8min inactive
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBe(20);   // 3-8min inactive
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(25); // <3min inactive
    });

    it('WARM cost is between COLD and ACTIVE', () => {
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBeGreaterThan(GRID_WARS_CONFIG.takeoverCostCold);
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBeLessThan(GRID_WARS_CONFIG.takeoverCostActive);
    });

    it('maintains legacy aliases for backwards compatibility', () => {
      expect(GRID_WARS_CONFIG.takeoverCostBase).toBe(15);
      expect(GRID_WARS_CONFIG.activeDrillingWindow).toBe(120);
    });
  });

  describe('Spam Prevention - Config', () => {
    it('has correct spam prevention config values', () => {
      expect(GRID_WARS_CONFIG.spamWindowSeconds).toBe(60);    // 1 minute window
      expect(GRID_WARS_CONFIG.spamThreshold).toBe(3);         // 3 wrong answers
      expect(GRID_WARS_CONFIG.spamCooldownSeconds).toBe(30);  // 30 second cooldown
    });
  });

  describe('Spam Prevention - Cooldown Tracking', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('initializes with no cooldown', () => {
      expect(state.isInCooldown()).toBeFalsy(); // Returns null when _cooldownUntil is null
      expect(state.getCooldownRemaining()).toBe(0);
    });

    it('has onCooldownChange callback slot', () => {
      expect(state.onCooldownChange).toBeNull();

      const callback = vi.fn();
      state.onCooldownChange = callback;
      expect(state.onCooldownChange).toBe(callback);
    });

    it('isInCooldown returns true when cooldown is active', () => {
      state._cooldownUntil = Date.now() + 10000; // 10 seconds from now
      expect(state.isInCooldown()).toBe(true);
    });

    it('isInCooldown returns false when cooldown has expired', () => {
      state._cooldownUntil = Date.now() - 1000; // 1 second ago
      expect(state.isInCooldown()).toBe(false);
    });

    it('getCooldownRemaining returns correct seconds', () => {
      state._cooldownUntil = Date.now() + 15500; // 15.5 seconds from now
      const remaining = state.getCooldownRemaining();
      expect(remaining).toBeGreaterThanOrEqual(15);
      expect(remaining).toBeLessThanOrEqual(16);
    });

    it('getCooldownRemaining returns 0 when no cooldown', () => {
      state._cooldownUntil = null;
      expect(state.getCooldownRemaining()).toBe(0);
    });

    it('getCooldownRemaining returns 0 when cooldown expired', () => {
      state._cooldownUntil = Date.now() - 1000;
      expect(state.getCooldownRemaining()).toBe(0);
    });
  });

  describe('Spam Prevention - reportWrongAnswer', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('calls API endpoint with correct payload', async () => {
      global.fetch.mockResolvedValueOnce(mockResponse({
        inCooldown: false,
        cooldownRemaining: 0
      }));

      await state.reportWrongAnswer();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/grid-wars/wrong-answer',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 'test-game',
            username: 'alice'
          })
        })
      );
    });

    it('sets cooldown when server returns inCooldown: true', async () => {
      global.fetch.mockResolvedValueOnce(mockResponse({
        inCooldown: true,
        cooldownRemaining: 30,
        message: 'SYSTEM RECALIBRATING'
      }));

      const result = await state.reportWrongAnswer();

      expect(result.inCooldown).toBe(true);
      expect(state.isInCooldown()).toBe(true);
      expect(state.getCooldownRemaining()).toBeGreaterThanOrEqual(29);
    });

    it('calls onCooldownChange callback when entering cooldown', async () => {
      const onCooldownChange = vi.fn();
      state.onCooldownChange = onCooldownChange;

      global.fetch.mockResolvedValueOnce(mockResponse({
        inCooldown: true,
        cooldownRemaining: 30,
        message: 'SYSTEM RECALIBRATING'
      }));

      await state.reportWrongAnswer();

      expect(onCooldownChange).toHaveBeenCalledWith({
        inCooldown: true,
        remaining: 30,
        message: 'SYSTEM RECALIBRATING'
      });
    });

    it('returns safe default on API error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await state.reportWrongAnswer();

      expect(result.inCooldown).toBe(false);
      expect(result.cooldownRemaining).toBe(0);
    });

    it('returns safe default when not initialized', async () => {
      state.gameId = null;
      state.username = null;

      const result = await state.reportWrongAnswer();

      expect(result.inCooldown).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Spam Prevention - checkCooldownStatus', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('syncs cooldown state from server', async () => {
      global.fetch.mockResolvedValueOnce(mockResponse({
        inCooldown: true,
        cooldownRemaining: 20
      }));

      await state.checkCooldownStatus();

      expect(state.isInCooldown()).toBe(true);
      expect(state.getCooldownRemaining()).toBeGreaterThanOrEqual(19);
    });

    it('clears cooldown when server says not in cooldown', async () => {
      state._cooldownUntil = Date.now() + 10000; // Set active cooldown

      global.fetch.mockResolvedValueOnce(mockResponse({
        inCooldown: false
      }));

      await state.checkCooldownStatus();

      expect(state._cooldownUntil).toBeNull();
      expect(state.isInCooldown()).toBeFalsy();
    });
  });

  describe('Soft Point Ceiling - Config', () => {
    it('has correct point ceiling config values', () => {
      expect(GRID_WARS_CONFIG.pointCeilingEnabled).toBe(true);
      expect(GRID_WARS_CONFIG.pointCeilingScaleFactor).toBe(0.1);
      expect(GRID_WARS_CONFIG.pointCeilingMinPoints).toBe(10);
    });
  });

  describe('Soft Point Ceiling - Cost Scaling', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('calculates scaled cost at 10 points (scale = 1.1)', () => {
      state.players.set('alice', { action_points: 10, territories_count: 0, health: 100 });

      // scale = 1 + 0.1 * log10(10) = 1 + 0.1 * 1 = 1.1
      // cost = ceil(10 * 1.1) = 11
      const scaledCost = state._calculateScaledCost(10);
      expect(scaledCost).toBe(11);
    });

    it('calculates scaled cost at 100 points (scale = 1.2)', () => {
      state.players.set('alice', { action_points: 100, territories_count: 0, health: 100 });

      // scale = 1 + 0.1 * log10(100) = 1 + 0.1 * 2 = 1.2
      // cost = ceil(10 * 1.2) = 12
      const scaledCost = state._calculateScaledCost(10);
      expect(scaledCost).toBe(12);
    });

    it('calculates scaled cost at 1000 points (scale = 1.3)', () => {
      state.players.set('alice', { action_points: 1000, territories_count: 0, health: 100 });

      // scale = 1 + 0.1 * log10(1000) = 1 + 0.1 * 3 = 1.3
      // cost = ceil(10 * 1.3) = 13
      const scaledCost = state._calculateScaledCost(10);
      expect(scaledCost).toBe(13);
    });

    it('uses minimum points (10) for scaling when points are below threshold', () => {
      state.players.set('alice', { action_points: 5, territories_count: 0, health: 100 });

      // At 5 points, should use minPoints (10) for calculation
      // scale = 1 + 0.1 * log10(10) = 1.1
      const scaledCost = state._calculateScaledCost(10);
      expect(scaledCost).toBe(11);
    });

    it('returns base cost when point ceiling disabled', () => {
      const originalEnabled = GRID_WARS_CONFIG.pointCeilingEnabled;
      GRID_WARS_CONFIG.pointCeilingEnabled = false;

      state.players.set('alice', { action_points: 1000, territories_count: 0, health: 100 });
      const scaledCost = state._calculateScaledCost(10);

      expect(scaledCost).toBe(10);

      GRID_WARS_CONFIG.pointCeilingEnabled = originalEnabled;
    });

    it('getClaimCostAt returns scaled cost for neutral territory', () => {
      state.players.set('alice', { action_points: 100, territories_count: 0, health: 100 });

      const costInfo = state.getClaimCostAt(5, 5);

      expect(costInfo.baseCost).toBe(GRID_WARS_CONFIG.claimCost); // 10
      expect(costInfo.cost).toBe(12); // ceil(10 * 1.2)
      expect(costInfo.isEnemy).toBe(false);
    });

    it('getClaimCostAt returns scaled costs for enemy territory', () => {
      state.players.set('alice', { action_points: 100, territories_count: 5, health: 100 });
      state.players.set('bob', { action_points: 30, territories_count: 1, health: 100 });
      state.territories.set('5,5', { owner: 'bob', strength: 3 });

      const costInfo = state.getClaimCostAt(5, 5);

      expect(costInfo.baseCost).toBe(15);          // takeoverCostBase
      expect(costInfo.cost).toBe(18);              // ceil(15 * 1.2)
      expect(costInfo.activeCostBase).toBe(25);   // takeoverCostActive
      expect(costInfo.activeCost).toBe(30);       // ceil(25 * 1.2)
      expect(costInfo.isEnemy).toBe(true);
    });

    it('canAffordClaimAt uses scaled cost', () => {
      // At 12 points, scale = 1.1 (log10(12) ≈ 1.08, scale ≈ 1.108)
      // scaled cost = ceil(10 * 1.108) = 12
      // With exactly 12 points, should afford 12 cost
      state.players.set('alice', { action_points: 12, territories_count: 0, health: 100 });
      expect(state.canAffordClaimAt(5, 5)).toBe(true);

      // At 11 points, scale ≈ 1.104, cost = ceil(10 * 1.104) = 12
      // Cannot afford with only 11 points
      state.players.set('alice', { action_points: 11, territories_count: 0, health: 100 });
      expect(state.canAffordClaimAt(5, 5)).toBe(false);
    });
  });

  describe('AFK Erosion - Config', () => {
    it('has correct AFK erosion config values', () => {
      expect(GRID_WARS_CONFIG.afkThresholdSeconds).toBe(900);       // 15 minutes
      expect(GRID_WARS_CONFIG.afkErosionIntervalMs).toBe(60000);   // 1 minute tick
      expect(GRID_WARS_CONFIG.afkErosionStrength).toBe(1);         // 1 strength per tick
    });
  });

  describe('AFK Erosion - WebSocket Handling', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 50, territories_count: 3, health: 100 });
    });

    it('handles afk_erosion message - strength reduction', () => {
      state.territories.set('5,5', { owner: 'alice', strength: 3, node_type: null });

      state.handleWebSocketMessage({
        type: 'afk_erosion',
        gameId: 'test-game',
        x: 5,
        y: 5,
        owner: 'alice',
        strength: 2,
        died: false,
        message: 'SIGNAL DECAY: Sector weakening (inactive)'
      });

      const territory = state.territories.get('5,5');
      expect(territory.strength).toBe(2);
    });

    it('handles afk_erosion message - cell death', () => {
      state.territories.set('5,5', { owner: 'alice', strength: 1, node_type: null });

      state.handleWebSocketMessage({
        type: 'afk_erosion',
        gameId: 'test-game',
        x: 5,
        y: 5,
        previousOwner: 'alice',
        strength: 0,
        died: true,
        message: 'SIGNAL DECAY: Sector lost (inactive)'
      });

      expect(state.territories.has('5,5')).toBe(false);
      expect(state.players.get('alice').territories_count).toBe(2); // Decremented
    });

    it('calls onTerritoryChanged callback for AFK erosion', () => {
      const onTerritoryChanged = vi.fn();
      state.onTerritoryChanged = onTerritoryChanged;
      state.territories.set('5,5', { owner: 'alice', strength: 1, node_type: null });

      state.handleWebSocketMessage({
        type: 'afk_erosion',
        gameId: 'test-game',
        x: 5,
        y: 5,
        previousOwner: 'alice',
        strength: 0,
        died: true,
        message: 'SIGNAL DECAY: Sector lost (inactive)'
      });

      expect(onTerritoryChanged).toHaveBeenCalledWith({
        x: 5,
        y: 5,
        owner: null,
        action: 'afk_erosion',
        message: 'SIGNAL DECAY: Sector lost (inactive)'
      });
    });

    it('ignores afk_erosion for different game', () => {
      state.territories.set('5,5', { owner: 'alice', strength: 3, node_type: null });

      state.handleWebSocketMessage({
        type: 'afk_erosion',
        gameId: 'different-game',
        x: 5,
        y: 5,
        owner: 'alice',
        strength: 2,
        died: false
      });

      expect(state.territories.get('5,5').strength).toBe(3); // Unchanged
    });
  });

  describe('Action ID Reconciliation - UUID Generation', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      crypto.randomUUID.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 50, territories_count: 0, health: 100 });
    });

    it('generates UUID for each claim request', async () => {
      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: mockUUID
      }));

      await state.claimTerritory(5, 5);

      expect(crypto.randomUUID).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(mockUUID)
        })
      );
    });

    it('includes actionId in request body', async () => {
      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: mockUUID
      }));

      await state.claimTerritory(5, 5);

      const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(requestBody.actionId).toBe(mockUUID);
    });
  });

  describe('Action ID Reconciliation - Resync Mode', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 50, territories_count: 0, health: 100 });
    });

    it('initializes with resync mode off', () => {
      expect(state._resyncInProgress).toBe(false);
      expect(state._pendingActionsQueue).toEqual([]);
    });

    it('enters resync mode when sequence gap detected', () => {
      // Initialize with sequence 10
      state.handleWebSocketMessage({
        type: 'state_snapshot',
        gameId: 'test-game',
        seq: 10,
        territories: [],
        players: []
      });

      // Skip to sequence 15 (gap detected)
      state.handleWebSocketMessage({
        type: 'territory_claimed',
        gameId: 'test-game',
        seq: 15,
        x: 5,
        y: 5,
        username: 'bob'
      });

      expect(state._resyncInProgress).toBe(true);
    });

    it('queues claims during resync mode', async () => {
      state._resyncInProgress = true;

      const result = await state.claimTerritory(5, 5);

      expect(result.queued).toBe(true);
      expect(state._pendingActionsQueue).toHaveLength(1);
      expect(state._pendingActionsQueue[0]).toEqual({ type: 'claim', x: 5, y: 5 });
      expect(global.fetch).not.toHaveBeenCalled(); // No API call during resync
    });

    it('exits resync mode and replays queued actions', async () => {
      state._resyncInProgress = true;
      state._pendingActionsQueue = [
        { type: 'claim', x: 5, y: 5 },
        { type: 'claim', x: 6, y: 6 }
      ];

      global.fetch.mockResolvedValue(mockResponse({ success: true }));

      await state._exitResyncMode();

      expect(state._resyncInProgress).toBe(false);
      expect(state._pendingActionsQueue).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Both queued claims replayed
    });

    it('completeResync exits resync mode', async () => {
      state._resyncInProgress = true;
      state._pendingActionsQueue = [];

      await state.completeResync();

      expect(state._resyncInProgress).toBe(false);
    });

    it('completeResync does nothing when not in resync mode', async () => {
      state._resyncInProgress = false;

      await state.completeResync();

      expect(state._resyncInProgress).toBe(false);
    });
  });

  describe('Action ID Reconciliation - Authoritative Cell', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
      state.players.set('alice', { action_points: 50, territories_count: 0, health: 100 });
    });

    it('applies authoritative cell from server response', async () => {
      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: mockUUID,
        authoritativeCell: {
          x: 5,
          y: 5,
          owner: 'alice',
          strength: 3,
          claimed_at: '2025-01-09T12:00:00Z',
          node_type: null
        }
      }));

      await state.claimTerritory(5, 5);

      const territory = state.territories.get('5,5');
      expect(territory.owner).toBe('alice');
      expect(territory.strength).toBe(3);
    });

    it('_applyAuthoritativeCell updates territory state', () => {
      state.territories.set('5,5', { owner: 'alice', strength: 2, node_type: null });

      state._applyAuthoritativeCell({
        x: 5,
        y: 5,
        owner: 'alice',
        strength: 3,
        claimed_at: '2025-01-09T12:00:00Z'
      });

      expect(state.territories.get('5,5').strength).toBe(3);
    });

    it('_applyAuthoritativeCell handles null/undefined gracefully', () => {
      state._applyAuthoritativeCell(null);
      state._applyAuthoritativeCell(undefined);
      state._applyAuthoritativeCell({});

      // Should not throw or modify state
      expect(state.territories.size).toBe(0);
    });
  });

  describe('Telemetry - Config (Shared)', () => {
    it('has correct telemetry config values in shared config', () => {
      // Telemetry config is server-only, defined in shared/gridwars.config.js
      expect(SHARED_CONFIG.telemetryEnabled).toBe(true);
      expect(SHARED_CONFIG.telemetryFlushIntervalMs).toBe(300000); // 5 minutes
    });
  });

  describe('v1.3 Callback Initialization', () => {
    it('initializes all v1.3 callbacks as null', () => {
      resetGridWarsState();
      const state = new GridWarsState();

      expect(state.onCooldownChange).toBeNull();
    });

    it('accepts onCooldownChange in constructor options', () => {
      resetGridWarsState();
      const onCooldownChange = vi.fn();

      const state = new GridWarsState({ onCooldownChange });

      expect(state.onCooldownChange).toBe(onCooldownChange);
    });
  });

  describe('v1.3 Integration - Full Claim Flow with Scaling', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('claim flow uses scaled cost for deduction', async () => {
      // At 100 points, scale = 1.2, neutral claim cost = ceil(10 * 1.2) = 12
      state.players.set('alice', { action_points: 100, territories_count: 0, health: 100 });

      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: mockUUID,
        authoritativeCell: { x: 5, y: 5, owner: 'alice', strength: 3 }
      }));

      await state.claimTerritory(5, 5);

      // Optimistic deduction should use scaled cost (12)
      expect(state.getActionPoints()).toBe(88); // 100 - 12
    });

    it('claim flow includes action ID for reconciliation', async () => {
      state.players.set('alice', { action_points: 50, territories_count: 0, health: 100 });

      global.fetch.mockResolvedValueOnce(mockResponse({
        success: true,
        actionId: mockUUID
      }));

      await state.claimTerritory(5, 5);

      const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(requestBody.actionId).toBeDefined();
      expect(requestBody.action).toBe('claim');
      expect(requestBody.x).toBe(5);
      expect(requestBody.y).toBe(5);
    });
  });
});
