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
  }
};

/**
 * Grade visual radical answer
 * Answer comes as { coefficient: number, radicand: number } from RadicalVisualizer
 */
function gradeVisualRadical(answer, rule, context) {
  // Answer is an object from RadicalVisualizer.getAnswer()
  if (!answer || typeof answer !== 'object') {
    return { score: 'I', feedback: 'Please group some squares first' };
  }

  const userCoeff = answer.coefficient || 1;
  const userRadicand = answer.radicand || 0;

  // Expected values
  const expected = context.answers?.['visual-radical'] || context;
  const expectedCoeff = expected.coefficient;
  const expectedRadicand = expected.radicand;

  // Check if fully simplified (no remaining perfect square factors)
  const isFullySimplified = !hasPerfectSquareFactor(userRadicand);

  // Perfect answer: correct coefficient AND fully simplified
  if (userCoeff === expectedCoeff && userRadicand === expectedRadicand) {
    return { score: 'E', feedback: rule.feedback.E };
  }

  // Check if answer is mathematically correct (coefficient² × radicand = original)
  const totalSquares = expected.totalSquares;
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

  return { score: 'I', feedback: 'Unknown rule type' };
}

export default { getRule, gradeField };
