# AP Statistics CED Coverage Matrix — lrsl-driller cartridges

Audited 2026-06-11 by reading every AP cartridge's manifest **and generator** (titles and `config.skills` arrays are stale in places — this matrix reflects what the modes actually drill). Verified detail per cartridge: `state/apstats-coverage.json` (local, gitignored) or re-run the audit.

Legend: ✅ drilled · 🟡 partial · ❌ gap · ➖ not drillable (intro/synthesis topic)

| Topic | Status | Where / what's missing |
|---|---|---|
| **U1 — Exploring One-Variable Data (15–23% of exam)** | | |
| 1.1 Intro: variation | ➖ | concept-only topic |
| 1.2 Language of variation | ✅ | apstats-u1-categorical-tables |
| 1.3 Categorical tables | ✅ | apstats-u1-categorical-tables |
| 1.4 Categorical graphs | ❌ | (folded into the two-way-tables design: segmented bars) |
| 1.5 Quantitative graphs (dot/stem/hist) | ❌ | **→ apstats-u1-quant-data design** |
| 1.6 Describing distributions (SOCS) | ❌ | **→ apstats-u1-quant-data design** |
| 1.7 Summary statistics | 🟡 | one 7-step SD mode in lsrl-calculations; median/IQR/fences/resistance missing **→ design** |
| 1.8 Boxplots | ❌ | **→ apstats-u1-quant-data design** |
| 1.9 Comparing distributions | ❌ | **→ apstats-u1-quant-data design** |
| 1.10 Normal distribution | 🟡 | z-scores ✅ (lsrl-calculations ×3 modes), normal areas + inverse ✅ (u5-sampling-dist "Normal Revisited"); **empirical rule missing → design** |
| **U2 — Two-Variable Data (5–7%)** | | |
| 2.1 Intro: related variables | ➖ | |
| 2.2 Representing two categorical | ❌ | **→ apstats-u2-two-way-tables design** |
| 2.3 Statistics for two categorical | ❌ | **→ apstats-u2-two-way-tables design** |
| 2.4 Scatterplots (DOFS) | ❌ | **→ apstats-u2-scatterplots-model-quality design** |
| 2.5 Correlation | ✅ | lsrl-interpretation (interpret), lsrl-calculations (formula relationships) |
| 2.6 Linear regression / prediction | ✅ | residuals (ŷ computation) |
| 2.7 Residuals & residual plots | ✅ | residuals (incl. pattern analysis) |
| 2.8 Least-squares regression | 🟡 | slope/intercept interp (lsrl-interpretation) + formulas (lsrl-calculations); **r², s, extrapolation missing → scatterplots-model-quality design** |
| 2.9 Departures from linearity | ✅ | leverage-points (7 modes) |
| **U3 — Collecting Data (12–15%)** | ✅ all | sampling (3.1–3.4, 18 modes), u3l5-experimental-design (3.5), u3-l6-7-design-inference (3.6–3.7) |
| **U4 — Probability & Random Variables (10–20%)** | ✅ all | apstatu4l1l2 actually covers 4.1–4.12 (62 modes, binomial + geometric included; id/title stale) |
| **U5 — Sampling Distributions (7–12%)** | ✅ all | apstats-u5-sampling-dist (5.1–5.8, 41 modes; re-drills normal calcs) |
| **U6 — Proportions Inference (12–15%)** | ✅ all | apstats-u6-inference-prop actually covers 6.1–6.11 (65 modes; power/β is given-values arithmetic, which matches CED scope) |
| **U7 — Means Inference (10–18%)** | ✅ 7.1–7.9 | apstats-u7-mean-ci (49 modes; `config.skills` badly understates it). 7.10 = skills synthesis → procedure-selection design |
| **U8 — Chi-Square (2–5%)** | ✅ 8.1–8.6 | apstats-u8-unexpected-results (26 modes). 8.7 = skills synthesis → procedure-selection design |
| **U9 — Slopes (2–5%)** | ✅ 9.1–9.5 | regression-slopes + the three 9.3/9.4/9.5 cartridges. 9.6 = skills synthesis → procedure-selection design |
| **7.10 / 8.7 / 9.6 — Selecting the right procedure** | ❌ | **→ apstats-inference-procedure-selection design** (no cartridge drills cross-procedure choice) |

## The four gap cartridges (specs in this directory)

1. `u1-quant-data-SPEC.md` — Describing Quantitative Data (1.5–1.9 + empirical rule). Biggest gap, heaviest-weighted unit.
2. `u2-two-way-tables-SPEC.md` — Two-Way Tables & Association (2.2–2.3, + 1.4 segmented bars).
3. `u2-scatterplots-model-quality-SPEC.md` — Scatterplots & Model Quality (2.4 + r²/s/extrapolation from 2.8).
4. `inference-procedure-selection-SPEC.md` — Choosing the Right Inference Procedure (7.10/8.7/9.6 synthesis).
