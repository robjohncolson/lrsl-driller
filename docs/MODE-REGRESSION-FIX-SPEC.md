# Mode Regression Fix & Unlock Standardization Spec

> **Version**: 1.0 | **Date**: 2026-03-02 | **Status**: Draft

Students directed to a specific level via deep link (e.g., `?level=l07-xxx`) get forced back to an earlier level after completing a task. This document diagnoses the root causes, designs a permanent fix, and audits all cartridge unlock requirements for standardization.

---

## 1. Root Cause Analysis

Three interconnected bugs form a chain reaction that resets the student's mode.

### Bug 1: `gameEngine.setTier()` silently rejects forced modes

**File**: `platform/core/game-engine.js:490-497`

```javascript
setTier(tierId) {
    if (this.unlockedTiers.includes(tierId)) {  // <-- GATE
      this.currentTier = tierId;
      this.saveState();
      return true;
    }
    return false;  // <-- SILENT FAILURE
  }
```

**What happens**: When a student clicks a deep link to a locked level, `platform.setMode(modeId, force=true)` correctly sets `platform.currentMode` to the target level. But internally it calls `gameEngine.setTier(modeId)` (line `platform.js:170`), which checks `unlockedTiers.includes(tierId)` and returns `false` for locked tiers without updating `gameEngine.currentTier`.

**Result**: A desync between the two sources of truth:
- `platform.currentMode = "level-7"` (correct, what the student sees)
- `gameEngine.currentTier = "level-2"` (stale, what the engine tracks)

The `platform.setMode()` method does not check the return value of `setTier()`:

```javascript
// platform.js:168-171
this.currentMode = modeId;
// Save to game engine so it persists across refreshes
this.gameEngine.setTier(modeId);  // <-- return value ignored
this.onStateChange(this.getState());
```

### Bug 2: Stars get credited to the wrong mode

**File**: `platform/core/game-engine.js:105-109`

```javascript
// Award star if all fields correct
if (allFieldsCorrect) {
    const hintsUsed = this.hintsUsedThisProblem.size;
    const starType = this.getStarType(hintsUsed);
    this.awardStar(starType, this.currentTier);  // <-- uses gameEngine.currentTier
}
```

**What happens**: When the student completes a problem on level 7, `recordResult()` calls `awardStar(starType, this.currentTier)`. But due to the desync from Bug 1, `this.currentTier` is still `"level-2"`. The gold star is credited to level 2 instead of level 7.

**Cascade**: `awardStar()` then calls `checkUnlocks()` (line 150-152):

```javascript
// Re-check unlocks in case star earned unlocks new tier
if (this.unlockRules) {
    this.checkUnlocks(this.unlockRules);
}
```

If level 2 now has enough gold stars, level 3 gets unlocked. This fires the `platform:tierUnlocked` event, triggering the auto-advance handler.

### Bug 3: Auto-advance and server sync reset `currentTier`

Two separate code paths force `currentTier` back to the first unlocked mode.

#### 3a: Auto-advance handler (`app.html:4218-4278`)

```javascript
document.addEventListener('platform:tierUnlocked', (e) => {
    const tier = e.detail;
    const gameEngine = platform?.gameEngine;
    const currentModeId = gameEngine?.currentTier;  // <-- uses gameEngine, not platform
    const modeOrder = gameEngine?.modeOrder || [];
    const currentIndex = modeOrder.indexOf(currentModeId);
    const unlockedIndex = modeOrder.indexOf(tier.id);
    const isNextMode = currentIndex >= 0 && unlockedIndex === currentIndex + 1;
    // ...
    // If isNextMode, auto-advances the student to the newly unlocked tier
});
```

**Problem**: The handler uses `gameEngine.currentTier` (which is `"level-2"` due to the desync) to determine "current." When level 3 is unlocked, `isNextMode` evaluates to `true` because level 3 is indeed the mode after level 2. The student gets yanked from level 7 to level 3.

#### 3b: `setOverrides()` and `restoreFromServer()` reset `currentTier`

**File**: `platform/core/game-engine.js:318-328` and `456-460`

Both methods use an identical pattern:

```javascript
const savedTier = this.currentTier;
this.recheckUnlocks();
this.currentTier = this.unlockedTiers.includes(savedTier)
    ? savedTier
    : (this.unlockedTiers[0] || null);  // <-- RESET TO FIRST UNLOCKED
```

**When triggered**:
- `setOverrides()` is called when progression overrides load from server (`app.html:4625`)
- `restoreFromServer()` is called when a logged-in user's progress is synced (`app.html:4636`)

Both happen during cartridge load, after `platform.loadCartridge()` has already set `currentTier`. If server data has fewer stars than local (stale server), `recheckUnlocks()` produces a shorter `unlockedTiers` list. The saved tier (even if correctly set) isn't found in the new list, so it resets to the first unlocked mode.

### The Full Chain

```
Student deep-links to level 7
  → platform.setMode("level-7", force=true) succeeds
  → gameEngine.setTier("level-7") FAILS (locked)
  → DESYNC: platform.currentMode="level-7", gameEngine.currentTier="level-2"
  → Student works on level 7 problems
  → Student gets answer correct
  → awardStar(gold, "level-2")  ← wrong mode!
  → checkUnlocks() → level 3 unlocked!
  → tierUnlocked event fires
  → auto-advance handler: currentModeId = gameEngine.currentTier = "level-2"
  → isNextMode = true (level 3 is next after level 2)
  → goToNewLevel("level-3")
  → Student yanked from level 7 to level 3
```

Additionally, even without the auto-advance:
```
Page refresh while on level 7
  → gameEngine.loadState() restores currentTier="level-2" (that's what was saved)
  → platform.loadCartridge() sees savedTier="level-2"
  → Student starts on level 2 instead of level 7
```

---

## 2. Solution Design: "Active Mode Independence"

**Core principle**: The mode a student is currently working on should never be constrained by unlock status. Unlock gating controls which modes appear in the tab bar and which can be clicked — it should not retroactively change what the student is doing.

### 2.1 Fix `gameEngine.setTier()` — accept a `force` parameter

**File**: `platform/core/game-engine.js:490-497`

```javascript
// BEFORE
setTier(tierId) {
    if (this.unlockedTiers.includes(tierId)) {
      this.currentTier = tierId;
      this.saveState();
      return true;
    }
    return false;
}

// AFTER
setTier(tierId, force = false) {
    if (force || this.unlockedTiers.includes(tierId)) {
      this.currentTier = tierId;
      this.saveState();
      return true;
    }
    return false;
}
```

**Rationale**: When `platform.setMode()` is called with `force=true`, the engine must accept it. This eliminates the desync between `platform.currentMode` and `gameEngine.currentTier`.

### 2.2 Propagate `force` from `platform.setMode()` to `gameEngine.setTier()`

**File**: `platform/platform.js:168-171`

```javascript
// BEFORE
this.currentMode = modeId;
this.gameEngine.setTier(modeId);

// AFTER
this.currentMode = modeId;
this.gameEngine.setTier(modeId, force);
```

### 2.3 Fix `platform.loadCartridge()` — don't reset forced mode on `setTier()` failure

**File**: `platform/platform.js:119-131`

```javascript
// BEFORE
if (this.currentMode) {
    const success = this.gameEngine.setTier(this.currentMode);
    if (!success) {
      console.warn(`[Platform] Failed to set tier ${this.currentMode}, falling back to first unlocked mode`);
      const firstUnlocked = this.gameEngine.unlockedTiers[0] || modes[0]?.id;
      if (firstUnlocked) {
        this.currentMode = firstUnlocked;
        this.gameEngine.setTier(firstUnlocked);
      }
    }
}

// AFTER
if (this.currentMode) {
    // Force set tier - if platform.currentMode was set (including by deep link),
    // the engine must accept it to prevent desync
    this.gameEngine.setTier(this.currentMode, true);
}
```

### 2.4 Fix `setOverrides()` and `restoreFromServer()` — preserve `currentTier`

**File**: `platform/core/game-engine.js:318-328`

```javascript
// BEFORE (setOverrides)
setOverrides(overrides) {
    this.progressionOverrides = overrides || {};
    if (this.unlockRules) {
      const savedTier = this.currentTier;
      this.recheckUnlocks();
      this.currentTier = this.unlockedTiers.includes(savedTier)
        ? savedTier
        : (this.unlockedTiers[0] || null);
    }
}

// AFTER
setOverrides(overrides) {
    this.progressionOverrides = overrides || {};
    if (this.unlockRules) {
      this.recheckUnlocks();
      // Never reset currentTier — the student's active mode is independent of unlock state.
      // Only set to first unlocked if currentTier was never initialized.
      if (!this.currentTier) {
        this.currentTier = this.unlockedTiers[0] || null;
      }
    }
}
```

**File**: `platform/core/game-engine.js:455-460`

```javascript
// BEFORE (restoreFromServer)
const savedTier = this.currentTier;
this.recheckUnlocks();
this.currentTier = this.unlockedTiers.includes(savedTier)
    ? savedTier
    : (this.unlockedTiers[0] || null);

// AFTER
this.recheckUnlocks();
// Never reset currentTier — preserve the student's active mode.
// Only set to first unlocked if currentTier was never initialized.
if (!this.currentTier) {
    this.currentTier = this.unlockedTiers[0] || null;
}
```

**Rationale**: `currentTier` represents "what the student is working on right now." It should only change when the student explicitly navigates to a different mode. Unlock recalculation should update `unlockedTiers` (which controls the UI tab bar) but not force-change the active mode.

### 2.5 Fix auto-advance handler — use `platform.currentMode` as source of truth

**File**: `platform/app.html:4222-4227`

```javascript
// BEFORE
const gameEngine = platform?.gameEngine;
const currentModeId = gameEngine?.currentTier;
const modeOrder = gameEngine?.modeOrder || [];

// AFTER
const currentModeId = platform?.currentMode;
const modeOrder = platform?.gameEngine?.modeOrder || [];
```

**Rationale**: `platform.currentMode` is the canonical "what the student sees." Using `gameEngine.currentTier` caused the handler to think the student was on level 2 when they were actually on level 7. With the desync fixed by changes 2.1-2.3, both values should agree, but using `platform.currentMode` is semantically correct regardless.

### 2.6 Deep-link persistence across page refresh

Currently, deep-link level requests are stored in the `requestedStartLevel` variable (a runtime-only variable, `app.html:1303`). On page refresh, this is lost.

**Add to `app.html`**: After a deep-link forces a mode, store it in `sessionStorage`:

```javascript
// After successfully setting a forced mode via deep link:
sessionStorage.setItem('driller_forcedMode', targetMode.id);
```

**On cartridge load** (`app.html:4661`): Check for persisted forced mode:

```javascript
// Before checking requestedStartLevel, check sessionStorage
if (!requestedStartLevel) {
    const forcedMode = sessionStorage.getItem('driller_forcedMode');
    if (forcedMode) {
        requestedStartLevel = { type: 'id', value: forcedMode };
    }
}
```

**Clear on manual navigation**: When the student manually clicks a different mode tab, clear the forced mode:

```javascript
sessionStorage.removeItem('driller_forcedMode');
```

### 2.7 Summary of changes

| File | Method/Location | Change |
|------|----------------|--------|
| `platform/core/game-engine.js:490` | `setTier()` | Add `force` parameter |
| `platform/core/game-engine.js:318` | `setOverrides()` | Preserve `currentTier` |
| `platform/core/game-engine.js:455` | `restoreFromServer()` | Preserve `currentTier` |
| `platform/platform.js:170` | `setMode()` | Pass `force` to `setTier()` |
| `platform/platform.js:119-131` | `loadCartridge()` | Force-set tier, remove fallback |
| `platform/app.html:4222` | tierUnlocked handler | Use `platform.currentMode` |
| `platform/app.html:4661+` | Deep-link handling | `sessionStorage` persistence |
| `platform/app.html:~mode tab click` | Mode tab click handler | Clear forced mode from sessionStorage |

---

## 3. Cartridge Unlock Audit

### 3.1 Standard rules

| Mode type | `unlockedBy` value | Meaning |
|-----------|-------------------|---------|
| First mode(s) | `"default"` | Always unlocked |
| Regular level | `{"gold": 1}` | 1 gold star on previous level |
| Capstone | `{"gold": 3}` | 3 gold stars on previous level |

### 3.2 Complete audit table

Modes marked with **CHANGE** need their `unlockedBy` value updated. All others are already correct.

#### lsrl-interpretation (2 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| three-part | `"default"` | — | OK |
| paragraph | `{"gold": 1}` | — | OK |

#### lsrl-calculations (9 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| calc-zscore | `"default"` | — | OK |
| find-raw | `{"gold": 1}` | — | OK |
| compare-zscores | `{"gold": 1}` | — | OK |
| find-b | `"default"` | — | OK |
| find-a | `"default"` | — | OK |
| full-lsrl | `{"gold": 1}` | — | OK |
| std-dev | `{"gold": 1}` | — | OK |
| sign-check | `"default"` | — | OK |
| ratio-check | `{"gold": 1}` | — | OK |

#### residuals (3 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| calculate | `"default"` | — | OK |
| interpret | `{"gold": 1}` | — | OK |
| analyze | `{"gold": 1}` | — | OK |

#### leverage-points (7 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| identify-leverage | `"default"` | — | OK |
| identify-outlier | `"default"` | — | OK |
| classify-point | `{"gold": 1}` | — | OK |
| predict-slope-effect | `{"gold": 1}` | — | OK |
| predict-r-effect | `{"gold": 1}` | — | OK |
| influential-analysis | `{"gold": 1}` | — | OK |
| compare-with-without | `{"gold": 1}` | — | OK |

#### sampling (18 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| l01-chance-matters | `"default"` | — | OK |
| l02 through l13 | `{"gold": 1}` | — | OK |
| l14-capstone-sampling | `{"gold": 3}` | — | OK (capstone) |
| l15-capstone-full | `{"gold": 3}` | — | OK (capstone) |
| l16 through l18 | `{"gold": 1}` | — | OK |

#### apstats-u3l5-experimental-design (3 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| L01 | `"default"` | — | OK |
| L02 | `{"gold": 1}` | — | OK |
| L03 | `{"gold": 1}` | — | OK |

#### apstats-u3-l6-7-design-inference (4 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| L01-vocab | `"default"` | — | OK |
| L02, L03, L04 | `{"gold": 1}` | — | OK |

#### apstatu4l1l2 (62 modes) — 5 CHANGES

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| l01-random-process | `"default"` | — | OK |
| l02 through l10 | `{"gold": 1}` | — | OK |
| **l11-capstone** | `{"gold": 1}` | `{"gold": 3}` | **CHANGE** (capstone under-requirement) |
| l12 through l23 | `{"gold": 1}` | — | OK |
| **l24-mixed-4-4-5** | `{"gold": 1}` | `{"gold": 3}` | **CHANGE** (capstone under-requirement) |
| l25 through l31 | `{"gold": 1}` | — | OK |
| **l32-mixed-4-6** | `{"gold": 1}` | `{"gold": 3}` | **CHANGE** (capstone under-requirement) |
| l33 through l39 | `{"gold": 1}` | — | OK |
| **l40-interpret-params** | `{"gold": 1}` | `{"gold": 3}` | **CHANGE** (capstone under-requirement) |
| l41 through l47 | `{"gold": 1}` | — | OK |
| **l48-capstone-49** | `{"gold": 1}` | `{"gold": 3}` | **CHANGE** (capstone under-requirement) |
| l49 through l53 | `{"gold": 1}` | — | OK |
| l54-binomial-capstone | `{"gold": 3}` | — | OK (capstone) |
| l55 through l61 | `{"gold": 1}` | — | OK |
| l62-unit4-capstone-1012 | `{"gold": 3}` | — | OK (capstone) |

#### apstats-u5-sampling-dist (41 modes) — OK

All modes follow standard pattern. 8 capstones all use `{"gold": 3}`.

#### apstats-u6-inference-prop (11 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| l01-identify-evidence | `"default"` | — | OK |
| l02 through l10 | `{"gold": 1}` | — | OK |
| l11-capstone-62 | `{"gold": 3}` | — | OK (capstone) |

#### algebra2-radicals (5 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| simplify-radicals | `"default"` | — | OK |
| All others | `{"gold": 1}` | — | OK |

#### graphing-polynomials (18 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| l01-polynomial-or-not | `"default"` | — | OK |
| l02 through l17 | `{"gold": 1}` | — | OK |
| l18-capstone | `{"gold": 3}` | — | OK (capstone) |

#### adding-subtracting-polynomials (15 modes) — 1 CHANGE

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| l01-vocabulary | `"default"` | — | OK |
| l02 through l14 | `{"gold": 1}` | — | OK |
| **l15-closure-and-numbers** | `{"gold": 1}` | `{"gold": 3}` | **CHANGE** (capstone under-requirement) |

#### a2t3l3 (6 modes) — 1 CHANGE

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| l01-identity-match | `"default"` | — | OK |
| l01b through l05 | `{"gold": 1}` | — | OK |
| **l06-binomial-term-error** | `{"gold": 1}` | `{"gold": 3}` | **CHANGE** (capstone under-requirement) |

#### a2t3l3-quiz (6 modes) — 5 CHANGES

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| l01-identify-cube-type | `"default"` | — | OK |
| **l02-find-a-and-b** | `{"gold": 2}` | `{"gold": 1}` | **CHANGE** (over-requirement) |
| **l03-factor-cubes** | `{"gold": 2}` | `{"gold": 1}` | **CHANGE** (over-requirement) |
| **l04-explain-identity** | `{"gold": 2}` | `{"gold": 1}` | **CHANGE** (over-requirement) |
| **l05-binomial-term-coeff** | `{"gold": 2}` | `{"gold": 1}` | **CHANGE** (over-requirement) |
| **l06-full-expansion** | `{"gold": 2}` | `{"gold": 1}` | **CHANGE** (over-requirement) |

#### a2-dividing-polynomials (6 modes) — 4 CHANGES

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| remainder-eval | `"default"` | — | OK |
| long-division | `"default"` | — | OK |
| **remainder-theorem-verify** | `{"gold": 3, "modes": ["remainder-eval", "long-division"]}` | `{"gold": 1}` | **CHANGE** (non-standard, has modes array) |
| **factor-and-quotient** | `{"gold": 5, "modes": ["remainder-theorem-verify"]}` | `{"gold": 1}` | **CHANGE** (non-standard, has modes array) |
| **quotient-expression** | `{"gold": 5, "modes": ["factor-and-quotient"]}` | `{"gold": 1}` | **CHANGE** (non-standard, has modes array) |
| **is-it-a-factor** | `{"gold": 8, "modes": ["remainder-eval"]}` | `{"gold": 1}` | **CHANGE** (non-standard, has modes array) |

> **Note on `modes` arrays**: The `a2-dividing-polynomials` cartridge uses a non-standard `"modes"` key in its `unlockedBy` objects to gate on specific prerequisite modes. The `checkUnlocks()` method in `game-engine.js` does not parse this key — it uses strict sequential unlocking based on the previous mode's gold star count. The `"modes"` arrays are dead code that have no effect. Removing them and standardizing to `{"gold": 1}` matches the actual engine behavior.

#### mit-6-0001-lec1 (4 modes) — OK

| Mode | Current | Target | Status |
|------|---------|--------|--------|
| L01-computation-basics | `"default"` | — | OK |
| L02, L03, L04 | `{"gold": 1}` | — | OK |

### 3.3 Summary of changes needed

| Cartridge | File | Modes affected | Change |
|-----------|------|---------------|--------|
| `apstatu4l1l2` | `cartridges/apstatu4l1l2/manifest.json` | l11, l24, l32, l40, l48 (5 modes) | `{"gold": 1}` → `{"gold": 3}` |
| `adding-subtracting-polynomials` | `cartridges/adding-subtracting-polynomials/manifest.json` | l15 (1 mode) | `{"gold": 1}` → `{"gold": 3}` |
| `a2t3l3` | `cartridges/a2t3l3/manifest.json` | l06 (1 mode) | `{"gold": 1}` → `{"gold": 3}` |
| `a2t3l3-quiz` | `cartridges/a2t3l3-quiz/manifest.json` | l02-l06 (5 modes) | `{"gold": 2}` → `{"gold": 1}` |
| `a2-dividing-polynomials` | `cartridges/a2-dividing-polynomials/manifest.json` | 4 modes | Remove `modes` arrays, set `{"gold": 1}` |

**Total**: 16 mode changes across 5 manifest files.

---

## 4. Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `platform/core/game-engine.js` | 490-497 | `setTier()`: add `force` parameter |
| `platform/core/game-engine.js` | 318-328 | `setOverrides()`: preserve `currentTier` |
| `platform/core/game-engine.js` | 455-460 | `restoreFromServer()`: preserve `currentTier` |
| `platform/platform.js` | 170 | `setMode()`: pass `force` to `setTier()` |
| `platform/platform.js` | 119-131 | `loadCartridge()`: force-set tier, remove fallback |
| `platform/app.html` | 4222-4224 | tierUnlocked handler: use `platform.currentMode` |
| `platform/app.html` | 4661+ | Deep-link handling: add `sessionStorage` persistence |
| `platform/app.html` | ~mode tab click | Clear forced mode from sessionStorage |
| `cartridges/apstatu4l1l2/manifest.json` | 5 modes | Capstone gold 1 → 3 |
| `cartridges/adding-subtracting-polynomials/manifest.json` | 1 mode | Capstone gold 1 → 3 |
| `cartridges/a2t3l3/manifest.json` | 1 mode | Capstone gold 1 → 3 |
| `cartridges/a2t3l3-quiz/manifest.json` | 5 modes | Regular gold 2 → 1 |
| `cartridges/a2-dividing-polynomials/manifest.json` | 4 modes | Remove modes arrays, standardize gold |

---

## 5. Verification Plan

### 5.1 Regression test: Deep-link to locked level

1. Open `?c=prob&level=l32-mixed-4-6` as a student with no progress
2. Choose "Continue to this level" in the locked level modal
3. Complete a problem correctly (earn gold star)
4. **Expected**: Star is credited to `l32-mixed-4-6`, student stays on level 32
5. **Before fix**: Star credited to `l01`, student yanked to level 2

### 5.2 Regression test: Page refresh on forced mode

1. Deep-link to level 32 (as above)
2. Refresh the page
3. **Expected**: Student returns to level 32
4. **Before fix**: Student returns to level 1 or 2

### 5.3 Regression test: Server restore while on forced mode

1. Deep-link to level 32
2. Trigger server restore (log in while on the level)
3. **Expected**: Student stays on level 32, unlock tabs update silently
4. **Before fix**: Student yanked to first unlocked level

### 5.4 Regression test: Teacher override while student on forced mode

1. Deep-link to level 32
2. Teacher applies a progression override via dashboard
3. `setOverrides()` fires
4. **Expected**: Student stays on level 32
5. **Before fix**: Student yanked to first unlocked level

### 5.5 Normal progression (no regression)

1. Start at level 1 with no progress
2. Earn gold star on level 1
3. Level 2 unlocks, auto-advance fires
4. **Expected**: Student moves to level 2 (normal flow preserved)

### 5.6 Mastery auto-advance (no regression)

1. Earn 10 gold stars on current level
2. **Expected**: Mastery message shows, student advances to next level

### 5.7 Cartridge unlock standardization

1. Load `apstatu4l1l2` cartridge
2. Verify capstone modes (l11, l24, l32, l40, l48) require 3 gold to unlock
3. Load `a2t3l3-quiz` cartridge
4. Verify regular modes (l02-l06) require only 1 gold to unlock
5. Load `a2-dividing-polynomials` cartridge
6. Verify all non-default modes require 1 gold to unlock (no modes arrays)

### 5.8 Automated tests

Run the full test suite to ensure no regressions:

```bash
npm test
```

Specific test files to watch:
- `tests/core/game-engine.test.js` — unlock logic, tier management
- `tests/grading/` — star awarding
- `tests/server/` — server sync
