# Spec: Fix Layout — Header Overflow & Cramped Work Area

## Problem

When loading cartridges via URL (deep-link), the page layout breaks:
- The header becomes enormous (200+ px tall instead of ~48px)
- The work area (answer inputs) is squeezed to almost nothing
- The entire page feels zoomed-out and unusable

**Repro URL**: `app.html?cartridge=apstats-u7-mean-ci&mode=1`

## Root Cause

### 1. `app-title` h1 gets set to the full manifest name (PRIMARY)

**File**: `platform/app.html:4852`

```js
document.getElementById('app-title').textContent =
  platform.currentCartridge?.manifest?.meta?.name || 'Driller';
```

For `apstats-u7-mean-ci`, `manifest.meta.name` is a **400+ character string** listing all 9 topic titles:

> "Introducing Statistics: Should I Worry About Error? (7.1), Constructing a Confidence Interval for a Population Mean (7.2), Justifying a Claim About a Population Mean Based on a Confidence Interval (7.3), ..."

This wraps across many lines inside the header, blowing it out vertically.

### 2. `current-cartridge-name` also gets the full name

**File**: `platform/app.html:4853`

```js
document.getElementById('current-cartridge-name').textContent =
  platform.currentCartridge?.manifest?.meta?.name || cartridgeId;
```

The cartridge button text also wraps, further expanding the header.

### 3. Deep-link path vs dropdown path discrepancy

- **Dropdown path** (line 3709, 5670): Uses short name from the rendered registry option text — e.g., "Inference for Means (7.1-7.3)"
- **Deep-link/loadCartridge path** (line 4852-4853): Uses `manifest.meta.name` — the full 400+ char name

So this only breaks on deep-links and page refreshes, not when picking from the dropdown.

### 4. No overflow protection on header elements

```html
<!-- line 24 -->
<h1 id="app-title" class="text-lg font-bold text-purple-700">Driller</h1>

<!-- line 33 -->
<div id="current-cartridge-name" class="text-xs font-bold leading-tight">LSRL Interpretation</div>
```

Neither element has `truncate`, `max-w`, `overflow-hidden`, or any length constraint.

### 5. `min-h` calc assumes wrong header height

**File**: `platform/app.html:319`

```html
<main id="main-content" class="... min-h-[calc(100vh-48px)] ...">
```

Even with a normal header, the actual height is ~80-90px (header has `py-2` plus multi-row internal elements), not 48px. This doesn't cause the *primary* issue but means main content sizing is always slightly off.

### 6. Manifest `meta.name` is too verbose

**File**: `cartridges/apstats-u7-mean-ci/manifest.json:4`

The `meta.name` field contains all 9 topic titles concatenated. The short name lives in `registry.json` as "Inference for Means (7.1-7.3)". The `meta.name` field should be a short display name; the verbose listing belongs in `meta.description`.

## Fixes

### Fix A: `app-title` should always say "Driller" (line 4852)

The app title is the platform brand, not the cartridge name. The cartridge name already appears in the cartridge button right next to it.

```diff
- document.getElementById('app-title').textContent =
-   platform.currentCartridge?.manifest?.meta?.name || 'Driller';
+ // app-title stays as platform brand; cartridge name shown in cartridge button
```

**Do not** set `app-title` to the cartridge name. It should always read "Driller".

### Fix B: Use registry name for cartridge button (line 4853)

When `loadCartridge` finishes, prefer the short registry name over `manifest.meta.name`:

```js
// Prefer: registry option text > manifest short name > cartridge ID
const option = document.querySelector(`.cartridge-option[data-cartridge="${cartridgeId}"]`);
const displayName = option?.querySelector('.font-semibold')?.textContent
  || platform.currentCartridge?.manifest?.meta?.name
  || cartridgeId;
document.getElementById('current-cartridge-name').textContent = displayName;
```

This mirrors the dropdown path logic (line 3709, 5670) that already works correctly.

### Fix C: Add overflow protection to header elements (defensive)

Even with Fix A/B, add CSS safety nets:

```html
<!-- app-title: add truncate + max-w -->
<h1 id="app-title" class="text-lg font-bold text-purple-700 truncate max-w-[150px]">Driller</h1>

<!-- current-cartridge-name: add truncate + max-w -->
<div id="current-cartridge-name" class="text-xs font-bold leading-tight truncate max-w-[200px]">
```

### Fix D: Fix `min-h` header height assumption (line 319)

Replace the hardcoded 48px with a value closer to reality, or remove it:

```diff
- <main id="main-content" class="max-w-6xl mx-auto px-4 min-h-[calc(100vh-48px)] flex flex-col lg:flex-row gap-4 py-4">
+ <main id="main-content" class="max-w-6xl mx-auto px-4 min-h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 py-4">
```

Or better — drop the `min-h` entirely and let flexbox do its job since the content fills naturally.

### Fix E: Shorten manifest `meta.name` (data fix)

**File**: `cartridges/apstats-u7-mean-ci/manifest.json`

```diff
- "name": "Introducing Statistics: Should I Worry About Error? (7.1), Constructing a Confidence Interval for a Population Mean (7.2), ...(400+ chars)..."
+ "name": "Inference for Means (7.1-7.9)"
```

Move the verbose topic listing to `meta.description` (which already contains a description). The `meta.name` should match the registry name pattern used by all other cartridges.

## Testing

1. **Deep-link**: Navigate directly to `app.html?cartridge=apstats-u7-mean-ci&mode=1` — header should be one row, work area fills the screen
2. **Dropdown**: Pick cartridge from dropdown — same behavior (already works, verify no regression)
3. **Refresh**: Load via URL, then refresh — header stays compact
4. **Other cartridges**: Spot-check 2-3 other cartridges to verify no regression
5. **Mobile**: Check at 375px width — header wraps gracefully, content usable

## Priority

- Fix A + B: **Must have** — eliminates the root cause
- Fix C: **Should have** — defensive, prevents future long names from breaking layout
- Fix D: **Nice to have** — cosmetic improvement to main content sizing
- Fix E: **Should have** — data hygiene, prevents the issue if Fix A/B are ever reverted

## Files Modified

| File | Changes |
|------|---------|
| `platform/app.html:4852-4853` | Fix A + B: Stop setting app-title to cartridge name; use registry name for button |
| `platform/app.html:24,33` | Fix C: Add truncate + max-w to header elements |
| `platform/app.html:319` | Fix D: Fix min-h calc or remove it |
| `cartridges/apstats-u7-mean-ci/manifest.json:4` | Fix E: Shorten meta.name |
