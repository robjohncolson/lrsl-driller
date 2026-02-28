# Fix Spec: DiffCubesMode (a³ − b³) — Stacking, Camera, Labels, and Polish

**File to modify:** `standalone/math-viz/index.html`
**Class:** `DiffCubesMode` (starts ~line 3745)
**Prerequisite reading:** `FINAL_REVISION_SPEC.md` (MODE 7, line 476), `RENDERING_FIX_SPEC.md`

---

## Issue 1: Horizontal Stacking (Critical Geometry Fix)

### Current Behavior

In Step 6 ("Stack aligned slabs"), the three slabs (a², ab, b²) are piled **vertically** along the Y-axis at the same X and Z. Their `.final` positions (~lines 3953, 3960, 3967):

```js
this.slabA.userData.final  = new THREE.Vector3(0,  a * 0.58,  -a * 0.84);
this.slabAB.userData.final = new THREE.Vector3(0, -a * 0.04,  -a * 0.84);
this.slabB.userData.final  = new THREE.Vector3(0, -a * 0.66,  -a * 0.84);
```

All three share X=0 and Z=−a×0.84 but differ in Y, creating a tower. The (a−b) thickness stacks additively to 3(a−b), breaking the visual metaphor of (a−b) as a **single shared factor**.

### Required Behavior

After Step 5's rotations, all three slabs have their (a−b) thickness aligned along the same axis. In Step 6, they must slide **side-by-side on the same plane** — like floor tiles — to form a single composite shape with **uniform height (a−b)**.

The factorization (a−b)(a² + ab + b²) should be visually readable as:
- **One dimension** = (a−b) — the shared height of the composite layer
- **Other dimensions** = the three adjacent cross-section areas that sum to (a² + ab + b²)

### Implementation

**A. Determine post-rotation effective dimensions**

After Step 5 rotations are applied, the effective (X, Y, Z) extents of each slab are:

| Slab | Geometry | Rotation | Effective (X, Y, Z) | Cross-section (X-Y) | Thickness axis |
|------|----------|----------|---------------------|---------------------|----------------|
| slabA | `(a, a, d)` | none | `(a, a, d)` | a × a = a² | Z |
| slabAB | `(a, d, b)` | rotX = −π/2 | `(a, b, d)` | a × b = ab | Z |
| slabB | `(d, b, b)` | rotY = +π/2 | `(b, b, d)` | b × b = b² | Z |

All three have thickness d = (a−b) along Z. Good — this is already correct from Step 5.

**B. Compute side-by-side final positions**

Stack the three slabs along the **Y-axis by their cross-section heights** (not their thickness), all sharing the same Z position. The X positions center each slab horizontally.

Conceptual layout (viewed from +Z, looking at the X-Y face):

```
         ┌─────────────┐ ← slabA: a wide, a tall
         │     a²      │
         │             │
         ├─────────────┤ ← slabAB: a wide, b tall
         │     ab      │
         ├────────┐    │
         │   b²   │    │  ← slabB: b wide, b tall
         └────────┘    │
                       │
```

Wait — the slabs have different widths (a, a, b). To form a visually coherent composite, left-align them in X:

```
  Left-aligned in X, stacked in Y (bottom-up):

  Y ↑
    │  ┌───────────┐       slabA (a × a), top
    │  │    a²     │
    │  │           │
    │  ├───────────┤       slabAB (a × b), middle
    │  │    ab     │
    │  ├───────┐───┘       slabB (b × b), bottom
    │  │  b²   │
    │  └───────┘
    └──────────────→ X
```

Compute final positions so the slabs **abut with zero gap**, left-aligned at the same X-min:

```js
// In rebuild(), replace the three .final assignments:

// Composite reference point: left edge at X = -a/2, bottom at Y = -(a + b)/2
const stackZ = -a * 0.84;  // keep existing Z offset for depth

// slabA: top block. Center X = 0 (width a), Center Y needs calculation
// Total composite height = a + b + b = a + 2b...

// Actually, the stacking Y positions from bottom to top:
// slabB (height b):   bottom Y = yFloor,          center Y = yFloor + b/2
// slabAB (height b):  bottom Y = yFloor + b,      center Y = yFloor + b + b/2
// slabA (height a):   bottom Y = yFloor + b + b,   center Y = yFloor + 2b + a/2
//   where yFloor = -(a + 2b)/2 to center the composite vertically

// But that gives total height a + 2b, not a + b. The point of the factorization
// is that the cross-sections are a², ab, b² and they tile the "other factor."
```

**IMPORTANT**: The three cross-sections (a², ab, b²) tile naturally because:
- slabA: a wide × a tall (in X-Y)
- slabAB: a wide × b tall
- slabB: b wide × b tall

These **do not** form a neat rectangle when placed side-by-side. That's fine — the pedagogical goal is not to form a rectangle, but to show that all three share a uniform thickness (a−b) along Z. Arrange them in a column along Y (flush left edges, ascending):

```js
// In rebuild(), replace .final positions:
const stackZ = -a * 0.84;  // depth offset (keep existing)
const compositeH = a + b + b;  // total Y extent = a + 2b

// Center the composite vertically
const yBase = -compositeH / 2;

// slabB (b × b): bottom
this.slabB.userData.final = new THREE.Vector3(
  -a / 2 + b / 2,           // left-align: left edge at -a/2, center at -a/2 + b/2
  yBase + b / 2,             // bottom of stack
  stackZ
);

// slabAB (a × b): middle
this.slabAB.userData.final = new THREE.Vector3(
  0,                         // centered at X=0 (width a, left edge at -a/2)
  yBase + b + b / 2,         // sits on top of slabB
  stackZ
);

// slabA (a × a): top
this.slabA.userData.final = new THREE.Vector3(
  0,                         // centered at X=0 (width a)
  yBase + b + b + a / 2,     // sits on top of slabAB...
  stackZ
);
```

**STOP — re-examine**. The above places slabB at a different X than slabAB/slabA because slabB is narrower (width b vs a). This is geometrically correct but visually asymmetric.

**Better layout**: Arrange horizontal stacking along **X-axis** instead, with all slabs sharing the same Y position. This keeps the (a−b) thickness along Z as the "height" and makes the cross-section areas tile left-to-right:

```
  Viewed from above (+Y), looking down at the X-Z plane:

  Z ↑ (thickness a−b, uniform)
    │  ┌──────┬──────┬────┐
    │  │  a²  │  ab  │ b² │   ← all same Z extent (a−b)
    │  │ a×a  │ a×b  │ b×b│
    │  └──────┴──────┴────┘
    └──────────────────────→ X

  Side view (from +Z):
    Y ↑
    a │  ┌──────┬──────┐
      │  │      │      │
      │  │  a²  │  ab  ├──┐
    b │  │      │      │b²│
      │  └──────┴──────┴──┘
      └────────────────────→ X
         ← a  → ← a → ← b→
```

This is the cleanest layout. The three slabs tile along X with:
- All sharing the same Y=0 center (different Y extents: a, b, b)
- All sharing the same Z position (thickness d along Z)
- Flush along X edges

```js
// Final position calculation for horizontal X-axis tiling:
const stackZ = 0;  // bring to center for better camera framing
const totalWidth = a + a + b;  // = 2a + b
const xBase = -totalWidth / 2;

// slabA (width a, height a): leftmost
this.slabA.userData.final = new THREE.Vector3(
  xBase + a / 2,    // left edge at xBase
  0,                 // centered vertically
  stackZ
);

// slabAB (width a, height b): middle
this.slabAB.userData.final = new THREE.Vector3(
  xBase + a + a / 2, // left edge at xBase + a
  0,                  // centered vertically
  stackZ
);

// slabB (width b, height b): rightmost
this.slabB.userData.final = new THREE.Vector3(
  xBase + a + a + b / 2,  // left edge at xBase + 2a
  0,                       // centered vertically
  stackZ
);
```

**C. Update the `.align` positions**

The `.align` positions (intermediate state during Step 5) should be spread apart but oriented toward the final horizontal layout. Keep them at the same Z as final but with extra X spacing for visual separation:

```js
const spread = a * 0.4;  // extra gap between slabs during align phase

this.slabA.userData.align = new THREE.Vector3(
  xBase + a / 2 - spread,
  0,
  stackZ
);

this.slabAB.userData.align = new THREE.Vector3(
  xBase + a + a / 2,
  0,
  stackZ
);

this.slabB.userData.align = new THREE.Vector3(
  xBase + a + a + b / 2 + spread,
  0,
  stackZ
);
```

**D. Adjust rotations to orient thickness along Y (upward)**

For the horizontal tiling to read correctly with a single vertical "a−b" bracket on the side, the thickness (a−b) should point **upward** (along Y), not along Z. This means adjusting the target rotations so that after Step 5:

| Slab | Geometry | Required rotation | Result: thickness along Y |
|------|----------|-------------------|---------------------------|
| slabA | `(a, a, d)` | rotX = +π/2 | `(a, d, a)` → thickness d in Y ✓ |
| slabAB | `(a, d, b)` | none (d already in Y) | `(a, d, b)` → thickness d in Y ✓ |
| slabB | `(d, b, b)` | rotZ = −π/2 | `(b, d, b)` → thickness d in Y ✓ |

Wait — this changes the rotation targets. Currently:
- slabA: rotX=0, rotY=0
- slabAB: rotX=−π/2, rotY=0
- slabB: rotX=0, rotY=π/2

If we want thickness along Y instead of Z, we need different rotations. **However**, this is a significant change to the Step 5 animation. The user said Step 5's rotation "successfully" orients the thickness — so the issue may be purely about Step 6's slide direction.

**DECISION**: Keep the existing rotation targets (thickness along Z after rotation). Instead, orient the final horizontal layout so the Z-axis thickness is the **shared visual height**. Adjust the camera in Step 6 to view from a front-on angle where Z appears as the vertical dimension.

**OR** — simpler and better — rotate the entire final composite so (a−b) points up. Add a group-level rotation or adjust individual positions so the "floor tile" arrangement sits in the X-Z plane (flat on the ground) with Y being the thickness:

```js
// Revised approach: tile in X-Z plane, thickness (d) along Y
// After rotation, effective dims: slabA=(a,a,d), slabAB=(a,b,d), slabB=(b,b,d)
// The Z dimension is d for all. To put d along Y, apply an additional π/2 rotation
// around X for the composite... but that's complex.

// SIMPLEST FIX: just change what axis we tile along.
// Tile along X, with Z being the depth and Y the "up" for cross-sections.
// But after rotation, Y-extents are: slabA=a, slabAB=b, slabB=b
// And Z-extents are all d.
//
// To form a side-by-side layout visible from the camera:
// Tile along X (left to right), keep Y=0 for all, Z=stackZ for all.
// The "height" students see is the Z-extent = d = (a−b), which is
// uniform. Camera views from (13,11,15) looking at origin, so Z
// appears as depth, not height.
//
// For best visibility: orient the camera to view the composite from
// the front (+Z direction, slightly elevated) so the uniform Z
// thickness appears as a visible "depth" band on the top/side.
```

**FINAL APPROACH — chosen for clarity and minimal disruption**:

1. Keep existing rotation targets (thickness d along Z after rotation).
2. Tile slabs side-by-side along X, all at Y=0, all at same Z.
3. Adjust the Step 6 camera to orbit to a **slightly elevated front view** that clearly shows the uniform Z-thickness across all three slabs.
4. Place the master "a−b" dimension line along the Z-axis on the right side of the composite.

Replace the `.final` positions in `rebuild()` (~lines 3953, 3960, 3967):

```js
const { a, b, d } = this.geo;

// Horizontal tiling along X-axis, all at Y=0, all at Z=0
const totalWidth = a + a + b;  // 2a + b
const xStart = -totalWidth / 2;

this.slabA.userData.final = new THREE.Vector3(
  xStart + a / 2,
  0,
  0
);
this.slabAB.userData.final = new THREE.Vector3(
  xStart + a + a / 2,
  0,
  0
);
this.slabB.userData.final = new THREE.Vector3(
  xStart + 2 * a + b / 2,
  0,
  0
);
```

Update `.align` positions to be spread-out versions of the final positions (same Y and Z, extra X spacing):

```js
const alignSpread = a * 0.5;

this.slabA.userData.align = new THREE.Vector3(
  xStart + a / 2 - alignSpread,
  0,
  0
);
this.slabAB.userData.align = new THREE.Vector3(
  xStart + a + a / 2,
  0,
  0
);
this.slabB.userData.align = new THREE.Vector3(
  xStart + 2 * a + b / 2 + alignSpread,
  0,
  0
);
```

### Verification

At Step 6 with a=5, b=2:
- d = 3, totalWidth = 12
- slabA center: X = −6 + 2.5 = −3.5
- slabAB center: X = −6 + 5 + 2.5 = 1.5
- slabB center: X = −6 + 10 + 1 = 5
- All at Y=0, Z=0
- All have Z-extent = 3 = (a−b) ✓
- No gaps between slabs: slabA right edge = −3.5 + 2.5 = −1, slabAB left edge = 1.5 − 2.5 = −1 ✓
- slabAB right edge = 1.5 + 2.5 = 4, slabB left edge = 5 − 1 = 4 ✓

---

## Issue 2: Label Consolidation — Remove Clutter, Add Missing `ab` Label

### Current Behavior

Three separate "a−b" dimension lines (`dimAligned` array, ~lines 4024-4076) float in space during Steps 5-6, each attached to an individual slab's aligned position. At the final stacking, they overlap chaotically. Additionally, the `ab` area label on the green slab appears to be missing or occluded in the final view.

### Required Changes

**A. Fade out individual `dimAligned` lines during Step 6**

In `applyVisualTargets()` (~line 4155), the `dimAligned` opacity is already reduced during stacking:

```js
const alignDimOpacity = clamp((targets.align - 0.12) / 0.88, 0, 1) * (1 - 0.85 * targets.stack);
```

Change this to **fully** fade them out when stack > 0:

```js
const alignDimOpacity = clamp((targets.align - 0.12) / 0.88, 0, 1) * (1 - targets.stack);
this.setDimensionOpacityList(this.dimAligned, alignDimOpacity);
```

**B. Create a single master "a−b" dimension line**

In `rebuild()`, create one new dimension line positioned on the **right side** of the final horizontal composite, spanning the Z-extent (thickness d):

```js
// Master shared dimension line — visible only at Step 6
const masterX = xStart + totalWidth + 0.6;  // right side of composite + offset
this.dimMaster = createDimensionLine(this.group, labelManager, {
  start: new THREE.Vector3(masterX, 0, -d / 2),
  end: new THREE.Vector3(masterX, 0, d / 2),
  color: COLOR_NUM.result,
  labelText: "a{\\text{-}}b",
  groupId: this.id,
  offset: new THREE.Vector3(0.5, 0, 0),
  opacity: 0
});
```

In `applyVisualTargets()`, fade in the master line as stack increases:

```js
this.setDimensionOpacity(this.dimMaster, targets.stack);
```

**C. Fix the `ab` area label position**

The current `ab` label's `getWorldPos` (~line 4092):

```js
getWorldPos: () => this.slabAB.position.clone().add(new THREE.Vector3(0, b * 0.52, 0))
```

This places the label above the slab in Y. After the horizontal tiling, slabAB's cross-section is in the X-Y plane (width a in X, height b in Y), so the label should be positioned on the **top face** (+Z side) of the slab, centered on its visible area:

```js
getWorldPos: () => this.slabAB.position.clone().add(new THREE.Vector3(0, 0, d / 2 + 0.3))
```

**BUT** — this only matters at the final step. During earlier steps (explode, align), the Y-offset is correct. Use a dynamic position:

```js
ab: labelManager.addLabel({
  tex: "ab",
  className: "viz-label viz-label--medium",
  color: COLOR_HEX.ab,
  groupId: this.id,
  getWorldPos: () => {
    const p = this.slabAB.position.clone();
    if (this.state.stack > 0.5) {
      // At final layout: label on the +Z face (top of the flat tile)
      return p.add(new THREE.Vector3(0, 0, d / 2 + 0.3));
    }
    // During explode/align: label above slab in Y
    return p.add(new THREE.Vector3(0, b * 0.52, 0));
  },
  opacity: 0
})
```

Apply the same pattern to the `a2` and `b2` labels — at final layout, position them on the +Z face:

```js
a2: labelManager.addLabel({
  ...
  getWorldPos: () => {
    const p = this.slabA.position.clone();
    if (this.state.stack > 0.5) {
      return p.add(new THREE.Vector3(0, 0, d / 2 + 0.3));
    }
    return p.add(new THREE.Vector3(0, a * 0.52, 0));
  },
  ...
})
```

```js
b2: labelManager.addLabel({
  ...
  getWorldPos: () => {
    const p = this.slabB.position.clone();
    if (this.state.stack > 0.5) {
      return p.add(new THREE.Vector3(0, 0, d / 2 + 0.3));
    }
    return p.add(new THREE.Vector3(0, b * 0.52, 0));
  },
  ...
})
```

### Verification

- At Step 5 (align, before stack): three individual "a−b" lines visible at slab positions, area labels float above slabs in Y ✓
- At Step 6 (stack = 1): individual "a−b" lines fully faded out; one master "a−b" line on the right side of the composite; area labels (a², ab, b²) centered on the top faces (+Z) of each slab in the horizontal row ✓

---

## Issue 3: Camera Jump on First Frame

### Current Behavior

When DiffCubesMode activates, the camera is set to a fixed position `(13, 11, 15)` in `init()` (~line 3795). For large values of `a` (e.g., a=6), the cube nearly fills the frame, and if the first `renderer.render()` call happens before OrbitControls finishes initialization, the user sees a jarring close-up of the cyan cube.

### Fix: Scale Initial Camera Distance to Geometry

In `init()` (~line 3794), replace the fixed camera position with a geometry-aware one:

```js
// BEFORE
this.camera.position.set(13, 11, 15);

// AFTER
const maxDim = this.params.a;
const camDist = maxDim * 2.6;
this.camera.position.set(camDist, camDist * 0.85, camDist);
this.controls.target.set(0, 0, 0);
this.camera.lookAt(0, 0, 0);
```

Also update the camera in `rebuild()` after parameters change via sliders:

```js
// At the END of rebuild(), after applyStepState(1):
const maxDim = this.geo.a;
const camDist = maxDim * 2.6;
this.camera.position.set(camDist, camDist * 0.85, camDist);
this.controls.target.set(0, 0, 0);
```

Update the camera animation base vectors in `tick()` (~line 4263) to also scale with `a`:

```js
// BEFORE
const base = new THREE.Vector3(13, 11, 15);
const top = new THREE.Vector3(9.4, 15.2, 10.4);

// AFTER
const s = this.geo.a * 2.6;
const base = new THREE.Vector3(s, s * 0.85, s);
const top = new THREE.Vector3(s * 0.72, s * 1.17, s * 0.8);
```

### Verification

- Set a=2 via slider: camera at ~(5.2, 4.4, 5.2) — cube comfortably framed
- Set a=6 via slider: camera at ~(15.6, 13.3, 15.6) — cube comfortably framed
- No "jump scare" on mode activation for any a value

---

## Issue 4: Wireframe Opacity and Block Alignment Polish

### 4A. Fade the Original a³ Wireframe

The white wireframe (`this.wire`) of the original a³ cube remains at full opacity (~0.95) throughout all steps, competing visually with the colored slabs.

In `applyVisualTargets()`, add opacity control for the wireframe. It should fade during the decompose phase and remain as a faint reference:

```js
// After the cubeFill visibility block (~line 4128):
if (this.wire) {
  const wireOpacity = 0.95 * (1 - 0.85 * targets.decompose);
  this.wire.material.opacity = wireOpacity;
  this.wire.visible = wireOpacity > 0.01;
}
```

This fades the wireframe from 0.95 to ~0.14 (≈15%) once decompose=1, making it a faint ghost for spatial reference without competing with the slabs.

### 4B. Ensure Zero-Gap Block Alignment

The final positions computed in Issue 1 use exact mathematical offsets that guarantee zero gaps:

```
slabA right edge  = xStart + a/2 + a/2 = xStart + a
slabAB left edge  = xStart + a + a/2 - a/2 = xStart + a  ✓ (flush)

slabAB right edge = xStart + a + a/2 + a/2 = xStart + 2a
slabB left edge   = xStart + 2a + b/2 - b/2 = xStart + 2a  ✓ (flush)
```

No additional fix needed if the positions from Issue 1 are implemented correctly. If visual gaps persist due to floating-point imprecision, nudge each slab inward by 0.001 units.

### 4C. Cut Lines Opacity During Final Steps

The cut lines (`this.cutLines`) should also fade more aggressively during stacking. The current formula (~line 4131):

```js
line.material.opacity = 0.85 * targets.decompose * (1 - 0.35 * targets.stack);
```

Change to full fade-out during stack:

```js
line.material.opacity = 0.85 * targets.decompose * (1 - targets.stack);
```

---

## Summary of All Changes

| Location | Line(s) | Change |
|----------|---------|--------|
| `rebuild()` `.final` positions | ~3953, 3960, 3967 | Replace vertical stacking with horizontal X-axis tiling |
| `rebuild()` `.align` positions | ~3952, 3959, 3966 | Update to spread-out versions of new final positions |
| `rebuild()` new `dimMaster` | after ~4076 | Add single master "a−b" dimension line for Step 6 |
| `rebuild()` label `getWorldPos` | ~4084, 4092, 4100 | Dynamic: Y-offset during explode/align, Z-offset during stack |
| `applyVisualTargets()` aligned dims | ~4155 | Change `(1 - 0.85 * targets.stack)` → `(1 - targets.stack)` for full fade-out |
| `applyVisualTargets()` master dim | new line | `this.setDimensionOpacity(this.dimMaster, targets.stack)` |
| `applyVisualTargets()` wireframe | after ~4129 | Add `this.wire.material.opacity` fade with decompose |
| `applyVisualTargets()` cut lines | ~4131 | Change `(1 - 0.35 * targets.stack)` → `(1 - targets.stack)` |
| `init()` camera position | ~3795 | Scale camera distance by `a * 2.6` instead of fixed (13,11,15) |
| `rebuild()` camera reset | after ~4115 | Reset camera to scaled position on param change |
| `tick()` orbit vectors | ~4263-4264 | Scale base/top vectors by `this.geo.a * 2.6` |

### What NOT to Change

- Step targets in `getStepTargets()` — the 6-step sequence is correct
- Rotation targets (`rotX`, `rotY`) — Step 5 rotation logic is working
- `StepQueue` class — animation infrastructure is fine
- Drill engine / drill questions — unrelated
- Other modes (SumCubesMode, DiffSquaresMode, etc.) — unaffected
- `LabelManager` class — occlusion logic is fine
- `removedCube` animation — the diagonal slide-out works

### QA Checklist

- [ ] Step 6: three slabs tile left-to-right with zero gaps, uniform (a−b) thickness visible
- [ ] Step 6: one master "a−b" dimension line on the right side, three individual lines fully gone
- [ ] Step 6: all three area labels (a², ab, b²) visible on top faces of their respective slabs
- [ ] Step 1: no camera "jump scare" — cube fits in frame at all a values (2–6)
- [ ] Slider change (a or b): camera adjusts distance, cube remains framed
- [ ] Steps 3–6: a³ wireframe fades to ~15% opacity, not competing with slabs
- [ ] Steps 5–6: cut lines fully fade out during stacking
- [ ] Edge case a=6, b=5: thin (a−b)=1 slabs — labels don't overlap, composite still readable
- [ ] Edge case a=2, b=1: small geometry — camera pulls in close enough to see detail
- [ ] Orbit freely at Step 6: uniform thickness visible from all angles
- [ ] Play All (▶): full 6-step sequence runs smoothly end-to-end
