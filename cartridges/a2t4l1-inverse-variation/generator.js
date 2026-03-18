function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const shuffleBags = {};

function drawFromBag(name, source) {
  if (!shuffleBags[name] || shuffleBags[name].length === 0) {
    shuffleBags[name] = shuffle(source);
  }
  return shuffleBags[name].pop();
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(2)));
}

function denominatorText(h) {
  if (h === 0) return "x";
  return h > 0 ? `x-${h}` : `x+${Math.abs(h)}`;
}

function reciprocalEquation(a, h, k) {
  const numerator = a === 1 ? "1" : a === -1 ? "-1" : formatNumber(a);
  const base = `${numerator}/(${denominatorText(h)})`;
  if (k === 0) return `y = ${base}`;
  return `y = ${base} ${k > 0 ? "+" : "-"} ${formatNumber(Math.abs(k))}`;
}

function shiftText(h, k) {
  const horizontal = h > 0
    ? `${Math.abs(h)} units to the right`
    : `${Math.abs(h)} units to the left`;
  const vertical = k > 0
    ? `${Math.abs(k)} units up`
    : `${Math.abs(k)} units down`;
  return `${vertical} and ${horizontal}`;
}

function buildChoiceContext(correct, distractors) {
  const options = shuffle([correct, ...distractors]);
  return {
    optA: options[0],
    optB: options[1],
    optC: options[2],
    optD: options[3]
  };
}

function tableText(rows) {
  return rows.map((row) => `${row.label}: ${row.values.join(", ")}`).join(" | ");
}

const level1Bank = [
  {
    givenText: tableText([
      { label: "x", values: ["3", "10", "15", "30"] },
      { label: "y", values: ["5", "?", "1", "0.5"] }
    ]),
    answer: 1.5
  },
  {
    givenText: tableText([
      { label: "x", values: ["2", "3", "4", "6"] },
      { label: "y", values: ["12", "8", "6", "?"] }
    ]),
    answer: 4
  },
  {
    givenText: tableText([
      { label: "x", values: ["4", "6", "8", "12"] },
      { label: "y", values: ["18", "12", "?", "6"] }
    ]),
    answer: 9
  },
  {
    givenText: tableText([
      { label: "x", values: ["3", "5", "6", "10"] },
      { label: "y", values: ["10", "6", "?", "3"] }
    ]),
    answer: 5
  },
  {
    givenText: tableText([
      { label: "x", values: ["4", "8", "12", "16"] },
      { label: "y", values: ["12", "6", "4", "?"] }
    ]),
    answer: 3
  },
  {
    givenText: tableText([
      { label: "x", values: ["5", "9", "15", "45"] },
      { label: "y", values: ["18", "10", "6", "?"] }
    ]),
    answer: 2
  }
];

const level2Bank = [
  {
    givenText: tableText([
      { label: "x", values: ["-3", "-1", "1/2", "2/3"] },
      { label: "y", values: ["4", "12", "-24", "-18"] }
    ]),
    correct: "y = -12/x",
    distractors: [
      "y = 12/x",
      "y = x/(-12)",
      "y = -x/12"
    ]
  },
  {
    givenText: tableText([
      { label: "x", values: ["2", "4", "6", "12"] },
      { label: "y", values: ["12", "6", "4", "2"] }
    ]),
    correct: "y = 24/x",
    distractors: [
      "y = x/24",
      "y = -24/x",
      "y = -x/24"
    ]
  },
  {
    givenText: tableText([
      { label: "x", values: ["-2", "3", "6", "-9"] },
      { label: "y", values: ["9", "-6", "-3", "2"] }
    ]),
    correct: "y = -18/x",
    distractors: [
      "y = 18/x",
      "y = x/(-18)",
      "y = -x/18"
    ]
  },
  {
    givenText: tableText([
      { label: "x", values: ["3", "5", "6", "10"] },
      { label: "y", values: ["10", "6", "5", "3"] }
    ]),
    correct: "y = 30/x",
    distractors: [
      "y = x/30",
      "y = -30/x",
      "y = -x/30"
    ]
  }
];

const level3Bank = [
  {
    givenText: "A rectangle has fixed area. The width is 4 inches when the length is 18 inches. Find the width when the length is 40 inches.",
    scenario: "Rectangle width varies inversely with length.",
    answer: 1.8,
    tolerance: 0.01
  },
  {
    givenText: "Three students can wash a car in 16 minutes. If the time varies inversely with the number of students, how many minutes will it take two students?",
    scenario: "Car wash time varies inversely with the number of students.",
    answer: 24,
    tolerance: 0.01
  },
  {
    givenText: "The amount of time for an ice cube to melt varies inversely with air temperature. At 20 degrees Celsius, the ice melts in 20 minutes. How long will it take at 30 degrees Celsius?",
    scenario: "Melting time varies inversely with temperature.",
    answer: 13.33,
    tolerance: 0.05
  },
  {
    givenText: "On a Greek bouzouki, string length varies inversely with frequency. A 26-inch string vibrates at 329.63 cycles per second. What is the frequency of a 13-inch string?",
    scenario: "String length varies inversely with frequency.",
    answer: 659.26,
    tolerance: 0.05
  },
  {
    givenText: "Four workers can paint a room in 18 hours. If time varies inversely with the number of workers, how many hours will it take six workers?",
    scenario: "Work time varies inversely with the number of workers.",
    answer: 12,
    tolerance: 0.01
  }
];

const level4Bank = [
  {
    functionText: "y = 1/(x+5) - 4",
    correct: "y = -4",
    vertical: "x = -5",
    distractors: ["x = -5", "y = 4", "x = 5"]
  },
  {
    functionText: "y = 3/(x-2) + 1",
    correct: "y = 1",
    vertical: "x = 2",
    distractors: ["x = 2", "y = -1", "x = -2"]
  },
  {
    functionText: "y = -2/(x+6) + 5",
    correct: "y = 5",
    vertical: "x = -6",
    distractors: ["x = -6", "y = -5", "x = 6"]
  },
  {
    functionText: "y = 4/(x-3) - 2",
    correct: "y = -2",
    vertical: "x = 3",
    distractors: ["x = 3", "y = 2", "x = -3"]
  }
];

const level5Bank = [
  { h: -2, k: 3 },
  { h: 5, k: -2 },
  { h: 4, k: 1 },
  { h: -1, k: -3 }
];

const level6Bank = [
  { constant: 6, h: -2, k: 2 },
  { constant: 8, h: 3, k: -1 },
  { constant: 12, h: 1, k: 4 },
  { constant: 10, h: -5, k: -2 }
];

function generateLevel1() {
  const item = drawFromBag("level1", level1Bank);
  return {
    context: {
      levelName: "Level 1",
      problemText: "The table represents an inverse variation. Find the missing value.",
      givenText: item.givenText
    },
    graphConfig: null,
    answers: {
      missingValue: {
        value: item.answer,
        tolerance: 0.01
      }
    },
    scenario: "Find the missing value in an inverse-variation table."
  };
}

function generateLevel2() {
  const item = drawFromBag("level2", level2Bank);
  const options = buildChoiceContext(item.correct, item.distractors);
  return {
    context: {
      levelName: "Level 2",
      problemText: "Choose the equation that matches the inverse-variation table.",
      givenText: item.givenText,
      ...options
    },
    graphConfig: null,
    answers: {
      equationChoice: {
        value: item.correct
      }
    },
    scenario: "Choose the inverse-variation equation from a table."
  };
}

function generateLevel3() {
  const item = drawFromBag("level3", level3Bank);
  return {
    context: {
      levelName: "Level 3",
      problemText: "Solve the inverse-variation application.",
      givenText: item.givenText
    },
    graphConfig: null,
    answers: {
      applicationAnswer: {
        value: item.answer,
        tolerance: item.tolerance
      }
    },
    scenario: item.scenario
  };
}

function generateLevel4() {
  const item = drawFromBag("level4", level4Bank);
  const options = buildChoiceContext(item.correct, item.distractors);
  return {
    context: {
      levelName: "Level 4",
      problemText: "Identify the horizontal asymptote.",
      givenText: `Function: ${item.functionText}`,
      verticalAsymptote: item.vertical,
      ...options
    },
    graphConfig: null,
    answers: {
      horizontalAsymptote: {
        value: item.correct
      }
    },
    scenario: "Identify the horizontal asymptote of a translated reciprocal function."
  };
}

function generateLevel5() {
  const item = drawFromBag("level5", level5Bank);
  const correct = reciprocalEquation(1, item.h, item.k);
  const options = buildChoiceContext(correct, [
    reciprocalEquation(1, -item.h, item.k),
    reciprocalEquation(1, item.h, -item.k),
    reciprocalEquation(1, -item.h, -item.k)
  ]);
  return {
    context: {
      levelName: "Level 5",
      problemText: "Choose the translated equation.",
      givenText: `The graph of y = 1/x is translated ${shiftText(item.h, item.k)}.`,
      ...options
    },
    graphConfig: null,
    answers: {
      translatedEquation: {
        value: correct
      }
    },
    scenario: "Translate the parent reciprocal function."
  };
}

function generateLevel6() {
  const item = drawFromBag("level6", level6Bank);
  const correct = reciprocalEquation(item.constant, item.h, item.k);
  const options = buildChoiceContext(correct, [
    reciprocalEquation(item.constant, -item.h, item.k),
    reciprocalEquation(item.constant, item.h, -item.k),
    reciprocalEquation(item.constant, -item.h, -item.k)
  ]);
  return {
    context: {
      levelName: "Level 6",
      problemText: "Choose the translated equation for xy = k.",
      givenText: `The graph of xy = ${item.constant} is translated ${shiftText(item.h, item.k)}.`,
      ...options
    },
    graphConfig: null,
    answers: {
      translatedVariationEquation: {
        value: correct
      }
    },
    scenario: "Choose the translated equation for xy = k."
  };
}

export function generateProblem(modeId) {
  if (modeId === "l01-missing-table") return generateLevel1();
  if (modeId === "l02-equation-from-table") return generateLevel2();
  if (modeId === "l03-application-model") return generateLevel3();
  if (modeId === "l04-horizontal-asymptote") return generateLevel4();
  if (modeId === "l05-translate-parent") return generateLevel5();
  if (modeId === "l06-translate-xy") return generateLevel6();
  throw new Error(`Unknown mode: ${modeId}`);
}

export default { generateProblem };
