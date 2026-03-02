# Spec: Fix Mode Progression Regression & Remove Sequential Lock

**Status:** Draft
**Filed:** 2026-03-02
**Priority:** High (blocking student workflow)

## Problem

A student working on level 7 (`l07-assess-normality` / "5.2e: Assess Normality") in the
AP Stats Unit 5 cartridge gets booted back to level 2 (`l02-sampling-dist-concept` /
"5.1b: Sampling Distributions") instead of advancing to the next level.

## Root Causes

### Bug 1: `currentTier` reset to first level on override/restore

Three code paths in `platform/core/game-engine.js` blow away the student's current
position by resetting `currentTier` to `unlockedTiers[0]` (the very first level):

| Method | Line | Trigger |
|---|---|---|
| `setOverrides()` | ~298 | Teacher changes any progression override |
| `restoreFromServer()` | ~432 | Server sync restores progress (newer timestamp) |
| `updateOverride()` | ~309 | Teacher tweaks a single level's gold requirement |

All three clear `unlockedTiers`, re-run `checkUnlocks()`, then set
`currentTier = this.unlockedTiers[0]`. This means any teacher override change or
server sync event boots every student back to level 1, regardless of where they
actually were.

### Bug 2: Strict sequential gating no longer desired

`checkUnlocks()` (line 200) enforces strict sequential progression: each level
requires gold stars on the **previous** level, and if any level in the chain is
incomplete, all subsequent levels stay locked. The teacher has decided this
behavior is no longer wanted — students should be able to access all levels
freely without being forced through a strict linear order.

## Desired Behavior

1. **All modes unlocked by default.** Students can freely navigate to any mode/topic
   within a cartridge. The mode tabs should all be clickable from the start.

2. **No regression on sync/override.** `currentTier` must be preserved across
   override changes and server restores. The student stays on whatever level
   they were working on.

3. **Progression indicators remain.** Gold/silver/bronze/tin star tracking per mode
   still works — students can still see their progress and earn stars. The stars
   just don't gate access anymore.

4. **Capstone levels remain gated (optional consideration).** Capstone levels
   (`l10-capstone`, `l15-capstone-53`) currently require 3 gold stars on the
   previous level. Decide whether capstones should also be freely accessible or
   remain gated as a reward. **Recommendation:** Keep capstones gated — they
   serve as a mastery check and losing that signal would reduce their value.

## Changes Required

### 1. `platform/core/game-engine.js` — `checkUnlocks()`

**Current:** Strict sequential — each level requires previous level's gold stars.

**New:** Unlock all non-capstone modes immediately. Capstone modes retain their
`unlockedBy: { gold: N }` gate on the previous level.

```
checkUnlocks(tierRules):
  for each tier at index i:
    if already unlocked → skip
    if i === 0 OR unlockedBy === 'default' → unlock
    if tier is a capstone (unlockedBy.gold >= 3) → keep existing sequential check
    else → unlock immediately (no gold requirement on previous level)
```

### 2. `game-engine.js` — `setOverrides()`

**Current (line 298):**
```js
this.currentTier = this.unlockedTiers[0] || null;
```

**Fix:** Preserve `currentTier` if it's still in `unlockedTiers` after re-check:
```js
const savedTier = this.currentTier;
this.unlockedTiers = [];
this.checkUnlocks(this.unlockRules);
// Restore position if still valid, else pick highest unlocked
this.currentTier = this.unlockedTiers.includes(savedTier)
  ? savedTier
  : this.unlockedTiers[this.unlockedTiers.length - 1] || null;
```

### 3. `game-engine.js` — `restoreFromServer()`

**Current (line 432):**
```js
this.currentTier = this.unlockedTiers[0] || null;
```

**Fix:** Same pattern — preserve position:
```js
const savedTier = this.currentTier;
this.unlockedTiers = [];
if (this.unlockRules) this.checkUnlocks(this.unlockRules);
this.currentTier = this.unlockedTiers.includes(savedTier)
  ? savedTier
  : this.unlockedTiers[this.unlockedTiers.length - 1] || null;
```

### 4. `game-engine.js` — `updateOverride()` and `removeOverride()`

Same issue — they clear `unlockedTiers` and re-check but don't touch `currentTier`.
After the re-check, `currentTier` might point to a tier that's no longer in
`unlockedTiers` (if a capstone gets re-locked). Add a guard:

```js
updateOverride(modeId, goldRequired) {
  this.progressionOverrides[modeId] = goldRequired;
  if (this.unlockRules) {
    const savedTier = this.currentTier;
    this.unlockedTiers = [];
    this.checkUnlocks(this.unlockRules);
    if (!this.unlockedTiers.includes(savedTier)) {
      this.currentTier = this.unlockedTiers[this.unlockedTiers.length - 1] || null;
    }
  }
}
```

Same for `removeOverride()`.

### 5. Manifest changes — NOT required

No manifest changes needed. The `unlockedBy` fields in manifests can stay as-is
for documentation purposes. The engine-level change in `checkUnlocks()` will
override the sequential behavior. Capstones are identified by their higher gold
requirement (`gold >= 3`).

## Test Plan

### Unit tests (`tests/core/game-engine.test.js`)

1. **All non-capstone modes unlock immediately** — Load a cartridge, verify all
   modes except capstones are in `unlockedTiers` without earning any stars.

2. **Capstone modes stay locked** — Verify capstone modes (`gold >= 3`) are NOT
   in `unlockedTiers` until previous level has required gold stars.

3. **`setOverrides()` preserves currentTier** — Set student to mode 7, call
   `setOverrides()`, verify `currentTier` is still mode 7.

4. **`restoreFromServer()` preserves currentTier** — Set student to mode 7,
   mock server restore, verify `currentTier` is still mode 7.

5. **`updateOverride()` preserves currentTier** — Same pattern.

6. **Capstone relocking falls back gracefully** — Student is on capstone,
   override increases gold requirement beyond their stars, verify `currentTier`
   falls back to the highest unlocked non-capstone mode (not the first level).

### Manual QA

1. Load AP Stats Unit 5 as a student. Verify all mode tabs (5.1a through 5.2g,
   5.3a through 5.3d) are clickable without earning any stars.
2. Verify capstone tabs (5.1-5.2 Capstone, 5.3 Capstone) are locked.
3. Work on level 7 (5.2e). Have a teacher change a progression override.
   Verify the student stays on 5.2e.
4. Reload the page. Verify the student returns to 5.2e (not 5.1a).
5. Earn 3 gold stars on 5.2g. Verify capstone unlocks.

## Out of Scope

- Teacher dashboard UI changes (override controls still work, just less impactful)
- Ghost system / Ghost Orbits changes
- Other cartridge manifests (change is engine-level, applies to all cartridges)
