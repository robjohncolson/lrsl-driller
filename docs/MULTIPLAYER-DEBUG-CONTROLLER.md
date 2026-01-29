# Ghost Orbits Multiplayer Debug: Controller Analysis

## Overview

This document analyzes the data flow from WebSocket messages through the controller to the renderer, identifying potential failure points in the Ghost Orbits multiplayer rendering system.

**Files Analyzed:**
- `platform/game/ghost-orbits-controller.js` (1479 lines)
- `platform/core/ghost-orbits-renderer.js` (2194 lines)
- `platform/game/ghost-orbits-panel.js` (2000+ lines)

---

## 1. WebSocket Message Handling

### `_handleWebSocketMessage()` (Line 650-721)

The controller processes these message types:

| Message Type | Handler | Description |
|--------------|---------|-------------|
| `arena_joined` | `_handleArenaJoined()` | Initial join confirmation with game state |
| `arena_state` / `game_state` | `_handleArenaState()` | Full state sync |
| `arena_delta` / `game_delta` | `_handleArenaDelta()` | Incremental state update |
| `player_joined` | `_handlePlayerJoined()` | New player notification |
| `player_left` | `_handlePlayerLeft()` | Player disconnect |
| `player_eliminated` | `_handlePlayerEliminated()` | Player lost all lives |
| `arena_winner` | `_handleArenaWinner()` | Game over, winner announced |
| `countdown` | `_handleCountdown()` | 3-2-1-GO sequence |
| `round_start` | `_handleRoundStart()` | Round begins |
| `round_end` | `_handleRoundEnd()` | Round ends |
| `arena_entry_failed` | `_handleEntryFailed()` | Join rejected |
| `error` | `_handleServerError()` | Server error |

### POTENTIAL ISSUE #1: Message Type Aliasing

```javascript
case 'arena_state':
case 'game_state':
  this._handleArenaState(message);
  break;
```

The server might be sending `game_state` but the handlers may expect different data structures. Both call `applyServerState(message)` which expects:
- `message.players` (Object, keyed by player ID)
- `message.dots` (Object, keyed by dot ID)
- `message.orbits` (Array)
- `message.arenaSize` (Number)

---

## 2. `game_state` Message Processing

### `_handleArenaJoined()` (Line 728-781)

When the player joins, the handler receives initial state:

```javascript
if (message.gameState) {
  console.log('[GhostOrbits] Initial gameState received:', {
    isRunning: message.gameState.isRunning,
    playerCount: Object.keys(message.gameState.players || {}).length,
    dotCount: Object.keys(message.gameState.dots || {}).length,
    orbitCount: message.gameState.orbits?.length || 0,
    arenaSize: message.gameState.arenaSize,
    sampleDot: Object.values(message.gameState.dots || {})[0]
  });
  this.applyServerState(message.gameState);
} else {
  console.warn('[GhostOrbits] No gameState in arena_joined message!');
}
```

### POTENTIAL ISSUE #2: gameState Location

The `arena_joined` message expects `message.gameState` to contain the state object. If the server sends the state directly on the message root, it won't be processed.

### `applyServerState()` (Line 334-387)

This method updates `this.serverState` with server data:

```javascript
applyServerState(state) {
  // Update arena configuration
  if (state.arenaSize) {
    this.serverState.arenaSize = state.arenaSize;
  }

  // Update orbits
  if (state.orbits) {
    this.serverState.orbits = state.orbits;
  }

  // Update players with interpolation buffer
  if (state.players) {
    for (const [id, playerData] of Object.entries(state.players)) {
      // Store previous position for interpolation
      // Update current state
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

### POTENTIAL ISSUE #3: Data Format Mismatch

The method expects:
- `state.players` as an **Object** (keyed by player ID)
- `state.dots` as an **Object** (keyed by dot ID)

If the server sends **Arrays** instead:
```javascript
{ players: [{id: 'p1', x: 100, y: 200}, ...] }  // WRONG - Array
{ players: {'p1': {x: 100, y: 200}, ...} }      // CORRECT - Object
```

The `Object.entries()` call on an Array would work but with numeric indices, not player IDs.

---

## 3. Render Loop Analysis

### `_startRenderLoop()` (Line 1125-1135)

```javascript
_startRenderLoop() {
  if (this._animationFrameId) return;  // Already running

  this._lastRenderTime = performance.now();
  this._renderLoop();  // Start controller's loop

  if (this.renderer) {
    this.renderer.setServerAuthoritative(true);  // CRITICAL: Disables local physics
    this.renderer.start();  // Start renderer's own loop
  }
}
```

### POTENTIAL ISSUE #4: Dual Render Loops

Both the controller AND the renderer have their own animation frame loops:

**Controller's loop** (`_renderLoop()` at line 1157):
```javascript
_renderLoop() {
  const now = performance.now();
  const deltaTime = (now - this._lastRenderTime) / 1000;
  this._lastRenderTime = now;

  this._interpolatePositions(now);

  if (this.renderer) {
    this._updateRenderer();  // Converts server state -> renderer format
  }

  this._animationFrameId = requestAnimationFrame(() => this._renderLoop());
}
```

**Renderer's loop** (`update()` at line 836):
```javascript
update(currentTime) {
  if (!this.isRunning) return;

  const deltaTime = (currentTime - this.lastFrameTime) / 1000;
  this.lastFrameTime = currentTime;

  this.animationTime += deltaTime;
  this.processInput();
  this.updatePhysics(deltaTime, currentTime);  // SKIPPED when serverAuthoritative=true
  this.arena.updateTrails();
  this.render();  // Actually draws to canvas

  this.animationFrameId = requestAnimationFrame(this.update);
}
```

This is actually **CORRECT** - the controller's loop feeds data to the renderer, and the renderer's loop does the actual drawing. However, if either loop isn't started, nothing renders.

---

## 4. How Ghosts Are Added to Renderer

### `_updateRenderer()` (Line 1197-1255)

This is the **critical bridge** between server state and renderer:

```javascript
_updateRenderer() {
  if (!this.renderer) {
    console.warn('[GhostOrbits] _updateRenderer called but no renderer');
    return;
  }

  // Convert server players to ghost format
  const ghosts = [];
  for (const [id, player] of Object.entries(this.serverState.players)) {
    if (!player.isAlive) continue;

    ghosts.push({
      id,
      x: player.renderX ?? player.x,  // Uses interpolated position if available
      y: player.renderY ?? player.y,
      vx: player.vx || 0,
      vy: player.vy || 0,
      color: player.color || this._generateFallbackColor(id),
      energy: 100,
      tier: 1
    });
  }

  // Convert dots to format for renderer
  const dots = [];
  for (const [id, dot] of Object.entries(this.serverState.dots)) {
    const ownerColor = dot.owner ?
      (this.serverState.players[dot.owner]?.color || this._generateFallbackColor(dot.owner)) :
      null;
    dots.push({
      id,
      x: dot.x,
      y: dot.y,
      radius: 10,
      state: dot.state === 'claimed' ? 'CLAIMED' : 'NEUTRAL',
      ownerColor: ownerColor,
      pulsePhase: (Date.now() / 500) % (Math.PI * 2)
    });
  }

  // DEBUG LOGGING (first render only)
  if (!this._hasLoggedRender) {
    console.log('[GhostOrbits] First render - ghosts:', ghosts.length, 'dots:', dots.length);
    if (ghosts.length > 0) console.log('[GhostOrbits] Sample ghost:', ghosts[0]);
    if (dots.length > 0) console.log('[GhostOrbits] Sample dot:', dots[0]);
    this._hasLoggedRender = true;
  }

  // Send to renderer
  this.renderer.updateState({ ghosts });
  this.renderer.updateDots(dots);
}
```

### POTENTIAL ISSUE #5: Player `isAlive` Check

Players are only added if `player.isAlive` is truthy:
```javascript
if (!player.isAlive) continue;
```

If the server doesn't send `isAlive: true` explicitly, the player won't be rendered.

### POTENTIAL ISSUE #6: Empty `serverState`

If `applyServerState()` was never called (e.g., no `gameState` in `arena_joined`), then `this.serverState.players` will be empty `{}`.

---

## 5. Renderer Methods Called

### `renderer.updateState({ ghosts })` (Line 1472-1535)

```javascript
updateState(state) {
  if (!state) return;

  // Debug: log first update
  if (!this._loggedFirstUpdate && state.ghosts && state.ghosts.length > 0) {
    console.log('[Renderer] updateState receiving ghosts:', state.ghosts.length, state.ghosts[0]);
    this._loggedFirstUpdate = true;
  }

  // Update arena size if changed
  if (state.arenaSize && state.arenaSize !== this.arena.size) {
    this.resizeArena(Math.ceil(state.arenaSize / 80));
  }

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
        // Update existing ghost
        ghost.position.x = ghostData.x;
        ghost.position.y = ghostData.y;
        if (ghostData.vx !== undefined) ghost.velocity.x = ghostData.vx;
        if (ghostData.vy !== undefined) ghost.velocity.y = ghostData.vy;
        if (ghostData.energy !== undefined) ghost.energy = ghostData.energy;
      } else {
        // Add new ghost
        const newGhost = this.addGhost({
          id: ghostData.id,
          x: ghostData.x,
          y: ghostData.y,
          color: ghostData.color,
          tier: ghostData.tier,
          nnProperties: ghostData.nnProperties
        }, ghostData.id === this.localGhostId);
      }
    }
  }
}
```

### `renderer.updateDots(dots)` (Line 2062-2068)

```javascript
updateDots(dots) {
  this.territoryDots = dots || [];
  if (!this._loggedDotsUpdate && dots && dots.length > 0) {
    console.log('[Renderer] updateDots received:', dots.length, 'dots, sample:', dots[0]);
    this._loggedDotsUpdate = true;
  }
}
```

This just stores the dots array. Rendering happens in `renderDots()` during the render loop.

---

## 6. `serverAuthoritative` Flag

### Where It's Set (Line 1131-1134)

```javascript
_startRenderLoop() {
  ...
  if (this.renderer) {
    this.renderer.setServerAuthoritative(true);
    this.renderer.start();
  }
}
```

### What It Does (Renderer Line 897-901)

```javascript
updatePhysics(deltaTime, currentTime) {
  // Skip local physics in multiplayer mode - server owns positions
  if (this.serverAuthoritative) {
    return;
  }
  // ... local physics simulation (skipped)
}
```

### POTENTIAL ISSUE #7: Physics Skip is Correct

When `serverAuthoritative=true`:
- Local physics are skipped (correct - server owns positions)
- Ghosts still render (correct - positions come from `updateState()`)
- **This is NOT a bug** - the flag correctly disables local simulation

---

## 7. State Machine Transitions

### PLAYING State (Line 467-476)

```javascript
case GameState.PLAYING:
  this.inputEnabled = true;
  this.isSpectating = false;
  if (this.panel) {
    this.panel.hideWaitingOverlay();
    this.panel.showGameView();
  }
  this._startRenderLoop();  // CRITICAL: Starts both loops
  break;
```

### POTENTIAL ISSUE #8: Render Loop Not Started

The render loop ONLY starts when transitioning to `PLAYING` state. If:
1. `_handleArenaJoined()` is called
2. But `_setState(GameState.PLAYING)` is not called (or called with wrong state)
3. `_startRenderLoop()` never executes
4. Nothing renders

Check the state transition in `_handleArenaJoined()` (Line 775-780):
```javascript
const isRunning = message.gameState?.isRunning || message.isRunning;
if (isRunning) {
  this._setState(GameState.PLAYING);  // Starts render loop
} else {
  this._setState(GameState.WAITING);  // Does NOT start render loop
}
```

### POTENTIAL ISSUE #9: WAITING State Doesn't Start Rendering

When `isRunning=false`, the state goes to WAITING (Line 458-461):
```javascript
case GameState.WAITING:
  this.inputEnabled = false;
  if (this.panel) this.panel.showWaiting(this.serverState.playerCount);
  break;
```

**The render loop is NOT started in WAITING state!**

---

## 8. Data Flow Summary

```
WebSocket Message (game_state)
         |
         v
_handleWebSocketMessage()
         |
         v
_handleArenaState() or _handleArenaJoined()
         |
         v
applyServerState(state)
   |-- Updates this.serverState.players
   |-- Updates this.serverState.dots
   |-- Updates this.serverState.orbits
         |
         v
_renderLoop() [Controller's loop - 60fps]
         |
         v
_interpolatePositions(now)
         |
         v
_updateRenderer()
   |-- Converts serverState.players -> ghosts array
   |-- Converts serverState.dots -> dots array
   |-- Calls renderer.updateState({ ghosts })
   |-- Calls renderer.updateDots(dots)
         |
         v
Renderer's update() loop
   |-- Calls render()
   |-- renderGhosts() - draws from this.ghosts Map
   |-- renderDots() - draws from this.territoryDots array
```

---

## 9. Potential Failure Points Summary

| # | Issue | Location | Symptom | Fix |
|---|-------|----------|---------|-----|
| 1 | Server sends data on message root, not in `message.gameState` | `_handleArenaJoined()` L759-771 | "No gameState in arena_joined message!" log | Check server message format |
| 2 | Server sends `players` as Array, not Object | `applyServerState()` L355 | Players not added to serverState | Change server to send Object or convert in handler |
| 3 | Server sends `dots` as Array, not Object | `applyServerState()` L377 | Dots not added to serverState | Change server to send Object or convert in handler |
| 4 | Player missing `isAlive: true` property | `_updateRenderer()` L1207 | Ghost filtered out, not sent to renderer | Server must set `isAlive: true` |
| 5 | `isRunning=false` keeps state in WAITING | `_handleArenaJoined()` L775-780 | Render loop never starts | Server should send `isRunning: true` when game active |
| 6 | Canvas not in DOM | `showGameView()` Panel L500-508 | Canvas re-mount fails | Check `_remountCanvas()` execution |
| 7 | Renderer.start() not called | `_startRenderLoop()` L1134 | Renderer's loop doesn't run | Ensure PLAYING state reached |
| 8 | Ghost positions invalid (NaN, undefined) | Renderer `renderGhost()` L1321-1327 | Invalid ghost logged, skipped | Server must send valid x/y |

---

## 10. Debug Checklist

When multiplayer ghosts/dots don't render, check these in order:

1. **Console logs to verify data reception:**
   - `[GhostOrbits] Initial gameState received:` - Shows player/dot counts
   - `[GhostOrbits] First render - ghosts: X dots: Y` - Shows conversion success
   - `[Renderer] updateState receiving ghosts:` - Shows renderer received data
   - `[Renderer] updateDots received:` - Shows dots received

2. **State machine:**
   - `[GhostOrbits] State: connecting -> playing` - Must reach PLAYING
   - If stuck in WAITING, check `isRunning` in server message

3. **Canvas mounting:**
   - `[GhostOrbitsPanel] Canvas re-mounted to:` - Canvas in correct container
   - `[Renderer] render() - canvas in DOM: true` - Canvas visible

4. **Ghost validation:**
   - `[Renderer] Rendering ghost: X at Y Z` - First successful ghost render
   - `[Renderer] Invalid ghost position/radius:` - Ghost skipped due to bad data

---

## 11. Recommended Server Message Format

For `arena_joined`:
```json
{
  "type": "arena_joined",
  "playerId": "player-uuid",
  "bet": 2.5,
  "pot": 15.0,
  "newGoldStars": 4,
  "newPoints": 875,
  "gameState": {
    "isRunning": true,
    "arenaSize": 800,
    "players": {
      "player-uuid": {
        "id": "player-uuid",
        "username": "Alice",
        "x": 400,
        "y": 400,
        "vx": 1.5,
        "vy": -0.5,
        "color": "#4488ff",
        "lives": 3,
        "dotCount": 0,
        "isAlive": true
      }
    },
    "dots": {
      "dot-1": {
        "id": "dot-1",
        "x": 200,
        "y": 300,
        "state": "neutral",
        "owner": null
      }
    },
    "orbits": [
      { "cx": 400, "cy": 400, "radius": 150 }
    ]
  }
}
```

For `game_state` updates:
```json
{
  "type": "game_state",
  "players": {
    "player-uuid": {
      "x": 405,
      "y": 398,
      "vx": 1.2,
      "vy": -0.3,
      "isAlive": true
    }
  },
  "dots": {
    "dot-1": {
      "x": 200,
      "y": 300,
      "state": "claimed",
      "owner": "player-uuid"
    }
  }
}
```

---

## 12. Quick Fix Suggestions

### If server sends Arrays instead of Objects:

Add conversion in `applyServerState()`:
```javascript
// Convert Array to Object if needed
if (Array.isArray(state.players)) {
  const playersObj = {};
  for (const p of state.players) {
    playersObj[p.id] = p;
  }
  state.players = playersObj;
}
```

### If `isAlive` is missing:

Default to true in `_updateRenderer()`:
```javascript
if (player.isAlive === false) continue;  // Only skip if explicitly false
```

### If render loop not starting in WAITING:

Force start render loop when game state is received:
```javascript
_handleArenaState(message) {
  this.applyServerState(message);

  // Start render loop if we have players (game is effectively running)
  if (Object.keys(this.serverState.players).length > 0 && !this._animationFrameId) {
    this._startRenderLoop();
  }
}
```
