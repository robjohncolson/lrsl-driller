# Ghost Tower & Arena System

Complete design specification for the Ghost visualization and flagship game system.

**Version**: 1.0.0
**Date**: January 2026
**Status**: DESIGN PHASE - No coding until approved

---

## 1. Vision Statement

Replace the 3D maze visualization with a **Tower** metaphor and add a **flagship arena game** where ghost neural network stats translate into gameplay advantages. The system should:

1. **Visualize Progress**: Tower shows vertical climb through cartridge levels
2. **Reward Practice**: Stronger ghost = better game performance
3. **Enable Competition**: Realtime multiplayer like Pong tiebreaker
4. **Allow Drop-ins**: Solo play that others can join (Pico Park style)

---

## 2. Tower Visualization

### 2.1 Concept

A vertical tower where each floor = one cartridge level. Student's ghost character climbs as they progress.

```
    ┌───────┐
    │  ⭐   │ L24 - Capstone (locked)
    ├───────┤
    │  🔒   │ L23
    ├───────┤
    │  ...  │
    ├───────┤
    │  ⭐⭐  │ L05 - 2 gold stars
    ├───────┤
    │ ⭐⭐⭐ │ L04 - 3 gold stars (CURRENT)
    ├═══════┤ ← Unlock gate (requires 3 gold)
    │  ⭐⭐⭐⭐│ L03 - 4 gold stars
    ├───────┤
    │  ⭐⭐⭐ │ L02 - 3 gold stars
    ├───────┤
    │  ⭐⭐⭐⭐│ L01 - 4 gold stars
    └───────┘
      👻 ← Ghost character on current floor
```

### 2.2 Tower Features

| Feature | Description |
|---------|-------------|
| **Climb Animation** | Ghost smoothly animates between floors when level changes |
| **Level Icons** | Each floor shows level name, star count, topic icon |
| **Unlock Gates** | Visual barriers at progression gates (gold star requirements) |
| **Peer Ghosts** | See classmates' ghosts on their respective floors (faded/transparent) |
| **Current Floor Glow** | Highlighted platform for active level |
| **Star Particles** | Floating stars around completed floors |

### 2.3 Tower Rendering

- **Technology**: Canvas 2D (simpler than Three.js, sufficient for 2D tower)
- **Dimensions**: 300px wide × full panel height
- **Scroll**: Tower scrolls vertically, current level centered
- **Responsive**: Adapts to panel resize

### 2.4 Tower Data Requirements

```javascript
const towerData = {
  levels: [
    { id: 'l01-vocab', name: 'Vocabulary', goldStars: 4, unlocked: true },
    { id: 'l02-identify', name: 'Identification', goldStars: 3, unlocked: true },
    // ...
  ],
  currentLevel: 'l04-apply',
  ghostPosition: 3,  // 0-indexed floor number
  classmates: [
    { username: 'alice', floor: 5, ghostColor: '#ff6b6b' },
    { username: 'bob', floor: 2, ghostColor: '#4ecdc4' },
  ]
};
```

---

## 3. Ghost Stats System

### 3.1 Neural Network Output → Game Stats

The ghost neural network outputs 4 values. These map to game stats:

| NN Output | Range | Game Stat | Effect in Arena |
|-----------|-------|-----------|-----------------|
| `predicted_time` | 5-120s | **Speed** | Movement speed, action cooldowns |
| `correct_prob` | 0-1 | **Power** | Damage dealt, ability strength |
| `hint_prob` | 0-1 | **Defense** | Damage reduction, shield strength |
| `quick_prob` | 0-1 | **Agility** | Attack speed, dodge chance |

### 3.2 Stat Normalization

Raw NN outputs need normalization to balanced game stats:

```javascript
function normalizeGhostStats(nnOutput) {
  return {
    // Lower time = faster = higher speed (inverted)
    speed: Math.max(0.3, Math.min(1.0, 1 - (nnOutput.predicted_time - 5) / 115)),

    // Direct mapping with floor
    power: Math.max(0.3, nnOutput.correct_prob),

    // Inverted: low hint usage = good defense
    defense: Math.max(0.3, 1 - nnOutput.hint_prob),

    // Direct mapping
    agility: Math.max(0.3, nnOutput.quick_prob)
  };
}
```

**Design Note**: Minimum 0.3 ensures even weak ghosts are playable. Maximum 1.0 caps advantage.

### 3.3 Stat Display

Ghost stats shown as RPG-style stat bars:

```
┌─────────────────────────┐
│  👻 alice's Ghost       │
│                         │
│  SPD ████████░░ 0.82    │
│  PWR ██████░░░░ 0.65    │
│  DEF █████░░░░░ 0.54    │
│  AGI ███████░░░ 0.71    │
│                         │
│  Overall: ⭐⭐⭐ (Gold)    │
└─────────────────────────┘
```

---

## 4. Flagship Game: Ghost Rush

### 4.1 Game Concept

A lane-based auto-battler with strategic spawner placement. Two bases face off, spawning units that auto-march and fight. Ghost stats determine resource generation and unit effectiveness.

**Why Ghost Rush?**
- Captures RTS feel without pathfinding complexity
- Ghost stats meaningfully affect gameplay
- Works solo against AI or realtime vs players
- Drop-in friendly (reinforcements can join)
- ~1000-1500 lines (achievable scope)

### 4.2 Game Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  BLUE BASE (You)                           RED BASE (Enemy)     │
│     🏰                                           🏰             │
│      │                                            │             │
│  ┌───┴───┐                                    ┌───┴───┐         │
│  │ Lane 1│  →→→ 🔵🔵🔵    💥    🔴🔴 ←←←    │ Lane 1│         │
│  ├───────┤                                    ├───────┤         │
│  │ Lane 2│  →→→ 🔵🔵      💥  🔴🔴🔴 ←←←    │ Lane 2│         │
│  ├───────┤                                    ├───────┤         │
│  │ Lane 3│  →→→ 🔵    💥      🔴🔴🔴🔴 ←←←  │ Lane 3│         │
│  └───────┘                                    └───────┘         │
│                                                                 │
│  ⚡ Energy: 47/100        [Scout][Warrior][Tank]                │
│  +2.3/sec (from ghost)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Core Mechanics

#### 4.3.1 Energy System

Energy is the single resource. Ghost stats determine generation rate:

```javascript
const BASE_ENERGY_RATE = 1.0;  // per second

function calculateEnergyRate(ghostStats) {
  // All stats contribute to energy generation
  const multiplier = (
    ghostStats.speed * 0.3 +
    ghostStats.power * 0.3 +
    ghostStats.defense * 0.2 +
    ghostStats.agility * 0.2
  );
  return BASE_ENERGY_RATE * (0.5 + multiplier);  // Range: 0.65 - 1.5 per sec
}
```

#### 4.3.2 Unit Types

| Unit | Cost | HP | Damage | Speed | Special |
|------|------|-----|--------|-------|---------|
| **Scout** | 10⚡ | 20 | 5 | Fast | First to arrive |
| **Warrior** | 25⚡ | 50 | 15 | Medium | Balanced |
| **Tank** | 50⚡ | 120 | 8 | Slow | High HP, blocks lane |

Ghost stats modify unit effectiveness:

```javascript
function applyGhostBonus(unit, ghostStats) {
  unit.hp *= (0.8 + ghostStats.defense * 0.4);      // 0.8x - 1.2x HP
  unit.damage *= (0.8 + ghostStats.power * 0.4);    // 0.8x - 1.2x damage
  unit.speed *= (0.8 + ghostStats.speed * 0.4);     // 0.8x - 1.2x speed
  unit.attackSpeed *= (0.8 + ghostStats.agility * 0.4); // 0.8x - 1.2x attack speed
}
```

#### 4.3.3 Combat Resolution

Units auto-attack enemies in their lane:

```javascript
function resolveСombat(attacker, defender) {
  const damage = attacker.damage * attacker.attackSpeed;
  defender.hp -= damage;

  if (defender.hp <= 0) {
    // Defender dies, attacker continues marching
    return { killed: true };
  }
  return { killed: false };
}
```

#### 4.3.4 Win Condition

- Destroy enemy base (base has 500 HP)
- OR have more base HP when timer expires (3 minutes)

### 4.4 Spawning Interface

Click lane + unit type to queue spawn:

```
┌─────────────────────────────────────┐
│  SELECT LANE:  [1] [2] [3]          │
│  SELECT UNIT:  [Scout 10⚡]          │
│                [Warrior 25⚡]        │
│                [Tank 50⚡]           │
│                                     │
│  Queue: 🔵→L1, 🔵🔵→L2              │
│  [SPAWN NOW]                        │
└─────────────────────────────────────┘
```

### 4.5 Drop-In Multiplayer

#### 4.5.1 Solo Mode (vs AI)

- AI spawns units at fixed intervals
- AI difficulty scales with player's ghost strength
- Good for practice

#### 4.5.2 PvP Mode

- Realtime WebSocket (like Pong tiebreaker)
- Matchmaking by ghost overall rating
- 3-minute matches

#### 4.5.3 Drop-In Reinforcement

While in a match (solo or PvP), classmates can "drop in" as reinforcements:

```javascript
// Reinforcement joins your team
{
  type: 'ghost_rush_reinforce',
  gameId: 'abc123',
  reinforcement: {
    username: 'bob',
    ghostStats: { speed: 0.7, power: 0.8, defense: 0.5, agility: 0.6 }
  }
}
```

Reinforcement effect:
- **Energy boost**: +50 energy instantly
- **Passive bonus**: +0.3 energy/sec for rest of match
- **Combined stats**: Unit bonuses use average of all allied ghost stats

### 4.6 Visual Style

- **Art**: Simple geometric shapes (circles, rectangles)
- **Colors**: Blue team = cool colors, Red team = warm colors
- **Effects**: Particle bursts on unit death, glow on damage
- **Canvas**: 800×400px game area

---

## 5. Integration Architecture

### 5.1 File Structure

```
platform/
├── game/
│   ├── ghost-panel.js        # Main panel (MODIFY - remove maze, add tower)
│   ├── ghost-tower.js        # NEW: Tower visualization
│   ├── ghost-rush/
│   │   ├── engine.js         # NEW: Game logic
│   │   ├── renderer.js       # NEW: Canvas rendering
│   │   ├── units.js          # NEW: Unit definitions
│   │   ├── ai.js             # NEW: AI opponent
│   │   └── multiplayer.js    # NEW: WebSocket integration
│   └── ...existing files...
```

### 5.2 Ghost Panel Tabs

```
┌─────────────────────────────────────────┐
│  [🗼 Tower] [⚔️ Arena] [👥 Class]       │
├─────────────────────────────────────────┤
│                                         │
│   Tab content here                      │
│                                         │
└─────────────────────────────────────────┘
```

| Tab | Content |
|-----|---------|
| **Tower** | Level progress visualization, ghost stats display |
| **Arena** | Ghost Rush game, matchmaking, active matches |
| **Class** | Classmates' ghosts, leaderboard, challenge buttons |

### 5.3 Server Endpoints (New)

```
POST /api/ghost/:cartridgeId/arena/match
  Body: { username, mode: 'solo' | 'pvp' | 'drop-in' }
  Response: { matchId, opponent?, initialState }

POST /api/ghost/:cartridgeId/arena/action
  Body: { matchId, action: { type: 'spawn', lane, unitType } }
  Response: { success, newState }

POST /api/ghost/:cartridgeId/arena/reinforce
  Body: { matchId, username }
  Response: { success, energyBonus }

GET /api/ghost/:cartridgeId/arena/match/:matchId
  Response: { state, timeline, result? }
```

### 5.4 WebSocket Messages

```javascript
// Game state updates (60fps tick compressed to key frames)
{ type: 'ghost_rush_state', matchId, state: {...} }

// Unit spawned
{ type: 'ghost_rush_spawn', matchId, unit: {...}, lane }

// Unit died
{ type: 'ghost_rush_death', matchId, unitId, killer }

// Base damaged
{ type: 'ghost_rush_damage', matchId, side, newHp }

// Game ended
{ type: 'ghost_rush_end', matchId, winner, stats }

// Reinforcement joined
{ type: 'ghost_rush_reinforce', matchId, username, bonus }
```

### 5.5 Database Schema

```sql
-- Ghost Rush matches
CREATE TABLE ghost_rush_matches (
  id SERIAL PRIMARY KEY,
  cartridge_id VARCHAR(100) NOT NULL,

  -- Players
  blue_username VARCHAR(50) NOT NULL,
  red_username VARCHAR(50),  -- NULL for AI
  reinforcements JSONB DEFAULT '[]',

  -- Game state
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('solo', 'pvp')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'complete')),

  -- Results
  winner VARCHAR(10) CHECK (winner IN ('blue', 'red', 'draw')),
  blue_base_hp INTEGER,
  red_base_hp INTEGER,
  duration_seconds INTEGER,

  -- Timeline for replay
  match_log JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_ghost_rush_cartridge ON ghost_rush_matches(cartridge_id);
CREATE INDEX idx_ghost_rush_blue ON ghost_rush_matches(blue_username);
CREATE INDEX idx_ghost_rush_active ON ghost_rush_matches(status) WHERE status = 'active';
```

---

## 6. Implementation Phases

### Phase 1: Tower Visualization (Est. 400 lines)
1. Create `ghost-tower.js` with Canvas 2D rendering
2. Tower scroll, level display, star indicators
3. Ghost character on current floor
4. Unlock gate visuals
5. Integrate into ghost-panel.js (replace maze)

### Phase 2: Ghost Stats Display (Est. 200 lines)
1. Stat normalization from NN output
2. RPG-style stat bars UI
3. Overall rating calculation
4. Integration with tower tab

### Phase 3: Ghost Rush Core (Est. 600 lines)
1. Game engine: energy, spawning, lanes
2. Unit definitions and combat
3. Win condition logic
4. Canvas renderer

### Phase 4: Solo Mode (Est. 300 lines)
1. AI opponent logic
2. Difficulty scaling
3. Match flow (start, play, end)

### Phase 5: Multiplayer (Est. 400 lines)
1. WebSocket integration
2. State synchronization
3. Matchmaking
4. Drop-in reinforcement

### Phase 6: Polish (Est. 200 lines)
1. Visual effects (particles, glow)
2. Sound effects (reuse sound-engine)
3. Match history display
4. Leaderboard integration

**Total Estimate**: ~2100 lines of new code

---

## 7. Open Questions

Before implementation, please confirm:

1. **Tower Style**:
   - (A) Pixel art / retro game style
   - (B) Clean geometric / modern style
   - (C) Sketch / hand-drawn style

2. **Ghost Character**:
   - (A) Simple ghost emoji 👻
   - (B) Custom pixel sprite (8x8 or 16x16)
   - (C) Geometric shape with color

3. **Match Duration**:
   - (A) 2 minutes (quick)
   - (B) 3 minutes (standard)
   - (C) 5 minutes (strategic)

4. **Reinforcement Limit**:
   - (A) 1 reinforcement per match
   - (B) 2 reinforcements per match
   - (C) Unlimited

5. **AI Difficulty Modes**:
   - (A) Single adaptive AI
   - (B) Easy / Medium / Hard selection
   - (C) Ghost-matched (AI mimics a random classmate's ghost)

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Students engaging with Ghost Panel | >50% of active users |
| Average matches per student per week | >3 |
| Drop-in reinforcement usage | >20% of matches |
| Tower viewed after earning star | >70% of star events |

---

## 9. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Game too complex | Start with solo mode only, add PvP later |
| Ghost stats unbalanced | Floor at 0.3, cap at 1.0, tune multipliers |
| WebSocket load | Compress state updates, 10fps network tick |
| Students ignore tower | Make it the default tab, add animations |

---

*This specification is part of the Ghost System. See `ghost-phase6-battle-spec.md` for the async battle system (separate from realtime Arena).*
