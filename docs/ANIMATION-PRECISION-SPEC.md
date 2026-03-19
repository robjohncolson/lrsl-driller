# Animation Precision Spec

v2 — Addresses review findings on unit-of-output, schema rigor, source-of-truth,
stop rules, and validation.

## Problem

Current animation pipeline goes **concept -> code** in one step. The agent swarm
receives a short prompt like "Create a Manim animation about horizontal asymptotes"
and writes code directly. This produces animations that work but lack visual precision:

- Imprecise element positioning (objects placed by feel, not by spec)
- Inconsistent color usage across scenes within the same animation
- Missing or vague LaTeX (e.g., `MathTex(r"equation")` instead of exact notation)
- No timing specification (agents guess at `self.wait()` durations)
- No camera/layout plan (elements end up wherever the agent puts them)
- No prerequisite ordering — concepts appear in whatever order the agent thinks of

The root cause: **there is no intermediate representation between "what to teach"
and "working Python code."**

## Solution: Scene Spec as Canonical Contract

Insert a **typed scene spec** (JSON) between concept analysis and code generation.
The scene spec is the single source of truth. Everything downstream — the verbose
prompt, the Python code, the rendered MP4 — is derived from it.

Instead of:

```
Concept -> [Agent writes code] -> Animation
```

The pipeline becomes:

```
Cartridge Analysis -> Concept-to-Mode Mapping -> Scene Specs (JSON, canonical)
  -> Verbose Prompt (derived) -> Code (derived) -> Validate -> Render -> Upload
```

## Unit of Output

The pipeline produces **exactly one unique MP4 asset per manifest mode**. No two
modes may point to the same asset filename. This is enforced by the repo verifier
(`scripts/verify-cartridges.mjs:checkAnimationUniqueness`), which errors on reuse.

### Fan-Out Rules

1. The Explore agent proposes `concept -> [mode_id, ...]` mappings.
2. If a concept maps to multiple modes, the pipeline produces **one scene spec
   per mode**. Each spec must produce a distinct MP4 with a unique `class_name`
   and `asset_filename`. Specs may share prerequisite scenes but must differ in
   at least the target scene (title, worked example, or problem type) to match
   the mode's content.
3. If a concept genuinely applies to N modes unchanged, the pipeline still
   produces N scene specs and N MP4s. The specs can be clones with only the
   `class_name`, `asset_filename`, and `mode_ids` fields changed. This is
   intentional duplication to satisfy the verifier and keep each mode's
   animation independently replaceable.
4. Modes that do not benefit from animation receive no `"animation"` field.
   The pipeline skips them.
5. Every mode in the manifest that receives an `"animation"` field must have a
   corresponding MP4 in `cartridges/{id}/assets/` and in the Supabase bucket.
   The validation phase (Phase 6) enforces this.

### Fan-Out Table (produced by Phase 1)

Each row must have a unique asset filename. No "Shared?" column — sharing is
not allowed.

```
| Concept              | Mode ID                  | Asset Filename                | Class Name                |
|----------------------|--------------------------|-------------------------------|---------------------------|
| Inverse table (xy=k) | l01-missing-table        | InverseTableScene.mp4         | InverseTableScene         |
| Equation from table  | l02-equation-from-table  | EquationFromTableScene.mp4    | EquationFromTableScene    |
| Application model    | l03-application-model    | InverseApplicationScene.mp4   | InverseApplicationScene   |
| Asymptote rules      | l04-horizontal-asymptote | HorizontalAsymptoteScene.mp4  | HorizontalAsymptoteScene  |
| Translate y=1/x      | l05-translate-parent     | TranslateParentScene.mp4      | TranslateParentScene      |
| Translate xy=k       | l06-translate-xy         | TranslateXYScene.mp4          | TranslateXYScene          |
```

## The Enhanced Pipeline

### Phase 0: Prerequisite Discovery (NEW)

Build a knowledge tree for each concept. Hard limits prevent unbounded recursion.

**Input**: Concept name + cartridge context (manifest mode, generator bank, grading rules).

**Stop rules**:
- `max_depth`: 3 (no more than 3 levels below target)
- `max_nodes`: 8 (total nodes in tree, including target)
- `max_prerequisites_per_node`: 4
- **Foundation test**: A concept is foundational if the cartridge's target audience
  (identified from `manifest.meta.subject` and grade level) would know it without
  explanation. For Algebra 2: basic arithmetic, function notation, graphing points,
  slope. For AP Stats: mean/median, bar charts, basic probability.
- **Caption rule**: If a prerequisite is foundational but still helpful context,
  it becomes a **caption** (a text label shown briefly) rather than a full scene.
  Captions do not get their own scene spec — they appear as a `Text()` element
  within the parent scene.

**Output**: A knowledge DAG with depth, foundation flags, and caption flags.

```
Example for "Horizontal Asymptote of y = a/(x-h) + k":

horizontal asymptote (depth 0, target)
├── parent function y = 1/x (depth 1, scene)
│   └── "as x grows, 1/x shrinks" (depth 2, caption — too basic for own scene)
├── vertical shift: +k moves the curve (depth 1, scene)
└── the fraction a/(x-h) -> 0 as x -> ±∞ (depth 1, scene)
```

### Phase 1: Analysis + Concept-to-Mode Mapping (EXISTING, enhanced)

Same Explore agent as today, but now also produces:

- The knowledge tree for each concept (from Phase 0)
- The topological sort order (foundation -> target)
- The **fan-out table** mapping concepts to mode IDs and asset filenames
- Explicit LaTeX for every equation the animation must show, pulled from
  the cartridge's `generator.js` bank items (use the same variable names)

### Phase 2: Scene Spec Generation (NEW — canonical source of truth)

For each asset in the fan-out table, produce a typed JSON scene spec.
This is the **single source of truth** for the animation. The verbose prompt
and the Python code are both derived from it.

#### Scene Spec Schema

```jsonc
{
  // ── Identity ──────────────────────────────────────────────────────
  "asset_filename": "HorizontalAsymptoteScene.mp4",
  "class_name": "HorizontalAsymptoteScene",
  "mode_id": "l04-horizontal-asymptote",
  "cartridge_id": "a2t4l1-inverse-variation",

  // ── Global ────────────────────────────────────────────────────────
  "manim_version": "0.18.1",
  "scene_base_class": "Scene",          // or "ThreeDScene"
  "total_duration_seconds": 40,         // sum of all scene durations
  "color_palette": {
    "x": "BLUE",
    "y": "YELLOW",
    "k": "GREEN",
    "correct": "GREEN",
    "error": "RED",
    "highlight": "GOLD",
    "axes": "WHITE",
    "ghost": "GREY"
  },

  // ── Scenes (ordered array) ────────────────────────────────────────
  "scenes": [
    {
      "scene_number": 1,
      "concept": "parent function y = 1/x",
      "is_caption": false,
      "timestamp_start": 0,
      "timestamp_end": 15,

      // ── Elements: typed, positioned, coordinate-space-aware ───────
      //
      // coordinate_space: "screen" | "axes"
      //   "screen" — position is absolute Manim screen coords [x, y, z]
      //              or uses position_method (to_edge, to_corner, next_to, move_to)
      //   "axes"   — position is in the axes' data coordinate system,
      //              code generator must use axes.c2p() for points and
      //              axes.plot() for curves. The "parent_axes" field says
      //              which element ID provides the coordinate system.
      //
      "elements": [
        {
          "id": "axes",
          "manim_class": "Axes",
          "coordinate_space": "screen",
          "params": {
            "x_range": [-5, 15, 1],
            "y_range": [-3, 8, 1],
            "x_length": 8,
            "y_length": 5,
            "axis_config": {"include_numbers": true},
            "tips": true
          },
          "position": [0, -0.4, 0],
          "color": "WHITE",
          "z_index": 0,
          "builders": [
            {
              "method": "get_axis_labels",
              "params": {"x_label": "x", "y_label": "y"},
              "assign_to": "axes_labels"
            }
          ]
        },
        {
          "id": "curve",
          "coordinate_space": "axes",
          "parent_axes": "axes",
          "build_method": "plot",
          "params": {
            "function": "lambda x: 1/x",
            "x_range": [0.15, 14, 0.05],
            "use_smoothing": true
          },
          "color": "YELLOW",
          "z_index": 1
        },
        {
          "id": "h_asymptote",
          "manim_class": "DashedLine",
          "coordinate_space": "axes",
          "parent_axes": "axes",
          "params": {
            "start_data": [-5, 0],
            "end_data": [15, 0],
            "dash_length": 0.12,
            "stroke_width": 3
          },
          "color": "BLUE",
          "z_index": 0
        },
        {
          "id": "tracer_dot",
          "manim_class": "Dot",
          "coordinate_space": "axes",
          "parent_axes": "axes",
          "params": {"radius": 0.08},
          "color": "YELLOW",
          "z_index": 2,
          "updater": {
            "strategy": "always_redraw",
            "tracker_id": "x_tracker",
            "data_position": "lambda t: (t, 1/t)"
          }
        },
        {
          "id": "y_label",
          "manim_class": "MathTex",
          "coordinate_space": "screen",
          "params": {"tex_string": "r'y = {:.3f}'"},
          "color": "WHITE",
          "z_index": 2,
          "updater": {
            "strategy": "always_redraw",
            "anchor": {"relative_to": "tracer_dot", "direction": "UR", "buff": 0.15}
          }
        },
        {
          "id": "eq_label",
          "manim_class": "MathTex",
          "coordinate_space": "screen",
          "params": {"tex_string": "r'y = \\frac{1}{x}'"},
          "position_method": "to_corner",
          "position_args": ["UR"],
          "color": "GREEN",
          "z_index": 1
        }
      ],

      // ── Animations: ordered, typed, timed ─────────────────────────
      "animations": [
        {
          "step": 1,
          "targets": ["axes"],
          "animation": "Create",
          "params": {},
          "run_time": 1.0,
          "rate_func": "smooth"
        },
        {
          "step": 2,
          "targets": ["eq_label"],
          "animation": "Write",
          "params": {},
          "run_time": 1.0,
          "rate_func": "smooth"
        },
        {
          "step": 3,
          "targets": ["curve", "h_asymptote"],
          "animation": "Create",
          "params": {},
          "run_time": 1.5,
          "rate_func": "smooth"
        },
        {
          "step": 4,
          "targets": ["tracer_dot", "y_label"],
          "animation": "FadeIn",
          "params": {},
          "run_time": 0.5,
          "rate_func": "smooth"
        },
        {
          "step": 5,
          "targets": ["x_tracker"],
          "animation": "ValueTracker.animate.set_value",
          "params": {"value": 18},
          "run_time": 2.5,
          "rate_func": "smooth"
        },
        {
          "step": 6,
          "targets": null,
          "animation": "wait",
          "params": {},
          "run_time": 1.0,
          "rate_func": null
        }
      ],

      // ── Transition ────────────────────────────────────────────────
      "transition_out": {
        "persist": ["h_asymptote"],       // element IDs that survive into next scene
        "fade_out": ["axes", "curve", "tracer_dot", "y_label", "eq_label"],
        "run_time": 0.6
      }
    }
    // ... additional scenes
  ],

  // ── Value Trackers (global) ───────────────────────────────────────
  "value_trackers": [
    {"id": "x_tracker", "initial_value": 1}
  ]
}
```

#### Schema Invariants (enforced by validation)

1. Every `id` in `elements` is unique within the scene spec.
2. Every `targets` entry in `animations` references a valid element `id` or tracker `id`.
3. Every `persist` entry in `transition_out` references a valid element `id`.
4. `timestamp_end - timestamp_start` equals the sum of all `run_time` values in
   the scene's `animations` array (within 1s tolerance for waits).
5. `total_duration_seconds` equals the sum of all scene durations (within 2s tolerance).
6. `color` values must be keys in the global `color_palette` or valid Manim constants.
7. `manim_class` must be in the Allowed Construction Vocabulary (see below).
8. `coordinate_space` must be `"screen"` or `"axes"`.
9. If `coordinate_space` is `"axes"`, the element must have a `parent_axes` field
   referencing a valid Axes element `id`. The code generator must use
   `axes.c2p(x, y)` for point positions and `axes.plot(fn)` for curves.
   Raw screen coordinates must not be used for axes-space elements.
10. If `coordinate_space` is `"screen"`, position is one of:
    - A `[x, y, z]` array (absolute screen coords)
    - A `position_method` + `position_args` pair (e.g., `"to_edge"` + `["UP"]`)
    - `null` if driven by an updater
11. Elements with `build_method` (e.g., `"plot"`) are constructed via the parent
    axes object, not directly instantiated. They have no `manim_class` field.
12. Each `asset_filename` in the spec must be globally unique across the cartridge.

### Allowed Construction Vocabulary

The scene spec's `manim_class`, `animation`, `build_method`, `updater.strategy`,
and `position_method` fields are restricted to the following sets. Code generators
must not use constructs outside these lists.

#### Mobject Classes (`manim_class`)

| Category | Allowed Classes |
|----------|----------------|
| Coordinate systems | `Axes`, `NumberPlane`, `ThreeDAxes`, `NumberLine` |
| Shapes | `Circle`, `Square`, `Rectangle`, `Polygon`, `Line`, `DashedLine`, `Arrow`, `Dot`, `Arc` |
| Text | `Text`, `MathTex`, `Tex` |
| Groups | `VGroup`, `Group` |
| Annotations | `SurroundingRectangle`, `Cross`, `Brace`, `BraceBetweenPoints` |
| Graphs | `FunctionGraph`, `ParametricFunction` |
| Surfaces (3D) | `Surface`, `Sphere` |
| Trackers | `ValueTracker` |

#### Axes Builder Methods (`build_method`)

Used when `coordinate_space` is `"axes"` and the element is constructed via
the parent axes object rather than directly:

| Method | Produces | Usage |
|--------|----------|-------|
| `plot` | Graph of a function | `axes.plot(fn, x_range=[...])` |
| `get_axis_labels` | Axis label mobjects | `axes.get_axis_labels(x_label, y_label)` |
| `get_graph_label` | Label attached to a curve | `axes.get_graph_label(graph, label)` |
| `get_horizontal_line` | Horizontal line to a point | `axes.get_horizontal_line(point)` |
| `get_vertical_line` | Vertical line to a point | `axes.get_vertical_line(point)` |

For points in axes-space (DashedLine endpoints, Dot positions), use `start_data`
/ `end_data` fields with data coordinates. The code generator translates these
via `axes.c2p(x, y)`.

#### Animation Opcodes (`animation`)

| Category | Allowed Animations |
|----------|--------------------|
| Creation | `Create`, `Write`, `FadeIn`, `GrowFromEdge`, `GrowArrow`, `DrawBorderThenFill` |
| Removal | `FadeOut`, `Uncreate`, `ShrinkToCenter` |
| Transform | `Transform`, `ReplacementTransform`, `TransformMatchingTex` |
| Emphasis | `Indicate`, `Circumscribe`, `Flash`, `Wiggle` |
| Motion | `Shift`, `MoveToTarget` |
| Tracker | `ValueTracker.animate.set_value` |
| Pause | `wait` |

#### Updater Strategies (`updater.strategy`)

| Strategy | When to Use | Code Pattern |
|----------|-------------|--------------|
| `always_redraw` | Element rebuilt every frame | `always_redraw(lambda: ...)` |
| `value_tracker` | Element position driven by tracker | `dot.add_updater(lambda m: m.move_to(...))` |
| `add_updater` | Custom per-frame logic | `mob.add_updater(lambda m, dt: ...)` |

#### Position Methods (`position_method`)

| Method | Args Format |
|--------|-------------|
| `to_edge` | `["UP"]`, `["DOWN"]`, `["LEFT"]`, `["RIGHT"]` |
| `to_corner` | `["UL"]`, `["UR"]`, `["DL"]`, `["DR"]` |
| `next_to` | `["<element_id>", "<direction>", <buff>]` |
| `move_to` | `[<x>, <y>, <z>]` |
| `shift` | `[<dx>, <dy>, <dz>]` |

#### Rate Functions (`rate_func`)

`smooth`, `linear`, `rush_into`, `rush_from`, `there_and_back`, `double_smooth`,
or `null` (Manim default).

### Phase 3: Verbose Prompt Derivation (NEW — derived, not canonical)

The verbose prompt is **mechanically generated** from the scene spec. It exists
solely to give the code-generator agent a human-readable version of the spec.
If the verbose prompt and the scene spec ever disagree, the scene spec wins.

**Derivation rules**:

1. For each scene, enumerate elements with their exact `manim_class`, `params`,
   `position`, and `color`.
2. For each animation step, write the exact call with `run_time` and `rate_func`.
3. Include all LaTeX strings verbatim from `params.tex_string`.
4. Include the `transition_out` as an explicit final step.
5. Prepend the global header (color palette, manim version, scene base class).

The verbose prompt is not stored or versioned. It is generated on-the-fly
by the orchestrating agent and passed to the code-generator agent.

### Phase 4: Code Generation (EXISTING, enhanced)

The agent swarm receives the scene spec JSON plus the derived verbose prompt.
The code generator's contract:

1. **Must** use every element from the spec with the specified `manim_class`,
   `params`, `position`, and `color`.
2. **Must** implement animations in the specified order with the specified
   `run_time` and `rate_func`.
3. **Must** implement `transition_out` exactly (persist vs fade_out).
4. **Must not** add elements, animations, or styling not in the spec.
5. **May** add defensive code (try/except for LaTeX, z_index adjustments)
   only if it does not change visible output.

### Phase 5: Rendering + Integration (EXISTING, enhanced)

Same core flow: `manim -qm --format=mp4`, copy to assets, upload to Supabase.

### Phase 6: Validation (NEW)

A validation pass runs after rendering, before upload. All checks must pass.

#### 6a: Schema Conformance

Verify the scene spec JSON satisfies the schema invariants listed above.
This can run before code generation (fail fast).

#### 6b: Smoke Render

Run `manim -ql` (low quality, fast) on the generated Python file. If it exits
non-zero, the animation has a runtime error. Fix before proceeding.

#### 6c: Runtime + File Size Check

After full render (`-qm`):

| Check | Constraint | Action on Fail |
|-------|-----------|----------------|
| Duration | 20s <= duration <= 60s | Warn if outside 30-50s, error if outside 20-60s |
| File size | <= 2 MB at 720p30 | Error. Reduce scene count or simplify elements. |
| Codec | H.264 MP4 | Error. Re-render with `--format=mp4`. |

Duration is checked via `ffprobe -v error -show_entries format=duration`.

#### 6d: Manifest + Asset Verification

After copying to `cartridges/{id}/assets/`:

1. Every mode with an `"animation"` field in `manifest.json` has a corresponding
   file in `assets/`.
2. Every file in `assets/` is referenced by at least one mode.
3. Asset filenames match the `class_name` from the scene spec.
4. **No two modes share an animation filename.** This is enforced by
   `scripts/verify-cartridges.mjs:checkAnimationUniqueness`, which calls
   `error()` if any `animation` value appears in more than one mode.

Run the verifier before upload:
```bash
node scripts/verify-cartridges.mjs
```

#### 6e: Upload Verification

After Supabase upload, HTTP HEAD each public URL. Expect `200` and
`Content-Type: video/mp4`.

## Color Palette Standard

| Role | Manim Constant | Hex | Usage |
|------|----------------|-----|-------|
| x-values, horizontal asymptotes | `BLUE` | #58C4DD | Inputs, domain |
| y-values, curves, data | `YELLOW` | #FFFF00 | Outputs, range |
| Constants, correct answers | `GREEN` | #83C167 | k, verified results |
| Errors, vertical asymptotes | `RED` | #FC6255 | Mistakes, restrictions |
| Highlights, final answers | `GOLD` | #F0AC5F | Key insights, boxed results |
| Axes, neutral labels | `WHITE` | #FFFFFF | Structure |
| De-emphasized, prior versions | `GREY` | #888888 | Ghost curves, old state |

## LaTeX Precision Rules

1. **Always raw strings**: `MathTex(r"\frac{a}{b}")` — never unescaped backslashes.
2. **Split for color-coding**: Multi-arg MathTex to color parts independently:
   ```python
   eq = MathTex(r"y", r"=", r"\frac{k}{x}")
   eq[0].set_color(YELLOW)
   eq[2].set_color(GREEN)
   ```
3. **No `\phantom`**: ManimCE 0.18.x has an `IndexError` in `_break_up_by_substrings`
   when `\phantom` produces zero submobjects. Use `Text("")` or invisible `Dot()`
   for spacing. (See: Compatibility Notes below.)
4. **Notation must match cartridge**: Variable names from `generator.js` are canonical.
   If the generator says `k`, the animation says `k`.

## Timing Guidelines

| Content | Duration |
|---------|----------|
| Title/header appearance | 0.5 - 1.0s |
| Simple equation write | 1.0 - 1.5s |
| Complex equation build | 2.0 - 3.0s |
| Graph/curve creation | 1.5 - 2.0s |
| ValueTracker sweep | 2.0 - 3.0s |
| Comprehension pause | 0.5 - 1.0s |
| Scene transition (fade) | 0.5 - 0.8s |
| Insight/boxed takeaway | 1.5 - 2.0s |
| Total animation | 30 - 50s (hard bounds: 20 - 60s) |

## Compatibility Notes

**Manim version**: This project uses ManimCE **0.18.1**. There is no pinned
dependency file in the repo root. Until one is added, all animation code and
this spec target 0.18.x behavior.

Known 0.18.x issues:
- `\phantom` in `MathTex` causes `IndexError` in `_break_up_by_substrings`.
  Workaround: use `Text("")` for invisible spacing.
- `Intersection()` / `Difference()` for boolean CSG on 2D shapes works but
  can produce rendering artifacts with complex fills. Prefer manual clipping.

If Manim is upgraded, re-test all animations in `animations/` and update this
section.

## Implementation Plan

### Step 1: Vendor Math-To-Manim Reference

Copy SKILL.md and reference files from the Math-To-Manim repo at pinned commit
`0e5be3d` into `.claude/skills/math-to-manim/`:

```
.claude/skills/math-to-manim/
├── SKILL.md                          # 6-agent pipeline workflow
├── VENDORED_FROM.md                  # "HarleyCoops/Math-To-Manim @ 0e5be3d"
└── references/
    ├── reverse-knowledge-tree.md
    ├── agent-system-prompts.md
    ├── verbose-prompt-format.md
    └── manim-code-patterns.md
```

`VENDORED_FROM.md` records the source repo and commit hash for reproducibility.

### Step 2: Update create-animations.md

Modify `.claude/commands/create-animations.md`:

- Phase 1 (Analysis): Add knowledge tree discovery + fan-out table to Explore agent prompt.
- Phase 2 (NEW): Add scene spec generation step. Orchestrating agent produces JSON per asset.
- Phase 3 (Scripts): Code generator agents receive scene spec JSON + derived verbose prompt.
- Phase 6 (NEW): Add validation steps (smoke render, duration/size check, manifest verification).

### Step 3: Add validation to render pipeline

Add a lightweight post-render check script or inline validation that enforces
the Phase 6 checks before upload proceeds.

## Files Changed

| File | Change |
|------|--------|
| `docs/ANIMATION-PRECISION-SPEC.md` | This spec (new) |
| `.claude/skills/math-to-manim/SKILL.md` | Vendored from Math-To-Manim @ `0e5be3d` |
| `.claude/skills/math-to-manim/VENDORED_FROM.md` | Source + commit record |
| `.claude/skills/math-to-manim/references/*` | Vendored reference docs |
| `.claude/commands/create-animations.md` | Enhanced with scene spec + validation phases |
