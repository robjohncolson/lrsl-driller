# Platform Refactor Analysis

This document reflects the current checkout, not the older line counts embedded in the prompt. In this repo snapshot, `platform/app.html` is about 5,738 lines (`<script type="module">` spans `platform/app.html:1010-5734`), `railway-server/server.js` is 3,672 lines, and the test suite on disk is 58 `.test.js` files.

## 1. Current State Summary

### 1A. app.html Monolith Audit

`platform/app.html` is still the main architectural problem. The module script starts at `platform/app.html:1010` and ends at `platform/app.html:5734`. A direct scan of that block found:

- 35 named section markers (`platform/app.html:1044-5734`)
- 103 module-scope `function` / `async function` declarations
- 33 module-scope `let` declarations and 0 module-scope `var` declarations
- 422 DOM query calls (`getElementById`, `querySelector`, `querySelectorAll`)
- 201 unique referenced DOM IDs, including two template-generated IDs (`status-${id}`, `status-${step}`)

The monolith is not just "large"; it is acting as an implicit store, controller layer, and view layer at once. The mutable module-scope `let` block spans network config, teacher auth, cartridge state, ghost state, time analytics state, and modal state (`platform/app.html:1024-4052`).

The 10 most-connected module-scope functions by fan-in + fan-out are:

| Function | Line | Fan-in | Fan-out | Total |
| --- | ---: | ---: | ---: | ---: |
| `loadCartridge` | 4421 | 6 | 25 | 31 |
| `init` | 5476 | 12 | 10 | 22 |
| `applyTeacherGrades` | 2015 | 2 | 13 | 15 |
| `renderModeTabs` | 4176 | 9 | 6 | 15 |
| `updateSyncIndicator` | 1233 | 0 | 9 | 9 |
| `updateScenarioDisplay` | 4810 | 7 | 2 | 9 |
| `submitForTeacherReview` | 2224 | 0 | 8 | 8 |
| `loadPendingReviews` | 3194 | 6 | 2 | 8 |
| `updateWebRTCStatusUI` | 5330 | 3 | 5 | 8 |
| `resetAllProgressionOverrides` | 5065 | 0 | 7 | 7 |

The shape of the monolith matters more than the raw line count. `loadCartridge()` alone creates `Platform`, wires grading callbacks, performs server fetches, restores progress, syncs URL state, loads the first problem, and updates several DOM regions (`platform/app.html:4421-4805`). That is orchestration work that should be split even if no framework is introduced.

### 1B. Module Quality Report

The repo already has a useful module layer:

- 40 JS files in `platform/core/`
- 15 JS files in `platform/game/` plus 1 CSS asset (`platform/game/grid-wars.css`)
- 55 JS modules total across `platform/core/` and `platform/game/`
- 36 DOM-coupled modules, 7 I/O-centric modules without direct DOM usage, and 12 logic-only modules
- No circular imports detected within `platform/core/`

Representative modules:

| Module | Lines | DOM-coupled | Test files | Notes |
| --- | ---: | --- | ---: | --- |
| `platform/core/cartridge-loader.js` | 307 | yes | 0 | Runtime cartridge contract; dynamic import bridge (`platform/core/cartridge-loader.js:63-144`, `190-200`) |
| `platform/core/game-engine.js` | 528 | yes | 6 | Stateful core game logic with decent test coverage |
| `platform/core/grading-engine.js` | 338 | no | 0 | Mostly logic plus AI fetch orchestration |
| `platform/core/graph-engine.js` | 2348 | yes | 0 | Canvas/DOM-heavy renderer (`platform/core/graph-engine.js:44-50`, `108`, `1514`, `1614`) |
| `platform/core/input-renderer.js` | 701 | yes | 0 | DOM-heavy input UI; already lazy-loads radical mini-games |
| `platform/core/user-system.js` | 383 | yes | 0 | Identity, Dexie/localStorage, server verification |
| `platform/core/websocket-client.js` | 361 | no | 0 | Network-only client, currently cleanly isolated |
| `platform/core/webrtc-manager.js` | 463 | no | 1 | Good candidate for TS-first migration |
| `platform/core/leaderboard.js` | 338 | yes | 1 | UI plus server-backed aggregation |

Import-time side effects are limited and explicit:

- `platform/core/celebration.js:329-334` creates a singleton and auto-injects styles on import.
- `platform/core/sound-engine.js:255-256` exports a singleton instance.
- `platform/core/user-system.js:380-382` exports a singleton instance.

That is a manageable surface area. This is not a codebase that needs a framework rewrite just to escape bundler or dependency graph chaos.

### 1C. Server Audit

`railway-server/server.js` is a large single file, but it is not computationally exotic:

- 3,672 lines total
- 57 route handlers
- Global middleware is only `cors()` and `express.json()` (`railway-server/server.js:45-46`)
- No global auth middleware, no validation middleware, no rate limiter, no centralized error middleware
- A WebSocket server is mounted directly on the Node HTTP server (`railway-server/server.js:51-52`, `3569`)

Route counts by domain:

| Domain | Count | Notes |
| --- | ---: | --- |
| `/` and `/api/version` | 2 | Health/version |
| `/api/users*` | 4 | User list/create/verify/star bootstrap |
| `/api/auth/teacher` | 1 | Teacher password validation |
| `/api/progress*` | 6 | Hot path for progress + cartridge sync |
| `/api/leaderboard*` | 2 | Aggregation endpoints |
| `/api/settings*` | 2 | User settings |
| `/api/ai*` | 5 | AI proxy/status/key contribution |
| `/api/teacher-review*` | 4 | Teacher review queue |
| `/api/time-tracking*` | 4 | Session/problem/class time |
| `/api/roster*` | 3 | Teacher roster tools |
| `/api/progression-overrides*` | 4 | Teacher progression control |
| `/api/ghost*` | 8 | Ghost sync and battle APIs |
| `/api/ghost-orbits*` | 12 | Orbits and multiplayer state |

Supabase table usage by domain:

| Domain | Tables |
| --- | --- |
| users | `users`, `lsrl_progress` |
| progress | `users`, `lsrl_progress`, `user_progress` |
| leaderboard | `users`, `lsrl_progress`, `user_progress` |
| settings | `users`, `user_settings`, `api_keys_pool` |
| ai | `api_keys_pool`, RPCs `increment_key_failures`, `increment_key_uses` |
| teacher-review | `teacher_reviews`, `users` |
| time-tracking | `time_sessions`, `time_problems` |
| roster | `users` |
| progression-overrides | `progression_overrides` |
| ghost | `ghost_profiles`, `ghost_ratings`, `ghost_battles`, `class_roster` |
| ghost-orbits | mostly in-memory managers and WebSocket state, not DB-heavy REST |

The CPU profile is mostly I/O-bound:

- Supabase reads/writes dominate the request bodies (`railway-server/server.js:140-890`, `2061-2750`, `2789-3381`)
- AI routes proxy out to external providers (`railway-server/server.js:1171`, `1206`, `1694`, `1894-1990`)
- Presence/signaling is WebSocket fan-out and coordination (`railway-server/server.js:3569-4334`)

There are CPU pockets, but they are local loops, not a backend-wide bottleneck:

- leaderboard aggregation and sorting (`railway-server/server.js:697-739`, `756-818`)
- class time summaries (`railway-server/server.js:2397-2470`)
- ghost battle simulation / rating math (`railway-server/server.js:2972-3059`)

That makes Express + TypeScript a much better fit than a Rust rewrite.

## 2. Performance Baseline

### 2A. Bundle Analysis

`npx vite build` succeeds. The output is:

| Output | Raw size | Gzip size |
| --- | ---: | ---: |
| `dist/assets/registry-D0gEbrYj.json` | 5.34 kB | 1.61 kB |
| `dist/standalone/math-viz/index.html` | 17.73 kB | 3.95 kB |
| `dist/index.html` | 32.91 kB | 8.37 kB |
| `dist/platform/app.html` | 60.06 kB | 12.70 kB |
| `dist/assets/app-DW_caR8Q.css` | 65.17 kB | 11.42 kB |
| `dist/assets/modulepreload-polyfill-B5Qt9EMX.js` | 0.71 kB | 0.40 kB |
| `dist/assets/ghost-orbits-audio-DQomeCUK.js` | 6.60 kB | 2.03 kB |
| `dist/assets/webrtc-manager-DPRq5c4_.js` | 6.73 kB | 2.00 kB |
| `dist/assets/p2p-asset-transfer-BfB-BHkW.js` | 6.87 kB | 2.23 kB |
| `dist/assets/radical-game-BM4q4pzB.js` | 8.24 kB | 2.48 kB |
| `dist/assets/radical-prime-game-BntBtVZ6.js` | 12.27 kB | 3.35 kB |
| `dist/assets/roster-modal-DT2O9To3.js` | 14.35 kB | 3.98 kB |
| `dist/assets/radical-complex-game-_3k8bcQH.js` | 15.12 kB | 3.82 kB |
| `dist/assets/graph-BNHQkv6R.js` | 34.77 kB | 9.67 kB |
| `dist/assets/app-Cm_FZh7Z.js` | 301.48 kB | 88.60 kB |
| `dist/assets/mathViz-9nhjPpdx.js` | 559.02 kB | 140.42 kB |

The app page preloads only:

- `/assets/app-Cm_FZh7Z.js`
- `/assets/modulepreload-polyfill-B5Qt9EMX.js`
- `/assets/graph-BNHQkv6R.js`
- `/assets/app-DW_caR8Q.css`

That means the initial JS for `platform/app.html` is about 336.96 kB raw (`301.48 + 34.77 + 0.71`). The currently lazy app-specific JS totals about 70.18 kB raw (`ghost-orbits-audio`, `webrtc-manager`, `p2p-asset-transfer`, `roster-modal`, `radical-*`). Excluding the standalone `mathViz` entry, about 82.8% of app-page JS is still on the initial path. That argues for more modularization and code splitting, but not for a framework rewrite by itself.

Current dynamic imports:

| File | Line | Trigger |
| --- | ---: | --- |
| `platform/app.html` | 1252 | P2P asset transfer after WebSocket connection |
| `platform/app.html` | 2702 | Ghost Orbits audio when music settings need it |
| `platform/app.html` | 3046 | Roster modal on teacher activation |
| `platform/app.html` | 5283 | WebRTC manager on teacher WebRTC activation |
| `platform/core/input-renderer.js` | 328 | Visual radical mini-game |
| `platform/core/input-renderer.js` | 363 | Prime-factor radical mini-game |
| `platform/core/input-renderer.js` | 397 | Complex radical mini-game |
| `platform/core/cartridge-loader.js` | 199 | Cartridge `generator.js` / JS rubric modules |

### 2B. Runtime Concerns

Global event listener count in `platform/app.html` is modest: 8 listeners attached to `document` or `window` (`platform/app.html:1693-1694`, `2522`, `2634`, `3172`, `4305`, `4371`, `5715`). The problem is not a giant delegated event system; it is the amount of direct element-by-element wiring inside one file.

Rendering/runtime observations:

- The graph engine is a Canvas 2D renderer that creates a canvas and context up front (`platform/core/graph-engine.js:44-50`) and uses `requestAnimationFrame` for animation paths (`platform/core/graph-engine.js:1514`, `1606-1614`).
- KaTeX is loaded globally in the page head (`platform/app.html:10-12`) and re-run when review info is rendered (`platform/app.html:3898-3904`) and when a scenario is updated (`platform/app.html:4817-4826`). There is no visible caching layer.
- Animation video loading is already a multi-tier pipeline, not a framework bottleneck. Teacher preload calls `assetResolver.preloadCartridge()` (`platform/app.html:2833-2868`, `platform/core/asset-resolver.js:257-275`), and normal playback resolves through cache -> P2P -> Supabase -> local path -> GitHub (`platform/app.html:4862-4883`, `platform/core/asset-resolver.js:60-141`).

### 2C. Network Waterfall

Current path from page load to first interactive problem:

1. HTML parses and loads the main app bundle, graph chunk, CSS, and external KaTeX assets (`dist/platform/app.html` output).
2. Module evaluation starts `detectServer()` immediately, but does not await it globally (`platform/app.html:1051-1074`).
3. `init()` awaits cartridge registry population (`platform/app.html:5476-5485`), which fetches `/cartridges/registry.json` through `CartridgeLoader.loadRegistry()` (`platform/app.html:3520-3522`, `platform/core/cartridge-loader.js:19-34`).
4. `init()` awaits `userSystem.init()` (`platform/app.html:5580`, `platform/core/user-system.js:121-153`).
5. `init()` awaits `checkTeacherModePersistence()` (`platform/app.html:5582-5583`, `3097-3116`).
6. If a user exists, `wsClient.connect()` is kicked off but not awaited (`platform/app.html:5585-5589`), `timeTracker.start()` begins listeners/timers (`platform/app.html:5591`, `platform/core/time-tracker.js:46-70`), and `GhostEngine.initGhost()` is started without blocking (`platform/app.html:5593-5601`).
7. `init()` then awaits `loadCartridge()` (`platform/app.html:5603`).
8. Inside `loadCartridge()`, `platform.loadCartridge()` awaits manifest + contexts + generator + grading + AI prompt in parallel (`platform/app.html:4698-4700`, `platform/platform.js:78-118`, `platform/core/cartridge-loader.js:102-144`).
9. After that, the app still awaits progression overrides (`platform/app.html:4705-4718`) and then awaits cloud progress restore (`platform/app.html:4720-4737`) before the first `platform.loadProblem()` call (`platform/app.html:4789-4796`).

So the first-problem path is not fully parallelized. The biggest avoidable waits are:

- teacher persistence re-verification before cached teacher UI is restored
- progression-override fetch before the first problem
- cloud progress restore before the first problem

`app.html` already has enough module structure to improve this without introducing React/Svelte/Solid.

## 3. Degraded-Network Bug: Root Cause & Fix

### Root Cause

The degraded-network teacher UI bug is real and the prompt's broad diagnosis is directionally correct.

The teacher-only controls start hidden in the HTML:

| Element | Default hidden state | Source |
| --- | --- | --- |
| `#teacher-review-btn` | `style="display: none;"` | `platform/app.html:82` |
| `#time-analytics-btn` | `style="display: none;"` | `platform/app.html:86` |
| `#roster-btn` | `style="display: none;"` | `platform/app.html:89` |
| `#webrtc-toggle-btn` | `style="display: none;"` | `platform/app.html:92` |
| `#teacher-badge` | `class="hidden"` | `platform/app.html:123` |
| `#cartridge-shortcuts` | `class="hidden"` | `platform/app.html:304` |
| `#teacher-progression-panel` | `class="hidden"` | `platform/app.html:420` |
| `#video-source-setting` | `class="hidden"` | `platform/app.html:724` |
| `#preload-animations-setting` | `class="hidden"` | `platform/app.html:736` |

`#ghost-btn` is also hidden (`platform/app.html:110`), but it is unrelated and should stay out of this bug because Ghost is stubbed off (`platform/app.html:1446`, `platform/core/ghost-engine.js:1-16`).

Those teacher-only controls are revealed in `activateTeacherMode()`:

- sets `isTeacher` and `teacherPassword` (`platform/app.html:3009-3014`)
- reveals the badge (`platform/app.html:3016`)
- reveals review, analytics, and roster buttons (`platform/app.html:3018-3024`)
- reveals the WebRTC button if the browser supports `RTCPeerConnection` (`platform/app.html:3026-3030`)
- reveals video source and preload settings (`platform/app.html:3032-3041`)
- lazy-loads the roster modal and passes the current `SERVER_URL` (`platform/app.html:3043-3050`)
- shows URL shortcuts and loads pending reviews (`platform/app.html:3056-3060`)

`activateTeacherMode()` is reached from three paths:

1. Existing-user sign-in after `verifyUser()` returns `isTeacher` (`platform/app.html:2364-2384`)
2. Cached teacher-mode restore in `checkTeacherModePersistence()` (`platform/app.html:3097-3116`)
3. Fresh teacher login after `/api/auth/teacher` succeeds (`platform/app.html:3123-3149`)

The failure is that both recovery paths are network-first:

- `UserSystem.verifyUser()` catches fetch failure, still returns `valid: true`, but forces `isTeacher` to `serverResult?.isTeacher || false` (`platform/core/user-system.js:249-276`). That means normal sign-in still works on a slow/broken network, but teacher role is silently dropped.
- `checkTeacherModePersistence()` reads cached teacher metadata, then immediately POSTs to `/api/auth/teacher`, and on any fetch error it returns `false` without restoring UI (`platform/app.html:3097-3116`). That means cached teacher state does not survive network degradation.

`detectServer()` makes the situation worse:

- the comment still says "2-second timeout", but the code aborts after 1000 ms (`platform/app.html:1052-1055`)
- timeout or any fetch failure falls into the fallback path (`platform/app.html:1064-1072`)
- fallback rewrites `SIGNALING_URL` to `ws://${window.location.host}/ws-signaling` and rewrites `SERVER_URL` to `http://${window.location.host}` (`platform/app.html:1069-1070`)
- `_serverDetected` is then set to `true`, but `_serverDetected` is never read anywhere else (`platform/app.html:1050`, `1061`, `1072`)

The captured-vs-live URL split is real because `detectServer()` is started at `platform/app.html:1074`, but several subsystems are constructed before it resolves:

| Uses pre-rewrite captured `SERVER_URL` | Source |
| --- | --- |
| `new UserSystem({ serverUrl: SERVER_URL })` | `platform/app.html:1218`, stored at `platform/core/user-system.js:109-116` |
| `new Leaderboard({ serverUrl: SERVER_URL })` | `platform/app.html:1219`, stored at `platform/core/leaderboard.js:7-25` |
| `new TimeTracker({ serverUrl: SERVER_URL })` | `platform/app.html:1221`, stored at `platform/core/time-tracker.js:6-30` |
| `new WebSocketClient({ serverUrl: SERVER_URL, ... })` | `platform/app.html:1245-1365`, stored at `platform/core/websocket-client.js:10-18` |

| Uses live module-level `SERVER_URL` after fallback rewrite | Source |
| --- | --- |
| teacher persistence re-check | `platform/app.html:3102-3106` |
| fresh teacher login | `platform/app.html:3128-3133` |
| roster modal construction | `platform/app.html:3048` |
| pending reviews | `platform/app.html:3205` |
| time analytics | `platform/app.html:3333` |
| teacher review PUT/GET calls | `platform/app.html:3800`, `4538` |
| progression override fetches | `platform/app.html:4708`, `5002`, `5037`, `5088` |
| cloud restore | `platform/app.html:4724` |

The special case is `wsClient.connect()`: it is wrapped to await `serverDetectionPromise` and overwrite its own `serverUrl`/WebSocket URL only for the local-signaling fallback (`platform/app.html:1367-1375`). That patch fixes WebSocket setup for that one client, not the rest of the app.

### The 1-Second Timeout Verdict

Yes. The 1-second timeout can absolutely produce false negatives on slow networks.

The proof is direct:

- `detectServer()` sends a `HEAD` request to the Railway URL (`platform/app.html:1051-1056`)
- it aborts after 1000 ms (`platform/app.html:1055`)
- any abort goes through the `catch` block (`platform/app.html:1064-1066`)
- the catch path immediately rewrites `SERVER_URL` and `SIGNALING_URL` to same-host local-dev values (`platform/app.html:1068-1072`)

There is no retry, no backoff, and no distinction between "Railway took 1.2 seconds" and "Railway is gone." So a merely slow response is treated as a transport failure.

### All Network-Gated UI Elements

Directly gated by teacher-mode activation:

- `#teacher-badge`
- `#teacher-review-btn`
- `#time-analytics-btn`
- `#roster-btn`
- `#webrtc-toggle-btn`
- `#video-source-setting`
- `#preload-animations-setting`
- `#cartridge-shortcuts`

Transitively network-gated because they only become reachable when teacher mode is restored:

- `#teacher-progression-panel` (`platform/app.html:4943-4959`)
- teacher review queue panel and backdrop (`platform/app.html:3178-3189`, `3941`)
- time analytics panel and backdrop (`platform/app.html:3312-3318`, `3413`)
- the roster modal, because its lazy construction is inside `activateTeacherMode()` (`platform/app.html:3043-3050`, `3947`)

### Proposed Fix

This does not require a framework change. It is a targeted application bug.

Minimal fix:

1. Make teacher persistence cache-first, not fetch-first.
   - Today: `getMeta('teacherMode')` -> POST `/api/auth/teacher` -> only then `activateTeacherMode()` (`platform/app.html:3097-3116`)
   - Better: `getMeta('teacherMode')` -> `activateTeacherMode()` immediately -> revalidate in the background -> only revoke on an explicit "invalid password" response

2. Stop downgrading secure deployments to insecure same-host HTTP.
   - Today: any timeout rewrites `SERVER_URL` to `http://${window.location.host}` (`platform/app.html:1070`)
   - Better: only use `/ws-signaling` fallback on explicit local-dev hosts; keep Railway as the API origin everywhere else

3. Raise the detection threshold and retry at least once.
   - The stale comment already hints this was once 2 seconds (`platform/app.html:1052`)
   - A single 1000 ms abort is too aggressive for a cold or degraded WAN path

4. Optionally preserve teacher role on existing-user login when the server verify call fails.
   - `verifyUser()` currently drops `isTeacher` to `false` on fetch error (`platform/core/user-system.js:249-276`)
   - If cached teacher mode exists and the password matches the cached teacher secret, restore the role locally

Why the Vercel failure is mixed-content first, not 404 first:

- production Vercel is configured as a static Vite output (`vercel.json:1-6`)
- the local-signaling path only exists inside the Vite dev server plugin (`vite.config.js:136-214`, registered at `vite.config.js:252-257`)
- the fallback rewrites requests to `http://<host>` and `ws://<host>/ws-signaling` (`platform/app.html:1069-1070`)
- on an HTTPS Vercel page, those are active mixed-content requests, so the browser blocks them before a server 404 is even the primary issue

If the protocol were fixed to `https://` / `wss://`, the production app would still not have a Vite dev-server `/ws-signaling` endpoint. But the exact current failure mode for the code as written is mixed-content blocking first.

## 4. Framework Comparison

Scores below are fit-to-this-repo scores from 1 to 5, where 5 is best.

### 4A. Frontend Matrix

The current repo is already Vite + ES modules + dynamic cartridge imports. That strongly favors incremental modularization before any framework move.

Proposed no-framework decomposition:

```text
platform/modules/
  bootstrap.ts
  state/app-state.ts
  state/network-config.ts
  auth/signin.ts
  auth/teacher-mode.ts
  reviews/teacher-review.ts
  analytics/time-analytics.ts
  cartridges/cartridge-ui.ts
  cartridges/load-cartridge.ts
  progression/teacher-overrides.ts
  media/animation-controls.ts
  media/video-source.ts
  realtime/ws.ts
  realtime/webrtc.ts
  ui/header.ts
  ui/modals.ts
```

Why this fits:

- the app already has clear section seams (`platform/app.html:1044-5734`)
- the non-UI cartridge contract already sits behind `CartridgeLoader` (`platform/core/cartridge-loader.js:63-144`, `190-200`)
- there are already 55 supporting modules to import from

Of the 40 core JS modules, about 15 are already non-DOM and are close to mechanical `.js -> .ts` migration. The remaining 25 core modules are DOM-heavy and would need real DOM/nullability typing work. Vite can support incremental TypeScript migration with a new `tsconfig.json` and `allowJs: true`; the repo already runs Vite and Vitest without framework plugins (`package.json`, `vite.config.js:234-258`).

| Criterion | Vanilla + TS | SolidJS | Svelte 5 | Preact | Rust/WASM | React / Next |
| --- | --- | --- | --- | --- | --- | --- |
| Runtime tax | 5 - no new runtime | 4 - low | 4 - low | 4 - low | 2 - JS bridge still needed | 3 - highest client tax here |
| Migration fit | 5 - direct split of current sections | 3 - UI rewrite layer needed | 3 - `.svelte` rewrite layer needed | 3 - JSX rewrite layer needed | 1 - bridge + rewrite | 2 - biggest rewrite surface |
| Cartridge compatibility | 5 - unchanged | 5 - keep `CartridgeLoader` | 5 - keep `CartridgeLoader` | 5 - keep `CartridgeLoader` | 2 - only through JS host shell | 5 - keep `CartridgeLoader` |
| Test preservation | 5 - most tests survive | 3 - component tests added later | 3 - component tests added later | 3 - component tests added later | 1 - low reuse | 3 - Vitest survives, UI tests churn |
| Deployment fit | 5 - no change | 4 | 4 | 4 | 3 - deployable, but overbuilt | 4 |
| Offline/LAN fit | 5 - preserve current Vite dev flow | 4 | 4 | 4 | 2 - browser and JS cartridge bridge complicate it | 3 |
| Overall fit | 5 | 3 | 3 | 3 | 1 | 2 |

Repo-specific notes:

- SolidJS: viable if a component model is eventually wanted, but it does not solve the current server-detect or teacher-cache bug. Cartridge loading can stay unchanged because `CartridgeLoader` already uses browser runtime `import()` (`platform/core/cartridge-loader.js:190-200`).
- Svelte 5: same compatibility story as Solid, but it adds a new file format and Vite plugin surface. That is a large migration for a repo whose current problem is central orchestration, not template syntax.
- Preact: the most credible "small framework" option. It is small enough to avoid a React-scale tax, and signals would map naturally to some of the module-scope state. Even so, moving now would still be a rendering-layer rewrite before the state model is cleaned up.
- React / Next: most familiar ecosystem, least justified here. SSR does not help much because the first problem is generated client-side, graph rendering is client-side canvas, and the current runtime already assumes a browser-first `Platform.init()` (`platform/platform.js:56-70`) plus client cartridge fetch/import (`platform/core/cartridge-loader.js:63-144`, `190-200`).
- Rust/WASM: not justified. `graph-engine.js` is canvas/DOM work, `game-engine.js` is stateful JS orchestration, and `grading-engine.js` is mostly rule execution plus optional network AI. WASM cannot remove the DOM-heavy parts, and it cannot preserve the plain JS cartridge contract without a JS host layer.

### 4B. Backend Matrix

| Criterion | Express + TS | Rust / Axum | Hono | Fastify |
| --- | --- | --- | --- | --- |
| Migration fit | 5 - route/file split only | 1 - full rewrite | 3 - medium rewrite | 4 - moderate rewrite |
| WebSocket fit | 5 - current pattern already works | 4 | 3 - fine on Node, not a Vercel-for-free win | 4 |
| Supabase fit | 5 - same client code | 3 - retool auth/query layer | 4 | 5 |
| Performance fit to repo | 5 - enough for I/O-bound server | 2 - little practical gain | 4 | 4 |
| Ability to eliminate Railway | 1 - no | 1 - no practical reason | 1 - not with current presence/signaling needs | 1 - no |
| Overall fit | 5 | 1 | 3 | 4 |

Repo-specific conclusions:

- Express + TypeScript is the clear recommendation. Most of the 57 routes are simple request DTO -> Supabase query -> JSON response handlers, so route splitting and typing get most of the maintainability value without deployment churn.
- Rust / Axum is technically deployable on Railway, but the app server is not CPU-bound enough to justify it.
- Hono is attractive as a smaller HTTP layer, but it does not solve the current WebSocket dependency and does not eliminate Railway in this architecture.
- Fastify is a reasonable later optimization, but it is not a better first step than "split `server.js` and type it."

### 4C. Hybrid Options

- WASM hot paths only: only worth revisiting after profiling. The current likely hotspots are canvas rendering and Ghost battle simulation, but neither is obviously dominating end-to-end latency.
- Island architecture: possible later. Teacher review, time analytics, and settings are good island candidates because they are UI islands around already-modular data sources.
- Incremental TypeScript migration: high-confidence, low-risk, and directly compatible with the current Vite/Vitest setup.

## 5. Cartridge Interface Compatibility

The cartridge contract is already nicely isolated and should not be changed.

Current loading mechanism:

- manifest JSON via `fetch` (`platform/core/cartridge-loader.js:70-73`)
- contexts JSON via `fetch` (`platform/core/cartridge-loader.js:77-100`)
- `generator.js` via dynamic runtime `import()` (`platform/core/cartridge-loader.js:102-107`, `190-200`)
- grading rules via dynamic `import()` if JS or `fetch` if JSON (`platform/core/cartridge-loader.js:109-124`)
- AI prompt via text fetch (`platform/core/cartridge-loader.js:126-137`)
- all four cartridge payloads are awaited in parallel via `Promise.all()` (`platform/core/cartridge-loader.js:139-144`)

Sample generator findings:

- `cartridges/lsrl-interpretation/generator.js:9-171` exports `generateProblem()` and uses `Math.random()`, but no DOM globals
- `cartridges/apstats-u5-sampling-dist/generator.js:30` keeps a module-level `shuffleBags` object, which is important for migration risk
- a repo-wide scan over `cartridges/**/generator.js` found `Math.random()` in many generators, but no evidence of `document`, `window`, `localStorage`, `fetch`, or `postMessage`

Sample grading-rule findings:

- `cartridges/lsrl-interpretation/grading-rules.js:9-326` exports rule functions only
- `cartridges/apstats-u5-sampling-dist/grading-rules.js:37-2357` exports rule helpers only
- a repo-wide scan over `cartridges/**/grading-rules.js` found no DOM or browser-global usage

Compatibility conclusion:

- Vanilla + TS, Solid, Svelte, Preact, and React can all preserve the current cartridge contract as long as `CartridgeLoader` or an equivalent JS bridge remains intact.
- Rust/WASM cannot realistically become the primary cartridge host without a JS interop shell, because the cartridges are plain JS modules loaded at runtime.

Worker-isolation feasibility:

- Possible in principle for some generators and grading rules
- Not a trivial drop-in today because `CartridgeLoader` expects direct module imports (`platform/core/cartridge-loader.js:190-200`)
- Some generators keep module-level state, such as `shuffleBags` in `apstats-u5-sampling-dist/generator.js:30`, so per-call worker isolation would change behavior unless workers remain warm and stateful

So workerization is an optimization experiment, not a first refactor milestone.

## 6. State Management Audit

The state model is the other major architectural problem after the monolith layout.

There are 33 top-level mutable `let` variables in `app.html` (`platform/app.html:1024-4052`). They mix:

- network state: `SERVER_URL`, `SIGNALING_URL`, `_serverDetected`, `webrtcManager`, `p2pAssetTransfer`
- user/teacher state: `isTeacher`, `teacherPassword`, `pendingTeacherReview`, `activeReviewId`
- cartridge/navigation state: `platform`, `currentCartridgeId`, `pendingUrlState`, `requestedStartLevel`, `pendingLockedLevel`
- UI state: `aiFeedbackPanel`, `rosterModal`, `ghostPanel`, `currentReviewFilter`, `teacherAlertActive`, `currentTimePeriod`
- ghost/session/media state: `ghostSession*`, `ghostOrbitsController`, `globalMusicPlayer`

State duplication is widespread:

| Concern | In-memory state | Persistent duplicate |
| --- | --- | --- |
| Current user | `userSystem.currentUser` | IndexedDB/localStorage identity (`platform/core/user-system.js:145-217`) |
| Teacher mode | `isTeacher`, `teacherPassword` | `userSystem` meta `teacherMode` in Dexie/localStorage (`platform/app.html:3013-3014`, `3099`, `platform/core/user-system.js:362-376`) |
| Cartridge selection | `currentCartridgeId` | `localStorage.lastCartridgeId` (`platform/app.html:1390`, `3581-3582`, `5551-5554`) |
| AI/video settings | local DOM + module vars | `localStorage` (`platform/app.html:2801-2817`, `2918-2938`) |
| Sync queue | `SyncQueue` in memory | `localStorage` queue persistence (`platform/core/sync-queue.js:131-157`) |
| Asset cache | in-memory blob URLs | Cache API (`platform/core/asset-cache.js:21-23`, `93-124`) |
| Progress | `platform.gameEngine` state | Supabase progress + restore APIs (`platform/app.html:4613-4644`, `4720-4737`) |

Representative state flow, "student submits answer":

1. UI click handler sets `currentGradingLevel`, updates indicators, and calls `platform.grade()` (`platform/app.html:5191-5198`).
2. `Platform.grade()` gathers answers, runs grading, records the result in `gameEngine`, and fires `onGradingComplete` and `onStateChange` (`platform/platform.js:297-512`).
3. `onStateChange` updates stars/streaks/rank DOM (`platform/app.html:4446-4453`).
4. `onGradingComplete` updates grading UI, mutates ghost session state, optionally submits teacher review, persists progress, updates queue state, triggers WebSocket notifications, syncs cartridge totals, and toggles next/try-again buttons (`platform/app.html:4464-4694`).
5. On success, async server sync happens through `syncQueue.syncFetch('/api/progress')` plus `syncCartridgeProgress()` (`platform/app.html:4613-4644`).

That is not a unidirectional store. It is callback-heavy shared-state orchestration across `app.html`, `Platform`, `GameEngine`, `UserSystem`, `TimeTracker`, `SyncQueue`, localStorage, IndexedDB, Cache API, and server fetches.

Session-scoped state:

- `pendingTeacherReview`
- `lastGradingResults`
- `activeReviewId`
- `teacherAlertActive`
- `pendingReviewsCache`
- `ghostSessionStart`, `ghostProblemsThisSession`, `ghostSessionCorrect`, `ghostProblemHistory`
- `platform` and most modal instances

Persistent state:

- user identity and teacher-mode metadata (`platform/core/user-system.js:145-217`, `362-376`)
- selected cartridge (`platform/app.html:1390`, `3581-3582`, `5551-5554`)
- AI/video/provider settings (`platform/app.html:2801-2817`, `2918-2938`)
- sync queue (`platform/core/sync-queue.js:131-157`)
- asset cache (`platform/core/asset-cache.js:21-23`, `93-124`)

## 7. Test Migration Assessment

The test story is better than the prompt implies.

Test file counts:

| Folder | Count |
| --- | ---: |
| `tests/core/` | 29 |
| `tests/grading/` | 6 |
| `tests/generators/` | 5 |
| `tests/server/` | 13 |
| `tests/game/` | 3 |
| root `tests/` | 2 |
| Total | 58 |

Practical split:

- 45 client/module/pure-logic-ish files outside `tests/server/`
- 13 server/integration-ish files under `tests/server/`

Important result: no tests import `platform/app.html` as a JS module.

What does exist:

- `tests/core/escape-key-handler.test.js:8-13` reads `platform/app.html` as text for static assertions
- `tests/core/student-detail-modal.test.js:10-15` does the same
- `tests/core/star-award-consistency.test.js:14-19` does the same

So a modular refactor preserves most tests, but a few static-HTML tests would need updating if markup moves out of `app.html`.

Representative direct-module imports that survive a split:

- `tests/core/game-engine.test.js` -> `platform/core/game-engine.js`
- `tests/core/webrtc-manager.test.js` -> `platform/core/webrtc-manager.js`
- `tests/deep-link-roundtrip.test.js` -> `platform/platform.js`, `platform/core/game-engine.js`, `platform/core/url-state.js`

Representative test-to-code ratios:

| Module | Source lines | Test lines | Ratio |
| --- | ---: | ---: | ---: |
| `platform/core/ai-feedback-panel.js` | 213 | 1126 | 5.29 |
| `platform/core/game-engine.js` | 528 | 1783 | 3.38 |
| `platform/core/ghost-engine.js` | 22 | 205 | 9.32 |
| `platform/core/webrtc-manager.js` | 463 | 603 | 1.30 |
| `platform/core/ghost-battle-engine.js` | 551 | 630 | 1.14 |
| `platform/core/leaderboard.js` | 338 | 359 | 1.06 |
| `platform/core/asset-resolver.js` | 280 | 203 | 0.72 |
| `platform/game/trails-mode.js` | 1564 | 1022 | 0.65 |
| `platform/game/blizzard-mode.js` | 982 | 721 | 0.73 |
| `platform/core/p2p-asset-transfer.js` | 474 | 282 | 0.59 |

Test migration takeaway:

- Vanilla modularization + TypeScript keeps the highest amount of existing value.
- A framework rewrite does not destroy the pure logic tests, but it does not help them either.
- The fragile part of the suite is not logic coverage; it is the handful of text-based `app.html` structure tests.

## 8. Risk Assessment

| Option | Incremental? | Test risk | Rollback | Cartridge impact |
| --- | --- | --- | --- | --- |
| Vanilla + TS frontend | Yes | Low | Easy file-by-file rollback | None |
| SolidJS frontend | Partial | Medium | Keep old shell while islands migrate | None if `CartridgeLoader` stays |
| Svelte 5 frontend | Partial | Medium | Keep old shell while islands migrate | None if `CartridgeLoader` stays |
| Preact frontend | Partial | Medium | Keep old shell while islands migrate | None if `CartridgeLoader` stays |
| React / Next frontend | Partial but heavy | Medium-high | Harder because routing/render shell changes | None if `CartridgeLoader` stays |
| Rust/WASM frontend | No practical incremental path | High | Hard | Only possible with JS bridge; no cartridge file changes, but architecture becomes much more complex |
| Express + TS backend | Yes | Low | Easy route-by-route rollback | None |
| Fastify backend | Partial | Medium | Moderate | None |
| Hono backend | Partial | Medium | Moderate | None |
| Rust / Axum backend | No practical incremental path | High | Hard | None |

Student impact:

- Frontend modularization and TS can ship gradually with almost no user-visible migration.
- Framework rewrites increase regression surface in teacher tools, multiplayer, and cartridge rendering.
- Backend rewrites create the highest risk around presence, sync, and teacher review flows because those are production stateful endpoints, not static pages.

## 9. Recommendations

### Critical Decision: Question 3

Yes. Breaking `app.html` into modules, adding TypeScript incrementally, and fixing the degraded-network teacher UI bug will get at least 80% of the value.

Why that answer is justified by the repo data:

- the main problem is orchestration and shared state, not a missing component library: 35 sections, 103 top-level functions, 33 mutable top-level `let`s, and 422 DOM queries in one file
- the supporting module layer is already real: 55 JS modules, no `platform/core` cycles, and many tested logic modules
- the backend is mostly I/O-bound Supabase + AI proxy work, so Rust is a poor primary investment
- the degraded-network bug is a local control-flow/config bug in `app.html` and `user-system.js`, not a rendering-framework limitation

Direct answers to the prompt's sub-questions:

- How many top-level `let` variables could be extracted? All 33 can be moved out of `app.html`; only about 6-8 should remain shared cross-module state, and the rest should become module-private state or class fields.
- How many inline functions can be extracted without changing signatures? Roughly 85+ of the 103. The exceptions are the orchestration hubs (`loadCartridge`, `init`, `applyTeacherGrades`, `renderModeTabs`, `updateScenarioDisplay`) that should be dependency-injected rather than moved verbatim.
- Would TypeScript catch real bugs? Yes, especially around nullable DOM lookups, API payloads, and config objects. But TypeScript alone would not catch the teacher-cache control-flow bug or the captured-vs-live URL split. The main issue is architecture first, types second.
- Does the degraded-network bug need a framework change? No. It is a small application fix, roughly 20-40 lines across `detectServer()`, `checkTeacherModePersistence()`, and optionally the offline teacher-role recovery path.

### Primary Recommendation

Primary recommendation:

1. Keep the current Vite + vanilla JS architecture.
2. Split `platform/app.html` into plain ES modules around teacher mode, cartridge loading, settings, analytics, and realtime.
3. Add TypeScript incrementally after the split starts.
4. Keep the current Express backend and type/split it later.
5. Do not pursue Rust/WASM as the primary refactor.

If a UI framework is still wanted after that work, re-evaluate Preact or Solid as an island layer, not as the first move.

### Migration Path

Phase 1: fix the active bug and create a single network config module

- move `SERVER_URL`, `SIGNALING_URL`, and `detectServer()` out of `app.html`
- make teacher-mode restore cache-first
- gate local signaling fallback to local-dev hosts only
- add a regression test around teacher-mode recovery under fetch failure

Phase 2: split the monolith by responsibility

- `auth/teacher-mode`
- `reviews/teacher-review`
- `analytics/time-analytics`
- `cartridges/load-cartridge`
- `realtime/ws`
- `realtime/webrtc`
- `media/animation-controls`

Phase 3: add TypeScript where it buys safety first

- network config and API payload types
- teacher review / progression override payloads
- `user-system`, `websocket-client`, `webrtc-manager`, `cartridge-loader`, `asset-resolver`

Phase 4: optionally componentize isolated panels

- settings modal
- teacher review panel
- time analytics panel

### Quick Wins

- Fix `checkTeacherModePersistence()` to restore from cache before revalidation.
- Fix `detectServer()` so secure production pages never downgrade to insecure same-host HTTP/WS.
- Bump the 1000 ms server-detect threshold and retry once before fallback.
- Remove or use `_serverDetected`; right now it is dead state.
- Move progression override fetch and cloud restore off the first-problem critical path where possible.
- Add `tsconfig.json` with incremental migration settings and start with `allowJs: true`.

## Appendix

### A. app.html Section Map

| Section | Lines |
| --- | --- |
| CONFIGURATION | 1044-1075 |
| GHOST SYSTEM | 1076-1150 |
| VERSION CHECK | 1151-1215 |
| INITIALIZE MODULES | 1216-1431 |
| GHOST PANEL INTEGRATION | 1432-1461 |
| GHOST ORBITS INTEGRATION | 1462-1670 |
| RESPONSIVE LAYOUT | 1671-1699 |
| UI UPDATES | 1700-1988 |
| GRADING STATUS | 1989-2265 |
| USERNAME MODAL | 2266-2471 |
| KEYBOARD SUPPORT FOR USERNAME MODAL | 2472-2520 |
| GLOBAL ESCAPE KEY HANDLER | 2521-2600 |
| SHARE MODAL | 2601-2623 |
| LEVEL SELECTOR BAR | 2624-2640 |
| LOCKED LEVEL MODAL | 2641-2647 |
| STUDENT DETAIL MODAL | 2648-2657 |
| SETTINGS MODAL | 2658-2675 |
| BACKGROUND MUSIC SETTINGS | 2676-2960 |
| GRADING ESCALATION SYSTEM | 2961-3003 |
| TEACHER LOGIN | 3004-3151 |
| LEADERBOARD | 3152-3166 |
| ONLINE DROPDOWN | 3167-3177 |
| TEACHER REVIEW PANEL | 3178-3269 |
| TEACHER ALERT SYSTEM | 3270-3308 |
| TIME ANALYTICS PANEL | 3309-3428 |
| CARTRIDGE LOADING UI | 3429-3966 |
| LOAD CARTRIDGE | 3967-4939 |
| TEACHER PROGRESSION CONTROLS | 4940-5117 |
| ANIMATION CONTROLS | 5118-5189 |
| ACTION BUTTONS | 5190-5275 |
| WEBRTC FUNCTIONS | 5276-5368 |
| AI APPEAL HANDLERS | 5369-5474 |
| INIT | 5475-5622 |
| CONSOLE COMMANDS | 5623-5682 |
| WEBRTC EVENT LISTENERS | 5683-5734 |

### B. Module-Level State Inventory

| Variable | Line | Initial value | Category |
| --- | ---: | --- | --- |
| `RosterModal` | 1024 | `null` | lazy module handle |
| `GhostPanel` | 1028 | `null` | lazy module handle |
| `WebRTCManager` | 1035 | `null` | lazy module handle |
| `P2PAssetTransfer` | 1040 | `null` | lazy module handle |
| `SERVER_URL` | 1045 | `'https://lrsl-driller-production.up.railway.app'` | network state |
| `SIGNALING_URL` | 1046 | `null` | network state |
| `_serverDetected` | 1050 | `false` | network state / dead flag |
| `ghostSessionStart` | 1087 | `Date.now()` | ghost session state |
| `ghostProblemsThisSession` | 1088 | `0` | ghost session state |
| `ghostSessionCorrect` | 1089 | `0` | ghost session state |
| `ghostProblemHistory` | 1090 | `[]` | ghost session state |
| `webrtcManager` | 1378 | `null` | network/UI state |
| `p2pAssetTransfer` | 1387 | `null` | network/cache state |
| `platform` | 1389 | `null` | platform runtime state |
| `currentCartridgeId` | 1390 | `localStorage.getItem('lastCartridgeId') || 'lsrl-interpretation'` | persistent cartridge state |
| `pendingTeacherReview` | 1391 | `null` | teacher review state |
| `aiFeedbackPanel` | 1392 | `null` | UI state |
| `rosterModal` | 1393 | `null` | UI/network state |
| `pendingUrlState` | 1394 | `null` | URL/navigation state |
| `requestedStartLevel` | 1395 | `null` | URL/navigation state |
| `ghostPanel` | 1396 | `null` | UI state |
| `ghostOrbitsController` | 1464 | `null` | game/UI state |
| `globalMusicPlayer` | 2678 | `null` | settings/media state |
| `currentGradingLevel` | 2963 | `'algorithm'` | grading flow state |
| `lastGradingResults` | 2964 | `null` | grading flow state |
| `isTeacher` | 3005 | `false` | user/role state |
| `teacherPassword` | 3006 | `null` | user/role state |
| `currentReviewFilter` | 3179 | `'pending'` | teacher review UI state |
| `pendingReviewsCache` | 3180 | `[]` | teacher review data state |
| `teacherAlertActive` | 3181 | `false` | teacher alert UI state |
| `currentTimePeriod` | 3310 | `'today'` | analytics filter state |
| `activeReviewId` | 3821 | `null` | teacher review workflow state |
| `pendingLockedLevel` | 4052 | `null` | navigation/UI state |

### C. Full Module Table (core + game)

| File | Lines | Imports | Exports | DOM-coupled | Test files |
| --- | ---: | ---: | ---: | --- | ---: |
| `platform/core/ai-feedback-panel.js` | 213 | 0 | 5 | yes | 2 |
| `platform/core/asset-cache.js` | 155 | 0 | 2 | no | 3 |
| `platform/core/asset-resolver.js` | 280 | 1 | 2 | no | 1 |
| `platform/core/cartridge-loader.js` | 307 | 0 | 2 | yes | 0 |
| `platform/core/celebration.js` | 337 | 0 | 3 | yes | 1 |
| `platform/core/class-time.js` | 195 | 0 | 3 | no | 0 |
| `platform/core/game-engine.js` | 528 | 1 | 2 | yes | 6 |
| `platform/core/ghost-battle-engine.js` | 551 | 1 | 19 | no | 1 |
| `platform/core/ghost-battle-viz.js` | 991 | 0 | 8 | yes | 1 |
| `platform/core/ghost-engine.js` | 22 | 0 | 15 | no | 1 |
| `platform/core/ghost-maze-generator.js` | 399 | 0 | 9 | no | 1 |
| `platform/core/ghost-maze-renderer.js` | 2069 | 3 | 12 | yes | 2 |
| `platform/core/ghost-network.js` | 158 | 0 | 7 | no | 1 |
| `platform/core/ghost-orbits-ai.js` | 680 | 2 | 1 | no | 0 |
| `platform/core/ghost-orbits-audio.js` | 660 | 0 | 1 | yes | 0 |
| `platform/core/ghost-orbits-dots.js` | 655 | 0 | 1 | yes | 0 |
| `platform/core/ghost-orbits-nn-mapper.js` | 805 | 0 | 15 | yes | 1 |
| `platform/core/ghost-orbits-physics.js` | 616 | 0 | 1 | no | 0 |
| `platform/core/ghost-orbits-renderer.js` | 2699 | 0 | 1 | yes | 0 |
| `platform/core/ghost-orbits-territory.js` | 925 | 0 | 11 | no | 0 |
| `platform/core/ghost-terrain-renderer.js` | 707 | 3 | 2 | yes | 1 |
| `platform/core/grading-engine.js` | 338 | 0 | 2 | no | 0 |
| `platform/core/graph-engine.js` | 2348 | 0 | 2 | yes | 0 |
| `platform/core/input-renderer.js` | 701 | 0 | 2 | yes | 0 |
| `platform/core/leaderboard.js` | 338 | 1 | 3 | yes | 1 |
| `platform/core/orbits-mode-interface.js` | 214 | 0 | 2 | yes | 0 |
| `platform/core/p2p-asset-transfer.js` | 474 | 1 | 2 | no | 1 |
| `platform/core/radical-complex-game.js` | 671 | 0 | 2 | yes | 0 |
| `platform/core/radical-game.js` | 315 | 0 | 2 | yes | 0 |
| `platform/core/radical-prime-game.js` | 542 | 0 | 2 | yes | 0 |
| `platform/core/radical-visualizer.js` | 643 | 0 | 2 | yes | 0 |
| `platform/core/roster-modal.js` | 581 | 0 | 1 | yes | 0 |
| `platform/core/shuffle-bag.js` | 208 | 0 | 3 | no | 1 |
| `platform/core/sound-engine.js` | 257 | 0 | 3 | yes | 0 |
| `platform/core/sync-queue.js` | 411 | 0 | 1 | yes | 1 |
| `platform/core/time-tracker.js` | 330 | 0 | 2 | yes | 0 |
| `platform/core/url-state.js` | 308 | 0 | 9 | yes | 2 |
| `platform/core/user-system.js` | 383 | 1 | 10 | yes | 0 |
| `platform/core/webrtc-manager.js` | 463 | 0 | 2 | no | 1 |
| `platform/core/websocket-client.js` | 361 | 3 | 3 | no | 0 |
| `platform/game/arena-mode.js` | 1186 | 3 | 2 | yes | 0 |
| `platform/game/blizzard-ai.js` | 496 | 0 | 2 | no | 1 |
| `platform/game/blizzard-mode.js` | 982 | 3 | 3 | yes | 1 |
| `platform/game/ghost-orbits-controller.js` | 3297 | 12 | 3 | yes | 0 |
| `platform/game/ghost-orbits-panel.js` | 2396 | 0 | 2 | yes | 0 |
| `platform/game/ghost-orbits-shadow-ai.js` | 1050 | 1 | 4 | no | 0 |
| `platform/game/ghost-panel.js` | 3692 | 8 | 3 | yes | 0 |
| `platform/game/multiplayer-game-client.js` | 677 | 2 | 2 | yes | 0 |
| `platform/game/multiplayer-panel.js` | 560 | 0 | 2 | yes | 0 |
| `platform/game/multiplayer-renderer.js` | 700 | 0 | 2 | yes | 0 |
| `platform/game/orbits-lobby.js` | 1787 | 1 | 3 | yes | 0 |
| `platform/game/orbits-maps.js` | 211 | 0 | 8 | no | 1 |
| `platform/game/orbits-network-controller.js` | 862 | 0 | 4 | yes | 0 |
| `platform/game/trails-ai.js` | 416 | 0 | 2 | no | 1 |
| `platform/game/trails-mode.js` | 1564 | 2 | 3 | yes | 1 |

### D. Bundle Analysis Raw Output

```text
vite v5.4.21 building for production...
transforming...
OK 44 modules transformed.
rendering chunks...
computing gzip size...
dist/assets/registry-D0gEbrYj.json                5.34 kB | gzip:   1.61 kB
dist/standalone/math-viz/index.html              17.73 kB | gzip:   3.95 kB
dist/index.html                                  32.91 kB | gzip:   8.37 kB
dist/platform/app.html                           60.06 kB | gzip:  12.70 kB
dist/assets/app-DW_caR8Q.css                     65.17 kB | gzip:  11.42 kB
dist/assets/modulepreload-polyfill-B5Qt9EMX.js    0.71 kB | gzip:   0.40 kB
dist/assets/ghost-orbits-audio-DQomeCUK.js        6.60 kB | gzip:   2.03 kB
dist/assets/webrtc-manager-DPRq5c4_.js            6.73 kB | gzip:   2.00 kB
dist/assets/p2p-asset-transfer-BfB-BHkW.js        6.87 kB | gzip:   2.23 kB
dist/assets/radical-game-BM4q4pzB.js              8.24 kB | gzip:   2.48 kB
dist/assets/radical-prime-game-BntBtVZ6.js       12.27 kB | gzip:   3.35 kB
dist/assets/roster-modal-DT2O9To3.js             14.35 kB | gzip:   3.98 kB
dist/assets/radical-complex-game-_3k8bcQH.js     15.12 kB | gzip:   3.82 kB
dist/assets/graph-BNHQkv6R.js                    34.77 kB | gzip:   9.67 kB
dist/assets/app-Cm_FZh7Z.js                     301.48 kB | gzip:  88.60 kB
dist/assets/mathViz-9nhjPpdx.js                 559.02 kB | gzip: 140.42 kB

(!) Some chunks are larger than 500 kB after minification.
OK built in 3.51s
Copied cartridges/ to dist/cartridges/
Copied audio/ to dist/audio/
```

### E. Endpoint Inventory

| Method | Route | Line |
| --- | --- | ---: |
| GET | `/` | 120 |
| GET | `/api/version` | 125 |
| GET | `/api/users` | 137 |
| POST | `/api/users` | 154 |
| POST | `/api/users/verify` | 192 |
| GET | `/api/users/:username/stars` | 227 |
| POST | `/api/auth/teacher` | 265 |
| POST | `/api/progress` | 286 |
| GET | `/api/progress/:username` | 418 |
| GET | `/api/progress/:username/stats` | 437 |
| POST | `/api/progress/:username/sync` | 487 |
| POST | `/api/progress/cartridge-sync` | 571 |
| GET | `/api/progress/cartridge/:username/:cartridgeId` | 644 |
| GET | `/api/leaderboard` | 671 |
| GET | `/api/leaderboard/unified` | 749 |
| GET | `/api/settings/:username` | 832 |
| POST | `/api/settings/:username` | 868 |
| GET | `/api/ai/status` | 1831 |
| POST | `/api/ai/contribute-key` | 1841 |
| POST | `/api/ai/grade` | 1894 |
| POST | `/api/ai/grade-paragraph` | 1916 |
| POST | `/api/ai/appeal` | 1964 |
| POST | `/api/teacher-review` | 2051 |
| GET | `/api/teacher-review` | 2110 |
| PUT | `/api/teacher-review/:id` | 2163 |
| GET | `/api/teacher-review/student/:username` | 2209 |
| POST | `/api/time-tracking/session` | 2238 |
| POST | `/api/time-tracking/problem` | 2280 |
| GET | `/api/time-tracking/user/:username` | 2320 |
| GET | `/api/time-tracking/class-summary` | 2397 |
| GET | `/api/roster` | 2486 |
| PUT | `/api/roster/:username` | 2510 |
| POST | `/api/roster/bulk-assign` | 2558 |
| GET | `/api/progression-overrides/:cartridgeId` | 2626 |
| PUT | `/api/progression-overrides/:cartridgeId/:modeId` | 2653 |
| DELETE | `/api/progression-overrides/:cartridgeId/:modeId` | 2703 |
| DELETE | `/api/progression-overrides/:cartridgeId` | 2738 |
| POST | `/api/ghost/:cartridgeId/sync` | 2776 |
| GET | `/api/ghost/:cartridgeId/leaderboard` | 2818 |
| GET | `/api/ghost/:cartridgeId/:username` | 2856 |
| POST | `/api/ghost/:cartridgeId/battle/challenge` | 3064 |
| GET | `/api/ghost/:cartridgeId/battle/history/:username` | 3264 |
| GET | `/api/ghost/:cartridgeId/battle/rating/:username` | 3287 |
| GET | `/api/ghost/:cartridgeId/battle/leaderboard` | 3328 |
| GET | `/api/ghost/:cartridgeId/battle/:battleId` | 3376 |
| GET | `/api/ghost-orbits/config` | 4137 |
| GET | `/api/ghost-orbits/arenas` | 4145 |
| GET | `/api/ghost-orbits/:cartridgeId/:periodId/state` | 4151 |
| POST | `/api/ghost-orbits/:cartridgeId/:periodId/join` | 4163 |
| POST | `/api/ghost-orbits/:cartridgeId/:periodId/leave` | 4193 |
| POST | `/api/ghost-orbits/:cartridgeId/:periodId/earned-star` | 4207 |
| DELETE | `/api/ghost-orbits/:cartridgeId/:periodId` | 4221 |
| GET | `/api/ghost-orbits/multiplayer/rooms` | 4242 |
| GET | `/api/ghost-orbits/multiplayer/config` | 4248 |
| POST | `/api/ghost-orbits/multiplayer/create` | 4253 |
| POST | `/api/ghost-orbits/multiplayer/join` | 4275 |
| GET | `/api/ghost-orbits/multiplayer/room/:roomCode` | 4297 |
