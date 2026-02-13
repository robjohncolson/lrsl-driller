// grading-rules.js — Lesson 3-3 Quiz Prep: Cubes & Binomial Expansion
// Cartridge: a2t3l3-quiz

// ============ UTILITY FUNCTIONS ============

function normalize(str) {
  return String(str ?? "").trim().toLowerCase();
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some(k => norm.includes(normalize(k)));
}

function normalizeMath(str) {
  return normalize(str)
    .replace(/\s+/g, "")
    .replace(/[(){}\[\]]/g, "")
    .replace(/[·×*]/g, "")
    .replace(/−/g, "-");
}

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;
  return { value: undefined, tolerance: 0 };
}

// ============ MAIN GRADING FUNCTION ============

export function gradeField(fieldId, answer, context) {
  const openResponseFields = new Set(["explanation"]);

  if (isBlank(answer)) {
    return {
      score: "I",
      feedback: openResponseFields.has(fieldId)
        ? "Please write a brief explanation."
        : "Please enter or select an answer."
    };
  }

  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  // ----- Level 1: identity type (choice) -----
  if (fieldId === "identityType") {
    if (normalize(answer) === normalize(expected)) {
      return { score: "E", feedback: "Correct! You identified the right cube identity." };
    }
    return {
      score: "I",
      feedback: "Not quite. Check the sign: + means Sum of Cubes, \u2212 means Difference of Cubes. Answer: " + expected + "."
    };
  }

  // ----- Level 2: a and b values (text) -----
  if (fieldId === "aValue" || fieldId === "bValue") {
    const student = normalizeMath(answer);
    const exp = normalizeMath(expected);

    if (student === exp) {
      const label = fieldId === "aValue" ? "a" : "b";
      return { score: "E", feedback: "Correct! " + label + " = " + expected };
    }

    // Check for swapped a/b
    const otherField = fieldId === "aValue" ? "bValue" : "aValue";
    const otherExpected = normalizeMath(getExpectedObj(context, otherField).value);
    if (student === otherExpected) {
      const wrongLabel = fieldId === "aValue" ? "b" : "a";
      return {
        score: "P",
        feedback: "That's the correct cube root, but it belongs to " + wrongLabel + ", not " +
          (fieldId === "aValue" ? "a" : "b") + "."
      };
    }

    return {
      score: "I",
      feedback: (fieldId === "aValue" ? "a" : "b") + " = " + expected +
        ". Find the cube root of the term."
    };
  }

  // ----- Level 3: factored form (token-based) -----
  if (fieldId === "factoredForm") {
    const student = normalizeMath(answer);

    const required = Array.isArray(context?.factorRequiredTokens) ? context.factorRequiredTokens : [];
    const forbidden = Array.isArray(context?.factorForbiddenTokens) ? context.factorForbiddenTokens : [];

    const reqNorm = required.map(normalizeMath);
    const forbNorm = forbidden.map(normalizeMath);

    const missing = reqNorm.filter(t => t && !student.includes(t));
    const hasForbidden = forbNorm.some(t => t && student.includes(t));

    if (!hasForbidden && missing.length === 0) {
      return { score: "E", feedback: "Correct factoring!" };
    }

    const matchedCount = reqNorm.length - missing.length;
    const ratio = reqNorm.length > 0 ? matchedCount / reqNorm.length : 0;

    if (hasForbidden) {
      return {
        score: ratio >= 0.5 ? "P" : "I",
        feedback: "Check the signs! Remember SOAP: Same, Opposite, Always Positive. Expected: " + expected
      };
    }

    if (ratio >= 0.6) {
      return {
        score: "P",
        feedback: "Partially correct. Check both factors and the signs in the trinomial."
      };
    }

    return {
      score: "I",
      feedback: "Incorrect. The correct factorization is: " + expected
    };
  }

  // ----- Level 4: identity choice (choice) -----
  if (fieldId === "identityChoice") {
    if (normalize(answer) === normalize(expected)) {
      return { score: "E", feedback: "Correct identity!" };
    }
    return {
      score: "I",
      feedback: "Incorrect. The expression uses " +
        (expected === "Sum of Cubes" ? "addition (+)" : "subtraction (\u2212)") +
        ", so it's the " + expected + "."
    };
  }

  // ----- Level 4: explanation (textarea) -----
  if (fieldId === "explanation") {
    const norm = normalize(answer);

    const mentionsSign = containsAny(norm, ["addition", "add", "plus", "+", "subtraction", "subtract", "minus", "-"]);
    const mentionsCubes = containsAny(norm, ["perfect cube", "cube root", "cubed", "^3", "³"]);
    const mentionsIdentity = containsAny(norm, ["sum of cubes", "difference of cubes", "identity"]);
    const mentionsBothTerms = containsAny(norm, ["both", "each", "two terms"]);

    const hits = [mentionsSign, mentionsCubes, mentionsIdentity, mentionsBothTerms].filter(Boolean).length;

    // E: mentions sign + cubes (the two key elements from the rubric)
    if (mentionsSign && mentionsCubes) {
      return { score: "E", feedback: "Great explanation! You identified the sign and the perfect cubes." };
    }
    // Also E if they mention the identity name and give reasoning
    if (mentionsIdentity && (mentionsSign || mentionsCubes) && norm.length >= 25) {
      return { score: "E", feedback: "Good explanation with correct reasoning." };
    }
    // P: partial
    if (hits >= 1) {
      return {
        score: "P",
        feedback: "Your explanation is on the right track. Make sure to mention: (1) the sign between terms (+ or \u2212) and (2) that both terms are perfect cubes."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should state: the expression uses addition/subtraction, and both terms are perfect cubes (give the cube roots)."
    };
  }

  // ----- Level 5: term coefficient (number) -----
  if (fieldId === "termCoeff") {
    const studentVal = Number(String(answer).replace(/,/g, ""));
    if (!Number.isFinite(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number." };
    }
    const expVal = Number(expected);

    if (studentVal === expVal) {
      return { score: "E", feedback: "Correct coefficient!" };
    }

    // Check for common errors: forgot the sign, or forgot Pascal coefficient
    const pascalCoeff = context?.pascalCoeff;
    const constantPower = context?.constantPower;

    if (pascalCoeff && studentVal === Math.abs(expVal)) {
      return { score: "P", feedback: "Almost! You have the right magnitude but check the sign. Remember: negative constants raised to odd powers are negative." };
    }
    if (constantPower && studentVal === constantPower) {
      return { score: "P", feedback: "You evaluated the constant's power correctly, but forgot to multiply by the Pascal coefficient C(n,k)." };
    }
    if (pascalCoeff && studentVal === pascalCoeff) {
      return { score: "P", feedback: "That's the Pascal coefficient, but you need to multiply it by (" + context.constant + ")^" + context.k + " = " + constantPower + "." };
    }

    return { score: "I", feedback: "Incorrect. The coefficient is C(" + context.n + "," + context.k + ") \u00d7 (" + context.constant + ")^" + context.k + " = " + expVal + "." };
  }

  // ----- Level 6: full expansion (text) -----
  if (fieldId === "expandedPoly") {
    const student = normalizeMath(answer);
    const exp = normalizeMath(expected);

    // Exact match
    if (student === exp) {
      return { score: "E", feedback: "Perfect expansion! Every term is correct." };
    }

    // Coefficient-by-coefficient check
    const coeffs = context?.coefficients || [];
    const n = context?.n || 0;
    let matched = 0;
    let total = 0;

    for (let i = 0; i < coeffs.length; i++) {
      const c = coeffs[i];
      // Skip leading coefficient of 1 (implicit in x^n)
      if (i === 0 && Math.abs(c) === 1) continue;

      total++;
      const absC = Math.abs(c);
      const absStr = String(absC);

      if (student.includes(absStr)) {
        matched++;
      }
    }

    const ratio = total > 0 ? matched / total : 0;

    if (ratio >= 0.85) {
      return { score: "E", feedback: "Correct expansion!" };
    }
    if (ratio >= 0.5) {
      return { score: "P", feedback: "Some terms are correct but others are off. Check your powers of the constant and signs." };
    }
    return {
      score: "I",
      feedback: "Incorrect. The correct expansion is: " + (context?.expectedExpanded || expected)
    };
  }

  // ----- Fallback -----
  if (normalize(answer) === normalize(expected)) {
    return { score: "E", feedback: "Correct!" };
  }
  return { score: "I", feedback: "Incorrect. Expected: " + expected };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
