/**
 * Tests for game-engine.js progression override functionality
 * v3.2: Teacher-configurable per-level gold requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage before importing GameEngine
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn((key) => { delete store[key]; })
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { GameEngine } from '../../platform/core/game-engine.js';

describe('GameEngine Progression Overrides', () => {
  let engine;

  // Mock manifest with per-level requirements
  const mockManifest = {
    meta: { id: 'test-cartridge' },
    modes: [
      { id: 'level-1', name: 'Level 1', unlockedBy: 'default' },
      { id: 'level-2', name: 'Level 2', unlockedBy: { gold: 3 } },
      { id: 'level-3', name: 'Level 3', unlockedBy: { gold: 1 } }, // Easy level
      { id: 'level-4', name: 'Level 4', unlockedBy: { gold: 5 } },
    ],
    progression: {
      streakFields: ['answer'],
      tiers: [
        { id: 'level-1', unlockedBy: 'default' },
        { id: 'level-2', unlockedBy: { gold: 3 } },
        { id: 'level-3', unlockedBy: { gold: 1 } },
        { id: 'level-4', unlockedBy: { gold: 5 } },
      ]
    }
  };

  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();

    engine = new GameEngine({
      onStreakUpdate: vi.fn(),
      onStarEarned: vi.fn(),
      onTierUnlocked: vi.fn()
    });

    engine.loadCartridge(mockManifest);
  });

  describe('getRequiredGold', () => {
    it('returns manifest value when no override', () => {
      expect(engine.getRequiredGold('level-2')).toBe(3);
      expect(engine.getRequiredGold('level-3')).toBe(1);
      expect(engine.getRequiredGold('level-4')).toBe(5);
    });

    it('returns global default for levels without manifest value', () => {
      // Level 1 has unlockedBy: "default" - no gold value
      // Global default is now 1 (changed from 3 in v4.8.1)
      expect(engine.getRequiredGold('level-1')).toBe(1); // Global default
    });

    it('returns override when set', () => {
      engine.updateOverride('level-2', 1);
      expect(engine.getRequiredGold('level-2')).toBe(1);
    });

    it('override takes priority over manifest', () => {
      expect(engine.getRequiredGold('level-3')).toBe(1); // From manifest
      engine.updateOverride('level-3', 5);
      expect(engine.getRequiredGold('level-3')).toBe(5); // Override wins
    });
  });

  describe('getManifestDefault', () => {
    it('returns manifest value ignoring override', () => {
      engine.updateOverride('level-2', 1);
      expect(engine.getManifestDefault('level-2')).toBe(3); // Original manifest value
    });

    it('returns global default when manifest has no gold value', () => {
      // Global default is now 1 (changed from 3 in v4.8.1)
      expect(engine.getManifestDefault('level-1')).toBe(1); // Global default
    });
  });

  describe('setOverrides', () => {
    it('applies multiple overrides at once', () => {
      engine.setOverrides({
        'level-2': 2,
        'level-3': 4,
        'level-4': 1
      });

      expect(engine.getRequiredGold('level-2')).toBe(2);
      expect(engine.getRequiredGold('level-3')).toBe(4);
      expect(engine.getRequiredGold('level-4')).toBe(1);
    });

    it('clears previous overrides when setting new ones', () => {
      engine.updateOverride('level-2', 99);
      engine.setOverrides({ 'level-3': 2 });

      expect(engine.getRequiredGold('level-2')).toBe(3); // Back to manifest
      expect(engine.getRequiredGold('level-3')).toBe(2); // New override
    });

    it('handles empty overrides object', () => {
      engine.updateOverride('level-2', 1);
      engine.setOverrides({});

      expect(engine.getRequiredGold('level-2')).toBe(3); // Back to manifest
    });

    it('handles null/undefined', () => {
      engine.updateOverride('level-2', 1);
      engine.setOverrides(null);

      expect(engine.getRequiredGold('level-2')).toBe(3); // Back to manifest
    });
  });

  describe('updateOverride', () => {
    it('sets a single override', () => {
      engine.updateOverride('level-2', 1);
      expect(engine.getRequiredGold('level-2')).toBe(1);
    });

    it('re-evaluates unlocks after override', () => {
      // Initially only level-1 is unlocked
      expect(engine.isModeUnlocked('level-1')).toBe(true);
      expect(engine.isModeUnlocked('level-2')).toBe(false);

      // Award 1 gold star to level-1
      engine.starsPerMode['level-1'] = { gold: 1 };

      // Level 2 still locked (needs 3 gold)
      engine.setOverrides({});
      expect(engine.isModeUnlocked('level-2')).toBe(false);

      // Now set override to require only 1 gold
      engine.updateOverride('level-2', 1);
      expect(engine.isModeUnlocked('level-2')).toBe(true);
    });
  });

  describe('removeOverride', () => {
    it('removes override and reverts to manifest', () => {
      engine.updateOverride('level-2', 1);
      expect(engine.getRequiredGold('level-2')).toBe(1);

      engine.removeOverride('level-2');
      expect(engine.getRequiredGold('level-2')).toBe(3); // Back to manifest
    });

    it('handles removing non-existent override', () => {
      // Should not throw
      engine.removeOverride('level-2');
      expect(engine.getRequiredGold('level-2')).toBe(3);
    });
  });

  describe('hasOverride', () => {
    it('returns false when no override', () => {
      expect(engine.hasOverride('level-2')).toBe(false);
    });

    it('returns true when override exists', () => {
      engine.updateOverride('level-2', 1);
      expect(engine.hasOverride('level-2')).toBe(true);
    });

    it('returns false after override removed', () => {
      engine.updateOverride('level-2', 1);
      engine.removeOverride('level-2');
      expect(engine.hasOverride('level-2')).toBe(false);
    });
  });

  describe('getState', () => {
    it('includes progressionOverrides in state', () => {
      engine.updateOverride('level-2', 1);
      engine.updateOverride('level-3', 5);

      const state = engine.getState();
      expect(state.progressionOverrides).toEqual({
        'level-2': 1,
        'level-3': 5
      });
    });

    it('returns empty object when no overrides', () => {
      const state = engine.getState();
      expect(state.progressionOverrides).toEqual({});
    });
  });

  describe('checkUnlocks with per-level requirements', () => {
    it('uses manifest per-level requirements when no overrides', () => {
      // Award 3 gold to level-1
      engine.starsPerMode['level-1'] = { gold: 3 };
      engine.unlockedTiers = [];
      engine.checkUnlocks(engine.unlockRules);

      // Level 2 should be unlocked (requires 3 gold)
      expect(engine.isModeUnlocked('level-2')).toBe(true);
    });

    it('respects lower requirements for specific levels', () => {
      // Award 1 gold to level-2
      engine.starsPerMode['level-1'] = { gold: 3 };
      engine.starsPerMode['level-2'] = { gold: 1 };
      engine.unlockedTiers = [];
      engine.checkUnlocks(engine.unlockRules);

      // Level 3 should be unlocked (requires only 1 gold)
      expect(engine.isModeUnlocked('level-3')).toBe(true);
    });

    it('uses override when set', () => {
      // Award 2 gold to level-1
      engine.starsPerMode['level-1'] = { gold: 2 };

      // Level 2 should NOT be unlocked (needs 3)
      engine.unlockedTiers = [];
      engine.checkUnlocks(engine.unlockRules);
      expect(engine.isModeUnlocked('level-2')).toBe(false);

      // Set override to 2
      engine.updateOverride('level-2', 2);
      // Now level 2 should be unlocked
      expect(engine.isModeUnlocked('level-2')).toBe(true);
    });
  });

  describe('Polynomial cartridge scenario', () => {
    it('handles tough levels with 1 gold requirement', () => {
      const polyManifest = {
        meta: { id: 'adding-subtracting-polynomials' },
        modes: [
          { id: 'l01-vocabulary', unlockedBy: 'default' },
          { id: 'l02-like-terms', unlockedBy: { gold: 3 } },
          { id: 'l06-add-vertical', unlockedBy: { gold: 3 } },
          { id: 'l07-subtract-distribute', unlockedBy: { gold: 1 } }, // Tough level - easy to pass
          { id: 'l08-subtract-mixed', unlockedBy: { gold: 1 } }, // Tough level - easy to pass
          { id: 'l09-three-polys', unlockedBy: { gold: 1 } }, // Tough level - easy to pass
          { id: 'l10-linear-set-s', unlockedBy: { gold: 3 } },
        ],
        progression: { streakFields: ['problem'], tiers: [] }
      };

      const polyEngine = new GameEngine();
      polyEngine.loadCartridge(polyManifest);

      // Levels 7, 8, 9 require only 1 gold
      expect(polyEngine.getRequiredGold('l07-subtract-distribute')).toBe(1);
      expect(polyEngine.getRequiredGold('l08-subtract-mixed')).toBe(1);
      expect(polyEngine.getRequiredGold('l09-three-polys')).toBe(1);

      // Other levels require 3 gold
      expect(polyEngine.getRequiredGold('l02-like-terms')).toBe(3);
      expect(polyEngine.getRequiredGold('l06-add-vertical')).toBe(3);
      expect(polyEngine.getRequiredGold('l10-linear-set-s')).toBe(3);
    });

    it('teacher can override tough level requirement', () => {
      const polyManifest = {
        meta: { id: 'adding-subtracting-polynomials' },
        modes: [
          { id: 'l07-subtract-distribute', unlockedBy: { gold: 1 } },
        ],
        progression: { streakFields: ['problem'], tiers: [] }
      };

      const polyEngine = new GameEngine();
      polyEngine.loadCartridge(polyManifest);

      // Default is 1 gold
      expect(polyEngine.getRequiredGold('l07-subtract-distribute')).toBe(1);

      // Teacher changes to 2 gold
      polyEngine.updateOverride('l07-subtract-distribute', 2);
      expect(polyEngine.getRequiredGold('l07-subtract-distribute')).toBe(2);

      // Manifest default is still 1
      expect(polyEngine.getManifestDefault('l07-subtract-distribute')).toBe(1);
    });
  });
});
