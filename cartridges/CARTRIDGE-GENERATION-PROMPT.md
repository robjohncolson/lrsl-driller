# Cartridge Generation Prompt for LLMs

Use this prompt along with `CARTRIDGE-STATE-MACHINE.md` and the `_template/` cartridge to generate a fully-compliant drill cartridge for the Driller Platform.

---

## Your Task

You are generating a **lesson cartridge** for the Driller Platform, an educational drill/quiz system. A cartridge is like a "game cartridge" that plugs into the platform - it contains all the content and grading logic for a specific lesson topic.

**You will receive:**
1. A PowerPoint/lesson presentation with the topic content
2. A list of pedagogical standards to meet (e.g., Massachusetts standards, AP framework skills)

**You will generate:**
1. `manifest.json` - Configuration, modes, inputs, hints, progression
2. `generator.js` - Problem generation with randomized values
3. `grading-rules.js` - Keyword/programmatic grading for each field
4. `ai-grader-prompt.txt` - AI grading template for open-response fields
5. `contexts.json` (optional) - Real-world scenarios if applicable

---

## Platform Architecture Overview

The platform uses an **E/P/I scoring system**:
- **E (Essentially Correct)**: All key elements present - earns a star
- **P (Partially Correct)**: Some elements missing - no star
- **I (Incorrect)**: Major errors - no star

**Star tiers** based on penalties (hints used + retries):
- **Gold** (0 penalties): 4 points - best performance
- **Silver** (1 penalty): 3 points
- **Bronze** (2 penalties): 2 points
- **Tin** (3+ penalties): 1 point

**Dual grading**: Keywords run first (fast), then AI (if enabled). Best score wins. AI can upgrade but never downgrade a keyword score.

---

## Manifest.json Structure

```json
{
  "meta": {
    "id": "unique-cartridge-id",
    "name": "Display Name for UI",
    "subject": "Subject Area",
    "description": "Brief description for students"
  },
  "config": {
    "contextsFile": null,
    "skills": ["SKILL-CODE-1", "SKILL-CODE-2"]
  },
  "display": {
    "showGraph": false,
    "graphType": null,
    "infoPanel": [
      { "label": "Level", "value": "{{levelName}}" },
      { "label": "Task", "value": "{{problemText}}" },
      { "label": "Given", "value": "{{givenText}}" }
    ]
  },
  "modes": [...],
  "grading": {...},
  "hints": {...},
  "progression": {...}
}
```

### Important Manifest Rules

1. **meta.id** MUST match the directory name exactly
2. **skills** should list curriculum standard codes (AP Course Framework skills, state standards)
3. **infoPanel** uses `{{variable}}` syntax - variables come from generator's `context` object
4. **modes**, **hints.perField**, and **progression.tiers** MUST have aligned IDs

---

## Mode Design Guidelines

### Mode Structure
```json
{
  "id": "l01-topic-name",
  "name": "Level 1: Descriptive Name",
  "unlockedBy": "default",
  "layout": {
    "inputs": [...]
  }
}
```

### Progression Design Best Practices

1. **Start with "default"**: First mode is always `"unlockedBy": "default"`
2. **Sequential unlocking**: Later modes require gold stars from earlier work
3. **Reasonable requirements**:
   - `{ "gold": 1 }` for easy progression between closely related topics
   - `{ "gold": 3 }` for standard progression
   - Higher values for mastery-gated content

### Level Naming Convention
Use format: `l##-descriptive-name` where ## is zero-padded level number:
- `l01-vocabulary`
- `l02-basic-concept`
- `l03-application`

### Input Types Available

| Type | Use Case | Key Properties |
|------|----------|----------------|
| `choice` | Radio buttons (2-4 options) | `options: ["A", "B", "C"]` |
| `dropdown` | Select menu (any number of options) | `options: ["{{optA}}", "{{optB}}"]`, `placeholder` |
| `text` | Single-line free response | `placeholder` |
| `textarea` | Multi-line free response | `rows`, `placeholder` |
| `number` | Numeric input | `min`, `max`, `step` |

### Dynamic Options
For dropdown/choice, you can use `{{variable}}` in options to make them dynamic:
```json
{
  "id": "methodChoice",
  "type": "dropdown",
  "options": ["{{optA}}", "{{optB}}", "{{optC}}", "{{optD}}"],
  "placeholder": "Choose"
}
```
The generator's `context` must include `optA`, `optB`, etc. with the actual option text.

---

## Generator.js Requirements

### Required Export
```javascript
export function generateProblem(modeId, context, mode) {
  // modeId: string - current mode ID from manifest
  // context: object | null - random context from contexts.json (if used)
  // mode: object - the mode config from manifest

  return {
    context: {
      // ALL variables used in {{placeholders}} must be here
      levelName: "Level 1",
      problemText: "What is being asked",
      givenText: "The data/scenario given",
      // ... any other template variables
    },
    graphConfig: null, // or graph config object if showGraph: true
    answers: {
      // Keys MUST match input field IDs
      fieldId: { value: "correct answer" }
    },
    scenario: "Full problem text for display"
  };
}

export default { generateProblem };
```

### Problem Generation Best Practices

1. **Use shuffle bags for scenario variety**:
```javascript
const shuffleBags = {};

function drawFromBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName].pop();
}
```

2. **Create scenario banks per level**:
```javascript
const level1Scenarios = [
  { desc: "Scenario A", answer: "A", explanation: "Why A" },
  { desc: "Scenario B", answer: "B", explanation: "Why B" },
  // ... more scenarios
];
```

3. **Randomize numeric values**:
```javascript
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const a = randInt(2, 9);
const b = randInt(1, 5);
const answer = a * b;
```

4. **Shuffle answer options**:
```javascript
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const options = shuffle(["Correct", "Wrong1", "Wrong2", "Wrong3"]);
context.optA = options[0];
context.optB = options[1];
// ...
```

5. **Include expected reasoning in context** for AI grader:
```javascript
context.expectedReasoning = "The answer is X because of Y and Z";
```

---

## Grading-Rules.js Requirements

### Required Exports
```javascript
export function gradeField(fieldId, answer, context) {
  // fieldId: string - which input field
  // answer: string - student's answer
  // context: object - from generator (includes answers)

  return {
    score: 'E' | 'P' | 'I',
    feedback: "Explanation for student"
  };
}

export function getRule(fieldId) {
  return null; // or rule config if using rule-based grading
}

export default { gradeField, getRule };
```

### Grading Pattern Examples

**1. Exact Match (for choice/dropdown)**:
```javascript
if (fieldId === "methodChoice") {
  const expected = context.methodChoice?.value || context.answers?.methodChoice?.value;
  if (normalize(answer) === normalize(expected)) {
    return { score: 'E', feedback: 'Correct!' };
  }
  return { score: 'I', feedback: `Incorrect. The answer is ${expected}.` };
}
```

**2. Numeric with Tolerance**:
```javascript
if (fieldId === "calculation") {
  const expected = context.answers?.calculation?.value;
  const studentVal = parseFloat(answer);
  if (isNaN(studentVal)) {
    return { score: 'I', feedback: 'Please enter a number.' };
  }
  const diff = Math.abs(studentVal - expected);
  if (diff <= 0.01) {
    return { score: 'E', feedback: 'Correct!' };
  }
  if (diff <= 0.1) {
    return { score: 'P', feedback: 'Close! Check your rounding.' };
  }
  return { score: 'I', feedback: 'Incorrect. Review your calculation.' };
}
```

**3. Keyword-Based (for open response)**:
```javascript
if (fieldId === "explanation") {
  const mentionsKey1 = containsAny(answer, ['keyword', 'synonym']);
  const mentionsKey2 = containsAny(answer, ['required', 'concept']);
  const mentionsWrong = containsAny(answer, ['common', 'misconception']);

  if (mentionsWrong) {
    return { score: 'I', feedback: 'That is a common misconception. Actually...' };
  }
  if (mentionsKey1 && mentionsKey2) {
    return { score: 'E', feedback: 'Excellent explanation!' };
  }
  if (mentionsKey1 || mentionsKey2) {
    return { score: 'P', feedback: 'Good start! Also mention...' };
  }
  return { score: 'I', feedback: 'Your explanation should include...' };
}
```

### Helper Functions
```javascript
function normalize(str) {
  return String(str).trim().toLowerCase();
}

function containsAny(answer, keywords) {
  const norm = normalize(answer);
  return keywords.some(k => norm.includes(normalize(k)));
}

function isBlank(x) {
  return x === null || x === undefined || (typeof x === 'string' && x.trim() === '');
}
```

### Getting Expected Values
```javascript
function getExpectedObj(context, fieldId) {
  // Try direct context access
  const v = context?.[fieldId];
  if (v && typeof v === 'object' && 'value' in v) return v;

  // Try answers object
  const a = context?.answers?.[fieldId];
  if (a && typeof a === 'object' && 'value' in a) return a;

  // Fallback
  if (v !== undefined) return { value: v };
  return { value: undefined };
}
```

---

## AI Grader Prompt Template

### Required Structure
```
You are a [SUBJECT] teacher grading student responses about [TOPIC].

## Context
Level: {{levelName}}
Concept: {{problemText}}
Scenario: {{givenText}}

## Student Response
Field: {{fieldId}}
Response: {{studentAnswer}}

## Expected Answer
{{expectedAnswer}}

## Grading Criteria

### For "[fieldId1]" (what it tests):
- E (Essentially Correct): [specific criteria]
- P (Partially Correct): [specific criteria]
- I (Incorrect): [specific criteria]

Key concepts to look for:
- [concept 1]
- [concept 2]

### For "[fieldId2]" (what it tests):
[repeat pattern]

## Response Format
Respond with ONLY valid JSON:
{
  "{{fieldId}}": {
    "score": "E" or "P" or "I",
    "feedback": "Brief explanation (1-2 sentences)"
  }
}
```

### AI Prompt Best Practices

1. **Be specific about E/P/I criteria** - don't be vague
2. **List keywords/concepts the AI should look for**
3. **Mention common misconceptions** that should result in 'I'
4. **Keep feedback requests brief** - "1-2 sentences"
5. **Use JSON response format** - easier to parse

---

## Hints Best Practices

### Hint Structure
```json
"hints": {
  "perField": {
    "fieldId1": "Hint text with {{variables}} if needed",
    "fieldId2": "Another hint..."
  },
  "penalty": {
    "0": "gold",
    "1": "silver",
    "2": "bronze",
    "3": "tin"
  }
}
```

### Writing Good Hints

1. **Don't give away the answer** - guide thinking
2. **Include formulas/sentence frames** for open response
3. **Reference key vocabulary** students should use
4. **Use {{variables}}** to personalize to current problem

**Examples:**
```json
{
  "slopeInterpret": "For every 1 unit increase in {{xVar}}, {{yVar}} changes by the slope amount. Include units!",
  "methodChoice": "SRS = random from list. Stratified = sample FROM EACH group. Cluster = select ENTIRE groups.",
  "calculation": "Use the formula: result = {{formula}}. Show your work step by step."
}
```

---

## Progression Best Practices

### Tier Structure
```json
"progression": {
  "streaksPerField": false,
  "streakFields": ["problem"],
  "tiers": [
    {
      "id": "l01-intro",
      "name": "01",
      "unlockedBy": "default",
      "celebrationMessage": "Great start! Moving on to..."
    },
    {
      "id": "l02-basics",
      "name": "02",
      "unlockedBy": { "gold": 3 },
      "celebrationMessage": "Basics mastered! Now for..."
    }
  ]
}
```

### Celebration Messages
- Keep them brief and encouraging
- Reference what's coming next
- Build excitement for progression

---

## Contexts.json (Optional)

Use when you want real-world scenario variety:

```json
{
  "meta": {
    "id": "my-contexts",
    "description": "Real-world scenarios for topic variety"
  },
  "contexts": [
    {
      "id": "scenario-1",
      "topic": "Sports Statistics",
      "xVar": "practice hours",
      "yVar": "game score",
      "xUnits": "hours",
      "yUnits": "points"
    },
    {
      "id": "scenario-2",
      "topic": "Business Analysis",
      "xVar": "advertising spend",
      "yVar": "sales",
      "xUnits": "dollars",
      "yUnits": "dollars"
    }
  ]
}
```

Reference in manifest:
```json
"config": {
  "contextsFile": "contexts.json"
}
```

---

## Curriculum Alignment

### Skills Array
List all curriculum standard codes the cartridge addresses:
```json
"skills": [
  "DAT-2.A",    // AP Statistics framework
  "DAT-2.B",
  "F-IF.4",     // Common Core math
  "A.REI.1"     // State standards
]
```

### Level-to-Standard Mapping
Design each level to address specific standards. Document in comments:
```javascript
// Level 1 (l01-vocabulary): Addresses DAT-2.A.1, DAT-2.A.2
// Level 2 (l02-identify): Addresses DAT-2.B.1
```

---

## Common Pitfalls to Avoid

1. **Mismatched IDs**: Mode IDs, hint field IDs, and progression tier IDs MUST align
2. **Missing context variables**: Every `{{variable}}` must exist in generator's context
3. **Forgetting answers object**: Generator must return answers for all input fields
4. **Inconsistent scoring**: Always return exactly 'E', 'P', or 'I' (case-sensitive)
5. **Blank handling**: Always check for blank answers first
6. **Hardcoded options**: Use shuffle and context variables for dropdown options
7. **Overly strict grading**: Be lenient for 'E' - students shouldn't need perfection
8. **Missing celebration messages**: Every tier should have a celebrationMessage

---

## Testing Checklist

Before considering a cartridge complete:

- [ ] `manifest.json` is valid JSON (use a JSON validator)
- [ ] All mode IDs are unique
- [ ] All input field IDs are unique within their mode
- [ ] Every input field has a corresponding hint in `hints.perField`
- [ ] Every mode has a corresponding tier in `progression.tiers`
- [ ] Generator returns all required context variables
- [ ] Generator returns answers for all input fields
- [ ] Grading handles all field IDs used in the manifest
- [ ] Grading handles blank answers appropriately
- [ ] AI prompt covers all open-response field IDs
- [ ] Cartridge added to `registry.json`
- [ ] Cartridge option added to `platform/app.html` dropdown

---

## Example: Generating from a Lesson

**Given a PowerPoint about "Polynomial Identities":**

1. **Identify key concepts** from slides:
   - Vocabulary: terms, coefficients, degree
   - Operations: adding, subtracting
   - Identities: difference of squares, perfect square trinomials

2. **Map to levels** (scaffolded):
   - L1: Vocabulary identification
   - L2: Identifying like terms
   - L3: Combining like terms
   - L4: Expanding identities
   - L5: Recognizing patterns
   - L6: Application problems

3. **Design inputs per level**:
   - Vocab → choice (multiple choice)
   - Like terms → choice
   - Combining → text (simplified expression)
   - Expanding → text (expanded form)
   - Patterns → dropdown (identity name)
   - Application → text + number

4. **Create scenario banks** for each level with 8-12 variations

5. **Write grading rules** with appropriate tolerance/keywords

6. **Write AI prompt** covering open-response fields

7. **Add hints** that guide without giving away answers

8. **Set progression** with reasonable gold requirements

---

## Summary

A well-designed cartridge should:
- **Scaffold learning** from simple to complex
- **Provide variety** through randomization and scenario banks
- **Grade fairly** with appropriate tolerance for partial credit
- **Give helpful feedback** that guides improvement
- **Align to standards** explicitly listed in skills array
- **Encourage progression** through reasonable unlock requirements
