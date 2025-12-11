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
 */
function generateVisualRadical() {
  // Perfect squares and their square roots
  const perfectSquares = [
    { square: 4, root: 2 },
    { square: 9, root: 3 },
    { square: 16, root: 4 },
    { square: 25, root: 5 }
  ];

  // Non-square remainders (square-free numbers)
  const remainders = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];

  // Build a radicand as (perfect square) × (remainder)
  // Can also have multiple perfect square factors
  const useMultiple = Math.random() > 0.6;

  let coefficient = 1;
  let radicand;

  if (useMultiple) {
    // Use 2 perfect square factors: e.g., √(4 × 9 × 2) = 6√2
    const ps1 = perfectSquares[Math.floor(Math.random() * 2)]; // 4 or 9
    const ps2 = perfectSquares[Math.floor(Math.random() * 2)]; // 4 or 9
    const rem = remainders[Math.floor(Math.random() * remainders.length)];

    radicand = ps1.square * ps2.square * rem;
    coefficient = ps1.root * ps2.root;

    // Keep radicand manageable (under 200 squares)
    if (radicand > 200) {
      return generateVisualRadical(); // Regenerate
    }
  } else {
    // Single perfect square factor: e.g., √12 = 2√3
    const ps = perfectSquares[Math.floor(Math.random() * perfectSquares.length)];
    const rem = remainders[Math.floor(Math.random() * remainders.length)];

    radicand = ps.square * rem;
    coefficient = ps.root;
  }

  // Calculate what's left after full simplification
  const remainder = radicand / (coefficient * coefficient);

  const expression = `√${radicand}`;
  const simplified = coefficient === 1 ? `√${remainder}` : `${coefficient}√${remainder}`;

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
