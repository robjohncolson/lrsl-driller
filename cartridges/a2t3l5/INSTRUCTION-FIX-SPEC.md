# a2t3l5 Instruction Fix Spec — Zeros of Polynomial Functions

## Problem Statement

The a2t3l5 cartridge was built with instructions and animations that assume prior knowledge. This is a **learning drill app** — students must be able to complete every problem using ONLY the instructions, hints, and animations provided. No assumed knowledge beyond basic algebra (solving simple equations, order of operations, negative numbers).

Every level needs soup-to-nuts instructions: not just "what to do" but "how to do it, step by step."

## Severity Legend

| Rating | Meaning |
|--------|---------|
| **SEVERE** | Core technique assumed but never taught. Student cannot proceed without external help. |
| **MODERATE** | Key step or concept under-explained. Student may guess but won't understand. |
| **MINOR** | Wording could be clearer or edge case unaddressed. Student can likely manage. |

---

## Audit Results & Required Fixes

---

### L01 — Zeros & Multiplicity Vocabulary (choice) — MODERATE

**Current hint:** "A zero is an x-value that makes f(x) = 0, where the graph meets the x-axis. Multiplicity comes from the exponent on a repeated factor."

**Gap:** The hint only covers zeros and multiplicity, but L01 tests 10 vocab terms including end behavior, Zero-Product Property, interval notation, cross/touch, and degree-zeros relationship. Students have no guidance on 8 of the 10 topics.

**Fix — Hint:** Expand to cover all tested vocabulary:
> "**Zero (root):** an x-value where f(x) = 0 — where the graph crosses or touches the x-axis. **Multiplicity:** the exponent on the factor; in (x−a)^k, the zero x = a has multiplicity k. **End behavior:** what happens to f(x) as x → +∞ or −∞ (determined by leading term). **Zero-Product Property:** if a·b = 0, then a = 0 or b = 0. **Interval notation:** uses parentheses for excluded endpoints and brackets for included; ∪ means 'or' (union). **Cross vs touch:** odd multiplicity → graph crosses the x-axis; even multiplicity → graph touches and turns back. **Degree rule:** a degree-n polynomial has exactly n zeros counting multiplicity."

**Fix — Animation:** Current animation shows 5 definition cards. Add 2 more cards for the missing terms (cross/touch rule, degree-zeros rule). Each card should include a mini-visual, not just text — e.g., a tiny graph snippet showing a cross vs a touch.

---

### L02 — Factor to Zero (choice) — MINOR

**Current hint:** "Set the factor equal to zero and solve. For (x − a) = 0, x = a. For (x + a) = 0, x = −a."

**Gap:** The hint gives the pattern but doesn't explain WHY the sign flips, and doesn't cover coefficients on x (e.g., 2x − 4).

**Fix — Hint:** Add the "why" and the coefficient case:
> "To find a zero from a factor, set the factor = 0 and solve for x. Example: (x − 5) = 0 → x = 5. Example: (x + 3) = 0 → x = −3 (subtract 3 from both sides). If there's a number in front of x: (2x − 4) = 0 → 2x = 4 → x = 2 (divide both sides by 2)."

**Fix — Animation:** Current animation is solid (3 worked examples). Add one more example with a fraction result: (3x − 1) = 0 → x = 1/3, showing the division step explicitly.

---

### L03 — Multiplicity Identification (choice) — MINOR

**Current hint:** "Multiplicity is the exponent on the factor. In (x − a)^k, the zero x = a has multiplicity k."

**Gap:** Doesn't address the implicit exponent case (bare `x` has multiplicity 1) or non-monic factors like (2x − 4)².

**Fix — Hint:** Add the implicit case:
> "Multiplicity is the exponent on the factor. In (x − a)^k, the zero x = a has multiplicity k. **If there's no written exponent, the multiplicity is 1.** Example: in x(x+3)², the factor x has multiplicity 1, and (x+3) has multiplicity 2."

**Fix — Animation:** Add a callout on the implicit exponent: highlight the bare `x` factor and show "x = x¹ → multiplicity 1."

---

### L04 — Cross or Touch? (choice) — MINOR–MODERATE

**Current hint:** "Odd multiplicity means the graph crosses the x-axis. Even multiplicity means it touches and turns around."

**Gap:** States the rule but gives no intuition for WHY. Students memorize without understanding.

**Fix — Hint:** Add a one-sentence intuitive explanation:
> "**Rule:** Odd multiplicity → crosses. Even multiplicity → touches and turns back. **Why it works:** A factor raised to an odd power changes sign when x passes through the zero (positive becomes negative or vice versa), so the graph must cross. An even power stays the same sign on both sides, so the graph touches but doesn't cross."

**Fix — Animation:** Current animation shows (x−1)³ crossing and (x−1)² touching. Add a brief sign-analysis moment: show the sign of (x−1)³ just left and just right of x = 1 (negative → positive = cross), and same for (x−1)² (positive → positive = touch).

---

### L05 — Factor to Find All Zeros (text) — SEVERE

**Current hint:** "Step 1: factor out the GCF. Step 2: factor the remaining quadratic. Step 3: set each factor equal to zero."

**Gap:** Step 2 is a complete black box. The hint never explains HOW to factor a quadratic trinomial. The animation jumps from x(x² + 2x − 3) to x(x+3)(x−1) with no intermediate steps.

**Fix — Hint:** Replace with full procedural instructions:
> "**Step 1 — GCF:** Look for a common factor in every term. If every term has x, factor it out. Example: x³ + 2x² − 3x = x(x² + 2x − 3).
> **Step 2 — Factor the quadratic:** For x² + bx + c, find two numbers that **multiply to c** and **add to b**. Example: for x² + 2x − 3, find two numbers that multiply to −3 and add to +2. Try: +3 and −1 → 3 × (−1) = −3 ✓ and 3 + (−1) = +2 ✓. So x² + 2x − 3 = (x + 3)(x − 1).
> **Step 2b — Difference of squares:** If you see x² − a², it factors as (x − a)(x + a). Example: x² − 4 = (x − 2)(x + 2).
> **Step 3 — Solve:** Set each factor = 0. From x(x+3)(x−1): x = 0, x = −3, x = 1.
> **Don't forget the GCF zero!** If you factored out x, then x = 0 is a zero."

**Fix — Animation:** Rebuild `a05_factor_find_zeros.py` to show the full reasoning:
1. Show polynomial: x³ + 2x² − 3x
2. Highlight common factor x → x(x² + 2x − 3)
3. **NEW:** Pause at x² + 2x − 3. Show: "Need two numbers that multiply to −3 and add to +2"
4. **NEW:** Show factor pair search: (1, −3)? → 1 + (−3) = −2 ✗. (3, −1)? → 3 + (−1) = +2 ✓
5. Write: x(x + 3)(x − 1)
6. Set each = 0: x = 0, x = −3, x = 1
7. Number line with dots

---

### L06 — Full Zero Report (text) — MODERATE

**Current hint:** "For each factor (x − a)^k: the zero is x = a, the multiplicity is k, odd k means cross, and even k means touch."

**Gap:** (1) The format students should type is unclear — hint doesn't match placeholder format. (2) Assumes the expression is already factored.

**Fix — Hint:** Add explicit format instructions and a complete worked example:
> "For each factor (x − a)^k: zero = a, multiplicity = k, behavior = cross (if k is odd) or touch (if k is even).
> **Format your answer as:** (zero, multiplicity, cross/touch) separated by semicolons.
> **Example:** For x(x+4)(x−1)⁴ → **(0, 1, cross); (−4, 1, cross); (1, 4, touch)**
> Read each factor: x → zero 0, mult 1, odd → cross. (x+4) → zero −4, mult 1, odd → cross. (x−1)⁴ → zero 1, mult 4, even → touch."

**Fix — Animation:** Add a step where the animation walks through reading each factor one at a time and filling in the table row, rather than showing the completed table all at once.

---

### L07 — Sign Charts & Intervals (text) — SEVERE

**Current hint:** "Use the zeros to split the number line. Test one point in each interval. Even multiplicity does not flip the sign."

**Gap:** Never explains HOW to test a point. Never shows the actual evaluation process. Even multiplicity rule is stated but not demonstrated.

**Fix — Hint:** Full procedural instructions:
> "**Step 1 — Find zeros:** Set each factor = 0. For x(x−4)(x+3), zeros are 0, 4, −3.
> **Step 2 — Mark on number line:** Place zeros in order: −3, 0, 4. This creates 4 intervals: (−∞, −3), (−3, 0), (0, 4), (4, ∞).
> **Step 3 — Test one point in each interval:** Pick any x-value in the interval and plug into the FACTORED form (not expanded). Evaluate the sign (+ or −) of each factor, then multiply signs together.
> **Example:** Test x = 1 in (0, 4): x = 1(+), (x−4) = −3(−), (x+3) = 4(+). Signs: (+)(−)(+) = −. So f(x) < 0 on (0, 4).
> **Step 4 — Answer:** Write intervals where the inequality is satisfied. Use parentheses ( ) for strict (< or >) and brackets [ ] for non-strict (≤ or ≥). Use U for union.
> **Even multiplicity note:** A factor like (x−2)² is always ≥ 0, so the sign does NOT flip when crossing x = 2."

**Fix — Animation:** Rebuild `a07_sign_chart_builder.py` to show the full construction:
1. Show f(x) = x(x−4)(x+3) > 0
2. Mark zeros: −3, 0, 4 on number line
3. **NEW:** Pick test point x = −5 for (−∞, −3). Show: (−5)(−5−4)(−5+3) = (−)(−)(−) = −. Mark "−"
4. **NEW:** Pick test point x = −1 for (−3, 0). Show: (−1)(−1−4)(−1+3) = (−)(−)(+) = +. Mark "+"
5. **NEW:** Pick test point x = 1 for (0, 4). Show: (1)(1−4)(1+3) = (+)(−)(+) = −. Mark "−"
6. **NEW:** Pick test point x = 5 for (4, ∞). Show: (5)(5−4)(5+3) = (+)(+)(+) = +. Mark "+"
7. Highlight the "+" intervals → answer: (−3, 0) ∪ (4, ∞)

---

### L08 — Real or Complex Zeros? (choice) — MODERATE

**Current hint:** "Compute the discriminant b² − 4ac. Negative means complex zeros; zero or positive means real zeros."

**Gap:** Assumes students know the quadratic formula context, can identify a/b/c coefficients, and understand what "complex" means.

**Fix — Hint:** Add coefficient identification and context:
> "For a quadratic ax² + bx + c, the **discriminant** is b² − 4ac. It tells you what's under the square root in the quadratic formula.
> **How to identify a, b, c:** In x² + 6x + 13, a = 1, b = 6, c = 13.
> If there's no x term (like x² + 9), then b = 0: a = 1, b = 0, c = 9.
> **Discriminant > 0 or = 0 → two real zeros** (the parabola hits the x-axis).
> **Discriminant < 0 → two complex zeros** (the parabola never reaches the x-axis — the solutions involve i, the imaginary unit)."

**Fix — Animation:** Add a step showing coefficient identification before computing the discriminant. Show the discriminant = 0 boundary case (one repeated real zero) briefly.

---

### L09 — Simplify (a + bi)² (text) — SEVERE

**Current hint:** "Use FOIL: (a + bi)² = a² + 2abi + b²i². Replace i² with −1, then combine real and imaginary parts."

**Gap:** Assumes students know FOIL, what i is, and why i² = −1. The animation shows a FOIL grid but doesn't narrate it.

**Fix — Hint:** Teach FOIL and i from scratch:
> "**What is i?** The imaginary unit, defined by i² = −1. It lets us take square roots of negative numbers.
> **FOIL** means multiply each pair: **F**irst, **O**uter, **I**nner, **L**ast.
> **Step-by-step for (3 + 5i)²:**
> (3 + 5i)(3 + 5i)
> F: 3 × 3 = 9
> O: 3 × 5i = 15i
> I: 5i × 3 = 15i
> L: 5i × 5i = 25i²
> Add them: 9 + 15i + 15i + 25i²
> Replace i² with −1: 9 + 30i + 25(−1) = 9 + 30i − 25
> Combine real parts: (9 − 25) + 30i = **−16 + 30i**
> The answer is in **a + bi form**: real part first, then imaginary part."

**Fix — Animation:** Rebuild `a09_complex_square_foil.py` to narrate each FOIL step:
1. Write (3 + 5i)(3 + 5i)
2. Highlight and label each pair: F → 9, O → 15i, I → 15i, L → 25i²
3. Show the sum: 9 + 15i + 15i + 25i²
4. **NEW:** Highlight 25i² and show substitution: i² = −1, so 25i² = −25
5. **NEW:** Group real parts (9 − 25 = −16) and imaginary parts (15i + 15i = 30i)
6. Final answer: −16 + 30i

---

### L10 — Solve by Rewriting to 0 (text) — SEVERE

**Current hint:** "Move everything to one side so the equation equals zero, combine like terms, factor, then use the Zero-Product Property."

**Gap:** Every sub-step is a black box. "Move everything" — how? "Combine like terms" — which ones? "Factor" — a cubic? How? The animation shows 4 steps with no explanation between them.

**Fix — Hint:** Full worked procedure:
> "**Step 1 — Move all terms to one side:** Subtract the entire right side from both sides.
> Example: x³ + 5x² − x − 7 = x² + 6x + 3
> Subtract (x² + 6x + 3): x³ + 5x² − x − 7 − x² − 6x − 3 = 0
> **Step 2 — Combine like terms:** Group by power of x.
> x³ + (5x² − x²) + (−x − 6x) + (−7 − 3) = x³ + 4x² − 7x − 10 = 0
> **Step 3 — Factor:** Try x = 1, x = −1, x = 2, x = −2, etc. in the polynomial. If plugging in gives 0, that's a zero.
> Example: f(−1) = −1 + 4 + 7 − 10 = 0 ✓, so (x + 1) is a factor.
> Divide out (x + 1) to get the remaining quadratic, then factor that.
> **Step 4 — Solve:** Set each factor = 0 using the Zero-Product Property (if a·b·c = 0, then a = 0 or b = 0 or c = 0)."

**Fix — Animation:** Rebuild `a10_rewrite_to_zero.py` to show every algebraic step:
1. Show both sides of the equation
2. **NEW:** Animate subtracting the right side term by term (with sign changes highlighted)
3. **NEW:** Show combining like terms with color-coded grouping
4. **NEW:** Show testing x = −1 as a root, then factoring out (x + 1)
5. Factor the remaining quadratic (show the method from L05)
6. Set each factor = 0

---

### L11 — Solve Polynomial Inequalities (text) — SEVERE

**Current hint:** "Factor first, find the critical points, and test intervals. Strict inequalities use parentheses; non-strict inequalities include zeros with brackets or braces."

**Gap:** Same as L07 — never explains how to test intervals. Also assumes factoring ability. Additionally, endpoint logic (when to use brackets vs parentheses) is stated but not demonstrated.

**Fix — Hint:** Full procedure (builds on L07 but adds inequality-specific logic):
> "**Step 1 — Factor:** Factor the polynomial completely (see Level 5 techniques).
> **Step 2 — Find critical points:** Set each factor = 0 to find zeros. These are the boundary points.
> **Step 3 — Test intervals:** Place zeros on a number line. Pick a test point in each interval. Plug into the factored form and determine the sign (+ or −) of each factor, then multiply.
> **Step 4 — Read the answer:**
> For > 0 or < 0 (strict): use parentheses ( ) — zeros are NOT included.
> For ≥ 0 or ≤ 0 (non-strict): use brackets [ ] at zeros where f(x) = 0 — zeros ARE included.
> Use U to combine intervals. Use 'inf' for infinity (always with parenthesis, never bracket).
> **Example:** x(x−2)(x+2) > 0 → zeros at −2, 0, 2. Test: x = −3 gives (−)(−)(−) = − (no). x = −1 gives (−)(−)(+) = + (yes). x = 1 gives (+)(−)(+) = − (no). x = 3 gives (+)(+)(+) = + (yes). Answer: **(−2, 0) U (2, inf)**"

**Fix — Animation:** Rebuild `a11_inequality_intervals.py` with the same test-point process shown in L07 fix, plus add a second example showing a non-strict inequality (≥) with brackets.

---

### L12 — Identify Cubic Transformations (dropdown) — MODERATE

**Current hint:** "Compare the function to x³ piece by piece: the number in front changes vertical stretch or reflection, inside parentheses changes horizontal shift, and the outside constant changes vertical shift."

**Gap:** The counterintuitive horizontal shift direction ((x − 3)³ shifts RIGHT, not left) is not addressed. Order of transformations not discussed. Animation only shows vertical transformations.

**Fix — Hint:** Add explicit shift direction and examples:
> "Compare to the parent y = x³ piece by piece:
> **Coefficient in front** (like 2x³ or −x³): vertical stretch/compression. Negative = reflection over x-axis.
> **Inside parentheses** (like (x − 3)³): horizontal shift. **(x − 3) shifts RIGHT 3** — the minus sign is counterintuitive! (x + 2) shifts LEFT 2.
> **Constant outside** (like x³ + 5): vertical shift. +5 shifts UP 5, −1 shifts DOWN 1.
> **Reading order:** coefficient → horizontal shift → vertical shift.
> **Example:** −2(x + 1)³ − 4 = reflect over x-axis, stretch by 2, shift LEFT 1, shift DOWN 4."

**Fix — Animation:** Add examples showing horizontal shifts and reflections, not just vertical stretch + shift. Show the (x − 3)³ shift-right case explicitly with an arrow indicating direction.

---

### L13 — Explain a Sketch from Factors (textarea) — SEVERE

**Current hint:** "Steps: 1) list the zeros, 2) give multiplicity and cross/touch behavior, 3) use a sign chart or test points, 4) state where the polynomial is positive or negative."

**Gap:** This is a synthesis level that assumes mastery of L05–L07 skills. The animation shows one completed example but doesn't walk through the generalizable method. The hint lists steps but each step references techniques that may not have been fully learned.

**Fix — Hint:** Expand each step with reminders of the technique:
> "Follow these steps for ANY factored polynomial:
> **1) List zeros:** Set each factor = 0 and solve. Include the zero from a GCF if present.
> **2) Multiplicity & behavior:** Read each factor's exponent. Odd → crosses, even → touches.
> **3) End behavior:** Look at the degree (sum of all exponents) and leading coefficient sign. Even degree + positive lead → both ends up. Odd degree + positive lead → left down, right up. Negative lead flips everything.
> **4) Sign chart:** Place zeros on a number line. Test one point per interval by evaluating the sign of each factor. Multiply signs to get the interval's sign.
> **5) Conclusion:** State which intervals are positive and which are negative. Connect this to the sketch: positive = above x-axis, negative = below.
> **Write your answer** covering all 5 points. Example: 'The zeros are x = −1 (mult 3, crosses) and x = 6 (mult 1, crosses). End behavior: degree 4, positive lead, so both ends up. Sign chart: positive on (−∞, −1), negative on (−1, 6), positive on (6, ∞). The graph is above the x-axis except between −1 and 6.'"

**Fix — Animation:** Rebuild `a13_sketch_from_factors.py` to walk through ALL 5 steps sequentially on a single example, pausing at each step. Show the sign chart construction (test points, factor signs) explicitly rather than just the final graph.

---

### L14 — Error Analysis Capstone (textarea) — MODERATE–SEVERE

**Current hint:** "Read the student work line by line. Check the factor signs, multiplicities, cross/touch rule, sign chart, endpoint inclusion, complex arithmetic, or transformation language."

**Gap:** The hint is a checklist of WHAT to check but not HOW to check it. The animation shows only one error type (reversed cross/touch) out of 10 scenario types. No general error-spotting strategy taught.

**Fix — Hint:** Add a systematic error-checking method:
> "**Error-checking method — go line by line:**
> 1) **Factor signs:** Does (x − 5) give zero x = 5 (not −5)? Does (x + 3) give x = −3?
> 2) **Multiplicity:** Is the exponent read correctly? Remember: no exponent = multiplicity 1.
> 3) **Cross/touch:** Odd multiplicity → cross. Even → touch. Are they applied correctly?
> 4) **Sign chart:** Were test points evaluated correctly? Did they account for even-multiplicity factors not flipping the sign?
> 5) **Endpoints:** Strict inequality (< >) → parentheses. Non-strict (≤ ≥) → brackets at zeros.
> 6) **Complex arithmetic:** Is i² replaced with −1? Are real and imaginary parts combined correctly?
> 7) **Transformations:** Does (x − a)³ shift RIGHT (not left)?
> **Format:** State the specific error, explain which rule was broken, then give the corrected version."

**Fix — Animation:** Show 2–3 different error types (not just one). Quick montage: one cross/touch error, one sign chart error, one complex arithmetic error. For each, show the wrong work, highlight the mistake, state the rule, show the correction.

---

## Summary Table

| Level | Severity | Primary Fix Needed |
|-------|----------|--------------------|
| L01 | MODERATE | Expand hint to cover all 10 vocab terms; add visual cards to animation |
| L02 | MINOR | Add "why" explanation and coefficient division step |
| L03 | MINOR | Address implicit exponent (x = x¹) |
| L04 | MINOR–MOD | Add sign-change intuition for why odd crosses |
| **L05** | **SEVERE** | **Teach quadratic factoring method (multiply-to-c, add-to-b)** |
| L06 | MODERATE | Clarify answer format; show step-by-step table construction |
| **L07** | **SEVERE** | **Teach sign chart construction with test point evaluation** |
| L08 | MODERATE | Teach coefficient identification (a, b, c) and what "complex" means |
| **L09** | **SEVERE** | **Teach FOIL from scratch; explain i and i² = −1** |
| **L10** | **SEVERE** | **Show how to move terms, combine like terms, factor cubics** |
| **L11** | **SEVERE** | **Same as L07 + teach endpoint logic (brackets vs parentheses)** |
| L12 | MODERATE | Explain counterintuitive horizontal shift direction |
| **L13** | **SEVERE** | **Expand all 5 synthesis steps with technique reminders** |
| L14 | MOD–SEVERE | Add systematic error-checking method; animate multiple error types |

## Scope of Changes

### Files to modify:
1. **`cartridges/a2t3l5/manifest.json`** — All 14 `hints.perField` entries
2. **`cartridges/a2t3l5/generator.js`** — `problemText` strings where they need to be more instructional
3. **14 animation scripts** in `animations/a2t3l5/` — varying degrees of rebuild

### Files NOT changed:
- `grading-rules.js` — grading logic stays the same
- `registry.json` — no structural changes
- Problem banks — same problems, just better instructions

### Priority order:
1. **SEVERE levels first:** L05, L07, L09, L10, L11, L13 (these are blocking learning)
2. **MODERATE levels:** L01, L06, L08, L12, L14
3. **MINOR levels:** L02, L03, L04
