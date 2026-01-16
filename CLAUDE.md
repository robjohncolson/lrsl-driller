# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A subject-agnostic drill/quiz platform for teachers ("Driller Platform"). Think of it like a game console: the platform is the console, lessons are cartridges.

Current cartridges (12 total) are listed in `cartridges/registry.json` and span AP Statistics, Algebra 2, and Computer Science topics.

**Deployment**: Vercel (frontend) + Railway (backend server for AI grading, WebSocket, time tracking, CTF)

**Two Entry Points**:
- `platform/app.html` - Main modular platform (requires dev server) - **primary development target**
- `index.html` - Legacy standalone (works with file:// protocol, LSRL-specific only)

**Current Version**: v3.2.1 (Teacher Level Bypass)

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
- `game/` - CTF (Capture The Flag): ctf-state, ctf-renderer, ctf-panel
- `core/radical-*.js` - Algebra 2 radicals: visualizer, game, prime game, complex game

**Shared** - `shared/` - Code shared between platform and server:
- `scoring.config.js` - Level-weighted scoring formula (exports `calculateWeightedPoints`, `getLevelMultiplier`, `getPointsBreakdown`)
- `ctf.config.js` - CTF game constants (lane length, points per move, colors)

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
- `/api/ctf/:cartridgeId/*` - CTF game state (state, join, points, reset, leaderboard, assign-teams, player removal)
- WebSocket broadcasts: star earned, user online/offline, class time events, CTF updates (front moved, points, victory, reset, player joined)

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

**For manual development**: See `CARTRIDGE-DEVELOPMENT-GUIDE.md` for full details.

**For LLM-assisted generation**: The `cartridges/` directory contains resources for generating cartridges with ChatGPT or other LLMs:
- `CARTRIDGE-STATE-MACHINE.md` - Visual state machine diagrams for cartridge lifecycle
- `CARTRIDGE-GENERATION-PROMPT.md` - Comprehensive LLM instructions with examples
- `_template/` - Blank slate cartridge with all required files (manifest, generator, grading-rules, ai-prompt)

To generate a new cartridge with an LLM:
1. Provide the LLM with `CARTRIDGE-GENERATION-PROMPT.md` and `CARTRIDGE-STATE-MACHINE.md`
2. Supply lesson content (e.g., PowerPoint slides) and curriculum standards
3. LLM generates all files based on `_template/` structure
4. Copy output to `cartridges/{new-id}/` and register

A cartridge requires 3-4 files:

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

## CTF (Capture The Flag) Multiplayer Game

A linear "tug of war" game where students earn points from drill stars to push the front line toward the enemy flag. Located in `platform/game/` with server endpoints at `/api/ctf/:cartridgeId/*`.

### Game Concept

```
BLUE FLAG                                                    RED FLAG
   🚩 ←─────────────────────────────────────────────────────→ 🚩
   [0][1][2][3][4][5][6][7][8][9][▣][11][12][13][14][15][16][17][18][19][20]
                                  ↑
                            Front Line (starts at 10)

Blue team drills → pushes front line RIGHT toward Red flag
Red team drills → pushes front line LEFT toward Blue flag
First team to reach enemy flag WINS
```

### Core Mechanics
- **21 positions** (0-20), front line starts at center (10)
- **20 team points** = 1 position moved
- Blue wins when front reaches 20, Red wins when front reaches 0
- **Per-cartridge games**: Each cartridge has its own CTF instance, teacher assigns teams

### Files
- `shared/ctf.config.js` - Configuration constants
- `platform/game/ctf-state.js` - State management and API calls
- `platform/game/ctf-renderer.js` - Canvas rendering of linear lane
- `platform/game/ctf-panel.js` - UI panel with team rosters, join buttons, teacher controls
- `railway-server/migrations/009_ctf.sql` - Database schema (ctf_games, ctf_players tables)

### Server Endpoints (8 total)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ctf/:cartridgeId/state` | Get game state |
| POST | `/api/ctf/:cartridgeId/join` | Assign player to team |
| POST | `/api/ctf/:cartridgeId/points` | Add points (from star) |
| POST | `/api/ctf/:cartridgeId/reset` | Teacher reset |
| GET | `/api/ctf/:cartridgeId/leaderboard` | Per-team rankings |
| POST | `/api/ctf/:cartridgeId/assign-teams` | Bulk team assignment |
| DELETE | `/api/ctf/:cartridgeId/player/:username` | Remove player |
| GET | `/api/ctf/config` | Get config |

### WebSocket Messages
- `ctf_front_moved` - Front line position changed
- `ctf_points` - Points earned by team member
- `ctf_victory` - Game won
- `ctf_reset` - Game reset by teacher
- `ctf_player_joined` - Player assigned to team
- `ctf_teams_updated` - Team rosters changed

### State Machine Documentation
See `docs/STATE_MACHINES.md` for complete diagrams of all component state transitions (covering grading, game engine, CTF, WebSocket, AI normalization, AI Feedback Panel, etc.).

## Environment Variables (Railway Server)

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS for server writes); falls back to `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`, `GROQ_API_KEY` - AI grading (fallback if pool empty)
- `TEACHER_PASSWORD` - For teacher review access

## Testing

```bash
npm test                                          # All tests
npm run test:watch                                # Watch mode
npx vitest run tests/grading/sampling.test.js    # Single test file
npx vitest run tests/core/scoring-config.test.js # Level-weighted scoring tests
npx vitest run tests/server/prompt-utils.test.js # Prompt placeholder tests
npx vitest run tests/core/ai-feedback-panel.test.js       # v2.0.1 AI panel tests (48 tests)
npx vitest run tests/server/ai-grading-v2.0.1.test.js     # v2.0.1 + v2.1.1 server response tests (31 tests)
npx vitest run tests/core/ai-feedback-panel-v2.1.test.js  # v2.1 debug logging tests (23 tests)
npx vitest run tests/server/progress-sync-v2.1.test.js    # v2.1 progress sync tests (37 tests)
npx vitest run tests/core/game-engine-progression.test.js # v3.2 progression override tests (24 tests)
```

Test organization:
- `tests/core/` - Platform engine tests (game-engine, shuffle-bag, celebration, leaderboard, version, scoring-config, ai-feedback-panel, ai-feedback-panel-v2.1, game-engine-progression)
- `tests/grading/` - Cartridge grading rule tests (sampling, residuals, experimental-design)
- `tests/generators/` - Problem generator tests (sampling, experimental-design)
- `tests/server/` - Railway server API tests (api, prompt-utils, ai-grading-v2.0.1, progress-sync-v2.1, code-quality)

Manual testing: `npm run dev` → http://localhost:5173/platform/app.html, select cartridge, check browser console.

## Database Migrations

SQL migrations for Supabase are in `railway-server/migrations/`. Run these in Supabase SQL Editor before deploying new server versions:

```bash
# Current migrations:
railway-server/migrations/004_generic_progress.sql   # v2.1: user_progress table for aggregate star counts per cartridge
railway-server/migrations/008_progression_overrides.sql # v3.2: Teacher-configurable progression overrides table
railway-server/migrations/009_ctf.sql               # v4.0: CTF tables (ctf_games, ctf_players)
```

## Configuration Files

- `shared/scoring.config.js` - Level-weighted scoring formula (exports `calculateWeightedPoints`)
- `shared/ctf.config.js` - CTF game constants (lane length, points per move, colors)
- `railway-server/prompt-utils.js` - Prompt template `{{placeholder}}` interpolation
- `cartridges/registry.json` - Available cartridge listing

## Version History (Bug Fixes)

**v4.0.0**: Linear CTF Refactor
- Replaced complex Grid Wars territory control game (~8,350 lines) with simple linear CTF game (~930 lines)
- Replaced Pong Duel minigame (~1,600 lines) - no longer needed with simplified game
- Net reduction: ~9,500 lines of code
- New game: 21-position tug-of-war, teams push front line toward enemy flag
- Per-cartridge games: Each cartridge has its own CTF instance
- Teacher assigns students to Blue/Red teams
- 20 team points = 1 position moved, first to reach enemy flag wins
- New files: `shared/ctf.config.js`, `platform/game/ctf-*.js`
- New migration: `railway-server/migrations/009_ctf.sql`
- Deleted Grid Wars and Pong files, endpoints, and tests

**v3.2.1**: Teacher Level Bypass
- Teachers can now access ALL levels regardless of progression gating
- Added 🔑 indicator on mode tabs for levels that are locked for students but accessible to teachers
- Tooltip displays "Teacher access - locked for students" for bypassed levels
- `renderModeTabs()` checks `isTeacher` flag to bypass unlock requirements

**v3.2.0**: Teacher-Configurable Progression
- Per-level gold star requirements now work from manifest `unlockedBy.gold` values
- Fixed game-engine to use per-level requirements instead of global `goldToUnlock`
- Teachers can adjust any level's gold requirement on the fly via new UI controls
- New database table `progression_overrides` stores teacher overrides per cartridge/level
- New API endpoints: `GET/PUT/DELETE /api/progression-overrides/:cartridgeId/:modeId`
- WebSocket broadcasts `progression_override_changed` and `progression_override_removed` for real-time sync
- Teacher UI panel shows current level's gold requirement with save/reset buttons
- Override indicator (*) appears on levels with teacher overrides in mode tabs
- Polynomial cartridge updated with proper sequential progression (L7-9 require only 1 gold star)
- New migration: `railway-server/migrations/008_progression_overrides.sql`
- Added 24 regression tests in `tests/core/game-engine-progression.test.js`

**v2.1.1**: AI Feedback Panel shows during initial grading
- Fixed field ID mismatch: server normalized to 'answer' but client expected actual field ID
- Server now remaps 'answer' field to actual field ID from `scenario.fieldId` or `answers` keys
- Applied to both `/api/ai/grade` and `/api/ai/appeal` endpoints
- Added 10 tests for field ID remapping logic

**v2.1**: AI Feedback Visibility + Leaderboard Persistence
- Enhanced AI feedback panel with debug logging for grading flow transparency
- New `/api/progress/cartridge-sync` endpoint for aggregate star counts per cartridge
- New `user_progress` table (migration 004) stores star counts per user per cartridge
- Stars now sync to server after each award for proper leaderboard tracking

**v2.0.1**: AI Feedback Panel - students can now see which AI model (Groq Llama-3.3-70B or Gemini 2.0 Flash) graded their work, the AI's score, feedback text, and whether AI agreed with keyword grading. Server now returns `_model` field in AI grading responses.

**v1.6.3**: AI grading prompt placeholder - `{{STUDENT_ANSWER}}` now works as alias for `{{studentAnswer}}`
