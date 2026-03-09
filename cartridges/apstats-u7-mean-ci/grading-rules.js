// grading-rules.js - AP Statistics Unit 7 Topics 7.1 and 7.2

function normalize(str) {
  return String(str).trim().toLowerCase();
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some(k => norm.includes(normalize(k)));
}

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;

  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;

  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;

  const openResponseFields = new Set(["conditionsExplain"]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter your explanation." };
    }
    if (fieldId === "tStarAnswer" || fieldId === "meAnswer" || fieldId === "ciLower" || fieldId === "ciUpper" || fieldId === "simProbAnswer") {
      return { score: "I", feedback: "Please enter a number." };
    }
    return { score: "I", feedback: "Please select an answer." };
  }

  const studentNorm = normalize(answer);
  const expectedNorm = normalize(expected);

  if (fieldId === "procedureAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. This is one sample of quantitative data, and the goal is to estimate a population mean with an interval."
      };
    }
    if (containsAny(answer, ["z-interval", "proportion"])) {
      return {
        score: "I",
        feedback: `Incorrect. ${expected} is used here because the parameter is a mean, not a proportion.`
      };
    }
    if (containsAny(answer, ["t-test", "significance test"])) {
      return {
        score: "I",
        feedback: `Incorrect. ${expected} is an interval procedure, not a test procedure.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct procedure is ${expected}. Look for one sample, quantitative data, and estimating mu.`
    };
  }

  if (fieldId === "conditionsMet") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You correctly decided whether all conditions for a one-sample t-interval are satisfied."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct decision is: ${expected}. Recheck random selection, the 10% condition, and n >= 30 or the sample-shape requirement.`
    };
  }

  if (fieldId === "conditionsExplain") {
    const groups = context?.explanationGroups || [];
    const hasSubstance = String(answer).trim().split(/\s+/).length >= 8;
    const matchedGroups = groups.filter(group => containsAny(answer, group)).length;

    if (matchedGroups >= 3 && hasSubstance) {
      return {
        score: "E",
        feedback: "Strong explanation. You addressed the random condition, the 10% condition, and the normality or sample-shape condition."
      };
    }
    if (matchedGroups >= 2 && hasSubstance) {
      return {
        score: "P",
        feedback: "Partially correct. Include all three checks: random, 10%, and either n >= 30 or no strong skewness or outliers when n < 30."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should mention all three conditions: random sample, 10% condition, and either n >= 30 or no strong skewness or outliers when n < 30."
    };
  }

  if (fieldId === "tStarAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.015;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number for t*." };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The critical value is t* = ${expectedVal} using a t distribution with df = n - 1.`
      };
    }
    if (Math.abs(studentVal - 1.645) <= 0.02 || Math.abs(studentVal - 1.96) <= 0.02 || Math.abs(studentVal - 2.576) <= 0.02) {
      return {
        score: "I",
        feedback: `It looks like you used a z critical value. For a confidence interval for a mean, use t* with df = n - 1. The correct value is ${expectedVal}.`
      };
    }
    if (diff <= 0.06) {
      return {
        score: "P",
        feedback: `Close. Recheck the confidence level and degrees of freedom. The correct t* is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use a t distribution with df = n - 1. The correct critical value is ${expectedVal}.`
    };
  }

  if (fieldId === "meAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.03;
    const se = parseFloat(context?.se ?? "");

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number." };
    }
    if (!isNaN(se) && Math.abs(studentVal - se) <= 0.03 && diff > tolerance) {
      return {
        score: "I",
        feedback: `It looks like you entered the standard error instead of the margin of error. Multiply the standard error by t*. The correct margin of error is ${expectedVal}.`
      };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. Margin of error = t* x s / sqrt(n) = ${expectedVal}.`
      };
    }
    if (diff <= 0.12) {
      return {
        score: "P",
        feedback: `Close. Recheck the arithmetic in t* x s / sqrt(n). The margin of error is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use ME = t* x s / sqrt(n). The correct margin of error is ${expectedVal}.`
    };
  }

  if (fieldId === "ciLower") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const upperObj = getExpectedObj(context, "ciUpper");
    const upperVal = parseFloat(upperObj.value);
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.03;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number." };
    }
    if (!isNaN(upperVal) && Math.abs(studentVal - upperVal) <= tolerance && diff > tolerance) {
      return {
        score: "I",
        feedback: `You swapped the interval bounds. The lower bound is ${expectedVal} and the upper bound is ${upperVal}.`
      };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The lower bound is x-bar - ME = ${expectedVal}.`
      };
    }
    if (diff <= 0.12) {
      return {
        score: "P",
        feedback: `Close. Recheck x-bar - ME. The lower bound is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Subtract the margin of error from x-bar. The lower bound is ${expectedVal}.`
    };
  }

  if (fieldId === "ciUpper") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const lowerObj = getExpectedObj(context, "ciLower");
    const lowerVal = parseFloat(lowerObj.value);
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.03;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number." };
    }
    if (!isNaN(lowerVal) && Math.abs(studentVal - lowerVal) <= tolerance && diff > tolerance) {
      return {
        score: "I",
        feedback: `You swapped the interval bounds. The lower bound is ${lowerVal} and the upper bound is ${expectedVal}.`
      };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The upper bound is x-bar + ME = ${expectedVal}.`
      };
    }
    if (diff <= 0.12) {
      return {
        score: "P",
        feedback: `Close. Recheck x-bar + ME. The upper bound is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Add the margin of error to x-bar. The upper bound is ${expectedVal}.`
    };
  }

  if (fieldId === "evidenceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The evidence is the observed difference in the sample means, compared with the null value of 0."
      };
    }
    if (containsAny(answer, ["expected difference", "= 0"])) {
      return {
        score: "I",
        feedback: "That is the null benchmark, not the evidence. The evidence is the observed difference in sample means from the study."
      };
    }
    if (containsAny(answer, ["sample mean"])) {
      return {
        score: "I",
        feedback: "A single sample mean is not the evidence by itself. Compare the two groups using their difference in sample means."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The evidence is ${expected}.`
    };
  }

  if (fieldId === "nullDiffAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const observedDiff = parseFloat(context?.observedDiff ?? "");
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.01;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please choose a valid value." };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: "Correct. If there is no treatment effect, the difference in sample means should be centered at 0."
      };
    }
    if (!isNaN(observedDiff) && Math.abs(Math.abs(studentVal) - observedDiff) <= 0.02) {
      return {
        score: "I",
        feedback: "It looks like you used the observed difference from the study. Under the no-effect model, the expected difference is 0."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. If the treatment makes no difference, the expected difference in sample means is 0."
    };
  }

  if (fieldId === "chanceExplainAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Explanation 1 says there is no real effect and the observed difference came from chance variation in the random assignment."
      };
    }
    if (containsAny(answer, ["real treatment effect", "causes"])) {
      return {
        score: "I",
        feedback: "That describes the real-effect explanation, not the chance-variation explanation."
      };
    }
    if (containsAny(answer, ["expected difference"])) {
      return {
        score: "I",
        feedback: "That is the null expectation, not one of the two explanations for the observed evidence."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The chance-only explanation is: ${expected}`
    };
  }

  if (fieldId === "simProbAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.002;
    const tailCount = parseFloat(context?.tailCount ?? "");

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a valid decimal probability." };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The estimated probability is ${expectedVal}, found by dividing the tail count by the total number of simulations.`
      };
    }
    if (Math.abs(studentVal - expectedVal * 100) <= 0.2) {
      return {
        score: "I",
        feedback: `It looks like you entered a percent instead of a decimal. The decimal probability is ${expectedVal}.`
      };
    }
    if (!isNaN(tailCount) && Math.abs(studentVal - tailCount) <= 0.5) {
      return {
        score: "I",
        feedback: `It looks like you entered the tail count instead of tail count divided by total simulations. The probability is ${expectedVal}.`
      };
    }
    if (diff <= 0.01) {
      return {
        score: "P",
        feedback: `Close. Recheck tail count divided by total simulations. The probability is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Divide the tail count by the total number of simulations. The probability is ${expectedVal}.`
    };
  }

  if (fieldId === "conclusionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You matched the simulation result to the right conclusion about whether the evidence is convincing."
      };
    }
    if (containsAny(answer, ["proves with certainty", "prove with certainty"])) {
      return {
        score: "I",
        feedback: "A simulation can provide convincing evidence, but it does not prove the claim with certainty."
      };
    }
    if (context?.convincingEvidence === "yes" && containsAny(answer, ["chance variation is still", "still the best explanation"])) {
      return {
        score: "I",
        feedback: "When the simulated probability is small, chance variation is no longer a convincing explanation for the observed difference."
      };
    }
    if (context?.convincingEvidence === "no" && containsAny(answer, ["any positive observed difference", "convincing evidence"])) {
      return {
        score: "I",
        feedback: "A positive difference alone is not enough. If the simulated probability is not small, chance variation is still plausible."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The best conclusion is: ${expected}`
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
