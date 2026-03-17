# Continuation Prompt — Post-Rollback, Content Pipeline

## What to do NOW

**Continue the AP Stats content pipeline.** U8 (Chi-Square / Unexpected Results) has 9 modes (L01–L09, through "check conditions"). The next lessons to build are L04+ content (L01–L03 have committed content+animations).

To add the next lesson:

1. Check which modes in `cartridges/apstats-u8-unexpected-results/manifest.json` still need `generator.js` and `grading-rules.js` entries
2. Follow the `/create-cartridge` or `/lessonprep` workflow to generate content
3. Create Manim animations for the lesson's concepts (`/create-animations`)
4. Commit with `pipeline: add U8 L{N} content` convention

### U8 Mode IDs (from manifest)

| # | Mode ID | Topic |
|---|---------|-------|
| 1 | l01-topic-8-1-observed-vs-expected | Observed vs Expected |
| 2 | l02-expected-counts | Expected Counts |
| 3 | l03-chi-square-contribution | Chi-Square Contribution |
| 4 | l04-interpret-unexpectedness | Interpret Unexpectedness |
| 5 | l05-simulation-based-p-value | Simulation-Based P-Value |
| 6 | l06-chi-square-gof-procedure | Chi-Square GOF Procedure |
| 7 | l07-state-null-hypothesis | State Null Hypothesis |
| 8 | l08-state-alternative-hypothesis | State Alternative Hypothesis |
| 9 | l09-check-conditions | Check Conditions |

**Content committed so far:** L01, L02, L03 (commits `f1fd954`, `ffcf3e8`, `8ace063`)

## Session Context (2026-03-17)

### What happened today
- Rolled back `main` to pre-WebGL-removal state (`ab638f6`)
- Cherry-picked 17 content commits (U6–U8 L1–L3) back onto clean main
- Archived TS/refactor work on `archive/post-webgl-work` branch (remote)
- Verified rollback: app works, Ghost/TF.js/Three.js restored, tests pass
- **Decision: TypeScript/extraction work is shelved indefinitely** — caused too much breakage, not worth incremental approach

### Git state
- **Branch:** `main` @ `5fdf880`
- **Rollback spec:** `specs/rollback-platform-preserve-content.md`
- **Archive branch:** `archive/post-webgl-work` (pushed, preserves all Phase 2+3 work)
- **Stash:** `stash@{0}` = pre-rollback continuation prompt (can be dropped)

## Key Paths

| Purpose | Path |
|---|---|
| Main app | `platform/app.html` |
| U8 cartridge | `cartridges/apstats-u8-unexpected-results/` |
| U8 manifest | `cartridges/apstats-u8-unexpected-results/manifest.json` |
| Cartridge registry | `cartridges/registry.json` |
| Cartridge dev guide | `CARTRIDGE-DEVELOPMENT-GUIDE.md` |
| Cartridge gen prompt | `cartridges/CARTRIDGE-GENERATION-PROMPT.md` |
| Animation scripts | `animations/` |
| Rollback spec | `specs/rollback-platform-preserve-content.md` |

## Commands

```bash
npm install && npm run dev    # http://localhost:5173/platform/app.html
npm test                      # Vitest (~1682+ tests)
npm run build                 # Vite production build
```

## Environment

- **Platform**: Windows 11, Git Bash (Unix syntax)
- **Node**: v22.19.0 | **Python**: 3.12
- **Deploy**: Vercel (frontend) + Railway (backend)
- **LaTeX**: MiKTeX (for Manim animations)
