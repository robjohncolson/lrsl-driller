/**
 * LSRL Calculations - Problem Generator
 * Generates numeric calculation problems for slope, intercept, and standard deviation
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, config = {}) {
  switch (modeId) {
    case 'find-b':
      return generateFindB(context, config);
    case 'find-a':
      return generateFindA(context, config);
    case 'full-lsrl':
      return generateFullLSRL(context, config);
    case 'std-dev':
      return generateStdDev(context, config);
    case 'sign-check':
      return generateSignCheck(context, config);
    case 'ratio-check':
      return generateRatioCheck(context, config);
    default:
      throw new Error(`Unknown mode: ${modeId}`);
  }
}

/**
 * Mode 1: Find slope b given r, sₓ, sᵧ
 */
function generateFindB(context, config) {
  // Generate correlation coefficient
  const rSign = Math.random() > 0.3 ? 1 : -1; // 70% positive, 30% negative
  const rMagnitude = randomInRange(0.4, 0.95, 2);
  const r = roundTo(rSign * rMagnitude, 3);

  // Generate standard deviations (ensure nice-ish numbers)
  const sx = generateNiceNumber(2, 20, 1);
  const sy = generateNiceNumber(5, 50, 1);

  // Calculate correct answer
  const b = roundTo(r * (sy / sx), 3);

  const answers = {
    b: {
      value: b,
      formula: `${r} × (${sy} / ${sx})`,
      steps: [
        `sᵧ / sₓ = ${sy} / ${sx} = ${roundTo(sy / sx, 3)}`,
        `b = r × (sᵧ / sₓ) = ${r} × ${roundTo(sy / sx, 3)} = ${b}`
      ]
    }
  };

  return {
    scenario: `Given the following summary statistics, calculate the slope (b) of the least-squares regression line.`,
    context: {
      ...context,
      modeId: 'find-b',
      modeName: 'Find Slope (b)',
      r, sx, sy, b
    },
    answers,
    given: { r, sx, sy },
    validation: {
      b: { expected: b, tolerance: 'tight' }
    }
  };
}

/**
 * Mode 2: Find y-intercept a given x̄, ȳ, b
 */
function generateFindA(context, config) {
  // Generate means (realistic values)
  const xBar = generateNiceNumber(5, 50, 1);
  const yBar = generateNiceNumber(20, 150, 1);

  // Generate slope (can be negative)
  const bSign = Math.random() > 0.25 ? 1 : -1;
  const b = roundTo(bSign * randomInRange(0.5, 5, 1), 2);

  // Calculate correct answer
  const a = roundTo(yBar - b * xBar, 2);

  const answers = {
    a: {
      value: a,
      formula: `${yBar} − (${b} × ${xBar})`,
      steps: [
        `b × x̄ = ${b} × ${xBar} = ${roundTo(b * xBar, 2)}`,
        `a = ȳ − b × x̄ = ${yBar} − ${roundTo(b * xBar, 2)} = ${a}`
      ]
    }
  };

  // Add note for negative slope case
  if (b < 0) {
    answers.a.note = `Watch out: subtracting a negative! ${yBar} − (${b} × ${xBar}) = ${yBar} − (${roundTo(b * xBar, 2)}) = ${yBar} + ${Math.abs(roundTo(b * xBar, 2))} = ${a}`;
  }

  return {
    scenario: `Given the following summary statistics, calculate the y-intercept (a) of the least-squares regression line.`,
    context: {
      ...context,
      modeId: 'find-a',
      modeName: 'Find Y-Intercept (a)',
      xBar, yBar, b, a
    },
    answers,
    given: { xBar, yBar, b },
    validation: {
      a: { expected: a, tolerance: 'tight' }
    }
  };
}

/**
 * Mode 3: Full LSRL - find both b and a
 */
function generateFullLSRL(context, config) {
  // Generate all five summary statistics
  const rSign = Math.random() > 0.3 ? 1 : -1;
  const rMagnitude = randomInRange(0.5, 0.92, 2);
  const r = roundTo(rSign * rMagnitude, 3);

  const sx = generateNiceNumber(2, 15, 1);
  const sy = generateNiceNumber(5, 40, 1);
  const xBar = generateNiceNumber(10, 60, 1);
  const yBar = generateNiceNumber(30, 120, 1);

  // Calculate correct answers
  const b = roundTo(r * (sy / sx), 3);
  const a = roundTo(yBar - b * xBar, 2);

  const answers = {
    b: {
      value: b,
      formula: `${r} × (${sy} / ${sx})`,
      steps: [
        `sᵧ / sₓ = ${sy} / ${sx} = ${roundTo(sy / sx, 3)}`,
        `b = r × (sᵧ / sₓ) = ${r} × ${roundTo(sy / sx, 3)} = ${b}`
      ]
    },
    a: {
      value: a,
      formula: `${yBar} − (${b} × ${xBar})`,
      steps: [
        `b × x̄ = ${b} × ${xBar} = ${roundTo(b * xBar, 2)}`,
        `a = ȳ − b × x̄ = ${yBar} − ${roundTo(b * xBar, 2)} = ${a}`
      ]
    },
    equation: `ŷ = ${a} + ${b}x`
  };

  return {
    scenario: `Given the following summary statistics, find the complete LSRL equation by calculating both the slope (b) and y-intercept (a).`,
    context: {
      ...context,
      modeId: 'full-lsrl',
      modeName: 'Full LSRL Equation',
      r, sx, sy, xBar, yBar, b, a
    },
    answers,
    given: { r, sx, sy, xBar, yBar },
    validation: {
      b: { expected: b, tolerance: 'tight' },
      a: { expected: a, tolerance: 'standard' }
    }
  };
}

/**
 * Mode 4: Standard Deviation calculation
 */
function generateStdDev(context, config) {
  const n = config.datasetSize || randomInt(5, 7);

  // Generate a dataset with a nice mean
  const targetMean = generateNiceNumber(5, 25, 0);
  const spread = randomInt(3, 8);

  // Generate values around the target mean
  let dataset = [];
  for (let i = 0; i < n; i++) {
    const deviation = randomInt(-spread, spread);
    dataset.push(targetMean + deviation);
  }

  // Ensure all values are positive
  const minVal = Math.min(...dataset);
  if (minVal < 1) {
    dataset = dataset.map(x => x - minVal + 1);
  }

  // Calculate actual mean
  const sum = dataset.reduce((a, b) => a + b, 0);
  const mean = roundTo(sum / n, 2);

  // Calculate deviations and squared deviations
  const deviations = dataset.map(x => roundTo(x - mean, 2));
  const squaredDeviations = deviations.map(d => roundTo(d * d, 4));
  const sumSquaredDeviations = roundTo(squaredDeviations.reduce((a, b) => a + b, 0), 4);

  // Calculate standard deviation
  const variance = roundTo(sumSquaredDeviations / (n - 1), 4);
  const stdDev = roundTo(Math.sqrt(variance), 3);

  const answers = {
    mean: {
      value: mean,
      formula: `(${dataset.join(' + ')}) / ${n}`,
      steps: [
        `Sum = ${sum}`,
        `x̄ = ${sum} / ${n} = ${mean}`
      ]
    },
    stdDev: {
      value: stdDev,
      formula: `√[Σ(xᵢ − x̄)² / (n − 1)]`,
      steps: [
        `Deviations: ${deviations.join(', ')}`,
        `Squared deviations: ${squaredDeviations.join(', ')}`,
        `Σ(xᵢ − x̄)² = ${sumSquaredDeviations}`,
        `Variance = ${sumSquaredDeviations} / ${n - 1} = ${variance}`,
        `s = √${variance} = ${stdDev}`
      ],
      workTable: dataset.map((x, i) => ({
        xi: x,
        deviation: deviations[i],
        squaredDeviation: squaredDeviations[i]
      }))
    }
  };

  return {
    scenario: `Given the dataset below, calculate the mean (x̄) and sample standard deviation (s).`,
    context: {
      ...context,
      modeId: 'std-dev',
      modeName: 'Standard Deviation',
      dataset, n, mean, stdDev,
      datasetDisplay: dataset.join(', ')
    },
    answers,
    given: { dataset, n },
    validation: {
      mean: { expected: mean, tolerance: 'tight' },
      stdDev: { expected: stdDev, tolerance: 'standard' }
    }
  };
}

/**
 * Mode 5: Sign check (multiple choice)
 */
function generateSignCheck(context, config) {
  // Generate r with clear sign
  const rSign = Math.random() > 0.5 ? 1 : -1;
  const rMagnitude = randomInRange(0.3, 0.95, 2);
  const r = roundTo(rSign * rMagnitude, 3);

  // Small chance of r = 0 for variety
  const useZero = Math.random() < 0.1;
  const finalR = useZero ? 0 : r;

  let correctAnswer;
  if (finalR > 0) correctAnswer = 'positive';
  else if (finalR < 0) correctAnswer = 'negative';
  else correctAnswer = 'zero';

  const answers = {
    slopeSign: {
      value: correctAnswer,
      explanation: `Since r = ${finalR} is ${correctAnswer}, the slope b will also be ${correctAnswer}. The sign of b always matches the sign of r.`
    }
  };

  return {
    scenario: `Without calculating, predict the sign of the slope based on the correlation coefficient.`,
    context: {
      ...context,
      modeId: 'sign-check',
      modeName: 'Quick Sign Check',
      r: finalR
    },
    answers,
    given: { r: finalR },
    validation: {
      slopeSign: { expected: correctAnswer, type: 'exact' }
    }
  };
}

/**
 * Mode 6: Ratio reasoning (when sₓ = sᵧ)
 */
function generateRatioCheck(context, config) {
  // Generate r
  const rSign = Math.random() > 0.5 ? 1 : -1;
  const rMagnitude = randomInRange(0.4, 0.95, 2);
  const r = roundTo(rSign * rMagnitude, 3);

  // sₓ = sᵧ for this mode
  const s = generateNiceNumber(5, 20, 1);

  // When sₓ = sᵧ, b = r
  const b = r;

  const answers = {
    b: {
      value: b,
      formula: `${r} × (${s} / ${s}) = ${r} × 1 = ${r}`,
      explanation: 'When sₓ = sᵧ, the ratio sᵧ/sₓ = 1, so b = r × 1 = r'
    },
    insight: {
      value: 'r',
      explanation: 'When the standard deviations are equal, the slope equals the correlation coefficient exactly!'
    }
  };

  return {
    scenario: `Notice that sₓ = sᵧ. Calculate the slope, then identify the pattern.`,
    context: {
      ...context,
      modeId: 'ratio-check',
      modeName: 'Ratio Reasoning',
      r, sx: s, sy: s, b
    },
    answers,
    given: { r, sx: s, sy: s },
    validation: {
      b: { expected: b, tolerance: 'tight' },
      insight: { expected: 'r', type: 'exact' }
    }
  };
}

// ============ HELPER FUNCTIONS ============

/**
 * Generate a random number in range with specified decimal places
 */
function randomInRange(min, max, decimals = 2) {
  const value = min + Math.random() * (max - min);
  return roundTo(value, decimals);
}

/**
 * Generate a random integer in range (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Round to specified decimal places
 */
function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Generate a "nice" number (avoids awkward decimals)
 * For calculation practice, we want numbers that are reasonable to work with
 */
function generateNiceNumber(min, max, decimals = 1) {
  if (decimals === 0) {
    return randomInt(min, max);
  }
  
  // Generate numbers that are multiples of 0.5 or 0.25 for nicer calculations
  const step = decimals === 1 ? 0.5 : 0.25;
  const steps = Math.floor((max - min) / step);
  const randomSteps = randomInt(0, steps);
  return roundTo(min + randomSteps * step, decimals);
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate multiple problems for a mode (for batch generation)
 */
export function generateProblemSet(modeId, count = 10, config = {}) {
  const problems = [];
  const usedValues = new Set();
  
  for (let i = 0; i < count; i++) {
    let problem;
    let attempts = 0;
    
    // Try to generate unique problems
    do {
      problem = generateProblem(modeId, {}, config);
      const signature = JSON.stringify(problem.given);
      if (!usedValues.has(signature)) {
        usedValues.add(signature);
        break;
      }
      attempts++;
    } while (attempts < 10);
    
    problems.push({
      ...problem,
      problemNumber: i + 1,
      totalProblems: count
    });
  }
  
  return problems;
}

export default { generateProblem, generateProblemSet };
