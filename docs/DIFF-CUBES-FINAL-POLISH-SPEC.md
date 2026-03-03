# Fix Spec: DiffCubesMode (a³ − b³) — Final 5% Polish

**File to modify:** `standalone/math-viz/index.html`
**Class:** `DiffCubesMode` (starts ~line 3745)
**Prerequisite:** Previous specs (`DIFF-CUBES-STACKING-FIX-SPEC.md`, `RENDERING_FIX_SPEC.md`) are already implemented. The horizontal layout is working. This spec addresses the remaining alignment, label, and wireframe issues identified from video review.

---

## Issue 1: Bottom-Flush Alignment (The "Staircase" Bug)

### Current Behavior

All three slabs share `Y = 0` in their final positions (~lines 3959, 3966, 3973). Three.js positions meshes by their **centroid**, so:

- slabA (effective height `a` after rotation): bottom at `−a/2`, top at `+a/2`
- slabAB (effective height `b` after rotation): bottom at `−b/2`, top at `+b/2`
- slabB (effective height `b` after rotation): bottom at `−b/2`, top at `+b/2`

Since `a > b`, slabA extends further down than slabAB and slabB. The bottom edges are **misaligned** — the shorter blocks appear to "float" higher, creating a staircase effect.

### Required Behavior

All three blocks must share a common **floor** (bottom edge at the same Y coordinate). The taller block (slabA, height `a`) extends higher; the shorter blocks (slabAB and slabB, height `b`) sit flush on the same floor but are shorter.

### Fix

Replace the `.final` and `.align` Y-coordinates to use floor-based positioning instead of center-based.

In `rebuild()`, replace the final position assignments (~lines 3959, 3966, 3973):

```js
// Floor-aligned: all blocks share the same bottom edge
// Choose floor at Y=0, so centroids are offset upward by half their height
const floorY = 0;

// slabA (effective: a wide × a tall × d deep after rotation)
this.slabA.userData.final = new THREE.Vector3(
  xStart + a / 2,
  floorY + a / 2,      // centroid at half of height a
  0
);

// slabAB (effective: a wide × b tall × d deep after rotation via rotX = -π/2)
//   Original geometry (a, d, b) → after rotX -90°: (a, b, d)
//   So effective height = b (the original Z dimension became Y)
this.slabAB.userData.final = new THREE.Vector3(
  xStart + a + a / 2,
  floorY + b / 2,      // centroid at half of height b — MATCHES Gemini's formula
  0
);

// slabB (effective: b wide × b tall × d deep after rotation via rotY = +π/2)
//   Original geometry (d, b, b) → after rotY 90°: (b, b, d)
//   So effective height = b (middle dimension unchanged)
this.slabB.userData.final = new THREE.Vector3(
  xStart + 2 * a + b / 2,
  floorY + b / 2,      // centroid at half of height b
  0
);
```

Update `.align` positions to match (same Y logic, with X spread):

```js
this.slabA.userData.align = new THREE.Vector3(
  xStart + a / 2 - alignSpread,
  floorY + a / 2,
  0
);
this.slabAB.userData.align = new THREE.Vector3(
  xStart + a + a / 2,
  floorY + b / 2,
  0
);
this.slabB.userData.align = new THREE.Vector3(
  xStart + 2 * a + b / 2 + alignSpread,
  floorY + b / 2,
  0
);
```

### Side-View Diagram (from +Z, after fix)

```
  Y ↑
  a │  ┌───────────┬───────────┐
    │  │           │           │
    │  │    a²     │    ab     ├─────────┐
  b │  │  (a × a)  │  (a × b)  │   b²    │
    │  │           │           │ (b × b)  │
  0 │  └───────────┴───────────┴─────────┘  ← shared floor
    └──────────────────────────────────────→ X
       ← a →       ← a →       ← b →
```

### Verification

With a=5, b=2:
- slabA bottom: `a/2 - a/2 = 0` ✓ (floor)
- slabAB bottom: `b/2 - b/2 = 0` ✓ (floor)
- slabB bottom: `b/2 - b/2 = 0` ✓ (floor)
- slabA top: `a/2 + a/2 = 5` (tallest)
- slabAB top: `b/2 + b/2 = 2`
- slabB top: `b/2 + b/2 = 2`
- All flush at bottom ✓

---

## Issue 2: Broken KaTeX "a−b" Label

### Current Behavior

The master dimension line (~line 4025) uses:

```js
labelText: "a{\\text{-}}b"
```

In the rendered output, this displays literally as `a[\text{-}]b` because the backslash escaping is malformed by the time KaTeX parses it. The `\text{}` command is not being interpreted — it's being rendered as raw text.

### Fix

KaTeX natively understands the minus sign in math mode. Replace with a simple expression:

```js
// BEFORE (~line 4025)
labelText: "a{\\text{-}}b",

// AFTER
labelText: "a - b",
```

Also fix the same pattern in the three individual `dimAligned` lines (~lines 4044, 4061, 4078):

```js
// BEFORE
labelText: "a-b",

// AFTER  (these are fine as-is — plain "a-b" works in KaTeX math mode)
// No change needed for these; they already render correctly.
// Only the master line's "a{\\text{-}}b" is broken.
```

### Verification

The red dimension label on the right side of the composite should render as: **a − b** (with proper math spacing around the minus sign).

---

## Issue 3: Missing/Occluded `ab` Label on Green Block

### Current Behavior

The `ab` label exists in code (~line 4098) and uses a dynamic `getWorldPos` that switches between Y-offset (during explode/align) and Z-offset (during stack). However, in the video at Step 6, the green block's front face shows no label.

### Root Cause

The label's Z-offset positions it on the **+Z face** of the slab (`d/2 + 0.3`). With d = a−b being small (e.g., 3 for a=5,b=2), the label sits very close to the block surface and may be:
1. Occluded by the raycaster hitting the slab's own geometry
2. Positioned behind other blocks from the default camera angle

### Fix

Two changes:

**A. Increase the Z offset to clear the occlusion raycaster threshold**

In the `getWorldPos` callbacks for all three labels (~lines 4091-4121), increase the Z clearance:

```js
// BEFORE (all three labels)
if (this.state.stack > 0.5) return p.add(new THREE.Vector3(0, 0, d / 2 + 0.3));

// AFTER — push labels further out from the face to clear raycaster hit threshold (0.1 units)
if (this.state.stack > 0.5) return p.add(new THREE.Vector3(0, 0, d / 2 + 0.5));
```

**B. Update Y component for floor-aligned positioning**

After Issue 1 is implemented, the slab positions include Y offsets. The label `getWorldPos` already clones the slab position, so the Y offset is automatically inherited. No additional change needed here — just verify that `slab.position` reflects the floor-aligned centroid.

### Verification

At Step 6: all three area labels (`a²`, `ab`, `b²`) should be visible, floating just above the +Z face of their respective slabs. Orbit to confirm the `ab` label appears on the green (middle) block.

---

## Issue 4: Ghost Wireframe Too Prominent During Stacking

### Current Behavior

The original a³ wireframe (`this.wire`) fades based on `decompose` only (~line 4158):

```js
const wireOpacity = 0.95 * (1 - 0.85 * targets.decompose);
```

At decompose=1 (Steps 4-6), opacity = `0.95 * 0.15 ≈ 0.14`. This ~14% ghost wireframe persists through the entire stacking animation, cluttering the final factored layout and clipping through the rearranged blocks.

### Fix

Add a secondary fade-out during the stacking phase so the wireframe disappears completely by Step 6:

```js
// BEFORE (~line 4158)
const wireOpacity = 0.95 * (1 - 0.85 * targets.decompose);

// AFTER — fade with decompose, then kill completely during stack
const wireOpacity = 0.95 * (1 - 0.85 * targets.decompose) * (1 - targets.stack);
```

This means:
- Steps 1-2 (decompose=0, stack=0): wireframe at full 0.95 ✓
- Steps 3-4 (decompose=1, stack=0): wireframe at 0.14 (faint reference) ✓
- Step 5 (decompose=1, stack=0): wireframe at 0.14 (still faintly visible during alignment) ✓
- Step 6 (decompose=1, stack=1): wireframe at **0** — completely gone ✓

### Verification

At Step 6, the white wireframe of the original a³ cube should be completely invisible. User focus should be 100% on the colored factored blocks.

---

## Issue 5: Camera Framing for Floor-Aligned Layout

### Current Behavior

The camera targets `(0, 0, 0)` as the look-at point. After Issue 1 shifts all blocks upward (floor at Y=0, tops at Y=a), the visual center of the composite is no longer at the origin — it's at approximately `Y = a/2`.

### Fix

Update the camera target during Step 6 to center on the composite. In `tick()` where the camera orbit is computed (~line 4263+), adjust the orbit target based on the stack parameter:

```js
// In tick(), where the orbit target is set:
// Lerp the look-at target upward during stacking to keep the composite centered
const stackT = this.state?.stack || 0;
const targetY = stackT * (this.geo.a / 2);  // center of tallest block
this.controls.target.set(0, targetY, 0);
```

If the camera target is managed differently (e.g., via `camera.lookAt`), apply the same Y-offset there.

### Verification

At Step 6, the factored composite should appear centered in the viewport, not shifted toward the bottom of the screen.

---

## Summary of All Changes

| # | Location | Line(s) | Change |
|---|----------|---------|--------|
| 1 | `rebuild()` `.final` positions | ~3959, 3966, 3973 | Add `floorY + height/2` Y-offset for bottom-flush alignment |
| 1 | `rebuild()` `.align` positions | ~3958, 3965, 3972 | Same Y-offset as final positions |
| 2 | `rebuild()` `dimMaster` labelText | ~4025 | Change `"a{\\text{-}}b"` → `"a - b"` |
| 3 | `rebuild()` label `getWorldPos` | ~4093, 4105, 4117 | Increase Z clearance from `d/2 + 0.3` → `d/2 + 0.5` |
| 4 | `applyVisualTargets()` wireframe | ~4158 | Multiply by `(1 - targets.stack)` to fully hide at Step 6 |
| 5 | `tick()` camera target | ~4263+ | Lerp orbit target Y upward during stack to center the composite |

### What NOT to Change

- Slab geometry dimensions (`makeSlab(a, a, d)` etc.) — these are correct
- Rotation targets (`rotX`, `rotY`) — Step 5 rotations are correct
- Edge wireframe creation (`makeEdges`) — local-space dims rotate correctly with parent
- Step targets in `getStepTargets()` — the 6-step sequence is correct
- `StepQueue` class — animation infrastructure is fine
- `LabelManager` class — raycaster occlusion logic is correct
- `removedCube` animation — diagonal slide-out works
- Other modes — unaffected
- X-axis positions — the horizontal tiling math is already correct (zero gaps verified)
- Z-axis positions — all three share Z=0, uniform thickness d along Z ✓

### QA Checklist

- [ ] Step 6: all three blocks share a common floor edge (no staircase)
- [ ] Step 6: slabA is taller (height `a`), slabAB and slabB are shorter (height `b`), all flush at bottom
- [ ] Step 6: the red "a − b" dimension label renders correctly (no raw `\text` markup)
- [ ] Step 6: all three area labels (`a²`, `ab`, `b²`) are visible on the front faces of their respective slabs
- [ ] Step 6: the white wireframe of the original a³ cube is completely hidden
- [ ] Step 6: the composite appears centered in the viewport (not shifted down)
- [ ] Step 5 → 6 transition: wireframe fades out smoothly as blocks slide together
- [ ] Edge case a=6, b=5: very thin (a−b)=1 slabs — labels don't overlap, layout still readable
- [ ] Edge case a=3, b=1: blocks of very different heights — floor alignment is obvious
- [ ] Orbit freely at Step 6: uniform (a−b) thickness visible from all angles, blocks flush at bottom
- [ ] Play All: full 6-step sequence runs smoothly end-to-end with no visual glitches
- [ ] Slider change (a or b): layout recalculates correctly, camera reframes
