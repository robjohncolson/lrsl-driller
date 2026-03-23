// generator.js - AP Statistics Topics 8.1-8.2 cartridge

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

const level6Scenarios = [
  {
    desc: "A random sample of 40 predatory lending businesses is classified into three income-bracket categories. The counts are compared with hypothesized proportions 0.452, 0.292, and 0.256. Which inference procedure should be used?"
  },
  {
    desc: "A random sample of 100 Battleship players identifies which of four quadrants contains the most ship spaces. The counts are compared with the no-preference model of 0.25 for each quadrant. Which inference procedure should be used?"
  },
  {
    desc: "A cereal company records the prize type in 80 randomly selected boxes and compares the four category counts to the claimed proportions 0.30, 0.25, 0.25, and 0.20. Which inference procedure should be used?"
  },
  {
    desc: "A school surveys 120 randomly selected students and records which of five lunch options they buy most often. The counts are compared with a district model of 0.18, 0.22, 0.20, 0.25, and 0.15. Which inference procedure should be used?"
  },
  {
    desc: "A wildlife study records the habitat zone for 60 randomly observed turtles in one lake. The observed counts in four zones are compared with a specified distribution from past years. Which inference procedure should be used?"
  }
];

const level7Scenarios = [
  {
    desc: "Predatory lending businesses in Dallas are classified into three income brackets. The hypothesized proportions are 0.452, 0.292, and 0.256. Choose the best null hypothesis.",
    correct: "H0: The category proportions are 0.452, 0.292, and 0.256.",
    wrong: [
      "Ha: At least one category proportion is not 0.452, 0.292, or 0.256.",
      "H0: The sample proportions are 0.452, 0.292, and 0.256.",
      "H0: The three category proportions are all 1/3."
    ],
    explanation: "The null hypothesis uses population proportions and states equality to the specified values."
  },
  {
    desc: "Battleship quadrant choices are tested against a no-preference model with four equal proportions of 0.25. Choose the best null hypothesis.",
    correct: "H0: The four quadrant proportions are each 0.25.",
    wrong: [
      "Ha: The quadrant proportions are not all 0.25.",
      "H0: The sample quadrant proportions are each 0.25.",
      "H0: Quadrant 1 has a greater proportion than quadrant 4."
    ],
    explanation: "The null hypothesis says all four population proportions equal the specified value of 0.25."
  },
  {
    desc: "Snack flavor counts are compared with a company claim of proportions 0.10, 0.20, 0.30, and 0.40. Choose the best null hypothesis.",
    correct: "H0: The flavor proportions are 0.10, 0.20, 0.30, and 0.40.",
    wrong: [
      "Ha: All four flavor proportions are different from 0.10, 0.20, 0.30, and 0.40.",
      "H0: The sample flavor proportions are 0.10, 0.20, 0.30, and 0.40.",
      "H0: The four flavor proportions are all 0.25."
    ],
    explanation: "The null hypothesis lists the claimed population proportions, not sample values or an alternative statement."
  },
  {
    desc: "An app design team compares icon colors across five categories to a planned distribution of 0.18, 0.24, 0.21, 0.17, and 0.20. Choose the best null hypothesis.",
    correct: "H0: The five app-icon color proportions are 0.18, 0.24, 0.21, 0.17, and 0.20.",
    wrong: [
      "Ha: At least one app-icon color proportion is not 0.18, 0.24, 0.21, 0.17, or 0.20.",
      "H0: The sample app-icon color proportions are 0.18, 0.24, 0.21, 0.17, and 0.20.",
      "H0: The five app-icon color proportions are all 0.20."
    ],
    explanation: "A null hypothesis for goodness of fit states that the population distribution matches the specified values."
  }
];

const level8Scenarios = [
  {
    desc: "Predatory lending businesses are tested against hypothesized income-bracket proportions of 0.452, 0.292, and 0.256. State the alternative hypothesis in words.",
    answer: "At least one of the proportions is not as specified in the null hypothesis.",
    keywords: ["at least one", "proportion", "not as specified", "null hypothesis"]
  },
  {
    desc: "Battleship quadrant choices are tested against the no-preference model of 0.25 in each quadrant. State the alternative hypothesis in words.",
    answer: "The distribution of preferred quadrants is not the same across all four quadrants.",
    keywords: ["distribution", "not the same", "quadrants", "proportion"]
  },
  {
    desc: "Snack flavor counts are tested against claimed proportions of 0.10, 0.20, 0.30, and 0.40. State the alternative hypothesis in words.",
    answer: "At least one flavor proportion differs from the claimed distribution.",
    keywords: ["at least one", "differs", "distribution", "proportion"]
  },
  {
    desc: "School lunch choices are tested against a district model for five categories. State the alternative hypothesis in words.",
    answer: "The distribution of lunch choices is not as specified by the null model.",
    keywords: ["distribution", "not as specified", "null model", "categories"]
  }
];

// ============ 8.3 SCENARIO BANKS ============

const level10Scenarios = [
  {
    desc: "A random sample of 40 predatory lending businesses is classified by income bracket. The null proportions are 0.452, 0.292, and 0.256. Find the expected count for the first category.",
    n: 40,
    proportions: [0.452, 0.292, 0.256],
    labels: ["< $50K", "$50K–$100K", "≥ $100K"],
    focusIndex: 0,
    correct: 18.08
  },
  {
    desc: "A random sample of 100 Battleship players picks one of four quadrants. The null model says each quadrant has probability 0.25. Find the expected count for Quadrant A.",
    n: 100,
    proportions: [0.25, 0.25, 0.25, 0.25],
    labels: ["Quadrant A", "Quadrant B", "Quadrant C", "Quadrant D"],
    focusIndex: 0,
    correct: 25
  },
  {
    desc: "A cereal company checks prize types in 80 randomly selected boxes. The claimed proportions are 0.30, 0.25, 0.25, and 0.20. Find the expected count for prize type D.",
    n: 80,
    proportions: [0.30, 0.25, 0.25, 0.20],
    labels: ["Type A", "Type B", "Type C", "Type D"],
    focusIndex: 3,
    correct: 16
  },
  {
    desc: "A school surveys 120 students about five lunch options. The district model gives proportions 0.18, 0.22, 0.20, 0.25, and 0.15. Find the expected count for option B.",
    n: 120,
    proportions: [0.18, 0.22, 0.20, 0.25, 0.15],
    labels: ["Option A", "Option B", "Option C", "Option D", "Option E"],
    focusIndex: 1,
    correct: 26.4
  },
  {
    desc: "A wildlife study records habitat zones for 60 randomly observed turtles. Past years give proportions 0.35, 0.25, 0.25, and 0.15. Find the expected count for Zone C.",
    n: 60,
    proportions: [0.35, 0.25, 0.25, 0.15],
    labels: ["Zone A", "Zone B", "Zone C", "Zone D"],
    focusIndex: 2,
    correct: 15
  },
  {
    desc: "A random sample of 200 voters is classified by party. The null proportions are 0.40, 0.35, and 0.25. Find the expected count for Independents.",
    n: 200,
    proportions: [0.40, 0.35, 0.25],
    labels: ["Democrat", "Republican", "Independent"],
    focusIndex: 2,
    correct: 50
  }
];

const level11Scenarios = [
  {
    desc: "A fair 6-sided die is rolled 60 times. The observed counts are 8, 12, 14, 7, 11, 8. Each expected count is 10. Compute the chi-square test statistic.",
    observed: [8, 12, 14, 7, 11, 8],
    expected: [10, 10, 10, 10, 10, 10],
    correct: 4.0
  },
  {
    desc: "A random sample of 100 Battleship players targets four quadrants. The observed counts are 16, 22, 33, 29 and expected counts are 25 each. Compute the chi-square test statistic.",
    observed: [16, 22, 33, 29],
    expected: [25, 25, 25, 25],
    correct: 6.96
  },
  {
    desc: "Predatory lending: observed counts are 22, 13, 5 for three income brackets. Expected counts are 18.08, 11.68, 10.24. Compute the chi-square test statistic.",
    observed: [22, 13, 5],
    expected: [18.08, 11.68, 10.24],
    correct: 3.58
  },
  {
    desc: "A fair 4-color spinner is spun 80 times. The observed counts are 24, 18, 22, 16. Expected count is 20 for each color. Compute the chi-square test statistic.",
    observed: [24, 18, 22, 16],
    expected: [20, 20, 20, 20],
    correct: 2.0
  },
  {
    desc: "Cereal prizes: observed counts are 28, 17, 21, 14 across four types. Expected counts are 24, 20, 20, 16. Compute the chi-square test statistic.",
    observed: [28, 17, 21, 14],
    expected: [24, 20, 20, 16],
    correct: 1.47
  },
  {
    desc: "A bag of candy has 5 colors. A sample of 150 gives observed counts 35, 28, 32, 25, 30. Expected count is 30 for each. Compute the chi-square test statistic.",
    observed: [35, 28, 32, 25, 30],
    expected: [30, 30, 30, 30, 30],
    correct: 1.67
  }
];

const level12Scenarios = [
  {
    desc: "A chi-square goodness-of-fit test compares observed counts across 3 categories. What are the degrees of freedom?",
    categories: 3,
    correct: "2",
    wrong: ["1", "3", "0"],
    explanation: "Degrees of freedom = number of categories minus 1 = 3 - 1 = 2."
  },
  {
    desc: "A chi-square goodness-of-fit test compares observed counts across 4 quadrants. What are the degrees of freedom?",
    categories: 4,
    correct: "3",
    wrong: ["2", "4", "1"],
    explanation: "Degrees of freedom = 4 - 1 = 3."
  },
  {
    desc: "A chi-square goodness-of-fit test compares observed counts across 6 faces of a die. What are the degrees of freedom?",
    categories: 6,
    correct: "5",
    wrong: ["4", "6", "3"],
    explanation: "Degrees of freedom = 6 - 1 = 5."
  },
  {
    desc: "A chi-square goodness-of-fit test compares observed counts across 5 lunch options. What are the degrees of freedom?",
    categories: 5,
    correct: "4",
    wrong: ["3", "5", "2"],
    explanation: "Degrees of freedom = 5 - 1 = 4."
  },
  {
    desc: "A chi-square goodness-of-fit test compares observed counts across 8 sections of a spinner. What are the degrees of freedom?",
    categories: 8,
    correct: "7",
    wrong: ["6", "8", "4"],
    explanation: "Degrees of freedom = 8 - 1 = 7."
  },
  {
    desc: "A chi-square goodness-of-fit test compares observed counts across 2 categories (heads/tails). What are the degrees of freedom?",
    categories: 2,
    correct: "1",
    wrong: ["0", "2", "3"],
    explanation: "Degrees of freedom = 2 - 1 = 1."
  }
];

const level13Scenarios = [
  {
    desc: "A chi-square GOF test gives p-value = 0.0208 with α = 0.05. What is the correct decision?",
    pValue: 0.0208,
    alpha: 0.05,
    correctChoice: "Reject H₀",
    expectedReasoning: "Since the p-value (0.0208) is less than α (0.05), we reject the null hypothesis. There is convincing evidence that the distribution is not as specified.",
    keywords: ["reject", "less than", "convincing evidence", "not as specified"],
    context: "income-bracket distribution"
  },
  {
    desc: "A chi-square GOF test gives p-value = 0.142 with α = 0.05. What is the correct decision?",
    pValue: 0.142,
    alpha: 0.05,
    correctChoice: "Fail to reject H₀",
    expectedReasoning: "Since the p-value (0.142) is greater than α (0.05), we fail to reject the null hypothesis. There is not convincing evidence that the distribution differs from the model.",
    keywords: ["fail to reject", "greater than", "not convincing", "model"],
    context: "quadrant distribution"
  },
  {
    desc: "A chi-square GOF test gives p-value = 0.003 with α = 0.01. What is the correct decision?",
    pValue: 0.003,
    alpha: 0.01,
    correctChoice: "Reject H₀",
    expectedReasoning: "Since the p-value (0.003) is less than α (0.01), we reject the null hypothesis. There is convincing evidence that the distribution is not as specified.",
    keywords: ["reject", "less than", "convincing evidence", "not as specified"],
    context: "color distribution"
  },
  {
    desc: "A chi-square GOF test gives p-value = 0.078 with α = 0.05. What is the correct decision?",
    pValue: 0.078,
    alpha: 0.05,
    correctChoice: "Fail to reject H₀",
    expectedReasoning: "Since the p-value (0.078) is greater than α (0.05), we fail to reject the null hypothesis. There is not convincing evidence that the distribution differs from what was claimed.",
    keywords: ["fail to reject", "greater than", "not convincing", "claimed"],
    context: "prize distribution"
  },
  {
    desc: "A chi-square GOF test gives p-value = 0.047 with α = 0.05. What is the correct decision?",
    pValue: 0.047,
    alpha: 0.05,
    correctChoice: "Reject H₀",
    expectedReasoning: "Since the p-value (0.047) is less than α (0.05), we reject the null hypothesis. There is convincing evidence that the distribution is not as specified by the null model.",
    keywords: ["reject", "less than", "convincing evidence", "null model"],
    context: "lunch option distribution"
  },
  {
    desc: "A chi-square GOF test gives p-value = 0.512 with α = 0.10. What is the correct decision?",
    pValue: 0.512,
    alpha: 0.10,
    correctChoice: "Fail to reject H₀",
    expectedReasoning: "Since the p-value (0.512) is much greater than α (0.10), we fail to reject the null hypothesis. There is not convincing evidence that the distribution differs from the model.",
    keywords: ["fail to reject", "greater than", "not convincing", "model"],
    context: "habitat zone distribution"
  }
];

const level14Scenarios = [
  {
    desc: "In a chi-square GOF test for predatory lending across three income brackets, the contributions are 0.85, 0.15, and 2.68. Which category has the largest discrepancy from the model?",
    contributions: [0.85, 0.15, 2.68],
    labels: ["< $50K", "$50K–$100K", "≥ $100K"],
    largestLabel: "≥ $100K",
    largestValue: 2.68,
    answer: "The ≥ $100K bracket has the largest contribution (2.68), meaning the observed count was farthest from what the model predicted for that bracket. This suggests businesses are concentrated less in high-income areas than expected.",
    keywords: ["largest", "contribution", "farthest", "expected", "high-income"]
  },
  {
    desc: "Battleship quadrant contributions are 3.24, 0.36, 2.56, and 0.64. Which quadrant shows the greatest discrepancy?",
    contributions: [3.24, 0.36, 2.56, 0.64],
    labels: ["Quadrant A", "Quadrant B", "Quadrant C", "Quadrant D"],
    largestLabel: "Quadrant A",
    largestValue: 3.24,
    answer: "Quadrant A has the largest contribution (3.24), meaning the observed count in Quadrant A was farthest from what the no-preference model predicted. Players targeted Quadrant A less or more than expected.",
    keywords: ["largest", "contribution", "quadrant a", "farthest", "predicted"]
  },
  {
    desc: "A candy color test has contributions: 0.83, 0.13, 0.13, 0.83, and 0.00. Which color has the greatest discrepancy?",
    contributions: [0.83, 0.13, 0.13, 0.83, 0.00],
    labels: ["Red", "Blue", "Green", "Yellow", "Orange"],
    largestLabel: "Red or Yellow",
    largestValue: 0.83,
    answer: "Red and Yellow are tied for the largest contribution (0.83). These colors have the greatest discrepancy from the expected count, meaning the factory may be producing these colors in different proportions than claimed.",
    keywords: ["largest", "contribution", "discrepancy", "expected", "proportions"]
  },
  {
    desc: "Lunch option contributions are 0.20, 1.85, 0.00, 0.42, and 0.60. Which option shows the greatest discrepancy from the district model?",
    contributions: [0.20, 1.85, 0.00, 0.42, 0.60],
    labels: ["Option A", "Option B", "Option C", "Option D", "Option E"],
    largestLabel: "Option B",
    largestValue: 1.85,
    answer: "Option B has the largest contribution (1.85), meaning the observed count for Option B was farthest from what the district model predicted. Student preferences for this option differ most from the model.",
    keywords: ["largest", "contribution", "option b", "farthest", "predicted", "differ"]
  },
  {
    desc: "A die fairness test has contributions: 0.40, 0.40, 1.60, 0.90, 0.10, and 0.40. Which face shows the greatest discrepancy?",
    contributions: [0.40, 0.40, 1.60, 0.90, 0.10, 0.40],
    labels: ["Face 1", "Face 2", "Face 3", "Face 4", "Face 5", "Face 6"],
    largestLabel: "Face 3",
    largestValue: 1.60,
    answer: "Face 3 has the largest contribution (1.60), meaning the observed count for Face 3 was farthest from the expected count of a fair die. This face appeared more or less often than random variation alone would predict.",
    keywords: ["largest", "contribution", "face 3", "farthest", "expected", "fair"]
  }
];

// ============ 8.5 SCENARIO BANKS ============

const level19Scenarios = [
  {
    desc: "A random sample of parents in 2019 and a separate random sample in 2020 were each asked what type of school their children attended. Researchers want to test if the distribution of school type differs between years.",
    correct: "Chi-square test for homogeneity",
    wrong: ["Chi-square test for independence", "Chi-square goodness-of-fit test", "Two-proportion z test"],
    explanation: "Two separate random samples from different populations (years), comparing the distribution of one categorical variable → homogeneity."
  },
  {
    desc: "A single random sample of 2000 adults was classified by education level and employment status. Researchers want to determine if there is an association between the two variables.",
    correct: "Chi-square test for independence",
    wrong: ["Chi-square test for homogeneity", "Chi-square goodness-of-fit test", "Two-sample t test"],
    explanation: "One random sample, two categorical variables recorded on each individual → independence."
  },
  {
    desc: "Random samples of voters from three different states were asked whether they supported a policy. Researchers want to compare the distribution of support across states.",
    correct: "Chi-square test for homogeneity",
    wrong: ["Chi-square test for independence", "Chi-square goodness-of-fit test", "One-proportion z test"],
    explanation: "Separate random samples from multiple populations (states), one categorical variable → homogeneity."
  },
  {
    desc: "A random sample of 500 high school students was surveyed about their grade level and whether they own a car. Researchers want to test whether car ownership is related to grade level.",
    correct: "Chi-square test for independence",
    wrong: ["Chi-square test for homogeneity", "Chi-square goodness-of-fit test", "Two-proportion z test"],
    explanation: "One random sample, two categorical variables (grade level and car ownership) → independence."
  },
  {
    desc: "Separate random samples of men and women were asked about their preferred social media platform. Researchers want to compare the distribution of platform preference between genders.",
    correct: "Chi-square test for homogeneity",
    wrong: ["Chi-square test for independence", "Chi-square goodness-of-fit test", "Two-sample t test"],
    explanation: "Separate random samples from two populations (men and women), one categorical variable → homogeneity."
  },
  {
    desc: "A random sample of 300 hospital patients was classified by insurance type and satisfaction level. Researchers want to know if satisfaction is associated with insurance type.",
    correct: "Chi-square test for independence",
    wrong: ["Chi-square test for homogeneity", "Chi-square goodness-of-fit test", "One-proportion z test"],
    explanation: "One random sample, two categorical variables (insurance type and satisfaction) → independence."
  }
];

const level20Scenarios = [
  {
    desc: "School type by year: researchers want to test if the distribution of school type differs between 2019 and 2020.",
    testType: "homogeneity",
    correct: "H₀: There is no difference in the distribution of school types between 2019 and 2020.",
    wrong: [
      "H₀: There is an association between school type and year.",
      "H₀: The proportion of public school students is the same in both years.",
      "Hₐ: There is no difference in the distribution of school types between 2019 and 2020."
    ],
    explanation: "Homogeneity null hypothesis states no difference in distributions across populations."
  },
  {
    desc: "Education and employment: researchers want to test if there is an association between education level and employment status.",
    testType: "independence",
    correct: "H₀: There is no association between education level and employment status.",
    wrong: [
      "H₀: There is an association between education level and employment status.",
      "H₀: The distribution of education level is the same for employed and unemployed adults.",
      "Hₐ: There is no association between education level and employment status."
    ],
    explanation: "Independence null hypothesis states no association between the two categorical variables."
  },
  {
    desc: "Voter support across three states: researchers want to compare the distribution of support.",
    testType: "homogeneity",
    correct: "H₀: There is no difference in the distribution of policy support across the three states.",
    wrong: [
      "H₀: There is an association between state and policy support.",
      "Hₐ: There is no difference in the distribution of policy support across the three states.",
      "H₀: The proportion supporting the policy is 0.50 in each state."
    ],
    explanation: "Homogeneity null hypothesis states the distribution is the same across all populations."
  },
  {
    desc: "Grade level and car ownership: researchers want to test whether car ownership is related to grade level.",
    testType: "independence",
    correct: "H₀: There is no association between grade level and car ownership.",
    wrong: [
      "Hₐ: There is no association between grade level and car ownership.",
      "H₀: The distribution of car ownership is the same for all grade levels.",
      "H₀: The proportion of car owners is greater for 12th graders than 9th graders."
    ],
    explanation: "Independence null hypothesis states no association between the two variables in the population."
  }
];

const level21Scenarios = [
  {
    desc: "School type by year. Two independent random samples: 320 parents in 2019 and 214 in 2020. There are millions of parents in each year. Expected counts: 257.1, 171.9, 22.0, 14.8, 40.7, 27.3. Are all conditions met?",
    correct: "Yes. Two independent random samples, both sample sizes are ≤ 10% of the population, and all expected counts are greater than 5.",
    wrong: [
      "No. The expected count of 14.8 is below 5.",
      "No. The sample sizes are more than 10% of the population.",
      "No. A chi-square test requires equal sample sizes from each population."
    ],
    explanation: "All three conditions are satisfied: random samples, 10% rule met, and smallest expected count is 14.8 > 5."
  },
  {
    desc: "A single random sample of 2000 adults classified by education and employment. Population of all adults is well over 20,000. Expected counts: 213.4, 552.9, 1173.7, 6.6, 17.1, 36.3. Are all conditions met?",
    correct: "Yes. Single random sample, 2000 is ≤ 10% of the population, and all expected counts are greater than 5.",
    wrong: [
      "No. The expected count of 6.6 is below 5.",
      "No. A single random sample cannot be used for a chi-square test.",
      "No. The sample size must be less than 1000 for chi-square tests."
    ],
    explanation: "All conditions are met: random sample, 10% rule satisfied, smallest expected count is 6.6 > 5."
  },
  {
    desc: "A convenience sample of 150 shoppers at a mall was classified by age group and purchase type. Expected counts: 12.5, 37.5, 25.0, 12.5, 37.5, 25.0. Are all conditions met?",
    correct: "No. The data were not collected using a random sample.",
    wrong: [
      "Yes. All expected counts are greater than 5.",
      "No. The expected count of 12.5 is below 5.",
      "No. The sample size is too small."
    ],
    explanation: "The randomness condition fails because a convenience sample is not a random sample."
  },
  {
    desc: "Random samples of 80 freshmen and 60 sophomores from a school of 200 students total. Students were asked about lunch preference. Expected counts: 28, 32, 20, 21, 24, 15. Are all conditions met?",
    correct: "No. The combined sample size (140) is more than 10% of the population (200).",
    wrong: [
      "Yes. The data are from random samples and all expected counts are above 5.",
      "No. All expected counts must be above 10, not 5.",
      "No. A chi-square test cannot be used with only two groups."
    ],
    explanation: "The 10% condition fails because 80 > 20 (10% of 200) and 60 > 20."
  },
  {
    desc: "A random sample of 40 patients classified by treatment group and outcome. Expected counts: 8.0, 12.0, 2.0, 3.0, 6.0, 9.0. Are all conditions met?",
    correct: "No. The expected counts of 2.0 and 3.0 are not greater than 5.",
    wrong: [
      "Yes. The sample is random and 40 is a reasonable sample size.",
      "No. The sample size must be at least 100.",
      "No. Chi-square tests cannot be used for medical studies."
    ],
    explanation: "The large counts condition fails because expected counts of 2.0 and 3.0 are below 5."
  }
];

const level22Scenarios = [
  {
    desc: "For a chi-square test for homogeneity, how must the data be collected?",
    answer: "The data must come from independent random samples from each population, or from a randomized experiment.",
    keywords: ["independent", "random samples", "each population", "randomized experiment"]
  },
  {
    desc: "For a chi-square test for independence, how must the data be collected?",
    answer: "The data must come from a single random sample, with two categorical variables recorded for each individual.",
    keywords: ["single", "random sample", "two", "categorical", "variables"]
  },
  {
    desc: "What is the difference between the null hypothesis for a homogeneity test and an independence test?",
    answer: "Homogeneity tests whether the distribution of one variable is the same across populations. Independence tests whether two variables are associated within one population.",
    keywords: ["distribution", "same", "populations", "association", "two variables"]
  },
  {
    desc: "Why must all expected counts be greater than 5 for a chi-square test?",
    answer: "The chi-square distribution is a good approximation for the sampling distribution only when expected counts are large enough. Small expected counts make the approximation unreliable.",
    keywords: ["approximation", "sampling distribution", "large enough", "unreliable", "chi-square"]
  },
  {
    desc: "A student checks the 10% condition by verifying that the sample size is less than 10% of the population. Why is this condition necessary?",
    answer: "When sampling without replacement, the observations need to be approximately independent. If the sample is too large relative to the population, the observations are no longer independent.",
    keywords: ["without replacement", "independent", "approximately", "too large", "population"]
  }
];

// ============ 8.4 SCENARIO BANKS ============

const level15Scenarios = [
  {
    desc: "A random sample of parents was surveyed about school type in 2019 and 2020.",
    table: {
      rowVar: "School Type", colVar: "Year",
      rows: ["Public", "Private", "Home"],
      cols: ["2019", "2020"],
      data: [[266, 163], [16, 21], [38, 30]],
      rowTotals: [429, 37, 68],
      colTotals: [320, 214],
      tableTotal: 534
    },
    question: "What is the row total for Public?",
    correct: 429
  },
  {
    desc: "A random sample of parents was surveyed about school type in 2019 and 2020.",
    table: {
      rowVar: "School Type", colVar: "Year",
      rows: ["Public", "Private", "Home"],
      cols: ["2019", "2020"],
      data: [[266, 163], [16, 21], [38, 30]],
      rowTotals: [429, 37, 68],
      colTotals: [320, 214],
      tableTotal: 534
    },
    question: "What is the column total for 2019?",
    correct: 320
  },
  {
    desc: "A random sample of 2000 adults was classified by education level and employment status.",
    table: {
      rowVar: "Employment", colVar: "Education",
      rows: ["Employed", "Unemployed"],
      cols: ["No HS Diploma", "HS No College", "HS Some College"],
      data: [[206, 548, 1186], [14, 22, 24]],
      rowTotals: [1940, 60],
      colTotals: [220, 570, 1210],
      tableTotal: 2000
    },
    question: "What is the table total?",
    correct: 2000
  },
  {
    desc: "A random sample of 2000 adults was classified by education level and employment status.",
    table: {
      rowVar: "Employment", colVar: "Education",
      rows: ["Employed", "Unemployed"],
      cols: ["No HS Diploma", "HS No College", "HS Some College"],
      data: [[206, 548, 1186], [14, 22, 24]],
      rowTotals: [1940, 60],
      colTotals: [220, 570, 1210],
      tableTotal: 2000
    },
    question: "What is the row total for Employed?",
    correct: 1940
  },
  {
    desc: "Students were surveyed about their preferred study method and grade level.",
    table: {
      rowVar: "Study Method", colVar: "Grade",
      rows: ["Alone", "Group", "Tutoring"],
      cols: ["9th", "10th", "11th", "12th"],
      data: [[30, 25, 20, 15], [10, 15, 25, 30], [10, 10, 5, 5]],
      rowTotals: [90, 80, 30],
      colTotals: [50, 50, 50, 50],
      tableTotal: 200
    },
    question: "What is the column total for 11th grade?",
    correct: 50
  },
  {
    desc: "Students were surveyed about their preferred study method and grade level.",
    table: {
      rowVar: "Study Method", colVar: "Grade",
      rows: ["Alone", "Group", "Tutoring"],
      cols: ["9th", "10th", "11th", "12th"],
      data: [[30, 25, 20, 15], [10, 15, 25, 30], [10, 10, 5, 5]],
      rowTotals: [90, 80, 30],
      colTotals: [50, 50, 50, 50],
      tableTotal: 200
    },
    question: "What is the row total for Group study?",
    correct: 80
  }
];

const level16Scenarios = [
  {
    desc: "School type by year: row totals are Public=429, Private=37, Home=68. Column totals are 2019=320, 2020=214. Table total=534. Find the expected count for Public in 2019.",
    rowTotal: 429, colTotal: 320, tableTotal: 534,
    cell: "Public, 2019",
    correct: 257.08
  },
  {
    desc: "School type by year: row totals are Public=429, Private=37, Home=68. Column totals are 2019=320, 2020=214. Table total=534. Find the expected count for Private in 2019.",
    rowTotal: 37, colTotal: 320, tableTotal: 534,
    cell: "Private, 2019",
    correct: 22.17
  },
  {
    desc: "Employment by education: row totals are Employed=1940, Unemployed=60. Column totals are No HS=220, HS No College=570, HS Some College=1210. Table total=2000. Find the expected count for Employed with No HS Diploma.",
    rowTotal: 1940, colTotal: 220, tableTotal: 2000,
    cell: "Employed, No HS Diploma",
    correct: 213.4
  },
  {
    desc: "Employment by education: row totals are Employed=1940, Unemployed=60. Column totals are No HS=220, HS No College=570, HS Some College=1210. Table total=2000. Find the expected count for Employed with HS No College.",
    rowTotal: 1940, colTotal: 570, tableTotal: 2000,
    cell: "Employed, HS No College",
    correct: 552.9
  },
  {
    desc: "Employment by education: row totals are Employed=1940, Unemployed=60. Column totals are No HS=220, HS No College=570, HS Some College=1210. Table total=2000. Find the expected count for Unemployed with No HS Diploma.",
    rowTotal: 60, colTotal: 220, tableTotal: 2000,
    cell: "Unemployed, No HS Diploma",
    correct: 6.6
  },
  {
    desc: "Study method by grade: row totals are Alone=90, Group=80, Tutoring=30. Column totals are all 50. Table total=200. Find the expected count for Alone in 9th grade.",
    rowTotal: 90, colTotal: 50, tableTotal: 200,
    cell: "Alone, 9th grade",
    correct: 22.5
  },
  {
    desc: "Study method by grade: row totals are Alone=90, Group=80, Tutoring=30. Column totals are all 50. Table total=200. Find the expected count for Group in 10th grade.",
    rowTotal: 80, colTotal: 50, tableTotal: 200,
    cell: "Group, 10th grade",
    correct: 20.0
  },
  {
    desc: "Study method by grade: row totals are Alone=90, Group=80, Tutoring=30. Column totals are all 50. Table total=200. Find the expected count for Tutoring in 12th grade.",
    rowTotal: 30, colTotal: 50, tableTotal: 200,
    cell: "Tutoring, 12th grade",
    correct: 7.5
  }
];

const level17Scenarios = [
  {
    desc: "School type by year. Column total for 2019 is 320. You already know expected counts of 257.1 (Public) and 22.2 (Private). Use subtraction to find the expected count for Home in 2019.",
    colTotal: 320, knownExpected: [257.1, 22.2],
    cell: "Home, 2019",
    correct: 40.7
  },
  {
    desc: "School type by year. Row total for Public is 429. Expected count for Public in 2019 is 257.1. Use subtraction to find the expected count for Public in 2020.",
    colTotal: 429, knownExpected: [257.1],
    cell: "Public, 2020",
    correct: 171.9
  },
  {
    desc: "Employment by education. Column total for No HS Diploma is 220. Expected count for Employed is 213.4. Use subtraction to find the expected count for Unemployed with No HS Diploma.",
    colTotal: 220, knownExpected: [213.4],
    cell: "Unemployed, No HS Diploma",
    correct: 6.6
  },
  {
    desc: "Employment by education. Row total for Employed is 1940. Expected counts already found: 213.4 (No HS) and 552.9 (HS No College). Use subtraction to find the expected count for Employed with HS Some College.",
    colTotal: 1940, knownExpected: [213.4, 552.9],
    cell: "Employed, HS Some College",
    correct: 1173.7
  },
  {
    desc: "Study method by grade. Column total for 9th grade is 50. Expected counts: 22.5 (Alone) and 20.0 (Group). Use subtraction to find the expected count for Tutoring in 9th grade.",
    colTotal: 50, knownExpected: [22.5, 20.0],
    cell: "Tutoring, 9th grade",
    correct: 7.5
  },
  {
    desc: "Study method by grade. Row total for Alone is 90. Expected count for Alone in 9th grade is 22.5. Use subtraction to find the expected count for Alone in the remaining three grades combined.",
    colTotal: 90, knownExpected: [22.5],
    cell: "Alone, remaining grades",
    correct: 67.5
  }
];

const level18Scenarios = [
  {
    desc: "In a two-way table, expected counts are calculated under what assumption?",
    answer: "Expected counts assume there is no relationship (no association) between the two categorical variables.",
    keywords: ["no relationship", "no association", "categorical", "variables", "independent"]
  },
  {
    desc: "A researcher finds the expected count for Public school in 2019 is 257.1, but the observed count is 266. What does this comparison tell us?",
    answer: "The observed count is higher than expected, which means more parents reported public school in 2019 than we would expect if school type and year were unrelated.",
    keywords: ["higher", "expected", "observed", "unrelated", "more"]
  },
  {
    desc: "Why do expected counts in a two-way table use the formula (row total × column total) / table total instead of just dividing the table total equally among all cells?",
    answer: "The formula accounts for the different row and column totals. Equal division would ignore that some categories are more common than others overall.",
    keywords: ["row total", "column total", "different", "common", "proportions"]
  },
  {
    desc: "If expected counts and observed counts are very close in every cell of a two-way table, what does that suggest about the relationship between the two variables?",
    answer: "It suggests there is no significant relationship between the two variables — the data are consistent with no association.",
    keywords: ["no relationship", "no association", "consistent", "close", "variables"]
  },
  {
    desc: "In the school type example, the overall proportion attending public school is 429/534 = 0.8034. How is this proportion used in calculating expected counts?",
    answer: "This proportion is multiplied by each column total to find the expected number of public school students in that column, assuming the proportion is the same for both years.",
    keywords: ["proportion", "column total", "multiplied", "same", "both"]
  },
  {
    desc: "A student says expected counts for the totals row and totals column should also be calculated. Is this correct? Why or why not?",
    answer: "No. Expected counts are only calculated for individual cells. The row totals, column totals, and table total stay the same — they are fixed by the observed data.",
    keywords: ["individual cells", "totals", "fixed", "same", "observed"]
  }
];

const level9Scenarios = [
  {
    desc: "A random sample of 40 predatory lending businesses is compared to null proportions 0.452, 0.292, and 0.256. There are far more than 400 such businesses in Dallas. Which statement about the conditions is correct?",
    correct:
      "Yes. The sample is random, 40 is no more than 10 percent of the population, and the expected counts 18.08, 11.68, and 10.24 are all above 5.",
    wrong: [
      "No. At least one expected count is below 5.",
      "No. The sample is more than 10 percent of the population.",
      "No. A chi-square goodness-of-fit test can only be used with two categories."
    ],
    explanation:
      "Conditions are met because the sample is random, 40 is within the 10 percent rule, and all expected counts exceed 5."
  },
  {
    desc: "A random sample of 30 pet adoptions is classified into three coat colors. The null proportions are 0.60, 0.25, and 0.15, and the shelter has more than 300 adoptions in the full population. Which statement about the conditions is correct?",
    correct: "No. The expected counts are 18, 7.5, and 4.5, so at least one expected count is below 5.",
    wrong: [
      "Yes. The sample is random and 30 is within 10 percent, so the test is fine.",
      "No. The sample is more than 10 percent of the population.",
      "No. Chi-square tests require the category proportions to all be equal."
    ],
    explanation: "Conditions fail because one expected count is 4.5, which is below 5."
  },
  {
    desc: "A teacher records the lunch-period preference of the first 60 students who walk into class and compares the four counts to an equal 0.25 model. The school has over 1000 students, so 60 is less than 10 percent of the population. Which statement about the conditions is correct?",
    correct: "No. The data did not come from a random sample or randomized experiment.",
    wrong: [
      "Yes. The expected counts are all 15, so the test conditions are met.",
      "No. The sample is more than 10 percent of the population.",
      "No. Chi-square goodness-of-fit tests cannot be used with four categories."
    ],
    explanation: "Conditions fail because the data were taken from the first students to arrive, not from a random sample."
  },
  {
    desc: "A random sample of 80 cereal boxes is taken from a shipment of 600 boxes. Prize types are compared across four categories with null proportions 0.25 each. Which statement about the conditions is correct?",
    correct: "No. The sample is more than 10 percent of the population because 80 is greater than 60.",
    wrong: [
      "Yes. The sample is random and the expected counts are all 20, so the test is fine.",
      "No. At least one expected count is below 5.",
      "No. The observed counts have to match the expected counts exactly before the test can be used."
    ],
    explanation: "Conditions fail because 80 exceeds 10 percent of 600, so the independence condition is not satisfied."
  },
  {
    desc: "A random sample of 100 Battleship players is surveyed. The null model says each quadrant has probability 0.25, and the population is at least 5000 players. Which statement about the conditions is correct?",
    correct:
      "Yes. The sample is random, 100 is no more than 10 percent of the population, and each expected count is 25, which is above 5.",
    wrong: [
      "No. The expected counts are too small because 25 is less than 5.",
      "No. The null proportions must be unequal for chi-square to work.",
      "No. A chi-square goodness-of-fit test cannot be used with four categories."
    ],
    explanation:
      "Conditions are met because the sample is random, 100 is within the 10 percent rule, and each expected count is 25."
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

  if (modeId === "l06-chi-square-gof-procedure") {
    const scen = drawFromBag("level6", level6Scenarios);
    const correct = "Chi-square goodness-of-fit test";
    const options = shuffle([
      correct,
      "One-proportion z test",
      "Two-proportion z test",
      "Chi-square test of homogeneity"
    ]);

    answers = {
      procedureChoice: { value: correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 6: Topic 8.2 Procedure",
        problemText: "Identify the correct inference procedure",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        procedureReasoning:
          "Use a chi-square goodness-of-fit test when one random sample of one categorical variable is compared with specified proportions."
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l07-state-null-hypothesis") {
    const scen = drawFromBag("level7", level7Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    answers = {
      nullChoice: { value: scen.correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 7: Null Hypothesis",
        problemText: "Choose the best null hypothesis",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        nullExplanation: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l08-state-alternative-hypothesis") {
    const scen = drawFromBag("level8", level8Scenarios);

    answers = {
      alternativeText: { value: scen.answer }
    };

    context = withAnswerContext(
      {
        levelName: "Level 8: Alternative Hypothesis",
        problemText: "State the alternative hypothesis in words",
        givenText: scen.desc,
        expectedKeywords: scen.keywords
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l09-check-conditions") {
    const scen = drawFromBag("level9", level9Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    answers = {
      conditionsChoice: { value: scen.correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 9: Check Conditions",
        problemText: "Decide whether the chi-square GOF conditions are met",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        conditionExplanation: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ============ 8.3 LEVELS ============

  if (modeId === "l10-expected-from-proportions") {
    const scen = drawFromBag("level10", level10Scenarios);
    const label = scen.labels[scen.focusIndex];
    const proportion = scen.proportions[scen.focusIndex];

    answers = {
      numericAnswer: {
        value: scen.correct,
        tolerance: 0.02
      }
    };

    context = withAnswerContext(
      {
        levelName: "Level 10: Topic 8.3 Expected Counts",
        problemText: `Calculate the expected count for ${label}`,
        givenText: `${scen.desc}\n\nNull proportion for ${label} = ${proportion}, sample size n = ${scen.n}. Use: Expected = proportion × n.`
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l11-chi-square-statistic") {
    const scen = drawFromBag("level11", level11Scenarios);
    const tableRows = scen.observed.map((obs, i) => `Observed=${obs}, Expected=${scen.expected[i]}`).join("; ");

    answers = {
      numericAnswer: {
        value: scen.correct,
        tolerance: 0.05
      }
    };

    context = withAnswerContext(
      {
        levelName: "Level 11: Chi-Square Statistic",
        problemText: "Compute the chi-square test statistic",
        givenText: `${scen.desc}\n\nData: ${tableRows}.\n\nSum all contributions: Σ (Observed − Expected)² / Expected.`
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l12-degrees-of-freedom") {
    const scen = drawFromBag("level12", level12Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    answers = {
      dfChoice: { value: scen.correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 12: Degrees of Freedom",
        problemText: "Find the degrees of freedom",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        dfExplanation: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l13-pvalue-decision") {
    const scen = drawFromBag("level13", level13Scenarios);

    answers = {
      decisionChoice: { value: scen.correctChoice },
      conclusionText: { value: scen.expectedReasoning }
    };

    context = withAnswerContext(
      {
        levelName: "Level 13: P-Value Decision",
        problemText: "Compare the p-value to α and state your decision",
        givenText: scen.desc,
        expectedReasoning: scen.expectedReasoning,
        keywords: scen.keywords,
        decisionContext: scen.context
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l14-largest-contribution") {
    const scen = drawFromBag("level14", level14Scenarios);

    answers = {
      contributionText: { value: scen.answer }
    };

    context = withAnswerContext(
      {
        levelName: "Level 14: Largest Contribution",
        problemText: "Identify the largest contribution and explain what it reveals",
        givenText: scen.desc,
        expectedKeywords: scen.keywords,
        contributionLabels: scen.labels,
        contributionValues: scen.contributions,
        largestLabel: scen.largestLabel
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ============ 8.5 LEVELS ============

  if (modeId === "l19-identify-test-type") {
    const scen = drawFromBag("level19", level19Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    answers = {
      testTypeChoice: { value: scen.correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 19: Topic 8.5 Identify Test Type",
        problemText: "Which chi-square test is appropriate?",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        testTypeExplanation: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l20-state-hypotheses") {
    const scen = drawFromBag("level20", level20Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    answers = {
      hypothesisChoice: { value: scen.correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 20: State Hypotheses",
        problemText: "Choose the correct null hypothesis",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        hypothesisExplanation: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l21-check-conditions") {
    const scen = drawFromBag("level21", level21Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    answers = {
      conditionsChoice: { value: scen.correct }
    };

    context = withAnswerContext(
      {
        levelName: "Level 21: Check Conditions",
        problemText: "Decide whether all conditions are met",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        conditionExplanation: scen.explanation
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l22-explain-conditions") {
    const scen = drawFromBag("level22", level22Scenarios);

    answers = {
      textAnswer: { value: scen.answer }
    };

    context = withAnswerContext(
      {
        levelName: "Level 22: Explain Conditions",
        problemText: "Explain in one or two sentences",
        givenText: scen.desc,
        expectedKeywords: scen.keywords
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ============ 8.4 LEVELS ============

  if (modeId === "l15-two-way-table-totals") {
    const scen = drawFromBag("level15", level15Scenarios);
    const t = scen.table;
    const tableStr = `${t.rowVar} (rows: ${t.rows.join(", ")}) by ${t.colVar} (columns: ${t.cols.join(", ")}).\nData: ${t.rows.map((r, i) => `${r}: [${t.data[i].join(", ")}]`).join("; ")}.`;

    answers = {
      numericAnswer: {
        value: scen.correct,
        tolerance: 0.5
      }
    };

    context = withAnswerContext(
      {
        levelName: "Level 15: Topic 8.4 Two-Way Table Totals",
        problemText: scen.question,
        givenText: `${scen.desc}\n\n${tableStr}`
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l16-expected-count-formula") {
    const scen = drawFromBag("level16", level16Scenarios);

    answers = {
      numericAnswer: {
        value: scen.correct,
        tolerance: 0.15
      }
    };

    context = withAnswerContext(
      {
        levelName: "Level 16: Expected Count Formula",
        problemText: `Calculate the expected count for ${scen.cell}`,
        givenText: `${scen.desc}\n\nUse: expected count = (row total × column total) / table total = (${scen.rowTotal} × ${scen.colTotal}) / ${scen.tableTotal}.`
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l17-subtraction-shortcut") {
    const scen = drawFromBag("level17", level17Scenarios);
    const knownStr = scen.knownExpected.join(" + ");

    answers = {
      numericAnswer: {
        value: scen.correct,
        tolerance: 0.15
      }
    };

    context = withAnswerContext(
      {
        levelName: "Level 17: Subtraction Shortcut",
        problemText: `Find the expected count for ${scen.cell} using subtraction`,
        givenText: `${scen.desc}\n\nTotal = ${scen.colTotal}. Known expected counts: ${knownStr}. Subtract to find the remaining expected count.`
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l18-interpret-expected-counts") {
    const scen = drawFromBag("level18", level18Scenarios);

    answers = {
      textAnswer: { value: scen.answer }
    };

    context = withAnswerContext(
      {
        levelName: "Level 18: Interpret Expected Counts",
        problemText: "Explain in one or two sentences",
        givenText: scen.desc,
        expectedKeywords: scen.keywords
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
