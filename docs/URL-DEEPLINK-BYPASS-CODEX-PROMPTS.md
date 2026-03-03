# URL Deep-Link Progression Bypass — Codex Prompts

> **Companion to**: `docs/URL-DEEPLINK-BYPASS-SPEC.md`
> **Date**: 2026-03-03

## Dependency Diagram

```
Wave 1 (single prompt, no dependencies):
  P1: app.html — remove gating for URL deep links
```

This is a single-file, single-wave change. No parallelism needed — one prompt does the job.

---

## Wave 1

### Prompt P1: `app.html` — Remove progression gating from URL deep links

In `platform/app.html`, find the `requestedStartLevel` handler block (around lines 4798–4825). It currently looks like this:

```javascript
if (targetMode) {
  const studentUnlocked = gameState.unlockedTiers.includes(targetMode.id);

  // Teachers and students with unlocked access go directly
  if (isTeacher || studentUnlocked) {
    console.log(`[App] Jumping to URL-requested level: ${targetMode.id}`);
    platform.setMode(targetMode.id, isTeacher && !studentUnlocked);
    platform.gameEngine.setProgressionFloor(targetMode.id);
    renderModeTabs();
  } else {
    // Student accessing locked level - show modal with choice
    console.log(`[App] Student accessing locked level ${targetMode.id} via URL - showing modal`);

    // Find highest unlocked level for resume
    let resumeMode = modes[0]; // Default to first level
    for (let i = modes.length - 1; i >= 0; i--) {
      if (gameState.unlockedTiers.includes(modes[i].id)) {
        resumeMode = modes[i];
        break;
      }
    }

    // Show modal - don't set mode yet, wait for user choice
    showLockedLevelModal(targetMode, resumeMode);
    // Note: loadProblem will be called after user makes choice
    requestedStartLevel = null;
    return; // Exit early - modal handlers will continue
  }
}
```

Replace the entire `if (targetMode) { ... }` block with:

```javascript
if (targetMode) {
  // URL is the authorization — go directly to the requested level
  console.log(`[App] Jumping to URL-requested level: ${targetMode.id}`);
  platform.gameEngine.setProgressionFloor(targetMode.id);
  platform.setMode(targetMode.id, true);
  renderModeTabs();
}
```

**What this does**: Removes the `studentUnlocked` check and the locked level modal entirely from the URL deep-link flow. Every URL deep link now calls `setProgressionFloor()` (which unconditionally unlocks the target level and enables forward progression) and `setMode(id, true)` (which force-bypasses the unlock check).

**What NOT to change**:
- Do not modify the `else` branch at line 4826 (`URL-requested level not found` warning) — keep it
- Do not modify the `requestedStartLevel = null` cleanup at line 4831 — keep it
- Do not modify `showLockedLevelModal()` or its button handlers — they remain for potential other uses
- Do not modify `checkUnlocks()`, `setProgressionFloor()`, `setMode()`, or any other engine code
- Do not remove the `const gameState = ...` line at 4783 — it may be used elsewhere in the function

**Verify**: Open `app.html?cartridge=apstats-u6-inference-prop&level=l03-convincing-evidence` with no prior progress. Should land directly on level 3 with no modal.

Run: `npm test`
