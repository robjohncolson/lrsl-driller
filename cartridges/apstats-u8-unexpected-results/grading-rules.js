// grading-rules.js - AP Statistics Topic 8.1 cartridge

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

  const openResponseFields = new Set(["textAnswer", "explanation"]);

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
