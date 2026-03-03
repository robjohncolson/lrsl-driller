# Progression Test Fix — Codex Prompts

> **Companion to**: `docs/PROGRESSION-TEST-FIX-SPEC.md`
> **Date**: 2026-03-03

## Dependency Diagram

```
Wave 1 (single prompt, no dependencies):
  P1: game-engine-progression-fix.test.js — fix 3 failing tests
```

Single-file, single-wave change.

---

## Wave 1

### Prompt P1: `game-engine-progression-fix.test.js` — Fix test prerequisites for sequential progression

In `tests/core/game-engine-progression-fix.test.js`, 3 tests fail because they assume non-capstone modes auto-unlock. The engine uses strict sequential progression — each level requires gold stars on the previous level. Fix the 3 tests by adding proper prerequisite star setup.

**Helper**: Add this helper function inside the top-level `describe` block (after the `beforeEach`/`afterEach`, before the first nested `describe`):

```javascript
/** Give 1 gold star to each of modes l01–l08 so the full non-capstone chain unlocks */
function setupFullUnlockChain(engine) {
  const preceding = [
    'l01-sampling-variability', 'l02-sampling-dist-concept', 'l03-sample-size-effect',
    'l04-pop-vs-sampling-dist', 'l05-mean-sd-sampling', 'l06-normal-approx',
    'l07-assess-normality', 'l08-sampling-proportions'
  ];
  for (const id of preceding) {
    engine.starsPerMode[id] = { gold: 1, silver: 0, bronze: 0, tin: 0 };
  }
}
```

**Test 1** (line 77, "unlocks every non-capstone mode without earning any stars"):

Replace the entire test with:

```javascript
it('unlocks levels sequentially as gold stars are earned on each', () => {
  engine.loadCartridge(apStatsManifest);

  // Only l01 should be unlocked initially (it's "default")
  expect(engine.unlockedTiers).toEqual(['l01-sampling-variability']);

  // Give l01 one gold star, recheck → l02 should unlock
  engine.starsPerMode['l01-sampling-variability'] = { gold: 1, silver: 0, bronze: 0, tin: 0 };
  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);
  expect(engine.unlockedTiers).toContain('l02-sampling-dist-concept');

  // Give all l01–l08 one gold star → all non-capstones through l09 should unlock
  setupFullUnlockChain(engine);
  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);
  expect(engine.unlockedTiers).toContain('l09-inference-preview');

  // Capstone (gold:3) should NOT unlock with only gold:1 on l09
  expect(engine.unlockedTiers).not.toContain('l10-capstone');
});
```

Also update the parent `describe` name from `'All non-capstone modes unlock immediately'` to `'Sequential progression unlocks non-capstone modes'`.

**Test 2** (line 119, "unlocks capstone after previous level earns required gold stars"):

Replace lines 120–130 with:

```javascript
it('unlocks capstone after previous level earns required gold stars', () => {
  engine.loadCartridge(apStatsManifest);

  // Build up full unlock chain through l08
  setupFullUnlockChain(engine);

  // Award 3 gold to the mode immediately before l10-capstone
  engine.starsPerMode['l09-inference-preview'] = { gold: 3, silver: 0, bronze: 0, tin: 0 };

  // Re-check unlocks
  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);

  expect(engine.unlockedTiers).toContain('l10-capstone');
});
```

**Test 6** (line 234, "falls back to highest unlocked non-capstone mode when capstone is relocked"):

Replace lines 235–263 with:

```javascript
it('falls back to highest unlocked non-capstone mode when capstone is relocked', () => {
  engine.loadCartridge(apStatsManifest);

  // Build full unlock chain and give l09 enough gold for capstone
  setupFullUnlockChain(engine);
  engine.starsPerMode['l09-inference-preview'] = { gold: 3, silver: 0, bronze: 0, tin: 0 };
  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);

  // Verify capstone is unlocked
  expect(engine.unlockedTiers).toContain('l10-capstone');

  // Student navigates to the capstone
  engine.currentTier = 'l10-capstone';

  // Teacher raises the gold requirement for the capstone beyond earned stars
  // Previous mode has 3 gold, raise requirement to 5
  engine.updateOverride('l10-capstone', 5);

  // Capstone should now be relocked
  expect(engine.unlockedTiers).not.toContain('l10-capstone');

  // currentTier should fall back to the highest unlocked non-capstone mode
  // NOT to 'l01-sampling-variability' (the first level)
  expect(engine.currentTier).not.toBe('l01-sampling-variability');

  // It should be the highest unlocked mode
  const lastUnlocked = engine.unlockedTiers[engine.unlockedTiers.length - 1];
  expect(engine.currentTier).toBe(lastUnlocked);
});
```

**What NOT to change**:
- Do not modify passing tests (Tests 2a, 3, 4, 5)
- Do not modify `game-engine.js` or any production code
- Do not modify the manifest mock (`apStatsManifest`)

**Verify**: `npx vitest run tests/core/game-engine-progression-fix.test.js` — expect 9/9 pass.
Then: `npm test` — expect 0 failures.
