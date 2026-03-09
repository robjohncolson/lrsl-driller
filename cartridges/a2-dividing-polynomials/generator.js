// generator.js — Dividing Polynomials
// Cartridge: a2-dividing-polynomials
//
// Mode mapping:
// remainder-eval:           A-APR.B.2, MP.2
// long-division:            A-APR.A.1a, A-APR.D.6, MP.6
// remainder-theorem-verify: A-APR.B.2, MP.2, MP.7
// factor-and-quotient:      A-APR.B.2, A-SSE.A.2, A-APR.A.1b, MP.7
// quotient-expression:      A-APR.D.6, MP.6
// synthetic-division:        A-APR.D.6, A-APR.A.1b, MP.6, MP.7
// is-it-a-factor:           A-APR.B.2, MP.2

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

// ============ SHUFFLE BAG SYSTEM ============

const shuffleBags = {};

function drawFromBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName].pop();
}

// ============ POLYNOMIAL UTILITIES ============

const SUPERSCRIPTS = {
  '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074',
  '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079'
};

function superscript(n) {
  return String(n).split('').map(d => SUPERSCRIPTS[d] || d).join('');
}

/**
 * Format a coefficient array as a polynomial string.
 * coeffs[0] = highest degree, coeffs[n] = constant.
 */
function formatPolynomial(coeffs, variable = 'x') {
  const degree = coeffs.length - 1;
  const parts = [];
  for (let i = 0; i <= degree; i++) {
    const c = coeffs[i];
    if (c === 0) continue;
    const power = degree - i;
    const absC = Math.abs(c);
    let prefix;
    if (parts.length === 0) {
      prefix = c < 0 ? '\u2212' : '';
    } else {
      prefix = c > 0 ? ' + ' : ' \u2212 ';
    }
    let body;
    if (power === 0) {
      body = String(absC);
    } else if (power === 1) {
      body = (absC === 1 ? '' : String(absC)) + variable;
    } else {
      body = (absC === 1 ? '' : String(absC)) + variable + superscript(power);
    }
    parts.push(prefix + body);
  }
  return parts.join('') || '0';
}

/**
 * Format divisor (x - a) for display.
 */
function formatDivisor(a) {
  if (a > 0) return `(x \u2212 ${a})`;
  if (a < 0) return `(x + ${Math.abs(a)})`;
  return '(x)';
}

/**
 * Evaluate polynomial at x using Horner's method.
 */
function evaluatePolynomial(coeffs, x) {
  let result = 0;
  for (const c of coeffs) {
    result = result * x + c;
  }
  return result;
}

/**
 * Multiply polynomial coefficients by (x - a).
 * Returns new coefficient array one degree higher.
 */
function multiplyByLinear(coeffs, a) {
  const n = coeffs.length;
  const result = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    result[i] += coeffs[i];
    result[i + 1] -= a * coeffs[i];
  }
  return result;
}

// ============ SHARED VALUE POOLS ============

const aValues = [-4, -3, -2, -1, 1, 2, 3, 4];
const rootPool = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

// ============ MODE GENERATORS ============

/**
 * Mode 1: Remainder by Evaluation
 * Student evaluates P(a) to find the remainder when dividing by (x - a).
 * ~20% of problems produce remainder = 0 (factor case).
 */
function generateRemainderEval() {
  const a = drawFromBag('rem-eval-a', aValues);
  let coeffs;

  if (Math.random() < 0.2) {
    // Factor case: remainder = 0
    const q = [randInt(1, 3) * choice([-1, 1]), randInt(-5, 5), randInt(-5, 5)];
    coeffs = multiplyByLinear(q, a);
  } else {
    // Random degree 3 polynomial
    coeffs = [
      randInt(1, 3) * choice([-1, 1]),
      randInt(-8, 8),
      randInt(-8, 8),
      randInt(-8, 8)
    ];
    // Ensure P(a) != 0 for non-factor case
    if (evaluatePolynomial(coeffs, a) === 0) {
      coeffs[3] += choice([1, -1, 2, -2]);
    }
  }

  const remainder = evaluatePolynomial(coeffs, a);
  const polynomial = formatPolynomial(coeffs);
  const divisor = formatDivisor(a);

  return {
    context: {
      levelName: "Remainder by Evaluation",
      directions: "By the Remainder Theorem, when you divide P(x) by (x \u2212 a), the remainder equals P(a). That means you can find the remainder without doing long division \u2014 just substitute a into P(x). Careful: if the divisor is (x + 2), then a = \u22122, not 2. Plug in, evaluate each term, and combine.",
      problemText: "Find the remainder using the Remainder Theorem.",
      givenText: `Find the remainder when P(x) = ${polynomial} is divided by ${divisor}.`,
      polynomial, divisor, a,
      coefficients: coeffs
    },
    answers: {
      remainder: { value: remainder }
    },
    scenario: `Find the remainder when P(x) = ${polynomial} is divided by ${divisor}.`
  };
}

/**
 * Mode 2: Polynomial Long Division
 * Build dividend from known quotient * divisor + remainder.
 * Guarantees clean integer answers.
 */
function generateLongDivision(requireNonZeroRemainder = false) {
  const a = drawFromBag('long-div-a', aValues);

  // Quotient q(x) = c2*x^2 + c1*x + c0
  const c2 = randInt(1, 3) * choice([-1, 1]);
  const c1 = randInt(-5, 5);
  const c0 = randInt(-5, 5);
  const qCoeffs = [c2, c1, c0];

  // Remainder
  let r;
  if (requireNonZeroRemainder) {
    r = randInt(1, 10) * choice([-1, 1]);
  } else {
    r = randInt(-10, 10);
  }

  // Compute P(x) = q(x)(x - a) + r
  const product = multiplyByLinear(qCoeffs, a);
  const pCoeffs = [...product];
  pCoeffs[pCoeffs.length - 1] += r;

  // Verify coefficients within bounds
  if (pCoeffs.some(c => Math.abs(c) > 50)) {
    return generateLongDivision(requireNonZeroRemainder);
  }

  return {
    polynomial: formatPolynomial(pCoeffs),
    divisor: formatDivisor(a),
    a,
    dividendCoeffs: pCoeffs,
    quotientCoeffs: qCoeffs,
    quotientPoly: formatPolynomial(qCoeffs),
    coeffX2: c2,
    coeffX1: c1,
    coeffX0: c0,
    remainder: r
  };
}

/**
 * Mode: Synthetic Division
 * Degree-4 polynomial divided by (x - a).
 * Build from known quotient and remainder for clean integer answers.
 * ~30% chance of remainder = 0 (factor case).
 */
function generateSyntheticDivision() {
  const a = drawFromBag('synth-div-a', aValues);

  // Quotient q(x) = c3*x^3 + c2*x^2 + c1*x + c0
  const c3 = randInt(1, 2) * choice([-1, 1]);
  const c2 = randInt(-4, 4);
  const c1 = randInt(-4, 4);
  const c0 = randInt(-4, 4);
  const qCoeffs = [c3, c2, c1, c0];

  // Remainder
  let r;
  if (Math.random() < 0.3) {
    r = 0; // factor case
  } else {
    r = randInt(1, 8) * choice([-1, 1]);
  }

  // Compute P(x) = q(x)(x - a) + r
  const product = multiplyByLinear(qCoeffs, a);
  const pCoeffs = [...product];
  pCoeffs[pCoeffs.length - 1] += r;

  // Verify coefficients within bounds
  if (pCoeffs.some(c => Math.abs(c) > 60)) {
    return generateSyntheticDivision();
  }

  return {
    polynomial: formatPolynomial(pCoeffs),
    divisor: formatDivisor(a),
    a,
    dividendCoeffs: pCoeffs,
    quotientCoeffs: qCoeffs,
    quotientPoly: formatPolynomial(qCoeffs),
    coeffX3: c3,
    coeffX2: c2,
    coeffX1: c1,
    coeffX0: c0,
    remainder: r
  };
}

/**
 * Mode 4: Factor with Known Factor
 * P(x) = (x - a)(x - b)(x - c), give one factor, find the other two.
 * Always factors over the integers by construction.
 */
function generateFactorAndQuotient() {
  const available = shuffle(rootPool);
  const roots = available.slice(0, 3);
  const [a, b, c] = roots;

  // Build P(x) = (x - a)(x - b)(x - c)
  let poly = [1, -a];
  poly = multiplyByLinear(poly, b);
  poly = multiplyByLinear(poly, c);

  if (poly.some(coeff => Math.abs(coeff) > 50)) {
    return generateFactorAndQuotient();
  }

  return {
    polynomial: formatPolynomial(poly),
    coefficients: poly,
    knownRoot: a,
    root2: b,
    root3: c,
    knownFactor: formatDivisor(a),
    factor2: formatDivisor(b),
    factor3: formatDivisor(c)
  };
}

/**
 * Mode 6: Is It a Factor?
 * 50% factor (P(a)=0), 50% not.
 */
function generateIsItAFactor() {
  const a = drawFromBag('factor-check-a', aValues);
  const isFactor = Math.random() < 0.5;
  let coeffs;

  if (isFactor) {
    const q = [randInt(1, 3) * choice([-1, 1]), randInt(-5, 5), randInt(-5, 5)];
    coeffs = multiplyByLinear(q, a);
  } else {
    coeffs = [
      randInt(1, 3) * choice([-1, 1]),
      randInt(-6, 6),
      randInt(-6, 6),
      randInt(-6, 6)
    ];
    if (evaluatePolynomial(coeffs, a) === 0) {
      coeffs[3] += choice([1, -1, 2, -2]);
    }
  }

  const paValue = evaluatePolynomial(coeffs, a);
  const isFactorAnswer = paValue === 0
    ? "Yes \u2014 remainder is 0"
    : "No \u2014 remainder is not 0";

  return {
    polynomial: formatPolynomial(coeffs),
    coefficients: coeffs,
    divisor: formatDivisor(a),
    a,
    paValue,
    isFactorAnswer
  };
}

// ============ MAIN GENERATOR ============

export function generateProblem(modeId, contextFromFile, mode) {
  const graphConfig = null;

  // -------- Mode 1: Remainder by Evaluation --------
  if (modeId === 'remainder-eval') {
    const data = generateRemainderEval();
    data.context.answers = data.answers;
    return {
      context: data.context,
      graphConfig,
      answers: data.answers,
      scenario: data.scenario
    };
  }

  // -------- Mode 2: Polynomial Long Division --------
  if (modeId === 'long-division') {
    const data = generateLongDivision(false);
    const answers = {
      'coeff-x2': { value: data.coeffX2 },
      'coeff-x1': { value: data.coeffX1 },
      'coeff-x0': { value: data.coeffX0 },
      remainder: { value: data.remainder }
    };
    const context = {
      levelName: "Polynomial Long Division",
      directions: "Polynomial long division works just like whole-number long division. Set up the dividend under the bar and the divisor outside. (1) Divide the leading term of the dividend by x to get the first quotient term. (2) Multiply the entire divisor by that term. (3) Subtract \u2014 use parentheses and distribute the negative carefully. (4) Bring down the next term and repeat. If any degree is missing in the dividend, insert a 0 placeholder (like + 0x\u00b2) to keep terms aligned. The final value after the last subtraction is the remainder.",
      problemText: "Perform polynomial long division.",
      givenText: `Divide ${data.polynomial} by ${data.divisor}. Enter the quotient coefficients and remainder.`,
      polynomial: data.polynomial,
      divisor: data.divisor,
      a: data.a,
      dividendCoeffs: data.dividendCoeffs,
      quotientPoly: data.quotientPoly,
      answers
    };
    return { context, graphConfig, answers, scenario: context.givenText };
  }

  // -------- Mode: Synthetic Division --------
  if (modeId === 'synthetic-division') {
    const data = generateSyntheticDivision();
    const answers = {
      'coeff-x3': { value: data.coeffX3 },
      'coeff-x2': { value: data.coeffX2 },
      'coeff-x1': { value: data.coeffX1 },
      'coeff-x0': { value: data.coeffX0 },
      remainder: { value: data.remainder }
    };
    const context = {
      levelName: "Synthetic Division",
      directions: "Synthetic division is a shortcut for dividing by (x − a). Write a to the left. Write the dividend's coefficients across the top — if any degree is missing, use 0. Bring down the first coefficient. Then repeat: multiply the bottom number by a, write the result under the next coefficient, and add. The last number is the remainder; the others are the quotient's coefficients.",
      problemText: "Use synthetic division to find the quotient and remainder.",
      givenText: `Use synthetic division to divide ${data.polynomial} by ${data.divisor}.`,
      polynomial: data.polynomial,
      divisor: data.divisor,
      a: data.a,
      dividendCoeffs: data.dividendCoeffs,
      quotientPoly: data.quotientPoly,
      answers
    };
    return { context, graphConfig, answers, scenario: context.givenText };
  }

  // -------- Mode 3: Verify Remainder Theorem --------
  if (modeId === 'remainder-theorem-verify') {
    const data = generateLongDivision(false);
    const remainder = data.remainder;
    const answers = {
      'division-remainder': { value: remainder },
      'pa-value': { value: remainder },
      verify: { value: "Yes" }
    };
    const context = {
      levelName: "Verify Remainder Theorem",
      directions: "Here you\u2019ll verify the Remainder Theorem by checking it from both sides. First, divide P(x) by the divisor (using long division or synthetic division) and write down the remainder. Then, evaluate P(a) by substituting a into the polynomial. The Remainder Theorem guarantees these two values are always equal \u2014 because if you plug x = a into P(x) = (x \u2212 a)\u00b7q(x) + r, the (x \u2212 a) part vanishes, leaving just r.",
      problemText: "Verify the Remainder Theorem: division remainder should equal P(a).",
      givenText: `Divide P(x) = ${data.polynomial} by ${data.divisor}, then evaluate P(${data.a}).`,
      polynomial: data.polynomial,
      divisor: data.divisor,
      a: data.a,
      dividendCoeffs: data.dividendCoeffs,
      answers
    };
    return { context, graphConfig, answers, scenario: context.givenText };
  }

  // -------- Mode 4: Factor with Known Factor --------
  if (modeId === 'factor-and-quotient') {
    const data = generateFactorAndQuotient();
    const answers = {
      factor2: { value: data.factor2 },
      factor3: { value: data.factor3 }
    };
    const context = {
      levelName: "Factor with Known Factor",
      directions: "The Factor Theorem tells us: if (x \u2212 a) is a factor, then dividing P(x) by it leaves remainder 0, and the quotient is a simpler polynomial. Divide P(x) by the known factor to get a quadratic. Then factor that quadratic \u2014 find two values whose product is the constant term and whose sum is the middle coefficient. Write each factor in (x \u2212 root) form. Remember: a root of \u22123 gives the factor (x + 3).",
      problemText: "Find the remaining factors of P(x).",
      givenText: `Given that ${data.knownFactor} is a factor of P(x) = ${data.polynomial}, find the remaining factors.`,
      polynomial: data.polynomial,
      knownFactor: data.knownFactor,
      knownRoot: data.knownRoot,
      root2: data.root2,
      root3: data.root3,
      divisor: data.knownFactor,
      a: data.knownRoot,
      answers
    };
    return { context, graphConfig, answers, scenario: context.givenText };
  }

  // -------- Mode 5: Quotient Expression --------
  if (modeId === 'quotient-expression') {
    const data = generateLongDivision(true); // non-zero remainder
    // Build expected remainder fraction string
    const r = data.remainder;
    const aVal = data.a;
    let fractionStr;
    if (aVal > 0) {
      fractionStr = `${r}/(x \u2212 ${aVal})`;
    } else {
      fractionStr = `${r}/(x + ${Math.abs(aVal)})`;
    }
    const answers = {
      'quotient-poly': { value: data.quotientPoly },
      'remainder-fraction': { value: fractionStr }
    };
    const context = {
      levelName: "Write q(x) + r/(x \u2212 a)",
      directions: "When a polynomial doesn\u2019t divide evenly, we write the full result as q(x) + r/(x \u2212 a). Perform long division to find the quotient q(x) and the remainder r. The quotient is the polynomial you build on top of the division bar. The remainder goes over the divisor as a fraction. This form \u2014 quotient plus remainder fraction \u2014 is how we rewrite any rational expression with a linear denominator.",
      problemText: "Express the division result as q(x) + r/(x \u2212 a).",
      givenText: `Divide ${data.polynomial} by ${data.divisor} and write the result as q(x) + r/(x \u2212 a).`,
      polynomial: data.polynomial,
      divisor: data.divisor,
      a: aVal,
      quotientPoly: data.quotientPoly,
      expectedRemainder: r,
      quotientCoeffs: data.quotientCoeffs,
      dividendCoeffs: data.dividendCoeffs,
      answers
    };
    return { context, graphConfig, answers, scenario: context.givenText };
  }

  // -------- Mode 6: Is It a Factor? --------
  if (modeId === 'is-it-a-factor') {
    const data = generateIsItAFactor();
    const answers = {
      'pa-value': { value: data.paValue },
      'is-factor': { value: data.isFactorAnswer }
    };
    const context = {
      levelName: "Factor or Not?",
      directions: "The Factor Theorem gives a quick test: (x \u2212 a) is a factor of P(x) if and only if P(a) = 0. First, identify a from the divisor \u2014 if the divisor is (x + 3), then a = \u22123. Then evaluate P(a). If the result is 0, the divisor is a factor and divides evenly. If it\u2019s anything else, it doesn\u2019t.",
      problemText: "Determine if the divisor is a factor of P(x).",
      givenText: `Is ${data.divisor} a factor of P(x) = ${data.polynomial}?`,
      polynomial: data.polynomial,
      divisor: data.divisor,
      a: data.a,
      coefficients: data.coefficients,
      answers
    };
    return { context, graphConfig, answers, scenario: context.givenText };
  }

  // -------- Fallback --------
  return {
    context: { levelName: "Unknown", problemText: "Mode not implemented", givenText: "" },
    graphConfig: null,
    answers: {},
    scenario: "Mode not implemented: " + modeId
  };
}

export default { generateProblem };
