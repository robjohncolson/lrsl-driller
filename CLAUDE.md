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

**Ghost Orbits** (`platform/game/ghost-orbits-*.js`): Arcade-style battle game where players compete against ghosts in an arena. 12 orbits, lives system, neural network opponents.

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

## Key Docs

- `docs/STATE_MACHINES.md` - All component state transitions
- `CARTRIDGE-DEVELOPMENT-GUIDE.md` - Manual cartridge creation
- `ghost-system-spec.md` - Ghost AI design