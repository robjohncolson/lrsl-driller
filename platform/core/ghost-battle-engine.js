/**
 * ghost-battle-engine.js
 * Battle simulation engine for ghost-vs-ghost competitions
 *
 * Features:
 * - Seeded RNG for reproducible battles
 * - Problem sequence generation
 * - Stochastic resolution with personality influence
 * - Elo-style rating system
 */

import * as GhostNetwork from './ghost-network.js';

// ============================================
// CONFIGURATION
// ============================================

export const BATTLE_CONFIG = {
  problemCount: 10,
  distribution: {
    easy: 3,    // Difficulty 0.0-0.33
    medium: 4,  // Difficulty 0.33-0.66
    hard: 3     // Difficulty 0.66-1.0
  },
  timeVariance: 0.2,        // 20% time variance
  difficultyModifier: 0.3,  // 30% slower per difficulty unit
  quickBonus: 0.7,          // 30% faster when quick triggers
  incorrectPenalty: 1.5,    // 50% time penalty for wrong answer
  minimumTime: 5            // Minimum seconds per problem
};

export const ELO_CONFIG = {
  initialRating: 1200,
  kFactor: 32,
  kFactorNew: 40,           // For ghosts with <10 battles
  newGhostThreshold: 10,
  drawMargin: 16
};

export const RATING_TIERS = [
  { min: 0, max: 999, name: 'Bronze', icon: 'bronze' },
  { min: 1000, max: 1199, name: 'Silver', icon: 'silver' },
  { min: 1200, max: 1399, name: 'Gold', icon: 'gold' },
  { min: 1400, max: 1599, name: 'Platinum', icon: 'platinum' },
  { min: 1600, max: Infinity, name: 'Diamond', icon: 'diamond' }
];

export const CHALLENGE_TYPES = {
  random: 'random',
  specific: 'specific',
  rematch: 'rematch',
  leaderboard: 'leaderboard'
};

// ============================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================

/**
 * Seeded random number generator for reproducible battles
 * Uses mulberry32 algorithm
 */
export class SeededRNG {
  constructor(seed) {
    this.seed = seed;
    this.state = seed;
  }

  /**
   * Generate next random number [0, 1)
   * @returns {number}
   */
  next() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Generate random number in range [min, max)
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Generate random integer in range [min, max]
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Shuffle array in place using Fisher-Yates
   * @param {Array} array
   * @returns {Array}
   */
  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Create independent RNG fork with derived seed
   * @returns {SeededRNG}
   */
  fork() {
    return new SeededRNG(Math.floor(this.next() * 4294967296));
  }
}

// ============================================
// PROBLEM SEQUENCE GENERATION
// ============================================

/**
 * Generate a battle problem sequence
 * @param {SeededRNG} rng - Seeded random generator
 * @returns {Object[]} Array of problem specifications
 */
export function generateBattleSequence(rng) {
  const problems = [];

  // Create difficulty distribution
  const difficulties = [];
  for (let i = 0; i < BATTLE_CONFIG.distribution.easy; i++) {
    difficulties.push(rng.range(0.0, 0.33));
  }
  for (let i = 0; i < BATTLE_CONFIG.distribution.medium; i++) {
    difficulties.push(rng.range(0.33, 0.66));
  }
  for (let i = 0; i < BATTLE_CONFIG.distribution.hard; i++) {
    difficulties.push(rng.range(0.66, 1.0));
  }

  // Shuffle difficulties
  const shuffledDifficulties = rng.shuffle(difficulties);

  // Generate problem input vectors
  for (let i = 0; i < BATTLE_CONFIG.problemCount; i++) {
    const difficulty = shuffledDifficulties[i];
    problems.push({
      index: i,
      difficulty,
      inputs: generateProblemInputs(difficulty, rng)
    });
  }

  return problems;
}

/**
 * Generate normalized input vector for a battle problem
 * @param {number} difficulty - Problem difficulty 0-1
 * @param {SeededRNG} rng - Random generator
 * @returns {number[]} 10-element input vector
 */
export function generateProblemInputs(difficulty, rng) {
  return [
    difficulty,                        // level_progress
    rng.range(0.0, 0.5),              // time_in_session (early-mid)
    rng.range(0.0, 0.4),              // current_streak (0-4)
    rng.range(0.7, 1.0),              // recent_accuracy (good)
    1.0,                               // hints_remaining (full - no hints in battle)
    rng.range(0.0, 0.3),              // problems_this_session (early)
    0.0,                               // retry_count (first attempt)
    rng.range(0.7, 1.0),              // session_accuracy (good)
    0.5,                               // time_of_day (neutral midday)
    difficulty                         // level_tier matches difficulty
  ];
}

// ============================================
// BATTLE SIMULATION
// ============================================

/**
 * Run a ghost through the problem sequence
 * @param {Object} model - TensorFlow.js model
 * @param {Object[]} problems - Problem sequence
 * @param {SeededRNG} rng - Random generator for this ghost
 * @returns {Object} Results with timeline
 */
export function runGhostThrough(model, problems, rng) {
  const timeline = [];
  let totalTime = 0;
  let correctCount = 0;

  for (const problem of problems) {
    const prediction = GhostNetwork.predict(model, problem.inputs);
    const result = resolveProblem(prediction, problem.difficulty, rng);

    timeline.push({
      index: problem.index,
      prediction: {
        time: prediction.time,
        correctProb: prediction.correctProb,
        quickProb: prediction.quickProb
      },
      result: {
        time: result.time,
        correct: result.correct
      }
    });

    totalTime += result.time;
    if (result.correct) correctCount++;
  }

  return {
    totalTime,
    correctCount,
    timeline
  };
}

/**
 * Resolve a single problem outcome with stochastic elements
 * @param {Object} prediction - Ghost network prediction
 * @param {number} difficulty - Problem difficulty
 * @param {SeededRNG} rng - Random generator
 * @returns {Object} { time, correct }
 */
export function resolveProblem(prediction, difficulty, rng) {
  // 1. Determine if answer is correct
  const isCorrect = rng.next() < prediction.correctProb;

  // 2. Calculate base time with variance
  const baseTime = prediction.time;
  const variance = baseTime * BATTLE_CONFIG.timeVariance;
  let actualTime = baseTime + (rng.next() * 2 - 1) * variance;

  // 3. Apply difficulty modifier (harder = slower)
  actualTime *= (1 + difficulty * BATTLE_CONFIG.difficultyModifier);

  // 4. Quick answer bonus
  if (rng.next() < prediction.quickProb) {
    actualTime *= BATTLE_CONFIG.quickBonus;
  }

  // 5. Incorrect answer penalty (simulates backtracking)
  if (!isCorrect) {
    actualTime *= BATTLE_CONFIG.incorrectPenalty;
  }

  return {
    time: Math.max(BATTLE_CONFIG.minimumTime, actualTime),
    correct: isCorrect
  };
}

/**
 * Determine battle winner
 * @param {Object} results1 - Challenger results
 * @param {Object} results2 - Defender results
 * @returns {number} 1 = challenger wins, 2 = defender wins, 0 = draw
 */
export function determineWinner(results1, results2) {
  // Primary: More correct answers wins
  if (results1.correctCount !== results2.correctCount) {
    return results1.correctCount > results2.correctCount ? 1 : 2;
  }

  // Tiebreaker: Faster total time wins
  const timeDiff = Math.abs(results1.totalTime - results2.totalTime);
  if (timeDiff > 1) {
    return results1.totalTime < results2.totalTime ? 1 : 2;
  }

  // Draw (within 1 second and same correct count)
  return 0;
}

/**
 * Simulate a full battle between two ghosts
 * @param {Object} model1 - Challenger's TensorFlow model
 * @param {Object} model2 - Defender's TensorFlow model
 * @param {number} seed - Random seed for reproducibility
 * @returns {Object} Complete battle results
 */
export function simulateBattle(model1, model2, seed) {
  const rng = new SeededRNG(seed);

  // Generate problem sequence (same for both ghosts)
  const problems = generateBattleSequence(rng);

  // Run each ghost through sequence with independent RNGs
  const results1 = runGhostThrough(model1, problems, rng.fork());
  const results2 = runGhostThrough(model2, problems, rng.fork());

  const winner = determineWinner(results1, results2);

  return {
    seed,
    problems: problems.map((p, i) => ({
      index: p.index,
      difficulty: p.difficulty,
      inputs: p.inputs,
      challenger: results1.timeline[i],
      defender: results2.timeline[i]
    })),
    challenger: {
      totalTime: results1.totalTime,
      correctCount: results1.correctCount
    },
    defender: {
      totalTime: results2.totalTime,
      correctCount: results2.correctCount
    },
    winner,
    margin: Math.abs(results1.totalTime - results2.totalTime)
  };
}

/**
 * Simulate battle using serialized weights (for server-side use)
 * Requires TensorFlow.js to be initialized
 * @param {number[][]} weights1 - Challenger's serialized weights
 * @param {number[][]} weights2 - Defender's serialized weights
 * @param {number} seed - Random seed
 * @returns {Object} Battle results
 */
export function simulateBattleFromWeights(weights1, weights2, seed) {
  // Create temporary models
  const model1 = GhostNetwork.createGhostNetwork();
  const model2 = GhostNetwork.createGhostNetwork();

  // Load weights
  GhostNetwork.deserializeWeights(model1, weights1);
  GhostNetwork.deserializeWeights(model2, weights2);

  // Run simulation
  const results = simulateBattle(model1, model2, seed);

  // Note: In browser, models should be disposed after use
  // model1.dispose(); model2.dispose();

  return results;
}

// ============================================
// ELO RATING SYSTEM
// ============================================

/**
 * Calculate expected score (probability of winning)
 * @param {number} ratingA - Player A's rating
 * @param {number} ratingB - Player B's rating
 * @returns {number} Expected score for player A (0-1)
 */
export function calculateExpected(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Update ratings after a battle
 * @param {number} ratingA - Challenger's current rating
 * @param {number} ratingB - Defender's current rating
 * @param {number} winner - 1 = A wins, 2 = B wins, 0 = draw
 * @param {number} battlesA - Challenger's total battles
 * @param {number} battlesB - Defender's total battles
 * @returns {Object} { newRatingA, newRatingB, changeA, changeB }
 */
export function updateRatings(ratingA, ratingB, winner, battlesA = 10, battlesB = 10) {
  // Use higher K-factor for newer ghosts
  const kA = battlesA < ELO_CONFIG.newGhostThreshold
    ? ELO_CONFIG.kFactorNew
    : ELO_CONFIG.kFactor;
  const kB = battlesB < ELO_CONFIG.newGhostThreshold
    ? ELO_CONFIG.kFactorNew
    : ELO_CONFIG.kFactor;

  const expectedA = calculateExpected(ratingA, ratingB);

  // Determine actual scores
  let scoreA, scoreB;
  if (winner === 1) {
    scoreA = 1;
    scoreB = 0;
  } else if (winner === 2) {
    scoreA = 0;
    scoreB = 1;
  } else {
    scoreA = 0.5;
    scoreB = 0.5;
  }

  // Calculate rating changes
  const changeA = Math.round(kA * (scoreA - expectedA));
  const changeB = Math.round(kB * (scoreB - (1 - expectedA)));

  return {
    newRatingA: ratingA + changeA,
    newRatingB: ratingB + changeB,
    changeA,
    changeB
  };
}

/**
 * Get rating tier for a given rating
 * @param {number} rating - Current rating
 * @returns {Object} { name, icon, min, max }
 */
export function getRatingTier(rating) {
  for (const tier of RATING_TIERS) {
    if (rating >= tier.min && rating <= tier.max) {
      return tier;
    }
  }
  return RATING_TIERS[0]; // Fallback to Bronze
}

// ============================================
// MATCHMAKING UTILITIES
// ============================================

/**
 * Find suitable opponent for random matchmaking
 * @param {Object[]} candidates - Array of { username, rating, lastBattle }
 * @param {number} playerRating - Player's rating
 * @param {number} ratingRange - Max rating difference (default 200)
 * @returns {Object|null} Best match or null
 */
export function findRandomOpponent(candidates, playerRating, ratingRange = 200) {
  if (!candidates || candidates.length === 0) return null;

  // Filter by rating range
  const inRange = candidates.filter(c =>
    Math.abs(c.rating - playerRating) <= ratingRange
  );

  if (inRange.length > 0) {
    // Prefer opponents who haven't battled recently
    inRange.sort((a, b) => {
      const aTime = a.lastBattle ? new Date(a.lastBattle).getTime() : 0;
      const bTime = b.lastBattle ? new Date(b.lastBattle).getTime() : 0;
      return aTime - bTime; // Oldest first
    });
    return inRange[0];
  }

  // Fallback: return closest rating
  candidates.sort((a, b) =>
    Math.abs(a.rating - playerRating) - Math.abs(b.rating - playerRating)
  );
  return candidates[0];
}

/**
 * Check if challenge is allowed (cooldown check)
 * @param {Date|string} lastBattle - Last battle timestamp
 * @param {string} challengeType - Type of challenge
 * @returns {Object} { allowed, cooldownRemaining }
 */
export function checkChallengeCooldown(lastBattle, challengeType) {
  if (!lastBattle) return { allowed: true, cooldownRemaining: 0 };

  const lastTime = new Date(lastBattle).getTime();
  const now = Date.now();

  // Cooldowns in milliseconds
  const cooldowns = {
    [CHALLENGE_TYPES.random]: 0,
    [CHALLENGE_TYPES.specific]: 60 * 60 * 1000,    // 1 hour
    [CHALLENGE_TYPES.rematch]: 10 * 60 * 1000,     // 10 minutes
    [CHALLENGE_TYPES.leaderboard]: 30 * 60 * 1000  // 30 minutes
  };

  const cooldown = cooldowns[challengeType] || 0;
  const elapsed = now - lastTime;

  if (elapsed >= cooldown) {
    return { allowed: true, cooldownRemaining: 0 };
  }

  return {
    allowed: false,
    cooldownRemaining: cooldown - elapsed
  };
}

// ============================================
// BATTLE LOG FORMATTING
// ============================================

/**
 * Format battle results for storage
 * @param {Object} battleResults - Raw simulation results
 * @param {string} challengerUsername - Challenger's username
 * @param {string} defenderUsername - Defender's username
 * @returns {Object} Formatted battle log
 */
export function formatBattleLog(battleResults, challengerUsername, defenderUsername) {
  return {
    seed: battleResults.seed,
    problems: battleResults.problems,
    summary: {
      challengerTotal: battleResults.challenger,
      defenderTotal: battleResults.defender,
      winner: battleResults.winner === 1 ? challengerUsername
        : battleResults.winner === 2 ? defenderUsername
        : null,
      winnerSide: battleResults.winner,
      margin: battleResults.margin
    }
  };
}

/**
 * Get battle summary for display
 * @param {Object} battle - Stored battle record
 * @returns {Object} Display-friendly summary
 */
export function getBattleSummary(battle) {
  return {
    id: battle.id,
    challenger: battle.challenger_username,
    defender: battle.defender_username,
    winner: battle.winner,
    winnerSide: battle.winner_side,
    challengerStats: {
      time: battle.challenger_time,
      correct: battle.challenger_correct,
      ratingBefore: battle.challenger_rating_before,
      ratingAfter: battle.challenger_rating_after,
      ratingChange: battle.challenger_rating_after - battle.challenger_rating_before
    },
    defenderStats: {
      time: battle.defender_time,
      correct: battle.defender_correct,
      ratingBefore: battle.defender_rating_before,
      ratingAfter: battle.defender_rating_after,
      ratingChange: battle.defender_rating_after - battle.defender_rating_before
    },
    margin: battle.margin,
    createdAt: battle.created_at
  };
}
