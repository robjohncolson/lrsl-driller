# Ghost Orbits Multiplayer - Data Flow Debug Analysis

This document traces the complete data flow from server to pixels on screen for the Ghost Orbits multiplayer arena rendering system.

---

## High-Level Architecture

```
SERVER (Railway)                          CLIENT (Browser)
================                          ================

ArenaGameState                            GhostOrbitsController
     |                                           |
     v                                           v
getDeltaState() -----> WebSocket -----> _handleWebSocketMessage()
getGameState()         broadcast                 |
     |                                           v
     v                                    applyServerState()
{players, dots, orbits}                          |
                                                 v
                                          _updateRenderer()
                                                 |
                                                 v
                                         GhostOrbitsRenderer
                                                 |
                                                 v
                                           updateState()
                                           updateDots()
                                                 |
                                                 v
                                             render()
                                                 |
                                                 v
                                           Canvas 2D API
```

---

## 1. Server State Generation

### File: `railway-server/arena-game-state.js`

### Player.toJSON() (line ~166)
```javascript
toJSON() {
  return {
    id: this.id,
    username: this.username,
    color: this.color,
    x: this.x,
    y: this.y,
    vx: this.vx,
    vy: this.vy,
    orbitIndex: this.orbitIndex,
    orbitAngle: this.orbitAngle,
    orbiting: this.orbiting,
    clockwise: this.clockwise,
    dotCount: this.dots.size,
    lives: this.lives,
    isGhost: this.isGhost,
    isAlive: this.isAlive,
    claimRadius: this.claimRadius,
  };
}
```

### Dot.toJSON() (line ~220)
```javascript
toJSON() {
  return {
    id: this.id,
    x: this.x,
    y: this.y,
    orbitIndex: this.orbitIndex,
    owner: this.owner,
    state: this.state,  // 'neutral' or 'claimed'
  };
}
```

### Orbit.toJSON() (line ~251)
```javascript
toJSON() {
  return {
    id: this.id,
    cx: this.cx,
    cy: this.cy,
    radius: this.radius,
  };
}
```

### getGameState() - Full State (line ~955)
Called when player first joins arena. Returns:
```javascript
{
  arenaId: string,
  arenaSize: number,        // e.g., 800
  isRunning: boolean,
  players: { [id]: Player.toJSON() },
  dots: { [id]: Dot.toJSON() },
  orbits: Orbit.toJSON()[],
  playerCount: number,
  aliveCount: number,
}
```

### getDeltaState() - Incremental Updates (line ~981)
Called every tick (30 fps). Returns minimal state:
```javascript
{
  arenaId: string,
  tick: number,             // timestamp
  players: {
    [id]: {
      x, y, vx, vy,
      orbitAngle, orbiting,
      dotCount, lives, isAlive
      // NOTE: Missing username, color - only position data
    }
  },
  dots: {
    // Only recently changed dots (within 2 tick intervals)
    [id]: { owner, state }
    // NOTE: Missing x, y coordinates!
  }
}
```

**POTENTIAL ISSUE #1**: Delta state dots are missing `x, y` coordinates. If client only has delta data (no initial full state with positions), dots cannot be rendered.

---

## 2. Server WebSocket Broadcast

### File: `railway-server/server.js`

### Game Loop (line ~119)
```javascript
setInterval(() => {
  if (globalGameState.getPlayerCount() > 0) {
    globalGameState.tick();
    const state = globalGameState.getDeltaState();
    state.pot = getPot();
    broadcastToGlobalArena({ type: 'game_state', ...state });
    // ...
  }
}, 1000 / 30);  // 30 fps
```

### broadcastToGlobalArena() (line ~110)
```javascript
function broadcastToGlobalArena(message) {
  const payload = JSON.stringify(message);
  for (const [ws, data] of clients) {
    if (ws.readyState === 1 && data.globalArena) {
      ws.send(payload);
    }
  }
}
```

### On Player Join (line ~3307)
```javascript
ws.send(JSON.stringify({
  type: 'arena_joined',
  bet: entryResult.bet,
  newGoldStars: entryResult.newGoldStars,
  newPoints: entryResult.newPoints,
  pot: getPot(),
  gameState: globalGameState.getGameState()  // FULL state with dots x,y
}));
```

**Message Types Broadcast:**
- `arena_joined` - Contains full `gameState` with complete dot coordinates
- `game_state` - Delta updates (30 fps) - dots missing x,y coordinates!
- `player_joined` - New player notification
- `player_left` - Player disconnect
- `player_eliminated` - Player lost all lives
- `arena_winner` - Game ended

---

## 3. Controller WebSocket Receive & Process

### File: `platform/game/ghost-orbits-controller.js`

### _handleWebSocketMessage() (line ~650)
```javascript
_handleWebSocketMessage(data) {
  const message = JSON.parse(data);

  switch (message.type) {
    case 'arena_joined':
      this._handleArenaJoined(message);
      break;
    case 'arena_state':
    case 'game_state':
      this._handleArenaState(message);  // Both go to same handler
      break;
    case 'arena_delta':
    case 'game_delta':
      this._handleArenaDelta(message);  // Both go to same handler
      break;
    // ...
  }
}
```

### _handleArenaJoined() (line ~728)
```javascript
_handleArenaJoined(message) {
  this.playerId = message.playerId;
  // ...
  if (message.gameState) {
    this.applyServerState(message.gameState);
  }
  // Transition to PLAYING or WAITING state
}
```

### _handleArenaState() & _handleArenaDelta() (line ~808, ~817)
```javascript
_handleArenaState(message) {
  this.applyServerState(message);  // Direct passthrough
}

_handleArenaDelta(message) {
  this.applyServerState(message);  // Same handler
}
```

### applyServerState() (line ~334)
```javascript
applyServerState(state) {
  // Update arenaSize, playerCount, aliveCount
  if (state.arenaSize) this.serverState.arenaSize = state.arenaSize;

  // Update orbits
  if (state.orbits) this.serverState.orbits = state.orbits;

  // Update players with interpolation
  if (state.players) {
    for (const [id, playerData] of Object.entries(state.players)) {
      // Store previous state for interpolation
      const prevPlayer = this.serverState.players[id];
      if (prevPlayer) {
        this.interpolationBuffer.set(id, { prev, next, timestamp });
      }
      // MERGE with existing data (preserves username, color from initial state)
      this.serverState.players[id] = {
        ...this.serverState.players[id],
        ...playerData
      };
    }
  }

  // Update dots - MERGES with existing
  if (state.dots) {
    for (const [id, dotData] of Object.entries(state.dots)) {
      this.serverState.dots[id] = {
        ...this.serverState.dots[id],  // Preserves x,y from initial state
        ...dotData                      // Updates owner, state
      };
    }
  }

  this._updatePanelFromState();
}
```

**KEY INSIGHT**: Dots are merged with spread operator. If initial state has x,y and delta has owner/state, the merge preserves positions. BUT if dots are added after initial join, they won't have positions.

---

## 4. Controller Updates Renderer

### File: `platform/game/ghost-orbits-controller.js`

### _renderLoop() (line ~1157)
```javascript
_renderLoop() {
  const now = performance.now();
  const deltaTime = (now - this._lastRenderTime) / 1000;
  this._lastRenderTime = now;

  this._interpolatePositions(now);  // Smooth player movement

  if (this.renderer) {
    this._updateRenderer();
  }

  this._animationFrameId = requestAnimationFrame(() => this._renderLoop());
}
```

### _updateRenderer() (line ~1197)
```javascript
_updateRenderer() {
  // Convert players to ghost format
  const ghosts = [];
  for (const [id, player] of Object.entries(this.serverState.players)) {
    if (!player.isAlive) continue;

    ghosts.push({
      id,
      x: player.renderX ?? player.x,  // Use interpolated position
      y: player.renderY ?? player.y,
      vx: player.vx || 0,
      vy: player.vy || 0,
      color: player.color || this._generateFallbackColor(id),
      energy: 100,
      tier: 1
    });
  }

  // Convert dots
  const dots = [];
  for (const [id, dot] of Object.entries(this.serverState.dots)) {
    const ownerColor = dot.owner ?
      (this.serverState.players[dot.owner]?.color || ...) : null;

    dots.push({
      id,
      x: dot.x,      // <-- CRITICAL: If x is undefined, rendering fails silently
      y: dot.y,      // <-- CRITICAL: If y is undefined, rendering fails silently
      radius: 10,
      state: dot.state === 'claimed' ? 'CLAIMED' : 'NEUTRAL',
      ownerColor: ownerColor,
      pulsePhase: (Date.now() / 500) % (Math.PI * 2)
    });
  }

  // Call renderer methods
  this.renderer.updateState({ ghosts });
  this.renderer.updateDots(dots);
}
```

**POTENTIAL ISSUE #2**: If `dot.x` or `dot.y` is undefined (from delta-only updates), dots array will contain objects with `x: undefined, y: undefined`. The renderer won't crash but won't draw visible dots.

---

## 5. Renderer Internal State Updates

### File: `platform/core/ghost-orbits-renderer.js`

### updateState() (line ~1472)
```javascript
updateState(state) {
  if (!state) return;

  // Update ghosts from server state
  if (state.ghosts) {
    // Remove ghosts not in server state
    const serverGhostIds = new Set(state.ghosts.map(g => g.id));
    for (const [id] of this.ghosts) {
      if (!serverGhostIds.has(id)) {
        this.removeGhost(id);
      }
    }

    // Update or add ghosts
    for (const ghostData of state.ghosts) {
      let ghost = this.ghosts.get(ghostData.id);
      if (ghost) {
        // Update existing ghost position
        ghost.position.x = ghostData.x;
        ghost.position.y = ghostData.y;
        if (ghostData.vx !== undefined) ghost.velocity.x = ghostData.vx;
        if (ghostData.vy !== undefined) ghost.velocity.y = ghostData.vy;
      } else {
        // Add new ghost
        const newGhost = this.addGhost({ ... }, isLocal);
      }
    }
  }
}
```

**Internal State:**
- `this.ghosts` - Map<string, Ghost>
- Ghost objects have `position: {x, y}`, `velocity: {x, y}`, `color`, etc.

### updateDots() (line ~2062)
```javascript
updateDots(dots) {
  this.territoryDots = dots || [];
}
```

**Internal State:**
- `this.territoryDots` - Array of dot objects for rendering

---

## 6. Renderer Canvas Drawing

### File: `platform/core/ghost-orbits-renderer.js`

### render() (line ~932)
Main render function called by update loop:
```javascript
render() {
  const ctx = this.ctx;
  const size = this.arena.size;

  // Clear
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, size, size);

  this.renderGrid();
  this.renderTerritory();
  this.renderVoidZone();
  this.renderGravityWells();
  this.renderDots();         // <-- Renders territoryDots
  this.renderGhosts();       // <-- Renders ghosts Map
}
```

### renderGhosts() (line ~1299)
```javascript
renderGhosts() {
  if (this.ghosts.size === 0) {
    console.log('[Renderer] renderGhosts: No ghosts in map');
  }
  for (const ghost of this.ghosts.values()) {
    this.renderGhost(ghost);
  }
}
```

### renderGhost() (line ~1315)
```javascript
renderGhost(ghost) {
  const ctx = this.ctx;
  const { x, y } = ghost.position;
  const radius = ghost.radius;

  // Validate
  if (!isFinite(x) || !isFinite(y) || !isFinite(radius) || radius <= 0) {
    console.warn('[Renderer] Invalid ghost position/radius');
    return;  // <-- Silently skips invalid ghosts
  }

  // Draw glow gradient
  const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
  gradient.addColorStop(0, displayColor);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw core body
  ctx.fillStyle = displayColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // ... border, energy indicator, etc.
}
```

### renderDots() (line ~2075)
```javascript
renderDots() {
  if (!this.territoryDots || this.territoryDots.length === 0) {
    console.log('[Renderer] renderDots: No territory dots');
    return;
  }

  for (const dot of this.territoryDots) {
    const { x, y, radius, pulsePhase, state, ownerColor } = dot;

    // NOTE: No validation for undefined x,y!
    // If x or y is undefined, arc() will draw at (0,0) or not at all

    const isNeutral = state === 'NEUTRAL';
    const dotColor = isNeutral ? '#aabbcc' : (ownerColor || '#ffffff');

    // Draw glow
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, visualRadius * glowSize);
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, visualRadius * glowSize, 0, Math.PI * 2);  // <-- Uses x, y directly
    ctx.fill();

    // Draw dot body
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(x, y, visualRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

**POTENTIAL ISSUE #3**: renderDots() does NOT validate x, y coordinates. If they are `undefined`, `NaN`, or invalid numbers, the canvas arc() call may:
- Draw at (0, 0) - all dots pile up in corner
- Throw no error but draw nothing visible
- Create malformed gradients that appear invisible

---

## Data Flow Summary Table

| Step | Location | Input | Output | Potential Failure |
|------|----------|-------|--------|-------------------|
| 1 | ArenaGameState.tick() | Game physics | Updated player/dot positions | N/A |
| 2 | getDeltaState() | Player/Dot Maps | Delta JSON | **Dots missing x,y** |
| 3 | broadcastToGlobalArena() | Delta JSON | WebSocket message | N/A |
| 4 | _handleWebSocketMessage() | Raw message | Parsed JSON | Parse error |
| 5 | applyServerState() | Parsed state | serverState update | **Dots not merged if new** |
| 6 | _updateRenderer() | serverState | ghosts[], dots[] arrays | **Dots with undefined x,y** |
| 7 | updateState() | ghosts[] | this.ghosts Map | Ghost add failure |
| 8 | updateDots() | dots[] | this.territoryDots array | N/A |
| 9 | renderGhosts() | this.ghosts | Canvas draw calls | Ghost validation skips bad |
| 10 | renderDots() | this.territoryDots | Canvas draw calls | **No x,y validation** |

---

## Identified Issues

### Issue #1: Delta State Missing Dot Coordinates
**Location**: `arena-game-state.js` getDeltaState() line ~999

**Problem**: Delta updates only include `{ owner, state }` for dots, not `{ x, y, owner, state }`.

**Impact**: If initial full state is not received or dots are created after join, dots have no position data.

**Fix Options**:
1. Always include x, y in delta dot updates
2. Send full dot data in delta for any dot that changed
3. Client requests full state if dot missing coordinates

### Issue #2: New Dots Created After Join Have No Position
**Location**: `ghost-orbits-controller.js` applyServerState() line ~377

**Problem**: Spread merge only works if the dot already exists in serverState.dots with x,y. New dots from delta will only have owner/state.

**Impact**: Any dots created after a player joins will render at undefined positions.

**Fix Options**:
1. Server sends full dot data when dot is first claimed
2. Include x, y in every delta dot update
3. Client maintains separate position cache from initial state

### Issue #3: No Coordinate Validation in renderDots()
**Location**: `ghost-orbits-renderer.js` renderDots() line ~2075

**Problem**: Unlike renderGhost() which validates coordinates, renderDots() does not check if x, y are valid numbers.

**Impact**: Dots with undefined/NaN coordinates fail silently.

**Fix Options**:
1. Add coordinate validation: `if (!isFinite(x) || !isFinite(y)) return;`
2. Log warning for invalid dot coordinates
3. Render invalid dots at a debug position (e.g., corner with red color)

### Issue #4: Canvas Not in DOM During First Render
**Location**: `ghost-orbits-panel.js` showGameView() line ~494

**Problem**: Panel re-renders DOM (removing old overlay) then re-mounts canvas. There may be a race condition where render loop runs before canvas is back in DOM.

**Impact**: Canvas draw calls succeed but are not visible because canvas is detached.

**Fix Options**:
1. Stop render loop before DOM recreation, restart after canvas mounted
2. Check `document.body.contains(this.canvas)` before rendering
3. Queue renders until canvas confirmed in DOM

---

## Debug Logging Points

The codebase has several debug logs that should fire if data is flowing:

1. **Controller - First render log** (~line 1238):
```javascript
console.log('[GhostOrbits] First render - ghosts:', ghosts.length, 'dots:', dots.length);
```

2. **Renderer - Canvas status** (~line 939):
```javascript
console.log('[Renderer] render() - canvas in DOM:', inDOM, 'ghosts:', this.ghosts.size, 'dots:', this.territoryDots?.length);
```

3. **Renderer - updateState first update** (~line 1477):
```javascript
console.log('[Renderer] updateState receiving ghosts:', state.ghosts.length);
```

4. **Renderer - updateDots first update** (~line 2064):
```javascript
console.log('[Renderer] updateDots received:', dots.length, 'dots');
```

5. **Renderer - No ghosts warning** (~line 1301):
```javascript
console.log('[Renderer] renderGhosts: No ghosts in map');
```

6. **Renderer - No dots warning** (~line 2079):
```javascript
console.log('[Renderer] renderDots: No territory dots');
```

---

## Recommended Debugging Steps

1. **Check browser console for logs**:
   - If "First render - ghosts: 0, dots: 0" - data not reaching controller
   - If ghosts > 0 but dots = 0 - dot data issue
   - If both > 0 but nothing visible - canvas/DOM issue

2. **Check WebSocket messages** (Network tab):
   - Look for `arena_joined` message - should have full gameState
   - Look for `game_state` messages at 30fps - check dots content
   - Verify dots in messages have x, y coordinates

3. **Add debug log in applyServerState()**:
```javascript
console.log('[DEBUG] applyServerState dots:', Object.values(state.dots || {})[0]);
```

4. **Add validation in renderDots()**:
```javascript
if (typeof x !== 'number' || typeof y !== 'number') {
  console.error('[DEBUG] Dot missing coordinates:', dot);
  continue;
}
```

5. **Verify canvas is visible**:
```javascript
console.log('[DEBUG] Canvas:', {
  inDOM: document.body.contains(this.canvas),
  width: this.canvas.width,
  height: this.canvas.height,
  parent: this.canvas.parentNode?.className
});
```

---

## Quick Reference: Key File Locations

| Component | File | Key Lines |
|-----------|------|-----------|
| Server Game State | `railway-server/arena-game-state.js` | 955-1018 |
| Server Broadcast | `railway-server/server.js` | 110-125, 3307-3325 |
| Controller WebSocket | `platform/game/ghost-orbits-controller.js` | 650-720 |
| Controller State Update | `platform/game/ghost-orbits-controller.js` | 334-387 |
| Controller to Renderer | `platform/game/ghost-orbits-controller.js` | 1197-1255 |
| Renderer State Update | `platform/core/ghost-orbits-renderer.js` | 1472-1535 |
| Renderer Dots Update | `platform/core/ghost-orbits-renderer.js` | 2062-2068 |
| Renderer Ghost Draw | `platform/core/ghost-orbits-renderer.js` | 1299-1417 |
| Renderer Dot Draw | `platform/core/ghost-orbits-renderer.js` | 2075-2139 |
| Panel Canvas Mount | `platform/game/ghost-orbits-panel.js` | 142-161, 1723-1724 |
