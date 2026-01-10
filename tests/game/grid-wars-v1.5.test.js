/**
 * Grid Wars v1.5 Tests
 * Tests for the "Bitcoin Model" economy update:
 * - 3x cost inflation
 * - 25x25 map expansion
 * - Dynamic scarcity pricing
 * - 24hr AFK decay with daily cell loss
 * - Velocity strike (points/min attack discount)
 * - Guerrilla warfare (small vs large discount)
 * - Overextension penalty (isolated cell discount)
 * - Auto-bounty system (target dominant players)
 * - Minimum 1 point floor
 *
 * NOTE: v1.6 changed many config values (8x8 map, different costs).
 * Tests for v1.5-specific values are skipped. See grid-wars-v1.6.test.js
 * for tests with current configuration values.
 */

import { describe, it, expect } from 'vitest';
import { GRID_WARS_CONFIG } from '../../shared/gridwars.config.js';

// Skip entire suite - v1.6 changed all these config values
// See grid-wars-v1.6.test.js for current tests
describe.skip('Grid Wars v1.5 Features (superseded by v1.6)', () => {

  describe('Economy Recalibration (3x costs)', () => {
    it('claim cost is 30 (was 10)', () => {
      expect(GRID_WARS_CONFIG.claimCost).toBe(30);
    });

    it('takeover costs are 3x (cold: 45, warm: 60, active: 75)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBe(45);
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBe(60);
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(75);
    });

    it('node claim cost is 45 (was 15)', () => {
      expect(GRID_WARS_CONFIG.nodeClaimCost).toBe(45);
    });

    it('surge cost is 15 (was 5)', () => {
      expect(GRID_WARS_CONFIG.surgeCost).toBe(15);
    });

    it('boot bonus is 45 (was 15)', () => {
      expect(GRID_WARS_CONFIG.bootBonus).toBe(45);
    });

    it('underdog minimum cost is 15 (was 5)', () => {
      expect(GRID_WARS_CONFIG.underdogMinCost).toBe(15);
    });

    it('star points are 4/3/2/1 effective values', () => {
      expect(GRID_WARS_CONFIG.starPoints.gold).toBe(4);
      expect(GRID_WARS_CONFIG.starPoints.silver).toBe(3);
      expect(GRID_WARS_CONFIG.starPoints.bronze).toBe(2);
      expect(GRID_WARS_CONFIG.starPoints.tin).toBe(1);
    });

    it('minimum points per answer is 1', () => {
      expect(GRID_WARS_CONFIG.minimumPointsPerAnswer).toBe(1);
    });
  });

  describe('Map Expansion (25x25)', () => {
    it('map size is 25 (was 20)', () => {
      expect(GRID_WARS_CONFIG.mapSize).toBe(25);
    });

    it('total cells is 625 (was 400)', () => {
      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      expect(totalCells).toBe(625);
    });

    it('has 5 node positions (was 3)', () => {
      expect(GRID_WARS_CONFIG.nodePositions).toHaveLength(5);
    });

    it('node positions are within 25x25 bounds', () => {
      for (const node of GRID_WARS_CONFIG.nodePositions) {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThan(25);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThan(25);
      }
    });

    it('center node is at (12, 12)', () => {
      const centerNode = GRID_WARS_CONFIG.nodePositions[0];
      expect(centerNode.x).toBe(12);
      expect(centerNode.y).toBe(12);
    });

    it('corner nodes are positioned in all four quadrants', () => {
      const nodes = GRID_WARS_CONFIG.nodePositions;
      const positions = nodes.map(n => `${n.x},${n.y}`);

      expect(positions).toContain('5,5');    // Top-left
      expect(positions).toContain('19,19');  // Bottom-right
      expect(positions).toContain('5,19');   // Bottom-left
      expect(positions).toContain('19,5');   // Top-right
    });
  });

  describe('Diminishing Returns (scaled for 25x25)', () => {
    it('threshold is 75 (was 25, ~12% of 625)', () => {
      expect(GRID_WARS_CONFIG.diminishingReturnsThreshold).toBe(75);
    });

    it('factor is 0.004 (was 0.005)', () => {
      expect(GRID_WARS_CONFIG.diminishingReturnsFactor).toBe(0.004);
    });

    it('minimum multiplier is 0.5', () => {
      expect(GRID_WARS_CONFIG.diminishingReturnsMinMultiplier).toBe(0.5);
    });

    it('is enabled', () => {
      expect(GRID_WARS_CONFIG.diminishingReturnsEnabled).toBe(true);
    });
  });

  describe('AFK Decay (24hr grace, daily cell loss)', () => {
    it('grace period is 24 hours', () => {
      expect(GRID_WARS_CONFIG.afkGracePeriodHours).toBe(24);
    });

    it('decay rate is 1 cell per day', () => {
      expect(GRID_WARS_CONFIG.afkDecayCellsPerDay).toBe(1);
    });

    it('check interval is 1 hour (3600000ms)', () => {
      expect(GRID_WARS_CONFIG.afkDecayCheckIntervalMs).toBe(3600000);
    });

    it('decay target is neutral (not strength loss)', () => {
      expect(GRID_WARS_CONFIG.afkDecayTarget).toBe('neutral');
    });
  });

  describe('Dynamic Scarcity Pricing', () => {
    it('is enabled', () => {
      expect(GRID_WARS_CONFIG.scarcityEnabled).toBe(true);
    });

    it('has 4 phases with correct thresholds', () => {
      const phases = GRID_WARS_CONFIG.scarcityPhases;

      expect(phases.EXPANSION.maxFill).toBe(0.50);
      expect(phases.TENSION.maxFill).toBe(0.80);
      expect(phases.SCARCITY.maxFill).toBe(0.95);
      expect(phases.SATURATION.maxFill).toBe(1.00);
    });

    it('multipliers increase with scarcity', () => {
      const phases = GRID_WARS_CONFIG.scarcityPhases;

      expect(phases.EXPANSION.multiplier).toBe(1.0);
      expect(phases.TENSION.multiplier).toBe(1.6);
      expect(phases.SCARCITY.multiplier).toBe(2.2);
      expect(phases.SATURATION.multiplier).toBe(3.0);
    });

    it('phases have themed messages', () => {
      const phases = GRID_WARS_CONFIG.scarcityPhases;

      expect(phases.EXPANSION.message).toContain('Land Rush');
      expect(phases.TENSION.message).toContain('Tightening');
      expect(phases.SCARCITY.message).toContain('Real Estate');
      expect(phases.SATURATION.message).toContain('Last Parcels');
    });

    it('has full message for 100% fill', () => {
      expect(GRID_WARS_CONFIG.scarcityFullMessage).toContain('Only Conquest Remains');
    });
  });

  describe('Velocity Strike', () => {
    it('is enabled', () => {
      expect(GRID_WARS_CONFIG.velocityEnabled).toBe(true);
    });

    it('uses 10 minute window', () => {
      expect(GRID_WARS_CONFIG.velocityWindowMinutes).toBe(10);
    });

    it('has 4 tiers with increasing discounts', () => {
      const tiers = GRID_WARS_CONFIG.velocityTiers;

      expect(tiers.BLAZING.min).toBe(2.0);
      expect(tiers.BLAZING.discount).toBe(0.40);

      expect(tiers.FLOWING.min).toBe(1.0);
      expect(tiers.FLOWING.discount).toBe(0.25);

      expect(tiers.ACTIVE.min).toBe(0.5);
      expect(tiers.ACTIVE.discount).toBe(0.10);

      expect(tiers.IDLE.min).toBe(0);
      expect(tiers.IDLE.discount).toBe(0);
    });

    it('tier thresholds are in descending order', () => {
      const tiers = GRID_WARS_CONFIG.velocityTiers;

      expect(tiers.BLAZING.min).toBeGreaterThan(tiers.FLOWING.min);
      expect(tiers.FLOWING.min).toBeGreaterThan(tiers.ACTIVE.min);
      expect(tiers.ACTIVE.min).toBeGreaterThan(tiers.IDLE.min);
    });

    it('discounts are between 0% and 50%', () => {
      const tiers = GRID_WARS_CONFIG.velocityTiers;

      for (const tier of Object.values(tiers)) {
        expect(tier.discount).toBeGreaterThanOrEqual(0);
        expect(tier.discount).toBeLessThanOrEqual(0.5);
      }
    });
  });

  describe('Guerrilla Warfare', () => {
    it('is enabled', () => {
      expect(GRID_WARS_CONFIG.guerrillaEnabled).toBe(true);
    });

    it('has 3 tiers', () => {
      expect(GRID_WARS_CONFIG.guerrillaTiers).toHaveLength(3);
    });

    it('first tier: 10 cells vs 50 = 50% discount', () => {
      const tier = GRID_WARS_CONFIG.guerrillaTiers[0];
      expect(tier.attackerMax).toBe(10);
      expect(tier.defenderMin).toBe(50);
      expect(tier.discount).toBe(0.50);
    });

    it('second tier: 20 cells vs 75 = 40% discount', () => {
      const tier = GRID_WARS_CONFIG.guerrillaTiers[1];
      expect(tier.attackerMax).toBe(20);
      expect(tier.defenderMin).toBe(75);
      expect(tier.discount).toBe(0.40);
    });

    it('third tier: 30 cells vs 100 = 30% discount', () => {
      const tier = GRID_WARS_CONFIG.guerrillaTiers[2];
      expect(tier.attackerMax).toBe(30);
      expect(tier.defenderMin).toBe(100);
      expect(tier.discount).toBe(0.30);
    });

    it('discounts decrease as attacker size increases', () => {
      const tiers = GRID_WARS_CONFIG.guerrillaTiers;

      expect(tiers[0].discount).toBeGreaterThan(tiers[1].discount);
      expect(tiers[1].discount).toBeGreaterThan(tiers[2].discount);
    });
  });

  describe('Overextension Penalty', () => {
    it('is enabled', () => {
      expect(GRID_WARS_CONFIG.overextensionEnabled).toBe(true);
    });

    it('isolated cluster discount is 30%', () => {
      expect(GRID_WARS_CONFIG.overextensionIsolatedDiscount).toBe(0.30);
    });

    it('edge cell discount is 15%', () => {
      expect(GRID_WARS_CONFIG.overextensionEdgeDiscount).toBe(0.15);
    });

    it('cluster threshold is 3 cells', () => {
      expect(GRID_WARS_CONFIG.overextensionClusterThreshold).toBe(3);
    });

    it('isolated discount is higher than edge discount', () => {
      expect(GRID_WARS_CONFIG.overextensionIsolatedDiscount)
        .toBeGreaterThan(GRID_WARS_CONFIG.overextensionEdgeDiscount);
    });
  });

  describe('Auto-Bounty System', () => {
    it('is enabled', () => {
      expect(GRID_WARS_CONFIG.bountyEnabled).toBe(true);
    });

    it('threshold is 20% of map (125 cells on 25x25)', () => {
      expect(GRID_WARS_CONFIG.bountyThresholdPercent).toBe(0.20);

      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      const threshold = Math.floor(totalCells * GRID_WARS_CONFIG.bountyThresholdPercent);
      expect(threshold).toBe(125);
    });

    it('bonus is 15 points', () => {
      expect(GRID_WARS_CONFIG.bountyBonusPoints).toBe(15);
    });

    it('check interval is 1 minute', () => {
      expect(GRID_WARS_CONFIG.bountyCheckIntervalMs).toBe(60000);
    });
  });

  describe('Economy Balance Tests', () => {
    it('boot bonus covers 1 neutral claim at 0% fill', () => {
      // Boot bonus is 45, claim cost is 30 at 0% fill (multiplier 1.0)
      expect(GRID_WARS_CONFIG.bootBonus).toBeGreaterThanOrEqual(GRID_WARS_CONFIG.claimCost);
    });

    it('4 gold stars can afford 1 claim with change', () => {
      // 4 gold stars = 16 pts, claim cost = 30
      // Not quite - but with contiguity bonus or 5 gold stars it works
      const goldStars = 4 * GRID_WARS_CONFIG.starPoints.gold;
      expect(goldStars).toBe(16);
      expect(goldStars).toBeLessThan(GRID_WARS_CONFIG.claimCost);
    });

    it('8 gold stars can afford 1 claim', () => {
      // 8 gold stars = 32 pts, claim cost = 30
      const goldStars = 8 * GRID_WARS_CONFIG.starPoints.gold;
      expect(goldStars).toBeGreaterThanOrEqual(GRID_WARS_CONFIG.claimCost);
    });

    it('30 tin stars exactly cover 1 claim', () => {
      // 30 tin stars = 30 pts, claim cost = 30
      const tinStars = 30 * GRID_WARS_CONFIG.starPoints.tin;
      expect(tinStars).toBe(GRID_WARS_CONFIG.claimCost);
    });

    it('bounty bonus is worth 5 tin stars', () => {
      expect(GRID_WARS_CONFIG.bountyBonusPoints).toBe(15);
      expect(15 / GRID_WARS_CONFIG.starPoints.tin).toBe(15);
    });
  });

  describe('Combat Discount Stacking', () => {
    it('max velocity discount is 40%', () => {
      expect(GRID_WARS_CONFIG.velocityTiers.BLAZING.discount).toBe(0.40);
    });

    it('max guerrilla discount is 50%', () => {
      expect(GRID_WARS_CONFIG.guerrillaTiers[0].discount).toBe(0.50);
    });

    it('max overextension discount is 30%', () => {
      expect(GRID_WARS_CONFIG.overextensionIsolatedDiscount).toBe(0.30);
    });

    it('theoretical max discount keeps cost above 0', () => {
      // With all discounts: cost * (1-0.4) * (1-0.5) * (1-0.3) = cost * 0.21
      // COLD takeover: 45 * 0.21 = 9.45, rounds up to 10
      const coldCost = GRID_WARS_CONFIG.takeoverCostCold;
      const minCost = Math.ceil(coldCost * 0.6 * 0.5 * 0.7);
      expect(minCost).toBeGreaterThan(0);
      expect(minCost).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Scarcity Phase Calculations', () => {
    it('at 25% fill, multiplier is 1.0 (EXPANSION)', () => {
      const phases = GRID_WARS_CONFIG.scarcityPhases;
      expect(0.25).toBeLessThan(phases.EXPANSION.maxFill);
    });

    it('at 50% fill, transition to TENSION begins', () => {
      const phases = GRID_WARS_CONFIG.scarcityPhases;
      expect(phases.EXPANSION.maxFill).toBe(0.50);
    });

    it('at 80% fill, SCARCITY phase begins', () => {
      const phases = GRID_WARS_CONFIG.scarcityPhases;
      expect(phases.TENSION.maxFill).toBe(0.80);
    });

    it('claim cost at 95% fill is ~66 (30 * 2.2)', () => {
      const baseCost = GRID_WARS_CONFIG.claimCost;
      const scarcityMultiplier = GRID_WARS_CONFIG.scarcityPhases.SCARCITY.multiplier;
      const scaledCost = Math.ceil(baseCost * scarcityMultiplier);
      expect(scaledCost).toBe(66);
    });

    it('claim cost at 100% fill is 90 (30 * 3.0)', () => {
      const baseCost = GRID_WARS_CONFIG.claimCost;
      const saturationMultiplier = GRID_WARS_CONFIG.scarcityPhases.SATURATION.multiplier;
      const scaledCost = Math.ceil(baseCost * saturationMultiplier);
      expect(scaledCost).toBe(90);
    });
  });
});
