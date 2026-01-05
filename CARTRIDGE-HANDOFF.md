# Cartridge Creation Handoff Document

## PROMPT FOR CLAUDE (COPY THIS TO WEB VERSION)

---

You are helping a high school math teacher create a **drill cartridge** for their modular practice platform. The platform is like a game console: you're creating the "game cartridge" that plugs in.

### Your Task

Create a complete, scaffolded cartridge that teaches **[TOPIC NAME]** through progressive micro-lessons. Each level should:
1. Introduce ONE concept at a time
2. Build on previous levels
3. Use pedagogically sound sequencing (concrete → abstract, simple → complex)
4. Include teaching content in the problem display (not just questions)

### Output Format

You will produce **4 files**. Output each file in a code block with the filename as a comment on the first line.

1. `manifest.json` - Configuration (modes, inputs, hints, progression)
2. `generator.js` - Problem generation logic
3. `grading-rules.js` - Scoring logic for each field
4. `ai-grader-prompt.txt` (optional) - For free-response fields needing AI grading

### Critical Requirements

1. **Sequential Progression**: Levels unlock one at a time (`"unlockedBy": { "gold": N }`). Level 1 is `"default"`.

2. **Teaching First, Then Testing**: Each level's `context.problemText` should TEACH the concept before asking the question. Include definitions, examples, or formulas.

3. **E/P/I Scoring**:
   - E (Essentially Correct): All key elements present
   - P (Partially Correct): Some elements missing but shows understanding
   - I (Incorrect): Major errors or blank

4. **Star Tiers** (based on hints used):
   - Gold: 0 hints
   - Silver: 1 hint
   - Bronze: 2 hints
   - Tin: 3+ hints

5. **Input Types Available**:
   - `textarea` - Multi-line text (for written explanations)
   - `text` - Single-line text
   - `number` - Numeric input (supports `min`, `max`, `step`)
   - `dropdown` - Select from options (use `{{optA}}`, `{{optB}}` for dynamic options)
   - `choice` - Radio buttons for Yes/No or small fixed sets

6. **Hints**: Write helpful sentence frames or formulas. Use `{{variable}}` for dynamic values.

7. **Graph Support**: Set `"showGraph": true` and `"graphType": "function-curve"` or `"scatterplot"`. Return `graphConfig` from generator with `points` array.

---

## SPECIFICATION DOCUMENT

### File 1: manifest.json Structure

```json
{
  "meta": {
    "id": "kebab-case-id",
    "name": "Display Name",
    "subject": "Subject Area",
    "description": "Brief description for teachers/students"
  },

  "config": {
    "contextsFile": null,
    "skills": ["skill1", "skill2"]
  },

  "display": {
    "showGraph": true,
    "graphType": "function-curve",
    "infoPanel": [
      { "label": "Level", "value": "{{levelName}}" },
      { "label": "Task", "value": "{{problemText}}" },
      { "label": "Given", "value": "{{givenText}}" }
    ]
  },

  "modes": [
    {
      "id": "l01-concept-name",
      "name": "Level 1: Concept Name",
      "unlockedBy": "default",
      "layout": {
        "inputs": [
          {
            "id": "fieldId",
            "type": "dropdown|number|text|textarea|choice",
            "label": "Question with {{variables}}",
            "options": ["{{optA}}", "{{optB}}", "{{optC}}", "{{optD}}"],
            "placeholder": "Choose one"
          }
        ]
      }
    },
    {
      "id": "l02-next-concept",
      "name": "Level 2: Next Concept",
      "unlockedBy": { "gold": 1 },
      "layout": { "inputs": [...] }
    }
  ],

  "grading": {
    "rubricFile": "grading-rules.js",
    "aiPromptFile": "ai-grader-prompt.txt",
    "scoring": {
      "scale": ["E", "P", "I"],
      "meanings": {
        "E": "Essentially Correct",
        "P": "Partially Correct",
        "I": "Incorrect"
      }
    }
  },

  "hints": {
    "perField": {
      "fieldId": "Hint text with {{variables}}. Include formulas or sentence frames."
    },
    "penalty": {
      "0": "gold",
      "1": "silver",
      "2": "bronze",
      "3": "tin"
    }
  },

  "progression": {
    "streaksPerField": false,
    "streakFields": ["mainField"],
    "tiers": [
      { "id": "l01-concept-name", "name": "01", "unlockedBy": "default", "celebrationMessage": "Nice! Next level." },
      { "id": "l02-next-concept", "name": "02", "unlockedBy": { "gold": 1 }, "celebrationMessage": "Nice! Next level." }
    ]
  }
}
```

### File 2: generator.js Structure

```javascript
// Helper functions
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

// For dropdowns with dynamic options
function toUnicodeSuperscript(expr) {
  const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return expr
    .replace(/\^{(\d+)}/g, (_, d) => d.split('').map(c => superscripts[c] || c).join(''))
    .replace(/\^(\d)/g, (_, d) => superscripts[d] || d);
}

// For graphing (if needed)
function buildGraphPoints(fn, xMin, xMax, step) {
  const points = [];
  for (let x = xMin; x <= xMax; x += step) {
    points.push({ x: Math.round(x * 1000) / 1000, y: fn(x) });
  }
  return points;
}

/**
 * Main generator function
 * @param {string} modeId - Which level/mode is active
 * @param {object|null} contextFromFile - Context from contexts.json (if used)
 * @param {object} mode - The mode config from manifest
 */
export function generateProblem(modeId, contextFromFile, mode) {
  let graphConfig = null;
  let answers = {};
  let context = {};
  let scenario = "";

  // Level 1: First Concept
  if (modeId === "l01-concept-name") {
    // Generate problem data
    const value = randInt(1, 10);
    const correct = value * 2;

    // TEACHING CONTENT in problemText
    context = {
      levelName: "Level 1: Concept Name",
      problemText: "**Teaching content here.** Explain the concept with an example. " +
                   "For instance, [example]. This means [explanation].",
      givenText: `Value: ${value}`,

      // For dropdown options (if used)
      optA: String(correct),
      optB: String(correct + 1),
      optC: String(correct - 1),
      optD: String(correct * 2),

      // Expected answer
      fieldId: { value: String(correct), tolerance: 0 }
    };

    answers = { fieldId: { value: String(correct), tolerance: 0 } };
    scenario = "Brief task reminder for the student.";

    return { context, graphConfig, answers, scenario };
  }

  // Level 2: Next Concept
  if (modeId === "l02-next-concept") {
    // ... similar pattern
  }

  // Fallback
  return {
    context: { levelName: "Unknown", problemText: "Not implemented" },
    graphConfig: null,
    answers: {},
    scenario: ""
  };
}

export default { generateProblem };
```

### File 3: grading-rules.js Structure

```javascript
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

export function gradeField(fieldId, answer, context) {
  const expObj = getExpectedObj(context, fieldId);
  const expected = expObj.value;
  const tol = expObj.tolerance || 0;

  // Numeric fields
  const numericFields = new Set(["numericFieldId1", "numericFieldId2"]);

  if (numericFields.has(fieldId)) {
    const studentVal = Number(answer);
    const expectedVal = Number(expected);

    if (!Number.isFinite(studentVal)) {
      return { score: "I", feedback: "Please enter a number." };
    }

    const diff = Math.abs(studentVal - expectedVal);

    if (diff <= tol) {
      return { score: "E", feedback: "Correct!" };
    }

    // Partial credit for close answers
    if (diff <= tol * 2 || (tol === 0 && diff === 1)) {
      return { score: "P", feedback: "Close—check your calculation." };
    }

    return { score: "I", feedback: `Incorrect. Expected ${expectedVal}.` };
  }

  // List fields (comma-separated numbers)
  const listFields = new Set(["listFieldId"]);

  if (listFields.has(fieldId)) {
    const expectedArr = Array.isArray(expected) ? expected : [];
    const studentArr = String(answer).match(/[-+]?\d+\.?\d*/g)?.map(Number) || [];

    if (studentArr.length === 0) {
      return { score: "I", feedback: "Enter values separated by commas." };
    }

    // Count matches (order doesn't matter for most cases)
    const matched = studentArr.filter(s =>
      expectedArr.some(e => Math.abs(s - e) <= (tol || 0.05))
    ).length;

    if (matched === expectedArr.length && studentArr.length === expectedArr.length) {
      return { score: "E", feedback: "Correct!" };
    }

    if (matched >= 1) {
      return { score: "P", feedback: "Partially correct." };
    }

    return { score: "I", feedback: `Incorrect. Expected: ${expectedArr.join(", ")}.` };
  }

  // String/choice/dropdown fields (exact match)
  if (isBlank(answer)) {
    return { score: "I", feedback: "Please enter an answer." };
  }

  const s = String(answer).trim().toLowerCase();
  const e = String(expected).trim().toLowerCase();

  if (s === e) {
    return { score: "E", feedback: "Correct!" };
  }

  return { score: "I", feedback: `Incorrect. Expected "${expected}".` };
}

export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
```

### File 4: ai-grader-prompt.txt Structure (for free-response)

```
You are a [subject] teacher grading student responses about [topic].

## Context
{{problemText}}
Given: {{givenText}}

## Student Response
Field: {{fieldId}}
Response: {{studentAnswer}}

## Expected Answer
{{expectedAnswer}}

## Grading Criteria
- E (Essentially Correct): [specific criteria]
- P (Partially Correct): [specific criteria]
- I (Incorrect): [specific criteria]

## Response Format
Respond with ONLY valid JSON:
{
  "fieldId": {
    "score": "E" or "P" or "I",
    "feedback": "Brief explanation"
  }
}
```

---

## PEDAGOGICAL GUIDELINES

### Concept Sequencing (Apply These)

1. **Vocabulary First**: Define terms before using them
2. **Recognition Before Production**: Multiple-choice/dropdown before fill-in
3. **Concrete Before Abstract**: Specific examples before general rules
4. **Single Skill Isolation**: One new skill per level
5. **Spiral Complexity**: Later levels combine earlier skills

### Scaffolding Pattern

```
Level 1: Definition + Recognition (Yes/No, True/False)
Level 2: Identification (Multiple choice: "Which one is X?")
Level 3: Simple Application (Given A, find B)
Level 4: Multiple Steps (Given A, find B, then find C)
Level 5: Reverse Direction (Given B, find A)
Level 6: Edge Cases (Tricky examples)
Level 7: Combined Skills (Use skills from multiple earlier levels)
Level 8+: Real-world application, interpretation, explanation
```

### Writing Good Teaching Content

Each level's `problemText` should read like a mini-lesson:

**Good Example:**
```
"The **degree of a polynomial** is the highest exponent among all its terms.
For example, in 3x⁴ + 2x² - 5x + 1, the degree is 4 because the highest
power of x is 4. Constants like 7 have degree 0 (since 7 = 7x⁰)."
```

**Bad Example:**
```
"Find the degree."
```

### Writing Good Hints

Hints should provide:
1. **Sentence frames** for written responses
2. **Formulas** with variable names
3. **Step-by-step process** for calculations
4. **Common mistakes** to avoid

**Good Example:**
```
"Degree of a polynomial = highest exponent. Look at each term's power of x:
the largest one is the degree. Remember: constants have degree 0."
```

---

## EXAMPLE: Graphing Polynomials (18 Levels)

Here's how the existing graphing-polynomials cartridge sequences concepts:

| Level | Concept | Input Type | Builds On |
|-------|---------|------------|-----------|
| 1 | Polynomial or not? | choice | - |
| 2 | Recognize standard form | dropdown | L1 |
| 3 | Rewrite in standard form | dropdown | L2 |
| 4 | Degree of a term | number | L1 |
| 5 | Degree + # of terms | number × 2 | L3, L4 |
| 6 | Leading coefficient | number | L5 |
| 7 | Missing term = 0 coeff | number | L6 |
| 8 | Evaluate f(x) | number | L4 |
| 9 | x^n graphs (quadrants) | dropdown | L8 |
| 10 | End behavior from leading term | dropdown | L6, L9 |
| 11 | End behavior from full polynomial | dropdown | L10 |
| 12 | Increasing/decreasing from table | dropdown | L8 |
| 13 | Average rate of change | number | L8, L12 |
| 14 | Zeros from graph | text (list) | L8 |
| 15 | Turning points from graph | number | L10, L14 |
| 16 | Zeros from verbal description | text (list) | L14 |
| 17 | Real-world interpretation | choice | L14, L15 |
| 18 | Capstone (all skills) | multiple | L1-L17 |

---

## CHECKLIST FOR YOUR CARTRIDGE

Before submitting, verify:

- [ ] Every mode has `"unlockedBy"` (first is `"default"`, rest are `{ "gold": N }`)
- [ ] Mode IDs match between `modes` array and `progression.tiers`
- [ ] All field IDs in `layout.inputs` have corresponding entries in `hints.perField`
- [ ] Generator returns `{ context, graphConfig, answers, scenario }` for every modeId
- [ ] Grading handles all field IDs from the manifest
- [ ] Teaching content is in `problemText`, not just questions
- [ ] Complexity increases gradually across levels
- [ ] Early levels use constrained inputs (dropdown/choice), later levels use open inputs

---

## TOPIC TO CREATE: [FILL IN YOUR TOPIC]

Subject: _______________
Grade Level: _______________
Prerequisites: _______________
Learning Objectives:
1. _______________
2. _______________
3. _______________

Key Vocabulary:
- _______________
- _______________

Common Misconceptions:
- _______________
- _______________
