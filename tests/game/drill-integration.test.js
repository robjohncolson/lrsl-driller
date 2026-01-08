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

  describe('Point Spending Scenarios', () => {
    const costs = GRID_WARS_CONFIG.structureCosts;

    it('can afford 1 claim after 1 tin star', () => {
      const points = GRID_WARS_CONFIG.starPoints.tin; // 1
      expect(points >= costs.claim).toBe(true);
    });

    it('can afford 1 wall after 1 bronze star', () => {
      const points = GRID_WARS_CONFIG.starPoints.bronze; // 2
      expect(points >= costs.wall).toBe(true);
    });

    it('can afford 1 tower after 1 gold star', () => {
      const points = GRID_WARS_CONFIG.starPoints.gold; // 4
      expect(points >= costs.tower).toBe(true);
    });

    it('can afford 1 farm after 1 gold star', () => {
      const points = GRID_WARS_CONFIG.starPoints.gold; // 4
      expect(points >= costs.farm).toBe(true);
    });

    it('cannot afford castle after single gold star', () => {
      const points = GRID_WARS_CONFIG.starPoints.gold; // 4
      expect(points >= costs.castle).toBe(false);
    });

    it('can afford castle after 3 gold stars', () => {
      const points = GRID_WARS_CONFIG.starPoints.gold * 3; // 12
      expect(points >= costs.castle).toBe(true);
    });

    it('realistic session can afford tower and 2 claims', () => {
      // After 2 gold stars (8 points), can afford tower (3) + 2 claims (2) = 5 points spent
      const points = GRID_WARS_CONFIG.starPoints.gold * 2; // 8
      const spending = costs.tower + costs.claim * 2; // 3 + 2 = 5
      expect(points >= spending).toBe(true);
      expect(points - spending).toBe(3); // 3 points remaining
    });
  });

  describe('Point Economy Balance', () => {
    it('gold star equals tower cost + claim', () => {
      expect(GRID_WARS_CONFIG.starPoints.gold).toBe(
        GRID_WARS_CONFIG.structureCosts.tower + GRID_WARS_CONFIG.structureCosts.claim
      );
    });

    it('silver star equals tower cost', () => {
      expect(GRID_WARS_CONFIG.starPoints.silver).toBe(
        GRID_WARS_CONFIG.structureCosts.tower
      );
    });

    it('bronze star equals wall cost', () => {
      expect(GRID_WARS_CONFIG.starPoints.bronze).toBe(
        GRID_WARS_CONFIG.structureCosts.wall
      );
    });

    it('tin star equals claim cost', () => {
      expect(GRID_WARS_CONFIG.starPoints.tin).toBe(
        GRID_WARS_CONFIG.structureCosts.claim
      );
    });
  });
});

describe('Structure Costs Validation', () => {
  const costs = GRID_WARS_CONFIG.structureCosts;

  it('claim is the cheapest action', () => {
    const values = Object.values(costs);
    expect(costs.claim).toBe(Math.min(...values));
  });

  it('castle is the most expensive action', () => {
    const values = Object.values(costs);
    expect(costs.castle).toBe(Math.max(...values));
  });

  it('costs are in ascending order: claim < wall < tower < farm < castle', () => {
    expect(costs.claim).toBeLessThan(costs.wall);
    expect(costs.wall).toBeLessThan(costs.tower);
    expect(costs.tower).toBeLessThan(costs.farm);
    expect(costs.farm).toBeLessThan(costs.castle);
  });

  it('all costs are positive integers', () => {
    for (const [name, cost] of Object.entries(costs)) {
      expect(cost).toBeGreaterThan(0);
      expect(Number.isInteger(cost)).toBe(true);
    }
  });
});
