# Ghost Phase 4: Single Ghost Visualization Specification

## Overview

Phase 4 adds visual representation of the student's ghost in the 3D maze environment. The ghost appears as a glowing sphere positioned at the current level node, with its color and opacity reflecting the student's proficiency and engagement level.

## Dependencies

- **Phase 1**: `ghost-engine.js`, `ghost-network.js` - Ghost profile management and visual property calculation
- **Phase 3**: `ghost-maze-generator.js`, `ghost-maze-renderer.js` - 3D maze structure and rendering

## Visual Properties

### Ghost Color (Proficiency)

Colors map to proficiency score from `GhostEngine.calculateColor()`:

| Proficiency Range | Color | Hex Code | Description |
|-------------------|-------|----------|-------------|
| 0.0 - 0.2 | White | `#ffffff` | Novice |
| 0.2 - 0.4 | Yellow | `#ffff44` | Emerging |
| 0.4 - 0.6 | Orange | `#ff8844` | Developing |
| 0.6 - 0.8 | Red | `#ff4444` | Proficient |
| 0.8 - 1.0 | Indigo | `#8844ff` | Mastery |

### Ghost Opacity (Engagement)

Opacity maps to interaction count from `GhostEngine.calculateOpacity()`:

| Interactions | Opacity | Description |
|--------------|---------|-------------|
| 0 | 0.1 | Barely visible (new user) |
| 25 | 0.325 | Faint |
| 50 | 0.55 | Translucent |
| 75 | 0.775 | Mostly solid |
| 100+ | 1.0 | Fully solid (highly engaged) |

Formula: `opacity = min(0.1 + (interactions / 100) * 0.9, 1.0)`

## Ghost Sphere Rendering

### Geometry

```javascript
// Core sphere (inner)
const coreGeometry = new THREE.SphereGeometry(0.8, 32, 32);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: ghostColor,
  transparent: true,
  opacity: ghostOpacity
});

// Glow sphere (outer, larger, fainter)
const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
  color: ghostColor,
  transparent: true,
  opacity: ghostOpacity * 0.3,
  side: THREE.BackSide
});
```

### Positioning

- Ghost positioned at current level node's 3D coordinates
- Y offset of +2 units above node platform for visibility
- Idle bobbing animation: `position.y += Math.sin(time * 2) * 0.005`

## Ghost Movement Animation

### Trigger

Movement is triggered when:
1. Student manually selects a new level (mode change)
2. Student auto-advances after mastering current level (10 gold stars)
3. Student advances after viewing grading feedback

### Path Calculation

Movement follows the edge/bridge geometry between nodes:

```javascript
// Get bridge curve between nodes (matches edge rendering)
const fromPos = new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z);
const toPos = new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z);

// Midpoint with sag (catenary effect)
const mid = fromPos.clone().lerp(toPos, 0.5);
mid.y -= 1.5;

// Quadratic bezier curve
const curve = new THREE.QuadraticBezierCurve3(fromPos, mid, toPos);
```

### Animation Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Duration | 2000ms | Total animation time |
| Easing | ease-in-out | Smooth start and end |
| Height Offset | +2 units | Maintains clearance above platforms |
| Curve Samples | 100 | Points along bezier for smooth motion |

### Easing Function

```javascript
// Ease-in-out (cubic)
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

## Gold Star Celebration

When a gold star is earned, the ghost performs a celebration effect:

### Glow Pulse

```javascript
// Pulse emissive intensity
const pulseIntensity = 0.5 + Math.sin(time * 10) * 0.3; // Rapid pulsing
// Duration: 1.5 seconds
// Peak intensity: 0.8
```

### Particle Burst (Optional, Higher Quality)

- 20-30 small spheres emitted radially
- Same color as ghost
- Fade out over 1 second
- Velocity: 2-4 units/second outward

## State Integration

### Profile Loading

On cartridge load, maze renderer receives ghost profile:

```javascript
// In app.html loadCartridge()
GhostEngine.initGhost(username, cartridgeId).then(profile => {
  if (mazeRenderer) {
    mazeRenderer.updateGhost(profile);
  }
});
```

### Mode Change Handling

```javascript
// When platform.setMode() is called
document.addEventListener('platform:modeChanged', (e) => {
  const { fromModeId, toModeId } = e.detail;

  if (mazeRenderer && ghostProfile) {
    // Update ghost's current level
    ghostProfile.currentLevel = toModeId;

    // Animate movement if both nodes exist
    if (fromModeId && toModeId) {
      mazeRenderer.animateGhostTo(toModeId, fromModeId);
    } else {
      mazeRenderer.updateGhost(ghostProfile);
    }
  }
});
```

### Star Earned Handling

```javascript
document.addEventListener('platform:starEarned', (e) => {
  const { starType, modeId } = e.detail;

  if (starType === 'gold' && mazeRenderer) {
    mazeRenderer.celebrateGhost();
  }
});
```

## API Additions to MazeRenderer

### New Methods

```javascript
/**
 * Animate ghost movement to a new node
 * @param {string} toNodeId - Target node ID
 * @param {string} fromNodeId - Source node ID (optional, uses current if omitted)
 * @param {number} duration - Animation duration in ms (default: 2000)
 * @returns {Promise<void>} Resolves when animation completes
 */
animateGhostTo(toNodeId, fromNodeId = null, duration = 2000)

/**
 * Trigger celebration animation on ghost
 * @param {string} type - 'gold' | 'silver' | 'bronze' | 'tin'
 */
celebrateGhost(type = 'gold')

/**
 * Get current ghost position
 * @returns {{x: number, y: number, z: number} | null}
 */
getGhostPosition()
```

### New State Properties

```javascript
// In MazeRenderer
this.ghostAnimation = {
  isAnimating: false,
  startTime: 0,
  duration: 0,
  curve: null,
  fromNode: null,
  toNode: null
};

this.ghostCelebration = {
  isActive: false,
  startTime: 0,
  type: null
};
```

## Event Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        GHOST VISUALIZATION                        │
└──────────────────────────────────────────────────────────────────┘

Cartridge Load:
  app.html                      GhostEngine                MazeRenderer
     │                              │                           │
     ├─ loadCartridge() ───────────>│                           │
     │                              │                           │
     │<── initGhost(user, cart) ────│                           │
     │                              │                           │
     ├─ profile ────────────────────┼──────── updateGhost() ───>│
     │                              │                           │
     │                              │             ghost appears at currentLevel

Mode Change:
  User Click                   platform.js                 MazeRenderer
     │                              │                           │
     ├─ setMode(newId) ────────────>│                           │
     │                              │                           │
     │<── modeChanged event ────────│                           │
     │                              │                           │
     ├──────────────────────────────┼─ animateGhostTo(new) ────>│
     │                              │                           │
     │                              │          ghost moves along curve

Gold Star:
  GameEngine                    app.html                  MazeRenderer
     │                              │                           │
     ├─ starEarned(gold) ──────────>│                           │
     │                              │                           │
     │<─────────────────────────────┼── celebrateGhost() ──────>│
     │                              │                           │
     │                              │              ghost pulses + particles
```

## Testing Requirements

### Unit Tests (`tests/core/ghost-visualization.test.js`)

1. **Color Calculation**
   - Test `getGhostColor()` returns correct hex for all proficiency ranges
   - Test boundary conditions (0.0, 0.2, 0.4, 0.6, 0.8, 1.0)

2. **Opacity Calculation**
   - Test `getGhostOpacity()` returns correct value for interaction counts
   - Test cap at 1.0 for 100+ interactions
   - Test minimum 0.1 for 0 interactions

3. **Movement Path Interpolation**
   - Test `interpolateMovementPath()` returns correct bezier points
   - Test easing function produces smooth curve
   - Test midpoint sag calculation

4. **State Synchronization**
   - Test ghost position updates when mode changes
   - Test ghost profile loads correctly on cartridge change
   - Test celebration triggers on gold star

### Integration Tests

1. **Render Pipeline**
   - Ghost mesh added to scene correctly
   - Ghost removed and re-added on profile change
   - Ghost position matches node position

2. **Animation Flow**
   - Animation completes in specified duration
   - Animation can be interrupted by new movement
   - Animation handles missing nodes gracefully

## Performance Considerations

- Ghost sphere uses `MeshBasicMaterial` (no lighting calculations)
- Glow uses `BackSide` rendering for outer glow effect
- Bobbing animation uses simple sine wave (no physics)
- Particle burst limited to 30 particles, reuses geometry
- Animation uses `requestAnimationFrame` timing

## Browser Compatibility

- Requires WebGL support (checked in `_detectWebGL()`)
- Falls back gracefully if Three.js not loaded
- Graceful degradation if ghost engine not initialized

## File Changes Summary

### Modified Files

1. **`platform/core/ghost-maze-renderer.js`**
   - Add `animateGhostTo()` method
   - Add `celebrateGhost()` method
   - Add `getGhostPosition()` method
   - Enhance `_animateGhost()` for movement animation
   - Add celebration particle system

### New Files

1. **`tests/core/ghost-visualization.test.js`**
   - Unit tests for all ghost visualization features
