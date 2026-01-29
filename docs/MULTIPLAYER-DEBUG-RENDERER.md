# Ghost Orbits Multiplayer Renderer Debug Analysis

This document provides a thorough analysis of `platform/core/ghost-orbits-renderer.js` to identify potential failure points when rendering ghosts and dots in multiplayer mode.

## File Overview

- **Location**: `platform/core/ghost-orbits-renderer.js`
- **Lines**: 2194 total
- **Purpose**: Canvas-based 2D renderer for Ghost Orbits territory game
- **Key Classes**: `GhostOrbitsRenderer`, `Ghost`, `Arena`

---

## Architecture: Two Rendering Pathways

The renderer has **TWO completely separate rendering pathways**:

### 1. Local/Single-Player Mode (Game Loop)
- Entry: `start()` -> `update()` loop -> `render()`
- Uses: `this.ghosts` Map, `this.territoryDots` array
- Populated via: `addGhost()`, `updateDots()`, `updateState()`

### 2. Multiplayer/Server-Authoritative Mode
- Entry: External call to `renderFromState(state)`
- Uses: `state.players`, `state.dots` (passed as arguments)
- **DOES NOT USE** `this.ghosts` or `this.territoryDots`

**CRITICAL FINDING #1**: These two pathways are INCOMPATIBLE. If the multiplayer controller calls `updateState()` and `updateDots()` but relies on `render()` from the game loop, the data flows are mismatched.

---

## The `render()` Method (Lines 932-964)

```javascript
render() {
  // Clear canvas
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, size, size);

  // Render grid lines
  this.renderGrid();

  // Render territory overlay (legacy)
  this.renderTerritory();

  // Render void zone (legacy, disabled in v2)
  this.renderVoidZone();

  // Render records (spinning plates)
  this.renderGravityWells();

  // Render territory dots (v3)
  this.renderDots();  // <-- Uses this.territoryDots

  // Render ghosts
  this.renderGhosts();  // <-- Uses this.ghosts Map
}
```

### What `render()` draws:
1. Background (always works)
2. Grid lines (always works)
3. Territory overlay from `this.arena.grid` (legacy system)
4. Void zone from `this.voidZone`
5. Records/wells from `this.wells`
6. **Territory dots from `this.territoryDots`** - requires `updateDots()` to be called
7. **Ghosts from `this.ghosts` Map** - requires `addGhost()` or `updateState()` to populate

---

## The `renderFromState()` Method (Lines 1592-1630)

```javascript
renderFromState(state) {
  // Update arena size
  // Clear canvas
  // Render grid
  this.renderOrbitsFromState(state.orbits);     // Uses state.orbits
  this.renderDotsFromState(state.dots, state.players);  // Uses state.dots
  this.renderPlayersFromState(state.players);   // Uses state.players
  this.renderPot(state.pot);
  this.renderPlayerList(state.players);
}
```

### What `renderFromState()` draws:
1. Background
2. Grid lines
3. Orbits from `state.orbits`
4. **Dots from `state.dots`** (NOT `this.territoryDots`)
5. **Players from `state.players`** (NOT `this.ghosts` Map)
6. Pot display
7. Player list overlay

**CRITICAL FINDING #2**: `renderFromState()` renders its own dots and players from the state argument. It does NOT call `renderDots()` or `renderGhosts()`.

---

## Potential Failure Points

### 1. Data Flow Mismatch

**Scenario**: Controller calls:
```javascript
renderer.updateState(state);  // Populates this.ghosts
renderer.updateDots(state.dots);  // Populates this.territoryDots
// Then relies on game loop's render() to draw
```

**Problem**: If `serverAuthoritative = true`, the game loop's `updatePhysics()` is skipped, but `render()` still runs. This should work IF:
- `updateState()` properly populates `this.ghosts`
- `updateDots()` properly populates `this.territoryDots`

**Potential Issue**: The controller might be calling `renderFromState()` instead, which bypasses `this.ghosts` entirely.

### 2. The `updateState()` Method (Lines 1472-1535)

```javascript
updateState(state) {
  if (!state) return;

  // Update ghosts from server state
  if (state.ghosts) {
    // Remove ghosts not in server state
    // Update or add ghosts
    for (const ghostData of state.ghosts) {
      let ghost = this.ghosts.get(ghostData.id);
      if (ghost) {
        // Update position
        ghost.position.x = ghostData.x;
        ghost.position.y = ghostData.y;
      } else {
        // Add new ghost
        const newGhost = this.addGhost({...});
      }
    }
  }
}
```

**Required Data Format for `updateState()`**:
```javascript
{
  ghosts: [
    { id: 'player-1', x: 100, y: 200, color: '#4488ff', tier: 0, vx: 1, vy: 0, energy: 100 }
  ],
  trails: [...],
  arenaSize: 800
}
```

**CRITICAL FINDING #3**: `updateState()` expects `state.ghosts` array. If the server sends `state.players` instead, no ghosts will be added.

### 3. The `updateDots()` Method (Lines 2062-2068)

```javascript
updateDots(dots) {
  this.territoryDots = dots || [];
}
```

**Required Data Format for `updateDots()`**:
```javascript
[
  { x: 100, y: 200, radius: 10, pulsePhase: 0, state: 'NEUTRAL', ownerColor: null },
  { x: 150, y: 250, radius: 10, pulsePhase: 1.5, state: 'OWNED', ownerColor: '#ff4466' }
]
```

**Potential Issue**: The `renderDots()` method at line 2091 expects these properties:
- `x`, `y` - position
- `radius` - dot size
- `pulsePhase` - animation phase
- `state` - 'NEUTRAL' or other (for color selection)
- `ownerColor` - color when owned

If the server sends dots with different property names (e.g., `owner` instead of `ownerColor`), rendering will fail silently.

### 4. The `renderDots()` Method (Lines 2075-2139)

```javascript
renderDots() {
  if (!this.territoryDots || this.territoryDots.length === 0) {
    // Logs "No territory dots" and returns early
    return;
  }

  for (const dot of this.territoryDots) {
    const { x, y, radius, pulsePhase, state, ownerColor } = dot;
    // Render logic
  }
}
```

**Failure conditions**:
1. `this.territoryDots` is `undefined` - returns early
2. `this.territoryDots` is empty array - returns early
3. Dots missing `x`, `y`, or `radius` - silent failure, NaN positions

### 5. The `renderGhosts()` Method (Lines 1299-1309)

```javascript
renderGhosts() {
  if (this.ghosts.size === 0 && !this._loggedNoGhosts) {
    console.log('[Renderer] renderGhosts: No ghosts in map');
    this._loggedNoGhosts = true;
  }
  for (const ghost of this.ghosts.values()) {
    this.renderGhost(ghost);
  }
}
```

**Failure conditions**:
1. `this.ghosts` Map is empty - logs warning, draws nothing
2. Ghost has invalid position - caught by `renderGhost()` validation

### 6. The `renderGhost()` Method (Lines 1315-1417)

```javascript
renderGhost(ghost) {
  const { x, y } = ghost.position;
  const radius = ghost.radius;

  // Validation
  if (!isFinite(x) || !isFinite(y) || !isFinite(radius) || radius <= 0) {
    console.warn('[Renderer] Invalid ghost position/radius:', ghost.id);
    return;
  }

  // Render logic
}
```

**Failure conditions**:
1. `ghost.position` is undefined - destructuring fails
2. `ghost.position.x` or `ghost.position.y` is NaN/Infinity
3. `ghost.radius` is 0 or negative
4. `ghost.color` is undefined - `lighten()` handles this gracefully

### 7. The `lighten()` Function (Lines 99-124)

```javascript
function lighten(color, percent) {
  if (!color || typeof color !== 'string') {
    return '#ffffff';  // Safe fallback
  }

  // Handle HSL colors
  const hslMatch = color.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  if (hslMatch) {
    // Parse and return HSL
  }

  // Handle hex colors
  const cleanColor = color.replace('#', '');
  const num = parseInt(cleanColor, 16);
  if (isNaN(num)) {
    return color;  // Return original if can't parse
  }
  // Return lightened hex
}
```

**HSL Support**: Yes, handles `hsl(h, s%, l%)` format.

**Potential Issues**:
1. HSLA format (`hsla(...)`) not supported - would fall through to hex parsing and fail
2. RGB format (`rgb(...)`) not supported
3. Named colors (`red`, `blue`) not supported - would fail hex parsing, return original

### 8. The `serverAuthoritative` Flag (Lines 619-621, 897-901, 923-927)

```javascript
// In constructor
this.serverAuthoritative = false;

// In updatePhysics
updatePhysics(deltaTime, currentTime) {
  if (this.serverAuthoritative) {
    return;  // Skip local physics
  }
  // Physics updates...
}

// Setter
setServerAuthoritative(enabled) {
  this.serverAuthoritative = enabled;
  console.log('[Renderer] Server authoritative mode:', enabled);
}
```

**Purpose**: When `true`, skips local physics (positions come from server).

**Does NOT prevent rendering**: The flag only affects `updatePhysics()`, not `render()` or `renderFromState()`.

### 9. Canvas Context Validity

```javascript
// In constructor (lines 577-584)
this.canvas = document.createElement('canvas');
this.canvas.width = arenaSize;
this.canvas.height = arenaSize;
this.ctx = this.canvas.getContext('2d');
```

**Potential Issues**:
1. If `getContext('2d')` fails (extremely rare), `this.ctx` would be `null`
2. No explicit null check before rendering

**Debug logging exists** (line 937-940):
```javascript
if (!this._loggedCanvasStatus) {
  const inDOM = this.canvas && document.body.contains(this.canvas);
  console.log('[Renderer] render() - canvas in DOM:', inDOM, ...);
}
```

---

## Identified Root Causes

### Most Likely Issue: Data Format Mismatch

The multiplayer server likely sends:
```javascript
{
  players: [{ id, x, y, color, lives, ... }],  // NOT "ghosts"
  dots: [{ id, x, y, owner, ... }]  // Different property names
}
```

But `updateState()` expects:
```javascript
{
  ghosts: [{ id, x, y, color, ... }],  // "ghosts" key
  trails: [...]
}
```

And `renderDots()` expects:
```javascript
{ x, y, radius, pulsePhase, state, ownerColor }  // Specific properties
```

### Secondary Issue: Wrong Rendering Pathway

If the controller calls `renderFromState(state)` directly (line 1592), it bypasses:
- `this.ghosts` Map entirely
- `this.territoryDots` array entirely

Instead using `state.players` and `state.dots` directly.

**Solution options**:
1. Use `renderFromState()` exclusively for multiplayer - ensure all data is in state argument
2. Use `updateState()` + `updateDots()` + game loop `render()` - ensure data format matches

---

## Debug Checklist

### Step 1: Verify Data Flow
Add logging to confirm which pathway is active:
```javascript
// In the controller
console.log('[Controller] Rendering method:', usingRenderFromState ? 'renderFromState' : 'gameLoop');
console.log('[Controller] State keys:', Object.keys(state));
console.log('[Controller] Players/Ghosts:', state.players || state.ghosts);
console.log('[Controller] Dots:', state.dots?.length);
```

### Step 2: Check Data Format
In `updateState()` and `updateDots()`, log received data:
```javascript
console.log('[updateState] Received:', JSON.stringify(state, null, 2));
console.log('[updateDots] Received:', JSON.stringify(dots?.[0]));
```

### Step 3: Verify Canvas
Check browser console for existing debug logs:
- `[Renderer] render() - canvas in DOM: true/false`
- `[Renderer] renderGhosts: No ghosts in map`
- `[Renderer] renderDots: No territory dots`

### Step 4: Check `serverAuthoritative` State
Verify the flag is set correctly:
```javascript
console.log('[Debug] serverAuthoritative:', renderer.serverAuthoritative);
console.log('[Debug] isRunning:', renderer.isRunning);
console.log('[Debug] ghosts.size:', renderer.ghosts.size);
console.log('[Debug] territoryDots.length:', renderer.territoryDots?.length);
```

---

## Recommended Fix

The cleanest solution depends on the multiplayer architecture:

### Option A: Use `renderFromState()` Exclusively
If server sends complete state each frame:
```javascript
// In controller
socket.on('gameState', (state) => {
  renderer.renderFromState({
    players: state.players,  // Use players as-is
    dots: state.dots,
    orbits: state.orbits,
    arenaSize: state.arenaSize,
    pot: state.pot
  });
});
// Do NOT use game loop - or stop it
renderer.stop();
```

### Option B: Adapt Data for Game Loop
If using game loop with `render()`:
```javascript
// In controller
socket.on('gameState', (state) => {
  // Transform players -> ghosts format
  const ghosts = state.players.map(p => ({
    id: p.id,
    x: p.x,
    y: p.y,
    color: p.color,
    vx: p.vx || 0,
    vy: p.vy || 0
  }));

  // Transform dots format
  const dots = state.dots.map(d => ({
    x: d.x,
    y: d.y,
    radius: d.radius || 10,
    pulsePhase: d.pulsePhase || Math.random() * Math.PI * 2,
    state: d.owner ? 'OWNED' : 'NEUTRAL',
    ownerColor: d.ownerColor || (d.owner ? getPlayerColor(d.owner) : null)
  }));

  renderer.updateState({ ghosts, arenaSize: state.arenaSize });
  renderer.updateDots(dots);
});

// Game loop handles rendering
renderer.setServerAuthoritative(true);
renderer.start();
```

---

## Summary of Failure Points

| Component | Method | Failure Condition | Console Log |
|-----------|--------|-------------------|-------------|
| Ghosts | `updateState()` | `state.ghosts` missing/empty | `[Renderer] updateState receiving ghosts: 0` |
| Ghosts | `renderGhosts()` | `this.ghosts.size === 0` | `renderGhosts: No ghosts in map` |
| Ghosts | `renderGhost()` | Invalid position/radius | `Invalid ghost position/radius` |
| Dots | `updateDots()` | Called with wrong format | `updateDots received: X dots` |
| Dots | `renderDots()` | `this.territoryDots` empty | `renderDots: No territory dots` |
| Canvas | `render()` | Canvas not in DOM | `canvas in DOM: false` |
| Colors | `lighten()` | Non-hex/HSL format | Returns original color |
| Physics | `updatePhysics()` | `serverAuthoritative=true` | Positions not updated locally |

---

## File References

- **Ghost class**: Lines 166-379
- **Arena class**: Lines 388-544
- **GhostOrbitsRenderer class**: Lines 553-2161
- **render()**: Lines 932-964
- **renderFromState()**: Lines 1592-1630
- **updateState()**: Lines 1472-1535
- **updateDots()**: Lines 2062-2068
- **renderGhosts()**: Lines 1299-1309
- **renderDots()**: Lines 2075-2139
- **lighten()**: Lines 99-124
