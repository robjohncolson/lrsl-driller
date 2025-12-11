/**
 * Algebra 2 Factoring & Radicals - Grading Rules
 * Handles numeric, text-based, and choice grading for algebra problems
 */

/**
 * Get grading rule for a specific field
 */
export function getRule(fieldId) {
  return rules[fieldId] || null;
}

/**
 * Grading rules by field
 */
const rules = {
  // Factor Numbers mode
  primeFactors: {
    type: 'prime-factorization',
    feedback: {
      E: 'Correct prime factorization!',
      P: 'Partially correct - check your prime factors',
      I: 'Incorrect - remember to break down into only prime numbers'
    }
  },

  gcf: {
    type: 'numeric',
    expected: 'gcf',
    tolerance: 0,
    feedback: {
      E: 'Correct GCF!',
      P: 'Close - the GCF uses the lowest powers of common primes',
      I: 'Incorrect - multiply the common prime factors with lowest exponents'
    }
  },

  lcm: {
    type: 'numeric',
    expected: 'lcm',
    tolerance: 0,
    feedback: {
      E: 'Correct LCM!',
      P: 'Close - the LCM uses the highest powers of all primes',
      I: 'Incorrect - multiply all prime factors with their highest exponents'
    }
  },

  // Factor Polynomials mode
  factored: {
    type: 'factored-form',
    feedback: {
      E: 'Correctly factored!',
      P: 'Partially correct - check your factors',
      I: 'Incorrect factoring - try expanding your answer to verify'
    }
  },

  method: {
    type: 'exact',
    expected: 'method',
    feedback: {
      E: 'Correct method identified!',
      I: 'Not quite - review the factoring patterns'
    }
  },

  // Simplify Radicals mode
  simplified: {
    type: 'simplified-radical',
    feedback: {
      E: 'Correctly simplified!',
      P: 'Partially simplified - can you simplify further?',
      I: 'Incorrect - find the largest perfect square factor'
    }
  },

  coefficient: {
    type: 'text-match',
    expected: 'coefficient',
    feedback: {
      E: 'Correct coefficient!',
      P: 'Check your coefficient',
      I: 'Incorrect coefficient'
    }
  },

  radicand: {
    type: 'text-match',
    expected: 'radicand',
    feedback: {
      E: 'Correct radicand!',
      P: 'Check what remains under the radical',
      I: 'Incorrect radicand'
    }
  }
};

/**
 * Grade a numeric answer (GCF, LCM)
 */
function gradeNumeric(answer, rule, context) {
  const userValue = parseFloat(answer);
  if (isNaN(userValue)) {
    return { score: 'I', feedback: 'Please enter a number' };
  }

  let expected = rule.expected;
  if (typeof expected === 'string') {
    expected = parseFloat(context[expected]);
  }

  if (userValue === expected) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  // Check if close (within 10% for partial credit)
  if (Math.abs(userValue - expected) <= expected * 0.1) {
    return { score: 'P', feedback: rule.feedback.P };
  }

  return { score: 'I', feedback: rule.feedback.I };
}

/**
 * Grade prime factorization
 * Accepts formats like: "2^3 × 5", "2*2*2*5", "2³×5", etc.
 */
function gradePrimeFactorization(answer, rule, context) {
  if (!answer || answer.trim() === '') {
    return { score: 'I', feedback: 'Please enter the prime factorization' };
  }

  // Parse the expected factors from context
  const expectedFactors = context.answers?.primeFactors?.factors;
  const expectedNum = context.num1;

  if (!expectedFactors) {
    return { score: 'I', feedback: 'Unable to verify - internal error' };
  }

  // Parse user's answer into factors
  const userFactors = parsePrimeFactorization(answer);

  if (!userFactors) {
    return { score: 'I', feedback: 'Could not parse your answer. Use format like 2^3 × 5 or 2*2*2*5' };
  }

  // Calculate what number the user's factorization represents
  let userNum = 1;
  for (const [prime, power] of Object.entries(userFactors)) {
    userNum *= Math.pow(parseInt(prime), power);
  }

  // Check if it equals the expected number
  if (userNum !== expectedNum) {
    return { score: 'I', feedback: `Your factorization equals ${userNum}, not ${expectedNum}` };
  }

  // Check if all factors are actually prime
  for (const prime of Object.keys(userFactors)) {
    if (!isPrime(parseInt(prime))) {
      return { score: 'P', feedback: `${prime} is not a prime number` };
    }
  }

  return { score: 'E', feedback: rule.feedback.E };
}

/**
 * Parse a prime factorization string into {prime: power} object
 */
function parsePrimeFactorization(str) {
  try {
    str = str.trim()
      .replace(/×/g, '*')
      .replace(/·/g, '*')
      .replace(/\s+/g, '')
      .replace(/\^/g, '^')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/⁵/g, '^5');

    const factors = {};
    const parts = str.split('*');

    for (const part of parts) {
      if (part.includes('^')) {
        const [base, exp] = part.split('^');
        const prime = parseInt(base);
        const power = parseInt(exp);
        factors[prime] = (factors[prime] || 0) + power;
      } else {
        const prime = parseInt(part);
        if (!isNaN(prime)) {
          factors[prime] = (factors[prime] || 0) + 1;
        }
      }
    }

    return Object.keys(factors).length > 0 ? factors : null;
  } catch (e) {
    return null;
  }
}

function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * Grade factored polynomial form
 * Accepts various formats and checks if it expands to the original
 */
function gradeFactoredForm(answer, rule, context) {
  if (!answer || answer.trim() === '') {
    return { score: 'I', feedback: 'Please enter the factored form' };
  }

  const expectedFactored = context.factored;
  const polynomial = context.polynomial;

  // Normalize both answers for comparison
  const userNorm = normalizeFactoredForm(answer);
  const expectedNorm = normalizeFactoredForm(expectedFactored);

  // Direct match after normalization
  if (userNorm === expectedNorm) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  // Try expanding both and comparing (more complex, skip for now)
  // For now, check if the structure looks similar
  const userFactors = extractFactors(answer);
  const expectedFactorsList = extractFactors(expectedFactored);

  if (userFactors.length === expectedFactorsList.length) {
    // Same number of factors - give partial credit
    return { score: 'P', feedback: rule.feedback.P + ' Check your signs or coefficients.' };
  }

  return { score: 'I', feedback: rule.feedback.I };
}

function normalizeFactoredForm(str) {
  return str.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, '')
    .replace(/\*/g, '')
    .replace(/\)\(/g, ')(');
}

function extractFactors(str) {
  const matches = str.match(/\([^)]+\)/g);
  return matches || [];
}

/**
 * Grade simplified radical form
 */
function gradeSimplifiedRadical(answer, rule, context) {
  if (!answer || answer.trim() === '') {
    return { score: 'I', feedback: 'Please enter the simplified form' };
  }

  const expected = context.answers?.simplified;
  if (!expected) {
    return { score: 'I', feedback: 'Unable to verify' };
  }

  // Normalize
  const userNorm = normalizeRadical(answer);
  const expectedNorm = normalizeRadical(expected.value);

  if (userNorm === expectedNorm) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  // Check if coefficient is correct
  const userCoeff = extractRadicalCoefficient(answer);
  const expectedCoeff = expected.coefficient;

  if (userCoeff === String(expectedCoeff)) {
    return { score: 'P', feedback: 'Coefficient is correct, check the radicand' };
  }

  return { score: 'I', feedback: rule.feedback.I };
}

function normalizeRadical(str) {
  return str.replace(/\s+/g, '')
    .replace(/√/g, 'sqrt')
    .replace(/\*/g, '')
    .toLowerCase();
}

function extractRadicalCoefficient(str) {
  const match = str.match(/^(\d*x?²?)/);
  return match ? match[1] : '';
}

/**
 * Grade exact match (for method choice)
 */
function gradeExact(answer, rule, context) {
  let expected = rule.expected;
  if (typeof expected === 'string' && context[expected] !== undefined) {
    expected = context[expected];
  }
  if (typeof expected === 'object' && expected.value !== undefined) {
    expected = expected.value;
  }

  if (answer === expected) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  return { score: 'I', feedback: rule.feedback.I };
}

/**
 * Grade text match (flexible)
 */
function gradeTextMatch(answer, rule, context) {
  if (!answer || answer.trim() === '') {
    return { score: 'I', feedback: 'Please enter an answer' };
  }

  let expected = rule.expected;
  if (typeof expected === 'string' && context.answers?.[expected]?.value !== undefined) {
    expected = String(context.answers[expected].value);
  } else if (typeof expected === 'string' && context[expected] !== undefined) {
    expected = String(context[expected]);
  }

  const userNorm = answer.replace(/\s+/g, '').toLowerCase();
  const expectedNorm = String(expected).replace(/\s+/g, '').toLowerCase();

  if (userNorm === expectedNorm) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  return { score: 'I', feedback: rule.feedback.I };
}

/**
 * Grade a field using appropriate method
 */
export function gradeField(fieldId, answer, context) {
  const rule = rules[fieldId];
  if (!rule) {
    return { score: 'I', feedback: 'Unknown field' };
  }

  switch (rule.type) {
    case 'numeric':
      return gradeNumeric(answer, rule, context);
    case 'prime-factorization':
      return gradePrimeFactorization(answer, rule, context);
    case 'factored-form':
      return gradeFactoredForm(answer, rule, context);
    case 'simplified-radical':
      return gradeSimplifiedRadical(answer, rule, context);
    case 'exact':
      return gradeExact(answer, rule, context);
    case 'text-match':
      return gradeTextMatch(answer, rule, context);
    default:
      return { score: 'I', feedback: 'Unknown rule type' };
  }
}

export default { getRule, gradeField };
