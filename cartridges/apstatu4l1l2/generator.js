// generator.js - AP Statistics Unit 4 Lessons 1-8: Probability, Random Variables & Distributions
// Topics: Random processes, outcomes, events, simulation, Law of Large Numbers, sample space, probability rules, complements, mutually exclusive events, conditional probability, independent events, unions, random variables, probability distributions, mean, standard deviation

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

function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  const k = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = result * (n - k + i) / i;
  }
  return result;
}

function binomialProb(n, p, x) {
  return nCr(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x);
}

function geometricProb(p, x) {
  return Math.pow(1 - p, x - 1) * p;
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

// Level 1: Random Process Definition
const randomProcessScenarios = [
  {
    question: "What is a RANDOM PROCESS?",
    answer: "A situation where all outcomes are known but individual results are unpredictable",
    options: [
      "A situation where all outcomes are known but individual results are unpredictable",
      "A situation where outcomes can be calculated using mathematical formulas",
      "A situation where patterns always repeat in a predictable sequence",
      "A situation where the most likely outcome always occurs first"
    ]
  },
  {
    question: "A situation where all possible outcomes are known but individual results cannot be predicted describes which concept?",
    answer: "Random Process",
    options: ["Law of Large Numbers", "Empirical Probability", "Random Process", "Simulation Design"]
  },
  {
    question: "Which of the following is TRUE about a random process?",
    answer: "Individual outcomes are unpredictable, but patterns emerge in the long run",
    options: [
      "Individual outcomes are unpredictable, but patterns emerge in the long run",
      "Each outcome can be predicted if you know the previous outcomes",
      "The most common outcome will always occur next",
      "Results become more predictable after many trials"
    ]
  },
  {
    question: "Flipping a fair coin is a random process because:",
    answer: "We know the possible outcomes (H or T) but cannot predict any single flip",
    options: [
      "We know the possible outcomes (H or T) but cannot predict any single flip",
      "The coin always lands on heads half the time",
      "Each flip depends on the previous flip",
      "We can calculate exactly when heads will occur"
    ]
  },
  {
    question: "Which characteristic defines a random process?",
    answer: "Known possible outcomes with unpredictable individual results",
    options: [
      "Known possible outcomes with unpredictable individual results",
      "Unknown outcomes that can be discovered through experimentation",
      "Predictable patterns that repeat in cycles",
      "Results determined by skill rather than chance"
    ]
  },
  {
    question: "Rolling a die is considered a random process because:",
    answer: "We know 1-6 are possible but cannot predict any single roll",
    options: [
      "We know 1-6 are possible but cannot predict any single roll",
      "The die remembers previous rolls",
      "Some numbers are more likely than others",
      "The outcome depends on how hard you roll"
    ]
  }
];

// Level 2: Outcomes vs Events
const outcomeEventScenarios = [
  {
    desc: "The result of a single trial of a random process",
    type: "Outcome",
    example: "Getting a 4 when rolling a die"
  },
  {
    desc: "A collection of outcomes from a random process",
    type: "Event",
    example: "Rolling a prime number (2, 3, or 5)"
  },
  {
    desc: "Getting heads on one coin flip",
    type: "Outcome",
    example: "Single result"
  },
  {
    desc: "Rolling an even number on a die (2, 4, or 6)",
    type: "Event",
    example: "Multiple outcomes grouped together"
  },
  {
    desc: "Drawing the ace of spades from a deck",
    type: "Outcome",
    example: "One specific result"
  },
  {
    desc: "Drawing any face card (J, Q, K) from a deck",
    type: "Event",
    example: "Collection of 12 possible outcomes"
  },
  {
    desc: "A spinner landing on the number 7",
    type: "Outcome",
    example: "Result of one spin"
  },
  {
    desc: "A spinner landing on a number greater than 5",
    type: "Event",
    example: "Collection of outcomes (6, 7, 8, etc.)"
  },
  {
    desc: "Selecting the name 'Maria' from a hat",
    type: "Outcome",
    example: "One specific selection"
  },
  {
    desc: "Selecting any name that starts with 'M' from a hat",
    type: "Event",
    example: "Collection of possible outcomes"
  }
];

// Level 3: Independence (Gambler's Fallacy)
const independenceScenarios = [
  {
    desc: "After flipping 5 tails in a row, the next flip is more likely to be heads because it's 'due'.",
    correct: "No, the reasoning is flawed",
    explanation: "Each flip is independent - past flips don't affect future probabilities. The probability is still 50%."
  },
  {
    desc: "A basketball player missed her last 4 free throws, so she's due to make the next one.",
    correct: "No, the reasoning is flawed",
    explanation: "Past misses don't make future success more likely. Each attempt has the same probability."
  },
  {
    desc: "The roulette wheel landed on red 8 times in a row, so black is now more likely.",
    correct: "No, the reasoning is flawed",
    explanation: "The wheel has no memory. Each spin is independent with the same probabilities."
  },
  {
    desc: "After rolling a 6 three times, the probability of rolling a 6 on the next roll is still 1/6.",
    correct: "Yes, the reasoning is correct",
    explanation: "Each roll is independent. Past outcomes don't change future probabilities."
  },
  {
    desc: "Since I've lost the last 5 coin flip bets, I should bet bigger because I'm due for a win.",
    correct: "No, the reasoning is flawed",
    explanation: "This is the gambler's fallacy. Each flip has 50-50 odds regardless of past results."
  },
  {
    desc: "A fair coin has landed on heads 10 times in a row. The probability of heads on the next flip is still 50%.",
    correct: "Yes, the reasoning is correct",
    explanation: "Independence means each flip has the same 50% probability regardless of streak."
  },
  {
    desc: "My lottery numbers haven't won in months, so they're more likely to win soon.",
    correct: "No, the reasoning is flawed",
    explanation: "Lottery drawings are independent. Past losses don't increase future winning chances."
  },
  {
    desc: "The weather forecaster says there's a 30% chance of rain tomorrow, regardless of whether it rained today.",
    correct: "Yes, the reasoning is correct",
    explanation: "If the forecast treats days as independent, today's weather doesn't affect tomorrow's probability."
  }
];

// Level 4: Streaks in Random Data
const streakScenarios = [
  {
    desc: "In 100 coin flips, there was a streak of 8 tails in a row.",
    surprising: "No, this is normal",
    explanation: "Streaks of 8+ occur about 32% of the time in 100 flips - quite common!"
  },
  {
    desc: "A student writes a 'random' sequence but never has more than 3 of the same result in a row.",
    surprising: "Yes, this is surprising",
    explanation: "Humans avoid long streaks, but they're normal in truly random data."
  },
  {
    desc: "In truly random data, there are clusters and long runs of the same outcome.",
    surprising: "No, this is normal",
    explanation: "Clusters and streaks are a natural part of random variation."
  },
  {
    desc: "A 'fake' random sequence has perfect alternation: HTHTHTHTHT...",
    surprising: "Yes, this is surprising",
    explanation: "Perfect alternation is too regular - real random sequences have streaks."
  },
  {
    desc: "Out of 100 coin flips, we got exactly 50 heads and 50 tails.",
    surprising: "Yes, this is surprising",
    explanation: "Exactly 50-50 is actually unlikely. Some deviation from 50-50 is normal."
  },
  {
    desc: "In 100 die rolls, we rolled three 6's in a row at some point.",
    surprising: "No, this is normal",
    explanation: "Short streaks of the same number are expected in random data."
  },
  {
    desc: "A random number generator produced the sequence 7-7-7-7 at some point in 1000 numbers.",
    surprising: "No, this is normal",
    explanation: "Repeats and short streaks are part of random variation."
  },
  {
    desc: "When humans try to write random sequences, they typically alternate too frequently.",
    surprising: "No, this is normal",
    explanation: "Humans avoid streaks instinctively, making their sequences look 'too even'."
  }
];

// Level 5: Simulation Definition
const simulationVocabScenarios = [
  {
    question: "What is a SIMULATION?",
    answer: "A way to model random events so simulated outcomes match real-world outcomes",
    options: [
      "A way to model random events so simulated outcomes match real-world outcomes",
      "A mathematical formula for calculating exact probabilities",
      "A method for eliminating all randomness from an experiment",
      "A technique for predicting the next specific outcome"
    ]
  },
  {
    question: "A method that models random events such that simulated outcomes closely match real-world outcomes is called:",
    answer: "Simulation",
    options: ["Empirical Analysis", "Random Sampling", "Theoretical Calculation", "Simulation"]
  },
  {
    question: "Why do we use simulations in statistics?",
    answer: "To estimate probabilities when mathematical calculations are difficult or impossible",
    options: [
      "To estimate probabilities when mathematical calculations are difficult or impossible",
      "To guarantee exact probability values",
      "To eliminate variability from random processes",
      "To predict individual outcomes with certainty"
    ]
  },
  {
    question: "Which is TRUE about simulation?",
    answer: "It uses a chance device to perform many trials of a random process",
    options: [
      "It uses a chance device to perform many trials of a random process",
      "It only works for coin flips and dice",
      "It always gives the exact true probability",
      "One trial is sufficient for accurate results"
    ]
  },
  {
    question: "Simulation is useful because:",
    answer: "Performing many real trials may be expensive, time-consuming, or impossible",
    options: [
      "Performing many real trials may be expensive, time-consuming, or impossible",
      "It eliminates the need for random number generators",
      "It gives exact answers without any trials",
      "Real-world events cannot be modeled mathematically"
    ]
  }
];

// Level 6: Law of Large Numbers
const llnScenarios = [
  {
    question: "What does the LAW OF LARGE NUMBERS state?",
    answer: "Simulated probabilities get closer to true probability as trials increase",
    options: [
      "Simulated probabilities get closer to true probability as trials increase",
      "Each trial becomes more predictable after observing many outcomes",
      "The probability of rare events increases with more trials",
      "Random streaks become less common as sample size grows"
    ]
  },
  {
    question: "The principle that simulated probabilities tend to approach the true probability as the number of trials increases is called:",
    answer: "Law of Large Numbers",
    options: ["Central Limit Theorem", "Law of Large Numbers", "Regression to the Mean", "Probability Convergence"]
  },
  {
    question: "According to the Law of Large Numbers:",
    answer: "More trials bring simulated probability closer to true probability",
    options: [
      "More trials bring simulated probability closer to true probability",
      "Fewer trials give more accurate probability estimates",
      "The number of trials has no effect on accuracy",
      "More trials increase variability in results"
    ]
  },
  {
    question: "If you flip a coin 10 times and get 70% heads, and then flip it 1000 times, the Law of Large Numbers predicts:",
    answer: "The proportion of heads will likely be closer to 50%",
    options: [
      "The proportion of heads will likely be closer to 50%",
      "You will get exactly 50% heads",
      "The coin is unfair",
      "The results will continue to show 70% heads"
    ]
  },
  {
    question: "Why must simulations involve MANY trials rather than just a few?",
    answer: "Variability means single trials don't give reliable estimates",
    options: [
      "Variability means single trials don't give reliable estimates",
      "A few trials always give the exact true probability",
      "More trials increase the randomness of outcomes",
      "Single trials are always perfectly representative"
    ]
  },
  {
    question: "The Law of Large Numbers helps explain why:",
    answer: "Casinos profit in the long run despite individual wins",
    options: [
      "Casinos profit in the long run despite individual wins",
      "Each spin of a roulette wheel is predictable",
      "Gamblers can beat the house with the right strategy",
      "Streaks indicate the wheel is not truly random"
    ]
  }
];

// Level 7: Digit Assignment for Simulations
const digitAssignmentScenarios = [
  {
    desc: "A basketball player makes 82% of her free throws. Assign digits 1-100 to simulate one shot.",
    probability: 82,
    lowBound: 1,
    highBound: 82,
    successLabel: "made shot",
    failureRange: "83-100"
  },
  {
    desc: "A multiple choice question has 4 options, giving a 25% chance of guessing correctly. Assign digits 1-100.",
    probability: 25,
    lowBound: 1,
    highBound: 25,
    successLabel: "correct guess",
    failureRange: "26-100"
  },
  {
    desc: "A spinner has a 60% chance of landing on blue. Assign digits 1-100 to simulate one spin.",
    probability: 60,
    lowBound: 1,
    highBound: 60,
    successLabel: "blue",
    failureRange: "61-100"
  },
  {
    desc: "A fair coin has a 50% chance of landing heads. Assign digits 1-100 to simulate one flip.",
    probability: 50,
    lowBound: 1,
    highBound: 50,
    successLabel: "heads",
    failureRange: "51-100"
  },
  {
    desc: "A medical treatment has a 75% success rate. Assign digits 1-100 to simulate one patient.",
    probability: 75,
    lowBound: 1,
    highBound: 75,
    successLabel: "successful treatment",
    failureRange: "76-100"
  },
  {
    desc: "A die has a 1/6 ≈ 17% chance of rolling a 6. Assign digits 1-100 to simulate one roll.",
    probability: 17,
    lowBound: 1,
    highBound: 17,
    successLabel: "rolling a 6",
    failureRange: "18-100"
  },
  {
    desc: "A factory produces 90% non-defective items. Assign digits 1-100 to simulate one item.",
    probability: 90,
    lowBound: 1,
    highBound: 90,
    successLabel: "non-defective",
    failureRange: "91-100"
  },
  {
    desc: "A baseball player has a .300 (30%) batting average. Assign digits 1-100 to simulate one at-bat.",
    probability: 30,
    lowBound: 1,
    highBound: 30,
    successLabel: "hit",
    failureRange: "31-100"
  }
];

// Level 8: Trial Definition
const trialDefinitionScenarios = [
  {
    desc: "Simulate a basketball player shooting until she misses (82% success rate). What is one trial?",
    answer: "Generate random numbers until getting 83-100 (miss), count made shots",
    options: [
      "Generate random numbers until getting 83-100 (miss), count made shots",
      "Generate exactly 82 random numbers",
      "Flip a coin once",
      "Count how many times you run the simulation"
    ]
  },
  {
    desc: "Simulate a 5-question multiple choice test with random guessing (25% per question). What is one trial?",
    answer: "Generate 5 random numbers, count how many are 1-25 (correct)",
    options: [
      "Generate 5 random numbers, count how many are 1-25 (correct)",
      "Generate one random number for the whole test",
      "Answer all 5 questions correctly",
      "Take the test 5 times"
    ]
  },
  {
    desc: "Estimate the probability of getting at least 3 heads in 5 coin flips. What is one trial?",
    answer: "Flip 5 coins (or generate 5 numbers), record if 3+ are heads",
    options: [
      "Flip 5 coins (or generate 5 numbers), record if 3+ are heads",
      "Flip one coin and see if it's heads",
      "Keep flipping until you get 3 heads",
      "Flip coins until you get 5 heads total"
    ]
  },
  {
    desc: "Simulate rolling a die until you get a 6. What is one trial?",
    answer: "Roll (generate numbers) until getting a 6, count total rolls",
    options: [
      "Roll (generate numbers) until getting a 6, count total rolls",
      "Roll the die exactly 6 times",
      "Roll once and check if it's a 6",
      "Count how many 6's appear in 100 rolls"
    ]
  },
  {
    desc: "Estimate the probability of drawing 2 aces in a row from a shuffled deck (with replacement). What is one trial?",
    answer: "Draw 2 cards, record if both are aces (1-4 in numbers 1-52)",
    options: [
      "Draw 2 cards, record if both are aces (1-4 in numbers 1-52)",
      "Draw cards until you get an ace",
      "Draw one card and see if it's an ace",
      "Draw all 52 cards"
    ]
  }
];

// Level 9: Relative Frequency Calculation
const relativeFrequencyScenarios = [
  {
    desc: "Out of 200 simulated trials, 13 resulted in a streak of 16+ made shots.",
    successes: 13,
    total: 200,
    probability: 6.5
  },
  {
    desc: "Out of 50 simulated trials of 100 coin flips each, 16 had a streak of 8+ same outcomes.",
    successes: 16,
    total: 50,
    probability: 32
  },
  {
    desc: "In 100 simulated trials, 23 resulted in getting at least 3 heads in 5 flips.",
    successes: 23,
    total: 100,
    probability: 23
  },
  {
    desc: "Out of 500 simulated games, 47 ended with the underdog winning.",
    successes: 47,
    total: 500,
    probability: 9.4
  },
  {
    desc: "In 1000 simulations, 312 trials resulted in the desired outcome.",
    successes: 312,
    total: 1000,
    probability: 31.2
  },
  {
    desc: "Out of 400 trials, 84 were successful.",
    successes: 84,
    total: 400,
    probability: 21
  },
  {
    desc: "In 250 simulated experiments, 75 showed the expected result.",
    successes: 75,
    total: 250,
    probability: 30
  },
  {
    desc: "Out of 800 trials, 120 met the success criteria.",
    successes: 120,
    total: 800,
    probability: 15
  }
];

// Level 10: Full Simulation Design
const simulationDesignScenarios = [
  {
    desc: "A basketball player makes 82% of free throws. Design a simulation to estimate the probability of making 16+ consecutive shots.",
    digitAssignment: "1-82 = made shot, 83-100 = missed shot",
    trialDescription: "Generate random numbers until getting 83-100 (miss). Count consecutive makes. Record if count is 16+.",
    probability: 82
  },
  {
    desc: "A multiple choice test has 5 questions with 4 options each. Design a simulation to estimate the probability of getting at least 3 correct by guessing.",
    digitAssignment: "1-25 = correct, 26-100 = incorrect (since 1/4 = 25%)",
    trialDescription: "Generate 5 random numbers. Count how many are 1-25. Record if count is 3 or more.",
    probability: 25
  },
  {
    desc: "A fair coin is flipped 10 times. Design a simulation to estimate the probability of getting exactly 5 heads.",
    digitAssignment: "1-50 = heads, 51-100 = tails (50% each)",
    trialDescription: "Generate 10 random numbers. Count how many are 1-50 (heads). Record if count is exactly 5.",
    probability: 50
  },
  {
    desc: "A spinner has 60% chance of blue and 40% chance of red. Design a simulation for spinning 4 times and getting all blue.",
    digitAssignment: "1-60 = blue, 61-100 = red",
    trialDescription: "Generate 4 random numbers. Check if all are 1-60 (blue). Record success or failure.",
    probability: 60
  },
  {
    desc: "A medical treatment has 75% success rate. Design a simulation for 3 patients all being successfully treated.",
    digitAssignment: "1-75 = success, 76-100 = failure",
    trialDescription: "Generate 3 random numbers. Check if all are 1-75. Record if all 3 succeed.",
    probability: 75
  }
];

// ============ TOPIC 4.3 SCENARIO BANKS ============

// Level 12: Sample Space Identification
const sampleSpaceScenarios = [
  {
    desc: "Flip a single coin.",
    answer: "{H, T}",
    options: ["{H, T}", "{Heads}", "{H, T, HT}", "{1, 2}"],
    explanation: "A coin has exactly two possible outcomes: Heads (H) or Tails (T)."
  },
  {
    desc: "Roll a single six-sided die.",
    answer: "{1, 2, 3, 4, 5, 6}",
    options: ["{1, 2, 3, 4, 5, 6}", "{1, 6}", "{2, 3, 4, 5}", "{even, odd}"],
    explanation: "A die can land on any of the six faces: 1, 2, 3, 4, 5, or 6."
  },
  {
    desc: "Flip two coins and record the sequence.",
    answer: "{HH, HT, TH, TT}",
    options: ["{HH, HT, TH, TT}", "{HH, TT}", "{H, T}", "{0, 1, 2}"],
    explanation: "Order matters: HT (heads then tails) is different from TH (tails then heads)."
  },
  {
    desc: "Randomly select a vowel from the English alphabet.",
    answer: "{A, E, I, O, U}",
    options: ["{A, E, I, O, U}", "{A, E, I, O, U, Y}", "{vowel, consonant}", "{A, B, C, D, E}"],
    explanation: "The standard vowels are A, E, I, O, and U."
  },
  {
    desc: "Roll a die and record whether the result is even or odd.",
    answer: "{Even, Odd}",
    options: ["{Even, Odd}", "{1, 2, 3, 4, 5, 6}", "{2, 4, 6}", "{1, 3, 5}"],
    explanation: "When we only record even/odd, those are our two possible outcomes."
  },
  {
    desc: "Draw a card from a standard deck and record the suit.",
    answer: "{Hearts, Diamonds, Clubs, Spades}",
    options: ["{Hearts, Diamonds, Clubs, Spades}", "{Red, Black}", "{Ace, 2, 3, ..., King}", "{1, 2, 3, ..., 52}"],
    explanation: "The four suits are Hearts, Diamonds, Clubs, and Spades."
  },
  {
    desc: "A traffic light is observed. Record its color.",
    answer: "{Red, Yellow, Green}",
    options: ["{Red, Yellow, Green}", "{Stop, Go}", "{Red, Green}", "{On, Off}"],
    explanation: "Traffic lights cycle through three colors: Red, Yellow, and Green."
  },
  {
    desc: "Spin a spinner divided into 4 equal sections: A, B, C, D.",
    answer: "{A, B, C, D}",
    options: ["{A, B, C, D}", "{1, 2, 3, 4}", "{A, D}", "{A, B}"],
    explanation: "The spinner can land on any of the four sections."
  },
  {
    desc: "Flip three coins and record the sequence.",
    answer: "{HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}",
    options: ["{HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}", "{HHH, TTT}", "{0, 1, 2, 3}", "{H, T}"],
    explanation: "With 3 coins, there are 2³ = 8 possible sequences."
  },
  {
    desc: "Count the number of heads when flipping two coins.",
    answer: "{0, 1, 2}",
    options: ["{0, 1, 2}", "{HH, HT, TH, TT}", "{H, T}", "{1, 2}"],
    explanation: "We could get 0 heads (TT), 1 head (HT or TH), or 2 heads (HH)."
  }
];

// Level 13: Valid Probability Model
const validProbabilityScenarios = [
  {
    desc: "P(A) = 0.3, P(B) = 0.5, P(C) = 0.2",
    valid: true,
    reason: "All between 0-1 and sum to 1.0",
    options: ["All between 0-1 and sum to 1.0", "Sum is not 1", "Contains negative probability", "Probability exceeds 1"]
  },
  {
    desc: "P(A) = 0.4, P(B) = 0.4, P(C) = 0.3",
    valid: false,
    reason: "Sum is 1.1, not 1",
    options: ["Sum is 1.1, not 1", "All between 0-1 and sum to 1.0", "Contains negative probability", "All values equal"]
  },
  {
    desc: "P(A) = 0.5, P(B) = -0.1, P(C) = 0.6",
    valid: false,
    reason: "Contains negative probability (-0.1)",
    options: ["Contains negative probability (-0.1)", "Sum is not 1", "All between 0-1 and sum to 1.0", "Probability exceeds 1"]
  },
  {
    desc: "P(A) = 0.2, P(B) = 0.3, P(C) = 0.4, P(D) = 0.1",
    valid: true,
    reason: "All between 0-1 and sum to 1.0",
    options: ["All between 0-1 and sum to 1.0", "Sum is not 1", "Too many outcomes", "Contains zero probability"]
  },
  {
    desc: "P(A) = 1.2, P(B) = 0.3, P(C) = -0.5",
    valid: false,
    reason: "P(A) > 1 and P(C) < 0",
    options: ["P(A) > 1 and P(C) < 0", "All between 0-1 and sum to 1.0", "Sum is not 1", "Only two problems"]
  },
  {
    desc: "P(A) = 0.25, P(B) = 0.25, P(C) = 0.25, P(D) = 0.25",
    valid: true,
    reason: "All between 0-1 and sum to 1.0",
    options: ["All between 0-1 and sum to 1.0", "All probabilities must be different", "Sum is not 1", "Contains zero probability"]
  },
  {
    desc: "P(A) = 0.6, P(B) = 0.3",
    valid: false,
    reason: "Sum is 0.9, not 1",
    options: ["Sum is 0.9, not 1", "All between 0-1 and sum to 1.0", "Not enough outcomes", "Probabilities too high"]
  },
  {
    desc: "P(A) = 0, P(B) = 0.7, P(C) = 0.3",
    valid: true,
    reason: "All between 0-1 and sum to 1.0",
    options: ["All between 0-1 and sum to 1.0", "P(A) = 0 is not allowed", "Sum is not 1", "Must have positive probabilities"]
  },
  {
    desc: "P(A) = 0.333, P(B) = 0.333, P(C) = 0.334",
    valid: true,
    reason: "All between 0-1 and sum to 1.0",
    options: ["All between 0-1 and sum to 1.0", "Sum is not exactly 1", "Contains repeating decimals", "Probabilities not equal"]
  },
  {
    desc: "P(A) = 0.5, P(B) = 0.5, P(C) = 0.5",
    valid: false,
    reason: "Sum is 1.5, not 1",
    options: ["Sum is 1.5, not 1", "All between 0-1 and sum to 1.0", "Too many equal values", "Contains no zero"]
  }
];

// Level 14: Complement Rule
const complementScenarios = [
  {
    desc: "P(rain) = 0.35. Find P(no rain).",
    given: 0.35,
    answer: 0.65,
    eventName: "rain",
    complementName: "no rain"
  },
  {
    desc: "P(pass the test) = 0.82. Find P(fail the test).",
    given: 0.82,
    answer: 0.18,
    eventName: "pass",
    complementName: "fail"
  },
  {
    desc: "P(defective item) = 0.08. Find P(non-defective item).",
    given: 0.08,
    answer: 0.92,
    eventName: "defective",
    complementName: "non-defective"
  },
  {
    desc: "P(win the game) = 0.45. Find P(not win the game).",
    given: 0.45,
    answer: 0.55,
    eventName: "win",
    complementName: "not win"
  },
  {
    desc: "P(sunny day) = 0.7. Find P(not sunny).",
    given: 0.7,
    answer: 0.3,
    eventName: "sunny",
    complementName: "not sunny"
  },
  {
    desc: "P(drawing a heart) = 0.25. Find P(not drawing a heart).",
    given: 0.25,
    answer: 0.75,
    eventName: "heart",
    complementName: "not a heart"
  },
  {
    desc: "P(rolling a 6) = 1/6 ≈ 0.167. Find P(not rolling a 6).",
    given: 0.167,
    answer: 0.833,
    eventName: "rolling a 6",
    complementName: "not rolling a 6"
  },
  {
    desc: "P(student is left-handed) = 0.10. Find P(student is right-handed or ambidextrous).",
    given: 0.10,
    answer: 0.90,
    eventName: "left-handed",
    complementName: "not left-handed"
  },
  {
    desc: "P(flight on time) = 0.78. Find P(flight delayed).",
    given: 0.78,
    answer: 0.22,
    eventName: "on time",
    complementName: "delayed"
  },
  {
    desc: "P(correct answer by guessing on 4-option MC) = 0.25. Find P(incorrect).",
    given: 0.25,
    answer: 0.75,
    eventName: "correct",
    complementName: "incorrect"
  }
];

// Level 15: "At Least One" Problems
const atLeastOneScenarios = [
  {
    desc: "A coin is flipped 3 times. P(heads on each flip) = 0.5. Find P(at least one heads).",
    pNone: 0.125,  // 0.5^3
    answer: 0.875,
    explanation: "P(no heads) = 0.5³ = 0.125, so P(at least 1 heads) = 1 - 0.125 = 0.875"
  },
  {
    desc: "Roll a die 2 times. P(6 on each roll) = 1/6. Find P(at least one 6).",
    pNone: 0.694,  // (5/6)^2
    answer: 0.306,
    explanation: "P(no 6's) = (5/6)² ≈ 0.694, so P(at least one 6) = 1 - 0.694 ≈ 0.306"
  },
  {
    desc: "A basketball player makes 80% of free throws. In 4 shots, find P(at least one make).",
    pNone: 0.0016,  // 0.2^4
    answer: 0.9984,
    explanation: "P(miss all 4) = 0.2⁴ = 0.0016, so P(at least 1 make) = 1 - 0.0016 = 0.9984"
  },
  {
    desc: "P(defective) = 0.05. In a batch of 3 items, find P(at least one defective).",
    pNone: 0.857,  // 0.95^3
    answer: 0.143,
    explanation: "P(none defective) = 0.95³ ≈ 0.857, so P(at least 1 defective) = 1 - 0.857 ≈ 0.143"
  },
  {
    desc: "P(win a raffle) = 0.1. If you enter 5 times, find P(at least one win).",
    pNone: 0.590,  // 0.9^5
    answer: 0.410,
    explanation: "P(no wins) = 0.9⁵ ≈ 0.590, so P(at least 1 win) = 1 - 0.590 ≈ 0.410"
  },
  {
    desc: "A fair coin is flipped 5 times. Find P(at least one tails).",
    pNone: 0.031,  // 0.5^5
    answer: 0.969,
    explanation: "P(all heads) = 0.5⁵ ≈ 0.031, so P(at least 1 tails) = 1 - 0.031 ≈ 0.969"
  },
  {
    desc: "P(server crash on any day) = 0.02. Find P(at least one crash in 10 days).",
    pNone: 0.817,  // 0.98^10
    answer: 0.183,
    explanation: "P(no crashes) = 0.98¹⁰ ≈ 0.817, so P(at least 1 crash) = 1 - 0.817 ≈ 0.183"
  },
  {
    desc: "P(correct answer by guessing) = 0.25. On 4 questions, find P(at least one correct).",
    pNone: 0.316,  // 0.75^4
    answer: 0.684,
    explanation: "P(all wrong) = 0.75⁴ ≈ 0.316, so P(at least 1 correct) = 1 - 0.316 ≈ 0.684"
  }
];

// ============ TOPIC 4.4 SCENARIO BANKS ============

// Level 17: Mutually Exclusive Definition
const mutuallyExclusiveDefScenarios = [
  {
    question: "What does it mean for two events to be MUTUALLY EXCLUSIVE?",
    answer: "They cannot occur at the same time",
    options: [
      "They cannot occur at the same time",
      "They always occur together",
      "They have the same probability",
      "One causes the other to happen"
    ]
  },
  {
    question: "Another term for 'mutually exclusive' events is:",
    answer: "Disjoint",
    options: ["Disjoint", "Independent", "Conditional", "Complementary"]
  },
  {
    question: "If two events are mutually exclusive, then P(A ∩ B) equals:",
    answer: "0",
    options: ["0", "1", "P(A) + P(B)", "P(A) × P(B)"]
  },
  {
    question: "Which statement is TRUE about mutually exclusive events?",
    answer: "Their intersection is empty (no common outcomes)",
    options: [
      "Their intersection is empty (no common outcomes)",
      "They must have equal probabilities",
      "One event causes the other",
      "They always happen at the same time"
    ]
  },
  {
    question: "In a Venn diagram, mutually exclusive events are shown as:",
    answer: "Two circles that do NOT overlap",
    options: [
      "Two circles that do NOT overlap",
      "Two circles that completely overlap",
      "One circle inside the other",
      "Two identical circles"
    ]
  },
  {
    question: "Being a freshman AND being a sophomore at the same school is:",
    answer: "Impossible - these events are mutually exclusive",
    options: [
      "Impossible - these events are mutually exclusive",
      "Possible but unlikely",
      "Always true",
      "Depends on the school"
    ]
  },
  {
    question: "The symbol ∩ in probability represents:",
    answer: "The intersection (AND) - both events occur",
    options: [
      "The intersection (AND) - both events occur",
      "The union (OR) - at least one event occurs",
      "The complement (NOT) - event doesn't occur",
      "The probability of the first event"
    ]
  },
  {
    question: "P(A ∩ B) is called the:",
    answer: "Joint probability",
    options: ["Joint probability", "Marginal probability", "Conditional probability", "Complement probability"]
  }
];

// Level 18: Joint Probability Calculation
const jointProbabilityScenarios = [
  {
    desc: "A survey of 200 students asked about favorite subject and grade level.",
    table: { name: "School Survey", totalStudents: 200, rows: ["Freshman", "Sophomore"], cols: ["Math", "English"], data: [[45, 55], [60, 40]] },
    eventA: "Freshman",
    eventB: "Math",
    intersection: 45,
    total: 200,
    answer: 0.225
  },
  {
    desc: "433 students were asked about superpowers and status preferences.",
    table: { name: "Super Status!", totalStudents: 433, rows: ["Fly", "Freeze Time", "Invisibility"], cols: ["Famous", "Happy", "Rich"], data: [[5, 48, 22], [3, 63, 26], [3, 62, 22]] },
    eventA: "Fly",
    eventB: "Happy",
    intersection: 48,
    total: 433,
    answer: 0.111
  },
  {
    desc: "300 employees were surveyed about department and years of experience.",
    table: { name: "Employee Survey", totalStudents: 300, rows: ["Sales", "Engineering", "Marketing"], cols: ["<5 years", "5+ years"], data: [[40, 35], [55, 70], [45, 55]] },
    eventA: "Engineering",
    eventB: "5+ years",
    intersection: 70,
    total: 300,
    answer: 0.233
  },
  {
    desc: "150 customers rated their satisfaction and purchase frequency.",
    table: { name: "Customer Survey", totalStudents: 150, rows: ["Satisfied", "Neutral", "Dissatisfied"], cols: ["Frequent", "Occasional", "Rare"], data: [[25, 30, 10], [15, 20, 15], [5, 10, 20]] },
    eventA: "Satisfied",
    eventB: "Frequent",
    intersection: 25,
    total: 150,
    answer: 0.167
  },
  {
    desc: "400 voters were polled about age group and candidate preference.",
    table: { name: "Voter Poll", totalStudents: 400, rows: ["18-30", "31-50", "51+"], cols: ["Candidate A", "Candidate B"], data: [[60, 50], [80, 70], [65, 75]] },
    eventA: "18-30",
    eventB: "Candidate A",
    intersection: 60,
    total: 400,
    answer: 0.150
  },
  {
    desc: "250 patients were categorized by treatment type and recovery speed.",
    table: { name: "Patient Study", totalStudents: 250, rows: ["Treatment A", "Treatment B"], cols: ["Fast Recovery", "Slow Recovery"], data: [[80, 45], [70, 55]] },
    eventA: "Treatment A",
    eventB: "Fast Recovery",
    intersection: 80,
    total: 250,
    answer: 0.320
  },
  {
    desc: "180 students were surveyed about study habits and test performance.",
    table: { name: "Study Survey", totalStudents: 180, rows: ["Studies Daily", "Studies Weekly", "Rarely Studies"], cols: ["Passed", "Failed"], data: [[55, 5], [40, 20], [20, 40]] },
    eventA: "Studies Daily",
    eventB: "Passed",
    intersection: 55,
    total: 180,
    answer: 0.306
  },
  {
    desc: "360 athletes were tracked by sport and injury status this season.",
    table: { name: "Athlete Data", totalStudents: 360, rows: ["Basketball", "Football", "Soccer"], cols: ["Injured", "Not Injured"], data: [[25, 95], [40, 80], [20, 100]] },
    eventA: "Football",
    eventB: "Injured",
    intersection: 40,
    total: 360,
    answer: 0.111
  }
];

// Level 19: Identifying Mutually Exclusive Events
const identifyMEScenarios = [
  {
    desc: "In a survey, P(Famous ∩ Telepathy) = 0",
    intersection: 0,
    isME: true,
    explanation: "Since the intersection probability is 0, no students chose both Famous AND Telepathy. These events are mutually exclusive."
  },
  {
    desc: "In a study, P(Happy ∩ Freeze Time) = 0.145",
    intersection: 0.145,
    isME: false,
    explanation: "Since P(A ∩ B) > 0, some people are both Happy AND chose Freeze Time. These events are NOT mutually exclusive."
  },
  {
    desc: "For a die roll, P(Even ∩ Odd) = 0",
    intersection: 0,
    isME: true,
    explanation: "A number cannot be both even AND odd. These events are mutually exclusive."
  },
  {
    desc: "For a die roll, P(Even ∩ Prime) = 1/6",
    intersection: 0.167,
    isME: false,
    explanation: "The number 2 is both even AND prime, so P(Even ∩ Prime) = 1/6 > 0. Not mutually exclusive."
  },
  {
    desc: "In a class, P(Freshman ∩ Sophomore) = 0",
    intersection: 0,
    isME: true,
    explanation: "A student cannot be both a freshman AND a sophomore simultaneously. These are mutually exclusive."
  },
  {
    desc: "In a survey, P(Math Lover ∩ Freshman) = 0.225",
    intersection: 0.225,
    isME: false,
    explanation: "Some freshmen love math! Since the intersection is greater than 0, these events are NOT mutually exclusive."
  },
  {
    desc: "For a single card draw, P(Heart ∩ Spade) = 0",
    intersection: 0,
    isME: true,
    explanation: "A single card cannot be both a heart AND a spade. These are mutually exclusive."
  },
  {
    desc: "For a single card draw, P(Red ∩ Face Card) = 6/52",
    intersection: 0.115,
    isME: false,
    explanation: "There are 6 red face cards (J, Q, K of hearts and diamonds). Since P > 0, not mutually exclusive."
  },
  {
    desc: "At a school, P(Plays Sports ∩ In Band) = 0.08",
    intersection: 0.08,
    isME: false,
    explanation: "Some students both play sports AND are in band. Since P > 0, these events are NOT mutually exclusive."
  },
  {
    desc: "In a hospital, P(Has Flu ∩ Has COVID) = 0.001",
    intersection: 0.001,
    isME: false,
    explanation: "Even though rare, some patients have BOTH infections. Since P > 0 (not exactly 0), these are NOT mutually exclusive."
  }
];

// ============ TOPIC 4.5 SCENARIO BANKS ============

// Level 20: Conditional Probability Definition
const conditionalDefScenarios = [
  {
    question: "What does P(B|A) represent?",
    answer: "The probability of B given that A has occurred",
    options: [
      "The probability of B given that A has occurred",
      "The probability of A and B both occurring",
      "The probability of A or B occurring",
      "The probability of A given that B has occurred"
    ]
  },
  {
    question: "The notation P(B|A) is read as:",
    answer: "The probability of B given A",
    options: [
      "The probability of B given A",
      "The probability of B and A",
      "The probability of B or A",
      "The probability of B minus A"
    ]
  },
  {
    question: "The formula for conditional probability is:",
    answer: "P(B|A) = P(A ∩ B) / P(A)",
    options: [
      "P(B|A) = P(A ∩ B) / P(A)",
      "P(B|A) = P(A ∩ B) / P(B)",
      "P(B|A) = P(A) × P(B)",
      "P(B|A) = P(A) + P(B)"
    ]
  },
  {
    question: "In conditional probability P(B|A), what does the vertical bar | mean?",
    answer: "'Given' or 'knowing that'",
    options: [
      "'Given' or 'knowing that'",
      "'And' (intersection)",
      "'Or' (union)",
      "'Divided by'"
    ]
  },
  {
    question: "When calculating P(B|A), we are restricting our sample space to:",
    answer: "Only the outcomes where A has occurred",
    options: [
      "Only the outcomes where A has occurred",
      "All possible outcomes",
      "Only the outcomes where B has occurred",
      "Outcomes where neither A nor B occurred"
    ]
  },
  {
    question: "If we know event A happened, we use conditional probability because:",
    answer: "The probability of B may change based on this new information",
    options: [
      "The probability of B may change based on this new information",
      "The probability of B always stays the same",
      "We can ignore event A completely",
      "Events A and B must be independent"
    ]
  },
  {
    question: "The general multiplication rule states:",
    answer: "P(A ∩ B) = P(A) × P(B|A)",
    options: [
      "P(A ∩ B) = P(A) × P(B|A)",
      "P(A ∩ B) = P(A) + P(B|A)",
      "P(A ∩ B) = P(A) / P(B|A)",
      "P(A ∩ B) = P(A) - P(B|A)"
    ]
  },
  {
    question: "P(A|B) and P(B|A) are:",
    answer: "Generally NOT equal - order matters!",
    options: [
      "Generally NOT equal - order matters!",
      "Always equal to each other",
      "Always equal to P(A ∩ B)",
      "Always equal to 0.5"
    ]
  }
];

// Level 21: Conditional Probability from Two-Way Tables
const conditionalTableScenarios = [
  {
    desc: "Using the school survey: P(Math | Freshman) = ?",
    table: { rows: ["Freshman", "Sophomore"], cols: ["Math", "English"], data: [[45, 55], [60, 40]], rowTotals: [100, 100], colTotals: [105, 95], total: 200 },
    condition: "Freshman",
    target: "Math",
    numerator: 45,
    denominator: 100,
    answer: 0.45
  },
  {
    desc: "Using the school survey: P(Math | Sophomore) = ?",
    table: { rows: ["Freshman", "Sophomore"], cols: ["Math", "English"], data: [[45, 55], [60, 40]], rowTotals: [100, 100], colTotals: [105, 95], total: 200 },
    condition: "Sophomore",
    target: "Math",
    numerator: 60,
    denominator: 100,
    answer: 0.60
  },
  {
    desc: "Using the Super Status! data: P(Rich | Fly) = ?",
    table: { rows: ["Fly", "Freeze Time", "Invisibility"], cols: ["Famous", "Happy", "Rich"], data: [[5, 48, 22], [3, 63, 26], [3, 62, 22]], rowTotals: [89, 101, 98], total: 433 },
    condition: "Fly",
    target: "Rich",
    numerator: 22,
    denominator: 89,
    answer: 0.247
  },
  {
    desc: "Using the Super Status! data: P(Fly | Rich) = ?",
    table: { rows: ["Fly", "Freeze Time", "Invisibility"], cols: ["Famous", "Happy", "Rich"], data: [[5, 48, 22], [3, 63, 26], [3, 62, 22]], colTotals: [15, 265, 102], total: 433 },
    condition: "Rich",
    target: "Fly",
    numerator: 22,
    denominator: 102,
    answer: 0.216
  },
  {
    desc: "Using employee data: P(5+ years | Engineering) = ?",
    table: { rows: ["Sales", "Engineering", "Marketing"], cols: ["<5 years", "5+ years"], data: [[40, 35], [55, 70], [45, 55]], rowTotals: [75, 125, 100], total: 300 },
    condition: "Engineering",
    target: "5+ years",
    numerator: 70,
    denominator: 125,
    answer: 0.56
  },
  {
    desc: "Using customer data: P(Satisfied | Frequent) = ?",
    table: { rows: ["Satisfied", "Neutral", "Dissatisfied"], cols: ["Frequent", "Occasional", "Rare"], data: [[25, 30, 10], [15, 20, 15], [5, 10, 20]], colTotals: [45, 60, 45], total: 150 },
    condition: "Frequent",
    target: "Satisfied",
    numerator: 25,
    denominator: 45,
    answer: 0.556
  },
  {
    desc: "Using study data: P(Passed | Studies Daily) = ?",
    table: { rows: ["Studies Daily", "Studies Weekly", "Rarely Studies"], cols: ["Passed", "Failed"], data: [[55, 5], [40, 20], [20, 40]], rowTotals: [60, 60, 60], total: 180 },
    condition: "Studies Daily",
    target: "Passed",
    numerator: 55,
    denominator: 60,
    answer: 0.917
  },
  {
    desc: "Using study data: P(Studies Daily | Passed) = ?",
    table: { rows: ["Studies Daily", "Studies Weekly", "Rarely Studies"], cols: ["Passed", "Failed"], data: [[55, 5], [40, 20], [20, 40]], colTotals: [115, 65], total: 180 },
    condition: "Passed",
    target: "Studies Daily",
    numerator: 55,
    denominator: 115,
    answer: 0.478
  }
];

// Level 22: General Multiplication Rule
const multiplicationRuleScenarios = [
  {
    desc: "A bag has 10 marbles (4 red, 6 blue). You draw 2 marbles WITHOUT replacement. Find P(both red).",
    pA: 0.4,
    pBgivenA: 0.333,
    answer: 0.133,
    explanation: "P(1st red) = 4/10. Given 1st red, P(2nd red) = 3/9. So P(both) = (4/10)(3/9) = 12/90 ≈ 0.133"
  },
  {
    desc: "A deck has 52 cards. Draw 2 cards WITHOUT replacement. Find P(both are aces).",
    pA: 0.077,
    pBgivenA: 0.059,
    answer: 0.005,
    explanation: "P(1st ace) = 4/52. Given 1st ace, P(2nd ace) = 3/51. So P(both) = (4/52)(3/51) ≈ 0.005"
  },
  {
    desc: "80% of students passed the midterm. Of those who passed, 90% also passed the final. Find P(passed both).",
    pA: 0.8,
    pBgivenA: 0.9,
    answer: 0.72,
    explanation: "P(passed midterm) = 0.80. P(passed final | passed midterm) = 0.90. P(both) = (0.80)(0.90) = 0.72"
  },
  {
    desc: "In a factory, 95% of products pass inspection 1. Of those, 98% pass inspection 2. Find P(passes both).",
    pA: 0.95,
    pBgivenA: 0.98,
    answer: 0.931,
    explanation: "P(pass 1) = 0.95. P(pass 2 | pass 1) = 0.98. P(both) = (0.95)(0.98) = 0.931"
  },
  {
    desc: "A jar has 8 red and 12 blue candies. Pick 2 WITHOUT replacement. Find P(both blue).",
    pA: 0.6,
    pBgivenA: 0.579,
    answer: 0.347,
    explanation: "P(1st blue) = 12/20 = 0.6. Given 1st blue, P(2nd blue) = 11/19. P(both) = (12/20)(11/19) ≈ 0.347"
  },
  {
    desc: "70% of applicants have experience. Of those, 60% get interviews. Find P(experience AND interview).",
    pA: 0.7,
    pBgivenA: 0.6,
    answer: 0.42,
    explanation: "P(experience) = 0.70. P(interview | experience) = 0.60. P(both) = (0.70)(0.60) = 0.42"
  },
  {
    desc: "A bag has 5 red, 5 blue marbles. Draw 2 WITHOUT replacement. Find P(1st red AND 2nd blue).",
    pA: 0.5,
    pBgivenA: 0.556,
    answer: 0.278,
    explanation: "P(1st red) = 5/10 = 0.5. Given 1st red, P(2nd blue) = 5/9. P(red then blue) = (5/10)(5/9) ≈ 0.278"
  },
  {
    desc: "60% of emails are spam. Of spam emails, 85% are caught by the filter. Find P(spam AND caught).",
    pA: 0.6,
    pBgivenA: 0.85,
    answer: 0.51,
    explanation: "P(spam) = 0.60. P(caught | spam) = 0.85. P(spam and caught) = (0.60)(0.85) = 0.51"
  }
];

// Level 23: Order Matters - P(A|B) vs P(B|A)
const orderMattersScenarios = [
  {
    desc: "Compare: P(Math | Freshman) vs P(Freshman | Math) from a school survey where 45 students are both Freshman AND like Math, 100 total Freshmen, 105 total Math lovers, 200 total students.",
    pAgivenB: 0.45,
    pBgivenA: 0.429,
    eventA: "Freshman",
    eventB: "Math",
    n_AandB: 45,
    n_A: 100,
    n_B: 105,
    total: 200
  },
  {
    desc: "Compare: P(Rich | Fly) vs P(Fly | Rich) from Super Status! where 22 students chose both Fly AND Rich, 89 chose Fly, 102 chose Rich, 433 total.",
    pAgivenB: 0.247,
    pBgivenA: 0.216,
    eventA: "Fly",
    eventB: "Rich",
    n_AandB: 22,
    n_A: 89,
    n_B: 102,
    total: 433
  },
  {
    desc: "Compare: P(Passed | Studies Daily) vs P(Studies Daily | Passed) where 55 students both study daily AND passed, 60 study daily, 115 passed, 180 total.",
    pAgivenB: 0.917,
    pBgivenA: 0.478,
    eventA: "Studies Daily",
    eventB: "Passed",
    n_AandB: 55,
    n_A: 60,
    n_B: 115,
    total: 180
  },
  {
    desc: "Compare: P(Satisfied | Frequent) vs P(Frequent | Satisfied) where 25 are both, 45 are Frequent, 65 are Satisfied, 150 total.",
    pAgivenB: 0.556,
    pBgivenA: 0.385,
    eventA: "Frequent",
    eventB: "Satisfied",
    n_AandB: 25,
    n_A: 45,
    n_B: 65,
    total: 150
  },
  {
    desc: "Compare: P(Engineering | 5+ years) vs P(5+ years | Engineering) where 70 are both, 160 have 5+ years, 125 are in Engineering, 300 total.",
    pAgivenB: 0.438,
    pBgivenA: 0.56,
    eventA: "5+ years",
    eventB: "Engineering",
    n_AandB: 70,
    n_A: 160,
    n_B: 125,
    total: 300
  },
  {
    desc: "Compare: P(Injured | Football) vs P(Football | Injured) where 40 football players are injured, 120 play football, 85 total injured, 360 athletes.",
    pAgivenB: 0.333,
    pBgivenA: 0.471,
    eventA: "Football",
    eventB: "Injured",
    n_AandB: 40,
    n_A: 120,
    n_B: 85,
    total: 360
  }
];

// Level 24: Mixed 4.4-4.5 Capstone
const mixed44_45Scenarios = [
  {
    desc: "If P(A ∩ B) = 0, what can we conclude about events A and B?",
    answer: "A and B are mutually exclusive (disjoint)",
    options: [
      "A and B are mutually exclusive (disjoint)",
      "A and B are independent",
      "P(A) = 0",
      "P(B|A) = 1"
    ],
    concept: "Mutually exclusive definition",
    explanation: "When P(A ∩ B) = 0, no outcomes are in both events, meaning they cannot occur together - the definition of mutually exclusive."
  },
  {
    desc: "To find P(B|A), the correct denominator is:",
    answer: "The total for event A (the condition)",
    options: [
      "The total for event A (the condition)",
      "The grand total of all outcomes",
      "The total for event B",
      "P(A ∩ B)"
    ],
    concept: "Conditional probability formula",
    explanation: "P(B|A) = P(A ∩ B) / P(A). The denominator is P(A), the condition that we know has occurred."
  },
  {
    desc: "P(A|B) = 0.6 and P(B|A) = 0.4. What can we conclude?",
    answer: "This is possible - order matters in conditional probability",
    options: [
      "This is possible - order matters in conditional probability",
      "This is impossible - they must be equal",
      "One of these must be wrong",
      "The events must be independent"
    ],
    concept: "Order matters",
    explanation: "P(A|B) and P(B|A) are generally NOT equal. The probability depends on which event is the condition."
  },
  {
    desc: "Two events have a small but non-zero intersection. Are they mutually exclusive?",
    answer: "No - mutually exclusive requires P(A ∩ B) = 0 exactly",
    options: [
      "No - mutually exclusive requires P(A ∩ B) = 0 exactly",
      "Yes - a small intersection counts as mutually exclusive",
      "Yes - if P < 0.05, it's mutually exclusive",
      "It depends on the sample size"
    ],
    concept: "Mutually exclusive vs. small probability",
    explanation: "Mutually exclusive means P(A ∩ B) = 0 EXACTLY. Any non-zero intersection means the events CAN occur together."
  },
  {
    desc: "P(A) = 0.5, P(B|A) = 0.6. Find P(A ∩ B) using the multiplication rule.",
    answer: "0.30",
    options: ["0.30", "1.10", "0.83", "0.20"],
    concept: "Multiplication rule",
    explanation: "P(A ∩ B) = P(A) × P(B|A) = 0.5 × 0.6 = 0.30"
  },
  {
    desc: "In a two-way table, the joint probability uses which total?",
    answer: "The grand total (all observations)",
    options: [
      "The grand total (all observations)",
      "The row total",
      "The column total",
      "The cell count only"
    ],
    concept: "Joint vs conditional probability",
    explanation: "Joint probability P(A ∩ B) = (cell count) / (grand total). Conditional probability uses the row or column total."
  },
  {
    desc: "A bag has 4 red and 6 blue marbles. Drawing WITHOUT replacement, what is P(2nd red | 1st red)?",
    answer: "3/9 or about 0.333",
    options: [
      "3/9 or about 0.333",
      "4/10 or 0.4",
      "4/9 or about 0.444",
      "3/10 or 0.3"
    ],
    concept: "Conditional probability without replacement",
    explanation: "After drawing a red, 3 red remain out of 9 total. So P(2nd red | 1st red) = 3/9 ≈ 0.333"
  },
  {
    desc: "Which correctly calculates P(A ∩ B) from a two-way table?",
    answer: "(Number in cell A and B) / (Grand total)",
    options: [
      "(Number in cell A and B) / (Grand total)",
      "(Number in cell A and B) / (Row total)",
      "(Row total) × (Column total)",
      "(Number in cell A and B) / (Column total)"
    ],
    concept: "Joint probability from tables",
    explanation: "P(A ∩ B) = (intersection count) / (grand total). This is different from conditional probability."
  }
];

// Level 16: Mixed 4.3 Practice
const mixed43Scenarios = [
  {
    desc: "If P(A) = 0.6, what is P(A')? (Complement)",
    answer: "0.4",
    options: ["0.4", "0.6", "1.4", "0.36"],
    concept: "Complement rule",
    explanation: "P(A') = 1 - P(A) = 1 - 0.6 = 0.4"
  },
  {
    desc: "A valid probability distribution must have probabilities that sum to:",
    answer: "1",
    options: ["1", "0", "100", "Any positive number"],
    concept: "Valid probability model",
    explanation: "The sum of all probabilities in a valid distribution must equal 1."
  },
  {
    desc: "What is the sample space for rolling a die and noting if the result is prime?",
    answer: "{Prime, Not Prime}",
    options: ["{Prime, Not Prime}", "{2, 3, 5}", "{1, 2, 3, 4, 5, 6}", "{Yes, No, Maybe}"],
    concept: "Sample space",
    explanation: "We only record whether it's prime or not, so those are our two outcomes."
  },
  {
    desc: "P(at least one) is BEST calculated using:",
    answer: "1 - P(none)",
    options: ["1 - P(none)", "P(one) + P(two) + ...", "P(all)", "1 / total outcomes"],
    concept: "At least one strategy",
    explanation: "The complement approach: P(at least 1) = 1 - P(none) is usually easier."
  },
  {
    desc: "If all probabilities are between 0 and 1 but sum to 0.95, is it a valid probability model?",
    answer: "No, sum must equal 1",
    options: ["No, sum must equal 1", "Yes, it's close enough", "Yes, all values are valid", "Only if rounded"],
    concept: "Valid probability model",
    explanation: "Both conditions must be met: each prob 0-1 AND sum to exactly 1."
  },
  {
    desc: "P(not A) = 0.7. What is P(A)?",
    answer: "0.3",
    options: ["0.3", "0.7", "1.7", "-0.3"],
    concept: "Complement rule (reverse)",
    explanation: "P(A) = 1 - P(not A) = 1 - 0.7 = 0.3"
  },
  {
    desc: "Flip 2 coins. How many outcomes are in the sample space (recording sequence)?",
    answer: "4",
    options: ["4", "2", "3", "6"],
    concept: "Sample space counting",
    explanation: "The outcomes are {HH, HT, TH, TT} = 4 outcomes."
  },
  {
    desc: "Why use P(at least 1) = 1 - P(none) instead of adding all positive cases?",
    answer: "It's usually simpler—only one probability to calculate",
    options: ["It's usually simpler—only one probability to calculate", "The other method is wrong", "They give different answers", "The complement is always larger"],
    concept: "At least one efficiency",
    explanation: "Adding P(1) + P(2) + ... can be tedious. The complement only needs P(none)."
  }
];

// ============ TOPIC 4.6 SCENARIO BANKS ============

// Level 25: Independent Events Definition
const independentDefScenarios = [
  {
    question: "What does it mean for two events to be INDEPENDENT?",
    answer: "Knowing one event occurred doesn't change the probability of the other",
    options: [
      "Knowing one event occurred doesn't change the probability of the other",
      "The events cannot occur at the same time",
      "The events always occur together",
      "The events have the same probability"
    ]
  },
  {
    question: "Events A and B are independent if:",
    answer: "P(A|B) = P(A)",
    options: [
      "P(A|B) = P(A)",
      "P(A ∩ B) = 0",
      "P(A) + P(B) = 1",
      "P(A|B) = P(B|A)"
    ]
  },
  {
    question: "An equivalent definition of independence is:",
    answer: "P(A ∩ B) = P(A) × P(B)",
    options: [
      "P(A ∩ B) = P(A) × P(B)",
      "P(A ∩ B) = 0",
      "P(A ∪ B) = P(A) + P(B)",
      "P(A ∩ B) = P(A) / P(B)"
    ]
  },
  {
    question: "Which scenario describes INDEPENDENT events?",
    answer: "Flipping a coin twice - each flip is 50% regardless of the first flip",
    options: [
      "Flipping a coin twice - each flip is 50% regardless of the first flip",
      "Drawing cards WITHOUT replacement - second draw depends on first",
      "Choosing a freshman and a sophomore from the same student",
      "Rolling a sum of 7 on two dice that add up to 7"
    ]
  },
  {
    question: "If P(A) = 0.4 and A and B are independent, then P(A|B) equals:",
    answer: "0.4",
    options: ["0.4", "0", "1", "Cannot determine without P(B)"]
  },
  {
    question: "Which is TRUE about independent events?",
    answer: "Independent events CAN occur at the same time",
    options: [
      "Independent events CAN occur at the same time",
      "Independent events CANNOT occur at the same time",
      "Independent events must have P(A ∩ B) = 0",
      "Independent events always have P(A) = P(B)"
    ]
  },
  {
    question: "Drawing marbles WITH replacement results in:",
    answer: "Independent draws - each draw has the same probability",
    options: [
      "Independent draws - each draw has the same probability",
      "Dependent draws - probabilities change",
      "Mutually exclusive draws",
      "Cannot determine"
    ]
  },
  {
    question: "For independent events, P(B|A) equals:",
    answer: "P(B) - knowing A doesn't change B's probability",
    options: [
      "P(B) - knowing A doesn't change B's probability",
      "P(A ∩ B) / P(B)",
      "0 because they can't happen together",
      "P(A) because the events are the same"
    ]
  }
];

// Level 26: Check Independence - Conditional Method
const checkIndepCondScenarios = [
  {
    desc: "A survey shows P(Happy) = 0.60 and P(Happy | Freeze Time) = 0.62. Are Happy and Freeze Time independent?",
    pA: 0.60,
    pAgivenB: 0.62,
    isIndep: false,
    explanation: "P(Happy|Freeze Time) = 0.62 ≠ 0.60 = P(Happy). Since knowing 'Freeze Time' changes the probability of 'Happy', they are NOT independent."
  },
  {
    desc: "For a die roll: P(Even) = 0.5 and P(Even | Greater than 2) = 0.5. Are these events independent?",
    pA: 0.5,
    pAgivenB: 0.5,
    isIndep: true,
    explanation: "P(Even|>2) = 0.5 = P(Even). Knowing the number is greater than 2 doesn't change the probability of it being even."
  },
  {
    desc: "At a school: P(Plays Sports) = 0.45 and P(Plays Sports | In Band) = 0.32. Are these independent?",
    pA: 0.45,
    pAgivenB: 0.32,
    isIndep: false,
    explanation: "P(Plays Sports|In Band) = 0.32 ≠ 0.45 = P(Plays Sports). Knowing a student is in Band changes the probability they play sports."
  },
  {
    desc: "Coin flips: P(Heads on flip 2) = 0.5 and P(Heads on flip 2 | Heads on flip 1) = 0.5. Independent?",
    pA: 0.5,
    pAgivenB: 0.5,
    isIndep: true,
    explanation: "P(H2|H1) = 0.5 = P(H2). The first flip doesn't affect the second flip - they are independent."
  },
  {
    desc: "Weather: P(Rain tomorrow) = 0.30 and P(Rain tomorrow | Rain today) = 0.55. Are these independent?",
    pA: 0.30,
    pAgivenB: 0.55,
    isIndep: false,
    explanation: "P(Rain tomorrow|Rain today) = 0.55 ≠ 0.30. Knowing it rained today affects the probability of rain tomorrow - NOT independent."
  },
  {
    desc: "From What's the News: P(Uses Internet) = 0.72 and P(Uses Internet | College Grad) = 0.72. Independent?",
    pA: 0.72,
    pAgivenB: 0.72,
    isIndep: true,
    explanation: "P(Internet|College) = 0.72 = P(Internet). Education level doesn't change internet usage probability in this data - independent."
  },
  {
    desc: "Study habits: P(Passed) = 0.64 and P(Passed | Studies Daily) = 0.92. Are these independent?",
    pA: 0.64,
    pAgivenB: 0.92,
    isIndep: false,
    explanation: "P(Passed|Studies Daily) = 0.92 ≠ 0.64 = P(Passed). Studying daily greatly increases passing probability - NOT independent."
  },
  {
    desc: "Dice: P(Die 1 is 6) = 1/6 and P(Die 1 is 6 | Die 2 is 6) = 1/6. Are these independent?",
    pA: 0.167,
    pAgivenB: 0.167,
    isIndep: true,
    explanation: "P(Die1=6|Die2=6) = 1/6 = P(Die1=6). What happens on Die 2 doesn't affect Die 1 - independent."
  }
];

// Level 27: Check Independence - Multiplication Method
const checkIndepMultScenarios = [
  {
    desc: "Given: P(E) = 0.4, P(F) = 0.6, P(E ∩ F) = 0.25. Are E and F independent?",
    pA: 0.4,
    pB: 0.6,
    pAB: 0.25,
    pA_times_pB: 0.24,
    isIndep: false,
    explanation: "P(E) × P(F) = 0.4 × 0.6 = 0.24 ≠ 0.25 = P(E ∩ F). Since these aren't equal, E and F are NOT independent."
  },
  {
    desc: "Given: P(A) = 0.5, P(B) = 0.3, P(A ∩ B) = 0.15. Are A and B independent?",
    pA: 0.5,
    pB: 0.3,
    pAB: 0.15,
    pA_times_pB: 0.15,
    isIndep: true,
    explanation: "P(A) × P(B) = 0.5 × 0.3 = 0.15 = P(A ∩ B). These are equal, so A and B ARE independent."
  },
  {
    desc: "Given: P(Math) = 0.525, P(Freshman) = 0.5, P(Math ∩ Freshman) = 0.225. Are Math and Freshman independent?",
    pA: 0.525,
    pB: 0.5,
    pAB: 0.225,
    pA_times_pB: 0.2625,
    isIndep: false,
    explanation: "P(Math) × P(Freshman) = 0.525 × 0.5 = 0.2625 ≠ 0.225. Not equal, so NOT independent."
  },
  {
    desc: "Given: P(Odd) = 0.5, P(Prime) = 0.5 for a die. P(Odd ∩ Prime) = 0.333. Independent?",
    pA: 0.5,
    pB: 0.5,
    pAB: 0.333,
    pA_times_pB: 0.25,
    isIndep: false,
    explanation: "P(Odd) × P(Prime) = 0.5 × 0.5 = 0.25 ≠ 0.333. Odd and Prime on a die are NOT independent."
  },
  {
    desc: "Given: P(Red marble 1st) = 0.4, P(Red marble 2nd WITH replacement) = 0.4, P(Both Red) = 0.16. Independent?",
    pA: 0.4,
    pB: 0.4,
    pAB: 0.16,
    pA_times_pB: 0.16,
    isIndep: true,
    explanation: "P(R1) × P(R2) = 0.4 × 0.4 = 0.16 = P(Both Red). With replacement, draws ARE independent."
  },
  {
    desc: "Given: P(Rain) = 0.2, P(Traffic) = 0.3, P(Rain ∩ Traffic) = 0.09. Are Rain and Traffic independent?",
    pA: 0.2,
    pB: 0.3,
    pAB: 0.09,
    pA_times_pB: 0.06,
    isIndep: false,
    explanation: "P(Rain) × P(Traffic) = 0.2 × 0.3 = 0.06 ≠ 0.09. Rain and Traffic are NOT independent (rain causes more traffic)."
  },
  {
    desc: "Given: P(Heads flip 1) = 0.5, P(Heads flip 2) = 0.5, P(Both Heads) = 0.25. Independent?",
    pA: 0.5,
    pB: 0.5,
    pAB: 0.25,
    pA_times_pB: 0.25,
    isIndep: true,
    explanation: "P(H1) × P(H2) = 0.5 × 0.5 = 0.25 = P(Both Heads). Coin flips ARE independent."
  },
  {
    desc: "Given: P(Defect A) = 0.05, P(Defect B) = 0.08, P(Both Defects) = 0.004. Independent?",
    pA: 0.05,
    pB: 0.08,
    pAB: 0.004,
    pA_times_pB: 0.004,
    isIndep: true,
    explanation: "P(A) × P(B) = 0.05 × 0.08 = 0.004 = P(A ∩ B). These defects ARE independent."
  }
];

// Level 28: Multiplication Rule for Independent Events
const multIndepScenarios = [
  {
    desc: "A bag has 4 red and 6 blue marbles. You draw 2 marbles WITH replacement. Find P(both red).",
    pA: 0.4,
    pB: 0.4,
    answer: 0.16,
    explanation: "With replacement, draws are independent. P(both red) = 0.4 × 0.4 = 0.16"
  },
  {
    desc: "A coin is flipped 3 times. Find P(all heads).",
    pA: 0.5,
    pB: 0.5,
    pC: 0.5,
    answer: 0.125,
    explanation: "Coin flips are independent. P(HHH) = 0.5 × 0.5 × 0.5 = 0.125"
  },
  {
    desc: "Two dice are rolled. Find P(both show 6).",
    pA: 0.167,
    pB: 0.167,
    answer: 0.028,
    explanation: "Dice rolls are independent. P(both 6) = (1/6) × (1/6) = 1/36 ≈ 0.028"
  },
  {
    desc: "P(student passes math) = 0.8 and P(student passes English) = 0.75. If these are independent, find P(passes both).",
    pA: 0.8,
    pB: 0.75,
    answer: 0.6,
    explanation: "If independent: P(both) = 0.8 × 0.75 = 0.6"
  },
  {
    desc: "A machine has two independent components. P(A works) = 0.95, P(B works) = 0.90. Find P(both work).",
    pA: 0.95,
    pB: 0.90,
    answer: 0.855,
    explanation: "Independent: P(both work) = 0.95 × 0.90 = 0.855"
  },
  {
    desc: "Two spinners: P(blue on spinner 1) = 0.3, P(blue on spinner 2) = 0.5. Find P(both blue).",
    pA: 0.3,
    pB: 0.5,
    answer: 0.15,
    explanation: "Spinner results are independent. P(both blue) = 0.3 × 0.5 = 0.15"
  },
  {
    desc: "A basketball player makes 70% of free throws. Find P(makes both shots), assuming independence.",
    pA: 0.7,
    pB: 0.7,
    answer: 0.49,
    explanation: "If independent: P(makes both) = 0.7 × 0.7 = 0.49"
  },
  {
    desc: "P(rain today) = 0.3 and P(rain tomorrow) = 0.4, assuming independence. Find P(rain both days).",
    pA: 0.3,
    pB: 0.4,
    answer: 0.12,
    explanation: "If independent: P(both rainy) = 0.3 × 0.4 = 0.12"
  }
];

// Level 29: Addition Rule Definition
const additionRuleDefScenarios = [
  {
    question: "The Addition Rule states:",
    answer: "P(A or B) = P(A) + P(B) - P(A ∩ B)",
    options: [
      "P(A or B) = P(A) + P(B) - P(A ∩ B)",
      "P(A or B) = P(A) × P(B)",
      "P(A or B) = P(A) + P(B)",
      "P(A or B) = P(A) - P(B)"
    ]
  },
  {
    question: "Why do we subtract P(A ∩ B) in the Addition Rule?",
    answer: "To avoid counting the intersection twice",
    options: [
      "To avoid counting the intersection twice",
      "Because A and B are mutually exclusive",
      "To make the probability smaller",
      "Because P(A ∩ B) is always negative"
    ]
  },
  {
    question: "For MUTUALLY EXCLUSIVE events, the Addition Rule simplifies to:",
    answer: "P(A or B) = P(A) + P(B)",
    options: [
      "P(A or B) = P(A) + P(B)",
      "P(A or B) = P(A) × P(B)",
      "P(A or B) = P(A) + P(B) - P(A ∩ B)",
      "P(A or B) = 1"
    ]
  },
  {
    question: "The symbol ∪ in probability represents:",
    answer: "Union (OR) - at least one event occurs",
    options: [
      "Union (OR) - at least one event occurs",
      "Intersection (AND) - both events occur",
      "Complement (NOT) - event doesn't occur",
      "Independent events"
    ]
  },
  {
    question: "P(A ∪ B) means the probability that:",
    answer: "A occurs, B occurs, or both occur",
    options: [
      "A occurs, B occurs, or both occur",
      "Both A and B occur",
      "Neither A nor B occurs",
      "A occurs but B doesn't"
    ]
  },
  {
    question: "If P(A) = 0.5, P(B) = 0.4, and P(A ∩ B) = 0.2, then P(A or B) equals:",
    answer: "0.7",
    options: ["0.7", "0.9", "0.2", "0.1"]
  },
  {
    question: "If events A and B are mutually exclusive with P(A) = 0.3 and P(B) = 0.4, then P(A or B) equals:",
    answer: "0.7",
    options: ["0.7", "0.12", "0.0", "1.0"]
  },
  {
    question: "The Addition Rule is used to find:",
    answer: "The probability that at least one of two events occurs",
    options: [
      "The probability that at least one of two events occurs",
      "The probability that both events occur",
      "The probability that neither event occurs",
      "The probability of independent events"
    ]
  }
];

// Level 30: Calculate Union
const calculateUnionScenarios = [
  {
    desc: "P(A) = 0.5, P(B) = 0.4, P(A ∩ B) = 0.2. Find P(A or B).",
    pA: 0.5,
    pB: 0.4,
    pAB: 0.2,
    answer: 0.7,
    isME: false,
    explanation: "P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.5 + 0.4 - 0.2 = 0.7"
  },
  {
    desc: "P(Rain) = 0.3, P(Cloudy) = 0.6, P(Rain ∩ Cloudy) = 0.25. Find P(Rain or Cloudy).",
    pA: 0.3,
    pB: 0.6,
    pAB: 0.25,
    answer: 0.65,
    isME: false,
    explanation: "P(Rain ∪ Cloudy) = 0.3 + 0.6 - 0.25 = 0.65"
  },
  {
    desc: "Events A and B are mutually exclusive. P(A) = 0.35, P(B) = 0.45. Find P(A or B).",
    pA: 0.35,
    pB: 0.45,
    pAB: 0,
    answer: 0.80,
    isME: true,
    explanation: "Mutually exclusive: P(A ∪ B) = P(A) + P(B) = 0.35 + 0.45 = 0.80"
  },
  {
    desc: "For a die: P(Even) = 0.5, P(Greater than 4) = 0.333, P(Even ∩ >4) = 0.167. Find P(Even or >4).",
    pA: 0.5,
    pB: 0.333,
    pAB: 0.167,
    answer: 0.667,
    isME: false,
    explanation: "P(Even ∪ >4) = 0.5 + 0.333 - 0.167 = 0.667 (outcomes: 2,4,5,6)"
  },
  {
    desc: "P(Freshman) = 0.25, P(Senior) = 0.30. These are mutually exclusive. Find P(Freshman or Senior).",
    pA: 0.25,
    pB: 0.30,
    pAB: 0,
    answer: 0.55,
    isME: true,
    explanation: "Mutually exclusive: P(Fresh ∪ Senior) = 0.25 + 0.30 = 0.55"
  },
  {
    desc: "P(Math) = 0.525, P(Female) = 0.48, P(Math ∩ Female) = 0.26. Find P(Math or Female).",
    pA: 0.525,
    pB: 0.48,
    pAB: 0.26,
    answer: 0.745,
    isME: false,
    explanation: "P(Math ∪ Female) = 0.525 + 0.48 - 0.26 = 0.745"
  },
  {
    desc: "Card draw: P(Heart) = 0.25, P(Face Card) = 0.231, P(Heart ∩ Face) = 0.058. Find P(Heart or Face Card).",
    pA: 0.25,
    pB: 0.231,
    pAB: 0.058,
    answer: 0.423,
    isME: false,
    explanation: "P(Heart ∪ Face) = 0.25 + 0.231 - 0.058 = 0.423"
  },
  {
    desc: "P(Red ball) = 0.4, P(Blue ball) = 0.35. These are mutually exclusive (one ball). Find P(Red or Blue).",
    pA: 0.4,
    pB: 0.35,
    pAB: 0,
    answer: 0.75,
    isME: true,
    explanation: "One ball can't be both colors: P(Red ∪ Blue) = 0.4 + 0.35 = 0.75"
  }
];

// Level 31: Independent vs Mutually Exclusive
const indepVsMEScenarios = [
  {
    desc: "Flipping two coins: Event A = Heads on coin 1, Event B = Heads on coin 2. P(A ∩ B) = 0.25, P(A) = 0.5, P(B) = 0.5.",
    relationship: "Independent but NOT mutually exclusive",
    explanation: "P(A)×P(B) = 0.25 = P(A ∩ B), so independent. P(A ∩ B) > 0, so NOT mutually exclusive. They CAN and DO occur together."
  },
  {
    desc: "Rolling a die: Event A = Rolling a 1, Event B = Rolling a 6. P(A ∩ B) = 0.",
    relationship: "Mutually exclusive but NOT independent",
    explanation: "P(A ∩ B) = 0, so mutually exclusive. But P(A|B) = 0 ≠ 1/6 = P(A), so NOT independent."
  },
  {
    desc: "Drawing a card: Event A = Red card, Event B = Heart. P(A) = 0.5, P(B) = 0.25, P(A ∩ B) = 0.25.",
    relationship: "Neither independent NOR mutually exclusive",
    explanation: "P(A)×P(B) = 0.125 ≠ 0.25, so NOT independent. P(A ∩ B) = 0.25 > 0, so NOT mutually exclusive."
  },
  {
    desc: "Two machines: P(A fails) = 0.1, P(B fails) = 0.1, P(both fail) = 0.01. Failures are independent.",
    relationship: "Independent but NOT mutually exclusive",
    explanation: "P(A)×P(B) = 0.01 = P(A ∩ B), confirming independence. P(A ∩ B) > 0, so they CAN both fail (not ME)."
  },
  {
    desc: "Student grades: Event A = Getting an A, Event B = Getting a B. P(A ∩ B) = 0.",
    relationship: "Mutually exclusive but NOT independent",
    explanation: "Can't get both A and B on same assignment (ME). But knowing you got A means B probability becomes 0 (not independent)."
  },
  {
    desc: "Spinners: P(Red on S1) = 0.3, P(Blue on S2) = 0.4, P(Red on S1 AND Blue on S2) = 0.12.",
    relationship: "Independent but NOT mutually exclusive",
    explanation: "P(R)×P(B) = 0.12 = P(R ∩ B), so independent. P(R ∩ B) > 0, so can occur together (not ME)."
  },
  {
    desc: "Weather: P(Sunny) = 0.6, P(Rainy) = 0.3, P(Sunny ∩ Rainy) = 0.",
    relationship: "Mutually exclusive but NOT independent",
    explanation: "Can't be both sunny and rainy (ME). But P(Sunny|Rainy) = 0 ≠ 0.6 = P(Sunny), so NOT independent."
  },
  {
    desc: "Survey: P(Happy) = 0.4, P(Rich preference) = 0.3, P(Happy ∩ Rich) = 0.12.",
    relationship: "Independent but NOT mutually exclusive",
    explanation: "P(Happy)×P(Rich) = 0.12 = P(Happy ∩ Rich), so independent. They can be both (not ME)."
  }
];

// Level 32: Mixed 4.6 Capstone
const mixed46Scenarios = [
  {
    desc: "If P(A) = 0.3, P(B) = 0.5, and A and B are INDEPENDENT, what is P(A ∩ B)?",
    answer: "0.15",
    options: ["0.15", "0.80", "0", "0.65"],
    concept: "Multiplication rule for independent events",
    explanation: "For independent events: P(A ∩ B) = P(A) × P(B) = 0.3 × 0.5 = 0.15"
  },
  {
    desc: "Events A and B are mutually exclusive with P(A) = 0.4 and P(B) = 0.35. What is P(A or B)?",
    answer: "0.75",
    options: ["0.75", "0.14", "0.05", "1.0"],
    concept: "Addition rule for mutually exclusive events",
    explanation: "Mutually exclusive means P(A ∩ B) = 0, so P(A ∪ B) = P(A) + P(B) = 0.4 + 0.35 = 0.75"
  },
  {
    desc: "Can two events be BOTH independent AND mutually exclusive (assuming both have non-zero probability)?",
    answer: "No - mutually exclusive events with P > 0 are always dependent",
    options: [
      "No - mutually exclusive events with P > 0 are always dependent",
      "Yes - these concepts are the same",
      "Yes - they're unrelated concepts",
      "Only if P(A) = P(B)"
    ],
    concept: "Independent vs mutually exclusive distinction",
    explanation: "If ME, then P(A ∩ B) = 0. If independent, P(A ∩ B) = P(A)×P(B). Both can only be true if P(A)=0 or P(B)=0."
  },
  {
    desc: "P(A) = 0.6, P(B) = 0.5, P(A ∩ B) = 0.2. What is P(A or B)?",
    answer: "0.9",
    options: ["0.9", "1.1", "0.3", "0.7"],
    concept: "General addition rule",
    explanation: "P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.6 + 0.5 - 0.2 = 0.9"
  },
  {
    desc: "If P(A|B) = P(A), what can you conclude about events A and B?",
    answer: "A and B are independent",
    options: [
      "A and B are independent",
      "A and B are mutually exclusive",
      "A and B are complementary",
      "P(A ∩ B) = 0"
    ],
    concept: "Definition of independence",
    explanation: "P(A|B) = P(A) is the definition of independence. Knowing B doesn't change A's probability."
  },
  {
    desc: "A coin is flipped 4 times. What is P(at least one heads)?",
    answer: "0.9375 (using complement: 1 - 0.5⁴)",
    options: ["0.9375 (using complement: 1 - 0.5⁴)", "0.5", "0.25", "0.0625"],
    concept: "At least one with independent events",
    explanation: "P(at least 1 H) = 1 - P(no H) = 1 - (0.5)⁴ = 1 - 0.0625 = 0.9375"
  },
  {
    desc: "Which is the key difference between independent and mutually exclusive events?",
    answer: "Independent events CAN occur together; mutually exclusive events CANNOT",
    options: [
      "Independent events CAN occur together; mutually exclusive events CANNOT",
      "They are the same concept with different names",
      "Independent events cannot occur together",
      "Mutually exclusive events always occur together"
    ],
    concept: "Distinguishing independent from mutually exclusive",
    explanation: "Independent: occurrence of one doesn't affect the other's probability. ME: they cannot both occur."
  },
  {
    desc: "P(A) = 0.4, P(B) = 0.5. If A and B are independent, what is P(B|A)?",
    answer: "0.5 - independence means P(B|A) = P(B)",
    options: ["0.5 - independence means P(B|A) = P(B)", "0.4", "0.2", "0.9"],
    concept: "Conditional probability with independence",
    explanation: "For independent events, P(B|A) = P(B). Knowing A occurred doesn't change B's probability."
  }
];

// ============ TOPIC 4.7-4.8 SCENARIOS ============

// Level 33: Random Variable Definition
const randomVarDefScenarios = [
  {
    question: "What is a RANDOM VARIABLE?",
    answer: "A numerical outcome of random behavior",
    options: [
      "A numerical outcome of random behavior",
      "A variable that is always unpredictable",
      "The sample space of an experiment",
      "A variable that can only be 0 or 1"
    ]
  },
  {
    question: "Which of the following is a correctly defined random variable?",
    answer: "X = the number of heads in 10 coin flips",
    options: [
      "X = the number of heads in 10 coin flips",
      "X = the coin flip results",
      "X = heads or tails",
      "X = whether you win or lose"
    ]
  },
  {
    question: "Random variables are always represented by:",
    answer: "Capital letters (like X, Y, W)",
    options: [
      "Capital letters (like X, Y, W)",
      "Lowercase letters (like x, y, w)",
      "Greek letters (like μ, σ)",
      "Numbers only"
    ]
  },
  {
    question: "If X = time (minutes) to run a mile, X is a random variable because:",
    answer: "The exact time varies randomly for each person selected",
    options: [
      "The exact time varies randomly for each person selected",
      "Time is always measured in minutes",
      "Everyone runs at different speeds",
      "Running is a physical activity"
    ]
  },
  {
    question: "Which is NOT a random variable?",
    answer: "The constant π = 3.14159...",
    options: [
      "The constant π = 3.14159...",
      "Number of students absent today",
      "Time until next earthquake",
      "Height of a randomly selected person"
    ]
  },
  {
    question: "Y = the number of pups in a randomly selected prairie dog litter. This is a random variable because:",
    answer: "The number varies unpredictably from litter to litter",
    options: [
      "The number varies unpredictably from litter to litter",
      "Prairie dogs have different numbers of pups",
      "We defined it with a capital letter",
      "Litter size can be counted"
    ]
  }
];

// Level 34: Discrete vs Continuous
const discreteVsContinuousScenarios = [
  {
    desc: "X = the number of children in a randomly selected household",
    type: "Discrete",
    explanation: "You can only have whole numbers of children (0, 1, 2, 3...). There are spaces between values - you can't have 2.7 children."
  },
  {
    desc: "W = the time (minutes) it takes a randomly selected person to run a mile",
    type: "Continuous",
    explanation: "Time is measured on a continuous scale. Between any two times (like 5 min and 6 min), there are infinite possible values."
  },
  {
    desc: "L = the length (cm) of a randomly selected person's index finger",
    type: "Continuous",
    explanation: "Length is a measurement that can take any value in an interval. There's no 'gap' between possible lengths."
  },
  {
    desc: "Y = the number of dogs with a location chip out of 10 randomly selected dogs",
    type: "Discrete",
    explanation: "Counts of dogs must be whole numbers: 0, 1, 2, ..., 10. You can list all possible values."
  },
  {
    desc: "T = the temperature (°F) at noon tomorrow",
    type: "Continuous",
    explanation: "Temperature can be any value in a range - 72.3°F, 72.31°F, etc. Infinite possible values between any two temperatures."
  },
  {
    desc: "N = the number of text messages you receive today",
    type: "Discrete",
    explanation: "You can count text messages: 0, 1, 2, 3... You can't receive 5.5 messages."
  },
  {
    desc: "H = the height (inches) of a randomly selected basketball player",
    type: "Continuous",
    explanation: "Height is a continuous measurement. A player could be 75.234 inches tall - infinite precision possible."
  },
  {
    desc: "S = the sum of two rolled dice",
    type: "Discrete",
    explanation: "The sum can only be 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, or 12. Countable, specific values with gaps between them."
  },
  {
    desc: "G = the amount of gas (gallons) needed to fill a randomly selected car's tank",
    type: "Continuous",
    explanation: "Volume is continuous - you could need 12.347 gallons. Any value in a range is possible."
  },
  {
    desc: "R = the number of red lights you hit on your commute",
    type: "Discrete",
    explanation: "Counting red lights: 0, 1, 2, 3... You can't hit 2.5 red lights."
  }
];

// Level 35: Valid Probability Distribution for Random Variables
const validProbDistScenarios = [
  {
    table: { x: [1, 2, 3, 4], p: [0.15, 0.40, 0.30, 0.15] },
    isValid: true,
    reason: "All probabilities 0-1 and sum to 1",
    explanation: "Each P(X) is between 0 and 1. Sum = 0.15 + 0.40 + 0.30 + 0.15 = 1.00 ✓"
  },
  {
    table: { x: [0, 1, 2, 3], p: [0.20, 0.35, 0.30, 0.20] },
    isValid: false,
    reason: "Probabilities sum to 1.05, not 1",
    explanation: "Sum = 0.20 + 0.35 + 0.30 + 0.20 = 1.05 ≠ 1. Probabilities must sum to exactly 1."
  },
  {
    table: { x: [1, 2, 3, 4, 5], p: [0.10, 0.20, 0.35, 0.20, 0.15] },
    isValid: true,
    reason: "All probabilities 0-1 and sum to 1",
    explanation: "Each P(X) is between 0 and 1. Sum = 0.10 + 0.20 + 0.35 + 0.20 + 0.15 = 1.00 ✓"
  },
  {
    table: { x: [0, 1, 2], p: [0.50, 0.60, -0.10] },
    isValid: false,
    reason: "Probability cannot be negative",
    explanation: "P(X=2) = -0.10 is invalid. All probabilities must be between 0 and 1, inclusive."
  },
  {
    table: { x: [1, 2, 3, 4, 5, 6, 7], p: [0.15, 0.38, 0.27, 0.11, 0.05, 0.03, 0.01] },
    isValid: true,
    reason: "All probabilities 0-1 and sum to 1",
    explanation: "This is the prairie dog pups distribution. Sum = 1.00 ✓"
  },
  {
    table: { x: [1, 2, 3], p: [0.30, 0.40, 0.20] },
    isValid: false,
    reason: "Probabilities sum to 0.90, not 1",
    explanation: "Sum = 0.30 + 0.40 + 0.20 = 0.90 ≠ 1. Missing 0.10 probability somewhere."
  },
  {
    table: { x: [0, 1, 2, 3, 4, 5, 6], p: [0.03, 0.03, 0.05, 0.18, 0.31, 0.28, 0.12] },
    isValid: true,
    reason: "All probabilities 0-1 and sum to 1",
    explanation: "This is the thermostat distribution. Sum = 1.00 ✓"
  },
  {
    table: { x: [1, 2, 3, 4], p: [0.25, 1.20, 0.30, 0.25] },
    isValid: false,
    reason: "Probability 1.20 exceeds maximum of 1",
    explanation: "P(X=2) = 1.20 > 1 is invalid. No probability can exceed 1."
  }
];

// Level 36: Probability from Distribution Table
const probFromDistScenarios = [
  {
    desc: "Prairie dog pups: X = number of pups. Distribution: P(1)=0.15, P(2)=0.38, P(3)=0.27, P(4)=0.11, P(5)=0.05, P(6)=0.03, P(7)=0.01",
    question: "Find P(X ≤ 2)",
    calculation: "0.15 + 0.38",
    answer: 0.53,
    explanation: "P(X ≤ 2) = P(1) + P(2) = 0.15 + 0.38 = 0.53"
  },
  {
    desc: "Prairie dog pups: X = number of pups. Distribution: P(1)=0.15, P(2)=0.38, P(3)=0.27, P(4)=0.11, P(5)=0.05, P(6)=0.03, P(7)=0.01",
    question: "Find P(X ≥ 5)",
    calculation: "0.05 + 0.03 + 0.01",
    answer: 0.09,
    explanation: "P(X ≥ 5) = P(5) + P(6) + P(7) = 0.05 + 0.03 + 0.01 = 0.09"
  },
  {
    desc: "Thermostat settings: X = degrees below 78°. P(0)=0.03, P(1)=0.03, P(2)=0.05, P(3)=0.18, P(4)=0.31, P(5)=0.28, P(6)=0.12",
    question: "Find P(X ≥ 4) - probability thermostat is at 74° or lower",
    calculation: "0.31 + 0.28 + 0.12",
    answer: 0.71,
    explanation: "P(X ≥ 4) = P(4) + P(5) + P(6) = 0.31 + 0.28 + 0.12 = 0.71"
  },
  {
    desc: "Thermostat settings: X = degrees below 78°. P(0)=0.03, P(1)=0.03, P(2)=0.05, P(3)=0.18, P(4)=0.31, P(5)=0.28, P(6)=0.12",
    question: "Find P(X < 3) - probability thermostat is above 75°",
    calculation: "0.03 + 0.03 + 0.05",
    answer: 0.11,
    explanation: "P(X < 3) = P(0) + P(1) + P(2) = 0.03 + 0.03 + 0.05 = 0.11"
  },
  {
    desc: "Roll two dice. X = sum. P(2)=1/36, P(3)=2/36, P(4)=3/36, P(5)=4/36, P(6)=5/36, P(7)=6/36, P(8)=5/36, P(9)=4/36, P(10)=3/36, P(11)=2/36, P(12)=1/36",
    question: "Find P(X ≥ 10)",
    calculation: "3/36 + 2/36 + 1/36",
    answer: 0.167,
    explanation: "P(X ≥ 10) = P(10) + P(11) + P(12) = 3/36 + 2/36 + 1/36 = 6/36 ≈ 0.167"
  },
  {
    desc: "Roll two dice. X = sum. P(2)=1/36, P(3)=2/36, ..., P(7)=6/36, ..., P(12)=1/36",
    question: "Find P(X = 7 or X = 11)",
    calculation: "6/36 + 2/36",
    answer: 0.222,
    explanation: "P(7 or 11) = P(7) + P(11) = 6/36 + 2/36 = 8/36 ≈ 0.222"
  },
  {
    desc: "Prairie dog pups: X = number of pups. Distribution: P(1)=0.15, P(2)=0.38, P(3)=0.27, P(4)=0.11, P(5)=0.05, P(6)=0.03, P(7)=0.01",
    question: "Find P(2 ≤ X ≤ 4)",
    calculation: "0.38 + 0.27 + 0.11",
    answer: 0.76,
    explanation: "P(2 ≤ X ≤ 4) = P(2) + P(3) + P(4) = 0.38 + 0.27 + 0.11 = 0.76"
  },
  {
    desc: "Thermostat settings: X = degrees below 78°. P(0)=0.03, P(1)=0.03, P(2)=0.05, P(3)=0.18, P(4)=0.31, P(5)=0.28, P(6)=0.12",
    question: "Find P(3 ≤ X ≤ 5)",
    calculation: "0.18 + 0.31 + 0.28",
    answer: 0.77,
    explanation: "P(3 ≤ X ≤ 5) = P(3) + P(4) + P(5) = 0.18 + 0.31 + 0.28 = 0.77"
  }
];

// Level 37: Describe Distribution (Shape, Center, Spread)
const describeDistScenarios = [
  {
    name: "Prairie dog pups",
    dist: "P(1)=0.15, P(2)=0.38, P(3)=0.27, P(4)=0.11, P(5)=0.05, P(6)=0.03, P(7)=0.01",
    shape: "Skewed right",
    center: "Median is 2 pups",
    spread: "Range is 6 pups (7-1)",
    shapeExplanation: "Most probability is concentrated at low values (1-3 pups), with a tail extending toward higher values (4-7 pups)."
  },
  {
    name: "Thermostat settings (X = degrees below 78°)",
    dist: "P(0)=0.03, P(1)=0.03, P(2)=0.05, P(3)=0.18, P(4)=0.31, P(5)=0.28, P(6)=0.12",
    shape: "Skewed left",
    center: "Median is 4 (74°F)",
    spread: "Range is 6 degrees",
    shapeExplanation: "Most probability is at higher X values (4-6), with a tail extending toward lower values (0-2)."
  },
  {
    name: "Fair die roll",
    dist: "P(1)=P(2)=P(3)=P(4)=P(5)=P(6)=1/6",
    shape: "Uniform (symmetric)",
    center: "Median is 3.5",
    spread: "Range is 5 (6-1)",
    shapeExplanation: "All outcomes are equally likely, creating a flat/uniform distribution. No skewness."
  },
  {
    name: "Number of heads in 4 coin flips",
    dist: "P(0)=0.0625, P(1)=0.25, P(2)=0.375, P(3)=0.25, P(4)=0.0625",
    shape: "Symmetric (bell-shaped)",
    center: "Median is 2 heads",
    spread: "Range is 4 (4-0)",
    shapeExplanation: "The distribution is symmetric around 2 heads. P(0)=P(4) and P(1)=P(3)."
  },
  {
    name: "Insurance claims",
    dist: "P(no claim)=0.99, P(theft)=0.0097, P(fire)=0.0003",
    shape: "Extremely skewed right",
    center: "Mode is 'no claim'",
    spread: "Wide range in outcomes",
    shapeExplanation: "Almost all probability (99%) is at 'no claim', with rare but important events in the right tail."
  },
  {
    name: "Sum of two dice",
    dist: "P(2)=1/36, ..., P(7)=6/36, ..., P(12)=1/36",
    shape: "Symmetric (triangular)",
    center: "Median is 7",
    spread: "Range is 10 (12-2)",
    shapeExplanation: "The distribution is symmetric around 7, with equal probabilities for sums equidistant from 7."
  }
];

// Level 38: Mean (Expected Value) Formula
const meanFormulaScenarios = [
  {
    desc: "Prairie dog pups: X = number of pups. Distribution: P(1)=0.15, P(2)=0.38, P(3)=0.27, P(4)=0.11, P(5)=0.05, P(6)=0.03, P(7)=0.01",
    formula: "μ = Σ[x·P(x)]",
    calculation: "1(0.15) + 2(0.38) + 3(0.27) + 4(0.11) + 5(0.05) + 6(0.03) + 7(0.01)",
    answer: 2.66,
    interpretation: "In the long run, the average number of pups per litter will be about 2.66."
  },
  {
    desc: "Fair die: X = roll outcome. P(1)=P(2)=...=P(6)=1/6",
    formula: "μ = Σ[x·P(x)]",
    calculation: "1(1/6) + 2(1/6) + 3(1/6) + 4(1/6) + 5(1/6) + 6(1/6)",
    answer: 3.5,
    interpretation: "The expected value of a die roll is 3.5 (the long-run average)."
  },
  {
    desc: "Renter's insurance profit: X = company profit. P($150)=0.99, P(-$2850)=0.0097, P(-$24850)=0.0003",
    formula: "μ = Σ[x·P(x)]",
    calculation: "150(0.99) + (-2850)(0.0097) + (-24850)(0.0003)",
    answer: 113.40,
    interpretation: "On average, the insurance company profits $113.40 per policy in the long run."
  },
  {
    desc: "Number of heads in 2 coin flips: P(0)=0.25, P(1)=0.50, P(2)=0.25",
    formula: "μ = Σ[x·P(x)]",
    calculation: "0(0.25) + 1(0.50) + 2(0.25)",
    answer: 1.0,
    interpretation: "On average, you expect 1 head in 2 coin flips."
  },
  {
    desc: "Game: Win $10 with P=0.2, win $5 with P=0.3, lose $3 with P=0.5",
    formula: "μ = Σ[x·P(x)]",
    calculation: "10(0.2) + 5(0.3) + (-3)(0.5)",
    answer: 2.0,
    interpretation: "Expected value is $2.00 per game (a favorable game on average)."
  },
  {
    desc: "Lottery: Win $1000 with P=0.001, win $10 with P=0.05, lose $5 with P=0.949",
    formula: "μ = Σ[x·P(x)]",
    calculation: "1000(0.001) + 10(0.05) + (-5)(0.949)",
    answer: -3.245,
    interpretation: "Expected value is -$3.25 per ticket (unfavorable - you lose money on average)."
  },
  {
    desc: "Quiz score: X = points. P(0)=0.05, P(1)=0.10, P(2)=0.25, P(3)=0.35, P(4)=0.25",
    formula: "μ = Σ[x·P(x)]",
    calculation: "0(0.05) + 1(0.10) + 2(0.25) + 3(0.35) + 4(0.25)",
    answer: 2.65,
    interpretation: "The expected quiz score is 2.65 points out of 4."
  }
];

// Level 39: Standard Deviation Formula
const stdDevFormulaScenarios = [
  {
    desc: "Prairie dog pups: X = number of pups. μ = 2.66. Distribution: P(1)=0.15, P(2)=0.38, P(3)=0.27, P(4)=0.11, P(5)=0.05, P(6)=0.03, P(7)=0.01",
    formula: "σ = √[Σ(x-μ)²·P(x)]",
    mean: 2.66,
    answer: 1.27,
    interpretation: "The number of pups typically varies from the mean by about 1.27 pups."
  },
  {
    desc: "Fair die: X = roll outcome. μ = 3.5. P(1)=P(2)=...=P(6)=1/6",
    formula: "σ = √[Σ(x-μ)²·P(x)]",
    mean: 3.5,
    answer: 1.71,
    interpretation: "Die rolls typically vary from 3.5 by about 1.71."
  },
  {
    desc: "Number of heads in 2 flips: μ = 1.0. P(0)=0.25, P(1)=0.50, P(2)=0.25",
    formula: "σ = √[Σ(x-μ)²·P(x)]",
    mean: 1.0,
    answer: 0.71,
    interpretation: "The number of heads typically varies from 1 by about 0.71."
  },
  {
    desc: "Game winnings: μ = $2.00. Win $10 (P=0.2), win $5 (P=0.3), lose $3 (P=0.5)",
    formula: "σ = √[Σ(x-μ)²·P(x)]",
    mean: 2.0,
    answer: 5.15,
    interpretation: "Individual game results typically vary from $2 by about $5.15."
  },
  {
    desc: "Quiz scores: μ = 2.65. P(0)=0.05, P(1)=0.10, P(2)=0.25, P(3)=0.35, P(4)=0.25",
    formula: "σ = √[Σ(x-μ)²·P(x)]",
    mean: 2.65,
    answer: 1.09,
    interpretation: "Quiz scores typically vary from 2.65 by about 1.09 points."
  },
  {
    desc: "Number of defects: μ = 0.35. P(0)=0.70, P(1)=0.25, P(2)=0.05",
    formula: "σ = √[Σ(x-μ)²·P(x)]",
    mean: 0.35,
    answer: 0.57,
    interpretation: "The number of defects typically varies from 0.35 by about 0.57."
  }
];

// Level 40: Interpret Parameters in Context (Capstone)
const interpretParamsScenarios = [
  {
    desc: "The expected number of customers per hour at a coffee shop is μ = 45 with σ = 8.",
    question: "Interpret what μ = 45 means in context.",
    answer: "In the long run, the coffee shop averages about 45 customers per hour",
    options: [
      "In the long run, the coffee shop averages about 45 customers per hour",
      "Exactly 45 customers come every hour",
      "The shop can serve a maximum of 45 customers",
      "Most hours have between 37 and 53 customers"
    ],
    concept: "Mean interpretation"
  },
  {
    desc: "For renter's insurance policies: μ = $113.40 profit per policy.",
    question: "What does the expected value tell the insurance company?",
    answer: "On average across many policies, the company profits $113.40 per policy",
    options: [
      "On average across many policies, the company profits $113.40 per policy",
      "Every policy earns exactly $113.40",
      "The company will never lose money",
      "Most policies result in $113.40 profit"
    ],
    concept: "Expected value in business"
  },
  {
    desc: "Prairie dog litters have μ = 2.66 pups and σ = 1.27 pups.",
    question: "Interpret σ = 1.27 in context.",
    answer: "Litter sizes typically vary from the mean of 2.66 by about 1.27 pups",
    options: [
      "Litter sizes typically vary from the mean of 2.66 by about 1.27 pups",
      "All litters have between 1.39 and 3.93 pups",
      "The smallest possible litter is 1.27 pups",
      "Exactly 1.27 pups are born each time"
    ],
    concept: "Standard deviation interpretation"
  },
  {
    desc: "A game has expected value μ = -$2.50.",
    question: "Should you play this game? Why?",
    answer: "No - negative expected value means you lose $2.50 on average per game",
    options: [
      "No - negative expected value means you lose $2.50 on average per game",
      "Yes - negative signs don't matter in expected value",
      "Yes - you might still win individual games",
      "Need more information about standard deviation"
    ],
    concept: "Decision making with expected value"
  },
  {
    desc: "Machine A has μ = 100 parts/hour, σ = 5. Machine B has μ = 100 parts/hour, σ = 15.",
    question: "Which machine is more consistent?",
    answer: "Machine A - smaller σ means less variability in production",
    options: [
      "Machine A - smaller σ means less variability in production",
      "Machine B - larger σ means more production",
      "They're equally consistent - same mean",
      "Cannot compare without more information"
    ],
    concept: "Comparing variability"
  },
  {
    desc: "Quiz scores: μ = 3.2 out of 5 points, σ = 0.8 points.",
    question: "What does σ = 0.8 tell us about student performance?",
    answer: "Students' scores typically differ from the average (3.2) by about 0.8 points",
    options: [
      "Students' scores typically differ from the average (3.2) by about 0.8 points",
      "The lowest score is 0.8 points",
      "Exactly 80% of students scored above average",
      "The quiz was worth 0.8 points total"
    ],
    concept: "Standard deviation in education"
  },
  {
    desc: "Expected number of defects per product: μ = 0.02",
    question: "How should we interpret this expected value less than 1?",
    answer: "Over many products, there's an average of 0.02 defects each (2 defects per 100 products)",
    options: [
      "Over many products, there's an average of 0.02 defects each (2 defects per 100 products)",
      "Every product has 0.02 of a defect",
      "It's impossible to have 0.02 defects",
      "2% of defects are serious"
    ],
    concept: "Expected value less than 1"
  },
  {
    desc: "Wait time at a restaurant: μ = 12 minutes, σ = 4 minutes.",
    question: "A customer waited 22 minutes. Is this unusual?",
    answer: "Yes - 22 is more than 2 standard deviations above the mean (12 + 2×4 = 20)",
    options: [
      "Yes - 22 is more than 2 standard deviations above the mean (12 + 2×4 = 20)",
      "No - any wait time is possible",
      "No - 22 is close to 12",
      "Cannot tell without more data"
    ],
    concept: "Unusual values and standard deviation"
  }
];

// Level 11: Capstone Scenarios
const capstoneScenarios = [
  {
    desc: "A coin flip resulted in 7 heads in a row. Your friend says 'Tails is definitely coming next!'",
    concept: "Independence / Gambler's Fallacy",
    options: ["Independence / Gambler's Fallacy", "Law of Large Numbers", "Simulation Design", "Random Process Definition"],
    explanation: "This is the gambler's fallacy. Each flip is independent - past results don't affect future probabilities. The next flip still has 50% chance of heads."
  },
  {
    desc: "After 10 coin flips, you got 70% heads. After 10,000 flips, you got 50.2% heads.",
    concept: "Law of Large Numbers",
    options: ["Law of Large Numbers", "Independence", "Gambler's Fallacy", "Simulation Error"],
    explanation: "The Law of Large Numbers explains this: as trials increase, the observed proportion approaches the true probability (50%)."
  },
  {
    desc: "We want to know the probability of a complex event that can't be easily calculated mathematically.",
    concept: "Simulation",
    options: ["Simulation", "Theoretical Probability", "Independence", "Gambler's Fallacy"],
    explanation: "Simulation allows us to estimate probabilities by modeling the random process many times and calculating relative frequency."
  },
  {
    desc: "In a 'random' sequence written by a student, there are never more than 2 of the same letter in a row.",
    concept: "Human bias in perceiving randomness",
    options: ["Human bias in perceiving randomness", "Law of Large Numbers", "True randomness", "Simulation error"],
    explanation: "Humans tend to avoid streaks when creating 'random' sequences, but real random data often has longer streaks."
  },
  {
    desc: "We know a die can land on 1-6, but we cannot predict which number will appear on the next roll.",
    concept: "Random Process Definition",
    options: ["Random Process Definition", "Law of Large Numbers", "Simulation", "Independence"],
    explanation: "This defines a random process: all possible outcomes are known (1-6), but individual outcomes are unpredictable."
  },
  {
    desc: "A casino knows that even if one player wins big, they'll profit overall because of the mathematics of the games.",
    concept: "Law of Large Numbers",
    options: ["Law of Large Numbers", "Gambler's Fallacy", "Random Chance", "Independence"],
    explanation: "The Law of Large Numbers guarantees that over many bets, the casino's advantage will show. Individual wins don't matter in the long run."
  }
];

// ============ TOPIC 4.9: COMBINING RANDOM VARIABLES ============

// Level 41: Linear Transform - Mean
const transformMeanScenarios = [
  {
    desc: "The number of unhealthy trees X in a parking lot has mean μX = 0.11. An insect infestation is modeled by Y = 3X + 1.",
    a: 1,
    b: 3,
    muX: 0.11,
    answer: 1.33,
    context: "unhealthy trees after infestation",
    explanation: "μY = a + b·μX = 1 + 3(0.11) = 1 + 0.33 = 1.33"
  },
  {
    desc: "Bowling scores X have mean μX = 138 points. The handicap formula is H = (200 - X) × 0.85 = 170 - 0.85X.",
    a: 170,
    b: -0.85,
    muX: 138,
    answer: 52.7,
    context: "handicap points",
    explanation: "μH = 170 - 0.85(138) = 170 - 117.3 = 52.7"
  },
  {
    desc: "Temperature in Celsius X has mean μX = 20°C. To convert to Fahrenheit: F = 32 + 1.8X.",
    a: 32,
    b: 1.8,
    muX: 20,
    answer: 68,
    context: "temperature in Fahrenheit",
    explanation: "μF = 32 + 1.8(20) = 32 + 36 = 68°F"
  },
  {
    desc: "A ride-share driver's base trips X average μX = 12 rides/day. With a $5 bonus per ride: Earnings = 5X + 20 (including base pay).",
    a: 20,
    b: 5,
    muX: 12,
    answer: 80,
    context: "daily earnings in dollars",
    explanation: "μY = 20 + 5(12) = 20 + 60 = $80"
  },
  {
    desc: "Quiz raw scores X have mean μX = 35 points. Curved scores: Y = 1.2X + 10.",
    a: 10,
    b: 1.2,
    muX: 35,
    answer: 52,
    context: "curved score",
    explanation: "μY = 10 + 1.2(35) = 10 + 42 = 52"
  },
  {
    desc: "Phone battery life X has mean μX = 8 hours. After an update: Y = 0.9X + 0.5 (hours).",
    a: 0.5,
    b: 0.9,
    muX: 8,
    answer: 7.7,
    context: "battery life after update",
    explanation: "μY = 0.5 + 0.9(8) = 0.5 + 7.2 = 7.7 hours"
  },
  {
    desc: "Coffee shop customers X average μX = 45 per hour. With new promotion: Y = 1.15X + 5.",
    a: 5,
    b: 1.15,
    muX: 45,
    answer: 56.75,
    context: "customers with promotion",
    explanation: "μY = 5 + 1.15(45) = 5 + 51.75 = 56.75"
  },
  {
    desc: "Package weights X have mean μX = 2.3 kg. Shipping cost: C = 4.50 + 2.00X dollars.",
    a: 4.50,
    b: 2.00,
    muX: 2.3,
    answer: 9.10,
    context: "shipping cost",
    explanation: "μC = 4.50 + 2.00(2.3) = 4.50 + 4.60 = $9.10"
  }
];

// Level 42: Linear Transform - SD
const transformSDScenarios = [
  {
    desc: "The number of unhealthy trees X has σX = 0.444. After Y = 3X + 1, find σY.",
    a: 1,
    b: 3,
    sigmaX: 0.444,
    answer: 1.332,
    context: "unhealthy trees",
    explanation: "σY = |b|·σX = |3|(0.444) = 1.332. The constant (+1) doesn't affect spread!"
  },
  {
    desc: "Bowling scores X have σX = 15.1 points. Handicap H = 170 - 0.85X. Find σH.",
    a: 170,
    b: -0.85,
    sigmaX: 15.1,
    answer: 12.835,
    context: "handicap points",
    explanation: "σH = |−0.85|(15.1) = 0.85 × 15.1 = 12.835. Use absolute value of b!"
  },
  {
    desc: "Temperature X has σX = 5°C. Converting F = 32 + 1.8X, find σF.",
    a: 32,
    b: 1.8,
    sigmaX: 5,
    answer: 9,
    context: "temperature",
    explanation: "σF = |1.8|(5) = 9°F. Adding 32 shifts center but doesn't change spread."
  },
  {
    desc: "Ride-share trips X have σX = 3 rides. If Earnings = 5X + 20, find σEarnings.",
    a: 20,
    b: 5,
    sigmaX: 3,
    answer: 15,
    context: "earnings",
    explanation: "σY = |5|(3) = $15. The base pay ($20) is constant and doesn't affect variability."
  },
  {
    desc: "Raw quiz scores X have σX = 8 points. Curved Y = 1.2X + 10, find σY.",
    a: 10,
    b: 1.2,
    sigmaX: 8,
    answer: 9.6,
    context: "curved scores",
    explanation: "σY = |1.2|(8) = 9.6 points. The 10-point boost doesn't change spread."
  },
  {
    desc: "Study time X has σX = 1.5 hours. If grades G = 50 + 4X, find σG.",
    a: 50,
    b: 4,
    sigmaX: 1.5,
    answer: 6,
    context: "grade points",
    explanation: "σG = |4|(1.5) = 6 points. The base 50 doesn't affect variation."
  },
  {
    desc: "Phone battery X has σX = 1.2 hours. After Y = 0.9X + 0.5, find σY.",
    a: 0.5,
    b: 0.9,
    sigmaX: 1.2,
    answer: 1.08,
    context: "battery life",
    explanation: "σY = |0.9|(1.2) = 1.08 hours. The 0.5 hour boost is constant."
  },
  {
    desc: "Package weight X has σX = 0.4 kg. Shipping C = 4.50 + 2.00X. Find σC.",
    a: 4.50,
    b: 2.00,
    sigmaX: 0.4,
    answer: 0.80,
    context: "shipping cost",
    explanation: "σC = |2.00|(0.4) = $0.80. Base fee doesn't affect variation."
  }
];

// Level 43: Sum of Means
const sumMeansScenarios = [
  {
    desc: "Gas cars sold X: μX = 3.92 per day. Hybrid cars Y: μY = 0.25 per day. Both are independent.",
    muX: 3.92,
    muY: 0.25,
    answer: 4.17,
    context: "total cars sold",
    explanation: "μ(X+Y) = μX + μY = 3.92 + 0.25 = 4.17 cars"
  },
  {
    desc: "Coffee costs X: μX = $4.25. Muffin costs Y: μY = $3.50. Costs are independent.",
    muX: 4.25,
    muY: 3.50,
    answer: 7.75,
    context: "total cost",
    explanation: "μ(X+Y) = μX + μY = 4.25 + 3.50 = $7.75"
  },
  {
    desc: "Morning commute X: μX = 22 minutes. Evening commute Y: μY = 28 minutes. Independent trips.",
    muX: 22,
    muY: 28,
    answer: 50,
    context: "total daily commute time",
    explanation: "μ(X+Y) = μX + μY = 22 + 28 = 50 minutes"
  },
  {
    desc: "Alice's score X: μX = 85 points. Bob's score Y: μY = 78 points. Independent performances.",
    muX: 85,
    muY: 78,
    answer: 163,
    context: "combined team score",
    explanation: "μ(X+Y) = μX + μY = 85 + 78 = 163 points"
  },
  {
    desc: "Manufacturing time X: μX = 15.2 minutes. Quality check Y: μY = 3.8 minutes. Independent processes.",
    muX: 15.2,
    muY: 3.8,
    answer: 19,
    context: "total production time per unit",
    explanation: "μ(X+Y) = μX + μY = 15.2 + 3.8 = 19 minutes"
  },
  {
    desc: "Homework time X: μX = 45 minutes. Practice time Y: μY = 30 minutes. Independent activities.",
    muX: 45,
    muY: 30,
    answer: 75,
    context: "total study time",
    explanation: "μ(X+Y) = μX + μY = 45 + 30 = 75 minutes"
  },
  {
    desc: "Appetizer price X: μX = $8.50. Entree price Y: μY = $16.75. Menu items independent.",
    muX: 8.50,
    muY: 16.75,
    answer: 25.25,
    context: "meal cost before tip",
    explanation: "μ(X+Y) = μX + μY = 8.50 + 16.75 = $25.25"
  },
  {
    desc: "Download time X: μX = 12 seconds. Processing time Y: μY = 5.5 seconds. Independent operations.",
    muX: 12,
    muY: 5.5,
    answer: 17.5,
    context: "total wait time",
    explanation: "μ(X+Y) = μX + μY = 12 + 5.5 = 17.5 seconds"
  }
];

// Level 44: Difference of Means
const diffMeansScenarios = [
  {
    desc: "Gas cars sold X: μX = 3.92 per day. Hybrid cars Y: μY = 0.25 per day. Find the mean difference.",
    muX: 3.92,
    muY: 0.25,
    answer: 3.67,
    context: "more gas cars than hybrid cars",
    explanation: "μ(X-Y) = μX - μY = 3.92 - 0.25 = 3.67 cars"
  },
  {
    desc: "Team A score X: μX = 78 points. Team B score Y: μY = 72 points. Independent games.",
    muX: 78,
    muY: 72,
    answer: 6,
    context: "point difference (A minus B)",
    explanation: "μ(X-Y) = μX - μY = 78 - 72 = 6 points"
  },
  {
    desc: "Morning traffic X: μX = 35 minutes. Night traffic Y: μY = 18 minutes. Independent times.",
    muX: 35,
    muY: 18,
    answer: 17,
    context: "extra time for morning commute",
    explanation: "μ(X-Y) = μX - μY = 35 - 18 = 17 minutes"
  },
  {
    desc: "Income X: μX = $4200/month. Expenses Y: μY = $3650/month. Independent values.",
    muX: 4200,
    muY: 3650,
    answer: 550,
    context: "monthly savings",
    explanation: "μ(X-Y) = μX - μY = 4200 - 3650 = $550"
  },
  {
    desc: "Package A weight X: μX = 5.2 kg. Package B weight Y: μY = 3.8 kg. Independent weights.",
    muX: 5.2,
    muY: 3.8,
    answer: 1.4,
    context: "weight difference",
    explanation: "μ(X-Y) = μX - μY = 5.2 - 3.8 = 1.4 kg"
  },
  {
    desc: "New machine output X: μX = 125 units. Old machine Y: μY = 98 units. Independent processes.",
    muX: 125,
    muY: 98,
    answer: 27,
    context: "additional units from new machine",
    explanation: "μ(X-Y) = μX - μY = 125 - 98 = 27 units"
  },
  {
    desc: "Adult height X: μX = 68 inches. Child height Y: μY = 48 inches. Independent individuals.",
    muX: 68,
    muY: 48,
    answer: 20,
    context: "height difference",
    explanation: "μ(X-Y) = μX - μY = 68 - 48 = 20 inches"
  },
  {
    desc: "Treatment group X: μX = 145 mg/dL. Control group Y: μY = 162 mg/dL. Independent groups.",
    muX: 145,
    muY: 162,
    answer: -17,
    context: "cholesterol reduction (treatment - control)",
    explanation: "μ(X-Y) = μX - μY = 145 - 162 = -17 mg/dL (negative means treatment is lower)"
  }
];

// Level 45: Combined SD - Sum (THE VARIANCE TRAP)
const combinedSDSumScenarios = [
  {
    desc: "Gas cars X: σX = 0.94 per day. Hybrid cars Y: σY = 0.56 per day. X and Y are INDEPENDENT. Find σ(X+Y).",
    sigmaX: 0.94,
    sigmaY: 0.56,
    varX: 0.8836,
    varY: 0.3136,
    answer: 1.094,
    trapAnswer: 1.5,
    context: "total cars sold",
    explanation: "σ(X+Y) = √(σX² + σY²) = √(0.8836 + 0.3136) = √1.1972 ≈ 1.094"
  },
  {
    desc: "Coffee cost X: σX = $0.50. Muffin cost Y: σY = $0.75. Costs are INDEPENDENT. Find σ(X+Y).",
    sigmaX: 0.50,
    sigmaY: 0.75,
    varX: 0.25,
    varY: 0.5625,
    answer: 0.901,
    trapAnswer: 1.25,
    context: "total cost",
    explanation: "σ(X+Y) = √(0.25 + 0.5625) = √0.8125 ≈ 0.901 (NOT 0.50 + 0.75 = 1.25!)"
  },
  {
    desc: "Morning commute X: σX = 5 minutes. Evening commute Y: σY = 8 minutes. INDEPENDENT. Find σ(X+Y).",
    sigmaX: 5,
    sigmaY: 8,
    varX: 25,
    varY: 64,
    answer: 9.434,
    trapAnswer: 13,
    context: "total commute",
    explanation: "σ(X+Y) = √(25 + 64) = √89 ≈ 9.43 (NOT 5 + 8 = 13!)"
  },
  {
    desc: "Quiz 1 scores X: σX = 3 points. Quiz 2 scores Y: σY = 4 points. INDEPENDENT. Find σ(X+Y).",
    sigmaX: 3,
    sigmaY: 4,
    varX: 9,
    varY: 16,
    answer: 5,
    trapAnswer: 7,
    context: "combined quiz score",
    explanation: "σ(X+Y) = √(9 + 16) = √25 = 5 (NOT 3 + 4 = 7!) This is a 3-4-5 right triangle!"
  },
  {
    desc: "Part A time X: σX = 2.5 minutes. Part B time Y: σY = 6 minutes. INDEPENDENT. Find σ(X+Y).",
    sigmaX: 2.5,
    sigmaY: 6,
    varX: 6.25,
    varY: 36,
    answer: 6.5,
    trapAnswer: 8.5,
    context: "total assembly time",
    explanation: "σ(X+Y) = √(6.25 + 36) = √42.25 = 6.5 (NOT 2.5 + 6 = 8.5!)"
  },
  {
    desc: "Height X: σX = 3 inches. Arm span Y: σY = 4 inches. INDEPENDENT measurements. Find σ(X+Y).",
    sigmaX: 3,
    sigmaY: 4,
    varX: 9,
    varY: 16,
    answer: 5,
    trapAnswer: 7,
    context: "combined measurement",
    explanation: "σ(X+Y) = √(9 + 16) = √25 = 5 inches"
  },
  {
    desc: "Startup time X: σX = 4 seconds. Load time Y: σY = 3 seconds. INDEPENDENT. Find σ(X+Y).",
    sigmaX: 4,
    sigmaY: 3,
    varX: 16,
    varY: 9,
    answer: 5,
    trapAnswer: 7,
    context: "total boot time",
    explanation: "σ(X+Y) = √(16 + 9) = √25 = 5 seconds (another 3-4-5 triangle!)"
  },
  {
    desc: "Distance A: σX = 12 meters. Distance B: σY = 5 meters. INDEPENDENT. Find σ(X+Y).",
    sigmaX: 12,
    sigmaY: 5,
    varX: 144,
    varY: 25,
    answer: 13,
    trapAnswer: 17,
    context: "total distance",
    explanation: "σ(X+Y) = √(144 + 25) = √169 = 13 meters (5-12-13 right triangle!)"
  }
];

// Level 46: Combined SD - Difference (THE TRAP CONTINUES)
const combinedSDDiffScenarios = [
  {
    desc: "Gas cars X: σX = 0.94. Hybrid cars Y: σY = 0.56. X and Y are INDEPENDENT. Find σ(X-Y).",
    sigmaX: 0.94,
    sigmaY: 0.56,
    varX: 0.8836,
    varY: 0.3136,
    answer: 1.094,
    trapAnswer1: 0.38,
    trapAnswer2: 1.5,
    context: "difference in cars sold",
    explanation: "σ(X-Y) = √(σX² + σY²) = √1.1972 ≈ 1.094. Variances STILL ADD for differences!"
  },
  {
    desc: "Team A score X: σX = 12 points. Team B score Y: σY = 9 points. INDEPENDENT. Find σ(X-Y).",
    sigmaX: 12,
    sigmaY: 9,
    varX: 144,
    varY: 81,
    answer: 15,
    trapAnswer1: 3,
    trapAnswer2: 21,
    context: "score difference",
    explanation: "σ(X-Y) = √(144 + 81) = √225 = 15. Subtracting ADDS uncertainty!"
  },
  {
    desc: "Income X: σX = $400. Expenses Y: σY = $300. INDEPENDENT. Find σ(X-Y).",
    sigmaX: 400,
    sigmaY: 300,
    varX: 160000,
    varY: 90000,
    answer: 500,
    trapAnswer1: 100,
    trapAnswer2: 700,
    context: "savings variation",
    explanation: "σ(X-Y) = √(160000 + 90000) = √250000 = $500 (NOT $400 - $300 = $100!)"
  },
  {
    desc: "Machine A output X: σX = 8 units. Machine B output Y: σY = 6 units. INDEPENDENT. Find σ(X-Y).",
    sigmaX: 8,
    sigmaY: 6,
    varX: 64,
    varY: 36,
    answer: 10,
    trapAnswer1: 2,
    trapAnswer2: 14,
    context: "output difference",
    explanation: "σ(X-Y) = √(64 + 36) = √100 = 10 units (6-8-10 right triangle!)"
  },
  {
    desc: "Before treatment X: σX = 15 mg/dL. After treatment Y: σY = 20 mg/dL. INDEPENDENT. Find σ(X-Y).",
    sigmaX: 15,
    sigmaY: 20,
    varX: 225,
    varY: 400,
    answer: 25,
    trapAnswer1: 5,
    trapAnswer2: 35,
    context: "change in cholesterol",
    explanation: "σ(X-Y) = √(225 + 400) = √625 = 25 mg/dL (15-20-25 scaled 3-4-5!)"
  },
  {
    desc: "Adult height X: σX = 4 inches. Child height Y: σY = 3 inches. INDEPENDENT. Find σ(X-Y).",
    sigmaX: 4,
    sigmaY: 3,
    varX: 16,
    varY: 9,
    answer: 5,
    trapAnswer1: 1,
    trapAnswer2: 7,
    context: "height difference",
    explanation: "σ(X-Y) = √(16 + 9) = √25 = 5 inches. Same as σ(X+Y)!"
  },
  {
    desc: "Morning temp X: σX = 5°F. Afternoon temp Y: σY = 12°F. INDEPENDENT. Find σ(X-Y).",
    sigmaX: 5,
    sigmaY: 12,
    varX: 25,
    varY: 144,
    answer: 13,
    trapAnswer1: 7,
    trapAnswer2: 17,
    context: "temperature change",
    explanation: "σ(X-Y) = √(25 + 144) = √169 = 13°F (5-12-13 right triangle!)"
  },
  {
    desc: "Test score X: σX = 9 points. Retest score Y: σY = 12 points. INDEPENDENT. Find σ(X-Y).",
    sigmaX: 9,
    sigmaY: 12,
    varX: 81,
    varY: 144,
    answer: 15,
    trapAnswer1: 3,
    trapAnswer2: 21,
    context: "score change",
    explanation: "σ(X-Y) = √(81 + 144) = √225 = 15 points (9-12-15 scaled 3-4-5!)"
  }
];

// Level 47: Identify the Error
const identifyErrorScenarios = [
  {
    desc: "A student calculated σ(X+Y) = 3 + 4 = 7, where X and Y are independent with σX = 3 and σY = 4.",
    answer: "Added standard deviations instead of adding variances first",
    options: [
      "Added standard deviations instead of adding variances first",
      "Forgot to take the square root",
      "Should have subtracted instead of added",
      "No error - this calculation is correct"
    ],
    correctSD: 5,
    explanation: "The student fell for the VARIANCE TRAP! Correct: σ(X+Y) = √(9 + 16) = √25 = 5"
  },
  {
    desc: "For X-Y with σX = 5, σY = 12, a student calculated σ(X-Y) = 5 - 12 = -7.",
    answer: "Subtracted standard deviations - variances always ADD, even for differences",
    options: [
      "Subtracted standard deviations - variances always ADD, even for differences",
      "The negative sign is correct for subtraction",
      "Should have taken absolute value: |5-12| = 7",
      "Used the wrong formula entirely"
    ],
    correctSD: 13,
    explanation: "Variances ALWAYS add! σ(X-Y) = √(25 + 144) = √169 = 13"
  },
  {
    desc: "For Y = 10 + 3X with σX = 4, a student calculated σY = 10 + 3(4) = 22.",
    answer: "Included the constant in the SD calculation - constants don't affect spread",
    options: [
      "Included the constant in the SD calculation - constants don't affect spread",
      "Should have divided by 3 instead of multiplying",
      "Forgot to square the 3",
      "The calculation is correct"
    ],
    correctSD: 12,
    explanation: "Constants shift the center but don't affect spread! σY = |3|(4) = 12"
  },
  {
    desc: "A student calculated σ(X-Y) = |σX - σY| = |8 - 6| = 2 for independent X and Y.",
    answer: "Subtracted SDs and took absolute value - should add variances then square root",
    options: [
      "Subtracted SDs and took absolute value - should add variances then square root",
      "Forgot the absolute value",
      "Should have squared 2 to get 4",
      "This is the correct approach"
    ],
    correctSD: 10,
    explanation: "Even for X-Y, add variances! σ(X-Y) = √(64 + 36) = √100 = 10"
  },
  {
    desc: "For X+Y with σX = 6, σY = 8, a student got σ(X+Y) = 36 + 64 = 100.",
    answer: "Forgot to take the square root after adding variances",
    options: [
      "Forgot to take the square root after adding variances",
      "Should have added SDs: 6 + 8 = 14",
      "The variances were added incorrectly",
      "Should have subtracted instead"
    ],
    correctSD: 10,
    explanation: "Added variances correctly but forgot the final step! σ(X+Y) = √100 = 10"
  },
  {
    desc: "For Y = -2X + 5 with σX = 3, a student calculated σY = -2(3) = -6.",
    answer: "Got a negative SD - should use |b| to get a positive result",
    options: [
      "Got a negative SD - should use |b| to get a positive result",
      "Should have added 5: -6 + 5 = -1",
      "Standard deviations can be negative",
      "Should have squared -2 to get 4"
    ],
    correctSD: 6,
    explanation: "Use absolute value! σY = |-2|(3) = 2(3) = 6. SD is always positive!"
  },
  {
    desc: "To find σ(X-Y), a student reasoned: 'Subtracting makes things cancel out, so variability decreases.'",
    answer: "Wrong reasoning - subtracting uncertain quantities INCREASES total uncertainty",
    options: [
      "Wrong reasoning - subtracting uncertain quantities INCREASES total uncertainty",
      "The reasoning is correct - subtraction reduces spread",
      "It depends on whether X > Y or Y > X",
      "Subtraction has no effect on variability"
    ],
    correctSD: "Same as σ(X+Y)",
    explanation: "Think about it: if both X and Y could vary up or down, their difference can vary even more!"
  },
  {
    desc: "A student said: 'Since we're adding X and Y, we add the SDs: σ(X+Y) = σX + σY.'",
    answer: "Standard deviations don't add directly - must add variances first",
    options: [
      "Standard deviations don't add directly - must add variances first",
      "This is correct for independent random variables",
      "This is only wrong if X and Y are dependent",
      "Should multiply SDs instead of adding"
    ],
    correctSD: "√(σX² + σY²)",
    explanation: "The formula is σ(X+Y) = √(σX² + σY²). SDs don't add directly!"
  }
];

// Level 48: Capstone - Combined Problem (Mean AND SD)
const capstone49Scenarios = [
  {
    desc: "Coffee costs $4.25 on average with SD = $0.50. Muffin costs $3.50 on average with SD = $0.75. Costs are INDEPENDENT. Find the mean AND standard deviation of the total cost.",
    muX: 4.25,
    muY: 3.50,
    sigmaX: 0.50,
    sigmaY: 0.75,
    answerMean: 7.75,
    answerSD: 0.901,
    context: "total breakfast cost",
    explanation: "μ = 4.25 + 3.50 = $7.75. σ = √(0.25 + 0.5625) = √0.8125 ≈ $0.90"
  },
  {
    desc: "Manufacturing time A: μ = 15 min, σ = 2.5 min. Quality check B: μ = 4 min, σ = 6 min. INDEPENDENT processes. Find mean and SD of total time.",
    muX: 15,
    muY: 4,
    sigmaX: 2.5,
    sigmaY: 6,
    answerMean: 19,
    answerSD: 6.5,
    context: "total production time",
    explanation: "μ = 15 + 4 = 19 min. σ = √(6.25 + 36) = √42.25 = 6.5 min"
  },
  {
    desc: "Quiz 1: μ = 82 pts, σ = 3 pts. Quiz 2: μ = 78 pts, σ = 4 pts. INDEPENDENT quizzes. Find mean and SD of total score.",
    muX: 82,
    muY: 78,
    sigmaX: 3,
    sigmaY: 4,
    answerMean: 160,
    answerSD: 5,
    context: "combined quiz score",
    explanation: "μ = 82 + 78 = 160 pts. σ = √(9 + 16) = √25 = 5 pts (3-4-5 triangle!)"
  },
  {
    desc: "Appetizer: μ = $9.50, σ = $2. Entree: μ = $18, σ = $4. INDEPENDENT menu items. Find mean and SD of meal cost.",
    muX: 9.50,
    muY: 18,
    sigmaX: 2,
    sigmaY: 4,
    answerMean: 27.50,
    answerSD: 4.472,
    context: "meal cost",
    explanation: "μ = 9.50 + 18 = $27.50. σ = √(4 + 16) = √20 ≈ $4.47"
  },
  {
    desc: "Download: μ = 8 sec, σ = 4 sec. Processing: μ = 3 sec, σ = 3 sec. INDEPENDENT. Find mean and SD of total wait.",
    muX: 8,
    muY: 3,
    sigmaX: 4,
    sigmaY: 3,
    answerMean: 11,
    answerSD: 5,
    context: "total wait time",
    explanation: "μ = 8 + 3 = 11 sec. σ = √(16 + 9) = √25 = 5 sec"
  },
  {
    desc: "Ingredient A: μ = 250g, σ = 5g. Ingredient B: μ = 150g, σ = 12g. INDEPENDENT. Find mean and SD of total weight.",
    muX: 250,
    muY: 150,
    sigmaX: 5,
    sigmaY: 12,
    answerMean: 400,
    answerSD: 13,
    context: "total recipe weight",
    explanation: "μ = 250 + 150 = 400g. σ = √(25 + 144) = √169 = 13g (5-12-13 triangle!)"
  },
  {
    desc: "Shipping time X: μ = 5 days, σ = 1.5 days. Processing time Y: μ = 2 days, σ = 2 days. INDEPENDENT. Find mean and SD of total delivery time.",
    muX: 5,
    muY: 2,
    sigmaX: 1.5,
    sigmaY: 2,
    answerMean: 7,
    answerSD: 2.5,
    context: "total delivery time",
    explanation: "μ = 5 + 2 = 7 days. σ = √(2.25 + 4) = √6.25 = 2.5 days"
  },
  {
    desc: "Monthly income: μ = $4800, σ = $400. Monthly expenses: μ = $3500, σ = $300. INDEPENDENT. Find mean and SD of savings (Income - Expenses).",
    muX: 4800,
    muY: 3500,
    sigmaX: 400,
    sigmaY: 300,
    answerMean: 1300,
    answerSD: 500,
    context: "monthly savings",
    explanation: "μ = 4800 - 3500 = $1300. σ = √(160000 + 90000) = √250000 = $500 (variances ADD even for subtraction!)"
  }
];

// Level 49: BINS Conditions
const binsConditionScenarios = [
  { desc: "The process has only two outcomes: success or failure.", answer: "Binary (two outcomes)" },
  { desc: "Each trial's result does not affect the next trial's probability.", answer: "Independent" },
  { desc: "The experiment is repeated a fixed number of times (n trials).", answer: "Number of trials fixed" },
  { desc: "The probability of success stays the same on every trial.", answer: "Same probability" },
  { desc: "Each trial results in success or failure, nothing else.", answer: "Binary (two outcomes)" },
  { desc: "Knowing a previous result doesn't change future chances.", answer: "Independent" },
  { desc: "We decide ahead of time to run exactly 25 trials.", answer: "Number of trials fixed" },
  { desc: "The success rate is constant from trial to trial.", answer: "Same probability" }
];

// Level 50: Identify Binomial Setting
// failingCondition: "independent" | "fixed" | "sameP" | null (for binomial scenarios)
const identifyBinomialScenarios = [
  {
    desc: "Flip a fair coin 10 times and count the number of heads.",
    isBinomial: true,
    failingCondition: null,
    explanation: "Binary outcomes, independent trials, fixed n = 10, same p = 0.5."
  },
  {
    desc: "Draw 5 cards from a deck WITHOUT replacement and count the number of aces.",
    isBinomial: false,
    failingCondition: "independent",
    explanation: "Not independent and p changes after each draw (no replacement)."
  },
  {
    desc: "Roll a die until you get a 6, and record the number of rolls.",
    isBinomial: false,
    failingCondition: "fixed",
    explanation: "Number of trials is not fixed; this is geometric."
  },
  {
    desc: "Inspect 12 light bulbs; each has a 4% defect rate. Count the defective bulbs.",
    isBinomial: true,
    failingCondition: null,
    explanation: "Binary outcomes, independent trials, fixed n = 12, same p = 0.04."
  },
  {
    desc: "Survey students until you get 3 'yes' responses. Count the number of students surveyed.",
    isBinomial: false,
    failingCondition: "fixed",
    explanation: "Number of trials is not fixed; you stop after success count."
  },
  {
    desc: "Select 6 students from a class without replacement and count the left-handed students.",
    isBinomial: false,
    failingCondition: "independent",
    explanation: "Without replacement means trials are not independent and p changes."
  },
  {
    desc: "Test 20 batteries; each independently has a 90% pass rate. Count passes.",
    isBinomial: true,
    failingCondition: null,
    explanation: "Binary outcomes, independent trials, fixed n = 20, same p = 0.90."
  },
  {
    desc: "Spin a wheel 8 times, but the probability of red increases after each blue.",
    isBinomial: false,
    failingCondition: "sameP",
    explanation: "Probability of success is not the same each trial."
  }
];

// Level 51: Binomial Components (n, p, x)
const binomialComponentsScenarios = [
  { desc: "A basketball player makes 75% of free throws. In 12 attempts, find P(exactly 9 makes). Identify n, p, x.", n: 12, p: 0.75, x: 9 },
  { desc: "A factory has a 5% defect rate. If 20 items are inspected, find P(exactly 2 defective). Identify n, p, x.", n: 20, p: 0.05, x: 2 },
  { desc: "A fair coin is flipped 8 times. Find P(exactly 5 heads). Identify n, p, x.", n: 8, p: 0.5, x: 5 },
  { desc: "A student guesses on a 4-question multiple choice quiz. Find P(exactly 3 correct). Identify n, p, x.", n: 4, p: 0.25, x: 3 },
  { desc: "An archer hits the target 60% of the time. Over 10 shots, find P(exactly 7 hits). Identify n, p, x.", n: 10, p: 0.6, x: 7 },
  { desc: "A medical test is positive 12% of the time. Over 15 tests, find P(exactly 1 positive). Identify n, p, x.", n: 15, p: 0.12, x: 1 },
  { desc: "A die is rolled 6 times. Find P(exactly 2 sixes). Identify n, p, x.", n: 6, p: 1 / 6, x: 2 },
  { desc: "A soccer player makes 80% of penalty kicks. Over 5 kicks, find P(exactly 4 makes). Identify n, p, x.", n: 5, p: 0.8, x: 4 }
];

// Level 52: Binomial Single Probability
const binomialSingleProbScenarios = [
  { desc: "A fair coin is flipped 6 times. Find P(exactly 4 heads).", n: 6, p: 0.5, x: 4 },
  { desc: "A quiz has 5 true/false questions. Guessing gives p = 0.5. Find P(exactly 3 correct).", n: 5, p: 0.5, x: 3 },
  { desc: "A factory produces 8% defective items. Inspect 12 items. Find P(exactly 1 defective).", n: 12, p: 0.08, x: 1 },
  { desc: "A basketball player makes 70% of free throws. In 10 attempts, find P(exactly 8 makes).", n: 10, p: 0.7, x: 8 },
  { desc: "A soccer player scores on 30% of shots. In 7 shots, find P(exactly 2 goals).", n: 7, p: 0.3, x: 2 },
  { desc: "A die is rolled 8 times. Find P(exactly 1 six).", n: 8, p: 1 / 6, x: 1 },
  { desc: "A survey has 40% yes responses. In 9 surveys, find P(exactly 5 yes).", n: 9, p: 0.4, x: 5 },
  { desc: "A machine passes inspection 90% of the time. In 6 items, find P(exactly 6 pass).", n: 6, p: 0.9, x: 6 }
];

// Level 53: Binomial Cumulative Probability
const binomialCumulativeScenarios = [
  { desc: "A fair coin is flipped 8 times. Find P(X ≤ 2 heads).", n: 8, p: 0.5, k: 2, direction: "<=" },
  { desc: "A basketball player makes 75% of free throws. In 10 shots, find P(X ≥ 8 makes).", n: 10, p: 0.75, k: 8, direction: ">=" },
  { desc: "A defect rate is 10%. In 12 items, find P(X ≤ 1 defective).", n: 12, p: 0.1, k: 1, direction: "<=" },
  { desc: "A student guesses on 5 multiple choice questions (p = 0.25). Find P(X ≥ 2 correct).", n: 5, p: 0.25, k: 2, direction: ">=" },
  { desc: "A soccer player scores 40% of the time. In 6 shots, find P(X ≤ 3 goals).", n: 6, p: 0.4, k: 3, direction: "<=" },
  { desc: "A die is rolled 7 times. Find P(X ≥ 2 sixes).", n: 7, p: 1 / 6, k: 2, direction: ">=" },
  { desc: "A machine has a 95% pass rate. In 8 items, find P(X ≥ 7 pass).", n: 8, p: 0.95, k: 7, direction: ">=" },
  { desc: "A coin with p = 0.3 for heads is flipped 9 times. Find P(X ≤ 4 heads).", n: 9, p: 0.3, k: 4, direction: "<=" }
];

// Level 54: Binomial Capstone
const binomialCapstoneScenarios = [
  { desc: "A survey is run with 15 independent trials and p = 0.2. The question asks for P(X = 3).", answer: "Single probability P(X = k)", explanation: "Use the binomial formula for exactly k successes." },
  { desc: "A process has fixed n and constant p, and you must decide if it's binomial.", answer: "BINS conditions", explanation: "Check Binary, Independent, fixed Number, Same p." },
  { desc: "A coin is flipped 12 times. The question asks for P(X ≥ 10).", answer: "Cumulative probability", explanation: "This is a cumulative binomial probability (at least)." },
  { desc: "A word problem asks you to identify n, p, and x before computing a binomial probability.", answer: "Identify n, p, x", explanation: "You must extract the binomial components first." },
  { desc: "A quiz question asks: Is this setting binomial? Then justify using BINS.", answer: "BINS conditions", explanation: "The key concept is checking the four BINS conditions." },
  { desc: "A problem asks for P(X ≤ 2) in a binomial setting.", answer: "Cumulative probability", explanation: "Less than or equal to is cumulative." },
  { desc: "A problem gives n and p but you must identify x based on the wording.", answer: "Identify n, p, x", explanation: "Extract the components from the context." },
  { desc: "A question asks for P(X = 5) and shows the formula with C(n,x).", answer: "Single probability P(X = k)", explanation: "Exactly k uses the binomial formula." }
];

// Level 55: Binomial Mean
const binomialMeanScenarios = [
  { desc: "A quiz has 12 questions with a 70% success rate per question. Find the expected number of correct answers.", n: 12, p: 0.7, context: "expected correct answers" },
  { desc: "A defect rate is 5%. In 40 items, find the expected number of defects.", n: 40, p: 0.05, context: "expected defects" },
  { desc: "A free-throw shooter makes 80% of shots. In 15 attempts, find the expected number of makes.", n: 15, p: 0.8, context: "expected makes" },
  { desc: "A fair coin is flipped 20 times. Find the expected number of heads.", n: 20, p: 0.5, context: "expected heads" },
  { desc: "A spam filter flags 10% of emails. In 50 emails, find the expected number flagged.", n: 50, p: 0.1, context: "expected flagged emails" },
  { desc: "A baseball player gets a hit 30% of the time. In 25 at-bats, find the expected number of hits.", n: 25, p: 0.3, context: "expected hits" },
  { desc: "A lightbulb has a 2% defect rate. In 200 bulbs, find expected defects.", n: 200, p: 0.02, context: "expected defects" },
  { desc: "A survey response rate is 60%. In 18 calls, find the expected number of responses.", n: 18, p: 0.6, context: "expected responses" }
];

// Level 56: Binomial SD
const binomialSDScenarios = [
  { desc: "A coin is flipped 16 times. Find the standard deviation of the number of heads.", n: 16, p: 0.5, context: "number of heads" },
  { desc: "A 60% success rate over 20 trials. Find the standard deviation of successes.", n: 20, p: 0.6, context: "number of successes" },
  { desc: "A defect rate is 8% over 50 items. Find the standard deviation of defects.", n: 50, p: 0.08, context: "number of defects" },
  { desc: "A shooter makes 75% of free throws in 12 attempts. Find the standard deviation of makes.", n: 12, p: 0.75, context: "number of makes" },
  { desc: "A call center answers 40% of calls within 30 seconds. Over 30 calls, find the SD of fast answers.", n: 30, p: 0.4, context: "fast answers" },
  { desc: "A test has 10 questions with p = 0.25 for a correct guess. Find SD of correct answers.", n: 10, p: 0.25, context: "correct answers" },
  { desc: "A server handles 90% of requests successfully. In 25 requests, find SD of successes.", n: 25, p: 0.9, context: "successful requests" },
  { desc: "A student has 30% chance of solving a problem. Over 14 problems, find SD of solves.", n: 14, p: 0.3, context: "problems solved" }
];

// Level 57: Interpret Binomial Parameters
const interpretBinomParamsScenarios = [
  {
    desc: "A nurse gives 25 injections. Each has a 0.08 chance of mild side effects. Interpret μ and σ for the number of side effects.",
    n: 25,
    p: 0.08
  },
  {
    desc: "A player makes 70% of free throws over 20 attempts. Interpret μ and σ for the number of makes.",
    n: 20,
    p: 0.7
  },
  {
    desc: "A company expects 4% of items to be defective. In 60 items, interpret μ and σ for defects.",
    n: 60,
    p: 0.04
  },
  {
    desc: "A coin with p = 0.3 for heads is flipped 15 times. Interpret μ and σ for heads.",
    n: 15,
    p: 0.3
  },
  {
    desc: "A trivia contestant gets each question right with p = 0.6. Over 10 questions, interpret μ and σ.",
    n: 10,
    p: 0.6
  },
  {
    desc: "A warehouse reports 2% damaged boxes. In 80 boxes, interpret μ and σ for damages.",
    n: 80,
    p: 0.02
  },
  {
    desc: "A survey response rate is 45%. In 30 calls, interpret μ and σ for responses.",
    n: 30,
    p: 0.45
  },
  {
    desc: "A printer succeeds 90% of the time. In 12 print jobs, interpret μ and σ for successes.",
    n: 12,
    p: 0.9
  }
];

// Level 58: Would You Be Surprised?
const surprisedScenarios = [
  { desc: "A binomial distribution has μ = 8 and σ = 2. An outcome of 13 successes is observed.", mu: 8, sigma: 2, value: 13 },
  { desc: "A binomial distribution has μ = 15 and σ = 3. An outcome of 19 successes is observed.", mu: 15, sigma: 3, value: 19 },
  { desc: "A binomial distribution has μ = 6 and σ = 1.5. An outcome of 2 successes is observed.", mu: 6, sigma: 1.5, value: 2 },
  { desc: "A binomial distribution has μ = 10 and σ = 2. An outcome of 12 successes is observed.", mu: 10, sigma: 2, value: 12 },
  { desc: "A binomial distribution has μ = 4 and σ = 1.2. An outcome of 7 successes is observed.", mu: 4, sigma: 1.2, value: 7 },
  { desc: "A binomial distribution has μ = 20 and σ = 4. An outcome of 27 successes is observed.", mu: 20, sigma: 4, value: 27 },
  { desc: "A binomial distribution has μ = 9 and σ = 1.5. An outcome of 6 successes is observed.", mu: 9, sigma: 1.5, value: 6 },
  { desc: "A binomial distribution has μ = 5 and σ = 1.1. An outcome of 9 successes is observed.", mu: 5, sigma: 1.1, value: 9 }
];

// Level 59: Geometric vs Binomial
const geometricIdentifyScenarios = [
  { desc: "Flip a coin until the first head appears and record the number of flips.", answer: "Geometric distribution" },
  { desc: "Roll a die 10 times and count the number of sixes.", answer: "Binomial distribution" },
  { desc: "Survey people until you get the first 'yes' response.", answer: "Geometric distribution" },
  { desc: "Inspect 12 items and count the number of defects.", answer: "Binomial distribution" },
  { desc: "Keep shooting free throws until you make one and record the shot number.", answer: "Geometric distribution" },
  { desc: "Flip a coin 8 times and count heads.", answer: "Binomial distribution" },
  { desc: "Spin a spinner until you land on blue for the first time.", answer: "Geometric distribution" },
  { desc: "Check 15 emails and count the number that are spam.", answer: "Binomial distribution" }
];

// Level 60: Geometric Probability
const geometricProbScenarios = [
  { desc: "A free-throw shooter makes shots with p = 0.6. Find P(first make on 3rd shot).", p: 0.6, x: 3 },
  { desc: "A spinner lands on red with p = 0.2. Find P(first red on 5th spin).", p: 0.2, x: 5 },
  { desc: "A student guesses correctly with p = 0.25. Find P(first correct on 2nd question).", p: 0.25, x: 2 },
  { desc: "A coin has p = 0.5 for heads. Find P(first head on 4th flip).", p: 0.5, x: 4 },
  { desc: "A machine succeeds with p = 0.8. Find P(first success on 1st try).", p: 0.8, x: 1 },
  { desc: "A die shows a 6 with p = 1/6. Find P(first 6 on 6th roll).", p: 1 / 6, x: 6 },
  { desc: "A website conversion rate is p = 0.1. Find P(first conversion on 7th visit).", p: 0.1, x: 7 },
  { desc: "A batter gets a hit with p = 0.3. Find P(first hit on 3rd at-bat).", p: 0.3, x: 3 }
];

// Level 61: Geometric Parameters
const geometricParamScenarios = [
  { desc: "A success rate is p = 0.2. Find the mean and SD of the geometric distribution.", p: 0.2 },
  { desc: "A coin has p = 0.5 for heads. Find the mean and SD of the geometric distribution.", p: 0.5 },
  { desc: "A machine succeeds with p = 0.8. Find the mean and SD of the geometric distribution.", p: 0.8 },
  { desc: "A conversion rate is p = 0.1. Find the mean and SD of the geometric distribution.", p: 0.1 },
  { desc: "A student guesses correctly with p = 0.25. Find the mean and SD of the geometric distribution.", p: 0.25 },
  { desc: "A die shows a 6 with p = 1/6. Find the mean and SD of the geometric distribution.", p: 1 / 6 },
  { desc: "A battery works with p = 0.9. Find the mean and SD of the geometric distribution.", p: 0.9 },
  { desc: "A goal is scored with p = 0.3. Find the mean and SD of the geometric distribution.", p: 0.3 }
];

// Level 62: Unit 4.10-4.12 Capstone
const capstone1012Scenarios = [
  {
    desc: "A fair coin is flipped 10 times. Find P(X = 6).",
    concept: "Binomial probability",
    n: 10,
    p: 0.5,
    x: 6
  },
  {
    desc: "A defect rate is 5%. In 40 items, find the expected number of defects.",
    concept: "Binomial mean",
    n: 40,
    p: 0.05
  },
  {
    desc: "A shooter makes 70% of free throws over 15 attempts. Find the binomial SD.",
    concept: "Binomial SD",
    n: 15,
    p: 0.7
  },
  {
    desc: "A spinner lands on blue with p = 0.2. Find P(first blue on 4th spin).",
    concept: "Geometric probability",
    p: 0.2,
    x: 4
  },
  {
    desc: "A coin has p = 0.5 for heads. Find the geometric mean.",
    concept: "Geometric mean",
    p: 0.5
  },
  {
    desc: "A machine succeeds with p = 0.8. Find the geometric SD.",
    concept: "Geometric SD",
    p: 0.8
  },
  {
    desc: "A quiz has 6 questions with p = 0.25. Find P(X = 2).",
    concept: "Binomial probability",
    n: 6,
    p: 0.25,
    x: 2
  },
  {
    desc: "A website conversion rate is p = 0.1. Find the geometric mean.",
    concept: "Geometric mean",
    p: 0.1
  }
];

// ============ MAIN GENERATOR FUNCTION ============

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // ========== LEVEL 1: Random Process Definition ==========
  if (modeId === "l01-random-process") {
    const scen = drawFromBag('randomProcess', randomProcessScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.1a",
      problemText: "**VAR-1.F:** Identify questions suggested by patterns in data.\n\n" +
                   "A **random process** is a situation where:\n" +
                   "• All possible outcomes are KNOWN\n" +
                   "• Individual outcomes are UNPREDICTABLE\n" +
                   "• Patterns emerge in the LONG RUN",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { vocabAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 2: Outcomes vs Events ==========
  if (modeId === "l02-outcome-event") {
    const scen = drawFromBag('outcomeEvent', outcomeEventScenarios);

    context = {
      topicId: "4.2a",
      problemText: "**UNC-2.A:** Distinguish between outcomes and events.\n\n" +
                   "• **OUTCOME** = result of a SINGLE trial\n" +
                   "  Example: Rolling a 4 on one die roll\n\n" +
                   "• **EVENT** = a COLLECTION of outcomes\n" +
                   "  Example: Rolling a prime number {2, 3, 5}",
      givenText: scen.desc
    };
    answers = { termType: { value: scen.type } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 3: Independence (Gambler's Fallacy) ==========
  if (modeId === "l03-independence") {
    const scen = drawFromBag('independence', independenceScenarios);

    context = {
      topicId: "4.1b",
      problemText: "**Independence:** Each trial has the same probability regardless of past results.\n\n" +
                   "**Gambler's Fallacy:** The WRONG belief that past outcomes affect future probabilities.\n\n" +
                   "Example: Thinking heads is 'due' after many tails\n" +
                   "Reality: Each flip is still 50-50!",
      givenText: scen.desc,
      expectedExplanation: scen.explanation
    };
    answers = { independenceAnswer: { value: scen.correct } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 4: Streaks in Random Data ==========
  if (modeId === "l04-streaks") {
    const scen = drawFromBag('streaks', streakScenarios);

    context = {
      topicId: "4.1c",
      problemText: "**Streaks are NORMAL in random data!**\n\n" +
                   "• In 100 coin flips, a streak of 8+ occurs about 32% of the time\n" +
                   "• Humans AVOID streaks when faking randomness\n" +
                   "• Real random sequences have clusters and long runs\n\n" +
                   "If a sequence has NO streaks, it's probably NOT truly random!",
      givenText: scen.desc,
      expectedExplanation: scen.explanation
    };
    answers = { streakAnswer: { value: scen.surprising } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 5: Simulation Vocabulary ==========
  if (modeId === "l05-simulation-vocab") {
    const scen = drawFromBag('simVocab', simulationVocabScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.2b",
      problemText: "**UNC-2.A:** Estimate probabilities using simulation.\n\n" +
                   "**Simulation** = A way to model random events such that\n" +
                   "simulated outcomes closely match REAL-WORLD outcomes.\n\n" +
                   "Why use simulation?\n" +
                   "• Real trials may be expensive, slow, or impossible\n" +
                   "• Mathematical calculations may be too complex",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { simVocabAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 6: Law of Large Numbers ==========
  if (modeId === "l06-lln") {
    const scen = drawFromBag('lln', llnScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.2c",
      problemText: "**Law of Large Numbers:**\n\n" +
                   "As the number of trials INCREASES, the simulated probability\n" +
                   "gets CLOSER to the TRUE probability.\n\n" +
                   "• Few trials → High variability, unreliable estimate\n" +
                   "• Many trials → Low variability, reliable estimate\n\n" +
                   "This is why simulations need MANY trials!",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { llnAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 7: Digit Assignment ==========
  if (modeId === "l07-digit-assignment") {
    const scen = drawFromBag('digitAssignment', digitAssignmentScenarios);

    context = {
      topicId: "4.2d",
      problemText: "**Step 1: Assign digits to match the probability**\n\n" +
                   "Using digits 1-100:\n" +
                   "• If probability is 82%, use 1-82 for success\n" +
                   "• If probability is 25%, use 1-25 for success\n\n" +
                   "The NUMBER of digits = the PROBABILITY percentage!",
      givenText: scen.desc,
      probability: scen.probability,
      successLabel: scen.successLabel,
      failureRange: scen.failureRange
    };
    answers = {
      digitLow: { value: scen.lowBound, tolerance: 0 },
      digitHigh: { value: scen.highBound, tolerance: 0 }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 8: Trial Definition ==========
  if (modeId === "l08-trial-definition") {
    const scen = drawFromBag('trialDef', trialDefinitionScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.2e",
      problemText: "**Step 2: Define what ONE trial consists of**\n\n" +
                   "One trial = simulating the ENTIRE scenario once\n\n" +
                   "Ask yourself:\n" +
                   "• What random numbers do I generate?\n" +
                   "• What do I count or record?\n" +
                   "• How do I know when the trial is over?",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { trialAnswer: { value: scen.answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 9: Relative Frequency Calculation ==========
  if (modeId === "l09-relative-frequency") {
    const scen = drawFromBag('relFreq', relativeFrequencyScenarios);

    context = {
      topicId: "4.2f",
      problemText: "**Step 3: Calculate relative frequency**\n\n" +
                   "Estimated Probability = (Successes / Total Trials) × 100%\n\n" +
                   "Example: 16 successes out of 50 trials\n" +
                   "= 16/50 = 0.32 = 32%",
      givenText: scen.desc,
      successes: scen.successes,
      total: scen.total
    };
    answers = { probAnswer: { value: scen.probability, tolerance: 0.5 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 10: Full Simulation Design ==========
  if (modeId === "l10-simulation-design") {
    const scen = drawFromBag('simDesign', simulationDesignScenarios);

    context = {
      topicId: "4.2g",
      problemText: "**Complete Simulation Design**\n\n" +
                   "Step 1: Assign digits to outcomes (match probability)\n" +
                   "Step 2: Define one trial (what to generate, what to record)\n" +
                   "Step 3: Perform MANY trials\n" +
                   "Step 4: Calculate relative frequency of successes",
      givenText: scen.desc,
      probability: scen.probability,
      expectedDigitAssignment: scen.digitAssignment,
      expectedTrialDescription: scen.trialDescription
    };
    answers = {
      designDigits: { value: scen.digitAssignment },
      designTrial: { value: scen.trialDescription }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 11: Capstone ==========
  if (modeId === "l11-capstone") {
    const scen = drawFromBag('capstone', capstoneScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.1-4.2",
      problemText: "**Capstone: Apply Your Knowledge**\n\n" +
                   "Key Concepts:\n" +
                   "• Random Process: known outcomes, unpredictable results\n" +
                   "• Independence: past doesn't affect future (gambler's fallacy)\n" +
                   "• Streaks: normal in random data (humans avoid them)\n" +
                   "• Simulation: model random events, many trials\n" +
                   "• Law of Large Numbers: more trials → closer to true probability",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      expectedExplanation: scen.explanation
    };
    answers = {
      capConcept: { value: scen.concept },
      capExplain: { value: scen.explanation }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 12: Sample Space ==========
  if (modeId === "l12-sample-space") {
    const scen = drawFromBag('sampleSpace', sampleSpaceScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.3a",
      problemText: "**VAR-4.A:** Sample Space\n\n" +
                   "The **sample space** (S) is the set of ALL possible non-overlapping outcomes.\n\n" +
                   "Examples:\n" +
                   "• Flip coin: S = {H, T}\n" +
                   "• Roll die: S = {1, 2, 3, 4, 5, 6}\n" +
                   "• Two coins (sequence): S = {HH, HT, TH, TT}",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      explanation: scen.explanation
    };
    answers = { sampleSpaceAnswer: { value: scen.answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 13: Valid Probability Model ==========
  if (modeId === "l13-valid-probability") {
    const scen = drawFromBag('validProb', validProbabilityScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.3b",
      problemText: "**VAR-4.A:** Valid Probability Model\n\n" +
                   "A valid probability distribution must satisfy TWO conditions:\n" +
                   "1. **Each** probability is between 0 and 1 (inclusive)\n" +
                   "2. **All** probabilities sum to exactly 1\n\n" +
                   "Check BOTH conditions!",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      isValid: scen.valid,
      reason: scen.reason
    };
    answers = {
      validProbChoice: { value: scen.valid ? "Yes, it is valid" : "No, it is NOT valid" },
      validProbReason: { value: scen.reason }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 14: Complement Rule ==========
  if (modeId === "l14-complement-rule") {
    const scen = drawFromBag('complement', complementScenarios);

    context = {
      topicId: "4.3c",
      problemText: "**VAR-4.A:** Complement Rule\n\n" +
                   "The **complement** of event A is \"not A\" (written A' or Aᶜ).\n\n" +
                   "**Formula:** P(A') = 1 - P(A)\n\n" +
                   "The event and its complement ALWAYS sum to 1.",
      givenText: scen.desc,
      givenProb: scen.given,
      eventName: scen.eventName,
      complementEvent: scen.complementName
    };
    answers = { complementAnswer: { value: scen.answer, tolerance: 0.01 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 15: At Least One ==========
  if (modeId === "l15-at-least-one") {
    const scen = drawFromBag('atLeastOne', atLeastOneScenarios);

    context = {
      topicId: "4.3d",
      problemText: "**VAR-4.A:** \"At Least One\" Problems\n\n" +
                   "Use the complement approach:\n" +
                   "**P(at least 1) = 1 - P(none)**\n\n" +
                   "This is easier than adding P(1) + P(2) + P(3) + ...\n\n" +
                   "For independent trials:\n" +
                   "P(none in n trials) = (1 - p)ⁿ",
      givenText: scen.desc,
      pNone: scen.pNone,
      expectedExplanation: scen.explanation
    };
    answers = { atLeastOneAnswer: { value: scen.answer, tolerance: 0.01 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 16: Mixed 4.3 Practice ==========
  if (modeId === "l16-mixed-4-3") {
    const scen = drawFromBag('mixed43', mixed43Scenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.3",
      problemText: "**Topic 4.3 Mixed Practice**\n\n" +
                   "Apply these probability rules:\n" +
                   "• Sample space: all possible outcomes\n" +
                   "• Valid model: each prob 0-1, sum = 1\n" +
                   "• Complement: P(not A) = 1 - P(A)\n" +
                   "• At least one: P(≥1) = 1 - P(none)",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      concept: scen.concept,
      explanation: scen.explanation
    };
    answers = {
      mixedAnswer: { value: scen.answer },
      mixedExplain: { value: scen.explanation }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 17: Mutually Exclusive Definition ==========
  if (modeId === "l17-mutually-exclusive-def") {
    const scen = drawFromBag('meDef', mutuallyExclusiveDefScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.4a",
      problemText: "**VAR-4.C:** Mutually Exclusive (Disjoint) Events\n\n" +
                   "Two events are **mutually exclusive** (also called **disjoint**) if:\n" +
                   "• They CANNOT occur at the same time\n" +
                   "• Their intersection is empty: P(A ∩ B) = 0\n\n" +
                   "Example: Being a freshman AND sophomore at the same school",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { meDefAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 18: Joint Probability Calculation ==========
  if (modeId === "l18-joint-probability") {
    const scen = drawFromBag('jointProb', jointProbabilityScenarios);

    // Build a two-way table display string
    const tableRows = scen.table.rows.map((row, i) =>
      `${row}: ${scen.table.data[i].join(', ')}`
    ).join('\n');

    context = {
      topicId: "4.4b",
      problemText: "**VAR-4.C:** Joint Probability P(A ∩ B)\n\n" +
                   "**Joint probability** = probability that BOTH events occur\n\n" +
                   "Formula from a two-way table:\n" +
                   "P(A ∩ B) = (count in both A AND B) / (grand total)\n\n" +
                   "⚠️ Use the GRAND TOTAL as the denominator!",
      givenText: `${scen.desc}\n\nFind P(${scen.eventA} ∩ ${scen.eventB})\n\nData: ${scen.intersection} students are ${scen.eventA} AND ${scen.eventB}\nTotal: ${scen.total} students`,
      eventA: scen.eventA,
      eventB: scen.eventB,
      intersection: scen.intersection,
      total: scen.total
    };
    answers = { jointProbAnswer: { value: scen.answer, tolerance: 0.005 } };
    scenario = `${scen.desc} Find P(${scen.eventA} ∩ ${scen.eventB})`;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 19: Identifying Mutually Exclusive Events ==========
  if (modeId === "l19-identify-me") {
    const scen = drawFromBag('identifyME', identifyMEScenarios);

    context = {
      topicId: "4.4c",
      problemText: "**VAR-4.C:** Identifying Mutually Exclusive Events\n\n" +
                   "To check if events are mutually exclusive:\n" +
                   "• Look at P(A ∩ B) - the intersection probability\n" +
                   "• If P(A ∩ B) = 0 → Events ARE mutually exclusive\n" +
                   "• If P(A ∩ B) > 0 → Events are NOT mutually exclusive\n\n" +
                   "Any non-zero intersection means they CAN occur together!",
      givenText: scen.desc,
      intersection: scen.intersection,
      isME: scen.isME,
      explanation: scen.explanation
    };
    answers = { identifyMEAnswer: { value: scen.isME ? "Yes, mutually exclusive" : "No, NOT mutually exclusive" } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 20: Conditional Probability Definition ==========
  if (modeId === "l20-conditional-def") {
    const scen = drawFromBag('condDef', conditionalDefScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.5a",
      problemText: "**VAR-4.D:** Conditional Probability\n\n" +
                   "**P(B|A)** = \"Probability of B GIVEN A\"\n\n" +
                   "Formula: P(B|A) = P(A ∩ B) / P(A)\n\n" +
                   "The | symbol means \"given\" or \"knowing that\"\n" +
                   "We restrict our sample space to only outcomes where A occurred.",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { condDefAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 21: Conditional Probability from Two-Way Tables ==========
  if (modeId === "l21-conditional-table") {
    const scen = drawFromBag('condTable', conditionalTableScenarios);

    context = {
      topicId: "4.5b",
      problemText: "**VAR-4.D:** Conditional Probability from Tables\n\n" +
                   "To find P(B|A) from a two-way table:\n" +
                   "1. Find the ROW or COLUMN for the condition (A)\n" +
                   "2. Numerator: count in both A AND B\n" +
                   "3. Denominator: total for A (the condition)\n\n" +
                   "⚠️ Use the ROW/COLUMN total, NOT the grand total!",
      givenText: `${scen.desc}\n\nCondition: ${scen.condition}\nTarget: ${scen.target}\nCount(${scen.condition} ∩ ${scen.target}): ${scen.numerator}\nTotal ${scen.condition}: ${scen.denominator}`,
      condition: scen.condition,
      target: scen.target,
      numerator: scen.numerator,
      denominator: scen.denominator
    };
    answers = { condTableAnswer: { value: scen.answer, tolerance: 0.01 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 22: General Multiplication Rule ==========
  if (modeId === "l22-multiplication-rule") {
    const scen = drawFromBag('multRule', multiplicationRuleScenarios);

    context = {
      topicId: "4.5c",
      problemText: "**VAR-4.D:** General Multiplication Rule\n\n" +
                   "**P(A ∩ B) = P(A) × P(B|A)**\n\n" +
                   "This works for ANY two events!\n" +
                   "• P(A) = probability of first event\n" +
                   "• P(B|A) = probability of second GIVEN the first occurred\n\n" +
                   "For 'without replacement' problems, the second probability changes!",
      givenText: scen.desc,
      pA: scen.pA,
      pBgivenA: scen.pBgivenA,
      explanation: scen.explanation
    };
    answers = { multRuleAnswer: { value: scen.answer, tolerance: 0.01 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 23: Order Matters P(A|B) vs P(B|A) ==========
  if (modeId === "l23-order-matters") {
    const scen = drawFromBag('orderMatters', orderMattersScenarios);

    context = {
      topicId: "4.5d",
      problemText: "**VAR-4.D:** Order Matters in Conditional Probability!\n\n" +
                   "P(A|B) ≠ P(B|A) in general!\n\n" +
                   "• P(A|B) = P(A ∩ B) / P(B) → divide by total B\n" +
                   "• P(B|A) = P(A ∩ B) / P(A) → divide by total A\n\n" +
                   "Same numerator, DIFFERENT denominators!",
      givenText: scen.desc,
      eventA: scen.eventA,
      eventB: scen.eventB,
      n_AandB: scen.n_AandB,
      n_A: scen.n_A,
      n_B: scen.n_B,
      total: scen.total,
      pAgivenB: scen.pAgivenB,
      pBgivenA: scen.pBgivenA
    };
    answers = {
      orderAgivenB: { value: scen.pAgivenB, tolerance: 0.01 },
      orderBgivenA: { value: scen.pBgivenA, tolerance: 0.01 }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 24: Mixed 4.4-4.5 Capstone ==========
  if (modeId === "l24-mixed-4-4-5") {
    const scen = drawFromBag('mixed44_45', mixed44_45Scenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.4-4.5",
      problemText: "**Topics 4.4-4.5 Mixed Practice**\n\n" +
                   "Key Concepts:\n" +
                   "• Mutually exclusive: P(A ∩ B) = 0 (cannot occur together)\n" +
                   "• Joint probability: P(A ∩ B) = intersection / grand total\n" +
                   "• Conditional: P(B|A) = intersection / total for A\n" +
                   "• Multiplication rule: P(A ∩ B) = P(A) × P(B|A)\n" +
                   "• Order matters: P(A|B) ≠ P(B|A) generally",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      concept: scen.concept,
      explanation: scen.explanation
    };
    answers = {
      capstone44Answer: { value: scen.answer },
      capstone44Explain: { value: scen.explanation }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 25: Independent Events Definition ==========
  if (modeId === "l25-independent-def") {
    const scen = drawFromBag('indepDef', independentDefScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.6a",
      problemText: "**VAR-4.E:** Independent Events\n\n" +
                   "Events A and B are **independent** if:\n" +
                   "• Knowing one occurred doesn't change the other's probability\n" +
                   "• P(A|B) = P(A) (or equivalently P(B|A) = P(B))\n" +
                   "• P(A ∩ B) = P(A) × P(B)\n\n" +
                   "⚠️ Independent ≠ Mutually Exclusive!",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { indepDefAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 26: Check Independence - Conditional Method ==========
  if (modeId === "l26-check-indep-conditional") {
    const scen = drawFromBag('checkIndepCond', checkIndepCondScenarios);

    context = {
      topicId: "4.6b",
      problemText: "**VAR-4.E:** Checking Independence (Conditional Method)\n\n" +
                   "To check if A and B are independent:\n" +
                   "Compare P(A|B) with P(A)\n\n" +
                   "• If P(A|B) = P(A) → Independent\n" +
                   "• If P(A|B) ≠ P(A) → NOT Independent (Dependent)\n\n" +
                   "Knowing B shouldn't change A's probability!",
      givenText: `${scen.desc}\n\nP(A) = ${scen.pA}\nP(A|B) = ${scen.pAgivenB}`,
      pA: scen.pA,
      pAgivenB: scen.pAgivenB,
      isIndep: scen.isIndep,
      explanation: scen.explanation
    };
    answers = { checkIndepCondAnswer: { value: scen.isIndep ? "Yes, they are independent" : "No, they are NOT independent" } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 27: Check Independence - Multiplication Method ==========
  if (modeId === "l27-check-indep-mult") {
    const scen = drawFromBag('checkIndepMult', checkIndepMultScenarios);

    context = {
      topicId: "4.6c",
      problemText: "**VAR-4.E:** Checking Independence (Multiplication Method)\n\n" +
                   "To check if A and B are independent:\n" +
                   "Calculate P(A) × P(B) and compare with P(A ∩ B)\n\n" +
                   "• If P(A) × P(B) = P(A ∩ B) → Independent\n" +
                   "• If P(A) × P(B) ≠ P(A ∩ B) → NOT Independent",
      givenText: `${scen.desc}\n\nP(A) = ${scen.pA}, P(B) = ${scen.pB}, P(A ∩ B) = ${scen.pAB}`,
      pA: scen.pA,
      pB: scen.pB,
      pAB: scen.pAB,
      pA_times_pB: scen.pA_times_pB,
      isIndep: scen.isIndep,
      explanation: scen.explanation
    };
    answers = {
      pAB_calc: { value: scen.pA_times_pB, tolerance: 0.005 },
      checkIndepMultAnswer: { value: scen.isIndep ? "Yes, they are independent" : "No, they are NOT independent" }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 28: Multiplication Rule for Independent Events ==========
  if (modeId === "l28-mult-rule-indep") {
    const scen = drawFromBag('multIndep', multIndepScenarios);

    context = {
      topicId: "4.6d",
      problemText: "**VAR-4.E:** Multiplication Rule for Independent Events\n\n" +
                   "For **independent** events:\n" +
                   "**P(A and B) = P(A) × P(B)**\n\n" +
                   "This simplified rule only works when events are independent!\n" +
                   "Examples: coin flips, dice rolls, draws WITH replacement",
      givenText: scen.desc,
      pA: scen.pA,
      pB: scen.pB,
      explanation: scen.explanation
    };
    answers = { multIndepAnswer: { value: scen.answer, tolerance: 0.005 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 29: Addition Rule Definition ==========
  if (modeId === "l29-addition-rule-def") {
    const scen = drawFromBag('addRuleDef', additionRuleDefScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.6e",
      problemText: "**VAR-4.E:** Addition Rule (Union)\n\n" +
                   "**P(A or B) = P(A) + P(B) - P(A ∩ B)**\n\n" +
                   "We subtract P(A ∩ B) to avoid double-counting!\n\n" +
                   "For **mutually exclusive** events (P(A ∩ B) = 0):\n" +
                   "P(A or B) = P(A) + P(B)",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { addRuleDefAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 30: Calculate Union ==========
  if (modeId === "l30-calculate-union") {
    const scen = drawFromBag('calcUnion', calculateUnionScenarios);

    const meNote = scen.isME ? "\n\n(Note: These events are mutually exclusive)" : "";

    context = {
      topicId: "4.6f",
      problemText: "**VAR-4.E:** Calculating P(A or B)\n\n" +
                   "General Addition Rule:\n" +
                   "**P(A ∪ B) = P(A) + P(B) - P(A ∩ B)**\n\n" +
                   "If mutually exclusive (P(A ∩ B) = 0):\n" +
                   "P(A ∪ B) = P(A) + P(B)",
      givenText: scen.desc + meNote,
      pA: scen.pA,
      pB: scen.pB,
      pAB: scen.pAB,
      isME: scen.isME,
      explanation: scen.explanation
    };
    answers = { unionAnswer: { value: scen.answer, tolerance: 0.01 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 31: Independent vs Mutually Exclusive ==========
  if (modeId === "l31-indep-vs-me") {
    const scen = drawFromBag('indepVsME', indepVsMEScenarios);

    context = {
      topicId: "4.6g",
      problemText: "**VAR-4.E:** Independent vs Mutually Exclusive\n\n" +
                   "**Independent**: P(A ∩ B) = P(A) × P(B)\n" +
                   "• Events CAN occur together\n" +
                   "• Knowing one doesn't change the other's probability\n\n" +
                   "**Mutually Exclusive**: P(A ∩ B) = 0\n" +
                   "• Events CANNOT occur together\n" +
                   "• These are always DEPENDENT (knowing one affects the other!)",
      givenText: scen.desc,
      explanation: scen.explanation
    };
    answers = { indepVsMeAnswer: { value: scen.relationship } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 32: Mixed 4.6 Capstone ==========
  if (modeId === "l32-mixed-4-6") {
    const scen = drawFromBag('mixed46', mixed46Scenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.6",
      problemText: "**Topic 4.6 Mixed Practice**\n\n" +
                   "Key Concepts:\n" +
                   "• Independent: P(A|B) = P(A), or P(A ∩ B) = P(A)×P(B)\n" +
                   "• For independent: P(A and B) = P(A) × P(B)\n" +
                   "• Addition Rule: P(A or B) = P(A) + P(B) - P(A ∩ B)\n" +
                   "• ME simplifies to: P(A or B) = P(A) + P(B)\n" +
                   "• Independent ≠ Mutually Exclusive!",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      concept: scen.concept,
      explanation: scen.explanation
    };
    answers = {
      capstone46Answer: { value: scen.answer },
      capstone46Explain: { value: scen.explanation }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 33: Random Variable Definition ==========
  if (modeId === "l33-random-var-def") {
    const scen = drawFromBag('randomVarDef', randomVarDefScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.7a",
      problemText: "**VAR-5.A:** Random Variables\n\n" +
                   "A **random variable** assigns a NUMERICAL value to outcomes of random behavior.\n\n" +
                   "• Always labeled with CAPITAL letters (X, Y, W, etc.)\n" +
                   "• The value is determined by CHANCE\n" +
                   "• Must be NUMERICAL (numbers, not categories)",
      givenText: scen.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { rvDefAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 34: Discrete vs Continuous ==========
  if (modeId === "l34-discrete-continuous") {
    const scen = drawFromBag('discreteVsCont', discreteVsContinuousScenarios);

    context = {
      topicId: "4.7b",
      problemText: "**VAR-5.A:** Discrete vs Continuous Random Variables\n\n" +
                   "**DISCRETE**: Countable number of values\n" +
                   "• Gaps/spaces between possible values\n" +
                   "• Examples: counts, whole numbers\n\n" +
                   "**CONTINUOUS**: Infinite values in an interval\n" +
                   "• No gaps between possible values\n" +
                   "• Examples: measurements (time, length, weight)",
      givenText: scen.desc,
      explanation: scen.explanation
    };
    answers = { discContAnswer: { value: scen.type } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 35: Valid Probability Distribution ==========
  if (modeId === "l35-valid-prob-dist") {
    const scen = drawFromBag('validProbDist', validProbDistScenarios);

    const tableDisplay = `X: ${scen.table.x.join(', ')}\nP(X): ${scen.table.p.join(', ')}`;
    const sum = scen.table.p.reduce((a, b) => a + b, 0).toFixed(2);

    context = {
      topicId: "4.7c",
      problemText: "**VAR-5.A:** Valid Probability Distribution\n\n" +
                   "A valid probability distribution must satisfy TWO conditions:\n" +
                   "1. **Each** probability is between 0 and 1 (inclusive)\n" +
                   "2. **All** probabilities sum to exactly 1\n\n" +
                   "Check BOTH conditions!",
      givenText: `Is this a valid probability distribution?\n\n${tableDisplay}\n\nSum of probabilities: ${sum}`,
      tableX: scen.table.x,
      tableP: scen.table.p,
      isValid: scen.isValid,
      reason: scen.reason
    };
    answers = { validDistAnswer: { value: scen.isValid ? "Yes, valid" : "No, invalid" } };
    scenario = tableDisplay;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 36: Probability from Distribution ==========
  if (modeId === "l36-prob-from-dist") {
    const scen = drawFromBag('probFromDist', probFromDistScenarios);

    context = {
      topicId: "4.7d",
      problemText: "**VAR-5.A:** Calculating Probability from a Distribution\n\n" +
                   "To find probabilities, ADD the P(X) values for all X in the range:\n\n" +
                   "• P(X ≤ k) = P(X=0) + P(X=1) + ... + P(X=k)\n" +
                   "• P(X ≥ k) = P(X=k) + P(X=k+1) + ...\n" +
                   "• P(a ≤ X ≤ b) = add all P(X) from a to b",
      givenText: `${scen.desc}\n\n**Question:** ${scen.question}`,
      calculation: scen.calculation,
      explanation: scen.explanation
    };
    answers = { probDistAnswer: { value: scen.answer, tolerance: 0.01 } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 37: Describe Distribution ==========
  if (modeId === "l37-describe-dist") {
    const scen = drawFromBag('describeDist', describeDistScenarios);

    context = {
      topicId: "4.7e",
      problemText: "**VAR-5.B:** Describing a Probability Distribution\n\n" +
                   "Describe using **shape, center, and spread**:\n\n" +
                   "**Shape**: Symmetric, skewed left, skewed right, uniform\n" +
                   "**Center**: Mean (μ) or median\n" +
                   "**Spread**: Standard deviation (σ) or range",
      givenText: `${scen.name}\n\nDistribution: ${scen.dist}`,
      distName: scen.name,
      expectedShape: scen.shape,
      expectedCenter: scen.center,
      expectedSpread: scen.spread,
      shapeExplanation: scen.shapeExplanation
    };
    answers = { shapeAnswer: { value: scen.shape } };
    scenario = scen.name;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 38: Mean (Expected Value) ==========
  if (modeId === "l38-mean-formula") {
    const scen = drawFromBag('meanFormula', meanFormulaScenarios);

    context = {
      topicId: "4.8a",
      problemText: "**VAR-5.C:** Mean (Expected Value) of a Discrete Random Variable\n\n" +
                   "**Formula:** μ = Σ[x · P(x)]\n\n" +
                   "• Multiply each value by its probability\n" +
                   "• Add all the products together\n" +
                   "• The result is the 'long-run average'",
      givenText: `${scen.desc}\n\nCalculation: ${scen.calculation}`,
      formula: scen.formula,
      calculation: scen.calculation,
      interpretation: scen.interpretation
    };
    answers = { meanAnswer: { value: scen.answer, tolerance: 0.1 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 39: Standard Deviation ==========
  if (modeId === "l39-std-dev-formula") {
    const scen = drawFromBag('stdDevFormula', stdDevFormulaScenarios);

    context = {
      topicId: "4.8b",
      problemText: "**VAR-5.C:** Standard Deviation of a Discrete Random Variable\n\n" +
                   "**Formula:** σ = √[Σ(x - μ)² · P(x)]\n\n" +
                   "Steps:\n" +
                   "1. Find each deviation: (x - μ)\n" +
                   "2. Square each deviation: (x - μ)²\n" +
                   "3. Multiply by probability: (x - μ)² · P(x)\n" +
                   "4. Sum all products and take square root",
      givenText: `${scen.desc}\n\nMean: μ = ${scen.mean}`,
      formula: scen.formula,
      mean: scen.mean,
      interpretation: scen.interpretation
    };
    answers = { stdDevAnswer: { value: scen.answer, tolerance: 0.05 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 40: Interpret Parameters (Capstone) ==========
  if (modeId === "l40-interpret-params") {
    const scen = drawFromBag('interpretParams', interpretParamsScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.7-4.8",
      problemText: "**VAR-5.D:** Interpreting Parameters in Context\n\n" +
                   "**Mean (μ):** Long-run average value\n" +
                   "• Use context and units in interpretation!\n\n" +
                   "**Standard Deviation (σ):** Typical deviation from mean\n" +
                   "• Describes how spread out values are",
      givenText: `${scen.desc}\n\n**Question:** ${scen.question}`,
      concept: scen.concept,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { interpretAnswer: { value: scen.answer } };
    scenario = scen.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 41: Linear Transform - Mean ==========
  if (modeId === "l41-transform-mean") {
    const scen = drawFromBag('transformMean', transformMeanScenarios);

    context = {
      topicId: "4.9a",
      problemText: "**VAR-5.E:** Linear Transformation of Mean\n\n" +
                   "For **Y = a + bX**:\n" +
                   "**μY = a + b·μX**\n\n" +
                   "• Multiply the mean by the slope (b)\n" +
                   "• Then add the constant (a)",
      givenText: `${scen.desc}\n\nFormula: Y = ${scen.a} + ${scen.b}X\nGiven: μX = ${scen.muX}`,
      a: scen.a,
      b: scen.b,
      muX: scen.muX,
      expectedExplanation: scen.explanation
    };
    answers = { transformMeanAnswer: { value: scen.answer, tolerance: 0.1 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 42: Linear Transform - SD ==========
  if (modeId === "l42-transform-sd") {
    const scen = drawFromBag('transformSD', transformSDScenarios);

    context = {
      topicId: "4.9b",
      problemText: "**VAR-5.E:** Linear Transformation of Standard Deviation\n\n" +
                   "For **Y = a + bX**:\n" +
                   "**σY = |b|·σX**\n\n" +
                   "⚠️ The constant 'a' does NOT affect spread!\n" +
                   "Only the multiplier 'b' changes the SD.\n" +
                   "Use absolute value |b| to ensure positive SD.",
      givenText: `${scen.desc}\n\nFormula: Y = ${scen.a} + ${scen.b}X\nGiven: σX = ${scen.sigmaX}`,
      a: scen.a,
      b: scen.b,
      sigmaX: scen.sigmaX,
      expectedExplanation: scen.explanation
    };
    answers = { transformSDAnswer: { value: scen.answer, tolerance: 0.05 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 43: Sum of Means ==========
  if (modeId === "l43-sum-means") {
    const scen = drawFromBag('sumMeans', sumMeansScenarios);

    context = {
      topicId: "4.9c",
      problemText: "**VAR-5.E:** Mean of a Sum\n\n" +
                   "For independent random variables X and Y:\n" +
                   "**μ(X+Y) = μX + μY**\n\n" +
                   "Means add normally! Just add the two means together.",
      givenText: `${scen.desc}\n\nGiven: μX = ${scen.muX}, μY = ${scen.muY}`,
      muX: scen.muX,
      muY: scen.muY,
      expectedExplanation: scen.explanation
    };
    answers = { sumMeansAnswer: { value: scen.answer, tolerance: 0.1 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 44: Difference of Means ==========
  if (modeId === "l44-diff-means") {
    const scen = drawFromBag('diffMeans', diffMeansScenarios);

    context = {
      topicId: "4.9d",
      problemText: "**VAR-5.E:** Mean of a Difference\n\n" +
                   "For independent random variables X and Y:\n" +
                   "**μ(X-Y) = μX - μY**\n\n" +
                   "Means subtract normally! Just subtract the second mean from the first.",
      givenText: `${scen.desc}\n\nGiven: μX = ${scen.muX}, μY = ${scen.muY}`,
      muX: scen.muX,
      muY: scen.muY,
      expectedExplanation: scen.explanation
    };
    answers = { diffMeansAnswer: { value: scen.answer, tolerance: 0.1 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 45: Combined SD - Sum (THE VARIANCE TRAP) ==========
  if (modeId === "l45-combined-sd-sum") {
    const scen = drawFromBag('combinedSDSum', combinedSDSumScenarios);

    context = {
      topicId: "4.9e",
      problemText: "**VAR-5.E:** Standard Deviation of a Sum ⚠️ VARIANCE TRAP\n\n" +
                   "For INDEPENDENT random variables X and Y:\n" +
                   "**σ(X+Y) = √(σX² + σY²)**\n\n" +
                   "⚠️ DO NOT add SDs directly! ⚠️\n" +
                   "σ(X+Y) ≠ σX + σY\n\n" +
                   "Steps:\n" +
                   "1. Square each SD to get variances\n" +
                   "2. ADD the variances\n" +
                   "3. Take the square root",
      givenText: `${scen.desc}\n\nGiven: σX = ${scen.sigmaX}, σY = ${scen.sigmaY}\n\n⚠️ Remember: Don't just add ${scen.sigmaX} + ${scen.sigmaY}!`,
      sigmaX: scen.sigmaX,
      sigmaY: scen.sigmaY,
      varX: scen.varX,
      varY: scen.varY,
      trapAnswer: scen.trapAnswer,
      expectedExplanation: scen.explanation
    };
    answers = { combinedSDSumAnswer: { value: scen.answer, tolerance: 0.05 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 46: Combined SD - Difference (THE TRAP CONTINUES) ==========
  if (modeId === "l46-combined-sd-diff") {
    const scen = drawFromBag('combinedSDDiff', combinedSDDiffScenarios);

    context = {
      topicId: "4.9f",
      problemText: "**VAR-5.E:** Standard Deviation of a Difference ⚠️ TRAP PART 2\n\n" +
                   "For INDEPENDENT random variables X and Y:\n" +
                   "**σ(X-Y) = √(σX² + σY²)**\n\n" +
                   "⚠️ Same formula as the SUM! ⚠️\n" +
                   "Variances ALWAYS ADD, even for X-Y!\n\n" +
                   "Why? Subtracting uncertain quantities\n" +
                   "creates MORE uncertainty, not less.",
      givenText: `${scen.desc}\n\nGiven: σX = ${scen.sigmaX}, σY = ${scen.sigmaY}\n\n⚠️ Don't subtract: ${scen.sigmaX} - ${scen.sigmaY} is WRONG!`,
      sigmaX: scen.sigmaX,
      sigmaY: scen.sigmaY,
      varX: scen.varX,
      varY: scen.varY,
      trapAnswer1: scen.trapAnswer1,
      trapAnswer2: scen.trapAnswer2,
      expectedExplanation: scen.explanation
    };
    answers = { combinedSDDiffAnswer: { value: scen.answer, tolerance: 0.05 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 47: Identify the Error ==========
  if (modeId === "l47-identify-error") {
    const scen = drawFromBag('identifyError', identifyErrorScenarios);
    const options = shuffle([...scen.options]);

    context = {
      topicId: "4.9g",
      problemText: "**VAR-5.E:** Identifying Errors in Combining Random Variables\n\n" +
                   "Common errors to watch for:\n" +
                   "• Adding SDs directly (σX + σY)\n" +
                   "• Subtracting SDs for X-Y\n" +
                   "• Including constants in SD calculation\n" +
                   "• Forgetting the square root\n" +
                   "• Getting negative SD",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      correctSD: scen.correctSD,
      expectedExplanation: scen.explanation
    };
    answers = { identifyErrorAnswer: { value: scen.answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 48: Capstone 4.9 ==========
  if (modeId === "l48-capstone-49") {
    const scen = drawFromBag('capstone49', capstone49Scenarios);

    context = {
      topicId: "4.9",
      problemText: "**VAR-5.E:** Combining Random Variables - Capstone\n\n" +
                   "For INDEPENDENT X and Y:\n\n" +
                   "**Mean:**\n" +
                   "• μ(X+Y) = μX + μY\n" +
                   "• μ(X-Y) = μX - μY\n\n" +
                   "**Standard Deviation:**\n" +
                   "• σ(X+Y) = √(σX² + σY²)\n" +
                   "• σ(X-Y) = √(σX² + σY²) ← Same formula!\n\n" +
                   "Calculate BOTH the mean AND standard deviation.",
      givenText: `${scen.desc}\n\nGiven:\nX: μX = ${scen.muX}, σX = ${scen.sigmaX}\nY: μY = ${scen.muY}, σY = ${scen.sigmaY}`,
      muX: scen.muX,
      muY: scen.muY,
      sigmaX: scen.sigmaX,
      sigmaY: scen.sigmaY,
      expectedExplanation: scen.explanation
    };
    answers = {
      capstoneMeanAnswer: { value: scen.answerMean, tolerance: 0.1 },
      capstoneSDAnswer: { value: scen.answerSD, tolerance: 0.05 }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 49: BINS Conditions ==========
  if (modeId === "l49-bins-conditions") {
    const scen = drawFromBag('binsCondition', binsConditionScenarios);

    context = {
      topicId: "4.10a",
      problemText: "**BINS Conditions for Binomial:**\n\n" +
                   "B = Binary outcomes\n" +
                   "I = Independent trials\n" +
                   "N = Number of trials fixed\n" +
                   "S = Same probability each trial",
      givenText: scen.desc
    };
    answers = { binsCondition: { value: scen.answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 50: Identify Binomial Setting ==========
  if (modeId === "l50-identify-bins") {
    const scen = drawFromBag('identifyBinomial', identifyBinomialScenarios);
    const yesNo = scen.isBinomial ? "Yes, it is binomial" : "No, it is NOT binomial";

    context = {
      topicId: "4.10b",
      problemText: "**Identify Binomial Settings**\n\n" +
                   "Check BINS:\n" +
                   "• Binary outcomes\n" +
                   "• Independent trials\n" +
                   "• Number of trials fixed\n" +
                   "• Same probability each trial",
      givenText: scen.desc,
      expectedExplanation: scen.explanation,
      isBinomial: scen.isBinomial,
      failingCondition: scen.failingCondition
    };
    answers = { binomYesNo: { value: yesNo } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 51: Binomial Components ==========
  if (modeId === "l51-binomial-formula-id") {
    const scen = drawFromBag('binomialComponents', binomialComponentsScenarios);

    context = {
      topicId: "4.10c",
      problemText: "**Identify Binomial Components**\n\n" +
                   "n = number of trials\n" +
                   "p = probability of success\n" +
                   "x = number of successes",
      givenText: scen.desc
    };
    answers = {
      binomN: { value: scen.n, tolerance: 0 },
      binomP: { value: scen.p, tolerance: 0.01 },
      binomX: { value: scen.x, tolerance: 0 }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 52: Binomial Single Probability ==========
  if (modeId === "l52-binomial-single-prob") {
    const scen = drawFromBag('binomialSingleProb', binomialSingleProbScenarios);
    const prob = parseFloat(binomialProb(scen.n, scen.p, scen.x).toFixed(5));

    context = {
      topicId: "4.10d",
      problemText: "**Binomial Probability**\n\n" +
                   "P(X = x) = C(n,x) · p^x · (1-p)^(n-x)",
      givenText: scen.desc,
      n: scen.n,
      p: scen.p,
      x: scen.x
    };
    answers = { binomSingleProb: { value: prob, tolerance: 0.001 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 53: Binomial Cumulative ==========
  if (modeId === "l53-binomial-cumulative") {
    const scen = drawFromBag('binomialCumulative', binomialCumulativeScenarios);
    let prob = 0;
    if (scen.direction === "<=") {
      for (let i = 0; i <= scen.k; i++) {
        prob += binomialProb(scen.n, scen.p, i);
      }
    } else {
      for (let i = scen.k; i <= scen.n; i++) {
        prob += binomialProb(scen.n, scen.p, i);
      }
    }
    const value = parseFloat(prob.toFixed(5));

    context = {
      topicId: "4.10e",
      problemText: "**Cumulative Binomial Probability**\n\n" +
                   "Use cumulative sums or the complement for \"at least\" problems.",
      givenText: scen.desc,
      n: scen.n,
      p: scen.p,
      k: scen.k,
      direction: scen.direction
    };
    answers = { binomCumulativeProb: { value, tolerance: 0.001 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 54: Binomial Capstone ==========
  if (modeId === "l54-binomial-capstone") {
    const scen = drawFromBag('binomialCapstone', binomialCapstoneScenarios);
    const baseOptions = [
      "BINS conditions",
      "Identify n, p, x",
      "Single probability P(X = k)",
      "Cumulative probability"
    ];
    const options = shuffle([...baseOptions]);

    context = {
      topicId: "4.10",
      problemText: "**Binomial Capstone**\n\n" +
                   "Decide which binomial concept applies and explain why.",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      expectedExplanation: scen.explanation
    };
    answers = { binomCapstoneConcept: { value: scen.answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 55: Binomial Mean ==========
  if (modeId === "l55-binomial-mean") {
    const scen = drawFromBag('binomialMean', binomialMeanScenarios);
    const mean = parseFloat((scen.n * scen.p).toFixed(3));

    context = {
      topicId: "4.11a",
      problemText: "**Binomial Mean**\n\n" +
                   "μ = n · p",
      givenText: scen.desc,
      n: scen.n,
      p: scen.p,
      contextLabel: scen.context
    };
    answers = { binomMean: { value: mean, tolerance: 0.1 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 56: Binomial SD ==========
  if (modeId === "l56-binomial-sd") {
    const scen = drawFromBag('binomialSD', binomialSDScenarios);
    const sd = parseFloat(Math.sqrt(scen.n * scen.p * (1 - scen.p)).toFixed(4));

    context = {
      topicId: "4.11b",
      problemText: "**Binomial Standard Deviation**\n\n" +
                   "σ = √[n · p · (1-p)]",
      givenText: scen.desc,
      n: scen.n,
      p: scen.p,
      contextLabel: scen.context
    };
    answers = { binomSD: { value: sd, tolerance: 0.05 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 57: Interpret Binomial Parameters ==========
  if (modeId === "l57-interpret-binom-params") {
    const scen = drawFromBag('interpretBinomParams', interpretBinomParamsScenarios);
    const mu = parseFloat((scen.n * scen.p).toFixed(2));
    const sigma = parseFloat(Math.sqrt(scen.n * scen.p * (1 - scen.p)).toFixed(2));
    const focus = choice(["mean", "sd"]);

    const meanStatement = `On average, about ${mu} successes occur in ${scen.n} trials.`;
    const sdStatement = `A typical outcome differs from the mean by about ${sigma} successes.`;

    const options = shuffle([
      meanStatement,
      sdStatement,
      `The probability of success on each trial is ${mu}.`,
      `The number of trials is ${sigma}.`
    ]);
    const answer = focus === "mean" ? meanStatement : sdStatement;

    // Explicitly tell student which parameter to interpret
    const focusLabel = focus === "mean" ? "the MEAN (μ)" : "the STANDARD DEVIATION (σ)";

    context = {
      topicId: "4.11c",
      problemText: "**Interpret Binomial Parameters**\n\n" +
                   "μ = n·p (long-run average successes)\n" +
                   "σ = √[n·p·(1-p)] (typical variation)",
      givenText: scen.desc + `\n\n**Select the correct interpretation of ${focusLabel}.**`,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      mu,
      sigma
    };
    answers = { binomParamsInterpret: { value: answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 58: Would You Be Surprised? ==========
  if (modeId === "l58-would-be-surprised") {
    const scen = drawFromBag('surprised', surprisedScenarios);
    const lower = scen.mu - 2 * scen.sigma;
    const upper = scen.mu + 2 * scen.sigma;
    const isSurprising = scen.value < lower || scen.value > upper;
    const answer = isSurprising
      ? "Yes, it would be surprising"
      : "No, it would not be surprising";

    context = {
      topicId: "4.11d",
      problemText: "**2-SD Rule for Unusual Outcomes**\n\n" +
                   "Unusual if outside μ ± 2σ.",
      givenText: scen.desc,
      mu: scen.mu,
      sigma: scen.sigma,
      value: scen.value,
      lower,
      upper,
      isSurprising
    };
    answers = { surprisedChoice: { value: answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 59: Geometric vs Binomial ==========
  if (modeId === "l59-geometric-identify") {
    const scen = drawFromBag('geometricIdentify', geometricIdentifyScenarios);

    context = {
      topicId: "4.12a",
      problemText: "**Geometric vs Binomial**\n\n" +
                   "Geometric: trials until first success.\n" +
                   "Binomial: fixed number of trials.",
      givenText: scen.desc
    };
    answers = { geomIdentify: { value: scen.answer } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 60: Geometric Probability ==========
  if (modeId === "l60-geometric-prob") {
    const scen = drawFromBag('geometricProb', geometricProbScenarios);
    const prob = parseFloat(geometricProb(scen.p, scen.x).toFixed(5));

    context = {
      topicId: "4.12b",
      problemText: "**Geometric Probability**\n\n" +
                   "P(X = x) = (1-p)^(x-1) · p",
      givenText: scen.desc,
      p: scen.p,
      x: scen.x
    };
    answers = { geomProb: { value: prob, tolerance: 0.001 } };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 61: Geometric Parameters ==========
  if (modeId === "l61-geometric-params") {
    const scen = drawFromBag('geometricParams', geometricParamScenarios);
    const mean = parseFloat((1 / scen.p).toFixed(3));
    const sd = parseFloat(Math.sqrt((1 - scen.p) / (scen.p * scen.p)).toFixed(4));

    context = {
      topicId: "4.12c",
      problemText: "**Geometric Parameters**\n\n" +
                   "μ = 1/p\n" +
                   "σ = √[(1-p)/p²]",
      givenText: scen.desc,
      p: scen.p
    };
    answers = {
      geomMean: { value: mean, tolerance: 0.1 },
      geomSD: { value: sd, tolerance: 0.05 }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 62: Unit 4.10-4.12 Capstone ==========
  if (modeId === "l62-unit4-capstone-1012") {
    const scen = drawFromBag('capstone1012', capstone1012Scenarios);
    const baseOptions = [
      "Binomial probability",
      "Binomial mean",
      "Binomial SD",
      "Geometric probability",
      "Geometric mean",
      "Geometric SD"
    ];
    const distractors = shuffle(baseOptions.filter(opt => opt !== scen.concept)).slice(0, 3);
    const options = shuffle([...distractors, scen.concept]);

    let value = 0;
    let tolerance = 0.1;
    if (scen.concept === "Binomial probability") {
      value = parseFloat(binomialProb(scen.n, scen.p, scen.x).toFixed(5));
      tolerance = 0.001;
    } else if (scen.concept === "Binomial mean") {
      value = parseFloat((scen.n * scen.p).toFixed(3));
      tolerance = 0.1;
    } else if (scen.concept === "Binomial SD") {
      value = parseFloat(Math.sqrt(scen.n * scen.p * (1 - scen.p)).toFixed(4));
      tolerance = 0.05;
    } else if (scen.concept === "Geometric probability") {
      value = parseFloat(geometricProb(scen.p, scen.x).toFixed(5));
      tolerance = 0.001;
    } else if (scen.concept === "Geometric mean") {
      value = parseFloat((1 / scen.p).toFixed(3));
      tolerance = 0.1;
    } else if (scen.concept === "Geometric SD") {
      value = parseFloat(Math.sqrt((1 - scen.p) / (scen.p * scen.p)).toFixed(4));
      tolerance = 0.05;
    }

    context = {
      topicId: "4.10-4.12",
      problemText: "**Unit 4.10-4.12 Capstone**\n\n" +
                   "Identify the correct distribution and compute the requested value.",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      expectedValue: value,
      concept: scen.concept
    };
    answers = {
      capstone1012Concept: { value: scen.concept },
      capstone1012Value: { value, tolerance }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== FALLBACK ==========
  return {
    context: { topicId: "?", problemText: "Level not implemented.", givenText: "" },
    graphConfig: null,
    answers: {},
    scenario: ""
  };
}

export default { generateProblem };
