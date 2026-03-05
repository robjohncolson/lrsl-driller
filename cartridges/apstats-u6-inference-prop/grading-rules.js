// grading-rules.js - AP Statistics Unit 6 Topics 6.1-6.4
// Topics: Logic of significance testing, confidence intervals for a population proportion,
// interpreting CIs, justifying claims, confidence level meaning, factors affecting ME,
// null/alternative hypotheses, identify test procedure, test conditions
// Identify evidence, two explanations, convincing evidence, identify procedure,
// check conditions, standard error, critical values, margin of error,
// confidence intervals, minimum sample size, capstone, CI interpretation,
// claim justification, confidence level interpretation, ME factors, capstone 6.3

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
    "cap64ConditionsWork"
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
      "capstoneLower", "capstoneUpper"
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
