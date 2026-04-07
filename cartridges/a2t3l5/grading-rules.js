// grading-rules.js — Zeros of Polynomial Functions
// Cartridge: a2t3l5

// ============ HELPERS ============

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/−/g, "-")
    .replace(/∞/g, "inf");
}

function isBlank(value) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some(keyword => norm.includes(normalize(keyword)));
}

function getExpectedObj(context, fieldId) {
  const direct = context?.[fieldId];
  if (direct && typeof direct === "object" && "value" in direct) {
    return direct;
  }

  const nested = context?.answers?.[fieldId];
  if (nested && typeof nested === "object" && "value" in nested) {
    return nested;
  }

  return { value: undefined, tolerance: 0 };
}

function parseNumberToken(token) {
  const cleaned = normalize(token).replace(/\s+/g, "");
  if (!cleaned) return null;

  if (/^[+-]?\d+\/[+-]?\d+$/.test(cleaned)) {
    const [numerator, denominator] = cleaned.split("/").map(Number);
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function approxEqual(left, right, epsilon = 1e-9) {
  if (left === right) return true;
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return Math.abs(left - right) <= epsilon;
}

function parseNumberList(answer) {
  const norm = normalize(answer);
  if (!norm) return [];
  if (/[x()][^)]+/.test(norm) && !norm.includes("{")) {
    return null;
  }

  const matches = norm.match(/[+-]?\d+(?:\.\d+)?(?:\/[+-]?\d+(?:\.\d+)?)?/g) || [];
  if (matches.length === 0) return [];

  const values = [];
  for (const match of matches) {
    const parsed = parseNumberToken(match);
    if (parsed === null) return null;
    if (!values.some(value => approxEqual(value, parsed))) {
      values.push(parsed);
    }
  }

  return values.sort((a, b) => a - b);
}

function countNumberMatches(actual, expected) {
  let hits = 0;
  for (const actualValue of actual) {
    if (expected.some(expectedValue => approxEqual(actualValue, expectedValue))) {
      hits += 1;
    }
  }
  return hits;
}

function normalizeBehavior(text) {
  const norm = normalize(text);
  if (norm.includes("cross")) return "cross";
  if (norm.includes("touch") || norm.includes("bounce")) return "touch";
  return null;
}

function parseReportAnswer(answer) {
  const norm = normalize(answer);
  if (!norm) return [];

  const segments = norm.includes(";")
    ? norm.split(";")
    : norm.match(/\([^)]*\)/g) || [norm];

  const reports = [];

  for (const segment of segments) {
    const cleaned = segment.replace(/[()]/g, "").trim();
    if (!cleaned) continue;

    const parts = cleaned.split(",").map(part => part.trim()).filter(Boolean);
    if (parts.length < 3) return null;

    const zero = parseNumberToken(parts[0]);
    const mult = parseNumberToken(parts[1]);
    const behavior = normalizeBehavior(parts.slice(2).join(" "));

    if (zero === null || mult === null || !Number.isFinite(mult) || !behavior) {
      return null;
    }

    reports.push({
      zero,
      mult: Number(mult),
      behavior
    });
  }

  return reports.sort((left, right) => left.zero - right.zero);
}

function sameReportsExact(actual, expected) {
  if (actual.length !== expected.length) return false;
  return actual.every((report, index) => (
    approxEqual(report.zero, expected[index].zero) &&
    report.mult === expected[index].mult &&
    report.behavior === expected[index].behavior
  ));
}

function countMatchingReportZeros(actual, expected) {
  let hits = 0;
  for (const expectedReport of expected) {
    if (actual.some(report => approxEqual(report.zero, expectedReport.zero))) {
      hits += 1;
    }
  }
  return hits;
}

function countMatchingReportDetails(actual, expected) {
  let hits = 0;
  for (const expectedReport of expected) {
    if (actual.some(report => (
      approxEqual(report.zero, expectedReport.zero) &&
      report.mult === expectedReport.mult &&
      report.behavior === expectedReport.behavior
    ))) {
      hits += 1;
    }
  }
  return hits;
}

function normalizeIntervalAnswer(answer) {
  return normalize(answer)
    .replace(/\s+/g, "")
    .replace(/∪/g, "u")
    .replace(/union/g, "u")
    .replace(/infinity/g, "inf")
    .replace(/oo/g, "inf");
}

function parseIntervalBound(token) {
  const norm = token.trim();
  if (norm === "inf" || norm === "+inf") return Number.POSITIVE_INFINITY;
  if (norm === "-inf") return Number.NEGATIVE_INFINITY;
  return parseNumberToken(norm);
}

function parseIntervalSet(answer) {
  const norm = normalizeIntervalAnswer(answer);
  if (!norm) return [];
  if (["emptyset", "empty", "nosolution", "none", "∅"].includes(norm)) {
    return [];
  }

  const pieces = norm.split("u").map(piece => piece.trim()).filter(Boolean);
  const parsed = [];

  for (const piece of pieces) {
    if (/^\{.*\}$/.test(piece)) {
      const value = parseIntervalBound(piece.slice(1, -1));
      if (value === null) return null;
      parsed.push({
        type: "interval",
        lo: value,
        hi: value,
        loInclusive: true,
        hiInclusive: true
      });
      continue;
    }

    const match = piece.match(/^([\[(])([^,]+),([^)\]]+)([\])])$/);
    if (!match) return null;

    const lo = parseIntervalBound(match[2]);
    const hi = parseIntervalBound(match[3]);
    if (lo === null || hi === null) return null;

    parsed.push({
      type: "interval",
      lo,
      hi,
      loInclusive: match[1] === "[",
      hiInclusive: match[4] === "]"
    });
  }

  return parsed.sort((left, right) => {
    if (left.lo === right.lo) return left.hi - right.hi;
    return left.lo - right.lo;
  });
}

function sameIntervalCore(left, right) {
  return approxEqual(left.lo, right.lo) && approxEqual(left.hi, right.hi);
}

function sameIntervalExact(left, right) {
  return sameIntervalCore(left, right) &&
    left.loInclusive === right.loInclusive &&
    left.hiInclusive === right.hiInclusive;
}

function compareIntervalSets(actual, expected) {
  if (actual === null || expected === null) {
    return { exact: false, sameCore: false, sharedCoreCount: 0 };
  }

  if (actual.length === expected.length && actual.every((item, index) => sameIntervalExact(item, expected[index]))) {
    return { exact: true, sameCore: true, sharedCoreCount: expected.length };
  }

  const sharedCoreCount = expected.filter(expectedPiece => actual.some(actualPiece => sameIntervalCore(actualPiece, expectedPiece))).length;
  const sameCore = actual.length === expected.length && expected.every((expectedPiece, index) => sameIntervalCore(actual[index], expectedPiece));

  return { exact: false, sameCore, sharedCoreCount };
}

function parseComplex(answer) {
  const compact = normalize(answer).replace(/\s+/g, "");
  if (!compact) return null;

  if (!compact.includes("i")) {
    const realOnly = parseNumberToken(compact);
    return realOnly === null ? null : { real: realOnly, imag: 0 };
  }

  let real = 0;
  let imag = 0;

  const imagMatches = compact.match(/[+-]?(?:\d+(?:\.\d+)?)?i/g) || [];
  let consumed = compact;

  for (const imagMatch of imagMatches) {
    let coeff = imagMatch.replace("i", "");
    if (coeff === "" || coeff === "+") coeff = "1";
    if (coeff === "-") coeff = "-1";
    const imagValue = Number(coeff);
    if (!Number.isFinite(imagValue)) return null;
    imag += imagValue;
    consumed = consumed.replace(imagMatch, "");
  }

  if (consumed) {
    const realParts = consumed
      .replace(/-/g, "+-")
      .split("+")
      .filter(Boolean);

    for (const realPart of realParts) {
      const realValue = parseNumberToken(realPart);
      if (realValue === null) return null;
      real += realValue;
    }
  }

  return { real, imag };
}

function scoreKeywordBuckets(answer, buckets) {
  const norm = normalize(answer);
  let hits = 0;

  for (const bucket of buckets || []) {
    const keywords = bucket.keywords || [];
    const minMatches = bucket.minMatches ?? 1;
    const matchCount = keywords.filter(keyword => norm.includes(normalize(keyword))).length;
    if (matchCount >= minMatches) {
      hits += 1;
    }
  }

  return {
    hits,
    total: (buckets || []).length
  };
}

function gradeListField(fieldId, answer, context, label) {
  const expected = context?.expectedNumbers || parseNumberList(getExpectedObj(context, fieldId).value) || [];
  const actual = parseNumberList(answer);

  if (actual === null) {
    return { score: "I", feedback: `Enter ${label} as x-values, not factors.` };
  }

  const hits = countNumberMatches(actual, expected);
  if (hits === expected.length && actual.length === expected.length) {
    return { score: "E", feedback: "Correct." };
  }

  if (hits >= Math.max(1, expected.length - 1)) {
    return { score: "P", feedback: `You found some correct ${label}, but the set is not complete yet.` };
  }

  return { score: "I", feedback: `Incorrect. Re-check the factoring and list the ${label} only.` };
}

// ============ MAIN GRADER ============

export function gradeField(fieldId, answer, context) {
  const openResponseFields = new Set(["sketchExplain", "errorExplain"]);
  if (isBlank(answer)) {
    return {
      score: "I",
      feedback: openResponseFields.has(fieldId)
        ? "Please write a brief explanation."
        : "Please enter or select an answer."
    };
  }

  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;
  const student = normalize(answer);

  if (["vocabAnswer", "zeroChoice", "multChoice", "crossTouch", "complexType", "transformChoice"].includes(fieldId)) {
    if (student === normalize(expected)) {
      return { score: "E", feedback: "Correct." };
    }
    return { score: "I", feedback: `Incorrect. The correct answer is ${expected}.` };
  }

  if (fieldId === "zerosText") {
    return gradeListField(fieldId, answer, context, "zeros");
  }

  if (fieldId === "solutionsText") {
    return gradeListField(fieldId, answer, context, "solutions");
  }

  if (fieldId === "reportText") {
    const actual = parseReportAnswer(answer);
    const expectedReports = Array.isArray(context?.expectedReports) ? context.expectedReports.slice().sort((a, b) => a.zero - b.zero) : [];

    if (!actual || actual.length === 0) {
      return { score: "I", feedback: "Use the format (zero, multiplicity, cross/touch); ... ." };
    }

    if (sameReportsExact(actual, expectedReports)) {
      return { score: "E", feedback: "Correct report." };
    }

    if (actual.length > expectedReports.length) {
      return { score: "I", feedback: "Do not include extra zeros that are not real zeros." };
    }

    const zeroHits = countMatchingReportZeros(actual, expectedReports);
    const detailHits = countMatchingReportDetails(actual, expectedReports);

    if (zeroHits === expectedReports.length && detailHits >= expectedReports.length - 1) {
      return { score: "P", feedback: "Your zeros are right, but one multiplicity or cross/touch detail needs fixing." };
    }

    if (zeroHits === expectedReports.length) {
      return { score: "P", feedback: "You have part of the report. Re-check the multiplicities and odd/even behavior." };
    }

    return { score: "I", feedback: "Incorrect. Re-check the zeros and match each one with the correct multiplicity and behavior." };
  }

  if (fieldId === "intervalText" || fieldId === "inequalityText") {
    const actual = parseIntervalSet(answer);
    const expectedIntervals = parseIntervalSet(context?.expectedIntervalSet || expected);

    if (actual === null || expectedIntervals === null) {
      return { score: "I", feedback: "Use interval notation such as (-2, 0) U (2, inf)." };
    }

    const comparison = compareIntervalSets(actual, expectedIntervals);
    if (comparison.exact) {
      return { score: "E", feedback: "Correct interval set." };
    }

    if (student.match(/^-?\d+(,\s*-?\d+)*$/)) {
      return { score: "I", feedback: "Do not list only the zeros. Write the intervals where the inequality is true." };
    }

    if (comparison.sameCore || comparison.sharedCoreCount >= Math.max(1, expectedIntervals.length - 1)) {
      return { score: "P", feedback: "You have most of the correct critical points, but one interval or endpoint needs fixing." };
    }

    return { score: "I", feedback: "Incorrect. Use a sign chart and check whether each endpoint should be included." };
  }

  if (fieldId === "complexResult") {
    const actual = parseComplex(answer);
    const expectedComplex = context?.expectedComplex || parseComplex(expected);

    if (!actual || !expectedComplex) {
      return { score: "I", feedback: "Write the answer in a + bi form." };
    }

    const realMatch = approxEqual(actual.real, expectedComplex.real);
    const imagMatch = approxEqual(actual.imag, expectedComplex.imag);

    if (realMatch && imagMatch) {
      return { score: "E", feedback: "Correct." };
    }

    if (realMatch || imagMatch || approxEqual(Math.abs(actual.imag), Math.abs(expectedComplex.imag))) {
      return { score: "P", feedback: "You have part of the complex result. Re-check the FOIL middle term and i^2 = -1." };
    }

    return { score: "I", feedback: "Incorrect. Expand with FOIL, combine the middle terms, and replace i^2 with -1." };
  }

  if (fieldId === "sketchExplain") {
    if (containsAny(answer, ["touch means odd", "cross means even", "y-intercept"])) {
      return { score: "I", feedback: "That explanation uses a core misconception about zeros or multiplicity." };
    }

    const bucketScore = scoreKeywordBuckets(answer, context?.keywordBuckets);
    if (bucketScore.hits >= bucketScore.total && bucketScore.total > 0) {
      return { score: "E", feedback: "Strong explanation. You connected zeros, multiplicity, sign reasoning, and the interval conclusion." };
    }

    if (bucketScore.hits >= Math.max(2, bucketScore.total - 2)) {
      return { score: "P", feedback: "Good start. Add the missing sign-chart or final-interval detail." };
    }

    return { score: "I", feedback: "Your explanation needs the zeros, multiplicities, cross/touch behavior, sign reasoning, and the final interval statement." };
  }

  if (fieldId === "errorExplain") {
    if (containsAny(answer, context?.forbiddenKeywords || ["student is correct"])) {
      return { score: "I", feedback: "That repeats the incorrect work instead of correcting it." };
    }

    const bucketScore = scoreKeywordBuckets(answer, context?.keywordBuckets);
    if (bucketScore.hits >= bucketScore.total && bucketScore.total > 0) {
      return { score: "E", feedback: "Correct. You identified the error, explained the rule, and gave the corrected result." };
    }

    if (bucketScore.hits >= Math.max(2, bucketScore.total - 1)) {
      return { score: "P", feedback: "You found part of the issue. Make the correction and the rule behind it more explicit." };
    }

    return { score: "I", feedback: "Identify the specific error, explain why it is wrong, and provide the corrected answer." };
  }

  if (student === normalize(expected)) {
    return { score: "E", feedback: "Correct." };
  }

  return { score: "I", feedback: `Incorrect. Expected ${expected}.` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
