# Platform Refactor Investigation Spec

**Goal**: Evaluate whether and how to refactor the Driller platform layer for better performance, maintainability, and reliability — including consideration of alternative languages/frameworks (Rust/WASM, TypeScript, SolidJS, Svelte, etc.).

**Output**: `specs/platform-refactor-analysis.md` — a unified findings document produced by both Claude and Codex, cross-checked.

**Scope**: Platform/console layer only. Cartridge interface is sacred. Railway + Vercel deployment stays.

---

## 1. Current Architecture Audit

### 1A. The Monolith Problem
`platform/app.html` is **5,737 lines** containing HTML, CSS, and ~4,700 lines of JavaScript in a single `<script type="module">` block. This is the core investigation target.

**Gather**:
- [ ] Count distinct "sections" in app.html (marked by `// ==== ... ====` comments). List each with line range and responsibility.
- [ ] Count total functions defined inline in app.html (not imported).
- [ ] Identify all mutable module-level state (variables declared at module scope that are written to). These are the implicit "store."
- [ ] Map the dependency graph: which inline functions call which imported modules, and which call each other. Identify the 10 most-connected functions (highest fan-in + fan-out).
- [ ] Identify all DOM query selectors (`getElementById`, `querySelector`, etc.) — how many unique DOM elements does the JS touch?

### 1B. Module Quality
`platform/core/` has 40 files, `platform/game/` has 15.

**Gather**:
- [ ] For each core module: lines of code, number of exports, number of imports, and whether it has side effects on import.
- [ ] Identify circular dependencies (A imports B imports A).
- [ ] Identify modules that hold mutable singleton state vs. pure-function modules.
- [ ] Identify modules that directly touch the DOM vs. those that are logic-only.
- [ ] Which modules have corresponding test files? Which don't?

### 1C. Server Monolith
`railway-server/server.js` is **~4,333 lines**.

**Gather**:
- [ ] Count API endpoints. Group by domain (user, progress, grading, teacher, ghost, time, admin).
- [ ] Identify which endpoints are hot-path (called on every problem submit) vs. cold (called rarely).
- [ ] Map middleware chain. Any auth middleware, rate limiting, validation?
- [ ] Identify all Supabase table interactions per endpoint.
- [ ] Measure: does the server do any CPU-heavy work, or is it purely I/O-bound (proxy to Supabase/AI)?

---

## 2. Performance Baseline

### 2A. Bundle Analysis

**Gather**:
- [ ] Run `npx vite build` and record chunk sizes (gzipped and raw).
- [ ] Identify what's in each chunk (which modules).
- [ ] Measure: what percentage of the main bundle is actually used on first page load vs. lazy-loaded?
- [ ] Record current dynamic imports and what triggers each.

### 2B. Runtime Performance Concerns

**Gather**:
- [ ] How many event listeners are attached to `document` or `window`? (Event delegation vs. direct binding)
- [ ] How does the animation video player work? How are videos loaded/preloaded?
- [ ] How does the graph engine render? (Canvas 2D? requestAnimationFrame loop? One-shot render?)
- [ ] KaTeX rendering: on every problem generation? Cached? Measure DOM nodes created per problem.

### 2C. Network Waterfall

**Gather**:
- [ ] Trace the critical path from page load to first interactive problem:
  1. HTML parse → 2. JS modules → 3. registry.json → 4. server detect → 5. cartridge load → 6. problem generate
- [ ] Which of these are sequential vs. parallelizable?
- [ ] WebSocket connection: when does it connect? Is it blocking?
- [ ] What happens under degraded network? (This is the reported bug — buttons disappearing)

---

## 3. Degraded Network / Missing UI Investigation

This is the **active bug** the user reported. Buttons (WebRTC toggle, animation preload, etc.) don't appear under degraded network conditions.

**Gather**:
- [ ] Trace the code path that creates/shows the WebRTC toggle button. Is its visibility gated on server detection or WebSocket connection?
- [ ] Trace the animation preload button visibility. What condition shows `#preload-animations-setting`?
- [ ] Trace `detectServer()` — what happens when it times out? What UI state results?
- [ ] Are there `if (connected)` or `if (wsClient.connected)` guards that hide UI when offline?
- [ ] Does the 1-second server detection timeout (reduced from 2s in `dbcb87f`) cause false negatives on slow networks?
- [ ] List ALL UI elements whose visibility depends on network/server state.

---

## 4. Language & Framework Evaluation

Evaluate each option against these criteria:
1. **Performance** — bundle size, TTI, runtime speed, memory
2. **Maintainability** — type safety, component model, debugging, refactoring confidence
3. **Migration effort** — incremental vs. big-bang, test preservation, cartridge interface compatibility
4. **Developer experience** — tooling, ecosystem, learning curve for this team
5. **Deployment compatibility** — Vercel (frontend), Railway (backend), Supabase
6. **Offline/LAN** — file:// support (currently `index.html` is legacy landing page only; `app.html` requires dev server — confirm this)

### 4A. Frontend Framework Options

Evaluate each with concrete trade-offs for THIS codebase:

- [ ] **Keep Vanilla JS + TypeScript** — Add types to existing modules, break app.html into ES module components. No framework. Minimal migration.
- [ ] **SolidJS** — Fine-grained reactivity, no virtual DOM, tiny runtime (~7KB). Closest to vanilla JS mental model. JSX compilation.
- [ ] **Svelte 5** — Compiler-based, no runtime. Runes reactivity. Small bundles. Good for component extraction.
- [ ] **Preact** — React-compatible, 3KB. Could use existing React ecosystem. Signal-based with @preact/signals.
- [ ] **Rust + WASM (Leptos/Dioxus)** — Full-stack Rust. Compile to WASM. Consider: is any part of this app CPU-bound enough to benefit from WASM? Or is it all I/O-bound?
- [ ] **React/Next.js** — Industry standard. Heavy runtime. SSR possible but is it needed?

For each, answer:
- How would the 5,737-line app.html decompose into components?
- How would mutable module-level state become managed state?
- How would the cartridge loading interface work? (Dynamic import of plain JS files)
- How would the 1,682 tests migrate?
- What's the bundle size impact?
- Can it run on Vercel?

### 4B. Backend Options

- [ ] **Keep Express.js + TypeScript** — Add types, split server.js into route files. Minimal change.
- [ ] **Rust (Axum/Actix-web)** — Compile to native. Fast cold starts on Railway. But: is the server CPU-bound, or is it just proxying to Supabase/Groq? If purely I/O, Rust won't help much.
- [ ] **Hono** — Ultralight (12KB), runs on Edge/Node/Deno/Bun. Could deploy as Vercel Edge Functions, eliminating Railway.
- [ ] **Fastify** — Drop-in Express replacement, 2x faster routing.

For each, answer:
- Does Railway support this runtime?
- How would the 40+ endpoints migrate?
- WebSocket support?
- How would Supabase client work?
- Cold start time on Railway?

### 4C. Hybrid Approach

- [ ] **WASM modules for hot paths only** — e.g., compile grading-engine or graph-engine to WASM, keep rest in JS. Evaluate: are any modules actually CPU-bound?
- [ ] **Incremental TypeScript migration** — `allowJs: true`, add types file by file. No framework change.
- [ ] **Island architecture** — Keep static HTML shell, hydrate interactive "islands" (problem display, input, grading, graph) independently.

---

## 5. Cartridge Interface Compatibility

The cartridge contract is sacred: `manifest.json`, `generator.js`, `grading-rules.js`, `ai-grader-prompt.txt`.

**Gather**:
- [ ] How does `CartridgeLoader` currently load these? (Dynamic `import()`, `fetch()`, or `<script>` tags?)
- [ ] Are generator.js and grading-rules.js pure functions, or do they access globals/DOM?
- [ ] If the platform moves to TypeScript or Rust/WASM, can it still dynamically import plain `.js` cartridge files?
- [ ] Could cartridges be loaded as Web Workers for isolation?

---

## 6. State Management Audit

The current app has no explicit state manager — it uses module-level `let` variables in app.html.

**Gather**:
- [ ] List every module-level mutable variable in app.html with its type and what writes to it.
- [ ] Identify state that's duplicated between: JS variables, localStorage, IndexedDB (Dexie), Supabase, URL params.
- [ ] Map state flow: user action → state change → UI update. Is there a unidirectional flow, or is it spaghetti?
- [ ] Which state is session-scoped vs. persistent?

---

## 7. Test Migration Assessment

1,682+ tests in Vitest.

**Gather**:
- [ ] What percentage of tests are pure logic (no DOM, no fetch) vs. integration (need server)?
- [ ] Could pure-logic tests survive a framework change unchanged?
- [ ] Are there any tests that import from app.html directly? (These would break in any refactor.)
- [ ] What's the test-to-code ratio per module?

---

## 8. Risk Assessment

For each refactor option, evaluate:
- [ ] **Regression risk** — What could break? How would we catch it?
- [ ] **Timeline** — Incremental (can ship partially) vs. big-bang (must complete before shipping)?
- [ ] **Rollback plan** — Can we keep the old code running in parallel?
- [ ] **Student impact** — Any downtime? Data migration needed?
- [ ] **Cartridge author impact** — Do existing cartridges need changes?

---

## 9. Specific Questions to Answer

1. **Is Rust/WASM justified?** The platform is primarily I/O-bound (fetch cartridges, call AI APIs, read/write Supabase). Where is CPU actually spent? Graph rendering? KaTeX? Problem generation?

2. **What's the actual bottleneck?** Is it bundle size (solved by code splitting), runtime perf (solved by framework), DX/maintainability (solved by TypeScript), or architecture (solved by component model)?

3. **Could we get 80% of the benefit from just**: (a) breaking app.html into modules, (b) adding TypeScript, (c) fixing the degraded-network UI bug?

4. **What's the simplest change that fixes the reported problems** (missing buttons, degraded network)?

---

## Deliverable

`specs/platform-refactor-analysis.md` containing:

1. **Current State Summary** — Architecture diagram, pain points, performance numbers
2. **Bug Fix** — Root cause and fix for degraded-network UI disappearance
3. **Framework Comparison Matrix** — Scored rubric for each option
4. **Recommended Path** — Primary recommendation + rationale + migration plan
5. **Quick Wins** — Things we can do NOW regardless of framework choice
6. **Appendix** — Raw data (function counts, state inventory, bundle analysis)
