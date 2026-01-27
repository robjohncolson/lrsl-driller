# Ghost System Phase 6: Battle Simulation Engine

Technical specification for ghost-vs-ghost battle simulation system.

**Version**: 1.0.0
**Date**: January 2026
**Prerequisites**: Phase 1-2 (Ghost Profile Infrastructure, Neural Network)

---

## 1. Overview

Ghost battles are asynchronous competitions where two ghosts "race" through simulated problem sequences. Each ghost's neural network predictions determine how quickly and accurately they solve problems, with stochastic elements adding variety to outcomes.

### Design Goals

1. **Asynchronous**: Battles run server-side, no need for both students to be online
2. **Predictable Fairness**: Same ghost profiles should produce similar (but not identical) outcomes
3. **Narrative Rich**: Battles tell a story - see personality differences play out
4. **Low Computation**: Battle simulation runs in <100ms on server

### Battle Flow

```
Challenge Issued → Battle Queued → Simulation Runs → Results Stored
                                        ↓
                            Both students notified via WebSocket
```

---

## 2. Battle Mechanics

### 2.1 Problem Sequence Generation

Each battle generates a sequence of 10 simulated problems across different difficulty tiers:

```javascript
const BATTLE_SEQUENCE = {
  problemCount: 10,
  distribution: {
    easy: 3,      // Levels 1-5 (normalized 0.0-0.33)
    medium: 4,    // Levels 6-12 (normalized 0.33-0.66)
    hard: 3       // Levels 13-24 (normalized 0.66-1.0)
  }
};
```

Each problem is represented as a normalized input vector matching the ghost network's 10 features:

```javascript
function generateBattleProblem(difficulty) {
  return [
    difficulty,                     // level_progress (0-1)
    Math.random() * 0.5,           // time_in_session (early-mid)
    Math.random() * 0.4,           // current_streak (0-4)
    0.7 + Math.random() * 0.3,     // recent_accuracy (0.7-1.0)
    1.0,                           // hints_remaining (no hints in battle)
    Math.random() * 0.3,           // problems_this_session (early)
    0,                             // retry_count (first attempt)
    0.7 + Math.random() * 0.3,     // session_accuracy (good)
    0.5,                           // time_of_day (neutral)
    difficulty                     // level_tier matches difficulty
  ];
}
```

### 2.2 Ghost Prediction to Outcome

For each problem, we run the ghost's neural network to get predictions:

```javascript
const prediction = {
  time: 30,           // Predicted seconds to answer
  correctProb: 0.85,  // Probability of correct answer
  hintProb: 0.1,      // Probability of using hint (ignored in battle)
  quickProb: 0.6      // Probability of fast answer
};
```

### 2.3 Stochastic Resolution Algorithm

The resolution algorithm adds controlled randomness to make battles exciting while maintaining fairness:

```javascript
function resolveProblem(prediction, problemDifficulty) {
  // 1. Determine if answer is correct (random sample from correctProb)
  const isCorrect = Math.random() < prediction.correctProb;

  // 2. Calculate base time with variance
  const baseTime = prediction.time;
  const variance = baseTime * 0.2; // 20% variance
  let actualTime = baseTime + (Math.random() * 2 - 1) * variance;

  // 3. Apply difficulty modifier (harder = slower)
  actualTime *= (1 + problemDifficulty * 0.3);

  // 4. Quick answer bonus (if quickProb triggers)
  if (Math.random() < prediction.quickProb) {
    actualTime *= 0.7; // 30% faster
  }

  // 5. Incorrect answer penalty (backtrack simulation)
  if (!isCorrect) {
    actualTime *= 1.5; // 50% time penalty
  }

  return {
    time: Math.max(5, actualTime), // Minimum 5 seconds
    correct: isCorrect
  };
}
```

### 2.4 Battle Resolution

```javascript
function simulateBattle(ghost1Weights, ghost2Weights, seed) {
  // Use seeded RNG for reproducibility
  const rng = new SeededRNG(seed);

  // Generate problem sequence (same for both ghosts)
  const problems = generateBattleSequence(rng);

  // Run each ghost through sequence
  const results1 = runGhostThrough(ghost1Weights, problems, rng.fork());
  const results2 = runGhostThrough(ghost2Weights, problems, rng.fork());

  return {
    ghost1: {
      totalTime: results1.totalTime,
      correctCount: results1.correctCount,
      timeline: results1.timeline
    },
    ghost2: {
      totalTime: results2.totalTime,
      correctCount: results2.correctCount,
      timeline: results2.timeline
    },
    winner: determineWinner(results1, results2),
    margin: Math.abs(results1.totalTime - results2.totalTime)
  };
}

function determineWinner(results1, results2) {
  // Primary: More correct answers wins
  if (results1.correctCount !== results2.correctCount) {
    return results1.correctCount > results2.correctCount ? 1 : 2;
  }

  // Tiebreaker: Faster total time wins
  if (Math.abs(results1.totalTime - results2.totalTime) > 1) {
    return results1.totalTime < results2.totalTime ? 1 : 2;
  }

  // Draw (within 1 second)
  return 0;
}
```

---

## 3. Elo-Style Rating System

### 3.1 Rating Calculations

Use standard Elo with K-factor adjusted for battle volatility:

```javascript
const ELO_CONFIG = {
  initialRating: 1200,
  kFactor: 32,           // Standard K-factor
  kFactorNew: 40,        // Higher for new ghosts (<10 battles)
  drawMargin: 16         // Points traded in draw
};

function calculateExpected(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateRatings(ratingA, ratingB, winner, battleCount) {
  const k = battleCount < 10 ? ELO_CONFIG.kFactorNew : ELO_CONFIG.kFactor;
  const expected = calculateExpected(ratingA, ratingB);

  let scoreA, scoreB;
  if (winner === 1) {
    scoreA = 1; scoreB = 0;
  } else if (winner === 2) {
    scoreA = 0; scoreB = 1;
  } else {
    scoreA = 0.5; scoreB = 0.5;
  }

  return {
    newRatingA: Math.round(ratingA + k * (scoreA - expected)),
    newRatingB: Math.round(ratingB + k * (scoreB - (1 - expected)))
  };
}
```

### 3.2 Rating Display Tiers

| Rating Range | Tier Name | Icon |
|--------------|-----------|------|
| < 1000 | Bronze | Bronze Medal |
| 1000-1199 | Silver | Silver Medal |
| 1200-1399 | Gold | Gold Medal |
| 1400-1599 | Platinum | Platinum Medal |
| 1600+ | Diamond | Diamond Medal |

---

## 4. Challenge System

### 4.1 Challenge Types

```javascript
const CHALLENGE_TYPES = {
  random: 'random',       // Matched with random opponent
  specific: 'specific',   // Challenge specific username
  rematch: 'rematch',     // Rematch previous opponent
  leaderboard: 'leaderboard' // Challenge someone on leaderboard
};
```

### 4.2 Matchmaking Rules

**Random Matchmaking:**
1. Find ghosts within 200 Elo points
2. Prefer ghosts that haven't battled recently
3. Fallback to any ghost in cartridge if no close matches

**Specific Challenges:**
1. Can challenge any ghost in same cartridge
2. Challenged player gets WebSocket notification
3. Battle runs immediately (asynchronous)

### 4.3 Challenge Cooldowns

- Random battles: No cooldown
- Specific player: 1 hour cooldown per pair
- Rematch: 10 minute cooldown

---

## 5. Database Schema

### 5.1 ghost_battles Table

```sql
CREATE TABLE IF NOT EXISTS ghost_battles (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,

  -- Participants
  challenger_username VARCHAR(50) NOT NULL,
  defender_username VARCHAR(50) NOT NULL,

  -- Battle config
  challenge_type VARCHAR(20) NOT NULL,
  seed BIGINT NOT NULL,  -- For reproducibility

  -- Results
  winner VARCHAR(50),  -- NULL for draw
  winner_side INTEGER, -- 1 = challenger, 2 = defender, 0 = draw

  -- Stats
  challenger_time FLOAT NOT NULL,
  challenger_correct INTEGER NOT NULL,
  defender_time FLOAT NOT NULL,
  defender_correct INTEGER NOT NULL,
  margin FLOAT NOT NULL,

  -- Ratings (snapshot at battle time)
  challenger_rating_before INTEGER NOT NULL,
  defender_rating_before INTEGER NOT NULL,
  challenger_rating_after INTEGER NOT NULL,
  defender_rating_after INTEGER NOT NULL,

  -- Timeline data (JSON array of problem results)
  battle_log JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes will be added separately
  CONSTRAINT valid_winner_side CHECK (winner_side IN (0, 1, 2))
);

-- Indexes for common queries
CREATE INDEX idx_ghost_battles_cartridge ON ghost_battles(cartridge_id);
CREATE INDEX idx_ghost_battles_challenger ON ghost_battles(challenger_username);
CREATE INDEX idx_ghost_battles_defender ON ghost_battles(defender_username);
CREATE INDEX idx_ghost_battles_created ON ghost_battles(created_at DESC);
```

### 5.2 ghost_ratings Table

```sql
CREATE TABLE IF NOT EXISTS ghost_ratings (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  cartridge_id VARCHAR(100) NOT NULL,

  -- Rating data
  rating INTEGER DEFAULT 1200,
  battles_fought INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,

  -- Streak tracking
  current_streak INTEGER DEFAULT 0,  -- Positive = wins, negative = losses
  best_streak INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(username, cartridge_id)
);

-- Index for leaderboard
CREATE INDEX idx_ghost_ratings_leaderboard ON ghost_ratings(cartridge_id, rating DESC);
```

---

## 6. Server Endpoints

### 6.1 Challenge Endpoints

```
POST /api/ghost/:cartridgeId/battle/challenge
  Body: { username, opponentUsername?, challengeType }
  Response: { battleId, status: 'queued' | 'complete', result? }

GET /api/ghost/:cartridgeId/battle/:battleId
  Response: { battle details, full timeline }

GET /api/ghost/:cartridgeId/battle/history/:username
  Query: { limit?, offset? }
  Response: { battles: [...], total }

GET /api/ghost/:cartridgeId/battle/rating/:username
  Response: { rating, tier, battles_fought, wins, losses, draws, streak }

GET /api/ghost/:cartridgeId/battle/leaderboard
  Query: { class_period?, limit? }
  Response: { rankings: [...] }
```

### 6.2 WebSocket Messages

```javascript
// Battle started
{
  type: 'ghost_battle_started',
  battleId: 123,
  cartridgeId: 'sampling',
  challenger: 'alice',
  defender: 'bob'
}

// Battle complete
{
  type: 'ghost_battle_complete',
  battleId: 123,
  cartridgeId: 'sampling',
  winner: 'alice',  // or null for draw
  winnerSide: 1,    // 1=challenger, 2=defender, 0=draw
  challengerStats: { time: 245, correct: 8, ratingChange: +18 },
  defenderStats: { time: 267, correct: 7, ratingChange: -18 }
}

// Challenge received (to defender)
{
  type: 'ghost_battle_challenge',
  battleId: 123,
  cartridgeId: 'sampling',
  challenger: 'alice',
  challengerRating: 1350
}
```

---

## 7. Battle Timeline Data Structure

Each battle stores a detailed timeline for replay/analysis:

```javascript
const battleLog = {
  seed: 1706388000000,
  problems: [
    {
      index: 0,
      difficulty: 0.2,
      inputs: [/* 10 normalized values */],
      challenger: {
        time: 12.3,
        correct: true,
        prediction: { time: 15, correctProb: 0.92, quickProb: 0.6 }
      },
      defender: {
        time: 14.1,
        correct: true,
        prediction: { time: 18, correctProb: 0.85, quickProb: 0.4 }
      }
    },
    // ... 9 more problems
  ],
  summary: {
    challengerTotal: { time: 245.3, correct: 8 },
    defenderTotal: { time: 267.8, correct: 7 },
    winner: 'challenger',
    margin: 22.5
  }
};
```

---

## 8. Implementation Files

### 8.1 Client-Side

`platform/core/ghost-battle-engine.js`:
- `simulateBattle(ghost1Weights, ghost2Weights, seed)` - Core simulation
- `generateBattleSequence(rng)` - Problem generation
- `resolveProblem(prediction, difficulty, rng)` - Stochastic resolution
- `calculateRatings(ratingA, ratingB, winner)` - Elo calculations
- Utility: SeededRNG class for reproducible randomness

### 8.2 Server-Side

Added to `railway-server/server.js`:
- `POST /api/ghost/:cartridgeId/battle/challenge` - Start battle
- `GET /api/ghost/:cartridgeId/battle/:battleId` - Get battle details
- `GET /api/ghost/:cartridgeId/battle/history/:username` - User's battle history
- `GET /api/ghost/:cartridgeId/battle/rating/:username` - User's rating
- `GET /api/ghost/:cartridgeId/battle/leaderboard` - Rating leaderboard

### 8.3 Database Migration

`railway-server/migrations/014_ghost_battles.sql`:
- `ghost_battles` table
- `ghost_ratings` table
- Indexes for efficient queries

---

## 9. Security Considerations

### 9.1 Battle Integrity

- Server generates seed, not client
- Ghost weights loaded fresh from database (not from client)
- Battle results validated before storing

### 9.2 Rate Limiting

- Max 10 battles per user per hour
- Max 3 battles against same opponent per hour
- Cooldowns enforced server-side

### 9.3 Anti-Cheating

- Ghost profiles are validated (weight array sizes)
- Proficiency scores recalculated server-side
- Suspicious rating changes flagged for review

---

## 10. Future Enhancements

### Phase 6.1: Tournament Mode
- Bracket-style tournaments
- Scheduled class-wide competitions
- Teacher-initiated events

### Phase 6.2: Team Battles
- Combine multiple ghosts for team score
- Class vs class competitions

### Phase 6.3: Battle Visualization
- Three.js replay of battles
- Ghost "personalities" visible through movement patterns
- Speed/accuracy tradeoffs visualized

---

## 11. Test Plan

### Unit Tests
1. Problem sequence generation distribution
2. Stochastic resolution bounds
3. Elo calculation correctness
4. SeededRNG reproducibility
5. Winner determination logic

### Integration Tests
1. Full battle simulation end-to-end
2. Database persistence
3. Rating updates after battle
4. WebSocket notifications

### Load Tests
1. 100 concurrent battle simulations
2. Leaderboard queries with 1000+ ghosts

---

*This specification is part of the Ghost System implementation. See `ghost-system-spec.md` for the overall vision.*
