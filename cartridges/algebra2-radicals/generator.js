/**
 * Algebra 2 Radicals - Problem Generator
 * Generates visual radical simplification problems
 */

// Track last problem to avoid immediate repeats
let lastRadicand = null;

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, mode) {
  if (modeId === 'simplify-radicals-hard') {
    return generatePrimeRadical();
  }
  return generateVisualRadical();
}

/**
 * Pick a random problem from array, avoiding immediate repeats
 */
function pickProblem(problems) {
  // Filter out last problem if we have more than 1 option
  const available = problems.length > 1
    ? problems.filter(p => p[0] !== lastRadicand)
    : problems;

  const selected = available[Math.floor(Math.random() * available.length)];
  lastRadicand = selected[0];
  return selected;
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

  const [radicand, coefficient, remainder] = pickProblem(problems);

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
 * Generate prime factorization radical problems (Level 2)
 * Students build the factorization and drag pairs outside
 */
function generatePrimeRadical() {
  // Problems good for prime factorization approach
  // Curated so prime factorization isn't too long
  const problems = [
    // Easy prime factorizations
    [12, 2, 3],   // √12 = √(2×2×3) = 2√3
    [18, 3, 2],   // √18 = √(2×3×3) = 3√2
    [20, 2, 5],   // √20 = √(2×2×5) = 2√5
    [28, 2, 7],   // √28 = √(2×2×7) = 2√7
    [45, 3, 5],   // √45 = √(3×3×5) = 3√5
    [50, 5, 2],   // √50 = √(2×5×5) = 5√2
    [63, 3, 7],   // √63 = √(3×3×7) = 3√7

    // Medium: more factors
    [72, 6, 2],   // √72 = √(2×2×2×3×3) = 6√2
    [75, 5, 3],   // √75 = √(3×5×5) = 5√3
    [98, 7, 2],   // √98 = √(2×7×7) = 7√2
    [80, 4, 5],   // √80 = √(2×2×2×2×5) = 4√5
    [108, 6, 3], // √108 = √(2×2×3×3×3) = 6√3
    [125, 5, 5], // √125 = √(5×5×5) = 5√5

    // Perfect squares
    [36, 6, 1],   // √36 = √(2×2×3×3) = 6
    [49, 7, 1],   // √49 = √(7×7) = 7
    [64, 8, 1],   // √64 = √(2×2×2×2×2×2) = 8
    [81, 9, 1],   // √81 = √(3×3×3×3) = 9
    [100, 10, 1], // √100 = √(2×2×5×5) = 10
    [121, 11, 1], // √121 = √(11×11) = 11
  ];

  const [radicand, coefficient, remainder] = pickProblem(problems);

  const expression = `√${radicand}`;
  const simplified = remainder === 1 ? `${coefficient}` : `${coefficient}√${remainder}`;

  return {
    context: {
      radicand,
      coefficient,
      remainingRadicand: remainder,
      problemType: 'Prime Factorization',
      expression
    },
    graphConfig: null,
    answers: {
      'visual-radical-prime': {
        value: simplified,
        coefficient: coefficient,
        radicand: remainder,
        totalSquares: radicand
      }
    },
    scenario: `Build the prime factorization of √${radicand}, then drag matching pairs outside the radical`
  };
}

export default { generateProblem };
