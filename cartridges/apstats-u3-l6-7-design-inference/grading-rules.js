/**
 * Grading Rules
 * AP Statistics Unit 3 Lessons 6–7 — Experimental Design & Inference
 *
 * Score meanings:
 *   'E' = Essentially correct (full credit)
 *   'P' = Partially correct (some understanding)
 *   'I' = Incorrect
 */

function normalizeText(s) {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-') // en/em dash → hyphen
    .replace(/[-_/]+/g, ' ')
    .replace(/[^\w\s.%<>]/g, '') // keep letters/numbers/space plus % . < >
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeYesNo(s) {
  const a = normalizeText(s);
  if (!a) return '';
  if (['y', 'yes', 'true', 't', '1'].includes(a)) return 'yes';
  if (['n', 'no', 'false', 'f', '0'].includes(a)) return 'no';
  return a;
}

function anyMatch(normalizedAnswer, acceptableList = []) {
  const norm = normalizeText(normalizedAnswer);
  return acceptableList.some((x) => normalizeText(x) === norm);
}

// ------------------------------
// Main entry
// ------------------------------
export function gradeField(fieldId, answer, context) {
  const norm = normalizeText(answer);

  switch (fieldId) {
    case 'term':
      return gradeTerm(norm, context);
    case 'design':
      return gradeDesign(norm, context);
    case 'sig':
    case 'cause':
    case 'gen':
      return gradeYesNo(fieldId, answer, context);
    case 'response':
      return gradeFr(norm, context);
    default:
      return { score: 'I', feedback: 'Unknown field.' };
  }
}

// ------------------------------
// L01 — Term fill-in
// ------------------------------
function gradeTerm(answerNorm, context) {
  const acceptable = context?.acceptableAnswers ?? [];
  const canonical = context?.canonicalAnswer ?? '';

  if (!answerNorm) return { score: 'I', feedback: 'Please enter a term.' };

  if (anyMatch(answerNorm, acceptable) || normalizeText(canonical) === answerNorm) {
    return { score: 'E', feedback: 'Correct!' };
  }

  // partial: correct word appears inside answer (e.g., "random assignment" vs "assignment")
  if (canonical && answerNorm.includes(normalizeText(canonical))) {
    return { score: 'P', feedback: 'Close — simplify your answer to the key term.' };
  }

  return { score: 'I', feedback: `Not quite. Key idea: ${canonical}.` };
}

// ------------------------------
// L02 — Design choice
// ------------------------------
const DESIGN_ALIASES = {
  'completely randomized design': ['completely randomized design', 'crd', 'completely randomized', 'completely random'],
  'randomized block design': ['randomized block design', 'randomized block', 'block design', 'blocked design', 'rbd'],
  'matched pairs design': ['matched pairs design', 'matched pairs', 'paired design', 'within subject', 'within subjects']
};

function canonicalizeDesign(answerNorm) {
  for (const [canon, aliases] of Object.entries(DESIGN_ALIASES)) {
    if (aliases.some((a) => normalizeText(a) === answerNorm)) return canon;
  }
  return answerNorm;
}

function gradeDesign(answerNorm, context) {
  const correct = normalizeText(context?.correctDesign ?? '');

  if (!answerNorm) return { score: 'I', feedback: 'Please choose a design.' };

  const canonStudent = canonicalizeDesign(answerNorm);
  const canonCorrect = canonicalizeDesign(correct);

  if (canonStudent === canonCorrect) {
    return {
      score: 'E',
      feedback: context?.rationale ? `Correct! ${context.rationale}` : 'Correct!'
    };
  }

  // Partial credit: student picks a design that is in the right "family"
  // e.g., they picked block vs matched pairs (both are blocking), or CRD vs block (missed blocking variable)
  if (
    (canonCorrect === 'randomized block design' && canonStudent === 'matched pairs design') ||
    (canonCorrect === 'matched pairs design' && canonStudent === 'randomized block design')
  ) {
    return {
      score: 'P',
      feedback:
        'Almost. You chose a blocking-based design, but decide whether you can form PAIRS (matched pairs) or broader BLOCKS (randomized block).'
    };
  }

  return {
    score: 'I',
    feedback:
      'Not quite. Re-check whether there is a strong blocking variable (→ randomized block) or a natural pairing / each unit gets both treatments (→ matched pairs).'
  };
}

// ------------------------------
// L03 — Yes/No triage
// ------------------------------
function gradeYesNo(fieldId, rawAnswer, context) {
  const student = normalizeYesNo(rawAnswer);
  if (!student) return { score: 'I', feedback: 'Please choose Yes or No.' };

  const correctMap = {
    sig: normalizeYesNo(context?.correctSig ?? ''),
    cause: normalizeYesNo(context?.correctCause ?? ''),
    gen: normalizeYesNo(context?.correctGen ?? '')
  };

  const correct = correctMap[fieldId];
  if (!correct) return { score: 'I', feedback: 'Missing answer key for this problem.' };

  if (student === correct) {
    const rationale = context?.quickRationale?.[fieldId] || context?.quickRationale?.[fieldId.replace('sig', 'sig')];
    return { score: 'E', feedback: rationale ? `Correct! ${rationale}` : 'Correct!' };
  }

  // targeted feedback
  if (fieldId === 'sig') {
    return {
      score: 'I',
      feedback: `Check p vs α: p = ${context?.pValue ?? '?'} and α = ${context?.alpha ?? '?'}. Statistically significant when p < α.`
    };
  }
  if (fieldId === 'cause') {
    return {
      score: 'I',
      feedback:
        'Evidence of causation requires random assignment AND a statistically significant difference. If the result is not significant, you cannot attribute the difference to the treatment.'
    };
  }
  if (fieldId === 'gen') {
    return {
      score: 'I',
      feedback:
        'Generalization requires a random/representative sample of experimental units from the population of interest. Volunteers typically do not justify generalization.'
    };
  }
  return { score: 'I', feedback: 'Incorrect.' };
}

// ------------------------------
// L04 — Free response keyword rubric
// ------------------------------
function countMatchedGroups(answerNorm, groups = []) {
  if (!Array.isArray(groups)) return 0;
  let count = 0;

  for (const g of groups) {
    const keywords = g?.keywords ?? [];
    const hit = keywords.some((k) => answerNorm.includes(normalizeText(k)));
    if (hit) count += 1;
  }

  return count;
}

function getMissingGroupLabels(groups = [], answerNorm = '') {
  if (!Array.isArray(groups)) return [];
  const missing = [];
  for (const g of groups) {
    const keywords = g?.keywords ?? [];
    const hit = keywords.some((k) => answerNorm.includes(normalizeText(k)));
    if (!hit) missing.push(g?.label ?? 'key idea');
  }
  return missing;
}

function gradeFr(answerNorm, context) {
  if (!answerNorm) return { score: 'I', feedback: 'Please write a response.' };

  const required = context?.requiredKeywordGroups ?? [];
  const partial = context?.partialKeywordGroups ?? [];

  const matchedRequired = countMatchedGroups(answerNorm, required);
  const matchedPartial = countMatchedGroups(answerNorm, partial);

  const requiredCount = Array.isArray(required) ? required.length : 0;

  // Full credit: hit most required groups (allow missing 1)
  const neededForE = Math.max(1, requiredCount - 1);
  if (requiredCount > 0 && matchedRequired >= neededForE) {
    return { score: 'E', feedback: 'Essentially correct. Nice use of the key concepts.' };
  }

  // Partial credit: hit at least half of required OR some partial groups
  const neededForP = Math.max(1, Math.ceil(requiredCount / 2));
  if ((requiredCount > 0 && matchedRequired >= neededForP) || matchedPartial >= 2) {
    const suggestions = getMissingGroupLabels(required, answerNorm).slice(0, 4).join(', ');
    return {
      score: 'P',
      feedback: `Partially correct. To earn full credit, explicitly connect more of these ideas: ${suggestions}.`
    };
  }

  const suggestions = getMissingGroupLabels(required, answerNorm).slice(0, 4).join(', ');
  return {
    score: 'I',
    feedback: `Not yet. Re-read the prompt and include the key ideas (for example: ${suggestions}).`
  };
}
