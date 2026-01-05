// grading-rules.js - Sampling Methods & Evaluation Cartridge

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
  return String(str).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Check if answer contains key terms indicating understanding
function containsKey(answer, keys) {
  const norm = normalize(answer);
  return keys.some(k => norm.includes(normalize(k)));
}

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  if (isBlank(answer)) {
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  // ===== Level 1-2: Bias and Variability definitions =====
  if (fieldId === "biasDefn") {
    if (studentNorm === "accuracy" || containsKey(answer, ["accuracy", "accurate"])) {
      return { score: "E", feedback: "Correct! Bias is a measure of accuracy—whether estimates are centered at the truth." };
    }
    if (containsKey(answer, ["precision", "precise"])) {
      return { score: "I", feedback: "Not quite. Bias measures ACCURACY (centered at truth). VARIABILITY measures precision." };
    }
    return { score: "I", feedback: "Incorrect. Bias measures accuracy—whether you're hitting the target center." };
  }

  if (fieldId === "varDefn") {
    if (studentNorm === "precision" || containsKey(answer, ["precision", "precise"])) {
      return { score: "E", feedback: "Correct! Variability is a measure of precision—how spread out your estimates are." };
    }
    if (containsKey(answer, ["accuracy", "accurate"])) {
      return { score: "I", feedback: "Not quite. Variability measures PRECISION (spread). BIAS measures accuracy." };
    }
    return { score: "I", feedback: "Incorrect. Variability measures precision—how tightly clustered your estimates are." };
  }

  // ===== Level 3: Inverse relationships =====
  if (fieldId === "lowBias" || fieldId === "lowVar") {
    if (containsKey(answer, ["high"])) {
      return { score: "E", feedback: "Correct! Low bias = HIGH accuracy. Low variability = HIGH precision. They're inverses!" };
    }
    if (containsKey(answer, ["low"])) {
      return { score: "I", feedback: "Remember: these are INVERSES. Low bias = HIGH accuracy. Low variability = HIGH precision." };
    }
    return { score: "I", feedback: "The relationship is inverse: LOW bias means HIGH accuracy." };
  }

  // ===== Level 4: SRS definition =====
  if (fieldId === "srsKey") {
    if (containsKey(answer, ["group"])) {
      return { score: "E", feedback: "Correct! In an SRS, every GROUP of n individuals has equal chance—not just every individual." };
    }
    if (containsKey(answer, ["individual"])) {
      return { score: "P", feedback: "Close! While every individual has equal chance, the KEY definition is every GROUP of size n has equal chance." };
    }
    return { score: "I", feedback: "In an SRS, every GROUP of n individuals has an equal chance of being selected." };
  }

  // ===== Level 5: Stratified definition =====
  if (fieldId === "stratHow") {
    if (containsKey(answer, ["within"])) {
      return { score: "E", feedback: "Correct! Stratified sampling takes an SRS WITHIN each stratum—sampling some from each group." };
    }
    if (containsKey(answer, ["entire", "of entire"])) {
      return { score: "I", feedback: "That's CLUSTER sampling (select entire groups). Stratified samples WITHIN each group." };
    }
    return { score: "I", feedback: "Stratified = sample WITHIN each stratum. Cluster = select ENTIRE groups." };
  }

  // ===== Level 6: Cluster definition =====
  if (fieldId === "clusterHow") {
    if (containsKey(answer, ["some"]) && containsKey(answer, ["all"])) {
      // Check order: should be "some / all"
      const ans = normalize(answer);
      if (ans.includes("someall") || answer.toLowerCase().includes("some / all")) {
        return { score: "E", feedback: "Correct! Cluster sampling: select SOME clusters, then sample ALL individuals in those clusters." };
      }
    }
    if (containsKey(answer, ["all"]) && containsKey(answer, ["some"])) {
      return { score: "P", feedback: "You have the right words but check the order: select SOME clusters, sample ALL within them." };
    }
    return { score: "I", feedback: "Cluster: randomly select SOME clusters, then sample ALL individuals in selected clusters." };
  }

  // ===== Level 7: Stratified vs Cluster ideal groups =====
  if (fieldId === "stratIdeal") {
    if (containsKey(answer, ["homogeneous", "homogenous", "similar"])) {
      return { score: "E", feedback: "Correct! Stratified works best when strata are HOMOGENEOUS (similar within each stratum)." };
    }
    if (containsKey(answer, ["heterogeneous", "mixed", "diverse"])) {
      return { score: "I", feedback: "That's for CLUSTER sampling. Stratified wants HOMOGENEOUS strata (similar within)." };
    }
    return { score: "I", feedback: "Stratified works best when strata are homogeneous (similar within each group)." };
  }

  if (fieldId === "clusterIdeal") {
    if (containsKey(answer, ["heterogeneous", "mixed", "diverse"])) {
      return { score: "E", feedback: "Correct! Cluster works best when clusters are HETEROGENEOUS (mixed, like mini-populations)." };
    }
    if (containsKey(answer, ["homogeneous", "homogenous", "similar"])) {
      return { score: "I", feedback: "That's for STRATIFIED sampling. Cluster wants HETEROGENEOUS clusters (mixed within)." };
    }
    return { score: "I", feedback: "Cluster works best when clusters are heterogeneous (each cluster is a mini-population)." };
  }

  // ===== Level 8-9: Identify the method =====
  if (fieldId === "methodId" || fieldId === "methodId2") {
    if (studentNorm === expectedNorm || 
        (containsKey(expected, ["stratified"]) && containsKey(answer, ["stratified"])) ||
        (containsKey(expected, ["cluster"]) && containsKey(answer, ["cluster"])) ||
        (containsKey(expected, ["srs", "simple"]) && containsKey(answer, ["srs", "simple"]))) {
      return { score: "E", feedback: "Correct! Great job identifying the sampling method." };
    }
    
    // Common confusion: stratified vs cluster
    if (containsKey(expected, ["stratified"]) && containsKey(answer, ["cluster"])) {
      return { score: "P", feedback: "Close! This is STRATIFIED (sample from EACH group). Cluster would select ENTIRE groups." };
    }
    if (containsKey(expected, ["cluster"]) && containsKey(answer, ["stratified"])) {
      return { score: "P", feedback: "Close! This is CLUSTER (select entire groups). Stratified would sample FROM EACH group." };
    }
    
    return { score: "I", feedback: `Incorrect. This is ${expected}. Look for key words: 'from each' = stratified, 'all in selected' = cluster.` };
  }

  // ===== Level 10: Bias and variability levels =====
  if (fieldId === "biasLevel") {
    if (studentNorm === expectedNorm || 
        (containsKey(expected, ["low", "unbiased"]) && containsKey(answer, ["low", "unbiased"])) ||
        (containsKey(expected, ["high", "biased"]) && containsKey(answer, ["high", "biased"]))) {
      return { score: "E", feedback: "Correct! Random methods are typically unbiased; convenience/voluntary methods are biased." };
    }
    return { score: "I", feedback: `Incorrect. ${expected.includes("Low") ? "Random selection produces unbiased estimates." : "Non-random methods typically produce biased results."}` };
  }

  if (fieldId === "varLevel") {
    if (studentNorm === expectedNorm || containsKey(answer, expected.split(" ")[0].toLowerCase())) {
      return { score: "E", feedback: "Correct! Variability depends on how well the method matches the population structure." };
    }
    // Partial credit for close answers
    if ((containsKey(expected, ["moderate"]) && (containsKey(answer, ["low"]) || containsKey(answer, ["high"])))) {
      return { score: "P", feedback: "Close! SRS typically has moderate variability—not optimized for any particular structure." };
    }
    return { score: "I", feedback: "Think about: Does the method match the population structure? Stratified + homogeneous strata = low variability." };
  }

  // ===== Level 11: Disadvantages =====
  if (fieldId === "disadv") {
    if (studentNorm === expectedNorm || normalize(answer) === normalize(expected)) {
      return { score: "E", feedback: "Correct! You identified the key trade-off for this sampling method." };
    }
    // Partial credit for getting the right TYPE of disadvantage
    if ((containsKey(expected, ["variability"]) && containsKey(answer, ["variability", "spread", "differ"])) ||
        (containsKey(expected, ["implement", "difficult", "expensive"]) && containsKey(answer, ["implement", "difficult", "expensive", "travel"]))) {
      return { score: "P", feedback: "You're on the right track! Make sure you're identifying the SPECIFIC disadvantage in this scenario." };
    }
    return { score: "I", feedback: `Not quite. The main issue here is: ${expected}` };
  }

  // ===== Level 12: Best method and why =====
  if (fieldId === "bestMethod") {
    if (studentNorm === expectedNorm || containsKey(answer, expected.toLowerCase())) {
      return { score: "E", feedback: "Correct! You matched the method to the population structure." };
    }
    return { score: "I", feedback: `The best method here is ${expected}. Consider: Are groups homogeneous or heterogeneous within?` };
  }

  if (fieldId === "whyBest") {
    if (studentNorm === expectedNorm || normalize(answer) === normalize(expected)) {
      return { score: "E", feedback: "Correct! You explained why this method is best for this situation." };
    }
    // Partial credit for getting part of the reasoning
    if (containsKey(answer, ["homogeneous", "heterogeneous", "variability", "practical"])) {
      return { score: "P", feedback: "Good thinking! Make sure your reasoning matches WHY this specific method is best." };
    }
    return { score: "I", feedback: `The key reason is: ${expected}` };
  }

  // ===== Level 13: Dartboard interpretation =====
  if (fieldId === "dartBias") {
    if (studentNorm === expectedNorm || 
        (containsKey(expected, ["biased"]) && containsKey(answer, ["biased"])) ||
        (containsKey(expected, ["unbiased"]) && containsKey(answer, ["unbiased"]))) {
      return { score: "E", feedback: "Correct! Bias is about WHERE the center is—at the bullseye (unbiased) or off-center (biased)." };
    }
    return { score: "I", feedback: "Look at WHERE the cluster is centered, not how spread out it is. Centered at bullseye = unbiased." };
  }

  if (fieldId === "dartVar") {
    if (studentNorm === expectedNorm || 
        (containsKey(expected, ["low"]) && containsKey(answer, ["low"])) ||
        (containsKey(expected, ["high"]) && containsKey(answer, ["high"]))) {
      return { score: "E", feedback: "Correct! Variability is about SPREAD—tight cluster (low) or scattered (high)." };
    }
    return { score: "I", feedback: "Look at how SPREAD OUT the darts are, not where they're centered. Tight = low, scattered = high." };
  }

  // ===== Level 14: Fix the problem =====
  if (fieldId === "problem") {
    if (studentNorm === expectedNorm || normalize(answer) === normalize(expected)) {
      return { score: "E", feedback: "Correct! You diagnosed the sampling problem accurately." };
    }
    if (containsKey(answer, ["bias", "random", "convenience", "voluntary"]) && containsKey(expected, ["bias", "random", "convenience", "voluntary"])) {
      return { score: "P", feedback: "You're identifying a bias issue—make sure you're selecting the most specific problem." };
    }
    if (containsKey(answer, ["variability"]) && containsKey(expected, ["variability"])) {
      return { score: "P", feedback: "You're identifying a variability issue—be more specific about the cause." };
    }
    return { score: "I", feedback: `The main problem is: ${expected}` };
  }

  if (fieldId === "fix") {
    if (studentNorm === expectedNorm || normalize(answer) === normalize(expected)) {
      return { score: "E", feedback: "Correct! That would address the sampling problem." };
    }
    if (containsKey(answer, ["random", "stratified"]) && containsKey(expected, ["random", "stratified"])) {
      return { score: "P", feedback: "Good direction! Make sure your fix specifically addresses the identified problem." };
    }
    return { score: "I", feedback: `A better fix would be: ${expected}` };
  }

  // ===== Level 15: Capstone =====
  if (fieldId === "capMethod") {
    if (studentNorm === expectedNorm || 
        (containsKey(expected, ["stratified"]) && containsKey(answer, ["stratified"])) ||
        (containsKey(expected, ["cluster"]) && containsKey(answer, ["cluster"])) ||
        (containsKey(expected, ["srs", "simple"]) && containsKey(answer, ["srs", "simple"]))) {
      return { score: "E", feedback: "Correct method identification!" };
    }
    return { score: "I", feedback: `This is ${expected}. Key: 'from each group' = stratified, 'all in selected groups' = cluster.` };
  }

  if (fieldId === "capBias") {
    if (containsKey(expected, ["unbiased"]) && containsKey(answer, ["unbiased"])) {
      return { score: "E", feedback: "Correct! Random selection methods are unbiased." };
    }
    if (containsKey(expected, ["biased"]) && containsKey(answer, ["biased"])) {
      return { score: "E", feedback: "Correct! Non-random methods tend to be biased." };
    }
    return { score: "I", feedback: "Random sampling methods (SRS, stratified, cluster) are unbiased. Convenience/voluntary are biased." };
  }

  if (fieldId === "capVar") {
    if (studentNorm === expectedNorm || 
        (containsKey(expected, ["low"]) && containsKey(answer, ["low"])) ||
        (containsKey(expected, ["moderate"]) && containsKey(answer, ["moderate"])) ||
        (containsKey(expected, ["high"]) && containsKey(answer, ["high"]))) {
      return { score: "E", feedback: "Correct variability assessment!" };
    }
    return { score: "P", feedback: `Consider: Stratified + homogeneous = low. Cluster + groups that differ = high.` };
  }

  if (fieldId === "capBetter") {
    if (studentNorm === expectedNorm || normalize(answer) === normalize(expected)) {
      return { score: "E", feedback: "Excellent! You evaluated whether a different method would improve the study." };
    }
    // Partial credit for reasonable thinking
    if ((containsKey(expected, ["no"]) && containsKey(answer, ["no"])) ||
        (containsKey(expected, ["yes"]) && containsKey(answer, ["yes"]))) {
      return { score: "P", feedback: "Right direction! Make sure your reasoning matches the scenario specifics." };
    }
    return { score: "I", feedback: `Consider: ${expected}` };
  }

  // ===== Generic fallback =====
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct!" };
  }

  return { score: "I", feedback: `Incorrect. Expected: ${expected}` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
