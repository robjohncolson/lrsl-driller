# Ghost Orbits Multiplayer Rendering Bug - Master Debug Summary

## Observed Symptoms

- Console logs confirm data flows correctly from server to renderer
- Canvas is mounted and visible (verified via DOM inspection)
- Grid/background renders correctly
- **Ghosts and dots do NOT render** despite data being present

---

## TOP 5 Most Likely Root Causes

### 1. Server State Object Structure Mismatch (Probability: HIGH - 40%)

**Why this causes the symptoms:**

The controller's `_updateRenderer()` method (lines 1197-1255 in `ghost-orbits-controller.js`) converts `serverState.players` to a `ghosts` array format for `renderer.updateState()`. However, there are multiple potential mismatches:

1. **Player ID vs key mismatch**: The server may send players with different ID formats (e.g., `playerId` vs `id` vs `username`)
2. **Empty player filter**: Line 1206 filters out non-alive players (`if (!player.isAlive) continue;`). If `isAlive` is undefined or not set correctly during join, all players are filtered out.
3. **Position field names**: Server may use `position.x/y` but controller expects flat `x/y` fields

**Evidence in code:**
```javascript
// Controller expects this structure in serverState.players[id]:
{
  x: number,
  y: number,
  isAlive: boolean,
  color: string,
  ...
}

// But server Ghost.toJSON() returns:
{
  position: { x, y },  // NESTED - not flat!
  velocity: { x, y },
  isAlive: boolean,
  ...
}
```

**Specific fix:**
```javascript
// In ghost-orbits-controller.js, _updateRenderer() around line 1203:
for (const [id, player] of Object.entries(this.serverState.players)) {
  if (!player.isAlive && player.isAlive !== undefined) continue;  // Handle undefined

  // Handle both flat and nested position formats
  const x = player.x ?? player.position?.x ?? player.renderX;
  const y = player.y ?? player.position?.y ?? player.renderY;

  if (x === undefined || y === undefined) {
    console.warn('[GhostOrbits] Player missing position:', id, player);
    continue;
  }

  ghosts.push({
    id,
    x,
    y,
    vx: player.vx ?? player.velocity?.x ?? 0,
    vy: player.vy ?? player.velocity?.y ?? 0,
    color: player.color || this._generateFallbackColor(id),
    energy: player.energy ?? 100,
    tier: 1
  });
}
```

---

### 2. Render Loop Timing / State Not Populated Before Render (Probability: HIGH - 25%)

**Why this causes the symptoms:**

The render loop starts in `_handleStateTransition(GameState.PLAYING)` which calls `_startRenderLoop()`. However, `applyServerState()` may not have populated `serverState.players` or `serverState.dots` yet when the first render occurs.

**Evidence:**
- `_handleArenaJoined()` calls `applyServerState()` AFTER logging but state may not be ready
- The renderer's own `update()` loop runs independently
- First render happens before state sync completes

**The race condition:**
```
Timeline:
1. arena_joined message received
2. _handleArenaJoined() called
3. applyServerState(message.gameState) called
4. State transition to PLAYING
5. _startRenderLoop() starts render loop  <-- Render starts here
6. Render loop calls _updateRenderer()
7. serverState.players is empty {}  <-- BUG: State not populated yet!
```

**Specific fix:**
```javascript
// In ghost-orbits-controller.js, ensure state is applied before render starts:
_handleArenaJoined(message) {
  console.log('[GhostOrbits] Joined arena:', message);
  this.playerId = message.playerId;

  // ...stats handling...

  // IMPORTANT: Apply state FIRST
  if (message.gameState) {
    this.applyServerState(message.gameState);
    console.log('[GhostOrbits] State after apply:', {
      playerCount: Object.keys(this.serverState.players).length,
      dotCount: Object.keys(this.serverState.dots).length
    });
  }

  // THEN transition state (which starts render loop)
  const isRunning = message.gameState?.isRunning || message.isRunning;
  if (isRunning) {
    // Add small delay to ensure state is fully processed
    requestAnimationFrame(() => {
      this._setState(GameState.PLAYING);
    });
  } else {
    this._setState(GameState.WAITING);
  }
}
```

---

### 3. Canvas Context Lost or Not Rendering to Visible Layer (Probability: MEDIUM - 15%)

**Why this causes the symptoms:**

The renderer creates its canvas during construction but the panel's `showGameView()` method may recreate the DOM, orphaning the original canvas. Line 500-508 in `ghost-orbits-panel.js`:

```javascript
showGameView() {
  // Re-render to game HUD
  if (this.overlayElement && this.overlayElement.parentNode) {
    this.overlayElement.parentNode.removeChild(this.overlayElement);
  }
  this._render();  // <-- This recreates the DOM
  this._attachEventListeners();
  this.overlayElement?.classList.add('visible');

  // Re-mount canvas if we have one (after DOM recreation)
  this._remountCanvas();  // <-- Canvas should be re-mounted here
}
```

The `_remountCanvas()` method exists, but it may fail silently if `getArenaContainer()` returns a different container than expected.

**Evidence:**
- Grid renders correctly (indicates canvas is working at some level)
- Debug log `[Renderer] render() - canvas in DOM: true` confirms canvas is in DOM
- But ghosts don't render

**This points to:** The canvas may be receiving state updates but drawing to wrong coordinates (0,0 outside visible area) or the ghosts map is empty.

**Specific fix:**
```javascript
// In ghost-orbits-renderer.js, add more defensive logging in renderGhosts():
renderGhosts() {
  console.log('[Renderer] renderGhosts called, ghosts.size:', this.ghosts.size);
  if (this.ghosts.size === 0) {
    console.warn('[Renderer] NO GHOSTS TO RENDER - check updateState() is being called');
    return;
  }

  for (const ghost of this.ghosts.values()) {
    console.log('[Renderer] Drawing ghost:', ghost.id, 'at', ghost.position.x, ghost.position.y);
    this.renderGhost(ghost);
  }
}
```

---

### 4. Dual Render Paths Conflict (Probability: MEDIUM - 12%)

**Why this causes the symptoms:**

The renderer has TWO different rendering approaches:
1. **Own game loop** (`start()` -> `update()` -> `render()`) which uses `this.ghosts` Map
2. **Server-authoritative rendering** (`renderFromState()`) which renders directly from state parameter

The controller calls:
- `renderer.setServerAuthoritative(true)` - disables local physics
- `renderer.start()` - starts the internal game loop
- `renderer.updateState({ ghosts })` - populates `this.ghosts` Map
- `renderer.updateDots(dots)` - populates `this.territoryDots` array

**The conflict:** When `serverAuthoritative=true`, the internal game loop still runs but skips physics. The `render()` method IS called and draws from `this.ghosts`, but `updateState()` might not be populating ghosts correctly.

**Evidence from renderer.js:**
```javascript
// updateState() line 1488-1521 does add ghosts to the Map:
for (const ghostData of state.ghosts) {
  let ghost = this.ghosts.get(ghostData.id);
  if (ghost) {
    // Update existing ghost position
  } else {
    // Add new ghost
    const newGhost = this.addGhost({...});
  }
}
```

**But the issue:** The `ghostData` from controller has format `{ id, x, y, vx, vy, color, energy, tier }` but `addGhost()` expects `{ id, x, y, color, tier, nnProperties }`. This should still work, but position may not be set correctly if constructor expects different field names.

**Specific fix - verify Ghost class constructor:**
```javascript
// In Ghost class constructor (renderer.js line 178):
constructor(options) {
  this.id = options.id;
  // ISSUE: position expects x,y at top level, which IS correct
  this.position = { x: options.x, y: options.y };
  // Verify these are not NaN/undefined
  if (!isFinite(this.position.x) || !isFinite(this.position.y)) {
    console.error('[Ghost] Invalid position in constructor:', options);
  }
}
```

---

### 5. Dots State Key Format Mismatch (Probability: MEDIUM - 8%)

**Why this causes the symptoms:**

The dots don't render despite `updateDots()` being called. In `applyServerState()`:

```javascript
// Controller line 378:
this.serverState.dots[id] = {
  ...this.serverState.dots[id],
  ...dotData
};
```

Then in `_updateRenderer()`:
```javascript
// Controller line 1222:
for (const [id, dot] of Object.entries(this.serverState.dots)) {
  dots.push({
    id,
    x: dot.x,
    y: dot.y,
    // ...
  });
}
```

**The issue:** If server sends dots with `position: {x, y}` instead of flat `x, y`, the conversion fails silently.

**Specific fix:**
```javascript
// In _updateRenderer():
for (const [id, dot] of Object.entries(this.serverState.dots)) {
  const x = dot.x ?? dot.position?.x;
  const y = dot.y ?? dot.position?.y;

  if (x === undefined || y === undefined) {
    console.warn('[GhostOrbits] Dot missing position:', id, dot);
    continue;
  }

  dots.push({
    id,
    x,
    y,
    radius: dot.radius || 10,
    state: dot.state === 'claimed' ? 'CLAIMED' : 'NEUTRAL',
    ownerColor: ownerColor,
    pulsePhase: (Date.now() / 500) % (Math.PI * 2)
  });
}
```

---

## Contradictions and Gaps in Analysis

### Contradictions:
1. **Grid renders but entities don't**: This rules out canvas visibility issues but suggests the ghosts Map or territoryDots array is empty when render() is called
2. **Console logs show correct data flow**: But this may be logging the data BEFORE it's transformed into the render-ready format

### Gaps:
1. **No logs showing actual ghosts.size during render()**: We see `updateState receiving ghosts: N` but not `renderGhosts() called with N ghosts`
2. **Unknown server message format**: We don't have actual server response examples showing the exact field names
3. **WebSocket message logging**: No confirmation that `game_state` or `arena_delta` messages are being received after initial `arena_joined`

---

## Recommended Debugging Strategy

### Phase 1: Add Diagnostic Logging (5 minutes)

Add these console logs to isolate the exact point of failure:

```javascript
// In ghost-orbits-controller.js _updateRenderer():
_updateRenderer() {
  console.log('[DEBUG] _updateRenderer called');
  console.log('[DEBUG] serverState.players:', JSON.stringify(this.serverState.players));
  console.log('[DEBUG] serverState.dots:', JSON.stringify(this.serverState.dots));

  // ... existing code ...

  console.log('[DEBUG] Constructed ghosts array:', ghosts.length, ghosts);
  console.log('[DEBUG] Constructed dots array:', dots.length, dots);
}

// In ghost-orbits-renderer.js render():
render() {
  console.log('[DEBUG] render() called, ghosts.size:', this.ghosts.size, 'dots:', this.territoryDots?.length);
}
```

### Phase 2: Fix Most Likely Cause First (10 minutes)

Based on probability, implement **Fix #1** (Server State Structure Mismatch):

1. Add defensive position handling in `_updateRenderer()`
2. Handle both nested `position.x/y` and flat `x/y` formats
3. Add undefined checks for `isAlive` field

### Phase 3: Verify State Timing (5 minutes)

If Fix #1 doesn't resolve, implement **Fix #2**:

1. Add `requestAnimationFrame()` delay before starting render loop
2. Log state contents immediately before and after `applyServerState()`

### Phase 4: Check Server Response Format (5 minutes)

Add a one-time log of the raw WebSocket message:

```javascript
// In _handleWebSocketMessage():
_handleWebSocketMessage(data) {
  if (!this._loggedFirstMessage) {
    console.log('[DEBUG] Raw WebSocket message:', data);
    this._loggedFirstMessage = true;
  }
  // ... existing code
}
```

---

## Quick Win: Combined Fix Attempt

If you want to try a comprehensive fix before full debugging, update `_updateRenderer()` in `ghost-orbits-controller.js`:

```javascript
_updateRenderer() {
  if (!this.renderer) {
    console.warn('[GhostOrbits] _updateRenderer called but no renderer');
    return;
  }

  // Convert server players to ghost format with robust field handling
  const ghosts = [];
  const playerEntries = Object.entries(this.serverState.players || {});

  console.log('[DEBUG] Processing', playerEntries.length, 'players for rendering');

  for (const [id, player] of playerEntries) {
    // Handle isAlive - default to true if undefined (new player)
    const isAlive = player.isAlive !== false;
    if (!isAlive) continue;

    // Handle position - support both flat and nested formats
    const x = player.renderX ?? player.x ?? player.position?.x;
    const y = player.renderY ?? player.y ?? player.position?.y;

    if (!isFinite(x) || !isFinite(y)) {
      console.warn('[DEBUG] Skipping player with invalid position:', id, player);
      continue;
    }

    ghosts.push({
      id,
      x,
      y,
      vx: player.vx ?? player.velocity?.x ?? 0,
      vy: player.vy ?? player.velocity?.y ?? 0,
      color: player.color || this._generateFallbackColor(id),
      energy: player.energy ?? 100,
      tier: 1
    });
  }

  // Convert dots with robust field handling
  const dots = [];
  const dotEntries = Object.entries(this.serverState.dots || {});

  for (const [id, dot] of dotEntries) {
    const x = dot.x ?? dot.position?.x;
    const y = dot.y ?? dot.position?.y;

    if (!isFinite(x) || !isFinite(y)) {
      console.warn('[DEBUG] Skipping dot with invalid position:', id, dot);
      continue;
    }

    const ownerColor = dot.owner ?
      (this.serverState.players[dot.owner]?.color || this._generateFallbackColor(dot.owner)) :
      null;

    dots.push({
      id,
      x,
      y,
      radius: dot.radius || 10,
      state: dot.state === 'claimed' ? 'CLAIMED' : 'NEUTRAL',
      ownerColor: ownerColor,
      pulsePhase: (Date.now() / 500) % (Math.PI * 2)
    });
  }

  console.log('[DEBUG] Sending to renderer: ghosts=', ghosts.length, 'dots=', dots.length);

  this.renderer.updateState({ ghosts });
  this.renderer.updateDots(dots);

  // Camera follow
  const followId = this.isSpectating ? this.spectateTargetId : this.playerId;
  if (followId && this.serverState.players[followId]) {
    const target = this.serverState.players[followId];
    const tx = target.renderX ?? target.x ?? target.position?.x;
    const ty = target.renderY ?? target.y ?? target.position?.y;
    if (isFinite(tx) && isFinite(ty)) {
      this.renderer.setCameraTarget?.(tx, ty);
    }
  }
}
```

---

## Files to Examine

| File | Lines | Purpose |
|------|-------|---------|
| `platform/game/ghost-orbits-controller.js` | 1197-1255 | `_updateRenderer()` - converts server state to render format |
| `platform/game/ghost-orbits-controller.js` | 334-387 | `applyServerState()` - receives server data |
| `platform/game/ghost-orbits-controller.js` | 728-781 | `_handleArenaJoined()` - initial state setup |
| `platform/core/ghost-orbits-renderer.js` | 1472-1535 | `updateState()` - populates ghosts Map |
| `platform/core/ghost-orbits-renderer.js` | 2062-2068 | `updateDots()` - populates territoryDots array |
| `platform/core/ghost-orbits-renderer.js` | 1299-1309 | `renderGhosts()` - iterates ghosts Map |
| `platform/core/ghost-orbits-renderer.js` | 2075-2139 | `renderDots()` - iterates territoryDots array |
| `railway-server/ghost-orbits-manager.js` | 889-928 | `getState()` - server state format |

---

## Summary

The most likely root cause is a **data structure mismatch** between what the server sends and what the client expects. The server's `Ghost.toJSON()` uses nested `position: {x, y}` while the client controller expects flat `x, y` fields.

**Start with:**
1. Add the debug logging to see exact data at each step
2. Apply the defensive position handling fix
3. Check if `isAlive` is being set correctly on join

The grid rendering proves the canvas works - the issue is specifically in populating/iterating the ghosts Map and territoryDots array.
