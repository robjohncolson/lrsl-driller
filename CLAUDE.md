# CLAUDE.md

Subject-agnostic drill/quiz platform for teachers. Console = platform, cartridges = lessons.

**Version**: v4.8.0 | **Cartridges**: 12 (AP Stats, Algebra 2, CS)
**Deploy**: Vercel (frontend) + Railway (backend)
**Entry Points**: `platform/app.html` (primary, requires dev server) | `index.html` (legacy, file://)

## Commands
```bash
npm install && npm run dev    # http://localhost:5173/platform/app.html
npm run build                 # Production build
npm test                      # All tests (vitest)
```

**Railway server**: `cd railway-server && npm install && node server.js`
Requires: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`

## Architecture

### Console-Cartridge Pattern

**Platform** (`platform/`): Topic-agnostic orchestrator
- `app.html` - Main app (~3600 lines), key: `onGradingComplete` ~line 3095, `loadCartridge()` ~line 3078
- `core/` - Engines: game, grading, graph, input-renderer, ghost-*, ai-feedback-panel

**Cartridges** (`cartridges/{id}/`): Self-contained lessons
- `manifest.json` - Config: modes, inputs, hints, progression, animation refs
- `generator.js` - `generateProblem(modeId, context, mode)`
- `grading-rules.js` - `gradeField(fieldId, answer, context)` → `{score, feedback}`
- `ai-grader-prompt.txt` - Template with `{{placeholders}}`
- `assets/` (optional) - Animation videos (MP4)

**Shared** (`shared/`): `scoring.config.js`

**Registry**: `cartridges/registry.json`

### Grading Flow
```
Answer → Keywords (regex, fast) → Score A
      → AI (Groq/Gemini)        → Score B
      → Final = max(A, B)       → AI upgrades only, never downgrades
      → If AI fails → Teacher Review Queue
```

## E/P/I Scoring

- **E** (Essentially Correct): All key elements | **P** (Partial): Some missing | **I** (Incorrect): Major errors

**Stars** (based on penalties = hints + retries):
- Gold (0): 4pts | Silver (1): 3pts | Bronze (2): 2pts | Tin (3+): 1pt

## Creating Cartridges

See `CARTRIDGE-DEVELOPMENT-GUIDE.md` and `CARTRIDGE-GENERATION-PROMPT.md`.
Template: `cartridges/_template/`

After creating: Add to `registry.json` + add `<option>` to `app.html` dropdown.

## Key Patterns

- **Dual grading**: Keywords first (fast), then AI. Best score wins.
- **Shuffle bags**: Fair distribution, no near-repeats (batch 12, history 4)
- **State persistence**: localStorage with `{cartridgeId}_` prefix, server sync via `/api/progress/cartridge-sync`
- **Template interpolation**: `{{variableName}}` in manifests/prompts

## Major Features

**Ghost System** (`platform/core/ghost-*.js`): TensorFlow.js neural networks learn student behavior. 3D maze visualization (Three.js), ghost battles with Elo ratings.

**Ghost Orbits** (`platform/game/ghost-orbits-*.js`): Full-screen arcade arena where players battle their Shadow Self AI. Dot Territory mechanics (claim neutral dots, flip enemy dots with spacebar timing, avoid damage). 3-life system, Records (safe zones), escalating star entry costs. Shadow learns from player patterns and levels up on player wins.

**Animation System** (`animations/`): Manim-generated math animations displayed alongside problems. Per-mode video references in manifest, auto-play with controls.

## Skills (Claude Commands)

- `/create-cartridge <id>` - Generate a new drill cartridge from lesson content
- `/create-animations <id>` - Generate Manim animations for a cartridge's concepts

## Creating Animations

1. Analyze cartridge concepts (`manifest.json`, `generator.js`)
2. Create Manim scripts in `animations/` for challenging topics
3. Render: `manim -qm --format=mp4 {file}.py {Scene}`
4. Copy to `cartridges/{id}/assets/`
5. Add `"animation": "assets/{name}.mp4"` to mode in manifest

See `.claude/commands/create-animations.md` for full instructions.

## Testing
```bash
npm test                      # All (~1682 tests)
npx vitest run tests/core/... # Engine tests
npx vitest run tests/grading/... # Cartridge grading
npx vitest run tests/server/... # API tests
```

## Driller Rules

### Console-Cartridge Separation
Platform code (`platform/core/`) must NEVER import from `cartridges/`.
Cartridges expose only: `manifest.json`, `generator.js`, `grading-rules.js`, `ai-grader-prompt.txt`.

### Deep-Link Testing (Two Paths)
Deep-link URLs must be tested against BOTH:
1. Direct navigation (user pastes URL) -> `loadCartridge()` path
2. URL restoration after page refresh -> `history.replaceState` path
The 5-7->5-2 regression happened because only path 1 was fixed.

### Progression Gating
Check `manifest.json` `unlockedBy` chains before modifying mode ordering.
Modes gate on gold star counts; verify the chain is still valid after changes.

### Answer Flow Dependency Chain
User submits -> `gradeField()` [keywords] -> AI grading [Groq] -> `recordResult()`
-> `awardStar()` -> `checkUnlocks()` -> `generateProblem()` [next]
Each step DEPENDS on the previous. Do not reorder.

### Tests
1682+ tests - run `npm test` before committing.

## Key Docs

- `docs/STATE_MACHINES.md` - All component state transitions (142 sections, v4.8.0)
- `CARTRIDGE-DEVELOPMENT-GUIDE.md` - Manual cartridge creation
- `ghost-system-spec.md` - Ghost AI design
- Ghost Orbits: STATE_MACHINES.md sections 135-142

<!-- gitnexus:start -->
# GitNexus MCP

This project is indexed by GitNexus as **lrsl-driller** (3732 symbols, 10194 relationships, 290 execution flows).

## Always Start Here

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
