# Ghost Orbits Multiplayer Debug Comparison

This document compares the **working single-player mode** (commit `b614f5d`) with the **broken multiplayer mode** to identify why ghosts and dots are not rendering in multiplayer.

## Executive Summary

The root cause is that **the multiplayer code never populates the `renderer.ghosts` Map** that the `renderGhosts()` method iterates over. While `renderer.updateState()` is being called, it's receiving ghost data but may not be adding ghosts correctly. Additionally, the multiplayer controller runs its own render loop that conflicts with the renderer's internal loop.

## Architecture Comparison

### Single-Player Mode (Working)

**File**: `platform/game/ghost-orbits-controller.js` (commit `b614f5d`)

**Initialization Flow**:
```
enterArena()
  -> renderer.addGhost({ id, x, y, color, ... }, true)   // Creates Ghost object in Map
  -> _spawnShadow()                                       // Adds shadow ghost
  -> renderer.start()                                     // Starts animation loop
```

**Render Loop**:
```
renderer.update(currentTime)
  -> processInput()
  -> updatePhysics(deltaTime, currentTime)   // Updates ghost positions
  -> onPhysicsUpdate(deltaTime, currentTime) // Controller's _updatePhysicsFrame()
  -> arena.updateTrails()
  -> render()                                 // <-- Calls renderGhosts()
```

**Key Code** (lines 379-399):
```javascript
// Single-player adds ghosts DIRECTLY to the renderer's Map
this.renderer.addGhost({
  id: this.username || 'player',
  x: playerSpawnX,
  y: playerSpawnY,
  color: this.ghostProperties?.color || '#4488ff',
  tier: this.ghostProperties?.tier || 0,
  pattern: this.ghostProperties?.pattern || null,
  nnProperties: { ... }
}, true); // true = this is the local player's ghost

// Then starts the renderer's own animation loop
this.renderer.start();
```

### Multiplayer Mode (Broken)

**File**: `platform/game/ghost-orbits-controller.js` (current branch)

**Initialization Flow**:
```
enterArena()
  -> _connectWebSocket()
  -> sends 'global_arena_join' message
  -> waits for 'arena_joined' response
```

**When arena_joined received**:
```
_handleArenaJoined(message)
  -> applyServerState(message.gameState)   // Updates serverState object
  -> _setState(GameState.PLAYING)
  -> _handleStateTransition(PLAYING)
    -> _startRenderLoop()                  // Starts controller's own render loop
      -> renderer.setServerAuthoritative(true)
      -> renderer.start()                  // Starts renderer's animation loop too
```

**Render Loop (Controller)**:
```
_renderLoop()
  -> _interpolatePositions(now)
  -> _updateRenderer()                     // <-- PROBLEM: Uses updateState()
  -> requestAnimationFrame(_renderLoop)
```

**Render Loop (Renderer)** - running simultaneously!
```
renderer.update(currentTime)
  -> processInput()
  -> updatePhysics()   // SKIPPED due to serverAuthoritative=true
  -> arena.updateTrails()
  -> render()          // Renders ghosts from this.ghosts Map
```

## The Bug: Two Competing Systems

### Problem 1: Controller's `_updateRenderer()` Never Adds Ghosts

The multiplayer controller calls `renderer.updateState()`:

```javascript
// In _updateRenderer() (lines 1196-1247)
const ghosts = [];
for (const [id, player] of Object.entries(this.serverState.players)) {
  if (!player.isAlive) continue;
  ghosts.push({
    id,
    x: player.renderX ?? player.x,
    y: player.renderY ?? player.y,
    ...
  });
}

// This SHOULD add ghosts to the renderer's Map
this.renderer.updateState({ ghosts });
this.renderer.updateDots(dots);
```

**But let's look at `updateState()` (renderer lines 1472-1535):**

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
        // Update existing ghost position and velocity
        ghost.position.x = ghostData.x;
        ghost.position.y = ghostData.y;
        ...
      } else {
        // Add new ghost <-- THIS IS THE PATH WE NEED
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

### Problem 2: Missing `localGhostId` Assignment

In single-player mode:
```javascript
this.renderer.addGhost({ id: this.username, ... }, true);
// The `true` parameter sets `this.localGhostId = ghost.id`
```

In multiplayer mode:
```javascript
// renderer.localGhostId is NEVER SET
// The comparison `ghostData.id === this.localGhostId` is always false
// because localGhostId is null/undefined
```

**Fix needed**: Set `renderer.localGhostId` to the player's ID when joining.

### Problem 3: Ghost Data Format Mismatch

The `updateState()` method expects:
```javascript
{
  ghosts: [
    { id, x, y, color, tier, nnProperties: { ... } }
  ]
}
```

The multiplayer controller sends:
```javascript
{
  ghosts: [
    { id, x, y, vx, vy, color, energy, tier }  // Missing nnProperties
  ]
}
```

### Problem 4: No `currentPlayerId` Set

The renderer has a `currentPlayerId` property used for highlighting, but multiplayer never sets it:

```javascript
// Never called in multiplayer:
renderer.setCurrentPlayerId(this.playerId);
```

## Dot Rendering Analysis

### Single-Player Mode

```javascript
// In _updatePhysicsFrame() (line 1436)
this.renderer?.updateDots?.(this.dotManager.getDots());
```

The `DotManager.getDots()` returns objects with:
```javascript
{
  x, y, radius, pulsePhase, state: 'NEUTRAL' | 'CLAIMED', ownerColor
}
```

### Multiplayer Mode

```javascript
// In _updateRenderer() (lines 1221-1235)
const dots = [];
for (const [id, dot] of Object.entries(this.serverState.dots)) {
  const ownerColor = dot.owner ?
    (this.serverState.players[dot.owner]?.color || ...) :
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
this.renderer.updateDots(dots);
```

**This looks correct.** Let's verify `renderDots()`:

```javascript
renderDots() {
  if (!this.territoryDots || this.territoryDots.length === 0) {
    // Logs "[Renderer] renderDots: No territory dots"
    return;
  }
  // ... rendering code
}
```

**Check**: Verify `this.territoryDots` is being set by `updateDots()`:

```javascript
updateDots(dots) {
  this.territoryDots = dots || [];
  // Logs "[Renderer] updateDots received: X dots"
}
```

This appears correct. If dots aren't rendering, either:
1. `updateDots()` is never being called, or
2. The dots array is empty (no dots in `serverState.dots`)

## Debug Checklist

### Console Logs to Check

1. **`[Renderer] render() - canvas in DOM: X, ghosts: X, dots: X`**
   - Should show canvas is in DOM, ghosts > 0, dots > 0

2. **`[Renderer] renderGhosts: No ghosts in map`**
   - If this appears, ghosts aren't being added to the Map

3. **`[Renderer] updateState receiving ghosts: X`**
   - Should show ghosts being received

4. **`[Renderer] Ghost added to Map: X`**
   - Should appear for each new ghost

5. **`[GhostOrbits] First render - ghosts: X, dots: X`**
   - Shows what controller is sending

### Root Cause Summary

| Issue | Single-Player | Multiplayer | Status |
|-------|--------------|-------------|--------|
| Ghosts added to Map | `addGhost()` directly | `updateState()` | **May fail** |
| localGhostId set | Yes (true param) | **Never set** | **BUG** |
| currentPlayerId set | N/A | **Never called** | **BUG** |
| Render loop | Renderer's loop | Two loops running | **Potential conflict** |
| Dots updated | `updateDots()` | `updateDots()` | Should work |

## Recommended Fixes

### Fix 1: Set localGhostId in Multiplayer

In `_handleArenaJoined()`:
```javascript
this.playerId = message.playerId;
if (this.renderer) {
  this.renderer.localGhostId = this.playerId;
  this.renderer.setCurrentPlayerId(this.playerId);
}
```

### Fix 2: Add Debug Logging in updateState

Already added (commit `af2acb5`), verify logs appear.

### Fix 3: Verify Server State Format

Check that `serverState.players` and `serverState.dots` are populated:
```javascript
console.log('[GhostOrbits] serverState after join:', {
  playerCount: Object.keys(this.serverState.players).length,
  dotCount: Object.keys(this.serverState.dots).length,
  samplePlayer: Object.values(this.serverState.players)[0],
  sampleDot: Object.values(this.serverState.dots)[0]
});
```

### Fix 4: Consider Single Render Loop

The dual render loop (controller's `_renderLoop` + renderer's `update`) may cause issues. Consider:
1. Don't call `renderer.start()` in multiplayer - just use `_renderLoop`
2. Or don't run `_renderLoop` - let renderer's `update` call `_updateRenderer` via callback

### Fix 5: Verify Canvas Is Visible

Check that the panel is showing and canvas container has dimensions:
```javascript
const container = this.panel.getArenaContainer();
console.log('[GhostOrbits] Canvas container dimensions:',
  container?.clientWidth, 'x', container?.clientHeight);
```

## Code Paths Comparison

### Single-Player Ghost Lifecycle
```
enterArena()
  |-> renderer.addGhost({...}, true)
       |-> new Ghost(options)
       |-> this.ghosts.set(ghost.id, ghost)
       |-> this.localGhostId = ghost.id
  |-> renderer.start()
       |-> this.isRunning = true
       |-> requestAnimationFrame(this.update)
            |-> render()
                 |-> renderGhosts()
                      |-> for (ghost of this.ghosts.values())
                           |-> renderGhost(ghost)  // WORKS!
```

### Multiplayer Ghost Lifecycle
```
enterArena()
  |-> _connectWebSocket()
  |-> sends 'global_arena_join'

_handleArenaJoined(message)
  |-> this.playerId = message.playerId
  |-> applyServerState(message.gameState)
       |-> serverState.players = {...}
       |-> serverState.dots = {...}
  |-> _setState(PLAYING)
       |-> _startRenderLoop()
            |-> renderer.setServerAuthoritative(true)
            |-> renderer.start()  // Starts renderer loop
            |-> _renderLoop()     // ALSO starts controller loop

_renderLoop() [every frame]
  |-> _updateRenderer()
       |-> builds ghosts array from serverState.players
       |-> renderer.updateState({ ghosts })
            |-> for (ghostData of state.ghosts)
                 |-> ghost = this.ghosts.get(ghostData.id)  // null first time
                 |-> if (!ghost) this.addGhost({...}, ghostData.id === this.localGhostId)
                      // localGhostId is null, so always false
                      |-> new Ghost(options)
                      |-> this.ghosts.set(ghost.id, ghost)  // SHOULD ADD!
       |-> renderer.updateDots(dots)

renderer.update() [every frame, parallel]
  |-> updatePhysics()  // SKIPPED (serverAuthoritative)
  |-> render()
       |-> renderGhosts()
            |-> for (ghost of this.ghosts.values())  // IS MAP POPULATED?
                 |-> renderGhost(ghost)
```

## Conclusion

The most likely cause is that **ghosts ARE being added to the Map**, but either:

1. **Timing issue**: The first `render()` call happens before `updateState()` runs
2. **Data issue**: `serverState.players` is empty when `_updateRenderer()` runs
3. **Canvas issue**: Canvas is not visible or has zero dimensions

To debug, add these console logs and check the output:

```javascript
// In _handleArenaJoined:
console.log('[DEBUG] Arena joined, gameState:', JSON.stringify(message.gameState));

// In _updateRenderer:
console.log('[DEBUG] _updateRenderer - players:', Object.keys(this.serverState.players));

// In updateState:
console.log('[DEBUG] updateState - adding ghost:', ghostData.id, 'color:', ghostData.color);

// In renderGhosts:
console.log('[DEBUG] renderGhosts - ghosts.size:', this.ghosts.size);
```
