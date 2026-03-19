# Create Animations

Generate precise Manim math animations for a cartridge using the scene-spec pipeline.

**Spec**: `docs/ANIMATION-PRECISION-SPEC.md`
**Reference**: `.claude/skills/math-to-manim/SKILL.md`

## Usage

```
/create-animations <cartridge-id>
```

## Pipeline Overview

```
Phase 1: Analysis + Fan-Out Table     (Explore agent)
Phase 2: Scene Spec Generation         (Main agent, per mode)
Phase 3: Verbose Prompt + Code Gen     (Parallel agent swarm)
Phase 4: Smoke Render                  (Parallel background Bash)
Phase 5: Full Render + Integration     (Parallel background Bash)
Phase 6: Validation + Upload           (Sequential)
```

---

## Instructions for Claude

### Phase 1: Analysis + Fan-Out Table

Spawn a single **Explore agent** to analyze the cartridge and produce the fan-out table.

```
Agent tool:
  subagent_type: Explore
  prompt: |
    Analyze the cartridge at cartridges/{cartridge-id}/ for animation.

    Read:
    - cartridges/{cartridge-id}/manifest.json (all modes, hints, progression)
    - cartridges/{cartridge-id}/generator.js (problem banks, variable names, LaTeX)
    - cartridges/{cartridge-id}/grading-rules.js (common mistakes from feedback)

    For each mode that would benefit from an animation, produce:

    1. **Prerequisite tree** (max depth 3, max 8 nodes):
       - Target concept for this mode
       - Prerequisites (recursively: "what must students know BEFORE this?")
       - Mark each as: scene (gets its own animation segment), caption (brief
         text label within parent scene), or skip (too basic)
       - Stop at foundation level for the subject (see manifest.meta.subject)

    2. **Fan-out table row**:
       - concept_name: string
       - mode_id: exactly ONE mode ID (no sharing — each mode gets its own MP4)
       - class_name: PascalCase (unique, will be the MP4 filename)
       - asset_filename: {ClassName}.mp4
       - key_latex: list of exact LaTeX strings from generator.js to use
       - animation_type: "graph-trace" | "step-by-step" | "area-model" |
         "pattern-building" | "error-analysis" | "translation"
       - prerequisite_order: list of concept names from foundation to target

    CRITICAL: Every mode_id must map to exactly one unique asset_filename.
    No two modes may share an animation. This is enforced by the repo verifier.

    Return the fan-out table as structured JSON.
```

Wait for the Explore agent to return before proceeding.

---

### Phase 2: Scene Spec Generation

For each row in the fan-out table, the **main agent** generates a scene spec JSON
following the schema in `docs/ANIMATION-PRECISION-SPEC.md`. This is the canonical
source of truth for the animation.

Key rules when building the scene spec:

- **Coordinate space**: Every element must declare `"coordinate_space": "screen"`
  or `"coordinate_space": "axes"`. Axes-space elements use `parent_axes` and the
  code generator must use `axes.c2p()` / `axes.plot()`.
- **Construction vocabulary**: Only use classes, animations, and methods from the
  Allowed Construction Vocabulary in the spec.
- **Color palette**: Use the standard palette from the spec (BLUE=x, YELLOW=y,
  GREEN=k/correct, RED=error, GOLD=highlight, WHITE=axes, GREY=ghost).
- **LaTeX**: Use exact strings from the generator's problem banks. Raw strings only.
  No `\phantom`. Split MathTex args for color-coding.
- **Timing**: Follow the timing guidelines. Total 30-50s per animation.
- **One asset per mode**: `mode_id` is singular, not a list.

The scene spec JSON does not need to be saved to disk. Pass it to the code
generator agents in Phase 3.

---

### Phase 3: Verbose Prompt + Code Generation (Parallel Agents)

For each scene spec, derive a verbose prompt (human-readable version of the spec)
and spawn a code-generator agent. **All agents in one message for parallelism.**

```
# In ONE message, spawn all code-gen agents in parallel:

Agent tool #1:
  description: "Create {concept1} animation"
  prompt: |
    Generate a ManimCE animation from this scene spec.

    ## Scene Spec (canonical — do not deviate)
    {scene_spec_json_1}

    ## Code Generator Contract
    1. MUST use every element with the specified manim_class, params, position, color.
    2. MUST implement animations in order with specified run_time and rate_func.
    3. MUST implement transition_out exactly (persist vs fade_out).
    4. MUST NOT add elements, animations, or styling not in the spec.
    5. For axes-space elements: use axes.c2p() for positions, axes.plot() for curves.
    6. For screen-space elements: use position arrays or position_method.
    7. All LaTeX in raw strings. No \phantom.

    ## Output
    Write to: animations/{subject}/{filename}.py
    Class name: {ClassName}
    Include docstring with: manim -qm --format=mp4 {filename}.py {ClassName}

    ## Style
    Write extremely easy to consume code. Optimize for readability.
    Make the code skimmable. Avoid cleverness. Use early returns.

Agent tool #2:
  description: "Create {concept2} animation"
  prompt: [same structure with scene_spec_json_2]

# ... one agent per mode
```

**IMPORTANT:** All Agent tool calls must be in the **same message** to run in parallel.

---

### Phase 4: Smoke Render

After all scripts are created, **smoke-render at low quality** to catch errors fast:

```
# In ONE message, spawn all smoke renders in background:

Bash tool #1:
  command: |
    export PATH="/c/Users/ColsonR/ffmpeg/bin:$PATH"
    cd animations/{subject}
    python -m manim -ql --format=mp4 {filename1}.py {ClassName1}
  run_in_background: true
  timeout: 120000
  description: "Smoke render {ClassName1}"

# ... one per animation
```

If any smoke render fails, **fix the script and re-render** before proceeding.
Do not skip to full render with broken scripts.

---

### Phase 5: Full Render + Integration

Once all smoke renders pass, do full quality renders in parallel:

```
# In ONE message, all full renders in background:

Bash tool #1:
  command: |
    export PATH="/c/Users/ColsonR/ffmpeg/bin:$PATH"
    cd animations/{subject}
    python -m manim -qm --format=mp4 {filename1}.py {ClassName1}
  run_in_background: true
  timeout: 300000
  description: "Render {ClassName1}"

# ... one per animation
```

Once all renders complete:

1. **Create assets folder:**
```bash
mkdir -p cartridges/{cartridge-id}/assets
```

2. **Copy all rendered videos:**
```bash
cp animations/{subject}/media/videos/{filename}/720p30/{ClassName}.mp4 \
   cartridges/{cartridge-id}/assets/
```

3. **Update manifest.json** — Add `"animation": "assets/{ClassName}.mp4"` to each
   mode. Every mode gets a unique filename. No sharing.

---

### Phase 6: Validation + Upload

Run the validator, then upload:

```bash
# Validate manifest/asset alignment, file sizes, duration, codec
node scripts/validate-animations.mjs --cartridge {cartridge-id}
```

If validation passes, upload to Supabase:

```javascript
// Upload each MP4 to the videos bucket
// Object path: animations/{cartridge-id}/{ClassName}.mp4
// See scripts/upload-animations.mjs for the upload pattern
```

After upload, verify each public URL returns HTTP 200.

**Report completion** with summary table:

| Mode ID | Animation File | Concept | Size | Duration |
|---------|---------------|---------|------|----------|
| l01-... | ConceptA.mp4 | Description | 636 KB | 32s |
| l02-... | ConceptB.mp4 | Description | 1.1 MB | 41s |

---

## Execution Summary

| Phase | Agent Type | Parallelism | Purpose |
|-------|-----------|-------------|---------|
| 1. Analysis | Explore | Single | Fan-out table + prerequisite trees |
| 2. Scene Specs | Main agent | Sequential | Build canonical JSON specs |
| 3. Code Gen | general-purpose | **Parallel swarm** | Translate specs to Python |
| 4. Smoke Render | Bash (background) | **Parallel** | Catch errors fast (-ql) |
| 5. Full Render | Bash (background) | **Parallel** | Generate final MP4s (-qm) |
| 6. Validate | Main agent | Sequential | Check + upload |

---

## Key Constraints

- **One unique MP4 per mode.** No sharing. Enforced by `scripts/verify-cartridges.mjs`.
- **Scene spec is source of truth.** Code must not deviate from the spec.
- **Coordinate space explicit.** Axes-space uses `axes.c2p()`, screen-space uses arrays.
- **No `\phantom`** in MathTex. ManimCE 0.18.x bug. Use `Text("")` instead.
- **ffmpeg must be in PATH**: `export PATH="/c/Users/ColsonR/ffmpeg/bin:$PATH"`
- **File size limit**: Each MP4 <= 2 MB at 720p30.
- **Duration**: 30-50s target, 20-60s hard bounds.

## Color Palette

| Role | Constant | Usage |
|------|----------|-------|
| x-values, horizontal asymptotes | `BLUE` | Inputs, domain |
| y-values, curves | `YELLOW` | Outputs, range |
| Constants, correct | `GREEN` | k, verified |
| Errors, vertical asymptotes | `RED` | Mistakes |
| Highlights, answers | `GOLD` | Key insights |
| Axes, labels | `WHITE` | Structure |
| De-emphasized | `GREY` | Ghost/old |

## Platform Integration

The platform (`platform/app.html`) displays animations when:
1. Mode has `animation` field in manifest
2. Animation panel shows in left pane (alongside scenario)
3. Video autoplays muted, loops, with play/pause controls
4. Students can hide animation if distracting
