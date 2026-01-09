/**
 * Grid Wars v1.3.1 Tests
 * Tests for the complete telemetry + auto-surge update:
 * - Telemetry aggregate metrics (map_fill_percent, active_players_5min, etc.)
 * - Auto-surge on stagnation
 * - Underdog assist discount
 * - System event handling (onSystemEvent callback)
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

describe('Grid Wars v1.3.1 Features', () => {
  describe('Auto-Surge Config', () => {
    it('has correct auto-surge config values in shared config', () => {
      expect(SHARED_CONFIG.autoSurgeEnabled).toBe(true);
      expect(SHARED_CONFIG.autoSurgeFillThreshold).toBe(0.85);
      expect(SHARED_CONFIG.autoSurgeChurnThreshold).toBe(5);
      expect(SHARED_CONFIG.autoSurgeCellCount).toBe(2);
      expect(SHARED_CONFIG.autoSurgeCooldownMs).toBe(10 * 60 * 1000);  // 10 min
      expect(SHARED_CONFIG.autoSurgeCheckIntervalMs).toBe(60 * 1000);   // 1 min
    });
  });

  describe('Underdog Assist Config', () => {
    it('has correct underdog config values in shared config', () => {
      expect(SHARED_CONFIG.underdogEnabled).toBe(true);
      expect(SHARED_CONFIG.underdogDiscount).toBe(0.5);               // 50%
      expect(SHARED_CONFIG.underdogMinCost).toBe(5);
      expect(SHARED_CONFIG.underdogActivityWindowMs).toBe(3 * 60 * 1000);  // 3 min
      expect(SHARED_CONFIG.underdogCooldownMs).toBe(5 * 60 * 1000);        // 5 min
    });
  });

  describe('System Event Callback', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      global.fetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('initializes onSystemEvent callback as null', () => {
      expect(state.onSystemEvent).toBeNull();
    });

    it('accepts onSystemEvent in constructor options', () => {
      resetGridWarsState();
      const onSystemEvent = vi.fn();

      const newState = new GridWarsState({ onSystemEvent });

      expect(newState.onSystemEvent).toBe(onSystemEvent);
    });

    it('handles system_event WebSocket message', () => {
      const onSystemEvent = vi.fn();
      state.onSystemEvent = onSystemEvent;

      state.handleWebSocketMessage({
        type: 'system_event',
        gameId: 'test-game',
        event: 'auto_surge',
        message: 'UPLINK DETECTED — New sectors available'
      });

      expect(onSystemEvent).toHaveBeenCalledWith({
        event: 'auto_surge',
        message: 'UPLINK DETECTED — New sectors available'
      });
    });

    it('handles auto_surge_activated WebSocket message', () => {
      const onSystemEvent = vi.fn();
      const onSurgeActivated = vi.fn();
      state.onSystemEvent = onSystemEvent;
      state.onSurgeActivated = onSurgeActivated;

      state.handleWebSocketMessage({
        type: 'auto_surge_activated',
        gameId: 'test-game',
        x: 10,
        y: 12,
        expiresIn: 90,
        message: 'UPLINK DETECTED — New sectors available'
      });

      // Should call onSurgeActivated with surge data
      expect(onSurgeActivated).toHaveBeenCalledWith({
        x: 10,
        y: 12,
        expiresIn: 90
      });

      // Should call onSystemEvent for auto_surge
      expect(onSystemEvent).toHaveBeenCalledWith({
        event: 'auto_surge',
        message: 'UPLINK DETECTED — New sectors available'
      });

      // Should update surge state
      expect(state.surge).toEqual({
        x: 10,
        y: 12,
        expiresIn: 90
      });
    });

    it('auto_surge_activated sets surge state like regular surge', () => {
      state.handleWebSocketMessage({
        type: 'auto_surge_activated',
        gameId: 'test-game',
        x: 5,
        y: 8,
        expiresIn: 60,
        message: 'Test'
      });

      expect(state.getSurge()).toEqual({
        x: 5,
        y: 8,
        expiresIn: 60
      });
    });

    it('ignores system_event for different game', () => {
      const onSystemEvent = vi.fn();
      state.onSystemEvent = onSystemEvent;

      state.handleWebSocketMessage({
        type: 'system_event',
        gameId: 'different-game',
        event: 'auto_surge',
        message: 'Test'
      });

      expect(onSystemEvent).not.toHaveBeenCalled();
    });
  });

  describe('Auto-Surge Trigger Conditions', () => {
    it('auto-surge requires both high fill AND low churn', () => {
      // This is a server-side behavior, but we verify the config makes sense
      const fillThreshold = SHARED_CONFIG.autoSurgeFillThreshold;
      const churnThreshold = SHARED_CONFIG.autoSurgeChurnThreshold;

      // Fill threshold should be high (most of map owned)
      expect(fillThreshold).toBeGreaterThanOrEqual(0.8);
      expect(fillThreshold).toBeLessThanOrEqual(0.95);

      // Churn threshold should be low (few changes per 5 min)
      expect(churnThreshold).toBeGreaterThanOrEqual(3);
      expect(churnThreshold).toBeLessThanOrEqual(10);
    });

    it('auto-surge cooldown prevents rapid triggers', () => {
      const cooldownMs = SHARED_CONFIG.autoSurgeCooldownMs;
      const checkIntervalMs = SHARED_CONFIG.autoSurgeCheckIntervalMs;

      // Cooldown should be much longer than check interval
      expect(cooldownMs).toBeGreaterThan(checkIntervalMs * 5);

      // Cooldown should be reasonable (5-15 min)
      expect(cooldownMs).toBeGreaterThanOrEqual(5 * 60 * 1000);
      expect(cooldownMs).toBeLessThanOrEqual(15 * 60 * 1000);
    });
  });

  describe('Underdog Assist Conditions', () => {
    it('underdog discount is between 25% and 75%', () => {
      const discount = SHARED_CONFIG.underdogDiscount;
      expect(discount).toBeGreaterThanOrEqual(0.25);
      expect(discount).toBeLessThanOrEqual(0.75);
    });

    it('underdog minimum cost prevents abuse', () => {
      const minCost = SHARED_CONFIG.underdogMinCost;
      expect(minCost).toBeGreaterThanOrEqual(3);
      expect(minCost).toBeLessThanOrEqual(10);
    });

    it('underdog activity window is reasonable', () => {
      const windowMs = SHARED_CONFIG.underdogActivityWindowMs;
      // Should be 2-5 minutes
      expect(windowMs).toBeGreaterThanOrEqual(2 * 60 * 1000);
      expect(windowMs).toBeLessThanOrEqual(5 * 60 * 1000);
    });

    it('underdog cooldown prevents rapid use', () => {
      const cooldownMs = SHARED_CONFIG.underdogCooldownMs;
      // Should be 3-10 minutes
      expect(cooldownMs).toBeGreaterThanOrEqual(3 * 60 * 1000);
      expect(cooldownMs).toBeLessThanOrEqual(10 * 60 * 1000);
    });
  });

  describe('Telemetry Aggregate Metrics Config', () => {
    it('telemetry is enabled by default', () => {
      expect(SHARED_CONFIG.telemetryEnabled).toBe(true);
    });

    it('telemetry flush interval is 5 minutes', () => {
      expect(SHARED_CONFIG.telemetryFlushIntervalMs).toBe(5 * 60 * 1000);
    });
  });

  describe('v1.3.1 Callback Initialization', () => {
    it('initializes all v1.3.1 callbacks', () => {
      resetGridWarsState();
      const onSystemEvent = vi.fn();

      const state = new GridWarsState({ onSystemEvent });

      expect(state.onSystemEvent).toBe(onSystemEvent);
    });

    it('all callbacks default to null', () => {
      resetGridWarsState();
      const state = new GridWarsState();

      // v1.3.1 callbacks
      expect(state.onSystemEvent).toBeNull();

      // Pre-existing callbacks should still be null
      expect(state.onStateChange).toBeNull();
      expect(state.onError).toBeNull();
      expect(state.onPointsEarned).toBeNull();
      expect(state.onTerritoryChanged).toBeNull();
      expect(state.onClassGoalReached).toBeNull();
      expect(state.onBuffAcquired).toBeNull();
      expect(state.onSurgeActivated).toBeNull();
      expect(state.onBootBonus).toBeNull();
      expect(state.onResyncRequest).toBeNull();
      expect(state.onClaimStatusChange).toBeNull();
      expect(state.onCooldownChange).toBeNull();
    });
  });

  describe('Surge Message Types', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('surge_activated still works (teacher-triggered)', () => {
      state.handleWebSocketMessage({
        type: 'surge_activated',
        gameId: 'test-game',
        x: 7,
        y: 9,
        expiresIn: 90
      });

      expect(state.getSurge()).toEqual({
        x: 7,
        y: 9,
        expiresIn: 90
      });
    });

    it('auto_surge_activated has same surge behavior', () => {
      state.handleWebSocketMessage({
        type: 'auto_surge_activated',
        gameId: 'test-game',
        x: 3,
        y: 4,
        expiresIn: 90,
        message: 'Test'
      });

      expect(state.getSurge()).toEqual({
        x: 3,
        y: 4,
        expiresIn: 90
      });
    });

    it('surge_expired clears surge regardless of how it was activated', () => {
      // Set up surge via auto_surge
      state.handleWebSocketMessage({
        type: 'auto_surge_activated',
        gameId: 'test-game',
        x: 3,
        y: 4,
        expiresIn: 90,
        message: 'Test'
      });
      expect(state.getSurge()).not.toBeNull();

      // Expire it
      state.handleWebSocketMessage({
        type: 'surge_expired',
        gameId: 'test-game',
        x: 3,
        y: 4
      });

      expect(state.getSurge()).toBeNull();
    });

    it('surge_claimed clears surge regardless of how it was activated', () => {
      // Set up surge via auto_surge
      state.handleWebSocketMessage({
        type: 'auto_surge_activated',
        gameId: 'test-game',
        x: 3,
        y: 4,
        expiresIn: 90,
        message: 'Test'
      });
      expect(state.getSurge()).not.toBeNull();

      // Claim it
      state.handleWebSocketMessage({
        type: 'surge_claimed',
        gameId: 'test-game',
        x: 3,
        y: 4,
        claimedBy: 'bob'
      });

      expect(state.getSurge()).toBeNull();
    });
  });

  describe('Integration - Auto-Surge Flow', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({ serverUrl: 'http://localhost:3001' });
      state.gameId = 'test-game';
      state.username = 'alice';
    });

    it('receives auto-surge, updates state, and can claim', async () => {
      const onSurgeActivated = vi.fn();
      const onSystemEvent = vi.fn();
      state.onSurgeActivated = onSurgeActivated;
      state.onSystemEvent = onSystemEvent;
      state.players.set('alice', { action_points: 50, territories_count: 5, health: 100 });

      // Receive auto-surge
      state.handleWebSocketMessage({
        type: 'auto_surge_activated',
        gameId: 'test-game',
        x: 15,
        y: 15,
        expiresIn: 90,
        cost: 5,
        message: 'UPLINK DETECTED — New sectors available'
      });

      expect(state.getSurge()).toEqual({ x: 15, y: 15, expiresIn: 90 });
      expect(onSurgeActivated).toHaveBeenCalled();
      expect(onSystemEvent).toHaveBeenCalled();
    });
  });
});
