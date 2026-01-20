// generator.js - AP Statistics Unit 4 Lessons 1-2: Probability & Simulation
// Topics: Random processes, outcomes, events, simulation, Law of Large Numbers

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

  // ========== FALLBACK ==========
  return {
    context: { topicId: "?", problemText: "Level not implemented.", givenText: "" },
    graphConfig: null,
    answers: {},
    scenario: ""
  };
}

export default { generateProblem };
