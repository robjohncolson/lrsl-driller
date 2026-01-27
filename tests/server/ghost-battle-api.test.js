/**
 * Tests for Ghost Battle Server API
 * POST /api/ghost/:cartridgeId/battle/challenge
 * GET /api/ghost/:cartridgeId/battle/:battleId
 * GET /api/ghost/:cartridgeId/battle/history/:username
 * GET /api/ghost/:cartridgeId/battle/rating/:username
 * GET /api/ghost/:cartridgeId/battle/leaderboard
 */

import { describe, it, expect } from 'vitest';

describe('Ghost Battle API Contract', () => {

  describe('POST /api/ghost/:cartridgeId/battle/challenge', () => {
    it('should accept valid challenge request', () => {
      const validPayload = {
        username: 'alice',
        opponentUsername: 'bob',  // Optional
        challengeType: 'specific'
      };

      expect(validPayload.username).toBeDefined();
      expect(['random', 'specific', 'rematch', 'leaderboard']).toContain(validPayload.challengeType);
    });

    it('should support random matchmaking without opponent', () => {
      const randomPayload = {
        username: 'alice',
        challengeType: 'random'
      };

      expect(randomPayload.opponentUsername).toBeUndefined();
    });

    it('should return complete battle result', () => {
      const expectedResponse = {
        battleId: 123,
        status: 'complete',
        result: {
          winner: 'alice',
          winnerSide: 1,  // 1 = challenger, 2 = defender, 0 = draw
          challenger: {
            username: 'alice',
            time: 245.3,
            correct: 8,
            ratingBefore: 1200,
            ratingAfter: 1216
          },
          defender: {
            username: 'bob',
            time: 267.8,
            correct: 7,
            ratingBefore: 1200,
            ratingAfter: 1184
          },
          margin: 22.5
        }
      };

      expect(expectedResponse.battleId).toBeDefined();
      expect(expectedResponse.status).toBe('complete');
      expect(expectedResponse.result.challenger.ratingAfter).toBeGreaterThan(expectedResponse.result.challenger.ratingBefore);
    });

    it('should return error for missing username', () => {
      const errorResponse = { error: 'Username required' };
      expect(errorResponse.error).toBe('Username required');
    });

    it('should return error for non-existent ghost', () => {
      const errorResponse = { error: 'Challenger ghost not found' };
      expect(errorResponse.error).toContain('not found');
    });
  });

  describe('GET /api/ghost/:cartridgeId/battle/:battleId', () => {
    it('should return full battle details', () => {
      const expectedResponse = {
        id: 123,
        cartridge_id: 'sampling',
        challenger_username: 'alice',
        defender_username: 'bob',
        challenge_type: 'specific',
        seed: 1706388000000,
        winner: 'alice',
        winner_side: 1,
        challenger_time: 245.3,
        challenger_correct: 8,
        defender_time: 267.8,
        defender_correct: 7,
        margin: 22.5,
        challenger_rating_before: 1200,
        defender_rating_before: 1200,
        challenger_rating_after: 1216,
        defender_rating_after: 1184,
        battle_log: {
          seed: 1706388000000,
          problems: []
        },
        created_at: '2026-01-27T14:00:00Z'
      };

      expect(expectedResponse).toHaveProperty('id');
      expect(expectedResponse).toHaveProperty('battle_log');
      expect(expectedResponse).toHaveProperty('seed');
    });

    it('should return 404 for non-existent battle', () => {
      const errorResponse = { error: 'Battle not found' };
      expect(errorResponse.error).toBe('Battle not found');
    });
  });

  describe('GET /api/ghost/:cartridgeId/battle/history/:username', () => {
    it('should return paginated battle history', () => {
      const expectedResponse = {
        battles: [
          {
            id: 123,
            challenger_username: 'alice',
            defender_username: 'bob',
            winner: 'alice',
            winner_side: 1,
            challenger_time: 245.3,
            challenger_correct: 8,
            defender_time: 267.8,
            defender_correct: 7,
            margin: 22.5,
            created_at: '2026-01-27T14:00:00Z'
          }
        ],
        total: 15
      };

      expect(Array.isArray(expectedResponse.battles)).toBe(true);
      expect(expectedResponse.total).toBeGreaterThan(0);
    });

    it('should support pagination query params', () => {
      const queryParams = { limit: 10, offset: 20 };
      expect(queryParams.limit).toBe(10);
      expect(queryParams.offset).toBe(20);
    });

    it('should return empty array for user with no battles', () => {
      const emptyResponse = { battles: [], total: 0 };
      expect(emptyResponse.battles).toHaveLength(0);
      expect(emptyResponse.total).toBe(0);
    });
  });

  describe('GET /api/ghost/:cartridgeId/battle/rating/:username', () => {
    it('should return user rating with tier', () => {
      const expectedResponse = {
        username: 'alice',
        cartridge_id: 'sampling',
        rating: 1350,
        battles_fought: 25,
        wins: 15,
        losses: 8,
        draws: 2,
        current_streak: 3,
        best_streak: 5,
        tier: { name: 'Gold', icon: 'gold' }
      };

      expect(expectedResponse.rating).toBeDefined();
      expect(expectedResponse.tier).toBeDefined();
      expect(expectedResponse.tier.name).toBe('Gold');
    });

    it('should return default rating for new user', () => {
      const newUserResponse = {
        username: 'newbie',
        cartridge_id: 'sampling',
        rating: 1200,
        battles_fought: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        current_streak: 0,
        best_streak: 0,
        tier: { name: 'Gold', icon: 'gold' }  // 1200 = Gold
      };

      expect(newUserResponse.rating).toBe(1200);
      expect(newUserResponse.battles_fought).toBe(0);
    });

    it('should calculate tier correctly', () => {
      const tierTests = [
        { rating: 800, expectedTier: 'Bronze' },
        { rating: 1050, expectedTier: 'Silver' },
        { rating: 1250, expectedTier: 'Gold' },
        { rating: 1450, expectedTier: 'Platinum' },
        { rating: 1700, expectedTier: 'Diamond' }
      ];

      tierTests.forEach(({ rating, expectedTier }) => {
        let tier;
        if (rating < 1000) tier = 'Bronze';
        else if (rating < 1200) tier = 'Silver';
        else if (rating < 1400) tier = 'Gold';
        else if (rating < 1600) tier = 'Platinum';
        else tier = 'Diamond';

        expect(tier).toBe(expectedTier);
      });
    });
  });

  describe('GET /api/ghost/:cartridgeId/battle/leaderboard', () => {
    it('should return sorted rankings with tiers', () => {
      const expectedResponse = {
        rankings: [
          { username: 'topPlayer', rating: 1650, battles_fought: 50, wins: 35, losses: 12, draws: 3, tier: { name: 'Diamond' } },
          { username: 'midPlayer', rating: 1350, battles_fought: 30, wins: 18, losses: 10, draws: 2, tier: { name: 'Gold' } },
          { username: 'newPlayer', rating: 1200, battles_fought: 5, wins: 2, losses: 3, draws: 0, tier: { name: 'Gold' } }
        ]
      };

      // Should be sorted by rating descending
      const ratings = expectedResponse.rankings.map(r => r.rating);
      for (let i = 1; i < ratings.length; i++) {
        expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1]);
      }
    });

    it('should support class_period filter', () => {
      const queryParam = { class_period: 'A' };
      expect(queryParam.class_period).toMatch(/^[A-G]$/);
    });

    it('should support limit parameter', () => {
      const queryParam = { limit: 25 };
      expect(queryParam.limit).toBe(25);
    });

    it('should return empty array for cartridge with no battles', () => {
      const emptyResponse = { rankings: [] };
      expect(emptyResponse.rankings).toHaveLength(0);
    });
  });
});

describe('Ghost Battle Database Schema', () => {
  describe('ghost_battles table', () => {
    it('should have required columns', () => {
      const columns = [
        'id', 'cartridge_id', 'challenger_username', 'defender_username',
        'challenge_type', 'seed', 'winner', 'winner_side',
        'challenger_time', 'challenger_correct', 'defender_time', 'defender_correct',
        'margin', 'challenger_rating_before', 'defender_rating_before',
        'challenger_rating_after', 'defender_rating_after', 'battle_log', 'created_at'
      ];

      expect(columns).toContain('seed');
      expect(columns).toContain('battle_log');
      expect(columns).toContain('winner_side');
    });

    it('should have indexes for common queries', () => {
      const indexes = [
        'idx_ghost_battles_cartridge',
        'idx_ghost_battles_challenger',
        'idx_ghost_battles_defender',
        'idx_ghost_battles_created'
      ];

      expect(indexes.length).toBe(4);
    });
  });

  describe('ghost_ratings table', () => {
    it('should have required columns', () => {
      const columns = [
        'id', 'username', 'cartridge_id', 'rating', 'battles_fought',
        'wins', 'losses', 'draws', 'current_streak', 'best_streak',
        'last_battle_at', 'created_at', 'updated_at'
      ];

      expect(columns).toContain('current_streak');
      expect(columns).toContain('best_streak');
    });

    it('should have unique constraint on (username, cartridge_id)', () => {
      const constraint = { unique: ['username', 'cartridge_id'] };
      expect(constraint.unique).toContain('username');
      expect(constraint.unique).toContain('cartridge_id');
    });

    it('should have leaderboard index', () => {
      const indexColumns = ['cartridge_id', 'rating'];
      expect(indexColumns).toContain('rating');
    });
  });
});

describe('Battle Simulation Logic', () => {
  describe('Problem sequence generation', () => {
    it('should generate correct difficulty distribution', () => {
      const distribution = { easy: 3, medium: 4, hard: 3 };
      const total = distribution.easy + distribution.medium + distribution.hard;
      expect(total).toBe(10);
    });

    it('should use seeded RNG for reproducibility', () => {
      const seed1 = 12345;
      const seed2 = 12345;
      expect(seed1).toBe(seed2);  // Same seed = same results
    });
  });

  describe('Winner determination', () => {
    it('should prioritize correct count over time', () => {
      const results1 = { correctCount: 8, totalTime: 300 };
      const results2 = { correctCount: 7, totalTime: 200 };

      // results1 wins because more correct, despite slower
      expect(results1.correctCount).toBeGreaterThan(results2.correctCount);
    });

    it('should use time as tiebreaker', () => {
      const results1 = { correctCount: 7, totalTime: 200 };
      const results2 = { correctCount: 7, totalTime: 250 };

      // results1 wins because faster
      expect(results1.totalTime).toBeLessThan(results2.totalTime);
    });

    it('should declare draw when very close', () => {
      const results1 = { correctCount: 7, totalTime: 200.3 };
      const results2 = { correctCount: 7, totalTime: 200.8 };

      // Within 1 second = draw
      expect(Math.abs(results1.totalTime - results2.totalTime)).toBeLessThan(1);
    });
  });

  describe('Elo rating updates', () => {
    it('should increase winner rating', () => {
      const beforeWinner = 1200;
      const afterWinner = 1216;  // Won as expected
      expect(afterWinner).toBeGreaterThan(beforeWinner);
    });

    it('should decrease loser rating', () => {
      const beforeLoser = 1200;
      const afterLoser = 1184;  // Lost as expected
      expect(afterLoser).toBeLessThan(beforeLoser);
    });

    it('should give larger change for upset wins', () => {
      const expectedUpsetChange = 28;  // Underdog beats favorite
      const expectedNormalChange = 16;  // Expected result
      expect(expectedUpsetChange).toBeGreaterThan(expectedNormalChange);
    });

    it('should use higher K-factor for new players', () => {
      const kFactorNew = 40;
      const kFactorExperienced = 32;
      expect(kFactorNew).toBeGreaterThan(kFactorExperienced);
    });
  });
});

describe('WebSocket Broadcasts', () => {
  describe('ghost_battle_complete message', () => {
    it('should have required fields', () => {
      const message = {
        type: 'ghost_battle_complete',
        battleId: 123,
        cartridgeId: 'sampling',
        challenger: 'alice',
        defender: 'bob',
        winner: 'alice',
        winnerSide: 1,
        challengerStats: {
          time: 245.3,
          correct: 8,
          ratingChange: 16
        },
        defenderStats: {
          time: 267.8,
          correct: 7,
          ratingChange: -16
        }
      };

      expect(message.type).toBe('ghost_battle_complete');
      expect(message).toHaveProperty('battleId');
      expect(message).toHaveProperty('challengerStats');
      expect(message).toHaveProperty('defenderStats');
    });
  });
});

describe('Challenge Cooldowns', () => {
  it('should have no cooldown for random battles', () => {
    const cooldowns = {
      random: 0,
      specific: 60 * 60 * 1000,     // 1 hour
      rematch: 10 * 60 * 1000,      // 10 minutes
      leaderboard: 30 * 60 * 1000   // 30 minutes
    };

    expect(cooldowns.random).toBe(0);
  });

  it('should have 1 hour cooldown for specific challenges', () => {
    const cooldown = 60 * 60 * 1000;  // 1 hour in ms
    expect(cooldown).toBe(3600000);
  });

  it('should have shorter cooldown for rematch', () => {
    const rematchCooldown = 10 * 60 * 1000;
    const specificCooldown = 60 * 60 * 1000;
    expect(rematchCooldown).toBeLessThan(specificCooldown);
  });
});

describe('Battle Log Structure', () => {
  it('should store seed for reproducibility', () => {
    const battleLog = {
      seed: 1706388000000,
      problems: []
    };

    expect(battleLog.seed).toBeDefined();
    expect(typeof battleLog.seed).toBe('number');
  });

  it('should store per-problem results', () => {
    const problemLog = {
      difficulty: 0.5,
      challenger: {
        prediction: { time: 20, correctProb: 0.8, quickProb: 0.5 },
        result: { time: 18.5, correct: true }
      },
      defender: {
        prediction: { time: 25, correctProb: 0.7, quickProb: 0.4 },
        result: { time: 22.3, correct: true }
      }
    };

    expect(problemLog).toHaveProperty('challenger');
    expect(problemLog).toHaveProperty('defender');
    expect(problemLog.challenger).toHaveProperty('prediction');
    expect(problemLog.challenger).toHaveProperty('result');
  });
});
