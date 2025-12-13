/**
 * LSRL Calculations - Grading Rules
 * Tolerance-based numeric grading for calculation problems
 */

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
  if (expected !== 0 && Math.abs(student - 1/expected) < 0.1) {
    return `Did you invert the ratio? Remember: b = r × (sᵧ / sₓ), not (sₓ / sᵧ). Expected: ${expected}`;
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
    b: 'Slope (b)',
    a: 'Y-intercept (a)',
    mean: 'Mean (x̄)',
    stdDev: 'Std Dev (s)',
    slopeSign: 'Slope sign',
    insight: 'Insight'
  };
  return names[fieldId] || fieldId;
}

/**
 * Grading rules by mode (for configuration reference)
 */
const modeRules = {
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
    fields: ['mean', 'stdDev'],
    tolerances: { mean: 'tight', stdDev: 'standard' },
    commonErrors: ['divide-by-n', 'forgot-sqrt', 'decimal-error']
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

export default { 
  gradeNumeric, 
  gradeMultipleChoice, 
  gradeProblem, 
  getModeConfig,
  TOLERANCES 
};
