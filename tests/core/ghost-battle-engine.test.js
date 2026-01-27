/**
 * Tests for ghost-battle-engine.js
 * Ghost vs Ghost battle simulation system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as BattleEngine from '../../platform/core/ghost-battle-engine.js';

// Mock GhostNetwork module
vi.mock('../../platform/core/ghost-network.js', () => ({
  predict: vi.fn((model, inputs) => ({
    time: 20 + inputs[0] * 20,  // 20-40 seconds based on difficulty
    correctProb: 0.8 - inputs[0] * 0.3,  // 80% -> 50% based on difficulty
    hintProb: 0.1,
    quickProb: 0.5 - inputs[0] * 0.2  // 50% -> 30% based on difficulty
  })),
  createGhostNetwork: vi.fn(() => ({ mockModel: true })),
  deserializeWeights: vi.fn()
}));

describe('SeededRNG', () => {
  describe('determinism', () => {
    it('should produce same sequence with same seed', () => {
      const rng1 = new BattleEngine.SeededRNG(12345);
      const rng2 = new BattleEngine.SeededRNG(12345);

      const seq1 = [rng1.next(), rng1.next(), rng1.next()];
      const seq2 = [rng2.next(), rng2.next(), rng2.next()];

      expect(seq1).toEqual(seq2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new BattleEngine.SeededRNG(12345);
      const rng2 = new BattleEngine.SeededRNG(54321);

      expect(rng1.next()).not.toBe(rng2.next());
    });
  });

  describe('next()', () => {
    it('should return values between 0 and 1', () => {
      const rng = new BattleEngine.SeededRNG(42);

      for (let i = 0; i < 100; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('range()', () => {
    it('should return values within specified range', () => {
      const rng = new BattleEngine.SeededRNG(42);

      for (let i = 0; i < 100; i++) {
        const val = rng.range(10, 20);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThan(20);
      }
    });
  });

  describe('randInt()', () => {
    it('should return integers within specified range (inclusive)', () => {
      const rng = new BattleEngine.SeededRNG(42);

      for (let i = 0; i < 100; i++) {
        const val = rng.randInt(1, 6);
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(6);
      }
    });
  });

  describe('shuffle()', () => {
    it('should maintain all elements', () => {
      const rng = new BattleEngine.SeededRNG(42);
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(original);

      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should not modify original array', () => {
      const rng = new BattleEngine.SeededRNG(42);
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      rng.shuffle(original);

      expect(original).toEqual(copy);
    });

    it('should produce deterministic shuffle', () => {
      const rng1 = new BattleEngine.SeededRNG(42);
      const rng2 = new BattleEngine.SeededRNG(42);
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(rng1.shuffle(arr)).toEqual(rng2.shuffle(arr));
    });
  });

  describe('fork()', () => {
    it('should create independent RNG', () => {
      const rng = new BattleEngine.SeededRNG(42);
      const forked = rng.fork();

      // Advance original
      rng.next();
      rng.next();

      // Forked should have its own state
      const forked2 = new BattleEngine.SeededRNG(42).fork();
      expect(forked.next()).toBe(forked2.next());
    });
  });
});

describe('generateBattleSequence', () => {
  it('should generate correct number of problems', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const sequence = BattleEngine.generateBattleSequence(rng);

    expect(sequence.length).toBe(BattleEngine.BATTLE_CONFIG.problemCount);
  });

  it('should include problems from all difficulty tiers', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const sequence = BattleEngine.generateBattleSequence(rng);

    const easy = sequence.filter(p => p.difficulty < 0.33);
    const medium = sequence.filter(p => p.difficulty >= 0.33 && p.difficulty < 0.66);
    const hard = sequence.filter(p => p.difficulty >= 0.66);

    expect(easy.length).toBe(BattleEngine.BATTLE_CONFIG.distribution.easy);
    expect(medium.length).toBe(BattleEngine.BATTLE_CONFIG.distribution.medium);
    expect(hard.length).toBe(BattleEngine.BATTLE_CONFIG.distribution.hard);
  });

  it('should generate 10-element input vectors', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const sequence = BattleEngine.generateBattleSequence(rng);

    sequence.forEach(problem => {
      expect(problem.inputs.length).toBe(10);
    });
  });

  it('should be deterministic with same seed', () => {
    const seq1 = BattleEngine.generateBattleSequence(new BattleEngine.SeededRNG(42));
    const seq2 = BattleEngine.generateBattleSequence(new BattleEngine.SeededRNG(42));

    expect(seq1).toEqual(seq2);
  });
});

describe('generateProblemInputs', () => {
  it('should generate 10-element array', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const inputs = BattleEngine.generateProblemInputs(0.5, rng);

    expect(inputs.length).toBe(10);
  });

  it('should set difficulty in first and last positions', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const difficulty = 0.75;
    const inputs = BattleEngine.generateProblemInputs(difficulty, rng);

    expect(inputs[0]).toBe(difficulty);  // level_progress
    expect(inputs[9]).toBe(difficulty);  // level_tier
  });

  it('should set hints_remaining to 1.0', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const inputs = BattleEngine.generateProblemInputs(0.5, rng);

    expect(inputs[4]).toBe(1.0);  // hints_remaining
  });

  it('should set retry_count to 0.0', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const inputs = BattleEngine.generateProblemInputs(0.5, rng);

    expect(inputs[6]).toBe(0.0);  // retry_count
  });

  it('should generate values in valid ranges', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const inputs = BattleEngine.generateProblemInputs(0.5, rng);

    inputs.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    });
  });
});

describe('resolveProblem', () => {
  it('should return time and correct fields', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const prediction = { time: 20, correctProb: 0.8, quickProb: 0.5 };
    const result = BattleEngine.resolveProblem(prediction, 0.5, rng);

    expect(result).toHaveProperty('time');
    expect(result).toHaveProperty('correct');
  });

  it('should respect minimum time', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const prediction = { time: 1, correctProb: 1.0, quickProb: 1.0 };

    for (let i = 0; i < 50; i++) {
      const result = BattleEngine.resolveProblem(prediction, 0, rng);
      expect(result.time).toBeGreaterThanOrEqual(BattleEngine.BATTLE_CONFIG.minimumTime);
    }
  });

  it('should be more likely correct with high correctProb', () => {
    const rng = new BattleEngine.SeededRNG(42);
    const highProb = { time: 20, correctProb: 0.95, quickProb: 0.5 };

    let correctCount = 0;
    for (let i = 0; i < 100; i++) {
      const result = BattleEngine.resolveProblem(highProb, 0.5, new BattleEngine.SeededRNG(i));
      if (result.correct) correctCount++;
    }

    expect(correctCount).toBeGreaterThan(80);  // Should be ~95%
  });

  it('should be less likely correct with low correctProb', () => {
    const lowProb = { time: 20, correctProb: 0.1, quickProb: 0.5 };

    let correctCount = 0;
    for (let i = 0; i < 100; i++) {
      const result = BattleEngine.resolveProblem(lowProb, 0.5, new BattleEngine.SeededRNG(i));
      if (result.correct) correctCount++;
    }

    expect(correctCount).toBeLessThan(25);  // Should be ~10%
  });

  it('should apply difficulty modifier to time', () => {
    const rng1 = new BattleEngine.SeededRNG(42);
    const rng2 = new BattleEngine.SeededRNG(42);
    const prediction = { time: 20, correctProb: 1.0, quickProb: 0 };

    const easyResult = BattleEngine.resolveProblem(prediction, 0.0, rng1);
    const hardResult = BattleEngine.resolveProblem(prediction, 1.0, rng2);

    // Hard problems should take longer on average
    expect(hardResult.time).toBeGreaterThan(easyResult.time);
  });
});

describe('determineWinner', () => {
  it('should return 1 when challenger has more correct answers', () => {
    const results1 = { totalTime: 300, correctCount: 8 };
    const results2 = { totalTime: 200, correctCount: 6 };

    expect(BattleEngine.determineWinner(results1, results2)).toBe(1);
  });

  it('should return 2 when defender has more correct answers', () => {
    const results1 = { totalTime: 200, correctCount: 6 };
    const results2 = { totalTime: 300, correctCount: 8 };

    expect(BattleEngine.determineWinner(results1, results2)).toBe(2);
  });

  it('should use time as tiebreaker when correct count is equal', () => {
    const results1 = { totalTime: 200, correctCount: 7 };
    const results2 = { totalTime: 250, correctCount: 7 };

    expect(BattleEngine.determineWinner(results1, results2)).toBe(1);  // Faster wins
  });

  it('should return 0 for draw when very close', () => {
    const results1 = { totalTime: 200.3, correctCount: 7 };
    const results2 = { totalTime: 200.8, correctCount: 7 };

    expect(BattleEngine.determineWinner(results1, results2)).toBe(0);  // Within 1 second
  });
});

describe('simulateBattle', () => {
  it('should return complete battle results', () => {
    const model1 = { mockModel: 1 };
    const model2 = { mockModel: 2 };
    const results = BattleEngine.simulateBattle(model1, model2, 42);

    expect(results).toHaveProperty('seed');
    expect(results).toHaveProperty('problems');
    expect(results).toHaveProperty('challenger');
    expect(results).toHaveProperty('defender');
    expect(results).toHaveProperty('winner');
    expect(results).toHaveProperty('margin');
  });

  it('should use the provided seed', () => {
    const model1 = { mockModel: 1 };
    const model2 = { mockModel: 2 };
    const results = BattleEngine.simulateBattle(model1, model2, 12345);

    expect(results.seed).toBe(12345);
  });

  it('should be deterministic with same seed', () => {
    const model1 = { mockModel: 1 };
    const model2 = { mockModel: 2 };

    const results1 = BattleEngine.simulateBattle(model1, model2, 42);
    const results2 = BattleEngine.simulateBattle(model1, model2, 42);

    expect(results1.winner).toBe(results2.winner);
    expect(results1.challenger.totalTime).toBeCloseTo(results2.challenger.totalTime);
    expect(results1.defender.totalTime).toBeCloseTo(results2.defender.totalTime);
  });

  it('should produce different results with different seeds', () => {
    const model1 = { mockModel: 1 };
    const model2 = { mockModel: 2 };

    const results1 = BattleEngine.simulateBattle(model1, model2, 42);
    const results2 = BattleEngine.simulateBattle(model1, model2, 12345);

    // With different seeds, results should vary
    // (This test may occasionally fail by chance, but very unlikely)
    const sameResults =
      results1.challenger.totalTime === results2.challenger.totalTime &&
      results1.defender.totalTime === results2.defender.totalTime;

    expect(sameResults).toBe(false);
  });

  it('should have correct problem count', () => {
    const model1 = { mockModel: 1 };
    const model2 = { mockModel: 2 };
    const results = BattleEngine.simulateBattle(model1, model2, 42);

    expect(results.problems.length).toBe(BattleEngine.BATTLE_CONFIG.problemCount);
  });

  it('should track per-problem results', () => {
    const model1 = { mockModel: 1 };
    const model2 = { mockModel: 2 };
    const results = BattleEngine.simulateBattle(model1, model2, 42);

    results.problems.forEach(p => {
      expect(p).toHaveProperty('challenger');
      expect(p).toHaveProperty('defender');
      expect(p.challenger).toHaveProperty('prediction');
      expect(p.challenger).toHaveProperty('result');
    });
  });
});

describe('Elo Rating System', () => {
  describe('calculateExpected', () => {
    it('should return 0.5 for equal ratings', () => {
      expect(BattleEngine.calculateExpected(1200, 1200)).toBeCloseTo(0.5);
    });

    it('should return higher probability for higher-rated player', () => {
      const expected = BattleEngine.calculateExpected(1400, 1200);
      expect(expected).toBeGreaterThan(0.5);
    });

    it('should return lower probability for lower-rated player', () => {
      const expected = BattleEngine.calculateExpected(1000, 1200);
      expect(expected).toBeLessThan(0.5);
    });

    it('should return ~0.76 for 200 point advantage', () => {
      // Standard Elo: 200 point difference = ~76% expected
      const expected = BattleEngine.calculateExpected(1400, 1200);
      expect(expected).toBeCloseTo(0.76, 1);
    });
  });

  describe('updateRatings', () => {
    it('should increase winner rating and decrease loser rating', () => {
      const { newRatingA, newRatingB } = BattleEngine.updateRatings(1200, 1200, 1);

      expect(newRatingA).toBeGreaterThan(1200);
      expect(newRatingB).toBeLessThan(1200);
    });

    it('should give larger gains for upset wins', () => {
      // Low-rated player beats high-rated
      const { newRatingA } = BattleEngine.updateRatings(1000, 1400, 1);
      const changeA = newRatingA - 1000;

      // Equal match
      const { newRatingA: newRating2 } = BattleEngine.updateRatings(1200, 1200, 1);
      const changeEqual = newRating2 - 1200;

      expect(changeA).toBeGreaterThan(changeEqual);
    });

    it('should use higher K-factor for new ghosts', () => {
      // New ghost (< 10 battles)
      const { changeA: newChange } = BattleEngine.updateRatings(1200, 1200, 1, 5, 50);

      // Experienced ghost
      const { changeA: expChange } = BattleEngine.updateRatings(1200, 1200, 1, 50, 50);

      expect(Math.abs(newChange)).toBeGreaterThan(Math.abs(expChange));
    });

    it('should handle draws', () => {
      const { newRatingA, newRatingB } = BattleEngine.updateRatings(1200, 1200, 0);

      // Equal ratings + draw = no change
      expect(newRatingA).toBe(1200);
      expect(newRatingB).toBe(1200);
    });

    it('should handle underdog draws', () => {
      // Lower-rated player draws higher-rated
      const { newRatingA, newRatingB } = BattleEngine.updateRatings(1000, 1400, 0);

      // Lower-rated gains, higher-rated loses
      expect(newRatingA).toBeGreaterThan(1000);
      expect(newRatingB).toBeLessThan(1400);
    });
  });

  describe('getRatingTier', () => {
    it('should return Bronze for rating < 1000', () => {
      expect(BattleEngine.getRatingTier(800).name).toBe('Bronze');
      expect(BattleEngine.getRatingTier(999).name).toBe('Bronze');
    });

    it('should return Silver for rating 1000-1199', () => {
      expect(BattleEngine.getRatingTier(1000).name).toBe('Silver');
      expect(BattleEngine.getRatingTier(1199).name).toBe('Silver');
    });

    it('should return Gold for rating 1200-1399', () => {
      expect(BattleEngine.getRatingTier(1200).name).toBe('Gold');
      expect(BattleEngine.getRatingTier(1399).name).toBe('Gold');
    });

    it('should return Platinum for rating 1400-1599', () => {
      expect(BattleEngine.getRatingTier(1400).name).toBe('Platinum');
      expect(BattleEngine.getRatingTier(1599).name).toBe('Platinum');
    });

    it('should return Diamond for rating >= 1600', () => {
      expect(BattleEngine.getRatingTier(1600).name).toBe('Diamond');
      expect(BattleEngine.getRatingTier(2000).name).toBe('Diamond');
    });
  });
});

describe('Matchmaking', () => {
  describe('findRandomOpponent', () => {
    it('should find opponent within rating range', () => {
      const candidates = [
        { username: 'alice', rating: 1250 },
        { username: 'bob', rating: 1500 },
        { username: 'charlie', rating: 1100 }
      ];

      const opponent = BattleEngine.findRandomOpponent(candidates, 1200, 200);
      expect(['alice', 'charlie']).toContain(opponent.username);
    });

    it('should return null for empty candidates', () => {
      expect(BattleEngine.findRandomOpponent([], 1200)).toBeNull();
      expect(BattleEngine.findRandomOpponent(null, 1200)).toBeNull();
    });

    it('should fallback to closest rating if none in range', () => {
      const candidates = [
        { username: 'alice', rating: 1600 },
        { username: 'bob', rating: 1700 }
      ];

      const opponent = BattleEngine.findRandomOpponent(candidates, 1200, 200);
      expect(opponent.username).toBe('alice');  // Closest to 1200
    });

    it('should prefer opponents who have not battled recently', () => {
      const candidates = [
        { username: 'alice', rating: 1200, lastBattle: '2026-01-27T14:00:00Z' },
        { username: 'bob', rating: 1200, lastBattle: '2026-01-26T10:00:00Z' },
        { username: 'charlie', rating: 1200, lastBattle: null }
      ];

      const opponent = BattleEngine.findRandomOpponent(candidates, 1200);
      expect(opponent.username).toBe('charlie');  // Never battled
    });
  });

  describe('checkChallengeCooldown', () => {
    it('should allow challenge with no last battle', () => {
      const result = BattleEngine.checkChallengeCooldown(null, 'specific');
      expect(result.allowed).toBe(true);
      expect(result.cooldownRemaining).toBe(0);
    });

    it('should allow random challenges immediately', () => {
      const recentBattle = new Date().toISOString();
      const result = BattleEngine.checkChallengeCooldown(recentBattle, 'random');
      expect(result.allowed).toBe(true);
    });

    it('should enforce cooldown for specific challenges', () => {
      const recentBattle = new Date(Date.now() - 30 * 60 * 1000).toISOString();  // 30 min ago
      const result = BattleEngine.checkChallengeCooldown(recentBattle, 'specific');

      // 1 hour cooldown, 30 min elapsed = not allowed
      expect(result.allowed).toBe(false);
      expect(result.cooldownRemaining).toBeGreaterThan(0);
    });

    it('should allow specific challenge after cooldown expires', () => {
      const oldBattle = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();  // 2 hours ago
      const result = BattleEngine.checkChallengeCooldown(oldBattle, 'specific');

      expect(result.allowed).toBe(true);
    });

    it('should have shorter cooldown for rematch', () => {
      // 5 minutes ago
      const recentBattle = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const rematchResult = BattleEngine.checkChallengeCooldown(recentBattle, 'rematch');
      const specificResult = BattleEngine.checkChallengeCooldown(recentBattle, 'specific');

      // Rematch has 10 min cooldown, specific has 60 min
      // At 5 min: rematch should have ~5 min remaining, specific ~55 min
      expect(rematchResult.cooldownRemaining).toBeLessThan(specificResult.cooldownRemaining);
    });
  });
});

describe('Battle Log Formatting', () => {
  describe('formatBattleLog', () => {
    it('should format battle results correctly', () => {
      const battleResults = {
        seed: 12345,
        problems: [{ index: 0, difficulty: 0.5 }],
        challenger: { totalTime: 200, correctCount: 8 },
        defender: { totalTime: 250, correctCount: 7 },
        winner: 1,
        margin: 50
      };

      const log = BattleEngine.formatBattleLog(battleResults, 'alice', 'bob');

      expect(log.seed).toBe(12345);
      expect(log.summary.winner).toBe('alice');
      expect(log.summary.winnerSide).toBe(1);
    });

    it('should handle draws', () => {
      const battleResults = {
        seed: 12345,
        problems: [],
        challenger: { totalTime: 200, correctCount: 7 },
        defender: { totalTime: 200.5, correctCount: 7 },
        winner: 0,
        margin: 0.5
      };

      const log = BattleEngine.formatBattleLog(battleResults, 'alice', 'bob');

      expect(log.summary.winner).toBeNull();
      expect(log.summary.winnerSide).toBe(0);
    });
  });

  describe('getBattleSummary', () => {
    it('should format battle record for display', () => {
      const battle = {
        id: 1,
        challenger_username: 'alice',
        defender_username: 'bob',
        winner: 'alice',
        winner_side: 1,
        challenger_time: 200,
        challenger_correct: 8,
        defender_time: 250,
        defender_correct: 7,
        challenger_rating_before: 1200,
        challenger_rating_after: 1216,
        defender_rating_before: 1200,
        defender_rating_after: 1184,
        margin: 50,
        created_at: '2026-01-27T14:00:00Z'
      };

      const summary = BattleEngine.getBattleSummary(battle);

      expect(summary.challengerStats.ratingChange).toBe(16);
      expect(summary.defenderStats.ratingChange).toBe(-16);
    });
  });
});

describe('Configuration Constants', () => {
  it('should have valid BATTLE_CONFIG', () => {
    expect(BattleEngine.BATTLE_CONFIG.problemCount).toBe(10);
    expect(BattleEngine.BATTLE_CONFIG.distribution.easy +
           BattleEngine.BATTLE_CONFIG.distribution.medium +
           BattleEngine.BATTLE_CONFIG.distribution.hard).toBe(10);
  });

  it('should have valid ELO_CONFIG', () => {
    expect(BattleEngine.ELO_CONFIG.initialRating).toBe(1200);
    expect(BattleEngine.ELO_CONFIG.kFactor).toBe(32);
  });

  it('should have valid RATING_TIERS', () => {
    expect(BattleEngine.RATING_TIERS.length).toBe(5);
    expect(BattleEngine.RATING_TIERS[0].name).toBe('Bronze');
    expect(BattleEngine.RATING_TIERS[4].name).toBe('Diamond');
  });

  it('should have valid CHALLENGE_TYPES', () => {
    expect(Object.keys(BattleEngine.CHALLENGE_TYPES)).toHaveLength(4);
    expect(BattleEngine.CHALLENGE_TYPES.random).toBe('random');
  });
});
