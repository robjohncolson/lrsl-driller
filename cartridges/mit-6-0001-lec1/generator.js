/**
 * Problem Generator — MIT 6.0001 Lecture 1: What is Computation?
 *
 * This cartridge drills the core ideas from Lecture 1:
 * - computation = calculation + memory
 * - computers only do what you tell them
 * - declarative vs imperative knowledge
 * - what an algorithm ("recipe") requires
 * - aspects of languages: primitive constructs, syntax, static semantics, semantics
 * - where things go wrong: syntax errors, static semantic errors, unintended meaning
 * - Python basics: objects/types, casting, operators, printing, bindings
 */

// Helper: pick a random item
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: random int in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: format numbers in a student-friendly way (avoids JS float noise)
function formatNumber(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return String(n);
  if (Number.isInteger(n)) return n.toString();
  // Round to 10 decimals and trim trailing zeros
  return n.toFixed(10).replace(/\.?0+$/, '');
}

export function generateProblem(modeId, context = {}, mode = {}) {
  switch (modeId) {
    case 'L01-computation-basics':
      return generateL01();
    case 'L02-knowledge-algorithms':
      return generateL02();
    case 'L03-language-aspects-errors':
      return generateL03();
    case 'L04-python-basics-drill':
      return generateL04();
    default:
      return generateL01();
  }
}

function generateL01() {
  const scenario =
`Answer both questions based on the lecture:
1) What are the two fundamental things a computer does?
2) What is the key principle about how computers behave?`;

  const fundamentalsCorrect = 'performs calculations and remembers results';
  const explicitCorrect = 'computers only do what you tell them to do';

  return {
    context: {
      fundamentalsCorrect,
      explicitCorrect,
      problemText: 'Computation basics (what computers do + explicit instructions).'
    },
    answers: {
      fundamentals: { value: fundamentalsCorrect },
      explicit: { value: explicitCorrect }
    },
    scenario
  };
}

function generateL02() {
  const examples = [
    {
      kind: 'declarative',
      text: 'The square root of a number x is y such that y*y = x.'
    },
    {
      kind: 'imperative',
      text:
`1) Start with a guess, g
2) If g*g is close enough to x, stop and say g is the answer
3) Otherwise make a new guess by averaging g and x/g
4) Using the new guess, repeat the process until close enough`
    },
    {
      kind: 'declarative',
      text: 'Someone will win a prize before class ends.'
    },
    {
      kind: 'imperative',
      text:
`1) Students sign up for raffle
2) Open your IDE
3) Choose a random number between the 1st and nth responder
4) Find the number in the responders sheet (winner!)`
    }
  ];

  const ex = pick(examples);

  const algorithmCorrect = 'sequence of simple steps + flow of control + a way to stop';

  const scenario =
`Classify the following example of knowledge:

"${ex.text}"

Then answer the algorithm question.`;

  return {
    context: {
      knowledgeExample: ex.text,
      knowledgeCorrect: ex.kind,
      algorithmCorrect,
      problemText: 'Declarative vs imperative knowledge; what makes a recipe an algorithm.'
    },
    answers: {
      knowledge_kind: { value: ex.kind },
      algorithm_parts: { value: algorithmCorrect }
    },
    scenario
  };
}

function generateL03() {
  const examples = [
    {
      label: 'English phrase',
      example: 'cat dog boy',
      aspect: 'syntax',
      errorType: 'syntax error'
    },
    {
      label: 'English sentence',
      example: 'I are hungry',
      aspect: 'static semantics',
      errorType: 'static semantic error'
    },
    {
      label: 'Python fragment',
      example: '"hi"5',
      aspect: 'syntax',
      errorType: 'syntax error'
    },
    {
      label: 'Python expression',
      example: '3 + "hi"',
      aspect: 'static semantics',
      errorType: 'static semantic error'
    },
    {
      label: 'English sentence (ambiguity)',
      example: 'Flying planes can be dangerous.',
      aspect: 'semantics',
      errorType: 'no error'
    },
    {
      label: 'Python snippet (runs, but may surprise you)',
      example:
`pi = 3.14
radius = 2.2
area = pi*(radius**2)
radius = radius + 1
# (area does NOT change unless you recalculate it)`,
      aspect: 'semantics',
      errorType: 'valid but different than intended'
    }
  ];

  const ex = pick(examples);

  const scenario =
`Example (${ex.label}):

${ex.example}

Question:
1) Which aspect of languages is being highlighted?
2) In lecture terms, what kind of issue is this?`;

  return {
    context: {
      exampleLabel: ex.label,
      exampleText: ex.example,
      aspectCorrect: ex.aspect,
      errorCorrect: ex.errorType,
      problemText: 'Aspects of languages + error categories from the lecture.'
    },
    answers: {
      aspect: { value: ex.aspect },
      error_type: { value: ex.errorType }
    },
    scenario
  };
}

function generateL04() {
  // Problems are small Python snippets that produce exactly one console output.
  const problemFactories = [
    () => {
      // Division always yields a float (Python 3)
      const denom = pick([2, 4, 5, 8]);
      const num = randInt(1, 40);
      const value = num / denom;
      return {
        code: `x = ${num} / ${denom}\nprint(x)`,
        printedValue: value,
        printedType: 'float',
        note: 'Remember: / always produces a float in Python 3.'
      };
    },
    () => {
      // Remainder
      const a = randInt(10, 60);
      const b = randInt(2, 9);
      const value = a % b;
      return {
        code: `x = ${a} % ${b}\nprint(x)`,
        printedValue: value,
        printedType: 'int',
        note: 'The % operator gives the remainder.'
      };
    },
    () => {
      // Exponentiation
      const base = randInt(2, 6);
      const exp = randInt(2, 4);
      const value = base ** exp;
      return {
        code: `x = ${base} ** ${exp}\nprint(x)`,
        printedValue: value,
        printedType: 'int',
        note: 'The ** operator raises to a power.'
      };
    },
    () => {
      // Casting float -> int truncates (does not round)
      const whole = randInt(2, 12);
      const tenths = pick([1, 3, 7, 9]);
      const f = parseFloat(`${whole}.${tenths}`);
      const value = Math.trunc(f);
      return {
        code: `x = int(${formatNumber(f)})\nprint(x)`,
        printedValue: value,
        printedType: 'int',
        note: 'int() truncates toward zero (no rounding).'
      };
    },
    () => {
      // Casting int -> float
      const i = randInt(1, 20);
      const value = i * 1.0;
      return {
        code: `x = float(${i})\nprint(x)`,
        printedValue: value,
        printedType: 'float',
        note: 'float(i) makes an integer into a float (adds .0).'
      };
    },
    () => {
      // NoneType
      return {
        code: `x = None\nprint(x)`,
        printedValue: 'None',
        printedType: 'NoneType',
        note: 'None is the single value of NoneType.'
      };
    },
    () => {
      // Bool
      const v = pick([true, false]);
      return {
        code: `x = ${v ? 'True' : 'False'}\nprint(x)`,
        printedValue: v ? 'True' : 'False',
        printedType: 'bool',
        note: 'Booleans are True/False (capitalized).'
      };
    },
    () => {
      // Binding: area doesn't change unless recalculated
      const radius = parseFloat(`${randInt(12, 35) / 10}`); // 1.2 .. 3.5
      const pi = 3.14;
      const area = pi * (radius ** 2);
      return {
        code: `pi = 3.14\nradius = ${formatNumber(radius)}\narea = pi*(radius**2)\nradius = radius + 1\nprint(area)`,
        printedValue: area,
        printedType: 'float',
        note: 'Rebinding radius does not automatically update area.'
      };
    }
  ];

  const p = pick(problemFactories)();

  const printedIsNumeric = typeof p.printedValue === 'number';
  const expectedNumber = printedIsNumeric ? p.printedValue : null;
  const tolerance = printedIsNumeric ? 0.01 : 0;

  const scenario =
`Assume this is Python 3 code.

${p.code}

What does it print? What is the type of the printed value?`;

  return {
    context: {
      code: p.code,
      note: p.note,
      printedIsNumeric,
      expectedPrintedNumber: expectedNumber,
      expectedPrintedText: printedIsNumeric ? formatNumber(p.printedValue) : String(p.printedValue),
      expectedPrintedType: p.printedType,
      tolerance,
      problemText: 'Python basics: operators, types, casting, printing, bindings.'
    },
    answers: {
      printed: {
        value: printedIsNumeric ? formatNumber(p.printedValue) : String(p.printedValue),
        tolerance
      },
      printed_type: {
        value: p.printedType
      }
    },
    scenario
  };
}
