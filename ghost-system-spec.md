# Ghost System Design Specification

A brainstorming document for the Digital Ghost feature - a system where students train behavioral AI companions that compete and visualize learning progress.

**Status**: Conceptual / Brainstorming
**Date**: January 2026
**Core Emotion**: Curiosity

---

## 1. Philosophy

### The Ghost as Mirror, Not Judge

The ghost is not a grade. It's not a score. It's a **reflection** of how a student learns.

Students aren't threatened because:
- They're not being judged, they're **training something**
- The ghost's flaws are just data, not failure
- Improving the ghost feels like leveling up a character, not fixing mistakes

The ghost doesn't learn math - it learns **the student**:
- How fast do they respond to different problem types?
- When do they use hints vs. push through?
- Which topics make them hesitate?
- Do they rush or work methodically?
- How does fatigue affect their accuracy?

This is a **behavioral fingerprint** - a digital twin of learning style, not knowledge.

### Transparency Over Judgment

Data collection is transparent and non-judgmental:
- "Your ghost learned from 47 interactions today"
- NOT "You got 72%"

Ghost training happens automatically on ALL interactions - not just graded ones. This removes pressure. You're not being tested; you're training your ghost.

---

## 2. Ghost Visualization

### Three Dimensions of Information

At a glance, observers can see THREE dimensions:

| Dimension | Visual | Meaning |
|-----------|--------|---------|
| **Engagement** | Opacity | How much has the student trained? |
| **Proficiency** | Color | How well is the ghost performing? |
| **Progress** | Position | How far through the course? |

### Opacity = Engagement

```
0 interactions    → barely visible (10% opacity)
50 interactions   → translucent (50% opacity)
100+ interactions → solid (100% opacity)
```

A faint ghost means "this student hasn't engaged much" - observation, not judgment.

### Color = Proficiency Gradient

Progression through the spectrum creates natural ranks without numbers:

```
White   (0-20%)   → Novice (just starting)
Yellow  (20-40%)  → Emerging
Orange  (40-60%)  → Developing
Red     (60-80%)  → Proficient
Indigo  (80-100%) → Mastery
```

"My ghost is orange" means something without being a score.

### Position = Progress

Where the ghost sits in the 3D maze shows how far through the course they've navigated. Combined with color and opacity, this creates a rich visual vocabulary.

---

## 3. The 3D Maze

### Cartridge as Landscape

Instead of linear progression (L1 → L2 → L3), the course becomes a **navigable 3D space**:

```
                        [4.8 Summit]
                             ↑
                [4.7a]──[4.7b]──[4.7c]──[4.7d]
                   ↑       ↑       ↑
            [4.5]──┴──[4.6]──┴──[shortcut?]
               ↑               ↑
        [4.3]──┴───[4.4]───────┘
           ↑
        [4.1]──[4.2]
           ↑
        [START]
```

### Maze Structure Derived from Manifest

- Each mode/level = a node (room, platform, checkpoint)
- `unlockedBy` relationships = edges (paths, bridges)
- Linear sequences become corridors
- Branching points become intersections
- Capstone levels become "boss rooms"

### Technology: Three.js

Tron/Specter-esque aesthetic:
- Glowing grid lines
- Translucent platforms
- Ghosts as luminous entities moving through space
- Particles/trails showing movement history

---

## 4. The Leaderboard as Landscape

### From Ranked List to Living Map

**Traditional leaderboard:**
```
1. Sarah - 2450 pts
2. Marcus - 2380 pts
3. Tyler - 2210 pts
```

**Ghost landscape:**
- 30 ghosts scattered across a 3D maze
- Some clustered at early levels (still learning)
- A few deep in the maze (advanced)
- Colors ranging from white to indigo
- Some bright and solid, others faint and wispy

### Implicit Competition

A student can find their ghost and immediately understand:
- "I'm in the middle of the pack spatially"
- "But I'm one of the more solid ones - I've trained more"
- "That indigo ghost way ahead - that's where I want to be"

Competition becomes **implicit**, not explicit. No one is "ranked #17." You just see where you are relative to others.

---

## 5. Ghost Battles

### The Concept

Two ghosts compete by racing through a simulated problem sequence:

1. Both ghosts start at maze entrance
2. A problem appears (visualized as obstacle or gate)
3. Each ghost's stats determine solve time and accuracy
4. Fast-and-wrong might hit a wall, backtrack
5. Slow-and-careful takes longer but never backtracks
6. First to reach the end wins

### Battles as Spectacle

The Tron-esque visualization makes battles watchable:
- Ghosts racing along glowing paths
- Obstacles lighting up as problems
- Collisions when errors occur
- Victory celebration at finish

The battle becomes a **story** - you watch your ghost's personality play out.

### Asynchronous Competition

Battles can run when students are offline:
- "Your ghost battled 5 times overnight"
- "Won 3, lost 2"
- "Rematch available against Marcus's ghost"

---

## 6. Ghost Data Model

### What We Track Per Interaction

```javascript
{
  timestamp: "2026-01-26T14:32:00Z",
  level_id: "l33-random-var-def",
  topic: "4.7a",

  // Timing
  time_to_answer_ms: 8500,
  time_since_session_start_ms: 180000,

  // Outcome
  correct: true,
  score: "E",  // E/P/I

  // Behavior
  hints_used: 0,
  hints_available: 3,
  current_streak: 4,
  retries_on_this_problem: 0,

  // Context
  problems_this_session: 12,
  session_accuracy_so_far: 0.83
}
```

### Statistical Ghost Profile (v1)

Simple parameter-based model, no ML library needed:

```javascript
{
  // Speed by level (average ms)
  speed_by_level: {
    "l01": 6000,
    "l02": 8000,
    "l33": 15000,
    // ...
  },

  // Accuracy by topic
  accuracy_by_topic: {
    "4.1": 0.92,
    "4.2": 0.85,
    "4.7": 0.71,
    // ...
  },

  // Behavioral traits
  hint_usage_rate: 0.12,
  streak_speed_bonus: 0.15,      // 15% faster when on streak
  fatigue_accuracy_penalty: 0.02, // -2% accuracy per 10 problems

  // Metadata
  total_interactions: 156,
  last_updated: "2026-01-26T14:32:00Z",
  color_level: "orange",         // Derived from overall proficiency
  opacity: 0.85                   // Derived from interaction count
}
```

### Neural Net Ghost (v2 - Future)

If statistical model proves insufficient:

**Inputs (10-15 features):**
- Problem difficulty level (normalized)
- Topic category (one-hot encoded)
- Time since session start
- Current streak count
- Hints remaining
- Recent accuracy (last 5 problems)
- Time of day
- Day of week

**Outputs (4 predictions):**
- Predicted response time
- Probability of correct answer
- Probability of using hint
- Confidence score

**Architecture:**
- Input layer: 15 neurons
- Hidden layer 1: 16 neurons (ReLU)
- Hidden layer 2: 16 neurons (ReLU)
- Output layer: 4 neurons
- Total: ~500 parameters

Stored as JSON, synced to server, trainable in-browser via TensorFlow.js.

---

## 7. Technical Considerations

### Browser Constraints

All computation must happen in-browser on limited school laptops:
- Sandboxed environment
- Restricted user permissions
- Potentially slow hardware
- Possibly disabled WebGL

### Computational Feasibility

**What works easily:**
- Statistical ghost profiles (pure JS, no libraries)
- Three.js visualization (WebGL, but graceful fallback)
- Small neural nets (~500 parameters)

**Potential issues:**

| Concern | Mitigation |
|---------|------------|
| TensorFlow.js size (1-2MB) | Lazy-load after main app |
| Training frequency | Batch updates (every 10 problems or session end) |
| WebGL disabled | CPU fallback, simpler visuals |
| Battery drain | Use requestIdleCallback for training |

### Recommendation

Start with **statistical profiles** (v1):
- Zero library overhead
- Instant on any hardware
- Captures 80% of behavioral nuance

Upgrade to neural net (v2) only if needed for complex behavioral patterns.

---

## 8. Pedagogical Benefits

### For Students

- **Curiosity**: "What would happen if I tried this?"
- **Low stakes**: Training a ghost feels safer than being tested
- **Visible progress**: Watch ghost evolve in color and opacity
- **Implicit competition**: See where you stand without harsh rankings

### For Teachers

**Difficulty Detection:**
If all ghosts struggle at certain levels, that's diagnostic feedback:
- Which problems are universally hard (poorly designed?)
- Which transitions are stumbling blocks (need scaffolding?)
- Where "boss battles" naturally emerge

**Engagement Metrics:**
Ghost opacity shows engagement without tracking "time on task":
- Faint ghosts = students who haven't engaged
- Solid ghosts = students who've trained extensively

**Class Visualization:**
The landscape view shows:
- Ghost density at each level (chokepoints)
- Color distribution (class-wide proficiency)
- Progress spread (pacing issues)

### Leveling Up the Ghost

Problems that are difficult provide more "training value":
- Easy problems barely move the needle
- Hard problems (that you eventually solve) level up the ghost significantly
- This naturally incentivizes productive struggle

---

## 9. Implementation Phases

### Phase 1: Ghost Profile Infrastructure
- Define data structure for ghost profiles
- Instrument problem interactions to collect data
- Store profiles in localStorage + sync to server
- Calculate color and opacity from profile

### Phase 2: Statistical Ghost (v1)
- Build simple parameter-based ghost model
- Derive speed/accuracy predictions from profile
- No ML library, pure JavaScript

### Phase 3: 3D Maze Generator
- Parse manifest.json progression rules
- Generate 3D node graph from level structure
- Three.js scene with Tron aesthetic

### Phase 4: Single Ghost Visualization
- Render student's own ghost in the maze
- Show current position, color, opacity
- Animate movement as levels are completed

### Phase 5: Multi-Ghost Landscape
- Render all class ghosts simultaneously
- Replace traditional leaderboard
- Add filtering (by period, by topic, etc.)

### Phase 6: Battle Simulation Engine
- Simulate ghost vs ghost races
- Stochastic resolution based on profiles
- Determine winners, track records

### Phase 7: Battle Visualization
- Animate battles in Three.js
- Tron-style racing through maze
- Victory/defeat effects

### Phase 8: Neural Net Upgrade (v2)
- Replace statistical model with TensorFlow.js
- Train on accumulated interaction data
- More nuanced behavioral predictions

---

## 10. Open Questions

### Gameplay
- Can students name their ghost?
- Can ghosts have visual customization beyond color/opacity?
- Should there be "ghost abilities" that unlock?

### Social
- Can students watch other students' ghosts train?
- Can you challenge a specific ghost to battle?
- Are there team-based ghost competitions?

### Progression
- Do ghosts "decay" without training (encouraging regular practice)?
- Can you reset your ghost and start over?
- Are there ghost "milestones" that unlock rewards?

### Technical
- How do we handle students with no localStorage (incognito mode)?
- What's the sync strategy between local and server ghost data?
- How do we handle ghost battles for students who've never met?

---

## 11. Success Metrics

How do we know the ghost system is working?

| Metric | Signal |
|--------|--------|
| Engagement | More problems attempted per session |
| Return rate | Students coming back to "train their ghost" |
| Curiosity | Students exploring levels beyond requirements |
| Discussion | Students talking about ghosts with each other |
| Teacher utility | Teachers using landscape view for diagnostics |

---

## 12. The North Star

> **What do we want students to feel?**

**Curiosity above all.**

- "What would happen if I tried this problem?"
- "That student's ghost is indigo - what did they do differently?"
- "My ghost struggles at L18 - what is it about that level?"
- "If I use fewer hints, will my ghost become more independent?"

The ghost should feel slightly mysterious, alive, growing.

Not a score. A companion.

---

*This document captures brainstorming from January 2026. Implementation details may evolve as development progresses.*
