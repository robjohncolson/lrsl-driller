# Spec: Fix apstats-u7-mean-ci Cartridge Visibility

**Status**: Ready for implementation
**Priority**: P0 (cartridge invisible to students)
**Analyzed by**: Claude + Codex (confirmed independently)

## Problem

The `apstats-u7-mean-ci` cartridge (10 modes: Topics 7.1 + 7.2) does not appear in
the cartridge picker at https://lrsl-driller.vercel.app despite all files being deployed.

## Root Cause

The registry.json entry exists in the **git working tree** but was **never committed**.
`git show HEAD:cartridges/registry.json` ends at `apstats-u6-inference-prop`. Since
Vercel builds from commits, the deployed registry.json has no U7 entry. The picker is
populated entirely from registry.json via `CartridgeLoader.getCartridgesBySubject()`
(`platform/core/cartridge-loader.js:41`) -> `populateCartridgeList()`
(`platform/app.html:3633`). No entry = no picker button.

## Changes

### 1. Commit registry.json [P0 - fixes the bug]

The working-tree diff is already correct. Commit and push it.

```
git add cartridges/registry.json
git commit -m "fix: commit U7 registry entry so cartridge appears in picker"
git push
```

### 2. Update registry name/description to cover both topics [P1]

**File**: `cartridges/registry.json:123-128`

The current registry entry says "Constructing a Confidence Interval for a Population
Mean (7.2)" but the cartridge actually covers both 7.1 (modes l06-l10) and 7.2
(modes l01-l05). The manifest already has the correct broader title. Align the registry:

```json
{
  "id": "apstats-u7-mean-ci",
  "name": "Intro to Inference for Means (7.1) & Constructing CI for mu (7.2)",
  "subject": "AP Statistics",
  "description": "Significance-testing logic for mean differences plus one-sample t-intervals: procedures, conditions, t*, margin of error, interval construction",
  "shortCode": "MCI"
}
```

### 3. Add URL aliases [P1 - enables deep links]

**File**: `platform/app.html:5625` (inside `cartridgeAliases` in `init()`)

Add after the `'u5'` entry:

```javascript
'u6': 'apstats-u6-inference-prop',
'cip': 'apstats-u6-inference-prop',
'u7': 'apstats-u7-mean-ci',
'mci': 'apstats-u7-mean-ci',
'meanci': 'apstats-u7-mean-ci',
```

Note: `u6` and `a2-dividing-polynomials` also lack aliases (Codex caught this).
Adding `u6`/`cip` here fixes that gap too. `a2-dividing-polynomials` can use `div`.

```javascript
'div': 'a2-dividing-polynomials',
```

### 4. Update teacher shortcut list [P1 - teacher discoverability]

**File**: `platform/app.html:3188-3200` (inside `showCartridgeShortcuts()`)

The comment on line 3187 says "These must match the aliases defined in init()".
Add entries for U6 and U7 (and any other missing ones):

```javascript
const shortcuts = [
  // ... existing entries ...
  { alias: 'prob', name: 'Probability & RVs' },
  { alias: 'u5', name: 'Sampling Distributions' },
  { alias: 'u6', name: 'Inference for Proportions' },
  { alias: 'u7', name: 'Inference for Means (7.1-7.2)' },
  { alias: 'div', name: 'Dividing Polynomials' }
];
```

## Out of Scope (future)

- **Registry completeness test**: A CI check that fails if any `cartridges/*/manifest.json`
  directory lacks a matching `registry.json` entry. This would have caught this bug
  automatically. Recommended but separate PR.

## Verification

After pushing:
1. Confirm https://lrsl-driller.vercel.app/cartridges/registry.json includes `apstats-u7-mean-ci`
2. Confirm the cartridge appears in the picker under "AP Statistics"
3. Confirm `?c=u7` deep link loads the cartridge
4. Confirm `?c=u7&level=l06-identify-evidence` loads Topic 7.1 mode
5. Confirm `?c=u7&level=l01-identify-procedure` loads Topic 7.2 mode
6. Confirm teacher shortcut panel shows `?c=u7`
