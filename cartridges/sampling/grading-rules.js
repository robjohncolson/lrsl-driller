// grading-rules.js - Collecting Data (Unit 3.1-3.4)
// Aligned with AP Statistics Course Framework

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;
  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

function normalize(str) {
  return String(str).trim().toLowerCase();
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some(k => norm.includes(normalize(k)));
}

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

// Open-response fields should prompt students to write an explanation (not "select an answer")
const openResponseFields = new Set([
  "whyGeneralize", "capWhy",
  "whyCause",
  "advantage",
  "biasExplain",
  "methodExplain",
  "largeExplain"
]);

if (isBlank(answer)) {
  if (openResponseFields.has(fieldId)) {
    return { score: "I", feedback: "Please enter an explanation." };
  }
  return { score: "I", feedback: "Please select an answer." };
}


  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  // ===== Level 1: Chance Matters (Topic 3.1) =====
  if (fieldId === "chanceTrust") {
    if (studentNorm === expectedNorm) {
      if (expected === "Yes") {
        return { score: "E", feedback: "Correct! This method uses a chance mechanism, so we can trust the conclusions." };
      } else {
        return { score: "E", feedback: "Correct! Without a chance mechanism, conclusions may be untrustworthy." };
      }
    }
    if (expected === "Yes") {
      return { score: "I", feedback: "This method DOES use chance (randomness). Random number generators, drawing from a hat, coin flips—all are chance mechanisms." };
    } else {
      return { score: "I", feedback: "This method does NOT use chance. Volunteers, convenience samples, and self-selection are NOT random." };
    }
  }

  // ===== Level 2: Population vs Sample (Topic 3.2) =====
  if (fieldId === "popOrSample") {
    if (studentNorm === expectedNorm) {
      if (expected === "Population") {
        return { score: "E", feedback: "Correct! This describes ALL members of the group of interest—the population." };
      } else {
        return { score: "E", feedback: "Correct! This describes a SUBSET selected from the population—a sample." };
      }
    }
    if (expected === "Population") {
      return { score: "I", feedback: "This is the POPULATION—it includes ALL members. Look for words like 'all,' 'every,' or 'entire.'" };
    } else {
      return { score: "I", feedback: "This is a SAMPLE—only SOME members were selected. Look for numbers like '50 selected' or 'surveyed.'" };
    }
  }

  // ===== Level 3: Observational vs Experiment (Topic 3.2) =====
  if (fieldId === "studyType" || fieldId === "studyType2") {
    if (studentNorm === expectedNorm ||
        (containsAny(expected, ["observational"]) && containsAny(answer, ["observational"])) ||
        (containsAny(expected, ["experiment"]) && containsAny(answer, ["experiment"]))) {
      if (containsAny(expected, ["experiment"])) {
        return { score: "E", feedback: "Correct! Treatments were ASSIGNED by researchers—this is an experiment." };
      } else {
        return { score: "E", feedback: "Correct! No treatments were imposed—researchers just observed what exists." };
      }
    }
    if (containsAny(expected, ["experiment"])) {
      return { score: "I", feedback: "This IS an experiment—treatments were assigned. Look for 'randomly assigned,' 'given,' or 'received treatment.'" };
    } else {
      return { score: "I", feedback: "This is OBSERVATIONAL—no treatments were assigned. Surveys, records, and tracking existing behaviors are observational." };
    }
  }

  // ===== Level 4: Can Generalize? (Topic 3.2) =====
  if (fieldId === "canGeneralize" || fieldId === "capGeneralize" || fieldId === "capGen2") {
    if (studentNorm === expectedNorm) {
      if (expected === "Yes") {
        return { score: "E", feedback: "Correct! Random selection allows us to generalize to the population." };
      } else {
        return { score: "E", feedback: "Correct! Without random selection, we cannot generalize beyond those in the study." };
      }
    }
    if (expected === "Yes") {
      return { score: "I", feedback: "We CAN generalize—the sample was randomly selected from the population." };
    } else {
      return { score: "I", feedback: "We CANNOT generalize—no random selection was used (volunteers, convenience, etc.)." };
    }
  }

  // ===== Level 4: Why Generalize? (Open Response) =====
  if (fieldId === "whyGeneralize" || fieldId === "capWhy") {
    // Check for key concepts about generalization
    const mentionsRandomSelection = containsAny(answer, ["random selection", "randomly selected", "random sample"]);
    const mentionsRepresentative = containsAny(answer, ["representative", "represents the population", "represent the"]);
    const mentionsBias = containsAny(answer, ["biased", "not biased", "bias"]);
    const mentionsChance = containsAny(answer, ["chance to be selected", "equal chance", "every member"]);
    const mentionsWrongConcept = containsAny(answer, ["random assignment", "causation", "confounding", "treatment"]);
    const mentionsSampleSize = containsAny(answer, ["sample size", "large enough", "big enough"]);

    // E: Clearly explains random selection → generalization
    if (mentionsRandomSelection || (mentionsRepresentative && mentionsChance)) {
      return { score: "E", feedback: "Excellent! You correctly identified that random selection is key to generalization." };
    }

    // P: Shows partial understanding
    if (mentionsRepresentative || mentionsBias || mentionsChance) {
      return { score: "P", feedback: "Good start! To be complete, explain HOW random selection makes the sample representative of the population." };
    }

    // P: Common misconception about sample size
    if (mentionsSampleSize && !mentionsRandomSelection) {
      return { score: "P", feedback: "Sample size affects precision, but RANDOM SELECTION (not size) determines if we can generalize to the population." };
    }

    // I: Confuses generalization with causation
    if (mentionsWrongConcept) {
      return { score: "I", feedback: "You're confusing generalization with causation. Generalization depends on random SELECTION from the population, not random assignment." };
    }

    return { score: "I", feedback: "Generalization requires RANDOM SELECTION from the population. This gives every member a chance to be in the sample, making it representative." };
  }

  // ===== Level 5: Can Establish Causation? (Topic 3.2) =====
  if (fieldId === "canCause" || fieldId === "causation" || fieldId === "capCause2") {
    if (studentNorm === expectedNorm) {
      if (expected === "Yes") {
        return { score: "E", feedback: "Correct! Random assignment allows us to establish causation." };
      } else {
        return { score: "E", feedback: "Correct! Without random assignment, we can only show association, not causation." };
      }
    }
    if (expected === "Yes") {
      return { score: "I", feedback: "We CAN establish causation—treatments were randomly assigned." };
    } else {
      return { score: "I", feedback: "We CANNOT establish causation—no random assignment. Observational studies only show association." };
    }
  }

  // ===== Level 5: Why Causation? (Open Response) =====
  if (fieldId === "whyCause") {
    // Check for key concepts about causation
    const mentionsRandomAssignment = containsAny(answer, ["random assignment", "randomly assigned", "assigned randomly"]);
    const mentionsConfounding = containsAny(answer, ["confound", "lurking", "third variable", "other variable"]);
    const mentionsTreatment = containsAny(answer, ["treatment", "treatments assigned", "assigned treatment"]);
    const mentionsExperiment = containsAny(answer, ["experiment", "experimental"]);
    const mentionsCauseEffect = containsAny(answer, ["cause and effect", "cause-and-effect", "causation", "causal"]);
    const mentionsAssociation = containsAny(answer, ["association", "correlation", "only show"]);
    const mentionsWrongConcept = containsAny(answer, ["random selection", "generalize", "representative", "population"]);

    // E: Clearly explains random assignment → causation
    if (mentionsRandomAssignment || (mentionsConfounding && (mentionsTreatment || mentionsExperiment))) {
      return { score: "E", feedback: "Excellent! You correctly identified that random assignment controls confounding variables, allowing causal conclusions." };
    }

    // P: Shows partial understanding
    if (mentionsConfounding || mentionsTreatment || mentionsCauseEffect || mentionsAssociation) {
      return { score: "P", feedback: "Good start! To be complete, explain that RANDOM ASSIGNMENT of treatments balances confounding variables across groups." };
    }

    // P: Mentions experiment but not assignment
    if (mentionsExperiment && !mentionsRandomAssignment) {
      return { score: "P", feedback: "You're right that experiments can establish causation, but explain WHY: random assignment controls confounding variables." };
    }

    // I: Confuses causation with generalization
    if (mentionsWrongConcept) {
      return { score: "I", feedback: "You're confusing causation with generalization. Causation depends on random ASSIGNMENT of treatments, not random selection." };
    }

    return { score: "I", feedback: "Causation requires RANDOM ASSIGNMENT of treatments. This balances confounding variables, so any difference can be attributed to the treatment." };
  }

  // ===== Level 6: Scope of Inference =====
  if (fieldId === "generalize") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct assessment of generalizability!" };
    }
    return { score: "I", feedback: `Generalization requires RANDOM SELECTION from the population. Answer: ${expected}` };
  }

  // ===== Level 7: SRS Key (Topic 3.3) =====
  if (fieldId === "srsKey") {
    // Check for exact match first (handles varied questions)
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You understand what makes an SRS special." };
    }
    // Legacy support for "group" answer
    if (containsAny(answer, ["group"]) && containsAny(expected, ["group"])) {
      return { score: "E", feedback: "Correct! In an SRS, every GROUP of n individuals has equal chance—not just every individual." };
    }
    // Partial credit for understanding it's about combinations/groups
    if (containsAny(answer, ["combination", "possible", "group", "every possible"])) {
      return { score: "P", feedback: "You're on the right track! The key is that every possible GROUP of size n has equal probability." };
    }
    if (containsAny(answer, ["individual"])) {
      return { score: "P", feedback: "Close! While individuals have equal chance, the KEY definition is every GROUP of size n has equal chance." };
    }
    return { score: "I", feedback: `Incorrect. ${expected}` };
  }

  // ===== Level 8: Stratified Key (Topic 3.3) =====
  if (fieldId === "stratKey") {
    // Check for exact match first (handles varied questions)
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You understand stratified sampling." };
    }
    if (containsAny(answer, ["each", "from each", "srs from", "all groups"])) {
      return { score: "E", feedback: "Correct! Stratified sampling takes an SRS FROM EACH stratum." };
    }
    if (containsAny(answer, ["some groups", "all in", "entire"])) {
      return { score: "I", feedback: "That's CLUSTER sampling! Stratified samples FROM EACH group, cluster selects ENTIRE groups." };
    }
    return { score: "I", feedback: `Incorrect. ${expected}` };
  }

  // ===== Level 9: Cluster Key (Topic 3.3) =====
  if (fieldId === "clusterKey") {
    // Check for exact match first (handles varied questions)
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You understand cluster sampling." };
    }
    if (containsAny(answer, ["some", "all in selected", "all in", "entire", "practical", "locations"])) {
      return { score: "E", feedback: "Correct! Cluster sampling selects SOME groups, then samples ALL in selected groups." };
    }
    if (containsAny(answer, ["each", "from each", "every group"])) {
      return { score: "I", feedback: "That's STRATIFIED sampling! Cluster selects ENTIRE groups, stratified samples FROM EACH." };
    }
    return { score: "I", feedback: `Incorrect. ${expected}` };
  }

  // ===== Level 10: Stratified vs Cluster Features =====
  if (fieldId === "stratFeature") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You understand this aspect of stratified sampling." };
    }
    // Provide specific feedback based on common confusions
    if (containsAny(expected, ["all groups"]) && containsAny(answer, ["some"])) {
      return { score: "I", feedback: "Stratified uses ALL groups (samples from each). CLUSTER uses some groups." };
    }
    if (containsAny(expected, ["some", "random sample"]) && containsAny(answer, ["all", "everyone"])) {
      return { score: "I", feedback: "Stratified takes SOME individuals from each group (an SRS). CLUSTER takes everyone." };
    }
    if (containsAny(expected, ["homogeneous"]) && containsAny(answer, ["heterogeneous"])) {
      return { score: "I", feedback: "Stratified works best with HOMOGENEOUS groups (similar within). CLUSTER wants heterogeneous." };
    }
    if (containsAny(expected, ["from each"]) && containsAny(answer, ["entire"])) {
      return { score: "I", feedback: "'FROM EACH group' signals stratified. 'ENTIRE groups' signals cluster." };
    }
    return { score: "I", feedback: `Incorrect. The answer is: ${expected}` };
  }

  if (fieldId === "clusterFeature") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You understand this aspect of cluster sampling." };
    }
    // Provide specific feedback based on common confusions
    if (containsAny(expected, ["some groups"]) && containsAny(answer, ["all"])) {
      return { score: "I", feedback: "Cluster uses SOME groups (selects entire groups). STRATIFIED uses all groups." };
    }
    if (containsAny(expected, ["all", "everyone"]) && containsAny(answer, ["some", "random sample"])) {
      return { score: "I", feedback: "Cluster takes ALL individuals from selected groups. STRATIFIED takes some from each." };
    }
    if (containsAny(expected, ["heterogeneous"]) && containsAny(answer, ["homogeneous"])) {
      return { score: "I", feedback: "Cluster works best with HETEROGENEOUS groups (diverse within, like mini-populations)." };
    }
    if (containsAny(expected, ["entire"]) && containsAny(answer, ["from each"])) {
      return { score: "I", feedback: "'ENTIRE groups' signals cluster. 'FROM EACH group' signals stratified." };
    }
    return { score: "I", feedback: `Incorrect. The answer is: ${expected}` };
  }

  // ===== Level 11-13: Identify Sampling Method =====
  if (fieldId === "methodType" || fieldId === "methodId" || fieldId === "methodId2" ||
      fieldId === "capMethod" || fieldId === "capMethod2" || fieldId === "methodChoice") {

    // Check for correct answer (flexible matching)
    const isCorrect = studentNorm === expectedNorm ||
      (containsAny(expected, ["srs", "simple random"]) && containsAny(answer, ["srs", "simple random"])) ||
      (containsAny(expected, ["stratified"]) && containsAny(answer, ["stratified"])) ||
      (containsAny(expected, ["cluster"]) && containsAny(answer, ["cluster"])) ||
      (containsAny(expected, ["systematic"]) && containsAny(answer, ["systematic"])) ||
      (containsAny(expected, ["census"]) && containsAny(answer, ["census"])) ||
      (containsAny(expected, ["convenience", "volunteer", "non-random"]) && containsAny(answer, ["convenience", "volunteer", "non-random"])) ||
      (containsAny(expected, ["random selection"]) && containsAny(answer, ["random selection"])) ||
      (containsAny(expected, ["random assignment"]) && containsAny(answer, ["random assignment"]));

if (isCorrect) {
  if (fieldId === "methodChoice") {
    return { score: "E", feedback: "Correct! This method is a strong fit for the situation. Now make sure your explanation connects the method’s advantage to the scenario." };
  }
  return { score: "E", feedback: "Correct! Great job identifying the method." };
}


    // Common confusions with partial credit
    if (containsAny(expected, ["stratified"]) && containsAny(answer, ["cluster"])) {
      return { score: "P", feedback: "Close! This is STRATIFIED (sample FROM EACH group). Cluster would take ENTIRE groups." };
    }
    if (containsAny(expected, ["cluster"]) && containsAny(answer, ["stratified"])) {
      return { score: "P", feedback: "Close! This is CLUSTER (select entire groups). Stratified would sample FROM EACH group." };
    }

    return { score: "I", feedback: `Incorrect. This is ${expected}. Look for key phrases in the description.` };
  }

  // ===== Level 13: Advantage (Open Response) =====
  if (fieldId === "advantage") {
    // Check for method-specific advantages
    const mentionsSRSAdvantage = containsAny(answer, ["simple", "unbiased", "equal chance", "easy to understand", "foundation"]);
    const mentionsStratifiedAdvantage = containsAny(answer, [
      "represent", "ensures", "every group", "compare",
      // Variability keywords (various phrasings)
      "reduces variability", "reduce variability", "low variability", "lower variability", "less variability",
      "more precise", "precision", "smaller margin",
      // Bias keywords (stratified ensures representation → reduces bias)
      "low bias", "less bias", "reduces bias", "reduce bias", "no bias", "avoid bias"
    ]);
    const mentionsClusterAdvantage = containsAny(answer, ["practical", "convenient", "cheaper", "cost", "easier", "don't need to visit"]);
    const mentionsSystematicAdvantage = containsAny(answer, ["easy to implement", "no complete list", "evenly spaced"]);
    const mentionsAnyAdvantage = mentionsSRSAdvantage || mentionsStratifiedAdvantage || mentionsClusterAdvantage || mentionsSystematicAdvantage;

    // E: Gives a valid, specific advantage
    if (mentionsAnyAdvantage) {
      return { score: "E", feedback: "Good! You identified a valid advantage of this sampling method." };
    }

    // P: Generic or vague answer
    if (containsAny(answer, ["better", "good", "accurate", "works well", "effective"])) {
      return { score: "P", feedback: "Try to be more specific. What SPECIFICALLY makes this method advantageous in this scenario?" };
    }

    return { score: "I", feedback: "Think about why a researcher would choose this method. Consider: representation, practicality, cost, or variability reduction." };
  }

  
// ===== Level 16: Bias Type (Topic 3.4) =====
if (fieldId === "biasType") {
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct! You identified the primary bias. Now explain how it could make the results unrepresentative." };
  }

  if (containsAny(expected, ["voluntary"])) {
    return { score: "I", feedback: "This is **voluntary response bias**: people choose to respond (often those with strong opinions), so the sample may not represent the population." };
  }
  if (containsAny(expected, ["undercoverage"])) {
    return { score: "I", feedback: "This is **undercoverage bias**: some groups are left out of the sampling frame (so they have little/no chance to be selected)." };
  }
  if (containsAny(expected, ["nonresponse"])) {
    return { score: "I", feedback: "This is **nonresponse bias**: many selected individuals do not respond, and nonrespondents may differ from respondents." };
  }
  if (containsAny(expected, ["response bias"])) {
    return { score: "I", feedback: "This is **response bias**: the wording/method of asking questions (or misreporting) can systematically change responses." };
  }

  return { score: "I", feedback: `Incorrect. The answer is: ${expected}` };
}

// ===== Level 16: Bias Explain (Open Response) =====
if (fieldId === "biasExplain") {
  const expectedBias = normalize(getExpectedObj(context, "biasType").value || "");

  const mentionsNotRepresentative = containsAny(answer, [
    "not representative", "unrepresentative", "biased", "skew", "overrepresent", "underrepresent", "doesn't represent"
  ]);

  const mentionsVoluntary = containsAny(answer, [
    "voluntary", "volunteer", "self-select", "self select", "opt in", "choose to respond", "call in", "strong opinion", "strong opinions"
  ]);

  const mentionsUndercoverage = containsAny(answer, [
    "undercoverage", "excluded", "left out", "not included", "missing", "not covered", "no chance", "sampling frame",
    "phone book", "landline", "only online", "internet access", "only subway"
  ]);

  const mentionsNonresponse = containsAny(answer, [
    "nonresponse", "didn't respond", "did not respond", "no response", "refuse", "refused", "low response", "response rate",
    "returned", "return rate", "didn't answer", "did not answer"
  ]);

  const mentionsResponseBias = containsAny(answer, [
    "response bias", "leading", "loaded", "wording", "phrasing", "double-barreled", "double barreled", "confusing",
    "misreport", "lie", "lying", "underreport", "overreport", "sensitive"
  ]);

  const mentionsWrongConcept = containsAny(answer, ["random assignment", "treatment", "experiment", "confounding"]);

  const mentionsSampleSizeOnly = containsAny(answer, ["sample size", "large sample", "big sample", "many people"]) &&
    !(mentionsVoluntary || mentionsUndercoverage || mentionsNonresponse || mentionsResponseBias);

  const wordCount = normalize(answer).split(/\s+/).filter(Boolean).length;

  const justNamesBias =
    wordCount <= 4 && (
      containsAny(answer, ["voluntary response", "undercoverage", "nonresponse", "response bias"])
    );

  // If they confuse with causation/experiments, it's off-target
  if (mentionsWrongConcept) {
    return { score: "I", feedback: "Focus on **bias in sampling/measurement**, not random assignment or confounding. Explain how the data collection could systematically favor certain responses." };
  }

  // Match student explanation to expected bias type
  const matchesExpected =
    (expectedBias.includes("voluntary") && (mentionsVoluntary || containsAny(answer, ["voluntary response"]))) ||
    (expectedBias.includes("undercoverage") && (mentionsUndercoverage || containsAny(answer, ["undercoverage"]))) ||
    (expectedBias.includes("nonresponse") && (mentionsNonresponse || containsAny(answer, ["nonresponse"]))) ||
    (expectedBias.includes("response bias") && (mentionsResponseBias || containsAny(answer, ["response bias"])));

  const explainsMechanism =
    (mentionsVoluntary && !justNamesBias) ||
    (mentionsUndercoverage && !justNamesBias) ||
    (mentionsNonresponse && !justNamesBias) ||
    (mentionsResponseBias && !justNamesBias);

  // E: Correct bias mechanism explained
  if (matchesExpected && (explainsMechanism || mentionsNotRepresentative) && !mentionsSampleSizeOnly) {
    return { score: "E", feedback: "Excellent! You explained how the data collection could systematically skew results and make the sample/responses unrepresentative." };
  }

  // P: Right bias but too vague (or only names it)
  if (matchesExpected && (justNamesBias || mentionsNotRepresentative || mentionsSampleSizeOnly)) {
    if (mentionsSampleSizeOnly) {
      return { score: "P", feedback: "Sample size affects **precision**, but to explain **bias** you must describe *how* the data collection favors certain responses or leaves some groups out." };
    }
    return { score: "P", feedback: "Good start! Now explain the **mechanism**: who is more/less likely to be included (or how wording could change answers)?" };
  }

  // P: Notices bias/unrepresentativeness but mismatches the main bias type
  if (!matchesExpected && (mentionsNotRepresentative || mentionsVoluntary || mentionsUndercoverage || mentionsNonresponse || mentionsResponseBias)) {
    const expectedNice = getExpectedObj(context, "biasType").value || "the listed bias type";
    return { score: "P", feedback: `You’re noticing potential bias, but the main issue here is **${expectedNice}**. Explain that specific mechanism.` };
  }

  return { score: "I", feedback: "Explain why the results might be biased (for example: volunteers self-select, a group is left out, many selected people don’t respond, or wording affects answers)." };
}

// ===== Level 17: Explain why the chosen method fits (Open Response) =====
if (fieldId === "methodExplain") {
  const expectedMethod = normalize(getExpectedObj(context, "methodChoice").value || "");

  const mentionsStratified = containsAny(answer, [
    "stratified", "from each", "each group", "each grade", "each department", "each stratum", "every group",
    "ensure", "representation", "represent", "compare", "stratum", "strata",
    // Variability keywords (various phrasings)
    "reduces variability", "reduce variability", "low variability", "lower variability", "less variability",
    "more precise", "precision", "smaller margin",
    // Bias keywords (stratified ensures representation → reduces bias)
    "low bias", "less bias", "reduces bias", "reduce bias", "avoid bias"
  ]);

  const mentionsCluster = containsAny(answer, [
    "cluster", "entire", "whole group", "all in selected", "selected groups", "some groups",
    "cheaper", "cost", "practical", "convenient", "travel", "locations", "easier"
  ]);

  const mentionsSystematic = containsAny(answer, [
    "systematic", "random start", "starting point", "every kth", "every 10th", "every 20th", "every 50th",
    "evenly spaced", "ordered list", "assembly line"
  ]);

  const mentionsSRS = containsAny(answer, [
    "srs", "simple random", "random number", "randomly select", "equal chance", "unbiased", "fair", "complete list", "random sample"
  ]);

  const mentionsGeneric = containsAny(answer, ["random", "representative", "unbiased", "fair", "chance"]);

  const wordCount = normalize(answer).split(/\s+/).filter(Boolean).length;

  const matchesExpected =
    (expectedMethod.includes("stratified") && mentionsStratified) ||
    (expectedMethod.includes("cluster") && mentionsCluster) ||
    (expectedMethod.includes("systematic") && mentionsSystematic) ||
    ((expectedMethod.includes("srs") || expectedMethod.includes("simple random")) && mentionsSRS);

  // E: Mentions a method-specific advantage tied to the scenario
  if (matchesExpected && (wordCount >= 5) && !(mentionsGeneric && !(mentionsStratified || mentionsCluster || mentionsSystematic || mentionsSRS))) {
    return { score: "E", feedback: "Great explanation! You tied the sampling method’s advantage to the scenario (representation, precision, or practicality)." };
  }

  // P: Vague but points in right direction
  if (matchesExpected && (mentionsGeneric || wordCount < 5)) {
    return { score: "P", feedback: "Good start! Be more specific: explain *how* this method helps here (e.g., ensures each subgroup is represented, reduces cost, uses every kth item, etc.)." };
  }

  // P: Explains a different method’s advantage (some understanding)
  if (!matchesExpected && (mentionsStratified || mentionsCluster || mentionsSystematic || mentionsSRS)) {
    const expectedNice = getExpectedObj(context, "methodChoice").value || "the correct method";
    return { score: "P", feedback: `Your reasoning sounds like a different method. In this scenario, the best choice is **${expectedNice}**—explain why that method fits.` };
  }

  return { score: "I", feedback: "Explain why the chosen method is a good fit for this scenario. Mention a specific advantage (representation, precision/variability, or practicality/cost)." };
}

// ===== Level 18: Large sample misconception (Choice) =====
if (fieldId === "largeGeneralize") {
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct! A large sample size does NOT guarantee a representative sample. Representativeness depends on random selection and lack of bias." };
  }
  return { score: "I", feedback: "Incorrect. Even a very large sample can be biased if it comes from volunteers or a convenience sample. Sample size affects precision, not bias." };
}

// ===== Level 18: Large sample misconception (Open Response) =====
if (fieldId === "largeExplain") {
  const mentionsRandomSelection = containsAny(answer, ["random selection", "randomly selected", "random sample", "selected at random"]);
  const mentionsBias = containsAny(answer, ["bias", "biased", "not representative", "unrepresentative", "voluntary", "convenience", "self-select", "nonresponse", "undercoverage"]);
  const mentionsPrecision = containsAny(answer, ["precision", "sampling error", "margin of error", "variability", "more precise"]);
  const mentionsWrong = containsAny(answer, ["guarantee", "always", "definitely"]) && containsAny(answer, ["yes", "does"]);

  const wordCount = normalize(answer).split(/\s+/).filter(Boolean).length;

  if ((mentionsRandomSelection || mentionsBias) && !mentionsWrong) {
    return { score: "E", feedback: "Excellent! You recognized that sample size improves precision, but without random selection a sample can still be biased and not representative." };
  }

  if (mentionsPrecision && !(mentionsRandomSelection || mentionsBias)) {
    return { score: "P", feedback: "You’re right that larger samples improve precision. To be complete, also explain that **bias** isn’t fixed by sample size—you need random selection / an unbiased sampling process." };
  }

  if (wordCount < 5) {
    return { score: "P", feedback: "Add more detail: explain why sample size does not fix a biased sampling method (volunteers/convenience/nonresponse/undercoverage)." };
  }

  return { score: "I", feedback: "A large sample does not guarantee representativeness. Explain that bias can remain if the sampling method is not random or excludes certain groups." };
}

// ===== Generic Fallback =====
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct!" };
  }

  return { score: "I", feedback: `Incorrect. Expected: ${expected}` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
