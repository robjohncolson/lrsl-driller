# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A subject-agnostic drill/quiz platform for teachers ("Driller Platform"). Think of it like a game console: the platform is the console, lessons are cartridges. Currently includes cartridges for AP Statistics (LSRL, residuals, z-scores, leverage points) and Algebra 2 (radicals).

**Deployment**: Vercel (frontend) + Railway (backend server for AI grading, WebSocket, time tracking)

## Development Commands

```bash
npm install
npm run dev      # Start Vite dev server at http://localhost:5173/platform/app.html
npm run build    # Build for production (copies cartridges/ to dist/)
npm run preview  # Preview production build
```

The legacy `index.html` works standalone (file:// protocol) but the modular platform requires the dev server.

## Architecture

### Console-Cartridge Pattern

**Platform (Console)** - `platform/` - topic-agnostic orchestrator:
- `platform.js` - Main orchestrator, loads cartridges, coordinates engines
- `core/game-engine.js` - Streaks, stars (gold/silver/bronze/tin), tier progression
- `core/grading-engine.js` - Dual grading: keywords (regex) + AI (Gemini/Groq)
- `core/graph-engine.js` - Canvas-based scatterplots, regression lines, residual plots
- `core/input-renderer.js` - Dynamic form fields with hint toggles
- `core/cartridge-loader.js` - Loads manifests, generators, grading rules
- `core/shuffle-bag.js` - Fair problem distribution (no near-repeats)

**Cartridges (Lessons)** - `cartridges/{id}/` - content-specific, fully self-contained:
- `manifest.json` - Config: modes, inputs, hints, progression, grading settings
- `generator.js` - Exports `generateProblem(modeId, context, mode)`
- `grading-rules.js` - Exports `gradeField(fieldId, answer, context)` returning `{score: 'E'|'P'|'I', feedback}`
- `ai-grader-prompt.txt` - Template with `{{placeholders}}` for AI grading
- `contexts.json` (optional) - Real-world scenarios for problem variety

**Registry**: `cartridges/registry.json` lists all available cartridges.

### Backend Server

`railway-server/server.js` - Express + WebSocket server (deployed on Railway):
- `/api/ai/grade` - Server-side AI grading with API key pool rotation
- `/api/teacher-review` - Queue for teacher manual review
- `/api/time-tracking/*` - Session and problem timing
- `/api/users`, `/api/progress`, `/api/leaderboard` - User management
- WebSocket broadcasts: star earned, user online/offline, class time events

### Grading Flow

1. **Keywords first** (fast, regex-based) - always runs
2. **AI grading** (if enabled) - calls server, which tries Groq then Gemini with key rotation
3. **Best score wins** - AI can override keywords when it recognizes correct answers
4. **Teacher review** - fallback when AI fails or student appeals

## Creating Cartridges

See `CARTRIDGE-DEVELOPMENT-GUIDE.md` for full details. A cartridge requires 3-4 files:

**manifest.json** - Declares UI, modes, hints, progression:
```json
{
  "meta": { "id": "topic-id", "name": "Topic Name", "subject": "AP Statistics" },
  "modes": [{ "id": "mode-id", "unlockedBy": "default", "layout": { "inputs": [...] } }],
  "grading": { "rubricFile": "grading-rules.js", "aiPromptFile": "ai-grader-prompt.txt" },
  "hints": { "perField": { "fieldId": "Hint with {{variables}}" } },
  "progression": { "streakFields": ["field1"], "tiers": [{ "id": "mode-id", "unlockedBy": { "gold": 10 } }] }
}
```

**generator.js** - Problem generation:
```javascript
export function generateProblem(modeId, context, mode) {
  return {
    context: { ...context, /* computed values */ },
    graphConfig: { type: 'scatterplot', points: [...], xLabel, yLabel },
    answers: { fieldId: { value: correctAnswer } },
    scenario: "Problem description"
  };
}
```

**grading-rules.js** - Keyword/programmatic grading:
```javascript
export function gradeField(fieldId, answer, context) {
  return { score: 'E'|'P'|'I', feedback: "..." };
}
```

**ai-grader-prompt.txt** (optional) - Template for AI grading with `{{placeholder}}` substitution.

After creating, add to `cartridges/registry.json` and the dropdown in `platform/app.html`.

## E/P/I Scoring System

- **E (Essentially Correct)**: All key elements present
- **P (Partially Correct)**: Some elements missing
- **I (Incorrect)**: Major errors or missing mandatory elements

Star tiers based on hints used: Gold (0), Silver (1), Bronze (2), Tin (3+)

## Key Patterns

**Dual grading**: Keywords run first (fast), then AI (if enabled). Best score wins. AI can override keyword grading when it recognizes correct answers that regex missed.

**Shuffle bags**: `core/shuffle-bag.js` ensures fair problem distribution without near-repeats (batch of 12, history of 4).

**State persistence**: Game engine uses localStorage with cartridge-prefixed keys (`{cartridgeId}_streaks`, `{cartridgeId}_stars`).

**Template interpolation**: Use `{{variableName}}` in manifests - replaced with context values at runtime.

## Environment Variables (Railway Server)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Database connection
- `GEMINI_API_KEY`, `GROQ_API_KEY` - AI grading (fallback if pool empty)
- `TEACHER_PASSWORD` - For teacher review access

## Testing

1. `npm run dev` → http://localhost:5173/platform/app.html
2. Select cartridge from dropdown
3. Check browser console for grading/loading errors
