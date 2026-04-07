# Continuation Prompt — Strip Game Systems

## What to do NOW

Implement `specs/strip-game-systems.md` — remove all game/arcade features (Ghost System, Ghost Orbits, Grid Wars) from the codebase. No students use them. This is house-cleaning prep for eventual multi-repo unification.

**Start here:**

1. Delete ~62 files (game source, tests, docs, archived schemas). Full list in the spec.
2. Edit `platform/app.html` — remove ghost button (~line 109), Tailwind safelist div (~line 17), script imports (~line 1022), ghost init (~lines 1065-1138), orbits init (~lines 1431-1704), WebSocket handlers (~lines 1301-1323), ghost panel update on gold star (~line 1828), lazy load (~line 2823).
3. Edit `railway-server/server.js` — remove ghost-orbits-manager and multiplayer-manager imports (lines 7-8), manager instantiation (~lines 92-110), orbits broadcast filter (~line 71), all `/api/ghost/` endpoints (~lines 2775-2880).
4. Edit `package.json` — remove `@tensorflow/tfjs` and `three` dependencies.
5. Run `npm install` to update lockfile.
6. Edit `docs/STATE_MACHINES.md` — remove sections 31-39 (Grid Wars) and 128-142 (Ghost/Orbits).
7. Edit `CLAUDE.md` — remove Ghost System and Ghost Orbits from Major Features, remove ghost docs from Key Docs, update test count.
8. Edit `platform/styles.css` — remove Grid Wars safelist comment (lines 8-15).
9. Review and likely delete `platform/teacher-map.html` and `platform/game-test.html`.
10. Run `npm test` and `npm run build` — verify everything passes.

**Key constraint:** Do NOT drop database tables or delete migration SQL files — migrations are historical records and tables hold production data that should just go dormant.

**Key constraint:** `platform/core/leaderboard.js` has NO ghost dependencies — keep it.

## Session Commits (2026-03-19)

```
90f97de chore: update GitNexus skill files
33c042b fix: header overflow from long cartridge name on deep-link load
```

The header overflow fix is deployed: `app-title` stays "Driller", cartridge button uses registry short name via `getCartridgeDisplayName()` helper, header elements have truncate/max-w protection.

## Current State

- **Branch:** main @ `90f97de` (clean — only untracked `specs/strip-game-systems.md`)
- **Spec ready:** `specs/strip-game-systems.md` — full file inventory, edit locations, execution order
- **Tests:** ~1682 (expect to drop by 200-400 after game test deletion)
- **Deploy:** Vercel (frontend) + Railway (backend)

## Key Paths

| Purpose | Path |
|---------|------|
| Spec to implement | `specs/strip-game-systems.md` |
| Main app (biggest edit) | `platform/app.html` (~3600 lines) |
| Server (endpoint removal) | `railway-server/server.js` |
| Game source files | `platform/core/ghost-*.js`, `platform/game/*.js` |
| Game tests | `tests/core/ghost-*.test.js`, `tests/game/*.test.js`, `tests/server/ghost-*.test.js` |
| Game docs | `ghost-*-spec.md` (root) |
| State machines doc | `docs/STATE_MACHINES.md` |
| Project instructions | `CLAUDE.md` |

## Environment

- **Platform**: Windows 11, Git Bash (Unix syntax)
- **Node**: v22.19.0 | **Python**: 3.12
- **Deploy**: Vercel (auto-deploy on push to main) + Railway
- **Entry point**: `platform/app.html`
- **Dev server**: `npm run dev` → http://localhost:5173/platform/app.html

## Broader Context

This strip is Step 1 of a longer plan:
1. **Strip games** ← YOU ARE HERE
2. R content pipeline for AP Stats cartridge generation
3. Unify `lrsl-driller` + `../curriculum_render/` + `../apstats-live-worksheets` into one platform

See memory file `project_unification_goal.md` for full context.
