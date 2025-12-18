/**
 * Leverage & Influential Points - Grading Rules
 * Handles grading for multiple-choice and numeric answers about leverage and influence
 */

/**
 * Tolerance definitions for numeric answers
 */
const TOLERANCES = {
  tight: {
    absolute: 0.01,
    relative: 0.01
  },
  standard: {
    absolute: 0.05,
    relative: 0.02
  },
  loose: {
    absolute: 0.1,
    relative: 0.05
  }
};

/**
 * Partial credit tolerances
 */
const PARTIAL_TOLERANCES = {
  absolute: 0.15,
  relative: 0.08
};

/**
 * Grade a multiple choice answer
 * @param {string} studentAnswer - Student's selected answer
 * @param {string} expectedAnswer - Correct answer
 * @returns {Object} Grading result with score and feedback
 */
export function gradeMultipleChoice(studentAnswer, expectedAnswer) {
  if (!studentAnswer) {
    return {
      score: 'I',
      feedback: 'No answer selected',
      details: { studentAnswer: null, expectedAnswer }
    };
  }

  const student = String(studentAnswer).toLowerCase().trim();
  const expected = String(expectedAnswer).toLowerCase().trim();
  const isCorrect = student === expected;

  return {
    score: isCorrect ? 'E' : 'I',
    feedback: isCorrect ? 'Correct!' : `The correct answer is: ${expectedAnswer}`,
    details: { studentAnswer, expectedAnswer }
  };
}

/**
 * Grade a classification answer (leverage-residual combo like "high-high")
 * @param {string} studentAnswer - Student's classification
 * @param {string} expectedAnswer - Correct classification
 * @returns {Object} Grading result with score and feedback
 */
export function gradeClassification(studentAnswer, expectedAnswer) {
  if (!studentAnswer) {
    return {
      score: 'I',
      feedback: 'No classification selected',
      details: { studentAnswer: null, expectedAnswer }
    };
  }

  const student = String(studentAnswer).toLowerCase().trim();
  const expected = String(expectedAnswer).toLowerCase().trim();

  if (student === expected) {
    return {
      score: 'E',
      feedback: 'Correct classification!',
      details: { studentAnswer, expectedAnswer }
    };
  }

  // Check for partial credit - got one dimension right
  const studentParts = student.split('-');
  const expectedParts = expected.split('-');

  if (studentParts.length === 2 && expectedParts.length === 2) {
    const leverageMatch = studentParts[0] === expectedParts[0];
    const residualMatch = studentParts[1] === expectedParts[1];

    if (leverageMatch || residualMatch) {
      const wrongPart = leverageMatch ? 'residual size' : 'leverage';
      return {
        score: 'P',
        feedback: `Partially correct - check the ${wrongPart} assessment. Expected: ${expectedAnswer}`,
        details: { studentAnswer, expectedAnswer, leverageMatch, residualMatch }
      };
    }
  }

  return {
    score: 'I',
    feedback: `Incorrect. The correct classification is: ${expectedAnswer}`,
    details: { studentAnswer, expectedAnswer }
  };
}

/**
 * Grade a numeric answer
 * @param {number|string} studentAnswer - Student's numeric answer
 * @param {number} expectedAnswer - Correct answer
 * @param {string} toleranceLevel - 'tight', 'standard', or 'loose'
 * @returns {Object} Grading result with score and feedback
 */
export function gradeNumeric(studentAnswer, expectedAnswer, toleranceLevel = 'standard') {
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
    return {
      score: 'P',
      feedback: `Close! Your answer: ${student.toFixed(3)}, expected: ${expected.toFixed(3)}`,
      details: { studentAnswer: student, expectedAnswer: expected, difference: absoluteDiff }
    };
  }

  // Incorrect
  return {
    score: 'I',
    feedback: `Incorrect. Your answer: ${student.toFixed(3)}, expected: ${expected.toFixed(3)}`,
    details: { studentAnswer: student, expectedAnswer: expected, difference: absoluteDiff }
  };
}

/**
 * Grade an effect prediction (increase/decrease/same)
 * @param {string} studentAnswer - Student's prediction
 * @param {string} expectedAnswer - Correct effect
 * @returns {Object} Grading result with score and feedback
 */
export function gradeEffectPrediction(studentAnswer, expectedAnswer) {
  if (!studentAnswer) {
    return {
      score: 'I',
      feedback: 'No prediction selected',
      details: { studentAnswer: null, expectedAnswer }
    };
  }

  const student = String(studentAnswer).toLowerCase().trim();
  const expected = String(expectedAnswer).toLowerCase().trim();

  if (student === expected) {
    return {
      score: 'E',
      feedback: 'Correct prediction!',
      details: { studentAnswer, expectedAnswer }
    };
  }

  // Partial credit: if expected is "same" and student said increase/decrease (or vice versa)
  // No partial credit - these are conceptual questions
  return {
    score: 'I',
    feedback: `Incorrect. The effect would be: ${expectedAnswer}`,
    details: { studentAnswer, expectedAnswer }
  };
}

/**
 * Main grading entry point - called by platform for each field
 * @param {string} fieldId - The field being graded
 * @param {any} answer - The student's answer
 * @param {Object} context - Problem context including expected answers
 * @returns {Object} { score: 'E'|'P'|'I', feedback: string }
 */
export function gradeField(fieldId, answer, context) {
  // Find expected answer - check various possible locations
  let expectedData = context[fieldId];

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

  // Get expected value
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
  const classificationFields = ['classification'];
  const effectFields = ['slopeEffect', 'rEffect', 'r2Effect'];
  const mcFields = ['leverage', 'residualSize', 'isInfluential', 'influential'];
  const numericFields = ['slopeChange', 'rChange'];

  if (classificationFields.includes(fieldId)) {
    return gradeClassification(answer, expected);
  } else if (effectFields.includes(fieldId)) {
    return gradeEffectPrediction(answer, expected);
  } else if (mcFields.includes(fieldId)) {
    return gradeMultipleChoice(answer, expected);
  } else if (numericFields.includes(fieldId)) {
    return gradeNumeric(answer, expected, 'standard');
  } else {
    // Default to multiple choice
    return gradeMultipleChoice(answer, expected);
  }
}

/**
 * Get grading rule for a field
 * @param {string} fieldId - The field to get rule for
 * @returns {Object|null} Grading rule configuration
 */
export function getRule(fieldId) {
  const classificationFields = ['classification'];
  const effectFields = ['slopeEffect', 'rEffect', 'r2Effect'];
  const mcFields = ['leverage', 'residualSize', 'isInfluential', 'influential'];
  const numericFields = ['slopeChange', 'rChange'];

  if (classificationFields.includes(fieldId)) {
    return { type: 'classification' };
  }
  if (effectFields.includes(fieldId)) {
    return { type: 'effect' };
  }
  if (mcFields.includes(fieldId)) {
    return { type: 'exact' };
  }
  if (numericFields.includes(fieldId)) {
    return { type: 'numeric', tolerance: 'standard' };
  }
  return { type: 'exact' };
}

/**
 * Grade a complete problem (multiple fields)
 * @param {Object} studentAnswers - All student answers keyed by fieldId
 * @param {Object} validation - Validation config for each field
 * @param {string} modeId - The current mode
 * @returns {Object} Complete grading result
 */
export function gradeProblem(studentAnswers, validation, modeId) {
  const results = {};
  let allE = true;
  let anyE = false;
  let anyP = false;

  for (const [fieldId, validationConfig] of Object.entries(validation)) {
    const studentAnswer = studentAnswers[fieldId];
    const expected = validationConfig.expected;

    let result;
    if (validationConfig.type === 'exact') {
      result = gradeMultipleChoice(studentAnswer, expected);
    } else if (validationConfig.tolerance) {
      result = gradeNumeric(studentAnswer, expected, validationConfig.tolerance);
    } else {
      result = gradeField(fieldId, studentAnswer, { [fieldId]: { value: expected } });
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
  const starTier = determineStarTier(results);

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
function determineStarTier(results) {
  const scores = Object.values(results).map(r => r.score);
  const eCount = scores.filter(s => s === 'E').length;
  const pCount = scores.filter(s => s === 'P').length;
  const totalFields = scores.length;

  // All E = Gold
  if (eCount === totalFields) {
    return 'gold';
  }

  // All E or P (no I), at most 1 P = Silver
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
 * Generate composite feedback for multi-field problems
 */
function generateCompositeFeedback(results, modeId) {
  const fieldResults = Object.entries(results);
  const allCorrect = fieldResults.every(([_, r]) => r.score === 'E');

  if (allCorrect) {
    const messages = {
      'identify-leverage': 'Correct! You correctly identified the leverage.',
      'identify-outlier': 'Correct! You correctly identified the residual size.',
      'classify-point': 'Perfect classification! You understand leverage and residuals.',
      'predict-slope-effect': 'Correct! You understand how this point affects the slope.',
      'predict-r-effect': 'Correct! You understand how this point affects correlation.',
      'influential-analysis': 'Excellent complete analysis!',
      'compare-with-without': 'Perfect! You calculated the changes correctly.'
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
    leverage: 'Leverage',
    residualSize: 'Residual size',
    classification: 'Classification',
    slopeEffect: 'Slope effect',
    rEffect: 'r effect',
    r2Effect: 'r² effect',
    isInfluential: 'Influential?',
    influential: 'Influential?',
    slopeChange: 'Slope change',
    rChange: 'r change'
  };
  return names[fieldId] || fieldId;
}

export default {
  gradeField,
  getRule,
  gradeMultipleChoice,
  gradeNumeric,
  gradeClassification,
  gradeEffectPrediction,
  gradeProblem,
  TOLERANCES
};
