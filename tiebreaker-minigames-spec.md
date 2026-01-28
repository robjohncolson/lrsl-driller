# Tiebreaker Minigames — Specification (v4.3)

## Overview

Modular tiebreaker system allowing teachers to select which minigame determines the winner when a session ends in a tie condition. All minigames follow the same outer structure (best of 3, champion selection by velocity) but differ in core mechanic.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIEBREAKER MANAGER                            │
│              (shared flow, game-agnostic)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌───────────┐     ┌───────────┐     ┌───────────┐
    │   PONG    │     │   QUICK   │     │  REFLEX   │
    │   DUEL    │     │   CALC    │     │   DUEL    │
    └───────────┘     └───────────┘     └───────────┘
```

### Shared Tiebreaker Flow

All minigames use this outer structure:

```
SESSION ENDS IN TIE CONDITION
            │
            ▼
┌─────────────────────────────┐
│  SELECT CHAMPIONS           │
│  Top 3 by point-velocity    │
│  from each team             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  READY CHECK (30 sec)       │
│  Champions confirm presence │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  BEST OF 3 MATCHES          │
│  #1 vs #1, #2 vs #2, etc.   │
│  First team to 2 wins       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  DECLARE WINNER             │
└─────────────────────────────┘
```

---

## Minigame 1: Pong Duel

### Already Specified in v4.2

Classic paddle-and-ball game. First to 5 points wins the match.

| Property | Value |
|----------|-------|
| Points to win | 5 |
| Estimated duration | 30-40 sec |
| Skill tested | Reflexes, prediction |
| Input | Arrow keys / touch drag |
| Accessibility | High—universal familiarity |

---

## Minigame 2: Quick Calc

### Core Mechanic

Both players see the same math problem simultaneously. First to submit the correct answer wins the point. First to 5 points wins the match.

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUICK CALC                                │
│                                                                  │
│                         47 + 86 = ?                              │
│                                                                  │
│   BLUE: Alice                        RED: Marcus                 │
│   [ 133       ]  ✓                   [           ]              │
│                                                                  │
│   Score: 2                           Score: 1                    │
│                                                                  │
│                      First to 5 wins                             │
└─────────────────────────────────────────────────────────────────┘
```

### Question Types

Pull from difficulty tiers appropriate to the cartridge/class:

| Tier | Example | Target Time |
|------|---------|-------------|
| Basic | `23 + 45` | 2-3 sec |
| Medium | `17 × 8` | 3-5 sec |
| Hard | `144 ÷ 12` | 4-6 sec |
| Challenge | `√169` | 5-8 sec |

For **AP Stats**: Could include quick probability (`P(heads twice) = ?`), basic z-scores, or reading simple tables.

For **Algebra 2**: Could include evaluating expressions (`f(3) where f(x) = 2x + 1`), simple factoring recognition.

### Question Source Options

1. **Built-in arithmetic** — Random generation, no cartridge dependency
2. **Cartridge questions** — Pull from current cartridge's question bank (simplified/shortened)
3. **Teacher-defined pool** — Custom Quick Calc question set

Default: Built-in arithmetic (fast, always available, fair).

### Rules

- Both players see question at exact same moment
- Input: number pad / keyboard
- Submit: Enter key or "Submit" button
- **Wrong answer**: 1-second lockout before can try again
- **Correct answer**: Wins the point, next question loads
- No partial credit
- Timeout: 15 seconds → neither scores, next question

### Spectator View

Non-participants see:
- The question
- Who buzzed in first (anonymized as "Blue answered!")
- Running score

### State Machine

```
┌─────────────┐     question shown     ┌─────────────┐
│   READY     │ ─────────────────────▶ │   ACTIVE    │
│ "Get ready" │                        │  answering  │
└─────────────┘                        └──────┬──────┘
                                              │
                           ┌──────────────────┼──────────────────┐
                           │                  │                  │
                           ▼                  ▼                  ▼
                    ┌────────────┐     ┌────────────┐     ┌────────────┐
                    │ Blue wins  │     │ Red wins   │     │  Timeout   │
                    │ point      │     │ point      │     │ (15 sec)   │
                    └─────┬──────┘     └─────┬──────┘     └─────┬──────┘
                          │                  │                  │
                          └──────────────────┼──────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  Check score    │
                                    │  ≥5 = match won │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                       ┌────────────┐                ┌────────────┐
                       │ MATCH OVER │                │ NEXT Q     │
                       └────────────┘                │ (1s delay) │
                                                     └────────────┘
```

### Database

```sql
-- Add to tiebreaker_matches table
question_type VARCHAR(20),     -- 'pong', 'quickcalc', 'reflex'
questions_shown INT,           -- For quickcalc: how many Qs in match
correct_blue INT,              -- Blue's correct answers
correct_red INT,               -- Red's correct answers
```

### WebSocket Messages

| Message | Payload |
|---------|---------|
| `quickcalc_question` | `{question, questionId, matchNumber}` |
| `quickcalc_answered` | `{answerer: 'blue'/'red', correct: bool, newScore}` |
| `quickcalc_timeout` | `{questionId}` |

---

## Minigame 3: Reflex Duel

### Core Mechanic

Pure reaction time. Screen shows "WAIT..." then flashes a color. First to tap/click wins the point. **But**: tap too early (before flash) = opponent gets the point.

```
┌─────────────────────────────────────────────────────────────────┐
│                       REFLEX DUEL                                │
│                                                                  │
│                                                                  │
│                                                                  │
│                        WAIT . . .                                │
│                                                                  │
│                   (screen will flash green)                      │
│                                                                  │
│                                                                  │
│   BLUE: Alice                        RED: Marcus                 │
│   Score: 2                           Score: 3                    │
│                                                                  │
│                      First to 5 wins                             │
└─────────────────────────────────────────────────────────────────┘

            ↓ Random delay (1.5 - 4 sec) ↓

┌─────────────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░  ██████  TAP NOW!  ██████  ░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────────────────────────────┘
```

### Rules

- Random delay between "WAIT" and flash: **1.5 to 4 seconds**
- Flash color: Bright green (high contrast, accessible)
- Input: Any key press, mouse click, or screen tap
- **Early tap** (before flash): Opponent wins point ("False start!")
- **First tap after flash**: Wins point
- **Neither taps within 2 sec**: Redraw (no point)
- Match: First to 5 points

### Why This Works

- Zero knowledge barrier—pure human reaction
- Extremely fair across skill levels
- Creates tension during the wait
- Quick rounds (each ~3-6 seconds)
- Mobile-friendly (tap)

### False Start Psychology

The early-tap penalty creates risk/reward: aggressive players might false-start, cautious players might be slower. Adds a tiny strategic layer to pure reflex.

### State Machine

```
┌─────────────┐     start round      ┌─────────────┐
│   READY     │ ───────────────────▶ │   WAITING   │
│ "Round X"   │                      │  (1.5-4s)   │
└─────────────┘                      └──────┬──────┘
                                            │
                      ┌─────────────────────┼────────────────────┐
                      │                     │                    │
                      ▼                     ▼                    │
               ┌────────────┐        ┌────────────┐              │
               │ Early tap! │        │   FLASH    │              │
               │ Opponent   │        │  (green)   │              │
               │ scores     │        └─────┬──────┘              │
               └─────┬──────┘              │                     │
                     │        ┌────────────┼────────────┐        │
                     │        ▼            ▼            ▼        │
                     │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
                     │  │Blue taps │ │Red taps  │ │ Timeout  │   │
                     │  │first     │ │first     │ │ (2 sec)  │   │
                     │  └────┬─────┘ └────┬─────┘ └────┬─────┘   │
                     │       │            │            │         │
                     └───────┴─────┬──────┴────────────┘         │
                                   │                             │
                                   ▼                             │
                          ┌─────────────────┐                    │
                          │  Check score    │                    │
                          │  ≥5 = match won │                    │
                          └────────┬────────┘                    │
                                   │                             │
                    ┌──────────────┴──────────────┐              │
                    ▼                             ▼              │
             ┌────────────┐                ┌────────────┐        │
             │ MATCH OVER │                │ NEXT ROUND │────────┘
             └────────────┘                │ (1s delay) │
                                           └────────────┘
```

### Timing Precision

Reaction times are often <300ms. Server needs to timestamp tap events carefully:
- Client sends tap with local timestamp
- Server records receipt time
- For fairness, use **server receipt time** as arbiter (both players have same network latency variance)

Or: Both clients send tap, server compares timestamps. First timestamp wins. If within 20ms, call it a tie → redraw.

### WebSocket Messages

| Message | Payload |
|---------|---------|
| `reflex_round_start` | `{roundNumber, matchNumber}` |
| `reflex_flash` | `{flashTime}` (server timestamp) |
| `reflex_tap` | `{player: 'blue'/'red', time, isFalseStart: bool}` |
| `reflex_round_result` | `{winner: 'blue'/'red'/null, reaction_ms, newScore}` |

### Accessibility Note

For students with motor impairments, Reflex Duel might be unfair. Teacher can choose a different tiebreaker (Quick Calc or Pong) if needed.

---

## Configuration Schema

```javascript
// shared/tiebreaker.config.js

export const TIEBREAKER_GAMES = {
  pong: {
    id: 'pong',
    name: 'Pong Duel',
    description: 'Classic paddle game',
    icon: '🏓',
    pointsToWin: 5,
    estimatedSeconds: 35,
    skillTested: 'Reflexes, prediction',
    accessibility: 'high'
  },
  
  quickcalc: {
    id: 'quickcalc',
    name: 'Quick Calc',
    description: 'Race to solve math problems',
    icon: '🔢',
    pointsToWin: 5,
    estimatedSeconds: 45,
    skillTested: 'Mental math speed',
    accessibility: 'high',
    settings: {
      questionSource: 'builtin',  // 'builtin', 'cartridge', 'custom'
      difficulty: 'medium',       // 'basic', 'medium', 'hard', 'challenge'
      timeoutSeconds: 15,
      wrongAnswerLockoutMs: 1000
    }
  },
  
  reflex: {
    id: 'reflex',
    name: 'Reflex Duel',
    description: 'React when the screen flashes',
    icon: '⚡',
    pointsToWin: 5,
    estimatedSeconds: 30,
    skillTested: 'Pure reaction time',
    accessibility: 'medium',  // Motor impairment concern
    settings: {
      minDelayMs: 1500,
      maxDelayMs: 4000,
      flashDurationMs: 2000,
      tieThresholdMs: 20
    }
  }
};

export const DEFAULT_TIEBREAKER = 'pong';
```

---

## Teacher Selection UI

```
┌─────────────────────────────────────────────────────────────────┐
│  TIEBREAKER GAME                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ○ 🏓 Pong Duel                                                  │
│      Classic paddle game. Tests reflexes and prediction.         │
│      ~35 seconds per match.                                      │
│                                                                  │
│  ● 🔢 Quick Calc                                                 │
│      Race to solve math problems. First correct answer wins.     │
│      ~45 seconds per match. [Difficulty: Medium ▼]               │
│                                                                  │
│  ○ ⚡ Reflex Duel                                                │
│      React when screen flashes. Pure speed test.                 │
│      ~30 seconds per match.                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Changes

### Modify `tiebreaker_config` in game tables

```sql
-- Add to ctf_games and koth_games
ALTER TABLE ctf_games ADD COLUMN tiebreaker_game VARCHAR(20) DEFAULT 'pong';
ALTER TABLE koth_games ADD COLUMN tiebreaker_game VARCHAR(20) DEFAULT 'pong';
```

### Modify `tiebreaker_matches` table

```sql
ALTER TABLE ctf_tiebreaker_matches 
  RENAME TO tiebreaker_matches;

ALTER TABLE tiebreaker_matches 
  ADD COLUMN game_mode VARCHAR(20) NOT NULL DEFAULT 'ctf',  -- 'ctf', 'koth'
  ADD COLUMN minigame VARCHAR(20) NOT NULL DEFAULT 'pong',  -- 'pong', 'quickcalc', 'reflex'
  ADD COLUMN extra_data JSONB;  -- Game-specific details

-- extra_data examples:
-- Pong: {"rallies": 23, "longest_rally": 8}
-- Quick Calc: {"questions_shown": 7, "blue_correct": 5, "red_correct": 3}
-- Reflex: {"rounds": 8, "avg_reaction_blue": 245, "avg_reaction_red": 268, "false_starts": 1}
```

---

## Testing Checklist

### Quick Calc
- [ ] Question displays simultaneously to both players
- [ ] Correct answer awards point
- [ ] Wrong answer triggers lockout
- [ ] Lockout expires after 1 second
- [ ] Timeout after 15 seconds advances to next question
- [ ] First to 5 points wins match
- [ ] Spectators see question and score updates

### Reflex Duel
- [ ] Random delay between 1.5-4 seconds
- [ ] Flash is clearly visible
- [ ] First tap after flash wins point
- [ ] Early tap (before flash) awards point to opponent
- [ ] Tie (within 20ms) triggers redraw
- [ ] Timeout (no tap within 2s) triggers redraw
- [ ] First to 5 points wins match
- [ ] Spectators see flash and results

### Integration
- [ ] Teacher can select tiebreaker game in session config
- [ ] Selected game is stored in database
- [ ] Correct minigame loads when tiebreaker triggers
- [ ] Results recorded with minigame type
- [ ] All three games work with CTF mode
- [ ] All three games work with KotH mode
