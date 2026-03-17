# Spec: Standards-Aligned Teaching Directions for Dividing Polynomials

## Goal
Transform the `a2-dividing-polynomials` cartridge from a testing tool into a teaching tool. Each mode's directions should explain the technique, connect to the throughline ("division produces a quotient plus a remainder; when the divisor is (x−a), the remainder is just P(a)"), and preempt common errors.

## Standards Alignment
- **A-APR.D.6**: Rewrite rational expressions as q(x) + r(x)/b(x)
- **A-APR.B.2**: Remainder Theorem and Factor Theorem
- **A-SSE.A.2**: Use structure to rewrite expressions
- **MP.2**: Reason abstractly (remainder = P(a), not just "a number")
- **MP.6**: Precision (signs, alignment, placeholders)
- **MP.7**: Structure (degree alignment, x−a form, quotient-remainder form)

## Completed
- **Task A**: `manifest.json` — Added `{ "label": "Directions", "value": "{{directions}}" }` to infoPanel ✅

## Remaining — Task B: generator.js directions (all 6 modes)

### B1 — remainder-eval
**Standards**: A-APR.B.2, MP.2
**Throughline**: Remainder Theorem — shortcut to the remainder without full division.
**Error preemption**: Sign of a when divisor is (x + k).
```
"By the Remainder Theorem, when you divide P(x) by (x − a), the remainder equals P(a). That means you can find the remainder without doing long division — just substitute a into P(x). Careful: if the divisor is (x + 2), then a = −2, not 2. Plug in, evaluate each term, and combine."
```

### B2 — long-division
**Standards**: A-APR.A.1a, A-APR.D.6, MP.6
**Throughline**: Same structure as whole-number long division — build quotient term by term.
**Error preemption**: Missing-degree placeholders, subtraction sign discipline.
```
"Polynomial long division works just like whole-number long division. Set up the dividend under the bar and the divisor outside. (1) Divide the leading term of the dividend by x to get the first quotient term. (2) Multiply the entire divisor by that term. (3) Subtract — use parentheses and distribute the negative carefully. (4) Bring down the next term and repeat. If any degree is missing in the dividend, insert a 0 placeholder (like + 0x²) to keep terms aligned. The final value after the last subtraction is the remainder."
```

### B3 — remainder-theorem-verify
**Standards**: A-APR.B.2, MP.2, MP.7
**Throughline**: Two methods, one answer — connecting division to evaluation.
**Error preemption**: Sign of a, interpreting the theorem structurally.
```
"Here you'll verify the Remainder Theorem by checking it from both sides. First, divide P(x) by the divisor (using long division or synthetic division) and write down the remainder. Then, evaluate P(a) by substituting a into the polynomial. The Remainder Theorem guarantees these two values are always equal — because if you plug x = a into P(x) = (x − a)·q(x) + r, the (x − a) part vanishes, leaving just r."
```

### B4 — factor-and-quotient
**Standards**: A-APR.B.2, A-SSE.A.2, A-APR.A.1b, MP.7
**Throughline**: Factor Theorem — zero remainder means it's a factor. Divide to reduce, then factor the quotient.
**Error preemption**: Sign handling in (x − root) form.
```
"The Factor Theorem tells us: if (x − a) is a factor, then dividing P(x) by it leaves remainder 0, and the quotient is a simpler polynomial. Divide P(x) by the known factor to get a quadratic. Then factor that quadratic — find two values whose product is the constant term and whose sum is the middle coefficient. Write each factor in (x − root) form. Remember: a root of −3 gives the factor (x + 3)."
```

### B5 — quotient-expression
**Standards**: A-APR.D.6, MP.6
**Throughline**: The full quotient-remainder form q(x) + r/(x − a) — this is what A-APR.D.6 asks for.
**Error preemption**: Don't forget the remainder fraction; keep the sign of r.
```
"When a polynomial doesn't divide evenly, we write the full result as q(x) + r/(x − a). Perform long division to find the quotient q(x) and the remainder r. The quotient is the polynomial you build on top of the division bar. The remainder goes over the divisor as a fraction. This form — quotient plus remainder fraction — is how we rewrite any rational expression with a linear denominator."
```

### B6 — is-it-a-factor
**Standards**: A-APR.B.2, MP.2
**Throughline**: Factor Theorem as a yes/no decision rule.
**Error preemption**: Rewrite divisor as (x − a) to identify the correct a.
```
"The Factor Theorem gives a quick test: (x − a) is a factor of P(x) if and only if P(a) = 0. First, identify a from the divisor — if the divisor is (x + 3), then a = −3. Then evaluate P(a). If the result is 0, the divisor is a factor and divides evenly. If it's anything else, it doesn't."
```

## Dependency Graph
```
Task A (manifest infoPanel) ✅
         │
Task B (generator.js — all 6 modes, single file edit)
         │
    npm test
         │
    git commit + push
```

Tasks A and B edit different files and are independent. B is a single-file edit (6 insertions into generator.js). Tests and commit depend on both completing.
