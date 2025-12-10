/**
 * Residuals - Problem Generator
 * Generates regression problems with specific point selection for residual practice
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, mode) {
  // Generate regression parameters
  const rSign = context.expectedDirection === 'positive' ? 1 : -1;
  const r = generateR(rSign);

  // Generate data points
  const points = generateDataPoints(context, r);

  // Calculate regression line from points
  const regression = calculateRegression(points);

  // For analyze mode, potentially generate non-linear pattern
  if (modeId === 'analyze') {
    return generateAnalyzeProblem(context, points, regression);
  }

  // Select a random point to focus on
  const selectedIndex = Math.floor(Math.random() * points.length);
  const selectedPoint = points[selectedIndex];

  // Calculate expected values
  const predictedY = regression.intercept + regression.slope * selectedPoint.x;
  const residual = selectedPoint.y - predictedY;

  // Build context with computed values
  const problemContext = {
    ...context,
    r: formatNumber(r, 3),
    slope: formatNumber(regression.slope, 3),
    intercept: formatNumber(regression.intercept, 2),
    selectedX: formatNumber(selectedPoint.x, 2),
    selectedY: formatNumber(selectedPoint.y, 2),
    predictedY: formatNumber(predictedY, 2),
    residual: formatNumber(residual, 2),
    residualAbs: formatNumber(Math.abs(residual), 2),
    overUnder: residual < 0 ? 'Overprediction' : 'Underprediction',
    moreOrLess: residual > 0 ? 'more' : 'less'
  };

  // Graph configuration
  const graphConfig = {
    type: 'scatterplot',
    points: points,
    xLabel: context.xVar,
    yLabel: context.yVar,
    xDomain: context.xDomain,
    yDomain: context.yDomain,
    regression: {
      slope: regression.slope,
      intercept: regression.intercept,
      show: true
    },
    highlight: {
      index: selectedIndex,
      x: selectedPoint.x,
      y: selectedPoint.y,
      predictedY: predictedY
    },
    showResidualLine: true
  };

  // Expected answers for grading
  const answers = {
    predicted: {
      value: predictedY,
      tolerance: 0.1
    },
    residual: {
      value: residual,
      tolerance: 0.1
    },
    overUnder: {
      value: residual < 0 ? 'Overprediction' : 'Underprediction'
    },
    interpretation: {
      residual: residual,
      direction: residual > 0 ? 'more' : 'less',
      absValue: Math.abs(residual)
    }
  };

  return {
    context: problemContext,
    graphConfig,
    answers,
    scenario: buildScenarioText(problemContext, modeId)
  };
}

/**
 * Generate a problem for analyze mode (residual plot patterns)
 */
function generateAnalyzeProblem(context, linearPoints, regression) {
  // Randomly choose pattern type
  const patterns = ['random', 'curved', 'fan', 'random']; // weight towards random
  const patternType = patterns[Math.floor(Math.random() * patterns.length)];

  let points;
  let isAppropriate;
  let patternName;

  switch (patternType) {
    case 'curved':
      points = generateCurvedPattern(context);
      isAppropriate = false;
      patternName = 'Curved pattern';
      break;
    case 'fan':
      points = generateFanPattern(context);
      isAppropriate = false;
      patternName = 'Fan shape';
      break;
    default:
      points = linearPoints;
      isAppropriate = true;
      patternName = 'Random scatter';
  }

  // Calculate regression for these points
  const reg = calculateRegression(points);

  // Calculate residuals
  const residuals = points.map(p => ({
    x: p.x,
    y: p.y - (reg.intercept + reg.slope * p.x),
    original: p
  }));

  const problemContext = {
    ...context,
    slope: formatNumber(reg.slope, 3),
    intercept: formatNumber(reg.intercept, 2),
    patternType: patternName,
    isAppropriate: isAppropriate ? 'Yes' : 'No'
  };

  // Graph configuration for residual plot
  const graphConfig = {
    type: 'residual-plot',
    points: residuals,
    xLabel: context.xVar,
    yLabel: 'Residual',
    xDomain: context.xDomain,
    showZeroLine: true
  };

  const answers = {
    pattern: { value: patternName },
    appropriate: { value: isAppropriate ? 'Yes' : 'No' },
    explanation: {
      pattern: patternName,
      appropriate: isAppropriate
    }
  };

  return {
    context: problemContext,
    graphConfig,
    answers,
    scenario: `Examine the residual plot for the relationship between ${context.xVar} and ${context.yVar}.`
  };
}

/**
 * Generate points with curved (quadratic) pattern
 */
function generateCurvedPattern(context) {
  const [xMin, xMax] = context.xDomain;
  const [yMin, yMax] = context.yDomain;
  const points = [];
  const numPoints = 15;

  const xRange = xMax - xMin;
  const yMid = (yMin + yMax) / 2;
  const yRange = (yMax - yMin) / 3;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = xMin + t * xRange;
    // Quadratic pattern
    const y = yMid + yRange * (4 * (t - 0.5) * (t - 0.5) - 0.5) + (Math.random() - 0.5) * yRange * 0.3;
    points.push({ x, y: Math.max(yMin, Math.min(yMax, y)) });
  }

  return points;
}

/**
 * Generate points with fan (heteroscedastic) pattern
 */
function generateFanPattern(context) {
  const [xMin, xMax] = context.xDomain;
  const [yMin, yMax] = context.yDomain;
  const points = [];
  const numPoints = 15;

  const xRange = xMax - xMin;
  const yMid = (yMin + yMax) / 2;
  const baseSlope = (yMax - yMin) / xRange * 0.5;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = xMin + t * xRange;
    // Increasing spread as x increases
    const spread = 0.1 + t * 0.6;
    const noise = (Math.random() - 0.5) * (yMax - yMin) * spread;
    const y = yMid + baseSlope * (x - (xMin + xMax) / 2) + noise;
    points.push({ x, y: Math.max(yMin, Math.min(yMax, y)) });
  }

  return points;
}

/**
 * Generate a correlation coefficient
 */
function generateR(sign = 1) {
  const magnitude = 0.4 + Math.random() * 0.5;
  return sign * magnitude;
}

/**
 * Generate data points that approximate target r
 */
function generateDataPoints(context, targetR, numPoints = 12) {
  const [xMin, xMax] = context.xDomain;
  const [yMin, yMax] = context.yDomain;

  const xMean = (xMin + xMax) / 2;
  const yMean = (yMin + yMax) / 2;
  const xSpread = (xMax - xMin) / 3;
  const ySpread = (yMax - yMin) / 3;

  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const xZ = (Math.random() - 0.5) * 2.5;
    const x = xMean + xZ * xSpread;

    const noise = Math.sqrt(1 - targetR * targetR) * (Math.random() - 0.5) * 2;
    const yZ = targetR * xZ + noise;
    const y = yMean + yZ * ySpread;

    const clampedX = Math.max(xMin, Math.min(xMax, x));
    const clampedY = Math.max(yMin, Math.min(yMax, y));

    points.push({ x: clampedX, y: clampedY });
  }

  return points;
}

/**
 * Calculate regression coefficients from points
 */
function calculateRegression(points) {
  const n = points.length;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const xMean = sumX / n;
  const yMean = sumY / n;

  const slope = (sumXY - n * xMean * yMean) / (sumX2 - n * xMean * xMean);
  const intercept = yMean - slope * xMean;

  return { slope, intercept, xMean, yMean };
}

/**
 * Format number to specified decimal places
 */
function formatNumber(num, decimals) {
  return Number(num.toFixed(decimals));
}

/**
 * Build scenario description text
 */
function buildScenarioText(context, modeId) {
  if (modeId === 'calculate') {
    return `Using the regression equation ŷ = ${context.intercept} + ${context.slope}x, ` +
      `calculate the predicted value and residual for the highlighted point at x = ${context.selectedX}.`;
  }
  if (modeId === 'interpret') {
    return `The highlighted point shows actual ${context.yVar} = ${context.selectedY} ${context.yUnits} ` +
      `when ${context.xVar} = ${context.selectedX} ${context.xUnits}. Interpret this residual in context.`;
  }
  return `Analyze the residual plot and determine if a linear model is appropriate.`;
}

export default { generateProblem };
