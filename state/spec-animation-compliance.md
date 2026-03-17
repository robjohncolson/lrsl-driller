# Spec: Dividing Polynomials Animation Compliance

**Goal**: Close 4 gaps identified in animation audit against teaching standard.
**Cartridge**: `a2-dividing-polynomials`

---

## Work Items

### W1: NEW — Synthetic Division Animation
**File**: `animations/synthetic_division.py`
**Scene class**: `SyntheticDivision`
**Output**: `SyntheticDivision.mp4`
**Priority**: P0 (core assessed strand, completely missing)

**Example** (from standard answer key):
`(x⁴ + x³ − 6x² − 4x + 8) ÷ (x − 2)`
Quotient: x³ + 3x² − 4, Remainder: 0

**Animation flow**:
1. Title: "Synthetic Division" / subtitle: "The shortcut for (x − a) divisors"
2. Show dividend and divisor. Extract `a = 2` from `(x − 2)`.
3. Extract coefficients: `[1, 1, −6, −4, 8]`
4. Build the synthetic division grid:
   ```
   2 |  1   1   -6   -4    8
     |      2    6    0   -8
     ─────────────────────────
        1   3    0   -4    0
   ```
5. Animate each multiply-add step with color coding:
   - Bring down 1 (blue)
   - 1 × 2 = 2, write below 1, add: 1 + 2 = 3 (yellow)
   - 3 × 2 = 6, write below −6, add: −6 + 6 = 0 (yellow)
   - 0 × 2 = 0, write below −4, add: −4 + 0 = −4 (yellow)
   - −4 × 2 = −8, write below 8, add: 8 + (−8) = 0 (green)
6. Read result: coefficients [1, 3, 0, −4, 0] → quotient x³ + 3x² − 4, remainder = 0
7. Factor Theorem callout: "Remainder = 0 → (x − 2) is a factor!"
8. Key insight box: "Synthetic division only works when divisor is (x − a)"

**Style**: 3B1B dark palette matching existing animations. Use ManimCE `from manim import *`.

---

### W2: MODIFY — Long Division Animation (zero placeholder + subtraction parentheses)
**File**: `animations/long_division.py`
**Scene class**: `PolynomialLongDivision`
**Priority**: P1 (zero placeholder) + P3 (subtraction polish)

**New example** (replaces current):
`(x³ + 4x − 5) ÷ (x + 2)` — missing x² term
Quotient: x² − 2x + 8, Remainder: −21

**Math verification**:
- Step 0: Rewrite as x³ + 0x² + 4x − 5 (show placeholder insertion)
- Step 1: x³/x = x². x²(x+2) = x³ + 2x². Subtract: (x³ + 0x²) − (x³ + 2x²) = −2x². Bring down +4x.
- Step 2: −2x²/x = −2x. −2x(x+2) = −2x² − 4x. Subtract: (−2x² + 4x) − (−2x² − 4x) = 8x. Bring down −5.
- Step 3: 8x/x = 8. 8(x+2) = 8x + 16. Subtract: (8x − 5) − (8x + 16) = −21.
- Result: quotient x² − 2x + 8, remainder −21

**Changes from current animation**:
1. **Step 0 (NEW)**: Before division starts, animate highlighting the "gap" between x³ and 4x, then inserting `+ 0x²` with a distinctive color and a label like "Insert placeholder for missing degree". Flash the 0x² term.
2. **Parenthesized subtraction**: In each subtract step, wrap the product in parentheses and briefly animate distributing the negative sign before the subtraction. Show `−(x³ + 2x²)` becoming `−x³ − 2x²` before combining.
3. Keep the existing structure: title → layout → 3 color-coded cycles → boxed result → verification equation.
4. Keep persistent cycle label "Divide → Multiply → Subtract → Bring down".
5. Keep the verification step: dividend = divisor × quotient + remainder.

**Preserve**: Same color palette (STEP1_COLOR blue, STEP2_COLOR yellow, STEP3_COLOR green), same BG_COLOR, same overall layout approach.

---

### W3: MODIFY — Is It A Factor Animation (sign trap polish)
**File**: `animations/is_it_a_factor.py`
**Scene class**: `IsItAFactor`
**Priority**: P2 (sign trap never exercised in factor context)

**New polynomial**: `P(x) = x³ − 3x² − x + 3 = (x − 1)(x + 1)(x − 3)`
Roots at x = −1, 1, 3.

**New test structure** (replaces current):
- **Test 1**: (x − 3) → a = 3, P(3) = 27 − 27 − 3 + 3 = 0 → YES (simple baseline)
- **Test 2**: (x + 2) → **SIGN TRAP**: show rewrite (x + 2) = (x − (−2)) → a = −2. P(−2) = −8 − 12 + 2 + 3 = −15 → NO
- **Test 3**: (x + 1) → **SIGN TRAP CONTRAST**: show (x + 1) = (x − (−1)) → a = −1. P(−1) = −1 − 3 + 1 + 3 = 0 → YES

**Pedagogical rationale**: Tests 2 and 3 both use (x + a) form. Test 2 gives NO, Test 3 gives YES. The contrast drives home: the sign trick isn't the tricky part — it's whether P(a) = 0.

**Changes from current animation**:
1. Change polynomial from x³ − 6x² + 11x − 6 to x³ − 3x² − x + 3
2. Adjust axes: x_range = [−3, 5], y_range = [−16, 16] (P(−2) = −15 needs room)
3. Test 1 (x − 3): simple dot-on-curve animation → lands on x-axis → green checkmark → YES
4. Test 2 (x + 2): add a brief "rewrite" sub-animation showing (x + 2) = (x − (−2)) → a = −2. Then animate dot to x = −2 (curve is at y = −15). Show dashed line to x-axis, gap label = −15, red X, "NO".
5. Test 3 (x + 1): same rewrite (x + 1) = (x − (−1)) → a = −1. Dot lands on x-axis → green checkmark → YES
6. Final rule box: same Factor Theorem biconditional + visual legend (unchanged)

**Preserve**: Same color palette, same overall structure (graph → tests → rule box).

---

### W4: ADD — Synthetic Division Mode to Cartridge
**Files**: `cartridges/a2-dividing-polynomials/manifest.json`, `generator.js`, `grading-rules.js`, `ai-grader-prompt.txt`

**manifest.json** — Insert new mode after `long-division` (position 3):
```json
{
  "id": "synthetic-division",
  "name": "Synthetic Division",
  "unlockedBy": { "gold": 1 },
  "animation": "assets/SyntheticDivision.mp4",
  "layout": {
    "inputs": [
      { "id": "coeff-x3", "type": "number", "label": "x³ coefficient of quotient", "step": 1 },
      { "id": "coeff-x2", "type": "number", "label": "x² coefficient of quotient", "step": 1 },
      { "id": "coeff-x1", "type": "number", "label": "x coefficient of quotient", "step": 1 },
      { "id": "coeff-x0", "type": "number", "label": "Constant term of quotient", "step": 1 },
      { "id": "remainder", "type": "number", "label": "Remainder", "step": 1 }
    ]
  }
}
```
Also add matching progression tier and hints.

**generator.js** — Add `generateSyntheticDivision()`:
- Generate a degree-4 polynomial divided by (x − a)
- Build dividend from q(x)(x − a) + r where q is degree 3 with small integer coefficients
- ~30% chance of r = 0 (factor case)
- Return all 4 quotient coefficients + remainder
- Use existing `aValues` pool, `drawFromBag`, `multiplyByLinear`, `formatPolynomial`, `formatDivisor`
- Add the mode branch in `generateProblem()` for `modeId === 'synthetic-division'`

**grading-rules.js** — Add `coeff-x3` to the numeric field list at line 98-99.

**ai-grader-prompt.txt** — Add synthetic division section covering E/P/I criteria and the "wrong sign for a" common error.

---

### W5: RENDER — All Modified Animations
**Depends on**: W1, W2, W3

```bash
manim -qm --format=mp4 animations/synthetic_division.py SyntheticDivision
manim -qm --format=mp4 animations/long_division.py PolynomialLongDivision
manim -qm --format=mp4 animations/is_it_a_factor.py IsItAFactor
```

Output location: `media/videos/{script_name}/720p30/{SceneClass}.mp4`

---

### W6: COPY — Rendered MP4s to Cartridge Assets
**Depends on**: W5

```bash
cp media/videos/synthetic_division/720p30/SyntheticDivision.mp4 cartridges/a2-dividing-polynomials/assets/
cp media/videos/long_division/720p30/PolynomialLongDivision.mp4 cartridges/a2-dividing-polynomials/assets/
cp media/videos/is_it_a_factor/720p30/IsItAFactor.mp4 cartridges/a2-dividing-polynomials/assets/
```

---

### W7: UPLOAD — All Cartridge Animations to Supabase
**Depends on**: W6

Upload all MP4s from `cartridges/a2-dividing-polynomials/assets/` to Supabase storage:
- Bucket: `videos`
- Path: `animations/a2-dividing-polynomials/{filename}`
- Method: POST to `${SUPABASE_URL}/storage/v1/object/videos/animations/a2-dividing-polynomials/{filename}`
- Headers: Authorization Bearer + x-upsert: true
- Credentials: from `.env` (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Upload ALL 7 files (6 existing + 1 new SyntheticDivision.mp4), since 2 were re-rendered.

---

### W8: COMMIT + PUSH
**Depends on**: W4, W6

Stage and commit all changes:
- `animations/synthetic_division.py` (new)
- `animations/long_division.py` (modified)
- `animations/is_it_a_factor.py` (modified)
- `cartridges/a2-dividing-polynomials/assets/*.mp4` (new + updated)
- `cartridges/a2-dividing-polynomials/manifest.json` (modified)
- `cartridges/a2-dividing-polynomials/generator.js` (modified)
- `cartridges/a2-dividing-polynomials/grading-rules.js` (modified)
- `cartridges/a2-dividing-polynomials/ai-grader-prompt.txt` (modified)

---

## Dependency Graph

```
Wave 1 (parallel):
  A: W1 (synthetic_division.py)     ─┐
  B: W2 (long_division.py mod)      ─┤──→ Wave 2
  C: W3 (is_it_a_factor.py mod)     ─┤
  D: W4 (manifest + generator +     ─┤──→ Wave 3
         grading + ai-prompt)        │

Wave 2 (after A, B, C):
  E: W5 + W6 (render + copy)        ─┤──→ Wave 3

Wave 3 (after D, E):
  F: W7 + W8 (upload + commit + push)
```

**Critical path**: W1 → W5 → W6 → W8 (longest chain: new animation → render → copy → commit)
