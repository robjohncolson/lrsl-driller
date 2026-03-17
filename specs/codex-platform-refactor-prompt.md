# Codex Prompt: Platform Refactor Investigation

You are investigating the **lrsl-driller** codebase — a subject-agnostic drill/quiz platform for teachers. Your job is to inspect the actual repository files, gather concrete measurements, and produce a single output document: `specs/platform-refactor-analysis.md`.

The full investigation spec is at `specs/platform-refactor-investigation.md`. Read it first. This prompt tells you **how** to execute that spec and **what to prioritize**.

---

## Your output

Write `specs/platform-refactor-analysis.md`. It must contain all 9 sections from the spec, with concrete measurements, file:line references, and repo-specific conclusions. No hand-waving — if you claim something, cite the code.

---

## Priority order

### P0 — Degraded-Network Missing-UI Bug (Section 3)

This is the active user-reported bug. Teacher-only buttons (WebRTC toggle, animation preload, roster, review queue, time analytics) disappear under degraded network. Investigate and root-cause it **first**.

Here's what you already know — verify and extend:

1. **All teacher buttons start hidden.** In `platform/app.html`:
   - `#webrtc-toggle-btn` — `style="display: none;"` (line 92)
   - `#teacher-review-btn` — `style="display: none;"` (line 82)
   - `#time-analytics-btn` — `style="display: none;"` (line 86)
   - `#roster-btn` — `style="display: none;"` (line 89)
   - `#preload-animations-setting` — `class="hidden"` (line 736)

   Note: `#ghost-btn` (line 110) is also `display: none`, but it is **not** teacher-gated — it's hidden because the Ghost system is fully disabled (no-op stub at line 1446). Do not include it in the teacher-mode bug analysis.

2. **They only become visible inside `activateTeacherMode()`** (line 3009), which sets `.style.display = 'flex'` or removes `.hidden`.

3. **`activateTeacherMode()` is called from 3 places:**
   - Line 2383: After student login discovers `result.isTeacher`. Note: `verifyUser()` in `platform/core/user-system.js:249` does attempt a server round-trip, but on fetch failure it still returns `{ valid: true }` — it just loses the `isTeacher` flag (`serverResult?.isTeacher || false` at user-system.js:275). So **ordinary login works offline, but teacher status is lost** because `isTeacher` defaults to `false` when the server is unreachable.
   - Line 3109: Inside `checkTeacherModePersistence()` — tries to re-verify cached teacher password against server (`POST /api/auth/teacher` at line 3102). If the fetch fails (network down), it catches the error at line 3113 and returns false. **Teacher mode silently fails to activate.**
   - Line 3137: Fresh teacher login (requires server)

4. **The 1-second `detectServer()` timeout** (line 1055, reduced from 2s in commit `dbcb87f`):
   - If this times out, `SERVER_URL` gets rewritten to `http://${window.location.host}` (line 1070), and `_serverDetected` still gets set to `true` (line 1072).
   - **However, the URL rewrite does NOT affect all subsystems.** Several modules are instantiated with the **original** Railway `SERVER_URL` (which is still `https://...railway.app` at that point) *before* `detectServer()` completes:
     - `userSystem = new UserSystem({ serverUrl: SERVER_URL })` at line 1218 — stores URL at construction (`user-system.js:109`)
     - `leaderboard = new Leaderboard({ serverUrl: SERVER_URL })` at line 1219 — stores URL at construction (`leaderboard.js:9`)
     - `timeTracker = new TimeTracker({ serverUrl: SERVER_URL })` at line 1221 — stores URL at construction (`time-tracker.js:8`)
   - So the bug surface is **inconsistent URL handling**: some subsystems keep the original Railway URL, while code that reads `SERVER_URL` after the timeout gets the rewritten localhost URL. This affects `checkTeacherModePersistence()` (line 3102), `WebSocketClient` (line 1245), `RosterModal` (line 3048), and any other code that reads the module-level `SERVER_URL` variable after the rewrite.
   - On a Vercel (HTTPS) deployment, the rewritten URL becomes `http://${window.location.host}` (line 1070). **Determine the exact failure mode**: is it 404s (no server listening), mixed-content blocking (HTTP on HTTPS page), or both? Do not assume — trace the protocol and check whether the browser would block the request before it's even sent.

**Your task for P0:**
- Confirm or refute the above analysis by reading the actual code paths.
- Explicitly answer: **Does the 1-second timeout cause false negatives on slow networks?** Show the code path.
- Map which subsystems use the **captured** (pre-rewrite) URL vs. the **live** `SERVER_URL` variable. Show the split.
- List **every UI element** whose visibility depends on server connectivity, directly or transitively. Do not include `#ghost-btn` (disabled for unrelated reasons).
- Trace what happens when `detectServer()` times out on Vercel (no local dev server) — determine the **exact** failure mode (404, mixed-content block, CORS, or other). Show your reasoning.
- Propose the minimal fix (e.g., increase timeout, retry with backoff, activate teacher mode from cache without server verification, or fix the URL-capture timing).

---

### P1 — Critical Decision Point: Question 3 (Section 9)

> Could we get 80% of the benefit from just: (a) breaking app.html into modules, (b) adding TypeScript, (c) fixing the degraded-network UI bug?

This is the most important strategic question. To answer it, you need data from Sections 1, 2, 6, and 7.

**Gather these measurements:**

**Section 1A — The Monolith:**
- Count the `// ==================== ... ====================` section markers in `platform/app.html`. List each with line range and what it does.
- Count all `function` and `async function` declarations at module scope in `app.html` (not inside other functions). Give the total.
- List all `let` and `var` declarations at module scope in app.html's `<script>` block. These are the implicit global store. Count them.
- Identify the 10 most-connected functions (highest fan-in + fan-out combined — i.e., functions that both call many others and are called by many others).
- Count all DOM query selectors (`getElementById`, `querySelector`, `querySelectorAll`) in `app.html`. How many unique DOM element IDs does the JS reference?

**Section 1B — Module quality:**
- For each file in `platform/core/` and `platform/game/`: record filename, line count (use `wc -l` or count), number of `export` statements, number of `import` statements, and whether it has a test file in `tests/`.
- Note which modules have side effects on import (e.g., top-level code that runs immediately, event listener registration, DOM manipulation outside of exported functions).
- Check for circular imports: do any modules in `platform/core/` import each other in a cycle?
- Which modules directly reference `document`, `window`, `localStorage`, or `getElementById`? These are DOM-coupled. Which are pure logic?

**Section 1C — Server:**
- Count all `app.get`, `app.post`, `app.put`, `app.delete` in `railway-server/server.js`. Group by URL prefix (`/api/users`, `/api/progress`, `/api/ai`, `/api/teacher-review`, `/api/ghost`, `/api/time-tracking`, etc.).
- Map the middleware chain: what middleware is applied globally (`app.use(...)`)? Any auth middleware, rate limiting, input validation, or error handling?
- Map Supabase table interactions: for each endpoint group, which Supabase tables does it read/write?
- Is there any CPU-intensive work (loops, math, parsing) or is it all Supabase queries + AI proxy calls?

**Section 2A — Bundle:**
- Run `npx vite build 2>&1` and capture output. Record every chunk filename and size.
- List the current dynamic `import()` calls in `app.html` and what triggers each.

**Section 2B — Runtime concerns:**
- Count event listeners attached to `document` or `window` in `app.html`. Are they using event delegation or direct binding?
- How does the animation video player work? Trace video preload/load. How are videos loaded per mode? What's the preload strategy?
- How does `graph-engine.js` render? Canvas 2D? requestAnimationFrame loop? One-shot?
- KaTeX rendering: is it called on every problem generation? Is output cached or rebuilt each time?

**Section 6 — State audit:**
- List every `let` variable at module scope in `app.html` with its initial value. Categorize: UI state, user state, network state, game state, cartridge state.
- Note which of these are also persisted to localStorage or IndexedDB (duplicated state).
- Map state flow for a representative user action (e.g., "student submits answer"): user action → state change → UI update → server sync. Is it unidirectional or spaghetti?
- Which state is session-scoped (lost on refresh) vs. persistent (survives refresh)?

**Section 7 — Tests:**
- Count test files in `tests/core/`, `tests/grading/`, `tests/generators/`, `tests/server/`, `tests/game/`, and root `tests/`.
- Read 2-3 test files and determine: do any import from `platform/app.html`? Or do they all import from individual modules? This determines whether tests survive a refactor.
- Compute test-to-code ratio: for each module that has tests, what's the approximate ratio of test lines to source lines?

**Then answer Question 3** with a clear yes/no/partially, supported by the data. Specifically:
- How many of the `let` module-scope variables could become module exports if app.html were split?
- How many of the inline functions could be extracted to separate files without changing their signatures?
- Would TypeScript catch real bugs here, or is the main problem architecture, not types?
- Does the degraded-network bug require a framework change, or is it a 10-line fix?

---

### P2 — Framework & Language Evaluation (Section 4)

Evaluate each option **against this specific codebase**, not in the abstract. Use the data you gathered in P1.

**Frontend options — for each, answer concretely:**

1. **Vanilla JS + TypeScript (no framework)**
   - How would app.html decompose? Propose a file tree (e.g., `platform/modules/teacher-mode.ts`, `platform/modules/grading-flow.ts`).
   - Estimate: how many of the current 40 core modules need type changes vs. just `.js → .ts` rename?
   - Can Vite handle incremental TS migration with `allowJs: true`?

2. **SolidJS**
   - What's the runtime cost? (Check: `solid-js` bundle size)
   - How would cartridge dynamic `import()` of plain `.js` files work inside SolidJS?
   - How would the 1,682 vitest tests migrate? SolidJS uses JSX — does vitest support that?

3. **Svelte 5**
   - Same questions as SolidJS. Plus: Svelte has its own file format (`.svelte`). Can it coexist with plain JS cartridges?
   - Would the existing Vite config work, or does it need `@sveltejs/vite-plugin-svelte`?

4. **Preact**
   - Size advantage over React? Runtime cost?
   - Can `@preact/signals` replace the module-scope `let` variables naturally?

5. **Rust + WASM (Leptos / Dioxus)**
   - Identify: what parts of this codebase are CPU-bound? Read `platform/core/graph-engine.js`, `platform/core/game-engine.js`, `platform/core/grading-engine.js`. Is any of them doing heavy computation, or are they all lightweight I/O + DOM manipulation?
   - WASM cannot touch the DOM directly. How would the 100+ `getElementById` calls in app.html work?
   - Can Leptos/Dioxus dynamically import plain `.js` cartridge files? (This is likely a deal-breaker — verify.)
   - Railway supports Docker, so Rust backend is deployable. But: does the server do any CPU work that would benefit from native compilation? Read `railway-server/server.js` and check.

6. **React / Next.js**
   - Runtime size penalty? Is SSR useful for a drill app that's entirely client-side interactive?
   - Would this be the most familiar option for future contributors?

**Backend options — for each:**

1. **Express.js + TypeScript** — Estimate: how many endpoints could be typed just by adding `.ts` and interfaces? Is there complex logic or is it all Supabase calls?
2. **Rust (Axum)** — Is the server CPU-bound anywhere? If it's all `supabase.from('table').select()` and `fetch(groqUrl)`, Rust won't help.
3. **Hono** — Could this run as Vercel Edge Functions, eliminating Railway entirely? Check: does it support WebSocket (needed for presence/signaling)?
4. **Fastify** — Drop-in Express replacement. Any incompatibilities with the current middleware?

---

### P3 — Remaining Sections

**Section 5 — Cartridge interface:**
- Read `platform/core/cartridge-loader.js`. How does it load `generator.js` and `grading-rules.js`? Is it `import()`, `fetch() + eval()`, or something else?
- Read 1-2 cartridge `generator.js` files. Do they use `Math.random()`, `console.log`, or any browser globals? Or are they pure functions?
- Conclusion: can every framework option still load these plain JS files dynamically?
- Feasibility check: could cartridges be loaded as Web Workers for isolation? What would break? (Consider: do generators access any shared state, DOM, or imported modules?)

**Section 8 — Risk:**
- For each framework option, state: incremental migration possible (yes/no), test breakage risk (high/medium/low), rollback plan.
- Would any option require existing cartridges to change? (Must be NO.)

---

## Output format

Write `specs/platform-refactor-analysis.md` with this structure:

```markdown
# Platform Refactor Analysis

## 1. Current State Summary
### 1A. app.html Monolith Audit
(section counts, function counts, state variable inventory, DOM coupling)
### 1B. Module Quality Report
(table: file, lines, test coverage, DOM-coupled, stateful)
### 1C. Server Audit
(endpoint count by domain, CPU profile, Supabase table map)

## 2. Performance Baseline
### 2A. Bundle Analysis
(chunk table from vite build output)
### 2B. Runtime Concerns
(event listener count, rendering patterns)
### 2C. Network Waterfall
(critical path diagram, sequential vs. parallel)

## 3. Degraded-Network Bug: Root Cause & Fix
### Root Cause
(code path trace with file:line references)
### The 1-Second Timeout Verdict
(explicit yes/no: does it cause false negatives?)
### All Network-Gated UI Elements
(complete list)
### Proposed Fix
(minimal code change, with before/after)

## 4. Framework Comparison
### 4A. Frontend Matrix
| Criterion | Vanilla+TS | SolidJS | Svelte 5 | Preact | Rust/WASM | React |
(scored 1-5 per criterion, with notes)
### 4B. Backend Matrix
| Criterion | Express+TS | Rust/Axum | Hono | Fastify |
### 4C. Hybrid Options
(WASM hot-path modules, island architecture)

## 5. Cartridge Interface Compatibility
(loading mechanism, purity analysis, framework compatibility)

## 6. State Management Audit
(full variable inventory, duplication map, flow analysis)

## 7. Test Migration Assessment
(pure logic vs. integration ratio, import analysis, migration risk per framework)

## 8. Risk Assessment
(table: option, incremental?, test risk, rollback, cartridge impact)

## 9. Recommendations
### Critical Decision: Question 3
(explicit answer with supporting data)
### Primary Recommendation
(what to do and why)
### Migration Path
(phase 1, 2, 3 with concrete milestones)
### Quick Wins
(things to do NOW regardless of framework choice)

## Appendix
### A. app.html Section Map
### B. Module-Level State Inventory
### C. Full Module Table (core + game)
### D. Bundle Analysis Raw Output
### E. Endpoint Inventory
```

---

## Rules

1. **Read the actual files.** Do not guess or hallucinate code structure. Every claim must reference `file:line`.
2. **Run the build** (`npx vite build`) if possible. If you can't run commands, note it and estimate from the source.
3. **Prioritize P0 (the bug) above all else.** If you run out of context, at minimum deliver Section 3 completely.
4. **Be opinionated in Section 9.** The user wants a recommendation, not a menu. Make a call and defend it.
5. **Preserve the cartridge contract.** Any option that requires changing `generator.js` / `grading-rules.js` / `manifest.json` is disqualified.
6. **The user is considering Rust seriously.** Give it a fair evaluation, but be honest about whether it's justified for a mostly-I/O-bound edtech app. Don't dismiss it out of hand, but don't recommend it if the data doesn't support it.
7. **Question 3 is the pivot point.** If the answer is "yes, modularize + TS + fix the bug gets 80% of the value," say so clearly and make that the recommendation. If no, explain what's missing.
