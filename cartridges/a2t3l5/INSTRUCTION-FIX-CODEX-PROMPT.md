# Codex Implementation Prompt — a2t3l5 Instruction Fix

## Task

Fix the instructional gaps in the `a2t3l5` cartridge (Zeros of Polynomial Functions). The full audit and required fixes are in `cartridges/a2t3l5/INSTRUCTION-FIX-SPEC.md` — **read it first**.

This is a learning drill app. Students must be able to solve every problem using ONLY the instructions, hints, and animations provided. The current hints are too terse and assume prior knowledge. The animations skip intermediate steps.

## What to Change

### 1. Manifest Hints (`cartridges/a2t3l5/manifest.json`)

Replace all 14 entries in `hints.perField` with the expanded versions from the spec. Each hint must teach the complete procedure, not just name it.

**Current → New hint text for each field (copy from spec):**

| Field ID | Spec Section |
|----------|-------------|
| `vocabAnswer` | L01 Fix — Hint |
| `zeroChoice` | L02 Fix — Hint |
| `multChoice` | L03 Fix — Hint |
| `crossTouch` | L04 Fix — Hint |
| `zerosText` | L05 Fix — Hint |
| `reportText` | L06 Fix — Hint |
| `intervalText` | L07 Fix — Hint |
| `complexType` | L08 Fix — Hint |
| `complexResult` | L09 Fix — Hint |
| `solutionsText` | L10 Fix — Hint |
| `inequalityText` | L11 Fix — Hint |
| `transformChoice` | L12 Fix — Hint |
| `sketchExplain` | L13 Fix — Hint |
| `errorExplain` | L14 Fix — Hint |

**Rules:**
- Use the exact hint text from the spec (the quoted blocks under "Fix — Hint")
- Preserve all other manifest structure — modes, progression, grading, display, etc.
- Do NOT change mode IDs, input types, animation filenames, or progression gating

### 2. Animation Scripts (`animations/a2t3l5/`)

Rebuild the following 8 animation scripts that have SEVERE or MODERATE gaps. The spec describes the exact scene structure for each.

**Priority 1 — SEVERE (full rebuild):**

#### `a05_factor_find_zeros.py`
Must show the FULL quadratic factoring process:
1. Show polynomial: x³ + 2x² − 3x
2. Factor out GCF x → x(x² + 2x − 3)
3. **NEW:** Show "Need two numbers that multiply to −3 and add to +2"
4. **NEW:** Show factor pair search: try (1, −3) → sum = −2 ✗, try (3, −1) → sum = +2 ✓
5. Write x(x + 3)(x − 1)
6. Set each factor = 0: x = 0, x = −3, x = 1
7. Number line with dots

#### `a07_sign_chart_builder.py`
Must show test-point evaluation for EVERY interval:
1. Show f(x) = x(x−4)(x+3) > 0
2. Mark zeros: −3, 0, 4 on number line
3. **NEW:** Test x = −5 in (−∞, −3): show (−5)(−9)(−2) = (−)(−)(−) = −
4. **NEW:** Test x = −1 in (−3, 0): show (−1)(−5)(+2) = (−)(−)(+) = +
5. **NEW:** Test x = 1 in (0, 4): show (1)(−3)(+4) = (+)(−)(+) = −
6. **NEW:** Test x = 5 in (4, ∞): show (5)(1)(+8) = (+)(+)(+) = +
7. Highlight "+" intervals → answer: (−3, 0) ∪ (4, ∞)

#### `a09_complex_square_foil.py`
Must narrate every FOIL step:
1. Write (3 + 5i)(3 + 5i)
2. Label and compute: F: 3×3 = 9, O: 3×5i = 15i, I: 5i×3 = 15i, L: 5i×5i = 25i²
3. Sum: 9 + 15i + 15i + 25i²
4. **NEW:** Show i² = −1 substitution with explanation
5. **NEW:** Group real (9 − 25 = −16) and imaginary (15i + 15i = 30i)
6. Final: −16 + 30i

#### `a10_rewrite_to_zero.py`
Must show every algebraic manipulation:
1. Show equation: x³ + 5x² − x − 7 = x² + 6x + 3
2. **NEW:** Animate subtracting right side term by term (show sign changes)
3. **NEW:** Show combining like terms with color grouping
4. **NEW:** Show testing x = −1 as a root (plug in, get 0)
5. **NEW:** Factor out (x + 1), show remaining quadratic
6. Factor the quadratic (show the multiply/add method)
7. Set each factor = 0

#### `a11_inequality_intervals.py`
Must show test-point evaluation (same pattern as L07):
1. Show inequality and factor
2. Mark critical points on number line
3. **NEW:** Test each interval with explicit sign evaluation
4. **NEW:** Show a second example with non-strict inequality (≥) using brackets
5. Highlight solution intervals

#### `a13_sketch_from_factors.py`
Must walk through all 5 synthesis steps:
1. Show expression, extract zeros (set each factor = 0)
2. Read multiplicities, label cross/touch
3. **NEW:** Determine end behavior from degree + leading coefficient
4. **NEW:** Build sign chart with test points (show evaluation)
5. **NEW:** State conclusion: which intervals positive/negative
6. Show the sketch connecting all of this

**Priority 2 — MODERATE (targeted additions):**

#### `a01_zero_mult_vocab.py`
- Add 2 more vocabulary cards: cross/touch rule, degree-zeros relationship
- Add mini-visuals (tiny graph snippets) to each card instead of text-only

#### `a08_real_vs_complex.py`
- Add coefficient identification step (show a = 1, b = 0, c = 9)
- Briefly show the discriminant = 0 boundary case

#### `a12_cubic_transforms.py`
- Add horizontal shift example: (x − 3)³ shifts RIGHT 3 (with directional arrow)
- Add reflection example: −x³

#### `a14_spot_the_error.py`
- Add 1–2 more error types (sign chart error, complex arithmetic error) as a quick montage after the main example

**Priority 3 — MINOR (small tweaks):**

#### `a02_factor_to_zero.py`
- Add one more example with fraction result: (3x − 1) = 0 → x = 1/3

#### `a03_multiplicity_id.py`
- Add callout: highlight bare `x` and show "x = x¹ → multiplicity 1"

#### `a04_cross_or_touch.py`
- Add brief sign-analysis: show sign of (x−1)³ just left/right of x = 1

## Reference Files

Read these before making changes:

1. **`cartridges/a2t3l5/INSTRUCTION-FIX-SPEC.md`** — Full audit with exact hint text and animation scene descriptions
2. **`cartridges/a2t3l5/manifest.json`** — Current manifest (modify hints.perField)
3. **`animations/a2t3l5/common.py`** — Shared Manim utilities (colors, helpers)
4. **Any existing animation script** — Match the current style (MathTex, color scheme, timing)
5. **`cartridges/a2t3l5/generator.js`** — Read but do NOT modify problem banks or grading

## Key Constraints

- **Do NOT change:** mode IDs, input types, grading logic, problem banks, progression gating, registry, animation filenames/class names
- **Do NOT add new levels or remove existing ones**
- **Animations:** Keep class names identical (e.g., `FactorFindZeros`, `SignChartBuilder`). Same filenames. Just richer content.
- **Duration:** Rebuilt animations may be longer (30–60 sec instead of 15–30 sec). That's fine — teaching takes time.
- **Style:** Match existing Manim color scheme and layout conventions from `common.py`
- **Render command:** `manim -qm --format=mp4 {file}.py {ClassName}`
- **After render:** Copy MP4s to `cartridges/a2t3l5/assets/`

## DO NOT Change

- `cartridges/a2t3l5/generator.js` — problem banks stay the same
- `cartridges/a2t3l5/grading-rules.js` — grading logic stays the same
- `cartridges/a2t3l5/ai-grader-prompt.txt` — AI grading stays the same
- `cartridges/registry.json` — no structural changes
- `tests/` — existing tests should still pass (hints are not tested, only grading)

## Validation Checklist

Before marking complete:
- [ ] All 14 hints in manifest.json replaced with expanded versions from spec
- [ ] Manifest JSON is valid (no syntax errors)
- [ ] All 8 priority-1/2 animation scripts rebuilt with additional teaching steps
- [ ] All 6 priority-3 animation scripts have minor tweaks
- [ ] Animation class names unchanged
- [ ] `npm test` still passes (hint changes don't affect grading tests)
- [ ] Each rebuilt animation renders without Manim errors: `manim -qm --format=mp4 {file}.py {ClassName}`
- [ ] Rendered MP4s copied to `cartridges/a2t3l5/assets/`
