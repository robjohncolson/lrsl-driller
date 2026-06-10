function gradeField(fieldId, answer, context = {}) {
  const answerKey = context.answerKey || {};
  const rule = answerKey[fieldId];

  if (!rule) {
    return {
      score: "I",
      feedback: "No grading rule was found for this field."
    };
  }

  if (rule.type === "numeric" || rule.type === "integer") {
    return gradeNumeric(rule, answer);
  }

  return gradeChoiceText(rule, answer);
}

function gradeNumeric(rule, answer) {
  const value = extractNumber(answer);

  if (!Number.isFinite(value)) {
    return {
      score: "I",
      feedback: `Enter a numeric value. ${rule.feedback}`
    };
  }

  const difference = Math.abs(value - rule.value);
  const tolerance = rule.tolerance ?? 0.01;
  const partialTolerance = rule.partialTolerance ?? tolerance * 3;

  if (difference <= tolerance) {
    return {
      score: "E",
      feedback: "Correct."
    };
  }

  if (difference <= partialTolerance) {
    return {
      score: "P",
      feedback: `Close. ${rule.feedback}`
    };
  }

  if (rule.type === "integer" && difference === 1) {
    return {
      score: "P",
      feedback: `You are off by 1. ${rule.feedback}`
    };
  }

  return {
    score: "I",
    feedback: rule.feedback
  };
}

function gradeChoiceText(rule, answer) {
  const normalized = normalizeText(answer);

  if (!normalized) {
    return {
      score: "I",
      feedback: rule.feedback
    };
  }

  const letter = extractStandaloneLetter(answer);

  if (letter && (rule.accepted || []).includes(letter)) {
    return {
      score: "E",
      feedback: "Correct."
    };
  }

  if (matchesAlias(normalized, rule.aliases)) {
    return {
      score: "E",
      feedback: "Correct."
    };
  }

  if (matchesKeywordSet(normalized, rule.keywordSets)) {
    return {
      score: "E",
      feedback: "Correct."
    };
  }

  if (matchesAlias(normalized, rule.partialAliases)) {
    return {
      score: "P",
      feedback: `Partly correct. ${rule.feedback}`
    };
  }

  if (matchesKeywordSet(normalized, rule.partialKeywords)) {
    return {
      score: "P",
      feedback: `Partly correct. ${rule.feedback}`
    };
  }

  return {
    score: "I",
    feedback: rule.feedback
  };
}

function matchesAlias(answer, aliases = []) {
  return aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias);
    return answer === normalizedAlias || answer.includes(normalizedAlias);
  });
}

function matchesKeywordSet(answer, keywordSets = []) {
  return keywordSets.some((keywords) =>
    keywords.every((keyword) => answer.includes(normalizeText(keyword)))
  );
}

function extractStandaloneLetter(answer) {
  const trimmed = String(answer || "").trim();
  const match = trimmed.match(/^([A-Za-z])(?:[).:]?)?$/);
  return match ? match[1].toUpperCase() : "";
}

function extractNumber(answer) {
  if (typeof answer === "number") {
    return answer;
  }

  const match = String(answer || "")
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : Number.NaN;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9.%/\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export { gradeField };
