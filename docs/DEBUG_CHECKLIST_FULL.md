# Full Debug Checklist (Stability-Focused)

This checklist is organized by state-machine units and concrete components. It avoids upgrade recommendations and focuses on verifying current behavior under the expected network and classroom topologies.

## 0) Preflight (Environment + Topology)
- [ ] Confirm target topology: local-only, local LAN, or cloud (Vercel + Railway).
- [ ] Verify `SERVER_URL` resolves and matches deployment (no mixed http/https).
- [ ] Verify expected auth constraints (teacher password, student-only endpoints).
- [ ] Confirm localStorage access (file:// vs dev server) and browser storage restrictions.

## 1) Entry Points and Cartridge Loading
- [ ] `platform/app.html` loads with dev server and no console errors.
- [ ] `index.html` loads in file:// mode (legacy path) without breaking core flow.
- [ ] `cartridges/registry.json` loads and populates cartridge list.
- [ ] `platform/core/cartridge-loader.js`:
  - [ ] Manifest loads and validates JSON.
  - [ ] Dynamic imports for `generator.js` and `grading-rules.js` succeed.
  - [ ] Optional `contexts.json` handled (local + shared legacy).
  - [ ] Optional `ai-grader-prompt.txt` loaded when configured.

## 2) Problem Generation and Rendering
- [ ] `generateProblem(modeId, context, mode)` returns required shape.
- [ ] Shuffle bag avoids near-repeats (batch=12, history=4).
- [ ] `platform/core/input-renderer.js` supports all input types in manifest.
- [ ] LaTeX rendering works (KaTeX present and delimiters intact).
- [ ] Graph engine renders when `graphConfig` present.

## 3) Grading Pipeline (Keywords + AI)
- [ ] Keyword grading via `grading-rules.js` runs for each field.
- [ ] All fields use only `E/P/I` scores.
- [ ] `platform/platform.js` merges AI and keyword scores correctly.
- [ ] AI request to `/api/ai/grade` handles provider fallback (Groq -> Gemini).
- [ ] AI failures show teacher review escalation (not silent failure).
- [ ] Appeal flow (`/api/ai/appeal`) returns parsed grades and is merged cleanly.

## 4) Star Award + Progression
- [ ] Star penalties reflect hints + retries (gold/silver/bronze/tin).
- [ ] Per-mode stars accumulate and unlock sequential tiers.
- [ ] `renderModeTabs()` correctly shows locked/unlocked states.
- [ ] Teacher bypass indicator and overrides are respected in UI.
- [ ] Unlock notifications and auto-advance respect feedback visibility.

## 5) Persistence and Sync
- [ ] localStorage `{cartridgeId}_` keys are written and read correctly.
- [ ] `/api/progress` writes per-star entries (legacy leaderboard).
- [ ] `/api/progress/cartridge-sync` writes aggregate `user_progress`.
- [ ] `/api/progress/cartridge/:username/:cartridgeId` restores if local is empty.
- [ ] Conflicts resolve in favor of newest data (server vs local).

## 6) WebSocket / Realtime
- [ ] WebSocket connects and sends `identify` and heartbeats.
- [ ] Presence snapshot and user_online/offline updates render.
- [ ] `star_earned` broadcasts update notifications.
- [ ] `progression_override_*` broadcasts update tabs in real time.
- [ ] Ghost battle completion messages show correct outcome toast.

## 7) AI Feedback Panel
- [ ] Panel shows provider, model, and AI score when used.
- [ ] Panel hides on Skip/Next/Try Again.
- [ ] Error state shows when AI fails (no silent errors).

## 8) Teacher Review Flow
- [ ] Teacher review submission writes to `/api/teacher-review`.
- [ ] Teacher review list loads with filters and renders per field.
- [ ] Teacher review completion broadcasts to student via WebSocket.

## 9) Roster + Periodization
- [ ] Roster modal load/save to `/api/roster`.
- [ ] Bulk assign applies class period and real name updates.
- [ ] Leaderboard filters by period when selected.

## 10) Deep Linking
- [ ] `?cartridge` and `?c` aliases resolve to existing cartridge.
- [ ] `?level` (id) and `?start` (index) jump to correct mode.
- [ ] Students see warning toast when deep-linking to locked modes.

## 11) Ghost System (Core)
- [ ] Ghost profile initializes on login and on cartridge change.
- [ ] Ghost sync uses `/api/ghost/:cartridgeId/sync` successfully.
- [ ] Ghost leaderboard `/api/ghost/:cartridgeId/leaderboard` loads.
- [ ] Ghost battle requests and result retrieval work end-to-end.

## 12) Ghost Orbits (Arena + Multiplayer)
- [ ] Join/leave arena via WebSocket and REST endpoints.
- [ ] Arena state syncs to joining clients.
- [ ] Input handling (thrust + direction) updates game state.
- [ ] Earned star rejoin logic is triggered.
- [ ] Multiplayer rooms create/join and state broadcasts are stable.

## 13) Cartridges (Per-Cartridge Compliance)
- [ ] `manifest.json` ids match directory names and registry entries.
- [ ] `grading-rules.js` exports `gradeField` with valid scores.
- [ ] `generator.js` outputs context vars used in templates.
- [ ] `ai-grader-prompt.txt` uses supported placeholders.
- [ ] `contexts.json` schema matches `contexts: []` and is referenced.

## 14) Tests (Targeted)
- [ ] `tests/core/*` pass (game engine, UI events, escape key).
- [ ] `tests/grading/*` pass (cartridge grading correctness).
- [ ] `tests/server/*` pass (API endpoints, ghost flows, roster).

## 15) Documented Mismatches (Decision Required)
- [ ] Confirm whether CTF/KotH/tiebreaker flows are intentionally inactive.
- [ ] If inactive, mark state-machine sections as historical only.
- [ ] If active, identify missing client modules and endpoints to restore.
