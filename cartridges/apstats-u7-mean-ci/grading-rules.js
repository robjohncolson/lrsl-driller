// grading-rules.js - AP Statistics Unit 7 Topics 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, and 7.9

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

const H0 = "H\u2080";
const HA = "H\u2090";
const NEQ = "\u2260";

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

  const openResponseFields = new Set(["conditionsExplain", "testConditionsExplain", "diffMeansConditionsExplain"]);

  if (isBlank(answer)) {
    if (openResponseFields.has(fieldId)) {
      return { score: "I", feedback: "Please enter your explanation." };
    }
    if (fieldId === "tStarAnswer" || fieldId === "meAnswer" || fieldId === "ciLower" || fieldId === "ciUpper" || fieldId === "simProbAnswer" || fieldId === "testStatisticAnswer" || fieldId === "diffMeansMeAnswer" || fieldId === "diffMeansCiLower" || fieldId === "diffMeansCiUpper" || fieldId === "diffMeansTestStatisticAnswer") {
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

  if (fieldId === "diffMeansProcedureAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. There are two groups of quantitative data, and the goal is to estimate a difference in population means with an interval."
      };
    }
    if (containsAny(answer, ["z-interval", "proportion"])) {
      return {
        score: "I",
        feedback: `Incorrect. ${expected} is used here because the parameter is a difference in means, not a proportion.`
      };
    }
    if (containsAny(answer, ["t-test", "significance test"])) {
      return {
        score: "I",
        feedback: `Incorrect. ${expected} is an interval procedure, not a test procedure.`
      };
    }
    if (containsAny(answer, ["one-sample"])) {
      return {
        score: "I",
        feedback: `Incorrect. This problem compares two groups, so a one-sample procedure is not appropriate. The correct procedure is ${expected}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct procedure is ${expected}. Look for two groups, quantitative data, and estimating mu1 - mu2.`
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

  if (fieldId === "diffMeansConditionsMet") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You correctly decided whether all conditions for a two-sample t-interval are satisfied."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct decision is: ${expected}. Recheck independence, the 10% condition when sampling applies, and whether both samples are large enough or roughly normal.`
    };
  }

  if (fieldId === "diffMeansConditionsExplain") {
    const groups = context?.explanationGroups || [];
    const hasSubstance = String(answer).trim().split(/\s+/).length >= 8;
    const matchedGroups = groups.filter(group => containsAny(answer, group)).length;

    if (matchedGroups >= 3 && hasSubstance) {
      return {
        score: "E",
        feedback: "Strong explanation. You addressed independence, the 10% condition when relevant, and the normality or sample-shape condition for both groups."
      };
    }
    if (matchedGroups >= 2 && hasSubstance) {
      return {
        score: "P",
        feedback: "Partially correct. Include independence, the 10% condition when it applies, and either both sample sizes at least 30 or both sample distributions with no strong skewness or outliers."
      };
    }
    return {
      score: "I",
      feedback: "Your explanation should mention independence, the 10% condition when it applies, and either both sample sizes at least 30 or both sample distributions with no strong skewness or outliers."
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

  if (fieldId === "diffMeansMeAnswer") {
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
        feedback: `Correct. Margin of error = t* x sqrt((s1^2 / n1) + (s2^2 / n2)) = ${expectedVal}.`
      };
    }
    if (diff <= 0.12) {
      return {
        score: "P",
        feedback: `Close. Recheck the arithmetic in t* x sqrt((s1^2 / n1) + (s2^2 / n2)). The margin of error is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use ME = t* x sqrt((s1^2 / n1) + (s2^2 / n2)). The correct margin of error is ${expectedVal}.`
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

  if (fieldId === "diffMeansCiLower") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const upperObj = getExpectedObj(context, "diffMeansCiUpper");
    const upperVal = parseFloat(upperObj.value);
    const reverseLower = parseFloat(context?.reverseLower ?? "");
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
    if (!isNaN(reverseLower) && Math.abs(studentVal - reverseLower) <= tolerance && diff > tolerance) {
      return {
        score: "I",
        feedback: "It looks like you reversed the subtraction order and found group 2 minus group 1 instead of group 1 minus group 2."
      };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The lower bound is (x-bar1 - x-bar2) - ME = ${expectedVal}.`
      };
    }
    if (diff <= 0.12) {
      return {
        score: "P",
        feedback: `Close. Recheck the point estimate minus the margin of error. The lower bound is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Subtract the margin of error from x-bar1 - x-bar2. The lower bound is ${expectedVal}.`
    };
  }

  if (fieldId === "diffMeansCiUpper") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const lowerObj = getExpectedObj(context, "diffMeansCiLower");
    const lowerVal = parseFloat(lowerObj.value);
    const reverseUpper = parseFloat(context?.reverseUpper ?? "");
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
    if (!isNaN(reverseUpper) && Math.abs(studentVal - reverseUpper) <= tolerance && diff > tolerance) {
      return {
        score: "I",
        feedback: "It looks like you reversed the subtraction order and found group 2 minus group 1 instead of group 1 minus group 2."
      };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The upper bound is (x-bar1 - x-bar2) + ME = ${expectedVal}.`
      };
    }
    if (diff <= 0.12) {
      return {
        score: "P",
        feedback: `Close. Recheck the point estimate plus the margin of error. The upper bound is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Add the margin of error to x-bar1 - x-bar2. The upper bound is ${expectedVal}.`
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

  if (fieldId === "intervalInterpretAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. A confidence interval is interpreted as capturing the population mean in context, not as a probability statement about one fixed interval."
      };
    }
    if (containsAny(answer, ["probability"])) {
      return {
        score: "I",
        feedback: "Do not attach the confidence level as a probability to one specific interval. Interpret the interval as capturing the population mean in context."
      };
    }
    if (containsAny(answer, ["have values between", "% of"])) {
      return {
        score: "I",
        feedback: "That treats the interval as describing individual observations. The interval is about the population mean, not the percent of individuals in the population."
      };
    }
    if (containsAny(answer, ["sample mean", "chance of falling"])) {
      return {
        score: "I",
        feedback: "The interval is estimating the population mean. It is not a probability statement about the sample mean."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. A correct interpretation is: ${expected}`
    };
  }

  if (fieldId === "diffMeansIntervalInterpretAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. A confidence interval for two means is interpreted as a plausible range for the population difference in means in the stated order."
      };
    }
    if (containsAny(answer, ["probability"])) {
      return {
        score: "I",
        feedback: "Do not attach the confidence level as a probability to one fixed interval. Interpret the interval as capturing the population difference in means."
      };
    }
    if (containsAny(answer, ["about", "% of", "individual"])) {
      return {
        score: "I",
        feedback: "That treats the interval as describing individual observations. The interval is about the population difference in means."
      };
    }
    if (containsAny(answer, [context?.reversedParameter])) {
      return {
        score: "I",
        feedback: "Be careful with the subtraction order. Interpret the interval using the same order as the problem, not the reversed difference."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. A correct interpretation is: ${expected}`
    };
  }

  if (fieldId === "diffMeansZeroValueAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. If the two population means are equal, their difference is 0."
      };
    }
    if (studentNorm === normalize(context?.pointEstimate)) {
      return {
        score: "I",
        feedback: "That is the center of the interval, not the no-difference benchmark. Equal population means correspond to a difference of 0."
      };
    }
    if (studentNorm === normalize(context?.lower) || studentNorm === normalize(context?.upper)) {
      return {
        score: "I",
        feedback: "Those are interval bounds, not the null value for no difference. If the two population means are equal, the difference equals 0."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. If the two population means are equal, ${context?.differenceLabel} = 0.`
    };
  }

  if (fieldId === "diffMeansZeroPlausibleAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Whether 0 is plausible depends on whether 0 falls inside the confidence interval."
      };
    }
    if (containsAny(answer, ["always", "never"])) {
      return {
        score: "I",
        feedback: "Do not use an always-or-never rule. Check whether 0 is actually inside the interval."
      };
    }
    if (context?.containsZero === "yes" && containsAny(answer, ["outside", "not plausible", "not inside"])) {
      return {
        score: "I",
        feedback: "0 is inside this interval, so no difference is still a plausible value."
      };
    }
    if (context?.containsZero === "no" && containsAny(answer, ["inside", "plausible"])) {
      return {
        score: "I",
        feedback: "0 is not inside this interval, so no difference is not a plausible value here."
      };
    }
    if (context?.containsZero === "yes") {
      return {
        score: "I",
        feedback: "Incorrect. Because 0 is inside the interval, no difference is a plausible value."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Because 0 is not inside the interval, no difference is not a plausible value."
    };
  }

  if (fieldId === "diffMeansClaimJustifyAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You used whether 0 is a plausible value for the population difference to judge the claim."
      };
    }
    if (containsAny(answer, ["certainty", "prove"])) {
      return {
        score: "I",
        feedback: "A confidence interval can support or fail to support a claim, but it does not prove the claim with certainty."
      };
    }
    if (containsAny(answer, ["sample means were different", "sample mean"])) {
      return {
        score: "I",
        feedback: "Do not justify the claim using only the sample means. Use the entire confidence interval and whether 0 is plausible."
      };
    }
    if (context?.supportClaim === "yes" && containsAny(answer, ["0 is in the interval", "0 is a plausible value"])) {
      return {
        score: "I",
        feedback: `0 is not in the interval here, so the interval does support the claim that ${context?.claim}.`
      };
    }
    if (context?.supportClaim === "no" && containsAny(answer, ["0 is not in the interval", "0 is not a plausible value"])) {
      return {
        score: "I",
        feedback: `0 is in the interval here, so the interval does not support the claim that ${context?.claim}.`
      };
    }
    if (context?.supportClaim === "no" && containsAny(answer, ["exactly equal"])) {
      return {
        score: "I",
        feedback: "If 0 is in the interval, no difference is plausible, but the interval does not prove the two population means are exactly equal."
      };
    }
    if (context?.supportClaim === "yes") {
      return {
        score: "I",
        feedback: `Incorrect. Because 0 is not in the interval, the interval supports the claim that ${context?.claim}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Because 0 is in the interval, the interval does not support the claim that ${context?.claim}.`
    };
  }

  if (fieldId === "diffMeansClaimConclusionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The conclusion is stated carefully in context without overclaiming."
      };
    }
    if (containsAny(answer, ["certainty", "prove"])) {
      return {
        score: "I",
        feedback: "A confidence interval can provide convincing statistical evidence, but it does not prove a claim with certainty."
      };
    }
    if (containsAny(answer, ["is wrong"])) {
      return {
        score: "I",
        feedback: "Do not say the person making the claim is wrong. State only whether the interval supports the claim."
      };
    }
    if (context?.supportClaim === "yes" && containsAny(answer, ["cannot be used", "cannot use"])) {
      return {
        score: "I",
        feedback: "A confidence interval can be used to make a conclusion about a difference in population means."
      };
    }
    if (context?.supportClaim === "yes" && containsAny(answer, ["every individual"])) {
      return {
        score: "I",
        feedback: "The interval is about the population difference in means, not every individual observation."
      };
    }
    if (context?.supportClaim === "no" && containsAny(answer, ["opposite claim is true"])) {
      return {
        score: "I",
        feedback: "If the interval does not support the claim, that does not prove the opposite claim is true."
      };
    }
    if (context?.supportClaim === "yes") {
      return {
        score: "I",
        feedback: `Incorrect. The interval provides convincing evidence that ${context?.claim}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The interval does not support the claim that ${context?.claim}.`
    };
  }

  if (fieldId === "diffMeansConfidenceLevelAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Confidence level describes the long-run capture rate of intervals for the population difference in means."
      };
    }
    if (containsAny(answer, ["probability", "this one interval"])) {
      return {
        score: "I",
        feedback: "Confidence level is not the probability that one fixed interval captures the population difference. It describes repeated random sampling."
      };
    }
    if (containsAny(answer, ["individual observations", "fall inside"])) {
      return {
        score: "I",
        feedback: "That describes individual observations, not the long-run behavior of confidence intervals for the population difference in means."
      };
    }
    if (containsAny(answer, ["sample differences", "will equal"])) {
      return {
        score: "I",
        feedback: "Confidence level is not about sample differences equaling the population difference. It is about the proportion of intervals that capture it."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. A correct interpretation is: ${expected}`
    };
  }

  if (fieldId === "diffMeansNullHypothesisAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The null hypothesis states no difference, so the population mean difference is 0."
      };
    }
    if (containsAny(answer, ["x-bar", "sample mean"])) {
      return {
        score: "I",
        feedback: "Do not use sample statistics in the null hypothesis. State the null using the population means."
      };
    }
    if (containsAny(answer, [">", "<", NEQ, "!="])) {
      return {
        score: "I",
        feedback: "The null hypothesis should use an equals sign and set the difference in population means equal to 0."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The null hypothesis should state no difference: ${expected}.`
    };
  }

  if (fieldId === "diffMeansAlternativeHypothesisAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The alternative hypothesis uses a strict inequality that matches the claim about the two population means."
      };
    }
    if (containsAny(answer, ["x-bar", "sample mean"])) {
      return {
        score: "I",
        feedback: "Do not use sample statistics in the alternative hypothesis. Use the population means."
      };
    }
    if (containsAny(answer, [" = 0", " = "])) {
      return {
        score: "I",
        feedback: `The alternative hypothesis should not use an equals sign. Use a strict inequality instead: ${expected}`
      };
    }
    if (context?.relation === "!=" && containsAny(answer, [">", "<"])) {
      return {
        score: "I",
        feedback: `This claim is about whether the two means differ, so the alternative should be two-sided: ${expected}`
      };
    }
    if (context?.relation !== "!=" && containsAny(answer, [NEQ, "!="])) {
      return {
        score: "I",
        feedback: `This claim is directional, so use a one-sided alternative instead of a two-sided one: ${expected}`
      };
    }
    if (context?.relation === ">" && containsAny(answer, ["<"])) {
      return {
        score: "I",
        feedback: `The claim says the first population mean is larger, so the inequality should point right: ${expected}`
      };
    }
    if (context?.relation === "<" && containsAny(answer, [">"])) {
      return {
        score: "I",
        feedback: `The claim says the first population mean is smaller, so the inequality should point left: ${expected}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct alternative hypothesis is ${expected}.`
    };
  }

  if (fieldId === "diffMeansAlternativeTypeAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The wording of the claim tells you whether the alternative should be one-sided or two-sided."
      };
    }
    if (containsAny(answer, ["null hypothesis"])) {
      return {
        score: "I",
        feedback: `You still need an alternative hypothesis. The best choice here is: ${expected}`
      };
    }
    if (context?.relation === "!=" && containsAny(answer, ["one-sided", ">", "<"])) {
      return {
        score: "I",
        feedback: "Because the claim only asks whether the means are different, the alternative should be two-sided."
      };
    }
    if (context?.relation !== "!=" && containsAny(answer, ["two-sided"])) {
      return {
        score: "I",
        feedback: "Because the claim gives a direction, the alternative should be one-sided."
      };
    }
    if (context?.relation === ">" && containsAny(answer, ["<", "opposite direction"])) {
      return {
        score: "I",
        feedback: "The claim says the first group's mean is larger, not smaller."
      };
    }
    if (context?.relation === "<" && containsAny(answer, [">", "opposite direction"])) {
      return {
        score: "I",
        feedback: "The claim says the first group's mean is smaller, not larger."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The best description is: ${expected}`
    };
  }

  if (fieldId === "diffMeansReverseOrderAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. When you reverse the subtraction order in a one-sided hypothesis, you must also reverse the inequality."
      };
    }
    if (studentNorm === normalize(context?.reverseSameSignText)) {
      return {
        score: "I",
        feedback: `You reversed the subtraction order but kept the same inequality. Reverse the inequality too. The equivalent hypothesis is ${expected}.`
      };
    }
    if (studentNorm === normalize(context?.originalAlternativeText)) {
      return {
        score: "I",
        feedback: "That is the original hypothesis, not the version with the subtraction order reversed."
      };
    }
    if (containsAny(answer, ["x-bar", "sample mean"])) {
      return {
        score: "I",
        feedback: "Use population means in the hypothesis, not sample means."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Reversing the order requires reversing the inequality. The correct hypothesis is ${expected}.`
    };
  }

  if (fieldId === "diffMeansParameterDefinitionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The parameters are the two population means in context."
      };
    }
    if (containsAny(answer, ["x-bar", "sample mean"])) {
      return {
        score: "I",
        feedback: "That defines sample statistics, not the population parameters used in the hypotheses."
      };
    }
    if (containsAny(answer, ["one person", "one word", "one container", "one call"])) {
      return {
        score: "I",
        feedback: "A parameter is not one individual value. It is a population mean for a group."
      };
    }
    if (studentNorm === normalize(context?.swappedDefinitionText)) {
      return {
        score: "I",
        feedback: "The subscripts are reversed. Make sure each symbol is matched to the correct group."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct parameter definition is: ${expected}`
    };
  }

  if (fieldId === "claimJustifyAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You used the location of the claim value relative to the interval to decide whether the claim is supported."
      };
    }
    if (containsAny(answer, ["proves with certainty", "prove with certainty"])) {
      return {
        score: "I",
        feedback: "A confidence interval can support or fail to support a claim, but it does not prove a claim with certainty."
      };
    }
    if (containsAny(answer, ["cannot be used"])) {
      return {
        score: "I",
        feedback: "A confidence interval can be used to judge whether a claimed population mean is plausible."
      };
    }
    if (containsAny(answer, ["sample mean is not exactly", "sample mean"])) {
      return {
        score: "I",
        feedback: "Do not base the decision only on the sample mean. Compare the claimed benchmark to the entire confidence interval."
      };
    }
    if (context?.relation === "inside") {
      return {
        score: "I",
        feedback: `Incorrect. Because ${context?.benchmark} ${context?.units} is inside the interval, it is a plausible value for the population mean, so the claim is not supported.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Because the entire interval is on one side of ${context?.benchmark} ${context?.units}, the interval supports the claim. The best conclusion is: ${expected}`
    };
  }

  if (fieldId === "confidenceLevelAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Confidence level describes the long-run capture rate of intervals from repeated random sampling."
      };
    }
    if (containsAny(answer, ["probability", "this one interval"])) {
      return {
        score: "I",
        feedback: "Confidence level is not the probability that one specific interval captures the population mean. It describes what happens over many random samples."
      };
    }
    if (containsAny(answer, ["individual", "have values inside"])) {
      return {
        score: "I",
        feedback: "That describes individual observations. Confidence level is about the proportion of intervals that capture the population mean."
      };
    }
    if (containsAny(answer, ["sample means", "will equal"])) {
      return {
        score: "I",
        feedback: "Confidence level is not about sample means equaling the population mean. It is about the proportion of intervals that capture the population mean."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. A correct interpretation is: ${expected}`
    };
  }

  if (fieldId === "sampleSizeEffectAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. For a mean interval, margin of error is proportional to 1 / sqrt(n), so quadrupling n cuts the margin of error about in half."
      };
    }
    if (containsAny(answer, ["doubles"])) {
      return {
        score: "I",
        feedback: "Increasing sample size makes the margin of error smaller, not larger."
      };
    }
    if (containsAny(answer, ["one-fourth"])) {
      return {
        score: "I",
        feedback: "Margin of error is tied to 1 / sqrt(n), not 1 / n. Quadrupling the sample size cuts the margin of error about in half, not to one-fourth."
      };
    }
    if (containsAny(answer, ["stays the same"])) {
      return {
        score: "I",
        feedback: "Changing the sample size changes the standard error. A larger sample size makes the margin of error smaller."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct effect is: ${expected}`
    };
  }

  if (fieldId === "confidenceLevelEffectAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Lower confidence uses a smaller critical value, so the margin of error gets smaller."
      };
    }
    if (containsAny(answer, ["gets larger"])) {
      return {
        score: "I",
        feedback: "When the confidence level decreases, the critical value decreases too, so the margin of error gets smaller, not larger."
      };
    }
    if (containsAny(answer, ["stays the same"])) {
      return {
        score: "I",
        feedback: "Even with the same sample size, changing the confidence level changes the critical value and therefore changes the margin of error."
      };
    }
    if (containsAny(answer, ["becomes 0"])) {
      return {
        score: "I",
        feedback: "Lowering the confidence level makes the interval narrower, but the margin of error does not become 0."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct effect is: ${expected}`
    };
  }

  if (fieldId === "nullHypothesisAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The null hypothesis is a statement of equality about the population mean mu."
      };
    }
    if (containsAny(answer, ["x-bar", "sample mean"])) {
      return {
        score: "I",
        feedback: "Do not use a sample statistic in the null hypothesis. State the null using the population mean mu."
      };
    }
    if (containsAny(answer, [">", "<", "≠"])) {
      return {
        score: "I",
        feedback: "The null hypothesis should use an equals sign. Inequalities belong in the alternative hypothesis."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct null hypothesis is ${expected}.`
    };
  }

  if (fieldId === "alternativeHypothesisAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The alternative hypothesis uses a strict inequality that matches the research question."
      };
    }
    if (containsAny(answer, ["x-bar", "sample mean"])) {
      return {
        score: "I",
        feedback: "Do not use a sample statistic in the alternative hypothesis. State the claim using the population mean mu."
      };
    }
    if (containsAny(answer, [" = "])) {
      return {
        score: "I",
        feedback: "The alternative hypothesis should not use an equals sign. Use <, >, or not equal to."
      };
    }
    if (context?.relation === "!=") {
      return {
        score: "I",
        feedback: `Incorrect. The question asks whether the mean differs from ${context?.benchmark}, so the alternative should be two-sided: ${expected}`
      };
    }
    if (context?.relation === ">") {
      return {
        score: "I",
        feedback: `Incorrect. The question asks whether the mean is greater than ${context?.benchmark}, so the alternative should be right-sided: ${expected}`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The question asks whether the mean is less than ${context?.benchmark}, so the alternative should be left-sided: ${expected}`
    };
  }

  if (fieldId === "parameterDefinitionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. Mu represents the population mean in context."
      };
    }
    if (containsAny(answer, ["sample mean", "x-bar", "sample"])) {
      return {
        score: "I",
        feedback: "That describes a sample statistic, not the population parameter mu."
      };
    }
    if (containsAny(answer, ["one student", "one tread40 tire", "one cb tablet", "one "])) {
      return {
        score: "I",
        feedback: "Mu is not one individual value. It represents the mean for the whole population in context."
      };
    }
    if (containsAny(answer, ["total"])) {
      return {
        score: "I",
        feedback: "Mu is a mean, not a total."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The parameter is ${expected}.`
    };
  }

  if (fieldId === "testProcedureAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. This is one sample of quantitative data, and the goal is to test a claim about a population mean."
      };
    }
    if (containsAny(answer, ["t-interval", "interval"])) {
      return {
        score: "I",
        feedback: `Incorrect. ${expected} is a test procedure. An interval would be used to estimate, not test, the population mean.`
      };
    }
    if (containsAny(answer, ["z-test", "proportion"])) {
      return {
        score: "I",
        feedback: `Incorrect. ${expected} is used here because the parameter is a mean, not a proportion.`
      };
    }
    if (containsAny(answer, ["two-sample"])) {
      return {
        score: "I",
        feedback: "Only one sample is being used here, so a two-sample procedure is not appropriate."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct procedure is ${expected}.`
    };
  }

  if (fieldId === "testConditionsMet") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You correctly decided whether all conditions for a one-sample t-test are satisfied."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct decision is: ${expected}. Recheck random selection, the 10% condition, and n >= 30 or the sample-shape requirement.`
    };
  }

  if (fieldId === "testConditionsExplain") {
    const groups = context?.explanationGroups || [];
    const hasSubstance = String(answer).trim().split(/\s+/).length >= 8;
    const matchedGroups = groups.filter(group => containsAny(answer, group)).length;

    if (matchedGroups >= 3 && hasSubstance) {
      return {
        score: "E",
        feedback: "Strong explanation. You addressed the random condition, the 10% condition, and the normality or sample-shape condition for the test."
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

  if (fieldId === "testStatisticAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.02;
    const sampleStatisticValue = parseFloat(context?.sampleStatisticValue ?? "");
    const nullValue = parseFloat(context?.nullValue ?? "");
    const se = parseFloat(context?.se ?? "");
    const rawDiff = sampleStatisticValue - nullValue;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number for the test statistic." };
    }
    if (!isNaN(rawDiff) && Math.abs(studentVal - rawDiff) <= 0.03 && diff > tolerance) {
      return {
        score: "I",
        feedback: `It looks like you used the raw difference instead of standardizing. Divide by the standard error. The correct test statistic is ${expectedVal}.`
      };
    }
    if (!isNaN(se) && Math.abs(studentVal - se) <= 0.03 && diff > tolerance) {
      return {
        score: "I",
        feedback: `It looks like you entered the standard error instead of the test statistic. The correct t-value is ${expectedVal}.`
      };
    }
    if (Math.abs(studentVal + expectedVal) <= 0.04 && Math.abs(expectedVal) > 0.05) {
      return {
        score: "I",
        feedback: `Your sign is flipped. Recheck statistic minus parameter in the numerator. The correct t-value is ${expectedVal}.`
      };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The standardized test statistic is t = ${expectedVal}.`
      };
    }
    if (diff <= 0.08) {
      return {
        score: "P",
        feedback: `Close. Recheck the arithmetic in (sample statistic - null value) / (s / sqrt(n)). The test statistic is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use t = (sample statistic - null value) / (s / sqrt(n)). The test statistic is ${expectedVal}.`
    };
  }

  if (fieldId === "diffMeansTestStatisticAnswer") {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);
    const diff = Math.abs(studentVal - expectedVal);
    const tolerance = expObj.tolerance || 0.02;
    const sampleStatisticValue = parseFloat(context?.sampleStatisticValue ?? "");
    const nullValue = parseFloat(context?.nullValue ?? "");
    const se = parseFloat(context?.se ?? "");
    const rawDiff = sampleStatisticValue - nullValue;

    if (isNaN(studentVal)) {
      return { score: "I", feedback: "Please enter a valid number for the test statistic." };
    }
    if (!isNaN(rawDiff) && Math.abs(studentVal - rawDiff) <= 0.03 && diff > tolerance) {
      return {
        score: "I",
        feedback: `It looks like you used the raw difference in sample means instead of standardizing. Divide by the standard error. The correct test statistic is ${expectedVal}.`
      };
    }
    if (!isNaN(se) && Math.abs(studentVal - se) <= 0.03 && diff > tolerance) {
      return {
        score: "I",
        feedback: `It looks like you entered the standard error instead of the test statistic. The correct t-value is ${expectedVal}.`
      };
    }
    if (Math.abs(studentVal + expectedVal) <= 0.04 && Math.abs(expectedVal) > 0.05) {
      return {
        score: "I",
        feedback: `Your sign is flipped. Recheck the subtraction order in the numerator. The correct t-value is ${expectedVal}.`
      };
    }
    if (diff <= tolerance) {
      return {
        score: "E",
        feedback: `Correct. The standardized two-sample test statistic is t = ${expectedVal}.`
      };
    }
    if (diff <= 0.08) {
      return {
        score: "P",
        feedback: `Close. Recheck the arithmetic in ((x-bar1 - x-bar2) - 0) / sqrt((s1^2 / n1) + (s2^2 / n2)). The test statistic is ${expectedVal}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Use t = ((x-bar1 - x-bar2) - 0) / sqrt((s1^2 / n1) + (s2^2 / n2)). The test statistic is ${expectedVal}.`
    };
  }

  if (fieldId === "pValueRegionAnswer" || fieldId === "diffMeansPValueRegionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. The p-value uses the tail area that matches the alternative hypothesis."
      };
    }
    if (context?.relation === "!=") {
      return {
        score: "I",
        feedback: "Incorrect. Because the alternative hypothesis is two-sided, the p-value must include both tails beyond the observed test statistic."
      };
    }
    if (context?.relation === ">") {
      return {
        score: "I",
        feedback: "Incorrect. Because the alternative hypothesis says greater than, use the right-tail probability beyond the observed t-value."
      };
    }
    return {
      score: "I",
      feedback: "Incorrect. Because the alternative hypothesis says less than, use the left-tail probability beyond the observed t-value."
    };
  }

  if (fieldId === "pValueAnswer" || fieldId === "diffMeansPValueAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You matched the test statistic and alternative hypothesis to the right p-value."
      };
    }
    if (context?.relation === "!=" && studentNorm === normalize(context?.oneTailText)) {
      return {
        score: "I",
        feedback: `You used only one tail. For a two-sided test, double the one-tail probability. The correct p-value is ${expected}.`
      };
    }
    if (context?.relation === "!=" && studentNorm === normalize(context?.complementText)) {
      return {
        score: "I",
        feedback: `You used the middle area instead of the tail areas. The correct p-value is ${expected}.`
      };
    }
    if (context?.relation === "!=" && studentNorm === normalize(context?.oneMinusTailText)) {
      return {
        score: "I",
        feedback: `You subtracted one tail from 1 instead of adding both tails. The correct p-value is ${expected}.`
      };
    }
    if (context?.relation !== "!=" && studentNorm === normalize(context?.doubledText)) {
      return {
        score: "I",
        feedback: `You doubled the tail probability, but this is a one-sided test. The correct p-value is ${expected}.`
      };
    }
    if (context?.relation !== "!=" && studentNorm === normalize(context?.halvedText)) {
      return {
        score: "I",
        feedback: `You used only part of the tail area. For a one-sided test, use the full tail probability in the direction of the alternative. The correct p-value is ${expected}.`
      };
    }
    if (context?.relation !== "!=" && studentNorm === normalize(context?.complementText)) {
      return {
        score: "I",
        feedback: `You used the wrong side of the distribution. The correct p-value is ${expected}.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The correct p-value is ${expected}.`
    };
  }

  if (fieldId === "pValueInterpretAnswer" || fieldId === "diffMeansPValueInterpretAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. A p-value is interpreted as the chance of getting a sample result this extreme or more extreme when the null hypothesis is true."
      };
    }
    if (normalize(answer).startsWith("there is a") && containsAny(answer, [context?.nullContext])) {
      return {
        score: "I",
        feedback: "The p-value is not the probability that the null hypothesis is true. Start by assuming the null is true, then describe the chance of a result this extreme."
      };
    }
    if (containsAny(answer, [context?.alternativeClaimText])) {
      return {
        score: "I",
        feedback: "The p-value is not the probability that the alternative claim is true."
      };
    }
    if (containsAny(answer, ["equals"])) {
      return {
        score: "I",
        feedback: "The p-value is about a sample result this extreme or more extreme, not the probability that the population parameter equals the sample statistic."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. A correct interpretation is: ${expected}`
    };
  }

  if (fieldId === "testConclusionAnswer" || fieldId === "diffMeansTestConclusionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You compared the p-value to alpha and stated the conclusion in context."
      };
    }
    if (containsAny(answer, ["certainty", "prove"])) {
      return {
        score: "I",
        feedback: "A significance test can provide convincing statistical evidence, but it does not prove a claim with certainty."
      };
    }
    if (context?.rejectNull === "yes" && containsAny(answer, ["fail to reject"])) {
      return {
        score: "I",
        feedback: `Because the p-value is smaller than alpha, you should reject ${H0}, not fail to reject it.`
      };
    }
    if (context?.rejectNull === "yes" && containsAny(answer, ["greater than alpha"])) {
      return {
        score: "I",
        feedback: `The p-value is not greater than alpha here. Since p-value = ${context?.pValueText} and alpha = ${context?.alphaText}, reject ${H0}.`
      };
    }
    if (context?.rejectNull === "no" && containsAny(answer, ["reject"])) {
      return {
        score: "I",
        feedback: `Because the p-value is larger than alpha, you should fail to reject ${H0}.`
      };
    }
    if (context?.rejectNull === "no" && containsAny(answer, ["less than alpha"])) {
      return {
        score: "I",
        feedback: `The p-value is not less than alpha here. Since p-value = ${context?.pValueText} and alpha = ${context?.alphaText}, fail to reject ${H0}.`
      };
    }
    if (context?.rejectNull === "no" && containsAny(answer, ["h₀ is true", "h0 is true"])) {
      return {
        score: "I",
        feedback: `Failing to reject ${H0} does not prove that the null hypothesis is true.`
      };
    }
    if (context?.rejectNull === "yes") {
      return {
        score: "I",
        feedback: `Incorrect. Since p-value = ${context?.pValueText} is less than alpha = ${context?.alphaText}, reject ${H0} and support the alternative.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Since p-value = ${context?.pValueText} is greater than alpha = ${context?.alphaText}, fail to reject ${H0}.`
    };
  }

  if (fieldId === "diffMeansComparePValueAlphaAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct. Since p-value = ${context?.pValueText} and alpha = ${context?.alphaText}, that is the right comparison to use.`
      };
    }
    if (context?.oppositeCompareText && studentNorm === normalize(context.oppositeCompareText)) {
      if (context?.rejectNull === "yes") {
        return {
          score: "I",
          feedback: `Incorrect. Since p-value = ${context?.pValueText} is less than or equal to alpha = ${context?.alphaText}, the correct comparison is ${expected}.`
        };
      }
      return {
        score: "I",
        feedback: `Incorrect. Since p-value = ${context?.pValueText} is greater than alpha = ${context?.alphaText}, the correct comparison is ${expected}.`
      };
    }
    if (context?.equalCompareText && studentNorm === normalize(context.equalCompareText)) {
      return {
        score: "I",
        feedback: `The two values are not equal here. Since p-value = ${context?.pValueText} and alpha = ${context?.alphaText}, the correct comparison is ${expected}.`
      };
    }
    if (context?.notComparableText && studentNorm === normalize(context.notComparableText)) {
      return {
        score: "I",
        feedback: "You should compare the p-value to alpha to decide whether to reject the null hypothesis."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Compare p-value = ${context?.pValueText} to alpha = ${context?.alphaText}. The correct comparison is ${expected}.`
    };
  }

  if (fieldId === "diffMeansTestDecisionAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct. Using p-value = ${context?.pValueText} and alpha = ${context?.alphaText}, that is the correct formal decision about ${H0}.`
      };
    }
    if (context?.wrongDecisionText && studentNorm === normalize(context.wrongDecisionText)) {
      if (context?.rejectNull === "yes") {
        return {
          score: "I",
          feedback: `Because p-value = ${context?.pValueText} is less than or equal to alpha = ${context?.alphaText}, reject ${H0}, not fail to reject it.`
        };
      }
      return {
        score: "I",
        feedback: `Because p-value = ${context?.pValueText} is greater than alpha = ${context?.alphaText}, fail to reject ${H0}, not reject it.`
      };
    }
    if (context?.acceptText && studentNorm === normalize(context.acceptText)) {
      return {
        score: "I",
        feedback: `Do not say accept ${H0}. The correct decision is to reject ${H0} or fail to reject ${H0}.`
      };
    }
    if ((context?.proveText && studentNorm === normalize(context.proveText)) || containsAny(answer, ["prove"])) {
      return {
        score: "I",
        feedback: "A hypothesis test does not prove a hypothesis. It only leads to reject or fail to reject the null."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Using p-value = ${context?.pValueText} and alpha = ${context?.alphaText}, the correct decision is ${expected}.`
    };
  }

  if (fieldId === "diffMeansStatSigAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: `Correct. Statistical significance is determined by whether the p-value is at or below alpha.`
      };
    }
    if (context?.oppositeSignificanceText && studentNorm === normalize(context.oppositeSignificanceText)) {
      if (context?.rejectNull === "yes") {
        return {
          score: "I",
          feedback: `Because p-value = ${context?.pValueText} is less than or equal to alpha = ${context?.alphaText}, the result is statistically significant.`
        };
      }
      return {
        score: "I",
        feedback: `Because p-value = ${context?.pValueText} is greater than alpha = ${context?.alphaText}, the result is not statistically significant at that alpha level.`
      };
    }
    if ((context?.nullFalseText && studentNorm === normalize(context.nullFalseText)) || containsAny(answer, ["null hypothesis is false", "h0 is false", "h₀ is false"])) {
      return {
        score: "I",
        feedback: "Statistical significance does not prove that the null hypothesis is false. It means the sample result would be unlikely if the null were true."
      };
    }
    if ((context?.zeroRequirementText && studentNorm === normalize(context.zeroRequirementText)) || containsAny(answer, ["equals 0", "value equals 0", "p-value equals 0"])) {
      return {
        score: "I",
        feedback: "A result does not need a p-value of 0 to be statistically significant. It only needs p-value <= alpha."
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. Compare p-value = ${context?.pValueText} to alpha = ${context?.alphaText}. The correct statement is ${expected}.`
    };
  }

  if (fieldId === "diffMeansEvidenceAnswer") {
    if (studentNorm === expectedNorm) {
      return {
        score: "E",
        feedback: "Correct. You turned the test decision into the right evidence statement without overstating what the test shows."
      };
    }
    if (context?.oppositeEvidenceText && studentNorm === normalize(context.oppositeEvidenceText)) {
      if (context?.rejectNull === "yes") {
        return {
          score: "I",
          feedback: `Because p-value = ${context?.pValueText} is less than or equal to alpha = ${context?.alphaText}, there is convincing statistical evidence for the alternative claim.`
        };
      }
      return {
        score: "I",
        feedback: `Because p-value = ${context?.pValueText} is greater than alpha = ${context?.alphaText}, there is not convincing statistical evidence for the alternative claim.`
      };
    }
    if ((context?.proofText && studentNorm === normalize(context.proofText)) || containsAny(answer, ["certainty", "prove"])) {
      return {
        score: "I",
        feedback: "A significance test can support a claim with statistical evidence, but it does not prove a population claim with certainty."
      };
    }
    if ((context?.sampleMeansText && studentNorm === normalize(context.sampleMeansText)) || containsAny(answer, ["sample means were different", "must be true"])) {
      return {
        score: "I",
        feedback: "A difference in the sample means alone does not prove the population claim. The conclusion depends on the p-value compared with alpha."
      };
    }
    if (context?.rejectNull === "no" && containsAny(answer, ["h₀ is true", "h0 is true"])) {
      return {
        score: "I",
        feedback: `Failing to reject ${H0} does not prove that ${H0} is true.`
      };
    }
    return {
      score: "I",
      feedback: `Incorrect. The best evidence statement is: ${expected}`
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
