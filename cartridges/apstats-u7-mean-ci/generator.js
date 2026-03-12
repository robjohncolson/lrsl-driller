// generator.js - AP Statistics Unit 7 Topics 7.1, 7.2, and 7.3

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

function toFixedString(value, digits) {
  return Number(value).toFixed(digits);
}

const shuffleBags = {};

function getShuffleBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName];
}

function drawFromBag(bankName, sourceArray) {
  return getShuffleBag(bankName, sourceArray).pop();
}

function attachAnswers(context, answers) {
  return { ...context, answers };
}

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
  "41-95": 2.021
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

const procedureScenarios = [
  {
    desc: "A bakery owner records the weights of 10 randomly selected bags of powdered sugar to estimate the mean fill weight mu of all bags from a new wholesaler."
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
    desc: "A clinic randomly samples 12 patients and records waiting times to estimate the mean waiting time for all patients during afternoon appointments."
  }
];

const conditionScenarios = [
  {
    desc: "A bakery owner randomly selects 10 bags of powdered sugar from a wholesaler. A boxplot of the weights shows no strong skewness or outliers.",
    given: "n = 10, random sample, and 10 bags is reasonably less than 10% of all bags from the wholesaler.",
    allMet: true,
    detail: "Random: met because the bags were randomly selected. 10%: met because 10 is less than 10% of the population. Shape: met because n is less than 30 and there is no strong skewness or outlier.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "outlier", "no strong skewness", "no outliers"]
    ]
  },
  {
    desc: "A school randomly samples 28 students to estimate the mean number of minutes they spend on homework each night. The sample histogram shows no strong skewness or outliers.",
    given: "n = 28, random sample, and 28 students is less than 10% of the school population.",
    allMet: true,
    detail: "Random: met. 10%: met. Shape: met because n is less than 30 but the sample has no strong skewness or outliers.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "outlier", "no strong skewness", "no outliers"]
    ]
  },
  {
    desc: "A company randomly samples 18 cereal boxes from a batch of 120 boxes to estimate the mean fill weight. A boxplot shows no strong skewness or outliers.",
    given: "n = 18, random sample, batch size N = 120.",
    allMet: false,
    detail: "Random: met. 10%: not met because 18 is greater than 12. Shape: met because there is no strong skewness or outlier.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "120", "12", "greater than 10%"],
      ["skew", "outlier", "no strong skewness", "no outliers"]
    ]
  },
  {
    desc: "A teacher surveys the first 22 students who arrive to class to estimate the mean number of hours they studied. The sample appears roughly symmetric with no outliers.",
    given: "n = 22, convenience sample, and 22 students is less than 10% of the school population.",
    allMet: false,
    detail: "Random: not met because this is a convenience sample. 10%: met. Shape: met because the sample appears roughly symmetric with no outliers.",
    explanationGroups: [
      ["random", "not random", "convenience", "first 22"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["symmetric", "outlier", "no outliers", "skew"]
    ]
  },
  {
    desc: "A veterinarian randomly samples 14 dogs and records weights to estimate the mean weight of dogs at a shelter. A boxplot shows strong right skew.",
    given: "n = 14, random sample, and 14 dogs is less than 10% of the shelter population.",
    allMet: false,
    detail: "Random: met. 10%: met. Shape: not met because n is less than 30 and the sample shows strong right skew.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "strong right skew", "shape"]
    ]
  },
  {
    desc: "A city planner randomly samples 30 bus rides and records delays to estimate the mean delay on that route.",
    given: "n = 30, random sample, and 30 rides is less than 10% of all rides on the route.",
    allMet: true,
    detail: "Random: met. 10%: met. Shape: met because n is at least 30.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["30", "n >= 30", "large sample", "at least 30"]
    ]
  }
];

const criticalValueScenarios = [
  { desc: "The powdered sugar example uses a sample of 10 bags and a 95% confidence level.", n: 10, confLevel: 95, tStar: 2.262, note: "Use df = 9." },
  { desc: "A confidence interval for a mean is built from a sample of 10 observations with 90% confidence.", n: 10, confLevel: 90, tStar: 1.833, note: "Use df = 9." },
  { desc: "A researcher has a random sample of 12 observations and wants a 95% confidence interval for mu.", n: 12, confLevel: 95, tStar: 2.201, note: "Use df = 11." },
  { desc: "A sample of 16 observations is used to build a 95% confidence interval for a population mean.", n: 16, confLevel: 95, tStar: 2.131, note: "Use df = 15." },
  { desc: "A sample of 21 observations is used for a 95% confidence interval for mu.", n: 21, confLevel: 95, tStar: 2.086, note: "Use df = 20." },
  { desc: "The fiddler crab example uses a sample of 40 crabs and a 90% confidence interval.", n: 40, confLevel: 90, tStar: 1.685, note: "Use df = 39." }
];

const meTemplates = [
  { desc: "Powdered sugar bag weights", givenPrefix: "Estimate the mean bag weight in grams.", units: "grams", sMin: 6, sMax: 10, step: 0.01, nChoices: [10, 12, 16], confChoices: [95] },
  { desc: "Fiddler crab feeding rates", givenPrefix: "Estimate the mean scoops per 30 seconds.", units: "scoops per 30 seconds", sMin: 5, sMax: 8, step: 0.01, nChoices: [40], confChoices: [90] },
  { desc: "Student commute times", givenPrefix: "Estimate the mean commute time in minutes.", units: "minutes", sMin: 4, sMax: 9, step: 0.1, nChoices: [16, 21, 25], confChoices: [95, 90] },
  { desc: "Battery life tests", givenPrefix: "Estimate the mean battery life in hours.", units: "hours", sMin: 1.2, sMax: 3.8, step: 0.01, nChoices: [12, 16, 25], confChoices: [95] },
  { desc: "Coffee purchase amounts", givenPrefix: "Estimate the mean purchase amount in dollars.", units: "dollars", sMin: 2.5, sMax: 7, step: 0.01, nChoices: [25, 31, 41], confChoices: [95] }
];

const intervalTemplates = [
  { desc: "Powdered sugar bag weights", givenPrefix: "Estimate the mean bag weight in grams.", units: "grams", fixed: { xBar: 906.8, s: 8.22, n: 10, confLevel: 95 } },
  { desc: "Fiddler crab feeding rates", givenPrefix: "Estimate the mean scoops per 30 seconds.", units: "scoops per 30 seconds", fixed: { xBar: 67.65, s: 6.61, n: 40, confLevel: 90 } },
  { desc: "Student commute times", givenPrefix: "Estimate the mean commute time in minutes.", units: "minutes", xBarMin: 18, xBarMax: 42, xBarStep: 0.1, sMin: 3.5, sMax: 8.5, sStep: 0.1, nChoices: [16, 21, 25], confChoices: [95] },
  { desc: "Battery life tests", givenPrefix: "Estimate the mean battery life in hours.", units: "hours", xBarMin: 9.5, xBarMax: 18.5, xBarStep: 0.1, sMin: 1.1, sMax: 3.6, sStep: 0.01, nChoices: [12, 16, 25], confChoices: [95] },
  { desc: "Coffee purchase amounts", givenPrefix: "Estimate the mean purchase amount in dollars.", units: "dollars", xBarMin: 7.5, xBarMax: 18.5, xBarStep: 0.01, sMin: 2.2, sMax: 6.8, sStep: 0.01, nChoices: [25, 31, 41], confChoices: [95] }
];

const meanDifferenceStudyScenarios = [
  {
    desc: "Volunteer college students were randomly assigned to hear the same $50 described as bonus income or a tuition rebate before reporting how much they spent after one week.",
    group1: "bonus wording",
    group2: "rebate wording",
    mean1: 22.04,
    mean2: 9.55,
    claim: "the bonus wording causes college students like these to spend more money on average than the rebate wording"
  },
  {
    desc: "Shoppers were randomly assigned to see the same $20 store credit described as reward cash or refund credit before deciding how much to spend.",
    group1: "reward-cash wording",
    group2: "refund-credit wording",
    mean1: 31.8,
    mean2: 24.65,
    claim: "the reward-cash wording causes shoppers like these to spend more on average than the refund-credit wording"
  },
  {
    desc: "Students were randomly assigned to hear a study payment described as extra cash or reimbursement before reporting how much of it they spent.",
    group1: "extra-cash wording",
    group2: "reimbursement wording",
    mean1: 18.7,
    mean2: 13.1,
    claim: "the extra-cash wording causes students like these to spend more on average than the reimbursement wording"
  },
  {
    desc: "Participants were randomly assigned to receive the same gift card described as a thank-you bonus or a billing refund before shopping.",
    group1: "thank-you-bonus wording",
    group2: "billing-refund wording",
    mean1: 27.45,
    mean2: 20.05,
    claim: "the thank-you-bonus wording causes participants like these to spend more on average than the billing-refund wording"
  },
  {
    desc: "Customers were randomly assigned to hear a coupon described as bonus savings or price adjustment before making a purchase.",
    group1: "bonus-savings wording",
    group2: "price-adjustment wording",
    mean1: 14.9,
    mean2: 11.35,
    claim: "the bonus-savings wording causes customers like these to spend more on average than the price-adjustment wording"
  }
];

const simulationScenarios = [
  { desc: "In the bonus-versus-rebate study, the observed difference in sample means was 12.49 dollars.", observedDiff: 12.49, tailCount: 13, trials: 1000, claim: "the bonus wording causes college students like these to spend more money on average than the rebate wording" },
  { desc: "In a reward-cash versus refund-credit study, the observed difference in sample means was 7.15 dollars.", observedDiff: 7.15, tailCount: 32, trials: 2000, claim: "the reward-cash wording causes shoppers like these to spend more on average than the refund-credit wording" },
  { desc: "In an extra-cash versus reimbursement study, the observed difference in sample means was 5.60 dollars.", observedDiff: 5.6, tailCount: 44, trials: 1000, claim: "the extra-cash wording causes students like these to spend more on average than the reimbursement wording" },
  { desc: "In a thank-you-bonus versus billing-refund study, the observed difference in sample means was 7.40 dollars.", observedDiff: 7.4, tailCount: 68, trials: 2000, claim: "the thank-you-bonus wording causes participants like these to spend more on average than the billing-refund wording" },
  { desc: "In a bonus-savings versus price-adjustment study, the observed difference in sample means was 3.55 dollars.", observedDiff: 3.55, tailCount: 81, trials: 1000, claim: "the bonus-savings wording causes customers like these to spend more on average than the price-adjustment wording" },
  { desc: "In a bonus-label versus refund-label study, the observed difference in sample means was 4.20 dollars.", observedDiff: 4.2, tailCount: 164, trials: 1000, claim: "the bonus label causes people like these to spend more on average than the refund label" }
];

const intervalInterpretationScenarios = [
  {
    desc: "A bakery owner calculated a 95% confidence interval for the mean weight of all bags filled by a new wholesaler.",
    confLevel: 95,
    lowerText: "900.92",
    upperText: "912.68",
    units: "grams",
    parameter: "mean weight of all bags filled by this wholesaler",
    individuals: "bags filled by this wholesaler"
  },
  {
    desc: "Wildlife biologists built a 90% confidence interval for the mean feeding rate of all fiddler crabs of this species.",
    confLevel: 90,
    lowerText: "65.89",
    upperText: "69.41",
    units: "scoops per 30 seconds",
    parameter: "mean feeding rate of all fiddler crabs of this species",
    individuals: "fiddler crabs of this species"
  },
  {
    desc: "An environmental group built a 95% confidence interval for the mean lead level of all crows in a region.",
    confLevel: 95,
    lowerText: "4.416",
    upperText: "5.384",
    units: "parts per million",
    parameter: "mean lead level of all crows in the region",
    individuals: "crows in the region"
  }
];

const claimJustificationScenarios = [
  {
    desc: "A bakery owner wants to know if powdered sugar bags from a new wholesaler are underfilled on average.",
    givenText: "A 95% confidence interval for the mean weight of all bags filled by the wholesaler is 900.92 to 912.68 grams. The manufacturer claims the bags average 907 grams, and the bakery owner is worried the true mean is less than 907 grams.",
    relation: "inside",
    claimSupport: "no",
    benchmarkText: "907",
    units: "grams",
    claim: "the bags are underfilled on average",
    correct: "No. Because 907 grams is inside the interval, 907 grams is a plausible value for the population mean."
  },
  {
    desc: "Biologists want to know whether this fiddler crab species feeds faster than 2 scoops per second on average.",
    givenText: "A 90% confidence interval for the mean feeding rate is 65.89 to 69.41 scoops per 30 seconds. Since 2 scoops per second is 60 scoops per 30 seconds, compare the interval to 60 scoops per 30 seconds.",
    relation: "above",
    claimSupport: "yes",
    benchmarkText: "60",
    units: "scoops per 30 seconds",
    claim: "the mean feeding rate is greater than 60 scoops per 30 seconds",
    correct: "Yes. Because every value in the interval is greater than 60 scoops per 30 seconds, the data provide convincing evidence that the mean feeding rate is greater than 60 scoops per 30 seconds."
  },
  {
    desc: "A biologist classified lead levels above 6.0 parts per million as unhealthy and wants to judge the regional mean.",
    givenText: "A 95% confidence interval for the mean lead level of crows in the region is 4.416 to 5.384 parts per million. The question is whether there is convincing evidence that the population mean lead level is less than 6.0 parts per million.",
    relation: "below",
    claimSupport: "yes",
    benchmarkText: "6.0",
    units: "parts per million",
    claim: "the population mean lead level is less than 6.0 parts per million",
    correct: "Yes. Because every value in the interval is less than 6.0 parts per million, the data provide convincing evidence that the population mean lead level is less than 6.0 parts per million."
  }
];

const confidenceLevelScenarios = [
  {
    desc: "Human body temperatures are approximately normally distributed with mean 98.6 degrees Fahrenheit and standard deviation 0.8 degrees Fahrenheit.",
    sampleText: "many random samples of 10 people from the population of all humans",
    parameter: "mean human body temperature of all people",
    individuals: "people",
    confLevel: 95,
    n: 10
  },
  {
    desc: "An environmental group takes a random sample of 23 crows from a region and builds a confidence interval for the regional mean lead level.",
    sampleText: "many random samples of 23 crows from the region",
    parameter: "mean lead level of all crows in the region",
    individuals: "crows in the region",
    confLevel: 95,
    n: 23
  },
  {
    desc: "Wildlife biologists study a random sample of 40 fiddler crabs and build a confidence interval for the species mean feeding rate.",
    sampleText: "many random samples of 40 fiddler crabs of this species",
    parameter: "mean feeding rate of all fiddler crabs of this species",
    individuals: "fiddler crabs of this species",
    confLevel: 90,
    n: 40
  },
  {
    desc: "A bakery owner samples 10 powdered sugar bags and builds a confidence interval for the wholesaler's mean fill weight.",
    sampleText: "many random samples of 10 bags from this wholesaler",
    parameter: "mean weight of all bags filled by this wholesaler",
    individuals: "bags filled by this wholesaler",
    confLevel: 95,
    n: 10
  }
];

const sampleSizeEffectScenarios = [
  {
    desc: "A researcher keeps the confidence level and sample standard deviation the same but increases the sample size for a mean interval.",
    givenText: "The sample size increases from n = 10 to n = 40 while the confidence level and sample standard deviation stay the same.",
    nFrom: 10,
    nTo: 40
  },
  {
    desc: "A biologist wants a more precise confidence interval for a population mean and increases the sample size.",
    givenText: "The sample size increases from n = 16 to n = 64 while the confidence level and sample standard deviation stay the same.",
    nFrom: 16,
    nTo: 64
  },
  {
    desc: "An environmental study uses a larger sample to reduce uncertainty in a confidence interval for a mean.",
    givenText: "The sample size increases from n = 25 to n = 100 while the confidence level and sample standard deviation stay the same.",
    nFrom: 25,
    nTo: 100
  }
];

const confidenceLevelEffectScenarios = [
  {
    desc: "A researcher lowers the confidence level while keeping the same sample data for a confidence interval for a mean.",
    givenText: "The confidence level decreases from 95% to 90% while n and s stay the same.",
    confFrom: 95,
    confTo: 90
  },
  {
    desc: "A confidence interval for a mean is rebuilt with a smaller confidence level.",
    givenText: "The confidence level decreases from 99% to 95% while n and s stay the same.",
    confFrom: 99,
    confTo: 95
  },
  {
    desc: "An analyst wants a narrower interval and is willing to use less confidence.",
    givenText: "The confidence level decreases from 90% to 80% while n and s stay the same.",
    confFrom: 90,
    confTo: 80
  }
];

function buildMarginScenario(template) {
  const pair = chooseSupportedPair(template.nChoices, template.confChoices);
  const n = pair.n;
  const confLevel = pair.confLevel;
  const tStar = getTCritical(n, confLevel);
  const s = randStep(template.sMin, template.sMax, template.step);
  const se = s / Math.sqrt(n);
  return {
    ...template,
    n,
    confLevel,
    tStar,
    s,
    se: roundTo(se, 4),
    me: roundTo(tStar * se, 2)
  };
}

function buildIntervalScenario(template) {
  if (template.fixed) {
    const n = template.fixed.n;
    const confLevel = template.fixed.confLevel;
    const tStar = getTCritical(n, confLevel);
    const meRaw = tStar * template.fixed.s / Math.sqrt(n);
    return {
      ...template,
      xBar: template.fixed.xBar,
      s: template.fixed.s,
      n,
      confLevel,
      tStar,
      me: roundTo(meRaw, 2),
      lower: roundTo(template.fixed.xBar - meRaw, 2),
      upper: roundTo(template.fixed.xBar + meRaw, 2)
    };
  }

  const pair = chooseSupportedPair(template.nChoices, template.confChoices);
  const n = pair.n;
  const confLevel = pair.confLevel;
  const tStar = getTCritical(n, confLevel);
  const xBar = randStep(template.xBarMin, template.xBarMax, template.xBarStep);
  const s = randStep(template.sMin, template.sMax, template.sStep);
  const meRaw = tStar * s / Math.sqrt(n);
  return {
    ...template,
    xBar,
    s,
    n,
    confLevel,
    tStar,
    me: roundTo(meRaw, 2),
    lower: roundTo(xBar - meRaw, 2),
    upper: roundTo(xBar + meRaw, 2)
  };
}

function buildDifferenceStudyScenario(template) {
  const diff = roundTo(template.mean1 - template.mean2, 2);
  return {
    ...template,
    diff,
    diffText: toFixedString(diff, 2),
    negDiffText: toFixedString(-diff, 2),
    mean1Text: toFixedString(template.mean1, 2),
    mean2Text: toFixedString(template.mean2, 2),
    comparisonLabel: `x-bar ${template.group1} - x-bar ${template.group2}`
  };
}

function getDifferenceStudyText(scen) {
  return `${scen.desc} Mean amount spent was ${scen.mean1Text} dollars for ${scen.group1} and ${scen.mean2Text} dollars for ${scen.group2}, so ${scen.comparisonLabel} = ${scen.diffText}.`;
}

function buildSimulationScenario(template) {
  const prob = roundTo(template.tailCount / template.trials, 3);
  return {
    ...template,
    observedDiffText: toFixedString(template.observedDiff, 2),
    prob,
    probText: toFixedString(prob, 3),
    convincingEvidence: prob <= 0.05
  };
}

function buildConclusionOptions(scen) {
  if (scen.convincingEvidence) {
    const correct = `Yes. The probability is small, so the data provide convincing evidence that ${scen.claim}.`;
    return {
      correct,
      options: shuffle([
        correct,
        "No. The probability is small, so chance variation is still the best explanation.",
        `Yes. The simulation proves with certainty that ${scen.claim}.`,
        "No. Random assignment means the groups cannot be compared."
      ])
    };
  }

  const correct = "No. The probability is not very small, so chance variation is still a plausible explanation.";
  return {
    correct,
    options: shuffle([
      correct,
      `Yes. Any positive observed difference gives convincing evidence that ${scen.claim}.`,
      `Yes. The simulation proves with certainty that ${scen.claim}.`,
      "No. Random assignment means the groups cannot be compared."
    ])
  };
}

function buildIntervalInterpretationOptions(scen) {
  const correct = `We are ${scen.confLevel}% confident that the interval from ${scen.lowerText} to ${scen.upperText} ${scen.units} captures the ${scen.parameter}.`;
  return {
    correct,
    options: shuffle([
      correct,
      `There is a ${scen.confLevel}% probability that the ${scen.parameter} is between ${scen.lowerText} and ${scen.upperText} ${scen.units}.`,
      `${scen.confLevel}% of ${scen.individuals} have values between ${scen.lowerText} and ${scen.upperText} ${scen.units}.`,
      `The sample mean has a ${scen.confLevel}% chance of falling between ${scen.lowerText} and ${scen.upperText} ${scen.units}.`
    ])
  };
}

function buildClaimJustifyOptions(scen) {
  return {
    correct: scen.correct,
    options: shuffle([
      scen.correct,
      `Yes. The confidence interval proves with certainty that ${scen.claim}.`,
      "No. A confidence interval cannot be used to judge a claim about a population mean.",
      `Yes. Because the sample mean is not exactly ${scen.benchmarkText} ${scen.units}, that alone gives convincing evidence for the claim.`
    ])
  };
}

function buildConfidenceLevelOptions(scen) {
  const correct = `If we took ${scen.sampleText} and built a ${scen.confLevel}% confidence interval for the ${scen.parameter} from each sample, then about ${scen.confLevel}% of those intervals would capture the population mean.`;
  return {
    correct,
    options: shuffle([
      correct,
      `There is a ${scen.confLevel}% probability that this one interval captures the ${scen.parameter}.`,
      `About ${scen.confLevel}% of the individual ${scen.individuals} have values inside the interval.`,
      `About ${scen.confLevel}% of the sample means from those samples will equal the ${scen.parameter}.`
    ])
  };
}

function buildSampleSizeEffectOptions() {
  const correct = "The margin of error is cut about in half.";
  return {
    correct,
    options: shuffle([
      correct,
      "The margin of error doubles.",
      "The margin of error is cut to one-fourth of its original size.",
      "The margin of error stays the same."
    ])
  };
}

function buildConfidenceLevelEffectOptions() {
  const correct = "The margin of error gets smaller because the critical value gets smaller.";
  return {
    correct,
    options: shuffle([
      correct,
      "The margin of error gets larger because the critical value gets larger.",
      "The margin of error stays the same because the sample size did not change.",
      "The margin of error becomes 0 because the interval is more precise."
    ])
  };
}

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  if (modeId === "l01-identify-procedure") {
    const scen = drawFromBag("u72-procedure", procedureScenarios);
    const options = shuffle([PROCEDURE_CORRECT, ...PROCEDURE_WRONG]);

    answers = { procedureAnswer: { value: PROCEDURE_CORRECT } };
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
      conditionsMet: { value: scen.allMet ? "Yes, all conditions are met" : "No, at least one condition fails" },
      conditionsExplain: { value: scen.detail }
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

    answers = { tStarAnswer: { value: scen.tStar, tolerance: 0.015 } };
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

    answers = { meAnswer: { value: scen.me, tolerance: 0.03 } };
    context = attachAnswers(
      {
        levelName: "7.2d: Margin of Error",
        problemText: "Compute t* x s / sqrt(n).",
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
        problemText: "Build x-bar +/- t* x s / sqrt(n).",
        givenText: `${scen.givenPrefix} x-bar = ${scen.xBar}, s = ${scen.s}, n = ${scen.n}, confidence level = ${scen.confLevel}%, t* = ${scen.tStar}.`,
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

    scenario = `${scen.desc}\n\n${scen.givenPrefix} x-bar = ${scen.xBar}, s = ${scen.s}, n = ${scen.n}, and t* = ${scen.tStar}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l06-identify-evidence") {
    const template = drawFromBag("u71-evidence", meanDifferenceStudyScenarios);
    const scen = buildDifferenceStudyScenario(template);
    const correct = `Observed difference in sample means = ${scen.diffText}`;
    const options = shuffle([
      correct,
      "Expected difference if there is no treatment effect = 0",
      `${scen.group1} sample mean = ${scen.mean1Text}`,
      `${scen.group2} sample mean = ${scen.mean2Text}`
    ]);

    answers = { evidenceAnswer: { value: correct } };
    context = attachAnswers(
      {
        levelName: "7.1a: Identify the Evidence",
        problemText: "Identify the observed evidence for the claim.",
        givenText: getDifferenceStudyText(scen),
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        observedDiff: scen.diffText
      },
      answers
    );

    scenario = `${scen.desc}\n\nObserved difference in sample means = ${scen.diffText}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l07-null-expectation") {
    const template = drawFromBag("u71-null", meanDifferenceStudyScenarios);
    const scen = buildDifferenceStudyScenario(template);
    const options = shuffle(["0", scen.diffText, scen.negDiffText, scen.mean1Text]);

    answers = { nullDiffAnswer: { value: "0", tolerance: 0.01 } };
    context = attachAnswers(
      {
        levelName: "7.1b: Expected Difference Under No Effect",
        problemText: "State the expected difference if there is no treatment effect.",
        givenText: getDifferenceStudyText(scen),
        comparisonLabel: scen.comparisonLabel,
        observedDiff: scen.diffText,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3]
      },
      answers
    );

    scenario = `${scen.desc}\n\nIf there is no treatment effect, ${scen.comparisonLabel} should be centered at 0.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l08-chance-explanation") {
    const template = drawFromBag("u71-chance", meanDifferenceStudyScenarios);
    const scen = buildDifferenceStudyScenario(template);
    const correct = "No real treatment effect; the observed difference happened because of chance variation in the random assignment.";
    const options = shuffle([
      correct,
      `The observed difference is best explained by a real treatment effect: ${scen.claim}.`,
      `The expected difference under no effect is ${scen.diffText}.`,
      "A simulation can never help decide whether chance is a plausible explanation."
    ]);

    answers = { chanceExplainAnswer: { value: correct } };
    context = attachAnswers(
      {
        levelName: "7.1c: Chance Variation Explanation",
        problemText: "Identify the explanation based on chance variation alone.",
        givenText: getDifferenceStudyText(scen),
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3]
      },
      answers
    );

    scenario = `${scen.desc}\n\nChance-only explanation: no real treatment effect, just random assignment variation.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l09-simulation-probability") {
    const template = drawFromBag("u71-simprob", simulationScenarios);
    const scen = buildSimulationScenario(template);

    answers = { simProbAnswer: { value: scen.prob, tolerance: 0.002 } };
    context = attachAnswers(
      {
        levelName: "7.1d: Estimate the Simulation Probability",
        problemText: "Use tail count divided by total simulations.",
        givenText: `${scen.desc} Under the no-effect model, ${scen.tailCount} of ${scen.trials} simulated differences were at least ${scen.observedDiffText}.`,
        tailCount: `${scen.tailCount}`,
        trials: `${scen.trials}`,
        observedDiff: scen.observedDiffText,
        prob: scen.probText
      },
      answers
    );

    scenario = `${scen.desc}\n\nEstimated simulation probability = ${scen.tailCount}/${scen.trials} = ${scen.probText}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l10-draw-conclusion") {
    const template = drawFromBag("u71-conclusion", simulationScenarios);
    const scen = buildSimulationScenario(template);
    const conclusion = buildConclusionOptions(scen);

    answers = { conclusionAnswer: { value: conclusion.correct } };
    context = attachAnswers(
      {
        levelName: "7.1e: Draw the Conclusion",
        problemText: "Decide whether the simulation gives convincing evidence.",
        givenText: `${scen.desc} Under the no-effect model, ${scen.tailCount} of ${scen.trials} simulated differences were at least ${scen.observedDiffText}, so the estimated probability is ${scen.probText}.`,
        optA: conclusion.options[0],
        optB: conclusion.options[1],
        optC: conclusion.options[2],
        optD: conclusion.options[3],
        convincingEvidence: scen.convincingEvidence ? "yes" : "no",
        claim: scen.claim,
        prob: scen.probText
      },
      answers
    );

    scenario = `${scen.desc}\n\nEstimated probability = ${scen.probText}. Decide whether that is convincing evidence.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l11-interpret-interval") {
    const scen = drawFromBag("u73-interpret-interval", intervalInterpretationScenarios);
    const interpretation = buildIntervalInterpretationOptions(scen);

    answers = { intervalInterpretAnswer: { value: interpretation.correct } };
    context = attachAnswers(
      {
        levelName: "7.3a: Interpret the Confidence Interval",
        problemText: "Choose the correct interpretation in context.",
        givenText: `${scen.desc} The interval is ${scen.lowerText} to ${scen.upperText} ${scen.units}.`,
        optA: interpretation.options[0],
        optB: interpretation.options[1],
        optC: interpretation.options[2],
        optD: interpretation.options[3],
        confLevel: `${scen.confLevel}`,
        lower: scen.lowerText,
        upper: scen.upperText,
        units: scen.units,
        parameter: scen.parameter
      },
      answers
    );

    scenario = `${scen.desc}\n\nInterpret the interval from ${scen.lowerText} to ${scen.upperText} ${scen.units}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l12-justify-claim") {
    const scen = drawFromBag("u73-justify-claim", claimJustificationScenarios);
    const conclusion = buildClaimJustifyOptions(scen);

    answers = { claimJustifyAnswer: { value: conclusion.correct } };
    context = attachAnswers(
      {
        levelName: "7.3b: Justify a Claim with the Interval",
        problemText: "Use the interval to decide whether the claim is supported.",
        givenText: scen.givenText,
        optA: conclusion.options[0],
        optB: conclusion.options[1],
        optC: conclusion.options[2],
        optD: conclusion.options[3],
        claimSupport: scen.claimSupport,
        relation: scen.relation,
        benchmark: scen.benchmarkText,
        units: scen.units,
        claim: scen.claim
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.givenText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l13-interpret-confidence-level") {
    const scen = drawFromBag("u73-confidence-level", confidenceLevelScenarios);
    const interpretation = buildConfidenceLevelOptions(scen);

    answers = { confidenceLevelAnswer: { value: interpretation.correct } };
    context = attachAnswers(
      {
        levelName: "7.3c: Interpret the Confidence Level",
        problemText: "Interpret the confidence level using repeated random sampling.",
        givenText: `${scen.desc} A ${scen.confLevel}% confidence interval is built for the ${scen.parameter}.`,
        optA: interpretation.options[0],
        optB: interpretation.options[1],
        optC: interpretation.options[2],
        optD: interpretation.options[3],
        confLevel: `${scen.confLevel}`,
        n: `${scen.n}`,
        parameter: scen.parameter
      },
      answers
    );

    scenario = `${scen.desc}\n\nInterpret what ${scen.confLevel}% confidence means.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l14-sample-size-margin-error") {
    const scen = drawFromBag("u73-sample-size", sampleSizeEffectScenarios);
    const effect = buildSampleSizeEffectOptions();

    answers = { sampleSizeEffectAnswer: { value: effect.correct } };
    context = attachAnswers(
      {
        levelName: "7.3d: Sample Size and Margin of Error",
        problemText: "Reason about how changing n affects margin of error.",
        givenText: scen.givenText,
        optA: effect.options[0],
        optB: effect.options[1],
        optC: effect.options[2],
        optD: effect.options[3],
        nFrom: `${scen.nFrom}`,
        nTo: `${scen.nTo}`
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.givenText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l15-confidence-level-margin-error") {
    const scen = drawFromBag("u73-conf-me", confidenceLevelEffectScenarios);
    const effect = buildConfidenceLevelEffectOptions();

    answers = { confidenceLevelEffectAnswer: { value: effect.correct } };
    context = attachAnswers(
      {
        levelName: "7.3e: Confidence Level and Margin of Error",
        problemText: "Reason about how changing the confidence level affects margin of error.",
        givenText: scen.givenText,
        optA: effect.options[0],
        optB: effect.options[1],
        optC: effect.options[2],
        optD: effect.options[3],
        confFrom: `${scen.confFrom}`,
        confTo: `${scen.confTo}`
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.givenText}`;
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
