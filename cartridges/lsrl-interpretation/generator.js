/**
 * LSRL Interpretation - Problem Generator
 * Generates regression scenarios with realistic data points
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, mode) {
  // Generate regression parameters
  const rSign = context.expectedDirection === 'positive' ? 1 : -1;
  const r = generateR(rSign);
  const rSquared = r * r;

  // Generate data points
  const points = generateDataPoints(context, r);

  // Calculate regression line from points
  const regression = calculateRegression(points);

  // Build context with computed values
  const problemContext = {
    ...context,
    r: formatNumber(r, 3),
    rSquared: formatNumber(rSquared, 3),
    slope: formatNumber(regression.slope, 3),
    slopeAbs: formatNumber(Math.abs(regression.slope), 3),
    intercept: formatNumber(regression.intercept, 2),
    direction: regression.slope >= 0 ? 'increases' : 'decreases',
    rDirection: r >= 0 ? 'positive' : 'negative',
    strength: getStrength(r),
    interceptReason: context.interceptReason || ''
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
    showEquation: true,
    showR: true
  };

  // Expected answers for grading
  const answers = {
    slope: {
      value: regression.slope,
      direction: regression.slope >= 0 ? 'increases' : 'decreases',
      absValue: Math.abs(regression.slope)
    },
    intercept: {
      value: regression.intercept,
      meaningful: context.interceptMeaningful,
      reason: context.interceptReason
    },
    correlation: {
      r: r,
      direction: r >= 0 ? 'positive' : 'negative',
      strength: getStrength(r)
    }
  };

  return {
    context: problemContext,
    graphConfig,
    answers,
    scenario: buildScenarioText(problemContext)
  };
}

/**
 * Generate a correlation coefficient with realistic distribution
 */
function generateR(sign = 1) {
  // Generate r between 0.3 and 0.95 (avoid very weak correlations)
  const magnitude = 0.3 + Math.random() * 0.65;
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
    // Generate x with some spread
    const xZ = (Math.random() - 0.5) * 2.5;
    const x = xMean + xZ * xSpread;

    // Generate y correlated with x
    const noise = Math.sqrt(1 - targetR * targetR) * (Math.random() - 0.5) * 2;
    const yZ = targetR * xZ + noise;
    const y = yMean + yZ * ySpread;

    // Clamp to domain
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
 * Get correlation strength descriptor
 */
function getStrength(r) {
  const absR = Math.abs(r);
  if (absR >= 0.8) return 'strong';
  if (absR >= 0.5) return 'moderate';
  return 'weak';
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
function buildScenarioText(context) {
  return `A study examined the relationship between ${context.xVar} and ${context.yVar}. ` +
    `Data was collected with ${context.xVar} measured in ${context.xUnits} ` +
    `and ${context.yVar} measured in ${context.yUnits}.`;
}

export default { generateProblem };
