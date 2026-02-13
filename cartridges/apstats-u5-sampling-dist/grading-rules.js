// grading-rules.js - AP Statistics Unit 5 Topics 5.1-5.7
// Topics: Sampling variability, sampling distributions, z-scores, normal probability,
// inverse normal, missing elements, normality assessment, combining random variables,
// Central Limit Theorem, randomization distributions, biased/unbiased point estimates,
// sampling distributions for sample proportions, differences in sample proportions,
// sampling distributions for sample means

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
    "capstoneExplain",
    "cltNormalExplain",
    "capstone53Explain",
    "biasExplain",
    "capstone54Explain",
    "largeCountsExplain",
    "capstone55Explain",
    "diffLargeCountsExplain",
    "diffInterpretProbText",
    "capstone56Explain",
    "meanShapeExplain",
    "capstone57Explain"
  ]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter your response." };
    }
    // Number fields
    const numberFields = new Set([
      "zScoreAnswer", "zScore", "probability", "invZScore", "cutoffValue",
      "combMean", "combSD", "combMean2", "combSD2", "combProb",
      "pValueCalc",
      "propMean", "propSD", "propZScore", "propProb",
      "diffPropMean", "diffPropSD", "diffPropZScore", "diffPropProb",
      "meanMu", "meanSigma", "meanZScore", "meanProb"
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

  // ========== LEVEL 11: CLT Concept (Dropdown) ==========
  if (fieldId === "cltConceptAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand the Central Limit Theorem."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. The CLT states that for sufficiently large samples, the sampling distribution of x\u0304 is approximately normal regardless of population shape. Key conditions: independent observations and large enough n."
    };
  }

  // ========== LEVEL 12: CLT Application Choice ==========
  if (fieldId === "cltNormalChoice") {
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

  // ========== LEVEL 12: CLT Application Explain (Textarea) ==========
  if (fieldId === "cltNormalExplain") {
    const cltKeywords = ["clt", "central limit", "theorem"];
    const shapeKeywords = ["normal", "skewed", "symmetric", "bell", "bimodal", "uniform", "shape"];
    const sampleSizeKeywords = ["sample size", "n =", "n is", "large enough", "n \u2265", "n >=", "30"];
    const popKeywords = ["population", "pop"];

    const mentionsCLT = containsAny(answer, cltKeywords);
    const mentionsShape = containsAny(answer, shapeKeywords);
    const mentionsSampleSize = containsAny(answer, sampleSizeKeywords);
    const mentionsPop = containsAny(answer, popKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 8;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so"]);

    if ((mentionsCLT || (mentionsShape && mentionsSampleSize)) && hasSubstance && hasReasoning) {
      return {
        score: "E",
        feedback: "Excellent explanation! You correctly connected the population shape, sample size, and CLT conditions."
      };
    }
    if ((mentionsShape || mentionsSampleSize || mentionsCLT || mentionsPop) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Be sure to reference both the population shape AND the sample size when explaining whether the CLT applies."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should reference the population shape and sample size. Key rule: if the population is normal \u2192 any n works. If non-normal \u2192 need n \u2265 30 for the CLT to apply."
    };
  }

  // ========== LEVEL 13: Randomization Concept (Dropdown) ==========
  if (fieldId === "randDistAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand how randomization distributions work."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. A randomization distribution is created by repeatedly randomly reassigning the observed response values to treatment groups and calculating the statistic each time. It simulates what would happen by chance alone."
    };
  }

  // ========== LEVEL 14: P-Value Calculation ==========
  if (fieldId === "pValueCalc") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.002;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used complement
    if (Math.abs(studentVal - (1 - expectedVal)) < 0.005) {
      return {
        score: "I",
        feedback: `You found the complement! P-value = extreme count / total trials = ${context.extremeCount} / ${context.totalTrials} = ${expectedVal}, not ${Math.round((1 - expectedVal) * 1000) / 1000}.`
      };
    }

    // Check if student used count instead of proportion
    if (Math.abs(studentVal - parseFloat(context.extremeCount)) < 1) {
      return {
        score: "I",
        feedback: `You gave the count, not the proportion! P-value = ${context.extremeCount} / ${context.totalTrials} = ${expectedVal}. Divide the extreme count by the total number of trials.`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P-value = ${context.extremeCount} / ${context.totalTrials} = ${expectedVal}`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! P-value = extreme count / total trials = ${context.extremeCount} / ${context.totalTrials} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. P-value = extreme count / total trials = ${context.extremeCount} / ${context.totalTrials} = ${expectedVal}`
    };
  }

  // ========== LEVEL 14: Randomization Conclusion (Choice) ==========
  if (fieldId === "randConclusion") {
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

  // ========== LEVEL 15: 5.3 Capstone Answer (Dropdown) ==========
  if (fieldId === "capstone53Answer") {
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

  // ========== LEVEL 15: 5.3 Capstone Explain (Textarea) ==========
  if (fieldId === "capstone53Explain") {
    const cltKeywords = ["clt", "central limit", "theorem", "sampling distribution", "sample size", "n \u2265"];
    const randKeywords = ["randomization", "p-value", "chance alone", "reassign", "shuffle", "simulation"];
    const normalKeywords = ["normal", "approximately normal", "bell", "symmetric"];
    const evidenceKeywords = ["evidence", "convincing", "unlikely", "likely", "plausible"];

    const mentionsCLT = containsAny(answer, cltKeywords);
    const mentionsRand = containsAny(answer, randKeywords);
    const mentionsNormal = containsAny(answer, normalKeywords);
    const mentionsEvidence = containsAny(answer, evidenceKeywords);

    const conceptMentioned = mentionsCLT || mentionsRand || mentionsNormal || mentionsEvidence;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if (conceptMentioned && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly demonstrated understanding of Topic 5.3 concepts."
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
      feedback: "Your explanation should reference the specific Topic 5.3 concept (CLT, sampling distribution shape, randomization distribution, or p-value interpretation) and explain your reasoning."
    };
  }

  // ========== LEVEL 16: Point Estimate Terminology (Dropdown) ==========
  if (fieldId === "ptEstTermAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand the distinction between point estimators and point estimates."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Remember: a point ESTIMATOR is the statistic/method (like x̄ or p̂), while a point ESTIMATE is the specific numerical value from one sample. The population value is the PARAMETER."
    };
  }

  // ========== LEVEL 17: Estimator Bias Concept (Dropdown) ==========
  if (fieldId === "biasConceptAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand the concept of biased and unbiased estimators."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. An estimator is UNBIASED if, on average (across all possible samples), the value of the estimator equals the population parameter. A single sample not matching the parameter does NOT indicate bias."
    };
  }

  // ========== LEVEL 18: Bias Choice (Choice) ==========
  if (fieldId === "biasChoice") {
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

  // ========== LEVEL 18: Bias Explain (Textarea) ==========
  if (fieldId === "biasExplain") {
    const biasKeywords = ["biased", "unbiased", "bias"];
    const meanKeywords = ["mean", "average", "expected value", "on average"];
    const compareKeywords = ["equal", "equals", "not equal", "does not equal", "≠", "!=", "same as", "different from"];
    const paramKeywords = ["parameter", "population", "μ", "range", "maximum", "minimum", "proportion"];
    const sampDistKeywords = ["sampling distribution", "all possible", "all sample", "mean of all"];

    const mentionsBias = containsAny(answer, biasKeywords);
    const mentionsMean = containsAny(answer, meanKeywords);
    const mentionsCompare = containsAny(answer, compareKeywords);
    const mentionsParam = containsAny(answer, paramKeywords);
    const mentionsSampDist = containsAny(answer, sampDistKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 8;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so"]);

    // E: mentions bias concept + comparison + substance + reasoning
    if (mentionsBias && (mentionsCompare || mentionsSampDist) && hasSubstance && hasReasoning) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly justified whether the estimator is biased or unbiased by comparing the mean of the sampling distribution to the parameter."
      };
    }
    // P: mentions at least one relevant concept + substance
    if ((mentionsBias || mentionsMean || mentionsCompare || mentionsParam || mentionsSampDist) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Be more specific: compare the mean of the sampling distribution to the population parameter and state whether they are equal."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should state whether the mean of the sampling distribution equals the population parameter. If they're equal → unbiased; if not → biased."
    };
  }

  // ========== LEVEL 19: 5.4 Capstone Answer (Dropdown) ==========
  if (fieldId === "capstone54Answer") {
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

  // ========== LEVEL 19: 5.4 Capstone Explain (Textarea) ==========
  if (fieldId === "capstone54Explain") {
    const biasKeywords = ["biased", "unbiased", "bias"];
    const estimatorKeywords = ["estimator", "estimate", "point estimate", "point estimator", "statistic"];
    const paramKeywords = ["parameter", "population", "μ", "p", "σ"];
    const sampDistKeywords = ["sampling distribution", "on average", "all possible", "mean of all", "expected value"];
    const variabilityKeywords = ["variability", "vary", "varies", "different samples", "sampling variability"];

    const mentionsBias = containsAny(answer, biasKeywords);
    const mentionsEstimator = containsAny(answer, estimatorKeywords);
    const mentionsParam = containsAny(answer, paramKeywords);
    const mentionsSampDist = containsAny(answer, sampDistKeywords);
    const mentionsVariability = containsAny(answer, variabilityKeywords);

    const conceptMentioned = mentionsBias || mentionsEstimator || mentionsSampDist || mentionsVariability;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if (conceptMentioned && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly demonstrated understanding of Topic 5.4 concepts."
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
      feedback: "Your explanation should reference the specific Topic 5.4 concept (point estimator, point estimate, bias, unbiasedness, or estimator variability) and explain your reasoning."
    };
  }

  // ========== LEVEL 20: Proportion Mean (propMean) ==========
  if (fieldId === "propMean") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used 1-p instead of p
    if (Math.abs(studentVal - (1 - expectedVal)) < 0.005 && diff > tolerance) {
      return {
        score: "I",
        feedback: `Did you use (1 \u2212 p) instead of p? \u03BC_p\u0302 = p = ${expectedVal}, not 1 \u2212 p = ${Math.round((1 - expectedVal) * 1000) / 1000}.`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! \u03BC_p\u0302 = p = ${expectedVal}. The mean of the sampling distribution of p\u0302 equals the population proportion.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! \u03BC_p\u0302 = p = ${expectedVal}. The mean equals the population proportion exactly.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. \u03BC_p\u0302 = p = ${expectedVal}. The mean of the sampling distribution of p\u0302 always equals the population proportion p.`
    };
  }

  // ========== LEVEL 20: Proportion SD (propSD) ==========
  if (fieldId === "propSD") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const p = parseFloat(context.p);
    const n = parseFloat(context.n);

    // Check common errors
    // Error 1: forgot sqrt (gave p(1-p)/n instead of sqrt)
    const withoutSqrt = p * (1 - p) / n;
    if (Math.abs(studentVal - withoutSqrt) < 0.005 && diff > tolerance) {
      return {
        score: "P",
        feedback: `Almost! You calculated p(1\u2212p)/n = ${Math.round(withoutSqrt * 10000) / 10000}, but forgot the square root. \u03C3_p\u0302 = \u221A(p(1\u2212p)/n) = ${expectedVal}`
      };
    }

    // Error 2: forgot to divide by n (gave sqrt(p(1-p)))
    const withoutN = Math.sqrt(p * (1 - p));
    if (Math.abs(studentVal - withoutN) < 0.01 && diff > tolerance) {
      return {
        score: "I",
        feedback: `You forgot to divide by n! \u03C3_p\u0302 = \u221A(p(1\u2212p)/n), not \u221A(p(1\u2212p)). \u03C3_p\u0302 = \u221A(${p} \u00D7 ${Math.round((1-p)*100)/100} / ${n}) = ${expectedVal}`
      };
    }

    // Error 3: used sigma/sqrt(n) formula instead (for means, not proportions)
    if (context.propSD) {
      const wrongFormula = parseFloat(context.p) / Math.sqrt(n);
      if (Math.abs(studentVal - wrongFormula) < 0.01 && diff > tolerance) {
        return {
          score: "I",
          feedback: `That formula (p/\u221An) is not correct for proportions. Use \u03C3_p\u0302 = \u221A(p(1\u2212p)/n) = ${expectedVal}`
        };
      }
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! \u03C3_p\u0302 = \u221A(p(1\u2212p)/n) = \u221A(${p} \u00D7 ${Math.round((1-p)*100)/100} / ${n}) = ${expectedVal}`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! \u03C3_p\u0302 = \u221A(p(1\u2212p)/n) = \u221A(${p} \u00D7 ${Math.round((1-p)*100)/100} / ${n}) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. \u03C3_p\u0302 = \u221A(p(1\u2212p)/n) = \u221A(${p} \u00D7 ${Math.round((1-p)*100)/100} / ${n}) = ${expectedVal}`
    };
  }

  // ========== LEVEL 21: Large Counts Choice ==========
  if (fieldId === "largeCountsChoice") {
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

  // ========== LEVEL 21: Large Counts Explain (Textarea) ==========
  if (fieldId === "largeCountsExplain") {
    const npKeywords = ["np", "n*p", "n(p)", "n\u00D7p", "n \u00B7 p"];
    const nqKeywords = ["n(1-p)", "n(1\u2212p)", "n*(1-p)", "nq", "n times (1-p)"];
    const thresholdKeywords = ["10", "\u2265 10", ">= 10", "at least 10", "greater than or equal to 10"];
    const conditionKeywords = ["large counts", "condition", "met", "not met", "approximately normal"];

    const mentionsNP = containsAny(answer, npKeywords);
    const mentionsNQ = containsAny(answer, nqKeywords);
    const mentionsThreshold = containsAny(answer, thresholdKeywords);
    const mentionsCondition = containsAny(answer, conditionKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 6;

    // E: mentions both np and n(1-p) + threshold + substance
    if (mentionsNP && mentionsThreshold && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You correctly showed the Large Counts check with both np and n(1\u2212p) calculations."
      };
    }
    // P: mentions at least np or threshold + substance
    if ((mentionsNP || mentionsNQ || mentionsThreshold || mentionsCondition) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Make sure to calculate BOTH np and n(1\u2212p) and compare each to 10."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should calculate np and n(1\u2212p), then check if BOTH are \u2265 10. Show the actual numbers."
    };
  }

  // ========== LEVEL 22: Interpret Answer (Dropdown) ==========
  if (fieldId === "interpretAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Your interpretation properly references all possible samples and uses appropriate language."
      };
    }
    // Check if the student picked a common wrong interpretation
    if (containsAny(answer, ["every sample", "exactly", "always", "guaranteed"])) {
      return {
        score: "I",
        feedback: "Incorrect. The mean/SD of the sampling distribution describes what happens ON AVERAGE across all possible samples \u2014 not what happens in every single sample. Individual samples will vary."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. When interpreting \u03BC_p\u0302, reference 'all possible samples of size n.' When interpreting \u03C3_p\u0302, use 'typically' or 'on average' to describe variation."
    };
  }

  // ========== LEVEL 23: Proportion Z-Score ==========
  if (fieldId === "propZScore") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student subtracted in wrong order (p - p̂ instead of p̂ - p)
    if (Math.abs(studentVal - (-expectedVal)) < 0.05 && diff > tolerance) {
      return {
        score: "I",
        feedback: `Check your subtraction order! z = (p\u0302 \u2212 p) / \u03C3_p\u0302 = (${context.pHat} \u2212 ${context.p}) / ${context.propSD} = ${expectedVal}`
      };
    }

    // Check if student divided by p instead of σ_p̂
    if (context.p && context.pHat) {
      const wrongDivisor = (parseFloat(context.pHat) - parseFloat(context.p)) / parseFloat(context.p);
      if (Math.abs(studentVal - wrongDivisor) < 0.1 && diff > tolerance) {
        return {
          score: "I",
          feedback: `You divided by p instead of \u03C3_p\u0302! z = (p\u0302 \u2212 p) / \u03C3_p\u0302, not (p\u0302 \u2212 p) / p. Use \u03C3_p\u0302 = ${context.propSD}`
        };
      }
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! z = (p\u0302 \u2212 p) / \u03C3_p\u0302 = (${context.pHat} \u2212 ${context.p}) / ${context.propSD} = ${expectedVal}`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! z = (p\u0302 \u2212 p) / \u03C3_p\u0302 = (${context.pHat} \u2212 ${context.p}) / ${context.propSD} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. z = (p\u0302 \u2212 p) / \u03C3_p\u0302 = (${context.pHat} \u2212 ${context.p}) / ${context.propSD} = ${expectedVal}`
    };
  }

  // ========== LEVEL 23: Proportion Probability ==========
  if (fieldId === "propProb") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check complement error
    if (Math.abs(studentVal - (1 - expectedVal)) < 0.005) {
      const directionHint = context.direction === "GREATER THAN"
        ? "1 \u2212 P(Z < z)"
        : "P(Z < z) directly";
      return {
        score: "I",
        feedback: `You found the complement! For P(p\u0302 ${context.direction} ${context.pHat}), you need ${directionHint}.`
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
        feedback: `Close! Check your z-table lookup. P = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability is ${expectedVal}. Use z = (p\u0302 \u2212 p) / \u03C3_p\u0302 to find the z-score, then use the z-table.`
    };
  }

  // ========== LEVEL 24: 5.5 Capstone Answer (Dropdown) ==========
  if (fieldId === "capstone55Answer") {
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

  // ========== LEVEL 24: 5.5 Capstone Explain (Textarea) ==========
  if (fieldId === "capstone55Explain") {
    const propKeywords = ["p\u0302", "p-hat", "phat", "sample proportion", "proportion"];
    const formulaKeywords = ["\u03C3_p\u0302", "\u221A(p(1-p)/n)", "sqrt", "standard deviation", "\u03C3"];
    const conditionKeywords = ["large counts", "np", "n(1-p)", "10%", "condition", "approximately normal"];
    const interpretKeywords = ["all possible samples", "on average", "typically", "unbiased", "varies"];
    const probKeywords = ["z-score", "z =", "probability", "normalcdf", "table"];

    const mentionsProp = containsAny(answer, propKeywords);
    const mentionsFormula = containsAny(answer, formulaKeywords);
    const mentionsCondition = containsAny(answer, conditionKeywords);
    const mentionsInterpret = containsAny(answer, interpretKeywords);
    const mentionsProb = containsAny(answer, probKeywords);

    const conceptMentioned = mentionsProp || mentionsFormula || mentionsCondition || mentionsInterpret || mentionsProb;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if (conceptMentioned && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly demonstrated understanding of Topic 5.5 concepts."
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
      feedback: "Your explanation should reference the specific Topic 5.5 concept (p\u0302 distribution parameters, Large Counts condition, interpretation, or probability calculation) and explain your reasoning."
    };
  }

  // ========== LEVEL 25: Difference in Proportions Mean (diffPropMean) ==========
  if (fieldId === "diffPropMean") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const p1 = parseFloat(context.p1);
    const p2 = parseFloat(context.p2);

    // Check if student added instead of subtracted
    if (Math.abs(studentVal - (p1 + p2)) < 0.01 && diff > tolerance) {
      return {
        score: "I",
        feedback: `You added the proportions instead of subtracting! μ_{p̂₁−p̂₂} = p₁ − p₂ = ${p1} − ${p2} = ${expectedVal}, not p₁ + p₂ = ${Math.round((p1 + p2) * 1000) / 1000}.`
      };
    }

    // Check if student reversed the subtraction
    if (Math.abs(studentVal - (p2 - p1)) < 0.005 && diff > tolerance) {
      return {
        score: "I",
        feedback: `You subtracted in the wrong order! μ_{p̂₁−p̂₂} = p₁ − p₂ = ${p1} − ${p2} = ${expectedVal}, not p₂ − p₁ = ${Math.round((p2 - p1) * 1000) / 1000}.`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! μ_{p̂₁−p̂₂} = p₁ − p₂ = ${p1} − ${p2} = ${expectedVal}. The mean equals the difference in population proportions.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! μ_{p̂₁−p̂₂} = p₁ − p₂ = ${p1} − ${p2} = ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. μ_{p̂₁−p̂₂} = p₁ − p₂ = ${p1} − ${p2} = ${expectedVal}.`
    };
  }

  // ========== LEVEL 25: Difference in Proportions SD (diffPropSD) ==========
  if (fieldId === "diffPropSD") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const p1 = parseFloat(context.p1);
    const p2 = parseFloat(context.p2);
    const n1 = parseFloat(context.n1);
    const n2 = parseFloat(context.n2);
    const var1 = p1 * (1 - p1) / n1;
    const var2 = p2 * (1 - p2) / n2;
    const sd1 = Math.sqrt(var1);
    const sd2 = Math.sqrt(var2);

    // Error: added SDs instead of variances
    const sdSum = sd1 + sd2;
    if (Math.abs(studentVal - sdSum) < 0.01 && diff > tolerance) {
      return {
        score: "I",
        feedback: `⚠️ VARIANCE TRAP! You added standard deviations (${Math.round(sd1 * 1000) / 1000} + ${Math.round(sd2 * 1000) / 1000}). You must add VARIANCES, then take one square root: σ = √(${Math.round(var1 * 10000) / 10000} + ${Math.round(var2 * 10000) / 10000}) = ${expectedVal}`
      };
    }

    // Error: forgot square root (gave sum of variances)
    const varSum = var1 + var2;
    if (Math.abs(studentVal - varSum) < 0.005 && diff > tolerance) {
      return {
        score: "P",
        feedback: `Almost! You added variances correctly, but forgot the square root! σ = √(${Math.round(varSum * 10000) / 10000}) = ${expectedVal}`
      };
    }

    // Error: used only one term (forgot the other population)
    if (Math.abs(studentVal - sd1) < 0.01 && diff > tolerance) {
      return {
        score: "I",
        feedback: `You only used one population's variance! Include BOTH: σ = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂) = ${expectedVal}`
      };
    }
    if (Math.abs(studentVal - sd2) < 0.01 && diff > tolerance) {
      return {
        score: "I",
        feedback: `You only used one population's variance! Include BOTH: σ = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂) = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! σ_{p̂₁−p̂₂} = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂) = √(${Math.round(var1 * 10000) / 10000} + ${Math.round(var2 * 10000) / 10000}) = ${expectedVal}`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close! σ_{p̂₁−p̂₂} = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. σ_{p̂₁−p̂₂} = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂) = √(${Math.round(var1 * 10000) / 10000} + ${Math.round(var2 * 10000) / 10000}) = ${expectedVal}. Add both variance terms, then take the square root.`
    };
  }

  // ========== LEVEL 26: Diff Large Counts Choice ==========
  if (fieldId === "diffLargeCountsChoice") {
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

  // ========== LEVEL 26: Diff Large Counts Explain (Textarea) ==========
  if (fieldId === "diffLargeCountsExplain") {
    const npKeywords = ["n₁p₁", "n1p1", "n₁·p₁", "n1*p1", "n₂p₂", "n2p2", "n₂·p₂", "n2*p2", "np"];
    const nqKeywords = ["n₁(1-p₁)", "n₁(1−p₁)", "n1(1-p1)", "n₂(1-p₂)", "n₂(1−p₂)", "n2(1-p2)", "nq", "n(1-p)"];
    const thresholdKeywords = ["10", "≥ 10", ">= 10", "at least 10"];
    const fourKeywords = ["four", "4", "all four", "all 4"];

    const mentionsNP = containsAny(answer, npKeywords);
    const mentionsNQ = containsAny(answer, nqKeywords);
    const mentionsThreshold = containsAny(answer, thresholdKeywords);
    const mentionsFour = containsAny(answer, fourKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 6;

    if (mentionsNP && mentionsThreshold && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You correctly checked all four Large Counts conditions for the two-proportion case."
      };
    }
    if ((mentionsFour || mentionsNQ || mentionsThreshold) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Make sure to calculate ALL FOUR values: n₁p₁, n₁(1−p₁), n₂p₂, n₂(1−p₂) and compare each to 10."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should calculate all four values: n₁p₁, n₁(1−p₁), n₂p₂, n₂(1−p₂). Check if each is ≥ 10. ALL FOUR must pass."
    };
  }

  // ========== LEVEL 27: Diff Interpret Answer (Dropdown) ==========
  if (fieldId === "diffInterpretAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Your interpretation properly references all possible pairs of samples and uses appropriate language."
      };
    }
    if (containsAny(answer, ["every pair", "exactly", "always", "guaranteed"])) {
      return {
        score: "I",
        feedback: "Incorrect. The mean/SD of the sampling distribution describes what happens ON AVERAGE across all possible pairs of samples — not what happens in every single pair."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. When interpreting μ_{p̂₁−p̂₂}, reference 'all possible pairs of samples.' When interpreting σ_{p̂₁−p̂₂}, use 'typically' or 'on average' to describe variation."
    };
  }

  // ========== LEVEL 28: Diff Proportion Z-Score ==========
  if (fieldId === "diffPropZScore") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student subtracted in wrong order
    if (Math.abs(studentVal - (-expectedVal)) < 0.05 && diff > tolerance) {
      return {
        score: "I",
        feedback: `Check your subtraction order! z = (observed difference − μ_{p̂₁−p̂₂}) / σ_{p̂₁−p̂₂} = (${context.obsDiff} − ${context.trueDiff}) / ${context.diffPropSD} = ${expectedVal}`
      };
    }

    // Check if student forgot to subtract the mean
    const wrongZ = parseFloat(context.obsDiff) / parseFloat(context.diffPropSD);
    if (Math.abs(studentVal - wrongZ) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `You forgot to subtract μ_{p̂₁−p̂₂}! z = (observed − μ) / σ = (${context.obsDiff} − ${context.trueDiff}) / ${context.diffPropSD} = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! z = (${context.obsDiff} − ${context.trueDiff}) / ${context.diffPropSD} = ${expectedVal}`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! z = (${context.obsDiff} − ${context.trueDiff}) / ${context.diffPropSD} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. z = (observed difference − μ) / σ = (${context.obsDiff} − ${context.trueDiff}) / ${context.diffPropSD} = ${expectedVal}`
    };
  }

  // ========== LEVEL 28: Diff Proportion Probability ==========
  if (fieldId === "diffPropProb") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check complement error
    if (Math.abs(studentVal - (1 - expectedVal)) < 0.005) {
      const directionHint = context.direction === "GREATER THAN"
        ? "1 − P(Z < z)"
        : "P(Z < z) directly";
      return {
        score: "I",
        feedback: `You found the complement! For P(p̂₁−p̂₂ ${context.direction} ${context.obsDiff}), you need ${directionHint}.`
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
        feedback: `Close! Check your z-table lookup. P = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability is ${expectedVal}. Use z = (observed − μ) / σ, then use the z-table.`
    };
  }

  // ========== LEVEL 30: Interpret p̂₁−p̂₂ Probability Text (Textarea) ==========
  if (fieldId === "diffInterpretProbText") {
    const allSamplesKeywords = ["all possible samples", "all possible pairs", "all samples of"];
    const probKeywords = ["%", "percent", "probability", context.probability, context.probabilityPct];
    const contextKeywords = [context.group1, context.group2, context.n1, context.n2].filter(Boolean);
    const directionKeywords = ["greater", "more", "less", "fewer", "higher", "lower", "above", "below", context.obsDiff];

    const mentionsAllSamples = containsAny(answer, allSamplesKeywords);
    const mentionsProb = containsAny(answer, probKeywords);
    const mentionsContext = contextKeywords.filter(kw => answer.toLowerCase().includes(String(kw).toLowerCase())).length >= 2;
    const mentionsDirection = containsAny(answer, directionKeywords);

    const errorKeywords = ["always", "exactly", "every sample", "guarantees", "proves"];
    const hasError = containsAny(answer, errorKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 12;

    if (hasError) {
      return {
        score: "I",
        feedback: "Be careful with absolute language! Probability describes what happens across all possible samples, not a guarantee about any single sample."
      };
    }
    if (mentionsAllSamples && mentionsProb && mentionsContext && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent interpretation! You correctly referenced all possible samples, included the probability, and used context-specific language."
      };
    }
    if ((mentionsProb || mentionsDirection) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Make sure to reference 'all possible samples of size n₁ and n₂' and include the specific populations and probability in your interpretation."
      };
    }
    return {
      score: "I",
      feedback: "Your interpretation should reference 'all possible samples of these sizes from these populations,' include the probability/percentage, and describe the observed difference in context."
    };
  }

  // ========== LEVEL 30: Unusual Choice (Dropdown) ==========
  if (fieldId === "diffUnusualChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! A probability of ${context.probability} is ${context.unusualAnswer === "Unusual" ? "less than 5%, making this unusual" : "5% or more, so this is not unusual"}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability is ${context.probability} (${context.probabilityPct}%). Since this is ${parseFloat(context.probability) < 0.05 ? "less than" : "greater than or equal to"} 0.05 (5%), the result is ${context.unusualAnswer === "Unusual" ? "unusual" : "not unusual"}.`
    };
  }

  // ========== LEVEL 29: 5.6 Capstone Answer (Dropdown) ==========
  if (fieldId === "capstone56Answer") {
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

  // ========== LEVEL 29: 5.6 Capstone Explain (Textarea) ==========
  if (fieldId === "capstone56Explain") {
    const diffPropKeywords = ["p̂₁", "p̂₂", "p-hat", "phat", "difference", "p̂₁ − p̂₂", "p1 - p2", "linear combination"];
    const formulaKeywords = ["σ_{p̂₁−p̂₂}", "√(p₁(1-p₁)/n₁", "sqrt", "standard deviation", "σ", "variance"];
    const conditionKeywords = ["large counts", "four", "4 conditions", "n₁p₁", "n₂p₂", "10%", "approximately normal"];
    const interpretKeywords = ["all possible pairs", "on average", "typically", "varies", "vary"];
    const probKeywords = ["z-score", "z =", "probability", "normalcdf", "table"];

    const mentionsDiff = containsAny(answer, diffPropKeywords);
    const mentionsFormula = containsAny(answer, formulaKeywords);
    const mentionsCondition = containsAny(answer, conditionKeywords);
    const mentionsInterpret = containsAny(answer, interpretKeywords);
    const mentionsProb = containsAny(answer, probKeywords);

    const conceptMentioned = mentionsDiff || mentionsFormula || mentionsCondition || mentionsInterpret || mentionsProb;
    const categoryCount = [mentionsDiff, mentionsFormula, mentionsCondition, mentionsInterpret, mentionsProb].filter(Boolean).length;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if ((categoryCount >= 2 && hasSubstance) || (conceptMentioned && hasReasoning && hasSubstance)) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly demonstrated understanding of Topic 5.6 concepts."
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
      feedback: "Your explanation should reference the specific Topic 5.6 concept (p̂₁−p̂₂ parameters, four Large Counts conditions, interpretation, or probability calculation) and explain your reasoning."
    };
  }

  // ========== LEVEL 31: Sample Mean Mu (meanMu) ==========
  if (fieldId === "meanMu") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student used 1 - μ (nonsensical but possible confusion with proportions)
    if (context.mu && Math.abs(studentVal - (1 - parseFloat(context.mu))) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `Did you confuse this with a proportion problem? For sample means, μ_x̄ = μ = ${expectedVal}. There is no (1 − μ) formula for means.`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! μ_x̄ = μ = ${expectedVal}. The mean of the sampling distribution of x̄ equals the population mean.`
      };
    }
    if (diff <= 0.5) {
      return {
        score: "P",
        feedback: `Close! μ_x̄ = μ = ${expectedVal}. The mean equals the population mean exactly.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. μ_x̄ = μ = ${expectedVal}. The mean of the sampling distribution of x̄ always equals the population mean μ.`
    };
  }

  // ========== LEVEL 31: Sample Mean Sigma (meanSigma) ==========
  if (fieldId === "meanSigma") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const mu = parseFloat(context.mu);
    const sigma = parseFloat(context.sigma);
    const n = parseFloat(context.n);

    // Error 1: used σ instead of σ/√n (gave the population SD)
    if (Math.abs(studentVal - sigma) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `You gave the population standard deviation σ = ${sigma} instead of σ_x̄! Remember: σ_x̄ = σ/√n = ${sigma}/√${n} = ${expectedVal}. Averages are LESS variable than individual values.`
      };
    }

    // Error 2: forgot √ (divided by n instead of √n)
    const withoutSqrt = sigma / n;
    if (Math.abs(studentVal - withoutSqrt) < 0.1 && diff > tolerance) {
      return {
        score: "P",
        feedback: `Almost! You divided by n instead of √n. σ_x̄ = σ/√n = ${sigma}/√${n} = ${expectedVal}, not σ/n = ${Math.round(withoutSqrt * 1000) / 1000}.`
      };
    }

    // Error 3: gave variance instead of SD (σ²/n)
    const variance = (sigma * sigma) / n;
    if (Math.abs(studentVal - variance) < 0.1 && diff > tolerance) {
      return {
        score: "P",
        feedback: `You calculated the variance (σ²/n = ${Math.round(variance * 1000) / 1000}) instead of the standard deviation. Take the square root: σ_x̄ = √(σ²/n) = σ/√n = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! σ_x̄ = σ/√n = ${sigma}/√${n} = ${expectedVal}`
      };
    }
    if (diff <= 0.2) {
      return {
        score: "P",
        feedback: `Close! σ_x̄ = σ/√n = ${sigma}/√${n} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. σ_x̄ = σ/√n = ${sigma}/√${n} = ${expectedVal}. Divide the population standard deviation by the square root of the sample size.`
    };
  }

  // ========== LEVEL 32: Mean Shape Choice ==========
  if (fieldId === "meanShapeChoice") {
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

  // ========== LEVEL 32: Mean Shape Explain (Textarea) ==========
  if (fieldId === "meanShapeExplain") {
    const normalKeywords = ["normal", "approximately normal", "bell"];
    const populationKeywords = ["population", "pop"];
    const sampleSizeKeywords = ["sample size", "n =", "n=", "n ≥", "n >="];
    const cltKeywords = ["clt", "central limit", "theorem"];
    const thresholdKeywords = ["30", "≥ 30", ">= 30"];

    const mentionsNormal = containsAny(answer, normalKeywords);
    const mentionsPopulation = containsAny(answer, populationKeywords);
    const mentionsSampleSize = containsAny(answer, sampleSizeKeywords);
    const mentionsCLT = containsAny(answer, cltKeywords);
    const mentionsThreshold = containsAny(answer, thresholdKeywords);

    const hasSubstance = answer.trim().split(/\s+/).length >= 6;

    // E: mentions population shape + sample size/CLT context + substance
    if ((mentionsPopulation || mentionsCLT) && (mentionsSampleSize || mentionsThreshold || mentionsNormal) && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent! You correctly identified the conditions for normality of the sampling distribution of x̄."
      };
    }
    // P: mentions some relevant concepts
    if ((mentionsNormal || mentionsCLT || mentionsThreshold || mentionsSampleSize) && hasSubstance) {
      return {
        score: "P",
        feedback: "Good start! Make sure to address BOTH the population shape AND the sample size. If population is normal → any n. If non-normal → need n ≥ 30."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should reference the population shape and sample size. Two paths to normality: (1) population is normal → any n, or (2) population non-normal → CLT requires n ≥ 30."
    };
  }

  // ========== LEVEL 33: Mean Interpret Answer (Dropdown) ==========
  if (fieldId === "meanInterpretAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Your interpretation properly references all possible samples and uses appropriate language."
      };
    }
    // Check if the student picked a common wrong interpretation
    if (containsAny(answer, ["every sample", "exactly", "always", "guaranteed"])) {
      return {
        score: "I",
        feedback: "Incorrect. The mean/SD of the sampling distribution describes what happens ON AVERAGE across all possible samples — not what happens in every single sample. Individual samples will vary."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. When interpreting μ_x̄, reference 'all possible samples of size n.' When interpreting σ_x̄, use 'typically' or 'on average' to describe variation."
    };
  }

  // ========== LEVEL 34: Mean Z-Score ==========
  if (fieldId === "meanZScore") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check if student subtracted in wrong order (μ - x̄ instead of x̄ - μ)
    if (Math.abs(studentVal - (-expectedVal)) < 0.05 && diff > tolerance) {
      return {
        score: "I",
        feedback: `Check your subtraction order! z = (x̄ − μ) / σ_x̄ = (${context.xBar} − ${context.mu}) / ${context.meanSigma} = ${expectedVal}`
      };
    }

    // Check if student divided by σ instead of σ/√n
    if (context.sigma && context.mu && context.xBar) {
      const wrongDivisor = (parseFloat(context.xBar) - parseFloat(context.mu)) / parseFloat(context.sigma);
      if (Math.abs(studentVal - wrongDivisor) < 0.1 && diff > tolerance) {
        return {
          score: "I",
          feedback: `You divided by σ instead of σ_x̄! z = (x̄ − μ) / σ_x̄ where σ_x̄ = σ/√n = ${context.meanSigma}, not σ = ${context.sigma}. z = ${expectedVal}`
        };
      }
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! z = (x̄ − μ) / σ_x̄ = (${context.xBar} − ${context.mu}) / ${context.meanSigma} = ${expectedVal}`
      };
    }
    if (diff <= 0.10) {
      return {
        score: "P",
        feedback: `Close! z = (x̄ − μ) / σ_x̄ = (${context.xBar} − ${context.mu}) / ${context.meanSigma} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. z = (x̄ − μ) / σ_x̄ = (${context.xBar} − ${context.mu}) / ${context.meanSigma} = ${expectedVal}`
    };
  }

  // ========== LEVEL 34: Mean Probability ==========
  if (fieldId === "meanProb") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check complement error
    if (Math.abs(studentVal - (1 - expectedVal)) < 0.005) {
      const directionHint = context.direction === "GREATER THAN"
        ? "1 − P(Z < z)"
        : "P(Z < z) directly";
      return {
        score: "I",
        feedback: `You found the complement! For P(x̄ ${context.direction} ${context.xBar}), you need ${directionHint}.`
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
        feedback: `Close! Check your z-table lookup. P = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The probability is ${expectedVal}. Use z = (x̄ − μ) / σ_x̄ to find the z-score, then use the z-table.`
    };
  }

  // ========== LEVEL 35: 5.7 Capstone Answer (Dropdown) ==========
  if (fieldId === "capstone57Answer") {
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

  // ========== LEVEL 35: 5.7 Capstone Explain (Textarea) ==========
  if (fieldId === "capstone57Explain") {
    const meanKeywords = ["x̄", "x-bar", "xbar", "sample mean", "mean"];
    const formulaKeywords = ["σ_x̄", "σ/√n", "sigma/sqrt", "standard deviation", "σ"];
    const cltKeywords = ["clt", "central limit", "theorem", "n ≥ 30", "n >= 30"];
    const interpretKeywords = ["all possible samples", "on average", "typically", "unbiased", "varies"];
    const probKeywords = ["z-score", "z =", "probability", "normalcdf", "table"];

    const mentionsMean = containsAny(answer, meanKeywords);
    const mentionsFormula = containsAny(answer, formulaKeywords);
    const mentionsCLT = containsAny(answer, cltKeywords);
    const mentionsInterpret = containsAny(answer, interpretKeywords);
    const mentionsProb = containsAny(answer, probKeywords);

    const conceptMentioned = mentionsMean || mentionsFormula || mentionsCLT || mentionsInterpret || mentionsProb;
    const categoryCount = [mentionsMean, mentionsFormula, mentionsCLT, mentionsInterpret, mentionsProb].filter(Boolean).length;
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if ((categoryCount >= 2 && hasSubstance) || (conceptMentioned && hasReasoning && hasSubstance)) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly demonstrated understanding of Topic 5.7 concepts."
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
      feedback: "Your explanation should reference the specific Topic 5.7 concept (x̄ distribution parameters, shape conditions, interpretation, or probability calculation) and explain your reasoning."
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
