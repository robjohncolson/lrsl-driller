// generator.js - AP Statistics Unit 6 (Topics 6.1–6.2): Inference for Proportions
// Significance testing logic, confidence intervals for a population proportion:
// identify evidence, two explanations, convincing evidence, identify procedure,
// check conditions, standard error, critical values, margin of error,
// confidence intervals, minimum sample size

// ============ UTILITY FUNCTIONS ============

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

// ============ CONSTANTS ============

const Z_STAR = {
  80: 1.282,
  90: 1.645,
  95: 1.960,
  99: 2.576
};

const CONF_LEVELS = [80, 90, 95, 99];

// ============ SCENARIO BANKS ============

// ---- Shared real-world proportion context bank (L06–L11) ----
const proportionContextBank = [
  {
    desc: "A city council is considering expanding public transit. A random sample of city residents were surveyed about whether they support the expansion.",
    population: "all city residents",
    sampleAction: "surveyed",
    successDesc: "support the expansion",
    unit: "residents"
  },
  {
    desc: "A quality control team at a factory inspects a random sample of LED light bulbs from a production run for defects.",
    population: "all LED light bulbs in the production run",
    sampleAction: "inspected",
    successDesc: "are defective",
    unit: "light bulbs"
  },
  {
    desc: "A pharmaceutical company conducts a clinical trial and randomly assigns patients to a new medication. They record whether patients experience nausea as a side effect.",
    population: "all patients who could take this medication",
    sampleAction: "treated",
    successDesc: "experience nausea",
    unit: "patients"
  },
  {
    desc: "A restaurant chain surveys a random sample of customers about their dining experience to determine satisfaction rates.",
    population: "all customers of the restaurant chain",
    sampleAction: "surveyed",
    successDesc: "are satisfied with their experience",
    unit: "customers"
  },
  {
    desc: "A social media company analyzes a random sample of user accounts to estimate the proportion of accounts that are active daily.",
    population: "all user accounts on the platform",
    sampleAction: "analyzed",
    successDesc: "are active daily",
    unit: "accounts"
  },
  {
    desc: "A university researcher surveys a random sample of college students about their study habits, recording whether they study more than 2 hours per day.",
    population: "all college students at the university",
    sampleAction: "surveyed",
    successDesc: "study more than 2 hours per day",
    unit: "students"
  },
  {
    desc: "Wildlife biologists capture and tag a random sample of fish in a lake, then later recapture a random sample to estimate the proportion of tagged fish.",
    population: "all fish in the lake",
    sampleAction: "recaptured",
    successDesc: "are tagged",
    unit: "fish"
  },
  {
    desc: "An agricultural researcher randomly selects seeds from a large batch and plants them under controlled conditions to determine the germination rate.",
    population: "all seeds in the batch",
    sampleAction: "planted",
    successDesc: "germinate successfully",
    unit: "seeds"
  },
  {
    desc: "A polling firm randomly selects registered voters to ask whether they support a ballot measure to increase funding for public schools.",
    population: "all registered voters in the state",
    sampleAction: "polled",
    successDesc: "support the ballot measure",
    unit: "voters"
  },
  {
    desc: "A tech company randomly selects website visitors to test a new ad design, recording whether visitors click on the advertisement.",
    population: "all website visitors",
    sampleAction: "shown the ad",
    successDesc: "click on the advertisement",
    unit: "visitors"
  },
  {
    desc: "A school district randomly surveys students about their commute, recording whether they walk to school rather than using other transportation.",
    population: "all students in the district",
    sampleAction: "surveyed",
    successDesc: "walk to school",
    unit: "students"
  },
  {
    desc: "A city's environmental office randomly selects households to determine how many have installed solar panels on their roof.",
    population: "all households in the city",
    sampleAction: "surveyed",
    successDesc: "have solar panels installed",
    unit: "households"
  }
];

// ---- L01: Identify Evidence scenarios (6.1a) ----
const identifyEvidenceBank = [
  {
    scenario: "A soda company claims that 40% of teenagers prefer their brand. A researcher surveys a random sample of 200 teenagers and finds that 92 of them (p̂ = 0.46) prefer the brand.",
    claim: "the true proportion of teenagers who prefer the brand is greater than 0.40",
    pHat: 0.46,
    expected: 0.40,
    direction: "greater",
    correctEvidence: "The sample proportion (p̂ = 0.46) is greater than the expected proportion (0.40)",
    distractors: [
      "The sample size of 200 is large enough to be representative",
      "The researcher used a random sample, so the result must be correct",
      "92 teenagers is a large number of successes"
    ]
  },
  {
    scenario: "A school claims that 85% of its graduates attend college. A local newspaper surveys a random sample of 150 recent graduates and finds that 120 of them (p̂ = 0.80) attended college.",
    claim: "the true proportion of graduates attending college is less than 0.85",
    pHat: 0.80,
    expected: 0.85,
    direction: "less",
    correctEvidence: "The sample proportion (p̂ = 0.80) is less than the expected proportion (0.85)",
    distractors: [
      "The sample of 150 graduates is sufficiently large",
      "The newspaper used a credible survey method",
      "30 graduates not attending college is a notable number"
    ]
  },
  {
    scenario: "A pet food company advertises that 60% of cats prefer their food. A consumer group tests this by offering the food to a random sample of 80 cats and finds that 54 of them (p̂ = 0.675) prefer the food.",
    claim: "the true proportion of cats preferring the food is greater than 0.60",
    pHat: 0.675,
    expected: 0.60,
    direction: "greater",
    correctEvidence: "The sample proportion (p̂ = 0.675) is greater than the expected proportion (0.60)",
    distractors: [
      "A random sample of 80 cats ensures unbiased results",
      "54 cats preferring the food is more than half the sample",
      "The consumer group is independent and trustworthy"
    ]
  },
  {
    scenario: "A health department claims that 25% of adults in a city smoke. A researcher surveys a random sample of 300 adults and finds that 60 of them (p̂ = 0.20) smoke.",
    claim: "the true proportion of adults who smoke is less than 0.25",
    pHat: 0.20,
    expected: 0.25,
    direction: "less",
    correctEvidence: "The sample proportion (p̂ = 0.20) is less than the expected proportion (0.25)",
    distractors: [
      "The random sample of 300 adults is large",
      "The health department is a reliable source",
      "60 smokers out of 300 is a small fraction"
    ]
  },
  {
    scenario: "A politician claims that 50% of voters support a new tax. A polling firm surveys a random sample of 400 registered voters and finds that 224 of them (p̂ = 0.56) support the tax.",
    claim: "the true proportion of voters who support the tax is greater than 0.50",
    pHat: 0.56,
    expected: 0.50,
    direction: "greater",
    correctEvidence: "The sample proportion (p̂ = 0.56) is greater than the expected proportion (0.50)",
    distractors: [
      "The poll used 400 voters, which is a common sample size",
      "The polling firm used random selection",
      "224 is more than 200, so it exceeds the threshold"
    ]
  },
  {
    scenario: "An airline claims that 90% of flights arrive on time. A travel agency randomly selects 250 flights and finds that 210 of them (p̂ = 0.84) arrived on time.",
    claim: "the true proportion of on-time flights is less than 0.90",
    pHat: 0.84,
    expected: 0.90,
    direction: "less",
    correctEvidence: "The sample proportion (p̂ = 0.84) is less than the expected proportion (0.90)",
    distractors: [
      "The sample of 250 flights covers many routes",
      "40 late flights is a significant number",
      "The travel agency has access to reliable data"
    ]
  },
  {
    scenario: "A university claims that 70% of its students graduate within four years. An education researcher surveys a random sample of 180 students who enrolled four years ago and finds that 117 of them (p̂ = 0.65) graduated on time.",
    claim: "the true four-year graduation rate is less than 0.70",
    pHat: 0.65,
    expected: 0.70,
    direction: "less",
    correctEvidence: "The sample proportion (p̂ = 0.65) is less than the expected proportion (0.70)",
    distractors: [
      "The researcher tracked students from four years ago",
      "The random sample ensures the results are valid",
      "63 students not graduating is a cause for concern"
    ]
  },
  {
    scenario: "A seed company claims that 95% of their tomato seeds germinate. A gardener plants a random sample of 120 seeds and finds that 108 of them (p̂ = 0.90) germinate.",
    claim: "the true germination rate is less than 0.95",
    pHat: 0.90,
    expected: 0.95,
    direction: "less",
    correctEvidence: "The sample proportion (p̂ = 0.90) is less than the expected proportion (0.95)",
    distractors: [
      "The gardener planted 120 seeds under the same conditions",
      "108 germinated seeds is a high count",
      "The gardener used a random sample from the batch"
    ]
  },
  {
    scenario: "A coffee chain claims that 35% of customers order decaf. A market researcher observes a random sample of 160 customers and finds that 64 of them (p̂ = 0.40) order decaf.",
    claim: "the true proportion of customers ordering decaf is greater than 0.35",
    pHat: 0.40,
    expected: 0.35,
    direction: "greater",
    correctEvidence: "The sample proportion (p̂ = 0.40) is greater than the expected proportion (0.35)",
    distractors: [
      "The researcher observed 160 customers, a large sample",
      "The observations were made at random times",
      "64 customers ordering decaf is a notable number"
    ]
  },
  {
    scenario: "A tech company claims that 55% of users prefer dark mode. A UX researcher surveys a random sample of 500 users and finds that 245 of them (p̂ = 0.49) prefer dark mode.",
    claim: "the true proportion of users preferring dark mode is less than 0.55",
    pHat: 0.49,
    expected: 0.55,
    direction: "less",
    correctEvidence: "The sample proportion (p̂ = 0.49) is less than the expected proportion (0.55)",
    distractors: [
      "500 users is a large and credible sample size",
      "The survey was administered randomly",
      "245 users is close to half the sample"
    ]
  },
  {
    scenario: "A charity claims that 30% of households donate during the holiday season. A random survey of 350 households finds that 126 of them (p̂ = 0.36) donated.",
    claim: "the true proportion of households that donate is greater than 0.30",
    pHat: 0.36,
    expected: 0.30,
    direction: "greater",
    correctEvidence: "The sample proportion (p̂ = 0.36) is greater than the expected proportion (0.30)",
    distractors: [
      "The survey covered 350 households across the area",
      "Random sampling was used for the survey",
      "126 donations is a large absolute number"
    ]
  }
];

// ---- L02: Two Explanations scenarios (6.1b) ----
const twoExplanationsBank = [
  {
    scenario: "A vaccine trial finds that 12% of patients in the treatment group experienced side effects, compared to an expected rate of 8%.",
    result: "a higher proportion of side effects (12%) than expected (8%)",
    correctAnswer: "(1) The higher rate happened purely by chance in this particular sample, or (2) the vaccine truly causes a higher rate of side effects",
    wrongOptions: [
      "(1) The sample was biased, or (2) the measurement was inaccurate",
      "(1) The expected rate of 8% is wrong, or (2) the vaccine has no effect",
      "(1) The sample was too small, or (2) the researchers made an error"
    ]
  },
  {
    scenario: "A factory claims 5% of its products are defective. An inspector finds 8% defective in a random sample of 200 items.",
    result: "a higher defect rate (8%) than claimed (5%)",
    correctAnswer: "(1) The higher rate happened purely by chance in this particular sample, or (2) the true defect rate really is higher than 5%",
    wrongOptions: [
      "(1) The inspector was careless, or (2) the factory changed production methods",
      "(1) The sample was not random, or (2) the claim of 5% was a lie",
      "(1) 200 items is too small a sample, or (2) some items were misclassified"
    ]
  },
  {
    scenario: "A political candidate claims 60% support. A random poll of 500 voters shows only 54% support.",
    result: "lower support (54%) than the candidate claims (60%)",
    correctAnswer: "(1) The lower support happened purely by chance in this particular sample, or (2) true support really is less than 60%",
    wrongOptions: [
      "(1) The poll was conducted incorrectly, or (2) voters lied about their preference",
      "(1) The candidate is wrong about their support, or (2) the poll is biased",
      "(1) 500 voters is insufficient, or (2) the timing of the poll affected results"
    ]
  },
  {
    scenario: "A teacher implements a new study method and finds that 78% of students pass the exam, compared to the historical rate of 72%.",
    result: "a higher pass rate (78%) than the historical rate (72%)",
    correctAnswer: "(1) The higher pass rate happened purely by chance with this group of students, or (2) the new study method truly improves pass rates",
    wrongOptions: [
      "(1) This class had smarter students, or (2) the exam was easier",
      "(1) The historical rate was inaccurate, or (2) the teacher graded more leniently",
      "(1) Not enough students were tested, or (2) the students cheated"
    ]
  },
  {
    scenario: "A company claims 80% of customers are satisfied. A consumer group surveys 300 random customers and finds 72% satisfaction.",
    result: "lower satisfaction (72%) than claimed (80%)",
    correctAnswer: "(1) The lower satisfaction happened purely by chance in this particular sample, or (2) true customer satisfaction really is less than 80%",
    wrongOptions: [
      "(1) The survey questions were poorly worded, or (2) customers were in a bad mood",
      "(1) The company's claim was dishonest, or (2) the sample was not representative",
      "(1) 300 customers is too few, or (2) the consumer group is biased against the company"
    ]
  },
  {
    scenario: "A botanist plants 100 seeds from a new variety and observes 88% germination, compared to the 92% germination rate of the standard variety.",
    result: "a lower germination rate (88%) than the standard variety (92%)",
    correctAnswer: "(1) The lower germination happened purely by chance in this particular batch, or (2) the new variety truly has a lower germination rate than 92%",
    wrongOptions: [
      "(1) The soil conditions were poor, or (2) the seeds were old",
      "(1) 100 seeds is too small a sample, or (2) the standard rate of 92% is incorrect",
      "(1) The botanist miscounted germinated seeds, or (2) the planting conditions were not controlled"
    ]
  },
  {
    scenario: "A website redesign aims to improve click-through rates. After the redesign, 18% of visitors click the main button, compared to the previous rate of 12%.",
    result: "a higher click-through rate (18%) than before (12%)",
    correctAnswer: "(1) The higher click-through rate happened purely by chance among these visitors, or (2) the redesign truly increases click-through rates",
    wrongOptions: [
      "(1) Different visitors came to the site, or (2) the button is in a more visible location",
      "(1) The old rate of 12% was measured incorrectly, or (2) the new design is flashier",
      "(1) The sample of visitors was biased, or (2) an external factor drove more clicks"
    ]
  },
  {
    scenario: "A gym claims that 45% of members attend at least 3 times per week. A random check of 150 members finds that 57% attend at least 3 times per week.",
    result: "a higher attendance rate (57%) than claimed (45%)",
    correctAnswer: "(1) The higher rate happened purely by chance in this particular sample, or (2) the true proportion of members attending 3+ times per week really is greater than 45%",
    wrongOptions: [
      "(1) The 150 members surveyed were the most dedicated, or (2) attendance tracking is inaccurate",
      "(1) The gym's claim was an underestimate, or (2) members misreported their attendance",
      "(1) 150 members is too few to be reliable, or (2) the check was done during a busy week"
    ]
  },
  {
    scenario: "A hospital claims its infection rate is 3%. A health inspector reviews a random sample of 400 patients and finds a 5% infection rate.",
    result: "a higher infection rate (5%) than claimed (3%)",
    correctAnswer: "(1) The higher infection rate happened purely by chance in this particular sample, or (2) the true infection rate really is higher than 3%",
    wrongOptions: [
      "(1) The inspector used stricter criteria, or (2) the hospital underreported infections",
      "(1) The 400 patients were sicker than average, or (2) the hospital's claim was a lie",
      "(1) Infection rates fluctuate seasonally, or (2) the sample was too small"
    ]
  },
  {
    scenario: "A snack company claims that 25% of bags contain a prize. A student opens 60 randomly purchased bags and finds prizes in 18% of them.",
    result: "a lower prize rate (18%) than advertised (25%)",
    correctAnswer: "(1) The lower rate happened purely by chance in this particular sample, or (2) the true proportion of bags with prizes really is less than 25%",
    wrongOptions: [
      "(1) The student bought bags from the same store, or (2) the prizes fell out during shipping",
      "(1) 60 bags is too few to judge, or (2) the company is committing fraud",
      "(1) The student may have missed some prizes, or (2) the advertised rate includes all prize types"
    ]
  },
  {
    scenario: "A wildlife agency claims 40% of a lake's fish are bass. A biologist catches a random sample of 90 fish and finds 48% are bass.",
    result: "a higher proportion of bass (48%) than claimed (40%)",
    correctAnswer: "(1) The higher proportion happened purely by chance in this particular sample, or (2) the true proportion of bass in the lake really is greater than 40%",
    wrongOptions: [
      "(1) Bass are easier to catch, so the sample is biased, or (2) the agency counted incorrectly",
      "(1) 90 fish is too few to draw conclusions, or (2) the fish population changed since the last count",
      "(1) The biologist used bait that attracts bass, or (2) the lake was recently stocked with bass"
    ]
  }
];

// ---- L03: Convincing Evidence scenarios (6.1c) ----
const convincingEvidenceBank = [
  {
    scenario: "A company claims 50% of customers prefer Product A. A researcher surveys 200 customers and finds p̂ = 0.58.",
    simCount: 3,
    simTotal: 200,
    pHat: 0.58,
    expected: 0.50,
    convincing: true,
    explanation: "Only 3 out of 200 simulations (1.5%) produced a result as extreme as p̂ = 0.58 when the true proportion is 0.50. Since this probability is very small (less than 5%), it is unlikely to happen by chance alone, providing convincing evidence that the true proportion differs from 0.50."
  },
  {
    scenario: "A teacher claims that 70% of students pass the final exam. A random sample of 100 students shows p̂ = 0.64.",
    simCount: 38,
    simTotal: 200,
    pHat: 0.64,
    expected: 0.70,
    convincing: false,
    explanation: "38 out of 200 simulations (19%) produced a result as extreme as p̂ = 0.64 when the true proportion is 0.70. Since this probability is not small (greater than 5%), the result could reasonably happen by chance alone, so there is not convincing evidence that the pass rate differs from 70%."
  },
  {
    scenario: "A website claims that 30% of visitors make a purchase. After a redesign, a random sample of 250 visitors shows p̂ = 0.37.",
    simCount: 7,
    simTotal: 500,
    pHat: 0.37,
    expected: 0.30,
    convincing: true,
    explanation: "Only 7 out of 500 simulations (1.4%) produced a result as extreme as p̂ = 0.37 when the true proportion is 0.30. Since this probability is very small (less than 5%), it provides convincing evidence that the redesign increased the purchase rate."
  },
  {
    scenario: "A seed company claims 90% germination rate. A farmer plants 80 seeds and finds p̂ = 0.85.",
    simCount: 72,
    simTotal: 400,
    pHat: 0.85,
    expected: 0.90,
    convincing: false,
    explanation: "72 out of 400 simulations (18%) produced a result as extreme as p̂ = 0.85 when the true rate is 0.90. Since this probability is not small (greater than 5%), a result of 85% could reasonably occur by chance alone, so there is not convincing evidence that the germination rate is less than 90%."
  },
  {
    scenario: "A political party claims 55% of voters in the district support their candidate. A poll of 300 voters finds p̂ = 0.48.",
    simCount: 2,
    simTotal: 300,
    pHat: 0.48,
    expected: 0.55,
    convincing: true,
    explanation: "Only 2 out of 300 simulations (0.7%) produced a result as extreme as p̂ = 0.48 when the true proportion is 0.55. Since this probability is very small (less than 5%), it provides convincing evidence that voter support is less than 55%."
  },
  {
    scenario: "A gym claims 40% of members work out at least 4 times per week. A random sample of 120 members shows p̂ = 0.45.",
    simCount: 56,
    simTotal: 250,
    pHat: 0.45,
    expected: 0.40,
    convincing: false,
    explanation: "56 out of 250 simulations (22.4%) produced a result as extreme as p̂ = 0.45 when the true proportion is 0.40. Since this probability is not small (greater than 5%), this result could easily happen by chance alone, so there is not convincing evidence that the rate differs from 40%."
  },
  {
    scenario: "A hospital claims 15% of patients experience a side effect from a standard treatment. After switching to a new treatment, a random sample of 180 patients shows p̂ = 0.08.",
    simCount: 4,
    simTotal: 500,
    pHat: 0.08,
    expected: 0.15,
    convincing: true,
    explanation: "Only 4 out of 500 simulations (0.8%) produced a result as extreme as p̂ = 0.08 when the true rate is 0.15. Since this probability is very small (less than 5%), it provides convincing evidence that the new treatment has a lower side-effect rate."
  },
  {
    scenario: "A report claims 65% of high school students have a part-time job. A counselor surveys a random sample of 90 students and finds p̂ = 0.60.",
    simCount: 84,
    simTotal: 300,
    pHat: 0.60,
    expected: 0.65,
    convincing: false,
    explanation: "84 out of 300 simulations (28%) produced a result as extreme as p̂ = 0.60 when the true proportion is 0.65. Since this probability is not small (greater than 5%), p̂ = 0.60 could easily arise by chance, so there is not convincing evidence that the rate differs from 65%."
  },
  {
    scenario: "A dog food brand claims 75% of dogs prefer their food. An independent lab tests a random sample of 150 dogs and finds p̂ = 0.66.",
    simCount: 8,
    simTotal: 400,
    pHat: 0.66,
    expected: 0.75,
    convincing: true,
    explanation: "Only 8 out of 400 simulations (2%) produced a result as extreme as p̂ = 0.66 when the true preference rate is 0.75. Since this probability is small (less than 5%), it provides convincing evidence that the true preference rate is less than 75%."
  },
  {
    scenario: "An energy company claims 20% of households use solar power. A survey of 200 randomly selected households finds p̂ = 0.23.",
    simCount: 65,
    simTotal: 250,
    pHat: 0.23,
    expected: 0.20,
    convincing: false,
    explanation: "65 out of 250 simulations (26%) produced a result as extreme as p̂ = 0.23 when the true proportion is 0.20. Since this probability is not small (greater than 5%), the difference is within what we would expect by chance, so there is not convincing evidence that the proportion differs from 20%."
  },
  {
    scenario: "A college claims 82% of applicants who are admitted enroll. This year, out of a random sample of 220 admitted students, p̂ = 0.74 enrolled.",
    simCount: 1,
    simTotal: 500,
    pHat: 0.74,
    expected: 0.82,
    convincing: true,
    explanation: "Only 1 out of 500 simulations (0.2%) produced a result as extreme as p̂ = 0.74 when the true rate is 0.82. Since this probability is extremely small (less than 5%), it provides convincing evidence that the enrollment rate has decreased from 82%."
  },
  {
    scenario: "A bakery claims that 45% of their sales are pastries. A random sample of 100 sales transactions shows p̂ = 0.42.",
    simCount: 110,
    simTotal: 300,
    pHat: 0.42,
    expected: 0.45,
    convincing: false,
    explanation: "110 out of 300 simulations (36.7%) produced a result as extreme as p̂ = 0.42 when the true proportion is 0.45. Since this probability is not small (greater than 5%), a result of 42% is easily explained by chance, so there is not convincing evidence that the proportion of pastry sales differs from 45%."
  }
];

// ---- L04: Identify Procedure scenarios (6.2a) ----
const identifyProcedureBank = [
  {
    scenario: "A marketing team wants to estimate the proportion of customers who would buy a new product. They plan to randomly survey 500 customers.",
    given: "One sample, categorical data (buy or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "Two-sample z-interval for p₁ − p₂",
      "One-sample t-interval for a population mean",
      "One-sample z-test for a population proportion"
    ]
  },
  {
    scenario: "A school board wants to estimate the proportion of parents who favor a new dress code policy. They randomly sample 200 parents from the district.",
    given: "One sample, categorical data (favor or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "Matched-pairs t-interval for a mean difference",
      "One-sample z-test for a population proportion",
      "Chi-square test for homogeneity"
    ]
  },
  {
    scenario: "A public health researcher wants to estimate the proportion of adults who have been vaccinated against the flu this season. She randomly selects 350 adults.",
    given: "One sample, categorical data (vaccinated or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "Two-sample z-interval for p₁ − p₂",
      "One-sample t-interval for a population mean",
      "Two-sample t-interval for μ₁ − μ₂"
    ]
  },
  {
    scenario: "A city planner wants to estimate the proportion of households that recycle regularly. A random sample of 400 households is surveyed.",
    given: "One sample, categorical data (recycle or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "One-sample z-test for a population proportion",
      "One-sample t-interval for a population mean",
      "Two-sample z-interval for p₁ − p₂"
    ]
  },
  {
    scenario: "A wildlife biologist wants to estimate the proportion of a deer population that is infected with a tick-borne disease. She randomly captures and tests 120 deer.",
    given: "One sample, categorical data (infected or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "Two-sample z-test for p₁ − p₂",
      "One-sample t-interval for a population mean",
      "Chi-square goodness-of-fit test"
    ]
  },
  {
    scenario: "A newspaper wants to estimate the proportion of voters who support a proposed law. They randomly poll 600 registered voters.",
    given: "One sample, categorical data (support or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "One-sample z-test for a population proportion",
      "Two-sample z-interval for p₁ − p₂",
      "One-sample t-test for a population mean"
    ]
  },
  {
    scenario: "A restaurant owner wants to estimate the proportion of customers who rate the food as 'excellent'. She randomly surveys 150 customers.",
    given: "One sample, categorical data (excellent or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "One-sample t-interval for a population mean",
      "Matched-pairs t-test for a mean difference",
      "Two-sample z-interval for p₁ − p₂"
    ]
  },
  {
    scenario: "An airline wants to estimate the proportion of flights that arrive on time. They randomly select 500 flights from the past year.",
    given: "One sample, categorical data (on time or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "One-sample z-test for a population proportion",
      "One-sample t-interval for a population mean",
      "Chi-square test for independence"
    ]
  },
  {
    scenario: "A phone manufacturer wants to estimate the proportion of phones produced that pass quality inspection. They randomly test 300 phones.",
    given: "One sample, categorical data (pass or fail), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "Two-sample z-interval for p₁ − p₂",
      "One-sample t-interval for a population mean",
      "One-sample z-test for a population proportion"
    ]
  },
  {
    scenario: "A college admissions office wants to estimate the proportion of accepted students who will actually enroll. They randomly track 250 accepted applicants.",
    given: "One sample, categorical data (enroll or not), goal: estimate a proportion",
    correctAnswer: "One-sample z-interval for a population proportion",
    wrongOptions: [
      "Two-sample t-interval for μ₁ − μ₂",
      "One-sample z-test for a population proportion",
      "Chi-square goodness-of-fit test"
    ]
  }
];

// ---- L05: Check Conditions scenarios (6.2b) ----
const checkConditionsBank = [
  {
    // All conditions met
    scenario: "A pollster selects a random sample of 250 registered voters from a city of 80,000 to estimate the proportion who support a ballot measure.",
    isRandom: true,
    n: 250,
    N: 80000,
    pHat: 0.62,
    allMet: true,
    detail: "Random: ✓ (random sample stated). 10%: 250 < 8,000 ✓. Large Counts: 250(0.62) = 155 ≥ 10 ✓ and 250(0.38) = 95 ≥ 10 ✓."
  },
  {
    // Random fails
    scenario: "A store manager asks the first 80 customers who walk in on Monday morning whether they are satisfied. The store has about 5,000 regular customers.",
    isRandom: false,
    n: 80,
    N: 5000,
    pHat: 0.75,
    allMet: false,
    detail: "Random: ✗ (first 80 customers is a convenience sample, not random). 10%: 80 < 500 ✓. Large Counts: 80(0.75) = 60 ≥ 10 ✓ and 80(0.25) = 20 ≥ 10 ✓."
  },
  {
    // 10% condition fails
    scenario: "A teacher randomly selects 35 students from a school club of 50 members to survey their opinion on a new policy.",
    isRandom: true,
    n: 35,
    N: 50,
    pHat: 0.60,
    allMet: false,
    detail: "Random: ✓ (random selection stated). 10%: 35 < 5? NO, 35 ≥ 5, so 10% condition fails (sample is 70% of population). Large Counts: 35(0.60) = 21 ≥ 10 ✓ and 35(0.40) = 14 ≥ 10 ✓."
  },
  {
    // Large counts fails (few successes)
    scenario: "A doctor randomly selects 40 patients from a large hospital system (50,000+ patients) to estimate the proportion with a rare side effect. Only 2 patients (p̂ = 0.05) experience the side effect.",
    isRandom: true,
    n: 40,
    N: 50000,
    pHat: 0.05,
    allMet: false,
    detail: "Random: ✓ (random selection stated). 10%: 40 < 5,000 ✓. Large Counts: 40(0.05) = 2 < 10 ✗. The number of successes is too small."
  },
  {
    // All conditions met
    scenario: "A university researcher randomly selects 300 undergraduates from a university of 25,000 to estimate the proportion who use the campus gym.",
    isRandom: true,
    n: 300,
    N: 25000,
    pHat: 0.44,
    allMet: true,
    detail: "Random: ✓ (random selection stated). 10%: 300 < 2,500 ✓. Large Counts: 300(0.44) = 132 ≥ 10 ✓ and 300(0.56) = 168 ≥ 10 ✓."
  },
  {
    // Random fails
    scenario: "A student surveys 100 of his friends and classmates to estimate the proportion of high schoolers who support year-round school. There are 1,200 students at the school.",
    isRandom: false,
    n: 100,
    N: 1200,
    pHat: 0.35,
    allMet: false,
    detail: "Random: ✗ (friends and classmates is a convenience sample, not random). 10%: 100 < 120 ✓. Large Counts: 100(0.35) = 35 ≥ 10 ✓ and 100(0.65) = 65 ≥ 10 ✓."
  },
  {
    // All conditions met
    scenario: "A health department randomly selects 500 adults from a county of 200,000 residents to estimate the proportion who have received a flu shot this season.",
    isRandom: true,
    n: 500,
    N: 200000,
    pHat: 0.38,
    allMet: true,
    detail: "Random: ✓ (random selection stated). 10%: 500 < 20,000 ✓. Large Counts: 500(0.38) = 190 ≥ 10 ✓ and 500(0.62) = 310 ≥ 10 ✓."
  },
  {
    // Large counts fails (few failures)
    scenario: "A factory randomly selects 30 items from a large production run of 100,000 to check for defects. 29 of the 30 items (p̂ = 0.967) pass inspection.",
    isRandom: true,
    n: 30,
    N: 100000,
    pHat: 0.967,
    allMet: false,
    detail: "Random: ✓ (random selection stated). 10%: 30 < 10,000 ✓. Large Counts: 30(0.967) = 29 ≥ 10 ✓ but 30(0.033) = 1 < 10 ✗. The number of failures is too small."
  },
  {
    // 10% condition fails
    scenario: "A company randomly selects 60 employees from a department of 85 workers to estimate the proportion who want flexible schedules.",
    isRandom: true,
    n: 60,
    N: 85,
    pHat: 0.70,
    allMet: false,
    detail: "Random: ✓ (random selection stated). 10%: 60 < 8.5? NO, 60 ≥ 8.5, so 10% condition fails (sample is about 71% of the population). Large Counts: 60(0.70) = 42 ≥ 10 ✓ and 60(0.30) = 18 ≥ 10 ✓."
  },
  {
    // All conditions met
    scenario: "A consumer group randomly selects 400 online shoppers from a large e-commerce platform (2 million users) to estimate the proportion who experienced delivery delays.",
    isRandom: true,
    n: 400,
    N: 2000000,
    pHat: 0.22,
    allMet: true,
    detail: "Random: ✓ (random selection stated). 10%: 400 < 200,000 ✓. Large Counts: 400(0.22) = 88 ≥ 10 ✓ and 400(0.78) = 312 ≥ 10 ✓."
  },
  {
    // Random fails (voluntary response)
    scenario: "A news website posts an online poll asking visitors whether they support a new local law. 450 people respond voluntarily. The website has about 100,000 daily visitors.",
    isRandom: false,
    n: 450,
    N: 100000,
    pHat: 0.58,
    allMet: false,
    detail: "Random: ✗ (voluntary response — visitors chose to participate, not randomly selected). 10%: 450 < 10,000 ✓. Large Counts: 450(0.58) = 261 ≥ 10 ✓ and 450(0.42) = 189 ≥ 10 ✓."
  },
  {
    // Large counts fails (few successes)
    scenario: "A researcher randomly selects 50 adults from a large city (population 500,000) to estimate the proportion who have been struck by lightning. Only 1 person (p̂ = 0.02) has been struck.",
    isRandom: true,
    n: 50,
    N: 500000,
    pHat: 0.02,
    allMet: false,
    detail: "Random: ✓ (random selection stated). 10%: 50 < 50,000 ✓. Large Counts: 50(0.02) = 1 < 10 ✗. The number of successes is too small for the normal approximation."
  }
];

// ---- L11: Capstone scenarios (6.2 capstone) ----
const capstone62Bank = [
  {
    scenario: "A state education board wants to estimate the proportion of high school seniors who plan to attend a four-year college. They randomly survey 350 seniors from across the state (population of 120,000 seniors).",
    pHat: 0.68,
    n: 350,
    N: 120000,
    confLevel: 95,
    interpretation: "We are 95% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all high school seniors in the state who plan to attend a four-year college."
  },
  {
    scenario: "A city health department wants to estimate the proportion of residents who have had a dental checkup in the past year. They randomly survey 400 adults from the city (population 250,000).",
    pHat: 0.54,
    n: 400,
    N: 250000,
    confLevel: 90,
    interpretation: "We are 90% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all adults in the city who have had a dental checkup in the past year."
  },
  {
    scenario: "A consumer advocacy group wants to estimate the proportion of smartphone users who have experienced a cracked screen. They randomly survey 600 smartphone users nationwide (estimated 250 million users).",
    pHat: 0.31,
    n: 600,
    N: 250000000,
    confLevel: 95,
    interpretation: "We are 95% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all smartphone users nationwide who have experienced a cracked screen."
  },
  {
    scenario: "A pet supply company wants to estimate the proportion of dog owners who buy organic dog food. They randomly survey 280 dog owners from their customer base of 90,000.",
    pHat: 0.22,
    n: 280,
    N: 90000,
    confLevel: 99,
    interpretation: "We are 99% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all dog owners in the customer base who buy organic dog food."
  },
  {
    scenario: "A transportation department wants to estimate the proportion of commuters who use public transit. They randomly survey 500 commuters from a metro area with 800,000 commuters.",
    pHat: 0.41,
    n: 500,
    N: 800000,
    confLevel: 95,
    interpretation: "We are 95% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all commuters in the metro area who use public transit."
  },
  {
    scenario: "A library system wants to estimate the proportion of cardholders who have checked out an e-book in the past month. They randomly survey 320 cardholders from their system of 150,000.",
    pHat: 0.28,
    n: 320,
    N: 150000,
    confLevel: 90,
    interpretation: "We are 90% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all library cardholders who have checked out an e-book in the past month."
  },
  {
    scenario: "An environmental group wants to estimate the proportion of homeowners who compost food waste. They randomly survey 450 homeowners from a region with 500,000 homeowners.",
    pHat: 0.17,
    n: 450,
    N: 500000,
    confLevel: 95,
    interpretation: "We are 95% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all homeowners in the region who compost food waste."
  },
  {
    scenario: "A streaming service wants to estimate the proportion of subscribers who watch content daily. They randomly survey 550 subscribers from their base of 10 million.",
    pHat: 0.63,
    n: 550,
    N: 10000000,
    confLevel: 99,
    interpretation: "We are 99% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all subscribers who watch content daily."
  },
  {
    scenario: "A grocery chain wants to estimate the proportion of shoppers who use reusable bags. They randomly survey 380 shoppers from a customer base of 200,000.",
    pHat: 0.46,
    n: 380,
    N: 200000,
    confLevel: 95,
    interpretation: "We are 95% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all shoppers at the grocery chain who use reusable bags."
  },
  {
    scenario: "A fitness app company wants to estimate the proportion of users who complete their daily step goal. They randomly select 420 users from 3 million total users.",
    pHat: 0.39,
    n: 420,
    N: 3000000,
    confLevel: 90,
    interpretation: "We are 90% confident that the interval from {{lower}} to {{upper}} captures the true proportion of all app users who complete their daily step goal."
  }
];

// ---- L12: Interpret CI scenarios (6.3a) ----
const interpretCIBank = [
  {
    context: "A city council surveyed a random sample of 400 residents (population 150,000) about support for a new park.",
    population: "all residents in the city",
    successDesc: "support the new park",
    pHat: 0.62, n: 400, confLevel: 95,
    ciLower: 0.572, ciUpper: 0.668,
    expectedInterpretation: "We are 95% confident that the interval from 0.572 to 0.668 captures the true proportion of all residents in the city who support the new park."
  },
  {
    context: "A hospital randomly surveyed 350 patients (from a patient population of 90,000) about satisfaction with nursing care.",
    population: "all patients at the hospital",
    successDesc: "are satisfied with nursing care",
    pHat: 0.78, n: 350, confLevel: 90,
    ciLower: 0.744, ciUpper: 0.816,
    expectedInterpretation: "We are 90% confident that the interval from 0.744 to 0.816 captures the true proportion of all patients at the hospital who are satisfied with nursing care."
  },
  {
    context: "An environmental agency randomly sampled 500 households (population 200,000) to determine how many recycle weekly.",
    population: "all households in the region",
    successDesc: "recycle weekly",
    pHat: 0.44, n: 500, confLevel: 95,
    ciLower: 0.396, ciUpper: 0.484,
    expectedInterpretation: "We are 95% confident that the interval from 0.396 to 0.484 captures the true proportion of all households in the region who recycle weekly."
  },
  {
    context: "A university randomly surveyed 600 students (enrollment 35,000) about whether they use the campus tutoring center.",
    population: "all students at the university",
    successDesc: "use the campus tutoring center",
    pHat: 0.31, n: 600, confLevel: 99,
    ciLower: 0.261, ciUpper: 0.359,
    expectedInterpretation: "We are 99% confident that the interval from 0.261 to 0.359 captures the true proportion of all students at the university who use the campus tutoring center."
  },
  {
    context: "A tech company randomly surveyed 450 employees (workforce of 12,000) about whether they prefer remote work.",
    population: "all employees at the company",
    successDesc: "prefer remote work",
    pHat: 0.71, n: 450, confLevel: 95,
    ciLower: 0.668, ciUpper: 0.752,
    expectedInterpretation: "We are 95% confident that the interval from 0.668 to 0.752 captures the true proportion of all employees at the company who prefer remote work."
  },
  {
    context: "A sports league randomly surveyed 300 fans (from an estimated 2 million fans) about their willingness to pay for a streaming package.",
    population: "all fans of the league",
    successDesc: "are willing to pay for the streaming package",
    pHat: 0.53, n: 300, confLevel: 90,
    ciLower: 0.483, ciUpper: 0.577,
    expectedInterpretation: "We are 90% confident that the interval from 0.483 to 0.577 captures the true proportion of all fans of the league who are willing to pay for the streaming package."
  },
  {
    context: "A school district randomly surveyed 250 parents (from 40,000 families) about support for extending the school day by 30 minutes.",
    population: "all parents in the school district",
    successDesc: "support extending the school day",
    pHat: 0.38, n: 250, confLevel: 95,
    ciLower: 0.320, ciUpper: 0.440,
    expectedInterpretation: "We are 95% confident that the interval from 0.320 to 0.440 captures the true proportion of all parents in the school district who support extending the school day."
  },
  {
    context: "A nonprofit randomly surveyed 380 donors (from a donor base of 50,000) about whether they plan to increase their contribution next year.",
    population: "all donors to the nonprofit",
    successDesc: "plan to increase their contribution next year",
    pHat: 0.27, n: 380, confLevel: 95,
    ciLower: 0.225, ciUpper: 0.315,
    expectedInterpretation: "We are 95% confident that the interval from 0.225 to 0.315 captures the true proportion of all donors to the nonprofit who plan to increase their contribution next year."
  },
  {
    context: "A state transportation department randomly surveyed 550 drivers (population 4 million licensed drivers) about whether they support higher tolls to fund road repairs.",
    population: "all licensed drivers in the state",
    successDesc: "support higher tolls to fund road repairs",
    pHat: 0.42, n: 550, confLevel: 99,
    ciLower: 0.366, ciUpper: 0.474,
    expectedInterpretation: "We are 99% confident that the interval from 0.366 to 0.474 captures the true proportion of all licensed drivers in the state who support higher tolls to fund road repairs."
  },
  {
    context: "A veterinary association randomly surveyed 280 pet owners (from approximately 60 million U.S. pet owners) about whether they buy premium pet food.",
    population: "all pet owners in the United States",
    successDesc: "buy premium pet food",
    pHat: 0.35, n: 280, confLevel: 90,
    ciLower: 0.303, ciUpper: 0.397,
    expectedInterpretation: "We are 90% confident that the interval from 0.303 to 0.397 captures the true proportion of all pet owners in the United States who buy premium pet food."
  },
  {
    context: "A music streaming platform randomly surveyed 420 subscribers (from 80 million subscribers) about whether they listen to podcasts on the platform.",
    population: "all subscribers on the platform",
    successDesc: "listen to podcasts on the platform",
    pHat: 0.58, n: 420, confLevel: 95,
    ciLower: 0.533, ciUpper: 0.627,
    expectedInterpretation: "We are 95% confident that the interval from 0.533 to 0.627 captures the true proportion of all subscribers on the platform who listen to podcasts on the platform."
  },
  {
    context: "A national retailer randomly surveyed 500 shoppers (from millions of annual customers) about whether they use the store's mobile app for purchases.",
    population: "all shoppers at the retailer",
    successDesc: "use the store's mobile app for purchases",
    pHat: 0.24, n: 500, confLevel: 95,
    ciLower: 0.203, ciUpper: 0.277,
    expectedInterpretation: "We are 95% confident that the interval from 0.203 to 0.277 captures the true proportion of all shoppers at the retailer who use the store's mobile app for purchases."
  }
];

// ---- L13: Justify Claim scenarios (6.3b) ----
const justifyClaimBank = [
  {
    context: "A polling firm surveyed 500 registered voters about a ballot measure.",
    population: "all registered voters",
    successDesc: "support the ballot measure",
    ciLower: 0.518, ciUpper: 0.622, confLevel: 95,
    claimValue: 0.5, claimText: "a majority of registered voters support the ballot measure",
    convincing: true,
    explanation: "Because all values in the 95% confidence interval (0.518 to 0.622) are greater than 0.5, there is convincing evidence that a majority of registered voters support the ballot measure."
  },
  {
    context: "A health department randomly surveyed 400 adults about their exercise habits.",
    population: "all adults in the county",
    successDesc: "exercise at least 3 times per week",
    ciLower: 0.285, ciUpper: 0.375, confLevel: 95,
    claimValue: 0.5, claimText: "a majority of adults in the county exercise at least 3 times per week",
    convincing: false,
    explanation: "Because the entire 95% confidence interval (0.285 to 0.375) is below 0.5, the data do not provide convincing evidence that a majority exercise at least 3 times per week. In fact, the data suggest the proportion is less than a majority."
  },
  {
    context: "A school board randomly surveyed 350 parents about a proposed uniform policy.",
    population: "all parents in the district",
    successDesc: "favor the uniform policy",
    ciLower: 0.462, ciUpper: 0.578, confLevel: 95,
    claimValue: 0.5, claimText: "a majority of parents in the district favor the uniform policy",
    convincing: false,
    explanation: "Because the 95% confidence interval (0.462 to 0.578) contains 0.5, we cannot be confident that the true proportion is above 0.5. There is not convincing evidence that a majority of parents favor the uniform policy."
  },
  {
    context: "A consumer group randomly surveyed 600 smartphone users about data privacy concerns.",
    population: "all smartphone users",
    successDesc: "are concerned about data privacy",
    ciLower: 0.712, ciUpper: 0.788, confLevel: 99,
    claimValue: 0.70, claimText: "more than 70% of smartphone users are concerned about data privacy",
    convincing: true,
    explanation: "Because all values in the 99% confidence interval (0.712 to 0.788) are greater than 0.70, there is convincing evidence that more than 70% of smartphone users are concerned about data privacy."
  },
  {
    context: "A restaurant chain randomly surveyed 300 customers about their dining satisfaction.",
    population: "all customers of the restaurant chain",
    successDesc: "are satisfied with their dining experience",
    ciLower: 0.641, ciUpper: 0.759, confLevel: 95,
    claimValue: 0.70, claimText: "more than 70% of customers are satisfied with their dining experience",
    convincing: false,
    explanation: "Because the 95% confidence interval (0.641 to 0.759) contains 0.70, we cannot rule out that the true proportion is at or below 0.70. There is not convincing evidence that more than 70% of customers are satisfied."
  },
  {
    context: "A wildlife agency randomly tagged and observed 250 deer to estimate the proportion carrying a tick-borne pathogen.",
    population: "all deer in the region",
    successDesc: "carry the tick-borne pathogen",
    ciLower: 0.082, ciUpper: 0.158, confLevel: 95,
    claimValue: 0.20, claimText: "fewer than 20% of deer in the region carry the tick-borne pathogen",
    convincing: true,
    explanation: "Because all values in the 95% confidence interval (0.082 to 0.158) are less than 0.20, there is convincing evidence that fewer than 20% of deer in the region carry the pathogen."
  },
  {
    context: "An HR department randomly surveyed 450 employees about job satisfaction at a large corporation (15,000 employees).",
    population: "all employees at the corporation",
    successDesc: "are satisfied with their job",
    ciLower: 0.554, ciUpper: 0.646, confLevel: 90,
    claimValue: 0.5, claimText: "a majority of employees at the corporation are satisfied with their job",
    convincing: true,
    explanation: "Because all values in the 90% confidence interval (0.554 to 0.646) are greater than 0.5, there is convincing evidence that a majority of employees are satisfied with their job."
  },
  {
    context: "A city government randomly surveyed 380 homeowners about support for a property tax increase to fund public schools.",
    population: "all homeowners in the city",
    successDesc: "support the property tax increase",
    ciLower: 0.341, ciUpper: 0.439, confLevel: 95,
    claimValue: 0.5, claimText: "a majority of homeowners in the city support the property tax increase",
    convincing: false,
    explanation: "Because the entire 95% confidence interval (0.341 to 0.439) is below 0.5, there is not convincing evidence that a majority support the tax increase. The data actually suggest fewer than half of homeowners support it."
  },
  {
    context: "A tech startup randomly surveyed 500 app users about their willingness to pay for a premium version.",
    population: "all users of the app",
    successDesc: "are willing to pay for the premium version",
    ciLower: 0.142, ciUpper: 0.218, confLevel: 95,
    claimValue: 0.25, claimText: "fewer than 25% of users are willing to pay for the premium version",
    convincing: true,
    explanation: "Because all values in the 95% confidence interval (0.142 to 0.218) are less than 0.25, there is convincing evidence that fewer than 25% of users are willing to pay for the premium version."
  },
  {
    context: "A public health organization randomly surveyed 320 teenagers about vaping habits.",
    population: "all teenagers in the state",
    successDesc: "have vaped in the past 30 days",
    ciLower: 0.112, ciUpper: 0.208, confLevel: 95,
    claimValue: 0.15, claimText: "more than 15% of teenagers in the state have vaped in the past 30 days",
    convincing: false,
    explanation: "Because the 95% confidence interval (0.112 to 0.208) contains 0.15, we cannot be confident that the true proportion is above 0.15. There is not convincing evidence that more than 15% of teenagers have vaped in the past 30 days."
  },
  {
    context: "An agricultural extension office randomly surveyed 280 farmers about adoption of cover cropping practices.",
    population: "all farmers in the state",
    successDesc: "use cover cropping practices",
    ciLower: 0.318, ciUpper: 0.422, confLevel: 90,
    claimValue: 0.30, claimText: "more than 30% of farmers in the state use cover cropping practices",
    convincing: true,
    explanation: "Because all values in the 90% confidence interval (0.318 to 0.422) are greater than 0.30, there is convincing evidence that more than 30% of farmers use cover cropping practices."
  },
  {
    context: "A national survey randomly sampled 550 adults about whether they read at least one book per month.",
    population: "all adults in the country",
    successDesc: "read at least one book per month",
    ciLower: 0.238, ciUpper: 0.322, confLevel: 95,
    claimValue: 0.30, claimText: "fewer than 30% of adults in the country read at least one book per month",
    convincing: false,
    explanation: "Because the 95% confidence interval (0.238 to 0.322) contains 0.30, we cannot be confident the true proportion is below 0.30. There is not convincing evidence that fewer than 30% of adults read at least one book per month."
  }
];

// ---- L14: Confidence Level Meaning scenarios (6.3c) ----
const confidenceLevelBank = [
  {
    context: "A polling company constructs a 95% confidence interval for the proportion of voters who support a school bond measure, using a random sample of 400 voters.",
    confLevel: 95, n: 400,
    correctAnswer: "If we took many random samples of size 400 from all voters and constructed a 95% confidence interval from each sample, about 95% of those intervals would capture the true proportion of voters who support the school bond measure.",
    wrongOptions: [
      "There is a 95% probability that the true proportion of voters who support the school bond measure is in this particular interval.",
      "95% of all voters support the school bond measure.",
      "The sample proportion is within 95% of the true proportion of voters who support the school bond measure."
    ]
  },
  {
    context: "A university constructs a 90% confidence interval for the proportion of alumni who donate annually, based on a random sample of 300 alumni.",
    confLevel: 90, n: 300,
    correctAnswer: "If we took many random samples of size 300 from all alumni and constructed a 90% confidence interval from each sample, about 90% of those intervals would capture the true proportion of alumni who donate annually.",
    wrongOptions: [
      "There is a 90% probability that the true proportion of alumni who donate annually is in this particular interval.",
      "90% of all alumni donate annually.",
      "The sample proportion is within 90% of the true proportion of alumni who donate annually."
    ]
  },
  {
    context: "A health department constructs a 99% confidence interval for the proportion of residents who have been vaccinated, using a random sample of 500 residents.",
    confLevel: 99, n: 500,
    correctAnswer: "If we took many random samples of size 500 from all residents and constructed a 99% confidence interval from each sample, about 99% of those intervals would capture the true proportion of residents who have been vaccinated.",
    wrongOptions: [
      "There is a 99% probability that the true proportion of vaccinated residents is in this particular interval.",
      "99% of all residents have been vaccinated.",
      "The sample proportion is within 99% of the true proportion of vaccinated residents."
    ]
  },
  {
    context: "A market research firm constructs an 80% confidence interval for the proportion of consumers who prefer brand A, based on a random sample of 250 consumers.",
    confLevel: 80, n: 250,
    correctAnswer: "If we took many random samples of size 250 from all consumers and constructed an 80% confidence interval from each sample, about 80% of those intervals would capture the true proportion of consumers who prefer brand A.",
    wrongOptions: [
      "There is an 80% probability that the true proportion of consumers who prefer brand A is in this particular interval.",
      "80% of all consumers prefer brand A.",
      "The sample proportion is within 80% of the true proportion of consumers who prefer brand A."
    ]
  },
  {
    context: "An environmental group constructs a 95% confidence interval for the proportion of households that compost, based on a random sample of 350 households.",
    confLevel: 95, n: 350,
    correctAnswer: "If we took many random samples of size 350 from all households and constructed a 95% confidence interval from each sample, about 95% of those intervals would capture the true proportion of households that compost.",
    wrongOptions: [
      "There is a 95% probability that the true proportion of households that compost is in this particular interval.",
      "95% of all households compost.",
      "The sample proportion is within 95% of the true proportion of households that compost."
    ]
  },
  {
    context: "A software company constructs a 90% confidence interval for the proportion of users who experience a specific bug, based on a random sample of 600 users.",
    confLevel: 90, n: 600,
    correctAnswer: "If we took many random samples of size 600 from all users and constructed a 90% confidence interval from each sample, about 90% of those intervals would capture the true proportion of users who experience the bug.",
    wrongOptions: [
      "There is a 90% probability that the true proportion of users who experience the bug is in this particular interval.",
      "90% of all users experience the bug.",
      "The sample proportion is within 90% of the true proportion of users who experience the bug."
    ]
  },
  {
    context: "A city transit authority constructs a 95% confidence interval for the proportion of riders who are satisfied with the service, based on a random sample of 450 riders.",
    confLevel: 95, n: 450,
    correctAnswer: "If we took many random samples of size 450 from all riders and constructed a 95% confidence interval from each sample, about 95% of those intervals would capture the true proportion of riders who are satisfied with the service.",
    wrongOptions: [
      "There is a 95% probability that the true proportion of satisfied riders is in this particular interval.",
      "95% of all riders are satisfied with the service.",
      "The sample proportion is within 95% of the true proportion of satisfied riders."
    ]
  },
  {
    context: "A national sports league constructs a 99% confidence interval for the proportion of fans who watch games on TV, based on a random sample of 800 fans.",
    confLevel: 99, n: 800,
    correctAnswer: "If we took many random samples of size 800 from all fans and constructed a 99% confidence interval from each sample, about 99% of those intervals would capture the true proportion of fans who watch games on TV.",
    wrongOptions: [
      "There is a 99% probability that the true proportion of fans who watch games on TV is in this particular interval.",
      "99% of all fans watch games on TV.",
      "The sample proportion is within 99% of the true proportion of fans who watch games on TV."
    ]
  },
  {
    context: "An airline constructs a 90% confidence interval for the proportion of flights that depart on time, based on a random sample of 500 flights.",
    confLevel: 90, n: 500,
    correctAnswer: "If we took many random samples of size 500 from all flights and constructed a 90% confidence interval from each sample, about 90% of those intervals would capture the true proportion of flights that depart on time.",
    wrongOptions: [
      "There is a 90% probability that the true proportion of on-time departures is in this particular interval.",
      "90% of all flights depart on time.",
      "The sample proportion is within 90% of the true proportion of on-time departures."
    ]
  },
  {
    context: "A food safety agency constructs a 95% confidence interval for the proportion of restaurant inspections that result in a violation, based on a random sample of 380 inspections.",
    confLevel: 95, n: 380,
    correctAnswer: "If we took many random samples of size 380 from all inspections and constructed a 95% confidence interval from each sample, about 95% of those intervals would capture the true proportion of inspections that result in a violation.",
    wrongOptions: [
      "There is a 95% probability that the true proportion of inspections resulting in a violation is in this particular interval.",
      "95% of all inspections result in a violation.",
      "The sample proportion is within 95% of the true proportion of inspections that result in a violation."
    ]
  },
  {
    context: "A real estate company constructs an 80% confidence interval for the proportion of homes that sell within 30 days, based on a random sample of 200 recent listings.",
    confLevel: 80, n: 200,
    correctAnswer: "If we took many random samples of size 200 from all recent listings and constructed an 80% confidence interval from each sample, about 80% of those intervals would capture the true proportion of homes that sell within 30 days.",
    wrongOptions: [
      "There is an 80% probability that the true proportion of homes selling within 30 days is in this particular interval.",
      "80% of all homes sell within 30 days.",
      "The sample proportion is within 80% of the true proportion of homes that sell within 30 days."
    ]
  }
];

// ---- L15: Factors Affecting ME scenarios (6.3d) ----
const factorsMEBank = [
  {
    questionText: "A researcher increases the sample size from 200 to 800 while keeping the confidence level at 95%. What happens to the margin of error?",
    correctAnswer: "The margin of error is cut in half",
    wrongOptions: [
      "The margin of error is cut to one-fourth",
      "The margin of error stays the same"
    ],
    explanation: "ME = z*sqrt(p-hat(1-p-hat)/n). Quadrupling n divides sqrt(n) by 2, so ME is halved."
  },
  {
    questionText: "A researcher changes the confidence level from 90% (z* = 1.645) to 99% (z* = 2.576) while keeping the sample size the same. What happens to the width of the confidence interval?",
    correctAnswer: "The interval becomes wider",
    wrongOptions: [
      "The interval becomes narrower",
      "The interval width stays the same"
    ],
    explanation: "A higher confidence level uses a larger z*, which increases the margin of error and makes the interval wider."
  },
  {
    questionText: "To cut the margin of error in half while keeping the confidence level at 95%, a researcher must...",
    correctAnswer: "Multiply the sample size by 4",
    wrongOptions: [
      "Double the sample size",
      "Multiply the sample size by 8"
    ],
    explanation: "Since ME involves sqrt(n) in the denominator, halving ME requires quadrupling n (because sqrt(4n) = 2*sqrt(n))."
  },
  {
    questionText: "Which confidence interval would be narrower: a 90% CI with n = 200, or a 95% CI with n = 200?",
    correctAnswer: "The 90% CI would be narrower",
    wrongOptions: [
      "The 95% CI would be narrower",
      "Both intervals would have the same width"
    ],
    explanation: "With the same sample size, a lower confidence level uses a smaller z*, producing a smaller margin of error and a narrower interval."
  },
  {
    questionText: "A researcher wants a more precise estimate of a population proportion. Which change would reduce the margin of error?",
    correctAnswer: "Increase the sample size",
    wrongOptions: [
      "Increase the confidence level",
      "Use a different random sampling method"
    ],
    explanation: "Increasing n decreases sqrt(p-hat(1-p-hat)/n), which decreases the margin of error. Increasing the confidence level would increase z* and make ME larger."
  },
  {
    questionText: "A 95% confidence interval is (0.42, 0.58). If the researcher had used a 90% confidence level with the same data, the new interval would...",
    correctAnswer: "Be narrower than (0.42, 0.58)",
    wrongOptions: [
      "Be wider than (0.42, 0.58)",
      "Be the same as (0.42, 0.58)"
    ],
    explanation: "Lowering the confidence level from 95% to 90% decreases z*, which reduces the margin of error and produces a narrower interval."
  },
  {
    questionText: "Two researchers study the same population. Researcher A uses n = 100 and Researcher B uses n = 400. Both use a 95% confidence level. How do their margins of error compare?",
    correctAnswer: "Researcher B's margin of error is about half of Researcher A's",
    wrongOptions: [
      "Researcher B's margin of error is about one-fourth of Researcher A's",
      "Both margins of error are approximately the same"
    ],
    explanation: "ME is proportional to 1/sqrt(n). Since sqrt(400)/sqrt(100) = 20/10 = 2, Researcher B's ME is about half of Researcher A's."
  },
  {
    questionText: "A survey produces a margin of error of 0.04 with n = 600 at the 95% confidence level. If the researcher wants ME = 0.02 at the same confidence level, approximately what sample size is needed?",
    correctAnswer: "n = 2400",
    wrongOptions: [
      "n = 1200",
      "n = 3600"
    ],
    explanation: "Cutting ME in half requires quadrupling the sample size: 600 x 4 = 2400."
  },
  {
    questionText: "If the sample proportion p-hat is close to 0.5, compared to p-hat close to 0.1, how does the margin of error change (same n and confidence level)?",
    correctAnswer: "The margin of error is larger when p-hat is close to 0.5",
    wrongOptions: [
      "The margin of error is smaller when p-hat is close to 0.5",
      "The value of p-hat has no effect on the margin of error"
    ],
    explanation: "The quantity p-hat(1-p-hat) is maximized when p-hat = 0.5, so the standard error (and thus ME) is largest when p-hat is near 0.5."
  },
  {
    questionText: "A researcher increases the sample size from 100 to 900 while keeping the confidence level at 95%. By what factor does the margin of error decrease?",
    correctAnswer: "The margin of error decreases by a factor of 3",
    wrongOptions: [
      "The margin of error decreases by a factor of 9",
      "The margin of error decreases by a factor of 4.5"
    ],
    explanation: "ME is proportional to 1/sqrt(n). sqrt(900)/sqrt(100) = 30/10 = 3, so ME decreases by a factor of 3."
  },
  {
    questionText: "A polling organization uses n = 1000 and a 95% confidence level. To achieve the same margin of error with a 99% confidence level, they would need to...",
    correctAnswer: "Increase the sample size",
    wrongOptions: [
      "Decrease the sample size",
      "Keep the sample size the same"
    ],
    explanation: "A 99% confidence level uses a larger z* than 95%, which increases ME. To compensate and keep ME the same, the sample size must increase."
  },
  {
    questionText: "Which combination would produce the widest confidence interval?",
    correctAnswer: "99% confidence level with n = 100",
    wrongOptions: [
      "90% confidence level with n = 100",
      "99% confidence level with n = 500"
    ],
    explanation: "The highest confidence level (largest z*) and the smallest sample size (largest 1/sqrt(n)) together produce the widest interval."
  }
];

// ---- L16: Capstone 6.3 scenarios ----
const capstone63Bank = [
  {
    context: "A state transportation department randomly surveyed 500 licensed drivers (population 3 million) about support for increasing the speed limit on rural highways.",
    population: "all licensed drivers in the state",
    successDesc: "support increasing the speed limit",
    pHat: 0.57, n: 500, confLevel: 95,
    ciLower: 0.527, ciUpper: 0.613,
    claimValue: 0.5, claimText: "a majority of licensed drivers support increasing the speed limit",
    convincing: true,
    expectedInterpretation: "We are 95% confident that the interval from 0.527 to 0.613 captures the true proportion of all licensed drivers in the state who support increasing the speed limit.",
    claimExplanation: "Because all values in the 95% confidence interval (0.527 to 0.613) are greater than 0.5, there is convincing evidence that a majority of licensed drivers support increasing the speed limit."
  },
  {
    context: "A hospital system randomly surveyed 400 patients (from a patient population of 200,000) about satisfaction with wait times in the emergency department.",
    population: "all patients in the hospital system",
    successDesc: "are satisfied with ER wait times",
    pHat: 0.48, n: 400, confLevel: 95,
    ciLower: 0.431, ciUpper: 0.529,
    claimValue: 0.5, claimText: "a majority of patients are satisfied with ER wait times",
    convincing: false,
    expectedInterpretation: "We are 95% confident that the interval from 0.431 to 0.529 captures the true proportion of all patients in the hospital system who are satisfied with ER wait times.",
    claimExplanation: "Because the 95% confidence interval (0.431 to 0.529) contains 0.5, we cannot be confident the true proportion is above 0.5. There is not convincing evidence that a majority of patients are satisfied with ER wait times."
  },
  {
    context: "A university randomly surveyed 350 undergraduate students (enrollment 28,000) about whether they have used the campus mental health services.",
    population: "all undergraduate students at the university",
    successDesc: "have used campus mental health services",
    pHat: 0.22, n: 350, confLevel: 90,
    ciLower: 0.183, ciUpper: 0.257,
    claimValue: 0.25, claimText: "fewer than 25% of undergraduates have used campus mental health services",
    convincing: true,
    expectedInterpretation: "We are 90% confident that the interval from 0.183 to 0.257 captures the true proportion of all undergraduate students at the university who have used campus mental health services.",
    claimExplanation: "Because not all values in the 90% confidence interval (0.183 to 0.257) are below 0.25 — the upper bound of 0.257 exceeds 0.25 — there is not convincing evidence that fewer than 25% of undergraduates have used mental health services."
  },
  {
    context: "A consumer watchdog group randomly surveyed 600 online shoppers (from millions of online shoppers) about whether they experienced fraudulent charges on their account.",
    population: "all online shoppers",
    successDesc: "have experienced fraudulent charges",
    pHat: 0.08, n: 600, confLevel: 95,
    ciLower: 0.058, ciUpper: 0.102,
    claimValue: 0.10, claimText: "fewer than 10% of online shoppers have experienced fraudulent charges",
    convincing: false,
    expectedInterpretation: "We are 95% confident that the interval from 0.058 to 0.102 captures the true proportion of all online shoppers who have experienced fraudulent charges.",
    claimExplanation: "Because the 95% confidence interval (0.058 to 0.102) contains 0.10, we cannot be confident the true proportion is below 0.10. There is not convincing evidence that fewer than 10% of online shoppers have experienced fraudulent charges."
  },
  {
    context: "A fitness company randomly surveyed 450 gym members (from a membership base of 75,000) about whether they use personal training services.",
    population: "all gym members",
    successDesc: "use personal training services",
    pHat: 0.14, n: 450, confLevel: 95,
    ciLower: 0.108, ciUpper: 0.172,
    claimValue: 0.20, claimText: "fewer than 20% of gym members use personal training services",
    convincing: true,
    expectedInterpretation: "We are 95% confident that the interval from 0.108 to 0.172 captures the true proportion of all gym members who use personal training services.",
    claimExplanation: "Because all values in the 95% confidence interval (0.108 to 0.172) are less than 0.20, there is convincing evidence that fewer than 20% of gym members use personal training services."
  },
  {
    context: "A school district randomly surveyed 380 parents (from 50,000 families) about whether they support a four-day school week.",
    population: "all parents in the school district",
    successDesc: "support a four-day school week",
    pHat: 0.64, n: 380, confLevel: 99,
    ciLower: 0.577, ciUpper: 0.703,
    claimValue: 0.5, claimText: "a majority of parents support a four-day school week",
    convincing: true,
    expectedInterpretation: "We are 99% confident that the interval from 0.577 to 0.703 captures the true proportion of all parents in the school district who support a four-day school week.",
    claimExplanation: "Because all values in the 99% confidence interval (0.577 to 0.703) are greater than 0.5, there is convincing evidence that a majority of parents support a four-day school week."
  },
  {
    context: "A tech company randomly surveyed 500 employees (workforce of 20,000) about whether they would prefer a hybrid work schedule.",
    population: "all employees at the company",
    successDesc: "prefer a hybrid work schedule",
    pHat: 0.73, n: 500, confLevel: 95,
    ciLower: 0.691, ciUpper: 0.769,
    claimValue: 0.70, claimText: "more than 70% of employees prefer a hybrid work schedule",
    convincing: false,
    expectedInterpretation: "We are 95% confident that the interval from 0.691 to 0.769 captures the true proportion of all employees at the company who prefer a hybrid work schedule.",
    claimExplanation: "Because the 95% confidence interval (0.691 to 0.769) contains 0.70, we cannot be confident the true proportion is above 0.70. There is not convincing evidence that more than 70% of employees prefer a hybrid work schedule."
  },
  {
    context: "An environmental nonprofit randomly surveyed 300 homeowners (from a city of 120,000 homeowners) about whether they have installed energy-efficient windows.",
    population: "all homeowners in the city",
    successDesc: "have installed energy-efficient windows",
    pHat: 0.33, n: 300, confLevel: 95,
    ciLower: 0.277, ciUpper: 0.383,
    claimValue: 0.40, claimText: "fewer than 40% of homeowners have installed energy-efficient windows",
    convincing: true,
    expectedInterpretation: "We are 95% confident that the interval from 0.277 to 0.383 captures the true proportion of all homeowners in the city who have installed energy-efficient windows.",
    claimExplanation: "Because all values in the 95% confidence interval (0.277 to 0.383) are less than 0.40, there is convincing evidence that fewer than 40% of homeowners have installed energy-efficient windows."
  },
  {
    context: "A national reading initiative randomly surveyed 550 adults (from the general population) about whether they read for pleasure at least once a week.",
    population: "all adults in the country",
    successDesc: "read for pleasure at least once a week",
    pHat: 0.41, n: 550, confLevel: 90,
    ciLower: 0.376, ciUpper: 0.444,
    claimValue: 0.5, claimText: "a majority of adults read for pleasure at least once a week",
    convincing: false,
    expectedInterpretation: "We are 90% confident that the interval from 0.376 to 0.444 captures the true proportion of all adults in the country who read for pleasure at least once a week.",
    claimExplanation: "Because the entire 90% confidence interval (0.376 to 0.444) is below 0.5, there is not convincing evidence that a majority of adults read for pleasure weekly. In fact, the data suggest fewer than half do."
  },
  {
    context: "A public library system randomly surveyed 420 cardholders (from 180,000 cardholders) about whether they have attended a library program in the past year.",
    population: "all library cardholders",
    successDesc: "have attended a library program in the past year",
    pHat: 0.29, n: 420, confLevel: 95,
    ciLower: 0.247, ciUpper: 0.333,
    claimValue: 0.25, claimText: "more than 25% of library cardholders have attended a program in the past year",
    convincing: false,
    expectedInterpretation: "We are 95% confident that the interval from 0.247 to 0.333 captures the true proportion of all library cardholders who have attended a library program in the past year.",
    claimExplanation: "Because the 95% confidence interval (0.247 to 0.333) contains 0.25, we cannot be confident that the true proportion is above 0.25. There is not convincing evidence that more than 25% of cardholders have attended a program."
  }
];

// ============ MAIN GENERATOR FUNCTION ============

export function generateProblem(modeId, context, mode) {
  let graphConfig = null;
  let answers = {};
  let ctx = {};
  let scenario = "";

  // ========== L01: Identify Evidence (6.1a) ==========
  if (modeId === "l01-identify-evidence") {
    const scen = drawFromBag('identifyEvidence', identifyEvidenceBank);

    // Randomly select one distractor
    const distractor = choice(scen.distractors);

    // Randomly place correct answer in optA or optB
    const correctInA = Math.random() < 0.5;
    const optA = correctInA ? scen.correctEvidence : distractor;
    const optB = correctInA ? distractor : scen.correctEvidence;

    ctx = {
      topicId: "6.1: Significance Testing Logic",
      scenarioText: scen.scenario,
      givenText: `Claim: ${scen.claim}. Observed: p̂ = ${scen.pHat}, Expected: ${scen.expected}.`,
      questionText: `What is the evidence that ${scen.claim}?`,
      optA: optA,
      optB: optB
    };

    answers = {
      evidenceAnswer: { value: scen.correctEvidence }
    };

    scenario = `${scen.scenario}\n\nWhat is the evidence that ${scen.claim}?`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L02: Two Explanations (6.1b) ==========
  if (modeId === "l02-two-explanations") {
    const scen = drawFromBag('twoExplanations', twoExplanationsBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "6.1: Significance Testing Logic",
      scenarioText: scen.scenario,
      givenText: `The study found ${scen.result}.`,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      explanationAnswer: { value: scen.correctAnswer }
    };

    scenario = `${scen.scenario}\n\nWhich correctly describes the two possible explanations for the study result?`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L03: Convincing Evidence (6.1c) ==========
  if (modeId === "l03-convincing-evidence") {
    const scen = drawFromBag('convincingEvidence', convincingEvidenceBank);

    const simProportion = Math.round((scen.simCount / scen.simTotal) * 1000) / 1000;

    ctx = {
      topicId: "6.1: Significance Testing Logic",
      scenarioText: scen.scenario,
      givenText: `A simulation assuming the claim is true was run ${scen.simTotal} times. ${scen.simCount} out of ${scen.simTotal} simulations produced a result at least as extreme as the observed sample. (Simulation proportion: ${simProportion})`,
      simCount: `${scen.simCount}`,
      simTotal: `${scen.simTotal}`,
      expectedConvincing: scen.convincing,
      expectedExplanation: scen.explanation
    };

    answers = {
      convincingAnswer: {
        value: scen.convincing ? "Yes, convincing evidence" : "No, not convincing evidence"
      },
      convincingExplain: {
        value: scen.explanation
      }
    };

    scenario = `${scen.scenario}\n\nA simulation was run ${scen.simTotal} times assuming the claim is true. ${scen.simCount} out of ${scen.simTotal} simulations produced results as extreme as the observed sample.\n\nDo the data provide convincing evidence?`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L04: Identify Procedure (6.2a) ==========
  if (modeId === "l04-identify-procedure") {
    const scen = drawFromBag('identifyProcedure', identifyProcedureBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "6.2: Confidence Intervals for Proportions",
      scenarioText: scen.scenario,
      givenText: scen.given,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      procedureAnswer: { value: scen.correctAnswer }
    };

    scenario = `${scen.scenario}\n\nWhat inference procedure should be used?`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L05: Check Conditions (6.2b) ==========
  if (modeId === "l05-check-conditions") {
    const scen = drawFromBag('checkConditions', checkConditionsBank);

    const successes = Math.round(scen.n * scen.pHat);
    const failures = scen.n - successes;

    ctx = {
      topicId: "6.2: Check Conditions",
      scenarioText: scen.scenario,
      givenText: `n = ${scen.n}, p̂ = ${scen.pHat}, successes = ${successes}, failures = ${failures}, N = ${scen.N.toLocaleString()}`,
      allConditionsMet: scen.allMet,
      conditionsDetail: scen.detail,
      n: `${scen.n}`,
      N: `${scen.N}`,
      pHat: `${scen.pHat}`,
      successes: `${successes}`,
      failures: `${failures}`
    };

    answers = {
      conditionsMet: {
        value: scen.allMet ? "Yes, all conditions are met" : "No, at least one condition fails"
      },
      conditionsExplain: {
        value: scen.detail
      }
    };

    scenario = `${scen.scenario}\n\np̂ = ${scen.pHat}, n = ${scen.n}, N = ${scen.N.toLocaleString()}\n\nAre all conditions for constructing a confidence interval met?`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L06: Standard Error (6.2c) ==========
  if (modeId === "l06-standard-error") {
    const scen = drawFromBag('propContext_l06', proportionContextBank);

    // Generate random p̂ and n
    const pHat = randInt(15, 85) / 100;
    const n = randInt(5, 45) * 10 + randInt(0, 9); // 50–459

    const se = Math.sqrt(pHat * (1 - pHat) / n);
    const seRounded = Math.round(se * 10000) / 10000;

    ctx = {
      topicId: "6.2: Standard Error",
      scenarioText: `${scen.desc}\n\nIn the sample, ${Math.round(n * pHat)} out of ${n} ${scen.unit} ${scen.successDesc} (p̂ = ${pHat}).`,
      givenText: `p̂ = ${pHat}, n = ${n}`,
      pHat: `${pHat}`,
      n: `${n}`
    };

    answers = {
      seAnswer: { value: seRounded, tolerance: 0.0005 }
    };

    scenario = `${scen.desc}\n\np̂ = ${pHat}, n = ${n}\n\nCalculate SE(p̂) = √(p̂(1−p̂)/n). Round to 4 decimal places.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L07: Critical Value (6.2d) ==========
  if (modeId === "l07-critical-value") {
    const scen = drawFromBag('propContext_l07', proportionContextBank);

    const confLevel = choice(CONF_LEVELS);
    const zStar = Z_STAR[confLevel];

    ctx = {
      topicId: "6.2: Critical Values",
      scenarioText: `${scen.desc}\n\nThe researcher wants to construct a ${confLevel}% confidence interval.`,
      givenText: `Confidence level: ${confLevel}%`,
      confLevel: `${confLevel}`
    };

    answers = {
      zStarAnswer: { value: zStar, tolerance: 0.002 }
    };

    scenario = `${scen.desc}\n\nWhat is the critical value z* for a ${confLevel}% confidence interval?`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L08: Margin of Error (6.2e) ==========
  if (modeId === "l08-margin-of-error") {
    const scen = drawFromBag('propContext_l08', proportionContextBank);

    const pHat = randInt(15, 85) / 100;
    const n = randInt(5, 45) * 10 + randInt(0, 9); // 50–459
    const confLevel = choice(CONF_LEVELS);
    const zStar = Z_STAR[confLevel];

    const se = Math.sqrt(pHat * (1 - pHat) / n);
    const me = zStar * se;
    const meRounded = Math.round(me * 10000) / 10000;

    ctx = {
      topicId: "6.2: Margin of Error",
      scenarioText: `${scen.desc}\n\nIn the sample, p̂ = ${pHat} from n = ${n} ${scen.unit}. Use a ${confLevel}% confidence level.`,
      givenText: `p̂ = ${pHat}, n = ${n}, confidence level = ${confLevel}%, z* = ${zStar}`,
      pHat: `${pHat}`,
      n: `${n}`,
      confLevel: `${confLevel}`,
      zStar: `${zStar}`
    };

    answers = {
      meAnswer: { value: meRounded, tolerance: 0.0005 }
    };

    scenario = `${scen.desc}\n\np̂ = ${pHat}, n = ${n}, z* = ${zStar}\n\nCalculate the margin of error: ME = z* × √(p̂(1−p̂)/n). Round to 4 decimal places.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L09: Confidence Interval (6.2f) ==========
  if (modeId === "l09-confidence-interval") {
    const scen = drawFromBag('propContext_l09', proportionContextBank);

    const pHat = randInt(15, 85) / 100;
    const n = randInt(10, 50) * 10; // 100–500
    const confLevel = choice(CONF_LEVELS);
    const zStar = Z_STAR[confLevel];

    const se = Math.sqrt(pHat * (1 - pHat) / n);
    const me = zStar * se;
    const lower = Math.round((pHat - me) * 1000) / 1000;
    const upper = Math.round((pHat + me) * 1000) / 1000;

    ctx = {
      topicId: "6.2: Confidence Interval",
      scenarioText: `${scen.desc}\n\nIn the sample, p̂ = ${pHat} from n = ${n} ${scen.unit}. Construct a ${confLevel}% confidence interval.`,
      givenText: `p̂ = ${pHat}, n = ${n}, confidence level = ${confLevel}%, z* = ${zStar}`,
      pHat: `${pHat}`,
      n: `${n}`,
      confLevel: `${confLevel}`,
      zStar: `${zStar}`
    };

    answers = {
      ciLower: { value: lower, tolerance: 0.002 },
      ciUpper: { value: upper, tolerance: 0.002 }
    };

    scenario = `${scen.desc}\n\np̂ = ${pHat}, n = ${n}, z* = ${zStar}\n\nCalculate the ${confLevel}% confidence interval: p̂ ± z* × √(p̂(1−p̂)/n). Round to 3 decimal places.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L10: Minimum Sample Size (6.2g) ==========
  if (modeId === "l10-min-sample-size") {
    const scen = drawFromBag('propContext_l10', proportionContextBank);

    const confLevel = choice(CONF_LEVELS);
    const zStar = Z_STAR[confLevel];

    // Desired margin of error: 0.02 to 0.08
    const desiredME = randInt(2, 8) / 100;

    // About half the time use p̂ = 0.5 (no prior), otherwise use a prior guess
    const usePrior = Math.random() < 0.5;
    const pHatGuess = usePrior ? (randInt(15, 85) / 100) : 0.5;

    const nRaw = pHatGuess * (1 - pHatGuess) * Math.pow(zStar / desiredME, 2);
    const nNeeded = Math.ceil(nRaw);

    const priorText = usePrior
      ? `A prior study suggests p̂ ≈ ${pHatGuess}.`
      : `No prior estimate is available, so use p̂ = 0.5 for the most conservative estimate.`;

    ctx = {
      topicId: "6.2: Minimum Sample Size",
      scenarioText: `${scen.desc}\n\nThe researcher wants a ${confLevel}% confidence interval with a margin of error no more than ${desiredME}. ${priorText}`,
      givenText: `Desired ME ≤ ${desiredME}, confidence level = ${confLevel}%, z* = ${zStar}, p̂ estimate = ${pHatGuess}`,
      desiredME: `${desiredME}`,
      confLevel: `${confLevel}`,
      zStar: `${zStar}`,
      pHatGuess: `${pHatGuess}`
    };

    answers = {
      sampleSizeAnswer: { value: nNeeded, tolerance: 0.5 }
    };

    scenario = `${scen.desc}\n\nDesired ME ≤ ${desiredME}, confidence level = ${confLevel}%, z* = ${zStar}, p̂ estimate = ${pHatGuess}\n\nWhat is the minimum sample size needed? Use n ≥ p̂(1−p̂) × (z*/ME)². Round UP to the nearest integer.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L11: Capstone 6.2 ==========
  if (modeId === "l11-capstone-62") {
    const scen = drawFromBag('capstone62', capstone62Bank);

    const zStar = Z_STAR[scen.confLevel];
    const se = Math.sqrt(scen.pHat * (1 - scen.pHat) / scen.n);
    const me = zStar * se;
    const lower = Math.round((scen.pHat - me) * 1000) / 1000;
    const upper = Math.round((scen.pHat + me) * 1000) / 1000;

    const successes = Math.round(scen.n * scen.pHat);
    const failures = scen.n - successes;

    // All capstone scenarios have conditions met
    const conditionsDetail = `Random: ✓ (random sample stated). 10%: ${scen.n} < ${Math.round(0.10 * scen.N).toLocaleString()} ✓. Large Counts: ${successes} ≥ 10 ✓ and ${failures} ≥ 10 ✓.`;

    const interpretation = scen.interpretation
      .replace("{{lower}}", lower.toFixed(3))
      .replace("{{upper}}", upper.toFixed(3));

    ctx = {
      topicId: "6.2: Capstone — Confidence Interval for p",
      scenarioText: scen.scenario,
      givenText: `p̂ = ${scen.pHat}, n = ${scen.n}, N = ${scen.N.toLocaleString()}, confidence level = ${scen.confLevel}%, z* = ${zStar}`,
      pHat: `${scen.pHat}`,
      n: `${scen.n}`,
      N: `${scen.N}`,
      confLevel: `${scen.confLevel}`,
      zStar: `${zStar}`,
      conditionsDetail: conditionsDetail,
      expectedInterpretation: interpretation
    };

    answers = {
      capstoneConditions: {
        value: "Yes, all conditions are met"
      },
      capstoneLower: { value: lower, tolerance: 0.002 },
      capstoneUpper: { value: upper, tolerance: 0.002 },
      capstoneExplain: {
        value: interpretation
      }
    };

    scenario = `${scen.scenario}\n\np̂ = ${scen.pHat}, n = ${scen.n}, N = ${scen.N.toLocaleString()}\n\n(1) Check all conditions. (2) Construct a ${scen.confLevel}% confidence interval. (3) Interpret the interval in context.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L12: Interpret CI (6.3a) ==========
  if (modeId === "l12-interpret-ci") {
    const scen = drawFromBag('interpretCI', interpretCIBank);

    ctx = {
      topicId: "6.3: Interpreting Confidence Intervals",
      scenarioText: scen.context,
      givenText: `p̂ = ${scen.pHat}, n = ${scen.n}, ${scen.confLevel}% confidence interval: (${scen.ciLower}, ${scen.ciUpper})`,
      confLevel: `${scen.confLevel}`,
      ciLower: `${scen.ciLower}`,
      ciUpper: `${scen.ciUpper}`,
      population: scen.population,
      successDesc: scen.successDesc
    };

    answers = {
      ciInterpretation: { value: scen.expectedInterpretation }
    };

    scenario = `${scen.context}\n\nA ${scen.confLevel}% confidence interval for the true proportion of ${scen.population} who ${scen.successDesc} is (${scen.ciLower}, ${scen.ciUpper}).\n\nInterpret this confidence interval in context.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L13: Justify Claim (6.3b) ==========
  if (modeId === "l13-justify-claim") {
    const scen = drawFromBag('justifyClaim', justifyClaimBank);

    ctx = {
      topicId: "6.3: Justifying Claims with CIs",
      scenarioText: scen.context,
      givenText: `${scen.confLevel}% CI: (${scen.ciLower}, ${scen.ciUpper}). Claim: ${scen.claimText}.`,
      claimText: scen.claimText,
      claimValue: `${scen.claimValue}`,
      ciLower: `${scen.ciLower}`,
      ciUpper: `${scen.ciUpper}`,
      confLevel: `${scen.confLevel}`,
      population: scen.population,
      successDesc: scen.successDesc
    };

    answers = {
      claimAnswer: {
        value: scen.convincing
          ? "Yes, the confidence interval provides convincing evidence"
          : "No, the confidence interval does not provide convincing evidence"
      },
      claimExplain: { value: scen.explanation }
    };

    scenario = `${scen.context}\n\nA ${scen.confLevel}% confidence interval for the proportion of ${scen.population} who ${scen.successDesc} is (${scen.ciLower}, ${scen.ciUpper}).\n\nClaim: ${scen.claimText}.\n\nDoes the confidence interval provide convincing evidence for this claim? Explain.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L14: Confidence Level Meaning (6.3c) ==========
  if (modeId === "l14-confidence-level") {
    const scen = drawFromBag('confLevel', confidenceLevelBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "6.3: Meaning of Confidence Level",
      scenarioText: scen.context,
      givenText: `Confidence level: ${scen.confLevel}%, n = ${scen.n}`,
      confLevel: `${scen.confLevel}`,
      n: `${scen.n}`,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      optD: allOptions[3]
    };

    answers = {
      confLevelAnswer: { value: scen.correctAnswer }
    };

    scenario = `${scen.context}\n\nWhat is the correct interpretation of the ${scen.confLevel}% confidence level?`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L15: Factors Affecting ME (6.3d) ==========
  if (modeId === "l15-factors-me") {
    const scen = drawFromBag('factorsME', factorsMEBank);

    const allOptions = shuffle([scen.correctAnswer, ...scen.wrongOptions]);

    ctx = {
      topicId: "6.3: Factors Affecting Margin of Error",
      scenarioText: scen.questionText,
      givenText: `ME = z* × √(p̂(1−p̂)/n)`,
      questionText: scen.questionText,
      optA: allOptions[0],
      optB: allOptions[1],
      optC: allOptions[2],
      expectedExplanation: scen.explanation
    };

    answers = {
      factorAnswer: { value: scen.correctAnswer }
    };

    scenario = `${scen.questionText}\n\nRecall: ME = z* × √(p̂(1−p̂)/n)`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== L16: Capstone 6.3 ==========
  if (modeId === "l16-capstone-63") {
    const scen = drawFromBag('capstone63', capstone63Bank);

    ctx = {
      topicId: "6.3: Capstone — Interpret and Justify",
      scenarioText: scen.context,
      givenText: `p̂ = ${scen.pHat}, n = ${scen.n}, ${scen.confLevel}% CI: (${scen.ciLower}, ${scen.ciUpper}). Claim: ${scen.claimText}.`,
      pHat: `${scen.pHat}`,
      n: `${scen.n}`,
      confLevel: `${scen.confLevel}`,
      ciLower: `${scen.ciLower}`,
      ciUpper: `${scen.ciUpper}`,
      claimText: scen.claimText,
      claimValue: `${scen.claimValue}`,
      population: scen.population,
      successDesc: scen.successDesc,
      expectedInterpretation: scen.expectedInterpretation,
      expectedClaimExplanation: scen.claimExplanation
    };

    answers = {
      cap63Interpret: { value: scen.expectedInterpretation },
      cap63Justify: {
        value: scen.convincing
          ? "Yes, the confidence interval provides convincing evidence"
          : "No, the confidence interval does not provide convincing evidence"
      },
      cap63JustifyExplain: { value: scen.claimExplanation }
    };

    scenario = `${scen.context}\n\nA ${scen.confLevel}% confidence interval for the proportion of ${scen.population} who ${scen.successDesc} is (${scen.ciLower}, ${scen.ciUpper}).\n\n(1) Interpret this confidence interval in context.\n(2) Claim: ${scen.claimText}. Does the CI provide convincing evidence for this claim? Explain.`;
    return { context: ctx, graphConfig, answers, scenario };
  }

  // ========== FALLBACK ==========
  return {
    context: {
      topicId: "?",
      scenarioText: "Mode not implemented.",
      givenText: ""
    },
    graphConfig: null,
    answers: {},
    scenario: "Mode not implemented: " + modeId
  };
}

export default { generateProblem };
