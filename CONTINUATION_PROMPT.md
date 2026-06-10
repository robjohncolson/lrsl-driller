# Continuation Prompt — lrsl-driller

## What just happened (2026-06-10)

**The app was MOTHBALLED.** Security-hardened, data-cleaned, baseline-pinned, and left as a dormant backup for SY26-27 per the teacher's decision. Full mission doc: `PROMPT_mothball-and-revival-readiness.md`. Signed-off decisions and verified findings: `MOTHBALL_HARDENING_SPEC.md` (D1–D6). Revival is a spec'd ~1-day job: `REVIVAL_SPEC.md`.

### Session Commits (2026-06-10)

```
96185ec docs: mothball status, hardening + revival specs, users-table cleanup script
c4273dc feat: reconcile school-copy cartridges into registry (D5)
9424700 security: harden dormant backend + client per signed-off mothball spec
```

### What changed

- **Server v4.2.0** (live on Railway, verified): `TEACHER_PASSWORD` env required (no `stats123` fallback in code; the env value is still `stats123` by the teacher's explicit D6 decision — accepted risk, value is public in repo history); auto-create-user removed (unknown user → 404); `GET /api/users` returns usernames only; leaderboards return no `real_name`; per-student review/time-tracking GETs teacher-gated; `contribute-key` 410; rate limiting (300/min/IP mutating with verify/auth exempt, 20/min/IP AI relay); WS teacher messages password-gated; latent `broadcastToCartridge` 500 fixed.
- **Client 4.2.0** (live on Vercel, verified): no plaintext password persisted (student or teacher), offline login/signup fail closed, no hardcoded `stats123` anywhere, teacher mode requires re-entry after reload.
- **Users table wiped (D3)**: all 127 accounts + every student-derived row deleted (lsrl_progress 6,394 / user_progress 696 / time rows ~12,850 / ghost + game remnants). **Full JSON archive (11 MB) at `state/archive/2026-06-10T21-56-32-611Z/` — local only, gitignored, contains real names + plaintext passwords. Do not commit.** Kept: `api_keys_pool` (5 teacher keys), `progression_overrides` (3), no-user-reference game config (grid_wars_territories 195, ctf_tiebreaker_matches 3).
- **Cartridges reconciled (D5)**: 4 imported from the school content-copy (U9 9.3/9.4/9.5 + U1 1.3, manifests adapted to repo schema), `apstats-u9-regression-slopes` finally registered, stale U8 description fixed. Registry now 26 entries. The copy at `Projects/school/lrsl-driller` is superseded — do not sync from it again.

## Current State

- **Branch:** main @ `96185ec` (= `mothball-hardening`, merged)
- **Status:** DORMANT BACKUP. See README banner. Revive only if SY26-27 understanding is lacking → follow `REVIVAL_SPEC.md` (roster sign-in, `'trainer'` ledger bridge, `LRSL-` itemIds, AP-Stats-only).
- **Tests:** 2,217 passing (offline: 2,177 + 40 network tests auto-skip). `npm test` NO LONGER writes to production — server tests default to `localhost:3000` and skip when nothing listens. To run them: `npm install` in `railway-server/`, start it with env vars from `railway variables --service lrsl-driller`, then `SERVER_URL=http://localhost:3000 npm test`.
- **Deploys (both verified live 2026-06-10):** Railway `lrsl-driller` (project `thorough-spontaneity`) **auto-deploys from GitHub main, root `/railway-server`** — a push to main IS a production deploy. Vercel auto-deploys the frontend. Versions pinned in lockstep at 4.2.0 (server `CURRENT_VERSION` / client `CLIENT_VERSION`) — bump BOTH or the update banner fires.
- **Live dependents still on this backend** (do not break: contract table in `MOTHBALL_HARDENING_SPEC.md` §0): tmux-trainer (login/SRS/leaderboard — roster migration not shipped), follow-alongs My Progress + study guide (login dropdown via `GET /api/users`, self-signup via `POST /api/users`).
- **DB:** users table EMPTY. Students can still self-signup (study guide flow) — new accounts accumulate only via explicit `POST /api/users`.

## Pending Work

### At revival time (not before)
- Execute `REVIVAL_SPEC.md` §4 checklist (~1 day): re-verify roster contract, `roster_links` migration, `POST /api/roster-login`, ledger bridge, smoke tests.

### Backlog (from prior sessions, unchanged)
- **Strip game systems** — spec at `specs/strip-game-systems.md` (Ghost/Orbits/Grid Wars). Lower priority now that the app is dormant; revisit at revival.
- **R content pipeline** for AP Stats cartridge generation.
- **Repo unification** — merge lrsl-driller + curriculum_render + apstats-live-worksheets.

### Known accepted limitations (decided, don't "fix" without the teacher)
- Plaintext passwords by decision (D2); `TEACHER_PASSWORD=stats123` by decision (D6) — teacher routes are effectively open, mitigated by the empty DB + rate limits.
- Teacher signed in via a teacher ACCOUNT (not the password modal) cannot use WS class-time/WebRTC actions (no in-memory password); client doesn't surface the `TEACHER_AUTH_REQUIRED` WS error; WS `identify` impersonation accepted (no progress writes flow through WS).
- `apstats-u1-categorical-tables` has no animations (source videos were never produced; re-add per-mode `animation` fields if rendered later — host on Supabase `videos/animations/<cartridgeId>/`).

## Key Paths

- `MOTHBALL_HARDENING_SPEC.md` — what was done and why, decisions D1–D6, dependent contract table
- `REVIVAL_SPEC.md` — the revival playbook (self-sufficient)
- `scripts/cleanup-users.mjs` — users-table cleanup (dry-run default; `--archive --execute --bucket=...`); env from `railway variables --service lrsl-driller`
- `state/` — gitignored; PII archives + env snapshots live here
- `railway-server/server.js` — the live backend (4,4xx lines, ~60 routes + WS)
