// generator.js - TEMPLATE CARTRIDGE
// Replace this with your lesson-specific problem generation logic.
//
// INSTRUCTIONS:
// 1. Create scenario banks for each level with 8-12 variations
// 2. Use shuffle bags to prevent immediate repeats
// 3. Randomize numeric values where appropriate
// 4. Include all {{placeholder}} variables in the returned context
// 5. Return answers for every input field in the mode

// ============ UTILITY FUNCTIONS ============

/**
 * Generate a random integer between min and max (inclusive)
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick a random element from an array
 */
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

// ============ SCENARIO BANKS ============
// Create one bank per level with 8-12 variations each.
// Each scenario should have: description, correct answer, and explanation/reasoning.

// LEVEL 1: Introduction/Vocabulary scenarios
const level1Scenarios = [
  {
    desc: "Example scenario 1 for vocabulary/identification",
    answer: "Option A",
    explanation: "This is Option A because of [reason]"
  },
  {
    desc: "Example scenario 2 for vocabulary/identification",
    answer: "Option B",
    explanation: "This is Option B because of [reason]"
  },
  {
    desc: "Example scenario 3 for vocabulary/identification",
    answer: "Option C",
    explanation: "This is Option C because of [reason]"
  },
  {
    desc: "Example scenario 4 for vocabulary/identification",
    answer: "Option D",
    explanation: "This is Option D because of [reason]"
  }
  // Add more scenarios...
];

// LEVEL 2: Basic Skill scenarios with dynamic options
const level2Scenarios = [
  {
    desc: "Example scenario for basic skill application",
    correct: "Correct Answer",
    wrong: ["Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"],
    explanation: "The correct answer is [X] because [Y]"
  }
  // Add more scenarios...
];

// LEVEL 3: Calculation scenarios
const level3Scenarios = [
  {
    template: "Calculate [value1] + [value2]",
    generator: () => {
      const a = randInt(10, 50);
      const b = randInt(5, 30);
      return {
        problemText: `Calculate ${a} + ${b}`,
        givenText: `a = ${a}, b = ${b}`,
        answer: a + b,
        tolerance: 0
      };
    }
  }
  // Add more calculation templates...
];

// LEVEL 4: Short Response scenarios
const level4Scenarios = [
  {
    desc: "Write [something] for the given [context]",
    expectedFormat: "Expected format or pattern",
    answer: "Expected answer",
    keywords: ["required", "keywords", "to", "look", "for"]
  }
  // Add more...
];

// LEVEL 5: Explanation scenarios
const level5Scenarios = [
  {
    desc: "Scenario requiring yes/no decision with explanation",
    correctChoice: "Yes",
    expectedReasoning: "The answer is Yes because [detailed reasoning]",
    keywords: ["key", "concepts", "to", "mention"]
  },
  {
    desc: "Another scenario requiring decision with explanation",
    correctChoice: "No",
    expectedReasoning: "The answer is No because [detailed reasoning]",
    keywords: ["different", "key", "concepts"]
  }
  // Add more...
];

// LEVEL 6: Capstone scenarios (complex, multi-part)
const level6Scenarios = [
  {
    desc: "Complex scenario requiring multiple skills",
    conceptAnswer: "Correct Concept",
    calcAnswer: 42,
    expectedExplanation: "Explanation connecting concept to calculation",
    allOptions: ["Correct Concept", "Wrong 1", "Wrong 2", "Wrong 3"]
  }
  // Add more...
];

// ============ MAIN GENERATOR FUNCTION ============

/**
 * Generate a problem for the given mode.
 *
 * @param {string} modeId - Current mode ID from manifest
 * @param {object|null} contextFromFile - Random context from contexts.json (if used)
 * @param {object} mode - Mode configuration object from manifest
 * @returns {object} Problem object with context, graphConfig, answers, scenario
 */
export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // ========== LEVEL 1: Introduction/Vocabulary ==========
  if (modeId === "l01-first-concept") {
    const scen = drawFromBag('level1', level1Scenarios);

    context = {
      levelName: "Level 1: Introduction",
      problemText: "Identify the correct term/concept",
      givenText: scen.desc,
      // Include any other template variables needed
    };

    answers = {
      choiceAnswer: { value: scen.answer }
    };

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 2: Basic Skill (with dynamic options) ==========
  if (modeId === "l02-basic-skill") {
    const scen = drawFromBag('level2', level2Scenarios);
    const options = shuffle([scen.correct, ...scen.wrong]);

    context = {
      levelName: "Level 2: Basic Skill",
      problemText: "Apply the basic skill",
      givenText: scen.desc,
      // Dynamic dropdown options
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };

    answers = {
      dropdownAnswer: { value: scen.correct }
    };

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 3: Calculation ==========
  if (modeId === "l03-calculation") {
    const template = choice(level3Scenarios);
    const generated = template.generator();

    context = {
      levelName: "Level 3: Calculation",
      problemText: generated.problemText,
      givenText: generated.givenText
    };

    answers = {
      numericAnswer: {
        value: generated.answer,
        tolerance: generated.tolerance || 0.01
      }
    };

    scenario = generated.problemText;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 4: Short Response ==========
  if (modeId === "l04-short-response") {
    const scen = drawFromBag('level4', level4Scenarios);

    context = {
      levelName: "Level 4: Short Response",
      problemText: scen.expectedFormat,
      givenText: scen.desc,
      // Include keywords for grading
      expectedKeywords: scen.keywords
    };

    answers = {
      textAnswer: { value: scen.answer }
    };

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 5: Explanation ==========
  if (modeId === "l05-explanation") {
    const scen = drawFromBag('level5', level5Scenarios);

    context = {
      levelName: "Level 5: Explanation",
      problemText: "Make a decision and explain your reasoning",
      givenText: scen.desc,
      expectedReasoning: scen.expectedReasoning,
      keywords: scen.keywords
    };

    answers = {
      conceptChoice: { value: scen.correctChoice },
      explanation: { value: scen.expectedReasoning }
    };

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 6: Capstone ==========
  if (modeId === "l06-capstone") {
    const scen = drawFromBag('level6', level6Scenarios);
    const options = shuffle(scen.allOptions);

    context = {
      levelName: "Level 6: Capstone",
      problemText: "Integrate multiple skills",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      expectedExplanation: scen.expectedExplanation
    };

    answers = {
      capstoneChoice: { value: scen.conceptAnswer },
      capstoneCalc: { value: scen.calcAnswer },
      capstoneExplain: { value: scen.expectedExplanation }
    };

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== FALLBACK ==========
  // This should never happen if manifest.modes and generator are aligned
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
