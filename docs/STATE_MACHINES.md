# LRSL Driller State Machine Diagrams

Complete state machine documentation for all components as of v2.1.5.

**v2.1.5 Changes (Subcell Claims + Navigation Polish):**
- Fixed subcell claims: Now sends `parentAddress` and `cellLevel` to server
  - Client: `claimTerritory()` includes `parentAddress: this.currentParent, cellLevel: this.currentLevel`
  - Server: Builds `targetAddress` from parent context, uses address-based lookup for subcells
- Added coordinate display: Shows full address like "📍 D5.C3.A1" in UI
  - New `updateCoordsDisplay(x, y)` method in grid-panel.js
  - Updates on cell hover via `onCellHover` callback
- Added arrow key navigation:
  - Up arrow: Zoom into developed cell (equivalent to double-click)
  - Down arrow: Zoom out to parent level (equivalent to ESC)
- Added develop/drill tooltips explaining mechanics:
  - Develop: "Subdivide into 64 subcells. Keep center 4 (d4,d5,e4,e5). 60 become neutral."
  - Drill: "Force subdivision. You claim corner a1. Defender keeps center 4."
- Added 34 regression tests in `tests/game/grid-wars-v2.1.5.test.js`

**v2.1.2 Changes (Grid Wars Rendering Fixes):**
- Fixed `drawOwnerPresence()`: Was accessing undefined `cell.x`/`cell.y` properties
  - Territory objects are stored as `{ "x,y": { owner, color, ... } }` - coords in key, not object
  - Fix: Extract coords with `const [x, y] = key.split(',').map(Number)`
- Added `hierarchyEnabled` default to client-side config
  - Was only set after server config fetch, causing chevrons to appear on slow loads
  - Now defaults to `true` so presence dots mode is always enabled for v2.0+
- Added debug logging throughout Grid Wars state/panel/renderer:
  - `[GridWarsState] refreshState response:` - territory/player counts from server
  - `[GridPanel] syncRendererState:` - data passed to renderer
  - `[GridPanel] hierarchyEnabled:` - confirms which mode is active
  - `[GridRenderer] setUsePresenceDots:` - confirms presence dots enabled
- Added 21 regression tests in `tests/game/grid-wars-v2.1.2.test.js`

**v2.1.1 Changes (AI Feedback Panel Fix):**
- Fixed field ID mismatch: Server normalized to 'answer' but client expected actual field ID
- Server now remaps 'answer' field to actual field ID from `scenario.fieldId` or `answers` keys
- Applied to both `/api/ai/grade` and `/api/ai/appeal` endpoints
- Added 10 tests for field ID remapping logic

**v2.1 Changes (AI Feedback Visibility + Leaderboard Persistence):**
- Enhanced AI feedback panel with debug logging for grading flow transparency
- New `/api/progress/cartridge-sync` endpoint for aggregate star counts per cartridge
- New `user_progress` table (migration 004) stores star counts per user per cartridge
- Unified leaderboard now includes user_progress data alongside Grid Wars and lsrl_progress
- Stars now sync to server after each award for proper leaderboard tracking

**v2.0.1 Changes (AI Feedback Transparency):**
- AI Feedback Panel: Always-visible panel showing AI grading results to students
- Model info in response: Server returns `_model` field ('llama-3.3-70b-versatile' or 'gemini-2.0-flash')
- Panel shows: Provider/model, AI score (E/P/I), AI feedback, agreement with keywords
- Appeal integration: Panel updates with "AI APPEAL REVIEW" title after appeals
- Panel lifecycle: Hidden on Skip/Next/Try Again, shown after AI grading completes
- New component: `platform/core/ai-feedback-panel.js`
- Updated: `platform.js` captures `_model` from AI response
- Updated: `app.html` integrates panel into grading flow

**v2.0 Changes (Fractal Subdivision):**
- Hierarchical territory system: Cells can be subdivided into 64 subcells
- Chess-notation addressing: "d5", "d5.c3", "d5.c3.a1" (max 3 levels)
- Develop action: Owner pays 100 pts, keeps center 4 subcells (d4, d5, e4, e5)
- Drill action: Attacker pays 75 pts at 85%+ map fill, gets corner (a1)
- Navigation: Click developed cell to zoom in, ESC/Backspace to zoom out
- Breadcrumb UI: Clickable path navigation (MAP › D5 › C3)
- Presence dots: Replace moveable avatars with dots on owned cells
- Leaderboard: Shows macro + subcell counts ("3 + 12 📦")
- New state endpoint: `?parent=d5` query param for hierarchy navigation
- WebSocket broadcasts: `cell_developed`, `cell_drilled` events
- 40 new unit tests for address utilities

**v1.6.3 Changes:**
- Fixed AI grading prompt: `{{STUDENT_ANSWER}}` (SCREAMING_SNAKE_CASE) now replaced correctly
- Extracted `buildCartridgePrompt` to `railway-server/prompt-utils.js` for testability
- Added 27 regression tests for prompt placeholder replacement
- Both `{{STUDENT_ANSWER}}` and `{{studentAnswer}}` now supported as aliases

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

**v2.0.1 Note:** See Section 46 for AI Feedback Panel State Machine showing how grading results are displayed to students with provider/model info.

---

## 3. GRID WARS — Territory Claim Flow (v2.0)

**v2.0 Note:** This flow now includes hierarchy checks. See sections 33-37 for:
- Section 33: Hierarchical Navigation State Machine
- Section 34: Develop Action State Machine
- Section 35: Drill Action State Machine
- Section 36: Address Resolution State Machine
- Section 37: Cell Click Router (v2.0)

```
                          ┌─────────────────────────────────────┐
                          │         PLAYER CLICKS CELL          │
                          │      (v2.0: click only, no avatar)  │
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

BEFORE v2.1.1 (BUG):
  - Normalized field ID was always 'answer'
  - Client expected actual field ID (e.g., 'slope', 'interpretation')
  - Field ID mismatch prevented _aiScore from being set
  - AI Feedback Panel never showed during initial grading

AFTER v2.1.1 (FIXED):
  - Server remaps 'answer' field to actual field ID from request
  - Uses scenario.fieldId (preferred) or first key from answers object
  - Panel now shows correctly for all cartridges
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

## 31. PROMPT TEMPLATE INTERPOLATION (v1.6.3)

```
buildCartridgePrompt(template, scenario, answers)
═══════════════════════════════════════════════════════════════════════════

INPUT:
├─ template: AI grading prompt from ai-grader-prompt.txt
├─ scenario: { topic, mode, studentAnswer, gradingPairs, r, slope, ... }
└─ answers: { fieldId: value, ... }

REPLACEMENT SEQUENCE (ordered priority):
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 1: Build problemContext from scenario                              │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ contextParts = []                                                        │
│ if (scenario.topic)      → push "Topic: {topic}"                        │
│ if (scenario.mode)       → push "Mode: {mode}"                          │
│ if (scenario.givenValues)→ push "Given values: {givenValues}"           │
│ if (scenario.r)          → push "r = {r}"                               │
│ if (scenario.slope)      → push "Slope = {slope}"                       │
│ if (scenario.intercept)  → push "Intercept = {intercept}"               │
│                                                                          │
│ Replace: {{problemContext}} → contextParts.join('\n')                   │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 2: Build studentResponse from all answers                          │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ studentResponse = Object.entries(answers)                               │
│   .map(([field, value]) => `${field}: ${value}`)                        │
│   .join('\n')                                                           │
│                                                                          │
│ Replace: {{studentResponse}} → formatted string                         │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 3: Replace expectedAnswer with gradingPairs                        │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ expectedAnswer = scenario.gradingPairs || 'See grading pairs in context'│
│                                                                          │
│ Replace: {{expectedAnswer}} → expectedAnswer                            │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 4: Handle STUDENT_ANSWER alias (v1.6.3 FIX)                        │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ IF scenario.studentAnswer exists:                                       │
│   Replace: {{STUDENT_ANSWER}} → String(scenario.studentAnswer)          │
│                                                                          │
│ CRITICAL: This fixes templates using SCREAMING_SNAKE_CASE               │
│ that weren't getting student answers replaced                            │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 5: Replace ALL scenario variables                                  │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ FOR EACH [key, value] IN scenario:                                      │
│   IF value !== undefined && value !== null:                             │
│     Replace: {{key}} → String(value)                                    │
│                                                                          │
│ Examples:                                                                │
│   {{topic}}        → "Experimental Design"                              │
│   {{studentAnswer}}→ "random assignment allows..."                      │
│   {{correctAnswer}}→ "Random assignment balances confounding"           │
│   {{keyIdeas}}     → "confounding, causation, random assignment"        │
│   {{r}}            → "0.85"                                             │
│   {{slope}}        → "2.3"                                              │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 6: Replace field-specific answer placeholders                      │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ FOR EACH [field, value] IN answers:                                     │
│   answerKey = `${field}Answer`                                          │
│   Replace: {{answerKey}} → String(value || '')                          │
│                                                                          │
│ Examples:                                                                │
│   answers = { term: "assignment", predicted: "45.2" }                   │
│   {{termAnswer}}      → "assignment"                                    │
│   {{predictedAnswer}} → "45.2"                                          │
│   {{residualAnswer}}  → "" (if not in answers)                          │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 7: Handle mode-based conditionals                                  │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ modeFlags = {                                                            │
│   calculateMode: scenario.mode === 'calculate',                         │
│   interpretMode: scenario.mode === 'interpret',                         │
│   analyzeMode:   scenario.mode === 'analyze'                            │
│ }                                                                        │
│                                                                          │
│ FOR EACH [flag, isActive]:                                              │
│   IF isActive:                                                           │
│     {{#if flag}}...content...{{/if}} → keep content                     │
│   ELSE:                                                                  │
│     {{#if flag}}...content...{{/if}} → remove entirely                  │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 8: Handle residual conditionals                                    │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ residualPositive = parseFloat(scenario.residual) > 0                    │
│                                                                          │
│ {{#if residualPositive}}A{{else}}B{{/if}}                               │
│   → IF positive: "A"                                                    │
│   → IF negative/zero: "B"                                               │
│                                                                          │
│ {{moreOrLess}} → "more" (if positive) or "less" (if negative)           │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 9: Final cleanup                                                   │
│ ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ Remove all unreplaced {{...}} placeholders                              │
│   prompt.replace(/\{\{[^}]+\}\}/g, '')                                  │
│                                                                          │
│ Trim whitespace                                                          │
│   prompt.trim()                                                          │
│                                                                          │
│ Return final interpolated prompt                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Placeholder Reference Table

| Placeholder | Source | Example Value |
|-------------|--------|---------------|
| `{{problemContext}}` | Built from scenario | "Topic: Sampling\nMode: identify" |
| `{{studentResponse}}` | Built from answers | "term: random\nmethod: stratified" |
| `{{expectedAnswer}}` | scenario.gradingPairs | "term: expected=assignment" |
| `{{STUDENT_ANSWER}}` | scenario.studentAnswer | "Random assignment allows..." |
| `{{studentAnswer}}` | scenario.studentAnswer | "Random assignment allows..." |
| `{{topic}}` | scenario.topic | "Experimental Design" |
| `{{problemText}}` | scenario.problemText | "Explain why random..." |
| `{{correctAnswer}}` | scenario.correctAnswer | "Random assignment balances..." |
| `{{keyIdeas}}` | scenario.keyIdeas | "confounding, causation" |
| `{{fieldIdAnswer}}` | answers[fieldId] | "assignment" |
| `{{moreOrLess}}` | Computed | "more" or "less" |
| `{{#if mode}}...{{/if}}` | Conditional | Content or empty |

### v1.6.3 Bug Fix Detail

```
BEFORE v1.6.3:
──────────────
Template: "Student Answer:\n{{STUDENT_ANSWER}}"
scenario.studentAnswer = "random assignment"

Result: "Student Answer:\n{{STUDENT_ANSWER}}"  ← NOT REPLACED!
        (AI responds: "student answer is missing")

AFTER v1.6.3:
─────────────
Added explicit handling for SCREAMING_SNAKE_CASE alias:

if (scenario.studentAnswer) {
  prompt = prompt.replace(/\{\{STUDENT_ANSWER\}\}/g, String(scenario.studentAnswer));
}

Result: "Student Answer:\nrandom assignment"   ← CORRECTLY REPLACED
```

---

## 32. SECTION INDEX

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
| 31 | Prompt Template Interpolation (v1.6.3) | {{placeholder}} replacement flow |
| 32 | Section Index | This index |
| 33 | Hierarchical Navigation (v2.0) | Parent/child navigation |
| 34 | Develop Action (v2.0) | Owner cell subdivision |
| 35 | Drill Action (v2.0) | Forced subdivision at saturation |
| 36 | Address Resolution (v2.0) | Chess notation parsing |
| 37 | Cell Click Router (v2.0) | Click → zoom vs claim |
| 38 | Presence Dots (v2.0) | Player location indicators |
| 39 | Leaderboard Hierarchy (v2.0) | Macro + subcell counts |
| 40 | Developed Cell Indicator (v2.0) | Visual mini-grid |
| 41 | WebSocket Messages (v2.0) | New broadcast events |
| 42 | API Endpoint Inventory (v2.0) | New endpoints |
| 43 | State Variable Inventory (v2.0) | New state vars |
| 44 | Complete v2.0 Flow Diagram | End-to-end hierarchy |
| 45 | v2.0 Verification Checklist | System health checks |
| 46 | AI Feedback Panel (v2.0.1) | Grading transparency UI |

---

## 33. HIERARCHICAL NAVIGATION STATE MACHINE (v2.0)

```
                        ┌─────────────────────────────────────────────────┐
                        │              NAVIGATION STATE                    │
                        │                                                  │
                        │  currentParent: string | null                    │
                        │  currentLevel: 0 | 1 | 2                         │
                        │  breadcrumb: string[]                            │
                        │  parentCell: object | null                       │
                        └─────────────────────────────────────────────────┘

                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │   ROOT VIEW     │    │   LEVEL 1 VIEW  │    │   LEVEL 2 VIEW  │
         │   (level 0)     │    │   (inside d5)   │    │ (inside d5.c3)  │
         │                 │    │                 │    │                 │
         │ currentParent:  │    │ currentParent:  │    │ currentParent:  │
         │   null          │    │   "d5"          │    │   "d5.c3"       │
         │ breadcrumb: []  │    │ breadcrumb:     │    │ breadcrumb:     │
         │                 │    │   ["d5"]        │    │   ["d5","c3"]   │
         └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
                  │                      │                      │
     ┌────────────┼────────────┐         │                      │
     │            │            │         │                      │
     ▼            ▼            ▼         ▼                      ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          ┌─────────┐
│ Click   │ │ Cannot  │ │ Can     │ │ Can     │          │ Cannot  │
│developed│ │zoom out │ │zoom out │ │zoom out │          │subdivide│
│→zoom in │ │(at root)│ │→ root   │ │→level 1 │          │(max lvl)│
└─────────┘ └─────────┘ └─────────┘ └─────────┘          └─────────┘

TRANSITIONS:
─────────────────────────────────────────────────────────────────────────────

zoomIn(address):
┌─────────────────────────────────────────────────────────────────────────┐
│  PRE: Cell at address exists AND is_developed = true                    │
│  PRE: getLevel(address) < maxSubdivisionLevel (2)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  1. currentParent = address                                             │
│  2. currentLevel = address.split('.').length                            │
│  3. breadcrumb = address.split('.')                                     │
│  4. fetchState() with ?parent=address                                   │
│  5. updateBreadcrumb()                                                  │
│  6. syncRendererState()                                                 │
└─────────────────────────────────────────────────────────────────────────┘

zoomOut():
┌─────────────────────────────────────────────────────────────────────────┐
│  PRE: currentLevel > 0                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  1. parts = currentParent.split('.')                                    │
│  2. parts.pop()                                                         │
│  3. currentParent = parts.length ? parts.join('.') : null               │
│  4. currentLevel = parts.length                                         │
│  5. breadcrumb = parts                                                  │
│  6. fetchState()                                                        │
└─────────────────────────────────────────────────────────────────────────┘

zoomTo(address):
┌─────────────────────────────────────────────────────────────────────────┐
│  Direct navigation to any level (from breadcrumb click)                 │
├─────────────────────────────────────────────────────────────────────────┤
│  if address === null or '':                                             │
│    currentParent = null, currentLevel = 0, breadcrumb = []              │
│  else:                                                                  │
│    currentParent = address                                              │
│    currentLevel = address.split('.').length                             │
│    breadcrumb = address.split('.')                                      │
│  fetchState()                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Breadcrumb Rendering State

```
BREADCRUMB STATE BASED ON currentLevel:
──────────────────────────────────────────────────────────────────────────

Level 0 (root):     [Hidden - no breadcrumb shown]

Level 1 (in d5):    ┌──────────────────────────────────────┐
                    │ 🗺️ MAP › D5                          │
                    │      ↑       ↑                       │
                    │   clickable  current (not clickable) │
                    └──────────────────────────────────────┘

Level 2 (in d5.c3): ┌──────────────────────────────────────┐
                    │ 🗺️ MAP › D5 › C3                     │
                    │      ↑      ↑     ↑                  │
                    │  clickable  |   current              │
                    │           clickable                  │
                    └──────────────────────────────────────┘
```

---

## 34. DEVELOP ACTION STATE MACHINE (v2.0)

```
                    ┌─────────────────────────────────────────┐
                    │        PLAYER CLICKS OWN CELL           │
                    │        (cell.owner === username)        │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │           CHECK DEVELOP ELIGIBILITY      │
                    │                                         │
                    │  • hierarchyEnabled === true?           │
                    │  • cell.is_developed === false?         │
                    │  • currentLevel < maxSubdivisionLevel?  │
                    │  • player.action_points >= 100?         │
                    └─────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
    ┌─────────────────┐                             ┌─────────────────┐
    │  CAN DEVELOP    │                             │ CANNOT DEVELOP  │
    │  Show button:   │                             │                 │
    │  🏗️ DEVELOP     │                             │ • Already done  │
    │  (100 pts)      │                             │ • At max level  │
    │                 │                             │ • Not enough pts│
    └────────┬────────┘                             └─────────────────┘
             │
             │ click
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    DEVELOP EXECUTION                             │
    │                                                                  │
    │  POST /api/grid-wars/develop                                     │
    │  { gameId, username, address }                                   │
    └─────────────────────────────────┬───────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
    ┌─────────────────┐                             ┌─────────────────┐
    │  SERVER SUCCESS │                             │  SERVER REJECT  │
    └────────┬────────┘                             │                 │
             │                                      │ • Not owner     │
             │                                      │ • Already dev'd │
             │                                      │ • Insuff. pts   │
             ▼                                      └─────────────────┘
    ┌─────────────────────────────────────────────────────────────────┐
    │                    SUBDIVISION CREATED                           │
    │                                                                  │
    │  1. Deduct 100 pts from player                                   │
    │  2. Mark cell is_developed = true                                │
    │  3. Create 64 subcells at (address.a1 through address.h8)        │
    │  4. Owner keeps center 4: d4, d5, e4, e5                         │
    │  5. Remaining 60 cells = neutral (owner: null)                   │
    │  6. Broadcast 'cell_developed' event                             │
    │  7. Update leaderboard                                           │
    └─────────────────────────────────────────────────────────────────┘

SUBCELL CREATION DETAILS:
──────────────────────────────────────────────────────────────────────────

Address: "d5" (level 0, coords 3,4)
New Level: 1

Created subcells (64 total):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│d5.a8│d5.b8│d5.c8│d5.d8│d5.e8│d5.f8│d5.g8│d5.h8│  y=7
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│d5.a7│d5.b7│d5.c7│d5.d7│d5.e7│d5.f7│d5.g7│d5.h7│  y=6
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│d5.a6│d5.b6│d5.c6│d5.d6│d5.e6│d5.f6│d5.g6│d5.h6│  y=5
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│d5.a5│d5.b5│d5.c5│d5.d5│d5.e5│d5.f5│d5.g5│d5.h5│  y=4  ← d5, e5 OWNER
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│d5.a4│d5.b4│d5.c4│d5.d4│d5.e4│d5.f4│d5.g4│d5.h4│  y=3  ← d4, e4 OWNER
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│d5.a3│d5.b3│d5.c3│d5.d3│d5.e3│d5.f3│d5.g3│d5.h3│  y=2
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│d5.a2│d5.b2│d5.c2│d5.d2│d5.e2│d5.f2│d5.g2│d5.h2│  y=1
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│d5.a1│d5.b1│d5.c1│d5.d1│d5.e1│d5.f1│d5.g1│d5.h1│  y=0
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  x=0   x=1   x=2   x=3   x=4   x=5   x=6   x=7

Owner retains: d5.d4, d5.d5, d5.e4, d5.e5 (center 4)
Neutral: remaining 60 cells
```

---

## 35. DRILL ACTION STATE MACHINE (v2.0)

```
                    ┌─────────────────────────────────────────┐
                    │       PLAYER CLICKS ENEMY CELL          │
                    │       (cell.owner !== username)         │
                    │       (cell.owner !== null)             │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │            CHECK DRILL ELIGIBILITY       │
                    │                                         │
                    │  • hierarchyEnabled === true?           │
                    │  • cell.is_developed === false?         │
                    │  • currentLevel < maxSubdivisionLevel?  │
                    │  • mapFillPercent >= 85%?  ← CRITICAL   │
                    │  • player.action_points >= 75?          │
                    └─────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
    ┌─────────────────┐                             ┌─────────────────┐
    │   CAN DRILL     │                             │  CANNOT DRILL   │
    │   Show button:  │                             │                 │
    │   ⛏️ DRILL IN   │                             │ • Map < 85%     │
    │   (75 pts)      │                             │ • Already dev'd │
    │                 │                             │ • Not enough pts│
    │                 │                             │ • Own cell      │
    └────────┬────────┘                             └─────────────────┘
             │
             │ click
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      DRILL EXECUTION                             │
    │                                                                  │
    │  POST /api/grid-wars/drill                                       │
    │  { gameId, username, targetAddress }                             │
    └─────────────────────────────────┬───────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
    ┌─────────────────┐                             ┌─────────────────┐
    │  SERVER SUCCESS │                             │  SERVER REJECT  │
    └────────┬────────┘                             │                 │
             │                                      │ • Map not 85%   │
             │                                      │ • Target neutral│
             │                                      │ • Own cell      │
             ▼                                      └─────────────────┘
    ┌─────────────────────────────────────────────────────────────────┐
    │                  FORCED SUBDIVISION CREATED                      │
    │                                                                  │
    │  1. Deduct 75 pts from attacker                                  │
    │  2. Mark cell is_developed = true                                │
    │  3. Create 64 subcells                                           │
    │  4. Original owner keeps center 4: d4, d5, e4, e5                │
    │  5. ATTACKER gets corner: a1                                     │
    │  6. Remaining 59 cells = neutral                                 │
    │  7. Broadcast 'cell_drilled' event                               │
    │  8. Update leaderboard                                           │
    └─────────────────────────────────────────────────────────────────┘

DRILL RESULT VISUALIZATION:
──────────────────────────────────────────────────────────────────────────

Before: Cell "d5" owned by DEFENDER
After drill by ATTACKER:

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  y=7
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  y=6
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  y=5
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ·  │  ·  │  ·  │ DEF │ DEF │  ·  │  ·  │  ·  │  y=4  ← Defender keeps
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ·  │  ·  │  ·  │ DEF │ DEF │  ·  │  ·  │  ·  │  y=3  ← center 4
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  y=2
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  y=1
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ ATK │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  ·  │  y=0  ← Attacker corner
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  x=0   x=1   x=2   x=3   x=4   x=5   x=6   x=7

ATK = Attacker (1 cell: a1)
DEF = Defender (4 cells: d4, d5, e4, e5)
 ·  = Neutral (59 cells)

SATURATION GATE:
──────────────────────────────────────────────────────────────────────────
Drilling requires 85% map fill (55 of 64 cells claimed at level 0).
This prevents early-game abuse and creates late-game dynamics.

Check: COUNT(*) WHERE owner IS NOT NULL AND cell_level = 0 >= 55
```

---

## 36. ADDRESS RESOLUTION STATE MACHINE (v2.0)

```
ADDRESS FORMAT:
──────────────────────────────────────────────────────────────────────────

Level 0: "a1" through "h8"     (64 cells, root map)
Level 1: "d5.a1" through "d5.h8"   (64 cells inside d5)
Level 2: "d5.c3.a1" through "d5.c3.h8" (64 cells inside d5.c3)

General: {parent}.{col}{row} where col='a'-'h', row='1'-'8'

COORDINATE CONVERSION:
──────────────────────────────────────────────────────────────────────────

                    ┌────────────────────────────────────────┐
                    │          ADDRESS STRING                │
                    │          e.g., "d5.c3.a1"              │
                    └─────────────────┬──────────────────────┘
                                      │
                                      ▼
                    ┌────────────────────────────────────────┐
                    │         SPLIT BY '.'                   │
                    │      ["d5", "c3", "a1"]                │
                    └─────────────────┬──────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          ┌─────────────────┐               ┌─────────────────┐
          │   getLevel()    │               │ addressToCoords │
          │   parts.length-1│               │ Extract LEAF    │
          │   = 2           │               │ "a1" → {x:0,y:0}│
          └─────────────────┘               └─────────────────┘

coordsToAddress(x, y):
┌───────────────────────────────────────────────────────────────────────┐
│  col = String.fromCharCode(97 + x)   // 0→'a', 7→'h'                  │
│  row = y + 1                          // 0→'1', 7→'8'                 │
│  return col + row                     // e.g., "d5"                   │
└───────────────────────────────────────────────────────────────────────┘

addressToCoords(address):
┌───────────────────────────────────────────────────────────────────────┐
│  parts = address.split('.')                                           │
│  leaf = parts[parts.length - 1]      // Last segment                  │
│  x = leaf.charCodeAt(0) - 97         // 'a'→0, 'h'→7                  │
│  y = parseInt(leaf[1]) - 1           // '1'→0, '8'→7                  │
│  return { x, y }                                                      │
└───────────────────────────────────────────────────────────────────────┘

buildAddress(parentAddress, x, y):
┌───────────────────────────────────────────────────────────────────────┐
│  local = coordsToAddress(x, y)                                        │
│  return parentAddress ? parentAddress + '.' + local : local           │
└───────────────────────────────────────────────────────────────────────┘

getParentAddress(address):
┌───────────────────────────────────────────────────────────────────────┐
│  parts = address.split('.')                                           │
│  if (parts.length <= 1) return null                                   │
│  return parts.slice(0, -1).join('.')                                  │
└───────────────────────────────────────────────────────────────────────┘

getLevel(address):
┌───────────────────────────────────────────────────────────────────────┐
│  if (!address) return 0                                               │
│  return address.split('.').length - 1                                 │
└───────────────────────────────────────────────────────────────────────┘

getBreadcrumb(address):
┌───────────────────────────────────────────────────────────────────────┐
│  if (!address) return []                                              │
│  return address.split('.')                                            │
└───────────────────────────────────────────────────────────────────────┘

CENTER CELLS (for owner retention):
──────────────────────────────────────────────────────────────────────────

CENTER_CELLS = ['d4', 'd5', 'e4', 'e5']

Coordinates:
  d4 → (3, 3)
  d5 → (3, 4)
  e4 → (4, 3)
  e5 → (4, 4)

These form the center 2×2 square of any 8×8 grid.

DRILL_CELL = 'a1' → (0, 0)   // Corner for attacker
```

---

## 37. CELL CLICK ROUTER STATE MACHINE (v2.0)

```
                    ┌─────────────────────────────────────────┐
                    │          PLAYER CLICKS CELL             │
                    │          at coordinates (x, y)          │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │         GET CELL DATA                   │
                    │   cell = territories.get(x + ',' + y)   │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │      IS CELL DEVELOPED?                 │
                    │      cell?.is_developed === true        │
                    └─────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │ YES                                           │ NO
              ▼                                               ▼
    ┌─────────────────┐                             ┌─────────────────┐
    │   ZOOM IN       │                             │  CHECK OWNER    │
    │                 │                             │                 │
    │ state.zoomIn(   │                             │ cell.owner ===  │
    │   cell.address  │                             │   username?     │
    │ )               │                             │                 │
    │                 │                             └────────┬────────┘
    │ updateBreadcrumb│                                      │
    │ syncRenderer    │              ┌───────────────────────┴───────────────────────┐
    │ updateStatus    │              │                       │                       │
    └─────────────────┘              ▼                       ▼                       ▼
                           ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                           │   OWN CELL      │     │   ENEMY CELL    │     │  NEUTRAL CELL   │
                           │                 │     │                 │     │                 │
                           │ Show status:    │     │ Update actions: │     │ Proceed to      │
                           │ "Your territory │     │ • Show takeover │     │ claim flow      │
                           │  — DEVELOP to   │     │   button        │     │ (Section 3)     │
                           │  subdivide"     │     │ • Maybe show    │     │                 │
                           │                 │     │   DRILL button  │     │                 │
                           │ Show DEVELOP    │     │   if 85%+ fill  │     │                 │
                           │ button if:      │     │                 │     │                 │
                           │ • Not developed │     │                 │     │                 │
                           │ • Level < max   │     │                 │     │                 │
                           │ • Has 100 pts   │     │                 │     │                 │
                           └─────────────────┘     └─────────────────┘     └─────────────────┘

KEYBOARD SHORTCUTS:
──────────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────────────┐
│                      KEYBOARD INPUT                                     │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ Escape OR       │             │ Arrow Keys      │
    │ Backspace       │             │ (WASD)          │
    └────────┬────────┘             └────────┬────────┘
             │                               │
             ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ currentLevel>0? │             │ hierarchyEnabled│
    │                 │             │    === true?    │
    └────────┬────────┘             └────────┬────────┘
             │                               │
      ┌──────┴──────┐                 ┌──────┴──────┐
      │YES          │NO               │YES          │NO
      ▼             ▼                 ▼             ▼
┌───────────┐ ┌───────────┐   ┌───────────┐ ┌───────────┐
│ zoomOut() │ │ collapse  │   │ DISABLED  │ │ Legacy    │
│           │ │ panel     │   │ (no avatar│ │ avatar    │
│           │ │ (Esc only)│   │  movement)│ │ movement  │
└───────────┘ └───────────┘   └───────────┘ └───────────┘
```

---

## 38. PRESENCE DOTS STATE MACHINE (v2.0)

```
v2.0 CHANGE: Moveable avatars replaced with presence dots on owned cells.

RENDERER STATE:
──────────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────────────┐
│  _usePresenceDots: boolean                                              │
│  _onlinePlayers: Set<string>                                            │
└─────────────────────────────────────────────────────────────────────────┘

MODE SELECTION:
──────────────────────────────────────────────────────────────────────────

                    ┌─────────────────────────────────────────┐
                    │        RENDER LOOP (every frame)        │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │      _usePresenceDots === true?         │
                    └─────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │ YES (v2.0)                                    │ NO (legacy)
              ▼                                               ▼
    ┌─────────────────┐                             ┌─────────────────┐
    │ drawOwnerPresence│                            │ drawAvatarWakes │
    │                 │                             │ drawAvatars     │
    └─────────────────┘                             └─────────────────┘

PRESENCE DOT RENDERING:
──────────────────────────────────────────────────────────────────────────

for each cell in territories:
┌─────────────────────────────────────────────────────────────────────────┐
│  if cell.owner === null: skip                                           │
│  if !_onlinePlayers.has(cell.owner): skip                               │
│                                                                         │
│  Draw presence dot at bottom-right corner of cell:                      │
│  ┌──────────────────────────────────────┐                               │
│  │                                      │                               │
│  │                                      │                               │
│  │                                      │                               │
│  │                                 ●    │  ← Green dot (radius ~3px)    │
│  └──────────────────────────────────────┘                               │
│                                                                         │
│  Dot composition:                                                       │
│  1. Outer glow (player color, alpha 0.3)                                │
│  2. Inner circle (green #00ff41)                                        │
│  3. White center (highlight)                                            │
│  4. Pulsing animation (0.7-1.0 alpha, 600ms cycle)                      │
└─────────────────────────────────────────────────────────────────────────┘

ONLINE PLAYERS UPDATE FLOW:
──────────────────────────────────────────────────────────────────────────

                    ┌─────────────────────────────────────────┐
                    │       syncRendererState()               │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │  Extract online players from render     │
                    │  state.players                          │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │  renderer.setOnlinePlayers(             │
                    │    players.map(p => p.username)         │
                    │  )                                      │
                    └─────────────────────────────────────────┘
```

---

## 39. LEADERBOARD HIERARCHY STATE MACHINE (v2.0)

```
v2.0 CHANGE: Leaderboard now shows macro cells + subcells separately.

DISPLAY FORMAT:
──────────────────────────────────────────────────────────────────────────

Player with 3 macro cells and 12 subcells:
┌────────────────────────────────────────┐
│ 1. Alice            3 + 12 📦          │
│    ↑                 ↑    ↑            │
│    name         macro  subcells        │
└────────────────────────────────────────┘

Player with only macro cells:
┌────────────────────────────────────────┐
│ 2. Bob                    5 🏰          │
│                           ↑            │
│                      macro only        │
└────────────────────────────────────────┘

RANKING ALGORITHM:
──────────────────────────────────────────────────────────────────────────

Score = (macro_cells × 64) + sub_cells

Rationale: One macro cell is "worth" up to 64 subcells.
           This ensures macro ownership ranks higher.

Example:
  Alice: 3 macro + 12 sub = (3×64) + 12 = 204
  Bob:   5 macro + 0 sub  = (5×64) + 0  = 320
  Carol: 0 macro + 100 sub = (0×64) + 100 = 100

  Ranking: Bob > Alice > Carol

SERVER QUERY FLOW:
──────────────────────────────────────────────────────────────────────────

                    ┌─────────────────────────────────────────┐
                    │   GET /api/grid-wars/leaderboard        │
                    │   ?gameId=123                           │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │   Query grid_wars_players               │
                    │   (username, action_points,             │
                    │    territories_count, lifetime_earned)  │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │   Query grid_wars_territories           │
                    │   GROUP BY owner, cell_level            │
                    │   COUNT cells per level                 │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │   Merge counts:                         │
                    │   cellCounts[owner] = {                 │
                    │     macro: count where level=0,         │
                    │     sub: count where level>0            │
                    │   }                                     │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │   Return leaderboard with:              │
                    │   { username, macro_cells, sub_cells,   │
                    │     territories_count, lifetime_earned, │
                    │     real_name }                         │
                    └─────────────────────────────────────────┘

WEBSOCKET BROADCAST:
──────────────────────────────────────────────────────────────────────────

Triggered by:
• territory_claimed
• cell_developed
• cell_drilled
• points_earned

Message format:
{
  type: 'leaderboard_update',
  gameId: 'xxx',
  leaderboard: [
    { username, macro_cells, sub_cells, territories_count, real_name },
    ...
  ]
}
```

---

## 40. DEVELOPED CELL INDICATOR STATE MACHINE (v2.0)

```
VISUAL INDICATOR FOR DEVELOPED CELLS:
──────────────────────────────────────────────────────────────────────────

                    ┌─────────────────────────────────────────┐
                    │      drawDevelopedIndicator()           │
                    │      Called for each cell where         │
                    │      is_developed === true              │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │   Draw mini 3×3 grid inside cell        │
                    │   (suggests subdivision)                │
                    │                                         │
                    │   ┌───┬───┬───┐                         │
                    │   │   │   │   │                         │
                    │   ├───┼───┼───┤                         │
                    │   │   │ ⊕ │   │  ← Pulsing symbol       │
                    │   ├───┼───┼───┤                         │
                    │   │   │   │   │                         │
                    │   └───┴───┴───┘                         │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │   Pulsing animation:                    │
                    │   alpha = 0.5 + 0.3 × sin(now/500)      │
                    │   Symbol: '+' centered                  │
                    │   Color: cyan (#0ff)                    │
                    └─────────────────────────────────────────┘

CLICK BEHAVIOR:
──────────────────────────────────────────────────────────────────────────

Normal cell click:     → Attempt claim/takeover
Developed cell click:  → Zoom into subcell view (no claim attempt)
```

---

## 41. WEBSOCKET MESSAGES (v2.0 Additions)

```
NEW MESSAGE TYPES:
──────────────────────────────────────────────────────────────────────────

cell_developed (server → client):
┌─────────────────────────────────────────────────────────────────────────┐
│ {                                                                       │
│   type: 'cell_developed',                                               │
│   address: 'd5',              // Cell that was developed                │
│   developer: 'alice',         // Who developed it                       │
│   newCells: 64,               // Subcells created                       │
│   ownerRetained: 4,           // Center cells kept                      │
│   newLevel: 1                 // Level of new subcells                  │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

cell_drilled (server → client):
┌─────────────────────────────────────────────────────────────────────────┐
│ {                                                                       │
│   type: 'cell_drilled',                                                 │
│   address: 'd5',              // Cell that was drilled                  │
│   attacker: 'bob',            // Who drilled                            │
│   defender: 'alice',          // Original owner                         │
│   attackerGained: 'd5.a1',    // Corner cell for attacker               │
│   defenderRetained: ['d5.d4', 'd5.d5', 'd5.e4', 'd5.e5'],               │
│   newLevel: 1                                                           │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

CLIENT HANDLERS:
──────────────────────────────────────────────────────────────────────────

case 'cell_developed':
  1. Show toast: "🏗️ {developer} developed {address}!"
  2. If viewing affected area → refresh state
  3. Mark static layer dirty for re-render

case 'cell_drilled':
  1. Show toast: "⛏️ {attacker} drilled into {defender}'s {address}!"
  2. If viewing affected area → refresh state
  3. Mark static layer dirty for re-render
```

---

## 42. API ENDPOINT INVENTORY (v2.0 Additions)

```
NEW ENDPOINTS:
──────────────────────────────────────────────────────────────────────────

POST /api/grid-wars/develop
┌─────────────────────────────────────────────────────────────────────────┐
│ Request:                                                                │
│   { gameId: string, username: string, address: string }                 │
│                                                                         │
│ Validation:                                                             │
│   • User owns the cell                                                  │
│   • Cell is not already developed                                       │
│   • Current level < maxSubdivisionLevel (2)                             │
│   • User has >= 100 action_points                                       │
│                                                                         │
│ Success Response:                                                       │
│   { success: true, address, subcellsCreated: 64,                        │
│     ownerRetained: 4, cost: 100 }                                       │
│                                                                         │
│ Error Responses:                                                        │
│   403: "You do not own this cell"                                       │
│   400: "Cell already developed"                                         │
│   400: "Maximum subdivision level reached"                              │
│   400: "Insufficient points" (with required, available)                 │
└─────────────────────────────────────────────────────────────────────────┘

POST /api/grid-wars/drill
┌─────────────────────────────────────────────────────────────────────────┐
│ Request:                                                                │
│   { gameId: string, username: string, targetAddress: string }          │
│                                                                         │
│ Validation:                                                             │
│   • Map fill >= 85% (at level 0)                                        │
│   • Target cell exists and is owned by someone else                     │
│   • Target is not already developed                                     │
│   • Current level < maxSubdivisionLevel (2)                             │
│   • User has >= 75 action_points                                        │
│                                                                         │
│ Success Response:                                                       │
│   { success: true, address: targetAddress,                              │
│     attackerCell: "d5.a1",                                              │
│     defenderCells: ["d5.d4", "d5.d5", "d5.e4", "d5.e5"],                │
│     cost: 75 }                                                          │
│                                                                         │
│ Error Responses:                                                        │
│   400: "Drilling only available at saturation (85%+ map fill)"          │
│   404: "Cell not found"                                                 │
│   400: "Cannot drill neutral cell — just claim it"                      │
│   400: "Cannot drill your own cell — use develop instead"               │
│   400: "Cell already developed — zoom in and claim subcells"            │
│   400: "Insufficient points"                                            │
└─────────────────────────────────────────────────────────────────────────┘

UPDATED ENDPOINTS:
──────────────────────────────────────────────────────────────────────────

GET /api/grid-wars/games/:id/state
┌─────────────────────────────────────────────────────────────────────────┐
│ New query parameter: ?parent=d5                                         │
│                                                                         │
│ Behavior:                                                               │
│   • If parent omitted: Return level 0 cells (root map)                  │
│   • If parent="d5": Return level 1 cells where parent_address="d5"      │
│   • If parent="d5.c3": Return level 2 cells                             │
│                                                                         │
│ Response additions:                                                     │
│   { territories: [...],                                                 │
│     currentLevel: 0|1|2,                                                │
│     parentAddress: null|"d5"|"d5.c3",                                   │
│     parentCell: {...} | null,                                           │
│     breadcrumb: [] | ["d5"] | ["d5", "c3"]                              │
│   }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘

GET /api/grid-wars/leaderboard
┌─────────────────────────────────────────────────────────────────────────┐
│ Response additions:                                                     │
│   Each entry now includes:                                              │
│   { username, territories_count, lifetime_earned,                       │
│     macro_cells: number,    // NEW: cells at level 0                    │
│     sub_cells: number,      // NEW: cells at level > 0                  │
│     real_name }                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 43. STATE VARIABLE INVENTORY (v2.0 Additions)

```
FRONTEND (grid-state.js):
──────────────────────────────────────────────────────────────────────────

currentParent: string | null
  • null = viewing root map
  • "d5" = viewing inside d5
  • "d5.c3" = viewing inside d5.c3

currentLevel: number (0, 1, or 2)
  • Derived from currentParent.split('.').length

breadcrumb: string[]
  • [] = at root
  • ["d5"] = inside d5
  • ["d5", "c3"] = inside d5.c3

parentCell: object | null
  • Cell data for the parent we're viewing inside
  • null when at root level

FRONTEND (grid-renderer.js):
──────────────────────────────────────────────────────────────────────────

_usePresenceDots: boolean
  • true = render presence dots (v2.0 mode)
  • false = render moveable avatars (legacy)

_onlinePlayers: Set<string>
  • Set of usernames currently online
  • Used for presence dot rendering

FRONTEND (grid-panel.js):
──────────────────────────────────────────────────────────────────────────

_selectedForAction: { x, y, address, owner } | null
  • Currently selected cell for develop/drill action
  • Cleared after action completes

DATABASE (grid_wars_territories):
──────────────────────────────────────────────────────────────────────────

address: VARCHAR(32)
  • Chess-notation address: "d5", "d5.c3", "d5.c3.a1"
  • Unique per game_id

parent_address: VARCHAR(32) | NULL
  • NULL for level 0 cells
  • Parent's address for subcells

cell_level: INTEGER (0, 1, 2)
  • 0 = macro cell
  • 1 = first subdivision
  • 2 = second subdivision (max)

is_developed: BOOLEAN
  • false = normal cell
  • true = cell has been subdivided (64 subcells exist)

CONFIG (gridwars.config.js):
──────────────────────────────────────────────────────────────────────────

hierarchyEnabled: true
  • Master toggle for v2.0 features

maxSubdivisionLevel: 2
  • Maximum depth: d5.c3.a1 = 3 levels total

developmentCost: 100
  • Points to voluntarily subdivide

drillCost: 75
  • Points to force-subdivide enemy cell

drillSaturationThreshold: 85
  • Map fill % required for drilling

ownerRetentionCells: ['d4', 'd5', 'e4', 'e5']
  • Center 4 cells owner keeps on subdivision

attackerDrillCell: 'a1'
  • Corner cell attacker gets on drill

subcellClaimCost: 10
  • Base cost for claiming subcells (1/4 of macro)
```

---

## 44. COMPLETE v2.0 FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            GRID WARS v2.0 COMPLETE FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

STUDENT ANSWERS DRILL
         │
         ▼
    ┌─────────────────┐
    │ Earn points     │
    │ (weighted by    │
    │  level + cluster│
    │  + diminishing) │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Points added to │
    │ action_points   │
    └────────┬────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              GRID WARS ACTIONS                                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   CLAIM     │    │  TAKEOVER   │    │   DEVELOP   │    │    DRILL    │              │
│  │   NEUTRAL   │    │   ENEMY     │    │   (v2.0)    │    │   (v2.0)    │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                  │                  │                  │                      │
│         ▼                  ▼                  ▼                  ▼                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ 40 pts base │    │ 60-100 pts  │    │  100 pts    │    │   75 pts    │              │
│  │ × scarcity  │    │ × modifiers │    │             │    │ requires    │              │
│  │ × velocity  │    │             │    │ own cell    │    │ 85%+ fill   │              │
│  │ × guerrilla │    │             │    │ not dev'd   │    │ enemy cell  │              │
│  │ × overext   │    │             │    │ level < 2   │    │ not dev'd   │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                  │                  │                  │                      │
│         ▼                  ▼                  ▼                  ▼                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ Gain 1 cell │    │ Flip owner  │    │ Create 64   │    │ Create 64   │              │
│  │             │    │             │    │ subcells    │    │ subcells    │              │
│  │             │    │             │    │ Keep 4      │    │ Owner: 4    │              │
│  │             │    │             │    │             │    │ Attacker: 1 │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                  │                  │                  │                      │
│         └──────────────────┴──────────────────┴──────────────────┘                      │
│                                    │                                                    │
│                                    ▼                                                    │
│                          ┌─────────────────┐                                            │
│                          │   WebSocket     │                                            │
│                          │   Broadcasts    │                                            │
│                          │                 │                                            │
│                          │ • territory_    │                                            │
│                          │   claimed       │                                            │
│                          │ • cell_developed│                                            │
│                          │ • cell_drilled  │                                            │
│                          │ • leaderboard_  │                                            │
│                          │   update        │                                            │
│                          └────────┬────────┘                                            │
│                                   │                                                     │
└───────────────────────────────────┼─────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  All clients    │
                          │  update UI      │
                          │  in real-time   │
                          └─────────────────┘

NAVIGATION FLOW:
──────────────────────────────────────────────────────────────────────────

    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │   ROOT MAP (level 0)                                                │
    │   ┌───┬───┬───┬───┬───┬───┬───┬───┐                                │
    │   │   │   │   │   │   │   │   │   │                                │
    │   ├───┼───┼───┼───┼───┼───┼───┼───┤                                │
    │   │   │   │   │ ⊕ │   │   │   │   │  ⊕ = developed cell (d5)      │
    │   ├───┼───┼───┼───┼───┼───┼───┼───┤                                │
    │   │   │   │   │   │   │   │   │   │                                │
    │   └───┴───┴───┴───┴───┴───┴───┴───┘                                │
    │                 │                                                   │
    │                 │ CLICK d5                                          │
    │                 ▼                                                   │
    │   INSIDE d5 (level 1)        Breadcrumb: [MAP] › D5                │
    │   ┌───┬───┬───┬───┬───┬───┬───┬───┐                                │
    │   │   │   │   │   │   │   │   │   │                                │
    │   ├───┼───┼───┼───┼───┼───┼───┼───┤                                │
    │   │   │   │   │ ● │ ● │   │   │   │  ● = owner's center cells      │
    │   ├───┼───┼───┼───┼───┼───┼───┼───┤                                │
    │   │   │   │ ⊕ │ ● │ ● │   │   │   │  ⊕ = another developed cell   │
    │   └───┴───┴───┴───┴───┴───┴───┴───┘                                │
    │                 │                                                   │
    │                 │ CLICK c3 OR ESC                                   │
    │                 ▼                                                   │
    │   ┌─────────────────────────────────────────────────────────────┐  │
    │   │  CLICK c3  │              │  ESC / BACKSPACE                │  │
    │   │     ↓      │              │        ↓                        │  │
    │   │  Zoom into │              │  Zoom out to                    │  │
    │   │  d5.c3     │              │  parent level                   │  │
    │   └─────────────────────────────────────────────────────────────┘  │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘
```

---

## 45. v2.0 VERIFICATION CHECKLIST

```
DATABASE:
□ address column exists on grid_wars_territories
□ parent_address column exists
□ cell_level column exists (defaults to 0)
□ is_developed column exists (defaults to false)
□ Indexes on (game_id, address) and (game_id, parent_address)
□ Existing cells have address populated (e.g., "d5" format)

SERVER ENDPOINTS:
□ POST /api/grid-wars/develop returns correct subcells
□ POST /api/grid-wars/drill enforces 85% saturation gate
□ GET /api/grid-wars/state accepts ?parent= param
□ GET /api/grid-wars/leaderboard includes macro_cells, sub_cells
□ WebSocket broadcasts cell_developed, cell_drilled events

FRONTEND NAVIGATION:
□ Clicking developed cell zooms in (not claims)
□ Breadcrumb shows correct hierarchy path
□ Breadcrumb parts are clickable (except current)
□ ESC/Backspace zooms out when level > 0
□ ESC collapses panel when at level 0

FRONTEND ACTIONS:
□ DEVELOP button shows for own undeveloped cells
□ DEVELOP button disabled when < 100 pts or at max level
□ DRILL button shows for enemy cells at 85%+ fill
□ DRILL button disabled when < 75 pts
□ Both buttons hidden for developed cells

RENDERING:
□ Developed cells show mini-grid + ⊕ indicator
□ Presence dots appear on owned cells (not avatars)
□ Presence dots only for online players
□ Arrow keys disabled when hierarchyEnabled

LEADERBOARD:
□ Shows "3 + 12 📦" format when subcells exist
□ Shows "5 🏰" format when only macro cells
□ Sorted by (macro × 64 + sub) descending
□ Updates in real-time via WebSocket

CONFIG SYNC:
□ shared/gridwars.config.js has v2.0 constants
□ railway-server/gridwars.config.js matches shared/
□ hierarchyEnabled = true
□ maxSubdivisionLevel = 2
□ developmentCost = 100
□ drillCost = 75
□ drillSaturationThreshold = 85
```

---

## 46. AI FEEDBACK PANEL STATE MACHINE (v2.0.1)

Shows AI grading results to students with full transparency about which model was used and how it scored.

### Panel Lifecycle

```
                           ┌─────────────────────────────────────────────┐
                           │           AI FEEDBACK PANEL STATE           │
                           │                                             │
                           │  state: 'hidden' | 'visible' | 'error'     │
                           │  provider: 'groq' | 'gemini' | null        │
                           │  model: string | null                       │
                           │  aiScore: 'E' | 'P' | 'I' | null           │
                           │  aiFeedback: string | null                  │
                           │  keywordScore: 'E' | 'P' | 'I' | null      │
                           │  isAppeal: boolean                          │
                           └─────────────────────────────────────────────┘

                                              │
           ┌──────────────────────────────────┼──────────────────────────────────┐
           │                                  │                                  │
           ▼                                  ▼                                  ▼
┌─────────────────────┐           ┌─────────────────────┐           ┌─────────────────────┐
│      HIDDEN         │           │      VISIBLE        │           │       ERROR         │
│                     │           │                     │           │                     │
│ display: none       │           │ display: block      │           │ display: block      │
│ On: page load,      │           │ Shows:              │           │ Shows:              │
│     new problem,    │           │ - Provider icon     │           │ - "❌ AI Unavailable"|
│     Try Again,      │           │ - Model name        │           │ - Error message     │
│     Next, Skip      │           │ - AI Score (color)  │           │ - "Using keywords"  │
└──────────┬──────────┘           │ - Agreement status  │           └──────────┬──────────┘
           │                      │ - AI feedback text  │                      │
           │                      └──────────┬──────────┘                      │
           │                                 │                                 │
           │    AI grading succeeds          │     AI grading fails            │
           └────────────────────────────────▶│◀────────────────────────────────┘
                                             │
                                             │  Problem changes
                                             │  (Skip/Next/Try Again)
                                             ▼
                                   ┌─────────────────────┐
                                   │   → HIDDEN          │
                                   │   hideAIFeedbackPanel()
                                   └─────────────────────┘
```

### Integration with Grading Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GRADING COMPLETE EVENT                                 │
│                    (onGradingComplete callback in app.html)                     │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │    results._gradingMethod ==       │
                    │         'keywords+ai'?             │
                    └──────────────┬─────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │ YES                │ NO                 │
              ▼                    │                    ▼
┌──────────────────────┐           │      ┌──────────────────────┐
│ Check results._aiFailed          │      │   hideAIFeedbackPanel│
└──────────┬───────────┘           │      │   (keywords only)    │
           │                       │      └──────────────────────┘
     ┌─────┴─────┐                 │
     │ aiFailed? │                 │
     └─────┬─────┘                 │
           │                       │
    ┌──────┴──────┐                │
    │ YES         │ NO             │
    ▼             ▼                │
┌─────────┐  ┌─────────────────────┐
│ showAI  │  │ Extract from results│
│ Feedback│  │ - result._aiScore   │
│ Error() │  │ - result._aiFeedback│
└─────────┘  │ - result._provider  │
             │ - result._model     │
             │ - result._keywordScore
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ updateAIFeedbackPanel│
             │ (panel, aiResponse,  │
             │  keywordScore)       │
             └─────────────────────┘
```

### Appeal Flow Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPEAL SUBMITTED                                       │
│                    (btn-submit-appeal click handler)                            │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │   platform.submitAppeal()          │
                    │   (sends appealText + previous     │
                    │    results to server)              │
                    └──────────────┬─────────────────────┘
                                   │
                                   ▼
                    ┌────────────────────────────────────┐
                    │      Appeal Result Received        │
                    └──────────────┬─────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │ result.success     │ result.error       │
              │ == true            │                    │
              ▼                    ▼                    │
┌──────────────────────┐  ┌──────────────────────┐     │
│ Extract field results│  │ Show escalation to   │     │
│ from result.fields   │  │ teacher review       │     │
└──────────┬───────────┘  └──────────────────────┘     │
           │                                           │
           ▼                                           │
┌──────────────────────────────────────────────────────┐
│ updateAIFeedbackPanel(panel, aiResponse, null,       │
│                       { isAppeal: true })            │
│                                                      │
│ Panel shows:                                         │
│ - Title: "🤖 AI APPEAL REVIEW" (magenta)            │
│ - Provider/model info                               │
│ - New score after appeal                            │
│ - New feedback text                                 │
└──────────────────────────────────────────────────────┘
```

### Server Response Flow (AI Grading)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SERVER: /api/ai/grade ENDPOINT                              │
│                          (railway-server/server.js)                             │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │     gradeWithAI(prompt, provider)  │
                    │     Try providers with key rotation│
                    └──────────────┬─────────────────────┘
                                   │
                    ┌──────────────┼──────────────────────┐
                    │              │                      │
                    ▼              ▼                      ▼
          ┌─────────────┐  ┌─────────────┐    ┌─────────────────┐
          │ Try Groq    │  │ Try Gemini  │    │ All Failed      │
          │ Llama-3.3   │  │ 2.0 Flash   │    │ → throw error   │
          └──────┬──────┘  └──────┬──────┘    └─────────────────┘
                 │                │
                 │ success        │ success
                 ▼                ▼
       ┌──────────────────────────────────────┐
       │        Add metadata to result        │
       │                                      │
       │  result._provider = 'groq'|'gemini'  │
       │  result._model = model_name          │ ◀── v2.0.1 addition
       │  result._keyId = keyObj.id           │
       └──────────────────┬───────────────────┘
                          │
                          ▼
       ┌──────────────────────────────────────┐
       │     Remap field ID (v2.1.1 FIX)      │
       │                                      │
       │  actualFieldId = scenario.fieldId    │
       │                || Object.keys(ans)[0]│
       │                                      │
       │  if (result.answer && actualFieldId  │
       │      && actualFieldId !== 'answer'): │
       │    result[actualFieldId] = result.answer
       │    delete result.answer              │
       └──────────────────┬───────────────────┘
                          │
                          ▼
       ┌──────────────────────────────────────┐
       │        Return to client              │
       │                                      │
       │  {                                   │
       │    slope: { score, feedback },       │ ◀── Correct field ID
       │    intercept: { score, feedback },   │
       │    correlation: { score, feedback }, │
       │    _provider: 'groq',                │
       │    _model: 'llama-3.3-70b-versatile',│
       │    _gradingMode: 'ai',               │
       │    _serverGraded: true               │
       │  }                                   │
       └──────────────────────────────────────┘
```

### Panel Visual States

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              VISUAL STATES                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

STATE 1: Hidden (default)
┌─────────────────────────────────────────────────────────────────┐
│                     (no panel visible)                          │
└─────────────────────────────────────────────────────────────────┘

STATE 2: Visible - AI Agrees with Keywords
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI REVIEW                           ⚡ Groq Llama-3.3-70B    │
├─────────────────────────────────────────────────────────────────┤
│ AI Score: E (green)                    ✓ Agrees with keywords   │
├─────────────────────────────────────────────────────────────────┤
│ Great job! Your answer correctly identifies the key concept of  │
│ random assignment which eliminates confounding variables...     │
└─────────────────────────────────────────────────────────────────┘

STATE 3: Visible - AI Disagrees (AI Upgraded Score)
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI REVIEW                           🔷 Gemini 2.0 Flash      │
├─────────────────────────────────────────────────────────────────┤
│ AI Score: E (green)                    ⚡ Keywords said I       │
├─────────────────────────────────────────────────────────────────┤
│ While your wording differs from the expected answer, you've     │
│ correctly captured the essential concept of prediction...       │
└─────────────────────────────────────────────────────────────────┘

STATE 4: Visible - AI Disagrees (AI Downgraded Score)
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI REVIEW                           ⚡ Groq Llama-3.3-70B    │
├─────────────────────────────────────────────────────────────────┤
│ AI Score: P (yellow)                   ⚡ Keywords said E       │
├─────────────────────────────────────────────────────────────────┤
│ Your answer mentions the correct direction but is missing the   │
│ "on average" or "predicted" language required for full credit...│
└─────────────────────────────────────────────────────────────────┘

STATE 5: Error - AI Unavailable
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI REVIEW                           ❌ AI Unavailable        │
├─────────────────────────────────────────────────────────────────┤
│ AI Score: -                                                     │
├─────────────────────────────────────────────────────────────────┤
│ AI grading failed. Using keyword grading only.                  │
└─────────────────────────────────────────────────────────────────┘

STATE 6: Appeal Result
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI APPEAL REVIEW (magenta)          ⚡ Groq Llama-3.3-70B    │
├─────────────────────────────────────────────────────────────────┤
│ AI Score: E (green)                                             │
├─────────────────────────────────────────────────────────────────┤
│ After reviewing your explanation, I agree that your answer      │
│ demonstrates understanding of the concept...                    │
└─────────────────────────────────────────────────────────────────┘
```

### Component API

```javascript
// platform/core/ai-feedback-panel.js

createAIFeedbackPanel()
  → Returns: HTMLElement (panel DOM element)
  → Called: Once during app init
  → Mounts: #ai-feedback-container

updateAIFeedbackPanel(panel, aiResponse, keywordScore, options)
  → panel: HTMLElement from createAIFeedbackPanel
  → aiResponse: {
      _provider: 'groq' | 'gemini',
      _model: 'llama-3.3-70b-versatile' | 'gemini-2.0-flash',
      results: { [fieldId]: { score, feedback } }
    }
  → keywordScore: 'E' | 'P' | 'I' | null
  → options: { isAppeal?: boolean }
  → Effect: Shows panel with AI grading details

showAIFeedbackError(panel, errorMessage)
  → panel: HTMLElement
  → errorMessage: string
  → Effect: Shows panel in error state

hideAIFeedbackPanel(panel)
  → panel: HTMLElement
  → Effect: Hides panel (display: none)
```

### Trigger Points in app.html

```
SHOW PANEL:
1. onGradingComplete → AI grading succeeded → updateAIFeedbackPanel()
2. onGradingComplete → AI grading failed → showAIFeedbackError()
3. Appeal success → updateAIFeedbackPanel(..., { isAppeal: true })

HIDE PANEL:
1. btn-try-again click → hideAIFeedbackPanel()
2. btn-next click → hideAIFeedbackPanel()
3. btn-skip click → hideAIFeedbackPanel()
4. Keyword-only grading → hideAIFeedbackPanel()
```

---

## 47. v2.0.1 VERIFICATION CHECKLIST

```
AI FEEDBACK PANEL:
□ Panel created on app init
□ Panel mounted to #ai-feedback-container
□ Panel hidden by default (display: none)

SERVER RESPONSE:
□ /api/ai/grade returns _model field
□ Groq responses include 'llama-3.3-70b-versatile'
□ Gemini responses include 'gemini-2.0-flash'
□ platform.js captures _model from AI response

PANEL VISIBILITY:
□ Panel shows after AI grading completes
□ Panel shows provider icon (⚡ or 🔷)
□ Panel shows model name
□ Panel shows AI score with correct color
□ Panel shows agreement indicator when keywordScore available
□ Panel shows AI feedback text

ERROR HANDLING:
□ Panel shows error state when AI fails
□ Error state shows "❌ AI Unavailable"
□ Error state explains "Using keyword grading only"

APPEAL INTEGRATION:
□ Panel updates after appeal completes
□ Appeal panel shows "AI APPEAL REVIEW" title
□ Appeal title is magenta colored

HIDE TRIGGERS:
□ Panel hides on Try Again click
□ Panel hides on Next click
□ Panel hides on Skip click
□ Panel hides when keyword-only grading
```

---

## 48. GRID WARS — Territory Rendering Data Flow (v2.1.2)

**v2.1.2 Fix:** Territory objects are stored with coordinates in the key, not as properties on the object itself. The `drawOwnerPresence()` function was incorrectly trying to access `cell.x` and `cell.y`.

```
                    ┌───────────────────────────────────────────────────┐
                    │              SERVER STATE RESPONSE                 │
                    │   territories: [{ x: 3, y: 4, owner: 'alice', ... }]│
                    └─────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
                    ┌───────────────────────────────────────────────────┐
                    │             GridWarsState.refreshState()           │
                    │   for (const t of state.territories) {            │
                    │     this.territories.set(`${t.x},${t.y}`, {       │
                    │       owner: t.owner,                              │
                    │       strength: t.strength,                        │
                    │       // NOTE: x,y NOT stored on object!           │
                    │     });                                            │
                    │   }                                                │
                    └─────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
                    ┌───────────────────────────────────────────────────┐
                    │            TERRITORIES MAP STRUCTURE               │
                    │                                                    │
                    │   Map {                                            │
                    │     "3,4" => { owner: 'alice', strength: 3, ... }, │
                    │     "0,0" => { owner: 'bob', strength: 2, ... }    │
                    │   }                                                │
                    │                                                    │
                    │   KEY = "x,y" string (coords in key)               │
                    │   VALUE = { owner, strength, address, ... }        │
                    │           (NO x,y properties!)                     │
                    └─────────────────────┬─────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
      ┌─────────────────────────┐             ┌─────────────────────────┐
      │  getRenderState()       │             │  syncRendererState()    │
      │  (extracts x,y for UI)  │             │  (passes to renderer)   │
      │                         │             │                         │
      │  for ([key, data]) {    │             │  for (const t of        │
      │    const [x,y] = key    │             │       renderState       │
      │      .split(',')        │             │       .territories) {   │
      │      .map(Number);      │             │    renderer.setTerritory│
      │    territories.push({   │             │    (t.x, t.y, t.owner,  │
      │      x, y, owner,       │             │     { ... });           │
      │      ...data            │             │  }                      │
      │    });                  │             │                         │
      │  }                      │             └────────────┬────────────┘
      └─────────────────────────┘                          │
                                                           ▼
                    ┌───────────────────────────────────────────────────┐
                    │           GridRenderer.territories                 │
                    │                                                    │
                    │   Object {                                         │
                    │     "3,4": { owner: 'alice', color: '#ff0000' },   │
                    │     "0,0": { owner: 'bob', color: '#00ff00' }      │
                    │   }                                                │
                    │                                                    │
                    │   KEY = "x,y" string (coords in key)               │
                    │   VALUE = { owner, color, strength, ... }          │
                    │           (NO x,y properties!)                     │
                    └─────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
                    ┌───────────────────────────────────────────────────┐
                    │            drawOwnerPresence() - v2.1.2 FIX        │
                    │                                                    │
                    │   for (const [key, cell] of                        │
                    │        Object.entries(this.territories)) {         │
                    │                                                    │
                    │     // ❌ OLD (BROKEN): cell.x and cell.y undefined│
                    │     // const cx = cell.x * this.cellSize + ...     │
                    │                                                    │
                    │     // ✅ NEW (FIXED): extract from key            │
                    │     const [x, y] = key.split(',').map(Number);     │
                    │     const cx = x * this.cellSize + ...             │
                    │     const cy = y * this.cellSize + ...             │
                    │   }                                                │
                    └───────────────────────────────────────────────────┘
```

---

## 49. GRID WARS — Config Loading & Presence Dots Mode (v2.1.2)

**v2.1.2 Fix:** The `hierarchyEnabled` config wasn't set as a default, only after server fetch. If server fetch failed or panel initialized early, chevrons would appear.

```
                    ┌───────────────────────────────────────────────────┐
                    │           GRID_WARS_CONFIG (grid-state.js)        │
                    │                                                    │
                    │   export let GRID_WARS_CONFIG = {                  │
                    │     claimCost: 40,                                 │
                    │     bootBonus: 30,                                 │
                    │     mapSize: 8,                                    │
                    │     ...                                            │
                    │                                                    │
                    │     // v2.1.2 FIX: Added defaults so panel works   │
                    │     // even if server config fetch fails           │
                    │     hierarchyEnabled: true,         // ← NEW       │
                    │     maxSubdivisionLevel: 2,         // ← NEW       │
                    │     developmentCost: 100,           // ← NEW       │
                    │     drillCost: 75,                  // ← NEW       │
                    │     drillSaturationThreshold: 85,   // ← NEW       │
                    │   };                                               │
                    └─────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
                    ┌───────────────────────────────────────────────────┐
                    │               GridWarsState.init()                 │
                    │                                                    │
                    │   1. Fetch /api/grid-wars/config                   │
                    │   2. Object.assign(GRID_WARS_CONFIG, serverConfig) │
                    │   3. If fetch fails, defaults are used ←──────────┤
                    │                                                    │
                    │   // hierarchyEnabled=true BEFORE server response  │
                    └─────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
                    ┌───────────────────────────────────────────────────┐
                    │              GridPanel.initCanvas()                │
                    │                                                    │
                    │   console.log('[GridPanel] hierarchyEnabled:',     │
                    │                GRID_WARS_CONFIG.hierarchyEnabled); │
                    │                                                    │
                    │   if (GRID_WARS_CONFIG.hierarchyEnabled) {         │
                    │     this.renderer.setUsePresenceDots(true);        │
                    │     // Presence dots mode: small dots on cells     │
                    │   } else {                                         │
                    │     // Legacy mode: moveable avatar chevrons       │
                    │   }                                                │
                    └───────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
      ┌─────────────────────────┐             ┌─────────────────────────┐
      │  hierarchyEnabled=true  │             │  hierarchyEnabled=false │
      │  (v2.0+ default)        │             │  (legacy, pre-v2.0)     │
      └───────────┬─────────────┘             └───────────┬─────────────┘
                  │                                       │
                  ▼                                       ▼
      ┌─────────────────────────┐             ┌─────────────────────────┐
      │   PRESENCE DOTS MODE    │             │   AVATAR CHEVRON MODE   │
      │                         │             │                         │
      │   render() calls:       │             │   render() calls:       │
      │   - drawTerritoriesStatic│            │   - drawTerritoriesStatic│
      │   - drawOwnerPresence() │             │   - drawAvatars() ←─────┤
      │     ↑ green dots on     │             │     ↑ diamond with      │
      │       owned cells       │             │       chevron direction │
      │                         │             │                         │
      │   No moveable avatars   │             │   Players can move      │
      │   Click = select cell   │             │   Arrow keys = move     │
      └─────────────────────────┘             └─────────────────────────┘
```

---

## 50. v2.1.2 VERIFICATION CHECKLIST

```
CONFIG DEFAULTS:
□ GRID_WARS_CONFIG.hierarchyEnabled === true (client-side)
□ GRID_WARS_CONFIG.maxSubdivisionLevel === 2
□ GRID_WARS_CONFIG.developmentCost === 100
□ GRID_WARS_CONFIG.drillCost === 75
□ GRID_WARS_CONFIG.drillSaturationThreshold === 85

TERRITORY DATA STRUCTURE:
□ Territories stored as Map/Object with "x,y" string keys
□ Territory values do NOT have .x or .y properties
□ getRenderState() extracts x,y from keys correctly
□ syncRendererState() passes x,y to renderer correctly

PRESENCE DOTS RENDERING:
□ drawOwnerPresence() extracts coords: key.split(',').map(Number)
□ Presence dots appear on cells with online owners
□ No chevron/arrow avatars visible in v2.0+ mode
□ Console shows "[GridPanel] Presence dots mode ENABLED"

DEBUG LOGGING:
□ [GridWarsState] refreshState response: shows territory count
□ [GridPanel] syncRendererState: shows owned territory count
□ [GridPanel] hierarchyEnabled: shows true
□ [GridRenderer] setUsePresenceDots: shows true
□ [GridRenderer] loadState: shows territory count and mode

REGRESSION TESTS:
□ tests/game/grid-wars-v2.1.2.test.js passes (21 tests)
□ All existing Grid Wars tests still pass
```

---

## 51. v2.1.5 SUBCELL CLAIM FLOW

```
                              ┌─────────────────────────────────────────────────────┐
                              │           USER CLICKS CELL TO CLAIM                  │
                              │           (while zoomed into parent cell)            │
                              └───────────────────────┬─────────────────────────────┘
                                                      │
                                                      ▼
                              ┌─────────────────────────────────────────────────────┐
                              │            grid-state.js: claimTerritory()          │
                              │                                                      │
                              │   body: {                                            │
                              │     x, y,              // Local coords (0-7)         │
                              │     parentAddress: this.currentParent,  // "d5"      │
                              │     cellLevel: this.currentLevel        // 1         │
                              │   }                                                  │
                              └───────────────────────┬─────────────────────────────┘
                                                      │
                                                      ▼
                              ┌─────────────────────────────────────────────────────┐
                              │               SERVER: /api/grid-wars/action          │
                              │                                                      │
                              │   // Build full address from parent context          │
                              │   const localAddress = coordsToAddress(x, y); // a1  │
                              │   const targetAddress = parentAddress                │
                              │     ? `${parentAddress}.${localAddress}` // "d5.a1"  │
                              │     : localAddress;                      // "a1"     │
                              └───────────────────────┬─────────────────────────────┘
                                                      │
                          ┌───────────────────────────┴───────────────────────────┐
                          │                                                       │
                          ▼                                                       ▼
              ┌───────────────────────┐                           ┌───────────────────────┐
              │   parentAddress SET   │                           │  parentAddress NULL   │
              │   (subcell claim)     │                           │  (macro cell claim)   │
              └───────────┬───────────┘                           └───────────┬───────────┘
                          │                                                   │
                          ▼                                                   ▼
              ┌───────────────────────┐                           ┌───────────────────────┐
              │  LOOKUP BY ADDRESS    │                           │  LOOKUP BY x,y        │
              │                       │                           │  (backwards compat)   │
              │  .eq('address',       │                           │                       │
              │      targetAddress)   │                           │  .eq('x', x)          │
              │                       │                           │  .eq('y', y)          │
              └───────────┬───────────┘                           └───────────┬───────────┘
                          │                                                   │
                          └───────────────────────┬───────────────────────────┘
                                                  │
                                                  ▼
                              ┌─────────────────────────────────────────────────────┐
                              │              INSERT/UPDATE TERRITORY                 │
                              │                                                      │
                              │   {                                                  │
                              │     address: targetAddress,    // "d5.a1"            │
                              │     parent_address: parentAddress, // "d5"           │
                              │     cell_level: cellLevel,     // 1                  │
                              │     owner: username,                                 │
                              │     is_developed: false                              │
                              │   }                                                  │
                              └─────────────────────────────────────────────────────┘
```

---

## 52. v2.1.5 COORDINATE DISPLAY

```
              ┌─────────────────────────────────────────────────────┐
              │              MOUSE HOVER OVER CELL                   │
              └───────────────────────┬─────────────────────────────┘
                                      │
                                      ▼
              ┌─────────────────────────────────────────────────────┐
              │         grid-panel.js: onCellHover(x, y, cell)      │
              │                                                      │
              │   this.updateCoordsDisplay(x, y);                    │
              └───────────────────────┬─────────────────────────────┘
                                      │
                                      ▼
              ┌─────────────────────────────────────────────────────┐
              │              updateCoordsDisplay(x, y)               │
              │                                                      │
              │   // Build local address from coords                 │
              │   const localAddress = String.fromCharCode(97 + x)   │
              │                       + (y + 1);                     │
              │   // e.g., (0,0) → "a1", (2,2) → "c3"               │
              │                                                      │
              │   // Prepend parent if zoomed in                     │
              │   const currentParent = this.state?.currentParent;   │
              │   const fullAddress = currentParent                  │
              │     ? `${currentParent}.${localAddress}`             │
              │     : localAddress;                                  │
              └───────────────────────┬─────────────────────────────┘
                                      │
                  ┌───────────────────┴───────────────────┐
                  │                                       │
                  ▼                                       ▼
      ┌───────────────────────┐             ┌───────────────────────┐
      │  currentParent=null   │             │  currentParent="d5"   │
      │  (macro level)        │             │  (inside subcells)    │
      └───────────┬───────────┘             └───────────┬───────────┘
                  │                                     │
                  ▼                                     ▼
      ┌───────────────────────┐             ┌───────────────────────┐
      │  Display: "📍 E5"     │             │  Display: "📍 D5.C3"  │
      │  levelText: "MACRO    │             │  levelText: "LEVEL 1" │
      │             LEVEL"    │             │                       │
      └───────────────────────┘             └───────────────────────┘
```

---

## 53. v2.1.5 ARROW KEY NAVIGATION

```
              ┌─────────────────────────────────────────────────────┐
              │              KEYDOWN EVENT ON CANVAS                 │
              └───────────────────────┬─────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────────┐
              │                                                   │
              ▼                                                   ▼
      ┌───────────────────────┐                   ┌───────────────────────┐
      │   ArrowUp pressed     │                   │   ArrowDown pressed   │
      └───────────┬───────────┘                   └───────────┬───────────┘
                  │                                           │
                  ▼                                           ▼
      ┌───────────────────────┐                   ┌───────────────────────┐
      │  Is cell selected?    │                   │  Can zoom out?        │
      │  Is cell developed?   │                   │  (currentLevel > 0)   │
      └───────────┬───────────┘                   └───────────┬───────────┘
                  │                                           │
          ┌───────┴───────┐                           ┌───────┴───────┐
          ▼               ▼                           ▼               ▼
      ┌───────┐       ┌───────┐                   ┌───────┐       ┌───────┐
      │  YES  │       │  NO   │                   │  YES  │       │  NO   │
      └───┬───┘       └───┬───┘                   └───┬───┘       └───┬───┘
          │               │                           │               │
          ▼               ▼                           ▼               ▼
      ┌───────────┐   ┌───────────┐             ┌───────────┐   ┌───────────┐
      │ zoomIn()  │   │ (nothing) │             │ zoomOut() │   │ (nothing) │
      │           │   │           │             │           │   │ already   │
      │ Enter     │   │           │             │ Go back   │   │ at root   │
      │ subcells  │   │           │             │ to parent │   │           │
      └───────────┘   └───────────┘             └───────────┘   └───────────┘
```

---

## 54. v2.1.5 VERIFICATION CHECKLIST

```
SUBCELL CLAIMS:
□ claimTerritory() sends parentAddress (null for macro, "d5" for subcell)
□ claimTerritory() sends cellLevel (0 for macro, 1+ for subcell)
□ Server builds targetAddress from parent context
□ Server uses address-based lookup for subcells (not x,y)
□ Server inserts/updates with address, parent_address, cell_level fields
□ Claiming in d5 at position (0,0) creates "d5.a1", not overwrites "a1"

COORDINATE DISPLAY:
□ Coordinate section visible in sidebar
□ Shows "📍" emoji with address
□ Shows "MACRO LEVEL" for level 0
□ Shows "LEVEL 1", "LEVEL 2" for subdivisions
□ Address updates on cell hover
□ Address format: "D5" (macro), "D5.C3" (level 1), "D5.C3.A1" (level 2)

ARROW KEY NAVIGATION:
□ ArrowUp zooms into developed cell (if one is selected)
□ ArrowDown zooms out to parent level
□ ArrowDown does nothing when already at root (level 0)
□ ArrowUp does nothing if no cell selected or cell not developed

DEVELOP/DRILL TOOLTIPS:
□ Develop button has title explaining mechanic
□ Drill button has title explaining mechanic
□ Tooltips appear on hover

REGRESSION TESTS:
□ tests/game/grid-wars-v2.1.5.test.js passes (34 tests)
□ All existing Grid Wars tests still pass (1131+ tests total)
```

---

*Updated to v2.1.5*
*Last updated: January 2026*
*Total sections: 50*
