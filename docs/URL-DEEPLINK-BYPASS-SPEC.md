# URL Deep-Link Progression Bypass — Spec

> **Date**: 2026-03-03
> **Branch**: `feat/p2p-asset-delivery` (or new branch)

## Problem

When a teacher shares a direct URL like:
```
app.html?cartridge=apstats-u6-inference-prop&level=l03-convincing-evidence
```

Students who haven't completed earlier levels see a **"Level Not Yet Unlocked"** modal asking them to either "Resume Progress" or "Continue Anyway." This defeats the purpose of the shared link — the URL itself *is* the teacher's authorization for students to start there.

## Current Behavior

1. URL params parsed (`app.html` line 5608): stores `requestedStartLevel = { type: 'id', value: 'l03-convincing-evidence' }`
2. After cartridge loads (`app.html` line 4799): checks `gameState.unlockedTiers.includes(targetMode.id)`
3. If student hasn't unlocked it → locked level modal shown (line 4821)
4. Student must manually click "Continue Anyway" to proceed
5. Only then does the app call `setProgressionFloor()` + `setMode(id, true)`

## Desired Behavior

URL deep links **always** land the student directly on the requested level. No modal, no gating. The URL is the authorization.

- `setProgressionFloor(targetMode.id)` is called to unlock the target level and enable forward progression from it
- `setMode(targetMode.id, true)` bypasses the unlock check
- Forward progression from the linked level works normally (earn gold → unlock next)
- Previous levels remain accessible if the student navigates back
- Opening without `?level=` continues to start at level 1 with normal progression

## Affected Code

**Single file**: `platform/app.html`

**Lines ~4798–4825** — the `if (targetMode)` block inside the `requestedStartLevel` handler:

```javascript
// CURRENT (lines 4798-4825):
if (targetMode) {
  const studentUnlocked = gameState.unlockedTiers.includes(targetMode.id);

  if (isTeacher || studentUnlocked) {
    // go directly
    platform.setMode(targetMode.id, isTeacher && !studentUnlocked);
    platform.gameEngine.setProgressionFloor(targetMode.id);
    renderModeTabs();
  } else {
    // show locked level modal  ← THIS IS THE PROBLEM
    showLockedLevelModal(targetMode, resumeMode);
    requestedStartLevel = null;
    return;
  }
}
```

## Design

Replace the teacher/student branching with a single path that always honors the URL:

```javascript
// AFTER:
if (targetMode) {
  console.log(`[App] Jumping to URL-requested level: ${targetMode.id}`);
  platform.gameEngine.setProgressionFloor(targetMode.id);
  platform.setMode(targetMode.id, true);
  renderModeTabs();
}
```

### Why this works

- `setProgressionFloor()` (`game-engine.js` line 356) stores the mode index as `progressionFloor`, sets `currentTier`, rechecks unlocks. The floor level unlocks unconditionally in `checkUnlocks()` (line 220), and levels above it follow normal gold-star progression.
- `setMode(id, true)` (`platform.js` line 140) bypasses the `unlockedTiers` check via `force=true` and persists via `setTier(id, true)`.
- The locked level modal (`showLockedLevelModal`) is never called for URL deep links. It remains available for other potential future uses but is effectively dead code for this flow.

### Edge cases

| Scenario | Behavior |
|---|---|
| Level ID not found in manifest | Warning logged, falls through to normal load (line 4827) |
| `?level=` without `?cartridge=` | No cartridge loaded, `requestedStartLevel` never consumed |
| Student refreshes after deep link | `progressionFloor` persisted in localStorage, level stays accessible |
| Student navigates to cartridge normally (no URL param) | No change — starts at level 1 with standard progression |
| Teacher mode | Same path — `force=true` and floor set, no regression from current behavior |

## Test Plan

1. Clear localStorage for `apstats-u6-inference-prop`
2. Open `app.html?cartridge=apstats-u6-inference-prop&level=l03-convincing-evidence`
3. **Expected**: Lands directly on "6.1c: Convincing Evidence" — no modal
4. Earn gold star → level 4 should unlock
5. Refresh page with same URL → should still be on level 3
6. Open `app.html?cartridge=apstats-u6-inference-prop` (no level param) → should start at level 1
7. Repeat with `?start=2` instead of `?level=...` — same result
