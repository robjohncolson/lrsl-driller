/**
 * GameEngine Tests
 * Tests star calculation, streaks, and tier unlocking
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../../platform/core/game-engine.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn((key) => { delete store[key]; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('GameEngine', () => {
  let engine;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    engine = new GameEngine({
      onStreakUpdate: vi.fn(),
      onStarEarned: vi.fn(),
      onTierUnlocked: vi.fn()
    });
  });

  // ========== STAR TYPE CALCULATION ==========
  describe('Star Type Calculation (getStarType)', () => {
    it('returns gold for 0 hints and 0 retries', () => {
      expect(engine.getStarType(0)).toBe('gold');
    });

    it('returns silver for 1 penalty', () => {
      expect(engine.getStarType(1)).toBe('silver');
    });

    it('returns bronze for 2 penalties', () => {
      expect(engine.getStarType(2)).toBe('bronze');
    });

    it('returns tin for 3+ penalties', () => {
      expect(engine.getStarType(3)).toBe('tin');
      expect(engine.getStarType(5)).toBe('tin');
      expect(engine.getStarType(10)).toBe('tin');
    });

    it('combines hints and retries for total penalties', () => {
      engine.useHint('hint1');
      engine.useRetry();
      // 1 hint + 1 retry = 2 penalties = bronze
      expect(engine.getPotentialStar()).toBe('bronze');
    });
  });

  // ========== HINT TRACKING ==========
  describe('Hint Tracking', () => {
    it('tracks unique hints used', () => {
      engine.useHint('hint1');
      engine.useHint('hint2');
      engine.useHint('hint1'); // duplicate, shouldn't count

      expect(engine.hintsUsedThisProblem.size).toBe(2);
    });

    it('resets hints for new problem', () => {
      engine.useHint('hint1');
      engine.useHint('hint2');

      engine.resetHintsForNewProblem();

      expect(engine.hintsUsedThisProblem.size).toBe(0);
      expect(engine.retriesThisProblem).toBe(0);
    });
  });

  // ========== RETRY TRACKING ==========
  describe('Retry Tracking', () => {
    it('increments retry count', () => {
      engine.useRetry();
      engine.useRetry();

      expect(engine.retriesThisProblem).toBe(2);
    });

    it('affects potential star', () => {
      // No penalties = gold
      expect(engine.getPotentialStar()).toBe('gold');

      // 1 retry = silver
      engine.useRetry();
      expect(engine.getPotentialStar()).toBe('silver');

      // 2 retries = bronze
      engine.useRetry();
      expect(engine.getPotentialStar()).toBe('bronze');
    });
  });

  // ========== STAR AWARDING ==========
  describe('Star Awarding', () => {
    it('increments star counts', () => {
      engine.awardStar('gold');
      engine.awardStar('gold');
      engine.awardStar('silver');

      expect(engine.starCounts.gold).toBe(2);
      expect(engine.starCounts.silver).toBe(1);
      expect(engine.starCounts.bronze).toBe(0);
    });

    it('tracks stars per mode', () => {
      engine.awardStar('gold', 'mode1');
      engine.awardStar('silver', 'mode1');
      engine.awardStar('gold', 'mode2');

      expect(engine.starsPerMode.mode1.gold).toBe(1);
      expect(engine.starsPerMode.mode1.silver).toBe(1);
      expect(engine.starsPerMode.mode2.gold).toBe(1);
    });

    it('calls onStarEarned callback', () => {
      engine.awardStar('gold');

      expect(engine.onStarEarned).toHaveBeenCalledWith(
        'gold',
        expect.objectContaining({ gold: 1 }),
        null
      );
    });
  });

  // ========== STREAK TRACKING ==========
  describe('Streak Tracking', () => {
    it('initializes streaks object', () => {
      expect(engine.streaks).toBeDefined();
      expect(typeof engine.streaks).toBe('object');
    });

    it('tracks streaks via recordResult', () => {
      const result1 = engine.recordResult('slope', 'E', false);
      expect(result1.streak).toBe(1);

      const result2 = engine.recordResult('slope', 'E', false);
      expect(result2.streak).toBe(2);
    });

    it('resets streak on incorrect answer', () => {
      engine.recordResult('slope', 'E', false);
      engine.recordResult('slope', 'E', false);
      const result = engine.recordResult('slope', 'I', false);

      expect(result.streak).toBe(0);
    });

    it('maintains separate streaks per field', () => {
      engine.recordResult('slope', 'E', false);
      engine.recordResult('intercept', 'E', false);
      const result = engine.recordResult('slope', 'E', false);

      expect(result.streak).toBe(2);
      expect(engine.streaks.intercept).toBe(1);
    });
  });

  // ========== TOTAL PENALTIES ==========
  describe('Total Penalties', () => {
    it('calculates hints + retries', () => {
      expect(engine.getTotalPenalties()).toBe(0);

      engine.useHint('h1');
      expect(engine.getTotalPenalties()).toBe(1);

      engine.useRetry();
      expect(engine.getTotalPenalties()).toBe(2);

      engine.useHint('h2');
      expect(engine.getTotalPenalties()).toBe(3);
    });
  });

  // ========== TIER MANAGEMENT ==========
  describe('Tier Management', () => {
    it('sets current tier if unlocked', () => {
      // Load a cartridge first so tiers are unlocked
      const manifest = {
        meta: { id: 'test', name: 'Test' },
        modes: [{ id: 'mode2', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      engine.setTier('mode2');
      expect(engine.currentTier).toBe('mode2');
    });

    it('does not set tier if not unlocked', () => {
      const result = engine.setTier('locked-mode');
      expect(result).toBe(false);
    });

    it('loads cartridge and initializes mode order', () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [
          { id: 'l01', unlockedBy: 'default' },
          { id: 'l02', unlockedBy: { gold: 1 } },
          { id: 'l03', unlockedBy: { gold: 2 } }
        ]
      };

      engine.loadCartridge(manifest);

      expect(engine.modeOrder).toEqual(['l01', 'l02', 'l03']);
      expect(engine.unlockedTiers).toContain('l01');
    });
  });

  // ========== STATE PERSISTENCE ==========
  describe('State Persistence', () => {
    it('saves state to localStorage', () => {
      const manifest = {
        meta: { id: 'test', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);
      engine.awardStar('gold');

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('uses cartridge-prefixed keys', () => {
      const manifest = {
        meta: { id: 'my-cartridge', name: 'My Cartridge' },
        modes: []
      };
      engine.loadCartridge(manifest);
      engine.saveState();

      // Should be called with prefixed key
      const calls = localStorageMock.setItem.mock.calls;
      const hasPrefix = calls.some(call => call[0].includes('my-cartridge'));
      expect(hasPrefix).toBe(true);
    });
  });
});
