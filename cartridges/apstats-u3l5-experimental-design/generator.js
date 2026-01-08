/**
 * AP Statistics Unit 3 Lesson 5 - Introduction to Experimental Design
 * Generator: basics -> scenario checks -> free response
 */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatChoices(choices) {
  // choices is array of { key: "A", value: "..." }
  return choices.map(c => `${c.key}) ${c.value}`).join('\n');
}

export function generateProblem(modeId, context = {}, mode = {}) {
  switch (modeId) {
    case 'L01':
      return generateL01();
    case 'L02':
      return generateL02();
    case 'L03':
      return generateL03();
    default:
      return generateL01();
  }
}

/**
 * Level 1: Direct identification + light MCQ.
 * Student answers in a single text field: short phrase OR letter A–E.
 */
function generateL01() {
  const nPlants = randInt(18, 30);
  const nStudents = randInt(60, 120);
  const nPeople = randInt(40, 90);

  const bank = [
    {
      id: "L01-units-plants",
      kind: "keywords_any",
      prompt: `An experiment compares two fertilizers on pepper plant growth. ${nPlants} pepper plants are randomly assigned to Fertilizer A or Fertilizer B, and all other growing conditions are kept the same.\n\nQuestion: What are the experimental units?`,
      correctAnswer: `The ${nPlants} pepper plants`,
      keywordsAny: ["plant", "plants", "pepper"],
      feedbackCorrect: "Correct — experimental units are the individuals/objects that receive treatments.",
      feedbackIncorrect: "Remember: experimental units are the individuals/objects to which treatments are applied (here: the plants)."
    },
    {
      id: "L01-response-test",
      kind: "keywords_any",
      prompt: `A teacher randomly assigns ${nStudents} students to learn with either a new method or a traditional method. At the end of the unit, all students take the same achievement test.\n\nQuestion: What is the response variable?`,
      correctAnswer: "The students' achievement test scores",
      keywordsAny: ["score", "test", "exam", "achievement"],
      feedbackCorrect: "Correct — the response variable is the measured outcome after treatments are applied.",
      feedbackIncorrect: "The response variable is what is measured (the outcome), not the treatment."
    },
    {
      id: "L01-explanatory-fertilizer",
      kind: "keywords_any",
      prompt: `An experiment compares Fertilizer A to Fertilizer B for plant growth.\n\nQuestion: What is the explanatory variable (factor)?`,
      correctAnswer: "Type of fertilizer (A vs B)",
      keywordsAny: ["fertilizer", "type of fertilizer", "fertilizer type", "which fertilizer", "treatment"],
      feedbackCorrect: "Correct — the explanatory variable is the factor being manipulated (the treatment condition).",
      feedbackIncorrect: "The explanatory variable is what the experimenter changes on purpose (here: fertilizer type)."
    },
    {
      id: "L01-confounding-technician",
      kind: "keywords_any",
      prompt: `A researcher studies a chemical applied at two doses (high/low) to two cell strains (A/B). To be 'consistent,' each treatment combination is handled by a different lab technician.\n\nQuestion: Name one potential confounding variable.`,
      correctAnswer: "Lab technician",
      keywordsAny: ["technician", "lab tech", "research assistant"],
      feedbackCorrect: "Correct — if technicians differ, technician effects get mixed up with treatment effects.",
      feedbackIncorrect: "A confounder is related to the treatment and affects the response; here, different technicians could change outcomes."
    },
    {
      id: "L01-randassign-definition",
      kind: "keywords_all",
      prompt: `Question: In one sentence, what does **random assignment** mean?`,
      correctAnswer: "Using chance to decide which treatment each experimental unit receives",
      keywordsAll: ["random", "assign"],
      feedbackCorrect: "Correct — random assignment uses chance to decide who gets which treatment.",
      feedbackIncorrect: "Include BOTH ideas: using chance/randomness AND assigning treatments to units."
    },
    {
      id: "L01-placebo-definition",
      kind: "keywords_any",
      prompt: `Question: What is a **placebo**?`,
      correctAnswer: "A fake/inactive treatment that looks like the real treatment",
      keywordsAny: ["fake", "inactive", "sugar", "placebo", "no active"],
      feedbackCorrect: "Correct — a placebo is a fake/inactive treatment used for comparison.",
      feedbackIncorrect: "A placebo is a fake/inactive treatment used so groups are treated similarly except for the active ingredient."
    },
    {
      id: "L01-randselect-vs-randassign",
      kind: "mcq",
      prompt: `Type the letter A–E.\n\nWhich statement is correct?\nA) Random selection allows us to establish causation.\nB) Random assignment allows us to generalize to a population.\nC) Random assignment allows us to establish causation.\nD) Random selection and random assignment mean the same thing.\nE) Neither random selection nor random assignment is useful.`,
      correctLetter: "C",
      correctAnswer: "C",
      feedbackCorrect: "Correct — random assignment supports cause-and-effect conclusions (for the study participants).",
      feedbackIncorrect: "Random assignment → causation; random selection → generalization."
    },
    {
      id: "L01-mcq-randassign-why",
      kind: "mcq",
      prompt: `Type the letter A–E.\n\nResearchers randomly assign one of three pH treatments (low/medium/high) to jellyfish tanks.\nWhy is random assignment used?\nA) It tends to balance uncontrolled variables so differences can be attributed to treatments.\nB) It guarantees each group has exactly the same size.\nC) It replaces the need for replication.\nD) It proves the sample is representative of the population.\nE) It makes the results automatically statistically significant.`,
      correctLetter: "A",
      correctAnswer: "A",
      feedbackCorrect: "Correct — random assignment helps prevent confounding by balancing other variables across groups.",
      feedbackIncorrect: "Random assignment balances (on average) other variables so we can attribute differences to treatments."
    },
    {
      id: "L01-mcq-not-comparative",
      kind: "mcq",
      prompt: `Type the letter A–E.\n\nA company tests a new user interface by having 18 users try only the NEW interface for one week and rate it.\nWhy is this not a well-designed experiment?\nA) Not all users had the same password length.\nB) The users were not randomly selected.\nC) The week was too short.\nD) The users should not use social media.\nE) There is no comparison group (only one treatment).`,
      correctLetter: "E",
      correctAnswer: "E",
      feedbackCorrect: "Correct — experiments need comparison (at least two treatments, possibly including a control).",
      feedbackIncorrect: "A key missing element is comparison: there was only one treatment group."
    }
  ];

  const q = pick(bank);

  return {
    context: {
      mode: "L01",
      qid: q.id,
      kind: q.kind,
      correctLetter: q.correctLetter || null,
      correctAnswer: q.correctAnswer,
      keywordsAny: q.keywordsAny || null,
      keywordsAll: q.keywordsAll || null,
      feedbackCorrect: q.feedbackCorrect,
      feedbackIncorrect: q.feedbackIncorrect,
      problemText: q.prompt
    },
    answers: {
      answer: { value: q.correctLetter ? q.correctLetter : q.correctAnswer }
    },
    scenario: q.prompt
  };
}

/**
 * Level 2: Decision + justification about whether a design supports a claim.
 * Student chooses Yes/No and explains using experiment vocabulary.
 */
function generateL02() {
  const bank = [
    {
      id: "L02-notes-observational",
      scenario: `A teacher wants to know if taking notes causes higher AP Stats midterm scores. The teacher observes students and records whether they usually take notes, then compares midterm scores between note-takers and non-note-takers.`,
      question: "Can the teacher conclude that taking notes CAUSES higher scores?",
      correctDecision: "no",
      keyPhrases: ["observational", "confound", "confounding", "cannot conclude", "no random assignment"],
      idealJustification: "No. This is an observational study (no random assignment), so confounding variables (like motivation) could explain the difference; causation cannot be concluded."
    },
    {
      id: "L02-coffee-survey",
      scenario: `A researcher surveys students about coffee drinking and compares exam grades of coffee-drinkers vs non-coffee-drinkers.`,
      question: "Can the researcher conclude that drinking coffee causes higher exam grades?",
      correctDecision: "no",
      keyPhrases: ["observational", "survey", "confound", "confounding", "no random assignment"],
      idealJustification: "No. A survey is observational; without random assignment, confounding variables could explain the association, so causation cannot be concluded."
    },
    {
      id: "L02-teacher-confounding",
      scenario: `Two teachers test a new teaching method. Teacher 1 teaches one class with the NEW method. Teacher 2 teaches a different class with the TRADITIONAL method. At the end, both classes take the same test.`,
      question: "Is this a well-designed experiment to isolate the effect of the teaching method?",
      correctDecision: "no",
      keyPhrases: ["confound", "confounding", "teacher", "not isolated", "mixed up"],
      idealJustification: "No. Teacher is confounded with teaching method, so differences in scores could be due to the teachers instead of the method."
    },
    {
      id: "L02-placebo-doubleblind",
      scenario: `A clinic recruits volunteers with a skin condition and randomly assigns each person to either a medicated lotion or a non-medicated lotion (placebo). The bottles look identical and neither patients nor evaluators know which lotion each person received.`,
      question: "Is this a well-designed experiment for testing whether the medicated lotion causes improvement (for these volunteers)?",
      correctDecision: "yes",
      keyPhrases: ["random", "assign", "comparison", "control", "placebo", "double-blind", "replication"],
      idealJustification: "Yes. It compares medicated lotion to a placebo, uses random assignment, has replication (many participants), and blinding helps reduce bias."
    },
    {
      id: "L02-one-treatment-only",
      scenario: `A company gives 25 users a new productivity app for two weeks and then asks them if they feel more productive.`,
      question: "Is this a well-designed experiment for determining whether the app improves productivity?",
      correctDecision: "no",
      keyPhrases: ["no comparison", "control", "comparison group", "only one", "not comparative"],
      idealJustification: "No. There is no comparison/control group, so we cannot tell whether productivity would have changed without the app."
    },
    {
      id: "L02-self-selection",
      scenario: `A nutritionist is testing two diet plans. Participants choose which diet plan they want to follow. After a month, average weight loss is compared between the two diet groups.`,
      question: "Is this a well-designed experiment for concluding the diet plan causes differences in weight loss?",
      correctDecision: "no",
      keyPhrases: ["no random assignment", "self-select", "confound", "confounding"],
      idealJustification: "No. Participants self-selected treatments, so groups may differ in other ways (confounding). Random assignment is needed for causation."
    }
  ];

  const q = pick(bank);

  return {
    context: {
      mode: "L02",
      qid: q.id,
      correctDecision: q.correctDecision,
      keyPhrases: q.keyPhrases,
      idealJustification: q.idealJustification,
      problemText: `${q.scenario}\n\nQuestion: ${q.question}`
    },
    answers: {
      decision: { value: q.correctDecision === "yes" ? "Yes" : "No" },
      justification: { value: q.idealJustification }
    },
    scenario: `${q.scenario}\n\nQuestion: ${q.question}\n\n(Select Yes/No, then justify using experiment vocabulary.)`
  };
}

/**
 * Level 3: Free response (design or explanation). Graded by AI prompt + keyword rubric fallback.
 */
function generateL03() {
  const bank = [
    {
      id: "L03-design-experiment-fertilizer",
      prompt: `Design an experiment to determine whether Fertilizer B produces more growth than Fertilizer A for pepper plants.\n\nYour response should include:\n- experimental units\n- treatments\n- how treatments are assigned\n- what response is measured\n- how you control confounding variables`,
      correctAnswer: "Randomly assign many pepper plants to two groups (A vs B), keep other conditions the same, measure growth after a set time, and compare the groups.",
      requiredElements: [
        { name: "comparison", keywords: ["compare", "comparison", "control", "two groups", "treatment group"] },
        { name: "random assignment", keywords: ["randomly assign", "random assignment", "random allocation"] },
        { name: "experimental units", keywords: ["plants", "pepper plants", "experimental units"] },
        { name: "response variable", keywords: ["measure", "record", "growth", "height", "yield", "response"] },
        { name: "control confounding", keywords: ["keep the same", "constant", "control variables", "same conditions", "confounding"] }
      ]
    },
    {
      id: "L03-randselect-vs-randassign",
      prompt: `Explain the difference between **random selection** and **random assignment**.\n\nThen answer:\n1) Which one allows us to generalize to a population?\n2) Which one allows us to establish a cause-and-effect conclusion?`,
      correctAnswer: "Random selection is how we choose a sample from a population (generalization). Random assignment is how we assign treatments in an experiment (causation).",
      requiredElements: [
        { name: "random selection defined", keywords: ["random selection", "sample", "population", "choose", "selected"] },
        { name: "random assignment defined", keywords: ["random assignment", "treatment", "assign", "experimental units"] },
        { name: "generalize", keywords: ["generalize", "population", "representative"] },
        { name: "causation", keywords: ["cause", "causal", "cause-and-effect", "causation"] }
      ]
    },
    {
      id: "L03-exit-ticket-random-assignment",
      prompt: `In 2–4 sentences, explain why **random assignment** is essential for establishing a cause-and-effect relationship in an experiment.`,
      correctAnswer: "Random assignment balances confounding variables across groups (on average), so differences in outcomes can be attributed to the treatments rather than pre-existing differences.",
      requiredElements: [
        { name: "uses chance", keywords: ["random", "chance", "randomly"] },
        { name: "balances confounders", keywords: ["balance", "confounding", "uncontrolled", "lurking", "evenly", "distribute", "equal"] },
        { name: "attribute to treatment", keywords: ["attribute", "due to", "because of", "treatment", "cause", "causal", "effect"] }
      ]
    },
    {
      id: "L03-block-design-improvement",
      prompt: `A company tests a new pain medication vs a current medication. They think pain severity (mild vs severe) might affect results.\n\nDescribe a **randomized block design** for this situation and explain why it helps.`,
      correctAnswer: "Block patients by severity (mild/severe), then randomly assign treatments within each block. Blocking controls variability due to severity and makes comparisons more precise.",
      requiredElements: [
        { name: "block variable named", keywords: ["severity", "mild", "severe", "block"] },
        { name: "random within blocks", keywords: ["within", "randomly assign", "random assignment"] },
        { name: "why blocking helps", keywords: ["reduce variability", "control", "separate", "more precise"] }
      ]
    }
  ];

  const q = pick(bank);

  return {
    context: {
      mode: "L03",
      qid: q.id,
      topic: "AP Statistics Topic 3.5 Experimental Design",
      problemText: q.prompt,
      correctAnswer: q.correctAnswer,
      requiredElements: q.requiredElements
    },
    answers: {
      response: { value: "" }
    },
    scenario: q.prompt
  };
}
