# AGENTS.md

## Project
lrsl-driller (dev) — subject-agnostic drill/quiz platform (console + cartridge architecture).

## Routing Context
This repo is orchestrated by Claude Code (CC) via the Agent repo at
`C:\Users\rober\Downloads\Projects\Agent`.

## File Ownership
When a prompt specifies owned files, modify only those files.
If changes are needed outside your scope, note them in your completion report.

## Commit Convention
Do not commit. CC handles review and all commits.

## Cross-Agent Delegation
If you hit a design question, need a code review, or need web-based research,
invoke CC as a subagent:

```bash
python "C:/Users/rober/Downloads/Projects/Agent/runner/cross-agent.py" \
  --direction codex-to-cc \
  --task-type design-question \
  --prompt "Your question" \
  --working-dir "C:/Users/rober/Downloads/Projects/not-school/lrsl-driller" \
  --timeout 60
```

Task types: `design-question`, `review`, `investigate`, `validate`

## Testing
```bash
npm test                          # All tests (vitest)
npx vitest run tests/core/...     # Engine tests
npx vitest run tests/grading/...  # Cartridge grading
```
