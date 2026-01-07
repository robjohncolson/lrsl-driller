/**
 * Grading Rules — MIT 6.0001 Lecture 1: What is Computation?
 *
 * Score meanings:
 *   'E' = Essentially correct (full credit)
 *   'P' = Partially correct
 *   'I' = Incorrect
 */

function normalize(s) {
  return (s ?? '').toString().trim();
}

function normalizeLower(s) {
  return normalize(s).toLowerCase();
}

function isNumericString(s) {
  const n = parseFloat(s);
  return !Number.isNaN(n) && Number.isFinite(n);
}

function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

export function gradeField(fieldId, answer, context) {
  const raw = normalize(answer);
  const lower = normalizeLower(answer);

  switch (fieldId) {
    case 'fundamentals':
      return gradeSelect(lower, context.fundamentalsCorrect, 'A computer performs calculations and remembers results.');
    case 'explicit':
      return gradeSelect(lower, context.explicitCorrect, 'Computers only do what you tell them to do.');
    case 'knowledge_kind':
      return gradeSelect(lower, context.knowledgeCorrect, 'Declarative = facts. Imperative = a recipe/how-to.');
    case 'algorithm_parts':
      return gradeSelect(lower, context.algorithmCorrect, 'Algorithm = steps + flow of control + a stopping condition.');
    case 'aspect':
      return gradeSelect(lower, context.aspectCorrect, 'Aspect meanings: primitives, syntax, static semantics, semantics.');
    case 'error_type':
      return gradeSelect(lower, context.errorCorrect, 'Error types: syntax, static semantics, unintended meaning.');
    case 'printed':
      return gradePrinted(raw, context);
    case 'printed_type':
      return gradePrintedType(lower, context);
    default:
      return { score: 'I', feedback: 'Unknown field.' };
  }
}

function gradeSelect(answerLower, correctValue, feedbackIfWrong) {
  const correctLower = normalizeLower(correctValue);

  if (answerLower === correctLower) {
    return { score: 'E', feedback: 'Correct.' };
  }

  // No partial credit for MC/select fields by default.
  return { score: 'I', feedback: `Not quite. ${feedbackIfWrong}` };
}

function gradePrinted(rawAnswer, context) {
  // Numeric printed outputs: accept within tolerance
  if (context.printedIsNumeric) {
    if (!isNumericString(rawAnswer)) {
      return {
        score: 'I',
        feedback: `Please enter a number. (Expected something like ${context.expectedPrintedText}.)`
      };
    }

    const student = parseFloat(rawAnswer);
    const expected = Number(context.expectedPrintedNumber);
    const tol = Number(context.tolerance ?? 0);

    if (near(student, expected, tol)) {
      return { score: 'E', feedback: 'Correct.' };
    }

    // Partial: close but not within tolerance
    if (near(student, expected, Math.max(0.1, tol * 10))) {
      return {
        score: 'P',
        feedback: `Close. Expected about ${context.expectedPrintedText}.`
      };
    }

    return {
      score: 'I',
      feedback: `Incorrect. Expected about ${context.expectedPrintedText}.`
    };
  }

  // Non-numeric printed outputs (None, True, False)
  const expectedLower = normalizeLower(context.expectedPrintedText);

  // Accept common variants
  if (expectedLower === 'none') {
    if (normalizeLower(rawAnswer) === 'none') {
      return { score: 'E', feedback: 'Correct.' };
    }
    return { score: 'I', feedback: 'Incorrect. The program prints None.' };
  }

  if (expectedLower === 'true' || expectedLower === 'false') {
    if (normalizeLower(rawAnswer) === expectedLower) {
      return { score: 'E', feedback: 'Correct.' };
    }
    return { score: 'I', feedback: `Incorrect. The program prints ${context.expectedPrintedText}.` };
  }

  if (normalizeLower(rawAnswer) === expectedLower) {
    return { score: 'E', feedback: 'Correct.' };
  }

  return { score: 'I', feedback: `Incorrect. The program prints ${context.expectedPrintedText}.` };
}

function gradePrintedType(answerLower, context) {
  const expected = normalizeLower(context.expectedPrintedType);

  // Allow minor formatting variants (e.g., "nonetype" vs "noneType")
  const normalizedAnswer = answerLower.replace(/\s+/g, '');

  if (normalizedAnswer === expected.replace(/\s+/g, '')) {
    return { score: 'E', feedback: 'Correct.' };
  }

  // Accept "none" for NoneType? (Common beginner confusion)
  if (expected === 'nonetype' && normalizedAnswer === 'none') {
    return {
      score: 'P',
      feedback: 'Close: the value is None, and its type is NoneType.'
    };
  }

  return {
    score: 'I',
    feedback: `Incorrect. The correct type is ${context.expectedPrintedType}.`
  };
}
