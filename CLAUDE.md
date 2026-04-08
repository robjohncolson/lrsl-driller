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
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **lrsl-driller** (6410 symbols, 15319 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/lrsl-driller/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/lrsl-driller/context` | Codebase overview, check index freshness |
| `gitnexus://repo/lrsl-driller/clusters` | All functional areas |
| `gitnexus://repo/lrsl-driller/processes` | All execution flows |
| `gitnexus://repo/lrsl-driller/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Code Style

Write extremely easy to consume code. Optimize for how easy the code is to read. Make the code skimmable. Avoid cleverness. Use early returns.
