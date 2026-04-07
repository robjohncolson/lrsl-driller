// generator.js — Zeros of Polynomial Functions
// Cartridge: a2t3l5

// ============ UTILITY FUNCTIONS ============

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = randInt(0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(value);
}

function formatNumberList(values) {
  return values
    .slice()
    .sort((a, b) => a - b)
    .map(formatNumber)
    .join(", ");
}

function formatComplex(real, imag) {
  if (imag === 0) {
    return formatNumber(real);
  }

  const imagAbs = Math.abs(imag);
  const imagPart = imagAbs === 1 ? "i" : `${imagAbs}i`;

  if (real === 0) {
    return imag < 0 ? `-${imagPart}` : imagPart;
  }

  const sign = imag < 0 ? "-" : "+";
  return `${formatNumber(real)} ${sign} ${imagPart}`;
}

function buildChoiceOptions(correct, distractors) {
  const options = shuffle([correct, ...distractors]).map(String);
  const context = {};

  if (options[0] !== undefined) context.optA = options[0];
  if (options[1] !== undefined) context.optB = options[1];
  if (options[2] !== undefined) context.optC = options[2];
  if (options[3] !== undefined) context.optD = options[3];

  return { options, context };
}

function withIds(prefix, items) {
  return items.map((item, index) => ({ id: `${prefix}-${index + 1}`, ...item }));
}

// ============ SHUFFLE BAG SYSTEM ============
// Refill from a shuffled batch and avoid immediate repeats with a short history.

const BAG_BATCH_SIZE = 12;
const BAG_HISTORY_SIZE = 4;
const shuffleBags = {};
const recentHistory = {};

function drawFromBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    const recent = recentHistory[bankName] || [];
    let eligible = sourceArray.filter(item => !recent.includes(item.id));

    if (eligible.length === 0) {
      eligible = sourceArray.slice();
    }

    shuffleBags[bankName] = shuffle(eligible).slice(0, Math.min(BAG_BATCH_SIZE, eligible.length));
  }

  const picked = shuffleBags[bankName].pop();
  recentHistory[bankName] = [...(recentHistory[bankName] || []), picked.id].slice(-BAG_HISTORY_SIZE);
  return picked;
}

// ============ SCENARIO BANKS ============

const level1Scenarios = withIds("l01", [
  {
    prompt: "Which statement best defines a zero (root) of a polynomial?",
    options: [
      "The y-value where x = 0",
      "The x-value where f(x) = 0",
      "The greatest exponent",
      "The number of turning points"
    ],
    correct: "The x-value where f(x) = 0"
  },
  {
    prompt: "What does multiplicity of a zero mean?",
    options: [
      "How many different zeros",
      "How many times a factor repeats",
      "Whether the graph has a y-intercept",
      "How many terms are in the polynomial"
    ],
    correct: "How many times a factor repeats"
  },
  {
    prompt: "In the factor (x + 7), what is the zero?",
    options: ["7", "-7", "0", "Cannot be found"],
    correct: "-7"
  },
  {
    prompt: "What does “tangent to the x-axis” most likely mean?",
    options: [
      "The graph crosses",
      "The graph touches and turns",
      "There is a vertical asymptote",
      "It is the y-intercept"
    ],
    correct: "The graph touches and turns"
  },
  {
    prompt: "What does end behavior describe?",
    options: [
      "Where the graph crosses the x-axis",
      "What happens as x goes to positive or negative infinity",
      "The vertex of the graph",
      "The slope"
    ],
    correct: "What happens as x goes to positive or negative infinity"
  },
  {
    prompt: "Which is interval notation?",
    options: [
      "x = -3, 0, 4",
      "(-2, 0) U (2, inf)",
      "f(x) = x(x-2)(x+2)",
      "x^2 + 9 = 0"
    ],
    correct: "(-2, 0) U (2, inf)"
  },
  {
    prompt: "Which is true about (x - 1)^4?",
    options: [
      "Zero is x = 1 with multiplicity 4",
      "Zero is x = -1 with multiplicity 4",
      "There are four different zeros",
      "The graph must cross at x = 1"
    ],
    correct: "Zero is x = 1 with multiplicity 4"
  },
  {
    prompt: "For P(x) > 0, should zeros be included in the solution set?",
    options: [
      "Yes, always",
      "No, never",
      "Only if the inequality is >= or <=",
      "Only if the polynomial is quadratic"
    ],
    correct: "No, never"
  },
  {
    prompt: "A polynomial of degree 3 has how many zeros, counting multiplicity?",
    options: ["Exactly 3", "At most 3", "Exactly 2", "Cannot determine"],
    correct: "Exactly 3"
  },
  {
    prompt: "What does the Zero-Product Property say?",
    options: [
      "If ab = 0, then a = 0 or b = 0",
      "If a + b = 0, then a = 0",
      "If a = b, then both are zero",
      "If a > 0, then b > 0"
    ],
    correct: "If ab = 0, then a = 0 or b = 0"
  }
]);

const level2Scenarios = withIds("l02", [
  { factor: "(x - 5)", correct: "5", distractors: ["-5", "0", "1"] },
  { factor: "(x + 3)", correct: "-3", distractors: ["3", "0", "-1"] },
  { factor: "(x - 7)", correct: "7", distractors: ["-7", "1", "0"] },
  { factor: "(x + 1)", correct: "-1", distractors: ["1", "0", "-2"] },
  { factor: "(x)", correct: "0", distractors: ["1", "-1", "undefined"] },
  { factor: "(x - 10)", correct: "10", distractors: ["-10", "1", "0"] },
  { factor: "(x + 6)", correct: "-6", distractors: ["6", "-3", "0"] },
  { factor: "(2x - 4)", correct: "2", distractors: ["4", "-2", "-4"] },
  { factor: "(3x + 9)", correct: "-3", distractors: ["9", "3", "-9"] },
  { factor: "(x + 8)", correct: "-8", distractors: ["8", "-4", "0"] }
]);

const level3Scenarios = withIds("l03", [
  { expression: "(x-2)^3(x+1)", zeroAsked: "2", correct: "3", distractors: ["1", "4", "2"] },
  { expression: "x^2(x-7)", zeroAsked: "0", correct: "2", distractors: ["1", "3", "0"] },
  { expression: "(x+4)(x-1)^4", zeroAsked: "1", correct: "4", distractors: ["1", "5", "-1"] },
  { expression: "(x-3)^2(x+5)^2", zeroAsked: "-5", correct: "2", distractors: ["4", "1", "5"] },
  { expression: "(x+2)^5", zeroAsked: "-2", correct: "5", distractors: ["1", "2", "-2"] },
  { expression: "x(x-6)^3(x+1)^2", zeroAsked: "-1", correct: "2", distractors: ["3", "6", "1"] },
  { expression: "x(x-6)^3(x+1)^2", zeroAsked: "6", correct: "3", distractors: ["1", "6", "2"] },
  { expression: "(x-4)^4(x+3)", zeroAsked: "4", correct: "4", distractors: ["1", "5", "-4"] },
  { expression: "(x+7)^2(x-2)^2(x)", zeroAsked: "0", correct: "1", distractors: ["2", "5", "0"] },
  { expression: "(x-1)^6", zeroAsked: "1", correct: "6", distractors: ["1", "3", "-1"] }
]);

const CROSS_LABEL = "Crosses the x-axis";
const TOUCH_LABEL = "Touches (bounces off) the x-axis";

const level4Scenarios = withIds("l04", [
  { expression: "(x-1)^2(x+3)", zero: "1", mult: 2, correct: TOUCH_LABEL },
  { expression: "(x-1)^2(x+3)", zero: "-3", mult: 1, correct: CROSS_LABEL },
  { expression: "(x+2)^3(x-4)^2", zero: "-2", mult: 3, correct: CROSS_LABEL },
  { expression: "(x+2)^3(x-4)^2", zero: "4", mult: 2, correct: TOUCH_LABEL },
  { expression: "x^4(x-6)", zero: "0", mult: 4, correct: TOUCH_LABEL },
  { expression: "x^4(x-6)", zero: "6", mult: 1, correct: CROSS_LABEL },
  { expression: "(x+1)^5", zero: "-1", mult: 5, correct: CROSS_LABEL },
  { expression: "(x-3)^2(x+1)^2", zero: "3", mult: 2, correct: TOUCH_LABEL },
  { expression: "(x-3)^2(x+1)^2", zero: "-1", mult: 2, correct: TOUCH_LABEL },
  { expression: "x(x-5)(x+2)", zero: "0", mult: 1, correct: CROSS_LABEL },
  { expression: "(x+4)^4(x-2)^3", zero: "-4", mult: 4, correct: TOUCH_LABEL },
  { expression: "(x+4)^4(x-2)^3", zero: "2", mult: 3, correct: CROSS_LABEL }
]);

const level5Scenarios = withIds("l05", [
  { polynomial: "x^3 + 2x^2 - 3x", factorization: "x(x+3)(x-1)", zeros: [-3, 0, 1] },
  { polynomial: "2x^3 - 8x^2 + 6x", factorization: "2x(x-1)(x-3)", zeros: [0, 1, 3] },
  { polynomial: "x^3 - 4x", factorization: "x(x-2)(x+2)", zeros: [-2, 0, 2] },
  { polynomial: "3x^3 + 12x^2 + 9x", factorization: "3x(x+1)(x+3)", zeros: [-3, -1, 0] },
  { polynomial: "x^3 - x^2 - 6x", factorization: "x(x-3)(x+2)", zeros: [-2, 0, 3] },
  { polynomial: "x^3 + 5x^2 + 6x", factorization: "x(x+2)(x+3)", zeros: [-3, -2, 0] },
  { polynomial: "4x^3 - 4x", factorization: "4x(x-1)(x+1)", zeros: [-1, 0, 1] },
  { polynomial: "x^3 - 9x", factorization: "x(x-3)(x+3)", zeros: [-3, 0, 3] },
  { polynomial: "x^3 + x^2 - 2x", factorization: "x(x+2)(x-1)", zeros: [-2, 0, 1] },
  { polynomial: "5x^3 - 20x^2 + 15x", factorization: "5x(x-1)(x-3)", zeros: [0, 1, 3] }
]);

const level6Scenarios = withIds("l06", [
  {
    expression: "x(x+4)(x-1)^4",
    reports: [
      { zero: -4, mult: 1, behavior: "cross" },
      { zero: 0, mult: 1, behavior: "cross" },
      { zero: 1, mult: 4, behavior: "touch" }
    ]
  },
  {
    expression: "(x^2+9)(x-1)^5(x+2)^2",
    reports: [
      { zero: -2, mult: 2, behavior: "touch" },
      { zero: 1, mult: 5, behavior: "cross" }
    ]
  },
  {
    expression: "-(x-3)^3(x+1)^2",
    reports: [
      { zero: -1, mult: 2, behavior: "touch" },
      { zero: 3, mult: 3, behavior: "cross" }
    ]
  },
  {
    expression: "(x+5)^2(x-2)^2",
    reports: [
      { zero: -5, mult: 2, behavior: "touch" },
      { zero: 2, mult: 2, behavior: "touch" }
    ]
  },
  {
    expression: "2x^2(x-4)(x+1)^3",
    reports: [
      { zero: -1, mult: 3, behavior: "cross" },
      { zero: 0, mult: 2, behavior: "touch" },
      { zero: 4, mult: 1, behavior: "cross" }
    ]
  },
  {
    expression: "-(x-1)^2(x+4)",
    reports: [
      { zero: -4, mult: 1, behavior: "cross" },
      { zero: 1, mult: 2, behavior: "touch" }
    ]
  },
  {
    expression: "(x+3)^4(x-1)(x+1)",
    reports: [
      { zero: -3, mult: 4, behavior: "touch" },
      { zero: -1, mult: 1, behavior: "cross" },
      { zero: 1, mult: 1, behavior: "cross" }
    ]
  },
  {
    expression: "x^3(x-2)^5",
    reports: [
      { zero: 0, mult: 3, behavior: "cross" },
      { zero: 2, mult: 5, behavior: "cross" }
    ]
  },
  {
    expression: "(x-5)(x-1)^2",
    reports: [
      { zero: 1, mult: 2, behavior: "touch" },
      { zero: 5, mult: 1, behavior: "cross" }
    ]
  },
  {
    expression: "x(x-6)^3(x+1)^2",
    reports: [
      { zero: -1, mult: 2, behavior: "touch" },
      { zero: 0, mult: 1, behavior: "cross" },
      { zero: 6, mult: 3, behavior: "cross" }
    ]
  }
]);

const level7Scenarios = withIds("l07", [
  { expression: "x(x-4)(x+3)", ask: "f(x) > 0", answer: "(-3, 0) U (4, inf)" },
  { expression: "-(x-1)^2(x+4)", ask: "f(x) > 0", answer: "(-inf, -4)" },
  { expression: "(x+2)^3(x-1)^2", ask: "f(x) < 0", answer: "(-inf, -2)" },
  { expression: "2(x-3)(x+1)^2", ask: "f(x) > 0", answer: "(3, inf)" },
  { expression: "-(x+5)^2(x-2)^2", ask: "f(x) > 0", answer: "empty set" },
  { expression: "(x-4)(x-1)(x+2)", ask: "f(x) > 0", answer: "(-2, 1) U (4, inf)" },
  { expression: "-x(x+3)^4(x-1)", ask: "f(x) > 0", answer: "(0, 1)" },
  { expression: "(x+1)^3(x-6)", ask: "f(x) < 0", answer: "(-1, 6)" },
  { expression: "x(x-4)(x+3)", ask: "f(x) < 0", answer: "(-inf, -3) U (0, 4)" },
  { expression: "x(x+3)(x-1)", ask: "f(x) > 0", answer: "(-3, 0) U (1, inf)" }
]);

const REAL_LABEL = "Two real zeros";
const COMPLEX_LABEL = "Two complex zeros (no real zeros)";

const level8Scenarios = withIds("l08", [
  { factor: "x^2 + 9", a: 1, b: 0, c: 9, discriminant: -36, correct: COMPLEX_LABEL },
  { factor: "x^2 - 4", a: 1, b: 0, c: -4, discriminant: 16, correct: REAL_LABEL },
  { factor: "x^2 + 2x + 5", a: 1, b: 2, c: 5, discriminant: -16, correct: COMPLEX_LABEL },
  { factor: "x^2 - 6x + 9", a: 1, b: -6, c: 9, discriminant: 0, correct: REAL_LABEL },
  { factor: "x^2 + 1", a: 1, b: 0, c: 1, discriminant: -4, correct: COMPLEX_LABEL },
  { factor: "x^2 - 5x + 6", a: 1, b: -5, c: 6, discriminant: 1, correct: REAL_LABEL },
  { factor: "x^2 + 4x + 8", a: 1, b: 4, c: 8, discriminant: -16, correct: COMPLEX_LABEL },
  { factor: "x^2 - x - 6", a: 1, b: -1, c: -6, discriminant: 25, correct: REAL_LABEL },
  { factor: "x^2 + 16", a: 1, b: 0, c: 16, discriminant: -64, correct: COMPLEX_LABEL },
  { factor: "x^2 + 6x + 9", a: 1, b: 6, c: 9, discriminant: 0, correct: REAL_LABEL }
]);

const level9Scenarios = withIds("l09", [
  { expression: "(3 + 5i)^2", real: -16, imag: 30 },
  { expression: "(2 + 3i)^2", real: -5, imag: 12 },
  { expression: "(1 + 4i)^2", real: -15, imag: 8 },
  { expression: "(4 + i)^2", real: 15, imag: 8 },
  { expression: "(5 + 2i)^2", real: 21, imag: 20 },
  { expression: "(1 + i)^2", real: 0, imag: 2 },
  { expression: "(3 + 2i)^2", real: 5, imag: 12 },
  { expression: "(2 + 5i)^2", real: -21, imag: 20 },
  { expression: "(6 + i)^2", real: 35, imag: 12 },
  { expression: "(4 + 3i)^2", real: 7, imag: 24 }
]);

const level10Scenarios = withIds("l10", [
  { equation: "x^3 + 5x^2 - x - 7 = x^2 + 6x + 3", solutions: [-5, -1, 2] },
  { equation: "2x^3 + 5x^2 - 3x = 3x^3 + 8x^2 + 1", solutions: [-1] },
  { equation: "x^3 - 3x^2 - 6x + 8 = x^2 - 6x + 8", solutions: [0, 4] },
  { equation: "x^4 + 2x^2 + 40x = 7x^3", solutions: [-2, 0, 4, 5] },
  { equation: "x^3 + x^2 - 9x - 9 = x^2 - 9", solutions: [-3, 0, 3] },
  { equation: "-x^3 - 2x^2 + 7x = 4", solutions: [-4, 1] },
  { equation: "x^3 + 4x^2 - 3x = 18", solutions: [-3, 2] },
  { equation: "x^3 - 3x^2 = -4", solutions: [-1, 2] }
]);

const level11Scenarios = withIds("l11", [
  { inequality: "x^3 - 4x > 0", answer: "(-2, 0) U (2, inf)" },
  { inequality: "x^3 - 16x < 0", answer: "(-inf, -4) U (0, 4)" },
  { inequality: "(x-1)^2(x+4) <= 0", answer: "(-inf, -4] U {1}" },
  { inequality: "x(x+3)(x-1) >= 0", answer: "[-3, 0] U [1, inf)" },
  { inequality: "-(x+5)^2(x-2) > 0", answer: "(-inf, -5) U (-5, 2)" },
  { inequality: "(x+1)^3(x-6) < 0", answer: "(-1, 6)" },
  { inequality: "2(x-3)(x+1)^2 >= 0", answer: "{-1} U [3, inf)" },
  { inequality: "x^4 - 81 <= 0", answer: "[-3, 3]" },
  { inequality: "x(x-2)(x+2) > 0", answer: "(-2, 0) U (2, inf)" },
  { inequality: "-(x-1)^2(x+3) >= 0", answer: "(-inf, -3] U {1}" }
]);

const level12Scenarios = withIds("l12", [
  {
    functionText: "2x^3 - 1",
    correct: "Vertical stretch by 2, shift down 1",
    distractors: ["Shift right 1", "Same as the parent", "Horizontal stretch by 2"]
  },
  {
    functionText: "-x^3 + 4",
    correct: "Reflect over the x-axis, shift up 4",
    distractors: ["Shift right 4", "Vertical compress", "Reflect over the y-axis"]
  },
  {
    functionText: "(x - 2)^3",
    correct: "Shift right 2",
    distractors: ["Shift left 2", "Vertical stretch by 2", "Shift down 2"]
  },
  {
    functionText: "3(x + 1)^3 - 5",
    correct: "Stretch by 3, left 1, down 5",
    distractors: ["Right 1, up 5", "Stretch by 3, right 1", "Left 1, up 5"]
  },
  {
    functionText: "(1/2)x^3 + 3",
    correct: "Vertical compress by 1/2, shift up 3",
    distractors: ["Shift right 3", "Vertical stretch by 3", "Horizontal stretch by 2"]
  },
  {
    functionText: "-2x^3",
    correct: "Reflect over the x-axis, stretch by 2",
    distractors: ["Shift down 2", "Same as the parent", "Reflect over the y-axis and stretch by 2"]
  },
  {
    functionText: "(x + 4)^3 + 2",
    correct: "Shift left 4, up 2",
    distractors: ["Shift right 4", "Stretch by 4", "Left 4, down 2"]
  },
  {
    functionText: "-(x - 3)^3 - 1",
    correct: "Reflect over the x-axis, right 3, down 1",
    distractors: ["Left 3, up 1", "Right 3, up 1", "Reflect over the y-axis, right 3"]
  },
  {
    functionText: "4(x - 1)^3",
    correct: "Stretch by 4, right 1",
    distractors: ["Left 1, stretch by 4", "Right 4, stretch by 1", "Down 1, stretch by 4"]
  },
  {
    functionText: "-(x + 2)^3 + 6",
    correct: "Reflect over the x-axis, left 2, up 6",
    distractors: ["Right 2, down 6", "Left 2, down 6", "Reflect over the y-axis, left 2"]
  }
]);

const level13Scenarios = withIds("l13", [
  {
    expression: "(x+1)^3(x-6)",
    expectedAnswer: "Zeros are x = -1 and x = 6. Both have odd multiplicity, so the graph crosses at both zeros. A sign chart or test points show the polynomial is negative on (-1, 6).",
    keywordBuckets: [
      { keywords: ["-1", "6"], minMatches: 2 },
      { keywords: ["odd", "cross"], minMatches: 1 },
      { keywords: ["sign chart", "test point", "positive", "negative"], minMatches: 1 },
      { keywords: ["(-1,6)", "(-1, 6)", "negative on (-1, 6)", "f(x)<0"], minMatches: 1 }
    ]
  },
  {
    expression: "-(x-1)^2(x+4)",
    expectedAnswer: "Zeros are x = -4 and x = 1. The zero at -4 has odd multiplicity and crosses; the zero at 1 has even multiplicity and touches. Because of the leading negative and the sign chart, f(x) > 0 on (-inf, -4).",
    keywordBuckets: [
      { keywords: ["-4", "1"], minMatches: 2 },
      { keywords: ["cross", "touch", "even", "odd"], minMatches: 2 },
      { keywords: ["sign chart", "test point", "leading negative", "negative"], minMatches: 1 },
      { keywords: ["(-inf,-4)", "(-inf, -4)", "f(x)>0", "positive on (-inf, -4)"], minMatches: 1 }
    ]
  },
  {
    expression: "x(x-4)(x+3)",
    expectedAnswer: "The zeros are -3, 0, and 4, all with multiplicity 1, so the graph crosses at each one. The sign alternates across the intervals, so f(x) > 0 on (-3, 0) U (4, inf).",
    keywordBuckets: [
      { keywords: ["-3", "0", "4"], minMatches: 3 },
      { keywords: ["cross", "multiplicity 1", "simple root"], minMatches: 1 },
      { keywords: ["alternat", "sign chart", "test point"], minMatches: 1 },
      { keywords: ["(-3,0)", "(-3, 0)", "(4,inf)", "(4, inf)", "u", "positive"], minMatches: 2 }
    ]
  },
  {
    expression: "2(x-3)(x+1)^2",
    expectedAnswer: "The zero at x = -1 has multiplicity 2, so the graph touches there and does not change sign. The zero at x = 3 has multiplicity 1, so it crosses there. Therefore the polynomial is positive on (3, inf).",
    keywordBuckets: [
      { keywords: ["-1", "3"], minMatches: 2 },
      { keywords: ["touch", "cross", "even", "odd"], minMatches: 2 },
      { keywords: ["does not change sign", "sign chart", "test point"], minMatches: 1 },
      { keywords: ["(3,inf)", "(3, inf)", "positive on (3, inf)", "f(x)>0"], minMatches: 1 }
    ]
  },
  {
    expression: "-x(x+3)^4(x-1)",
    expectedAnswer: "The zero at x = -3 has even multiplicity, so it touches and does not flip sign. The zeros at x = 0 and x = 1 are odd multiplicity and cross. With the leading negative, the polynomial is positive on (0, 1).",
    keywordBuckets: [
      { keywords: ["-3", "0", "1"], minMatches: 3 },
      { keywords: ["touch", "cross", "even", "odd"], minMatches: 2 },
      { keywords: ["leading negative", "does not change sign", "sign chart", "test point"], minMatches: 1 },
      { keywords: ["(0,1)", "(0, 1)", "positive on (0, 1)", "f(x)>0"], minMatches: 1 }
    ]
  },
  {
    expression: "(x-4)(x-1)(x+2)",
    expectedAnswer: "Zeros are -2, 1, and 4. Each is simple, so the graph crosses at each one. Testing intervals shows the polynomial is positive on (-2, 1) U (4, inf).",
    keywordBuckets: [
      { keywords: ["-2", "1", "4"], minMatches: 3 },
      { keywords: ["cross", "simple root", "multiplicity 1"], minMatches: 1 },
      { keywords: ["sign chart", "test point", "alternat"], minMatches: 1 },
      { keywords: ["(-2,1)", "(-2, 1)", "(4,inf)", "(4, inf)", "positive"], minMatches: 2 }
    ]
  },
  {
    expression: "(x+2)^3(x-1)^2",
    expectedAnswer: "The zero at -2 has multiplicity 3, so the graph crosses there. The zero at 1 has multiplicity 2, so it touches there and keeps the same sign. The polynomial is negative on (-inf, -2).",
    keywordBuckets: [
      { keywords: ["-2", "1"], minMatches: 2 },
      { keywords: ["cross", "touch", "odd", "even"], minMatches: 2 },
      { keywords: ["same sign", "does not change sign", "sign chart", "test point"], minMatches: 1 },
      { keywords: ["(-inf,-2)", "(-inf, -2)", "negative on (-inf, -2)", "f(x)<0"], minMatches: 1 }
    ]
  },
  {
    expression: "-(x+5)^2(x-2)^2",
    expectedAnswer: "The zeros are -5 and 2, both with even multiplicity, so the graph touches at each zero. Since both factors are squared and there is a leading negative, the polynomial is never positive. So f(x) > 0 has no solution.",
    keywordBuckets: [
      { keywords: ["-5", "2"], minMatches: 2 },
      { keywords: ["touch", "even"], minMatches: 2 },
      { keywords: ["leading negative", "never positive", "nonpositive", "sign chart"], minMatches: 1 },
      { keywords: ["no solution", "empty set", "f(x)>0 has no solution"], minMatches: 1 }
    ]
  }
]);

const level14Scenarios = withIds("l14", [
  {
    studentWork: "\"f(x) = (x-5)(x-1)^2 crosses at x = 1, touches at x = 5.\"",
    expectedAnswer: "The cross/touch behavior is reversed. x = 1 has multiplicity 2, so it touches the x-axis, and x = 5 has multiplicity 1, so it crosses the x-axis.",
    keywordBuckets: [
      { keywords: ["revers", "wrong", "error"], minMatches: 1 },
      { keywords: ["x=1", "1", "multiplicity 2", "even", "touch"], minMatches: 2 },
      { keywords: ["x=5", "5", "multiplicity 1", "odd", "cross"], minMatches: 2 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"x^3 - 3x^2 - 10x = x(x^2 - 3x - 10) = x(x-5)(x-2), so the zeros are 0, 5, and 2.\"",
    expectedAnswer: "The quadratic was factored with a sign error. x^2 - 3x - 10 factors as (x-5)(x+2), not (x-2). The corrected zeros are 0, 5, and -2.",
    keywordBuckets: [
      { keywords: ["sign error", "factoring error", "wrong factor"], minMatches: 1 },
      { keywords: ["x+2", "(x+2)", "-2"], minMatches: 2 },
      { keywords: ["0", "5", "-2"], minMatches: 3 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"x^2 + 4 has zeros x = 2 and x = -2.\"",
    expectedAnswer: "That confuses x^2 + 4 with x^2 - 4. Solving x^2 + 4 = 0 gives x^2 = -4, so there are no real zeros and the zeros are ±2i.",
    keywordBuckets: [
      { keywords: ["confus", "wrong sign", "x^2-4"], minMatches: 1 },
      { keywords: ["no real zeros", "complex", "2i", "-2i"], minMatches: 1 },
      { keywords: ["x^2=-4", "negative discriminant", "plus 4"], minMatches: 1 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"(x+2)^2(x-3) goes up on both ends because degree 3.\"",
    expectedAnswer: "The end behavior is wrong. A degree-3 polynomial with positive leading coefficient goes down on the left and up on the right. Up on both ends is even-degree behavior.",
    keywordBuckets: [
      { keywords: ["end behavior", "degree 3", "odd degree"], minMatches: 2 },
      { keywords: ["down left", "up right", "left down", "right up"], minMatches: 1 },
      { keywords: ["even degree", "up on both ends is even"], minMatches: 1 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"(2 + 3i)^2 = 4 + 9i^2 = 4 - 9 = -5.\"",
    expectedAnswer: "The middle term is missing. FOIL gives 4 + 12i + 9i^2 = 4 + 12i - 9 = -5 + 12i.",
    keywordBuckets: [
      { keywords: ["middle term", "foil", "missing"], minMatches: 1 },
      { keywords: ["12i"], minMatches: 1 },
      { keywords: ["-5+12i", "-5 + 12i"], minMatches: 1 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"f(x) = x(x+4)(x-1)^4 has 3 zeros and all cross.\"",
    expectedAnswer: "x = 1 does not cross because multiplicity 4 is even. The zeros are x = -4, 0, and 1, but only -4 and 0 cross; x = 1 touches.",
    keywordBuckets: [
      { keywords: ["multiplicity 4", "even"], minMatches: 1 },
      { keywords: ["x=1", "1", "touch"], minMatches: 2 },
      { keywords: ["-4", "0", "cross"], minMatches: 2 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"Zero of (x+3) is x = 3.\"",
    expectedAnswer: "The sign is opposite when solving a factor. Set x + 3 = 0, so x = -3.",
    keywordBuckets: [
      { keywords: ["sign", "opposite"], minMatches: 1 },
      { keywords: ["x+3=0", "set equal to zero"], minMatches: 1 },
      { keywords: ["-3"], minMatches: 1 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"x^3 - 4x > 0 has solution (-inf, -2) U (0, 2).\"",
    expectedAnswer: "The sign chart is flipped. Factoring gives x(x-2)(x+2), and the positive intervals are (-2, 0) U (2, inf).",
    keywordBuckets: [
      { keywords: ["sign chart", "flipped", "wrong intervals"], minMatches: 1 },
      { keywords: ["x(x-2)(x+2)", "factor"], minMatches: 1 },
      { keywords: ["(-2,0)", "(-2, 0)", "(2,inf)", "(2, inf)"], minMatches: 2 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"(x-1)^2(x+4) <= 0 gives (-inf, -4).\"",
    expectedAnswer: "The answer is missing the included endpoint at -4 and the isolated zero at x = 1. Because the inequality is <=, the correct solution is (-inf, -4] U {1}.",
    keywordBuckets: [
      { keywords: ["endpoint", "included", "<="], minMatches: 1 },
      { keywords: ["-4]", "[-4", "-4"], minMatches: 1 },
      { keywords: ["{1}", "x=1", "isolated zero"], minMatches: 1 }
    ],
    forbiddenKeywords: ["student is correct"]
  },
  {
    studentWork: "\"f(x) = 2x^3 - 1 is shifted right 1 from the parent.\"",
    expectedAnswer: "The -1 is outside the cubic, so it is a vertical shift down 1, not a horizontal shift. The factor 2 causes a vertical stretch.",
    keywordBuckets: [
      { keywords: ["outside", "vertical shift", "down 1"], minMatches: 2 },
      { keywords: ["not horizontal", "not right 1"], minMatches: 1 },
      { keywords: ["stretch", "2x^3", "vertical stretch"], minMatches: 1 }
    ],
    forbiddenKeywords: ["student is correct"]
  }
]);

// ============ LEVEL BUILDERS ============

function buildProblem(context, answers, scenario, graphConfig = null) {
  const mergedContext = { ...context, answers };
  return { context: mergedContext, answers, scenario, graphConfig };
}

function buildChoiceLevel(levelName, problemText, givenText, fieldId, correct, distractors, extraContext = {}) {
  const { context: optionContext } = buildChoiceOptions(correct, distractors);
  const context = {
    levelName,
    problemText,
    givenText,
    ...optionContext,
    ...extraContext
  };
  const answers = {
    [fieldId]: { value: String(correct) }
  };
  return buildProblem(context, answers, givenText);
}

function formatReportList(reports) {
  return reports
    .slice()
    .sort((left, right) => left.zero - right.zero)
    .map(report => `(${formatNumber(report.zero)}, ${report.mult}, ${report.behavior})`)
    .join("; ");
}

// ============ MAIN GENERATOR ============

export function generateProblem(modeId, contextFromFile, mode) {
  if (modeId === "l01-vocab-basics") {
    const scen = drawFromBag("l01-vocab", level1Scenarios);
    const distractors = scen.options.filter(option => option !== scen.correct);
    return buildChoiceLevel(
      "Level 1",
      "Recognize the key vocabulary for zeros, multiplicity, and interval notation.",
      scen.prompt,
      "vocabAnswer",
      scen.correct,
      distractors,
      {
        question: scen.prompt,
        expectedAnswer: scen.correct
      }
    );
  }

  if (modeId === "l02-zero-from-factor") {
    const scen = drawFromBag("l02-factor-zero", level2Scenarios);
    return buildChoiceLevel(
      "Level 2",
      "Set the factor equal to zero and solve for the x-value.",
      `Find the zero of the factor ${scen.factor}.`,
      "zeroChoice",
      scen.correct,
      scen.distractors,
      {
        factor: scen.factor,
        expectedAnswer: scen.correct
      }
    );
  }

  if (modeId === "l03-multiplicity-id") {
    const scen = drawFromBag("l03-multiplicity", level3Scenarios);
    return buildChoiceLevel(
      "Level 3",
      "Read the exponent on the factor to identify multiplicity.",
      `For f(x) = ${scen.expression}, what is the multiplicity of x = ${scen.zeroAsked}?`,
      "multChoice",
      scen.correct,
      scen.distractors,
      {
        expression: scen.expression,
        zeroAsked: scen.zeroAsked,
        expectedAnswer: scen.correct
      }
    );
  }

  if (modeId === "l04-cross-or-touch") {
    const scen = drawFromBag("l04-cross-touch", level4Scenarios);
    const options = shuffle([CROSS_LABEL, TOUCH_LABEL]);
    const context = {
      levelName: "Level 4",
      problemText: "Use odd and even multiplicity to predict graph behavior at the zero.",
      givenText: `For f(x) = ${scen.expression}, what happens at x = ${scen.zero}?`,
      optA: options[0],
      optB: options[1],
      expression: scen.expression,
      zeroAsked: scen.zero,
      multiplicity: scen.mult,
      expectedAnswer: scen.correct
    };
    const answers = {
      crossTouch: { value: scen.correct }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l05-factor-find-zeros") {
    const scen = drawFromBag("l05-factor-zeros", level5Scenarios);
    const answerText = formatNumberList(scen.zeros);
    const context = {
      levelName: "Level 5",
      problemText: "Factor completely and list all real zeros.",
      givenText: `Factor and solve: ${scen.polynomial}`,
      polynomial: scen.polynomial,
      factorization: scen.factorization,
      expectedNumbers: scen.zeros,
      expectedAnswer: answerText
    };
    const answers = {
      zerosText: { value: answerText }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l06-multiplicity-report") {
    const scen = drawFromBag("l06-report", level6Scenarios);
    const answerText = formatReportList(scen.reports);
    const context = {
      levelName: "Level 6",
      problemText: "Report each real zero, its multiplicity, and whether the graph crosses or touches.",
      givenText: `Write the full zero report for ${scen.expression}.`,
      expression: scen.expression,
      expectedReports: scen.reports,
      expectedAnswer: answerText
    };
    const answers = {
      reportText: { value: answerText }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l07-sign-chart") {
    const scen = drawFromBag("l07-sign-chart", level7Scenarios);
    const context = {
      levelName: "Level 7",
      problemText: "Use zeros and a sign chart to write the correct interval solution.",
      givenText: `For f(x) = ${scen.expression}, solve ${scen.ask}.`,
      expression: scen.expression,
      targetInequality: scen.ask,
      expectedIntervalSet: scen.answer,
      expectedAnswer: scen.answer
    };
    const answers = {
      intervalText: { value: scen.answer }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l08-complex-vs-real") {
    const scen = drawFromBag("l08-real-complex", level8Scenarios);
    const options = shuffle([REAL_LABEL, COMPLEX_LABEL]);
    const context = {
      levelName: "Level 8",
      problemText: "Use the discriminant to decide whether the factor gives real or complex zeros.",
      givenText: `Does the factor ${scen.factor} have two real zeros or two complex zeros?`,
      optA: options[0],
      optB: options[1],
      factor: scen.factor,
      a: scen.a,
      b: scen.b,
      c: scen.c,
      discriminant: scen.discriminant,
      expectedAnswer: scen.correct
    };
    const answers = {
      complexType: { value: scen.correct }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l09-complex-squaring") {
    const scen = drawFromBag("l09-complex-square", level9Scenarios);
    const expected = formatComplex(scen.real, scen.imag);
    const context = {
      levelName: "Level 9",
      problemText: "Expand the complex square and simplify to standard a + bi form.",
      givenText: `Simplify ${scen.expression}.`,
      expression: scen.expression,
      expectedComplex: { real: scen.real, imag: scen.imag },
      expectedAnswer: expected
    };
    const answers = {
      complexResult: { value: expected }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l10-equation-rewrite") {
    const scen = drawFromBag("l10-rewrite-zero", level10Scenarios);
    const expected = formatNumberList(scen.solutions);
    const context = {
      levelName: "Level 10",
      problemText: "Rewrite the equation so one side is zero, then factor and solve.",
      givenText: `Solve ${scen.equation}.`,
      equation: scen.equation,
      expectedNumbers: scen.solutions,
      expectedAnswer: expected
    };
    const answers = {
      solutionsText: { value: expected }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l11-inequality") {
    const scen = drawFromBag("l11-inequality", level11Scenarios);
    const context = {
      levelName: "Level 11",
      problemText: "Factor, find critical points, and use interval notation with correct endpoints.",
      givenText: `Solve ${scen.inequality}.`,
      inequality: scen.inequality,
      expectedIntervalSet: scen.answer,
      expectedAnswer: scen.answer
    };
    const answers = {
      inequalityText: { value: scen.answer }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l12-transformations") {
    const scen = drawFromBag("l12-transform", level12Scenarios);
    return buildChoiceLevel(
      "Level 12",
      "Compare the transformed cubic to the parent function y = x^3.",
      `Describe the transformation for g(x) = ${scen.functionText}.`,
      "transformChoice",
      scen.correct,
      scen.distractors,
      {
        functionText: scen.functionText,
        expectedAnswer: scen.correct
      }
    );
  }

  if (modeId === "l13-sketch-justification") {
    const scen = drawFromBag("l13-sketch", level13Scenarios);
    const context = {
      levelName: "Level 13",
      problemText: "Explain how the factors determine the sketch and interval behavior.",
      givenText: `Explain the sketch for f(x) = ${scen.expression}. Include zeros, multiplicities, cross/touch behavior, sign reasoning, and the final interval conclusion.`,
      expression: scen.expression,
      keywordBuckets: scen.keywordBuckets,
      expectedAnswer: scen.expectedAnswer
    };
    const answers = {
      sketchExplain: { value: scen.expectedAnswer }
    };
    return buildProblem(context, answers, context.givenText);
  }

  if (modeId === "l14-error-capstone") {
    const scen = drawFromBag("l14-error-capstone", level14Scenarios);
    const context = {
      levelName: "Level 14",
      problemText: "Identify the error, explain the rule that was broken, and give the corrected answer.",
      givenText: `Read the student work and fix the mistake: ${scen.studentWork}`,
      studentWork: scen.studentWork,
      keywordBuckets: scen.keywordBuckets,
      forbiddenKeywords: scen.forbiddenKeywords,
      expectedAnswer: scen.expectedAnswer
    };
    const answers = {
      errorExplain: { value: scen.expectedAnswer }
    };
    return buildProblem(context, answers, context.givenText);
  }

  return buildProblem(
    {
      levelName: "Unknown",
      problemText: "Mode not implemented",
      givenText: `No generator exists for mode ${modeId}.`
    },
    {},
    `Mode not implemented: ${modeId}`
  );
}

export default { generateProblem };
