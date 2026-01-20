// grading-rules.js - AP Statistics Unit 4 Lessons 1-2
// Topics: Random processes, outcomes, events, simulation, Law of Large Numbers

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
    "capExplain"
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
