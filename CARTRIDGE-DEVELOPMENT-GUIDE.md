# Cartridge Development Guide

This guide explains how to create new lesson cartridges for the Driller platform. The platform is **subject-agnostic**—you can create drill exercises for any topic where students need practice with structured responses.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PLATFORM (Console)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐    │
│  │   Grading   │ │   Inputs    │ │   Progression   │    │
│  │   Engine    │ │   Renderer  │ │   & Gamification│    │
│  └─────────────┘ └─────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ loads
                          │
┌─────────────────────────────────────────────────────────┐
│                   CARTRIDGE (Lesson)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │ manifest.json│ │ generator.js │ │ grading-rules.js│  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐│
│  │            ai-grader-prompt.txt (optional)          ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**The platform handles:**
- Rendering inputs (text, dropdowns, visual components)
- Grading (keyword matching, numeric tolerance, AI)
- Displaying graphs (scatterplots, etc.)
- Streaks, stars, progression
- Time tracking, teacher review

**Your cartridge provides:**
- What inputs to show
- How to generate problems
- What makes an answer correct
- (Optional) AI grading prompts

---

## Quick Start: Create a Cartridge in 4 Files

Create a folder: `cartridges/your-topic-id/`

### File 1: `manifest.json`

This declares everything about your lesson:

```json
{
  "meta": {
    "id": "your-topic-id",
    "name": "Display Name",
    "subject": "Your Subject",
    "description": "Brief description for students"
  },

  "config": {
    "sharedContexts": null,
    "skills": ["skill1", "skill2"]
  },

  "display": {
    "showGraph": false,
    "infoPanel": [
      { "label": "Problem", "value": "{{problemText}}" }
    ]
  },

  "modes": [
    {
      "id": "basic",
      "name": "Level 1: Basics",
      "unlockedBy": "default",
      "layout": {
        "inputs": [
          {
            "id": "answer",
            "type": "textarea",
            "label": "Your answer:",
            "rows": 3
          }
        ]
      }
    },
    {
      "id": "advanced",
      "name": "Level 2: Advanced",
      "unlockedBy": { "gold": 10 },
      "layout": {
        "inputs": [
          {
            "id": "answer",
            "type": "textarea",
            "label": "Full response:",
            "rows": 5
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
      "answer": "Hint text with {{variables}} from context"
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
    "streakFields": ["problem"],
    "tiers": [
      { "id": "basic", "name": "Level 1", "unlockedBy": "default" },
      { "id": "advanced", "name": "Level 2", "unlockedBy": { "gold": 10 }, "celebrationMessage": "Level 2 Unlocked!" }
    ]
  }
}
```

### File 2: `generator.js`

Generates random problems:

```javascript
/**
 * Generate a problem for the given mode
 * @param {string} modeId - Which mode is active (e.g., "basic", "advanced")
 * @param {object} context - Random context from shared contexts (or null)
 * @param {object} mode - The mode config from manifest
 * @returns {object} Problem object
 */
export function generateProblem(modeId, context, mode) {
  // Generate random values for this problem
  const num1 = Math.floor(Math.random() * 100) + 1;
  const num2 = Math.floor(Math.random() * 100) + 1;
  const correctAnswer = num1 + num2;

  return {
    // Context passed to templates ({{variable}} substitution)
    context: {
      num1,
      num2,
      problemText: `What is ${num1} + ${num2}?`
    },

    // Graph configuration (if showGraph: true)
    graphConfig: null,

    // Expected answers for grading
    answers: {
      answer: {
        value: correctAnswer,
        // Add any other properties your grader needs
      }
    },

    // Scenario text shown to student
    scenario: `Calculate the sum of ${num1} and ${num2}.`
  };
}

export default { generateProblem };
```

### File 3: `grading-rules.js`

Defines how to score each field:

```javascript
/**
 * Get grading rule for a specific field
 */
export function getRule(fieldId) {
  return rules[fieldId] || null;
}

/**
 * Grading rules by field ID
 */
const rules = {
  answer: {
    type: 'numeric',           // or 'regex', 'exact'
    expected: 'value',         // key in answers object
    tolerance: 0.01,           // for numeric: acceptable error
    relativeTolerance: false,  // true = percentage, false = absolute
    feedback: {
      E: 'Correct!',
      P: 'Close, check your calculation',
      I: 'Review the formula'
    }
  }
};

/**
 * Grade a field (called by platform)
 */
export function gradeField(fieldId, answer, context) {
  const rule = rules[fieldId];
  if (!rule) {
    return { score: 'I', feedback: 'Unknown field' };
  }

  // Get expected value
  let expected = context[rule.expected];
  if (typeof expected === 'object') expected = expected.value;

  // Numeric grading
  if (rule.type === 'numeric') {
    const userValue = parseFloat(answer);
    if (isNaN(userValue)) {
      return { score: 'I', feedback: 'Enter a number' };
    }

    const diff = Math.abs(userValue - expected);
    const tolerance = rule.relativeTolerance
      ? Math.abs(expected * rule.tolerance)
      : rule.tolerance;

    if (diff <= tolerance) {
      return { score: 'E', feedback: rule.feedback.E };
    } else if (diff <= tolerance * 2) {
      return { score: 'P', feedback: rule.feedback.P };
    }
    return { score: 'I', feedback: rule.feedback.I };
  }

  // Exact match grading
  if (rule.type === 'exact') {
    if (answer === expected) {
      return { score: 'E', feedback: rule.feedback.E };
    }
    return { score: 'I', feedback: rule.feedback.I };
  }

  return { score: 'I', feedback: 'Unknown rule type' };
}

export default { getRule, gradeField };
```

### File 4: `ai-grader-prompt.txt` (Optional)

For free-response grading via AI:

```
You are a [subject] teacher grading student responses about [topic].

## Context
Problem: {{problemText}}
Expected Answer: {{expectedAnswer}}

## Student Response
{{studentAnswer}}

## Grading Guidelines
- E (Essentially Correct): [criteria]
- P (Partially Correct): [criteria]
- I (Incorrect): [criteria]

## Response Format
Respond with ONLY valid JSON:
{"answer":{"score":"E","feedback":"Explanation here"}}
```

---

## Input Types Reference

The platform supports these input types in your manifest:

### `textarea` - Multi-line text
```json
{
  "id": "response",
  "type": "textarea",
  "label": "Your interpretation:",
  "rows": 4,
  "placeholder": "Type here..."
}
```

### `text` - Single-line text
```json
{
  "id": "shortAnswer",
  "type": "text",
  "label": "Enter value:",
  "placeholder": "..."
}
```

### `number` - Numeric input
```json
{
  "id": "calculation",
  "type": "number",
  "label": "Calculate the result:",
  "step": "0.01",
  "min": 0,
  "max": 100
}
```

### `dropdown` - Select menu
```json
{
  "id": "choice",
  "type": "dropdown",
  "label": "Select the correct answer:",
  "placeholder": "Choose...",
  "options": ["Option A", "Option B", "Option C"]
}
```

### `choice` - Radio buttons
```json
{
  "id": "yesNo",
  "type": "choice",
  "label": "Is this correct?",
  "options": ["Yes", "No"]
}
```

### Visual Input Types (Advanced)

These are specialized interactive components:

- `visual-radical` - Drag-to-group squares for simplifying radicals (Level 1)
- `visual-radical-prime` - Build prime factorization trees (Level 2)
- `visual-radical-complex` - Handle negative radicands with i (Level 4)

---

## Grading Types Reference

### Numeric Grading
For math problems with calculable answers:

```javascript
{
  type: 'numeric',
  expected: 'answerKey',     // key in answers object
  tolerance: 0.1,            // acceptable difference
  relativeTolerance: true,   // true = 10% of expected, false = fixed 0.1
  feedback: { E: '...', P: '...', I: '...' }
}
```

### Exact Match Grading
For dropdown/choice fields:

```javascript
{
  type: 'exact',
  expected: 'correctChoice',
  feedback: { E: 'Correct!', I: 'Try again' }
}
```

### Regex Grading
For free-response text with required elements:

```javascript
{
  type: 'regex',
  rubric: [
    {
      id: 'keyword1',
      required: true,
      pattern: /\b(must|have|this|word)\b/i,
      feedback: 'Include the key concept'
    },
    {
      id: 'variable',
      required: true,
      pattern: null,
      contextPattern: (ctx) => new RegExp(ctx.variableName, 'i'),
      feedback: 'Mention the variable name'
    }
  ],
  scoring: {
    E: { maxMissing: 0 },   // E if nothing missing
    P: { maxMissing: 2 },   // P if 1-2 missing
    I: { maxMissing: 99 }   // I otherwise
  }
}
```

---

## Shared Contexts

For real-world problem contexts, create a JSON file in `shared/contexts/`:

```json
{
  "meta": {
    "id": "my-contexts",
    "description": "Contexts for my topic"
  },
  "contexts": [
    {
      "id": "context-1",
      "topic": "Real World Scenario",
      "xVar": "independent variable",
      "yVar": "dependent variable",
      "xUnits": "units",
      "yUnits": "units",
      "xDomain": [0, 100],
      "yDomain": [0, 100]
    }
  ]
}
```

Reference in manifest:
```json
"config": {
  "sharedContexts": "my-contexts"
}
```

The platform will randomly select a context and pass it to your generator.

---

## Progression & Gamification

### Unlock Modes by Gold Stars
```json
"modes": [
  { "id": "level1", "unlockedBy": "default" },
  { "id": "level2", "unlockedBy": { "gold": 15 } },
  { "id": "level3", "unlockedBy": { "gold": 30 } }
]
```

### Star Tiers Based on Hints Used
```json
"hints": {
  "penalty": {
    "0": "gold",    // No hints = gold star
    "1": "silver",  // 1 hint = silver
    "2": "bronze",  // 2 hints = bronze
    "3": "tin"      // 3+ hints = tin
  }
}
```

### Streaks
```json
"progression": {
  "streaksPerField": true,              // Separate streak per input field
  "streakFields": ["slope", "intercept"] // Which fields track streaks
}
```

---

## Template Variables

Use `{{variableName}}` in labels, hints, and info panels. These are replaced with values from `context`:

```json
"label": "Simplify √{{radicand}}"
```

With `context: { radicand: 72 }` becomes: "Simplify √72"

---

## Adding Your Cartridge to the App

After creating your cartridge folder, add it to `platform/app.html`:

```html
<select id="cartridge-select" class="hidden">
  <option value="lsrl-interpretation">LSRL Interpretation</option>
  <option value="residuals">Residuals</option>
  <option value="algebra2-radicals">Simplify Radicals</option>
  <option value="your-topic-id">Your Topic Name</option>  <!-- ADD THIS -->
</select>
```

---

## Complete Examples

### Example 1: LSRL Interpretation (AP Statistics)

See `cartridges/lsrl-interpretation/`:
- Uses shared contexts for real-world scenarios
- Shows scatterplot graph
- 3 text fields graded by regex
- AI grading for nuanced feedback

### Example 2: Simplifying Radicals (Algebra 2)

See `cartridges/algebra2-radicals/`:
- No graph, visual interactive component instead
- 5 progressive difficulty levels
- Pure programmatic grading (no AI needed)
- Custom visual input types

### Example 3: Residuals (AP Statistics)

See `cartridges/residuals/`:
- 3 modes: Calculate, Interpret, Analyze
- Mix of numeric, dropdown, and text inputs
- Shows scatterplot with residual visualization
- AI grading with detailed thinking prompts

---

## Tips for Good Cartridges

1. **Start Simple**: Begin with one mode, add complexity later

2. **Write Clear Hints**: Provide sentence frames or formulas students can follow

3. **Be Lenient in Grading**: Use `maxMissing: 1` for E scores—perfect shouldn't require perfection

4. **Test AI Prompts**: Include the "correct thinking process" in AI prompts so the AI knows what to look for

5. **Use Real Contexts**: Students engage more with realistic scenarios

6. **Progressive Difficulty**: Unlock harder modes after students prove mastery

---

## Testing Your Cartridge

1. Run the dev server: `npm run dev`
2. Open http://localhost:5173/platform/app.html
3. Select your cartridge from the dropdown
4. Test each mode and input type
5. Check browser console for errors

---

## Need Help?

- Check existing cartridges for examples
- Platform source: `platform/platform.js`
- Input renderer: `platform/core/input-renderer.js`
- Grading engine: `platform/core/grading-engine.js`
