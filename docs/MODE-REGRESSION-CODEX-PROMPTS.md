# Mode Regression Fix — Codex Prompts

> **Companion to**: `docs/MODE-REGRESSION-FIX-SPEC.md`
> **Date**: 2026-03-02

## Dependency Diagram

```
Wave 1 (all parallel):
  B1: game-engine.js    A1: apstatu4l1l2    A3: a2t3l3       A5: a2-div-poly
                        A2: add-sub-poly    A4: a2t3l3-quiz
       │
       ▼
Wave 2 (after B1):
  B2: platform.js
       │
       ▼
Wave 3 (after B2):
  B3: app.html
```

6 agents in Wave 1, 1 in Wave 2, 1 in Wave 3. The 5 manifest changes (A1–A5) are fire-and-forget — they don't block anything else.

---

## Wave 1 — All 6 run in parallel (no dependencies)

### Prompt B1: `game-engine.js` — Core engine fixes

In `platform/core/game-engine.js`, make these 3 changes:

1. **`setTier()` (line ~490)**: Add a `force` parameter. When `force=true`, skip the `unlockedTiers` check and set `currentTier` unconditionally.

```javascript
// BEFORE:
setTier(tierId) {
  if (this.unlockedTiers.includes(tierId)) {

// AFTER:
setTier(tierId, force = false) {
  if (force || this.unlockedTiers.includes(tierId)) {
```

2. **`setOverrides()` (lines ~318–328)**: After `recheckUnlocks()`, do NOT reset `currentTier` to first unlocked. Only set `currentTier` if it was `null` (never initialized). Remove the `savedTier`/ternary pattern.

```javascript
// BEFORE:
const savedTier = this.currentTier;
this.recheckUnlocks();
this.currentTier = this.unlockedTiers.includes(savedTier)
  ? savedTier
  : (this.unlockedTiers[0] || null);

// AFTER:
this.recheckUnlocks();
if (!this.currentTier) {
  this.currentTier = this.unlockedTiers[0] || null;
}
```

3. **`restoreFromServer()` (lines ~456–460)**: Same pattern as #2. After `recheckUnlocks()`, preserve `currentTier`. Only fallback if `null`.

```javascript
// BEFORE:
const savedTier = this.currentTier;
this.recheckUnlocks();
this.currentTier = this.unlockedTiers.includes(savedTier)
  ? savedTier
  : (this.unlockedTiers[0] || null);

// AFTER:
this.recheckUnlocks();
if (!this.currentTier) {
  this.currentTier = this.unlockedTiers[0] || null;
}
```

Run: `npx vitest run tests/core/`

---

### Prompt A1: `apstatu4l1l2` manifest — Capstone standardization

In `cartridges/apstatu4l1l2/manifest.json`, find these 5 capstone modes and change their `unlockedBy` from `{"gold": 1}` to `{"gold": 3}`:

- `l11-capstone` (4.1–4.2 Capstone)
- `l24-mixed-4-4-5` (4.4–4.5 Capstone)
- `l32-mixed-4-6` (4.6 Capstone)
- `l40-interpret-params` (4.7–4.8 Capstone)
- `l48-capstone-49` (4.9 Capstone)

Do NOT change `l54-binomial-capstone` or `l62-unit4-capstone-1012` — those already have `{"gold": 3}`. Do NOT change any other modes.

---

### Prompt A2: `adding-subtracting-polynomials` manifest

In `cartridges/adding-subtracting-polynomials/manifest.json`, find mode `l15-closure-and-numbers` (the final capstone mode) and change its `unlockedBy` from `{"gold": 1}` to `{"gold": 3}`.

Change only this one mode. All other modes stay as-is.

---

### Prompt A3: `a2t3l3` manifest

In `cartridges/a2t3l3/manifest.json`, find mode `l06-binomial-term-error` (the final capstone mode) and change its `unlockedBy` from `{"gold": 1}` to `{"gold": 3}`.

Change only this one mode. All other modes stay as-is.

---

### Prompt A4: `a2t3l3-quiz` manifest

In `cartridges/a2t3l3-quiz/manifest.json`, find these 5 modes and change their `unlockedBy` from `{"gold": 2}` to `{"gold": 1}`:

- `l02-find-a-and-b`
- `l03-factor-cubes`
- `l04-explain-identity`
- `l05-binomial-term-coeff`
- `l06-full-expansion`

These are regular levels, not capstones. The standard requirement for regular levels is 1 gold star on the previous level.

---

### Prompt A5: `a2-dividing-polynomials` manifest

In `cartridges/a2-dividing-polynomials/manifest.json`, find these 4 modes and simplify their `unlockedBy` to `{"gold": 1}`:

- `remainder-theorem-verify`: currently `{"gold": 3, "modes": ["remainder-eval", "long-division"]}`
- `factor-and-quotient`: currently `{"gold": 5, "modes": ["remainder-theorem-verify"]}`
- `quotient-expression`: currently `{"gold": 5, "modes": ["factor-and-quotient"]}`
- `is-it-a-factor`: currently `{"gold": 8, "modes": ["remainder-eval"]}`

Replace each with just `{"gold": 1}`. The `"modes"` arrays are dead code — the engine uses strict sequential unlocking and never reads this key. The first two modes (`remainder-eval`, `long-division`) should keep `"default"`.

---

## Wave 2 — After B1 completes

### Prompt B2: `platform.js` — Propagate force + fix loadCartridge

In `platform/platform.js`, make these 2 changes. These depend on `game-engine.js` already having a `force` parameter on `setTier()`.

1. **`setMode()` (line ~170)**: Pass the `force` parameter through to `gameEngine.setTier()`.

```javascript
// BEFORE:
this.gameEngine.setTier(modeId);

// AFTER:
this.gameEngine.setTier(modeId, force);
```

2. **`loadCartridge()` (lines ~119–131)**: Replace the fallback logic with a force-set. If `platform.currentMode` is set, the engine must accept it unconditionally to prevent desync.

```javascript
// BEFORE:
if (this.currentMode) {
  const success = this.gameEngine.setTier(this.currentMode);
  if (!success) {
    console.warn(`[Platform] Failed to set tier ...`);
    const firstUnlocked = this.gameEngine.unlockedTiers[0] || modes[0]?.id;
    if (firstUnlocked) {
      this.currentMode = firstUnlocked;
      this.gameEngine.setTier(firstUnlocked);
    }
  }
  console.log(`[Platform] Synced gameEngine.currentTier: ...`);
}

// AFTER:
if (this.currentMode) {
  this.gameEngine.setTier(this.currentMode, true);
  console.log(`[Platform] Synced gameEngine.currentTier: ${this.gameEngine.currentTier}`);
}
```

Run: `npx vitest run tests/core/`

---

## Wave 3 — After B2 completes

### Prompt B3: `app.html` — Auto-advance fix + deep-link persistence

In `platform/app.html`, make these 4 changes:

1. **tierUnlocked handler (line ~4222–4224)**: Use `platform.currentMode` instead of `gameEngine.currentTier` as the source of truth for "what mode the student is on."

```javascript
// BEFORE:
const gameEngine = platform?.gameEngine;
const currentModeId = gameEngine?.currentTier;
const modeOrder = gameEngine?.modeOrder || [];

// AFTER:
const currentModeId = platform?.currentMode;
const modeOrder = platform?.gameEngine?.modeOrder || [];
```

2. **Deep-link persistence (line ~4685)**: After `platform.setMode` succeeds for a URL-requested level, store the forced mode in `sessionStorage` so it survives page refresh.

After the existing line:
```javascript
platform.setMode(targetMode.id, isTeacher && !studentUnlocked);
```
Add:
```javascript
sessionStorage.setItem('driller_forcedMode', targetMode.id);
```

Also in `handleLockedLevelContinue()` (~line 4006), after:
```javascript
platform.setMode(mode.id, true);
```
Add:
```javascript
sessionStorage.setItem('driller_forcedMode', mode.id);
```

3. **Restore forced mode on cartridge load (line ~4661)**: Before the `requestedStartLevel` check, check `sessionStorage` for a persisted forced mode.

Insert before `if (requestedStartLevel) {`:
```javascript
if (!requestedStartLevel) {
  const forcedMode = sessionStorage.getItem('driller_forcedMode');
  if (forcedMode) {
    requestedStartLevel = { type: 'id', value: forcedMode };
    console.log('[App] Restored forced mode from session:', forcedMode);
  }
}
```

4. **Clear forced mode on manual navigation**: In the mode tab click handler (search for `renderModeTabs` or mode tab click), when a student manually clicks a tab to switch modes, add:
```javascript
sessionStorage.removeItem('driller_forcedMode');
```

Run: `npm test`
