// grading-rules.js - AP Statistics Topics 8.1-8.2 cartridge

function normalize(str) {
  return String(str).trim().toLowerCase();
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some((k) => norm.includes(normalize(k)));
}

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;

  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;

  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

function keywordMatchCount(answer, keywords) {
  return keywords.filter((k) => containsAny(answer, [k])).length;
}

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  const openResponseFields = new Set(["textAnswer", "explanation", "alternativeText"]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter an explanation." };
    }
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  if (fieldId === "choiceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You matched the description to the right lesson term."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct term is ${expected}.`
    };
  }

  if (fieldId === "dropdownAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Expected count is total observations divided by the number of equally likely categories."
      };
    }
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    if (!Number.isNaN(studentVal) && !Number.isNaN(expectedVal) && Math.abs(studentVal - expectedVal) <= 2) {
      return {
        score: "P",
        feedback: "Close. Recheck the total number of observations and divide by the number of equally likely categories."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The expected count is ${expected}.`
    };
  }

  if (fieldId === "numericAnswer") {
    const studentVal = parseFloat(answer);
    if (Number.isNaN(studentVal)) {
      return {
        score: "I",
        feedback: "Please enter a valid number."
      };
    }

    const expectedVal = expected;
    const tolerance = expObj.tolerance || 0.02;
    const diff = Math.abs(studentVal - expectedVal);

    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: "Correct. You applied the chi-square contribution formula correctly."
      };
    }
    if (diff <= 0.15) {
      return {
        score: "P",
        feedback: "Very close. Check squaring and rounding in (Observed - Expected)^2 / Expected."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The contribution is ${expectedVal}.`
    };
  }

  if (fieldId === "textAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Your explanation captures the key idea."
      };
    }

    const keywords = context.expectedKeywords || [];
    const matchCount = keywordMatchCount(answer, keywords);
    const ratio = keywords.length > 0 ? matchCount / keywords.length : 0;
    const mentionsReasoning = containsAny(answer, [
      "because",
      "so",
      "therefore",
      "which means",
      "so that"
    ]);

    if (ratio >= 0.75 || (ratio >= 0.5 && mentionsReasoning)) {
      return {
        score: "E",
        feedback: "Good explanation. You included the main statistical idea from the lesson."
      };
    }
    if (ratio >= 0.4 || mentionsReasoning) {
      return {
        score: "P",
        feedback: "Partially correct. Add the missing statistical detail from the hint."
      };
    }
    return {
      score: "I",
      feedback: "Your answer needs the key statistical idea from the lesson prompt."
    };
  }

  if (fieldId === "conceptChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct choice. Now justify it using the simulation result."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct answer is ${expected}.`
    };
  }

  if (fieldId === "explanation") {
    const keywords = context.keywords || [];
    const matchCount = keywordMatchCount(answer, keywords);
    const mentionsSimulation = containsAny(answer, [
      "simulation",
      "simulated",
      "random variation",
      "chance",
      "model"
    ]);
    const mentionsTheme =
      context.theme === "rare"
        ? containsAny(answer, ["rare", "unlikely", "unusual", "few", "small percent", "unexpected"])
        : containsAny(answer, ["common", "often", "plausible", "not unusual", "many", "consistent"]);
    const mentionsOppositeTheme =
      context.theme === "rare"
        ? containsAny(answer, ["common", "often", "many", "plausible"])
        : containsAny(answer, ["rare", "unlikely", "unusual", "unexpected"]);

    if (mentionsOppositeTheme && !mentionsTheme) {
      return {
        score: "I",
        feedback: "That interpretation reverses what the simulation is showing."
      };
    }

    if (matchCount >= 2 && mentionsSimulation && mentionsTheme) {
      return {
        score: "E",
        feedback: "Strong explanation. You connected the simulation proportion to whether the result is common or rare under the model."
      };
    }
    if ((matchCount >= 1 && mentionsSimulation) || (matchCount >= 2 && mentionsTheme)) {
      return {
        score: "P",
        feedback: "Partially correct. Explain more clearly whether the simulated result is common or rare under random variation."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should use the simulation result to say whether the outcome is common or rare under the chance model."
    };
  }

  if (fieldId === "procedureChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. One random sample of one categorical variable compared to specified proportions calls for a chi-square goodness-of-fit test."
      };
    }
    if (studentNorm.includes("chi-square")) {
      return {
        score: "P",
        feedback: "Close. This is in the chi-square family, but with one sample and one categorical variable the correct procedure is goodness of fit."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct procedure is ${expected}.`
    };
  }

  if (fieldId === "nullChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The null hypothesis states that the population proportions equal the specified values."
      };
    }
    if (containsAny(answer, ["sample proportion", "sample proportions"])) {
      return {
        score: "I",
        feedback: "Hypotheses should refer to population proportions, not sample proportions."
      };
    }
    if (containsAny(answer, ["ha:", "at least one", "not as specified", "not all"])) {
      return {
        score: "I",
        feedback: "That is an alternative hypothesis idea. The null hypothesis must state equality to the specified proportions."
      };
    }
    if (containsAny(answer, ["greater", "less"])) {
      return {
        score: "I",
        feedback: "A chi-square goodness-of-fit null hypothesis is not directional. It states equality to the hypothesized proportions."
      };
    }
    return {
      score: "I",
      feedback: context.nullExplanation || `Incorrect. The correct null hypothesis is ${expected}.`
    };
  }

  if (fieldId === "alternativeText") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. That is an appropriate alternative hypothesis stated in words."
      };
    }

    const keywords = context.expectedKeywords || [];
    const matchCount = keywordMatchCount(answer, keywords);
    const mentionsAltIdea = containsAny(answer, [
      "at least one",
      "not as specified",
      "not the same",
      "differs",
      "different from",
      "distribution is not",
      "distribution differs"
    ]);
    const mentionsDirection = containsAny(answer, [
      "greater than",
      "less than",
      "higher than",
      "lower than",
      ">",
      "<"
    ]);
    const mentionsAllDifferent = containsAny(answer, [
      "all different",
      "each proportion is different",
      "all of the proportions are different",
      "every proportion is different"
    ]);
    const mentionsSample = containsAny(answer, [
      "sample proportion",
      "sample proportions",
      "p-hat",
      "phat"
    ]);

    if (mentionsDirection) {
      return {
        score: "I",
        feedback: "Do not use directional inequalities for a chi-square goodness-of-fit alternative hypothesis."
      };
    }
    if (mentionsAllDifferent) {
      return {
        score: "I",
        feedback: "The alternative should say that at least one proportion differs, not that all of them must differ."
      };
    }
    if (mentionsSample && !mentionsAltIdea) {
      return {
        score: "I",
        feedback: "Hypotheses should be about population proportions, not sample proportions."
      };
    }
    if (
      (matchCount >= 2 && mentionsAltIdea) ||
      containsAny(answer, [
        "distribution is not the same",
        "distribution differs from the null",
        "at least one proportion is not",
        "not as specified by the null"
      ])
    ) {
      return {
        score: "E",
        feedback: "Good. You stated the alternative in words and captured the correct idea."
      };
    }
    if (mentionsAltIdea || matchCount >= 1) {
      return {
        score: "P",
        feedback: "Partially correct. Make it clearer that at least one population proportion is not as specified in the null hypothesis."
      };
    }
    return {
      score: "I",
      feedback: "State the alternative in words: the distribution is not as specified, or at least one proportion differs."
    };
  }

  if (fieldId === "conditionsChoice") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You identified the chi-square goodness-of-fit conditions accurately."
      };
    }

    const studentDecision = studentNorm.startsWith("yes")
      ? "yes"
      : studentNorm.startsWith("no")
        ? "no"
        : "";
    const expectedDecision = expectedNorm.startsWith("yes")
      ? "yes"
      : expectedNorm.startsWith("no")
        ? "no"
        : "";

    if (studentDecision && studentDecision === expectedDecision) {
      return {
        score: "P",
        feedback: `You chose the right overall decision but not the key condition. ${context.conditionExplanation}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. ${context.conditionExplanation}`
    };
  }

  if (studentNorm === expectedNorm) {
    return { score: "E", feedback: "Correct." };
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
