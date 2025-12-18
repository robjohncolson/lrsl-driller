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
 * Compute the correct answers AND explanations from raw data in context
 * This is the KEY function that calculates everything in real-time
 * Returns both answers and explanations that mirror the hint logic
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
    influential: null,
    // Explanations for each field
    explanations: {}
  };

  // Handle compare-with-without mode (no graph, uses given values)
  if (context.modeId === 'compare-with-without') {
    const slopeWith = context.slopeWith;
    const slopeWithout = context.slopeWithout;
    const rWith = context.rWith;
    const rWithout = context.rWithout;

    if (slopeWith !== undefined && slopeWithout !== undefined) {
      result.slopeChange = roundTo(slopeWith - slopeWithout, 2);
      result.explanations.slopeChange = `Slope change = b<sub>with</sub> − b<sub>without</sub> = ${slopeWith} − ${slopeWithout} = <strong>${result.slopeChange}</strong>`;
    }
    if (rWith !== undefined && rWithout !== undefined) {
      result.rChange = roundTo(Math.abs(rWith) - Math.abs(rWithout), 2);
      result.explanations.rChange = `r change = |r<sub>with</sub>| − |r<sub>without</sub>| = ${Math.abs(rWith).toFixed(2)} − ${Math.abs(rWithout).toFixed(2)} = <strong>${result.rChange}</strong>`;
    }
    // Influential threshold: |slope change| >= 0.2 OR |r change| >= 0.1
    if (result.slopeChange !== null && result.rChange !== null) {
      const absSlopeChange = Math.abs(result.slopeChange);
      const absRChange = Math.abs(result.rChange);
      const slopeMeetsThreshold = absSlopeChange >= 0.2;
      const rMeetsThreshold = absRChange >= 0.1;
      const isInfluentialCalc = slopeMeetsThreshold || rMeetsThreshold;
      result.influential = isInfluentialCalc ? 'yes' : 'no';

      if (isInfluentialCalc) {
        const reasons = [];
        if (slopeMeetsThreshold) reasons.push(`|slope change| = ${absSlopeChange} ≥ 0.2`);
        if (rMeetsThreshold) reasons.push(`|r change| = ${absRChange} ≥ 0.1`);
        result.explanations.influential = `<strong>Yes, influential</strong> because ${reasons.join(' and ')}.`;
      } else {
        result.explanations.influential = `<strong>Not influential</strong> because |slope change| = ${absSlopeChange} < 0.2 AND |r change| = ${absRChange} < 0.1.`;
      }
    }
    return result;
  }

  // Get data from graphConfig if available
  const graphConfig = context.graphConfig;
  if (!graphConfig || !graphConfig.points) {
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

  const xMean = roundTo(statsWith.xMean, 1);
  const pointX = roundTo(highlightedPoint.x, 1);
  const pointY = roundTo(highlightedPoint.y, 1);

  // ---- LEVERAGE ----
  // High leverage if x is far from x̄
  const xDistance = Math.abs(highlightedPoint.x - statsWith.xMean);
  const xSpread = statsWith.sx * Math.sqrt(statsWith.n - 1);
  const leverageThreshold = xSpread * 0.4;
  result.leverage = xDistance > leverageThreshold ? 'high' : 'low';

  if (result.leverage === 'high') {
    result.explanations.leverage = `<strong>High leverage</strong>: The point's x-value (${pointX}) is far from x̄ = ${xMean}. Points far left or right of center have high leverage.`;
  } else {
    result.explanations.leverage = `<strong>Low leverage</strong>: The point's x-value (${pointX}) is close to x̄ = ${xMean}. Points near the center have low leverage.`;
  }

  // ---- RESIDUAL SIZE ----
  const predictedY = statsWith.intercept + statsWith.slope * highlightedPoint.x;
  const residual = highlightedPoint.y - predictedY;
  const absResidual = Math.abs(residual);

  let sumSquaredResiduals = 0;
  for (const p of allPoints) {
    const pred = statsWith.intercept + statsWith.slope * p.x;
    sumSquaredResiduals += (p.y - pred) ** 2;
  }
  const typicalResidual = Math.sqrt(sumSquaredResiduals / allPoints.length);
  const residualThreshold = typicalResidual * 1.5;
  result.residualSize = absResidual > residualThreshold ? 'large' : 'small';

  const residualRounded = roundTo(residual, 2);
  if (result.residualSize === 'large') {
    result.explanations.residualSize = `<strong>Large residual</strong>: The residual is ${residualRounded} — the point is far from the regression line. This is an outlier in the y-direction.`;
  } else {
    result.explanations.residualSize = `<strong>Small residual</strong>: The residual is ${residualRounded} — the point is close to the regression line.`;
  }

  // ---- CLASSIFICATION ----
  result.classification = `${result.leverage}-${result.residualSize === 'large' ? 'high' : 'low'}`;

  const classificationDescriptions = {
    'low-low': 'A typical point with minimal influence on the regression.',
    'low-high': 'An outlier in the y-direction. Affects r more than slope.',
    'high-low': 'Reinforces the existing pattern. Has leverage but fits the line.',
    'high-high': '<strong>INFLUENTIAL</strong> — dramatically affects both slope and r!'
  };
  result.explanations.classification = `<strong>${result.leverage === 'high' ? 'High' : 'Low'} leverage, ${result.residualSize} residual</strong>: ${classificationDescriptions[result.classification]}`;

  // ---- SLOPE EFFECT ----
  const slopeDiff = statsWith.slope - statsWithout.slope;
  const slopeWith = roundTo(statsWith.slope, 3);
  const slopeWithout = roundTo(statsWithout.slope, 3);

  if (Math.abs(slopeDiff) < 0.05) {
    result.slopeEffect = 'same';
    result.explanations.slopeEffect = `<strong>Slope stays about the same</strong>: This point has little effect on slope (b = ${slopeWith} with, ${slopeWithout} without). ${result.leverage === 'low' ? 'Low leverage points have minimal pull on the line.' : 'The point falls near the existing pattern.'}`;
  } else if (slopeDiff > 0) {
    result.slopeEffect = 'decrease';
    result.explanations.slopeEffect = `<strong>Slope would DECREASE</strong>: The point is pulling the line steeper (b = ${slopeWith} → ${slopeWithout} without it). Think of the line as a seesaw — this point pulls ${highlightedPoint.x > statsWith.xMean ? 'the right side up' : 'the left side down'}.`;
  } else {
    result.slopeEffect = 'increase';
    result.explanations.slopeEffect = `<strong>Slope would INCREASE</strong>: The point is pulling the line flatter (b = ${slopeWith} → ${slopeWithout} without it). Removing it lets the line tilt more steeply.`;
  }

  // ---- R EFFECT ----
  const rDiff = Math.abs(statsWith.r) - Math.abs(statsWithout.r);
  const rWith = roundTo(statsWith.r, 3);
  const rWithout = roundTo(statsWithout.r, 3);

  if (Math.abs(rDiff) < 0.02) {
    result.rEffect = 'same';
    result.explanations.rEffect = `<strong>|r| stays about the same</strong>: This point has little effect on correlation (r = ${rWith} with, ${rWithout} without).`;
  } else if (rDiff > 0) {
    result.rEffect = 'decrease';
    result.explanations.rEffect = `<strong>|r| would DECREASE</strong>: The point strengthens the linear pattern (r = ${rWith} → ${rWithout} without it). Points close to the line strengthen r; removing them weakens it.`;
  } else {
    result.rEffect = 'increase';
    result.explanations.rEffect = `<strong>|r| would INCREASE</strong>: The point weakens the linear pattern (r = ${rWith} → ${rWithout} without it). This outlier pulls r toward zero; removing it strengthens the correlation.`;
  }

  // r² follows |r|
  result.r2Effect = result.rEffect;
  result.explanations.r2Effect = `Since r² = (r)², it moves the same direction as |r|. ${result.rEffect === 'increase' ? 'Removing this outlier would increase r².' : result.rEffect === 'decrease' ? 'Removing this point would decrease r².' : 'r² stays about the same.'}`;

  // ---- INFLUENTIAL ----
  const isInfluential = (result.leverage === 'high' && result.residualSize === 'large') ||
    Math.abs(slopeDiff) > 0.1 ||
    Math.abs(rDiff) > 0.05;
  result.isInfluential = isInfluential ? 'yes' : 'no';

  if (isInfluential) {
    result.explanations.isInfluential = `<strong>Yes, influential</strong>: ${result.leverage === 'high' && result.residualSize === 'large' ? 'High leverage + large residual = influential!' : 'Removing this point substantially changes the regression.'} An influential point has both the leverage (x far from mean) AND pulls the line away from where it would otherwise be.`;
  } else {
    result.explanations.isInfluential = `<strong>Not influential</strong>: ${result.leverage === 'low' ? 'Low leverage points cannot strongly influence the line.' : 'Although high leverage, the point fits the existing pattern (small residual).'} A point needs BOTH high leverage AND large residual to be influential.`;
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
 * Includes explanatory feedback that mirrors the hints
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
  let explanation = null;
  let source = 'computed';

  // Use computed value if available
  if (computed && computed[fieldId] !== null && computed[fieldId] !== undefined) {
    expected = computed[fieldId];
    explanation = computed.explanations?.[fieldId] || null;
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
        explanation = expectedData.explanation || null;
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

  // ALWAYS add the computed explanation to feedback
  // This explains WHY the answer is what it is, following hint logic
  if (explanation) {
    if (result.score === 'E') {
      // Correct - show explanation with positive framing
      result.feedback = `Correct! ${explanation}`;
    } else {
      // Incorrect - show explanation to help student understand
      result.feedback = `${explanation}`;
    }
  }

  // Add debug info to result
  result._computed = source === 'computed';
  result._expected = expected;
  result._explanation = explanation;

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
