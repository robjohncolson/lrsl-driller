// grading-rules.js — Dividing Polynomials
// Cartridge: a2-dividing-polynomials
//
// Grading strategy:
// - Numeric fields (remainder, coefficients, P(a)): exact integer match
// - Factor text fields: parse root from expression, compare
// - Quotient/fraction text fields: normalize and compare, AI handles partial credit
// - Dropdown fields (verify, is-factor): exact string match

// ============ UTILITY FUNCTIONS ============

function normalize(str) {
  return String(str ?? "").trim().toLowerCase();
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

/**
 * Normalize a math expression for comparison.
 * Strips spaces, converts Unicode minus/superscripts to plain ASCII.
 */
function normalizeExpr(str) {
  return String(str ?? "").trim()
    .replace(/\s+/g, '')
    .replace(/\u2212/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\u2070/g, '^0')
    .replace(/\u00b9/g, '^1')
    .replace(/\u00b2/g, '^2')
    .replace(/\u00b3/g, '^3')
    .replace(/\u2074/g, '^4')
    .replace(/\u2075/g, '^5')
    .replace(/\u2076/g, '^6')
    .replace(/\u2077/g, '^7')
    .replace(/\u2078/g, '^8')
    .replace(/\u2079/g, '^9')
    .toLowerCase();
}

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;
  return { value: undefined, tolerance: 0 };
}

/**
 * Grade a numeric answer (exact integer match).
 */
function gradeNumeric(studentAnswer, expectedValue, fieldLabel) {
  const parsed = parseFloat(String(studentAnswer).replace(/,/g, '').trim());
  if (isNaN(parsed)) {
    return { score: "I", feedback: "Please enter a valid number." };
  }
  if (Math.abs(parsed - expectedValue) < 0.5) {
    return { score: "E", feedback: "Correct!" };
  }
  // Check for sign error (common mistake)
  if (Math.abs(parsed + expectedValue) < 0.5 && expectedValue !== 0) {
    return { score: "P", feedback: `Check your sign. The correct answer is ${expectedValue}.` };
  }
  return { score: "I", feedback: `Incorrect. The correct answer is ${expectedValue}.` };
}

/**
 * Parse a linear factor expression and return the root.
 * "(x+3)" -> root = -3, "(x-3)" -> root = 3, "x" -> root = 0
 * Returns NaN if unparseable.
 */
function parseFactorRoot(str) {
  let s = String(str).trim()
    .replace(/\s+/g, '')
    .replace(/\u2212/g, '-')
    .replace(/[()]/g, '');
  // Handle "x+n" or "x-n"
  const match = s.match(/^x([+-]\d+)$/);
  if (match) return -Number(match[1]);
  if (s === 'x') return 0;
  return NaN;
}

// ============ MAIN GRADING FUNCTION ============

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  // ===== BLANK HANDLING =====
  if (isBlank(answer)) {
    return { score: "I", feedback: "Please enter an answer." };
  }

  // ===== NUMERIC FIELDS =====
  // Mode 1: remainder, Mode 2: coeff-x2/x1/x0/remainder, Mode 3: division-remainder/pa-value, Mode 6: pa-value
  if (fieldId === "power-result" || fieldId === "remainder" || fieldId === "coeff-x2" || fieldId === "coeff-x1" ||
      fieldId === "coeff-x0" || fieldId === "division-remainder" || fieldId === "pa-value") {
    return gradeNumeric(answer, expected, fieldId);
  }

  // ===== DROPDOWN: Verify Remainder Theorem (Mode 3) =====
  if (fieldId === "verify") {
    const student = normalize(answer);
    const exp = normalize(expected);
    if (student === exp) {
      return { score: "E", feedback: "Correct! The Remainder Theorem is verified." };
    }
    return {
      score: "I",
      feedback: "The division remainder always equals P(a). That's what the Remainder Theorem says \u2014 select Yes."
    };
  }

  // ===== DROPDOWN: Is It a Factor? (Mode 6) =====
  if (fieldId === "is-factor") {
    const student = normalize(answer);
    const exp = normalize(expected);
    if (student === exp) {
      return { score: "E", feedback: "Correct!" };
    }
    // Check if student's P(a) was correct but they chose wrong Yes/No
    const paObj = getExpectedObj(context, 'pa-value');
    const correctPa = paObj.value;
    if (correctPa === 0) {
      return {
        score: "I",
        feedback: `Since P(${context.a}) = 0, the divisor IS a factor. The remainder is 0.`
      };
    }
    return {
      score: "I",
      feedback: `Since P(${context.a}) = ${correctPa} \u2260 0, the divisor is NOT a factor.`
    };
  }

  // ===== TEXT: Factor fields (Mode 4) =====
  if (fieldId === "factor2" || fieldId === "factor3") {
    const studentRoot = parseFactorRoot(answer);
    if (isNaN(studentRoot)) {
      return {
        score: "I",
        feedback: "Could not parse your factor. Write it as (x+n) or (x-n)."
      };
    }

    // Expected roots for the two factor fields
    const expectedRoot2 = context.root2;
    const expectedRoot3 = context.root3;
    const expectedRoots = [expectedRoot2, expectedRoot3];

    if (expectedRoots.includes(studentRoot)) {
      return { score: "E", feedback: "Correct factor!" };
    }

    // Check for sign error
    if (expectedRoots.includes(-studentRoot)) {
      return {
        score: "P",
        feedback: `Sign error. Remember: if the root is r, the factor is (x \u2212 r). Expected: ${expected}`
      };
    }

    return {
      score: "I",
      feedback: `Incorrect factor. Divide P(x) by the known factor to find the quadratic, then factor it. Expected: ${expected}`
    };
  }

  // ===== TEXT: Quotient polynomial (Mode 5) =====
  if (fieldId === "quotient-poly") {
    const studentNorm = normalizeExpr(answer);
    const expectedNorm = normalizeExpr(expected);

    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct quotient!" };
    }

    // Strip outer parens and retry
    const studentStripped = studentNorm.replace(/^\(/, '').replace(/\)$/, '');
    if (studentStripped === expectedNorm) {
      return { score: "E", feedback: "Correct quotient!" };
    }

    // Check if student has the right coefficients by extracting numbers
    // This is a heuristic - AI grading handles full matching
    const expectedCoeffs = context.quotientCoeffs;
    if (expectedCoeffs) {
      const allPresent = expectedCoeffs.every(c =>
        c === 0 || studentNorm.includes(String(Math.abs(c)))
      );
      if (allPresent) {
        return {
          score: "P",
          feedback: `Close! Check your formatting. Expected: ${expected}`
        };
      }
    }

    return {
      score: "I",
      feedback: `Incorrect quotient. Expected: ${expected}`
    };
  }

  // ===== TEXT: Remainder fraction (Mode 5) =====
  if (fieldId === "remainder-fraction") {
    const studentNorm = normalizeExpr(answer);
    const expectedNorm = normalizeExpr(expected);

    if (studentNorm === expectedNorm) {
      return { score: "E", feedback: "Correct remainder fraction!" };
    }

    // Try matching just the numerator (remainder value)
    const expectedR = context.expectedRemainder;
    const expectedA = context.a;
    if (expectedR !== undefined) {
      // Check if student has the right numerator
      const hasCorrectR = studentNorm.includes(String(Math.abs(expectedR)));
      // Check denominator references the right value
      const hasCorrectA = studentNorm.includes(String(Math.abs(expectedA)));

      if (hasCorrectR && hasCorrectA) {
        return {
          score: "P",
          feedback: `Close! Check formatting. Expected: ${expected}`
        };
      }
    }

    return {
      score: "I",
      feedback: `Incorrect. Write as r/(x \u2212 a). Expected: ${expected}`
    };
  }

  // ===== GENERIC FALLBACK =====
  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);
  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct!" };
  }
  return { score: "I", feedback: `Incorrect. Expected: ${expected}` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
