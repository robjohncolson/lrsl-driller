# Ghost System Phase 3: 3D Maze Generator

Technical specification for the 3D Maze visualization system using Three.js.

**Status**: Implementation Ready
**Date**: January 2026
**Dependencies**: Phase 1 (Ghost Profile Infrastructure), Phase 2 (Statistical Ghost)

---

## 1. Overview

The 3D Maze transforms the flat progression structure of a cartridge manifest into a navigable Tron-esque 3D space. Each level becomes a platform/node, and `unlockedBy` relationships become glowing bridges connecting them.

### Core Concept

```
Traditional View:            3D Maze View:
L1 → L2 → L3 → L4
     ↓                              [L4] Summit
    L2b                           ↗️
     ↓                       [L3]
    L2c                     ↗️
                     [L2]──[L2b]──[L2c]
                      ↑
                     [L1] Start
```

### Files to Create

| File | Purpose |
|------|---------|
| `platform/core/ghost-maze-generator.js` | Parse manifest into 3D node graph |
| `platform/core/ghost-maze-renderer.js` | Three.js scene rendering |

---

## 2. Three.js Scene Architecture

### 2.1 Scene Setup

```javascript
// Core Three.js objects
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// Tron-esque background
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.FogExp2(0x0a0a12, 0.02);
```

### 2.2 Camera System

**OrbitControls** for exploration:
- Pan: Right-click drag
- Rotate: Left-click drag
- Zoom: Scroll wheel
- Auto-rotation when idle (optional)

**Camera Constraints**:
```javascript
controls.minDistance = 10;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI * 0.85; // Limit vertical rotation
controls.enableDamping = true;
controls.dampingFactor = 0.05;
```

### 2.3 Lighting

Tron aesthetic requires careful lighting:

```javascript
// Ambient glow (very dim)
const ambient = new THREE.AmbientLight(0x111122, 0.3);

// Overhead spotlight (for depth)
const spotLight = new THREE.SpotLight(0x4488ff, 0.5);
spotLight.position.set(0, 50, 0);

// Emissive materials provide most illumination
// (nodes and edges glow on their own)
```

---

## 3. Manifest Parsing Algorithm

### 3.1 Building the Graph

```javascript
/**
 * Parse manifest.json into a directed graph
 * @param {Object} manifest - Cartridge manifest
 * @returns {Object} { nodes: Map, edges: Array }
 */
function buildGraph(manifest) {
  const nodes = new Map();
  const edges = [];

  // Phase 1: Create all nodes
  for (const mode of manifest.modes) {
    nodes.set(mode.id, {
      id: mode.id,
      name: mode.name,
      unlockedBy: mode.unlockedBy,
      tier: 0,           // Calculated in Phase 2
      position: null,    // Calculated in Phase 3
      children: [],
      parents: []
    });
  }

  // Phase 2: Build edges from unlockedBy relationships
  for (const mode of manifest.modes) {
    if (mode.unlockedBy === 'default') {
      // Root node - no incoming edges
      continue;
    }

    // Find the parent(s) that this level requires
    const requirement = mode.unlockedBy;
    if (typeof requirement === 'object' && requirement.gold !== undefined) {
      // Gold star requirement from previous sequential level
      const parentId = findParentForGoldRequirement(nodes, mode.id, requirement.gold);
      if (parentId) {
        edges.push({ from: parentId, to: mode.id, type: 'gold' });
        nodes.get(parentId).children.push(mode.id);
        nodes.get(mode.id).parents.push(parentId);
      }
    }
  }

  // Phase 3: Calculate tier depths (BFS from root nodes)
  calculateTiers(nodes, edges);

  return { nodes, edges };
}
```

### 3.2 Finding Parent Nodes

The `unlockedBy: { gold: N }` pattern means "N gold stars from the cartridge". We need to find which level is the logical parent:

```javascript
function findParentForGoldRequirement(nodes, childId, goldRequired) {
  // Get the index of the child in the modes array
  const modesArray = Array.from(nodes.values());
  const childIndex = modesArray.findIndex(n => n.id === childId);

  // Walk backwards to find the most recent level that could unlock this
  // The parent is the level at index (goldRequired - 1)
  // because level 0 is unlocked by default, level 1 needs gold=1, etc.

  // For sequential progression: parent is the previous level
  if (childIndex > 0) {
    return modesArray[childIndex - 1].id;
  }
  return null;
}
```

### 3.3 Tier Calculation (Depth)

```javascript
function calculateTiers(nodes, edges) {
  // Find root nodes (no parents)
  const roots = Array.from(nodes.values()).filter(n => n.parents.length === 0);

  // BFS to assign tiers
  const queue = roots.map(n => ({ id: n.id, tier: 0 }));
  const visited = new Set();

  while (queue.length > 0) {
    const { id, tier } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes.get(id);
    node.tier = tier;

    for (const childId of node.children) {
      if (!visited.has(childId)) {
        queue.push({ id: childId, tier: tier + 1 });
      }
    }
  }
}
```

---

## 4. Node Positioning Algorithm

### 4.1 Hierarchical Layout

Nodes are positioned in 3D space based on tier (Y-axis) and spread (X/Z plane):

```javascript
const TIER_HEIGHT = 8;        // Vertical spacing between tiers
const NODE_SPREAD = 12;       // Horizontal spacing between nodes
const SPIRAL_FACTOR = 0.3;    // How much to spiral outward per tier

function positionNodes(nodes) {
  // Group nodes by tier
  const tiers = new Map();
  for (const node of nodes.values()) {
    if (!tiers.has(node.tier)) tiers.set(node.tier, []);
    tiers.get(node.tier).push(node);
  }

  // Position each tier
  for (const [tier, tierNodes] of tiers) {
    const count = tierNodes.length;
    const radius = NODE_SPREAD * (1 + tier * SPIRAL_FACTOR);

    tierNodes.forEach((node, index) => {
      if (count === 1) {
        // Center single node
        node.position = new THREE.Vector3(0, tier * TIER_HEIGHT, 0);
      } else {
        // Distribute around a circle
        const angle = (index / count) * Math.PI * 2;
        node.position = new THREE.Vector3(
          Math.cos(angle) * radius,
          tier * TIER_HEIGHT,
          Math.sin(angle) * radius
        );
      }
    });
  }
}
```

### 4.2 Branching Nodes

When multiple levels unlock at the same gold count (like L2 unlocking L3, L4, L5 simultaneously), they're placed at the same tier but spread horizontally:

```
      [L3]
       ↑
[L4]←[L2]→[L5]
       ↑
      [L1]
```

---

## 5. Node Rendering (Platforms)

### 5.1 Node Geometry

Each node is a hexagonal platform with glowing edges:

```javascript
function createNodeMesh(node, playerProgress) {
  const group = new THREE.Group();

  // Hexagonal platform
  const geometry = new THREE.CylinderGeometry(2, 2, 0.5, 6);

  // Material based on unlock state
  const unlocked = isUnlocked(node, playerProgress);
  const completed = playerProgress.completedLevels.has(node.id);
  const current = playerProgress.currentLevel === node.id;

  let color, emissive, emissiveIntensity;
  if (current) {
    color = 0x00ffff;      // Cyan (current)
    emissive = 0x00ffff;
    emissiveIntensity = 0.5;
  } else if (completed) {
    color = 0x00ff88;      // Green (completed)
    emissive = 0x00ff88;
    emissiveIntensity = 0.3;
  } else if (unlocked) {
    color = 0x4488ff;      // Blue (unlocked)
    emissive = 0x4488ff;
    emissiveIntensity = 0.2;
  } else {
    color = 0x333344;      // Gray (locked)
    emissive = 0x111122;
    emissiveIntensity = 0.05;
  }

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    metalness: 0.8,
    roughness: 0.2
  });

  const platform = new THREE.Mesh(geometry, material);
  group.add(platform);

  // Edge glow (ring around platform)
  const ringGeometry = new THREE.TorusGeometry(2.1, 0.08, 8, 6);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: emissive,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.25;
  group.add(ring);

  // Label (level name)
  const label = createTextSprite(node.name);
  label.position.y = 1.5;
  group.add(label);

  group.position.copy(node.position);
  group.userData = { nodeId: node.id, type: 'node' };

  return group;
}
```

### 5.2 Level States Visual Summary

| State | Platform Color | Glow | Edge Ring |
|-------|---------------|------|-----------|
| Locked | Dark gray | Dim | Faint |
| Unlocked | Blue | Medium | Cyan pulse |
| Completed | Green | Medium | Steady green |
| Current | Cyan | Bright | Pulsing white |

---

## 6. Edge Rendering (Bridges/Paths)

### 6.1 Edge Geometry

Edges are glowing lines connecting node centers:

```javascript
function createEdgeMesh(fromNode, toNode, edgeType) {
  const points = [
    fromNode.position.clone(),
    toNode.position.clone()
  ];

  // Add midpoint for curved path (catenary)
  const mid = fromNode.position.clone().lerp(toNode.position, 0.5);
  mid.y -= 2; // Sag in the middle for visual interest

  const curve = new THREE.QuadraticBezierCurve3(
    fromNode.position,
    mid,
    toNode.position
  );

  const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.6
  });

  const tube = new THREE.Mesh(tubeGeometry, material);
  tube.userData = {
    type: 'edge',
    from: fromNode.id,
    to: toNode.id
  };

  return tube;
}
```

### 6.2 Edge Animation

Edges pulse to show "flow" direction from parent to child:

```javascript
// In animation loop
edges.forEach(edge => {
  const time = performance.now() * 0.001;
  const offset = (time % 1);

  // Gradient effect traveling along edge
  edge.material.opacity = 0.4 + Math.sin(offset * Math.PI * 2) * 0.3;
});
```

---

## 7. Tron Aesthetic Details

### 7.1 Color Palette

```javascript
const TRON_COLORS = {
  background: 0x0a0a12,     // Deep blue-black
  grid: 0x112244,           // Subtle grid lines
  nodeLocked: 0x333344,     // Dark gray
  nodeUnlocked: 0x4488ff,   // Electric blue
  nodeCompleted: 0x00ff88,  // Neon green
  nodeCurrent: 0x00ffff,    // Cyan
  edgeDefault: 0x00ffff,    // Cyan
  edgeGold: 0xffdd00,       // Gold (for gold requirements)
  ghostWhite: 0xffffff,
  ghostYellow: 0xffff44,
  ghostOrange: 0xff8844,
  ghostRed: 0xff4444,
  ghostIndigo: 0x8844ff
};
```

### 7.2 Ground Grid

A subtle grid floor provides spatial reference:

```javascript
function createGrid() {
  const gridHelper = new THREE.GridHelper(100, 50, 0x112244, 0x0a1133);
  gridHelper.position.y = -2;
  return gridHelper;
}
```

### 7.3 Particle Trail

When ghost moves, leave a fading particle trail:

```javascript
const particleGeometry = new THREE.BufferGeometry();
const particleMaterial = new THREE.PointsMaterial({
  color: 0x00ffff,
  size: 0.2,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending
});
```

---

## 8. Camera Controls & Navigation

### 8.1 Orbit Controls Setup

```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function setupControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  // Smooth movement
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Limit zoom
  controls.minDistance = 10;
  controls.maxDistance = 100;

  // Limit vertical rotation (don't go under the floor)
  controls.maxPolarAngle = Math.PI * 0.85;

  // Auto-rotate when idle
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.5;

  return controls;
}
```

### 8.2 Focus on Node

Animate camera to focus on a specific node:

```javascript
function focusOnNode(node, camera, controls, duration = 1000) {
  const targetPosition = node.position.clone();
  targetPosition.y += 5;  // Look slightly from above

  const cameraOffset = new THREE.Vector3(10, 8, 10);
  const targetCameraPos = targetPosition.clone().add(cameraOffset);

  // Animate using GSAP or manual tweening
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    camera.position.lerpVectors(startPos, targetCameraPos, eased);
    controls.target.lerpVectors(startTarget, targetPosition, eased);
    controls.update();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
```

### 8.3 Click to Select Node

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(nodeGroup.children, true);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    const nodeId = findNodeId(clicked);
    if (nodeId) {
      focusOnNode(nodes.get(nodeId), camera, controls);
      // Emit event for UI to handle
      dispatchEvent(new CustomEvent('maze-node-selected', { detail: { nodeId } }));
    }
  }
}
```

---

## 9. Ghost Visualization in Maze

### 9.1 Ghost Sphere

The ghost is represented as a glowing sphere at its current level:

```javascript
function createGhostMesh(ghostProfile) {
  const geometry = new THREE.SphereGeometry(0.8, 32, 32);

  // Color from proficiency
  const color = TRON_COLORS[`ghost${capitalize(ghostProfile.color)}`];

  // Opacity from engagement
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: ghostProfile.opacity,
    blending: THREE.AdditiveBlending
  });

  const ghost = new THREE.Mesh(geometry, material);

  // Inner glow
  const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: ghostProfile.opacity * 0.3,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  ghost.add(glow);

  ghost.userData = {
    type: 'ghost',
    username: ghostProfile.username
  };

  return ghost;
}
```

### 9.2 Ghost Positioning

Ghost floats above its current level node:

```javascript
function updateGhostPosition(ghost, currentLevelNode) {
  const targetPos = currentLevelNode.position.clone();
  targetPos.y += 2; // Float above platform

  // Smooth movement
  ghost.position.lerp(targetPos, 0.05);

  // Gentle bobbing
  ghost.position.y += Math.sin(performance.now() * 0.002) * 0.1;
}
```

### 9.3 Multi-Ghost View (Leaderboard Mode)

When showing all class ghosts:

```javascript
function renderAllGhosts(ghosts, nodes) {
  const ghostGroup = new THREE.Group();

  ghosts.forEach((profile, index) => {
    const ghost = createGhostMesh(profile);

    // Find the node for this ghost's current level
    const node = nodes.get(profile.currentLevel);
    if (node) {
      ghost.position.copy(node.position);
      ghost.position.y += 2 + (index % 3) * 0.5; // Stack slightly if multiple on same node
    }

    ghostGroup.add(ghost);
  });

  return ghostGroup;
}
```

---

## 10. Performance Considerations

### 10.1 School Laptop Constraints

Target specs:
- Intel HD Graphics 4000 or equivalent
- 4GB RAM
- 720p display

### 10.2 Optimization Strategies

**1. Instance Rendering**
Use instanced meshes for identical node geometry:

```javascript
const nodeGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 6);
const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff });
const instancedNodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
```

**2. Level of Detail (LOD)**
Reduce detail for distant nodes:

```javascript
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 20);
lod.addLevel(lowDetailMesh, 50);
```

**3. Limit Particle Count**
Cap particles at 500:

```javascript
const MAX_PARTICLES = 500;
if (particles.length > MAX_PARTICLES) {
  particles.shift(); // Remove oldest
}
```

**4. Throttle Animation**
Use `requestAnimationFrame` with frame limiting:

```javascript
const TARGET_FPS = 30;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrame = 0;

function animate(time) {
  if (time - lastFrame >= FRAME_TIME) {
    render();
    lastFrame = time;
  }
  requestAnimationFrame(animate);
}
```

**5. WebGL Fallback Detection**

```javascript
function detectWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// If no WebGL, show 2D fallback
if (!detectWebGLSupport()) {
  renderFlatMaze(); // 2D canvas fallback
}
```

### 10.3 Memory Management

```javascript
// Dispose of unused resources
function dispose() {
  scene.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
  renderer.dispose();
}
```

---

## 11. File Structure

### 11.1 ghost-maze-generator.js

```javascript
// Core exports
export function parseManifest(manifest) → { nodes, edges }
export function positionNodes(nodes, edges) → void
export function calculateProgress(nodes, playerData) → progressMap
export function getNodeById(nodes, id) → node
export function getChildNodes(nodes, nodeId) → node[]
export function getParentNodes(nodes, nodeId) → node[]
```

### 11.2 ghost-maze-renderer.js

```javascript
// Core exports
export class MazeRenderer {
  constructor(container, manifest, playerProgress)
  init() → Promise<void>
  render() → void
  focusOnNode(nodeId) → void
  updateGhost(ghostProfile) → void
  showAllGhosts(ghostProfiles) → void
  setQuality(level) → void  // 'low', 'medium', 'high'
  dispose() → void
}

// Events emitted
// 'maze-node-selected' - { detail: { nodeId } }
// 'maze-ready' - { detail: {} }
// 'maze-error' - { detail: { error } }
```

---

## 12. Integration with app.html

### 12.1 Adding Three.js CDN

```html
<!-- Three.js core -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<!-- OrbitControls -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
```

### 12.2 Maze Container

```html
<div id="maze-container" class="hidden fixed inset-0 z-50 bg-black">
  <canvas id="maze-canvas"></canvas>
  <button id="maze-close" class="absolute top-4 right-4 text-white text-2xl">X</button>
</div>
```

### 12.3 Toggle Button

```html
<button id="maze-toggle" class="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg" title="3D Maze">
  <span class="text-base">&#x1F5FA;</span> <!-- Map emoji -->
</button>
```

### 12.4 Initialization

```javascript
import { MazeRenderer } from './core/ghost-maze-renderer.js';

let mazeRenderer = null;

async function initMaze() {
  const container = document.getElementById('maze-container');
  const manifest = currentCartridge.manifest;
  const progress = gameEngine.getProgress();

  mazeRenderer = new MazeRenderer(container, manifest, progress);
  await mazeRenderer.init();

  // Focus on current level
  const currentLevel = gameEngine.getCurrentMode();
  mazeRenderer.focusOnNode(currentLevel);

  // Update ghost position
  const ghostProfile = GhostEngine.getGhostProfile();
  if (ghostProfile) {
    mazeRenderer.updateGhost(ghostProfile);
  }
}
```

---

## 13. State Machine

```
                    ┌─────────────────────────────────────┐
                    │           MAZE STATES               │
                    └─────────────────────────────────────┘

    ┌──────────┐     loadManifest()      ┌───────────┐
    │  IDLE    │ ──────────────────────> │  LOADING  │
    └──────────┘                         └───────────┘
         ▲                                     │
         │                                     │ parseComplete
         │ dispose()                           ▼
         │                               ┌───────────┐
         └────────────────────────────── │  READY    │
                                         └───────────┘
                                               │
                                               │ render()
                                               ▼
                                         ┌───────────┐
                                         │ RENDERING │ ◄─────┐
                                         └───────────┘       │
                                               │             │ animate
                                               └─────────────┘
```

---

## 14. Testing Strategy

### 14.1 Unit Tests (ghost-maze-generator.test.js)

```javascript
describe('MazeGenerator', () => {
  describe('parseManifest', () => {
    it('creates nodes for each mode');
    it('creates edges for unlockedBy relationships');
    it('handles default unlock (root nodes)');
    it('handles gold count requirements');
    it('handles branching progression');
    it('calculates correct tier depths');
  });

  describe('positionNodes', () => {
    it('positions root nodes at tier 0');
    it('spaces nodes in same tier around circle');
    it('single node in tier is centered');
    it('increases radius with tier depth');
  });

  describe('calculateProgress', () => {
    it('marks completed levels');
    it('marks current level');
    it('determines unlock status');
  });
});
```

### 14.2 Integration Tests

```javascript
describe('MazeRenderer', () => {
  it('initializes Three.js scene');
  it('renders nodes with correct states');
  it('renders edges between connected nodes');
  it('responds to node click');
  it('animates camera focus');
  it('updates ghost position');
  it('handles resize events');
  it('cleans up on dispose');
});
```

---

## 15. Future Enhancements (Phase 4+)

1. **Ghost Animation**: Animate ghost moving between levels on completion
2. **Path Highlighting**: Show optimal path through maze
3. **Time Visualization**: Color nodes by time spent
4. **Hint Density**: Visualize where hints are used most
5. **Class Heatmap**: Show where students cluster
6. **Battle Replay**: Animate ghost battles through the maze

---

*This specification provides the foundation for Phase 3 implementation. The modular design allows for iterative enhancement while maintaining performance on constrained hardware.*
