/**
 * Algebra 2 Factoring & Radicals - Problem Generator
 * Generates problems for factoring numbers, polynomials, and simplifying radicals
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, mode) {
  switch (modeId) {
    case 'factor-numbers':
      return generateFactorNumbersProblem();
    case 'factor-polynomials':
      return generatePolynomialProblem();
    case 'simplify-radicals':
      return generateRadicalProblem();
    default:
      return generateFactorNumbersProblem();
  }
}

// ==================== FACTOR NUMBERS ====================

/**
 * Generate a number factoring problem (prime factorization, GCF, LCM)
 */
function generateFactorNumbersProblem() {
  // Generate two numbers with interesting prime factorizations
  const primes = [2, 3, 5, 7, 11, 13];

  // Build num1 from random prime factors
  const factors1 = {};
  const numFactors1 = 2 + Math.floor(Math.random() * 3); // 2-4 prime factors
  for (let i = 0; i < numFactors1; i++) {
    const prime = primes[Math.floor(Math.random() * 4)]; // Use smaller primes more often
    factors1[prime] = (factors1[prime] || 0) + 1;
  }

  // Build num2 with some overlap
  const factors2 = {};
  const numFactors2 = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numFactors2; i++) {
    const prime = primes[Math.floor(Math.random() * 4)];
    factors2[prime] = (factors2[prime] || 0) + 1;
  }

  // Calculate the actual numbers
  const num1 = calculateFromFactors(factors1);
  const num2 = calculateFromFactors(factors2);

  // Ensure reasonable range (12-500)
  if (num1 < 12 || num1 > 500 || num2 < 12 || num2 > 500) {
    return generateFactorNumbersProblem(); // Regenerate
  }

  // Calculate GCF and LCM
  const gcf = calculateGCF(factors1, factors2);
  const lcm = calculateLCM(factors1, factors2);

  // Format prime factorization strings
  const primeStr1 = formatPrimeFactorization(factors1);
  const primeStr2 = formatPrimeFactorization(factors2);

  const problemContext = {
    num1,
    num2,
    primeStr1,
    primeStr2,
    gcf,
    lcm,
    problemType: 'Prime Factorization',
    expression: `${num1} and ${num2}`
  };

  return {
    context: problemContext,
    graphConfig: null,
    answers: {
      primeFactors: {
        value: primeStr1,
        num: num1,
        factors: factors1
      },
      gcf: {
        value: gcf,
        tolerance: 0
      },
      lcm: {
        value: lcm,
        tolerance: 0
      }
    },
    scenario: `Find the prime factorization of ${num1}, then find the GCF and LCM of ${num1} and ${num2}.\n\nNote: ${num2} = ${primeStr2}`
  };
}

function calculateFromFactors(factors) {
  let result = 1;
  for (const [prime, power] of Object.entries(factors)) {
    result *= Math.pow(parseInt(prime), power);
  }
  return result;
}

function calculateGCF(factors1, factors2) {
  let gcf = 1;
  for (const prime of Object.keys(factors1)) {
    if (factors2[prime]) {
      gcf *= Math.pow(parseInt(prime), Math.min(factors1[prime], factors2[prime]));
    }
  }
  return gcf;
}

function calculateLCM(factors1, factors2) {
  const allPrimes = new Set([...Object.keys(factors1), ...Object.keys(factors2)]);
  let lcm = 1;
  for (const prime of allPrimes) {
    const p = parseInt(prime);
    const maxPower = Math.max(factors1[prime] || 0, factors2[prime] || 0);
    lcm *= Math.pow(p, maxPower);
  }
  return lcm;
}

function formatPrimeFactorization(factors) {
  const sortedPrimes = Object.keys(factors).map(Number).sort((a, b) => a - b);
  return sortedPrimes.map(p => {
    const power = factors[p];
    return power === 1 ? `${p}` : `${p}^${power}`;
  }).join(' × ');
}

// ==================== FACTOR POLYNOMIALS ====================

/**
 * Generate a polynomial factoring problem
 */
function generatePolynomialProblem() {
  const types = ['trinomial-simple', 'trinomial-simple', 'difference-of-squares', 'gcf', 'trinomial-a'];
  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case 'trinomial-simple':
      return generateTrinomialSimple();
    case 'difference-of-squares':
      return generateDifferenceOfSquares();
    case 'gcf':
      return generateGCFProblem();
    case 'trinomial-a':
      return generateTrinomialA();
    default:
      return generateTrinomialSimple();
  }
}

/**
 * Generate x² + bx + c type trinomial (a=1)
 */
function generateTrinomialSimple() {
  // (x + p)(x + q) = x² + (p+q)x + pq
  const p = randomInt(-9, 9);
  const q = randomInt(-9, 9);

  if (p === 0 || q === 0) return generateTrinomialSimple();

  const b = p + q;
  const c = p * q;

  // Format the polynomial
  const bTerm = b === 0 ? '' : (b > 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`);
  const cTerm = c === 0 ? '' : (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`);
  const polynomial = `x²${bTerm}${cTerm}`;

  // Format the factored form (always put smaller number first for consistency)
  const [r, s] = [p, q].sort((a, b) => a - b);
  const factor1 = r >= 0 ? `(x + ${r})` : `(x - ${Math.abs(r)})`;
  const factor2 = s >= 0 ? `(x + ${s})` : `(x - ${Math.abs(s)})`;
  const factored = `${factor1}${factor2}`;

  return {
    context: {
      polynomial,
      factored,
      method: 'Trinomial (a=1)',
      problemType: 'Factor Trinomial',
      expression: polynomial
    },
    graphConfig: null,
    answers: {
      factored: {
        value: factored,
        factors: [r, s],
        polynomial
      },
      method: {
        value: 'Trinomial (a=1)'
      }
    },
    scenario: `Factor the polynomial: ${polynomial}`
  };
}

/**
 * Generate a² - b² type (difference of squares)
 */
function generateDifferenceOfSquares() {
  const a = randomInt(1, 9);
  const b = randomInt(1, 9);

  // Could be x² - n² or (ax)² - b²
  const useCoeff = Math.random() > 0.5 && a !== 1;

  let polynomial, factored;
  if (useCoeff) {
    // (ax)² - b² = (ax + b)(ax - b)
    const aSquared = a * a;
    const bSquared = b * b;
    polynomial = `${aSquared}x² - ${bSquared}`;
    factored = `(${a}x + ${b})(${a}x - ${b})`;
  } else {
    // x² - b² = (x + b)(x - b)
    const bSquared = b * b;
    polynomial = `x² - ${bSquared}`;
    factored = `(x + ${b})(x - ${b})`;
  }

  return {
    context: {
      polynomial,
      factored,
      method: 'Difference of Squares',
      problemType: 'Difference of Squares',
      expression: polynomial
    },
    graphConfig: null,
    answers: {
      factored: {
        value: factored,
        polynomial
      },
      method: {
        value: 'Difference of Squares'
      }
    },
    scenario: `Factor the polynomial: ${polynomial}`
  };
}

/**
 * Generate GCF factoring problem
 */
function generateGCFProblem() {
  const gcf = randomInt(2, 6);
  const a = randomInt(1, 5);
  const b = randomInt(1, 5);

  // gcf(ax + b) or gcf·x(ax + b)
  const useX = Math.random() > 0.5;

  let polynomial, factored;
  if (useX) {
    // gcf·x² + gcf·b·x = gcf·x(x + b)
    polynomial = `${gcf}x² + ${gcf * b}x`;
    factored = `${gcf}x(x + ${b})`;
  } else {
    // gcf·a·x + gcf·b = gcf(ax + b)
    polynomial = `${gcf * a}x + ${gcf * b}`;
    factored = `${gcf}(${a}x + ${b})`;
  }

  return {
    context: {
      polynomial,
      factored,
      method: 'GCF',
      problemType: 'Greatest Common Factor',
      expression: polynomial
    },
    graphConfig: null,
    answers: {
      factored: {
        value: factored,
        gcf,
        polynomial
      },
      method: {
        value: 'GCF'
      }
    },
    scenario: `Factor the polynomial: ${polynomial}`
  };
}

/**
 * Generate ax² + bx + c type trinomial (a≠1)
 */
function generateTrinomialA() {
  // (mx + p)(nx + q) = mnx² + (mq + np)x + pq
  const m = randomInt(2, 4);
  const n = randomInt(1, 3);
  const p = randomInt(-5, 5);
  const q = randomInt(-5, 5);

  if (p === 0 || q === 0) return generateTrinomialA();

  const a = m * n;
  const b = m * q + n * p;
  const c = p * q;

  // Format the polynomial
  const aTerm = a === 1 ? 'x²' : `${a}x²`;
  const bTerm = b === 0 ? '' : (b > 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`);
  const cTerm = c === 0 ? '' : (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`);
  const polynomial = `${aTerm}${bTerm}${cTerm}`;

  // Format factored form
  const factor1 = p >= 0 ? `(${m}x + ${p})` : `(${m}x - ${Math.abs(p)})`;
  const factor2 = q >= 0 ? `(${n}x + ${q})` : `(${n}x - ${Math.abs(q)})`;
  const factored = `${factor1}${factor2}`;

  return {
    context: {
      polynomial,
      factored,
      method: 'Trinomial (a≠1)',
      problemType: 'Factor Trinomial (a≠1)',
      expression: polynomial
    },
    graphConfig: null,
    answers: {
      factored: {
        value: factored,
        polynomial
      },
      method: {
        value: 'Trinomial (a≠1)'
      }
    },
    scenario: `Factor the polynomial: ${polynomial}`
  };
}

// ==================== SIMPLIFY RADICALS ====================

/**
 * Generate a radical simplification problem
 */
function generateRadicalProblem() {
  const types = ['numeric', 'numeric', 'with-variable'];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'numeric') {
    return generateNumericRadical();
  } else {
    return generateVariableRadical();
  }
}

/**
 * Generate √n where n has a perfect square factor
 */
function generateNumericRadical() {
  // √(a²·b) = a√b
  const perfectSquares = [4, 9, 16, 25, 36, 49];
  const a2 = perfectSquares[Math.floor(Math.random() * perfectSquares.length)];
  const a = Math.sqrt(a2);

  // b should not be a perfect square and should be small
  const nonSquares = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
  const b = nonSquares[Math.floor(Math.random() * nonSquares.length)];

  const radicand = a2 * b;
  const expression = `√${radicand}`;
  const simplified = `${a}√${b}`;

  return {
    context: {
      radicand,
      coefficient: a,
      remainingRadicand: b,
      problemType: 'Simplify Radical',
      expression
    },
    graphConfig: null,
    answers: {
      simplified: {
        value: simplified,
        coefficient: a,
        radicand: b
      },
      coefficient: {
        value: String(a)
      },
      radicand: {
        value: String(b)
      }
    },
    scenario: `Simplify the radical expression: ${expression}`
  };
}

/**
 * Generate √(a²·x²·b) = ax√b type
 */
function generateVariableRadical() {
  // √(coeff² · x^(2n) · remainder) = coeff · x^n · √remainder
  const coeffSquared = [1, 4, 9, 16][Math.floor(Math.random() * 4)];
  const coeff = Math.sqrt(coeffSquared);

  const xPower = [2, 4][Math.floor(Math.random() * 2)]; // x² or x⁴
  const xOutside = xPower / 2; // x or x²

  const remainder = [2, 3, 5, 6, 7][Math.floor(Math.random() * 5)];

  // Build the expression under the radical
  let radicandStr;
  if (coeffSquared === 1) {
    radicandStr = xPower === 2 ? `${remainder}x²` : `${remainder}x⁴`;
  } else {
    radicandStr = xPower === 2 ? `${coeffSquared * remainder}x²` : `${coeffSquared * remainder}x⁴`;
  }

  const expression = `√(${radicandStr})`;

  // Build the simplified form
  let coeffPart = coeff === 1 ? '' : String(coeff);
  let xPart = xOutside === 1 ? 'x' : 'x²';
  let outsidePart = coeffPart + xPart;

  const simplified = `${outsidePart}√${remainder}`;

  return {
    context: {
      radicandStr,
      outsidePart,
      remainder,
      problemType: 'Simplify Radical with Variable',
      expression
    },
    graphConfig: null,
    answers: {
      simplified: {
        value: simplified,
        coefficient: outsidePart,
        radicand: remainder
      },
      coefficient: {
        value: outsidePart
      },
      radicand: {
        value: String(remainder)
      }
    },
    scenario: `Simplify the radical expression: ${expression}`
  };
}

// ==================== UTILITIES ====================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default { generateProblem };
