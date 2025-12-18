/**
 * Leverage & Influential Points - Problem Generator
 * Generates problems about leverage, outliers, and influential observations
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, config = {}) {
  switch (modeId) {
    case 'identify-leverage':
      return generateIdentifyLeverage(context, config);
    case 'identify-outlier':
      return generateIdentifyOutlier(context, config);
    case 'classify-point':
      return generateClassifyPoint(context, config);
    case 'predict-slope-effect':
      return generatePredictSlopeEffect(context, config);
    case 'predict-r-effect':
      return generatePredictREffect(context, config);
    case 'influential-analysis':
      return generateInfluentialAnalysis(context, config);
    case 'compare-with-without':
      return generateCompareWithWithout(context, config);
    default:
      throw new Error(`Unknown mode: ${modeId}`);
  }
}

// ============ CORE DATA GENERATION ============

/**
 * Generate a base dataset with a clear linear pattern
 * Returns points, regression stats, and metadata
 */
function generateBaseDataset(options = {}) {
  const {
    n = 10,
    xMin = 10,
    xMax = 50,
    slope = null,
    intercept = null,
    r = null
  } = options;

  // Generate target statistics if not provided
  const targetSlope = slope ?? (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5);
  const targetR = r ?? (targetSlope > 0 ? 1 : -1) * (0.6 + Math.random() * 0.3);

  const xMean = (xMin + xMax) / 2;
  const xSpread = (xMax - xMin) / 4;

  // Generate y range based on slope
  const yMean = 50;
  const ySpread = Math.abs(targetSlope) * xSpread;

  // Generate base points clustered around the center
  const points = [];
  for (let i = 0; i < n; i++) {
    // Generate x values clustered toward center (not uniform)
    const xZ = (Math.random() - 0.5) * 2;
    const x = xMean + xZ * xSpread;

    // Generate y with correlation to x
    const noise = Math.sqrt(1 - targetR * targetR) * (Math.random() - 0.5) * 2 * ySpread;
    const yOnLine = yMean + targetSlope * (x - xMean);
    const y = yOnLine + noise;

    points.push({ x: roundTo(x, 1), y: roundTo(y, 1) });
  }

  // Calculate actual regression stats
  const stats = calculateRegression(points);

  return {
    points,
    stats,
    xMin,
    xMax,
    xMean: stats.xMean,
    yMean: stats.yMean,
    xSpread
  };
}

/**
 * Generate a special point with specified leverage/residual characteristics
 */
function generateSpecialPoint(dataset, type) {
  const { points, stats, xMin, xMax, xMean, xSpread } = dataset;
  const { slope, intercept, yMean } = stats;

  let x, y, leverage, residualSize;

  switch (type) {
    case 'high-high': // High leverage, large residual (INFLUENTIAL)
      // Far from x mean, far from line
      x = Math.random() > 0.5 ? xMax + xSpread * 0.5 : xMin - xSpread * 0.5;
      const predictedY = intercept + slope * x;
      // Put it on opposite side of where line predicts
      const residualDirection = Math.random() > 0.5 ? 1 : -1;
      y = predictedY + residualDirection * Math.abs(yMean - intercept) * 0.8;
      leverage = 'high';
      residualSize = 'large';
      break;

    case 'high-low': // High leverage, small residual (reinforces pattern)
      // Far from x mean, close to line
      x = Math.random() > 0.5 ? xMax + xSpread * 0.4 : xMin - xSpread * 0.4;
      y = intercept + slope * x + (Math.random() - 0.5) * 2;
      leverage = 'high';
      residualSize = 'small';
      break;

    case 'low-high': // Low leverage, large residual (outlier in y)
      // Near x mean, far from line
      x = xMean + (Math.random() - 0.5) * xSpread * 0.5;
      const yPred = intercept + slope * x;
      y = yPred + (Math.random() > 0.5 ? 1 : -1) * Math.abs(yMean - intercept) * 0.7;
      leverage = 'low';
      residualSize = 'large';
      break;

    case 'low-low': // Low leverage, small residual (typical point)
    default:
      // Near x mean, close to line
      x = xMean + (Math.random() - 0.5) * xSpread * 0.6;
      y = intercept + slope * x + (Math.random() - 0.5) * 3;
      leverage = 'low';
      residualSize = 'small';
      break;
  }

  const point = { x: roundTo(x, 1), y: roundTo(y, 1) };
  const predicted = roundTo(intercept + slope * point.x, 2);
  const residual = roundTo(point.y - predicted, 2);

  return {
    point,
    leverage,
    residualSize,
    predicted,
    residual,
    classification: `${leverage}-${residualSize === 'large' ? 'high' : 'low'}`
  };
}

// ============ MODE GENERATORS ============

/**
 * Mode 1: Identify if a point has high or low leverage
 */
function generateIdentifyLeverage(context, config) {
  const dataset = generateBaseDataset();

  // Randomly choose high or low leverage
  const isHighLeverage = Math.random() > 0.4; // Slight bias toward high for more interesting problems
  const type = isHighLeverage ?
    (Math.random() > 0.5 ? 'high-high' : 'high-low') :
    (Math.random() > 0.5 ? 'low-high' : 'low-low');

  const special = generateSpecialPoint(dataset, type);
  const allPoints = [...dataset.points, special.point];
  const highlightIndex = allPoints.length - 1;

  // Recalculate stats with the new point
  const stats = calculateRegression(allPoints);

  const answers = {
    leverage: {
      value: special.leverage,
      explanation: special.leverage === 'high'
        ? `The point's x-value (${special.point.x}) is far from the mean x̄ = ${roundTo(stats.xMean, 1)}, giving it high leverage.`
        : `The point's x-value (${special.point.x}) is close to the mean x̄ = ${roundTo(stats.xMean, 1)}, giving it low leverage.`
    }
  };

  return {
    scenario: `Examine the highlighted point and determine if it has high or low leverage.`,
    context: {
      ...context,
      modeId: 'identify-leverage',
      modeName: 'Identify Leverage',
      // Display values only - grading computes actual answer from graphConfig
      xBar: roundTo(stats.xMean, 2),
      pointX: special.point.x,
      pointY: special.point.y
      // NOTE: leverage NOT stored here - grading computes it from raw data
    },
    answers,
    given: {
      xBar: roundTo(stats.xMean, 2),
      pointX: special.point.x
    },
    graphConfig: {
      type: 'scatterplot',
      points: allPoints,
      xLabel: 'x',
      yLabel: 'y',
      regression: { a: stats.intercept, b: stats.slope, show: true },
      highlight: { index: highlightIndex, x: special.point.x, y: special.point.y },
      showMeanLines: true,
      xMean: stats.xMean
    },
    validation: {
      leverage: { type: 'exact' }  // No expected - grading computes it
    }
  };
}

/**
 * Mode 2: Identify if a point has a large or small residual
 */
function generateIdentifyOutlier(context, config) {
  const dataset = generateBaseDataset();

  // Randomly choose large or small residual
  const isLargeResidual = Math.random() > 0.4;
  const type = isLargeResidual ?
    (Math.random() > 0.5 ? 'high-high' : 'low-high') :
    (Math.random() > 0.5 ? 'high-low' : 'low-low');

  const special = generateSpecialPoint(dataset, type);
  const allPoints = [...dataset.points, special.point];
  const highlightIndex = allPoints.length - 1;

  const stats = calculateRegression(allPoints);

  const answers = {
    residualSize: {
      value: special.residualSize,
      explanation: special.residualSize === 'large'
        ? `The residual of ${special.residual} is large - the point is far from the regression line.`
        : `The residual of ${special.residual} is small - the point is close to the regression line.`
    }
  };

  return {
    scenario: `Examine the highlighted point and determine if it has a large or small residual.`,
    context: {
      ...context,
      modeId: 'identify-outlier',
      modeName: 'Identify Residual Size',
      // Display values only - grading computes actual answer from graphConfig
      pointX: special.point.x,
      pointY: special.point.y,
      predictedY: special.predicted,
      residual: special.residual
      // NOTE: residualSize NOT stored here - grading computes it from raw data
    },
    answers,
    given: {
      pointY: special.point.y,
      predictedY: special.predicted,
      residual: special.residual
    },
    graphConfig: {
      type: 'scatterplot',
      points: allPoints,
      xLabel: 'x',
      yLabel: 'y',
      regression: { a: stats.intercept, b: stats.slope, show: true },
      highlight: {
        index: highlightIndex,
        x: special.point.x,
        y: special.point.y,
        predictedY: special.predicted
      },
      showResidualLine: true
    },
    validation: {
      residualSize: { type: 'exact' }  // No expected - grading computes it
    }
  };
}

/**
 * Mode 3: Classify point into one of four categories
 */
function generateClassifyPoint(context, config) {
  const dataset = generateBaseDataset();

  // Choose a random type
  const types = ['low-low', 'low-high', 'high-low', 'high-high'];
  const type = types[Math.floor(Math.random() * types.length)];

  const special = generateSpecialPoint(dataset, type);
  const allPoints = [...dataset.points, special.point];
  const highlightIndex = allPoints.length - 1;

  const stats = calculateRegression(allPoints);

  const classificationDescriptions = {
    'low-low': 'Low leverage, small residual - a typical point with minimal influence',
    'low-high': 'Low leverage, large residual - an outlier in the y-direction',
    'high-low': 'High leverage, small residual - reinforces the pattern',
    'high-high': 'High leverage, large residual - an INFLUENTIAL point'
  };

  const answers = {
    leverage: { value: special.leverage },
    residualSize: { value: special.residualSize },
    classification: {
      value: special.classification,
      explanation: classificationDescriptions[special.classification]
    }
  };

  return {
    scenario: `Classify the highlighted point by determining its leverage and residual size.`,
    context: {
      ...context,
      modeId: 'classify-point',
      modeName: 'Classify Point',
      // Display values only - grading computes actual answers from graphConfig
      xBar: roundTo(stats.xMean, 2),
      pointX: special.point.x,
      pointY: special.point.y,
      residual: special.residual
      // NOTE: leverage, residualSize, classification NOT stored - grading computes them
    },
    answers,
    given: {
      xBar: roundTo(stats.xMean, 2),
      pointX: special.point.x,
      residual: special.residual
    },
    graphConfig: {
      type: 'scatterplot',
      points: allPoints,
      xLabel: 'x',
      yLabel: 'y',
      regression: { a: stats.intercept, b: stats.slope, show: true },
      highlight: {
        index: highlightIndex,
        x: special.point.x,
        y: special.point.y,
        predictedY: special.predicted
      },
      showMeanLines: true,
      showResidualLine: true,
      xMean: stats.xMean
    },
    validation: {
      leverage: { type: 'exact' },
      residualSize: { type: 'exact' },
      classification: { type: 'exact' }
      // No expected values - grading computes them from raw data
    }
  };
}

/**
 * Mode 4: Predict effect on slope if point is removed
 */
function generatePredictSlopeEffect(context, config) {
  const dataset = generateBaseDataset({ n: 8 });

  // Generate an interesting point (more often high leverage for dramatic effect)
  const types = ['high-high', 'high-high', 'high-low', 'low-high', 'low-low'];
  const type = types[Math.floor(Math.random() * types.length)];

  const special = generateSpecialPoint(dataset, type);
  const allPoints = [...dataset.points, special.point];
  const highlightIndex = allPoints.length - 1;

  // Calculate stats with and without the point
  const statsWith = calculateRegression(allPoints);
  const statsWithout = calculateRegression(dataset.points);

  // Determine effect on slope
  const slopeDiff = statsWith.slope - statsWithout.slope;
  let slopeEffect;
  if (Math.abs(slopeDiff) < 0.05) {
    slopeEffect = 'same';
  } else if (slopeDiff > 0) {
    // Point increases slope, so removing it decreases slope
    slopeEffect = 'decrease';
  } else {
    // Point decreases slope, so removing it increases slope
    slopeEffect = 'increase';
  }

  // Format point coordinates
  const pointCoords = `(${special.point.x}, ${special.point.y})`;

  const answers = {
    slopeEffect: {
      value: slopeEffect,
      explanation: slopeEffect === 'same'
        ? 'This point has little effect on slope because it either has low leverage or falls near the existing pattern.'
        : `Removing this point would ${slopeEffect === 'increase' ? 'increase' : 'decrease'} the slope because the point is pulling the line ${slopeDiff > 0 ? 'steeper' : 'flatter'}.`
    }
  };

  return {
    scenario: `Consider the highlighted point. If this point were REMOVED from the dataset, how would the slope change?`,
    context: {
      ...context,
      modeId: 'predict-slope-effect',
      modeName: 'Effect on Slope',
      // Display values only - grading computes actual answer from graphConfig
      pointCoords,
      pointX: special.point.x,
      pointY: special.point.y,
      currentSlope: roundTo(statsWith.slope, 3)
      // NOTE: slopeEffect NOT stored - grading computes it from raw data
    },
    answers,
    given: {
      pointCoords,
      currentSlope: roundTo(statsWith.slope, 3)
    },
    graphConfig: {
      type: 'scatterplot',
      points: allPoints,
      xLabel: 'x',
      yLabel: 'y',
      regression: { a: statsWith.intercept, b: statsWith.slope, show: true },
      highlight: {
        index: highlightIndex,
        x: special.point.x,
        y: special.point.y,
        predictedY: special.predicted
      },
      showMeanLines: true,
      showResidualLine: true,
      xMean: statsWith.xMean,
      yMean: statsWith.yMean
    },
    validation: {
      slopeEffect: { type: 'exact' }  // No expected - grading computes it
    }
  };
}

/**
 * Mode 5: Predict effect on r if point is removed
 */
function generatePredictREffect(context, config) {
  const dataset = generateBaseDataset({ n: 8 });

  // Generate an interesting point
  const types = ['high-high', 'low-high', 'high-low', 'low-low'];
  const type = types[Math.floor(Math.random() * types.length)];

  const special = generateSpecialPoint(dataset, type);
  const allPoints = [...dataset.points, special.point];
  const highlightIndex = allPoints.length - 1;

  // Calculate stats with and without the point
  const statsWith = calculateRegression(allPoints);
  const statsWithout = calculateRegression(dataset.points);

  // Determine effect on |r|
  const rDiff = Math.abs(statsWith.r) - Math.abs(statsWithout.r);
  let rEffect;
  if (Math.abs(rDiff) < 0.02) {
    rEffect = 'same';
  } else if (rDiff > 0) {
    // Point strengthens r, so removing it weakens r (decreases |r|)
    rEffect = 'decrease';
  } else {
    // Point weakens r, so removing it strengthens r (increases |r|)
    rEffect = 'increase';
  }

  // r² follows the same pattern
  const r2Effect = rEffect;

  // Format point coordinates
  const pointCoords = `(${special.point.x}, ${special.point.y})`;

  const classificationName = {
    'low-low': 'Low leverage, small residual',
    'low-high': 'Low leverage, large residual (outlier)',
    'high-low': 'High leverage, small residual',
    'high-high': 'High leverage, large residual (influential)'
  };

  const answers = {
    rEffect: {
      value: rEffect,
      explanation: rEffect === 'increase'
        ? 'Removing this outlier would strengthen the correlation because the point weakens the linear pattern.'
        : rEffect === 'decrease'
        ? 'Removing this point would weaken the correlation because the point reinforces the linear pattern.'
        : 'This point has little effect on the correlation.'
    },
    r2Effect: {
      value: r2Effect,
      explanation: 'r² moves in the same direction as |r|.'
    }
  };

  return {
    scenario: `Consider the highlighted point. If this point were REMOVED, how would |r| and r² change?`,
    context: {
      ...context,
      modeId: 'predict-r-effect',
      modeName: 'Effect on r',
      // Display values only - grading computes actual answers from graphConfig
      pointCoords,
      pointX: special.point.x,
      pointY: special.point.y,
      currentR: roundTo(statsWith.r, 3)
      // NOTE: rEffect, r2Effect NOT stored - grading computes them from raw data
    },
    answers,
    given: {
      pointCoords,
      currentR: roundTo(statsWith.r, 3)
    },
    graphConfig: {
      type: 'scatterplot',
      points: allPoints,
      xLabel: 'x',
      yLabel: 'y',
      regression: { a: statsWith.intercept, b: statsWith.slope, show: true },
      highlight: {
        index: highlightIndex,
        x: special.point.x,
        y: special.point.y,
        predictedY: special.predicted
      },
      showMeanLines: true,
      showResidualLine: true,
      xMean: statsWith.xMean
    },
    validation: {
      rEffect: { type: 'exact' },
      r2Effect: { type: 'exact' }
      // No expected values - grading computes them from raw data
    }
  };
}

/**
 * Mode 6: Full influential analysis
 */
function generateInfluentialAnalysis(context, config) {
  const dataset = generateBaseDataset({ n: 8 });

  // Choose a random type but weight toward interesting cases
  const types = ['high-high', 'high-high', 'high-low', 'low-high', 'low-low'];
  const type = types[Math.floor(Math.random() * types.length)];

  const special = generateSpecialPoint(dataset, type);
  const allPoints = [...dataset.points, special.point];
  const highlightIndex = allPoints.length - 1;

  // Calculate stats with and without
  const statsWith = calculateRegression(allPoints);
  const statsWithout = calculateRegression(dataset.points);

  // Determine all effects
  const slopeDiff = statsWith.slope - statsWithout.slope;
  let slopeEffect;
  if (Math.abs(slopeDiff) < 0.05) slopeEffect = 'same';
  else if (slopeDiff > 0) slopeEffect = 'decrease';
  else slopeEffect = 'increase';

  const rDiff = Math.abs(statsWith.r) - Math.abs(statsWithout.r);
  let rEffect;
  if (Math.abs(rDiff) < 0.02) rEffect = 'same';
  else if (rDiff > 0) rEffect = 'decrease';
  else rEffect = 'increase';

  // A point is influential if it substantially changes the regression
  const isInfluential = type === 'high-high' ||
    (Math.abs(slopeDiff) > 0.1 && special.leverage === 'high');

  const answers = {
    classification: { value: special.classification },
    isInfluential: {
      value: isInfluential ? 'yes' : 'no',
      explanation: isInfluential
        ? 'This point is influential because it has high leverage AND a large residual, substantially affecting the regression line.'
        : 'This point is not highly influential because it either has low leverage or fits the existing pattern.'
    },
    slopeEffect: { value: slopeEffect },
    rEffect: { value: rEffect }
  };

  return {
    scenario: `Perform a complete influence analysis on the highlighted point.`,
    context: {
      ...context,
      modeId: 'influential-analysis',
      modeName: 'Full Influence Analysis',
      // Display values only - grading computes actual answers from graphConfig
      xBar: roundTo(statsWith.xMean, 2),
      pointX: special.point.x,
      pointY: special.point.y,
      residual: special.residual,
      currentSlope: roundTo(statsWith.slope, 3),
      currentR: roundTo(statsWith.r, 3)
      // NOTE: classification, isInfluential, slopeEffect, rEffect NOT stored - grading computes them
    },
    answers,
    given: {
      xBar: roundTo(statsWith.xMean, 2),
      pointX: special.point.x,
      residual: special.residual,
      currentSlope: roundTo(statsWith.slope, 3),
      currentR: roundTo(statsWith.r, 3)
    },
    graphConfig: {
      type: 'scatterplot',
      points: allPoints,
      xLabel: 'x',
      yLabel: 'y',
      regression: { a: statsWith.intercept, b: statsWith.slope, show: true },
      highlight: {
        index: highlightIndex,
        x: special.point.x,
        y: special.point.y,
        predictedY: special.predicted
      },
      showMeanLines: true,
      showResidualLine: true,
      xMean: statsWith.xMean
    },
    validation: {
      classification: { type: 'exact' },
      isInfluential: { type: 'exact' },
      slopeEffect: { type: 'exact' },
      rEffect: { type: 'exact' }
      // No expected values - grading computes them from raw data
    }
  };
}

/**
 * Mode 7: Compare with and without point (calculate actual changes)
 * Uses pre-computed nice values for mental math
 */
function generateCompareWithWithout(context, config) {
  // Pre-computed scenarios with nice round numbers for mental math
  // Format: { slopeWith, slopeWithout, rWith, rWithout, isInfluential }
  // Influential threshold: |slope change| >= 0.2 OR |r change| >= 0.1
  const scenarios = [
    // INFLUENTIAL cases (large changes)
    { slopeWith: 1.5, slopeWithout: 0.9, rWith: 0.75, rWithout: 0.85, isInfluential: true },
    { slopeWith: 2.1, slopeWithout: 1.6, rWith: 0.6, rWithout: 0.8, isInfluential: true },
    { slopeWith: -0.8, slopeWithout: -1.2, rWith: -0.7, rWithout: -0.85, isInfluential: true },
    { slopeWith: 1.2, slopeWithout: 0.8, rWith: 0.65, rWithout: 0.9, isInfluential: true },
    { slopeWith: 0.6, slopeWithout: 1.1, rWith: 0.55, rWithout: 0.75, isInfluential: true },
    { slopeWith: -1.4, slopeWithout: -0.9, rWith: -0.6, rWithout: -0.8, isInfluential: true },
    { slopeWith: 2.0, slopeWithout: 1.5, rWith: 0.7, rWithout: 0.85, isInfluential: true },
    { slopeWith: 0.5, slopeWithout: 1.0, rWith: 0.5, rWithout: 0.7, isInfluential: true },

    // NOT influential cases (small changes)
    { slopeWith: 1.3, slopeWithout: 1.2, rWith: 0.82, rWithout: 0.85, isInfluential: false },
    { slopeWith: 0.95, slopeWithout: 0.9, rWith: 0.78, rWithout: 0.8, isInfluential: false },
    { slopeWith: -0.85, slopeWithout: -0.8, rWith: -0.72, rWithout: -0.75, isInfluential: false },
    { slopeWith: 1.55, slopeWithout: 1.5, rWith: 0.88, rWithout: 0.9, isInfluential: false },
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  const slopeWith = scenario.slopeWith;
  const slopeWithout = scenario.slopeWithout;
  const rWith = scenario.rWith;
  const rWithout = scenario.rWithout;
  const isInfluential = scenario.isInfluential;

  const slopeChange = roundTo(slopeWith - slopeWithout, 2);
  const rChange = roundTo(Math.abs(rWith) - Math.abs(rWithout), 2);

  const answers = {
    slopeChange: {
      value: slopeChange,
      formula: `${slopeWith} - ${slopeWithout} = ${slopeChange}`
    },
    rChange: {
      value: rChange,
      formula: `|${rWith}| - |${rWithout}| = ${Math.abs(rWith).toFixed(2)} - ${Math.abs(rWithout).toFixed(2)} = ${rChange}`
    },
    influential: {
      value: isInfluential ? 'yes' : 'no',
      explanation: isInfluential
        ? `The point IS influential: |slope change| = ${Math.abs(slopeChange)} >= 0.2 OR |r change| = ${Math.abs(rChange)} >= 0.1`
        : `The point is NOT influential: |slope change| = ${Math.abs(slopeChange)} < 0.2 AND |r change| = ${Math.abs(rChange)} < 0.1`
    }
  };

  return {
    scenario: `Calculate the changes in slope and r when the point is removed. Then determine if the point is influential.`,
    context: {
      ...context,
      modeId: 'compare-with-without',
      modeName: 'Before & After',
      // Given values - grading computes slopeChange, rChange, and influential from these
      slopeWith,
      slopeWithout,
      rWith,
      rWithout
      // NOTE: slopeChange, rChange, influential NOT stored - grading computes them
    },
    answers,
    given: {
      slopeWith,
      slopeWithout,
      rWith,
      rWithout
    },
    graphConfig: null, // This mode focuses on calculation, no graph needed
    validation: {
      slopeChange: { tolerance: 'standard' },
      rChange: { tolerance: 'standard' },
      influential: { type: 'exact' }
      // No expected values - grading computes them from given values
    }
  };
}

// ============ STATISTICAL CALCULATIONS ============

/**
 * Calculate regression statistics from points
 */
function calculateRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r: 0, xMean: 0, yMean: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const xMean = sumX / n;
  const yMean = sumY / n;

  // Calculate sums of squares
  let ssX = 0, ssY = 0, ssXY = 0;
  for (const p of points) {
    ssX += (p.x - xMean) ** 2;
    ssY += (p.y - yMean) ** 2;
    ssXY += (p.x - xMean) * (p.y - yMean);
  }

  const slope = ssX > 0 ? ssXY / ssX : 0;
  const intercept = yMean - slope * xMean;

  // Calculate r
  const r = (ssX > 0 && ssY > 0) ? ssXY / Math.sqrt(ssX * ssY) : 0;

  // Calculate standard deviations
  const sx = Math.sqrt(ssX / (n - 1));
  const sy = Math.sqrt(ssY / (n - 1));

  return { slope, intercept, r, xMean, yMean, sx, sy, n };
}

// ============ HELPER FUNCTIONS ============

/**
 * Round to specified decimal places
 */
function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Generate multiple problems for a mode (for batch generation)
 */
export function generateProblemSet(modeId, count = 10, config = {}) {
  const problems = [];

  for (let i = 0; i < count; i++) {
    const problem = generateProblem(modeId, {}, config);
    problems.push({
      ...problem,
      problemNumber: i + 1,
      totalProblems: count
    });
  }

  return problems;
}

export default { generateProblem, generateProblemSet };
