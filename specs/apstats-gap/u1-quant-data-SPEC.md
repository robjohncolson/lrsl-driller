# apstats-u1-quant-data — Describing Quantitative Data (1.5–1.9 + Empirical Rule)

Design spec. Complete enough to implement the four cartridge files (`manifest.json`, `generator.js`, `grading-rules.js`, `ai-grader-prompt.txt`) without re-deciding anything pedagogical. Structure follows `cartridges/a2t3l5/SPEC.md`, adapted for a parameterized (non-fixed-bank) generator in the style of `apstats-u8-unexpected-results` and `lsrl-calculations`.

## Meta

| Field | Value |
|-------|-------|
| ID | `apstats-u1-quant-data` |
| Name | Describing Quantitative Data (1.5–1.9 + Empirical Rule) |
| Subject | AP Statistics |
| Short code (registry) | `QNT` |
| Description | Read dotplots, stemplots, and histograms; describe shape, outliers, center, and spread in context (SOCS); compute and reason about summary statistics (median, quartiles, IQR, 1.5×IQR fences, resistance, SD meaning); construct and read boxplots and modified boxplots; compare two distributions with comparative language; apply the 68–95–99.7 empirical rule. |

## CED Alignment

| CED Topic | Coverage here | Explicitly NOT here (already drilled elsewhere) |
|-----------|---------------|--------------------------------------------------|
| 1.5 Representing a Quantitative Variable with Graphs | l01–l04 (read dotplots, stemplots, histograms) | — |
| 1.6 Describing the Distribution of a Quantitative Variable | l05–l08 (shape, outliers/gaps/clusters, SOCS in context) | — |
| 1.7 Summary Statistics for a Quantitative Variable | l09–l13 (median/quartiles, range/IQR, 1.5×IQR fences, resistance, SD meaning) | 7-step SD **computation** — `lsrl-calculations` `std-dev` mode already drills it. This cartridge does SD *meaning/comparison/properties* only. |
| 1.8 Graphical Representations of Summary Statistics (boxplots) | l14–l17 (five-number summary, reading boxplots, modified boxplots, boxplot limitations) | — |
| 1.9 Comparing Distributions of a Quantitative Variable | l18–l20 (comparative language, parallel boxplots/dotplots, full comparison) | — |
| 1.10 The Normal Distribution (empirical-rule slice ONLY) | l21–l22 (68–95–99.7 percents and ranges at μ±kσ) | z-score computation (`lsrl-calculations` ×3 modes), normal areas / inverse-normal (`apstats-u5-sampling-dist` "Normal Revisited"). **Never ask for a z-score or a non-integer-σ boundary in this cartridge.** |
| Capstones | l23 (mixed numeric), l24 (describe/compare free response) | — |

U1 is 15–23% of the AP exam — the single biggest curriculum gap per `specs/apstats-gap/COVERAGE-MATRIX.md`.

## Progression Overview

24 modes. `l01` unlocks by `"default"`; every other mode `unlockedBy: { "gold": 3 }` (chain order = tier order below, the u8 pattern). With the standard hint penalty (0 hints = gold), a student typically clears a mode in 4–8 problems.

Bands: **A** Read graphs (1.5) → **B** Shape & SOCS (1.6) → **C** Summary stats (1.7) → **D** Boxplots (1.8) → **E** Comparing (1.9) → **F** Empirical rule → **G** Capstones.

| # | Mode ID | Name | CED | Input type(s) | Graph |
|---|---------|------|-----|---------------|-------|
| 01 | l01-display-vocab | 1.5a: Graph Vocabulary | 1.5 | choice | none |
| 02 | l02-read-dotplot | 1.5b: Reading a Dotplot | 1.5 | number ×2 | dotplot |
| 03 | l03-read-stemplot | 1.5c: Reading a Stemplot | 1.5 | number ×3 | stemplot (HTML `<pre>` in scenario, no canvas) |
| 04 | l04-read-histogram | 1.5d: Reading a Histogram | 1.5 | number ×2 | histogram |
| 05 | l05-identify-shape | 1.6a: Identify the Shape | 1.6 | choice | dotplot or histogram |
| 06 | l06-skew-logic | 1.6b: Skew, Tails & Center | 1.6 | choice | none |
| 07 | l07-outliers-gaps | 1.6c: Outliers, Gaps & Clusters | 1.6 | choice + number | dotplot |
| 08 | l08-socs-describe | 1.6d: Describe the Distribution (SOCS) | 1.6 | textarea (AI) | dotplot or histogram |
| 09 | l09-median-quartiles | 1.7a: Median & Quartiles | 1.7 | number ×3 | none (data list in scenario) |
| 10 | l10-range-iqr | 1.7b: Range & IQR | 1.7 | number ×2 | none |
| 11 | l11-outlier-fences | 1.7c: 1.5×IQR Outlier Fences | 1.7 | number ×2 + choice | none |
| 12 | l12-resistance | 1.7d: Resistance — Mean vs Median | 1.7 | dropdown | none |
| 13 | l13-sd-meaning | 1.7e: What Standard Deviation Means | 1.7 | dropdown | parallel dotplot (some archetypes) |
| 14 | l14-five-number | 1.8a: Five-Number Summary | 1.8 | number ×5 | none |
| 15 | l15-read-boxplot | 1.8b: Reading a Boxplot | 1.8 | number ×2 + choice | boxplot |
| 16 | l16-modified-boxplot | 1.8c: Modified Boxplots | 1.8 | number ×2 + dropdown | boxplot (modified) |
| 17 | l17-boxplot-limits | 1.8d: What a Boxplot Can(not) Show | 1.8 | choice | boxplot (some items) |
| 18 | l18-comparative-language | 1.9a: Comparative Language | 1.9 | dropdown | parallel boxplot or dotplot |
| 19 | l19-compare-boxplots | 1.9b: Compare Center & Spread | 1.9 | dropdown ×2 + number | parallel boxplot |
| 20 | l20-full-comparison | 1.9c: Full Comparison in Context | 1.9 | textarea (AI) | parallel boxplot or dotplot |
| 21 | l21-empirical-percent | 1.10a: Empirical Rule — Percents | 1.10* | number | normal-curve (exists) |
| 22 | l22-empirical-range | 1.10b: Empirical Rule — Ranges | 1.10* | number ×2 | normal-curve (exists) |
| 23 | l23-stats-capstone | Capstone: Read & Compute | 1.5/1.7/1.8 | number ×3 | dotplot / histogram / boxplot (random) |
| 24 | l24-describe-compare-capstone | Capstone: Describe & Compare | 1.6/1.9 | textarea (AI) | single or parallel display (random) |

Input mix: 4 choice-only (l01, l05, l06, l17), 5 dropdown-bearing (l12, l13, l16, l18, l19), 12 number-bearing, 3 textarea/AI. Field IDs are **mode-prefixed and globally unique** (`l09_median`, not `median`) so `hints.perField` maps cleanly — deliberately avoiding u8's `"level15-18"` hint-collision workaround.

---

## Level Details

Conventions used below:
- "Bank" = fixed scenario list rotated via per-mode shuffle bags (u8's `getShuffleBag(bankName, arr)` + `.pop()` pattern — there is no function literally named `nextScenario` in u8). "Parameterized" = values generated under constraints each draw.
- Quartile convention: **halves method, median excluded** for odd n (matches TI-84 and AP materials). Generator constraints guarantee single-value quartiles (no interpolation ever needed).
- All data values are integers; all expected stats are integers or end in .5 (classroom-friendly).
- Choice/dropdown grading is exact-match E/I unless a P case is listed.

---

### L01 — Graph Vocabulary (choice)

**Skill**: Recognize the three displays and their vocabulary.
**Input**: `l01_choice` — choice, 4 options (templated `{{optA}}`–`{{optD}}` where bank items need shuffled custom options; otherwise fixed option sets).

**Bank (12 items)** — each row: prompt / correct / distractor logic:

| # | Prompt | Correct | Distractors target |
|---|--------|---------|--------------------|
| 1 | Which display shows every individual value as a dot stacked above a number line? | Dotplot | histogram (bins), stemplot (digits), boxplot (summary) |
| 2 | Which display groups values into intervals and shows the count in each interval as a bar? | Histogram | bar graph (categorical confusion), dotplot, stemplot |
| 3 | In a stemplot with key "12 \| 3 = 123", what value does the leaf 7 on stem 14 represent? | 147 | 14.7 (key misread), 1407, 714 (reversed) |
| 4 | A histogram's vertical axis labeled "Frequency" shows… | the number of values in each interval | the value of each data point, percent of total only, the cumulative count |
| 5 | What does each leaf in a stemplot represent? | one data value's final digit | a count of values, an interval width, a percentile |
| 6 | A histogram differs from a bar graph because a histogram… | displays a quantitative variable with ordered, adjacent intervals | always shows percents, has gaps between bars, displays categories |
| 7 | Which display preserves the exact value of every observation? (dotplot of integers vs histogram) | Dotplot (and stemplot) — histogram loses exact values | histogram, "all three", boxplot |
| 8 | In a stemplot with key "5 \| 2 = 5.2", the entry stem 8 leaf 4 means… | 8.4 | 84, 8.04, 4.8 |
| 9 | The width of each histogram bar is called the… | interval (bin) width | frequency, range, spread |
| 10 | Choosing wider histogram intervals generally makes the display… | smoother but hides detail | show more detail, change the data values, taller everywhere |
| 11 | Which variable type belongs in a dotplot/stemplot/histogram? | Quantitative | categorical, either, only discrete |
| 12 | A relative frequency histogram's bar heights sum to… | 1 (or 100%) | the sample size, the range, the largest count |

**Generator**: bank + option shuffle (u8 `shuffle([correct, ...wrong])` → `optA..optD` in context; answer stored as text).
**Grading**: exact → E; else I.
**Hint** (`l01_choice`): "Dotplot = one dot per value. Stemplot = digits split into stem|leaf (read the key!). Histogram = adjacent bars counting values in each interval."

---

### L02 — Reading a Dotplot (number ×2)

**Skill**: Pull counts off a dotplot.
**Graph**: `dotplot` (renderer need #1).
**Inputs**:
- `l02_n` — number, step 1, label "How many data values are shown? n ="
- `l02_count` — number, step 1, label templated `{{l02Question}}`

**Parameterized generator**: pick context from CONTEXT_POOL; build dataset via shape recipe (any shape, n = 12–20, integer values spanning 6–10 consecutive integers). `l02Question` archetypes (rotate via shuffle bag):
1. "How many {{units}} equal exactly {{v}}?" → frequency at v (choose v with frequency ≥ 1)
2. "How many {{units}} are greater than or equal to {{v}}?" → upper-tail count (choose v so answer is neither 0 nor n)
3. "How many {{units}} are less than {{v}}?" (same non-degeneracy constraint)
4. "What is the most common value (the mode)?" → constraint: mode is unique (max frequency strictly greater than second)

**Grading**: both numeric, tolerance 0 (integers). E both correct; P exactly one correct; I otherwise.
**Hints**: `l02_n`: "Count every dot — each dot is one data value." `l02_count`: "Find {{v}} on the number line, then count the dots that satisfy the question. 'At least' includes the value itself."

---

### L03 — Reading a Stemplot (number ×3)

**Skill**: Decode stem|leaf notation with a key; find min, max, n.
**Graph**: none on canvas. The generator embeds the stemplot in `scenario` as an HTML block — `scenario` is injected via `innerHTML` (app.html `updateScenarioDisplay`), so emit:
```html
<pre style="font-family: ui-monospace, monospace; background:#f3f4f6; padding:8px 12px; border-radius:8px; display:inline-block; line-height:1.5;">
 9 | 2 5
10 | 0 3 3 7
11 | 1 4 8
12 | 6
Key: 10 | 3 = 103
</pre>
```
**Inputs**: `l03_min`, `l03_max` (number, step "any"), `l03_n` (number, step 1).

**Parameterized generator**: 3–5 consecutive stems; 1–5 leaves per stem, leaves sorted ascending; n = 8–16. Key variants (shuffle bag): leaf unit 1 ("10|3 = 103"), leaf unit 0.1 ("5|2 = 5.2"). 20% of draws use split stems (each stem twice: leaves 0–4 then 5–9) with an explicit "split stems" note — asks are unchanged. Constraint: no empty first/last stem (min/max unambiguous).
**Grading**: numeric, tolerance 0.001 (handles 0.1-unit leaves). E = 3/3, P = 2/3, I otherwise.
**Hints**: `l03_min`: "Smallest stem + its first leaf. Use the key: stem {{keyStem}} leaf {{keyLeaf}} = {{keyValue}}." `l03_max`: "Largest stem + its last leaf." `l03_n`: "Count leaves, not stems — every leaf is one data value."

---

### L04 — Reading a Histogram (number ×2)

**Skill**: Read bin frequencies; totals; relative frequency.
**Graph**: `histogram` (renderer need #2).
**Inputs**:
- `l04_a` — number, label templated `{{l04Q1}}`
- `l04_b` — number, label templated `{{l04Q2}}`

**Parameterized generator**: 5–7 bins, width 5 or 10, left-closed convention [a, b); integer counts 0–12 (at most one empty interior bin); n = 30–60. Question-pair archetypes:
1. Q1 "How many {{units}} fall in the interval {{a}} to under {{b}}?" (frequency, exact) + Q2 "How many {{units}} were recorded in all? n =" (total)
2. Q1 bin frequency + Q2 "How many {{units}} are below {{boundary}}?" (boundary always a bin edge — sum of lower bins)
3. Q1 bin frequency + Q2 "What PERCENT of {{units}} fall in the interval {{a}} to under {{b}}? (1 decimal place)" — constraint: count/n × 100 rounds cleanly (pick n ∈ {40, 50} for archetype 3 so percents end in .0 or .5)

**Grading**: archetypes 1–2 tolerance 0; archetype 3 field `l04_b` tolerance 0.15. E both; P one; I none.
**Hints**: `l04_a`: "Bar height = the count for that interval. This histogram uses intervals that include the left edge but not the right." `l04_b`: "Total n = add all bar heights. Percent = (count ÷ total) × 100."

---

### L05 — Identify the Shape (choice)

**Skill**: Name the shape of a displayed distribution.
**Graph**: dotplot (60%) or histogram (40%), built from a shape recipe.
**Input**: `l05_shape` — choice, fixed options: ["Approximately symmetric", "Skewed right", "Skewed left", "Bimodal", "Approximately uniform"].

**Parameterized generator**: pick shape uniformly from the 5; build via SHAPE_RECIPES (see Generator Design) and run the **unambiguity validators** — resample (≤50 attempts) until passed:
- skew right: mean − median ≥ 0.4·s AND right tail extends ≥ 2 more positions from the peak than the left tail; mirrored for left.
- symmetric: |mean − median| ≤ 0.1·s, single peak region, tails within ±1 position of mirror image.
- bimodal: two peaks with equal-ish heights (ratio ≤ 1.5), separated by a valley of ≥ 2 positions whose counts ≤ 50% of the smaller peak.
- uniform: max count − min count ≤ 1 across all positions, ≥ 6 positions.

**Grading**: E exact; **P if the truth is a skew and the student picked the opposite skew direction** (they saw asymmetry but reversed it — the canonical misconception, worth distinguishing from I); I otherwise.
**Hint**: "Skew direction = the direction the LONG TAIL points, not where the pile is. Two clear peaks = bimodal. Flat = uniform."

---

### L06 — Skew, Tails & Center Logic (choice)

**Skill**: Reason about skew ↔ tail direction ↔ mean/median order without a graph.
**Input**: `l06_choice` — choice, templated options.

**Bank (12 items)**:

| # | Prompt | Correct | Distractor logic |
|---|--------|---------|------------------|
| 1 | In a right-skewed distribution, the mean is typically ___ the median. | greater than | less than (flip), equal to, "cannot compare" |
| 2 | In a left-skewed distribution, the tail points toward… | smaller values | larger values, the peak, the median |
| 3 | Household incomes (a few very large values). Likely shape? | Skewed right | skewed left, symmetric, uniform |
| 4 | Easy quiz: most scored 90+, a few scored very low. Shape? | Skewed left | skewed right, bimodal, uniform |
| 5 | Mean 58, median 70 → likely shape? | Skewed left | skewed right, symmetric, bimodal |
| 6 | Mean ≈ median → likely shape? | Approximately symmetric | skewed right, skewed left, "must be uniform" |
| 7 | Heights of a mixed group of 6th graders AND adults. Likely shape? | Bimodal | symmetric, uniform, skewed right |
| 8 | Last digits of phone numbers. Likely shape? | Approximately uniform | symmetric mound, bimodal, skewed right |
| 9 | "Skewed right" means most of the DATA piles up at the ___ end. | lower (left) | upper (right) — the flip, middle, "both ends" |
| 10 | Which shape pulls the mean BELOW the median? | Skewed left | skewed right, symmetric, uniform |
| 11 | House prices in a town with a few mansions: which is larger? | mean > median | median > mean, equal, cannot tell |
| 12 | A distribution has a single peak with similar tails on both sides. Best description? | Approximately symmetric, unimodal | bimodal, skewed right, uniform |

**Generator**: bank + shuffle into `{{optA}}`–`{{optD}}`.
**Grading**: exact E / else I.
**Hint**: "Tail direction names the skew. The mean chases the tail; the median stays with the pile."

---

### L07 — Outliers, Gaps & Clusters (choice + number)

**Skill**: Spot a potential outlier on a dotplot; identify the most extreme value.
**Graph**: dotplot.
**Inputs**:
- `l07_hasOutlier` — choice ["Yes", "No"], label "Is there a value that appears to be an outlier?"
- `l07_extreme` — number, label "What is the most extreme value (the one farthest from the main cluster)?"

**Parameterized generator**: 50/50 plant an outlier.
- Outlier case: main cluster (shape recipe, n = 11–17, span ≤ 8), then one planted value separated from the cluster by a gap of ≥ 3 empty integer positions AND beyond the dataset's 1.5×IQR fence by ≥ 1 unit (verify computationally — the honest-truth rule).
- No-outlier case: cluster only; verify max and min are each strictly INSIDE the 1.5×IQR fences by ≥ 1 unit, and no gap exceeds 1 position.
`l07_extreme` answer = the planted value (outlier case) or whichever of min/max is farther from the median (no-outlier case — always well-defined; ties broken by requiring asymmetric extremes in construction).

**Grading**: E both correct (numeric tolerance 0); P `l07_hasOutlier` correct but value wrong; I otherwise.
**Hints**: `l07_hasOutlier`: "Look for a dot separated from the rest by a clear gap." `l07_extreme`: "Whether or not it's an outlier, report the value farthest from the main cluster."

---

### L08 — Describe the Distribution: SOCS (textarea, AI)

**Skill**: Full 1.6 description: Shape, Outliers, Center, Spread, **in context**.
**Graph**: dotplot (60%) or histogram (40%).
**Input**: `l08_response` — textarea, rows 5, placeholder "Describe the shape, center, spread, and any outliers — in context."

**Parameterized generator**: shape recipe + context; compute and store in `answers.l08_response`: shape word, median (accepted center range = median ± 1 for dotplots, the median's bin for histograms), range and IQR (either accepted as "spread"), outlier truth + value, required context words (the variable name + units, e.g., "commute", "minutes").
**Grading** (regex first pass in grading-rules.js, AI fallback via ai-grader-prompt.txt):
- Components checked: (1) correct shape keyword; (2) center word ("center", "median", "mean", "typical") + a number inside the accepted range; (3) spread word ("spread", "range", "IQR", "varies", "variability") + a correct number (range or IQR ±1); (4) correct outlier statement (says "no outliers" when none, or names the value when present); (5) context (variable name or units appear).
- E: ≥ 4 of 5 including context. P: 2–3 components. I: 0–1 components or wrong shape + wrong center.
**Hint**: "SOCS: Shape, Outliers, Center (give a number), Spread (give a number) — and say it in context ({{yVarPhrase}}), not 'the data'."

---

### L09 — Median & Quartiles (number ×3)

**Skill**: Order data; find median, Q1, Q3 by the halves method.
**Graph**: none. Scenario shows the UNSORTED data list (sorting is part of the skill): "Here are the {{units}} for {{n}} {{subjects}}: 14, 9, 22, …"
**Inputs**: `l09_median`, `l09_q1`, `l09_q3` — number, step "any".

**Parameterized generator**: n ∈ {7, 11, 15} (75% of draws — halves have odd length, so Q1/Q3 are single data values: n=7 → positions 2/4/6; n=11 → 3/6/9; n=15 → 4/8/12). Even-n archetype (25%): n = 8 → median = mean of 4th/5th, Q1 = mean of 2nd/3rd, Q3 = mean of 6th/7th — constrain each averaged pair to have the same parity so answers end in .0 or .5. Values: integers from the context range, duplicates allowed (≤ 2 repeats), presented shuffled.
**Grading**: numeric tolerance 0.01. E 3/3; P 2/3 **or** all three correct but median/Q-positions computed with the median included in halves (detect: matches the include-median convention's values) → P with targeted feedback; I otherwise.
**Hints**: `l09_median`: "Sort first! Median = middle value (or mean of the two middle values)." `l09_q1`: "Q1 = median of the LOWER half — do not include the overall median in either half." `l09_q3`: "Q3 = median of the UPPER half."

---

### L10 — Range & IQR (number ×2)

**Skill**: Compute range and IQR; know what each measures.
**Graph**: none. Scenario gives either (a) a five-number summary table (60%) or (b) a small sorted dataset (40%).
**Inputs**: `l10_range`, `l10_iqr` — number, step "any".

**Parameterized generator**: five-number values are strictly increasing integers; IQR ∈ {2, 4, 5, 6, 8, 10}; range ≤ 40. For dataset draws, reuse the L09 machinery (n ∈ {7, 11, 15}).
**Grading**: tolerance 0.01. E both; P exactly one, with targeted feedback if `l10_iqr` equals max−Q1 or Q3−min (common slip); I otherwise.
**Hints**: `l10_range`: "Range = maximum − minimum. One number, not 'from a to b'." `l10_iqr`: "IQR = Q3 − Q1 — the span of the middle 50%."

---

### L11 — 1.5×IQR Outlier Fences (number ×2 + choice)

**Skill**: Compute fences; classify a suspect value.
**Graph**: none. Scenario gives Q1, Q3, and a suspect value x: "Q1 = {{q1}}, Q3 = {{q3}}. Is the value {{x}} an outlier?"
**Inputs**:
- `l11_lower` — number, label "Lower fence = Q1 − 1.5×IQR ="
- `l11_upper` — number, label "Upper fence = Q3 + 1.5×IQR ="
- `l11_isOutlier` — choice ["Yes, it is an outlier", "No, it is not an outlier"]

**Parameterized generator**: IQR ∈ {2, 4, 6, 8, 10} (even → 1.5·IQR is an integer; allow IQR ∈ {3, 5} in 25% of draws so fences end in .5). Suspect x drawn 50/50 outside/inside a fence, **never within 1 unit of either fence** (honest classification — no edge cases), and below the lower fence in ~half the outside cases (students forget low outliers exist).
**Grading**: fences tolerance 0.01; choice exact. E 3/3; P both fences correct but classification wrong, or one fence wrong but classification consistent and correct; I otherwise.
**Hints**: `l11_lower`: "IQR = Q3 − Q1 = {{iqr}}. Multiply by 1.5, SUBTRACT from Q1." `l11_upper`: "Add 1.5×IQR to Q3." `l11_isOutlier`: "Outlier ⇔ below the lower fence OR above the upper fence."

---

### L12 — Resistance: Mean vs Median (dropdown)

**Skill**: Resistance of statistics; choosing measures for skewed data.
**Input**: `l12_choice` — dropdown, templated `{{optA}}`–`{{optD}}`.

**Archetypes (parameterized where marked)**:
1. *(parameterized)* "The dataset {{list}} has mean {{mean}} and median {{med}}. The value {{big}} is added. What happens?" Correct: "The mean increases noticeably; the median stays the same (or barely moves)." Distractors: both change equally / median changes more / neither changes. Constraint: build list (n = 5, integer mean) and added value ≥ mean + 3·(range) so the new mean shifts by ≥ 2 units while the median provably moves by ≤ 0.5 (verify both numerically before emitting).
2. "Which statistics are resistant to outliers?" Correct: "Median and IQR." Distractors: mean & SD / mean & IQR / median & range.
3. "A distribution is strongly skewed right. Which center & spread should be reported?" Correct: "Median and IQR." Distractors: mean & SD (the reflex answer) / mean & IQR / median & SD.
4. "Why is the mean not resistant?" Correct: "Its computation uses the actual value of every observation, so one extreme value pulls it." Distractors: it only uses the middle value / it ignores outliers / it must equal the median.
5. *(parameterized)* "Mean {{mean}} > median {{med}} for home prices. Best explanation?" Correct: "A few unusually expensive homes pull the mean up." Distractors: pull the median up / data must be symmetric / an error, mean can't exceed median.

**Grading**: exact E / else I.
**Hint**: "Resistant = barely affected by extreme values. Median & IQR resist; mean, SD, and range do not. Skewed data → report median & IQR."

---

### L13 — What Standard Deviation Means (dropdown)

**Skill**: Interpret and compare SD without computing it (complements — never duplicates — the `lsrl-calculations` 7-step computation mode).
**Graph**: archetype 2 renders a **two-group parallel dotplot**; others none.
**Input**: `l13_choice` — dropdown, templated options.

**Archetypes**:
1. *(parameterized)* Interpretation: "Quiz scores have mean {{mean}} and SD {{sd}}. Which interpretation of SD is best?" Correct: "Scores typically vary by about {{sd}} points from the mean." Distractors: "all scores are within {{sd}} points of the mean" / "the range is {{sd}}" / "the average score is {{sd}}".
2. *(parameterized, parallel dotplot)* "Both groups have mean {{mean}}. Which has the larger standard deviation?" Render two dotplots, same n and same mean, one tightly clustered (span 4) and one spread (span ≥ 10). Correct: the spread group. Distractors: tight group / equal / "cannot tell from a dotplot". Constraint: actual SDs differ by a factor ≥ 1.8 (verify numerically).
3. Properties bank: smallest possible SD ("0, when every value is identical"); "SD can never be negative"; "adding 5 to every value leaves SD unchanged"; "SD is not resistant — one outlier inflates it"; "SD's units match the data's units".

**Grading**: exact E / else I.
**Hint**: "SD ≈ the typical distance of values from the mean. More spread-out dots = bigger SD. SD ≥ 0 always; SD = 0 only if all values are equal."

---

### L14 — Five-Number Summary (number ×5)

**Skill**: Produce all boxplot construction values from raw data.
**Graph**: none. Scenario shows unsorted data (n ∈ {7, 11, 15}).
**Inputs**: `l14_min`, `l14_q1`, `l14_med`, `l14_q3`, `l14_max` — number, step "any".

**Parameterized generator**: L09 machinery; additionally require all five values distinct.
**Grading**: tolerance 0.01 each. E 5/5; P 3–4 of 5; I ≤ 2. Targeted feedback for swapped Q1/Q3.
**Hints**: per field — `l14_min`/`l14_max`: "Sort first; read the ends." `l14_q1`: "Median of the lower half (exclude the overall median)." `l14_med`: "Middle value of the full sorted list." `l14_q3`: "Median of the upper half."

---

### L15 — Reading a Boxplot (number ×2 + choice)

**Skill**: Read values and percent regions off a rendered boxplot.
**Graph**: `boxplot` (renderer need #3).
**Inputs**:
- `l15_median` — number, label "Median ="
- `l15_iqr` — number, label "IQR ="
- `l15_percent` — choice ["25%", "50%", "75%", "Cannot be determined"], label templated `{{l15PercentQ}}`

**Parameterized generator**: five-number summary of distinct integers, each a multiple of the axis tick step (step ∈ {1, 2, 5} matching the context range), pairwise separated by ≥ 2 ticks so reading is unambiguous. `l15PercentQ` archetypes: "What percent of the data is above Q1?" (75%) / "…inside the box?" (50%) / "…above the median?" (50%) / "…between the minimum and Q3?" (75%) / "…below Q1?" (25%) / "What percent of the data is between 2 specific dataset values not at quartiles?" (Cannot be determined — appears 15% of the time so the trap option is honestly used).
**Grading**: numeric tolerance 0.01; choice exact. E 3/3; P 2/3; I otherwise.
**Hints**: `l15_median`: "The line inside the box." `l15_iqr`: "Right edge of box (Q3) − left edge (Q1)." `l15_percent`: "Each whisker holds ~25%; the box holds the middle ~50%. A boxplot only pins down percents at the five summary values."

---

### L16 — Modified Boxplots (number ×2 + dropdown)

**Skill**: Fences on a real plot; what whiskers mean on a modified boxplot.
**Graph**: `boxplot` with `outliers` array rendered as dots beyond the whiskers.
**Inputs**:
- `l16_upper` — number, label "Upper fence = Q3 + 1.5×IQR ="
- `l16_outliers` — number, step 1, label "How many outliers does the plot show?"
- `l16_whisker` — dropdown, label "On a modified boxplot, the upper whisker extends to…", options (fixed, shuffled): ["The largest data value that is NOT an outlier", "The maximum of the dataset", "Exactly Q3 + 1.5×IQR", "The mean plus one standard deviation"]

**Parameterized generator**: IQR even (integer fences); 1–3 planted outliers, each beyond the fence by ≥ 1; whisker end = most extreme non-outlier value, which must be strictly inside the fence (gap ≥ 1) so the "whisker ≠ fence" lesson is visibly true on the plot. ~25% of draws have outliers on the LOW side instead (then `l16_upper` swaps to `l16_lower` via templated label and the question text adjusts — implement as label template `{{l16FenceLabel}}` with the answer keyed to whichever fence is in play).
**Grading**: numeric tolerance 0.01 / 0; dropdown exact. E 3/3; P 2/3; I otherwise.
**Hints**: `l16_upper`: "IQR = Q3 − Q1 = {{iqr}}; fence = quartile ± 1.5×IQR." `l16_outliers`: "Count the separate dots drawn beyond the whiskers." `l16_whisker`: "Whiskers stop at the most extreme value still inside the fence — NOT at the fence itself."

---

### L17 — What a Boxplot Can(not) Show (choice)

**Skill**: Boxplot literacy and limitations.
**Graph**: items 5–8 render a boxplot; others none.
**Input**: `l17_choice` — choice, templated options.

**Bank (10 items)**:

| # | Prompt | Correct | Distractor logic |
|---|--------|---------|------------------|
| 1 | Which feature CANNOT be determined from a boxplot? | The sample size n | the median, the IQR, the range |
| 2 | Which shape feature does a boxplot hide? | Whether the distribution is bimodal (gaps/clusters) | skewness hints, the middle 50%, the maximum |
| 3 | The box of a boxplot always contains about ___ of the data. | 50% | 25%, 75%, 100% |
| 4 | A much longer right whisker + median pushed left inside the box suggests… | skewed right | skewed left, symmetric, uniform |
| 5 | *(rendered, parameterized)* Read this boxplot: which statement is supported? | the one true statement (e.g., "IQR = {{iqr}}") | one false median claim, one false range claim, one unsupported "mean" claim ("the mean is {{med}}" — a boxplot doesn't show the mean) |
| 6 | Two datasets can have the SAME boxplot and different… | shapes (e.g., one bimodal) | medians, IQRs, ranges |
| 7 | Which graph would reveal a gap in the data that a boxplot hides? | Dotplot | another boxplot, five-number summary, nothing can |
| 8 | *(rendered, parameterized)* The whiskers of this (unmodified) boxplot end at… | the minimum and maximum | the fences, ±1 SD, Q1 and Q3 |
| 9 | A boxplot is MOST useful for… | comparing center and spread across several groups | seeing every individual value, finding the mode, showing exact frequencies |
| 10 | If the median sits exactly in the middle of the box and whiskers are equal, the distribution is… | plausibly roughly symmetric (but shape inside isn't guaranteed) | certainly normal, certainly uniform, skewed |

**Generator**: bank; items 5/8 generate a fresh boxplot with the true statement verified true and each distractor verified false against the generated five-number summary.
**Grading**: exact E / else I.
**Hint**: "A boxplot shows five numbers + outliers. It never shows n, the mean, or how many humps the data has."

---

### L18 — Comparative Language (dropdown)

**Skill**: Recognize a statistically correct comparison sentence (the 1.9 AP-scoring skill: explicit comparative word + context + correct direction).
**Graph**: parallel boxplot (70%) or parallel dotplot (30%), two named groups.
**Input**: `l18_choice` — dropdown, templated `{{optA}}`–`{{optD}}`.

**Parameterized generator**: build two group summaries with median difference ≥ 2 axis units and IQR difference ≥ 2 units (or exactly equal IQRs in 15% of draws). Construct exactly one correct sentence and three one-flaw distractors:
- **Correct**: "The median {{var}} for {{groupA}} ({{medA}} {{units}}) is greater than the median for {{groupB}} ({{medB}} {{units}})." (direction verified against the generated data)
- D1 *no comparison*: "The median for {{groupA}} is {{medA}} {{units}}. The median for {{groupB}} is {{medB}} {{units}}." (true but lists, never compares — the classic P-level FRQ answer)
- D2 *wrong direction*: same sentence as correct with greater/less flipped (verifiably false).
- D3 *mixed measures*: "The median for {{groupA}} is greater than the IQR for {{groupB}}" or an in-context claim comparing center to spread (nonsense comparison), or a false "more consistent" claim contradicting the IQRs.
Rotate which measure the correct option uses (median 60% / IQR-consistency 40%: "…{{groupA}} is more consistent because its IQR ({{iqrA}}) is less than …").

**Grading**: exact → E; **P if D1 chosen** (true statements, missing comparison — mirror AP partial credit), I otherwise.
**Hint**: "A comparison needs a comparing word — greater than, less than, more consistent. True sentences about each group separately are NOT a comparison. Check the direction against the plot."

---

### L19 — Compare Center & Spread (dropdown ×2 + number)

**Skill**: Extract comparative facts from parallel boxplots.
**Graph**: parallel boxplot (two groups).
**Inputs**:
- `l19_center` — dropdown ["{{groupA}} has the greater median", "{{groupB}} has the greater median", "The medians are equal"]
- `l19_spread` — dropdown ["{{groupA}} has more variability (larger IQR)", "{{groupB}} has more variability (larger IQR)", "The IQRs are equal"]
- `l19_diff` — number, label "How much greater is the larger median? (If equal, enter 0.)"

**Parameterized generator**: medians differ by ≥ 2 ticks (10% of draws: exactly equal). IQRs differ by ≥ 2 ticks (10%: equal). Independence: which group "wins" each measure is randomized separately (students must not learn "A is always bigger"). All five-number values on integer ticks.
**Grading**: dropdowns exact; `l19_diff` tolerance 0.01. E 3/3; P 2/3; I otherwise.
**Hints**: `l19_center`: "Compare the lines inside the boxes." `l19_spread`: "Compare box WIDTHS (IQR), not whisker-to-whisker range." `l19_diff`: "Subtract the smaller median from the larger."

---

### L20 — Full Comparison in Context (textarea, AI)

**Skill**: AP-style "compare the distributions" free response.
**Graph**: parallel boxplot (70%) or parallel dotplot (30%).
**Input**: `l20_response` — textarea, rows 6, placeholder "Compare the distributions: center, variability, shape (if visible), outliers — using comparative language and context."

**Parameterized generator**: L19 machinery + dotplot shape recipes when dotplots drawn; store in answers: both medians, both IQRs (and ranges), shape words per group (dotplot draws only), outlier truth per group, group names, context words.
**Grading** (regex first pass, AI fallback):
- Components: (1) center compared with direction word, correct; (2) spread compared, correct; (3) comparative language present ("greater", "less", "higher", "lower", "more", "wider", "similar"); (4) context (group names + variable/units); (5) outliers/shape addressed (when display shows them; otherwise this component is automatically satisfied).
- E: (1) AND (2) correct with (3) and (4). P: one of (1)/(2) correct with comparative language, or both correct but no context. I: lists values without comparing, or directions wrong.
**Hint**: "Address center AND variability, each with a direction word (greater/less), and name the groups and units. 'Group A: 20. Group B: 25.' is not a comparison."

---

### L21 — Empirical Rule: Percents (number)

**Skill**: 68–95–99.7 percents at μ ± kσ. (No z-scores — by design; those live in `lsrl-calculations` / U5.)
**Graph**: `normal-curve` — already implemented (`renderNormalCurve`); it draws SD gridlines and tick values at μ±kσ, which is exactly the scaffold needed. `showZLabels: false`.
**Input**: `l21_percent` — number, step "any", label "Percent ≈ ___ % (one decimal place ok)"

**Parameterized generator**: context from EMPIRICAL_POOL (clean μ, σ — see Generator Design). All question boundaries are EXACTLY μ + kσ for k ∈ {−3…3}, phrased as raw values ("between 480 g and 520 g"). Archetype → answer set:
1. within ±1σ / ±2σ / ±3σ → 68 / 95 / 99.7
2. above or below μ ± kσ (one tail) → 16, 2.5, 0.15, 84, 97.5, 99.85
3. between asymmetric bounds (μ−1σ to μ+2σ, etc.) → 81.5, 83.85, 13.5, 47.5, 34, 49.85, 95 − 68 halves (13.5 each side), 2.35
Constraint: μ − 3σ > 0 for physical quantities. Rotate archetypes via shuffle bag; the same percent never repeats twice in a row.
**Grading**: numeric tolerance 0.25 (accepts 99.7 vs 99.7, 0.15, 13.5, and ±rounding like 84 vs 83.85). P if the answer matches a recognizable near-miss (used 50 where symmetry halving was needed, or gave the complement: |student − (100 − expected)| ≤ 0.25); I otherwise.
**Hint**: "Mark μ and steps of σ on the curve: 68% within 1σ, 95% within 2σ, 99.7% within 3σ. Tails split the leftover evenly — outside 2σ leaves 5%, so 2.5% per tail."

---

### L22 — Empirical Rule: Ranges (number ×2)

**Skill**: Inverse direction — recover the interval from the percent.
**Graph**: `normal-curve`, `showXUnknown` style info box.
**Inputs**: `l22_low` (label "Lower endpoint =") and `l22_high` (label "Upper endpoint =") — number, step "any". The sentence "The middle {{pct}}% of {{units}} lie between ___ and ___." goes in the scenario / `problemText`, not on the input labels.

**Parameterized generator**: pct ∈ {68, 95, 99.7} → answers μ∓kσ. Variant archetype (30%): "About 16% of {{units}} are above what value?" → single bound; implement with `l22_low` hidden? **No** — keep the layout fixed: the one-sided archetype asks "Fill in BOTH endpoints of the interval that traps the middle 68% — then the top 16% begins at the upper endpoint" is convoluted, so: **one-sided items are out of scope for l22 and appear only in l21 (as percent questions)**. l22 is strictly middle-percent intervals, both fields always meaningful.
**Grading**: tolerance 0.01 each. E both; P both correct but swapped, or one correct; I otherwise.
**Hints**: `l22_low`: "Middle 68% ⇒ 1σ each way; 95% ⇒ 2σ; 99.7% ⇒ 3σ. Lower endpoint = μ − kσ = {{mean}} − k·{{sd}}." `l22_high`: "Upper endpoint = μ + kσ."

---

### L23 — Capstone: Read & Compute (number ×3)

**Skill**: Mixed retrieval across 1.5/1.7/1.8 from one display.
**Graph**: random ∈ {dotplot, histogram, boxplot} (boxplot draws skip dataset-level asks like the mode).
**Inputs**: `l23_a`, `l23_b`, `l23_c` — number, labels templated `{{l23QA}}`, `{{l23QB}}`, `{{l23QC}}`.

**Parameterized generator**: build a display, then draw 3 distinct asks compatible with it:
- dotplot pool: n; frequency at v; median; IQR; upper fence; most extreme value
- histogram pool: bin frequency; n; count below edge; percent in bin (clean-percent constraint)
- boxplot pool: median; IQR; range; upper/lower fence; percent above Q1 (as a number: 75)
Constraint: the three asks span at least two CED topics (one read-the-graph + one compute-a-statistic minimum).
**Grading**: numeric per-ask tolerance (0 for counts, 0.01 for stats, 0.25 for percents). E 3/3; P 2/3; I otherwise.
**Hint** (single, per mode): "Use the display. Counting questions: count dots/bar heights. Statistic questions: extract the five-number summary first, then compute."

---

### L24 — Capstone: Describe & Compare (textarea, AI)

**Skill**: The two free-response skills of the unit, mixed.
**Graph**: 50% single display (dotplot/histogram) → SOCS description task (l08 rules); 50% parallel display → comparison task (l20 rules).
**Input**: `l24_response` — textarea, rows 6, placeholder templated `{{l24Placeholder}}` ("Describe…" or "Compare…").

**Generator**: delegate to the l08 / l20 builders; tag `context.l24Variant` so grading-rules and the AI prompt apply the right rubric.
**Grading**: identical to l08 or l20 per variant.
**Hint**: "If one distribution: SOCS in context. If two: compare center and spread with direction words, in context."

---

## Generator Design

### File layout

Same skeleton as `apstats-u8-unexpected-results/generator.js`: top-level `shuffle`, per-bank module-level shuffle bags (u8's `getShuffleBag(bankName, sourceArray)` + `.pop()` so banks rotate without repeats), `generateProblem(modeId, context, mode)` switch over the 24 mode ids, one `buildLxx()` per mode. Every problem returns `{ scenario, context, answers, graphConfig|null, given }` — `context` must spread everything templates need (`{{optA}}`, `{{l02Question}}`, `{{l16FenceLabel}}`, etc.) plus `levelName`, `problemText`, `givenText` for the info panel.

### Context pools

`CONTEXT_POOL` (general quantitative scenarios — pick per problem; ~12 entries, each `{ id, intro, var, units, subjects, range:[lo,hi], tickStep }`):

| id | variable | units | typical range | tick |
|----|----------|-------|---------------|------|
| quiz | quiz scores | points | 40–100 | 5 |
| temps | daily high temperatures | °F | 55–95 | 5 |
| commute | commute times | minutes | 5–60 | 5 |
| texts | text messages sent per day | messages | 0–60 | 5 |
| plants | plant heights | cm | 10–80 | 5 |
| goals | goals scored per game | goals | 0–8 | 1 |
| battery | phone battery life | hours | 6–24 | 2 |
| pages | pages read per night | pages | 0–60 | 5 |
| mile | mile run times | minutes | 5–15 | 1 |
| pets | pets per household | pets | 0–10 | 1 |
| mpg | gas mileage | mpg | 15–50 | 5 |
| sleep | hours of sleep | hours | 4–12 | 1 |

`COMPARE_POOL` (1.9 modes; ~8 entries with two named groups): Class A/Class B quiz scores; morning/evening commutes; Brand X/Brand Y battery life; varsity/JV mile times; fertilizer A/B plant heights; weekday/weekend texts; bus/car commutes; old/new phone batteries.

`EMPIRICAL_POOL` (l21/l22; clean μ, σ with μ − 3σ > 0): chip bags (μ=500 g, σ=10); adult male heights (μ=70 in, σ=3); standardized test (μ=500, σ=100); apples (μ=200 g, σ=25); cognitive-test scores (μ=100, σ=15); light bulbs (μ=1000 hr, σ=50); pregnancies (μ=266 days, σ=16); reaction times (μ=250 ms, σ=30).

### Shape recipes (dataset construction for dotplots/histograms)

A recipe is a vector of counts over consecutive integer positions; the generator places it at a random base value inside the context range (scaled by `tickStep` for wide-range contexts) and converts to a value multiset (dotplot) or bin counts (histogram).

| shape | template counts (jitter ±1 on ≤2 positions, then validate) |
|-------|--------------------------------------------------------------|
| symmetric | [1,2,4,6,4,2,1] |
| skewRight | [2,6,5,3,2,1,1] (peak left, tail right) |
| skewLeft | mirror of skewRight |
| bimodal | [4,5,2,1,2,5,4] |
| uniform | [3,3,3,3,3,3] (jitter ≤1, validator max−min ≤ 1) |

After jitter, run the L05 unambiguity validators (mean/median/s computed on the realized multiset); resample ≤ 50 times; on failure fall back to the clean template (a2t3l5/categorical-tables fallback pattern — `buildClaimCounts` precedent).

### Honest-distractor & honest-truth rules (the categorical-tables discipline, applied per mode)

Every claim shown to a student must be **computationally verified** against the generated data before emit:

1. **Numeric dropdown distractors come from real error paths** (swapped Q1/Q3, range-for-IQR, forgot 1.5×, included median in halves, complement percent), then dedupe and require ≠ correct (regenerate on collision).
2. **L05**: never emit a near-ambiguous shape (validators above are mandatory, not advisory).
3. **L07/L11/L16**: outliers are beyond the relevant fence by ≥ 1 unit; non-outliers inside by ≥ 1; suspects never within 1 of a fence; modified-boxplot whisker end strictly inside the fence by ≥ 1 so the rendered plot itself disproves "whisker = fence".
4. **L12 archetype 1**: verify numerically that adding the value moves the mean ≥ 2 units and the median ≤ 0.5 before claiming it.
5. **L17 items 5/8, L18**: the correct statement is verified true and every distractor verified false against the generated five-number summaries (e.g., the wrong-direction sentence is false because medians differ by ≥ 2; the "majority/mean" style claims are constructed to be checkably false — same guarantee the categorical-tables cartridge makes for its "majority" distractors).
6. **L15/L19**: all five-number values land on axis ticks and differ pairwise by ≥ 2 ticks, so plot-reading has a unique right answer.
7. **L21/L22**: boundaries only ever at μ ± kσ, k integer ≤ 3; answers only from the closed empirical-rule set. Never solicit a z-score.

### Mental-math parameterization (lsrl-calculations discipline)

- Integer data; n ∈ {7, 11, 15} (+ constrained n=8) for quartile modes; IQR from {2,4,6,8,10} (+{3,5} for .5-fence practice); percents engineered to land on .0/.5 (archetype-3 histograms use n ∈ {40, 50}).
- Empirical-rule arithmetic is k·σ with σ ∈ {3, 10, 15, 16, 25, 30, 50, 100} — every endpoint computable mentally.

### graphConfig contracts (what the generator emits — see Renderer Needs)

```js
// dotplot (single or parallel)
graphConfig = { type: 'dotplot',
  groups: [ { label: 'Class A', values: [12,12,13,...] } /*, optional 2nd group */ ],
  xMin, xMax, xLabel: 'Quiz score (points)' };

// histogram
graphConfig = { type: 'histogram',
  bins: [ { x0: 40, x1: 50, count: 3 }, ... ],   // contiguous, left-closed [x0, x1)
  xLabel, yLabel: 'Frequency', highlightBin: null /* or index, for feedback */ };

// boxplot (single or parallel; renderer does NO statistics — generator supplies everything)
graphConfig = { type: 'boxplot',
  plots: [ { label: 'Brand X', min, q1, median, q3, max,
             whiskerLow, whiskerHigh,          // for modified plots; default = min/max
             outliers: [ 4, 61 ] } ],          // values rendered as dots
  xMin, xMax, xLabel };

// normal curve — existing format, unchanged
graphConfig = { type: 'normal-curve', mean, sd, markedValue: undefined,
  showZLabels: false, labels: { x: 'Weight (g)' } };
```
Stemplots: no graphConfig — generator embeds an HTML `<pre>` block in `scenario` (rendered via `innerHTML`, app.html `updateScenarioDisplay`).

---

## Grading Rules Design (`grading-rules.js`)

Single `gradeField(fieldId, answer, context)` export, u8 style (helpers: `normalize`, `isBlank`, `containsAny`, `getExpectedObj`). **Wiring note (verified)**: at grade time platform.js (~line 321) spreads `problem.answers` into the top-level grading context, so each expected-answer object arrives as `context[fieldId]` — u8's `getExpectedObj` reads `context[fieldId]` first and falls back to `context.answers[fieldId]`. Field IDs are unique per mode, so the dispatch is a flat map:

| Field(s) | Type | Tolerance / matching | E/P/I summary |
|----------|------|----------------------|----------------|
| `l01_choice`, `l06_choice`, `l12_choice`, `l13_choice`, `l17_choice` | exact (string) | normalized equality | E/I |
| `l05_shape` | exact + special case | — | E exact; P opposite-skew; I else |
| `l18_choice` | exact + special case | — | E exact; P = the no-comparison distractor (generator stores its text in `answers.l18_choice.partialOption`, read in `gradeField` as `context.l18_choice.partialOption`); I else |
| `l02_n`, `l02_count`, `l04_a`, `l07_extreme`, `l16_outliers`, counts in `l23_*` | numeric | 0 (integers) | per-mode composites above |
| `l03_min/max/n` | numeric | 0.001 | E 3/3, P 2/3 |
| `l09_*`, `l10_*`, `l14_*`, `l15_median/iqr`, `l19_diff`, `l22_*`, stat asks in `l23_*` | numeric | 0.01 | per-mode composites; `l09`: detect include-median convention values → P with targeted feedback; `l10_iqr`: detect max−Q1 / Q3−min → I with targeted feedback |
| `l11_lower/upper`, `l16_upper` | numeric | 0.01 | composite with the paired choice |
| `l04_b` (percent archetype), percent asks in `l23_*` | numeric | 0.15–0.25 | — |
| `l21_percent` | numeric | 0.25 | P for complement (100 − expected) or unhalved-tail near-misses (generator stores `nearMisses: []`) |
| `l07_hasOutlier`, `l11_isOutlier`, `l15_percent` | exact (choice) | — | composite |
| `l16_whisker`, `l19_center`, `l19_spread` | exact (dropdown) | — | composite |
| `l08_response`, `l20_response`, `l24_response` | keyword rubric → AI | see below | — |

**Textarea fields**: grading-rules runs the keyword/regex component check (components listed in L08/L20). Components are driven by the generator's `answers.<field>.components` = `[{ id, patterns: [...], contextPatterns, numericWindow: {lo,hi} }]` (arriving in `gradeField` as `context.<field>.components` per the wiring note above) so grading-rules stays generic. Scoring E/P/I per the mode specs. The platform's AI path (server, `ai-grader-prompt.txt`) is the fallback/appeal layer, same wiring as u8 — generator must populate `context.keyIdeas` (bulleted string) and `context.correctAnswer` (model answer sentence) for the prompt template.

Composite scoring: platform default (`all-E-for-star` style) — every field E ⇒ problem E; the per-mode P rows above are implemented inside `gradeField` feedback plus the platform's per-field results, matching how u8 multi-field modes behave (each field graded independently; star requires all E).

Every numeric grader returns targeted feedback naming the expected value on I (u8 convention) and a diagnosis on P where an error path was detected.

---

## AI-Grader Prompt Outline (`ai-grader-prompt.txt`)

Same skeleton as u8 (proven with the server):

```
You are an AP Statistics teacher grading a student's free response for Unit 1
(Describing Quantitative Data: SOCS descriptions and comparing distributions).

Question:
{{problemText}}

Reference (what a strong answer includes):
{{correctAnswer}}

Key ideas to look for:
{{keyIdeas}}

Student Answer:
{{STUDENT_ANSWER}}

Grading guidance:
- "E": Addresses shape/outliers/center/spread (or, for comparison tasks, compares
  center AND variability with explicit direction words), with correct values/directions,
  IN CONTEXT (names the variable/groups and units).
- "P": Correct on some components but missing others — e.g., describes both groups
  without comparative language, omits context, gives shape without center/spread numbers,
  or one direction is wrong.
- "I": Mostly missing or wrong — wrong shape AND wrong center, no comparison at all,
  or restates the prompt.
- Accept reasonable approximations for center/spread read off a plot (the reference
  lists accepted windows). Do not require the word "SOCS". Do not require the mean —
  median is preferred for skewed data.
- Never reward direction-less lists of numbers as a "comparison".

Return ONLY this JSON:
{ "score": "E" | "P" | "I", "feedback": "1–3 sentences of actionable feedback." }
```

Generator fills `{{keyIdeas}}` per variant: SOCS checklist with the accepted center window, spread values, outlier truth, shape word (l08/l24-single); comparison checklist with both medians/IQRs, required direction, group names (l20/l24-parallel).

---

## Hints Plan

`hints.perField` keyed by the globally unique field IDs (all listed per level above) — no positional collisions, no u8-style `"level15-18"` sub-objects needed. Hints may use `{{templated}}` values from problem context (`{{iqr}}`, `{{mean}}`, `{{sd}}`, `{{v}}`, `{{keyValue}}`, `{{yVarPhrase}}`). Standard penalty map:

```json
"penalty": { "0": "gold", "1": "silver", "2": "bronze", "3": "tin" }
```

---

## Renderer Needs (concrete — verified against the codebase)

The platform renders **canvas** plots via `platform/core/graph-engine.js` (`GraphEngine.render(config)` dispatch at line ~114), fed from `problem.graphConfig` through a transform in `platform/platform.js` (~lines 204–261). Generator-supplied SVG is NOT the mechanism — cartridges supply data configs, the engine draws. Current state:

| Need | Status | Work |
|------|--------|------|
| `normal-curve` | ✅ fully implemented (`renderNormalCurve`, SD gridlines + value ticks at μ±kσ) | none — l21/l22 use as-is |
| `histogram` | ❌ **stub** — dispatch case exists (graph-engine.js:121) but `renderHistogram` (line ~1194) is `// TODO` | implement (1) |
| `boxplot` | ❌ **stub** — dispatch case exists (line 124), `renderBoxplot` (line ~1201) is `// TODO` | implement (2) |
| `dotplot` | ❌ does not exist (no dispatch case) | add case + `renderDotplot` (3) |
| stemplot | ✅ no renderer needed | generator emits monospace HTML `<pre>` in `scenario` (scenario is set via `innerHTML` in app.html `updateScenarioDisplay`, ~line 4943) |
| platform transform | ⚠️ the standard-types branch in platform.js whitelists scatterplot-ish keys and would DROP `bins`/`plots`/`groups` | (4) pass-through |

**(1) `renderHistogram(config)`** — `{ bins:[{x0,x1,count}], xLabel, yLabel, highlightBin }`. xMin = bins[0].x0, xMax = last x1, yMax = max(count)·1.15. Reuse `calculateScales`; draw contiguous bars (fill `rgba(99,102,241,0.55)`, 1.5px `#4f46e5` stroke; `highlightBin` in the engine's highlight red); draw y-gridlines at integer counts (step = ceil(maxCount/5)); **x ticks at every bin edge** (the default `drawAxes` 5-step `.toFixed(1)` ticks are wrong for bins — draw custom integer edge labels); axis labels via existing label code.

**(2) `renderBoxplot(config)`** — `{ plots:[{label,min,q1,median,q3,max,whiskerLow,whiskerHigh,outliers}], xMin, xMax, xLabel }`. Horizontal orientation; 1 plot centered or 2 stacked rows (row height = plotHeight/plots.length, box height ≈ 40% of row). Per plot: box q1→q3 (indigo fill, 2px stroke), median line (2.5px, emerald), whisker lines + end caps from box to `whiskerLow`/`whiskerHigh` (default min/max), outlier values as 4px dots (`#ef4444`). Group label left of each row. Integer x ticks at `tickStep` from config. The renderer computes **no statistics** — everything supplied.

**(3) `renderDotplot(config)`** — `{ groups:[{label,values}], xMin, xMax, xLabel }`. Add `case 'dotplot':` to `render()`. For each group row: count occurrences per value, stack circles (radius ~6px, shrink if max stack would overflow row height) bottom-up at each x; number-line axis with integer ticks; group labels when 2 groups. Set `this.currentData = null` for the three new types (or guard `handleHover` — it assumes `{x,y}` point arrays and would throw on hover otherwise).

**(4) platform.js transform pass-through** — in the `render graph` block, route the new types like `normal-curve` already is:
```js
} else if (gc.type === 'histogram' || gc.type === 'boxplot' || gc.type === 'dotplot') {
  this.graphEngine.render(gc);   // generator emits engine-format configs directly
}
```

No new input types are required — text/textarea/number/choice/dropdown cover all 24 modes.

---

## Display Config (manifest)

```json
"display": {
  "showGraph": true,
  "graphType": null,
  "infoPanel": [
    { "label": "Level", "value": "{{levelName}}" },
    { "label": "Task", "value": "{{problemText}}" },
    { "label": "Given", "value": "{{givenText}}" }
  ]
}
```
Graph card auto-hides when a problem has no `graphConfig` (existing app.html behavior), so the no-graph modes (l01, l03, l06, l09–l12, l14) need nothing special.

`config.skills` (manifest): one `APSTAT-1.x-…` entry per mode, mirroring the mode table (e.g., `APSTAT-1.5-READ-DOTPLOT`, `APSTAT-1.7-IQR-FENCES`, `APSTAT-1.9-COMPARATIVE-LANGUAGE`, `APSTAT-1.10-EMPIRICAL-RULE`).

`progression.tiers`: 24 tiers in table order, `l01` default, rest `{ "gold": 3 }`, each with a celebration message naming the skill just mastered (u8 tone).

---

## Assessment Alignment Map

| Assessed skill | Drill mode(s) |
|----------------|---------------|
| Read values/counts from dotplot, stemplot, histogram | l02, l03, l04, l23 |
| Identify shape; relate skew to mean vs median | l05, l06, l12 |
| Identify outliers/gaps; apply 1.5×IQR rule | l07, l11, l16, l23 |
| Describe a distribution (SOCS) in context | l08, l24 |
| Median, quartiles, IQR, range, five-number summary | l09, l10, l14, l23 |
| Resistance; choosing median/IQR for skewed data | l12 |
| Interpret/compare SD (no computation) | l13 |
| Read/construct (modified) boxplots; their limits | l14, l15, l16, l17 |
| Compare two distributions with comparative language | l18, l19, l20, l24 |
| Empirical rule 68–95–99.7 | l21, l22 |

---

## Implementation Checklist (for the build session)

1. `cartridges/apstats-u1-quant-data/` — the four files per this spec.
2. **graph-engine.js**: implement `renderHistogram`, `renderBoxplot`; add `dotplot` dispatch + `renderDotplot`; hover-guard the new types.
3. **platform.js**: pass-through branch for the three new graphConfig types.
4. Register in `cartridges/registry.json` (`shortCode: "QNT"`) and add the `<option>` in `platform/app.html` cartridge select.
5. Smoke-test every mode at `npm run dev` → `platform/app.html`, including: stemplot `<pre>` rendering, parallel (2-group) boxplot/dotplot, modified-boxplot outlier dots, graph card hidden on no-graph modes, AI grading round-trip on l08/l20/l24.

## Open Questions for the Teacher

1. **Quartile convention** — spec assumes halves-method with median EXCLUDED (TI-84 default). Confirm this matches class instruction; if you teach include-median, flip the L09 generator constraint and the P-detection.
2. **Shape vocabulary** — l05 offers 5 options including "Bimodal" and "Approximately uniform". Keep all five, or limit to symmetric/left/right for early-year drilling?
3. **Free-response numbers** — should l08/l20 require numeric center/spread values for E (current spec: yes, with generous windows), or accept purely qualitative descriptions early in the year?
4. **Empirical-rule tolerance** — l21 accepts ±0.25 percentage points (so 84 vs 83.85 both pass). Strict 68/95/99.7-derived answers only, or also accept 99.85→"99.9" style rounding (would need tolerance 0.3)?
5. **Histogram bin convention** — spec uses left-closed [a, b) with a "to under" phrasing. Match your textbook?
6. **Split stemplots** — included at 20% frequency in l03. In scope for your class, or drop?
7. **Mode count** — 24 modes is the top of range. If you want ~20, the trims that least hurt coverage: merge l10 into l09 (add IQR field), merge l22 into l21 (archetype), drop l17 (its content partially lives in l15/l16), merge l24 into l20 (add single-display variant).
8. **Pacing** — do you want `unlockedBy` gold:3 throughout (one long chain), or band-parallel unlocks (e.g., l09 also unlockable from l05) so two lesson days can run concurrently? Spec assumes the standard linear chain.
