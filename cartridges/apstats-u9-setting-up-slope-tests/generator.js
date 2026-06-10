const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const NULL_PROFILES = [
  {
    key: "attendance",
    sampleSize: 11,
    promptLines: [
      "Researchers collected data on percent of school days attended and number of questions answered correctly on the state Algebra 1 test from a random sample of 11 Texas Algebra 1 students.",
      "They want to test whether there is a positive linear relationship between attendance and test score."
    ],
    parameterSentence:
      "the slope of the population regression line for predicting number of questions answered correctly on the state Algebra 1 test from percent of school days attended for all Texas Algebra 1 students",
    yKeywords: [
      "questions answered correctly",
      "state algebra 1 test",
      "test score"
    ],
    xKeywords: ["percent of school days attended", "attendance"],
    populationKeywords: ["texas algebra 1 students", "texas algebra 1"]
  },
  {
    key: "drink",
    sampleSize: 25,
    promptLines: [
      "Students ran 25 trials on a bumpy dirt road, recording the car's speed in miles per hour and the amount of drink spilled in milliliters.",
      "They want to test whether there is a linear relationship between speed and spill amount."
    ],
    parameterSentence:
      "the slope of the population regression line for predicting amount of drink spilled in milliliters from the car's speed in miles per hour on a bumpy dirt road",
    yKeywords: ["amount of drink spilled", "spilled", "milliliters"],
    xKeywords: ["car's speed", "speed", "miles per hour"],
    populationKeywords: ["bumpy dirt road", "trials"]
  }
];

const ALTERNATIVE_PROFILES = [
  {
    key: "attendance-positive",
    sampleSize: 11,
    alpha: "0.01",
    correctAlt: "greater",
    sidedness: "one-sided",
    scenarioText:
      "For a random sample of 11 Texas Algebra 1 students, researchers want convincing evidence at alpha = 0.01 of a positive linear relationship between percent attendance and state test score."
  },
  {
    key: "drink-two-sided",
    sampleSize: 25,
    alpha: "0.05",
    correctAlt: "not-equal",
    sidedness: "two-sided",
    scenarioText:
      "In 25 trials on a bumpy dirt road, students want to know at alpha = 0.05 whether there is a linear relationship between the car's speed and the amount of drink spilled, without specifying increase or decrease beforehand."
  },
  {
    key: "generic-negative",
    sampleSize: 18,
    alpha: "0.05",
    correctAlt: "less",
    sidedness: "one-sided",
    scenarioText:
      "Before collecting data, researchers state that they expect y to decrease as x increases and want to test for a negative linear relationship at alpha = 0.05."
  }
];

const PROCEDURE_OPTIONS = [
  {
    key: "t-test-slope",
    text: "t-test for the slope of a population regression line"
  },
  {
    key: "t-interval-slope",
    text: "t-interval for the slope of a population regression line"
  },
  {
    key: "chi-square",
    text: "chi-square test"
  },
  {
    key: "two-sample-t",
    text: "two-sample t-test for a difference in means"
  }
];

const CONDITION_PROFILES = [
  {
    key: "all-met",
    verdict: "all-met",
    sampleSize: 11,
    intro:
      "A student is deciding whether a t-test for slope is appropriate for a random sample of 11 Texas Algebra 1 students.",
    evidence: [
      "The scatterplot shows a moderately strong positive linear pattern.",
      "The residual plot has fairly random scatter about 0 with no obvious curved pattern.",
      "The residuals are similar in size across the x-values.",
      "A dotplot of residuals shows no strong skewness or outliers.",
      "The data came from a random sample, and 11 is far less than 10% of all Texas Algebra 1 students."
    ]
  },
  {
    key: "linearity-fails",
    verdict: "linearity",
    sampleSize: 25,
    intro:
      "A student is deciding whether a t-test for slope is appropriate for a data set with 25 observations.",
    evidence: [
      "The scatterplot bends upward instead of following a straight-line pattern.",
      "The residual plot shows a clear curved pattern.",
      "The data came from a random sample, and the residuals do not show strong skewness."
    ]
  },
  {
    key: "spread-fails",
    verdict: "spread",
    sampleSize: 25,
    intro:
      "A student is deciding whether a t-test for slope is appropriate for a data set with 25 observations.",
    evidence: [
      "The scatterplot looks roughly linear overall.",
      "The residual plot shows a fan shape, with residuals much larger for larger x-values.",
      "The data came from a random sample, and the residuals are not strongly skewed."
    ]
  },
  {
    key: "normality-fails",
    verdict: "normality",
    sampleSize: 11,
    intro:
      "A student is deciding whether a t-test for slope is appropriate for a random sample of 11 observations.",
    evidence: [
      "The scatterplot looks roughly linear and the residual plot does not show a clear curved pattern.",
      "The residuals have similar size across the x-values.",
      "A dotplot of residuals is strongly right-skewed with a large outlier."
    ]
  },
  {
    key: "independence-fails",
    verdict: "independence",
    sampleSize: 20,
    intro:
      "A student is deciding whether a t-test for slope is appropriate for a data set with 20 observations.",
    evidence: [
      "The scatterplot looks roughly linear and the residuals show no obvious curved pattern.",
      "The residuals appear to have similar spread and no extreme outliers.",
      "The data came from students who volunteered after class, not from a random sample or a randomized experiment."
    ]
  }
];

function generateProblem(modeId, context = {}, mode = {}) {
  const sharedState = context && typeof context === "object" ? context : {};
  const rand = getRandom(sharedState);
  const builders = {
    "l94-state-null-hypothesis": buildNullHypothesisProblem,
    "l94-choose-alternative-hypothesis": buildAlternativeHypothesisProblem,
    "l94-identify-test-procedure": buildProcedureProblem,
    "l94-check-slope-test-conditions": buildConditionProblem
  };

  if (!builders[modeId]) {
    throw new Error(`Unsupported modeId: ${modeId}`);
  }

  const generated = builders[modeId](sharedState, rand, mode);
  return {
    modeId,
    prompt: generated.prompt,
    stem: generated.prompt,
    question: generated.prompt,
    scenario: generated.prompt.replace(/\n/g, "<br>"),
    context: generated.context
  };
}

function buildNullHypothesisProblem(sharedState, rand) {
  const profile = nextFromShuffleBag(
    sharedState,
    "l94-null-profile",
    NULL_PROFILES,
    rand
  );

  const prompt = [
    ...profile.promptLines,
    "",
    "State the null hypothesis for a test about the slope, and define beta in context."
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        null_hypothesis: buildNullRule(),
        parameter_definition: buildParameterRule(profile)
      }
    }
  };
}

function buildAlternativeHypothesisProblem(sharedState, rand) {
  const profile = nextFromShuffleBag(
    sharedState,
    "l94-alternative-profile",
    ALTERNATIVE_PROFILES,
    rand
  );

  const options = assignLetters(
    [
      { key: "greater", text: "Ha: beta > 0" },
      { key: "less", text: "Ha: beta < 0" },
      { key: "not-equal", text: "Ha: beta != 0" },
      { key: "equal", text: "Ha: beta = 0" }
    ],
    rand
  );

  const correctChoice = options.find(
    (choice) => choice.key === profile.correctAlt
  );

  const prompt = [
    profile.scenarioText,
    "",
    "Which alternative hypothesis is appropriate?",
    ...options.map((choice) => `${choice.letter}. ${choice.text}`),
    "",
    "Then state whether the alternative is one-sided or two-sided."
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        alternative_choice: buildAlternativeChoiceRule(
          correctChoice,
          profile.correctAlt
        ),
        sidedness_label: buildSidednessRule(profile.sidedness)
      }
    }
  };
}

function buildProcedureProblem(sharedState, rand) {
  const profile = nextFromShuffleBag(
    sharedState,
    "l94-procedure-profile",
    ALTERNATIVE_PROFILES,
    rand
  );
  const options = assignLetters(PROCEDURE_OPTIONS, rand);
  const correctChoice = options.find((choice) => choice.key === "t-test-slope");
  const alternativeText = getAlternativeText(profile.correctAlt);

  const prompt = [
    `A significance test is set up with H0: beta = 0 and ${alternativeText}.`,
    `The study uses ${profile.sampleSize} observations and a significance level of alpha = ${profile.alpha}.`,
    "",
    "Which significance test procedure should be used?",
    ...options.map((choice) => `${choice.letter}. ${choice.text}`)
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        test_procedure: buildProcedureRule(correctChoice)
      }
    }
  };
}

function buildConditionProblem(sharedState, rand) {
  const profile = nextFromShuffleBag(
    sharedState,
    "l94-condition-profile",
    CONDITION_PROFILES,
    rand
  );

  const options = assignLetters(
    [
      { key: "all-met", text: "All conditions are reasonably satisfied." },
      { key: "linearity", text: "The linearity condition is not supported." },
      {
        key: "spread",
        text: "The equal spread condition is not supported."
      },
      {
        key: "normality",
        text: "The normality condition is not supported."
      },
      {
        key: "independence",
        text: "The independence condition is not supported."
      }
    ],
    rand
  );

  const correctChoice = options.find((choice) => choice.key === profile.verdict);
  const prompt = [
    profile.intro,
    "",
    "Evidence:",
    ...profile.evidence.map((line) => `- ${line}`),
    "",
    "Which conclusion is best?",
    ...options.map((choice) => `${choice.letter}. ${choice.text}`),
    "",
    "Then briefly explain your decision."
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        condition_verdict: buildConditionVerdictRule(
          correctChoice,
          profile.verdict
        ),
        condition_explanation: buildConditionExplanationRule(profile)
      }
    }
  };
}

function buildNullRule() {
  return {
    type: "choiceText",
    aliases: [
      "h0: beta = 0",
      "h0 beta = 0",
      "beta = 0",
      "the null hypothesis is beta = 0",
      "there is no linear relationship",
      "no linear relationship"
    ],
    keywordSets: [
      ["h0", "beta", "0"],
      ["null", "beta", "0"],
      ["no", "linear", "relationship"]
    ],
    partialKeywords: [["beta", "0"], ["linear", "relationship"]],
    feedback:
      "State the null as H0: beta = 0, which represents no linear relationship."
  };
}

function buildParameterRule(profile) {
  return {
    type: "choiceText",
    aliases: [
      `beta is ${profile.parameterSentence}`,
      `beta is the slope of the true regression line ${profile.parameterSentence.replace(
        "the slope of the population regression line ",
        ""
      )}`
    ],
    keywordSets: [
      [
        "beta",
        "slope",
        "population regression line",
        profile.yKeywords[0],
        profile.xKeywords[0]
      ],
      [
        "slope",
        profile.yKeywords[0],
        profile.xKeywords[1],
        profile.populationKeywords[0]
      ]
    ],
    partialKeywords: [
      ["slope", profile.yKeywords[0], profile.xKeywords[0]],
      ["slope", "regression", "line"],
      [profile.yKeywords[0], profile.xKeywords[0]]
    ],
    feedback:
      `Define beta as the slope of the population regression line for predicting ${profile.yKeywords[0]} from ${profile.xKeywords[0]} in context.`
  };
}

function buildAlternativeChoiceRule(correctChoice, correctAlt) {
  const aliasMap = {
    greater: ["ha: beta > 0", "ha beta > 0", "beta > 0"],
    less: ["ha: beta < 0", "ha beta < 0", "beta < 0"],
    "not-equal": [
      "ha: beta != 0",
      "ha beta != 0",
      "beta != 0",
      "beta not equal to 0"
    ]
  };

  return {
    type: "choiceText",
    accepted: [correctChoice.letter],
    aliases: aliasMap[correctAlt],
    partialKeywords: [["beta", "0"]],
    feedback:
      "Choose beta > 0 for a positive relationship, beta < 0 for a negative relationship, or beta != 0 for any linear relationship."
  };
}

function buildSidednessRule(sidedness) {
  if (sidedness === "one-sided") {
    return {
      type: "choiceText",
      aliases: ["one-sided", "one sided"],
      partialKeywords: [["one"]],
      feedback:
        "A greater-than or less-than alternative is one-sided."
    };
  }

  return {
    type: "choiceText",
    aliases: ["two-sided", "two sided"],
    partialKeywords: [["two"]],
    feedback: "A not-equal alternative is two-sided."
  };
}

function buildProcedureRule(correctChoice) {
  return {
    type: "choiceText",
    accepted: [correctChoice.letter],
    aliases: [
      "t-test for the slope of a population regression line",
      "t test for the slope of a population regression line",
      "t-test for slope",
      "t test for slope"
    ],
    partialKeywords: [["t-test"], ["slope"]],
    feedback:
      "For a significance test about the slope of a population regression line, use a t-test for slope."
  };
}

function buildConditionVerdictRule(correctChoice, verdict) {
  const aliasMap = {
    "all-met": [
      "all conditions are reasonably satisfied",
      "all conditions are met"
    ],
    linearity: ["the linearity condition is not supported", "linearity fails"],
    spread: [
      "the equal spread condition is not supported",
      "the standard deviation condition is not supported",
      "equal spread fails"
    ],
    normality: [
      "the normality condition is not supported",
      "normality fails"
    ],
    independence: [
      "the independence condition is not supported",
      "independence fails"
    ]
  };

  return {
    type: "choiceText",
    accepted: [correctChoice.letter],
    aliases: aliasMap[verdict],
    partialKeywords: [["condition"]],
    feedback:
      "Use the evidence to decide whether all conditions are met or whether linearity, equal spread, normality, or independence is the issue."
  };
}

function buildConditionExplanationRule(profile) {
  if (profile.verdict === "all-met") {
    return {
      type: "choiceText",
      aliases: [
        "the scatterplot is linear, the residuals show random scatter with similar spread, the residuals show no strong skewness or outliers, and the data came from a random sample so the conditions are met",
        "the relationship looks linear, the residual plot is random, the spread is similar, the residuals look roughly normal, and independence is supported by the random sample"
      ],
      keywordSets: [
        ["linear", "random scatter", "similar spread", "random sample"],
        ["linear", "residual", "outliers", "random sample"]
      ],
      partialKeywords: [
        ["all", "conditions", "met"],
        ["linear", "random sample"],
        ["similar", "spread"]
      ],
      feedback:
        "Support the decision by noting linearity, similar spread, no strong skewness or outliers in the residuals, and independence from random sampling."
    };
  }

  if (profile.verdict === "linearity") {
    return {
      type: "choiceText",
      aliases: [
        "the residual plot has a curved pattern so the linearity condition is not met",
        "the relationship is not linear because the scatterplot bends and the residual plot is curved"
      ],
      keywordSets: [
        ["curved pattern", "residual"],
        ["not linear", "curved"]
      ],
      partialKeywords: [["curved"], ["linearity"]],
      feedback:
        "Explain that the scatterplot and residual plot show curvature, so linearity is not supported."
    };
  }

  if (profile.verdict === "spread") {
    return {
      type: "choiceText",
      aliases: [
        "the residuals fan out so the spread is not constant",
        "the standard deviation of y varies with x because the residuals get larger"
      ],
      keywordSets: [
        ["fan", "residual"],
        ["not constant", "spread"],
        ["standard deviation", "varies"]
      ],
      partialKeywords: [["spread"], ["residuals", "larger"]],
      feedback:
        "Explain that the residuals fan out, so the variability is not roughly constant across x-values."
    };
  }

  if (profile.verdict === "normality") {
    return {
      type: "choiceText",
      aliases: [
        "the residuals are strongly skewed and have an outlier so the normality condition is not met",
        "the dotplot of residuals shows skewness and an outlier"
      ],
      keywordSets: [
        ["skewed", "outlier"],
        ["normality", "not", "met"]
      ],
      partialKeywords: [["skewed"], ["outlier"]],
      feedback:
        "Explain that the residual distribution shows strong skewness or an outlier, so normality is not supported."
    };
  }

  return {
    type: "choiceText",
    aliases: [
      "the data did not come from a random sample or randomized experiment so independence is not supported",
      "the students volunteered, so the independence condition is not met"
    ],
    keywordSets: [
      ["volunteered", "not", "random"],
      ["independence", "not", "supported"],
      ["random sample", "not"]
    ],
    partialKeywords: [["volunteered"], ["independence"]],
    feedback:
      "Explain that the data were not collected with a random sample or randomized experiment, so independence is not supported."
  };
}

function getAlternativeText(key) {
  const map = {
    greater: "Ha: beta > 0",
    less: "Ha: beta < 0",
    "not-equal": "Ha: beta != 0"
  };

  return map[key];
}

function assignLetters(options, rand) {
  return shuffle(options.map(cloneValue), rand).map((option, index) => ({
    ...option,
    letter: LETTERS[index]
  }));
}

function nextFromShuffleBag(sharedState, key, values, rand) {
  if (!sharedState.__shuffleBags) {
    sharedState.__shuffleBags = {};
  }

  if (
    !Array.isArray(sharedState.__shuffleBags[key]) ||
    sharedState.__shuffleBags[key].length === 0
  ) {
    sharedState.__shuffleBags[key] = shuffle(values.map(cloneValue), rand);
  }

  return sharedState.__shuffleBags[key].pop();
}

function shuffle(values, rand) {
  const copy = values.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function getRandom(sharedState) {
  if (typeof sharedState.random === "function") {
    return () => sharedState.random();
  }

  if (typeof sharedState.rng === "function") {
    return () => sharedState.rng();
  }

  return Math.random;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

export { generateProblem };
