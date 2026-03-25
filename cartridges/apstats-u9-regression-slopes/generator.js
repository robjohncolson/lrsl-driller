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

// ============ LEVEL 5: CONDITIONS FOR INFERENCE (LINER) ============

const level5Scenarios = [
  {
    stem: "A scatterplot of x vs y shows a clear curved pattern, and the residual plot confirms a U-shaped trend. Which LINER condition is violated?",
    options: [
      "Linear — the relationship is not linear",
      "Independent — the observations are not independent",
      "Normal — the y-values are not normally distributed for each x",
      "Equal SD — the spread of y changes across x"
    ],
    correctIndex: 0,
    explanation: "A curved residual plot means the Linear condition is not met."
  },
  {
    stem: "A researcher surveys 200 students at a university with 1,500 total students. She uses regression to predict GPA from study hours. Which condition should she check with the 10% rule?",
    options: [
      "Independent — n should be less than 10% of the population",
      "Linear — the scatterplot must be straight",
      "Normal — residuals must be normally distributed",
      "Random — the sample must be randomly selected"
    ],
    correctIndex: 0,
    explanation: "The 10% condition checks Independence: 200 is more than 10% of 1,500, so independence may be violated."
  },
  {
    stem: "A histogram of the residuals from a regression is strongly skewed right. Which LINER condition is most directly in question?",
    options: [
      "Normal — the residuals should be approximately normal",
      "Linear — the relationship must be linear",
      "Equal SD — the spread must be constant",
      "Random — the data must come from a random process"
    ],
    correctIndex: 0,
    explanation: "Skewed residuals suggest the Normal condition may not be met."
  },
  {
    stem: "A residual plot shows a fan shape: residuals are tightly clustered for small x values but widely spread for large x values. Which LINER condition fails?",
    options: [
      "Equal SD — the standard deviation of y is not the same for all x",
      "Linear — the relationship is curved",
      "Independent — the observations affect each other",
      "Normal — the residuals are not normal"
    ],
    correctIndex: 0,
    explanation: "A fan-shaped residual plot indicates non-constant variance (Equal SD condition fails)."
  },
  {
    stem: "A study collects data from all students who volunteered to participate, rather than using a random sample. Which LINER condition is most at risk?",
    options: [
      "Random — data do not come from a random sample or experiment",
      "Linear — the scatterplot might be curved",
      "Normal — residuals might be skewed",
      "Independent — volunteers may influence each other"
    ],
    correctIndex: 0,
    explanation: "Volunteer (convenience) sampling violates the Random condition."
  },
  {
    stem: "Which condition requires that for any given value of x, the distribution of y-values follows a bell-shaped pattern?",
    options: [
      "Normal — y-values are normally distributed for each x",
      "Linear — the overall trend is a straight line",
      "Equal SD — the spread is constant across x",
      "Independent — observations don't influence each other"
    ],
    correctIndex: 0,
    explanation: "The Normal condition states that for each x, the y-values are normally distributed."
  },
  {
    stem: "A scientist measures the blood pressure of 50 patients at a hospital. The patients were selected using a random number generator from a list of 3,000 patients. Which LINER condition does this most directly support?",
    options: [
      "Random — data come from a random sample",
      "Linear — the scatterplot is linear",
      "Equal SD — the spread is constant",
      "Normal — the residuals are approximately normal"
    ],
    correctIndex: 0,
    explanation: "Using a random number generator to select subjects satisfies the Random condition."
  },
  {
    stem: "A regression analysis uses 15 data points from a population of 120. A classmate says the 10% condition is satisfied because 15 < 12. Is the classmate correct?",
    options: [
      "No — 10% of 120 is 12, and 15 > 12, so the condition is NOT satisfied",
      "Yes — 15 is close enough to 12 to satisfy the condition",
      "No — the 10% condition requires n > 10% of the population",
      "Yes — 15 is small enough to treat observations as independent"
    ],
    correctIndex: 0,
    explanation: "Since 15 > 12 (which is 10% of 120), the 10% condition for independence is not satisfied."
  }
];

// ============ LEVEL 6: SAMPLING DISTRIBUTION OF SLOPE ============

const level6Scenarios = [
  {
    stem: "The sampling distribution of b₁ is centered at which value?",
    options: [
      "β₁, the true population slope",
      "0, because the null hypothesis assumes no relationship",
      "b₁, the sample slope",
      "The sample mean of y"
    ],
    correctIndex: 0,
    explanation: "The sampling distribution of b₁ is centered at the true population slope β₁ (b₁ is an unbiased estimator)."
  },
  {
    stem: "Which of the following would DECREASE the standard deviation of the sampling distribution of b₁?",
    options: [
      "Increasing the sample size n",
      "Decreasing the sample size n",
      "Increasing the population standard deviation σ",
      "Decreasing the spread of x-values"
    ],
    correctIndex: 0,
    explanation: "Larger n appears in the denominator of SD(b₁) = σ / (sₓ × √(n−1)), so increasing n decreases the SD."
  },
  {
    stem: "The standard deviation of the sampling distribution of b₁ is σ / (sₓ × √(n−1)). If the spread of x-values (sₓ) increases, what happens to SD(b₁)?",
    options: [
      "SD(b₁) decreases — more spread in x gives a more precise slope estimate",
      "SD(b₁) increases — more spread in x adds more variability",
      "SD(b₁) stays the same — sₓ does not affect the slope precision",
      "SD(b₁) becomes zero — perfect precision"
    ],
    correctIndex: 0,
    explanation: "sₓ is in the denominator, so larger sₓ means smaller SD(b₁) and a more precise estimate."
  },
  {
    stem: "When the LINER conditions are met, the shape of the sampling distribution of b₁ is approximately:",
    options: [
      "Normal",
      "Skewed right",
      "Uniform",
      "Bimodal"
    ],
    correctIndex: 0,
    explanation: "When conditions are satisfied, the sampling distribution of b₁ is approximately Normal."
  },
  {
    stem: "A researcher wants a more precise estimate of the population slope. Which strategy would help MOST?",
    options: [
      "Collect more data points (increase n) with a wide range of x-values",
      "Use fewer data points to reduce noise",
      "Restrict the range of x-values to a narrow interval",
      "Use a population with larger σ (more residual variability)"
    ],
    correctIndex: 0,
    explanation: "Increasing n and increasing sₓ (wider x-range) both reduce SD(b₁), giving a more precise slope estimate."
  },
  {
    stem: "If σ (the population SD of residuals) is large, what effect does this have on the sampling distribution of b₁?",
    options: [
      "The distribution is wider — more scatter in residuals means less precision in estimating the slope",
      "The distribution is narrower — large σ helps stabilize the slope",
      "No effect — σ does not appear in the formula for SD(b₁)",
      "The distribution shifts to the right"
    ],
    correctIndex: 0,
    explanation: "σ is in the numerator of SD(b₁) = σ / (sₓ × √(n−1)), so larger σ means wider distribution."
  },
  {
    stem: "In practice, we don't know σ. What do we use instead to estimate SD(b₁)?",
    options: [
      "s, the standard deviation of the residuals, giving SE(b₁) = s / (sₓ × √(n−1))",
      "The sample standard deviation of y, sᵧ",
      "The sample mean of the residuals",
      "The population standard deviation of x"
    ],
    correctIndex: 0,
    explanation: "We replace σ with s (the residual SD) to get the standard error SE(b₁)."
  },
  {
    stem: "Two studies estimate the slope of the same population regression. Study A uses n = 25 and Study B uses n = 100. How do their sampling distributions compare?",
    options: [
      "Both are centered at β₁, but Study B's distribution is narrower",
      "Study A's distribution is centered at a different value than Study B's",
      "Both have the same spread because they estimate the same slope",
      "Study A's distribution is narrower because smaller samples are simpler"
    ],
    correctIndex: 0,
    explanation: "Both are centered at β₁, but larger n (Study B) gives a narrower (more precise) sampling distribution."
  }
];

// ============ LEVEL 7: STANDARD ERROR OF SLOPE ============

const level7Scenarios = [
  {
    context: "Regression output for predicting weight (lbs) from height (in):\nPredictor    Coef      SE Coef    T       P\nConstant    -150.23    18.410    -8.16   0.000\nHeight        4.82      0.257     18.75  0.000\ns = 12.47   R-sq = 78.1%   n = 102",
    question: "What is SE(b₁)?",
    answer: 0.257,
    tolerance: 0.001,
    explanation: "SE(b₁) is the SE Coef value in the predictor (Height) row: 0.257."
  },
  {
    context: "Regression output for predicting exam score from hours studied:\nPredictor       Coef      SE Coef    T       P\nConstant        45.20      3.180    14.21   0.000\nHoursStudied     5.68      0.842     6.75   0.000\ns = 8.93   R-sq = 64.2%   n = 28",
    question: "What is the sample slope b₁?",
    answer: 5.68,
    tolerance: 0.01,
    explanation: "b₁ is the Coef value in the predictor (HoursStudied) row: 5.68."
  },
  {
    context: "Regression output for predicting rent ($) from apartment size (sqft):\nPredictor    Coef      SE Coef    T       P\nConstant     212.50    45.300     4.69   0.000\nSize           1.34      0.038    35.26   0.000\ns = 98.72   R-sq = 91.3%   n = 120",
    question: "What is SE(b₁)?",
    answer: 0.038,
    tolerance: 0.001,
    explanation: "SE(b₁) is the SE Coef value in the Size row: 0.038."
  },
  {
    context: "Regression output for predicting fuel efficiency (mpg) from weight (1000 lbs):\nPredictor    Coef      SE Coef    T       P\nConstant     48.73      1.976    24.66   0.000\nWeight       -8.14      0.631   -12.90   0.000\ns = 4.15   R-sq = 82.7%   n = 38",
    question: "What is the standard deviation of the residuals (s)?",
    answer: 4.15,
    tolerance: 0.01,
    explanation: "s is the standard deviation of the residuals, shown below the table: s = 4.15."
  },
  {
    context: "A regression has s = 15.6, sₓ = 4.2, and n = 50. Calculate SE(b₁) using the formula SE(b₁) = s / (sₓ × √(n−1)).",
    question: "What is SE(b₁)? Round to 3 decimal places.",
    answer: 0.531,
    tolerance: 0.002,
    explanation: "SE(b₁) = 15.6 / (4.2 × √49) = 15.6 / (4.2 × 7) = 15.6 / 29.4 = 0.531."
  },
  {
    context: "A regression has s = 22.0, sₓ = 10.0, and n = 26. Calculate SE(b₁) using the formula SE(b₁) = s / (sₓ × √(n−1)).",
    question: "What is SE(b₁)? Round to 3 decimal places.",
    answer: 0.440,
    tolerance: 0.002,
    explanation: "SE(b₁) = 22.0 / (10.0 × √25) = 22.0 / (10.0 × 5) = 22.0 / 50.0 = 0.440."
  },
  {
    context: "Regression output for predicting marathon time (min) from training miles per week:\nPredictor       Coef      SE Coef    T       P\nConstant       305.40     12.800   23.86   0.000\nTrainingMiles   -1.92      0.185  -10.38   0.000\ns = 18.34   R-sq = 73.0%   n = 42",
    question: "What is SE(b₁)?",
    answer: 0.185,
    tolerance: 0.001,
    explanation: "SE(b₁) is the SE Coef value in the TrainingMiles row: 0.185."
  },
  {
    context: "A regression has s = 6.3, sₓ = 3.0, and n = 37. Calculate SE(b₁) using the formula SE(b₁) = s / (sₓ × √(n−1)).",
    question: "What is SE(b₁)? Round to 3 decimal places.",
    answer: 0.350,
    tolerance: 0.002,
    explanation: "SE(b₁) = 6.3 / (3.0 × √36) = 6.3 / (3.0 × 6) = 6.3 / 18.0 = 0.350."
  }
];

// ============ LEVEL 8: CONFIDENCE INTERVAL FOR SLOPE ============

// t* values for common confidence levels and df values (approximate)
const tStarTable = {
  // df: { 90%, 95%, 99% }
  18: { 90: 1.734, 95: 2.101, 99: 2.878 },
  23: { 90: 1.714, 95: 2.069, 99: 2.807 },
  28: { 90: 1.701, 95: 2.048, 99: 2.763 },
  33: { 90: 1.692, 95: 2.035, 99: 2.733 },
  38: { 90: 1.686, 95: 2.024, 99: 2.712 },
  48: { 90: 1.677, 95: 2.011, 99: 2.682 },
  58: { 90: 1.672, 95: 2.002, 99: 2.663 },
  98: { 90: 1.661, 95: 1.984, 99: 2.627 }
};

const level8Scenarios = [
  {
    contextName: "Old Faithful eruptions",
    xVar: "eruption duration (min)",
    yVar: "interval to next eruption (min)",
    b1: 13.29,
    se: 0.340,
    n: 30,
    df: 28,
    confLevel: 95,
    tStar: 2.048,
    units: "minutes per minute of duration",
    keywords: ["confident", "true slope", "between", "interval", "duration", "eruption"]
  },
  {
    contextName: "student study habits",
    xVar: "hours studied",
    yVar: "exam score (points)",
    b1: 5.68,
    se: 0.842,
    n: 25,
    df: 23,
    confLevel: 95,
    tStar: 2.069,
    units: "points per hour studied",
    keywords: ["confident", "true slope", "between", "score", "study", "hours"]
  },
  {
    contextName: "apartment rental prices",
    xVar: "apartment size (sqft)",
    yVar: "monthly rent ($)",
    b1: 1.34,
    se: 0.038,
    n: 50,
    df: 48,
    confLevel: 90,
    tStar: 1.677,
    units: "dollars per square foot",
    keywords: ["confident", "true slope", "between", "rent", "size", "square"]
  },
  {
    contextName: "car fuel efficiency",
    xVar: "weight (1000 lbs)",
    yVar: "fuel efficiency (mpg)",
    b1: -8.14,
    se: 0.631,
    n: 35,
    df: 33,
    confLevel: 95,
    tStar: 2.035,
    units: "mpg per 1000 lbs",
    keywords: ["confident", "true slope", "between", "mpg", "weight", "fuel"]
  },
  {
    contextName: "marathon training",
    xVar: "training miles per week",
    yVar: "marathon finish time (min)",
    b1: -1.92,
    se: 0.185,
    n: 40,
    df: 38,
    confLevel: 99,
    tStar: 2.712,
    units: "minutes per training mile",
    keywords: ["confident", "true slope", "between", "marathon", "training", "time"]
  },
  {
    contextName: "plant growth experiment",
    xVar: "sunlight hours per day",
    yVar: "plant height (cm)",
    b1: 2.45,
    se: 0.312,
    n: 20,
    df: 18,
    confLevel: 95,
    tStar: 2.101,
    units: "cm per hour of sunlight",
    keywords: ["confident", "true slope", "between", "height", "sunlight", "plant"]
  },
  {
    contextName: "ice cream sales",
    xVar: "daily high temperature (F)",
    yVar: "ice cream sales ($)",
    b1: 3.72,
    se: 0.445,
    n: 60,
    df: 58,
    confLevel: 90,
    tStar: 1.672,
    units: "dollars per degree Fahrenheit",
    keywords: ["confident", "true slope", "between", "sales", "temperature", "ice cream"]
  },
  {
    contextName: "commute times",
    xVar: "distance from work (miles)",
    yVar: "commute time (minutes)",
    b1: 2.15,
    se: 0.198,
    n: 100,
    df: 98,
    confLevel: 95,
    tStar: 1.984,
    units: "minutes per mile",
    keywords: ["confident", "true slope", "between", "commute", "distance", "time"]
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

function generateLevel5() {
  const scenario = drawFromBag("level5", level5Scenarios);
  const options = shuffle([...scenario.options]);
  const correctLabel = scenario.options[scenario.correctIndex];

  return withAnswerContext(
    {
      levelName: "9.2a: Conditions for Regression Inference (LINER)",
      problemText: scenario.stem,
      givenText: "Identify which LINER condition is described or violated.",
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      explanation: scenario.explanation
    },
    {
      conditionChoice: { value: correctLabel }
    }
  );
}

function generateLevel6() {
  const scenario = drawFromBag("level6", level6Scenarios);
  const options = shuffle([...scenario.options]);
  const correctLabel = scenario.options[scenario.correctIndex];

  return withAnswerContext(
    {
      levelName: "9.2b: Sampling Distribution of b\u2081",
      problemText: scenario.stem,
      givenText: "Think about the center, shape, and spread of the sampling distribution of the sample slope.",
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      explanation: scenario.explanation
    },
    {
      sdSlopeChoice: { value: correctLabel }
    }
  );
}

function generateLevel7() {
  const scenario = drawFromBag("level7", level7Scenarios);

  return withAnswerContext(
    {
      levelName: "9.2c: Standard Error of the Slope",
      problemText: scenario.question,
      givenText: scenario.context,
      explanation: scenario.explanation
    },
    {
      numericAnswer: { value: scenario.answer, tolerance: scenario.tolerance }
    }
  );
}

function generateLevel8() {
  const scenario = drawFromBag("level8", level8Scenarios);
  const me = roundTo(scenario.tStar * scenario.se, 3);
  const lower = roundTo(scenario.b1 - me, 3);
  const upper = roundTo(scenario.b1 + me, 3);

  return withAnswerContext(
    {
      levelName: "9.2d: Confidence Interval for the Slope",
      problemText: `Construct a ${scenario.confLevel}% confidence interval for the true slope of the regression model predicting ${scenario.yVar} from ${scenario.xVar} (${scenario.contextName}).`,
      givenText: `b\u2081 = ${scenario.b1}, SE(b\u2081) = ${scenario.se}, n = ${scenario.n}, df = ${scenario.df}, t* = ${scenario.tStar}`,
      contextName: scenario.contextName,
      xVar: scenario.xVar,
      yVar: scenario.yVar,
      confLevel: scenario.confLevel,
      b1: scenario.b1,
      se: scenario.se,
      tStar: scenario.tStar,
      units: scenario.units,
      keywords: scenario.keywords,
      expectedKeywords: scenario.keywords,
      explanation: `${scenario.confLevel}% CI: ${scenario.b1} \u00b1 ${scenario.tStar} \u00d7 ${scenario.se} = (${lower}, ${upper})`
    },
    {
      lowerBound: { value: lower, tolerance: 0.05 },
      upperBound: { value: upper, tolerance: 0.05 },
      interpretText: { value: `We are ${scenario.confLevel}% confident that the true slope is between ${lower} and ${upper} ${scenario.units}.` }
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
    case "l05-conditions-for-inference":
      return generateLevel5();
    case "l06-sampling-distribution-slope":
      return generateLevel6();
    case "l07-standard-error-slope":
      return generateLevel7();
    case "l08-confidence-interval-slope":
      return generateLevel8();
    default:
      return generateLevel1();
  }
}

export default { generate };
