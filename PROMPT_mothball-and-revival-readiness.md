# lrsl-driller: mothball hardening + revival readiness

You are working in `C:/Users/rober/Downloads/Projects/not-school/lrsl-driller` — the "Driller Platform" (console/cartridge drill app). Everything in the **Ground truth** sections was extracted from this repo and its live backend on 2026-06-10 with citations — trust it over older docs, and re-verify a citation before building on it if something seems off.

## The teacher's decision (this frames everything)

This app is a **DORMANT BACKUP for SY26-27**. It is not in active use (last commit 2026-04-08; the AP exam has passed) and will only be revived mid-year **if students' understanding is lacking**. It is explicitly NOT being migrated onto the new roster system right now.

So the mission is NOT a rebuild. It is, in priority order:

1. **Security hardening** — make it safe to leave running unattended on the public internet.
2. **Mothball cleanup** — tidy the live users table and pin the deploy/test baseline so nothing rots.
3. **Revival readiness** — a written spec (plus at most flag-gated stubs) so that reviving it with roster identity + Desk grade recording is a one-day job, not a project.

**Process**: brainstorm → written spec (`.md` in this repo) → put ALL the decision-point questions (section below) to the teacher in ONE batch → sign-off → implement. Keep the Vitest suite green (~2,000 tests). Update `CONTINUATION_PROMPT.md` at the end per repo convention.

## ⚠ The one big operational caution

**The backend is LIVE and other apps depend on it.** `railway-server/server.js` deploys to `https://lrsl-driller-production.up.railway.app` (alive, `GET /` → service `lsrl-trainer-server` v4.1.0). Verify whether Railway auto-deploys on push BEFORE pushing server changes — a push may change the live API under the dependents below. Test server changes locally against the suite first, and treat every API-shape change as a breaking-change review.

**Current dependents of this backend (must keep working):**
- **tmux-trainer** (`tmux-trainer.vercel.app`): `POST /api/users/verify`, `GET /api/users`, `POST /api/progress/cartridge-sync`, `GET /api/progress/cartridge/...`, `GET /api/progress/leaderboard/td-ap-stats-formulas`. It is mid-migration onto the roster system (see `Projects/tmux-trainer/PROMPT_desk-roster-alignment.md`), but until that ships, don't break these.
- **follow-alongs (LIVE on GH Pages)**: the Desk's "My Progress" app (`ap_stats_roadmap_square_mode.html` ~line 12536: `PROG_DRILLER_API`, calls `/api/users/verify` + progress GETs), `study_guide_diagnostic.html:551` (`DEFAULT_DRILLER_API_BASE`), and `data/study-guide-sync-config.js` (uses `GET /api/users` as its username source). Repointing those is a separate follow-alongs workstream — until then they hit this server.
- **This app itself** (`lrsl-driller.vercel.app` + the Electron `local-server/` LAN multiplayer).

## Ground truth A — what this app is

- Subject-agnostic drill platform: platform = console, lessons = cartridges. 21 active cartridges in `cartridges/registry.json`: 12 AP Statistics (LSRL, residuals, sampling, U3-U8 inference), 8 Algebra 2, 1 CS (MIT 6.0001). A separate content-only copy at `Projects/school/lrsl-driller` (animations/cartridges/media only — not a repo, no server) holds U8/U9 chi-square cartridges never merged back into this registry; reconcile or document.
- Stack: Vanilla JS frontend (~51k LOC platform, entry `platform/app.html`, ~3,600-line orchestrator; Vite build, `npm run dev` → localhost:5173), Express + Supabase backend (~15k LOC, `railway-server/server.js`, 4,381 lines, ~60 routes + a WebSocket layer), Vitest (~2k tests). Frontend deploys to Vercel (`vercel.json`: vite → dist, `/` redirects to `/platform/app.html`); setup guide on GH Pages.
- Subsystems you should NOT scope into revival: Ghost System (TensorFlow.js behavior models, Elo battles), Ghost Orbits arena + LAN multiplayer, Manim animation pipeline. Revival = drill + progress only.
- Gradeable-shaped progress already exists: per-scenario E/P/I scores with hints/stars (`lsrl_progress`), per-cartridge star counts + `total_weighted_score` (`user_progress` via `/api/progress/cartridge-sync`), per-problem time tracking, a teacher-review queue with E/P/I overrides. None of it touches the new gradebook (zero references to roster-production anywhere here).

## Ground truth B — the security problems (Task 1 targets)

1. **Plaintext passwords by design**: `supabase_schema.sql` users table — `password TEXT NOT NULL, -- plaintext ok for classroom pedagogy app`; `POST /api/users` inserts raw (`server.js:175`), `POST /api/users/verify` does a literal string compare (`server.js:210`). The client stores `{username, realName, password}` — plaintext — in IndexedDB + localStorage `userIdentity` (`platform/core/user-system.js:197-244`).
2. **Public PII**: `GET /api/users` is unauthenticated and returns EVERY student's `username + real_name + class_period`. Live table has 107 accounts (real students from periods A/B/E/F — a prior-year lettered scheme — plus heavy test noise: mrcolson ×4, bob, bbobby, testing_user; 69 rows with null period; 25 with null real_name).
3. **Hardcoded teacher fallback**: teacher auth = env `TEACHER_PASSWORD` with fallback `'stats123'` (`server.js:18`). Remove the fallback; require the env var.
4. **Silent account creation**: `/api/progress/cartridge-sync` auto-creates missing users with password `'auto-created'` (`server.js:~587-593`) — accounts with a known constant password.
5. Supabase is accessed with the SERVICE ROLE key (RLS bypassed) — fine server-side, but it means every route is as trusted as its own code; that raises the bar on 1-4.

Hardening approaches to weigh in the spec (with my recommendations): strip `real_name` from the public `/api/users` (check what each dependent actually consumes first — the follow-alongs study-guide sync wants usernames; login dropdowns display real names — that display may have to go or move behind teacher auth); bcrypt the password column with a one-time migration (the roster's bcrypt + reversible-cipher-for-teacher-recovery model is the precedent) OR document plaintext-accepted-as-is if the teacher prefers — his call, ask; kill the `'stats123'` fallback and the auto-create-with-known-password path outright (no decision needed — these are strict wins).

## Ground truth C — the roster world it must align with WHEN revived

(Condensed; the full contract with citations lives in `Projects/tmux-trainer/PROMPT_desk-roster-alignment.md` §Ground truth B — read it before writing the revival spec.)

- Identity: roster-server at `https://roster-production-12c1.up.railway.app` — `POST /roster/verify {username, password}` → `{studentId, token, realName, section, role, spriteHue}`; fruit_animal usernames + 4-digit PINs; 30-day bearer HMAC token; `POST /roster/resolve` = whoami. **CORS is wildcard-open today** — this app's Vercel origin can call it directly.
- Happy coincidence: this app already generates `{Fruit}_{Animal}` usernames — same convention as the roster. But this app keys EVERYTHING on `username` as primary key (no user id anywhere), so the revival spec must map roster identity → existing username WITHOUT renames (renames orphan all history).
- Grade recording: `POST /ledger/record {token, source, itemId, response, unit?, score?, attempt?}` on roster-server. **The fleet-wide source for practice tools is `'trainer'`** (migration 0016 in follow-alongs, grade-inert by omission — rows persist and are teacher-visible but no grade track consumes them until a deliberate engine change). An un-provisioned source now returns a friendly 503. itemId charset `[A-Za-z0-9-]`; taken prefixes: `TI84-` (TI-84 trainer), `EQ-` (Equation Trainer). Propose `LRSL-<cartridgeId>-<scenarioOrTopic>` and pin it in the spec.
- The revival spec should cover: (a) roster sign-in alongside/replacing local accounts (decide: dual-identity or hard cutover); (b) mapping per-scenario E/P/I + stars onto `'trainer'` ledger rows; (c) which of the 21 cartridges are even relevant for SY26-27 AP Stats (the Algebra 2 + CS ones are out of scope for the Desk gradebook); (d) what happens to the legacy `/api/users` account system after cutover.

## Tasks

### 1. Security hardening (implement now)
- Kill the `'stats123'` fallback (require env) and the auto-create-with-`'auto-created'`-password path.
- Lock down `/api/users` PII per the decided option (after checking dependent consumption — see the caution section).
- Password storage per the teacher's decision (bcrypt migration vs documented-as-is).
- Stop the client persisting plaintext passwords (`user-system.js` `userIdentity`) — session-scoped at most.
- Quick pass for other unauthenticated write routes in the ~60 (e.g. `/api/users` POST, roster PUT/bulk-assign, progression-overrides) — inventory which routes mutate state with no auth and propose the minimal gate.

### 2. Mothball cleanup
- Users-table cleanup script (dry-run default, teacher-approved deletions): test accounts, null-period rows, prior-year cohorts. Get explicit sign-off on the deletion list — these are real student records.
- Reconcile or document the `school/lrsl-driller` content-only copy (unmerged U8/U9 cartridges).
- Pin the baseline: full test suite run recorded in CONTINUATION_PROMPT.md, Vercel + Railway deploy state verified, README updated with the dormant-backup status so a future session doesn't mistake this for an active product.

### 3. Revival-readiness spec (spec + at most flag-gated stubs — do NOT fully build)
- Write `REVIVAL_SPEC.md`: roster sign-in design, username mapping rule, `'trainer'` ledger bridge with the `LRSL-` itemId convention, cartridge subset, legacy-account sunset, and a step-by-step revival-day checklist (env vars, migration check, smoke tests).
- Acceptance bar: a future session should be able to execute revival from the spec alone in under a day.

## Decision points — ask the teacher ALL of these in one batch before implementing

1. `/api/users` lockdown: strip `real_name` (recommended) vs teacher-auth the whole list? (Affects the in-app login dropdown UX and the follow-alongs study-guide username source.)
2. Passwords: bcrypt migration now (recommended; roster-style reversible cipher only if he wants password recovery) vs document-and-accept plaintext for a dormant app?
3. Users-table cleanup: approve the deletion list, or archive-flag instead of delete?
4. Revival identity: hard cutover to roster sign-in (recommended — one identity system) vs dual (legacy + roster)?
5. Which cartridges matter for SY26-27? (12 AP Stats ones presumably; Algebra 2 depends on whether he still teaches it.)

## Definition of done

- [ ] No hardcoded secret fallbacks; no auto-created known-password accounts; no plaintext credential persisted client-side.
- [ ] `/api/users` no longer exposes real names publicly (per decided option) AND the three follow-alongs surfaces + tmux-trainer still work (verify against the live deployments, not just locally).
- [ ] Users table cleaned per the approved list; cleanup script committed (dry-run default).
- [ ] `REVIVAL_SPEC.md` written and self-sufficient; CONTINUATION_PROMPT.md updated; suite green; both deploys verified.
