/**
 * Algebra 2 Radicals - Problem Generator
 * Generates visual radical simplification problems
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, mode) {
  if (modeId === 'simplify-radicals-hard') {
    return generateHardRadical();
  }
  return generateVisualRadical();
}

/**
 * Generate a number for visual radical simplification
 * Students will arrange unit squares into perfect square groups
 * Keeps numbers small and manageable (under 50 squares)
 */
function generateVisualRadical() {
  // Curated list of good radicands for visual learning
  // Format: [radicand, coefficient, remainder]
  // e.g., √12 = 2√3, so [12, 2, 3]
  const problems = [
    // Easy: single 2×2 group
    [8, 2, 2],    // √8 = 2√2
    [12, 2, 3],   // √12 = 2√3
    [20, 2, 5],   // √20 = 2√5

    // Medium: single 3×3 group
    [18, 3, 2],   // √18 = 3√2
    [27, 3, 3],   // √27 = 3√3
    [45, 3, 5],   // √45 = 3√5

    // Perfect squares (no remainder)
    [4, 2, 1],    // √4 = 2
    [9, 3, 1],    // √9 = 3
    [16, 4, 1],   // √16 = 4
    [25, 5, 1],   // √25 = 5

    // Slightly harder: 4×4 group
    [32, 4, 2],   // √32 = 4√2
    [48, 4, 3],   // √48 = 4√3
  ];

  const [radicand, coefficient, remainder] = problems[Math.floor(Math.random() * problems.length)];

  const expression = `√${radicand}`;
  const simplified = remainder === 1 ? `${coefficient}` : `${coefficient}√${remainder}`;

  return {
    context: {
      radicand,
      coefficient,
      remainingRadicand: remainder,
      problemType: 'Simplify Radical',
      expression
    },
    graphConfig: null,
    answers: {
      'visual-radical': {
        value: simplified,
        coefficient: coefficient,
        radicand: remainder,
        totalSquares: radicand
      }
    },
    scenario: `Simplify √${radicand} by grouping unit squares into perfect squares (2×2, 3×3, etc.)`
  };
}

/**
 * Generate harder radical problems (Level 2)
 * Larger numbers requiring multiple extractions
 */
function generateHardRadical() {
  // Harder problems with larger radicands
  // May require multiple factor extractions
  const problems = [
    // Medium-hard: requires 2 extractions or large single extraction
    [72, 6, 2],    // √72 = √(36×2) = 6√2
    [75, 5, 3],    // √75 = √(25×3) = 5√3
    [80, 4, 5],    // √80 = √(16×5) = 4√5
    [98, 7, 2],    // √98 = √(49×2) = 7√2
    [50, 5, 2],    // √50 = √(25×2) = 5√2
    [63, 3, 7],    // √63 = √(9×7) = 3√7

    // Hard: larger numbers
    [128, 8, 2],   // √128 = √(64×2) = 8√2
    [147, 7, 3],   // √147 = √(49×3) = 7√3
    [200, 10, 2],  // √200 = √(100×2) = 10√2
    [162, 9, 2],   // √162 = √(81×2) = 9√2
    [175, 5, 7],   // √175 = √(25×7) = 5√7
    [180, 6, 5],   // √180 = √(36×5) = 6√5

    // Multi-step: requires sequential extractions
    [288, 12, 2],  // √288 = √(144×2) = 12√2, or √(4×72) then √(4×18) then √(9×2)
    [242, 11, 2],  // √242 = √(121×2) = 11√2
    [245, 7, 5],   // √245 = √(49×5) = 7√5
    [252, 6, 7],   // √252 = √(36×7) = 6√7

    // Perfect squares (larger)
    [64, 8, 1],    // √64 = 8
    [81, 9, 1],    // √81 = 9
    [100, 10, 1],  // √100 = 10
    [121, 11, 1],  // √121 = 11
    [144, 12, 1],  // √144 = 12
  ];

  const [radicand, coefficient, remainder] = problems[Math.floor(Math.random() * problems.length)];

  const expression = `√${radicand}`;
  const simplified = remainder === 1 ? `${coefficient}` : `${coefficient}√${remainder}`;

  return {
    context: {
      radicand,
      coefficient,
      remainingRadicand: remainder,
      problemType: 'Simplify Radical (Hard)',
      expression
    },
    graphConfig: null,
    answers: {
      'visual-radical': {
        value: simplified,
        coefficient: coefficient,
        radicand: remainder,
        totalSquares: radicand
      }
    },
    scenario: `Simplify √${radicand} by extracting perfect square factors`
  };
}

export default { generateProblem };
