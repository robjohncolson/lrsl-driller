// generator.js - Collecting Data (Unit 3.1-3.3)
// Aligned with AP Statistics Course Framework

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

// ============ SCENARIO BANKS ============

// Level 1: Chance vs non-chance data collection
const chanceScenarios = [
  {
    desc: "A researcher uses a random number generator to select 100 households from a list of all 5,000 households in a town.",
    usesChance: true,
    why: "Random number generator = chance mechanism"
  },
  {
    desc: "A news website asks visitors to click a button to share their opinion on a political issue.",
    usesChance: false,
    why: "Voluntary response—no chance mechanism, only motivated people respond"
  },
  {
    desc: "A store manager surveys the first 20 customers who walk in on Monday morning.",
    usesChance: false,
    why: "Convenience sample—no randomness, just whoever showed up"
  },
  {
    desc: "Researchers assign 200 patients to treatment or control by flipping a coin for each patient.",
    usesChance: true,
    why: "Coin flip = chance mechanism for random assignment"
  },
  {
    desc: "A teacher collects data from all students in her 3rd period class to study high schoolers' sleep habits.",
    usesChance: false,
    why: "Convenience sample—just one available class, no random selection"
  },
  {
    desc: "Names of all employees are put in a hat, and 50 are drawn without looking.",
    usesChance: true,
    why: "Drawing from a hat = chance mechanism"
  },
  {
    desc: "A researcher posts a survey on social media asking people to share their exercise habits.",
    usesChance: false,
    why: "Voluntary response—only people who see and choose to respond"
  },
  {
    desc: "Every student ID in a school database is assigned a random number, and the 100 lowest numbers are selected.",
    usesChance: true,
    why: "Random number assignment = chance mechanism"
  }
];

// Level 2: Population vs Sample
const popSampleScenarios = [
  { desc: "All 1,247 students enrolled at Jefferson High School", type: "Population", why: "ALL students at the school" },
  { desc: "The 50 students randomly selected from Jefferson High to take a survey", type: "Sample", why: "A SUBSET of students selected from the school" },
  { desc: "Every registered voter in the United States", type: "Population", why: "ALL registered voters" },
  { desc: "The 1,500 voters contacted by a polling organization", type: "Sample", why: "A SUBSET of voters contacted" },
  { desc: "The 30 patients in a clinical trial testing a new medication", type: "Sample", why: "A SUBSET of all possible patients" },
  { desc: "All widgets produced by a factory in one year", type: "Population", why: "ALL widgets produced" },
  { desc: "The 200 widgets pulled from the assembly line for quality testing", type: "Sample", why: "A SUBSET of widgets tested" },
  { desc: "Every tree in Yellowstone National Park", type: "Population", why: "ALL trees in the park" },
  { desc: "The 500 trees measured by forest researchers", type: "Sample", why: "A SUBSET of trees measured" },
  { desc: "All emails received by a company's customer service in March", type: "Population", why: "ALL emails received" }
];

// Level 3: Observational vs Experiment
const obsExpScenarios = [
  {
    desc: "Researchers track 10,000 people for 20 years, recording their exercise habits and heart disease rates.",
    type: "Observational study",
    why: "No treatments assigned—just observing existing behaviors"
  },
  {
    desc: "Scientists randomly assign 200 mice to receive either a new drug or a placebo, then measure tumor growth.",
    type: "Experiment",
    why: "Treatments (drug vs placebo) are assigned by researchers"
  },
  {
    desc: "A survey asks college students about their coffee consumption and GPA.",
    type: "Observational study",
    why: "No treatments—just collecting data on existing habits and outcomes"
  },
  {
    desc: "A company randomly divides its website visitors into two groups: one sees a red 'Buy' button, one sees a green 'Buy' button. Researchers measure click rates.",
    type: "Experiment",
    why: "Treatments (button color) are randomly assigned"
  },
  {
    desc: "Medical records are examined to compare cancer rates between smokers and non-smokers.",
    type: "Observational study",
    why: "Retrospective—looking at existing data, no treatments imposed"
  },
  {
    desc: "Volunteers are randomly assigned to either a meditation program or a waitlist control, then anxiety levels are measured.",
    type: "Experiment",
    why: "Treatments (meditation vs control) are randomly assigned"
  },
  {
    desc: "Researchers survey farmers about pesticide use and compare crop yields.",
    type: "Observational study",
    why: "No random assignment—farmers chose their own pesticide use"
  },
  {
    desc: "A psychology study randomly assigns participants to memorize words in either a quiet room or a room with background music.",
    type: "Experiment",
    why: "Treatments (quiet vs music) are randomly assigned"
  }
];

// Level 4-5: Random selection and assignment scenarios
const inferenceScenarios = [
  {
    desc: "A polling organization uses random digit dialing to contact 1,000 U.S. adults and asks about their voting intentions. Results: 52% support Candidate A.",
    randomSelection: true,
    randomAssignment: false,
    isExperiment: false,
    population: "all U.S. adults"
  },
  {
    desc: "Researchers randomly select 500 patients from a hospital's database, then randomly assign half to receive a new treatment and half to receive standard care.",
    randomSelection: true,
    randomAssignment: true,
    isExperiment: true,
    population: "patients at that hospital"
  },
  {
    desc: "A professor studies whether sitting in the front row affects grades by comparing students who chose front seats to those who chose back seats.",
    randomSelection: false,
    randomAssignment: false,
    isExperiment: false,
    population: "students in the class"
  },
  {
    desc: "Volunteers sign up for a study. Researchers randomly assign them to either a low-carb or low-fat diet and measure weight loss after 6 months.",
    randomSelection: false,
    randomAssignment: true,
    isExperiment: true,
    population: "the volunteers (not generalizable beyond them)"
  },
  {
    desc: "A school district randomly selects 10 schools, then surveys ALL teachers at those schools about job satisfaction.",
    randomSelection: true,
    randomAssignment: false,
    isExperiment: false,
    population: "teachers in the district"
  },
  {
    desc: "A company emails a survey to all customers who made a purchase last month. 15% respond.",
    randomSelection: false,
    randomAssignment: false,
    isExperiment: false,
    population: "customers who respond (nonresponse bias)"
  }
];

// Level 7-13: Sampling method scenarios
const samplingScenarios = {
  srs: [
    {
      desc: "A quality control manager numbers all 10,000 items produced today, uses a random number generator to select 100 numbers, and inspects those items.",
      advantage: "Simple to understand and implement; every item has equal chance"
    },
    {
      desc: "A researcher puts the names of all 800 employees in a computer, which randomly selects 40 for a survey.",
      advantage: "Unbiased; gives every employee equal probability of selection"
    },
    {
      desc: "Slips of paper with student IDs are placed in a box. The principal draws 25 slips without looking to select students for a focus group.",
      advantage: "Fair; every student has the same chance of being selected"
    }
  ],
  stratified: [
    {
      desc: "A university divides students into freshmen, sophomores, juniors, and seniors, then randomly selects 50 students FROM EACH class year.",
      advantage: "Ensures all class years are represented; can compare between groups",
      strata: "class year"
    },
    {
      desc: "A polling organization divides voters into Democrats, Republicans, and Independents, then randomly samples 300 FROM EACH group.",
      advantage: "Guarantees representation of all political groups; reduces variability",
      strata: "political affiliation"
    },
    {
      desc: "A company divides employees by department (Sales, Engineering, HR, Marketing) and randomly selects 20 FROM EACH department for a survey.",
      advantage: "Ensures every department is represented in the sample",
      strata: "department"
    },
    {
      desc: "Researchers divide a forest into low, medium, and high elevation zones, then randomly sample 40 trees FROM EACH zone.",
      advantage: "Accounts for elevation differences; ensures coverage of all conditions",
      strata: "elevation zone"
    }
  ],
  cluster: [
    {
      desc: "A school district randomly selects 5 schools out of 30, then surveys ALL students at those 5 schools.",
      advantage: "More practical—don't need to visit all 30 schools",
      clusters: "schools"
    },
    {
      desc: "A city randomly selects 8 blocks out of 200, then interviews EVERY household on those 8 blocks.",
      advantage: "Cheaper and easier—interviewers only go to 8 locations",
      clusters: "city blocks"
    },
    {
      desc: "Researchers randomly choose 4 beehives from a farm of 50, then examine ALL bees in those hives.",
      advantage: "Practical—easier to examine entire hives than catch random bees",
      clusters: "beehives"
    },
    {
      desc: "An airline randomly selects 10 flights on a given day and surveys ALL passengers on those flights.",
      advantage: "Convenient—survey team only needs to be on 10 flights",
      clusters: "flights"
    }
  ],
  systematic: [
    {
      desc: "A factory inspector starts at a random item on the assembly line, then checks every 50th item.",
      advantage: "Easy to implement; spreads sample across the production run"
    },
    {
      desc: "A researcher numbers all patients on a list, picks a random starting point, then selects every 10th patient.",
      advantage: "Simple to execute; ensures even spacing through the list"
    },
    {
      desc: "Poll workers select every 5th voter exiting the polling place, starting with a randomly chosen number 1-5.",
      advantage: "Quick and systematic; doesn't require a complete list upfront"
    }
  ],
  census: [
    {
      desc: "The U.S. government attempts to count every person living in the country.",
      advantage: "Complete information—no sampling error"
    },
    {
      desc: "A small company surveys all 45 of its employees about workplace satisfaction.",
      advantage: "With a small population, it's feasible to include everyone"
    },
    {
      desc: "A teacher collects homework scores from every student in the class.",
      advantage: "For small groups, getting data from everyone is straightforward"
    }
  ]
};

// ============ GENERATOR FUNCTION ============

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // ========== LEVEL 1: Why Does Chance Matter? (Topic 3.1) ==========
  if (modeId === "l01-chance-matters") {
    const scen = choice(chanceScenarios);

    context = {
      topicId: "3.1",
      problemText: "**VAR-1.E:** Methods for data collection that do NOT rely on chance result in untrustworthy conclusions.\n\n" +
                   "**Key question:** Does this method use a CHANCE mechanism (randomness)?\n\n" +
                   "Examples of chance mechanisms:\n" +
                   "• Random number generator\n" +
                   "• Drawing names from a hat\n" +
                   "• Flipping a coin\n" +
                   "• Random digit dialing\n\n" +
                   "NOT chance mechanisms:\n" +
                   "• Volunteers choosing to participate\n" +
                   "• Whoever happens to be available\n" +
                   "• First people to respond",
      givenText: scen.desc,
      chanceTrust: { value: scen.usesChance ? "Yes" : "No" }
    };
    answers = { chanceTrust: { value: scen.usesChance ? "Yes" : "No" } };
    scenario = "Does this data collection method use chance?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 2: Population vs Sample (Topic 3.2) ==========
  if (modeId === "l02-population-sample") {
    const scen = choice(popSampleScenarios);

    context = {
      topicId: "3.2",
      problemText: "**DAT-2.A.1:** A **population** consists of ALL items or subjects of interest.\n\n" +
                   "**DAT-2.A.2:** A **sample** is a SUBSET of the population selected for study.\n\n" +
                   "**Key distinction:**\n" +
                   "• Population = the ENTIRE group you want to learn about\n" +
                   "• Sample = the PART of the group you actually collect data from\n\n" +
                   "**Example:**\n" +
                   "• Population: All registered voters in Texas\n" +
                   "• Sample: The 1,200 voters surveyed by a polling organization",
      givenText: scen.desc,
      popOrSample: { value: scen.type }
    };
    answers = { popOrSample: { value: scen.type } };
    scenario = "Is this a population or a sample?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 3: Observational vs Experiment (Topic 3.2) ==========
  if (modeId === "l03-obs-vs-exp") {
    const scen = choice(obsExpScenarios);

    context = {
      topicId: "3.2",
      problemText: "**DAT-2.A.3:** In an **observational study**, treatments are NOT imposed. Researchers just observe/record what already exists.\n\n" +
                   "**DAT-2.A.4:** In an **experiment**, researchers ASSIGN different treatments to experimental units.\n\n" +
                   "**Key question:** Did researchers IMPOSE/ASSIGN treatments, or just OBSERVE?\n\n" +
                   "• Survey about existing habits → Observational\n" +
                   "• Randomly assign to treatment groups → Experiment\n" +
                   "• Compare people who chose different behaviors → Observational\n" +
                   "• Researcher decides who gets what → Experiment",
      givenText: scen.desc,
      studyType: { value: scen.type }
    };
    answers = { studyType: { value: scen.type } };
    scenario = "Observational study or experiment?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 4: Random Selection → Generalization (Topic 3.2) ==========
  if (modeId === "l04-random-selection") {
    const scen = choice(inferenceScenarios);
    const canGen = scen.randomSelection ? "Yes" : "No";

    const correctReason = scen.randomSelection
      ? "Random selection gives every member a chance to be in the sample"
      : "Without random selection, the sample may not represent the population";

    const wrongReasons = scen.randomSelection
      ? ["The sample size is large enough", "The researchers are unbiased"]
      : ["The sample size is too small", "The study took too long"];

    const reasonOptions = shuffle([correctReason, ...wrongReasons]);

    context = {
      topicId: "3.2",
      problemText: "**DAT-2.B.1:** It is only appropriate to GENERALIZE to a population if the sample was RANDOMLY SELECTED from that population.\n\n" +
                   "**Random Selection** = using chance to choose WHO is in the study\n\n" +
                   "✓ Random selection → Can generalize to the population\n" +
                   "✗ No random selection → Can only describe those in the study\n\n" +
                   "**Common non-random methods (can't generalize):**\n" +
                   "• Volunteers who sign up\n" +
                   "• Convenience samples\n" +
                   "• People who choose to respond",
      givenText: scen.desc,
      optA: reasonOptions[0],
      optB: reasonOptions[1],
      optC: reasonOptions[2],
      canGeneralize: { value: canGen },
      whyGeneralize: { value: correctReason }
    };
    answers = {
      canGeneralize: { value: canGen },
      whyGeneralize: { value: correctReason }
    };
    scenario = "Can we generalize to the population?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 5: Random Assignment → Causation (Topic 3.2) ==========
  if (modeId === "l05-random-assignment") {
    const scen = choice(inferenceScenarios.filter(s => s.isExperiment !== undefined));
    const canCause = scen.randomAssignment ? "Yes" : "No";

    const correctReason = scen.randomAssignment
      ? "Random assignment balances confounding variables across groups"
      : "Without random assignment, confounding variables may explain differences";

    const wrongReasons = scen.randomAssignment
      ? ["The sample was randomly selected", "The study had many participants"]
      : ["The researchers were careful", "The measurements were accurate"];

    const reasonOptions = shuffle([correctReason, ...wrongReasons]);

    context = {
      topicId: "3.2",
      problemText: "**DAT-2.B.3:** It is NOT possible to determine CAUSAL relationships from observational studies.\n\n" +
                   "**Random Assignment** = using chance to decide WHO GETS WHICH TREATMENT\n\n" +
                   "✓ Random assignment → Can establish causation\n" +
                   "✗ No random assignment → Can only show association\n\n" +
                   "**Why random assignment matters:**\n" +
                   "It balances CONFOUNDING VARIABLES across groups, so any difference in outcomes can be attributed to the treatment.\n\n" +
                   "**Note:** Only EXPERIMENTS can have random assignment. Observational studies never do.",
      givenText: scen.desc,
      optA: reasonOptions[0],
      optB: reasonOptions[1],
      optC: reasonOptions[2],
      canCause: { value: canCause },
      whyCause: { value: correctReason }
    };
    answers = {
      canCause: { value: canCause },
      whyCause: { value: correctReason }
    };
    scenario = "Can we conclude causation?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 6: Scope of Inference 2x2 (Topic 3.2) ==========
  if (modeId === "l06-scope-of-inference") {
    const scen = choice(inferenceScenarios);

    context = {
      topicId: "3.2",
      problemText: "**The Scope of Inference 2×2 Table:**\n\n" +
                   "| | Random Selection? YES | Random Selection? NO |\n" +
                   "|---|---|---|\n" +
                   "| **Random Assignment? YES** | Generalize + Causation | Causation only |\n" +
                   "| **Random Assignment? NO** | Generalize only | Neither |\n\n" +
                   "**Two separate questions:**\n" +
                   "1. **Generalize?** → Was there RANDOM SELECTION from the population?\n" +
                   "2. **Causation?** → Was there RANDOM ASSIGNMENT of treatments?\n\n" +
                   "These are INDEPENDENT. A study can have one, both, or neither!",
      givenText: scen.desc,
      generalize: { value: scen.randomSelection ? "Yes" : "No" },
      causation: { value: scen.randomAssignment ? "Yes" : "No" }
    };
    answers = {
      generalize: { value: scen.randomSelection ? "Yes" : "No" },
      causation: { value: scen.randomAssignment ? "Yes" : "No" }
    };
    scenario = "Apply the scope of inference framework.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 7: SRS Definition (Topic 3.3) ==========
  if (modeId === "l07-srs-definition") {
    const options = shuffle(["group", "individual", "cluster", "stratum"]);

    context = {
      topicId: "3.3",
      problemText: "**DAT-2.C.2:** A **Simple Random Sample (SRS)** is a sample in which every GROUP of a given size has an equal chance of being chosen.\n\n" +
                   "⚠️ **Common misconception:** SRS is NOT just 'every individual has equal chance.'\n\n" +
                   "The key requirement: every POSSIBLE GROUP of n individuals has equal probability.\n\n" +
                   "**How to get an SRS:**\n" +
                   "• Number all individuals 1 to N\n" +
                   "• Use random number generator to pick n numbers\n" +
                   "• Table of random digits\n" +
                   "• Draw names from a hat (without replacement)",
      givenText: "In an SRS, every _____ of size n has an equal chance of being selected.",
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      srsKey: { value: "group" }
    };
    answers = { srsKey: { value: "group" } };
    scenario = "Complete the SRS definition.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 8: Stratified Definition (Topic 3.3) ==========
  if (modeId === "l08-stratified-definition") {
    const options = shuffle([
      "Take an SRS from EACH group",
      "Randomly select some groups and sample ALL in them",
      "Select every nth individual from each group"
    ]);

    context = {
      topicId: "3.3",
      problemText: "**DAT-2.C.3:** A **Stratified Random Sample** involves:\n" +
                   "1. Divide population into separate groups called STRATA\n" +
                   "2. Take an SRS FROM EACH stratum\n" +
                   "3. Combine selected units to form the sample\n\n" +
                   "**Key feature:** Sample includes individuals from EVERY stratum.\n\n" +
                   "**When to use:** When the population has distinct subgroups that may differ, and you want to ensure all subgroups are represented.\n\n" +
                   "**Example:** Stratify voters by age group (18-29, 30-44, 45-64, 65+) and sample from EACH.",
      givenText: "In stratified sampling, you divide into groups based on shared characteristics, then:",
      optA: options[0],
      optB: options[1],
      optC: options[2],
      stratKey: { value: "Take an SRS from EACH group" }
    };
    answers = { stratKey: { value: "Take an SRS from EACH group" } };
    scenario = "How does stratified sampling work?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 9: Cluster Definition (Topic 3.3) ==========
  if (modeId === "l09-cluster-definition") {
    const options = shuffle([
      "Randomly select SOME groups, sample ALL in selected groups",
      "Take an SRS from EACH group",
      "Select every nth group"
    ]);

    context = {
      topicId: "3.3",
      problemText: "**DAT-2.C.4:** A **Cluster Random Sample** involves:\n" +
                   "1. Divide population into groups called CLUSTERS\n" +
                   "2. Randomly select SOME clusters\n" +
                   "3. Sample ALL individuals in selected clusters\n\n" +
                   "**Key feature:** Only SOME clusters are in the sample, but you take EVERYONE from chosen clusters.\n\n" +
                   "**When to use:** When it's impractical or expensive to sample across the whole population, but you can easily access entire groups.\n\n" +
                   "**Example:** Randomly select 5 schools from a district, survey ALL students at those 5 schools.",
      givenText: "In cluster sampling, you divide into groups, then:",
      optA: options[0],
      optB: options[1],
      optC: options[2],
      clusterKey: { value: "Randomly select SOME groups, sample ALL in selected groups" }
    };
    answers = { clusterKey: { value: "Randomly select SOME groups, sample ALL in selected groups" } };
    scenario = "How does cluster sampling work?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 10: Stratified vs Cluster (Topic 3.3) ==========
  if (modeId === "l10-strat-vs-cluster") {
    context = {
      topicId: "3.3",
      problemText: "**Stratified vs Cluster: The Key Difference**\n\n" +
                   "| Aspect | Stratified | Cluster |\n" +
                   "|--------|------------|--------|\n" +
                   "| Groups used | Strata (homogeneous within) | Clusters (heterogeneous within) |\n" +
                   "| How many groups in sample? | ALL groups | SOME groups |\n" +
                   "| How many individuals per group? | SOME (SRS from each) | ALL (everyone in selected clusters) |\n\n" +
                   "**Ideal group types:**\n" +
                   "• **Stratified** works best when strata are HOMOGENEOUS (similar within each stratum)\n" +
                   "• **Cluster** works best when clusters are HETEROGENEOUS (each cluster is like a mini-population)\n\n" +
                   "**Memory trick:** Strata = Similar within. Clusters = Complete mini-populations.",
      givenText: "Match the ideal group characteristics to each method.",
      optA: "Homogeneous (similar within each group)",
      optB: "Heterogeneous (diverse within each group)",
      optC: "Heterogeneous (diverse within each group)",
      optD: "Homogeneous (similar within each group)",
      stratIdeal: { value: "Homogeneous (similar within each group)" },
      clusterIdeal: { value: "Heterogeneous (diverse within each group)" }
    };
    answers = {
      stratIdeal: { value: "Homogeneous (similar within each group)" },
      clusterIdeal: { value: "Heterogeneous (diverse within each group)" }
    };
    scenario = "Stratified works best when groups are ___. Cluster works best when groups are ___.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 11: Systematic & Census (Topic 3.3) ==========
  if (modeId === "l11-systematic-census") {
    const type = choice(["systematic", "census"]);
    const scen = choice(samplingScenarios[type]);
    const correct = type === "systematic" ? "Systematic random sample" : "Census";

    const options = shuffle([
      "Simple random sample (SRS)",
      "Systematic random sample",
      "Census",
      "Cluster random sample"
    ]);

    context = {
      topicId: "3.3",
      problemText: "**DAT-2.C.5:** A **Systematic Random Sample**:\n" +
                   "• Random starting point\n" +
                   "• Then select every kth individual\n" +
                   "• Example: Start at random, then every 10th person\n\n" +
                   "**DAT-2.C.6:** A **Census**:\n" +
                   "• Selects ALL items/subjects in the population\n" +
                   "• Not sampling—you get data from everyone\n" +
                   "• Feasible only for small populations\n\n" +
                   "**When to use each:**\n" +
                   "• Systematic: Easy to implement, no complete list needed upfront\n" +
                   "• Census: Small population, want complete information",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      methodType: { value: correct }
    };
    answers = { methodType: { value: correct } };
    scenario = "What method is described?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 12: Identify the Method (Topic 3.3) ==========
  if (modeId === "l12-identify-method") {
    const type = choice(["srs", "stratified", "cluster", "systematic"]);
    const scen = choice(samplingScenarios[type]);
    const methodNames = {
      srs: "Simple random sample (SRS)",
      stratified: "Stratified random sample",
      cluster: "Cluster random sample",
      systematic: "Systematic random sample"
    };
    const correct = methodNames[type];

    const options = shuffle([
      "Simple random sample (SRS)",
      "Stratified random sample",
      "Cluster random sample",
      "Systematic random sample"
    ]);

    context = {
      topicId: "3.3",
      problemText: "**Identify the sampling method from the description.**\n\n" +
                   "**Quick reference:**\n" +
                   "• **SRS:** Random selection from whole population, no grouping\n" +
                   "• **Stratified:** Divide into groups → sample FROM EACH group\n" +
                   "• **Cluster:** Divide into groups → select ENTIRE groups\n" +
                   "• **Systematic:** Random start → every kth individual\n\n" +
                   "**Key phrases to look for:**\n" +
                   "• 'from each' or 'within each' → Stratified\n" +
                   "• 'all in selected' or 'every person at' → Cluster\n" +
                   "• 'every 5th' or 'every 10th' → Systematic\n" +
                   "• Random selection, no grouping → SRS",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      methodId: { value: correct }
    };
    answers = { methodId: { value: correct } };
    scenario = "What sampling method is being used?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 13: Why This Method? (Topic 3.3) ==========
  if (modeId === "l13-why-method") {
    const type = choice(["srs", "stratified", "cluster"]);
    const scen = choice(samplingScenarios[type]);
    const methodNames = {
      srs: "Simple random sample (SRS)",
      stratified: "Stratified random sample",
      cluster: "Cluster random sample"
    };
    const correct = methodNames[type];

    const methodOptions = shuffle([
      "Simple random sample (SRS)",
      "Stratified random sample",
      "Cluster random sample",
      "Systematic random sample"
    ]);

    const advantageOptions = shuffle([
      scen.advantage,
      "It's the only unbiased method",
      "It always has the lowest cost"
    ]);

    context = {
      topicId: "3.3",
      problemText: "**DAT-2.D.1:** There are advantages and disadvantages for each sampling method depending on:\n" +
                   "• The question to be answered\n" +
                   "• The population structure\n" +
                   "• Resources available\n\n" +
                   "**Advantages by method:**\n" +
                   "• **SRS:** Simple, unbiased, foundation for other methods\n" +
                   "• **Stratified:** Ensures subgroup representation, can reduce variability\n" +
                   "• **Cluster:** Practical, cost-effective, easier logistics\n" +
                   "• **Systematic:** Easy to implement, no complete list needed upfront",
      givenText: scen.desc,
      optA: methodOptions[0],
      optB: methodOptions[1],
      optC: methodOptions[2],
      optD: methodOptions[3],
      optE: advantageOptions[0],
      optF: advantageOptions[1],
      optG: advantageOptions[2],
      methodId2: { value: correct },
      advantage: { value: scen.advantage }
    };
    answers = {
      methodId2: { value: correct },
      advantage: { value: scen.advantage }
    };
    scenario = "What method is used, and what's an advantage here?";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 14: Capstone - Sampling Methods ==========
  if (modeId === "l14-capstone-sampling") {
    const type = choice(["srs", "stratified", "cluster"]);
    const scen = choice(samplingScenarios[type]);
    const methodNames = {
      srs: "Simple random sample (SRS)",
      stratified: "Stratified random sample",
      cluster: "Cluster random sample"
    };
    const correct = methodNames[type];
    const canGen = "Yes"; // All these are random methods
    const whyGen = "Random selection gives every member a chance to be selected";

    const methodOptions = shuffle([
      "Simple random sample (SRS)",
      "Stratified random sample",
      "Cluster random sample",
      "Convenience sample"
    ]);

    const whyOptions = shuffle([
      whyGen,
      "The sample size is large",
      "The researchers are experts"
    ]);

    context = {
      topicId: "3.3",
      problemText: "**Capstone: Sampling Methods**\n\n" +
                   "For this scenario:\n" +
                   "1. Identify the sampling method\n" +
                   "2. Determine if results can generalize\n" +
                   "3. Explain why\n\n" +
                   "Remember: Random sampling methods (SRS, stratified, cluster, systematic) allow generalization to the population. Non-random methods (convenience, voluntary response) do not.",
      givenText: scen.desc,
      optA: methodOptions[0],
      optB: methodOptions[1],
      optC: methodOptions[2],
      optD: methodOptions[3],
      optE: whyOptions[0],
      optF: whyOptions[1],
      optG: whyOptions[2],
      capMethod: { value: correct },
      capGeneralize: { value: canGen },
      capWhy: { value: whyGen }
    };
    answers = {
      capMethod: { value: correct },
      capGeneralize: { value: canGen },
      capWhy: { value: whyGen }
    };
    scenario = "Complete analysis of the sampling scenario.";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 15: Full Capstone (Unit 3.1-3.3) ==========
  if (modeId === "l15-capstone-full") {
    const scen = choice(inferenceScenarios);
    const studyType = scen.isExperiment ? "Experiment" : "Observational study";
    const method = scen.randomSelection
      ? "Random selection from population"
      : (scen.randomAssignment ? "Random assignment to groups" : "Non-random (convenience/volunteer)");

    const methodOptions = shuffle([
      "Random selection from population",
      "Random assignment to groups",
      "Non-random (convenience/volunteer)",
      "Systematic selection"
    ]);

    context = {
      topicId: "3.1-3.3",
      problemText: "**Unit 3.1-3.3 Capstone**\n\n" +
                   "Apply everything you've learned:\n\n" +
                   "1. **Study type:** Observational or Experiment?\n" +
                   "   - Were treatments ASSIGNED? → Experiment\n" +
                   "   - Just observing? → Observational\n\n" +
                   "2. **Method:** How were participants selected/assigned?\n\n" +
                   "3. **Generalize?** Random SELECTION from population?\n\n" +
                   "4. **Causation?** Random ASSIGNMENT of treatments?",
      givenText: scen.desc,
      optA: methodOptions[0],
      optB: methodOptions[1],
      optC: methodOptions[2],
      optD: methodOptions[3],
      studyType2: { value: studyType },
      capMethod2: { value: method },
      capGen2: { value: scen.randomSelection ? "Yes" : "No" },
      capCause2: { value: scen.randomAssignment ? "Yes" : "No" }
    };
    answers = {
      studyType2: { value: studyType },
      capMethod2: { value: method },
      capGen2: { value: scen.randomSelection ? "Yes" : "No" },
      capCause2: { value: scen.randomAssignment ? "Yes" : "No" }
    };
    scenario = "Complete scope of inference analysis.";
    return { context, graphConfig, answers, scenario };
  }

  // Fallback
  return {
    context: { topicId: "?", problemText: "Level not implemented.", givenText: "" },
    graphConfig: null,
    answers: {},
    scenario: ""
  };
}

export default { generateProblem };
