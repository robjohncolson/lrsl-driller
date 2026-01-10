/**
 * Scoring Configuration Tests
 * Tests for level-weighted scoring system
 *
 * Features tested:
 * - calculateWeightedPoints function
 * - getLevelMultiplier function
 * - getPointsBreakdown function
 * - Star ratio calculations (v1.5: 4/3/2/1 effective points)
 * - Level progression multipliers
 * - Minimum 1 point floor (v1.5)
 */

import { describe, it, expect } from 'vitest';
import {
  SCORING_CONFIG,
  calculateWeightedPoints,
  getLevelMultiplier,
  getPointsBreakdown
} from '../../shared/scoring.config.js';

describe('Scoring Configuration', () => {

  describe('SCORING_CONFIG constants', () => {
    it('should have correct base gold points', () => {
      expect(SCORING_CONFIG.baseGoldPoints).toBe(4);
    });

    it('should have correct star ratios (v1.5: effective 4/3/2/1)', () => {
      expect(SCORING_CONFIG.starRatios.gold).toBe(1.0);    // 4 * 1.0 = 4
      expect(SCORING_CONFIG.starRatios.silver).toBe(0.75); // 4 * 0.75 = 3
      expect(SCORING_CONFIG.starRatios.bronze).toBe(0.5);  // 4 * 0.5 = 2
      expect(SCORING_CONFIG.starRatios.tin).toBe(0.25);    // 4 * 0.25 = 1
    });

    it('should have minimum points floor (v1.5)', () => {
      expect(SCORING_CONFIG.minimumPoints).toBe(1);
    });

    it('should have correct level multiplier range', () => {
      expect(SCORING_CONFIG.levelMultiplier.first).toBe(0.5);
      expect(SCORING_CONFIG.levelMultiplier.last).toBe(3.0);
    });

    it('should require 3 gold stars to unlock next level', () => {
      expect(SCORING_CONFIG.goldToUnlock).toBe(3);
    });
  });

  describe('getLevelMultiplier', () => {
    it('should return 0.5x for first level (index 0)', () => {
      const multiplier = getLevelMultiplier(0, 5);
      expect(multiplier).toBe(0.5);
    });

    it('should return 3.0x for last level', () => {
      const multiplier = getLevelMultiplier(4, 5); // index 4 of 5 levels
      expect(multiplier).toBe(3.0);
    });

    it('should interpolate middle levels', () => {
      // 5 levels: indices 0,1,2,3,4
      // index 2 = midpoint = (0.5 + 3.0) / 2 = 1.75
      const multiplier = getLevelMultiplier(2, 5);
      expect(multiplier).toBe(1.75);
    });

    it('should handle 2-level cartridge correctly', () => {
      expect(getLevelMultiplier(0, 2)).toBe(0.5);  // First
      expect(getLevelMultiplier(1, 2)).toBe(3.0);  // Last
    });

    it('should return middle multiplier for single-level cartridge', () => {
      const multiplier = getLevelMultiplier(0, 1);
      expect(multiplier).toBe(1.75); // (0.5 + 3.0) / 2
    });

    it('should calculate correct multipliers for 10-level cartridge', () => {
      // Level 1 (index 0): 0.5
      expect(getLevelMultiplier(0, 10)).toBeCloseTo(0.5, 2);

      // Level 5 (index 4): progress = 4/9 ≈ 0.444, mult = 0.5 + 0.444 * 2.5 ≈ 1.61
      expect(getLevelMultiplier(4, 10)).toBeCloseTo(1.611, 2);

      // Level 10 (index 9): 3.0
      expect(getLevelMultiplier(9, 10)).toBeCloseTo(3.0, 2);
    });
  });

  describe('calculateWeightedPoints', () => {
    describe('Gold stars', () => {
      it('should calculate gold star at level 1 (0.5x)', () => {
        const points = calculateWeightedPoints('gold', 0, 5);
        // 4 * 1.0 * 0.5 = 2.0
        expect(points).toBe(2.0);
      });

      it('should calculate gold star at level 5 (3.0x)', () => {
        const points = calculateWeightedPoints('gold', 4, 5);
        // 4 * 1.0 * 3.0 = 12.0
        expect(points).toBe(12.0);
      });

      it('should calculate gold star at middle level', () => {
        const points = calculateWeightedPoints('gold', 2, 5);
        // 4 * 1.0 * 1.75 = 7.0
        expect(points).toBe(7.0);
      });
    });

    describe('Silver stars (v1.5: 0.75 ratio)', () => {
      it('should calculate silver star at level 1', () => {
        const points = calculateWeightedPoints('silver', 0, 5);
        // 4 * 0.75 * 0.5 = 1.5
        expect(points).toBe(1.5);
      });

      it('should calculate silver star at level 5', () => {
        const points = calculateWeightedPoints('silver', 4, 5);
        // 4 * 0.75 * 3.0 = 9.0
        expect(points).toBe(9.0);
      });
    });

    describe('Bronze stars (v1.5: 0.5 ratio)', () => {
      it('should calculate bronze star at level 1', () => {
        const points = calculateWeightedPoints('bronze', 0, 5);
        // 4 * 0.5 * 0.5 = 1.0
        expect(points).toBe(1.0);
      });

      it('should calculate bronze star at level 5', () => {
        const points = calculateWeightedPoints('bronze', 4, 5);
        // 4 * 0.5 * 3.0 = 6.0
        expect(points).toBe(6.0);
      });
    });

    describe('Tin stars (v1.5: 0.25 ratio, min 1 pt floor)', () => {
      it('should calculate tin star at level 1 with minimum floor', () => {
        const points = calculateWeightedPoints('tin', 0, 5);
        // 4 * 0.25 * 0.5 = 0.5 → floored to 1 (v1.5 minimum)
        expect(points).toBe(1);
      });

      it('should calculate tin star at level 5', () => {
        const points = calculateWeightedPoints('tin', 4, 5);
        // 4 * 0.25 * 3.0 = 3.0
        expect(points).toBe(3.0);
      });
    });

    describe('Edge cases', () => {
      it('should handle unknown star type by using tin ratio with floor', () => {
        const points = calculateWeightedPoints('invalid', 0, 5);
        // Same as tin: 4 * 0.25 * 0.5 = 0.5 → floored to 1
        expect(points).toBe(1);
      });

      it('should handle single-level cartridge', () => {
        const points = calculateWeightedPoints('gold', 0, 1);
        // 4 * 1.0 * 1.75 = 7.0
        expect(points).toBe(7.0);
      });

      it('should handle level index 0 correctly', () => {
        const points = calculateWeightedPoints('gold', 0, 10);
        expect(points).toBe(2.0); // 4 * 1.0 * 0.5
      });

      it('should round to 1 decimal place', () => {
        // Check that points are properly rounded
        const points = calculateWeightedPoints('gold', 1, 5);
        // 4 * 1.0 * (0.5 + 0.25 * 2.5) = 4 * 1.125 = 4.5
        expect(points).toBe(4.5);
      });
    });

    describe('Progression incentive', () => {
      it('gold at final level should be worth more than gold at first level', () => {
        const firstLevel = calculateWeightedPoints('gold', 0, 10);
        const lastLevel = calculateWeightedPoints('gold', 9, 10);

        expect(lastLevel).toBeGreaterThan(firstLevel);
        expect(lastLevel / firstLevel).toBe(6); // 3.0 / 0.5
      });

      it('silver at final level should be worth more than gold at first level', () => {
        const goldFirst = calculateWeightedPoints('gold', 0, 5);  // 2.0
        const silverLast = calculateWeightedPoints('silver', 4, 5); // 9.0 (v1.5)

        expect(silverLast).toBeGreaterThan(goldFirst);
      });
    });
  });

  describe('getPointsBreakdown', () => {
    it('should return complete breakdown object', () => {
      const breakdown = getPointsBreakdown('gold', 2, 5);

      expect(breakdown).toHaveProperty('basePoints', 4);
      expect(breakdown).toHaveProperty('starRatio', 1.0);
      expect(breakdown).toHaveProperty('starRatioLabel', 'gold (1x)');
      expect(breakdown).toHaveProperty('levelMultiplier', 1.75);
      expect(breakdown).toHaveProperty('levelLabel', 'Level 3/5');
      expect(breakdown).toHaveProperty('total', 7.0);
    });

    it('should show correct level label (1-indexed)', () => {
      const breakdown = getPointsBreakdown('gold', 0, 5);
      expect(breakdown.levelLabel).toBe('Level 1/5');

      const lastBreakdown = getPointsBreakdown('gold', 4, 5);
      expect(lastBreakdown.levelLabel).toBe('Level 5/5');
    });

    it('should calculate total correctly', () => {
      const breakdown = getPointsBreakdown('silver', 4, 5);

      // Verify: basePoints * starRatio * levelMultiplier
      const expected = breakdown.basePoints * breakdown.starRatio * breakdown.levelMultiplier;
      expect(breakdown.total).toBeCloseTo(expected, 1);
    });
  });

  describe('Star type hierarchy (v1.5)', () => {
    it('gold > silver > bronze > tin at same level', () => {
      const level = 2;
      const totalLevels = 5;

      const gold = calculateWeightedPoints('gold', level, totalLevels);
      const silver = calculateWeightedPoints('silver', level, totalLevels);
      const bronze = calculateWeightedPoints('bronze', level, totalLevels);
      const tin = calculateWeightedPoints('tin', level, totalLevels);

      expect(gold).toBeGreaterThan(silver);
      expect(silver).toBeGreaterThan(bronze);
      expect(bronze).toBeGreaterThan(tin);
    });

    it('silver is 75% of gold (v1.5)', () => {
      const gold = calculateWeightedPoints('gold', 2, 5);
      const silver = calculateWeightedPoints('silver', 2, 5);

      // Rounding in calculateWeightedPoints causes slight variance
      expect(silver / gold).toBeCloseTo(0.75, 1);
    });

    it('v1.5 tier ratios: 4/3/2/1 effective base points', () => {
      // At level 2 of 5 (multiplier 1.75):
      // gold = 4 * 1.0 * 1.75 = 7.0
      // silver = 4 * 0.75 * 1.75 = 5.25
      // bronze = 4 * 0.5 * 1.75 = 3.5
      // tin = 4 * 0.25 * 1.75 = 1.75
      const gold = calculateWeightedPoints('gold', 2, 5);
      const silver = calculateWeightedPoints('silver', 2, 5);
      const bronze = calculateWeightedPoints('bronze', 2, 5);
      const tin = calculateWeightedPoints('tin', 2, 5);

      expect(gold).toBe(7.0);
      expect(silver).toBe(5.3);  // 5.25 rounded to 1 decimal
      expect(bronze).toBe(3.5);
      expect(tin).toBe(1.8);     // 1.75 rounded to 1 decimal
    });
  });
});
