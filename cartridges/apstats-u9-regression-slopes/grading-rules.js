// grading-rules.js - AP Statistics Unit 9: Inference for Regression Slopes

function normalize(str) {
  return String(str).trim().toLowerCase();
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some((k) => norm.includes(normalize(k)));
}

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;

  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;

  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

function keywordMatchCount(answer, keywords) {
  return keywords.filter((k) => containsAny(answer, [k])).length;
}

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  const openResponseFields = new Set(["explanationText", "interpretText"]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter an explanation." };
    }
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  // ============ LEVEL 1: POPULATION VS SAMPLE (choiceAnswer) ============
  if (fieldId === "choiceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You correctly identified whether this describes a population model or a sample regression line."
      };
    }
    // Partial credit: chose "Both" or "Neither" when answer is one of the two
    if (studentNorm === "both" || studentNorm === "neither") {
      return {
        score: "P",
        feedback: `Not quite. This scenario describes a ${expected}. Look for whether ALL data or a SUBSET was used.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Remember: population models use all data (\u03b2\u2080, \u03b2\u2081); sample lines use a subset (b\u2080, b\u2081).`
    };
  }

  // ============ LEVEL 3: UNUSUAL CHOICE ============
  if (fieldId === "unusualChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You correctly assessed whether the observed slope is unusual."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Compare the observed slope to the range of the simulated distribution.`
    };
  }

  // ============ LEVEL 3: DROPDOWN REASON ============
  if (fieldId === "dropdownReason") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Your reasoning about the simulated distribution is sound."
      };
    }
    // Partial: selected a reason that at least mentions the range or distribution
    if (containsAny(answer, ["range", "simulated", "distribution"])) {
      return {
        score: "P",
        feedback: "Partially correct. You referenced the simulation, but the key is whether the observed slope falls inside or outside the simulated range."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${expected}`
    };
  }

  // ============ LEVEL 4: VALIDITY CHOICE ============
  if (fieldId === "validityChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct decision about the population model."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}. Use the estimated probability and where the observed slope falls in the simulated distribution.`
    };
  }

  // ============ LEVEL 4: EXPLANATION TEXT ============
  if (fieldId === "explanationText") {
    const keywords = context.keywords || context.expectedKeywords || [];
    const matchCount = keywordMatchCount(answer, keywords);

    const mentionsSimulation = containsAny(answer, [
      "simulation", "simulated", "distribution", "sampling distribution"
    ]);
    const mentionsProbability = containsAny(answer, [
      "probability", "proportion", "chance", "likely", "unlikely", "0 out of", "0/", "approximately 0"
    ]);
    const mentionsPosition = containsAny(answer, [
      "outside", "far", "within", "inside", "beyond", "below", "above", "range"
    ]);

    // Check for the validity conclusion matching the expected direction
    const isValidScenario = context.isValid || context.theme === "consistent";
    const mentionsValid = containsAny(answer, [
      "still valid", "model is valid", "consistent", "plausible", "still applies"
    ]);
    const mentionsInvalid = containsAny(answer, [
      "no longer valid", "not valid", "model is wrong", "changed", "invalid", "no longer applies"
    ]);

    // Check for contradictory conclusion
    if (isValidScenario && mentionsInvalid && !mentionsValid) {
      return {
        score: "I",
        feedback: "Your conclusion contradicts the evidence. The observed slope is consistent with the simulated distribution, suggesting the model is still valid."
      };
    }
    if (!isValidScenario && mentionsValid && !mentionsInvalid) {
      return {
        score: "I",
        feedback: "Your conclusion contradicts the evidence. The observed slope is far outside the simulated distribution, suggesting the model is no longer valid."
      };
    }

    if (matchCount >= 3 && mentionsSimulation && mentionsProbability) {
      return {
        score: "E",
        feedback: "Excellent explanation. You connected the simulation results, probability, and model validity."
      };
    }
    if ((matchCount >= 2 && mentionsSimulation) || (mentionsProbability && mentionsPosition)) {
      return {
        score: "P",
        feedback: "Partially correct. Strengthen your answer by mentioning the estimated probability from the simulation and explicitly stating whether the population model is still valid."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should reference the simulated sampling distribution, where the observed slope falls, the estimated probability, and whether the population model is still valid."
    };
  }

  // ============ LEVEL 5: CONDITION CHOICE ============
  if (fieldId === "conditionChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You correctly identified the LINER condition."
      };
    }
    // Partial: chose something that at least names a real LINER condition
    if (containsAny(answer, ["linear", "independent", "normal", "equal", "random"])) {
      return {
        score: "P",
        feedback: `Not quite. The correct answer is: ${expected}. Review the LINER conditions and match the scenario description to the right one.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}.`
    };
  }

  // ============ LEVEL 6: SAMPLING DISTRIBUTION CHOICE ============
  if (fieldId === "sdSlopeChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You understand the sampling distribution of b\u2081."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}.`
    };
  }

  // ============ LEVEL 7: NUMERIC ANSWER (SE, b1, s) ============
  if (fieldId === "numericAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const tol = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a numeric value." };
    }
    if (Math.abs(studentVal - expectedVal) <= tol) {
      return { score: "E", feedback: "Correct." };
    }
    if (Math.abs(studentVal - expectedVal) <= tol * 3) {
      return {
        score: "P",
        feedback: `Close, but not precise enough. The correct answer is ${expectedVal}. Check your rounding.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is ${expectedVal}. Make sure you are reading from the correct row and column of the output.`
    };
  }

  // ============ LEVEL 8: LOWER/UPPER BOUND ============
  if (fieldId === "lowerBound" || fieldId === "upperBound") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const tol = expObj.tolerance || 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a numeric value." };
    }
    if (Math.abs(studentVal - expectedVal) <= tol) {
      return { score: "E", feedback: "Correct." };
    }
    if (Math.abs(studentVal - expectedVal) <= tol * 3) {
      return {
        score: "P",
        feedback: `Close. The expected value is ${expectedVal}. Check your calculation: b\u2081 \u00b1 t* \u00d7 SE(b\u2081).`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The expected value is ${expectedVal}. Use the formula: b\u2081 \u00b1 t* \u00d7 SE(b\u2081).`
    };
  }

  // ============ LEVEL 8: INTERPRETATION TEXT ============
  if (fieldId === "interpretText") {
    const keywords = context.keywords || context.expectedKeywords || [];
    const matchCount = keywordMatchCount(answer, keywords);

    const mentionsConfident = containsAny(answer, ["confident", "confidence"]);
    const mentionsSlope = containsAny(answer, ["slope", "true slope", "\u03b2", "beta"]);
    const mentionsBetween = containsAny(answer, ["between", "from", "to"]);
    const mentionsContext = containsAny(answer, [
      context.xVar || "", context.yVar || "", context.contextName || ""
    ].filter(s => s.length > 0));

    if (mentionsConfident && mentionsSlope && mentionsBetween && mentionsContext) {
      return {
        score: "E",
        feedback: "Excellent interpretation. You included confidence level, true slope, interval bounds, and context."
      };
    }
    if ((mentionsConfident && mentionsBetween) || (mentionsSlope && mentionsBetween) || matchCount >= 3) {
      return {
        score: "P",
        feedback: "Partially correct. A complete interpretation should state the confidence level, mention the true slope, give both bounds, and describe the context (variables and units)."
      };
    }
    return {
      score: "I",
      feedback: "Your interpretation should follow this template: 'We are C% confident that the true slope of the population regression model relating [x] to [y] is between [lower] and [upper] [units].'"
    };
  }

  // ============ FALLBACK ============
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct." };
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
