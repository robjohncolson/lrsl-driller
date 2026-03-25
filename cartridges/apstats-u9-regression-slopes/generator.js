// generator.js - AP Statistics Unit 9: Inference for Regression Slopes (Topic 9.1)

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

// ============ LEVEL 1: POPULATION VS SAMPLE ============

const level1Scenarios = [
  {
    desc: "A researcher collects data on ALL trees in a national forest and fits a regression line predicting height from trunk diameter. The slope of this line is a true population parameter.",
    answer: "Population regression model",
    explanation: "When the regression uses the entire population, the slope is a true parameter (\u03b2\u2081)."
  },
  {
    desc: "A biologist measures 40 randomly selected fish from a lake and calculates a regression line predicting weight from length. The slope is an estimate based on this sample.",
    answer: "Sample regression line",
    explanation: "A subset of the population produces sample statistics (b\u2080, b\u2081), not true parameters."
  },
  {
    desc: "The equation y = 3.2 + 0.85x was determined using every single data point in the population. The value 0.85 is the true slope \u03b2\u2081.",
    answer: "Population regression model",
    explanation: "Using all data yields the true population regression model with parameter \u03b2\u2081."
  },
  {
    desc: "A student takes a random sample of 25 classmates and fits a line predicting test score from hours studied. The resulting slope b\u2081 = 4.7 is a sample statistic.",
    answer: "Sample regression line",
    explanation: "The slope b\u2081 from a sample is a statistic that estimates the population parameter \u03b2\u2081."
  },
  {
    desc: "In 1995, researchers used the complete Old Faithful eruption dataset to establish a model: predicted interval = 33.97 + 13.29(duration). The slope 13.29 is a population parameter.",
    answer: "Population regression model",
    explanation: "The full dataset defines the population model with true slope \u03b2\u2081 = 13.29."
  },
  {
    desc: "A new researcher collects 30 Old Faithful observations in 2019 and calculates the regression slope b\u2081 = 7.79. This slope comes from a sample, not the full population.",
    answer: "Sample regression line",
    explanation: "The 2019 data is a sample, so b\u2081 = 7.79 is a sample statistic."
  },
  {
    desc: "The notation \u03b2\u2080 and \u03b2\u2081 refers to the true y-intercept and slope of a regression model based on the entire population.",
    answer: "Population regression model",
    explanation: "Greek letters (\u03b2) denote population parameters in the regression model."
  },
  {
    desc: "The notation b\u2080 and b\u2081 refers to the y-intercept and slope calculated from a single random sample drawn from the population.",
    answer: "Sample regression line",
    explanation: "Roman letters (b) denote sample statistics that estimate the population parameters."
  }
];

// ============ LEVEL 2: SAMPLING VARIABILITY OF SLOPE ============

const level2Scenarios = [
  {
    stem: "If you take many random samples from the same population and compute the regression slope for each sample, you get different slopes each time. What does this illustrate?",
    options: [
      "Sampling variability of the slope",
      "Bias in the regression model",
      "A violation of the regression conditions",
      "The population slope is changing"
    ],
    correctIndex: 0,
    explanation: "Different samples produce different slopes. This natural variation is called sampling variability."
  },
  {
    stem: "A simulated sampling distribution of slopes is created by taking 500 random samples from a population and computing b\u2081 for each. What does this distribution show?",
    options: [
      "How the sample slope varies from sample to sample under the population model",
      "The exact value of the population slope",
      "That the regression model is invalid",
      "The distribution of residuals from one sample"
    ],
    correctIndex: 0,
    explanation: "The sampling distribution displays all 500 sample slopes, showing the pattern of variability around the true slope."
  },
  {
    stem: "The center of the simulated sampling distribution of slopes is approximately equal to which value?",
    options: [
      "The population slope \u03b2\u2081",
      "The sample slope b\u2081",
      "Zero",
      "The sample size n"
    ],
    correctIndex: 0,
    explanation: "The simulated sampling distribution centers on the true population slope \u03b2\u2081."
  },
  {
    stem: "Why do we build a sampling distribution of the slope using simulation?",
    options: [
      "To see what slopes are plausible if the population model is true",
      "To find the exact population slope",
      "To eliminate all sampling variability",
      "To increase the sample size"
    ],
    correctIndex: 0,
    explanation: "Simulation shows what sample slopes are likely under the assumed population model."
  },
  {
    stem: "A researcher takes a single sample and gets b\u2081 = 5.3. Another researcher takes a different sample from the same population and gets b\u2081 = 4.8. What best explains this difference?",
    options: [
      "Sampling variability \u2014 different samples produce different slopes",
      "One researcher made a calculation error",
      "The population slope changed between samples",
      "The regression model does not apply to this data"
    ],
    correctIndex: 0,
    explanation: "Sampling variability means every random sample yields a slightly different slope."
  },
  {
    stem: "If the population regression slope is \u03b2\u2081 = 10.5, which statement about sample slopes is true?",
    options: [
      "Most sample slopes will be close to 10.5, but not exactly 10.5",
      "Every sample slope will equal exactly 10.5",
      "Sample slopes will always be larger than 10.5",
      "Sample slopes will always be smaller than 10.5"
    ],
    correctIndex: 0,
    explanation: "Sample slopes cluster around the true value but vary due to sampling variability."
  },
  {
    stem: "What happens to the spread of the sampling distribution of slopes as the sample size increases?",
    options: [
      "The spread decreases \u2014 larger samples give more precise estimates",
      "The spread increases \u2014 larger samples have more variability",
      "The spread stays the same regardless of sample size",
      "The center shifts but the spread does not change"
    ],
    correctIndex: 0,
    explanation: "Larger samples reduce sampling variability, producing a narrower distribution of slopes."
  },
  {
    stem: "In a simulation, 1000 sample slopes are computed from a population with \u03b2\u2081 = 2.4. The simulated slopes range from 1.5 to 3.3. What does this range represent?",
    options: [
      "The range of plausible sample slopes when \u03b2\u2081 = 2.4 is the true parameter",
      "The range of all possible population slopes",
      "Proof that the model is wrong",
      "The confidence interval for \u03b2\u2081"
    ],
    correctIndex: 0,
    explanation: "The range shows what sample slopes are plausible under the population model with \u03b2\u2081 = 2.4."
  }
];

// ============ LEVEL 3: SIMULATION LOGIC ============

const level3Scenarios = [
  {
    context: "Old Faithful geyser: The 1995 population model has slope \u03b2\u2081 = 13.29. A simulated sampling distribution of slopes (n = 30) is centered at 13.3 with slopes ranging from about 10.2 to 16.5. A 2019 sample gives b\u2081 = 7.79.",
    observedSlope: 7.79,
    centerSlope: 13.3,
    rangeLow: 10.2,
    rangeHigh: 16.5,
    isUnusual: true,
    correctReason: "The observed slope 7.79 is far below the simulated range (10.2 to 16.5), so it is extremely unlikely under the population model.",
    distractors: [
      "The observed slope is within the simulated range, so it is consistent with the model.",
      "The observed slope is positive, so it must be consistent with any positive population slope.",
      "We cannot determine if the slope is unusual without a p-value from a t-test."
    ]
  },
  {
    context: "Plant growth study: A population model predicts height from sunlight hours with slope \u03b2\u2081 = 2.5 cm/hr. A simulation (n = 50) produces slopes centered at 2.5, ranging from 1.8 to 3.2. A new sample gives b\u2081 = 2.3.",
    observedSlope: 2.3,
    centerSlope: 2.5,
    rangeLow: 1.8,
    rangeHigh: 3.2,
    isUnusual: false,
    correctReason: "The observed slope 2.3 falls within the simulated range (1.8 to 3.2), so it is consistent with the population model.",
    distractors: [
      "The observed slope is different from the center, so it is unusual.",
      "The observed slope is less than the population slope, so the model is wrong.",
      "We need the exact p-value before making any determination."
    ]
  },
  {
    context: "Car fuel efficiency: A population model predicts MPG from weight with slope \u03b2\u2081 = -8.4 MPG/1000 lbs. A simulation (n = 35) produces slopes centered at -8.4, ranging from -10.1 to -6.7. A new sample gives b\u2081 = -3.2.",
    observedSlope: -3.2,
    centerSlope: -8.4,
    rangeLow: -10.1,
    rangeHigh: -6.7,
    isUnusual: true,
    correctReason: "The observed slope -3.2 is far outside the simulated range (-10.1 to -6.7), making it extremely unlikely under the population model.",
    distractors: [
      "The observed slope is negative like the population slope, so it is consistent.",
      "The observed slope falls within the range of the simulation.",
      "We cannot determine anything because the slope is negative."
    ]
  },
  {
    context: "Student test scores: A model predicts exam score from study hours with slope \u03b2\u2081 = 5.0 points/hr. A simulation (n = 40) produces slopes centered at 5.0, ranging from 3.5 to 6.5. A new sample gives b\u2081 = 4.1.",
    observedSlope: 4.1,
    centerSlope: 5.0,
    rangeLow: 3.5,
    rangeHigh: 6.5,
    isUnusual: false,
    correctReason: "The observed slope 4.1 is within the simulated range (3.5 to 6.5), so it is plausible under the population model.",
    distractors: [
      "The observed slope differs from the center by 0.9, so it is unusual.",
      "The observed slope is below the population slope, so the model is invalid.",
      "Since 4.1 is not exactly 5.0, the population model must be wrong."
    ]
  },
  {
    context: "Housing prices: A population model predicts price from square footage with slope \u03b2\u2081 = 125 $/sqft. A simulation (n = 25) produces slopes centered at 125, ranging from 95 to 155. A new sample gives b\u2081 = 68.",
    observedSlope: 68,
    centerSlope: 125,
    rangeLow: 95,
    rangeHigh: 155,
    isUnusual: true,
    correctReason: "The observed slope 68 is far below the simulated range (95 to 155), making it very unlikely under the population model.",
    distractors: [
      "The observed slope is positive like the simulated slopes, so it is consistent.",
      "The observed slope is within a reasonable distance of the center.",
      "We need to compute the chi-square statistic before concluding."
    ]
  },
  {
    context: "Running pace: A model predicts marathon finish time from weekly training miles with slope \u03b2\u2081 = -1.8 min/mile. A simulation (n = 45) produces slopes centered at -1.8, ranging from -2.5 to -1.1. A new sample gives b\u2081 = -1.5.",
    observedSlope: -1.5,
    centerSlope: -1.8,
    rangeLow: -2.5,
    rangeHigh: -1.1,
    isUnusual: false,
    correctReason: "The observed slope -1.5 falls within the simulated range (-2.5 to -1.1), so it is consistent with the population model.",
    distractors: [
      "The observed slope differs from the center, so it must be unusual.",
      "The slope is negative, which always indicates an unusual result.",
      "The observed slope is closer to zero than the population slope, so the model is invalid."
    ]
  }
];

// ============ LEVEL 4: CONCLUSION FROM SIMULATION ============

const level4Scenarios = [
  {
    context: "Old Faithful: The 1995 model has slope \u03b2\u2081 = 13.29. A simulation of 500 samples (n = 30) centered at 13.3 with range 10.2-16.5. The 2019 sample slope is b\u2081 = 7.79. The estimated probability of getting a slope as extreme as 7.79 is approximately 0 (0 out of 500 simulated slopes were this low).",
    isValid: false,
    populationSlope: 13.29,
    observedSlope: 7.79,
    probability: "approximately 0",
    keywords: ["unusual", "unlikely", "far", "outside", "probability", "zero", "0", "no longer valid", "changed", "not valid", "model", "simulation"]
  },
  {
    context: "Crop yield: A population model predicts yield from rainfall with slope \u03b2\u2081 = 3.6 bushels/inch. A simulation of 1000 samples (n = 50) centered at 3.6 with range 2.8-4.4. A new sample gives b\u2081 = 3.1. About 180 out of 1000 simulated slopes were at or below 3.1, giving an estimated probability of 0.18.",
    isValid: true,
    populationSlope: 3.6,
    observedSlope: 3.1,
    probability: "0.18",
    keywords: ["consistent", "plausible", "within", "not unusual", "common", "still valid", "probability", "0.18", "model", "simulation"]
  },
  {
    context: "Internet speed: A model predicts download speed from distance to tower with slope \u03b2\u2081 = -4.2 Mbps/mile. A simulation of 800 samples (n = 35) centered at -4.2 with range -5.8 to -2.6. A new sample gives b\u2081 = -1.1. Only 2 out of 800 simulated slopes were as extreme as -1.1, giving an estimated probability of 0.0025.",
    isValid: false,
    populationSlope: -4.2,
    observedSlope: -1.1,
    probability: "0.0025",
    keywords: ["unusual", "unlikely", "far", "outside", "rare", "probability", "0.0025", "no longer valid", "changed", "model", "simulation"]
  },
  {
    context: "Exercise study: A model predicts resting heart rate from weekly exercise hours with slope \u03b2\u2081 = -0.9 bpm/hr. A simulation of 600 samples (n = 40) centered at -0.9 with range -1.5 to -0.3. A new sample gives b\u2081 = -0.7. About 210 of 600 simulated slopes were at or beyond -0.7, giving an estimated probability of 0.35.",
    isValid: true,
    populationSlope: -0.9,
    observedSlope: -0.7,
    probability: "0.35",
    keywords: ["consistent", "plausible", "within", "not unusual", "common", "still valid", "probability", "0.35", "model", "simulation"]
  },
  {
    context: "Temperature study: A model predicts ice cream sales from temperature with slope \u03b2\u2081 = 15.0 $/degree. A simulation of 1000 samples (n = 30) centered at 15.0 with range 11.5-18.5. A new sample gives b\u2081 = 8.2. Zero out of 1000 simulated slopes were as low as 8.2, giving an estimated probability of 0.",
    isValid: false,
    populationSlope: 15.0,
    observedSlope: 8.2,
    probability: "0",
    keywords: ["unusual", "unlikely", "far", "outside", "impossible", "probability", "zero", "0", "no longer valid", "changed", "model", "simulation"]
  },
  {
    context: "Commute time: A model predicts commute minutes from distance with slope \u03b2\u2081 = 2.1 min/mile. A simulation of 500 samples (n = 45) centered at 2.1 with range 1.6-2.6. A new sample gives b\u2081 = 1.9. About 145 of 500 simulated slopes were at or below 1.9, giving an estimated probability of 0.29.",
    isValid: true,
    populationSlope: 2.1,
    observedSlope: 1.9,
    probability: "0.29",
    keywords: ["consistent", "plausible", "within", "not unusual", "common", "still valid", "probability", "0.29", "model", "simulation"]
  }
];

// ============ GENERATOR FUNCTIONS ============

function generateLevel1() {
  const scenario = drawFromBag("level1", level1Scenarios);
  return withAnswerContext(
    {
      levelName: "9.1a: Population Model vs Sample Line",
      problemText: scenario.desc,
      givenText: "Decide whether this describes a population regression model or a sample regression line.",
      explanation: scenario.explanation
    },
    {
      choiceAnswer: { value: scenario.answer }
    }
  );
}

function generateLevel2() {
  const scenario = drawFromBag("level2", level2Scenarios);
  const options = shuffle([...scenario.options]);
  const correctLabel = scenario.options[scenario.correctIndex];

  return withAnswerContext(
    {
      levelName: "9.1b: Sampling Variability of Slopes",
      problemText: scenario.stem,
      givenText: "Think about what happens when you take many random samples from the same population.",
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      explanation: scenario.explanation
    },
    {
      choiceAnswer: { value: correctLabel }
    }
  );
}

function generateLevel3() {
  const scenario = drawFromBag("level3", level3Scenarios);
  const unusualAnswer = scenario.isUnusual ? "Yes, it is unusual" : "No, it is consistent";

  const allReasons = shuffle([scenario.correctReason, ...scenario.distractors]);

  return withAnswerContext(
    {
      levelName: "9.1c: Is the Observed Slope Unusual?",
      problemText: scenario.context,
      givenText: `Observed slope: ${scenario.observedSlope}. Simulated distribution centered at ${scenario.centerSlope}, range ${scenario.rangeLow} to ${scenario.rangeHigh}.`,
      optA: allReasons[0],
      optB: allReasons[1],
      optC: allReasons[2],
      optD: allReasons[3],
      explanation: scenario.correctReason,
      isUnusual: scenario.isUnusual
    },
    {
      unusualChoice: { value: unusualAnswer },
      dropdownReason: { value: scenario.correctReason }
    }
  );
}

function generateLevel4() {
  const scenario = drawFromBag("level4", level4Scenarios);
  const validAnswer = scenario.isValid
    ? "Yes, the model is still valid"
    : "No, the model is no longer valid";

  return withAnswerContext(
    {
      levelName: "9.1d: Conclusion from Simulation",
      problemText: scenario.context,
      givenText: `Population slope: ${scenario.populationSlope}. Observed sample slope: ${scenario.observedSlope}. Estimated probability: ${scenario.probability}.`,
      keywords: scenario.keywords,
      expectedKeywords: scenario.keywords,
      isValid: scenario.isValid,
      theme: scenario.isValid ? "consistent" : "unusual"
    },
    {
      validityChoice: { value: validAnswer },
      explanationText: { value: validAnswer }
    }
  );
}

// ============ MAIN DISPATCHER ============

export function generate(modeId) {
  switch (modeId) {
    case "l01-population-vs-sample":
      return generateLevel1();
    case "l02-sampling-variability-slope":
      return generateLevel2();
    case "l03-simulation-logic":
      return generateLevel3();
    case "l04-conclusion-from-simulation":
      return generateLevel4();
    default:
      return generateLevel1();
  }
}

export default { generate };
