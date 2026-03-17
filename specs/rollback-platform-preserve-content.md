# Spec: Roll Back Platform to Pre-WebGL Removal, Preserve Content

**Status:** Draft
**Filed:** 2026-03-17
**Priority:** High (app performance degraded since WebGL removal)

## Problem

On March 11, 2026, a 3-commit removal sequence (`127ee03`, `eb6ca9c`, `dbcb87f`)
disabled game modes, gutted Ghost AI / TensorFlow.js, and removed the Three.js
bundle path. A follow-up optimization commit (`620c028`) continued reshaping the
platform around that degraded state.

Subsequent refactors, TypeScript work, and bug fixes were layered on top of the
post-removal platform. A clean rollback to the last known good platform state is
preferred over surgical reverts.

## Goal

Reset `main` to the last commit before the WebGL removal (`ab638f6` - 2026-03-10
18:03), then selectively reapply the cartridge/content work added afterward.

## Rollback Target

| Commit | Date | Description |
|--------|------|-------------|
| `ab638f6` | 2026-03-10 18:03 | `pipeline: add U6 L4 content` (last known good pre-removal platform state) |

## Important Audit Corrections

The original draft spec had two history mistakes:

- `387bce0` (`fix: bypass progression gating for direct URL deep-links`) is **already an ancestor**
  of `ab638f6`. Resetting to `ab638f6` keeps the deep-link progression behavior.
- `252fe23` (`fix: add U7 cartridge to registry and wire up URL aliases`) is **already an ancestor**
  of `ab638f6`. Resetting to `ab638f6` keeps the U7 registry entry and its URL aliases.

This means:

- The deep-link URL feature the user wants (`?cartridge=...&mode=...`) is preserved by the rollback target.
- No manual reapplication of `387bce0` is needed.
- No partial cherry-pick of `252fe23` is needed.
- No manual `app.html` dropdown edits are required for U7. The target already has the alias wiring,
  and the picker is populated from `cartridges/registry.json`.

## What Gets Rolled Back (41 commits)

All commits reachable from `HEAD` and not from `ab638f6`:

- Range: `ab638f6..6f3b85a`
- Count: `41`

### Platform removal / performance-motivated changes (5 commits)

- `127ee03` - Disable game modes to resolve WebGL context conflicts
- `eb6ca9c` - Fully disable Ghost AI training and TensorFlow.js
- `dbcb87f` - Eliminate Three.js chunk and remove `@tensorflow/tfjs`
- `fc8cc68` - Remove GitNexus
- `620c028` - manualChunks + dynamic imports optimization

### Content commits to reapply after rollback (17 commits)

- `4d60445`
- `0a41b5b`
- `503de51`
- `bf084eb`
- `5ffd0fc`
- `dae591d`
- `125666d`
- `e86cdfc`
- `679d312`
- `a525b17`
- `ec10e45`
- `aa5a4c1`
- `7340495`
- `f978278`
- `6ca8140`
- `1f22f17`
- `90e0e7c`

### Bug fixes to discard for now (1 commit)

- `8416319` - Degraded-network teacher UI bug fix

### Refactoring to discard for now (10 commits)

- `3f69843` through `0e36eb2` - Phase 2 module extractions

### Tooling / meta to discard (2 commits)

- `b12fdc9` - Claude settings, hooks, specs, continuation prompt
- `adf9538` - Cross-agent state, package updates, tsconfig

### TypeScript infrastructure to discard (5 commits)

- `1a4fd52`
- `4a6339d`
- `2093a9b`
- `cdf7b8a`
- `6f3b85a`

### Cleanup to discard (1 commit)

- `23c32ea` - Prune `package-lock.json` after TF.js removal

## Preserved Automatically by the Rollback Target

These features are already present in `ab638f6` and should be treated as
preserved, not reintroduced:

### Deep-link progression bypass

- Commit: `387bce0`
- Behavior preserved:
  - `?cartridge=<id>&mode=<n>` grants direct access to the requested mode
  - a progression floor is set so forward navigation continues naturally
  - direct load and refresh round-trip tests already exist in the target tree

### U7 registry entry and aliases

- Commit: `252fe23`
- Behavior preserved:
  - `apstats-u7-mean-ci` already exists in `cartridges/registry.json`
  - aliases such as `u7`, `mci`, and `meanci` are already wired in `platform/app.html`

## Content to Cherry-Pick Back (17 commits)

These are the post-rollback content commits that should be replayed in order.
They touch `cartridges/`, `animations/`, `scripts/`, `render_batch.py`, and
`cartridges/registry.json`.

| # | Commit | Description | Files touched |
|---|--------|-------------|---------------|
| 1 | `4d60445` | U6 L10 animations (two-sample z test) | `animations/`, cartridge assets, `manim.cfg`, `render_batch.py` |
| 2 | `0a41b5b` | U7 cartridge - add `ai-grader-prompt.txt`, L3 content | `cartridges/apstats-u7-mean-ci/`, `cartridges/registry.json` |
| 3 | `503de51` | Reorder U6 modes, add verify script | cartridge manifests, `scripts/verify-cartridges.mjs` |
| 4 | `bf084eb` | U6 animation dedup - 4 new Manim scenes | `animations/`, cartridge assets, manifest, `scripts/` |
| 5 | `5ffd0fc` | Animation dedup - 20 new Manim scenes (U4 + Sampling) | `animations/` only |
| 6 | `dae591d` | U7 L4 content | `animations/`, `cartridges/apstats-u7-mean-ci/` |
| 7 | `125666d` | `render_batch.py` auto-discover fix | `render_batch.py` only |
| 8 | `e86cdfc` | U7 L5 - mean t-test drills + animations | `animations/`, `cartridges/apstats-u7-mean-ci/` |
| 9 | `679d312` | U7 L6 - CI diff two means drills + animations | `animations/`, `cartridges/apstats-u7-mean-ci/` |
| 10 | `a525b17` | U7 L7 drills + animations | `animations/`, `cartridges/apstats-u7-mean-ci/` |
| 11 | `ec10e45` | U7 L8 content | `animations/`, `cartridges/apstats-u7-mean-ci/` |
| 12 | `aa5a4c1` | U7 L9 content | `animations/`, `cartridges/apstats-u7-mean-ci/` |
| 13 | `7340495` | U8 L1 content | `animations/`, `cartridges/apstats-u8-unexpected-results/` |
| 14 | `f978278` | U8 mode name convention fix | cartridge manifest only |
| 15 | `6ca8140` | Register U8 cartridge in `registry.json` | `cartridges/registry.json` only |
| 16 | `1f22f17` | U8 L2 content | `animations/`, `cartridges/apstats-u8-unexpected-results/` |
| 17 | `90e0e7c` | U8 L3 content | `animations/` only |

## Execution Plan

### Step 0: Preflight

Make sure local tracked edits are committed or stashed before the reset.

```bash
git status --short
```

### Step 1: Archive current state

```bash
git checkout main
git branch archive/post-webgl-work HEAD
git push origin archive/post-webgl-work
```

This preserves every current commit on a named branch for later recovery.

### Step 2: Reset `main` to the rollback target

```bash
git reset --hard ab638f6
```

### Step 3: Cherry-pick the content commits back in order

```bash
git cherry-pick 4d60445 0a41b5b 503de51 bf084eb 5ffd0fc \
  dae591d 125666d e86cdfc 679d312 a525b17 \
  ec10e45 aa5a4c1 7340495 f978278 6ca8140 \
  1f22f17 90e0e7c
```

### Step 4: Do not reapply pre-target fixes

Do **not** cherry-pick these. They are already included in `ab638f6`:

- `387bce0` - deep-link progression bypass
- `252fe23` - U7 registry entry and URL aliases

### Step 5: Push rewritten `main`

```bash
git push --force-with-lease origin main
```

## Verification

### App behavior

- `npm install`
- `npm run dev`
- App loads without console errors
- Ghost system, game modes, and Three.js visualizations are functional again
- All cartridges U1-U8 are visible and loadable
- U7 remains visible through existing registry + alias wiring
- U8 becomes visible after `6ca8140` is replayed

### Deep-link behavior to preserve

- Direct navigation works:
  - `?cartridge=apstats-u5-sampling-dist&mode=5`
- Refresh round-trip works:
  - load a deep-linked mode, refresh, confirm the same mode remains active
- Forward progression from a deep-linked mode still works naturally

### Tests

```bash
npx vitest run tests/core/url-state.test.js tests/deep-link-roundtrip.test.js
npm test
```

## Conflict Risk Assessment

- **Low risk:** Most content commits touch only `cartridges/`, `animations/`, `scripts/`,
  `render_batch.py`, and `cartridges/registry.json`.
- **Medium risk:** `0a41b5b` and `6ca8140` modify `cartridges/registry.json`. Since the
  rollback target already contains the U7 entry from `252fe23`, small registry conflicts are possible.
  Resolve by preserving the target's existing U7 entry and layering the newer content additions on top.
- **No manual dropdown step:** The picker is populated from `cartridges/registry.json`, so visibility
  is driven by registry entries rather than manual `<option>` edits in `platform/app.html`.

## Recovery Path

Everything discarded by this rollback remains available on `archive/post-webgl-work`.
Pieces can be reintroduced later by cherry-picking specific commits or ranges:

- Phase 2 refactors: `3f69843..0e36eb2`
- TypeScript work: `1a4fd52 4a6339d 2093a9b cdf7b8a 6f3b85a`
- Teacher UI degraded-network fix: `8416319`
- Bundle optimization work: `620c028`
- Cleanup/meta as needed: `23c32ea`, `b12fdc9`, `adf9538`
