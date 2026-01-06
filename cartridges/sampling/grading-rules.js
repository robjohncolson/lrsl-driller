// grading-rules.js - Collecting Data (Unit 3.1-3.3)
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

  if (isBlank(answer)) {
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

  // ===== Level 10: Stratified vs Cluster Ideal Groups =====
  if (fieldId === "stratIdeal") {
    // Check exact match first (handles varied questions like "ALL groups" vs "SOME groups")
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You understand stratified sampling." };
    }
    if (containsAny(answer, ["homogeneous", "similar", "all"])) {
      if (containsAny(expected, ["homogeneous", "similar", "all"])) {
        return { score: "E", feedback: "Correct! Stratified works best when strata are HOMOGENEOUS (similar within)." };
      }
    }
    if (containsAny(answer, ["heterogeneous", "diverse", "some"])) {
      return { score: "I", feedback: "That's for CLUSTER. Stratified wants HOMOGENEOUS strata (similar within each group)." };
    }
    return { score: "I", feedback: `Incorrect. ${expected}` };
  }

  if (fieldId === "clusterIdeal") {
    // Check exact match first
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You understand cluster sampling." };
    }
    if (containsAny(answer, ["heterogeneous", "diverse", "some", "all (everyone)"])) {
      if (containsAny(expected, ["heterogeneous", "diverse", "some", "all (everyone)"])) {
        return { score: "E", feedback: "Correct! Cluster works best when clusters are HETEROGENEOUS (each is a mini-population)." };
      }
    }
    if (containsAny(answer, ["homogeneous", "similar"])) {
      return { score: "I", feedback: "That's for STRATIFIED. Cluster wants HETEROGENEOUS clusters (diverse within)." };
    }
    return { score: "I", feedback: `Incorrect. ${expected}` };
  }

  // ===== Level 11-13: Identify Sampling Method =====
  if (fieldId === "methodType" || fieldId === "methodId" || fieldId === "methodId2" ||
      fieldId === "capMethod" || fieldId === "capMethod2") {

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
    const mentionsStratifiedAdvantage = containsAny(answer, ["represent", "ensures", "every group", "reduces variability", "compare"]);
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
