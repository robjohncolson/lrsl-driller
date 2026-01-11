/**
 * Drill Integration Tests
 * Tests for the integration between drill stars and Grid Wars points
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';

describe('Drill Integration', () => {
  describe('Star to Points Conversion', () => {
    it('awards 4 points for gold star', () => {
      expect(GRID_WARS_CONFIG.starPoints.gold).toBe(4);
    });

    it('awards 3 points for silver star', () => {
      expect(GRID_WARS_CONFIG.starPoints.silver).toBe(3);
    });

    it('awards 2 points for bronze star', () => {
      expect(GRID_WARS_CONFIG.starPoints.bronze).toBe(2);
    });

    it('awards 1 point for tin star', () => {
      expect(GRID_WARS_CONFIG.starPoints.tin).toBe(1);
    });
  });

  describe('Point Accumulation', () => {
    it('accumulates points correctly across multiple gold stars', () => {
      const stars = ['gold', 'gold', 'gold'];
      const total = stars.reduce((sum, star) => sum + GRID_WARS_CONFIG.starPoints[star], 0);
      expect(total).toBe(12); // 4 + 4 + 4
    });

    it('accumulates points correctly across mixed star types', () => {
      const stars = ['gold', 'silver', 'bronze', 'tin'];
      const total = stars.reduce((sum, star) => sum + GRID_WARS_CONFIG.starPoints[star], 0);
      expect(total).toBe(10); // 4 + 3 + 2 + 1
    });

    it('accumulates points correctly from realistic session', () => {
      // Simulate a realistic drill session
      const sessionStars = [
        'gold',   // Perfect first try
        'silver', // One hint used
        'gold',   // Perfect
        'bronze', // Two hints
        'gold',   // Perfect
        'tin',    // Three hints
        'silver', // One hint
      ];
      const total = sessionStars.reduce((sum, star) => sum + GRID_WARS_CONFIG.starPoints[star], 0);
      expect(total).toBe(21); // 4+3+4+2+4+1+3
    });
  });

  // v2.1.3: Updated for v1.6 economy (40 point claim cost for 8x8 map scarcity)
  describe('Claim Cost Economy', () => {
    const claimCost = GRID_WARS_CONFIG.claimCost;

    it('claim costs 40 points (v1.6 economy)', () => {
      expect(claimCost).toBe(40);
    });

    it('cannot afford claim after single gold star (4 pts)', () => {
      const points = GRID_WARS_CONFIG.starPoints.gold; // 4
      expect(points >= claimCost).toBe(false);
    });

    it('cannot afford claim after 5 gold stars (20 pts)', () => {
      const points = GRID_WARS_CONFIG.starPoints.gold * 5; // 20
      expect(points >= claimCost).toBe(false);
    });

    it('can afford claim after 10 gold stars (40 pts)', () => {
      const points = GRID_WARS_CONFIG.starPoints.gold * 10; // 40
      expect(points >= claimCost).toBe(true);
    });

    it('can afford claim after 14 silver stars (42 pts)', () => {
      const points = GRID_WARS_CONFIG.starPoints.silver * 14; // 42
      expect(points >= claimCost).toBe(true);
    });

    it('can afford claim after 20 bronze stars (40 pts)', () => {
      const points = GRID_WARS_CONFIG.starPoints.bronze * 20; // 40
      expect(points >= claimCost).toBe(true);
    });

    it('can afford claim after 40 tin stars (40 pts)', () => {
      const points = GRID_WARS_CONFIG.starPoints.tin * 40; // 40
      expect(points >= claimCost).toBe(true);
    });

    it('realistic session with 8 gold + 4 silver can afford 1 claim', () => {
      // 8 gold (32) + 4 silver (12) = 44 points, claim costs 40, leaves 4
      const points = GRID_WARS_CONFIG.starPoints.gold * 8 + GRID_WARS_CONFIG.starPoints.silver * 4;
      expect(points).toBe(44);
      expect(points >= claimCost).toBe(true);
      expect(points - claimCost).toBe(4); // 4 points remaining
    });

    it('realistic session with mixed stars can afford claim', () => {
      // 6 gold (24) + 4 silver (12) + 3 bronze (6) = 42 points
      const points =
        GRID_WARS_CONFIG.starPoints.gold * 6 +
        GRID_WARS_CONFIG.starPoints.silver * 4 +
        GRID_WARS_CONFIG.starPoints.bronze * 3;
      expect(points).toBe(42);
      expect(points >= claimCost).toBe(true);
    });
  });

  // v2.1.3: Updated for v1.6 economy (40 point claim cost)
  describe('Point Economy Balance', () => {
    it('11 gold stars can buy 1 claim with change', () => {
      const goldPoints = GRID_WARS_CONFIG.starPoints.gold * 11; // 44
      const claimCost = GRID_WARS_CONFIG.claimCost; // 40
      expect(goldPoints - claimCost).toBe(4);
    });

    it('40 tin stars exactly pay for 1 claim', () => {
      const tinPoints = GRID_WARS_CONFIG.starPoints.tin * 40; // 40
      const claimCost = GRID_WARS_CONFIG.claimCost; // 40
      expect(tinPoints - claimCost).toBe(0);
    });

    it('all star types exist', () => {
      expect(GRID_WARS_CONFIG.starPoints.gold).toBeDefined();
      expect(GRID_WARS_CONFIG.starPoints.silver).toBeDefined();
      expect(GRID_WARS_CONFIG.starPoints.bronze).toBeDefined();
      expect(GRID_WARS_CONFIG.starPoints.tin).toBeDefined();
    });

    it('star points are in correct order: gold > silver > bronze > tin', () => {
      expect(GRID_WARS_CONFIG.starPoints.gold).toBeGreaterThan(GRID_WARS_CONFIG.starPoints.silver);
      expect(GRID_WARS_CONFIG.starPoints.silver).toBeGreaterThan(GRID_WARS_CONFIG.starPoints.bronze);
      expect(GRID_WARS_CONFIG.starPoints.bronze).toBeGreaterThan(GRID_WARS_CONFIG.starPoints.tin);
    });
  });
});

describe('Config Validation', () => {
  it('claim cost is positive integer', () => {
    expect(GRID_WARS_CONFIG.claimCost).toBeGreaterThan(0);
    expect(Number.isInteger(GRID_WARS_CONFIG.claimCost)).toBe(true);
  });

  it('all star points are positive integers', () => {
    for (const [name, points] of Object.entries(GRID_WARS_CONFIG.starPoints)) {
      expect(points).toBeGreaterThan(0);
      expect(Number.isInteger(points)).toBe(true);
    }
  });

  it('map size is defined', () => {
    expect(GRID_WARS_CONFIG.mapSize).toBe(8);  // v1.6: 8x8 map
  });

  it('no structure costs exist (simplified game)', () => {
    expect(GRID_WARS_CONFIG.structureCosts).toBeUndefined();
  });
});
