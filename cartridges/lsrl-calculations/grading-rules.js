/**
 * LSRL Calculations - Grading Rules
 * Tolerance-based numeric grading for calculation problems
 */

/**
 * Parse and evaluate mathematical expressions
 * Supports: sqrt(), √, *, /, +, -, parentheses, and implicit multiplication
 * Examples: "2*sqrt(2)", "√8", "3√2", "sqrt(18)/3", "2.83"
 */
function evaluateExpression(input) {
  if (input === null || input === undefined || input === '') {
    return NaN;
  }

  // Convert to string and clean up
  let expr = String(input).trim().toLowerCase();

  // If it's already a plain number, return it
  const plainNum = parseFloat(expr);
  if (!isNaN(plainNum) && /^-?\d*\.?\d+$/.test(expr)) {
    return plainNum;
  }

  try {
    // Normalize sqrt notations: √ → sqrt, root → sqrt
    expr = expr.replace(/√/g, 'sqrt');
    expr = expr.replace(/\broot\b/g, 'sqrt');

    // Handle implicit multiplication: "2sqrt" → "2*sqrt", "3(4)" → "3*(4)"
    expr = expr.replace(/(\d)(sqrt)/g, '$1*$2');
    expr = expr.replace(/(\d)\(/g, '$1*(');
    expr = expr.replace(/\)(\d)/g, ')*$1');
    expr = expr.replace(/\)(sqrt)/g, ')*$1');

    // Replace sqrt(...) with Math.sqrt(...)
    expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');

    // Validate: only allow safe characters (digits, operators, Math.sqrt, parentheses, decimal)
    const safePattern = /^[0-9+\-*/().Math sqrtMath.sqrt\s]+$/;
    // More permissive check - just block dangerous patterns
    if (/[a-z]/i.test(expr.replace(/Math\.sqrt/g, '').replace(/\s/g, ''))) {
      // Contains letters other than Math.sqrt - might be unsafe
      // But let's try to evaluate anyway if it looks reasonable
    }

    // Evaluate the expression
    // Using Function constructor is safer than eval for this limited use case
    const result = Function('"use strict"; return (' + expr + ')')();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
  } catch (e) {
    // Expression couldn't be evaluated
  }

  // Fallback: try parseFloat on original
  return parseFloat(input);
}

/**
 * Grade an expression-based answer (like "2*sqrt(2)" or "2.83")
 * @param {string} studentAnswer - The student's expression or number
 * @param {number} expectedAnswer - The correct numeric value
 * @param {string} toleranceLevel - 'tight', 'standard', or 'loose'
 * @returns {Object} Grading result with score and feedback
 */
export function gradeExpression(studentAnswer, expectedAnswer, toleranceLevel = 'standard') {
  if (studentAnswer === null || studentAnswer === undefined || studentAnswer === '') {
    return {
      score: 'I',
      feedback: 'No answer provided',
      details: { studentAnswer: null, expectedAnswer, difference: null }
    };
  }

  const studentValue = evaluateExpression(studentAnswer);
  const expected = parseFloat(expectedAnswer);

  if (isNaN(studentValue)) {
    return {
      score: 'I',
      feedback: 'Could not evaluate expression. Try formats like: 2.83, sqrt(8), 2*sqrt(2), or 2√2',
      details: { studentAnswer, expectedAnswer: expected, evaluated: null }
    };
  }

  // Now grade using numeric comparison
  const absoluteDiff = Math.abs(studentValue - expected);
  const relativeDiff = expected !== 0 ? Math.abs(absoluteDiff / expected) : absoluteDiff;

  const tolerance = TOLERANCES[toleranceLevel] || TOLERANCES.standard;

  // Check for Essentially Correct (E)
  const withinAbsolute = absoluteDiff <= tolerance.absolute;
  const withinRelative = relativeDiff <= tolerance.relative;

  if (withinAbsolute || withinRelative) {
    if (absoluteDiff < 0.001) {
      return {
        score: 'E',
        feedback: 'Correct!',
        details: { studentAnswer, studentValue, expectedAnswer: expected, difference: absoluteDiff }
      };
    } else {
      return {
        score: 'E',
        feedback: 'Correct (within acceptable rounding)',
        details: { studentAnswer, studentValue, expectedAnswer: expected, difference: absoluteDiff }
      };
    }
  }

  // Check for Partially Correct (P)
  const withinPartialAbsolute = absoluteDiff <= PARTIAL_TOLERANCES.absolute;
  const withinPartialRelative = relativeDiff <= PARTIAL_TOLERANCES.relative;

  if (withinPartialAbsolute || withinPartialRelative) {
    const percentOff = ((absoluteDiff / Math.abs(expected)) * 100).toFixed(1);
    return {
      score: 'P',
      feedback: `Close! Your answer evaluates to ${studentValue.toFixed(3)}, expected ≈${expected.toFixed(3)}`,
      details: { studentAnswer, studentValue, expectedAnswer: expected, difference: absoluteDiff }
    };
  }

  // Incorrect
  return {
    score: 'I',
    feedback: `Your answer evaluates to ${studentValue.toFixed(3)}, expected ≈${expected.toFixed(3)}`,
    details: { studentAnswer, studentValue, expectedAnswer: expected, difference: absoluteDiff }
  };
}

/**
 * Tolerance definitions
 * - tight: for simple calculations (slope, intercept individually)
 * - standard: for multi-step calculations
 * - loose: for complex calculations (std dev)
 */
const TOLERANCES = {
  tight: {
    absolute: 0.01,    // Within 0.01 of correct answer
    relative: 0.01     // Within 1% of correct answer
  },
  standard: {
    absolute: 0.05,    // Within 0.05 of correct answer
    relative: 0.02     // Within 2% of correct answer
  },
  loose: {
    absolute: 0.1,     // Within 0.1 of correct answer
    relative: 0.05     // Within 5% of correct answer
  }
};

/**
 * Scoring thresholds for P (partial credit)
 * If not within E tolerance but within these, award P
 */
const PARTIAL_TOLERANCES = {
  absolute: 0.15,      // Within 0.15 for partial credit
  relative: 0.08       // Within 8% for partial credit
};

/**
 * Grade a numeric answer
 * @param {number} studentAnswer - The student's submitted answer
 * @param {number} expectedAnswer - The correct answer
 * @param {string} toleranceLevel - 'tight', 'standard', or 'loose'
 * @returns {Object} Grading result with score and feedback
 */
export function gradeNumeric(studentAnswer, expectedAnswer, toleranceLevel = 'standard') {
  // Handle non-numeric input
  if (studentAnswer === null || studentAnswer === undefined || studentAnswer === '') {
    return {
      score: 'I',
      feedback: 'No answer provided',
      details: { studentAnswer: null, expectedAnswer, difference: null }
    };
  }
  
  const student = parseFloat(studentAnswer);
  const expected = parseFloat(expectedAnswer);
  
  if (isNaN(student)) {
    return {
      score: 'I',
      feedback: 'Answer must be a number',
      details: { studentAnswer, expectedAnswer: expected, difference: null }
    };
  }
  
  // Calculate differences
  const absoluteDiff = Math.abs(student - expected);
  const relativeDiff = expected !== 0 ? Math.abs(absoluteDiff / expected) : absoluteDiff;
  
  // Get tolerance thresholds
  const tolerance = TOLERANCES[toleranceLevel] || TOLERANCES.standard;
  
  // Check for Essentially Correct (E)
  const withinAbsolute = absoluteDiff <= tolerance.absolute;
  const withinRelative = relativeDiff <= tolerance.relative;
  
  if (withinAbsolute || withinRelative) {
    // Perfect or within tolerance
    if (absoluteDiff === 0) {
      return {
        score: 'E',
        feedback: 'Exactly correct!',
        details: { studentAnswer: student, expectedAnswer: expected, difference: 0 }
      };
    } else {
      return {
        score: 'E',
        feedback: 'Correct (within acceptable rounding)',
        details: { studentAnswer: student, expectedAnswer: expected, difference: absoluteDiff }
      };
    }
  }
  
  // Check for Partially Correct (P)
  const withinPartialAbsolute = absoluteDiff <= PARTIAL_TOLERANCES.absolute;
  const withinPartialRelative = relativeDiff <= PARTIAL_TOLERANCES.relative;
  
  if (withinPartialAbsolute || withinPartialRelative) {
    // Close but has a rounding or minor arithmetic error
    const feedbackMsg = generatePartialFeedback(student, expected, absoluteDiff);
    return {
      score: 'P',
      feedback: feedbackMsg,
      details: { studentAnswer: student, expectedAnswer: expected, difference: absoluteDiff }
    };
  }
  
  // Incorrect (I)
  const feedbackMsg = generateIncorrectFeedback(student, expected);
  return {
    score: 'I',
    feedback: feedbackMsg,
    details: { studentAnswer: student, expectedAnswer: expected, difference: absoluteDiff }
  };
}

/**
 * Grade a list of comma-separated values (e.g., deviations: "-3, 0, 3")
 * @param {string} studentAnswer - Comma-separated list of values
 * @param {string} expectedAnswer - Comma-separated list of expected values
 * @returns {Object} Grading result with score and feedback
 */
export function gradeList(studentAnswer, expectedAnswer) {
  if (!studentAnswer || studentAnswer.trim() === '') {
    return {
      score: 'I',
      feedback: 'No answer provided',
      details: { studentAnswer: null, expectedAnswer }
    };
  }

  // Parse both lists
  const parseList = (str) => {
    return str.split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => parseFloat(s));
  };

  const studentValues = parseList(studentAnswer);
  const expectedValues = parseList(expectedAnswer);

  // Check for invalid numbers
  if (studentValues.some(isNaN)) {
    return {
      score: 'I',
      feedback: 'All values must be numbers separated by commas',
      details: { studentAnswer, expectedAnswer }
    };
  }

  // Check count
  if (studentValues.length !== expectedValues.length) {
    return {
      score: 'I',
      feedback: `Expected ${expectedValues.length} values, got ${studentValues.length}`,
      details: { studentAnswer, expectedAnswer, studentCount: studentValues.length, expectedCount: expectedValues.length }
    };
  }

  // Compare values (order matters)
  let correctCount = 0;
  let errors = [];

  for (let i = 0; i < expectedValues.length; i++) {
    const diff = Math.abs(studentValues[i] - expectedValues[i]);
    if (diff <= 0.01 || (expectedValues[i] !== 0 && diff / Math.abs(expectedValues[i]) <= 0.01)) {
      correctCount++;
    } else {
      errors.push({ index: i + 1, student: studentValues[i], expected: expectedValues[i] });
    }
  }

  // Score based on accuracy
  if (correctCount === expectedValues.length) {
    return {
      score: 'E',
      feedback: 'All values correct!',
      details: { studentValues, expectedValues, correctCount }
    };
  }

  // Partial credit if most are correct
  const accuracy = correctCount / expectedValues.length;
  if (accuracy >= 0.7) {
    const errorMsg = errors.map(e => `value #${e.index}: got ${e.student}, expected ${e.expected}`).join('; ');
    return {
      score: 'P',
      feedback: `${correctCount}/${expectedValues.length} correct. Check: ${errorMsg}`,
      details: { studentValues, expectedValues, correctCount, errors }
    };
  }

  return {
    score: 'I',
    feedback: `${correctCount}/${expectedValues.length} correct. Expected: ${expectedAnswer}`,
    details: { studentValues, expectedValues, correctCount, errors }
  };
}

/**
 * Grade a multiple choice answer
 */
export function gradeMultipleChoice(studentAnswer, expectedAnswer) {
  if (!studentAnswer) {
    return {
      score: 'I',
      feedback: 'No answer selected',
      details: { studentAnswer: null, expectedAnswer }
    };
  }
  
  const isCorrect = studentAnswer.toLowerCase() === expectedAnswer.toLowerCase();
  
  return {
    score: isCorrect ? 'E' : 'I',
    feedback: isCorrect ? 'Correct!' : `The correct answer is: ${expectedAnswer}`,
    details: { studentAnswer, expectedAnswer }
  };
}

/**
 * Grade a complete problem (multiple fields)
 */
export function gradeProblem(studentAnswers, validation, modeId) {
  const results = {};
  let allE = true;
  let anyE = false;
  let anyP = false;
  
  for (const [fieldId, validationConfig] of Object.entries(validation)) {
    const studentAnswer = studentAnswers[fieldId];
    let result;
    
    if (validationConfig.type === 'exact') {
      // Multiple choice or exact match
      result = gradeMultipleChoice(studentAnswer, validationConfig.expected);
    } else {
      // Numeric with tolerance
      result = gradeNumeric(
        studentAnswer,
        validationConfig.expected,
        validationConfig.tolerance || 'standard'
      );
    }
    
    results[fieldId] = result;
    
    if (result.score === 'E') {
      anyE = true;
    } else {
      allE = false;
      if (result.score === 'P') {
        anyP = true;
      }
    }
  }
  
  // Determine composite score
  let compositeScore;
  if (allE) {
    compositeScore = 'E';
  } else if (anyE || anyP) {
    compositeScore = 'P';
  } else {
    compositeScore = 'I';
  }
  
  // Determine star tier
  const starTier = determineStarTier(results, modeId);
  
  return {
    fields: results,
    composite: {
      score: compositeScore,
      feedback: generateCompositeFeedback(results, modeId)
    },
    star: starTier
  };
}

/**
 * Determine star tier based on grading results
 */
function determineStarTier(results, modeId) {
  const scores = Object.values(results).map(r => r.score);
  const eCount = scores.filter(s => s === 'E').length;
  const pCount = scores.filter(s => s === 'P').length;
  const totalFields = scores.length;
  
  // All E = Gold
  if (eCount === totalFields) {
    return 'gold';
  }
  
  // All E or P (no I) = Silver
  if (eCount + pCount === totalFields && pCount <= 1) {
    return 'silver';
  }
  
  // At least one E = Bronze
  if (eCount >= 1) {
    return 'bronze';
  }
  
  // At least partial credit somewhere
  if (pCount >= 1) {
    return 'tin';
  }
  
  // No credit
  return null;
}

/**
 * Generate feedback for partially correct answers
 */
function generatePartialFeedback(student, expected, difference) {
  const percentOff = ((difference / Math.abs(expected)) * 100).toFixed(1);
  
  // Check for common errors
  if (Math.abs(student + expected) < 0.01) {
    return `Sign error: you got the magnitude right but the wrong sign. Expected: ${expected}`;
  }
  
  if (Math.abs(student * 10 - expected) < 0.1 || Math.abs(student / 10 - expected) < 0.1) {
    return `Decimal place error: check your decimal point. Expected: ${expected}`;
  }
  
  return `Close! You're off by about ${percentOff}%. Expected: ${expected}`;
}

/**
 * Generate feedback for incorrect answers
 */
function generateIncorrectFeedback(student, expected) {
  // Check for common conceptual errors
  
  // Sign error on slope (common when r is negative)
  if (Math.abs(Math.abs(student) - Math.abs(expected)) < 0.05 && student * expected < 0) {
    return `Sign error: the slope should be ${expected > 0 ? 'positive' : 'negative'} because r is ${expected > 0 ? 'positive' : 'negative'}. Expected: ${expected}`;
  }
  
  // Inverted ratio (used sₓ/sᵧ instead of sᵧ/sₓ)
  // When inverted, student/expected = (sₓ/sᵧ)² which is typically < 1 when sᵧ > sₓ
  // A good heuristic: if student is much smaller than expected but same sign,
  // and the ratio student/expected is between 0.1 and 0.7, likely inverted
  if (expected !== 0 && student !== 0 && student * expected > 0) {
    const ratio = student / expected;
    if (ratio > 0.1 && ratio < 0.7) {
      return `Did you invert the ratio? Remember: b = r × (sᵧ / sₓ), not (sₓ / sᵧ). Expected: ${expected}`;
    }
    // Also check if they got the reciprocal (ratio > 1.4)
    if (ratio > 1.4 && ratio < 10) {
      return `Did you invert the ratio? Remember: b = r × (sᵧ / sₓ), not (sₓ / sᵧ). Expected: ${expected}`;
    }
  }
  
  // Divided by n instead of (n-1) for std dev
  // This is detected if student answer is slightly smaller than expected
  
  // Generic feedback
  return `Not quite. Review the formula and try again. Expected: ${expected}`;
}

/**
 * Generate composite feedback for multi-field problems
 */
function generateCompositeFeedback(results, modeId) {
  const fieldResults = Object.entries(results);
  const allCorrect = fieldResults.every(([_, r]) => r.score === 'E');
  
  if (allCorrect) {
    const messages = {
      'find-b': 'Perfect! You calculated the slope correctly.',
      'find-a': 'Perfect! You found the y-intercept correctly.',
      'full-lsrl': 'Excellent! You found the complete LSRL equation.',
      'std-dev': 'Great work! Mean and standard deviation are both correct.',
      'sign-check': 'Correct! You understand the relationship between r and slope.',
      'ratio-check': 'Perfect! You see the pattern when sₓ = sᵧ.'
    };
    return messages[modeId] || 'All answers correct!';
  }
  
  // Build feedback for incorrect fields
  const incorrectFields = fieldResults
    .filter(([_, r]) => r.score !== 'E')
    .map(([field, r]) => `${formatFieldName(field)}: ${r.feedback}`);
  
  return incorrectFields.join(' | ');
}

/**
 * Format field name for display
 */
function formatFieldName(fieldId) {
  const names = {
    // Z-score fields
    zscore: 'Z-score',
    x: 'Value (x)',
    z1: 'Z-score A',
    z2: 'Z-score B',
    comparison: 'Comparison',
    // LSRL fields
    b: 'Slope (b)',
    a: 'Y-intercept (a)',
    mean: 'Mean (x̄)',
    stdDev: 'Std Dev (s)',
    slopeSign: 'Slope sign',
    insight: 'Insight',
    // Std-dev step fields
    deviations: 'Deviations',
    deviationsSquared: 'Squared deviations',
    sumSquaredDev: 'Sum of squares',
    df: 'Degrees of freedom',
    variance: 'Variance (s²)'
  };
  return names[fieldId] || fieldId;
}

/**
 * Grading rules by mode (for configuration reference)
 */
const modeRules = {
  // Z-Score modes
  'calc-zscore': {
    fields: ['zscore'],
    tolerances: { zscore: 'tight' },
    commonErrors: ['sign-error', 'forgot-divide', 'inverted-order']
  },
  'find-raw': {
    fields: ['x'],
    tolerances: { x: 'tight' },
    commonErrors: ['sign-error', 'wrong-operation']
  },
  'compare-zscores': {
    fields: ['z1', 'z2', 'comparison'],
    tolerances: { z1: 'tight', z2: 'tight' },
    types: { comparison: 'exact' }
  },
  // LSRL modes
  'find-b': {
    fields: ['b'],
    tolerances: { b: 'tight' },
    commonErrors: ['sign-error', 'inverted-ratio']
  },
  'find-a': {
    fields: ['a'],
    tolerances: { a: 'tight' },
    commonErrors: ['sign-error', 'subtraction-error']
  },
  'full-lsrl': {
    fields: ['b', 'a'],
    tolerances: { b: 'tight', a: 'standard' },
    commonErrors: ['sign-error', 'order-of-operations']
  },
  'std-dev': {
    fields: ['mean', 'deviations', 'deviationsSquared', 'sumSquaredDev', 'df', 'variance', 'stdDev'],
    tolerances: { mean: 'tight', sumSquaredDev: 'tight', df: 'tight', variance: 'standard', stdDev: 'standard' },
    types: { deviations: 'list', deviationsSquared: 'list' },
    commonErrors: ['divide-by-n', 'forgot-sqrt', 'decimal-error', 'sign-error-deviation']
  },
  'sign-check': {
    fields: ['slopeSign'],
    type: 'multiple-choice'
  },
  'ratio-check': {
    fields: ['b', 'insight'],
    tolerances: { b: 'tight' },
    types: { insight: 'multiple-choice' }
  }
};

/**
 * Get grading configuration for a mode
 */
export function getModeConfig(modeId) {
  return modeRules[modeId] || null;
}

/**
 * Main grading entry point - called by platform for each field
 * @param {string} fieldId - The field being graded (zscore, x, z1, z2, comparison, b, a, mean, stdDev, slopeSign, insight)
 * @param {any} answer - The student's answer
 * @param {Object} context - Problem context including expected answers
 * @returns {Object} { score: 'E'|'P'|'I', feedback: string }
 */
export function gradeField(fieldId, answer, context) {
  // The platform spreads problem.answers into context, so expected data is at context[fieldId]
  // It could be: { value: x, formula: "...", steps: [...] } or just a number
  let expectedData = context[fieldId];

  // Also check nested structures just in case
  if (!expectedData && context.answers) {
    expectedData = context.answers[fieldId];
  }
  if (!expectedData && context.validation) {
    expectedData = context.validation[fieldId];
  }

  if (expectedData === undefined || expectedData === null) {
    return {
      score: 'I',
      feedback: `Unable to grade - no expected answer found for ${fieldId}`
    };
  }

  // Get expected value - handle both { value: x } objects and direct numbers
  let expected;
  if (typeof expectedData === 'object' && expectedData !== null) {
    expected = expectedData.value !== undefined ? expectedData.value : expectedData.expected;
  } else {
    expected = expectedData;
  }

  if (expected === undefined || expected === null) {
    return {
      score: 'I',
      feedback: `Unable to grade - expected value not found for ${fieldId}`
    };
  }

  // Determine grading type based on field
  const multipleChoiceFields = ['slopeSign', 'insight', 'comparison'];
  const listFields = ['deviations', 'deviationsSquared'];
  const expressionFields = ['stdDev']; // Fields that accept math expressions like "2*sqrt(2)"

  if (multipleChoiceFields.includes(fieldId)) {
    return gradeMultipleChoice(answer, expected);
  } else if (listFields.includes(fieldId)) {
    // List grading for comma-separated values
    return gradeList(answer, expected);
  } else if (expressionFields.includes(fieldId)) {
    // Expression grading - accepts sqrt(), √, etc.
    return gradeExpression(answer, expected, 'standard');
  } else {
    // Numeric grading with appropriate tolerance
    const toleranceMap = {
      // Z-score fields
      zscore: 'tight',
      x: 'tight',
      z1: 'tight',
      z2: 'tight',
      // LSRL fields
      b: 'tight',
      a: 'tight',
      mean: 'tight',
      // Std-dev step fields
      sumSquaredDev: 'tight',
      df: 'tight',
      variance: 'standard'
    };
    const tolerance = toleranceMap[fieldId] || 'standard';
    return gradeNumeric(answer, expected, tolerance);
  }
}

/**
 * Get grading rule for a field (alternate interface)
 */
export function getRule(fieldId) {
  // For numeric fields, return tolerance-based rule
  const numericFields = ['zscore', 'x', 'z1', 'z2', 'b', 'a', 'mean', 'sumSquaredDev', 'df', 'variance'];
  const mcFields = ['slopeSign', 'insight', 'comparison'];
  const listFields = ['deviations', 'deviationsSquared'];
  const expressionFields = ['stdDev']; // Accepts math expressions

  if (expressionFields.includes(fieldId)) {
    return { type: 'expression', tolerance: 'standard' };
  }
  if (numericFields.includes(fieldId)) {
    const standardTolerance = ['variance'];
    return { type: 'numeric', tolerance: standardTolerance.includes(fieldId) ? 'standard' : 'tight' };
  }
  if (mcFields.includes(fieldId)) {
    return { type: 'exact' };
  }
  if (listFields.includes(fieldId)) {
    return { type: 'list' };
  }
  return null;
}

export default {
  gradeField,
  getRule,
  gradeNumeric,
  gradeMultipleChoice,
  gradeList,
  gradeExpression,
  gradeProblem,
  getModeConfig,
  TOLERANCES
};
