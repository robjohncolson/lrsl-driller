/**
 * AP Statistics Unit 3 Lesson 5 - Grading Rules
 *
 * Score meanings:
 *   'E' = Essentially correct (full credit)
 *   'P' = Partially correct
 *   'I' = Incorrect
 */

function norm(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function firstLetterAtoE(s) {
  const m = norm(s).match(/[a-e]/);
  return m ? m[0].toUpperCase() : null;
}

function containsAny(text, keywords = []) {
  const t = norm(text);
  return keywords.some(k => t.includes(norm(k)));
}

function containsAll(text, keywords = []) {
  const t = norm(text);
  return keywords.every(k => t.includes(norm(k)));
}

function countElementHits(text, elements = []) {
  // elements: [{name, keywords:[...]}]
  let hits = 0;
  const missing = [];
  for (const el of elements) {
    if (containsAny(text, el.keywords || [])) {
      hits += 1;
    } else {
      missing.push(el.name);
    }
  }
  return { hits, missing, total: elements.length };
}

export function gradeField(fieldId, answer, context) {
  const a = norm(answer);

  switch (fieldId) {
    case "answer":
      return gradeL01(a, context);

    case "decision":
      return gradeDecision(a, context);

    case "justification":
      return gradeJustification(a, context);

    case "response":
      return gradeFreeResponse(a, context);

    default:
      return { score: "I", feedback: "Unknown field." };
  }
}

function gradeL01(answer, context) {
  // L01 can be MCQ-letter OR short answer.
  if (context?.kind === "mcq") {
    const student = firstLetterAtoE(answer);
    const correct = (context.correctLetter || "").toUpperCase();
    if (student && student === correct) {
      return { score: "E", feedback: context.feedbackCorrect || "Correct!" };
    }
    return { score: "I", feedback: context.feedbackIncorrect || `Incorrect. Correct answer: ${correct}.` };
  }

  if (context?.kind === "keywords_all") {
    const kws = context.keywordsAll || [];
    if (containsAll(answer, kws)) {
      return { score: "E", feedback: context.feedbackCorrect || "Correct!" };
    }
    // Partial if at least one keyword present
    if (containsAny(answer, kws)) {
      return { score: "P", feedback: "You have part of it — make sure your definition includes all key ideas." };
    }
    return { score: "I", feedback: context.feedbackIncorrect || "Incorrect." };
  }

  // keywords_any (default)
  const any = context?.keywordsAny || [];
  if (containsAny(answer, any)) {
    return { score: "E", feedback: context.feedbackCorrect || "Correct!" };
  }

  return { score: "I", feedback: context.feedbackIncorrect || `Incorrect. A good answer would be: ${context.correctAnswer}` };
}

function gradeDecision(answer, context) {
  const correct = (context?.correctDecision || "").toLowerCase();
  const student = answer.startsWith("y") ? "yes" : (answer.startsWith("n") ? "no" : answer);

  if (student === correct) {
    return { score: "E", feedback: "Decision is correct." };
  }

  return { score: "I", feedback: `Decision is incorrect. Correct decision: ${correct.toUpperCase()}.` };
}

function gradeJustification(answer, context) {
  // We look for key phrases. E if 2+ hits, P if 1 hit, I if 0 hits.
  const keyPhrases = context?.keyPhrases || [];
  const hitCount = keyPhrases.reduce((acc, phrase) => acc + (norm(answer).includes(norm(phrase)) ? 1 : 0), 0);

  if (hitCount >= 2) {
    return { score: "E", feedback: "Justification uses appropriate experimental-design reasoning." };
  }
  if (hitCount === 1) {
    return { score: "P", feedback: "Good start — add a second specific design idea (e.g., random assignment, comparison/control, confounding, replication)." };
  }
  return {
    score: "I",
    feedback: "Your justification needs experiment vocabulary and a specific reason (e.g., observational → cannot infer causation; missing comparison; no random assignment; confounding)."
  };
}

function gradeFreeResponse(answer, context) {
  const elements = context?.requiredElements || [];
  if (!elements.length) {
    // Fallback if no rubric data provided.
    if (answer.length >= 30) return { score: "P", feedback: "Response received." };
    return { score: "I", feedback: "Please provide a more complete response." };
  }

  const { hits, missing, total } = countElementHits(answer, elements);

  if (hits >= Math.max(3, total - 1)) {
    return { score: "E", feedback: "Strong response — you included most key elements of experimental design." };
  }
  if (hits >= 2) {
    return {
      score: "P",
      feedback: `Partially correct — you included some key elements. Consider adding: ${missing.slice(0, 3).join(", ")}.`
    };
  }
  return {
    score: "I",
    feedback: `Incomplete — you are missing major elements. Try including: ${missing.slice(0, 4).join(", ")}.`
  };
}
