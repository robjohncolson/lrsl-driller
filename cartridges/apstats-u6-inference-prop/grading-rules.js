// grading-rules.js - AP Statistics Unit 6 Topics 6.1-6.2
// Topics: Logic of significance testing, confidence intervals for a population proportion
// Identify evidence, two explanations, convincing evidence, identify procedure,
// check conditions, standard error, critical values, margin of error,
// confidence intervals, minimum sample size, capstone

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
    "capstoneExplain"
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
