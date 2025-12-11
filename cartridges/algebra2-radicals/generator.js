/**
 * Algebra 2 Radicals - Problem Generator
 * Generates visual radical simplification problems
 */

/**
 * Generate a problem for the given mode
 */
export function generateProblem(modeId, context, mode) {
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

export default { generateProblem };
