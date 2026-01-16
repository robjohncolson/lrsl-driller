// grading-rules.js - TEMPLATE CARTRIDGE
// Replace this with your lesson-specific grading logic.
//
// INSTRUCTIONS:
// 1. Handle every fieldId from your manifest's input fields
// 2. Always check for blank answers first
// 3. Return { score: 'E'|'P'|'I', feedback: string } for every case
// 4. Use containsAny() for keyword-based grading of open responses
// 5. Be lenient for 'E' - students shouldn't need perfection

// ============ UTILITY FUNCTIONS ============

/**
 * Normalize a string for comparison (lowercase, trimmed)
 */
function normalize(str) {
  return String(str).trim().toLowerCase();
}

/**
 * Check if answer is blank/empty
 */
function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

/**
 * Check if answer contains any of the keywords (case-insensitive)
 */
function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some(k => norm.includes(normalize(k)));
}

/**
 * Get expected value from context (handles multiple formats)
 */
function getExpectedObj(context, fieldId) {
  // Try direct context access
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;

  // Try answers object
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;

  // Fallback for simple values
  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

// ============ MAIN GRADING FUNCTION ============

/**
 * Grade a student's answer for a specific field.
 *
 * @param {string} fieldId - The input field ID from manifest
 * @param {string} answer - The student's answer
 * @param {object} context - Context from generator (includes expected answers)
 * @returns {object} { score: 'E'|'P'|'I', feedback: string }
 */
export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  // ===== BLANK ANSWER HANDLING =====
  // Open-response fields should prompt for explanation
  const openResponseFields = new Set([
    "explanation",
    "capstoneExplain",
    "textAnswer"
    // Add other open-response field IDs here
  ]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter an explanation." };
    }
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  // ========== LEVEL 1: Choice Answer ==========
  if (fieldId === "choiceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! You identified the concept correctly."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is ${expected}. [Add explanation of why]`
    };
  }

  // ========== LEVEL 2: Dropdown Answer ==========
  if (fieldId === "dropdownAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct! Good job identifying the right answer."
      };
    }
    // Check for common partial-credit scenarios
    // (e.g., if student picks a related but not quite right answer)
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is ${expected}. Remember that [key distinction].`
    };
  }

  // ========== LEVEL 3: Numeric Answer ==========
  if (fieldId === "numericAnswer") {
    const studentVal = parseFloat(answer);
    if (isNaN(studentVal)) {
      return {
        score: "I",
        feedback: "Please enter a valid number."
      };
    }

    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.01;
    const diff = Math.abs(studentVal - expectedVal);

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: "Correct!"
      };
    }
    if (diff <= tolerance * 5) {
      return {
        score: "P",
        feedback: "Close! Check your calculation or rounding."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is ${expectedVal}. Review the formula/method.`
    };
  }

  // ========== LEVEL 4: Text Answer ==========
  if (fieldId === "textAnswer") {
    // For exact/near-exact matches
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct!"
      };
    }

    // Check for keyword matches (customize these)
    const keywords = context.expectedKeywords || [];
    const matchCount = keywords.filter(k => containsAny(answer, [k])).length;
    const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;

    if (matchRatio >= 0.8) {
      return {
        score: "E",
        feedback: "Correct! Your answer includes all key elements."
      };
    }
    if (matchRatio >= 0.5) {
      return {
        score: "P",
        feedback: "Partially correct. Your answer is missing some key elements."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Expected format: ${expected || "Review the hint for guidance."}`
    };
  }

  // ========== LEVEL 5: Choice + Explanation ==========
  if (fieldId === "conceptChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct choice! Now explain your reasoning."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The answer is ${expected}. Consider [key factor].`
    };
  }

  if (fieldId === "explanation") {
    // Keyword-based grading for explanations
    const keywords = context.keywords || [];
    const mentionsKey = containsAny(answer, keywords);
    const mentionsReasoning = containsAny(answer, [
      "because", "since", "therefore", "due to", "as a result"
    ]);

    // Check for common misconceptions
    const mentionsMisconception = containsAny(answer, [
      // Add common wrong answers/misconceptions here
    ]);

    if (mentionsMisconception) {
      return {
        score: "I",
        feedback: "That's a common misconception. Actually, [correct explanation]."
      };
    }

    if (mentionsKey && mentionsReasoning) {
      return {
        score: "E",
        feedback: "Excellent explanation! You clearly understand the concept."
      };
    }
    if (mentionsKey || mentionsReasoning) {
      return {
        score: "P",
        feedback: "Good start! Be more specific about [missing element]."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should mention [key concepts]. Use the sentence frame from the hint."
    };
  }

  // ========== LEVEL 6: Capstone ==========
  if (fieldId === "capstoneChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct identification!"
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. This is ${expected}. Look for [distinguishing feature].`
    };
  }

  if (fieldId === "capstoneCalc") {
    const studentVal = parseFloat(answer);
    if (isNaN(studentVal)) {
      return {
        score: "I",
        feedback: "Please enter a valid number."
      };
    }

    const expectedVal = expected;
    const diff = Math.abs(studentVal - expectedVal);

    if (diff <= 0.1) {
      return { score: "E", feedback: "Correct calculation!" };
    }
    if (diff <= 1) {
      return { score: "P", feedback: "Close! Check your arithmetic." };
    }
    return {
      score: "I",
      feedback: `Incorrect. The answer is ${expectedVal}. Review the calculation method.`
    };
  }

  if (fieldId === "capstoneExplain") {
    // Similar keyword-based approach
    const hasSubstance = answer.trim().split(/\s+/).length >= 10; // At least 10 words
    const mentionsConnection = containsAny(answer, [
      // Add key connecting concepts
      "connects", "relates", "shows", "demonstrates", "indicates"
    ]);

    if (hasSubstance && mentionsConnection) {
      return {
        score: "E",
        feedback: "Excellent integration of concepts!"
      };
    }
    if (hasSubstance || mentionsConnection) {
      return {
        score: "P",
        feedback: "Good effort! Explain the connection between the concept and calculation more clearly."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should connect the identified concept to your calculation."
    };
  }

  // ========== GENERIC FALLBACK ==========
  // This handles any field not explicitly covered above
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct!" };
  }
  return {
    score: "I",
    feedback: `Incorrect. Expected: ${expected}`
  };
}

/**
 * Get grading rule for a field (optional, for rule-based grading)
 * Return null if using the gradeField function directly.
 */
export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
