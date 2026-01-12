/**
 * Adding & Subtracting Polynomials - grading rules
 *
 * - Supports choice / dropdown fields via string matching
 * - Supports numeric fields with exact match (or tolerance if provided)
 * - Supports polynomial text fields by parsing terms and comparing algebraic equivalence
 */

function getExpectedObj(context, fieldId) {
  const v = context?.[fieldId];
  if (v && typeof v === "object" && "value" in v) return v;
  const a = context?.answers?.[fieldId];
  if (a && typeof a === "object" && "value" in a) return a;
  if (v !== undefined) return { value: v, tolerance: 0 };
  return { value: undefined, tolerance: 0 };
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === "string" && x.trim() === "");
}

// -------------------- Polynomial parsing --------------------

function replaceSuperscripts(s) {
  // Common unicode superscripts students might type
  return s
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/⁴/g, "^4")
    .replace(/⁵/g, "^5")
    .replace(/⁶/g, "^6");
}

function cleanPolyString(str) {
  return replaceSuperscripts(String(str))
    .replace(/\$/g, "")
    .replace(/[\u2212\u2013\u2014]/g, "-") // minus signs
    .replace(/\s+/g, "")
    .replace(/\{\s*/g, "{")
    .replace(/\s*\}/g, "}")
    .replace(/\*/g, "")
    .replace(/\(\)/g, "")
    .replace(/\+\-/g, "-")
    .replace(/\-\+/g, "-");
}

function parseNumberToken(tok) {
  if (!tok) return null;
  // fraction like 3/4
  if (tok.includes("/")) {
    const [a, b] = tok.split("/");
    const num = Number(a);
    const den = Number(b);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  const n = Number(tok);
  if (!Number.isFinite(n)) return null;
  return n;
}

function splitSignedTerms(s) {
  // Ensure a leading sign
  if (s.length === 0) return [];
  let t = s;
  if (t[0] !== "+" && t[0] !== "-") t = "+" + t;
  const re = /[\+\-][^\+\-]+/g;
  return t.match(re) || [];
}

function parseTerm(body) {
  // body has no leading sign. Example: "3x^{2}y" or "x^2" or "5".
  let i = 0;
  // coefficient token can include digits, dot, slash
  let coefTok = "";
  while (i < body.length && /[0-9.\/]/.test(body[i])) {
    coefTok += body[i];
    i++;
  }
  const hasCoef = coefTok.length > 0;
  const coef = hasCoef ? parseNumberToken(coefTok) : 1;
  if (coef === null) return null;

  const exp = {};
  // Parse variables one letter at a time.
  while (i < body.length) {
    const ch = body[i];
    if (!/[a-zA-Z]/.test(ch)) {
      // skip unexpected characters (like parentheses)
      i++;
      continue;
    }
    const v = ch.toLowerCase();
    i++;

    let power = 1;
    if (body[i] === "^") {
      i++;
      if (body[i] === "{") {
        i++;
        let numStr = "";
        while (i < body.length && body[i] !== "}") {
          numStr += body[i];
          i++;
        }
        if (body[i] === "}") i++;
        power = Number(numStr);
      } else {
        let numStr = "";
        while (i < body.length && /[0-9]/.test(body[i])) {
          numStr += body[i];
          i++;
        }
        power = Number(numStr);
      }
      if (!Number.isFinite(power)) power = 1;
    }

    exp[v] = (exp[v] || 0) + power;
  }

  return { coef, exp };
}

function monomialKey(exp) {
  const vars = Object.keys(exp)
    .filter((k) => exp[k] !== 0)
    .sort();
  if (vars.length === 0) return "";
  return vars
    .map((v) => {
      const p = exp[v];
      return p === 1 ? v : `${v}^${p}`;
    })
    .join("*");
}

function parsePolyToMap(raw) {
  const s = cleanPolyString(raw);
  if (s === "") return new Map();
  if (s === "0") return new Map();

  const out = new Map();
  const terms = splitSignedTerms(s);
  for (const signed of terms) {
    const sign = signed[0] === "-" ? -1 : 1;
    const body = signed.slice(1);
    const parsed = parseTerm(body);
    if (!parsed) return null;
    const key = monomialKey(parsed.exp);
    const val = sign * parsed.coef;
    const nv = (out.get(key) || 0) + val;
    if (Math.abs(nv) < 1e-10) out.delete(key);
    else out.set(key, nv);
  }
  return out;
}

function mapsClose(a, b, tol = 1e-6) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    const av = a.get(k) || 0;
    const bv = b.get(k) || 0;
    if (Math.abs(av - bv) > tol) return false;
  }
  return true;
}

function negateMap(m) {
  const out = new Map();
  for (const [k, v] of m.entries()) out.set(k, -v);
  return out;
}

function mismatchCount(a, b, tol = 1e-6) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let cnt = 0;
  for (const k of keys) {
    const av = a.get(k) || 0;
    const bv = b.get(k) || 0;
    if (Math.abs(av - bv) > tol) cnt++;
  }
  return cnt;
}

// -------------------- Grading --------------------

const numericFields = new Set(["leadingCoeff", "constantTerm", "yIntercept"]);
const polyFields = new Set(["simplified", "sumExpr", "result", "perimeter", "profit"]);

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;
  const tol = Number(expObj.tolerance || 0);

  if (isBlank(answer)) {
    return { score: "I", feedback: "Please enter an answer." };
  }

  // Numeric grading
  if (numericFields.has(fieldId)) {
    const studentVal = Number(String(answer).trim());
    const expectedVal = Number(expected);
    if (!Number.isFinite(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }
    const diff = Math.abs(studentVal - expectedVal);
    const t = Math.max(tol, 0);
    if (diff <= t) return { score: "E", feedback: "Correct!" };
    if (diff <= Math.max(1e-9, 1)) {
      return { score: "P", feedback: "Close—double-check your arithmetic." };
    }
    return { score: "I", feedback: `Incorrect. Expected ${expectedVal}.` };
  }

  // Polynomial text grading (algebraic equivalence)
  if (polyFields.has(fieldId)) {
    const sMap = parsePolyToMap(answer);
    const eMap = parsePolyToMap(expected);
    if (sMap === null) {
      return {
        score: "I",
        feedback: "I couldn't read that expression. Use + and − between terms (example: $3x^{2}-2x+1$)."
      };
    }
    if (eMap === null) {
      // Should never happen
      return { score: "I", feedback: "Internal error: expected answer could not be parsed." };
    }

    if (mapsClose(sMap, eMap, 1e-6)) return { score: "E", feedback: "Correct!" };

    // Partial credit checks
    const negExpected = negateMap(eMap);
    if (mapsClose(sMap, negExpected, 1e-6)) {
      return {
        score: "P",
        feedback: "Almost—your expression is the opposite sign of the correct result. Check subtraction/distributing the negative."
      };
    }

    const mism = mismatchCount(sMap, eMap, 1e-6);
    if (mism === 1) {
      return {
        score: "P",
        feedback: "Close—looks like just one term's coefficient/sign is off. Re-check combining like terms."
      };
    }
    if (mism === 2) {
      return {
        score: "P",
        feedback: "Partially correct—some terms match, but check signs and make sure you combined all like terms."
      };
    }

    return { score: "I", feedback: `Incorrect. The correct result is $${expected}$.` };
  }

  // Choice / dropdown (string match, case-insensitive)
  const s = String(answer).trim().toLowerCase();
  const e = String(expected).trim().toLowerCase();
  if (s === e) return { score: "E", feedback: "Correct!" };

  // Light partial credit for common near-misses like "a" vs "A"
  if (s.length === 1 && e.length === 1 && s === e) return { score: "E", feedback: "Correct!" };

  return { score: "I", feedback: `Incorrect. Expected "${expected}".` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
