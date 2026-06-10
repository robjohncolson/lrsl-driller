const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const INTERPRETATION_PROFILES = [
  {
    key: "old-faithful",
    scenarioName: "Old Faithful eruptions",
    confidenceLevel: 95,
    sampleSize: 25,
    lower: -0.55,
    upper: 16.13,
    displayLower: "-0.55",
    displayUpper: "16.13",
    contextSentence:
      "for predicting wait time until the next eruption in minutes from the duration of the previous eruption in minutes for all Old Faithful geyser eruptions in July 2019",
    xKeywords: ["duration", "previous eruption"],
    yKeywords: ["wait time", "next eruption"],
    subjectKeywords: ["old faithful", "eruption"],
    linearVerdict: "none"
  },
  {
    key: "airplanes",
    scenarioName: "wind-up rubber band airplanes",
    confidenceLevel: 95,
    sampleSize: 16,
    lower: 0.013,
    upper: 0.08,
    displayLower: "0.013",
    displayUpper: "0.080",
    contextSentence:
      "for relating the number of rotations the rubber band is wound to the plane's flight time in seconds for wind-up rubber band airplanes like these",
    xKeywords: ["rotations", "rubber band"],
    yKeywords: ["flight time", "plane"],
    subjectKeywords: ["airplane", "wind-up"],
    linearVerdict: "positive"
  },
  {
    key: "real-estate",
    scenarioName: "three-bedroom house sales",
    confidenceLevel: 95,
    sampleSize: 20,
    lower: -2.471,
    upper: -1.845,
    displayLower: "-2.471",
    displayUpper: "-1.845",
    contextSentence:
      "for predicting selling price in thousands of dollars from distance from the city center in miles for all three-bedroom houses in this city",
    xKeywords: ["distance", "city center"],
    yKeywords: ["selling price", "thousands"],
    subjectKeywords: ["three-bedroom", "houses"],
    linearVerdict: "negative"
  }
];

function generateProblem(modeId, context = {}, mode = {}) {
  const sharedState = context && typeof context === "object" ? context : {};
  const rand = getRandom(sharedState);
  const builders = {
    "l93-interpret-slope-ci": buildInterpretationProblem,
    "l93-interpret-confidence-level": buildConfidenceLevelProblem,
    "l93-judge-linear-relationship": buildLinearClaimProblem,
    "l93-evaluate-specific-slope-claim": buildSpecificSlopeClaimProblem
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

function buildInterpretationProblem(sharedState, rand) {
  const profile = nextFromShuffleBag(
    sharedState,
    "l93-interpretation-profile",
    INTERPRETATION_PROFILES,
    rand
  );

  const prompt = [
    `A ${profile.confidenceLevel}% confidence interval for the slope of the population regression line is (${profile.displayLower}, ${profile.displayUpper}) ${profile.contextSentence}.`,
    "",
    "Write a correct interpretation of this confidence interval in context."
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        ci_interpretation: buildInterpretationRule(profile)
      }
    }
  };
}

function buildConfidenceLevelProblem(sharedState, rand) {
  const profile = nextFromShuffleBag(
    sharedState,
    "l93-confidence-level-profile",
    INTERPRETATION_PROFILES,
    rand
  );

  const prompt = [
    `In the ${profile.scenarioName} setting, suppose many random samples of size ${profile.sampleSize} are taken in the same way and a ${profile.confidenceLevel}% confidence interval for slope is constructed from each sample.`,
    "",
    `Interpret what the ${profile.confidenceLevel}% confidence level means in this situation.`
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        confidence_level_meaning: buildConfidenceLevelRule(profile)
      }
    }
  };
}

function buildLinearClaimProblem(sharedState, rand) {
  const profile = nextFromShuffleBag(
    sharedState,
    "l93-linear-claim-profile",
    INTERPRETATION_PROFILES,
    rand
  );

  const options = assignLetters(
    [
      {
        key: "positive",
        text: "There is convincing evidence of a positive linear relationship."
      },
      {
        key: "negative",
        text: "There is convincing evidence of a negative linear relationship."
      },
      {
        key: "none",
        text: "There is not convincing evidence of a linear relationship."
      },
      {
        key: "distractor",
        text: "No conclusion is possible because a confidence interval does not involve slope."
      }
    ],
    rand
  );

  const correctChoice = options.find(
    (choice) => choice.key === profile.linearVerdict
  );

  const prompt = [
    `A ${profile.confidenceLevel}% confidence interval for the slope is (${profile.displayLower}, ${profile.displayUpper}) ${profile.contextSentence}.`,
    "",
    "Which conclusion is most appropriate?",
    ...options.map((choice) => `${choice.letter}. ${choice.text}`),
    "",
    "Then explain your choice using the interval."
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        linear_claim_choice: buildLinearChoiceRule(
          correctChoice,
          profile.linearVerdict
        ),
        linear_claim_reason: buildLinearReasonRule(profile)
      }
    }
  };
}

function buildSpecificSlopeClaimProblem(sharedState, rand) {
  const claimProfile = nextFromShuffleBag(
    sharedState,
    "l93-specific-claim-profile",
    [
      { claimSlope: -2, displaySlope: "-2", dollarChange: "$2,000", verdict: "inside" },
      { claimSlope: -2.3, displaySlope: "-2.3", dollarChange: "$2,300", verdict: "inside" },
      { claimSlope: -1.7, displaySlope: "-1.7", dollarChange: "$1,700", verdict: "outside" },
      { claimSlope: -2.65, displaySlope: "-2.65", dollarChange: "$2,650", verdict: "outside" }
    ],
    rand
  );

  const options = assignLetters(
    [
      {
        key: "inside",
        text:
          "The interval does not contradict the claim because the claimed slope is a plausible value."
      },
      {
        key: "outside",
        text:
          "The interval contradicts the claim because the claimed slope is not a plausible value."
      },
      {
        key: "zero",
        text: "The claim is believable only if the interval contains 0."
      },
      {
        key: "midpoint",
        text: "The claim is believable only if it equals the midpoint of the interval."
      }
    ],
    rand
  );

  const correctChoice = options.find(
    (choice) => choice.key === claimProfile.verdict
  );

  const prompt = [
    "For three-bedroom houses in a large city, a 95% confidence interval for the slope is (-2.471, -1.845) thousand dollars per mile when predicting selling price from distance from the city center.",
    `A real estate agent claims the slope is about ${claimProfile.displaySlope} thousand dollars per mile, which means the selling price decreases by about ${claimProfile.dollarChange} for each additional mile from the city center.`,
    "",
    "Does the confidence interval contradict the agent's claim?",
    ...options.map((choice) => `${choice.letter}. ${choice.text}`),
    "",
    "Then justify your answer using the interval."
  ].join("\n");

  return {
    prompt,
    context: {
      answerKey: {
        slope_claim_choice: buildSpecificClaimChoiceRule(
          correctChoice,
          claimProfile.verdict
        ),
        slope_claim_reason: buildSpecificClaimReasonRule(claimProfile)
      }
    }
  };
}

function buildInterpretationRule(profile) {
  const keywordLower = String(profile.lower);
  const keywordUpper = String(profile.upper);
  const baseSentence = `we are ${profile.confidenceLevel}% confident that the interval from ${profile.displayLower} to ${profile.displayUpper} captures the slope of the population regression line ${profile.contextSentence}`;
  const betweenSentence = `we are ${profile.confidenceLevel}% confident that the slope of the population regression line ${profile.contextSentence} is between ${profile.displayLower} and ${profile.displayUpper}`;

  return {
    type: "choiceText",
    aliases: [baseSentence, betweenSentence],
    keywordSets: [
      [
        `${profile.confidenceLevel}`,
        keywordLower,
        keywordUpper,
        "slope",
        profile.xKeywords[0],
        profile.yKeywords[0]
      ],
      [
        `${profile.confidenceLevel}`,
        keywordLower,
        keywordUpper,
        "regression",
        profile.subjectKeywords[0],
        profile.subjectKeywords[1]
      ]
    ],
    partialKeywords: [
      [keywordLower, keywordUpper, "slope"],
      ["confident", "slope", profile.yKeywords[0]],
      [profile.xKeywords[0], profile.yKeywords[0]]
    ],
    feedback:
      `State that you are ${profile.confidenceLevel}% confident the interval from ${profile.displayLower} to ${profile.displayUpper} captures the slope of the population regression line in context.`
  };
}

function buildConfidenceLevelRule(profile) {
  return {
    type: "choiceText",
    aliases: [
      `if many random samples of size ${profile.sampleSize} are taken in the same way and a ${profile.confidenceLevel}% confidence interval for slope is built from each sample about ${profile.confidenceLevel}% of those intervals will capture the true slope of the population regression line`,
      `about ${profile.confidenceLevel}% of ${profile.confidenceLevel}% confidence intervals for the slope from many random samples of size ${profile.sampleSize} would capture the true slope`
    ],
    keywordSets: [
      [
        "many",
        "random",
        "samples",
        `${profile.confidenceLevel}`,
        "intervals",
        "capture",
        "slope"
      ],
      [
        "repeated",
        "sampling",
        `${profile.confidenceLevel}`,
        "capture",
        "true",
        "slope"
      ]
    ],
    partialKeywords: [
      [`${profile.confidenceLevel}`, "intervals", "slope"],
      ["samples", "capture", "slope"]
    ],
    feedback:
      `Interpret the confidence level with repeated random sampling: about ${profile.confidenceLevel}% of the intervals from many samples would capture the true slope of the population regression line.`
  };
}

function buildLinearChoiceRule(correctChoice, verdict) {
  const aliasMap = {
    positive: [
      "there is convincing evidence of a positive linear relationship",
      "convincing evidence of a positive linear relationship"
    ],
    negative: [
      "there is convincing evidence of a negative linear relationship",
      "convincing evidence of a negative linear relationship"
    ],
    none: [
      "there is not convincing evidence of a linear relationship",
      "not convincing evidence of a linear relationship",
      "no convincing evidence of a linear relationship"
    ]
  };

  return {
    type: "choiceText",
    accepted: [correctChoice.letter],
    aliases: aliasMap[verdict],
    partialKeywords: [["linear", "relationship"]],
    feedback:
      "Use the interval to decide whether 0 is a plausible slope and whether the interval is all positive or all negative."
  };
}

function buildLinearReasonRule(profile) {
  if (profile.linearVerdict === "positive") {
    return {
      type: "choiceText",
      aliases: [
        "all values in the interval are positive so there is convincing evidence of a positive linear relationship",
        "the interval is entirely positive so 0 is not a plausible slope"
      ],
      keywordSets: [["all", "positive", "interval"]],
      partialKeywords: [["positive"], ["0"]],
      feedback:
        "Explain that all values in the interval are positive, so 0 is not a plausible slope."
    };
  }

  if (profile.linearVerdict === "negative") {
    return {
      type: "choiceText",
      aliases: [
        "all values in the interval are negative so there is convincing evidence of a negative linear relationship",
        "the interval is entirely negative so 0 is not a plausible slope"
      ],
      keywordSets: [["all", "negative", "interval"]],
      partialKeywords: [["negative"], ["0"]],
      feedback:
        "Explain that all values in the interval are negative, so 0 is not a plausible slope."
    };
  }

  return {
    type: "choiceText",
    aliases: [
      "the interval contains 0 so there is not convincing evidence of a linear relationship",
      "0 is a plausible slope because it is in the interval"
    ],
    keywordSets: [
      ["contains", "0"],
      ["includes", "0"],
      ["zero", "plausible"]
    ],
    partialKeywords: [["0"], ["plausible", "slope"]],
    feedback:
      "Explain that 0 is in the interval, so 0 is a plausible slope and there is not convincing evidence of a linear relationship."
  };
}

function buildSpecificClaimChoiceRule(correctChoice, verdict) {
  const aliasMap = {
    inside: [
      "the interval does not contradict the claim because the claimed slope is a plausible value",
      "the interval does not contradict the claim",
      "the claim is plausible"
    ],
    outside: [
      "the interval contradicts the claim because the claimed slope is not a plausible value",
      "the interval contradicts the claim",
      "the claim is not plausible"
    ]
  };

  return {
    type: "choiceText",
    accepted: [correctChoice.letter],
    aliases: aliasMap[verdict],
    partialKeywords: [["claim"], ["plausible"]],
    feedback:
      "A claimed slope is plausible when it falls inside the confidence interval and contradicted when it falls outside."
  };
}

function buildSpecificClaimReasonRule(claimProfile) {
  if (claimProfile.verdict === "inside") {
    return {
      type: "choiceText",
      aliases: [
        `because ${claimProfile.displaySlope} is in the interval`,
        `because ${claimProfile.displaySlope} is inside the interval`,
        `because the interval contains ${claimProfile.displaySlope}`
      ],
      keywordSets: [
        [claimProfile.displaySlope, "inside", "interval"],
        [claimProfile.displaySlope, "contains"]
      ],
      partialKeywords: [[claimProfile.displaySlope], ["interval", "claim"]],
      feedback:
        `Justify your answer by noting that ${claimProfile.displaySlope} is contained in the interval, so it is a plausible slope.`
    };
  }

  return {
    type: "choiceText",
    aliases: [
      `because ${claimProfile.displaySlope} is not in the interval`,
      `because ${claimProfile.displaySlope} is outside the interval`,
      `because the interval does not contain ${claimProfile.displaySlope}`
    ],
    keywordSets: [
      [claimProfile.displaySlope, "outside", "interval"],
      [claimProfile.displaySlope, "not", "interval"]
    ],
    partialKeywords: [[claimProfile.displaySlope], ["interval", "claim"]],
    feedback:
      `Justify your answer by noting that ${claimProfile.displaySlope} is outside the interval, so it is not a plausible slope.`
  };
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
