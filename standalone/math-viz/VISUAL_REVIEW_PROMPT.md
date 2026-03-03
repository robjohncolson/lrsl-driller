# Visual Design Review: Math Foundations Visualizer

## Context

I have a Three.js web app that teaches students perfect squares, perfect cubes, and algebraic identities through geometric visualization. It uses a 3Blue1Brown-inspired dark theme with color-coded math terms (cyan for `a`, gold for `b`, green for `ab` cross-terms).

**The visualizations need to be more rigorous and pedagogically clear.** I need your help redesigning the animation choreography for 6 modes. For each mode, I'll describe what it currently does, what's wrong, and I need you to propose a step-by-step animation sequence that is geometrically rigorous and makes the math visually self-evident.

## Tech Constraints

- Three.js (WebGL), single HTML file
- Orthographic camera for 2D modes, Perspective + OrbitControls for 3D modes
- `InstancedMesh` for unit blocks, `PlaneGeometry` for 2D regions, `BoxGeometry` for 3D solids
- Text labels via `CanvasTexture` + `Sprite`
- Animation: step-based queue, ~500ms per step, easeOutCubic
- Must work on Chromebooks (no shadows, no post-processing, DPR capped at 2)

## Color System

| Role | Hex | Usage |
|------|-----|-------|
| `a` terms | `#58c4dd` (cyan) | Side length a, a² area, a³ volume |
| `b` terms | `#fcba03` (gold) | Side length b, b² area, b³ volume |
| `ab` cross-terms | `#83c167` (green) | Products of a and b |
| Background | `#1a1a2e` (deep navy) | Scene background |
| Highlights | `#ff6b6b` (coral) | Results, key measurements |

---

## MODE 1: Perfect Squares (orthographic, top-down)

### Current Implementation
- Flat n×n grid of thin tiles (InstancedMesh), builds by incrementing instance count
- Label sprite: `n² = 64` at font size 46px, scale 0.0095
- Drill asks: "Is 84 a perfect square? If yes, enter √84" — student must type a √ symbol

### Problems
1. **Area label is too small** — at scale 0.0095 it's barely readable, especially on smaller screens
2. **Drill input is unreasonable** — there's no √ symbol on a standard keyboard. Students can't type `√17`.

### What I Need From You
1. How should the area/volume label be sized and positioned for maximum readability? Consider: should it be a large HUD-style overlay (HTML positioned over the canvas) rather than an in-scene sprite?
2. For the drill: what's a better question format that avoids requiring special symbols? Options I'm considering:
   - "Is 84 a perfect square? [Yes/No]. If yes, what number squared equals 84? [___]"
   - "What is the square root of 84? (Enter a whole number, or 'none' if not perfect)"
   - Something else?

---

## MODE 2: Perfect Cubes (perspective, rotatable)

### Current Implementation
- n×n×n unit cubes (InstancedMesh), layer-by-layer build animation
- Label: `n³ = 125` at 46px, scale 0.0092
- Drill asks: "Is 125 a perfect cube? If yes, enter ∛125" — same keyboard symbol problem

### Problems
1. **Volume label too small** — same issue as squares
2. **∛ symbol not typeable** — same input problem
3. **No dimensional annotation** — the cube doesn't label its edge length, so the connection between "edge = 5" and "volume = 125" isn't visually explicit

### What I Need From You
1. Same label sizing question as Mode 1
2. Same drill input question
3. Should edge lengths be annotated directly on the cube wireframe (like architectural dimension lines)?

---

## MODE 3: (a+b)² = a² + 2ab + b² (orthographic, 2D area model)

### Current Implementation
- Four PlaneGeometry regions positioned in a square: a²(cyan), ab(green)×2, b²(gold)
- Animation: (1) dividing lines fade in, (2) regions separate slightly + labels fade in
- Label sprites at scale 0.01 — very small
- KaTeX equation updates through stages with color-coded terms

### Problems
1. **Labels/variables too small** — the a², ab, b² labels on each region are nearly invisible
2. **Animation doesn't build the geometric argument** — it starts with the square already subdivided, then just separates pieces. It doesn't show WHERE the square comes from.

### What the Animation SHOULD Show (my pedagogical intent)

The whole point is: **(a+b)² means "the area of a square whose side is (a+b)."** The animation should make this viscerally obvious:

**Proposed sequence:**
1. **Show the side length**: A horizontal line segment, left portion colored cyan (length a), right portion colored gold (length b). Label them. This is the 1D starting point.
2. **Duplicate vertically**: Copy that line segment to the left edge, rotated 90°. Now you have two perpendicular sides of a square.
3. **Form the square**: Fill in the (a+b) × (a+b) square as a single region. Label it "(a+b)²".
4. **Draw the partition lines**: Horizontal line at height b from bottom, vertical line at width a from left. The square is now visibly divided into 4 regions.
5. **Label each region**: a×a = a² (cyan), a×b = ab (green, top-right), b×a = ab (green, bottom-left), b×b = b² (gold, bottom-right).
6. **Summarize**: Equation appears: (a+b)² = a² + 2ab + b²

### What I Need From You
1. Is my proposed sequence correct and complete? Any steps I should add, remove, or reorder?
2. How should the side-length labels be positioned — along the edges of the square? Floating nearby?
3. How large should region labels be relative to the region they're in? Should they scale with a and b, or be fixed size?
4. Should the "2ab" be shown as two separate "ab" labels (one per green region) or merged?
5. Any visual tricks to make the "side length → area" conceptual leap clearer?

---

## MODE 4: a² − b² = (a+b)(a−b) (orthographic, geometric proof)

### Current Implementation
- Starts with an a×a cyan square and a b×b gold square in the corner
- Step 1: Gold corner fades and slides away
- Step 2: A "slide rectangle" moves into position
- Final label: (a+b)(a-b)

### Problems
1. **Not rigorous** — the current animation doesn't clearly show the geometric proof. The L-shape isn't explicitly formed, and the "cut + rearrange" step is confusing.
2. **The proof should be self-evident** — a student watching should think "oh, THAT'S why a²−b² factors that way"

### The Classical Geometric Proof (what it SHOULD show)

1. **Start**: a×a square, fully cyan. Label side lengths "a" on both edges.
2. **Mark the cut**: Show b as a measurement from the top-right corner. Draw the b×b region in the top-right corner, colored gold.
3. **Remove b²**: The gold b×b square fades/lifts away. The remaining L-shaped region IS a²−b².
4. **Cut the L-shape**: A horizontal cut at height (a−b) from the bottom splits the L into two rectangles:
   - Bottom rectangle: width a, height (a−b)
   - Right rectangle: width b, height (a−b)
   Wait — let me think about this more carefully. The L-shape after removing b² from the top-right corner:
   - Left column: width a, height a (but the top-right b×b is gone)
   - Actually the L-shape consists of:
     - A bottom strip: width a, height (a−b)
     - A left strip: width (a−b), height b
   - OR equivalently, cut horizontally at y = (a−b):
     - Bottom piece: a × (a−b)
     - Top-left piece: (a−b) × b
5. **Slide to form rectangle**: Move the top-left piece to the right of the bottom piece. Result: a single rectangle of width (a+b), height (a−b). This IS (a+b)(a−b).
6. **Label**: Show dimensions (a+b) and (a−b) on the resulting rectangle.

### What I Need From You
1. Verify my geometric proof sequence is correct — I want to make sure the cut and rearrangement is right.
2. Which cut direction works better visually — horizontal or vertical?
3. How should the "slide" animation telegraph what's happening? Should the piece being moved have a different outline or glow?
4. Should dimension labels (a, b, a−b, a+b) be shown as bracket/brace annotations along edges, or as floating text?

---

## MODE 5: a³ + b³ = (a+b)(a² − ab + b²) (perspective, 3D)

### Current Implementation
- Two separate cubes (cyan a³, gold b³) side by side
- Animation: cubes separate, then come back together
- A red line shows the (a+b) edge
- Equation overlay shows the factored form

### Problems
1. **Not rigorous at all** — showing two cubes side by side doesn't prove anything. It's just "here are two cubes and here's an equation."
2. **No geometric decomposition** — the identity isn't demonstrated, just stated.

### What the Animation SHOULD Show (my pedagogical intent)

The sum of cubes is harder to visualize geometrically than the difference. Here's what I think could work:

**Option A: Show that a³+b³ equals a rectangular solid (a+b) deep with cross-section (a²−ab+b²)**
- Build the a-cube and b-cube
- Merge them into a combined solid along one edge (showing a+b as the total length)
- Slice the combined solid to reveal the cross-section pattern

**Option B: Algebraic + volumetric hybrid**
- Show the a-cube and b-cube with volume labels
- Animate the factored form: show (a+b) as a linear measurement, then show the trinomial factor as an area, then show volume = length × area
- Color-code each term in the trinomial to parts of the cross-section

**Option C: Build from the factored form**
- Start with the factored form: a slab of depth (a+b) with a specific cross-section
- Show that this slab's volume equals a³+b³ by decomposing it

### What I Need From You
1. Which option (A, B, C, or something else) is most geometrically rigorous AND visually clear?
2. Is there a clean geometric proof of a³+b³ = (a+b)(a²−ab+b²) that can be animated? (The −ab term makes this tricky — negative areas don't exist geometrically)
3. If a fully rigorous 3D decomposition is too complex, what's the most honest way to show this identity without pretending the geometry proves more than it does?
4. Should this mode use unit cubes (InstancedMesh voxels) or solid BoxGeometry shapes? Voxels make counting possible but are slower for large a,b.

---

## MODE 6: a³ − b³ = (a−b)(a² + ab + b²) (perspective, 3D)

### Current Implementation
- a-cube wireframe (cyan), b-cube in corner (gold) that fades out
- Three slabs appear from off-screen and slide into position:
  - a×a×(a−b) cyan slab
  - a×b×(a−b) green slab
  - b×b×(a−b) gold slab
- Labels fade in: a², ab, b²

### Problems
1. **Slabs appear from nowhere** — they should be shown as parts of the original cube, not summoned from off-screen
2. **The connection between the cube and the slabs isn't clear** — the decomposition should happen IN PLACE

### What the Animation SHOULD Show

The difference of cubes HAS a clean geometric proof:

1. **Start**: a×a×a cube (solid cyan, slightly transparent)
2. **Remove b³**: Show the b×b×b cube occupying the top-front-right corner. Fade/slide it out. The remaining volume is a³−b³.
3. **Decompose in place**: The L-shaped 3D solid (a³ minus b³ corner) can be cut into exactly 3 rectangular prisms, all sharing thickness (a−b):
   - Slab 1: a × a × (a−b) — the full back face, thickness (a−b). Color: cyan.
   - Slab 2: a × b × (a−b) — sits in front of slab 1, below where b³ was. Color: green.
   - Slab 3: b × b × (a−b) — fills the remaining corner. Color: gold.
4. **Separate slabs**: Pull the 3 slabs apart slightly so each is individually visible. Label their dimensions.
5. **Show the factor**: All 3 slabs share thickness (a−b). Their cross-sections are a², ab, and b². So total = (a−b)(a² + ab + b²).

### What I Need From You
1. Verify this decomposition is geometrically correct — do these 3 slabs exactly fill the L-shaped solid?
2. What's the best camera angle to see all 3 slabs during the decomposition?
3. Should the slabs separate by sliding along one axis (like pulling a drawer) or explode outward in different directions?
4. How should dimension labels be placed on 3D slabs? On faces? Floating above?

---

## Global Questions

1. **Label sizing**: The current sprites use scale ~0.01 and font 46px. What scale/font combination would make labels clearly readable at all zoom levels? Or should labels be HTML overlays (positioned via CSS over the canvas) instead of in-scene sprites?

2. **Dimension annotations**: For showing measurements like "a", "b", "a+b", "a−b" on edges of shapes — what visual style works best?
   - Bracket/brace along the edge (like engineering drawings)
   - Simple line with perpendicular end-ticks and centered text
   - Colored line segment matching the term's color with floating label

3. **Animation pacing**: Current ~500ms per step, 2 steps total (~1 second). For more complex sequences (5-6 steps), should each step be shorter (~300ms) to keep total time reasonable, or should total time extend to ~3 seconds?

4. **Mobile/tablet**: On narrow screens (<768px), the canvas shrinks. Should labels switch to HTML overlays at small sizes to maintain readability?
