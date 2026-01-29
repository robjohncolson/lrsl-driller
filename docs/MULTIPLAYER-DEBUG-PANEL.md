# Ghost Orbits Panel - Multiplayer Debug Analysis

## Overview

This document traces the canvas lifecycle in `platform/game/ghost-orbits-panel.js` to identify potential failure points causing ghosts and dots not to render in multiplayer mode.

---

## Canvas Lifecycle Summary

### 1. Canvas Creation (in Renderer)

**Location**: `platform/core/ghost-orbits-renderer.js` (lines 576-631)

```javascript
// Create canvas
this.canvas = document.createElement('canvas');
this.canvas.width = arenaSize;
this.canvas.height = arenaSize;
this.canvas.style.display = 'block';
this.canvas.style.margin = '0 auto';
// ...
this.container.appendChild(this.canvas);
```

The canvas is created in the `GhostOrbitsRenderer` constructor and immediately appended to its container.

### 2. Initial Mounting (in Controller)

**Location**: `platform/game/ghost-orbits-controller.js` (lines 217-231)

```javascript
const canvasContainer = this.panel.getArenaContainer();
if (canvasContainer) {
  this.renderer = new GhostOrbitsRenderer({
    container: canvasContainer,
    // ...
  });
  await this.renderer.init();
  this.panel.setGameCanvas(this.renderer.canvas);
}
```

**Critical Sequence**:
1. Panel is created first (line 198)
2. Panel's `init()` is awaited (line 205)
3. Canvas container is retrieved via `getArenaContainer()`
4. Renderer is created with that container
5. Canvas reference is passed to panel via `setGameCanvas()`

---

## Potential Failure Points

### FAILURE POINT 1: `getArenaContainer()` Returns Null During Initialization

**Location**: `ghost-orbits-panel.js` (lines 1723-1725)

```javascript
getArenaContainer() {
  return this.overlayElement?.querySelector('.orbits-arena-canvas-mount') || null;
}
```

**Problem**: If `this.overlayElement` is not yet created or the `.orbits-arena-canvas-mount` element doesn't exist, this returns `null`.

**When it fails**:
- If `_render()` (line 69 in constructor) fails silently
- If the overlay is not visible when `getArenaContainer()` is called

**Evidence from code** (lines 1126-1184):
The `_render()` method creates the overlay with `.orbits-arena-canvas-mount` inside. If this DOM creation fails, the canvas has nowhere to mount.

---

### FAILURE POINT 2: Lobby View Overwrites Game DOM Structure

**Location**: `ghost-orbits-panel.js` (lines 1190-1256)

```javascript
_renderLobbyView() {
  if (!this.overlayElement) return;
  // ...
  this.overlayElement.innerHTML = `
    <div class="orbits-lobby-view">
      // COMPLETELY DIFFERENT HTML - NO canvas-mount element!
    </div>
  `;
```

**CRITICAL BUG**: When `showLobbyView()` is called, it uses `innerHTML` assignment which **completely replaces** the overlay's contents. This destroys:
- The `.orbits-arena-canvas-mount` element
- The canvas element itself (if it was mounted)

**Impact**: After viewing the lobby, the canvas mount point no longer exists in the DOM.

---

### FAILURE POINT 3: View Switching Destroys and Recreates DOM

**Location**: `ghost-orbits-panel.js` (lines 494-513)

```javascript
showGameView() {
  this.currentView = 'game';
  this.isEliminated = false;
  this.isSpectating = false;

  // Re-render to game HUD
  if (this.overlayElement && this.overlayElement.parentNode) {
    this.overlayElement.parentNode.removeChild(this.overlayElement);  // DESTROYS ENTIRE OVERLAY
  }
  this._render();                    // Creates new overlay
  this._attachEventListeners();
  this.overlayElement?.classList.add('visible');

  // Re-mount canvas if we have one (after DOM recreation)
  this._remountCanvas();             // Attempt to re-mount canvas
  // ...
}
```

**Problem Sequence**:
1. Old overlay is removed from DOM
2. New overlay is created via `_render()`
3. Canvas should be re-mounted via `_remountCanvas()`

**Potential Issue**: The canvas might have been garbage collected or its reference invalidated after the old DOM was destroyed.

---

### FAILURE POINT 4: `_remountCanvas()` Timing Issue

**Location**: `ghost-orbits-panel.js` (lines 142-161)

```javascript
_remountCanvas() {
  if (!this._gameCanvas) {
    console.log('[GhostOrbitsPanel] _remountCanvas: No canvas reference');
    return;  // SILENT FAILURE if canvas ref is null
  }

  const mount = this.getArenaContainer();
  console.log('[GhostOrbitsPanel] _remountCanvas: mount element exists:', !!mount,
    'canvas parent:', this._gameCanvas.parentNode?.className);

  if (mount && this._gameCanvas.parentNode !== mount) {
    if (this._gameCanvas.parentNode) {
      this._gameCanvas.parentNode.removeChild(this._gameCanvas);
    }
    mount.appendChild(this._gameCanvas);
    console.log('[GhostOrbitsPanel] Canvas re-mounted to:', mount.className,
      'canvas in DOM:', document.body.contains(this._gameCanvas));
  } else if (!mount) {
    console.warn('[GhostOrbitsPanel] _remountCanvas: No mount point found!');  // LOGGED BUT NO RECOVERY
  }
}
```

**Failure Modes**:
1. `this._gameCanvas` is null (canvas reference never set or lost)
2. `getArenaContainer()` returns null (mount point not in DOM)
3. Canvas is orphaned (its parent was destroyed but canvas wasn't re-mounted)

---

### FAILURE POINT 5: CSS Visibility Issues

**Location**: `ghost-orbits-panel.js` (lines 1764-1783)

```css
.ghost-orbits-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* ... */
  opacity: 0;              /* STARTS INVISIBLE */
  visibility: hidden;      /* STARTS HIDDEN */
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.ghost-orbits-overlay.visible {
  opacity: 1;
  visibility: visible;
}
```

**Problem**: The overlay starts hidden. If `.visible` class is not added, nothing renders.

**Verification**: Check if `overlayElement.classList.add('visible')` is called in `showGameView()`.

**Status**: Line 505 does add the visible class:
```javascript
this.overlayElement?.classList.add('visible');
```

However, the optional chaining (`?.`) means if `overlayElement` is null, this silently does nothing.

---

### FAILURE POINT 6: Canvas Mount Has Zero Dimensions

**Location**: `ghost-orbits-panel.js` (lines 1965-1974)

```css
.orbits-arena-canvas-mount {
  width: 100%;
  height: 100%;
  max-width: 1000px;
  max-height: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
```

**Problem**: The mount uses `width: 100%` and `height: 100%`. If its parent container (`.orbits-arena-container`) has zero dimensions, the canvas mount will also be 0x0.

**Parent CSS** (lines 1950-1963):
```css
.orbits-arena-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  /* ... */
}
```

**Issue**: `flex: 1` only expands if the parent (`.ghost-orbits-overlay`) is a flex container with proper dimensions. If the overlay's flex layout breaks, children collapse to 0.

---

### FAILURE POINT 7: Different Views Have Different DOM Structures

Each view in the panel creates completely different HTML:

| View | HTML Structure | Has Canvas Mount? |
|------|---------------|-------------------|
| Game (default) | Header + `.orbits-arena-container` + Footer | YES |
| Lobby | `.orbits-lobby-view` only | NO |
| Eliminated | `.orbits-eliminated-view` only | NO |
| Winner | `.orbits-winner-view` only | NO |
| Spectator | Same as Game (re-rendered) | YES (after remount) |
| Connecting | `.orbits-connecting-view` only | NO |
| Error | `.orbits-error-view` only | NO |

**Critical Issue**: Only Game and Spectator views have the canvas mount point. All other views destroy it.

---

## Tracing the Arena Entry Flow

### Expected Flow:
1. User clicks "Enter Arena" in lobby view
2. `_showEntryConfirmDialog()` shows confirmation
3. User confirms, `sendArenaJoin()` + `onEnterArena()` called
4. Server responds with `arena_joined` message
5. `_handleArenaJoined()` calls `showGameView()`
6. `showGameView()` re-renders game DOM and calls `_remountCanvas()`
7. Canvas should be visible

### Actual Flow Issues:

**Issue A**: Between steps 1-5, the panel is still showing lobby view (no canvas mount).

**Issue B**: At step 6, `showGameView()` destroys and recreates the entire overlay DOM.

**Issue C**: If `_remountCanvas()` fails silently, the canvas never appears.

---

## Debugging Checklist

Add these console logs to verify each step:

### In `ghost-orbits-controller.js`:
```javascript
// After renderer init (line 227):
console.log('[DEBUG] Renderer canvas:', this.renderer.canvas);
console.log('[DEBUG] Canvas in DOM:', document.body.contains(this.renderer.canvas));
console.log('[DEBUG] Canvas parent:', this.renderer.canvas.parentNode);
```

### In `ghost-orbits-panel.js`:

**In `showGameView()` (after line 508)**:
```javascript
const mount = this.getArenaContainer();
console.log('[DEBUG] After remount:');
console.log('  - Mount point exists:', !!mount);
console.log('  - Canvas reference exists:', !!this._gameCanvas);
console.log('  - Canvas in DOM:', this._gameCanvas && document.body.contains(this._gameCanvas));
console.log('  - Canvas dimensions:', this._gameCanvas?.width, 'x', this._gameCanvas?.height);
console.log('  - Mount dimensions:', mount?.offsetWidth, 'x', mount?.offsetHeight);
```

**In `_remountCanvas()` (add at start)**:
```javascript
console.log('[DEBUG] _remountCanvas called');
console.log('  - this._gameCanvas:', this._gameCanvas);
console.log('  - overlayElement:', this.overlayElement);
console.log('  - overlayElement.innerHTML length:', this.overlayElement?.innerHTML?.length);
```

---

## Root Cause Hypothesis

Based on the code analysis, the most likely causes are:

### Primary Hypothesis: Canvas Reference Lost After DOM Destruction

When `_renderLobbyView()` or any non-game view is shown, it replaces `overlayElement.innerHTML`, which:
1. Destroys the canvas mount point
2. May orphan the canvas element (still exists in memory but detached from DOM)
3. The canvas reference (`_gameCanvas`) should still be valid, but the mount point is gone

When `showGameView()` is later called:
1. New overlay DOM is created with fresh `.orbits-arena-canvas-mount`
2. `_remountCanvas()` should re-attach the canvas
3. **BUT**: If the canvas's original parent was destroyed, and the canvas is detached, the renderer's internal state may be inconsistent

### Secondary Hypothesis: ResizeObserver Issues

In `ghost-orbits-renderer.js` (lines 660-662):
```javascript
if (this.canvas.parentElement) {
  resizeObserver.observe(this.canvas.parentElement);
}
```

The ResizeObserver is set up once on the original parent. After the canvas is re-mounted to a new parent:
1. The ResizeObserver is still watching the OLD (now destroyed) parent
2. The canvas scale transform may not be applied correctly
3. The canvas could be scaled to 0 or have wrong transform origin

---

## Recommended Fixes

### Fix 1: Don't Destroy Game View DOM When Switching Away

Instead of replacing `innerHTML`, use CSS to show/hide views:

```javascript
showLobbyView() {
  this.currentView = 'lobby';
  this._hideAllViews();
  this._ensureLobbyView();  // Create lobby view if not exists, append as sibling
  this.lobbyViewElement.style.display = 'flex';
}

showGameView() {
  this.currentView = 'game';
  this._hideAllViews();
  this.gameViewElement.style.display = 'flex';  // Game view always exists
  this._remountCanvas();  // Canvas mount point always in gameViewElement
}
```

### Fix 2: Re-setup ResizeObserver After Remount

In `_remountCanvas()`, after appending canvas:
```javascript
if (this._gameCanvas.parentElement) {
  // Tell renderer to re-setup resize observer for new parent
  // (requires adding a method to renderer)
  if (window.ghostOrbitsRenderer) {
    window.ghostOrbitsRenderer.reattachResizeObserver();
  }
}
```

### Fix 3: Add Defensive Canvas Recreation

If canvas reference is lost or corrupted, recreate it:
```javascript
_remountCanvas() {
  if (!this._gameCanvas || !document.body.contains(this._gameCanvas)) {
    console.warn('[GhostOrbitsPanel] Canvas invalid, requesting recreation');
    // Emit event or call callback to trigger renderer recreation
    return;
  }
  // ... existing remount logic
}
```

---

## Summary of Failure Points

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| 1 | `getArenaContainer()` | Returns null if overlay not rendered | HIGH |
| 2 | `_renderLobbyView()` | Destroys canvas mount with innerHTML | CRITICAL |
| 3 | `showGameView()` | Removes and recreates entire DOM | HIGH |
| 4 | `_remountCanvas()` | Silent failure if canvas/mount null | MEDIUM |
| 5 | CSS `.ghost-orbits-overlay` | Starts hidden, needs .visible class | MEDIUM |
| 6 | CSS `.orbits-arena-canvas-mount` | May have 0 dimensions | MEDIUM |
| 7 | View structure differences | Only game/spectator views have mount | CRITICAL |

---

## Files Analyzed

- `platform/game/ghost-orbits-panel.js` (3090 lines) - Panel UI component
- `platform/game/ghost-orbits-controller.js` - Controller that manages panel and renderer
- `platform/core/ghost-orbits-renderer.js` - Canvas rendering engine

---

## Next Steps for Debugging

1. Add the suggested console.log statements
2. Reproduce the issue and capture browser console output
3. Check if canvas element exists in DOM inspector after entering arena
4. Check computed styles of `.orbits-arena-canvas-mount` for dimensions
5. Verify ResizeObserver is watching the correct parent element
6. Test if canvas renders correctly when game view is shown first (never showing lobby)
