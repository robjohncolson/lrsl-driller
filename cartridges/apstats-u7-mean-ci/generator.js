// generator.js - AP Statistics Unit 7 Topic 7.2
// Constructing a confidence interval for a population mean.
// Skills: identify the procedure, check conditions, find t*, compute
// margin of error, and construct a one-sample t-interval.

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

function roundTo(value, digits) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function randStep(min, max, step) {
  const count = Math.round((max - min) / step);
  return roundTo(min + randInt(0, count) * step, 3);
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

function attachAnswers(context, answers) {
  return {
    ...context,
    answers
  };
}

// ============ CONSTANTS ============

const PROCEDURE_CORRECT = "One-sample t-interval for a population mean";
const PROCEDURE_WRONG = [
  "One-sample z-interval for a population proportion",
  "One-sample t-test for a population mean",
  "Two-sample t-interval for a difference in population means"
];

const T_CRITICALS = {
  "10-90": 1.833,
  "10-95": 2.262,
  "10-99": 3.25,
  "12-95": 2.201,
  "16-90": 1.753,
  "16-95": 2.131,
  "21-95": 2.086,
  "25-90": 1.711,
  "25-95": 2.064,
  "31-95": 2.042,
  "40-90": 1.685,
  "41-95": 2.021,
  "51-99": 2.678
};

function getTCritical(n, confLevel) {
  return T_CRITICALS[`${n}-${confLevel}`];
}

function chooseSupportedPair(nChoices, confChoices) {
  const pairs = [];
  nChoices.forEach(n => {
    confChoices.forEach(confLevel => {
      if (getTCritical(n, confLevel) !== undefined) {
        pairs.push({ n, confLevel });
      }
    });
  });
  return choice(pairs);
}

// ============ SCENARIO BANKS ============

const procedureScenarios = [
  {
    desc: "A bakery owner records the weights of 10 randomly selected bags of powdered sugar to estimate the mean fill weight μ of all bags from a new wholesaler."
  },
  {
    desc: "Wildlife biologists take a random sample of 40 fiddler crabs and record the number of scoops per 30 seconds to estimate the mean feeding rate for this species."
  },
  {
    desc: "A school counselor randomly selects 22 students and records their commute times to estimate the mean commute time for all students at the school."
  },
  {
    desc: "An engineer tests 16 randomly selected batteries and records battery life in hours to estimate the mean battery life of that model."
  },
  {
    desc: "A farmer randomly samples 25 tomato plants and measures plant height to estimate the mean height of all tomato plants in the greenhouse."
  },
  {
    desc: "A clinic randomly samples 12 patients and records waiting times to estimate the mean waiting time for all patients during afternoon appointments."
  },
  {
    desc: "A coffee shop randomly samples 31 receipts and records dollars spent to estimate the mean purchase amount for all customers that week."
  },
  {
    desc: "A packaging company randomly samples 21 cereal boxes and records fill weights to estimate the mean weight of all boxes from the production run."
  },
  {
    desc: "A college randomly samples 18 dorm rooms and records electricity usage to estimate the mean monthly electricity use for all dorm rooms."
  },
  {
    desc: "A trainer randomly samples 24 runners and records mile times to estimate the mean mile time for all runners in the program."
  }
];

const conditionScenarios = [
  {
    desc: "A bakery owner randomly selects 10 bags of powdered sugar from a wholesaler. A boxplot of the weights shows no strong skewness or outliers.",
    given: "n = 10, random sample, and 10 bags is reasonably less than 10% of all bags from the wholesaler.",
    allMet: true,
    detail: "Random: met because the bags were randomly selected. 10%: met because 10 bags is reasonably less than 10% of all bags from the wholesaler. Shape: met because n is less than 30 but the sample has no strong skewness or outliers.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "skewness", "outlier", "outliers", "no strong skewness", "no outliers"]
    ]
  },
  {
    desc: "Avril asks 6 classmates to put rain gauges in their yards and record April rainfall. A dotplot shows strong skewness and a possible outlier.",
    given: "n = 6, not a random sample, and 6 houses is reasonably less than 10% of all houses in the county.",
    allMet: false,
    detail: "Random: not met because Avril used classmates instead of a random sample. 10%: met because 6 houses is reasonably less than 10% of all houses in the county. Shape: not met because n is less than 30 and the dotplot shows strong skewness and a possible outlier.",
    explanationGroups: [
      ["random", "not random", "classmates", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "skewness", "outlier", "outliers", "possible outlier"]
    ]
  },
  {
    desc: "A school randomly samples 28 students to estimate the mean number of minutes they spend on homework each night. The sample histogram shows no strong skewness or outliers.",
    given: "n = 28, random sample, and 28 students is less than 10% of the school population.",
    allMet: true,
    detail: "Random: met because the students were randomly sampled. 10%: met because 28 is less than 10% of the school population. Shape: met because n is less than 30 but the histogram shows no strong skewness or outliers.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "skewness", "outlier", "outliers", "no strong skewness", "no outliers"]
    ]
  },
  {
    desc: "A factory randomly samples 45 light bulbs and records burn time to estimate the mean lifetime of all bulbs in the batch.",
    given: "n = 45, random sample, and 45 bulbs is less than 10% of the production batch.",
    allMet: true,
    detail: "Random: met because the bulbs were randomly sampled. 10%: met because 45 is less than 10% of the production batch. Shape: met because the sample size is at least 30, so the sampling distribution of x̄ is approximately normal.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "production batch", "population"],
      ["n ≥ 30", "n>=30", "at least 30", "large sample", "sample size"]
    ]
  },
  {
    desc: "A company randomly samples 18 cereal boxes from a batch of 120 boxes to estimate the mean fill weight. A boxplot shows no strong skewness or outliers.",
    given: "n = 18, random sample, batch size N = 120.",
    allMet: false,
    detail: "Random: met because the boxes were randomly sampled. 10%: not met because 18 is greater than 10% of 120, which is 12. Shape: met because n is less than 30 but the boxplot shows no strong skewness or outliers.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "18", "120", "12", "greater than 10%"],
      ["skew", "skewness", "outlier", "outliers", "no strong skewness", "no outliers"]
    ]
  },
  {
    desc: "A teacher surveys the first 22 students who arrive to class to estimate the mean number of hours they studied. The sample appears roughly symmetric with no outliers.",
    given: "n = 22, convenience sample, and 22 students is less than 10% of the school population.",
    allMet: false,
    detail: "Random: not met because the first 22 students to arrive were not randomly selected. 10%: met because 22 is less than 10% of the school population. Shape: met because n is less than 30 but the sample appears roughly symmetric with no outliers.",
    explanationGroups: [
      ["random", "not random", "first 22", "convenience"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["symmetric", "no outliers", "outlier", "skew", "roughly symmetric"]
    ]
  },
  {
    desc: "A veterinarian randomly samples 14 dogs and records weights to estimate the mean weight of dogs at a shelter. A boxplot shows strong right skew.",
    given: "n = 14, random sample, and 14 dogs is less than 10% of the shelter's dog population.",
    allMet: false,
    detail: "Random: met because the dogs were randomly sampled. 10%: met because 14 is less than 10% of the shelter population. Shape: not met because n is less than 30 and the boxplot shows strong right skew.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "skewness", "strong right skew", "shape"]
    ]
  },
  {
    desc: "A city planner randomly samples 30 bus rides and records delays to estimate the mean delay on that route.",
    given: "n = 30, random sample, and 30 rides is less than 10% of all rides on the route.",
    allMet: true,
    detail: "Random: met because the rides were randomly sampled. 10%: met because 30 is less than 10% of all rides on the route. Shape: met because the sample size is 30, which is large enough for the one-sample t-interval.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["30", "n ≥ 30", "n>=30", "large enough", "large sample"]
    ]
  },
  {
    desc: "A nutritionist randomly samples 12 breakfast servings and records calories to estimate the mean calories for the product line. One very large outlier appears in the boxplot.",
    given: "n = 12, random sample, and 12 servings is less than 10% of all servings produced that day.",
    allMet: false,
    detail: "Random: met because the servings were randomly sampled. 10%: met because 12 is less than 10% of all servings produced that day. Shape: not met because n is less than 30 and the boxplot shows an outlier.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["outlier", "outliers", "boxplot", "shape"]
    ]
  },
  {
    desc: "A marine scientist randomly samples 26 fish and records length to estimate the mean length for fish in a lake. The sample dotplot shows no strong skewness or outliers.",
    given: "n = 26, random sample, and 26 fish is less than 10% of the lake population.",
    allMet: true,
    detail: "Random: met because the fish were randomly sampled. 10%: met because 26 is less than 10% of the lake population. Shape: met because n is less than 30 and the dotplot shows no strong skewness or outliers.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "skewness", "outlier", "outliers", "no strong skewness", "no outliers"]
    ]
  }
];

const criticalValueScenarios = [
  {
    desc: "The powdered sugar example uses a sample of 10 bags and a 95% confidence level.",
    n: 10,
    confLevel: 95,
    tStar: 2.262,
    note: "Use df = n - 1 = 9."
  },
  {
    desc: "A confidence interval for a mean is built from a sample of 10 observations with 90% confidence.",
    n: 10,
    confLevel: 90,
    tStar: 1.833,
    note: "Use df = 9."
  },
  {
    desc: "A confidence interval for a mean is built from a sample of 10 observations with 99% confidence.",
    n: 10,
    confLevel: 99,
    tStar: 3.25,
    note: "Use df = 9."
  },
  {
    desc: "A researcher has a random sample of 12 observations and wants a 95% confidence interval for μ.",
    n: 12,
    confLevel: 95,
    tStar: 2.201,
    note: "Use df = 11."
  },
  {
    desc: "A sample of 16 observations is used to build a 90% confidence interval for a population mean.",
    n: 16,
    confLevel: 90,
    tStar: 1.753,
    note: "Use df = 15."
  },
  {
    desc: "A sample of 16 observations is used to build a 95% confidence interval for a population mean.",
    n: 16,
    confLevel: 95,
    tStar: 2.131,
    note: "Use df = 15."
  },
  {
    desc: "A sample of 21 observations is used for a 95% confidence interval for μ.",
    n: 21,
    confLevel: 95,
    tStar: 2.086,
    note: "Use df = 20."
  },
  {
    desc: "A sample of 25 observations is used for a 90% confidence interval for μ.",
    n: 25,
    confLevel: 90,
    tStar: 1.711,
    note: "Use df = 24."
  },
  {
    desc: "The fiddler crab example uses a sample of 40 crabs and a 90% confidence interval.",
    n: 40,
    confLevel: 90,
    tStar: 1.685,
    note: "Use technology with df = 39."
  },
  {
    desc: "A sample of 41 observations is used for a 95% confidence interval for μ.",
    n: 41,
    confLevel: 95,
    tStar: 2.021,
    note: "Use df = 40."
  }
];

const meTemplates = [
  {
    desc: "Powdered sugar bag weights",
    givenPrefix: "Estimate the mean bag weight in grams.",
    units: "grams",
    sMin: 6,
    sMax: 10,
    step: 0.01,
    nChoices: [10, 12, 16],
    confChoices: [95]
  },
  {
    desc: "Fiddler crab feeding rates",
    givenPrefix: "Estimate the mean scoops per 30 seconds.",
    units: "scoops per 30 seconds",
    sMin: 5,
    sMax: 8,
    step: 0.01,
    nChoices: [40],
    confChoices: [90]
  },
  {
    desc: "Student commute times",
    givenPrefix: "Estimate the mean commute time in minutes.",
    units: "minutes",
    sMin: 4,
    sMax: 9,
    step: 0.1,
    nChoices: [16, 21, 25],
    confChoices: [95, 90]
  },
  {
    desc: "Battery life tests",
    givenPrefix: "Estimate the mean battery life in hours.",
    units: "hours",
    sMin: 1.2,
    sMax: 3.8,
    step: 0.01,
    nChoices: [12, 16, 25],
    confChoices: [95]
  },
  {
    desc: "Plant height measurements",
    givenPrefix: "Estimate the mean plant height in centimeters.",
    units: "centimeters",
    sMin: 2.5,
    sMax: 6.5,
    step: 0.1,
    nChoices: [21, 25, 31],
    confChoices: [95]
  },
  {
    desc: "Afternoon clinic waiting times",
    givenPrefix: "Estimate the mean waiting time in minutes.",
    units: "minutes",
    sMin: 3,
    sMax: 7.5,
    step: 0.1,
    nChoices: [10, 16, 21],
    confChoices: [90, 95]
  },
  {
    desc: "Coffee purchase amounts",
    givenPrefix: "Estimate the mean purchase amount in dollars.",
    units: "dollars",
    sMin: 2.5,
    sMax: 7,
    step: 0.01,
    nChoices: [25, 31, 41],
    confChoices: [95]
  },
  {
    desc: "Runner mile times",
    givenPrefix: "Estimate the mean mile time in minutes.",
    units: "minutes",
    sMin: 0.3,
    sMax: 1.2,
    step: 0.01,
    nChoices: [10, 12, 16],
    confChoices: [90, 95]
  }
];

const intervalTemplates = [
  {
    desc: "Powdered sugar bag weights",
    givenPrefix: "Estimate the mean bag weight in grams.",
    units: "grams",
    fixed: {
      xBar: 906.8,
      s: 8.22,
      n: 10,
      confLevel: 95
    }
  },
  {
    desc: "Fiddler crab feeding rates",
    givenPrefix: "Estimate the mean scoops per 30 seconds.",
    units: "scoops per 30 seconds",
    fixed: {
      xBar: 67.65,
      s: 6.61,
      n: 40,
      confLevel: 90
    }
  },
  {
    desc: "Student commute times",
    givenPrefix: "Estimate the mean commute time in minutes.",
    units: "minutes",
    xBarMin: 18,
    xBarMax: 42,
    xBarStep: 0.1,
    sMin: 3.5,
    sMax: 8.5,
    sStep: 0.1,
    nChoices: [16, 21, 25],
    confChoices: [95]
  },
  {
    desc: "Battery life tests",
    givenPrefix: "Estimate the mean battery life in hours.",
    units: "hours",
    xBarMin: 9.5,
    xBarMax: 18.5,
    xBarStep: 0.1,
    sMin: 1.1,
    sMax: 3.6,
    sStep: 0.01,
    nChoices: [12, 16, 25],
    confChoices: [95]
  },
  {
    desc: "Plant height measurements",
    givenPrefix: "Estimate the mean plant height in centimeters.",
    units: "centimeters",
    xBarMin: 24,
    xBarMax: 56,
    xBarStep: 0.1,
    sMin: 2.4,
    sMax: 6.2,
    sStep: 0.1,
    nChoices: [21, 25, 31],
    confChoices: [95]
  },
  {
    desc: "Afternoon clinic waiting times",
    givenPrefix: "Estimate the mean waiting time in minutes.",
    units: "minutes",
    xBarMin: 11,
    xBarMax: 29,
    xBarStep: 0.1,
    sMin: 2.8,
    sMax: 7.2,
    sStep: 0.1,
    nChoices: [10, 16, 21],
    confChoices: [90, 95]
  },
  {
    desc: "Coffee purchase amounts",
    givenPrefix: "Estimate the mean purchase amount in dollars.",
    units: "dollars",
    xBarMin: 7.5,
    xBarMax: 18.5,
    xBarStep: 0.01,
    sMin: 2.2,
    sMax: 6.8,
    sStep: 0.01,
    nChoices: [25, 31, 41],
    confChoices: [95]
  },
  {
    desc: "Runner mile times",
    givenPrefix: "Estimate the mean mile time in minutes.",
    units: "minutes",
    xBarMin: 5.1,
    xBarMax: 8.4,
    xBarStep: 0.01,
    sMin: 0.28,
    sMax: 1.1,
    sStep: 0.01,
    nChoices: [10, 12, 16],
    confChoices: [90, 95]
  }
];

function buildMarginScenario(template) {
  const pair = chooseSupportedPair(template.nChoices, template.confChoices);
  const n = pair.n;
  const confLevel = pair.confLevel;
  const tStar = getTCritical(n, confLevel);
  const s = randStep(template.sMin, template.sMax, template.step);
  const se = s / Math.sqrt(n);
  const me = roundTo(tStar * se, 2);
  return {
    desc: template.desc,
    givenPrefix: template.givenPrefix,
    units: template.units,
    n,
    confLevel,
    tStar,
    s,
    se: roundTo(se, 4),
    me
  };
}

function buildIntervalScenario(template) {
  if (template.fixed) {
    const n = template.fixed.n;
    const confLevel = template.fixed.confLevel;
    const tStar = getTCritical(n, confLevel);
    const me = tStar * template.fixed.s / Math.sqrt(n);
    return {
      desc: template.desc,
      givenPrefix: template.givenPrefix,
      units: template.units,
      xBar: template.fixed.xBar,
      s: template.fixed.s,
      n,
      confLevel,
      tStar,
      me: roundTo(me, 2),
      lower: roundTo(template.fixed.xBar - me, 2),
      upper: roundTo(template.fixed.xBar + me, 2)
    };
  }

  const pair = chooseSupportedPair(template.nChoices, template.confChoices);
  const n = pair.n;
  const confLevel = pair.confLevel;
  const tStar = getTCritical(n, confLevel);
  const xBar = randStep(template.xBarMin, template.xBarMax, template.xBarStep);
  const s = randStep(template.sMin, template.sMax, template.sStep);
  const meRaw = tStar * s / Math.sqrt(n);
  const lower = roundTo(xBar - meRaw, 2);
  const upper = roundTo(xBar + meRaw, 2);
  return {
    desc: template.desc,
    givenPrefix: template.givenPrefix,
    units: template.units,
    xBar,
    s,
    n,
    confLevel,
    tStar,
    me: roundTo(meRaw, 2),
    lower,
    upper
  };
}

// ============ MAIN GENERATOR FUNCTION ============

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  if (modeId === "l01-identify-procedure") {
    const scen = drawFromBag("u72-procedure", procedureScenarios);
    const options = shuffle([PROCEDURE_CORRECT, ...PROCEDURE_WRONG]);

    answers = {
      procedureAnswer: { value: PROCEDURE_CORRECT }
    };

    context = attachAnswers(
      {
        levelName: "7.2a: Identify the Procedure",
        problemText: "Choose the correct inference procedure.",
        givenText: scen.desc,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3]
      },
      answers
    );

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l02-check-conditions") {
    const scen = drawFromBag("u72-conditions", conditionScenarios);

    answers = {
      conditionsMet: {
        value: scen.allMet ? "Yes, all conditions are met" : "No, at least one condition fails"
      },
      conditionsExplain: {
        value: scen.detail
      }
    };

    context = attachAnswers(
      {
        levelName: "7.2b: Check Conditions",
        problemText: "Decide whether the conditions for a one-sample t-interval are met.",
        givenText: `${scen.given} ${scen.desc}`,
        explanationGroups: scen.explanationGroups,
        conditionDetail: scen.detail
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.given}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l03-critical-value") {
    const scen = drawFromBag("u72-tstar", criticalValueScenarios);

    answers = {
      tStarAnswer: { value: scen.tStar, tolerance: 0.015 }
    };

    context = attachAnswers(
      {
        levelName: "7.2c: Find t*",
        problemText: "Find the t critical value for the confidence interval.",
        givenText: `n = ${scen.n}, df = ${scen.n - 1}, confidence level = ${scen.confLevel}%. ${scen.note}`,
        confLevel: `${scen.confLevel}`,
        df: `${scen.n - 1}`
      },
      answers
    );

    scenario = `${scen.desc}\n\nFind t* for a ${scen.confLevel}% confidence interval with df = ${scen.n - 1}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l04-margin-of-error") {
    const template = drawFromBag("u72-me", meTemplates);
    const scen = buildMarginScenario(template);

    answers = {
      meAnswer: { value: scen.me, tolerance: 0.03 }
    };

    context = attachAnswers(
      {
        levelName: "7.2d: Margin of Error",
        problemText: "Compute t* × s / √n.",
        givenText: `${scen.givenPrefix} n = ${scen.n}, s = ${scen.s}, confidence level = ${scen.confLevel}%, t* = ${scen.tStar}.`,
        confLevel: `${scen.confLevel}`,
        n: `${scen.n}`,
        s: `${scen.s}`,
        tStar: `${scen.tStar}`,
        se: `${scen.se}`,
        units: scen.units
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.givenPrefix} n = ${scen.n}, s = ${scen.s}, and t* = ${scen.tStar}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l05-construct-interval") {
    const template = drawFromBag("u72-ci", intervalTemplates);
    const scen = buildIntervalScenario(template);

    answers = {
      ciLower: { value: scen.lower, tolerance: 0.03 },
      ciUpper: { value: scen.upper, tolerance: 0.03 }
    };

    context = attachAnswers(
      {
        levelName: "7.2e: Construct the Interval",
        problemText: "Build x̄ ± t* × s / √n.",
        givenText: `${scen.givenPrefix} x̄ = ${scen.xBar}, s = ${scen.s}, n = ${scen.n}, confidence level = ${scen.confLevel}%, t* = ${scen.tStar}.`,
        confLevel: `${scen.confLevel}`,
        xBar: `${scen.xBar}`,
        s: `${scen.s}`,
        n: `${scen.n}`,
        tStar: `${scen.tStar}`,
        me: `${scen.me}`,
        units: scen.units
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.givenPrefix} x̄ = ${scen.xBar}, s = ${scen.s}, n = ${scen.n}, and t* = ${scen.tStar}.`;
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
