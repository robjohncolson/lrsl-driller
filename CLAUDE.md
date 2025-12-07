# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Teaching materials repository for AP Statistics, focusing on linear regression and correlation concepts. Contains standalone HTML apps that run directly from file:// protocol with no build process.

## Files

- `lsrl_trainer.html` - Practice app for writing 3-part LSRL conclusions (slope, intercept, correlation interpretations)
- `zscore_3d_explorer.html` - Interactive 3D visualization for exploring z-scores and correlation
- `lsrl_conclusion_practice.pdf` - Printable practice problems

## Development

Open HTML files directly in a browser. No build, install, or server required.

## Architecture: LSRL Trainer

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
