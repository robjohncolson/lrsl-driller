# Codex Implementation Prompt — a2t3l5

## Task

Build the complete `a2t3l5` cartridge (Zeros of Polynomial Functions) for the Driller platform. The full design spec is in `cartridges/a2t3l5/SPEC.md` — read it first.

## What to Build

Create these files in `cartridges/a2t3l5/`:

```
cartridges/a2t3l5/
├── manifest.json
├── generator.js
├── grading-rules.js
├── ai-grader-prompt.txt
└── assets/           (animation MP4s go here after render)
```

Plus:
- `tests/grading/a2t3l5.test.js`
- `tests/generators/a2t3l5.test.js`
- Entry in `cartridges/registry.json`
- Manim animation scripts in `animations/a2t3l5/` (14 scenes)

## Reference Files (read these for patterns)

Before writing any code, read these existing cartridge files to match the platform's conventions:

1. **`cartridges/a2t3l3/manifest.json`** — Manifest structure, mode format, hints, progression tiers, display config
2. **`cartridges/a2t3l3/generator.js`** — Generator pattern: utility functions, shuffle bag system, scenario banks, `generateProblem(modeId, context, mode)` export
3. **`cartridges/a2t3l3/grading-rules.js`** — Grading pattern: `gradeField(fieldId, answer, context)` export, normalize/blank helpers, E/P/I scoring
4. **`cartridges/a2t3l3/ai-grader-prompt.txt`** — AI grading template with `{{placeholders}}`
5. **`cartridges/registry.json`** — Registry entry format
6. **`tests/grading/a2t3l3.test.js`** — Test patterns for grading
7. **`shared/scoring.config.js`** — Shared scoring config

## Key Constraints

### Progression
- **14 levels** (l01 through l14)
- L01: `"unlockedBy": "default"`
- L02-L14: `"unlockedBy": {"gold": 1}` (each level requires just 1 gold star from previous)
- Progression tiers mirror mode list exactly

### Animations
- Every level has an animation reference in manifest: `"animation": "assets/{ClassName}.mp4"`
- Scene class names are specified in the SPEC (ZeroMultVocab, FactorToZero, etc.)
- Asset filenames match class names: `ZeroMultVocab.mp4`, `FactorToZero.mp4`, etc.

### Generator Requirements
- Use shuffle bag system (batch 12, history 4) — copy pattern from a2t3l3
- Each level's bank has 8-12 scenarios as specified in SPEC Section "Level Details + Problem Banks"
- `generateProblem(modeId, context, mode)` must return an object with all `{{placeholder}}` values used in the manifest
- For choice/dropdown levels: return `optA`, `optB`, `optC`, `optD` with correct answer randomly placed
- For text/textarea levels: return `answers` object with expected values and tolerances
- For number levels: include tolerance in answers

### Grading Requirements
- Follow E/P/I scoring (see SPEC "Grading Criteria" section)
- Choice/dropdown levels: exact match only (E or I, no P)
- Text levels (L05, L06, L07, L09, L10, L11): parse and normalize student input, support partial credit
- Textarea levels (L13, L14): keyword-based grading with AI fallback
- All fields must handle blank input -> return I with helpful feedback
- Export: `export function gradeField(fieldId, answer, context)`

### Input Types by Level
| Level | Input Field ID | Type | Notes |
|-------|---------------|------|-------|
| L01 | vocabAnswer | choice | 4 options from generator |
| L02 | zeroChoice | choice | 4 numeric options |
| L03 | multChoice | choice | 4 numeric options |
| L04 | crossTouch | choice | "Crosses the x-axis" / "Touches (bounces off) the x-axis" |
| L05 | zerosText | text | Comma-separated numbers |
| L06 | reportText | text | Tuple format: (zero,mult,cross/touch); ... |
| L07 | intervalText | text | Interval notation with U for union |
| L08 | complexType | choice | "Two real zeros" / "Two complex zeros" |
| L09 | complexResult | text | a+bi format |
| L10 | solutionsText | text | Comma-separated numbers |
| L11 | inequalityText | text | Interval notation |
| L12 | transformChoice | dropdown | 4 description options |
| L13 | sketchExplain | textarea | 4-7 sentences |
| L14 | errorExplain | textarea | Error ID + correction |

### AI Grading Prompt
- Only needed for textarea fields: `sketchExplain` (L13) and `errorExplain` (L14)
- Use `{{placeholders}}` for problem context, student answer, and expected answer
- Follow the E/P/I criteria from the SPEC exactly
- Match the template style in `cartridges/a2t3l3/ai-grader-prompt.txt`

### Hints
- Every input field needs a hint in manifest `hints.perField`
- Hints are specified in the SPEC under each level's "Hint" field
- Use the standard penalty tiers: 0=gold, 1=silver, 2=bronze, 3+=tin

## Manifest Structure

Follow this structure (see a2t3l3 manifest for exact format):

```json
{
  "meta": { "id": "a2t3l5", "name": "...", "subject": "Algebra 2", "description": "..." },
  "config": { "contextsFile": null, "skills": ["A-APR.B.3", ...] },
  "display": { "showGraph": false, "graphType": null, "infoPanel": [...] },
  "modes": [ ... 14 mode objects ... ],
  "grading": { "rubricFile": "grading-rules.js", "aiPromptFile": "ai-grader-prompt.txt", "scoring": { "scale": ["E","P","I"], ... } },
  "hints": { "perField": { ... }, "penalty": { "0": "gold", "1": "silver", "2": "bronze", "3": "tin" } },
  "progression": { "streaksPerField": false, "streakFields": ["problem"], "tiers": [ ... 14 tier objects ... ] }
}
```

## Test Requirements

### `tests/grading/a2t3l5.test.js`
For each grading field:
- Correct answer -> E
- Wrong answer -> I  
- Blank/empty -> I with feedback message
- For text fields with partial credit: near-miss -> P
- At least 2 test cases per field

### `tests/generators/a2t3l5.test.js`
For each level:
- `generateProblem` returns valid object
- All expected context keys present
- Shuffle bags provide variety (generate 20, expect >3 unique)
- Choice options include exactly one correct answer

## Registry Entry

Add to `cartridges/registry.json`:
```json
{
  "id": "a2t3l5",
  "name": "Zeros of Polynomial Functions",
  "description": "Find zeros, multiplicity, sign charts, polynomial equations/inequalities, complex expressions, transformations",
  "subject": "Algebra 2",
  "skills": ["A-APR.B.3", "F-IF.C.7c", "F-IF.B.4", "N-CN.C.9", "F-BF.B.3"]
}
```

## Manim Animations

Create 14 Manim scenes in `animations/a2t3l5/`. Each scene is specified in the SPEC under "Animation Specifications". Key rules:

- One Python file per scene (or group related scenes)
- Class names match SPEC exactly (ZeroMultVocab, FactorToZero, etc.)
- Output filename = ClassName.mp4
- Duration: 15-45 seconds each
- Render command: `manim -qm --format=mp4 {file}.py {ClassName}`
- After render, copy MP4s to `cartridges/a2t3l5/assets/`
- Use MathTex for all LaTeX expressions
- Use consistent color scheme across all 14 animations
- Follow animation patterns in existing `animations/` directory

## Validation Checklist

Before marking complete:
- [ ] `npm test` passes (all existing + new tests)
- [ ] All 14 modes generate valid problems
- [ ] All grading fields handle E, P (where applicable), I, and blank
- [ ] All `{{placeholders}}` in manifest have corresponding generator output
- [ ] Registry updated
- [ ] Each mode has `"animation": "assets/{ClassName}.mp4"` in manifest
- [ ] AI grader prompt covers L13 and L14 textarea fields
- [ ] Hints exist for every input field
- [ ] Progression tiers match mode list (14 tiers, all gold:1 except first=default)
