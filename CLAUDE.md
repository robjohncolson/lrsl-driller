# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A subject-agnostic drill/quiz platform for teachers ("Driller Platform"). Think of it like a game console: the platform is the console, lessons are cartridges.

Current cartridges (12 total) are listed in `cartridges/registry.json` and span AP Statistics, Algebra 2, and Computer Science topics.

**Deployment**: Vercel (frontend) + Railway (backend server for AI grading, WebSocket, time tracking, CTF)

**Two Entry Points**:
- `platform/app.html` - Main modular platform (requires dev server) - **primary development target**
- `index.html` - Legacy standalone (works with file:// protocol, LSRL-specific only)

**Current Version**: v4.4.0 (Ghost System Phase 1)

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
- `core/` - Engines: game-engine (streaks/stars), grading-engine (dual grading), graph-engine (canvas plots), input-renderer (dynamic forms), cartridge-loader, shuffle-bag, user-system, websocket-client, time-tracker, celebration, leaderboard, sound-engine, ai-feedback-panel (v2.0.1), ghost-engine (v4.4.0), ghost-network (v4.4.0)
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
- `/api/roster` - Teacher roster management (GET all students, PUT update student, POST bulk-assign)
- `/api/ghost/:cartridgeId/*` - Ghost profile management (sync, get, leaderboard)
- `/api/ghost/:cartridgeId/battle/*` - v4.6: Ghost battles (challenge, history, rating, leaderboard)
- WebSocket broadcasts: star earned, user online/offline, class time events, CTF updates (front moved, points, victory, reset, player joined), ghost_battle_complete (v4.6)

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
- **Per-period games** (v4.2): Each class period (A-G) has its own isolated game per cartridge
- Teacher assigns students to Blue/Red teams

### Session Management (v4.2)
- **Session states**: idle → scheduled → active → tiebreaker → ended
- Teachers can schedule start/end times or manually start/stop
- Points only accepted during `idle` or `active` states
- Session-specific point tracking (`session_points`, `first_point_at`)

### Dead Zone Tiebreaker (v4.2)
- **Dead zone**: Positions 9, 10, 11 (center ±1)
- If session ends in dead zone, triggers Pong tiebreaker
- **Champion selection**: Top 3 players per team by velocity (points/minute)
- **Best of 3**: Pong matches between champions
- Forfeit handling for missing players

### Files
- `shared/ctf.config.js` - Configuration constants (session, tiebreaker, Pong settings)
- `platform/game/ctf-state.js` - State management, session/tiebreaker API calls
- `platform/game/ctf-renderer.js` - Canvas rendering with session status overlay
- `platform/game/ctf-panel.js` - UI panel with period selector, session controls
- `platform/game/pong-tiebreaker.js` - Minimal Pong game for tiebreaker matches
- `railway-server/migrations/009_ctf.sql` - Base CTF schema
- `railway-server/migrations/011_ctf_sessions.sql` - Session/tiebreaker schema additions

### Server Endpoints (16 total)

**Core CTF** (require `?class_period=X` query param):
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

**Session Management** (v4.2):
| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/api/ctf/:cartridgeId/session/configure` | Set start/end times |
| POST | `/api/ctf/:cartridgeId/session/start` | Manual start |
| POST | `/api/ctf/:cartridgeId/session/stop` | Manual stop |
| GET | `/api/ctf/:cartridgeId/session/status` | Current state + timer |

**Tiebreaker** (v4.2):
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ctf/:cartridgeId/tiebreaker/status` | Champion list, ready states |
| POST | `/api/ctf/:cartridgeId/tiebreaker/ready` | Champion confirms presence |
| POST | `/api/ctf/:cartridgeId/tiebreaker/start-match` | Start Pong match |
| POST | `/api/ctf/:cartridgeId/tiebreaker/match-result` | Record Pong outcome |

### WebSocket Messages

**Core CTF** (all include `classPeriod`):
- `ctf_front_moved` - Front line position changed
- `ctf_points` - Points earned by team member
- `ctf_victory` - Game won
- `ctf_reset` - Game reset by teacher
- `ctf_player_joined` - Player assigned to team
- `ctf_teams_updated` - Team rosters changed

**Session** (v4.2):
- `ctf_session_configured` - Times set
- `ctf_session_started` - Session begins
- `ctf_session_warning` - 5min/1min remaining
- `ctf_session_ended` - Drilling stops

**Tiebreaker** (v4.2):
- `ctf_tiebreaker_starting` - Champions selected
- `ctf_tiebreaker_ready` - Player confirmed ready
- `ctf_tiebreaker_match_start` - Pong begins
- `ctf_tiebreaker_match_end` - Pong ends
- `ctf_tiebreaker_complete` - Final result

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
npx vitest run tests/server/ctf-sessions.test.js          # v4.2 session and tiebreaker tests
npx vitest run tests/generators/apstatu4l1l2.test.js      # v4.3.5 probability cartridge generator (139 tests)
npx vitest run tests/grading/apstatu4l1l2.test.js         # v4.3.5 probability cartridge grading (169 tests)
npx vitest run tests/core/student-detail-modal.test.js    # v4.3.2 student detail modal tests (52 tests)
npx vitest run tests/server/ctf-session-start.test.js     # v4.3.2 CTF session start fix tests (30 tests)
npx vitest run tests/core/ghost-network.test.js           # v4.4.0 ghost neural network tests (16 tests)
npx vitest run tests/core/ghost-engine.test.js            # v4.4.0 ghost engine tests (50 tests)
npx vitest run tests/server/ghost-api.test.js             # v4.4.0 ghost API contract tests (26 tests)
npx vitest run tests/core/ghost-battle-engine.test.js     # v4.6.0 ghost battle engine tests (63 tests)
npx vitest run tests/server/ghost-battle-api.test.js      # v4.6.0 ghost battle API contract tests (37 tests)
```

Test organization:
- `tests/core/` - Platform engine tests (game-engine, shuffle-bag, celebration, leaderboard, version, scoring-config, ai-feedback-panel, ai-feedback-panel-v2.1, game-engine-progression, student-detail-modal, ghost-network, ghost-engine, ghost-battle-engine)
- `tests/grading/` - Cartridge grading rule tests (sampling, residuals, experimental-design, apstatu4l1l2)
- `tests/generators/` - Problem generator tests (sampling, experimental-design, apstatu4l1l2)
- `tests/server/` - Railway server API tests (api, prompt-utils, ai-grading-v2.0.1, progress-sync-v2.1, code-quality, ctf-session-start, ghost-api, ghost-battle-api)

Manual testing: `npm run dev` → http://localhost:5173/platform/app.html, select cartridge, check browser console.

## Database Migrations

SQL migrations for Supabase are in `railway-server/migrations/`. Run these in Supabase SQL Editor before deploying new server versions:

```bash
# Current migrations:
railway-server/migrations/004_generic_progress.sql   # v2.1: user_progress table for aggregate star counts per cartridge
railway-server/migrations/008_progression_overrides.sql # v3.2: Teacher-configurable progression overrides table
railway-server/migrations/009_ctf.sql               # v4.0: CTF tables (ctf_games, ctf_players)
railway-server/migrations/010_class_periods.sql     # v4.1: class_period column for roster management
railway-server/migrations/011_ctf_sessions.sql      # v4.2: Per-period games, session management, tiebreaker tables
railway-server/migrations/013_ghost_profiles.sql   # v4.4: Ghost behavioral AI profiles table
railway-server/migrations/014_ghost_battles.sql   # v4.6: Ghost battle history and ratings tables
```

## Configuration Files

- `shared/scoring.config.js` - Level-weighted scoring formula (exports `calculateWeightedPoints`)
- `shared/ctf.config.js` - CTF game constants (lane length, points per move, colors)
- `railway-server/prompt-utils.js` - Prompt template `{{placeholder}}` interpolation
- `cartridges/registry.json` - Available cartridge listing

## URL Deep Linking

The platform supports direct navigation via URL parameters:

```
https://your-domain.com/platform/app.html?cartridge=CARTRIDGE_ID&level=LEVEL_ID
```

**Parameters:**
- `cartridge` - The cartridge ID from `registry.json` (e.g., `apstatu4l1l2`)
- `level` or `start` - The mode/level ID to navigate to (e.g., `l33-random-var-def`)

**Examples:**
```
# Load probability cartridge at Topic 4.7 (Random Variables)
?cartridge=apstatu4l1l2&level=l33-random-var-def

# Load probability cartridge at Topic 4.8 (Mean/SD)
?cartridge=apstatu4l1l2&level=l38-mean-formula

# Load probability cartridge at capstone level
?cartridge=apstatu4l1l2&level=l40-interpret-params
```

**Behavior:**
- **Teachers**: Direct access to any level without notification
- **Students**: Can access any level via URL; if normally locked, shows toast notification

## Version History (Bug Fixes)

**v4.6.0**: Ghost System Phase 6 (Battle Simulation Engine)
- **Ghost vs Ghost Battles**: Asynchronous competitions where two ghosts race through simulated problem sequences
  - Server-side battle simulation using lightweight neural network forward pass (no TensorFlow required)
  - Seeded RNG for reproducible battles (same seed = same results)
  - 10 problems per battle with difficulty distribution: 3 easy, 4 medium, 3 hard
- **Stochastic Resolution Algorithm**:
  - Ghost network predictions determine solve probability and time
  - 20% time variance, difficulty modifier, quick-answer bonus, incorrect penalty
  - Winner determined by: (1) most correct answers, (2) fastest time as tiebreaker
  - Draw declared if within 1 second and same correct count
- **Elo-Style Rating System**:
  - Initial rating: 1200, K-factor: 32 (40 for new ghosts with <10 battles)
  - Rating tiers: Bronze (<1000), Silver (1000-1199), Gold (1200-1399), Platinum (1400-1599), Diamond (1600+)
  - Streak tracking (current and best win streak)
- **Challenge System**:
  - Challenge types: random, specific, rematch, leaderboard
  - Cooldowns: none for random, 1hr for specific, 10min for rematch
  - Matchmaking prefers opponents within 200 Elo points
- **New API Endpoints**:
  - `POST /api/ghost/:cartridgeId/battle/challenge` - Start a battle (random or specific opponent)
  - `GET /api/ghost/:cartridgeId/battle/:battleId` - Get battle details with full timeline
  - `GET /api/ghost/:cartridgeId/battle/history/:username` - Paginated battle history
  - `GET /api/ghost/:cartridgeId/battle/rating/:username` - User's rating with tier
  - `GET /api/ghost/:cartridgeId/battle/leaderboard` - Battle ratings leaderboard
- **WebSocket Broadcasts**: `ghost_battle_complete` message to both participants with results
- **New Files**:
  - `platform/core/ghost-battle-engine.js` - Client-side battle utilities and types
  - `railway-server/migrations/014_ghost_battles.sql` - Battle history and ratings tables
  - `ghost-phase6-battle-spec.md` - Full technical specification
- **New Tests**: 100 tests across 2 files
  - `tests/core/ghost-battle-engine.test.js` (63 tests)
  - `tests/server/ghost-battle-api.test.js` (37 tests)
- **Database Tables**:
  - `ghost_battles` - Battle history with full timeline, ratings before/after
  - `ghost_ratings` - Per-user per-cartridge Elo ratings and stats

**v4.5.0**: Ghost System Phase 3 (3D Maze Generator)
- **3D Maze Visualization**: Cartridge progression now visualizable as a Tron-esque 3D navigable space
  - Each level/mode becomes a glowing hexagonal platform
  - `unlockedBy` relationships become curved bridge edges
  - Linear progressions become corridors, branching points become intersections
- **Manifest Parsing** (`ghost-maze-generator.js`):
  - `parseManifest()` - Builds directed graph from manifest modes
  - `positionNodes()` - Hierarchical layout with tier-based Y positioning
  - `calculateProgress()` - Determines unlock/completed/current state per node
  - `findPathToNode()` - Traces path from root to any level
  - `getMazeStats()` - Provides graph statistics (nodes, edges, tiers, capstones)
- **Three.js Renderer** (`ghost-maze-renderer.js`):
  - Tron-aesthetic with glowing grid, translucent platforms, particle effects
  - Node states: locked (gray), unlocked (blue), completed (green), current (yellow glow)
  - Bridge rendering with bezier curves
  - OrbitControls for camera rotation/zoom
  - Click-to-navigate: click node to jump to that level
- **Dependencies**: Three.js loaded via CDN (lazy-loaded when maze requested)
- **New Files**: `ghost-maze-generator.js`, `ghost-maze-renderer.js`, `ghost-phase3-maze-spec.md`
- **New Tests**: 30 tests in `tests/core/ghost-maze-generator.test.js`

**v4.4.0**: Ghost System Phase 1 (Behavioral AI Companion)
- **Ghost Profile Infrastructure**: Students now train neural network "ghosts" that learn their behavioral patterns
  - Each student has one ghost per cartridge (username + cartridge_id)
  - Ghost learns from every graded interaction, not just correct answers
- **Neural Network Architecture** (TensorFlow.js):
  - 10 input features: level progress, session time, streak, accuracy, hints, problems, retries, time of day, level tier
  - 16-16 hidden neurons (ReLU activation)
  - 4 output predictions: response time, correct probability, hint probability, quick answer probability
  - 516 total parameters, ~2KB storage as Float32
- **Visual Properties** (for future visualization phases):
  - **Color = Proficiency**: white (0-20%), yellow (20-40%), orange (40-60%), red (60-80%), indigo (80-100%)
  - **Opacity = Engagement**: 0.1 (new) to 1.0 (100+ interactions)
- **Experience Replay Buffer**: Last 50 interactions stored for stable training, batch size of 8
- **Server Sync**: Ghost profiles sync to Supabase with version-based conflict resolution
  - Debounced sync (2 second delay after last interaction)
  - localStorage persistence as fallback
- **New Files**:
  - `platform/core/ghost-network.js` - TensorFlow.js model definition
  - `platform/core/ghost-engine.js` - Main orchestrator (init, record, sync)
  - `railway-server/migrations/013_ghost_profiles.sql` - Database schema
- **New API Endpoints**:
  - `POST /api/ghost/:cartridgeId/sync` - Upsert ghost profile
  - `GET /api/ghost/:cartridgeId/:username` - Retrieve ghost profile
  - `GET /api/ghost/:cartridgeId/leaderboard` - Get all ghosts for landscape view (supports class_period filter)
- **app.html Integration**:
  - TensorFlow.js loaded via CDN (`@tensorflow/tfjs@4.17.0`)
  - Ghost initialized on user login and cartridge switch
  - Interaction recorded after every grading (correct or incorrect)
  - Session tracking: problems attempted, accuracy, problem history
- **New Tests**: 66 tests across 3 files
  - `tests/core/ghost-network.test.js` (16 tests)
  - `tests/core/ghost-engine.test.js` (50 tests)
  - `tests/server/ghost-api.test.js` (26 tests)
- **Documentation**: `ghost-system-spec.md` (design philosophy), `ghost-phase1-technical-spec.md` (implementation details)
- **Future Phases**: 3D maze visualization (Three.js), ghost battles, class landscape view

**v4.3.5**: Probability Cartridge Extended to 4.8 (Random Variables & Distributions)
- **apstatu4l1l2 Extended**: Now covers Topics 4.1-4.8 (was 4.1-4.6)
  - 8 new levels (L33-L40) covering random variables and probability distributions
  - L33 (4.7a): Random Variable Definition - numerical outcomes, capital letter notation (VAR-5.A)
  - L34 (4.7b): Discrete vs Continuous - identify type based on countable vs measurable
  - L35 (4.7c): Valid Probability Distribution - check conditions (0≤P≤1, sum=1)
  - L36 (4.7d): Probability from Distribution - calculate P(X≤k), P(X≥k), P(a≤X≤b)
  - L37 (4.7e): Describe Distribution - shape (skewed, symmetric, uniform)
  - L38 (4.8a): Mean (Expected Value) - μ = Σ[x·P(x)] formula (VAR-5.C)
  - L39 (4.8b): Standard Deviation - σ = √[Σ(x-μ)²·P(x)] formula
  - L40 (4.7-4.8 Capstone): Interpret Parameters in Context (VAR-5.D)
  - Content based on prairie dog pups, thermostat settings, insurance, dice, and coins
  - 40 total levels now in cartridge
- **New Skills Covered**: VAR-5.A (represent distributions), VAR-5.B (interpret distributions), VAR-5.C (calculate parameters), VAR-5.D (interpret parameters)
- **New Tests**: 41 generator tests + 36 grading tests for Topics 4.7-4.8
- **Total Tests**: 308 tests for probability cartridge (139 generator + 169 grading)

**v4.3.4**: Points Integer Fix & KotH Online Users
- **CTF/KotH Points Integer Fix**: Weighted scoring produces decimals (e.g., 1.5 for silver star at level 1 with 0.5x multiplier)
  - Database columns (`points_contributed`, `session_points`, team points) are INTEGER type
  - Added `Math.round(points)` to both `/api/ctf/:cartridgeId/points` and `/api/koth/:cartridgeId/points` endpoints
  - Fixes error: "invalid input syntax for type integer: '1.5'"
  - New tests: 14 regression tests (`tests/server/points-integer.test.js`)
- **KotH Online Users Parity**: KotH panel now filters team assignment list by online users, matching CTF behavior
  - Shows green dot (🟢) indicator for online users
  - Shows period badge for users from different periods
  - Added "(X online)" count display to both CTF and KotH panels
  - New tests: 17 regression tests (`tests/game/koth-online-users.test.js`)

**v4.3.3**: Probability Cartridge Extended to 4.5 + Deep Linking Fix
- **apstatu4l1l2 Extended**: Now covers Topics 4.1-4.5 (was 4.1-4.3)
  - 8 new levels (L17-L24) covering mutually exclusive events and conditional probability
  - L17 (4.4a): Mutually Exclusive Definition (VAR-4.C)
  - L18 (4.4b): Joint Probability Calculation from two-way tables
  - L19 (4.4c): Identify Mutually Exclusive Events
  - L20 (4.5a): Conditional Probability Definition (VAR-4.D)
  - L21 (4.5b): Conditional Probability from Tables
  - L22 (4.5c): General Multiplication Rule
  - L23 (4.5d): Order Matters (P(A|B) vs P(B|A))
  - L24 (4.4-4.5 Capstone): Mixed practice with explanations
  - Content based on Super Status!, school surveys, employee data, and marble examples
  - 24 total levels now in cartridge (later extended to 40 levels in v4.3.5)
- **URL Deep Linking Fix**: `?level=` and `?start=` parameters now always navigate to requested level
  - Teachers: Direct access without notification
  - Students: Access any level via URL with toast notification if normally locked
  - Example: `?cartridge=apstatu4l1l2&level=l12-sample-space` jumps to Topic 4.3
- **Lesson Group Dividers**: Mode tabs now show visual dividers between lesson groups (e.g., §4.1, §4.2, §4.3)

**v4.3.2**: Teacher Student Detail Modal & CTF Fixes
- **Student Detail Modal**: Teachers can now click usernames in "Online Now" to view student progress
  - Shows gold/silver/bronze star counts and total time spent
  - Displays recent activity across all cartridges
  - Shows performance breakdown per cartridge
  - Time breakdown by session
  - Eye icon (👁️) indicator on clickable usernames
  - New tests: 52 regression tests (`tests/core/student-detail-modal.test.js`)
- **CTF Session Start Fix**: Sessions can now start from 'ended' state with automatic board reset
  - Previously required manual reset before starting new session
  - Now auto-resets front position to center (10) and clears team points
  - New tests: 30 regression tests (`tests/server/ctf-session-start.test.js`)
- **Algebra 2 Polynomial Identities (a2t3l3) Improvements**:
  - **Level 1b Flashcards**: New identity memorization level between L1 and L2
    - 14 flashcard scenarios: name→formula, formula→name, and sign questions
    - Covers all 5 key identities: Difference of Squares, Square of Sum/Difference, Sum/Difference of Cubes
  - **Level 3 Head-Friendly Numbers**: Replaced impractical numbers (53×67) with mental-math-friendly scenarios
    - Uses bases 10, 20, 30, 50, 100, 200 with ±1 or ±2 offsets
    - Examples: 9×11, 19×21, 49×51, 99×101, 21², 51², 99²
- **State Machine Documentation**: Added sections 110-111 to `docs/STATE_MACHINES.md`

**v4.3.1**: New Probability Cartridge (apstatu4l1l2)
- New cartridge: `apstatu4l1l2` - AP Statistics Unit 4 Lessons 1-2 (Probability Basics)
- Topics covered: Random processes, outcomes vs events, independence/gambler's fallacy, streaks in random data, simulation, Law of Large Numbers
- 11 progressive levels from vocabulary to full simulation design capstone (later extended to 40 levels in v4.3.5)
- 60+ unique scenarios across all levels with shuffle bag preventing near-repeats
- Input types: dropdown, choice, number, text, textarea
- New tests: 49 generator tests (`tests/generators/apstatu4l1l2.test.js`)
- New tests: 44 grading tests (`tests/grading/apstatu4l1l2.test.js`)
- Aligned with AP Statistics Course Framework skills VAR-1.F and UNC-2.A

**v4.3.0**: Game Mode & Tiebreaker Expansion
- **Modular game mode architecture**: Teachers can now choose between CTF and King of the Hill (KotH) game modes
- **Multiple tiebreaker minigames**: Pong (existing), Quick Calc (new), and Reflex Duel (new)
- Game mode and tiebreaker are independently selectable per cartridge/period
- **GameModeManager integration**: `app.html` now uses `GameModeManager` instead of `CTFPanel` directly
  - Teacher UI: Dropdowns for game mode (CTF/KotH) and tiebreaker (Pong/Quick Calc/Reflex Duel)
  - WebSocket routing for `ctf_*`, `koth_*`, and `game_mode_changed` messages
  - Star earned events delegate to active panel via `gameModeManager.addPoints()`
- **King of the Hill (KotH)**: New rolling window point-based game mode
  - Points decay over 7-minute sliding window (0-3min: 100%, 3-5min: decay to 50%, 5-7min: decay to 0%)
  - Team with higher rolling total controls the "hill"
  - Controller banks 1 second per second of hill control
  - Winner: Team with more banked seconds when session ends
  - Within 30 seconds triggers tiebreaker
- **Quick Calc tiebreaker**: Mental math racing game
  - 2-digit arithmetic (+, -, *)
  - 1-second lockout on wrong answer
  - 15-second timeout per problem
  - First to 5 points wins
- **Reflex Duel tiebreaker**: Reaction time racing game
  - Random delay 1.5-4 seconds before flash
  - Early tap gives opponent point
  - 20ms tie threshold triggers redraw
  - First to 5 points wins
- New files: `shared/game-mode.config.js`, `platform/game/game-mode-manager.js`, `platform/game/tiebreaker-manager.js`, `platform/game/koth-state.js`, `platform/game/koth-panel.js`, `platform/game/koth-renderer.js`, `platform/game/quick-calc.js`, `platform/game/reflex-duel.js`
- New migration: `railway-server/migrations/012_game_modes.sql`
- New endpoints: 2 game-mode settings + 10 KotH + 4 unified tiebreaker endpoints
- New WebSocket messages: 6 KotH-specific + 4 shared tiebreaker message types + `game_mode_changed`
- Added tests in `tests/game/` directory (game-mode-config, koth, quick-calc, reflex-duel, game-mode-manager)
- Updated `shared/ctf.config.js` with tiebreakerTypes enum
- Updated `platform/app.html`: replaced `CTFPanel` with `GameModeManager`, renamed `initCTF()` to `initGameMode()`
- **Global Escape Key Handler**: All modals/panels closeable via Escape key (accessibility improvement)
  - Share Modal, Cartridge Dropdown, Online Users Dropdown, CTF Sidebar, Teacher Review Panel, Time Analytics Panel, Leaderboard Panel
  - **Bug Fix**: Fixed backdrop IDs (`teacher-review-backdrop`, `time-analytics-backdrop`)
  - Added 23 regression tests in `tests/core/escape-key-handler.test.js`

**v4.2.0**: CTF Timed Sessions & Tiebreaker
- **Per-class-period games**: Each period (A-G) has isolated CTF game state per cartridge
- Students without assigned period see warning message to contact teacher
- Teachers can switch between periods to view/manage each game
- All CTF endpoints now require `class_period` query parameter
- **Timed sessions**: Teachers can schedule start/end times or manually control
- Session states: idle → scheduled → active → tiebreaker → ended
- Points only accepted during `idle` or `active` sessions
- Session-specific tracking: `session_points`, `first_point_at` per player
- **Dead zone tiebreaker**: If session ends at positions 9-11, triggers Pong tiebreaker
- Champion selection by velocity (session_points / minutes_since_first_point)
- Best-of-3 Pong matches between top 3 players per team
- 30-second ready check with forfeit handling for absent players
- **Pong implementation**: 400x300 canvas, first to 5 points wins match
- Blue player authoritative for ball physics (host)
- Keyboard (W/S, Arrow keys) and touch controls
- New migration: `railway-server/migrations/011_ctf_sessions.sql`
- New file: `platform/game/pong-tiebreaker.js`
- New endpoints: 4 session + 4 tiebreaker endpoints
- New WebSocket messages: 9 session/tiebreaker message types
- Added tests in `tests/server/ctf-sessions.test.js`

**v4.1.0**: Teacher Class Roster Management
- Teachers can now organize students by class periods (A-G)
- New roster modal accessible via teacher toolbar button
- Teachers can map usernames to real names and assign class periods
- Bulk assignment support for quick semester setup
- Leaderboard now displays class period badges next to usernames
- New migration: `railway-server/migrations/010_class_periods.sql`
- New file: `platform/core/roster-modal.js`
- New endpoints: `GET/PUT /api/roster`, `POST /api/roster/bulk-assign`
- Added 23 tests in `tests/server/roster-api.test.js`

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

**v4.0.1**: Server Infrastructure Fix
- Fixed server crash caused by missing infrastructure code accidentally deleted in v4.0.0
- Restored: HTTP server creation (`http.createServer(app)`)
- Restored: WebSocket server initialization (`new WebSocketServer({ server })`)
- Restored: `clients` Map for tracking WebSocket connections
- Restored: `broadcast()` function for sending messages to all clients
- Added 8 regression tests to prevent future infrastructure deletions

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
