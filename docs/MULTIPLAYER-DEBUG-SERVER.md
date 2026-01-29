# Ghost Orbits Multiplayer - Server Debug Analysis

This document details the exact data formats sent by the server for Ghost Orbits multiplayer, to help debug rendering issues where ghosts and dots are not appearing despite correct server data.

## Table of Contents

1. [Server Architecture Overview](#server-architecture-overview)
2. [ArenaGameState Data Generation](#arenagamestate-data-generation)
3. [Color Formats](#color-formats)
4. [Position Coordinate Systems](#position-coordinate-systems)
5. [Dot Generation and Tracking](#dot-generation-and-tracking)
6. [WebSocket Message Formats](#websocket-message-formats)
7. [Broadcast Timing](#broadcast-timing)
8. [Client Expectations vs Server Output](#client-expectations-vs-server-output)
9. [Identified Mismatches](#identified-mismatches)

---

## Server Architecture Overview

There are **TWO separate arena systems** in the codebase:

### 1. Global Arena (arena-game-state.js + arena-manager.js)
- **File**: `railway-server/arena-game-state.js`
- **Purpose**: Persistent drop-in/drop-out multiplayer with betting
- **Message prefix**: `global_arena_*`
- **Used by**: `GhostOrbitsController` (client)

### 2. Cartridge-Specific Arena (ghost-orbits-manager.js)
- **File**: `railway-server/ghost-orbits-manager.js`
- **Purpose**: Per-cartridge/period arena for class-based games
- **Message prefix**: `join_arena`, `leave_arena`, `input`
- **Used by**: Original Ghost Orbits panel

The **Global Arena** is the one used by the multiplayer controller.

---

## ArenaGameState Data Generation

### Full State (`getGameState()`)

Location: `arena-game-state.js` lines 952-976

```javascript
getGameState() {
  const players = {};
  for (const [id, player] of this.players) {
    players[id] = player.toJSON();
  }

  const dots = {};
  for (const [id, dot] of this.dots) {
    dots[id] = dot.toJSON();
  }

  return {
    arenaId: this.id,
    arenaSize: this.arenaSize,
    isRunning: this.isRunning,
    players,
    dots,
    orbits: this.orbits.map(o => o.toJSON()),
    playerCount: this.players.size,
    aliveCount: Array.from(this.players.values()).filter(p => p.isAlive).length,
  };
}
```

### Delta State (`getDeltaState()`)

Location: `arena-game-state.js` lines 978-1018

Sent every tick (30fps). Contains:
- **players**: Object with `{ x, y, vx, vy, orbitAngle, orbiting, dotCount, lives, isAlive }`
- **dots**: Only dots that changed recently (within 2 ticks)
- **arenaId**: Arena identifier
- **tick**: Timestamp

```javascript
getDeltaState() {
  const players = {};
  for (const [id, player] of this.players) {
    players[id] = {
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      orbitAngle: player.orbitAngle,
      orbiting: player.orbiting,
      dotCount: player.dots.size,
      lives: player.lives,
      isAlive: player.isAlive,
    };
  }

  const recentDots = {};
  const recentThreshold = ARENA_CONFIG.TICK_INTERVAL * 2; // ~66ms
  const now = Date.now();

  for (const [id, dot] of this.dots) {
    if (now - dot.lastClaimTime < recentThreshold || dot.lastClaimTime === 0) {
      recentDots[id] = {
        owner: dot.owner,
        state: dot.state,
      };
    }
  }

  return {
    arenaId: this.id,
    tick: this.lastTickTime,
    players,
    dots: recentDots,
  };
}
```

---

## Color Formats

### Server Color Generation

**HSL Format** (Primary method in `arena-game-state.js`):

Location: `arena-game-state.js` lines 157-164 (Player.generateColor)

```javascript
generateColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;  // <-- HSL FORMAT
}
```

**Hex Format** (Used in server.js for global arena):

Location: `server.js` lines 102-107

```javascript
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
function getPlayerColor(username) {
  const hash = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PLAYER_COLORS[hash % PLAYER_COLORS.length];  // <-- HEX FORMAT
}
```

### Where Color is Applied

When joining global arena (server.js line 3297-3300):
```javascript
globalGameState.addPlayer(client.username, client.username, {
  color: getPlayerColor(client.username),  // Hex color passed here
  ...ghostProperties
});
```

### Client Color Handling

The renderer (`ghost-orbits-renderer.js`) supports BOTH formats in the `lighten()` function (lines 99-124):
- HSL: `hsl(h, s%, l%)` - parsed via regex
- Hex: `#rrggbb` - parsed via parseInt

**IMPORTANT**: The Player class uses profile.color if provided, otherwise generates HSL:
```javascript
// arena-game-state.js line 125
this.color = color || this.generateColor(username);
```

So colors should be **hex** when joining via global_arena_join, because `getPlayerColor()` returns hex.

---

## Position Coordinate Systems

### Server Coordinate System

- **Origin**: Top-left (0, 0)
- **Units**: Pixels
- **Arena Size**: Dynamically calculated based on player count

```javascript
// arena-game-state.js line 301-305
calculateArenaSize(playerCount) {
  const count = Math.max(1, playerCount);
  return Math.floor(
    ARENA_CONFIG.BASE_ARENA_SIZE * (1 + Math.sqrt(count) * ARENA_CONFIG.ARENA_SCALE_FACTOR)
  );
}
```

**Base values**:
- `BASE_ARENA_SIZE`: 800
- `ARENA_SCALE_FACTOR`: 0.3

For 1 player: `800 * (1 + 1 * 0.3) = 1040` pixels
For 2 players: `800 * (1 + 1.41 * 0.3) = 1138` pixels

### Orbit Coordinates

Orbits are concentric circles centered in the arena:

```javascript
// arena-game-state.js lines 344-359
initializeOrbits(playerCount) {
  const orbitCount = this.calculateOrbitCount(playerCount);
  const centerX = this.arenaSize / 2;
  const centerY = this.arenaSize / 2;
  const maxRadius = this.arenaSize * ARENA_CONFIG.MAX_ORBIT_RADIUS_FACTOR; // 0.4
  const minRadius = ARENA_CONFIG.MIN_ORBIT_RADIUS; // 80

  for (let i = 0; i < orbitCount; i++) {
    const t = orbitCount > 1 ? i / (orbitCount - 1) : 0.5;
    const radius = minRadius + t * (maxRadius - minRadius);
    const orbit = new Orbit(i, centerX, centerY, radius);
    this.orbits.push(orbit);
  }
}
```

### Player Position Updates

Players on orbits have position calculated from angle:

```javascript
// arena-game-state.js lines 651-668
updatePlayer(player, deltaTime) {
  if (player.orbiting) {
    const orbit = this.orbits[player.orbitIndex];
    const angularSpeed = ARENA_CONFIG.ANGULAR_SPEED * player.orbitalSpeedMultiplier;
    const direction = player.clockwise ? -1 : 1;
    player.orbitAngle += direction * angularSpeed * deltaTime;

    // Update position from orbit
    const pos = orbit.getPositionAtAngle(player.orbitAngle);
    player.x = pos.x;
    player.y = pos.y;
  }
}
```

### Client Coordinate Expectations

The client renderer expects standard canvas coordinates:
- Origin: Top-left (0, 0)
- Positive X: Right
- Positive Y: Down

**This matches the server** - no coordinate conversion needed.

---

## Dot Generation and Tracking

### Initial Dot Generation

Location: `arena-game-state.js` lines 365-384

```javascript
initializeDots(playerCount) {
  this.dots.clear();
  const dotCount = this.calculateDotCount(playerCount);
  // Formula: 30 + (playerCount * 15)

  const dotsPerOrbit = Math.ceil(dotCount / this.orbits.length);

  let dotId = 0;
  for (let orbitIndex = 0; orbitIndex < this.orbits.length; orbitIndex++) {
    const orbit = this.orbits[orbitIndex];
    const dotsOnThisOrbit = Math.min(dotsPerOrbit, dotCount - dotId);

    for (let j = 0; j < dotsOnThisOrbit && dotId < dotCount; j++) {
      const angle = (j / dotsOnThisOrbit) * Math.PI * 2;
      const pos = orbit.getPositionAtAngle(angle);

      const dot = new Dot(`dot_${dotId}`, pos.x, pos.y, orbitIndex);
      this.dots.set(dot.id, dot);
      dotId++;
    }
  }
}
```

### Dot Data Format

Server Dot.toJSON() (lines 220-229):

```javascript
toJSON() {
  return {
    id: this.id,           // "dot_0", "dot_1", etc.
    x: this.x,             // Number (pixels)
    y: this.y,             // Number (pixels)
    orbitIndex: this.orbitIndex,
    owner: this.owner,     // playerId or null
    state: this.state,     // "neutral" or "claimed"
  };
}
```

### Delta State Dot Format

In delta updates, only changed dots are sent with minimal data:

```javascript
recentDots[id] = {
  owner: dot.owner,
  state: dot.state,
};
```

**ISSUE IDENTIFIED**: Delta state dots don't include `x` and `y` coordinates!

---

## WebSocket Message Formats

### arena_joined Response

Sent when player successfully joins (server.js lines 3307-3315):

```javascript
ws.send(JSON.stringify({
  type: 'arena_joined',
  bet: entryResult.bet,
  newGoldStars: entryResult.newGoldStars,
  newPoints: entryResult.newPoints,
  pot: getPot(),
  gameState: globalGameState.getGameState()  // Full state here
}));
```

**gameState** contains:
```javascript
{
  arenaId: "arena_xxx",
  arenaSize: 1040,
  isRunning: true,
  players: {
    "username": {
      id: "username",
      username: "username",
      color: "#FF6B6B",      // Hex from getPlayerColor()
      x: 520,
      y: 200,
      vx: 0.5,
      vy: -0.3,
      orbitIndex: 0,
      orbitAngle: 1.57,
      orbiting: true,
      clockwise: true,
      dotCount: 0,
      lives: 3,
      isGhost: false,
      isAlive: true,
      claimRadius: 1.0
    }
  },
  dots: {
    "dot_0": {
      id: "dot_0",
      x: 400,
      y: 300,
      orbitIndex: 0,
      owner: null,
      state: "neutral"
    }
  },
  orbits: [
    { id: 0, cx: 520, cy: 520, radius: 80 },
    { id: 1, cx: 520, cy: 520, radius: 160 }
  ],
  playerCount: 1,
  aliveCount: 1
}
```

### game_state Tick Updates

Sent every ~33ms (30fps), server.js lines 120-125:

```javascript
setInterval(() => {
  if (globalGameState.getPlayerCount() > 0) {
    globalGameState.tick();
    const state = globalGameState.getDeltaState();
    state.pot = getPot();
    broadcastToGlobalArena({ type: 'game_state', ...state });
  }
}, 1000 / 30);
```

**Delta state format**:
```javascript
{
  type: 'game_state',
  arenaId: "arena_xxx",
  tick: 1706500000000,
  players: {
    "username": {
      x: 525.3,
      y: 198.7,
      vx: 0.48,
      vy: -0.31,
      orbitAngle: 1.62,
      orbiting: true,
      dotCount: 2,
      lives: 3,
      isAlive: true
    }
  },
  dots: {
    "dot_5": {
      owner: "username",
      state: "claimed"
    }
  },
  pot: 50.0
}
```

---

## Broadcast Timing

### Global Arena Game Loop

Location: `server.js` lines 119-133

- **Tick Rate**: 30 fps (every ~33ms)
- **Broadcasts**: Every tick when players > 0
- **Message Type**: `game_state` (delta updates)

```javascript
setInterval(() => {
  if (globalGameState.getPlayerCount() > 0) {
    globalGameState.tick();
    const state = globalGameState.getDeltaState();
    state.pot = getPot();
    broadcastToGlobalArena({ type: 'game_state', ...state });

    // Check win condition
    const winner = globalGameState.checkWinCondition();
    if (winner) {
      handleGlobalArenaWin(winner);
    }
  }
}, 1000 / 30);
```

### Potential Timing Issues

1. **First tick race condition**: The game loop starts before player is fully added
2. **Delta dots missing x/y**: After initial state, dots only send owner/state
3. **Client interpolation delay**: 100ms buffer may cause visual lag

---

## Client Expectations vs Server Output

### Controller Data Flow

The client (`ghost-orbits-controller.js`) processes state through `applyServerState()`:

```javascript
// ghost-orbits-controller.js lines 334-387
applyServerState(state) {
  // Update arena size
  if (state.arenaSize) {
    this.serverState.arenaSize = state.arenaSize;
  }

  // Update orbits
  if (state.orbits) {
    this.serverState.orbits = state.orbits;
  }

  // Update players with interpolation
  if (state.players) {
    for (const [id, playerData] of Object.entries(state.players)) {
      this.serverState.players[id] = {
        ...this.serverState.players[id],
        ...playerData
      };
    }
  }

  // Update dots
  if (state.dots) {
    for (const [id, dotData] of Object.entries(state.dots)) {
      this.serverState.dots[id] = {
        ...this.serverState.dots[id],
        ...dotData
      };
    }
  }
}
```

### Renderer Data Expectations

The renderer expects this format from `_updateRenderer()` (lines 1197-1254):

**Ghosts array**:
```javascript
{
  id: string,
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string,     // Hex OR HSL supported
  energy: number,
  tier: number
}
```

**Dots array**:
```javascript
{
  id: string,
  x: number,          // REQUIRED
  y: number,          // REQUIRED
  radius: number,
  state: 'NEUTRAL' | 'CLAIMED',
  ownerColor: string | null,
  pulsePhase: number
}
```

---

## Identified Mismatches

### 1. DOT COORDINATES IN DELTA UPDATES

**Problem**: Delta state dots don't include `x` and `y` coordinates.

Server sends:
```javascript
recentDots[id] = {
  owner: dot.owner,
  state: dot.state,
};
```

Client needs:
```javascript
{
  id, x, y, radius, state, ownerColor, pulsePhase
}
```

**Impact**: After initial state, dots disappear because they lose their coordinates.

**Fix needed in `arena-game-state.js` getDeltaState()**:
```javascript
recentDots[id] = {
  x: dot.x,           // ADD THIS
  y: dot.y,           // ADD THIS
  owner: dot.owner,
  state: dot.state,
};
```

### 2. DOT STATE VALUE CASE

**Server sends**: `"neutral"` or `"claimed"` (lowercase)
**Client expects**: `'NEUTRAL'` or `'CLAIMED'` (uppercase in renderDots())

The controller does convert this (line 1231):
```javascript
state: dot.state === 'claimed' ? 'CLAIMED' : 'NEUTRAL',
```

This is handled correctly.

### 3. MISSING COLOR IN DELTA PLAYER UPDATES

**Server delta players don't include color**:
```javascript
players[id] = {
  x, y, vx, vy, orbitAngle, orbiting, dotCount, lives, isAlive
  // NO COLOR!
};
```

The client uses spread to merge with existing state, so color should persist from initial state. However, if a player joins mid-game and another client receives only delta updates, they won't have that player's color.

**Fix needed in `arena-game-state.js` getDeltaState()**:
```javascript
players[id] = {
  x: player.x,
  y: player.y,
  color: player.color,  // ADD THIS
  // ... rest
};
```

### 4. PLAYER ID FORMAT

Server uses **username** as player ID:
```javascript
// server.js line 3297
globalGameState.addPlayer(client.username, client.username, {...});
```

This should be consistent with client expectations, which also use username as ID.

### 5. DOT RADIUS NOT SENT

Server dots don't include radius:
```javascript
// Dot.toJSON() - no radius property
```

Client hardcodes `radius: 10` in `_updateRenderer()` (line 1230).

Server config has: `DOT_RADIUS: 10` (arena-game-state.js line 23)

These match, so this isn't a bug, but could cause issues if config changes.

### 6. INITIAL DOT COORDINATES STORED BUT NOT REFRESHED

Full state is sent on join, but subsequent delta updates only refresh dots that were recently claimed. Dots that were never claimed lose their coordinates when merged with delta data that lacks x/y.

---

## Recommendations

### Critical Fixes

1. **Include dot coordinates in delta state**:
   ```javascript
   // arena-game-state.js getDeltaState()
   recentDots[id] = {
     x: dot.x,
     y: dot.y,
     owner: dot.owner,
     state: dot.state,
   };
   ```

2. **Include player color in delta state**:
   ```javascript
   players[id] = {
     x: player.x,
     y: player.y,
     color: player.color,
     // ...
   };
   ```

3. **Send full dot state periodically** (every N ticks) to ensure state consistency.

### Debug Logging

Add these logs to trace data flow:

**Server** (arena-game-state.js):
```javascript
getGameState() {
  console.log('[ArenaGameState] getGameState - dots:', this.dots.size, 'players:', this.players.size);
  // ...
}
```

**Client** (ghost-orbits-controller.js):
```javascript
applyServerState(state) {
  console.log('[GhostOrbits] applyServerState - dots:', Object.keys(state.dots || {}).length);
  // ...
}
```

### Testing Steps

1. Join arena with one player
2. Check console for "Initial gameState received" log
3. Verify dots have x/y coordinates in initial state
4. Check that dots array is populated in `_updateRenderer()`
5. Verify renderer's `territoryDots` array is not empty
6. Check canvas is in DOM and has correct dimensions

---

## File Reference Quick Links

| File | Purpose |
|------|---------|
| `railway-server/arena-game-state.js` | Server game state, physics, dots |
| `railway-server/server.js` | WebSocket handling, broadcasting |
| `railway-server/arena-manager.js` | Player connection management |
| `railway-server/ghost-orbits-manager.js` | Cartridge-specific arenas (not used for global) |
| `platform/game/ghost-orbits-controller.js` | Client state management |
| `platform/core/ghost-orbits-renderer.js` | Client rendering |
