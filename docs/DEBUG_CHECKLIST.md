# Debug Checklist (Stability-Only)

This checklist focuses on stability and correctness without recommending upgrades that could break existing topology or legacy expectations. Items are ordered roughly by impact.

## A) Build/Deploy Integrity
- [x] **Verify Ghost Orbits client imports are bundled** in `platform/app.html`. **Status: Verified**
  - Evidence: `platform/app.html` imports `GhostOrbitsController` and wires `launchGhostOrbits()`.
- [x] **Confirm `platform/core/radical-complex-game.js` is tracked and deployed**. **Status: Verified**
  - Evidence: File is git-tracked. Import chain: `input-renderer.js` → `radical-complex-game.js`.
  - Note: KNOWN_ISSUES.md Issue 1 has been resolved (file was previously untracked).
- [x] **Validate `platform/app.html` imports resolve in production**. **Status: Verified**
  - Evidence: All 15 module imports verified to exist: platform.js, sound-engine.js, celebration.js, user-system.js, websocket-client.js, leaderboard.js, class-time.js, time-tracker.js, cartridge-loader.js, scoring.config.js, ai-feedback-panel.js, roster-modal.js, ghost-engine.js, ghost-panel.js, ghost-orbits-controller.js.

## B) Progress Persistence + Leaderboard Consistency
- [x] **Resolve missing persistence from `app.html` to `/api/progress`**. **Status: Verified**
  - Evidence: `platform/app.html` posts to `/api/progress` after star award (lines 1984, 4034).
- [x] **Verify `POST /api/progress/cartridge-sync` is called after star awards**. **Status: Fixed**
  - Evidence: Previously missing in `applyTeacherGrades()` path. Fixed in fix/comprehensive-debug-review branch.
  - Both star award paths now call `syncCartridgeProgress()` (lines 2010, 4063).
  - Regression test added: `tests/core/star-award-consistency.test.js`
- [x] **Check `GET /api/leaderboard` merge logic**. **Status: Verified**
  - Evidence: `railway-server/server.js` lines 611-765. `/api/leaderboard` queries `lsrl_progress` only (legacy). `/api/leaderboard/unified` correctly merges `lsrl_progress` + `user_progress` tables with graceful error handling for missing tables, proper aggregation, and batched user lookups.

## C) Grading + AI Pipeline
- [x] **Confirm AI fallback chain works**. **Status: Verified**
  - Actual flow: Keywords run first (safety net), then AI (Groq → Gemini) can only upgrade scores.
  - Server: `gradeWithAI()` in server.js:1243 - Groq first, then Gemini, up to 3 keys per provider.
  - Client: `platform.js:339` - Keywords always run first. AI score only used if higher (`max(keywords, AI)`).
  - On AI failure: Keywords score stands, `_aiFailed=true`, teacher review offered.
- [x] **Verify field ID remapping** for `answer` is active in `/api/ai/grade` and `/api/ai/appeal`. **Status: Verified**
  - Evidence: `railway-server/server.js` remaps `answer` to actual field ID in both endpoints.
- [x] **Check prompt placeholder coverage** (`{{studentAnswer}}`, `{{STUDENT_ANSWER}}`, etc.) for each cartridge. **Status: Verified**
  - Evidence: `railway-server/prompt-utils.js` handles all placeholder patterns dynamically.
  - Supports: `{{STUDENT_ANSWER}}`, `{{studentAnswer}}`, `{{fieldIdAnswer}}`, `{{anyScenarioKey}}`, conditionals.
  - 12 cartridges have ai-grader-prompt.txt files with consistent placeholder usage.
  - Comprehensive test coverage in `tests/server/prompt-utils.test.js` (360 lines).

## D) WebSocket Infrastructure
- [x] **Confirm WebSocket server initialization** exists in `railway-server/server.js`. **Status: Verified**
  - Evidence: `http.createServer(app)` + `new WebSocketServer({ server })` at top of `railway-server/server.js`.
- [x] **Validate WebSocket client lifecycle** (reconnect, heartbeat, error handling). **Status: Verified**
  - Evidence: `platform/core/websocket-client.js` has proper implementation.
  - Reconnect: Exponential backoff (5s × attempt), max 5 attempts (lines 88-92).
  - Heartbeat: 30 second interval to keep connection alive (lines 63-67).
  - Error handling: Logs errors, handles message parse failures (lines 76-78, 95-97).
  - Cleanup: Proper disconnect with interval clearance (lines 259-266).
- [x] **Audit live WS message routing** in `platform/app.html` for expected message types. **Status: Verified**
  - Evidence: `app.html` lines 1077-1126 configure WebSocket callbacks.
  - Handlers: presence, connection, class time, teacher review, progression overrides - all wired.
  - `onStarEarned`: Not configured but internal notification still works (line 176 in websocket-client.js).
  - `onLeaderboardUpdate`: Not configured; leaderboard refreshes on open only (minor gap, not a bug).

## E) Game Mode / CTF / KotH Stability (Doc vs Repo)
- [x] **Reconcile CTF/KotH client modules** documented in `STATE_MACHINES.md` with repo contents. **Status: N/A - Intentionally Removed**
  - CTF/KotH were intentionally removed from the codebase. Documentation in STATE_MACHINES.md is stale.
  - Action: Clean up STATE_MACHINES.md to remove/archive CTF/KotH sections.

## F) Ghost System (Core + Battles)
- [x] **Confirm ghost profile sync** (`POST /api/ghost/:cartridgeId/sync`) stores and retrieves expected fields. **Status: Verified**
  - Evidence: Server (lines 2431-2469) and client (ghost-engine.js:463-491) send/receive identical fields.
  - Fields: username, weights, buffer, total_interactions, proficiency_score, color, opacity, version.
  - Test coverage: `tests/server/ghost-api.test.js`
- [x] **Verify ghost battle creation and rating updates** align with §133. **Status: Verified**
  - Evidence: `server.js` lines 2719-2916 implement complete battle flow.
  - Creates battle record with all fields (seed, timings, correct counts, margin).
  - Updates Elo ratings for both challenger and defender (wins/losses/draws/streaks).
  - Broadcasts `ghost_battle_complete` via WebSocket.
  - Test coverage: `tests/server/ghost-battle-api.test.js`
- [x] **Validate battle broadcast messages** are consumed in UI. **Status: Verified**
  - Evidence: `app.html` lines 1128-1142 handle `ghost_battle_complete` message.
  - Shows toast notifications: "Victory against X's ghost!" / "Draw" / "X's ghost won".

## G) Ghost Orbits (Arena)
- [x] **Confirm Ghost Orbits gating** (`canEnterGhostOrbits`) matches star economy rules in §142. **Status: Verified**
  - Evidence: `platform/app.html` computes `nextMatchCost = matchesPlayed + 1` and checks gold count.
- [x] **Validate match state transitions** per §§141–142. **Status: Verified**
  - Evidence: `ghost-orbits-controller.js` lines 24-33 define GameState enum.
  - States: IDLE, CONNECTING, COUNTDOWN, PLAYING, ELIMINATED, ROUND_END, INTERMISSION.
  - `_setState` (line 861) tracks previous state, notifies callbacks.
  - `_handleStateTransition` (line 881) handles side effects per state.
  - Test coverage: `tests/game/ghost-orbits-progression.test.js`
- [x] **Check localStorage keys** for Ghost Orbits economy/session persist and reset flows. **Status: Verified**
  - Evidence: `ghost-orbits-controller.js` lines 2155-2193, 2688-2738.
  - Key 1: `ghostOrbits_starEconomy_${cartridgeId}` → stores `starsSpent` (total stars spent).
  - Key 2: `${cartridgeId}_ghost_stats` → stores upgradeable ghost properties.
  - Load/save/reset functions with proper JSON handling and error recovery.
  - Note: `matchesPlayed` intentionally NOT persisted (resets each session for escalating cost).

## H) Roster + Periodization
- [x] **Validate roster API** permissions and header requirements. **Status: Verified**
  - Evidence: `railway-server/server.js` enforces `x-teacher-password` in roster endpoints.
- [x] **Verify leaderboard period badges** render correctly. **Status: Verified**
  - Evidence: `platform/core/leaderboard.js` lines 193-204.
  - Period badge: Blue pill badge (`bg-blue-100 text-blue-700`) showing `class_period`.
  - Conditionally rendered only when `entry.class_period` exists.

## I) Cartridge Validation
- [x] **Ensure all cartridges conform** to `CARTRIDGE-STATE-MACHINE.md` §9 requirements. **Status: Verified**
  - Evidence: All 13 cartridges in registry.json have required files and exports.
  - Required files: manifest.json, generator.js, grading-rules.js - all present.
  - Required exports: `generateProblem` in generator.js, `gradeField` in grading-rules.js - all present.
- [x] **Confirm `contexts.json` use** matches shuffle-bag expectations. **Status: Verified**
  - Evidence: 3 cartridges + template have contexts.json with standard format.
  - Format: `{ contexts: [ { id, topic, ...variables } ] }` - matches CartridgeLoader expectations.
  - CartridgeLoader (lines 76-92) loads from `manifest.config.contextsFile` or legacy path.
  - ProblemShuffleBag generates problems using generators that consume contexts.
  - Test coverage: `tests/core/shuffle-bag.test.js`

## J) Historical Grid Wars / Pong (Only If Re-Enabled)
**Status: N/A - Intentionally Removed**

Grid Wars and Pong were intentionally removed from the codebase (v4.0). Documentation in STATE_MACHINES.md §§3-19, 33-100 is historical reference only.

Action: Clean up STATE_MACHINES.md to clearly mark these sections as archived/historical.

