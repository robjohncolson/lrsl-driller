// grading-rules.js - AP Statistics Unit 4 Lessons 1-8
// Topics: Random processes, outcomes, events, simulation, Law of Large Numbers, sample space, probability rules, complements, mutually exclusive events, conditional probability, independent events, unions, random variables, probability distributions, mean, standard deviation

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
    "designDigits",
    "designTrial",
    "capExplain",
    "mixedExplain",
    "capstone44Explain",
    "capstone46Explain"
  ]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter your response." };
    }
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  // ========== LEVEL 1: Vocabulary Answer (Dropdown) ==========
  if (fieldId === "vocabAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand the definition of a random process."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Remember: a random process has KNOWN outcomes but UNPREDICTABLE individual results.`
    };
  }

  // ========== LEVEL 2: Outcome vs Event ==========
  if (fieldId === "termType") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: expected === "Outcome"
          ? "Correct! An outcome is the result of a single trial."
          : "Correct! An event is a collection of outcomes."
      };
    }
    return {
      score: "I",
      feedback: expected === "Outcome"
        ? "Incorrect. This describes a single result (outcome), not a collection."
        : "Incorrect. This describes multiple outcomes grouped together (event)."
    };
  }

  // ========== LEVEL 3: Independence / Gambler's Fallacy ==========
  if (fieldId === "independenceAnswer") {
    if (studentNorm === expectedNorm) {
      if (expected.includes("flawed")) {
        return {
          score: "E",
          feedback: "Correct! This is the gambler's fallacy - past outcomes don't affect future probabilities."
        };
      } else {
        return {
          score: "E",
          feedback: "Correct! Each trial is independent with the same probability."
        };
      }
    }
    if (expected.includes("flawed")) {
      return {
        score: "I",
        feedback: "Incorrect. This is the gambler's fallacy! Past results don't change future probabilities. Each trial is independent."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. The reasoning is actually correct - each trial has the same probability regardless of past results."
    };
  }

  // ========== LEVEL 4: Streaks ==========
  if (fieldId === "streakAnswer") {
    if (studentNorm === expectedNorm) {
      if (expected.includes("normal")) {
        return {
          score: "E",
          feedback: "Correct! Streaks and clusters are a normal part of random variation."
        };
      } else {
        return {
          score: "E",
          feedback: "Correct! This pattern is unusual - humans tend to avoid streaks, but real random data has them."
        };
      }
    }
    if (expected.includes("normal")) {
      return {
        score: "I",
        feedback: "Incorrect. Streaks are NORMAL in random data! A streak of 8+ occurs about 32% of the time in 100 flips."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. This IS surprising - it's too regular for truly random data. Real randomness has streaks."
    };
  }

  // ========== LEVEL 5: Simulation Vocabulary ==========
  if (fieldId === "simVocabAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Simulation models random events to estimate probabilities."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Simulation is a way to MODEL random events so simulated outcomes match REAL-WORLD outcomes."
    };
  }

  // ========== LEVEL 6: Law of Large Numbers ==========
  if (fieldId === "llnAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! The Law of Large Numbers explains why more trials give better probability estimates."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. The Law of Large Numbers: as trials INCREASE, simulated probability gets CLOSER to true probability."
    };
  }

  // ========== LEVEL 7: Digit Assignment ==========
  if (fieldId === "digitLow") {
    const studentVal = parseFloat(answer);
    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }
    if (studentVal === 1) {
      return { score: "E", feedback: "Correct! Start at 1." };
    }
    return {
      score: "I",
      feedback: "The lower bound should be 1 (digits go from 1 to 100)."
    };
  }

  if (fieldId === "digitHigh") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }
    if (studentVal === expectedVal) {
      return {
        score: "E",
        feedback: `Correct! 1-${expectedVal} gives ${expectedVal}% probability.`
      };
    }
    if (Math.abs(studentVal - expectedVal) <= 2) {
      return {
        score: "P",
        feedback: `Close! The probability is ${context.probability}%, so use 1-${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. For ${context.probability}% probability, use 1-${expectedVal} (${expectedVal} out of 100).`
    };
  }

  // ========== LEVEL 8: Trial Definition ==========
  if (fieldId === "trialAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand what constitutes one complete trial."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. One trial should simulate the ENTIRE scenario once and record the result."
    };
  }

  // ========== LEVEL 9: Relative Frequency Calculation ==========
  if (fieldId === "probAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.5;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number (as a percent)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! ${context.successes}/${context.total} = ${expectedVal}%`
      };
    }
    if (diff <= 2) {
      return {
        score: "P",
        feedback: `Close! Check your calculation: ${context.successes}/${context.total} × 100 = ${expectedVal}%`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Calculate: ${context.successes} ÷ ${context.total} × 100 = ${expectedVal}%`
    };
  }

  // ========== LEVEL 10: Simulation Design (Open Response) ==========
  if (fieldId === "designDigits") {
    const probability = context.probability;

    // Check for key elements
    const hasRange = containsAny(answer, ["1-", "to", "through", "-" + probability, probability + " "]);
    const hasSuccess = containsAny(answer, ["success", "correct", "made", "hit", "blue", "heads", "win"]);
    const hasFailure = containsAny(answer, ["fail", "incorrect", "miss", "out", "red", "tails", "lose", "100"]);
    const mentionsProb = answer.includes(String(probability));

    if (mentionsProb && (hasSuccess || hasFailure)) {
      return {
        score: "E",
        feedback: `Correct! Using 1-${probability} for success matches the ${probability}% probability.`
      };
    }
    if (hasRange || mentionsProb) {
      return {
        score: "P",
        feedback: "Partial credit. Be specific: state which digits represent success and which represent failure."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Match digits to probability: use 1-${probability} for success, ${probability + 1}-100 for failure.`
    };
  }

  if (fieldId === "designTrial") {
    // Check for key elements
    const mentionsGenerate = containsAny(answer, ["generate", "random", "select", "pick", "number"]);
    const mentionsCount = containsAny(answer, ["count", "record", "track", "note", "tally"]);
    const mentionsStop = containsAny(answer, ["until", "when", "if", "check", "repeat", "times"]);

    const elementCount = [mentionsGenerate, mentionsCount, mentionsStop].filter(Boolean).length;

    if (elementCount >= 2) {
      return {
        score: "E",
        feedback: "Correct! Your trial definition includes the key components."
      };
    }
    if (elementCount === 1) {
      return {
        score: "P",
        feedback: "Partial credit. Include: what to generate, when to stop, and what to record."
      };
    }
    return {
      score: "I",
      feedback: "Describe: (1) what random numbers to generate, (2) when to stop, (3) what to record."
    };
  }

  // ========== LEVEL 11: Capstone ==========
  if (fieldId === "capConcept") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You identified the key concept."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The best answer is: ${expected}`
    };
  }

  if (fieldId === "capExplain") {
    const expectedExplanation = context.expectedExplanation || "";

    // Key vocabulary to look for based on the concept
    const independenceKeywords = ["independent", "past", "future", "affect", "probability", "gambler", "fallacy", "50%", "same"];
    const llnKeywords = ["large", "numbers", "trials", "increase", "closer", "true", "probability", "more"];
    const simulationKeywords = ["simulate", "model", "trial", "random", "estimate", "many"];
    const streakKeywords = ["streak", "normal", "common", "human", "avoid", "random", "cluster"];
    const randomKeywords = ["known", "outcome", "unpredictable", "individual", "possible"];

    // Check which concepts are mentioned
    const mentionsIndependence = containsAny(answer, independenceKeywords);
    const mentionsLLN = containsAny(answer, llnKeywords);
    const mentionsSimulation = containsAny(answer, simulationKeywords);
    const mentionsStreak = containsAny(answer, streakKeywords);
    const mentionsRandom = containsAny(answer, randomKeywords);

    // Check for reasoning indicators
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "explain"]);

    // Count relevant keywords
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    if ((mentionsIndependence || mentionsLLN || mentionsSimulation || mentionsStreak || mentionsRandom) && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly understand the concept."
      };
    }
    if (hasSubstance && (mentionsIndependence || mentionsLLN || mentionsSimulation || mentionsStreak || mentionsRandom)) {
      return {
        score: "P",
        feedback: "Good start! Add more specific reasoning about WHY this concept applies."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should mention key vocabulary and explain WHY the concept applies to this scenario."
    };
  }

  // ========== LEVEL 12: Sample Space Identification ==========
  if (fieldId === "sampleSpaceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.explanation || "The sample space includes all possible outcomes."}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation || "The sample space is the set of ALL possible outcomes."}`
    };
  }

  // ========== LEVEL 13: Valid Probability Model ==========
  if (fieldId === "validProbChoice") {
    const isCorrect = studentNorm === expectedNorm;
    if (isCorrect) {
      return {
        score: "E",
        feedback: context.isValid
          ? "Correct! This is a valid probability model."
          : "Correct! This is NOT a valid probability model."
      };
    }
    return {
      score: "I",
      feedback: context.isValid
        ? "Incorrect. Check: (1) Each probability is 0-1, (2) All probabilities sum to 1."
        : `Incorrect. This model is invalid because: ${context.reason}`
    };
  }

  if (fieldId === "validProbReason") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You identified the right reason."
      };
    }
    // Partial credit if they got the main choice right but wrong reason
    return {
      score: "I",
      feedback: `Incorrect. The reason is: ${expected}`
    };
  }

  // ========== LEVEL 14: Complement Rule ==========
  if (fieldId === "complementAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.65)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= 0.005) {
      return {
        score: "E",
        feedback: `Correct! P(${context.complementEvent}) = 1 - ${context.givenProb} = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! Check your calculation: 1 - ${context.givenProb} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use the complement rule: P(not A) = 1 - P(A) = 1 - ${context.givenProb} = ${expectedVal}`
    };
  }

  // ========== LEVEL 15: At Least One ==========
  if (fieldId === "atLeastOneAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.784)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(at least one) = 1 - P(none) = 1 - ${context.pNone} = ${expectedVal.toFixed(3)}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! P(at least one) = 1 - P(none). Check: 1 - ${context.pNone} = ${expectedVal.toFixed(3)}`
      };
    }
    // Check if student might have added instead of using complement
    if (studentVal > 1) {
      return {
        score: "I",
        feedback: "Probability cannot exceed 1. Use the complement: P(at least 1) = 1 - P(none)."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use the complement approach: P(at least 1) = 1 - P(none) = 1 - ${context.pNone} = ${expectedVal.toFixed(3)}`
    };
  }

  // ========== LEVEL 16: Mixed 4.3 Practice ==========
  if (fieldId === "mixedAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.explanation || ""}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation || `The correct answer is: ${expected}`}`
    };
  }

  if (fieldId === "mixedExplain") {
    // Key vocabulary for different probability concepts
    const sampleSpaceKeywords = ["sample space", "all outcomes", "possible outcomes", "total outcomes", "set of"];
    const complementKeywords = ["complement", "1 -", "1-", "not", "opposite", "subtract from 1"];
    const atLeastOneKeywords = ["at least", "none", "1 - p(none)", "complement"];
    const validModelKeywords = ["sum to 1", "between 0 and 1", "add up", "total 1", "probabilities must"];
    const formulaKeywords = ["favorable", "total", "divided", "/", "fraction"];

    // Check for reasoning quality
    const mentionsSampleSpace = containsAny(answer, sampleSpaceKeywords);
    const mentionsComplement = containsAny(answer, complementKeywords);
    const mentionsAtLeastOne = containsAny(answer, atLeastOneKeywords);
    const mentionsValidModel = containsAny(answer, validModelKeywords);
    const mentionsFormula = containsAny(answer, formulaKeywords);
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    const conceptMentioned = mentionsSampleSpace || mentionsComplement || mentionsAtLeastOne || mentionsValidModel || mentionsFormula;

    if (conceptMentioned && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly applied the correct probability concept."
      };
    }
    if (hasSubstance && conceptMentioned) {
      return {
        score: "P",
        feedback: "Good start! Explain more specifically WHY this rule applies and show your reasoning."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should mention the specific probability rule used and explain your reasoning."
    };
  }

  // ========== LEVEL 17: Mutually Exclusive Definition ==========
  if (fieldId === "meDefAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand mutually exclusive (disjoint) events."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Mutually exclusive means the events CANNOT occur at the same time. P(A ∩ B) = 0."
    };
  }

  // ========== LEVEL 18: Joint Probability Calculation ==========
  if (fieldId === "jointProbAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.225)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(${context.eventA} ∩ ${context.eventB}) = ${context.intersection}/${context.total} = ${expectedVal.toFixed(3)}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! Remember: P(A ∩ B) = (intersection) / (GRAND total). ${context.intersection}/${context.total} = ${expectedVal.toFixed(3)}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. P(A ∩ B) = ${context.intersection} / ${context.total} = ${expectedVal.toFixed(3)}. Use the GRAND total!`
    };
  }

  // ========== LEVEL 19: Identifying Mutually Exclusive Events ==========
  if (fieldId === "identifyMEAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: context.isME
          ? "Correct! P(A ∩ B) = 0, so these events ARE mutually exclusive."
          : "Correct! P(A ∩ B) > 0, so these events are NOT mutually exclusive."
      };
    }
    return {
      score: "I",
      feedback: context.isME
        ? `Incorrect. Since P(A ∩ B) = 0, these events ARE mutually exclusive.`
        : `Incorrect. Since P(A ∩ B) = ${context.intersection} > 0, they CAN occur together, so NOT mutually exclusive.`
    };
  }

  // ========== LEVEL 20: Conditional Probability Definition ==========
  if (fieldId === "condDefAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand conditional probability notation."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. P(B|A) means 'probability of B GIVEN A'. The formula is P(A ∩ B) / P(A)."
    };
  }

  // ========== LEVEL 21: Conditional Probability from Tables ==========
  if (fieldId === "condTableAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.45)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(${context.target}|${context.condition}) = ${context.numerator}/${context.denominator} = ${expectedVal.toFixed(3)}`
      };
    }
    if (diff <= 0.03) {
      return {
        score: "P",
        feedback: `Close! Use the total for ${context.condition} as denominator: ${context.numerator}/${context.denominator} = ${expectedVal.toFixed(3)}`
      };
    }
    // Check if they used grand total instead
    if (context.total && Math.abs(studentVal - context.numerator / context.total) < 0.01) {
      return {
        score: "I",
        feedback: `You used the grand total instead! For conditional probability, use the row/column total: ${context.numerator}/${context.denominator}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. P(${context.target}|${context.condition}) = ${context.numerator}/${context.denominator} = ${expectedVal.toFixed(3)}`
    };
  }

  // ========== LEVEL 22: General Multiplication Rule ==========
  if (fieldId === "multRuleAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.133)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(A ∩ B) = P(A) × P(B|A) = ${context.pA} × ${context.pBgivenA} ≈ ${expectedVal.toFixed(3)}`
      };
    }
    if (diff <= 0.03) {
      return {
        score: "P",
        feedback: `Close! ${context.explanation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation}`
    };
  }

  // ========== LEVEL 23: Order Matters P(A|B) vs P(B|A) ==========
  if (fieldId === "orderAgivenB") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.45)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(${context.eventB}|${context.eventA}) = ${context.n_AandB}/${context.n_A} = ${expectedVal.toFixed(3)}`
      };
    }
    // Check if they calculated the other direction
    if (context.pBgivenA && Math.abs(studentVal - context.pBgivenA) <= tolerance) {
      return {
        score: "I",
        feedback: `That's P(${context.eventA}|${context.eventB}), not P(${context.eventB}|${context.eventA}). Divide by ${context.n_A}, not ${context.n_B}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. P(${context.eventB}|${context.eventA}) = ${context.n_AandB}/${context.n_A} = ${expectedVal.toFixed(3)}`
    };
  }

  if (fieldId === "orderBgivenA") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.43)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(${context.eventA}|${context.eventB}) = ${context.n_AandB}/${context.n_B} = ${expectedVal.toFixed(3)}`
      };
    }
    // Check if they calculated the other direction
    if (context.pAgivenB && Math.abs(studentVal - context.pAgivenB) <= tolerance) {
      return {
        score: "I",
        feedback: `That's P(${context.eventB}|${context.eventA}), not P(${context.eventA}|${context.eventB}). Divide by ${context.n_B}, not ${context.n_A}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. P(${context.eventA}|${context.eventB}) = ${context.n_AandB}/${context.n_B} = ${expectedVal.toFixed(3)}`
    };
  }

  // ========== LEVEL 24: Mixed 4.4-4.5 Capstone ==========
  if (fieldId === "capstone44Answer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.explanation || ""}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation || `The correct answer is: ${expected}`}`
    };
  }

  if (fieldId === "capstone44Explain") {
    // Key vocabulary for Topics 4.4-4.5
    const meKeywords = ["mutually exclusive", "disjoint", "cannot occur", "together", "intersection", "p(a ∩ b) = 0"];
    const jointKeywords = ["joint", "both", "intersection", "grand total", "a ∩ b", "and"];
    const conditionalKeywords = ["conditional", "given", "p(b|a)", "row total", "column total", "|"];
    const multRuleKeywords = ["multiplication", "p(a) × p(b|a)", "times", "multiply", "rule"];
    const orderKeywords = ["order", "not equal", "different", "p(a|b)", "p(b|a)", "denominator"];

    // Check for reasoning quality
    const mentionsME = containsAny(answer, meKeywords);
    const mentionsJoint = containsAny(answer, jointKeywords);
    const mentionsConditional = containsAny(answer, conditionalKeywords);
    const mentionsMultRule = containsAny(answer, multRuleKeywords);
    const mentionsOrder = containsAny(answer, orderKeywords);
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using", "since"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    const conceptMentioned = mentionsME || mentionsJoint || mentionsConditional || mentionsMultRule || mentionsOrder;

    if (conceptMentioned && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly understand the probability concept."
      };
    }
    if (hasSubstance && conceptMentioned) {
      return {
        score: "P",
        feedback: "Good start! Be more specific about WHY this concept applies to the scenario."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should mention the specific concept (ME, joint, conditional, multiplication rule) and explain why it applies."
    };
  }

  // ========== LEVEL 25: Independent Events Definition ==========
  if (fieldId === "indepDefAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand the definition of independent events."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Independent events: knowing one occurred doesn't change the other's probability. P(A|B) = P(A) or P(A ∩ B) = P(A) × P(B)."
    };
  }

  // ========== LEVEL 26: Check Independence - Conditional Method ==========
  if (fieldId === "checkIndepCondAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: context.isIndep
          ? "Correct! P(A|B) = P(A), so knowing B doesn't change A's probability - they are independent."
          : "Correct! P(A|B) ≠ P(A), so knowing B changes A's probability - they are NOT independent."
      };
    }
    return {
      score: "I",
      feedback: context.isIndep
        ? `Incorrect. P(A|B) = ${context.pAgivenB} equals P(A) = ${context.pA}, so they ARE independent.`
        : `Incorrect. P(A|B) = ${context.pAgivenB} ≠ ${context.pA} = P(A), so they are NOT independent.`
    };
  }

  // ========== LEVEL 27: Check Independence - Multiplication Method ==========
  if (fieldId === "pAB_calc") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.24)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(A) × P(B) = ${context.pA} × ${context.pB} = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! P(A) × P(B) = ${context.pA} × ${context.pB} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. P(A) × P(B) = ${context.pA} × ${context.pB} = ${expectedVal}`
    };
  }

  if (fieldId === "checkIndepMultAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: context.isIndep
          ? `Correct! P(A) × P(B) = ${context.pA_times_pB} equals P(A ∩ B) = ${context.pAB}, so they ARE independent.`
          : `Correct! P(A) × P(B) = ${context.pA_times_pB} ≠ P(A ∩ B) = ${context.pAB}, so they are NOT independent.`
      };
    }
    return {
      score: "I",
      feedback: context.isIndep
        ? `Incorrect. P(A) × P(B) = ${context.pA_times_pB} equals P(A ∩ B) = ${context.pAB}. Equal, so they ARE independent.`
        : `Incorrect. P(A) × P(B) = ${context.pA_times_pB} ≠ P(A ∩ B) = ${context.pAB}. Not equal, so NOT independent.`
    };
  }

  // ========== LEVEL 28: Multiplication Rule for Independent Events ==========
  if (fieldId === "multIndepAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.005;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.12)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! P(A and B) = ${context.pA} × ${context.pB} = ${expectedVal}`
      };
    }
    if (diff <= 0.02) {
      return {
        score: "P",
        feedback: `Close! For independent events: P(A and B) = P(A) × P(B) = ${context.pA} × ${context.pB} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. For independent events: P(A and B) = P(A) × P(B) = ${context.pA} × ${context.pB} = ${expectedVal}`
    };
  }

  // ========== LEVEL 29: Addition Rule Definition ==========
  if (fieldId === "addRuleDefAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand the Addition Rule for unions."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Addition Rule: P(A or B) = P(A) + P(B) - P(A ∩ B). Subtract intersection to avoid double counting!"
    };
  }

  // ========== LEVEL 30: Calculate Union ==========
  if (fieldId === "unionAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.75)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      if (context.isME) {
        return {
          score: "E",
          feedback: `Correct! For ME events: P(A ∪ B) = P(A) + P(B) = ${context.pA} + ${context.pB} = ${expectedVal}`
        };
      }
      return {
        score: "E",
        feedback: `Correct! P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = ${context.pA} + ${context.pB} - ${context.pAB} = ${expectedVal}`
      };
    }
    if (diff <= 0.03) {
      return {
        score: "P",
        feedback: `Close! ${context.explanation}`
      };
    }
    // Check if student just added without subtracting
    if (!context.isME && Math.abs(studentVal - (context.pA + context.pB)) < 0.01) {
      return {
        score: "I",
        feedback: "You forgot to subtract P(A ∩ B)! P(A or B) = P(A) + P(B) - P(A ∩ B) to avoid double counting."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation}`
    };
  }

  // ========== LEVEL 31: Independent vs Mutually Exclusive ==========
  if (fieldId === "indepVsMeAnswer") {
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

  // ========== LEVEL 32: Mixed 4.6 Capstone ==========
  if (fieldId === "capstone46Answer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.explanation || ""}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation || `The correct answer is: ${expected}`}`
    };
  }

  if (fieldId === "capstone46Explain") {
    // Key vocabulary for Topic 4.6
    const indepKeywords = ["independent", "p(a|b) = p(a)", "doesn't change", "doesn't affect", "same probability"];
    const multIndepKeywords = ["p(a) × p(b)", "multiply", "p(a ∩ b) = p(a)×p(b)", "product"];
    const additionKeywords = ["addition", "union", "p(a or b)", "p(a ∪ b)", "subtract", "double count"];
    const meKeywords = ["mutually exclusive", "disjoint", "cannot occur together", "p(a ∩ b) = 0"];
    const distinctionKeywords = ["not the same", "different", "can occur together", "cannot occur together", "≠"];

    // Check for reasoning quality
    const mentionsIndep = containsAny(answer, indepKeywords);
    const mentionsMultIndep = containsAny(answer, multIndepKeywords);
    const mentionsAddition = containsAny(answer, additionKeywords);
    const mentionsME = containsAny(answer, meKeywords);
    const mentionsDistinction = containsAny(answer, distinctionKeywords);
    const hasReasoning = containsAny(answer, ["because", "since", "therefore", "so", "means", "shows", "using"]);
    const hasSubstance = answer.trim().split(/\s+/).length >= 8;

    const conceptMentioned = mentionsIndep || mentionsMultIndep || mentionsAddition || mentionsME || mentionsDistinction;

    if (conceptMentioned && hasReasoning && hasSubstance) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly understand independence and union concepts."
      };
    }
    if (hasSubstance && conceptMentioned) {
      return {
        score: "P",
        feedback: "Good start! Be more specific about WHY this concept applies and show your reasoning."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should mention key concepts (independent, multiplication rule, addition rule, ME distinction) and explain why they apply."
    };
  }

  // ========== LEVEL 33: Random Variable Definition ==========
  if (fieldId === "rvDefAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You understand what a random variable is."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. A random variable assigns a NUMERICAL value to outcomes of random behavior. It must be defined with a capital letter (X, Y, etc.)."
    };
  }

  // ========== LEVEL 34: Discrete vs Continuous ==========
  if (fieldId === "discContAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: expected === "Discrete"
          ? "Correct! Discrete random variables have countable values with gaps between them (like counts: 0, 1, 2, 3...)."
          : "Correct! Continuous random variables can take ANY value in an interval (like measurements)."
      };
    }
    return {
      score: "I",
      feedback: expected === "Discrete"
        ? "Incorrect. This is DISCRETE - you can count the possible values and there are gaps between them."
        : "Incorrect. This is CONTINUOUS - it can take any value in an interval (infinite precision possible)."
    };
  }

  // ========== LEVEL 35: Valid Probability Distribution ==========
  if (fieldId === "validDistAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: context.isValid
          ? "Correct! All probabilities are between 0 and 1, and they sum to exactly 1."
          : `Correct! ${context.reason}`
      };
    }
    return {
      score: "I",
      feedback: context.isValid
        ? "Incorrect. This IS a valid distribution - check that each P(X) is 0-1 and the sum equals 1."
        : `Incorrect. This is NOT valid: ${context.reason}`
    };
  }

  // ========== LEVEL 36: Probability from Distribution ==========
  if (fieldId === "probDistAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a decimal number (e.g., 0.53)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! ${context.explanation}`
      };
    }
    if (diff <= 0.05) {
      return {
        score: "P",
        feedback: `Close! ${context.explanation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.explanation}`
    };
  }

  // ========== LEVEL 37: Describe Distribution (Shape) ==========
  if (fieldId === "shapeAnswer") {
    // Normalize both answers for comparison
    const studentShapeNorm = studentNorm.replace(/[\s\-()]/g, '');
    const expectedShapeNorm = expectedNorm.replace(/[\s\-()]/g, '');

    if (studentShapeNorm === expectedShapeNorm ||
        (studentNorm.includes("skewed") && expectedNorm.includes("skewed") &&
         studentNorm.includes(expectedNorm.includes("right") ? "right" : "left"))) {
      return {
        score: "E",
        feedback: `Correct! ${context.shapeExplanation}`
      };
    }
    // Check for partial credit on symmetric vs skewed
    if ((studentNorm.includes("symmetric") && expectedNorm.includes("symmetric")) ||
        (studentNorm.includes("skewed") && expectedNorm.includes("skewed"))) {
      return {
        score: "P",
        feedback: `You correctly identified it as ${studentNorm.includes("symmetric") ? "symmetric" : "skewed"}, but the specific shape is: ${expected}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The shape is ${expected}. ${context.shapeExplanation}`
    };
  }

  // ========== LEVEL 38: Mean (Expected Value) ==========
  if (fieldId === "meanAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number (e.g., 2.66)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! μ = ${expectedVal}. ${context.interpretation}`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! μ = Σ[x·P(x)] = ${expectedVal}. ${context.interpretation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. μ = Σ[x·P(x)] = ${expectedVal}. Multiply each x by its probability, then add all products.`
    };
  }

  // ========== LEVEL 39: Standard Deviation ==========
  if (fieldId === "stdDevAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number (e.g., 1.27)." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! σ = ${expectedVal}. ${context.interpretation}`
      };
    }
    if (diff <= tolerance * 3) {
      return {
        score: "P",
        feedback: `Close! σ = √[Σ(x-μ)²·P(x)] = ${expectedVal}. ${context.interpretation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. σ = √[Σ(x-μ)²·P(x)] = ${expectedVal}. Find deviations from μ, square them, multiply by P(x), sum, then take square root.`
    };
  }

  // ========== LEVEL 40: Interpret Parameters ==========
  if (fieldId === "interpretAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.concept === "Mean interpretation" ? "You understand how to interpret expected value in context." : "You understand how to interpret parameters."}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct interpretation is: ${expected}`
    };
  }

  // ========== LEVEL 41: Linear Transform - Mean ==========
  if (fieldId === "transformMeanAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! μY = ${context.a} + ${context.b}(${context.muX}) = ${expectedVal}`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! μY = a + b·μX = ${context.a} + ${context.b}(${context.muX}) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. For Y = a + bX: μY = a + b·μX = ${context.a} + ${context.b}(${context.muX}) = ${expectedVal}`
    };
  }

  // ========== LEVEL 42: Linear Transform - SD ==========
  if (fieldId === "transformSDAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    // Check for the common trap: including the constant
    const trapAnswer = Math.abs(context.a) + Math.abs(context.b) * context.sigmaX;
    if (Math.abs(studentVal - trapAnswer) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `TRAP! The constant '${context.a}' doesn't affect spread! σY = |b|·σX = |${context.b}|(${context.sigmaX}) = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! σY = |${context.b}|(${context.sigmaX}) = ${expectedVal}. The constant doesn't affect spread!`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! σY = |b|·σX = |${context.b}|(${context.sigmaX}) = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. σY = |b|·σX = |${context.b}|(${context.sigmaX}) = ${expectedVal}. Remember: constant 'a' doesn't affect spread!`
    };
  }

  // ========== LEVEL 43: Sum of Means ==========
  if (fieldId === "sumMeansAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! μ(X+Y) = ${context.muX} + ${context.muY} = ${expectedVal}`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! μ(X+Y) = μX + μY = ${context.muX} + ${context.muY} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. μ(X+Y) = μX + μY = ${context.muX} + ${context.muY} = ${expectedVal}`
    };
  }

  // ========== LEVEL 44: Difference of Means ==========
  if (fieldId === "diffMeansAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! μ(X-Y) = ${context.muX} - ${context.muY} = ${expectedVal}`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! μ(X-Y) = μX - μY = ${context.muX} - ${context.muY} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. μ(X-Y) = μX - μY = ${context.muX} - ${context.muY} = ${expectedVal}`
    };
  }

  // ========== LEVEL 45: Combined SD - Sum (THE VARIANCE TRAP) ==========
  if (fieldId === "combinedSDSumAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const trapAnswer = context.sigmaX + context.sigmaY; // Adding SDs directly
    const varianceAnswer = context.varX + context.varY; // Forgot square root

    // Check for THE TRAP: adding SDs directly
    if (Math.abs(studentVal - trapAnswer) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `⚠️ VARIANCE TRAP! You added SDs directly (${context.sigmaX} + ${context.sigmaY} = ${trapAnswer}). You must add VARIANCES first, then take the square root: σ(X+Y) = √(${context.varX} + ${context.varY}) = ${expectedVal}`
      };
    }

    // Check if they got the variance but forgot square root
    if (Math.abs(studentVal - varianceAnswer) < 0.1 && diff > tolerance) {
      return {
        score: "P",
        feedback: `Good! You added the variances correctly (${context.varX} + ${context.varY} = ${varianceAnswer}), but forgot to take the square root! σ(X+Y) = √${varianceAnswer} = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! σ(X+Y) = √(${context.sigmaX}² + ${context.sigmaY}²) = √(${context.varX} + ${context.varY}) = ${expectedVal}. You avoided the trap!`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! σ(X+Y) = √(σX² + σY²) = √(${context.varX} + ${context.varY}) ≈ ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. σ(X+Y) = √(σX² + σY²) = √(${context.varX} + ${context.varY}) = ${expectedVal}. Remember: add VARIANCES, then square root!`
    };
  }

  // ========== LEVEL 46: Combined SD - Difference (THE TRAP CONTINUES) ==========
  if (fieldId === "combinedSDDiffAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const trapSubtract = Math.abs(context.sigmaX - context.sigmaY); // Subtracting SDs
    const trapAdd = context.sigmaX + context.sigmaY; // Adding SDs directly
    const varianceAnswer = context.varX + context.varY; // Forgot square root

    // Check for TRAP 1: subtracting SDs
    if (Math.abs(studentVal - trapSubtract) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `⚠️ VARIANCE TRAP! You subtracted SDs (|${context.sigmaX} - ${context.sigmaY}| = ${trapSubtract}). Even for X-Y, variances ADD! Subtracting uncertain quantities adds MORE uncertainty. σ(X-Y) = √(${context.varX} + ${context.varY}) = ${expectedVal}`
      };
    }

    // Check for TRAP 2: adding SDs directly
    if (Math.abs(studentVal - trapAdd) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `⚠️ VARIANCE TRAP! You added SDs directly. You must add VARIANCES, then square root: σ(X-Y) = √(${context.varX} + ${context.varY}) = ${expectedVal}`
      };
    }

    // Check if they got the variance but forgot square root
    if (Math.abs(studentVal - varianceAnswer) < 0.1 && diff > tolerance) {
      return {
        score: "P",
        feedback: `Good! You added variances correctly, but forgot the square root! σ(X-Y) = √${varianceAnswer} = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! σ(X-Y) = √(${context.sigmaX}² + ${context.sigmaY}²) = ${expectedVal}. You know that variances ALWAYS add, even for differences!`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! σ(X-Y) = √(σX² + σY²) = √(${context.varX} + ${context.varY}) ≈ ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. σ(X-Y) = √(σX² + σY²) = ${expectedVal}. Key insight: variances ADD even for X-Y!`
    };
  }

  // ========== LEVEL 47: Identify the Error ==========
  if (fieldId === "identifyErrorAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct! ${context.expectedExplanation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The error was: ${expected}. ${context.expectedExplanation}`
    };
  }

  // ========== LEVEL 48: Capstone 4.9 - Mean ==========
  if (fieldId === "capstoneMeanAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.1;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number for the mean." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! The combined mean is ${expectedVal}.`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! Check your calculation. Mean = ${context.muX} ± ${context.muY} = ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. For the mean: μ(X+Y) = ${context.muX} + ${context.muY} = ${expectedVal}, or μ(X-Y) = ${context.muX} - ${context.muY}`
    };
  }

  // ========== LEVEL 48: Capstone 4.9 - SD ==========
  if (fieldId === "capstoneSDAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.05;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a number for the standard deviation." };
    }

    const diff = Math.abs(studentVal - expectedVal);
    const varX = context.sigmaX * context.sigmaX;
    const varY = context.sigmaY * context.sigmaY;
    const trapAdd = context.sigmaX + context.sigmaY;
    const trapSubtract = Math.abs(context.sigmaX - context.sigmaY);

    // Check for THE TRAP
    if (Math.abs(studentVal - trapAdd) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `⚠️ VARIANCE TRAP! Don't add SDs directly. σ = √(${varX} + ${varY}) = ${expectedVal}`
      };
    }
    if (Math.abs(studentVal - trapSubtract) < 0.1 && diff > tolerance) {
      return {
        score: "I",
        feedback: `⚠️ VARIANCE TRAP! Variances ADD even for differences. σ = √(${varX} + ${varY}) = ${expectedVal}`
      };
    }

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct! σ = √(${context.sigmaX}² + ${context.sigmaY}²) = √(${varX} + ${varY}) ≈ ${expectedVal}. You avoided the trap!`
      };
    }
    if (diff <= tolerance * 2) {
      return {
        score: "P",
        feedback: `Close! σ = √(σX² + σY²) = √(${varX} + ${varY}) ≈ ${expectedVal}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. σ = √(σX² + σY²) = √(${varX} + ${varY}) ≈ ${expectedVal}. Add variances, then square root!`
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
