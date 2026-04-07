# Spec: Strip Game Systems (Ghost, Orbits, Grid Wars)

## Goal

Remove all game/arcade features from the platform. No students are using them. They add complexity, bundle size (TensorFlow.js, Three.js), and maintenance burden. This is prep work for the eventual multi-repo unification.

## What Gets Removed

### System 1: Ghost System (Neural Network + 3D Maze)
TensorFlow.js neural networks that model student behavior, 3D maze visualization (Three.js), ghost-vs-ghost battles with Elo ratings.

### System 2: Ghost Orbits (Arcade Arena)
Full-screen dot-territory arena game, Shadow Self AI, 3-life system, star economy, multiplayer via WebRTC. Includes variant modes (arena, trails, blizzard).

### System 3: Grid Wars (Territorial Conquest)
Legacy game system — mostly archived already. CSS and schema files remain.

---

## Files to Delete

### Platform Core (14 files)
```
platform/core/ghost-engine.js
platform/core/ghost-network.js
platform/core/ghost-battle-engine.js
platform/core/ghost-battle-viz.js
platform/core/ghost-maze-generator.js
platform/core/ghost-maze-renderer.js
platform/core/ghost-terrain-renderer.js
platform/core/ghost-orbits-ai.js
platform/core/ghost-orbits-audio.js
platform/core/ghost-orbits-dots.js
platform/core/ghost-orbits-nn-mapper.js
platform/core/ghost-orbits-physics.js
platform/core/ghost-orbits-renderer.js
platform/core/ghost-orbits-territory.js
platform/core/orbits-mode-interface.js
```

### Platform Game (16 files + 1 CSS)
```
platform/game/ghost-panel.js
platform/game/ghost-orbits-controller.js
platform/game/ghost-orbits-panel.js
platform/game/ghost-orbits-shadow-ai.js
platform/game/arena-mode.js
platform/game/trails-mode.js
platform/game/trails-ai.js
platform/game/blizzard-mode.js
platform/game/blizzard-ai.js
platform/game/multiplayer-game-client.js
platform/game/multiplayer-panel.js
platform/game/multiplayer-renderer.js
platform/game/orbits-lobby.js
platform/game/orbits-maps.js
platform/game/orbits-network-controller.js
platform/game/grid-wars.css
```

### Test Files (15 files)
```
tests/core/ghost-engine.test.js
tests/core/ghost-network.test.js
tests/core/ghost-battle-engine.test.js
tests/core/ghost-battle-viz.test.js
tests/core/ghost-maze-generator.test.js
tests/core/ghost-terrain.test.js
tests/core/ghost-landscape.test.js
tests/core/ghost-visualization.test.js
tests/game/ghost-orbits-progression.test.js
tests/game/trails-mode.test.js
tests/game/blizzard-mode.test.js
tests/server/ghost-api.test.js
tests/server/ghost-battle-api.test.js
tests/server/ghost-orbits-manager.test.js
tests/server/ghost-orbits-multiplayer-manager.test.js
```

### Server Files (2 files)
```
railway-server/ghost-orbits-manager.js
railway-server/ghost-orbits-multiplayer-manager.js
```

### Documentation (8 files)
```
ghost-system-spec.md
ghost-phase1-technical-spec.md
ghost-phase3-maze-spec.md
ghost-phase4-viz-spec.md
ghost-phase5-landscape-spec.md
ghost-phase6-battle-spec.md
ghost-phase7-battle-viz-spec.md
ghost-tower-arcade-spec.md
ghost-orbits-spec.md
```

### Schema Files (archived, 4 files)
```
railway-server/schema-grid-wars.sql
railway-server/schema-grid-wars-v1.4.sql
railway-server/schema-grid-wars-v2.sql
railway-server/schema-grid-wars-v3.sql
```

### Standalone Pages (review before deleting)
```
platform/game-test.html          — game test page, likely safe to remove
platform/teacher-map.html        — Grid Wars territory map; review if used for anything else
```

**Total: ~62 files deleted**

---

## Files to Edit

### 1. `platform/app.html` — Remove all ghost/game wiring

**Header** (~line 109-111):
- Remove `#ghost-btn` button (ghost emoji toggle)

**Tailwind safelist** (~line 17-18):
- Remove the Grid Wars class safelist `<div>`

**Script imports** (~line 1022-1023):
- Remove `GhostEngine` and `GhostPanel` imports

**Ghost initialization** (~lines 1065-1138):
- Remove `GhostEngine.init()`, `recordGhostInteraction()`, session tracking

**Ghost Orbits initialization** (~lines 1431-1704):
- Remove `initGhostOrbits()`, arena eligibility, arena launch/exit logic
- Remove ghost panel container setup

**WebSocket handlers** (~lines 1301-1323):
- Remove `ghost_battle_complete` message handler
- Remove `onOrbitsLobbyStatus` handler

**Gold star update** (~line 1828):
- Remove ghost panel update on gold star change

**Lazy load** (~line 2823):
- Remove `ghost-orbits-audio.js` lazy load

**Grid Wars safelist comment** in `platform/styles.css` (lines 8-15):
- Remove the Grid Wars class safelist comment

### 2. `railway-server/server.js` — Remove ghost endpoints and imports

**Imports** (lines 7-8):
- Remove `ArenaManager` / `ghost-orbits-manager.js` require
- Remove `OrbitsMultiplayerManager` / `ghost-orbits-multiplayer-manager.js` require

**Initialization** (~lines 92-110):
- Remove `ghostOrbitsManager` instantiation
- Remove `orbitsMultiplayerManager` instantiation and lobby status handler

**WebSocket broadcast** (~line 71):
- Remove orbits arena broadcast filter

**API endpoints** (~lines 2775-2880):
- Remove `POST /api/ghost/:cartridgeId/sync`
- Remove `GET /api/ghost/:cartridgeId/leaderboard`
- Remove `GET /api/ghost/:cartridgeId/:username`
- Remove any other ghost/orbits endpoints (search for full set)

### 3. `package.json` — Remove game dependencies

```diff
- "@tensorflow/tfjs": "^4.17.0",
- "three": "^0.159.0"
```

Then `npm install` to update lockfile.

### 4. `docs/STATE_MACHINES.md` — Remove game sections

Remove sections 128-142:
- 128-134: Ghost System (network, engine, maze, battle)
- 135-142: Ghost Orbits (controller, star economy, dots, lives, shadow AI, movement, win conditions, match flow)
- Any Grid Wars sections (31-39)

### 5. `CLAUDE.md` — Remove game references

- Remove **Ghost System** paragraph from Major Features
- Remove **Ghost Orbits** paragraph from Major Features
- Remove `ghost-system-spec.md` from Key Docs
- Remove "Ghost Orbits: STATE_MACHINES.md sections 135-142" from Key Docs
- Update test count after deletion
- Update version note if appropriate

### 6. `TUNING.md` — Remove grid-wars references

---

## What Gets Kept

- `platform/core/leaderboard.js` — No ghost dependencies, used by the leaderboard panel
- Class leaderboard panel in `app.html` — Student score tracking, not a game
- Teacher review panel — Core grading workflow
- Time analytics panel — Core analytics
- All cartridge files — Untouched
- All grading/scoring logic — Untouched

---

## Database Tables (DO NOT DROP)

These tables exist in production Supabase. The migrations that created them stay in the `migrations/` folder (they're historical records), but no new code will read/write to them:

- `ghost_profiles` (migration 013)
- `ghost_battles` (migration 014)
- `ghost_orbits_sessions`, `ghost_orbits_stats` (migration 015)

**Do not** drop these tables. They contain historical data and dropping requires a coordinated Supabase migration. They'll just sit unused.

The migration SQL files stay as-is — they're a historical record of schema changes, not active code.

---

## localStorage Keys (Auto-Orphaned)

These keys will simply be ignored after removal. No cleanup needed — they'll expire naturally as students clear browser data:

- `${cartridgeId}_ghost_weights`
- `${cartridgeId}_ghost_buffer`
- `${cartridgeId}_ghost_meta`
- `${cartridgeId}_ghostOrbits_shadowGeneration`
- `ghostOrbits_musicSettings`
- `${cartridgeId}_orbits_lastSessionGolds`

---

## Execution Order

1. **Delete all game source files** (platform/core/ghost-*, platform/game/*, orbits-mode-interface.js)
2. **Delete all game test files** (tests/core/ghost-*, tests/game/*, tests/server/ghost-*)
3. **Delete all game docs** (ghost-*-spec.md, ghost-orbits-spec.md)
4. **Delete archived schemas** (schema-grid-wars*.sql)
5. **Edit `app.html`** — Remove imports, init, handlers, UI elements
6. **Edit `railway-server/server.js`** — Remove imports, endpoints, managers
7. **Edit `package.json`** — Remove @tensorflow/tfjs and three
8. **Run `npm install`** — Update lockfile
9. **Edit `docs/STATE_MACHINES.md`** — Remove sections 31-39, 128-142
10. **Edit `CLAUDE.md`** — Remove ghost/game references
11. **Edit `platform/styles.css`** — Remove Grid Wars safelist comment
12. **Review `platform/teacher-map.html` and `platform/game-test.html`** — Delete if game-only
13. **Run `npm test`** — Verify remaining tests pass
14. **Run `npm run build`** — Verify build succeeds

## Verification

- `npm test` passes (expect test count to drop by ~200-400 from the game tests)
- `npm run build` succeeds
- No console errors on page load
- Ghost button gone from header
- Deep-link to cartridge still works
- Grading flow still works end-to-end
- Leaderboard panel still works
- `git diff --stat` shows only expected files changed

## Risk

**LOW**. This is purely subtractive — removing isolated game subsystems that have no callers from core grading/cartridge code. The ghost system was designed as an overlay, not integrated into the grading flow. The main risk is missing a reference in `app.html` that causes a runtime error, caught by the test + build step.
