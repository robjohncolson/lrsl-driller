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
  if (modeId === 'simplify-radicals-typed') {
    return generateTypedRadical();
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
  // Curated list of good radicands for visual learning (25+ problems)
  // Format: [radicand, coefficient, remainder]
  // e.g., √12 = 2√3, so [12, 2, 3]
  const problems = [
    // Easy: coefficient = 2 (extracting 4)
    [8, 2, 2],    // √8 = 2√2
    [12, 2, 3],   // √12 = 2√3
    [20, 2, 5],   // √20 = 2√5
    [28, 2, 7],   // √28 = 2√7
    [44, 2, 11],  // √44 = 2√11
    [52, 2, 13],  // √52 = 2√13

    // Medium: coefficient = 3 (extracting 9)
    [18, 3, 2],   // √18 = 3√2
    [27, 3, 3],   // √27 = 3√3
    [45, 3, 5],   // √45 = 3√5
    [63, 3, 7],   // √63 = 3√7
    [99, 3, 11],  // √99 = 3√11

    // Coefficient = 4 (extracting 16)
    [32, 4, 2],   // √32 = 4√2
    [48, 4, 3],   // √48 = 4√3
    [80, 4, 5],   // √80 = 4√5
    [112, 4, 7],  // √112 = 4√7

    // Coefficient = 5 (extracting 25)
    [50, 5, 2],   // √50 = 5√2
    [75, 5, 3],   // √75 = 5√3
    [125, 5, 5],  // √125 = 5√5
    [175, 5, 7],  // √175 = 5√7

    // Coefficient = 6 (extracting 36)
    [72, 6, 2],   // √72 = 6√2
    [108, 6, 3],  // √108 = 6√3
    [180, 6, 5],  // √180 = 6√5

    // Perfect squares (no remainder)
    [4, 2, 1],    // √4 = 2
    [9, 3, 1],    // √9 = 3
    [16, 4, 1],   // √16 = 4
    [25, 5, 1],   // √25 = 5
    [36, 6, 1],   // √36 = 6
    [49, 7, 1],   // √49 = 7
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
  // Problems good for prime factorization approach (25+ problems)
  // Curated so prime factorization isn't too long
  const problems = [
    // Easy: short factorizations
    [12, 2, 3],   // √12 = √(2×2×3) = 2√3
    [18, 3, 2],   // √18 = √(2×3×3) = 3√2
    [20, 2, 5],   // √20 = √(2×2×5) = 2√5
    [28, 2, 7],   // √28 = √(2×2×7) = 2√7
    [44, 2, 11],  // √44 = √(2×2×11) = 2√11
    [45, 3, 5],   // √45 = √(3×3×5) = 3√5
    [50, 5, 2],   // √50 = √(2×5×5) = 5√2
    [52, 2, 13],  // √52 = √(2×2×13) = 2√13
    [63, 3, 7],   // √63 = √(3×3×7) = 3√7
    [68, 2, 17],  // √68 = √(2×2×17) = 2√17

    // Medium: more factors
    [72, 6, 2],   // √72 = √(2×2×2×3×3) = 6√2
    [75, 5, 3],   // √75 = √(3×5×5) = 5√3
    [80, 4, 5],   // √80 = √(2×2×2×2×5) = 4√5
    [98, 7, 2],   // √98 = √(2×7×7) = 7√2
    [99, 3, 11],  // √99 = √(3×3×11) = 3√11
    [108, 6, 3],  // √108 = √(2×2×3×3×3) = 6√3
    [112, 4, 7],  // √112 = √(2×2×2×2×7) = 4√7
    [125, 5, 5],  // √125 = √(5×5×5) = 5√5
    [147, 7, 3],  // √147 = √(3×7×7) = 7√3
    [175, 5, 7],  // √175 = √(5×5×7) = 5√7
    [180, 6, 5],  // √180 = √(2×2×3×3×5) = 6√5

    // Perfect squares
    [36, 6, 1],   // √36 = √(2×2×3×3) = 6
    [49, 7, 1],   // √49 = √(7×7) = 7
    [64, 8, 1],   // √64 = √(2×2×2×2×2×2) = 8
    [81, 9, 1],   // √81 = √(3×3×3×3) = 9
    [100, 10, 1], // √100 = √(2×2×5×5) = 10
    [121, 11, 1], // √121 = √(11×11) = 11
    [169, 13, 1], // √169 = √(13×13) = 13
    [196, 14, 1], // √196 = √(2×2×7×7) = 14
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

/**
 * Generate typed radical problems (Level 3)
 * No visual scaffolding - student types coefficient and radicand
 */
function generateTypedRadical() {
  // Mix of problems from easy to hard (40+ problems)
  const problems = [
    // Easy: coefficient = 2
    [8, 2, 2],    // √8 = 2√2
    [12, 2, 3],   // √12 = 2√3
    [20, 2, 5],   // √20 = 2√5
    [28, 2, 7],   // √28 = 2√7
    [44, 2, 11],  // √44 = 2√11
    [52, 2, 13],  // √52 = 2√13

    // Coefficient = 3
    [18, 3, 2],   // √18 = 3√2
    [27, 3, 3],   // √27 = 3√3
    [45, 3, 5],   // √45 = 3√5
    [63, 3, 7],   // √63 = 3√7
    [99, 3, 11],  // √99 = 3√11
    [117, 3, 13], // √117 = 3√13

    // Coefficient = 4
    [32, 4, 2],   // √32 = 4√2
    [48, 4, 3],   // √48 = 4√3
    [80, 4, 5],   // √80 = 4√5
    [112, 4, 7],  // √112 = 4√7
    [176, 4, 11], // √176 = 4√11

    // Coefficient = 5
    [50, 5, 2],   // √50 = 5√2
    [75, 5, 3],   // √75 = 5√3
    [125, 5, 5],  // √125 = 5√5
    [175, 5, 7],  // √175 = 5√7

    // Coefficient = 6
    [72, 6, 2],   // √72 = 6√2
    [108, 6, 3],  // √108 = 6√3
    [180, 6, 5],  // √180 = 6√5

    // Coefficient = 7
    [98, 7, 2],   // √98 = 7√2
    [147, 7, 3],  // √147 = 7√3

    // Coefficient = 8
    [128, 8, 2],  // √128 = 8√2
    [192, 8, 3],  // √192 = 8√3

    // Coefficient = 9
    [162, 9, 2],  // √162 = 9√2

    // Coefficient = 10
    [200, 10, 2], // √200 = 10√2

    // Perfect squares
    [4, 2, 1],    // √4 = 2
    [9, 3, 1],    // √9 = 3
    [16, 4, 1],   // √16 = 4
    [25, 5, 1],   // √25 = 5
    [36, 6, 1],   // √36 = 6
    [49, 7, 1],   // √49 = 7
    [64, 8, 1],   // √64 = 8
    [81, 9, 1],   // √81 = 9
    [100, 10, 1], // √100 = 10
    [121, 11, 1], // √121 = 11
    [144, 12, 1], // √144 = 12
    [169, 13, 1], // √169 = 13 (prime squared)
    [196, 14, 1], // √196 = 14
  ];

  const [radicand, coefficient, remainder] = pickProblem(problems);

  const expression = `√${radicand}`;
  const simplified = remainder === 1 ? `${coefficient}` : `${coefficient}√${remainder}`;

  return {
    context: {
      radicand,
      coefficient,
      remainingRadicand: remainder,
      problemType: 'No Scaffolding',
      expression,
      // These are for grading the typed fields
      'typed-coefficient': coefficient,
      'typed-radicand': remainder
    },
    graphConfig: null,
    answers: {
      'typed-coefficient': coefficient.toString(),
      'typed-radicand': remainder.toString()
    },
    scenario: `Simplify √${radicand}. Enter the coefficient and remaining radicand.`
  };
}

export default { generateProblem };
