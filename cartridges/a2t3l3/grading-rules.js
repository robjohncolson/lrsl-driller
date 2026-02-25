// grading-rules.js — Polynomial Identities & Binomial Theorem
// Cartridge: a2t3l3
//
// Notes:
// • Be lenient for explanations: reward correct concepts even if wording is imperfect.
// • For factoring fields, use token checks (required + forbidden) to allow flexible ordering.

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

// A slightly more math-friendly normalization for polynomial strings
function normalizeMath(str) {
  return normalize(str)
    .replace(/\s+/g, "")
    .replace(/[(){}\[\]]/g, " ")  // replace brackets with space (preserves factor boundaries)
    .replace(/[·×*]/g, "")       // remove multiplication symbols
    .replace(/−/g, "-")          // normalize unicode minus
    .replace(/\s+/g, " ")        // collapse multiple spaces
    .trim();
}

function getExpectedObj(context, fieldId) {
  // Try direct access (some platforms merge fields into context)
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;

  // Try answers object (common)
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;

  return { value: undefined, tolerance: 0 };
}

// ============ MAIN GRADING FUNCTION ============

export function gradeField(fieldId, answer, context) {
  // ----- Blank handling -----
  const openResponseFields = new Set(["pascalExplain", "errorExplain"]);

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

  // ----- Level 1: identity choice -----
  if (fieldId === "identityName") {
    const student = normalize(answer);
    const exp = normalize(expected);
    if (student === exp) {
      return { score: "E", feedback: "Correct — you matched the structure to the right identity." };
    }
    return {
      score: "I",
      feedback: `Not quite. Look for the structure (squares vs cubes, plus vs minus). Correct: ${expected}.`
    };
  }

  // ----- Level 1b: identity flashcards -----
  if (fieldId === "flashcardAnswer") {
    const student = normalize(answer);
    const exp = normalize(expected);
    if (student === exp) {
      return { score: "E", feedback: "Correct! Keep building that recall speed." };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is: ${expected}`
    };
  }

  // ----- Level 2: rewrite choice -----
  if (fieldId === "rewriteChoice") {
    const student = normalize(answer);
    const exp = normalize(expected);
    if (student === exp) {
      return { score: "E", feedback: "Correct rewrite!" };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct rewritten form is: ${expected}`
    };
  }

  // ----- Level 3: numeric result -----
  if (fieldId === "numericResult") {
    const studentVal = Number(String(answer).replace(/,/g, ""));
    if (!Number.isFinite(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number." };
    }
    const expVal = Number(expected);
    const tol = Number(expObj.tolerance ?? 0);
    const diff = Math.abs(studentVal - expVal);

    if (diff <= tol) return { score: "E", feedback: "Correct!" };
    if (diff <= Math.max(1, tol * 5)) {
      return { score: "P", feedback: "Close! Re-check arithmetic and any identity step." };
    }
    return { score: "I", feedback: `Incorrect. The correct value is ${expVal}.` };
  }

  // ----- Level 4: factoring (token-based) -----
  if (fieldId === "factorAnswer") {
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
      // Clear sign/structure error
      return {
        score: ratio >= 0.5 ? "P" : "I",
        feedback: `Check signs/structure (common cube mistake: the middle term sign). Expected: ${expected}`
      };
    }

    if (ratio >= 0.6) {
      return {
        score: "P",
        feedback: "You have part of the correct structure. Make sure BOTH factors are correct and signs match the identity."
      };
    }

    return {
      score: "I",
      feedback: `Incorrect. A correct factorization is: ${expected}`
    };
  }

  // ----- Level 5: Pascal patterns (numeric value) -----
  if (fieldId === "pascalValue") {
    const studentVal = Number(String(answer).replace(/,/g, ""));
    if (!Number.isFinite(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number." };
    }
    const expVal = Number(expected);
    const tol = Number(expObj.tolerance ?? 0);
    const diff = Math.abs(studentVal - expVal);

    if (diff <= tol) return { score: "E", feedback: "Correct value!" };
    if (diff <= Math.max(1, tol * 5)) return { score: "P", feedback: "Close — check your row/combination." };
    return { score: "I", feedback: `Incorrect. The correct value is ${expVal}.` };
  }

  // ----- Level 5: Pascal explanation -----
  if (fieldId === "pascalExplain") {
    const norm = normalize(answer);

    // Pull scenario-specific keywords from context when available
    const kw = Array.isArray(context?.pascalKeywords) ? context.pascalKeywords : [];
    const mentionsPascal = containsAny(norm, ["pascal", "triangle"]);
    const mentionsChoose = containsAny(norm, ["choose", "combination", "c(", "n choose", "binomial"]);
    const mentionsSumRule = containsAny(norm, ["2^", "power of 2", "double", "doubling", "row sum"]);
    const mentionsAdjacentSum = containsAny(norm, ["sum of", "add", "above", "adjacent"]);

    const hasAnyCore = mentionsPascal || mentionsChoose || mentionsSumRule || mentionsAdjacentSum;
    const hits = kw.length ? kw.filter(k => norm.includes(normalize(k))).length : 0;

    // E: references a correct Pascal/binomial idea and gives some reasoning
    if (hasAnyCore && (hits >= 1 || norm.length >= 20)) {
      return { score: "E", feedback: "Good explanation of the Pascal/binomial pattern." };
    }
    // P: some relevant words but too vague
    if (hasAnyCore) {
      return { score: "P", feedback: "You’re on the right track — add a bit more detail about how Pascal’s Triangle gives the value." };
    }
    return { score: "I", feedback: "Explain using Pascal’s Triangle (adjacent sums, row sums 2^n, or C(n,k) coefficients)." };
  }

  // ----- Level 6: term coefficient & exponents -----
  if (fieldId === "termCoeff" || fieldId === "termExpVar1" || fieldId === "termExpVar2") {
    const studentVal = Number(String(answer).replace(/,/g, ""));
    if (!Number.isFinite(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number." };
    }
    const expVal = Number(expected);
    const tol = Number(expObj.tolerance ?? 0);
    const diff = Math.abs(studentVal - expVal);

    if (diff <= tol) return { score: "E", feedback: "Correct!" };
    if (diff <= Math.max(1, tol * 5)) return { score: "P", feedback: "Close — double-check n choose k and the exponent pattern." };
    return { score: "I", feedback: `Incorrect. Expected ${expVal}.` };
  }

  // ----- Level 6: error analysis explanation -----
  if (fieldId === "errorExplain") {
    const norm = normalize(answer);

    const mentionsBinomCoeff = containsAny(norm, ["c(", "choose", "combination", "binomial coefficient", "pascal"]);
    const mentionsForgot = containsAny(norm, ["forgot", "missing", "didn't include", "left out", "not multiply by"]);
    const mentionsExponentPattern = containsAny(norm, ["exponent", "powers", "goes down", "goes up", "add to", "sum to"]);

    // E: identifies the missing binomial coefficient (or Pascal row) + some correct reasoning
    if (mentionsBinomCoeff && (mentionsForgot || mentionsExponentPattern)) {
      return { score: "E", feedback: "Great — you identified the missing binomial coefficient and described the correct pattern." };
    }
    // P: partial
    if (mentionsBinomCoeff || mentionsExponentPattern) {
      return { score: "P", feedback: "Good start. Explicitly mention the binomial coefficient C(n,k) (from Pascal’s Triangle) and how exponents change." };
    }
    return { score: "I", feedback: "Your explanation should mention the binomial coefficient C(n,k) (Pascal’s Triangle) and the exponent pattern in the term." };
  }

  // ----- Fallback: exact match if possible -----
  const student = normalize(answer);
  const exp = normalize(expected);
  if (student === exp) return { score: "E", feedback: "Correct!" };

  return { score: "I", feedback: `Incorrect. Expected: ${expected}` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
