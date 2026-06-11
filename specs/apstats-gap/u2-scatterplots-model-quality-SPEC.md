# apstats-u2-scatterplots-model-quality — Scatterplots & Model Quality (2.4 + the un-drilled rest of 2.8)

DESIGN SPEC — no cartridge files exist yet. This document is the single source of truth for a later
implementation session (or Codex). Every pedagogical decision is made here; the implementer should
only translate, not re-decide.

## Meta

| Field | Value |
|-------|-------|
| ID | `apstats-u2-scatterplots-model-quality` |
| Name | Scatterplots & Model Quality (2.4, 2.8) |
| Subject | AP Statistics |
| Unit / Lesson | 2 / 4 and 8 |
| Registry shortCode | `SCAT` |
| Description | Describe scatterplots with DOFS (Direction, Outliers, Form, Strength) in context, estimate r from a plot, interpret r² and s, choose between competing models using residual plots + r², and recognize extrapolation danger. |
| Files to create | `manifest.json`, `generator.js`, `grading-rules.js`, `ai-grader-prompt.txt` (no `contexts.json` — scenario pools live in generator.js, self-contained like apstats-u1-categorical-tables) |

## CED Alignment

| Mode band | CED topic | Learning objective / EK |
|-----------|-----------|--------------------------|
| L01–L06 (DOFS) | 2.4 Representing Bivariate Quantitative Data | DAT-1.G (represent with scatterplots), DAT-1.H (describe direction, form, strength, unusual features, **in context**) |
| L07 (estimate r) | 2.4/2.5 boundary | Supports DAT-1.H strength + DAT-1.I/J correlation; estimating r visually is un-drilled anywhere else |
| L08–L10 (r², s) | 2.8 Least-Squares Regression | EKs on coefficient of determination r² ("proportion of variation in y explained by the linear relationship with x") and standard deviation of the residuals s ("typical prediction error") |
| L11 (model choice) | 2.7/2.8 synthesis | DAT-1.M residual plots + r² used **together** to choose between candidate models |
| L12 (extrapolation) | 2.8 per coverage matrix (CED files the EK under 2.6, DAT-1.K.2: predictions outside the observed x-interval are unreliable) | Extrapolation danger calls |
| L13 (capstone) | 2.4–2.8 mixed | Claim evaluation across all of the above |

## Dovetail map — what this cartridge must NOT drill

Verified by reading the three neighbor cartridges' manifests and generators:

| Neighbor cartridge | What it already drills | Hard boundary for this cartridge |
|---|---|---|
| `lsrl-interpretation` | Written interpretations of slope, y-intercept, and r (strength/direction/linear sentence) | Never ask for a slope/intercept/r interpretation sentence. L04 strength is **visual classification with r hidden**, and L06 DOFS describes the raw cloud (no regression line shown), so neither collides. |
| `residuals` | ŷ computation, residual = y − ŷ, over/under-prediction, single-model residual-plot pattern ID ("is the linear model appropriate?") | Never ask to compute a residual or name a residual-plot pattern in isolation. L11 is a **two-model comparison where r² and the residual plot conflict or corroborate** — a judgment residuals never poses. L13 archetypes 7/8 reuse a residual plot but the task is claim evaluation, not pattern naming. |
| `leverage-points` | Leverage (x far from x̄), residual size, influence on slope/r/r², remove-the-point effects | Never use the words leverage/influential and never ask about effects of removing a point. L05 outliers are strictly "departure from the overall pattern" (DOFS vocabulary), with no leverage taxonomy. |
| `lsrl-calculations` | b, a, z, SD formulas | L08 only converts r ↔ r² (not drilled there; their `find-b` uses r as a given). |

Reusable plumbing: scatterplot and residual-plot rendering is generator-supplied `graphConfig` consumed
by `platform/core/graph-engine.js` (canvas). Copy the point-cloud and regression helpers from
`cartridges/residuals/generator.js` (`generateDataPoints`, `calculateRegression`, `generateCurvedPattern`)
as the starting point — they already produce correct `graphConfig` shapes.

## Progression Overview

13 modes. `l01` unlocks by `"default"`; every other mode unlocks at `{ "gold": 3 }`, which the platform
enforces as **3 gold stars on the immediately previous mode** (strict sequential chain — `game-engine.js
checkUnlocks` reads `starsPerMode[previousModeId]`; same pattern as apstats-u8-unexpected-results).
Expect ~4–8 problems per mode to reach 3 golds.
Arc: scaffolded one-skill modes (L01–L05) → band capstone (L06) → numeracy (L07–L10) → judgment capstones (L11–L13).

| # | Mode ID | Name | CED | Input(s) | Graph | Problem shape | Grading |
|---|---------|------|-----|----------|-------|---------------|---------|
| 01 | `l01-dofs-vocab` | 2.4a: DOFS Vocabulary | 2.4 | dropdown ({{optA}}–{{optD}}) | none | Fixed 10-item vocab bank; identify component/definition | exact (E/I) |
| 02 | `l02-direction` | 2.4b: Direction | 2.4 | choice (3) | scatterplot, no line | Classify direction of a generated cloud | exact (E/I) |
| 03 | `l03-form` | 2.4c: Form | 2.4 | choice (3) | scatterplot, no line | Linear / curved / no clear pattern | exact (E/I) |
| 04 | `l04-strength` | 2.4d: Strength | 2.4 | choice (3) | scatterplot, no line, r hidden | Strong / moderate / weak from banded \|r\| | exact (E/I) |
| 05 | `l05-outlier-spot` | 2.4e: Unusual Points | 2.4 | choice (2) + dropdown (4) | scatterplot + highlight | Is the highlighted point an outlier from the pattern? Why? | exact ×2 (star = both E) |
| 06 | `l06-dofs-description` | 2.4f: Full DOFS Description | 2.4 | textarea (5 rows) | scatterplot, no line | Write D-O-F-S in context | regex rubric + AI |
| 07 | `l07-estimate-r` | 2.4g: Estimate r | 2.4/2.5 | dropdown (4 numeric, templated) | scatterplot, no line | Pick the plausible r | exact; P = right sign wrong magnitude |
| 08 | `l08-r2-conversions` | 2.8a: r ↔ r² | 2.8 | number ×2 | none | Model 1: r given → r² (%); Model 2: r² (%) + direction given → r | numeric tolerance |
| 09 | `l09-interpret-r2` | 2.8b: Interpret r² | 2.8 | textarea (4 rows) | scatterplot + LSRL | "__% of variation in y is explained by the linear relationship with x" | regex rubric + AI |
| 10 | `l10-interpret-s` | 2.8c: Interpret s | 2.8 | textarea (4 rows) | scatterplot + LSRL | "actual y typically differs from predicted by about s units" | regex rubric + AI |
| 11 | `l11-model-choice` | 2.8d: Choose the Better Model | 2.7/2.8 | choice (2) + dropdown (4) | residual plot (linear model) | Two fitted models, r² table + linear residual plot → pick + justify | exact ×2; modelWhy P-case (see L11) |
| 12 | `l12-extrapolation` | 2.8e: Extrapolation Danger | 2.8 (2.6 EK) | choice (2) + text | scatterplot + LSRL (data range only) | Is a prediction at x* reasonable? | exact + regex + AI |
| 13 | `l13-claim-check` | Capstone: Claim Check | 2.4–2.8 | choice (2) + textarea (4 rows) | residual plot for 2 of 9 archetypes, else none | Valid/Invalid verdict on a student claim + fix/defend | exact + context rubric + AI |

Input-type mix across the cartridge: dropdown ×4, choice ×7, number ×2, text ×1, textarea ×4.

Note on "composite" grading lines below (L05/L11/L13): the platform has NO problem-level composite score —
each field is graded and displayed separately, and a star is awarded only when **every** field scores E
(`platform.js` computes `allCorrect` and passes it on the last field). The composite descriptions state the
effective outcome of the per-field rules; implement only the per-field rules.

---

## Level Details

### L01 — DOFS Vocabulary (`l01-dofs-vocab`)

**Skill**: Anchor the DOFS framework (Direction, Outliers, Form, Strength) + "in context".

**Input**: `vocabChoice` — dropdown, options `["{{optA}}","{{optB}}","{{optC}}","{{optD}}"]`, placeholder "Select...".

**Generator**: fixed 10-item bank, shuffle-bag (no repeats until exhausted), options shuffled per draw.
`answers.vocabChoice.value` = exact text of the correct option as rendered.

#### Bank (10 items)

| # | Prompt | Correct | D1 | D2 | D3 | Misconceptions targeted |
|---|--------|---------|----|----|----|------------------------|
| 1 | "As x increases, y tends to decrease." Which DOFS component is this? | Direction | Form | Strength | Outliers | direction vs form confusion |
| 2 | "The points cluster tightly around a single pattern." Which component? | Strength | Direction | Form | Outliers | strength = tightness, not slope size |
| 3 | "The pattern rises quickly, then levels off in a curve." Which component? | Form | Direction | Strength | Outliers | curve ≠ negative direction |
| 4 | "One point sits far away from the overall pattern." Which component? | Outliers (unusual features) | Strength | Form | Direction | — |
| 5 | What does a POSITIVE association mean? | Above-average x values tend to come with above-average y values | The slope of the line equals +1 | All points rise from left to right with no exceptions | y is always greater than x | determinism; slope-value confusion |
| 6 | What does FORM describe? | Whether the pattern is linear or curved | Whether the relationship is positive or negative | How tightly points follow the pattern | How many points are plotted | component swap |
| 7 | What does STRENGTH describe? | How closely the points follow the form of the pattern | How steep the line is | How large the y-values are | The number of outliers | steepness ≠ strength |
| 8 | Which point deserves to be called an outlier in a scatterplot? | A point that deviates from the overall pattern of the data | The point with the largest y-value | Any point above the line | A point that must be a data-entry mistake | "largest value = outlier" |
| 9 | A complete scatterplot description must also include... | Context: the names of both variables | The sample mean of x | The regression equation | A p-value | context requirement |
| 10 | A cloud of points with no tendency for y to rise or fall as x increases shows... | No clear association | A weak positive association | A perfect association | A curved form | "weak" vs "none" |

**Hint** (`vocabChoice`): "DOFS = Direction (positive/negative), Outliers (points off the pattern), Form (linear/curved), Strength (how tight). A full description names both variables — that's the context."

**Grading**: exact match on option text. E correct, I otherwise.

---

### L02 — Direction (`l02-direction`)

**Skill**: Classify direction from a raw cloud (no line, no r shown).

**Input**: `directionChoice` — choice, options `["Positive association", "Negative association", "No clear association"]`.

**Generator**: variant weights 40% positive / 40% negative / 20% none.
- Positive/negative: pick a scenario pool whose natural `direction` matches; target \|r\| uniform in [0.60, 0.90].
- None: use a none-tagged pool (see pool table); target \|r\| ≤ 0.10.
- **Honest rule**: never render 0.10 < \|sample r\| < 0.50. After generating the cloud, compute the
  **sample r of the actual drawn points** (clamping changes it); regenerate (max 200 attempts) until the
  sample r lands in the legal zone for the variant; on failure fall back to a deterministic stored point set
  (one per variant per pool, hand-checkable). This regenerate-with-fallback loop is the same pattern as
  `buildClaimCounts` in apstats-u1-categorical-tables.

`graphConfig`: `{ type:'scatterplot', points, xLabel, yLabel, xDomain, yDomain, regression:{show:false} }`.

**Scenario text**: "A class collected data on {{xVar}} and {{yVar}} for {{n}} {{units of observation}}. Describe the DIRECTION of the association shown in the scatterplot."

**Hint** (`directionChoice`): "Scan left to right. Do the y-values tend to rise (positive), tend to fall (negative), or show no tendency at all?"

**Grading**: exact. E/I. I-feedback names the actual direction and the visual cue.

---

### L03 — Form (`l03-form`)

**Skill**: Linear vs curved vs no pattern.

**Input**: `formChoice` — choice, options `["Linear", "Curved", "No clear pattern"]`.

**Generator**: variant weights 45% linear / 40% curved / 15% none.
- Linear: linear cloud, sample \|r\| ≥ 0.60 (regenerate loop as L02).
- Curved: generate from an explicit curve chosen by the scenario's `curvedType`
  (`plateau` → y = c·(1 − e^(−kx)) shape, `decay` → exponential decay, `parabola` → vertex inside domain),
  then add noise. **Honest rules**: noise SD ≤ 8% of y-range AND curvature amplitude (max vertical gap
  between the noiseless curve and its own chord from (xmin,f(xmin)) to (xmax,f(xmax))) ≥ 25% of y-range.
  Both constraints checked on the generated curve before adding noise; this guarantees the bend is
  unmistakable and "Linear" is honestly wrong.
- None: \|sample r\| ≤ 0.10 noise cloud (none-tagged pools only).
- Curved variants only use pools with `curvedType !== null` so the context is plausible (e.g., fertilizer → yield levels off).

**Hint** (`formChoice`): "Imagine the single stroke that traces the middle of the cloud. Is it a straight line, does it bend, or is there no path at all?"

**Grading**: exact. E/I.

---

### L04 — Strength (`l04-strength`)

**Skill**: Visual strength classification with r hidden (dovetail: lsrl-interpretation gives r and asks for the sentence; here the eye must do the work).

**Input**: `strengthChoice` — choice, options `["Strong", "Moderate", "Weak"]`.

**Generator**: pick band uniformly: strong \|r\| ∈ [0.85, 0.97], moderate ∈ [0.55, 0.70], weak ∈ [0.20, 0.40].
Sign follows scenario direction. **Honest rule**: gap zones (0.40–0.55 and 0.70–0.85) are NEVER rendered —
verify on sample r of the drawn points, regenerate ≤200, deterministic fallback per band.
Linear clouds only. Graph as L02 (no line, no r).

**Hint** (`strengthChoice`): "Strong: points hug a clear path. Weak: a fuzzy cloud where the trend is barely visible. Moderate: in between. (Guide: \|r\| above ~0.8 strong, ~0.5–0.8 moderate, below ~0.5 weak.)"

**Grading**: exact. E if band correct; P if adjacent band in the right direction of the boundary the
sample r sits nearest (implementation: P when the chosen band is adjacent to the correct band AND the
sample \|r\| is within 0.07 of that band's gap edge; otherwise I). Keep this single special case — bands
were generated with gaps, so it fires rarely; it exists so a borderline-looking strong/moderate render
doesn't feel unfair.

---

### L05 — Unusual Points (`l05-outlier-spot`)

**Skill**: Decide whether a highlighted point departs from the overall pattern (DOFS "O" only — no leverage/influence language, that's `leverage-points`).

**Inputs**:
- `outlierChoice` — choice, label "Is the highlighted point an outlier from the overall pattern?", options `["Yes", "No"]`.
- `outlierWhy` — dropdown, label "Best description of the highlighted point:", options `["{{optA}}","{{optB}}","{{optC}}","{{optD}}"]`.

Why-options pool (generator picks the correct one + 3 distractors, shuffled):
- Correct when Yes: "It lies far from the overall pattern of the other points."
- Correct when No: "It is consistent with the overall pattern of the other points."
- Distractors (always honestly wrong): "It is an outlier because it has the largest x-value.",
  "It is an outlier because it has the largest y-value.", "Any point that far from the center of the plot must be a recording error.",
  "It is not an outlier because outliers are impossible in real data."

**Generator**: build a linear cloud (\|r\| ∈ [0.6, 0.9], n = 12), fit the LSRL internally (never displayed),
compute typical \|residual\| = mean absolute residual of the base cloud.
- Variant Yes (50%): inject one extra point at x in the middle 80% of the domain with \|residual\| ≥ 3.5× typical
  (direction up/down random); highlight it.
- Variant No (50%): highlight an existing point with \|residual\| ≤ 1.0× typical and x within the middle 80%.
- **Honest rule**: the gray zone (1.0×–3.5× typical) is never highlighted. Injected outlier must stay inside yDomain
  (shrink multiplier toward 3.5 if needed; if it can't fit, re-roll the cloud).

`graphConfig`: scatterplot, `regression:{show:false}`, `highlight:{index, x, y}`.
**Platform quirk (load-bearing)**: every point in `points` MUST carry an `id` equal to its array index
(`points.map((p,i) => ({...p, id: i}))`). `platform.js` maps `highlight.index` → `features.highlightId`,
and `graph-engine.js renderScatterplot` draws the red highlight only when `point.id === features.highlightId`.
The residuals/leverage-points generators omit point ids, so their highlights do not actually draw on the
initial render — do not copy that part of their graphConfig.

**Hints**:
- `outlierChoice`: "Cover the highlighted point with your thumb and see the pattern the rest of the points make. Does the highlighted point follow that pattern or sit far from it?"
- `outlierWhy`: "An outlier in a scatterplot is defined by distance from the PATTERN, not by having the biggest x or y value."

**Grading**: both exact, graded per-field (E/I each). Effective outcome: star only when both are E; a correct
`outlierChoice` with a wrong reason shows E + I (no star), which is the intended "half right" experience.

---

### L06 — Full DOFS Description (`l06-dofs-description`) — band-A capstone

**Skill**: Write the full 2.4 description: Direction, Outliers, Form, Strength, in context.

**Input**: `dofsResponse` — textarea, rows 5, placeholder
"Direction..., outlier(s)..., form..., strength..., using the variable names."

**Generator**: random direction (pos/neg), form (linear 70% / curved 30%, curved only on curved-capable pools),
strength band (as L04 incl. honest gaps), outlier present 30% (injection rule of L05). Stores in context:
`direction` ("positive"/"negative"), `form` ("linear"/"curved"), `strength` ("strong"/"moderate"/"weak"),
`hasOutlier` (bool), `xVar`, `yVar`. Graph: scatterplot, no line.

**Sample E response** (study-time pool, positive/linear/moderate/no outlier):
"There is a moderate, positive, linear association between hours studied and exam score, with no obvious outliers."

**Grading** (`regex` rubric — all `contextPattern`s built from generated truth):
| Rubric id | Required | Pattern |
|---|---|---|
| direction | yes | matches the TRUE direction only: positive → `/\b(positive|increas|rises|goes up|upward)\b/i`; negative → `/\b(negative|decreas|falls|goes down|downward)\b/i` |
| form | yes | true form only: linear → `/\blinear|straight\b/i`; curved → `/\b(curved?|nonlinear|non-linear|bends?|levels? off)\b/i` |
| strength | yes | true band word only: `new RegExp(ctx.strength, 'i')` (accept "fairly strong" etc. via substring) |
| outlier | yes when hasOutlier; optional when not | hasOutlier → `/\b(outlier|unusual|far from|stands? out)\b/i`; else → `/\bno (obvious |apparent )?(outliers?|unusual points?)\b/i` |
| context | yes | both variables: `(ctx) => new RegExp(escapeRegex(ctx.xVar),'i')` AND a second item for `ctx.yVar` (implement as two rubric rows: contextX, contextY) |

Scoring: E `maxMissing: 1`, P `maxMissing: 3`, I otherwise. (Rubric rows: direction, form, strength,
outlier, contextX, contextY = 6 rows; outlier row is required only in hasOutlier problems. Note: residuals'
`gradeRegex` has a static boolean `required` — extend the copied version so `required` may be a function of
context, e.g. `required: (ctx) => ctx.hasOutlier`, evaluated before counting missing rows.)
AI fallback (best-score-wins, house standard): wrong direction or wrong form caps at P even if fluent.

**Hint** (`dofsResponse`): "Sentence frame: 'There is a [strong/moderate/weak], [positive/negative], [linear/curved] association between {{xVar}} and {{yVar}}[, with (no) outliers ...].' Hit all four DOFS letters + both variable names."

---

### L07 — Estimate r (`l07-estimate-r`)

**Skill**: Pick the plausible correlation value for a displayed cloud.

**Input**: `rEstimate` — dropdown, label "Which value of r is most plausible for this scatterplot?",
options `["{{optA}}","{{optB}}","{{optC}}","{{optD}}"]` (numeric strings like "0.85").

**Generator**: correct r drawn from clean set `{±0.95, ±0.85, ±0.70, ±0.50, ±0.30}` (sign per scenario direction).
Distractor construction (all three always present, shuffled):
1. Sign flip, same magnitude (−r).
2. Same sign, far magnitude: pick from the clean set with \| \|d\| − \|r\| \| ≥ 0.35.
3. Sign flip of distractor 2.

**Honest rules**: the rendered cloud's sample r must be within ±0.04 of the labeled correct value
(regenerate ≤200, then deterministic fallback cloud stored per (pool, r) pair); the ≥0.35 magnitude gap
guarantees the same-sign distractor is honestly implausible. Graph: scatterplot, no line, no r.

**Hint** (`rEstimate`): "Step 1: sign — rising cloud means r > 0, falling means r < 0 (eliminate two options). Step 2: tightness — near ±0.9 hugs a line, near ±0.3 is a loose cloud."

**Grading**: chosen string === correct → E; same sign, wrong magnitude → P (feedback: "Direction right — now calibrate tightness"); opposite sign → I.

---

### L08 — r ↔ r² Conversions (`l08-r2-conversions`)

**Skill**: Move both directions between r and r²; remember the sign comes from the direction, not from r².

**Inputs**:
- `r2Percent` — number, label "Model 1: r² = ___ %", min 0, max 100, step 0.1.
- `rFromR2` — number, label "Model 2: r = ___", min −1, max 1, step 0.01.

**Generator**: every problem gives two mini-stems in `scenario`:
- Model 1: "The correlation between {{xVar1}} and {{yVar1}} is r = {{r1}}." — r1 from `{±0.2, ±0.3, ±0.4, ±0.5, ±0.6, ±0.7, ±0.8, ±0.9}` → r² % ∈ {4, 9, 16, 25, 36, 49, 64, 81} (always clean).
- Model 2: "A regression of {{yVar2}} on {{xVar2}} has r² = {{r2pct}}%, and the scatterplot shows a {{direction2}} association." — r2pct from the same clean set, direction stated explicitly → r = ±√(r²) is exact to 1 decimal.
Two different pools per problem so the stems don't blur. No graph (`graphConfig: null` — platform auto-hides the graph card).

**Hints**:
- `r2Percent`: "r² = r × r, then × 100 for percent. ({{r1}})² = ?"
- `rFromR2`: "r = ±√(r²). Convert {{r2pct}}% to a decimal first, take the square root, then attach the sign that matches the stated {{direction2}} direction."

**Grading** (numeric):
- `r2Percent`: tolerance ±0.5 → E. Special P: if \|user × 100 − expected\| ≤ 0.5 the student answered in proportion form → P, feedback "That's the proportion — express it as a percent." Else I.
- `rFromR2`: tolerance ±0.005 → E. Special P: \|user\| within tolerance of \|expected\| but wrong sign → P, feedback "Magnitude right — the sign comes from the direction of the association." Else I.

---

### L09 — Interpret r² (`l09-interpret-r2`)

**Skill**: The canonical sentence: "__% of the variation in y is explained by the linear relationship with x."

**Input**: `r2Interp` — textarea, rows 4, placeholder "___% of the variation in ___ is explained by ___".

**Generator**: line-first (see Generator Design): pick clean slope/intercept for the pool, clean r² % from
{36, 49, 64, 81} (high enough that the line is visibly sensible), build a cloud around the line whose look
roughly matches. Display: scatterplot WITH regression line + `showEquation: true`; r² stated in the
scenario text ("Computer output reports r² = 0.64."). Context vars: `r2Percent` (e.g., 64), `xVar`, `yVar`.

**Grading** (`regex` rubric):
| Rubric id | Required | Pattern |
|---|---|---|
| percentValue | yes | `(ctx) => new RegExp('\\b' + ctx.r2Percent + '\\b')` (accept "0.64" too: alternate `\b0?\.64\b`) |
| variation | yes | `/\b(variation|variability|variance)\b/i` |
| explained | yes | `/\b(explain|account|attribut)/i` |
| yVariable | yes | contextPattern on `ctx.yVar` |
| linearWithX | yes | `/\blinear\b/i` AND contextPattern on `ctx.xVar` (two rows: linearWord, xVariable) |

6 rows; scoring E `maxMissing: 1`, P `maxMissing: 3`, I otherwise.
AI fallback rules (in prompt): "% of the POINTS fall on the line" → I; "y is explained by x" with no
variation word → P; treating r² as r ("strong positive correlation of 64%") → I.

**Hint** (`r2Interp`): "Template: '{{r2Percent}}% of the variation in {{yVar}} is explained by the linear relationship with {{xVar}}.' The word 'variation' is non-negotiable — r² is about variation explained, not points on the line."

---

### L10 — Interpret s (`l10-interpret-s`)

**Skill**: The canonical sentence: "The actual y typically differs from the value predicted by the LSRL by about s units."

**Input**: `sInterp` — textarea, rows 4, placeholder "The actual ___ typically differs from the predicted value by about ___ ___."

**Generator**: line-first; s chosen clean: one-decimal value ≈ 5–12% of the pool's y-range (e.g., 4.5 points,
1.2 thousand dollars, 35 dollars). Scenario states: equation, "and the standard deviation of the residuals is s = {{sValue}} {{yUnits}}." Display: scatterplot + line + equation.

**Grading** (`regex` rubric):
| Rubric id | Required | Pattern |
|---|---|---|
| sValue | yes | contextPattern on the exact s value |
| typical | yes | `/\b(typical|on average|about|roughly|usually)\b/i` |
| predicted | yes | `/\b(predict|regression line|LSRL|model)\b/i` |
| yVariable | yes | contextPattern on `ctx.yVar` |
| units | no | contextPattern on `ctx.yUnits` |

Scoring: E `maxMissing: 1` (so units optional), P `maxMissing: 3`, I otherwise.
AI fallback rules: confusing s with the SD of y ("y values vary by 4.5 from the mean") → I; confusing s
with r²/strength → I; "average distance from the line" without context → P.

**Hint** (`sInterp`): "Template: 'The actual {{yVar}} typically differs from the value predicted by the regression line by about {{sValue}} {{yUnits}}.' s is the typical PREDICTION error — mention predicted, the number, and the variable."

---

### L11 — Choose the Better Model (`l11-model-choice`)

**Skill**: Use the linear model's residual plot AND an r² table together; learn that a curved residual plot
overrules a big r², and that random scatter + comparable r² means keep the simpler linear model.

**Inputs**:
- `modelChoice` — choice, label "Which model should be used for prediction?", options `["Model A (linear)", "Model B (curved)"]`.
- `modelWhy` — dropdown, label "Best justification:", fixed options:
  1. "The residual plot for the linear model shows leftover curvature, so the curved model captures the pattern better."
  2. "The residual plot for the linear model shows random scatter, so the linear model is appropriate."
  3. "Model A has a large r², so the linear model must be appropriate."
  4. "Curved models are more flexible, so Model B is always the better choice."

**Generator**: scenario text presents both fits, e.g. "Two models were fit to the data. Model A (linear): r² = {{r2A}}. Model B ({{modelBFamily}}): r² = {{r2B}}. The residual plot for MODEL A is shown."
`modelBFamily` ∈ {"quadratic", "exponential"} per the pool's `curvedType`.
- Variant (a), 50% — curved truth: residual plot built synthetically: residuals = parabola over x (amplitude A)
  + noise with SD ≤ A/2.5 (unmistakable bend). r²A ∈ {0.88, 0.90, 0.92} (the trap: big r², bad model),
  r²B = r²A + (0.03–0.06). Correct: Model B + justification 1.
- Variant (b), 50% — linear truth: residuals = pure noise around 0. r²A ∈ {0.85, 0.90, 0.93},
  r²B ∈ [r²A − 0.04, r²A + 0.01]. Correct: Model A + justification 2.
- **Honest rules**: options 3 and 4 are wrong in both variants by construction (3: in variant (a) the big-r²
  model is the bad one, in variant (b) it's a true premise but invalid reasoning — the residual plot, not r²,
  carries the justification; 4 is categorically false). Never set r²B < r²A − 0.02 in variant (a) and never
  show a borderline residual pattern: parabola amplitude ≥ 2.5× noise SD, or pure noise — nothing in between.

`graphConfig`: `{ type:'residual-plot', points: residuals, xLabel: xVar, yLabel: 'Residual', xDomain, showZeroLine: true }` (same shape `residuals` cartridge emits).

**Hints**:
- `modelChoice`: "Read the residual plot FIRST. Leftover curve → the linear model missed the pattern, no matter how big its r² is. Random scatter → linear is fine."
- `modelWhy`: "A justification must cite the residual plot. r² alone can be large even when the model is systematically wrong."

**Grading**: both exact, per-field. `modelWhy` has one P-case: in variant (b) ONLY, the generator stores the
option-3 text as `answers.modelWhy.partialOption`; gradeField returns P when the chosen text equals it,
feedback "Right model, wrong reason — r² can be high even when residuals show curvature." (In variant (b)
option 3's implied call — keep Model A — is correct, so this never rewards a wrong model pick; in variant (a)
`partialOption` is absent and option 3 grades I. This is deliberately variant-keyed, NOT keyed to the
student's `modelChoice` answer — `gradeField` never sees the student's other fields.) Effective outcome:
star = both E; right model + option 3 shows E + P.

---

### L12 — Extrapolation Danger (`l12-extrapolation`)

**Skill**: Refuse predictions outside the observed x-interval; accept them inside.

**Inputs**:
- `extrapCall` — choice, label "Is it reasonable to use this regression to make the requested prediction?", options `["Reasonable", "Not reasonable — extrapolation"]`.
- `extrapWhy` — text (single line), label "Why? (one sentence)", placeholder "Compare x = {{xStar}} to the observed data range...".

**Generator**: line-first with clean equation. Scenario states the observed range explicitly:
"Data were collected for {{xVar}} between {{xMin}} and {{xMax}} {{xUnits}}. ŷ = {{intercept}} + {{slope}}x.
A student wants to predict {{yVar}} when {{xVar}} = {{xStar}} {{xUnits}}."
- Inside variant (45%): xStar integer in [xMin + 0.25·range, xMin + 0.75·range].
- Outside variant (55%): xStar ≥ xMax + 0.30·range or ≤ xMin − 0.30·range; prefer each pool's stored
  `absurdX` targets (e.g., 40 hr/week study, 30-year-old car, age-35 child) whose predicted ŷ is physically
  absurd — generator computes ŷ(xStar) and includes it in I/E feedback ("the line predicts a price of
  −$6,200 — the pattern cannot continue").
- **Honest rule**: xStar never lands within 10% of range of the boundary — every call is clean.

Graph: scatterplot + LSRL, xDomain = observed data range only (xStar deliberately off-plot; the text carries it).

**Grading**:
- `extrapCall`: exact, E/I.
- `extrapWhy`: regex — outside variant requires `/\b(outside|beyond|extrapolat|past|out of)\b/i` AND `/\b(range|data|observed|collected|interval)\b/i`; inside variant requires `/\b(within|inside|in the range|between)\b/i` AND the same range/data row. E both rows, P one row, I none. AI fallback active (textarea-grade leniency applies to `text` fields too — the field is in the AI prompt).

**Hints**:
- `extrapCall`: "Compare x = {{xStar}} to the observed range {{xMin}}–{{xMax}}. Inside → reasonable. Outside → extrapolation: the linear pattern is only known to hold where data exist."
- `extrapWhy`: "Name the range and say which side x = {{xStar}} is on: 'x = {{xStar}} is outside the observed range of {{xMin}} to {{xMax}}, so the prediction is unreliable.'"

---

### L13 — Capstone: Claim Check (`l13-claim-check`)

**Skill**: Mixed-skill judgment. Each problem shows regression output for a pool (equation, r, r² %, s, observed
x-range — all clean, line-first) plus ONE student claim drawn from a 9-archetype shuffle bag. Student rules
Valid/Invalid and fixes or defends it.

**Inputs**:
- `claimVerdict` — choice, label "Is the student's claim valid?", options `["Valid", "Invalid"]`.
- `claimFix` — textarea, rows 4, label "If invalid, fix it. If valid, defend it in your own words."

#### Claim archetypes (validity fixed by construction; numbers filled from the problem's own stats)

| # | Claim template | Validity | What `claimFix` must contain (keywordSets, generator-supplied) |
|---|---------------|----------|---------------------------------------------------------------|
| 1 | "r² = {{r2Percent}}% means {{r2Percent}}% of the data points fall exactly on the regression line." | Invalid | ["variation"/"variability"], ["explain"/"account"] |
| 2 | "About {{r2Percent}}% of the variation in {{yVar}} is explained by the linear relationship with {{xVar}}." | Valid | ["variation"], ["explain"] (defense restates meaning) |
| 3 | "s = {{sValue}} means predictions are typically off by about {{sValue}} {{xUnits}}." (wrong units — x units) | Invalid | [{{yUnits}}], ["predict"/"residual"] |
| 4 | "The actual {{yVar}} typically differs from the predicted value by about {{sValue}} {{yUnits}}." | Valid | ["typical"/"average"/"about"], ["predict"] |
| 5 | "Since r² = {{r2Percent}}% is high, we can confidently predict {{yVar}} when {{xVar}} = {{absurdX}}." | Invalid | ["outside"/"beyond"/"extrapolat"], ["range"/"data"] |
| 6 | "Because x = {{insideX}} is within the observed range of {{xMin}} to {{xMax}}, using the line to predict there is reasonable." | Valid | ["within"/"inside"], ["range"/"data"] |
| 7 | "The linear model is appropriate because r² = {{r2Percent}}% is large." (residual plot shown: clearly curved) | Invalid | ["residual"], ["curve"/"pattern"] |
| 8 | "The residual plot shows random scatter, so a linear model is reasonable here." (residual plot shown: random) | Valid | ["residual"], ["random"/"scatter"/"no pattern"] |
| 9 | "The association is strong (r = {{r}}), which proves that increasing {{xVar}} causes {{yVar}} to change." | Invalid | ["caus"], ["correlation"/"association"/"observational"/"lurking"/"confound"] |

Graph: archetypes 7/8 emit a residual plot (built exactly as L11 variants a/b); all others `graphConfig: null`.
**Honest rules**: numbers inside Valid claims always match the displayed output verbatim; Invalid claims are
false for ANY numbers (they misstate meaning, units, scope, or causality — never "wrong arithmetic" that a
different draw could accidentally make true). Archetype 5 always uses an `absurdX` ≥ 30% outside the range.

**Grading**:
- `claimVerdict`: exact per archetype validity. E/I.
- `claimFix`: rule type `contextRubric` — grading-rules reads `context.claimFix.keywordSets` (the platform
  spreads `problem.answers` top-level into the grading context, so the path is `context.claimFix`, NOT
  `context.answers.claimFix`). `keywordSets` is an array of OR-groups; score by groups hit:
  `keywordSets.every(g => g.some(kw => normalized.includes(normalizeText(kw))))` → E, ≥ half the groups → P,
  else I. NOTE: this is the **transpose** of u1-categorical-tables' `matchesKeywordSet` (which is
  OR-of-AND-groups) — borrow only its `normalizeText`/`includes` style, write the AND-of-OR-groups matcher
  fresh. AI fallback is primary for nuance; keyword pass is the floor.
- Effective per-field outcome (no platform composite exists): star = both fields E; verdict E + fix I shows
  E + I. The AI prompt enforces "never reward a fix that contradicts the student's own verdict."

**Hints**:
- `claimVerdict`: "Test the claim against the precise meanings: r² = % of VARIATION explained (not % of points); s = typical PREDICTION error in y-units; predictions only inside the observed x-range; residual plots overrule r²; correlation never proves causation."
- `claimFix`: "If invalid: state the corrected sentence using the template language. If valid: restate why it's the correct reading of that statistic."

---

## Generator Design

### Architecture

Mirror `apstats-u1-categorical-tables/generator.js` (the modern style):
`generateProblem(modeId, context, mode)` dispatches to one `buildLXX(sharedState, rand)` per mode;
module-level `sharedState` holds per-key shuffle bags (`nextFromShuffleBag`) for scenario pools, vocab
bank items, L13 archetypes, and variant types so students see fair rotation. Each build function returns
`{ scenario, context: {...vars, levelName, problemText, givenText}, graphConfig, answers }`.
Copy `calculateRegression`, `generateDataPoints` (target-r cloud) and the curved/fan helpers from
`cartridges/residuals/generator.js` into this generator (cartridges are self-contained; no cross-imports).

### Scenario pools (embedded constant `SCENARIOS`, 12 standard + 2 none-tagged)

| id | xVar (units) | yVar (units) | xDomain | yDomain | direction | curvedType | clean line (for L09/L10/L12/L13) | s | absurdX |
|----|--------------|--------------|---------|---------|-----------|------------|----------------------------------|---|---------|
| study-time | hours studied per week (hours) | exam score (points) | [0, 12] | [40, 100] | positive | plateau | ŷ = 58 + 3.5x | 4.5 | 40 |
| car-age | age of used car (years) | resale price (thousands of dollars) | [0, 12] | [2, 40] | negative | decay | ŷ = 38 − 2.8x | 2.5 | 30 |
| ice-cream | daily high temperature (°F) | daily ice cream sales (dollars) | [55, 95] | [100, 800] | positive | null | ŷ = −650 + 15x | 60 | 20 |
| commute | commute distance (miles) | commute time (minutes) | [2, 30] | [8, 70] | positive | null | ŷ = 6 + 2x | 5 | 200 |
| screen-sleep | daily screen time (hours) | nightly sleep (hours) | [0, 8] | [5, 10] | negative | null | ŷ = 9.5 − 0.5x | 0.6 | 20 |
| height-armspan | height (cm) | arm span (cm) | [150, 190] | [145, 195] | positive | null | ŷ = 2 + x | 3 | 300 |
| free-throw | weekly practice hours (hours) | free-throw percentage (percent) | [1, 10] | [40, 90] | positive | plateau | ŷ = 42 + 4.5x | 5 | 60 |
| engine-mpg | engine size (liters) | fuel efficiency (mpg) | [1, 6] | [12, 40] | negative | decay | ŷ = 44 − 5x | 2.5 | 15 |
| latitude-temp | latitude (degrees N) | average January temperature (°F) | [25, 50] | [10, 70] | negative | null | ŷ = 125 − 2.2x | 4 | 80 |
| child-height | age of child (years) | height (cm) | [2, 10] | [80, 145] | positive | plateau | ŷ = 68 + 7.5x | 3.5 | 35 |
| bacteria | hours since noon (hours) | bacteria colony count (thousands) | [0, 10] | [5, 90] | positive | exponential | (curved-only pool: L03/L06/L11) | — | — |
| fertilizer | fertilizer applied (pounds per plot) | crop yield (bushels) | [0, 16] | [20, 60] | positive | parabola | (curved-only pool: L03/L06/L11) | — | — |
| name-length (NONE) | letters in first name (letters) | quiz score (points) | [3, 12] | [50, 100] | none | null | — | — | — |
| birthday (NONE) | day of month born (day) | height (cm) | [1, 31] | [150, 190] | none | null | — | — | — |

Pool selection rules: L02/L04 any directional pool (+ none pools for the none variant); L03/L06 curved
variants and L11 require `curvedType !== null`; L09/L10/L12/L13 require a `clean line` row (excludes
bacteria/fertilizer/none pools); L08 uses any two distinct directional pools. `interceptMeaningful` is
deliberately absent — intercept interpretation belongs to lsrl-interpretation.

### Two generation strategies (the key implementation decision)

1. **Cloud-first** (L02–L07): generate points to a target r (residuals-cartridge algorithm), compute the
   ACTUAL sample r of the drawn points, and enforce the mode's honest band on that sample value via the
   regenerate-≤200-attempts-then-deterministic-fallback loop. Nothing numeric is displayed, so ugly fitted
   coefficients never surface.
2. **Line-first** (L09, L10, L12, L13): start from the pool's stored clean equation and clean stats
   (r² %, s); scatter n = 12 points around the line with noise ≈ s so the picture matches the numbers;
   display the stored clean equation/statistics, never the refit values. This guarantees classroom-friendly
   numbers (house rule) without fighting random fits.

L11 and L13(7/8) build **residual values directly** (synthetic parabola-plus-noise or pure noise) — no
underlying cloud needed for a residual plot.

### Honest-distractor rules (consolidated)

- L02 direction: legal sample-r zones {\|r\| ≥ 0.5 with stated sign} or {\|r\| ≤ 0.10}; 0.10–0.50 never rendered.
- L03 form: curved clouds need curvature amplitude ≥ 25% of y-range and noise SD ≤ 8% of y-range; "no pattern" needs \|r\| ≤ 0.10.
- L04 strength: band gaps 0.40–0.55 and 0.70–0.85 never rendered (checked on sample r).
- L05 outlier: highlighted point is ≥ 3.5× or ≤ 1.0× the typical \|residual\| — the 1.0–3.5× gray zone is never asked about.
- L07: sample r within ±0.04 of the labeled option; magnitude distractor ≥ 0.35 away.
- L08: r and r² only from the clean perfect-square set, so both answers are exact.
- L11: residual curvature either ≥ 2.5× noise SD or zero; r² values ordered so options 3/4 are wrong in every draw.
- L12: prediction x is 25–75% inside or ≥ 30% outside; never within 10% of a boundary.
- L13: invalid claims are false by meaning (units/scope/causality), not by arithmetic; valid claims quote the displayed stats verbatim.
- Every constrained random draw uses attempt-capped regeneration (200) with a hand-checked deterministic fallback, the `buildClaimCounts` pattern.

### Number formatting

r to 2 dp in answers/options (clean set members need no rounding); r² always a whole percent; s one decimal;
slope/intercept exactly as stored in the pool table; all counts/domains integers. Use `formatNumber` helper
(residuals cartridge) for any computed display value.

---

## Grading Rules Design (`grading-rules.js`)

Per-field static `rules` map + `gradeField(fieldId, answer, context)` dispatcher (residuals-cartridge shape),
with field IDs globally unique so no mode collisions. Include `escapeRegex`. Rule table:

| Field | Type | Expected / rubric | E | P | I |
|-------|------|-------------------|---|---|---|
| `vocabChoice` | exact | `answers.vocabChoice.value` (option text) | match | — | else |
| `directionChoice` | exact | `answers.directionChoice.value` | match | — | else |
| `formChoice` | exact | `answers.formChoice.value` | match | — | else |
| `strengthChoice` | exact+ | `answers.strengthChoice.value`; context carries `sampleAbsR` and band edges | match | adjacent band AND sample \|r\| within 0.07 of the shared gap edge | else |
| `outlierChoice` | exact | `answers.outlierChoice.value` ("Yes"/"No") | match | — | else |
| `outlierWhy` | exact | option text | match | — | else |
| `dofsResponse` | regex | 6-row rubric in L06 table (contextPattern rows) | maxMissing 1 | maxMissing 3 | else |
| `rEstimate` | custom numeric-choice | parse chosen string vs `answers.rEstimate.value` | equal | same sign, different value | opposite sign |
| `r2Percent` | numeric+ | `answers.r2Percent.value`, tol 0.5 | within tol | user×100 within tol (proportion-form slip) | else |
| `rFromR2` | numeric+ | `answers.rFromR2.value`, tol 0.005 | within tol | \|user\| within tol of \|expected\| (sign slip) | else |
| `r2Interp` | regex | 6-row rubric in L09 table | maxMissing 1 | maxMissing 3 | else |
| `sInterp` | regex | 5-row rubric in L10 table (units optional) | maxMissing 1 | maxMissing 3 | else |
| `modelChoice` | exact | `answers.modelChoice.value` | match | — | else |
| `modelWhy` | exact+ | correct justification text; in variant (b) only, option-3 text also stored as `answers.modelWhy.partialOption` | match | chosen text === `partialOption` (present only in variant (b)) | else |
| `extrapCall` | exact | `answers.extrapCall.value` | match | — | else |
| `extrapWhy` | regex | 2 rows, variant-dependent contextPatterns (L12) | 2/2 | 1/2 | 0/2 |
| `claimVerdict` | exact | archetype validity | match | — | else |
| `claimFix` | contextRubric | `context.claimFix.keywordSets` (array of OR-groups; AND-of-OR-groups matcher, the transpose of u1's `matchesKeywordSet` — see L13) | all groups hit | ≥ half | else |

Notes for the implementer:
- The grading context passed to `gradeField(fieldId, answer, context)` is
  `{...problem.context, ...problem.answers, graphConfig, scenario, mode}` (`platform.js` gradeAndSubmit) —
  expected-answer objects are spread **top-level** (`context.modelWhy.value`, `context.claimFix.keywordSets`);
  there is no `context.answers`. The student's answers to OTHER fields are never passed, so no rule may
  depend on them (this is why the `modelWhy` P-case is variant-keyed, not modelChoice-keyed).
- `strengthChoice`, `modelWhy`, `rEstimate`, `r2Percent`, `rFromR2` need small custom branches inside
  `gradeField`.
- All regex feedback strings must say what was missing ("Mention the variation in {{yVar}}"), echoing
  the rubric `feedback` field per row, as residuals does.
- Numeric parsing: reuse residuals' `gradeNumeric` string-cleaning (trim, parseFloat) — students type "64%" →
  strip `%` before parsing.

## AI-Grader Prompt Outline (`ai-grader-prompt.txt`)

Handlebars-style mode blocks like `cartridges/residuals/ai-grader-prompt.txt`. Header: "You are an AP
Statistics teacher grading short responses about scatterplots and regression model quality. BE LENIENT —
grade conceptual understanding, not wording." Context header lists topic, xVar/yVar/units, and whichever of
equation / r / r² / s / x-range the mode displays.

Per-mode blocks (only textarea/text fields route to AI; choices/dropdowns/numbers stay programmatic):

- `{{#if dofsMode}}` (L06, field `dofsResponse`): correct thinking = the generated truth tuple
  (direction {{direction}}, form {{form}}, strength {{strength}}, outlier {{hasOutlier}}, both variables).
  E: ≥ 4 of 5 elements correct incl. both variables; P: ≥ 2 elements, or all elements but one stated wrongly;
  I: direction or form contradicted. Accept synonyms (rises/falls, bends/levels off, tight/loose).
- `{{#if r2Mode}}` (L09, `r2Interp`): E = % + variation + explained + y (+linear/x); P = meaning right but
  missing 'variation' or context; I = "% of points on the line" or r²-as-r.
- `{{#if sMode}}` (L10, `sInterp`): E = typical prediction error, value, y-variable; P = vague "off by about
  {{sValue}}" without prediction framing; I = SD-of-y reading or wrong units claimed.
- `{{#if extrapMode}}` (L12, `extrapWhy`): E = compares {{xStar}} to range and draws the right conclusion;
  P = right call, fuzzy reason; I = reasoning from r²/strength instead of range.
- `{{#if claimMode}}` (L13, `claimFix`): the block receives `{{claimText}}`, `{{claimValid}}`,
  `{{claimKeyIdea}}` (generator writes a one-line correct explanation per archetype). E = correct
  fix/defense hitting the key idea; P = right verdict energy but incomplete fix; I = repeats the
  misconception. Never reward a fix that contradicts the student's own verdict.

Footer (house standard): generous-E guidance + "Respond with ONLY valid JSON" + per-mode JSON shapes, e.g.
`{"dofsResponse":{"score":"E","feedback":"..."}}`,
`{"claimVerdict":{"score":"E","feedback":"..."},"claimFix":{"score":"E","feedback":"..."}}`.

## Hints Plan (`manifest.json → hints`)

`hints.perField` — one entry per field ID using the exact strings written in each Level Detail above
(they're final copy, with `{{variables}}` resolved from problem context). Field IDs are globally unique,
so no per-level hint juggling is needed (avoids the u8 `level15-18` workaround).
Penalty (house standard): `{"0":"gold","1":"silver","2":"bronze","3":"tin"}`.

## Manifest Notes

- `display`: `showGraph: true`, `graphType: "scatterplot"`, infoPanel =
  `[{Level: {{levelName}}}, {Task: {{problemText}}}, {Given: {{givenText}}}]` (u8 pattern). Modes whose
  generator returns `graphConfig: null` (L01, L08, most L13) auto-hide the graph card — verified in
  `platform/app.html` (`graphCard.classList.add('hidden')` when `!problem.graphConfig`).
- `grading.scoring`: standard E/P/I scale + meanings.
- `progression`: `streaksPerField: false`, `streakFields: ["problem"]`, tiers mirror the 13 modes with
  celebration messages (write one per mode; e.g., L06 "You can describe any scatterplot like an AP grader.",
  L13 "Model-quality claims can't fool you anymore.").
- No `animation` fields (no Manim assets exist for this cartridge yet — see Open Questions).
- Registration: add to `cartridges/registry.json` (`shortCode: "SCAT"`) and the `app.html` cartridge dropdown;
  update `specs/apstats-gap/COVERAGE-MATRIX.md` rows 2.4 and 2.8 when implemented.

## Renderer Needs

**None.** Every visual in this design uses existing `graph-engine.js` canvas types via generator-supplied
`graphConfig`: `scatterplot` (with/without `regression.show`, with `highlight`) and `residual-plot` (with
`showZeroLine`), exactly as emitted today by the residuals and lsrl-interpretation generators.
Shape notes (verified against `platform.js` translation + `graph-engine.js`): always include `xDomain` AND
`yDomain` on scatterplots with `regression.show: true` — the engine's auto-scale fallback reads
`regression.a/b` (undefined when using `slope`/`intercept` keys) and would NaN without explicit domains;
use `slope`/`intercept` keys (residuals style) since `drawEquation` destructures exactly those; top-level
`showEquation: true` maps to `features.showEquation`; and highlighted points need `id: i` (see L05).
Deliberately avoided: L11 originally wants both models' residual plots side by side; the platform renders one
graph per problem, so the design shows only the LINEAR model's residual plot and carries Model B through its
r² in text — pedagogically sufficient (the decision hinges on the linear model's leftover curvature).
If the teacher later wants the side-by-side, the concrete proposal is a new `dual-residual-plot` GraphEngine
case (two half-width residual panels sharing an x-axis, config `{type:'dual-residual-plot', panels:[{label,points},...]}`),
modeled on the existing `dual-normal-curve` branch — but it is NOT required for this spec.

## Assessment Alignment Map

| Skill on the unit test | Mode(s) |
|------------------------|---------|
| Describe a scatterplot (DOFS, in context) | L01–L06 |
| Estimate/judge correlation from a plot | L04, L07 |
| Compute/convert r and r² | L08 |
| Interpret r² in context | L09, L13(1,2) |
| Interpret s in context | L10, L13(3,4) |
| Judge model appropriateness from residual plot + r² | L11, L13(7,8) |
| Recognize extrapolation | L12, L13(5,6) |
| Correlation ≠ causation | L13(9) |

## Open Questions for the Teacher

1. **Strength-band cutoffs**: L04/L06 use \|r\| ≥ 0.85 strong / 0.55–0.70 moderate / ≤ 0.40 weak with gap
   zones. lsrl-interpretation's hint teaches 0.5/0.8 cutoffs. Keep the gapped bands (cleaner drilling), or
   align the labels to exactly 0.5/0.8 with a ±0.05 exclusion zone?
2. **L13 archetype 9 (causation)**: it leans into 3.2 scope-of-inference territory (drilled in `sampling`).
   Keep it as one capstone archetype (it's the classic r² misuse) or drop to 8 archetypes?
3. **Animations**: u8/sampling ship a Manim MP4 per mode. Should this cartridge get the same treatment
   (13 animations, e.g., "DOFS letters lighting up over a cloud", "r² as shrinking leftover variation",
   "extrapolated line walking off a cliff"), or ship without and add later via `.claude/commands/create-animations.md`?
4. **L08 second stem**: happy with the two-model double-stem (r → r² and r² + direction → r in one problem),
   or would you rather split into two thinner modes (pushes mode count to 14)?
5. **Pool review**: any scenario contexts to swap for ones your classes have already met in lsrl-interpretation
   (study-hours, car-age, ice-cream overlap with residuals/contexts.json on purpose — familiarity — but say
   the word and they'll be replaced with fresh ones).
