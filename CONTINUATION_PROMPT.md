# Continuation Prompt — lrsl-driller

## What just happened

Built the complete **a2t3l5** cartridge (Algebra 2, Topic 3, Lesson 5 — Zeros of Polynomial Functions). This was a multi-agent workflow: two web LLMs produced lesson specs, CC merged them into a design doc, Codex implemented the cartridge, CC rendered and uploaded animations.

### Session Commits (2026-04-07)

```
1b4fd30 fix: recalibrate 4 a2t3l5 animations to match level content
86404b7 feat: create a2t3l5 cartridge — Zeros of Polynomial Functions (14 levels + animations)
```

## Current State

- **Branch:** main @ `1b4fd30`
- **Cartridges:** 23 total (12 AP Stats, 8 Algebra 2, 3 CS)
- **Tests:** 2213 passing, 1 pre-existing failure in `tests/grading/a2t3l3.test.js` (expects P but gets E — the grading got better, test expectation is stale)
- **Dirty files:** `AGENTS.md` (modified), `CLAUDE.md` (modified), `tests/grading/a2t3l3.test.js` (untracked) — all pre-existing, not from this session
- **Deploy:** Vercel (frontend, auto-deploy) + Railway (backend)

## a2t3l5 Cartridge Details

**Topic:** Zeros of Polynomial Functions — 14 scaffolded levels

| # | Level | Input | Skill |
|---|-------|-------|-------|
| 01 | Vocab basics | choice | Definitions: zero, multiplicity, end behavior, ZPP, interval notation |
| 02 | Factor → zero | choice | Solve (x-5)=0, (2x-4)=0 for the zero value |
| 03 | Multiplicity ID | choice | Read exponent on a factor to state multiplicity |
| 04 | Cross or touch | choice | Odd/even multiplicity rule for graph behavior |
| 05 | Factor find zeros | text | Factor polynomial completely, list all real zeros |
| 06 | Multiplicity report | text | Report (zero, mult, cross/touch) for each zero |
| 07 | Sign chart | text | Determine positive/negative intervals, answer in interval notation |
| 08 | Complex vs real | choice | Discriminant check — real or complex zeros |
| 09 | Complex squaring | text | Expand (a+bi)² with i²=-1 |
| 10 | Equation rewrite | text | Solve P(x)=Q(x) by rewriting to P(x)-Q(x)=0 |
| 11 | Inequality | text | Solve polynomial inequalities in interval notation |
| 12 | Transformations | dropdown | Identify cubic transformations vs parent x³ |
| 13 | Sketch justification | textarea | Full reasoning: zeros → multiplicity → sign chart → sketch |
| 14 | Error capstone | textarea | Identify and correct student errors |

- All levels unlock at **gold: 1** (except L01 = default)
- 14 Manim animations rendered and uploaded to Supabase (`videos/animations/a2t3l5/`)
- Design spec: `cartridges/a2t3l5/SPEC.md`
- Codex prompt: `cartridges/a2t3l5/CODEX-PROMPT.md`

## Pending Work

### Immediate
- **Fix `tests/grading/a2t3l3.test.js`** — line 278 expects `P` but grading returns `E`. The test expectation is stale; update to expect `E`.
- **Commit dirty AGENTS.md and CLAUDE.md** — pre-existing modifications, need review before committing.

### Backlog (from prior sessions)
- **Strip game systems** — spec at `specs/strip-game-systems.md`. Remove Ghost System, Ghost Orbits, Grid Wars (~62 files, ~200-400 tests). See prior CONTINUATION_PROMPT for full plan.
- **Continue Unit 8 AP Stats ingest** (8.2-8.6) — clean up duplicate Schoology links in 8.1
- **R content pipeline** for AP Stats cartridge generation
- **Repo unification** — merge lrsl-driller + curriculum_render + apstats-live-worksheets

## Key Paths

| Purpose | Path |
|---------|------|
| New cartridge | `cartridges/a2t3l5/` |
| Design spec | `cartridges/a2t3l5/SPEC.md` |
| Animations source | `animations/a2t3l5/` (14 scenes + common.py) |
| Supabase assets | `videos/animations/a2t3l5/*.mp4` |
| Registry | `cartridges/registry.json` |
| Strip game spec | `specs/strip-game-systems.md` |
| Main app | `platform/app.html` (~3600 lines) |
| Server | `railway-server/server.js` |

## Environment

- **Platform**: Windows 11, Git Bash (Unix syntax)
- **Node**: v22.17.1 | **Python**: 3.12 | **Manim**: 0.19.2
- **Deploy**: Vercel (auto-deploy on push to main) + Railway
- **Entry point**: `platform/app.html`
- **Dev server**: `npm run dev` → http://localhost:5173/platform/app.html
- **Direct URL**: https://lrsl-driller.vercel.app/platform/app.html?cartridge=a2t3l5
