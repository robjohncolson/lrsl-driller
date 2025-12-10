# Cartridge Authoring Guide

This document provides complete instructions for creating new "cartridges" (topic modules) for the Driller Platform. A cartridge encapsulates all content and logic for a specific educational topic, while the platform handles user management, gamification, and UI rendering.

## Architecture Overview

```
Platform (The "Nintendo")          Cartridge (The "Game")
─────────────────────────          ─────────────────────────
• User system                      • Content/scenarios
• Gamification (streaks, stars)    • Problem generation
• Sound effects                    • Grading rubrics
• Celebrations                     • AI grading prompts
• Leaderboard                      • Hints/frames
• Graph rendering                  • Display templates
• Input rendering
• Settings/API keys
```

## Cartridge File Structure

Each cartridge lives in `/cartridges/{cartridge-id}/` with these required files:

```
cartridges/
  {cartridge-id}/
    manifest.json       # Configuration and metadata
    generator.js        # Problem generation logic
    grading-rules.js    # Scoring rubrics and validation
    ai-grader-prompt.txt # AI grading system prompt
```

---

## 1. manifest.json

The manifest is the cartridge's configuration file. It defines metadata, input fields, modes, hints, and progression.

### Complete Schema

```json
{
  "meta": {
    "id": "topic-id",
    "name": "Human-Readable Topic Name",
    "subject": "AP Statistics",
    "unit": "2",
    "lesson": "7",
    "version": "1.0.0",
    "description": "Brief description of what this topic covers",
    "skills": [
      "Skill 1 students will practice",
      "Skill 2 students will practice"
    ]
  },

  "config": {
    "sharedContexts": "ap-stats-bivariate",
    "serverUrl": "https://lrsl-driller-production.up.railway.app"
  },

  "display": {
    "showGraph": true,
    "graphType": "scatterplot",
    "infoPanel": [
      { "label": "Equation", "value": "ŷ = {{intercept}} + {{slope}}x" },
      { "label": "Correlation", "value": "r = {{r}}" }
    ]
  },

  "modes": [
    {
      "id": "mode-id",
      "name": "Mode Display Name",
      "weight": 0.5,
      "unlockedBy": "default",
      "layout": {
        "graph": "scatterplot-with-line",
        "inputs": [
          {
            "id": "field-id",
            "label": "Field Label",
            "type": "textarea",
            "rows": 4,
            "placeholder": "Enter your answer...",
            "color": "purple"
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
        "E": "Essentially Correct - all key elements present",
        "P": "Partially Correct - some elements missing",
        "I": "Incorrect - major errors or missing elements"
      }
    }
  },

  "hints": {
    "perField": {
      "field-id": "Hint text with {{variables}} that will be interpolated from context"
    },
    "penalty": {
      "0": "gold",
      "1": "silver",
      "2": "bronze",
      "3+": "tin"
    }
  },

  "progression": {
    "streakFields": ["field-id"],
    "tiers": [
      {
        "id": "basic",
        "name": "Basic Mode",
        "unlockedBy": "default"
      },
      {
        "id": "advanced",
        "name": "Advanced Mode",
        "unlockedBy": { "gold": 5 }
      }
    ]
  }
}
```

### Field Types

| Type | Description | Additional Properties |
|------|-------------|----------------------|
| `textarea` | Multi-line text input | `rows`, `placeholder` |
| `text` | Single-line text input | `placeholder` |
| `number` | Numeric input | `min`, `max`, `step`, `units` |
| `choice` | Single-select dropdown | `options: [{value, label}]` |
| `radio` | Radio button group | `options: [{value, label}]` |

### Graph Types

| Type | Description |
|------|-------------|
| `scatterplot` | Basic scatterplot with points |
| `scatterplot-with-line` | Scatterplot with regression line |
| `scatterplot-highlight-point` | Scatterplot with one point emphasized |
| `residual-plot` | Residuals vs x or predicted values |
| `histogram` | Bar chart for distributions |
| `boxplot` | Five-number summary visualization |
| `normal-curve` | Normal distribution curve |

---

## 2. generator.js

The generator creates problems with random values within realistic constraints.

### Required Exports

```javascript
/**
 * Generate a problem for the given mode
 * @param {string} modeId - The mode ID from manifest
 * @param {object} context - Shared context (from ap-stats-bivariate.json)
 * @param {object} mode - The mode config from manifest
 * @returns {object} Problem data
 */
export function generateProblem(modeId, context, mode) {
  // Your generation logic here
  return {
    context: { /* computed values merged with input context */ },
    graphConfig: { /* graph rendering configuration */ },
    answers: { /* correct answers for grading */ },
    scenario: "Problem statement text"
  };
}
```

### Return Object Structure

```javascript
{
  // Context: All variables available for interpolation in hints, grading, display
  context: {
    ...originalContext,  // From shared contexts file

    // Computed values
    slope: 2.34,
    intercept: 15.7,
    r: 0.85,
    rDirection: "positive",
    strength: "strong",
    slopeAbs: "2.34",

    // For residuals
    targetX: 5,
    targetY: 78,
    predictedY: 27.4,
    residual: 50.6,
    residualAbs: "50.6",
    overUnder: "underestimated"
  },

  // Graph configuration
  graphConfig: {
    type: "scatterplot",
    points: [
      { x: 1, y: 23, id: "p1" },
      { x: 2, y: 28, id: "p2" },
      // ... more points
    ],
    xLabel: "Hours Studied",
    yLabel: "Test Score",
    xDomain: [0, 12],
    yDomain: [40, 100],
    regression: {
      show: true,
      slope: 2.34,
      intercept: 15.7
    },
    highlight: {
      index: "p5",  // ID of point to highlight
      showResidualLine: true
    }
  },

  // Correct answers (for grading)
  answers: {
    "field-id": {
      value: "expected value",
      // Additional metadata for grading
    }
  },

  // Problem display text
  scenario: "A researcher collected data on student study habits..."
}
```

### Example: LSRL Generator

```javascript
export function generateProblem(modeId, context, mode) {
  // Generate correlation (-0.95 to +0.95)
  const rSign = Math.random() > 0.5 ? 1 : -1;
  const rMagnitude = 0.3 + Math.random() * 0.65;
  const r = Math.round(rSign * rMagnitude * 1000) / 1000;

  // Determine strength descriptor
  const absR = Math.abs(r);
  const strength = absR >= 0.7 ? 'strong' : absR >= 0.4 ? 'moderate' : 'weak';
  const rDirection = r >= 0 ? 'positive' : 'negative';

  // Calculate slope and intercept
  const yRange = context.yDomain[1] - context.yDomain[0];
  const xRange = context.xDomain[1] - context.xDomain[0];
  const slope = Math.round(rSign * (yRange / xRange) * Math.abs(r) * 100) / 100;
  const midX = (context.xDomain[0] + context.xDomain[1]) / 2;
  const midY = (context.yDomain[0] + context.yDomain[1]) / 2;
  const intercept = Math.round((midY - slope * midX) * 100) / 100;

  // Generate data points
  const points = generateDataPoints(slope, intercept, r, context, 12);

  return {
    context: {
      ...context,
      r,
      slope,
      intercept,
      slopeAbs: Math.abs(slope).toFixed(2),
      strength,
      rDirection,
      direction: slope >= 0 ? 'increases' : 'decreases'
    },
    graphConfig: {
      type: 'scatterplot',
      points,
      xLabel: context.xVar,
      yLabel: context.yVar,
      xDomain: context.xDomain,
      yDomain: context.yDomain,
      regression: { show: true, slope, intercept }
    },
    answers: {
      slope: { direction: rDirection, value: slope },
      intercept: { value: intercept, meaningful: context.interceptMeaningful },
      correlation: { strength, direction: rDirection }
    },
    scenario: `A researcher collected data on ${context.topic.toLowerCase()}...`
  };
}
```

---

## 3. grading-rules.js

Defines how student answers are evaluated. Supports numeric, exact match, and regex-based rubrics.

### Required Exports

```javascript
/**
 * Get the grading rule for a field
 * @param {string} fieldId - The field ID
 * @returns {object} Grading rule
 */
export function getRule(fieldId) {
  return rules[fieldId] || null;
}

/**
 * Grade a single field
 * @param {string} fieldId - The field ID
 * @param {string} answer - Student's answer
 * @param {object} context - Problem context
 * @returns {object} Grading result {score, feedback, matched, missing}
 */
export function gradeField(fieldId, answer, context) {
  // Your grading logic
}
```

### Rule Types

#### Numeric Rule
```javascript
{
  type: 'numeric',
  expected: 'predictedY',  // Key in context, or a number
  tolerance: 0.15,         // Absolute or relative tolerance
  relativeTolerance: true, // If true, tolerance is percentage
  feedback: {
    E: 'Correct!',
    P: 'Close, check your calculation',
    I: 'Remember the formula...'
  }
}
```

#### Exact Match Rule
```javascript
{
  type: 'exact',
  expected: 'appropriate',  // Key in context, or literal value
  feedback: {
    E: 'Correct!',
    I: 'Try again...'
  }
}
```

#### Regex/Rubric Rule
```javascript
{
  type: 'regex',
  rubric: [
    {
      id: 'prediction',
      required: true,
      pattern: /\b(predict|expected|estimate|on average)\b/i,
      feedback: 'Use prediction language'
    },
    {
      id: 'direction',
      required: true,
      pattern: /\b(increase|decrease|higher|lower)\b/i,
      feedback: 'State the direction of change',
      validate: (match, ctx) => {
        // Custom validation against context
        const found = match[0].toLowerCase();
        const expected = ctx.slope >= 0 ? 'increase' : 'decrease';
        return found.includes(expected);
      }
    },
    {
      id: 'variable',
      required: true,
      pattern: null,  // Dynamically generated
      contextPattern: (ctx) => new RegExp(escapeRegex(ctx.yVar), 'i'),
      feedback: 'Mention the response variable'
    }
  ],
  forbidden: ['causes', 'proves'],  // Words that indicate incorrect thinking
  scoring: {
    E: { minRequired: 5, maxMissing: 0 },
    P: { minRequired: 3, maxMissing: 2 },
    I: { minRequired: 0, maxMissing: 5 }
  }
}
```

### Example: Residuals Grading Rules

```javascript
const rules = {
  // Numeric: Calculate predicted value
  predicted: {
    type: 'numeric',
    expected: 'predictedY',
    tolerance: 0.15,
    relativeTolerance: true,
    feedback: {
      E: 'Correct prediction!',
      P: 'Close, but check your calculation',
      I: 'Remember: ŷ = intercept + slope × x'
    }
  },

  // Numeric: Calculate residual
  residual: {
    type: 'numeric',
    expected: 'residual',
    tolerance: 0.15,
    relativeTolerance: true,
    feedback: {
      E: 'Correct residual!',
      P: 'Close: residual = actual - predicted',
      I: 'Remember: residual = y - ŷ'
    }
  },

  // Exact: Is linear model appropriate?
  appropriate: {
    type: 'exact',
    expected: 'appropriate',  // From context: 'Yes' or 'No'
    feedback: {
      E: 'Correct assessment!',
      I: 'Linear is appropriate only when residuals show random scatter'
    }
  },

  // Regex: Interpret residual
  interpretation: {
    type: 'regex',
    rubric: [
      {
        id: 'actual',
        required: true,
        pattern: /\b(actual|observed|real)\b/i,
        feedback: 'Refer to the actual value'
      },
      {
        id: 'comparison',
        required: true,
        pattern: /\b(more|less|higher|lower|greater|fewer)\b.*\b(than|predicted)\b/i,
        feedback: 'Compare actual to predicted'
      },
      {
        id: 'variable',
        required: true,
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.yVar), 'i'),
        feedback: 'Mention the response variable'
      },
      {
        id: 'magnitude',
        required: false,
        contextPattern: (ctx) => new RegExp(ctx.residualAbs),
        feedback: 'Include the residual value'
      }
    ],
    scoring: {
      E: { minRequired: 3, maxMissing: 1 },
      P: { minRequired: 2, maxMissing: 2 },
      I: { minRequired: 0, maxMissing: 4 }
    }
  }
};

export function gradeField(fieldId, answer, context) {
  const rule = rules[fieldId];
  if (!rule) return { score: 'I', feedback: 'Unknown field' };

  switch (rule.type) {
    case 'numeric': return gradeNumeric(answer, rule, context);
    case 'exact': return gradeExact(answer, rule, context);
    case 'regex': return gradeRegex(answer, rule, context);
  }
}
```

---

## 4. ai-grader-prompt.txt

System prompt template for AI grading. Use `{{placeholders}}` for context interpolation.

### Template Structure

```
You are an AP Statistics grader for Topic {{meta.unit}}.{{meta.lesson}}: {{meta.name}}.

## CONTEXT
Topic: {{topic}}
X variable: {{xVar}} ({{xUnits}})
Y variable: {{yVar}} ({{yUnits}})
Regression equation: ŷ = {{intercept}} + {{slope}}x
Correlation: r = {{r}}

## STUDENT ANSWER
Field: {{fieldId}}
Response: {{answer}}

## GRADING RUBRIC
[Specific rubric for this field type]

### For {{fieldId}}:
Required elements:
1. Element 1 description
2. Element 2 description
3. Element 3 description

Common errors to watch for:
- Error type 1
- Error type 2

## SCORING
- E (Essentially Correct): All required elements present, no major errors
- P (Partially Correct): Most elements present, minor errors
- I (Incorrect): Missing critical elements or major conceptual errors

## RESPONSE FORMAT
Respond with valid JSON only:
{
  "score": "E" | "P" | "I",
  "feedback": "Brief explanation of score"
}
```

---

## 5. Shared Contexts

Contexts provide real-world scenarios. Store in `/shared/contexts/{subject}.json`.

### Schema

```json
{
  "meta": {
    "id": "ap-stats-bivariate",
    "description": "Real-world contexts for regression/correlation",
    "compatibleWith": ["lsrl-interpretation", "residuals"]
  },
  "contexts": [
    {
      "id": "unique-id",
      "topic": "Display Title",
      "xVar": "explanatory variable name",
      "yVar": "response variable name",
      "xUnits": "unit label",
      "yUnits": "unit label",
      "xDomain": [min, max],
      "yDomain": [min, max],
      "interceptMeaningful": true,
      "interceptReason": "Explanation if false",
      "expectedDirection": "positive",
      "tags": ["category1", "category2"]
    }
  ]
}
```

---

## Complete Example: Confidence Intervals Cartridge

### manifest.json

```json
{
  "meta": {
    "id": "confidence-intervals",
    "name": "Confidence Interval Interpretation",
    "subject": "AP Statistics",
    "unit": "6",
    "lesson": "4",
    "description": "Practice writing correct CI interpretations",
    "skills": ["Write confidence interval interpretations in context"]
  },
  "config": {
    "sharedContexts": "ap-stats-inference"
  },
  "display": {
    "showGraph": false,
    "infoPanel": [
      { "label": "Confidence Level", "value": "{{confidenceLevel}}%" },
      { "label": "Interval", "value": "({{lower}}, {{upper}})" },
      { "label": "Sample Size", "value": "n = {{n}}" }
    ]
  },
  "modes": [
    {
      "id": "interpret",
      "name": "Interpret CI",
      "weight": 1.0,
      "unlockedBy": "default",
      "layout": {
        "inputs": [
          {
            "id": "interpretation",
            "label": "Confidence Interval Interpretation",
            "type": "textarea",
            "rows": 4,
            "placeholder": "We are __% confident that..."
          }
        ]
      }
    }
  ],
  "grading": {
    "rubricFile": "grading-rules.js",
    "aiPromptFile": "ai-grader-prompt.txt"
  },
  "hints": {
    "perField": {
      "interpretation": "We are {{confidenceLevel}}% confident that the true {{parameter}} of {{population}} is between {{lower}} and {{upper}} {{units}}."
    }
  },
  "progression": {
    "streakFields": ["interpretation"],
    "tiers": [
      { "id": "basic", "name": "Single CI", "unlockedBy": "default" }
    ]
  }
}
```

### generator.js

```javascript
export function generateProblem(modeId, context, mode) {
  // Random confidence level
  const confidenceLevels = [90, 95, 99];
  const confidenceLevel = confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)];

  // Generate sample statistics
  const n = 50 + Math.floor(Math.random() * 200);
  const sampleMean = context.meanRange[0] + Math.random() * (context.meanRange[1] - context.meanRange[0]);
  const standardError = context.seRange[0] + Math.random() * (context.seRange[1] - context.seRange[0]);

  // Calculate interval
  const zStars = { 90: 1.645, 95: 1.96, 99: 2.576 };
  const marginOfError = zStars[confidenceLevel] * standardError;
  const lower = (sampleMean - marginOfError).toFixed(2);
  const upper = (sampleMean + marginOfError).toFixed(2);

  return {
    context: {
      ...context,
      confidenceLevel,
      n,
      sampleMean: sampleMean.toFixed(2),
      lower,
      upper,
      parameter: context.parameter,
      population: context.population
    },
    graphConfig: null,  // No graph for this topic
    answers: {
      interpretation: {
        requiredElements: ['confident', 'true', 'population', 'between']
      }
    },
    scenario: `A researcher surveyed ${n} ${context.sampleDescription}...`
  };
}
```

### grading-rules.js

```javascript
const rules = {
  interpretation: {
    type: 'regex',
    rubric: [
      {
        id: 'confident',
        required: true,
        pattern: /\b(\d+)%?\s*confident\b/i,
        feedback: 'State the confidence level',
        validate: (match, ctx) => parseInt(match[1]) === ctx.confidenceLevel
      },
      {
        id: 'true',
        required: true,
        pattern: /\b(true|population|actual)\b/i,
        feedback: 'Reference the TRUE population parameter'
      },
      {
        id: 'parameter',
        required: true,
        contextPattern: (ctx) => new RegExp(ctx.parameter, 'i'),
        feedback: 'Name the parameter being estimated'
      },
      {
        id: 'bounds',
        required: true,
        pattern: /\b(between|from)\b.*\b(and|to)\b/i,
        feedback: 'State the interval bounds'
      }
    ],
    forbidden: [
      '95% of',        // Common error: "95% of data falls..."
      'probability',   // Incorrect: treating interval as probability
      'sample mean'    // Should reference population, not sample
    ],
    scoring: {
      E: { minRequired: 4, maxMissing: 0 },
      P: { minRequired: 2, maxMissing: 2 },
      I: { minRequired: 0, maxMissing: 4 }
    }
  }
};

export function gradeField(fieldId, answer, context) {
  // Implementation...
}
```

---

## Testing Your Cartridge

1. **Add to vite.config.js**:
```javascript
rollupOptions: {
  input: {
    // ... existing entries
    demo: 'platform/demo.html'
  }
}
```

2. **Test locally**:
```bash
npm run dev
# Navigate to http://localhost:5173/platform/demo.html
# Select your cartridge from dropdown
```

3. **Verify**:
- [ ] Problems generate with valid data
- [ ] Graph renders correctly (if applicable)
- [ ] All input fields appear
- [ ] Hints display with interpolated values
- [ ] Grading returns E/P/I correctly
- [ ] Streaks increment on E scores
- [ ] Stars awarded based on hints used

---

## Checklist for New Cartridges

- [ ] `manifest.json` with all required fields
- [ ] `generator.js` exports `generateProblem()`
- [ ] `grading-rules.js` exports `getRule()` and `gradeField()`
- [ ] `ai-grader-prompt.txt` with complete rubric
- [ ] Shared contexts file if needed
- [ ] All `{{variables}}` match between files
- [ ] Graph config matches graph type in manifest
- [ ] Input field IDs match grading rule keys
- [ ] Hint field IDs match input field IDs
