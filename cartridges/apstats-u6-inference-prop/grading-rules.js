// grading-rules.js - AP Statistics Unit 6 Topics 6.1-6.7
// Topics: Logic of significance testing, confidence intervals for a population proportion,
// interpreting CIs, justifying claims, confidence level meaning, factors affecting ME,
// null/alternative hypotheses, identify test procedure, test conditions,
// calculate test statistic (z-score), calculate p-value, interpret p-value,
// test direction (one-sided vs two-sided), compare p-value to alpha,
// reject/fail-to-reject decisions, write conclusions, conclusion errors,
// full significance test, capstone 6.6
// Identify evidence, two explanations, convincing evidence, identify procedure,
// check conditions, standard error, critical values, margin of error,
// confidence intervals, minimum sample size, capstone, CI interpretation,
// claim justification, confidence level interpretation, ME factors, capstone 6.3,
// test statistic, p-value, p-value interpretation, test direction, capstone 6.5,
// potential errors when performing tests, power, and factors affecting power

function normalize(str) {
  return String(str).trim().toLowerCase();
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some(k => norm.includes(normalize(k)));
}

function containsAll(answer, keywords) {
  const norm = normalize(answer);
  return keywords.every(k => norm.includes(normalize(k)));
}

function getNumericTokens(answer) {
  return String(answer).match(/-?\d*\.?\d+/g) || [];
}

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;
  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

// ============ MAIN GRADING FUNCTION ============

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  // Open-response fields
  const openResponseFields = new Set([
    "convincingExplain",
    "conditionsExplain",
    "capstoneExplain",
    "ciInterpretation",
    "claimExplain",
    "cap63Interpret",
    "cap63JustifyExplain",
    "paramDef",
    "testConditionsExplain",
    "cap64ParamDef",
    "cap64ConditionsWork",
    "pvalueInterpretation",
    "cap65Interpret",
    "conclusionText",
    "fullTestConclusion",
    "cap66ParamDef",
    "cap66Conclusion",
    "type1Interpretation",
    "type2Interpretation",
    "powerInterpretation",
    "cap67Type1",
    "cap67Type2",
    "cap67Justify",
    "twoPropConditionsExplain",
    "twoPropCIInterpretation"
  ]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter your response." };
    }
    // Number fields
    const numberFields = new Set([
      "seAnswer", "zStarAnswer", "meAnswer",
      "ciLower", "ciUpper",
      "sampleSizeAnswer",
      "capstoneLower", "capstoneUpper",
      "zStatAnswer", "pvalueAnswer",
      "type1ProbAnswer", "type2ProbAnswer", "alphaType1Prob",
      "cap65ZStat", "cap65PValue",
      "fullTestZStat", "fullTestPValue",
      "cap66ZStat", "cap66PValue",
      "twoPropMEAnswer", "twoPropCILower", "twoPropCIUpper"
    ]);
    if (numberFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter a number." };
    }
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  // ========== L01: Identify Evidence (Choice) ==========
  if (fieldId === "evidenceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You identified what counts as evidence against or for the claim by comparing the sample result to what we'd expect."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Evidence is determined by how the sample statistic (p\u0302) compares to the expected value under the null assumption. Look at whether the observed result is in the direction that supports the alternative claim.`
    };
  }

  // ========== L02: Two Explanations (Dropdown) ==========
  if (fieldId === "explanationAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! There are always exactly two explanations: (1) the result happened by random chance alone, or (2) there is a real effect or difference."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. For any study result, we consider two possibilities: it occurred due to random chance (sampling variability), or there is a genuine effect. This is the foundation of significance testing.`
    };
  }

  // ========== L03: Convincing Evidence (Choice) ==========
  if (fieldId === "convincingAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! When the probability of the observed result happening by chance alone is small (typically < 5%), the evidence IS convincing. When it's not small, we lack convincing evidence."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. If the simulation shows that results as extreme as the observed one are rare (probability < 0.05), the evidence IS convincing against the null. If the probability is not small, we do NOT have convincing evidence.`
    };
  }

  // ========== L03: Convincing Explain (Textarea) ==========
  if (fieldId === "convincingExplain") {
    const probKeywords = ["probability", "proportion", "p-value", "percent", "%", "out of"];
    const chanceKeywords = ["chance", "random", "luck", "unlikely", "likely", "rare", "common", "unusual"];
    const simKeywords = ["simulation", "simulated", "trials", "repetitions", "dots"];

    const mentionsProb = containsAny(answer, probKeywords);
    const mentionsChance = containsAny(answer, chanceKeywords);
    const mentionsSim = containsAny(answer, simKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 6;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "which"]);

    // E: mentions probability/proportion AND chance/random AND substance
    if (mentionsProb && mentionsChance && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly connected the simulation probability to whether the result is likely due to chance alone."
      };
    }
    // P: mentions at least one key concept + substance
    if ((mentionsProb || mentionsChance || mentionsSim) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! To earn full credit, reference both the probability from the simulation AND whether the result is likely or unlikely to occur by chance alone."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should reference the simulation probability and explain whether the observed result is likely or unlikely to happen by random chance alone. For example: 'Because only ___% of simulations produced results this extreme, it is unlikely to occur by chance alone.'"
    };
  }

  // ========== L04: Identify Procedure (Dropdown) ==========
  if (fieldId === "procedureAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You identified the right inference procedure. Ask: How many samples? What data type? What's the goal (CI or test)?"
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct procedure is: ${expected}. To identify the right procedure, ask: (1) How many samples or groups? (2) Is the data categorical (proportion) or quantitative (mean)? (3) Is the goal to estimate (CI) or test a claim (significance test)?`
    };
  }

  // ========== L05: Conditions Met (Choice) ==========
  if (fieldId === "conditionsMet") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You correctly assessed whether all three conditions (Random, 10%, and Large Counts) are satisfied."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. The three conditions are: (1) Random: data comes from a random sample or experiment, (2) 10%: n \u2264 10% of the population, (3) Large Counts: np\u0302 \u2265 10 AND n(1\u2212p\u0302) \u2265 10. ALL three must be met.`
    };
  }

  // ========== L05: Conditions Explain (Textarea) ==========
  if (fieldId === "conditionsExplain") {
    const randomKeywords = ["random", "randomly", "srs", "random sample", "random assignment"];
    const tenPctKeywords = ["10%", "ten percent", "10 percent", "less than 10", "population size", "n <", "n \u2264"];
    const largeCountKeywords = ["large counts", "successes", "failures", "np", "n(1", "np\u0302", "\u2265 10", ">= 10", "at least 10"];

    const mentionsRandom = containsAny(answer, randomKeywords);
    const mentionsTenPct = containsAny(answer, tenPctKeywords);
    const mentionsLargeCounts = containsAny(answer, largeCountKeywords);

    const conditionCount = [mentionsRandom, mentionsTenPct, mentionsLargeCounts].filter(Boolean).length;
    const hasSubstance = answer.trim().split(/\s+/).length >= 6;

    // E: mentions all relevant conditions
    if (conditionCount >= 3 && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You addressed all three conditions: Random, 10%, and Large Counts."
      };
    }
    // P: mentions some conditions
    if (conditionCount >= 1 && hasSubstance) {
      const missing = [];
      if (!mentionsRandom) missing.push("Random (data from random sample/experiment)");
      if (!mentionsTenPct) missing.push("10% condition (n \u2264 10% of population)");
      if (!mentionsLargeCounts) missing.push("Large Counts (np\u0302 \u2265 10 and n(1\u2212p\u0302) \u2265 10)");
      return {
        score: "P",
        feedback: `Good start! You're missing: ${missing.join(", ")}. All three conditions must be verified for inference.`
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should address all three conditions for inference: (1) Random: is the data from a random sample? (2) 10%: is n \u2264 10% of the population? (3) Large Counts: are np\u0302 \u2265 10 AND n(1\u2212p\u0302) \u2265 10? Show the numbers for each."
    };
  }

  // ========== L06: Standard Error (Number) ==========
  if (fieldId === "seAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Common error: forgot the square root (squared the SE)
    const seSquared = expectedVal * expectedVal;
    if (Math.abs(studentVal - seSquared) < 0.001 && diff > 0.002) {
      return {
        score: "I",
        feedback: `It looks like you forgot to take the square root! SE(p\u0302) = \u221A(p\u0302(1\u2212p\u0302)/n), not p\u0302(1\u2212p\u0302)/n. The correct SE is ${expectedVal}.`
      };
    }

    // Common error: used p instead of p-hat (or vice versa) if both exist
    if (context.pHat !== undefined && context.p0 !== undefined && context.pHat !== context.p0) {
      const wrongSE_p0 = Math.sqrt(context.p0 * (1 - context.p0) / context.n);
      const wrongSE_pHat = Math.sqrt(context.pHat * (1 - context.pHat) / context.n);
      if (Math.abs(studentVal - wrongSE_p0) < 0.002 && diff > 0.002) {
        return {
          score: "I",
          feedback: `It looks like you used p\u2080 = ${context.p0} instead of p\u0302 = ${context.pHat}. For a confidence interval, use the sample proportion p\u0302 in the SE formula. SE = \u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}.`
        };
      }
      if (Math.abs(studentVal - wrongSE_pHat) < 0.002 && diff > 0.002) {
        return {
          score: "I",
          feedback: `It looks like you used p\u0302 = ${context.pHat} instead of p\u2080 = ${context.p0}. Check which proportion is appropriate for this calculation. The correct SE is ${expectedVal}.`
        };
      }
    }

    if (diff <= 0.002) {
      return {
        score: "E",
        feedback: `Correct! SE(p\u0302) = \u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! Check your arithmetic. SE(p\u0302) = \u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. SE(p\u0302) = \u221A(p\u0302(1\u2212p\u0302)/n). The correct standard error is ${expectedVal}. Make sure you're using the right values for p\u0302 and n.`
    };
  }

  // ========== L07: Critical Value z* (Number) ==========
  if (fieldId === "zStarAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! z* = ${expectedVal} for this confidence level. Common values: 90% \u2192 1.645, 95% \u2192 1.960, 99% \u2192 2.576.`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! The exact critical value is z* = ${expectedVal}. Double-check your z-table or recall: 90% \u2192 1.645, 95% \u2192 1.960, 99% \u2192 2.576.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The critical value is z* = ${expectedVal}. Common critical values: 90% \u2192 1.645, 95% \u2192 1.960, 99% \u2192 2.576. Find the z-value that captures the central area equal to the confidence level.`
    };
  }

  // ========== L08: Margin of Error (Number) ==========
  if (fieldId === "meAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used SE instead of ME (forgot to multiply by z*)
    if (context.answers?.seAnswer?.value !== undefined) {
      const se = context.answers.seAnswer.value;
      if (Math.abs(studentVal - se) < 0.002 && diff > 0.002) {
        return {
          score: "I",
          feedback: `It looks like you gave the standard error, not the margin of error. ME = z* \u00D7 SE, so multiply by the critical value z*. The correct margin of error is ${expectedVal}.`
        };
      }
    }

    if (diff <= 0.002) {
      return {
        score: "E",
        feedback: `Correct! Margin of error = z* \u00D7 SE = ${expectedVal}`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! Check your arithmetic. Margin of error = z* \u00D7 SE(p\u0302) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Margin of error = z* \u00D7 SE(p\u0302) = z* \u00D7 \u221A(p\u0302(1\u2212p\u0302)/n). The correct value is ${expectedVal}. Make sure you're multiplying the critical value by the standard error.`
    };
  }

  // ========== L09: CI Lower Bound (Number) ==========
  if (fieldId === "ciLower") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student swapped lower and upper
    const upperObj = getExpectedObj(context, "ciUpper");
    if (upperObj.value !== undefined && Math.abs(studentVal - upperObj.value) < 0.005 && diff > 0.005) {
      return {
        score: "I",
        feedback: `Check which is the lower bound and which is the upper bound. The lower bound = p\u0302 \u2212 ME and the upper bound = p\u0302 + ME. Lower = ${expectedVal}, Upper = ${upperObj.value}.`
      };
    }

    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! Lower bound = p\u0302 \u2212 ME = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! The lower bound = p\u0302 \u2212 z*\u00D7SE = ${expectedVal}. Check your calculation.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Lower bound = p\u0302 \u2212 z* \u00D7 \u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}. Subtract the margin of error from the sample proportion.`
    };
  }

  // ========== L09: CI Upper Bound (Number) ==========
  if (fieldId === "ciUpper") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student swapped lower and upper
    const lowerObj = getExpectedObj(context, "ciLower");
    if (lowerObj.value !== undefined && Math.abs(studentVal - lowerObj.value) < 0.005 && diff > 0.005) {
      return {
        score: "I",
        feedback: `Check which is the lower bound and which is the upper bound. The lower bound = p\u0302 \u2212 ME and the upper bound = p\u0302 + ME. Lower = ${lowerObj.value}, Upper = ${expectedVal}.`
      };
    }

    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! Upper bound = p\u0302 + ME = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! The upper bound = p\u0302 + z*\u00D7SE = ${expectedVal}. Check your calculation.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Upper bound = p\u0302 + z* \u00D7 \u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}. Add the margin of error to the sample proportion.`
    };
  }

  // ========== L10: Minimum Sample Size (Number) ==========
  if (fieldId === "sampleSizeAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student rounded DOWN instead of UP
    if (studentVal === Math.floor(expectedVal) - 1 || studentVal === expectedVal - 1) {
      return {
        score: "P",
        feedback: `Almost! Remember to always round UP to the next whole integer for sample size. n = ${expectedVal}, not ${studentVal}. We round up because we need at least that many to achieve the desired margin of error.`
      };
    }

    // Check if student rounded down instead of up (more general)
    if (studentVal < expectedVal && diff <= 1 && diff > 0) {
      return {
        score: "P",
        feedback: `Close! Remember to always round UP to the next integer for minimum sample size. The answer is n = ${expectedVal}.`
      };
    }

    // Exact match or within 1 (E tolerance)
    if (diff <= 1) {
      return {
        score: "E",
        feedback: `Correct! The minimum sample size is n = ${expectedVal}. Remember: n \u2265 p\u0302(1\u2212p\u0302) \u00D7 (z*/ME)\u00B2, always round UP.`
      };
    }
    // Within 5 (P tolerance)
    if (diff <= 5) {
      return {
        score: "P",
        feedback: `Close! The minimum sample size is n = ${expectedVal}. Use n \u2265 p\u0302(1\u2212p\u0302) \u00D7 (z*/ME)\u00B2 and round UP. Use p\u0302 = 0.5 if no prior estimate is given.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The minimum sample size is n = ${expectedVal}. Formula: n \u2265 p\u0302(1\u2212p\u0302) \u00D7 (z*/ME)\u00B2. Use p\u0302 = 0.5 if no prior estimate is available (this gives the most conservative/largest n). Always round UP to the next integer.`
    };
  }

  // ========== L11: Capstone Conditions (Choice) ==========
  if (fieldId === "capstoneConditions") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You correctly verified whether all three conditions for inference (Random, 10%, Large Counts) are met."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Check each condition: (1) Random sample or random assignment? (2) n \u2264 10% of population? (3) np\u0302 \u2265 10 AND n(1\u2212p\u0302) \u2265 10? All three must hold.`
    };
  }

  // ========== L11: Capstone Lower Bound (Number) ==========
  if (fieldId === "capstoneLower") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student swapped lower and upper
    const upperObj = getExpectedObj(context, "capstoneUpper");
    if (upperObj.value !== undefined && Math.abs(studentVal - upperObj.value) < 0.005 && diff > 0.005) {
      return {
        score: "I",
        feedback: `Check which is the lower bound and which is the upper bound. Lower = p\u0302 \u2212 ME = ${expectedVal}, Upper = p\u0302 + ME = ${upperObj.value}.`
      };
    }

    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! Lower bound = p\u0302 \u2212 z*\u00D7SE = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! The lower bound = p\u0302 \u2212 z*\u00D7\u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}. Check your arithmetic.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Lower bound = p\u0302 \u2212 z* \u00D7 \u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}. Review your SE and z* values.`
    };
  }

  // ========== L11: Capstone Upper Bound (Number) ==========
  if (fieldId === "capstoneUpper") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student swapped lower and upper
    const lowerObj = getExpectedObj(context, "capstoneLower");
    if (lowerObj.value !== undefined && Math.abs(studentVal - lowerObj.value) < 0.005 && diff > 0.005) {
      return {
        score: "I",
        feedback: `Check which is the lower bound and which is the upper bound. Lower = p\u0302 \u2212 ME = ${lowerObj.value}, Upper = p\u0302 + ME = ${expectedVal}.`
      };
    }

    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! Upper bound = p\u0302 + z*\u00D7SE = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! The upper bound = p\u0302 + z*\u00D7\u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}. Check your arithmetic.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Upper bound = p\u0302 + z* \u00D7 \u221A(p\u0302(1\u2212p\u0302)/n) = ${expectedVal}. Review your SE and z* values.`
    };
  }

  // ========== L11: Capstone Explain (Textarea) ==========
  if (fieldId === "capstoneExplain") {
    const confKeywords = ["confident", "confidence"];
    const boundsKeywords = ["from", "between", "interval", "lower bound", "upper bound", "to"];
    const contextKeywords = ["proportion", "population", "true proportion", "all", "who"];

    const mentionsConfidence = containsAny(answer, confKeywords);
    const mentionsBounds = containsAny(answer, boundsKeywords);
    const mentionsContext = containsAny(answer, contextKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    // Check for common misconceptions
    const hasProbMisconception = containsAny(answer, ["probability that", "% probability", "chance that the true"]);
    const hasAcceptNull = containsAny(answer, ["accept the null", "accept h0", "prove"]);

    if (hasProbMisconception) {
      return {
        score: "P",
        feedback: "Careful! A confidence interval does NOT describe the probability that the true proportion falls in the interval. Instead, say 'We are __% confident that the interval from ___ to ___ captures the true proportion of [context].' The confidence level describes the method's reliability, not the probability for any single interval."
      };
    }

    if (hasAcceptNull) {
      return {
        score: "I",
        feedback: "Avoid the language 'accept the null' or 'prove.' In statistics, we never accept or prove \u2014 we only have evidence for or against. For CI interpretation: 'We are __% confident that the interval from ___ to ___ captures the true proportion of [context].'"
      };
    }

    // E: mentions confidence level + bounds/interval + context
    if (mentionsConfidence && mentionsBounds && mentionsContext && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent interpretation! You included the confidence level, the interval bounds, and the context of the problem."
      };
    }
    // P: mentions two of three
    const partCount = [mentionsConfidence, mentionsBounds, mentionsContext].filter(Boolean).length;
    if (partCount >= 2 && hasSubstance) {
      const missing = [];
      if (!mentionsConfidence) missing.push("the confidence level (e.g., 'We are 95% confident...')");
      if (!mentionsBounds) missing.push("the interval bounds (e.g., 'from ___ to ___')");
      if (!mentionsContext) missing.push("the context (what the proportion represents)");
      return {
        score: "P",
        feedback: `Good interpretation! To earn full credit, also include: ${missing.join(", ")}. Template: 'We are __% confident that the interval from ___ to ___ captures the true proportion of [context].`
      };
    }
    return {
      score: "I",
      feedback: "Your interpretation must include three elements: (1) the confidence level ('We are __% confident'), (2) the interval bounds ('from ___ to ___'), and (3) the context ('the true proportion of [what]'). Template: 'We are __% confident that the interval from ___ to ___ captures the true proportion of [context].'"
    };
  }

  // ========== L12: CI Interpretation (Textarea) ==========
  if (fieldId === "ciInterpretation") {
    const confKeywords = ["confident", "confidence"];
    const boundsKeywords = ["from", "between", "interval", "to"];
    const contextKeywords = ["proportion", "population", "true proportion", "all", "who", "captures"];

    const mentionsConfidence = containsAny(answer, confKeywords);
    const mentionsBounds = containsAny(answer, boundsKeywords);
    const mentionsContext = containsAny(answer, contextKeywords);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    // Check for probability misconception
    const hasProbMisconception = containsAny(answer, ["probability that", "% probability", "chance that the true"]);
    if (hasProbMisconception) {
      return { score: "P", feedback: "Careful! Say 'We are __% confident...' not 'There is a __% probability...' The confidence level describes the method's reliability, not the probability for a single interval." };
    }

    // E: all three elements + substance
    if (mentionsConfidence && mentionsBounds && mentionsContext && hasSubstance) {
      return { score: "E", feedback: "Excellent! Your interpretation includes the confidence level, interval bounds, and context." };
    }
    // P: two of three + substance
    const count = [mentionsConfidence, mentionsBounds, mentionsContext].filter(Boolean).length;
    if (count >= 2 && hasSubstance) {
      const missing = [];
      if (!mentionsConfidence) missing.push("confidence level ('We are __% confident...')");
      if (!mentionsBounds) missing.push("interval bounds ('from ___ to ___')");
      if (!mentionsContext) missing.push("context (what the proportion represents)");
      return { score: "P", feedback: `Good start! Also include: ${missing.join(", ")}` };
    }
    return { score: "I", feedback: "Include three elements: (1) 'We are __% confident', (2) 'the interval from ___ to ___', (3) 'captures the true proportion of [context]'." };
  }

  // ========== L13: Claim Answer (Choice) ==========
  if (fieldId === "claimAnswer") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You correctly determined whether the CI provides convincing evidence for the claim." };
    }
    return { score: "I", feedback: `Incorrect. ${expected}. If ALL values in the CI are consistent with the claim → convincing evidence. If ANY value is inconsistent → not convincing evidence.` };
  }

  // ========== L13: Claim Explain (Textarea) ==========
  if (fieldId === "claimExplain") {
    const allKeywords = ["all values", "all of the values", "every value", "entire interval", "all plausible"];
    const someKeywords = ["some values", "includes", "contains", "straddles", "not all", "one or more"];
    const intervalKeywords = ["interval", "from", "between", "to"];

    const mentionsAllOrSome = containsAny(answer, [...allKeywords, ...someKeywords]);
    const mentionsInterval = containsAny(answer, intervalKeywords);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so"]);

    if (mentionsAllOrSome && mentionsInterval && hasSubstance && hasReasoning) {
      return { score: "E", feedback: "Excellent! You clearly connected the CI values to whether they're all consistent with the claim." };
    }
    if ((mentionsAllOrSome || mentionsInterval) && hasSubstance) {
      return { score: "P", feedback: "Good start! Make sure to explain whether ALL or SOME values in the interval are consistent with the claim, and connect this to your conclusion." };
    }
    return { score: "I", feedback: "Explain whether ALL values in the CI are consistent with the claim (convincing) or if SOME values are inconsistent (not convincing). Reference the specific interval bounds and the claim threshold." };
  }

  // ========== L14: Confidence Level Answer (Dropdown) ==========
  if (fieldId === "confLevelAnswer") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! The confidence level describes what happens in repeated sampling — approximately C% of intervals will capture the true parameter." };
    }
    // Check for probability misconception
    if (containsAny(answer, ["probability", "chance"])) {
      return { score: "I", feedback: `Incorrect. A common misconception! The confidence level does NOT give the probability that a particular interval captures the parameter. ${expected}` };
    }
    return { score: "I", feedback: `Incorrect. ${expected}. The confidence level describes the long-run capture rate of the METHOD — in repeated sampling, about C% of CIs will capture the true proportion.` };
  }

  // ========== L15: Factor Answer (Choice) ==========
  if (fieldId === "factorAnswer") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! ME = z* × √(p̂(1−p̂)/n). Larger n → smaller ME. Higher confidence → larger z* → larger ME." };
    }
    return { score: "I", feedback: `Incorrect. The correct answer is: ${expected}. Remember: ME = z* × √(p̂(1−p̂)/n). Increasing n makes ME smaller (n is in denominator). Increasing confidence level makes z* larger, which increases ME.` };
  }

  // ========== L16 Capstone: CI Interpretation (Textarea) ==========
  if (fieldId === "cap63Interpret") {
    const confKeywords = ["confident", "confidence"];
    const boundsKeywords = ["from", "between", "interval", "to"];
    const contextKeywords = ["proportion", "population", "true proportion", "all", "who", "captures"];

    const mentionsConfidence = containsAny(answer, confKeywords);
    const mentionsBounds = containsAny(answer, boundsKeywords);
    const mentionsContext = containsAny(answer, contextKeywords);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    // Check for probability misconception
    const hasProbMisconception = containsAny(answer, ["probability that", "% probability", "chance that the true"]);
    if (hasProbMisconception) {
      return { score: "P", feedback: "Careful! Say 'We are __% confident...' not 'There is a __% probability...' The confidence level describes the method's reliability, not the probability for a single interval." };
    }

    // E: all three elements + substance
    if (mentionsConfidence && mentionsBounds && mentionsContext && hasSubstance) {
      return { score: "E", feedback: "Excellent! Your interpretation includes the confidence level, interval bounds, and context." };
    }
    // P: two of three + substance
    const count63 = [mentionsConfidence, mentionsBounds, mentionsContext].filter(Boolean).length;
    if (count63 >= 2 && hasSubstance) {
      const missing = [];
      if (!mentionsConfidence) missing.push("confidence level ('We are __% confident...')");
      if (!mentionsBounds) missing.push("interval bounds ('from ___ to ___')");
      if (!mentionsContext) missing.push("context (what the proportion represents)");
      return { score: "P", feedback: `Good start! Also include: ${missing.join(", ")}` };
    }
    return { score: "I", feedback: "Include three elements: (1) 'We are __% confident', (2) 'the interval from ___ to ___', (3) 'captures the true proportion of [context]'." };
  }

  // ========== L16 Capstone: Justify (Choice) ==========
  if (fieldId === "cap63Justify") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You correctly determined whether the CI provides convincing evidence for the claim." };
    }
    return { score: "I", feedback: `Incorrect. ${expected}. If ALL values in the CI are consistent with the claim → convincing evidence. If ANY value is inconsistent → not convincing evidence.` };
  }

  // ========== L16 Capstone: Justify Explain (Textarea) ==========
  if (fieldId === "cap63JustifyExplain") {
    const allKeywords = ["all values", "all of the values", "every value", "entire interval", "all plausible"];
    const someKeywords = ["some values", "includes", "contains", "straddles", "not all", "one or more"];
    const intervalKeywords = ["interval", "from", "between", "to"];

    const mentionsAllOrSome = containsAny(answer, [...allKeywords, ...someKeywords]);
    const mentionsInterval = containsAny(answer, intervalKeywords);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so"]);

    if (mentionsAllOrSome && mentionsInterval && hasSubstance && hasReasoning) {
      return { score: "E", feedback: "Excellent! You clearly connected the CI values to whether they're all consistent with the claim." };
    }
    if ((mentionsAllOrSome || mentionsInterval) && hasSubstance) {
      return { score: "P", feedback: "Good start! Make sure to explain whether ALL or SOME values in the interval are consistent with the claim, and connect this to your conclusion." };
    }
    return { score: "I", feedback: "Explain whether ALL values in the CI are consistent with the claim (convincing) or if SOME values are inconsistent (not convincing). Reference the specific interval bounds and the claim threshold." };
  }

  // ========== L17: Null Hypothesis Answer (Dropdown) ==========
  if (fieldId === "nullAnswer") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! The null hypothesis always uses '=' and the population parameter p (not p\u0302)." };
    }
    if (containsAny(answer, ["p\u0302", "p-hat", "phat"])) {
      return { score: "I", feedback: `Incorrect. You chose an option with p\u0302 (sample proportion). Hypotheses are about the POPULATION parameter p, not the sample statistic. The correct answer is: ${expected}` };
    }
    if (containsAny(answer, [">", "<", "\u2260"])) {
      return { score: "I", feedback: `Incorrect. The NULL hypothesis must always contain an equality sign (=). Inequalities belong in the alternative. The correct answer is: ${expected}` };
    }
    return { score: "I", feedback: `Incorrect. The correct null hypothesis is: ${expected}. Remember: H\u2080 always uses '=' and the population parameter p.` };
  }

  // ========== L18: Alternative Hypothesis Answer (Dropdown) ==========
  if (fieldId === "altAnswer") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You identified the right direction for the alternative hypothesis based on the research question." };
    }
    if (containsAny(answer, ["p\u0302", "p-hat", "phat"])) {
      return { score: "I", feedback: `Incorrect. Hypotheses use the population parameter p, not the sample proportion p\u0302. The correct answer is: ${expected}` };
    }
    return { score: "I", feedback: `Incorrect. The correct alternative is: ${expected}. Look for keywords: 'more/greater/higher' \u2192 >, 'less/fewer/lower' \u2192 <, 'different/differs/changed' \u2192 \u2260.` };
  }

  // ========== L19/L23: Null Hypothesis (Text) ==========
  if (fieldId === "nullHypothesis" || fieldId === "cap64Null") {
    const p0 = context?.p0 || "";
    const hasPHat = containsAny(answer, ["p\u0302", "p-hat", "phat", "p hat"]);
    const hasEquality = studentNorm.includes("=") && !studentNorm.includes("!=") && !studentNorm.includes("\u2260");
    const hasCorrectP0 = studentNorm.includes(String(p0));

    if (hasPHat) {
      return { score: "I", feedback: `Hypotheses use p (population parameter), NOT p\u0302 (sample statistic). Correct: H\u2080: p = ${p0}` };
    }
    if (hasEquality && hasCorrectP0) {
      return { score: "E", feedback: `Correct! H\u2080: p = ${p0}. The null always contains '='.` };
    }
    if (hasEquality && !hasCorrectP0) {
      return { score: "P", feedback: `The structure is right (uses '='), but check your p\u2080 value. The claimed proportion is ${p0}. Correct: H\u2080: p = ${p0}` };
    }
    if (!hasEquality && hasCorrectP0) {
      return { score: "I", feedback: `The null hypothesis must contain '=' (equality). Correct: H\u2080: p = ${p0}` };
    }
    return { score: "I", feedback: `Incorrect. The null hypothesis is: H\u2080: p = ${p0}. Always uses '=' and the parameter p.` };
  }

  // ========== L19/L23: Alternative Hypothesis (Text) ==========
  if (fieldId === "altHypothesis" || fieldId === "cap64Alt") {
    const p0 = context?.p0 || "";
    const dir = context?.direction || "";
    const hasPHat = containsAny(answer, ["p\u0302", "p-hat", "phat", "p hat"]);
    const hasCorrectP0 = studentNorm.includes(String(p0));

    const dirMap = { ">": [">"], "<": ["<"], "!=": ["\u2260", "!=", "not equal", "=/="] };
    const expectedDirSymbols = dirMap[dir] || [];
    const hasCorrectDir = expectedDirSymbols.some(d => studentNorm.includes(d));

    if (hasPHat) {
      return { score: "I", feedback: `Hypotheses use p (population parameter), NOT p\u0302. Correct: ${expected}` };
    }
    if (hasCorrectDir && hasCorrectP0) {
      return { score: "E", feedback: `Correct! ${expected}` };
    }
    if (hasCorrectP0 && !hasCorrectDir) {
      return { score: "P", feedback: `Right p\u2080 value, but check the direction. The keyword "${context?.keyword || ""}" suggests the alternative should use "${dir}". Correct: ${expected}` };
    }
    if (hasCorrectDir && !hasCorrectP0) {
      return { score: "P", feedback: `Right direction, but the p\u2080 value should be ${p0}. Correct: ${expected}` };
    }
    return { score: "I", feedback: `Incorrect. The correct alternative is: ${expected}. Direction comes from the research question keywords.` };
  }

  // ========== L19/L23: Parameter Definition (Textarea) ==========
  if (fieldId === "paramDef" || fieldId === "cap64ParamDef") {
    const mentionsProportion = containsAny(answer, ["proportion", "percent", "percentage", "fraction"]);
    const mentionsPopulation = containsAny(answer, ["all", "every", "would", "population", "true"]);
    const mentionsContext = answer.trim().split(/\s+/).length >= 5;

    // Check for sample language (bad)
    const hasSampleLang = containsAny(answer, ["surveyed", "sampled", "in the sample", "who said", "who were asked", "who responded"]) && !mentionsPopulation;

    if (mentionsProportion && mentionsPopulation && mentionsContext) {
      return { score: "E", feedback: "Excellent! You defined the parameter using population language ('all', 'would') and included context." };
    }
    if (hasSampleLang) {
      return { score: "P", feedback: "You're using sample language. Define p using population language: 'the proportion of ALL [population] who WOULD [action].' Use 'all' or 'every' and 'would' to refer to the entire population." };
    }
    if (mentionsProportion && mentionsContext && !mentionsPopulation) {
      return { score: "P", feedback: "Good! You mentioned the proportion and context, but add population language ('all', 'would') to distinguish from the sample. Example: 'p = the proportion of ALL [population] who would [action]'." };
    }
    return { score: "I", feedback: "Define p in context: 'p = the proportion of ALL [population] who [would do something].' Must include 'proportion,' population language ('all'/'would'), and context." };
  }

  // ========== L20: Hypothesis Error Detection (Dropdown) ==========
  if (fieldId === "errorAnswer") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You identified the error in the hypotheses." };
    }
    return { score: "I", feedback: `Incorrect. The error is: ${expected}. Common errors: using p\u0302 instead of p, putting inequality in H\u2080, using equality in H\u2090, wrong direction, sample language in parameter definition, wrong p\u2080 value.` };
  }

  // ========== L21: Identify Test Procedure (Dropdown) ==========
  if (fieldId === "testAnswer") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! One sample, categorical data, testing a claim \u2192 One-sample z-test for a population proportion." };
    }
    if (containsAny(answer, ["interval", "z-interval"])) {
      return { score: "I", feedback: `Incorrect. The goal is to TEST a claim, not to ESTIMATE. Use a z-TEST, not a z-INTERVAL. The correct procedure is: ${expected}` };
    }
    if (containsAny(answer, ["two-sample", "two sample"])) {
      return { score: "I", feedback: `Incorrect. There is only ONE sample here, not two groups being compared. The correct procedure is: ${expected}` };
    }
    if (containsAny(answer, ["t-test", "t test"])) {
      return { score: "I", feedback: `Incorrect. The data are categorical (proportions), not quantitative (means). Use a z-test, not a t-test. The correct procedure is: ${expected}` };
    }
    return { score: "I", feedback: `Incorrect. The correct procedure is: ${expected}. Ask: (1) Test or estimate? (2) Proportions or means? (3) One sample or two?` };
  }

  // ========== L22/L23: Test Conditions Met (Choice) ==========
  if (fieldId === "testConditionsMet" || fieldId === "cap64ConditionsMet") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! You correctly assessed whether all three conditions (Random, 10%, Large Counts) are met for the z-test." };
    }
    return { score: "I", feedback: `Incorrect. The correct answer is: ${expected}. Check: (1) Random sample? (2) n \u2264 10% of N? (3) np\u2080 \u2265 10 AND n(1\u2212p\u2080) \u2265 10? Remember: use p\u2080 (null value), NOT p\u0302!` };
  }

  // ========== L22/L23: Test Conditions Explain (Textarea) ==========
  if (fieldId === "testConditionsExplain" || fieldId === "cap64ConditionsWork") {
    const randomKeywords = ["random", "randomly", "srs", "random sample", "random assignment"];
    const tenPctKeywords = ["10%", "ten percent", "10 percent", "less than 10", "\u2264"];
    const largeCountKeywords = ["large counts", "np", "n(1", "np\u2080", "\u2265 10", ">= 10", "at least 10"];

    const mentionsRandom = containsAny(answer, randomKeywords);
    const mentionsTenPct = containsAny(answer, tenPctKeywords);
    const mentionsLargeCounts = containsAny(answer, largeCountKeywords);

    const conditionCount = [mentionsRandom, mentionsTenPct, mentionsLargeCounts].filter(Boolean).length;
    const hasSubstance = answer.trim().split(/\s+/).length >= 6;

    // Check for common error: using p-hat instead of p0
    const usesPHat = containsAny(answer, ["p\u0302", "p-hat", "phat", "sample proportion"]) && !containsAny(answer, ["p\u2080", "p0", "null", "claimed"]);

    if (usesPHat && mentionsLargeCounts) {
      return { score: "P", feedback: "Careful! For a significance TEST, the large counts condition uses p\u2080 (the null value), NOT p\u0302 (the sample proportion). This is because we ASSUME H\u2080 is true when checking conditions. Recalculate: np\u2080 and n(1\u2212p\u2080)." };
    }

    if (conditionCount >= 3 && hasSubstance) {
      return { score: "E", feedback: "Excellent! You checked all three conditions using p\u2080 (null value) for the large counts check." };
    }
    if (conditionCount >= 1 && hasSubstance) {
      const missing = [];
      if (!mentionsRandom) missing.push("Random (data from random sample/experiment)");
      if (!mentionsTenPct) missing.push("10% condition (n \u2264 10% of N)");
      if (!mentionsLargeCounts) missing.push("Large Counts (np\u2080 \u2265 10 and n(1\u2212p\u2080) \u2265 10)");
      return { score: "P", feedback: `Good start! Missing: ${missing.join(", ")}. Remember to use p\u2080 (not p\u0302) for the large counts check.` };
    }
    return { score: "I", feedback: "Check all three conditions: (1) Random sample? (2) n \u2264 10% of N? (3) np\u2080 \u2265 10 AND n(1\u2212p\u2080) \u2265 10? IMPORTANT: Use p\u2080 (null value), NOT p\u0302, for the large counts check." };
  }

  // ========== L21/L23: Test Procedure (Dropdown, capstone) ==========
  if (fieldId === "cap64Procedure") {
    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct! One-sample z-test for a population proportion." };
    }
    return { score: "I", feedback: `Incorrect. The correct procedure is: ${expected}. One sample + categorical data + testing a claim = one-sample z-test for p.` };
  }

  // ========== L24/L28: Test Statistic z (Number) ==========
  if (fieldId === "zStatAnswer" || fieldId === "cap65ZStat") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used p-hat instead of p0 in the denominator
    if (context.pHat !== undefined && context.p0 !== undefined && context.n !== undefined) {
      const pHat = parseFloat(context.pHat);
      const p0 = parseFloat(context.p0);
      const n = parseFloat(context.n);
      if (pHat !== p0) {
        const wrongSD = Math.sqrt(pHat * (1 - pHat) / n);
        const wrongZ = Math.round((pHat - p0) / wrongSD * 100) / 100;
        if (Math.abs(studentVal - wrongZ) < 0.03 && diff > 0.03) {
          return {
            score: "I",
            feedback: `It looks like you used p\u0302 = ${pHat} in the denominator instead of p\u2080 = ${p0}. For a significance test, use p\u2080 in the standard deviation because we ASSUME H\u2080 is true. z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n) = ${expectedVal}`
          };
        }
      }
    }

    // Check if student forgot to subtract (gave p-hat / SD)
    if (context.pHat !== undefined && context.p0 !== undefined && context.n !== undefined) {
      const pHat = parseFloat(context.pHat);
      const p0 = parseFloat(context.p0);
      const n = parseFloat(context.n);
      const sd = Math.sqrt(p0 * (1 - p0) / n);
      const wrongZ = Math.round(pHat / sd * 100) / 100;
      if (Math.abs(studentVal - wrongZ) < 0.03 && diff > 0.03) {
        return {
          score: "I",
          feedback: `It looks like you divided p\u0302 by the standard deviation without subtracting p\u2080 first. The numerator is (p\u0302 \u2212 p\u2080), not just p\u0302. z = (${pHat} \u2212 ${p0}) / \u221a(${p0}(1\u2212${p0})/${n}) = ${expectedVal}`
        };
      }
    }

    if (diff <= 0.02) {
      return {
        score: "E",
        feedback: `Correct! z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n) = ${expectedVal}`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! Check your arithmetic. z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n). The correct test statistic is ${expectedVal}. Make sure you're using p\u2080 (the null value) in the denominator, not p\u0302.`
    };
  }

  // ========== L25/L28: p-Value (Number) ==========
  if (fieldId === "pvalueAnswer" || fieldId === "cap65PValue") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    if (studentVal < 0 || studentVal > 1) {
      return { score: "I", feedback: "A p-value must be between 0 and 1." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student did one-tail when they should have done two-tail (or vice versa)
    if (context.direction === "!=" && expectedVal > 0) {
      const halfPValue = Math.round(expectedVal / 2 * 10000) / 10000;
      if (Math.abs(studentVal - halfPValue) < 0.002 && diff > 0.002) {
        return {
          score: "P",
          feedback: `You found the one-tail area, but this is a TWO-sided test (H\u2090: p \u2260 p\u2080). You need to DOUBLE the tail area. p-value = 2 \u00d7 ${halfPValue} = ${expectedVal}`
        };
      }
    }
    if ((context.direction === ">" || context.direction === "<") && expectedVal > 0) {
      const doublePValue = Math.round(expectedVal * 2 * 10000) / 10000;
      if (Math.abs(studentVal - doublePValue) < 0.002 && diff > 0.002) {
        return {
          score: "P",
          feedback: `You doubled the tail area, but this is a ONE-sided test. For H\u2090: p ${context.direction} p\u2080, use just the single tail area. p-value = ${expectedVal}`
        };
      }
    }

    // Check if student used the wrong tail
    if (context.direction === ">" && expectedVal < 0.5) {
      const wrongTail = Math.round((1 - expectedVal) * 10000) / 10000;
      if (Math.abs(studentVal - wrongTail) < 0.002 && diff > 0.002) {
        return {
          score: "I",
          feedback: `You found the area in the wrong tail. For H\u2090: p > p\u2080, find the area to the RIGHT of z (upper tail). p-value = ${expectedVal}`
        };
      }
    }
    if (context.direction === "<" && expectedVal < 0.5) {
      const wrongTail = Math.round((1 - expectedVal) * 10000) / 10000;
      if (Math.abs(studentVal - wrongTail) < 0.002 && diff > 0.002) {
        return {
          score: "I",
          feedback: `You found the area in the wrong tail. For H\u2090: p < p\u2080, find the area to the LEFT of z (lower tail). p-value = ${expectedVal}`
        };
      }
    }

    if (diff <= 0.002) {
      return {
        score: "E",
        feedback: `Correct! p-value = ${expectedVal}. ${context.direction === "!=" ? "For a two-sided test, we doubled the one-tail area." : "For a one-sided test, we used the single tail area in the direction of H\u2090."}`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! Check your calculation. The p-value is ${expectedVal}. Make sure you're using the correct tail direction for H\u2090.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The p-value is ${expectedVal}. For H\u2090 with ">", use the right tail. For "<", use the left tail. For "\u2260", double the one-tail area.`
    };
  }

  // ========== L26/L28: p-Value Interpretation (Textarea) ==========
  if (fieldId === "pvalueInterpretation" || fieldId === "cap65Interpret") {
    const assumeKeywords = ["assuming", "if the null", "if h0", "if h\u2080", "under the null", "given that"];
    const probKeywords = ["probability", "likely", "likelihood", "chance"];
    const extremeKeywords = ["or greater", "or more extreme", "or less", "or stronger", "as extreme", "in either direction", "or more"];
    const chanceKeywords = ["by chance", "by chance alone", "random chance", "due to chance", "due to random"];
    const contextKeywords = ["sample proportion", "p\u0302", "p-hat", "sample"];

    const mentionsAssume = containsAny(answer, assumeKeywords);
    const mentionsProb = containsAny(answer, probKeywords);
    const mentionsExtreme = containsAny(answer, extremeKeywords);
    const mentionsChance = containsAny(answer, chanceKeywords);
    const mentionsContext = containsAny(answer, contextKeywords);
    const hasSubstance = answer.trim().split(/\s+/).length >= 10;

    // Check for the misconception: "probability that the null is true"
    const hasNullProbMisconception = containsAny(answer, ["probability that the null", "probability that h0", "probability that h\u2080", "chance the null is true", "probability the null is false"]);
    if (hasNullProbMisconception) {
      return {
        score: "I",
        feedback: "The p-value is NOT the probability that H\u2080 is true (or false). The p-value is the probability of getting evidence this strong or stronger FOR H\u2090, assuming H\u2080 IS true. The p-value is calculated UNDER the assumption that H\u2080 is true."
      };
    }

    const elementCount = [mentionsAssume, mentionsProb, mentionsExtreme, mentionsChance, mentionsContext].filter(Boolean).length;

    // E: mentions assuming null true + probability + extreme/stronger + chance alone + context
    if (elementCount >= 4 && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent interpretation! You included the assumption that H\u2080 is true, the probability, the 'or more extreme' language, and 'by chance alone.'"
      };
    }
    // P: mentions at least 2 key elements + substance
    if (elementCount >= 2 && hasSubstance) {
      const missing = [];
      if (!mentionsAssume) missing.push("state that H\u2080 is assumed true ('Assuming...')");
      if (!mentionsProb) missing.push("the probability value");
      if (!mentionsExtreme) missing.push("'or more extreme' / 'or greater' / 'or less'");
      if (!mentionsChance) missing.push("'by chance alone'");
      if (!mentionsContext) missing.push("the sample proportion in context");
      return {
        score: "P",
        feedback: `Good start! To earn full credit, also include: ${missing.join(", ")}. Template: 'Assuming [H\u2080 true], there is a [p-value] probability of getting a sample proportion of [value] or [more extreme] by chance alone in a random sample of [n].`
      };
    }
    return {
      score: "I",
      feedback: "A p-value interpretation must include: (1) assume H\u2080 is true, (2) the p-value probability, (3) getting a sample proportion 'or more extreme', (4) 'by chance alone', (5) context. Template: 'Assuming [null is true], there is a [p-value] probability of getting a sample proportion of [p\u0302] or [more extreme] by chance alone in a random sample of [n] from [population].'"
    };
  }

  // ========== L27: Test Direction (Dropdown) ==========
  if (fieldId === "directionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You matched the tail direction to the alternative hypothesis. H\u2090 with > uses the right tail, < uses the left tail, and \u2260 uses both tails."
      };
    }
    // Check for specific misconceptions
    if (containsAny(answer, ["between"])) {
      return {
        score: "I",
        feedback: `Incorrect. We never find the area BETWEEN \u2212z and z for a p-value. The p-value is always a tail area (or two tail areas). The correct approach is: ${expected}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${expected}. Remember: H\u2090: p > p\u2080 \u2192 right tail, H\u2090: p < p\u2080 \u2192 left tail, H\u2090: p \u2260 p\u2080 \u2192 both tails (2 \u00d7 tail area).`
    };
  }

  // ========== L28: Capstone Null (Text, reuse L19/L23 logic) ==========
  if (fieldId === "cap65Null") {
    const p0 = context?.p0 || "";
    const hasPHat = containsAny(answer, ["p\u0302", "p-hat", "phat", "p hat"]);
    const hasEquality = studentNorm.includes("=") && !studentNorm.includes("!=") && !studentNorm.includes("\u2260");
    const hasCorrectP0 = studentNorm.includes(String(p0));

    if (hasPHat) {
      return { score: "I", feedback: `Hypotheses use p (population parameter), NOT p\u0302 (sample statistic). Correct: H\u2080: p = ${p0}` };
    }
    if (hasEquality && hasCorrectP0) {
      return { score: "E", feedback: `Correct! H\u2080: p = ${p0}. The null always contains '='.` };
    }
    if (hasEquality && !hasCorrectP0) {
      return { score: "P", feedback: `The structure is right (uses '='), but check your p\u2080 value. The claimed proportion is ${p0}. Correct: H\u2080: p = ${p0}` };
    }
    if (!hasEquality && hasCorrectP0) {
      return { score: "I", feedback: `The null hypothesis must contain '=' (equality). Correct: H\u2080: p = ${p0}` };
    }
    return { score: "I", feedback: `Incorrect. The null hypothesis is: H\u2080: p = ${p0}. Always uses '=' and the parameter p.` };
  }

  // ========== L28: Capstone Alt (Text, reuse L19/L23 logic) ==========
  if (fieldId === "cap65Alt") {
    const p0 = context?.p0 || "";
    const dir = context?.direction || "";
    const hasPHat = containsAny(answer, ["p\u0302", "p-hat", "phat", "p hat"]);
    const hasCorrectP0 = studentNorm.includes(String(p0));

    const dirMap = { ">": [">"], "<": ["<"], "!=": ["\u2260", "!=", "not equal", "=/="] };
    const expectedDirSymbols = dirMap[dir] || [];
    const hasCorrectDir = expectedDirSymbols.some(d => studentNorm.includes(d));

    if (hasPHat) {
      return { score: "I", feedback: `Hypotheses use p (population parameter), NOT p\u0302. Correct: ${expected}` };
    }
    if (hasCorrectDir && hasCorrectP0) {
      return { score: "E", feedback: `Correct! ${expected}` };
    }
    if (hasCorrectP0 && !hasCorrectDir) {
      return { score: "P", feedback: `Right p\u2080 value, but check the direction. The keyword "${context?.keyword || ""}" suggests the alternative should use "${dir}". Correct: ${expected}` };
    }
    if (hasCorrectDir && !hasCorrectP0) {
      return { score: "P", feedback: `Right direction, but the p\u2080 value should be ${p0}. Correct: ${expected}` };
    }
    return { score: "I", feedback: `Incorrect. The correct alternative is: ${expected}. Direction comes from the research question keywords.` };
  }

  // ========== L29: Compare p-Value to Alpha (Choice) ==========
  if (fieldId === "compareAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You correctly compared the p-value to the significance level \u03b1."
      };
    }
    // Check if student made the wrong comparison
    if (containsAny(answer, ["reject"]) && containsAny(expected, ["fail to reject"])) {
      return {
        score: "I",
        feedback: `Incorrect. The p-value is GREATER than \u03b1, so we fail to reject H\u2080. Remember: reject only when p-value \u2264 \u03b1.`
      };
    }
    if (containsAny(answer, ["fail to reject"]) && containsAny(expected, ["reject"])) {
      return {
        score: "I",
        feedback: `Incorrect. The p-value is LESS THAN or equal to \u03b1, so we reject H\u2080. Remember: reject when p-value \u2264 \u03b1.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${expected}. If p-value \u2264 \u03b1 \u2192 reject H\u2080. If p-value > \u03b1 \u2192 fail to reject H\u2080.`
    };
  }

  // ========== L30: Reject Decision (Dropdown) ==========
  if (fieldId === "decisionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You made the right decision and stated it properly."
      };
    }
    // Detect "accept H0" error
    if (containsAny(answer, ["accept h", "accept the null"])) {
      return {
        score: "I",
        feedback: `Incorrect. We never 'accept' the null hypothesis. When p-value > \u03b1, we 'fail to reject H\u2080' and say there is 'not convincing evidence' for H\u2090. The correct answer is: ${expected}`
      };
    }
    // Detect "proven" error
    if (containsAny(answer, ["proven", "prove"])) {
      return {
        score: "I",
        feedback: `Incorrect. In statistics, we never 'prove' anything. We say there is 'convincing statistical evidence for H\u2090,' not that we've proven it. The correct answer is: ${expected}`
      };
    }
    // Wrong decision direction
    if (containsAny(answer, ["reject"]) && containsAny(expected, ["fail to reject"])) {
      return {
        score: "I",
        feedback: `Incorrect. Since p-value > \u03b1, we should FAIL TO REJECT H\u2080. The correct answer is: ${expected}`
      };
    }
    if (containsAny(answer, ["fail to reject"]) && !containsAny(expected, ["fail to reject"])) {
      return {
        score: "I",
        feedback: `Incorrect. Since p-value \u2264 \u03b1, we should REJECT H\u2080. The correct answer is: ${expected}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}`
    };
  }

  // ========== L31/L33/L34: Write Conclusion (Textarea) ==========
  if (fieldId === "conclusionText" || fieldId === "fullTestConclusion" || fieldId === "cap66Conclusion") {
    const explicitCompare = containsAny(answer, ["less than", "greater than", "is less", "is greater", "\u2264", ">", "< \u03b1", "> \u03b1", "< alpha", "> alpha"]);
    const mentionsPValue = containsAny(answer, ["p-value", "p value", "pvalue"]);
    const mentionsAlpha = containsAny(answer, ["\u03b1", "alpha", "significance level", "0.05", "0.01", "0.10"]);
    const mentionsDecision = containsAny(answer, ["reject", "fail to reject"]);
    const mentionsEvidence = containsAny(answer, ["convincing", "evidence"]);
    const hasContext = answer.trim().split(/\s+/).length >= 12;

    // Check for fatal errors
    const hasAcceptNull = containsAny(answer, ["accept the null", "accept h0", "accept h\u2080"]);
    const hasProven = containsAny(answer, ["proven", "proves", "we have proved"]);
    const hasAcceptAlt = containsAny(answer, ["accept the alternative", "accept ha", "accept h\u2090"]);

    if (hasAcceptNull) {
      return {
        score: "I",
        feedback: "Never 'accept the null hypothesis.' When p-value > \u03b1, say 'we fail to reject H\u2080' and 'there is not convincing statistical evidence for H\u2090 [in context].' A lack of evidence against H\u2080 does not mean H\u2080 is true."
      };
    }
    if (hasProven) {
      return {
        score: "I",
        feedback: "Never say 'proven' in statistics. We say 'there is convincing statistical evidence that...' Hypothesis tests are based on probabilities and always carry some chance of error."
      };
    }
    if (hasAcceptAlt) {
      return {
        score: "P",
        feedback: "Avoid saying 'accept H\u2090.' Instead say 'there is convincing statistical evidence that [H\u2090 in context].' We reject H\u2080, but we don't 'accept' any hypothesis."
      };
    }

    // Check for contradictory conclusion (reject but says no evidence, or fail to reject but says evidence)
    const saysReject = containsAny(answer, ["reject h"]) && !containsAny(answer, ["fail to reject"]);
    const saysNoEvidence = containsAny(answer, ["not convincing", "no convincing", "is not convincing"]);
    const saysEvidence = containsAny(answer, ["convincing statistical evidence", "convincing evidence"]) && !saysNoEvidence;

    if (saysReject && saysNoEvidence) {
      return {
        score: "I",
        feedback: "Contradiction: you rejected H\u2080 but then said there is NOT convincing evidence. If you reject H\u2080, there IS convincing evidence for H\u2090."
      };
    }

    const elementCount = [explicitCompare, mentionsPValue, mentionsAlpha, mentionsDecision, mentionsEvidence, hasContext].filter(Boolean).length;

    // E: explicit comparison + decision + evidence + context
    if (explicitCompare && mentionsDecision && mentionsEvidence && hasContext) {
      return {
        score: "E",
        feedback: "Excellent conclusion! You explicitly compared the p-value to \u03b1, stated the decision, and concluded about H\u2090 in context."
      };
    }
    // P: missing one key element
    if (elementCount >= 3) {
      const missing = [];
      if (!explicitCompare) missing.push("explicitly compare p-value to \u03b1 ('Because the p-value of ___ is [less/greater] than \u03b1 = ___')");
      if (!mentionsDecision) missing.push("state the decision ('we reject H\u2080' or 'we fail to reject H\u2080')");
      if (!mentionsEvidence) missing.push("state the conclusion about H\u2090 ('There [is/is not] convincing statistical evidence that...')");
      if (!hasContext) missing.push("include context (what the proportion represents)");
      return {
        score: "P",
        feedback: `Good start! To earn full credit, also: ${missing.join("; ")}. Template: 'Because the p-value of ___ is [less/greater] than \u03b1 = ___, we [reject/fail to reject] H\u2080. There [is/is not] convincing statistical evidence that [H\u2090 in context].'`
      };
    }
    return {
      score: "I",
      feedback: "A complete conclusion must include FOUR elements: (1) explicit comparison of p-value to \u03b1 ('Because the p-value of ___ is [less/greater] than \u03b1 = ___'), (2) the decision ('we reject H\u2080' or 'we fail to reject H\u2080'), (3) conclusion about H\u2090 ('There [is/is not] convincing statistical evidence that...'), (4) context."
    };
  }

  // ========== L32: Conclusion Error Detection (Dropdown) ==========
  if (fieldId === "conclusionErrorAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You identified the error in the conclusion."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The error is: ${expected}. Common conclusion errors: (1) 'accepting H\u2080' instead of 'failing to reject,' (2) saying 'proven,' (3) no explicit p-value to \u03b1 comparison, (4) concluding about H\u2080 instead of H\u2090, (5) missing context, (6) contradicting the decision, (7) wrong comparison direction.`
    };
  }

  // ========== L33/L34: Full Test Null Hypothesis (Text) ==========
  if (fieldId === "fullTestNull" || fieldId === "cap66Null") {
    const p0 = context?.p0 || "";
    const hasPHat = containsAny(answer, ["\u0302", "p-hat", "phat", "p hat"]);
    const hasEquality = studentNorm.includes("=") && !studentNorm.includes("!=") && !studentNorm.includes("\u2260");
    const hasCorrectP0 = studentNorm.includes(String(p0));

    if (hasPHat) {
      return { score: "I", feedback: `Hypotheses use p (population parameter), NOT p\u0302 (sample statistic). Correct: H\u2080: p = ${p0}` };
    }
    if (hasEquality && hasCorrectP0) {
      return { score: "E", feedback: `Correct! H\u2080: p = ${p0}. The null always contains '='.` };
    }
    if (hasEquality && !hasCorrectP0) {
      return { score: "P", feedback: `The structure is right (uses '='), but check your p\u2080 value. The claimed proportion is ${p0}. Correct: H\u2080: p = ${p0}` };
    }
    if (!hasEquality && hasCorrectP0) {
      return { score: "I", feedback: `The null hypothesis must contain '=' (equality). Correct: H\u2080: p = ${p0}` };
    }
    return { score: "I", feedback: `Incorrect. The null hypothesis is: H\u2080: p = ${p0}. Always uses '=' and the parameter p.` };
  }

  // ========== L33/L34: Full Test Alternative Hypothesis (Text) ==========
  if (fieldId === "fullTestAlt" || fieldId === "cap66Alt") {
    const p0 = context?.p0 || "";
    const dir = context?.direction || "";
    const hasPHat = containsAny(answer, ["\u0302", "p-hat", "phat", "p hat"]);
    const hasCorrectP0 = studentNorm.includes(String(p0));

    const dirMap = { ">": [">"], "<": ["<"], "!=": ["\u2260", "!=", "not equal", "=/="] };
    const expectedDirSymbols = dirMap[dir] || [];
    const hasCorrectDir = expectedDirSymbols.some(d => studentNorm.includes(d));

    if (hasPHat) {
      return { score: "I", feedback: `Hypotheses use p (population parameter), NOT p\u0302. Correct: ${expected}` };
    }
    if (hasCorrectDir && hasCorrectP0) {
      return { score: "E", feedback: `Correct! ${expected}` };
    }
    if (hasCorrectP0 && !hasCorrectDir) {
      return { score: "P", feedback: `Right p\u2080 value, but check the direction. The keyword "${context?.keyword || ""}" suggests the alternative should use "${dir}". Correct: ${expected}` };
    }
    if (hasCorrectDir && !hasCorrectP0) {
      return { score: "P", feedback: `Right direction, but the p\u2080 value should be ${p0}. Correct: ${expected}` };
    }
    return { score: "I", feedback: `Incorrect. The correct alternative is: ${expected}. Direction comes from the research question keywords.` };
  }

  // ========== L33/L34: Full Test z-Statistic (Number) ==========
  if (fieldId === "fullTestZStat" || fieldId === "cap66ZStat") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used p-hat instead of p0 in the denominator
    if (context.pHat !== undefined && context.p0 !== undefined && context.n !== undefined) {
      const pHat = parseFloat(context.pHat);
      const p0 = parseFloat(context.p0);
      const n = parseFloat(context.n);
      if (pHat !== p0) {
        const wrongSD = Math.sqrt(pHat * (1 - pHat) / n);
        const wrongZ = Math.round((pHat - p0) / wrongSD * 100) / 100;
        if (Math.abs(studentVal - wrongZ) < 0.03 && diff > 0.03) {
          return {
            score: "I",
            feedback: `It looks like you used p\u0302 = ${pHat} in the denominator instead of p\u2080 = ${p0}. For a significance test, use p\u2080 in the standard deviation because we ASSUME H\u2080 is true. z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n) = ${expectedVal}`
          };
        }
      }
    }

    if (diff <= 0.02) {
      return {
        score: "E",
        feedback: `Correct! z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n) = ${expectedVal}`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! Check your arithmetic. z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n). The correct test statistic is ${expectedVal}. Make sure you're using p\u2080 (the null value) in the denominator, not p\u0302.`
    };
  }

  // ========== L33/L34: Full Test p-Value (Number) ==========
  if (fieldId === "fullTestPValue" || fieldId === "cap66PValue") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    if (studentVal < 0 || studentVal > 1) {
      return { score: "I", feedback: "A p-value must be between 0 and 1." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student did one-tail when they should have done two-tail (or vice versa)
    if (context.direction === "!=" && expectedVal > 0) {
      const halfPValue = Math.round(expectedVal / 2 * 10000) / 10000;
      if (Math.abs(studentVal - halfPValue) < 0.002 && diff > 0.002) {
        return {
          score: "P",
          feedback: `You found the one-tail area, but this is a TWO-sided test (H\u2090: p \u2260 p\u2080). You need to DOUBLE the tail area. p-value = 2 \u00d7 ${halfPValue} = ${expectedVal}`
        };
      }
    }
    if ((context.direction === ">" || context.direction === "<") && expectedVal > 0) {
      const doublePValue = Math.round(expectedVal * 2 * 10000) / 10000;
      if (Math.abs(studentVal - doublePValue) < 0.002 && diff > 0.002) {
        return {
          score: "P",
          feedback: `You doubled the tail area, but this is a ONE-sided test. For H\u2090: p ${context.direction} p\u2080, use just the single tail area. p-value = ${expectedVal}`
        };
      }
    }

    if (diff <= 0.002) {
      return {
        score: "E",
        feedback: `Correct! p-value = ${expectedVal}.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! Check your calculation. The p-value is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The p-value is ${expectedVal}. For H\u2090 with ">", use the right tail. For "<", use the left tail. For "\u2260", double the one-tail area.`
    };
  }

  // ========== L34: Capstone Parameter Definition (Textarea) ==========
  if (fieldId === "cap66ParamDef") {
    const mentionsProportion = containsAny(answer, ["proportion", "percent", "percentage", "fraction"]);
    const mentionsPopulation = containsAny(answer, ["all", "every", "would", "population", "true"]);
    const mentionsContext = answer.trim().split(/\s+/).length >= 5;

    // Check for sample language (bad)
    const hasSampleLang = containsAny(answer, ["surveyed", "sampled", "in the sample", "who said", "who were asked", "who responded"]) && !mentionsPopulation;

    if (mentionsProportion && mentionsPopulation && mentionsContext) {
      return { score: "E", feedback: "Excellent! You defined the parameter using population language ('all', 'would') and included context." };
    }
    if (hasSampleLang) {
      return { score: "P", feedback: "You're using sample language. Define p using population language: 'the proportion of ALL [population] who WOULD [action].' Use 'all' or 'every' and 'would' to refer to the entire population." };
    }
    if (mentionsProportion && mentionsContext && !mentionsPopulation) {
      return { score: "P", feedback: "Good! You mentioned the proportion and context, but add population language ('all', 'would') to distinguish from the sample." };
    }
    return { score: "I", feedback: "Define p in context: 'p = the proportion of ALL [population] who [would do something].' Must include 'proportion,' population language ('all'/'would'), and context." };
  }

  // ========== L35: Identify the Error Type (Dropdown) ==========
  if (fieldId === "errorTypeAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Type I means rejecting a true null hypothesis, and Type II means failing to reject a false null hypothesis."
      };
    }
    if (containsAny(answer, ["type i"]) && containsAny(expected, ["type ii"])) {
      return {
        score: "I",
        feedback: "Incorrect. This is a Type II error: the test failed to reject H\u2080 even though H\u2090 was true. Type I is rejecting a true H\u2080."
      };
    }
    if (containsAny(answer, ["type ii"]) && containsAny(expected, ["type i"])) {
      return {
        score: "I",
        feedback: "Incorrect. This is a Type I error: the test rejected H\u2080 even though H\u2080 was true. Type II is failing to reject a false H\u2080."
      };
    }
    if (containsAny(answer, ["correct"]) && !containsAny(expected, ["correct"])) {
      return {
        score: "I",
        feedback: `Incorrect. An error occurred here. The correct answer is: ${expected}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Type I = reject a true H\u2080. Type II = fail to reject a false H\u2080.`
    };
  }

  // ========== L36/L39: Type I Error in Context (Textarea) ==========
  if (fieldId === "type1Interpretation" || fieldId === "cap67Type1") {
    const mentionsEvidence = containsAny(answer, ["convincing evidence", "find evidence", "found evidence", "conclude", "concluded", "reject"]);
    const mentionsAltContext = containsAny(answer, ["more than 50", "greater than 50", "green cup", "natural", "students"]);
    const mentionsNullTruth = containsAny(answer, ["actual percentage is 50", "true percentage is 50", "actually 50", "really 50", "p = 0.50", "h0 is true", "null is true"]);
    const genericType1 = containsAny(answer, ["reject"]) && containsAny(answer, ["h0 is true", "null is true", "true null", "type i"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if (mentionsEvidence && mentionsAltContext && mentionsNullTruth && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You described finding convincing evidence for the alternative when the null value of 50% was actually true."
      };
    }
    if ((genericType1 || (mentionsAltContext && mentionsNullTruth)) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start. To earn full credit, explicitly say that the researchers found convincing evidence that more than 50% would choose the green cup even though the true percentage was actually 50%."
      };
    }
    return {
      score: "I",
      feedback: "A Type I error in this context is: the researchers find convincing evidence that more than 50% of students would choose the green cup, but in reality the true percentage is 50%."
    };
  }

  // ========== L36/L39: Type II Error in Context (Textarea) ==========
  if (fieldId === "type2Interpretation" || fieldId === "cap67Type2") {
    const mentionsNoEvidence = containsAny(answer, ["do not find", "don't find", "not convincing", "no convincing evidence", "fail to reject"]);
    const mentionsAltContext = containsAny(answer, ["more than 50", "greater than 50", "green cup", "natural", "students"]);
    const mentionsAltTruth = containsAny(answer, ["actual percentage is more than 50", "true percentage is more than 50", "actually more than 50", "really more than 50", "true proportion is greater than 0.50", "h\u2090 is true", "ha is true", "alternative is true"]);
    const genericType2 = containsAny(answer, ["fail to reject"]) && containsAny(answer, ["false null", "ha is true", "alternative is true", "type ii"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if (mentionsNoEvidence && mentionsAltContext && mentionsAltTruth && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You described missing real evidence for the alternative even though more than 50% really would choose the green cup."
      };
    }
    if ((genericType2 || (mentionsAltContext && mentionsAltTruth)) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start. To earn full credit, explicitly say that the researchers did not find convincing evidence that more than 50% would choose the green cup even though that was actually true."
      };
    }
    return {
      score: "I",
      feedback: "A Type II error in this context is: the researchers do not find convincing evidence that more than 50% of students would choose the green cup, but in reality the true percentage is more than 50%."
    };
  }

  // ========== L37: Power Interpretation (Textarea) ==========
  if (fieldId === "powerInterpretation") {
    const trueP = String(context?.trueP ?? "");
    const power = parseFloat(context?.power ?? "");
    const powerStr = String(context?.power ?? "");
    const powerPct = Number.isNaN(power) ? "" : String(Math.round(power * 100));
    const mentionsTrueP = trueP !== "" && containsAny(answer, [trueP, `${parseFloat(trueP) * 100}%`]);
    const mentionsPower = containsAny(answer, [powerStr, `${powerPct}%`, "probability", "chance"]);
    const mentionsRejectFalseNull = containsAny(answer, ["convincing evidence", "reject", "find evidence"]);
    const mentionsContext = containsAny(answer, ["green cup", "students", "more than 50", "greater than 50"]);
    const elementCount = [mentionsTrueP, mentionsPower, mentionsRejectFalseNull, mentionsContext].filter(Boolean).length;

    if (mentionsTrueP && mentionsPower && mentionsRejectFalseNull && mentionsContext) {
      return {
        score: "E",
        feedback: "Correct! You interpreted power as the probability of finding convincing evidence for the alternative when the true proportion is not the null value."
      };
    }
    if (elementCount >= 2) {
      return {
        score: "P",
        feedback: `Good start. Include all key pieces: if the true proportion is ${context?.trueP}, there is a power of ${context?.power} that the test finds convincing evidence that more than 50% of students would choose the green cup.`
      };
    }
    return {
      score: "I",
      feedback: `Power means: if the true proportion is ${context?.trueP}, there is a probability of ${context?.power} that the test will correctly find convincing evidence that more than 50% of students would choose the green cup.`
    };
  }

  // ========== L37: P(Type I Error) (Number) ==========
  if (fieldId === "type1ProbAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const complement = Math.round((1 - expectedVal) * 100) / 100;

    if (Math.abs(studentVal - complement) <= 0.01 && diff > 0.01) {
      return {
        score: "I",
        feedback: `It looks like you took the complement. The probability of a Type I error is exactly the significance level: P(Type I) = \u03b1 = ${expectedVal}.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "E",
        feedback: `Correct! P(Type I error) = \u03b1 = ${expectedVal}.`
      };
    }
    if (diff <= 0.05) {
      return {
        score: "P",
        feedback: `Close. Remember: the probability of a Type I error is the significance level, so P(Type I) = ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability of a Type I error is the significance level: P(Type I) = \u03b1 = ${expectedVal}.`
    };
  }

  // ========== L37: P(Type II Error) (Number) ==========
  if (fieldId === "type2ProbAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const powerVal = parseFloat(context?.power ?? "");

    if (!Number.isNaN(powerVal) && Math.abs(studentVal - powerVal) <= 0.01 && diff > 0.01) {
      return {
        score: "I",
        feedback: `It looks like you entered the power itself. The probability of a Type II error is 1 - power = ${expectedVal}.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "E",
        feedback: `Correct! P(Type II error) = 1 - power = ${expectedVal}.`
      };
    }
    if (diff <= 0.05) {
      return {
        score: "P",
        feedback: `Close. Remember: P(Type II error) = 1 - power = ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability of a Type II error is 1 - power = ${expectedVal}.`
    };
  }

  // ========== L40: P(Type I Error) from Alpha (Number) ==========
  if (fieldId === "alphaType1Prob") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const complement = Math.round((1 - expectedVal) * 100) / 100;

    if (Math.abs(studentVal - complement) <= 0.01 && diff > 0.01) {
      return {
        score: "I",
        feedback: `It looks like you used the complement. The probability of a Type I error is exactly the significance level: P(Type I) = alpha = ${expectedVal}.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "E",
        feedback: `Correct! P(Type I error) = alpha = ${expectedVal}.`
      };
    }
    if (diff <= 0.05) {
      return {
        score: "P",
        feedback: `Close. Remember that the probability of a Type I error is the significance level itself, so P(Type I) = ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability of a Type I error is the significance level: P(Type I) = alpha = ${expectedVal}.`
    };
  }

  // ========== L41: Define Power (Dropdown) ==========
  if (fieldId === "powerDefinitionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Power is the probability that a test correctly rejects a false null hypothesis."
      };
    }
    if (containsAny(answer, ["type ii", "failing to reject", "false null hypothesis"])) {
      return {
        score: "I",
        feedback: "Incorrect. Power is not the probability of making a Type II error. It is the probability of avoiding a Type II error, or correctly rejecting a false null hypothesis."
      };
    }
    if (containsAny(answer, ["type i", "alpha"])) {
      return {
        score: "I",
        feedback: "Incorrect. Type I error probability is alpha. Power is a different idea: it is the probability that the test correctly rejects a false H0."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}.`
    };
  }

  // ========== L42: Alpha Tradeoff (Dropdown) ==========
  if (fieldId === "alphaTradeoffAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Changing alpha creates a tradeoff between Type I error and Type II error, and it changes power as well."
      };
    }
    if (containsAny(answer, ["both type i and type ii errors become less likely", "both types of errors become less likely", "both get smaller"])) {
      return {
        score: "I",
        feedback: "Incorrect. Lowering alpha can reduce Type I error, but it does not automatically reduce Type II error. Instead, Type II error tends to increase and power tends to decrease."
      };
    }
    if (containsAny(answer, ["alpha has no effect", "nothing changes"])) {
      return {
        score: "I",
        feedback: "Incorrect. Alpha directly affects the probability of a Type I error and also changes power and the chance of a Type II error."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Smaller alpha lowers Type I error but raises Type II error and lowers power; larger alpha does the opposite.`
    };
  }

  // ========== L43: Choose a Significance Level (Dropdown) ==========
  if (fieldId === "alphaChoiceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! The choice of alpha should reflect which kind of error would be more serious in the context."
      };
    }
    if (containsAny(expected, ["smaller alpha", "alpha = 0.01"]) && containsAny(answer, ["larger", "alpha = 0.10"])) {
      return {
        score: "I",
        feedback: "Incorrect. If a Type I error would be more serious, the more appropriate choice is a smaller alpha so rejecting H0 requires stronger evidence."
      };
    }
    if (containsAny(expected, ["larger alpha", "alpha = 0.10"]) && containsAny(answer, ["smaller", "alpha = 0.01"])) {
      return {
        score: "I",
        feedback: "Incorrect. If the goal is to make Type II errors less likely or increase power, a larger alpha is the more reasonable choice."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Match alpha to the consequences: smaller alpha protects against Type I error, while larger alpha gives more power and lowers Type II error.`
    };
  }

  // ========== L38: Factors Affecting Power (Dropdown) ==========
  if (fieldId === "powerFactorAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Power increases when sample size or significance level increases, when standard error decreases, or when the true parameter is farther from the null."
      };
    }
    if (containsAny(answer, ["decrease the significance level", "smaller \u03b1", "extremely small"])) {
      return {
        score: "I",
        feedback: `Incorrect. A smaller \u03b1 makes rejecting H\u2080 harder, which lowers power and makes Type II errors more likely. The correct answer is: ${expected}.`
      };
    }
    if (containsAny(answer, ["increase the standard error"])) {
      return {
        score: "I",
        feedback: `Incorrect. More variability lowers power. The correct answer is: ${expected}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Remember: larger n, larger \u03b1, smaller standard error, and a true value farther from the null all increase power.`
    };
  }

  // ========== L39: More Consequential Error (Dropdown) ==========
  if (fieldId === "cap67Consequential") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! In this context, a Type II error is more consequential because it misses a real marketing effect and can cost sales."
      };
    }
    if (containsAny(answer, ["type i"])) {
      return {
        score: "I",
        feedback: "Incorrect. In this context, Type I is lower risk. Type II is more consequential because the company could miss a real advantage of using green branding and lose sales."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. The more consequential error here is Type II error."
    };
  }

  // ========== L39: Consequence Justification (Textarea) ==========
  if (fieldId === "cap67Justify") {
    const mentionsTypeII = containsAny(answer, ["type ii", "type 2", "false negative"]);
    const mentionsGreen = containsAny(answer, ["green", "branding", "brand", "natural"]);
    const mentionsLoss = containsAny(answer, ["sales", "income", "money", "loss", "lose", "revenue", "reduce"]);
    const mentionsConsequence = answer.trim().split(/\s+/).length >= 8;

    if (mentionsGreen && mentionsLoss && mentionsConsequence) {
      return {
        score: "E",
        feedback: "Excellent! You explained that missing a real green-branding effect could reduce sales, which is why Type II is more consequential."
      };
    }
    if ((mentionsTypeII || mentionsGreen || mentionsLoss) && mentionsConsequence) {
      return {
        score: "P",
        feedback: "Good start. To earn full credit, explain that a Type II error would make them miss a real marketing effect of green branding, which could reduce sales or income."
      };
    }
    return {
      score: "I",
      feedback: "Explain that a Type II error would lead them not to use green branding even though it really works, which could reduce potential sales. That is why Type II is more consequential here."
    };
  }

  // ========== L44: Identify the Procedure (Dropdown) ==========
  if (fieldId === "twoPropProcedureAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Two groups, categorical data, and a confidence interval for p1 - p2 means a two-sample z-interval for a difference in proportions."
      };
    }
    if (containsAny(answer, ["z-test", "test"])) {
      return {
        score: "I",
        feedback: "Incorrect. This problem asks for a confidence interval, not a significance test. For two proportions, the correct procedure is a two-sample z-interval for a difference in proportions."
      };
    }
    if (containsAny(answer, ["one-sample", "one sample"])) {
      return {
        score: "I",
        feedback: "Incorrect. There are two groups here, not one. That makes this a two-sample z-interval for a difference in proportions."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct procedure is: ${expected}.`
    };
  }

  // ========== L45: Conditions Met (Choice) ==========
  if (fieldId === "twoPropConditionsMet") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You correctly decided whether the independence and large-counts conditions are satisfied for the two-sample z-interval."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Check for two independent random samples or random assignment, the 10% condition when sampling without replacement, and four counts that are all at least 10.`
    };
  }

  // ========== L45: Conditions Explain (Textarea) ==========
  if (fieldId === "twoPropConditionsExplain") {
    const isExperiment = normalize(context?.designType) === "experiment";
    const mentionsRandom = containsAny(answer, ["random", "randomly", "random assignment", "independent", "independence"]);
    const mentionsTenPct = containsAny(answer, ["10%", "10 percent", "ten percent", "population", "n1", "n2", "90", "260", "300"]);
    const mentionsNotApplicable = containsAny(answer, ["does not apply", "not apply", "experiment"]);
    const mentionsLargeCounts = containsAny(answer, ["large counts", "successes", "failures", "at least 10", ">= 10", "36", "204", "25", "175", "8", "16", "52", "68", "41", "69", "64", "28"]);
    const mentionsConclusion = containsAny(answer, ["all conditions are met", "not all conditions are met", "condition fails", "conditions fail", "met", "fail"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if (isExperiment) {
      if (mentionsRandom && mentionsLargeCounts && hasSubstance) {
        return {
          score: "E",
          feedback: "Excellent! You identified random assignment and checked the large counts condition correctly. For experiments, the 10% condition is not part of the check."
        };
      }
      if ((mentionsRandom || mentionsLargeCounts || mentionsNotApplicable) && hasSubstance) {
        return {
          score: "P",
          feedback: "Good start. For full credit, explain that random assignment supports independence and then check whether the successes and failures in both groups are all at least 10. You can also note that the 10% condition does not apply to an experiment."
        };
      }
      return {
        score: "I",
        feedback: "For an experiment, explain that random assignment supports independence, note that the 10% condition does not apply, and then check whether the successes and failures in both groups are all at least 10."
      };
    }

    if (mentionsRandom && mentionsTenPct && mentionsLargeCounts && mentionsConclusion && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You addressed the sample design, the 10% condition, and the four large-count checks."
      };
    }
    if ((mentionsRandom || mentionsTenPct || mentionsLargeCounts) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start. For full credit, mention all three parts: independent random samples, the 10% condition for each sample, and whether x1, n1 - x1, x2, and n2 - x2 are all at least 10."
      };
    }
    return {
      score: "I",
      feedback: "Explain all three parts: the data come from two independent random samples, each sample is no more than 10% of its population when sampling without replacement, and the observed successes and failures in both groups are all at least 10."
    };
  }

  // ========== L46: Margin of Error (Number) ==========
  if (fieldId === "twoPropMEAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const se = parseFloat(context?.se ?? "");

    if (!Number.isNaN(se) && Math.abs(studentVal - se) <= 0.002 && diff > 0.002) {
      return {
        score: "I",
        feedback: `It looks like you entered the standard error instead of the margin of error. Multiply the standard error by z*. The correct margin of error is ${expectedVal}.`
      };
    }
    if (diff <= 0.002) {
      return {
        score: "E",
        feedback: `Correct! The margin of error is ${expectedVal}.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! Check your arithmetic. The margin of error is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use ME = z* x sqrt[(p-hat1(1-p-hat1)/n1) + (p-hat2(1-p-hat2)/n2)]. The correct margin of error is ${expectedVal}.`
    };
  }

  // ========== L47: CI Lower Bound (Number) ==========
  if (fieldId === "twoPropCILower") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const upperObj = getExpectedObj(context, "twoPropCIUpper");

    if (upperObj.value !== undefined && Math.abs(studentVal - upperObj.value) < 0.005 && diff > 0.005) {
      return {
        score: "I",
        feedback: `Check the order of the interval bounds. The lower bound is ${expectedVal} and the upper bound is ${upperObj.value}.`
      };
    }
    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! The lower bound is ${expectedVal}.`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! The lower bound is ${expectedVal}. Check the point estimate minus the margin of error.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The lower bound is ${expectedVal}. Use (p-hat1 - p-hat2) - ME.`
    };
  }

  // ========== L47: CI Upper Bound (Number) ==========
  if (fieldId === "twoPropCIUpper") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const lowerObj = getExpectedObj(context, "twoPropCILower");

    if (lowerObj.value !== undefined && Math.abs(studentVal - lowerObj.value) < 0.005 && diff > 0.005) {
      return {
        score: "I",
        feedback: `Check the order of the interval bounds. The lower bound is ${lowerObj.value} and the upper bound is ${expectedVal}.`
      };
    }
    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! The upper bound is ${expectedVal}.`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! The upper bound is ${expectedVal}. Check the point estimate plus the margin of error.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The upper bound is ${expectedVal}. Use (p-hat1 - p-hat2) + ME.`
    };
  }

  // ========== L48: CI Interpretation (Textarea) ==========
  if (fieldId === "twoPropCIInterpretation") {
    const lower = parseFloat(context?.ciLower ?? "");
    const upper = parseFloat(context?.ciUpper ?? "");
    const confLevel = String(context?.confLevel ?? "");
    const numbers = getNumericTokens(answer);
    const mentionsConfidence = containsAny(answer, ["confident", "confidence", confLevel]);
    const mentionsDifference = containsAny(answer, ["difference", "proportion", "percentage point", "higher", "lower", "greater", "less"]);
    const mentionsContext = containsAny(answer, [context?.group1 ?? "", context?.group2 ?? "", "trees", "dogs", "swimmers", "disease", "ticks", "average time"]);
    const mentionsBounds = numbers.length >= 2 || containsAny(answer, ["between", "from", "to"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 10;
    const hasProbMisconception = containsAny(answer, ["probability that", "chance that the true", "% probability"]);

    let directionOk = false;
    if (!Number.isNaN(lower) && !Number.isNaN(upper)) {
      if (lower >= 0) {
        directionOk = containsAny(answer, ["higher", "greater", "more"]);
      } else if (upper <= 0) {
        directionOk = containsAny(answer, ["lower", "less", "fewer"]);
      } else {
        directionOk = (containsAny(answer, ["lower", "less", "fewer"]) && containsAny(answer, ["higher", "greater", "more"])) || containsAny(answer, ["could be", "includes 0", "include 0"]);
      }
    }

    if (hasProbMisconception) {
      return {
        score: "P",
        feedback: "Careful. Interpret a confidence interval with 'We are __% confident ...' rather than saying there is a probability that the true difference is in the interval."
      };
    }
    if (mentionsConfidence && mentionsDifference && mentionsContext && mentionsBounds && directionOk && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You interpreted the confidence interval as a difference in population proportions and described the direction in context."
      };
    }
    if ((mentionsConfidence || mentionsDifference || mentionsContext) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start. For full credit, include the confidence level, describe the interval as a difference between the two population proportions, include the interval bounds or percentage-point range, and state whether group 1 is lower, higher, or could be either in context."
      };
    }
    return {
      score: "I",
      feedback: "Interpret the interval like this: 'We are __% confident that the true difference (group 1 minus group 2) in proportions is between ___ and ___,' then translate that into higher/lower percentage points in context."
    };
  }

  // ========== GENERIC FALLBACK ==========
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct!" };
  }
  return {
    score: "I",
    feedback: `Incorrect. Expected: ${expected}`
  };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
