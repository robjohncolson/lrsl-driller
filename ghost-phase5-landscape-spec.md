# Ghost Phase 5: Multi-Ghost Landscape (Class View) Specification

## Overview

Phase 5 adds a class-wide ghost visualization showing all students' ghosts in the same 3D maze environment. Teachers can see where students are positioned in the progression, identify clustering patterns, and click on any ghost to view details.

## Dependencies

- **Phase 1**: `ghost-engine.js`, `ghost-network.js` - Ghost profile management
- **Phase 3**: `ghost-maze-generator.js` - 3D maze structure
- **Phase 4**: `ghost-maze-renderer.js` - Single ghost visualization

## API Endpoint

### GET /api/ghost/:cartridgeId/leaderboard

Returns all ghost profiles for a cartridge, optionally filtered by class period.

**Query Parameters:**
- `class_period` (optional) - Filter by class period (A-G)

**Response:**
```json
{
  "ghosts": [
    {
      "username": "student1",
      "total_interactions": 45,
      "proficiency_score": 0.72,
      "color": "red",
      "opacity": 0.505,
      "updated_at": "2026-01-27T10:30:00Z"
    },
    ...
  ]
}
```

## Multi-Ghost Display

### Ghost Clustering Algorithm

When multiple ghosts occupy the same node, they are clustered to avoid overlap:

```javascript
/**
 * Calculate clustered positions for ghosts at same node
 * @param {Array} ghosts - Ghosts at this node
 * @param {Object} nodePosition - Base node position {x, y, z}
 * @returns {Array} Array of adjusted positions
 */
function calculateClusterPositions(ghosts, nodePosition) {
  const count = ghosts.length;
  const CLUSTER_RADIUS = 1.2;      // Radius for circular arrangement
  const VERTICAL_OFFSET = 2.0;     // Base height above node
  const VERTICAL_SPACING = 0.4;   // Additional height per row
  const GHOSTS_PER_RING = 6;      // Max ghosts per ring before stacking

  const positions = [];

  for (let i = 0; i < count; i++) {
    const ring = Math.floor(i / GHOSTS_PER_RING);
    const indexInRing = i % GHOSTS_PER_RING;
    const ringCount = Math.min(count - ring * GHOSTS_PER_RING, GHOSTS_PER_RING);

    const angle = (indexInRing / ringCount) * Math.PI * 2;
    const radius = count === 1 ? 0 : CLUSTER_RADIUS * (1 + ring * 0.5);

    positions.push({
      x: nodePosition.x + Math.cos(angle) * radius,
      y: nodePosition.y + VERTICAL_OFFSET + ring * VERTICAL_SPACING,
      z: nodePosition.z + Math.sin(angle) * radius
    });
  }

  return positions;
}
```

### Node Glow Intensity (Heat Map)

Nodes with more ghosts glow brighter to show clustering:

| Ghost Count | Glow Intensity | Description |
|-------------|----------------|-------------|
| 0 | Base | No students at this level |
| 1-2 | 1.2x | Light activity |
| 3-5 | 1.5x | Moderate activity |
| 6-10 | 1.8x | High activity |
| 11+ | 2.0x | Hotspot |

```javascript
/**
 * Calculate node glow intensity based on ghost count
 * @param {number} ghostCount - Number of ghosts at this node
 * @returns {number} Intensity multiplier (1.0 - 2.0)
 */
function calculateNodeGlowIntensity(ghostCount) {
  if (ghostCount === 0) return 1.0;
  if (ghostCount <= 2) return 1.2;
  if (ghostCount <= 5) return 1.5;
  if (ghostCount <= 10) return 1.8;
  return 2.0;
}
```

### Ghost Appearance in Class View

Each ghost maintains its individual appearance (color/opacity) but is scaled down slightly in class view:

| Property | Single Ghost | Class View |
|----------|-------------|------------|
| Core radius | 0.8 | 0.5 |
| Glow radius | 1.2 | 0.75 |
| Opacity | 100% of profile | 80% of profile |

## Camera Controls for Class View

### Overview Camera Position

When entering class view, camera adjusts to see entire maze:

```javascript
/**
 * Calculate overview camera position
 * @param {Map} nodes - All nodes in maze
 * @returns {Object} Camera position and target
 */
function calculateOverviewCamera(nodes) {
  // Find bounding box of all nodes
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const node of nodes.values()) {
    if (!node.position) continue;
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
    minZ = Math.min(minZ, node.position.z);
    maxZ = Math.max(maxZ, node.position.z);
  }

  // Calculate center and distance
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const maxSpan = Math.max(spanX, spanY, spanZ);

  // Position camera at 45-degree angle
  const distance = maxSpan * 1.5;

  return {
    position: {
      x: centerX + distance * 0.7,
      y: centerY + distance * 0.5,
      z: centerZ + distance * 0.7
    },
    target: { x: centerX, y: centerY, z: centerZ }
  };
}
```

### Ghost Click Interaction

When clicking a ghost in class view:

1. Ghost highlights (brief pulse animation)
2. Camera smoothly focuses on the ghost
3. Tooltip appears showing ghost details

### Ghost Info Tooltip

Displayed when hovering or clicking a ghost:

```
+------------------------+
| @student_username      |
| Proficiency: 72%       |
| Interactions: 45       |
| Current Level: L7      |
| Last Active: 2h ago    |
+------------------------+
```

## New Methods Added to MazeRenderer

### showAllGhosts(ghostProfiles, options)

Enhanced version of the existing method with clustering support:

```javascript
/**
 * Display all ghosts in class view mode
 * @param {Array} ghostProfiles - Array of ghost profile objects
 * @param {Object} options - Display options
 * @param {boolean} options.showLabels - Show username labels (default: true for teacher)
 * @param {boolean} options.heatmap - Show node heat map glow (default: true)
 */
showAllGhosts(ghostProfiles, options = {})
```

### focusOnGhost(username)

Focus camera on a specific ghost:

```javascript
/**
 * Focus camera on a specific ghost
 * @param {string} username - Username of ghost to focus on
 * @param {number} duration - Animation duration in ms (default: 1000)
 * @returns {Object|null} Ghost profile if found
 */
focusOnGhost(username, duration = 1000)
```

### getGhostAtPosition(screenX, screenY)

Raycast to find ghost at screen coordinates:

```javascript
/**
 * Get ghost at screen position (for click handling)
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @returns {Object|null} Ghost profile or null
 */
getGhostAtPosition(screenX, screenY)
```

### setClassViewMode(enabled)

Toggle between single ghost and class view:

```javascript
/**
 * Toggle class view mode
 * @param {boolean} enabled - Enable class view mode
 */
setClassViewMode(enabled)
```

### updateNodeGlow(ghostsByNode)

Update node glow based on ghost density:

```javascript
/**
 * Update node glow intensity based on ghost clustering
 * @param {Map} ghostsByNode - Map of nodeId to ghost array
 */
updateNodeGlow(ghostsByNode)
```

## New State Properties

```javascript
// In MazeRenderer
this.classViewMode = false;
this.classGhosts = [];           // Array of {profile, mesh, label}
this.ghostsByNode = new Map();   // Map<nodeId, profile[]>
this.selectedGhost = null;       // Currently focused ghost username
this.ghostTooltip = null;        // DOM element for tooltip
```

## Event Flow

### Loading Class View

```
Teacher clicks "Class View"
         |
         v
fetchGhostLeaderboard(cartridgeId, classPeriod)
         |
         v
mazeRenderer.showAllGhosts(ghosts, {showLabels: true})
         |
         v
calculateClusterPositions() for each node
         |
         v
updateNodeGlow(ghostsByNode)
         |
         v
setOverviewCamera()
```

### Ghost Selection

```
Teacher clicks in 3D view
         |
         v
getGhostAtPosition(x, y)
         |
         v
if ghost found:
    focusOnGhost(username)
    showGhostTooltip(profile)
```

## Integration with app.html

### Teacher UI Addition

Add class view toggle button near the maze toggle:

```html
<button id="class-view-toggle"
        class="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg hidden"
        title="Class Ghost View">
  <span class="text-base">&#x1F47B;</span> <!-- Ghost emoji -->
  <span class="text-xs">Class</span>
</button>
```

### Event Handler

```javascript
document.getElementById('class-view-toggle')?.addEventListener('click', async () => {
  if (!mazeRenderer || !isTeacher) return;

  const cartridgeId = getCurrentCartridgeId();
  const classPeriod = currentPeriod;

  try {
    const response = await fetch(
      `${serverBaseUrl}/api/ghost/${cartridgeId}/leaderboard?class_period=${classPeriod}`
    );
    const { ghosts } = await response.json();

    mazeRenderer.setClassViewMode(true);
    mazeRenderer.showAllGhosts(ghosts, {
      showLabels: true,
      heatmap: true
    });
  } catch (err) {
    console.error('[ClassView] Failed to load ghosts:', err);
  }
});
```

## Testing Requirements

### Unit Tests (tests/core/ghost-landscape.test.js)

1. **Ghost Clustering**
   - Single ghost centered on node
   - Multiple ghosts arranged in circle
   - Large groups form multiple rings
   - Vertical spacing between rings

2. **Node Glow Calculation**
   - Base intensity for empty nodes
   - Increasing intensity with ghost count
   - Cap at maximum intensity

3. **Overview Camera**
   - Camera sees all nodes
   - Maintains correct aspect ratio
   - Target is maze center

4. **Ghost Selection**
   - Raycast finds correct ghost
   - Returns null for empty area
   - Handles overlapping ghosts

5. **Leaderboard Data Parsing**
   - Handles empty array
   - Sorts by proficiency
   - Filters by class period
   - Handles missing fields

## Performance Considerations

- **Ghost limit**: Cap at 50 ghosts in view to maintain performance
- **LOD for distant ghosts**: Simplified geometry beyond 50 units
- **Instanced rendering**: Use InstancedMesh for ghost spheres
- **Tooltip DOM**: Single reusable DOM element, repositioned as needed
- **Debounced hover**: 100ms debounce on tooltip updates

## Browser Compatibility

- Same as Phase 4 (WebGL required)
- Tooltip uses CSS positioning (widely supported)
- Event delegation for click handling

## File Changes Summary

### Modified Files

1. **`platform/core/ghost-maze-renderer.js`**
   - Add `showAllGhosts()` method with clustering
   - Add `focusOnGhost()` method
   - Add `getGhostAtPosition()` method
   - Add `setClassViewMode()` method
   - Add `updateNodeGlow()` method
   - Add clustering helper functions
   - Add tooltip management

2. **`platform/app.html`**
   - Add class view toggle button (teacher only)
   - Add event handler for class view
   - Add tooltip CSS styles

### New Files

1. **`tests/core/ghost-landscape.test.js`**
   - Unit tests for all Phase 5 features

---

*This specification builds on Phases 1-4 to provide teachers with a class-wide visualization of student progress through the ghost metaphor.*
