function normalizeText(value) {
  return String(value == null ? "" : value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getAnswerKey(context) {
  if (!context || typeof context !== "object") {
    return {};
  }

  if (context.answerKey && typeof context.answerKey === "object") {
    return context.answerKey;
  }

  return {};
}

function matchesAny(actual, values) {
  return Array.isArray(values) && values.some(function someValue(value) {
    return normalizeText(value) === actual;
  });
}

function feedbackFor(fieldId, score) {
  if (fieldId === "test_statistic_choice") {
    if (score === "E") {
      return "Correct. For a slope test, compute t = (b - beta_0) / SE_b, and in this lesson beta_0 = 0.";
    }

    if (score === "P") {
      return "Close. You used the slope and standard error, but the sign or setup is off.";
    }

    return "Incorrect. Use t = (b - beta_0) / SE_b, not subtraction alone or an inverted ratio.";
  }

  if (fieldId === "p_value_setup_choice") {
    if (score === "E") {
      return "Correct. The p-value comes from a t-distribution with df = n - 2 and the tail area(s) must match the alternative hypothesis.";
    }

    if (score === "P") {
      return "Close. You identified the t-distribution idea, but the degrees of freedom or the tail choice is off.";
    }

    return "Incorrect. Use df = n - 2, then shade one tail for a one-sided test or both tails for a two-sided test.";
  }

  if (fieldId === "p_value_interpretation_choice") {
    if (score === "E") {
      return "Correct. A p-value interpretation assumes H0 is true and describes the probability of getting evidence this strong or stronger by chance alone.";
    }

    if (score === "P") {
      return "Close. Your interpretation is missing the 'or greater' or 'as extreme or more extreme' tail wording.";
    }

    return "Incorrect. The p-value is not the probability that H0 or Ha is true.";
  }

  if (fieldId === "conclusion_choice") {
    if (score === "E") {
      return "Correct. Compare the p-value with alpha, then state whether there is convincing statistical evidence for the alternative in context.";
    }

    if (score === "P") {
      return "Close. The decision direction is on track, but the wording is too strong or treats H0 as proven.";
    }

    return "Incorrect. Reject H0 when p-value <= alpha and fail to reject H0 when p-value > alpha.";
  }

  if (fieldId === "strength_comparison_choice") {
    if (score === "E") {
      return "Correct. Stronger evidence comes from a smaller p-value or a t statistic farther from 0.";
    }

    return "Incorrect. Compare the p-values or compare how far the t statistics are from 0.";
  }

  return score === "E" ? "Correct." : "Incorrect.";
}

function gradeField(fieldId, answer, context) {
  const answerKey = getAnswerKey(context);
  const actual = normalizeText(answer);
  const expected = normalizeText(answerKey[fieldId]);
  const accepted = context && context.acceptedResponses
    ? context.acceptedResponses[fieldId]
    : [];
  const partial = context && context.partialResponses
    ? context.partialResponses[fieldId]
    : [];

  if (!actual) {
    return {
      score: "I",
      feedback: feedbackFor(fieldId, "I")
    };
  }

  if (actual === expected || matchesAny(actual, accepted)) {
    return {
      score: "E",
      feedback: feedbackFor(fieldId, "E")
    };
  }

  if (matchesAny(actual, partial)) {
    return {
      score: "P",
      feedback: feedbackFor(fieldId, "P")
    };
  }

  return {
    score: "I",
    feedback: feedbackFor(fieldId, "I")
  };
}

export { gradeField };
