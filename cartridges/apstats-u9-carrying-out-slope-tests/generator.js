function hashSeed(input) {
  const text = String(
    input == null ? "apstats-u9-carrying-out-slope-tests" : input
  );
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let state = hashSeed(seed) || 1;
  return function rng() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle(items, rng) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function drawFromShuffleBag(items, bagKey, bagState, rng) {
  let bag = Array.isArray(bagState[bagKey]) ? bagState[bagKey].slice() : [];
  if (bag.length === 0) {
    bag = shuffle(
      items.map(function mapItem(_, index) {
        return index;
      }),
      rng
    );
  }

  const nextIndex = bag.shift();
  bagState[bagKey] = bag;
  return items[nextIndex];
}

function roundTo(value, places) {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

function formatNumber(value, places) {
  const rounded = roundTo(value, places);
  let text = rounded.toFixed(places);
  if (text.indexOf(".") >= 0) {
    text = text.replace(/0+$/, "").replace(/\.$/, "");
  }
  return text;
}

function formatPValue(value) {
  if (value < 0.0001) {
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exponent);
    return formatNumber(mantissa, 2) + " x 10^" + exponent;
  }

  if (value < 0.001) {
    return formatNumber(value, 4);
  }

  return formatNumber(value, 3);
}

function uniqueOptions(options) {
  const seen = {};
  return options.filter(function filterOption(option) {
    if (seen[option.text]) {
      return false;
    }
    seen[option.text] = true;
    return true;
  });
}

function makeOption(id, text, acceptedResponses) {
  return {
    id: id,
    text: text,
    acceptedResponses: acceptedResponses || []
  };
}

function collectAcceptedResponses(option) {
  const values = [option.id, option.text];
  if (Array.isArray(option.acceptedResponses)) {
    return values.concat(option.acceptedResponses);
  }
  return values;
}

function buildChoiceProblem(config) {
  const context = {
    modeId: config.modeId,
    shuffleBags: config.bagState,
    answerKey: {},
    acceptedResponses: {}
  };

  context.answerKey[config.fieldId] = config.correct.id;
  context.acceptedResponses[config.fieldId] = collectAcceptedResponses(
    config.correct
  );

  if (Array.isArray(config.partialOptions) && config.partialOptions.length > 0) {
    context.partialResponses = {};
    context.partialResponses[config.fieldId] = config.partialOptions.reduce(
      function reducePartials(all, option) {
        return all.concat(collectAcceptedResponses(option));
      },
      []
    );
  }

  const shuffledOptions = shuffle(uniqueOptions(config.options), config.rng);
  const optionKeys = ["optA", "optB", "optC", "optD", "optE", "optF"];
  shuffledOptions.forEach(function assignOptionKey(option, index) {
    if (optionKeys[index]) {
      context[optionKeys[index]] = option.text;
    }
  });

  return {
    modeId: config.modeId,
    prompt: config.promptLines.join("\n"),
    scenario: config.promptLines.join("\n").replace(/\n/g, "<br>"),
    data: {
      options: shuffledOptions
    },
    context: context
  };
}

function buildAttendanceCase(rng) {
  const b = randomInt(rng, 50, 72) / 100;
  const se = randomInt(rng, 55, 78) / 1000;
  return {
    key: "attendance",
    sampleSize: 11,
    alpha: 0.01,
    alternative: "greater",
    b: roundTo(b, 2),
    se: roundTo(se, 3),
    bPlaces: 2,
    sePlaces: 3,
    setup:
      "Researchers took a random sample of 11 Texas Algebra 1 students to test whether there is a positive linear relationship between percent attendance and state test score.",
    nullText:
      "there is no linear relationship between state test score and percent attendance for Texas Algebra 1 students",
    alternativeText:
      "there is a positive linear relationship between state test score and percent attendance for Texas Algebra 1 students",
    dfText: "9"
  };
}

function buildDrinkCase(rng) {
  const b = randomInt(rng, 1350, 1780) / 1000;
  const se = randomInt(rng, 150, 230) / 1000;
  return {
    key: "drink",
    sampleSize: 25,
    alpha: 0.05,
    alternative: "two-sided",
    b: roundTo(b, 3),
    se: roundTo(se, 3),
    bPlaces: 3,
    sePlaces: 3,
    setup:
      "Students ran 25 trials on a bumpy dirt road to test whether there is a linear relationship between the car's speed and the amount of drink spilled.",
    nullText:
      "there is no linear relationship between the car's speed on a bumpy dirt road and the amount of drink spilled",
    alternativeText:
      "there is a linear relationship between the car's speed on a bumpy dirt road and the amount of drink spilled",
    dfText: "23"
  };
}

function buildPhdNonCompleteCase(rng) {
  const b = -randomInt(rng, 2900, 4100) / 1000;
  const se = randomInt(rng, 850, 1200) / 1000;
  return {
    key: "phd-noncomplete",
    sampleSize: 7,
    alpha: 0.01,
    alternative: "two-sided",
    b: roundTo(b, 3),
    se: roundTo(se, 3),
    bPlaces: 3,
    sePlaces: 3,
    setup:
      "For students who did not complete the statistics Ph.D. program, a random sample of 7 students is used to test whether there is a linear relationship between GPA and mean number of credit hours per semester.",
    nullText:
      "there is no linear relationship between GPA and mean number of credit hours per semester for students at this university who did not complete the statistics Ph.D. program",
    alternativeText:
      "there is a linear relationship between GPA and mean number of credit hours per semester for students at this university who did not complete the statistics Ph.D. program",
    dfText: "5"
  };
}

function buildSlopeCase(caseKey, rng) {
  if (caseKey === "attendance") {
    return buildAttendanceCase(rng);
  }

  if (caseKey === "drink") {
    return buildDrinkCase(rng);
  }

  return buildPhdNonCompleteCase(rng);
}

function buildStatisticMode(rng, bagState) {
  const caseKey = drawFromShuffleBag(
    ["attendance", "drink", "phd-noncomplete"],
    "l95-statistic-scenarios",
    bagState,
    rng
  );
  const scenario = buildSlopeCase(caseKey, rng);
  const tValue = roundTo(scenario.b / scenario.se, 2);
  const inverseValue = roundTo(scenario.se / scenario.b, 2);
  const subtractValue = roundTo(scenario.b - scenario.se, 2);
  const oppositeValue = roundTo(-tValue, 2);
  const bText = formatNumber(scenario.b, scenario.bPlaces);
  const seText = formatNumber(scenario.se, scenario.sePlaces);
  const tText = formatNumber(tValue, 2);
  const inverseText = formatNumber(inverseValue, 2);
  const subtractText = formatNumber(subtractValue, 2);
  const oppositeText = formatNumber(oppositeValue, 2);

  const correct = makeOption(
    "correct-test-statistic",
    "t = (" + bText + " - 0) / " + seText + " = " + tText
  );
  const signError = makeOption(
    "sign-error-test-statistic",
    "t = (0 - " + bText + ") / " + seText + " = " + oppositeText
  );
  const inverse = makeOption(
    "inverse-test-statistic",
    "t = " + seText + " / (" + bText + " - 0) = " + inverseText
  );
  const subtract = makeOption(
    "subtract-test-statistic",
    "t = (" + bText + " - 0) - " + seText + " = " + subtractText
  );

  return buildChoiceProblem({
    modeId: "l95-calculate-test-statistic",
    fieldId: "test_statistic_choice",
    promptLines: [
      scenario.setup,
      "Computer output gives b = " + bText + " and SE_b = " + seText + ".",
      "Which calculation gives the correct standardized test statistic for testing H0: beta = 0?"
    ],
    options: [correct, signError, inverse, subtract],
    correct: correct,
    partialOptions: [signError],
    bagState: bagState,
    rng: rng
  });
}

function buildPValueSetupMode(rng, bagState) {
  const caseKey = drawFromShuffleBag(
    ["attendance", "drink", "phd-noncomplete"],
    "l95-pvalue-scenarios",
    bagState,
    rng
  );
  const scenario = buildSlopeCase(caseKey, rng);
  const tValue = roundTo(scenario.b / scenario.se, 2);
  const tText = formatNumber(tValue, 2);
  const absoluteText = formatNumber(Math.abs(tValue), 2);
  let correct;
  let partial;
  let oppositeTail;
  let wrongDf;

  if (scenario.alternative === "greater") {
    correct = makeOption(
      "correct-pvalue-greater",
      "P(t >= " + tText + ") with df = " + scenario.dfText
    );
    partial = makeOption(
      "two-sided-pvalue-greater",
      "P(t <= -" + tText + ") + P(t >= " + tText + ") with df = " + scenario.dfText
    );
    oppositeTail = makeOption(
      "left-tail-pvalue-greater",
      "P(t <= -" + tText + ") with df = " + scenario.dfText
    );
    wrongDf = makeOption(
      "wrong-df-pvalue-greater",
      "P(t >= " + tText + ") with df = " + scenario.sampleSize
    );
  } else if (tValue >= 0) {
    correct = makeOption(
      "correct-pvalue-two-sided-positive",
      "P(t <= -" + tText + ") + P(t >= " + tText + ") with df = " + scenario.dfText
    );
    partial = makeOption(
      "one-tail-pvalue-two-sided-positive",
      "P(t >= " + tText + ") with df = " + scenario.dfText
    );
    oppositeTail = makeOption(
      "left-tail-only-two-sided-positive",
      "P(t <= -" + tText + ") with df = " + scenario.dfText
    );
    wrongDf = makeOption(
      "wrong-df-two-sided-positive",
      "P(t <= -" + tText + ") + P(t >= " + tText + ") with df = " + scenario.sampleSize
    );
  } else {
    correct = makeOption(
      "correct-pvalue-two-sided-negative",
      "P(t <= " + tText + ") + P(t >= " + absoluteText + ") with df = " + scenario.dfText
    );
    partial = makeOption(
      "one-tail-pvalue-two-sided-negative",
      "P(t <= " + tText + ") with df = " + scenario.dfText
    );
    oppositeTail = makeOption(
      "right-tail-only-two-sided-negative",
      "P(t >= " + absoluteText + ") with df = " + scenario.dfText
    );
    wrongDf = makeOption(
      "wrong-df-two-sided-negative",
      "P(t <= " + tText + ") + P(t >= " + absoluteText + ") with df = " + scenario.sampleSize
    );
  }

  return buildChoiceProblem({
    modeId: "l95-set-up-p-value",
    fieldId: "p_value_setup_choice",
    promptLines: [
      scenario.setup,
      "The slope test produced t = " + tText + " from a sample of size " + scenario.sampleSize + ".",
      "Which setup matches the correct p-value calculation?"
    ],
    options: [correct, partial, oppositeTail, wrongDf],
    correct: correct,
    partialOptions: [partial, wrongDf],
    bagState: bagState,
    rng: rng
  });
}

function buildInterpretationMode(rng, bagState) {
  const caseKey = drawFromShuffleBag(
    ["attendance", "drink"],
    "l95-interpretation-scenarios",
    bagState,
    rng
  );
  let setup;
  let nullText;
  let slopeText;
  let pValue;
  let sampleText;
  let correct;
  let partial;

  if (caseKey === "attendance") {
    const b = formatNumber(randomInt(rng, 50, 72) / 100, 2);
    pValue = randomInt(rng, 1, 9) / 10000;
    setup =
      "Researchers used a random sample of 11 Texas Algebra 1 students to test for a positive linear relationship between percent attendance and state test score.";
    nullText =
      "there is no linear relationship between state test score and percent attendance for Texas Algebra 1 students";
    slopeText = "a sample regression line with a slope of " + b + " or greater";
    sampleText = "in a random sample of 11 Texas Algebra 1 students";
    correct = makeOption(
      "correct-interpretation-attendance",
      "Assuming " + nullText + ", there is a " + formatPValue(pValue) + " probability of getting " + slopeText + " by chance alone " + sampleText + "."
    );
    partial = makeOption(
      "partial-interpretation-attendance",
      "Assuming " + nullText + ", there is a " + formatPValue(pValue) + " probability of getting a sample regression line with a slope of " + b + " by chance alone " + sampleText + "."
    );
  } else {
    const b = formatNumber(randomInt(rng, 1400, 1760) / 1000, 3);
    pValue = randomInt(rng, 12, 48) / 1000000000;
    setup =
      "Students used 25 trials to test whether there is a linear relationship between the car's speed on a bumpy dirt road and the amount of drink spilled.";
    nullText =
      "there is no linear relationship between the car's speed on a bumpy dirt road and the amount of drink spilled";
    slopeText =
      "a sample regression line with a slope as extreme as or more extreme than " +
      b +
      " in either direction";
    sampleText = "in the 25 trials";
    correct = makeOption(
      "correct-interpretation-drink",
      "Assuming " + nullText + ", there is a " + formatPValue(pValue) + " probability of getting " + slopeText + " by chance alone " + sampleText + "."
    );
    partial = makeOption(
      "partial-interpretation-drink",
      "Assuming " + nullText + ", there is a " + formatPValue(pValue) + " probability of getting a sample regression line with a slope of " + b + " by chance alone " + sampleText + "."
    );
  }

  const wrongNull = makeOption(
    "wrong-null-interpretation",
    "There is a " + formatPValue(pValue) + " probability that the null hypothesis is true."
  );
  const wrongAssumption = makeOption(
    "wrong-assumption-interpretation",
    "Assuming the alternative hypothesis is true, there is a " + formatPValue(pValue) + " probability of getting this sample slope."
  );

  return buildChoiceProblem({
    modeId: "l95-interpret-p-value",
    fieldId: "p_value_interpretation_choice",
    promptLines: [
      setup,
      "The test produced p-value = " + formatPValue(pValue) + ".",
      "Which interpretation is correct?"
    ],
    options: [correct, partial, wrongNull, wrongAssumption],
    correct: correct,
    partialOptions: [partial],
    bagState: bagState,
    rng: rng
  });
}

function buildConclusionMode(rng, bagState) {
  const caseKey = drawFromShuffleBag(
    ["attendance-reject", "drink-reject", "phd-fail"],
    "l95-conclusion-scenarios",
    bagState,
    rng
  );
  let setup;
  let pValue;
  let alpha;
  let alternativeText;
  let correct;
  let partial;
  let opposite;
  let wrongComparison;

  if (caseKey === "attendance-reject") {
    pValue = randomInt(rng, 1, 9) / 10000;
    alpha = 0.01;
    setup =
      "Researchers want to know whether percent attendance and state test score have a positive linear relationship for Texas Algebra 1 students.";
    alternativeText =
      "there is a positive linear relationship between state test score and percent attendance for Texas Algebra 1 students";
    correct = makeOption(
      "correct-conclusion-attendance",
      "Because the p-value of " + formatPValue(pValue) + " is less than or equal to alpha = 0.01, reject H0. There is convincing statistical evidence that " + alternativeText + "."
    );
    partial = makeOption(
      "partial-conclusion-attendance",
      "Because the p-value of " + formatPValue(pValue) + " is less than or equal to alpha = 0.01, reject H0. This proves that " + alternativeText + "."
    );
    opposite = makeOption(
      "opposite-conclusion-attendance",
      "Because the p-value of " + formatPValue(pValue) + " is less than or equal to alpha = 0.01, fail to reject H0. There is not convincing statistical evidence that " + alternativeText + "."
    );
    wrongComparison = makeOption(
      "wrong-comparison-attendance",
      "Because the p-value of " + formatPValue(pValue) + " is greater than alpha = 0.01, reject H0. There is convincing statistical evidence that " + alternativeText + "."
    );
  } else if (caseKey === "drink-reject") {
    pValue = randomInt(rng, 12, 48) / 1000000000;
    alpha = 0.05;
    setup =
      "Students want to know whether car speed on a bumpy dirt road and amount of drink spilled have a linear relationship.";
    alternativeText =
      "there is a linear relationship between the car's speed on a bumpy dirt road and the amount of drink spilled";
    correct = makeOption(
      "correct-conclusion-drink",
      "Because the p-value of " + formatPValue(pValue) + " is less than or equal to alpha = 0.05, reject H0. There is convincing statistical evidence that " + alternativeText + "."
    );
    partial = makeOption(
      "partial-conclusion-drink",
      "Because the p-value of " + formatPValue(pValue) + " is less than or equal to alpha = 0.05, reject H0. This proves that " + alternativeText + "."
    );
    opposite = makeOption(
      "opposite-conclusion-drink",
      "Because the p-value of " + formatPValue(pValue) + " is less than or equal to alpha = 0.05, fail to reject H0. There is not convincing statistical evidence that " + alternativeText + "."
    );
    wrongComparison = makeOption(
      "wrong-comparison-drink",
      "Because the p-value of " + formatPValue(pValue) + " is greater than alpha = 0.05, reject H0. There is convincing statistical evidence that " + alternativeText + "."
    );
  } else {
    pValue = randomInt(rng, 12, 30) / 1000;
    alpha = 0.01;
    setup =
      "For students who did not complete the statistics Ph.D. program, researchers test whether GPA and mean number of credit hours per semester have a linear relationship.";
    alternativeText =
      "there is a linear relationship between GPA and mean number of credit hours per semester for students at this university who did not complete the statistics Ph.D. program";
    correct = makeOption(
      "correct-conclusion-phd",
      "Because the p-value of " + formatPValue(pValue) + " is greater than alpha = 0.01, fail to reject H0. There is not convincing statistical evidence that " + alternativeText + "."
    );
    partial = makeOption(
      "partial-conclusion-phd",
      "Because the p-value of " + formatPValue(pValue) + " is greater than alpha = 0.01, accept H0. This means there is no linear relationship."
    );
    opposite = makeOption(
      "opposite-conclusion-phd",
      "Because the p-value of " + formatPValue(pValue) + " is greater than alpha = 0.01, reject H0. There is convincing statistical evidence that " + alternativeText + "."
    );
    wrongComparison = makeOption(
      "wrong-comparison-phd",
      "Because the p-value of " + formatPValue(pValue) + " is less than or equal to alpha = 0.01, fail to reject H0. There is not convincing statistical evidence that " + alternativeText + "."
    );
  }

  return buildChoiceProblem({
    modeId: "l95-state-conclusion",
    fieldId: "conclusion_choice",
    promptLines: [
      setup,
      "A t-test for slope produced p-value = " + formatPValue(pValue) + ".",
      "Use alpha = " + formatNumber(alpha, 2) + ". Which conclusion is correct?"
    ],
    options: [correct, partial, opposite, wrongComparison],
    correct: correct,
    partialOptions: [partial],
    bagState: bagState,
    rng: rng
  });
}

function buildStrengthComparisonMode(rng, bagState) {
  const firstIsCompleted = drawFromShuffleBag(
    [true, false],
    "l95-strength-order",
    bagState,
    rng
  );
  const completedT = -roundTo(randomInt(rng, 500, 640) / 100, 2);
  const nonCompletedT = -roundTo(randomInt(rng, 290, 390) / 100, 2);
  const completedP = randomInt(rng, 2, 9) / 10000;
  const nonCompletedP = randomInt(rng, 12, 30) / 1000;
  const firstLabel = firstIsCompleted
    ? "Students who successfully completed the Ph.D. program"
    : "Students who did not complete the Ph.D. program";
  const secondLabel = firstIsCompleted
    ? "Students who did not complete the Ph.D. program"
    : "Students who successfully completed the Ph.D. program";
  const firstT = firstIsCompleted ? completedT : nonCompletedT;
  const secondT = firstIsCompleted ? nonCompletedT : completedT;
  const firstP = firstIsCompleted ? completedP : nonCompletedP;
  const secondP = firstIsCompleted ? nonCompletedP : completedP;
  const strongerLabel = completedP < nonCompletedP
    ? "Students who successfully completed the Ph.D. program"
    : "Students who did not complete the Ph.D. program";

  const correct = makeOption(
    "correct-strength-comparison",
    strongerLabel + " provide stronger evidence of a linear relationship because the p-value is smaller and the t statistic is farther from 0."
  );
  const wrongCloserToZero = makeOption(
    "wrong-closer-to-zero-strength",
    "Students who did not complete the Ph.D. program provide stronger evidence because their t statistic is closer to 0."
  );
  const wrongEqual = makeOption(
    "wrong-equal-strength",
    "The evidence is equally strong because both tests are about beta = 0."
  );
  const wrongNeedSlope = makeOption(
    "wrong-need-slope-strength",
    "No comparison is possible unless the two slope estimates are exactly the same."
  );

  return buildChoiceProblem({
    modeId: "l95-compare-evidence-strength",
    fieldId: "strength_comparison_choice",
    promptLines: [
      "A statistics department runs two separate two-sided t-tests for slope to compare GPA with mean credit hours per semester.",
      firstLabel + ": t = " + formatNumber(firstT, 2) + ", p-value = " + formatPValue(firstP) + ".",
      secondLabel + ": t = " + formatNumber(secondT, 2) + ", p-value = " + formatPValue(secondP) + ".",
      "Which statement best compares the evidence for a significant linear relationship?"
    ],
    options: [correct, wrongCloserToZero, wrongEqual, wrongNeedSlope],
    correct: correct,
    partialOptions: [],
    bagState: bagState,
    rng: rng
  });
}

function generateProblem(modeId, context, mode) {
  const safeContext = context && typeof context === "object" ? context : {};
  const bagState = Object.assign({}, safeContext.shuffleBags || {});
  const rng = createRng(
    [
      safeContext.seed || "default-seed",
      modeId,
      mode && mode.name ? mode.name : ""
    ].join("|")
  );

  switch (modeId) {
    case "l95-calculate-test-statistic":
      return buildStatisticMode(rng, bagState);
    case "l95-set-up-p-value":
      return buildPValueSetupMode(rng, bagState);
    case "l95-interpret-p-value":
      return buildInterpretationMode(rng, bagState);
    case "l95-state-conclusion":
      return buildConclusionMode(rng, bagState);
    case "l95-compare-evidence-strength":
      return buildStrengthComparisonMode(rng, bagState);
    default:
      throw new Error("Unsupported modeId: " + modeId);
  }
}

export { generateProblem };
