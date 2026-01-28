# King of the Hill Mode — Specification (v4.3)

## Overview

Alternative game mode where teams compete for control of "the hill" based on a rolling points window. Whoever has more points in the last N minutes holds the hill. Time spent holding accumulates toward victory.

This replaces the CTF tug-of-war with a mechanic where past performance fades, comebacks are always possible, and the final minutes are always decisive.

---

## Core Mechanic

```
┌─────────────────────────────────────────────────────────────────┐
│                         THE HILL ⛰️                              │
│                      [ BLUE HOLDS ]                              │
│                    held for: 4:32 total                          │
│                    current streak: 1:15                          │
│                                                                  │
│   BLUE (last 5 min)              RED (last 5 min)               │
│   ████████████████░░░░  67       ████████████░░░░░░░░  52       │
│                                                                  │
│   Session: 12:45 remaining                                       │
└─────────────────────────────────────────────────────────────────┘

- Points earned contribute to your team's ROLLING TOTAL
- Points older than 5 minutes DECAY (lose value over time)
- Team with higher rolling total HOLDS THE HILL
- While holding, your BANKED TIME increases
- Winner = team with most BANKED TIME at session end
```

---

## Rolling Window Calculation

### Point Decay Model

Each point has a timestamp. Its contribution to the rolling total depends on age:

```
contribution = base_points × decay_multiplier(age)

decay_multiplier(age):
  age < 3 min    → 1.0   (full value)
  age 3-5 min    → linear decay from 1.0 to 0.5
  age 5-7 min    → linear decay from 0.5 to 0.0
  age > 7 min    → 0.0   (fully decayed)
```

### Example

```
Time    Event                    Blue Rolling    Red Rolling
────────────────────────────────────────────────────────────
0:00    Session starts           0               0
0:30    Blue earns 4 pts         4               0
1:00    Red earns 6 pts          4               6         ← Red takes hill
2:00    Blue earns 8 pts         12              6         ← Blue takes hill
3:30    Blue's first pts decay   10.5            5.25
5:30    Blue's first pts gone    8               0         ← Red's pts also gone
```

### Recalculation Frequency

- Server recalculates rolling totals every **5 seconds**
- Hill holder can change at any recalculation
- Broadcast `koth_hill_changed` when holder flips

---

## Banked Time

While holding the hill, your team accumulates **banked time** at 1:1 rate.

```
Blue holds hill from 2:00 to 5:30 → Blue banks 3:30
Red holds hill from 5:30 to 8:00 → Red banks 2:30
Blue holds hill from 8:00 to 10:00 → Blue banks 2:00 more (total: 5:30)

Session ends at 10:00
Blue banked time: 5:30
Red banked time: 2:30
BLUE WINS
```

### Contested State

If rolling totals are **exactly equal** (rare), the hill is **contested**:
- No team holds
- No time banks
- Visual shows "⚔️ CONTESTED"

---

## Win Conditions

### At Session End

| Condition | Result |
|-----------|--------|
| Blue banked > Red banked | Blue wins |
| Red banked > Blue banked | Red wins |
| Difference ≤ 30 seconds | **Tiebreaker** |

### During Session

No early victory—session always runs to scheduled end.

---

## Tiebreaker Trigger

Tiebreaker activates if banked time difference is **≤ 30 seconds** at session end.

Same tiebreaker flow as CTF:
- Top 3 by point-velocity from each team
- Ready check (30 sec)
- Best of 3 minigame matches
- Selected minigame (Pong, Quick Calc, or Reflex)

---

## Database Schema

### New `koth_games` table

```sql
CREATE TABLE koth_games (
    cartridge_id VARCHAR(100) PRIMARY KEY,
    session_status VARCHAR(20) DEFAULT 'scheduled',
    start_time TIME,
    end_time TIME,
    session_started_at TIMESTAMPTZ,
    session_ended_at TIMESTAMPTZ,
    
    -- Hill state
    current_holder VARCHAR(10),        -- 'blue', 'red', null (contested)
    holder_since TIMESTAMPTZ,
    blue_banked_seconds INT DEFAULT 0,
    red_banked_seconds INT DEFAULT 0,
    
    -- Config
    window_minutes INT DEFAULT 5,
    decay_start_minutes INT DEFAULT 3,
    decay_end_minutes INT DEFAULT 7,
    
    -- Result
    winner VARCHAR(10),
    end_reason VARCHAR(20),
    tiebreaker_winner VARCHAR(10),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New `koth_points` table

```sql
CREATE TABLE koth_points (
    id SERIAL PRIMARY KEY,
    cartridge_id VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    team VARCHAR(10) NOT NULL,
    points INT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Denormalized for fast queries
    decayed_value DECIMAL(5,2),        -- Current contribution (updated periodically)
    fully_decayed_at TIMESTAMPTZ,      -- When this will hit 0
    
    INDEX idx_koth_points_cartridge_time (cartridge_id, earned_at DESC)
);
```

### Modify `koth_players` table

```sql
CREATE TABLE koth_players (
    cartridge_id VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    team VARCHAR(10),
    total_points INT DEFAULT 0,         -- Lifetime (for velocity calc)
    session_points INT DEFAULT 0,       -- This session only
    first_point_at TIMESTAMPTZ,
    
    PRIMARY KEY (cartridge_id, username)
);
```

---

## API Endpoints

### Session Management

Same pattern as CTF:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/koth/:cartridgeId/session/configure` | Set times, window size |
| `POST` | `/api/koth/:cartridgeId/session/start` | Manual start |
| `POST` | `/api/koth/:cartridgeId/session/stop` | Manual stop |
| `GET` | `/api/koth/:cartridgeId/session/status` | Current state |

### Points

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/koth/:cartridgeId/points` | Submit points (from star earned) |
| `GET` | `/api/koth/:cartridgeId/rolling` | Get current rolling totals |

#### Rolling Response

```json
GET /api/koth/:cartridgeId/rolling
{
    "blue": {
        "rollingTotal": 67,
        "bankedSeconds": 245,
        "recentPoints": [
            {"username": "Alice", "points": 4, "age": 45, "contribution": 4.0},
            {"username": "Bob", "points": 3, "age": 180, "contribution": 2.8}
        ]
    },
    "red": {
        "rollingTotal": 52,
        "bankedSeconds": 198,
        "recentPoints": [...]
    },
    "currentHolder": "blue",
    "holderSince": "2026-01-18T09:32:15Z",
    "contested": false
}
```

---

## WebSocket Messages

| Message | Trigger | Payload |
|---------|---------|---------|
| `koth_session_started` | Session begins | `{cartridgeId, startedAt, endTime, windowMinutes}` |
| `koth_points_added` | Points earned | `{cartridgeId, username, team, points, newRolling}` |
| `koth_hill_changed` | Holder flips | `{cartridgeId, newHolder, blueBanked, redBanked}` |
| `koth_rolling_update` | Every 5 sec | `{cartridgeId, blueRolling, redRolling, holder}` |
| `koth_session_ending_soon` | 5min/1min warning | `{cartridgeId, secondsRemaining}` |
| `koth_session_ended` | Session complete | `{cartridgeId, winner, blueBanked, redBanked, tiebreaker}` |

---

## UI Components

### Hill Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                            ⛰️                                    │
│                      ┌──────────┐                               │
│                      │  BLUE    │                               │
│                      │  HOLDS   │                               │
│                      └──────────┘                               │
│                       streak: 1:23                              │
│                                                                  │
│   BLUE ████████████████████░░░░░░░░░░  67 pts                   │
│   RED  █████████████░░░░░░░░░░░░░░░░░  52 pts                   │
│                                                                  │
│   ⏱️ Blue banked: 5:32    ⏱️ Red banked: 3:18                    │
│                                                                  │
│                    Session ends in 8:45                          │
└─────────────────────────────────────────────────────────────────┘
```

### Point Decay Visualization

Show recent points as fading bars or particles that shrink over time—makes the decay mechanic viscerally clear.

### Momentum Indicator

Optional: Show "Blue is heating up! 🔥" when one team has earned 3+ consecutive points, or "Red surging!" when they're about to flip the hill.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No points earned all session | Both teams have 0 banked time → draw |
| Only one team earns points | That team holds entire session → clear win |
| Hill flips in final second | Last holder at exact end time wins |
| Identical rolling totals | Contested state, no one banks time |
| Server restart mid-session | Restore from DB, recalculate rolling from `koth_points` |

---

## Tunable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `window_minutes` | 5 | How long points contribute at full value |
| `decay_start_minutes` | 3 | When decay begins |
| `decay_end_minutes` | 7 | When points fully expire |
| `tiebreaker_threshold_seconds` | 30 | Max difference to trigger tiebreaker |
| `rolling_update_interval_ms` | 5000 | How often to recalculate/broadcast |

Teachers could eventually adjust these, but start with sensible defaults.

---

## Comparison: CTF vs KotH

| Aspect | CTF | KotH |
|--------|-----|------|
| Early effort | Permanent | Fades over time |
| Comeback potential | Requires grind | One hot streak |
| End-game feel | Tiebreaker drama | Final 5 min = everything |
| Demoralization risk | Medium (rubber banding helps) | Very low |
| Rewards | Consistency | Clutch performance |
| Visual | Line moving | Hill control + timers |
| Complexity | Simpler | More state to track |

---

## Implementation Priority

1. Core rolling calculation + hill state
2. Banked time accumulation
3. Basic UI (hill holder, rolling bars, banked time)
4. WebSocket broadcasts
5. Session lifecycle (reuse CTF patterns)
6. Tiebreaker integration (reuse existing)
7. Point decay visualization (polish)
