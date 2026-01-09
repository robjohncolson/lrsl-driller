/**
 * Problem Generator
 * AP Statistics Unit 3 (Collecting Data) — Lessons 6–7
 * Topic 3.6 Selecting an Experimental Design
 * Topic 3.7 Inference and Experiments
 *
 * NOTE: This cartridge is practice aligned to the videos/worksheet + framework.
 * It intentionally does NOT include end-of-lesson quiz questions verbatim.
 */

// ------------------------------
// Helpers
// ------------------------------
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function oneOf(...vals) {
  return pick(vals);
}

function formatP(p) {
  // p is number between 0 and 1
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function formatPct(x) {
  return (x * 100).toFixed(1).replace(/\.0$/, '');
}

// ------------------------------
// Mode router
// ------------------------------
export function generateProblem(modeId, context = {}, mode = {}) {
  switch (modeId) {
    case 'L01-vocab':
      return generateVocab();
    case 'L02-design':
      return generateDesignChoice();
    case 'L03-inference':
      return generateInferenceTriage();
    case 'L04-frq':
      return generateFrq();
    default:
      return generateVocab();
  }
}

// ------------------------------
// L01 — Vocabulary (blocking, blinding, replication, inference)
// ------------------------------
const VOCAB_BANK = [
  {
    id: 'principles-control',
    prompt:
      'A well-designed experiment includes comparison of treatments, random assignment, replication, and _____.',
    canonical: 'control',
    acceptable: [
      'control',
      'control of variables',
      'control of confounding variables',
      'control of potential confounding variables'
    ]
  },
  {
    id: 'rbd-blocks',
    prompt:
      'In a randomized block design, experimental units are first split into similar groups called _____, then randomized to treatments within each group.',
    canonical: 'blocks',
    acceptable: ['blocks', 'block', 'groups']
  },
  {
    id: 'blocking-variable',
    prompt:
      'A(n) _____ variable is used to form blocks because it is expected to affect the response variable.',
    canonical: 'blocking',
    acceptable: ['blocking', 'block']
  },
  {
    id: 'matched-pairs-special-case',
    prompt:
      'A matched pairs design is a special case of a randomized _____ design.',
    canonical: 'block',
    acceptable: ['block', 'blocked', 'block design', 'randomized block']
  },
  {
    id: 'replication-units',
    prompt:
      'Replication means using more than one _____ in each treatment group (not just taking lots of measurements).',
    canonical: 'experimental unit',
    acceptable: ['experimental unit', 'experimental units', 'subject', 'subjects', 'participant', 'participants']
  },
  {
    id: 'confounding',
    prompt:
      'A(n) _____ variable is related to the treatment and also affects the response, making it hard to tell what caused the observed difference.',
    canonical: 'confounding',
    acceptable: ['confounding', 'confounder', 'confounding variable']
  },
  {
    id: 'double-blind',
    prompt:
      'A double-blind experiment is possible when both the subjects and the _____ interacting with them are unaware of which treatment is given.',
    canonical: 'researchers',
    acceptable: ['researchers', 'researcher', 'experimenters', 'experimenter', 'investigators', 'investigator']
  },
  {
    id: 'blind-unaware',
    prompt:
      'Blinding is possible when subjects and/or researchers are _____ of the treatment being administered.',
    canonical: 'unaware',
    acceptable: ['unaware', 'blind', 'blinded', 'not aware']
  },
  {
    id: 'random-assignment-causation',
    prompt:
      'Random _____ to treatments is what allows a cause-and-effect conclusion (when differences are statistically significant).',
    canonical: 'assignment',
    acceptable: ['assignment', 'allocation', 'assigning']
  },
  {
    id: 'random-selection-generalize',
    prompt:
      'Random _____ of experimental units gives a better chance the results can be generalized to the population of interest.',
    canonical: 'selection',
    acceptable: ['selection', 'sampling', 'random selection', 'random sampling']
  },
  {
    id: 'stat-sig',
    prompt:
      'An observed difference that is unlikely to be due to chance alone is called _____.',
    canonical: 'statistically significant',
    acceptable: ['statistically significant', 'significant', 'statistical significance']
  },
  {
    id: 'control-group',
    prompt:
      'A _____ group provides a baseline for comparison (often receiving a placebo or the existing condition).',
    canonical: 'control',
    acceptable: ['control', 'control group']
  },
  {
    id: 'placebo-effect',
    prompt:
      'The placebo effect is a response to a(n) _____ substance rather than to an active treatment.',
    canonical: 'inactive',
    acceptable: ['inactive', 'inert', 'placebo', 'fake']
  },
  {
    id: 'crd-random',
    prompt:
      'In a completely randomized design, treatments are assigned to experimental units completely at _____.',
    canonical: 'random',
    acceptable: ['random', 'randomly', 'at random']
  },
  {
    id: 'rbd-why',
    prompt:
      'Blocking helps separate _____ variability from differences due to the blocking variable.',
    canonical: 'natural',
    acceptable: ['natural', 'inherent', 'background']
  },
  {
    id: 'matched-pairs-both',
    prompt:
      'In many matched pairs studies, each subject receives _____ treatments (in random order).',
    canonical: 'both',
    acceptable: ['both', 'two', 'each', 'all']
  }
];

function generateVocab() {
  const item = pick(VOCAB_BANK);
  return {
    context: {
      mode: 'L01-vocab',
      itemId: item.id,
      problemText: item.prompt,
      canonicalAnswer: item.canonical,
      acceptableAnswers: item.acceptable,
      topic: 'Vocabulary'
    },
    answers: {
      term: {
        value: item.canonical,
        acceptableAnswers: item.acceptable
      }
    },
    scenario: item.prompt
  };
}

// ------------------------------
// L02 — Choose the best design (CRD vs Block vs Matched Pairs)
// ------------------------------
const DESIGN_OPTIONS = [
  'Completely randomized design',
  'Randomized block design',
  'Matched pairs design'
];

// Each template returns { scenario, correctDesign, rationale }
const DESIGN_TEMPLATES = [
  function athleteBlock() {
    const n = randInt(36, 60);
    const half = Math.floor(n / 2);
    const blockVar = oneOf('event type (sprinters vs distance runners)', 'experience level (novice vs experienced)', 'sex (male vs female)');
    return {
      scenario:
        `A coach wants to compare two warm-up routines (Routine A vs Routine B) on a 100‑meter sprint time.\n` +
        `The coach expects ${blockVar} to affect sprint times. The coach will split the ${n} athletes into two groups based on ${blockVar}, then randomly assign half of each group to Routine A and the other half to Routine B.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Randomized block design',
      rationale: `Because ${blockVar} is a natural source of variation, blocking on it makes the comparison between routines more precise.`
    };
  },
  function withinSubject() {
    const task = oneOf('reading speed', 'typing speed', 'reaction time');
    return {
      scenario:
        `A researcher wants to compare two screen color themes (Light vs Dark) on ${task}.\n` +
        `Each participant will complete the same task twice—once using Light and once using Dark. The order of the two themes will be randomized for each participant.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Matched pairs design',
      rationale: 'Because each participant receives both treatments (in randomized order), the participant serves as their own control.'
    };
  },
  function greenhouseFertilizer() {
    const t = randInt(3, 4);
    const n = t * randInt(8, 12);
    const response = oneOf('height after 4 weeks', 'number of leaves after 3 weeks', 'mass after 30 days');
    return {
      scenario:
        `A horticulture class wants to compare ${t} fertilizers on plant growth.\n` +
        `They have ${n} similar seedlings in the same greenhouse. They will randomly assign the seedlings so each fertilizer is used on the same number of plants. The response variable is ${response}.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Completely randomized design',
      rationale: 'No clear blocking variable is described, so randomly assigning treatments to all units is appropriate.'
    };
  },
  function classroomsBlock() {
    const nClass = randInt(3, 5);
    const per = randInt(18, 26);
    const n = nClass * per;
    const blockVar = 'class period';
    return {
      scenario:
        `A teacher wants to compare two review methods for an exam (Method A vs Method B).\n` +
        `The teacher has ${n} students across ${nClass} different class periods. The teacher expects performance to differ by ${blockVar} (because of time of day).\n` +
        `Within each class period, students will be randomly assigned to Method A or Method B.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Randomized block design',
      rationale: `Blocking on ${blockVar} controls for differences among class periods.`
    };
  },
  function twinsPairs() {
    const pairs = randInt(8, 14);
    const response = oneOf('weight gain', 'blood pressure change', 'endurance score');
    return {
      scenario:
        `A nutrition study has ${pairs} pairs of twins. Researchers want to compare Diet X vs Diet Y on ${response}.\n` +
        `Within each twin pair, one twin will be randomly assigned Diet X and the other twin will be randomly assigned Diet Y.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Matched pairs design',
      rationale: 'Twin pairs are naturally similar, so pairing controls for genetics and many background variables.'
    };
  },
  function fieldPlotsPairs() {
    const plots = randInt(6, 12);
    return {
      scenario:
        `A farm wants to compare two irrigation schedules (Schedule A vs Schedule B) on crop yield.\n` +
        `The farm has ${plots} long fields that vary in soil quality from one end to the other. To reduce the effect of field-to-field differences, each field will be split into two similar halves. Within each field, one half will be randomly assigned Schedule A and the other half Schedule B.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Matched pairs design',
      rationale: 'Each field forms a pair (two matched halves), so comparisons are made within each field.'
    };
  },
  function storeAislesBlock() {
    const stores = randInt(18, 30);
    const blockVar = oneOf('store location (urban vs suburban)', 'store size (small vs large)');
    return {
      scenario:
        `A grocery chain wants to test whether a new shelf layout increases sales of a snack.\n` +
        `They will use ${stores} stores. Because ${blockVar} is expected to affect sales, the chain will group stores by ${blockVar}, then randomly assign stores within each group to either the new layout or the current layout.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Randomized block design',
      rationale: `Blocking on ${blockVar} reduces variability due to location/size differences.`
    };
  },
  function crdNoBlock() {
    const n = randInt(20, 40);
    const response = oneOf('number of defects per hour', 'time to assemble a product', 'customer satisfaction score');
    return {
      scenario:
        `A company wants to compare two training videos (Video A vs Video B) on employee performance.\n` +
        `They have ${n} new employees with similar backgrounds. Employees will be randomly assigned to watch Video A or Video B, then performance will be measured using ${response}.\n\n` +
        `Which experimental design is best?`,
      correctDesign: 'Completely randomized design',
      rationale: 'No specific blocking variable is given; random assignment to all employees is appropriate.'
    };
  }
];

function generateDesignChoice() {
  const item = pick(DESIGN_TEMPLATES)();
  return {
    context: {
      mode: 'L02-design',
      itemId: `design-${item.correctDesign.toLowerCase().replace(/\s+/g, '-')}`,
      problemText: item.scenario,
      correctDesign: item.correctDesign,
      rationale: item.rationale,
      options: DESIGN_OPTIONS,
      topic: 'Selecting an Experimental Design'
    },
    answers: {
      design: { value: item.correctDesign }
    },
    scenario: item.scenario + `\n\nOptions:\n- ${DESIGN_OPTIONS.join('\n- ')}`
  };
}

// ------------------------------
// L03 — Inference triage (significance, causation, generalization)
// ------------------------------
const INFERENCE_CONTEXTS = [
  function drugStudy() {
    return {
      contextLabel: 'a new allergy medication',
      responseVar: 'symptom score (lower is better)',
      unitLabel: 'patients'
    };
  },
  function teachingStudy() {
    return {
      contextLabel: 'a new review app',
      responseVar: 'score on a unit test',
      unitLabel: 'students'
    };
  },
  function plantStudy() {
    return {
      contextLabel: 'a new fertilizer',
      responseVar: 'plant height after 4 weeks',
      unitLabel: 'seedlings'
    };
  },
  function sleepStudy() {
    return {
      contextLabel: 'a blue-light filter setting',
      responseVar: 'minutes of sleep per night',
      unitLabel: 'adults'
    };
  }
];

function generateInferenceTriage() {
  const base = pick(INFERENCE_CONTEXTS)();

  const n = randInt(40, 120);
  const randomSample = Math.random() < 0.45; // some are volunteers (not generalizable), some are random samples
  const alpha = pick([0.05, 0.01]);

  // pick p-values so we get both significant and not significant fairly often
  const pValue = pick([0.002, 0.008, 0.019, 0.032, 0.061, 0.104, 0.18]);
  const significant = pValue < alpha;

  const diffDirection = pick(['higher', 'lower']);
  const diffText = `The group receiving the new treatment had a ${diffDirection} average ${base.responseVar} than the control group.`;
  const samplingText = randomSample
    ? `Researchers took a random sample of ${n} ${base.unitLabel} from the population of interest.`
    : `Researchers recruited ${n} volunteer ${base.unitLabel}.`;

  const scenario =
    `Researchers want to test whether ${base.contextLabel} changes ${base.responseVar}.\n` +
    `${samplingText}\n` +
    `They randomly assigned the ${base.unitLabel} to receive either the new treatment or a control condition.\n` +
    `${diffText}\n` +
    `A significance test at α = ${alpha} produced p = ${formatP(pValue)}.\n\n` +
    `Answer the three questions below.`;

  const correctSig = significant ? 'Yes' : 'No';
  const correctCause = significant ? 'Yes' : 'No'; // random assignment is present
  const correctGen = randomSample ? 'Yes' : 'No';

  return {
    context: {
      mode: 'L03-inference',
      itemId: `inf-${randomSample ? 'rand' : 'vol'}-${alpha}-${formatP(pValue)}`,
      problemText: scenario,
      alpha,
      pValue,
      significant,
      randomSample,
      correctSig,
      correctCause,
      correctGen,
      topic: 'Inference & Experiments',
      quickRationale: {
        sig: significant
          ? 'Because p < α, the result is statistically significant.'
          : 'Because p ≥ α, the result is not statistically significant.',
        cause: significant
          ? 'Random assignment + statistical significance → evidence of causation.'
          : 'Without statistical significance, we do not have enough evidence to say the treatment caused a difference.',
        gen: randomSample
          ? 'Random selection/representative units → results can be generalized.'
          : 'Volunteers are not a random/representative sample → do not generalize to the whole population.'
      }
    },
    answers: {
      sig: { value: correctSig },
      cause: { value: correctCause },
      gen: { value: correctGen }
    },
    scenario
  };
}

// ------------------------------
// L04 — Free response (AP-style writing)
// ------------------------------
const FRQ_BANK = [
  {
    id: 'rs-vs-ra',
    prompt:
      'Random Selection vs Random Assignment:\n' +
      'Explain the difference between random selection and random assignment, and state what each one allows you to conclude (generalization vs causation).',
    sampleAnswer:
      'Random selection (random sampling) is how we choose individuals from a population; it helps results generalize to that population if the sample is representative. ' +
      'Random assignment is how we assign treatments in an experiment; it helps justify a cause-and-effect conclusion if differences are statistically significant. ' +
      'Random selection is about generalizing; random assignment is about causation.',
    requiredKeywordGroups: [
      { label: 'Random selection → generalize', keywords: ['random selection', 'random sample', 'random sampling', 'representative', 'generalize'] },
      { label: 'Random assignment → causation', keywords: ['random assignment', 'assign', 'allocate', 'cause', 'causal', 'cause and effect'] }
    ],
    partialKeywordGroups: [
      { label: 'Population language', keywords: ['population', 'sample'] },
      { label: 'Association vs causation', keywords: ['association', 'observational', 'experiment'] }
    ]
  },
  {
    id: 'fertilizer-blocking',
    prompt:
      'Evaluating an Experiment (blocking):\n' +
      'A researcher wants to test whether Fertilizer B increases yield compared with Fertilizer A. The researcher assigns Fertilizer B to 5 fields and Fertilizer A to 5 different fields, then measures yield.\n\n' +
      '(In one response) Identify one potential confounding variable and propose an improved design using blocking.',
    sampleAnswer:
      'Field characteristics such as soil quality, sunlight, or drainage could affect yield. Because each fertilizer is used on different fields, fertilizer is confounded with field differences. ' +
      'To improve the design, block fields by a variable like soil type or location (fields that are similar), then randomly assign Fertilizer A or B within each block, with multiple fields per treatment.',
    requiredKeywordGroups: [
      { label: 'Names a field-based confound', keywords: ['soil', 'sunlight', 'water', 'drainage', 'terrain', 'field', 'location'] },
      { label: 'Explains confounding', keywords: ['confound', 'confounded', 'cannot tell', 'can’t tell', 'mixed up'] },
      { label: 'Proposes blocking + randomize within blocks', keywords: ['block', 'blocking', 'within each block', 'randomly assign', 'random assignment'] }
    ],
    partialKeywordGroups: [
      { label: 'Replication', keywords: ['replication', 'multiple', 'more than one'] },
      { label: 'Compare treatments', keywords: ['compare', 'comparison'] }
    ]
  },
  {
    id: 'stat-sig-causation',
    prompt:
      'Interpreting Statistical Significance:\n' +
      'In a randomized experiment comparing a new medication to a placebo, the researchers found p = 0.02 at α = 0.05.\n' +
      'Explain what “statistically significant” means here and what can be concluded about causation.',
    sampleAnswer:
      'Because p = 0.02 is less than α = 0.05, the difference in results is statistically significant, meaning a difference this large would be unlikely to occur by chance alone if the medication had no effect. ' +
      'Since treatments were randomly assigned, this provides evidence that the medication caused the observed difference (for these experimental units).',
    requiredKeywordGroups: [
      { label: 'p-value compared to alpha', keywords: ['p', '0.02', 'less than', '<', 'alpha', '0.05'] },
      { label: 'Unlikely by chance', keywords: ['unlikely', 'chance', 'random'] },
      { label: 'Random assignment → causation', keywords: ['random assignment', 'randomly assigned', 'cause', 'caused', 'causation'] }
    ],
    partialKeywordGroups: [
      { label: 'Mentions significance', keywords: ['statistically significant', 'significant'] },
      { label: 'Treatment vs placebo', keywords: ['placebo', 'control'] }
    ]
  },
  {
    id: 'generalization-conditions',
    prompt:
      'Generalization:\n' +
      'Under what TWO conditions can the results of an experiment be generalized to a larger population?',
    sampleAnswer:
      'Results can be generalized when the experimental units are representative of the population of interest, ideally through random selection. ' +
      'Also, the population you generalize to must match the population that was sampled (the “population of interest”).',
    requiredKeywordGroups: [
      { label: 'Representative / random selection', keywords: ['representative', 'random selection', 'random sample', 'random sampling'] },
      { label: 'Correct population language', keywords: ['population of interest', 'population', 'sampled from'] }
    ],
    partialKeywordGroups: [
      { label: 'Limits of generalization', keywords: ['only', 'cannot', 'limited'] }
    ]
  }
];

function generateFrq() {
  const item = pick(FRQ_BANK);

  // Build a "keyIdeas" string for the AI grader prompt (and for hints)
  const keyIdeas = (item.requiredKeywordGroups || [])
    .map((g) => g.label)
    .join('; ');

  return {
    context: {
      mode: 'L04-frq',
      itemId: item.id,
      problemText: item.prompt,
      correctAnswer: item.sampleAnswer,
      keyIdeas,
      requiredKeywordGroups: item.requiredKeywordGroups,
      partialKeywordGroups: item.partialKeywordGroups,
      topic: 'AP-Style Reasoning'
    },
    answers: {
      response: {
        value: item.sampleAnswer
      }
    },
    scenario: item.prompt
  };
}
