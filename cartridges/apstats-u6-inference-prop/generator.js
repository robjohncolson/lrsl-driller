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
