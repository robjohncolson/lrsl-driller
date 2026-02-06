// generator.js - AP Statistics Unit 5 (Topics 5.1–5.2): Sampling Distributions
// Sampling variability, sampling distributions, z-scores, normal probability,
// inverse normal, AP solution elements, assessing normality, linear combinations

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
