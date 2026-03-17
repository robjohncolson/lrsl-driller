# Continuation Prompt — Platform Refactor (extraction pass complete)

## What to do NOW

**The extraction pass is done.** app.html is down to 3,852 lines (from 5,738 — 33% reduction). What remains is orchestration glue: init, module wiring, the loadCartridge orchestrator, grading callbacks, UI updates, and ghost system stubs.

### Next decision point: Phase 3 (TypeScript) or more extractions?

User preference (from this session): **defer TypeScript until the boundaries stop moving.** The remaining sections are high-coupling orchestration code — extracting them further has diminishing returns and risks creating instability.

### What remains in app.html (~3,852 lines):

| Section | Lines | Why it stays |
|---|---|---|
| CONFIGURATION | ~1052-1074 | Network config bootstrap, small |
| GHOST SYSTEM + SESSION | ~1075-1148 | Ghost session tracking + recordGhostInteraction |
| VERSION CHECK | ~1150-1213 | checkForUpdates, compareVersions, showUpdateNotification |
| INITIALIZE MODULES | ~1215-1429 | Module instantiation, wsClient config with callbacks |
| GHOST PANEL INTEGRATION | ~1431-1459 | All no-ops (disabled), could delete |
| GHOST ORBITS INTEGRATION | ~1461-1669 | Mix of no-ops + utility fns that drifted here |
| RESPONSIVE LAYOUT | ~1670-1698 | Small resize handler |
| UI UPDATES | ~1699-1951 | renderModeTabs, updateScenarioDisplay — high fan-in |
| GRADING STATUS | ~1952-2212 | applyTeacherGrades, submitForTeacherReview, onGradingComplete callback |
| Extracted module wiring | ~2213-2530 | UsernameModal, escape handler, share modal, level selectors, settings — mostly 1-liners |
| TEACHER LOGIN | ~2397-2465 | TeacherModeController instantiation + activateTeacherMode |
| LEADERBOARD + REVIEW + ANALYTICS | ~2466-2555 | Panel instantiation wiring |
| CARTRIDGE LOADING UI | ~2556-2680 | CartridgeLoadingController wiring |
| LOAD CARTRIDGE | ~2681-3650 | **The big orchestrator** (~970 lines) — highest fan-out |
| Extracted module init calls | ~3650-3855 | TeacherProgression, AnimationControls, ActionButtons, AIAppeal, ConsoleCommands, init() |

### If continuing extractions later:

**Low-hanging fruit:**
- Delete the ghost panel no-ops (lines 1431-1459) — they're dead code
- Extract Version Check (~60 lines, zero coupling)
- Extract utility functions from Ghost Orbits section (`getCurrentTopicName`, `getLevelMultiplier`, `getDbGradingMode`, `syncCartridgeProgress`)

**Do not extract** (orchestration core):
- INITIALIZE MODULES, UI UPDATES, GRADING STATUS, LOAD CARTRIDGE, INIT

## All Extraction Commits (this session + prior)

```
8416319 fix: degraded-network teacher UI bug — cache-first restore, no insecure fallback
3f69843 refactor: extract TeacherModeController from app.html (Phase 2, seam 1)
d76d476 refactor: extract TeacherReviewPanel from app.html (Phase 2, seam 2)
2f39636 refactor: extract TimeAnalyticsPanel from app.html (Phase 2, seam 3)
4a0b7ac refactor: extract SettingsMediaController from app.html (Phase 2, seam 4)
42420d1 refactor: extract RealtimeController from app.html (Phase 2, seam 5)
07369f3 refactor: extract CartridgeLoadingController from app.html (Phase 2, seam 6)
497d3a9 refactor: extract AnimationControls from app.html (Phase 2, seam 7)
1cda0e1 refactor: extract UsernameModal, AIAppealHandlers, ActionButtons from app.html
d5ad529 refactor: extract ConsoleCommands, GradingEscalation, ShareModal from app.html
0e36eb2 refactor: extract TeacherProgressionControls from app.html
```

## Current State

- **app.html**: 3,852 lines (down from 5,738 — 33% reduction)
- **Extracted modules**: 16 new files in `platform/core/`
- **Tests**: 2,167 passing (2,180 total, 13 pre-existing ghost-engine failures)
- **Branch**: `main`, all pushed

## Key Paths

| Purpose | Path |
|---|---|
| Main monolith | `platform/app.html` |
| Refactor analysis | `specs/platform-refactor-analysis.md` |
| All extracted modules | `platform/core/{teacher-mode,teacher-review,time-analytics,settings-media,realtime-controller,cartridge-loading,animation-controls,username-modal,ai-appeal,action-buttons,grading-escalation,share-modal,console-commands,teacher-progression}.js` |

## Environment

- **Platform**: Windows 11, Git Bash (Unix syntax)
- **Node**: v22.19.0 | **Python**: 3.12
- **Test runner**: `npm test` (vitest, 2,167+ tests)
- **Dev server**: `npm run dev` → http://localhost:5173/platform/app.html
- **Deploy**: Vercel (frontend) + Railway (backend)
