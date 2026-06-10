# Mothball Hardening Spec — lrsl-driller

**Status: SIGNED OFF 2026-06-10.** Teacher decisions: **D1** strip names/keep usernames public · **D2** keep plaintext passwords, documented as accepted · **D3** archive everything, delete all 111 users · **D4** hard cutover to roster at revival · **D5** reconcile cartridges now, AP-Stats-only ledger · **D6** keep `stats123` as the teacher password (fallbacks removed from code; env var unchanged — residual risk accepted: the value is public in repo history, so teacher routes are effectively open; mitigated by D3 emptying the table, D1 stripping PII, and rate limiting).

Date: 2026-06-10. All facts below were re-verified this session against the repo, the live Railway service, and the live Supabase project. This app is a **dormant backup for SY26-27**: not in active use, revived mid-year only if needed. Mission = make it safe to leave running unattended, tidy the data, pin the baseline.

---

## 0. Deploy reality (verified, governs all work)

- **Railway auto-deploys `main`.** Service `lrsl-driller` in project `thorough-spontaneity` builds from GitHub `robjohncolson/lrsl-driller`, branch `main`, root `/railway-server` (verified via `railway status --json`). **Every push to main is a live API deploy.** All server changes go on a branch; merge only after sign-off + green local tests.
- **The GitHub repo is PUBLIC.** Anything in source is published.
- Vercel serves the frontend (`lrsl-driller.vercel.app`, 307 → `/platform/app.html`); `.vercel/project.json` proves a CLI link. Assume push-to-main also redeploys Vercel.
- Railway env (verified by name): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `TEACHER_PASSWORD` (8 chars — **equals `stats123`**, see H1), `GEMINI_API_KEY`. No `GROQ_API_KEY`, no `GRADING_PROXY_URL` (code falls back to `https://shared-grading-proxy-production.up.railway.app`, server.js:18).
- Second service in the same Railway project: `shared-grading-proxy` (other apps use it too — out of scope here, but the driller's `/api/ai/*` routes relay to it unauthenticated, see H6).

**Live dependents that must keep working** (all consumption verified by reading their source):

| Consumer | Endpoints | Fields that matter | Break tolerance |
|---|---|---|---|
| tmux-trainer (Vercel, roster migration NOT shipped — still 100 % on this backend) | `POST /api/users/verify`, `GET /api/users`, `POST /api/progress/cartridge-sync`, `GET /api/progress/cartridge/:u/:c`, `GET /api/progress/leaderboard/td-*` | `valid`, `username`, `found`, `mode_progress` (snake_case), `gold_stars`/`silver_stars`; `real_name` is display-only with username fallback | Removing `real_name` = graceful. Requiring auth on any of these = breaks login/leaderboard/sync. Renaming `valid`→`ok` or `mode_progress`→`modeProgress` = silent breakage. Cloud-SRS pull mis-parse arms a full-replace push that can overwrite remote data — treat GET shapes as frozen. |
| follow-alongs "My Progress" (`ap_stats_roadmap_square_mode.html` ~12539+) | `GET /api/users`, `POST /api/users/verify`, `GET /api/users/:u/stars`, `GET /api/progress/:u`, `GET /api/progress/:u/stats` | `username` (login dropdown is the ONLY way to sign in), `valid`, progress star fields | Auth on `GET /api/users` = **hard break** (dropdown empties, no login). Auth on progress GETs = soft break (tabs silently show "no data"). `real_name` strip = cosmetic. `class_period` is read by NOTHING in follow-alongs. |
| follow-alongs study guide (`study_guide_diagnostic.html:551`, `data/study-guide-sync-config.js`) | `GET /api/users`, `POST /api/users/verify`, `POST /api/users` (self-signup) | `username`, `real_name` (label only), `valid`, `error` (signup retry regex matches `/exist|taken|dup/i`) | Same as above; also must keep accepting `real_name` in the create body, and keep duplicate-username error wording matching the regex. |
| This app's own frontend + Electron `local-server/` | full route surface; local-server is LAN-only WS (port 3001), does NOT call Railway | — | — |

GH Pages for follow-alongs serves repo `robjohncolson/apstats-live-worksheet`, branch `master` — the live copy is `Projects/school/follow-alongs` == `origin/master`.

---

## 1. Security findings (verified, with citations)

### Confirmed from the prompt
1. **Plaintext passwords by design** — `supabase_schema.sql` (`password TEXT NOT NULL -- plaintext ok…`); insert at `server.js:173-176`; literal compare at `server.js:210`; per-user settings auth re-compares plaintext via `x-password` header (`server.js:896,933`).
2. **Public PII** — `GET /api/users` (server.js:137) returns every student's `username + real_name + class_period`, unauthenticated. Live table: 111 rows (107 at session start + 4 created by this session's `npm test`, see H8).
3. **Hardcoded teacher fallback** — `server.js:17`: `process.env.TEACHER_PASSWORD || 'stats123'`.
4. **Silent account creation** — password `'auto-created'` in **two** places: `server.js:319-327` (`POST /api/progress`) and `server.js:586-593` (`POST /api/progress/cartridge-sync`). 24 such accounts exist live; the constant is in public source, so each is a known-password login.
5. **Service-role key** — server uses `SUPABASE_SERVICE_ROLE_KEY` (server.js:16); RLS is inert; every route is as trusted as its own code.

### New findings (this session)
6. **`TEACHER_PASSWORD` env var IS `stats123`** — the fallback removal alone fixes nothing; the value is published in a public repo. **Rotation required** (D6).
7. **The teacher password also ships in CLIENT source** — `app.html:3326, 3452, 3937, 4675` (`teacherPassword || 'stats123'`) and `user-system.js:111`, and is persisted plaintext client-side in Dexie meta `teacherMode` (written `app.html:3135`).
8. **Leaderboard endpoints also expose `real_name`** — `GET /api/progress/leaderboard/:cartridgeId` (server.js:671), `GET /api/leaderboard` (719), `GET /api/leaderboard/unified` (797). All consumers fall back to username gracefully.
9. **Unauthenticated per-student data GETs** — `GET /api/teacher-review/student/:username` (server.js:2257, returns any student's submitted work) and `GET /api/time-tracking/user/:username` (server.js:2368, comment says "teacher or self" but nothing enforces it).
10. **10 unauthenticated mutating routes** (of 60 total): `POST /api/users`, `POST /api/progress`, `POST /api/progress/:u/sync`, `POST /api/progress/cartridge-sync`, `POST /api/ai/contribute-key`, `POST /api/teacher-review`, `POST /api/time-tracking/session`, `POST /api/time-tracking/problem`, `POST /api/ghost/:c/sync`, `POST /api/ghost/:c/battle/challenge`. CORS fully open, zero rate limiting → unbounded junk-row accumulation while dormant.
11. **WebSocket layer has no auth at all** — `new WebSocketServer({server})` (server.js:52); `identify` (server.js:3626) sets username to whatever the client sends; any client can fire fake teacher `class_time_start/end` broadcasts or pose as the WebRTC teacher in signaling relay (server.js:3621-4105).
12. **Client offline-login bypass** — `user-system.js:249-277` treats fetch failure as success: server unreachable ⇒ ANY password logs in as ANY user. (Mothballing the server without fixing this makes the frontend strictly less safe.)
13. **Open AI relay** — `POST /api/ai/grade`, `/grade-paragraph`, `/appeal` (server.js:1942-2012) relay unauthenticated to the shared grading proxy (spends shared Gemini/Groq quota); `POST /api/ai/contribute-key` (1889) accepts keys into `api_keys_pool` with only a prefix-format check (pool currently holds 4 active groq + 1 inactive gemini key).
14. **Latent 500** — `DELETE /api/progression-overrides/:cartridgeId` (server.js:2786) calls undefined `broadcastToCartridge` at :2806; the delete succeeds, then the route 500s.
15. **`npm test` writes to PRODUCTION** — `tests/server/api.test.js:12`, `progress-restore.test.js:13`, `progress-sync-v2.1.test.js:11` default `SERVER_URL` to the live Railway URL and POST real progress + create `test-sync-*/test_restore_*/test_modes_*/test_timestamp_*` users. Verified: this session's baseline run grew the users table 107 → 111.
16. **Historical leak, low severity** — git history (commits 5b7f269→1a97c14, `scavenge/railway-server/server.js`) contains a Supabase **anon** key for a *different* project (`bzqbhtrurzzavhqbgqrs`, the roster/study-guide project). Anon keys are public-by-design; noted for awareness, no action here.
17. **Stale host** — `platform/teacher-map.html:462` points at `lsrl-driller-railway-production.up.railway.app` (transposed name), a dead host.

---

## 2. Hardening plan

Items marked **[STRICT WIN]** need no decision; items marked **[D*n*]** are gated on the teacher's answer.

### H1. Teacher password — [DECIDED D6: keep value, remove hardcoding]
- Remove the `|| 'stats123'` fallback (server.js:17); on missing env var, log fatal and `process.exit(1)`.
- Remove every client-side `|| 'stats123'` (app.html ×4, user-system.js:111).
- Stop persisting the teacher password in Dexie `teacherMode`; keep it in-memory per session (teacher re-types it after a reload).
- Use a timing-safe compare (`crypto.timingSafeEqual` on hashed buffers) for the teacher password check.
- ~~Rotate `TEACHER_PASSWORD`~~ — D6: teacher chose to keep the current value. Residual risk recorded in §0 status line.

### H2. Kill auto-create — [STRICT WIN]
- Delete both auto-create blocks (server.js:319-327, 586-593). Unknown username ⇒ `404 {error:'Unknown user'}` from `POST /api/progress` and `POST /api/progress/cartridge-sync`. tmux-trainer ignores the cartridge-sync response body, so an unknown user degrades to no-cloud-sync, which is the intended semantics.
- Cleanup of the 24 existing `'auto-created'` accounts is part of M1.

### H3. PII lockdown — [D1]
**Recommended option (a): strip names, keep usernames public.**
- `GET /api/users` returns `[{username}]` only. Usernames are pseudonymous `Fruit_Animal` handles — that convention is the privacy boundary, and three external login pickers depend on the username list.
- Strip `real_name` from the three leaderboard endpoints (consumers fall back to username).
- `POST /api/users/verify` keeps returning `real_name` (authenticated, own row only).
- Gate `GET /api/teacher-review/student/:username` and `GET /api/time-tracking/user/:username`: require `x-teacher-password` OR `x-password` matching the named user (verify only after confirming in-app consumers — the driller teacher modal sends the teacher header; follow-alongs does not call these two).
- UX cost: login dropdowns in all three apps show `Mango_Tiger` instead of `Maria (Mango_Tiger)`. Roster world already works this way.

Option (b): teacher-auth the entire `GET /api/users` — **rejected by analysis**: hard-breaks login for follow-alongs My Progress + study guide and tmux-trainer's picker/leaderboard fallback.

### H4. Password storage — [DECIDED D2: plaintext accepted]
Teacher chose to keep plaintext storage (classroom pedagogy app, passwords are throwaway fruit-animal credentials, teacher wants readable recovery). Documented as an accepted risk here and in README. No code change. Note: after D3 cleanup the table is empty, and at revival students authenticate via roster PINs (driller passwords stop mattering under D4 hard cutover).

### H5. Client identity persistence — [STRICT WIN]
- Stop persisting `identity.password` (student) — verified write-only dead weight (`user-system.js:242,270` writes; zero reads; auto-relogin keys off `identity.username` only). Strip the field on the next `setIdentity` so existing stored rows self-clean.
- Fix the offline-login bypass: fetch failure in `verifyUser` ⇒ `{valid:false, error:'Server unreachable'}`, NOT silent success.
- (Teacher password persistence handled in H1.)

### H6. Abuse surface while dormant — [STRICT WIN, scoped small]
- Add a tiny in-memory fixed-window rate limiter (no new deps) on mutating routes (300 req/min/IP — a whole classroom shares one school NAT IP at ~4-5 writes/min/student, so 60 was reviewed as insufficient) and 20 req/min/IP on the `/api/ai/*` grading relay. `POST /api/users/verify` and `POST /api/auth/teacher` are exempt (read-only auth checks; whole classes log in within one minute). IP is taken from the LAST `x-forwarded-for` entry (Railway-appended; first entry is client-spoofable).
- Disable `POST /api/ai/contribute-key` (`410 Gone`) — key intake while dormant is pure liability. Re-enable at revival if wanted.
- WS layer: leave functional (Ghost Orbits dormant anyway) but drop the fake-`teacher` vectors: `class_time_*` and WebRTC-teacher messages now require the teacher password in the message payload. Username `identify` impersonation accepted-as-is (progress writes don't flow through WS; documenting, not fixing).
- **Known limitations accepted at review** (all bounded by the WS layer being out of revival scope): (a) a teacher signed in via a `user_type='teacher'` ACCOUNT (rather than the teacher-password modal) has no in-memory teacher password, so teacher WS actions (class time, WebRTC) silently no-op for that path — enter teacher mode via password to use them; (b) the client does not yet surface the server's `TEACHER_AUTH_REQUIRED` WS error frame; (c) the server's own teacher-disconnect broadcast of `webrtc_deactivate` is unauthenticated and could be triggered by identify-impersonation — subsumed by the accepted `identify` risk.
- Fix the latent 500 (H-finding 14) — one-line: use the existing broadcast helper.

### H7. Test isolation — [STRICT WIN]
- The three live-server test files: default `SERVER_URL` to `http://localhost:3000` and auto-skip (vitest `describe.skipIf`) when the server isn't reachable, so `npm test` is green offline and NEVER writes to prod unless explicitly pointed there with `SERVER_URL=`.

### H8. Repo hygiene — [STRICT WIN]
- Fix `.gitignore` (corrupted UTF-16 `nul` bytes at EOF); add `state/` (holds PII snapshots + Railway var dumps used this session — must never be committed).
- Fix `teacher-map.html:462` stale host.

---

## 3. Mothball cleanup plan

### M1. Users-table cleanup — [D3 for scope + method]
Live inventory (2026-06-10): **111 users**; all predate SY26-27. Buckets:

| Bucket | Count | Examples | Note |
|---|---|---|---|
| Test noise | 31 | `test-sync-*`, `test_modes_*` (24 auto-created), `mrcolson` ×4, `bob`, `bbobby`, `testing_user`, `colsonmr` (Kiwi_Whale) | Includes 4 created by this session's test run |
| Prior-year, lettered period A/B/E/F | 38 | real students | SY25-26 cohort |
| Prior-year, null period, named | 37 | real students | same cohort, never set period |
| Anonymous (null name + period) | 5 | `Cherry_Dolphin`… | unidentifiable |

Row counts at stake: `lsrl_progress` 6,394 · `user_progress` 696 · `teacher_reviews` 52 · `time_sessions` 2,963 · `time_problems` 9,887 · ghost tables ~40.

**Deletion mechanics (verified from schema):** `lsrl_progress`, `user_settings`, `teacher_reviews` FK-cascade on user delete; `api_keys_pool.contributed_by` SET NULL; **`user_progress`, `time_sessions`, `time_problems`, ghost tables have NO FK** — the script must explicitly delete matching usernames there or they orphan.

**Script:** `scripts/cleanup-users.mjs` — dry-run default (prints the per-bucket list + row counts); `--archive` writes a full JSON export of every row that would be touched (to gitignored `state/archive/`); `--execute` requires an explicit `--bucket` list; reads `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` from env (pull via `railway variables`). Recommended sequence: archive everything → delete test noise → teacher decides students (D3). **Run AFTER H2 + H7 land** (else tests/auto-create repopulate junk).

### M2. Cartridge-copy reconciliation — [D5]
The school copy (`Projects/school/lrsl-driller`) and this repo are **fully disjoint at file level**. Verified state:
- **4 complete cartridges exist ONLY in the school copy**: `apstats-u9-justify-slope-claims-ci` (9.3), `apstats-u9-setting-up-slope-tests` (9.4), `apstats-u9-carrying-out-slope-tests` (9.5), `apstats-u1-categorical-tables` (1.3) — each has manifest + generator + grading-rules + ai-grader-prompt, JS syntax-valid.
- 5 more school-copy cartridges are superseded by the repo's consolidated `apstats-u8-unexpected-results` (covers 8.1-8.6 despite its registry entry saying 8.1) or covered by `apstats-u9-regression-slopes`.
- **Registry bug:** `apstats-u9-regression-slopes` exists in the repo but is NOT in `registry.json` — unreachable in-app.
- Recommended: copy the 4 unique cartridges into the repo + register them, add `apstats-u9-regression-slopes` to the registry, fix the stale U8 registry description, and document the school copy as superseded (no further syncing). Alternative (D5=defer): document-only now, reconcile at revival.

### M3. Baseline pinning — [STRICT WIN]
- Test suite: 2,213/2,214 green (9.5 s). The 1 failure is a stale assertion — `tests/grading/a2t3l3.test.js:278` expects the documented-bug grade `'P'`; the bug has been fixed and the code now correctly returns `'E'` (the test's own comment says "Once fixed, this should be 'E'"). Flip the assertion → 2,214/2,214.
- README: add DORMANT BACKUP banner (status, last-active date, revival pointer to REVIVAL_SPEC.md).
- CONTINUATION_PROMPT.md: record baseline (suite count, deploy states, users-table state post-cleanup).
- Verify post-merge: Railway `GET /` version bump, Vercel 200, the four dependent surfaces (tmux login/leaderboard, follow-alongs dropdown ×2) against live.

### M4. Out of scope (documented, untouched)
Ghost System / Ghost Orbits / LAN multiplayer / Manim pipeline; the shared-grading-proxy service; Supabase tier/backup policy (flag to teacher: if the Supabase project is free-tier it may pause on inactivity — but tmux-trainer's traffic keeps it warm until its own migration ships).

---

## 4. Rollout sequence

1. Branch `mothball-hardening` (NO direct pushes to main — Railway auto-deploys).
2. Implement H1–H8 + M3 test fix; suite green locally; server boots locally with env vars.
3. Teacher sign-off on D1–D6 already obtained (batch).
4. Merge → Railway deploys → immediately run live verification (M3 checklist + the four dependent surfaces).
5. Rotate `TEACHER_PASSWORD` on Railway (H1/D6) — after merge so old deploys don't fall back to `stats123`… (fallback removed in the same deploy; order: merge first, rotate immediately after).
6. Run M1 cleanup script (archive → delete per D3).
7. M2 per D5; update README/CONTINUATION_PROMPT; final suite + deploy verification.
