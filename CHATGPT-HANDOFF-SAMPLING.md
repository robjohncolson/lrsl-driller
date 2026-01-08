# Cartridge Handoff: AP Statistics Sampling (Unit 3.1-3.3)

You are receiving a **lesson cartridge** for an educational drill platform. This document explains the architecture, conventions, and files so you can analyze, critique, or extend the cartridge.

---

## Platform Architecture: Console + Cartridge

Think of this like a **game console**:

- **Platform (Console)**: The generic engine that handles UI rendering, grading, progression, streaks, stars, and gamification. It's topic-agnostic.
- **Cartridge (Lesson)**: A self-contained lesson module that plugs into the platform. Each cartridge provides its own problems, grading rules, and progression.

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

---

## The Four Cartridge Files

### 1. `manifest.json` — The Blueprint

Declares **everything** about the lesson:
- **meta**: ID, name, subject, description
- **modes**: The levels/stages of the lesson (each with its own input layout)
- **grading**: Which files handle grading, what scoring scale to use
- **hints**: Per-field hints that students can reveal (with star penalties)
- **progression**: How levels unlock (e.g., "need 5 gold stars to unlock level 2")

**Key concepts:**
- `unlockedBy: "default"` = available immediately
- `unlockedBy: { "gold": 5 }` = requires 5 gold stars to unlock
- Input types: `text`, `textarea`, `number`, `dropdown`, `choice` (radio buttons)
- Template variables: `{{variableName}}` gets replaced with values from context

### 2. `generator.js` — Problem Factory

Exports a function `generateProblem(modeId, context, mode)` that returns:
- **context**: All variables available for template substitution and grading
- **answers**: The correct answers keyed by field ID
- **graphConfig**: Optional graph configuration (scatterplots, etc.)
- **scenario**: Text description shown to student

**Key patterns in this cartridge:**
- **Shuffle bags**: Prevents repeat scenarios until all have been shown
- **Scenario banks**: Arrays of pre-written scenarios with metadata
- **Mode branching**: Different `if (modeId === "...")` blocks for each level

### 3. `grading-rules.js` — Keyword/Programmatic Grader

Exports `gradeField(fieldId, answer, context)` returning `{ score, feedback }`.

**Scoring scale (E/P/I):**
- **E (Essentially Correct)**: Student demonstrates full understanding
- **P (Partially Correct)**: Some understanding but missing key elements
- **I (Incorrect)**: Major errors or fundamental misunderstanding

This file runs **first** (fast, no API calls). It handles:
- Exact matches for dropdowns/choices
- Keyword detection for open responses
- Partial credit logic

### 4. `ai-grader-prompt.txt` — AI Grader Template

For open-response questions, this template is filled with context variables and sent to an AI (Gemini/Groq). The AI returns E/P/I scores.

**Template variables**: `{{levelName}}`, `{{problemText}}`, `{{studentAnswer}}`, `{{expectedAnswer}}`, `{{fieldId}}`

**Dual grading flow:**
1. Keywords run first (instant)
2. AI runs second (if enabled)
3. Best score wins — AI can override keywords when it recognizes nuance

---

## This Cartridge: AP Statistics Unit 3.1-3.3

### Pedagogical Focus

**Topic 3.1: Why Does Chance Matter?**
- Distinguish chance-based data collection from non-random methods
- Key insight: Without randomness, conclusions are untrustworthy

**Topic 3.2: Observational Studies vs Experiments**
- 3.2a: Population vs Sample
- 3.2b: Observational Study vs Experiment
- 3.2c: Random Selection → Generalization (can we apply results to the population?)
- 3.2d: Random Assignment → Causation (can we claim cause-and-effect?)
- 3.2e: Scope of Inference 2×2 table (combining both dimensions)

**Topic 3.3: Sampling Methods**
- 3.3a: Simple Random Sample (SRS) — every GROUP of n has equal chance
- 3.3b: Stratified Random Sample — divide into groups, sample FROM EACH
- 3.3c: Cluster Random Sample — divide into groups, select ENTIRE groups
- 3.3d: Stratified vs Cluster comparison
- 3.3e: Systematic sampling and Census
- 3.3f-g: Identify methods and explain advantages

**Capstones**: Integrate multiple concepts

### The Critical Distinction

This cartridge hammers home the difference between:

| Concept | Depends On | Allows |
|---------|------------|--------|
| **Generalization** | Random SELECTION from population | Apply results to whole population |
| **Causation** | Random ASSIGNMENT of treatments | Claim cause-and-effect |

These are **independent**! A study can have:
- Both (randomized experiment with random sample)
- Just generalization (observational study with random sample)
- Just causation (experiment with volunteers)
- Neither (observational study with convenience sample)

---

## Level Progression (15 Levels)

| Level | ID | Focus | Input Types |
|-------|-----|-------|-------------|
| 1 | l01-chance-matters | Does method use chance? | choice (Yes/No) |
| 2 | l02-population-sample | Population vs Sample | choice |
| 3 | l03-obs-vs-exp | Observational vs Experiment | choice |
| 4 | l04-random-selection | Random Selection → Generalize | choice + text (open response) |
| 5 | l05-random-assignment | Random Assignment → Causation | choice + text (open response) |
| 6 | l06-scope-of-inference | 2×2 Scope Table | 2 choices |
| 7 | l07-srs-definition | SRS definition | dropdown |
| 8 | l08-stratified-definition | Stratified definition | dropdown |
| 9 | l09-cluster-definition | Cluster definition | dropdown |
| 10 | l10-strat-vs-cluster | Compare methods | 2 choices (radio) |
| 11 | l11-systematic-census | Systematic & Census | dropdown |
| 12 | l12-identify-method | Identify method from scenario | dropdown |
| 13 | l13-why-method | Identify + explain advantage | dropdown + text (open response) |
| 14 | l14-capstone-sampling | Sampling capstone | dropdown + choice + text |
| 15 | l15-capstone-full | Full unit capstone | choice + dropdown + 2 choices |

---

## Key Implementation Details

### Shuffle Bag System

Prevents scenario repeats until all scenarios have been shown:

```javascript
const shuffleBags = {};

function drawFromBag(bankName, sourceArray) {
  if (!shuffleBags[bankName] || shuffleBags[bankName].length === 0) {
    shuffleBags[bankName] = shuffle(sourceArray);
  }
  return shuffleBags[bankName].pop();
}
```

### Open Response Grading

"Why" questions use text input with dual grading:

**Keywords (grading-rules.js):**
```javascript
if (fieldId === "whyGeneralize") {
  const mentionsRandomSelection = containsAny(answer, ["random selection", "randomly selected"]);
  const mentionsRepresentative = containsAny(answer, ["representative"]);

  if (mentionsRandomSelection) return { score: "E", feedback: "..." };
  if (mentionsRepresentative) return { score: "P", feedback: "..." };
  return { score: "I", feedback: "..." };
}
```

**AI (ai-grader-prompt.txt):**
- Provides rubric with E/P/I criteria
- Knows to look for specific vocabulary
- Can recognize correct answers that keywords miss

### Dynamic Template Labels

The manifest can use template variables in labels:
```json
{
  "id": "stratFeature",
  "type": "choice",
  "label": "{{stratQuestion}}",
  "options": ["{{stratOptA}}", "{{stratOptB}}"]
}
```

The generator provides these values in context, allowing different questions to use the same manifest structure.

---

## What You Could Do With This

1. **Analyze for pedagogical soundness**: Do the questions build appropriately? Are there gaps?

2. **Suggest additional scenarios**: The scenario banks could always use more variety.

3. **Improve grading rubrics**: Are the keyword patterns too strict/lenient? Is the AI prompt missing edge cases?

4. **Extend the cartridge**: Add levels for:
   - Bias types (voluntary response, undercoverage, nonresponse)
   - Experimental design principles (control, replication, blocking)
   - Matched pairs and completely randomized designs

5. **Create a similar cartridge**: Use this as a template for another unit.

6. **Critique the progression**: Is the unlock structure appropriate? Should some levels be combined or split?

---

## Files Attached

Below are the four files from this cartridge. Analyze them as a complete system.

---

### FILE 1: manifest.json

```json
[PASTE MANIFEST.JSON CONTENTS HERE]
```

---

### FILE 2: generator.js

```javascript
[PASTE GENERATOR.JS CONTENTS HERE]
```

---

### FILE 3: grading-rules.js

```javascript
[PASTE GRADING-RULES.JS CONTENTS HERE]
```

---

### FILE 4: ai-grader-prompt.txt

```
[PASTE AI-GRADER-PROMPT.TXT CONTENTS HERE]
```

---

## AP Statistics Framework Reference

When analyzing this cartridge, compare against these AP Statistics Learning Objectives:

**DAT-2.A**: Describe the differences between populations and samples and parameters and statistics.
**DAT-2.B**: Identify and explain factors that determine how results from samples can be extended to populations and whether association or causation can be inferred.
**DAT-2.C**: Identify and describe sampling methods.
**DAT-2.D**: Describe how sampling methods may produce representative samples, address sources of bias, and affect the precision of estimates.
**VAR-1.E**: Explain how trustworthy conclusions require data collection methods that use chance.

---

*Created for handoff between AI assistants. The goal is full context transfer so the receiving AI can work effectively on this cartridge.*
