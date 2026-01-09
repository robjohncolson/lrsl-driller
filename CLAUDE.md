# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A subject-agnostic drill/quiz platform for teachers ("Driller Platform"). Think of it like a game console: the platform is the console, lessons are cartridges.

Current cartridges are listed in `cartridges/registry.json` and span AP Statistics, Algebra 2, and Computer Science topics.

**Deployment**: Vercel (frontend) + Railway (backend server for AI grading, WebSocket, time tracking, Grid Wars)

## Development Commands

```bash
npm install
npm run dev           # Start Vite dev server at http://localhost:5173/platform/app.html
npm run build         # Build for production (copies cartridges/ to dist/)
npm run preview       # Preview production build
npm test              # Run all tests (vitest)
npm run test:watch    # Run tests in watch mode
npx vitest run tests/grading/sampling.test.js  # Run single test file
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
- `core/celebration.js` - Star/unlock animations
- `core/leaderboard.js` - Class leaderboard display
- `game/grid-state.js` - Grid Wars client state management
- `game/grid-renderer.js` - Grid Wars canvas rendering
- `game/grid-panel.js` - Grid Wars UI panel component
- `game/teacher-view.js` - Teacher dashboard components
- `game/audio.js` - Sound effects

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
- `/api/grid-wars/*` - Grid Wars game state (territories, claims, contestation)
- WebSocket broadcasts: star earned, user online/offline, class time events, grid updates

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

## Grid Wars (Multiplayer Game)

A territory control game where students earn points from drill stars to claim cells on a shared map. Located in `platform/game/` with server endpoints at `/api/grid-wars/*`.

Key mechanics: claim cost (weighted points), contestation (opposing claims on same cell), cell strength (1-3), resource nodes (factories, beacons, anchors), surge mode, class goal bonuses.

## Environment Variables (Railway Server)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Database connection
- `GEMINI_API_KEY`, `GROQ_API_KEY` - AI grading (fallback if pool empty)
- `TEACHER_PASSWORD` - For teacher review access

## Testing

```bash
npm test                                          # All tests
npm run test:watch                                # Watch mode
npx vitest run tests/grading/sampling.test.js    # Single test file
```

Test organization:
- `tests/core/` - Platform engine tests (game-engine, shuffle-bag, celebration, leaderboard, version)
- `tests/grading/` - Cartridge grading rule tests
- `tests/generators/` - Problem generator tests
- `tests/server/` - Railway server API tests (including grid-wars-api)
- `tests/game/` - Grid Wars tests (grid-state, teacher-view, drill-integration, realtime-sync, avatar-utils, version-specific tests)

Manual testing: `npm run dev` → http://localhost:5173/platform/app.html, select cartridge, check browser console.

See `KNOWN_ISSUES.md` for documented bugs and debugging context.
