// generator.js - AP Statistics Unit 5 (Topics 5.1–5.7): Sampling Distributions
// Sampling variability, sampling distributions, z-scores, normal probability,
// inverse normal, AP solution elements, assessing normality, linear combinations,
// Central Limit Theorem, randomization distributions, biased/unbiased point estimates,
// sampling distributions for sample proportions, differences in sample proportions,
// sampling distributions for sample means

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

// ============ SHUFFLE BAG SYSTEM ============
// Prevents scenario repeats by cycling through all scenarios before any repeat

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

// ============ NORMAL DISTRIBUTION HELPERS ============

/**
 * Cumulative distribution function for the standard normal distribution.
 * Uses Horner form of Abramowitz & Stegun approximation (error < 1.5e-7).
 */
function normalCDF(z) {
  if (z < -8) return 0;
  if (z > 8) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse normal lookup table: area -> z-score.
 * Used for inverse normal problems (find the z given a percentile).
 */
const invNormTable = {
  0.01: -2.33, 0.025: -1.96, 0.05: -1.645, 0.10: -1.28,
  0.15: -1.04, 0.20: -0.84, 0.25: -0.67, 0.30: -0.52,
  0.40: -0.25, 0.50: 0, 0.60: 0.25, 0.70: 0.52,
  0.75: 0.67, 0.80: 0.84, 0.85: 1.04, 0.90: 1.28,
  0.95: 1.645, 0.975: 1.96, 0.99: 2.33
};

// ============ SCENARIO BANKS ============

// ---- Shared context bank for z-score / normal probability problems ----
const normalContextBank = [
  {
    label: "giraffe neck lengths",
    unit: "ft",
    mu: 5.9, sigma: 0.3,
    desc: "Giraffe neck lengths are normally distributed",
    article: "a randomly selected giraffe",
    measurable: "neck length"
  },
  {
    label: "human male heights",
    unit: "in",
    mu: 69.5, sigma: 2.5,
    desc: "Adult male heights in the U.S. are approximately normally distributed",
    article: "a randomly selected adult male",
    measurable: "height"
  },
  {
    label: "SAT scores",
    unit: "points",
    mu: 1060, sigma: 195,
    desc: "SAT scores are approximately normally distributed",
    article: "a randomly selected test-taker",
    measurable: "SAT score"
  },
  {
    label: "baby birth weights",
    unit: "lb",
    mu: 7.5, sigma: 1.2,
    desc: "Birth weights of full-term babies are normally distributed",
    article: "a randomly selected full-term baby",
    measurable: "birth weight"
  },
  {
    label: "marathon finish times",
    unit: "min",
    mu: 260, sigma: 40,
    desc: "Marathon finish times for recreational runners are approximately normally distributed",
    article: "a randomly selected recreational marathon runner",
    measurable: "finish time"
  },
  {
    label: "coffee serving temperatures",
    unit: "\u00b0F",
    mu: 175, sigma: 8,
    desc: "The temperature of coffee served at a caf\u00e9 is normally distributed",
    article: "a randomly selected cup of coffee",
    measurable: "temperature"
  },
  {
    label: "oak tree heights",
    unit: "ft",
    mu: 45, sigma: 6,
    desc: "Heights of mature oak trees in a forest are approximately normally distributed",
    article: "a randomly selected mature oak tree",
    measurable: "height"
  },
  {
    label: "daily commute times",
    unit: "min",
    mu: 28, sigma: 5.5,
    desc: "Daily commute times for workers in a city are approximately normally distributed",
    article: "a randomly selected worker",
    measurable: "commute time"
  }
];

// ---- L01: Sampling Variability scenarios ----
const sampleVariabilityBank = [
  {
    question: "A researcher takes five random samples of 50 students and calculates the mean GPA for each. The means are 3.2, 3.4, 3.1, 3.3, and 3.5. Why are these means different?",
    correctAnswer: "Because random sampling naturally produces different statistics from sample to sample",
    incorrectAnswer: "Because the samples were biased and the researcher made errors",
    explanation: "Different random samples include different individuals, so the sample means will naturally vary. This is called sampling variability."
  },
  {
    question: "A teacher rolls a fair six-sided die 30 times and records a mean of 3.7. Another teacher rolls the same die 30 times and gets a mean of 3.2. Why are these means different?",
    correctAnswer: "Because each set of 30 rolls is a different random sample from the same process",
    incorrectAnswer: "Because one of the dice must be unfair or loaded",
    explanation: "Each set of rolls is a random sample. Different samples produce different statistics even when the process is the same."
  },
  {
    question: "Koala weights have \u03bc = 15 kg and \u03c3 = 1.8 kg. A researcher weighs 40 koalas and gets x\u0304 = 14.6 kg. Another researcher weighs 40 koalas and gets x\u0304 = 15.3 kg. Why are these sample means different?",
    correctAnswer: "Because different random samples from the same population naturally yield different statistics",
    incorrectAnswer: "Because the population mean must have changed between the two studies",
    explanation: "The population parameters stayed the same. The sample means differ because each sample contains different koalas selected by chance."
  },
  {
    question: "An election poll with p = 0.51 is conducted by three organizations. Their results: 48%, 53%, 50%. Why don't they all get 51%?",
    correctAnswer: "Because each poll surveys a different random sample of voters, producing different sample proportions",
    incorrectAnswer: "Because the pollsters used different, flawed methodologies",
    explanation: "Each poll is based on a different random sample. Sample proportions naturally vary from sample to sample and from the true population proportion."
  },
  {
    question: "Two AP Statistics classes each flip a coin 100 times. Class A gets 54 heads and Class B gets 47 heads. Why didn't both get exactly 50?",
    correctAnswer: "Because each set of 100 flips is a different random sample, and sample proportions vary by chance",
    incorrectAnswer: "Because the coins used in each class have different probabilities of landing on heads",
    explanation: "Random processes produce different results each time. The proportion of heads varies from sample to sample due to chance alone."
  },
  {
    question: "A quality control manager takes three random samples of 25 bolts from a production line. The mean diameters are 10.02 mm, 9.97 mm, and 10.05 mm. Why are these different?",
    correctAnswer: "Because each sample of 25 bolts is a different random selection, so the sample means naturally vary",
    incorrectAnswer: "Because the machine's settings changed between samples",
    explanation: "Sampling variability means that different random samples from the same production process will yield different sample statistics."
  },
  {
    question: "Three students each survey 30 randomly selected seniors about hours of sleep. They get means of 6.8, 7.2, and 7.0 hours. A classmate says the surveys must have errors because the results differ. Is the classmate correct?",
    correctAnswer: "No \u2014 the differences are expected because random samples naturally produce different statistics",
    incorrectAnswer: "Yes \u2014 if the surveys were done correctly, all three should have gotten the same mean",
    explanation: "Sampling variability is normal and expected. Different random samples will almost always produce different sample statistics."
  },
  {
    question: "A cereal company claims each box contains 12 oz on average. A consumer group tests 5 boxes and finds x\u0304 = 11.8 oz. Another group tests 5 boxes and finds x\u0304 = 12.1 oz. What explains the different means?",
    correctAnswer: "Each group tested a different random sample of boxes, and sample means naturally vary from the population mean",
    incorrectAnswer: "The company is being inconsistent and putting different amounts in different boxes on purpose",
    explanation: "Even if the true mean is exactly 12 oz, random samples of 5 boxes will produce different sample means due to natural sampling variability."
  },
  {
    question: "A statistic varies from sample to sample. This variability is called:",
    correctAnswer: "Sampling variability \u2014 the natural variation in sample statistics across different random samples",
    incorrectAnswer: "Measurement error \u2014 mistakes made when collecting data from the sample",
    explanation: "Sampling variability is a fundamental concept: it refers to the fact that different random samples from the same population give different values for a statistic."
  },
  {
    question: "If we took every possible random sample of size 50 from a population and calculated the mean for each, we would see that the sample means:",
    correctAnswer: "Form a predictable distribution centered at the population mean, with some natural spread",
    incorrectAnswer: "Would all be exactly equal to the population mean if sampling is done correctly",
    explanation: "The collection of all possible sample means forms a sampling distribution. Individual means vary, but the pattern is predictable and centered at \u03bc."
  }
];

// ---- L02: Sampling Distribution Concept scenarios ----
const samplingDistConceptBank = [
  {
    question: "A sampling distribution of the sample mean shows:",
    correctAnswer: "The distribution of all possible sample means from repeated samples of the same size",
    wrongOptions: [
      "The distribution of individual data values in one sample",
      "The spread of a single sample's data around its mean",
      "The shape of the population from which samples are drawn"
    ]
  },
  {
    question: "As more and more random samples of the same size are collected, the sampling distribution of the sample mean:",
    correctAnswer: "Becomes more clearly defined and predictable in shape",
    wrongOptions: [
      "Becomes wider and more variable",
      "Shifts its center away from the population mean",
      "Becomes identical to the population distribution"
    ]
  },
  {
    question: "The center of the sampling distribution of x\u0304 is located at:",
    correctAnswer: "The population mean \u03bc",
    wrongOptions: [
      "The sample mean from the first sample taken",
      "The median of the population",
      "Zero, because positive and negative deviations cancel"
    ]
  },
  {
    question: "Which statement about sampling distributions is TRUE?",
    correctAnswer: "The sampling distribution describes the long-run pattern of a statistic across all possible samples",
    wrongOptions: [
      "A sampling distribution can only be created by actually taking hundreds of samples",
      "The sampling distribution has the same shape as the population distribution",
      "The sampling distribution gets wider as sample size increases"
    ]
  },
  {
    question: "Why are sampling distributions important in statistics?",
    correctAnswer: "They allow us to quantify how much a sample statistic is expected to vary, enabling inference about population parameters",
    wrongOptions: [
      "They prove that every sample will give the exact population parameter",
      "They eliminate the need for random sampling",
      "They show that larger populations require larger samples"
    ]
  },
  {
    question: "A sampling distribution is created by:",
    correctAnswer: "Taking many random samples of the same size and recording the statistic (e.g., mean) from each sample",
    wrongOptions: [
      "Calculating the mean once from a single large sample",
      "Increasing the sample size until the statistic stabilizes",
      "Removing outliers from a data set and re-calculating"
    ]
  },
  {
    question: "The variability (spread) of the sampling distribution of x\u0304 depends on:",
    correctAnswer: "The population standard deviation and the sample size n",
    wrongOptions: [
      "Only the population mean",
      "Only the number of samples taken",
      "Whether the population is normal or not"
    ]
  },
  {
    question: "If a sampling distribution of x\u0304 has a small standard deviation, this means:",
    correctAnswer: "Sample means tend to cluster tightly around the population mean, so individual samples give reliable estimates",
    wrongOptions: [
      "The population has no variability",
      "The sample size must be very small",
      "The population mean is close to zero"
    ]
  },
  {
    question: "An individual sample statistic is just one value from its sampling distribution. This means:",
    correctAnswer: "Any single sample statistic may not equal the parameter, but the pattern of all possible statistics is predictable",
    wrongOptions: [
      "We can never trust a single sample statistic",
      "Only the first sample we take is reliable",
      "We need the entire population to make any conclusion"
    ]
  }
];

// ---- L06: Solution Elements scenarios ----
const solutionElementsBank = [
  {
    solutionText: "Let X = the weight of a randomly selected package. X ~ N(50, 2.3). P(X > 54) = P(Z > 1.74) = 0.0409.",
    missingElement: "Define the random variable in context",
    explanation: "The variable X is defined, but the solution should state what X represents in the real-world context (e.g., 'Let X = the weight in grams of a randomly selected cereal package').",
    actuallyMissing: "Nothing \u2014 this solution includes all five elements",
    allOptions: [
      "Define the random variable in context",
      "State the normal distribution with parameters",
      "Show the value of interest and direction",
      "Nothing \u2014 this solution includes all five elements"
    ],
    correctAnswer: "Nothing \u2014 this solution includes all five elements"
  },
  {
    solutionText: "We want P(X < 62). Z = (62 - 65) / 4 = -0.75. P(Z < -0.75) = 0.2266.",
    missingElement: "State the normal distribution with parameters",
    explanation: "The solution jumps to the z-score calculation without explicitly stating that X ~ N(65, 4) or identifying the distribution as normal.",
    allOptions: [
      "Define the random variable in context",
      "State the normal distribution with parameters",
      "Show the value of interest and direction",
      "Calculate the correct probability"
    ],
    correctAnswer: "State the normal distribution with parameters"
  },
  {
    solutionText: "Let X = score on the exam. X ~ N(72, 8). The z-score is z = (x - 72) / 8. The probability is 0.1587.",
    missingElement: "Show the value of interest and direction",
    explanation: "The solution never specifies WHICH value of x is being evaluated or whether we want P(X > value) or P(X < value). The value of interest and direction are missing.",
    allOptions: [
      "Define the random variable in context",
      "State the normal distribution with parameters",
      "Show the value of interest and direction",
      "Identify the parameters (\u03bc and \u03c3)"
    ],
    correctAnswer: "Show the value of interest and direction"
  },
  {
    solutionText: "Let X = time to complete the task in minutes. We want P(X > 45). Z = (45 - 38) / 5 = 1.4. P(Z > 1.4) = 0.0808.",
    missingElement: "State the normal distribution with parameters",
    explanation: "The solution defines X, shows the value of interest (45) and direction (greater than), calculates z, and finds the probability \u2014 but never explicitly states X ~ N(38, 5).",
    allOptions: [
      "Define the random variable in context",
      "State the normal distribution with parameters",
      "Show the value of interest and direction",
      "Calculate the correct probability"
    ],
    correctAnswer: "State the normal distribution with parameters"
  },
  {
    solutionText: "X ~ N(100, 15). We want P(X > 120). Z = (120 - 100) / 15 = 1.33. P(Z > 1.33) = 0.0918.",
    missingElement: "Define the random variable in context",
    explanation: "The solution correctly uses the normal distribution, shows the value and direction, and computes the probability, but never defines what X represents in context.",
    allOptions: [
      "Define the random variable in context",
      "State the normal distribution with parameters",
      "Identify the parameters (\u03bc and \u03c3)",
      "Calculate the correct probability"
    ],
    correctAnswer: "Define the random variable in context"
  },
  {
    solutionText: "Let X = height in inches of a randomly selected adult woman. X ~ N(64.5, 2.5). We want P(X < 60). Z = (60 - 64.5) / 2.5 = -1.8.",
    missingElement: "Calculate the correct probability",
    explanation: "The solution defines X, states the distribution, identifies the value and direction, and computes the z-score, but never actually states the final probability P(Z < -1.8) = 0.0359.",
    allOptions: [
      "Define the random variable in context",
      "State the normal distribution with parameters",
      "Show the value of interest and direction",
      "Calculate the correct probability"
    ],
    correctAnswer: "Calculate the correct probability"
  },
  {
    solutionText: "Let Y = weight of a randomly selected apple in ounces. Y ~ N(6.2, 0.8). We want P(Y > 7.0). Z = (7.0 - 6.2) / 0.8 = 1.0. P(Z > 1.0) = 0.1587. About 15.87% of apples weigh more than 7.0 oz.",
    missingElement: "Nothing \u2014 this solution includes all five elements",
    explanation: "This solution has all required elements: defines Y in context, states distribution, shows value with direction, computes z, and gives the probability.",
    allOptions: [
      "Define the random variable in context",
      "State the normal distribution with parameters",
      "Show the value of interest and direction",
      "Nothing \u2014 this solution includes all five elements"
    ],
    correctAnswer: "Nothing \u2014 this solution includes all five elements"
  },
  {
    solutionText: "Let T = time in seconds for a randomly selected runner. T ~ N(12.4, 0.6). Z = (11.5 - 12.4) / 0.6 = -1.5. P(Z < -1.5) = 0.0668.",
    missingElement: "Show the value of interest and direction",
    explanation: "While the calculation uses 11.5 and the direction '<', the solution never explicitly states 'We want P(T < 11.5)' or describes what the problem is asking for.",
    allOptions: [
      "Define the random variable in context",
      "Show the value of interest and direction",
      "Identify the parameters (\u03bc and \u03c3)",
      "Calculate the correct probability"
    ],
    correctAnswer: "Show the value of interest and direction"
  }
];

// ---- L07: Assess Normality scenarios ----
const assessNormalityBank = [
  {
    desc: "A binomial distribution with n = 10, p = 0.14. The histogram would show most values at 0 or 1, with a long right tail.",
    isNormal: false,
    reason: "With n = 10 and p = 0.14, np = 1.4 (less than 10). The distribution is strongly skewed right with too few expected successes for the normal approximation to be appropriate.",
    givenInfo: "Binomial: n = 10, p = 0.14, np = 1.4, n(1-p) = 8.6"
  },
  {
    desc: "A binomial distribution with n = 75, p = 0.14. The histogram shows a roughly bell-shaped, unimodal distribution.",
    isNormal: true,
    reason: "With n = 75 and p = 0.14, np = 10.5 and n(1-p) = 64.5. Both are at least 10, so the distribution is approximately normal. The 68-95-99.7 rule applies.",
    givenInfo: "Binomial: n = 75, p = 0.14, np = 10.5, n(1-p) = 64.5"
  },
  {
    desc: "A binomial distribution with n = 8, p = 0.5. The histogram is symmetric and bell-shaped.",
    isNormal: true,
    reason: "With p = 0.5, the binomial distribution is perfectly symmetric for any n. Even with n = 8, the shape is bell-like and symmetric. np = 4 and n(1-p) = 4.",
    givenInfo: "Binomial: n = 8, p = 0.5, np = 4, n(1-p) = 4"
  },
  {
    desc: "A binomial distribution with n = 20, p = 0.05. The histogram shows almost all observations at 0 or 1, with an extreme right skew.",
    isNormal: false,
    reason: "With n = 20 and p = 0.05, np = 1.0 (far less than 10). There are too few expected successes for the distribution to be approximately normal. It is heavily right-skewed.",
    givenInfo: "Binomial: n = 20, p = 0.05, np = 1.0, n(1-p) = 19.0"
  },
  {
    desc: "A continuous distribution of exam scores that is unimodal, roughly symmetric, and follows the 68-95-99.7 rule with \u03bc = 75 and \u03c3 = 8.",
    isNormal: true,
    reason: "The distribution is unimodal, roughly symmetric, and follows the empirical rule (68-95-99.7). These are the hallmarks of an approximately normal distribution.",
    givenInfo: "Continuous: unimodal, symmetric, follows 68-95-99.7 rule"
  },
  {
    desc: "A distribution of household incomes in a large city. The histogram is strongly right-skewed with a long tail extending to very high incomes.",
    isNormal: false,
    reason: "Income distributions are typically right-skewed because a few individuals earn much more than the majority. A normal model would not be appropriate for this shape.",
    givenInfo: "Continuous: strongly right-skewed, long right tail"
  },
  {
    desc: "A binomial distribution with n = 100, p = 0.30. The histogram appears bell-shaped and roughly symmetric.",
    isNormal: true,
    reason: "With n = 100 and p = 0.30, np = 30 and n(1-p) = 70. Both are well above 10, so the normal approximation is appropriate. The distribution is nearly bell-shaped.",
    givenInfo: "Binomial: n = 100, p = 0.30, np = 30, n(1-p) = 70"
  },
  {
    desc: "Wait times at a bus stop follow an exponential distribution with a mean of 12 minutes. The histogram shows a strong right skew starting high and decreasing.",
    isNormal: false,
    reason: "Exponential distributions are always right-skewed with a mode at 0. They do not follow the symmetric, bell-shaped pattern required for a normal distribution.",
    givenInfo: "Continuous: exponential, right-skewed, mean = 12 min"
  },
  {
    desc: "A binomial distribution with n = 5, p = 0.80. The histogram is left-skewed with most values at 4 or 5.",
    isNormal: false,
    reason: "With n = 5 and p = 0.80, np = 4.0 (less than 10). The distribution is left-skewed because successes are very likely. The normal approximation is not appropriate.",
    givenInfo: "Binomial: n = 5, p = 0.80, np = 4.0, n(1-p) = 1.0"
  },
  {
    desc: "Heights of adult women in the U.S. The histogram is unimodal and approximately symmetric with a bell shape, centered around 64.5 inches.",
    isNormal: true,
    reason: "Heights of a large population are a classic example of a normal distribution: unimodal, approximately symmetric, and bell-shaped.",
    givenInfo: "Continuous: unimodal, symmetric, bell-shaped"
  }
];

// ---- L08 / L09: Linear Combination contexts ----
const linearComboBank = [
  {
    label: "Capitol 10K race",
    xName: "Female", yName: "Male",
    xUnit: "min", yUnit: "min",
    muX: 81, sigmaX: 16,
    muY: 70, sigmaY: 13,
    desc: "Finish times for the Capitol 10K race are normally distributed",
    diffQuestion: "What is the probability that a randomly selected female finishes SLOWER than a randomly selected male?",
    sumQuestion: "What is the expected total time if a randomly selected female and male each run the race?"
  },
  {
    label: "manufacturing weights",
    xName: "Machine A", yName: "Machine B",
    xUnit: "g", yUnit: "g",
    muX: 50.2, sigmaX: 1.4,
    muY: 49.8, sigmaY: 1.1,
    desc: "Weights of parts produced by two machines are normally distributed",
    diffQuestion: "What is the probability that a randomly selected part from Machine A weighs MORE than one from Machine B?",
    sumQuestion: "What is the expected combined weight of one part from each machine?"
  },
  {
    label: "heights",
    xName: "Men", yName: "Women",
    xUnit: "in", yUnit: "in",
    muX: 69.5, sigmaX: 2.5,
    muY: 64.5, sigmaY: 2.3,
    desc: "Heights of adult men and women are normally distributed",
    diffQuestion: "What is the probability that a randomly selected man is SHORTER than a randomly selected woman?",
    sumQuestion: "What is the expected sum of heights for a randomly selected man-woman pair?"
  },
  {
    label: "delivery times",
    xName: "Company A", yName: "Company B",
    xUnit: "days", yUnit: "days",
    muX: 3.2, sigmaX: 0.8,
    muY: 4.1, sigmaY: 1.2,
    desc: "Delivery times for two shipping companies are normally distributed",
    diffQuestion: "What is the probability that Company A delivers FASTER (less time) than Company B for a random order?",
    sumQuestion: "What is the expected total delivery time for one order from each company?"
  },
  {
    label: "test scores",
    xName: "Class A", yName: "Class B",
    xUnit: "points", yUnit: "points",
    muX: 82, sigmaX: 6,
    muY: 78, sigmaY: 7,
    desc: "Test scores for two classes are normally distributed",
    diffQuestion: "What is the probability that a randomly selected student from Class A scores LOWER than one from Class B?",
    sumQuestion: "What is the expected combined score for one student from each class?"
  },
  {
    label: "battery life",
    xName: "Brand X", yName: "Brand Y",
    xUnit: "hours", yUnit: "hours",
    muX: 48, sigmaX: 4.5,
    muY: 42, sigmaY: 3.8,
    desc: "Battery lifetimes for two brands are normally distributed",
    diffQuestion: "What is the probability that a randomly selected Brand X battery lasts SHORTER than a Brand Y battery?",
    sumQuestion: "What is the expected total battery life for one of each brand?"
  }
];

// ---- L10: Capstone scenarios ----
const capstoneBank = [
  {
    scenarioText: "A population has \u03bc = 100 and \u03c3 = 15. A researcher takes a single random sample of 36 observations and calculates x\u0304 = 103.5. Which statement is correct?",
    correctAnswer: "The sample mean (103.5) is one value from a sampling distribution centered at \u03bc = 100",
    wrongOptions: [
      "The population mean must actually be 103.5 since that is what the sample showed",
      "The sample is biased because 103.5 is not equal to 100",
      "A larger sample would always give a mean closer to 103.5"
    ],
    explanation: "A sample mean is just one observation from its sampling distribution. It naturally varies from the population mean due to sampling variability.",
    topicId: "5.1: Sampling Variability"
  },
  {
    scenarioText: "Adult female heights are approximately normal with \u03bc = 64.5 in and \u03c3 = 2.5 in. What is the probability that a randomly selected woman is taller than 69 inches?",
    correctAnswer: "About 0.0359 (z = 1.8, P(Z > 1.8) \u2248 0.036)",
    wrongOptions: [
      "About 0.9641 (this is P(Z < 1.8), the wrong direction)",
      "About 0.50 (heights are normal so half are above any value)",
      "Cannot be determined without knowing the sample size"
    ],
    explanation: "z = (69 - 64.5) / 2.5 = 1.8. P(Z > 1.8) = 1 - 0.9641 = 0.0359. About 3.6% of women are taller than 69 inches.",
    topicId: "5.2: Normal Probability"
  },
  {
    scenarioText: "A normal distribution has \u03bc = 500 and \u03c3 = 100. What value marks the top 10% of the distribution?",
    correctAnswer: "About 628 (z = 1.28, so x = 500 + 1.28(100) = 628)",
    wrongOptions: [
      "About 372 (this is the bottom 10%, not the top 10%)",
      "About 600 (this is one standard deviation above the mean)",
      "About 510 (this is only 0.1 standard deviation above the mean)"
    ],
    explanation: "Top 10% means area = 0.90 to the left. invNorm(0.90) = 1.28. x = 500 + 1.28(100) = 628.",
    topicId: "5.2: Inverse Normal"
  },
  {
    scenarioText: "X ~ N(\u03bcX = 80, \u03c3X = 5) and Y ~ N(\u03bcY = 75, \u03c3Y = 4). X and Y are independent. What is the standard deviation of X - Y?",
    correctAnswer: "About 6.40 (\u03c3 = \u221a(25 + 16) = \u221a41 \u2248 6.40)",
    wrongOptions: [
      "1 (subtracting the standard deviations: 5 - 4 = 1)",
      "9 (adding the standard deviations: 5 + 4 = 9)",
      "41 (this is the variance, not the standard deviation)"
    ],
    explanation: "For independent random variables, Var(X - Y) = Var(X) + Var(Y) = 25 + 16 = 41. SD = \u221a41 \u2248 6.40. Variances always ADD, even for differences!",
    topicId: "5.2: Linear Combinations"
  },
  {
    scenarioText: "A student's AP exam solution reads: 'X ~ N(200, 30). P(X > 240) = P(Z > 1.33) = 0.0918.' An AP grader would deduct points because the solution is missing:",
    correctAnswer: "A definition of the random variable X in context (what does X represent?)",
    wrongOptions: [
      "The formula for the z-score calculation",
      "A sketch of the normal curve",
      "The sample size used"
    ],
    explanation: "AP solutions must define the random variable in context (e.g., 'Let X = the weight in grams of a randomly selected cereal box'). The z-score work is implied by '1.33' but X is not defined.",
    topicId: "5.2: AP Solution Elements"
  },
  {
    scenarioText: "A binomial distribution with n = 12 and p = 0.08 is used to model the number of defective items. Is a normal approximation appropriate?",
    correctAnswer: "No \u2014 np = 0.96 which is far less than 10, so the distribution is too skewed for normal approximation",
    wrongOptions: [
      "Yes \u2014 because n = 12 is large enough for any probability",
      "Yes \u2014 because the binomial is always approximately normal",
      "No \u2014 because p must equal 0.5 for normal approximation"
    ],
    explanation: "For normal approximation to a binomial, we need np \u2265 10 and n(1-p) \u2265 10. Here np = 12(0.08) = 0.96, which is far too small. The distribution would be strongly right-skewed.",
    topicId: "5.2: Assessing Normality"
  },
  {
    scenarioText: "Weights of apples are N(\u03bc = 150g, \u03c3 = 20g). Weights of oranges are N(\u03bc = 200g, \u03c3 = 25g). If we define D = weight of orange - weight of apple, what is the mean and SD of D?",
    correctAnswer: "Mean = 50g, SD \u2248 32.02g (SD = \u221a(400 + 625) = \u221a1025 \u2248 32.02)",
    wrongOptions: [
      "Mean = 50g, SD = 5g (subtracting the SDs: 25 - 20 = 5)",
      "Mean = 50g, SD = 45g (adding the SDs: 25 + 20 = 45)",
      "Mean = 350g, SD = 32.02g (adding the means instead of subtracting)"
    ],
    explanation: "Mean(D) = 200 - 150 = 50g. Var(D) = 20\u00b2 + 25\u00b2 = 400 + 625 = 1025. SD(D) = \u221a1025 \u2248 32.02g. Remember: variances ADD even for differences.",
    topicId: "5.2: Linear Combinations"
  },
  {
    scenarioText: "Three different polling organizations each survey 1,000 randomly selected voters. They find sample proportions of 0.47, 0.51, and 0.49. This demonstrates:",
    correctAnswer: "Sampling variability \u2014 different random samples yield different statistics, even with the same sample size",
    wrongOptions: [
      "Bias \u2014 at least two of the polls must be biased since they disagree",
      "The population proportion is changing over time",
      "The polls used different and incompatible methods"
    ],
    explanation: "Different random samples from the same population naturally produce different sample statistics. This is sampling variability, not bias or error.",
    topicId: "5.1: Sampling Variability"
  },
  {
    scenarioText: "The sampling distribution of x\u0304 for samples of size n from a population with \u03bc = 50 and \u03c3 = 12 has a standard deviation of 12/\u221an. As n increases, what happens to this sampling distribution?",
    correctAnswer: "It becomes narrower (less spread) while remaining centered at \u03bc = 50",
    wrongOptions: [
      "It becomes wider because larger samples capture more variability",
      "It shifts to the right because larger samples produce larger means",
      "It stays exactly the same regardless of sample size"
    ],
    explanation: "As n increases, \u03c3/\u221an decreases, so the sampling distribution of x\u0304 becomes narrower. The center remains at \u03bc = 50. Larger samples give more precise estimates.",
    topicId: "5.1: Sampling Distributions"
  },
  {
    scenarioText: "A student claims: 'If my sample mean is 72 and the population mean is 70, my sample must be biased.' Is this correct?",
    correctAnswer: "No \u2014 a sample mean that differs from the population mean is expected due to sampling variability, not bias",
    wrongOptions: [
      "Yes \u2014 a good sample should always match the population mean exactly",
      "Yes \u2014 the difference of 2 proves systematic error in sampling",
      "It depends on whether the population is normal"
    ],
    explanation: "Sampling variability means sample statistics will almost never exactly equal the population parameter. A difference between x\u0304 and \u03bc is normal and expected, not evidence of bias.",
    topicId: "5.1: Sampling Variability"
  }
];


// ---- L11: CLT Concept scenarios ----
const cltConceptBank = [
  {
    question: "What does the Central Limit Theorem (CLT) state?",
    correctAnswer: "When the sample size is sufficiently large, the sampling distribution of x\u0304 is approximately normal, regardless of the population shape",
    wrongOptions: [
      "All populations become normally distributed when you collect enough data",
      "The sample mean always equals the population mean for large samples",
      "Larger samples always produce larger means than smaller samples"
    ]
  },
  {
    question: "What conditions does the Central Limit Theorem require?",
    correctAnswer: "Sample values must be independent and the sample size must be sufficiently large",
    wrongOptions: [
      "The population must already be normally distributed",
      "The sample size must be greater than 1000",
      "Samples must be taken with replacement only"
    ]
  },
  {
    question: "If a population is heavily right-skewed, the CLT says the sampling distribution of x\u0304 will be approximately normal when:",
    correctAnswer: "The sample size is sufficiently large (generally n \u2265 30)",
    wrongOptions: [
      "The skewness is removed by transforming the data",
      "Multiple samples are combined into one large sample",
      "The population standard deviation is small"
    ]
  },
  {
    question: "If the population is already normally distributed, the sampling distribution of x\u0304 is:",
    correctAnswer: "Normal for any sample size n, even n = 1",
    wrongOptions: [
      "Normal only when n \u2265 30",
      "Approximately normal only for large n",
      "The same shape as the population only when n is large"
    ]
  },
  {
    question: "As sample size n increases, the sampling distribution of x\u0304:",
    correctAnswer: "Stays centered at \u03bc but becomes narrower (less variable)",
    wrongOptions: [
      "Shifts its center toward the sample mean",
      "Becomes wider to capture more variation in the population",
      "Changes its center to better match the true population mean"
    ]
  },
  {
    question: "A researcher simulates 10,000 samples of size n = 40 from a strongly right-skewed population. The histogram of the 10,000 sample means will most likely be:",
    correctAnswer: "Approximately normal and centered at the population mean \u03bc",
    wrongOptions: [
      "Right-skewed, matching the shape of the population",
      "Left-skewed, as a mirror image of the population",
      "Uniform, since each sample mean is equally likely"
    ]
  },
  {
    question: "Why is the Central Limit Theorem considered one of the most important results in statistics?",
    correctAnswer: "It allows us to use normal probability calculations for sampling distributions even when the population is not normal",
    wrongOptions: [
      "It proves that all real-world populations are secretly normal",
      "It eliminates the need for random sampling",
      "It guarantees that larger samples give the exact population mean"
    ]
  },
  {
    question: "The standard deviation of the sampling distribution of x\u0304 is \u03c3/\u221an. This means:",
    correctAnswer: "The sampling distribution becomes less spread out as n increases, making x\u0304 a more precise estimator of \u03bc",
    wrongOptions: [
      "The population standard deviation decreases when you take larger samples",
      "Individual data values become less variable in larger samples",
      "The sample standard deviation is always smaller than the population standard deviation"
    ]
  },
  {
    question: "A sampling distribution of a statistic can be simulated by:",
    correctAnswer: "Generating many repeated random samples from the population and recording the statistic from each",
    wrongOptions: [
      "Taking one very large sample and splitting it into smaller groups",
      "Calculating the statistic once and assuming it represents the distribution",
      "Using algebra to derive the exact distribution formula"
    ]
  }
];

// ---- L12: CLT Application scenarios ----
const cltApplicationBank = [
  {
    popDesc: "A population of household incomes that is strongly right-skewed",
    sampleSize: 5,
    isNormal: false,
    reason: "The population is strongly right-skewed and n = 5 is far too small for the CLT to apply. With such a small sample from a skewed population, the sampling distribution of x\u0304 will still be skewed.",
    givenInfo: "Population: strongly right-skewed | n = 5"
  },
  {
    popDesc: "A population of household incomes that is strongly right-skewed",
    sampleSize: 50,
    isNormal: true,
    reason: "Although the population is strongly right-skewed, n = 50 is sufficiently large (\u2265 30) for the CLT to apply. The sampling distribution of x\u0304 will be approximately normal.",
    givenInfo: "Population: strongly right-skewed | n = 50"
  },
  {
    popDesc: "A normally distributed population of adult heights",
    sampleSize: 3,
    isNormal: true,
    reason: "The population is already normal, so the sampling distribution of x\u0304 is normal for ANY sample size, even n = 3. The CLT condition on sample size only matters for non-normal populations.",
    givenInfo: "Population: normal | n = 3"
  },
  {
    popDesc: "A uniform (flat) population of random number generator outputs",
    sampleSize: 40,
    isNormal: true,
    reason: "The uniform population is not normal, but n = 40 \u2265 30 is sufficiently large for the CLT to apply. The sampling distribution of x\u0304 will be approximately normal.",
    givenInfo: "Population: uniform | n = 40"
  },
  {
    popDesc: "A bimodal population (two peaks) of commute times for city and suburb workers combined",
    sampleSize: 10,
    isNormal: false,
    reason: "The population is bimodal (far from normal) and n = 10 is too small for the CLT to overcome this non-normality. The sampling distribution of x\u0304 will not be approximately normal.",
    givenInfo: "Population: bimodal | n = 10"
  },
  {
    popDesc: "A bimodal population (two peaks) of commute times for city and suburb workers combined",
    sampleSize: 100,
    isNormal: true,
    reason: "Although the population is bimodal, n = 100 is very large (\u2265 30). The CLT guarantees the sampling distribution of x\u0304 will be approximately normal for such a large sample.",
    givenInfo: "Population: bimodal | n = 100"
  },
  {
    popDesc: "A slightly left-skewed population of test scores",
    sampleSize: 25,
    isNormal: true,
    reason: "With only slight skew and n = 25, the sampling distribution of x\u0304 is approximately normal. For mildly non-normal populations, sample sizes less than 30 can still produce approximately normal sampling distributions.",
    givenInfo: "Population: slightly left-skewed | n = 25"
  },
  {
    popDesc: "A heavily right-skewed population of medical costs with extreme outliers",
    sampleSize: 15,
    isNormal: false,
    reason: "The population is heavily right-skewed with extreme outliers, and n = 15 is not large enough for the CLT to produce an approximately normal sampling distribution. Heavy skew and outliers require larger sample sizes.",
    givenInfo: "Population: heavily right-skewed with outliers | n = 15"
  },
  {
    popDesc: "A normally distributed population of SAT scores",
    sampleSize: 100,
    isNormal: true,
    reason: "The population is normal, so the sampling distribution of x\u0304 is exactly normal for any n. With n = 100, it is also very narrow (small standard deviation \u03c3/\u221a100).",
    givenInfo: "Population: normal | n = 100"
  },
  {
    popDesc: "An exponential (strongly right-skewed) population of wait times at a bus stop",
    sampleSize: 8,
    isNormal: false,
    reason: "Exponential distributions are strongly right-skewed, and n = 8 is too small for the CLT. The sampling distribution of x\u0304 will still be right-skewed, though less so than the population.",
    givenInfo: "Population: exponential (right-skewed) | n = 8"
  }
];

// ---- L13: Randomization Concept scenarios ----
const randomizationConceptBank = [
  {
    question: "A randomization distribution is created by:",
    correctAnswer: "Repeatedly randomly reassigning the observed response values to treatment groups and calculating the statistic each time",
    wrongOptions: [
      "Taking multiple random samples from the general population",
      "Randomly choosing which statistical test to use for the data",
      "Assigning participants to treatment groups in the original experiment"
    ]
  },
  {
    question: "In a randomization distribution, the values on the horizontal axis represent:",
    correctAnswer: "Statistics (like differences in means) calculated from simulated random reassignments of the data",
    wrongOptions: [
      "The original individual data points from the experiment",
      "Population parameters estimated from the experiment",
      "Standard deviations from different random samples"
    ]
  },
  {
    question: "A randomization distribution is typically centered near 0 because:",
    correctAnswer: "Under the assumption of no treatment effect, random reassignment should produce differences near 0 on average",
    wrongOptions: [
      "The mean of any statistical distribution must be 0",
      "The treatment always has no effect in real experiments",
      "Positive and negative outcomes are impossible in experiments"
    ]
  },
  {
    question: "The purpose of creating a randomization distribution is to:",
    correctAnswer: "Determine how likely the observed experimental result would be if it happened by chance alone",
    wrongOptions: [
      "Prove that the experiment was conducted with proper random assignment",
      "Find the exact true treatment effect in the population",
      "Increase the effective sample size of the experiment"
    ]
  },
  {
    question: "In a randomization test, we keep the data values the same but shuffle which group each value belongs to. This simulates:",
    correctAnswer: "What results we would see if the treatment had no real effect and the grouping was purely random",
    wrongOptions: [
      "What would happen if we ran the experiment again with new participants",
      "The distribution of the variable in the general population",
      "How measurement error affects the results"
    ]
  },
  {
    question: "When creating a randomization distribution for an experiment comparing two treatments with n\u2081 = 8 and n\u2082 = 8:",
    correctAnswer: "We randomly assign 8 of the 16 total response values to Group 1 and the remaining 8 to Group 2, then find the difference in means",
    wrongOptions: [
      "We collect 16 new observations and split them randomly into two groups",
      "We only shuffle the values within each original group, not between groups",
      "We randomly select which 8 values to delete and compute the mean of the rest"
    ]
  },
  {
    question: "How does a randomization distribution differ from a sampling distribution?",
    correctAnswer: "A randomization distribution reassigns existing experimental data to groups, while a sampling distribution comes from repeated random samples from a population",
    wrongOptions: [
      "They are the same thing with different names",
      "A randomization distribution requires a normal population; a sampling distribution does not",
      "A sampling distribution is always centered at 0; a randomization distribution is not"
    ]
  },
  {
    question: "A researcher conducts an experiment and observes a difference in means of 5.2 between treatment and control. The randomization distribution shows that such a large difference almost never occurs by chance. This means:",
    correctAnswer: "There is convincing evidence that the treatment caused the observed difference, since it is unlikely to be due to random assignment alone",
    wrongOptions: [
      "The experiment must have been poorly designed",
      "The researcher should collect more data before drawing any conclusion",
      "The treatment effect is exactly 5.2 in the population"
    ]
  }
];

// ---- L14: Randomization Interpretation scenarios ----
const randomizationInterpretBank = [
  {
    experimentDesc: "A pharmaceutical company tests Drug A vs. a placebo for reducing headache pain. 30 patients are randomly assigned to two groups.",
    observedDiff: 4.2,
    diffLabel: "Drug A mean - Placebo mean",
    unit: "points on a pain scale",
    extremeCount: 23,
    totalTrials: 1000,
    isConvincing: true,
    explanation: "The p-value of 0.023 means only 2.3% of random reassignments produced a difference this large or larger. This is unlikely to happen by chance alone, providing convincing evidence that Drug A reduces pain more than the placebo."
  },
  {
    experimentDesc: "A school compares two teaching methods for improving math scores. 40 students are randomly assigned to Method A or Method B.",
    observedDiff: 2.1,
    diffLabel: "Method A mean - Method B mean",
    unit: "points",
    extremeCount: 187,
    totalTrials: 1000,
    isConvincing: false,
    explanation: "The p-value of 0.187 means 18.7% of random reassignments produced a difference this large or larger. This could plausibly happen by chance, so there is not convincing evidence that Method A is better than Method B."
  },
  {
    experimentDesc: "Researchers test whether a new exercise program helps with weight loss. 24 participants are randomly assigned to the program or a control group.",
    observedDiff: 3.5,
    diffLabel: "Exercise mean - Control mean",
    unit: "lbs lost",
    extremeCount: 8,
    totalTrials: 500,
    isConvincing: true,
    explanation: "The p-value of 0.016 means only 1.6% of random reassignments produced a difference this large or larger. This is unlikely by chance alone, providing convincing evidence that the exercise program increases weight loss."
  },
  {
    experimentDesc: "A gardener tests a new fertilizer on tomato plants. 20 plants are randomly assigned to receive the fertilizer or plain water.",
    observedDiff: 1.2,
    diffLabel: "Fertilizer mean - Water mean",
    unit: "cm of growth",
    extremeCount: 342,
    totalTrials: 1000,
    isConvincing: false,
    explanation: "The p-value of 0.342 means 34.2% of random reassignments produced a difference this large or larger. This could easily happen by chance, so there is not convincing evidence that the fertilizer increases growth."
  },
  {
    experimentDesc: "A hospital tests whether a new medication reduces recovery time after surgery. 28 patients are randomly assigned to the new medication or standard care.",
    observedDiff: 2.8,
    diffLabel: "Standard mean - New medication mean",
    unit: "days",
    extremeCount: 3,
    totalTrials: 500,
    isConvincing: true,
    explanation: "The p-value of 0.006 means only 0.6% of random reassignments produced a difference this large or larger. This is very unlikely by chance alone, providing strong evidence that the new medication reduces recovery time."
  },
  {
    experimentDesc: "A tutoring company tests whether their program improves SAT scores. 36 students are randomly assigned to receive tutoring or no tutoring.",
    observedDiff: 5.3,
    diffLabel: "Tutored mean - Control mean",
    unit: "points",
    extremeCount: 47,
    totalTrials: 1000,
    isConvincing: true,
    explanation: "The p-value of 0.047 means only 4.7% of random reassignments produced a difference this large or larger. This is unlikely by chance (just under 5%), providing evidence that tutoring improves scores."
  },
  {
    experimentDesc: "Nutritionists compare Diet A vs. Diet B for weight loss over 8 weeks. 22 participants are randomly assigned to one of the diets.",
    observedDiff: 0.8,
    diffLabel: "Diet A mean - Diet B mean",
    unit: "lbs lost",
    extremeCount: 412,
    totalTrials: 1000,
    isConvincing: false,
    explanation: "The p-value of 0.412 means 41.2% of random reassignments produced a difference this large or larger. This could very easily happen by chance, so there is no convincing evidence that Diet A is better than Diet B."
  },
  {
    experimentDesc: "In a double-blind experiment, 16 nursing mothers were randomly assigned to take Melatonin or a Placebo to increase newborn nighttime sleep.",
    observedDiff: 1.69,
    diffLabel: "Melatonin mean - Placebo mean",
    unit: "hours of sleep",
    extremeCount: 12,
    totalTrials: 1000,
    isConvincing: true,
    explanation: "The p-value of 0.012 means only 1.2% of random reassignments produced a difference of 1.69 hours or more. This is unlikely by chance alone, providing convincing evidence that melatonin increases newborn sleep time."
  }
];

// ---- L15: 5.3 Capstone scenarios ----
const capstone53Bank = [
  {
    scenarioText: "A population of reaction times is strongly right-skewed with \u03bc = 450 ms and \u03c3 = 120 ms. A researcher plans to take random samples of size n = 36. What can we say about the sampling distribution of x\u0304?",
    correctAnswer: "It will be approximately normal with mean 450 ms and SD = 120/\u221a36 = 20 ms",
    wrongOptions: [
      "It will be right-skewed like the population, with SD = 120 ms",
      "It will be approximately normal only if we take at least 1000 samples",
      "We cannot determine anything about the sampling distribution without more information"
    ],
    explanation: "By the CLT, since n = 36 \u2265 30, the sampling distribution of x\u0304 is approximately normal regardless of population shape. Mean = \u03bc = 450, SD = \u03c3/\u221an = 120/\u221a36 = 20 ms.",
    topicId: "5.3: CLT Application"
  },
  {
    scenarioText: "In a randomized experiment, the observed difference in means between treatment and control was 3.7. A simulation of 1000 random reassignments produced 31 differences as extreme as or more extreme than 3.7. What is the p-value and what does it tell us?",
    correctAnswer: "P-value = 0.031; there is convincing evidence that the treatment has a real effect because this result is unlikely by chance alone",
    wrongOptions: [
      "P-value = 0.031; the treatment effect is exactly 3.7 in the population",
      "P-value = 0.969; most reassignments produced smaller differences, so the treatment works",
      "P-value = 31; we need at least 50 extreme values to conclude anything"
    ],
    explanation: "P-value = 31/1000 = 0.031. Since only 3.1% of random reassignments produced a difference this extreme, the observed result is unlikely due to chance alone \u2014 convincing evidence of a real treatment effect.",
    topicId: "5.3: Randomization Interpretation"
  },
  {
    scenarioText: "A normally distributed population has \u03bc = 200 and \u03c3 = 30. If we take samples of n = 4, what is the sampling distribution of x\u0304?",
    correctAnswer: "Exactly normal with mean 200 and SD = 30/\u221a4 = 15, because the population is normal",
    wrongOptions: [
      "Not enough information \u2014 n = 4 is too small for the CLT to apply",
      "Approximately normal with mean 200 and SD = 30, same as the population",
      "Right-skewed because small samples always produce skewed sampling distributions"
    ],
    explanation: "When the population is normal, the sampling distribution of x\u0304 is exactly normal for ANY sample size. Mean = 200, SD = 30/\u221a4 = 15. The CLT's n \u2265 30 rule is only needed for non-normal populations.",
    topicId: "5.3: CLT Concepts"
  },
  {
    scenarioText: "A researcher creates a randomization distribution by reassigning 20 experimental response values to two groups of 10. Each point in the distribution represents:",
    correctAnswer: "The difference in means between the two groups after one random reassignment of the 20 values",
    wrongOptions: [
      "One individual data point from the original experiment",
      "The mean of a random sample from the population",
      "The standard deviation of one randomly assigned group"
    ],
    explanation: "Each point in a randomization distribution is a statistic (difference in means) calculated from one random reassignment of the existing data values to the treatment groups.",
    topicId: "5.3: Randomization Concept"
  },
  {
    scenarioText: "Two experiments test different treatments. Experiment A has p-value = 0.003 and Experiment B has p-value = 0.34. Which provides stronger evidence of a treatment effect?",
    correctAnswer: "Experiment A \u2014 its smaller p-value means the observed result was very unlikely under chance alone",
    wrongOptions: [
      "Experiment B \u2014 its larger p-value means the treatment had a bigger effect",
      "Both provide equal evidence since both ran randomized experiments",
      "Neither provides evidence \u2014 p-values only measure sample size, not treatment effect"
    ],
    explanation: "Smaller p-values indicate stronger evidence against chance. P = 0.003 means only 0.3% of random reassignments matched the result, while P = 0.34 means 34% did \u2014 so Experiment A provides much stronger evidence.",
    topicId: "5.3: Randomization Interpretation"
  },
  {
    scenarioText: "An exponential (strongly right-skewed) population has \u03bc = 10 and \u03c3 = 10. Samples of size n = 5 are taken repeatedly. The sampling distribution of x\u0304 will be:",
    correctAnswer: "Right-skewed \u2014 the population is strongly non-normal and n = 5 is too small for the CLT",
    wrongOptions: [
      "Approximately normal because the CLT applies to all sample sizes",
      "Exactly normal because sampling distributions are always normal",
      "Uniform because exponential populations produce flat sampling distributions"
    ],
    explanation: "The population is strongly right-skewed and n = 5 is far too small for the CLT (need n \u2265 30 for strongly non-normal populations). The sampling distribution will still show right skew.",
    topicId: "5.3: CLT Application"
  },
  {
    scenarioText: "Why does a randomization distribution help us determine whether an experimental result is due to the treatment rather than chance?",
    correctAnswer: "It shows what differences we would expect from chance alone, so we can see if the observed difference is unusually large",
    wrongOptions: [
      "It removes all random variation from the data so we can see the true effect",
      "It increases the sample size by creating simulated data points",
      "It proves that the random assignment in the experiment was done correctly"
    ],
    explanation: "A randomization distribution simulates what would happen under chance alone (no treatment effect). If the observed result falls in the extreme tail, it's unlikely to be due to chance, suggesting a real treatment effect.",
    topicId: "5.3: Randomization Concept"
  },
  {
    scenarioText: "As sample size increases from n = 10 to n = 40, the sampling distribution of x\u0304 from a skewed population will:",
    correctAnswer: "Become more approximately normal and narrower (less spread), with the same center \u03bc",
    wrongOptions: [
      "Stay the same shape but shift its center closer to the population mean",
      "Become wider because larger samples capture more of the population's variability",
      "Become more skewed because larger samples better reflect the skewed population"
    ],
    explanation: "The CLT tells us the sampling distribution becomes more normal as n increases. Also, SD = \u03c3/\u221an decreases as n increases, making it narrower. The center stays at \u03bc regardless of n.",
    topicId: "5.3: CLT Concepts"
  },
  {
    scenarioText: "A researcher observes a difference of 2.5 between treatment and control groups. The randomization distribution shows that 280 out of 1000 random reassignments produced a difference of 2.5 or greater. The researcher concludes there is strong evidence of a treatment effect. Is this correct?",
    correctAnswer: "No \u2014 with p-value = 0.28, the observed difference could easily happen by chance, so there is not convincing evidence",
    wrongOptions: [
      "Yes \u2014 280 reassignments is a large number, confirming the treatment effect",
      "Yes \u2014 any observed difference greater than 0 is evidence of a treatment effect",
      "No \u2014 but only because the difference of 2.5 is too small to be meaningful"
    ],
    explanation: "P-value = 280/1000 = 0.28, meaning 28% of chance-alone reassignments produced a difference this large. Since this is not a small probability, the observed result could plausibly be due to chance \u2014 not convincing evidence.",
    topicId: "5.3: Randomization Interpretation"
  },
  {
    scenarioText: "A sampling distribution can be simulated by generating repeated random samples from a population. What is the key difference between this and a randomization distribution?",
    correctAnswer: "A sampling distribution draws new samples from a population; a randomization distribution reshuffles existing experimental data between groups",
    wrongOptions: [
      "A sampling distribution requires normally distributed data; a randomization distribution does not",
      "A randomization distribution uses larger sample sizes than a sampling distribution",
      "They are identical \u2014 both involve taking repeated samples from a population"
    ],
    explanation: "Sampling distributions come from repeated random samples from a population (studying a parameter). Randomization distributions come from reshuffling existing experimental data (testing if a treatment effect is real).",
    topicId: "5.3: CLT vs Randomization"
  }
];


// ---- L16: Point Estimate Terminology scenarios ----
const pointEstimateTermBank = [
  {
    question: "A researcher surveys 200 adults and finds the sample mean income is $52,400. In this context, the value $52,400 is called:",
    correctAnswer: "A point estimate — the specific numerical value of the sample statistic",
    wrongOptions: [
      "A parameter — the true value of the population",
      "A point estimator — the formula or method used to estimate",
      "A sampling distribution — the distribution of all possible estimates"
    ]
  },
  {
    question: "A researcher uses the sample mean (x̄) to estimate the population mean income. In this context, x̄ is called:",
    correctAnswer: "A point estimator — the statistic used to estimate the parameter",
    wrongOptions: [
      "A point estimate — the specific numerical value",
      "A population parameter — the true value we're estimating",
      "A sampling error — the difference between the estimate and parameter"
    ]
  },
  {
    question: "In a sample of 150 voters, 63% support a candidate. The sample proportion p̂ = 0.63 estimates the population proportion p. Which statement is correct?",
    correctAnswer: "p̂ is the point estimator and 0.63 is the point estimate",
    wrongOptions: [
      "p is the point estimator and 0.63 is the point estimate",
      "0.63 is the point estimator and p̂ is the point estimate",
      "p̂ is the point estimate and p is the point estimator"
    ]
  },
  {
    question: "A sample statistic is a point estimator of the corresponding population parameter. Which pair is correctly matched?",
    correctAnswer: "x̄ (sample mean) estimates μ (population mean)",
    wrongOptions: [
      "x̄ (sample mean) estimates σ (population standard deviation)",
      "s (sample standard deviation) estimates μ (population mean)",
      "p̂ (sample proportion) estimates σ (population standard deviation)"
    ]
  },
  {
    question: "What is the key difference between a point estimator and a point estimate?",
    correctAnswer: "A point estimator is the statistic (formula/method), while a point estimate is the specific value calculated from one sample",
    wrongOptions: [
      "A point estimator is always unbiased, while a point estimate can be biased",
      "A point estimator comes from the population, while a point estimate comes from a sample",
      "A point estimator is exact, while a point estimate is always approximate"
    ]
  },
  {
    question: "A teacher measures the heights of 30 students and calculates s = 3.2 inches. Which statement is correct?",
    correctAnswer: "s is the point estimator of σ, and 3.2 inches is the point estimate",
    wrongOptions: [
      "3.2 inches is the population standard deviation σ",
      "s estimates the population mean μ, not the standard deviation",
      "3.2 inches is the sampling distribution of the standard deviation"
    ]
  },
  {
    question: "When estimating a population parameter, an estimator exhibits variability. This means:",
    correctAnswer: "Different samples produce different values of the estimator, and this variability can be modeled using probability",
    wrongOptions: [
      "The estimator is unreliable and should not be used for inference",
      "The population parameter itself changes from sample to sample",
      "We need to eliminate all variability before using the estimator"
    ]
  },
  {
    question: "A biologist takes a sample of 40 fish and calculates the sample median length as 24.5 cm to estimate the population median. Here, the sample median is:",
    correctAnswer: "A point estimator — a sample statistic used to estimate the corresponding population parameter",
    wrongOptions: [
      "A population parameter that describes all fish in the lake",
      "A sampling distribution of the median",
      "A confidence interval for the population median"
    ]
  },
  {
    question: "Why is a sample statistic called a 'point' estimator?",
    correctAnswer: "Because it provides a single value (point) as the estimate of the population parameter",
    wrongOptions: [
      "Because it only works when plotted on a graph as a point",
      "Because it must be computed at a specific point in time",
      "Because it is always located at the center of the sampling distribution"
    ]
  }
];

// ---- L17: Estimator Bias Concepts scenarios ----
const estimatorBiasConceptBank = [
  {
    question: "An estimator is unbiased if:",
    correctAnswer: "On average, the value of the estimator equals the population parameter",
    wrongOptions: [
      "Every sample produces an estimate exactly equal to the parameter",
      "The estimator has no variability across samples",
      "The sample size is large enough (n ≥ 30)"
    ]
  },
  {
    question: "The sample mean (x̄) is an unbiased estimator of the population mean (μ). This means:",
    correctAnswer: "If we took all possible samples of the same size, the average of all the x̄ values would equal μ",
    wrongOptions: [
      "Every sample mean will be exactly equal to μ",
      "The sample mean gets closer to μ as we collect more samples",
      "The sample mean always has less variability than the population"
    ]
  },
  {
    question: "A breeder has 5 dogs with ages 0, 2, 5, 8, 10 (μ = 5). All possible samples of size 3 are taken, and the mean of all sample means is 5. This shows that:",
    correctAnswer: "The sample mean is an unbiased estimator of the population mean because the mean of the sampling distribution equals μ",
    wrongOptions: [
      "Every sample of 3 dogs will have a mean of 5",
      "The sample mean is biased because individual sample means differ from 5",
      "We need more dogs in the population to determine if the estimator is unbiased"
    ]
  },
  {
    question: "For the same 5 dogs (ages 0, 2, 5, 8, 10, range = 10), the mean of all possible sample ranges is 7.8. This means the sample range is:",
    correctAnswer: "A biased estimator of the population range because 7.8 ≠ 10 (the mean of the estimator doesn't equal the parameter)",
    wrongOptions: [
      "An unbiased estimator because 7.8 is close to 10",
      "Unbiased because ranges can never be negative",
      "Neither biased nor unbiased — we need more data to decide"
    ]
  },
  {
    question: "If an estimator is biased, it means that:",
    correctAnswer: "On average, the estimator systematically overestimates or underestimates the population parameter",
    wrongOptions: [
      "The researcher made an error in data collection",
      "The sample was not randomly selected",
      "The estimator will never give a value close to the parameter"
    ]
  },
  {
    question: "Which of the following is TRUE about biased estimators?",
    correctAnswer: "A biased estimator can still give a value close to the parameter for any individual sample — but on average, it misses",
    wrongOptions: [
      "A biased estimator always gives a value far from the parameter",
      "Biased estimators can be fixed by increasing the sample size",
      "Bias only occurs when the sample is not random"
    ]
  },
  {
    question: "The sample range consistently underestimates the population range. This is because:",
    correctAnswer: "A sample cannot contain values outside the population's range, so sample ranges tend to be ≤ the population range",
    wrongOptions: [
      "Sample ranges are always exactly half of the population range",
      "The range formula is incorrect for samples",
      "Samples always miss the extreme values because of measurement error"
    ]
  },
  {
    question: "To determine if an estimator is unbiased, you would need to:",
    correctAnswer: "Find the mean of the sampling distribution of the estimator and check if it equals the population parameter",
    wrongOptions: [
      "Calculate the estimator from one very large sample",
      "Compare the estimator to a different statistic from the same sample",
      "Check if the estimator has a normal distribution"
    ]
  },
  {
    question: "Which of these sample statistics is an unbiased estimator of its corresponding population parameter?",
    correctAnswer: "The sample mean x̄ is an unbiased estimator of the population mean μ",
    wrongOptions: [
      "The sample range is an unbiased estimator of the population range",
      "The sample maximum is an unbiased estimator of the population maximum",
      "The sample minimum is an unbiased estimator of the population minimum"
    ]
  },
  {
    question: "A student says: 'My sample mean is 72 but the population mean is 70, so x̄ must be a biased estimator.' Is this correct?",
    correctAnswer: "No — a single estimate not equaling the parameter is expected due to sampling variability; bias refers to the average across ALL possible samples",
    wrongOptions: [
      "Yes — since 72 ≠ 70, the estimator is clearly biased",
      "Yes — any difference between the estimate and parameter indicates bias",
      "No — but only because the difference is less than 5"
    ]
  }
];

// ---- L18: Identify Bias scenarios ----
const identifyBiasBank = [
  {
    desc: "A population of 4 values: {2, 4, 6, 8} has a population mean μ = 5. All possible samples of size 2 are taken, and the mean of all sample means is calculated to be 5.0.",
    estimatorName: "sample mean",
    parameterName: "population mean",
    parameterValue: 5,
    samplingDistMean: 5,
    isUnbiased: true,
    reason: "The sample mean is unbiased because the mean of the sampling distribution (5.0) equals the population mean (μ = 5). On average, x̄ = μ.",
    givenInfo: "Population: {2, 4, 6, 8}, μ = 5 | Mean of all sample means = 5.0"
  },
  {
    desc: "A population of 4 values: {2, 4, 6, 8} has a population range of 6. All possible samples of size 2 are taken, and the mean of all sample ranges is calculated to be 4.0.",
    estimatorName: "sample range",
    parameterName: "population range",
    parameterValue: 6,
    samplingDistMean: 4,
    isUnbiased: false,
    reason: "The sample range is biased because the mean of the sampling distribution (4.0) does not equal the population range (6). On average, the sample range underestimates the population range.",
    givenInfo: "Population: {2, 4, 6, 8}, Range = 6 | Mean of all sample ranges = 4.0"
  },
  {
    desc: "A population of 5 dogs has ages {0, 2, 5, 8, 10} with μ = 5. All possible samples of size 3 are taken. The mean of all sample means is 5.0.",
    estimatorName: "sample mean",
    parameterName: "population mean",
    parameterValue: 5,
    samplingDistMean: 5,
    isUnbiased: true,
    reason: "The sample mean is unbiased because the mean of all sample means (5.0) equals the population mean (μ = 5). This is always true for the sample mean: μ_x̄ = μ.",
    givenInfo: "Population: {0, 2, 5, 8, 10}, μ = 5 | Mean of all sample means = 5.0"
  },
  {
    desc: "A population of 5 dogs has ages {0, 2, 5, 8, 10} with a population range of 10. All possible samples of size 3 are taken. The mean of all sample ranges is 7.8.",
    estimatorName: "sample range",
    parameterName: "population range",
    parameterValue: 10,
    samplingDistMean: 7.8,
    isUnbiased: false,
    reason: "The sample range is biased because the mean of all sample ranges (7.8) does not equal the population range (10). The sample range systematically underestimates the population range because samples cannot contain values outside the population's extremes.",
    givenInfo: "Population: {0, 2, 5, 8, 10}, Range = 10 | Mean of all sample ranges = 7.8"
  },
  {
    desc: "A population has a proportion p = 0.4. A statistician takes all possible samples of size 50 and calculates p̂ for each. The mean of all sample proportions is 0.4.",
    estimatorName: "sample proportion",
    parameterName: "population proportion",
    parameterValue: 0.4,
    samplingDistMean: 0.4,
    isUnbiased: true,
    reason: "The sample proportion p̂ is unbiased because the mean of the sampling distribution (0.4) equals the population proportion (p = 0.4). On average, p̂ = p.",
    givenInfo: "Population: p = 0.4 | Mean of all sample proportions = 0.4"
  },
  {
    desc: "A population of 4 values: {1, 3, 5, 7} has a population maximum of 7. All possible samples of size 2 are taken. The mean of all sample maximums is 5.67.",
    estimatorName: "sample maximum",
    parameterName: "population maximum",
    parameterValue: 7,
    samplingDistMean: 5.67,
    isUnbiased: false,
    reason: "The sample maximum is biased because the mean of all sample maximums (5.67) does not equal the population maximum (7). The sample maximum systematically underestimates the population maximum because most samples don't contain the largest value.",
    givenInfo: "Population: {1, 3, 5, 7}, Max = 7 | Mean of all sample maximums = 5.67"
  },
  {
    desc: "A population of 6 values: {10, 20, 30, 40, 50, 60} has a population mean μ = 35. All possible samples of size 3 are taken. The mean of all sample means is 35.0.",
    estimatorName: "sample mean",
    parameterName: "population mean",
    parameterValue: 35,
    samplingDistMean: 35,
    isUnbiased: true,
    reason: "The sample mean is unbiased because the mean of the sampling distribution (35.0) equals the population mean (μ = 35). The sample mean is always an unbiased estimator of μ.",
    givenInfo: "Population: {10, 20, 30, 40, 50, 60}, μ = 35 | Mean of all sample means = 35.0"
  },
  {
    desc: "A population of 5 values: {1, 2, 3, 4, 5} has a population minimum of 1. All possible samples of size 3 are taken. The mean of all sample minimums is 1.5.",
    estimatorName: "sample minimum",
    parameterName: "population minimum",
    parameterValue: 1,
    samplingDistMean: 1.5,
    isUnbiased: false,
    reason: "The sample minimum is biased because the mean of all sample minimums (1.5) does not equal the population minimum (1). The sample minimum systematically overestimates the population minimum because most samples don't contain the smallest value.",
    givenInfo: "Population: {1, 2, 3, 4, 5}, Min = 1 | Mean of all sample minimums = 1.5"
  },
  {
    desc: "A population of 6 values has a median of 25. All possible samples of size 4 are taken from this symmetric population. The mean of all sample medians is 25.0.",
    estimatorName: "sample median",
    parameterName: "population median",
    parameterValue: 25,
    samplingDistMean: 25,
    isUnbiased: true,
    reason: "The sample median is unbiased in this case because the mean of the sampling distribution (25.0) equals the population median (25). Note: the sample median is unbiased for symmetric populations.",
    givenInfo: "Population median = 25 (symmetric pop.) | Mean of all sample medians = 25.0"
  },
  {
    desc: "A population of 5 values: {2, 4, 6, 8, 10} has a population variance σ² = 8. All possible samples of size 3 are taken. The mean of all sample variances (using n in the denominator) is 5.33.",
    estimatorName: "sample variance (using n)",
    parameterName: "population variance",
    parameterValue: 8,
    samplingDistMean: 5.33,
    isUnbiased: false,
    reason: "The sample variance using n in the denominator is biased because 5.33 ≠ 8. It systematically underestimates σ². This is why statisticians use (n-1) in the denominator — the corrected version s² with (n-1) is unbiased.",
    givenInfo: "Population: {2, 4, 6, 8, 10}, σ² = 8 | Mean of sample variances (÷n) = 5.33"
  }
];

// ---- L19: 5.4 Capstone scenarios ----
const capstone54Bank = [
  {
    scenarioText: "A researcher collects a sample of 100 patients and calculates x̄ = 128 mmHg for systolic blood pressure. The population mean is μ = 125 mmHg. Does this prove the sample mean is a biased estimator?",
    correctAnswer: "No — one sample mean differing from μ is expected due to sampling variability; bias is about the average across ALL possible samples",
    wrongOptions: [
      "Yes — since 128 ≠ 125, the estimator is clearly biased by 3 mmHg",
      "Yes — the sample mean is always biased when it doesn't equal the parameter",
      "It depends on the sample size — with n = 100, any difference indicates bias"
    ],
    explanation: "A single sample mean not equaling μ is expected due to sampling variability. Bias refers to a systematic tendency across ALL possible samples. The sample mean is always unbiased: μ_x̄ = μ.",
    topicId: "5.4: Unbiased Estimators"
  },
  {
    scenarioText: "A data analyst calculates the sample median from 50 observations to be 42. In this scenario, '42' is called:",
    correctAnswer: "A point estimate — the specific numerical value obtained from this sample",
    wrongOptions: [
      "A point estimator — the method used to estimate the parameter",
      "A population parameter — the true value being estimated",
      "A sampling distribution — the collection of all possible medians"
    ],
    explanation: "The number 42 is the point estimate — the specific value. The sample median (as a statistic/method) is the point estimator. The population median is the parameter being estimated.",
    topicId: "5.4: Point Estimates"
  },
  {
    scenarioText: "For a population of {3, 5, 7, 9}, the population range is 6. All possible samples of size 2 yield sample ranges with a mean of 4. Is the sample range biased or unbiased?",
    correctAnswer: "Biased — the mean of all sample ranges (4) does not equal the population range (6); it systematically underestimates",
    wrongOptions: [
      "Unbiased — because 4 is close enough to 6",
      "Unbiased — because the range is always a valid statistic",
      "Cannot determine — we need larger samples to assess bias"
    ],
    explanation: "The sample range is biased because the mean of the sampling distribution (4) ≠ the population range (6). Since 4 < 6, the sample range systematically underestimates the population range.",
    topicId: "5.4: Biased Estimators"
  },
  {
    scenarioText: "The sample proportion p̂ is an unbiased estimator of the population proportion p. If p = 0.35 and we take all possible samples of size n, this means:",
    correctAnswer: "The mean of all possible p̂ values equals 0.35, though individual sample proportions will vary around this value",
    wrongOptions: [
      "Every sample will produce p̂ = 0.35 exactly",
      "At least 35% of all samples will have p̂ > 0.35",
      "The sample proportion will always be within 0.05 of 0.35"
    ],
    explanation: "Unbiased means the average (expected value) of the estimator equals the parameter: μ_p̂ = p = 0.35. Individual sample proportions will vary due to sampling variability, but on average they equal p.",
    topicId: "5.4: Unbiased Estimators"
  },
  {
    scenarioText: "A student is asked to estimate the average commute time for all employees. They survey 40 employees and find x̄ = 27.5 minutes. Which correctly identifies the point estimator and point estimate?",
    correctAnswer: "Point estimator: x̄ (the sample mean); Point estimate: 27.5 minutes",
    wrongOptions: [
      "Point estimator: 27.5 minutes; Point estimate: x̄",
      "Point estimator: μ (population mean); Point estimate: 27.5 minutes",
      "Point estimator: 40 (the sample size); Point estimate: x̄"
    ],
    explanation: "The point estimator is the statistic/method (x̄, the sample mean). The point estimate is the specific value obtained from this sample (27.5 minutes). The parameter being estimated is μ.",
    topicId: "5.4: Point Estimates"
  },
  {
    scenarioText: "Why does the sample range tend to underestimate the population range?",
    correctAnswer: "Samples rarely include both the maximum and minimum values of the population, so sample ranges are limited to be ≤ the population range",
    wrongOptions: [
      "The range formula is different for samples and populations",
      "Random sampling always excludes the most extreme values",
      "The sample range is unbiased — it does not underestimate"
    ],
    explanation: "A sample can only contain values within the population's range, so the sample range can never exceed the population range. Since it often doesn't include both extremes, it tends to be smaller.",
    topicId: "5.4: Biased Estimators"
  },
  {
    scenarioText: "An estimator exhibits variability that can be modeled using probability. What does this mean in practice?",
    correctAnswer: "Different random samples give different values for the estimator, but the pattern of values follows a predictable probability distribution",
    wrongOptions: [
      "The estimator's value is completely unpredictable and follows no pattern",
      "The estimator will converge to the exact parameter value with enough samples",
      "The variability means the estimator is biased and unreliable"
    ],
    explanation: "Estimator variability means values change from sample to sample, but this variation follows a predictable pattern (the sampling distribution). This is the foundation for statistical inference.",
    topicId: "5.4: Estimator Variability"
  },
  {
    scenarioText: "A statistician wants to determine if the sample median is an unbiased estimator of the population median for a particular population. What process should they use?",
    correctAnswer: "Find all possible samples (or simulate many), calculate the median of each, then check if the mean of all sample medians equals the population median",
    wrongOptions: [
      "Take one large sample and check if the sample median equals the population median",
      "Compare the sample median to the sample mean — if they're close, the median is unbiased",
      "Check if the population is normally distributed — if so, the median is unbiased"
    ],
    explanation: "To assess bias, you must examine the sampling distribution. Find the mean of the sampling distribution of the statistic and compare it to the population parameter. If they're equal, the estimator is unbiased.",
    topicId: "5.4: Unbiased Estimators"
  },
  {
    scenarioText: "For a population of {1, 3, 5, 7, 9}, μ = 5. A researcher uses the sample maximum to estimate μ. All possible samples of size 2 are taken, and the mean of all sample maximums is 6.6. Is the sample maximum an unbiased estimator of μ?",
    correctAnswer: "No — the mean of the sampling distribution (6.6) does not equal μ (5), so the sample maximum is a biased estimator of μ",
    wrongOptions: [
      "Yes — the sample maximum is always an unbiased estimator",
      "No — but only because the sample size is too small at n = 2",
      "Yes — because 6.6 is within one standard deviation of 5"
    ],
    explanation: "The sample maximum is biased as an estimator of μ because the mean of its sampling distribution (6.6) ≠ μ (5). It systematically overestimates μ. Being within one SD is irrelevant to bias assessment.",
    topicId: "5.4: Biased Estimators"
  },
  {
    scenarioText: "Two statistics are proposed to estimate a population parameter. Estimator A is unbiased with large variability. Estimator B is slightly biased but has much less variability. Which is necessarily better?",
    correctAnswer: "Neither is necessarily better — unbiasedness and low variability are both desirable, and the best choice depends on the context",
    wrongOptions: [
      "Estimator A is always better because unbiasedness is the most important property",
      "Estimator B is always better because low variability means more precise estimates",
      "Both are equally bad because neither is both unbiased and low-variability"
    ],
    explanation: "Unbiasedness (hitting the target on average) and low variability (hitting close together) are both important properties. Sometimes a slightly biased estimator with much less variability can perform better overall.",
    topicId: "5.4: Estimator Properties"
  }
];


// ============ TOPIC 5.5 BANKS: Sampling Distributions for Sample Proportions ============

const propContextBank = [
  { label: "driver's license", context: "In a large city, 82% of adults have a valid driver's license", p: 0.82, n: 60, N: 250000 },
  { label: "defective items", context: "A factory produces light bulbs, and historically 4% are defective", p: 0.04, n: 200, N: 50000 },
  { label: "left-handed", context: "About 10% of the general population is left-handed", p: 0.10, n: 80, N: 100000 },
  { label: "pet owners", context: "In a suburban community, 67% of households own at least one pet", p: 0.67, n: 50, N: 15000 },
  { label: "college graduates", context: "In a state, 34% of adults aged 25+ have a bachelor's degree or higher", p: 0.34, n: 120, N: 500000 },
  { label: "flu vaccination", context: "Last year, 52% of adults in a county received a flu vaccination", p: 0.52, n: 90, N: 200000 },
  { label: "smartphone usage", context: "Among teenagers in a school district, 95% own a smartphone", p: 0.95, n: 40, N: 8000 },
  { label: "organic food", context: "About 15% of shoppers at a grocery chain regularly buy organic produce", p: 0.15, n: 150, N: 300000 },
  { label: "public transit", context: "In a metropolitan area, 28% of workers commute by public transit", p: 0.28, n: 100, N: 400000 },
  { label: "early bird", context: "A survey found that 44% of adults consider themselves 'morning people'", p: 0.44, n: 75, N: 1000000 }
];

const largeCountsBank = [
  { context: "A company claims 3% of its products are defective. A quality inspector randomly selects 150 products.", p: 0.03, n: 150, meetsCondition: false },
  { context: "A political poll asks 500 randomly selected voters if they support a candidate who has 55% approval.", p: 0.55, n: 500, meetsCondition: true },
  { context: "A rare blood type occurs in 2% of the population. A blood bank screens 80 donors.", p: 0.02, n: 80, meetsCondition: false },
  { context: "About 70% of high school seniors plan to attend college. A counselor surveys 60 seniors.", p: 0.70, n: 60, meetsCondition: true },
  { context: "A website has a 12% click-through rate on ads. An analyst examines 200 ad impressions.", p: 0.12, n: 200, meetsCondition: true },
  { context: "Only 1% of emails sent by a company are opened. They analyze a batch of 300 emails.", p: 0.01, n: 300, meetsCondition: false },
  { context: "In a large city, 40% of residents recycle regularly. An environmental group surveys 50 residents.", p: 0.40, n: 50, meetsCondition: true },
  { context: "A genetic trait appears in 8% of a population. A researcher samples 90 individuals.", p: 0.08, n: 90, meetsCondition: false },
  { context: "About 60% of dog owners buy premium dog food. A pet store surveys 80 customers.", p: 0.60, n: 80, meetsCondition: true },
  { context: "A vaccine has a 97% effectiveness rate. Researchers study a sample of 250 vaccinated individuals.", p: 0.97, n: 250, meetsCondition: false }
];

const interpretParamsBank = [
  {
    context: "72% of residents in a city support a new park. Random samples of 100 residents are taken.",
    p: 0.72, n: 100, paramType: "mean",
    correctInterpretation: "The mean of the sampling distribution of p̂ is 0.72, meaning that across all possible samples of 100 residents, the average sample proportion who support the park is 0.72",
    wrongInterpretations: [
      "In every sample of 100 residents, exactly 72% will support the park",
      "The mean of p̂ is 0.72, meaning 72 out of 100 residents in our sample support the park",
      "The population proportion will be 0.72 in 72% of all samples"
    ]
  },
  {
    context: "15% of students at a university are international students. Random samples of 80 students are taken.",
    p: 0.15, n: 80, paramType: "sd",
    correctInterpretation: "σ_p̂ = 0.040, meaning the sample proportion of international students typically varies by about 0.040 from the true proportion of 0.15 across all possible samples of 80 students",
    wrongInterpretations: [
      "The standard deviation is 0.040, meaning exactly 4% of samples will differ from 15%",
      "σ_p̂ = 0.040 means 4% of international students vary in each sample",
      "The standard deviation of 0.040 means p̂ is always within 0.040 of the true proportion"
    ]
  },
  {
    context: "40% of adults in a county exercise regularly. Random samples of 200 adults are taken.",
    p: 0.40, n: 200, paramType: "mean",
    correctInterpretation: "μ_p̂ = 0.40, meaning that if we took all possible samples of 200 adults from this county, the average of all sample proportions who exercise regularly would be 0.40",
    wrongInterpretations: [
      "μ_p̂ = 0.40 means our sample will always have exactly 40% who exercise",
      "The mean is 0.40 because 80 out of 200 adults in our sample exercise regularly",
      "μ_p̂ = 0.40 means the population proportion changes to 0.40 after sampling"
    ]
  },
  {
    context: "88% of flights at an airport depart on time. Random samples of 50 flights are monitored.",
    p: 0.88, n: 50, paramType: "sd",
    correctInterpretation: "σ_p̂ ≈ 0.046, meaning the sample proportion of on-time flights typically differs from the true proportion of 0.88 by about 0.046 across all possible samples of 50 flights",
    wrongInterpretations: [
      "σ_p̂ = 0.046 means each flight has a 4.6% chance of being late",
      "The standard deviation of 0.046 means exactly 4.6% of flights are always late",
      "σ_p̂ = 0.046 means p̂ will always be between 0.834 and 0.926"
    ]
  },
  {
    context: "55% of voters in a state support a ballot measure. Random samples of 300 voters are polled.",
    p: 0.55, n: 300, paramType: "mean",
    correctInterpretation: "μ_p̂ = 0.55, meaning that across all possible random samples of 300 voters, the average sample proportion supporting the measure equals the true population proportion of 0.55",
    wrongInterpretations: [
      "μ_p̂ = 0.55 means exactly 165 voters in every sample of 300 will support the measure",
      "The mean proportion is 0.55 because that was the result of our specific sample",
      "μ_p̂ = 0.55 means the ballot measure will pass with 55% of the vote"
    ]
  },
  {
    context: "25% of packages shipped by a company arrive within one day. Random samples of 120 packages are tracked.",
    p: 0.25, n: 120, paramType: "sd",
    correctInterpretation: "σ_p̂ ≈ 0.040, meaning the sample proportion of one-day deliveries typically varies by about 0.040 from the true proportion of 0.25 across all possible samples of 120 packages",
    wrongInterpretations: [
      "σ_p̂ = 0.040 means 4% of packages are always delivered late",
      "The standard deviation of 0.040 means p̂ is always exactly 0.040 away from p",
      "σ_p̂ = 0.040 means there is a 4% chance of getting the wrong proportion"
    ]
  },
  {
    context: "63% of homeowners in a suburb have a two-car garage. Random samples of 90 homeowners are surveyed.",
    p: 0.63, n: 90, paramType: "mean",
    correctInterpretation: "μ_p̂ = 0.63, meaning that the average of the sample proportions from all possible samples of 90 homeowners equals the population proportion of 0.63 — p̂ is an unbiased estimator of p",
    wrongInterpretations: [
      "μ_p̂ = 0.63 means our specific sample will have exactly 63% with two-car garages",
      "The mean is 0.63 because we surveyed 90 homeowners and found 63% in our sample",
      "μ_p̂ = 0.63 means 63% of all possible samples will give the correct proportion"
    ]
  },
  {
    context: "About 30% of trees in a national forest are pine trees. Random samples of 150 trees are measured.",
    p: 0.30, n: 150, paramType: "sd",
    correctInterpretation: "σ_p̂ ≈ 0.037, meaning on average, the sample proportion of pine trees differs from the true proportion of 0.30 by about 0.037 across all possible samples of 150 trees",
    wrongInterpretations: [
      "σ_p̂ = 0.037 means 3.7% of the trees in our sample will not be pine trees",
      "The standard deviation means p̂ is guaranteed to be within 0.037 of 0.30",
      "σ_p̂ = 0.037 means the population proportion varies by 3.7%"
    ]
  },
  {
    context: "48% of registered voters in a district are female. Random samples of 250 voters are selected.",
    p: 0.48, n: 250, paramType: "mean",
    correctInterpretation: "μ_p̂ = 0.48, meaning that if we took all possible random samples of 250 voters from this district, the mean of all sample proportions of female voters would equal the true population proportion of 0.48",
    wrongInterpretations: [
      "μ_p̂ = 0.48 means exactly 120 female voters will appear in every sample of 250",
      "The mean is 0.48 because that is what we observed in our specific sample",
      "μ_p̂ = 0.48 means the sampling distribution is centered at the sample proportion, not the population proportion"
    ]
  }
];

const capstone55Bank = [
  {
    scenarioText: "In a large population, 35% of adults have type O+ blood. A blood bank takes a random sample of 200 donors. What are the mean and standard deviation of the sampling distribution of p̂?",
    correctAnswer: "μ_p̂ = 0.35, σ_p̂ = √(0.35 × 0.65 / 200) ≈ 0.034",
    wrongOptions: [
      "μ_p̂ = 0.35, σ_p̂ = √(0.35 × 0.65) ≈ 0.477 (forgot to divide by n)",
      "μ_p̂ = 70, σ_p̂ = 6.75 (used counts instead of proportions)",
      "μ_p̂ = 0.65, σ_p̂ = 0.034 (used 1−p for the mean)"
    ],
    explanation: "μ_p̂ = p = 0.35. σ_p̂ = √(p(1−p)/n) = √(0.35 × 0.65 / 200) = √(0.001138) ≈ 0.034. The 10% condition is met since 200 < 10% of the large population.",
    topicId: "5.5: Distribution Parameters"
  },
  {
    scenarioText: "A factory knows that 3% of its products are defective. A quality inspector takes a random sample of 150 items. Can we use a normal model for the sampling distribution of p̂?",
    correctAnswer: "No — np = 150(0.03) = 4.5 < 10, so the Large Counts condition is not met",
    wrongOptions: [
      "Yes — n = 150 is large enough for any proportion",
      "Yes — n(1−p) = 145.5 ≥ 10 is sufficient on its own",
      "No — but only because n = 150 is too small (need n ≥ 200)"
    ],
    explanation: "Large Counts requires BOTH np ≥ 10 AND n(1−p) ≥ 10. Here np = 150(0.03) = 4.5 < 10. Even though n(1−p) = 145.5, the condition fails because np < 10.",
    topicId: "5.5: Large Counts Condition"
  },
  {
    scenarioText: "60% of students at a large university live off campus. In random samples of 80 students, the sampling distribution of p̂ has σ_p̂ ≈ 0.055. Which interpretation is correct?",
    correctAnswer: "The sample proportion of off-campus students typically varies by about 0.055 from the true proportion of 0.60 across all possible samples of 80 students",
    wrongOptions: [
      "Exactly 5.5% of students in each sample will live in a different location than expected",
      "The population proportion changes by 0.055 each time we sample",
      "The sample proportion will always be between 0.545 and 0.655"
    ],
    explanation: "σ_p̂ measures how much p̂ typically varies from p across all possible samples. It does NOT mean p̂ is always within one SD of p — 'typically' or 'on average' is the key language.",
    topicId: "5.5: Interpreting Parameters"
  },
  {
    scenarioText: "A political analyst knows that 52% of voters support a candidate. In a random sample of 400 voters, what is the probability that the sample proportion exceeds 0.55?",
    correctAnswer: "About 0.115 — z = (0.55 − 0.52) / 0.025 = 1.2, P(Z > 1.2) ≈ 0.115",
    wrongOptions: [
      "About 0.885 — this is P(Z < 1.2), the wrong direction",
      "About 0.55 — the probability equals the sample proportion",
      "Cannot be calculated without knowing the population size"
    ],
    explanation: "σ_p̂ = √(0.52 × 0.48 / 400) = √(0.000624) ≈ 0.025. z = (0.55 − 0.52)/0.025 = 1.2. P(p̂ > 0.55) = P(Z > 1.2) = 1 − 0.8849 ≈ 0.115.",
    topicId: "5.5: Probability Calculation"
  },
  {
    scenarioText: "Why is the 10% condition (n < 0.10N) important when calculating σ_p̂?",
    correctAnswer: "It ensures that sampling without replacement is approximately the same as sampling with replacement, so the formula σ_p̂ = √(p(1−p)/n) is valid",
    wrongOptions: [
      "It ensures the sample proportion will be within 10% of the population proportion",
      "It guarantees that the sampling distribution will be approximately normal",
      "It prevents the sample size from being too large for the normal approximation"
    ],
    explanation: "The 10% condition ensures independence (approximately). When n < 10% of N, removing sampled individuals doesn't meaningfully change the population composition, so the SD formula applies.",
    topicId: "5.5: 10% Condition"
  },
  {
    scenarioText: "A researcher finds that p̂ = 0.42 in a sample of 200 from a population where p = 0.45. The sampling distribution of p̂ has σ_p̂ ≈ 0.035. What is the z-score for this sample result?",
    correctAnswer: "z = (0.42 − 0.45) / 0.035 ≈ −0.86",
    wrongOptions: [
      "z = (0.45 − 0.42) / 0.035 ≈ 0.86 (subtracted in wrong order)",
      "z = (0.42 − 0.45) / 0.45 ≈ −0.067 (divided by p instead of σ_p̂)",
      "z = 0.42 / 0.035 ≈ 12.0 (forgot to subtract p)"
    ],
    explanation: "z = (p̂ − p) / σ_p̂ = (0.42 − 0.45) / 0.035 = −0.03 / 0.035 ≈ −0.86. The negative z-score means p̂ is below the population proportion.",
    topicId: "5.5: Z-Score Calculation"
  },
  {
    scenarioText: "For a proportion with p = 0.50 and n = 100, compare the Large Counts check to p = 0.02 and n = 100. What's the key difference?",
    correctAnswer: "p = 0.50: np = 50 and n(1−p) = 50, both ≥ 10 (passes). p = 0.02: np = 2 < 10 (fails). Proportions near 0 or 1 need much larger n to satisfy Large Counts",
    wrongOptions: [
      "Both pass the Large Counts condition because n = 100 is always large enough",
      "Neither passes because n must be at least 200 for the Large Counts condition",
      "The only difference is the shape of the population — proportion size doesn't matter"
    ],
    explanation: "With p = 0.50: np = 50 ✓, n(1−p) = 50 ✓. With p = 0.02: np = 2 ✗. Extreme proportions (near 0 or 1) require much larger sample sizes to meet Large Counts.",
    topicId: "5.5: Large Counts Condition"
  },
  {
    scenarioText: "In a town, 78% of homes have internet access. A researcher samples 60 homes. What is the probability that fewer than 70% of the sampled homes have internet?",
    correctAnswer: "About 0.063 — σ_p̂ ≈ 0.053, z = (0.70 − 0.78)/0.053 ≈ −1.51, P(Z < −1.51) ≈ 0.066",
    wrongOptions: [
      "About 0.937 — this is P(Z > −1.51), the wrong direction",
      "About 0.78 — the probability equals the population proportion",
      "About 0.30 — this is 1 − 0.70, confusing complement with probability"
    ],
    explanation: "σ_p̂ = √(0.78 × 0.22 / 60) ≈ 0.053. z = (0.70 − 0.78)/0.053 ≈ −1.51. P(p̂ < 0.70) = P(Z < −1.51) ≈ 0.066.",
    topicId: "5.5: Probability Calculation"
  },
  {
    scenarioText: "A student writes: 'μ_p̂ = 0.35 means that every sample of 100 people will have 35% who prefer brand A.' Is this correct?",
    correctAnswer: "No — μ_p̂ = 0.35 means the AVERAGE of all possible sample proportions equals 0.35; individual samples will vary around this value",
    wrongOptions: [
      "Yes — the mean of the sampling distribution guarantees each sample matches p",
      "No — but only because 35% should be rounded to a whole number of people",
      "Yes — as long as the Large Counts condition is met, every sample gives p̂ = p"
    ],
    explanation: "μ_p̂ = p means p̂ is an unbiased estimator of p — on AVERAGE across all possible samples, the sample proportion equals the population proportion. Individual sample proportions will vary due to sampling variability.",
    topicId: "5.5: Interpreting Parameters"
  },
  {
    scenarioText: "A poll finds p̂ = 0.48 from n = 600 voters, where the true proportion is p = 0.50. Is this result surprising?",
    correctAnswer: "Not very — σ_p̂ ≈ 0.020, z = (0.48 − 0.50)/0.020 = −1.0, and P(p̂ < 0.48) ≈ 0.159, which is not unusual",
    wrongOptions: [
      "Very surprising — the sample proportion should always equal the population proportion",
      "Not surprising — any result is equally likely when sampling",
      "Very surprising — a difference of 0.02 is always statistically significant"
    ],
    explanation: "σ_p̂ = √(0.50 × 0.50 / 600) ≈ 0.020. z = (0.48 − 0.50)/0.020 = −1.0. P(Z < −1.0) ≈ 0.159. About 16% of samples would give p̂ ≤ 0.48, so this is not surprising.",
    topicId: "5.5: Probability Calculation"
  }
];

// ---- L25: Difference in Proportions contexts ----
const diffPropContextBank = [
  { label: "flu vaccine", group1: "adults aged 18-49", group2: "adults aged 50+", p1: 0.48, p2: 0.72, n1: 120, n2: 100, N1: 500000, N2: 300000, desc: "A health department compares flu vaccination rates between two age groups" },
  { label: "online shopping", group1: "urban residents", group2: "rural residents", p1: 0.78, p2: 0.54, n1: 150, n2: 130, N1: 400000, N2: 200000, desc: "A marketing firm compares online shopping rates between urban and rural residents" },
  { label: "exercise habits", group1: "college students", group2: "working professionals", p1: 0.62, p2: 0.41, n1: 80, n2: 100, N1: 50000, N2: 250000, desc: "A fitness study compares regular exercise rates between college students and working professionals" },
  { label: "pet ownership", group1: "homeowners", group2: "renters", p1: 0.73, p2: 0.35, n1: 90, n2: 110, N1: 150000, N2: 200000, desc: "A survey compares pet ownership rates between homeowners and renters" },
  { label: "public transit", group1: "downtown workers", group2: "suburban workers", p1: 0.56, p2: 0.18, n1: 200, n2: 180, N1: 100000, N2: 350000, desc: "A transportation study compares public transit usage between downtown and suburban workers" },
  { label: "recycling", group1: "residents in City A", group2: "residents in City B", p1: 0.64, p2: 0.52, n1: 100, n2: 120, N1: 250000, N2: 300000, desc: "An environmental agency compares recycling participation rates between two cities" },
  { label: "breakfast habits", group1: "high school students", group2: "middle school students", p1: 0.38, p2: 0.55, n1: 140, n2: 160, N1: 80000, N2: 60000, desc: "A nutrition study compares rates of eating breakfast daily between high school and middle school students" },
  { label: "smartphone usage", group1: "teens", group2: "seniors", p1: 0.96, p2: 0.58, n1: 75, n2: 90, N1: 100000, N2: 200000, desc: "A tech survey compares smartphone ownership rates between teens and seniors" },
  { label: "voter turnout", group1: "registered Democrats", group2: "registered Republicans", p1: 0.68, p2: 0.72, n1: 250, n2: 230, N1: 600000, N2: 550000, desc: "An election study compares voter turnout rates between two parties" },
  { label: "organic food", group1: "shoppers under 40", group2: "shoppers 40 and older", p1: 0.31, p2: 0.22, n1: 180, n2: 150, N1: 400000, N2: 500000, desc: "A grocery study compares organic food purchase rates between younger and older shoppers" }
];

// ---- L26: Large Counts for two proportions ----
const diffLargeCountsBank = [
  { group1: "children", group2: "adults", p1: 0.03, p2: 0.12, n1: 200, n2: 150, desc: "A hospital compares infection rates between children and adults after a procedure" },
  { group1: "men", group2: "women", p1: 0.45, p2: 0.52, n1: 100, n2: 120, desc: "A poll compares approval ratings of a policy between men and women" },
  { group1: "treatment group", group2: "control group", p1: 0.85, p2: 0.60, n1: 80, n2: 90, desc: "A clinical trial compares recovery rates between treatment and control groups" },
  { group1: "East region", group2: "West region", p1: 0.02, p2: 0.05, n1: 300, n2: 150, desc: "A company compares product defect rates between factories in two regions" },
  { group1: "freshmen", group2: "seniors", p1: 0.72, p2: 0.88, n1: 50, n2: 60, desc: "A university compares on-time graduation rates between freshmen and seniors" },
  { group1: "morning shift", group2: "night shift", p1: 0.91, p2: 0.78, n1: 70, n2: 55, desc: "A factory compares safety compliance rates between morning and night shifts" },
  { group1: "brand A users", group2: "brand B users", p1: 0.07, p2: 0.04, n1: 100, n2: 80, desc: "A consumer report compares complaint rates between two phone brands" },
  { group1: "vaccinated", group2: "unvaccinated", p1: 0.02, p2: 0.15, n1: 250, n2: 200, desc: "A study compares hospitalization rates between vaccinated and unvaccinated groups" },
  { group1: "students with tutoring", group2: "students without tutoring", p1: 0.68, p2: 0.45, n1: 40, n2: 45, desc: "A school compares pass rates between students with and without after-school tutoring" },
  { group1: "email recipients", group2: "social media audience", p1: 0.05, p2: 0.03, n1: 500, n2: 600, desc: "A marketing team compares click-through rates between email and social media campaigns" }
];

// ---- L27: Interpret difference in proportions ----
const diffInterpretParamsBank = [
  {
    context: "65% of urban residents and 42% of rural residents use ride-sharing apps. Random samples of 100 urban and 80 rural residents are taken.",
    p1: 0.65, p2: 0.42, n1: 100, n2: 80, paramType: "mean",
    correctInterpretation: "μ_{p̂₁−p̂₂} = 0.23, meaning that across all possible pairs of samples (100 urban and 80 rural), the average difference in sample proportions who use ride-sharing equals the true difference of 0.23",
    wrongInterpretations: [
      "In every pair of samples, the difference in proportions will be exactly 0.23",
      "The mean of 0.23 means 23% of ride-sharing users live in urban areas",
      "μ_{p̂₁−p̂₂} = 0.23 means the population difference changes to 0.23 after sampling"
    ]
  },
  {
    context: "80% of morning shift workers and 65% of evening shift workers wear safety gear. Random samples of 90 morning and 110 evening workers are taken.",
    p1: 0.80, p2: 0.65, n1: 90, n2: 110, paramType: "sd",
    correctInterpretation: "σ_{p̂₁−p̂₂} ≈ 0.059, meaning the difference in sample proportions typically varies by about 0.059 from the true difference of 0.15 across all possible pairs of samples",
    wrongInterpretations: [
      "The standard deviation of 0.059 means exactly 5.9% of workers differ between shifts",
      "σ_{p̂₁−p̂₂} = 0.059 means the difference p̂₁ − p̂₂ is always within 0.059 of the true difference",
      "The standard deviation of 0.059 means the population difference varies by 5.9%"
    ]
  },
  {
    context: "48% of teens and 32% of adults read digital news daily. Random samples of 150 teens and 200 adults are taken.",
    p1: 0.48, p2: 0.32, n1: 150, n2: 200, paramType: "mean",
    correctInterpretation: "μ_{p̂₁−p̂₂} = 0.16, meaning that if we took all possible pairs of samples (150 teens and 200 adults), the average of all sample proportion differences would equal the true difference of 0.16",
    wrongInterpretations: [
      "μ_{p̂₁−p̂₂} = 0.16 means our specific pair of samples will have a 16% difference",
      "The mean is 0.16 because 16% of the combined sample reads digital news",
      "μ_{p̂₁−p̂₂} = 0.16 means 16% of all pairs of samples give the correct difference"
    ]
  },
  {
    context: "55% of women and 48% of men in a district support a ballot measure. Random samples of 200 women and 180 men are polled.",
    p1: 0.55, p2: 0.48, n1: 200, n2: 180, paramType: "sd",
    correctInterpretation: "σ_{p̂₁−p̂₂} ≈ 0.051, meaning on average the difference in sample proportions differs from the true difference of 0.07 by about 0.051 across all possible pairs of samples",
    wrongInterpretations: [
      "σ_{p̂₁−p̂₂} = 0.051 means 5.1% of voters changed their mind between samples",
      "The standard deviation means the difference p̂₁ − p̂₂ is guaranteed to be within 0.051 of 0.07",
      "σ_{p̂₁−p̂₂} = 0.051 means there is a 5.1% chance of getting the wrong difference"
    ]
  },
  {
    context: "72% of dog owners and 58% of cat owners buy premium pet food. Random samples of 120 dog owners and 100 cat owners are surveyed.",
    p1: 0.72, p2: 0.58, n1: 120, n2: 100, paramType: "mean",
    correctInterpretation: "μ_{p̂₁−p̂₂} = 0.14, meaning the average difference in sample proportions buying premium food across all possible pairs of samples (120 dog owners and 100 cat owners) equals 0.14",
    wrongInterpretations: [
      "In every pair of samples, exactly 14% more dog owners will buy premium food than cat owners",
      "The mean of 0.14 means 14 out of every 100 pet owners buy premium food",
      "μ_{p̂₁−p̂₂} = 0.14 means the sampling distribution is centered at the sample difference, not the population difference"
    ]
  },
  {
    context: "35% of freshmen and 22% of seniors at a university live on campus. Random samples of 80 freshmen and 100 seniors are selected.",
    p1: 0.35, p2: 0.22, n1: 80, n2: 100, paramType: "sd",
    correctInterpretation: "σ_{p̂₁−p̂₂} ≈ 0.063, meaning the difference in sample proportions living on campus typically differs from the true difference of 0.13 by about 0.063 across all possible pairs of samples",
    wrongInterpretations: [
      "σ_{p̂₁−p̂₂} = 0.063 means 6.3% of students change living arrangements between samples",
      "The standard deviation means p̂₁ − p̂₂ will always be between 0.067 and 0.193",
      "σ_{p̂₁−p̂₂} = 0.063 means the population proportions vary by 6.3%"
    ]
  },
  {
    context: "88% of suburban households and 62% of urban households have a car. Random samples of 150 suburban and 180 urban households are surveyed.",
    p1: 0.88, p2: 0.62, n1: 150, n2: 180, paramType: "mean",
    correctInterpretation: "μ_{p̂₁−p̂₂} = 0.26, meaning across all possible pairs of samples (150 suburban and 180 urban), the average difference in sample proportions with a car equals the true difference of 0.26",
    wrongInterpretations: [
      "μ_{p̂₁−p̂₂} = 0.26 means our samples will always show exactly 26% more suburban households have cars",
      "The mean is 0.26 because that was the result of our specific pair of samples",
      "μ_{p̂₁−p̂₂} = 0.26 means 26% of all possible samples will match the population difference"
    ]
  },
  {
    context: "40% of employees at Company A and 55% of employees at Company B work remotely. Random samples of 100 from each company are taken.",
    p1: 0.40, p2: 0.55, n1: 100, n2: 100, paramType: "sd",
    correctInterpretation: "σ_{p̂₁−p̂₂} ≈ 0.069, meaning the difference in sample proportions working remotely typically varies by about 0.069 from the true difference of −0.15 across all possible pairs of samples of 100",
    wrongInterpretations: [
      "σ_{p̂₁−p̂₂} = 0.069 means exactly 6.9% of remote workers differ between companies",
      "The standard deviation guarantees p̂₁ − p̂₂ is within 0.069 of −0.15 every time",
      "σ_{p̂₁−p̂₂} = 0.069 means there is a 6.9% probability of error in the difference"
    ]
  },
  {
    context: "75% of parents and 60% of non-parents support increased school funding. Random samples of 200 parents and 250 non-parents are polled.",
    p1: 0.75, p2: 0.60, n1: 200, n2: 250, paramType: "mean",
    correctInterpretation: "μ_{p̂₁−p̂₂} = 0.15, meaning the average of all possible sample proportion differences (from 200 parents and 250 non-parents) equals the true population difference of 0.15",
    wrongInterpretations: [
      "μ_{p̂₁−p̂₂} = 0.15 means every pair of samples will have exactly a 15% gap in support",
      "The mean of 0.15 means 15% of respondents changed their mind between surveys",
      "μ_{p̂₁−p̂₂} = 0.15 means only 15% of pairs of samples will show a difference"
    ]
  }
];

// ---- L29: 5.6 Capstone scenarios ----
const capstone56Bank = [
  {
    scenarioText: "In a large population, 60% of women and 45% of men support a policy. Random samples of 120 women and 100 men are taken. What are the mean and standard deviation of the sampling distribution of p̂₁ − p̂₂?",
    correctAnswer: "μ = 0.60 − 0.45 = 0.15, σ = √(0.60(0.40)/120 + 0.45(0.55)/100) ≈ 0.066",
    wrongOptions: [
      "μ = 0.15, σ = √(0.60(0.40)/120) + √(0.45(0.55)/100) ≈ 0.094 (added SDs instead of variances)",
      "μ = 0.525, σ = 0.066 (averaged the proportions instead of subtracting)",
      "μ = 0.15, σ = √(0.15(0.85)/220) ≈ 0.024 (used pooled proportion with combined n)"
    ],
    explanation: "μ_{p̂₁−p̂₂} = p₁ − p₂ = 0.60 − 0.45 = 0.15. σ = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂) = √(0.24/120 + 0.2475/100) = √(0.002 + 0.002475) = √0.004475 ≈ 0.066.",
    topicId: "5.6: Distribution Parameters"
  },
  {
    scenarioText: "A researcher compares two groups: n₁ = 80 with p₁ = 0.03 and n₂ = 100 with p₂ = 0.45. Can the sampling distribution of p̂₁ − p̂₂ be modeled with a normal distribution?",
    correctAnswer: "No — n₁p₁ = 80(0.03) = 2.4 < 10, so at least one Large Counts condition fails",
    wrongOptions: [
      "Yes — the total sample size of 180 is large enough",
      "Yes — n₂p₂ = 45 and n₂(1−p₂) = 55 both pass, so the condition is met",
      "No — but only because the proportions are too different from each other"
    ],
    explanation: "All FOUR must be ≥ 10: n₁p₁ = 2.4 ✗, n₁(1−p₁) = 77.6 ✓, n₂p₂ = 45 ✓, n₂(1−p₂) = 55 ✓. Since n₁p₁ < 10, the condition fails and normal approximation is not appropriate.",
    topicId: "5.6: Large Counts Condition"
  },
  {
    scenarioText: "72% of suburbanites and 55% of city dwellers own a car. In random samples of 150 from each group, σ_{p̂₁−p̂₂} ≈ 0.054. Which interpretation is correct?",
    correctAnswer: "The difference in sample proportions typically varies by about 0.054 from the true difference of 0.17 across all possible pairs of samples of 150",
    wrongOptions: [
      "Exactly 5.4% of people differ in car ownership between the two groups",
      "The difference in sample proportions is always within 0.054 of 0.17",
      "The population difference changes by 0.054 each time we sample"
    ],
    explanation: "σ_{p̂₁−p̂₂} describes how much p̂₁ − p̂₂ typically varies from p₁ − p₂ across all possible pairs of samples. 'Typically' is key — not every pair, and not guaranteed.",
    topicId: "5.6: Interpreting Parameters"
  },
  {
    scenarioText: "In two large populations, p₁ = 0.50 and p₂ = 0.40. Random samples of n₁ = 200 and n₂ = 250 are taken. What is the probability that p̂₁ − p̂₂ > 0.15?",
    correctAnswer: "About 0.145 — σ ≈ 0.047, z = (0.15 − 0.10)/0.047 ≈ 1.06, P(Z > 1.06) ≈ 0.145",
    wrongOptions: [
      "About 0.855 — this is P(Z < 1.06), the wrong direction",
      "About 0.15 — the probability equals the observed difference",
      "Cannot be calculated without knowing the exact population sizes"
    ],
    explanation: "μ = 0.50 − 0.40 = 0.10. σ = √(0.50(0.50)/200 + 0.40(0.60)/250) = √(0.00125 + 0.00096) = √0.00221 ≈ 0.047. z = (0.15 − 0.10)/0.047 ≈ 1.06. P(Z > 1.06) ≈ 0.145.",
    topicId: "5.6: Probability Calculation"
  },
  {
    scenarioText: "Why does the formula σ_{p̂₁−p̂₂} = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂) add the two variance terms even though we're computing a DIFFERENCE?",
    correctAnswer: "Because variances of independent random variables always ADD, whether the variables are added or subtracted — this is the same principle as the variance trap for linear combinations",
    wrongOptions: [
      "The formula actually subtracts the variances, but the negative sign cancels out",
      "We add variances because we assume both populations are identical",
      "Variances are added only when proportions are close to 0.50"
    ],
    explanation: "Var(X − Y) = Var(X) + Var(Y) when X and Y are independent. Variances ALWAYS add, even for differences. This is the same principle from Topic 5.2 linear combinations.",
    topicId: "5.6: Variance Addition"
  },
  {
    scenarioText: "A student computes σ_{p̂₁−p̂₂} by calculating √(0.60(0.40)/100) = 0.049 and √(0.45(0.55)/120) = 0.045, then ADDS them to get 0.094. What error did the student make?",
    correctAnswer: "The student added STANDARD DEVIATIONS instead of VARIANCES. Correct: √(0.049² + 0.045²) = √(0.002400 + 0.002063) ≈ 0.067",
    wrongOptions: [
      "The student used the wrong proportions in the formula",
      "The student forgot to subtract instead of add",
      "The student should have averaged the two standard deviations: (0.049 + 0.045)/2 = 0.047"
    ],
    explanation: "You must add VARIANCES (0.049² + 0.045²), then take one square root. Adding SDs directly is the classic variance trap — same error as with linear combinations of random variables.",
    topicId: "5.6: Variance Trap"
  },
  {
    scenarioText: "Two populations have p₁ = 0.30, p₂ = 0.30 (equal proportions). What is μ_{p̂₁−p̂₂} and what does this tell us about the sampling distribution?",
    correctAnswer: "μ_{p̂₁−p̂₂} = 0.30 − 0.30 = 0, meaning the sampling distribution is centered at 0 — when both populations have the same proportion, we expect no difference on average",
    wrongOptions: [
      "μ_{p̂₁−p̂₂} = 0.30 because the mean equals the common proportion",
      "μ_{p̂₁−p̂₂} = 0.60 because we add the two proportions",
      "μ_{p̂₁−p̂₂} is undefined when both proportions are equal"
    ],
    explanation: "μ_{p̂₁−p̂₂} = p₁ − p₂ = 0. When populations have equal proportions, the sampling distribution of the difference is centered at 0. Individual sample differences will still vary around 0 due to sampling variability.",
    topicId: "5.6: Distribution Parameters"
  },
  {
    scenarioText: "A study finds p̂₁ = 0.58 (n₁ = 100) and p̂₂ = 0.42 (n₂ = 120). The true proportions are p₁ = 0.55 and p₂ = 0.45. What is the z-score for the observed difference of 0.16?",
    correctAnswer: "z = (0.16 − 0.10) / σ where σ = √(0.55(0.45)/100 + 0.45(0.55)/120) ≈ 0.067, so z ≈ 0.89",
    wrongOptions: [
      "z = 0.16 / 0.067 ≈ 2.39 (forgot to subtract the mean μ = p₁ − p₂ = 0.10)",
      "z = (0.16 − 0.10) / (0.55 − 0.45) = 0.60 (divided by the population difference instead of σ)",
      "z = (0.58 − 0.42) / 0.067 ≈ 2.39 (used p̂₁ − p̂₂ instead of subtracting μ)"
    ],
    explanation: "μ = p₁ − p₂ = 0.10. σ = √(0.2475/100 + 0.2475/120) = √(0.002475 + 0.002063) = √0.004538 ≈ 0.067. z = (0.16 − 0.10)/0.067 ≈ 0.89.",
    topicId: "5.6: Z-Score Calculation"
  }
];

// ---- L31: Sample Mean contexts (5.7a, 5.7d) ----
const meanContextBank = [
  { label: "lemon weights", context: "A large orchard produces lemons whose weights are normally distributed", mu: 4, sigma: 0.5, n: 6, N: 5000, unit: "oz", measurable: "weight" },
  { label: "package weights", context: "A shipping company handles packages whose weights are approximately normally distributed", mu: 16, sigma: 0.8, n: 25, N: 100000, unit: "oz", measurable: "weight" },
  { label: "student test scores", context: "Test scores at a large high school are approximately normally distributed", mu: 72, sigma: 12, n: 36, N: 2000, unit: "points", measurable: "test score" },
  { label: "coffee cup fills", context: "A café fills cups of coffee with amounts that are approximately normally distributed", mu: 12, sigma: 0.3, n: 15, N: 50000, unit: "oz", measurable: "fill amount" },
  { label: "battery lifetimes", context: "A factory produces batteries whose lifetimes are approximately normally distributed", mu: 500, sigma: 40, n: 40, N: 200000, unit: "hours", measurable: "lifetime" },
  { label: "newborn weights", context: "Birth weights at a large hospital are approximately normally distributed", mu: 7.5, sigma: 1.1, n: 20, N: 15000, unit: "lb", measurable: "birth weight" },
  { label: "commute times", context: "Commute times in a large metropolitan area are approximately normally distributed", mu: 32, sigma: 7, n: 50, N: 300000, unit: "min", measurable: "commute time" },
  { label: "tree heights", context: "Heights of pine trees in a national forest are approximately normally distributed", mu: 55, sigma: 8, n: 30, N: 80000, unit: "ft", measurable: "height" },
  { label: "water bottle volumes", context: "A bottling plant fills water bottles with volumes that are approximately normally distributed", mu: 500, sigma: 5, n: 10, N: 120000, unit: "mL", measurable: "volume" },
  { label: "reaction times", context: "Reaction times for drivers at an intersection are approximately normally distributed", mu: 1.8, sigma: 0.4, n: 45, N: 250000, unit: "sec", measurable: "reaction time" }
];

// ---- L32: Shape of x̄ distribution (5.7b) ----
const meanShapeBank = [
  {
    popDesc: "A normally distributed population of adult body temperatures",
    sampleSize: 8,
    isNormal: true,
    reason: "The population is normally distributed, so the sampling distribution of x̄ is normal for ANY sample size, including n = 8.",
    givenInfo: "Population: normal | n = 8"
  },
  {
    popDesc: "A strongly right-skewed population of annual incomes",
    sampleSize: 10,
    isNormal: false,
    reason: "The population is strongly right-skewed and n = 10 < 30. The CLT does not apply, so the sampling distribution of x̄ is NOT approximately normal.",
    givenInfo: "Population: strongly right-skewed | n = 10"
  },
  {
    popDesc: "A strongly right-skewed population of annual incomes",
    sampleSize: 50,
    isNormal: true,
    reason: "Although the population is strongly right-skewed, n = 50 ≥ 30 is large enough for the CLT to apply. The sampling distribution of x̄ is approximately normal.",
    givenInfo: "Population: strongly right-skewed | n = 50"
  },
  {
    popDesc: "A normally distributed population of bolt diameters produced by a machine",
    sampleSize: 4,
    isNormal: true,
    reason: "The population of bolt diameters is normally distributed. When the population is normal, the sampling distribution of x̄ is normal for any n, even n = 4.",
    givenInfo: "Population: normal | n = 4"
  },
  {
    popDesc: "A uniform (flat) distribution of random number generator outputs between 0 and 1",
    sampleSize: 12,
    isNormal: false,
    reason: "The population is uniform (non-normal) and n = 12 < 30. The CLT requires n ≥ 30 for non-normal populations, so the sampling distribution of x̄ is NOT approximately normal.",
    givenInfo: "Population: uniform | n = 12"
  },
  {
    popDesc: "A uniform (flat) distribution of random number generator outputs between 0 and 1",
    sampleSize: 35,
    isNormal: true,
    reason: "Although the population is uniform (non-normal), n = 35 ≥ 30 is large enough for the CLT to apply. The sampling distribution of x̄ is approximately normal.",
    givenInfo: "Population: uniform | n = 35"
  },
  {
    popDesc: "A bimodal distribution of marathon finish times for elite and recreational runners combined",
    sampleSize: 15,
    isNormal: false,
    reason: "The population is bimodal (far from normal) and n = 15 < 30. The CLT does not apply, so the sampling distribution of x̄ is NOT approximately normal.",
    givenInfo: "Population: bimodal | n = 15"
  },
  {
    popDesc: "A bimodal distribution of marathon finish times for elite and recreational runners combined",
    sampleSize: 60,
    isNormal: true,
    reason: "Although the population is bimodal, n = 60 is well above 30. The CLT guarantees the sampling distribution of x̄ is approximately normal for such a large sample.",
    givenInfo: "Population: bimodal | n = 60"
  },
  {
    popDesc: "A slightly left-skewed population of adult systolic blood pressures",
    sampleSize: 25,
    isNormal: true,
    reason: "With only slight skew, n = 25 is typically sufficient. For mildly non-normal populations, sample sizes slightly below 30 can still produce approximately normal sampling distributions.",
    givenInfo: "Population: slightly left-skewed | n = 25"
  },
  {
    popDesc: "An exponential (heavily right-skewed) population of customer wait times at a bank",
    sampleSize: 6,
    isNormal: false,
    reason: "Exponential distributions are heavily right-skewed, and n = 6 is far too small for the CLT. The sampling distribution of x̄ will still be right-skewed.",
    givenInfo: "Population: exponential (right-skewed) | n = 6"
  }
];

// ---- L33: Interpret x̄ parameters (5.7c) ----
const meanInterpretParamsBank = [
  {
    context: "The mean weight of lemons from a large orchard is μ = 4 oz with σ = 0.5 oz. Random samples of 6 lemons are selected.",
    mu: 4, sigma: 0.5, n: 6, unit: "oz", measurable: "weight", paramType: "mean",
    correctInterpretation: "μ_x̄ = 4 oz, meaning that across all possible samples of 6 lemons, the average of all sample mean weights equals the population mean of 4 oz",
    wrongInterpretations: [
      "In every sample of 6 lemons, the sample mean weight will be exactly 4 oz",
      "The mean of 4 oz means that each lemon in our sample weighs 4 oz",
      "μ_x̄ = 4 oz means 4 out of 6 lemons will have a weight above average"
    ]
  },
  {
    context: "Battery lifetimes from a factory have μ = 500 hours and σ = 40 hours. Random samples of 40 batteries are tested.",
    mu: 500, sigma: 40, n: 40, unit: "hours", measurable: "lifetime", paramType: "sd",
    correctInterpretation: "σ_x̄ ≈ 6.325 hours, meaning the sample mean lifetime typically varies by about 6.325 hours from the true population mean of 500 hours across all possible samples of 40 batteries",
    wrongInterpretations: [
      "The standard deviation of 6.325 hours means every sample mean is within 6.325 hours of 500",
      "σ_x̄ = 6.325 means each individual battery's lifetime varies by 6.325 hours from the mean",
      "The standard deviation of 6.325 hours means 6.325% of batteries are defective"
    ]
  },
  {
    context: "Test scores at a large high school have μ = 72 points and σ = 12 points. Random samples of 36 students are selected.",
    mu: 72, sigma: 12, n: 36, unit: "points", measurable: "test score", paramType: "mean",
    correctInterpretation: "μ_x̄ = 72 points, meaning that if we took all possible samples of 36 students, the average of all sample mean test scores would equal the population mean of 72 points",
    wrongInterpretations: [
      "μ_x̄ = 72 points means our specific sample of 36 students will have a mean of exactly 72",
      "The mean is 72 because that was the result of our specific sample",
      "μ_x̄ = 72 means 72% of students scored above average"
    ]
  },
  {
    context: "Coffee cup fill amounts at a café have μ = 12 oz and σ = 0.3 oz. Random samples of 15 cups are measured.",
    mu: 12, sigma: 0.3, n: 15, unit: "oz", measurable: "fill amount", paramType: "sd",
    correctInterpretation: "σ_x̄ ≈ 0.077 oz, meaning the sample mean fill amount typically differs from the true mean of 12 oz by about 0.077 oz across all possible samples of 15 cups",
    wrongInterpretations: [
      "σ_x̄ = 0.077 oz means each cup is within 0.077 oz of 12 oz",
      "The standard deviation of 0.077 oz means the machine is 0.077 oz off every time",
      "σ_x̄ = 0.077 means there is a 7.7% chance of underfilling"
    ]
  },
  {
    context: "Heights of pine trees in a national forest have μ = 55 ft and σ = 8 ft. Random samples of 30 trees are measured.",
    mu: 55, sigma: 8, n: 30, unit: "ft", measurable: "height", paramType: "mean",
    correctInterpretation: "μ_x̄ = 55 ft, meaning that across all possible random samples of 30 trees from the forest, the average of all sample mean heights equals the true population mean of 55 ft",
    wrongInterpretations: [
      "μ_x̄ = 55 ft means every sample of 30 trees will have a mean height of exactly 55 ft",
      "The mean is 55 ft because that is what we measured in our specific sample",
      "μ_x̄ = 55 ft means 55% of all possible samples will match the population mean"
    ]
  },
  {
    context: "Commute times in a large metropolitan area have μ = 32 min and σ = 7 min. Random samples of 50 commuters are surveyed.",
    mu: 32, sigma: 7, n: 50, unit: "min", measurable: "commute time", paramType: "sd",
    correctInterpretation: "σ_x̄ ≈ 0.990 min, meaning on average the sample mean commute time differs from the true mean of 32 min by about 0.990 min across all possible samples of 50 commuters",
    wrongInterpretations: [
      "σ_x̄ = 0.990 min means each commuter's time varies by about 0.990 min from the mean",
      "The standard deviation guarantees x̄ is always within 0.990 min of 32",
      "σ_x̄ = 0.990 means there is a 0.99% probability of error in the mean"
    ]
  },
  {
    context: "Newborn weights at a large hospital have μ = 7.5 lb and σ = 1.1 lb. Random samples of 20 newborns are weighed.",
    mu: 7.5, sigma: 1.1, n: 20, unit: "lb", measurable: "birth weight", paramType: "mean",
    correctInterpretation: "μ_x̄ = 7.5 lb, meaning the average of the sample mean weights from all possible samples of 20 newborns equals the true population mean birth weight of 7.5 lb — x̄ is an unbiased estimator of μ",
    wrongInterpretations: [
      "μ_x̄ = 7.5 lb means our specific sample will have exactly 7.5 lb as its mean",
      "The mean is 7.5 lb because we weighed 20 babies and found 7.5 lb in our sample",
      "μ_x̄ = 7.5 lb means 7.5 out of 20 newborns will be above average"
    ]
  },
  {
    context: "Reaction times for drivers at an intersection have μ = 1.8 sec and σ = 0.4 sec. Random samples of 45 drivers are tested.",
    mu: 1.8, sigma: 0.4, n: 45, unit: "sec", measurable: "reaction time", paramType: "sd",
    correctInterpretation: "σ_x̄ ≈ 0.060 sec, meaning the sample mean reaction time typically varies by about 0.060 sec from the true population mean of 1.8 sec across all possible samples of 45 drivers",
    wrongInterpretations: [
      "σ_x̄ = 0.060 sec means each driver's reaction time is within 0.060 sec of 1.8 sec",
      "The standard deviation of 0.060 sec means exactly 6% of drivers have slow reactions",
      "σ_x̄ = 0.060 means x̄ is guaranteed to be between 1.740 and 1.860 sec"
    ]
  },
  {
    context: "Water bottle volumes from a bottling plant have μ = 500 mL and σ = 5 mL. Random samples of 10 bottles are inspected.",
    mu: 500, sigma: 5, n: 10, unit: "mL", measurable: "volume", paramType: "mean",
    correctInterpretation: "μ_x̄ = 500 mL, meaning that if we took all possible random samples of 10 bottles, the mean of all sample mean volumes would equal the true population mean of 500 mL",
    wrongInterpretations: [
      "μ_x̄ = 500 mL means every sample of 10 bottles will have a mean of exactly 500 mL",
      "The mean of 500 mL is the result of our specific sample, not a property of all possible samples",
      "μ_x̄ = 500 mL means the sampling distribution is centered at the sample mean, not the population mean"
    ]
  }
];

// ---- L35: 5.7 Capstone scenarios ----
const capstone57Bank = [
  {
    scenarioText: "A factory produces bolts with mean diameter μ = 10 mm and σ = 0.2 mm. A quality inspector takes a random sample of 25 bolts from a day's production of 50,000 bolts. What are the mean and standard deviation of the sampling distribution of x̄?",
    correctAnswer: "μ_x̄ = 10 mm, σ_x̄ = 0.2/√25 = 0.04 mm",
    wrongOptions: [
      "μ_x̄ = 10 mm, σ_x̄ = 0.2 mm (forgot to divide by √n)",
      "μ_x̄ = 10 mm, σ_x̄ = 0.2/25 = 0.008 mm (divided by n instead of √n)",
      "μ_x̄ = 250 mm, σ_x̄ = 0.04 mm (multiplied μ by n)"
    ],
    explanation: "μ_x̄ = μ = 10 mm. σ_x̄ = σ/√n = 0.2/√25 = 0.2/5 = 0.04 mm. The 10% condition is met: 25 < 0.10 × 50,000 = 5,000.",
    topicId: "5.7: Distribution Parameters"
  },
  {
    scenarioText: "Customer wait times at a bank are heavily right-skewed with μ = 8 min and σ = 5 min. A manager takes a random sample of 12 customers. Can we assume the sampling distribution of x̄ is approximately normal?",
    correctAnswer: "No — the population is heavily right-skewed and n = 12 < 30, so the CLT does not apply",
    wrongOptions: [
      "Yes — the CLT says any sampling distribution is approximately normal",
      "Yes — n = 12 is large enough for any population shape",
      "No — but only because σ = 5 is too large relative to μ = 8"
    ],
    explanation: "For non-normal populations, the CLT requires n ≥ 30. Since the population is heavily right-skewed and n = 12 < 30, the sampling distribution of x̄ is NOT approximately normal.",
    topicId: "5.7: Shape of x̄ Distribution"
  },
  {
    scenarioText: "Adult male heights are normally distributed with μ = 70 in and σ = 3 in. For random samples of 9 men, σ_x̄ = 1.0 in. Which interpretation of σ_x̄ is correct?",
    correctAnswer: "The sample mean height of 9 men typically varies by about 1.0 in from the true population mean of 70 in across all possible samples of 9 men",
    wrongOptions: [
      "Each man's height in the sample varies by exactly 1.0 in from 70 in",
      "The sample mean will always be within 1.0 in of 70 in",
      "1.0 in is the standard deviation of individual heights in any sample of 9"
    ],
    explanation: "σ_x̄ describes how much x̄ TYPICALLY varies from μ across all possible samples of the given size. It does NOT describe individual values, and it does NOT mean x̄ is always within σ_x̄ of μ.",
    topicId: "5.7: Interpreting σ_x̄"
  },
  {
    scenarioText: "A cereal company fills boxes with μ = 16 oz and σ = 0.4 oz (normally distributed). In a random sample of 20 boxes, what is the probability that the sample mean is less than 15.8 oz?",
    correctAnswer: "σ_x̄ = 0.4/√20 ≈ 0.0894, z = (15.8 − 16)/0.0894 ≈ −2.24, P(x̄ < 15.8) ≈ 0.013",
    wrongOptions: [
      "z = (15.8 − 16)/0.4 = −0.50, P(x̄ < 15.8) ≈ 0.309 (used σ instead of σ/√n)",
      "z = (16 − 15.8)/0.0894 ≈ 2.24, P ≈ 0.987 (wrong subtraction order and wrong tail)",
      "Cannot be calculated because n = 20 < 30"
    ],
    explanation: "σ_x̄ = 0.4/√20 ≈ 0.0894. z = (15.8 − 16)/0.0894 ≈ −2.24. P(Z < −2.24) ≈ 0.013. Since the population is normal, the sampling distribution is normal for any n.",
    topicId: "5.7: x̄ Probability"
  },
  {
    scenarioText: "Why is σ_x̄ = σ/√n always SMALLER than σ? What does this mean about averages compared to individual values?",
    correctAnswer: "Dividing by √n makes σ_x̄ < σ, meaning sample means are LESS variable than individual values — extreme values tend to cancel out when averaged",
    wrongOptions: [
      "σ_x̄ < σ because we are measuring fewer values, which reduces variation",
      "σ_x̄ < σ only when the population is normal; otherwise they could be equal",
      "σ_x̄ < σ because the sampling distribution is always centered at zero"
    ],
    explanation: "Since √n > 1 for any n > 1, dividing σ by √n always gives a smaller result. This is the key insight: averages are less variable than individual values because extreme observations in a sample tend to be offset by less extreme ones.",
    topicId: "5.7: Variability of Averages"
  },
  {
    scenarioText: "A student calculates σ_x̄ for a sample of 36 from a population with σ = 18. They write: σ_x̄ = 18/36 = 0.5. What error did the student make?",
    correctAnswer: "The student divided by n = 36 instead of √n = √36 = 6. Correct answer: σ_x̄ = 18/6 = 3",
    wrongOptions: [
      "The student should have multiplied by √n: σ_x̄ = 18 × 6 = 108",
      "The formula σ/√n only works for proportions, not means",
      "The student used the wrong value of σ — they should have used σ² = 324"
    ],
    explanation: "σ_x̄ = σ/√n, NOT σ/n. For n = 36: σ_x̄ = 18/√36 = 18/6 = 3. Dividing by n instead of √n is a common error that makes σ_x̄ too small.",
    topicId: "5.7: Common Error"
  },
  {
    scenarioText: "A normally distributed population of water temperatures has μ = 68°F and σ = 4°F. For samples of n = 16, what is the probability that x̄ exceeds 69.5°F?",
    correctAnswer: "σ_x̄ = 4/√16 = 1.0, z = (69.5 − 68)/1.0 = 1.5, P(x̄ > 69.5) = 1 − 0.9332 ≈ 0.067",
    wrongOptions: [
      "z = (69.5 − 68)/4 = 0.375, P ≈ 0.354 (used σ instead of σ/√n)",
      "z = (69.5 − 68)/1.0 = 1.5, P ≈ 0.933 (forgot to take complement for 'greater than')",
      "Cannot compute because 16 < 30"
    ],
    explanation: "σ_x̄ = 4/√16 = 1.0. z = (69.5 − 68)/1.0 = 1.5. P(x̄ > 69.5) = P(Z > 1.5) = 1 − 0.9332 = 0.0668. The population is normal, so the distribution is normal for any n.",
    topicId: "5.7: x̄ Probability"
  },
  {
    scenarioText: "Why does the 10% condition (n < 0.10N) matter when using σ_x̄ = σ/√n for sampling distributions of x̄?",
    correctAnswer: "It ensures sampling without replacement is approximately the same as sampling with replacement, so the formula σ_x̄ = σ/√n is valid",
    wrongOptions: [
      "It guarantees the sampling distribution will be approximately normal",
      "It ensures the sample mean will be within 10% of the population mean",
      "It prevents the sample from being too large relative to the confidence level"
    ],
    explanation: "The 10% condition ensures approximate independence when sampling without replacement. When n < 10% of N, removing sampled individuals doesn't meaningfully change the remaining population, so the standard formula σ_x̄ = σ/√n applies.",
    topicId: "5.7: 10% Condition"
  },
  {
    scenarioText: "Two researchers study the same population (μ = 50, σ = 10). Researcher A uses n = 25 and Researcher B uses n = 100. Compare their σ_x̄ values.",
    correctAnswer: "A: σ_x̄ = 10/√25 = 2.0; B: σ_x̄ = 10/√100 = 1.0. Larger samples produce less variable sample means — B's sampling distribution is half as spread out",
    wrongOptions: [
      "A: σ_x̄ = 2.0; B: σ_x̄ = 1.0. They are different because the populations differ",
      "A: σ_x̄ = 0.4; B: σ_x̄ = 0.1. We divide σ by n, not √n",
      "Both have σ_x̄ = 10 because σ doesn't change with sample size"
    ],
    explanation: "σ_x̄ = σ/√n. A: 10/√25 = 2.0. B: 10/√100 = 1.0. Quadrupling the sample size halves σ_x̄. Larger samples give more precise estimates of μ.",
    topicId: "5.7: Effect of Sample Size"
  },
  {
    scenarioText: "A population has μ = 100 and σ = 15 (right-skewed). A researcher takes samples of n = 40. What can we say about the sampling distribution of x̄?",
    correctAnswer: "μ_x̄ = 100, σ_x̄ = 15/√40 ≈ 2.372, and the distribution is approximately normal by the CLT since n = 40 ≥ 30",
    wrongOptions: [
      "μ_x̄ = 100, σ_x̄ = 15, and the distribution is right-skewed like the population",
      "μ_x̄ = 100, σ_x̄ ≈ 2.372, but we cannot determine the shape without more information",
      "The CLT does not apply because the population is right-skewed"
    ],
    explanation: "μ_x̄ = μ = 100. σ_x̄ = σ/√n = 15/√40 ≈ 2.372. Since n = 40 ≥ 30, the CLT applies even though the population is right-skewed, so the sampling distribution of x̄ is approximately normal.",
    topicId: "5.7: Full Synthesis"
  }
];

// ---- L36/L39/L40: Two-population contexts for xbar1 - xbar2 ----
const diffMeanContextBank = [
  {
    context: "A tree produces lemons and a different tree produces oranges",
    label1: "lemons", label2: "oranges",
    pop1Desc: "Lemon weights are approximately normally distributed",
    pop2Desc: "Orange weights are approximately normally distributed",
    mu1: 4, sigma1: 0.5, n1: 6, N1: 5000,
    mu2: 3, sigma2: 0.4, n2: 6, N2: 5000,
    unit: "oz", measurable: "weight",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A factory produces bolts on two different machines",
    label1: "Machine A bolts", label2: "Machine B bolts",
    pop1Desc: "Machine A bolt diameters are approximately normally distributed",
    pop2Desc: "Machine B bolt diameters are approximately normally distributed",
    mu1: 10, sigma1: 0.2, n1: 25, N1: 50000,
    mu2: 9.8, sigma2: 0.15, n2: 30, N2: 50000,
    unit: "mm", measurable: "diameter",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Two competing coffee shops serve different cup sizes",
    label1: "Shop A cups", label2: "Shop B cups",
    pop1Desc: "Shop A fill amounts are approximately normally distributed",
    pop2Desc: "Shop B fill amounts are approximately normally distributed",
    mu1: 12.1, sigma1: 0.3, n1: 15, N1: 80000,
    mu2: 11.8, sigma2: 0.25, n2: 20, N2: 60000,
    unit: "oz", measurable: "fill amount",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A hospital compares birth weights at two locations",
    label1: "Hospital A newborns", label2: "Hospital B newborns",
    pop1Desc: "Hospital A birth weights are approximately normally distributed",
    pop2Desc: "Hospital B birth weights are approximately normally distributed",
    mu1: 7.5, sigma1: 1.1, n1: 20, N1: 15000,
    mu2: 7.2, sigma2: 0.9, n2: 25, N2: 12000,
    unit: "lb", measurable: "birth weight",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Two battery brands are compared for lifetime",
    label1: "Brand X batteries", label2: "Brand Y batteries",
    pop1Desc: "Brand X lifetimes are approximately normally distributed",
    pop2Desc: "Brand Y lifetimes are approximately normally distributed",
    mu1: 500, sigma1: 40, n1: 35, N1: 200000,
    mu2: 480, sigma2: 35, n2: 40, N2: 150000,
    unit: "hours", measurable: "lifetime",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Test scores are compared between two large high schools",
    label1: "School A students", label2: "School B students",
    pop1Desc: "School A test scores are approximately normally distributed",
    pop2Desc: "School B test scores are approximately normally distributed",
    mu1: 74, sigma1: 11, n1: 36, N1: 2000,
    mu2: 70, sigma2: 13, n2: 40, N2: 2500,
    unit: "points", measurable: "test score",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A researcher compares commute times in two cities",
    label1: "City A commuters", label2: "City B commuters",
    pop1Desc: "City A commute times are approximately normally distributed",
    pop2Desc: "City B commute times are approximately normally distributed",
    mu1: 35, sigma1: 8, n1: 50, N1: 300000,
    mu2: 28, sigma2: 6, n2: 45, N2: 250000,
    unit: "min", measurable: "commute time",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Two farms grow apples of different varieties",
    label1: "Honeycrisp apples", label2: "Fuji apples",
    pop1Desc: "Honeycrisp apple weights are approximately normally distributed",
    pop2Desc: "Fuji apple weights are approximately normally distributed",
    mu1: 8, sigma1: 0.6, n1: 10, N1: 25000,
    mu2: 7.2, sigma2: 0.5, n2: 12, N2: 30000,
    unit: "oz", measurable: "weight",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "A manufacturer compares fill volumes from two bottling lines",
    label1: "Line 1 bottles", label2: "Line 2 bottles",
    pop1Desc: "Line 1 fill volumes are approximately normally distributed",
    pop2Desc: "Line 2 fill volumes are approximately normally distributed",
    mu1: 502, sigma1: 4, n1: 15, N1: 100000,
    mu2: 498, sigma2: 5, n2: 18, N2: 100000,
    unit: "mL", measurable: "fill volume",
    pop1Normal: true, pop2Normal: true
  },
  {
    context: "Reaction times are compared for two age groups of drivers",
    label1: "younger drivers (20-30)", label2: "older drivers (60-70)",
    pop1Desc: "Younger driver reaction times are approximately normally distributed",
    pop2Desc: "Older driver reaction times are approximately normally distributed",
    mu1: 1.5, sigma1: 0.3, n1: 40, N1: 500000,
    mu2: 2.1, sigma2: 0.5, n2: 35, N2: 400000,
    unit: "sec", measurable: "reaction time",
    pop1Normal: true, pop2Normal: true
  }
];

// ---- L37: Shape of xbar1 - xbar2 distribution (5.8b) ----
const diffMeanShapeBank = [
  {
    pop1Desc: "Population 1 is approximately normally distributed",
    pop2Desc: "Population 2 is approximately normally distributed",
    n1: 8, n2: 10,
    isNormal: true,
    reason: "Both populations are approximately normal, so the sampling distribution of xbar1 - xbar2 is approximately normal for ANY sample sizes, including n1 = 8 and n2 = 10.",
    givenInfo: "Pop 1: normal | Pop 2: normal | n1 = 8, n2 = 10"
  },
  {
    pop1Desc: "Population 1 is strongly right-skewed",
    pop2Desc: "Population 2 is approximately normally distributed",
    n1: 15, n2: 20,
    isNormal: false,
    reason: "Population 1 is strongly right-skewed and n1 = 15 < 30. Even though Population 2 is normal, BOTH populations must be normal (or BOTH n >= 30) for xbar1 - xbar2 to be approximately normal.",
    givenInfo: "Pop 1: strongly right-skewed | Pop 2: normal | n1 = 15, n2 = 20"
  },
  {
    pop1Desc: "Population 1 is right-skewed",
    pop2Desc: "Population 2 is left-skewed",
    n1: 50, n2: 45,
    isNormal: true,
    reason: "Neither population is normal, but BOTH sample sizes are >= 30 (n1 = 50 and n2 = 45). By the CLT, the sampling distribution of xbar1 - xbar2 is approximately normal.",
    givenInfo: "Pop 1: right-skewed | Pop 2: left-skewed | n1 = 50, n2 = 45"
  },
  {
    pop1Desc: "Population 1 is uniform",
    pop2Desc: "Population 2 is bimodal",
    n1: 35, n2: 20,
    isNormal: false,
    reason: "Neither population is normal. Although n1 = 35 >= 30, n2 = 20 < 30. BOTH sample sizes must be >= 30 for the CLT to apply to xbar1 - xbar2. Since n2 is too small, the distribution is NOT approximately normal.",
    givenInfo: "Pop 1: uniform | Pop 2: bimodal | n1 = 35, n2 = 20"
  },
  {
    pop1Desc: "Population 1 is approximately normally distributed",
    pop2Desc: "Population 2 is approximately normally distributed",
    n1: 4, n2: 5,
    isNormal: true,
    reason: "Both populations are approximately normal. When BOTH populations are normal, the sampling distribution of xbar1 - xbar2 is normal for any sample sizes, even very small ones like n1 = 4 and n2 = 5.",
    givenInfo: "Pop 1: normal | Pop 2: normal | n1 = 4, n2 = 5"
  },
  {
    pop1Desc: "Population 1 is heavily right-skewed (exponential)",
    pop2Desc: "Population 2 is heavily right-skewed (exponential)",
    n1: 10, n2: 12,
    isNormal: false,
    reason: "Both populations are heavily right-skewed and both sample sizes are < 30 (n1 = 10, n2 = 12). The CLT requires BOTH n >= 30 for non-normal populations.",
    givenInfo: "Pop 1: exponential | Pop 2: exponential | n1 = 10, n2 = 12"
  },
  {
    pop1Desc: "Population 1 is heavily right-skewed (exponential)",
    pop2Desc: "Population 2 is heavily right-skewed (exponential)",
    n1: 40, n2: 35,
    isNormal: true,
    reason: "Both populations are non-normal, but BOTH n1 = 40 >= 30 AND n2 = 35 >= 30. The CLT applies to both, making xbar1 - xbar2 approximately normal.",
    givenInfo: "Pop 1: exponential | Pop 2: exponential | n1 = 40, n2 = 35"
  },
  {
    pop1Desc: "Population 1 is approximately normally distributed",
    pop2Desc: "Population 2 is strongly left-skewed",
    n1: 50, n2: 8,
    isNormal: false,
    reason: "Population 1 is normal but Population 2 is strongly left-skewed with n2 = 8 < 30. For xbar1 - xbar2 to be approximately normal, BOTH populations must be normal OR BOTH n >= 30. Neither condition is fully met.",
    givenInfo: "Pop 1: normal | Pop 2: strongly left-skewed | n1 = 50, n2 = 8"
  },
  {
    pop1Desc: "Population 1 is slightly skewed",
    pop2Desc: "Population 2 is slightly skewed",
    n1: 30, n2: 30,
    isNormal: true,
    reason: "Both populations are slightly non-normal, but BOTH n1 = 30 AND n2 = 30 meet the CLT threshold. The sampling distribution of xbar1 - xbar2 is approximately normal.",
    givenInfo: "Pop 1: slightly skewed | Pop 2: slightly skewed | n1 = 30, n2 = 30"
  },
  {
    pop1Desc: "Population 1 is bimodal",
    pop2Desc: "Population 2 is uniform",
    n1: 25, n2: 40,
    isNormal: false,
    reason: "Population 1 is bimodal and n1 = 25 < 30. Even though n2 = 40 >= 30, BOTH sample sizes must be >= 30 for the CLT to guarantee approximate normality. Since n1 < 30, the condition is not met.",
    givenInfo: "Pop 1: bimodal | Pop 2: uniform | n1 = 25, n2 = 40"
  }
];

// ---- L38: Interpret xbar1 - xbar2 parameters (5.8c) ----
const diffMeanInterpretBank = [
  {
    context: "Lemons (mu1 = 4 oz, sigma1 = 0.5 oz) and oranges (mu2 = 3 oz, sigma2 = 0.4 oz). Random samples of 6 lemons and 6 oranges are selected.",
    mu1: 4, sigma1: 0.5, n1: 6, mu2: 3, sigma2: 0.4, n2: 6, unit: "oz",
    label1: "lemons", label2: "oranges", paramType: "mean",
    correctInterpretation: "mu_(xbar1-xbar2) = 1 oz, meaning that across all possible samples of 6 lemons and 6 oranges, the average difference (L - O) in sample mean weights equals the true difference of 1 oz",
    wrongInterpretations: [
      "In every pair of samples, the difference in sample means will be exactly 1 oz",
      "The mean of 1 oz means each lemon weighs exactly 1 oz more than each orange",
      "mu_(xbar1-xbar2) = 1 oz means 100% of sample differences will be positive"
    ]
  },
  {
    context: "Lemons (mu1 = 4 oz, sigma1 = 0.5 oz) and oranges (mu2 = 3 oz, sigma2 = 0.4 oz). Random samples of 6 lemons and 6 oranges are selected.",
    mu1: 4, sigma1: 0.5, n1: 6, mu2: 3, sigma2: 0.4, n2: 6, unit: "oz",
    label1: "lemons", label2: "oranges", paramType: "sd",
    correctInterpretation: "sigma_(xbar1-xbar2) ~= 0.261 oz, meaning the difference in sample mean weights typically varies by about 0.261 oz from the true difference of 1 oz across all possible samples of 6 lemons and 6 oranges",
    wrongInterpretations: [
      "The standard deviation of 0.261 oz means every sample difference is within 0.261 oz of 1",
      "sigma_(xbar1-xbar2) = 0.261 means each individual fruit weight varies by 0.261 oz",
      "The standard deviation means there is a 26.1% chance of error"
    ]
  },
  {
    context: "Bolts from Machine A (mu1 = 10 mm, sigma1 = 0.2 mm) and Machine B (mu2 = 9.8 mm, sigma2 = 0.15 mm). Samples of 25 from A and 30 from B.",
    mu1: 10, sigma1: 0.2, n1: 25, mu2: 9.8, sigma2: 0.15, n2: 30, unit: "mm",
    label1: "Machine A bolts", label2: "Machine B bolts", paramType: "mean",
    correctInterpretation: "mu_(xbar1-xbar2) = 0.2 mm, meaning across all possible samples of 25 bolts from Machine A and 30 from Machine B, the average difference (A - B) in sample mean diameters equals 0.2 mm",
    wrongInterpretations: [
      "Every pair of samples will show exactly 0.2 mm difference",
      "0.2 mm is the difference we observed in our specific pair of samples",
      "mu_(xbar1-xbar2) = 0.2 means Machine A is always 0.2 mm better than Machine B"
    ]
  },
  {
    context: "Brand X batteries (mu1 = 500 hr, sigma1 = 40 hr) and Brand Y batteries (mu2 = 480 hr, sigma2 = 35 hr). Samples of 35 from X and 40 from Y.",
    mu1: 500, sigma1: 40, n1: 35, mu2: 480, sigma2: 35, n2: 40, unit: "hours",
    label1: "Brand X", label2: "Brand Y", paramType: "sd",
    correctInterpretation: "sigma_(xbar1-xbar2) ~= 8.515 hours, meaning the difference (X - Y) in sample mean lifetimes typically varies by about 8.515 hours from the true difference of 20 hours across all possible samples of 35 Brand X and 40 Brand Y batteries",
    wrongInterpretations: [
      "The standard deviation guarantees xbar1 - xbar2 is always within 8.515 hours of 20",
      "sigma_(xbar1-xbar2) = 8.515 means each individual battery's lifetime varies by 8.515 hours",
      "The standard deviation of 8.515 hours means there is an 85.15% confidence level"
    ]
  },
  {
    context: "School A students (mu1 = 74 pts, sigma1 = 11 pts) and School B students (mu2 = 70 pts, sigma2 = 13 pts). Samples of 36 from A and 40 from B.",
    mu1: 74, sigma1: 11, n1: 36, mu2: 70, sigma2: 13, n2: 40, unit: "points",
    label1: "School A", label2: "School B", paramType: "mean",
    correctInterpretation: "mu_(xbar1-xbar2) = 4 points, meaning that if we took all possible samples of 36 School A and 40 School B students, the average of all differences (A - B) in sample mean test scores would equal 4 points",
    wrongInterpretations: [
      "Our specific samples will always show a 4-point difference",
      "4 points is the result of our particular pair of samples, not a property of all possible samples",
      "mu_(xbar1-xbar2) = 4 means School A scores are always 4 points higher than School B"
    ]
  },
  {
    context: "City A commuters (mu1 = 35 min, sigma1 = 8 min) and City B commuters (mu2 = 28 min, sigma2 = 6 min). Samples of 50 from A and 45 from B.",
    mu1: 35, sigma1: 8, n1: 50, mu2: 28, sigma2: 6, n2: 45, unit: "min",
    label1: "City A", label2: "City B", paramType: "sd",
    correctInterpretation: "sigma_(xbar1-xbar2) ~= 1.381 min, meaning the difference (A - B) in sample mean commute times typically varies by about 1.381 min from the true difference of 7 min across all possible samples of 50 from City A and 45 from City B",
    wrongInterpretations: [
      "sigma_(xbar1-xbar2) = 1.381 min means each commuter's time varies by 1.381 min from the mean",
      "The standard deviation guarantees xbar1 - xbar2 is always between 5.619 and 8.381 min",
      "sigma_(xbar1-xbar2) = 1.381 means there is a 1.381% probability of error"
    ]
  },
  {
    context: "Honeycrisp apples (mu1 = 8 oz, sigma1 = 0.6 oz) and Fuji apples (mu2 = 7.2 oz, sigma2 = 0.5 oz). Samples of 10 Honeycrisp and 12 Fuji.",
    mu1: 8, sigma1: 0.6, n1: 10, mu2: 7.2, sigma2: 0.5, n2: 12, unit: "oz",
    label1: "Honeycrisp", label2: "Fuji", paramType: "mean",
    correctInterpretation: "mu_(xbar1-xbar2) = 0.8 oz, meaning across all possible samples of 10 Honeycrisp and 12 Fuji apples, the average difference in sample mean weights equals the true population difference of 0.8 oz",
    wrongInterpretations: [
      "Every Honeycrisp apple weighs exactly 0.8 oz more than every Fuji apple",
      "0.8 oz is the difference we will observe in our specific sample pair",
      "mu_(xbar1-xbar2) = 0.8 oz means the difference will be between 0 and 1.6 oz"
    ]
  },
  {
    context: "Hospital A newborns (mu1 = 7.5 lb, sigma1 = 1.1 lb) and Hospital B newborns (mu2 = 7.2 lb, sigma2 = 0.9 lb). Samples of 20 from A and 25 from B.",
    mu1: 7.5, sigma1: 1.1, n1: 20, mu2: 7.2, sigma2: 0.9, n2: 25, unit: "lb",
    label1: "Hospital A", label2: "Hospital B", paramType: "sd",
    correctInterpretation: "sigma_(xbar1-xbar2) ~= 0.300 lb, meaning the difference (A - B) in sample mean birth weights typically varies by about 0.300 lb from the true difference of 0.3 lb across all possible samples of 20 from Hospital A and 25 from Hospital B",
    wrongInterpretations: [
      "sigma_(xbar1-xbar2) = 0.300 lb means each newborn's weight varies by 0.300 lb from the mean",
      "The standard deviation of 0.300 lb means the difference is guaranteed to be between 0 and 0.6 lb",
      "sigma_(xbar1-xbar2) = 0.300 means a 30% chance of observing a negative difference"
    ]
  }
];

// ---- L41: 5.8 Capstone scenarios ----
const capstone58Bank = [
  {
    scenarioText: "Lemons have mu1 = 4 oz, sigma1 = 0.5 oz and oranges have mu2 = 3 oz, sigma2 = 0.4 oz. Random samples of 6 from each tree are selected. What are the mean and standard deviation of the sampling distribution of xbar_L - xbar_O?",
    correctAnswer: "mu = 4 - 3 = 1 oz, sigma = sqrt(0.5^2/6 + 0.4^2/6) = sqrt(0.0417 + 0.0267) ~= 0.261 oz",
    wrongOptions: [
      "mu = 1 oz, sigma = sqrt(0.5^2 + 0.4^2) = 0.640 oz (forgot to divide by n)",
      "mu = 1 oz, sigma = 0.5/sqrt(6) + 0.4/sqrt(6) = 0.367 oz (added SD/sqrt(n) terms instead of sqrt(sum of variances))",
      "mu = 7 oz, sigma = sqrt(0.5^2/6 + 0.4^2/6) ~= 0.261 oz (added means instead of subtracting)"
    ],
    explanation: "mu_(xbar1-xbar2) = mu1 - mu2 = 4 - 3 = 1 oz. sigma_(xbar1-xbar2) = sqrt(sigma1^2/n1 + sigma2^2/n2) = sqrt(0.25/6 + 0.16/6) = sqrt(0.0683) ~= 0.261 oz. The 10% condition is met for both (6 < 500).",
    topicId: "5.8: Distribution Parameters"
  },
  {
    scenarioText: "Population 1 is right-skewed with n1 = 35. Population 2 is approximately normal with n2 = 12. Is the sampling distribution of xbar1 - xbar2 approximately normal?",
    correctAnswer: "No - Population 2 is normal but Population 1 is not, AND n2 = 12 < 30 so the CLT doesn't cover both",
    wrongOptions: [
      "Yes - Population 2 is normal so the whole distribution is normal",
      "Yes - n1 = 35 >= 30 is large enough for both populations",
      "Yes - the sum n1 + n2 = 47 >= 30 satisfies the CLT"
    ],
    explanation: "For xbar1 - xbar2 to be approximately normal: BOTH populations must be normal, OR BOTH n >= 30. Here Pop 1 is not normal (ruling out condition 1), and n2 = 12 < 30 (ruling out condition 2). BOTH conditions fail.",
    topicId: "5.8: Shape Conditions"
  },
  {
    scenarioText: "Battery Brand X: mu1 = 500 hr, sigma1 = 40 hr, n1 = 35. Brand Y: mu2 = 480 hr, sigma2 = 35 hr, n2 = 40. What is P(xbar_X - xbar_Y > 30)?",
    correctAnswer: "z = (30 - 20)/8.515 ~= 1.17, P = 1 - 0.8790 = 0.1210",
    wrongOptions: [
      "z = (30 - 20)/40 = 0.25, P = 0.4013 (used sigma1 instead of sigma_(xbar1-xbar2))",
      "z = (30 - 20)/75 = 0.133, P = 0.4471 (added sigma values instead of variances)",
      "z = (30 - 0)/8.515 ~= 3.52, P ~= 0.0002 (used 0 as the mean instead of mu1 - mu2)"
    ],
    explanation: "mu_(xbar1-xbar2) = 500 - 480 = 20. sigma_(xbar1-xbar2) = sqrt(40^2/35 + 35^2/40) = sqrt(45.71 + 30.625) = sqrt(76.34) ~= 8.515. z = (30 - 20)/8.515 ~= 1.17. P(Z > 1.17) ~= 0.1210.",
    topicId: "5.8: Probability Calculation"
  },
  {
    scenarioText: "The standard deviation of the sampling distribution of xbar1 - xbar2 is 0.26 oz for samples of 6 lemons and 6 oranges (true difference = 1 oz). Which interpretation is correct?",
    correctAnswer: "The difference in sample mean weights typically varies by about 0.26 oz from the true difference of 1 oz across all possible samples of 6 lemons and 6 oranges",
    wrongOptions: [
      "Every sample difference will be within 0.26 oz of 1 oz",
      "Individual lemons and oranges vary by 0.26 oz from the mean",
      "There is a 26% chance that the sample difference equals the true difference"
    ],
    explanation: "sigma_(xbar1-xbar2) measures how much the sample statistic xbar1 - xbar2 typically varies from the true difference mu1 - mu2. It describes variation across ALL possible sample pairs, not individual observations.",
    topicId: "5.8: Interpretation"
  },
  {
    scenarioText: "Two populations are both right-skewed. Samples of n1 = 50 and n2 = 45 are taken. A student claims xbar1 - xbar2 is NOT approximately normal because neither population is normal. Is the student correct?",
    correctAnswer: "No - the student is wrong. Both n1 = 50 >= 30 AND n2 = 45 >= 30, so the CLT applies to BOTH and xbar1 - xbar2 IS approximately normal",
    wrongOptions: [
      "Yes - both populations must be normal for xbar1 - xbar2 to be normal",
      "Yes - right-skewed populations can never produce normal sampling distributions",
      "No - only ONE sample size needs to be >= 30"
    ],
    explanation: "There are TWO paths to normality: (1) BOTH populations normal, OR (2) BOTH n >= 30. The student only checked condition 1. Since BOTH n1 = 50 >= 30 AND n2 = 45 >= 30, the CLT applies and xbar1 - xbar2 IS approximately normal.",
    topicId: "5.8: Shape Conditions"
  },
  {
    scenarioText: "Coffee Shop A: mu1 = 12.1 oz, sigma1 = 0.3 oz, n1 = 15. Coffee Shop B: mu2 = 11.8 oz, sigma2 = 0.25 oz, n2 = 20. A student calculates sigma_(xbar1-xbar2) = (0.3/sqrt(15)) - (0.25/sqrt(20)) = 0.0215. What error did the student make?",
    correctAnswer: "The student subtracted sigma/sqrt(n) values instead of adding variances under a square root: sigma = sqrt(0.3^2/15 + 0.25^2/20) ~= 0.094 oz",
    wrongOptions: [
      "The student should have added sigma/sqrt(n) values: 0.3/sqrt(15) + 0.25/sqrt(20) = 0.133 oz",
      "The student should have used sigma1 - sigma2 = 0.05 oz",
      "The student's calculation is correct"
    ],
    explanation: "Variances ALWAYS add, even for differences. sigma_(xbar1-xbar2) = sqrt(sigma1^2/n1 + sigma2^2/n2) = sqrt(0.09/15 + 0.0625/20) = sqrt(0.006 + 0.003125) = sqrt(0.009125) ~= 0.094 oz. Never subtract standard deviations.",
    topicId: "5.8: Variance Addition"
  }
];

// ============ MAIN GENERATOR FUNCTION ============

export function generateProblem(modeId, context, mode) {
  let graphConfig = null;
  let answers = {};
  let ctx = {};
  let scenario = "";

  // ========== L01: Why Samples Vary (5.1a) ==========
  if (modeId === "l01-sample-variability") {
    const scen = drawFromBag('sampleVariability', sampleVariabilityBank);

    // Randomly place the correct answer in optA or optB
    const correctInA = Math.random() < 0.5;
    const optA = correctInA ? scen.correctAnswer : scen.incorrectAnswer;
    const optB = correctInA ? scen.incorrectAnswer : scen.correctAnswer;

    ctx = {
      topicId: "5.1: Sampling Variability",
      questionText: scen.question,
      scenarioText: scen.question,
      givenText: "Consider why sample statistics differ across random samples.",
      optA: optA,
      optB: optB,
      explanation: scen.explanation
    };

    answers = {
      sampleVarAnswer: { value: scen.correctAnswer }
    };

    scenario = scen.question;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L02: Sampling Distribution Concept (5.1b) ==========
  if (modeId === "l02-sampling-dist-concept") {
    const scen = drawFromBag('samplingDistConcept', samplingDistConceptBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "5.1: Sampling Distributions",
      scenarioText: scen.question,
      givenText: "Select the best answer about sampling distributions.",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      sampDistAnswer: { value: scen.correctAnswer }
    };

    scenario = scen.question;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L03: Z-Score Calculation (5.2a) ==========
  if (modeId === "l03-z-score-calc") {
    const ctxData = drawFromBag('normalContext_l03', normalContextBank);

    // Generate a random x value within +/- 2.8 sigma of the mean
    // Use integer or one-decimal precision depending on the scale
    const sigmaMultiplier = (randInt(-280, 280)) / 100; // -2.80 to +2.80
    let xRaw = ctxData.mu + sigmaMultiplier * ctxData.sigma;

    // Round x to reasonable precision based on context
    let x;
    if (ctxData.sigma >= 10) {
      x = Math.round(xRaw); // whole numbers for large-scale contexts
    } else if (ctxData.sigma >= 1) {
      x = Math.round(xRaw * 10) / 10; // one decimal
    } else {
      x = Math.round(xRaw * 100) / 100; // two decimals
    }

    const z = Math.round(((x - ctxData.mu) / ctxData.sigma) * 100) / 100;

    ctx = {
      topicId: "5.2: Z-Scores",
      scenarioText: `${ctxData.desc} with mean \u03bc = ${ctxData.mu} ${ctxData.unit} and standard deviation \u03c3 = ${ctxData.sigma} ${ctxData.unit}. Calculate the z-score for ${ctxData.article} with a ${ctxData.measurable} of ${x} ${ctxData.unit}.`,
      givenText: `\u03bc = ${ctxData.mu} ${ctxData.unit}, \u03c3 = ${ctxData.sigma} ${ctxData.unit}, x = ${x} ${ctxData.unit}`,
      mu: `${ctxData.mu}`,
      sigma: `${ctxData.sigma}`,
      xValue: `${x}`,
      zScore: `${z}`
    };

    answers = {
      zScoreAnswer: { value: z, tolerance: 0.05 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L04: Normal Probability (5.2b) ==========
  if (modeId === "l04-normal-prob") {
    const ctxData = drawFromBag('normalContext_l04', normalContextBank);

    // Pick direction: "greater than" (60%) or "less than" (40%)
    const greaterThan = Math.random() < 0.6;
    const direction = greaterThan ? "GREATER THAN" : "LESS THAN";

    // Generate a random x value within +/- 2.5 sigma
    const sigmaMultiplier = (randInt(-250, 250)) / 100;
    let xRaw = ctxData.mu + sigmaMultiplier * ctxData.sigma;

    let x;
    if (ctxData.sigma >= 10) {
      x = Math.round(xRaw);
    } else if (ctxData.sigma >= 1) {
      x = Math.round(xRaw * 10) / 10;
    } else {
      x = Math.round(xRaw * 100) / 100;
    }

    const z = Math.round(((x - ctxData.mu) / ctxData.sigma) * 100) / 100;

    // Calculate z from the rounded x for probability computation
    const zExact = (x - ctxData.mu) / ctxData.sigma;
    let prob;
    if (greaterThan) {
      prob = 1 - normalCDF(zExact);
    } else {
      prob = normalCDF(zExact);
    }
    prob = Math.round(prob * 10000) / 10000;

    ctx = {
      topicId: "5.2: Normal Probability",
      scenarioText: `${ctxData.desc} with mean \u03bc = ${ctxData.mu} ${ctxData.unit} and standard deviation \u03c3 = ${ctxData.sigma} ${ctxData.unit}. What is the probability that ${ctxData.article} has a ${ctxData.measurable} ${direction} ${x} ${ctxData.unit}?`,
      givenText: `\u03bc = ${ctxData.mu} ${ctxData.unit}, \u03c3 = ${ctxData.sigma} ${ctxData.unit}`,
      mu: `${ctxData.mu}`,
      sigma: `${ctxData.sigma}`,
      xValue: `${x}`,
      direction: direction,
      zScore: `${z}`,
      probability: `${prob}`
    };

    answers = {
      zScore: { value: z, tolerance: 0.05 },
      probability: { value: prob, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L05: Inverse Normal (5.2c) ==========
  if (modeId === "l05-inverse-normal") {
    const ctxData = drawFromBag('normalContext_l05', normalContextBank);

    // Pick a percentile from the table — favor common AP exam values
    const favoredKeys = [0.10, 0.25, 0.75, 0.90, 0.95];
    const allKeys = Object.keys(invNormTable).map(Number);
    // Weight favored keys more heavily: include them twice in the selection pool
    const keyPool = [...allKeys, ...favoredKeys, ...favoredKeys];
    const percentile = choice(keyPool);

    // Determine framing: "bottom X%" or "top X%"
    let frameText, zValue, percentLabel;
    if (percentile <= 0.5) {
      // Frame as "bottom X%"
      const pctNum = Math.round(percentile * 100);
      frameText = `the bottom ${pctNum}%`;
      percentLabel = `Bottom ${pctNum}%`;
      zValue = invNormTable[percentile];
    } else {
      // Frame as "top X%" where top X% means area = 1 - percentile to the right
      const topPct = Math.round((1 - percentile) * 100);
      frameText = `the top ${topPct}%`;
      percentLabel = `Top ${topPct}%`;
      zValue = invNormTable[percentile]; // z for left area = percentile
    }

    const cutoff = Math.round((ctxData.mu + zValue * ctxData.sigma) * 100) / 100;

    ctx = {
      topicId: "5.2: Inverse Normal",
      scenarioText: `${ctxData.desc} with mean \u03bc = ${ctxData.mu} ${ctxData.unit} and standard deviation \u03c3 = ${ctxData.sigma} ${ctxData.unit}. Find the ${ctxData.measurable} that marks ${frameText} of the distribution.`,
      givenText: `\u03bc = ${ctxData.mu} ${ctxData.unit}, \u03c3 = ${ctxData.sigma} ${ctxData.unit}, Percentile: ${percentLabel}`,
      mu: `${ctxData.mu}`,
      sigma: `${ctxData.sigma}`,
      percentile: `${percentile}`,
      zValue: `${zValue}`,
      cutoff: `${cutoff}`
    };

    answers = {
      invZScore: { value: zValue, tolerance: 0.05 },
      cutoffValue: { value: cutoff, tolerance: 0.15 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L06: AP Exam Solution Elements (5.2d) ==========
  if (modeId === "l06-solution-elements") {
    const scen = drawFromBag('solutionElements', solutionElementsBank);

    const allOptions = shuffle(scen.allOptions);

    ctx = {
      topicId: "5.2: AP Solution Elements",
      scenarioText: `A student wrote the following solution on an AP exam:\n\n"${scen.solutionText}"\n\nIdentify what is MISSING from this solution (or select "Nothing" if all elements are present).`,
      givenText: "The 5 required elements: (1) Define random variable in context, (2) State normal distribution, (3) Identify parameters, (4) Value of interest with direction, (5) Correct probability",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      solutionText: scen.solutionText
    };

    answers = {
      missingElement: { value: scen.correctAnswer }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L07: Assess Normality (5.2e) ==========
  if (modeId === "l07-assess-normality") {
    const scen = drawFromBag('assessNormality', assessNormalityBank);

    const normalAnswer = scen.isNormal
      ? "Yes, normal is appropriate"
      : "No, normal is NOT appropriate";

    ctx = {
      topicId: "5.2: Assessing Normality",
      scenarioText: `Consider the following distribution:\n\n${scen.desc}\n\nIs it appropriate to use a normal distribution to model this data?`,
      givenText: scen.givenInfo,
      isNormal: `${scen.isNormal}`,
      reason: scen.reason,
      expectedExplanation: scen.reason
    };

    answers = {
      normalChoice: { value: normalAnswer },
      normalExplain: { value: scen.reason }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L08: Linear Combination Parameters (5.2f) ==========
  if (modeId === "l08-linear-combo-params") {
    const combo = drawFromBag('linearCombo_l08', linearComboBank);

    // Randomly alternate between difference (X - Y) and sum (X + Y)
    const isDifference = Math.random() < 0.6;
    const operation = isDifference ? "difference" : "sum";
    const operationSymbol = isDifference ? "-" : "+";

    const combMean = isDifference
      ? Math.round((combo.muX - combo.muY) * 100) / 100
      : Math.round((combo.muX + combo.muY) * 100) / 100;

    const varX = combo.sigmaX * combo.sigmaX;
    const varY = combo.sigmaY * combo.sigmaY;
    const combSD = Math.round(Math.sqrt(varX + varY) * 100) / 100;

    ctx = {
      topicId: "5.2: Linear Combinations",
      scenarioText: `${combo.desc}.\n\n${combo.xName}: \u03bc = ${combo.muX} ${combo.xUnit}, \u03c3 = ${combo.sigmaX} ${combo.xUnit}\n${combo.yName}: \u03bc = ${combo.muY} ${combo.yUnit}, \u03c3 = ${combo.sigmaY} ${combo.yUnit}\n\nIf X and Y are independent, find the mean and standard deviation of ${combo.xName} ${operationSymbol} ${combo.yName}.`,
      givenText: `${combo.xName}: \u03bc = ${combo.muX}, \u03c3 = ${combo.sigmaX} | ${combo.yName}: \u03bc = ${combo.muY}, \u03c3 = ${combo.sigmaY} | Operation: ${combo.xName} ${operationSymbol} ${combo.yName}`,
      muX: `${combo.muX}`,
      muY: `${combo.muY}`,
      sigmaX: `${combo.sigmaX}`,
      sigmaY: `${combo.sigmaY}`,
      varX: `${varX}`,
      varY: `${varY}`,
      operation: operationSymbol,
      combMean: `${combMean}`,
      combSD: `${combSD}`
    };

    answers = {
      combMean: { value: combMean, tolerance: 0.1 },
      combSD: { value: combSD, tolerance: 0.1 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L09: Linear Combination Probability (5.2g) ==========
  if (modeId === "l09-linear-combo-prob") {
    const combo = drawFromBag('linearCombo_l09', linearComboBank);

    // Always use difference for probability questions (more natural framing)
    const combMean = Math.round((combo.muX - combo.muY) * 100) / 100;
    const varX = combo.sigmaX * combo.sigmaX;
    const varY = combo.sigmaY * combo.sigmaY;
    const combSD = Math.round(Math.sqrt(varX + varY) * 100) / 100;

    // Determine threshold and direction based on context
    // E.g., P(X - Y > 0) or P(X - Y < 0) depending on which makes a natural question
    // We pick a threshold (often 0 for "who is bigger") or a small offset
    const thresholdOptions = [0];
    // Add a contextual threshold sometimes
    if (Math.abs(combMean) > combSD * 0.3) {
      thresholdOptions.push(Math.round(combMean * 0.5 * 10) / 10);
    }
    const threshold = choice(thresholdOptions);

    const zExact = (threshold - combMean) / combSD;
    const z = Math.round(zExact * 100) / 100;

    // For the probability question, we need to pick a direction
    // If combMean > 0 (X tends to be larger), ask P(X - Y < threshold) for interesting probability
    // If combMean < 0 (Y tends to be larger), ask P(X - Y > threshold)
    let prob, directionText;
    if (combMean > 0) {
      // X tends to be bigger; interesting question: P(difference < threshold)
      prob = normalCDF(zExact);
      if (threshold === 0) {
        directionText = `What is the probability that a randomly selected ${combo.yName.toLowerCase()} value exceeds a randomly selected ${combo.xName.toLowerCase()} value? (i.e., ${combo.xName} - ${combo.yName} < ${threshold})`;
      } else {
        directionText = `What is the probability that the difference (${combo.xName} - ${combo.yName}) is less than ${threshold}?`;
      }
    } else {
      // Y tends to be bigger; interesting question: P(difference > threshold)
      prob = 1 - normalCDF(zExact);
      if (threshold === 0) {
        directionText = `What is the probability that a randomly selected ${combo.xName.toLowerCase()} value exceeds a randomly selected ${combo.yName.toLowerCase()} value? (i.e., ${combo.xName} - ${combo.yName} > ${threshold})`;
      } else {
        directionText = `What is the probability that the difference (${combo.xName} - ${combo.yName}) is greater than ${threshold}?`;
      }
    }
    prob = Math.round(prob * 10000) / 10000;

    ctx = {
      topicId: "5.2: Linear Combo Probability",
      scenarioText: `${combo.desc}.\n\n${combo.xName}: \u03bc = ${combo.muX} ${combo.xUnit}, \u03c3 = ${combo.sigmaX} ${combo.xUnit}\n${combo.yName}: \u03bc = ${combo.muY} ${combo.yUnit}, \u03c3 = ${combo.sigmaY} ${combo.yUnit}\n\nX and Y are independent.\n\nFirst find the mean and SD of the difference (${combo.xName} - ${combo.yName}), then answer:\n${directionText}`,
      givenText: `${combo.xName}: \u03bc = ${combo.muX}, \u03c3 = ${combo.sigmaX} | ${combo.yName}: \u03bc = ${combo.muY}, \u03c3 = ${combo.sigmaY}`,
      muX: `${combo.muX}`,
      muY: `${combo.muY}`,
      sigmaX: `${combo.sigmaX}`,
      sigmaY: `${combo.sigmaY}`,
      varX: `${varX}`,
      varY: `${varY}`,
      combMean: `${combMean}`,
      combSD: `${combSD}`,
      threshold: `${threshold}`,
      zScore: `${z}`,
      probability: `${prob}`
    };

    answers = {
      combMean2: { value: combMean, tolerance: 0.1 },
      combSD2: { value: combSD, tolerance: 0.1 },
      combProb: { value: prob, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L10: Capstone (5.1-5.2) ==========
  if (modeId === "l10-capstone") {
    const scen = drawFromBag('capstone', capstoneBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: scen.topicId,
      scenarioText: scen.scenarioText,
      givenText: "Apply concepts from Topics 5.1 and 5.2.",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      expectedExplanation: scen.explanation
    };

    answers = {
      capstoneAnswer: { value: scen.correctAnswer },
      capstoneExplain: { value: scen.explanation }
    };

    scenario = scen.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L11: CLT Concepts (5.3a) ==========
  if (modeId === "l11-clt-concept") {
    const scen = drawFromBag('cltConcept', cltConceptBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "5.3: Central Limit Theorem",
      scenarioText: scen.question,
      givenText: "Select the best answer about the Central Limit Theorem.",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      cltConceptAnswer: { value: scen.correctAnswer }
    };

    scenario = scen.question;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L12: CLT Application (5.3b) ==========
  if (modeId === "l12-clt-application") {
    const scen = drawFromBag('cltApplication', cltApplicationBank);

    const normalAnswer = scen.isNormal
      ? "Yes, approximately normal"
      : "No, NOT approximately normal";

    ctx = {
      topicId: "5.3: CLT Application",
      scenarioText: `Consider the following scenario:\n\n${scen.popDesc} with sample size n = ${scen.sampleSize}.\n\nIs the sampling distribution of x\u0304 approximately normal?`,
      givenText: scen.givenInfo,
      isNormal: `${scen.isNormal}`,
      sampleSize: `${scen.sampleSize}`,
      reason: scen.reason,
      expectedExplanation: scen.reason
    };

    answers = {
      cltNormalChoice: { value: normalAnswer },
      cltNormalExplain: { value: scen.reason }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L13: Randomization Concept (5.3c) ==========
  if (modeId === "l13-randomization-concept") {
    const scen = drawFromBag('randomizationConcept', randomizationConceptBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "5.3: Randomization Distributions",
      scenarioText: scen.question,
      givenText: "Select the best answer about randomization distributions.",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      randDistAnswer: { value: scen.correctAnswer }
    };

    scenario = scen.question;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L14: Randomization Interpretation (5.3d) ==========
  if (modeId === "l14-randomization-interpret") {
    const scen = drawFromBag('randomizationInterpret', randomizationInterpretBank);

    const pValue = Math.round((scen.extremeCount / scen.totalTrials) * 1000) / 1000;
    const convincingAnswer = scen.isConvincing
      ? "Convincing evidence \u2014 the observed result is unlikely due to chance alone"
      : "Not convincing evidence \u2014 the observed result could plausibly happen by chance";

    ctx = {
      topicId: "5.3: Randomization Interpretation",
      scenarioText: `${scen.experimentDesc}\n\nThe observed difference was ${scen.observedDiff} ${scen.unit} (${scen.diffLabel}).\n\nA simulation randomly reassigned the response values to the two groups ${scen.totalTrials} times. Of those, ${scen.extremeCount} reassignments produced a difference of ${scen.observedDiff} or greater.\n\nCalculate the p-value and determine what it tells us.`,
      givenText: `Observed difference: ${scen.observedDiff} ${scen.unit} | Extreme simulations: ${scen.extremeCount} out of ${scen.totalTrials}`,
      observedDiff: `${scen.observedDiff}`,
      extremeCount: `${scen.extremeCount}`,
      totalTrials: `${scen.totalTrials}`,
      pValue: `${pValue}`,
      isConvincing: `${scen.isConvincing}`,
      explanation: scen.explanation
    };

    answers = {
      pValueCalc: { value: pValue, tolerance: 0.002 },
      randConclusion: { value: convincingAnswer }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L15: 5.3 Capstone ==========
  if (modeId === "l15-capstone-53") {
    const scen = drawFromBag('capstone53', capstone53Bank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: scen.topicId,
      scenarioText: scen.scenarioText,
      givenText: "Apply concepts from Topic 5.3 (CLT and Randomization Distributions).",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      expectedExplanation: scen.explanation
    };

    answers = {
      capstone53Answer: { value: scen.correctAnswer },
      capstone53Explain: { value: scen.explanation }
    };

    scenario = scen.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L16: Point Estimate Terminology (5.4a) ==========
  if (modeId === "l16-point-estimate-terminology") {
    const scen = drawFromBag('pointEstimateTerm', pointEstimateTermBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "5.4: Point Estimates",
      scenarioText: scen.question,
      givenText: "Select the best answer about point estimators and point estimates.",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      ptEstTermAnswer: { value: scen.correctAnswer }
    };

    scenario = scen.question;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L17: Estimator Bias Concepts (5.4b) ==========
  if (modeId === "l17-estimator-bias-concept") {
    const scen = drawFromBag('estimatorBiasConcept', estimatorBiasConceptBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "5.4: Biased & Unbiased Estimators",
      scenarioText: scen.question,
      givenText: "Select the best answer about biased and unbiased estimators.",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      biasConceptAnswer: { value: scen.correctAnswer }
    };

    scenario = scen.question;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L18: Identify Bias (5.4c) ==========
  if (modeId === "l18-identify-bias") {
    const scen = drawFromBag('identifyBias', identifyBiasBank);

    const biasAnswer = scen.isUnbiased
      ? "Unbiased — the mean of the sampling distribution equals the parameter"
      : "Biased — the mean of the sampling distribution does NOT equal the parameter";

    ctx = {
      topicId: "5.4: Identifying Bias",
      scenarioText: `${scen.desc}\n\nIs the ${scen.estimatorName} an unbiased estimator of the ${scen.parameterName}?`,
      givenText: scen.givenInfo,
      isUnbiased: `${scen.isUnbiased}`,
      estimatorName: scen.estimatorName,
      parameterName: scen.parameterName,
      parameterValue: `${scen.parameterValue}`,
      samplingDistMean: `${scen.samplingDistMean}`,
      reason: scen.reason,
      expectedExplanation: scen.reason
    };

    answers = {
      biasChoice: { value: biasAnswer },
      biasExplain: { value: scen.reason }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L19: 5.4 Capstone ==========
  if (modeId === "l19-capstone-54") {
    const scen = drawFromBag('capstone54', capstone54Bank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: scen.topicId,
      scenarioText: scen.scenarioText,
      givenText: "Apply concepts from Topic 5.4 (Biased and Unbiased Point Estimates).",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      expectedExplanation: scen.explanation
    };

    answers = {
      capstone54Answer: { value: scen.correctAnswer },
      capstone54Explain: { value: scen.explanation }
    };

    scenario = scen.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L20: p̂ Distribution Parameters (5.5a) ==========
  if (modeId === "l20-prop-dist-params") {
    const scen = drawFromBag('propContext_l20', propContextBank);

    const propMean = scen.p;
    const propSD = Math.round(Math.sqrt(scen.p * (1 - scen.p) / scen.n) * 1000) / 1000;
    const tenPctCheck = scen.n < 0.10 * scen.N;

    ctx = {
      topicId: "5.5: p̂ Distribution Parameters",
      scenarioText: `${scen.context}. A random sample of ${scen.n} is selected from a population of ${scen.N.toLocaleString()}.\n\nFind the mean and standard deviation of the sampling distribution of p̂.`,
      givenText: `p = ${scen.p}, n = ${scen.n}, N = ${scen.N.toLocaleString()} | 10% condition: ${scen.n} < ${Math.round(0.10 * scen.N)} → ${tenPctCheck ? "✓ Met" : "✗ Not met"}`,
      p: `${scen.p}`,
      n: `${scen.n}`,
      N: `${scen.N}`,
      propMean: `${propMean}`,
      propSD: `${propSD}`,
      tenPctMet: `${tenPctCheck}`
    };

    answers = {
      propMean: { value: propMean, tolerance: 0.005 },
      propSD: { value: propSD, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L21: Large Counts Condition (5.5b) ==========
  if (modeId === "l21-large-counts") {
    const scen = drawFromBag('largeCounts', largeCountsBank);

    const np = Math.round(scen.n * scen.p * 100) / 100;
    const nq = Math.round(scen.n * (1 - scen.p) * 100) / 100;
    const meetsCondition = np >= 10 && nq >= 10;
    const normalAnswer = meetsCondition
      ? "Yes — Large Counts condition is met (np ≥ 10 AND n(1−p) ≥ 10)"
      : "No — Large Counts condition is NOT met";

    ctx = {
      topicId: "5.5: Large Counts Condition",
      scenarioText: `${scen.context}\n\np = ${scen.p}, n = ${scen.n}\n\nIs the sampling distribution of p̂ approximately normal? Check the Large Counts condition.`,
      givenText: `p = ${scen.p}, n = ${scen.n}`,
      p: `${scen.p}`,
      n: `${scen.n}`,
      np: `${np}`,
      nq: `${nq}`,
      meetsCondition: `${meetsCondition}`,
      reason: meetsCondition
        ? `Yes. np = ${scen.n}(${scen.p}) = ${np} ≥ 10 ✓ and n(1−p) = ${scen.n}(${Math.round((1-scen.p)*100)/100}) = ${nq} ≥ 10 ✓. Both conditions are met, so the sampling distribution of p̂ is approximately normal.`
        : `No. np = ${scen.n}(${scen.p}) = ${np}${np < 10 ? " < 10 ✗" : " ≥ 10 ✓"} and n(1−p) = ${scen.n}(${Math.round((1-scen.p)*100)/100}) = ${nq}${nq < 10 ? " < 10 ✗" : " ≥ 10 ✓"}. Since ${np < 10 ? "np" : "n(1−p)"} < 10, the Large Counts condition is not met and the sampling distribution of p̂ is NOT approximately normal.`
    };

    answers = {
      largeCountsChoice: { value: normalAnswer },
      largeCountsExplain: { value: ctx.reason }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L22: Interpret p̂ Parameters (5.5c) ==========
  if (modeId === "l22-interpret-params") {
    const scen = drawFromBag('interpretParams', interpretParamsBank);

    const allOptions = shuffle([scen.correctInterpretation, ...scen.wrongInterpretations]);

    ctx = {
      topicId: "5.5: Interpreting Parameters",
      scenarioText: `${scen.context}\n\n${scen.paramType === "mean"
        ? `The mean of the sampling distribution of p̂ is μ_p̂ = ${scen.p}. Which interpretation is correct?`
        : `The standard deviation of the sampling distribution of p̂ is σ_p̂ ≈ ${Math.round(Math.sqrt(scen.p * (1 - scen.p) / scen.n) * 1000) / 1000}. Which interpretation is correct?`}`,
      givenText: `p = ${scen.p}, n = ${scen.n} | Interpreting: ${scen.paramType === "mean" ? "μ_p̂" : "σ_p̂"}`,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      paramType: scen.paramType,
      p: `${scen.p}`,
      n: `${scen.n}`
    };

    answers = {
      interpretAnswer: { value: scen.correctInterpretation }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L23: p̂ Probability (5.5d) ==========
  if (modeId === "l23-prop-probability") {
    const scen = drawFromBag('propContext_l23', propContextBank);

    const propSD = Math.sqrt(scen.p * (1 - scen.p) / scen.n);

    // Generate a random p̂ boundary that's 0.5–2.5 SD away from p
    const sdMultiplier = (randInt(50, 250)) / 100 * (Math.random() < 0.5 ? 1 : -1);
    let pHat = scen.p + sdMultiplier * propSD;
    // Clamp to (0, 1) and round to 2 decimals
    pHat = Math.max(0.01, Math.min(0.99, pHat));
    pHat = Math.round(pHat * 100) / 100;

    // Pick direction
    const greaterThan = Math.random() < 0.5;
    const direction = greaterThan ? "GREATER THAN" : "LESS THAN";

    const zExact = (pHat - scen.p) / propSD;
    const z = Math.round(zExact * 100) / 100;

    let prob;
    if (greaterThan) {
      prob = 1 - normalCDF(zExact);
    } else {
      prob = normalCDF(zExact);
    }
    prob = Math.round(prob * 10000) / 10000;

    const propSDRounded = Math.round(propSD * 1000) / 1000;

    ctx = {
      topicId: "5.5: p̂ Probability",
      scenarioText: `${scen.context} (p = ${scen.p}). A random sample of ${scen.n} is selected.\n\nWhat is the probability that the sample proportion p̂ is ${direction} ${pHat}?`,
      givenText: `p = ${scen.p}, n = ${scen.n}, σ_p̂ = ${propSDRounded}`,
      p: `${scen.p}`,
      n: `${scen.n}`,
      pHat: `${pHat}`,
      propSD: `${propSDRounded}`,
      direction: direction,
      zScore: `${z}`,
      probability: `${prob}`
    };

    answers = {
      propZScore: { value: z, tolerance: 0.05 },
      propProb: { value: prob, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L24: 5.5 Capstone ==========
  if (modeId === "l24-capstone-55") {
    const scen = drawFromBag('capstone55', capstone55Bank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: scen.topicId,
      scenarioText: scen.scenarioText,
      givenText: "Apply concepts from Topic 5.5 (Sampling Distributions for Sample Proportions).",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      expectedExplanation: scen.explanation
    };

    answers = {
      capstone55Answer: { value: scen.correctAnswer },
      capstone55Explain: { value: scen.explanation }
    };

    scenario = scen.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L25: p̂₁−p̂₂ Distribution Parameters (5.6a) ==========
  if (modeId === "l25-diff-prop-params") {
    const scen = drawFromBag('diffPropContext_l25', diffPropContextBank);

    const diffMean = Math.round((scen.p1 - scen.p2) * 1000) / 1000;
    const var1 = scen.p1 * (1 - scen.p1) / scen.n1;
    const var2 = scen.p2 * (1 - scen.p2) / scen.n2;
    const diffSD = Math.round(Math.sqrt(var1 + var2) * 1000) / 1000;
    const tenPct1 = scen.n1 < 0.10 * scen.N1;
    const tenPct2 = scen.n2 < 0.10 * scen.N2;

    ctx = {
      topicId: "5.6: p̂₁−p̂₂ Distribution Parameters",
      scenarioText: `${scen.desc}.\n\nGroup 1 (${scen.group1}): p₁ = ${scen.p1}, n₁ = ${scen.n1}, N₁ = ${scen.N1.toLocaleString()}\nGroup 2 (${scen.group2}): p₂ = ${scen.p2}, n₂ = ${scen.n2}, N₂ = ${scen.N2.toLocaleString()}\n\nFind the mean and standard deviation of the sampling distribution of p̂₁ − p̂₂.`,
      givenText: `p₁ = ${scen.p1}, n₁ = ${scen.n1} | p₂ = ${scen.p2}, n₂ = ${scen.n2} | 10% condition: ${tenPct1 && tenPct2 ? "✓ Met for both" : "Check carefully"}`,
      p1: `${scen.p1}`,
      p2: `${scen.p2}`,
      n1: `${scen.n1}`,
      n2: `${scen.n2}`,
      diffPropMean: `${diffMean}`,
      diffPropSD: `${diffSD}`,
      var1: `${Math.round(var1 * 1000000) / 1000000}`,
      var2: `${Math.round(var2 * 1000000) / 1000000}`
    };

    answers = {
      diffPropMean: { value: diffMean, tolerance: 0.005 },
      diffPropSD: { value: diffSD, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L26: Large Counts for Two Proportions (5.6b) ==========
  if (modeId === "l26-diff-prop-large-counts") {
    const scen = drawFromBag('diffLargeCounts', diffLargeCountsBank);

    const n1p1 = Math.round(scen.n1 * scen.p1 * 100) / 100;
    const n1q1 = Math.round(scen.n1 * (1 - scen.p1) * 100) / 100;
    const n2p2 = Math.round(scen.n2 * scen.p2 * 100) / 100;
    const n2q2 = Math.round(scen.n2 * (1 - scen.p2) * 100) / 100;
    const allMet = n1p1 >= 10 && n1q1 >= 10 && n2p2 >= 10 && n2q2 >= 10;

    const normalAnswer = allMet
      ? "Yes — all four Large Counts conditions are met"
      : "No — at least one Large Counts condition is NOT met";

    const failingChecks = [];
    if (n1p1 < 10) failingChecks.push(`n₁p₁ = ${n1p1}`);
    if (n1q1 < 10) failingChecks.push(`n₁(1−p₁) = ${n1q1}`);
    if (n2p2 < 10) failingChecks.push(`n₂p₂ = ${n2p2}`);
    if (n2q2 < 10) failingChecks.push(`n₂(1−p₂) = ${n2q2}`);

    const reason = allMet
      ? `Yes. n₁p₁ = ${n1p1} ≥ 10 ✓, n₁(1−p₁) = ${n1q1} ≥ 10 ✓, n₂p₂ = ${n2p2} ≥ 10 ✓, n₂(1−p₂) = ${n2q2} ≥ 10 ✓. All four conditions are met, so the sampling distribution of p̂₁ − p̂₂ is approximately normal.`
      : `No. n₁p₁ = ${n1p1}${n1p1 < 10 ? " < 10 ✗" : " ≥ 10 ✓"}, n₁(1−p₁) = ${n1q1}${n1q1 < 10 ? " < 10 ✗" : " ≥ 10 ✓"}, n₂p₂ = ${n2p2}${n2p2 < 10 ? " < 10 ✗" : " ≥ 10 ✓"}, n₂(1−p₂) = ${n2q2}${n2q2 < 10 ? " < 10 ✗" : " ≥ 10 ✓"}. Since ${failingChecks.join(" and ")} < 10, the Large Counts condition is not met.`;

    ctx = {
      topicId: "5.6: Large Counts (Two Proportions)",
      scenarioText: `${scen.desc}.\n\nGroup 1 (${scen.group1}): p₁ = ${scen.p1}, n₁ = ${scen.n1}\nGroup 2 (${scen.group2}): p₂ = ${scen.p2}, n₂ = ${scen.n2}\n\nIs the sampling distribution of p̂₁ − p̂₂ approximately normal? Check all four Large Counts conditions.`,
      givenText: `p₁ = ${scen.p1}, n₁ = ${scen.n1} | p₂ = ${scen.p2}, n₂ = ${scen.n2}`,
      p1: `${scen.p1}`,
      p2: `${scen.p2}`,
      n1: `${scen.n1}`,
      n2: `${scen.n2}`,
      n1p1: `${n1p1}`,
      n1q1: `${n1q1}`,
      n2p2: `${n2p2}`,
      n2q2: `${n2q2}`,
      allMet: `${allMet}`,
      reason: reason
    };

    answers = {
      diffLargeCountsChoice: { value: normalAnswer },
      diffLargeCountsExplain: { value: reason }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L27: Interpret p̂₁−p̂₂ Parameters (5.6c) ==========
  if (modeId === "l27-diff-prop-interpret") {
    const scen = drawFromBag('diffInterpretParams', diffInterpretParamsBank);

    const allOptions = shuffle([scen.correctInterpretation, ...scen.wrongInterpretations]);
    const diff = Math.round((scen.p1 - scen.p2) * 1000) / 1000;
    const sd = Math.round(Math.sqrt(scen.p1 * (1 - scen.p1) / scen.n1 + scen.p2 * (1 - scen.p2) / scen.n2) * 1000) / 1000;

    ctx = {
      topicId: "5.6: Interpreting Parameters",
      scenarioText: `${scen.context}\n\n${scen.paramType === "mean"
        ? `The mean of the sampling distribution of p̂₁ − p̂₂ is μ_{p̂₁−p̂₂} = ${diff}. Which interpretation is correct?`
        : `The standard deviation of the sampling distribution of p̂₁ − p̂₂ is σ_{p̂₁−p̂₂} ≈ ${sd}. Which interpretation is correct?`}`,
      givenText: `p₁ = ${scen.p1}, n₁ = ${scen.n1} | p₂ = ${scen.p2}, n₂ = ${scen.n2} | Interpreting: ${scen.paramType === "mean" ? "μ_{p̂₁−p̂₂}" : "σ_{p̂₁−p̂₂}"}`,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      paramType: scen.paramType,
      p1: `${scen.p1}`,
      p2: `${scen.p2}`,
      n1: `${scen.n1}`,
      n2: `${scen.n2}`
    };

    answers = {
      diffInterpretAnswer: { value: scen.correctInterpretation }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L28: p̂₁−p̂₂ Probability (5.6d) ==========
  if (modeId === "l28-diff-prop-probability") {
    const scen = drawFromBag('diffPropContext_l28', diffPropContextBank);

    const trueDiff = scen.p1 - scen.p2;
    const var1 = scen.p1 * (1 - scen.p1) / scen.n1;
    const var2 = scen.p2 * (1 - scen.p2) / scen.n2;
    const diffSD = Math.sqrt(var1 + var2);

    // Generate an observed difference 0.5–2.5 SD away from the true difference
    const sdMultiplier = (randInt(50, 250)) / 100 * (Math.random() < 0.5 ? 1 : -1);
    let obsDiff = trueDiff + sdMultiplier * diffSD;
    obsDiff = Math.round(obsDiff * 100) / 100;

    // Pick direction
    const greaterThan = Math.random() < 0.5;
    const direction = greaterThan ? "GREATER THAN" : "LESS THAN";

    const zExact = (obsDiff - trueDiff) / diffSD;
    const z = Math.round(zExact * 100) / 100;

    let prob;
    if (greaterThan) {
      prob = 1 - normalCDF(zExact);
    } else {
      prob = normalCDF(zExact);
    }
    prob = Math.round(prob * 10000) / 10000;

    const diffSDRounded = Math.round(diffSD * 1000) / 1000;
    const trueDiffRounded = Math.round(trueDiff * 1000) / 1000;

    ctx = {
      topicId: "5.6: p̂₁−p̂₂ Probability",
      scenarioText: `${scen.desc}.\n\nGroup 1 (${scen.group1}): p₁ = ${scen.p1}, n₁ = ${scen.n1}\nGroup 2 (${scen.group2}): p₂ = ${scen.p2}, n₂ = ${scen.n2}\n\nWhat is the probability that p̂₁ − p̂₂ is ${direction} ${obsDiff}?`,
      givenText: `p₁ = ${scen.p1}, n₁ = ${scen.n1} | p₂ = ${scen.p2}, n₂ = ${scen.n2} | μ_{p̂₁−p̂₂} = ${trueDiffRounded}, σ_{p̂₁−p̂₂} = ${diffSDRounded}`,
      p1: `${scen.p1}`,
      p2: `${scen.p2}`,
      n1: `${scen.n1}`,
      n2: `${scen.n2}`,
      obsDiff: `${obsDiff}`,
      diffPropSD: `${diffSDRounded}`,
      trueDiff: `${trueDiffRounded}`,
      direction: direction,
      zScore: `${z}`,
      probability: `${prob}`
    };

    answers = {
      diffPropZScore: { value: z, tolerance: 0.05 },
      diffPropProb: { value: prob, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L30: Interpret p̂₁−p̂₂ Probability (5.6e) ==========
  if (modeId === "l30-diff-prop-interpret-prob") {
    const scen = drawFromBag('diffPropContext_l30', diffPropContextBank);

    const trueDiff = scen.p1 - scen.p2;
    const var1 = scen.p1 * (1 - scen.p1) / scen.n1;
    const var2 = scen.p2 * (1 - scen.p2) / scen.n2;
    const diffSD = Math.sqrt(var1 + var2);

    // Control observed difference to produce a mix of unusual (<5%) and not unusual (≥5%)
    // ~40% chance of unusual result (>1.65 SDs away), ~60% not unusual
    const isUnusual = Math.random() < 0.4;
    let sdMultiplier;
    if (isUnusual) {
      // 1.70–2.80 SDs away → probability < 0.05
      sdMultiplier = (randInt(170, 280)) / 100;
    } else {
      // 0.30–1.55 SDs away → probability ≥ 0.05
      sdMultiplier = (randInt(30, 155)) / 100;
    }
    const sign = Math.random() < 0.5 ? 1 : -1;
    let obsDiff = trueDiff + sign * sdMultiplier * diffSD;
    obsDiff = Math.round(obsDiff * 100) / 100;

    // Pick direction based on which side the observed diff is on
    const greaterThan = (obsDiff - trueDiff) >= 0;
    const direction = greaterThan ? "greater than" : "less than";
    const directionOrMore = greaterThan ? "or greater" : "or less";

    const zExact = (obsDiff - trueDiff) / diffSD;
    const z = Math.round(zExact * 100) / 100;

    let prob;
    if (greaterThan) {
      prob = 1 - normalCDF(zExact);
    } else {
      prob = normalCDF(zExact);
    }
    prob = Math.round(prob * 10000) / 10000;

    const probPct = Math.round(prob * 10000) / 100;
    const diffSDRounded = Math.round(diffSD * 1000) / 1000;
    const trueDiffRounded = Math.round(trueDiff * 1000) / 1000;

    const unusualAnswer = prob < 0.05 ? "Unusual" : "Not unusual";

    ctx = {
      topicId: "5.6: Interpreting Probability",
      scenarioText: `${scen.desc}.\n\nGroup 1 (${scen.group1}): p₁ = ${scen.p1}, n₁ = ${scen.n1}\nGroup 2 (${scen.group2}): p₂ = ${scen.p2}, n₂ = ${scen.n2}\n\nThe probability that p̂₁ − p̂₂ is ${direction} ${obsDiff} is ${prob} (${probPct}%).\n\nInterpret this probability in context and determine whether this result is unusual.`,
      givenText: `p₁ = ${scen.p1}, n₁ = ${scen.n1} | p₂ = ${scen.p2}, n₂ = ${scen.n2} | P(p̂₁ − p̂₂ ${greaterThan ? ">" : "<"} ${obsDiff}) = ${prob}`,
      group1: scen.group1,
      group2: scen.group2,
      p1: `${scen.p1}`,
      p2: `${scen.p2}`,
      n1: `${scen.n1}`,
      n2: `${scen.n2}`,
      obsDiff: `${obsDiff}`,
      direction: direction,
      directionOrMore: directionOrMore,
      probability: `${prob}`,
      probabilityPct: `${probPct}`,
      unusualAnswer: unusualAnswer,
      expectedInterpretation: `Getting a difference (${scen.group1} − ${scen.group2}) in sample proportions of ${obsDiff} ${directionOrMore} happens in about ${probPct}% of all possible samples of size ${scen.n1} from ${scen.group1} and size ${scen.n2} from ${scen.group2}. This is ${unusualAnswer === "Unusual" ? "" : "not "}unusual.`
    };

    answers = {
      diffInterpretProbText: { value: ctx.expectedInterpretation },
      diffUnusualChoice: { value: unusualAnswer === "Unusual" ? "Unusual — probability is less than 5%" : "Not unusual — probability is 5% or more" }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L29: 5.6 Capstone ==========
  if (modeId === "l29-capstone-56") {
    const scen = drawFromBag('capstone56', capstone56Bank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: scen.topicId,
      scenarioText: scen.scenarioText,
      givenText: "Apply concepts from Topic 5.6 (Sampling Distributions for Differences in Sample Proportions).",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      expectedExplanation: scen.explanation
    };

    answers = {
      capstone56Answer: { value: scen.correctAnswer },
      capstone56Explain: { value: scen.explanation }
    };

    scenario = scen.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L31: x̄ Distribution Parameters (5.7a) ==========
  if (modeId === "l31-mean-dist-params") {
    const scen = drawFromBag('meanContext_l31', meanContextBank);

    const meanMu = scen.mu;
    const meanSigma = Math.round((scen.sigma / Math.sqrt(scen.n)) * 1000) / 1000;
    const tenPctCheck = scen.n < 0.10 * scen.N;

    ctx = {
      topicId: "5.7: x̄ Distribution Parameters",
      scenarioText: `${scen.context} with μ = ${scen.mu} ${scen.unit} and σ = ${scen.sigma} ${scen.unit}. A random sample of ${scen.n} ${scen.label} is selected from a population of ${scen.N.toLocaleString()}.\n\nFind the mean and standard deviation of the sampling distribution of x̄.`,
      givenText: `μ = ${scen.mu} ${scen.unit}, σ = ${scen.sigma} ${scen.unit}, n = ${scen.n}, N = ${scen.N.toLocaleString()} | 10% condition: ${scen.n} < ${Math.round(0.10 * scen.N)} → ${tenPctCheck ? "✓ Met" : "✗ Not met"}`,
      mu: `${scen.mu}`,
      sigma: `${scen.sigma}`,
      n: `${scen.n}`,
      N: `${scen.N}`,
      unit: scen.unit,
      meanMu: `${meanMu}`,
      meanSigma: `${meanSigma}`,
      tenPctMet: `${tenPctCheck}`
    };

    answers = {
      meanMu: { value: meanMu, tolerance: 0.1 },
      meanSigma: { value: meanSigma, tolerance: 0.1 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L32: Shape of x̄ Distribution (5.7b) ==========
  if (modeId === "l32-mean-shape") {
    const scen = drawFromBag('meanShape', meanShapeBank);

    const normalAnswer = scen.isNormal
      ? "Yes, approximately normal"
      : "No, NOT approximately normal";

    ctx = {
      topicId: "5.7: Shape of x̄ Distribution",
      scenarioText: `Consider the following scenario:\n\n${scen.popDesc} with sample size n = ${scen.sampleSize}.\n\nIs the sampling distribution of x̄ approximately normal?`,
      givenText: scen.givenInfo,
      isNormal: `${scen.isNormal}`,
      sampleSize: `${scen.sampleSize}`,
      reason: scen.reason,
      expectedExplanation: scen.reason
    };

    answers = {
      meanShapeChoice: { value: normalAnswer },
      meanShapeExplain: { value: scen.reason }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L33: Interpret x̄ Parameters (5.7c) ==========
  if (modeId === "l33-interpret-mean-params") {
    const scen = drawFromBag('meanInterpretParams', meanInterpretParamsBank);

    const allOptions = shuffle([scen.correctInterpretation, ...scen.wrongInterpretations]);
    const sigmaXbar = Math.round((scen.sigma / Math.sqrt(scen.n)) * 1000) / 1000;

    ctx = {
      topicId: "5.7: Interpreting x̄ Parameters",
      scenarioText: `${scen.context}\n\n${scen.paramType === "mean"
        ? `The mean of the sampling distribution of x̄ is μ_x̄ = ${scen.mu} ${scen.unit}. Which interpretation is correct?`
        : `The standard deviation of the sampling distribution of x̄ is σ_x̄ ≈ ${sigmaXbar} ${scen.unit}. Which interpretation is correct?`}`,
      givenText: `μ = ${scen.mu} ${scen.unit}, σ = ${scen.sigma} ${scen.unit}, n = ${scen.n} | Interpreting: ${scen.paramType === "mean" ? "μ_x̄" : "σ_x̄"}`,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      paramType: scen.paramType,
      mu: `${scen.mu}`,
      sigma: `${scen.sigma}`,
      n: `${scen.n}`,
      unit: scen.unit
    };

    answers = {
      meanInterpretAnswer: { value: scen.correctInterpretation }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L34: x̄ Probability (5.7d) ==========
  if (modeId === "l34-mean-probability") {
    const scen = drawFromBag('meanContext_l34', meanContextBank);

    const meanSigma = scen.sigma / Math.sqrt(scen.n);

    // Generate a random x̄ boundary that's 0.5–2.5 SD away from μ
    const sdMultiplier = (randInt(50, 250)) / 100 * (Math.random() < 0.5 ? 1 : -1);
    let xBar = scen.mu + sdMultiplier * meanSigma;
    // Round to reasonable precision
    if (scen.mu >= 100) {
      xBar = Math.round(xBar * 10) / 10;
    } else if (scen.mu >= 10) {
      xBar = Math.round(xBar * 100) / 100;
    } else {
      xBar = Math.round(xBar * 1000) / 1000;
    }

    // Pick direction
    const greaterThan = Math.random() < 0.5;
    const direction = greaterThan ? "GREATER THAN" : "LESS THAN";

    const zExact = (xBar - scen.mu) / meanSigma;
    const z = Math.round(zExact * 100) / 100;

    let prob;
    if (greaterThan) {
      prob = 1 - normalCDF(zExact);
    } else {
      prob = normalCDF(zExact);
    }
    prob = Math.round(prob * 10000) / 10000;

    const meanSigmaRounded = Math.round(meanSigma * 1000) / 1000;

    ctx = {
      topicId: "5.7: x̄ Probability",
      scenarioText: `${scen.context} with μ = ${scen.mu} ${scen.unit} and σ = ${scen.sigma} ${scen.unit}. A random sample of ${scen.n} is selected.\n\nWhat is the probability that the sample mean x̄ is ${direction} ${xBar} ${scen.unit}?`,
      givenText: `μ = ${scen.mu} ${scen.unit}, σ = ${scen.sigma} ${scen.unit}, n = ${scen.n}, σ_x̄ = ${meanSigmaRounded} ${scen.unit}`,
      mu: `${scen.mu}`,
      sigma: `${scen.sigma}`,
      n: `${scen.n}`,
      xBar: `${xBar}`,
      meanSigma: `${meanSigmaRounded}`,
      unit: scen.unit,
      direction: direction,
      zScore: `${z}`,
      probability: `${prob}`
    };

    answers = {
      meanZScore: { value: z, tolerance: 0.05 },
      meanProb: { value: prob, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L35: 5.7 Capstone ==========
  if (modeId === "l35-capstone-57") {
    const scen = drawFromBag('capstone57', capstone57Bank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: scen.topicId,
      scenarioText: scen.scenarioText,
      givenText: "Apply concepts from Topic 5.7 (Sampling Distributions for Sample Means).",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      expectedExplanation: scen.explanation
    };

    answers = {
      capstone57Answer: { value: scen.correctAnswer },
      capstone57Explain: { value: scen.explanation }
    };

    scenario = scen.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L36: xbar1-xbar2 Distribution Parameters (5.8a) ==========
  if (modeId === "l36-diff-mean-params") {
    const scen = drawFromBag('diffMeanContext_l36', diffMeanContextBank);

    const diffMu = Math.round((scen.mu1 - scen.mu2) * 100) / 100;
    const var1 = (scen.sigma1 * scen.sigma1) / scen.n1;
    const var2 = (scen.sigma2 * scen.sigma2) / scen.n2;
    const diffSD = Math.round(Math.sqrt(var1 + var2) * 1000) / 1000;
    const tenPct1 = scen.n1 < 0.10 * scen.N1;
    const tenPct2 = scen.n2 < 0.10 * scen.N2;

    ctx = {
      topicId: "5.8: xbar1-xbar2 Distribution Parameters",
      scenarioText: `${scen.context}.\n\nGroup 1 (${scen.label1}): mu1 = ${scen.mu1} ${scen.unit}, sigma1 = ${scen.sigma1} ${scen.unit}, n1 = ${scen.n1}, N1 = ${scen.N1.toLocaleString()}\nGroup 2 (${scen.label2}): mu2 = ${scen.mu2} ${scen.unit}, sigma2 = ${scen.sigma2} ${scen.unit}, n2 = ${scen.n2}, N2 = ${scen.N2.toLocaleString()}\n\nFind the mean and standard deviation of the sampling distribution of xbar1 - xbar2.`,
      givenText: `mu1 = ${scen.mu1}, sigma1 = ${scen.sigma1}, n1 = ${scen.n1} | mu2 = ${scen.mu2}, sigma2 = ${scen.sigma2}, n2 = ${scen.n2} | 10%: ${tenPct1 && tenPct2 ? "Met for both" : "Check carefully"}`,
      mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`, N1: `${scen.N1}`,
      mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`, N2: `${scen.N2}`,
      unit: scen.unit,
      diffMeanMu: `${diffMu}`,
      diffMeanSD: `${diffSD}`
    };

    answers = {
      diffMeanMu: { value: diffMu, tolerance: 0.1 },
      diffMeanSD: { value: diffSD, tolerance: 0.1 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L37: Shape of xbar1-xbar2 Distribution (5.8b) ==========
  if (modeId === "l37-diff-mean-shape") {
    const scen = drawFromBag('diffMeanShape', diffMeanShapeBank);

    const normalAnswer = scen.isNormal
      ? "Yes, approximately normal"
      : "No, NOT approximately normal";

    ctx = {
      topicId: "5.8: Shape of xbar1-xbar2 Distribution",
      scenarioText: `Consider the following scenario:\n\n${scen.pop1Desc} with sample size n1 = ${scen.n1}.\n${scen.pop2Desc} with sample size n2 = ${scen.n2}.\n\nIs the sampling distribution of xbar1 - xbar2 approximately normal?`,
      givenText: scen.givenInfo,
      isNormal: `${scen.isNormal}`,
      n1: `${scen.n1}`,
      n2: `${scen.n2}`,
      reason: scen.reason,
      expectedExplanation: scen.reason
    };

    answers = {
      diffMeanShapeChoice: { value: normalAnswer },
      diffMeanShapeExplain: { value: scen.reason }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L38: Interpret xbar1-xbar2 Parameters (5.8c) ==========
  if (modeId === "l38-diff-mean-interpret") {
    const scen = drawFromBag('diffMeanInterpret', diffMeanInterpretBank);

    const allOptions = shuffle([scen.correctInterpretation, ...scen.wrongInterpretations]);
    const diffMu = Math.round((scen.mu1 - scen.mu2) * 100) / 100;
    const diffSD = Math.round(Math.sqrt(scen.sigma1 * scen.sigma1 / scen.n1 + scen.sigma2 * scen.sigma2 / scen.n2) * 1000) / 1000;

    ctx = {
      topicId: "5.8: Interpreting xbar1-xbar2 Parameters",
      scenarioText: `${scen.context}\n\n${scen.paramType === "mean"
        ? `The mean of the sampling distribution of xbar1 - xbar2 is mu_(xbar1-xbar2) = ${diffMu} ${scen.unit}. Which interpretation is correct?`
        : `The standard deviation of the sampling distribution of xbar1 - xbar2 is sigma_(xbar1-xbar2) ~= ${diffSD} ${scen.unit}. Which interpretation is correct?`}`,
      givenText: `mu1 = ${scen.mu1}, sigma1 = ${scen.sigma1}, n1 = ${scen.n1} | mu2 = ${scen.mu2}, sigma2 = ${scen.sigma2}, n2 = ${scen.n2} | Interpreting: ${scen.paramType === "mean" ? "mu_(xbar1-xbar2)" : "sigma_(xbar1-xbar2)"}`,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      paramType: scen.paramType,
      mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`,
      mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`,
      unit: scen.unit
    };

    answers = {
      diffMeanInterpretAnswer: { value: scen.correctInterpretation }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L39: xbar1-xbar2 Probability (5.8d) ==========
  if (modeId === "l39-diff-mean-probability") {
    const scen = drawFromBag('diffMeanContext_l39', diffMeanContextBank);

    const diffMu = scen.mu1 - scen.mu2;
    const var1 = (scen.sigma1 * scen.sigma1) / scen.n1;
    const var2 = (scen.sigma2 * scen.sigma2) / scen.n2;
    const diffSD = Math.sqrt(var1 + var2);

    // Generate a random observed difference 0.5-2.5 SD away from the true mean
    const sdMultiplier = (randInt(50, 250)) / 100 * (Math.random() < 0.5 ? 1 : -1);
    let obsDiff = diffMu + sdMultiplier * diffSD;
    if (Math.abs(diffMu) >= 100) {
      obsDiff = Math.round(obsDiff * 10) / 10;
    } else if (Math.abs(diffMu) >= 10) {
      obsDiff = Math.round(obsDiff * 100) / 100;
    } else {
      obsDiff = Math.round(obsDiff * 1000) / 1000;
    }

    const greaterThan = Math.random() < 0.5;
    const direction = greaterThan ? "GREATER THAN" : "LESS THAN";

    const zExact = (obsDiff - diffMu) / diffSD;
    const z = Math.round(zExact * 100) / 100;

    let prob;
    if (greaterThan) {
      prob = 1 - normalCDF(zExact);
    } else {
      prob = normalCDF(zExact);
    }
    prob = Math.round(prob * 10000) / 10000;

    const diffSDRounded = Math.round(diffSD * 1000) / 1000;
    const diffMuRounded = Math.round(diffMu * 100) / 100;

    ctx = {
      topicId: "5.8: xbar1-xbar2 Probability",
      scenarioText: `${scen.context}.\n\nGroup 1 (${scen.label1}): mu1 = ${scen.mu1} ${scen.unit}, sigma1 = ${scen.sigma1} ${scen.unit}, n1 = ${scen.n1}\nGroup 2 (${scen.label2}): mu2 = ${scen.mu2} ${scen.unit}, sigma2 = ${scen.sigma2} ${scen.unit}, n2 = ${scen.n2}\n\nWhat is the probability that xbar1 - xbar2 is ${direction} ${obsDiff} ${scen.unit}?`,
      givenText: `mu1 = ${scen.mu1}, sigma1 = ${scen.sigma1}, n1 = ${scen.n1} | mu2 = ${scen.mu2}, sigma2 = ${scen.sigma2}, n2 = ${scen.n2} | mu_(xbar1-xbar2) = ${diffMuRounded}, sigma_(xbar1-xbar2) = ${diffSDRounded}`,
      mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`,
      mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`,
      obsDiff: `${obsDiff}`,
      diffMeanSD: `${diffSDRounded}`,
      diffMeanMu: `${diffMuRounded}`,
      unit: scen.unit,
      direction: direction,
      label1: scen.label1,
      label2: scen.label2,
      zScore: `${z}`,
      probability: `${prob}`
    };

    answers = {
      diffMeanZScore: { value: z, tolerance: 0.05 },
      diffMeanProb: { value: prob, tolerance: 0.005 }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L40: Interpret xbar1-xbar2 Probability (5.8e) ==========
  if (modeId === "l40-diff-mean-interpret-prob") {
    const scen = drawFromBag('diffMeanContext_l40', diffMeanContextBank);

    const diffMu = scen.mu1 - scen.mu2;
    const var1 = (scen.sigma1 * scen.sigma1) / scen.n1;
    const var2 = (scen.sigma2 * scen.sigma2) / scen.n2;
    const diffSD = Math.sqrt(var1 + var2);

    // ~40% unusual, ~60% not unusual
    const isUnusual = Math.random() < 0.4;
    let sdMultiplier;
    if (isUnusual) {
      sdMultiplier = (randInt(170, 280)) / 100;
    } else {
      sdMultiplier = (randInt(30, 155)) / 100;
    }
    const sign = Math.random() < 0.5 ? 1 : -1;
    let obsDiff = diffMu + sign * sdMultiplier * diffSD;
    if (Math.abs(diffMu) >= 100) {
      obsDiff = Math.round(obsDiff * 10) / 10;
    } else if (Math.abs(diffMu) >= 10) {
      obsDiff = Math.round(obsDiff * 100) / 100;
    } else {
      obsDiff = Math.round(obsDiff * 1000) / 1000;
    }

    const greaterThan = (obsDiff - diffMu) >= 0;
    const direction = greaterThan ? "greater than" : "less than";
    const directionOrMore = greaterThan ? "or greater" : "or less";

    const zExact = (obsDiff - diffMu) / diffSD;
    const z = Math.round(zExact * 100) / 100;

    let prob;
    if (greaterThan) {
      prob = 1 - normalCDF(zExact);
    } else {
      prob = normalCDF(zExact);
    }
    prob = Math.round(prob * 10000) / 10000;

    const probPct = Math.round(prob * 10000) / 100;

    const unusualAnswer = prob < 0.05 ? "Unusual" : "Not unusual";

    ctx = {
      topicId: "5.8: Interpreting Probability",
      scenarioText: `${scen.context}.\n\nGroup 1 (${scen.label1}): mu1 = ${scen.mu1} ${scen.unit}, sigma1 = ${scen.sigma1} ${scen.unit}, n1 = ${scen.n1}\nGroup 2 (${scen.label2}): mu2 = ${scen.mu2} ${scen.unit}, sigma2 = ${scen.sigma2} ${scen.unit}, n2 = ${scen.n2}\n\nThe probability that xbar1 - xbar2 is ${direction} ${obsDiff} ${scen.unit} is ${prob} (${probPct}%).\n\nInterpret this probability in context and determine whether this result is unusual.`,
      givenText: `mu1 = ${scen.mu1}, sigma1 = ${scen.sigma1}, n1 = ${scen.n1} | mu2 = ${scen.mu2}, sigma2 = ${scen.sigma2}, n2 = ${scen.n2} | P(xbar1 - xbar2 ${greaterThan ? ">" : "<"} ${obsDiff}) = ${prob}`,
      label1: scen.label1,
      label2: scen.label2,
      mu1: `${scen.mu1}`, sigma1: `${scen.sigma1}`, n1: `${scen.n1}`,
      mu2: `${scen.mu2}`, sigma2: `${scen.sigma2}`, n2: `${scen.n2}`,
      obsDiff: `${obsDiff}`,
      direction: direction,
      directionOrMore: directionOrMore,
      probability: `${prob}`,
      probabilityPct: `${probPct}`,
      unusualAnswer: unusualAnswer,
      unit: scen.unit,
      expectedInterpretation: `Getting a difference (${scen.label1} - ${scen.label2}) in sample mean ${scen.measurable}s of ${obsDiff} ${scen.unit} ${directionOrMore} happens in about ${probPct}% of all possible samples of size ${scen.n1} from ${scen.label1} and size ${scen.n2} from ${scen.label2}. This is ${unusualAnswer === "Unusual" ? "" : "not "}unusual.`
    };

    answers = {
      diffMeanInterpretProbText: { value: ctx.expectedInterpretation },
      diffMeanUnusualChoice: { value: unusualAnswer === "Unusual" ? "Unusual — probability is less than 5%" : "Not unusual — probability is 5% or more" }
    };

    scenario = ctx.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L41: 5.8 Capstone ==========
  if (modeId === "l41-capstone-58") {
    const scen = drawFromBag('capstone58', capstone58Bank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: scen.topicId,
      scenarioText: scen.scenarioText,
      givenText: "Apply concepts from Topic 5.8 (Sampling Distributions for Differences in Sample Means).",
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3],
      explanation: scen.explanation,
      expectedExplanation: scen.explanation
    };

    answers = {
      capstone58Answer: { value: scen.correctAnswer },
      capstone58Explain: { value: scen.explanation }
    };

    scenario = scen.scenarioText;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== FALLBACK ==========
  return {
    context: {
      topicId: "?",
      scenarioText: "Mode not implemented.",
      givenText: ""
    },
    graphConfig: null,
    answers: {},
    scenario: "Mode not implemented: " + modeId
  };
}

export default { generateProblem };
