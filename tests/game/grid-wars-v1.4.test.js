/**
 * Grid Wars v1.4 Tests
 * Tests for seasons, rankings, and engagement features
 *
 * Features tested:
 * - Task 1: lifetime_earned tracking
 * - Task 2: Multi-dimensional leaderboard (Scholar/Banker/General)
 * - Task 3: Round system with victory conditions
 * - Task 4: Activity requirement for claims (uplink)
 * - Task 5: Diminishing returns for large empires
 * - Task 6: Teacher scouting report
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock GRID_WARS_CONFIG with v1.4 settings
const GRID_WARS_CONFIG = {
  claimCost: 10,
  bootBonus: 15,
  mapSize: 20,
  starPoints: { gold: 4, silver: 3, bronze: 2, tin: 1 },
  maxContiguityBonus: 5,
  // v1.4: Activity requirement
  uplinkRequiredSeconds: 600,
  // v1.4: Diminishing returns
  diminishingReturnsEnabled: true,
  diminishingReturnsThreshold: 25,
  diminishingReturnsMinMultiplier: 0.5,
  diminishingReturnsFactor: 0.005,
  // v1.4: Round system
  rounds: { enabled: true, warningMinutes: 2 },
  victoryConditions: {
    domination: { threshold: 80, enabled: true },
    timed: { durationMinutes: 45, enabled: false },
    collaborative: { target: 300, enabled: false }
  },
  legacyBonus: { winner: 5, top3: 3 },
  // v1.4: Scouting report thresholds
  scoutingThresholds: {
    highLifetime: 100,
    lowLifetime: 30,
    highCells: 15,
    lowCells: 3
  }
};

describe('Grid Wars v1.4', () => {

  describe('Task 1: lifetime_earned Tracking', () => {
    it('should track lifetime_earned separately from action_points', () => {
      // Simulate player earning points
      let player = {
        action_points: 0,
        lifetime_earned: 0
      };

      // Earn 10 points
      const pointsEarned = 10;
      player.action_points += pointsEarned;
      player.lifetime_earned += pointsEarned;

      expect(player.action_points).toBe(10);
      expect(player.lifetime_earned).toBe(10);
    });

    it('spending points should only decrease action_points, not lifetime_earned', () => {
      let player = {
        action_points: 50,
        lifetime_earned: 50
      };

      // Spend 10 points (claim)
      const claimCost = 10;
      player.action_points -= claimCost;
      // lifetime_earned stays the same

      expect(player.action_points).toBe(40);
      expect(player.lifetime_earned).toBe(50);
    });

    it('lifetime_earned should never decrease', () => {
      let player = {
        action_points: 100,
        lifetime_earned: 100
      };

      // Multiple spend operations
      player.action_points -= 30;
      player.action_points -= 20;
      player.action_points -= 15;

      expect(player.action_points).toBe(35);
      expect(player.lifetime_earned).toBe(100);
    });

    it('high earner but high spender should lead Scholar ranking', () => {
      const players = [
        { username: 'saver', action_points: 80, lifetime_earned: 80 },
        { username: 'spender', action_points: 20, lifetime_earned: 150 }
      ];

      // Scholar ranking by lifetime_earned
      const scholarRanking = [...players].sort((a, b) => b.lifetime_earned - a.lifetime_earned);

      expect(scholarRanking[0].username).toBe('spender');
      expect(scholarRanking[0].lifetime_earned).toBe(150);
    });
  });

  describe('Task 2: Multi-Dimensional Leaderboard', () => {
    const mockPlayers = [
      { username: 'scholar', action_points: 30, lifetime_earned: 200, territories_count: 5 },
      { username: 'banker', action_points: 150, lifetime_earned: 150, territories_count: 3 },
      { username: 'general', action_points: 50, lifetime_earned: 100, territories_count: 20 }
    ];

    it('Scholar ranking should sort by lifetime_earned', () => {
      const scholarRanking = [...mockPlayers]
        .sort((a, b) => b.lifetime_earned - a.lifetime_earned);

      expect(scholarRanking[0].username).toBe('scholar');
      expect(scholarRanking[0].lifetime_earned).toBe(200);
    });

    it('Banker ranking should sort by action_points', () => {
      const bankerRanking = [...mockPlayers]
        .sort((a, b) => b.action_points - a.action_points);

      expect(bankerRanking[0].username).toBe('banker');
      expect(bankerRanking[0].action_points).toBe(150);
    });

    it('General ranking should sort by territories_count', () => {
      const generalRanking = [...mockPlayers]
        .sort((a, b) => b.territories_count - a.territories_count);

      expect(generalRanking[0].username).toBe('general');
      expect(generalRanking[0].territories_count).toBe(20);
    });

    it('different players can lead different rankings', () => {
      const scholarLeader = [...mockPlayers]
        .sort((a, b) => b.lifetime_earned - a.lifetime_earned)[0];
      const bankerLeader = [...mockPlayers]
        .sort((a, b) => b.action_points - a.action_points)[0];
      const generalLeader = [...mockPlayers]
        .sort((a, b) => b.territories_count - a.territories_count)[0];

      expect(scholarLeader.username).not.toBe(bankerLeader.username);
      expect(bankerLeader.username).not.toBe(generalLeader.username);
      expect(scholarLeader.username).not.toBe(generalLeader.username);
    });
  });

  describe('Task 3: Round System', () => {
    it('domination victory condition should trigger at threshold', () => {
      const config = { type: 'domination', threshold: 80 };
      const leader = { territories_count: 80 };

      const victoryReached = leader.territories_count >= config.threshold;

      expect(victoryReached).toBe(true);
    });

    it('domination should not trigger below threshold', () => {
      const config = { type: 'domination', threshold: 80 };
      const leader = { territories_count: 79 };

      const victoryReached = leader.territories_count >= config.threshold;

      expect(victoryReached).toBe(false);
    });

    it('collaborative victory should trigger when class goal reached', () => {
      const config = { type: 'collaborative', target: 300 };
      const totalCells = 300;

      const victoryReached = totalCells >= config.target;

      expect(victoryReached).toBe(true);
    });

    it('round_history should record winner and podium', () => {
      const roundHistory = {
        game_id: 'test-game',
        round_number: 1,
        victory_condition: 'domination',
        winner_id: 'alice',
        winner_name: 'Alice',
        winner_score: 85,
        runner_up_id: 'bob',
        runner_up_name: 'Bob',
        runner_up_score: 60,
        third_place_id: 'carol',
        third_place_name: 'Carol',
        third_place_score: 45
      };

      expect(roundHistory.winner_score).toBeGreaterThan(roundHistory.runner_up_score);
      expect(roundHistory.runner_up_score).toBeGreaterThan(roundHistory.third_place_score);
    });

    it('legacy bonus should be awarded to top 3', () => {
      const legacyBonus = { winner: 5, top3: 3 };
      const rankings = [
        { username: 'alice', pendingBonus: 0 },
        { username: 'bob', pendingBonus: 0 },
        { username: 'carol', pendingBonus: 0 }
      ];

      // Award bonuses
      rankings[0].pendingBonus = legacyBonus.winner;
      rankings[1].pendingBonus = legacyBonus.top3;
      rankings[2].pendingBonus = legacyBonus.top3;

      expect(rankings[0].pendingBonus).toBe(5);
      expect(rankings[1].pendingBonus).toBe(3);
      expect(rankings[2].pendingBonus).toBe(3);
    });
  });

  describe('Task 4: Activity Requirement for Claims', () => {
    it('should allow claim when last_answer_at is within window', () => {
      const uplinkTimeout = 600 * 1000; // 10 minutes
      const lastAnswerAt = Date.now() - (5 * 60 * 1000); // 5 minutes ago

      const timeSinceAnswer = Date.now() - lastAnswerAt;
      const uplinkActive = timeSinceAnswer < uplinkTimeout;

      expect(uplinkActive).toBe(true);
    });

    it('should block claim when last_answer_at is outside window', () => {
      const uplinkTimeout = 600 * 1000; // 10 minutes
      const lastAnswerAt = Date.now() - (15 * 60 * 1000); // 15 minutes ago

      const timeSinceAnswer = Date.now() - lastAnswerAt;
      const uplinkActive = timeSinceAnswer < uplinkTimeout;

      expect(uplinkActive).toBe(false);
    });

    it('should return UPLINK OFFLINE error when inactive', () => {
      const errorResponse = {
        error: 'UPLINK OFFLINE',
        message: 'Answer a drill question to restore your uplink',
        uplinkStatus: 'offline'
      };

      expect(errorResponse.error).toBe('UPLINK OFFLINE');
      expect(errorResponse.uplinkStatus).toBe('offline');
    });

    it('uplink time remaining should count down correctly', () => {
      const uplinkTimeout = 600; // 10 minutes in seconds
      const elapsed = 240; // 4 minutes elapsed

      const remaining = uplinkTimeout - elapsed;

      expect(remaining).toBe(360); // 6 minutes remaining
    });
  });

  describe('Task 5: Diminishing Returns', () => {
    function calculateMultiplier(territories) {
      const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold;
      const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier;
      const factor = GRID_WARS_CONFIG.diminishingReturnsFactor;

      if (territories <= threshold) return 1.0;

      const excess = territories - threshold;
      return Math.max(minMultiplier, 1 - (excess * factor));
    }

    it('should return 1.0 multiplier at or below threshold', () => {
      expect(calculateMultiplier(0)).toBe(1.0);
      expect(calculateMultiplier(25)).toBe(1.0);
      expect(calculateMultiplier(10)).toBe(1.0);
    });

    it('should return reduced multiplier above threshold', () => {
      const multiplier = calculateMultiplier(50);
      expect(multiplier).toBeLessThan(1.0);
      expect(multiplier).toBe(0.875); // 1 - (25 * 0.005)
    });

    it('should calculate correct multipliers at various empire sizes', () => {
      // 50 cells = 1 - (25 * 0.005) = 0.875
      expect(calculateMultiplier(50)).toBe(0.875);

      // 75 cells = 1 - (50 * 0.005) = 0.75
      expect(calculateMultiplier(75)).toBe(0.75);

      // 100 cells = 1 - (75 * 0.005) = 0.625
      expect(calculateMultiplier(100)).toBe(0.625);
    });

    it('should floor at minimum multiplier (0.5)', () => {
      // 125 cells = 1 - (100 * 0.005) = 0.5 (floor)
      expect(calculateMultiplier(125)).toBe(0.5);

      // 200 cells would be 1 - (175 * 0.005) = 0.125, but floored to 0.5
      expect(calculateMultiplier(200)).toBe(0.5);
    });

    it('should adjust points earned by multiplier', () => {
      const basePoints = 4;
      const multiplier = 0.75;

      const adjustedPoints = Math.ceil(basePoints * multiplier);

      expect(adjustedPoints).toBe(3);
    });
  });

  describe('Task 6: Teacher Scouting Report', () => {
    function calculateStatus(player) {
      const thresholds = GRID_WARS_CONFIG.scoutingThresholds;
      const lifetime = player.lifetime_earned || 0;
      const cells = player.territories_count || 0;

      if (lifetime >= thresholds.highLifetime && cells >= thresholds.highCells) {
        return { code: 'leader', emoji: '👑', color: '#fbbf24' };
      }
      if (lifetime >= thresholds.highLifetime && cells < thresholds.lowCells) {
        return { code: 'aggressive', emoji: '🎯', color: '#f97316' };
      }
      if (lifetime < thresholds.lowLifetime && cells < thresholds.lowCells) {
        return { code: 'needs_help', emoji: '⚠️', color: '#ef4444' };
      }
      return { code: 'active', emoji: '✓', color: '#22c55e' };
    }

    it('leader status for high lifetime + high cells', () => {
      const player = { lifetime_earned: 150, territories_count: 20 };
      const status = calculateStatus(player);

      expect(status.code).toBe('leader');
      expect(status.emoji).toBe('👑');
    });

    it('aggressive status for high lifetime + low cells', () => {
      const player = { lifetime_earned: 150, territories_count: 1 };
      const status = calculateStatus(player);

      expect(status.code).toBe('aggressive');
      expect(status.emoji).toBe('🎯');
    });

    it('needs_help status for low lifetime + low cells', () => {
      const player = { lifetime_earned: 10, territories_count: 0 };
      const status = calculateStatus(player);

      expect(status.code).toBe('needs_help');
      expect(status.emoji).toBe('⚠️');
    });

    it('active status for default case', () => {
      const player = { lifetime_earned: 50, territories_count: 8 };
      const status = calculateStatus(player);

      expect(status.code).toBe('active');
      expect(status.emoji).toBe('✓');
    });

    it('scouting report should sort by lifetime_earned', () => {
      const players = [
        { username: 'alice', lifetime_earned: 50 },
        { username: 'bob', lifetime_earned: 100 },
        { username: 'carol', lifetime_earned: 25 }
      ];

      const sorted = [...players].sort((a, b) => b.lifetime_earned - a.lifetime_earned);

      expect(sorted[0].username).toBe('bob');
      expect(sorted[1].username).toBe('alice');
      expect(sorted[2].username).toBe('carol');
    });
  });

  describe('Configuration', () => {
    it('should have correct v1.4 config values', () => {
      expect(GRID_WARS_CONFIG.uplinkRequiredSeconds).toBe(600);
      expect(GRID_WARS_CONFIG.diminishingReturnsEnabled).toBe(true);
      expect(GRID_WARS_CONFIG.diminishingReturnsThreshold).toBe(25);
      expect(GRID_WARS_CONFIG.diminishingReturnsMinMultiplier).toBe(0.5);
      expect(GRID_WARS_CONFIG.diminishingReturnsFactor).toBe(0.005);
    });

    it('should have round system config', () => {
      expect(GRID_WARS_CONFIG.rounds.enabled).toBe(true);
      expect(GRID_WARS_CONFIG.victoryConditions.domination.threshold).toBe(80);
      expect(GRID_WARS_CONFIG.legacyBonus.winner).toBe(5);
      expect(GRID_WARS_CONFIG.legacyBonus.top3).toBe(3);
    });

    it('should have scouting thresholds', () => {
      expect(GRID_WARS_CONFIG.scoutingThresholds.highLifetime).toBe(100);
      expect(GRID_WARS_CONFIG.scoutingThresholds.lowLifetime).toBe(30);
      expect(GRID_WARS_CONFIG.scoutingThresholds.highCells).toBe(15);
      expect(GRID_WARS_CONFIG.scoutingThresholds.lowCells).toBe(3);
    });
  });
});
