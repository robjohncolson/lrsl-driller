// generator.js - AP Statistics Topic 8.1 cartridge

// ============ UTILITY FUNCTIONS ============

/**
 * Generate a random integer between min and max (inclusive)
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick a random element from an array
 */
function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function withAnswerContext(context, answers) {
  return {
    ...context,
    answers,
    ...answers
  };
}

// ============ SHUFFLE BAG SYSTEM ============

const shuffleBags = {};

function getShuffleBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName];
}

function drawFromBag(bankName, sourceArray) {
  const bag = getShuffleBag(bankName, sourceArray);
  return bag.pop();
}

// ============ SCENARIO BANKS ============

const level1Scenarios = [
  {
    desc: "In a one-way table, the counts that actually came from the sample are the counts we observed.",
    answer: "Observed count",
    explanation: "Observed counts are the values recorded in the sample."
  },
  {
    desc: "For a fair 10-sided die rolled 100 times, the 10 you would predict for each face before rolling is an expected count.",
    answer: "Expected count",
    explanation: "Expected counts come from the chance model, not from the data table."
  },
  {
    desc: "Adding all of the category values from (Observed - Expected)^2 / Expected gives a single summary statistic for the table.",
    answer: "Chi-square statistic",
    explanation: "The chi-square statistic adds the contributions from every category."
  },
  {
    desc: "The proportion of simulated samples that produce a statistic at least as large as the observed one is the p-value.",
    answer: "P-value",
    explanation: "The p-value tells how often a result this extreme happens under the model."
  },
  {
    desc: "A count predicted by the fair-model distribution before any data are collected is an expected count.",
    answer: "Expected count",
    explanation: "Expected counts are model-based predictions."
  },
  {
    desc: "The number of times a category actually appears in the bar graph of the sample is the observed count.",
    answer: "Observed count",
    explanation: "Observed counts come from what really happened."
  },
  {
    desc: "A measure of how far the full set of observed counts is from the expected counts is the chi-square statistic.",
    answer: "Chi-square statistic",
    explanation: "The statistic summarizes total discrepancy across categories."
  },
  {
    desc: "A number describing how common or rare the observed statistic is in repeated chance simulations is the p-value.",
    answer: "P-value",
    explanation: "The p-value is tied to random variation under the chance model."
  }
];

const level2Scenarios = [
  {
    desc: "A fair 10-sided die is rolled 100 times. What is the expected count for each face?",
    correct: "10",
    wrong: ["1", "20", "100"],
    explanation: "Divide 100 rolls by 10 equally likely faces."
  },
  {
    desc: "A fair 8-section spinner is spun 72 times. What is the expected count for each section?",
    correct: "9",
    wrong: ["8", "16", "72"],
    explanation: "Divide 72 spins by 8 equally likely sections."
  },
  {
    desc: "A fair 6-sided die is rolled 48 times. What is the expected count for each face?",
    correct: "8",
    wrong: ["6", "12", "48"],
    explanation: "Divide 48 rolls by 6 equally likely faces."
  },
  {
    desc: "A fair 7-section spinner is spun 84 times. What is the expected count for each section?",
    correct: "12",
    wrong: ["7", "14", "84"],
    explanation: "Divide 84 spins by 7 equally likely sections."
  },
  {
    desc: "A fair 4-color spinner is spun 56 times. What is the expected count for each color?",
    correct: "14",
    wrong: ["4", "10", "56"],
    explanation: "Divide 56 spins by 4 equally likely colors."
  },
  {
    desc: "A fair 3-section spinner is spun 75 times. What is the expected count for each section?",
    correct: "25",
    wrong: ["3", "15", "75"],
    explanation: "Divide 75 spins by 3 equally likely sections."
  },
  {
    desc: "A fair 5-sided die is rolled 95 times. What is the expected count for each face?",
    correct: "19",
    wrong: ["5", "15", "95"],
    explanation: "Divide 95 rolls by 5 equally likely faces."
  },
  {
    desc: "A fair 6-section spinner is spun 120 times. What is the expected count for each section?",
    correct: "20",
    wrong: ["6", "12", "120"],
    explanation: "Divide 120 spins by 6 equally likely sections."
  }
];

const level3Scenarios = [
  {
    bankLabel: "fair 10-sided die",
    total: 100,
    categories: 10,
    focus: "the face 9",
    deltas: [-3, -2, 2, 3]
  },
  {
    bankLabel: "fair 8-section spinner",
    total: 72,
    categories: 8,
    focus: "the orange section",
    deltas: [-3, -1, 1, 3]
  },
  {
    bankLabel: "fair 6-sided die",
    total: 60,
    categories: 6,
    focus: "the face 4",
    deltas: [-4, -2, 2, 4]
  },
  {
    bankLabel: "fair 4-color spinner",
    total: 56,
    categories: 4,
    focus: "the blue section",
    deltas: [-4, -2, 2, 4]
  },
  {
    bankLabel: "fair 5-sided die",
    total: 95,
    categories: 5,
    focus: "the face 2",
    deltas: [-4, -2, 2, 4]
  },
  {
    bankLabel: "fair 3-section spinner",
    total: 75,
    categories: 3,
    focus: "the green section",
    deltas: [-5, -3, 3, 5]
  },
  {
    bankLabel: "fair 7-section spinner",
    total: 84,
    categories: 7,
    focus: "section C",
    deltas: [-3, -1, 1, 3]
  },
  {
    bankLabel: "fair 6-section spinner",
    total: 120,
    categories: 6,
    focus: "section F",
    deltas: [-5, -3, 3, 5]
  }
];

const level4Scenarios = [
  {
    desc: "Why does adding all of the raw values Observed - Expected fail as a summary?",
    answer: "Raw differences can cancel because some categories are above expected and others are below expected.",
    keywords: ["cancel", "above", "below", "zero"]
  },
  {
    desc: "Why does the lesson square the differences instead of just using Observed - Expected?",
    answer: "Squaring makes every contribution positive and gives bigger discrepancies more weight.",
    keywords: ["positive", "bigger", "weight", "discrepancies"]
  },
  {
    desc: "Why is using absolute values alone still not enough for comparing discrepancy across samples?",
    answer: "Absolute totals can grow just because the sample size is larger, even when the relative differences are similar.",
    keywords: ["sample size", "larger", "relative", "similar"]
  },
  {
    desc: "What is the purpose of dividing each squared difference by the expected count?",
    answer: "Dividing by expected makes the discrepancy relative to what was expected so bigger samples do not automatically create bigger totals.",
    keywords: ["relative", "expected", "sample size", "bigger"]
  },
  {
    desc: "What does a larger chi-square statistic tell you about the observed counts?",
    answer: "A larger chi-square means the observed counts are farther from the expected counts and less consistent with the chance model.",
    keywords: ["farther", "expected", "less consistent", "model"]
  },
  {
    desc: "What does an expected count represent in this lesson?",
    answer: "An expected count is the count predicted by the chance model if only random variation were operating.",
    keywords: ["predicted", "chance model", "random variation"]
  },
  {
    desc: "What does the chi-square statistic combine into one total number?",
    answer: "It combines the category-by-category contributions from (Observed - Expected)^2 divided by Expected.",
    keywords: ["category", "contributions", "total", "divided by expected"]
  },
  {
    desc: "What does it mean for observed counts to be consistent with random variation?",
    answer: "It means the observed counts are plausible under the model and not unusually far from the expected counts.",
    keywords: ["plausible", "model", "not unusually", "expected"]
  }
];

const level5Scenarios = [
  {
    desc: "A simulation gave 932 out of 1023 samples with a chi-square statistic at least as large as 4.2. Are the results unexpected if the die is fair?",
    correctChoice: "No",
    expectedReasoning: "No. A result this large happened about 91 percent of the time in the simulation, so it is common under random variation and is consistent with the fair-die model.",
    keywords: ["91 percent", "common", "random variation", "consistent", "simulation"],
    theme: "common"
  },
  {
    desc: "A simulation gave 480 out of 500 samples with a chi-square statistic at least as large as 3.8. Are the results unexpected if the model is correct?",
    correctChoice: "No",
    expectedReasoning: "No. About 96 percent of simulated samples were at least this large, so the result is not unusual under the model.",
    keywords: ["96 percent", "not unusual", "model", "simulated", "common"],
    theme: "common"
  },
  {
    desc: "A simulation gave 173 out of 200 samples with a chi-square statistic at least as large as 4.7. Are the results unexpected if the model is correct?",
    correctChoice: "No",
    expectedReasoning: "No. About 86.5 percent of simulated samples were this large or larger, so the observed result is plausible from chance variation.",
    keywords: ["86.5 percent", "plausible", "chance variation", "simulated"],
    theme: "common"
  },
  {
    desc: "A simulation gave 214 out of 250 samples with a chi-square statistic at least as large as 5.1. Are the results unexpected if the model is correct?",
    correctChoice: "No",
    expectedReasoning: "No. About 85.6 percent of simulated samples were at least this large, so the result is still common under the chance model.",
    keywords: ["85.6 percent", "common", "chance model", "simulated"],
    theme: "common"
  },
  {
    desc: "A simulation gave 12 out of 1000 samples with a chi-square statistic at least as large as 11.4. Are the results unexpected if the model is correct?",
    correctChoice: "Yes",
    expectedReasoning: "Yes. Only about 1.2 percent of simulated samples were this large or larger, so the result is rare under the model and would be considered unexpected.",
    keywords: ["1.2 percent", "rare", "unexpected", "simulated", "model"],
    theme: "rare"
  },
  {
    desc: "A simulation gave 7 out of 300 samples with a chi-square statistic at least as large as 12.0. Are the results unexpected if the model is correct?",
    correctChoice: "Yes",
    expectedReasoning: "Yes. Only about 2.3 percent of simulated samples were this large or larger, so the result is unusual under random variation alone.",
    keywords: ["2.3 percent", "unusual", "random variation", "simulated"],
    theme: "rare"
  },
  {
    desc: "A simulation gave 5 out of 600 samples with a chi-square statistic at least as large as 13.3. Are the results unexpected if the model is correct?",
    correctChoice: "Yes",
    expectedReasoning: "Yes. Less than 1 percent of the simulated samples reached that value, so the observed result would be considered rare under the model.",
    keywords: ["less than 1 percent", "rare", "simulated", "model"],
    theme: "rare"
  },
  {
    desc: "A simulation gave 8 out of 500 samples with a chi-square statistic at least as large as 10.9. Are the results unexpected if the model is correct?",
    correctChoice: "Yes",
    expectedReasoning: "Yes. Only 1.6 percent of simulated samples were at least that large, so the result is unlikely to happen from random variation alone.",
    keywords: ["1.6 percent", "unlikely", "random variation", "simulated"],
    theme: "rare"
  }
];

function generateContributionScenario(template) {
  const expected = template.total / template.categories;
  const delta = choice(template.deltas);
  const observed = expected + delta;
  const answer = roundTo((delta * delta) / expected, 2);
  const signedWord = delta > 0 ? "above" : "below";

  return {
    problemText: `Find the chi-square contribution for ${template.focus}.`,
    givenText: `Observed = ${observed}, Expected = ${expected}. ${template.focus} is ${Math.abs(delta)} ${signedWord} expected in a ${template.bankLabel} sample.`,
    answer,
    tolerance: 0.02
  };
}

// ============ MAIN GENERATOR FUNCTION ============

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  if (modeId === "l01-topic-8-1-observed-vs-expected") {
    const scen = drawFromBag("level1", level1Scenarios);

    answers = {
      choiceAnswer: { value: scen.answer }
    };

    context = withAnswerContext(
      {
        levelName: "Level 1: Topic 8.1",
        problemText: "Identify the lesson term",
        givenText: scen.desc,
        explanationText: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l02-expected-counts") {
    const scen = drawFromBag("level2", level2Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    answers = {
      dropdownAnswer: { value: scen.correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 2: Expected Counts",
        problemText: "Use total divided by equally likely categories",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        explanationText: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l03-chi-square-contribution") {
    const template = drawFromBag("level3", level3Scenarios);
    const generated = generateContributionScenario(template);

    answers = {
      numericAnswer: {
        value: generated.answer,
        tolerance: generated.tolerance
      }
    };

    context = withAnswerContext(
      {
        levelName: "Level 3: Chi-Square Contribution",
        problemText: generated.problemText,
        givenText: generated.givenText
      },
      answers
    );

    scenario = generated.givenText;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l04-interpret-unexpectedness") {
    const scen = drawFromBag("level4", level4Scenarios);

    answers = {
      textAnswer: { value: scen.answer }
    };

    context = withAnswerContext(
      {
        levelName: "Level 4: Interpretation",
        problemText: "Explain the idea in one or two sentences",
        givenText: scen.desc,
        expectedKeywords: scen.keywords
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l05-simulation-based-p-value") {
    const scen = drawFromBag("level5", level5Scenarios);

    answers = {
      conceptChoice: { value: scen.correctChoice },
      explanation: { value: scen.expectedReasoning }
    };

    context = withAnswerContext(
      {
        levelName: "Level 5: Simulation Decision",
        problemText: "Decide whether the result is unexpected",
        givenText: scen.desc,
        expectedReasoning: scen.expectedReasoning,
        keywords: scen.keywords,
        theme: scen.theme
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  return {
    context: {
      levelName: "Unknown",
      problemText: "Mode not implemented",
      givenText: ""
    },
    graphConfig: null,
    answers: {},
    scenario: "Mode not implemented: " + modeId
  };
}

export default { generateProblem };
