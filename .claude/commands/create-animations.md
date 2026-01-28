# Create Animations

Generate Manim math animations for a cartridge's challenging concepts and integrate them into the drill platform.

**This skill uses agent swarms for parallel execution.**

## Usage

```
/create-animations <cartridge-id>
```

**Arguments:**
- `cartridge-id`: ID of an existing cartridge (e.g., `a2t3l3`, `graphing-polynomials`)

## What This Skill Does

1. **Analyzes** the cartridge using an Explore agent
2. **Creates** multiple Manim scripts in parallel using agent swarm
3. **Renders** all animations in parallel using background tasks
4. **Integrates** videos into the cartridge (assets folder, manifest updates)

## Instructions for Claude

When this skill is invoked, use **agent swarms** to parallelize work:

---

### Phase 1: Analysis (Explore Agent)

Spawn a single **Explore agent** to analyze the cartridge:

```
Task tool:
  subagent_type: Explore
  prompt: |
    Analyze the cartridge at cartridges/{cartridge-id}/ to identify concepts
    that would benefit from Manim math animations.

    Read:
    - cartridges/{cartridge-id}/manifest.json (modes, hints, progression)
    - cartridges/{cartridge-id}/generator.js (problem types, scenarios)

    Return a structured list of 3-6 animation concepts with:
    1. Concept name (e.g., "Difference of Squares")
    2. Why it needs animation (abstract, procedural, error-prone)
    3. Animation type (area-model, step-by-step, pattern-building, error-analysis)
    4. Which mode IDs should use this animation
    5. Suggested filename (e.g., "difference_of_squares.py")
    6. Main scene class name (e.g., "DifferenceOfSquares")
```

Wait for the Explore agent to return the concept list before proceeding.

---

### Phase 2: Script Creation (Parallel Agents)

**Spawn multiple general-purpose agents in parallel** - one for each animation concept. Send a **single message with multiple Task tool calls**:

```
# In ONE message, spawn all script-writing agents in parallel:

Task tool #1:
  subagent_type: general-purpose
  description: "Create {concept1} animation"
  prompt: |
    Create a Manim animation script for: {concept1}

    Animation type: {type1}
    Target audience: High school {subject} students

    Write to: animations/{filename1}.py
    Main class: {ClassName1}

    Requirements:
    - Title at top, formula shown
    - Step-by-step build (don't show everything at once)
    - Color coding: BLUE, RED, GREEN, YELLOW for emphasis
    - Use MathTex for formulas, Text for explanations
    - Highlight key insights with Indicate or SurroundingRectangle
    - End with boxed final answer
    - Keep under 60 seconds
    - Include docstring with run command

    Animation templates to follow:
    [Include relevant template based on animation type]

Task tool #2:
  subagent_type: general-purpose
  description: "Create {concept2} animation"
  prompt: [similar structure for concept 2]

Task tool #3:
  subagent_type: general-purpose
  description: "Create {concept3} animation"
  prompt: [similar structure for concept 3]

# ... continue for all concepts (typically 3-6 agents)
```

**IMPORTANT:** All Task tool calls must be in the **same message** to run in parallel.

---

### Phase 3: Rendering (Parallel Background Tasks)

After all scripts are created, **render all animations in parallel using background Bash tasks**:

```
# In ONE message, spawn all render tasks in background:

Bash tool #1:
  command: cd animations && manim -qm --format=mp4 {filename1}.py {ClassName1}
  run_in_background: true
  description: "Render {concept1} animation"

Bash tool #2:
  command: cd animations && manim -qm --format=mp4 {filename2}.py {ClassName2}
  run_in_background: true
  description: "Render {concept2} animation"

Bash tool #3:
  command: cd animations && manim -qm --format=mp4 {filename3}.py {ClassName3}
  run_in_background: true
  description: "Render {concept3} animation"

# ... continue for all animations
```

Use `TaskOutput` to check on background task completion, or wait for notifications.

---

### Phase 4: Integration (Sequential)

Once all renders complete:

1. **Create assets folder:**
```bash
mkdir -p cartridges/{cartridge-id}/assets
```

2. **Copy all rendered videos** (can be parallel Bash calls):
```bash
cp animations/media/videos/{filename1}/720p30/{ClassName1}.mp4 cartridges/{cartridge-id}/assets/
cp animations/media/videos/{filename2}/720p30/{ClassName2}.mp4 cartridges/{cartridge-id}/assets/
# ... etc
```

3. **Update manifest.json** - Add `animation` field to each mode based on the mapping from Phase 1.

4. **Report completion** with summary table:

| Mode ID | Animation File | Concept |
|---------|---------------|---------|
| l01-... | ConceptA.mp4 | Description |
| l02-... | ConceptA.mp4 | Same animation |
| l05-... | ConceptB.mp4 | New concept |

---

## Agent Prompts Reference

### Explore Agent Prompt (Phase 1)
```
Analyze cartridge {id} for animation opportunities.

Read manifest.json and generator.js. Identify 3-6 concepts that are:
- Abstract (hard to visualize from text)
- Procedural (multi-step processes)
- Geometric (shapes, graphs, spatial)
- Error-prone (common student mistakes shown in hints)

For each concept, provide:
1. concept_name: string
2. reason: why it needs animation
3. animation_type: "area-model" | "step-by-step" | "pattern-building" | "error-analysis"
4. mode_ids: list of modes that should show this animation
5. filename: snake_case.py
6. class_name: PascalCase

Return as structured JSON list.
```

### Script Writer Agent Prompt (Phase 2)
```
Create Manim animation: {concept_name}
Type: {animation_type}
Subject: {subject} (high school level)
Output: animations/{filename}
Class: {class_name}

Follow this template for {animation_type}:
[Insert appropriate template]

Design principles:
- Title + formula at top
- Build step by step with self.wait() pauses
- Colors: BLUE (primary), RED (errors/subtract), GREEN (correct), YELLOW (highlight)
- MathTex for math, Text for explanations
- Indicate() for emphasis, SurroundingRectangle for boxing answers
- 30-60 seconds total
- Docstring with: manim -qm --format=mp4 {filename} {class_name}

Write the complete Python file.
```

---

## Animation Templates

### Area Model (for identities)
```python
"""
{Identity Name}: Visual proof using area
Run with: manim -qm --format=mp4 {file}.py {Class}
"""
from manim import *

class {ClassName}(Scene):
    def construct(self):
        title = Text("{Title}", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        formula = MathTex("{formula}", font_size=36)
        formula.next_to(title, DOWN)
        self.play(Write(formula))
        self.wait(1)

        # Draw main square/rectangle
        # Divide into regions
        # Label each region
        # Show sum = total area
        # Box final identity

        self.wait(2)
```

### Step-by-Step Procedure
```python
class {ClassName}(Scene):
    def construct(self):
        title = Text("{Title}", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        problem = MathTex("{problem}", font_size=32)
        self.play(Write(problem))
        self.wait(1)

        # Step 1
        step1 = VGroup(
            Text("Step 1: {description}", font_size=28, color=YELLOW),
            MathTex("{math}", font_size=28)
        ).arrange(DOWN)
        self.play(Write(step1))
        self.wait(1)

        # Step 2, 3, etc.
        # Final answer with box

        self.wait(2)
```

### Error Analysis
```python
class {ClassName}(Scene):
    def construct(self):
        title = Text("Common Error: {error_type}", font_size=40, color=RED)
        title.to_edge(UP)
        self.play(Write(title))

        # Wrong approach (left side)
        wrong_title = Text("WRONG", font_size=28, color=RED)
        wrong = VGroup(
            MathTex("{wrong_step1}"),
            MathTex("{wrong_step2}"),
            MathTex("{wrong_answer}", color=RED)
        ).arrange(DOWN)
        cross = Cross(wrong[-1], color=RED)

        # Correct approach (right side)
        correct_title = Text("CORRECT", font_size=28, color=GREEN)
        correct = VGroup(
            MathTex("{correct_step1}"),
            MathTex("{correct_step2}"),
            MathTex("{correct_answer}", color=GREEN)
        ).arrange(DOWN)
        box = SurroundingRectangle(correct[-1], color=GREEN)

        # Animate both
        self.wait(2)
```

### Pattern Building
```python
class {ClassName}(Scene):
    def construct(self):
        title = Text("{Title}", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        # Build pattern row by row / step by step
        # Highlight the rule being discovered
        # Show formula connection

        self.wait(2)
```

---

## Execution Summary

| Phase | Agent Type | Parallelism | Purpose |
|-------|-----------|-------------|---------|
| 1. Analysis | Explore | Single | Identify concepts |
| 2. Scripts | general-purpose | **Parallel swarm** (3-6 agents) | Write Manim files |
| 3. Render | Bash (background) | **Parallel** | Generate MP4s |
| 4. Integrate | Main agent | Sequential | Copy files, update manifest |

**Expected speedup:** 3-6x faster than sequential execution for script creation and rendering.

---

## Example Execution Flow

```
User: /create-animations a2t3l3

Claude:
1. [Spawns Explore agent] → Returns 5 concepts
2. [Spawns 5 general-purpose agents IN PARALLEL] → All write scripts simultaneously
3. [Spawns 5 background Bash tasks IN PARALLEL] → All render simultaneously
4. [Copies videos, updates manifest]
5. Reports completion with mode-to-animation mapping
```

---

## File Sizes

Target file sizes for web delivery:
- 30-second animation at 720p30: ~500KB - 1.5MB
- Keep total cartridge animations under 10MB

## Platform Integration

The platform (`platform/app.html`) displays animations when:
1. Mode has `animation` field in manifest
2. Animation panel shows in left pane (alongside scenario)
3. Video autoplays muted, loops, with play/pause controls
4. Students can hide animation if distracting
