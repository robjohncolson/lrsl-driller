# REVIVAL_SPEC — lrsl-driller as a roster-integrated drill tool

**Status: SIGNED OFF 2026-06-10 — D4 = hard cutover to roster identity; D5 = AP-Stats-only ledger recording (Algebra 2 + CS installed but grade-inert). Cartridge reconciliation done at mothball time, so §3.3's merge work is already complete.**

Written 2026-06-10 while mothballing. Purpose: if students' SY26-27 understanding is lacking mid-year, a future session revives this app **in under one day** using only this document. Revival = **drill + progress only**. Ghost System, Ghost Orbits, LAN multiplayer, and the Manim pipeline stay out of scope.

Companion: `MOTHBALL_HARDENING_SPEC.md` (the state the app was left in). The roster contract below was verified 2026-06-10 from `Projects/school/follow-alongs/roster-server/` source and `Projects/tmux-trainer/PROMPT_desk-roster-alignment.md` §Ground truth B — **re-verify both before building; the roster may have evolved.**

---

## 1. The roster world (contract as of 2026-06-10)

- Identity server: `https://roster-production-12c1.up.railway.app`. CORS wildcard-open (`app.use(cors())`) — the driller's Vercel origin can call it directly today, but that is an undeclared dependency; confirm at revival.
- `POST /roster/verify {username, password}` → `200 {ok:true, studentId, token, realName, section, mustChangePassword, role:'student'|'teacher', spriteHue}`. Response does NOT echo `username`. 401 is identical for unknown-user vs bad-password; 10 fails/15 min per username → 429. Credentials are 4-digit PINs.
- `POST /roster/claim {realName, section, username, pin}` — same response shape (claim IS sign-in); section must be in `GET /roster/open-sections`; username regex **`^[a-z0-9_]{3,40}$` (lowercase only)**; 409 if taken.
- Token: bearer HMAC (NOT JWT), `b64url({sid,exp}).b64url(HMAC_SHA256)`, 30-day expiry. Validate via `POST /roster/resolve {token}` → `{ok, studentId}`. Never put the token in a URL query string.
- Public picker: `GET /roster/section/:section` → `{students:[{username, realName, section}]}` (no auth) — the roster-world replacement for the driller's `GET /api/users` dropdown.
- Grade recording: `POST /ledger/record {token, source, itemId, response, unit?, topic?, skill?, score?, attempt?}`; `studentId` derived server-side from the token. Fleet source for practice tools is **`'trainer'`** (grade-inert by omission: rows persist, teacher-visible, no grade track consumes them until a deliberate engine change). Un-provisioned source → friendly 503. `itemId` charset `[A-Za-z0-9-]`; prefixes already taken: `TI84-`, `EQ-`.

## 2. The one identity trap: username case

The prompt's "happy coincidence" (driller already generates `{Fruit}_{Animal}` usernames) has a catch verified in both codebases: **driller usernames are capitalized (`Mango_Tiger`, TEXT PK, case-sensitive)** while **roster usernames are lowercase-only (`mango_tiger`)**. They can never be byte-equal. Driller keys EVERY table on the username string; renames orphan all history. Therefore:

**Mapping rule (no renames, ever):** a link table on the driller's Supabase project

```sql
CREATE TABLE roster_links (
  driller_username TEXT PRIMARY KEY REFERENCES users(username),
  roster_student_id TEXT NOT NULL UNIQUE,
  roster_username TEXT NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT now()
);
```

- Returning student (has prior driller history): teacher pre-seeds the link row by case-insensitive username match (`lower(driller) == roster`) or manual pick. New student: first roster sign-in auto-creates a driller `users` row named **exactly the roster username** (lowercase — acceptable; the capitalization convention only mattered for the legacy generator) plus the link row.
- All existing progress endpoints keep working unchanged, keyed by `driller_username` resolved from the link at sign-in.

## 3. Revival design

### 3.1 Sign-in (D4 — recommended: hard cutover)
- New server route `POST /api/roster-login {token}`: server calls `POST /roster/resolve`, looks up/creates the `roster_links` row + driller user, returns `{username (driller), realName, section}`. The driller client then proceeds exactly as today's post-verify flow (everything downstream keys on username).
- Client login modal: replace the `GET /api/users` dropdown + password with section picker (`GET /roster/section/:section`) + 4-digit PIN → `POST /roster/verify` (direct, CORS-open) → pass `token` to `/api/roster-login`. Keep the roster token in memory/sessionStorage; never persist the PIN (the mothballed client already persists no passwords).
- Legacy sunset (hard cutover): `POST /api/users` and `POST /api/users/verify` → `410 Gone`; `GET /api/users` returns `[]` or 410 **only after confirming tmux-trainer and follow-alongs have migrated off this backend** (check their repos; tmux migration was unshipped as of 2026-06-10). If they still depend, keep legacy routes alive in parallel (de-facto dual mode) until those workstreams ship — this is the only reason to run dual.

### 3.2 Ledger bridge (grade recording)
- **itemId convention (pinned now): `LRSL-<cartridgeId>-<modeId>`** , e.g. `LRSL-apstats-u6-inference-prop-l03`. Both ids already use `[a-z0-9-]`; prefix `LRSL-` is unclaimed (`TI84-`, `EQ-` taken). No underscores (charset excludes `_`) — modeIds/cartridgeIds with `_` must be `-`-folded; verify against the actual registry at build time.
- When: on each completed mode run (the moment a star is persisted via `POST /api/progress` / cartridge-sync), server-side, fire-and-forget with retry queue:
  `POST /ledger/record { token, source:'trainer', itemId, unit:<apUnit from manifest>, response: JSON({epi, starType, hintsUsed, weightedPoints}), score: <normalized 0-1: gold=1.0, silver=0.75, bronze=0.5, tin=0.25>, attempt:<nth completion> }`.
- The student's roster token is held server-side for the session (sent once at `/api/roster-login`) or re-sent per write — decide at build; token-per-write is simpler and stateless.
- Grade-inert by design: posting to `'trainer'` records rows without touching grades; flipping them grade-bearing is a Desk-side engine decision, not a driller change.
- Teacher E/P/I overrides in the review queue should ALSO post a corrective ledger row (same itemId, higher `attempt`).

### 3.3 Cartridge subset (D5)
- In scope for SY26-27 AP Stats: the 12 registered AP Stats cartridges + (per M2 reconciliation) `apstats-u9-regression-slopes` (register it — currently unreachable), the three U9 slope-test cartridges (9.3/9.4/9.5), and `apstats-u1-categorical-tables`.
- Algebra 2 (8) and CS (1) cartridges: keep installed, excluded from ledger recording (no `LRSL-` rows) unless the teacher says otherwise.
- Implementation: manifest-level flag `ledger: true|false` per cartridge in `registry.json`; the bridge only fires for flagged cartridges.

### 3.4 Flag-gated stubs (the most this repo builds before revival)
- `ROSTER_ENABLED` env var (server) — default unset/false: all roster routes 503, legacy login untouched. The mothballed deploy ships with the flag OFF.
- `platform/core/roster-auth.js` client stub + login-modal branch behind `window.ROSTER_ENABLED` config — present but inert.
- `roster_links` migration SQL committed under `railway-server/migrations/` but NOT applied until revival day.

## 4. Revival-day checklist (~1 day)

1. **Re-verify contracts** (1 h): roster endpoints above (curl verify/resolve/section with a test account); CORS still open; `'trainer'` source still provisioned (un-provisioned → 503); `TI84-`/`EQ-`/`LRSL-` prefix registry unchanged. Check whether tmux-trainer + follow-alongs still call this backend (governs §3.1 sunset step).
2. **Wake infrastructure** (30 min): Railway service alive (`GET /` → version); Supabase project not paused (free-tier pauses on inactivity — if paused, restore from dashboard); `npm test` green locally (server tests auto-skip without a local server; run them against localhost with env vars pulled via `railway variables`).
3. **Apply migrations** (30 min): `roster_links` table; verify bcrypt migration state from mothball (`SELECT count(*) FROM users WHERE password NOT LIKE '$2%'` should be 0 if D2=bcrypt).
4. **Env vars** (15 min): set `ROSTER_URL`, `ROSTER_ENABLED=true` on Railway; confirm `TEACHER_PASSWORD` (rotated at mothball — see teacher's password manager), `SUPABASE_*`, `GEMINI_API_KEY`.
5. **Build the bridge** (3-4 h): implement §3.1 route + client modal branch and §3.2 ledger bridge from the stubs; flip `ledger:true` on the D5 cartridge subset; re-enable `POST /api/ai/contribute-key` if AI grading key pool is wanted.
6. **Seed links** (30 min): run `scripts/seed-roster-links.mjs` (build alongside the bridge): case-insensitive match of remaining driller users vs roster, print unmatched for manual mapping. (If D3 deleted all prior students, this is a no-op — links auto-create on first sign-in.)
7. **Smoke tests** (1 h): roster sign-in as a test student → drill one mode in one flagged cartridge → confirm star persists (`GET /api/progress/cartridge/...`) AND ledger row lands (Desk teacher view, source `trainer`, itemId `LRSL-...`); teacher review override → corrective ledger row; leaderboard renders; un-flagged (Algebra 2) cartridge writes NO ledger row.
8. **Update docs** (30 min): README un-dormant banner, CONTINUATION_PROMPT.md, observation log.

## 5. Acceptance

- A session with zero prior context can execute §4 top-to-bottom in <1 day.
- No renames of historical usernames; all pre-revival progress remains reachable.
- Ledger rows appear under source `'trainer'` with `LRSL-` itemIds; grade-inert until the Desk flips the engine.
- Legacy account routes end in `410` (hard cutover) or are documented as temporarily dual with a removal condition (dependents shipped).
