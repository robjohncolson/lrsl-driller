// generator.js — Lesson 3-3 Quiz Prep: Cubes & Binomial Expansion
// Cartridge: a2t3l3-quiz
//
// Level mapping:
// L1: Identify Sum vs Difference of Cubes (Q1a prep)
// L2: Find a and b values (Q1b setup)
// L3: Factor using cube identity (Q1b complete)
// L4: Explain identity choice (Q1c prep)
// L5: Binomial term coefficient (Q2a+b prep)
// L6: Full binomial expansion (Q2c capstone)

// ============ UTILITY FUNCTIONS ============

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nCk(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= (n - (k - i));
    den *= i;
  }
  return Math.round(num / den);
}

// ============ SHUFFLE BAG SYSTEM ============
const shuffleBags = {};

function drawFromBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName].pop();
}

// ============ SCENARIO BANKS ============

// Master bank of cube factoring scenarios — shared across Levels 1-4
// Each has everything needed: expression, type, a, b, factored form, grading tokens
const cubeScenarios = [
  {
    expr: "8 + 125x^3", type: "Sum of Cubes",
    a: "2", b: "5x", a2: "4", ab: "10x", b2: "25x^2",
    factored: "(2+5x)(4-10x+25x^2)",
    reqTokens: ["2+5x", "4", "10x", "25x^2"],
    forbTokens: ["2-5x"],
    cubeA: "2^3 = 8", cubeB: "(5x)^3 = 125x^3"
  },
  {
    expr: "64 + 27a^3", type: "Sum of Cubes",
    a: "4", b: "3a", a2: "16", ab: "12a", b2: "9a^2",
    factored: "(4+3a)(16-12a+9a^2)",
    reqTokens: ["4+3a", "16", "12a", "9a^2"],
    forbTokens: ["4-3a"],
    cubeA: "4^3 = 64", cubeB: "(3a)^3 = 27a^3"
  },
  {
    expr: "27 - 8y^3", type: "Difference of Cubes",
    a: "3", b: "2y", a2: "9", ab: "6y", b2: "4y^2",
    factored: "(3-2y)(9+6y+4y^2)",
    reqTokens: ["3-2y", "9", "6y", "4y^2"],
    forbTokens: ["3+2y"],
    cubeA: "3^3 = 27", cubeB: "(2y)^3 = 8y^3"
  },
  {
    expr: "125m^3 + 64", type: "Sum of Cubes",
    a: "5m", b: "4", a2: "25m^2", ab: "20m", b2: "16",
    factored: "(5m+4)(25m^2-20m+16)",
    reqTokens: ["5m+4", "25m^2", "20m", "16"],
    forbTokens: ["5m-4"],
    cubeA: "(5m)^3 = 125m^3", cubeB: "4^3 = 64"
  },
  {
    expr: "216 - x^3", type: "Difference of Cubes",
    a: "6", b: "x", a2: "36", ab: "6x", b2: "x^2",
    factored: "(6-x)(36+6x+x^2)",
    reqTokens: ["6-x", "36", "6x", "x^2"],
    forbTokens: ["6+x"],
    cubeA: "6^3 = 216", cubeB: "x^3"
  },
  {
    expr: "8t^3 + 343", type: "Sum of Cubes",
    a: "2t", b: "7", a2: "4t^2", ab: "14t", b2: "49",
    factored: "(2t+7)(4t^2-14t+49)",
    reqTokens: ["2t+7", "4t^2", "14t", "49"],
    forbTokens: ["2t-7"],
    cubeA: "(2t)^3 = 8t^3", cubeB: "7^3 = 343"
  },
  {
    expr: "1000 - 27n^3", type: "Difference of Cubes",
    a: "10", b: "3n", a2: "100", ab: "30n", b2: "9n^2",
    factored: "(10-3n)(100+30n+9n^2)",
    reqTokens: ["10-3n", "100", "30n", "9n^2"],
    forbTokens: ["10+3n"],
    cubeA: "10^3 = 1000", cubeB: "(3n)^3 = 27n^3"
  },
  {
    expr: "64p^3 + 125", type: "Sum of Cubes",
    a: "4p", b: "5", a2: "16p^2", ab: "20p", b2: "25",
    factored: "(4p+5)(16p^2-20p+25)",
    reqTokens: ["4p+5", "16p^2", "20p", "25"],
    forbTokens: ["4p-5"],
    cubeA: "(4p)^3 = 64p^3", cubeB: "5^3 = 125"
  },
  {
    expr: "27x^3 + 1", type: "Sum of Cubes",
    a: "3x", b: "1", a2: "9x^2", ab: "3x", b2: "1",
    factored: "(3x+1)(9x^2-3x+1)",
    reqTokens: ["3x+1", "9x^2"],
    forbTokens: ["3x-1"],
    cubeA: "(3x)^3 = 27x^3", cubeB: "1^3 = 1"
  },
  {
    expr: "512 - 125r^3", type: "Difference of Cubes",
    a: "8", b: "5r", a2: "64", ab: "40r", b2: "25r^2",
    factored: "(8-5r)(64+40r+25r^2)",
    reqTokens: ["8-5r", "64", "40r", "25r^2"],
    forbTokens: ["8+5r"],
    cubeA: "8^3 = 512", cubeB: "(5r)^3 = 125r^3"
  },
  {
    expr: "343b^3 + 216", type: "Sum of Cubes",
    a: "7b", b: "6", a2: "49b^2", ab: "42b", b2: "36",
    factored: "(7b+6)(49b^2-42b+36)",
    reqTokens: ["7b+6", "49b^2", "42b", "36"],
    forbTokens: ["7b-6"],
    cubeA: "(7b)^3 = 343b^3", cubeB: "6^3 = 216"
  },
  {
    expr: "729 - 8k^3", type: "Difference of Cubes",
    a: "9", b: "2k", a2: "81", ab: "18k", b2: "4k^2",
    factored: "(9-2k)(81+18k+4k^2)",
    reqTokens: ["9-2k", "81", "18k", "4k^2"],
    forbTokens: ["9+2k"],
    cubeA: "9^3 = 729", cubeB: "(2k)^3 = 8k^3"
  }
];

// Binomial expansion scenarios — used for Levels 5-6
const binomialScenarios = [
  {
    expr: "(x - 3)^5", var: "x", constant: -3, n: 5,
    coeffs: [1, -15, 90, -270, 405, -243],
    expanded: "x^5 - 15x^4 + 90x^3 - 270x^2 + 405x - 243"
  },
  {
    expr: "(x - 2)^6", var: "x", constant: -2, n: 6,
    coeffs: [1, -12, 60, -160, 240, -192, 64],
    expanded: "x^6 - 12x^5 + 60x^4 - 160x^3 + 240x^2 - 192x + 64"
  },
  {
    expr: "(y - 5)^3", var: "y", constant: -5, n: 3,
    coeffs: [1, -15, 75, -125],
    expanded: "y^3 - 15y^2 + 75y - 125"
  },
  {
    expr: "(x - 2)^4", var: "x", constant: -2, n: 4,
    coeffs: [1, -8, 24, -32, 16],
    expanded: "x^4 - 8x^3 + 24x^2 - 32x + 16"
  },
  {
    expr: "(x + 4)^4", var: "x", constant: 4, n: 4,
    coeffs: [1, 16, 96, 256, 256],
    expanded: "x^4 + 16x^3 + 96x^2 + 256x + 256"
  },
  {
    expr: "(x - 1)^5", var: "x", constant: -1, n: 5,
    coeffs: [1, -5, 10, -10, 5, -1],
    expanded: "x^5 - 5x^4 + 10x^3 - 10x^2 + 5x - 1"
  },
  {
    expr: "(x + 2)^4", var: "x", constant: 2, n: 4,
    coeffs: [1, 8, 24, 32, 16],
    expanded: "x^4 + 8x^3 + 24x^2 + 32x + 16"
  },
  {
    expr: "(m - 4)^3", var: "m", constant: -4, n: 3,
    coeffs: [1, -12, 48, -64],
    expanded: "m^3 - 12m^2 + 48m - 64"
  }
];

// Build Level 5 term-coefficient questions from binomial scenarios
function buildTermQuestions() {
  const questions = [];
  for (const scen of binomialScenarios) {
    const n = scen.n;
    for (let k = 1; k < n; k++) {
      const power = n - k;
      const coeff = scen.coeffs[k];
      if (Math.abs(coeff) > 1) {
        const varStr = power === 1 ? scen.var : scen.var + "^" + power;
        const pascalRow = Array.from({ length: n + 1 }, (_, i) => nCk(n, i)).join(", ");
        questions.push({
          expr: scen.expr,
          var: scen.var,
          n,
          constant: scen.constant,
          k,
          power,
          coeff,
          pascalCoeff: nCk(n, k),
          constantPower: Math.pow(scen.constant, k),
          pascalRow,
          prompt: "In the expansion of " + scen.expr + ", what is the coefficient of " + varStr + "?"
        });
      }
    }
  }
  return questions;
}

const termQuestions = buildTermQuestions();

// ============ MAIN GENERATOR FUNCTION ============

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // -------- Level 1: Identify Sum vs Difference of Cubes --------
  if (modeId === "l01-identify-cube-type") {
    const scen = drawFromBag("l1", cubeScenarios);

    context = {
      levelName: "Level 1",
      problemText: "Which polynomial identity applies?",
      givenText: "Expression: " + scen.expr,
      expression: scen.expr,
      cubeA: scen.cubeA,
      cubeB: scen.cubeB
    };

    answers = { identityType: { value: scen.type } };
    context.answers = answers;
    scenario = "Which cube identity: " + scen.expr + "?";
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 2: Find a and b --------
  if (modeId === "l02-find-a-and-b") {
    const scen = drawFromBag("l2", cubeScenarios);

    context = {
      levelName: "Level 2",
      problemText: "This is a " + scen.type + ". Identify a and b.",
      givenText: "Expression: " + scen.expr + "\nIdentity: " + scen.type +
        "\nFormula: a\u00b3 " + (scen.type === "Sum of Cubes" ? "+" : "\u2212") +
        " b\u00b3 = (a" + (scen.type === "Sum of Cubes" ? "+" : "\u2212") +
        "b)(a\u00b2" + (scen.type === "Sum of Cubes" ? "\u2212" : "+") + "ab+b\u00b2)",
      expression: scen.expr,
      type: scen.type,
      cubeA: scen.cubeA,
      cubeB: scen.cubeB
    };

    answers = {
      aValue: { value: scen.a },
      bValue: { value: scen.b }
    };
    context.answers = answers;
    scenario = "Find a and b for " + scen.expr;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 3: Factor Using the Identity --------
  if (modeId === "l03-factor-cubes") {
    const scen = drawFromBag("l3", cubeScenarios);

    context = {
      levelName: "Level 3",
      problemText: "Factor completely using a polynomial identity.",
      givenText: "Factor: " + scen.expr,
      expression: scen.expr,
      type: scen.type,
      a: scen.a,
      b: scen.b,
      factorRequiredTokens: scen.reqTokens,
      factorForbiddenTokens: scen.forbTokens
    };

    answers = { factoredForm: { value: scen.factored } };
    context.answers = answers;
    scenario = "Factor: " + scen.expr;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 4: Explain Identity Choice --------
  if (modeId === "l04-explain-identity") {
    const scen = drawFromBag("l4", cubeScenarios);
    const signWord = scen.type === "Sum of Cubes" ? "addition (+)" : "subtraction (\u2212)";

    context = {
      levelName: "Level 4",
      problemText: "Identify the identity and explain how you knew.",
      givenText: "Expression: " + scen.expr + "\nFactored: " + scen.factored,
      expression: scen.expr,
      type: scen.type,
      a: scen.a,
      b: scen.b,
      cubeA: scen.cubeA,
      cubeB: scen.cubeB,
      factored: scen.factored
    };

    answers = {
      identityChoice: { value: scen.type },
      explanation: {
        value: "I used the " + scen.type.toLowerCase() + " identity because the expression uses " +
          signWord + ", and both terms are perfect cubes: " + scen.cubeA + " and " + scen.cubeB + "."
      }
    };
    context.answers = answers;
    scenario = "Explain identity choice for " + scen.expr;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 5: Binomial Term Coefficient --------
  if (modeId === "l05-binomial-term-coeff") {
    const q = drawFromBag("l5", termQuestions);

    context = {
      levelName: "Level 5",
      problemText: q.prompt,
      givenText: "Expression: " + q.expr + "\nPascal's Row " + q.n + ": " + q.pascalRow +
        "\nUse: C(" + q.n + "," + q.k + ") \u00d7 (" + q.constant + ")^" + q.k,
      expression: q.expr,
      var: q.var,
      n: q.n,
      k: q.k,
      constant: q.constant,
      power: q.power,
      pascalCoeff: q.pascalCoeff,
      constantPower: q.constantPower
    };

    answers = { termCoeff: { value: q.coeff, tolerance: 0 } };
    context.answers = answers;
    scenario = q.prompt;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Level 6: Full Binomial Expansion --------
  if (modeId === "l06-full-expansion") {
    const scen = drawFromBag("l6", binomialScenarios);
    const pascalRow = Array.from({ length: scen.n + 1 }, (_, k) => nCk(scen.n, k)).join(", ");

    context = {
      levelName: "Level 6",
      problemText: "Expand " + scen.expr + " completely in standard form.",
      givenText: "Expression: " + scen.expr + "\nPascal's Row " + scen.n + ": " + pascalRow,
      expression: scen.expr,
      var: scen.var,
      n: scen.n,
      constant: scen.constant,
      coefficients: scen.coeffs,
      expectedExpanded: scen.expanded
    };

    answers = { expandedPoly: { value: scen.expanded } };
    context.answers = answers;
    scenario = "Expand " + scen.expr;
    return { context, graphConfig, answers, scenario };
  }

  // -------- Fallback --------
  return {
    context: { levelName: "Unknown", problemText: "Mode not implemented", givenText: "" },
    graphConfig: null,
    answers: {},
    scenario: "Mode not implemented: " + modeId
  };
}

export default { generateProblem };
