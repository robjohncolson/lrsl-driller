# Math Foundations Visualizer & Drill

## Implementation Plan

Date: 2026-02-26  
Target file: `standalone/math-viz/index.html` (single-file app)

## Scope and Outcomes

1. Build one standalone HTML app with:
1. Seven always-available tabs (Explore + Drill visible in every mode).
1. Three.js visualizations (plus 2D factor-tree canvas) aligned to the provided spec.
1. KaTeX-rendered equations in control/drill panels.
1. Drill engine with adaptive difficulty, shuffle-bags, streak scoring, and per-mode stats.
1. Persistent progress via `localStorage` key `mathVizDriller`.
1. Responsive layout with stack behavior below `768px`.

## Inputs Reviewed

1. Provided product spec for `Math Foundations Visualizer & Drill`.
1. [platform/core/ghost-maze-renderer.js](../../platform/core/ghost-maze-renderer.js) for Three.js lifecycle patterns:
1. Orthographic/perspective camera setup by mode.
1. `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
1. rAF loop ownership and full dispose cleanup.
1. [platform/core/ghost-orbits-renderer.js](../../platform/core/ghost-orbits-renderer.js) for loop/resize/destroy patterns:
1. explicit `start()` / `stop()` / `destroy()`.
1. predictable frame update cadence.
1. [cartridges/a2t3l3/generator.js](../../cartridges/a2t3l3/generator.js) for drill generation style:
1. shuffle-bag source banks.
1. mode-specific scenario builders returning structured data.

## Pre-Implementation Decisions

1. Keep everything in one HTML file as requested, but enforce internal module boundaries with named section blocks.
1. Use one shared `THREE.WebGLRenderer` and swap mode scene adapters to reduce memory churn.
1. For 3D tile/cube-heavy views, use `InstancedMesh` and avoid shadows/post-processing.
1. Use a deterministic seeded helper for repeatable drill generation during testing.
1. Add `standalone/math-viz/index.html` to Vite build input so production deploy includes this page.

## Color Palette (3B1B-inspired, mandatory)

All visualizations and KaTeX equations must use these exact colors consistently:

| Role | Hex | Three.js |
|------|-----|----------|
| Background | `#1a1a2e` | `0x1a1a2e` |
| Panel BG | `#0f0f23` | CSS only |
| a terms | `#58c4dd` | `0x58c4dd` |
| b terms | `#fcba03` | `0xfcba03` |
| Cross terms (ab) | `#83c167` | `0x83c167` |
| Results/answers | `#ff6b6b` | `0xff6b6b` |
| Prime nodes | `#58c4dd` | cyan |
| Composite nodes | `#a9a9a9` | gray |
| UI accent | `#7c3aed` | purple |
| Correct feedback | `#83c167` | green |
| Incorrect feedback | `#ff6b6b` | coral |
| Text primary | `#e8e8e8` | — |
| Text muted | `#6b7280` | — |

**KaTeX color matching is required.** Equations must use `\color{}{}` so terms match visualization regions:
```latex
\color{#58c4dd}{a^2} + \color{#83c167}{2ab} + \color{#fcba03}{b^2}
```

**a³−b³ slab colors**: a² slab = cyan (`#58c4dd`), ab slab = green (`#83c167`), b² slab = gold (`#fcba03`).

## Required Supporting Config Change

1. Update [vite.config.js](../../vite.config.js) `rollupOptions.input` to include:
1. `mathViz: 'standalone/math-viz/index.html'`
1. Reason: current build only emits `index.html` and `platform/app.html`; without this, Vercel build output may omit the standalone page.

## Single-File Internal Architecture

Planned section order inside `index.html`:

1. `<!doctype html>`, app shell, panel markup, tab controls, modal shell.
1. `<style>` (~300 lines):
1. tokens, layout grid, panels, controls, streak dots, feedback states, responsive breakpoints.
1. `<script type="importmap">`:
1. `three` and `three/addons/`.
1. KaTeX CSS/JS CDN tags in `<head>`.
1. `<script type="module">` with ordered blocks:
1. imports + constants.
1. math utilities.
1. shared animation queue.
1. shared Three scene manager.
1. factor-tree renderer.
1. mode scene adapters (7).
1. drill engine and generators.
1. progress tracker (`localStorage`).
1. UI controller and app bootstrap.

## State Model

Global runtime state:

1. `activeModeId`.
1. `reduceMotion` toggle.
1. `modeParams` per tab (sliders `n`, `a`, `b`, playback state).
1. `drillState` per tab:
1. current problem.
1. current difficulty (1-3).
1. streak and wrong-count windows.
1. best streak and totals (correct/attempted).
1. `stats` aggregate:
1. total attempts.
1. total correct.
1. overall accuracy.

Persistence schema at `mathVizDriller`:

1. `version`.
1. `updatedAt`.
1. `modes[modeId] = { bestStreak, attempts, correct, difficulty }`.
1. `global = { attempts, correct }`.
1. `prefs = { reduceMotion }`.

## Core System Plan

### 1) Math Utilities

Implement:

1. prime factorization (`factorizePrimePowers`, `formatPrimeFactors`).
1. `isPerfectSquare`, `isPerfectCube`, `nearestPerfectSquare`.
1. expression helpers for identity expansions/factor forms.
1. answer normalizers:
1. numeric parse.
1. canonical factorization parse (`2^3 * 3^2 * 5` variants accepted).
1. whitespace/operator normalization.

### 2) Animation Queue

Implement lightweight scheduler:

1. `enqueue({duration, easing, onUpdate, onComplete})`.
1. supports chained steps and cancellation on mode switch.
1. default easing `easeOutCubic`, default step duration **~500ms**.
1. reduced-motion mode maps durations to near-zero (≤100ms).
1. streak display: **5-dot format** `●●●○○`.

### 3) Scene Manager

Responsibilities:

1. create renderer once, cap DPR at 2.
1. manage active scene adapter lifecycle:
1. `mount(container)`.
1. `unmount(dispose=true)`.
1. `resize(width, height)`.
1. `tick(dt)`.
1. shared rAF loop + pause on hidden tab.
1. common lights preset (ambient + directional, no shadows).

### 4) Mode Adapters (7)

Each adapter implements:

1. `id`, `label`, param defaults/ranges.
1. `buildExploreScene()`.
1. `playExplainAnimation()`.
1. `resetExplore()`.
1. `renderDrillHint(problem, result)`.
1. `dispose()`.

## Mode-by-Mode Build Plan

### Mode 1: Prime Factorization — explore slider range: **2–500**

1. 2D canvas tree layout algorithm (top-down binary split).
1. Explore: slider picks number (2–500), tree auto-builds with stepped animation.
1. step animation: node split -> leaves settle -> prime leaves glow cyan (`#58c4dd`), composites gray (`#a9a9a9`).
1. KaTeX factorization line with exponent highlighting:
1. even exponents flagged for square readiness.
1. exponent multiples of 3 flagged for cube readiness.
1. Drill prompts:
1. exact factorization string.
1. optional "is perfect square/cube" inference checks at higher levels.

### Mode 2: Perfect Squares — explore slider range: **n = 1–20**

1. Orthographic scene with instanced unit tiles.
1. row-by-row build animation.
1. perfect vs non-perfect presentation:
1. perfect: exact `n x n` square, labeled `n² = total`.
1. non-perfect: show TWO bounding perfect squares (e.g., for 50: show 7×7=49 "too small" and 8×8=64 "too big") — not a single rectangle/gap.
1. Drill types:
1. yes/no + root for perfect square.
1. nearest perfect square.

### Mode 3: Perfect Cubes — explore slider range: **n = 1–12**

1. Perspective scene + `OrbitControls`.
1. instanced unit cubes, layer build.
1. labels for `n³ = total`.
1. Drill type:
1. perfect cube test + cube root entry.

### Mode 4: `(a+b)^2` — explore slider ranges: **a = 1–10, b = 1–10**

1. Orthographic area model with 4 colored planes: a² cyan, ab green (×2), b² gold.
1. animated sequence (~500ms per step, `easeOutCubic`):
1. full square.
1. divider lines.
1. slight region separation.
1. term labels/equation reveal with KaTeX color matching.
1. Drill types:
1. evaluate `(a+b)^2`.
1. compute `ab` region area.
1. choose/enter expanded form.

### Mode 5: `a^2-b^2` — explore slider ranges: **a = 2–10, b = 1–(a−1)** (b < a enforced)

1. start with `a x a` square (cyan).
1. remove `b x b` corner with fade (gold).
1. cut L-shape into 2 rectangles and slide to form `(a+b) × (a-b)` rectangle.
1. enforce `b < a` slider constraints.
1. Drill types:
1. factor using identity.
1. resulting rectangle dimensions.

### Mode 6: `a^3+b^3` — explore slider ranges: **a = 1–6, b = 1–6**

1. perspective scene + `OrbitControls`.
1. two cubes: a-cube cyan (`#58c4dd`), b-cube gold (`#fcba03`), side-by-side with volume labels.
1. overlay equation `(a+b)(a^2-ab+b^2)` with KaTeX color-coded terms.
1. highlight edge for `(a+b)` factor cue.
1. Drill: factor identity application with sign-sensitive validation.

### Mode 7: `a^3-b^3` — explore slider ranges: **a = 2–6, b = 1–(a−1)** (b < a enforced)

1. large `a` cube wireframe (cyan) + removable `b` cube corner (gold, animates out).
1. decompose remainder into three colored slabs, shared thickness `(a-b)`:
1. a×a×(a−b) slab → cyan (`#58c4dd`), represents a² term.
1. a×b×(a−b) slab → green (`#83c167`), represents ab term.
1. b×b×(a−b) slab → gold (`#fcba03`), represents b² term.
1. annotate slab dimensions to show `a^2 + ab + b^2` cross-section sum.
1. Drill: factor identity with correct plus sign in trinomial factor.

## Drill Engine Design

### Problem Banks

1. Separate bank per mode x difficulty.
1. Use shuffle-bag refill pattern (draw-all-before-repeat).
1. Avoid near-repeats:
1. keep recent queue of last 3 signatures.
1. redraw if collision.

### Difficulty Adaptation

1. `+1 level` after 3 consecutive correct (max 3).
1. `-1 level` after any 2 incorrect within recent window (min 1).
1. show current level badge in drill panel.
1. Number ranges per level:
1. L1: small (2–30), common perfect powers (4, 8, 9, 16, 25, 27).
1. L2: medium (30–200), less obvious (64, 125, 196, 343).
1. L3: large (200–1000), tricky (441=21², 729=3⁶).

### Input and Grading

1. Numeric answers preferred where possible (identity evaluations, area computations, roots).
1. Text parser for prime factorization — accept exactly TWO forms:
1. Canonical: `2^3 * 3^2 * 5` (flexible whitespace around `*` and `^`).
1. Expanded: `2 * 2 * 2 * 3 * 3 * 5` (sorted primes, flexible whitespace).
1. Both normalize internally to sorted `[[base, exp], ...]` for comparison. Do NOT over-invest in parsing edge cases.
1. Identity factoring answers accepted as factored numeric pairs (e.g., `(10)(4)` or `(4)(10)`) with whitespace normalization.
1. Feedback includes:
1. correctness.
1. short reason.
1. trigger visualization step that demonstrates why.

## UI and Accessibility Plan

1. Keyboard operable tabs and controls.
1. `aria-live="polite"` feedback region for grading output.
1. high-contrast text on dark background.
1. reduce-motion toggle in **header** (visible at all times, not buried in stats modal).
1. touch-safe control spacing for Chromebook tablets.

## Performance Plan

1. cap renderer DPR at 2.
1. use `InstancedMesh` for tiles/cubes above ~100 instances.
1. no shadows; simple `MeshStandardMaterial`.
1. dispose geometries/materials/textures on mode switch.
1. throttle expensive label texture regenerations.
1. target:
1. stable 30+ FPS on low-power Chromebook.

## Implementation Sequence

1. Scaffold `index.html` shell, theme, responsive layout, tabs.
1. Add import map + base module wiring + KaTeX hooks.
1. Build scene manager + animation queue + resize handling.
1. Build math utilities (factorize, isPerfectSquare, etc.).
1. **Build drill engine + progress tracker** (test full explore→drill loop with mode 1).
1. Implement prime factor tree mode end-to-end (first complete loop).
1. Implement perfect squares mode end-to-end.
1. Implement perfect cubes mode end-to-end.
1. Implement `(a+b)^2` mode.
1. Implement `a^2-b^2` mode.
1. Implement `a^3-b^3` mode.
1. Implement `a^3+b^3` mode.
1. Add stats modal + reduce-motion header toggle + polish.
1. Optimize cleanup/perf and fix mobile layout edge cases.
1. Update Vite build input for production page emission.
1. Final QA pass against verification matrix.

## Verification Matrix

1. Run `npm run dev` and open `/standalone/math-viz/index.html`.
1. Validate each tab:
1. explore controls update scene deterministically.
1. drill prompt generation, grading, and explanation animation.
1. Validate 3D controls:
1. drag orbit, wheel/pinch zoom, touch pan where enabled.
1. Validate responsiveness:
1. `<=768px`: drill below canvas.
1. `<=480px`: controls remain usable without overlap.
1. Validate persistence:
1. solve problems, refresh, verify stats and best streak retained.
1. Validate production:
1. `npm run build`, confirm `dist/standalone/math-viz/index.html` exists.
1. Validate low-end behavior:
1. no crashes, acceptable frame pacing, memory stable across tab switches.

## Risks and Mitigations

1. Risk: single-file complexity and regression surface.
1. Mitigation: strict section boundaries and adapter interface contracts.
1. Risk: answer parser false negatives for equivalent algebraic forms.
1. Mitigation: normalization + canonical token comparison + targeted unit checks.
1. Risk: performance drops in large cube counts.
1. Mitigation: instancing, lightweight materials, conditional label density.
1. Risk: production page omitted in build.
1. Mitigation: explicit Vite multi-page input entry.

## Definition of Done

1. All 7 modes shipped in one HTML file with Explore + Drill active.
1. Drill engine adapts difficulty and tracks stats per mode + global.
1. `localStorage` persistence works with versioned schema.
1. Responsive behavior matches spec on desktop and narrow screens.
1. Production build includes standalone page and runs on Vercel.
1. Manual verification checklist passes without blocking defects.
