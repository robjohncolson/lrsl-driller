# Create Cartridge

Generate a new drill cartridge for the Driller Platform based on lesson content and curriculum standards.

## Usage

```
/create-cartridge <cartridge-id> [options]
```

**Arguments:**
- `cartridge-id`: Unique ID for the cartridge (e.g., `apstats-u4-probability`, `algebra2-radicals`)

**Options:**
- Provide lesson content (PowerPoint transcripts, slides, curriculum framework) in the conversation
- Specify curriculum standards to align with (AP Course Framework skills, state standards)

## What This Skill Does

1. **Analyzes** the provided lesson content to identify key concepts, vocabulary, and learning objectives
2. **Designs** a scaffolded progression of 8-24 levels from simple to complex
3. **Creates** all required cartridge files:
   - `manifest.json` - Configuration, modes, inputs, hints, progression
   - `generator.js` - Problem generation with randomized values and scenario banks
   - `grading-rules.js` - Keyword/programmatic grading for each field
   - `ai-grader-prompt.txt` - AI grading template for open-response fields
   - `contexts.json` (optional) - Real-world scenarios if applicable
4. **Registers** the cartridge in `cartridges/registry.json`
5. **Adds tests** in `tests/generators/` and `tests/grading/`

## Instructions for Claude

When this skill is invoked:

### Step 1: Gather Requirements
- Read any lesson content provided by the user (transcripts, slides, PDFs)
- Identify the subject area (AP Statistics, Algebra 2, Computer Science, etc.)
- List the curriculum standards/skills to address
- Understand the target difficulty progression

### Step 2: Review Platform Architecture
Read these files for reference:
- `cartridges/CARTRIDGE-GENERATION-PROMPT.md` - Full generation instructions
- `cartridges/_template/` - Blank slate template with required structure
- `cartridges/registry.json` - Existing cartridge registry
- Similar existing cartridges for patterns (e.g., `cartridges/apstatu4l1l2/` for AP Stats)

### Step 3: Design the Cartridge Structure

**Level Design Principles:**
1. Start with vocabulary/definitions (L01-L03)
2. Progress to identification/recognition (L04-L06)
3. Move to calculation/application (L07-L12)
4. Build to synthesis/explanation (L13-L18)
5. End with capstone/mixed practice (final levels)

**Aim for:**
- 3-5 gold stars per level unlock requirement (use 1 for closely related concepts)
- 8-15 unique scenarios per level in shuffle bags
- Mix of input types: choice, dropdown, number, text, textarea
- Educational feedback that teaches, not just grades

### Step 4: Create Files

Create the cartridge directory and files:

```
cartridges/{cartridge-id}/
├── manifest.json      # Configuration, modes, inputs, hints
├── generator.js       # Problem generation with shuffle bags
├── grading-rules.js   # Keyword grading for all fields
└── ai-grader-prompt.txt  # AI grading for open-response
```

**Key Requirements:**
- Mode IDs follow format: `l01-descriptive-name`, `l02-another-topic`
- All `{{placeholders}}` in manifest must exist in generator's context
- Every input field needs: hint in manifest, grading handler, AI criteria (if open-response)
- Use shuffle bags for scenario variety (batch of 12, history of 4)
- Include tolerance for numeric answers (typically ±0.01 or ±0.5)

### Step 5: Register and Add Options

1. Add entry to `cartridges/registry.json`:
```json
{
  "id": "cartridge-id",
  "name": "Display Name",
  "description": "Brief description",
  "subject": "Subject Area",
  "skills": ["SKILL-1", "SKILL-2"]
}
```

2. Add alias to `platform/app.html` cartridgeAliases object if needed

### Step 6: Create Tests

Create test files:
- `tests/generators/{cartridge-id}.test.js` - Generator tests for each level
- `tests/grading/{cartridge-id}.test.js` - Grading tests for each field type

Test coverage should include:
- Each level generates valid problems
- Shuffle bags provide variety
- Correct answers grade as 'E'
- Wrong answers grade as 'I'
- Close answers get partial credit 'P'
- Blank handling works properly

### Step 7: Verify and Document

1. Run all tests: `npm test`
2. Test locally: `npm run dev` and load the cartridge
3. Update `CLAUDE.md` version history if significant

## E/P/I Scoring Reference

- **E (Essentially Correct)**: All key elements present - earns a star
- **P (Partially Correct)**: Some elements missing - no star, encourages retry
- **I (Incorrect)**: Major errors - no star, provides teaching feedback

**Star tiers** (based on hints used + retries):
- **Gold** (0 penalties): 4 points
- **Silver** (1 penalty): 3 points
- **Bronze** (2 penalties): 2 points
- **Tin** (3+ penalties): 1 point

## Example Invocation

User: "Create a cartridge for AP Stats Unit 5 covering Normal distributions. Here are the lesson slides and framework..."

Claude will:
1. Analyze the content for key concepts (z-scores, percentiles, empirical rule, etc.)
2. Design 12-16 levels with progressive difficulty
3. Create all required files with 10+ scenarios per level
4. Add tests covering all grading rules
5. Register the cartridge and run tests
