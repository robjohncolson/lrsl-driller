/**
 * LSRL & Z-Score Calculations - Problem Generator
 * Generates numeric calculation problems for z-scores, slope, intercept, and standard deviation
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, config = {}) {
  switch (modeId) {
    // Z-Score modes
    case 'calc-zscore':
      return generateCalcZscore(context, config);
    case 'find-raw':
      return generateFindRaw(context, config);
    case 'compare-zscores':
      return generateCompareZscores(context, config);
    // LSRL modes
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

// ============ Z-SCORE GENERATORS ============

/**
 * Generate mental-math-friendly z-score parameters
 * Key insight: Pick sd first, then mean as a nice multiple, then x = mean + z*sd
 * This ensures (x - mean) is always a clean multiple of sd
 */
function generateMentalMathZscoreParams() {
  // Nice z-scores (integer or half-integer)
  const niceZscores = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2];
  const zscore = niceZscores[Math.floor(Math.random() * niceZscores.length)];

  // Pick a "friendly" standard deviation (easy to multiply/divide)
  const niceSds = [5, 10, 15, 20, 25];
  const sd = niceSds[Math.floor(Math.random() * niceSds.length)];

  // Pick a round mean (makes subtraction easy)
  const niceMeans = [50, 60, 70, 75, 80, 100];
  const mean = niceMeans[Math.floor(Math.random() * niceMeans.length)];

  // x is exactly mean + z*sd, so arithmetic is clean
  const x = mean + zscore * sd;

  return { mean, sd, x, zscore };
}

/**
 * Calculate z-score given x, μ, σ
 */
function generateCalcZscore(context, config) {
  // Generate mental-math-friendly parameters
  const params = generateMentalMathZscoreParams();
  const { mean, sd, x, zscore } = params;

  const direction = zscore > 0 ? 'above' : zscore < 0 ? 'below' : 'at';

  const answers = {
    zscore: {
      value: zscore,
      formula: `(${x} − ${mean}) / ${sd}`,
      steps: [
        `x − μ = ${x} − ${mean} = ${x - mean}`,
        `z = ${x - mean} / ${sd} = ${zscore}`
      ],
      interpretation: `This value is ${Math.abs(zscore)} standard deviations ${direction} the mean.`
    }
  };

  let scenario = `Calculate the z-score for the given value.`;
  if (context?.variable && context?.topic) {
    scenario = `For ${context.topic.toLowerCase()}, a ${context.variable} of ${x} ${context.units || ''} was observed. The distribution has mean μ = ${mean} and standard deviation σ = ${sd}. Calculate the z-score.`;
  }

  return {
    scenario,
    context: {
      ...context,
      modeId: 'calc-zscore',
      modeName: 'Calculate Z-Score',
      x, mean, sd, zscore
    },
    answers,
    given: { x, mean, sd },
    graphConfig: {
      type: 'normal-curve',
      mean,
      sd,
      markedValue: x,
      labels: { x: context?.variable || 'Value' }
    },
    validation: {
      zscore: { expected: zscore, tolerance: 'tight' }
    }
  };
}

/**
 * Find raw value given z, μ, σ
 */
function generateFindRaw(context, config) {
  // Use mental-math-friendly parameters
  const params = generateMentalMathZscoreParams();
  const { mean, sd, x, zscore } = params;

  const answers = {
    x: {
      value: x,
      formula: `${mean} + (${zscore} × ${sd})`,
      steps: [
        `z × σ = ${zscore} × ${sd} = ${zscore * sd}`,
        `x = μ + z × σ = ${mean} + ${zscore * sd} = ${x}`
      ]
    }
  };

  let scenario = `Find the value that corresponds to the given z-score.`;
  if (context?.variable && context?.topic) {
    scenario = `In a distribution of ${context.variable} with mean μ = ${mean} ${context.units || ''} and standard deviation σ = ${sd} ${context.units || ''}, find the value with z-score = ${zscore}.`;
  }

  return {
    scenario,
    context: {
      ...context,
      modeId: 'find-raw',
      modeName: 'Find Raw Value from Z',
      x, mean, sd, zscore
    },
    answers,
    given: { zscore, mean, sd },
    graphConfig: {
      type: 'normal-curve',
      mean,
      sd,
      markedValue: null,
      showXUnknown: true, // Show "x = ?" since they need to find it
      labels: { x: context?.variable || 'Value' }
    },
    validation: {
      x: { expected: x, tolerance: 'tight' }
    }
  };
}

/**
 * Compare z-scores from two distributions
 */
function generateCompareZscores(context, config) {
  // Generate two mental-math-friendly distributions
  const params1 = generateMentalMathZscoreParams();
  let params2 = generateMentalMathZscoreParams();

  // Ensure z-scores are different enough to compare (or deliberately equal sometimes)
  const makeSame = Math.random() < 0.15; // 15% chance of equal
  if (makeSame) {
    // Make same absolute z-score but possibly different sign
    const niceZscores = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2];
    const sameZ = niceZscores[Math.floor(Math.random() * niceZscores.length)];
    params2 = {
      ...params2,
      zscore: Math.random() > 0.5 ? sameZ : -sameZ,
      x: params2.mean + (Math.random() > 0.5 ? sameZ : -sameZ) * params2.sd
    };
  } else if (Math.abs(Math.abs(params1.zscore) - Math.abs(params2.zscore)) < 0.3) {
    // Ensure they're different enough
    const newZ = params2.zscore > 0 ? params2.zscore + 0.5 : params2.zscore - 0.5;
    params2.zscore = newZ;
    params2.x = params2.mean + newZ * params2.sd;
  }

  const { mean: mean1, sd: sd1, x: x1, zscore: z1 } = params1;
  const { mean: mean2, sd: sd2, x: x2, zscore: z2 } = params2;

  // Determine which is more extreme
  const absZ1 = Math.abs(z1);
  const absZ2 = Math.abs(z2);
  let comparison;
  if (Math.abs(absZ1 - absZ2) < 0.05) {
    comparison = 'same';
  } else if (absZ1 > absZ2) {
    comparison = 'A';
  } else {
    comparison = 'B';
  }

  const answers = {
    z1: {
      value: z1,
      formula: `(${x1} − ${mean1}) / ${sd1}`,
      steps: [
        `x − μ = ${x1} − ${mean1} = ${x1 - mean1}`,
        `z = ${x1 - mean1} / ${sd1} = ${z1}`
      ]
    },
    z2: {
      value: z2,
      formula: `(${x2} − ${mean2}) / ${sd2}`,
      steps: [
        `x − μ = ${x2} − ${mean2} = ${x2 - mean2}`,
        `z = ${x2 - mean2} / ${sd2} = ${z2}`
      ]
    },
    comparison: {
      value: comparison,
      explanation: comparison === 'same'
        ? `Both z-scores have the same absolute value (|${z1}| = |${z2}| ≈ ${absZ1.toFixed(2)}), so they are equally extreme.`
        : comparison === 'A'
          ? `|z₁| = ${absZ1.toFixed(2)} > |z₂| = ${absZ2.toFixed(2)}, so A is more extreme.`
          : `|z₂| = ${absZ2.toFixed(2)} > |z₁| = ${absZ1.toFixed(2)}, so B is more extreme.`
    }
  };

  const scenario = `Compare these two values from different distributions. Calculate each z-score, then determine which value is more extreme (further from its mean in standard deviation units).`;

  return {
    scenario,
    context: {
      ...context,
      modeId: 'compare-zscores',
      modeName: 'Compare Z-Scores',
      x1, mean1, sd1, z1,
      x2, mean2, sd2, z2,
      comparison
    },
    answers,
    given: { x1, mean1, sd1, x2, mean2, sd2 },
    graphConfig: {
      type: 'dual-normal-curve',
      distributions: [
        { mean: mean1, sd: sd1, markedValue: x1, label: 'Distribution A' },
        { mean: mean2, sd: sd2, markedValue: x2, label: 'Distribution B' }
      ]
    },
    validation: {
      z1: { expected: z1, tolerance: 'tight' },
      z2: { expected: z2, tolerance: 'tight' },
      comparison: { expected: comparison, type: 'exact' }
    }
  };
}

// ============ LSRL GENERATORS ============

/**
 * Mental-math-friendly slope parameters
 * Key insight: Choose sᵧ/sₓ ratio to be simple (1, 2, 3, 0.5, 1.5, 4)
 * Then multiply by nice r values (0.5, 0.6, 0.7, 0.8, 0.9)
 */
function generateMentalMathSlopeParams() {
  // Nice r values (easy to multiply)
  const niceR = [0.5, 0.6, 0.7, 0.8, 0.9, -0.5, -0.6, -0.7, -0.8, -0.9];
  const r = niceR[Math.floor(Math.random() * niceR.length)];

  // Choose sx and sy so their ratio is simple
  // Pairs: [sx, sy] giving ratios 1, 2, 3, 4, 0.5, 1.5
  const pairs = [
    [10, 10],  // ratio = 1
    [10, 20],  // ratio = 2
    [10, 30],  // ratio = 3
    [5, 20],   // ratio = 4
    [20, 10],  // ratio = 0.5
    [10, 15],  // ratio = 1.5
    [8, 16],   // ratio = 2
    [6, 12],   // ratio = 2
    [5, 10],   // ratio = 2
    [4, 12],   // ratio = 3
  ];
  const [sx, sy] = pairs[Math.floor(Math.random() * pairs.length)];

  const ratio = sy / sx;
  const b = roundTo(r * ratio, 2);

  return { r, sx, sy, ratio, b };
}

/**
 * Generate synthetic data points that approximate given statistics
 * Used for visualization only - shows the pattern without revealing exact values
 */
function generateSyntheticPoints(xBar, yBar, sx, sy, r, n = 6) {
  const points = [];
  const b = r * (sy / sx);
  const a = yBar - b * xBar;

  // Generate x values spread around xBar
  for (let i = 0; i < n; i++) {
    // Spread x values evenly around the mean
    const xOffset = (i - (n - 1) / 2) * (sx * 0.6);
    const x = xBar + xOffset;

    // Calculate y on the line, then add some noise based on r
    // Higher |r| = less noise
    const yOnLine = a + b * x;
    const noiseScale = sy * Math.sqrt(1 - r * r) * 0.8;
    const noise = (Math.random() - 0.5) * noiseScale * 2;
    const y = yOnLine + noise;

    points.push({ x: roundTo(x, 1), y: roundTo(y, 1) });
  }

  return points;
}

/**
 * Mode 1: Find slope b given r, sₓ, sᵧ
 */
function generateFindB(context, config) {
  const { r, sx, sy, ratio, b } = generateMentalMathSlopeParams();

  // Generate synthetic data for visualization
  // Use arbitrary but reasonable means
  const xBar = 50;
  const yBar = 60;
  const a = yBar - b * xBar;
  const points = generateSyntheticPoints(xBar, yBar, sx, sy, r, 7);

  const answers = {
    b: {
      value: b,
      formula: `${r} × (${sy} / ${sx})`,
      steps: [
        `sᵧ / sₓ = ${sy} / ${sx} = ${ratio}`,
        `b = r × (sᵧ / sₓ) = ${r} × ${ratio} = ${b}`
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
    graphConfig: {
      type: 'scatterplot',
      points,
      regression: { a, b, show: true },
      showSlope: false,      // Don't label the slope (that's the answer!)
      showIntercept: false,  // Don't highlight intercept either
      xLabel: 'x',
      yLabel: 'y'
    },
    validation: {
      b: { expected: b, tolerance: 'tight' }
    }
  };
}

/**
 * Mental-math-friendly intercept parameters
 * Key insight: Choose b and x̄ so b × x̄ is a round number
 * Then choose ȳ so subtraction is easy
 */
function generateMentalMathInterceptParams() {
  // Pre-computed combos where b × x̄ is round and ȳ makes nice subtraction
  // Format: [xBar, yBar, b] where a = yBar - b*xBar is clean
  const combos = [
    // Positive slopes
    [10, 50, 2],    // a = 50 - 20 = 30
    [10, 80, 3],    // a = 80 - 30 = 50
    [15, 70, 2],    // a = 70 - 30 = 40
    [20, 100, 2],   // a = 100 - 40 = 60
    [20, 90, 1.5],  // a = 90 - 30 = 60
    [25, 100, 2],   // a = 100 - 50 = 50
    [10, 45, 1.5],  // a = 45 - 15 = 30
    [12, 60, 2.5],  // a = 60 - 30 = 30
    [20, 80, 1.5],  // a = 80 - 30 = 50
    [15, 90, 4],    // a = 90 - 60 = 30
    // Negative slopes (still positive intercepts usually)
    [10, 70, -2],   // a = 70 - (-20) = 90
    [15, 50, -2],   // a = 50 - (-30) = 80
    [20, 60, -1.5], // a = 60 - (-30) = 90
    [10, 40, -3],   // a = 40 - (-30) = 70
    [25, 50, -2],   // a = 50 - (-50) = 100
  ];

  const [xBar, yBar, b] = combos[Math.floor(Math.random() * combos.length)];
  const a = yBar - b * xBar;

  return { xBar, yBar, b, a };
}

/**
 * Mode 2: Find y-intercept a given x̄, ȳ, b
 */
function generateFindA(context, config) {
  const { xBar, yBar, b, a } = generateMentalMathInterceptParams();

  // Generate synthetic data for visualization
  // Use reasonable sx, sy, and derive r from b
  const sx = 10;
  const sy = Math.abs(b) * sx; // sy/sx = |b|/|r|, assume |r| ≈ 0.8
  const r = b > 0 ? 0.8 : -0.8;
  const points = generateSyntheticPoints(xBar, yBar, sx, sy, r, 7);

  const bTimesX = b * xBar;
  const answers = {
    a: {
      value: a,
      formula: `${yBar} − (${b} × ${xBar})`,
      steps: [
        `b × x̄ = ${b} × ${xBar} = ${bTimesX}`,
        `a = ȳ − b × x̄ = ${yBar} − ${bTimesX} = ${a}`
      ]
    }
  };

  // Add note for negative slope case
  if (b < 0) {
    answers.a.note = `Watch out: subtracting a negative! ${yBar} − (${bTimesX}) = ${yBar} + ${Math.abs(bTimesX)} = ${a}`;
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
    graphConfig: {
      type: 'scatterplot',
      points,
      regression: { a, b, show: true },
      centroid: { x: xBar, y: yBar, show: true, label: '(x̄, ȳ)' },  // Show the point the line passes through
      showSlope: false,
      showIntercept: false,  // Don't highlight intercept (that's the answer!)
      xLabel: 'x',
      yLabel: 'y'
    },
    validation: {
      a: { expected: a, tolerance: 'tight' }
    }
  };
}

/**
 * Mode 3: Full LSRL - find both b and a
 * Pre-computed full parameter sets where both calculations are clean
 */
function generateFullLSRL(context, config) {
  // Pre-computed sets: [r, sx, sy, xBar, yBar] where b and a come out nice
  // b = r * (sy/sx), a = yBar - b*xBar
  const fullSets = [
    // r=0.8, ratio=2 → b=1.6, then xBar=10, yBar=50 → a=50-16=34
    { r: 0.8, sx: 10, sy: 20, xBar: 10, yBar: 50 },  // b=1.6, a=34
    // r=0.6, ratio=2 → b=1.2, then xBar=10, yBar=40 → a=40-12=28
    { r: 0.6, sx: 5, sy: 10, xBar: 10, yBar: 40 },   // b=1.2, a=28
    // r=0.5, ratio=2 → b=1, then xBar=20, yBar=60 → a=60-20=40
    { r: 0.5, sx: 10, sy: 20, xBar: 20, yBar: 60 },  // b=1, a=40
    // r=0.9, ratio=2 → b=1.8, then xBar=10, yBar=50 → a=50-18=32
    { r: 0.9, sx: 5, sy: 10, xBar: 10, yBar: 50 },   // b=1.8, a=32
    // r=0.8, ratio=1.5 → b=1.2, then xBar=10, yBar=40 → a=40-12=28
    { r: 0.8, sx: 10, sy: 15, xBar: 10, yBar: 40 },  // b=1.2, a=28
    // r=0.7, ratio=2 → b=1.4, then xBar=10, yBar=50 → a=50-14=36
    { r: 0.7, sx: 10, sy: 20, xBar: 10, yBar: 50 },  // b=1.4, a=36
    // Negative correlations
    // r=-0.5, ratio=2 → b=-1, then xBar=20, yBar=80 → a=80-(-20)=100
    { r: -0.5, sx: 10, sy: 20, xBar: 20, yBar: 80 }, // b=-1, a=100
    // r=-0.8, ratio=2 → b=-1.6, then xBar=10, yBar=50 → a=50-(-16)=66
    { r: -0.8, sx: 5, sy: 10, xBar: 10, yBar: 50 },  // b=-1.6, a=66
    // r=-0.6, ratio=1.5 → b=-0.9, then xBar=10, yBar=40 → a=40-(-9)=49
    { r: -0.6, sx: 10, sy: 15, xBar: 10, yBar: 40 }, // b=-0.9, a=49
  ];

  const params = fullSets[Math.floor(Math.random() * fullSets.length)];
  const { r, sx, sy, xBar, yBar } = params;

  const ratio = sy / sx;
  const b = roundTo(r * ratio, 2);
  const a = roundTo(yBar - b * xBar, 2);

  const answers = {
    b: {
      value: b,
      formula: `${r} × (${sy} / ${sx})`,
      steps: [
        `sᵧ / sₓ = ${sy} / ${sx} = ${ratio}`,
        `b = r × (sᵧ / sₓ) = ${r} × ${ratio} = ${b}`
      ]
    },
    a: {
      value: a,
      formula: `${yBar} − (${b} × ${xBar})`,
      steps: [
        `b × x̄ = ${b} × ${xBar} = ${b * xBar}`,
        `a = ȳ − b × x̄ = ${yBar} − ${b * xBar} = ${a}`
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
 * Uses small datasets (n=2 to n=4) optimized for mental math
 */
function generateStdDev(context, config) {
  // Small datasets (n=2 to n=4) with nice mental math properties:
  // - Integer mean
  // - Symmetric deviations (easy to square)
  // - Clean variance and std dev
  const niceSets = [
    // n=3: BEST for mental math! Variance = 9, s = 3 exactly
    // deviations: -3, 0, 3 → squared: 9, 0, 9 → sum=18 → var=18/2=9 → s=3
    { data: [2, 5, 8], mean: 5 },      // s = 3
    { data: [4, 7, 10], mean: 7 },     // s = 3
    { data: [1, 4, 7], mean: 4 },      // s = 3
    { data: [5, 8, 11], mean: 8 },     // s = 3
    { data: [3, 6, 9], mean: 6 },      // s = 3
    { data: [7, 10, 13], mean: 10 },   // s = 3

    // n=3: Variance = 4, s = 2 exactly
    // deviations: -2, 0, 2 → squared: 4, 0, 4 → sum=8 → var=8/2=4 → s=2
    { data: [3, 5, 7], mean: 5 },      // s = 2
    { data: [6, 8, 10], mean: 8 },     // s = 2
    { data: [4, 6, 8], mean: 6 },      // s = 2
    { data: [8, 10, 12], mean: 10 },   // s = 2

    // n=4: deviations: -3,-1,1,3 → squared: 9,1,1,9 → sum=20 → var=20/3≈6.67
    { data: [2, 4, 6, 8], mean: 5 },   // s ≈ 2.58
    { data: [7, 9, 11, 13], mean: 10 },// s ≈ 2.58
    { data: [4, 6, 8, 10], mean: 7 },  // s ≈ 2.58

    // n=2: deviations: -2, 2 → squared: 4, 4 → sum=8 → var=8/1=8 → s≈2.83
    { data: [4, 8], mean: 6 },         // s ≈ 2.83
    { data: [3, 7], mean: 5 },         // s ≈ 2.83
    { data: [6, 10], mean: 8 },        // s ≈ 2.83
  ];

  const chosen = niceSets[Math.floor(Math.random() * niceSets.length)];
  const dataset = [...chosen.data];
  const n = dataset.length;
  const mean = chosen.mean;
  const sum = dataset.reduce((a, b) => a + b, 0);

  // Calculate step-by-step values
  const deviations = dataset.map(x => x - mean);
  const squaredDeviations = deviations.map(d => d * d);
  const sumSquaredDev = squaredDeviations.reduce((a, b) => a + b, 0);
  const df = n - 1;
  const variance = roundTo(sumSquaredDev / df, 2);
  const stdDev = roundTo(Math.sqrt(variance), 2);

  // Format arrays as comma-separated strings for answer matching
  const deviationsStr = deviations.join(', ');
  const squaredStr = squaredDeviations.join(', ');

  const answers = {
    mean: {
      value: mean,
      formula: `(${dataset.join(' + ')}) / ${n} = ${sum} / ${n} = ${mean}`
    },
    deviations: {
      value: deviationsStr,
      display: deviationsStr,
      explanation: `Subtract mean from each: ${dataset.map(x => `${x} - ${mean} = ${x - mean}`).join(', ')}`
    },
    deviationsSquared: {
      value: squaredStr,
      display: squaredStr,
      explanation: `Square each deviation: ${deviations.map(d => `${d}² = ${d * d}`).join(', ')}`
    },
    sumSquaredDev: {
      value: sumSquaredDev,
      formula: `${squaredDeviations.join(' + ')} = ${sumSquaredDev}`
    },
    df: {
      value: df,
      formula: `n - 1 = ${n} - 1 = ${df}`
    },
    variance: {
      value: variance,
      formula: `${sumSquaredDev} / ${df} = ${variance}`
    },
    stdDev: {
      value: stdDev,
      formula: `√${variance} = ${stdDev}`
    }
  };

  return {
    scenario: `Calculate the sample standard deviation step-by-step.`,
    context: {
      ...context,
      modeId: 'std-dev',
      modeName: 'Standard Deviation',
      dataset, n, mean, deviations, squaredDeviations, sumSquaredDev, df, variance, stdDev,
      datasetDisplay: dataset.join(', ')
    },
    answers,
    given: { dataset, n },
    validation: {
      mean: { expected: mean, tolerance: 'tight' },
      deviations: { expected: deviationsStr, type: 'list' },
      deviationsSquared: { expected: squaredStr, type: 'list' },
      sumSquaredDev: { expected: sumSquaredDev, tolerance: 'tight' },
      df: { expected: df, tolerance: 'tight' },
      variance: { expected: variance, tolerance: 'standard' },
      stdDev: { expected: stdDev, tolerance: 'standard' }
    }
  };
}

/**
 * Mode 5: Sign check (multiple choice)
 * Uses clean r values that are easy to read
 */
function generateSignCheck(context, config) {
  // Nice r values - clear positive/negative, easy to read
  const niceR = [0.5, 0.6, 0.7, 0.8, 0.9, -0.5, -0.6, -0.7, -0.8, -0.9, 0.45, -0.45, 0.85, -0.85];
  let finalR = niceR[Math.floor(Math.random() * niceR.length)];

  // Small chance of r = 0 for variety
  if (Math.random() < 0.08) {
    finalR = 0;
  }

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
 * Mode 6: Ratio reasoning - understanding how sᵧ/sₓ affects slope
 * Varied ratios: 1:1, 2:1, 1:2, 3:1
 */
function generateRatioCheck(context, config) {
  // Different ratio scenarios with nice mental math
  const scenarios = [
    { ratio: 1, note: 'sₓ = sᵧ', insight: 'r', sx: 10, syMult: 1 },
    { ratio: 1, note: 'sₓ = sᵧ', insight: 'r', sx: 15, syMult: 1 },
    { ratio: 2, note: 'sᵧ = 2sₓ', insight: '2r', sx: 5, syMult: 2 },
    { ratio: 2, note: 'sᵧ = 2sₓ', insight: '2r', sx: 10, syMult: 2 },
    { ratio: 0.5, note: 'sᵧ = sₓ/2', insight: 'r/2', sx: 10, syMult: 0.5 },
    { ratio: 0.5, note: 'sᵧ = sₓ/2', insight: 'r/2', sx: 20, syMult: 0.5 },
    { ratio: 3, note: 'sᵧ = 3sₓ', insight: '3r', sx: 5, syMult: 3 },
    { ratio: 3, note: 'sᵧ = 3sₓ', insight: '3r', sx: 10, syMult: 3 },
  ];

  // Nice r values that give clean results when multiplied
  const niceR = [0.5, 0.4, 0.6, 0.8, -0.5, -0.4, -0.6, -0.8];
  const r = niceR[Math.floor(Math.random() * niceR.length)];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const sx = scenario.sx;
  const sy = sx * scenario.syMult;
  const b = roundTo(r * scenario.ratio, 2);

  return {
    scenario: `Calculate the slope. Notice the relationship between sₓ and sᵧ.`,
    context: {
      ...context,
      modeId: 'ratio-check',
      modeName: 'Ratio Reasoning',
      r, sx, sy, b,
      ratio: scenario.ratio,
      insightAnswer: scenario.insight
    },
    answers: {
      b: {
        value: b,
        formula: `b = ${r} × (${sy}/${sx}) = ${r} × ${scenario.ratio} = ${b}`
      },
      insight: {
        value: scenario.insight,
        explanation: `When ${scenario.note}, b = ${scenario.insight}`
      }
    },
    given: { r, sx, sy },
    validation: {
      b: { expected: b, tolerance: 'tight' },
      insight: { expected: scenario.insight, type: 'exact' }
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
