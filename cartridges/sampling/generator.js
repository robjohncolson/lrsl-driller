// generator.js - Sampling Methods & Evaluation Cartridge

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Scenario bank for realistic problems
const scenarios = {
  stratified: [
    {
      setup: "A researcher divides a city into 10 neighborhoods based on income level, then randomly selects 50 households from EACH neighborhood.",
      population: "households in the city",
      strata: "neighborhoods (by income)",
      reason: "Income is similar within each neighborhood but varies between neighborhoods"
    },
    {
      setup: "A school surveys students by randomly selecting 20 students from EACH grade level (9th, 10th, 11th, 12th).",
      population: "students at the school",
      strata: "grade levels",
      reason: "Opinions may differ by grade, but students within a grade are similar"
    },
    {
      setup: "A company randomly selects 10 employees from EACH department to survey about workplace satisfaction.",
      population: "company employees",
      strata: "departments",
      reason: "Work experience varies by department, but is consistent within departments"
    },
    {
      setup: "Researchers studying tree health divide a forest into elevation zones (low, medium, high) and randomly sample 30 trees from EACH zone.",
      population: "trees in the forest",
      strata: "elevation zones",
      reason: "Tree health may vary by elevation, but trees at similar elevations face similar conditions"
    }
  ],
  cluster: [
    {
      setup: "A researcher randomly selects 5 city blocks out of 100, then surveys EVERY household on those selected blocks.",
      population: "households in the city",
      clusters: "city blocks",
      reason: "It's easier to visit all homes on selected blocks than homes scattered across the city"
    },
    {
      setup: "A school district randomly selects 3 schools out of 20, then tests ALL students at those schools.",
      population: "students in the district",
      clusters: "schools",
      reason: "Logistically simpler to test entire schools than random students across all schools"
    },
    {
      setup: "Researchers randomly select 4 beehives from a farm of 50 hives, then examine EVERY bee in those hives.",
      population: "bees on the farm",
      clusters: "beehives",
      reason: "Practical to examine entire hives rather than random bees from all hives"
    },
    {
      setup: "A pollster randomly selects 6 voting precincts and interviews ALL voters exiting those precincts.",
      population: "voters in the region",
      clusters: "voting precincts",
      reason: "More efficient to station workers at selected precincts than across all locations"
    }
  ],
  srs: [
    {
      setup: "A researcher assigns each of 500 households a number 1-500, uses a random number generator to select 50 numbers, and surveys those households.",
      population: "500 households",
      method: "random number generator, no grouping"
    },
    {
      setup: "Names of all 1,200 employees are put in a hat, and 60 names are drawn without looking.",
      population: "1,200 employees",
      method: "random drawing, no grouping"
    },
    {
      setup: "A spreadsheet lists all 800 customers; a random number generator selects 40 row numbers, and those customers are contacted.",
      population: "800 customers",
      method: "random selection from complete list"
    }
  ]
};

const dartboardScenarios = [
  { bias: "biased", var: "high", desc: "Darts are scattered in the upper-left corner, far from the bullseye." },
  { bias: "biased", var: "low", desc: "Darts are tightly clustered in the lower-right corner, far from the bullseye." },
  { bias: "unbiased", var: "high", desc: "Darts are scattered all around the bullseye, with the CENTER of the scatter at the bullseye." },
  { bias: "unbiased", var: "low", desc: "Darts are tightly clustered right at the bullseye." }
];

const samplingProblems = [
  {
    desc: "A mall surveys shoppers by standing at one entrance and asking people who walk by.",
    problem: "Convenience sampling—not random",
    fix: "Randomly select times and locations, or use a list of all shoppers",
    problemType: "bias"
  },
  {
    desc: "A city uses cluster sampling to estimate income, but wealthy and poor neighborhoods are very different from each other.",
    problem: "High variability—clusters are homogeneous within but different between",
    fix: "Use stratified sampling by neighborhood income level instead",
    problemType: "variability"
  },
  {
    desc: "A researcher emails a survey to all customers and analyzes whoever responds.",
    problem: "Voluntary response bias—only motivated people respond",
    fix: "Randomly select customers and follow up to ensure responses",
    problemType: "bias"
  }
];

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // ========== LEVEL 1: What is Bias? ==========
  if (modeId === "l01-vocab-bias") {
    context = {
      levelName: "Level 1: What is Bias?",
      problemText: "**Bias** and **variability** are two ways to evaluate sampling methods.\n\n" +
                   "• **Bias** asks: Are your estimates CENTERED at the true value?\n" +
                   "• **Variability** asks: How SPREAD OUT are your estimates?\n\n" +
                   "Think of accuracy vs. precision:\n" +
                   "• **Accuracy** = hitting the target (low bias)\n" +
                   "• **Precision** = shots close together (low variability)\n\n" +
                   "**Key insight:** Bias and accuracy are INVERSES. Low bias = high accuracy.",
      givenText: "Bias measures whether estimates are systematically off-center from the truth.",
      concept: "accuracy OR precision"
    };
    answers = { biasDefn: { value: "Accuracy", tolerance: 0 } };
    scenario = "Select what bias measures.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 2: What is Variability? ==========
  if (modeId === "l02-vocab-variability") {
    context = {
      levelName: "Level 2: What is Variability?",
      problemText: "**Variability** measures how SPREAD OUT your estimates are from each other.\n\n" +
                   "Imagine taking many samples and calculating the median each time:\n" +
                   "• **Low variability** = estimates cluster tightly together\n" +
                   "• **High variability** = estimates are scattered widely\n\n" +
                   "**Key insight:** Variability and precision are INVERSES. Low variability = high precision.\n\n" +
                   "The GOAL is: Low bias (accurate) AND low variability (precise).",
      givenText: "Variability measures how much estimates differ from sample to sample.",
      concept: "accuracy OR precision"
    };
    answers = { varDefn: { value: "Precision", tolerance: 0 } };
    scenario = "Select what variability measures.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 3: Inverse Relationships ==========
  if (modeId === "l03-inverse-relationships") {
    context = {
      levelName: "Level 3: Inverse Relationships",
      problemText: "**Critical vocabulary:** These pairs are INVERSES of each other.\n\n" +
                   "| Term | Inverse | Relationship |\n" +
                   "|------|---------|-------------|\n" +
                   "| Bias | Accuracy | Low bias = HIGH accuracy |\n" +
                   "| Variability | Precision | Low variability = HIGH precision |\n\n" +
                   "When someone says 'this method is accurate,' they mean it has LOW BIAS.\n" +
                   "When someone says 'this method is precise,' they mean it has LOW VARIABILITY.",
      givenText: "Complete the inverse relationships.",
      blank1: "___",
      blank2: "___",
      optA: "High",
      optB: "Low",
      optC: "High",
      optD: "Low"
    };
    answers = { 
      lowBias: { value: "High", tolerance: 0 },
      lowVar: { value: "High", tolerance: 0 }
    };
    scenario = "Low bias = ___ accuracy. Low variability = ___ precision.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 4: SRS Definition ==========
  if (modeId === "l04-srs-definition") {
    context = {
      levelName: "Level 4: What is an SRS?",
      problemText: "**Simple Random Sample (SRS)** is the most basic random sampling method.\n\n" +
                   "Definition: A sample where every **GROUP** of n individuals has an EQUAL chance of being selected.\n\n" +
                   "⚠️ Common misconception: It's NOT just 'every individual has equal chance.'\n" +
                   "It's 'every POSSIBLE GROUP of size n has equal chance.'\n\n" +
                   "**How to conduct an SRS:**\n" +
                   "1. Number all individuals 1 to N\n" +
                   "2. Use random number generator to pick n numbers\n" +
                   "3. Sample WITHOUT replacement (don't pick same person twice)",
      givenText: "SRS = every _____ of size n has equal chance of selection.",
      blank: "group, individual, cluster, or stratum",
      optA: "group",
      optB: "individual",
      optC: "cluster",
      optD: "stratum"
    };
    answers = { srsKey: { value: "group", tolerance: 0 } };
    scenario = "What has equal chance of selection in an SRS?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 5: Stratified Definition ==========
  if (modeId === "l05-stratified-definition") {
    context = {
      levelName: "Level 5: What is Stratified Sampling?",
      problemText: "**Stratified Random Sample:** Divide population into groups (STRATA), then take an SRS WITHIN EACH stratum.\n\n" +
                   "**Key features:**\n" +
                   "• You sample FROM EACH group (not entire groups)\n" +
                   "• Every stratum is represented in your final sample\n" +
                   "• Works best when strata are HOMOGENEOUS (similar within)\n\n" +
                   "**Example:** To survey a school, divide students by grade (9, 10, 11, 12), then randomly select 25 students FROM EACH grade.\n\n" +
                   "Result: Your sample includes students from every grade level.",
      givenText: "Stratified sampling takes an SRS _____ each stratum.",
      optA: "within",
      optB: "of entire",
      optC: "instead of"
    };
    answers = { stratHow: { value: "within", tolerance: 0 } };
    scenario = "How does stratified sampling work?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 6: Cluster Definition ==========
  if (modeId === "l06-cluster-definition") {
    context = {
      levelName: "Level 6: What is Cluster Sampling?",
      problemText: "**Cluster Random Sample:** Divide population into groups (CLUSTERS), randomly select SOME clusters, then sample ALL individuals in chosen clusters.\n\n" +
                   "**Key features:**\n" +
                   "• You select ENTIRE groups (not individuals within)\n" +
                   "• Only some clusters are in your sample\n" +
                   "• Works best when clusters are HETEROGENEOUS (mixed within)\n\n" +
                   "**Example:** To survey a city, randomly select 5 city blocks out of 100, then survey EVERY household on those 5 blocks.\n\n" +
                   "**Advantage:** Much easier than traveling to random houses across the whole city!",
      givenText: "Cluster sampling: select _____ clusters, sample _____ individuals in them.",
      optA: "some / all",
      optB: "all / some",
      optC: "some / some",
      optD: "all / all"
    };
    answers = { clusterHow: { value: "some / all", tolerance: 0 } };
    scenario = "How does cluster sampling work?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 7: Stratified vs Cluster - Ideal Groups ==========
  if (modeId === "l07-strat-vs-cluster-groups") {
    context = {
      levelName: "Level 7: When to Use Each Method",
      problemText: "**The key difference:** What kind of groups work best?\n\n" +
                   "| Method | Ideal Groups | Why |\n" +
                   "|--------|--------------|-----|\n" +
                   "| **Stratified** | HOMOGENEOUS (similar within) | Ensures representation; reduces variability |\n" +
                   "| **Cluster** | HETEROGENEOUS (mixed within) | Each cluster is a mini-population |\n\n" +
                   "**Memory trick:**\n" +
                   "• Strat-ified → Strata should be Sim-ilar (homogeneous)\n" +
                   "• Cluster → Clusters should be Complete mini-populations (heterogeneous)\n\n" +
                   "⚠️ Using cluster sampling when groups are homogeneous (but different from each other) leads to HIGH VARIABILITY!",
      givenText: "Match the ideal group type to each method.",
      optA: "Homogeneous",
      optB: "Heterogeneous",
      optC: "Heterogeneous",
      optD: "Homogeneous"
    };
    answers = { 
      stratIdeal: { value: "Homogeneous", tolerance: 0 },
      clusterIdeal: { value: "Heterogeneous", tolerance: 0 }
    };
    scenario = "Stratified works best when strata are ___. Cluster works best when clusters are ___.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 8: Identify the Method ==========
  if (modeId === "l08-identify-method") {
    const type = choice(["stratified", "cluster", "srs"]);
    let scen, correct;
    
    if (type === "stratified") {
      scen = choice(scenarios.stratified);
      correct = "Stratified random sample";
    } else if (type === "cluster") {
      scen = choice(scenarios.cluster);
      correct = "Cluster random sample";
    } else {
      scen = choice(scenarios.srs);
      correct = "Simple random sample (SRS)";
    }

    const options = shuffle([
      "Simple random sample (SRS)",
      "Stratified random sample",
      "Cluster random sample",
      "Systematic random sample"
    ]);

    context = {
      levelName: "Level 8: Identify the Method",
      problemText: "**Read the scenario and identify which sampling method is being used.**\n\n" +
                   "Quick review:\n" +
                   "• **SRS:** Random selection from whole population, no grouping\n" +
                   "• **Stratified:** Divide into groups → sample FROM EACH group\n" +
                   "• **Cluster:** Divide into groups → select ENTIRE groups\n" +
                   "• **Systematic:** Random start → every kth individual",
      givenText: scen.setup,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { methodId: { value: correct, tolerance: 0 } };
    scenario = "What sampling method is described?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 9: Identify Method (Harder) ==========
  if (modeId === "l09-identify-method-2") {
    // Use a different scenario than L8
    const type = choice(["stratified", "cluster"]);
    let scen, correct;
    
    if (type === "stratified") {
      scen = choice(scenarios.stratified);
      correct = "Stratified random sample";
    } else {
      scen = choice(scenarios.cluster);
      correct = "Cluster random sample";
    }

    const options = shuffle([
      "Simple random sample (SRS)",
      "Stratified random sample",
      "Cluster random sample",
      "Convenience sample"
    ]);

    context = {
      levelName: "Level 9: Identify Method (Tricky)",
      problemText: "**Stratified vs. Cluster—the key question:**\n\n" +
                   "Ask yourself: Did they sample SOME individuals from EACH group?\n" +
                   "• **YES** → Stratified (sample WITHIN each)\n" +
                   "• **NO, they took ENTIRE groups** → Cluster\n\n" +
                   "Look for these clues:\n" +
                   "• 'from each' or 'within each' → Stratified\n" +
                   "• 'all individuals in selected' or 'every person at' → Cluster",
      givenText: scen.setup,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { methodId2: { value: correct, tolerance: 0 } };
    scenario = "Identify the sampling method.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 10: Bias & Variability Combo ==========
  if (modeId === "l10-bias-variability-combo") {
    const methodType = choice(["srs", "stratified-good", "cluster-bad", "nonrandom"]);
    let methodDesc, biasAns, varAns, biasExplain, varExplain;

    if (methodType === "srs") {
      methodDesc = "A simple random sample of 200 households from a city of 50,000 households.";
      biasAns = "Low (unbiased)";
      varAns = "Moderate";
      biasExplain = "SRS is random, so unbiased";
      varExplain = "SRS has moderate variability—not optimized for any structure";
    } else if (methodType === "stratified-good") {
      methodDesc = "A stratified sample dividing a city by income level (low/medium/high), sampling 100 households from EACH level. Incomes are similar within each level.";
      biasAns = "Low (unbiased)";
      varAns = "Low";
      biasExplain = "Stratified with random selection is unbiased";
      varExplain = "Homogeneous strata → low variability";
    } else if (methodType === "cluster-bad") {
      methodDesc = "A cluster sample selecting 3 neighborhoods, surveying ALL households in them. The neighborhoods have very different income levels from each other.";
      biasAns = "Low (unbiased)";
      varAns = "High";
      biasExplain = "Random cluster selection is unbiased";
      varExplain = "Clusters differ from each other → high variability";
    } else {
      methodDesc = "A researcher surveys people at a shopping mall on Saturday afternoon.";
      biasAns = "High (biased)";
      varAns = "Unknown";
      biasExplain = "Convenience sample—not random, likely biased";
      varExplain = "Variability is hard to assess when method is biased";
    }

    context = {
      levelName: "Level 10: Bias & Variability Together",
      problemText: "**Evaluate both bias AND variability for this sampling method.**\n\n" +
                   "Remember:\n" +
                   "• **Bias** depends on whether selection is RANDOM\n" +
                   "• **Variability** depends on whether method matches population STRUCTURE\n\n" +
                   "Random methods → typically unbiased\n" +
                   "Stratified + homogeneous strata → low variability\n" +
                   "Cluster + heterogeneous clusters → low variability\n" +
                   "Cluster + homogeneous clusters (different from each other) → HIGH variability",
      givenText: methodDesc,
      blank1: "bias level",
      blank2: "variability level",
      optA: "Low (unbiased)",
      optB: "High (biased)",
      optC: "Low",
      optD: "High"
    };

    if (methodType === "nonrandom") {
      context.optC = "Unknown";
      context.optD = "High";
    } else if (methodType === "srs") {
      context.optC = "Low";
      context.optD = "Moderate";
    }

    answers = { 
      biasLevel: { value: biasAns, tolerance: 0 },
      varLevel: { value: varAns, tolerance: 0 }
    };
    scenario = "Assess bias and variability.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 11: Identify the Disadvantage ==========
  if (modeId === "l11-disadvantage") {
    const disadvType = choice(["srs", "stratified", "cluster"]);
    let methodDesc, correct, distractors;

    if (disadvType === "srs") {
      methodDesc = "A health department wants to survey households across a large rural county. They plan to use SRS, randomly selecting 500 households from the county's 20,000 households.";
      correct = "Difficult to implement—selected households may be spread across a huge area";
      distractors = [
        "Will produce biased results",
        "Won't represent all income levels",
        "Sample size is too small"
      ];
    } else if (disadvType === "stratified") {
      methodDesc = "A researcher wants to study commute times by dividing a state into 50 regions and sampling 20 workers from EACH region.";
      correct = "Complicated and expensive—must travel to all 50 regions";
      distractors = [
        "Will have high variability",
        "Not a random method",
        "Regions won't be represented"
      ];
    } else {
      methodDesc = "A school district uses cluster sampling, selecting 5 schools and testing ALL students. Academic performance varies greatly between schools (some are high-performing, others struggling).";
      correct = "High variability—schools differ from each other, so results depend heavily on which schools are selected";
      distractors = [
        "Will produce biased results",
        "Not enough students sampled",
        "Too expensive to implement"
      ];
    }

    const options = shuffle([correct, ...distractors]);

    context = {
      levelName: "Level 11: Identify the Disadvantage",
      problemText: "**Every sampling method has trade-offs.**\n\n" +
                   "| Method | Main Disadvantage |\n" +
                   "|--------|-------------------|\n" +
                   "| SRS | Can be hard to implement (scattered selections) |\n" +
                   "| Stratified | Complicated; must access all strata |\n" +
                   "| Cluster | High variability if clusters differ from each other |\n\n" +
                   "Read the scenario and identify the PRIMARY disadvantage:",
      givenText: methodDesc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3]
    };
    answers = { disadv: { value: correct, tolerance: 0 } };
    scenario = "What is the main disadvantage?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 12: Choose Best Method ==========
  if (modeId === "l12-choose-best-method") {
    const scenarioType = choice(["stratified-best", "cluster-best", "srs-best"]);
    let desc, bestMethod, whyBest, wrongMethods, wrongReasons;

    if (scenarioType === "stratified-best") {
      desc = "A company wants to survey employee satisfaction. Employees are in 5 departments, and satisfaction tends to be similar within each department but varies between departments.";
      bestMethod = "Stratified";
      whyBest = "Departments are homogeneous within—stratified reduces variability";
      wrongMethods = ["SRS", "Cluster"];
      wrongReasons = [
        "Cluster would have high variability since departments differ",
        "SRS is easy but won't optimize for department differences"
      ];
    } else if (scenarioType === "cluster-best") {
      desc = "Researchers want to study reading habits across a city. They have limited budget and can only visit a few locations. Each neighborhood has a diverse mix of residents.";
      bestMethod = "Cluster";
      whyBest = "Neighborhoods are heterogeneous (mixed)—practical and each cluster represents the whole";
      wrongMethods = ["Stratified", "SRS"];
      wrongReasons = [
        "Stratified requires visiting all areas—too expensive",
        "SRS would require traveling all over—impractical with limited budget"
      ];
    } else {
      desc = "A quality control inspector wants to test items from a factory production line. Items are produced uniformly with no meaningful groupings.";
      bestMethod = "SRS";
      whyBest = "No natural groupings exist—SRS is simplest and unbiased";
      wrongMethods = ["Stratified", "Cluster"];
      wrongReasons = [
        "No meaningful strata exist to stratify by",
        "No natural clusters—would have to create artificial groups"
      ];
    }

    const methodOptions = shuffle([bestMethod, ...wrongMethods]);
    const reasonOptions = shuffle([whyBest, ...wrongReasons]);

    context = {
      levelName: "Level 12: Choose the Best Method",
      problemText: "**Match the method to the situation.**\n\n" +
                   "Decision guide:\n" +
                   "• Groups are HOMOGENEOUS within? → **Stratified** (sample from each)\n" +
                   "• Groups are HETEROGENEOUS within? → **Cluster** (select entire groups)\n" +
                   "• No clear grouping structure? → **SRS** (keep it simple)\n" +
                   "• Practical constraints (budget, travel)? → **Cluster** may be necessary\n\n" +
                   "Read the scenario:",
      givenText: desc,
      optA: methodOptions[0],
      optB: methodOptions[1],
      optC: methodOptions[2],
      optE: reasonOptions[0],
      optF: reasonOptions[1],
      optG: reasonOptions[2]
    };
    answers = { 
      bestMethod: { value: bestMethod, tolerance: 0 },
      whyBest: { value: whyBest, tolerance: 0 }
    };
    scenario = "Which method is best, and why?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 13: Dartboard Analogy ==========
  if (modeId === "l13-dartboard-analogy") {
    const dart = choice(dartboardScenarios);
    
    context = {
      levelName: "Level 13: Dartboard Interpretation",
      problemText: "**The dartboard analogy for bias and variability:**\n\n" +
                   "Imagine throwing darts at a target. The bullseye = true population value.\n\n" +
                   "• **BIAS** = Where is the CENTER of your throws?\n" +
                   "  - Center at bullseye → Unbiased\n" +
                   "  - Center away from bullseye → Biased\n\n" +
                   "• **VARIABILITY** = How spread out are the throws?\n" +
                   "  - Tightly clustered → Low variability\n" +
                   "  - Scattered widely → High variability\n\n" +
                   "**Important:** A tight cluster OFF-CENTER is still BIASED (low variability, high bias)!",
      givenText: dart.desc,
      optA: "Biased",
      optB: "Unbiased",
      optC: "Low",
      optD: "High"
    };
    answers = { 
      dartBias: { value: dart.bias === "biased" ? "Biased" : "Unbiased", tolerance: 0 },
      dartVar: { value: dart.var === "low" ? "Low" : "High", tolerance: 0 }
    };
    scenario = "Interpret the dartboard.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 14: Fix the Sampling Problem ==========
  if (modeId === "l14-fix-the-sample") {
    const prob = choice(samplingProblems);
    
    const problemOptions = shuffle([
      prob.problem,
      "Sample size too small",
      "Wrong population targeted"
    ]);
    
    const fixOptions = shuffle([
      prob.fix,
      "Increase the sample size",
      "Change the research question"
    ]);

    context = {
      levelName: "Level 14: Fix the Sampling Problem",
      problemText: "**Diagnosing and fixing sampling problems:**\n\n" +
                   "Common issues:\n" +
                   "• **Bias problems:** Convenience sampling, voluntary response, undercoverage\n" +
                   "  → Fix: Use random selection methods\n\n" +
                   "• **Variability problems:** Cluster sampling when clusters differ\n" +
                   "  → Fix: Use stratified sampling instead\n\n" +
                   "• **Practical problems:** SRS hard to implement\n" +
                   "  → Fix: Use cluster sampling for convenience\n\n" +
                   "Read the scenario and diagnose the problem:",
      givenText: prob.desc,
      optA: problemOptions[0],
      optB: problemOptions[1],
      optC: problemOptions[2],
      optD: fixOptions[0],
      optE: fixOptions[1],
      optF: fixOptions[2]
    };
    answers = { 
      problem: { value: prob.problem, tolerance: 0 },
      fix: { value: prob.fix, tolerance: 0 }
    };
    scenario = "What's wrong and how would you fix it?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 15: Capstone ==========
  if (modeId === "l15-capstone") {
    const type = choice(["stratified", "cluster"]);
    const isStratified = type === "stratified";
    const scen = isStratified ? choice(scenarios.stratified) : choice(scenarios.cluster);
    
    const method = isStratified ? "Stratified random sample" : "Cluster random sample";
    const bias = "Unbiased";
    // For variability, stratified with homogeneous strata is LOW, cluster with homogeneous clusters (different between) is HIGH
    const variability = isStratified ? "Low" : "High";
    const better = isStratified ? 
      "No—stratified is ideal here because strata are homogeneous" :
      "Yes—stratified would reduce variability since groups differ";

    const methodOpts = shuffle([
      "Simple random sample (SRS)",
      "Stratified random sample",
      "Cluster random sample",
      "Systematic random sample"
    ]);

    context = {
      levelName: "Level 15: Capstone",
      problemText: "**Final challenge: Analyze this sampling scenario completely.**\n\n" +
                   "You'll need to:\n" +
                   "1. Identify the sampling method\n" +
                   "2. Determine if it's biased\n" +
                   "3. Assess expected variability\n" +
                   "4. Consider if a different method would be better\n\n" +
                   "Use everything you've learned!",
      givenText: scen.setup + (scen.reason ? "\n\nContext: " + scen.reason : ""),
      optA: methodOpts[0],
      optB: methodOpts[1],
      optC: methodOpts[2],
      optD: methodOpts[3],
      optE: "Biased",
      optF: "Unbiased",
      optG: "Low",
      optH: "Moderate",
      optI: "High",
      optJ: "No—current method is appropriate",
      optK: "Yes—stratified would reduce variability since groups differ",
      optL: "Yes—SRS would be simpler"
    };

    // Adjust the "better method" option based on scenario
    if (isStratified) {
      context.optJ = "No—stratified is ideal here because strata are homogeneous";
    }

    answers = { 
      capMethod: { value: method, tolerance: 0 },
      capBias: { value: bias, tolerance: 0 },
      capVar: { value: variability, tolerance: 0 },
      capBetter: { value: better, tolerance: 0 }
    };
    scenario = "Complete analysis of the sampling method.";
    return { context, graphConfig, answers, scenario };
  }

  // Fallback
  return {
    context: { levelName: "Unknown", problemText: "Level not implemented." },
    graphConfig: null,
    answers: {},
    scenario: ""
  };
}

export default { generateProblem };
