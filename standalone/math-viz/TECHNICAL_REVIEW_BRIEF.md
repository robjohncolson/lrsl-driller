# Math Foundations Visualizer and Drill - Technical Review Brief

## 1. Product Goal
This app is a prerequisite-skills bridge for students preparing for:
- factoring sum/difference of cubes,
- binomial expansion,
- identity recognition through geometry.

The design intent is to connect three forms of reasoning in one place:
- arithmetic structure (prime factors, perfect powers),
- geometric structure (area/volume decomposition),
- symbolic algebra (expanded and factored forms).

## 2. Scope and Runtime
- Single-page standalone app at `standalone/math-viz/index.html`.
- Built with Vite multi-page configuration, deployed on Vercel.
- Runtime stack:
- Three.js `0.159.0` (module import map),
- OrbitControls for 3D modes,
- KaTeX `0.16.9` for equations and label math.

## 3. Primary UX Layout
- Header with title, mode tabs, stats, and reduced-motion toggle.
- Main content area:
- left: visualization viewport,
- right: drill panel.
- Explore panel below visualization:
- sliders,
- `Play All`,
- `Reset`,
- step controls for multi-step proof modes.
- Responsive behavior:
- desktop/tablet: side-by-side visualization and drill,
- narrow screens: drill stacks below visualization.

## 4. Modes
Seven modes are always accessible:
- `Prime Factorization`
- `Perfect Squares`
- `Perfect Cubes`
- `(a+b)^2`
- `a^2-b^2`
- `a^3+b^3`
- `a^3-b^3`

Mode slider ranges:
- prime `N`: `2-500`
- squares `n`: `1-20`
- cubes `n`: `1-12`
- `(a+b)^2`: `a,b in 1-10`
- `a^2-b^2`: `a in 2-10`, `b in 1..a-1`
- `a^3+b^3`: `a,b in 1-6`
- `a^3-b^3`: `a in 2-6`, `b in 1..a-1`

## 5. Visualization and Math Behavior by Mode

### 5.1 Prime Factorization
- 2D canvas factor-tree renderer with step reveal.
- Composite nodes are gray, prime leaves are cyan.
- Displays prime-power product form.
- Exponents are highlighted for:
- even-exponent square inference,
- exponent-multiple-of-3 cube inference.

### 5.2 Perfect Squares
- Orthographic tile-grid square build.
- Area label and dimension context are shown.
- Non-perfect values are represented with nearest square context.

### 5.3 Perfect Cubes
- Perspective 3D cube build using InstancedMesh.
- Layer-by-layer construction.
- OrbitControls enabled (rotate, zoom).

### 5.4 (a+b)^2
- 6-step 2D area proof with partitioned regions:
- `a^2` (cyan),
- two `ab` regions (green),
- `b^2` (gold).
- Equation transitions from expression to expanded identity.

### 5.5 a^2-b^2
- 6-step geometric proof:
- start with `a x a` square,
- remove `b x b` corner,
- cut and rearrange into rectangle,
- reveal `(a+b)(a-b)`.

### 5.6 a^3+b^3
- 6-step 3D choreography:
- two cubes (`a^3`, `b^3`) on floor,
- merge flush along one axis,
- dashed internal cuts in the larger cube,
- split into explicit blocks,
- form slab 1 by merging `b^3` with the compatible block,
- rotate/reposition remaining block(s) into slab 2,
- reveal common width `(a+b)` and final factorization.
- Uses dimension lines to make shared factor visually explicit.

### 5.7 a^3-b^3
- 6-step 3D choreography:
- show full `a^3` cube,
- remove highlighted `b^3` corner,
- decompose remaining L-solid into 3 slabs,
- explode slabs apart in different directions,
- rotate slabs to align shared thickness `(a-b)`,
- stack and factor to `(a-b)(a^2+ab+b^2)`.
- Includes per-slab and final shared-factor dimension emphasis.

## 6. Label and Annotation System
- Uses DOM overlay labels (not sprite textures) for crisp text at all zoom/DPR.
- Label manager projects world positions to screen each frame.
- Supports KaTeX rendering in labels and equation panel.
- Dimension annotations are rendered with:
- Three.js line segments with end ticks,
- centered DOM text labels.

## 7. Step Playback and Motion Rules
- Multi-step proof modes expose:
- previous step,
- next step,
- play remaining steps.
- Timing constants:
- default step duration: `400ms`,
- inter-step pause: `200ms`,
- reduced motion: `80ms` max per step and no pause.
- Easing uses cubic out transition for smoother proof motion.

## 8. Drill Engine
- Per-mode shuffle-bag generation.
- Recent-history filtering to reduce near-repeats.
- Difficulty auto-adjust per mode:
- `3` correct in a row -> level up,
- `2` wrong in recent window -> level down.
- Global ranges:
- L1: `2-30`
- L2: `30-200`
- L3: `200-1000` (includes tricky cases such as `441`, `729`).

Input types:
- `number`
- `text`
- `pair`
- `yesno`
- `mc`
- `prime`

Prime factor answer parser accepts exactly two forms:
- power form, e.g. `2^3 * 3^2 * 5`
- repeated-prime form, e.g. `2 * 2 * 2 * 3 * 3 * 5`

Square/cube root prompts use keyboard-friendly text answers:
- whole number root if perfect power,
- `"none"` if not a perfect power.

## 9. Scoring and Persistence
- Streak display is fixed-width 5-dot form (`●●●○○` style in UI rendering).
- Tracks:
- attempts,
- correct answers,
- accuracy,
- best streak,
- current per-mode difficulty.
- localStorage key: `mathVizDriller`.
- Includes schema version and merge-safe loading.

## 10. Performance Strategy
- Single shared WebGL renderer.
- Pixel ratio capped at `2`.
- InstancedMesh used where cube counts are high.
- Soft ambient + directional lighting.
- No shadows, no post-processing.
- Geometries/materials disposed on rebuild/switch to limit leaks.

## 11. Build and Deployment Notes
- Vite build input includes `standalone/math-viz/index.html`.
- Expected deployed route:
- `/standalone/math-viz/index.html`
- Primary app remains:
- `/platform/app.html`

## 12. Suggested Review Focus (Polish Pass)
- 3D camera framing during cubic step transitions.
- Piece clipping risk during slab rotations in cubic modes.
- Label overlap at small parameter values (`a=1`, `b=1` type cases).
- Consistency of dimension-line opacity transitions between steps.
- Mobile ergonomics and readability under `768px`.
- Final motion feel and didactic clarity of each proof step.

## 13. Acceptance Checklist for External Reviewer
- All 7 tabs present and navigable with no forced unlock.
- Step controls work on proof modes (prev/next/play).
- Reduced-motion mode shortens step duration and removes pauses.
- Drill grading matches answer format rules for each input type.
- Difficulty auto-adjust behaves as specified.
- localStorage persists per-mode stats and preferences after refresh.
- Cubic identity choreography is mathematically consistent and visually clear.
