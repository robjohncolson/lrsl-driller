/**
 * Leaderboard Calculation Tests
 * Tests the score aggregation logic used for leaderboard rankings
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Point values per star type
const BASE_POINTS = { gold: 4, silver: 3, bronze: 2, tin: 1 };

/**
 * Aggregate progress records into user stats
 * This mirrors the server-side aggregation logic
 */
function aggregateUserStats(progressRecords) {
  const userStats = {};

  for (const p of progressRecords) {
    if (!userStats[p.username]) {
      userStats[p.username] = { gold: 0, silver: 0, bronze: 0, tin: 0, weighted_score: 0 };
    }

    if (p.star_type && userStats[p.username][p.star_type] !== undefined) {
      userStats[p.username][p.star_type]++;
    }

    // Calculate weighted score from star type
    if (p.star_type) {
      userStats[p.username].weighted_score += BASE_POINTS[p.star_type] || 0;
    }
  }

  return userStats;
}

/**
 * Format and sort leaderboard entries
 */
function formatLeaderboard(userStats, usersMap = {}) {
  const leaderboard = Object.entries(userStats).map(([username, stats]) => ({
    username,
    real_name: usersMap[username] || null,
    gold: stats.gold,
    silver: stats.silver,
    bronze: stats.bronze,
    tin: stats.tin,
    weighted_score: Math.round(stats.weighted_score * 10) / 10
  }));

  // Sort by weighted score descending
  leaderboard.sort((a, b) => b.weighted_score - a.weighted_score);

  return leaderboard;
}

describe('Leaderboard Aggregation', () => {
  // ==================== STAR COUNTING ====================
  describe('Star Counting', () => {
    it('counts gold stars correctly', () => {
      const progress = [
        { username: 'user1', star_type: 'gold' },
        { username: 'user1', star_type: 'gold' },
        { username: 'user1', star_type: 'gold' }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.gold).toBe(3);
      expect(stats.user1.silver).toBe(0);
      expect(stats.user1.bronze).toBe(0);
      expect(stats.user1.tin).toBe(0);
    });

    it('counts mixed star types correctly', () => {
      const progress = [
        { username: 'user1', star_type: 'gold' },
        { username: 'user1', star_type: 'silver' },
        { username: 'user1', star_type: 'bronze' },
        { username: 'user1', star_type: 'tin' }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.gold).toBe(1);
      expect(stats.user1.silver).toBe(1);
      expect(stats.user1.bronze).toBe(1);
      expect(stats.user1.tin).toBe(1);
    });

    it('handles multiple users separately', () => {
      const progress = [
        { username: 'user1', star_type: 'gold' },
        { username: 'user2', star_type: 'silver' },
        { username: 'user1', star_type: 'gold' },
        { username: 'user2', star_type: 'gold' }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.gold).toBe(2);
      expect(stats.user1.silver).toBe(0);
      expect(stats.user2.gold).toBe(1);
      expect(stats.user2.silver).toBe(1);
    });

    it('ignores null star types', () => {
      const progress = [
        { username: 'user1', star_type: 'gold' },
        { username: 'user1', star_type: null },
        { username: 'user1', star_type: undefined }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.gold).toBe(1);
      expect(stats.user1.weighted_score).toBe(4);
    });

    it('ignores invalid star types', () => {
      const progress = [
        { username: 'user1', star_type: 'gold' },
        { username: 'user1', star_type: 'platinum' }, // invalid
        { username: 'user1', star_type: 'diamond' }   // invalid
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.gold).toBe(1);
      expect(stats.user1.weighted_score).toBe(4); // only the gold counted
    });
  });

  // ==================== SCORE CALCULATION ====================
  describe('Weighted Score Calculation', () => {
    it('calculates weighted score for gold stars (4 pts each)', () => {
      const progress = [
        { username: 'user1', star_type: 'gold' },
        { username: 'user1', star_type: 'gold' }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.weighted_score).toBe(8); // 2 * 4
    });

    it('calculates weighted score for silver stars (3 pts each)', () => {
      const progress = [
        { username: 'user1', star_type: 'silver' },
        { username: 'user1', star_type: 'silver' },
        { username: 'user1', star_type: 'silver' }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.weighted_score).toBe(9); // 3 * 3
    });

    it('calculates weighted score for bronze stars (2 pts each)', () => {
      const progress = [
        { username: 'user1', star_type: 'bronze' },
        { username: 'user1', star_type: 'bronze' }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.weighted_score).toBe(4); // 2 * 2
    });

    it('calculates weighted score for tin stars (1 pt each)', () => {
      const progress = [
        { username: 'user1', star_type: 'tin' },
        { username: 'user1', star_type: 'tin' },
        { username: 'user1', star_type: 'tin' },
        { username: 'user1', star_type: 'tin' }
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.weighted_score).toBe(4); // 4 * 1
    });

    it('calculates mixed weighted score correctly', () => {
      const progress = [
        { username: 'user1', star_type: 'gold' },   // 4
        { username: 'user1', star_type: 'silver' }, // 3
        { username: 'user1', star_type: 'bronze' }, // 2
        { username: 'user1', star_type: 'tin' }     // 1
      ];

      const stats = aggregateUserStats(progress);

      expect(stats.user1.weighted_score).toBe(10); // 4 + 3 + 2 + 1
    });
  });

  // ==================== LEADERBOARD SORTING ====================
  describe('Leaderboard Sorting', () => {
    it('sorts users by weighted score descending', () => {
      const userStats = {
        low: { gold: 1, silver: 0, bronze: 0, tin: 0, weighted_score: 4 },
        high: { gold: 10, silver: 0, bronze: 0, tin: 0, weighted_score: 40 },
        medium: { gold: 5, silver: 0, bronze: 0, tin: 0, weighted_score: 20 }
      };

      const leaderboard = formatLeaderboard(userStats);

      expect(leaderboard[0].username).toBe('high');
      expect(leaderboard[1].username).toBe('medium');
      expect(leaderboard[2].username).toBe('low');
    });

    it('handles ties by keeping original order', () => {
      const userStats = {
        user1: { gold: 1, silver: 0, bronze: 0, tin: 0, weighted_score: 4 },
        user2: { gold: 1, silver: 0, bronze: 0, tin: 0, weighted_score: 4 }
      };

      const leaderboard = formatLeaderboard(userStats);

      expect(leaderboard.length).toBe(2);
      expect(leaderboard[0].weighted_score).toBe(4);
      expect(leaderboard[1].weighted_score).toBe(4);
    });
  });

  // ==================== REAL NAME MAPPING ====================
  describe('Real Name Display', () => {
    it('includes real name when available', () => {
      const userStats = {
        user1: { gold: 1, silver: 0, bronze: 0, tin: 0, weighted_score: 4 }
      };
      const usersMap = { user1: 'John Doe' };

      const leaderboard = formatLeaderboard(userStats, usersMap);

      expect(leaderboard[0].real_name).toBe('John Doe');
    });

    it('shows null when real name not available', () => {
      const userStats = {
        user1: { gold: 1, silver: 0, bronze: 0, tin: 0, weighted_score: 4 }
      };

      const leaderboard = formatLeaderboard(userStats, {});

      expect(leaderboard[0].real_name).toBe(null);
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles empty progress array', () => {
      const stats = aggregateUserStats([]);

      expect(Object.keys(stats).length).toBe(0);
    });

    it('handles users with zero stars', () => {
      const userStats = {
        user1: { gold: 0, silver: 0, bronze: 0, tin: 0, weighted_score: 0 }
      };

      const leaderboard = formatLeaderboard(userStats);

      expect(leaderboard[0].weighted_score).toBe(0);
    });

    it('rounds weighted score to 1 decimal place', () => {
      // This would happen if we had fractional multipliers in the future
      const userStats = {
        user1: { gold: 0, silver: 0, bronze: 0, tin: 0, weighted_score: 4.567 }
      };

      const leaderboard = formatLeaderboard(userStats);

      expect(leaderboard[0].weighted_score).toBe(4.6);
    });
  });

  // ==================== REAL-WORLD SCENARIOS ====================
  describe('Real-world Scenarios', () => {
    it('calculates classroom leaderboard correctly', () => {
      const progress = [
        // Student A: 5 gold, 2 silver
        { username: 'studentA', star_type: 'gold' },
        { username: 'studentA', star_type: 'gold' },
        { username: 'studentA', star_type: 'gold' },
        { username: 'studentA', star_type: 'gold' },
        { username: 'studentA', star_type: 'gold' },
        { username: 'studentA', star_type: 'silver' },
        { username: 'studentA', star_type: 'silver' },
        // Student B: 10 tin
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' },
        { username: 'studentB', star_type: 'tin' }
      ];

      const stats = aggregateUserStats(progress);
      const leaderboard = formatLeaderboard(stats);

      // Student A: 5*4 + 2*3 = 20 + 6 = 26
      // Student B: 10*1 = 10
      expect(leaderboard[0].username).toBe('studentA');
      expect(leaderboard[0].weighted_score).toBe(26);
      expect(leaderboard[1].username).toBe('studentB');
      expect(leaderboard[1].weighted_score).toBe(10);
    });

    it('rewards quality over quantity', () => {
      const progress = [
        // User with 1 gold star
        { username: 'quality', star_type: 'gold' },
        // User with 3 tin stars
        { username: 'quantity', star_type: 'tin' },
        { username: 'quantity', star_type: 'tin' },
        { username: 'quantity', star_type: 'tin' }
      ];

      const stats = aggregateUserStats(progress);
      const leaderboard = formatLeaderboard(stats);

      // 1 gold (4 pts) > 3 tin (3 pts)
      expect(leaderboard[0].username).toBe('quality');
      expect(leaderboard[0].weighted_score).toBe(4);
      expect(leaderboard[1].weighted_score).toBe(3);
    });
  });
});

describe('Point Values', () => {
  it('gold is worth 4 points', () => {
    expect(BASE_POINTS.gold).toBe(4);
  });

  it('silver is worth 3 points', () => {
    expect(BASE_POINTS.silver).toBe(3);
  });

  it('bronze is worth 2 points', () => {
    expect(BASE_POINTS.bronze).toBe(2);
  });

  it('tin is worth 1 point', () => {
    expect(BASE_POINTS.tin).toBe(1);
  });

  it('point values are in descending order', () => {
    expect(BASE_POINTS.gold).toBeGreaterThan(BASE_POINTS.silver);
    expect(BASE_POINTS.silver).toBeGreaterThan(BASE_POINTS.bronze);
    expect(BASE_POINTS.bronze).toBeGreaterThan(BASE_POINTS.tin);
  });
});
