// grading-rules.js - AP Statistics Unit 5 Topics 5.1-5.2
// Topics: Sampling variability, sampling distributions, z-scores, normal probability,
// inverse normal, missing elements, normality assessment, combining random variables

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
    "normalExplain",
    "capstoneExplain"
  ]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter your response." };
    }
    // Number fields
    const numberFields = new Set([
      "zScoreAnswer", "zScore", "probability", "invZScore", "cutoffValue",
      "combMean", "combSD", "combMean2", "combSD2", "combProb"
    ]);
    if (numberFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter a number." };
    }
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  // ========== LEVEL 1: Sampling Variability (Choice) ==========
  if (fieldId === "sampleVarAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Different random samples from the same population will produce different statistics due to sampling variability."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Sampling variability means that statistics vary from sample to sample. Different random samples naturally produce different results, but the pattern of variation is predictable."
    };
  }

  // ========== LEVEL 2: Sampling Distribution (Dropdown) ==========
  if (fieldId === "sampDistAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! A sampling distribution shows all possible values of a statistic and how often they occur across all possible samples of the same size."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. A sampling distribution describes the distribution of a STATISTIC (not individual values) computed from ALL possible samples of a given size from a population."
    };
  }

  // ========== LEVEL 3: Z-Score Calculation (zScoreAnswer) ==========
  if (fieldId === "zScoreAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used sigma-squared instead of sigma
    if (context.sigma && context.sigma !== 0) {
      const sigmaSquared = context.sigma * context.sigma;
      const wrongAnswer = (context.x - context.mu) / sigmaSquared;
      if (Math.abs(studentVal - wrongAnswer) < 0.05 && diff > tolerance) {
        return {
          score: "I",
          feedback: `Did you divide by \u03C3\u00B2 instead of \u03C3? Use z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
        };
      }
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! Check: z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
    };
  }

  // ========== LEVEL 4: Z-Score (zScore field) ==========
  if (fieldId === "zScore") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used sigma-squared instead of sigma
    if (context.sigma && context.sigma !== 0) {
      const sigmaSquared = context.sigma * context.sigma;
      const wrongAnswer = (context.x - context.mu) / sigmaSquared;
      if (Math.abs(studentVal - wrongAnswer) < 0.05 && diff > tolerance) {
        return {
          score: "I",
          feedback: `Did you divide by \u03C3\u00B2 instead of \u03C3? Use z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
        };
      }
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! Check: z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. z = (x - \u03BC) / \u03C3 = (${context.x} - ${context.mu}) / ${context.sigma} = ${expectedVal}`
    };
  }

  // ========== LEVEL 4: Probability ==========
  if (fieldId === "probability") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check complement error
    if (Math.abs(studentVal - (1 - expectedVal)) < 0.005) {
      const directionHint = context.direction === "greater than"
        ? "1 - P(Z < z)"
        : "P(Z < z) directly";
      return {
        score: "I",
        feedback: `You found the complement! For P(X ${context.direction} ${context.x}), you need ${directionHint}.`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: "Close! Check your z-table lookup."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability is ${expectedVal}. Make sure you look up the correct z-score in the table and account for the direction of the inequality.`
    };
  }

  // ========== LEVEL 5: Inverse Z-Score ==========
  if (fieldId === "invZScore") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check sign error
    if (Math.abs(studentVal - (-expectedVal)) < 0.05 && diff > tolerance) {
      const signDescription = expectedVal > 0 ? "positive" : "negative";
      return {
        score: "I",
        feedback: `Check your z-score sign! For the ${context.percentileDescription}, z should be ${signDescription}.`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! The z-score for the ${context.percentileDescription} is ${expectedVal}.`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! Check your z-table lookup for the ${context.percentileDescription}. z = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The z-score for the ${context.percentileDescription} is ${expectedVal}. Look up the area in the z-table to find the corresponding z-score.`
    };
  }

  // ========== LEVEL 5: Cutoff Value ==========
  if (fieldId === "cutoffValue") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.15;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used x = mu - z*sigma instead of mu + z*sigma
    if (context.expectedZ && context.sigma) {
      const wrongAnswer = context.mu - context.expectedZ * context.sigma;
      if (Math.abs(studentVal - wrongAnswer) < 0.15 && diff > tolerance) {
        return {
          score: "I",
          feedback: `Check the sign! x = \u03BC + z\u00B7\u03C3, not \u03BC - z\u00B7\u03C3`
        };
      }
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! x = \u03BC + z\u00B7\u03C3 = ${context.mu} + (${context.expectedZ})(${context.sigma}) = ${expectedVal}`
      };
    }
    if (diff <= 0.3) {
      return {
        score: "P",
        feedback: `Close! x = \u03BC + z\u00B7\u03C3`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. x = \u03BC + z\u00B7\u03C3 = ${context.mu} + (${context.expectedZ})(${context.sigma}) = ${expectedVal}`
    };
  }

  // ========== LEVEL 6: Missing Element (Dropdown) ==========
  if (fieldId === "missingElement") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.explanation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The missing element is: ${expected}. AP solutions need: (1) Define variable, (2) Show normality, (3) Identify \u03BC and \u03C3, (4) Value of interest + direction, (5) Correct probability.`
    };
  }

  // ========== LEVEL 7: Normal Choice (Choice) ==========
  if (fieldId === "normalChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.reason}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.reason}`
    };
  }

  // ========== LEVEL 7: Normal Explain (Textarea) ==========
  if (fieldId === "normalExplain") {
    // Check for key vocabulary
    const shapeKeywords = ["unimodal", "symmetric", "bell-shaped", "bell shaped", "skewed", "shape"];
    const empiricalKeywords = ["68", "95", "99.7", "empirical", "68-95-99.7"];
    const sampleSizeKeywords = ["sample size", "n =", "large enough", "small", "n is"];
    const normalKeywords = ["normal", "approximately normal", "not normal"];

    const mentionsShape = containsAny(answer, shapeKeywords);
    const mentionsEmpirical = containsAny(answer, empiricalKeywords);
    const mentionsSampleSize = containsAny(answer, sampleSizeKeywords);
    const mentionsNormal = containsAny(answer, normalKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 8;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so"]);

    // E: mentions shape concept + (empirical rule OR sample size reasoning) + substance + reasoning
    if (mentionsShape && (mentionsEmpirical || mentionsSampleSize) && hasSubstance && hasReasoning) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly justified whether the distribution is approximately normal."
      };
    }
    // P: mentions at least one concept + substance
    if ((mentionsShape || mentionsEmpirical || mentionsSampleSize || mentionsNormal) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Include more detail about the shape (symmetric/skewed) and justify using the empirical rule or sample size reasoning."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should discuss the shape of the distribution and use the empirical rule or sample size to justify whether it is approximately normal."
    };
  }

  // ========== LEVEL 8: Combined Mean (combMean) ==========
  if (fieldId === "combMean") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const operatorSymbol = context.operation === "difference" ? "-" : "+";

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! \u03BC(X${operatorSymbol}Y) = ${context.muX} ${operatorSymbol} ${context.muY} = ${expectedVal}`
      };
    }
    if (diff <= 0.2) {
      return {
        score: "P",
        feedback: `Close! \u03BC(X${operatorSymbol}Y) = ${context.muX} ${operatorSymbol} ${context.muY} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. \u03BC(X${operatorSymbol}Y) = ${context.muX} ${operatorSymbol} ${context.muY} = ${expectedVal}`
    };
  }

  // ========== LEVEL 8: Combined SD (combSD) - THE VARIANCE TRAP ==========
  if (fieldId === "combSD") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const sdSum = context.sigmaX + context.sigmaY;
    const sdDiff = Math.abs(context.sigmaX - context.sigmaY);
    const varSum = context.varX + context.varY;

    // VARIANCE TRAP: student added SDs directly
    if (Math.abs(studentVal - sdSum) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `\u26A0\uFE0F VARIANCE TRAP! You added SDs directly (${context.sigmaX} + ${context.sigmaY} = ${sdSum}). You must add VARIANCES first, then square root: \u03C3 = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}`
      };
    }

    // VARIANCE TRAP: student subtracted SDs
    if (Math.abs(studentVal - sdDiff) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `\u26A0\uFE0F VARIANCE TRAP! You subtracted SDs. Even for differences, variances ADD! \u03C3 = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}`
      };
    }

    // Forgot square root: got the variance sum but didn't take sqrt
    if (Math.abs(studentVal - varSum) < 0.5 && diff > tolerance) {
      return {
        score: "P",
        feedback: `Good! You added variances correctly, but forgot the square root! \u03C3 = \u221A${context.varX + context.varY} = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! \u03C3 = \u221A(${context.sigmaX}\u00B2 + ${context.sigmaY}\u00B2) = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}. You avoided the variance trap!`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! \u03C3 = \u221A(\u03C3X\u00B2 + \u03C3Y\u00B2) = \u221A(${context.varX} + ${context.varY}) \u2248 ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. \u03C3 = \u221A(\u03C3X\u00B2 + \u03C3Y\u00B2) = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}. Remember: add VARIANCES, then square root!`
    };
  }

  // ========== LEVEL 9: Combined Mean 2 (combMean2) ==========
  if (fieldId === "combMean2") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const operatorSymbol = context.operation === "difference" ? "-" : "+";

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! \u03BC(X${operatorSymbol}Y) = ${context.muX} ${operatorSymbol} ${context.muY} = ${expectedVal}`
      };
    }
    if (diff <= 0.2) {
      return {
        score: "P",
        feedback: `Close! \u03BC(X${operatorSymbol}Y) = ${context.muX} ${operatorSymbol} ${context.muY} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. \u03BC(X${operatorSymbol}Y) = ${context.muX} ${operatorSymbol} ${context.muY} = ${expectedVal}`
    };
  }

  // ========== LEVEL 9: Combined SD 2 (combSD2) - THE VARIANCE TRAP ==========
  if (fieldId === "combSD2") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const sdSum = context.sigmaX + context.sigmaY;
    const sdDiff = Math.abs(context.sigmaX - context.sigmaY);
    const varSum = context.varX + context.varY;

    // VARIANCE TRAP: student added SDs directly
    if (Math.abs(studentVal - sdSum) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `\u26A0\uFE0F VARIANCE TRAP! You added SDs directly (${context.sigmaX} + ${context.sigmaY} = ${sdSum}). You must add VARIANCES first, then square root: \u03C3 = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}`
      };
    }

    // VARIANCE TRAP: student subtracted SDs
    if (Math.abs(studentVal - sdDiff) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `\u26A0\uFE0F VARIANCE TRAP! You subtracted SDs. Even for differences, variances ADD! \u03C3 = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}`
      };
    }

    // Forgot square root: got the variance sum but didn't take sqrt
    if (Math.abs(studentVal - varSum) < 0.5 && diff > tolerance) {
      return {
        score: "P",
        feedback: `Good! You added variances correctly, but forgot the square root! \u03C3 = \u221A${context.varX + context.varY} = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! \u03C3 = \u221A(${context.sigmaX}\u00B2 + ${context.sigmaY}\u00B2) = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}. You avoided the variance trap!`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! \u03C3 = \u221A(\u03C3X\u00B2 + \u03C3Y\u00B2) = \u221A(${context.varX} + ${context.varY}) \u2248 ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. \u03C3 = \u221A(\u03C3X\u00B2 + \u03C3Y\u00B2) = \u221A(${context.varX} + ${context.varY}) = ${expectedVal}. Remember: add VARIANCES, then square root!`
    };
  }

  // ========== LEVEL 9: Combined Probability (combProb) ==========
  if (fieldId === "combProb") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check complement error
    if (Math.abs(studentVal - (1 - expectedVal)) < 0.005) {
      return {
        score: "I",
        feedback: "You found the complement! Check the direction of your inequality."
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! Check your z-score calculation or table lookup. P = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability is ${expectedVal}. Find the z-score for the combined variable, then use the z-table.`
    };
  }

  // ========== LEVEL 10: Capstone Answer (Dropdown) ==========
  if (fieldId === "capstoneAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.explanation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation}`
    };
  }

  // ========== LEVEL 10: Capstone Explain (Textarea) ==========
  if (fieldId === "capstoneExplain") {
    // Check for relevant vocabulary by topic area
    const samplingKeywords = ["sampling variability", "different samples", "predictable", "distribution", "vary", "sample"];
    const normalKeywords = ["z-score", "normal", "probability", "standard deviation", "mean"];
    const inverseKeywords = ["percentile", "cutoff", "z-score", "inverse"];
    const linearComboKeywords = ["variance", "add variances", "independent", "square root", "\u03C3\u00B2"];

    const mentionsSampling = containsAny(answer, samplingKeywords);
    const mentionsNormal = containsAny(answer, normalKeywords);
    const mentionsInverse = containsAny(answer, inverseKeywords);
    const mentionsLinearCombo = containsAny(answer, linearComboKeywords);

    const conceptMentioned = mentionsSampling || mentionsNormal || mentionsInverse || mentionsLinearCombo;

    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if (conceptMentioned && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly demonstrated understanding of the Unit 5 concept."
      };
    }
    if (conceptMentioned && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Add more specific reasoning about WHY this concept applies to this scenario."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should reference the specific Unit 5 concept (sampling distribution, z-score, normal probability, inverse normal, or combining variables) and explain your reasoning."
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
