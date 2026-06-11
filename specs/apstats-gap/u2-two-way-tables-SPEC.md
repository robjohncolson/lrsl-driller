# apstats-u2-two-way-tables — Two-Way Tables & Association (2.2–2.3)

DESIGN SPEC — implement as 4 cartridge files (`manifest.json`, `generator.js`, `grading-rules.js`, `ai-grader-prompt.txt`) in `cartridges/apstats-u2-two-way-tables/`. This spec is complete: no pedagogical decisions remain open except the items in "Open Questions for the Teacher" (defaults are given for every one of them — implement the defaults unless told otherwise).

## Meta

| Field | Value |
|-------|-------|
| ID | `apstats-u2-two-way-tables` |
| Name | Two-Way Tables & Association (2.2–2.3) |
| Subject | AP Statistics |
| Description | Read two-way tables; compute joint, marginal, and conditional relative frequencies; pick the right denominator; build and compare conditional distributions; read segmented bar charts; judge association descriptively (no inference). |
| shortCode (registry) | `U22` |

## CED Alignment

- **Topic 2.2 — Representing Two Categorical Variables** (UNC-1.P): two-way tables, joint/marginal relative frequencies, segmented bar charts as a display of conditional distributions.
- **Topic 2.3 — Statistics for Two Categorical Variables** (UNC-1.Q, UNC-1.R): conditional relative frequencies, comparing conditional distributions, describing association between two categorical variables.

**Position in the sequence:** descriptive successor to `apstats-u1-categorical-tables` (1.3: one-way tables) and descriptive **prerequisite** to `apstats-u8-unexpected-results` (8.1–8.6: chi-square). This cartridge NEVER mentions chi-square, expected-count formulas, p-values, or "statistically significant." Mode l11 foreshadows the 8.4–8.6 "no association ⇒ same conditional distribution" idea purely with proportional reasoning. Adjacency note: `apstatu4l1l2` drills joint/conditional PROBABILITY from two-way tables (4.3–4.6) — this cartridge stays descriptive (relative frequencies, association) and never uses probability notation like P(A|B) in student-facing text.

`config.skills`:

```
APSTAT-2.2-IDENTIFY-FREQUENCY-TYPE
APSTAT-2.2-READ-TWO-WAY-TABLE
APSTAT-2.2-JOINT-RELATIVE-FREQUENCY
APSTAT-2.2-MARGINAL-RELATIVE-FREQUENCY
APSTAT-2.3-CHOOSE-DENOMINATOR
APSTAT-2.3-CONDITIONAL-RELATIVE-FREQUENCY
APSTAT-2.3-CONDITIONAL-MEANING
APSTAT-2.3-CONDITIONAL-DISTRIBUTION
APSTAT-2.2-SEGMENTED-BAR-READING
APSTAT-2.3-COMPARE-DISTRIBUTIONS-ASSOCIATION
APSTAT-2.3-NO-ASSOCIATION-INTUITION
APSTAT-2.3-JUDGE-SUPPORTED-CLAIM
APSTAT-2.3-ASSOCIATION-RESPONSE
```

---

## Progression Overview (14 modes)

Mode ids use the `lNN-` convention. l01 unlocks by `"default"`; every other mode unlocks by `{ "gold": 3 }` (house chain, same as u1/u8). Expected ~4–8 problems per mode to reach 3 golds. `progression.tiers` mirrors the modes 1:1 with a celebrationMessage each (write encouraging, skill-specific messages in the style of u8; final tier message: "TOPICS 2.2–2.3 COMPLETE! You can describe association between two categorical variables!").

| # | Mode ID | Name | CED | Input(s) | Problem shape | E/P/I sketch |
|---|---------|------|-----|----------|---------------|--------------|
| 01 | `l01-frequency-type-vocab` | 2.2a: Joint, Marginal, or Conditional? | 2.2 | choice (3 fixed options) | A value in a rendered table is highlighted OR a percent is described verbally; classify it as joint / marginal / conditional relative frequency | E = correct class; I = other (no P) |
| 02 | `l02-read-and-total` | 2.2b: Read the Table & Find Totals | 2.2 | number ×3 | Table with marginals hidden; read one highlighted cell, compute one row/column total, compute the grand total | per field: E exact; P off-by-1 or within partialTolerance; I else |
| 03 | `l03-joint-relative-frequency` | 2.2c: Joint Relative Frequency | 2.2 | number ×2 (proportion, percent) | Highlighted cell; compute cell ÷ grand total as proportion (3 dp) and percent (1 dp) | E within tolerance; P near-miss or percent/proportion-slot swap; I incl. wrong-denominator traps |
| 04 | `l04-marginal-relative-frequency` | 2.2d: Marginal Relative Frequency | 2.2 | number ×2 | Compute (row or column total) ÷ grand total as proportion + percent | same as l03 |
| 05 | `l05-choose-denominator` | 2.3a: Choose the Denominator | 2.3 | dropdown (4 templated options) | Given a question sentence ("What proportion of …?"), pick which number belongs in the denominator | E = correct option; I = other |
| 06 | `l06-conditional-given-group` | 2.3b: Conditional Relative Frequency | 2.3 | number ×2 | Compute a conditional relative frequency in the stated direction (proportion + percent) | E within tolerance; I with targeted trap feedback for grand-total and reverse-conditional denominators; P near-miss |
| 07 | `l07-which-conditional` | 2.3c: Same Cell, Two Percents | 2.3 | choice (A–D, lettered in problem text) | "A student computed {{cell}}/{{denominator}} ≈ v%. Which statement does v% describe?" — distinguish P(A\|B), P(B\|A), joint, marginal | E = correct letter; P = partialKeywords match; I = other |
| 08 | `l08-conditional-distribution` | 2.3d: Build a Conditional Distribution | 2.3 | number ×3 (percents) | Compute the full conditional distribution (3 response categories) for one named group; must total 100% | per field E/P/I; traps for "other group's distribution" and marginal distribution |
| 09 | `l09-segmented-bar-reading` | 2.2e: Read the Segmented Bar Chart | 2.2 | choice (2 templated options) + number | SVG segmented bar chart (two 100%-stacked bars); say which group has the larger % of a category, and read off one labeled segment percent | choice E/I; number E within ±0.5 of the printed label |
| 10 | `l10-association-compare` | 2.3e: Compare to Judge Association | 2.3 | number ×2 + choice (Yes/No) | Compute the same-direction conditional percent for both groups, then judge "do these data show an association?" | numbers as l06; choice E/I keyed to the generated gap |
| 11 | `l11-no-association-fill` | 2.3f: What Would NO Association Look Like? | 2.3 (foreshadows 8.4–8.6) | number ×2 | One cell shown as "?"; fill in the count that makes both groups' conditional distributions identical, then state the shared percent | count E exact / P off-by-rounding; trap for copying group A's count; percent E within tolerance |
| 12 | `l12-claim-judge` | 2.3g: Judge the Claim | 2.2–2.3 | choice (A–D, lettered in problem text) | u1-style "which statement is supported by the table?" with denominator-confusion distractors | E = correct letter; P = partialKeywords; I = other |
| 13 | `l13-mixed-capstone` | Capstone I: All Three Frequencies | 2.2–2.3 | number ×3 (percents) | One table, three questions: one joint, one marginal, one conditional percent | per field E/P/I with cross-wired traps |
| 14 | `l14-association-capstone` | Capstone II: Association in Context | 2.3 | textarea (rows 6) | AP-style free response: "Do these data suggest an association between X and Y? Support your answer with appropriate calculations." | rubricText keyword pass + AI-grader fallback (see §AI Grader) |

**Input field IDs are unique across all modes** (lesson learned from u8's hint-collision hack). Full list with hints in §Hints Plan.

---

## Mode Details

Every mode's `generateProblem` returns the u1 shape **plus a top-level `answers` map**: `{ modeId, prompt, stem, question, scenario, data, context, answers }` where `scenario` is the HTML string (see §Renderer) and `context.answerKey` carries per-field grading rules. `answers` is the u8 pattern (`{ fieldId: { value } }`, one entry per input field) — the platform builds the AI grader's `gradingPairs`/`expectedAnswer` from `problem.answers`, NOT from `context.answerKey` (platform.js `gradeWithAI`), so omitting it sends "expected=undefined" to the AI; required for l14, return it from every mode. Reuse u1's `sharedState` shuffle-bag (`nextFromShuffleBag`), `assignLetters`, `shuffle`, `randomInt`, `roundTo`, `formatNumber`, `getRandom`, `cloneValue` helpers verbatim.

**Template-variable contract:** the platform interpolates `{{var}}` in manifest labels, input options, and `hints.perField` with a flat `context[key]` lookup at render time — every variable used in the manifest (`groupA`, `groupB`, `groupVar`, `responseVar`, `catX`, `catY`, `cat1`, `condGroup`, `N`, `T_A`, `T_B`, `T_groupA`, `T_catX`, `p_X`, `optA`–`optD`, …) must therefore be a **top-level key on the returned `context`** in every mode that uses it. By contrast, the `{{…}}` placeholders shown inside answerKey/feedback strings in this spec are generator-time shorthand: build those strings with the real values in generator.js (the platform does NOT interpolate grading feedback).

### l01 — Joint, Marginal, or Conditional? (choice)

Field: `freq_type_choice`, options (fixed, in manifest): `["Joint relative frequency", "Marginal relative frequency", "Conditional relative frequency"]`.

Two prompt variants, alternated by shuffle bag:

1. **Highlighted-value variant**: render the full table with marginals; highlight (amber) either a cell, a row/column total, and ask: "The highlighted value was divided by {{denominatorPhrase}} to get {{value}}. Which type of relative frequency is this?" `denominatorPhrase` ∈ {"the grand total", "the total for {{groupA}}", "the total for {{catX}}"}.
   - cell ÷ grand → Joint; total ÷ grand → Marginal; cell ÷ row-or-column total → Conditional.
2. **Verbal variant** (no table needed, but still render it for context): sentences like "{{p}}% of ALL students surveyed are {{groupA}} who chose {{catX}}." (joint) / "{{p}}% of all students are {{groupA}}." (marginal) / "Among {{groupA}}, {{p}}% chose {{catX}}." (conditional). Generator computes the true `p` from the table — never invent a number not derivable from the table.

Constraint: the three candidate interpretations must have numerically different values (HD-1 below), so the stated `p` matches exactly one classification.

answerKey: `choiceText` with `aliases: [correctOptionText]` (full option string; the platform passes the selected option text, and u1's grader matches full text only via `aliases` — `accepted` matches a standalone typed letter and would never fire here), `feedback` explains the denominator rule: "Joint = cell ÷ grand total. Marginal = row/column total ÷ grand total. Conditional = cell ÷ a row or column total."

### l02 — Read the Table & Find Totals (number ×3)

Fields: `cell_count` (min 0, step 1), `group_total` (min 0, step 1), `grand_total_count` (min 0, step 1).

Render the table **without** the marginal row/column (body cells only). Highlight the asked cell. Prompt: three bullet questions: "How many {{groupA}} chose {{catX}}?" / "How many {{groupB}} were surveyed in total?" / "How many students were surveyed in all?"

Constraints: asked cell value unique within its row and column (no ambiguity); all cells ≥ 2.

answerKey: all three `type: "integer", tolerance: 0, partialTolerance: 1` (u1's off-by-1 → P behavior), feedback names the row/column to sum.

### l03 — Joint Relative Frequency (number ×2)

Fields: `joint_proportion` (min 0, max 1, step 0.001), `joint_percent` (min 0, max 100, step 0.1).

Full table with marginals rendered; one cell highlighted. "What proportion of ALL students surveyed are {{groupA}} who chose {{catX}}? Enter the proportion (3 decimal places) and the percent (1 decimal place)."

answerKey:
- `joint_proportion`: `type:"numeric", value: round(cell/N, 3), tolerance: 0.001, partialTolerance: 0.01, percentSwapCatch: true, trapValues: [{value: round(cell/T_row,3), feedback: "You divided by the {{groupA}} total — that is the conditional relative frequency. 'Of ALL students' means divide by the grand total {{N}}."}, {value: round(cell/T_col,3), feedback: "You divided by the {{catX}} total. 'Of ALL students' means divide by the grand total {{N}}."}]`
- `joint_percent`: same ×100, `tolerance: 0.1, partialTolerance: 1`, same traps ×100.

### l04 — Marginal Relative Frequency (number ×2)

Fields: `marginal_proportion`, `marginal_percent` (same ranges as l03).

Alternate (shuffle bag) between asking for a **row** (group) marginal and a **column** (response-category) marginal: "What percent of all students surveyed chose {{catX}}?" Highlight the relevant total cell.

answerKey: same structure as l03. Traps: the largest single cell in that row/column ÷ N (joint, feedback: "That's just one cell — a marginal uses the whole row/column total"), and cell ÷ that same total (conditional, feedback: "You conditioned on a group — a marginal divides a TOTAL by the grand total").

### l05 — Choose the Denominator (dropdown)

Field: `denominator_choice`, options `["{{optA}}","{{optB}}","{{optC}}","{{optD}}"]`, placeholder "Select...".

Prompt shows the table plus ONE question sentence drawn from three directions (rotated by shuffle bag so no denominator is always correct):
- row-conditional: "What proportion of {{groupA}} chose {{catX}}?" → group total
- column-conditional: "What proportion of the students who chose {{catX}} are {{groupA}}?" → category total
- joint: "What proportion of all students surveyed are {{groupA}} who chose {{catX}}?" → grand total

The four options (shuffled, each carrying its real number so the choice is concrete):
- "{{N}} — the grand total of all students"
- "{{T_groupA}} — the total number of {{groupA}}"
- "{{T_catX}} — the total number who chose {{catX}}"
- "{{cell}} — the number of {{groupA}} who chose {{catX}}" (always wrong: it's the numerator)

answerKey: `choiceText`, `aliases: [correctOptionText]` (not `accepted` — that is letter-only in u1's grader), feedback: "The group named right after 'of' in the question is the denominator group. 'Of {{groupA}}' → divide by {{T_groupA}}." No P tier.

### l06 — Conditional Relative Frequency (number ×2)

Fields: `conditional_proportion`, `conditional_percent`.

Alternate row-conditional and column-conditional questions (shuffle bag). "Among {{groupA}}, what proportion chose {{catX}}?" Answer = cell ÷ T_groupA, clean by construction (§Generator).

answerKey: numeric as l03, with traps:
- joint value (cell ÷ N): "You divided by the grand total. 'Among {{groupA}}' means the denominator is the {{groupA}} total, {{T_groupA}}."
- reverse conditional (cell ÷ T_catX): "You computed the percent of {{catX}}-choosers who are {{groupA}} — the reverse condition. Re-read which group follows 'among'."
- `percentSwapCatch: true` on both fields.

### l07 — Same Cell, Two Percents (choice A–D)

Field: `conditional_meaning_choice`, options `["A","B","C","D"]` (lettered statements listed in the problem text, u1 structure-mode style).

Prompt: table rendered; "Jordan computed {{cell}} ÷ {{T_catX}} ≈ {{v}}% from this table. Which statement is what {{v}}% actually describes?"

Statements (shuffled with `assignLetters`):
- correct: "Among the students who chose {{catX}}, {{v}}% are {{groupA}}."
- reverse: "Among {{groupA}}, {{v}}% chose {{catX}}." (false: true value differs by ≥ 10 points, HD-5)
- joint: "{{v}}% of all students surveyed are {{groupA}} who chose {{catX}}." (false by HD-1)
- marginal: "{{v}}% of all students surveyed chose {{catX}}." (false by HD-1)

Generator alternates which direction is computed (sometimes cell ÷ T_group with statements adjusted) so students can't memorize "column version is right." (The P(A|B)/P(B|A) wording in the overview table is spec shorthand only — student-facing statements always use "among" phrasing; probability notation is never shown, since `apstatu4l1l2` owns it in Unit 4.)

answerKey: `choiceText`, `accepted: [letter]`, `aliases: [correct statement text]`, `partialKeywords: [["among", catX], [groupA, "%"]]`, feedback: "Match the denominator to the 'among' group: dividing by the {{catX}} total conditions on {{catX}}-choosers."

### l08 — Build a Conditional Distribution (number ×3)

Fields: `dist_first_percent`, `dist_second_percent`, `dist_third_percent` (min 0, max 100, step 0.1). Labels are templated: "Percent of {{condGroup}} choosing {{cat1}}:" etc.

Uses 3-response-category scenarios only. "Compute the conditional distribution of {{responseVar}} for {{condGroup}}. Give each percent to 1 decimal place; the three percents must total 100%."

answerKey per field: `type:"numeric", value: p_i, tolerance: 0.1, partialTolerance: 1`, traps:
- other group's percent for the same category: "Those are {{otherGroup}}'s percents — condition on {{condGroup}}."
- marginal percent of the category: "That's the percent of ALL students — divide each {{condGroup}} cell by {{T_condGroup}}, not by anything involving the grand total."
Constraint: for every category, |p_condGroup − p_otherGroup| ≥ 4 points AND |p_condGroup − p_marginal| ≥ 4 points (HD-1), so traps never collide with truth.

### l09 — Read the Segmented Bar Chart (choice + number)

Fields: `larger_group_choice` (choice, options `["{{groupA}}","{{groupB}}"]`), `segment_percent` (number, min 0, max 100, step 0.1).

Scenario HTML = intro paragraph + segmented bar SVG (§Renderer) + the two questions. **No table is shown** — the chart is the only data display. "1) Which group has the larger percent choosing {{catX}}? 2) What percent of {{groupB}} chose {{catY}}? (read the label on the chart)"

Constraints: the compared category's percents differ by ≥ 12 points between groups (visually unambiguous); the asked segment is always ≥ 10% so its label is printed.

answerKey: `larger_group_choice`: `choiceText`, aliases = [correct group name] (`accepted` is letter-only) (E/I). `segment_percent`: `type:"numeric", value: labeled percent, tolerance: 0.5, partialTolerance: 3`, feedback: "Segment height = the conditional percent for that group. Read the printed label inside the {{catY}} segment of the {{groupB}} bar."

### l10 — Compare to Judge Association (number ×2 + choice)

Fields: `assoc_first_percent`, `assoc_second_percent` (number, 0–100, step 0.1), `assoc_choice` (choice, options `["Yes — the conditional distributions differ", "No — the conditional distributions are essentially the same"]`).

Prompt: table rendered. "1) What percent of {{groupA}} chose {{catX}}? 2) What percent of {{groupB}} chose {{catX}}? 3) Based on comparing these conditional relative frequencies, do these data show an association between {{groupVar}} and {{responseVar}}?"

Generator mixes variants 3:1 — **association** (gap ≥ 15 points → "Yes") and **no association** (identical conditional distributions by construction → "No"). The 3–14-point gray zone is NEVER generated (HD-4), so the Yes/No is always defensible without inference.

answerKey: both percents numeric with l06-style traps (joint, reverse); `assoc_choice`: `choiceText`, aliases = [correct option text] (`accepted` is letter-only), feedback: "Association (descriptively): the percent choosing {{catX}} clearly differs between groups. If the groups' conditional distributions match, knowing the group tells you nothing — no association."

### l11 — What Would NO Association Look Like? (number ×2)

Fields: `no_assoc_count` (number, step 1), `no_assoc_percent` (number, 0–100, step 0.1).

Table rendered with group A's row complete, group totals shown for both groups, and ONE cell in group B's row replaced by **?** (highlighted). Other group-B cells are omitted entirely (render as "—") so the "?" is determined only by proportional reasoning, not row subtraction. Prompt: "Suppose {{groupVar}} and {{responseVar}} had NO association — every group has the SAME conditional distribution. 1) What count belongs in the ? cell? 2) What percent of {{groupB}} would that be?"

Construction: p_X = group A's conditional percent for the ? category; `no_assoc_count = T_B × p_X / 100` (integer by construction, §Generator); `no_assoc_percent = p_X`. **Force T_A ≠ T_B** (e.g., 20 vs 40) so equal-percent ≠ equal-count.

answerKey:
- `no_assoc_count`: `type:"integer", tolerance: 0, partialTolerance: 1`, trap: `{value: cell_A, feedback: "That's {{groupA}}'s COUNT. No association means the same PERCENT, and {{groupB}} has a different total ({{T_B}} vs {{T_A}}) — so the count must scale: {{p_X}}% of {{T_B}}."}`
- `no_assoc_percent`: `type:"numeric", value: p_X, tolerance: 0.1, partialTolerance: 1`, feedback: "No association ⇒ {{groupB}} matches {{groupA}}'s conditional percent for {{catX}}: {{p_X}}%."

(This is the descriptive seed of Unit 8 expected counts — do NOT use the words "expected count" or any formula; say "the count that keeps the percents identical.")

### l12 — Judge the Claim (choice A–D)

Field: `table_claim_choice`, options `["A","B","C","D"]`, lettered statements in the problem text (u1 `l13-judge-supported-claim` extended to two-way).

Statements (shuffled):
- **correct**: an exact conditional or joint statement, e.g. "Among {{groupA}}, exactly {{p}}% chose {{catX}}." (value computed and formatted to 1 dp)
- **majority distractor**: "A majority of {{groupB}} chose {{catY}}." — generator guarantees the true value ≤ 46% (HD-2)
- **denominator-swap distractor**: states the JOINT percent but phrases it as a conditional: "Among {{groupA}}, {{jointP}}% chose {{catX}}." — guaranteed false because |conditional − joint| ≥ 4 points (HD-1)
- **ratio or count/percent distractor** (alternate via shuffle bag): "More than twice as many {{groupA}} chose {{catX}} as {{catY}}." with true ratio ≤ 1.8 (HD-3); or "{{cell}}% of all students are {{groupA}} who chose {{catX}}." where `cell` is the raw COUNT and grand total ≠ 100 so count ≠ percent (HD-7)

answerKey: `choiceText`, `accepted: [letter]`, `aliases: [correct text]`, `partialKeywords: [["among", "exactly"], [groupA, catX]]`, feedback: "Check every claim against the table: identify the denominator each percent implies, and verify 'majority' (>50%) and 'twice' claims with the actual counts."

### l13 — Capstone I: All Three Frequencies (number ×3)

Fields: `cap_joint_percent`, `cap_marginal_percent`, `cap_conditional_percent` (0–100, step 0.1).

One table; three labeled questions: "(a) What percent of all students are {{groupA}} who chose {{catX}}? (b) What percent of all students chose {{catX}}? (c) Among {{groupA}}, what percent chose {{catX}}?" — all about the SAME cell/category so the only difference is the denominator.

Constraint: the three answers pairwise differ by ≥ 4 points (HD-1). answerKey: each numeric (tolerance 0.1, partial 1) with **cross-wired traps** — each field's trapValues are the other two answers, with feedback naming the denominator the student actually used.

### l14 — Capstone II: Association in Context (textarea)

Field: `association_response` (textarea, rows 6, placeholder: "Compare the two conditional percents (same direction for both groups), then state whether the data suggest an association, in context.").

Prompt: table rendered (association variant, gap ≥ 15 points). "Do these data suggest an association between {{groupVar}} and {{responseVar}}? Support your answer with appropriate calculations."

answerKey: `type:"rubricText"` (see §Grading Rules) with context fields the rule needs: `pA`, `pB` (1-dp percents), `groupA`, `groupB`, `catX`, `direction:"row"`. AI grader supersedes when toggled (platform behavior — keyword pass runs first, AI can raise to E).

E: both correct same-direction conditional percents (within rounding), an explicit comparison word, and an association conclusion in context.
P: correct structure but one percent wrong/missing, or vague comparison ("they're different") without numbers, or correct numbers with no conclusion.
I: joint/marginal percents used, no comparison at all, or conclusion stated as causation with no comparison ("X causes Y").

---

## Generator Design

### Table model & answer-first construction (mental-math pattern from `lsrl-calculations`)

Never generate raw cell counts and hope the percents are clean. Build tables **answers-first**:

1. Pick the scenario (shuffle bag per mode, key per mode like u1) and the table shape it supports (2 groups × 2 or 3 response categories — group variable is always rows).
2. Pick each group total `T_g` from the scenario-agnostic clean set: **{20, 25, 40, 50}** (l11 forces T_A ≠ T_B; other modes may match or differ).
3. Pick each group's conditional percentages from the clean grid for its total — T=20 → multiples of 5%; T=25 → multiples of 4%; T=40 → multiples of 2.5% (use only multiples of 5% to keep cells even); T=50 → multiples of 2% — with every percent ≥ 8% and percents summing to 100%.
4. Cells = `T_g × p / 100` (exact integers by construction). Grand total `N = ΣT_g` ∈ [40, 100].
   - **Shared-percent modes** (l10's no-association variant, l11): the same conditional percent must give integer cells for BOTH totals, so draw the shared percents from the intersection of the two totals' clean grids. Allowed pairs: (20, 40) → multiples of 5%; (25, 50) → multiples of 4%; (20, 50) and (40, 50) → multiples of 10%. Never pair 25 with 20 or 40 for these modes (intersection degenerates to multiples of 20%).
5. For modes asking joint/marginal proportions (l03, l04, l13): verify every asked proportion terminates within 3 decimal places for the realized `N`; otherwise re-draw. Practical shortcut: prefer (T_A, T_B) pairs with N ∈ {40, 50, 60, 80, 90, 100} — all give ≤ 3-dp proportions for integer cells except N=60/90 cases; check `(cell*1000) % N === 0` explicitly and re-draw if not.
6. **Reject-and-retry loop**: wrap constraint checks in a ≤ 200-attempt loop with a hard-coded fallback table per mode (u1 `buildClaimCounts` pattern). Fallback tables must themselves satisfy every constraint — verify by hand during implementation (e.g., fallback for association modes: T_A=20 [50%, 30%, 20%], T_B=40 [25%, 45%, 30%]).

### Honest-distractor constraints (enforced inside the retry loop)

| Rule | Constraint | Protects |
|------|-----------|----------|
| HD-1 distinct denominators | For the focal cell: cell/N, cell/T_row, cell/T_col pairwise differ by ≥ 0.04 (4 points) | l01, l03–l07, l12, l13 — a wrong denominator is unambiguously wrong, never accidentally right |
| HD-2 majority honesty | Any distractor claiming "majority/more than half": true value ≤ 46% | l12 |
| HD-3 ratio honesty | "More than twice" distractors: true ratio ≤ 1.8 | l12 |
| HD-4 association gap | Association variant: compared conditional percents differ ≥ 15 points. No-association variant: identical by construction. Gap 3–14 never generated | l10, l14 (and l09's ≥ 12-point visual gap) |
| HD-5 reverse separation | \|cell/T_row − cell/T_col\| ≥ 0.10 | l06, l07 |
| HD-6 no degenerates | Every cell ≥ 2; every conditional percent ≥ 8%; no ties within a group when "most common" is referenced | all |
| HD-7 totals not confusable | No cell equals any row/column total; for l12's count-vs-percent distractor, N ≠ 100 and focal cell count ≠ its own joint percent ±0.5 | l02, l12 |

### Context pools (10 scenarios)

Each scenario object: `{ key, intro, groupVar, groups: [..2 names], responseVar, categories: [2–3 names], shape }`. School-survey flavor continuous with u1 (superpower pool reused deliberately so students recognize the data growing a second variable). Modes needing 3 categories (l08, and prefer for l10/l14 richness) draw only from 3-category pools; 2-category modes may use any pool (use the first 2 categories of a 3-cat pool is NOT allowed — use the pool as defined).

| # | key | groupVar (rows) | responseVar (columns) | shape |
|---|-----|-----------------|----------------------|-------|
| 1 | `superpower-by-grade` | Grade level: 9th graders / 11th graders | Superpower preference: Fly, Invisibility, Telepathy | 2×3 |
| 2 | `transport-by-grade` | Grade level: 9th graders / 12th graders | School transportation: Bus, Car, Walk | 2×3 |
| 3 | `snack-by-lunch` | Lunch period: A lunch / B lunch | Snack choice: Chips, Fruit, Cookies | 2×3 |
| 4 | `streaming-by-role` | Role: Students / Teachers | Favorite genre: Comedy, Drama, Documentary | 2×3 |
| 5 | `sport-by-season` | Season: Fall athletes / Spring athletes | Sport type: Team sport, Individual sport | 2×2 |
| 6 | `phone-by-grade` | Grade level: 10th graders / 11th graders | Phone type: iPhone, Android | 2×2 |
| 7 | `pet-by-neighborhood` | Neighborhood: North side / South side | Pet: Dog, Cat, No pet | 2×3 |
| 8 | `breakfast-by-arrival` | Breakfast habit: Ate breakfast / Skipped breakfast | Arrival: On time, Tardy | 2×2 |
| 9 | `gaming-by-grade` | Grade level: 9th graders / 10th graders | Gaming platform: Console, PC, Mobile | 2×3 |
| 10 | `club-by-grade` | Grade level: 9th graders / 12th graders | Activity: Sports, Arts, No activity | 2×3 |

Each scenario's `intro` is one sentence: "A survey asked a sample of {{groups joined}} which {{responseVar phrase}} …" — write all 10 intros in the implementation; keep them neutral and school-appropriate.

### Shared helpers to implement

- `buildCleanTable(scenario, options)` — the answers-first builder above; `options` carries per-mode constraints (`requireAssociation`, `requireNoAssociation`, `minGap`, `forceUnequalTotals`, `cleanJointN`).
- `makeTwoWayTableHTML(table, opts)` — §Renderer. `opts: { hideMarginals, highlight: {r,c}|{rowTotal:r}|{colTotal:c}|{grand:true}, maskCell: {r,c, as: "?"} | {r,c, as: "—"} }`.
- `makeSegmentedBarSVG(table)` — §Renderer.
- u1 utilities copied verbatim (shuffle bag, letters, rounding, RNG).

---

## Grading Rules Design (`grading-rules.js`)

Copy `apstats-u1-categorical-tables/grading-rules.js` as the base engine (answerKey-in-context: `gradeField(fieldId, answer, context)` reads `context.answerKey[fieldId]`) and extend:

| Rule type | Used by | Behavior |
|-----------|---------|----------|
| `integer` | l02, l11 count | u1 behavior: exact → E; off-by-1 or ≤ partialTolerance → P; else trap check, then I |
| `numeric` | all proportion/percent fields | u1 behavior + extensions below |
| `choiceText` | l01, l05, l07, l09 choice, l10 choice, l12 | u1 behavior unchanged — note: `accepted` matches a standalone typed LETTER only (use it for l07/l12); modes whose options are full strings (l01, l05, l09, l10) put the correct option text in `aliases` (alias match → E); keywordSets/partial tiers as in u1 |
| `rubricText` | l14 | NEW — see below |

**Extensions to numeric grading** (checked in this order after the E/P windows miss):

1. `trapValues: [{ value, tolerance?, feedback }]` — if `|answer − trap.value| ≤ (trap.tolerance ?? rule.tolerance)`, return **I** with the trap's targeted feedback (wrong-denominator diagnosis by name). Traps return I, not P — choosing the wrong denominator is THE error this cartridge exists to kill; the feedback does the teaching.
2. `percentSwapCatch: true` — proportion fields: if `|answer/100 − value| ≤ tolerance` return **P** with "That's the percent — this box wants the proportion (decimal)." Percent fields: if `|answer × 100 − value| ≤ tolerance` (i.e., the student entered the proportion; keep the window at `tolerance`, NOT `tolerance × 100`, so the swap catch stays tighter than HD-1's 4-point trap separation and can never absorb a wrong-denominator answer) return **P** with "That's the proportion — multiply by 100 for the percent."

**`rubricText`** (l14): programmatic pre-pass before AI. Normalize the answer (u1 `normalizeText`). Components:
- `hasPA` / `hasPB`: answer contains `pA` / `pB` formatted as percent (accept "62.5", "62.5%", "0.625" — build regex from the values with optional ".0"); 
- `hasComparison`: any of ["higher", "lower", "more", "less", "greater", "compared", "than", "difference", "versus", "vs"];
- `hasAssociation`: any of ["association", "associated", "related", "relationship", "depends", "differs by group"];
- `hasContext`: contains `groupA` or `groupB` AND `catX` (normalized).
Scoring: E = all of {hasPA, hasPB, hasComparison, hasAssociation or explicit "no association" for the no-assoc variant, hasContext}; P = ≥ 3 components; I = ≤ 2. Feedback lists the missing components in plain language. (AI can supersede to E per platform flow; keyword pass keeps the mode playable offline.)

Feedback strings: every rule carries instructive `feedback` (it surfaces on P and I). Never reveal the numeric answer for E-window misses; traps may name the correct denominator but not the final value.

---

## AI-Grader Prompt Outline (`ai-grader-prompt.txt`)

Follow the u1 prompt's terse style (role, score scale, scope whitelist, scope blacklist, leniency note). Outline:

```
You are grading AP Statistics Topics 2.2–2.3 responses about two-way tables
and association between two categorical variables.

Score each field with one of: E (essentially correct), P (partial), I (incorrect).

Stay within the lesson scope only:
- joint, marginal, and conditional relative frequencies from a two-way table
- choosing the correct denominator from the wording of the question
- conditional distributions and comparing them between groups
- reading segmented bar charts
- describing association DESCRIPTIVELY: the conditional distributions clearly
  differ (association) or are essentially the same (no association)

Do NOT credit or expect: chi-square, expected counts, p-values, significance,
hypothesis tests, or causal conclusions. If the student claims causation,
cap the field at P and say association is not causation.

For association explanations require: (1) two conditional percents computed in
the SAME direction, numerically correct within rounding, (2) an explicit
comparison, (3) a conclusion about association stated in context.
Wrong denominators (joint or reverse-conditional percents) are I, and the
feedback must name the denominator the student actually used.

Accept equivalent statistical wording. Accept proportions in place of percents.

Respond with ONLY valid JSON: {"<fieldId>":{"score":"E","feedback":"..."}}
```

The platform spreads ALL `problem.context` fields into the scenario object and injects `gradingPairs`, `studentAnswer`, `expectedAnswer` automatically (see `platform.js` `gradeWithAI`; the pairs are built from top-level `problem.answers` — another reason every mode must return it). The prompt body should reference "the scenario and expected answers provided below" rather than re-declaring placeholders, matching u1.

---

## Hints Plan (`hints.perField` — one entry per unique field id)

| Field | Hint |
|-------|------|
| `freq_type_choice` | "Ask: what was the denominator? Grand total → joint (cell) or marginal (a total). A row or column total → conditional." |
| `cell_count` | "Find the row for {{groupA}} and the column for {{catX}} — the cell where they meet." |
| `group_total` | "Add every cell across that group's row." |
| `grand_total_count` | "Add ALL the cells (or add the two group totals)." |
| `joint_proportion` | "Joint = the highlighted cell divided by the grand total {{N}}." |
| `joint_percent` | "Take the cell ÷ {{N}}, then multiply by 100." |
| `marginal_proportion` | "Marginal = a row or column TOTAL divided by the grand total {{N}} — no single cell involved." |
| `marginal_percent` | "Divide the total for {{catX}} by {{N}}, then multiply by 100." |
| `denominator_choice` | "Find the group named right after 'of' (or 'among') in the question — that group's total is the denominator." |
| `conditional_proportion` | "'Among {{condGroup}}' means: pretend only {{condGroup}}'s row/column exists. Divide the cell by {{condGroup}}'s total." |
| `conditional_percent` | "Cell ÷ {{condGroup}} total, then × 100." |
| `conditional_meaning_choice` | "The number Jordan divided BY tells you the 'among' group. Dividing by the {{catX}} total conditions on students who chose {{catX}}." |
| `dist_first_percent` | "Divide {{condGroup}}'s {{cat1}} cell by {{condGroup}}'s total, × 100. All three percents must add to 100." |
| `dist_second_percent` | "Same denominator as the first: {{condGroup}}'s total — only the cell changes." |
| `dist_third_percent` | "Shortcut check: the three percents must total 100%." |
| `larger_group_choice` | "Compare the {{catX}} segment HEIGHTS — each bar already shows percents of its own group, so you can compare directly." |
| `segment_percent` | "Read the printed label inside the {{catY}} segment of the {{groupB}} bar." |
| `assoc_first_percent` | "{{groupA}}'s {{catX}} cell ÷ {{groupA}}'s total, × 100." |
| `assoc_second_percent` | "Same direction as the first: {{groupB}}'s {{catX}} cell ÷ {{groupB}}'s total, × 100." |
| `assoc_choice` | "If the two percents are clearly different, group membership changes the distribution → association. Essentially equal → no association." |
| `no_assoc_count` | "No association = SAME percent, not same count. Take {{groupA}}'s percent for {{catX}} and apply it to {{groupB}}'s total {{T_B}}." |
| `no_assoc_percent` | "If the distributions match, {{groupB}}'s percent equals {{groupA}}'s percent for {{catX}}." |
| `table_claim_choice` | "Test each claim: what denominator does its percent imply? Check 'majority' (>50%) and 'twice as many' against the actual counts." |
| `cap_joint_percent` | "'Of all students' → divide the cell by the grand total {{N}}." |
| `cap_marginal_percent` | "'Of all students chose {{catX}}' → the {{catX}} COLUMN TOTAL ÷ {{N}}." |
| `cap_conditional_percent` | "'Among {{groupA}}' → the cell ÷ {{groupA}}'s total." |
| `association_response` | "Three sentences: (1) {{groupA}}: __% chose {{catX}}. (2) {{groupB}}: __% chose {{catX}}. (3) Because these percents are clearly different / essentially equal, the data do / do not suggest an association between {{groupVar}} and {{responseVar}}." |

`hints.penalty`: house standard `{"0":"gold","1":"silver","2":"bronze","3":"tin"}`.

---

## Renderer Needs

The platform injects `problem.scenario` via `innerHTML` (`platform/app.html`, `scenario-text` element, ~line 4943) and then runs KaTeX auto-render. Generator-supplied HTML/SVG therefore renders **with zero platform changes**. Two visuals:

1. **Two-way table — upgrade from u1's pipe-text.** `makeTwoWayTableHTML()` returns a real `<table>` with **inline styles only** (Tailwind is compiled from source via `styles.css`, so arbitrary utility classes in injected HTML are NOT guaranteed to exist). Spec: `border-collapse: collapse`; cells `border:1px solid #cbd5e1; padding:4px 10px; text-align:center; font-size:0.95em`; header row and stub column `font-weight:600; background:#f1f5f9`; totals row/column `font-weight:600; background:#f8fafc`; highlighted cell `background:#fef3c7`; masked cell renders `?` (highlighted) or `—`; caption line above the table: "{{groupVar}} vs. {{responseVar}}" in `font-size:0.85em; color:#64748b`. Table is wrapped in `<div style="overflow-x:auto; margin:8px 0">`.

2. **Segmented bar chart — NEW visual, flagged.** No existing generator renders one. Proposal: `makeSegmentedBarSVG(table)` returns an inline `<svg>` string (~340×230): one 100%-stacked vertical bar per group (bar width 64, gap 56), segments bottom-up in category order with fixed palette `["#3b82f6", "#f59e0b", "#10b981"]`, 1px white separators; percent labels (`{{p}}%`, white, 11px, centered) printed inside every segment ≥ 10%; group names under bars (12px, #334155); y-axis with ticks at 0/25/50/75/100% and light gridlines (#e2e8f0); legend row of 10×10 swatches + category names above the chart. Pure string concatenation, no dependencies. If the implementer finds an existing SVG/canvas hook in `graphConfig` renderers that fits better, they may use it, but the scenario-HTML route is the approved default.

`display`: `{ "showGraph": false, "graphType": null, "infoPanel": [] }` (u1 pattern — the scenario block carries the table/chart and the lettered options).

**Integration steps for the implementation session** (not part of this design): add `<option value="apstats-u2-two-way-tables">` to `platform/app.html` cartridge select; append registry entry `{ id, name: "Two-Way Tables & Association (2.2-2.3)", subject: "AP Statistics", description: "Joint/marginal/conditional relative frequencies, denominator choice, conditional distributions, segmented bar charts, association", shortCode: "U22" }`.

---

## Assessment Alignment Map

| Assessment skill | Mode(s) |
|------------------|---------|
| Classify a relative frequency as joint/marginal/conditional | l01, l07 |
| Read cells and compute totals from a two-way table | l02 |
| Compute joint and marginal relative frequencies | l03, l04, l13 |
| Choose the correct denominator from question wording | l05, l06, l07, l12, l13 |
| Compute conditional relative frequencies and distributions | l06, l08, l10, l13 |
| Read/interpret segmented bar charts | l09 |
| Compare conditional distributions to describe association | l10, l14 |
| Reason about what no-association data look like (Unit 8 seed) | l11 |
| Judge whether a claim is supported by a table | l12 |
| Write an AP-style association response | l14 |

---

## Open Questions for the Teacher (defaults in bold — implement defaults unless overridden)

1. **Association gap thresholds**: generated tables are either gap ≥ 15 points (association) or identical (none) — the 3–14-point gray zone is never generated. OK, or do you want a third "can't tell without inference" option to foreshadow Unit 8 more explicitly? **Default: two clean cases only.**
2. **Vocabulary**: l11 uses "no association" exclusively and never the word "independent" (saving it for Unit 4 probability / Unit 8). OK? **Default: yes, avoid "independent."**
3. **Rounding convention**: percents to 1 dp, proportions to 3 dp everywhere (matches u1). **Default: yes.**
4. **Mode count**: 14 modes ≈ 60–110 problems to full completion. Trim candidates if too long: l07 (folds into l05/l06) then l09. **Default: keep all 14.**
5. **Scenario content check**: `breakfast-by-arrival` (tardiness) and `pet-by-neighborhood` — any local sensitivity? Swap-ins available: "coffee vs tea by department," "morning vs afternoon PE by activity." **Default: keep as listed.**
6. **l09 chart-only**: the segmented-bar mode hides the table entirely so students must read the chart. OK, or show both? **Default: chart only.**
7. **AI grading**: l14 works offline via the keyword rubric; AI toggle improves feedback quality. Any modes besides l14 you want AI-eligible? **Default: l14 only relies on it; the prompt covers all fields generically as in u1.**
8. **Group variable orientation**: groups are always rows, responses always columns. AP exams sometimes flip this — add a "transposed table" variant to l05/l06 later? **Default: rows-only for v1; note as future work.**
