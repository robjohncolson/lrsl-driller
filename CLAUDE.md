# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A subject-agnostic drill/quiz platform for teachers ("Driller Platform"). Think of it like a game console: the platform is the console, lessons are cartridges.

Current cartridges (10 total) are listed in `cartridges/registry.json` and span AP Statistics, Algebra 2, and Computer Science topics.

**Deployment**: Vercel (frontend) + Railway (backend server for AI grading, WebSocket, time tracking, Grid Wars)

**Two Entry Points**:
- `platform/app.html` - Main modular platform (requires dev server) - **primary development target**
- `index.html` - Legacy standalone (works with file:// protocol, LSRL-specific only)

**Current Version**: v2.1 (AI Feedback Visibility + Leaderboard Persistence)

## Critical: File Sync Requirements

Railway deploys only `railway-server/`, so certain files must be manually synced:

| Frontend (ES Modules) | Server (CommonJS) | Notes |
|-----------------------|-------------------|-------|
| `shared/gridwars.config.js` | `railway-server/gridwars.config.js` | Grid Wars constants |
| `shared/address-utils.js` | `railway-server/address-utils.js` | Chess notation utils |

**When modifying these files, update BOTH copies or tests/functionality will break.**

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

**Railway Server (local development)**:
```bash
cd railway-server
npm install
node server.js        # Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY env vars
```

The `index.html` legacy app works standalone (file:// protocol) but the modular `platform/app.html` requires the dev server.

## Architecture

### Main Entry Point: `platform/app.html`

This is a large (~3600 lines) single-file application that orchestrates everything:
- **Lines 780-900**: Imports and global state initialization
- **Lines 1100-1200**: Helper functions (getCurrentCartridgeId, syncCartridgeProgress, etc.)
- **Lines 3080-3310**: `onGradingComplete` callback - handles star awards, AI panel updates, progress sync
- **Lines 3078-3620**: `loadCartridge()` - Platform initialization and event wiring

When modifying grading behavior, the `onGradingComplete` callback at ~line 3095 is the key integration point.

### Console-Cartridge Pattern

**Platform (Console)** - `platform/` - topic-agnostic orchestrator:
- `platform.js` - Main orchestrator, loads cartridges, coordinates engines
- `core/` - Engines: game-engine (streaks/stars), grading-engine (dual grading), graph-engine (canvas plots), input-renderer (dynamic forms), cartridge-loader, shuffle-bag, user-system, websocket-client, time-tracker, celebration, leaderboard, sound-engine, ai-feedback-panel (v2.0.1)
- `game/` - Grid Wars: grid-state, grid-renderer, grid-panel, teacher-view, audio
- `core/radical-*.js` - Algebra 2 radicals: visualizer, game, prime game, complex game

**Shared** - `shared/` - Code shared between platform and server:
- `scoring.config.js` - Level-weighted scoring formula (exports `calculateWeightedPoints`, `getLevelMultiplier`, `getPointsBreakdown`)
- `address-utils.js` - Chess-notation addressing for v2.0 hierarchy (exports `coordsToAddress`, `addressToCoords`, `buildAddress`, `getParentAddress`, `getLevel`, `getBreadcrumb`)
- `gridwars.config.js` - Grid Wars constants (must sync with `railway-server/gridwars.config.js`)

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
- `/api/progress/cartridge-sync` - v2.1: Sync aggregate star counts per cartridge to `user_progress` table
- `/api/grid-wars/*` - Grid Wars game state (territories, claims, contestation)
- WebSocket broadcasts: star earned, user online/offline, class time events, grid updates

### Grading Flow

```
Student Answer
      ↓
Keywords (grading-rules.js) ──→ Score A (fast, regex-based)
      ↓
AI (server → Groq/Gemini) ────→ Score B (if enabled)
      ↓
Final = max(A, B)  ← AI can upgrade but never downgrade
      ↓
If AI fails → Teacher Review Queue
```

**Key files in grading flow**:
- `platform/core/grading-engine.js` - Orchestrates keywords + AI
- `railway-server/server.js` lines 1215-1275 - `gradeWithAI()` with provider fallback
- `platform/core/ai-feedback-panel.js` - Shows which AI graded work (v2.0.1+)

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

After creating:
1. Add entry to `cartridges/registry.json`
2. Add `<option>` to the dropdown in `platform/app.html`

## E/P/I Scoring System

- **E (Essentially Correct)**: All key elements present
- **P (Partially Correct)**: Some elements missing
- **I (Incorrect)**: Major errors or missing mandatory elements

Star tiers based on **total penalties** (hints + retries count equally):
- **Gold** (0 penalties): 4 points
- **Silver** (1 penalty): 3 points
- **Bronze** (2 penalties): 2 points
- **Tin** (3+ penalties): 1 point

## Key Patterns

**Dual grading**: Keywords run first (fast), then AI (if enabled). Best score wins. AI can override keyword grading when it recognizes correct answers that regex missed. v2.0.1 adds visible AI Feedback Panel showing students the AI's decision.

**Shuffle bags**: `core/shuffle-bag.js` ensures fair problem distribution without near-repeats (batch of 12, history of 4).

**State persistence**: Game engine uses localStorage with cartridge-prefixed keys (`{cartridgeId}_streaks`, `{cartridgeId}_stars`). Server sync happens via `/api/progress/cartridge-sync` after each star award.

**Template interpolation**: Use `{{variableName}}` in manifests and AI prompts - replaced with context values at runtime. Both `{{studentAnswer}}` and `{{STUDENT_ANSWER}}` work (v1.6.3).

**Metadata fields**: AI grading responses include underscore-prefixed metadata (`_provider`, `_model`, `_aiScore`, `_keywordScore`, `_method`). These flow through the grading pipeline for transparency.

## Grid Wars (Multiplayer Game)

A territory control game where students earn points from drill stars to claim cells on a shared map. Located in `platform/game/` with server endpoints at `/api/grid-wars/*`.

### v2.0: Hierarchical Subdivision (Fractal Model)

Macro cells (8×8 grid) can be "developed" into 8×8 subcell grids. Same renderer, different data - like folders in a file system.

**Key Mechanics:**
- **Develop** (100 pts): Owner subdivides their cell, keeps center 4 subcells (d4, d5, e4, e5)
- **Drill** (75 pts): Attacker forces subdivision at 85%+ saturation, gets corner a1
- **Navigation**: Click developed cell to zoom in; breadcrumb/Escape to zoom out
- **Addressing**: Chess notation - "d5", "d5.c3", "d5.c3.a1" (max 3 levels)

**Files for v2.0:**
- `shared/address-utils.js` - Coordinate ↔ notation conversion
- `railway-server/address-utils.js` - CommonJS copy for server
- `railway-server/migrations/003_v2.0_hierarchical.sql` - Database schema

**Leaderboard**: Shows `"3 + 12 📦"` format (macro cells + subcells), sorted by `(macro × 64) + sub`

### Cost Calculation (Stacked Multipliers)
```
FINAL_COST = BASE × SCARCITY × (1-VELOCITY) × (1-GUERRILLA) × (1-OVEREXTENSION)
```
- **Base**: Neutral=40, Enemy COLD=60, WARM=80, ACTIVE=100
- **Scarcity** (map fill): 1.0x→3.0x (phases at 30%/60%/85%/100%)
- **Velocity** (pts/min): -10% to -40% for active players
- **Guerrilla** (size ratio): -30% to -50% for small vs large (scaled for 64 cells)
- **Overextension** (isolation): -15% to -30% for edge/isolated cells

### Earlier Features (v1.3-v1.6)
- **8×8 map**: 64 cells total, extreme scarcity (boot bonus 30, can't claim immediately)
- **Territory leaderboard**: Sorted by `territories_count` (current holdings)
- **Scarcity phases**: EXPANSION (0-30%), TENSION (30-60%), SCARCITY (60-85%), SATURATION (85-100%)
- **Bounty system**: Players with >20% of map (13 cells) become targets (+10 pts for attackers)
- **Level-weighted scoring**: Stars worth more at higher levels (0.5x→3.0x). Uses `shared/scoring.config.js`
- **Session management**: Teacher can end/resume sessions, freeze claims while drills continue
- **Velocity persistence**: Point events stored in Supabase (survives restarts)

### State Machine Documentation
See `docs/STATE_MACHINES.md` for complete diagrams of all component state transitions (47 sections covering grading, game engine, Grid Wars v2.0 hierarchy, WebSocket, AI normalization, AI Feedback Panel, etc.).

## Environment Variables (Railway Server)

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS for server writes); falls back to `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`, `GROQ_API_KEY` - AI grading (fallback if pool empty)
- `TEACHER_PASSWORD` - For teacher review access

## Testing

```bash
npm test                                          # All tests (1100 tests)
npm run test:watch                                # Watch mode
npx vitest run tests/grading/sampling.test.js    # Single test file
npx vitest run tests/game/grid-wars-v2.0.test.js # v2.0 hierarchy tests (40 tests)
npx vitest run tests/game/grid-wars-v1.6.test.js # Grid Wars v1.6 tests
npx vitest run tests/core/scoring-config.test.js # Level-weighted scoring tests
npx vitest run tests/server/prompt-utils.test.js # Prompt placeholder tests
npx vitest run tests/core/ai-feedback-panel.test.js       # v2.0.1 AI panel tests (48 tests)
npx vitest run tests/server/ai-grading-v2.0.1.test.js     # v2.0.1 server response tests (21 tests)
npx vitest run tests/core/ai-feedback-panel-v2.1.test.js  # v2.1 debug logging tests (23 tests)
npx vitest run tests/server/progress-sync-v2.1.test.js    # v2.1 progress sync tests (37 tests)
```

Test organization:
- `tests/core/` - Platform engine tests (game-engine, shuffle-bag, celebration, leaderboard, version, scoring-config, ai-feedback-panel, ai-feedback-panel-v2.1)
- `tests/grading/` - Cartridge grading rule tests (sampling, residuals, experimental-design)
- `tests/generators/` - Problem generator tests (sampling, experimental-design)
- `tests/server/` - Railway server API tests (api, grid-wars-api, prompt-utils, ai-grading-v2.0.1, progress-sync-v2.1)
- `tests/game/` - Grid Wars tests (grid-state, teacher-view, drill-integration, realtime-sync, avatar-utils, version-specific: v1.1 through v1.6)

Manual testing: `npm run dev` → http://localhost:5173/platform/app.html, select cartridge, check browser console.

## Database Migrations

SQL migrations for Supabase are in `railway-server/migrations/`. Run these in Supabase SQL Editor before deploying new server versions:

```bash
# Current migrations:
railway-server/migrations/001_point_events.sql       # v1.5.1: Velocity tracking
railway-server/migrations/002_v1.6_fresh_start.sql   # v1.6: Fresh start schema
railway-server/migrations/003_v2.0_hierarchical.sql  # v2.0: Hierarchy columns (address, parent_address, is_developed, cell_level)
railway-server/migrations/004_generic_progress.sql   # v2.1: user_progress table for aggregate star counts per cartridge
```

**Note**: The `point_events` table uses `player_id` column (not `username`). This was fixed in v1.6.2.

## Configuration Files

- `shared/scoring.config.js` - Level-weighted scoring formula (exports `calculateWeightedPoints`)
- `railway-server/prompt-utils.js` - Prompt template `{{placeholder}}` interpolation
- `cartridges/registry.json` - Available cartridge listing

See "Critical: File Sync Requirements" at top for files that must be synced between frontend/server.

## Version History (Bug Fixes)

**v2.1**: AI Feedback Visibility + Leaderboard Persistence
- Enhanced AI feedback panel with debug logging for grading flow transparency
- New `/api/progress/cartridge-sync` endpoint for aggregate star counts per cartridge
- New `user_progress` table (migration 004) stores star counts per user per cartridge
- Unified leaderboard now includes user_progress data alongside Grid Wars and lsrl_progress
- Stars now sync to server after each award for proper leaderboard tracking

**v2.0.1**: AI Feedback Panel - students can now see which AI model (Groq Llama-3.3-70B or Gemini 2.0 Flash) graded their work, the AI's score, feedback text, and whether AI agreed with keyword grading. Server now returns `_model` field in AI grading responses.

**v2.0**: Hierarchical subdivision - develop/drill actions, breadcrumb navigation, presence dots replacing avatars

**v1.6.3**: AI grading prompt placeholder - `{{STUDENT_ANSWER}}` now works as alias for `{{studentAnswer}}`

**v1.6.2**: Three fixes - grid size from config (not hardcoded), AI grading parser accepts direct JSON format, velocity query uses `player_id` column
