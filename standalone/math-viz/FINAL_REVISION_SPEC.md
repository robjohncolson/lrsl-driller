# Final Revision Spec: Math Foundations Visualizer v2

This is the single source of truth for the v2 overhaul. It supersedes `REVISION_SPEC.md`.

## Changes from v1

| Category | What Changed | Why |
|----------|-------------|-----|
| Labels | Sprite → HTML DOM overlays | Crisp at all zooms, KaTeX native, zero WebGL cost |
| Drill inputs | Remove √/∛ symbols | Not typeable on keyboards |
| Identity animations | 2-step → 6-step geometric proofs | Original wasn't rigorous |
| 3D engine stability | Pre-instantiate + toggle visibility | Eliminates flicker, GC pauses, Z-fighting |
| Camera | Unlock OrbitControls + dynamic target | Let students inspect spatial relationships |
| DOM label depth | Z-culling for rotatable scenes | Labels don't float behind shapes |
| a³+b³ proof | Add unified L-solid intermediate step | Visual anchor: "this volume = those pieces" |

---

## GLOBAL CHANGE 1: HTML DOM Label System

**Remove all `createTextSprite()`.** Replace with absolutely-positioned `<div>` elements.

### HTML Structure

```html
<div id="viz-wrapper" style="position: relative;">
  <!-- Three.js canvas renders here -->
  <div id="label-layer" style="position:absolute; inset:0; pointer-events:none; overflow:hidden;"></div>
</div>
```

### CSS Classes

```css
.viz-label {
  position: absolute;
  transform: translate(-50%, -50%);
  font-family: 'Segoe UI', sans-serif;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.15s;
}
.viz-label--large  { font-size: 1.6rem; }  /* Area = 64, Volume = 125 */
.viz-label--medium { font-size: 1.1rem; }  /* a², ab, b² region labels */
.viz-label--dim    { font-size: 0.95rem; }  /* dimension annotations: a, b, a+b */
```

### Projection (every frame in rAF loop)

```js
function updateLabelPositions(labels, camera, canvasRect) {
  for (const { el, worldPos, depthCull } of labels) {
    const v = worldPos.clone().project(camera);
    // Z-depth culling: hide labels behind camera or behind shapes
    if (depthCull && (v.z > 1 || v.z < -1)) {
      el.style.opacity = '0';
      continue;
    }
    el.style.opacity = el.dataset.targetOpacity || '1';
    el.style.left = ((v.x * 0.5 + 0.5) * canvasRect.width) + 'px';
    el.style.top = ((-v.y * 0.5 + 0.5) * canvasRect.height) + 'px';
  }
}
```

`depthCull: true` for 3D rotatable modes (cubes, sum/diff of cubes). `depthCull: false` for 2D orthographic modes (squares, identities).

### KaTeX in Labels

Use `katex.renderToString()` for math content. DOM labels support this natively — no canvas texture hacks.

```js
label.innerHTML = katex.renderToString('a^2', { throwOnError: false });
label.style.color = 'var(--a)';  // cyan
```

---

## GLOBAL CHANGE 2: Dimension Annotation Lines

Architectural tick-lines for edge measurements: thin `THREE.Line` with perpendicular end-ticks, color-matched to the term.

```
    a (cyan DOM label at midpoint)
 |←————————————————→|
```

### Helper Function

```js
function createDimensionLine(scene, labelManager, {
  start,      // THREE.Vector3
  end,        // THREE.Vector3
  color,      // 0x58c4dd
  labelText,  // "a" or "a+b" (KaTeX string)
  labelClass, // 'viz-label--dim'
  offset,     // perpendicular offset vector (so line sits off the shape edge)
  tickSize,   // 0.15 (perpendicular end-tick length)
}) → { line, ticks, label }
```

- Main span: `THREE.Line` with `LineBasicMaterial({ color })`
- End-ticks: two short perpendicular `THREE.Line` segments
- Label: DOM overlay centered at midpoint of the span line

---

## GLOBAL CHANGE 3: Step-by-Step Playback

For identity modes (4–7) with 6 animation steps.

### UI

```html
<div class="step-controls">
  <button id="step-prev" title="Previous">‹</button>
  <span id="step-counter">Step 2 / 6</span>
  <button id="step-next" title="Next">›</button>
  <button id="step-play" title="Play all">▶</button>
</div>
```

Placed inside explore controls panel, below sliders.

### Behavior

- **›** (Next): advance one step (400ms tween + 200ms pause)
- **‹** (Prev): snap to previous step's end state (no reverse animation — instant)
- **▶** (Play All): autoplay remaining steps sequentially
- For modes 1–3 (≤2 steps): autoplay only, no step controls

### Timing

- Step duration: **400ms** (down from 500ms)
- Inter-step pause: **200ms**
- Reduced motion: steps snap to end state in ≤80ms, no pause

---

## GLOBAL CHANGE 4: Engine Stability

### Pre-Instantiate All Geometry at Step 0

**Do not create or destroy `THREE.Mesh` objects mid-animation.** This causes:
- Visual flicker (frame gap between dispose and create)
- GC pauses (geometry allocation triggers garbage collection)
- Z-fighting (new geometry overlaps old before old is removed)

**Instead**: When a mode builds its scene, instantiate ALL pieces (including slabs, cut pieces, wireframes) upfront with `mesh.visible = false`. At the animation step where they appear, toggle `mesh.visible = true`. At the step where something disappears, toggle `mesh.visible = false` or tween `material.opacity → 0`.

### Dispose on Mode Switch

When switching from one mode to another, the outgoing mode's `dispose()` must:

```js
dispose() {
  this.scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
  // Remove all DOM labels for this mode
  this.labelManager.removeAll();
  // Disconnect OrbitControls
  if (this.controls) this.controls.dispose();
}
```

### Z-Fighting Prevention

For wireframe overlays on solid faces, apply polygon offset:

```js
const wireframeMat = new THREE.LineBasicMaterial({
  color: COLOR_NUM.a,
  polygonOffset: true,      // push wireframe slightly forward
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
```

Or scale wireframe `EdgesGeometry` by 1.001 to sit just outside the solid surface.

### Memory Audit (QA step)

Open Chrome DevTools → Performance Monitor. Toggle between all 7 modes 20 times rapidly. DOM node count and JS Heap must stabilize (not grow unbounded). If they don't, a dispose() path is leaking.

---

## GLOBAL CHANGE 5: Camera Unlock for 3D Modes

### OrbitControls Settings (modes 3, 6, 7)

```js
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = true;       // was false — unlock it
controls.minDistance = 4;         // was 5-7 — pull in closer
controls.maxDistance = 60;        // generous zoom out
controls.maxPolarAngle = Math.PI * 0.85;  // prevent flipping underneath
```

### Dynamic Camera Target

When animation explodes cubes into slabs, smoothly tween `controls.target` to the centroid of the exploded pieces over 300ms. This guides the student's eye to the factored state without disorienting them.

```js
// In animation step onUpdate:
controls.target.lerp(newCentroid, t);
```

---

## MODE 1: Prime Factorization — No Changes

Working well. Keep as-is.

---

## MODE 2: Perfect Squares

### Changes

1. **Drill input**: Remove `yesno-root` type. New question:
   - **"What is the side length of a square with area N? (whole number or 'none')"**
   - Input type: `text`. Accept integer (the root) or the word "none".
   - Grading: if numeric, check exact root. If "none", verify N is not a perfect square.

2. **Labels**: Switch to DOM overlays.
   - Area label: `.viz-label--large` above the grid. Text: `Area = ${n*n}`
   - Side length: dimension lines on bottom and right edges with `.viz-label--dim`

3. **Non-perfect display**: Keep showing two bounding squares (unchanged from v1).

---

## MODE 3: Perfect Cubes

### Changes

1. **Drill input**: Remove `yesno-root` type. New question:
   - **"What is the edge length of a cube with volume N? (whole number or 'none')"**
   - Same text input pattern as squares.

2. **Labels**: Switch to DOM overlays with `depthCull: true`.
   - Volume label: `.viz-label--large` above the cube. Text: `Volume = ${n**3}`
   - Edge length: dimension lines on two visible edges with `.viz-label--dim`

3. **Camera**: Apply unlocked OrbitControls settings (see Global Change 5).

---

## MODE 4: (a+b)² — 6-Step Geometric Proof

### Pre-instantiate at build time

Create all these objects upfront, most with `visible: false`:

| Object | Geometry | Color | Initial visible |
|--------|----------|-------|----------------|
| Side line (horizontal) | Line | cyan + gold | false |
| Side line (vertical) | Line | cyan + gold | false |
| Unified gray square | PlaneGeometry((a+b), (a+b)) | `#2a2a4a` | false |
| Region a² | PlaneGeometry(a, a) | cyan | false |
| Region ab (top-left) | PlaneGeometry(a, b) | green | false |
| Region ab (bottom-right) | PlaneGeometry(b, a) | green | false |
| Region b² | PlaneGeometry(b, b) | gold | false |
| Dividing lines (2) | Line (dashed) | white | false |
| Dimension lines (4) | Lines + ticks | cyan/gold | false |

DOM labels (all opacity 0 initially): "a", "b", "(a+b)²", "a²", "ab" ×2, "b²", equation stages.

### Animation Steps

**Step 1 — "The Side Length"**
- Show horizontal line: cyan segment (length a) + gold segment (length b)
- Dimension labels below: "a" (cyan), "b" (gold)
- Equation: `a + b`

**Step 2 — "Duplicate & Rotate"**
- Duplicate the line. Rotate the copy 90° CCW around left endpoint.
- Result: L-shape — horizontal and vertical sides of the square.

**Step 3 — "Form the Square"**
- Gray unified square sweeps in from the L-corner (scale or opacity animation)
- Center label fades in: `(a+b)²`
- Equation: `(a+b)²`
- Side lines remain visible as the square's edges

**Step 4 — "Partition"**
- Dashed white dividing lines appear:
  - Horizontal at height `a` from bottom
  - Vertical at width `a` from left
- Gray square still visible — regions not yet colored
- Equation: `(a+b)² = ?`

**Step 5 — "Color & Label"**
- Gray square fades out (`visible = false`)
- 4 colored regions fade in (`visible = true`, opacity 0 → 1):
  - Bottom-left a×a (cyan) → label "a²"
  - Top-left a×b (green) → label "ab"
  - Bottom-right b×a (green) → label "ab"
  - Top-right b×b (gold) → label "b²"
- Dimension lines on outer edges: "a" + "b" on bottom, "a" + "b" on left
- Equation: `(a+b)² = a² + ab + ab + b²` (color-matched)

**Step 6 — "Combine Like Terms"**
- Two "ab" labels pulse, then merge text: `ab + ab → 2ab`
- Equation: `(a+b)² = a² + 2ab + b²` (final)

### Label Sizing

- Region labels: `.viz-label--medium` (1.1rem), centered in region
- If region too small for label (b ≤ 1), offset label outside with a thin pointer line from region center to label

### Region Positioning (origin at bottom-left)

- a²: center `(a/2, a/2)`, size `a × a`
- ab top-left: center `(a/2, a + b/2)`, size `a × b`
- ab bottom-right: center `(a + b/2, a/2)`, size `b × a`
- b²: center `(a + b/2, a + b/2)`, size `b × b`

---

## MODE 5: a² − b² — 6-Step Geometric Proof

### Pre-instantiate at build time

| Object | Geometry | Color | Initial visible |
|--------|----------|-------|----------------|
| Full a×a square | PlaneGeometry(a, a) | cyan | true |
| Gold b×b corner | PlaneGeometry(b, b) | gold (semi-transparent) | false |
| Bottom piece | PlaneGeometry(a, a−b) | cyan | false |
| Top-left piece | PlaneGeometry(a−b, b) | cyan | false |
| Cut line (dashed) | Line | red (#ff6b6b) | false |
| Result rectangle outline | LineLoop | white | false |
| Dimension lines (multiple) | Lines + ticks | cyan/gold/coral | false |

### Animation Steps

**Step 1 — "The Square"**
- a×a cyan square visible. Dimension lines: "a" on bottom and left.
- Center label: "a²"
- Equation: `a²`

**Step 2 — "Mark & Remove b²"**
- Gold b×b square appears in top-right corner (opacity 0 → 0.8)
- Dimension labels on gold square: "b"
- Pause briefly, then gold square fades + slides away (opacity → 0, translate diagonal)
- Full a×a square fades out, bottom piece + top-left piece fade in (the L-shape)
- Equation: `a² − b²`

**Step 3 — "The Cut"**
- Red dashed horizontal line appears at height (a−b) from bottom
- The two pieces are already visible as the L-shape
- Top-left piece gains white outline/glow (`emissive` or CSS border on its label)
- Dimension labels on each piece

**Step 4 — "Telegraph"**
- Top-left piece scales up 1.05× and glows
- 200ms pause — student registers "this piece moves"

**Step 5 — "Rotate & Snap"**
- Top-left piece rotates 90° CW around its center
- Then slides right to adjoin bottom piece
- Result: single rectangle, width (a+b), height (a−b)
- **Important**: Do NOT translate and rotate simultaneously (causes clipping). Rotate first (200ms), then translate (200ms).

**Step 6 — "Label the Result"**
- Rectangle pulses once (brief scale to 1.02× and back)
- Dimension brackets appear:
  - Bottom: "a + b" (cyan "a" portion + gold "b" portion)
  - Left: "a − b"
- Center label: `(a+b)(a−b) = ${numericValue}`
- Equation: `a² − b² = (a+b)(a−b)`

### Geometry Verification
- Bottom strip: a × (a−b) → area = a(a−b)
- Top-left strip: (a−b) × b → area = b(a−b)
- Total: (a−b)(a+b) ✓
- After rotate + slide: rectangle (a+b) × (a−b) ✓

---

## MODE 6: a³ + b³ — 7-Step Geometric Proof

### Key addition from combined review: **Step 3 — "Unified Solid"**

Show the merged a³+b³ as a single L-shaped solid with a glowing bounding box BEFORE slicing. This is the visual anchor that proves the initial volume equals the factored pieces.

### Use BoxGeometry solids (not voxels) with EdgesGeometry wireframes.

### Pre-instantiate at build time

| Object | Geometry | Color | Initial visible |
|--------|----------|-------|----------------|
| Cube A | BoxGeometry(a,a,a) | cyan (opacity 0.85) | true |
| Cube B | BoxGeometry(b,b,b) | gold (opacity 0.85) | true |
| Unified L-solid bounding wireframe | EdgesGeometry | white (glow) | false |
| Block 1 (a×b×b from a-cube) | BoxGeometry(a,b,b) | cyan-light | false |
| Block 2 (a×(a−b)×a from a-cube) | BoxGeometry(a,a−b,a) | cyan-mid | false |
| Block 3 (a×b×(a−b) from a-cube) | BoxGeometry(a,b,a−b) | cyan-dark | false |
| Slab 1 merged ((a+b)×b×b) | BoxGeometry(a+b,b,b) | gold-green | false |
| Slab 2 merged ((a+b)×(a−b)×a) | BoxGeometry(a+b,a−b,a) | cyan | false |
| Wireframes for all slabs | EdgesGeometry | matching colors | false |
| Cut lines (dashed) | Line | white | false |
| Dimension lines | Lines + ticks | various | false |

### Animation Steps

**Step 1 — "The Two Cubes"**
- a³ cyan cube (left), b³ gold cube (right), separated by a gap
- Volume labels above each: "a³", "b³"
- Equation: `a³ + b³`

**Step 2 — "Merge Along One Edge"**
- b³ cube slides flush against a³ cube on X-axis (gap closes)
- Combined width = (a+b). Dimension line appears: "(a+b)" in coral along bottom.
- Equation: `a³ + b³ = ?`

**Step 3 — "The Unified Solid" (NEW — visual anchor)**
- Both cubes become slightly more transparent
- A white glowing wireframe bounding box appears around the combined L-shaped solid
- Label: `Total volume = a³ + b³ = ${numericValue}`
- This step PROVES: "everything inside this wireframe = a³ + b³"
- Brief pause (400ms) — let student absorb this

**Step 4 — "Slice the a-Cube"**
- Dashed white cut lines appear inside the a-cube, showing 3 blocks:
  - Block 1 (bottom-front): a × b × b
  - Block 2 (top): a × (a−b) × a
  - Block 3 (bottom-back): a × b × (a−b)
- Each block gets a subtly different cyan shade
- Bounding wireframe stays visible (anchor)

**Step 5 — "Form Slab 1"**
- Cube B slides back to merge with Block 1
- Together: (a+b) × b × b
- Block 1 and Cube B fade out. Slab 1 merged fades in (same position).
- Label: cross-section "b²"

**Step 6 — "Form Slab 2"**
- Block 3 rotates to align, then slides to adjoin Block 2
  - **Rotate first (200ms), then translate (200ms)** — never simultaneous
- Together: (a+b) × (a−b) × a
- Block 2 and Block 3 fade out. Slab 2 merged fades in.
- Label: cross-section "a² − ab"

**Step 7 — "The Revelation"**
- Bounding wireframe fades out
- Pull slabs apart on Y-axis (slight separation)
- Dimension bracket across both: "(a+b)"
- Cross-section labels: "b²" and "a² − ab"
- Total: "b² + (a² − ab) = a² − ab + b²"
- Equation: `a³ + b³ = (a+b)(a² − ab + b²)` ✓
- Camera auto-orbits ~15° for better view of separated slabs

### Geometry Verification
- Slab 1: (a+b) × b × b → volume = (a+b)b² = ab² + b³
- Slab 2: (a+b) × (a−b) × a → volume = a(a+b)(a−b) = a(a²−b²) = a³ − ab²
- Total: ab² + b³ + a³ − ab² = a³ + b³ ✓

### Camera
- Steps 1-3: 3/4 view (azimuth ~40°, polar ~60°)
- Steps 5-7: auto-orbit slightly for better depth perception
- Dynamic target: `controls.target.lerp(slabCentroid, t)` during step 7

---

## MODE 7: a³ − b³ — 6-Step In-Place Decomposition

### Pre-instantiate at build time

| Object | Geometry | Color | Initial visible |
|--------|----------|-------|----------------|
| Solid a-cube | BoxGeometry(a,a,a) | cyan (opacity 0.8) | true |
| A-cube wireframe | EdgesGeometry | cyan | true |
| Gold b-cube (corner) | BoxGeometry(b,b,b) | gold (opacity 0.85) | false |
| Slab 1: a×a×(a−b) | BoxGeometry(a,a,a−b) | cyan | false |
| Slab 2: a×(a−b)×b | BoxGeometry(a,a−b,b) | green | false |
| Slab 3: (a−b)×b×b | BoxGeometry(a−b,b,b) | gold | false |
| Wireframes for all slabs | EdgesGeometry | matching | false |
| Cut lines (dashed) | Line | white | false |
| Dimension lines | Lines + ticks | various | false |

### Coordinate System

a-cube occupies `[0,a] × [0,a] × [0,a]`, centered at origin. b-cube removed from corner `[a-b,a] × [a-b,a] × [a-b,a]`.

Slab positions in the L-solid:
- Slab 1: `[0,a] × [0,a] × [0,a-b]` — full back wall, depth (a−b). Cross-section: a² (facing +Z).
- Slab 2: `[0,a] × [0,a-b] × [a-b,a]` — bottom-front strip, height (a−b). Cross-section: ab (facing +Y).
- Slab 3: `[0,a-b] × [a-b,a] × [a-b,a]` — left-front-top piece, width (a−b). Cross-section: b² (facing +X).

Note: the (a−b) dimension is on a DIFFERENT axis for each slab initially.

### Animation Steps

**Step 1 — "The Cube"**
- Solid cyan a³ cube with wireframe overlay
- Dimension lines: "a" on three visible edges
- Equation: `a³`

**Step 2 — "Remove b³"**
- Gold b³ cube appears in top-right-front corner (opacity 0 → 0.85)
- Dimension label: "b"
- Gold cube slides out diagonally and fades (opacity → 0)
- Solid a-cube fades out. The 3 slabs fade in at their L-solid positions (all `visible = true`).
- Equation: `a³ − b³`

**Step 3 — "Show the Cut Lines"**
- Dashed white lines appear showing where the 3 slabs meet
- Each slab gets a label: "a²", "ab", "b²" (cross-section area)
- Dimension labels on each slab showing all 3 dimensions
- All slabs still in L-solid formation

**Step 4 — "Explode"**
- 3 slabs push apart from center (translate outward ~2 units each)
- Labels follow
- Student can now see each slab individually
- Camera target tweens to centroid of exploded pieces

**Step 5 — "Align Thickness"**
- Slab 2 rotates so its (a−b) dimension aligns with Z-axis (matching Slab 1)
  - Rotate first (200ms), pause (100ms)
- Slab 3 rotates so its (a−b) dimension aligns with Z-axis
  - Rotate (200ms), pause (100ms)
- After rotation: all 3 slabs are "bread slices" with uniform depth (a−b) along Z
- Camera auto-orbits toward top-down view to make uniform thickness obvious

**Step 6 — "Stack & Factor"**
- 3 slabs slide together, stacking along Y-axis like bread slices
- Dimension bracket on the side: shared depth "(a−b)"
- Front face labels: "a²" + "ab" + "b²"
- Equation: `a³ − b³ = (a−b)(a² + ab + b²)` ✓

### Camera Animation
- Steps 1-3: isometric (azimuth 45°, polar 55°)
- Step 4: hold isometric
- Steps 5-6: orbit toward more top-down (polar → 35°) so slab thickness is obvious

---

## Drill Questions (Updated)

### Mode 2 (Perfect Squares)
- **"What is the side length of a square with area N?"** → text, accept integer or "none"

### Mode 3 (Perfect Cubes)
- **"What is the edge length of a cube with volume N?"** → text, accept integer or "none"

### Mode 4 ((a+b)²) — keep existing, they work:
- "Evaluate (a+b)²" → numeric
- "Area of one ab region?" → numeric
- "Expand (a+b)²" → MC

### Mode 5 (a²−b²)
- "What are the dimensions of the resulting rectangle?" → pair input (e.g., "10,4")
- "What is a²−b²?" → numeric
- MC for factored form

### Mode 6 (a³+b³) — MC for factored form
### Mode 7 (a³−b³) — MC for factored form

---

## Edge Case Testing

| Test Case | What to Check |
|-----------|--------------|
| a=1, b=1 (sum/diff cubes) | Diff of cubes: a−b=0, should be excluded from slider range (b < a enforced). Sum of cubes: slabs are 2×1×1, labels must not overlap. |
| a=2, b=1 | Thin slabs (thickness 1). Labels must not clip into geometry. |
| a=6, b=5 (max with thin diff) | Large cubes with (a−b)=1 slabs. Performance check: geometry count still low. |
| a=1, b=1 ((a+b)²) | 2×2 square with tiny regions. Labels must offset outside if region too small. |
| b=1 (a²−b²) | Very thin top-left piece. Rotation animation still smooth. |

---

## Anti-Jank Rules

1. **Never translate and rotate simultaneously.** Rotate first, then translate. Sequential steps.
2. **Never create/destroy geometry mid-animation.** Pre-instantiate, toggle visibility.
3. **Never swap geometry on a mesh.** Use separate meshes, toggle visible.
4. **Wireframe polygon offset**: `polygonOffsetFactor: -1, polygonOffsetUnits: -1` to prevent Z-fighting with solid faces.
5. **Camera target lerp**: When exploding slabs, lerp `controls.target` to new centroid.
6. **DOM label Z-culling**: For 3D modes, check projected Z; hide labels facing away from camera.

---

## Performance Budget

- Max simultaneous meshes per mode: ~15 (pre-instantiated, most invisible)
- Max DOM labels per mode: ~12
- Target: 30+ FPS on Chromebook (Intel HD, 2GB VRAM)
- DPR: capped at 2
- No shadows, no post-processing
- InstancedMesh only for modes 2-3 (unit tiles/cubes)
- BoxGeometry solids for modes 4-7

---

## QA Checklist (Pre-Launch)

### Visual & Math Correctness
- [ ] Each identity proof: walk through all 6-7 steps, verify geometry matches algebra at every step
- [ ] Multiplicity grading: perfect squares require ALL even exponents, cubes require ALL multiples of 3
- [ ] Edge cases a=2,b=1 and a=1,b=1: labels don't overlap, slabs don't clip
- [ ] No frame where translate + rotate happen simultaneously

### Performance & Stability
- [ ] Memory audit: toggle all 7 modes 20× rapidly. DOM count and JS Heap must stabilize.
- [ ] No visual flicker during mode switch (all geometry pre-instantiated)
- [ ] 30+ FPS on Chromebook (or Chrome with GPU throttling)

### Accessibility
- [ ] Reduce-motion toggle: all steps snap to final state, no animation
- [ ] `aria-live="polite"` on feedback region
- [ ] Keyboard navigation: Tab through mode tabs, Enter to activate
- [ ] Touch targets ≥ 44px

### Persistence & Routing
- [ ] localStorage writes don't block main thread (batch after drill completion, not per-keystroke)
- [ ] `npm run build` → `dist/standalone/math-viz/index.html` exists
- [ ] Vite dev server: `/standalone/math-viz/index.html` loads correctly
- [ ] Vercel: standalone page accessible without interfering with `/platform/app.html`

---

## Files to Modify

**`standalone/math-viz/index.html`** — the only file. All changes within.

### Sections to rewrite:

| Section | Change |
|---------|--------|
| HTML body | Add `#label-layer` div, `.step-controls` UI |
| CSS | Add `.viz-label` classes, step control styles, dimension line styles |
| `createTextSprite()` | **Delete entirely**. Replace with `LabelManager` class |
| `LabelManager` (new) | DOM overlay creation, projection, Z-culling, cleanup |
| `createDimensionLine()` (new) | Tick-line helper |
| Step controls (new) | Wire ‹ › ▶ to animation queue |
| Mode 1 (prime) | No changes |
| Mode 2 (squares) | Drill input fix, DOM labels, dimension lines |
| Mode 3 (cubes) | Drill input fix, DOM labels, dimension lines, camera unlock |
| Mode 4 (ab2) | **Full rewrite**: pre-instantiate + 6-step proof |
| Mode 5 (diff2) | **Full rewrite**: pre-instantiate + 6-step proof |
| Mode 6 (sum3) | **Full rewrite**: pre-instantiate + 7-step proof with unified solid anchor |
| Mode 7 (diff3) | **Full rewrite**: pre-instantiate + 6-step proof with thickness alignment |
| Drill engine | Update question text for modes 2-3, keep rest |
| All mode dispose() | Ensure full geometry/material/label cleanup |
