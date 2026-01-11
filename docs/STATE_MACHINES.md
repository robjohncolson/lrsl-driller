# LRSL Driller State Machine Diagrams

Complete state machine documentation for all components as of v1.6.2.

**v1.6.2 Changes:**
- Fixed frontend grid size: Now uses `GRID_WARS_CONFIG.mapSize` instead of hardcoded 20
- Fixed AI grading parser: Accepts both direct `{score, feedback}` and field-keyed formats
- Fixed velocity query: Uses `player_id` column (not `username`)
- Added `normalizeGradingResponse()` for consistent AI response handling
- Updated `grid-state.js` defaults: `mapSize: 8`, `classGoalTarget: 50`
- Added regression tests (32 new tests covering v1.6.2 fixes)

**v1.6.1 Changes:**
- Removed Class Goal UI (no progress bar)
- Simplified leaderboard: sorted by territories_count only (not lifetime_earned)
- Header changed from "🏆 LEADERBOARD" to "🏰 TERRITORY HELD"
- Server now imports config from shared/gridwars.config.js (no more hardcoded values)

---

## 1. GAME ENGINE — Star Earning Flow

```
                              ┌─────────────────────────────────────────────────────┐
                              │                  ANSWER SUBMITTED                    │
                              └───────────────────────┬─────────────────────────────┘
                                                      │
                                                      ▼
                              ┌─────────────────────────────────────────────────────┐
                              │              GRADING ENGINE EVALUATES                │
                              │         (Keywords → AI → Best Score Wins)            │
                              └───────────────────────┬─────────────────────────────┘
                                                      │
                          ┌───────────────────────────┴───────────────────────────┐
                          │                                                       │
                          ▼                                                       ▼
              ┌───────────────────────┐                           ┌───────────────────────┐
              │   ALL FIELDS = 'E'    │                           │   ANY FIELD ≠ 'E'     │
              │   (Essentially Correct)│                           │   (Partial/Incorrect) │
              └───────────┬───────────┘                           └───────────┬───────────┘
                          │                                                   │
                          ▼                                                   ▼
              ┌───────────────────────┐                           ┌───────────────────────┐
              │   CALCULATE STAR      │                           │   STREAK RESET TO 0   │
              │   BASED ON PENALTIES  │                           │   NO STAR AWARDED     │
              └───────────┬───────────┘                           │                       │
                          │                                       │   Report wrong answer │
                          │                                       │   to Grid Wars (spam  │
    ┌─────────────────────┼─────────────────────┬─────────────────│   prevention v1.3)    │
    │                     │                     │                 └───────────────────────┘
    ▼                     ▼                     ▼                     ▼
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│  GOLD   │         │ SILVER  │         │ BRONZE  │         │   TIN   │
│  ★★★★   │         │  ★★★    │         │   ★★    │         │    ★    │
│ 4 pts   │         │ 3 pts   │         │  2 pts  │         │  1 pt   │
└────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │                   │
     │ hints=0           │ hints=1           │ hints=2           │ hints≥3
     │ retries=0         │ OR retries=1      │ OR retries=2      │ OR retries≥3
     │                   │                   │                   │
     └───────────────────┴───────────────────┴───────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   APPLY LEVEL MULTIPLIER      │
                    │   (0.5x → 3.0x based on tier) │
                    │   Floor: min 1 point          │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   STREAK++                    │
                    │   STAR_COUNTS[type]++         │
                    │   → Check tier unlocks        │
                    │   → Send to Grid Wars         │
                    │   → Broadcast leaderboard     │
                    └───────────────────────────────┘
```

### Tier Unlock State Machine

```
┌────────────────┐     gold ≥ N      ┌────────────────┐
│  TIER: LOCKED  │ ─────────────────▶│ TIER: UNLOCKED │
│                │                   │  (permanent)   │
└────────────────┘                   └────────────────┘
        │                                    │
        │ prerequisite                       │
        │ tier unlocked                      │ never
        │ (guard)                            │ re-locks
        ▼                                    ▼
┌────────────────┐                   ┌────────────────┐
│  Can attempt   │                   │ Always visible │
│  unlock check  │                   │ in mode list   │
└────────────────┘                   └────────────────┘

Progression Example:
L1 (default) ──[10 gold]──▶ L2 ──[15 gold]──▶ L3 ──[20 gold]──▶ ...
```

---

## 2. GRADING ENGINE — Dual Grading Pipeline

```
                    ┌────────────────────────┐
                    │    STUDENT ANSWER      │
                    │      SUBMITTED         │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   DETERMINE RULE TYPE  │
                    │  (manifest grading{})  │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   'numeric'   │      │   'regex'     │      │    'dual'     │
│   tolerance   │      │   pattern     │      │ (keywords+AI) │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────────────────┐
│ |answer-exp|  │      │ regex.test()  │      │         PARALLEL          │
│ < tolerance?  │      │               │      ├─────────────┬─────────────┤
└───────┬───────┘      └───────┬───────┘      │  KEYWORDS   │     AI      │
        │                      │              │  (sync)     │  (async)    │
        │                      │              └──────┬──────┴──────┬──────┘
        │                      │                     │             │
        ▼                      ▼                     ▼             ▼
┌───────────────┐      ┌───────────────┐      ┌───────────┐ ┌───────────┐
│ E (within)    │      │ E (matched)   │      │ Regex     │ │ AI        │
│ I (outside)   │      │ P (partial)   │      │ Score     │ │ Score     │
└───────────────┘      │ I (no match)  │      └─────┬─────┘ └─────┬─────┘
                       └───────────────┘            │             │
                                                    └──────┬──────┘
                                                           │
                                                           ▼
                                                ┌───────────────────┐
                                                │  BEST SCORE WINS  │
                                                │  (E > P > I)      │
                                                │  _bestOf: 'ai'    │
                                                │  or 'keywords'    │
                                                └─────────┬─────────┘
                                                          │
                                                          ▼
                                                ┌───────────────────┐
                                                │   FINAL RESULT    │
                                                │  {score, feedback}│
                                                └───────────────────┘

AI Fallback Chain:
┌─────────┐     fail     ┌─────────┐     fail     ┌─────────────┐
│  Groq   │ ───────────▶ │ Gemini  │ ───────────▶ │ Use Keywords│
│ (fast)  │              │(fallback)│              │ Score Only  │
└─────────┘              └─────────┘              └─────────────┘
```

---

## 3. GRID WARS — Territory Claim Flow (v1.6)

```
                          ┌─────────────────────────────────────┐
                          │         PLAYER CLICKS CELL          │
                          │      (or spacebar at avatar)        │
                          └─────────────────┬───────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────┐
                          │          VALIDATE ACTION            │
                          │  • Has uplink? (answered in 10min)  │
                          │  • Session not frozen?              │
                          │  • Not in cooldown?                 │
                          │  • In bounds? (0-7 on 8×8 map)      │
                          └─────────────────┬───────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               ▼
          ┌─────────────────┐                             ┌─────────────────┐
          │  VALIDATION OK  │                             │ VALIDATION FAIL │
          └────────┬────────┘                             │ (show error)    │
                   │                                      └─────────────────┘
                   ▼
          ┌─────────────────────────────────────────────────────────────────┐
          │                     CALCULATE COST (v1.6)                       │
          │                                                                 │
          │  1. BASE COST (by cell type & defender activity)                │
          │     ├─ Neutral: 40 pts (v1.6)                                   │
          │     ├─ Enemy COLD (>8min): 60 pts                               │
          │     ├─ Enemy WARM (3-8min): 80 pts                              │
          │     └─ Enemy ACTIVE (<3min): 100 pts                            │
          │                                                                 │
          │  2. SCARCITY MULTIPLIER (by map fill %) — v1.6 thresholds       │
          │     ├─ EXPANSION (0-30%): 1.0x  🌱                              │
          │     ├─ TENSION (30-60%): 1.5x   ⚡                              │
          │     ├─ SCARCITY (60-85%): 2.0x  🔥                              │
          │     └─ SATURATION (85-100%): 3.0x 💎                            │
          │                                                                 │
          │  3. VELOCITY DISCOUNT (attacker's pts/min over 10min)           │
          │     ├─ BLAZING (≥2.0): -40%  🔥                                 │
          │     ├─ FLOWING (≥1.0): -25%  ⚡                                 │
          │     ├─ ACTIVE (≥0.5): -10%   💧                                 │
          │     └─ IDLE (<0.5): 0%       ❄️                                 │
          │                                                                 │
          │  4. GUERRILLA DISCOUNT (v1.6 scaled for 64 cells)               │
          │     ├─ ≤2 cells vs ≥10: -50%                                    │
          │     ├─ ≤4 cells vs ≥15: -40%                                    │
          │     ├─ ≤6 cells vs ≥20: -30%                                    │
          │     └─ Otherwise: 0%                                            │
          │                                                                 │
          │  5. OVEREXTENSION DISCOUNT (target cell isolation)              │
          │     ├─ Isolated (≤3 cluster): -30%                              │
          │     ├─ Edge (<4 neighbors): -15%                                │
          │     └─ Core (4+ neighbors): 0%                                  │
          │                                                                 │
          │  6. UNDERDOG DISCOUNT (v1.6)                                    │
          │     └─ 0 territories + active: -50% (min cost: 20)              │
          │                                                                 │
          │  FINAL = max(10, ceil(BASE × SCARCITY × (1-VEL) × (1-GUE) × (1-OVE))) │
          └─────────────────────────────────┬───────────────────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────┐
                          │        CAN PLAYER AFFORD?           │
                          │    player.action_points ≥ COST      │
                          └─────────────────┬───────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               ▼
          ┌─────────────────┐                             ┌─────────────────┐
          │   CAN AFFORD    │                             │  CANNOT AFFORD  │
          │ → Optimistic    │                             │  (show message) │
          │   update UI     │                             └─────────────────┘
          │ → Mark pending  │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────────────────────────────────────────────────────┐
          │                    SEND TO SERVER                               │
          │              POST /api/grid-wars/action                         │
          │              {gameId, username, action:'claim', x, y, actionId} │
          └─────────────────────────────────┬───────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               ▼
          ┌─────────────────┐                             ┌─────────────────┐
          │ SERVER CONFIRMS │                             │ SERVER REJECTS  │
          │ → Keep changes  │                             │ → Rollback UI   │
          │ → Broadcast:    │                             │ → Restore pts   │
          │   territory_    │                             │ → Show error    │
          │   claimed       │                             └─────────────────┘
          │ → Broadcast:    │
          │   leaderboard_  │
          │   update (v1.6) │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────────────────────────────────────────────────────┐
          │                    IF BOUNTY TARGET (v1.6)                      │
          │         (defender owns ≥20% of map = 12 cells on 8×8)           │
          │         → Award +10 bonus points to attacker                    │
          │         → Broadcast 'bounty_claimed' event                      │
          └─────────────────────────────────────────────────────────────────┘
```

---

## 4. VELOCITY TIER STATE MACHINE (v1.5)

```
                    Points earned in last 10 minutes
                              │
                              ▼
                    ┌───────────────────┐
                    │ velocity = sum/10 │
                    │   (pts per min)   │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┬─────────────────────┐
        │                     │                     │                     │
        ▼                     ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│     IDLE      │     │    ACTIVE     │     │   FLOWING     │     │   BLAZING     │
│   velocity    │     │   velocity    │     │   velocity    │     │   velocity    │
│     < 0.5     │     │   0.5 - 0.99  │     │   1.0 - 1.99  │     │    ≥ 2.0      │
├───────────────┤     ├───────────────┤     ├───────────────┤     ├───────────────┤
│  Discount: 0% │     │ Discount: 10% │     │ Discount: 25% │     │ Discount: 40% │
│  Icon: ❄️     │     │  Icon: 💧     │     │  Icon: ⚡     │     │  Icon: 🔥     │
│  Color: gray  │     │ Color: cyan   │     │ Color: yellow │     │  Color: red   │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
        ▲                     ▲                     ▲                     ▲
        │                     │                     │                     │
        └──────── Continuous recalculation on each point event ──────────┘

Transitions happen automatically based on rolling 10-minute window.
Velocity decays naturally as old events fall outside window.
Point events stored in Supabase (v1.5.1) — survives server restart.

Example Timeline:
┌─────────────────────────────────────────────────────────────────────────────┐
│ T+0    T+2min   T+4min   T+6min   T+8min   T+10min  T+12min  T+14min       │
│  │       │        │        │        │         │        │        │          │
│  ▼       ▼        ▼        ▼        ▼         ▼        ▼        ▼          │
│ +4pts  +4pts    +4pts    +4pts    +4pts    (none)   (none)   (none)        │
│                                                                            │
│ Velocity: 2.0   2.0      2.0      2.0      2.0      1.6      1.2     0.8  │
│ Tier:   BLAZING BLAZING  BLAZING  BLAZING  BLAZING  FLOWING  FLOWING ACTIVE│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. SCARCITY PHASE STATE MACHINE (v1.6)

```
                         Map Fill Percentage (64 cells total)
                               │
      0%                       ▼                            100%
       ├───────────────────────┼───────────────────────────────┤
       │                       │                               │
       │◀── EXPANSION ──▶│◀─── TENSION ───▶│◀── SCARCITY ──▶│◀─SAT─▶│
       │     (0-30%)     │     (30-60%)     │    (60-85%)    │(85%+) │
       │   0-19 cells    │    20-38 cells   │   39-54 cells  │ 55-64 │
       └─────────────────┴──────────────────┴────────────────┴───────┘

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   EXPANSION     │      │    TENSION      │      │   SCARCITY      │      │  SATURATION     │
│   🌱 Land Rush  │      │ ⚡ Tightening   │      │ 🔥 Prime Gone   │      │ 💎 Last Parcels │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ Multiplier: 1.0 │      │ Multiplier: 1.5 │      │ Multiplier: 2.0 │      │ Multiplier: 3.0 │
│ Claim: 40 pts   │─────▶│ Claim: 60 pts   │─────▶│ Claim: 80 pts   │─────▶│ Claim: 120 pts  │
│ UI: Hidden      │      │ UI: Yellow      │      │ UI: Red         │      │ UI: Purple      │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
      fill≤30%               30%<fill≤60%            60%<fill≤85%            fill>85%

                                 ┌─────────────────────────────────────┐
                                 │           100% FULL                 │
                                 │  ⚔️ ALL TERRITORY CLAIMED           │
                                 │  Only Conquest Remains              │
                                 │  (No neutral cells to claim)        │
                                 └─────────────────────────────────────┘

Transitions are BIDIRECTIONAL — scarcity can decrease if cells decay back to neutral
```

---

## 6. BOUNTY SYSTEM STATE MACHINE (v1.6)

```
                    ┌────────────────────────────────────────┐
                    │      CHECK BOUNTIES (every 60s)        │
                    │  For each player with territory:       │
                    │  cells_owned / 64 ≥ 20%?               │
                    │  (threshold: 12 cells on 8×8 map)      │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
    ┌─────────────────────┐                           ┌─────────────────────┐
    │  BELOW THRESHOLD    │                           │  ABOVE THRESHOLD    │
    │  (< 12 cells)       │                           │  (≥ 12 cells)       │
    │  No bounty          │                           │  BOUNTY ACTIVE      │
    └─────────────────────┘                           └──────────┬──────────┘
                                                                 │
                                                                 ▼
                                              ┌─────────────────────────────────┐
                                              │         BOUNTY TARGET           │
                                              │  • Cells glow gold              │
                                              │  • Name in bounty list          │
                                              │  • +10 pts for attackers (v1.6) │
                                              └──────────────┬──────────────────┘
                                                             │
                                          ┌──────────────────┴──────────────────┐
                                          │                                     │
                                          ▼                                     ▼
                              ┌─────────────────────┐             ┌─────────────────────┐
                              │   CELL ATTACKED     │             │   LOSES TERRITORY   │
                              │   by non-target     │             │   (decay or attack) │
                              └──────────┬──────────┘             └──────────┬──────────┘
                                         │                                   │
                                         ▼                                   │
                              ┌─────────────────────┐                        │
                              │   BOUNTY CLAIMED    │                        │
                              │  • +10 bonus pts    │                        │
                              │  • Broadcast event  │                        │
                              │  • Attacker rewarded│                        │
                              └──────────┬──────────┘                        │
                                         │                                   │
                                         └───────────────────┬───────────────┘
                                                             │
                                                             ▼
                                              ┌─────────────────────────────────┐
                                              │     RECALCULATE BOUNTIES        │
                                              │  Player may still be target     │
                                              │  or drop below threshold        │
                                              └─────────────────────────────────┘
```

---

## 7. DIMINISHING RETURNS STATE MACHINE (v1.6)

```
                    ┌────────────────────────────────────────┐
                    │     PLAYER EARNS POINTS FROM STAR      │
                    │         (base: 4/3/2/1 pts)            │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │      CHECK TERRITORY COUNT             │
                    │      territories_count = N             │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
    ┌─────────────────────┐                           ┌─────────────────────┐
    │   N ≤ 8 (threshold) │                           │   N > 8 (threshold) │
    │   No penalty        │                           │   Apply penalty     │
    │   multiplier = 1.0  │                           │   (empire overhead) │
    └─────────────────────┘                           └──────────┬──────────┘
                                                                 │
                                                                 ▼
                                              ┌─────────────────────────────────┐
                                              │   CALCULATE MULTIPLIER          │
                                              │   excess = N - 8                │
                                              │   mult = max(0.5, 1 - excess×0.05)│
                                              └──────────────────┬──────────────┘
                                                                 │
        ┌────────────────────────────────────────────────────────┼────────────────┐
        │                              │                         │                │
        ▼                              ▼                         ▼                ▼
┌───────────────┐           ┌───────────────┐         ┌───────────────┐  ┌───────────────┐
│  8 cells      │           │  12 cells     │         │  16 cells     │  │  18+ cells    │
│  excess = 0   │           │  excess = 4   │         │  excess = 8   │  │  excess ≥ 10  │
│  mult = 1.0x  │           │  mult = 0.8x  │         │  mult = 0.6x  │  │  mult = 0.5x  │
│  (no penalty) │           │  (20% penalty)│         │  (40% penalty)│  │  (50% floor)  │
└───────────────┘           └───────────────┘         └───────────────┘  └───────────────┘

Example: Gold star (4 pts) at 16 cells = 4 × 0.6 = 2.4 → rounds to 2 pts
         (before contiguity bonus)
```

---

## 8. AFK DECAY STATE MACHINE (v1.5)

```
                    ┌────────────────────────────────────────┐
                    │     PLAYER HAS TERRITORY               │
                    │     last_answer_at = T0                │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
              ┌─────────────────────────────────────────────────────────────────┐
              │                                                                 │
              │                        GRACE PERIOD                             │
              │                        (24 hours)                               │
              │                                                                 │
              │    No decay occurs. Player can return anytime and reset.       │
              │                                                                 │
              └────────────────────────────────┬────────────────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
                        ▼                                             ▼
              ┌─────────────────────┐                     ┌─────────────────────┐
              │   ANSWERS DRILL     │                     │   NO ACTIVITY       │
              │                     │                     │   for 24+ hours     │
              └──────────┬──────────┘                     └──────────┬──────────┘
                         │                                           │
                         ▼                                           ▼
              ┌─────────────────────┐                     ┌─────────────────────┐
              │   TIMER RESET       │                     │   DECAY MODE        │
              │   last_answer_at    │                     │   (1 cell per day)  │
              │   = NOW             │                     └──────────┬──────────┘
              │                     │                                │
              │   Back to grace     │                                │
              │   period start      │                                ▼
              └─────────────────────┘              ┌─────────────────────────────────┐
                                                   │     FIND EDGE CELL              │
                                                   │   (most vulnerable)             │
                                                   │   - Fewest same-owner neighbors │
                                                   │   - Oldest claimed_at           │
                                                   └──────────────┬──────────────────┘
                                                                  │
                                                                  ▼
                                                   ┌─────────────────────────────────┐
                                                   │     RETURN TO NEUTRAL           │
                                                   │   • Cell owner = null           │
                                                   │   • Broadcast 'afk_decay'       │
                                                   │   • Player territories_count--  │
                                                   │   • Scarcity phase may change   │
                                                   └──────────────┬──────────────────┘
                                                                  │
                                                                  ▼
                                                   ┌─────────────────────────────────┐
                                                   │     CHECK REMAINING             │
                                                   │   territories_count > 0?        │
                                                   └──────────────┬──────────────────┘
                                                                  │
                                          ┌───────────────────────┴───────────────────────┐
                                          │                                               │
                                          ▼                                               ▼
                               ┌─────────────────────┐                         ┌─────────────────────┐
                               │   STILL HAS CELLS   │                         │   NO MORE CELLS     │
                               │   Continue decay    │                         │   Player eliminated │
                               │   (1/day)           │                         │   from map          │
                               └─────────────────────┘                         └─────────────────────┘
```

---

## 9. SESSION LIFECYCLE STATE MACHINE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SESSION MANAGEMENT                                  │
│                                 (Teacher Controls)                               │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────┐
                              │    SESSION ACTIVE   │
                              │                     │
                              │  • Claims allowed   │
                              │  • Drills count     │
                              │  • Points earned    │
                              │  • Territory changes│
                              │  • Leaderboard live │
                              └──────────┬──────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
    ┌─────────────────────┐                           ┌─────────────────────┐
    │ Teacher: END SESSION│                           │   Game continues    │
    │ POST /session/end   │                           │   normally          │
    └──────────┬──────────┘                           └─────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                          SESSION FROZEN                                  │
    │                                                                         │
    │  Grid Wars:                          Drills:                            │
    │  ✗ Claims blocked                    ✓ Still work                       │
    │  ✗ Territory changes blocked         ✓ Stars awarded                    │
    │  ✗ Points spending blocked           ✓ Points earned (saved)            │
    │                                                                         │
    │  Summary calculated:                 Leaderboard:                       │
    │  • Top territories holder            ✓ Still updates (v1.6)             │
    │  • Most points earned                                                   │
    │  • Rankings for session                                                 │
    │                                                                         │
    │  ⚠️ NOTE: frozenGames is in-memory — lost on server restart            │
    └────────────────────────────────┬────────────────────────────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────────┐
              │                                                 │
              ▼                                                 ▼
    ┌─────────────────────┐                       ┌─────────────────────┐
    │ Teacher: RESUME     │                       │ Teacher: RESET      │
    │ POST /session/resume│                       │ POST /game/reset    │
    └──────────┬──────────┘                       └──────────┬──────────┘
               │                                             │
               ▼                                             ▼
    ┌─────────────────────┐                       ┌─────────────────────┐
    │   SESSION ACTIVE    │                       │    FRESH START      │
    │   (Resume from      │                       │  • All territory    │
    │    frozen state)    │                       │    cleared          │
    │                     │                       │  • Points → boot    │
    │  • Same territory   │                       │    bonus (30 pts)   │
    │  • Same points      │                       │  • New game begins  │
    │  • Game continues   │                       │                     │
    └─────────────────────┘                       └─────────────────────┘
```

---

## 10. PRESENCE & CONNECTION STATE MACHINE (v1.6)

```
                    ┌────────────────────────────────────────┐
                    │       CLIENT CONNECTS (WebSocket)      │
                    │       ws.send({type: 'identify'})      │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │      SERVER REGISTERS CLIENT           │
                    │  clients.set(ws, {                     │
                    │    username,                           │
                    │    lastHeartbeat: Date.now(),         │
                    │    gameId                              │
                    │  })                                    │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │      BROADCAST 'user_online'           │
                    │      → Chevron appears on map          │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
              ┌─────────────────────────────────────────────────────────────────┐
              │                     ACTIVE CONNECTION                           │
              │                                                                 │
              │  Client sends heartbeat every 30s (presenceHeartbeatMs)        │
              │  Server updates lastHeartbeat timestamp                        │
              │                                                                 │
              └────────────────────────────────┬────────────────────────────────┘
                                               │
              ┌────────────────────────────────┴────────────────────────────────┐
              │                                │                                │
              ▼                                ▼                                ▼
    ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
    │   CLEAN DISCONNECT  │      │   HEARTBEAT TIMEOUT │      │   NETWORK ERROR     │
    │   ws.close()        │      │   (no ping in 5min) │      │   (connection lost) │
    └──────────┬──────────┘      └──────────┬──────────┘      └──────────┬──────────┘
               │                            │                            │
               │                            ▼                            │
               │              ┌─────────────────────────────┐            │
               │              │  STALE CONNECTION PRUNE     │            │
               │              │  (every 60s interval)       │            │
               │              │  if (now - lastHeartbeat    │            │
               │              │      > 300000ms) {          │            │
               │              │    ws.terminate();          │            │
               │              │  }                          │            │
               │              └──────────────┬──────────────┘            │
               │                             │                           │
               └─────────────────────────────┼───────────────────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────────┐
                              │    BROADCAST 'player_left'      │
                              │    → Chevron removed from map   │
                              │    → clients.delete(ws)         │
                              └─────────────────────────────────┘

Presence Tracking Config (v1.6):
  presenceHeartbeatMs: 30000      (client pings every 30s)
  presenceStaleThresholdMs: 300000 (5 minutes to mark stale)
  presencePruneIntervalMs: 60000   (check every 1 minute)
```

---

## 11. LEADERBOARD STATE MACHINE (v1.6.1)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                 v1.6.1 SINGLE LEADERBOARD (territories_count)                   │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │         LEADERBOARD TRIGGERS           │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
    ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
    │  TERRITORY CLAIMED  │    │   POINTS EARNED     │    │   CLIENT CONNECTS   │
    │  (or lost)          │    │   (from star)       │    │   (initial load)    │
    └──────────┬──────────┘    └──────────┬──────────┘    └──────────┬──────────┘
               │                          │                          │
               └──────────────────────────┼──────────────────────────┘
                                          │
                                          ▼
                           ┌─────────────────────────────────┐
                           │  broadcastLeaderboardUpdate()   │
                           │                                 │
                           │  1. Query grid_wars_players     │
                           │     (server returns raw data)   │
                           │                                 │
                           │  2. Join with users table       │
                           │     for real_name               │
                           │                                 │
                           │  3. Broadcast to all clients:   │
                           │     {type: 'leaderboard_update',│
                           │      leaderboard: [...]}        │
                           └──────────────┬──────────────────┘
                                          │
                                          ▼
                           ┌─────────────────────────────────┐
                           │     CLIENT RECEIVES UPDATE      │
                           │                                 │
                           │  handleWebSocketMessage():      │
                           │  case 'leaderboard_update':     │
                           │    onLeaderboardUpdate(data)    │
                           └──────────────┬──────────────────┘
                                          │
                                          ▼
                           ┌─────────────────────────────────┐
                           │   CLIENT-SIDE SORTING (v1.6.1)  │
                           │                                 │
                           │  sortedEntries = [...entries]   │
                           │    .sort((a, b) =>              │
                           │      b.territories_count -      │
                           │      a.territories_count)       │
                           └──────────────┬──────────────────┘
                                          │
                                          ▼
                           ┌─────────────────────────────────┐
                           │     GRID PANEL UPDATES UI       │
                           │                                 │
                           │  _leaderboardData = leaderboard │
                           │  renderLeaderboardContent()     │
                           │                                 │
                           │  Display:                       │
                           │  ┌─────────────────────────┐    │
                           │  │ 🏰 TERRITORY HELD       │    │
                           │  │ Rank: #3                │    │
                           │  ├─────────────────────────┤    │
                           │  │ 1. Alice        5 🏰    │    │
                           │  │ 2. Bob          3 🏰    │    │
                           │  │ 3. You          2 🏰    │    │
                           │  │ 4. Carol        1 🏰    │    │
                           │  └─────────────────────────┘    │
                           │                                 │
                           │  Shows ONLY territories_count   │
                           │  (no lifetime_earned display)   │
                           └─────────────────────────────────┘

v1.6.1 Changes from v1.6:
  - Header changed: "🏆 LEADERBOARD" → "🏰 TERRITORY HELD"
  - Sorted by territories_count (not lifetime_earned)
  - Shows only territory count with 🏰 emoji
  - Removed lifetime_earned/points display
  - Client-side sorting applied before rendering
  - Rank calculated from sorted (by territory) order

v1.6 Changes from v1.5:
  - Removed 3-tab system (Scholar/Banker/General)
  - Real-time WebSocket updates (was polling)
  - No limit on display (shows all players)
```

---

## 12. WEBSOCKET MESSAGE FLOW (Complete)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT ←→ SERVER MESSAGES                             │
└─────────────────────────────────────────────────────────────────────────────────┘

CLIENT → SERVER (HTTP POST)                SERVER → CLIENT (WebSocket Broadcast)
═══════════════════════════                ════════════════════════════════════════

/api/grid-wars/action ─────────────────────▶ territory_claimed
  { action: 'claim', x, y }                   { owner, x, y, strength, cost }
                                           ▶ leaderboard_update (v1.6)
                                              { leaderboard: [...] }

/api/grid-wars/points/add ─────────────────▶ points_earned
  { gameId, username, starType }              { username, points, total, starType }
                                           ▶ velocity_update
                                              { username, tier, discount, velocity }
                                           ▶ leaderboard_update (v1.6)
                                              { leaderboard: [...] }

/api/grid-wars/session/end ────────────────▶ session_ended
  { password }                                { summary, rankings }

/api/grid-wars/session/resume ─────────────▶ session_resumed
  { password }                                { }

/api/grid-wars/game/reset ─────────────────▶ game_reset
  { password }                                { }

(Server Interval) ─────────────────────────▶ scarcity_update
                                              { phase, multiplier, message, fillPercent }

(Server Interval) ─────────────────────────▶ bounty_targets_update
                                              { targets: [username, ...] }

(Server Interval) ─────────────────────────▶ auto_surge_activated
                                              { x, y, expiresIn }

(Decay Check) ─────────────────────────────▶ afk_decay
                                              { username, cells_lost, reason }

(Bounty Taken) ────────────────────────────▶ bounty_claimed
                                              { attacker, defender, bonus }

(Stale Prune v1.6) ────────────────────────▶ player_left
                                              { username }


MESSAGE SEQUENCE TRACKING
═════════════════════════

Every delta message includes:
  { seq: N, gameId, ... }

Client tracks expected sequence:
  ┌─────────────────────────────────────────────────────────────────┐
  │  if (message.seq !== _expectedSeq) {                           │
  │    // GAP DETECTED                                              │
  │    enterResyncMode();                                           │
  │    requestStateSnapshot();                                      │
  │  }                                                              │
  └─────────────────────────────────────────────────────────────────┘

State Snapshot (full resync):
  ┌─────────────────────────────────────────────────────────────────┐
  │  type: 'state_snapshot'                                         │
  │  territories: [ { x, y, owner, strength, ... }, ... ]           │
  │  players: [ { username, action_points, ... }, ... ]             │
  │  scarcityPhase: { phase, multiplier }                           │
  │  bountyTargets: [ username, ... ]                               │
  │  seq: CURRENT_SEQ  // Reset sequence tracking                   │
  └─────────────────────────────────────────────────────────────────┘
```

---

## 13. CONTIGUITY BONUS CALCULATION

```
                    ┌────────────────────────────────────────┐
                    │     PLAYER EARNS POINTS FROM STAR      │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │   CALCULATE LARGEST CONNECTED CLUSTER  │
                    │   (BFS from each owned cell)           │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │   bonus = min(5, floor(cluster / 5))   │
                    │   maxContiguityBonus = 5               │
                    └────────────────────┬───────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│ cluster 1-4   │             │ cluster 5-9   │             │ cluster 10-14 │
│ bonus = +0    │             │ bonus = +1    │             │ bonus = +2    │
└───────────────┘             └───────────────┘             └───────────────┘
        │                                │                                │
        ▼                                ▼                                ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│ cluster 15-19 │             │ cluster 20-24 │             │ cluster 25+   │
│ bonus = +3    │             │ bonus = +4    │             │ bonus = +5    │
└───────────────┘             └───────────────┘             │ (max on 8×8)  │
                                                           └───────────────┘

Example on 8×8 map:
  - Player owns 12 connected cells → bonus = floor(12/5) = +2 pts
  - Gold star (4 pts) + contiguity (+2) = 6 pts per answer
  - Max possible: 64 cells connected → +5 bonus (capped)
```

---

## 14. COMPLETE SYSTEM FLOW (v1.6)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              STUDENT EXPERIENCE                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   LOAD APP   │────▶│ SELECT TOPIC │────▶│ ANSWER DRILL │────▶│  EARN STAR   │
│              │     │ (cartridge)  │     │  question    │     │ (gold/silver/│
│              │     │              │     │              │     │  bronze/tin) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                              ┌────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            POINTS AWARDED                                        │
│                                                                                 │
│   points = starBase × levelMultiplier × (1 - diminishingPenalty) + contiguity   │
│                                                                                 │
│   Range: 1 point (tin L1) → 12+ points (gold final level + max cluster)         │
│                                                                                 │
│   Side effects:                                                                 │
│   • recordPointEvent() → Supabase (velocity tracking, survives restart)         │
│   • velocity recalculated → tier may change                                    │
│   • broadcast velocity_update to client                                         │
│   • broadcast leaderboard_update (v1.6)                                         │
│   • contiguity bonus if on own territory                                       │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          GRID WARS INTERACTION (v1.6)                           │
│                                                                                 │
│   Player opens Grid Wars panel (▼ toggle)                                       │
│                                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────────┐ │
│   │                          8 × 8 MAP (64 cells)                             │ │
│   │                                                                           │ │
│   │    ○ Neutral cells (gray)     ● Your cells (your color)                  │ │
│   │    ● Enemy cells (their color) ✦ Bounty target (gold glow)               │ │
│   │                                                                           │ │
│   │   Scarcity: 🔥 SCARCITY │ 72% Claimed │ Velocity: ⚡ FLOWING              │ │
│   │                                                                           │ │
│   │   🏆 LEADERBOARD (real-time, sorted by lifetime_earned)                   │ │
│   └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│   Actions:                                                                      │
│   • Click neutral → CLAIM (40 pts × scarcity multiplier)                       │
│   • Click enemy → TAKEOVER (60-100 pts × discounts)                            │
│   • Hover → See cost breakdown                                                  │
│                                                                                 │
│   v1.6 Changes:                                                                 │
│   • 8×8 map (was 25×25) — extreme scarcity                                     │
│   • No resource nodes — pure territory control                                 │
│   • Single leaderboard — lifetime_earned only                                  │
│   • Real-time leaderboard updates via WebSocket                                │
│   • Stale presence cleanup — chevrons disappear after 5 min inactive           │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ECONOMY LOOP                                           │
│                                                                                 │
│   EARN MORE ←───────────────────────────────────────────────────────┐          │
│      │                                                               │          │
│      ▼                                                               │          │
│   CLAIM TERRITORY ─────▶ CONTIGUITY BONUS ─────▶ MORE POINTS/STAR ──┘          │
│      │                                                                          │
│      │   ⚠️ Empire overhead: >8 cells = diminishing returns                    │
│      │      (8→100%, 12→80%, 16→60%, 18+→50% floor)                            │
│      │                                                                          │
│      ▼                                                                          │
│   DEFEND TERRITORY ◀──── OTHER PLAYERS ATTACK                                  │
│      │                                                                          │
│      │    (if inactive 24+ hours)                                              │
│      ▼                                                                          │
│   AFK DECAY ─────▶ CELLS RETURN TO NEUTRAL ─────▶ OPPORTUNITY FOR OTHERS       │
│                                                                                 │
│   STRATEGIC CONSIDERATIONS (v1.6):                                              │
│   • 64 cells total, 41 students — not everyone can own territory               │
│   • Bounty on players with ≥12 cells (20%) — paint a target                    │
│   • Guerrilla discounts reward underdogs attacking empires                     │
│   • Velocity rewards consistent drilling                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. IDENTIFIED ISSUES / VERIFICATION NOTES

### Critical Race Conditions

| Issue | Risk | Mitigation | Status |
|-------|------|------------|--------|
| Double-claim same cell | Two clients claim simultaneously | Server grants to first; authoritativeCell response | ✅ Handled |
| Sequence gap during resync | Messages lost while resyncing | _resyncInProgress flag blocks processing | ✅ Handled |
| Uplink timeout edge case | last_answer_at vs claim timing | 10-minute window, server timestamp | ⚠️ Edge case exists |
| Amplifier charge race | Two stars deplete 1 charge twice | Atomic decrement needed | ⚠️ Potential issue |
| Session freeze during claim | 403 after optimistic update | Client rollback on 403 | ✅ Handled |
| Resync message loss | state_snapshot never arrives | 30s timeout + manual retry | ⚠️ No timeout implemented |

### Persistence Points

| State | Persisted To | Restored On | Notes |
|-------|--------------|-------------|-------|
| Star counts | localStorage | Page reload | Client-side only |
| Tier unlocks | localStorage | Page reload | Client-side only |
| Territory | Supabase | Full state sync | Crash-safe |
| Points | Supabase | Full state sync | Crash-safe |
| Velocity events | Supabase | Server restart | v1.5.1 fix |
| Session frozen | In-memory Set | ❌ Lost on restart | **ISSUE** |
| Bounty targets | Recalculated | Server restart | OK |
| Cooldowns | In-memory Map | ❌ Lost on restart | Minor |

### Recommended Fixes

#### 1. Session Frozen Persistence (High Priority)
```sql
ALTER TABLE grid_wars_games ADD COLUMN is_frozen BOOLEAN DEFAULT false;
ALTER TABLE grid_wars_games ADD COLUMN frozen_summary JSONB;
```

#### 2. Cooldown Cleanup (Low Priority)
```javascript
// Add to server interval:
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of cooldowns) {
    if (now > data.until) cooldowns.delete(key);
  }
}, 60000);
```

#### 3. Leaderboard Throttling (Medium Priority)
```javascript
// Throttle to max 2 broadcasts/sec
let lastLeaderboardBroadcast = 0;
async function broadcastLeaderboardUpdate(gameId) {
  const now = Date.now();
  if (now - lastLeaderboardBroadcast < 500) return;
  lastLeaderboardBroadcast = now;
  // ... existing code
}
```

#### 4. Resync Timeout (Medium Priority)
```javascript
// In client GridWarsState:
_requestResync() {
  this._resyncTimeout = setTimeout(() => {
    console.error('Resync timeout - manual refresh required');
    this._exitResyncMode();
    this.onError?.({ operation: 'resync', error: 'timeout' });
  }, 30000);
}
```

---

## 16. STATE VARIABLE INVENTORY

### Server-Side (railway-server/server.js)

| Variable | Type | Purpose | Persistence |
|----------|------|---------|-------------|
| `clients` | Map<WS, Object> | Connected WebSocket clients | Memory |
| `frozenGames` | Map<gameId, Object> | Session freeze state | Memory ⚠️ |
| `activeRounds` | Map<gameId, Object> | Round tracking | Memory |
| `cooldowns` | Map<key, Object> | Spam prevention | Memory |
| `pendingGridUpdates` | Array | Throttled broadcast buffer | Memory |
| `broadcastSequence` | Number | Message ordering | Memory |

### Client-Side (platform/game/grid-state.js)

| Variable | Type | Purpose |
|----------|------|---------|
| `gameId` | String | Active game ID |
| `username` | String | Current player |
| `territories` | Map<"x,y", Object> | Cell cache |
| `players` | Map<username, Object> | Player cache |
| `classGoal` | Object | Class progress |
| `surge` | Object | Current surge cell |
| `scarcityPhase` | Object | v1.5 land scarcity |
| `bountyTargets` | Array | v1.5 bounty usernames |
| `velocityTier` | Object | v1.5 earning speed |
| `_sessionFrozen` | Boolean | v1.3.2 freeze state |
| `_expectedSeq` | Number | v1.2.1 sequence tracking |
| `_pendingActions` | Array | v1.2.1 pending claims |
| `_resyncInProgress` | Boolean | v1.3 resync mode |
| `_cooldownUntil` | Number | v1.3 cooldown timestamp |

### UI-Side (platform/game/grid-panel.js)

| Variable | Type | Purpose |
|----------|------|---------|
| `isExpanded` | Boolean | Panel collapsed/expanded |
| `selectedCell` | Object | Hover/click selection |
| `_leaderboardData` | Array | v1.6 cached leaderboard |
| `_resyncDelayTimer` | Number | v1.3.2 resync indicator |
| `_cooldownInterval` | Number | v1.3 countdown timer |

---

## 17. API ENDPOINT INVENTORY

| Method | Endpoint | Purpose | Broadcasts |
|--------|----------|---------|------------|
| GET | /api/grid-wars/games/active | Get/create game | - |
| GET | /api/grid-wars/games/:id/state | Full state fetch | - |
| POST | /api/grid-wars/action | Claim/takeover | territory_claimed, leaderboard_update |
| POST | /api/grid-wars/points/add | Add points | points_earned, velocity_update, leaderboard_update |
| POST | /api/grid-wars/avatar/init | Spawn avatar | boot_bonus |
| POST | /api/grid-wars/avatar/move | Move avatar | avatar_moved |
| GET | /api/grid-wars/leaderboard | Get leaderboard | - |
| POST | /api/grid-wars/wrong-answer | Report wrong | - |
| GET | /api/grid-wars/cooldown | Check cooldown | - |
| POST | /api/grid-wars/surge | Manual surge | surge_activated |
| POST | /api/grid-wars/session/end | End session | session_ended |
| POST | /api/grid-wars/session/resume | Resume session | session_resumed |
| POST | /api/grid-wars/games/reset | Reset map | game_reset |

---

## 18. INTERVAL/TIMER INVENTORY

### Server-Side

| Interval | Duration | Purpose | Broadcasts |
|----------|----------|---------|------------|
| AFK Erosion | 60s | Strength decay | cell_strength_changed |
| AFK Decay (24hr) | Hourly check | Cell return to neutral | afk_decay |
| Auto-Surge | 5min | Stagnation surge | auto_surge_activated |
| Scarcity Update | 60s | Phase calculation | scarcity_update |
| Bounty Rotation | 60s | Identify top players | bounty_targets_update |
| Grid Throttle | 500ms | Batch broadcasts | grid_delta |
| Stale Prune | 60s | Disconnect idle | player_left |
| Point Cleanup | Daily | Delete old events | - |

### Client-Side

| Timer | Duration | Purpose |
|-------|----------|---------|
| Cooldown Countdown | 1000ms | UI countdown |
| Resync Delay | 2000ms | Show indicator |
| Toast Dismiss | 3000ms | Auto-hide |

---

## 19. CONFIGURATION LOADING STATE MACHINE (v1.6.1)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SERVER CONFIGURATION LOADING                              │
│                      (v1.6.1 fix: centralized config)                           │
└─────────────────────────────────────────────────────────────────────────────────┘

BEFORE v1.6.1 (BUG):
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  shared/gridwars.config.js          railway-server/server.js                   │
│  ┌─────────────────────────┐        ┌─────────────────────────┐                │
│  │ mapSize: 8              │        │ const GRID_WARS_CONFIG = │  ← HARDCODED  │
│  │ nodesEnabled: false     │        │   mapSize: 25,          │    (STALE!)   │
│  │ claimCost: 40           │        │   nodesEnabled: true,   │                │
│  │ bootBonus: 30           │        │   claimCost: 30,        │                │
│  └─────────────────────────┘        │   bootBonus: 45,        │                │
│           │                         │   ...                   │                │
│           │ (NOT IMPORTED)          └─────────────────────────┘                │
│           ▼                                    │                               │
│  Client uses correct values                    │                               │
│  but server returns wrong!                     ▼                               │
│                                    /api/grid-wars/config                       │
│                                    returns { mapSize: 25, ... }                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

AFTER v1.6.1 (FIXED):
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  shared/gridwars.config.js                                                      │
│  ┌─────────────────────────┐                                                   │
│  │ mapSize: 8              │ ◄────────────── SINGLE SOURCE OF TRUTH            │
│  │ nodesEnabled: false     │                                                   │
│  │ claimCost: 40           │                                                   │
│  │ bootBonus: 30           │                                                   │
│  │ ...                     │                                                   │
│  └───────────┬─────────────┘                                                   │
│              │                                                                  │
│              ├────────────────────────────────┐                                │
│              │                                │                                │
│              ▼                                ▼                                │
│  ┌─────────────────────────┐      ┌─────────────────────────┐                  │
│  │  platform/game/         │      │  railway-server/        │                  │
│  │  grid-state.js          │      │  server.js              │                  │
│  │                         │      │                         │                  │
│  │  import { GRID_WARS_    │      │  const { GRID_WARS_     │                  │
│  │    CONFIG } from        │      │    CONFIG } = require(  │                  │
│  │    './grid-state.js';   │      │    '../shared/gridwars. │                  │
│  │                         │      │    config.js');         │                  │
│  └─────────────────────────┘      └───────────┬─────────────┘                  │
│                                               │                                │
│                                               ▼                                │
│                                   ┌─────────────────────────┐                  │
│                                   │  STARTUP LOGGING        │                  │
│                                   │                         │                  │
│                                   │  === GRID WARS CONFIG ===│                  │
│                                   │  mapSize: 8             │                  │
│                                   │  nodesEnabled: false    │                  │
│                                   │  claimCost: 40          │                  │
│                                   │  bootBonus: 30          │                  │
│                                   │  ========================│                  │
│                                   └───────────┬─────────────┘                  │
│                                               │                                │
│                                               ▼                                │
│                                   /api/grid-wars/config                        │
│                                   returns { mapSize: 8, ... } ✓                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Server Startup State Machine:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   LOAD      │───▶│   VERIFY    │───▶│   LOG       │───▶│   READY     │
│   CONFIG    │    │   VALUES    │    │   CONFIG    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                   │                   │
     │ require()         │ Check v1.6        │ Console output
     │ from shared/      │ values present    │ for verification
     ▼                   ▼                   ▼
  GRID_WARS_CONFIG    mapSize: 8?         === GRID WARS CONFIG ===
  object loaded       nodesEnabled:       mapSize: 8
                      false?              ...
```

---

## 20. UI ELEMENT STATE MACHINE (v1.6.1)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          GRID PANEL UI ELEMENTS                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

CLASS GOAL (REMOVED in v1.6.1):
┌─────────────────────────────────────────────────────────────────────────────────┐
│  v1.6:                                    v1.6.1:                               │
│  ┌─────────────────────────────────┐      ┌─────────────────────────────────┐   │
│  │ Class Goal        12 / 50      │      │                                 │   │
│  │ ████████░░░░░░░░░░░░░░  24%   │  ──▶ │     (ELEMENT REMOVED)           │   │
│  └─────────────────────────────────┘      └─────────────────────────────────┘   │
│                                                                                 │
│  updateClassGoalDisplay() is now a no-op for backwards compatibility           │
└─────────────────────────────────────────────────────────────────────────────────┘

LEADERBOARD HEADER (CHANGED in v1.6.1):
┌─────────────────────────────────────────────────────────────────────────────────┐
│  v1.6:                                    v1.6.1:                               │
│  ┌─────────────────────────────────┐      ┌─────────────────────────────────┐   │
│  │ 🏆 LEADERBOARD       Rank: #3  │      │ 🏰 TERRITORY HELD    Rank: #3  │   │
│  ├─────────────────────────────────┤  ──▶ ├─────────────────────────────────┤   │
│  │ 1. Alice    150 pts (5)        │      │ 1. Alice          5 🏰         │   │
│  │ 2. Bob      120 pts (3)        │      │ 2. Bob            3 🏰         │   │
│  │ 3. You       80 pts (2)        │      │ 3. You            2 🏰         │   │
│  └─────────────────────────────────┘      └─────────────────────────────────┘   │
│                                                                                 │
│  - Sorted by territories_count (not lifetime_earned)                           │
│  - Shows only cell count with 🏰 emoji                                         │
│  - Rank calculated from sorted order                                           │
└─────────────────────────────────────────────────────────────────────────────────┘

EXPANDABLE CONTENT SECTIONS:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  #gw-content (collapsed by default)                                            │
│  │                                                                              │
│  ├── Mini Grid (canvas)                                                        │
│  │   └── 8×8 map visualization                                                 │
│  │                                                                              │
│  ├── Action Buttons                                                            │
│  │   └── "□ Claim Territory" button                                            │
│  │                                                                              │
│  ├── Active Buffs (if any)                                                     │
│  │                                                                              │
│  ├── Status Message                                                            │
│  │   └── "Click a cell to claim territory"                                     │
│  │                                                                              │
│  └── Leaderboard Section (v1.6.1: 🏰 TERRITORY HELD)                           │
│      └── Sorted by territories_count                                           │
│                                                                                 │
│  NOTE: Class Goal section REMOVED in v1.6.1                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 21. COMPLETE DATA FLOW (v1.6.1)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        END-TO-END DATA FLOW DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

STUDENT ANSWERS DRILL QUESTION
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GRADING PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. grading-engine.js receives answer                                          │
│  2. Determines strategy from manifest.grading                                  │
│  3. Runs keyword grading (fast, sync)                                          │
│  4. If AI enabled, calls /api/ai/grade (async)                                 │
│  5. Best score wins (E > P > I)                                                │
│                                                                                 │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GAME ENGINE                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  if (allFieldsCorrect) {                                                        │
│    starType = getStarType(hints + retries);  // Gold/Silver/Bronze/Tin         │
│    starCounts[starType]++;                                                      │
│    streak++;                                                                    │
│    checkUnlocks();                            // Tier progression               │
│    saveToLocalStorage();                                                        │
│                                                                                 │
│    // Calculate weighted points for Grid Wars                                   │
│    weightedPoints = calculateWeightedPoints(starType, level, totalLevels);     │
│                                                                                 │
│    // Notify Grid Wars                                                          │
│    gridPanel.addPointsFromStar(starType, weightedPoints);                      │
│  } else {                                                                       │
│    streak = 0;                                                                  │
│    gridWarsState.reportWrongAnswer();  // Spam prevention                       │
│  }                                                                              │
│                                                                                 │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         GRID WARS STATE (Client)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  addPoints(starType, weightedPoints):                                           │
│    POST /api/grid-wars/points/add                                              │
│      { gameId, username, starType, weightedPoints, cartridgeId, modeId }       │
│                                                                                 │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RAILWAY SERVER                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  POST /api/grid-wars/points/add:                                               │
│                                                                                 │
│  1. Calculate contiguity bonus (largest connected cluster / 5, max +5)         │
│  2. Apply diminishing returns if territories > 8                               │
│  3. Add points to player.action_points                                         │
│  4. Update player.lifetime_earned                                              │
│  5. Record point event for velocity tracking (Supabase)                        │
│  6. Recalculate velocity tier                                                  │
│  7. Update Supabase: grid_wars_players                                         │
│                                                                                 │
│  WebSocket broadcasts:                                                          │
│    • points_earned { username, points, total, starType }                       │
│    • velocity_update { username, tier, discount, velocity }                    │
│    • leaderboard_update { leaderboard: [...] }                                 │
│                                                                                 │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         WEBSOCKET BROADCAST                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  All connected clients receive:                                                 │
│                                                                                 │
│  { type: 'leaderboard_update',                                                 │
│    leaderboard: [                                                               │
│      { username: 'Alice', lifetime_earned: 150, territories_count: 5 },        │
│      { username: 'Bob', lifetime_earned: 120, territories_count: 3 },          │
│      ...                                                                        │
│    ]                                                                            │
│  }                                                                              │
│                                                                                 │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         GRID PANEL UI (v1.6.1)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  onLeaderboardUpdate(leaderboard):                                              │
│    _leaderboardData = leaderboard;                                             │
│    renderLeaderboardContent();                                                  │
│                                                                                 │
│  renderLeaderboardContent():                                                    │
│    // v1.6.1: Sort by territories_count (not lifetime_earned)                  │
│    sortedEntries = [...entries].sort((a, b) =>                                 │
│      (b.territories_count || 0) - (a.territories_count || 0));                 │
│                                                                                 │
│    // Find player rank in sorted list                                          │
│    myIndex = sortedEntries.findIndex(e => e.username === this.username);       │
│                                                                                 │
│    // Render: "1. Alice  5 🏰"                                                 │
│    // Header: "🏰 TERRITORY HELD"                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 22. AI GRADING NORMALIZATION (v1.6.2)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   AI GRADING RESPONSE NORMALIZATION (v1.6.2)                    │
│                        railway-server/server.js                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │      AI PROVIDER RETURNS RESPONSE      │
                    │     (Groq or Gemini raw JSON text)     │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │         extractAndParseJSON(text)      │
                    │                                        │
                    │  1. Try direct JSON.parse()            │
                    │  2. If fails: repair common issues     │
                    │     - Smart quotes → regular quotes    │
                    │     - Trailing commas removed          │
                    │  3. If fails: regex score extraction   │
                    │     - Match "score": "E|P|I" patterns  │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │       isValidGradingResponse(parsed)   │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
    ┌─────────────────────────────┐                   ┌─────────────────────────────┐
    │    DIRECT FORMAT (v1.6.2)   │                   │    FIELD-KEYED FORMAT       │
    │                             │                   │                             │
    │  {                          │                   │  {                          │
    │    "score": "E",            │                   │    "slope": {               │
    │    "feedback": "Great!"     │                   │      "score": "E",          │
    │  }                          │                   │      "feedback": "..."      │
    │                             │                   │    },                       │
    │  Accepted if:               │                   │    "intercept": {...}       │
    │  - 'score' key present      │                   │  }                          │
    │  - score ∈ [E,P,I,e,p,i]    │                   │                             │
    └──────────────┬──────────────┘                   └──────────────┬──────────────┘
                   │                                                 │
                   └─────────────────────┬───────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │    normalizeGradingResponse(parsed)    │
                    │              (v1.6.2 FIX)              │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
    ┌─────────────────────────────┐                   ┌─────────────────────────────┐
    │   DIRECT → FIELD-KEYED     │                   │   FIELD-KEYED (pass through)│
    │                             │                   │                             │
    │  Input:                     │                   │  Input:                     │
    │  { score: "e", feedback }   │                   │  { slope: {...}, ... }      │
    │                             │                   │                             │
    │  Output:                    │                   │  Output:                    │
    │  {                          │                   │  (unchanged)                │
    │    answer: {                │                   │                             │
    │      score: "E",  // UPPER  │                   │                             │
    │      feedback: "..."        │                   │                             │
    │    }                        │                   │                             │
    │  }                          │                   │                             │
    └──────────────┬──────────────┘                   └──────────────┬──────────────┘
                   │                                                 │
                   └─────────────────────┬───────────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │        RETURN TO GRADING FLOW          │
                    │   (consistent field-keyed structure)   │
                    └────────────────────────────────────────┘

BEFORE v1.6.2 (BUG):
  - Direct format { score, feedback } was REJECTED
  - Error: "Invalid response structure"
  - Single-field cartridges failed AI grading

AFTER v1.6.2 (FIXED):
  - Both formats accepted and normalized
  - Uppercase conversion: 'e' → 'E'
  - Default field ID: 'answer'
```

---

## 23. WEBSOCKET CLIENT STATE MACHINE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          WEBSOCKET CLIENT LIFECYCLE                              │
│                       platform/core/websocket-client.js                          │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │            DISCONNECTED                │
                    │                                        │
                    │  ws = null                             │
                    │  connected = false                     │
                    │  reconnectAttempts = 0                 │
                    └────────────────────┬───────────────────┘
                                         │
                                         │ connect(username)
                                         ▼
                    ┌────────────────────────────────────────┐
                    │            CONNECTING                  │
                    │                                        │
                    │  ws = new WebSocket(SERVER_URL)        │
                    │  Waiting for onopen...                 │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │ onopen                                              │ onerror/onclose
              ▼                                                     ▼
    ┌─────────────────────────────┐                   ┌─────────────────────────────┐
    │         CONNECTED           │                   │      CONNECTION FAILED      │
    │                             │                   │                             │
    │  connected = true           │                   │  reconnectAttempts++        │
    │  reconnectAttempts = 0      │                   │                             │
    │                             │                   │  if (attempts < 5) {        │
    │  Actions:                   │                   │    delay = 5000 * attempts  │
    │  1. identify(username)      │                   │    setTimeout(connect, delay)│
    │  2. Start heartbeat (30s)   │                   │  }                          │
    │  3. onConnectionChange(true)│                   │                             │
    └──────────────┬──────────────┘                   └─────────────────────────────┘
                   │
                   │ Normal operation
                   ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                           ACTIVE CONNECTION                                  │
    │                                                                             │
    │  OUTBOUND (Client → Server):                                                │
    │  ┌─────────────────────────────────────────────────────────────────────┐   │
    │  │  identify()         → { type: 'identify', username }                │   │
    │  │  sendHeartbeat()    → { type: 'heartbeat', username }  (every 30s)  │   │
    │  │  notifyStarEarned() → { type: 'star_earned', username, starType }   │   │
    │  │  notifyModeUnlock() → { type: 'mode_unlocked', ... }                │   │
    │  └─────────────────────────────────────────────────────────────────────┘   │
    │                                                                             │
    │  INBOUND (Server → Client):                                                 │
    │  ┌─────────────────────────────────────────────────────────────────────┐   │
    │  │  'star_earned'         → onStarEarned(data) [skip if own username]  │   │
    │  │  'presence_snapshot'   → onlineUsers = data.users                   │   │
    │  │  'user_online'         → onlineUsers.push(username)                 │   │
    │  │  'user_offline'        → onlineUsers.filter(!=username)             │   │
    │  │  'leaderboard_update'  → onLeaderboardUpdate(data)                  │   │
    │  │  'territory_claimed'   → handleGridWarsMessage()                    │   │
    │  │  'points_earned'       → handleGridWarsMessage()                    │   │
    │  │  'velocity_update'     → handleGridWarsMessage()                    │   │
    │  │  ... (all grid-wars-* messages)                                     │   │
    │  └─────────────────────────────────────────────────────────────────────┘   │
    │                                                                             │
    └────────────────────────────────┬────────────────────────────────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────────┐
              │ onclose                                         │ disconnect()
              ▼                                                 ▼
    ┌─────────────────────────────┐                   ┌─────────────────────────────┐
    │     UNEXPECTED CLOSE        │                   │      CLEAN DISCONNECT       │
    │                             │                   │                             │
    │  connected = false          │                   │  ws.close()                 │
    │  clearInterval(heartbeat)   │                   │  ws = null                  │
    │  onConnectionChange(false)  │                   │  connected = false          │
    │                             │                   │  No reconnect attempt       │
    │  → Auto-reconnect logic     │                   │                             │
    └──────────────┬──────────────┘                   └─────────────────────────────┘
                   │
                   │ if reconnectAttempts < 5
                   ▼
    ┌────────────────────────────────────────┐
    │         RECONNECTING                   │
    │                                        │
    │  Exponential backoff:                  │
    │  - Attempt 1: wait 5s                  │
    │  - Attempt 2: wait 10s                 │
    │  - Attempt 3: wait 15s                 │
    │  - Attempt 4: wait 20s                 │
    │  - Attempt 5: wait 25s                 │
    │  - After 5: GIVE UP                    │
    └────────────────────────────────────────┘
```

---

## 24. KEY POOL MANAGER STATE MACHINE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KEY POOL MANAGER                                       │
│                     railway-server/server.js (class KeyPoolManager)              │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │           INITIAL STATE                │
                    │                                        │
                    │  keys = { gemini: [], groq: [] }       │
                    │  currentIndex = { gemini: 0, groq: 0 } │
                    │  lastRefresh = 0                       │
                    └────────────────────┬───────────────────┘
                                         │
                                         │ getNextKey(provider) called
                                         ▼
                    ┌────────────────────────────────────────┐
                    │          CHECK CACHE FRESHNESS         │
                    │                                        │
                    │  if (now - lastRefresh > 30000) {      │
                    │    refreshKeys()                       │
                    │  }                                     │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │           refreshKeys()                │
                    │                                        │
                    │  1. Query api_keys_pool table          │
                    │  2. Filter by provider (gemini/groq)   │
                    │  3. Populate keys[provider] array      │
                    │  4. Reset currentIndex[provider] = 0   │
                    │  5. lastRefresh = Date.now()           │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                         ROUND-ROBIN KEY SELECTION                            │
    │                                                                             │
    │   for (let i = 0; i < keys[provider].length; i++) {                         │
    │     index = (currentIndex[provider] + i) % keys.length                      │
    │     key = keys[provider][index]                                             │
    │                                                                             │
    │     ┌──────────────────────────────────────────────────────────────────┐   │
    │     │  IS KEY RATE-LIMITED?                                            │   │
    │     │                                                                  │   │
    │     │  if (key.rateLimitedUntil && now < key.rateLimitedUntil) {      │   │
    │     │    // Skip this key, try next                                   │   │
    │     │    continue;                                                     │   │
    │     │  }                                                               │   │
    │     └─────────────────────────────┬────────────────────────────────────┘   │
    │                                   │                                         │
    │     ┌──────────────────────────────────────────────────────────────────┐   │
    │     │  KEY AVAILABLE                                                   │   │
    │     │                                                                  │   │
    │     │  currentIndex[provider] = (index + 1) % length                   │   │
    │     │  return { key: key.api_key, id: key.id }                         │   │
    │     └──────────────────────────────────────────────────────────────────┘   │
    │   }                                                                         │
    │                                                                             │
    │   // All keys rate-limited: fallback to env var                             │
    │   return { key: process.env[`${PROVIDER}_API_KEY`], id: 'env' }             │
    │                                                                             │
    └─────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │        markRateLimited(keyId)          │
                    │                                        │
                    │  When provider returns 429/quota error: │
                    │                                        │
                    │  1. Find key by ID in local cache      │
                    │  2. key.rateLimitedUntil = now + 60s   │
                    │  3. Update Supabase api_keys_pool      │
                    │     SET rate_limited_until = now + 60s │
                    └────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │          markUsed(keyId)               │
                    │                                        │
                    │  On successful API call:               │
                    │                                        │
                    │  1. Update Supabase api_keys_pool      │
                    │     SET last_used_at = now             │
                    │     SET usage_count = usage_count + 1  │
                    └────────────────────────────────────────┘

KEY ROTATION EXAMPLE:
═══════════════════════════════════════════════════════════════════════════════

Keys: [K1, K2, K3]   currentIndex = 0

Request 1: Use K1 → Success → currentIndex = 1
Request 2: Use K2 → Rate Limited (429) → Mark K2 limited for 60s → Try K3
Request 3: Use K3 → Success → currentIndex = 0
Request 4: Use K1 → Success → currentIndex = 1
Request 5: K2 still limited → Skip → Use K3 → currentIndex = 0
...
After 60s: K2 available again
```

---

## 25. GRADING QUEUE STATE MACHINE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GRADING QUEUE                                       │
│                   railway-server/server.js (class GradingQueue)                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Purpose: Rate-limit AI grading requests to avoid provider throttling

                    ┌────────────────────────────────────────┐
                    │              IDLE STATE                │
                    │                                        │
                    │  queue = []                            │
                    │  processing = false                    │
                    │  lastRequestTime = 0                   │
                    │  minDelayMs = 1500  (1.5s between)     │
                    └────────────────────┬───────────────────┘
                                         │
                                         │ add(task) called
                                         ▼
                    ┌────────────────────────────────────────┐
                    │           add(task) → Promise          │
                    │                                        │
                    │  1. Create Promise (resolve, reject)   │
                    │  2. Push { task, resolve, reject }     │
                    │  3. Call process() if not processing   │
                    │  4. Return Promise to caller           │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                         PROCESSING LOOP                                      │
    │                                                                             │
    │  async process() {                                                          │
    │    if (processing) return;  // Already running                              │
    │    processing = true;                                                       │
    │                                                                             │
    │    while (queue.length > 0) {                                               │
    │      ┌──────────────────────────────────────────────────────────────────┐  │
    │      │  RATE LIMITING                                                   │  │
    │      │                                                                  │  │
    │      │  timeSince = now - lastRequestTime                               │  │
    │      │  if (timeSince < minDelayMs) {                                   │  │
    │      │    await sleep(minDelayMs - timeSince)                           │  │
    │      │  }                                                               │  │
    │      │  lastRequestTime = now                                           │  │
    │      └──────────────────────────────────────────────────────────────────┘  │
    │                                                                             │
    │      ┌──────────────────────────────────────────────────────────────────┐  │
    │      │  EXECUTE TASK                                                    │  │
    │      │                                                                  │  │
    │      │  { task, resolve, reject } = queue.shift()                       │  │
    │      │  try {                                                           │  │
    │      │    result = await task()  // Call gradeWithAI()                  │  │
    │      │    resolve(result)                                               │  │
    │      │  } catch (err) {                                                 │  │
    │      │    reject(err)                                                   │  │
    │      │  }                                                               │  │
    │      └──────────────────────────────────────────────────────────────────┘  │
    │    }                                                                        │
    │                                                                             │
    │    processing = false;                                                      │
    │  }                                                                          │
    │                                                                             │
    └─────────────────────────────────────────────────────────────────────────────┘

TIMING EXAMPLE:
═══════════════════════════════════════════════════════════════════════════════

T=0ms:    Request A arrives → queue = [A] → process() starts
T=0ms:    A executes immediately (no delay, first request)
T=800ms:  A completes
T=800ms:  Request B arrives → queue = [B]
T=800ms:  Wait 700ms (1500 - 800 = 700ms until allowed)
T=1500ms: B executes
T=1600ms: Request C arrives → queue = [C]
T=2200ms: B completes
T=2200ms: Wait 800ms (1500 - 700 = 800ms until allowed)
T=3000ms: C executes
...

getQueueLength() returns queue.length for logging:
  "Grading request queued (position 3): topic, cartridge: lsrl, prefer: auto"
```

---

## 26. STAR PENALTY CALCULATION (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STAR TYPE DETERMINATION                                 │
│                        platform/core/game-engine.js                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │        ALL FIELDS CORRECT (E)          │
                    │          Ready to award star           │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │      COUNT TOTAL PENALTIES             │
                    │                                        │
                    │  hintsUsed = hintsUsedThisProblem.size │
                    │  retries = retriesThisProblem          │
                    │                                        │
                    │  totalPenalties = hintsUsed + retries  │
                    │                                        │
                    │  NOTE: Both count EQUALLY!             │
                    │  1 hint = 1 retry = 1 penalty          │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                          │                          │
    penalties=0              penalties=1 or 2             penalties≥3
              │                          │                          │
              ▼                          ▼                          ▼
    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
    │    GOLD ★★★★    │      │   SILVER/BRONZE │      │     TIN ★       │
    │    4 points     │      │                 │      │    1 point      │
    └─────────────────┘      │   if (p == 1):  │      └─────────────────┘
                             │     SILVER ★★★  │
                             │     3 points    │
                             │                 │
                             │   if (p == 2):  │
                             │     BRONZE ★★   │
                             │     2 points    │
                             └─────────────────┘

COMMON SCENARIOS:
═══════════════════════════════════════════════════════════════════════════════

Scenario 1: Perfect answer on first try
  hints = 0, retries = 0 → penalties = 0 → GOLD (4 pts)

Scenario 2: Correct after using 1 hint
  hints = 1, retries = 0 → penalties = 1 → SILVER (3 pts)

Scenario 3: Correct on 2nd try (first answer wrong)
  hints = 0, retries = 1 → penalties = 1 → SILVER (3 pts)

Scenario 4: Used 1 hint, then got it wrong, then correct
  hints = 1, retries = 1 → penalties = 2 → BRONZE (2 pts)

Scenario 5: Used all 3 hints, correct on first try
  hints = 3, retries = 0 → penalties = 3 → TIN (1 pt)

Scenario 6: No hints, correct on 4th try
  hints = 0, retries = 3 → penalties = 3 → TIN (1 pt)

IMPORTANT: Retries increment ONLY when submitting wrong answer.
           Hints increment when clicking "Show Hint" button.
           Both reset on new problem (resetHintsForNewProblem).
```

---

## 27. CONFIG LOADING STATE MACHINE (v1.6.2 FIX)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       GRID SIZE CONFIG LOADING (v1.6.2)                          │
│                                                                                  │
│   ISSUE: Frontend was using hardcoded gridSize: 20 instead of config value      │
│   FIX: Now reads from GRID_WARS_CONFIG.mapSize (defaults to 8)                  │
└─────────────────────────────────────────────────────────────────────────────────┘

BEFORE v1.6.2 (BUG):
═══════════════════════════════════════════════════════════════════════════════

                shared/gridwars.config.js          grid-panel.js
                ┌─────────────────────────┐        ┌─────────────────────────┐
                │ mapSize: 8              │        │ this.renderer = new     │
                │ (correct)               │   ✗    │   GridRenderer(canvas, {│
                │                         │ ───────│     gridSize: 20,       │ ← HARDCODED!
                │ (NOT USED)              │        │     cellSize: size / 20 │
                └─────────────────────────┘        │   });                   │
                                                   └─────────────────────────┘
                                                              │
                                                              ▼
                                                   ┌─────────────────────────┐
                                                   │  RENDERED: 20×20 grid   │
                                                   │  (400 cells, should be  │
                                                   │   64 cells on 8×8)      │
                                                   └─────────────────────────┘


AFTER v1.6.2 (FIXED):
═══════════════════════════════════════════════════════════════════════════════

                    ┌────────────────────────────────────────┐
                    │   shared/gridwars.config.js            │
                    │                                        │
                    │   export const GRID_WARS_CONFIG = {    │
                    │     mapSize: 8,        ◄───────────── SINGLE SOURCE OF TRUTH
                    │     claimCost: 40,                     │
                    │     bootBonus: 30,                     │
                    │     ...                                │
                    │   }                                    │
                    └────────────────────┬───────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                         ▼                               ▼
          ┌─────────────────────────────┐  ┌─────────────────────────────┐
          │     grid-state.js           │  │     grid-panel.js           │
          │                             │  │                             │
          │  import { GRID_WARS_CONFIG }│  │  import { GRID_WARS_CONFIG }│
          │    from './grid-state.js'; │  │    from './grid-state.js'; │
          │                             │  │                             │
          │  // Module-level config:    │  │  _initCanvas() {            │
          │  GRID_WARS_CONFIG = {       │  │    const mapSize =          │
          │    mapSize: 8,  // default  │  │      GRID_WARS_CONFIG.      │
          │    ...                      │  │      mapSize || 8;          │
          │  }                          │  │                             │
          │                             │  │    console.log('[GridPanel]'│
          │  // Updated by init():      │  │      + ' mapSize:', mapSize)│
          │  Object.assign(config,      │  │                             │
          │    serverConfig);           │  │    this.renderer = new      │
          └─────────────────────────────┘  │      GridRenderer(canvas, { │
                                           │        gridSize: mapSize,   │
                                           │        cellSize: size /     │
                                           │          mapSize            │
                                           │      });                    │
                                           │  }                          │
                                           └──────────────┬──────────────┘
                                                          │
                                                          ▼
                                           ┌─────────────────────────────┐
                                           │  Console: "[GridPanel]      │
                                           │   Creating renderer with    │
                                           │   mapSize: 8"               │
                                           │                             │
                                           │  RENDERED: 8×8 grid ✓       │
                                           │  (64 cells, correct!)       │
                                           └─────────────────────────────┘

VERIFICATION:
  Browser console should show: [GridPanel] Creating renderer with mapSize: 8
  Grid should display 64 cells (8×8), not 400 cells (20×20)
```

---

## 28. VELOCITY QUERY FIX (v1.6.2)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         VELOCITY QUERY COLUMN NAME FIX                           │
│                              railway-server/server.js                            │
└─────────────────────────────────────────────────────────────────────────────────┘

BEFORE v1.6.2 (BUG):
═══════════════════════════════════════════════════════════════════════════════

  recordPointEvent():
    await supabase.from('point_events').insert({
      game_id: gameId,
      username: username,    ◄── ERROR: Column doesn't exist!
      delta: delta,
      ...
    });

  getPlayerVelocity():
    const { data } = await supabase
      .from('point_events')
      .select('delta')
      .eq('game_id', gameId)
      .eq('username', username)    ◄── ERROR: Column doesn't exist!
      .gt('created_at', cutoffTime);

  Error: "column point_events.username does not exist"


AFTER v1.6.2 (FIXED):
═══════════════════════════════════════════════════════════════════════════════

  recordPointEvent():
    await supabase.from('point_events').insert({
      game_id: gameId,
      player_id: username,   ◄── FIXED: Matches actual table schema
      delta: delta,
      ...
    });

  getPlayerVelocity():
    const { data } = await supabase
      .from('point_events')
      .select('delta')
      .eq('game_id', gameId)
      .eq('player_id', username)   ◄── FIXED: Matches actual table schema
      .gt('created_at', cutoffTime);


MIGRATION FILE UPDATED:
═══════════════════════════════════════════════════════════════════════════════

  railway-server/migrations/001_point_events.sql:

  CREATE TABLE IF NOT EXISTS point_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT NOT NULL DEFAULT 'lynn-classroom-2026',
    player_id TEXT NOT NULL,  -- v1.6.2: Renamed from username for consistency
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    cartridge_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_point_events_player_time
  ON point_events(game_id, player_id, created_at DESC);  -- Updated index
```

---

## 29. VERIFICATION CHECKLIST (v1.6.2)

Use this checklist to verify the system is working correctly:

### Server Configuration
- [ ] Railway logs show `=== GRID WARS CONFIG ===` on startup
- [ ] `mapSize: 8` logged (not 20 or 25)
- [ ] `nodesEnabled: false` logged
- [ ] `claimCost: 40` logged
- [ ] `bootBonus: 30` logged
- [ ] `/api/grid-wars/config` returns correct values

### Grid Wars UI (v1.6.2)
- [ ] Browser console shows `[GridPanel] Creating renderer with mapSize: 8`
- [ ] Map displays 8×8 grid (64 cells, not 400 or 625)
- [ ] No "CLASS GOAL" progress bar visible
- [ ] Leaderboard header says "🏰 TERRITORY HELD"
- [ ] Leaderboard shows only territory count with 🏰 emoji
- [ ] Leaderboard sorted by territory count (most territories first)
- [ ] Player rank reflects position in territory-sorted list

### AI Grading (v1.6.2)
- [ ] Single-field questions return valid grades (no "Invalid response structure" error)
- [ ] Direct format `{score, feedback}` is accepted
- [ ] Field-keyed format `{fieldId: {score, feedback}}` is accepted
- [ ] Lowercase scores (`e`, `p`, `i`) are converted to uppercase
- [ ] Railway logs show normalized response structure

### Velocity Tracking (v1.6.2)
- [ ] No "column point_events.username does not exist" errors
- [ ] Point events use `player_id` column
- [ ] Velocity calculations work correctly
- [ ] Velocity tier displays update in real-time

### Game Mechanics
- [ ] Boot bonus is 30 pts (can't claim immediately on 40pt cells)
- [ ] No resource nodes on map (nodesEnabled: false)
- [ ] Scarcity phases trigger at correct thresholds (30%/60%/85%)
- [ ] Bounty system activates at 20% of map (≈13 cells)
- [ ] Star penalties: hints + retries both count equally

---

## 30. STATE VARIABLE QUICK REFERENCE

| Component | File | Key State Variables |
|-----------|------|---------------------|
| GameEngine | `platform/core/game-engine.js` | `streaks`, `starCounts`, `starsPerMode`, `unlockedTiers`, `hintsUsedThisProblem`, `retriesThisProblem` |
| GradingEngine | `platform/core/grading-engine.js` | `serverUrl`, `defaultTolerance` (mostly stateless) |
| GridWarsState | `platform/game/grid-state.js` | `territories`, `players`, `scarcityPhase`, `bountyTargets`, `velocityTier`, `_pendingActions`, `_resyncInProgress`, `_sessionFrozen`, `_cooldownUntil` |
| GridPanel | `platform/game/grid-panel.js` | `isExpanded`, `selectedCell`, `_leaderboardData`, `_cooldownInterval`, `_resyncDelayTimer` |
| WebSocketClient | `platform/core/websocket-client.js` | `ws`, `connected`, `reconnectAttempts`, `heartbeatInterval`, `onlineUsers` |
| GradingQueue | `railway-server/server.js` | `queue`, `processing`, `lastRequestTime` |
| KeyPoolManager | `railway-server/server.js` | `keys`, `currentIndex`, `lastRefresh` |
| Server State | `railway-server/server.js` | `clients`, `frozenGames`, `cooldowns`, `broadcastSequence` |

---

## 31. SECTION INDEX

| # | Section | Description |
|---|---------|-------------|
| 1 | Game Engine — Star Earning Flow | Streak/star/unlock logic |
| 2 | Grading Engine — Dual Grading Pipeline | Keywords → AI → Best Score |
| 3 | Grid Wars — Territory Claim Flow | Cost calculation, claim process |
| 4 | Velocity Tier State Machine | Points/min tiers and discounts |
| 5 | Scarcity Phase State Machine | Map fill % → cost multipliers |
| 6 | Bounty System State Machine | Target players with >20% map |
| 7 | Diminishing Returns State Machine | Empire overhead penalty |
| 8 | AFK Decay State Machine | 24hr grace, then cell loss |
| 9 | Session Lifecycle State Machine | Teacher end/resume/reset |
| 10 | Presence & Connection State Machine | WebSocket client tracking |
| 11 | Leaderboard State Machine | Territory-sorted ranking |
| 12 | WebSocket Message Flow | Client ↔ Server messages |
| 13 | Contiguity Bonus Calculation | Connected territory bonus |
| 14 | Complete System Flow | End-to-end student experience |
| 15 | Identified Issues / Verification Notes | Race conditions, persistence |
| 16 | State Variable Inventory | Server-side variables |
| 17 | API Endpoint Inventory | REST endpoints |
| 18 | Interval/Timer Inventory | Background tasks |
| 19 | Configuration Loading (v1.6.1) | Centralized config |
| 20 | UI Element State Machine | Grid panel UI states |
| 21 | Complete Data Flow | End-to-end data flow diagram |
| 22 | AI Grading Normalization (v1.6.2) | Response format handling |
| 23 | WebSocket Client State Machine | Connection lifecycle |
| 24 | Key Pool Manager State Machine | API key rotation |
| 25 | Grading Queue State Machine | Rate-limiting queue |
| 26 | Star Penalty Calculation | Hints + retries → star type |
| 27 | Config Loading Fix (v1.6.2) | Grid size config loading |
| 28 | Velocity Query Fix (v1.6.2) | player_id column fix |
| 29 | Verification Checklist | System health checks |
| 30 | State Variable Quick Reference | Variable summary table |
| 31 | Section Index | This index |

---

*Generated by Claude Code analysis of LRSL Driller v1.6.2*
*Last updated: January 2026*
*Total sections: 31*
