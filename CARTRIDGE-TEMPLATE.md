# Cartridge Template for Driller Platform

Use this template to create new drill cartridges. A cartridge is a self-contained lesson module with 3-4 files.

## File Structure

```
cartridges/your-topic-id/
├── manifest.json        # Configuration (required)
├── generator.js         # Problem generation (required)
├── grading-rules.js     # Scoring logic (required)
├── ai-grader-prompt.txt # AI grading template (optional)
└── contexts.json        # Real-world scenarios (optional)
```

---

## 1. manifest.json

```json
{
  "meta": {
    "id": "your-topic-id",
    "name": "Display Name",
    "subject": "Algebra 2",
    "description": "Brief description for students"
  },

  "config": {
    "contextsFile": null,
    "skills": ["skill1", "skill2"]
  },

  "display": {
    "showGraph": true,
    "graphType": "scatterplot",
    "infoPanel": [
      { "label": "Problem", "value": "{{problemText}}" }
    ]
  },

  "modes": [
    {
      "id": "level-1",
      "name": "Level 1: Basics",
      "unlockedBy": "default",
      "layout": {
        "inputs": [
          {
            "id": "answer1",
            "type": "text",
            "label": "Your answer:"
          }
        ]
      }
    },
    {
      "id": "level-2",
      "name": "Level 2: Advanced",
      "unlockedBy": { "gold": 10 },
      "layout": {
        "inputs": [
          {
            "id": "answer1",
            "type": "text",
            "label": "Your answer:"
          }
        ]
      }
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
      "answer1": "Hint text with {{variables}} substituted from context"
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
    "streakFields": ["answer1"],
    "tiers": [
      { "id": "level-1", "name": "Level 1", "unlockedBy": "default" },
      { "id": "level-2", "name": "Level 2", "unlockedBy": { "gold": 10 }, "celebrationMessage": "Level 2 Unlocked!" }
    ]
  }
}
```

---

## 2. generator.js

```javascript
/**
 * Generate a problem for the given mode
 * @param {string} modeId - Which mode is active (e.g., "level-1", "level-2")
 * @param {object} context - Random context from contexts.json (or null)
 * @param {object} mode - The mode config from manifest
 * @returns {object} Problem object
 */
export function generateProblem(modeId, context, mode) {
  // Generate random values based on mode difficulty
  let difficulty = 1;
  if (modeId === 'level-2') difficulty = 2;

  // Example: generate a problem
  const a = Math.floor(Math.random() * 10 * difficulty) + 1;
  const b = Math.floor(Math.random() * 10 * difficulty) + 1;
  const correctAnswer = a + b;

  return {
    // Context: all variables available for {{substitution}} in manifest
    context: {
      a,
      b,
      problemText: `What is ${a} + ${b}?`,
      difficulty
    },

    // Graph configuration (if display.showGraph is true)
    // Set to null if no graph needed
    graphConfig: {
      type: 'scatterplot',  // or 'line', 'residual-plot', 'normal-curve', null
      points: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
      xLabel: 'X Axis',
      yLabel: 'Y Axis',
      xDomain: [0, 10],
      yDomain: [0, 10],
      regression: { show: true, a: 0, b: 1 }  // optional regression line
    },

    // Expected answers for grading (keys match input ids)
    answers: {
      answer1: {
        value: correctAnswer,
        // Add any extra data your grader needs
        tolerance: 0.01
      }
    },

    // Scenario text (optional, shown to student)
    scenario: `Calculate the sum.`
  };
}

export default { generateProblem };
```

---

## 3. grading-rules.js

```javascript
/**
 * Grade a single field
 * @param {string} fieldId - The input field being graded
 * @param {string|number} answer - Student's answer
 * @param {object} context - Problem context (includes answers from generator)
 * @returns {object} { score: 'E'|'P'|'I', feedback: string, details?: object }
 */
export function gradeField(fieldId, answer, context) {
  // Get expected answer from context
  const expected = context[fieldId]?.value ?? context[fieldId];

  // Example: numeric grading with tolerance
  if (fieldId === 'answer1') {
    const studentVal = parseFloat(answer);
    const expectedVal = parseFloat(expected);

    if (isNaN(studentVal)) {
      return { score: 'I', feedback: 'Please enter a number' };
    }

    const diff = Math.abs(studentVal - expectedVal);

    if (diff < 0.01) {
      return { score: 'E', feedback: 'Correct!' };
    } else if (diff < 1) {
      return { score: 'P', feedback: 'Close, but check your calculation' };
    } else {
      return { score: 'I', feedback: `Expected ${expectedVal}` };
    }
  }

  // Example: exact match grading (for dropdowns/choices)
  if (fieldId === 'direction') {
    if (answer.toLowerCase() === expected.toLowerCase()) {
      return { score: 'E', feedback: 'Correct!' };
    }
    return { score: 'I', feedback: `Expected "${expected}"` };
  }

  // Example: regex grading (for free response)
  if (fieldId === 'explanation') {
    const required = [
      { pattern: /increase|decrease/i, name: 'direction' },
      { pattern: /\d+/, name: 'numeric value' }
    ];

    const missing = required.filter(r => !r.pattern.test(answer));

    if (missing.length === 0) {
      return { score: 'E', feedback: 'Good explanation!' };
    } else if (missing.length === 1) {
      return { score: 'P', feedback: `Missing: ${missing[0].name}` };
    } else {
      return { score: 'I', feedback: `Missing: ${missing.map(m => m.name).join(', ')}` };
    }
  }

  return { score: 'I', feedback: 'Unknown field' };
}

/**
 * Get grading rule for a field (optional, for platform introspection)
 */
export function getRule(fieldId) {
  return null;
}

export default { gradeField, getRule };
```

---

## 4. ai-grader-prompt.txt (Optional)

```
You are a teacher grading student responses about {{topic}}.

## Problem
{{problemText}}

## Expected Answer
{{expectedAnswer}}

## Student's Response
Field: {{fieldId}}
Answer: "{{studentAnswer}}"

## Grading Criteria
- E (Essentially Correct): Complete and accurate
- P (Partially Correct): Minor errors or missing elements
- I (Incorrect): Major errors or completely wrong

## Response Format
Respond with ONLY valid JSON:
{"fieldId": {"score": "E", "feedback": "Explanation here"}}
```

---

## 5. contexts.json (Optional)

Use for real-world scenario variety:

```json
{
  "contexts": [
    {
      "id": "context-1",
      "topic": "Population Growth",
      "xVar": "years",
      "yVar": "population",
      "xUnits": "years since 2000",
      "yUnits": "thousands"
    },
    {
      "id": "context-2",
      "topic": "Car Depreciation",
      "xVar": "age",
      "yVar": "value",
      "xUnits": "years",
      "yUnits": "dollars"
    }
  ]
}
```

---

## Available Input Types

Use these in `modes[].layout.inputs`:

| Type | Description | Extra Properties |
|------|-------------|------------------|
| `text` | Single-line text | `placeholder` |
| `textarea` | Multi-line text | `rows`, `placeholder` |
| `number` | Numeric input | `min`, `max`, `step` |
| `dropdown` | Select menu | `options: ["A", "B", "C"]`, `placeholder` |
| `choice` | Radio buttons | `options: ["Yes", "No"]` |

---

## Available Graph Types

Use in `generator.js` → `graphConfig.type`:

| Type | Description |
|------|-------------|
| `scatterplot` | Points with optional regression line |
| `residual-plot` | Residuals vs x with zero line |
| `normal-curve` | Normal distribution curve |
| `null` | No graph |

---

## Template Variables

Use `{{variableName}}` anywhere in manifest.json - replaced at runtime with values from `context`:

- In labels: `"label": "Simplify √{{radicand}}"`
- In hints: `"hint": "The slope is {{slope}}"`
- In info panel: `"value": "{{equation}}"`

---

## Scoring System

- **E (Essentially Correct)**: All key elements present, shows understanding
- **P (Partially Correct)**: Some elements missing or minor errors
- **I (Incorrect)**: Major errors, wrong answer, or missing critical elements

**Star tiers** (based on hints used):
- Gold: 0 hints
- Silver: 1 hint
- Bronze: 2 hints
- Tin: 3+ hints

---

## After Creating Your Cartridge

1. Add to `cartridges/registry.json`:
```json
{
  "id": "your-topic-id",
  "name": "Display Name",
  "subject": "Algebra 2",
  "description": "Brief description",
  "shortCode": "CODE"
}
```

2. Add to dropdown in `platform/app.html`:
```html
<option value="your-topic-id">Display Name</option>
```

3. Test: `npm run dev` → http://localhost:5173/platform/app.html
