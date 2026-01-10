# LRSL Driller State Machine Diagrams

Complete state machine documentation for all components as of v1.6.

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

## 11. LEADERBOARD STATE MACHINE (v1.6)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    v1.6 SINGLE LEADERBOARD (lifetime_earned)                    │
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
                           │     ORDER BY lifetime_earned    │
                           │     DESC                        │
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
                           │     GRID PANEL UPDATES UI       │
                           │                                 │
                           │  _leaderboardData = leaderboard │
                           │  renderLeaderboardContent()     │
                           │                                 │
                           │  Display:                       │
                           │  ┌─────────────────────────┐    │
                           │  │ 🏆 LEADERBOARD          │    │
                           │  │ Rank: #3                │    │
                           │  ├─────────────────────────┤    │
                           │  │ 1. Alice    150 pts (5) │    │
                           │  │ 2. Bob      120 pts (3) │    │
                           │  │ 3. You       80 pts (2) │    │
                           │  │ 4. Carol     60 pts (1) │    │
                           │  └─────────────────────────┘    │
                           │                                 │
                           │  (pts) = territories_count      │
                           └─────────────────────────────────┘

v1.6 Changes from v1.5:
  - Removed 3-tab system (Scholar/Banker/General)
  - Single metric: lifetime_earned
  - Real-time WebSocket updates (was polling)
  - Shows territories as secondary info
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

*Generated by Claude Code analysis of LRSL Driller v1.6*
