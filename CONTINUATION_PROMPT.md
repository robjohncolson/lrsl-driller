# Continuation Prompt — Next Algebra 2 Cartridge

## What to do NOW

**Create the next Algebra 2 cartridge: Unit 4 Lesson 2.**

The most recent A2 cartridge is `a2t4l1-inverse-variation` (inverse variation, reciprocal function translations, asymptotes). The next lesson in the sequence should continue Unit 4 — likely covering rational functions, simplifying rational expressions, or operations with rational expressions (depending on the curriculum).

### Steps

1. **Ask the user** what topic Unit 4 Lesson 2 covers (or which lesson content to use).
2. **Run `/create-cartridge a2t4l2-<topic>`** to generate manifest, generator, grading-rules, and AI prompt.
3. **Run `/create-animations a2t4l2-<topic>`** using the new scene-spec pipeline (docs/ANIMATION-PRECISION-SPEC.md). This is the first fresh-cartridge test of the full 6-phase pipeline.
4. **Validate**: `node scripts/validate-animations.mjs --cartridge a2t4l2-<topic>`
5. **Upload** to Supabase, verify HTTP HEAD 200s.
6. **Add to registry**: `cartridges/registry.json` + `<option>` in `app.html` dropdown.

### What's new since last session

The animation pipeline was overhauled this session. Key files:

| File | What |
|------|------|
| `docs/ANIMATION-PRECISION-SPEC.md` | Typed scene-spec schema, coordinate space model, construction vocabulary, validation rules |
| `.claude/commands/create-animations.md` | Rewritten 6-phase pipeline (was 4-phase) |
| `.claude/skills/math-to-manim/` | Vendored Reverse Knowledge Tree skill (from Math-To-Manim @ `0e5be3d`) |
| `scripts/validate-animations.mjs` | Phase 6 validator (manifest cross-check, uniqueness, size, duration, codec) |

The pipeline now produces scene specs (JSON) as the canonical source of truth before code generation, enforces coordinate-space-aware positioning (axes.c2p vs screen coords), and validates before upload.

## Session Commits (2026-03-18)

```
ea8e6c9 fix: default Supabase video source to ON for new browsers
6248128 refactor: rewrite A2 T4L1 animations through scene-spec pipeline
41c2ef1 fix: resolve ffprobe from local ffmpeg install in validator
a648441 pipeline: implement animation precision spec
407fead docs: add animation precision spec v3
56d72a7 docs: add code style directive to project instructions
78cdb50 Add 6 Manim animations for A2 T4L1 inverse variation cartridge
d22cca4 Wire ai-grader-prompt.txt into manifest aiPromptFile
40c8236 Add Algebra 2 Unit 4 Lesson 1 cartridge: inverse variation
```

## Current State

- **Branch**: `main` @ `ea8e6c9`
- **Cartridges**: 20 (latest: `a2t4l1-inverse-variation`)
- **A2 cartridges**: a2t3l3, a2t3l3-quiz, a2-dividing-polynomials, a2t4l1-inverse-variation
- **Supabase videos**: 6 MP4s live for a2t4l1, all verified
- **Uncommitted**: gitnexus SKILL.md changes (pre-existing, unrelated)

## Key Paths

| Purpose | Path |
|---|---|
| Animation precision spec | `docs/ANIMATION-PRECISION-SPEC.md` |
| Animation pipeline command | `.claude/commands/create-animations.md` |
| Math-To-Manim skill | `.claude/skills/math-to-manim/SKILL.md` |
| Animation validator | `scripts/validate-animations.mjs` |
| Cartridge template | `cartridges/_template/` |
| Cartridge dev guide | `CARTRIDGE-DEVELOPMENT-GUIDE.md` |
| Cartridge registry | `cartridges/registry.json` |

## Environment

- **Platform**: Windows 11, Git Bash (Unix syntax)
- **Node**: v22.19.0 | **Python**: 3.12 | **Manim**: 0.18.1
- **ffmpeg/ffprobe**: `C:\Users\ColsonR\ffmpeg\bin\`
- **Deploy**: Vercel (frontend) + Railway (backend)
- **Supabase bucket**: `videos` → `animations/{cartridge-id}/`

## Commands

```bash
npm install && npm run dev          # http://localhost:5173/platform/app.html
npm test                            # Vitest (~1682+ tests)
node scripts/validate-animations.mjs --cartridge <id>   # Phase 6 validator
export PATH="/c/Users/ColsonR/ffmpeg/bin:$PATH"          # ffmpeg for manim
```
