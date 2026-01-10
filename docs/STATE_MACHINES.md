# LRSL Driller State Machine Diagrams

Complete state machine documentation for all components as of v1.5.1.

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
              └───────────┬───────────┘                           └───────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┬─────────────────────┐
    │                     │                     │                     │
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

## 3. GRID WARS — Territory Claim Flow

```
                          ┌─────────────────────────────────────┐
                          │         PLAYER CLICKS CELL          │
                          └─────────────────┬───────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────┐
                          │          VALIDATE ACTION            │
                          │  • Has uplink? (answered in 10min)  │
                          │  • Session not frozen?              │
                          │  • Not in cooldown?                 │
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
          │                     CALCULATE COST                              │
          │                                                                 │
          │  1. BASE COST (by cell type & defender activity)                │
          │     ├─ Neutral: 30 pts                                          │
          │     ├─ Enemy COLD (>8min): 45 pts                               │
          │     ├─ Enemy WARM (3-8min): 60 pts                              │
          │     └─ Enemy ACTIVE (<3min): 75 pts                             │
          │                                                                 │
          │  2. SCARCITY MULTIPLIER (by map fill %)                         │
          │     ├─ EXPANSION (0-50%): 1.0x                                  │
          │     ├─ TENSION (50-80%): 1.6x                                   │
          │     ├─ SCARCITY (80-95%): 2.2x                                  │
          │     └─ SATURATION (95-100%): 3.0x                               │
          │                                                                 │
          │  3. VELOCITY DISCOUNT (attacker's pts/min)                      │
          │     ├─ BLAZING (≥2.0): -40%                                     │
          │     ├─ FLOWING (≥1.0): -25%                                     │
          │     ├─ ACTIVE (≥0.5): -10%                                      │
          │     └─ IDLE (<0.5): 0%                                          │
          │                                                                 │
          │  4. GUERRILLA DISCOUNT (small vs large)                         │
          │     ├─ ≤10 cells vs ≥50: -50%                                   │
          │     ├─ ≤20 cells vs ≥75: -40%                                   │
          │     ├─ ≤30 cells vs ≥100: -30%                                  │
          │     └─ Otherwise: 0%                                            │
          │                                                                 │
          │  5. OVEREXTENSION DISCOUNT (target cell isolation)              │
          │     ├─ Isolated (0-2 neighbors): -30%                           │
          │     ├─ Edge (3-5 neighbors): -15%                               │
          │     └─ Core (6+ neighbors): 0%                                  │
          │                                                                 │
          │  FINAL = max(10, round(BASE × SCARCITY × (1-VEL) × (1-GUE) × (1-OVE))) │
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
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────────────────────────────────────────────────────┐
          │                    SEND TO SERVER                               │
          │              POST /api/grid-wars/action                         │
          └─────────────────────────────────┬───────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               ▼
          ┌─────────────────┐                             ┌─────────────────┐
          │ SERVER CONFIRMS │                             │ SERVER REJECTS  │
          │ → Keep changes  │                             │ → Rollback UI   │
          │ → Broadcast to  │                             │ → Restore pts   │
          │   all clients   │                             │ → Show error    │
          └────────┬────────┘                             └─────────────────┘
                   │
                   ▼
          ┌─────────────────────────────────────────────────────────────────┐
          │                    IF BOUNTY TARGET                             │
          │         (defender owns ≥20% of map = 125 cells)                 │
          │         → Award +15 bonus points to attacker                    │
          │         → Broadcast 'bounty_claimed' event                      │
          └─────────────────────────────────────────────────────────────────┘
```

---

## 4. VELOCITY TIER STATE MACHINE

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

## 5. SCARCITY PHASE STATE MACHINE

```
                         Map Fill Percentage
                               │
      0%                       ▼                            100%
       ├───────────────────────┼───────────────────────────────┤
       │                       │                               │
       │◀────── EXPANSION ────▶│◀─── TENSION ──▶│◀─ SCARCITY ─▶│◀─SAT─▶│
       │       (0-50%)         │    (50-80%)    │   (80-95%)   │(95%+) │
       │                       │                │              │       │
       └───────────────────────┴────────────────┴──────────────┴───────┘

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   EXPANSION     │      │    TENSION      │      │   SCARCITY      │      │  SATURATION     │
│   🌱 Land Rush  │      │ ⚡ Tightening   │      │ 🔥 Prime Gone   │      │ 💎 Last Parcels │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ Multiplier: 1.0 │      │ Multiplier: 1.6 │      │ Multiplier: 2.2 │      │ Multiplier: 3.0 │
│ Claim: 30 pts   │─────▶│ Claim: 48 pts   │─────▶│ Claim: 66 pts   │─────▶│ Claim: 90 pts   │
│ UI: Hidden      │      │ UI: Yellow      │      │ UI: Red         │      │ UI: Purple      │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
       fill≤50%                50%<fill≤80%           80%<fill≤95%            fill>95%

                                 ┌─────────────────────────────────────┐
                                 │           100% FULL                 │
                                 │  ⚔️ ALL TERRITORY CLAIMED           │
                                 │  Only Conquest Remains              │
                                 │  (No neutral cells to claim)        │
                                 └─────────────────────────────────────┘

Transitions are BIDIRECTIONAL — scarcity can decrease if cells decay back to neutral
```

---

## 6. BOUNTY SYSTEM STATE MACHINE

```
                    ┌────────────────────────────────────────┐
                    │      CHECK BOUNTIES (every 60s)        │
                    │  For each player with territory:       │
                    │  cells_owned / 625 > 20%?              │
                    └────────────────────┬───────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
    ┌─────────────────────┐                           ┌─────────────────────┐
    │  BELOW THRESHOLD    │                           │  ABOVE THRESHOLD    │
    │  (< 125 cells)      │                           │  (≥ 125 cells)      │
    │  No bounty          │                           │  BOUNTY ACTIVE      │
    └─────────────────────┘                           └──────────┬──────────┘
                                                                 │
                                                                 ▼
                                              ┌─────────────────────────────────┐
                                              │         BOUNTY TARGET           │
                                              │  • Cells glow gold              │
                                              │  • Name in bounty list          │
                                              │  • +15 pts for attackers        │
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
                              │  • +15 bonus pts    │                        │
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

## 7. AFK DECAY STATE MACHINE

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

## 8. SESSION LIFECYCLE STATE MACHINE

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
    │  Summary calculated:                                                    │
    │  • Top territories holder                                               │
    │  • Most points earned                                                   │
    │  • Rankings for session                                                 │
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
    │                     │                       │  • Points reset     │
    │  • Same territory   │                       │  • New game begins  │
    │  • Same points      │                       │                     │
    │  • Game continues   │                       │  (v1.5: NOT used)   │
    └─────────────────────┘                       └─────────────────────┘
```

---

## 9. WEBSOCKET MESSAGE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT ←→ SERVER MESSAGES                             │
└─────────────────────────────────────────────────────────────────────────────────┘

CLIENT → SERVER (HTTP POST)                SERVER → CLIENT (WebSocket Broadcast)
═══════════════════════════                ════════════════════════════════════════

/api/grid-wars/action ─────────────────────▶ territory_claimed
  { action: 'claim', x, y }                   { owner, x, y, strength, cost }

/api/grid-wars/points/add ─────────────────▶ points_earned
  { gameId, username, starType }              { username, points, total, starType }
                                            ▶ velocity_update
                                              { username, tier, discount, velocity }

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

## 10. COMPLETE SYSTEM FLOW

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
│   points = starBase × levelMultiplier × (1 - diminishingPenalty)               │
│                                                                                 │
│   Range: 1 point (tin L1) → 12 points (gold final level)                       │
│                                                                                 │
│   Side effects:                                                                 │
│   • recordPointEvent() → Supabase (velocity tracking)                          │
│   • velocity recalculated → tier may change                                    │
│   • broadcast velocity_update to client                                         │
│   • contiguity bonus if on own territory                                       │
│   • amplifier bonus if on node                                                  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          GRID WARS INTERACTION                                   │
│                                                                                 │
│   Player opens Grid Wars panel (▼ toggle)                                       │
│                                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────────┐ │
│   │                          25 × 25 MAP                                      │ │
│   │                                                                           │ │
│   │    ○ Neutral cells (gray)     ● Your cells (your color)                  │ │
│   │    ● Enemy cells (their color) ★ Resource nodes (amplifiers)             │ │
│   │    ✦ Bounty target (gold glow) ⚡ Surge cells (temporary)                 │ │
│   │                                                                           │ │
│   │   Scarcity: ⚡ TENSION │ 65% Claimed │ Velocity: 🔥 BLAZING              │ │
│   └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│   Actions:                                                                      │
│   • Click neutral → CLAIM (30 pts × scarcity multiplier)                       │
│   • Click enemy → TAKEOVER (45-75 pts × discounts)                             │
│   • Hover → See cost breakdown                                                  │
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
│      │                                                                          │
│      ▼                                                                          │
│   DEFEND TERRITORY ◀──── OTHER PLAYERS ATTACK                                  │
│      │                                                                          │
│      │    (if inactive 24+ hours)                                              │
│      ▼                                                                          │
│   AFK DECAY ─────▶ CELLS RETURN TO NEUTRAL ─────▶ OPPORTUNITY FOR OTHERS       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## IDENTIFIED ISSUES / VERIFICATION NOTES

### Potential Race Conditions
1. **Optimistic claim + server rejection**: UI shows claim, then rolls back. Could flash confusingly.
2. **Velocity update after point event**: Small delay between recordPointEvent() and getPlayerVelocity() could miss the just-added event.
3. **Bounty calculation timing**: Player could drop below threshold between check and claim processing.

### Missing State Transitions
1. **No explicit "game over" state** — game is permanent (by design in v1.5).
2. **No surrender mechanic** — player with 0 cells still exists in system.
3. **No alliance system** — players are always solo.

### Guard Validation Gaps
1. **Uplink validation** happens client-side AND server-side (good).
2. **Session freeze check** in server but optimistic update might not check first.
3. **Cooldown** enforced server-side, UI shows overlay reactively.

### Persistence Points
| State | Persisted To | Restored On |
|-------|--------------|-------------|
| Star counts | localStorage | Page reload |
| Tier unlocks | localStorage | Page reload |
| Territory | Supabase | Full state sync |
| Points | Supabase | Full state sync |
| Velocity events | Supabase | Server restart |
| Session frozen | In-memory Set | ❌ Lost on restart |
| Bounty targets | Recalculated | Server restart |

### Recommendation: Session Frozen Persistence
Currently `frozenGames` is a `Set` in memory. If server restarts during frozen session, it resumes unfrozen. Consider adding to Supabase:
```sql
ALTER TABLE grid_wars_games ADD COLUMN is_frozen BOOLEAN DEFAULT false;
```

---

*Generated by Claude Code analysis of LRSL Driller v1.5.1*
