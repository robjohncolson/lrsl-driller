# Progression Test Fix — Spec

> **Date**: 2026-03-03
> **Companion to**: `docs/URL-DEEPLINK-BYPASS-SPEC.md`

## Problem

3 tests fail in `tests/core/game-engine-progression-fix.test.js`. They were written for an older engine design where non-capstone modes auto-unlocked without stars. The current engine (`game-engine.js`) uses **strict sequential progression** for ALL modes — each level requires the previous level to be unlocked AND have enough gold stars (`getRequiredGold()`). These tests never set up the prerequisite stars, so the unlock chain breaks at level 2.

## Root Cause

**Test 1** ("unlocks every non-capstone mode without earning any stars"):
- Expects all 10 non-capstone modes to be in `unlockedTiers` after `loadCartridge()` with zero stars.
- Reality: Only `l01-sampling-variability` unlocks (it's `"default"`). `l02` requires 1 gold on `l01`, which has 0. Chain breaks.
- **Fix**: This test asserts a design that no longer exists. Replace it with a test that verifies sequential unlock actually works — give each mode 1 gold star, recheck, and confirm the next unlocks.

**Test 2** ("unlocks capstone after previous level earns required gold stars"):
- Sets 3 gold on `l09-inference-preview`, clears `unlockedTiers`, rechecks.
- Expects `l10-capstone` to appear. But `l02`–`l09` never unlock (no stars on `l01`–`l08`), so the chain never reaches `l10`.
- **Fix**: Give 1 gold to each of `l01`–`l08` so they all unlock in sequence, then 3 gold to `l09`, then recheck. `l10-capstone` should appear.

**Test 3** ("falls back to highest unlocked non-capstone mode when capstone is relocked"):
- Same setup issue as Test 2 — capstone never unlocks because intermediate modes aren't unlocked.
- **Fix**: Same prerequisite star setup, then proceed with the relock test.

## Affected File

`tests/core/game-engine-progression-fix.test.js` — Tests 1, 2, and 6 (lines 77–100, 119–130, 234–263)

## Design

### Test 1 → Rewrite: "Sequential progression unlocks levels when stars are earned"

Replace the test that expects auto-unlock with one that validates the actual sequential model:

```javascript
it('unlocks levels sequentially as gold stars are earned on each', () => {
  engine.loadCartridge(apStatsManifest);

  // Only l01 should be unlocked initially
  expect(engine.unlockedTiers).toEqual(['l01-sampling-variability']);

  // Give l01 one gold star → l02 should unlock
  engine.starsPerMode['l01-sampling-variability'] = { gold: 1, silver: 0, bronze: 0, tin: 0 };
  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);
  expect(engine.unlockedTiers).toContain('l02-sampling-dist-concept');

  // Give each mode 1 gold through l08 → all non-capstones through l09 should unlock
  const nonCapstones = [
    'l01-sampling-variability', 'l02-sampling-dist-concept', 'l03-sample-size-effect',
    'l04-pop-vs-sampling-dist', 'l05-mean-sd-sampling', 'l06-normal-approx',
    'l07-assess-normality', 'l08-sampling-proportions'
  ];
  for (const id of nonCapstones) {
    engine.starsPerMode[id] = { gold: 1, silver: 0, bronze: 0, tin: 0 };
  }
  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);
  expect(engine.unlockedTiers).toContain('l09-inference-preview');

  // l10-capstone should NOT be unlocked (requires gold:3 on l09, only has 0)
  expect(engine.unlockedTiers).not.toContain('l10-capstone');
});
```

### Test 2 → Fix prerequisite setup

Add gold stars to all preceding modes so the chain reaches `l10`:

```javascript
it('unlocks capstone after previous level earns required gold stars', () => {
  engine.loadCartridge(apStatsManifest);

  // Build up the full unlock chain: 1 gold on each mode through l08
  const preceding = [
    'l01-sampling-variability', 'l02-sampling-dist-concept', 'l03-sample-size-effect',
    'l04-pop-vs-sampling-dist', 'l05-mean-sd-sampling', 'l06-normal-approx',
    'l07-assess-normality', 'l08-sampling-proportions'
  ];
  for (const id of preceding) {
    engine.starsPerMode[id] = { gold: 1, silver: 0, bronze: 0, tin: 0 };
  }

  // 3 gold on the mode right before the capstone
  engine.starsPerMode['l09-inference-preview'] = { gold: 3, silver: 0, bronze: 0, tin: 0 };

  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);

  expect(engine.unlockedTiers).toContain('l10-capstone');
});
```

### Test 6 → Fix prerequisite setup (same pattern)

```javascript
it('falls back to highest unlocked non-capstone mode when capstone is relocked', () => {
  engine.loadCartridge(apStatsManifest);

  // Build up unlock chain
  const preceding = [
    'l01-sampling-variability', 'l02-sampling-dist-concept', 'l03-sample-size-effect',
    'l04-pop-vs-sampling-dist', 'l05-mean-sd-sampling', 'l06-normal-approx',
    'l07-assess-normality', 'l08-sampling-proportions'
  ];
  for (const id of preceding) {
    engine.starsPerMode[id] = { gold: 1, silver: 0, bronze: 0, tin: 0 };
  }
  engine.starsPerMode['l09-inference-preview'] = { gold: 3, silver: 0, bronze: 0, tin: 0 };

  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);

  // Verify capstone is unlocked
  expect(engine.unlockedTiers).toContain('l10-capstone');

  // Student navigates to the capstone
  engine.currentTier = 'l10-capstone';

  // Teacher raises the gold requirement beyond earned stars
  engine.updateOverride('l10-capstone', 5);

  // Capstone should now be relocked
  expect(engine.unlockedTiers).not.toContain('l10-capstone');

  // currentTier should fall back to highest unlocked, not l01
  expect(engine.currentTier).not.toBe('l01-sampling-variability');
  const lastUnlocked = engine.unlockedTiers[engine.unlockedTiers.length - 1];
  expect(engine.currentTier).toBe(lastUnlocked);
});
```

## Test Plan

Run: `npx vitest run tests/core/game-engine-progression-fix.test.js`
Expected: 9/9 pass (was 6/9)

Full suite: `npm test`
Expected: 0 failures
