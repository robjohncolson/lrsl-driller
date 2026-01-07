# Cartridge Development Specification

## Overview

You are building a "cartridge" for the **Driller Platform** - a quiz/drill application for students. Think of it like a game console: the platform is the console, and cartridges are interchangeable lesson modules.

**Your task**: Create a self-contained cartridge folder with 3-4 files that the platform will load and run.

---

## Architecture

```
cartridges/
  your-cartridge-id/
    manifest.json       # Configuration (required)
    generator.js        # Problem generation (required)
    grading-rules.js    # Answer validation (required)
    ai-grader-prompt.txt # AI grading template (optional)
```

After creating your cartridge, add it to `cartridges/registry.json`.

---

## File 1: manifest.json

The manifest defines your cartridge's metadata, modes (levels), UI inputs, hints, and progression rules.

### Schema

```json
{
  "meta": {
    "id": "your-cartridge-id",
    "name": "Display Name",
    "subject": "Subject Area",
    "description": "Brief description"
  },
  "modes": [
    {
      "id": "L01",
      "name": "Level 1 - Basics",
      "unlockedBy": "default",
      "layout": {
        "inputs": [
          {
            "id": "answer1",
            "type": "text|number|select|textarea",
            "label": "Question prompt here",
            "placeholder": "Hint text...",
            "options": ["A", "B", "C"]  // Only for type: "select"
          }
        ]
      }
    },
    {
      "id": "L02",
      "name": "Level 2 - Intermediate",
      "unlockedBy": { "gold": 3 },
      "layout": {
        "inputs": [...]
      }
    }
  ],
  "grading": {
    "rubricFile": "grading-rules.js",
    "aiPromptFile": "ai-grader-prompt.txt"
  },
  "hints": {
    "perField": {
      "answer1": "Hint text with {{variableName}} substitution"
    }
  },
  "progression": {
    "streakFields": ["answer1"],
    "tiers": [
      { "id": "L01", "unlockedBy": "default" },
      { "id": "L02", "unlockedBy": { "gold": 3 } },
      { "id": "L03", "unlockedBy": { "gold": 6 } }
    ]
  }
}
```

### Input Types

| Type | Description | Extra Properties |
|------|-------------|------------------|
| `text` | Single-line text input | `placeholder` |
| `number` | Numeric input | `placeholder`, `step` |
| `textarea` | Multi-line text | `placeholder`, `rows` |
| `select` | Dropdown menu | `options` (array of strings) |

### Unlock Conditions

- `"default"` - Available immediately
- `{ "gold": N }` - Requires N gold stars total in this cartridge
- `{ "gold": N, "mode": "L01" }` - Requires N gold stars in specific mode

---

## File 2: generator.js

Generates random problems for each mode. Must export a `generateProblem` function.

### Template

```javascript
/**
 * Problem Generator for [Your Topic]
 */

// Helper function to pick random item
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to shuffle array
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a problem for the given mode
 * @param {string} modeId - The mode/level ID (e.g., "L01")
 * @param {object} context - Optional context passed from platform
 * @param {object} mode - The full mode configuration from manifest
 * @returns {object} Problem object
 */
export function generateProblem(modeId, context = {}, mode = {}) {
  switch (modeId) {
    case 'L01':
      return generateLevel1();
    case 'L02':
      return generateLevel2();
    default:
      return generateLevel1();
  }
}

function generateLevel1() {
  // Generate random values
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const correctAnswer = num1 + num2;

  return {
    // Context: all variables available for display and grading
    context: {
      num1,
      num2,
      correctAnswer,
      problemText: `What is ${num1} + ${num2}?`
    },

    // Correct answers for each input field
    answers: {
      answer1: {
        value: correctAnswer,
        tolerance: 0  // For numeric: accept within ± tolerance
      }
    },

    // Display text (shown to student)
    scenario: `Calculate: ${num1} + ${num2}`
  };
}

function generateLevel2() {
  // More complex problem...
  const num1 = Math.floor(Math.random() * 50) + 10;
  const num2 = Math.floor(Math.random() * 50) + 10;
  const correctAnswer = num1 * num2;

  return {
    context: {
      num1,
      num2,
      correctAnswer,
      operation: 'multiply',
      problemText: `What is ${num1} × ${num2}?`
    },
    answers: {
      answer1: {
        value: correctAnswer
      }
    },
    scenario: `Calculate: ${num1} × ${num2}`
  };
}
```

### Return Object Structure

```javascript
{
  context: {
    // All variables - available in hints via {{varName}}
    // Available in grading-rules.js via context.varName
  },
  answers: {
    fieldId: {
      value: "correct answer",      // String or number
      tolerance: 0,                 // Optional: for numeric answers
      acceptableAnswers: ["a", "b"] // Optional: multiple correct answers
    }
  },
  scenario: "Problem text shown to student",

  // Optional: for graphing (if your problems need graphs)
  graphConfig: {
    type: 'scatterplot',
    points: [{x: 1, y: 2}, {x: 3, y: 4}],
    xLabel: 'X Axis',
    yLabel: 'Y Axis'
  }
}
```

---

## File 3: grading-rules.js

Validates student answers using keyword/programmatic checking. Must export a `gradeField` function.

### Template

```javascript
/**
 * Grading Rules for [Your Topic]
 *
 * Score meanings:
 *   'E' = Essentially correct (full credit)
 *   'P' = Partially correct (half credit)
 *   'I' = Incorrect (no credit)
 */

/**
 * Grade a single field
 * @param {string} fieldId - The input field ID from manifest
 * @param {string} answer - Student's answer (always a string)
 * @param {object} context - The context object from generator
 * @returns {object} { score: 'E'|'P'|'I', feedback: string }
 */
export function gradeField(fieldId, answer, context) {
  // Normalize answer
  const normalized = answer.toString().trim().toLowerCase();

  switch (fieldId) {
    case 'answer1':
      return gradeAnswer1(normalized, context);
    case 'answer2':
      return gradeAnswer2(normalized, context);
    default:
      return { score: 'I', feedback: 'Unknown field' };
  }
}

function gradeAnswer1(answer, context) {
  const correct = context.correctAnswer.toString();

  // Exact match
  if (answer === correct) {
    return { score: 'E', feedback: 'Correct!' };
  }

  // Close but not exact (for numeric with tolerance)
  const numAnswer = parseFloat(answer);
  const numCorrect = parseFloat(correct);
  if (!isNaN(numAnswer) && Math.abs(numAnswer - numCorrect) <= 0.1) {
    return { score: 'E', feedback: 'Correct!' };
  }

  // Partial credit example
  if (answer.includes(correct.charAt(0))) {
    return { score: 'P', feedback: 'Close, but not quite right.' };
  }

  return { score: 'I', feedback: `Incorrect. The answer was ${correct}.` };
}

function gradeAnswer2(answer, context) {
  // For multiple choice
  const correct = context.correctOption.toLowerCase();

  if (answer === correct) {
    return { score: 'E', feedback: 'Correct!' };
  }

  return { score: 'I', feedback: `Incorrect. The answer was "${context.correctOption}".` };
}
```

### Grading Tips

1. **Always normalize**: `answer.toString().trim().toLowerCase()`
2. **Be flexible**: Accept "5", "5.0", "5.00" for numeric answers
3. **Provide feedback**: Tell students what was wrong or what the correct answer was
4. **Use 'P' sparingly**: Only for answers that show partial understanding

---

## File 4: ai-grader-prompt.txt (Optional)

For free-response questions, you can add AI grading. The platform will substitute `{{variables}}` from context.

### Template

```
You are grading a student's answer about {{topic}}.

Question: {{problemText}}
Correct Answer: {{correctAnswer}}
Student's Answer: {{STUDENT_ANSWER}}

Grade the response:
- 'E' (Essentially Correct): Answer is correct or shows full understanding
- 'P' (Partially Correct): Answer shows some understanding but is incomplete
- 'I' (Incorrect): Answer is wrong or shows no understanding

Respond in this exact JSON format:
{
  "score": "E" or "P" or "I",
  "feedback": "Brief explanation for the student"
}
```

---

## Registry Entry

After creating your cartridge, add it to `cartridges/registry.json`:

```json
{
  "cartridges": [
    {
      "id": "your-cartridge-id",
      "path": "./your-cartridge-id",
      "name": "Display Name",
      "subject": "Subject Area",
      "description": "Brief description",
      "enabled": true
    }
  ]
}
```

---

## Complete Example: Simple Math Cartridge

### cartridges/simple-math/manifest.json

```json
{
  "meta": {
    "id": "simple-math",
    "name": "Simple Math Practice",
    "subject": "Mathematics",
    "description": "Practice basic arithmetic"
  },
  "modes": [
    {
      "id": "L01-addition",
      "name": "Level 1: Addition",
      "unlockedBy": "default",
      "layout": {
        "inputs": [
          {
            "id": "sum",
            "type": "number",
            "label": "Enter the sum:",
            "placeholder": "Type your answer..."
          }
        ]
      }
    },
    {
      "id": "L02-subtraction",
      "name": "Level 2: Subtraction",
      "unlockedBy": { "gold": 3 },
      "layout": {
        "inputs": [
          {
            "id": "difference",
            "type": "number",
            "label": "Enter the difference:",
            "placeholder": "Type your answer..."
          }
        ]
      }
    }
  ],
  "grading": {
    "rubricFile": "grading-rules.js"
  },
  "hints": {
    "perField": {
      "sum": "Add {{num1}} and {{num2}} together",
      "difference": "Subtract {{num2}} from {{num1}}"
    }
  },
  "progression": {
    "streakFields": ["sum", "difference"],
    "tiers": [
      { "id": "L01-addition", "unlockedBy": "default" },
      { "id": "L02-subtraction", "unlockedBy": { "gold": 3 } }
    ]
  }
}
```

### cartridges/simple-math/generator.js

```javascript
export function generateProblem(modeId, context = {}, mode = {}) {
  if (modeId === 'L01-addition') {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    return {
      context: { num1, num2, correctAnswer: num1 + num2 },
      answers: { sum: { value: num1 + num2 } },
      scenario: `What is ${num1} + ${num2}?`
    };
  }

  if (modeId === 'L02-subtraction') {
    const num1 = Math.floor(Math.random() * 30) + 20;
    const num2 = Math.floor(Math.random() * 20) + 1;
    return {
      context: { num1, num2, correctAnswer: num1 - num2 },
      answers: { difference: { value: num1 - num2 } },
      scenario: `What is ${num1} - ${num2}?`
    };
  }

  return { context: {}, answers: {}, scenario: 'Unknown mode' };
}
```

### cartridges/simple-math/grading-rules.js

```javascript
export function gradeField(fieldId, answer, context) {
  const correct = context.correctAnswer;
  const studentAnswer = parseFloat(answer);

  if (isNaN(studentAnswer)) {
    return { score: 'I', feedback: 'Please enter a number.' };
  }

  if (studentAnswer === correct) {
    return { score: 'E', feedback: 'Correct!' };
  }

  // Close answer (within 1)
  if (Math.abs(studentAnswer - correct) <= 1) {
    return { score: 'P', feedback: `Close! The exact answer is ${correct}.` };
  }

  return { score: 'I', feedback: `Incorrect. ${context.num1} ${fieldId === 'sum' ? '+' : '-'} ${context.num2} = ${correct}` };
}
```

---

## Star System

Students earn stars based on performance:

| Star | Condition | Points |
|------|-----------|--------|
| ⭐ Gold | 0 hints used, correct on first try | 4 |
| 🥈 Silver | 1 hint or retry | 3 |
| 🥉 Bronze | 2 hints/retries | 2 |
| ○ Tin | 3+ hints/retries | 1 |

Stars unlock new levels according to `progression.tiers` in the manifest.

---

## Checklist Before Submitting

- [ ] `manifest.json` has valid JSON syntax
- [ ] All `modes[].id` values are unique
- [ ] All `inputs[].id` values match between manifest, generator answers, and grading-rules
- [ ] `generator.js` exports `generateProblem` function
- [ ] `grading-rules.js` exports `gradeField` function
- [ ] Added entry to `cartridges/registry.json`
- [ ] Tested each level manually

---

## Questions?

The platform handles:
- UI rendering from manifest
- Problem display from generator
- Answer submission and grading flow
- Progress tracking and star awards
- Level unlocking

You just need to provide the content (problems, answers, grading logic).
