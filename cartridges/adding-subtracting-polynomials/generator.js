/**
 * Adding & Subtracting Polynomials - generator
 * ES module for LRSL-Driller
 */

// -------------------- Utilities --------------------
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampNonZero(n, fallbackMin = 1, fallbackMax = 6) {
  if (n !== 0) return n;
  return choice([-1, 1]) * randInt(fallbackMin, fallbackMax);
}

function stripZeroTail(coeffsAsc) {
  let i = coeffsAsc.length - 1;
  while (i > 0 && Math.abs(coeffsAsc[i]) < 1e-12) i--;
  return coeffsAsc.slice(0, i + 1);
}

/** Format polynomial from ascending coefficients [c0, c1, c2, ...] */
function formatPoly(coeffsAsc, variable = "x") {
  const deg = coeffsAsc.length - 1;
  const parts = [];

  for (let p = deg; p >= 0; p--) {
    const c = coeffsAsc[p];
    if (Math.abs(c) < 1e-12) continue;

    const sign = c < 0 ? "-" : "+";
    const absC = Math.abs(c);
    let coeffStr = String(absC);
    if (p > 0 && absC === 1) coeffStr = "";

    let term = "";
    if (p === 0) term = `${coeffStr || "1"}`;
    else if (p === 1) term = `${coeffStr}${variable}`;
    else term = `${coeffStr}${variable}^{${p}}`;

    if (parts.length === 0) parts.push(c < 0 ? `-${term}` : `${term}`);
    else parts.push(` ${sign} ${term}`);
  }

  return parts.length ? parts.join("") : "0";
}

/** Generate a random polynomial with given degree and coefficient range */
function randomPoly(degree, coeffMin, coeffMax) {
  const coeffs = [];
  for (let i = 0; i <= degree; i++) {
    let c = randInt(coeffMin, coeffMax);
    if (i === degree) c = clampNonZero(c, 1, Math.max(2, Math.abs(coeffMax)));
    coeffs.push(c);
  }
  return stripZeroTail(coeffs);
}

/** Add two polynomials (ascending coefficients) */
function addPolys(a, b) {
  const maxLen = Math.max(a.length, b.length);
  const result = [];
  for (let i = 0; i < maxLen; i++) result.push((a[i] || 0) + (b[i] || 0));
  return stripZeroTail(result);
}

/** Subtract polynomials: a - b */
function subtractPolys(a, b) {
  const maxLen = Math.max(a.length, b.length);
  const result = [];
  for (let i = 0; i < maxLen; i++) result.push((a[i] || 0) - (b[i] || 0));
  return stripZeroTail(result);
}

/** Create expression string from unsimplified terms like [{c, exp}] */
function formatTermList(terms, variable = "x") {
  const parts = [];
  for (let i = 0; i < terms.length; i++) {
    const { c, exp } = terms[i];
    if (c === 0) continue;
    const sign = c < 0 ? "-" : "+";
    const absC = Math.abs(c);
    let coeffStr = String(absC);
    if (exp > 0 && absC === 1) coeffStr = "";

    let term = "";
    if (exp === 0) term = `${coeffStr || "1"}`;
    else if (exp === 1) term = `${coeffStr}${variable}`;
    else term = `${coeffStr}${variable}^{${exp}}`;

    if (parts.length === 0) parts.push(c < 0 ? `-${term}` : `${term}`);
    else parts.push(` ${sign} ${term}`);
  }
  return parts.length ? parts.join("") : "0";
}

// ---- Two-variable (or multi-variable) polynomial maps for advanced items ----
function monoKeyFromExp(expObj) {
  const vars = Object.keys(expObj).filter((v) => expObj[v] !== 0).sort();
  if (vars.length === 0) return "";
  return vars
    .map((v) => {
      const p = expObj[v];
      return p === 1 ? v : `${v}^${p}`;
    })
    .join("*");
}

function addMap(a, b, scaleB = 1) {
  const out = new Map(a);
  for (const [k, v] of b.entries()) {
    const nv = (out.get(k) || 0) + scaleB * v;
    if (Math.abs(nv) < 1e-12) out.delete(k);
    else out.set(k, nv);
  }
  return out;
}

function mapFromTerms(terms) {
  const m = new Map();
  for (const t of terms) {
    const k = monoKeyFromExp(t.exp);
    const nv = (m.get(k) || 0) + t.c;
    if (Math.abs(nv) < 1e-12) m.delete(k);
    else m.set(k, nv);
  }
  return m;
}

function termSortKey(monoKey) {
  // Sort by total degree desc, then lexicographic
  if (!monoKey) return { deg: 0, key: "" };
  const parts = monoKey.split("*");
  let deg = 0;
  for (const p of parts) {
    const [v, e] = p.split("^");
    deg += e ? Number(e) : 1;
  }
  return { deg, key: monoKey };
}

function formatMapPoly(polyMap) {
  const items = Array.from(polyMap.entries()).filter(([, c]) => Math.abs(c) > 1e-12);
  if (items.length === 0) return "0";

  items.sort((a, b) => {
    const ka = termSortKey(a[0]);
    const kb = termSortKey(b[0]);
    if (ka.deg !== kb.deg) return kb.deg - ka.deg;
    return ka.key < kb.key ? -1 : ka.key > kb.key ? 1 : 0;
  });

  const parts = [];
  for (const [mono, c] of items) {
    const sign = c < 0 ? "-" : "+";
    const absC = Math.abs(c);

    // Build variable part like a^{2}b
    let varPart = "";
    if (mono) {
      varPart = mono
        .split("*")
        .map((p) => {
          const [v, e] = p.split("^");
          if (!e || Number(e) === 1) return v;
          return `${v}^{${Number(e)}}`;
        })
        .join("");
    }

    let coeffStr = String(absC);
    if (varPart && absC === 1) coeffStr = "";
    const term = varPart ? `${coeffStr}${varPart}` : `${coeffStr}`;

    if (parts.length === 0) parts.push(c < 0 ? `-${term}` : `${term}`);
    else parts.push(` ${sign} ${term}`);
  }
  return parts.join("");
}

function randomPolyMap(vars, termCount, coeffMin, coeffMax, maxExp = 3) {
  const terms = [];
  for (let i = 0; i < termCount; i++) {
    const exp = {};
    // pick 1 or 2 variables for the monomial
    const chosenVars = shuffle(vars).slice(0, choice([1, 2]));
    for (const v of chosenVars) exp[v] = randInt(1, maxExp);
    // occasionally make a constant term
    if (Math.random() < 0.2) {
      for (const v of vars) delete exp[v];
    }
    const c = clampNonZero(randInt(coeffMin, coeffMax), 1, Math.max(2, Math.abs(coeffMax)));
    terms.push({ c, exp });
  }
  return mapFromTerms(terms);
}

function makeContextBase(levelName, problemText, givenText = "") {
  return { levelName, problemText, givenText };
}

// -------------------- Level generators --------------------
function genVocabulary() {
  const types = [
    { nTerms: 1, label: "Monomial" },
    { nTerms: 2, label: "Binomial" },
    { nTerms: 3, label: "Trinomial" },
    { nTerms: 4, label: "Polynomial (4+ terms)" }
  ];

  const pick = choice(types);
  const maxExp = 5;
  const exps = shuffle(Array.from({ length: maxExp + 1 }, (_, i) => i)).slice(0, pick.nTerms);
  // Make sure we have at least one variable term (unless monomial could be constant)
  if (pick.nTerms > 1 && exps.every((e) => e === 0)) exps[0] = 1;

  const coeffs = Array(maxExp + 1).fill(0);
  for (const e of exps) coeffs[e] = clampNonZero(randInt(-9, 9), 1, 9);
  const expr = formatPoly(stripZeroTail(coeffs), "x");

  const context = makeContextBase(
    "Level 1: Vocabulary — Classify Expressions",
    `Classify the expression by the number of terms: $${expr}$.`
  );
  const answers = {
    polyType: { value: pick.label }
  };
  context.answers = answers;

  return {
    context,
    answers,
    scenario: "Count terms after the expression is simplified. 1 term = monomial, 2 = binomial, 3 = trinomial, 4 or more = polynomial."
  };
}

function genLikeTerms() {
  const baseVar = choice(["x", "a", "m"]);
  const exp = randInt(1, 5);
  const likeA = `${clampNonZero(randInt(-9, 9), 1, 9)}${baseVar}^{${exp}}`;
  const likeB = `${clampNonZero(randInt(-9, 9), 1, 9)}${baseVar}^{${exp}}`;

  const distractors = [
    // different exponent
    [`${clampNonZero(randInt(-9, 9), 1, 9)}${baseVar}^{${exp}}`, `${clampNonZero(randInt(-9, 9), 1, 9)}${baseVar}^{${exp + 1}}`],
    // different variable
    [`${clampNonZero(randInt(-9, 9), 1, 9)}${baseVar}^{${exp}}`, `${clampNonZero(randInt(-9, 9), 1, 9)}y^{${exp}}`],
    // variable vs constant
    [`${clampNonZero(randInt(-9, 9), 1, 9)}${baseVar}`, `${clampNonZero(randInt(-9, 9), 1, 9)}`]
  ];

  const correct = [`${likeA}`, `${likeB}`];
  const options = shuffle([
    { pair: correct, isCorrect: true },
    { pair: distractors[0], isCorrect: false },
    { pair: distractors[1], isCorrect: false },
    { pair: distractors[2], isCorrect: false }
  ]);

  const letters = ["A", "B", "C", "D"];
  const lines = options
    .map((o, i) => `${letters[i]}: $${o.pair[0]}$ and $${o.pair[1]}$`)
    .join("\n");
  const correctLetter = letters[options.findIndex((o) => o.isCorrect)];

  const context = makeContextBase(
    "Level 2: Identify Like Terms",
    "Which pair are like terms?",
    lines
  );
  const answers = { likeChoice: { value: correctLetter } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario:
      "Like terms have the same variable(s) raised to the same power(s). Coefficients can be different."
  };
}

function genCombineLikeTermsSimple() {
  const exp = randInt(1, 5);
  const coeffs = [clampNonZero(randInt(-9, 9), 1, 9), clampNonZero(randInt(-9, 9), 1, 9), clampNonZero(randInt(-9, 9), 1, 9)];
  const sum = coeffs.reduce((a, b) => a + b, 0);
  if (sum === 0) return genCombineLikeTermsSimple();

  const terms = shuffle(coeffs.map((c) => ({ c, exp })));
  const expr = formatTermList(terms, "x");
  const ansCoeffs = Array(exp + 1).fill(0);
  ansCoeffs[exp] = sum;
  const expected = formatPoly(stripZeroTail(ansCoeffs));

  const context = makeContextBase(
    "Level 3: Combine Like Terms (Simple)",
    `Combine like terms: $${expr}$.`
  );
  const answers = { simplified: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario: "Group the like terms first, then add/subtract the coefficients."
  };
}

function genSimplifyMixed() {
  const maxExp = randInt(3, 5);
  const termCount = randInt(5, 7);
  const terms = [];
  for (let i = 0; i < termCount; i++) {
    const exp = choice([0, 1, 1, 2, 2, 3, 4, maxExp]);
    const c = clampNonZero(randInt(-9, 9), 1, 9);
    terms.push({ c, exp });
  }
  const expr = formatTermList(shuffle(terms), "x");

  const coeffs = Array(maxExp + 1).fill(0);
  for (const t of terms) coeffs[t.exp] += t.c;
  const expected = formatPoly(stripZeroTail(coeffs));

  const context = makeContextBase(
    "Level 4: Simplify a Polynomial (Mixed Like Terms)",
    `Simplify and write in standard form: $${expr}$.`
  );
  const answers = { simplified: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario:
      "Use the Commutative and Associative Properties to regroup like terms, then combine coefficients."
  };
}

function genAddHorizontal() {
  const deg = randInt(2, 4);
  const p = randomPoly(deg, -7, 7);
  const q = randomPoly(deg, -7, 7);
  const sum = addPolys(p, q);

  const P = formatPoly(p);
  const Q = formatPoly(q);
  const expected = formatPoly(sum);

  const context = makeContextBase(
    "Level 5: Add Polynomials (Horizontal)",
    `Simplify: ($${P}$) + ($${Q}$).`
  );
  const answers = { simplified: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario: "Add by combining like terms (same power of $x$)."
  };
}

function genAddVertical() {
  const deg = randInt(3, 5);
  const p = randomPoly(deg, -6, 6);
  const q = randomPoly(deg, -6, 6);
  const sum = addPolys(p, q);

  const P = formatPoly(p);
  const Q = formatPoly(q);
  const expected = formatPoly(sum);

  // Vertical alignment (LaTeX aligned)
  const givenText = `$\\begin{aligned}&${P}\\\\+&${Q}\\end{aligned}$`;

  const context = makeContextBase(
    "Level 6: Add Polynomials (Vertical Alignment)",
    "Add the polynomials and write the result in standard form.",
    givenText
  );
  const answers = { simplified: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario: "Line up powers of $x$ like place values, then add each column."
  };
}

function genSubtractDistribute() {
  const deg = randInt(2, 4);
  const p = randomPoly(deg, -7, 7);
  const q = randomPoly(deg, -7, 7);
  const diff = subtractPolys(p, q);

  const P = formatPoly(p);
  const Q = formatPoly(q);
  const expected = formatPoly(diff);

  const context = makeContextBase(
    "Level 7: Subtract Polynomials (Distribute the Negative)",
    `Simplify: ($${P}$) - ($${Q}$).`
  );
  const answers = { simplified: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario: "Rewrite subtraction as addition of the opposite: distribute the negative to EVERY term in the second polynomial."
  };
}

function genSubtractMixedSigns() {
  const maxDeg = randInt(4, 5);
  const p = Array(maxDeg + 1).fill(0);
  const q = Array(maxDeg + 1).fill(0);

  // Ensure some zeros (missing terms)
  const keepExps = shuffle(Array.from({ length: maxDeg + 1 }, (_, i) => i)).slice(0, randInt(3, maxDeg + 1));
  const keepExps2 = shuffle(Array.from({ length: maxDeg + 1 }, (_, i) => i)).slice(0, randInt(3, maxDeg + 1));
  for (const e of keepExps) p[e] = clampNonZero(randInt(-8, 8), 1, 8);
  for (const e of keepExps2) q[e] = clampNonZero(randInt(-8, 8), 1, 8);
  p[maxDeg] = clampNonZero(p[maxDeg], 1, 8);
  q[maxDeg] = clampNonZero(q[maxDeg], 1, 8);

  const P = formatPoly(stripZeroTail(p));
  const Q = formatPoly(stripZeroTail(q));
  const expected = formatPoly(subtractPolys(p, q));

  const context = makeContextBase(
    "Level 8: Subtract Polynomials (Mixed Signs & Missing Terms)",
    `Simplify: $${P} - (${Q})$. Write your answer in standard form.`
  );
  const answers = { simplified: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario:
      "Careful with signs! Subtracting a negative means adding. If a term is missing, its coefficient is 0."
  };
}

function genThreePolysTwoVars() {
  const vars = choice([
    ["a", "b"],
    ["m", "n"],
    ["x", "y"]
  ]);

  const A = randomPolyMap(vars, randInt(3, 5), -6, 6, 3);
  const B = randomPolyMap(vars, randInt(3, 5), -6, 6, 3);
  const C = randomPolyMap(vars, randInt(3, 5), -6, 6, 3);

  const exprA = formatMapPoly(A);
  const exprB = formatMapPoly(B);
  const exprC = formatMapPoly(C);

  // Random combination: A + B - C OR A - B + C
  const pattern = choice(["A+B-C", "A-B+C"]);
  let result;
  let problemExpr;
  if (pattern === "A+B-C") {
    result = addMap(addMap(A, B), C, -1);
    problemExpr = `($${exprA}$) + ($${exprB}$) - ($${exprC}$)`;
  } else {
    result = addMap(addMap(A, B, -1), C);
    problemExpr = `($${exprA}$) - ($${exprB}$) + ($${exprC}$)`;
  }

  const expected = formatMapPoly(result);
  const context = makeContextBase(
    "Level 9: Add/Subtract 3 Polynomials (Multiple Variables)",
    `Simplify: ${problemExpr}. Write your answer in standard form (no parentheses).`
  );
  const answers = { simplified: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario:
      "Combine only like terms: the variable letters AND their exponents must match exactly."
  };
}

function genSetSLinear() {
  const a = clampNonZero(randInt(-9, 9), 1, 9);
  const b = randInt(-12, 12);
  const c = clampNonZero(randInt(-9, 9), 1, 9);
  const d = randInt(-12, 12);

  const sumA = a + c;
  const sumB = b + d;
  const expectedCoeffs = [sumB, sumA];
  const expectedSum = formatPoly(stripZeroTail(expectedCoeffs));

  const expr1 = `${formatPoly([b, a])}`;
  const expr2 = `${formatPoly([d, c])}`;

  const context = makeContextBase(
    "Level 10: Linear Set S (Leading Coefficient & Constant)",
    `Let $S$ be the set of expressions that can be written as $ax+b$. Simplify: ($${expr1}$) + ($${expr2}$). Then answer the questions below.`
  );

  const answers = {
    sumExpr: { value: expectedSum },
    leadingCoeff: { value: sumA, tolerance: 0 },
    constantTerm: { value: sumB, tolerance: 0 },
    inS: { value: "Yes" }
  };
  context.answers = answers;

  return {
    context,
    answers,
    scenario:
      "After you simplify, the leading coefficient is the coefficient of the highest-power term (here, the $x$ term). The constant term is the number term."
  };
}

function genFunctionOp() {
  const degF = choice([2, 3]);
  const degG = choice([1, 2]);
  const f = randomPoly(degF, -6, 6);
  const g = randomPoly(degG, -6, 6);
  const op = choice(["+", "-"]);

  const fStr = formatPoly(f);
  const gStr = formatPoly(g);
  const expected = formatPoly(op === "+" ? addPolys(f, g) : subtractPolys(f, g));

  const context = makeContextBase(
    "Level 11: Function Notation (f ± g)",
    `Given $f(x) = ${fStr}$ and $g(x) = ${gStr}$, find $(f ${op} g)(x)$. Write in standard form.`
  );
  const answers = { result: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario:
      "Add/subtract functions by adding/subtracting their outputs: $(f ± g)(x) = f(x) ± g(x)$. Then combine like terms."
  };
}

function genPerimeter() {
  const degL = randInt(1, 3);
  const degW = randInt(1, 3);
  const L = randomPoly(degL, -5, 8);
  const W = randomPoly(degW, -5, 8);

  // P = 2L + 2W
  const twoL = L.map((c) => 2 * c);
  const twoW = W.map((c) => 2 * c);
  const P = addPolys(twoL, twoW);

  const Ls = formatPoly(L);
  const Ws = formatPoly(W);
  const expected = formatPoly(P);

  const context = makeContextBase(
    "Level 12: Application — Perimeter",
    "A rectangle has length $L(x)$ and width $W(x)$. Write the perimeter $P(x)=2L(x)+2W(x)$ in standard form.",
    `Length: $L(x) = ${Ls}$\nWidth: $W(x) = ${Ws}$`
  );
  const answers = { perimeter: { value: expected } };
  context.answers = answers;
  return {
    context,
    answers,
    scenario:
      "First distribute the 2: $2L(x)$ and $2W(x)$. Then add and combine like terms."
  };
}

function genProfit() {
  // v(x) = p - qx (price), c(x)=mx + b (cost)
  const p = randInt(30, 65);
  const q = randInt(1, 4);
  const m = randInt(5, 18);
  const b = randInt(25, 90);

  // R(x) = (p - qx)x = px - qx^2
  // P(x) = R(x) - (mx + b) = -q x^2 + (p-m)x - b
  const coeffs = [-b, p - m, -q];
  const expected = formatPoly(stripZeroTail(coeffs));

  const yInt = -b;

  const context = makeContextBase(
    "Level 13: Application — Profit = Revenue − Cost",
    "A seller's price per item depends on how many are made. Revenue is (price)·(quantity). Profit is revenue minus cost. Simplify the profit function.",
    `Price: $v(x) = ${p} - ${q}x$\nCost: $c(x) = ${m}x + ${b}$\nProfit: $P(x) = v(x)x - c(x)$`
  );

  const answers = {
    profit: { value: expected },
    yIntercept: { value: yInt, tolerance: 0 }
  };
  context.answers = answers;
  return {
    context,
    answers,
    scenario:
      "Compute $P(x)=(p-qx)x-(mx+b)$. Use the Distributive Property, then distribute the negative sign on subtraction. The y-intercept is $P(0)$."
  };
}

function genErrorAnalysis() {
  const deg = randInt(2, 3);
  const A = randomPoly(deg, -6, 6);
  const B = randomPoly(deg, -6, 6);

  const aStr = formatPoly(A);
  const bStr = formatPoly(B);
  const correct = formatPoly(subtractPolys(A, B));

  // Common mistake: only distribute the negative to the first term of B.
  // We'll compute the wrong result by flipping sign of ONLY highest-degree term in B.
  const Bwrong = B.slice();
  Bwrong[Bwrong.length - 1] = -Bwrong[Bwrong.length - 1];
  const wrong = formatPoly(addPolys(A, Bwrong));

  // Build choices
  const choices = shuffle([
    { label: "A", text: "Didn't distribute the negative to all terms", correct: true },
    { label: "B", text: "Combined unlike terms", correct: false },
    { label: "C", text: "Added instead of subtracting", correct: false },
    { label: "D", text: "Arithmetic mistake when combining coefficients", correct: false }
  ]);
  const correctLetter = choices.find((c) => c.correct).label;

  const givenText = `Problem: $(${aStr}) - (${bStr})$\nStudent answer: $${wrong}$\nCorrect answer: $${correct}$\n\nChoices:\n${choices.map((c) => `${c.label}: ${c.text}`).join("\n")}`;

  const context = makeContextBase(
    "Level 14: Error Analysis (Critique the Reasoning)",
    "A student made an error while subtracting polynomials. Which statement best describes the mistake?",
    givenText
  );

  const answers = { errorChoice: { value: correctLetter } };
  context.answers = answers;

  return {
    context,
    answers,
    scenario:
      "When subtracting polynomials, distribute the negative sign to EVERY term in the parentheses before combining like terms."
  };
}

function genClosureAndNumbers() {
  const trueStatements = shuffle([
    {
      label: "A",
      text: "Whole numbers are closed under subtraction.",
      correct: false
    },
    {
      label: "B",
      text: "If two polynomials are added or subtracted, the result is still a polynomial.",
      correct: true
    },
    {
      label: "C",
      text: "The product of any two expressions of the form $ax+b$ is always another expression of the form $ax+b$.",
      correct: false
    },
    {
      label: "D",
      text: "You can combine any terms as long as they both have a variable.",
      correct: false
    }
  ]);
  const correctLetter = trueStatements.find((s) => s.correct).label;

  const irrOpts = shuffle([
    {
      label: "A",
      text: "Rational, because adding polynomials always keeps coefficients rational.",
      correct: false
    },
    {
      label: "B",
      text: "Irrational, because a nonzero rational plus an irrational is irrational.",
      correct: true
    },
    {
      label: "C",
      text: "Always 0.",
      correct: false
    },
    {
      label: "D",
      text: "It depends on the degree of the polynomial.",
      correct: false
    }
  ]);
  const irrCorrect = irrOpts.find((o) => o.correct).label;

  const givenText = `Q1: Choose the TRUE statement.\n${trueStatements.map((s) => `${s.label}: ${s.text}`).join("\n")}\n\nQ2: If $r$ is rational and $r ≠ 0$, what type of number is $r + √2$?\n${irrOpts.map((s) => `${s.label}: ${s.text}`).join("\n")}`;

  const context = makeContextBase(
    "Level 15: Closure & Number Structure (Capstone)",
    "Answer both conceptual questions.",
    givenText
  );
  const answers = {
    trueStatement: { value: correctLetter },
    irrChoice: { value: irrCorrect }
  };
  context.answers = answers;

  return {
    context,
    answers,
    scenario:
      "Polynomials are closed under addition/subtraction because you only combine coefficients and keep exponents. Also remember: rational + irrational is irrational."
  };
}

// -------------------- Main entry --------------------
export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  const pack = (obj) => {
    context = obj.context;
    answers = obj.answers;
    scenario = obj.scenario;
    return { context, graphConfig, answers, scenario };
  };

  switch (modeId) {
    case "l01-vocabulary":
      return pack(genVocabulary());
    case "l02-like-terms":
      return pack(genLikeTerms());
    case "l03-combine-like-terms":
      return pack(genCombineLikeTermsSimple());
    case "l04-simplify-polynomial":
      return pack(genSimplifyMixed());
    case "l05-add-horizontal":
      return pack(genAddHorizontal());
    case "l06-add-vertical":
      return pack(genAddVertical());
    case "l07-subtract-distribute":
      return pack(genSubtractDistribute());
    case "l08-subtract-mixed":
      return pack(genSubtractMixedSigns());
    case "l09-three-polys":
      return pack(genThreePolysTwoVars());
    case "l10-linear-set-s":
      return pack(genSetSLinear());
    case "l11-function-ops":
      return pack(genFunctionOp());
    case "l12-perimeter":
      return pack(genPerimeter());
    case "l13-profit":
      return pack(genProfit());
    case "l14-error-analysis":
      return pack(genErrorAnalysis());
    case "l15-closure-and-numbers":
      return pack(genClosureAndNumbers());
    default: {
      // Safe fallback: generate a basic add-horizontal problem
      return pack(genAddHorizontal());
    }
  }
}

export default { generateProblem };
