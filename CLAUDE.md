# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Teaching materials repository for AP Statistics, focusing on linear regression and correlation concepts. The project has two architectures:
1. **Legacy**: Standalone HTML apps (file:// protocol, no build)
2. **Modular Platform**: Cartridge-based system with Vite build (requires `npm run dev`)

## Development

### Modular Platform (New)
```bash
npm install
npm run dev      # Start Vite dev server
npm run build    # Build for production
```
Access at: http://localhost:5173/platform/demo.html

### Legacy Apps
Open HTML files directly in browser (file:// protocol works).

## File Structure

### Entry Points
- `index.html` - Legacy LSRL trainer (monolithic)
- `platform/demo.html` - Modular platform demo (uses ES modules)
- `zscore_3d_explorer.html` - 3D visualization

### Platform (Console) - Topic-Agnostic
```
platform/
  platform.js           # Main orchestrator
  core/
    game-engine.js      # Streaks, stars, progression
    grading-engine.js   # Numeric, regex, AI grading
    graph-engine.js     # Canvas-based charts
    input-renderer.js   # Dynamic form fields
    cartridge-loader.js # Loads manifests and modules
```

### Cartridges (Topics) - Content-Specific
```
cartridges/
  lsrl-interpretation/
    manifest.json       # Config: modes, inputs, hints, progression
    generator.js        # Problem generation
    grading-rules.js    # E/P/I rubrics
    ai-grader-prompt.txt
  residuals/
    manifest.json
    generator.js
    grading-rules.js
    ai-grader-prompt.txt
```

### Shared Resources
```
shared/
  contexts/
    ap-stats-bivariate.json  # Real-world scenarios for regression topics
```

## Creating New Cartridges

A cartridge requires 4 files:

### manifest.json
```json
{
  "meta": { "id": "topic-id", "name": "Topic Name", "subject": "AP Statistics" },
  "config": { "sharedContexts": "ap-stats-bivariate", "skills": ["skill1", "skill2"] },
  "display": { "showGraph": true, "graphType": "scatterplot", "infoPanel": [...] },
  "modes": [{ "id": "mode-id", "name": "Mode Name", "unlockedBy": "default", "layout": { "inputs": [...] } }],
  "grading": { "rubricFile": "grading-rules.js", "aiPromptFile": "ai-grader-prompt.txt" },
  "hints": { "perField": { "fieldId": "Hint text with {{variables}}" } },
  "progression": { "streakFields": ["field1"], "tiers": [...] }
}
```

### generator.js
```javascript
export function generateProblem(modeId, context, mode) {
  return {
    context: { ...context, /* computed values */ },
    graphConfig: { type: 'scatterplot', points: [...], xLabel, yLabel },
    answers: { fieldId: { value, ... } },
    scenario: "Problem description text"
  };
}
```

### grading-rules.js
```javascript
export function getRule(fieldId) { return rules[fieldId]; }
export function gradeField(fieldId, answer, context) {
  return { score: 'E'|'P'|'I', feedback: "...", matched: [], missing: [] };
}
```

### ai-grader-prompt.txt
System prompt template with {{placeholders}} for AI grading.

## Architecture: Legacy LSRL Trainer

### ScenarioGenerator Class
- 24 real-world contexts with x/y variables, units, and domain constraints
- Generates random r (-0.95 to +0.95), calculates slope/intercept
- `isInterceptMeaningful` flag determines if y-intercept interpretation makes sense

### Grader Class (dual-mode, runs both simultaneously)
- **Keywords**: Regex-based checking for required elements (prediction language, direction, values, variables)
- **AI**: Direct API calls to Gemini (`gemini-2.0-flash`) or Groq (`llama-3.3-70b-versatile`)
- Best score from either method counts for streaks/stars
- `formatAIError()` provides user-friendly error messages for quota limits, invalid keys, etc.

### Scoring (E/P/I system)
- **Slope**: "predicted/on average", direction, slope value, both variables, "for every 1 unit"
- **Intercept**: Reference x=0 with prediction language, OR identify when meaningless
- **Correlation**: "linear", strength (weak/moderate/strong), direction, both variables

### Gamification
- Streak counters per interpretation type
- Star rewards based on hints used: Gold (0 hints + confetti), Silver (1), Bronze (2), Tin (3)
- `hintsOpenedThisScenario` Set tracks which hints were viewed

### State (localStorage)
- `lsrlStreaks` - streak counts per type
- `lsrlStarCounts` - stars by tier (gold/silver/bronze/tin)
- `geminiApiKey`, `groqApiKey` - separate keys per provider
- `apiProvider` - current selection (gemini/groq/none)

## Architecture: Z-Score Explorer

### Data Flow
- `processData()` computes means, standard deviations, z-scores, r, and LSRL coefficients
- `classData` object holds datasets (Class E, Class B, or synthetic from URL params)

### URL Parameter Integration
When opened with params from LSRL trainer (`?topic=...&slope=...&r=...`):
- `generateSyntheticData()` creates 12 points approximating target regression
- Class selector hidden, shows "From LSRL Trainer" with back link
- Displays target vs actual r/slope/intercept comparison

### Views
- `buildRawView()` - original units with mean lines and normal curves at means
- `buildZScoreView()` - standardized coordinates, origin-centered, ±3 grid

### Selection System
- Click point to show product rectangle (green = positive, red = negative contribution to r)
- Z-score view shows shaded regions under normal curves
- Panel displays z-score calculations and quadrant info

### Question Generator
- 10 question types: z-score calculation, product sign, quadrant, correlation direction/strength, LSRL prediction, residual, mean, standard deviation
- Score tracking with immediate feedback and explanations

## Integration Between Apps

LSRL Trainer's "Explore in 3D" button opens Z-Score Explorer with URL params:
```
zscore_3d_explorer.html?topic=...&xVar=...&yVar=...&slope=...&intercept=...&r=...&xMin=...&xMax=...
```

## Technical Notes

- Tailwind CSS via CDN (not for production, but acceptable for teaching tools)
- Three.js r128 for 3D rendering
- Direct API calls work from file:// because keys are passed as URL params (Gemini) or headers (Groq)
- Button visibility uses `style.display` not Tailwind's `hidden` class for reliability
