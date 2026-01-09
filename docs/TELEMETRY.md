# Grid Wars Telemetry Guide

## Overview

Telemetry flushes every 5 minutes as a JSON line to console (or Supabase if `ENABLE_TELEMETRY_DB=true`).

Each flush includes:
- Event counters (reset after each flush)
- Aggregate metrics (computed at flush time)

## Event Counters (per flush period)

| Metric | Description | Healthy Range |
|--------|-------------|---------------|
| `claims_total` | Neutral cell claims | 10-50 per 5min |
| `takeovers_total` | Enemy cell overwrites | 5-20 per 5min |
| `takeovers_by_tier` | Breakdown by defender tier | COLD > WARM > ACTIVE |
| `afk_erosions_total` | Cells lost to inactivity | 0-10 per 5min |
| `cooldowns_triggered` | Spam prevention activations | <5 per session |
| `surges_activated` | Teacher-triggered surges | Teacher discretion |
| `auto_surges_triggered` | System-triggered surges on stagnation | 0-2 per session |
| `class_goals_reached` | Milestone completions | 1-3 per session |
| `points_earned_total` | Total points from stars | Varies by class size |
| `underdog_assists` | Comeback discounts applied | Varies |

## Aggregate Metrics (computed at flush)

| Metric | Description | Warning Threshold |
|--------|-------------|-------------------|
| `map_fill_percent` | Owned cells / 400 | >0.90 for >15min = stagnant |
| `active_players_5min` | Players who answered recently | <50% of connected = disengaged |
| `cells_changed_5min` | Ownership changes | <5 = stagnant |
| `median_time_to_first_claim` | Onboarding friction (ms) | >180000ms (3min) = friction |
| `avg_points_at_session_end` | Inflation indicator | Trending up = ceiling too weak |

## Configuration

Telemetry settings in `shared/gridwars.config.js`:

```javascript
telemetryEnabled: true,
telemetryFlushIntervalMs: 300000,  // 5 minutes
```

Auto-surge triggers when stagnation detected:

```javascript
autoSurgeEnabled: true,
autoSurgeFillThreshold: 0.85,      // Map fill % to trigger (85%)
autoSurgeChurnThreshold: 5,        // cells_changed_5min below this
autoSurgeCellCount: 2,             // Number of surge cells to spawn
autoSurgeCooldownMs: 600000,       // 10 minutes between auto-surges
```

## Diagnostic Scenarios

### "Map feels static"
**Check:** `map_fill_percent > 0.90` AND `cells_changed_5min < 5`

**Action:** Auto-surge will trigger automatically. If disabled, manually trigger surge OR adjust AFK erosion threshold down.

### "Students ignoring map"
**Check:** `active_players_5min` high BUT `claims_total` low

**Action:** Boot bonus may be too low OR students don't see affordance. Consider increasing `bootBonus` or adding visual cues.

### "Economy inflating"
**Check:** `avg_points_at_session_end` trending up over sessions

**Action:** Increase soft ceiling aggressiveness (`pointCeilingScaleFactor`) OR add point decay.

### "Spam attempts"
**Check:** `cooldowns_triggered > 5` per session

**Action:** Students may be gaming; consider stronger penalties (increase `spamCooldownSeconds`).

### "Bullying pattern"
**Check:** `takeovers_by_tier.ACTIVE` > `takeovers_by_tier.COLD`

**Action:** Active students being targeted; may need mercy mechanics. Underdog assist helps players who lose all territory.

### "Slow onboarding"
**Check:** `median_time_to_first_claim > 180000` (3+ minutes)

**Action:** Students taking too long to make first claim. Consider:
- Increasing boot bonus
- Adding tutorial hints
- Reducing initial claim cost

## Sample Telemetry Output

```json
{
  "timestamp": "2024-01-15T14:30:00.000Z",
  "interval_ms": 300000,
  "counters": {
    "claims_total": 23,
    "takeovers_total": 8,
    "takeovers_by_tier": { "ACTIVE": 1, "WARM": 3, "COLD": 4 },
    "afk_erosions_total": 2,
    "cooldowns_triggered": 0,
    "surges_activated": 1,
    "auto_surges_triggered": 0,
    "class_goals_reached": 0,
    "points_earned_total": 156,
    "underdog_assists": 1
  },
  "aggregates": {
    "map_fill_percent": 0.72,
    "active_players_5min": 18,
    "cells_changed_5min": 31,
    "median_time_to_first_claim": 45000,
    "avg_points_at_session_end": null
  }
}
```

## Interpreting Tier Distribution

The `takeovers_by_tier` breakdown shows attack patterns:

- **Healthy:** COLD > WARM > ACTIVE (players attacking inactive defenders)
- **Aggressive:** ACTIVE > COLD (players targeting active defenders - competitive)
- **Camping:** Very low takeovers overall (players avoiding conflict)

## Auto-Surge Behavior

When the map becomes stagnant (high fill + low churn), the system automatically spawns surge cells to create opportunities:

1. System checks every minute
2. If `map_fill_percent > 0.85` AND `cells_changed_5min < 5`
3. Spawns 2 surge cells in random unclaimed positions
4. Broadcasts "UPLINK DETECTED" toast to all clients
5. Respects 10-minute cooldown between auto-surges

## Underdog Assist

Players who lose all territory get a comeback boost:

- **Eligibility:** 0 cells AND answered in last 3 minutes AND not used in last 5 minutes
- **Discount:** 50% off next neutral cell claim
- **Minimum cost:** 5 points (floor)
- **Tracked in:** `underdog_assists` counter
