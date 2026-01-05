/**
 * Graphing Polynomials (Scaffolded Path) - grading rules
 *
 * The generator places expected answers in context[fieldId] as { value, tolerance }.
 */

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && v !== null && "value" in v) return v;
  // Some runtimes might merge "answers" in:
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && a !== null && "value" in a) return a;
  // Fallback: raw value
  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

function parseNumberList(text) {
  const matches = String(text).match(/[-+]?(?:\d+\.?\d*|\.\d+)/g);
  if (!matches) return [];
  return matches.map(s => Number(s)).filter(n => Number.isFinite(n));
}

/**
 * Match unordered lists within tolerance.
 * Returns { matched, missing, extras }
 */
function matchUnordered(expected, student, tol) {
  const remaining = expected.slice();
  const extras = [];
  let matched = 0;

  for (const s of student) {
    let bestIdx = -1;
    let bestDiff = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const diff = Math.abs(s - remaining[i]);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0 && bestDiff <= tol) {
      matched += 1;
      remaining.splice(bestIdx, 1);
    } else {
      extras.push(s);
    }
  }

  return { matched, missing: remaining, extras };
}

function fmtList(nums) {
  return nums
    .map(n => (Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : String(n)))
    .join(", ");
}

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;
  const tol = typeof expObj.tolerance === "number" ? expObj.tolerance : 0;

  // List fields (zeros/intercepts)
  if (["xIntercepts", "verbalIntercepts", "capXIntercepts"].includes(fieldId)) {
    const expectedArr = Array.isArray(expected) ? expected.map(Number) : [];
    const studentArr = parseNumberList(answer);

    if (studentArr.length === 0) {
      return { score: "I", feedback: "Enter the x-intercepts as numbers separated by commas (e.g., -3, 1, 4)." };
    }

    const { matched, missing, extras } = matchUnordered(expectedArr, studentArr, tol || 0.05);

    if (matched === expectedArr.length && extras.length === 0 && studentArr.length === expectedArr.length) {
      return { score: "E", feedback: "Correct!" };
    }

    if (matched >= 1) {
      const parts = [];
      if (missing.length) parts.push(`Missing: ${fmtList(missing)}`);
      if (extras.length) parts.push(`Extra/incorrect: ${fmtList(extras)}`);
      return { score: "P", feedback: `Partially correct. ${parts.join(" | ")}` };
    }

    return { score: "I", feedback: `Incorrect. Correct x-intercepts: ${fmtList(expectedArr)}.` };
  }

  // Numeric fields
  const numericFields = new Set([
    "termDegree",
    "polyDegree",
    "numTerms",
    "leadingCoeff",
    "missingCoeff",
    "fxValue",
    "avgRate",
    "turningPoints",
    "capNumTerms",
    "capDegree",
    "capLeadingCoeff",
    "capTurningPoints"
  ]);

  if (numericFields.has(fieldId)) {
    const studentVal = Number(answer);
    const expectedVal = Number(expected);

    if (!Number.isFinite(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const tolerance = tol ?? 0;
    const diff = Math.abs(studentVal - expectedVal);

    // Exact / within tolerance
    if (diff <= tolerance) {
      return { score: "E", feedback: "Correct!" };
    }

    // Partial credit heuristics
    // - If integer expected, being off by 1 is usually “close”
    if (tolerance === 0 && Number.isInteger(expectedVal) && Math.abs(studentVal - expectedVal) === 1) {
      return { score: "P", feedback: "Close—double-check your counting." };
    }

    // - Otherwise, within a bit bigger window is “close”
    if (diff <= Math.max(1, 10 * (tolerance || 0.01))) {
      return { score: "P", feedback: "Close—check your arithmetic." };
    }

    return { score: "I", feedback: `Incorrect. Expected ${expectedVal}.` };
  }

  // String / choice / dropdown fields
  if (isBlank(answer)) {
    return { score: "I", feedback: "Please choose or enter an answer." };
  }

  const s = String(answer).trim().toLowerCase();
  const e = String(expected).trim().toLowerCase();

  if (s === e) {
    return { score: "E", feedback: "Correct!" };
  }

  // Partial: same meaning but different arrow symbols etc.
  if ((fieldId === "endBehavior" || fieldId === "capEndBehavior") && s.replace(/[\s()]/g, "") === e.replace(/[\s()]/g, "")) {
    return { score: "E", feedback: "Correct!" };
  }

  return { score: "I", feedback: `Incorrect. Expected "${expected}".` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
