/**
 * Grid Wars v1.6 Tests
 * Tests for "The Bitcoin Refactor" - radical simplification:
 * - 8x8 map (64 cells) for extreme scarcity
 * - Single leaderboard (lifetime_earned only)
 * - No resource nodes
 * - Rebalanced economy for smaller map
 * - Stale presence cleanup (5 minute timeout)
 * - Fractal subdivision schema groundwork
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GRID_WARS_CONFIG } from '../../shared/gridwars.config.js';
import { GridWarsState, resetGridWarsState } from '../../platform/game/grid-state.js';

describe('Grid Wars v1.6 Features', () => {

  describe('Map Size (8x8 extreme scarcity)', () => {
    it('map size is 8 (was 25)', () => {
      expect(GRID_WARS_CONFIG.mapSize).toBe(8);
    });

    it('total cells is 64', () => {
      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      expect(totalCells).toBe(64);
    });

    it('fractal future support config exists', () => {
      expect(GRID_WARS_CONFIG.maxLevel).toBe(0);
      expect(GRID_WARS_CONFIG.subdivisionSize).toBe(8);
    });
  });

  describe('Economy Rebalancing (v1.6)', () => {
    it('claim cost is 40 (was 30 in v1.5)', () => {
      expect(GRID_WARS_CONFIG.claimCost).toBe(40);
    });

    it('takeover costs are scaled (cold: 60, warm: 80, active: 100)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBe(60);
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBe(80);
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(100);
    });

    it('boot bonus is 30 (was 45 in v1.5)', () => {
      expect(GRID_WARS_CONFIG.bootBonus).toBe(30);
    });

    it('surge cost is 20 (was 15 in v1.5)', () => {
      expect(GRID_WARS_CONFIG.surgeCost).toBe(20);
    });

    it('underdog minimum cost is 20 (was 15 in v1.5)', () => {
      expect(GRID_WARS_CONFIG.underdogMinCost).toBe(20);
    });

    it('star points remain 4/3/2/1', () => {
      expect(GRID_WARS_CONFIG.starPoints.gold).toBe(4);
      expect(GRID_WARS_CONFIG.starPoints.silver).toBe(3);
      expect(GRID_WARS_CONFIG.starPoints.bronze).toBe(2);
      expect(GRID_WARS_CONFIG.starPoints.tin).toBe(1);
    });
  });

  describe('Resource Nodes (disabled in v1.6)', () => {
    it('node positions array is empty', () => {
      expect(GRID_WARS_CONFIG.nodePositions).toEqual([]);
    });

    it('nodes are explicitly disabled', () => {
      expect(GRID_WARS_CONFIG.nodesEnabled).toBe(false);
    });
  });

  describe('Class Goal (scaled for 64 cells)', () => {
    it('class goal target is 50 (was 200)', () => {
      expect(GRID_WARS_CONFIG.classGoalTarget).toBe(50);
    });

    it('class goal is 78% of 64 cells', () => {
      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      const targetPercent = GRID_WARS_CONFIG.classGoalTarget / totalCells;
      expect(targetPercent).toBeCloseTo(0.78, 1);
    });
  });

  describe('Diminishing Returns (steeper curve for 8x8)', () => {
    it('threshold is 8 cells (was 75)', () => {
      expect(GRID_WARS_CONFIG.diminishingReturnsThreshold).toBe(8);
    });

    it('factor is 0.05 (was 0.004)', () => {
      expect(GRID_WARS_CONFIG.diminishingReturnsFactor).toBe(0.05);
    });

    it('minimum multiplier is 0.5', () => {
      expect(GRID_WARS_CONFIG.diminishingReturnsMinMultiplier).toBe(0.5);
    });

    it('threshold is 12.5% of 64 cells', () => {
      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      const thresholdPercent = GRID_WARS_CONFIG.diminishingReturnsThreshold / totalCells;
      expect(thresholdPercent).toBeCloseTo(0.125, 2);
    });
  });

  describe('Scarcity Phases (faster curve for 8x8)', () => {
    it('EXPANSION phase ends at 30% fill', () => {
      expect(GRID_WARS_CONFIG.scarcityPhases.EXPANSION.maxFill).toBe(0.30);
    });

    it('TENSION phase ends at 60% fill', () => {
      expect(GRID_WARS_CONFIG.scarcityPhases.TENSION.maxFill).toBe(0.60);
    });

    it('SCARCITY phase ends at 85% fill', () => {
      expect(GRID_WARS_CONFIG.scarcityPhases.SCARCITY.maxFill).toBe(0.85);
    });

    it('SATURATION phase ends at 100% fill', () => {
      expect(GRID_WARS_CONFIG.scarcityPhases.SATURATION.maxFill).toBe(1.00);
    });

    it('multipliers are 1.0, 1.5, 2.0, 3.0', () => {
      expect(GRID_WARS_CONFIG.scarcityPhases.EXPANSION.multiplier).toBe(1.0);
      expect(GRID_WARS_CONFIG.scarcityPhases.TENSION.multiplier).toBe(1.5);
      expect(GRID_WARS_CONFIG.scarcityPhases.SCARCITY.multiplier).toBe(2.0);
      expect(GRID_WARS_CONFIG.scarcityPhases.SATURATION.multiplier).toBe(3.0);
    });

    it('claim cost at 100% fill is 120 (40 * 3.0)', () => {
      const baseCost = GRID_WARS_CONFIG.claimCost;
      const saturationMultiplier = GRID_WARS_CONFIG.scarcityPhases.SATURATION.multiplier;
      const scaledCost = Math.ceil(baseCost * saturationMultiplier);
      expect(scaledCost).toBe(120);
    });
  });

  describe('Guerrilla Warfare (scaled for 64 cells)', () => {
    it('first tier: 2 cells vs 10 = 50% discount', () => {
      const tier = GRID_WARS_CONFIG.guerrillaTiers[0];
      expect(tier.attackerMax).toBe(2);
      expect(tier.defenderMin).toBe(10);
      expect(tier.discount).toBe(0.50);
    });

    it('second tier: 4 cells vs 15 = 40% discount', () => {
      const tier = GRID_WARS_CONFIG.guerrillaTiers[1];
      expect(tier.attackerMax).toBe(4);
      expect(tier.defenderMin).toBe(15);
      expect(tier.discount).toBe(0.40);
    });

    it('third tier: 6 cells vs 20 = 30% discount', () => {
      const tier = GRID_WARS_CONFIG.guerrillaTiers[2];
      expect(tier.attackerMax).toBe(6);
      expect(tier.defenderMin).toBe(20);
      expect(tier.discount).toBe(0.30);
    });
  });

  describe('Auto-Bounty System (scaled for 64 cells)', () => {
    it('threshold is 20% of map (12 cells on 8x8)', () => {
      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      const threshold = Math.floor(totalCells * GRID_WARS_CONFIG.bountyThresholdPercent);
      expect(threshold).toBe(12);
    });

    it('bonus is 10 points (was 15 in v1.5)', () => {
      expect(GRID_WARS_CONFIG.bountyBonusPoints).toBe(10);
    });
  });

  describe('Presence Tracking (v1.6)', () => {
    it('heartbeat interval is 30 seconds', () => {
      expect(GRID_WARS_CONFIG.presenceHeartbeatMs).toBe(30000);
    });

    it('stale threshold is 5 minutes (300000ms)', () => {
      expect(GRID_WARS_CONFIG.presenceStaleThresholdMs).toBe(300000);
    });

    it('prune interval is 1 minute (60000ms)', () => {
      expect(GRID_WARS_CONFIG.presencePruneIntervalMs).toBe(60000);
    });
  });

  describe('Auto-Surge (disabled for 8x8)', () => {
    it('auto-surge is disabled', () => {
      expect(GRID_WARS_CONFIG.autoSurgeEnabled).toBe(false);
    });
  });

  describe('Economy Balance Tests (v1.6)', () => {
    it('boot bonus does NOT cover 1 neutral claim (intentional)', () => {
      // v1.6: Boot bonus is 30, claim cost is 40 - students must earn first
      expect(GRID_WARS_CONFIG.bootBonus).toBeLessThan(GRID_WARS_CONFIG.claimCost);
    });

    it('10 gold stars can afford 1 claim', () => {
      // 10 gold stars = 40 pts, claim cost = 40
      const goldStars = 10 * GRID_WARS_CONFIG.starPoints.gold;
      expect(goldStars).toBeGreaterThanOrEqual(GRID_WARS_CONFIG.claimCost);
    });

    it('40 tin stars exactly cover 1 claim', () => {
      // 40 tin stars = 40 pts, claim cost = 40
      const tinStars = 40 * GRID_WARS_CONFIG.starPoints.tin;
      expect(tinStars).toBe(GRID_WARS_CONFIG.claimCost);
    });

    it('bounty bonus is worth 10 tin stars', () => {
      expect(GRID_WARS_CONFIG.bountyBonusPoints).toBe(10);
      expect(10 / GRID_WARS_CONFIG.starPoints.tin).toBe(10);
    });
  });

  describe('GridWarsState - Leaderboard Update Handler', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      state = new GridWarsState({
        serverUrl: 'http://test.example.com',
        username: 'test_player'
      });
      state.gameId = 'test-game-id';
    });

    it('initializes onLeaderboardUpdate callback as null', () => {
      expect(state.onLeaderboardUpdate).toBeNull();
    });

    it('accepts onLeaderboardUpdate in constructor options', () => {
      resetGridWarsState();
      const callback = vi.fn();
      const stateWithCallback = new GridWarsState({
        serverUrl: 'http://test.example.com',
        onLeaderboardUpdate: callback
      });
      expect(stateWithCallback.onLeaderboardUpdate).toBe(callback);
    });

    it('handles leaderboard_update WebSocket message', () => {
      const callback = vi.fn();
      state.onLeaderboardUpdate = callback;

      const mockLeaderboard = [
        { username: 'player1', lifetime_earned: 100, territories_count: 5 },
        { username: 'player2', lifetime_earned: 80, territories_count: 3 }
      ];

      state.handleWebSocketMessage({
        type: 'leaderboard_update',
        gameId: 'test-game-id',
        leaderboard: mockLeaderboard
      });

      expect(callback).toHaveBeenCalledWith(mockLeaderboard);
    });

    it('ignores leaderboard_update for different game', () => {
      const callback = vi.fn();
      state.onLeaderboardUpdate = callback;

      state.handleWebSocketMessage({
        type: 'leaderboard_update',
        gameId: 'different-game-id',
        leaderboard: []
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not crash if onLeaderboardUpdate is null', () => {
      state.onLeaderboardUpdate = null;

      expect(() => {
        state.handleWebSocketMessage({
          type: 'leaderboard_update',
          gameId: 'test-game-id',
          leaderboard: [{ username: 'player1', lifetime_earned: 50 }]
        });
      }).not.toThrow();
    });

    it('passes empty leaderboard array correctly', () => {
      const callback = vi.fn();
      state.onLeaderboardUpdate = callback;

      state.handleWebSocketMessage({
        type: 'leaderboard_update',
        gameId: 'test-game-id',
        leaderboard: []
      });

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe('Diminishing Returns Calculation (v1.6 formula)', () => {
    // Formula: multiplier = max(0.5, 1 - (excess * 0.05))
    // Where excess = territories - threshold (8)

    it('no penalty at threshold (8 cells)', () => {
      const territories = 8;
      const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold;
      const factor = GRID_WARS_CONFIG.diminishingReturnsFactor;
      const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier;

      const excess = Math.max(0, territories - threshold);
      const multiplier = Math.max(minMultiplier, 1 - (excess * factor));

      expect(multiplier).toBe(1.0);
    });

    it('80% earning rate at 12 cells (4 excess)', () => {
      const territories = 12;
      const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold;
      const factor = GRID_WARS_CONFIG.diminishingReturnsFactor;
      const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier;

      const excess = Math.max(0, territories - threshold);
      const multiplier = Math.max(minMultiplier, 1 - (excess * factor));

      expect(multiplier).toBe(0.8);
    });

    it('60% earning rate at 16 cells (8 excess)', () => {
      const territories = 16;
      const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold;
      const factor = GRID_WARS_CONFIG.diminishingReturnsFactor;
      const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier;

      const excess = Math.max(0, territories - threshold);
      const multiplier = Math.max(minMultiplier, 1 - (excess * factor));

      expect(multiplier).toBe(0.6);
    });

    it('floor at 50% for 18+ cells', () => {
      const territories = 18;
      const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold;
      const factor = GRID_WARS_CONFIG.diminishingReturnsFactor;
      const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier;

      const excess = Math.max(0, territories - threshold);
      const multiplier = Math.max(minMultiplier, 1 - (excess * factor));

      expect(multiplier).toBe(0.5);
    });

    it('floor still applies at maximum cells (64)', () => {
      const territories = 64; // Maximum on 8x8 map
      const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold;
      const factor = GRID_WARS_CONFIG.diminishingReturnsFactor;
      const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier;

      const excess = Math.max(0, territories - threshold);
      const multiplier = Math.max(minMultiplier, 1 - (excess * factor));

      // Without floor: 1 - (56 * 0.05) = 1 - 2.8 = -1.8
      // With floor: 0.5
      expect(multiplier).toBe(0.5);
    });
  });

  describe('Scarcity Phase Determination', () => {
    function getScarcityPhase(fillPercent) {
      const phases = GRID_WARS_CONFIG.scarcityPhases;
      if (fillPercent <= phases.EXPANSION.maxFill) return 'EXPANSION';
      if (fillPercent <= phases.TENSION.maxFill) return 'TENSION';
      if (fillPercent <= phases.SCARCITY.maxFill) return 'SCARCITY';
      return 'SATURATION';
    }

    function getScarcityMultiplier(fillPercent) {
      const phases = GRID_WARS_CONFIG.scarcityPhases;
      if (fillPercent <= phases.EXPANSION.maxFill) return phases.EXPANSION.multiplier;
      if (fillPercent <= phases.TENSION.maxFill) return phases.TENSION.multiplier;
      if (fillPercent <= phases.SCARCITY.maxFill) return phases.SCARCITY.multiplier;
      return phases.SATURATION.multiplier;
    }

    it('0% fill = EXPANSION (1.0x)', () => {
      expect(getScarcityPhase(0)).toBe('EXPANSION');
      expect(getScarcityMultiplier(0)).toBe(1.0);
    });

    it('30% fill = EXPANSION (1.0x)', () => {
      expect(getScarcityPhase(0.30)).toBe('EXPANSION');
      expect(getScarcityMultiplier(0.30)).toBe(1.0);
    });

    it('31% fill = TENSION (1.5x)', () => {
      expect(getScarcityPhase(0.31)).toBe('TENSION');
      expect(getScarcityMultiplier(0.31)).toBe(1.5);
    });

    it('60% fill = TENSION (1.5x)', () => {
      expect(getScarcityPhase(0.60)).toBe('TENSION');
      expect(getScarcityMultiplier(0.60)).toBe(1.5);
    });

    it('61% fill = SCARCITY (2.0x)', () => {
      expect(getScarcityPhase(0.61)).toBe('SCARCITY');
      expect(getScarcityMultiplier(0.61)).toBe(2.0);
    });

    it('85% fill = SCARCITY (2.0x)', () => {
      expect(getScarcityPhase(0.85)).toBe('SCARCITY');
      expect(getScarcityMultiplier(0.85)).toBe(2.0);
    });

    it('86% fill = SATURATION (3.0x)', () => {
      expect(getScarcityPhase(0.86)).toBe('SATURATION');
      expect(getScarcityMultiplier(0.86)).toBe(3.0);
    });

    it('100% fill = SATURATION (3.0x)', () => {
      expect(getScarcityPhase(1.0)).toBe('SATURATION');
      expect(getScarcityMultiplier(1.0)).toBe(3.0);
    });

    it('cost at each phase boundary (base cost 40)', () => {
      const baseCost = GRID_WARS_CONFIG.claimCost;

      // EXPANSION: 40 * 1.0 = 40
      expect(Math.ceil(baseCost * getScarcityMultiplier(0.30))).toBe(40);

      // TENSION: 40 * 1.5 = 60
      expect(Math.ceil(baseCost * getScarcityMultiplier(0.60))).toBe(60);

      // SCARCITY: 40 * 2.0 = 80
      expect(Math.ceil(baseCost * getScarcityMultiplier(0.85))).toBe(80);

      // SATURATION: 40 * 3.0 = 120
      expect(Math.ceil(baseCost * getScarcityMultiplier(1.0))).toBe(120);
    });
  });

  describe('Contiguity Bonus (works on 8x8 map)', () => {
    // Formula: bonus = min(maxContiguityBonus, floor(clusterSize / 5))

    function calculateContiguityBonus(clusterSize) {
      return Math.min(
        GRID_WARS_CONFIG.maxContiguityBonus,
        Math.floor(clusterSize / 5)
      );
    }

    it('max contiguity bonus is 5', () => {
      expect(GRID_WARS_CONFIG.maxContiguityBonus).toBe(5);
    });

    it('cluster of 1-4 cells = +0 bonus', () => {
      expect(calculateContiguityBonus(1)).toBe(0);
      expect(calculateContiguityBonus(4)).toBe(0);
    });

    it('cluster of 5-9 cells = +1 bonus', () => {
      expect(calculateContiguityBonus(5)).toBe(1);
      expect(calculateContiguityBonus(9)).toBe(1);
    });

    it('cluster of 10-14 cells = +2 bonus', () => {
      expect(calculateContiguityBonus(10)).toBe(2);
      expect(calculateContiguityBonus(14)).toBe(2);
    });

    it('cluster of 15-19 cells = +3 bonus', () => {
      expect(calculateContiguityBonus(15)).toBe(3);
      expect(calculateContiguityBonus(19)).toBe(3);
    });

    it('cluster of 20-24 cells = +4 bonus', () => {
      expect(calculateContiguityBonus(20)).toBe(4);
      expect(calculateContiguityBonus(24)).toBe(4);
    });

    it('cluster of 25+ cells = +5 bonus (max)', () => {
      expect(calculateContiguityBonus(25)).toBe(5);
      expect(calculateContiguityBonus(64)).toBe(5); // Even if someone owns entire map
    });

    it('maximum achievable cluster on 8x8 is 64 cells', () => {
      const maxCluster = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      expect(maxCluster).toBe(64);
      expect(calculateContiguityBonus(maxCluster)).toBe(5);
    });
  });

  describe('Guerrilla Warfare Discount Calculation', () => {
    function getGuerrillaDiscount(attackerCells, defenderCells) {
      for (const tier of GRID_WARS_CONFIG.guerrillaTiers) {
        if (attackerCells <= tier.attackerMax && defenderCells >= tier.defenderMin) {
          return tier.discount;
        }
      }
      return 0;
    }

    it('attacker with 2 cells vs defender with 10+ = 50% discount', () => {
      expect(getGuerrillaDiscount(2, 10)).toBe(0.50);
      expect(getGuerrillaDiscount(1, 15)).toBe(0.50);
    });

    it('attacker with 4 cells vs defender with 15+ = 40% discount', () => {
      expect(getGuerrillaDiscount(4, 15)).toBe(0.40);
      // 3 cells > tier1 max (2), so checks tier2: 3 <= 4 and 20 >= 15 = tier 2
      expect(getGuerrillaDiscount(3, 20)).toBe(0.40);
    });

    it('attacker with 6 cells vs defender with 20+ = 30% discount', () => {
      expect(getGuerrillaDiscount(6, 20)).toBe(0.30);
      // 5 cells > tier1 max (2) and > tier2 max (4), so checks tier3: 5 <= 6 and 25 >= 20 = tier 3
      expect(getGuerrillaDiscount(5, 25)).toBe(0.30);
    });

    it('attacker with 7+ cells gets no discount', () => {
      expect(getGuerrillaDiscount(7, 20)).toBe(0);
      expect(getGuerrillaDiscount(10, 30)).toBe(0);
    });

    it('defender with fewer than 10 cells gives no discount', () => {
      expect(getGuerrillaDiscount(1, 9)).toBe(0);
      expect(getGuerrillaDiscount(2, 5)).toBe(0);
    });

    it('maximum discount is 50% (tier 1)', () => {
      const maxDiscount = Math.max(...GRID_WARS_CONFIG.guerrillaTiers.map(t => t.discount));
      expect(maxDiscount).toBe(0.50);
    });
  });

  describe('Bounty Target Calculation', () => {
    function isBountyTarget(territoriesCount) {
      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      const threshold = Math.floor(totalCells * GRID_WARS_CONFIG.bountyThresholdPercent);
      return territoriesCount >= threshold;
    }

    it('bounty threshold is 20% of map', () => {
      expect(GRID_WARS_CONFIG.bountyThresholdPercent).toBe(0.20);
    });

    it('on 8x8 map, threshold is 12 cells', () => {
      const totalCells = 64;
      const threshold = Math.floor(totalCells * 0.20);
      expect(threshold).toBe(12);
    });

    it('player with 11 cells is NOT a bounty target', () => {
      expect(isBountyTarget(11)).toBe(false);
    });

    it('player with 12 cells IS a bounty target', () => {
      expect(isBountyTarget(12)).toBe(true);
    });

    it('player with 20 cells IS a bounty target', () => {
      expect(isBountyTarget(20)).toBe(true);
    });

    it('bounty bonus is 10 points', () => {
      expect(GRID_WARS_CONFIG.bountyBonusPoints).toBe(10);
    });
  });

  describe('Single Leaderboard Data Structure', () => {
    it('leaderboard entries should have lifetime_earned field', () => {
      const mockLeaderboardEntry = {
        username: 'player1',
        lifetime_earned: 150,
        territories_count: 5,
        action_points: 50,
        real_name: 'John Doe'
      };

      expect(mockLeaderboardEntry).toHaveProperty('lifetime_earned');
      expect(mockLeaderboardEntry.lifetime_earned).toBe(150);
    });

    it('leaderboard should be sorted by lifetime_earned descending', () => {
      const mockLeaderboard = [
        { username: 'player1', lifetime_earned: 100 },
        { username: 'player2', lifetime_earned: 200 },
        { username: 'player3', lifetime_earned: 150 }
      ];

      const sorted = [...mockLeaderboard].sort((a, b) => b.lifetime_earned - a.lifetime_earned);

      expect(sorted[0].username).toBe('player2');
      expect(sorted[1].username).toBe('player3');
      expect(sorted[2].username).toBe('player1');
    });

    it('leaderboard entries include territories_count as secondary info', () => {
      const mockLeaderboardEntry = {
        username: 'player1',
        lifetime_earned: 150,
        territories_count: 5
      };

      expect(mockLeaderboardEntry).toHaveProperty('territories_count');
    });
  });

  describe('Takeover Cost Tiers (activity-based)', () => {
    it('cold tier is cheapest (60 pts)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBe(60);
    });

    it('warm tier is middle (80 pts)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBe(80);
    });

    it('active tier is most expensive (100 pts)', () => {
      expect(GRID_WARS_CONFIG.takeoverCostActive).toBe(100);
    });

    it('costs are in ascending order', () => {
      expect(GRID_WARS_CONFIG.takeoverCostCold).toBeLessThan(GRID_WARS_CONFIG.takeoverCostWarm);
      expect(GRID_WARS_CONFIG.takeoverCostWarm).toBeLessThan(GRID_WARS_CONFIG.takeoverCostActive);
    });

    it('activity windows match tier costs', () => {
      // <3min = ACTIVE (highest cost)
      expect(GRID_WARS_CONFIG.activeWindowSeconds).toBe(180);
      // 3-8min = WARM (medium cost)
      expect(GRID_WARS_CONFIG.warmWindowSeconds).toBe(480);
      // >8min = COLD (lowest cost)
    });
  });

  describe('Map Coordinate Bounds (8x8)', () => {
    it('valid coordinates are 0-7', () => {
      const mapSize = GRID_WARS_CONFIG.mapSize;
      expect(mapSize).toBe(8);

      // Valid coordinates
      for (let i = 0; i < mapSize; i++) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(mapSize);
      }
    });

    it('coordinate 8 is out of bounds', () => {
      const mapSize = GRID_WARS_CONFIG.mapSize;
      expect(8).toBeGreaterThanOrEqual(mapSize);
    });

    it('center of map is (4, 4) for spawning', () => {
      const center = Math.floor(GRID_WARS_CONFIG.mapSize / 2);
      expect(center).toBe(4);
    });
  });
});
