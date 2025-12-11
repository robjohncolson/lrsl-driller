/**
 * Algebra 2 Radicals - Grading Rules
 * Handles visual radical grading
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
  'visual-radical': {
    type: 'visual-radical',
    feedback: {
      E: 'Perfectly simplified! All possible perfect squares have been grouped.',
      P: 'Good progress! But there are still perfect square groups you can make.',
      I: 'Keep trying! Look for 2×2, 3×3, or larger square groups.'
    }
  },
  'visual-radical-prime': {
    type: 'visual-radical-prime',
    feedback: {
      E: 'Excellent! You correctly factored and extracted all pairs.',
      P: 'Good progress! Make sure you\'ve extracted all matching pairs.',
      I: 'Keep trying! Build the complete prime factorization first, then drag matching pairs outside.'
    }
  },
  'visual-radical-complex': {
    type: 'visual-radical-complex',
    feedback: {
      E: 'Excellent! You correctly handled the complex number and extracted all pairs.',
      P: 'Good progress! Make sure you\'ve extracted all pairs and i (if negative).',
      I: 'Keep trying! For negative radicands, extract −1 as i first, then factor the rest.'
    }
  },
  'typed-coefficient': {
    type: 'numeric-exact',
    feedback: {
      E: 'Correct coefficient!',
      I: 'Check your coefficient. What number comes outside the radical?'
    }
  },
  'typed-radicand': {
    type: 'numeric-exact',
    feedback: {
      E: 'Correct radicand!',
      I: 'Check your radicand. What number stays inside the radical?'
    }
  },
  'typed-has-i': {
    type: 'exact-match',
    feedback: {
      E: 'Correct!',
      I: 'Check the sign of the radicand. Negative radicands produce i.'
    }
  },
  'typed-complex-coefficient': {
    type: 'numeric-exact',
    feedback: {
      E: 'Correct coefficient!',
      I: 'Check your coefficient. What number comes outside the radical?'
    }
  },
  'typed-complex-radicand': {
    type: 'numeric-exact',
    feedback: {
      E: 'Correct radicand!',
      I: 'Check your radicand. What number stays inside the radical?'
    }
  }
};

/**
 * Grade visual radical answer
 * Answer comes as { coefficient: number, radicand: number } from RadicalGame
 */
function gradeVisualRadical(answer, rule, context) {
  // Answer is an object from RadicalGame.getAnswer()
  if (!answer || typeof answer !== 'object') {
    return { score: 'I', feedback: 'Please simplify the radical first' };
  }

  const userCoeff = answer.coefficient || 1;
  const userRadicand = answer.radicand || 0;

  // Expected values - platform spreads answers into context, so access via 'visual-radical' key
  // context['visual-radical'] = { coefficient, radicand, totalSquares, value }
  const expected = context['visual-radical'] || {};
  const expectedCoeff = expected.coefficient || context.coefficient;
  const expectedRadicand = expected.radicand || context.remainingRadicand;
  const totalSquares = expected.totalSquares || context.radicand;

  console.log('[Grading] User answer:', { userCoeff, userRadicand });
  console.log('[Grading] Expected:', { expectedCoeff, expectedRadicand, totalSquares });

  // Check if fully simplified (no remaining perfect square factors)
  const isFullySimplified = !hasPerfectSquareFactor(userRadicand);

  // Perfect answer: correct coefficient AND correct remaining radicand
  if (userCoeff === expectedCoeff && userRadicand === expectedRadicand) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  // Check if answer is mathematically correct (coefficient² × radicand = original)
  const userTotal = userCoeff * userCoeff * userRadicand;

  if (userTotal !== totalSquares) {
    return { score: 'I', feedback: `Your grouping doesn't equal √${totalSquares}. You have ${userCoeff}√${userRadicand} = √${userTotal}` };
  }

  // Mathematically correct but not fully simplified
  if (!isFullySimplified) {
    return { score: 'P', feedback: rule.feedback.P + ` (${userRadicand} still has perfect square factors)` };
  }

  // Fully simplified but different factorization (shouldn't happen with unique factorization)
  return { score: 'E', feedback: rule.feedback.E };
}

/**
 * Check if a number has any perfect square factor > 1
 */
function hasPerfectSquareFactor(n) {
  if (n <= 1) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % (i * i) === 0) return true;
  }
  return false;
}

/**
 * Grade visual-radical-prime answer
 * Answer comes as { coefficient: number, radicand: number, isComplete, isFullySimplified } from RadicalPrimeGame
 */
function gradeVisualRadicalPrime(answer, rule, context) {
  if (!answer || typeof answer !== 'object') {
    return { score: 'I', feedback: 'Please build the prime factorization first' };
  }

  const userCoeff = answer.coefficient || 1;
  const userRadicand = answer.radicand || 0;

  // Expected values from context
  const expected = context['visual-radical-prime'] || {};
  const expectedCoeff = expected.coefficient || context.coefficient;
  const expectedRadicand = expected.radicand || context.remainingRadicand;
  const totalSquares = expected.totalSquares || context.radicand;

  console.log('[Grading Prime] User answer:', { userCoeff, userRadicand });
  console.log('[Grading Prime] Expected:', { expectedCoeff, expectedRadicand, totalSquares });

  // Check if factorization is complete and fully simplified
  const isComplete = answer.isComplete === true;
  const isFullySimplified = answer.isFullySimplified === true;

  // Perfect answer
  if (userCoeff === expectedCoeff && userRadicand === expectedRadicand && isFullySimplified) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  // Check if mathematically correct
  const userTotal = userCoeff * userCoeff * userRadicand;
  if (userTotal !== totalSquares) {
    return { score: 'I', feedback: `Factorization incomplete. You have ${userCoeff}√${userRadicand}, but √${totalSquares} is not fully factored yet.` };
  }

  // Correct total but not fully simplified (pairs still inside)
  if (!isFullySimplified) {
    return { score: 'P', feedback: rule.feedback.P };
  }

  return { score: 'E', feedback: rule.feedback.E };
}

/**
 * Grade visual-radical-complex answer
 * Answer comes as { coefficient, radicand, hasI, isComplete, isFullySimplified } from RadicalComplexGame
 */
function gradeVisualRadicalComplex(answer, rule, context) {
  if (!answer || typeof answer !== 'object') {
    return { score: 'I', feedback: 'Please build the factorization first' };
  }

  const userCoeff = answer.coefficient || 1;
  const userRadicand = answer.radicand || 0;
  const userHasI = answer.hasI === true;

  // Expected values from context
  const expected = context['visual-radical-complex'] || {};
  const expectedCoeff = expected.coefficient || context.coefficient;
  const expectedRadicand = expected.radicand || context.remainingRadicand;
  const expectedHasI = expected.hasI === true || context.hasI === true;
  const totalSquares = expected.totalSquares || Math.abs(context.radicand);

  console.log('[Grading Complex] User answer:', { userCoeff, userRadicand, userHasI });
  console.log('[Grading Complex] Expected:', { expectedCoeff, expectedRadicand, expectedHasI, totalSquares });

  // Check completion flags
  const isComplete = answer.isComplete === true;
  const isFullySimplified = answer.isFullySimplified === true;

  // Perfect answer: correct coefficient, radicand, hasI, and fully simplified
  if (userCoeff === expectedCoeff && userRadicand === expectedRadicand && userHasI === expectedHasI && isFullySimplified) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  // Check if mathematically correct
  // For positive: coeff² × radicand = total
  // For negative with i: coeff² × radicand = |total| (and hasI must be true)
  const userTotal = userCoeff * userCoeff * userRadicand;
  const isNegativeRadicand = context.radicand < 0;

  if (userTotal !== totalSquares) {
    return { score: 'I', feedback: `Factorization incomplete. Keep adding factors.` };
  }

  // Check if hasI is correct for negative radicands
  if (isNegativeRadicand && !userHasI) {
    return { score: 'P', feedback: rule.feedback.P + ' (Don\'t forget to extract −1 as i!)' };
  }

  // Correct total but not fully simplified
  if (!isFullySimplified) {
    return { score: 'P', feedback: rule.feedback.P };
  }

  return { score: 'E', feedback: rule.feedback.E };
}

/**
 * Grade numeric exact match
 * For typed coefficient and radicand fields
 */
function gradeNumericExact(fieldId, answer, rule, context) {
  // Get expected value from context
  const expected = context[fieldId];
  if (expected === undefined) {
    console.warn(`[Grading] No expected value for ${fieldId} in context`);
    return { score: 'I', feedback: 'Unable to grade - missing expected value' };
  }

  // Parse answer
  const userValue = parseInt(answer, 10);
  const expectedValue = parseInt(expected, 10);

  console.log(`[Grading ${fieldId}] User: ${userValue}, Expected: ${expectedValue}`);

  if (isNaN(userValue)) {
    return { score: 'I', feedback: 'Please enter a number' };
  }

  if (userValue === expectedValue) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  return { score: 'I', feedback: rule.feedback.I };
}

/**
 * Grade exact string match
 * For dropdown selections like "Yes (negative radicand)" / "No (positive radicand)"
 */
function gradeExactMatch(fieldId, answer, rule, context) {
  const expected = context[fieldId];
  if (expected === undefined) {
    console.warn(`[Grading] No expected value for ${fieldId} in context`);
    return { score: 'I', feedback: 'Unable to grade - missing expected value' };
  }

  console.log(`[Grading ${fieldId}] User: "${answer}", Expected: "${expected}"`);

  if (answer === expected) {
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

  if (rule.type === 'visual-radical') {
    return gradeVisualRadical(answer, rule, context);
  }

  if (rule.type === 'visual-radical-prime') {
    return gradeVisualRadicalPrime(answer, rule, context);
  }

  if (rule.type === 'visual-radical-complex') {
    return gradeVisualRadicalComplex(answer, rule, context);
  }

  if (rule.type === 'numeric-exact') {
    return gradeNumericExact(fieldId, answer, rule, context);
  }

  if (rule.type === 'exact-match') {
    return gradeExactMatch(fieldId, answer, rule, context);
  }

  return { score: 'I', feedback: 'Unknown rule type' };
}

export default { getRule, gradeField };
