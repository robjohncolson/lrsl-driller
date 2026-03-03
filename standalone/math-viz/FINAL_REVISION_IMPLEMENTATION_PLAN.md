# Math Foundations Visualizer v2 - Implementation Plan

This plan implements `standalone/math-viz/FINAL_REVISION_SPEC.md` as the source of truth and supersedes prior planning tied to `REVISION_SPEC.md`.

## 1. Objectives
- Deliver a production-stable v2 overhaul in one file: `standalone/math-viz/index.html`.
- Replace remaining legacy rendering/animation behavior with rigorous, step-driven proofs.
- Improve 3D clarity and stability (no mid-animation allocation churn, less flicker, better camera control).
- Keep existing route compatibility:
- `/platform/app.html`
- `/standalone/math-viz/index.html`

## 2. Scope
In scope:
- DOM label system with optional depth culling.
- Dimension annotation helper with tick-lines and DOM labels.
- Step playback controls for identity modes.
- Engine stability changes (pre-instantiation, visibility toggles, dispose correctness).
- OrbitControls unlock and dynamic target updates for 3D modes.
- Mode updates specified in v2 (especially full rewrites for modes 4-7).
- Drill text/input updates for perfect squares/cubes.
- QA and regression verification per v2 checklist.

Out of scope:
- Splitting app into multiple files/modules.
- Non-math visual redesign outside v2 requirements.
- Backend/services changes (all data remains local and in-memory/localStorage).

## 3. Implementation Strategy
Use a phased rollout with hard verification gates after each phase:

1. Core infrastructure first (labels, dimensions, step framework, stability patterns).
2. Drill engine text/input updates (small, testable changes).
3. Rebuild modes from simpler to hardest:
- mode 2, mode 3, mode 4, mode 5, mode 6, mode 7.
4. Apply 3D camera/controls tuning and anti-jank rules.
5. Run edge-case, performance, accessibility, and routing QA.

## 4. Phase Plan

## Phase 0 - Baseline and Safety
Deliverables:
- Snapshot current behavior with a quick smoke test on all tabs.
- Confirm build and deployment route still pass before edits.

Tasks:
- Run `npm run build` and note baseline warnings.
- Record current mode timings and control behavior for regression comparison.
- Keep all changes isolated to `standalone/math-viz/index.html`.

Exit criteria:
- Baseline build passes.
- Existing app routes are reachable.

## Phase 1 - Global Infrastructure
Goal: establish shared primitives before mode rewrites.

### 1.1 DOM Label System
Tasks:
- Ensure `#label-layer` overlay is present and correctly positioned over renderer canvas.
- Consolidate all scene labels through `LabelManager`.
- Add `depthCull` flag support per label.
- In label update loop, hide labels when projected z is out of clip range for 3D scenes.
- Keep KaTeX rendering support for inline and display math in labels.

Acceptance criteria:
- No `createTextSprite()` usage remains.
- Labels stay crisp when zooming and resizing.
- 3D labels do not visibly float when camera rotates behind geometry.

### 1.2 Dimension Annotation Helper
Tasks:
- Standardize `createDimensionLine()` contract:
- span line,
- end ticks,
- midpoint DOM label.
- Support color, offset vector, and tick size options.

Acceptance criteria:
- Dimension lines are reusable across all modes.
- Labels remain centered and readable.

### 1.3 Step Playback Framework
Tasks:
- Keep/normalize step controls (`prev`, `next`, `play all`) for identity modes.
- Ensure behavior:
- next animates forward with queue pacing,
- prev snaps to prior step state (no reverse tween),
- play iterates remaining steps.
- Ensure hidden/disabled state on non-step modes.

Acceptance criteria:
- Step counter remains correct after manual stepping and autoplay.
- Reduced-motion path resolves steps quickly without pause.

### 1.4 Engine Stability Pattern
Tasks:
- Define rule for all rewritten modes:
- instantiate all geometry at `rebuild/init`,
- never allocate/remove meshes mid-step,
- use `visible` and opacity toggles only.
- Verify each mode dispose path releases geometry/materials and clears labels.

Acceptance criteria:
- No visible flicker on step transitions caused by mesh creation/disposal.
- Repeated mode switching does not show unbounded memory growth.

## Phase 2 - Drill Engine and Prompt Updates
Goal: keyboard-friendly prompts and grading behavior.

Tasks:
- Mode 2 prompt: side length from area N; answer is integer root or `"none"`.
- Mode 3 prompt: edge length from volume N; answer is integer root or `"none"`.
- Ensure grader accepts whole numbers and `"none"` only.
- Keep existing identity drill types (numeric/pair/MC) unless v2 explicitly changes text.

Acceptance criteria:
- No sqrt/cbrt symbol typing is required.
- Correct and incorrect messages match new prompt semantics.

## Phase 3 - Mode 2 (Perfect Squares)
Tasks:
- Keep bounding-square non-perfect visualization.
- Use DOM label for `Area = ...` (`viz-label--large`).
- Add side dimension lines on bottom and right edges.
- Confirm text drill flow from Phase 2.

Exit criteria:
- Square scene stays performant across slider range `1-20`.
- Labels do not blur and remain positioned correctly.

## Phase 4 - Mode 3 (Perfect Cubes)
Tasks:
- Keep InstancedMesh cube build.
- DOM volume label with depth culling.
- Add edge dimension lines for visible edges.
- Apply unlocked OrbitControls settings (pan enabled, updated min/max distance, polar limit).

Exit criteria:
- Orbit controls remain stable while labels update.
- Drill input behavior aligns with Phase 2.

## Phase 5 - Mode 4 ((a+b)^2) Full 6-Step Rewrite
Tasks:
- Pre-instantiate all proof objects (lines, unified square, 4 regions, dividers, dimensions).
- Implement exact 6-step state machine from spec.
- Handle tiny region label fallback (offset label + pointer line when region too small).
- Keep equation panel synchronized by step.

Exit criteria:
- Every step is visually distinct and mathematically consistent.
- Final equation matches `a^2 + 2ab + b^2`.

## Phase 6 - Mode 5 (a^2-b^2) Full 6-Step Rewrite
Tasks:
- Pre-instantiate full square, removable b-square, cut pieces, outline, dimensions.
- Implement sequence with telegraph and strict rotation-then-translation motion.
- Ensure no simultaneous rotate+translate on moving piece.
- Final rectangle dimensions show `(a+b)` and `(a-b)`.

Exit criteria:
- Rearrangement is visually clean (no clipping).
- Result matches geometric proof of difference of squares.

## Phase 7 - Mode 6 (a^3+b^3) Full 7-Step Rewrite
Tasks:
- Pre-instantiate all cubes/blocks/slabs/cut lines/wireframes/dimensions.
- Add new Step 3 unified L-solid anchor with glowing bounding wireframe and total-volume label.
- Use strict step choreography:
- merge,
- unified solid anchor,
- cuts,
- slab 1 formation,
- slab 2 rotation then translation,
- reveal with shared `(a+b)` factor.
- Enforce anti-jank motion rules (sequential transforms).

Exit criteria:
- Student can track conservation of volume from initial cubes to final slabs.
- Final relation shown: `(a+b)(a^2-ab+b^2)`.

## Phase 8 - Mode 7 (a^3-b^3) Full 6-Step Rewrite
Tasks:
- Pre-instantiate full cube, removable b-cube, three slabs, cut lines, wireframes, dimensions.
- Keep slabs in L-solid formation first, then explode, then align thickness.
- Rotate slab 2 and slab 3 in separate sub-actions (not concurrent with translation).
- Step 6 stacks slabs and highlights shared `(a-b)` thickness.
- Camera target lerps to exploded/stacked centroid where specified.

Exit criteria:
- Shared thickness alignment is obvious.
- Final relation shown: `(a-b)(a^2+ab+b^2)`.

## Phase 9 - 3D Camera and Control Tuning
Tasks:
- Modes 3/6/7: apply unified OrbitControls config from spec.
- Enable pan.
- Expand zoom range.
- Clamp polar angle.
- During explode/reveal states, lerp controls target to piece centroid.

Exit criteria:
- Camera guidance improves comprehension without stealing user control.
- No control jitter during animations.

## Phase 10 - Stability, Accessibility, and Performance Hardening
Tasks:
- Enforce anti-jank rules globally:
- no mid-animation mesh creation/destruction,
- no geometry swapping in-place,
- no simultaneous rotate+translate for rearrangement pieces.
- Apply z-fighting mitigation for wireframe overlays.
- Confirm touch targets are >= 44px.
- Verify reduced motion resolves steps quickly and removes pauses.
- Ensure feedback region remains screen-reader friendly (`aria-live="polite"`).

Exit criteria:
- No visual tearing/flicker during high-frequency interactions.
- Accessibility checks pass for keyboard and motion preferences.

## 5. QA Matrix

## 5.1 Functional QA
- All 7 tabs render and switch cleanly.
- Sliders enforce ranges and dynamic constraints (`b < a` where required).
- Step controls only visible where intended.
- Equation panel updates correctly each step.

## 5.2 Edge Cases
- `a=1,b=1` sum cubes: labels must not overlap badly.
- `a=2,b=1` thin slabs: no clipping.
- `a=6,b=5` diff cubes: thin `(a-b)=1` slices still readable.
- `(a+b)^2` with tiny regions: label offset fallback works.
- `a^2-b^2` with `b=1`: rotation remains smooth.

## 5.3 Persistence
- localStorage key `mathVizDriller` still loads/saves with no schema regression.
- Stats, streaks, difficulty, and motion preference survive refresh.

## 5.4 Stability/Performance
- Rapidly switch across all modes 20 times.
- Monitor heap and DOM node count for stabilization.
- Target >=30 FPS on low-power hardware profile.

## 5.5 Build/Route
- `npm run build` succeeds.
- `dist/standalone/math-viz/index.html` exists.
- Dev route works: `/standalone/math-viz/index.html`.
- Production route works without breaking `/platform/app.html`.

## 6. Definition of Done
- All v2 global changes implemented.
- Modes 4-7 match required step choreography and proof rigor.
- Modes 2-3 drill prompt/input updates complete.
- Anti-jank and dispose constraints verified.
- QA checklist passes with no blocking issues.

## 7. Risk Register and Mitigations
- Risk: label overlap in small geometry.
- Mitigation: dynamic offset + pointer-line fallback.
- Risk: camera disorientation during automated moves.
- Mitigation: small target lerps, preserve user control, cap orbit deltas.
- Risk: z-fighting on wireframe overlays.
- Mitigation: polygon offset or slight edge scale bias.
- Risk: memory leaks from mode transitions.
- Mitigation: strict dispose paths + repeated switch audit.

## 8. Execution Order Summary
1. Baseline verify and scaffold checks.
2. Global primitives (labels, dimensions, steps, stability rules).
3. Drill prompt/input updates for modes 2-3.
4. Rebuild modes 2, 3, 4, 5, 6, 7 in that order.
5. Camera tuning for 3D modes.
6. Stability/accessibility/perf pass.
7. Final build + deployment verification.

