/**
 * Leverage & Influential Points - Grading Rules
 * Computes correct answers in REAL-TIME from actual data points
 * Does NOT rely on pre-computed expected values
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

// ============ STATISTICAL CALCULATIONS ============

/**
 * Calculate regression statistics from points
 * @param {Array} points - Array of {x, y} objects
 * @returns {Object} { slope, intercept, r, xMean, yMean, sx, sy }
 */
function calculateRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r: 0, xMean: 0, yMean: 0, sx: 0, sy: 0 };

  let sumX = 0, sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }

  const xMean = sumX / n;
  const yMean = sumY / n;

  let ssX = 0, ssY = 0, ssXY = 0;
  for (const p of points) {
    ssX += (p.x - xMean) ** 2;
    ssY += (p.y - yMean) ** 2;
    ssXY += (p.x - xMean) * (p.y - yMean);
  }

  const slope = ssX > 0 ? ssXY / ssX : 0;
  const intercept = yMean - slope * xMean;
  const r = (ssX > 0 && ssY > 0) ? ssXY / Math.sqrt(ssX * ssY) : 0;
  const sx = Math.sqrt(ssX / (n - 1));
  const sy = Math.sqrt(ssY / (n - 1));

  return { slope, intercept, r, xMean, yMean, sx, sy, n };
}

/**
 * Round to specified decimal places
 */
function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Compute the correct answers from raw data in context
 * This is the KEY function that calculates everything in real-time
 */
function computeCorrectAnswers(context) {
  const result = {
    leverage: null,
    residualSize: null,
    classification: null,
    slopeEffect: null,
    rEffect: null,
    r2Effect: null,
    isInfluential: null,
    slopeChange: null,
    rChange: null,
    influential: null
  };

  // Handle compare-with-without mode (no graph, uses given values)
  if (context.modeId === 'compare-with-without') {
    if (context.slopeWith !== undefined && context.slopeWithout !== undefined) {
      result.slopeChange = roundTo(context.slopeWith - context.slopeWithout, 2);
    }
    if (context.rWith !== undefined && context.rWithout !== undefined) {
      result.rChange = roundTo(Math.abs(context.rWith) - Math.abs(context.rWithout), 2);
    }
    // Influential threshold: |slope change| >= 0.2 OR |r change| >= 0.1
    if (result.slopeChange !== null && result.rChange !== null) {
      const isInfluentialCalc = Math.abs(result.slopeChange) >= 0.2 || Math.abs(result.rChange) >= 0.1;
      result.influential = isInfluentialCalc ? 'yes' : 'no';
    }
    console.log('[Grading] compare-with-without computed:', result);
    return result;
  }

  // Get data from graphConfig if available
  const graphConfig = context.graphConfig;
  if (!graphConfig || !graphConfig.points) {
    // Fall back to pre-computed values if no raw data
    return null;
  }

  const allPoints = graphConfig.points;
  const highlightIndex = graphConfig.highlight?.index;

  if (highlightIndex === undefined || highlightIndex === null) {
    return null;
  }

  // Separate the highlighted point from the rest
  const highlightedPoint = allPoints[highlightIndex];
  const pointsWithout = allPoints.filter((_, i) => i !== highlightIndex);

  // Calculate stats WITH the highlighted point (all points)
  const statsWith = calculateRegression(allPoints);
  // Calculate stats WITHOUT the highlighted point
  const statsWithout = calculateRegression(pointsWithout);

  // ---- LEVERAGE ----
  // High leverage if x is far from x̄
  const xDistance = Math.abs(highlightedPoint.x - statsWith.xMean);
  const xSpread = statsWith.sx * Math.sqrt(statsWith.n - 1); // total spread
  const leverageThreshold = xSpread * 0.4; // 40% of spread = high leverage
  result.leverage = xDistance > leverageThreshold ? 'high' : 'low';

  // ---- RESIDUAL SIZE ----
  // Large residual if point is far from the regression line
  const predictedY = statsWith.intercept + statsWith.slope * highlightedPoint.x;
  const residual = highlightedPoint.y - predictedY;
  const absResidual = Math.abs(residual);

  // Calculate typical residual size (use RMSE-like measure)
  let sumSquaredResiduals = 0;
  for (const p of allPoints) {
    const pred = statsWith.intercept + statsWith.slope * p.x;
    sumSquaredResiduals += (p.y - pred) ** 2;
  }
  const typicalResidual = Math.sqrt(sumSquaredResiduals / allPoints.length);
  const residualThreshold = typicalResidual * 1.5; // 1.5x typical = large
  result.residualSize = absResidual > residualThreshold ? 'large' : 'small';

  // ---- CLASSIFICATION ----
  result.classification = `${result.leverage}-${result.residualSize === 'large' ? 'high' : 'low'}`;

  // ---- SLOPE EFFECT ----
  // If we remove the point, what happens to slope?
  const slopeDiff = statsWith.slope - statsWithout.slope;
  if (Math.abs(slopeDiff) < 0.05) {
    result.slopeEffect = 'same';
  } else if (slopeDiff > 0) {
    // Point increases slope, removing decreases it
    result.slopeEffect = 'decrease';
  } else {
    // Point decreases slope, removing increases it
    result.slopeEffect = 'increase';
  }

  // ---- R EFFECT ----
  // If we remove the point, what happens to |r|?
  const rDiff = Math.abs(statsWith.r) - Math.abs(statsWithout.r);
  if (Math.abs(rDiff) < 0.02) {
    result.rEffect = 'same';
  } else if (rDiff > 0) {
    // Point strengthens r, removing weakens it
    result.rEffect = 'decrease';
  } else {
    // Point weakens r, removing strengthens it
    result.rEffect = 'increase';
  }

  // r² follows |r|
  result.r2Effect = result.rEffect;

  // ---- INFLUENTIAL ----
  // A point is influential if it has high leverage AND large residual
  // OR if removing it substantially changes the regression
  const isInfluential = (result.leverage === 'high' && result.residualSize === 'large') ||
    Math.abs(slopeDiff) > 0.1 ||
    Math.abs(rDiff) > 0.05;
  result.isInfluential = isInfluential ? 'yes' : 'no';

  // ---- NUMERIC CALCULATIONS (for compare-with-without mode) ----
  // These use the given values, not computed ones
  if (context.slopeWith !== undefined && context.slopeWithout !== undefined) {
    result.slopeChange = roundTo(context.slopeWith - context.slopeWithout, 2);
  }
  if (context.rWith !== undefined && context.rWithout !== undefined) {
    result.rChange = roundTo(Math.abs(context.rWith) - Math.abs(context.rWithout), 2);
  }

  // For the "influential" field in compare-with-without mode
  // Use thresholds: |slope change| >= 0.2 OR |r change| >= 0.1
  if (result.slopeChange !== null && result.rChange !== null) {
    const isInfluentialCalc = Math.abs(result.slopeChange) >= 0.2 || Math.abs(result.rChange) >= 0.1;
    result.influential = isInfluentialCalc ? 'yes' : 'no';
  }

  return result;
}

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
      feedback: 'No answer selected. Please select an option.',
      details: { studentAnswer: null, expectedAnswer }
    };
  }

  const student = String(studentAnswer).toLowerCase().trim();
  const expected = String(expectedAnswer).toLowerCase().trim();
  const isCorrect = student === expected;

  // Provide helpful feedback with capitalized answer
  const displayExpected = expected.charAt(0).toUpperCase() + expected.slice(1);

  return {
    score: isCorrect ? 'E' : 'I',
    feedback: isCorrect ? 'Correct!' : `Incorrect. The answer is: <strong>${displayExpected}</strong>`,
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
      feedback: 'No classification selected. Please choose a classification.',
      details: { studentAnswer: null, expectedAnswer }
    };
  }

  const student = String(studentAnswer).toLowerCase().trim();
  const expected = String(expectedAnswer).toLowerCase().trim();

  // Human-readable classification names
  const classificationNames = {
    'low-low': 'Low leverage, small residual',
    'low-high': 'Low leverage, large residual',
    'high-low': 'High leverage, small residual',
    'high-high': 'High leverage, large residual (INFLUENTIAL)'
  };

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
      const displayName = classificationNames[expected] || expected;
      return {
        score: 'P',
        feedback: `Partially correct - recheck the ${wrongPart}. Correct: <strong>${displayName}</strong>`,
        details: { studentAnswer, expectedAnswer, leverageMatch, residualMatch }
      };
    }
  }

  const displayName = classificationNames[expected] || expected;
  return {
    score: 'I',
    feedback: `Incorrect. The correct classification is: <strong>${displayName}</strong>`,
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
      feedback: 'No prediction selected. Please choose an option.',
      details: { studentAnswer: null, expectedAnswer }
    };
  }

  const student = String(studentAnswer).toLowerCase().trim();
  const expected = String(expectedAnswer).toLowerCase().trim();

  // More helpful effect descriptions
  const effectDescriptions = {
    'increase': 'Increase',
    'decrease': 'Decrease',
    'same': 'Stay about the same'
  };

  if (student === expected) {
    return {
      score: 'E',
      feedback: 'Correct prediction!',
      details: { studentAnswer, expectedAnswer }
    };
  }

  const displayExpected = effectDescriptions[expected] || expected;
  return {
    score: 'I',
    feedback: `Incorrect. Removing this point would cause the value to: <strong>${displayExpected}</strong>`,
    details: { studentAnswer, expectedAnswer }
  };
}

/**
 * Main grading entry point - called by platform for each field
 * COMPUTES correct answers in real-time from raw data
 *
 * @param {string} fieldId - The field being graded
 * @param {any} answer - The student's answer
 * @param {Object} context - Problem context including graphConfig with raw data
 * @returns {Object} { score: 'E'|'P'|'I', feedback: string }
 */
export function gradeField(fieldId, answer, context) {
  // FIRST: Try to compute the correct answer from raw data
  const computed = computeCorrectAnswers(context);

  let expected = null;
  let source = 'computed';

  // Use computed value if available
  if (computed && computed[fieldId] !== null && computed[fieldId] !== undefined) {
    expected = computed[fieldId];
    console.log(`[Grading] ${fieldId}: computed answer = "${expected}" from raw data`);
  } else {
    // Fall back to pre-computed values in context
    source = 'fallback';
    let expectedData = context[fieldId];

    if (!expectedData && context.answers) {
      expectedData = context.answers[fieldId];
    }
    if (!expectedData && context.validation) {
      expectedData = context.validation[fieldId];
    }

    if (expectedData !== undefined && expectedData !== null) {
      if (typeof expectedData === 'object' && expectedData !== null) {
        expected = expectedData.value !== undefined ? expectedData.value : expectedData.expected;
      } else {
        expected = expectedData;
      }
    }

    console.log(`[Grading] ${fieldId}: using fallback answer = "${expected}"`);
  }

  if (expected === undefined || expected === null) {
    return {
      score: 'I',
      feedback: `Unable to grade - could not determine correct answer for ${fieldId}`
    };
  }

  // Log the comparison for debugging
  console.log(`[Grading] ${fieldId}: student="${answer}" vs expected="${expected}" (${source})`);

  // Determine grading type based on field
  const classificationFields = ['classification'];
  const effectFields = ['slopeEffect', 'rEffect', 'r2Effect'];
  const mcFields = ['leverage', 'residualSize', 'isInfluential', 'influential'];
  const numericFields = ['slopeChange', 'rChange'];

  let result;
  if (classificationFields.includes(fieldId)) {
    result = gradeClassification(answer, expected);
  } else if (effectFields.includes(fieldId)) {
    result = gradeEffectPrediction(answer, expected);
  } else if (mcFields.includes(fieldId)) {
    result = gradeMultipleChoice(answer, expected);
  } else if (numericFields.includes(fieldId)) {
    result = gradeNumeric(answer, expected, 'standard');
  } else {
    // Default to multiple choice
    result = gradeMultipleChoice(answer, expected);
  }

  // Add debug info to result
  result._computed = source === 'computed';
  result._expected = expected;

  return result;
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
