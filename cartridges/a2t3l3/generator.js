// generator.js — Polynomial Identities & Binomial Theorem
// Cartridge: a2t3l3
//
// Level-to-standards mapping (high-level):
// L1 (Identify structure): A-SSE.A.2, MP.7
// L2 (Rewrite using identities): A-APR.A.1b, A-APR.C.4
// L3 (Numeric relationships): A-APR.C.4, MP.2
// L4 (Factor + complex extension): A-APR.C.4, N-CN.C.8
// L5 (Pascal/binomial coefficients): A-APR.C.5
// L6 (Term-finding + error analysis): A-APR.C.5, MP.3

// ============ UTILITY FUNCTIONS ============

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function nCk(n, k) {
  // Safe small-number binomial coefficient (n <= 12 here)
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= (n - (k - i));
    den *= i;
  }
  return Math.round(num / den);
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ============ SHUFFLE BAG SYSTEM ============
const shuffleBags = {};

function drawFromBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName].pop();
}

// ============ SCENARIO BANKS ============

// -------- Level 1: Identify the identity from structure --------
const level1Scenarios = [
  { expr: "25x^2 − 36y^2", identity: "Difference of Squares", why: "Looks like a^2 − b^2." },
  { expr: "(3x + 4y)^2", identity: "Square of a Sum", why: "A binomial squared: (a+b)^2." },
  { expr: "8m^3 − 27", identity: "Difference of Cubes", why: "Looks like a^3 − b^3." },
  { expr: "g^3 + 64h^3", identity: "Sum of Cubes", why: "Looks like a^3 + b^3." },
  { expr: "49a^2 − 9b^2", identity: "Difference of Squares", why: "Perfect squares subtracted." },
  { expr: "(2p + 5)^2", identity: "Square of a Sum", why: "Binomial squared." },
  { expr: "125t^3 + 8", identity: "Sum of Cubes", why: "5^3 t^3 + 2^3." },
  { expr: "27r^3 − 64s^3", identity: "Difference of Cubes", why: "3^3 r^3 − 4^3 s^3." },
  { expr: "(x + 5)^2", identity: "Square of a Sum", why: "Binomial squared." },
  { expr: "16u^2 − v^2", identity: "Difference of Squares", why: "(4u)^2 − v^2." },
  { expr: "x^3 − 216", identity: "Difference of Cubes", why: "x^3 − 6^3." },
  { expr: "8c^3 + d^3", identity: "Sum of Cubes", why: "(2c)^3 + d^3." }
];

// -------- Level 1b: Identity Flashcards (pure memorization) --------
// Two question types: name→formula and formula→name
const level1bScenarios = [
  // Name → Formula (type: "n2f")
  {
    type: "n2f",
    identity: "Difference of Squares",
    prompt: "What is the formula for Difference of Squares?",
    correct: "a² − b² = (a + b)(a − b)",
    wrong: [
      "a² − b² = (a − b)(a − b)",
      "a² − b² = (a + b)(a + b)",
      "a² + b² = (a + b)(a − b)"
    ]
  },
  {
    type: "n2f",
    identity: "Square of a Sum",
    prompt: "What is the formula for Square of a Sum?",
    correct: "(a + b)² = a² + 2ab + b²",
    wrong: [
      "(a + b)² = a² + ab + b²",
      "(a + b)² = a² + b²",
      "(a + b)² = a² − 2ab + b²"
    ]
  },
  {
    type: "n2f",
    identity: "Square of a Difference",
    prompt: "What is the formula for Square of a Difference?",
    correct: "(a − b)² = a² − 2ab + b²",
    wrong: [
      "(a − b)² = a² + 2ab + b²",
      "(a − b)² = a² − ab + b²",
      "(a − b)² = a² − b²"
    ]
  },
  {
    type: "n2f",
    identity: "Sum of Cubes",
    prompt: "What is the formula for Sum of Cubes?",
    correct: "a³ + b³ = (a + b)(a² − ab + b²)",
    wrong: [
      "a³ + b³ = (a + b)(a² + ab + b²)",
      "a³ + b³ = (a − b)(a² − ab + b²)",
      "a³ + b³ = (a + b)³"
    ]
  },
  {
    type: "n2f",
    identity: "Difference of Cubes",
    prompt: "What is the formula for Difference of Cubes?",
    correct: "a³ − b³ = (a − b)(a² + ab + b²)",
    wrong: [
      "a³ − b³ = (a − b)(a² − ab + b²)",
      "a³ − b³ = (a + b)(a² + ab + b²)",
      "a³ − b³ = (a − b)³"
    ]
  },
  // Formula → Name (type: "f2n")
  {
    type: "f2n",
    formula: "a² − b² = (a + b)(a − b)",
    prompt: "Which identity is this: a² − b² = (a + b)(a − b)?",
    correct: "Difference of Squares",
    wrong: ["Sum of Squares", "Square of a Difference", "Difference of Cubes"]
  },
  {
    type: "f2n",
    formula: "(a + b)² = a² + 2ab + b²",
    prompt: "Which identity is this: (a + b)² = a² + 2ab + b²?",
    correct: "Square of a Sum",
    wrong: ["Square of a Difference", "Difference of Squares", "Sum of Cubes"]
  },
  {
    type: "f2n",
    formula: "(a − b)² = a² − 2ab + b²",
    prompt: "Which identity is this: (a − b)² = a² − 2ab + b²?",
    correct: "Square of a Difference",
    wrong: ["Square of a Sum", "Difference of Squares", "Difference of Cubes"]
  },
  {
    type: "f2n",
    formula: "a³ + b³ = (a + b)(a² − ab + b²)",
    prompt: "Which identity is this: a³ + b³ = (a + b)(a² − ab + b²)?",
    correct: "Sum of Cubes",
    wrong: ["Difference of Cubes", "Square of a Sum", "Sum of Squares"]
  },
  {
    type: "f2n",
    formula: "a³ − b³ = (a − b)(a² + ab + b²)",
    prompt: "Which identity is this: a³ − b³ = (a − b)(a² + ab + b²)?",
    correct: "Difference of Cubes",
    wrong: ["Sum of Cubes", "Difference of Squares", "Square of a Difference"]
  },
  // "What's the middle term sign?" questions (common error focus)
  {
    type: "sign",
    prompt: "In (a + b)², what is the sign of the middle term (2ab)?",
    correct: "Positive (+)",
    wrong: ["Negative (−)", "Zero (no middle term)", "Depends on a and b"]
  },
  {
    type: "sign",
    prompt: "In (a − b)², what is the sign of the middle term?",
    correct: "Negative (−2ab)",
    wrong: ["Positive (+2ab)", "Zero (no middle term)", "Depends on a and b"]
  },
  {
    type: "sign",
    prompt: "In a³ + b³ = (a + b)(a² __ ab + b²), what goes in the blank?",
    correct: "Minus (−)",
    wrong: ["Plus (+)", "Nothing (no ab term)", "Times (×)"]
  },
  {
    type: "sign",
    prompt: "In a³ − b³ = (a − b)(a² __ ab + b²), what goes in the blank?",
    correct: "Plus (+)",
    wrong: ["Minus (−)", "Nothing (no ab term)", "Times (×)"]
  }
];

// -------- Level 2: Choose the correct rewrite (factor/expand) --------
const level2Scenarios = [
  {
    expr: "25x^2 − 36y^2",
    task: "Factor using an identity.",
    correct: "(5x + 6y)(5x − 6y)",
    wrong: [
      "(5x − 6y)(5x − 6y)",
      "(25x^2 + 36y^2)",
      "(5x + 6y)(5x + 6y)"
    ],
    expectedReasoning: "This matches a^2 − b^2 = (a+b)(a−b) with a=5x and b=6y."
  },
  {
    expr: "(3x + 4y)^2",
    task: "Expand using an identity.",
    correct: "9x^2 + 24xy + 16y^2",
    wrong: [
      "9x^2 + 16y^2",
      "9x^2 + 12xy + 16y^2",
      "9x^2 − 24xy + 16y^2"
    ],
    expectedReasoning: "Use (a+b)^2 = a^2 + 2ab + b^2 with a=3x and b=4y."
  },
  {
    expr: "8m^3 − 27",
    task: "Factor using an identity.",
    correct: "(2m − 3)(4m^2 + 6m + 9)",
    wrong: [
      "(2m − 3)(4m^2 − 6m + 9)",
      "(2m + 3)(4m^2 − 6m + 9)",
      "(2m − 3)^3"
    ],
    expectedReasoning: "Use a^3 − b^3 = (a−b)(a^2+ab+b^2) with a=2m, b=3."
  },
  {
    expr: "g^3 + 64h^3",
    task: "Factor using an identity.",
    correct: "(g + 4h)(g^2 − 4gh + 16h^2)",
    wrong: [
      "(g + 4h)(g^2 + 4gh + 16h^2)",
      "(g − 4h)(g^2 − 4gh + 16h^2)",
      "(g + 4h)^3"
    ],
    expectedReasoning: "Use a^3 + b^3 = (a+b)(a^2−ab+b^2) with a=g, b=4h."
  },
  {
    expr: "(2x^2 + y^3)^2",
    task: "Expand using an identity.",
    correct: "4x^4 + 4x^2y^3 + y^6",
    wrong: [
      "4x^4 + y^6",
      "4x^4 + 2x^2y^3 + y^6",
      "4x^4 − 4x^2y^3 + y^6"
    ],
    expectedReasoning: "Use (a+b)^2 = a^2 + 2ab + b^2 with a=2x^2 and b=y^3."
  },
  {
    expr: "x^3 − 216",
    task: "Factor using an identity.",
    correct: "(x − 6)(x^2 + 6x + 36)",
    wrong: [
      "(x − 6)(x^2 − 6x + 36)",
      "(x + 6)(x^2 − 6x + 36)",
      "(x − 6)^3"
    ],
    expectedReasoning: "Use a^3 − b^3 with a=x and b=6."
  },
  {
    expr: "(40 + 1)(40 − 1)",
    task: "Rewrite using an identity (then evaluate in the next level).",
    correct: "40^2 − 1^2",
    wrong: [
      "40^2 + 1^2",
      "40^2 − 1",
      "41^2 − 39^2"
    ],
    expectedReasoning: "Use (a+b)(a−b)=a^2−b^2 with a=40, b=1."
  },
  {
    expr: "(2u + 3)(2u − 3)",
    task: "Rewrite using an identity.",
    correct: "4u^2 − 9",
    wrong: [
      "4u^2 + 9",
      "(2u − 3)^2",
      "2u^2 − 3"
    ],
    expectedReasoning: "Use (a+b)(a−b)=a^2−b^2 with a=2u, b=3."
  }
];

// -------- Level 3: Numeric shortcuts using identities --------
// Design principle: Only use bases whose squares students know (10, 20, 30, 50, 100)
// and small offsets (±1 or ±2) so the identity technique is obviously faster.
const level3Scenarios = [
  // ±1 from easy bases (trivial mental subtraction)
  { expr: "9 × 11", answer: 99, expectedReasoning: "Rewrite as (10−1)(10+1)=10²−1²=100−1=99." },
  { expr: "19 × 21", answer: 399, expectedReasoning: "Rewrite as (20−1)(20+1)=20²−1²=400−1=399." },
  { expr: "29 × 31", answer: 899, expectedReasoning: "Rewrite as (30−1)(30+1)=30²−1²=900−1=899." },
  { expr: "39 × 41", answer: 1599, expectedReasoning: "Rewrite as (40−1)(40+1)=40²−1²=1600−1=1599." },
  { expr: "49 × 51", answer: 2499, expectedReasoning: "Rewrite as (50−1)(50+1)=50²−1²=2500−1=2499." },
  { expr: "99 × 101", answer: 9999, expectedReasoning: "Rewrite as (100−1)(100+1)=100²−1²=10000−1=9999." },
  { expr: "199 × 201", answer: 39999, expectedReasoning: "Rewrite as (200−1)(200+1)=200²−1²=40000−1=39999." },
  // ±2 from easy bases (subtract 4)
  { expr: "48 × 52", answer: 2496, expectedReasoning: "Rewrite as (50−2)(50+2)=50²−2²=2500−4=2496." },
  { expr: "98 × 102", answer: 9996, expectedReasoning: "Rewrite as (100−2)(100+2)=100²−2²=10000−4=9996." },
  { expr: "18 × 22", answer: 396, expectedReasoning: "Rewrite as (20−2)(20+2)=20²−2²=400−4=396." },
  // Perfect square shortcuts (a+b)² or (a−b)²
  { expr: "21²", answer: 441, expectedReasoning: "(20+1)²=20²+2(20)(1)+1²=400+40+1=441." },
  { expr: "31²", answer: 961, expectedReasoning: "(30+1)²=30²+2(30)(1)+1²=900+60+1=961." },
  { expr: "19²", answer: 361, expectedReasoning: "(20−1)²=20²−2(20)(1)+1²=400−40+1=361." }
];

// -------- Level 4: Factor polynomials (include complex numbers case) --------
// We store required/forbidden tokens so grading can be tolerant to order/spacing.
const level4Scenarios = [
  {
    expr: "9m^4 − 25n^6",
    expected: "(3m^2 + 5n^3)(3m^2 − 5n^3)",
    requiredTokens: ["3m^2+5n^3", "3m^2-5n^3"],
    forbiddenTokens: [],
    identity: "Difference of Squares",
    expectedReasoning: "Both terms are perfect squares: (3m^2)^2 − (5n^3)^2."
  },
  {
    expr: "x^3 − 216",
    expected: "(x − 6)(x^2 + 6x + 36)",
    requiredTokens: ["x-6", "x^2", "6x", "36"],
    forbiddenTokens: ["x+6", "x^2-6x", "-6x"],
    identity: "Difference of Cubes",
    expectedReasoning: "This is a^3 − b^3 with a=x and b=6."
  },
  {
    expr: "8x^6 − 27y^3",
    expected: "(2x^2 − 3y)(4x^4 + 6x^2y + 9y^2)",
    requiredTokens: ["2x^2-3y", "4x^4", "6x^2y", "9y^2"],
    forbiddenTokens: ["2x^2+3y", "-6x^2y"],
    identity: "Difference of Cubes",
    expectedReasoning: "This is (2x^2)^3 − (3y)^3."
  },
  {
    expr: "g^3 + 64h^3",
    expected: "(g + 4h)(g^2 − 4gh + 16h^2)",
    requiredTokens: ["g+4h", "g^2", "-4gh", "16h^2"],
    forbiddenTokens: ["g-4h", "+4gh"],
    identity: "Sum of Cubes",
    expectedReasoning: "This is a^3 + b^3 with a=g and b=4h."
  },
  {
    expr: "4p^2 − 81",
    expected: "(2p + 9)(2p − 9)",
    requiredTokens: ["2p+9", "2p-9"],
    forbiddenTokens: [],
    identity: "Difference of Squares",
    expectedReasoning: "This is (2p)^2 − 9^2."
  },
  {
    expr: "64 − 9t^2",
    expected: "(8 + 3t)(8 − 3t)",
    requiredTokens: ["8+3t", "8-3t"],
    forbiddenTokens: [],
    identity: "Difference of Squares",
    expectedReasoning: "This is 8^2 − (3t)^2."
  },
  {
    expr: "125a^3 − 8b^3",
    expected: "(5a − 2b)(25a^2 + 10ab + 4b^2)",
    requiredTokens: ["5a-2b", "25a^2", "10ab", "4b^2"],
    forbiddenTokens: ["5a+2b", "-10ab"],
    identity: "Difference of Cubes",
    expectedReasoning: "This is (5a)^3 − (2b)^3."
  },
  {
    expr: "8u^3 + 27",
    expected: "(2u + 3)(4u^2 − 6u + 9)",
    requiredTokens: ["2u+3", "4u^2", "-6u", "9"],
    forbiddenTokens: ["2u-3", "+6u"],
    identity: "Sum of Cubes",
    expectedReasoning: "This is (2u)^3 + 3^3."
  },
  {
    expr: "27x^9 − 343y^6",
    expected: "(3x^3 − 7y^2)(9x^6 + 21x^3y^2 + 49y^4)",
    requiredTokens: ["3x^3-7y^2", "9x^6", "21x^3y^2", "49y^4"],
    forbiddenTokens: ["3x^3+7y^2", "-21x^3y^2"],
    identity: "Difference of Cubes",
    expectedReasoning: "This is (3x^3)^3 − (7y^2)^3."
  },
  {
    expr: "16g^8 + 49  (factor over complex numbers)",
    expected: "(4g^4 + 7i)(4g^4 − 7i)",
    requiredTokens: ["4g^4+7i", "4g^4-7i"],
    forbiddenTokens: ["4g^4+7", "4g^4-7"],
    identity: "Difference of Squares (complex extension)",
    expectedReasoning: "Rewrite as (4g^4)^2 − (7i)^2 so you can factor."
  }
];

// -------- Level 5: Pascal’s Triangle patterns + binomial coefficients --------
const level5Scenarios = [
  // Missing entry (adjacent sum)
  {
    type: "missing",
    prompt: "Row 4 is: 1, 4, __, 4, 1. What is the missing number?",
    value: 6,
    keywords: ["sum", "add", "above", "adjacent", "pascal", "triangle"],
    expectedReasoning: "In Pascal’s Triangle each interior value is the sum of the two values above: 3+3=6."
  },
  {
    type: "missing",
    prompt: "Row 5 is: 1, 5, 10, __, 5, 1. What is the missing number?",
    value: 10,
    keywords: ["sum", "add", "above", "adjacent", "pascal", "triangle"],
    expectedReasoning: "The missing value is 10 because it’s 6+4 from the row above."
  },
  {
    type: "missing",
    prompt: "Row 6 is: 1, 6, 15, __, 15, 6, 1. What is the missing number?",
    value: 20,
    keywords: ["sum", "add", "above", "adjacent", "pascal", "triangle"],
    expectedReasoning: "The middle value is 20 because it’s 10+10 from the row above."
  },
  // Row sum pattern: sum(Row n) = 2^n (using row indexing where Row 0 = 1)
  {
    type: "rowsum",
    n: 6,
    prompt: "What is the sum of the numbers in Row 6 of Pascal’s Triangle?",
    value: 64,
    keywords: ["2^", "power", "doubl", "row sum", "sum", "pascal", "triangle"],
    expectedReasoning: "Row sums double each row, so sum(Row n)=2^n. For n=6, 2^6=64."
  },
  {
    type: "rowsum",
    n: 7,
    prompt: "What is the sum of the numbers in Row 7 of Pascal’s Triangle?",
    value: 128,
    keywords: ["2^", "power", "doubl", "row sum", "sum", "pascal", "triangle"],
    expectedReasoning: "Sum(Row n)=2^n. For n=7, 2^7=128."
  },
  {
    type: "rowsum",
    n: 8,
    prompt: "What is the sum of the numbers in Row 8 of Pascal’s Triangle?",
    value: 256,
    keywords: ["2^", "power", "doubl", "row sum", "sum", "pascal", "triangle"],
    expectedReasoning: "Sum(Row n)=2^n. For n=8, 2^8=256."
  }
];

// Add binomial-coefficient scenarios dynamically for variety
const binomPairs = [
  { n: 5, k: 2 },
  { n: 6, k: 3 },
  { n: 7, k: 2 },
  { n: 7, k: 4 },
  { n: 8, k: 3 },
  { n: 8, k: 5 }
];

const varPairs = [
  ["x", "y"],
  ["a", "b"],
  ["m", "n"],
  ["g", "h"],
  ["p", "q"],
  ["s", "t"]
];

function buildBinomScenario(pair) {
  const [v1, v2] = choice(varPairs);
  const n = pair.n;
  const k = pair.k;
  const coeff = nCk(n, k);
  const p1 = n - k;
  const p2 = k;
  return {
    type: "binom",
    n,
    k,
    v1,
    v2,
    prompt: `In (${v1} + ${v2})^${n}, what is the coefficient of ${v1}^${p1}${v2}^${p2}?`,
    value: coeff,
    keywords: ["choose", "c(", "combination", "pascal", "triangle", "row", "binomial"],
    expectedReasoning: `The coefficient is C(${n},${k}) from Row ${n} of Pascal’s Triangle (or n choose k).`
  };
}

// -------- Level 6: Binomial term finder (error analysis) --------
const level6Scenarios = [
  // These are designed so the *common error* is forgetting the binomial coefficient C(n,k).
  { n: 4, p: 2, q: 3, var1: "g", var2: "h", termIndex: 3 },
  { n: 5, p: 3, q: 2, var1: "x", var2: "y", termIndex: 3 },
  { n: 6, p: 2, q: 4, var1: "m", var2: "n", termIndex: 4 },
  { n: 5, p: 4, q: 1, var1: "p", var2: "q", termIndex: 4 },
  { n: 6, p: 3, q: 2, var1: "a", var2: "b", termIndex: 3 },
  { n: 4, p: 5, q: 2, var1: "s", var2: "t", termIndex: 4 },
  { n: 5, p: 2, q: 5, var1: "u", var2: "v", termIndex: 3 },
  { n: 6, p: 2, q: 3, var1: "c", var2: "d", termIndex: 3 }
];

function buildLevel6(s) {
  const n = s.n;
  const termIndex = s.termIndex; // 1-based term number from left
  const k = termIndex - 1; // power on (q*var2)
  const exp1 = n - k;
  const exp2 = k;
  const binom = nCk(n, k);
  const correctCoeff = binom * Math.pow(s.p, exp1) * Math.pow(s.q, exp2);

  // Common error: forget the binomial coefficient
  const wrongCoeff = Math.pow(s.p, exp1) * Math.pow(s.q, exp2);

  const wrongTerm = `${wrongCoeff}${s.var1}^${exp1}${s.var2}^${exp2}`;
  const correctTerm = `${correctCoeff}${s.var1}^${exp1}${s.var2}^${exp2}`;

  return {
    ...s,
    k,
    exp1,
    exp2,
    binom,
    wrongCoeff,
    correctCoeff,
    wrongTerm,
    correctTerm,
    expectedReasoning: `You must multiply by the binomial coefficient C(${n},${k}) (from Pascal’s Triangle). Exponents follow the pattern: ${s.var1} exponent goes down, ${s.var2} exponent goes up, and they add to ${n}.`
  };
}

// ============ MAIN GENERATOR FUNCTION ============

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // -------- Level 1 --------
  if (modeId === "l01-identity-match") {
    const scen = drawFromBag("l1", level1Scenarios);

    context = {
      levelName: "Level 1",
      problemText: "Identify which identity matches the structure.",
      givenText: `Expression: ${scen.expr}`,
      expression: scen.expr,
      expectedReasoning: scen.why
    };

    answers = {
      identityName: { value: scen.identity }
    };

    // Helpful for graders that look for answers on context
    context.answers = answers;

    scenario = `Which identity matches ${scen.expr}?`;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 1b: Flashcards --------
  if (modeId === "l01b-identity-flashcards") {
    const scen = drawFromBag("l1b", level1bScenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    context = {
      levelName: "Level 1b",
      problemText: "Recall the polynomial identity.",
      givenText: scen.prompt,
      flashcardType: scen.type,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };

    answers = {
      flashcardAnswer: { value: scen.correct }
    };

    context.answers = answers;

    scenario = scen.prompt;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 2 --------
  if (modeId === "l02-rewrite-choice") {
    const scen = drawFromBag("l2", level2Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    context = {
      levelName: "Level 2",
      problemText: scen.task,
      givenText: `Expression: ${scen.expr}`,
      expression: scen.expr,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      expectedReasoning: scen.expectedReasoning
    };

    answers = {
      rewriteChoice: { value: scen.correct }
    };

    context.answers = answers;

    scenario = `${scen.task}\n${scen.expr}`;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 3 --------
  if (modeId === "l03-numeric-shortcuts") {
    const scen = drawFromBag("l3", level3Scenarios);

    context = {
      levelName: "Level 3",
      problemText: "Compute using an identity (avoid long multiplication if possible).",
      givenText: `Compute: ${scen.expr}`,
      expression: scen.expr,
      expectedReasoning: scen.expectedReasoning
    };

    answers = {
      numericResult: { value: scen.answer, tolerance: 0 }
    };

    context.answers = answers;

    scenario = `Compute ${scen.expr}`;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 4 --------
  if (modeId === "l04-factor-polynomials") {
    const scen = drawFromBag("l4", level4Scenarios);

    context = {
      levelName: "Level 4",
      problemText: "Factor using a polynomial identity (factor over complex numbers if needed).",
      givenText: `Factor: ${scen.expr}`,
      expression: scen.expr,
      identity: scen.identity,
      factorRequiredTokens: scen.requiredTokens,
      factorForbiddenTokens: scen.forbiddenTokens,
      expectedReasoning: scen.expectedReasoning
    };

    answers = {
      factorAnswer: { value: scen.expected }
    };

    context.answers = answers;

    scenario = `Factor: ${scen.expr}`;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 5 --------
  if (modeId === "l05-pascal-patterns") {
    // Build a mixed bank: fixed Pascal pattern tasks + binomial coefficient tasks
    const bank = level5Scenarios.concat(binomPairs.map(buildBinomScenario));
    const scen = drawFromBag("l5", bank);

    context = {
      levelName: "Level 5",
      problemText: "Use Pascal’s Triangle patterns or binomial coefficients.",
      givenText: scen.prompt,
      pascalType: scen.type,
      pascalKeywords: scen.keywords,
      expectedReasoning: scen.expectedReasoning
    };

    // Include some variables for nicer hint interpolation when type=binom
    if (scen.type === "binom") {
      context.n = scen.n;
      context.k = scen.k;
      context.var1 = scen.v1;
      context.var2 = scen.v2;
    }
    if (scen.type === "rowsum") {
      context.n = scen.n;
    }

    answers = {
      pascalValue: { value: scen.value, tolerance: 0 },
      pascalExplain: { value: scen.expectedReasoning }
    };

    context.answers = answers;

    scenario = scen.prompt;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 6 --------
  if (modeId === "l06-binomial-term-error") {
    const base = drawFromBag("l6", level6Scenarios);
    const scen = buildLevel6(base);

    context = {
      levelName: "Level 6",
      problemText: "Find a specific term and critique a common mistake.",
      givenText: `A student claims the ${ordinal(scen.termIndex)} term of (${scen.p}${scen.var1} + ${scen.q}${scen.var2})^${scen.n} is ${scen.wrongTerm}.\nWhat is the correct coefficient and the correct exponents of ${scen.var1} and ${scen.var2} in that term?`,
      n: scen.n,
      k: scen.k,
      p: scen.p,
      q: scen.q,
      var1: scen.var1,
      var2: scen.var2,
      termIndex: scen.termIndex,
      termOrdinal: ordinal(scen.termIndex),
      expectedReasoning: scen.expectedReasoning
    };

    answers = {
      termCoeff: { value: scen.correctCoeff, tolerance: 0 },
      termExpVar1: { value: scen.exp1, tolerance: 0 },
      termExpVar2: { value: scen.exp2, tolerance: 0 },
      errorExplain: { value: scen.expectedReasoning }
    };

    context.answers = answers;

    scenario = context.givenText;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Fallback --------
  return {
    context: {
      levelName: "Unknown",
      problemText: "Mode not implemented",
      givenText: ""
    },
    graphConfig: null,
    answers: {},
    scenario: "Mode not implemented: " + modeId
  };
}

export default { generateProblem };
