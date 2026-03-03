# Math Foundations Visualizer & Drill — Product Spec

## Purpose

Prerequisite training app for 3-3 Quiz Prep (cubes & binomial expansion). Students need to recognize perfect squares/cubes, factor into primes, and see *geometrically* why algebraic identities work — before they can factor expressions using those identities.

## Deliverable

Single HTML file: `standalone/math-viz/index.html` inside lrsl-driller repo.
Served via Vite dev server locally (`npm run dev`), Vercel in production.

## Dependencies (CDN, zero install)

- Three.js 0.159.0 via import map (`three.module.js` + `OrbitControls`)
- KaTeX 0.16.9 (math rendering in UI panels)

---

## 7 Modes (all always accessible, no forced unlock)

Each mode has an **Explore** panel (interactive sliders, animation playback) and a **Drill** panel (problem, input, feedback). Both always visible.

### Mode 1: Prime Factorization

**Visualization**: 2D canvas overlay — top-down factor tree
- Composite number splits into two children, animated step-by-step
- Prime leaves glow cyan; composite nodes are gray
- Bottom: assembled factorization with KaTeX (e.g., `2³ × 3² × 5`)
- Exponent highlighting: even exponents flagged (→ perfect square), ÷3 exponents flagged (→ perfect cube)

**Explore**: Slider picks number (2–500), tree auto-builds with stepped animation
**Drill prompts**:
- "Find the prime factorization of N" → student types `2^3 * 3^2 * 5`
- Higher difficulty: "Is N a perfect square/cube?" inference from factorization

### Mode 2: Perfect Squares

**Visualization**: Three.js orthographic camera — flat n×n grid of thin unit tiles
- Builds row-by-row with animation
- Perfect: exact n×n grid, labeled `n² = total`
- Non-perfect: show bounding squares (e.g., 50 → 7×7=49 too small, 8×8=64 too big)

**Explore**: Slider for n (1–20)
**Drill prompts**:
- "Is N a perfect square? If yes, what is √N?"
- "What perfect square is closest to N?"

### Mode 3: Perfect Cubes

**Visualization**: Three.js perspective camera + OrbitControls — n×n×n InstancedMesh of unit cubes
- Layer-by-layer build animation
- Rotatable, zoomable
- Labeled `n³ = total`

**Explore**: Slider for n (1–12)
**Drill prompts**:
- "Is N a perfect cube? If yes, what is ∛N?"

### Mode 4: (a+b)² = a² + 2ab + b²

**Visualization**: Three.js orthographic — 2D area model
- Large (a+b) × (a+b) square divided into 4 colored regions:
  - a×a (cyan) → a²
  - a×b (green, ×2) → 2ab
  - b×b (gold) → b²
- Animation sequence: full square → dividing lines appear → regions separate slightly → labels appear
- KaTeX equation animates term-by-term with color matching

**Explore**: Sliders for a, b (1–10)
**Drill prompts**:
- "What is (a+b)²?" → numeric answer (e.g., 25)
- "What is the area of the ab region?" → numeric
- "Expand (a+b)²" → select/type expanded form

### Mode 5: a² − b² = (a+b)(a−b)

**Visualization**: Three.js orthographic — geometric reshaping proof
1. Start: a×a square (cyan)
2. b×b square removed from corner (gold, fades)
3. L-shape remains
4. Animated cut into 2 rectangles
5. Slide to form (a+b) × (a−b) rectangle

**Explore**: Sliders for a, b (b < a enforced)
**Drill prompts**:
- "Factor a²−b² for a=7, b=3" → `(10)(4)` or `40`
- "What are the dimensions of the resulting rectangle?"

### Mode 6: a³ + b³ = (a+b)(a²−ab+b²)

**Visualization**: Three.js perspective + OrbitControls
- Two cubes side by side: a-cube (cyan), b-cube (gold)
- Volume labels: V = a³ + b³
- Algebraic overlay: (a+b)(a²−ab+b²) with color-coded terms
- (a+b) factor shown as highlighted edge measurement

**Explore**: Sliders for a, b (1–6)
**Drill prompts**:
- "Factor a³+b³ for a=2, b=3 using the identity"

### Mode 7: a³ − b³ = (a−b)(a²+ab+b²)

**Visualization**: Three.js perspective + OrbitControls
1. Large a-cube (cyan wireframe)
2. b-cube removed from corner (gold, animates out)
3. Remaining L-solid decomposes into 3 colored slabs (each thickness a−b):
   - a×a×(a−b) → a² term (cyan)
   - a×b×(a−b) → ab term (green)
   - b×b×(a−b) → b² term (gold)
4. All share factor (a−b); cross-sections sum to a²+ab+b²

**Explore**: Sliders for a, b (b < a, range 1–6)
**Drill prompts**:
- "Factor a³−b³ for a=5, b=2 using the identity"

---

## Layout

```
┌─────────────────────────────────────────────────┐
│  Math Foundations    [mode tabs]       [⚡ Stats] │
├─────────────────────────────────────────────────┤
│                                                   │
│   ┌──────────────────────┐  ┌──────────────────┐ │
│   │                      │  │  DRILL PANEL     │ │
│   │   THREE.JS CANVAS    │  │  Question (KaTeX)│ │
│   │   (or 2D canvas)     │  │  Input field     │ │
│   │                      │  │  [Check] button  │ │
│   │                      │  │  Feedback area   │ │
│   └──────────────────────┘  │  Streak: ●●●○○   │ │
│                              └──────────────────┘ │
│   ┌──────────────────────────────────────────────┐│
│   │  EXPLORE: sliders, [Play] [Reset], equation  ││
│   └──────────────────────────────────────────────┘│
└───────────────────────────────────────────────────┘
```

Responsive: on <768px, drill panel stacks below canvas.

---

## Visual Style (3B1B-inspired)

### Color Palette

| Role | Hex | CSS/Three.js |
|------|-----|-------------|
| Background | `#1a1a2e` | `bg: 0x1a1a2e` |
| Panel BG | `#0f0f23` | CSS only |
| a terms | `#58c4dd` | `aColor: 0x58c4dd` |
| b terms | `#fcba03` | `bColor: 0xfcba03` |
| Cross terms (ab) | `#83c167` | `abColor: 0x83c167` |
| Results/answers | `#ff6b6b` | `resultColor: 0xff6b6b` |
| Prime nodes | `#58c4dd` | cyan |
| Composite nodes | `#a9a9a9` | gray |
| UI accent | `#7c3aed` | purple (driller brand) |
| Correct | `#83c167` | green |
| Incorrect | `#ff6b6b` | coral |
| Text primary | `#e8e8e8` | |
| Text muted | `#6b7280` | |

### KaTeX Color Matching

Equations use `\color{}{}` to match visualization:
```latex
\color{#58c4dd}{a^2} + \color{#83c167}{2ab} + \color{#fcba03}{b^2}
```

### Motion

- Smooth `easeOutCubic` transitions, ~500ms per animation step
- Reduce-motion toggle in header (accessible without digging into menus)
- When reduced: animations resolve instantly or in ≤100ms

---

## Drill Engine

### Problem Banks
- Separate bank per mode × difficulty level
- Shuffle-bag pattern: draw all before repeat, no near-repeats (last 3 history)

### Difficulty Adaptation
- 3 levels, auto-adjusting:
  - L1: small numbers (2–30), common perfect powers (4, 8, 9, 16, 25, 27)
  - L2: medium (30–200), less obvious (64, 125, 196, 343)
  - L3: large (200–1000), tricky (441=21², 729=3⁶)
- Level up: 3 consecutive correct
- Level down: 2 incorrect in recent window

### Answer Parsing

**Numeric answers** (preferred where possible):
- (a+b)² evaluations, area computations, root values
- Integer validation, exact match

**Prime factorization** (two accepted forms):
- Canonical: `2^3 * 3^2 * 5` (flexible whitespace)
- Expanded: `2 * 2 * 2 * 3 * 3 * 5` (sorted)
- Both normalize to sorted `[[base, exp], ...]` for comparison

**Factored forms** (identity modes):
- Accept `(10)(4)` or `(4)(10)` for difference of squares
- Accept `(a+b)(a^2-ab+b^2)` with concrete values substituted
- Normalize: strip whitespace, sort factors where commutative

### Feedback
- Correct/incorrect + short explanation
- Visualization animates to show WHY the answer is what it is
- Streak counter: ●●●○○ (5-dot display)

### Scoring & Progress
- `localStorage` key: `mathVizDriller`
- Per-mode: attempts, correct, bestStreak, difficulty
- Global: totalAttempts, totalCorrect
- Prefs: reduceMotion

---

## Technical Architecture

### Single HTML File Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Math Foundations: Visualize & Drill</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/"
    }
  }
  </script>
  <style>/* ~300 lines: dark theme, layout, responsive */</style>
</head>
<body>
  <!-- HTML shell: header, tabs, viz container, drill panel, explore controls, stats modal -->
  <script type="module">
    // ~3500 lines organized in sections:
    // IMPORTS, CONSTANTS, MATH UTILS, ANIMATION QUEUE,
    // SCENE MANAGER, MODE ADAPTERS (×7), DRILL ENGINE,
    // PROGRESS TRACKER, UI CONTROLLER, INIT
  </script>
</body>
</html>
```

### Three.js Techniques

| Technique | Used For |
|-----------|----------|
| `InstancedMesh` | Unit cubes/tiles (perfect squares, perfect cubes) |
| `OrbitControls` | 3D cube modes (orbit, zoom, pan, touch) |
| `OrthographicCamera` | 2D identity modes (crisp, no distortion) |
| `PerspectiveCamera` | 3D cube modes |
| `EdgesGeometry` + `LineSegments` | Wireframe overlays |
| `CanvasTexture` + `Sprite` | In-scene text labels |
| `PlaneGeometry` | 2D regions in area model |
| `BoxGeometry` | Cubes and slabs |
| `MeshStandardMaterial` | Low metalness/roughness, clean look |

### Performance Targets (Chromebook)

- Pixel ratio capped at 2
- No shadows, no post-processing
- InstancedMesh for >100 instances
- Dispose geometries/materials on mode switch
- Stable 30+ FPS on low-power devices

---

## Vite Config Change Required

Add to `vite.config.js` → `build.rollupOptions.input`:
```js
mathViz: 'standalone/math-viz/index.html'
```

Verify `dist/standalone/math-viz/index.html` exists after `npm run build`.

---

## Accessibility

- Keyboard-operable tabs and controls
- `aria-live="polite"` feedback region
- High-contrast text on dark background
- Reduce-motion toggle in header (visible, not buried)
- Touch-safe control spacing (min 44px tap targets)
