// generator.js - AP Statistics Unit 7 Topics 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, and 7.8

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
const TEST_PROCEDURE_CORRECT = "One-sample t-test for a population mean";
const TEST_PROCEDURE_WRONG = [
  "One-sample t-interval for a population mean",
  "One-sample z-test for a population proportion",
  "Two-sample t-test for a difference in population means"
];
const TWO_SAMPLE_CI_PROCEDURE_CORRECT = "Two-sample t-interval for the difference in population means";
const TWO_SAMPLE_CI_PROCEDURE_WRONG = [
  "One-sample t-interval for a population mean",
  "Two-sample t-test for a difference in population means",
  "One-sample z-interval for a population proportion"
];
const H0 = "H\u2080";
const HA = "H\u2090";
const MU = "\u03bc";
const NEQ = "\u2260";

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

const twoSampleCIProcedureScenarios = [
  {
    desc: "Researchers collected a random sample of 14 adult female Argiope spiders and a random sample of 14 adult male Argiope spiders. They want a 95% confidence interval for the difference in the population mean body lengths (female minus male)."
  },
  {
    desc: "Researchers collected a random sample of 35 adult female Argiope spiders and a random sample of 35 adult male Argiope spiders. They want to estimate the difference in population mean body lengths with a 95% confidence interval."
  },
  {
    desc: "A teacher randomly assigned 18 students to work with a slow internet connection and 18 students to work with a fast internet connection. She wants a confidence interval for the difference in mean diastolic blood pressure after the task."
  },
  {
    desc: "A follow-up study randomly assigned students like these to slow or fast internet conditions and recorded quantitative stress responses. The goal is to estimate the difference in the two population means with an interval."
  }
];

const twoSampleCIConditionScenarios = [
  {
    desc: "Researchers took two independent random samples of Argiope spiders: 14 females and 14 males.",
    given: "Both samples are less than 10% of their respective spider populations, and histograms for both samples are roughly unimodal and symmetric with no obvious outliers.",
    allMet: true,
    detail: "Independence is met because the data came from two independent random samples. The 10% condition is met because 14 is less than 10% of each population. Both sample sizes are less than 30, but the sample distributions are roughly unimodal and symmetric with no obvious outliers, so the normal condition is reasonable for both groups.",
    explanationGroups: [
      ["independent", "two independent random samples", "random sample", "randomly selected"],
      ["10%", "10 percent", "less than 10%", "respective populations"],
      ["both sample sizes are less than 30", "roughly unimodal", "symmetric", "no obvious outliers", "normal condition"]
    ]
  },
  {
    desc: "Researchers took two independent random samples of Argiope spiders: 35 females and 35 males.",
    given: "Both samples are less than 10% of their respective spider populations.",
    allMet: true,
    detail: "Independence is met because the data came from two independent random samples. The 10% condition is met because both samples are less than 10% of their respective populations. The normal condition is met because both sample sizes are greater than 30.",
    explanationGroups: [
      ["independent", "two independent random samples", "random sample", "randomly selected"],
      ["10%", "10 percent", "less than 10%", "respective populations"],
      ["both sample sizes are greater than 30", "more than 30", "n1", "n2", "normal condition"]
    ]
  },
  {
    desc: "A teacher randomly assigned 18 students to a slow internet room and 18 students to a fast internet room, then measured diastolic blood pressure after the task.",
    given: "This was a randomized experiment, but the boxplots for the two groups show clear skewness and an outlier.",
    allMet: false,
    detail: "Independence is met because this was a randomized experiment with two groups. A separate 10% sampling check is not needed here because the students were assigned to treatments rather than sampled without replacement from a large population. The normal condition is not met because both sample sizes are less than 30 and the sample distributions show clear skewness and an outlier.",
    explanationGroups: [
      ["randomized experiment", "random assignment", "randomly assigned", "independent"],
      ["10%", "not needed", "sampling without replacement", "assigned to treatments"],
      ["less than 30", "skewness", "outlier", "normal condition"]
    ]
  },
  {
    desc: "Researchers took a random sample of 14 female spiders and a random sample of 14 male spiders.",
    given: "Both samples are less than 10% of their respective populations, but the male spider sample shows strong right skew and an outlier.",
    allMet: false,
    detail: "Independence is met because the data came from two random samples. The 10% condition is met because both samples are less than 10% of their populations. The normal condition is not met because both sample sizes are less than 30 and one of the sample distributions has strong skewness and an outlier.",
    explanationGroups: [
      ["independent", "two random samples", "random sample", "randomly selected"],
      ["10%", "10 percent", "less than 10%", "respective populations"],
      ["less than 30", "strong right skew", "skewness", "outlier", "normal condition"]
    ]
  }
];

const twoSampleCITemplates = [
  {
    desc: "Researchers compared the body lengths of adult female and adult male Argiope spiders.",
    givenPrefix: "Construct a confidence interval for the difference in mean body lengths (female minus male).",
    group1Label: "Female spiders",
    group2Label: "Male spiders",
    differenceLabel: "female minus male",
    units: "millimeters",
    parameter: "difference in the population mean body lengths of female and male Argiope spiders (female minus male)",
    reversedParameter: "difference in the population mean body lengths of female and male Argiope spiders (male minus female)",
    individualText: "individual spider body lengths",
    meanDigits: 2,
    sdDigits: 2,
    xBar1Min: 13.8,
    xBar1Max: 15.6,
    xBar1Step: 0.01,
    xBar2Min: 3.9,
    xBar2Max: 5.4,
    xBar2Step: 0.001,
    s1Min: 3.1,
    s1Max: 3.9,
    s1Step: 0.01,
    s2Min: 0.8,
    s2Max: 1.2,
    s2Step: 0.01,
    settings: [
      { n1: 14, n2: 14, confLevel: 95, tStar: 2.13 },
      { n1: 14, n2: 14, confLevel: 90, tStar: 1.76 },
      { n1: 35, n2: 35, confLevel: 95, tStar: 2.03 }
    ]
  },
  {
    desc: "A teacher compared students' diastolic blood pressure after completing the same online task with slow or fast internet.",
    givenPrefix: "Construct a confidence interval for the difference in mean diastolic blood pressure (slow internet minus fast internet).",
    group1Label: "Slow internet group",
    group2Label: "Fast internet group",
    differenceLabel: "slow internet minus fast internet",
    units: "mm Hg",
    parameter: "difference in the population mean diastolic blood pressure after the task for students like these (slow internet minus fast internet)",
    reversedParameter: "difference in the population mean diastolic blood pressure after the task for students like these (fast internet minus slow internet)",
    individualText: "individual student blood pressure readings",
    meanDigits: 1,
    sdDigits: 1,
    xBar1Min: 83.0,
    xBar1Max: 89.0,
    xBar1Step: 0.1,
    xBar2Min: 75.0,
    xBar2Max: 81.0,
    xBar2Step: 0.1,
    s1Min: 7.0,
    s1Max: 11.0,
    s1Step: 0.1,
    s2Min: 6.0,
    s2Max: 9.5,
    s2Step: 0.1,
    settings: [
      { n1: 18, n2: 18, confLevel: 90, tStar: 1.74 },
      { n1: 24, n2: 24, confLevel: 95, tStar: 2.07 },
      { n1: 32, n2: 32, confLevel: 95, tStar: 2.04 }
    ]
  }
];

const twoSampleClaimTemplates = [
  {
    desc: "Researchers compared the body lengths of adult female and adult male Argiope spiders.",
    sampleText: "many random samples of female and male Argiope spiders using the same sample sizes as the study",
    differenceLabel: "female minus male",
    units: "millimeters",
    digits: 3,
    confLevel: 95,
    lower: 7.956,
    upper: 12.129,
    parameter: "difference in the true mean body lengths of all female and male Argiope spiders (female minus male)",
    reversedParameter: "difference in the true mean body lengths of all female and male Argiope spiders (male minus female)",
    claim: "female Argiope spiders have larger mean body lengths than male Argiope spiders"
  },
  {
    desc: "Researchers summarized the same Argiope spider study using the difference in mean body lengths (male minus female).",
    sampleText: "many random samples of female and male Argiope spiders using the same sample sizes as the study",
    differenceLabel: "male minus female",
    units: "millimeters",
    digits: 3,
    confLevel: 95,
    lower: -12.129,
    upper: -7.956,
    parameter: "difference in the true mean body lengths of all male and female Argiope spiders (male minus female)",
    reversedParameter: "difference in the true mean body lengths of all male and female Argiope spiders (female minus male)",
    claim: "male Argiope spiders have smaller mean body lengths than female Argiope spiders"
  },
  {
    desc: "A restaurant manager compared food temperatures in foam and plastic containers after 30 minutes.",
    sampleText: "many random samples of foam and plastic containers using the same sample sizes as the study",
    differenceLabel: "foam minus plastic",
    units: "degrees Fahrenheit",
    digits: 1,
    confLevel: 95,
    lower: -9.3,
    upper: 3.2,
    parameter: "true difference in mean internal food temperatures for foam and plastic containers (foam minus plastic)",
    reversedParameter: "true difference in mean internal food temperatures for foam and plastic containers (plastic minus foam)",
    claim: "foam containers maintain higher mean food temperatures than plastic containers"
  },
  {
    desc: "A council member compared response times for fire stations in the northern and southern halves of a city.",
    sampleText: "many random samples of 50 calls from the northern fire station and 50 calls from the southern fire station",
    differenceLabel: "northern minus southern",
    units: "minutes",
    digits: 2,
    confLevel: 95,
    lower: -2.37,
    upper: 0.37,
    parameter: "difference in the population mean response times for the two fire stations (northern minus southern)",
    reversedParameter: "difference in the population mean response times for the two fire stations (southern minus northern)",
    claim: "the two fire stations have different mean response times"
  }
];

const twoSampleTestSetupTemplates = [
  {
    desc: "Three students randomly assigned 14 volunteers to hear a story while the storyteller yawned occasionally and 13 volunteers to hear the same story without any yawning.",
    questionText: "Do the data provide convincing statistical evidence that people yawn more, on average, when watching someone yawn?",
    relation: ">",
    mu1Symbol: "\u03bc_Y",
    mu2Symbol: "\u03bc_N",
    xBar1Symbol: "x-bar_Y",
    xBar2Symbol: "x-bar_N",
    mu1Definition: "the true mean number of yawns for all people exposed to someone yawning",
    mu2Definition: "the true mean number of yawns for all people not exposed to someone yawning",
    sample1Definition: "the sample mean number of yawns for the people exposed to someone yawning",
    sample2Definition: "the sample mean number of yawns for the people not exposed to someone yawning",
    individual1Definition: "the number of yawns for one person exposed to someone yawning",
    individual2Definition: "the number of yawns for one person not exposed to someone yawning",
    claimSummary: "people exposed to someone yawning yawn more, on average, than people not exposed to someone yawning"
  },
  {
    desc: "A statistics student randomly sampled 200 words from a chemistry textbook and 200 words from a physics textbook to compare mean word lengths.",
    questionText: "Do the data provide convincing statistical evidence that the two textbooks have different mean word lengths?",
    relation: "!=",
    mu1Symbol: "\u03bc_P",
    mu2Symbol: "\u03bc_C",
    xBar1Symbol: "x-bar_P",
    xBar2Symbol: "x-bar_C",
    mu1Definition: "the true mean word length for words in the physics textbook",
    mu2Definition: "the true mean word length for words in the chemistry textbook",
    sample1Definition: "the sample mean word length for the 200 words from the physics textbook",
    sample2Definition: "the sample mean word length for the 200 words from the chemistry textbook",
    individual1Definition: "the length of one word from the physics textbook",
    individual2Definition: "the length of one word from the chemistry textbook",
    claimSummary: "the two textbooks have different mean word lengths"
  },
  {
    desc: "A restaurant manager compared food temperatures in foam and plastic containers after 30 minutes.",
    questionText: "Do the data provide convincing statistical evidence that foam containers maintain higher mean food temperatures than plastic containers?",
    relation: ">",
    mu1Symbol: "\u03bc_F",
    mu2Symbol: "\u03bc_P",
    xBar1Symbol: "x-bar_F",
    xBar2Symbol: "x-bar_P",
    mu1Definition: "the true mean internal food temperature after 30 minutes for all foam containers like those in the study",
    mu2Definition: "the true mean internal food temperature after 30 minutes for all plastic containers like those in the study",
    sample1Definition: "the sample mean internal food temperature after 30 minutes for the foam containers in the study",
    sample2Definition: "the sample mean internal food temperature after 30 minutes for the plastic containers in the study",
    individual1Definition: "the temperature for one foam container after 30 minutes",
    individual2Definition: "the temperature for one plastic container after 30 minutes",
    claimSummary: "foam containers maintain higher mean food temperatures than plastic containers"
  },
  {
    desc: "A council member compared response times for fire stations in the northern and southern halves of a city.",
    questionText: "Do the data provide convincing statistical evidence that the two stations have different mean response times?",
    relation: "!=",
    mu1Symbol: "\u03bc_N",
    mu2Symbol: "\u03bc_S",
    xBar1Symbol: "x-bar_N",
    xBar2Symbol: "x-bar_S",
    mu1Definition: "the true mean response time for calls handled by the northern fire station",
    mu2Definition: "the true mean response time for calls handled by the southern fire station",
    sample1Definition: "the sample mean response time for the calls sampled from the northern fire station",
    sample2Definition: "the sample mean response time for the calls sampled from the southern fire station",
    individual1Definition: "the response time for one call handled by the northern fire station",
    individual2Definition: "the response time for one call handled by the southern fire station",
    claimSummary: "the two stations have different mean response times"
  }
];

const oneSidedTwoSampleTestSetupTemplates = twoSampleTestSetupTemplates.filter(template => template.relation !== "!=");

const meanTestSetupTemplates = [
  {
    statementPrefix: "Got Hops? An article claims that the average vertical jump for students at this high school is",
    questionText: "AP Statistics students want to know whether the average vertical jump for all students at this school differs from the claim.",
    sampleDescription: "A random sample of 20 students is selected and their vertical jumps are recorded.",
    parameter: "mean vertical jump for all students at this high school",
    sampleStatisticLabel: "sample mean vertical jump of the 20 students in the sample",
    individualLabel: "vertical jump of one student at this high school",
    populationTotalLabel: "total vertical jump of all students at this high school",
    units: "inches",
    benchmarkChoices: [15, 16, 17],
    relation: "!="
  },
  {
    statementPrefix: "A tire manufacturer must test whether its Tread40 tires last more than",
    questionText: "A quality-control engineer wants to know whether the true mean mileage exceeds the benchmark.",
    sampleDescription: "A random sample of 35 tires is tested under simulated driving conditions.",
    parameter: "mean mileage for all Tread40 tires",
    sampleStatisticLabel: "sample mean mileage of the 35 tires in the test",
    individualLabel: "mileage of one Tread40 tire",
    populationTotalLabel: "total mileage of all Tread40 tires",
    units: "miles",
    benchmarkChoices: [40000, 42000, 44000],
    relation: ">"
  },
  {
    statementPrefix: "CB Tablets claims that its tablet computers have an average battery life of",
    questionText: "A consumer advocacy group wonders whether the true mean battery life is less than the claim.",
    sampleDescription: "Battery-life data are collected for 10 tablets from this brand.",
    parameter: "mean battery life of all CB Tablets under normal usage",
    sampleStatisticLabel: "sample mean battery life of the 10 tablets in the sample",
    individualLabel: "battery life of one CB Tablet",
    populationTotalLabel: "total battery life of all CB Tablets",
    units: "hours",
    benchmarkChoices: [14, 15, 16],
    relation: "<"
  }
];

const testConditionScenarios = [
  {
    desc: "AP Statistics students selected a random sample of 20 students from a large high school and measured vertical jump height. A boxplot of the sample shows no strong skewness or outliers.",
    given: "n = 20, random sample, and 20 students is less than 10% of all students at the school.",
    allMet: true,
    detail: "Random: met because the students were randomly selected. 10%: met because 20 is less than 10% of the students at a large high school. Shape: met because n is less than 30 but the sample shows no strong skewness or outliers.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "outlier", "no strong skewness", "no outliers"]
    ]
  },
  {
    desc: "A consumer advocacy group records battery life for 10 CB Tablets, but there is no indication that the tablets were randomly selected. A dotplot shows strong skewness and a potential outlier.",
    given: "n = 10, not random, and 10 tablets is less than 10% of all tablets made by CB Tablets.",
    allMet: false,
    detail: "Random: not met because there is no indication of a random sample. 10%: met because 10 is less than 10% of all tablets made by CB Tablets. Shape: not met because n is less than 30 and the data show strong skewness and a potential outlier.",
    explanationGroups: [
      ["random", "not random", "no indication", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["skew", "strong skewness", "outlier", "potential outlier"]
    ]
  },
  {
    desc: "A quality-control engineer randomly selects 35 Tread40 tires and tests them on a driving simulator.",
    given: "n = 35, random sample, and 35 tires is less than 10% of all Tread40 tires.",
    allMet: true,
    detail: "Random: met because the tires were randomly selected. 10%: met because 35 is less than 10% of all Tread40 tires. Shape: met because n is at least 30.",
    explanationGroups: [
      ["random", "randomly", "random sample"],
      ["10%", "10 percent", "less than 10%", "population"],
      ["30", "n >= 30", "at least 30", "large sample"]
    ]
  }
];

const meanTestCarryOutTemplates = [
  {
    desc: "Got Hops? An article claims that the average vertical jump for students at this high school is 15 inches.",
    sampleText: "A random sample of 20 students had a sample mean vertical jump of 15.8 inches with a standard deviation of 2.33 inches.",
    sampleStatisticLabel: "sample mean vertical jump",
    sampleStatisticValue: 15.8,
    sampleStatisticText: "15.8 inches",
    nullValue: 15,
    nullValueText: "15 inches",
    s: 2.33,
    n: 20,
    relation: "!=",
    parameter: "mean vertical jump for all students at this high school",
    nullContext: "the mean vertical jump for all students at this high school is 15 inches",
    alternativeClaimText: "the mean vertical jump for all students at this school is different from 15 inches",
    observedOutcomeText: "a sample mean vertical jump as extreme as or more extreme than 15.8 inches in either direction",
    chanceText: "by chance alone in a random sample of 20 students",
    alpha: 0.05,
    alphaText: "0.05",
    pValue: 0.1412
  },
  {
    desc: "A tire manufacturer tests whether Tread40 tires last more than 40,000 miles on average.",
    sampleText: "A random sample of 35 tires had a sample mean mileage of 42,348 miles with a standard deviation of 2,140 miles.",
    sampleStatisticLabel: "sample mean mileage",
    sampleStatisticValue: 42348,
    sampleStatisticText: "42,348 miles",
    nullValue: 40000,
    nullValueText: "40,000 miles",
    s: 2140,
    n: 35,
    relation: ">",
    parameter: "mean mileage for all Tread40 tires",
    nullContext: "the mean mileage for all Tread40 tires is 40,000 miles",
    alternativeClaimText: "the mean mileage for all Tread40 tires is greater than 40,000 miles",
    observedOutcomeText: "a sample mean mileage of 42,348 miles or greater",
    chanceText: "by chance alone in a random sample of 35 tires",
    alpha: 0.01,
    alphaText: "0.01",
    pValue: 9.99e-8
  },
  {
    desc: "Bakin' Bacon! Doug compared seasoned and unseasoned bacon using 10 matched pairs of half-packages.",
    sampleText: "For the differences (with seasoning - without seasoning), the sample mean difference was 9.5 grams with a standard deviation of 12.51 grams.",
    sampleStatisticLabel: "sample mean difference",
    sampleStatisticValue: 9.5,
    sampleStatisticText: "9.5 grams",
    nullValue: 0,
    nullValueText: "0 grams",
    s: 12.51,
    n: 10,
    relation: ">",
    parameter: "true mean difference in cooked bacon weight (with seasoning minus without seasoning) for packages of bacon like those in the study",
    nullContext: "the true mean difference in cooked bacon weight for packages of bacon like those in the study is 0 grams",
    alternativeClaimText: "the seasoning causes cooked bacon to retain more weight on average for packages of bacon like the ones in the study",
    observedOutcomeText: "a sample mean difference of 9.5 grams or greater",
    chanceText: "by chance alone in this random assignment of 10 bacon packages",
    alpha: 0.05,
    alphaText: "0.05",
    pValue: 0.0199
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

function buildTwoSampleCIIntervalScenario(template) {
  const setting = choice(template.settings);
  const xBar1 = randStep(template.xBar1Min, template.xBar1Max, template.xBar1Step);
  const xBar2 = randStep(template.xBar2Min, template.xBar2Max, template.xBar2Step);
  const s1 = randStep(template.s1Min, template.s1Max, template.s1Step);
  const s2 = randStep(template.s2Min, template.s2Max, template.s2Step);
  const seRaw = Math.sqrt((s1 * s1) / setting.n1 + (s2 * s2) / setting.n2);
  const pointEstimateRaw = xBar1 - xBar2;
  const meRaw = setting.tStar * seRaw;
  const lowerRaw = pointEstimateRaw - meRaw;
  const upperRaw = pointEstimateRaw + meRaw;

  return {
    ...template,
    ...setting,
    xBar1: roundTo(xBar1, 3),
    xBar2: roundTo(xBar2, 3),
    s1: roundTo(s1, 3),
    s2: roundTo(s2, 3),
    xBar1Text: toFixedString(xBar1, template.meanDigits),
    xBar2Text: toFixedString(xBar2, template.meanDigits),
    s1Text: toFixedString(s1, template.sdDigits),
    s2Text: toFixedString(s2, template.sdDigits),
    tStarText: toFixedString(setting.tStar, 2),
    se: roundTo(seRaw, 4),
    pointEstimate: roundTo(pointEstimateRaw, 4),
    pointEstimateText: toFixedString(pointEstimateRaw, 2),
    me: roundTo(meRaw, 2),
    meText: toFixedString(meRaw, 2),
    lower: roundTo(lowerRaw, 2),
    lowerText: toFixedString(lowerRaw, 2),
    upper: roundTo(upperRaw, 2),
    upperText: toFixedString(upperRaw, 2),
    reverseLower: roundTo(-upperRaw, 2),
    reverseUpper: roundTo(-lowerRaw, 2)
  };
}

function getTwoSampleCISummaryText(scen) {
  return `${scen.givenPrefix} ${scen.group1Label}: x-bar = ${scen.xBar1Text}, s = ${scen.s1Text}, n = ${scen.n1}. ${scen.group2Label}: x-bar = ${scen.xBar2Text}, s = ${scen.s2Text}, n = ${scen.n2}.`;
}

function buildTwoSampleCIInterpretOptions(scen) {
  const correct = `We are ${scen.confLevel}% confident that the ${scen.parameter} is between ${scen.lowerText} and ${scen.upperText} ${scen.units}.`;
  return {
    correct,
    options: shuffle([
      correct,
      `There is a ${scen.confLevel}% probability that the ${scen.parameter} is between ${scen.lowerText} and ${scen.upperText} ${scen.units}.`,
      `About ${scen.confLevel}% of ${scen.individualText} are between ${scen.lowerText} and ${scen.upperText} ${scen.units}.`,
      `We are ${scen.confLevel}% confident that the ${scen.reversedParameter} is between ${scen.lowerText} and ${scen.upperText} ${scen.units}.`
    ])
  };
}

function buildTwoSampleClaimScenario(template) {
  const pointEstimate = (template.lower + template.upper) / 2;
  return {
    ...template,
    lowerText: toFixedString(template.lower, template.digits),
    upperText: toFixedString(template.upper, template.digits),
    pointEstimateText: toFixedString(pointEstimate, template.digits),
    containsZero: template.lower <= 0 && template.upper >= 0,
    supportClaim: !(template.lower <= 0 && template.upper >= 0)
  };
}

function getTwoSampleClaimIntervalText(scen) {
  return `${scen.desc} A ${scen.confLevel}% confidence interval for ${scen.differenceLabel} is ${scen.lowerText} to ${scen.upperText} ${scen.units}.`;
}

function buildDiffMeansZeroValueOptions(scen) {
  const correct = "0";
  return {
    correct,
    options: shuffle([correct, scen.pointEstimateText, scen.lowerText, scen.upperText])
  };
}

function buildDiffMeansZeroPlausibleOptions(scen) {
  if (scen.containsZero) {
    const correct = "Yes. Because 0 is inside the interval, no difference is a plausible value.";
    return {
      correct,
      options: shuffle([
        correct,
        "No. Because 0 is outside the interval, no difference is not plausible.",
        "Yes. Because 0 is always a plausible value for a difference in means.",
        "No. Because confidence intervals for a difference in means can never include 0."
      ])
    };
  }

  const correct = "No. Because 0 is not inside the interval, no difference is not a plausible value.";
  return {
    correct,
    options: shuffle([
      correct,
      "Yes. Because 0 is inside the interval, no difference is a plausible value.",
      "Yes. Because the interval only estimates sample differences, 0 is still plausible for the population difference.",
      "No. Because confidence intervals for a difference in means can never include 0."
    ])
  };
}

function buildDiffMeansClaimJustifyOptions(scen) {
  if (scen.supportClaim) {
    const correct = `Yes. Because 0 is not in the interval, 0 is not a plausible value for ${scen.differenceLabel}, so the interval supports the claim that ${scen.claim}.`;
    return {
      correct,
      options: shuffle([
        correct,
        `No. Because 0 is not in the interval, there is no evidence that ${scen.claim}.`,
        `Yes. The interval proves with certainty that ${scen.claim}.`,
        `Yes. Because the sample means were different, the claim must be true that ${scen.claim}.`
      ])
    };
  }

  const correct = `No. Because 0 is in the interval, 0 is a plausible value for ${scen.differenceLabel}, so the interval does not support the claim that ${scen.claim}.`;
  return {
    correct,
    options: shuffle([
      correct,
      `Yes. Because the sample means were not identical, the interval still supports the claim that ${scen.claim}.`,
      "No. The interval proves that the two population means are exactly equal.",
      `Yes. The interval proves with certainty that ${scen.claim}.`
    ])
  };
}

function buildDiffMeansClaimConclusionOptions(scen) {
  if (scen.supportClaim) {
    const correct = `There is convincing evidence that ${scen.claim}.`;
    return {
      correct,
      options: shuffle([
        correct,
        `This proves with certainty that ${scen.claim}.`,
        "A confidence interval cannot be used to make a conclusion about population means.",
        "Because 0 is not in the interval, every individual observation in group 1 must exceed every individual observation in group 2."
      ])
    };
  }

  const correct = `The interval does not support the claim that ${scen.claim}.`;
  return {
    correct,
    options: shuffle([
      correct,
      "This proves the opposite claim is true.",
      "Therefore, the person making the claim is wrong.",
      `Because the sample means were different, the interval still proves that ${scen.claim}.`
    ])
  };
}

function buildDiffMeansConfidenceLevelOptions(scen) {
  const correct = `If we took ${scen.sampleText} and built a ${scen.confLevel}% confidence interval for the ${scen.parameter} from each pair of samples, then about ${scen.confLevel}% of those intervals would capture the population difference in means.`;
  return {
    correct,
    options: shuffle([
      correct,
      `There is a ${scen.confLevel}% probability that this one interval captures the ${scen.parameter}.`,
      `About ${scen.confLevel}% of the individual observations from both groups fall inside the interval.`,
      `About ${scen.confLevel}% of the sample differences from those samples will equal the ${scen.parameter}.`
    ])
  };
}

function buildTwoSampleTestSetupScenario(template) {
  const relationSymbol = getRelationSymbol(template.relation);
  const wrongOneSidedRelation = template.relation === "!=" ? choice([">", "<"]) : getOppositeRelation(template.relation);
  return {
    ...template,
    relationSymbol,
    wrongOneSidedRelation,
    reverseRelation: template.relation === "!=" ? NEQ : getOppositeRelation(template.relation),
    differenceSymbol: `${template.mu1Symbol} - ${template.mu2Symbol}`,
    reversedDifferenceSymbol: `${template.mu2Symbol} - ${template.mu1Symbol}`,
    symbolGuideText: `Let ${template.mu1Symbol} be ${template.mu1Definition}, and let ${template.mu2Symbol} be ${template.mu2Definition}.`,
    parameterDefinition: `${template.mu1Symbol} is ${template.mu1Definition}, and ${template.mu2Symbol} is ${template.mu2Definition}.`,
    sampleDefinitionText: `${template.xBar1Symbol} is ${template.sample1Definition}, and ${template.xBar2Symbol} is ${template.sample2Definition}.`,
    individualDefinitionText: `${template.mu1Symbol} is ${template.individual1Definition}, and ${template.mu2Symbol} is ${template.individual2Definition}.`,
    swappedDefinitionText: `${template.mu1Symbol} is ${template.mu2Definition}, and ${template.mu2Symbol} is ${template.mu1Definition}.`
  };
}

function buildDiffMeansNullHypothesisOptions(scen) {
  const correct = `${H0}: ${scen.differenceSymbol} = 0`;
  return {
    correct,
    options: shuffle([
      correct,
      `${H0}: ${scen.xBar1Symbol} - ${scen.xBar2Symbol} = 0`,
      `${H0}: ${scen.differenceSymbol} ${scen.wrongOneSidedRelation} 0`,
      `${H0}: ${scen.differenceSymbol} ${NEQ} 0`
    ])
  };
}

function buildDiffMeansAlternativeHypothesisOptions(scen) {
  const correct = `${HA}: ${scen.differenceSymbol} ${scen.relationSymbol} 0`;
  const wrongDirection = scen.relation === "!=" ? scen.wrongOneSidedRelation : scen.reverseRelation;
  return {
    correct,
    options: shuffle([
      correct,
      `${HA}: ${scen.differenceSymbol} = 0`,
      `${HA}: ${scen.differenceSymbol} ${wrongDirection} 0`,
      `${HA}: ${scen.xBar1Symbol} - ${scen.xBar2Symbol} ${scen.relationSymbol} 0`
    ])
  };
}

function buildDiffMeansAlternativeTypeOptions(scen) {
  if (scen.relation === "!=") {
    const correct = "Use a two-sided alternative because the question asks whether the two population means are different, not which one is larger.";
    return {
      correct,
      options: shuffle([
        correct,
        "Use a one-sided alternative with > because the first group might have the larger mean.",
        "Use a one-sided alternative with < because the second group might have the larger mean.",
        "Use only the null hypothesis because no direction is stated."
      ])
    };
  }

  const oppositeRelation = scen.reverseRelation;
  const correct = `Use a one-sided alternative with ${scen.relation} because the claim is that ${scen.claimSummary}.`;
  return {
    correct,
    options: shuffle([
      correct,
      "Use a two-sided alternative because any difference would support the claim.",
      `Use a one-sided alternative with ${oppositeRelation} because the claim goes in the opposite direction.`,
      "Use only the null hypothesis because no direction is stated."
    ])
  };
}

function buildDiffMeansReverseOrderOptions(scen) {
  const correct = `${HA}: ${scen.reversedDifferenceSymbol} ${scen.reverseRelation} 0`;
  const sameSignText = `${HA}: ${scen.reversedDifferenceSymbol} ${scen.relationSymbol} 0`;
  const originalOrderText = `${HA}: ${scen.differenceSymbol} ${scen.relationSymbol} 0`;
  const statisticsText = `${HA}: ${scen.xBar2Symbol} - ${scen.xBar1Symbol} ${scen.reverseRelation} 0`;
  return {
    correct,
    sameSignText,
    originalOrderText,
    statisticsText,
    options: shuffle([correct, sameSignText, originalOrderText, statisticsText])
  };
}

function buildDiffMeansParameterDefinitionOptions(scen) {
  const correct = scen.parameterDefinition;
  return {
    correct,
    sampleDefinitionText: scen.sampleDefinitionText,
    individualDefinitionText: scen.individualDefinitionText,
    swappedDefinitionText: scen.swappedDefinitionText,
    options: shuffle([
      correct,
      scen.sampleDefinitionText,
      scen.individualDefinitionText,
      scen.swappedDefinitionText
    ])
  };
}

function formatBenchmarkNumber(value) {
  return Number.isInteger(value) ? value.toLocaleString("en-US") : String(value);
}

function pickDifferentValue(values, current) {
  return choice(values.filter(value => value !== current));
}

function getRelationSymbol(relation) {
  if (relation === "!=") return NEQ;
  return relation;
}

function getOppositeRelation(relation) {
  if (relation === ">") return "<";
  if (relation === "<") return ">";
  return choice([">", "<"]);
}

function buildMeanTestSetupScenario(template) {
  const benchmark = choice(template.benchmarkChoices);
  const benchmarkCore = formatBenchmarkNumber(benchmark);
  const wrongBenchmark = pickDifferentValue(template.benchmarkChoices, benchmark);
  const wrongBenchmarkCore = formatBenchmarkNumber(wrongBenchmark);

  return {
    ...template,
    benchmark,
    benchmarkText: `${benchmarkCore} ${template.units}`,
    wrongBenchmarkText: `${wrongBenchmarkCore} ${template.units}`,
    desc: `${template.statementPrefix} ${benchmarkCore} ${template.units}.`,
    givenText: `${template.statementPrefix} ${benchmarkCore} ${template.units}. ${template.questionText}`
  };
}

function buildNullHypothesisOptions(scen) {
  const correct = `${H0}: ${MU} = ${scen.benchmarkText}`;
  return {
    correct,
    options: shuffle([
      correct,
      `${H0}: x-bar = ${scen.benchmarkText}`,
      `${H0}: ${MU} ${getRelationSymbol(scen.relation)} ${scen.benchmarkText}`,
      `${H0}: ${MU} = ${scen.wrongBenchmarkText}`
    ])
  };
}

function buildAlternativeHypothesisOptions(scen) {
  const correct = `${HA}: ${MU} ${getRelationSymbol(scen.relation)} ${scen.benchmarkText}`;
  return {
    correct,
    options: shuffle([
      correct,
      `${HA}: ${MU} = ${scen.benchmarkText}`,
      `${HA}: ${MU} ${getOppositeRelation(scen.relation)} ${scen.benchmarkText}`,
      `${HA}: x-bar ${getRelationSymbol(scen.relation)} ${scen.benchmarkText}`
    ])
  };
}

function buildParameterDefinitionOptions(scen) {
  return {
    correct: scen.parameter,
    options: shuffle([
      scen.parameter,
      scen.sampleStatisticLabel,
      scen.individualLabel,
      scen.populationTotalLabel
    ])
  };
}

function formatProbabilityDisplay(value) {
  if (value < 0.001) {
    const exponent = Math.floor(Math.log10(value));
    const mantissa = roundTo(value / Math.pow(10, exponent), 3);
    return `${mantissa} x 10^${exponent}`;
  }
  if (value > 0.9999) {
    return Number(value.toFixed(7)).toString();
  }
  return toFixedString(value, 4);
}

function buildMeanTestCarryOutScenario(template) {
  const se = template.s / Math.sqrt(template.n);
  const t = roundTo((template.sampleStatisticValue - template.nullValue) / se, 3);

  return {
    ...template,
    se: roundTo(se, 4),
    t,
    tText: toFixedString(t, 3),
    absTText: toFixedString(Math.abs(t), 3),
    df: template.n - 1,
    pValueText: formatProbabilityDisplay(template.pValue),
    rejectNull: template.pValue <= template.alpha,
    hypothesisText: `${H0}: ${MU} = ${template.nullValueText}; ${HA}: ${MU} ${getRelationSymbol(template.relation)} ${template.nullValueText}.`
  };
}

function buildPValueRegionOptions(scen) {
  if (scen.relation === "!=") {
    const correct = `P(T <= -${scen.absTText} or T >= ${scen.absTText}) with df = ${scen.df}`;
    return {
      correct,
      options: shuffle([
        correct,
        `P(T >= ${scen.tText}) with df = ${scen.df}`,
        `P(T <= ${scen.tText}) with df = ${scen.df}`,
        `P(-${scen.absTText} <= T <= ${scen.absTText}) with df = ${scen.df}`
      ])
    };
  }

  if (scen.relation === ">") {
    const correct = `P(T >= ${scen.tText}) with df = ${scen.df}`;
    return {
      correct,
      options: shuffle([
        correct,
        `P(T <= -${scen.absTText}) with df = ${scen.df}`,
        `P(T <= ${scen.tText}) with df = ${scen.df}`,
        `P(-${scen.absTText} <= T <= ${scen.absTText}) with df = ${scen.df}`
      ])
    };
  }

  const correct = `P(T <= ${scen.tText}) with df = ${scen.df}`;
  return {
    correct,
    options: shuffle([
      correct,
      `P(T >= ${scen.absTText}) with df = ${scen.df}`,
      `P(T >= -${scen.absTText}) with df = ${scen.df}`,
      `P(-${scen.absTText} <= T <= ${scen.absTText}) with df = ${scen.df}`
    ])
  };
}

function buildPValueOptions(scen) {
  const correct = scen.pValueText;

  if (scen.relation === "!=") {
    const oneTailText = formatProbabilityDisplay(scen.pValue / 2);
    const complementText = formatProbabilityDisplay(1 - scen.pValue);
    const oneMinusTailText = formatProbabilityDisplay(1 - scen.pValue / 2);
    return {
      correct,
      options: shuffle([correct, oneTailText, complementText, oneMinusTailText]),
      oneTailText,
      complementText,
      oneMinusTailText
    };
  }

  const doubledText = formatProbabilityDisplay(Math.min(1, scen.pValue * 2));
  const complementText = formatProbabilityDisplay(1 - scen.pValue);
  const halvedText = formatProbabilityDisplay(scen.pValue / 2);
  return {
    correct,
    options: shuffle([correct, doubledText, complementText, halvedText]),
    doubledText,
    complementText,
    halvedText
  };
}

function buildPValueInterpretOptions(scen) {
  const correct = `Assuming ${scen.nullContext}, there is a ${scen.pValueText} probability of getting ${scen.observedOutcomeText} ${scen.chanceText}.`;
  return {
    correct,
    options: shuffle([
      correct,
      `There is a ${scen.pValueText} probability that ${scen.nullContext}.`,
      `There is a ${scen.pValueText} probability that ${scen.alternativeClaimText}.`,
      `There is a ${scen.pValueText} probability that the ${scen.parameter} equals ${scen.sampleStatisticText}.`
    ])
  };
}

function buildTestConclusionOptions(scen) {
  if (scen.rejectNull) {
    const correct = `Because the p-value of ${scen.pValueText} is less than alpha = ${scen.alphaText}, we reject ${H0}. There is convincing statistical evidence that ${scen.alternativeClaimText}.`;
    return {
      correct,
      options: shuffle([
        correct,
        `Because the p-value of ${scen.pValueText} is greater than alpha = ${scen.alphaText}, we fail to reject ${H0}. There is not convincing statistical evidence that ${scen.alternativeClaimText}.`,
        `Because the p-value of ${scen.pValueText} is less than alpha = ${scen.alphaText}, we fail to reject ${H0}. There is not convincing statistical evidence that ${scen.alternativeClaimText}.`,
        `Because the p-value of ${scen.pValueText} is less than alpha = ${scen.alphaText}, we reject ${H0}. This proves with certainty that ${scen.alternativeClaimText}.`
      ])
    };
  }

  const correct = `Because the p-value of ${scen.pValueText} is greater than alpha = ${scen.alphaText}, we fail to reject ${H0}. There is not convincing statistical evidence that ${scen.alternativeClaimText}.`;
  return {
    correct,
    options: shuffle([
      correct,
      `Because the p-value of ${scen.pValueText} is less than alpha = ${scen.alphaText}, we reject ${H0}. There is convincing statistical evidence that ${scen.alternativeClaimText}.`,
      `Because the p-value of ${scen.pValueText} is greater than alpha = ${scen.alphaText}, we reject ${H0}. There is convincing statistical evidence that ${scen.alternativeClaimText}.`,
      `Because the p-value of ${scen.pValueText} is greater than alpha = ${scen.alphaText}, we fail to reject ${H0}. This proves that ${H0} is true.`
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

  if (modeId === "l16-state-null-hypothesis") {
    const template = drawFromBag("u74-null", meanTestSetupTemplates);
    const scen = buildMeanTestSetupScenario(template);
    const hypothesis = buildNullHypothesisOptions(scen);

    answers = { nullHypothesisAnswer: { value: hypothesis.correct } };
    context = attachAnswers(
      {
        levelName: "7.4a: State the Null Hypothesis",
        problemText: "Choose the null hypothesis for the test.",
        givenText: scen.givenText,
        optA: hypothesis.options[0],
        optB: hypothesis.options[1],
        optC: hypothesis.options[2],
        optD: hypothesis.options[3],
        benchmark: scen.benchmarkText,
        parameter: scen.parameter
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.questionText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l17-state-alternative-hypothesis") {
    const template = drawFromBag("u74-alt", meanTestSetupTemplates);
    const scen = buildMeanTestSetupScenario(template);
    const hypothesis = buildAlternativeHypothesisOptions(scen);

    answers = { alternativeHypothesisAnswer: { value: hypothesis.correct } };
    context = attachAnswers(
      {
        levelName: "7.4b: State the Alternative Hypothesis",
        problemText: "Choose the alternative hypothesis that matches the question of interest.",
        givenText: scen.givenText,
        optA: hypothesis.options[0],
        optB: hypothesis.options[1],
        optC: hypothesis.options[2],
        optD: hypothesis.options[3],
        benchmark: scen.benchmarkText,
        relation: scen.relation,
        parameter: scen.parameter
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.questionText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l18-define-parameter") {
    const template = drawFromBag("u74-parameter", meanTestSetupTemplates);
    const scen = buildMeanTestSetupScenario(template);
    const definition = buildParameterDefinitionOptions(scen);

    answers = { parameterDefinitionAnswer: { value: definition.correct } };
    context = attachAnswers(
      {
        levelName: "7.4c: Define the Parameter",
        problemText: "Identify what mu represents in context.",
        givenText: `${scen.givenText} ${scen.sampleDescription}`,
        optA: definition.options[0],
        optB: definition.options[1],
        optC: definition.options[2],
        optD: definition.options[3],
        parameter: scen.parameter
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.sampleDescription} ${scen.questionText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l19-identify-test-procedure") {
    const template = drawFromBag("u74-procedure", meanTestSetupTemplates);
    const scen = buildMeanTestSetupScenario(template);
    const options = shuffle([TEST_PROCEDURE_CORRECT, ...TEST_PROCEDURE_WRONG]);

    answers = { testProcedureAnswer: { value: TEST_PROCEDURE_CORRECT } };
    context = attachAnswers(
      {
        levelName: "7.4d: Identify the Test Procedure",
        problemText: "Choose the correct significance-test procedure.",
        givenText: `${scen.givenText} ${scen.sampleDescription}`,
        optA: options[0],
        optB: options[1],
        optC: options[2],
        optD: options[3],
        parameter: scen.parameter
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.sampleDescription} ${scen.questionText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l20-check-test-conditions") {
    const scen = drawFromBag("u74-conditions", testConditionScenarios);

    answers = {
      testConditionsMet: { value: scen.allMet ? "Yes, all conditions are met" : "No, at least one condition fails" },
      testConditionsExplain: { value: scen.detail }
    };

    context = attachAnswers(
      {
        levelName: "7.4e: Check Test Conditions",
        problemText: "Decide whether the conditions for a one-sample t-test are met.",
        givenText: `${scen.given} ${scen.desc}`,
        explanationGroups: scen.explanationGroups,
        conditionDetail: scen.detail
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.given}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l21-calculate-test-statistic") {
    const template = drawFromBag("u75-test-stat", meanTestCarryOutTemplates);
    const scen = buildMeanTestCarryOutScenario(template);

    answers = { testStatisticAnswer: { value: scen.t, tolerance: 0.02 } };
    context = attachAnswers(
      {
        levelName: "7.5a: Calculate the Test Statistic",
        problemText: "Calculate the standardized test statistic t.",
        givenText: `${scen.hypothesisText} ${scen.sampleText}`,
        sampleStatisticValue: `${scen.sampleStatisticValue}`,
        nullValue: `${scen.nullValue}`,
        s: `${scen.s}`,
        n: `${scen.n}`,
        se: `${scen.se}`,
        df: `${scen.df}`
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.sampleText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l22-identify-p-value-region") {
    const template = drawFromBag("u75-region", meanTestCarryOutTemplates);
    const scen = buildMeanTestCarryOutScenario(template);
    const region = buildPValueRegionOptions(scen);

    answers = { pValueRegionAnswer: { value: region.correct } };
    context = attachAnswers(
      {
        levelName: "7.5b: Identify the P-value Region",
        problemText: "Choose the probability statement that matches the p-value.",
        givenText: `${scen.hypothesisText} Test statistic: t = ${scen.tText} with df = ${scen.df}.`,
        optA: region.options[0],
        optB: region.options[1],
        optC: region.options[2],
        optD: region.options[3],
        relation: scen.relation,
        tText: scen.tText,
        absTText: scen.absTText,
        df: `${scen.df}`
      },
      answers
    );

    scenario = `${scen.desc}\n\nTest statistic: t = ${scen.tText} with df = ${scen.df}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l23-find-p-value") {
    const template = drawFromBag("u75-pvalue", meanTestCarryOutTemplates);
    const scen = buildMeanTestCarryOutScenario(template);
    const pValue = buildPValueOptions(scen);

    answers = { pValueAnswer: { value: pValue.correct } };
    context = attachAnswers(
      {
        levelName: "7.5c: Find the P-value",
        problemText: "Use the test statistic and the alternative hypothesis to find the p-value.",
        givenText: `${scen.hypothesisText} Test statistic: t = ${scen.tText} with df = ${scen.df}.`,
        optA: pValue.options[0],
        optB: pValue.options[1],
        optC: pValue.options[2],
        optD: pValue.options[3],
        relation: scen.relation,
        oneTailText: pValue.oneTailText,
        doubledText: pValue.doubledText,
        halvedText: pValue.halvedText,
        complementText: pValue.complementText,
        oneMinusTailText: pValue.oneMinusTailText,
        pValueText: scen.pValueText
      },
      answers
    );

    scenario = `${scen.desc}\n\nTest statistic: t = ${scen.tText} with df = ${scen.df}. Find the p-value.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l24-interpret-p-value") {
    const template = drawFromBag("u75-interpret", meanTestCarryOutTemplates);
    const scen = buildMeanTestCarryOutScenario(template);
    const interpretation = buildPValueInterpretOptions(scen);

    answers = { pValueInterpretAnswer: { value: interpretation.correct } };
    context = attachAnswers(
      {
        levelName: "7.5d: Interpret the P-value",
        problemText: "Choose the correct interpretation of the p-value in context.",
        givenText: `${scen.hypothesisText} ${scen.sampleText} The p-value is ${scen.pValueText}.`,
        optA: interpretation.options[0],
        optB: interpretation.options[1],
        optC: interpretation.options[2],
        optD: interpretation.options[3],
        pValueText: scen.pValueText,
        nullContext: scen.nullContext,
        alternativeClaimText: scen.alternativeClaimText
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.sampleText} The p-value is ${scen.pValueText}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l25-state-test-conclusion") {
    const template = drawFromBag("u75-conclusion", meanTestCarryOutTemplates);
    const scen = buildMeanTestCarryOutScenario(template);
    const conclusion = buildTestConclusionOptions(scen);

    answers = { testConclusionAnswer: { value: conclusion.correct } };
    context = attachAnswers(
      {
        levelName: "7.5e: State the Conclusion",
        problemText: "Compare the p-value to alpha and state the conclusion.",
        givenText: `${scen.hypothesisText} The p-value is ${scen.pValueText}, and use alpha = ${scen.alphaText}.`,
        optA: conclusion.options[0],
        optB: conclusion.options[1],
        optC: conclusion.options[2],
        optD: conclusion.options[3],
        rejectNull: scen.rejectNull ? "yes" : "no",
        alphaText: scen.alphaText,
        pValueText: scen.pValueText
      },
      answers
    );

    scenario = `${scen.desc}\n\nThe p-value is ${scen.pValueText}, and use alpha = ${scen.alphaText}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l26-identify-diffmeans-procedure") {
    const scen = drawFromBag("u76-procedure", twoSampleCIProcedureScenarios);
    const options = shuffle([TWO_SAMPLE_CI_PROCEDURE_CORRECT, ...TWO_SAMPLE_CI_PROCEDURE_WRONG]);

    answers = { diffMeansProcedureAnswer: { value: TWO_SAMPLE_CI_PROCEDURE_CORRECT } };
    context = attachAnswers(
      {
        levelName: "7.6a: Identify the Procedure",
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

  if (modeId === "l27-check-diffmeans-conditions") {
    const scen = drawFromBag("u76-conditions", twoSampleCIConditionScenarios);

    answers = {
      diffMeansConditionsMet: { value: scen.allMet ? "Yes, all conditions are met" : "No, at least one condition fails" },
      diffMeansConditionsExplain: { value: scen.detail }
    };

    context = attachAnswers(
      {
        levelName: "7.6b: Check Conditions",
        problemText: "Decide whether the conditions for a two-sample t-interval are met.",
        givenText: `${scen.given} ${scen.desc}`,
        explanationGroups: scen.explanationGroups,
        conditionDetail: scen.detail
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.given}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l28-diffmeans-margin-of-error") {
    const template = drawFromBag("u76-me", twoSampleCITemplates);
    const scen = buildTwoSampleCIIntervalScenario(template);

    answers = { diffMeansMeAnswer: { value: scen.me, tolerance: 0.03 } };
    context = attachAnswers(
      {
        levelName: "7.6c: Margin of Error",
        problemText: "Compute t* x sqrt((s1^2 / n1) + (s2^2 / n2)).",
        givenText: `${getTwoSampleCISummaryText(scen)} Use t* = ${scen.tStarText}.`,
        confLevel: `${scen.confLevel}`,
        xBar1: scen.xBar1Text,
        xBar2: scen.xBar2Text,
        s1: scen.s1Text,
        s2: scen.s2Text,
        n1: `${scen.n1}`,
        n2: `${scen.n2}`,
        tStar: scen.tStarText,
        se: `${scen.se}`,
        units: scen.units
      },
      answers
    );

    scenario = `${scen.desc}\n\n${getTwoSampleCISummaryText(scen)} Use t* = ${scen.tStarText}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l29-construct-diffmeans-interval") {
    const template = drawFromBag("u76-ci", twoSampleCITemplates);
    const scen = buildTwoSampleCIIntervalScenario(template);

    answers = {
      diffMeansCiLower: { value: scen.lower, tolerance: 0.03 },
      diffMeansCiUpper: { value: scen.upper, tolerance: 0.03 }
    };

    context = attachAnswers(
      {
        levelName: "7.6d: Construct the Interval",
        problemText: "Build (x-bar1 - x-bar2) +/- t* x sqrt((s1^2 / n1) + (s2^2 / n2)).",
        givenText: `${getTwoSampleCISummaryText(scen)} Use t* = ${scen.tStarText}.`,
        confLevel: `${scen.confLevel}`,
        xBar1: scen.xBar1Text,
        xBar2: scen.xBar2Text,
        s1: scen.s1Text,
        s2: scen.s2Text,
        n1: `${scen.n1}`,
        n2: `${scen.n2}`,
        tStar: scen.tStarText,
        pointEstimate: scen.pointEstimateText,
        me: scen.meText,
        reverseLower: `${scen.reverseLower}`,
        reverseUpper: `${scen.reverseUpper}`,
        units: scen.units
      },
      answers
    );

    scenario = `${scen.desc}\n\n${getTwoSampleCISummaryText(scen)} Use t* = ${scen.tStarText}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l30-interpret-diffmeans-interval") {
    const template = drawFromBag("u76-interpret", twoSampleCITemplates);
    const scen = buildTwoSampleCIIntervalScenario(template);
    const interpretation = buildTwoSampleCIInterpretOptions(scen);

    answers = { diffMeansIntervalInterpretAnswer: { value: interpretation.correct } };
    context = attachAnswers(
      {
        levelName: "7.6e: Interpret the Interval",
        problemText: "Choose the correct interpretation in context.",
        givenText: `${scen.desc} A ${scen.confLevel}% confidence interval for ${scen.differenceLabel} is ${scen.lowerText} to ${scen.upperText} ${scen.units}.`,
        optA: interpretation.options[0],
        optB: interpretation.options[1],
        optC: interpretation.options[2],
        optD: interpretation.options[3],
        confLevel: `${scen.confLevel}`,
        lower: scen.lowerText,
        upper: scen.upperText,
        units: scen.units,
        parameter: scen.parameter,
        reversedParameter: scen.reversedParameter
      },
      answers
    );

    scenario = `${scen.desc}\n\nA ${scen.confLevel}% confidence interval for ${scen.differenceLabel} is ${scen.lowerText} to ${scen.upperText} ${scen.units}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l31-equal-means-zero") {
    const template = drawFromBag("u77-zero-value", twoSampleClaimTemplates);
    const scen = buildTwoSampleClaimScenario(template);
    const options = buildDiffMeansZeroValueOptions(scen);

    answers = { diffMeansZeroValueAnswer: { value: options.correct } };
    context = attachAnswers(
      {
        levelName: "7.7a: Equal Means Means 0",
        problemText: "Identify the no-difference benchmark for a difference in means.",
        givenText: `${scen.desc} The parameter of interest is ${scen.differenceLabel}.`,
        optA: options.options[0],
        optB: options.options[1],
        optC: options.options[2],
        optD: options.options[3],
        differenceLabel: scen.differenceLabel,
        pointEstimate: scen.pointEstimateText,
        lower: scen.lowerText,
        upper: scen.upperText
      },
      answers
    );

    scenario = `${scen.desc}\n\nIf the two population means are equal, ${scen.differenceLabel} should equal 0.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l32-zero-plausible-diffmeans") {
    const template = drawFromBag("u77-zero-plausible", twoSampleClaimTemplates);
    const scen = buildTwoSampleClaimScenario(template);
    const plausible = buildDiffMeansZeroPlausibleOptions(scen);

    answers = { diffMeansZeroPlausibleAnswer: { value: plausible.correct } };
    context = attachAnswers(
      {
        levelName: "7.7b: Decide Whether 0 Is Plausible",
        problemText: "Use the interval to judge whether no difference is plausible.",
        givenText: getTwoSampleClaimIntervalText(scen),
        optA: plausible.options[0],
        optB: plausible.options[1],
        optC: plausible.options[2],
        optD: plausible.options[3],
        containsZero: scen.containsZero ? "yes" : "no",
        differenceLabel: scen.differenceLabel
      },
      answers
    );

    scenario = `${scen.desc}\n\nA ${scen.confLevel}% confidence interval for ${scen.differenceLabel} is ${scen.lowerText} to ${scen.upperText} ${scen.units}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l33-justify-diffmeans-claim") {
    const template = drawFromBag("u77-justify", twoSampleClaimTemplates);
    const scen = buildTwoSampleClaimScenario(template);
    const justification = buildDiffMeansClaimJustifyOptions(scen);

    answers = { diffMeansClaimJustifyAnswer: { value: justification.correct } };
    context = attachAnswers(
      {
        levelName: "7.7c: Justify the Claim",
        problemText: "Use the interval to decide whether the claim is supported.",
        givenText: `${getTwoSampleClaimIntervalText(scen)} Does this support the claim that ${scen.claim}?`,
        optA: justification.options[0],
        optB: justification.options[1],
        optC: justification.options[2],
        optD: justification.options[3],
        supportClaim: scen.supportClaim ? "yes" : "no",
        containsZero: scen.containsZero ? "yes" : "no",
        claim: scen.claim,
        differenceLabel: scen.differenceLabel
      },
      answers
    );

    scenario = `${scen.desc}\n\nDoes the interval support the claim that ${scen.claim}?`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l34-state-diffmeans-conclusion") {
    const template = drawFromBag("u77-conclusion", twoSampleClaimTemplates);
    const scen = buildTwoSampleClaimScenario(template);
    const conclusion = buildDiffMeansClaimConclusionOptions(scen);

    answers = { diffMeansClaimConclusionAnswer: { value: conclusion.correct } };
    context = attachAnswers(
      {
        levelName: "7.7d: State the Conclusion Carefully",
        problemText: "Choose the best conclusion statement.",
        givenText: `${getTwoSampleClaimIntervalText(scen)} State the conclusion about the claim that ${scen.claim}.`,
        optA: conclusion.options[0],
        optB: conclusion.options[1],
        optC: conclusion.options[2],
        optD: conclusion.options[3],
        supportClaim: scen.supportClaim ? "yes" : "no",
        claim: scen.claim
      },
      answers
    );

    scenario = `${scen.desc}\n\nState the conclusion about the claim that ${scen.claim}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l35-interpret-diffmeans-confidence-level") {
    const template = drawFromBag("u77-confidence-level", twoSampleClaimTemplates);
    const scen = buildTwoSampleClaimScenario(template);
    const interpretation = buildDiffMeansConfidenceLevelOptions(scen);

    answers = { diffMeansConfidenceLevelAnswer: { value: interpretation.correct } };
    context = attachAnswers(
      {
        levelName: "7.7e: Interpret the Confidence Level",
        problemText: "Interpret the confidence level using repeated random sampling.",
        givenText: `${scen.desc} A ${scen.confLevel}% confidence interval is built for the ${scen.parameter}.`,
        optA: interpretation.options[0],
        optB: interpretation.options[1],
        optC: interpretation.options[2],
        optD: interpretation.options[3],
        confLevel: `${scen.confLevel}`,
        parameter: scen.parameter
      },
      answers
    );

    scenario = `${scen.desc}\n\nInterpret what ${scen.confLevel}% confidence means for the difference in means.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l36-state-diffmeans-null-hypothesis") {
    const template = drawFromBag("u78-null", twoSampleTestSetupTemplates);
    const scen = buildTwoSampleTestSetupScenario(template);
    const hypothesis = buildDiffMeansNullHypothesisOptions(scen);

    answers = { diffMeansNullHypothesisAnswer: { value: hypothesis.correct } };
    context = attachAnswers(
      {
        levelName: "7.8a: State the Null Hypothesis",
        problemText: "Choose the null hypothesis for a test about two population means.",
        givenText: `${scen.desc} ${scen.symbolGuideText} ${scen.questionText}`,
        optA: hypothesis.options[0],
        optB: hypothesis.options[1],
        optC: hypothesis.options[2],
        optD: hypothesis.options[3],
        relation: scen.relation,
        differenceSymbol: scen.differenceSymbol
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.questionText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l37-state-diffmeans-alternative-hypothesis") {
    const template = drawFromBag("u78-alt", twoSampleTestSetupTemplates);
    const scen = buildTwoSampleTestSetupScenario(template);
    const hypothesis = buildDiffMeansAlternativeHypothesisOptions(scen);

    answers = { diffMeansAlternativeHypothesisAnswer: { value: hypothesis.correct } };
    context = attachAnswers(
      {
        levelName: "7.8b: State the Alternative Hypothesis",
        problemText: "Choose the alternative hypothesis that matches the question of interest.",
        givenText: `${scen.desc} ${scen.symbolGuideText} ${scen.questionText}`,
        optA: hypothesis.options[0],
        optB: hypothesis.options[1],
        optC: hypothesis.options[2],
        optD: hypothesis.options[3],
        relation: scen.relation,
        differenceSymbol: scen.differenceSymbol
      },
      answers
    );

    scenario = `${scen.desc}\n\n${scen.questionText}`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l38-choose-diffmeans-alternative-type") {
    const template = drawFromBag("u78-type", twoSampleTestSetupTemplates);
    const scen = buildTwoSampleTestSetupScenario(template);
    const alternativeType = buildDiffMeansAlternativeTypeOptions(scen);

    answers = { diffMeansAlternativeTypeAnswer: { value: alternativeType.correct } };
    context = attachAnswers(
      {
        levelName: "7.8c: Choose One-Sided or Two-Sided",
        problemText: "Decide whether the alternative should be one-sided or two-sided.",
        givenText: `${scen.desc} ${scen.questionText}`,
        optA: alternativeType.options[0],
        optB: alternativeType.options[1],
        optC: alternativeType.options[2],
        optD: alternativeType.options[3],
        relation: scen.relation,
        claimSummary: scen.claimSummary
      },
      answers
    );

    scenario = `${scen.desc}\n\nDecide whether the claim requires a one-sided or two-sided alternative.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l39-reverse-diffmeans-order") {
    const template = drawFromBag("u78-order", oneSidedTwoSampleTestSetupTemplates);
    const scen = buildTwoSampleTestSetupScenario(template);
    const reverse = buildDiffMeansReverseOrderOptions(scen);

    answers = { diffMeansReverseOrderAnswer: { value: reverse.correct } };
    context = attachAnswers(
      {
        levelName: "7.8d: Reverse the Order Carefully",
        problemText: "Keep the claim the same while reversing the subtraction order.",
        givenText: `${scen.desc} ${scen.symbolGuideText} The original alternative is ${HA}: ${scen.differenceSymbol} ${scen.relationSymbol} 0. Now rewrite it using ${scen.reversedDifferenceSymbol}.`,
        optA: reverse.options[0],
        optB: reverse.options[1],
        optC: reverse.options[2],
        optD: reverse.options[3],
        relation: scen.relation,
        originalAlternativeText: reverse.originalOrderText,
        reverseSameSignText: reverse.sameSignText
      },
      answers
    );

    scenario = `${scen.desc}\n\nRewrite the one-sided alternative using ${scen.reversedDifferenceSymbol} instead of ${scen.differenceSymbol}.`;
    return { context, graphConfig, answers, scenario };
  }

  if (modeId === "l40-define-diffmeans-parameters") {
    const template = drawFromBag("u78-parameters", twoSampleTestSetupTemplates);
    const scen = buildTwoSampleTestSetupScenario(template);
    const definition = buildDiffMeansParameterDefinitionOptions(scen);

    answers = { diffMeansParameterDefinitionAnswer: { value: definition.correct } };
    context = attachAnswers(
      {
        levelName: "7.8e: Define the Parameters",
        problemText: "Define the population means used in the hypotheses.",
        givenText: `${scen.desc} The hypotheses will use ${scen.mu1Symbol} and ${scen.mu2Symbol}.`,
        optA: definition.options[0],
        optB: definition.options[1],
        optC: definition.options[2],
        optD: definition.options[3],
        swappedDefinitionText: definition.swappedDefinitionText
      },
      answers
    );

    scenario = `${scen.desc}\n\nDefine the parameters used in the two-sample test.`;
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
