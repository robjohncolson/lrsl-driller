function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\u2212/g, "-")
    .replace(/\s+/g, " ");
}

function getExpected(context, fieldId) {
  const answerObj = context?.answers?.[fieldId];
  if (answerObj && typeof answerObj === "object" && "value" in answerObj) {
    return answerObj;
  }
  const directObj = context?.[fieldId];
  if (directObj && typeof directObj === "object" && "value" in directObj) {
    return directObj;
  }
  return { value: undefined, tolerance: 0 };
}

function gradeNumeric(answer, expectedObj) {
  const numeric = Number(String(answer).replace(/,/g, "").trim());
  if (!Number.isFinite(numeric)) {
    return { score: "I", feedback: "Please enter a valid number." };
  }

  const expected = Number(expectedObj.value);
  const tolerance = Number(expectedObj.tolerance ?? 0.01);
  const diff = Math.abs(numeric - expected);

  if (diff <= tolerance) {
    return { score: "E", feedback: "Correct!" };
  }
  if (diff <= Math.max(tolerance * 4, 0.1)) {
    return { score: "P", feedback: `Close. Re-check the constant of variation. Correct answer: ${expected}.` };
  }
  return { score: "I", feedback: `Incorrect. Correct answer: ${expected}.` };
}

function gradeExact(answer, expectedText, fallbackFeedback) {
  if (normalize(answer) === normalize(expectedText)) {
    return { score: "E", feedback: "Correct!" };
  }
  return { score: "I", feedback: fallbackFeedback || `Incorrect. Correct answer: ${expectedText}.` };
}

export function gradeField(fieldId, answer, context) {
  if (answer === null || answer === undefined || String(answer).trim() === "") {
    return { score: "I", feedback: "Please enter or select an answer." };
  }

  const expectedObj = getExpected(context, fieldId);

  if (fieldId === "missingValue" || fieldId === "applicationAnswer") {
    return gradeNumeric(answer, expectedObj);
  }

  if (fieldId === "equationChoice") {
    return gradeExact(
      answer,
      expectedObj.value,
      "Incorrect. Inverse variation uses y = k/x, not direct variation."
    );
  }

  if (fieldId === "horizontalAsymptote") {
    if (normalize(answer) === normalize(context?.verticalAsymptote)) {
      return {
        score: "P",
        feedback: "You selected the vertical asymptote. For y = a/(x-h) + k, the horizontal asymptote is y = k."
      };
    }
    return gradeExact(
      answer,
      expectedObj.value,
      `Incorrect. The horizontal asymptote is ${expectedObj.value}.`
    );
  }

  if (fieldId === "translatedEquation" || fieldId === "translatedVariationEquation") {
    return gradeExact(
      answer,
      expectedObj.value,
      "Incorrect. Watch the opposite sign inside the denominator and the matching sign outside the fraction."
    );
  }

  return gradeExact(answer, expectedObj.value);
}

export function getRule() {
  return null;
}

export default { gradeField, getRule };
