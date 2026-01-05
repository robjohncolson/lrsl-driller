/**
 * Graphing Polynomials (Scaffolded Path) - generator
 *
 * We only have scatterplots, so we draw a polynomial "curve" by plotting many points.
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** coefficients in ascending order: c0 + c1 x + ... + cn x^n */
function evalPolyAsc(coeffs, x) {
  let y = 0;
  // Horner with descending coeffs
  const d = coeffs.slice().reverse();
  for (const c of d) y = y * x + c;
  return y;
}

/** Build polynomial coefficients from integer roots: leadingCoeff * Π (x - r) */
function polyFromRoots(roots, leadingCoeff = 1) {
  let coeffs = [1];
  for (const r of roots) {
    const next = new Array(coeffs.length + 1).fill(0);
    for (let i = 0; i < coeffs.length; i++) {
      next[i] += -r * coeffs[i];
      next[i + 1] += coeffs[i];
    }
    coeffs = next;
  }
  return coeffs.map(c => c * leadingCoeff);
}

function formatNumber(n) {
  const rounded = Math.round(n * 2) / 2; // allow halves
  if (Math.abs(rounded - n) < 1e-9) n = rounded;

  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  return isInt ? String(Math.round(n)) : String(n);
}

/** Format polynomial in standard form from ascending coeffs. */
function formatPoly(coeffsAsc) {
  const deg = coeffsAsc.length - 1;
  const parts = [];

  for (let p = deg; p >= 0; p--) {
    const c = coeffsAsc[p];
    if (Math.abs(c) < 1e-12) continue;

    const sign = c < 0 ? "-" : "+";
    const absC = Math.abs(c);

    let coeffStr = formatNumber(absC);

    // Omit 1 for non-constant terms
    if (p > 0 && Math.abs(absC - 1) < 1e-12) coeffStr = "";

    let term = "";
    if (p === 0) term = `${coeffStr || "1"}`;
    else if (p === 1) term = `${coeffStr}x`;
    else term = `${coeffStr}x^${p}`;

    if (parts.length === 0) parts.push(c < 0 ? `-${term}` : `${term}`);
    else parts.push(` ${sign} ${term}`);
  }

  return parts.length ? parts.join("") : "0";
}

function buildGraphPoints(coeffsAsc, xMin, xMax, step) {
  const points = [];
  for (let x = xMin; x <= xMax + 1e-9; x += step) {
    points.push({ x: Math.round(x * 1000) / 1000, y: evalPolyAsc(coeffsAsc, x) });
  }
  return points;
}

function yDomainFromPoints(points, padFrac = 0.08) {
  let yMin = Infinity, yMax = -Infinity;
  for (const p of points) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  if (!isFinite(yMin) || !isFinite(yMax)) return [-10, 10];
  if (Math.abs(yMax - yMin) < 1e-9) return [yMin - 1, yMax + 1];
  const pad = (yMax - yMin) * padFrac;
  return [yMin - pad, yMax + pad];
}

function endBehaviorOption(deg, leadingCoeff) {
  const even = deg % 2 === 0;
  const positive = leadingCoeff > 0;

  if (even && positive) return "Both ↑ (left ↑, right ↑)";
  if (even && !positive) return "Both ↓ (left ↓, right ↓)";
  if (!even && positive) return "Left ↓, Right ↑";
  return "Left ↑, Right ↓";
}

function makeContextBase(levelName, problemText, givenText = "", tableText = "") {
  return {
    levelName,
    problemText,
    givenText,
    tableText
  };
}

/**
 * Generate a problem for the given mode
 * @param {string} modeId
 * @param {object|null} contextFromFile
 * @param {object} mode
 */
export function generateProblem(modeId, contextFromFile, mode) {
  // Defaults (many early levels do not need a graph)
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // -------------------------
  // Level 1: Polynomial or Not?
  // -------------------------
  if (modeId === "l01-polynomial-or-not") {
    const good = [
      "3x^2 - 4x + 1",
      "-5x^3 + 2x - 7",
      "x^4 + 6",
      "2x - 9"
    ];
    const bad = [
      "x^-2 + 3",
      "1/x + 2",
      "√x + 1",
      "2^x + 1"
    ];
    const isPoly = Math.random() < 0.5;
    const expression = isPoly ? choice(good) : choice(bad);

    context = {
      ...makeContextBase(
        "Level 1: Polynomial or Not?",
        "Decide whether the expression is a polynomial.",
        `Expression: ${expression}`
      ),
      isPolynomial: { value: isPoly ? "Yes" : "No" }
    };

    answers = { isPolynomial: { value: isPoly ? "Yes" : "No" } };
    scenario = "Check the definition: whole-number exponents, no variables in denominators or radicals.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 2: What is Standard Form?
  // -------------------------
  if (modeId === "l02-standard-form-select") {
    // Create a base polynomial (combined like terms) then make 3 non-standard variants.
    const deg = choice([2, 3, 4]);
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);
    for (let p = deg - 1; p >= 0; p--) coeffs[p] = randInt(-5, 5);

    const standard = formatPoly(coeffs);

    const shuffled = shuffle(
      standard.split(/(?= \+ | - )/).map(s => s.trim()).filter(Boolean)
    ).join(" + ").replace(/\+\s-/g, "- ");

    const notCombined = standard.includes("x") ? `${standard} + ${choice([1,2,3])}x - ${choice([1,2,3])}x` : `${standard} + x - x`;

    const ascending = coeffs
      .map((c, p) => ({ c, p }))
      .filter(t => Math.abs(t.c) > 1e-12)
      .map(({ c, p }) => {
        const sign = c < 0 ? "-" : "+";
        const abs = Math.abs(c);
        const coeffStr = (p > 0 && Math.abs(abs - 1) < 1e-12) ? "" : formatNumber(abs);
        let term = "";
        if (p === 0) term = `${coeffStr || "1"}`;
        else if (p === 1) term = `${coeffStr}x`;
        else term = `${coeffStr}x^${p}`;
        return { sign, term };
      })
      .reduce((acc, t, idx) => {
        if (idx === 0) return (t.sign === "-" ? `-${t.term}` : `${t.term}`);
        return acc + ` ${t.sign} ${t.term}`;
      }, "");

    const options = shuffle([standard, shuffled, notCombined, ascending]);
    const correct = standard;

    context = {
      ...makeContextBase(
        "Level 2: What is Standard Form?",
        "Standard form lists terms in descending degree and combines like terms.",
        "Pick the one written in standard form."
      ),
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      standardFormPick: { value: correct }
    };

    answers = { standardFormPick: { value: correct } };
    scenario = "Choose the expression already in standard form.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 3: Choose the Standard Form of a scrambled expression
  // -------------------------
  if (modeId === "l03-standard-form-rewrite") {
    const deg = choice([2, 3, 4]);
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);
    for (let p = deg - 1; p >= 0; p--) coeffs[p] = randInt(-6, 6);

    const standard = formatPoly(coeffs);

    // Create a scrambled version by shuffling term order
    const terms = standard.split(/(?= \+ | - )/).map(s => s.trim()).filter(Boolean);
    const scrambled = shuffle(terms).join(" + ").replace(/\+\s-/g, "- ");

    // Wrong options
    const wrong1 = scramblePowersButKeepCoeffs(coeffs);
    const wrong2 = standard + " + 0x^2"; // extra zero term
    const wrong3 = scrambled;

    const options = shuffle([standard, wrong1, wrong2, wrong3]);

    context = {
      ...makeContextBase(
        "Level 3: Choose the Standard Form",
        "Select the standard form of the expression.",
        `Expression: ${scrambled}`
      ),
      optA: options[0],
      optB: options[1],
      optC: options[2],
      optD: options[3],
      rewrittenStandard: { value: standard }
    };

    answers = { rewrittenStandard: { value: standard } };
    scenario = "Put terms in descending powers and combine like terms.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 4: Degree of a Term
  // -------------------------
  if (modeId === "l04-degree-of-term") {
    const exp = choice([0, 1, 2, 3, 4, 5, 6]);
    const coeff = choice([-7, -5, -3, -2, -1, 1, 2, 3, 5, 7]);

    const term = exp === 0 ? `${coeff}` : (exp === 1 ? `${coeff}x` : `${coeff}x^${exp}`);

    context = {
      ...makeContextBase(
        "Level 4: Degree of a Term",
        "Find the degree of the term (the exponent).",
        `Term: ${term}`
      ),
      termDegree: { value: exp, tolerance: 0 }
    };

    answers = { termDegree: { value: exp, tolerance: 0 } };
    scenario = "Degree of a one-variable term is its exponent.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 5: Degree & Number of Terms
  // -------------------------
  if (modeId === "l05-degree-and-terms") {
    const deg = choice([2, 3, 4]);
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);

    // Make 2–4 terms by zeroing some middle coefficients
    let nonzeroCount = 1;
    for (let p = deg - 1; p >= 0; p--) {
      const c = choice([0, 0, randInt(-5, 5)]);
      coeffs[p] = c;
      if (Math.abs(c) > 1e-12) nonzeroCount++;
    }
    // Ensure at least 2 terms
    if (nonzeroCount < 2) {
      coeffs[0] = randInt(1, 6);
      nonzeroCount = 2;
    }

    const expr = formatPoly(coeffs);

    context = {
      ...makeContextBase(
        "Level 5: Degree & Number of Terms",
        "Identify the degree and the number of terms.",
        `Polynomial: ${expr}`
      ),
      polyDegree: { value: deg, tolerance: 0 },
      numTerms: { value: countTerms(coeffs), tolerance: 0 }
    };

    answers = {
      polyDegree: { value: deg, tolerance: 0 },
      numTerms: { value: countTerms(coeffs), tolerance: 0 }
    };

    scenario = "Degree = highest exponent. Terms = nonzero pieces after combining.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 6: Leading Coefficient
  // -------------------------
  if (modeId === "l06-leading-coefficient") {
    const deg = choice([2, 3, 4]);
    const coeffs = new Array(deg + 1).fill(0);
    const lead = choice([-3, -2, -1, 1, 2, 3]);
    coeffs[deg] = lead;
    for (let p = deg - 1; p >= 0; p--) coeffs[p] = randInt(-6, 6);

    const expr = formatPoly(coeffs);

    context = {
      ...makeContextBase(
        "Level 6: Leading Coefficient",
        "Identify the leading coefficient (coefficient of the highest-degree term).",
        `Polynomial (standard form): ${expr}`
      ),
      leadingCoeff: { value: lead, tolerance: 0 }
    };

    answers = { leadingCoeff: { value: lead, tolerance: 0 } };
    scenario = "Look at the leading (highest power) term.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 7: Missing Term (0 coefficient)
  // -------------------------
  if (modeId === "l07-missing-term") {
    // Construct a polynomial missing x^k for k=2 or k=3.
    const deg = choice([3, 4]);
    const missingPower = choice([2, deg - 1]); // often x^2 or next-to-leading
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);
    for (let p = deg - 1; p >= 0; p--) {
      if (p === missingPower) coeffs[p] = 0;
      else coeffs[p] = randInt(-6, 6);
    }

    const expr = formatPoly(coeffs);
    const powerText = missingPower === 1 ? "x term" : `x^${missingPower} term`;

    context = {
      ...makeContextBase(
        "Level 7: Missing Term (0 Coefficient)",
        "If a degree is missing, its coefficient is 0.",
        `Polynomial: ${expr}`
      ),
      missingPowerText: powerText,
      missingCoeff: { value: 0, tolerance: 0 }
    };

    answers = { missingCoeff: { value: 0, tolerance: 0 } };
    scenario = "No x^k term means 0x^k is “there,” but hidden.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 8: Evaluate f(x)
  // -------------------------
  if (modeId === "l08-function-notation") {
    const funcName = choice(["f", "g", "p"]);
    const deg = choice([2, 3]);
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);
    for (let p = deg - 1; p >= 0; p--) coeffs[p] = randInt(-5, 5);
    const expr = formatPoly(coeffs);

    const inputX = choice([-2, -1, 0, 1, 2]);
    const val = evalPolyAsc(coeffs, inputX);

    context = {
      ...makeContextBase(
        "Level 8: Evaluate f(x)",
        "Use function notation and substitute the input value.",
        `${funcName}(x) = ${expr}`
      ),
      funcName,
      inputX,
      fxValue: { value: val, tolerance: 0.01 }
    };

    answers = { fxValue: { value: val, tolerance: 0.01 } };
    scenario = "Substitute x and simplify carefully.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 9: Graphs of f(x)=x^n (Quadrants)
  // -------------------------
  if (modeId === "l09-xn-quadrants") {
    const n = choice([1, 2, 3, 4, 5, 6]);
    const even = n % 2 === 0;
    const correct = even ? "Quadrants I and II" : "Quadrants I and III";

    context = {
      ...makeContextBase(
        "Level 9: Graphs of f(x)=xⁿ",
        "Decide which quadrants the graph passes through.",
        `Function: f(x) = x^${n}`
      ),
      quadrants: { value: correct }
    };

    answers = { quadrants: { value: correct } };
    scenario = "Even powers are always ≥ 0; odd powers keep the sign of x.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 10: End behavior from the leading term
  // -------------------------
  if (modeId === "l10-end-behavior-from-leading") {
    const deg = choice([2, 3, 4, 5]);
    const lead = choice([-3, -2, -1, 1, 2, 3]);
    const end = endBehaviorOption(deg, lead);

    context = {
      ...makeContextBase(
        "Level 10: End Behavior from Leading Term",
        "Use degree parity and the sign of the leading coefficient.",
        `Leading term looks like ${lead}x^${deg}`
      ),
      endBehavior: { value: end }
    };

    answers = { endBehavior: { value: end } };
    scenario = "Even: both ends same. Odd: ends opposite. Sign tells up/down.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 11: End behavior from a polynomial (in standard form)
  // -------------------------
  if (modeId === "l11-end-behavior-from-polynomial") {
    const deg = choice([2, 3, 4]);
    const coeffs = new Array(deg + 1).fill(0);
    const lead = choice([-2, -1, 1, 2]);
    coeffs[deg] = lead;
    for (let p = deg - 1; p >= 0; p--) coeffs[p] = randInt(-6, 6);

    const expr = formatPoly(coeffs);
    const end = endBehaviorOption(deg, lead);

    context = {
      ...makeContextBase(
        "Level 11: End Behavior from a Polynomial",
        "Find the leading term (highest power) and use it to predict end behavior.",
        `f(x) = ${expr}`
      ),
      endBehavior: { value: end }
    };

    answers = { endBehavior: { value: end } };
    scenario = "The leading term determines end behavior for large |x|.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 12: Increasing/Decreasing from a table
  // -------------------------
  if (modeId === "l12-increasing-decreasing") {
    // Use a simple quadratic f(x) = ax^2 + bx + c with a>0 so it eventually increases.
    const a = choice([1, 1, 2]); // bias to 1
    const b = randInt(-3, 3);
    const c = randInt(-4, 4);
    const coeffs = [c, b, a]; // ascending: c + bx + ax^2
    const expr = formatPoly(coeffs);

    const xs = [-2, -1, 0, 1, 2];
    const ys = xs.map(x => evalPolyAsc(coeffs, x));

    // Determine trend across entire table
    let trend = "Neither (it changes direction)";
    const inc = ys.every((v, i) => i === 0 || v > ys[i - 1]);
    const dec = ys.every((v, i) => i === 0 || v < ys[i - 1]);
    if (inc) trend = "Increasing";
    if (dec) trend = "Decreasing";

    const tableLines = ["x | f(x)", "---------"];
    for (let i = 0; i < xs.length; i++) tableLines.push(`${xs[i]} | ${ys[i]}`);
    const tableText = tableLines.join("\n");

    context = {
      ...makeContextBase(
        "Level 12: Increasing/Decreasing from a Table",
        "Look at how f(x) changes as x increases.",
        `f(x) = ${expr}`,
        tableText
      ),
      monotonic: { value: trend }
    };

    answers = { monotonic: { value: trend } };
    scenario = "Compare consecutive outputs as x moves left→right.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 13: Average rate of change
  // -------------------------
  if (modeId === "l13-average-rate") {
    const deg = choice([2, 3]);
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);
    for (let p = deg - 1; p >= 0; p--) coeffs[p] = randInt(-5, 5);
    const expr = formatPoly(coeffs);

    const a = choice([-2, -1, 0, 1]);
    const b = a + choice([1, 2]);
    const fa = evalPolyAsc(coeffs, a);
    const fb = evalPolyAsc(coeffs, b);
    const avg = (fb - fa) / (b - a);

    context = {
      ...makeContextBase(
        "Level 13: Average Rate of Change",
        "Compute (f(b) − f(a)) / (b − a).",
        `f(x) = ${expr}`,
        `Points: (${a}, ${fa}) and (${b}, ${fb})`
      ),
      a,
      b,
      avgRate: { value: avg, tolerance: 0.01 }
    };

    answers = { avgRate: { value: avg, tolerance: 0.01 } };
    scenario = "Use the slope formula between two points.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 14: Zeros (x-intercepts) from a graph
  // -------------------------
  if (modeId === "l14-zeros-from-graph") {
    const deg = choice([2, 3]);
    const roots = sampleDistinctIntegers(deg, -3, 3).sort((a, b) => a - b);
    const lead = choice([-1, 1]);

    const coeffs = polyFromRoots(roots, lead);
    const expr = formatPoly(coeffs); // hidden-ish, but shown to reinforce connection

    const xMin = -5, xMax = 5;
    const points = buildGraphPoints(coeffs, xMin, xMax, 0.2);
    const yDomain = yDomainFromPoints(points);

    graphConfig = {
      type: "function-curve",
      points,
      xLabel: "x",
      yLabel: "f(x)",
      xDomain: [xMin, xMax],
      yDomain,
      regression: { show: false }
    };

    context = {
      ...makeContextBase(
        "Level 14: Zeros (x-intercepts) from a Graph",
        "Find where the graph intersects y = 0 (solutions to f(x) = 0).",
        "Tip: in this level, the x-intercepts are integers.",
        ""
      ),
      givenText: `Graph shown. (Optional check: one matching rule is f(x) = ${expr}.)`,
      xIntercepts: { value: roots, tolerance: 0.05 }
    };

    answers = { xIntercepts: { value: roots, tolerance: 0.05 } };
    scenario = "Zeros are the x-values where the graph touches/crosses the x-axis.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 15: Turning points from a graph
  // -------------------------
  if (modeId === "l15-turning-points-from-graph") {
    const family = choice(["quadratic", "cubic", "quartic"]);
    let coeffsAsc;
    let expectedTP;

    if (family === "quadratic") {
      // f(x) = ax^2 + bx + c (one turning point)
      const a = choice([1, 2, -1, -2]);
      const b = randInt(-4, 4);
      const c = randInt(-5, 5);
      coeffsAsc = [c, b, a];
      expectedTP = 1;
    } else if (family === "cubic") {
      // f(x) = a(x^3 - 3x) (two turning points)
      const a = choice([1, 2, -1, -2]);
      // x^3 - 3x => coeffsAsc [-0, -3, 0, 1]
      coeffsAsc = [0, -3 * a, 0, 1 * a];
      expectedTP = 2;
    } else {
      // quartic: f(x) = a(x^4 - 4x^2) (three turning points)
      const a = choice([1, 0.5, -1, -0.5]);
      // x^4 - 4x^2 => coeffsAsc [0,0,-4,0,1]
      coeffsAsc = [0, 0, -4 * a, 0, 1 * a];
      expectedTP = 3;
    }

    const xMin = -4, xMax = 4;
    const points = buildGraphPoints(coeffsAsc, xMin, xMax, 0.15);
    const yDomain = yDomainFromPoints(points);

    graphConfig = {
      type: "function-curve",
      points,
      xLabel: "x",
      yLabel: "f(x)",
      xDomain: [xMin, xMax],
      yDomain,
      regression: { show: false }
    };

    context = {
      ...makeContextBase(
        "Level 15: Turning Points from a Graph",
        "Count the turning points (direction changes) you see on the graph.",
        "Look for where the curve switches from increasing to decreasing, or vice versa."
      ),
      turningPoints: { value: expectedTP, tolerance: 0 }
    };

    answers = { turningPoints: { value: expectedTP, tolerance: 0 } };
    scenario = "Turning points are direction changes (not just where it crosses the x-axis).";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 16: From verbal description → x-intercepts
  // -------------------------
  if (modeId === "l16-from-verbal") {
    // Choose three sign-change points a < b < c
    const points = sampleDistinctIntegers(3, -4, 4).sort((x, y) => x - y);
    const [a, b, c] = points;

    // Randomly decide starting sign on (-∞, a)
    const startPositive = Math.random() < 0.5;
    // Signs alternate if we want sign changes at each breakpoint:
    // (+)(-)(+)(-) or (-)(+)(-)(+)
    const s1 = startPositive ? "positive" : "negative";
    const s2 = startPositive ? "negative" : "positive";
    const s3 = startPositive ? "positive" : "negative";
    const s4 = startPositive ? "negative" : "positive";

    const posIntervals = [];
    const negIntervals = [];
    const intervals = [
      { name: "(-∞, " + a + ")", sign: s1 },
      { name: "(" + a + ", " + b + ")", sign: s2 },
      { name: "(" + b + ", " + c + ")", sign: s3 },
      { name: "(" + c + ", ∞)", sign: s4 }
    ];
    for (const it of intervals) {
      if (it.sign === "positive") posIntervals.push(it.name);
      else negIntervals.push(it.name);
    }

    const givenText =
      `f(x) is positive on ${posIntervals.join(" and ")}.\n` +
      `f(x) is negative on ${negIntervals.join(" and ")}.`;

    context = {
      ...makeContextBase(
        "Level 16: From Verbal Description → x-intercepts",
        "x-intercepts happen at sign changes (where f(x) switches positive ↔ negative).",
        givenText
      ),
      verbalIntercepts: { value: [a, b, c], tolerance: 0.05 }
    };

    answers = { verbalIntercepts: { value: [a, b, c], tolerance: 0.05 } };
    scenario = "A sign change across x=k means the graph crosses the x-axis at x=k.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 17: Real-world model (domain/intercepts)
  // -------------------------
  if (modeId === "l17-real-world-domain") {
    const givenText =
      "Sofía mixes a fixed amount of baking soda with different amounts of vinegar.\n" +
      "For x quarter-cups of vinegar, it takes f(x) seconds to inflate the balloon.\n" +
      "A model’s graph has an x-intercept around 6.6 and a y-intercept around 13.2.";

    context = {
      ...makeContextBase(
        "Level 17: Real-World Model (Domain/Intercepts)",
        "Do the intercepts make sense in this context?",
        givenText
      ),
      interceptSense: { value: "No" }
    };

    answers = { interceptSense: { value: "No" } };
    scenario = "In context: does x=0 or y=0 correspond to something possible? Limit domain/range if needed.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 18: Capstone (Concept Summary Check)
  // -------------------------
  if (modeId === "l18-capstone") {
    // From the slides: f(x) = x^4 + 2x^3 − 13x^2 − 14x + 24
    // Roots are -4, -2, 1, 3
    const coeffsDesc = [1, 2, -13, -14, 24];
    const coeffsAsc = [24, -14, -13, 2, 1];

    const xMin = -5, xMax = 5;
    const points = buildGraphPoints(coeffsAsc, xMin, xMax, 0.15);
    const yDomain = yDomainFromPoints(points);

    graphConfig = {
      type: "function-curve",
      points,
      xLabel: "x",
      yLabel: "f(x)",
      xDomain: [xMin, xMax],
      yDomain,
      regression: { show: false }
    };

    const end = "Both ↑ (left ↑, right ↑)";
    const roots = [-4, -2, 1, 3];

    context = {
      ...makeContextBase(
        "Level 18: Concept Summary Check",
        "Use the graph (and the rule) to identify key features.",
        "f(x) = x^4 + 2x^3 − 13x^2 − 14x + 24"
      ),
      capNumTerms: { value: 5, tolerance: 0 },
      capDegree: { value: 4, tolerance: 0 },
      capLeadingCoeff: { value: 1, tolerance: 0 },
      capEndBehavior: { value: end },
      capTurningPoints: { value: 3, tolerance: 0 },
      capXIntercepts: { value: roots, tolerance: 0.05 }
    };

    answers = {
      capNumTerms: { value: 5, tolerance: 0 },
      capDegree: { value: 4, tolerance: 0 },
      capLeadingCoeff: { value: 1, tolerance: 0 },
      capEndBehavior: { value: end },
      capTurningPoints: { value: 3, tolerance: 0 },
      capXIntercepts: { value: roots, tolerance: 0.05 }
    };

    scenario = "This is the “Do You Know How?” style check: terms, degree, leading coefficient, end behavior, turning points, and zeros.";
    return { context, graphConfig, answers, scenario };
  }

  // Fallback
  context = makeContextBase("Unknown Level", "This modeId is not implemented.", "");
  return { context, graphConfig: null, answers: {}, scenario: "" };

  // ---------- helpers scoped below ----------
  function countTerms(coeffsAsc) {
    return coeffsAsc.reduce((acc, c) => acc + (Math.abs(c) > 1e-12 ? 1 : 0), 0);
  }

  function sampleDistinctIntegers(count, min, max) {
    const set = new Set();
    while (set.size < count) set.add(randInt(min, max));
    return Array.from(set);
  }

  function scramblePowersButKeepCoeffs(coeffsAsc) {
    // make a “wrong” polynomial by permuting coefficients among powers (keeping leading nonzero)
    const deg = coeffsAsc.length - 1;
    const nonLead = coeffsAsc.slice(0, deg);
    const shuffled = shuffle(nonLead);
    const newAsc = shuffled.concat([coeffsAsc[deg]]);
    return formatPoly(newAsc);
  }
}

export default { generateProblem };
