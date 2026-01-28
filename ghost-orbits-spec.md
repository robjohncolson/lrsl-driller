# Ghost Orbits - Game Design Specification

**Version:** 2.0
**Date:** 2026-01-27
**Inspirations:** 12 Orbits, Spin Doctor, Osmos
**Platform:** Web (Canvas 2D)
**Context:** Mini-game reward within LRSL-Driller educational platform

---

## 1. Core Concept

**One sentence:** Ghosts claim territory by leaving trails, and claimed territory spawns orbital wells that provide strategic anchor points.

**The loop:**
```
MOVE → TRAIL → TERRITORY → WELLS SPAWN → ORBIT → SLINGSHOT → MOVE...
```

Your learning creates your ghost. Your ghost creates the battlefield.

---

## 2. Controls

| Input | Action |
|-------|--------|
| **Arrow Keys** | Thrust in direction (costs energy) |
| **No Input** | Drift on momentum / Continue orbiting |
| **Any Arrow while orbiting** | Release from well in that direction |

**That's it.** No buttons, no modes, no menus during play.

---

## 3. Movement States

```
┌─────────────┐          ┌─────────────┐
│  FREE FLIGHT │ ←──────→ │   ORBITING   │
│             │  enter    │             │
│ - Full control│  well's  │ - Auto-rotate│
│ - Uses energy │  gravity │ - No energy  │
│ - Leaves trail│          │ - No trail   │
└─────────────┘          └─────────────┘
       ↑                        │
       │    Arrow key =         │
       └──── slingshot out ─────┘
```

**Key tension:** Orbiting is safe (no energy cost, predictable) but you're a sitting duck and not claiming territory. Free flight is risky but productive.

---

## 4. Territory & Well Spawning

### Territory Claiming
- Ghosts leave colored trails while in free flight
- Trail persists for `trailDuration` seconds (NN property)
- Territory = area covered by your trails
- Territory slowly decays if not refreshed

### Well Spawning (The Core Innovation)

```
When territory reaches critical mass in a grid region:
  → A gravity well SPAWNS at the territory center
  → Well is YOUR color
  → You can orbit YOUR wells
  → Enemies are REPELLED by your wells
```

**Thresholds:**

| Territory Size | Result |
|----------------|--------|
| < 5% cell | No effect |
| 5-15% cell | **Minor Well** - weak gravity, small orbit |
| 15-30% cell | **Standard Well** - medium gravity |
| 30%+ cell | **Major Well** - strong gravity, slingshot boost |

### Visual Progression
```
Territory claimed → Glow intensifies → Well crystallizes at center
                                              ↓
                                       Pulsing anchor point
```

---

## 5. Well Mechanics

### Your Wells (Friendly)
- Enter gravity field → automatically captured into orbit
- Orbit radius based on entry velocity
- Arrow key → slingshot release in that direction
- Major wells grant velocity boost on release
- Safe haven - enemies can't easily reach you

### Enemy Wells
- Their territory, their wells
- **Repulsion** - pushed away, costs energy to cross enemy territory

### Well Properties

| Well Type | Gravity Strength | Orbit Radius | Slingshot Boost |
|-----------|------------------|--------------|-----------------|
| Minor | 0.5x | 40px | 1.0x |
| Standard | 1.0x | 60px | 1.2x |
| Major | 1.5x | 80px | 1.5x |

### Well Limits
- **Maximum 5 wells per player** - prevents camping
- **Wells decay** when territory beneath them fades
- Oldest well despawns when limit reached

---

## 6. The Shadow Self

When no other players are present:

### Spawn Behavior
```
Your Shadow spawns with:
- Identical NN properties (mass, thrust, trail, energy, width)
- Starts opposite side of arena
- AI uses YOUR most common movement patterns
```

### Shadow AI Logic
1. Mirrors your orbital preferences (which wells you create/use)
2. Learns from your losses - replays winning moves against you
3. Gets slightly more aggressive each round

### Victory Reward
```
BEAT YOUR SHADOW:
  → Weakest property gains +0.05
  → Shadow levels up (faster, smarter)
  → New "generation" counter displayed

LOSE TO SHADOW:
  → Shadow records the winning pattern
  → "Rematch?" prompt
  → No penalty
```

### Shadow Progression
```
Generation 1: Mirrors you exactly
Generation 2: 5% faster reactions
Generation 3: Uses your best slingshot angles
Generation 4: Predicts your orbital entries
...
Generation N: Your ultimate rival
```

### Stat Leveling Logic
When you win, the game analyzes your weakest stat during the match:
- Got absorbed? → Mass was lacking → **mass +0.05**
- Ran out of energy often? → **energyRegen +0.05**
- Couldn't claim territory fast enough? → **trailDuration or trailWidth +0.05**

This creates **self-balancing progression** - you naturally round out your ghost.

---

## 7. Ghost Properties (NN-Driven)

| Property | Range | Learning Source | Gameplay Effect |
|----------|-------|-----------------|-----------------|
| **Mass** | 0.5-1.5x | Accuracy | Size, absorption threshold |
| **Thrust** | 0.7-1.3x | Quick answers | Acceleration per energy |
| **Trail Duration** | 0.5-1.5x | Independence | How long trails persist |
| **Energy Regen** | 0.7-1.3x | Solve speed | Recovery rate |
| **Trail Width** | 0.8-1.2x | Accuracy | Territory claim rate |

### Visual Manifestation (No HUD Philosophy)

| Property | Visual |
|----------|--------|
| Mass | Ghost SIZE |
| Thrust | Motion blur LENGTH |
| Trail Duration | Trail GLOW intensity |
| Energy | Ghost OPACITY (dim = low) |
| Trail Width | Trail THICKNESS |

---

## 8. Arena Layout

### Initial State
```
┌────────────────────────────────────┐
│                                    │
│     ○                        ○     │  ← Starting wells (neutral)
│            ┌──────────┐            │
│            │  VOID    │            │  ← Central hazard (energy drain)
│            │  ZONE    │            │
│            └──────────┘            │
│     ○                        ○     │
│                                    │
│  [YOU]                    [SHADOW] │  ← Spawn points
│                                    │
└────────────────────────────────────┘
```

### Mid-Game (Territory Established)
```
┌────────────────────────────────────┐
│  ●───●                             │  ← Your wells (your color)
│   ╲ ╱    ○                   ◐     │
│    ●            ┌──────┐     ◐──◐  │  ← Shadow wells (complementary)
│     ╲           │ VOID │      ╲╱   │
│      ~~~trail~~~│      │       ◐   │
│                 └──────┘           │
│     ○                        ○     │
│                                    │
│         ~territory~                │
│                                    │
└────────────────────────────────────┘
```

### Neutral Wells
- 4 neutral wells at start (white/gray)
- Anyone can orbit them
- No slingshot boost
- Provide early-game anchor points

---

## 9. Win Conditions

### Solo (vs Shadow)

| Condition | Description |
|-----------|-------------|
| **Domination** | Control 70% territory for 5 seconds |
| **Absorption** | Collide with Shadow while larger mass |
| **Timeout** | Most territory at 90 seconds wins |

### Multiplayer

| Condition | Description |
|-----------|-------------|
| **Last Ghost** | All others absorbed |
| **Domination** | 60% territory for 5 seconds |
| **Timeout** | Most territory at 2 minutes |

---

## 10. Visual Language

### Colors
```
Your ghost/trails/wells:  Your NN tier color (blue→green→gold→orange→magenta)
Shadow:                   Complementary hue
Enemy players:            Their tier colors
Neutral:                  White/gray
Void:                     Dark purple/black, pulsing
```

### Effects (No HUD Philosophy)

| State | Visual Feedback |
|-------|-----------------|
| Low energy | Ghost dims, flickers |
| Boosting | Motion blur, particle trail |
| Orbiting | Circular path preview, relaxed glow |
| Slingshot charging | Well brightens, trajectory line |
| Territory claiming | Ground color fills beneath trail |
| Well spawning | Territory crystallizes, pulse wave |
| Absorption imminent | Larger ghost glows, smaller shakes |

---

## 11. Audio Design

Atari 2600 / 70s synth aesthetic:

| Event | Sound |
|-------|-------|
| Thrust | Low sine wave hum, pitch = velocity |
| Enter orbit | Soft "lock" chime |
| Slingshot release | Ascending sweep |
| Well spawn | Crystalline ping |
| Trail collision | Crackling static |
| Absorption | Deep "wub" bass drop |
| Victory | Triumphant arpeggio |
| Defeat | Descending wah |

---

## 12. Session Flow

```
┌─────────────────────────────────────────────────────┐
│                    DRILLING                          │
│                       │                              │
│                  Earn Gold Star                      │
│                       │                              │
│                       ▼                              │
│              ┌─────────────────┐                     │
│              │  ARENA UNLOCK   │                     │
│              │  "Enter Arena"  │                     │
│              └────────┬────────┘                     │
│                       │                              │
│                       ▼                              │
│              ┌─────────────────┐                     │
│              │   MATCHMAKING   │                     │
│              │                 │                     │
│              │ Classmates? ────┼──→ Multiplayer     │
│              │      │          │                     │
│              │      No         │                     │
│              │      ↓          │                     │
│              │ Shadow Self     │                     │
│              └────────┬────────┘                     │
│                       │                              │
│                       ▼                              │
│              ┌─────────────────┐                     │
│              │   COUNTDOWN     │  3... 2... 1...     │
│              └────────┬────────┘                     │
│                       │                              │
│                       ▼                              │
│              ┌─────────────────┐                     │
│              │     BATTLE      │  60-90 seconds      │
│              └────────┬────────┘                     │
│                       │                              │
│              ┌────────┴────────┐                     │
│              ▼                 ▼                     │
│         ┌────────┐       ┌────────┐                  │
│         │  WIN   │       │  LOSE  │                  │
│         │ +stat  │       │ learn  │                  │
│         └───┬────┘       └───┬────┘                  │
│             │                │                       │
│             ▼                ▼                       │
│       ┌──────────────────────────┐                   │
│       │   RETURN TO DRILLING     │                   │
│       │   (or rematch if stars)  │                   │
│       └──────────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

---

## 13. Technical Architecture

### Components

```
ghost-orbits-controller.js   ← Main game loop, state machine (EXISTS - needs update)
ghost-orbits-renderer.js     ← Canvas drawing, effects (EXISTS - needs update)
ghost-orbits-physics.js      ← Movement, gravity, collisions (NEW)
ghost-orbits-territory.js    ← Trail tracking, well spawning (NEW)
ghost-orbits-shadow-ai.js    ← Shadow self behavior (NEW)
ghost-orbits-audio.js        ← Sound synthesis (EXISTS)
ghost-orbits-nn-mapper.js    ← NN → properties (EXISTS)
```

### State Machine
```
IDLE → CONNECTING → COUNTDOWN → PLAYING → ROUND_END → RESULTS
                                   ↑           │
                                   └───────────┘ (rematch)
```

---

## 14. Implementation Phases

### Phase 1: Core Loop (CURRENT)
- [x] Basic ghost movement and trails
- [ ] Gravity well physics (attraction, orbit capture)
- [ ] Slingshot release mechanic
- [ ] Territory flood fill / grid tracking
- [ ] Well spawning from territory

### Phase 2: Shadow Self
- [ ] Shadow AI that mirrors player
- [ ] Pattern recording system
- [ ] Generation progression
- [ ] Stat reward on victory

### Phase 3: Polish
- [ ] Visual effects (glow, particles, crystallization)
- [ ] Audio integration
- [ ] Smooth animations
- [ ] Victory/defeat sequences

### Phase 4: Multiplayer
- [ ] WebSocket sync for wells
- [ ] Territory conflict resolution
- [ ] Absorption mechanics
- [ ] Leaderboard/rankings

---

## 15. Design Decisions

| Question | Decision |
|----------|----------|
| Well lifespan | **Decay** with territory - keeps arena dynamic |
| Max wells per player | **Cap at 5** - prevents camping |
| Void zone behavior | **Energy drain** - more forgiving than instant death |
| Enemy well interaction | **Repel** - clear territory ownership |
| Round duration | **90s with sudden death** if tied |
| Neutral wells | **4 at start** - early anchor points |

---

## 16. Physics Constants

```javascript
const PHYSICS = {
  // Movement
  THRUST_FORCE: 0.5,
  DRAG: 0.98,
  MAX_VELOCITY: 8,

  // Energy
  THRUST_ENERGY_COST: 0.02,
  BASE_ENERGY_REGEN: 0.01,
  MAX_ENERGY: 1.0,

  // Gravity Wells
  WELL_GRAVITY_STRENGTH: 0.3,
  WELL_CAPTURE_RADIUS: 80,
  WELL_ORBIT_RADIUS: 50,
  SLINGSHOT_BOOST: 1.5,

  // Territory
  GRID_CELL_SIZE: 20,
  TERRITORY_THRESHOLD_MINOR: 0.05,
  TERRITORY_THRESHOLD_STANDARD: 0.15,
  TERRITORY_THRESHOLD_MAJOR: 0.30,
  WELL_SPAWN_COOLDOWN: 2000, // ms
  MAX_WELLS_PER_PLAYER: 5,

  // Void Zone
  VOID_ENERGY_DRAIN: 0.03,
  VOID_RADIUS: 60,

  // Collision
  ABSORPTION_MASS_RATIO: 1.2, // 20% larger to absorb
};
```

---

## 17. File Locations

- **Spec:** `ghost-orbits-spec.md` (this file)
- **Core files:** `platform/core/ghost-orbits-*.js`
- **Game files:** `platform/game/ghost-orbits-*.js`
- **Entry point:** `platform/app.html` → `launchGhostOrbits()`

---

## 18. Appendix: Spin Doctor Inspiration

Key mechanics borrowed from Spin Doctor (1993 Mac game):

1. **Constant motion** - You can never truly stop, only control direction
2. **Anchor points** - Wells serve as strategic "dots" to orbit
3. **Timing-based release** - Success is about *when* to act
4. **Minimal controls** - Arrow keys only, no buttons
5. **Emergent complexity** - Simple rules, deep strategy

The hybrid creates: 12 Orbits' free-flowing territory + Spin Doctor's anchor-based swinging.
