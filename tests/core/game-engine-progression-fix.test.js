/**
 * GameEngine Progression Fix Tests
 * Tests for the fix-progression-regression spec:
 *   1. Non-capstone modes unlock immediately (no sequential gating)
 *   2. Capstone modes (gold >= 3) remain locked until earned
 *   3. setOverrides() preserves currentTier
 *   4. restoreFromServer() preserves currentTier
 *   5. updateOverride() preserves currentTier
 *   6. Capstone relocking falls back to highest unlocked non-capstone
 *
 * Run with: npm test -- tests/core/game-engine-progression-fix.test.js
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

// Mock fetch for restoreFromServer tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Manifest modeled after AP Stats Unit 5:
 *   - 10 non-capstone modes with gold:1 unlock requirements
 *   - 2 capstone modes with gold:3 unlock requirements
 * This mirrors the real cartridge structure referenced in the spec.
 */
const apStatsManifest = {
  meta: { id: 'ap-stats-unit5', name: 'AP Stats Unit 5' },
  modes: [
    { id: 'l01-sampling-variability',    unlockedBy: 'default' },
    { id: 'l02-sampling-dist-concept',   unlockedBy: { gold: 1 } },
    { id: 'l03-sample-size-effect',      unlockedBy: { gold: 1 } },
    { id: 'l04-pop-vs-sampling-dist',    unlockedBy: { gold: 1 } },
    { id: 'l05-mean-sd-sampling',        unlockedBy: { gold: 1 } },
    { id: 'l06-normal-approx',           unlockedBy: { gold: 1 } },
    { id: 'l07-assess-normality',        unlockedBy: { gold: 1 } },
    { id: 'l08-sampling-proportions',    unlockedBy: { gold: 1 } },
    { id: 'l09-inference-preview',       unlockedBy: { gold: 1 } },
    { id: 'l10-capstone',               unlockedBy: { gold: 3 } },  // capstone
    { id: 'l11-clt-randomization',       unlockedBy: { gold: 1 } },
    { id: 'l12-capstone-53',            unlockedBy: { gold: 3 } },  // capstone
  ],
  progression: { streakFields: ['answer'] }
};

describe('GameEngine Progression Fix (fix-progression-regression)', () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== TEST 1: All non-capstone modes unlock immediately ==========
  describe('All non-capstone modes unlock immediately', () => {
    it('unlocks every non-capstone mode without earning any stars', () => {
      engine.loadCartridge(apStatsManifest);

      const state = engine.getState();
      const nonCapstoneIds = [
        'l01-sampling-variability',
        'l02-sampling-dist-concept',
        'l03-sample-size-effect',
        'l04-pop-vs-sampling-dist',
        'l05-mean-sd-sampling',
        'l06-normal-approx',
        'l07-assess-normality',
        'l08-sampling-proportions',
        'l09-inference-preview',
        'l11-clt-randomization',
      ];

      for (const modeId of nonCapstoneIds) {
        expect(
          state.unlockedTiers,
          `Expected "${modeId}" to be in unlockedTiers`
        ).toContain(modeId);
      }
    });
  });

  // ========== TEST 2: Capstone modes stay locked ==========
  describe('Capstone modes stay locked', () => {
    it('does NOT unlock capstone modes (gold >= 3) without earned stars', () => {
      engine.loadCartridge(apStatsManifest);

      const state = engine.getState();
      const capstoneIds = ['l10-capstone', 'l12-capstone-53'];

      for (const modeId of capstoneIds) {
        expect(
          state.unlockedTiers,
          `Expected "${modeId}" to NOT be in unlockedTiers`
        ).not.toContain(modeId);
      }
    });

    it('unlocks capstone after previous level earns required gold stars', () => {
      engine.loadCartridge(apStatsManifest);

      // Award 3 gold to the mode immediately before l10-capstone (l09-inference-preview)
      engine.starsPerMode['l09-inference-preview'] = { gold: 3, silver: 0, bronze: 0, tin: 0 };

      // Re-check unlocks
      engine.unlockedTiers = [];
      engine.checkUnlocks(engine.unlockRules);

      expect(engine.unlockedTiers).toContain('l10-capstone');
    });
  });

  // ========== TEST 3: setOverrides() preserves currentTier ==========
  describe('setOverrides() preserves currentTier', () => {
    it('keeps currentTier on the same mode after setOverrides({})', () => {
      engine.loadCartridge(apStatsManifest);

      // Student navigates to mode 7
      const targetMode = 'l07-assess-normality';
      engine.currentTier = targetMode;

      // Teacher applies overrides (e.g., changes gold req on some level)
      engine.setOverrides({});

      expect(engine.currentTier).toBe(targetMode);
    });

    it('keeps currentTier when overrides change other modes', () => {
      engine.loadCartridge(apStatsManifest);

      const targetMode = 'l07-assess-normality';
      engine.currentTier = targetMode;

      // Teacher sets overrides for a different mode
      engine.setOverrides({ 'l03-sample-size-effect': 2 });

      expect(engine.currentTier).toBe(targetMode);
    });
  });

  // ========== TEST 4: restoreFromServer() preserves currentTier ==========
  describe('restoreFromServer() preserves currentTier', () => {
    it('keeps currentTier on the same mode after server restore', async () => {
      engine.loadCartridge(apStatsManifest);

      // Student is on mode 7
      const targetMode = 'l07-assess-normality';
      engine.currentTier = targetMode;

      // Set old local timestamp so server data is "newer"
      engine.stateUpdatedAt = '2024-01-01T10:00:00Z';
      engine.saveState();

      // Server returns progress data
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          data: {
            gold_stars: 5,
            silver_stars: 2,
            bronze_stars: 1,
            tin_stars: 0,
            mode_progress: {
              'l01-sampling-variability': { gold: 2, silver: 1, bronze: 0, tin: 0 },
              'l02-sampling-dist-concept': { gold: 1, silver: 0, bronze: 0, tin: 0 },
              'l07-assess-normality': { gold: 2, silver: 1, bronze: 1, tin: 0 }
            },
            updated_at: futureDate
          }
        })
      });

      await engine.restoreFromServer('http://localhost', 'testuser');

      // Student should still be on mode 7, not reset to mode 1
      expect(engine.currentTier).toBe(targetMode);
    });
  });

  // ========== TEST 5: updateOverride() preserves currentTier ==========
  describe('updateOverride() preserves currentTier', () => {
    it('keeps currentTier unchanged when overriding a different mode', () => {
      engine.loadCartridge(apStatsManifest);

      // Student is on mode 7
      const targetMode = 'l07-assess-normality';
      engine.currentTier = targetMode;

      // Teacher adjusts gold requirement for a different mode
      engine.updateOverride('l03-sample-size-effect', 2);

      expect(engine.currentTier).toBe(targetMode);
    });

    it('keeps currentTier unchanged when overriding the same mode', () => {
      engine.loadCartridge(apStatsManifest);

      const targetMode = 'l07-assess-normality';
      engine.currentTier = targetMode;

      // Teacher adjusts gold requirement for the mode the student is on
      engine.updateOverride('l07-assess-normality', 2);

      // Mode 7 is non-capstone (gold:1 in manifest), override to gold:2
      // still non-capstone, should stay unlocked and currentTier preserved
      expect(engine.currentTier).toBe(targetMode);
    });
  });

  // ========== TEST 6: Capstone relocking falls back gracefully ==========
  describe('Capstone relocking falls back gracefully', () => {
    it('falls back to highest unlocked non-capstone mode when capstone is relocked', () => {
      engine.loadCartridge(apStatsManifest);

      // Give the student enough stars to unlock the first capstone
      engine.starsPerMode['l09-inference-preview'] = { gold: 3, silver: 0, bronze: 0, tin: 0 };
      engine.unlockedTiers = [];
      engine.checkUnlocks(engine.unlockRules);

      // Verify capstone is unlocked
      expect(engine.unlockedTiers).toContain('l10-capstone');

      // Student navigates to the capstone
      engine.currentTier = 'l10-capstone';

      // Teacher raises the gold requirement for the capstone beyond earned stars
      // Previous mode has 3 gold, raise requirement to 5
      engine.updateOverride('l10-capstone', 5);

      // Capstone should now be relocked
      expect(engine.unlockedTiers).not.toContain('l10-capstone');

      // currentTier should fall back to the highest unlocked non-capstone mode
      // NOT to 'l01-sampling-variability' (the first level)
      expect(engine.currentTier).not.toBe('l01-sampling-variability');

      // It should be the highest unlocked mode (the last non-capstone before capstone,
      // or the last in the unlocked list)
      const lastUnlocked = engine.unlockedTiers[engine.unlockedTiers.length - 1];
      expect(engine.currentTier).toBe(lastUnlocked);
    });
  });
});
