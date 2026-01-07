// generator.js - Collecting Data (Unit 3.1-3.4)
// Aligned with AP Statistics Course Framework

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

// ============ SHUFFLE BAG SYSTEM ============
// Prevents scenario repeats by cycling through all scenarios before any repeat
// Each scenario bank gets its own bag that refills when empty

const shuffleBags = {};  // Stores bags per scenario bank

function getShuffleBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    // Refill with shuffled copy of source array
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName];
}

function drawFromBag(bankName, sourceArray) {
  const bag = getShuffleBag(bankName, sourceArray);
  return bag.pop();  // Draw from end (most efficient)
}

// Legacy choice function - still used for non-scenario selections
function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
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

// Level 7: SRS definition questions (variety)
const srsDefinitionQuestions = [
  {
    question: "In an SRS, every _____ of size n has an equal chance of being selected.",
    answer: "group",
    options: ["group", "individual", "cluster", "stratum"]
  },
  {
    question: "What makes an SRS different from just giving every individual an equal chance?",
    answer: "Every possible combination of n individuals must have equal probability",
    options: [
      "Every possible combination of n individuals must have equal probability",
      "The sample size must be at least 30",
      "The population must be divided into groups first",
      "Individuals must volunteer to participate"
    ]
  },
  {
    question: "A researcher numbers all 500 employees 1-500 and uses a random number generator to pick 50. This is an SRS because:",
    answer: "Every group of 50 employees has the same chance of being selected",
    options: [
      "Every group of 50 employees has the same chance of being selected",
      "Every employee has a 10% chance of being selected",
      "The researcher used technology",
      "The sample is large enough"
    ]
  },
  {
    question: "Which statement correctly describes an SRS?",
    answer: "Every possible sample of size n has equal probability of selection",
    options: [
      "Every possible sample of size n has equal probability of selection",
      "Every individual has equal probability of selection",
      "The first n individuals are selected",
      "Individuals are selected based on convenience"
    ]
  }
];

// Level 8: Stratified definition questions (variety)
const stratifiedDefinitionQuestions = [
  {
    question: "In stratified sampling, you divide into groups based on shared characteristics, then:",
    answer: "Take an SRS from EACH group",
    options: [
      "Take an SRS from EACH group",
      "Randomly select some groups and sample ALL in them",
      "Select every nth individual from each group"
    ]
  },
  {
    question: "A university wants to survey students. They divide by class year (freshman, sophomore, junior, senior) and randomly select 25 FROM EACH. This is stratified because:",
    answer: "They sampled from ALL groups (every class year is represented)",
    options: [
      "They sampled from ALL groups (every class year is represented)",
      "They selected entire class years",
      "They used a systematic approach"
    ]
  },
  {
    question: "What is the KEY feature that identifies stratified sampling?",
    answer: "Sample FROM EACH group, not entire groups",
    options: [
      "Sample FROM EACH group, not entire groups",
      "Select SOME groups and take everyone in them",
      "Sample size must be equal in all groups"
    ]
  },
  {
    question: "Stratified sampling ensures representation by:",
    answer: "Including individuals from every stratum in the sample",
    options: [
      "Including individuals from every stratum in the sample",
      "Selecting entire groups at random",
      "Using systematic selection within groups"
    ]
  }
];

// Level 9: Cluster definition questions (variety)
const clusterDefinitionQuestions = [
  {
    question: "In cluster sampling, you divide into groups, then:",
    answer: "Randomly select SOME groups, sample ALL in selected groups",
    options: [
      "Randomly select SOME groups, sample ALL in selected groups",
      "Take an SRS from EACH group",
      "Select every nth group"
    ]
  },
  {
    question: "A researcher randomly selects 5 schools from 50 and surveys ALL students at those 5 schools. This is cluster sampling because:",
    answer: "Entire groups (schools) were selected, and everyone in them was sampled",
    options: [
      "Entire groups (schools) were selected, and everyone in them was sampled",
      "Students from every school are represented",
      "The schools were divided by region"
    ]
  },
  {
    question: "What is the KEY feature that identifies cluster sampling?",
    answer: "Select SOME groups, take ALL individuals from selected groups",
    options: [
      "Select SOME groups, take ALL individuals from selected groups",
      "Sample from EACH group in the population",
      "Every individual has equal probability"
    ]
  },
  {
    question: "Cluster sampling is often used because:",
    answer: "It's more practical when the population is spread across many locations",
    options: [
      "It's more practical when the population is spread across many locations",
      "It always gives more accurate results",
      "It ensures every subgroup is represented"
    ]
  }
];

// Level 10: Stratified vs Cluster comparison questions (variety)
// Each question has paired questions about stratified and cluster with consistent format
const stratVsClusterQuestions = [
  {
    // Focus: How many GROUPS are used in the sample?
    stratQuestion: "In STRATIFIED sampling, how many groups end up in the sample?",
    stratAnswer: "ALL groups",
    stratOptions: ["ALL groups", "SOME groups"],
    clusterQuestion: "In CLUSTER sampling, how many groups end up in the sample?",
    clusterAnswer: "SOME groups",
    clusterOptions: ["ALL groups", "SOME groups"]
  },
  {
    // Focus: How many INDIVIDUALS from each group?
    stratQuestion: "In STRATIFIED sampling, how many individuals are taken from each group?",
    stratAnswer: "SOME (a random sample)",
    stratOptions: ["SOME (a random sample)", "ALL (everyone)"],
    clusterQuestion: "In CLUSTER sampling, how many individuals are taken from selected groups?",
    clusterAnswer: "ALL (everyone)",
    clusterOptions: ["SOME (a random sample)", "ALL (everyone)"]
  },
  {
    // Focus: What type of groups work best?
    stratQuestion: "STRATIFIED sampling works best when groups are:",
    stratAnswer: "Homogeneous (similar within)",
    stratOptions: ["Homogeneous (similar within)", "Heterogeneous (diverse within)"],
    clusterQuestion: "CLUSTER sampling works best when groups are:",
    clusterAnswer: "Heterogeneous (diverse within)",
    clusterOptions: ["Homogeneous (similar within)", "Heterogeneous (diverse within)"]
  },
  {
    // Focus: Key phrase identification
    stratQuestion: "Which phrase signals STRATIFIED sampling?",
    stratAnswer: "Sample FROM EACH group",
    stratOptions: ["Sample FROM EACH group", "Select ENTIRE groups"],
    clusterQuestion: "Which phrase signals CLUSTER sampling?",
    clusterAnswer: "Select ENTIRE groups",
    clusterOptions: ["Sample FROM EACH group", "Select ENTIRE groups"]
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


// ============ NEW SCENARIO BANKS (Bias + Trade-offs) ============

// Level 16: Sampling / response bias scenarios (Topic 3.4)
// NOTE: These focus on common AP Stats bias categories:
// - Voluntary response bias (self-selection)
// - Undercoverage bias (some groups left out of sampling frame)
// - Nonresponse bias (selected individuals don't respond)
// - Response bias (leading wording / misreporting / sensitive topics)
const biasTypeNames = [
  "Voluntary response bias",
  "Undercoverage bias",
  "Nonresponse bias",
  "Response bias"
];

const biasScenarios = [
  {
    desc: "A news website posts a poll and asks visitors to click a button to vote on a controversial issue.",
    bias: "Voluntary response bias",
    explanation: "People choose to respond, and those with strong opinions are more likely to participate, so the sample may not represent the whole population."
  },
  {
    desc: "A radio talk show host asks listeners to call in and share whether they support a new law. Hundreds of callers respond.",
    bias: "Voluntary response bias",
    explanation: "Only volunteers who call in are included, so the sample is self-selected and likely overrepresents extreme opinions."
  },
  {
    desc: "A teacher wants to know students’ opinions about school lunches and asks students to fill out an optional survey posted on the class website.",
    bias: "Voluntary response bias",
    explanation: "Students who choose to complete the optional survey may differ from those who don’t, so the results may be biased."
  },

  {
    desc: "A researcher randomly selects names from a landline phone book to survey adults in a city.",
    bias: "Undercoverage bias",
    explanation: "Some adults are not in the sampling frame (for example, people with only cell phones or unlisted numbers), so certain groups are underrepresented."
  },
  {
    desc: "A school surveys students by texting a link to a questionnaire, but many students do not have cell phones with texting.",
    bias: "Undercoverage bias",
    explanation: "Students without texting access have little or no chance to be included, so the sample undercovers part of the population."
  },
  {
    desc: "To estimate opinions of all commuters, a city surveys only people who take the subway.",
    bias: "Undercoverage bias",
    explanation: "Commuters who drive, bike, or walk are excluded, so the sample does not cover the entire population of commuters."
  },

  {
    desc: "A company randomly selects 2,000 customers to email a survey, but only 12% respond.",
    bias: "Nonresponse bias",
    explanation: "Many selected individuals did not respond, and those who respond may differ from those who don’t, which can bias the results."
  },
  {
    desc: "A polling firm randomly selects 800 voters to call, but 40% refuse to answer the questions.",
    bias: "Nonresponse bias",
    explanation: "If the people who refuse differ from those who respond, the resulting data may not represent the population."
  },
  {
    desc: "A school mails surveys to a random sample of parents, but many never return the survey.",
    bias: "Nonresponse bias",
    explanation: "Nonrespondents might have systematically different opinions than respondents, which can distort the results."
  },

  {
    desc: "A survey asks: 'Don’t you agree that our school should start later so students can get more sleep?'",
    bias: "Response bias",
    explanation: "The question is leading and may push respondents toward agreeing, which can bias the responses."
  },
  {
    desc: "Students are asked to report how many times they cheated on a test in the past year.",
    bias: "Response bias",
    explanation: "Because the topic is sensitive, some students may lie or underreport, so responses may be inaccurate (response bias)."
  },
  {
    desc: "A survey question asks: 'How satisfied are you with the cafeteria food and the school’s discipline policy?'",
    bias: "Response bias",
    explanation: "This question is unclear/double-barreled (two topics at once), which can confuse respondents and bias the responses."
  }
];

// Level 17: “Best method” trade-off scenarios (Topic 3.4-ish, still sampling)
// Goal: pick the most appropriate method for the situation AND explain why.
const methodNames = [
  "Simple random sample (SRS)",
  "Stratified random sample",
  "Cluster random sample",
  "Systematic random sample"
];

const methodTradeoffScenarios = [
  {
    desc: "A high school wants to estimate average hours of sleep for students. Students are in grades 9–12 and sleep may differ by grade. The school wants every grade represented.",
    bestMethod: "Stratified random sample",
    explanation: "Stratified sampling (by grade) ensures each grade is represented. This can also reduce variability if sleep differs by grade, improving precision."
  },
  {
    desc: "A company has departments (Sales, Engineering, HR, Marketing). Job satisfaction may differ by department, and the company wants to be sure each department is included.",
    bestMethod: "Stratified random sample",
    explanation: "Stratifying by department guarantees representation from each department and can yield more precise overall estimates."
  },
  {
    desc: "A polling organization wants opinions from Democrats, Republicans, and Independents, and wants each group included in the sample.",
    bestMethod: "Stratified random sample",
    explanation: "Stratifying by political group ensures every group is represented, which helps avoid underrepresenting smaller groups."
  },

  {
    desc: "A city wants to survey households, but the city is spread out and it is expensive to travel everywhere. The city randomly selects 10 city blocks and surveys every household on those blocks.",
    bestMethod: "Cluster random sample",
    explanation: "Cluster sampling is practical and cheaper because data collectors focus on a few locations (blocks). It trades some precision for feasibility."
  },
  {
    desc: "A school district wants to survey teachers. It randomly selects 6 schools (out of 40) and surveys all teachers at the selected schools.",
    bestMethod: "Cluster random sample",
    explanation: "Selecting entire schools (clusters) is more practical than sampling teachers from every school, because it reduces travel/coordination."
  },
  {
    desc: "A hospital system wants patient feedback across many clinics. It randomly selects a few clinics and surveys all patients at those clinics.",
    bestMethod: "Cluster random sample",
    explanation: "Cluster sampling reduces cost and effort by surveying whole clinics instead of tracking down individuals spread across all clinics."
  },

  {
    desc: "An inspector on a production line chooses a random starting item, then inspects every 50th item for defects.",
    bestMethod: "Systematic random sample",
    explanation: "Systematic sampling is easy to implement on a stream/ordered process. A random start plus every kth item spreads the sample across the run."
  },
  {
    desc: "A researcher has a long ordered list of patients. They pick a random starting point, then select every 10th patient.",
    bestMethod: "Systematic random sample",
    explanation: "Systematic sampling is straightforward once you have an ordered list: random start, then every kth individual."
  },
  {
    desc: "At a stadium, staff select every 20th person who enters the gate, starting with a randomly chosen number from 1 to 20.",
    bestMethod: "Systematic random sample",
    explanation: "This uses a random start and then every kth person, making it fast and easy without needing a full list of attendees."
  },

  {
    desc: "A researcher has a complete list of all 5,000 members of a club and wants a sample of 200 with no special subgroups to guarantee.",
    bestMethod: "Simple random sample (SRS)",
    explanation: "An SRS is appropriate when you have a complete list and no specific subgroup representation is needed. Randomly selecting from the whole list is unbiased."
  },
  {
    desc: "A teacher has a list of all students in the school and wants to randomly choose 60 students for a survey.",
    bestMethod: "Simple random sample (SRS)",
    explanation: "An SRS from the full list gives every possible group of 60 students an equal chance of selection, making the sample unbiased."
  },
  {
    desc: "A quality-control manager numbers all 12,000 items produced today and uses a random number generator to select 150 items to inspect.",
    bestMethod: "Simple random sample (SRS)",
    explanation: "Selecting random item numbers from the full list is a straightforward SRS and avoids systematic bias (assuming the list represents all items)."
  }
];

// Level 18: Large sample vs representative sample misconception checks
const largeSampleScenarios = [
  {
    desc: "A student posts a survey link on social media and gets 800 responses. The student claims the results must be representative because the sample is large.",
    correct: "No",
    explanation: "A large sample size does not guarantee representativeness. This is a voluntary response sample (not randomly selected), so it can be biased even if it is large."
  },
  {
    desc: "A store surveys the first 1,000 customers who enter on Saturday morning. The manager says the sample is big enough to represent all customers.",
    correct: "No",
    explanation: "Even a large convenience sample can be biased. Representativeness depends on random selection, not just sample size."
  },
  {
    desc: "A city emails a survey to 5,000 residents but only residents who choose to respond are included. The city says the huge number of emails makes the results representative.",
    correct: "No",
    explanation: "This can still be biased due to voluntary response and/or nonresponse. Sample size does not fix bias from a nonrandom response process."
  },
  {
    desc: "A company uses online product reviews from 10,000 customers to judge overall satisfaction. They claim the number of reviews guarantees accuracy.",
    correct: "No",
    explanation: "People who leave online reviews are self-selected and may differ from typical customers. A large biased sample is still biased."
  }
];

// ============ GENERATOR FUNCTION ============

export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // ========== LEVEL 1: Why Does Chance Matter? (Topic 3.1) ==========
  if (modeId === "l01-chance-matters") {
    const scen = drawFromBag('chanceScenarios', chanceScenarios);

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
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 2: Population vs Sample (Topic 3.2a) ==========
  if (modeId === "l02-population-sample") {
    const scen = drawFromBag('popSampleScenarios', popSampleScenarios);

    context = {
      topicId: "3.2a",
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
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 3: Observational vs Experiment (Topic 3.2b) ==========
  if (modeId === "l03-obs-vs-exp") {
    const scen = drawFromBag('obsExpScenarios', obsExpScenarios);

    context = {
      topicId: "3.2b",
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
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 4: Random Selection → Generalization (Topic 3.2c) ==========
  if (modeId === "l04-random-selection") {
    const scen = drawFromBag('inferenceScenarios_l04', inferenceScenarios);
    const canGen = scen.randomSelection ? "Yes" : "No";

    // Expected reasoning for open response (used by AI grader)
    const expectedReasoning = scen.randomSelection
      ? "Random selection gives every member of the population a chance to be in the sample, making it representative."
      : "Without random selection, the sample may be biased and not representative of the population.";

    context = {
      topicId: "3.2c",
      problemText: "**DAT-2.B.1:** It is only appropriate to GENERALIZE to a population if the sample was RANDOMLY SELECTED from that population.\n\n" +
                   "**Random Selection** = using chance to choose WHO is in the study\n\n" +
                   "✓ Random selection → Can generalize to the population\n" +
                   "✗ No random selection → Can only describe those in the study\n\n" +
                   "**Common non-random methods (can't generalize):**\n" +
                   "• Volunteers who sign up\n" +
                   "• Convenience samples\n" +
                   "• People who choose to respond",
      givenText: scen.desc,
      canGeneralize: { value: canGen },
      whyGeneralize: { value: expectedReasoning }
    };
    answers = {
      canGeneralize: { value: canGen },
      whyGeneralize: { value: expectedReasoning }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 5: Random Assignment → Causation (Topic 3.2d) ==========
  if (modeId === "l05-random-assignment") {
    const scen = drawFromBag('inferenceScenarios_l05', inferenceScenarios);
    const canCause = scen.randomAssignment ? "Yes" : "No";

    // Expected reasoning for open response (used by AI grader)
    const expectedReasoning = scen.randomAssignment
      ? "Random assignment controls confounding variables across groups, so any difference can be attributed to the treatment."
      : "Without random assignment, confounding/lurking variables could explain the observed differences. We can only show association, not causation.";

    context = {
      topicId: "3.2d",
      problemText: "**DAT-2.B.3:** It is NOT possible to determine CAUSAL relationships from observational studies.\n\n" +
                   "**Random Assignment** = using chance to decide WHO GETS WHICH TREATMENT\n\n" +
                   "✓ Random assignment → Can establish causation\n" +
                   "✗ No random assignment → Can only show association\n\n" +
                   "**Why random assignment matters:**\n" +
                   "It balances CONFOUNDING VARIABLES across groups, so any difference in outcomes can be attributed to the treatment.\n\n" +
                   "**Note:** Only EXPERIMENTS can have random assignment. Observational studies never do.",
      givenText: scen.desc,
      canCause: { value: canCause },
      whyCause: { value: expectedReasoning }
    };
    answers = {
      canCause: { value: canCause },
      whyCause: { value: expectedReasoning }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 6: Scope of Inference 2x2 (Topic 3.2e) ==========
  if (modeId === "l06-scope-of-inference") {
    const scen = drawFromBag('inferenceScenarios_l06', inferenceScenarios);

    context = {
      topicId: "3.2e",
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
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 7: SRS Definition (Topic 3.3) ==========
  if (modeId === "l07-srs-definition") {
    const q = drawFromBag('srsDefinitionQuestions', srsDefinitionQuestions);
    const options = shuffle([...q.options]);

    context = {
      topicId: "3.3a",
      problemText: "**DAT-2.C.2:** A **Simple Random Sample (SRS)** is a sample in which every GROUP of a given size has an equal chance of being chosen.\n\n" +
                   "⚠️ **Common misconception:** SRS is NOT just 'every individual has equal chance.'\n\n" +
                   "The key requirement: every POSSIBLE GROUP of n individuals has equal probability.\n\n" +
                   "**How to get an SRS:**\n" +
                   "• Number all individuals 1 to N\n" +
                   "• Use random number generator to pick n numbers\n" +
                   "• Table of random digits\n" +
                   "• Draw names from a hat (without replacement)",
      givenText: q.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3] || options[0],
      srsKey: { value: q.answer }
    };
    answers = { srsKey: { value: q.answer } };
    scenario = q.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 8: Stratified Definition (Topic 3.3) ==========
  if (modeId === "l08-stratified-definition") {
    const q = drawFromBag('stratifiedDefinitionQuestions', stratifiedDefinitionQuestions);
    const options = shuffle([...q.options]);

    context = {
      topicId: "3.3b",
      problemText: "**DAT-2.C.3:** A **Stratified Random Sample** involves:\n" +
                   "1. Divide population into separate groups called STRATA\n" +
                   "2. Take an SRS FROM EACH stratum\n" +
                   "3. Combine selected units to form the sample\n\n" +
                   "**Key feature:** Sample includes individuals from EVERY stratum.\n\n" +
                   "**When to use:** When the population has distinct subgroups that may differ, and you want to ensure all subgroups are represented.\n\n" +
                   "**Example:** Stratify voters by age group (18-29, 30-44, 45-64, 65+) and sample from EACH.",
      givenText: q.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3] || options[0],
      stratKey: { value: q.answer }
    };
    answers = { stratKey: { value: q.answer } };
    scenario = q.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 9: Cluster Definition (Topic 3.3) ==========
  if (modeId === "l09-cluster-definition") {
    const q = drawFromBag('clusterDefinitionQuestions', clusterDefinitionQuestions);
    const options = shuffle([...q.options]);

    context = {
      topicId: "3.3c",
      problemText: "**DAT-2.C.4:** A **Cluster Random Sample** involves:\n" +
                   "1. Divide population into groups called CLUSTERS\n" +
                   "2. Randomly select SOME clusters\n" +
                   "3. Sample ALL individuals in selected clusters\n\n" +
                   "**Key feature:** Only SOME clusters are in the sample, but you take EVERYONE from chosen clusters.\n\n" +
                   "**When to use:** When it's impractical or expensive to sample across the whole population, but you can easily access entire groups.\n\n" +
                   "**Example:** Randomly select 5 schools from a district, survey ALL students at those 5 schools.",
      givenText: q.question,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3] || options[0],
      clusterKey: { value: q.answer }
    };
    answers = { clusterKey: { value: q.answer } };
    scenario = q.question;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 10: Stratified vs Cluster (Topic 3.3) ==========
  if (modeId === "l10-strat-vs-cluster") {
    const q = drawFromBag('stratVsClusterQuestions', stratVsClusterQuestions);

    context = {
      topicId: "3.3d",
      problemText: "**Stratified vs Cluster: The Key Differences**\n\n" +
                   "| Aspect | Stratified | Cluster |\n" +
                   "|--------|------------|--------|\n" +
                   "| Groups in sample | ALL groups | SOME groups |\n" +
                   "| Individuals per group | SOME (SRS from each) | ALL (everyone) |\n" +
                   "| Ideal group type | Homogeneous (similar within) | Heterogeneous (diverse within) |\n\n" +
                   "**Memory tricks:**\n" +
                   "• Stratified = Sample FROM EACH group\n" +
                   "• Cluster = Select ENTIRE groups",
      givenText: "Answer both questions about stratified and cluster sampling:",
      // Dynamic question labels
      stratQuestion: q.stratQuestion,
      stratOptA: q.stratOptions[0],
      stratOptB: q.stratOptions[1],
      clusterQuestion: q.clusterQuestion,
      clusterOptA: q.clusterOptions[0],
      clusterOptB: q.clusterOptions[1],
      // Answers
      stratFeature: { value: q.stratAnswer },
      clusterFeature: { value: q.clusterAnswer }
    };
    answers = {
      stratFeature: { value: q.stratAnswer },
      clusterFeature: { value: q.clusterAnswer }
    };
    scenario = "Stratified vs Cluster comparison";
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 11: Systematic & Census (Topic 3.3) ==========
  if (modeId === "l11-systematic-census") {
    const type = choice(["systematic", "census"]);
    const scen = drawFromBag(`samplingScenarios_${type}_l11`, samplingScenarios[type]);
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
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 12: Identify the Method (Topic 3.3) ==========
  if (modeId === "l12-identify-method") {
    const type = choice(["srs", "stratified", "cluster", "systematic"]);
    const scen = drawFromBag(`samplingScenarios_${type}_l12`, samplingScenarios[type]);
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
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 13: Why This Method? (Topic 3.3) ==========
  if (modeId === "l13-why-method") {
    const type = choice(["srs", "stratified", "cluster"]);
    const scen = drawFromBag(`samplingScenarios_${type}_l13`, samplingScenarios[type]);
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

    // Expected advantage for open response (used by AI grader)
    // The scen.advantage contains the specific advantage for this scenario

    context = {
      topicId: "3.3g",
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
      methodId2: { value: correct },
      advantage: { value: scen.advantage }
    };
    answers = {
      methodId2: { value: correct },
      advantage: { value: scen.advantage }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 14: Capstone - Sampling Methods ==========
  if (modeId === "l14-capstone-sampling") {
    const type = choice(["srs", "stratified", "cluster"]);
    const scen = drawFromBag(`samplingScenarios_${type}_l14`, samplingScenarios[type]);
    const methodNames = {
      srs: "Simple random sample (SRS)",
      stratified: "Stratified random sample",
      cluster: "Cluster random sample"
    };
    const correct = methodNames[type];
    const canGen = "Yes"; // All these are random methods
    // Expected reasoning for open response (used by AI grader)
    const expectedReasoning = "Random selection gives every member a chance to be selected, making the sample representative of the population.";

    const methodOptions = shuffle([
      "Simple random sample (SRS)",
      "Stratified random sample",
      "Cluster random sample",
      "Convenience sample"
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
      capMethod: { value: correct },
      capGeneralize: { value: canGen },
      capWhy: { value: expectedReasoning }
    };
    answers = {
      capMethod: { value: correct },
      capGeneralize: { value: canGen },
      capWhy: { value: expectedReasoning }
    };
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 15: Full Capstone (Unit 3.1-3.4) ==========
  if (modeId === "l15-capstone-full") {
    const scen = drawFromBag('inferenceScenarios_l15', inferenceScenarios);
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
      problemText: "**Unit 3.1-3.4 Capstone**\n\n" +
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
    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }


  // ========== LEVEL 16: Sampling Biases (Topic 3.4a) ==========
  if (modeId === "l16-sampling-bias") {
    const scen = drawFromBag("biasScenarios", biasScenarios);

    const options = shuffle([...biasTypeNames]);

    context = {
      topicId: "3.4a",
      problemText:
        "**DAT-2.E:** Identify sources of bias in data collection.\n\n" +
        "**Common biases:**\n" +
        "• **Voluntary response:** people choose to respond (often strong opinions)\n" +
        "• **Undercoverage:** some groups are left out of the sampling frame\n" +
        "• **Nonresponse:** selected individuals do not respond\n" +
        "• **Response bias:** question wording/misreporting changes answers\n\n" +
        "**Task:** Identify the primary bias and explain why it could make results unrepresentative.",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      biasType: { value: scen.bias },
      biasExplain: { value: scen.explanation }
    };

    answers = {
      biasType: { value: scen.bias },
      biasExplain: { value: scen.explanation }
    };

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 17: Choosing a Sampling Method (Trade-offs) (Topic 3.4b) ==========
  if (modeId === "l17-method-tradeoffs") {
    const scen = drawFromBag("methodTradeoffScenarios", methodTradeoffScenarios);

    const options = shuffle([...methodNames]);

    context = {
      topicId: "3.4b",
      problemText:
        "**DAT-2.D:** Choose a sampling method that fits the situation.\n\n" +
        "**Think about:**\n" +
        "• **Representation:** Do we need every subgroup included?\n" +
        "• **Precision:** Would stratifying reduce variability?\n" +
        "• **Practicality:** Is it cheaper/easier to sample by groups or by an ordered process?\n\n" +
        "**Task:** Pick the BEST method for this scenario and explain why.",
      givenText: scen.desc,
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      methodChoice: { value: scen.bestMethod },
      methodExplain: { value: scen.explanation }
    };

    answers = {
      methodChoice: { value: scen.bestMethod },
      methodExplain: { value: scen.explanation }
    };

    scenario = scen.desc;
    return { context, graphConfig, answers, scenario };
  }

  // ========== LEVEL 18: Large Sample vs Representative Sample (Topic 3.4c) ==========
  if (modeId === "l18-large-sample") {
    const scen = drawFromBag("largeSampleScenarios", largeSampleScenarios);

    context = {
      topicId: "3.4c",
      problemText:
        "**Key idea:** A larger sample size usually improves **precision** (less random error), " +
        "but it does **NOT** automatically fix **bias**.\n\n" +
        "**Representativeness depends on HOW you sample** (random selection), not just how many you have.\n\n" +
        "**Task:** Decide whether the claim is correct and explain your reasoning.",
      givenText: scen.desc,
      largeGeneralize: { value: scen.correct },
      largeExplain: { value: scen.explanation }
    };

    answers = {
      largeGeneralize: { value: scen.correct },
      largeExplain: { value: scen.explanation }
    };

    scenario = scen.desc;
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
