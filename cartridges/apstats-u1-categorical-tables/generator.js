const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const STRUCTURE_SCENARIOS = [
  {
    key: "superpower",
    intro:
      "An online survey asked a random sample of high school students which superpower they would most like to have: Fly, Freeze time, Invisibility, Super strength, or Telepathy.",
    individuals: "the high school students who completed the survey",
    variable: "superpower preference",
    categoriesPhrase: "Fly, Freeze time, Invisibility, Super strength, and Telepathy"
  },
  {
    key: "vaping-risk",
    intro:
      "A survey asked students how much people risk harming themselves if they vape an e-liquid with nicotine occasionally: No risk, Slight risk, Moderate risk, Great risk, or Can't say / drug unfamiliar.",
    individuals: "the students who completed the survey",
    variable: "perceived risk of occasional nicotine vaping",
    categoriesPhrase: "No risk, Slight risk, Moderate risk, Great risk, and Can't say / drug unfamiliar"
  }
];

const RESPONSE_SCENARIOS = [
  {
    key: "superpower",
    intro:
      "An online survey asked students which superpower they would most like to have.",
    variable: "superpower preference",
    categories: ["Fly", "Freeze time", "Invisibility", "Super strength", "Telepathy"]
  },
  {
    key: "vaping-risk",
    intro:
      "A survey asked students how much people risk harming themselves if they vape an e-liquid with nicotine occasionally.",
    variable: "perceived risk of occasional nicotine vaping",
    categories: ["No risk", "Slight risk", "Moderate risk", "Great risk", "Can't say"]
  }
];

function generateProblem(modeId, context = {}, mode = {}) {
  const sharedState = context && typeof context === "object" ? context : {};
  const rand = getRandom(sharedState);
  const builders = {
    "l13-identify-categorical-structure": buildStructureProblem,
    "l13-build-frequency-counts": buildFrequencyProblem,
    "l13-find-relative-frequency": buildRelativeFrequencyProblem,
    "l13-judge-supported-claim": buildClaimProblem
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
    data: generated.data || {},
    context: generated.context || {}
  };
}

function buildStructureProblem(sharedState, rand) {
  const scenario = nextFromShuffleBag(
    sharedState,
    "l13-structure-scenario",
    STRUCTURE_SCENARIOS,
    rand
  );

  const correct = {
    key: "correct",
    text: `The individuals are ${scenario.individuals}, the variable is ${scenario.variable}, and the variable is categorical because the responses are category labels.`
  };

  const options = assignLetters(
    [
      correct,
      {
        key: "counts-quantitative",
        text: `The individuals are ${scenario.categoriesPhrase}, the variable is the number of students in each category, and the variable is quantitative.`
      },
      {
        key: "wrong-type",
        text: `The individuals are ${scenario.individuals}, the variable is ${scenario.variable}, and the variable is quantitative because it came from a survey.`
      },
      {
        key: "wrong-variable",
        text: "The individuals are the survey categories, the variable is the sample size, and the variable is categorical."
      }
    ],
    rand
  );

  const correctChoice = options.find((choice) => choice.key === "correct");

  return {
    prompt: [
      scenario.intro,
      "",
      "Which statement correctly identifies the individuals, the variable, and the type of variable?",
      ...options.map((choice) => `${choice.letter}. ${choice.text}`)
    ].join("\n"),
    data: {
      options
    },
    context: {
      answerKey: {
        structure_choice: {
          type: "choiceText",
          accepted: [correctChoice.letter],
          aliases: [correct.text],
          partialKeywords: [
            ["individuals", "variable"],
            ["students", "categorical"],
            [scenario.variable, "categorical"]
          ],
          feedback:
            `The individuals are ${scenario.individuals}, the variable is ${scenario.variable}, and it is categorical because the responses are labels such as ${scenario.categoriesPhrase}.`
        }
      }
    }
  };
}

function buildFrequencyProblem(sharedState, rand) {
  const scenario = nextFromShuffleBag(
    sharedState,
    "l13-frequency-scenario",
    RESPONSE_SCENARIOS,
    rand
  );
  const total = nextFromShuffleBag(
    sharedState,
    "l13-frequency-total",
    [24, 25, 30],
    rand
  );
  const counts = buildCounts(rand, scenario.categories.length, total, 2);
  const requestedIndices = sampleIndices(scenario.categories.length, 3, rand);
  const rawResponses = makeRawResponseList(scenario.categories, counts, rand, 6);

  return {
    prompt: [
      `${scenario.intro} Here are the raw responses from ${total} students:`,
      "",
      rawResponses,
      "",
      "Use the raw data to fill in these frequency-table counts:",
      `- First requested category: ${scenario.categories[requestedIndices[0]]}`,
      `- Second requested category: ${scenario.categories[requestedIndices[1]]}`,
      `- Third requested category: ${scenario.categories[requestedIndices[2]]}`
    ].join("\n"),
    data: {
      requestedCategories: requestedIndices.map((index) => scenario.categories[index])
    },
    context: {
      answerKey: {
        first_requested_count: {
          type: "integer",
          value: counts[requestedIndices[0]],
          tolerance: 0,
          partialTolerance: 1,
          feedback: `Count how many times ${scenario.categories[requestedIndices[0]]} appears in the raw data.`
        },
        second_requested_count: {
          type: "integer",
          value: counts[requestedIndices[1]],
          tolerance: 0,
          partialTolerance: 1,
          feedback: `Count how many times ${scenario.categories[requestedIndices[1]]} appears in the raw data.`
        },
        third_requested_count: {
          type: "integer",
          value: counts[requestedIndices[2]],
          tolerance: 0,
          partialTolerance: 1,
          feedback: `Count how many times ${scenario.categories[requestedIndices[2]]} appears in the raw data.`
        }
      }
    }
  };
}

function buildRelativeFrequencyProblem(sharedState, rand) {
  const scenario = nextFromShuffleBag(
    sharedState,
    "l13-relative-scenario",
    RESPONSE_SCENARIOS,
    rand
  );
  const total = nextFromShuffleBag(
    sharedState,
    "l13-relative-total",
    [25, 40, 50],
    rand
  );
  const counts = buildCounts(rand, scenario.categories.length, total, 2);
  const targetIndex = randomInt(rand, 0, scenario.categories.length - 1);
  const count = counts[targetIndex];
  const proportion = roundTo(count / total, 3);
  const percent = roundTo((count / total) * 100, 1);

  return {
    prompt: [
      `${scenario.intro} A frequency table is shown below.`,
      "",
      makeFrequencyTableString(scenario.categories, counts),
      "",
      `What is the relative frequency for ${scenario.categories[targetIndex]}?`,
      "Enter the proportion as a decimal rounded to 3 places and the percent rounded to 1 decimal place."
    ].join("\n"),
    context: {
      answerKey: {
        relative_proportion: {
          type: "numeric",
          value: proportion,
          tolerance: 0.001,
          partialTolerance: 0.01,
          feedback: `Divide ${count} by ${total} to get the proportion.`
        },
        relative_percent: {
          type: "numeric",
          value: percent,
          tolerance: 0.1,
          partialTolerance: 1,
          feedback: `Use ${count} / ${total}, then multiply by 100 to convert the proportion to a percent.`
        }
      }
    }
  };
}

function buildClaimProblem(sharedState, rand) {
  const scenario = nextFromShuffleBag(
    sharedState,
    "l13-claim-scenario",
    RESPONSE_SCENARIOS,
    rand
  );
  const total = nextFromShuffleBag(
    sharedState,
    "l13-claim-total",
    [25, 50],
    rand
  );
  const counts = buildClaimCounts(rand, scenario.categories.length, total);
  const ranked = counts
    .map((count, index) => ({
      count,
      category: scenario.categories[index]
    }))
    .sort((left, right) => right.count - left.count);

  const top = ranked[0];
  const second = ranked[1];
  const lowest = ranked[ranked.length - 1];
  const pairPercent = roundTo(((top.count + lowest.count) / total) * 100, 1);
  const wrongPercent = pairPercent >= 96 ? pairPercent - 4 : pairPercent + 4;

  const correct = {
    key: "correct",
    text: `Exactly ${formatNumber(pairPercent, 1)}% of students chose either ${top.category} or ${lowest.category}.`
  };

  const options = assignLetters(
    [
      correct,
      {
        key: "majority",
        text: `A majority of students chose ${top.category}.`
      },
      {
        key: "reversed-twice",
        text: `More than twice as many students chose ${lowest.category} as ${top.category}.`
      },
      {
        key: "wrong-most-common",
        text: `${second.category} was the most common response, making up ${formatNumber(wrongPercent, 1)}% of the sample.`
      }
    ],
    rand
  );

  const correctChoice = options.find((choice) => choice.key === "correct");

  return {
    prompt: [
      `${scenario.intro} The frequency table below summarizes the responses.`,
      "",
      makeFrequencyTableString(scenario.categories, counts),
      "",
      "Which statement is supported by the table?",
      ...options.map((choice) => `${choice.letter}. ${choice.text}`)
    ].join("\n"),
    data: {
      options
    },
    context: {
      answerKey: {
        claim_choice: {
          type: "choiceText",
          accepted: [correctChoice.letter],
          aliases: [correct.text],
          partialKeywords: [
            [top.category, lowest.category],
            ["exactly", formatNumber(pairPercent, 1)],
            ["table", "students"]
          ],
          feedback:
            "Check each claim against the table. A majority means more than 50%, and comparison statements must match the actual counts exactly."
        }
      }
    }
  };
}

function buildCounts(rand, categoryCount, total, minCount) {
  const counts = new Array(categoryCount).fill(minCount);
  let remaining = total - categoryCount * minCount;

  while (remaining > 0) {
    const index = randomInt(rand, 0, categoryCount - 1);
    counts[index] += 1;
    remaining -= 1;
  }

  return counts;
}

function buildClaimCounts(rand, categoryCount, total) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const counts = buildCounts(rand, categoryCount, total, 2);
    const sorted = counts.slice().sort((left, right) => right - left);
    const top = sorted[0];
    const second = sorted[1];
    const lowest = sorted[sorted.length - 1];

    if (top < total / 2 && top > second && top > lowest * 2) {
      return counts;
    }
  }

  return total === 25 ? [8, 6, 5, 4, 2] : [18, 11, 10, 7, 4];
}

function makeRawResponseList(categories, counts, rand, perLine) {
  const responses = [];
  counts.forEach((count, index) => {
    for (let occurrence = 0; occurrence < count; occurrence += 1) {
      responses.push(categories[index]);
    }
  });

  const shuffled = shuffle(responses, rand);
  const lines = [];

  for (let index = 0; index < shuffled.length; index += perLine) {
    lines.push(shuffled.slice(index, index + perLine).join(", "));
  }

  return lines.join("\n");
}

function makeFrequencyTableString(categories, counts) {
  const lines = ["Category | Frequency", "-------- | ---------"];

  for (let index = 0; index < categories.length; index += 1) {
    lines.push(`${categories[index]} | ${counts[index]}`);
  }

  const total = counts.reduce((sum, count) => sum + count, 0);
  lines.push(`Total | ${total}`);
  return lines.join("\n");
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

function sampleIndices(length, count, rand) {
  return shuffle(Array.from({ length }, (_, index) => index), rand).slice(0, count);
}

function shuffle(values, rand) {
  const copy = values.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function randomInt(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function roundTo(value, places) {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

function formatNumber(value, places) {
  return Number(value).toFixed(places).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
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
