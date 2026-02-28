# Progression Unlock Fix Spec

**Date**: 2026-02-26
**Status**: Draft
**Severity**: High (UX-breaking — students get teleported to wrong lessons)

## Problem

Earning a gold star on mode 5.7a unlocks and auto-navigates to a much earlier mode (e.g., 5.2) instead of unlocking 5.7b. The student loses their place and gets confused.

## Root Causes

There are **three interacting bugs** in `platform/core/game-engine.js` and `platform/app.html`.

---

### Bug 1: Missing `break` in `checkUnlocks` (game-engine.js:231)

The `checkUnlocks` loop iterates through all 35 modes sequentially. When it encounters a tier that **cannot** be unlocked (previous mode lacks enough gold), the comment says "stop checking further levels" — but there is no `break` statement. The loop silently skips the locked tier and continues checking later tiers.

```js
// Line 226-233
if (previousUnlocked && previousModeStars.gold >= requiredGold) {
  this.unlockedTiers.push(tier.id);
  this.onTierUnlocked(tier);
  this.saveState();
}
// If previous level isn't complete, stop checking further levels
// (they can't be unlocked without completing earlier ones)
// ← NO break; HERE — loop continues to next tier
```

**Impact**: On its own, this bug doesn't cause incorrect unlocks during normal `awardStar` calls (because the `unlockedTiers` array is cumulative and the `continue` on line 203 skips already-unlocked tiers). But it enables Bug 2.

### Bug 2: Bulk re-checks fire `onTierUnlocked` for already-known tiers

Three methods clear `unlockedTiers` to `[]` then re-run `checkUnlocks`:

| Method | Line | Trigger |
|--------|------|---------|
| `setOverrides()` | 296 | Every cartridge load (app.html:4613) |
| `restoreFromServer()` | 430 | Every cartridge load if logged in (app.html:4624) |
| `updateOverride()` | 309 | Teacher changes a requirement |
| `removeOverride()` | 321 | Teacher removes an override |

When `checkUnlocks` re-discovers modes that were *already* unlocked before the clear, it calls `this.onTierUnlocked(tier)` for each one as if it were newly unlocked. This fires `platform:tierUnlocked` events for potentially dozens of modes.

**The load sequence** (app.html:4598-4638):
1. `platform.loadCartridge()` → `checkUnlocks` runs, unlocks tiers, fires events
2. `setOverrides()` → clears `unlockedTiers`, re-runs `checkUnlocks`, fires events *again* for everything
3. `restoreFromServer()` → clears `unlockedTiers`, re-runs `checkUnlocks`, fires events a *third time*

**Impact**: On cartridge load, every previously-unlocked tier fires `onTierUnlocked`. On earning a star, `setOverrides`/`restoreFromServer` don't run — but if overrides are active, `updateOverride` can trigger it.

### Bug 3: Auto-advance race condition (app.html:4250)

The `platform:tierUnlocked` event handler auto-advances to the unlocked tier after a 3-second delay:

```js
// Line 4250-4265
setTimeout(async () => {
  if (userNavigated) return;
  // ...
  await goToNewLevel();  // navigates to tier.id
}, 3000);
```

When Bug 2 fires multiple `tierUnlocked` events, each one sets its own 3-second timer. The `userNavigated` guard only prevents double-navigation *within a single event handler closure* — separate events have separate closures. The **last timer to fire wins**, which is the last tier in the modes array that got re-unlocked.

**Combined scenario** (what the teacher observed):
1. Student earns gold on 5.7a → `awardStar` → `checkUnlocks` runs
2. 5.7b gets unlocked, `tierUnlocked` fires for 5.7b ✓
3. But `checkUnlocks` also continues past 5.7b (Bug 1) and doesn't break
4. Meanwhile, if `setOverrides` or `restoreFromServer` runs during the same load, it clears + re-checks (Bug 2), firing `tierUnlocked` for modes 5.1a, 5.1b, 5.2a, etc.
5. The auto-advance for one of these earlier re-discovered modes fires (Bug 3), navigating to 5.2

### Bug 4: `currentTier` reset on re-check

Both `setOverrides` (line 298) and `restoreFromServer` (line 432) set:
```js
this.currentTier = this.unlockedTiers[0] || null;
```

This snaps the player back to the **first mode** (5.1a) regardless of where they were working. Even without the auto-advance race, this loses the student's position.

---

## Proposed Fixes

### Fix 1: Add `break` to `checkUnlocks`

When a tier cannot be unlocked, stop the loop. Sequential unlocking means no later tier can be unlocked either.

```js
// game-engine.js:226-233
if (previousUnlocked && previousModeStars.gold >= requiredGold) {
  this.unlockedTiers.push(tier.id);
  this.onTierUnlocked(tier);
  this.saveState();
} else {
  break;  // ← ADD THIS
}
```

### Fix 2: Suppress `onTierUnlocked` during bulk re-checks

When clearing and re-checking unlocks, remember the old set and only fire `onTierUnlocked` for *genuinely new* unlocks.

```js
// game-engine.js — new helper method
recheckUnlocks() {
  const previouslyUnlocked = new Set(this.unlockedTiers);
  this.unlockedTiers = [];

  // Temporarily suppress tier unlock events
  const originalCallback = this.onTierUnlocked;
  this.onTierUnlocked = (tier) => {
    if (!previouslyUnlocked.has(tier.id)) {
      originalCallback.call(this, tier);  // Only fire for genuinely new unlocks
    }
  };

  this.checkUnlocks(this.unlockRules);
  this.onTierUnlocked = originalCallback;
}
```

Then use `recheckUnlocks()` in `setOverrides`, `updateOverride`, `removeOverride`, and `restoreFromServer` instead of the raw clear + `checkUnlocks` pattern.

### Fix 3: Auto-advance only to the *next sequential* mode

The `tierUnlocked` event handler should only auto-advance if the unlocked tier is the **immediate successor** of the student's current mode.

```js
// app.html — platform:tierUnlocked handler
document.addEventListener('platform:tierUnlocked', (e) => {
  const tier = e.detail;
  const currentModeId = platform.gameEngine.currentTier;
  const modeOrder = platform.gameEngine.modeOrder;
  const currentIndex = modeOrder.indexOf(currentModeId);
  const unlockedIndex = modeOrder.indexOf(tier.id);

  // Only auto-advance if this is the next mode after current
  const isNextMode = (unlockedIndex === currentIndex + 1);

  // Show toast for any unlock, but only auto-advance for the next mode
  const message = tier.celebrationMessage || `Level unlocked: ${tier.name}!`;
  celebration.showToast(message, 'success', 5000, { ... });
  renderModeTabs();

  if (isNextMode) {
    setTimeout(async () => { await goToNewLevel(); }, 3000);
  }
});
```

### Fix 4: Preserve `currentTier` across re-checks

Don't reset `currentTier` to `unlockedTiers[0]` if the student's current tier is still valid.

```js
// In setOverrides and restoreFromServer:
const savedTier = this.currentTier;
this.recheckUnlocks();
// Restore currentTier if it's still unlocked, otherwise fall back to first
this.currentTier = this.unlockedTiers.includes(savedTier)
  ? savedTier
  : (this.unlockedTiers[0] || null);
```

---

## Files to Change

| File | Lines | Change |
|------|-------|--------|
| `platform/core/game-engine.js` | 226-233 | Add `else { break; }` to `checkUnlocks` |
| `platform/core/game-engine.js` | new | Add `recheckUnlocks()` helper method |
| `platform/core/game-engine.js` | 291-300 | `setOverrides`: use `recheckUnlocks`, preserve `currentTier` |
| `platform/core/game-engine.js` | 305-312 | `updateOverride`: use `recheckUnlocks` |
| `platform/core/game-engine.js` | 317-324 | `removeOverride`: use `recheckUnlocks` |
| `platform/core/game-engine.js` | 428-432 | `restoreFromServer`: use `recheckUnlocks`, preserve `currentTier` |
| `platform/app.html` | 4217-4266 | Gate auto-advance on `isNextMode` check |

## Testing

- Earn gold on mode N → only mode N+1 unlocks, auto-advance goes to N+1
- Load cartridge with existing progress → no spurious `tierUnlocked` toasts
- Teacher changes override → student stays on current mode, no navigation
- Server restore → student stays on current mode, no navigation
- Fresh start → first mode unlocks normally
- Capstone requiring 3 gold → blocks until 3 gold earned, no later modes leak through
