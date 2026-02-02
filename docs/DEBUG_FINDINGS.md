# Debug Findings (Stability Issues)

This list includes concrete issues observed in code or documentation mismatches that can impact stability. It avoids upgrade recommendations and focuses on reproducible or evidence-backed problems.

## 1) Documented CTF/KotH flows missing in repo (Mismatch)
**Severity:** Medium (doc/feature mismatch, potential dead paths)

The state-machine documentation references CTF/KotH client modules that are not present in the repo, while server schemas exist. This creates ambiguity around whether these flows are intended to be active or historical and risks dead links in UI or documentation-based workflows.

```91:95:docs/STATE_MACHINE_CONNECTIONS.md
The state machine documentation includes active CTF/KotH flows and WebSocket messages (v4.0–v4.3), but the client-side files referenced in the doc are not present in this repo. Confirm whether these were removed intentionally or live elsewhere.
- Documented client files: `platform/game/ctf-state.js`, `ctf-panel.js`, `ctf-renderer.js`, `koth-*` (missing)
- Server schemas exist (`railway-server/migrations/009_ctf.sql`, `011_ctf_sessions.sql`, `012_game_modes.sql`)
```

**Suggested action:** Explicitly mark these sections as historical or identify the missing client modules and routes if they are meant to be active.

## 2) Inputs can stay disabled if grading throws before completion
**Severity:** Medium (UI stuck until reload)

`platform.platform.js` disables inputs at the start of grading but does not re-enable them in error paths. If grading throws before the app-level UI handlers run (e.g., runtime error in a custom `gradeField`, network error thrown before catch completes), the user can be stuck with disabled inputs until a reload.

```320:327:platform/platform.js
    this.isGrading = true;
    this.inputRenderer?.disable();

    try {
      // Collect answers
      const answers = this.inputRenderer.getAllValues();
```

```524:527:platform/platform.js
    } finally {
      this.isGrading = false;
    }
```

**Suggested action:** Ensure inputs are re-enabled on error in the grading pipeline (without changing grading behavior or topology assumptions).

## 3) Regex grading divides by zero when no required patterns
**Severity:** Low (edge case, but incorrect scoring if required list is empty)

If a rubric omits required patterns (empty array), `matchedCount / required.length` becomes `NaN`, forcing the grade to fall into the incorrect branch and marking the answer as incorrect even when the rubric is empty.

```173:182:platform/core/grading-engine.js
    // Determine score
    if (results.forbidden.length > 0) {
      results.score = 'I';
      results.feedback = `Avoid using "${results.forbidden[0]}" - it implies causation.`;
    } else {
      const scoring = rule.scoring || { all: 'E', most: 'P', few: 'I' };
      const ratio = matchedCount / required.length;

      if (ratio === 1) {
        results.score = 'E';
```

**Suggested action:** Guard against `required.length === 0` and define a stable default scoring behavior.

## 4) Weighted score mismatch between client sync and server leaderboard
**Severity:** Low to Medium (inconsistent scoring across leaderboards)

Client-side cartridge sync uses a weighted score formula that differs from the server's base points. This can lead to inconsistent rankings across the legacy and unified leaderboards.

```1561:1564:platform/app.html
      // Calculate total weighted score from stars
      // Using the scoring config: gold=4, silver=2, bronze=1, tin=0.5 base points
      // For now, use simple calculation; server can recalculate if needed
      const totalWeightedScore = (stars.gold * 4) + (stars.silver * 2) + (stars.bronze * 1) + (stars.tin * 0.5);
```

```678:692:railway-server/server.js
    const userStats = {};
    const basePoints = { gold: 4, silver: 3, bronze: 2, tin: 1 };

    for (const p of progress) {
      if (!userStats[p.username]) {
        userStats[p.username] = { gold: 0, silver: 0, bronze: 0, tin: 0, weighted_score: 0 };
      }
      if (p.star_type && userStats[p.username][p.star_type] !== undefined) {
        userStats[p.username][p.star_type]++;
      }

      // Use weighted_points if available, otherwise fall back to base calculation
      if (p.weighted_points != null) {
        userStats[p.username].weighted_score += p.weighted_points;
      } else if (p.star_type) {
        userStats[p.username].weighted_score += basePoints[p.star_type] || 0;
      }
    }
```

**Suggested action:** Align the client sync calculation with the server’s expected weighting (or document the intended divergence).
