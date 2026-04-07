# a2t3l5 — Zeros of Polynomial Functions

## Meta

| Field | Value |
|-------|-------|
| ID | `a2t3l5` |
| Name | Zeros of Polynomial Functions |
| Subject | Algebra 2 |
| Description | Find zeros by factoring, interpret multiplicity (cross vs touch), use sign charts, solve polynomial equations/inequalities, simplify complex expressions, and identify cubic transformations. |

## Standards

- A-APR.B.3 — Identify zeros of polynomials; use zeros to construct rough graph
- F-IF.C.7c — Graph polynomial functions, identifying zeros and end behavior
- F-IF.B.4 — Interpret key features: intercepts, positive/negative intervals, end behavior
- N-CN.C.9 — Fundamental Theorem of Algebra (quadratic case)
- F-BF.B.3 — Transformations of parent functions
- MP.1, MP.2, MP.7, MP.8

## Progression Overview

14 levels. Every level unlocks at **gold: 1** (except L01 which is `"default"`).  
Every level has a Manim animation.

| # | Mode ID | Name | Input | Animation |
|---|---------|------|-------|-----------|
| 01 | l01-vocab-basics | Zeros & Multiplicity Vocabulary | choice | ZeroMultVocab |
| 02 | l02-zero-from-factor | Factor to Zero | choice | FactorToZero |
| 03 | l03-multiplicity-id | Multiplicity Identification | choice | MultiplicityID |
| 04 | l04-cross-or-touch | Cross or Touch? | choice | CrossOrTouch |
| 05 | l05-factor-find-zeros | Factor to Find All Zeros | text | FactorFindZeros |
| 06 | l06-multiplicity-report | Full Zero Report | text | ZeroReportTable |
| 07 | l07-sign-chart | Sign Charts & Intervals | text | SignChartBuilder |
| 08 | l08-complex-vs-real | Real or Complex Zeros? | choice | RealVsComplex |
| 09 | l09-complex-squaring | Simplify (a+bi)^2 | text | ComplexSquareFOIL |
| 10 | l10-equation-rewrite | Solve by Rewriting to 0 | text | RewriteToZero |
| 11 | l11-inequality | Solve Polynomial Inequalities | text | InequalityIntervals |
| 12 | l12-transformations | Identify Cubic Transformations | dropdown | CubicTransforms |
| 13 | l13-sketch-justification | Explain a Sketch from Factors | textarea | SketchFromFactors |
| 14 | l14-error-capstone | Error Analysis Capstone | textarea | SpotTheError |

---

## Level Details + Problem Banks

---

### L01 — Vocab Basics (choice)

**Skill**: Recognize definitions — zero/root, multiplicity, end behavior, interval notation, cross/touch.

**Options**: `{{optA}}`, `{{optB}}`, `{{optC}}`, `{{optD}}`

#### Bank (10 scenarios)

| # | Prompt | A | B | C | D | Correct | Misconceptions |
|---|--------|---|---|---|---|---------|---------------|
| 1 | Which statement best defines a zero (root) of a polynomial? | The y-value where x=0 | The x-value where f(x)=0 | The greatest exponent | The number of turning points | B | A=y-intercept confusion, C=degree confusion, D=turning point confusion |
| 2 | What does multiplicity of a zero mean? | How many different zeros | How many times a factor repeats | Whether graph has a y-intercept | How many terms in the polynomial | B | A=counts distinct, C=intercept confusion, D=terms vs factors |
| 3 | In the factor (x+7), what is the zero? | 7 | -7 | 0 | Cannot be found | B | A=sign error, C=assumes 0, D=doesn't connect factor to solving |
| 4 | What does "tangent to the x-axis" most likely mean? | The graph crosses | The graph touches/turns | There is a vertical asymptote | The y-intercept | B | A=cross vs touch, C=polynomial vs rational, D=intercept confusion |
| 5 | What does end behavior describe? | Where graph crosses x-axis | What happens as x to +/-infinity | The vertex of the graph | The slope | B | A=intercept confusion, C=quadratic vocab, D=linear thinking |
| 6 | Which is interval notation? | x = -3, 0, 4 | (-2,0) U (2,inf) | f(x)=x(x-2)(x+2) | x^2+9=0 | B | A=solution list, C=expression, D=equation |
| 7 | Which is true about (x-1)^4? | Zero is x=1 with mult 4 | Zero is x=-1 with mult 4 | There are four different zeros | Graph must cross at x=1 | A | B=sign error, C=mult as distinct, D=even touches |
| 8 | For P(x) > 0, should zeros be included? | Yes always | No never | Only if >= or <= | Only if quadratic | B | A=treats > like >=, C=correct rule but wrong inequality, D=degree dependent |
| 9 | A polynomial of degree 3 has how many zeros (counting multiplicity)? | Exactly 3 | At most 3 | Exactly 2 | Cannot determine | A | B=confuses with distinct, C=wrong count, D=thinks indeterminate |
| 10 | What does Zero-Product Property say? | If ab=0 then a=0 or b=0 | If a+b=0 then a=0 | If a=b then both are zero | If a>0 then b>0 | A | B=addition confusion, C=equality confusion, D=sign confusion |

**Hint**: "A zero is an x-value that makes f(x)=0 (where the graph hits the x-axis). Multiplicity is the exponent on a repeated factor."

---

### L02 — Zero from Factor (choice)

**Skill**: Given a linear factor like (x - a) or (2x - 6), identify the zero.

**Options**: 4 numeric choices (correct zero + 3 distractors)

#### Bank (10 scenarios)

| # | Factor | Correct | D1 (sign flip) | D2 (coeff error) | D3 (random) |
|---|--------|---------|----------------|-------------------|-------------|
| 1 | (x - 5) | 5 | -5 | 0 | 1 |
| 2 | (x + 3) | -3 | 3 | 0 | -1 |
| 3 | (x - 7) | 7 | -7 | 1 | 0 |
| 4 | (x + 1) | -1 | 1 | 0 | -2 |
| 5 | (x) | 0 | 1 | -1 | undefined |
| 6 | (x - 10) | 10 | -10 | 1 | 0 |
| 7 | (x + 6) | -6 | 6 | -3 | 0 |
| 8 | (2x - 4) | 2 | 4 | -2 | -4 |
| 9 | (3x + 9) | -3 | 9 | 3 | -9 |
| 10 | (x + 8) | -8 | 8 | -4 | 0 |

**Hint**: "Set the factor equal to zero and solve. For (x - a) = 0, x = a. For (x + a) = 0, x = -a."

---

### L03 — Multiplicity Identification (choice)

**Skill**: Read the exponent on a factor to state its multiplicity.

**Options**: ["1", "2", "3", "4", "5", "6"] (subset shown per problem)

#### Bank (10 scenarios)

| # | Function | Zero asked | Correct | D1 (wrong factor) | D2 (added exps) | D3 (value=mult) |
|---|----------|-----------|---------|-------------------|-----------------|-----------------|
| 1 | (x-2)^3(x+1) | x=2 | 3 | 1 | 4 | 2 |
| 2 | x^2(x-7) | x=0 | 2 | 1 | 3 | 0 |
| 3 | (x+4)(x-1)^4 | x=1 | 4 | 1 | 5 | -1 |
| 4 | (x-3)^2(x+5)^2 | x=-5 | 2 | 4 | 1 | 5 |
| 5 | (x+2)^5 | x=-2 | 5 | 1 | 2 | -2 |
| 6 | x(x-6)^3(x+1)^2 | x=-1 | 2 | 3 | 6 | 1 |
| 7 | x(x-6)^3(x+1)^2 | x=6 | 3 | 1 | 6 | 2 |
| 8 | (x-4)^4(x+3) | x=4 | 4 | 1 | 5 | -4 |
| 9 | (x+7)^2(x-2)^2(x) | x=0 | 1 | 2 | 5 | 0 |
| 10 | (x-1)^6 | x=1 | 6 | 1 | 3 | -1 |

**Hint**: "Multiplicity = exponent on the factor. (x-a)^k means x=a has multiplicity k."

---

### L04 — Cross or Touch (choice)

**Skill**: Apply odd/even multiplicity rule to determine graph behavior at a zero.

**Options**: ["Crosses the x-axis", "Touches (bounces off) the x-axis"]

#### Bank (12 scenarios)

| # | Function | Zero | Mult | Correct | Misconception |
|---|----------|------|------|---------|--------------|
| 1 | (x-1)^2(x+3) | x=1 | 2 | Touches | "All zeros cross" |
| 2 | (x-1)^2(x+3) | x=-3 | 1 | Crosses | Even rule on wrong zero |
| 3 | (x+2)^3(x-4)^2 | x=-2 | 3 | Crosses | "Higher mult = touch" |
| 4 | (x+2)^3(x-4)^2 | x=4 | 2 | Touches | "3>2 so 2 crosses" |
| 5 | x^4(x-6) | x=0 | 4 | Touches | Didn't see x^4 as mult 4 |
| 6 | x^4(x-6) | x=6 | 1 | Crosses | Touch applied to all |
| 7 | (x+1)^5 | x=-1 | 5 | Crosses | "Big exponent = touch" |
| 8 | (x-3)^2(x+1)^2 | x=3 | 2 | Touches | "Two touches means one crosses" |
| 9 | (x-3)^2(x+1)^2 | x=-1 | 2 | Touches | Same |
| 10 | x(x-5)(x+2) | x=0 | 1 | Crosses | "x has no exponent" |
| 11 | (x+4)^4(x-2)^3 | x=-4 | 4 | Touches | Large exponent confusion |
| 12 | (x+4)^4(x-2)^3 | x=2 | 3 | Crosses | "Smaller must touch" |

**Hint**: "Odd multiplicity (1,3,5) -> crosses. Even multiplicity (2,4,6) -> touches/bounces. Check the exponent!"

---

### L05 — Factor to Find All Zeros (text)

**Skill**: Factor polynomial completely (GCF + quadratic) and list all real zeros.

**Placeholder**: "Enter zeros separated by commas, e.g. -3, 0, 1"

#### Bank (10 scenarios)

| # | Polynomial | GCF | Remaining | Zeros | Common errors |
|---|-----------|-----|-----------|-------|--------------|
| 1 | x^3+2x^2-3x | x | (x+3)(x-1) | -3, 0, 1 | Forgot 0; sign flip |
| 2 | 2x^3-8x^2+6x | 2x | (x-1)(x-3) | 0, 1, 3 | Forgot 0; sign flip |
| 3 | x^3-4x | x | (x-2)(x+2) | -2, 0, 2 | Didn't factor x^2-4 |
| 4 | 3x^3+12x^2+9x | 3x | (x+1)(x+3) | -3, -1, 0 | Sign flip |
| 5 | x^3-x^2-6x | x | (x-3)(x+2) | -2, 0, 3 | Forgot 0; sign flip |
| 6 | x^3+5x^2+6x | x | (x+2)(x+3) | -3, -2, 0 | Sign flip |
| 7 | 4x^3-4x | 4x | (x-1)(x+1) | -1, 0, 1 | Used wrong factor |
| 8 | x^3-9x | x | (x-3)(x+3) | -3, 0, 3 | Didn't factor x^2-9 |
| 9 | x^3+x^2-2x | x | (x+2)(x-1) | -2, 0, 1 | Sign flip |
| 10 | 5x^3-20x^2+15x | 5x | (x-1)(x-3) | 0, 1, 3 | Forgot 0; sign flip |

**Hint**: "Step 1: Factor out the GCF (usually x). Step 2: Factor the remaining quadratic. Step 3: Set each factor = 0."

---

### L06 — Multiplicity Report (text)

**Skill**: Given factored form, report each real zero with multiplicity and cross/touch behavior.

**Placeholder**: "Format: (zero, mult, cross/touch); ... Example: (-2, 3, cross); (1, 2, touch)"

#### Bank (10 scenarios)

| # | Expression | Zero Reports | Common errors |
|---|-----------|-------------|--------------|
| 1 | x(x+4)(x-1)^4 | (-4,1,cross); (0,1,cross); (1,4,touch) | (4,1,cross) sign error; (1,4,cross) even=touch |
| 2 | (x^2+9)(x-1)^5(x+2)^2 | (-2,2,touch); (1,5,cross) | Includes +/-3 from x^2+9 |
| 3 | -(x-3)^3(x+1)^2 | (-1,2,touch); (3,3,cross) | Swaps behaviors |
| 4 | (x+5)^2(x-2)^2 | (-5,2,touch); (2,2,touch) | "Cross at both" |
| 5 | 2x^2(x-4)(x+1)^3 | (-1,3,cross); (0,2,touch); (4,1,cross) | Lists "0 twice" |
| 6 | -(x-1)^2(x+4) | (-4,1,cross); (1,2,touch) | Flips which is repeated |
| 7 | (x+3)^4(x-1)(x+1) | (-3,4,touch); (-1,1,cross); (1,1,cross) | Touch at -1 or 1 |
| 8 | x^3(x-2)^5 | (0,3,cross); (2,5,cross) | Touch at 0 (wrong parity) |
| 9 | (x-5)(x-1)^2 | (1,2,touch); (5,1,cross) | Reversed behaviors |
| 10 | x(x-6)^3(x+1)^2 | (-1,2,touch); (0,1,cross); (6,3,cross) | Sign errors; wrong behaviors |

**Hint**: "For each factor (x-a)^k: zero is x=a, multiplicity is k. Odd k -> crosses. Even k -> touches."

---

### L07 — Sign Chart & Intervals (text)

**Skill**: Determine where polynomial is positive/negative; answer in interval notation.

**Placeholder**: "Answer in interval notation. Example: (-3, 0) U (4, inf)"

#### Bank (10 scenarios)

| # | Expression | Ask | Correct | Common errors |
|---|-----------|-----|---------|--------------|
| 1 | x(x-4)(x+3) | f(x)>0 | (-3,0) U (4,inf) | Flipped intervals |
| 2 | -(x-1)^2(x+4) | f(x)>0 | (-inf,-4) | (-4,1) assumes flip at double root |
| 3 | (x+2)^3(x-1)^2 | f(x)<0 | (-inf,-2) | (-2,1) thinks negative between zeros |
| 4 | 2(x-3)(x+1)^2 | f(x)>0 | (3,inf) | (-1,3) assumes alternation at -1 |
| 5 | -(x+5)^2(x-2)^2 | f(x)>0 | empty set | (-5,2) assumes alternation |
| 6 | (x-4)(x-1)(x+2) | f(x)>0 | (-2,1) U (4,inf) | Flipped |
| 7 | -x(x+3)^4(x-1) | f(x)>0 | (0,1) | Forgets leading negative and even mult at -3 |
| 8 | (x+1)^3(x-6) | f(x)<0 | (-1,6) | Flipped |
| 9 | x(x-4)(x+3) | f(x)<0 | (-inf,-3) U (0,4) | Flipped |
| 10 | x(x+3)(x-1) | f(x)>0 | (-3,0) U (1,inf) | Miscounted negatives |

**Hint**: "Use zeros to split the number line. Pick a test point in each interval and check the sign of each factor. Odd number of negatives = negative product. Even multiplicity does NOT flip sign."

---

### L08 — Complex vs Real (choice)

**Skill**: Determine whether a quadratic factor produces real or complex zeros using discriminant.

**Options**: ["Two real zeros", "Two complex zeros (no real zeros)"]

#### Bank (10 scenarios)

| # | Factor | a | b | c | Discriminant | Correct | Misconception |
|---|--------|---|---|---|-------------|---------|--------------|
| 1 | x^2+9 | 1 | 0 | 9 | -36 | Complex | "x=+/-3 are zeros" |
| 2 | x^2-4 | 1 | 0 | -4 | 16 | Real | Confused with x^2+4 |
| 3 | x^2+2x+5 | 1 | 2 | 5 | -16 | Complex | "Positive coeffs = real" |
| 4 | x^2-6x+9 | 1 | -6 | 9 | 0 | Real | "Discriminant 0 = complex" |
| 5 | x^2+1 | 1 | 0 | 1 | -4 | Complex | "x=+/-1 are zeros" |
| 6 | x^2-5x+6 | 1 | -5 | 6 | 1 | Real | — |
| 7 | x^2+4x+8 | 1 | 4 | 8 | -16 | Complex | "I can factor this" |
| 8 | x^2-x-6 | 1 | -1 | -6 | 25 | Real | — |
| 9 | x^2+16 | 1 | 0 | 16 | -64 | Complex | "x=+/-4 are zeros" |
| 10 | x^2+6x+9 | 1 | 6 | 9 | 0 | Real | "All positive = complex" |

**Hint**: "Check discriminant b^2 - 4ac. Negative -> complex. Zero or positive -> real. For x^2 + c with c > 0, no real solution."

---

### L09 — Complex Squaring (text)

**Skill**: Expand (a + bi)^2 using FOIL with i^2 = -1.

**Placeholder**: "Enter in a + bi form, e.g. -16 + 30i"

#### Bank (10 scenarios)

| # | Expression | a | b | Real (a^2-b^2) | Imag (2ab) | Correct | D1 (forgot i^2=-1) | D2 (forgot middle) |
|---|-----------|---|---|----------------|------------|---------|--------------------|--------------------|
| 1 | (3+5i)^2 | 3 | 5 | -16 | 30 | -16+30i | 34+30i | -16 |
| 2 | (2+3i)^2 | 2 | 3 | -5 | 12 | -5+12i | 13+12i | -5 |
| 3 | (1+4i)^2 | 1 | 4 | -15 | 8 | -15+8i | 17+8i | -15 |
| 4 | (4+i)^2 | 4 | 1 | 15 | 8 | 15+8i | 17+8i | 15 |
| 5 | (5+2i)^2 | 5 | 2 | 21 | 20 | 21+20i | 29+20i | 21 |
| 6 | (1+i)^2 | 1 | 1 | 0 | 2 | 2i | 2+2i | 0 |
| 7 | (3+2i)^2 | 3 | 2 | 5 | 12 | 5+12i | 13+12i | 5 |
| 8 | (2+5i)^2 | 2 | 5 | -21 | 20 | -21+20i | 29+20i | -21 |
| 9 | (6+i)^2 | 6 | 1 | 35 | 12 | 35+12i | 37+12i | 35 |
| 10 | (4+3i)^2 | 4 | 3 | 7 | 24 | 7+24i | 25+24i | 7 |

**Hint**: "Use FOIL: (a+bi)^2 = a^2 + 2abi + b^2*i^2. Replace i^2 with -1. Combine real parts, combine imaginary parts."

---

### L10 — Solve Equation by Rewrite (text)

**Skill**: Solve P(x) = Q(x) by rewriting to P(x) - Q(x) = 0, then factor.

**Placeholder**: "Enter all real solutions, separated by commas. Example: -5, -1, 2"

#### Bank (8 scenarios)

| # | Equation | Correct solutions | Common errors |
|---|---------|-------------------|--------------|
| 1 | x^3+5x^2-x-7 = x^2+6x+3 | -5, -1, 2 | Loses one root; sign errors |
| 2 | 2x^3+5x^2-3x = 3x^3+8x^2+1 | -1 | x=1 (sign error) |
| 3 | x^3-3x^2-6x+8 = x^2-6x+8 | 0, 4 | Misses x=0 |
| 4 | x^4+2x^2+40x = 7x^3 | -2, 0, 4, 5 | Drops x=0 |
| 5 | x^3+x^2-9x-9 = x^2-9 | -3, 0, 3 | Misses x=0 |
| 6 | -x^3-2x^2+7x = 4 | -4, 1 | Misses repeated root 1 |
| 7 | x^3+4x^2-3x = 18 | -3, 2 | Drops a root |
| 8 | x^3-3x^2 = -4 | -1, 2 | Misses repeated root 2 |

**Hint**: "Step 1: Get 0 on one side (subtract). Step 2: Combine like terms. Step 3: Factor. Step 4: Zero-Product Property."

---

### L11 — Solve Polynomial Inequalities (text)

**Skill**: Factor, find zeros, test intervals, write solution in interval notation with correct endpoints.

**Placeholder**: "Answer in interval notation. Example: (-2, 0) U (2, inf)"

#### Bank (10 scenarios)

| # | Inequality | Correct | Common errors |
|---|-----------|---------|--------------|
| 1 | x^3-4x > 0 | (-2,0) U (2,inf) | Includes endpoints; flipped |
| 2 | x^3-16x < 0 | (-inf,-4) U (0,4) | Flipped |
| 3 | (x-1)^2(x+4) <= 0 | (-inf,-4] U {1} | Drops -4; drops {1} |
| 4 | x(x+3)(x-1) >= 0 | [-3,0] U [1,inf) | Uses parens despite >= |
| 5 | -(x+5)^2(x-2) > 0 | (-inf,-5) U (-5,2) | (-inf,2) forgets to exclude -5 |
| 6 | (x+1)^3(x-6) < 0 | (-1,6) | Flipped |
| 7 | 2(x-3)(x+1)^2 >= 0 | {-1} U [3,inf) | [-1,inf) assumes all >= |
| 8 | x^4-81 <= 0 | [-3,3] | Confuses <= with >= |
| 9 | x(x-2)(x+2) > 0 | (-2,0) U (2,inf) | Includes endpoints |
| 10 | -(x-1)^2(x+3) >= 0 | (-inf,-3] U {1} | (-inf,1] wrong |

**Hint**: "Factor -> find zeros -> test intervals -> strict (> <) uses parentheses, non-strict (>= <=) uses brackets. Even multiplicity does NOT flip sign."

---

### L12 — Identify Cubic Transformations (dropdown)

**Skill**: Compare transformed cubic to parent f(x) = x^3 and identify all transformations.

**Options**: `{{optA}}`, `{{optB}}`, `{{optC}}`, `{{optD}}` (one correct description, three wrong)

#### Bank (10 scenarios)

| # | Function | Correct Description | D1 | D2 | D3 |
|---|---------|--------------------|----|----|----|
| 1 | 2x^3-1 | Vertical stretch by 2, shift down 1 | Shift right 1 | Same as parent | Horizontal stretch by 2 |
| 2 | -x^3+4 | Reflect over x-axis, shift up 4 | Shift right 4 | Compress vertically | Reflect over y-axis |
| 3 | (x-2)^3 | Shift right 2 | Shift left 2 | Stretch by 2 | Shift down 2 |
| 4 | 3(x+1)^3-5 | Stretch by 3, left 1, down 5 | Right 1, up 5 | Stretch by 3, right 1 | Left 1, up 5 |
| 5 | (1/2)x^3+3 | Vertical compress by 1/2, up 3 | Right 3 | Stretch by 3 | Horizontal stretch by 2 |
| 6 | -2x^3 | Reflect x-axis, stretch by 2 | Shift down 2 | Same as parent | Reflect y-axis, stretch 2 |
| 7 | (x+4)^3+2 | Shift left 4, up 2 | Right 4 | Stretch by 4 | Left 4, down 2 |
| 8 | -(x-3)^3-1 | Reflect x-axis, right 3, down 1 | Left 3, up 1 | Right 3, up 1 | Reflect y-axis, right 3 |
| 9 | 4(x-1)^3 | Stretch by 4, right 1 | Left 1, stretch 4 | Right 4, stretch 1 | Down 1, stretch 4 |
| 10 | -(x+2)^3+6 | Reflect x-axis, left 2, up 6 | Right 2, down 6 | Left 2, down 6 | Reflect y-axis, left 2 |

**Hint**: "Compare to x^3 piece by piece. Number in front = vertical stretch/reflect. Inside parentheses = horizontal shift (opposite sign!). Added outside = vertical shift."

---

### L13 — Sketch Justification (textarea)

**Skill**: Given factored polynomial, explain full reasoning: zeros -> multiplicity -> sign chart -> sketch description + interval conclusion.

**Placeholder**: "Explain: (1) Zeros and multiplicities. (2) Cross or touch at each. (3) Sign on each interval. (4) Where is f(x) positive/negative?"

#### Bank (8 scenarios)

| # | Expression | Key Points | Expected Interval Conclusion |
|---|-----------|------------|----------------------------|
| 1 | (x+1)^3(x-6) | zeros -1,6; both cross (odd); sign chart | f(x)<0 on (-1,6) |
| 2 | -(x-1)^2(x+4) | zeros -4,1; cross at -4, touch at 1; leading neg | f(x)>0 on (-inf,-4) |
| 3 | x(x-4)(x+3) | zeros -3,0,4; all simple cross; alternating | f(x)>0 on (-3,0) U (4,inf) |
| 4 | 2(x-3)(x+1)^2 | touch -1, cross 3; no flip at -1 | f(x)>0 on (3,inf) |
| 5 | -x(x+3)^4(x-1) | even mult at -3 no flip; leading neg | f(x)>0 on (0,1) |
| 6 | (x-4)(x-1)(x+2) | all simple, alternating | f(x)>0 on (-2,1) U (4,inf) |
| 7 | (x+2)^3(x-1)^2 | cross -2, touch 1; same sign through 1 | f(x)<0 on (-inf,-2) |
| 8 | -(x+5)^2(x-2)^2 | always nonpositive; 0 at -5,2 | f(x)>0 has no solution |

**Hint**: "Steps: (1) List zeros from factors. (2) State multiplicity and cross/touch for each. (3) Pick test points between zeros for sign. (4) Write the interval where f is positive/negative."

---

### L14 — Error Analysis Capstone (textarea)

**Skill**: Identify and correct errors in student work involving zeros, multiplicity, sign charts, equations, inequalities, or complex numbers.

**Placeholder**: "1) Identify the error. 2) Explain why it's wrong. 3) Provide the corrected answer."

#### Bank (10 scenarios)

| # | Student Error | Error Type | Correct Explanation |
|---|-------------|-----------|-------------------|
| 1 | "f(x)=(x-5)(x-1)^2 crosses at x=1, touches at x=5" | Reversed cross/touch | x=1 has mult 2 (touches); x=5 has mult 1 (crosses) |
| 2 | "x^3-3x^2-10x = x(x^2-3x-10) = x(x-5)(x-2)" zeros: 0,5,2 | Sign error in factoring | x^2-3x-10 = (x-5)(x+2), not (x-5)(x-2). Zero is -2 |
| 3 | "x^2+4 has zeros x=2 and x=-2" | Confused +/- in factor | x^2+4=0 -> x^2=-4 -> no real zeros. Confused with x^2-4 |
| 4 | "(x+2)^2(x-3) goes up on both ends because degree 3" | Wrong end behavior | Degree 3 positive leading: down left, up right. "Up both" is even degree |
| 5 | "(2+3i)^2 = 4+9i^2 = 4-9 = -5" | Forgot middle term | Missing 2(2)(3i)=12i. Correct: -5+12i |
| 6 | "f(x)=x(x+4)(x-1)^4 has 3 zeros and all cross" | Confused count with mult | x=1 has mult 4 (even -> touches), doesn't cross |
| 7 | "Zero of (x+3) is x=3" | Sign flip on factor | (x+3)=0 -> x=-3, not 3. Sign is opposite |
| 8 | Student solves x^3-4x>0 and gets (-inf,-2) U (0,2) | Wrong sign chart | Correct: (-2,0) U (2,inf). Sign test was flipped |
| 9 | Student solves (x-1)^2(x+4)<=0 and gives (-inf,-4) | Missing endpoint + isolated zero | Include -4 (<=) and {1} (makes expression 0). Answer: (-inf,-4] U {1} |
| 10 | "f(x)=2x^3-1 is shifted right 1 from parent" | Confused vertical/horizontal | The -1 is outside x^3, so vertical shift down 1, not horizontal |

**Hint**: "Read the student work line by line. Check: factors correct? Multiplicity read correctly? Odd/even applied correctly? Signs handled? Endpoints included/excluded properly?"

---

## Grading Criteria

### Choice/Dropdown Levels (L01, L02, L03, L04, L08, L12)

- **E**: Selected answer exactly matches correct.
- **P**: N/A (single selection).
- **I**: Any other selection.

### L05 — Factor Find Zeros (text)

- **E**: All zeros listed correctly (order-independent). Accept equivalent forms (0.5 = 1/2).
- **P**: At least 2 of 3 zeros correct (missed GCF zero or one sign error).
- **I**: Fewer than 2 correct or fundamentally wrong factoring.
- **Keywords**: "factor", "GCF", "zero-product"
- **Forbidden**: Listing coefficients instead of zeros; listing factors instead of x-values.

### L06 — Multiplicity Report (text)

- **E**: Every real zero: correct value, correct multiplicity, correct behavior ("cross"/"touch").
- **P**: Correct zeros but one behavior wrong, or one multiplicity wrong.
- **I**: Wrong zeros (sign errors), includes non-real as real, most behaviors reversed.
- **Keywords**: "multiplicity", "odd", "even", "cross", "touch", "bounce"
- **Forbidden**: "crosses twice", "x^2+9 has zeros +/-3"

### L07 — Sign Chart (text)

- **E**: Correct interval notation with correct unions and correct endpoint inclusion/exclusion.
- **P**: Correct critical points but one interval sign mistake, or correct intervals but bracket/paren wrong.
- **I**: Completely reversed; lists only zeros (equation mindset).
- **Keywords**: "interval", "test point", "sign", "positive", "negative"
- **Forbidden**: "solution is x=-3,0,4" for inequality; "always alternates at double root"

### L09 — Complex Squaring (text)

- **E**: Exact match in a+bi form (accept spacing variations).
- **P**: Real part correct but imaginary sign wrong, or vice versa.
- **I**: Both parts wrong; forgot i^2=-1; missing imaginary part entirely.
- **Keywords**: "i^2", "-1", "FOIL"
- **Forbidden**: Answer with no imaginary part (forgot middle term).

### L10 — Equation Rewrite (text)

- **E**: All real solutions listed correctly.
- **P**: At least one correct but missing another, or correct set plus one extra.
- **I**: Sign-reversed; values don't satisfy original equation.
- **Keywords**: "rewrite as 0", "factor", "zero-product"
- **Forbidden**: "set each side to zero separately"

### L11 — Inequality (text)

- **E**: Correct interval set with correct endpoints (strict -> parens, non-strict -> brackets, isolated points as {x}).
- **P**: Correct critical points, most intervals correct, one endpoint or one piece wrong.
- **I**: Only zeros listed; opposite direction; ignores sign testing.
- **Keywords**: "critical points", "test points", "interval notation", "include/exclude"
- **Forbidden**: "even multiplicity flips sign"

### L13 — Sketch Justification (textarea)

- **E**: (1) Correct zeros, (2) correct multiplicity + cross/touch, (3) sign reasoning with test points, (4) correct interval conclusion.
- **P**: Correct zeros and some reasoning but missing one element (no sign reasoning OR wrong final interval).
- **I**: Core misconceptions (parity reversed, zeros as y-intercepts); incorrect final interval.
- **Keywords**: "zero", "factor", "multiplicity", "odd", "even", "cross", "touch", "sign chart", "test point", "positive", "negative", "interval"
- **Forbidden**: "touch means odd", "cross means even"

### L14 — Error Capstone (textarea)

- **E**: Identifies specific error + explains why wrong (rule-based) + provides corrected answer.
- **P**: Corrects answer but vague explanation, or identifies error but incomplete correction.
- **I**: Repeats the same mistake; proposes correction that also fails.
- **Keywords**: "error", "because", "should", "sign", "endpoint", "multiplicity", "even", "odd"
- **Forbidden**: "student is correct"; explanation that doesn't reference a math rule

---

## Animation Specifications

Every level gets one Manim animation. Each is a self-contained MP4, 15-45 seconds.

### A01 — ZeroMultVocab (L01)
- **Type**: translation
- **Concept**: "Zero = x-intercept" and "Multiplicity = repeated factor exponent"
- **Visuals**: Term cards flip ("zero", "multiplicity"). Graph appears. Zero highlighted at x-intercept. Factor (x-a)^k with exponent pulsing.
- **LaTeX**: `f(x)=0`, `(x-a)^k`
- **Duration**: 20-30s

### A02 — FactorToZero (L02)
- **Type**: step-by-step
- **Concept**: Setting each factor equal to zero to find the x-value
- **Visuals**: Factor list column. Each factor highlighted -> "= 0" -> solved x-value appears. Final list on number line.
- **LaTeX**: `(x+3)=0 \Rightarrow x=-3`
- **Duration**: 25-35s

### A03 — MultiplicityID (L03)
- **Type**: pattern-building
- **Concept**: Reading the exponent on a factor to determine multiplicity
- **Visuals**: Factored expression with color-coded factors. Exponent zooms/pulses. Multiplicity value appears beside each factor. Table builds: Zero | Exponent | Multiplicity.
- **LaTeX**: `(x-2)^3 \Rightarrow \text{mult} = 3`
- **Duration**: 20-30s

### A04 — CrossOrTouch (L04)
- **Type**: graph-trace
- **Concept**: Odd vs even multiplicity determines cross vs bounce at x-axis
- **Visuals**: Same zero x=a, two overlaid curves: one crosses (odd exponent, blue), one bounces (even exponent, red). Labels "odd -> crosses" and "even -> touches" appear.
- **LaTeX**: `(x-a)^1` vs `(x-a)^2` vs `(x-a)^3`
- **Duration**: 25-35s

### A05 — FactorFindZeros (L05)
- **Type**: step-by-step
- **Concept**: GCF factoring workflow -> quadratic factoring -> zero-product property
- **Visuals**: Polynomial appears. GCF brackets out. Remaining quadratic factors. Each factor set = 0. Zeros appear on number line.
- **LaTeX**: `x^3+2x^2-3x = x(x+3)(x-1)`
- **Duration**: 30-45s

### A06 — ZeroReportTable (L06)
- **Type**: pattern-building
- **Concept**: Convert factor exponents into a structured zero report
- **Visuals**: Table columns: Zero | Multiplicity | Behavior. Factors feed into rows. Parity badge (odd/even) triggers cross/touch icon per row.
- **LaTeX**: `(x-1)^4 \Rightarrow x=1,\ m=4,\ \text{touch}`
- **Duration**: 25-35s

### A07 — SignChartBuilder (L07)
- **Type**: step-by-step
- **Concept**: Building a sign chart from zeros, test points, and factor signs
- **Visuals**: Number line with zeros marked. Intervals light up one at a time. Test point chosen. Each factor's sign shown (+/-). Product sign computed. Above/below x-axis labeled. Graph sketch fades in matching sign chart.
- **LaTeX**: `x(x-4)(x+3)`, sign products like `(+)(-)(+) = -`
- **Duration**: 35-45s

### A08 — RealVsComplex (L08)
- **Type**: graph-trace
- **Concept**: Why x^2 + c (c>0) has no real zeros — parabola doesn't touch x-axis
- **Visuals**: Coordinate plane with y=x^2-4 (crosses at +/-2). Parabola shifts UP through x^2-1, x^2, x^2+1, x^2+4, x^2+9. Intercepts disappear as parabola lifts. Label "discriminant < 0" appears.
- **LaTeX**: `x^2+9=0 \Rightarrow x^2=-9 \Rightarrow x=\pm 3i`
- **Duration**: 20-30s

### A09 — ComplexSquareFOIL (L09)
- **Type**: area-model
- **Concept**: FOIL expansion of (a+bi)^2 with i^2 = -1 substitution
- **Visuals**: 2x2 area grid. Rows "3" and "5i", cols "3" and "5i". Cells fill: 9, 15i, 15i, 25i^2. Cell 25i^2 flashes, becomes -25. Real parts combine: 9+(-25)=-16. Imaginary combine: 30i. Result assembles.
- **LaTeX**: `(3+5i)^2 = 9+30i+25i^2 = 9+30i-25 = -16+30i`
- **Duration**: 25-35s

### A10 — RewriteToZero (L10)
- **Type**: translation
- **Concept**: Rewriting P(x)=Q(x) into P(x)-Q(x)=0 then factoring
- **Visuals**: Two sides of equation displayed. Right side subtracts from both. Like terms combine with animation. Result factors. Zeros listed.
- **LaTeX**: `x^3+5x^2-x-7 = x^2+6x+3 \Rightarrow x^3+4x^2-7x-10=0`
- **Duration**: 30-40s

### A11 — InequalityIntervals (L11)
- **Type**: step-by-step
- **Concept**: Inequality solution as shaded intervals with endpoint rules (< vs <=)
- **Visuals**: Factored form. Zeros on number line. Test points in each interval. Sign computed. Shading toggles. Strict = open dots, non-strict = closed dots. Solution in interval notation assembles.
- **LaTeX**: `x(x-2)(x+2) > 0`, solution `(-2,0) \cup (2,\infty)`
- **Duration**: 30-45s

### A12 — CubicTransforms (L12)
- **Type**: translation
- **Concept**: Parent x^3 transforming one step at a time
- **Visuals**: Start with y=x^3 in gray. Step 1: vertical stretch -> y=2x^3 in blue (arrow + label). Step 2: vertical shift -> y=2x^3-1 in dark blue (arrow + label). Parent ghosted for comparison. Key points labeled.
- **LaTeX**: `f(x)=x^3 \xrightarrow{\times 2} 2x^3 \xrightarrow{-1} 2x^3-1`
- **Duration**: 20-30s

### A13 — SketchFromFactors (L13)
- **Type**: graph-trace
- **Concept**: From factors to intercepts to local behavior to rough sketch
- **Visuals**: Intercept markers appear on axes. Cross/bounce animations at each zero. Curve draws segment by segment. "Above"/"below" labels per interval.
- **LaTeX**: `f(x)=(x+1)^3(x-6)`
- **Duration**: 30-45s

### A14 — SpotTheError (L14)
- **Type**: error-analysis
- **Concept**: Student work displayed, error highlighted, corrected version shown
- **Visuals**: Left panel "Student Work" with incorrect step in red, X marker. Right panel fades in "Corrected Work" in green. Annotation explains WHY. Corrected graph/answer appears.
- **LaTeX**: varies per scenario
- **Duration**: 25-35s

---

## Assessment Alignment Map

| Assessment Skill | Drill Level(s) |
|-----------------|----------------|
| Find all zeros by factoring (GCF + quadratic) | L02, L05 |
| Use zeros to sketch polynomial graph | L04, L07, L13 |
| Describe behavior at each zero (cross/touch + multiplicity) | L01, L03, L04, L06, L13 |
| Solve polynomial equation P(x) = Q(x) by rewriting | L05, L10 |
| Solve polynomial inequality with interval notation | L07, L11, L14 |
| Determine real vs complex zeros from factor | L08 |
| Simplify (a+bi)^2 | L09 |
| Identify transformations of cubic parent | L12 |
| Error analysis (all types) | L14 |

---

## Display Config

```json
{
  "showGraph": false,
  "graphType": null,
  "infoPanel": [
    { "label": "Level", "value": "{{levelName}}" },
    { "label": "Task", "value": "{{problemText}}" },
    { "label": "Given", "value": "{{givenText}}" }
  ]
}
```
