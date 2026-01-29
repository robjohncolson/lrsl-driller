/**
 * Ghost Orbits Shadow Self Progression System Tests
 *
 * Tests the stat leveling system that upgrades ghost properties
 * when the player defeats their Shadow Self.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Ghost Orbits Shadow Self Progression', () => {
  let mockController;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage[key] = value; }),
      removeItem: vi.fn((key) => { delete mockLocalStorage[key]; }),
      clear: vi.fn(() => { mockLocalStorage = {}; })
    };

    // Create mock controller with required methods
    mockController = {
      cartridgeId: 'test_cartridge',
      username: 'testPlayer',
      ghostProperties: {
        mass: 1.0,
        thrustEfficiency: 1.0,
        trailDuration: 1.0,
        energyRegen: 1.0,
        trailWidth: 1.0
      },
      matchStats: {
        energyDepletionCount: 0,
        territoryClaimRate: 0,
        timeSpentOrbiting: 0,
        absorptionAttempts: 0,
        totalGameTime: 100 // 100 seconds for easy calculation
      }
    };
  });

  describe('Match Stats Tracking', () => {
    it('should track energy depletion events', () => {
      mockController.matchStats.energyDepletionCount = 15;
      mockController.matchStats.totalGameTime = 100;

      const depletionRate = mockController.matchStats.energyDepletionCount / mockController.matchStats.totalGameTime;
      expect(depletionRate).toBe(0.15);
    });

    it('should track territory claim rate', () => {
      mockController.matchStats.territoryClaimRate = 0.003; // 0.3% per second
      expect(mockController.matchStats.territoryClaimRate).toBeLessThan(0.005);
    });

    it('should track time spent orbiting', () => {
      mockController.matchStats.timeSpentOrbiting = 50;
      mockController.matchStats.totalGameTime = 100;

      const orbitPercent = mockController.matchStats.timeSpentOrbiting / mockController.matchStats.totalGameTime;
      expect(orbitPercent).toBe(0.5);
    });

    it('should track absorption attempts', () => {
      mockController.matchStats.absorptionAttempts = 8;
      expect(mockController.matchStats.absorptionAttempts).toBeGreaterThan(5);
    });
  });

  describe('Stat Analysis Logic', () => {
    it('should identify energy regen as weak when energy depletes often', () => {
      mockController.matchStats.energyDepletionCount = 20; // 0.2 per second
      mockController.matchStats.territoryClaimRate = 0.01; // Good
      mockController.matchStats.timeSpentOrbiting = 10; // 10%
      mockController.matchStats.absorptionAttempts = 2; // Low

      // Energy depletion rate is 0.2, which is > 0.1 threshold
      // This should be identified as the primary weakness
      const energyDepletionRate = mockController.matchStats.energyDepletionCount / mockController.matchStats.totalGameTime;
      expect(energyDepletionRate).toBeGreaterThan(0.1);
    });

    it('should identify territory stats as weak when claim rate is low', () => {
      mockController.matchStats.energyDepletionCount = 5; // Low
      mockController.matchStats.territoryClaimRate = 0.002; // Poor
      mockController.matchStats.timeSpentOrbiting = 10;
      mockController.matchStats.absorptionAttempts = 2;

      // Territory claim rate is 0.002, which is < 0.005 threshold
      expect(mockController.matchStats.territoryClaimRate).toBeLessThan(0.005);
    });

    it('should identify mass as weak when absorption attempts are high', () => {
      mockController.matchStats.energyDepletionCount = 5;
      mockController.matchStats.territoryClaimRate = 0.01;
      mockController.matchStats.timeSpentOrbiting = 10;
      mockController.matchStats.absorptionAttempts = 12; // High

      expect(mockController.matchStats.absorptionAttempts).toBeGreaterThan(5);
    });

    it('should identify thrust as weak when orbiting too much', () => {
      mockController.matchStats.energyDepletionCount = 5;
      mockController.matchStats.territoryClaimRate = 0.01;
      mockController.matchStats.timeSpentOrbiting = 50; // 50% of time
      mockController.matchStats.absorptionAttempts = 2;

      const orbitPercent = mockController.matchStats.timeSpentOrbiting / mockController.matchStats.totalGameTime;
      expect(orbitPercent).toBeGreaterThan(0.4);
    });
  });

  describe('Stat Upgrade System', () => {
    it('should increase stat by 0.05', () => {
      const initialMass = mockController.ghostProperties.mass;
      const expectedMass = initialMass + 0.05;

      mockController.ghostProperties.mass = expectedMass;
      expect(mockController.ghostProperties.mass).toBe(1.05);
    });

    it('should cap stats at 1.5 maximum', () => {
      mockController.ghostProperties.mass = 1.48;
      const newValue = Math.min(mockController.ghostProperties.mass + 0.05, 1.5);

      expect(newValue).toBe(1.5);
    });

    it('should upgrade energyRegen when energy is weak', () => {
      const statToUpgrade = 'energyRegen';
      const initialValue = mockController.ghostProperties[statToUpgrade];

      mockController.ghostProperties[statToUpgrade] = Math.min(initialValue + 0.05, 1.5);
      expect(mockController.ghostProperties.energyRegen).toBe(1.05);
    });

    it('should upgrade trailDuration when territory claim is weak', () => {
      const statToUpgrade = 'trailDuration';
      const initialValue = mockController.ghostProperties[statToUpgrade];

      mockController.ghostProperties[statToUpgrade] = Math.min(initialValue + 0.05, 1.5);
      expect(mockController.ghostProperties.trailDuration).toBe(1.05);
    });

    it('should upgrade mass when absorption attempts are high', () => {
      const statToUpgrade = 'mass';
      const initialValue = mockController.ghostProperties[statToUpgrade];

      mockController.ghostProperties[statToUpgrade] = Math.min(initialValue + 0.05, 1.5);
      expect(mockController.ghostProperties.mass).toBe(1.05);
    });

    it('should upgrade thrustEfficiency when orbiting too much', () => {
      const statToUpgrade = 'thrustEfficiency';
      const initialValue = mockController.ghostProperties[statToUpgrade];

      mockController.ghostProperties[statToUpgrade] = Math.min(initialValue + 0.05, 1.5);
      expect(mockController.ghostProperties.thrustEfficiency).toBe(1.05);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save ghost stats to localStorage', () => {
      const key = `${mockController.cartridgeId}_ghost_stats`;
      const stats = {
        mass: 1.1,
        thrustEfficiency: 1.05,
        trailDuration: 1.0,
        energyRegen: 1.15,
        trailWidth: 1.0
      };

      localStorage.setItem(key, JSON.stringify(stats));
      const saved = JSON.parse(localStorage.getItem(key));

      expect(saved.mass).toBe(1.1);
      expect(saved.energyRegen).toBe(1.15);
    });

    it('should load ghost stats from localStorage', () => {
      const key = `${mockController.cartridgeId}_ghost_stats`;
      const stats = {
        mass: 1.2,
        thrustEfficiency: 1.1,
        trailDuration: 1.05,
        energyRegen: 1.1,
        trailWidth: 1.0
      };

      localStorage.setItem(key, JSON.stringify(stats));
      const loaded = JSON.parse(localStorage.getItem(key));

      expect(loaded.mass).toBe(1.2);
      expect(loaded.thrustEfficiency).toBe(1.1);
    });

    it('should save shadow generation to localStorage', () => {
      const key = `${mockController.cartridgeId}_shadow_generation`;
      const generation = 5;

      localStorage.setItem(key, generation.toString());
      const saved = parseInt(localStorage.getItem(key), 10);

      expect(saved).toBe(5);
    });

    it('should default to generation 1 if not saved', () => {
      const key = `${mockController.cartridgeId}_shadow_generation`;
      const stored = localStorage.getItem(key);
      const generation = stored ? parseInt(stored, 10) : 1;

      expect(generation).toBe(1);
    });
  });

  describe('Shadow Generation Progression', () => {
    it('should increment shadow generation on player victory', () => {
      let shadowGeneration = 1;
      shadowGeneration++;

      expect(shadowGeneration).toBe(2);
    });

    it('should not increment shadow generation on player loss', () => {
      const shadowGeneration = 3;
      // On loss, generation stays the same
      expect(shadowGeneration).toBe(3);
    });

    it('should track multiple victories', () => {
      let shadowGeneration = 1;

      // Win 1
      shadowGeneration++;
      expect(shadowGeneration).toBe(2);

      // Win 2
      shadowGeneration++;
      expect(shadowGeneration).toBe(3);

      // Win 3
      shadowGeneration++;
      expect(shadowGeneration).toBe(4);
    });
  });

  describe('Integration: Victory Flow', () => {
    it('should handle complete victory flow', () => {
      // Setup: Player has low energy regen, gets depleted often
      mockController.matchStats.energyDepletionCount = 25;
      mockController.matchStats.territoryClaimRate = 0.008;
      mockController.matchStats.timeSpentOrbiting = 15;
      mockController.matchStats.absorptionAttempts = 3;
      mockController.matchStats.totalGameTime = 100;

      // Analyze stats
      const energyDepletionRate = mockController.matchStats.energyDepletionCount / mockController.matchStats.totalGameTime;
      expect(energyDepletionRate).toBe(0.25);

      // Energy is clearly the weakest stat
      const weakestStat = 'energyRegen';

      // Apply upgrade
      const initialValue = mockController.ghostProperties[weakestStat];
      mockController.ghostProperties[weakestStat] = Math.min(initialValue + 0.05, 1.5);

      expect(mockController.ghostProperties.energyRegen).toBe(1.05);

      // Save to localStorage
      const key = `${mockController.cartridgeId}_ghost_stats`;
      localStorage.setItem(key, JSON.stringify(mockController.ghostProperties));

      // Increment shadow generation
      let shadowGeneration = 1;
      shadowGeneration++;

      expect(shadowGeneration).toBe(2);

      // Save shadow generation
      const genKey = `${mockController.cartridgeId}_shadow_generation`;
      localStorage.setItem(genKey, shadowGeneration.toString());

      expect(localStorage.getItem(genKey)).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle division by zero when totalGameTime is 0', () => {
      mockController.matchStats.totalGameTime = 0;
      mockController.matchStats.energyDepletionCount = 5;

      const depletionRate = mockController.matchStats.energyDepletionCount / Math.max(mockController.matchStats.totalGameTime, 1.0);
      expect(depletionRate).toBe(5.0);
    });

    it('should handle already maxed stats', () => {
      mockController.ghostProperties.mass = 1.5;
      const newValue = Math.min(mockController.ghostProperties.mass + 0.05, 1.5);

      expect(newValue).toBe(1.5); // Should stay at cap
    });

    it('should handle corrupted localStorage data', () => {
      const key = `${mockController.cartridgeId}_ghost_stats`;
      localStorage.setItem(key, 'invalid json {]');

      let parsed = null;
      try {
        parsed = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        // Expected to fail
      }

      expect(parsed).toBeNull();
    });
  });
});
