# Rendering Fix Spec: Z-Fighting, Wireframe Clipping, Label Occlusion

**File to modify:** `standalone/math-viz/index.html` (single file, ~5158 lines)

This spec fixes three rendering issues visible when orbiting the 3D modes (Perfect Cubes, a³+b³, a³−b³). All changes are within the existing mode classes.

---

## Issue 1: Z-Fighting (Coplanar Geometry)

### Root Cause

Original solid cubes remain partially visible (low but nonzero opacity) at the same spatial coordinates as decomposed slabs/blocks, causing the GPU depth buffer to flicker between both surfaces.

### Affected Code

**SumCubesMode `applyVisualTargets()`** (~line 3383):
```js
// CURRENT — leaves opacity > 0 even when split/slab are fully active
this.primaryCube.material.opacity = 0.88 * (1 - 0.9 * targets.split) * (1 - 0.25 * targets.anchor);
this.secondaryCube.material.opacity = 0.88 * (1 - 0.95 * targets.slab1) * (1 - 0.25 * targets.anchor);
this.block1.material.opacity = 0.9 * targets.split * (1 - 0.93 * slab2SlideT);
this.block2.material.opacity = 0.9 * targets.split * (1 - 0.93 * slab2SlideT);
this.block3.material.opacity = 0.9 * targets.split * (1 - 0.95 * targets.slab1);
```

**DiffCubesMode `applyVisualTargets()`** (~line 3986):
```js
// CURRENT — cubeFill never fully disappears
this.cubeFill.material.opacity = 0.72 * (1 - 0.96 * targets.decompose);
// slabs start at 0.06 opacity even when decompose=0
slab.material.opacity = 0.06 + 0.82 * targets.decompose;
```

### Fix: Use `mesh.visible` as a Hard Switch

Instead of fading opacity to near-zero, use `mesh.visible = false` to completely remove the mesh from the render pipeline once it is no longer needed. This eliminates ALL Z-fighting because an invisible mesh produces zero fragments.

**SumCubesMode — replace the opacity block with:**
```js
// Hard visibility: original cubes OFF when split begins, blocks OFF when slabs take over
const showPrimary = targets.split < 0.01;
const showSecondary = targets.slab1 < 0.01;
this.primaryCube.visible = showPrimary || targets.split < 1;
this.secondaryCube.visible = showSecondary || targets.slab1 < 1;

// When both original and decomposed coexist during transition, push original behind
if (targets.split > 0 && targets.split < 1) {
  this.primaryCube.material.opacity = 0.88 * (1 - targets.split);
} else {
  this.primaryCube.material.opacity = showPrimary ? 0.88 : 0;
}
if (!showPrimary) this.primaryCube.visible = false;

if (targets.slab1 > 0 && targets.slab1 < 1) {
  this.secondaryCube.material.opacity = 0.88 * (1 - targets.slab1);
} else {
  this.secondaryCube.material.opacity = showSecondary ? 0.88 : 0;
}
if (!showSecondary) this.secondaryCube.visible = false;

// Blocks: visible only during split phase, hidden once merged into slabs
this.block1.visible = targets.split > 0.01 && slab2SlideT < 0.99;
this.block2.visible = targets.split > 0.01 && slab2SlideT < 0.99;
this.block3.visible = targets.split > 0.01 && targets.slab1 < 0.99;
this.block1.material.opacity = this.block1.visible ? 0.9 * Math.min(targets.split, 1 - slab2SlideT) : 0;
this.block2.material.opacity = this.block2.visible ? 0.9 * Math.min(targets.split, 1 - slab2SlideT) : 0;
this.block3.material.opacity = this.block3.visible ? 0.9 * Math.min(targets.split, 1 - targets.slab1) : 0;
```

**The principle is simple**: at any animation frame, only ONE representation of each volume region should be visible:
- Steps 1-2: original cubes visible, blocks/slabs hidden
- Step 4 (split): original cubes hidden, blocks visible, slabs hidden
- Steps 5-6: blocks transition → slabs. Block fades to 0, slab fades from 0. Once block opacity reaches 0, `block.visible = false`.
- Step 7: only slabs visible

**DiffCubesMode — same pattern:**
```js
// Hard visibility: cubeFill OFF when decompose begins
this.cubeFill.visible = targets.decompose < 0.99;
this.cubeFill.material.opacity = this.cubeFill.visible ? 0.72 * (1 - targets.decompose) : 0;

// Slabs: only visible once decompose starts
for (const slab of slabs) {
  slab.visible = targets.decompose > 0.01;
  slab.material.opacity = slab.visible ? 0.88 * targets.decompose : 0;
}
```

**Also for the removedCube in DiffCubesMode:**
```js
this.removedCube.visible = targets.remove > 0.01 && targets.remove < 0.99;
```

### Verification

After implementing: at every animation step, press pause and orbit 360°. At NO angle should you see diagonal hatching/flickering on any face. If two solid faces are ever coplanar, one of them must have `visible = false`.

---

## Issue 2: Wireframe Clipping Through Solid Faces

### Root Cause

`LineSegments` (EdgesGeometry wireframes, dashed cut lines) share the exact same dimensional boundaries as `BoxGeometry` solid meshes. Even with `scale.setScalar(1.001)` and `depthWrite: false`, at oblique camera angles the lines partially embed into the faces.

### Fix: Apply `polygonOffset` to ALL Solid Materials

Push solid face fragments slightly back in the depth buffer so that coplanar line fragments always win the depth test.

**Every `MeshStandardMaterial` used for solid blocks/cubes/slabs must include:**
```js
polygonOffset: true,
polygonOffsetFactor: 1,
polygonOffsetUnits: 1,
```

### Affected Materials

Search for all `new THREE.MeshStandardMaterial` inside these classes and add the three polygonOffset properties:

**SumCubesMode `rebuild()` (~line 3098):**
- `primaryMat` (primaryCube material) — ~line 3122
- `secondaryMat` (secondaryCube material) — ~line 3129
- Block materials in `makeBlock()` helper — ~line 3062
- `slab1` material — ~line 3220
- `slab2` material — ~line 3234
- The floor material — ~line 3104

**DiffCubesMode `rebuild()` (~line 3715):**
- `cubeFill` material — ~line 3724
- `removedCube` material — ~line 3744
- Slab materials in `makeSlab()` helper — ~line 3676
- (No floor mesh in DiffCubesMode)

**PerfectCubesMode:**
- `cubeMaterial` for InstancedMesh — search for `MeshStandardMaterial` in PerfectCubesMode

**DiffSquaresMode `rebuild()` (~line 3616):**
- `squareMaterial` — ~line 3624
- `remainingMaterial` — ~line 3635
- `cutMaterial` — ~line 3642

**AB2Mode:**
- `baseRegionColor` material — in `makeRegion()`
- The base square material

**Example transform:**
```js
// BEFORE
new THREE.MeshStandardMaterial({
  color: COLOR_NUM.a,
  roughness: 0.8,
  metalness: 0.06,
  transparent: true,
  opacity: 0.88
})

// AFTER
new THREE.MeshStandardMaterial({
  color: COLOR_NUM.a,
  roughness: 0.8,
  metalness: 0.06,
  transparent: true,
  opacity: 0.88,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1
})
```

### Keep Existing Wireframe Fixes

The `depthWrite: false` and `renderOrder: 1` already applied to `LineBasicMaterial` on EdgesGeometry should remain. The polygonOffset on solids works together with these to create a two-layer defense:
1. Solid pushed back (polygonOffset)
2. Wireframe doesn't write to depth buffer (depthWrite: false)

---

## Issue 3: DOM Label Occlusion Failure

### Root Cause

The current `LabelManager.update()` method only checks if the label's projected Z is within the frustum range (-1 to 1). It does NOT check whether a solid 3D object is between the camera and the label's anchor point. This means labels "behind" blocks still render, creating a chaotic mess of overlapping text.

### Fix: Raycaster-Based Occlusion

Add a `THREE.Raycaster` to the `LabelManager`. On each frame, for labels in 3D modes (where `depthCull` is true), cast a ray from the camera toward the label's world position. If the ray hits any solid mesh before reaching the label, hide the label.

**Modify `LabelManager` class:**

1. Add a `raycaster` property and a `scene` reference:
```js
class LabelManager {
  constructor(layerEl) {
    this.layerEl = layerEl;
    this.labels = [];
    this.raycaster = new THREE.Raycaster();
    this.occlusionMeshes = []; // Set by the active mode
  }

  setOcclusionMeshes(meshes) {
    this.occlusionMeshes = meshes;
  }
```

2. In the `update()` method, add occlusion checking for depthCull labels:
```js
update(camera, canvas, defaultDepthCull = false) {
  if (!camera || !canvas) return;
  const rect = canvas.getBoundingClientRect();

  for (const label of this.labels) {
    if (!label.visible) continue;
    const world = label.getWorldPos ? label.getWorldPos() : label.worldPos;
    if (!world) continue;

    const v = world.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * rect.width;
    const y = (-v.y * 0.5 + 0.5) * rect.height;
    const inView = v.z > -1 && v.z < 1;
    const useDepthCull = label.depthCull == null ? defaultDepthCull : !!label.depthCull;

    let occluded = false;
    if (useDepthCull && inView && this.occlusionMeshes.length > 0) {
      // Cast ray from camera toward label's world position
      const cameraWorldPos = camera.position.clone();
      // For orthographic cameras, use the camera's direction instead
      if (camera.isOrthographicCamera) {
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        this.raycaster.set(world.clone().sub(dir.clone().multiplyScalar(100)), dir);
      } else {
        const direction = world.clone().sub(cameraWorldPos).normalize();
        this.raycaster.set(cameraWorldPos, direction);
      }
      const distToLabel = cameraWorldPos.distanceTo(world);
      const hits = this.raycaster.intersectObjects(this.occlusionMeshes, false);
      // If any hit is closer than the label AND the hit mesh is visible
      if (hits.length > 0 && hits[0].distance < distToLabel - 0.1) {
        occluded = true;
      }
    }

    if (!inView || occluded) {
      label.el.style.display = "none";
      label.el.style.opacity = "0";
    } else {
      const targetOpacity = label.el.dataset.targetOpacity || "1";
      label.el.style.display = "";
      label.el.style.opacity = targetOpacity;
      label.el.style.left = `${x}px`;
      label.el.style.top = `${y}px`;
    }
  }
}
```

3. Each 3D mode must register its solid meshes for occlusion testing in `rebuild()`:
```js
// In SumCubesMode.rebuild(), after creating all meshes:
labelManager.setOcclusionMeshes([
  this.primaryCube, this.secondaryCube,
  this.block1, this.block2, this.block3,
  this.slab1, this.slab2
]);

// In DiffCubesMode.rebuild():
labelManager.setOcclusionMeshes([
  this.cubeFill, this.removedCube,
  this.slabA, this.slabAB, this.slabB
]);

// In PerfectCubesMode (after creating the InstancedMesh):
labelManager.setOcclusionMeshes([this.cubeMesh]);
```

4. Clear occlusion meshes when deactivating:
```js
// In each mode's onDeactivate():
labelManager.setOcclusionMeshes([]);
```

### Performance Note

`Raycaster.intersectObjects()` is O(n) per label per frame. With max ~12 labels and ~7 meshes, this is ~84 ray-mesh tests per frame — trivial for modern GPUs. However, the raycaster only runs for labels where `depthCull` is true (3D modes only), and it short-circuits if `occlusionMeshes` is empty.

### Filtering Invisible Meshes

The raycaster must only test against meshes that are currently `visible = true`. The `intersectObjects` method already respects `mesh.visible`, so no extra filtering is needed — as long as Issue 1 is fixed (setting `visible = false` on hidden geometry).

---

## Summary of All Changes

| Location | Change |
|----------|--------|
| `LabelManager` class | Add `raycaster`, `occlusionMeshes`, raycaster occlusion in `update()` |
| `SumCubesMode.applyVisualTargets()` | Use `mesh.visible = false` instead of near-zero opacity for original cubes/blocks |
| `DiffCubesMode.applyVisualTargets()` | Use `mesh.visible = false` for cubeFill and removedCube |
| All `MeshStandardMaterial` constructors | Add `polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1` |
| `SumCubesMode.rebuild()` | Call `labelManager.setOcclusionMeshes([...])` |
| `DiffCubesMode.rebuild()` | Call `labelManager.setOcclusionMeshes([...])` |
| `PerfectCubesMode.rebuild()` | Call `labelManager.setOcclusionMeshes([...])` |
| All 3D mode `onDeactivate()` | Call `labelManager.setOcclusionMeshes([])` |

### What NOT to Change

- Do NOT touch the animation step targets (`getStepTargets`) — the step choreography is correct
- Do NOT change the `StepQueue` class
- Do NOT change the drill engine or any drill question logic
- Do NOT change any CSS or HTML structure
- Do NOT change 2D orthographic modes (AB2Mode, DiffSquaresMode) — they don't have this issue since they're flat
- Do NOT remove the existing `depthWrite: false` or `renderOrder` on wireframe materials

### QA Checklist

- [ ] SumCubesMode: step through all 7 steps slowly, orbit 360° at each step — no diagonal flickering on any face
- [ ] DiffCubesMode: step through all 6 steps slowly, orbit 360° at each step — no diagonal flickering
- [ ] All wireframe edges sit cleanly on top of solid faces at all viewing angles
- [ ] Labels behind solid blocks hide when orbiting away from them
- [ ] Labels reappear when orbiting back to face them
- [ ] PerfectCubesMode: volume label hides when cube face is between label and camera
- [ ] No visual regression in 2D modes (AB2, DiffSquares, PerfectSquares)
- [ ] Zooming close to geometry no longer shows interior faces (near-plane clipping is acceptable only at extreme zoom)
