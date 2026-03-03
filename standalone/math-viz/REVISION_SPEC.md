# Revision Spec: Visual & Animation Overhaul

## Summary of Changes

This revision addresses 3 categories of problems found during live testing:
1. **Labels too small / unreadable** → switch to HTML DOM overlays
2. **Drill inputs require untypeable symbols (√, ∛)** → reframe questions geometrically
3. **Identity animations aren't rigorous** → complete choreography rewrites for modes 3-7

---

## GLOBAL CHANGE 1: HTML DOM Overlays Replace Sprite Labels

**Remove all `createTextSprite()` usage for labels.** Replace with absolutely-positioned `<div>` elements over the canvas.

### Implementation

Add a `<div id="label-layer">` sibling to the canvas container, with `position: relative` on the parent and `position: absolute; pointer-events: none` on the label layer.

```html
<div id="viz-wrapper" style="position: relative;">
  <canvas id="viz-canvas"></canvas>
  <div id="label-layer" style="position: absolute; inset: 0; pointer-events: none; overflow: hidden;"></div>
</div>
```

Each label is a `<div>` child of `#label-layer`:

```css
.viz-label {
  position: absolute;
  transform: translate(-50%, -50%);  /* center on point */
  font-family: 'Segoe UI', sans-serif;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.2s;
}
.viz-label--large { font-size: 1.6rem; }   /* area/volume readouts */
.viz-label--medium { font-size: 1.1rem; }  /* region labels: a², ab, b² */
.viz-label--dim { font-size: 0.95rem; }    /* dimension annotations */
```

### Projection in Animation Loop

Each label stores a `THREE.Vector3` world position. On each frame:

```js
function updateLabelPositions(labels, camera, canvas) {
  const rect = canvas.getBoundingClientRect();
  for (const { el, worldPos } of labels) {
    const v = worldPos.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * rect.width;
    const y = (-v.y * 0.5 + 0.5) * rect.height;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
}
```

### KaTeX in Labels

For labels that need math (like `a²`, `(a+b)²`), render via `katex.renderToString()` inline. Since labels are DOM elements, KaTeX works natively — no canvas texture hacks.

### Benefits
- Crisp at all zoom levels and DPR
- Scales on mobile without pixelation
- Zero WebGL overhead
- Supports color via CSS: `style="color: var(--a)"` for cyan terms

---

## GLOBAL CHANGE 2: Dimension Annotation Lines

For showing measurements like "a", "b", "a+b" on edges of shapes, use **architectural tick-lines**: a thin `THREE.Line` with small perpendicular end-ticks, colored to match the term.

```
   a (cyan label, DOM overlay)
|←————————————→|
```

Implementation:
- `THREE.Line` with `LineBasicMaterial({ color: COLOR_NUM.a })` for the main span
- Two short perpendicular line segments at each end (height ~0.15 units)
- DOM overlay label centered at the midpoint of the line

Create a helper:
```js
function createDimensionLine(scene, labels, {
  start,       // THREE.Vector3
  end,         // THREE.Vector3
  color,       // 0x58c4dd
  labelText,   // "a" or "a+b"
  labelClass,  // 'viz-label--dim'
  offset,      // perpendicular offset from the edge (so line doesn't overlap shape)
}) { ... }
```

---

## GLOBAL CHANGE 3: Step-by-Step Playback Controls

For identity modes (3-7) with 5+ animation steps, add a **"Next Step" button** so students control the proof pace. Autoplay is still available via a "Play All" button.

```html
<div class="step-controls">
  <button id="step-prev" title="Previous step">‹</button>
  <span id="step-counter">Step 2 / 6</span>
  <button id="step-next" title="Next step">›</button>
  <button id="step-play" title="Play all">▶</button>
</div>
```

Place this inside the explore controls panel, below the sliders. When in "step" mode:
- Each click of "›" advances one animation step (400ms duration + 200ms pause)
- "‹" reverses to the previous step's end state
- "▶" autoplays remaining steps

For simple modes (1-3) that have ≤2 steps, keep autoplay only (no step controls).

### Animation Pacing
- **Step duration**: 400ms (down from 500ms)
- **Inter-step pause**: 200ms
- **Reduced motion**: steps resolve in ≤80ms, no pause

---

## MODE 1 & 2: Perfect Squares & Cubes — Drill Input Fix

### Problem
Students can't type √ or ∛ on a keyboard.

### Fix: Reframe as Geometric Questions

**Perfect Squares drill:**
- Old: "Is 84 a perfect square? If yes, enter √84."
- New: **"What is the side length of a square with area 84? (Enter a whole number, or 'none')"**

**Perfect Cubes drill:**
- Old: "Is 125 a perfect cube? If yes, enter ∛125."
- New: **"What is the edge length of a cube with volume 125? (Enter a whole number, or 'none')"**

### Input Type Change
- Change from `yesno-root` to **`text`** input
- Accept: a whole number (correct root) or the word "none" (not a perfect power)
- Grading: parse input; if numeric, check if it's the exact root; if "none", check that the number is indeed not a perfect power

### Label Sizing Fix
- Area label (e.g., "Area = 64"): use `.viz-label--large` (1.6rem, bold), positioned as DOM overlay above the grid/cube
- Add **dimension lines** on bottom and right edges of the square (or two visible edges of the cube) showing the side/edge length

---

## MODE 3: (a+b)² — Complete Choreography Rewrite

### Current: 2 steps (dividers appear → regions separate). No geometric argument.

### New: 6-Step Geometric Proof

**Step 1 — "The Side Length"**
- Draw a horizontal line segment at the bottom of the viewport
- Left portion: cyan, length `a`. Right portion: gold, length `b`.
- Dimension labels below: "a" (cyan) and "b" (gold)
- Equation panel: shows `a + b`

**Step 2 — "Duplicate & Rotate"**
- The line segment duplicates and rotates 90° CCW around the left endpoint
- Now forms an L-shape: horizontal (a+b) and vertical (a+b)
- These are the two sides of the square we're about to build

**Step 3 — "Sweep to Form the Square"**
- A square area sweeps/fills from the L-shape corner (like a curtain pulling across)
- Color: faint unified gray (`#2a2a4a`) — NOT yet partitioned
- Large DOM label fades in at center: `(a+b)²`
- Equation panel: `(a+b)²`

**Step 4 — "Partition"**
- Dashed white dividing lines appear:
  - Horizontal line at height `a` from the bottom
  - Vertical line at width `a` from the left
- The square is now visibly divided into 4 regions (but still gray)
- Equation panel: `(a+b)² = ?`

**Step 5 — "Color & Label"**
- Each region fades from gray to its semantic color:
  - Bottom-left (a×a): cyan → label "a²"
  - Top-left (a×b): green → label "ab"
  - Bottom-right (b×a): green → label "ab"
  - Top-right (b×b): gold → label "b²"
- Dimension lines appear along outer edges: bottom shows `a` (cyan) + `b` (gold), left shows `a` (cyan) + `b` (gold)
- Equation panel: `(a+b)² = a² + ab + ab + b²` (color-matched)

**Step 6 — "Combine Like Terms"**
- The two "ab" labels pulse, visually merge (text animation): `ab + ab → 2ab`
- Equation panel updates: `(a+b)² = a² + 2ab + b²` (final form)
- Regions stay colored; the square remains intact

### Region Positioning (corrected from spec review)
With origin at bottom-left of the square:
- a² region: bottom-left, position `(a/2, a/2)`, size `a × a`
- ab region (top-left): position `(a/2, a + b/2)`, size `a × b`
- ab region (bottom-right): position `(a + b/2, a/2)`, size `b × a`
- b² region (top-right): position `(a + b/2, a + b/2)`, size `b × b`

### Label Sizing
- Region labels ("a²", "ab", "b²"): `.viz-label--medium` (1.1rem), centered in region
- If region is too small for label (e.g., b=1), offset label outside with a thin pointer line
- Use KaTeX for superscripts: `katex.renderToString('a^2')`

---

## MODE 4: a² − b² — Complete Choreography Rewrite

### Current: 2 steps, confusing cut-and-slide. Not rigorous.

### New: 6-Step Geometric Proof

**Step 1 — "The Square"**
- a×a cyan square, fully filled
- Dimension lines: "a" on bottom and left edges
- DOM label at center: "a²"

**Step 2 — "Mark & Remove b²"**
- Gold b×b square appears in the **top-right corner** (overlay, semi-transparent)
- Dimension lines on gold square: "b" on its edges
- Gold square shrinks/fades away, leaving the L-shaped remainder
- Equation panel: `a² − b²`

**Step 3 — "The Cut"**
- A red dashed horizontal line appears at height `(a−b)` from the bottom
- This splits the L-shape into two rectangles:
  - **Bottom piece**: width `a`, height `(a−b)` — stays cyan
  - **Top-left piece**: width `(a−b)`, height `b` — stays cyan but gains a white outline/glow to indicate it's the "active" piece
- Dimension labels appear on each piece

**Step 4 — "Telegraph the Move"**
- The top-left piece slightly scales up (1.05×) and gains a subtle white glow/outline
- Brief pause (200ms) — student registers "this piece is about to move"

**Step 5 — "Rotate & Snap"**
- The top-left piece rotates 90° clockwise
- Its dimensions visually swap: was `(a−b) × b`, now displays as `b × (a−b)`
- It slides to the right side of the bottom piece and snaps flush
- Result: a single rectangle, width `(a+b)`, height `(a−b)`

**Step 6 — "Label the Result"**
- The rectangle pulses once
- Dimension bracket annotations appear:
  - Bottom edge: `a + b` (with cyan `a` portion and gold `b` portion marked)
  - Left edge: `a − b`
- Equation panel: `a² − b² = (a+b)(a−b)`
- DOM label at center of rectangle: `(a+b)(a−b) = [numeric value]`

### Geometry Verification
The L-shape after removing b² from top-right corner of a×a:
- Bottom strip: width `a`, height `(a-b)` → area = `a(a-b)`
- Top-left strip: width `(a-b)`, height `b` → area = `b(a-b)`
- Total: `a(a-b) + b(a-b) = (a-b)(a+b)` ✓
- After rotation + slide: rectangle `(a+b) × (a-b)` ✓

---

## MODE 5: a³ + b³ — Complete Choreography Rewrite

### Current: Two cubes that separate and come back. No proof.

### New: Rigorous Geometric Decomposition

Use **BoxGeometry solids** (not voxels) with wireframe edges (`EdgesGeometry` + `LineSegments`) for clean visual tracking.

**Step 1 — "The Two Cubes"**
- a³ cube (cyan, slightly transparent `opacity: 0.85`) on the left
- b³ cube (gold, `opacity: 0.85`) on the right
- Both resting on a shared "floor" plane
- Volume labels above each: "a³" and "b³"
- Equation panel: `a³ + b³`

**Step 2 — "Merge Along One Edge"**
- Slide b³ cube flush against a³ cube on the X-axis
- Total combined width is now exactly `(a+b)`
- A dimension line appears along the bottom showing `(a+b)` in coral
- Equation panel: `a³ + b³ = ?`

**Step 3 — "Slice the a-Cube"**
- Show cut lines (dashed white) inside the a-cube, dividing it into 3 blocks:
  - Block 1 (bottom-front): `a × b × b` — this will pair with b³
  - Block 2 (top): `a × (a−b) × a` — the tall remaining piece
  - Block 3 (bottom-back): `a × b × (a−b)` — the thin remaining piece
- Each block gets a subtle different shade to distinguish them

**Step 4 — "Form Slab 1"**
- The gold b³ cube slides backward to merge with Block 1
- Together they form: `(a+b) × b × b` — one continuous slab
- Color: blend of gold/green to show it's a merged piece
- Label: "b²" (the cross-section area)

**Step 5 — "Form Slab 2"**
- Block 3 rotates 90° and slides to adjoin Block 2
- Together they form: `(a+b) × (a−b) × a`
- Wait — let me verify: Block 2 is `a × (a-b) × a` and Block 3 is `a × b × (a-b)`.
  After rotating Block 3 so its `a` dimension aligns with Block 2's `a` dimension along the combined axis:
  Block 2 contributes width `a`, Block 3 contributes width `b` → total width `(a+b)` ✓
  Both have the same height `(a-b)` and depth `a` ✓
- Color: cyan shades
- Label: "a² − ab" (the cross-section area... but this is `a(a-b)` = `a²-ab`)

**Step 6 — "The Revelation"**
- Pull the two slabs apart slightly on the Y-axis
- Both slabs visibly share width `(a+b)`
- A dimension bracket appears across both showing `(a+b)`
- Cross-section labels:
  - Slab 1: area `b²`
  - Slab 2: area `a² − ab`
  - Total cross-section: `a² − ab + b²`
- Equation panel: `a³ + b³ = (a+b)(a² − ab + b²)` ✓

### Geometry Verification
- Slab 1: `(a+b) × b × b` → volume = `(a+b)b²` = `ab² + b³`
- Slab 2: `(a+b) × (a-b) × a` → volume = `(a+b)(a-b)a` = `a(a²-b²)` = `a³ - ab²`
- Total: `ab² + b³ + a³ - ab²` = `a³ + b³` ✓

### Camera
- Start: perspective, azimuth ~40°, polar ~60° (3/4 view)
- During steps 4-6: auto-orbit slightly so student sees the slabs from a different angle

---

## MODE 6: a³ − b³ — Refined Choreography

### Current: Slabs appear from off-screen. Not rigorous.

### New: In-Place Decomposition with Thickness Alignment

**Step 1 — "The Cube"**
- Solid cyan a³ cube (slightly transparent, `opacity: 0.8`)
- Wireframe edges visible
- Dimension lines: "a" on three visible edges
- Equation panel: `a³`

**Step 2 — "Remove b³"**
- Gold b×b×b cube appears in the **top-right-front corner** (nestled into the corner)
- Dimension line: "b" on its edge
- The gold cube slides out diagonally and fades
- The remaining L-shaped 3D solid is `a³ − b³`
- Equation panel: `a³ − b³`

**Step 3 — "Decompose In Place"**
- Cut lines (dashed white) appear inside the L-solid, showing the 3-slab partition:
  - **Slab 1 (back face)**: `a × a × (a−b)` — the full back wall. Color: cyan.
  - **Slab 2 (under b³)**: `a × b × (a−b)` — sits below where b³ was. Color: green.
  - **Slab 3 (beside b³)**: `(a−b) × b × b` — fills the remaining gap. Color: gold.

Wait — I need to verify this decomposition more carefully.

The a³ cube occupies `[0,a] × [0,a] × [0,a]`. Remove `[a-b,a] × [a-b,a] × [a-b,a]` (the b³ corner).

The remaining L-solid can be cut into:
- Slab 1: `[0,a] × [0,a] × [0,a-b]` → dimensions `a × a × (a-b)`. This is the entire back portion (full a×a face, depth a-b). ✓
- Slab 2: `[0,a] × [0,a-b] × [a-b,a]` → dimensions `a × (a-b) × b`. The bottom-front strip. ✓
- Slab 3: `[0,a-b] × [a-b,a] × [a-b,a]` → dimensions `(a-b) × b × b`. The left-front-top piece. ✓

Check: Slab1 + Slab2 + Slab3 = `a²(a-b) + ab(a-b) + b²(a-b)` = `(a-b)(a² + ab + b²)` = `a³ - b³` ✓

Cross-section areas (perpendicular to the shared `(a-b)` dimension):
- Slab 1: `a × a = a²` ✓
- Slab 2: `a × b = ab` ✓  (note: the (a-b) is the DEPTH of this slab, and we need to reorient)
- Slab 3: `b × b = b²` ✓

The (a−b) dimension is on DIFFERENT AXES for each slab in their original positions. This is the key visual challenge.

**Step 4 — "Explode"**
- The 3 slabs push apart from center so each is individually visible
- Each slab gets its label: "a²", "ab", "b²" (referring to cross-section area)
- Dimension lines on each slab show all three dimensions

**Step 5 — "Align Thickness"**
- Slab 2 and Slab 3 rotate so that their `(a−b)` dimension aligns with the same axis as Slab 1's `(a−b)` dimension (Z-axis / depth)
- This is the key visual: after rotation, all 3 slabs are "bread slices" with the same thickness

**Step 6 — "Stack & Factor"**
- The 3 slabs slide together like slices of bread, stacked along the Y-axis
- A dimension bracket appears on the side showing their shared depth: `(a−b)`
- Front face labels show the areas: `a²` + `ab` + `b²`
- Equation panel: `a³ − b³ = (a−b)(a² + ab + b²)`

### Camera Animation
- Steps 1-3: isometric view (azimuth 45°, polar 55°)
- Steps 5-6: auto-orbit to more top-down view so the uniform slab thickness is obvious

---

## Drill Question Updates (All Identity Modes)

### Mode 3 (a+b)² — keep existing questions, they're fine:
- "Evaluate (a+b)²" → numeric
- "Area of one ab region?" → numeric
- "Expand (a+b)²" → multiple choice

### Mode 4 (a²−b²) — update for geometric framing:
- "What are the dimensions of the resulting rectangle? (e.g., 10,4)" → pair input
- "What is a²−b² when a=7, b=3?" → numeric (40)
- Keep MC option for factored form

### Mode 5 (a³+b³) — keep MC for factored form:
- "Factor a³+b³ using the identity" → MC with concrete values

### Mode 6 (a³−b³) — keep MC for factored form:
- "Factor a³−b³ using the identity" → MC with concrete values

---

## Files to Modify

- `standalone/math-viz/index.html` — all changes are in this single file

### Sections to rewrite:
1. **HTML**: Add `#label-layer` div, add `.step-controls` UI, add CSS for `.viz-label` classes
2. **CSS**: Add label overlay styles, step control styles, dimension line styles
3. **JS — Label system**: New `LabelManager` class replacing all `createTextSprite` usage
4. **JS — Dimension lines**: New `createDimensionLine` helper
5. **JS — Step controls**: Wire up next/prev/play buttons to animation queue
6. **JS — Mode 1 (prime)**: Keep as-is (2D canvas, working well)
7. **JS — Mode 2 (squares)**: Fix drill input type, add dimension lines, use DOM labels
8. **JS — Mode 3 (cubes)**: Fix drill input type, add dimension lines, use DOM labels
9. **JS — Mode 4 (ab2)**: Complete rewrite of scene building + 6-step animation
10. **JS — Mode 5 (diff2)**: Complete rewrite of scene building + 6-step animation
11. **JS — Mode 6 (sum3)**: Complete rewrite — new geometric decomposition + 6-step animation
12. **JS — Mode 7 (diff3)**: Major revision — in-place decomposition + rotation alignment + 6-step animation

---

## Verification

1. `npm run dev` → open app → every tab should render with DOM overlay labels (no sprites)
2. Labels remain crisp when zooming/resizing
3. Perfect square/cube drills accept "none" for non-perfects, whole numbers for roots
4. Identity modes: click through all 6 steps, verify geometry is correct at each step
5. "Play All" auto-advances through steps with 400ms + 200ms pacing
6. Responsive: labels don't overflow on <768px screens
7. Reduce-motion: steps resolve instantly
8. `npm run build` passes, `dist/standalone/math-viz/index.html` exists
