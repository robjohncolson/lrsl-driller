# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a teaching materials repository for introductory statistics, focusing on linear regression and correlation concepts. It contains:

- `zscore_3d_explorer.html` - Interactive 3D visualization for exploring z-scores and correlation (r)
- `lsrl_trainer.html` - SPA for training students to write 3-part LSRL conclusions
- `lsrl_conclusion_practice.pdf` - Practice problems for least squares regression line conclusions

## Technical Stack

The HTML visualization uses:
- Three.js (r128) for 3D rendering
- Tailwind CSS (CDN) for styling
- Vanilla JavaScript (no build process)

## Development

To work on the visualization, simply open `zscore_3d_explorer.html` in a browser. No build or install steps required.

## Architecture: Z-Score Explorer

The visualization demonstrates correlation as the average product of z-scores. Key components:

**Data Processing** (`processData` function):
- Computes means (x̄, ȳ), standard deviations (Sx, Sy)
- Calculates z-scores: zx = (x - x̄)/Sx, zy = (y - ȳ)/Sy
- Computes r = Σ(zx·zy)/(n-1) and LSRL coefficients (a, b)

**Scene Management**:
- `buildScene()` switches between raw data and z-score views
- `buildRawView()` plots points in original units with mean lines
- `buildZScoreView()` plots standardized coordinates centered at origin
- Normal curves rendered as 3D surfaces along each axis

**Selection System**:
- Clicking a point shows product rectangle (green = positive, red = negative contribution to r)
- In z-score view, shaded regions under normal curves visualize the z-values
- Table and panel sync with 3D selection

**Datasets**: Two class datasets comparing different bivariate relationships (Class E: breath/blink time, Class B: screen/music time)

## Architecture: LSRL Trainer

Interactive practice app for writing AP Statistics LSRL conclusion statements.

**ScenarioGenerator Class**:
- Library of 24 real-world contexts with x/y variables, units, and domain constraints
- Generates random r (-0.95 to +0.95), calculates realistic slope/intercept
- Tracks `isInterceptMeaningful` flag (e.g., x=0 impossible for "age of runner")

**Grader Class** (dual-mode):
- **Regex Mode (fallback)**: Checks for required keywords ("predicted", "on average", direction words), variable names, correct direction/strength, forbidden causal language ("causes", "proves")
- **AI Mode**: Sends structured prompt to Gemini or OpenAI API, returns E/P/I scores with feedback

**Scoring Rubric**:
- Slope: Must include "predicted/on average", correct direction, slope value, both variables, "for every 1 unit"
- Intercept: Must reference x=0, use prediction language, OR correctly identify when intercept is meaningless
- Correlation: Must include "linear", correct strength (weak/moderate/strong based on |r|), correct direction

**State Management**:
- Streaks stored in localStorage (`lsrlStreaks`)
- API keys stored in localStorage (never sent except to chosen AI provider)
