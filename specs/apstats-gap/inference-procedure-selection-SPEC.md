# apstats-inference-procedure-selection — Choosing the Right Inference Procedure (7.10 / 8.7 / 9.6 Skills Focus)

DESIGN SPEC — implementation produces exactly 4 files in
`cartridges/apstats-inference-procedure-selection/`: `manifest.json`, `generator.js`,
`grading-rules.js`, `ai-grader-prompt.txt`. No plots. No assets required at ship
(animations deferred — see "Animations (deferred)" section).

## Meta

| Field | Value |
|-------|-------|
| ID | `apstats-inference-procedure-selection` |
| Name | Choosing the Right Inference Procedure (7.10/8.7/9.6) |
| Subject | AP Statistics |
| Description | Cross-unit synthesis: given a study scenario, identify the data type (categorical vs quantitative, one vs two groups, paired vs independent, counts vs proportions vs means vs slope) and select the correct inference procedure from the full AP menu — then state hypotheses. Drills the classic AP exam weakness from Skills Focus Topics 7.10, 8.7, and 9.6. |

## Overview & CED Alignment

No existing cartridge drills procedure SELECTION across units. U6–U9 cartridges each
drill execution *within* a known procedure family; the AP exam's most common FRQ failure
is picking the wrong procedure in the first place. This cartridge is selection-only:
no calculations, no condition-checking beyond what identifies the procedure, no plots.
Known partial overlaps (intentional, re-drilled here only as steps of cross-unit
selection): U8's 8.5 homogeneity-vs-independence ID (≈ l06), and the per-family
hypothesis-setup modes in 6.4 / 7.4 / 9.4 (≈ l13–l14 but with the procedure unknown).

- **Topic 7.10** — Skills Focus: Selecting, Implementing, and Communicating Inference Procedures (quantitative data)
- **Topic 8.7** — Skills Focus: Selecting an Appropriate Inference Procedure for Categorical Data
- **Topic 9.6** — Skills Focus: Selecting an Appropriate Inference Procedure (general synthesis)
- **CED Skills**: 1.D (identify an appropriate inference method for confidence intervals), 1.E (identify an appropriate inference method for significance tests), 1.F (identify null and alternative hypotheses)

`config.skills` (custom descriptive codes, U8 style):

```
"APSTAT-9.6-VARTYPE-ID", "APSTAT-9.6-PARAM-FAMILY", "APSTAT-9.6-INTERVAL-VS-TEST",
"APSTAT-7.10-PAIRED-VS-INDEPENDENT", "APSTAT-8.7-PROP-VS-CHISQUARE",
"APSTAT-8.7-CHISQUARE-FAMILY", "APSTAT-9.6-DECISION-TREE",
"APSTAT-9.6-NAME-PARAMETER", "APSTAT-9.6-FULL-MENU-ID",
"APSTAT-9.6-JUSTIFY-SELECTION", "APSTAT-9.6-ERROR-ANALYSIS",
"APSTAT-1F-MATCH-HYPOTHESES", "APSTAT-1F-STATE-HYPOTHESES",
"APSTAT-9.6-GRAND-CAPSTONE"
```

### Cartridge arc

1. **Sort band (l01–l06)** — six binary/ternary contrasts, one decision dimension at a time. `choice`/`dropdown`.
2. **Tree band (l07–l09)** — guided decision-tree fills: multiple dropdowns walk the full decision path on one scenario.
3. **Select band (l10–l12)** — full open selection from the complete 15-procedure menu, with justification and error analysis. First `textarea` fields appear.
4. **Capstone band (l13–l15)** — name the procedure AND state hypotheses; grand capstone adds written justification.

---

## The Procedure Menu (canonical strings)

These EXACT strings are the single source of truth. They appear in dropdown options,
in `answers`, and as keys in the grading dimension map. Never paraphrase them anywhere
in manifest, generator, or grading-rules.

| # | Canonical string | family | structure | goal |
|---|-----------------|--------|-----------|------|
| 1 | `One-sample z-interval for a proportion` | z-prop | one-sample | interval |
| 2 | `One-sample z-test for a proportion` | z-prop | one-sample | test |
| 3 | `Two-sample z-interval for a difference in proportions` | z-prop | two-sample | interval |
| 4 | `Two-sample z-test for a difference in proportions` | z-prop | two-sample | test |
| 5 | `One-sample t-interval for a mean` | t-mean | one-sample | interval |
| 6 | `One-sample t-test for a mean` | t-mean | one-sample | test |
| 7 | `Paired t-interval for a mean difference` | t-mean | paired | interval |
| 8 | `Paired t-test for a mean difference` | t-mean | paired | test |
| 9 | `Two-sample t-interval for a difference in means` | t-mean | two-sample | interval |
| 10 | `Two-sample t-test for a difference in means` | t-mean | two-sample | test |
| 11 | `Chi-square goodness-of-fit test` | chi-square | gof | test |
| 12 | `Chi-square test for homogeneity` | chi-square | homogeneity | test |
| 13 | `Chi-square test for independence` | chi-square | independence | test |
| 14 | `t-interval for the slope of a regression line` | t-slope | slope | interval |
| 15 | `t-test for the slope of a regression line` | t-slope | slope | test |

Deliberately EXCLUDED from the menu (AP convention): z-test/z-interval for a mean
(σ known), McNemar, 2-sample variance tests. σ is never given in any stem.

---

## Progression Overview (Mode Table)

15 modes. `l01` unlocks by `"default"`; every other mode `{"gold": 3}` on the previous
mode (linear chain, matching U8). Most modes' frame filters yield ≥ 10 distinct stems;
the two narrow sorts are smaller — l05 filters to 6 frames and l06 to 9 — so those two
rely on slot randomization (names, n, values, direction) plus the shuffle bag to keep
4–8 problems to gold from feeling repetitive (a stem may recur once in l05 with
different slots; acceptable for a binary sort).

| # | Mode ID | Name | CED | Input(s) | Problem shape | E/P/I sketch |
|---|---------|------|-----|----------|---------------|--------------|
| 01 | `l01-categorical-vs-quantitative` | Sort 1: Categorical or Quantitative? | 9.6 | choice (2) | Scenario → "The response variable recorded on each individual is ___" | E exact, I else |
| 02 | `l02-prop-mean-slope` | Sort 2: Proportions, Means, or Slope? | 9.6 | choice (3) | Scenario → which parameter family would inference involve | E exact; P = "Means" when correct is "Slope"; I else |
| 03 | `l03-interval-vs-test` | Sort 3: Interval or Test? | 9.6 | choice (2) | Scenario → estimate language vs evidence language | E exact, I else |
| 04 | `l04-paired-vs-independent` | Sort 4: Paired or Independent? | 7.10 | choice (2) | Two-group quantitative scenario → design ID | E exact, I else |
| 05 | `l05-oneprop-vs-chisquare` | Sort 5: One Proportion or Chi-Square? | 8.7 | choice (2) | One-sample categorical test scenario → 1-prop z vs GOF | E exact, I else |
| 06 | `l06-chi-square-family` | Sort 6: GOF, Homogeneity, or Independence? | 8.7 | dropdown (3) | Chi-square scenario → which of the three | E exact, I else (feedback names the design cue) |
| 07 | `l07-tree-data-design` | Tree 1: Walk the Decision Tree | 9.6 | dropdown ×3 | One scenario; fill nodes: data shape, sample design, procedure family | per field: E exact, I else |
| 08 | `l08-tree-goal-procedure` | Tree 2: Finish the Decision Tree | 9.6 | dropdown ×3 | One scenario; fill: interval-vs-test, parameter, full procedure | goal/param: E/I; procedure: distance metric E/P/I |
| 09 | `l09-name-parameter` | Tree 3: Name the Parameter | 9.6 | dropdown ×2 | Scenario → parameter symbol + correct in-context definition | per field: E exact, I else |
| 10 | `l10-full-menu-id` | Select 1: Full-Menu Procedure ID | 9.6 | dropdown (15) | Any scenario, full fixed menu | distance metric E/P/I |
| 11 | `l11-procedure-justify` | Select 2: Procedure + Justification | 9.6 | dropdown (15) + textarea | Pick procedure AND justify via the three decision dimensions | dropdown: distance metric; textarea: keyword rubric + AI fallback |
| 12 | `l12-fix-wrong-procedure` | Select 3: Fix the Wrong Procedure | 9.6 | dropdown (15) + textarea | "A student chose ___ (wrong)." Pick correct one + name the missed cue | dropdown: distance metric; textarea: keyword rubric + AI fallback |
| 13 | `l13-match-hypotheses` | Capstone 1: Match the Hypotheses | 7.10/8.7 | dropdown (4) | Test scenario + named procedure → choose correct H₀/Hₐ pair | E exact; P = direction-error distractor; I else |
| 14 | `l14-procedure-hypotheses` | Capstone 2: Procedure + Hypotheses | 7.10/8.7/9.6 | dropdown (15) + text ×2 | Test scenario → name procedure, type H₀ and Hₐ | dropdown: distance; text: alias/keyword rules (below) |
| 15 | `l15-grand-capstone` | Capstone 3: The Full Decision | 9.6 | dropdown (15) + text ×2 + textarea | Name procedure + state H₀/Hₐ + written justification | as l14 + textarea AI-backed rubric |

---

## Mode Details

All modes share one master scenario bank (45 frames, Generator Design below). Each
mode = a frame **filter** + a question **overlay** + an option **recipe**. The platform
shows `scenario` (the dressed stem) plus the info panel; `givenText` carries the
structured facts (sample sizes, group/parameter definitions).

Every input field id is **unique across the whole cartridge** (l-prefix) so
`hints.perField` never collides (this caused the U8 `level15-18` hack — do not repeat it).

---

### L01 — Sort 1: Categorical or Quantitative? (choice)

- **Skill**: Identify the type of the response variable being measured.
- **Frame filter**: all 45 frames. Balance: shuffle-bag alternates categorical-tagged and quantitative-tagged frames (no 3 in a row of either).
- **Overlay question** (label): `The response variable recorded on each individual is:`
- **Field**: `l01_responseType`, type `choice`, options `["Categorical", "Quantitative"]`.
- **Answer derivation**: frame tag `dims.responseType`. Slope frames → `Quantitative` (both variables numeric). Independence frames → `Categorical` (both variables categorical). Two-sample t / homogeneity frames → type of the RESPONSE (quantitative / categorical), never the grouping factor.
- **E/P/I**: E exact; I otherwise. I-feedback states the rule: "Categories you count vs numbers you average. Here, [variable phrase] is [type] because [cue]." (`[variable phrase]` and `[cue]` come from frame fields `responsePhrase`, `typeCue`.)
- **Hint** (`l01_responseType`): "Ask: for one individual, is the recorded value a category label (count how many) or a number (compute an average)? A grouping label like 'fertilizer A vs B' is NOT the response variable."

### L02 — Sort 2: Proportions, Means, or Slope? (choice)

- **Skill**: Map the response variable to the parameter family.
- **Frame filter**: all frames. Balance: bag guarantees ≥2 slope frames per 8 draws (slope is the under-recognized case).
- **Overlay question**: `If you carried out inference for this study, the parameter(s) would involve:`
- **Field**: `l02_paramFamily`, type `choice`, options `["Proportions or category counts", "Means", "The slope of a regression line"]`.
- **Answer derivation**: family tag — z-prop and chi-square → option 1; t-mean (incl. paired) → option 2; t-slope → option 3.
- **E/P/I**: E exact. P only when correct is "Slope" and student chose "Means" (both quantitative — partial recognition); feedback: "Both variables are quantitative, but the question is about the linear RELATIONSHIP between them, so the parameter is the slope β, not a mean." All other misses I.
- **Hint**: "One number per individual → mean. One category per individual → proportions/counts. TWO numbers per individual and a question about how one changes with the other → slope."

### L03 — Sort 3: Interval or Test? (choice)

- **Skill**: Classify the inference goal from the question language.
- **Frame filter**: all frames; bag alternates interval/test.
- **Overlay question**: `What kind of inference does the question call for?`
- **Field**: `l03_goal`, type `choice`, options `["Confidence interval (estimate a parameter)", "Significance test (evaluate a claim)"]`.
- **Answer derivation**: frame tag `dims.goal`.
- **E/P/I**: E exact; I otherwise. I-feedback quotes the cue phrase from the stem (frame field `goalCue`, e.g. `"estimate the difference"` or `"is there convincing evidence"`).
- **Hint**: "'Estimate', 'how large', 'construct an interval', 'plausible values' → interval. 'Convincing evidence', 'test the claim', 'do the data suggest' → test."

### L04 — Sort 4: Paired or Independent? (choice)

- **Skill**: THE classic AP trap. Identify the two-group design for quantitative data.
- **Frame filter**: only frames with structure `paired` or `two-sample` AND family `t-mean` (12 frames). Bag alternates.
- **Overlay question**: `How were the two sets of measurements produced?`
- **Field**: `l04_design`, type `choice`, options `["Paired data — two measurements on the same (or matched) units", "Two independent samples or randomly assigned groups"]`.
- **E/P/I**: E exact; I otherwise. I-feedback quotes the design cue from the stem (frame field `designCue`, e.g. "each student took the quiz twice" / "two separate random samples").
- **Hint**: "Paired: same individuals measured twice (before/after), or units matched one-to-one — you analyze the DIFFERENCES. Independent: two unrelated samples, or individuals randomly split into two groups."

### L05 — Sort 5: One Proportion or Chi-Square? (choice)

- **Skill**: One-sample categorical: claim about ONE proportion vs claim about a whole distribution.
- **Frame filter**: frames with procedure `One-sample z-test for a proportion` or `Chi-square goodness-of-fit test` (6 frames). Bag alternates.
- **Overlay question**: `Which procedure fits this one-sample categorical scenario?`
- **Field**: `l05_catProcedure`, type `choice`, options `["One-sample z-test for a proportion", "Chi-square goodness-of-fit test"]` (canonical strings).
- **E/P/I**: E exact; I otherwise. I-feedback: "Count the categories in the claim. A claim about one proportion of a binary outcome → 1-prop z. A claimed distribution across 3+ categories → chi-square GOF."
- **Hint**: "How many proportions does the claim specify? One (binary yes/no) → z-test for p. A whole set of category proportions → goodness-of-fit."

### L06 — Sort 6: GOF, Homogeneity, or Independence? (dropdown)

- **Skill**: Distinguish the three chi-square tests by DATA COLLECTION design.
- **Frame filter**: the 9 chi-square frames. Bag cycles all three types evenly.
- **Overlay question**: `Which chi-square test is appropriate?`
- **Field**: `l06_chiType`, type `dropdown`, static options: the three canonical chi-square strings.
- **E/P/I**: E exact; I otherwise (homogeneity↔independence confusion gets targeted feedback: "Homogeneity: SEPARATE samples from 2+ populations/treatments, one categorical response. Independence: ONE sample, each individual classified on TWO categorical variables." GOF miss: "GOF: one sample, one categorical variable, compared to a CLAIMED distribution.").
- **Hint**: "Count the samples and the variables. 1 sample + 1 variable + claimed distribution → GOF. Several samples + 1 variable → homogeneity. 1 sample + 2 variables → independence."

### L07 — Tree 1: Walk the Decision Tree (dropdown ×3)

- **Skill**: Execute the first half of the decision tree explicitly on one scenario.
- **Frame filter**: all frames.
- **Fields** (all dropdowns, static options in manifest):
  - `l07_dataShape` — label `Node 1 — What is recorded on each individual?` options:
    `["One categorical variable", "Two categorical variables", "One quantitative variable", "Two quantitative variables"]`
  - `l07_design` — label `Node 2 — How many samples/groups, and how are they related?` options:
    `["One sample", "Two independent samples or groups", "Paired measurements on the same or matched units", "Independent samples from three or more populations/groups"]`
  - `l07_family` — label `Node 3 — Which procedure family?` options:
    `["z-procedures for proportions", "t-procedures for means", "Chi-square tests", "t-procedures for a regression slope"]`
- **Answer derivation** (fixed mapping, no judgment calls):
  | Procedure | Node 1 | Node 2 | Node 3 |
  |---|---|---|---|
  | 1-prop z (both) | One categorical variable | One sample | z-procedures for proportions |
  | 2-prop z (both) | One categorical variable | Two independent samples or groups | z-procedures for proportions |
  | 1-sample t (both) | One quantitative variable | One sample | t-procedures for means |
  | Paired t (both) | One quantitative variable | Paired measurements... | t-procedures for means |
  | 2-sample t (both) | One quantitative variable | Two independent samples or groups | t-procedures for means |
  | GOF | One categorical variable | One sample | Chi-square tests |
  | Homogeneity | One categorical variable | Independent samples from three or more populations/groups | Chi-square tests |
  | Independence | Two categorical variables | One sample | Chi-square tests |
  | Slope (both) | Two quantitative variables | One sample | t-procedures for a regression slope |
  - Constraint consequence: all homogeneity frames MUST use ≥3 groups (see honest-distractor rule H3) so Node 2 is unambiguous vs 2-prop z.
- **E/P/I**: each field independently E exact / I otherwise. I-feedback per node states the cue.
- **Hints**: `l07_dataShape`: "Count what is written down for ONE individual: one label, two labels, one number, or two numbers." `l07_design`: "Look for 'one random sample', 'two separate samples', 'randomly assigned to two groups', 'each subject measured twice', or 'samples from each of three...'." `l07_family`: "Categorical+1 sample claim about one p → z for proportions; categorical with multiple groups/variables/categories → chi-square; numbers averaged → t for means; two numbers, linear relationship → slope."

### L08 — Tree 2: Finish the Decision Tree (dropdown ×3)

- **Skill**: Second half of the tree: goal → parameter → full procedure name.
- **Frame filter**: all frames.
- **Fields**:
  - `l08_goal` — label `Node 4 — Interval or test?` options `["Confidence interval", "Significance test"]`.
  - `l08_parameter` — label `Node 5 — What is the parameter of interest?` static options:
    `["p (one population proportion)", "p₁ − p₂ (difference in two population proportions)", "μ (one population mean)", "μ_d (mean of paired differences)", "μ₁ − μ₂ (difference in two population means)", "The distribution of one categorical variable", "The association between two categorical variables", "β (slope of the population regression line)"]`
  - `l08_procedure` — label `Node 6 — Name the procedure:` static options = full 15-item canonical menu.
- **Answer derivation**: goal from `dims.goal`; parameter mapping: 1-prop→p; 2-prop→p₁−p₂; 1-mean→μ; paired→μ_d; 2-mean→μ₁−μ₂; GOF and homogeneity→"The distribution of one categorical variable"; independence→"The association between two categorical variables"; slope→β. Procedure = frame's canonical string.
- **E/P/I**: `l08_goal`, `l08_parameter` E/I exact. `l08_procedure` graded by the distance metric (Grading Rules Design).
- **Hints**: `l08_goal`: same lexicon hint as l03. `l08_parameter`: "Parameters describe POPULATIONS: p, μ, β — never p̂ or x̄. Paired designs have ONE parameter: the mean difference μ_d." `l08_procedure`: "Put nodes 1–5 together: family + one/two/paired + interval/test."

### L09 — Tree 3: Name the Parameter (dropdown ×2)

- **Skill**: Parameter symbol + precise in-context definition (feeds hypothesis writing).
- **Frame filter**: all frames EXCEPT chi-square (36 frames) — chi-square has no single-symbol parameter.
- **Fields**:
  - `l09_paramSymbol` — label `Parameter symbol:` static options `["p", "p₁ − p₂", "μ", "μ_d", "μ₁ − μ₂", "β"]`.
  - `l09_paramDef` — label `Which defines the parameter correctly in context?` options `["{{optA}}", "{{optB}}", "{{optC}}", "{{optD}}"]` (generator-supplied).
- **Definition option recipe** (exactly these 4, shuffled; built from frame fields):
  1. CORRECT: population-level definition with the frame's population phrase ("the true mean commute time of ALL employees at the company").
  2. SAMPLE-STAT distractor: same sentence but "of the {n} sampled..." (statistic, not parameter).
  3. WRONG-VARIABLE distractor: right population, wrong measured quantity (uses frame field `decoyVariable`).
  4. WRONG-SCOPE distractor: right variable, wrong population (e.g. "all teenagers in the U.S." when the frame's population is one school) — frame field `decoyPopulation`.
- **E/P/I**: both fields E exact / I otherwise. `l09_paramDef` I-feedback for distractor 2 is special-cased: "That describes the SAMPLE statistic. Parameters describe the population."
- **Hints**: `l09_paramSymbol`: "Differences of two proportions/means get subscripts; paired data collapse to one symbol μ_d; slope is β." `l09_paramDef`: "A parameter definition must name the POPULATION and the exact variable — not the sample."

### L10 — Select 1: Full-Menu Procedure ID (dropdown, full menu)

- **Skill**: Open selection — the actual AP task.
- **Frame filter**: all 45 frames, fully mixed; bag forbids the same procedure twice in a row.
- **Field**: `l10_procedure` — label `Select the appropriate inference procedure:` — static options = full 15-item canonical menu in the table order above (stable order = students learn the menu's geography).
- **E/P/I**: distance metric (see Grading Rules Design). Feedback always names which dimension(s) were wrong ("Right family and right goal, but these measurements are PAIRED — same cars on both fuels — so the procedure is `Paired t-test for a mean difference`.").
- **Hint** (`l10_procedure`): "Run the tree: (1) categorical or quantitative? (2) how many samples — and paired or independent? (3) interval or test? Then read the menu."

### L11 — Select 2: Procedure + Justification (dropdown + textarea)

- **Skill**: Select AND defend using the decision dimensions (AP FRQ part (a) behavior).
- **Frame filter**: all frames.
- **Fields**:
  - `l11_procedure` — same as `l10_procedure` (full menu).
  - `l11_justify` — textarea, rows 4, label `Justify your choice. Name: the variable type, the sample/group structure, and why interval vs test.` placeholder `"The response variable is ... ; the data come from ... ; the question asks ... so the procedure is ..."`.
- **E/P/I for `l11_justify`** (programmatic first, AI fallback):
  - Three rubric dimensions, each satisfied by a keyword family AND must be CONSISTENT with the frame's truth:
    - TYPE: `categorical|quantitative|proportion|mean|count|slope|numeric|category`
    - STRUCTURE: `one sample|two sample|two independent|paired|matched|before and after|same (subjects|students|cars|items)|randomly assigned|two groups|separate samples|two variables`
    - GOAL: `estimate|interval|confident|plausible` vs `evidence|test|claim|significan`
  - E: ≥3 dimensions present and consistent with the correct procedure (consistency check: e.g. if frame is paired but answer says "independent samples" the STRUCTURE dimension is counted WRONG, not merely missing).
  - P: exactly 2 consistent dimensions, none contradicted.
  - I: ≤1 dimension, or any explicit contradiction of the frame's tags, or justification contradicts the student's own (correct) dropdown selection.
- **Hint** (`l11_justify`): "Three sentences: (1) what type of variable and how many, (2) how the samples/groups were produced (paired? independent? one sample?), (3) quote the estimate-vs-evidence language."

### L12 — Select 3: Fix the Wrong Procedure (dropdown + textarea)

- **Skill**: Error analysis — diagnose WHY a plausible-but-wrong selection fails.
- **Frame filter**: all test frames + interval frames that have a defined distance-1 trap (see planted-error table). Problem text: scenario + `A student selected: "{wrongProcedure}". This is not correct.`
- **Planted wrong-procedure recipe** — `wrongProcedure` is ALWAYS drawn from this table (each row = a nameable missed cue; generator stores `missedCueKey`):
  | True procedure | Planted wrong answer | Missed cue (canonical phrase) |
  |---|---|---|
  | Paired t-test / t-interval | Two-sample t-test / t-interval | "the two measurement sets come from the SAME (or matched) units — paired, not independent" |
  | Two-sample t-test / t-interval | Paired t-test / t-interval | "the samples are independent — no unit is measured twice or matched" |
  | Chi-square homogeneity | Two-sample z-test for a difference in proportions | "the response has 3+ categories (or 3+ groups), so whole DISTRIBUTIONS are compared, not one proportion" |
  | Chi-square homogeneity | Chi-square test for independence | "the data are SEPARATE samples from several populations, not one sample classified twice" |
  | Chi-square independence | Chi-square test for homogeneity | "there is ONE sample, with each individual classified on two variables" |
  | Chi-square GOF | One-sample z-test for a proportion | "the claim specifies a whole distribution over 3+ categories, not a single proportion" |
  | One-sample z-test for a proportion | Chi-square goodness-of-fit test | "the variable is binary and the claim is about ONE proportion" |
  | One-sample t-test | One-sample z-test for a proportion | "the response is QUANTITATIVE (a number to average), not categorical" |
  | t-test for slope | Two-sample t-test for a difference in means | "TWO quantitative variables are measured on each individual; the question is about their linear relationship, not a difference between groups" |
  | Any interval frame in the table above | The matching TEST of the same parameter | "the question says ESTIMATE — no claim is being tested" |
  | Any test frame | The matching INTERVAL of the same parameter | "the question asks for convincing EVIDENCE about a claim" |
- **Fields**:
  - `l12_procedure` — full menu dropdown, label `Select the procedure the student SHOULD have used:`.
  - `l12_missedCue` — textarea rows 3, label `What cue in the scenario did the student miss?`.
- **E/P/I for `l12_missedCue`**: keyword rubric keyed by `missedCueKey` (each row above has 3–5 required keyword families, e.g. paired-trap: `same|matched|twice|before|both` AND `paired|differences`); E = ≥2 families incl. the design family; P = 1 family; I = 0 or names a different/wrong cue. AI fallback.
- **Hints**: `l12_procedure`: "The student's answer is one decision away from correct. Which tree node did they get wrong?" `l12_missedCue`: "Point to the exact phrase in the scenario the student ignored."

### L13 — Capstone 1: Match the Hypotheses (dropdown, 4 options)

- **Skill**: Recognize correctly-stated hypotheses (Skill 1.F, recognition before production).
- **Frame filter**: test frames only (all 9 test procedures, incl. chi-square — chi-square options are word-form). Problem text names the (correct) procedure explicitly: `A {procedure} will be used. Which hypotheses are correct?`
- **Field**: `l13_hypPair` — dropdown, options `["{{optA}}", "{{optB}}", "{{optC}}", "{{optD}}"]`.
- **Option recipe** (exactly 4, shuffled; tags stored in `answers` so grading knows which is which):
  1. CORRECT: frame's canonical H₀/Hₐ pair rendered as one string, e.g. `H₀: p₁ − p₂ = 0;  Hₐ: p₁ − p₂ > 0` or word-form for chi-square.
  2. SAMPLE-STAT distractor (tag `stat`): same pair with p̂/x̄ symbols. Always wrong.
  3. DIRECTION distractor (tag `direction`): Hₐ direction flipped (or `≠` swapped with the frame's one-sided claim, or H₀ written as an inequality). Earns **P** — parameter and structure right, direction wrong.
  4. WRONG-PARAMETER distractor (tag `param`): right-looking pair about the wrong parameter (μ where p belongs, p where μ_d belongs; for chi-square: a 2-prop symbol pair). Always wrong.
- **E/P/I**: E = correct option; P = `direction` distractor with feedback "Right parameter, wrong direction — reread the claim: '{claimPhrase}'"; I = others with tag-specific feedback.
- **Hint** (`l13_hypPair`): "Check three things in order: population symbols (never p̂ or x̄), H₀ is ALWAYS an equality, and Hₐ's direction must match the claim's wording."

### L14 — Capstone 2: Procedure + Hypotheses (dropdown + text ×2)

- **Skill**: The full FRQ part (a): name procedure and produce hypotheses.
- **Frame filter**: test frames only.
- **Fields**:
  - `l14_procedure` — full menu dropdown.
  - `l14_null` — text, label `State H₀:` placeholder `e.g. p1 - p2 = 0, mu = 12, or words for chi-square`.
  - `l14_alt` — text, label `State Hₐ:` placeholder `e.g. p1 - p2 > 0, mu ≠ 12, or words for chi-square`.
- **givenText REQUIREMENT**: every 2-group test frame defines subscripts explicitly (`Let p1 = the proportion of ... and p2 = ...` / `Let mu1 = ...`; paired frames define `d = first − second` direction) so typed hypotheses are unambiguous (honest rule H10).
- **Grading**: alias/keyword rules per procedure (see "Hypotheses text grading" in Grading Rules Design).
- **Hints**: `l14_procedure`: as l10. `l14_null`: "H₀ uses population symbols and an equals sign: p = value, p1 - p2 = 0, mu = value, mu_d = 0, beta = 0 — or for chi-square, a 'distribution is as claimed / same / no association' sentence." `l14_alt`: "Hₐ replaces = with <, >, or ≠ to match the claim — for chi-square, 'at least one differs / not the same / there is an association'."

### L15 — Capstone 3: The Full Decision (dropdown + text ×2 + textarea)

- **Skill**: Grand capstone: everything at once.
- **Frame filter**: test frames only, weighted toward the trap pairs (paired/2-sample, homogeneity/independence, 1-prop/GOF, slope).
- **Fields**: `l15_procedure` (full menu dropdown), `l15_null` (text), `l15_alt` (text) — identical specs to l14 — plus:
  - `l15_justify` — textarea rows 4, label `Justify the procedure choice (variable type, design, goal):`.
- **Grading**: dropdown = distance metric; texts = hypotheses rules; `l15_justify` = same 3-dimension rubric as `l11_justify`, AI fallback.
- **Hints**: reuse l10/l14/l11 hint texts under the l15 field ids.

---

## Generator Design

### Architecture

```javascript
export function generateProblem(modeId, context, mode) { ... }
export default { generateProblem };
```

- Utilities copied from U8 pattern: `randInt`, `shuffle`, `choice`, `roundTo`,
  `withAnswerContext(context, answers)`, and the **shuffle-bag** system keyed
  `"<modeId>"` over the mode's filtered frame-id list (no repeats until exhausted).
- One `MASTER_FRAMES` array (45 frames). One `PROCEDURES` dimension map (the menu
  table above) exported for grading-rules to import — single source of truth.
- Per-mode logic = `FRAME_FILTERS[modeId]` + `OVERLAYS[modeId]` (builds labels,
  options, answers from frame tags). Mode-specific balancing rules implemented inside
  the bag-refill step (e.g. l01 alternation, l02 slope quota, l06 even cycle).
- Returned object: `{ context: withAnswerContext({ levelName, problemText, givenText, scenarioText, correctProcedure, decisionFacts, correctAnswer, ...frameSlots }, answers), answers, scenario, graphConfig: null }`.
  - `problemText` = the overlay question; `givenText` = structured facts incl.
    parameter/subscript definitions; `scenario` = dressed stem.
  - `correctProcedure`, `decisionFacts`, `correctAnswer` MUST be emitted into context
    on every problem — the AI prompt's `{{correctProcedure}}` / `{{decisionFacts}}` /
    `{{correctAnswer}}` placeholders are filled from context keys (the platform spreads
    the whole context into the AI `scenario` object; missing keys are silently stripped
    from the prompt).

### Frame schema

```javascript
{
  id: "ptt-fuel",                 // unique
  unit: "U7",                     // U6 | U7 | U8 | U9 (coverage tag)
  theme: "driving",               // one of 12 context pools
  procedure: "Paired t-test for a mean difference",   // canonical string
  dims: { responseType: "quantitative", family: "t-mean", structure: "paired",
          goal: "test", nCats: null, groups: 1 },
  stem: "...template with {slots}...",
  given: "n = {n} cars; d = premium − regular for each car",
  responsePhrase: "fuel efficiency (mpg)",
  typeCue: "mpg is a number you average",
  designCue: "the SAME {n} cars were tested with both fuels",
  goalCue: "is there convincing evidence",
  parameter: { symbol: "μ_d",
               definition: "the true mean difference (premium − regular) in mpg for all cars of this type",
               decoyVariable: "the true mean price difference between the two fuels",
               decoyPopulation: "all vehicles registered in the state" },
  hypotheses: { h0: "mu_d = 0", ha: "mu_d > 0", direction: "greater",
                claimPhrase: "premium fuel improves gas mileage",
                display: { h0: "H₀: μ_d = 0", ha: "Hₐ: μ_d > 0" } },   // null for interval frames
  slots: { n: [20, 24, 25, 30], names: [...] }
}
```

### Context pools (12 themes, spanning U6–U9 house style)

Consistent with existing U6–U9 cartridges (school-life scenarios, plain language,
teen-relevant): 1 cafeteria/food, 2 sleep & screen time, 3 sports, 4 polling/student
government, 5 manufacturing/QC, 6 clinic/health, 7 commute/driving, 8 pets/shelter,
9 candy/snacks, 10 music & study, 11 plants/garden, 12 streaming/movies.

### Parameter constraints (classroom-friendly numbers)

Numbers are flavor only (no calculation), but must stay plausible and clean:
- Sample sizes from `[30, 35, 40, 45, 50, 60]` (small) or `[80, 100, 120, 150, 200, 250]` (survey-scale). Means frames use n ≥ 30 (sidesteps normality digressions). Chi-square frames use n ≥ 100 (expected counts comfortably > 5).
- Claimed proportions from `[0.25, 0.30, 0.40, 0.50, 0.60, 0.70, 0.75]`; GOF claimed distributions sum to 1 with 0.05-grid values (e.g. 30/30/20/20).
- Means/values 1-decimal clean (7.5 s, 12.5 oz, 500 mL); confidence levels from `[90, 95, 99]`.
- Direction randomized per frame among its `allowedDirections` (some claims are inherently one-sided, e.g. "improves" → greater).

### Master frame bank (45 frames)

**Intervals (3 frames each):**

| ID | Theme | Stem (slots in `{}`) |
|---|---|---|
| `1pzi-poll` | polling | "A random sample of {n} students at {school} is asked whether they support starting school an hour later; {x} say yes. Administrators want to estimate the proportion of all students at the school who support the change." |
| `1pzi-pets` | pets | "An animal shelter takes a random sample of {n} adoption records and notes whether each adopted animal was a dog. The shelter wants to estimate the proportion of all its adoptions that are dogs." |
| `1pzi-stream` | streaming | "A streaming service randomly samples {n} accounts and records whether each used autoplay last week. It wants to estimate the proportion of all accounts that used autoplay." |
| `2pzi-sleep` | sleep | "Separate random samples of {n1} ninth graders and {n2} twelfth graders at a large district are asked whether they get at least 8 hours of sleep. Researchers want to estimate the difference between the proportions of all ninth and all twelfth graders who do." |
| `2pzi-poll` | polling | "Independent random samples of {n1} juniors and {n2} seniors are asked whether they favor a new schedule. The council wants to estimate how different the two class-wide support proportions are." |
| `2pzi-stream` | streaming | "A service samples {n1} accounts created on weekdays and {n2} created on weekends, recording whether each canceled within a month. It wants to estimate the difference in cancellation proportions." |
| `1ti-commute` | commute | "A random sample of {n} employees at a large company records each employee's commute time in minutes. HR wants to estimate the mean commute time of all employees." |
| `1ti-candy` | candy | "A quality team randomly selects {n} bags from a production run and weighs each. They want to estimate the mean weight of all bags in the run." |
| `1ti-sleep` | sleep | "A counselor takes a random sample of {n} students and records each student's nightly screen time in minutes. She wants to estimate the mean screen time of all students at the school." |
| `pti-music` | music | "Each of {n} randomly selected students completes a puzzle once with music and once in silence (order randomized), and both times are recorded. Researchers want to estimate the mean difference in completion time." |
| `pti-fuel` | driving | "The same {n} cars are each driven on regular and on premium fuel, recording mpg both times. Engineers want to estimate the mean difference in fuel efficiency." |
| `pti-jump` | sports | "Each of {n} athletes has vertical jump measured before and after a 6-week training program. The trainer wants to estimate the mean improvement." |
| `2ti-shelter` | pets | "Independent random samples of {n1} cats from shelter A and {n2} cats from shelter B are weighed. Researchers want to estimate the difference in mean weight between the two shelters' cats." |
| `2ti-lunch` | cafeteria | "On randomly chosen days, the wait time is recorded for {n1} students in lunch line 1 and {n2} students in lunch line 2. The manager wants to estimate the difference in mean wait time." |
| `2ti-watch` | streaming | "Independent random samples of {n1} teen accounts and {n2} adult accounts record daily watch time. Analysts want to estimate the difference in mean watch time." |
| `sti-study` | music/study | "For each of {n} randomly selected students, hours studied and exam score are recorded. The teacher wants to estimate how many additional points are associated with each extra hour of study (the slope)." |
| `sti-mpg` | driving | "For a random sample of {n} car models, weight (thousands of pounds) and highway mpg are recorded. An analyst wants to estimate the slope relating weight to mpg." |
| `sti-tomato` | plants | "For each of {n} tomato plants, weekly hours of sunlight and total yield (lb) are recorded. A gardener wants to estimate the slope of the regression of yield on sunlight." |

**Tests (3 frames each):**

| ID | Theme | Stem | H₀ / Hₐ (canonical normalized form) |
|---|---|---|---|
| `1pzt-lunch` | cafeteria | "The cafeteria manager claims {p0pct} of students buy lunch daily. In a random sample of {n} students, {x} bought lunch. Is there convincing evidence that the true proportion differs from the claim?" | `p = {p0}` / `p != {p0}` |
| `1pzt-ft` | sports | "A player claims she makes {p0pct} of her free throws. In a random sequence of {n} attempts she makes {x}. Do the data give convincing evidence that her true make rate is less than claimed?" | `p = {p0}` / `p < {p0}` |
| `1pzt-chip` | manufacturing | "A factory claims at most {p0pct} of its chips are defective. An SRS of {n} chips finds {x} defective. Is there convincing evidence the true defective proportion is greater than {p0pct}?" | `p = {p0}` / `p > {p0}` |
| `2pzt-clinic` | clinic | "{n} patients are randomly assigned to drug A ({n1}) or drug B ({n2}); whether each is symptom-free after one week is recorded. Is there convincing evidence drug A produces a higher proportion of symptom-free patients? Let p1 = true symptom-free proportion with A, p2 with B." | `p1 - p2 = 0` / `p1 - p2 > 0` |
| `2pzt-puzzle` | music | "Students are randomly assigned to solve a puzzle with music ({n1}) or in silence ({n2}); whether each finishes in 5 minutes is recorded. Is there convincing evidence the finishing proportions differ? Let p1 = music, p2 = silence." | `p1 - p2 = 0` / `p1 - p2 != 0` |
| `2pzt-stop` | driving | "Independent random samples of {n1} drivers at intersection A and {n2} at intersection B record whether each comes to a complete stop. Is there convincing evidence the proportion stopping is lower at A? Let p1 = A, p2 = B." | `p1 - p2 = 0` / `p1 - p2 < 0` |
| `1tt-fill` | manufacturing | "A machine is supposed to fill bottles with {mu0} mL. An SRS of {n} bottles is measured. Is there convincing evidence the true mean fill differs from {mu0} mL?" | `mu = {mu0}` / `mu != {mu0}` |
| `1tt-sprint` | sports | "A coach claims his sprinters average {mu0} seconds in the 40-yard dash. A random sample of {n} timed runs is taken. Is there convincing evidence the true mean time is greater than claimed?" | `mu = {mu0}` / `mu > {mu0}` |
| `1tt-germ` | plants | "A seed company claims its seeds sprout in {mu0} days on average. A gardener plants a random sample of {n} seeds and records each sprouting time. Is there convincing evidence the true mean sprouting time is greater than {mu0} days?" | `mu = {mu0}` / `mu > {mu0}` |
| `ptt-react` | sleep | "Each of {n} students completes a reaction-time test after a full night's sleep and again after 5 hours (order randomized). Is there convincing evidence reaction times are slower when sleep-deprived? Let d = deprived − rested for each student." | `mu_d = 0` / `mu_d > 0` |
| `ptt-price` | candy | "A shopper records the price of the SAME {n} grocery items at store A and store B. Is there convincing evidence items cost more on average at store A? Let d = A − B for each item." | `mu_d = 0` / `mu_d > 0` |
| `ptt-bp` | clinic | "Each of {n} patients has blood pressure measured before starting a medication and after 8 weeks. Is there convincing evidence the medication reduces mean blood pressure? Let d = before − after." | `mu_d = 0` / `mu_d > 0` |
| `2tt-fert` | plants | "{n} tomato plants are randomly assigned to fertilizer A ({n1}) or fertilizer B ({n2}); yield is recorded for each plant. Is there convincing evidence mean yields differ? Let mu1 = A, mu2 = B." | `mu1 - mu2 = 0` / `mu1 - mu2 != 0` |
| `2tt-recall` | music | "Students are randomly assigned to study with instrumental music ({n1}) or music with lyrics ({n2}), then take a recall test. Is there convincing evidence mean recall is higher with instrumental? Let mu1 = instrumental, mu2 = lyrics." | `mu1 - mu2 = 0` / `mu1 - mu2 > 0` |
| `2tt-commute` | commute | "Independent random samples of {n1} commuters in city A and {n2} in city B record commute times. Is there convincing evidence mean commute times differ? Let mu1 = A, mu2 = B." | `mu1 - mu2 = 0` / `mu1 - mu2 != 0` |
| `gof-candy` | candy | "A company claims its candy colors are {dist} (e.g., 30% red, 30% blue, 20% green, 20% yellow). A random sample of {n} candies is classified by color. Is there convincing evidence the color distribution differs from the claim?" | words: "the color distribution matches the company's claim" / "at least one color proportion differs from the claim" |
| `gof-shelter` | pets | "A shelter director claims adoptions are 50% dogs, 30% cats, 20% other. A random sample of {n} adoption records is classified. Is there convincing evidence the distribution of adoptions differs from the claim?" | words as above (adoptions) |
| `gof-orders` | cafeteria | "A manager believes online lunch orders are equally likely Monday through Friday. A random sample of {n} orders is classified by day. Is there convincing evidence orders are not equally distributed across the days?" | words as above (equal across days) |
| `hom-entree` | cafeteria | "Separate random samples of {nG} students from each of grades 9, 10, 11, and 12 choose their favorite entree (pizza, burgers, salad, pasta). Is there convincing evidence the entree preference distribution differs among the four grades?" | "the distribution of entree preference is the same for all four grades" / "at least one grade's distribution differs" |
| `hom-relief` | clinic | "Patients are randomly assigned to one of three pain relievers ({nG} each); relief is recorded as none, partial, or complete. Is there convincing evidence the distribution of relief differs among the three treatments?" | same-pattern words |
| `hom-genre` | streaming | "Independent random samples of {nG} viewers from each of three age groups record each viewer's preferred genre (comedy, drama, action, documentary). Is there convincing evidence genre preference distributions differ across the age groups?" | same-pattern words |
| `ind-sleep` | sleep | "One random sample of {n} students is taken; each is classified by grade level (9–12) AND by whether they get 8+ hours of sleep. Is there convincing evidence of an association between grade level and getting enough sleep?" | "there is no association between grade level and sleep amount" / "there is an association" |
| `ind-genre` | streaming | "A single random sample of {n} moviegoers is classified by age group (under 20, 20–39, 40+) AND preferred genre (comedy, drama, action, documentary). Is there convincing evidence the two variables are associated?" | no association / association words |
| `ind-injury` | sports | "One random sample of {n} student-athletes is classified by sport season (fall, winter, spring) AND whether they had an injury this year. Is there convincing evidence of an association between season and injury?" | no association / association words |
| `stt-cookie` | manufacturing | "For each of {n} cookie batches, oven temperature and cookie spread (cm) are recorded. Is there convincing evidence of a linear relationship between temperature and spread? Let beta = slope of the population regression line." | `beta = 0` / `beta != 0` |
| `stt-gpa` | sleep | "For a random sample of {n} students, average nightly sleep hours and GPA are recorded. Is there convincing evidence of a positive linear relationship between sleep and GPA?" | `beta = 0` / `beta > 0` |
| `stt-dist` | commute | "For a random sample of {n} students, distance from school (miles) and commute time (minutes) are recorded. Is there convincing evidence commute time increases linearly with distance?" | `beta = 0` / `beta > 0` |

Coverage check: 18 interval frames + 27 test frames = 45; every one of the 15 menu
procedures has 3 frames; all four units represented (U6: prop frames; U7: mean frames;
U8: chi-square frames; U9: slope frames).

### Honest-distractor rules (generator-level invariants)

- **H1 — Mutually exclusive goal lexicons.** Interval stems use only {estimate, how large/different, construct an interval, plausible values}. Test stems use only {convincing evidence, test the claim, do the data suggest}. Never both; never "determine if and by how much".
- **H2 — Explicit design cues.** Pairing is never inferable-only: paired stems contain "same/each ... twice/both/before and after/matched"; independent stems contain "independent/separate random samples" or "randomly assigned to two groups".
- **H3 — Homogeneity is never 2-prop-defensible.** Every homogeneity frame has ≥3 response categories AND ≥3 groups, with a non-directional "distributions differ" question. Conversely every 2-prop frame has exactly 2 groups, a binary response, and a claim about ONE category's proportion (often directional — chi-square can't be one-sided).
- **H4 — Independence vs homogeneity decided by design only.** Independence frames say "one random sample ... classified by BOTH"; homogeneity frames say "separate samples from each of ..." / "randomly assigned to k groups".
- **H5 — GOF is never 1-prop-defensible.** GOF frames claim a full distribution over ≥3 categories; 1-prop frames have binary outcomes with a single-value claim.
- **H6 — Slope frames** always record TWO quantitative variables "for each" individual and ask about the linear relationship/slope; mean frames never mention a second quantitative predictor.
- **H7 — No σ ever given** (z-for-mean stays off-menu and undefendable).
- **H8 — Dropdown distractors are always real menu items** (canonical strings), never invented procedures, and never a second defensible answer under H1–H7.
- **H9 — Planted errors (l12) are distance-1 only**, from the planted-error table, each with a nameable missed cue.
- **H10 — Subscript/parameter definitions in `givenText`** for every 2-group and paired test frame, so typed Hₐ direction has exactly one correct sign.
- **H11 — Numbers can't create side-quests**: n ≥ 30 for means, expected counts > 5 by construction, random sampling/assignment always stated — condition-checking never disqualifies a menu option.

---

## Grading Rules Design

`grading-rules.js` exports `gradeField(fieldId, answer, context)` and `getRule(fieldId)`
(returns null), following the U8 pattern: normalize → blank check → per-field branch.
Expected values read via `context.answers[fieldId]` / flattened context
(`withAnswerContext`).

### Per-field rule table

| Field(s) | Type | Rule |
|---|---|---|
| `l01_responseType`, `l03_goal`, `l04_design`, `l05_catProcedure`, `l06_chiType`, `l07_dataShape`, `l07_design`, `l07_family`, `l08_goal`, `l08_parameter`, `l09_paramSymbol`, `l09_paramDef` | exact | E on normalized exact match; I otherwise with cue-specific feedback (templates per field, fed by frame fields `typeCue` / `goalCue` / `designCue`). |
| `l02_paramFamily` | exact + special P | E exact; P iff `expected === "The slope of a regression line"` and student chose `"Means"`; I otherwise. |
| `l08_procedure`, `l10_procedure`, `l11_procedure`, `l12_procedure`, `l13_hypPair` (see below), `l14_procedure`, `l15_procedure` | procedure distance | See distance metric. |
| `l13_hypPair` | tagged options | E = correct option; P = option tagged `direction`; I = `stat`/`param` tags, each with its own feedback string. |
| `l11_justify`, `l15_justify` | 3-dimension keyword rubric | E ≥3 consistent dims; P = 2, no contradictions; I otherwise. AI fallback. |
| `l12_missedCue` | cue-keyed keyword rubric | E ≥2 keyword families incl. design family; P = 1; I = 0 or wrong cue. AI fallback. |
| `l14_null`, `l14_alt`, `l15_null`, `l15_alt` | hypotheses text | Alias/keyword rules below. |

### Procedure distance metric

`PROCEDURES[name] → {family, structure, goal}` (imported from generator or duplicated
constant — implementer's choice, but strings must match the canonical menu exactly).

- distance = number of differing dimensions between selected and expected procedure.
- **E**: distance 0.
- **P**: distance 1, OR the pair is in the special adjacency set:
  `{1-prop z-test ↔ GOF}`, `{2-prop z-test ↔ homogeneity}`, `{homogeneity ↔ independence}`.
- **I**: everything else.
- Feedback templates name the wrong dimension(s):
  - structure miss (paired/two-sample): "Right family and goal — but check HOW the two measurement sets were produced: {designCue}."
  - goal miss: "Right procedure family — but the question asks to {goalCue}, so you need the {interval|test} version."
  - family miss: "Start over at node 1: the response variable here is {responsePhrase} ({typeCue})."
  - adjacency-set feedback is pair-specific (reuse the l05/l06 explanation strings).

### Hypotheses text grading (`l14_null`, `l14_alt`, `l15_null`, `l15_alt`)

**Normalization pipeline** (apply to student input before matching):
lowercase → strip all whitespace → strip leading `h0:|ho:|h₀:|hnull:|ha:|h1:|hₐ:` →
symbol map: `μ→mu`, `β→beta`, `≠→!=`, `<>→!=`, `=/=→!=`, `₁→1`, `₂→2`, `ᵈ→d`,
`p̂|phat|p-hat→PHAT`, `x̄|xbar|x-bar→XBAR`, `subscript underscores removed`
(`mu_1→mu1`, `mu_d→mud`, `beta_1→beta1→beta`), `pa/pb-style letter subscripts mapped
to 1/2 by the group order defined in givenText`.

**Hard I-triggers (checked first, specific feedback):**
- Contains `PHAT` or `XBAR` → I: "Hypotheses are about population parameters — never p̂ or x̄."
- Null field contains `<`, `>`, or `!=` → I: "H₀ is always an equality."
- Alt field contains `=` alone (no inequality) → I: "Hₐ must be an inequality (<, >, or ≠)."

**Symbolic procedures — accepted alias sets** (normalized forms; `{v}` = the frame's
null value, accepted with or without trailing zeros):

| Procedure | H₀ accepted | Hₐ accepted (direction from frame) |
|---|---|---|
| 1-prop z-test | `p={v}`, `p-{v}=0` | `p>{v}` / `p<{v}` / `p!={v}` |
| 2-prop z-test | `p1=p2`, `p1-p2=0`, `p2-p1=0` | `p1>p2`, `p1-p2>0` (mirror forms `p2<p1`, `p2-p1<0` accepted; ≠ symmetric) |
| 1-sample t-test | `mu={v}`, `mu-{v}=0` | `mu>{v}` / `mu<{v}` / `mu!={v}` |
| Paired t-test | `mud=0`, `mudiff=0`, `mu_d=0`→`mud=0` | `mud>0` / `mud<0` / `mud!=0` (direction per the frame's stated d = order) |
| 2-sample t-test | `mu1=mu2`, `mu1-mu2=0`, `mu2-mu1=0` | as 2-prop pattern with mu |
| Slope t-test | `beta=0`, `beta1=0` | `beta>0` / `beta<0` / `beta!=0` |

- **P-triggers (symbolic)**: right parameter symbol(s) and relation but wrong direction
  in Hₐ ("Right parameter — wrong direction. The claim says '{claimPhrase}'."); right
  structure but wrong null value (e.g. `p=0.5` when frame says 0.6) → P with "Check the
  claimed value in the scenario."; bare `mu=0` for paired (missing d subscript) → P:
  "Paired hypotheses are about μ_d, the mean DIFFERENCE."
- **I otherwise**, feedback shows the expected display form from `hypotheses.display`.

**Chi-square procedures — keyword rubric (word hypotheses):**

| Test | H₀ requires (keyword families) | Hₐ requires |
|---|---|---|
| GOF | (`distribution` OR `proportions`) AND (`as claimed|matches|equal to|same as` OR restates the claimed percents) | `at least one` OR `differs|not as claimed|different from the claim` (NOT "all are different" → I with the U8-style feedback) |
| Homogeneity | `distribution` AND `same` AND mention of the groups (frame keyword, e.g. `grades|treatments|age groups`) | `at least one ... differs` OR `not the same` |
| Independence | `no association` OR `independent` (between the two named variables) | `association` OR `not independent` |

- E = both required families present; P = one family present, a vague group/variable
  reference, or ANOTHER chi-square test's wording (e.g. "no association" on a
  homogeneity frame → P, feedback explains the design difference — wording confusion,
  not a selection error, since the procedure field is graded separately); I =
  directional language, sample-stat phrasing, or non-chi-square (symbolic) hypotheses.

### Justification rubric implementation note

For `l11_justify`/`l15_justify`, consistency-checking means each dimension has a
CORRECT keyword family (from the frame tags) and a CONTRADICTING family (the opposite
tag's lexicon). Count a dimension as: consistent (+1), contradicted (forces ≤P, two
contradictions force I), or absent. This mirrors the U8 `explanation` opposite-theme
guard.

---

## AI-Grader Prompt Outline (`ai-grader-prompt.txt`)

Single generic prompt, U8 style, used as fallback for the four textarea fields
(`l11_justify`, `l12_missedCue`, `l15_justify` — and optionally the chi-square word
hypotheses). Template variables supplied by the platform from context:

```
You are an AP Statistics teacher grading a student's free response for the
Skills Focus topics 7.10/8.7/9.6 (Selecting an Appropriate Inference Procedure).

Question:
{{problemText}}

Scenario:
{{scenarioText}}

Correct procedure: {{correctProcedure}}

Decision facts (ground truth for this scenario):
{{decisionFacts}}        ← generator emits e.g. "response variable: quantitative (mpg);
                            design: paired — same cars on both fuels; goal: significance
                            test ('convincing evidence'); parameter: mu_d"

Reference (what a strong answer includes):
{{correctAnswer}}

Student Answer:
{{STUDENT_ANSWER}}

Grade using:
- "E": names the decision dimensions correctly AND consistently with the correct
  procedure (variable type, sample/group structure incl. paired-vs-independent where
  relevant, interval-vs-test), in context.
- "P": gets some dimensions right but omits one, is vague about the design, or is
  correct but does not connect the cues to the procedure.
- "I": misidentifies a dimension (e.g., calls paired data independent), justifies a
  different procedure than the correct one, or gives generic statements with no
  scenario cues.

Misconception guards:
- A justification that contradicts the student's own procedure selection caps at P.
- "We use t because the sample is small" or "z because n is large" is NOT a valid
  selection reason — do not award E for it.
- Restating the procedure name without citing scenario cues is not a justification.

Return ONLY this JSON:
{ "score": "E" or "P" or "I", "feedback": "1–3 sentences of actionable feedback." }
```

---

## Hints Plan

`hints.perField` — one entry per unique field id (all 27 fields; texts given in the
mode details above; capstone fields reuse the earlier band's wording). Standard penalty
ladder:

```json
"penalty": { "0": "gold", "1": "silver", "2": "bronze", "3": "tin" }
```

Because field ids are unique per mode, no per-level hint hacks are needed.

---

## Display Config & Renderer Needs

```json
"display": {
  "showGraph": false,
  "graphType": null,
  "infoPanel": [
    { "label": "Level", "value": "{{levelName}}" },
    { "label": "Task",  "value": "{{problemText}}" },
    { "label": "Given", "value": "{{givenText}}" }
  ]
}
```

**Renderer needs: none.** No scatterplots, residual plots, normal curves, tables, or
new visuals. Chi-square scenarios describe their tables in prose (counts never needed);
this matches how U8 presents two-way-table information in `givenText` as plain text.

---

## Progression Block (manifest)

- `streaksPerField: false`, `streakFields: ["problem"]` (U8 pattern).
- 15 tiers mirroring the mode list; `l01` `"default"`, all others `{"gold": 3}`.
- Celebration messages (one per tier, in voice of existing cartridges):
  l01 "You can tell categories from numbers — the tree starts here." · l02 "Proportions,
  means, slope — you know which parameter family you're in." · l03 "Estimate vs
  evidence: you read the question's intent." · l04 "Paired vs independent — the AP
  exam's favorite trap doesn't fool you." · l05 "One proportion or a whole
  distribution — sorted." · l06 "GOF, homogeneity, independence: you pick by DESIGN."
  · l07 "You can walk the decision tree out loud." · l08 "Tree complete: scenario to
  procedure, every node justified." · l09 "You name parameters precisely — populations,
  not samples." · l10 "Full menu, no scaffolds: you chose correctly." · l11 "You can
  defend your procedure like an FRQ part (a)." · l12 "You can diagnose someone ELSE's
  wrong procedure — true mastery." · l13 "You recognize correct hypotheses instantly."
  · l14 "Procedure + hypotheses, from scratch. That's the whole skill." ·
  l15 "Grand capstone complete — Units 6–9 synthesis unlocked. You're exam-ready."

---

## Implementation Notes (non-pedagogical)

- Register the cartridge in `cartridges/registry.json` and `platform/app.html`
  (cartridge-select option), matching how other apstats cartridges are listed.
- `generator.js` exports `generateProblem(modeId, context, mode)`; `grading-rules.js`
  exports `gradeField` + `getRule` (null); both ES modules, no external deps.
- The `PROCEDURES` dimension map and the canonical menu array must exist in exactly
  one place and be imported/copied verbatim — a mismatch silently breaks distance
  grading.
- Shuffle bags keyed per mode; bag refill applies the mode's balancing rule
  (l01 alternation, l02 slope quota ≥2/8, l03 alternation, l04/l05 alternation,
  l06 even 3-cycle, l10+ no-repeat-procedure-twice).
- `manifest.json` `grading` block: `rubricFile`, `aiPromptFile`, E/P/I scale —
  identical shape to U8.

## Animations (deferred)

Ship with NO `animation` keys in the manifest. If/when generated later (via
`/create-animations`), the natural set is one per band, not per mode:
`DecisionTreeOverview.mp4` (Sort band intro), `PairedVsIndependent.mp4`,
`ChiSquareFamilyByDesign.mp4`, `FullMenuWalkthrough.mp4`, `HypothesesAnatomy.mp4`.
Not required for implementation.

---

## Open Questions for the Teacher

1. **Mode names** — band-style names ("Sort 1: …", "Capstone 2: …") are used here
   because the cartridge is cross-unit. Prefer CED-topic prefixes ("9.6a: …") for
   consistency with U6–U8 cartridges?
2. **Ambiguous 2×2 cases** — scenarios where chi-square homogeneity and a two-sided
   2-prop z-test are both defensible are EXCLUDED by rule H3. Want an optional
   advanced mode that teaches the "both acceptable on the AP exam" nuance instead?
3. **z-for-mean trap** — the menu omits "z-test for a mean" entirely. Include it as a
   permanently-wrong 16th option to catch the σ-known misconception, or keep the menu
   clean (current design: keep it off)?
4. **l15 scope** — the grand capstone uses test frames only (hypotheses required).
   Alternative: include interval frames where the expected H₀/Hₐ entry is the literal
   word "none" — worth the confusion risk?
5. **Unlock pacing** — all modes gate at `{gold: 3}` (U8 pattern). Prefer `{gold: 1}`
   for the six Sort modes (U6/U7 pattern) so strong students reach the capstones in
   one class period?
6. **Justification strictness** — should `l11_justify`/`l15_justify` require an
   explicit sentence frame ("…so the data are paired, therefore…") for E, or is the
   current 3-dimension keyword rubric (any phrasing) the right leniency?
7. **Hypotheses input style** — l14/l15 use typed `text` fields with the alias grammar
   above. If typing `mu_d`/`p1-p2` proves too fiddly for students, fall back to the
   l13 dropdown-pair format for l14 and keep typing only in l15?
