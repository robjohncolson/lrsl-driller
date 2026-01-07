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

/** Shuffle until result differs from original (for generating wrong answers) */
function shuffleDifferent(arr) {
  const original = arr.join('|||');
  let result = shuffle(arr);
  let attempts = 0;
  while (result.join('|||') === original && attempts < 10) {
    result = shuffle(arr);
    attempts++;
  }
  return result;
}

/** Ensure all options are unique, regenerating if needed */
function ensureUniqueOptions(options, regenerateOption) {
  const seen = new Set();
  const result = [];
  for (let i = 0; i < options.length; i++) {
    let opt = options[i];
    let attempts = 0;
    while (seen.has(opt) && attempts < 5) {
      opt = regenerateOption(i, opt);
      attempts++;
    }
    seen.add(opt);
    result.push(opt);
  }
  return result;
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

/** Format polynomial in standard form from ascending coeffs (LaTeX-ready). */
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
    else term = `${coeffStr}x^{${p}}`; // Use braces for proper LaTeX

    if (parts.length === 0) parts.push(c < 0 ? `-${term}` : `${term}`);
    else parts.push(` ${sign} ${term}`);
  }

  return parts.length ? parts.join("") : "0";
}

/** Wrap expression in KaTeX delimiters */
function katex(expr) {
  return `$${expr}$`;
}

/** Convert exponents to Unicode superscripts for readable display in dropdowns */
function toUnicodeSuperscript(expr) {
  const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻', '+': '⁺'
  };

  // Convert x^{n} or x^n to x with superscript
  return expr
    .replace(/\^{(\d+)}/g, (match, digits) => {
      return digits.split('').map(d => superscripts[d] || d).join('');
    })
    .replace(/\^(\d)/g, (match, digit) => {
      return superscripts[digit] || digit;
    });
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
      "$3x^2 - 4x + 1$",
      "$-5x^3 + 2x - 7$",
      "$x^4 + 6$",
      "$2x - 9$"
    ];
    const bad = [
      "$x^{-2} + 3$",
      "$\\frac{1}{x} + 2$",
      "$\\sqrt{x} + 1$",
      "$2^x + 1$"
    ];
    const isPoly = Math.random() < 0.5;
    const expression = isPoly ? choice(good) : choice(bad);

    context = {
      ...makeContextBase(
        "Level 1: Polynomial or Not?",
        "A **polynomial** is an expression with variables raised to non-negative integer exponents (0, 1, 2, 3, …) and combined using addition, subtraction, and multiplication by constants. Expressions with negative exponents (like $x^{-2}$), variables in denominators (like $\\frac{1}{x}$), or roots (like $\\sqrt{x}$) are NOT polynomials.",
        `Expression: ${expression}`
      ),
      isPolynomial: { value: isPoly ? "Yes" : "No" }
    };

    answers = { isPolynomial: { value: isPoly ? "Yes" : "No" } };
    scenario = "Check each exponent: Is it a whole number ≥ 0? Is there a variable in the denominator or under a radical?";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 2: What is Standard Form?
  // -------------------------
  if (modeId === "l02-standard-form-select") {
    // Create a base polynomial (combined like terms) then make 3 non-standard variants.
    // Ensure at least 3 terms so shuffling produces different results
    const deg = choice([3, 4]); // Use higher degree for more terms
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);
    // Ensure all coefficients are non-zero for more distinct shuffles
    for (let p = deg - 1; p >= 0; p--) {
      let c = randInt(-5, 5);
      while (c === 0) c = randInt(-5, 5);
      coeffs[p] = c;
    }

    const standard = formatPoly(coeffs);

    // Shuffled: use shuffleDifferent to ensure it's different from standard
    const terms = standard.split(/(?= \+ | - )/).map(s => s.trim()).filter(Boolean);
    const shuffledTerms = shuffleDifferent(terms);
    const shuffled = shuffledTerms.join(" + ").replace(/\+\s-/g, "- ");

    // Not combined: add uncombined like terms
    const extraCoeff = choice([2, 3, 4]);
    const notCombined = `${standard} + ${extraCoeff}x - ${extraCoeff}x`;

    // Ascending: write in ascending order (lowest to highest power)
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

    // Ensure all options are unique before shuffling
    let rawOptions = [standard, shuffled, notCombined, ascending];
    const uniqueSet = new Set(rawOptions);

    // If we have duplicates, generate alternative wrong answers
    if (uniqueSet.size < 4) {
      // Create a different wrong answer: change a coefficient
      const altCoeffs = coeffs.slice();
      altCoeffs[0] = altCoeffs[0] + choice([1, 2, -1, -2]);
      const altWrong = formatPoly(altCoeffs);
      rawOptions = [standard, shuffled !== standard ? shuffled : altWrong, notCombined, ascending !== standard ? ascending : altWrong];
    }

    const options = shuffle(rawOptions);
    const correct = standard;

    context = {
      ...makeContextBase(
        "Level 2: What is Standard Form?",
        "A polynomial is in **standard form** when terms are arranged from highest degree to lowest degree, and all like terms have been combined. For example, $3x^3 + 2x^2 - 5x + 1$ is in standard form because the powers go 3 → 2 → 1 → 0.",
        "Which expression below is already written in standard form?"
      ),
      optA: toUnicodeSuperscript(options[0]),
      optB: toUnicodeSuperscript(options[1]),
      optC: toUnicodeSuperscript(options[2]),
      optD: toUnicodeSuperscript(options[3]),
      standardFormPick: { value: toUnicodeSuperscript(correct) }
    };

    answers = { standardFormPick: { value: toUnicodeSuperscript(correct) } };
    scenario = "Look for descending powers and no uncombined like terms.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 3: Choose the Standard Form of a scrambled expression
  // -------------------------
  if (modeId === "l03-standard-form-rewrite") {
    // Use higher degree and ensure non-zero coefficients for distinct options
    const deg = choice([3, 4]);
    const coeffs = new Array(deg + 1).fill(0);
    coeffs[deg] = choice([1, 2, -1, -2]);
    for (let p = deg - 1; p >= 0; p--) {
      let c = randInt(-6, 6);
      while (c === 0) c = randInt(-6, 6);
      coeffs[p] = c;
    }

    const standard = formatPoly(coeffs);

    // Create a scrambled version by shuffling term order (ensure different from standard)
    const terms = standard.split(/(?= \+ | - )/).map(s => s.trim()).filter(Boolean);
    const scrambledTerms = shuffleDifferent(terms);
    const scrambled = scrambledTerms.join(" + ").replace(/\+\s-/g, "- ");

    // Wrong option 1: wrong coefficient order (swap some coefficients between powers)
    const wrong1Coeffs = coeffs.slice();
    // Swap constant and linear coefficient
    [wrong1Coeffs[0], wrong1Coeffs[1]] = [wrong1Coeffs[1], wrong1Coeffs[0]];
    const wrong1 = formatPoly(wrong1Coeffs);

    // Wrong option 2: wrong leading coefficient sign
    const wrong2Coeffs = coeffs.slice();
    wrong2Coeffs[deg] = -wrong2Coeffs[deg];
    const wrong2 = formatPoly(wrong2Coeffs);

    // Wrong option 3: ascending order (backwards)
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
        else term = `${coeffStr}x^{${p}}`;
        return { sign, term };
      })
      .reduce((acc, t, idx) => {
        if (idx === 0) return (t.sign === "-" ? `-${t.term}` : `${t.term}`);
        return acc + ` ${t.sign} ${t.term}`;
      }, "");

    // Ensure all 4 options are unique
    let rawOptions = [standard, wrong1, wrong2, ascending];
    const uniqueSet = new Set(rawOptions);

    // Replace duplicates with alternative wrong answers
    if (uniqueSet.size < 4) {
      const altCoeffs = coeffs.slice();
      altCoeffs[0] = altCoeffs[0] + choice([3, 4, -3, -4]);
      rawOptions = Array.from(new Set([standard, wrong1, wrong2, ascending, formatPoly(altCoeffs)])).slice(0, 4);
      // Pad if still not enough
      while (rawOptions.length < 4) {
        const padCoeffs = coeffs.slice();
        padCoeffs[1] = padCoeffs[1] + choice([2, 3, -2, -3]);
        rawOptions.push(formatPoly(padCoeffs));
      }
    }

    const options = shuffle(rawOptions);

    context = {
      ...makeContextBase(
        "Level 3: Rewrite in Standard Form",
        "To write a polynomial in **standard form**: (1) Identify the degree of each term, (2) Arrange terms from highest to lowest degree, (3) Combine any like terms. The result should have powers in descending order.",
        `Rewrite in standard form: ${katex(scrambled)}`
      ),
      optA: toUnicodeSuperscript(options[0]),
      optB: toUnicodeSuperscript(options[1]),
      optC: toUnicodeSuperscript(options[2]),
      optD: toUnicodeSuperscript(options[3]),
      rewrittenStandard: { value: toUnicodeSuperscript(standard) }
    };

    answers = { rewrittenStandard: { value: toUnicodeSuperscript(standard) } };
    scenario = "Rearrange so the highest power comes first, then decreasing powers.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 4: Degree of a Term
  // -------------------------
  if (modeId === "l04-degree-of-term") {
    const exp = choice([0, 1, 2, 3, 4, 5, 6]);
    const coeff = choice([-7, -5, -3, -2, -1, 1, 2, 3, 5, 7]);

    const term = exp === 0 ? `${coeff}` : (exp === 1 ? `${coeff}x` : `${coeff}x^{${exp}}`);

    context = {
      ...makeContextBase(
        "Level 4: Degree of a Term",
        "The **degree of a term** is the exponent on the variable. For example: $5x^3$ has degree 3, $-2x$ has degree 1, and a constant like $7$ has degree 0 (since $7 = 7x^0$).",
        `What is the degree of this term? ${katex(term)}`
      ),
      termDegree: { value: exp, tolerance: 0 }
    };

    answers = { termDegree: { value: exp, tolerance: 0 } };
    scenario = "Find the exponent on $x$. Constants have degree 0.";
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
        "The **degree of a polynomial** is the highest exponent among all its terms. The **number of terms** is how many separate pieces are added/subtracted (after combining like terms). For example, $2x^3 - 5x + 1$ has degree 3 and 3 terms.",
        `Polynomial: ${katex(expr)}`
      ),
      polyDegree: { value: deg, tolerance: 0 },
      numTerms: { value: countTerms(coeffs), tolerance: 0 }
    };

    answers = {
      polyDegree: { value: deg, tolerance: 0 },
      numTerms: { value: countTerms(coeffs), tolerance: 0 }
    };

    scenario = "Find the largest exponent for degree. Count the + and − separated pieces for number of terms.";
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
        "The **leading coefficient** is the number in front of the highest-degree term (when the polynomial is in standard form). For example, in $-3x^4 + 2x^2 - 1$, the leading coefficient is $-3$ because $x^4$ is the highest power.",
        `Find the leading coefficient: ${katex(expr)}`
      ),
      leadingCoeff: { value: lead, tolerance: 0 }
    };

    answers = { leadingCoeff: { value: lead, tolerance: 0 } };
    scenario = "Identify the term with the highest power, then read its coefficient (including the sign!).";
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
    const powerText = missingPower === 1 ? "$x$ term" : `$x^{${missingPower}}$ term`;

    context = {
      ...makeContextBase(
        "Level 7: Missing Terms Have Coefficient 0",
        "When a polynomial is missing a power of $x$, that term has a **coefficient of 0**. For example, $x^3 + 5x + 2$ is missing the $x^2$ term, which means the coefficient of $x^2$ is 0. We could write it as $x^3 + 0x^2 + 5x + 2$.",
        `Polynomial: ${katex(expr)}`
      ),
      missingPowerText: powerText,
      missingCoeff: { value: 0, tolerance: 0 }
    };

    answers = { missingCoeff: { value: 0, tolerance: 0 } };
    scenario = "If a power doesn't appear, its coefficient must be 0.";
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
        "Level 8: Function Notation — Evaluate $f(x)$",
        "**Function notation** like $f(x)$ names a rule. To evaluate $f(2)$, substitute 2 for every $x$ in the rule and simplify. For example, if $f(x) = x^2 - 3$, then $f(2) = (2)^2 - 3 = 4 - 3 = 1$.",
        `${katex(`${funcName}(x) = ${expr}`)}`
      ),
      funcName,
      inputX,
      fxValue: { value: val, tolerance: 0.01 }
    };

    answers = { fxValue: { value: val, tolerance: 0.01 } };
    scenario = "Replace every $x$ with the input value, then compute step by step.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 8.5: Quadrants from a Graph (visual)
  // -------------------------
  if (modeId === "l085-quadrants-visual") {
    const n = choice([1, 2, 3, 4, 5, 6]);
    const even = n % 2 === 0;
    const correct = even ? "Quadrants I and II" : "Quadrants I and III";

    // Build coefficients for x^n (ascending order)
    const coeffs = new Array(n + 1).fill(0);
    coeffs[n] = 1;  // Leading coefficient = 1

    const xMin = -3, xMax = 3;
    const points = buildGraphPoints(coeffs, xMin, xMax, 0.1);
    const yDomain = yDomainFromPoints(points);

    graphConfig = {
      type: "function-curve",
      points,
      xLabel: "x",
      yLabel: "f(x)",
      xDomain: [xMin, xMax],
      yDomain,
      regression: { show: false },
      // Show x and y axes through origin to make quadrants visible
      originAxes: true,
      // Flag to show quadrant labels when hint is used
      quadrantLabelsOnHint: true
    };

    context = {
      ...makeContextBase(
        "Level 8.5: Quadrants from a Graph",
        "Look at the graph of a **power function** $f(x) = x^n$. Based on where the curve goes, identify which quadrants the graph passes through.",
        `Function: ${katex(`f(x) = x^{${n}}`)}`
      ),
      quadrantsVisual: { value: correct }
    };

    answers = { quadrantsVisual: { value: correct } };
    scenario = "Examine the graph and determine which quadrants it occupies.";
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
        "Level 9: Parent Graphs — Powers of $x$",
        "The graphs of $f(x) = x^n$ behave differently based on whether $n$ is even or odd. **Even powers** ($x^2, x^4, x^6, ...$) are always $\\geq 0$, so the graph stays in Quadrants I and II (above the $x$-axis). **Odd powers** ($x^1, x^3, x^5, ...$) can be negative when $x < 0$, so the graph passes through Quadrants I and III.",
        `Function: ${katex(`f(x) = x^{${n}}`)}`
      ),
      quadrants: { value: correct }
    };

    answers = { quadrants: { value: correct } };
    scenario = "Even exponent → both ends up (Quadrants I & II). Odd exponent → opposite ends (Quadrants I & III).";
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
        "**End behavior** describes what happens to $f(x)$ as $x \\to \\pm\\infty$. It depends on two things: (1) **Degree parity**: Even degree → both ends go the same direction; Odd degree → ends go opposite directions. (2) **Leading coefficient sign**: Positive → right end goes UP; Negative → right end goes DOWN.",
        `Leading term: ${katex(`${lead}x^{${deg}}`)}`
      ),
      endBehavior: { value: end }
    };

    answers = { endBehavior: { value: end } };
    scenario = "Check: Is the degree even or odd? Is the leading coefficient positive or negative?";
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
        "Level 11: End Behavior from a Full Polynomial",
        "For any polynomial, the **leading term** (highest-degree term) controls end behavior. The other terms become insignificant for very large $|x|$. First identify the leading term, then apply the end behavior rules: even degree + positive lead → both ends UP; even + negative → both DOWN; odd + positive → left DOWN, right UP; odd + negative → left UP, right DOWN.",
        `${katex(`f(x) = ${expr}`)}`
      ),
      endBehavior: { value: end }
    };

    answers = { endBehavior: { value: end } };
    scenario = "Find the leading term first, then determine end behavior from its degree and sign.";
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
    // Check if values ever go UP or ever go DOWN
    let hasIncrease = false;
    let hasDecrease = false;
    for (let i = 1; i < ys.length; i++) {
      if (ys[i] > ys[i - 1]) hasIncrease = true;
      if (ys[i] < ys[i - 1]) hasDecrease = true;
    }

    // "Changes direction" means it goes up THEN down, or down THEN up
    let trend;
    if (hasIncrease && hasDecrease) {
      trend = "Neither (it changes direction)";
    } else if (hasIncrease) {
      trend = "Increasing";
    } else if (hasDecrease) {
      trend = "Decreasing";
    } else {
      // All values equal (constant) - shouldn't happen with quadratic, but handle it
      trend = "Neither (it changes direction)";
    }

    const tableLines = ["x | f(x)", "---------"];
    for (let i = 0; i < xs.length; i++) tableLines.push(`${xs[i]} | ${ys[i]}`);
    const tableText = tableLines.join("\n");

    context = {
      ...makeContextBase(
        "Level 12: Increasing or Decreasing?",
        "A function is **increasing** on an interval if $f(x)$ gets larger as $x$ gets larger. It's **decreasing** if $f(x)$ gets smaller as $x$ increases. Look at consecutive values in the table: if outputs go up as inputs go up → increasing; if outputs go down → decreasing; if it changes direction → neither (on that interval).",
        `${katex(`f(x) = ${expr}`)}`,
        tableText
      ),
      monotonic: { value: trend }
    };

    answers = { monotonic: { value: trend } };
    scenario = "Compare $f(x)$ values from left to right. Do they consistently rise, fall, or change direction?";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 13: Average rate of change (with graph)
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

    // Build graph points for the curve
    const xMin = -4, xMax = 4;
    const points = buildGraphPoints(coeffs, xMin, xMax, 0.15);
    const yDomain = yDomainFromPoints(points);

    // Configure the graph with secant line and labeled points
    graphConfig = {
      type: "function-curve",
      points,
      xLabel: "x",
      yLabel: "f(x)",
      xDomain: [xMin, xMax],
      yDomain,
      regression: { show: false },
      // Show x and y axes through origin
      originAxes: true,
      // Secant line connecting (a, f(a)) and (b, f(b))
      secantLine: {
        x1: a,
        y1: fa,
        x2: b,
        y2: fb,
        color: '#f97316' // Orange
      },
      // Labeled points showing coordinates
      labeledPoints: [
        { x: a, y: fa, label: `(${a}, ${fa})`, color: '#ef4444', labelPosition: fa > fb ? 'above' : 'below' },
        { x: b, y: fb, label: `(${b}, ${fb})`, color: '#ef4444', labelPosition: fb > fa ? 'above' : 'below' }
      ]
    };

    context = {
      ...makeContextBase(
        "Level 13: Average Rate of Change",
        "The **average rate of change** of $f$ over an interval $[a, b]$ is the slope of the secant line (the orange dashed line) connecting the two points. Use the formula: $\\frac{f(b) - f(a)}{b - a}$.",
        `${katex(`f(x) = ${expr}`)}`,
        `Point A: $(${a}, ${fa})$\nPoint B: $(${b}, ${fb})$`
      ),
      a,
      b,
      fa,
      fb,
      avgRate: { value: avg, tolerance: 0.01 }
    };

    answers = { avgRate: { value: avg, tolerance: 0.01 } };
    scenario = `Use the formula: average rate of change = $\\frac{f(b) - f(a)}{b - a}$.`;
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
      regression: { show: false },
      // Show x and y axes through origin to make x-axis crossings clear
      originAxes: true
    };

    context = {
      ...makeContextBase(
        "Level 14: Finding Zeros from a Graph",
        "The **zeros** (or **$x$-intercepts**) of a polynomial are the $x$-values where $f(x) = 0$—that is, where the graph crosses or touches the $x$-axis. To find them from a graph, look for points where the curve meets the horizontal axis and read the $x$-coordinates.",
        `${katex(`f(x) = ${expr}`)}`,
        "Tip: All $x$-intercepts in this level are integers."
      ),
      // Store polynomial info for potential formula solver
      polynomialDegree: deg,
      coefficients: coeffs,
      xIntercepts: { value: roots, tolerance: 0.05 }
    };

    answers = { xIntercepts: { value: roots, tolerance: 0.05 } };
    scenario = "Find where the curve crosses or touches the $x$-axis (where $y = 0$).";
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
        "Level 15: Counting Turning Points",
        "A **turning point** is where the graph changes direction—from increasing to decreasing (a local maximum) or from decreasing to increasing (a local minimum). A polynomial of degree $n$ can have *at most* $n - 1$ turning points. For example, a quadratic (degree 2) has at most 1 turning point; a cubic (degree 3) has at most 2.",
        "Count the turning points on this graph."
      ),
      turningPoints: { value: expectedTP, tolerance: 0 }
    };

    answers = { turningPoints: { value: expectedTP, tolerance: 0 } };
    scenario = "Look for \"hills\" (local max) and \"valleys\" (local min) where the graph changes direction.";
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
      `$f(x)$ is positive on ${posIntervals.join(" and ")}.\n` +
      `$f(x)$ is negative on ${negIntervals.join(" and ")}.`;

    context = {
      ...makeContextBase(
        "Level 16: Sign Changes → $x$-intercepts",
        "When $f(x)$ changes sign (from positive to negative or vice versa), the graph must cross the $x$-axis at that point—this gives us an **$x$-intercept**. If you're told $f(x) > 0$ on one interval and $f(x) < 0$ on an adjacent interval, the boundary between them is a zero.",
        givenText
      ),
      verbalIntercepts: { value: [a, b, c], tolerance: 0.05 }
    };

    answers = { verbalIntercepts: { value: [a, b, c], tolerance: 0.05 } };
    scenario = "Find where positive and negative intervals meet—those boundaries are the $x$-intercepts.";
    return { context, graphConfig, answers, scenario };
  }

  // -------------------------
  // Level 17: Real-world model (domain/intercepts)
  // -------------------------
  if (modeId === "l17-real-world-domain") {
    // Create a simple linear model: f(x) = 13.2 - 2x
    // x-intercept at 6.6, y-intercept at 13.2
    const xIntercept = 6.6;
    const yIntercept = 13.2;
    const slope = -yIntercept / xIntercept; // -2

    // Build graph points for the line
    const xMin = -2, xMax = 9;
    const points = [];
    for (let x = xMin; x <= xMax; x += 0.5) {
      points.push({ x, y: yIntercept + slope * x });
    }

    // Configure graph with sign regions to show valid/invalid domains
    graphConfig = {
      type: "function-curve",
      points,
      xLabel: "x (quarter-cups)",
      yLabel: "f(x) (seconds)",
      xDomain: [xMin, xMax],
      yDomain: [-6, 16],
      regression: { show: false },
      originAxes: true,
      curveColor: '#8b5cf6', // Purple for the model line
      // Sign regions: red = positive (valid time), blue = negative (invalid)
      signRegions: [
        { xStart: -Infinity, xEnd: xIntercept, sign: 'positive', label: 'f(x) > 0' },
        { xStart: xIntercept, xEnd: Infinity, sign: 'negative', label: 'f(x) < 0' }
      ],
      // Mark the intercepts
      labeledPoints: [
        { x: 0, y: yIntercept, label: `(0, ${yIntercept})`, color: '#10b981', labelPosition: 'above' },
        { x: xIntercept, y: 0, label: `(${xIntercept}, 0)`, color: '#f97316', labelPosition: 'below' }
      ]
    };

    const givenText =
      "Sofía mixes a fixed amount of baking soda with different amounts of vinegar.\n" +
      "For $x$ quarter-cups of vinegar, it takes $f(x)$ seconds to inflate the balloon.";

    context = {
      ...makeContextBase(
        "Level 17: Interpreting Intercepts in Context",
        "When a polynomial models a real-world situation, always ask: **Do the intercepts make sense?** The **red region** shows where $f(x) > 0$ (positive time). The **blue region** shows where $f(x) < 0$ (negative time—impossible!). Also consider: can $x$ be negative?",
        givenText,
        `$y$-intercept: $(0, ${yIntercept})$  •  $x$-intercept: $(${xIntercept}, 0)$`
      ),
      interceptSense: { value: "No" }
    };

    answers = { interceptSense: { value: "No" } };
    scenario = "Look at the graph: Red = valid (positive seconds), Blue = invalid (negative seconds). What about negative $x$?";
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
        "Level 18: Capstone — Putting It All Together",
        "Let's apply everything you've learned! Given a polynomial and its graph, identify: (1) **Number of terms** — count the pieces; (2) **Degree** — highest exponent; (3) **Leading coefficient** — number in front of highest power; (4) **End behavior** — use degree parity and lead sign; (5) **Turning points** — count direction changes; (6) **$x$-intercepts** — where graph crosses $x$-axis.",
        `${katex("f(x) = x^{4} + 2x^{3} - 13x^{2} - 14x + 24")}`
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
