# LRSL-Driller: Complete System Specification

> **Version**: v4.8.0 | **Date**: 2026-03-02 | **Cartridges**: 17 active + 1 template
> **Total Source**: ~51,000 LOC platform + ~15,000 LOC server + ~1,924 tests
> **Stack**: Vanilla JS (frontend) | Express + Supabase (backend) | Vite (build) | Vitest (test)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture: Console-Cartridge Pattern](#2-architecture-console-cartridge-pattern)
3. [Platform Layer](#3-platform-layer)
   - 3.1 [app.html — The Orchestrator](#31-apphtml--the-orchestrator)
   - 3.2 [Core Engines](#32-core-engines)
   - 3.3 [Input System](#33-input-system)
   - 3.4 [Graph Engine](#34-graph-engine)
   - 3.5 [Shuffle Bag System](#35-shuffle-bag-system)
   - 3.6 [User System & Identity](#36-user-system--identity)
   - 3.7 [Celebration & Sound](#37-celebration--sound)
   - 3.8 [Sync Queue](#38-sync-queue)
   - 3.9 [WebSocket Client](#39-websocket-client)
   - 3.10 [Time Tracker & Class Time](#310-time-tracker--class-time)
4. [Cartridge System](#4-cartridge-system)
   - 4.1 [Registry](#41-registry)
   - 4.2 [Cartridge Anatomy (4 Files)](#42-cartridge-anatomy-4-files)
   - 4.3 [Manifest Schema](#43-manifest-schema)
   - 4.4 [Generator Contract](#44-generator-contract)
   - 4.5 [Grading Rules Contract](#45-grading-rules-contract)
   - 4.6 [AI Grader Prompt Template](#46-ai-grader-prompt-template)
   - 4.7 [Cartridge Inventory](#47-cartridge-inventory)
   - 4.8 [Cartridge Loader](#48-cartridge-loader)
5. [Grading Pipeline](#5-grading-pipeline)
   - 5.1 [Dual Grading Architecture](#51-dual-grading-architecture)
   - 5.2 [Grading Strategies](#52-grading-strategies)
   - 5.3 [E/P/I Scoring Scale](#53-epi-scoring-scale)
   - 5.4 [Star System & Penalties](#54-star-system--penalties)
   - 5.5 [Scoring Configuration](#55-scoring-configuration)
   - 5.6 [AI Grading Flow](#56-ai-grading-flow)
   - 5.7 [Appeal Mechanism](#57-appeal-mechanism)
   - 5.8 [Teacher Review Queue](#58-teacher-review-queue)
6. [Game Engine & Progression](#6-game-engine--progression)
   - 6.1 [Tier Progression](#61-tier-progression)
   - 6.2 [Streak System](#62-streak-system)
   - 6.3 [Rank System](#63-rank-system)
   - 6.4 [Unlock Mechanics](#64-unlock-mechanics)
7. [Ghost System](#7-ghost-system)
   - 7.1 [Ghost Profiles](#71-ghost-profiles)
   - 7.2 [Neural Network Architecture](#72-neural-network-architecture)
   - 7.3 [Ghost Battle Engine](#73-ghost-battle-engine)
   - 7.4 [3D Maze Visualization](#74-3d-maze-visualization)
8. [Ghost Orbits — Arcade Game](#8-ghost-orbits--arcade-game)
   - 8.1 [Game Modes](#81-game-modes)
   - 8.2 [Physics Engine](#82-physics-engine)
   - 8.3 [Territory & Dot System](#83-territory--dot-system)
   - 8.4 [Shadow AI](#84-shadow-ai)
   - 8.5 [Renderer](#85-renderer)
   - 8.6 [HUD Panel](#86-hud-panel)
   - 8.7 [Audio System](#87-audio-system)
   - 8.8 [Multiplayer System](#88-multiplayer-system)
9. [Animation System](#9-animation-system)
   - 9.1 [Manim Pipeline](#91-manim-pipeline)
   - 9.2 [Animation Inventory](#92-animation-inventory)
10. [Server (Railway Backend)](#10-server-railway-backend)
    - 10.1 [Server Architecture](#101-server-architecture)
    - 10.2 [REST API — Complete Endpoint Map](#102-rest-api--complete-endpoint-map)
    - 10.3 [WebSocket Protocol](#103-websocket-protocol)
    - 10.4 [AI Provider Integration](#104-ai-provider-integration)
    - 10.5 [Ghost Orbits Server Managers](#105-ghost-orbits-server-managers)
11. [Database Schema (Supabase)](#11-database-schema-supabase)
12. [State Persistence](#12-state-persistence)
    - 12.1 [localStorage Keys](#121-localstorage-keys)
    - 12.2 [IndexedDB (Dexie)](#122-indexeddb-dexie)
    - 12.3 [Server Sync](#123-server-sync)
13. [Build, Deploy & Infrastructure](#13-build-deploy--infrastructure)
    - 13.1 [Development](#131-development)
    - 13.2 [Production Deployment](#132-production-deployment)
    - 13.3 [Environment Variables](#133-environment-variables)
    - 13.4 [External Dependencies](#134-external-dependencies)
14. [Testing](#14-testing)
    - 14.1 [Test Structure](#141-test-structure)
    - 14.2 [Test Patterns](#142-test-patterns)
    - 14.3 [Coverage Map](#143-coverage-map)
15. [Documentation Index](#15-documentation-index)
16. [State Machines Reference](#16-state-machines-reference)
17. [Data Flow Diagrams](#17-data-flow-diagrams)
18. [File Tree](#18-file-tree)

---

## 1. System Overview

LRSL-Driller is a **subject-agnostic educational drill platform** designed for a high school math teacher. It follows a **Console-Cartridge pattern**: the platform (console) handles all orchestration, rendering, grading, and gamification, while self-contained cartridges (lessons) provide the subject-matter content.

**Key capabilities:**
- Dual grading: fast keyword matching + AI (Groq/Gemini), best score wins
- Mastery-based progression with star tiers (Gold/Silver/Bronze/Tin)
- Neural network ghost AI that learns student behavior (TensorFlow.js)
- Full arcade game mode (Ghost Orbits) with multiplayer
- Real-time classroom features (leaderboard, class time, WebSocket presence)
- Manim-generated math animation system
- Teacher tools (review queue, roster management, progression overrides)

**Entry points:**
| Entry | URL | Purpose |
|-------|-----|---------|
| Primary | `http://localhost:5173/platform/app.html` | Main app (requires Vite dev server) |
| Legacy | `index.html` (file://) | Setup guide / redirect |
| Teacher Map | `platform/teacher-map.html` | Admin interface |
| Demo | `platform/demo.html` | Component testing |
| Game Test | `platform/game-test.html` | Ghost Orbits test harness |

---

## 2. Architecture: Console-Cartridge Pattern

```
┌──────────────────────────────────────────────────────────────────┐
│                     PLATFORM (Console)                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Grading  │  │  Input   │  │  Graph   │  │  Progression   │  │
│  │  Engine   │  │ Renderer │  │  Engine  │  │  & Gamification│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│       │              │             │                 │            │
│  ┌────┴──────────────┴─────────────┴─────────────────┴────────┐  │
│  │                    app.html (~5500 lines)                   │  │
│  │              Orchestrator / State Machine                   │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                  │
│  ┌──────────┐  ┌──────────┐  │  ┌──────────┐  ┌──────────────┐ │
│  │  Ghost   │  │  Ghost   │  │  │  Sound   │  │  Celebration  │ │
│  │  Engine  │  │  Orbits  │  │  │  Engine  │  │  System       │ │
│  └──────────┘  └──────────┘  │  └──────────┘  └──────────────┘ │
└──────────────────────────────┼──────────────────────────────────┘
                               │ loads
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CARTRIDGE (Lesson)                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ manifest.json│  │ generator.js │  │ grading-rules.js     │   │
│  │ (config)     │  │ (problems)   │  │ (answer evaluation)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           ai-grader-prompt.txt (optional)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           assets/ — MP4 animations (optional)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                               │
                               │ syncs
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                 RAILWAY SERVER (Backend)                          │
│                                                                  │
│  ┌────────────┐  ┌───────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  REST API  │  │ WebSocket │  │ AI Grade │  │  Ghost Orbits│  │
│  │  (Express) │  │ (ws)      │  │ (Groq +  │  │  Manager     │  │
│  │            │  │           │  │  Gemini) │  │              │  │
│  └──────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬──────┘  │
│         └───────────────┴─────────────┴───────────────┘          │
│                               │                                  │
│                      ┌────────▼────────┐                         │
│                      │    Supabase     │                         │
│                      │   (PostgreSQL)  │                         │
│                      └─────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘
```

**Separation of concerns:**
- **Platform** is topic-agnostic — knows nothing about statistics or algebra
- **Cartridge** is platform-agnostic — just provides content contracts
- **Server** is stateless relay — grading AI, data persistence, real-time broadcast

---

## 3. Platform Layer

### 3.1 app.html — The Orchestrator

**File:** `platform/app.html` (~5500 lines)
**Role:** Single-page application that wires every engine together

**Major sections (by line range):**

| Lines | Section | Purpose |
|-------|---------|---------|
| 1–400 | HTML structure | DOM layout, panels, modals |
| 400–800 | CSS styles | Dark theme, responsive layout, animations |
| 800–1400 | Initialization | Import engines, boot sequence, localStorage restore |
| 1400–1700 | Ghost panel | Ghost visualization, battle UI, 3D maze |
| 1700–2000 | Leaderboard | Real-time rankings, class period filters |
| 2000–2400 | Progress sync | Server bidirectional sync, conflict resolution |
| 2400–2800 | Problem rendering | `renderProblem()`, graph display, animation player |
| 2800–3100 | Grading orchestration | `onGradingComplete()` — the central callback |
| 3100–3500 | Cartridge UI | Dropdown, loading animation, shortcuts panel |
| 3500–4000 | Teacher tools | Review queue, roster modal, progression overrides |
| 4000–4400 | `loadCartridge()` | Core loader function, state initialization |
| 4400–5000 | Event handlers | Keyboard shortcuts, button clicks, WebSocket events |
| 5000–5500 | Utility functions | Helpers, error handling, startup sequence |

**Key global state:**

```javascript
currentCartridgeId    // Active cartridge ID
currentMode           // Active mode object
currentContext        // Problem context (from generator)
currentAnswers        // Expected answers (from generator)
platform              // CartridgeLoader instance
gameEngine            // GameEngine instance
gradingEngine         // GradingEngine instance
inputRenderer         // InputRenderer instance
graphEngine           // GraphEngine instance
ghostEngine           // GhostEngine instance
userSystem            // UserSystem instance
wsClient              // WebSocket client instance
```

**Critical function: `onGradingComplete()` (~line 3095)**
This is the nexus of the entire grading flow. After all fields are graded:
1. Determines star type from penalty count
2. Records result in GameEngine
3. Triggers celebration effects
4. Syncs progress to server
5. Updates ghost profile
6. Checks unlock conditions
7. Broadcasts star earned via WebSocket

### 3.2 Core Engines

#### Game Engine (`platform/core/game-engine.js`, ~800 lines)

**Role:** Progression state machine — tracks stars, streaks, unlocks, tier progression.

**State shape:**
```javascript
{
  cartridgeId: "apstats-u5-sampling-dist",
  currentModeId: "modeId",
  starCounts: { gold: 12, silver: 5, bronze: 3, tin: 1 },
  starsPerMode: {
    "mode-1": { gold: 3, silver: 1, bronze: 0, tin: 0 },
    "mode-2": { gold: 0, silver: 0, bronze: 0, tin: 0 }
  },
  streaks: { "mode-1": 2, "mode-2": 0 },
  unlockedModes: ["mode-1", "mode-2"],
  penalties: 0,
  updated_at: "ISO timestamp"
}
```

**Key methods:**
- `recordResult(modeId, score, penalties)` — Award star, update streaks
- `awardStar(type, modeId)` — Increment star count
- `checkUnlocks()` — Iterate locked modes, check gold requirements
- `getProgress()` — Return full state for sync
- `loadProgress(data)` — Restore from server/localStorage

**Storage:** `localStorage` key `driller_{cartridgeId}_gameState`

#### Grading Engine (`platform/core/grading-engine.js`, 336 lines)

**Role:** Multi-strategy answer grading with template interpolation.

**Strategies:**

| Strategy | Speed | Input | Mechanism |
|----------|-------|-------|-----------|
| `numeric` | Instant | Number | Tolerance comparison (absolute or relative) |
| `regex` | Instant | Text | Pattern matching with required/forbidden arrays |
| `exact` | Instant | Text | Case-insensitive string equality |
| `ai` | ~2s | Text | Server call to LLM |
| `dual` | ~2s | Text | Regex + AI, take maximum score |

**Key methods:**
- `gradeAnswer(answer, rule, context)` — Route to correct strategy
- `gradeAll(answers, rules, context)` — Grade all fields in parallel
- `gradeNumeric(answer, rule, context)` — `|student - expected| ≤ tolerance`
- `gradeRegex(answer, rule, context)` — Match all → E, 50%+ → P, <50% → I
- `gradeWithAI(answer, rule, context)` — `POST /api/ai/grade`
- `gradeDual(answer, rule, context)` — `max(regex, ai)`
- `evaluateFormula(formula, context)` — Safe math eval for expected values
- `interpolate(template, context)` — `{{variable}}` → value substitution

### 3.3 Input System

**File:** `platform/core/input-renderer.js` (690 lines)

**Supported input types:**

| Type | Renders As | getValue() returns |
|------|-----------|-------------------|
| `textarea` | `<textarea rows="3">` | String |
| `number` | `<input type="number">` + units | Float |
| `text` | `<input type="text">` | String |
| `choice` | Radio buttons (flex) | Selected value string |
| `dropdown` / `select` | `<select>` with placeholder | Selected value string |
| `visual-radical` | RadicalGame widget | `{coefficient, radicand}` |
| `visual-radical-prime` | RadicalPrimeGame | Decomposed form |
| `visual-radical-complex` | RadicalComplexGame | Complex radical |

**Field schema (per input):**
```javascript
{
  id: "fieldId",           // Unique within mode
  type: "textarea",        // Input type
  label: "Question {{var}}", // Supports template interpolation
  hint: "Help text",       // Optional, supports **bold**
  placeholder: "...",      // Default text
  rows: 3,                 // textarea only
  units: "cm",             // number only
  options: ["A", "B"],     // choice/dropdown only
  min: 0, max: 100,        // number only
  step: 0.01               // number only
}
```

**Rendering flow:**
1. Clear container
2. For each field in schema: wrapper div → label → input element → feedback div → hint div
3. Render KaTeX math in labels/hints
4. Attach hint toggle buttons

**Hint system:**
- Toggle button (?) next to each field
- Click → show/hide hint div
- Fires `onHintRequested(fieldId)` callback → GameEngine increments penalty

**Feedback display:**
- Color-coded: E = green, P = yellow, I = red
- Feedback text rendered with KaTeX math support

### 3.4 Graph Engine

**File:** `platform/core/graph-engine.js` (2347 lines)

**Render types:**
- `scatterplot` — Data points with optional regression line, centroid, residuals
- `residual-plot` — Residual vs. x-value plot
- `histogram` — Bar chart with bins
- `boxplot` — 5-number summary
- `normal-curve` — Bell curve with shaded region, z-scores
- `dual-normal-curve` — Two overlapping normal distributions
- `function-curve` — Polynomial/function graph with sign regions

**Canvas rendering stack (bottom → top):**
1. Grid lines
2. Axes with labels
3. Data geometry (points, bars, curves)
4. Regression line (if enabled)
5. Annotations (centroid, residuals, leverage lines)
6. Tooltip (on hover)

**Interactive features:**
- Hover → tooltip with (x, y) values
- Point highlighting
- ResizeObserver → auto-resize on container change
- `animatePointRemoval()` — 2s transition showing regression before/after

**Color palette:**
```javascript
point:     '#6366f1'  // indigo
highlight: '#ef4444'  // red
line:      '#10b981'  // emerald
positive:  '#22c55e'  // green (residuals)
negative:  '#ef4444'  // red
```

### 3.5 Shuffle Bag System

**File:** `platform/core/shuffle-bag.js` (207 lines)

**Problem:** Naive random → streaks of same problem type. Students get frustrated.

**Solution:** Shuffle bag with history tracking.

**Algorithm:**
1. Generate batch of 12 problems (Fisher-Yates shuffle)
2. Pop from end (LIFO)
3. Track last 4 problem signatures (`JSON.stringify(problem.given)`)
4. On draw: skip if signature matches recent history
5. When bag empty → refill with new batch

**ProblemShuffleBag class:**
```javascript
const bag = new ProblemShuffleBag({
  generator: async () => generateProblem(...),
  batchSize: 12,
  historySize: 4
});
const problem = await bag.draw();
```

**One bag per mode** — `platform.getShuffleBag(modeId)` creates/caches.

### 3.6 User System & Identity

**File:** `platform/core/user-system.js` (382 lines)

**Username generation:** `{Fruit}_{Animal}` (e.g., "Apple_Tiger")

**Avatar:** Emoji derived from username (fruit + animal or hash-based)

**Rank system:**

| Rank | Points Required | Formula |
|------|----------------|---------|
| Novice | 0 | — |
| Apprentice | 10 | gold×4 + silver×3 + bronze×2 + tin×1 |
| Analyst | 30 | |
| Statistician | 60 | |
| Expert | 100 | |
| Master | 150 | |
| Legend | 250 | |

**Storage:**
- IndexedDB (primary, via Dexie): tables `meta`, `progress`, `settings`, `sync`
- localStorage fallback if IndexedDB blocked
- Key: `userIdentity` → `{username, realName, password}`

**Key methods:**
- `init()` → Load/migrate identity
- `createUser(username, realName, password)` → Local + server sync
- `verifyUser(username, password)` → Server validation
- `enterTeacherMode(password)` → Enable admin features
- `getMeta(key)` / `setMeta(key, value)` → Arbitrary metadata
- `getStats()` → Aggregate star counts, attempts, perfect runs

### 3.7 Celebration & Sound

**Celebration** (`platform/core/celebration.js`, 336 lines):

| Star | Effects |
|------|---------|
| Gold | Screen flash + 80 confetti particles + toast |
| Silver | Screen flash + 30 confetti + toast |
| Bronze | Screen flash + toast |
| Tin | Toast only |

- `rankUp(name, icon)` — Big celebration with rank announcement
- `showNotification(username, message)` — Slide-in toast (respects mute)
- `streakPulse(element)` — CSS animation on streak counter

**Sound Engine** (`platform/core/sound-engine.js`, 256 lines):
- `playCorrect()`, `playIncorrect()`, `playHint()`
- `playStarEarned(starType)` — Different chime per tier
- `setVolume(0-1)`, `setMute(boolean)`

### 3.8 Sync Queue

**File:** `platform/core/sync-queue.js` (410 lines)

**Problem:** Network failures shouldn't lose student progress.

**Solution:** Persistent retry queue with exponential backoff.

**Flow:**
1. Failed `fetch()` → `enqueue(request)` with `retry_count=0`
2. Wait `BASE_DELAY × 2^retry_count + jitter`
3. Retry on transient errors (5xx, 429, network fail)
4. Max 10 retries
5. Deduplicate: skip if same URL+body seen within 60s

**Storage:** `localStorage` key `driller_syncQueue`

### 3.9 WebSocket Client

**File:** `platform/core/websocket-client.js` (327 lines)

**Message types (received):**

| Type | Purpose |
|------|---------|
| `presence_snapshot` | List of online users |
| `user_online` / `user_offline` | Presence changes |
| `star_earned` | Another student earned a star |
| `leaderboard_update` | Refresh rankings |
| `class_time_start` / `class_time_end` | Teacher session control |
| `teacher_review_*` | Review queue updates |
| `orbits_lobby_*` | Ghost Orbits matchmaking |
| `webrtc_*` | Peer signaling |

**Heartbeat:** Every 30s to keep connection alive.

### 3.10 Time Tracker & Class Time

**Time Tracker** (`platform/core/time-tracker.js`, 329 lines):
- Tracks session start, per-mode time, per-problem solve time
- Syncs to `/api/time-tracking/session` and `/api/time-tracking/problem`

**Class Time** (`platform/core/class-time.js`, 194 lines):
- Teacher-initiated timed sessions with goal announcement
- Broadcasts start/end via WebSocket to all students

---

## 4. Cartridge System

### 4.1 Registry

**File:** `cartridges/registry.json`

```json
{
  "cartridges": [
    {
      "id": "lsrl-interpretation",
      "name": "LSRL Interpretation",
      "subject": "AP Statistics",
      "description": "Practice interpreting slope, intercept, and r",
      "created": "2025-01-15",
      "path": "cartridges/lsrl-interpretation/"
    }
    // ... 16 more entries
  ]
}
```

The platform reads this at startup via `populateCartridgeList()` to build the cartridge dropdown. No manual `app.html` edit needed.

### 4.2 Cartridge Anatomy (4 Files)

Every cartridge is a directory under `cartridges/{id}/` containing:

```
cartridges/{id}/
├── manifest.json          (REQUIRED: configuration, modes, inputs, hints)
├── generator.js           (REQUIRED: problem generation)
├── grading-rules.js       (REQUIRED: answer evaluation)
├── ai-grader-prompt.txt   (OPTIONAL: AI grading template)
├── contexts.json          (OPTIONAL: shared problem data banks)
└── assets/                (OPTIONAL: animation videos)
    ├── ClassName1.mp4
    └── ClassName2.mp4
```

### 4.3 Manifest Schema

```javascript
{
  // === IDENTITY ===
  "meta": {
    "id": "cartridge-id",           // Must match directory name
    "name": "Display Name",         // Shown in dropdown
    "subject": "AP Statistics",     // Grouping key
    "description": "For students",  // Brief summary
    "unit": "5",                    // Optional
    "lesson": "5.1-5.2"             // Optional
  },

  // === CONFIGURATION ===
  "config": {
    "contextsFile": "contexts.json" | null,  // External data bank
    "skills": ["z-scores", "probability"]     // Skill tags
  },

  // === DISPLAY ===
  "display": {
    "showGraph": false,              // Render graph panel?
    "graphType": "scatterplot",      // Graph type (if showGraph)
    "infoPanel": [                   // Context display
      { "label": "Population", "value": "{{population}}" },
      { "label": "Sample size", "value": "n = {{n}}" }
    ],
    "formulaPanel": [...]            // Optional formula reference
  },

  // === MODES (Levels) ===
  "modes": [
    {
      "id": "mode-1",
      "name": "5.1a: Sampling Variability",
      "unlockedBy": "default",       // Available from start
      "animation": "assets/SamplingVariability.mp4",  // Optional
      "celebrationMessage": "Great work!",            // Optional
      "layout": {
        "given": [                   // Read-only display fields
          { "label": "Data", "value": "{{dataDescription}}" }
        ],
        "inputs": [                  // Interactive input fields
          {
            "id": "fieldId",
            "type": "textarea",
            "label": "Explain {{concept}}:",
            "rows": 3,
            "hint": "Think about {{hint}}"
          }
        ]
      }
    },
    {
      "id": "mode-2",
      "name": "5.1b: Z-Scores",
      "unlockedBy": { "gold": 3 },   // Requires 3 gold stars
      "layout": { "inputs": [...] }
    }
  ],

  // === GRADING ===
  "grading": {
    "rubricFile": "grading-rules.js",
    "aiPromptFile": "ai-grader-prompt.txt",
    "scoring": {
      "scale": ["E", "P", "I"],
      "meanings": {
        "E": "Essentially Correct",
        "P": "Partially Correct",
        "I": "Incorrect"
      }
    },
    "tolerances": {                  // Optional global tolerances
      "z-score": 0.05,
      "probability": 0.005
    }
  },

  // === HINTS ===
  "hints": {
    "perField": {
      "fieldId": "Hint: Consider {{formula}}"  // Supports interpolation
    },
    "penalty": {
      "0": "gold",    // 0 hints used → gold star
      "1": "silver",  // 1 hint → silver
      "2": "bronze",  // 2 hints → bronze
      "3": "tin"      // 3+ hints → tin
    }
  },

  // === PROGRESSION ===
  "progression": {
    "streaksPerField": false,        // Track streaks per field?
    "streakFields": ["problem"],     // Which fields count for streak
    "tiers": [
      { "id": "basic", "name": "Level 1", "unlockedBy": "default" },
      { "id": "advanced", "name": "Level 2",
        "unlockedBy": { "gold": 10 },
        "celebrationMessage": "Level 2 Unlocked!" }
    ]
  }
}
```

**Unlock patterns:**
- `"default"` — Available from start
- `{ "gold": N }` — Requires N gold stars total
- `{ "gold": N, "modes": ["mode-a", "mode-b"] }` — Requires gold from specific modes

### 4.4 Generator Contract

```javascript
// cartridges/{id}/generator.js

/**
 * @param {string} modeId - Active mode ID (e.g., "l01-z-score")
 * @param {object|null} context - Random context from contexts.json (or null)
 * @param {object} mode - Mode object from manifest
 * @returns {object} Problem package
 */
export function generateProblem(modeId, context, mode) {
  // Use drawFromBag() for fair distribution
  const scenario = drawFromBag('bankName', scenarioBank);

  return {
    context: {
      // Template variables for {{interpolation}}
      population: "registered voters in Ohio",
      n: 150,
      p: 0.62,
      problemText: "A random sample of...",
      // ...any variables used in manifest labels/hints
    },

    graphConfig: null,  // or { type, points, ... } for graph display

    answers: {
      fieldId: {
        value: 0.0396,        // Expected answer
        formula: "sqrt(p*(1-p)/n)",  // For grading engine eval
        tolerance: 0.005       // Override global tolerance
      }
    },

    scenario: "Scenario text"  // Optional display text
  };
}

// Shuffle bag helper (fair distribution, no near-repeats)
const bags = {};
function drawFromBag(name, source) {
  if (!bags[name] || bags[name].length === 0) {
    bags[name] = [...source].sort(() => Math.random() - 0.5);
  }
  return bags[name].pop();
}
```

### 4.5 Grading Rules Contract

```javascript
// cartridges/{id}/grading-rules.js

/**
 * @param {string} fieldId - Input field being graded
 * @param {string|number} answer - Student's answer
 * @param {object} context - Problem context (includes expected answers)
 * @returns {{ score: 'E'|'P'|'I', feedback: string }}
 */
export function gradeField(fieldId, answer, context) {
  const expected = context[fieldId]?.value;

  // Numeric grading example
  if (fieldId === 'zScore') {
    const diff = Math.abs(parseFloat(answer) - expected);
    if (diff <= 0.05) return { score: 'E', feedback: 'Correct!' };
    if (diff <= 0.15) return { score: 'P', feedback: `Close — expected ${expected}` };
    return { score: 'I', feedback: `Expected ${expected}, got ${answer}` };
  }

  // Regex/keyword grading example
  if (fieldId === 'interpretation') {
    const text = normalize(answer);
    const hasContext = /population|voters|ohio/i.test(text);
    const hasDirection = /increase|decrease|higher|lower/i.test(text);
    const hasUnits = /percent|%|proportion/i.test(text);

    const hits = [hasContext, hasDirection, hasUnits].filter(Boolean).length;
    if (hits === 3) return { score: 'E', feedback: 'Complete interpretation.' };
    if (hits >= 2) return { score: 'P', feedback: 'Missing: ' + getMissing(...) };
    return { score: 'I', feedback: 'Include context, direction, and units.' };
  }
}

// Standard utilities
function normalize(s) { return (s || '').trim().toLowerCase(); }
function isBlank(s) { return !s || !s.trim(); }
function containsAny(text, patterns) {
  return patterns.some(p => new RegExp(p, 'i').test(text));
}
```

### 4.6 AI Grader Prompt Template

```
You are an AP Statistics teacher grading student responses about {{topicName}}.

## Problem Context
{{problemContext}}

## Expected Answers
{{#each expectedAnswers}}
- {{fieldId}}: {{expectedValue}}
{{/each}}

## Student Responses
{{#each studentAnswers}}
- {{fieldId}}: {{studentAnswer}}
{{/each}}

## Grading Scale
- **E** (Essentially Correct): All key elements present with proper context
- **P** (Partially Correct): Some elements present but missing key components
- **I** (Incorrect): Major conceptual errors or completely wrong

## Response Format
Respond with ONLY valid JSON:
{
  "fieldId1": { "score": "E", "feedback": "Explanation..." },
  "fieldId2": { "score": "P", "feedback": "Missing..." }
}
```

### 4.7 Cartridge Inventory

#### AP Statistics (10 cartridges)

| ID | Name | Modes | Animations | Topics |
|----|------|-------|------------|--------|
| `lsrl-interpretation` | LSRL Interpretation | 2 | 0 | Slope/intercept/r in context |
| `lsrl-calculations` | LSRL & Z-Score Calculations | 9 | 0 | Z-scores, slope, intercept, SD, full LSRL |
| `residuals` | Residuals Analysis | 3 | 0 | Calculate, interpret, analyze residuals |
| `leverage-points` | Leverage & Influential Points | 7 | 0 | Leverage, residuals, classify, effects on stats |
| `sampling` | Collecting Data (3.1–3.4) | 10+ | 1 | Sampling methods, bias, scope of inference |
| `apstats-u3l5-experimental-design` | Experimental Design (3.5) | 3 | 0 | Experiments, CRD, block, matched pairs |
| `apstats-u3-l6-7-design-inference` | Design + Inference (3.6–3.7) | 4 | 0 | Blocking, blinding, significance → causation |
| `apstatu4l1l2` | Probability (4.1–4.12) | 20+ | 10+ | Full probability unit |
| `apstats-u5-sampling-dist` | Sampling Distributions (5.1–5.8) | 41 | 40+ | Full sampling distributions unit |
| `apstats-u6-inference-prop` | Inference for Proportions (6.1–6.2) | 10+ | 10+ | Significance tests, confidence intervals |

#### Algebra 2 (6 cartridges)

| ID | Name | Modes | Animations | Topics |
|----|------|-------|------------|--------|
| `algebra2-radicals` | Simplify Radicals | 5 | 0 | Perfect squares, prime factorization, complex |
| `graphing-polynomials` | Graphing Polynomials | 18 | 18 | Degree, end behavior, zeros, turning points |
| `adding-subtracting-polynomials` | Add/Subtract Polynomials | 15 | 0 | Vocabulary, like terms, operations |
| `a2t3l3` | Polynomial Identities & Binomial Theorem | 6 | 6+ | Identities, Pascal's, factoring |
| `a2t3l3-quiz` | 3-3 Quiz Prep | 6 | 6 | Sum/diff of cubes, binomial expansion |
| `a2-dividing-polynomials` | Dividing Polynomials | 6 | 6 | Long division, Remainder Theorem, factoring |

#### Computer Science (1 cartridge)

| ID | Name | Modes | Animations | Topics |
|----|------|-------|------------|--------|
| `mit-6-0001-lec1` | MIT 6.0001 Lecture 1 | 4 | 0 | Computation, algorithms, Python basics |

**Totals: ~165 modes, ~400 input fields, ~70 animations**

### 4.8 Cartridge Loader

**File:** `platform/core/cartridge-loader.js` (284 lines)

**Loading sequence:**
```
populateCartridgeList()          ← Fetch registry.json, build dropdown
  → User selects cartridge
loadCartridgeWithAnimation(id)   ← Show loading overlay
  → loadCartridge(id)
    → platform.loadCartridge(id, progressCallback)
      1. loadJSON('manifest.json')        → Parse config
      2. loadJSON('contexts.json')        → Parse data bank (optional)
      3. loadModule('generator.js')       → Import ES module
      4. loadModule('grading-rules.js')   → Import grading functions
      5. loadText('ai-grader-prompt.txt') → Load AI template (optional)
    → Initialize game engine state
    → Render first problem
  → Hide loading overlay
```

**Progress callback:**
```javascript
onProgress(step, filename, status)
// step: 'manifest' | 'contexts' | 'generator' | 'grading' | 'ai'
// status: 'loading' | 'done' | 'skipped' | 'error'
```

---

## 5. Grading Pipeline

### 5.1 Dual Grading Architecture

```
Student submits answer
        │
        ▼
┌───────────────────┐    ┌──────────────────┐
│  Keyword Grading  │    │   AI Grading     │
│  (instant, local) │    │  (~2s, server)   │
│                   │    │                  │
│  grading-rules.js │    │  Groq or Gemini  │
│  regex/numeric/   │    │  LLM evaluation  │
│  exact match      │    │                  │
└────────┬──────────┘    └────────┬─────────┘
         │                        │
         │  Score A               │  Score B
         │                        │
         └────────┬───────────────┘
                  │
                  ▼
         Final = max(A, B)
         ──────────────────
         AI only UPGRADES
         AI never DOWNGRADES
                  │
                  ▼
         If AI fails → Teacher Review Queue
```

### 5.2 Grading Strategies

| Strategy | Speed | Input | Mechanism | Used For |
|----------|-------|-------|-----------|----------|
| `numeric` | <1ms | Number | `\|student - expected\| ≤ tolerance` | Z-scores, probabilities, calculations |
| `regex` | <1ms | Text | Match required patterns array | Interpretations, explanations |
| `exact` | <1ms | Text | Case-insensitive `===` | Vocabulary, definitions |
| `checkbox` / `choice` | <1ms | Selection | Direct comparison | Multiple choice, true/false |
| `ai` | ~2s | Text | Server → LLM evaluation | Open-ended responses |
| `dual` | ~2s | Text | `max(regex, ai)` | Most text fields |

### 5.3 E/P/I Scoring Scale

| Score | Meaning | Criteria |
|-------|---------|----------|
| **E** | Essentially Correct | All key elements present, proper context/units |
| **P** | Partially Correct | Some elements present, missing key components |
| **I** | Incorrect | Major conceptual errors, blank, or completely wrong |

**Rubric scoring for regex:**
- Match all required patterns → **E**
- Match 50%+ → **P**
- Match <50% → **I**

### 5.4 Star System & Penalties

**Penalties** = hints used + retries on same problem

| Penalties | Star Tier | Points |
|-----------|-----------|--------|
| 0 | Gold | 4 |
| 1 | Silver | 3 |
| 2 | Bronze | 2 |
| 3+ | Tin | 1 |

**Requirement:** ALL fields must score **E** to earn any star. If any field is P or I, no star is awarded.

### 5.5 Scoring Configuration

**File:** `shared/scoring.config.js`

```javascript
// Level multiplier (rewards harder levels)
firstLevel:  0.5×
lastLevel:   3.0×
// Linear interpolation between

// Weighted points formula
weightedPoints = baseGoldPoints × starRatio × levelMultiplier

// Star ratios
gold: 1.0, silver: 0.5, bronze: 0.25, tin: 0.125

// Example: Gold star on level 8/10
// 4 × 1.0 × 2.56 = 10.24 weighted points
```

### 5.6 AI Grading Flow

```
POST /api/ai/grade
{
  scenario: { ...context, computed fields },
  answers: { fieldId: studentAnswer },
  preferProvider: 'gemini' | 'groq' | null,
  aiPromptTemplate: "template from ai-grader-prompt.txt",
  cartridgeId: "apstats-u5-sampling-dist"
}

Server:
  1. Select API key from pool (rotate on rate limit)
  2. Interpolate template with context
  3. Call Groq (primary) or Gemini (fallback)
  4. Parse JSON response
  5. Return { fieldId: {score, feedback}, _provider, _model, _keyId }
```

**Provider details:**

| Provider | Model | Speed | Cost |
|----------|-------|-------|------|
| Groq | `llama-3.3-70b-versatile` | ~1s | Free tier |
| Gemini | `gemini-2.0-flash` | ~2s | Free tier |

**Fallback chain:** Groq → Gemini → Teacher Review Queue

### 5.7 Appeal Mechanism

Students can appeal AI grades they disagree with:

```
POST /api/ai/appeal
{
  scenario, answers, originalGrades,
  appealReason: "Student's argument",
  cartridgeId
}
```

The server re-evaluates with a modified prompt that includes the appeal reason. Response shown in magenta "AI APPEAL REVIEW" panel.

### 5.8 Teacher Review Queue

When AI grading fails or returns uncertain results:

```
POST /api/teacher-review/submit
{
  username, scenario_topic, scenario_context,
  student_answers, expected_answers, keyword_results,
  cartridge_id, cartridge_name, mode_id, field_ids
}

GET /api/teacher-review/pending?cartridgeId=...&status=pending
  → Returns array of review items

POST /api/teacher-review/:id/grade
{
  teacher_grades: { fieldId: { score, feedback } },
  teacher_feedback, teacher_notes, password
}
```

---

## 6. Game Engine & Progression

### 6.1 Tier Progression

Modes are organized into tiers (topics). Each tier unlocks based on gold star accumulation:

```
Tier 1 (default)    →  Tier 2 (3 gold)    →  Tier 3 (10 gold)
├─ mode-1           ├─ mode-3             ├─ mode-5
├─ mode-2           ├─ mode-4             └─ mode-6
└─ (earn 3 gold)    └─ (earn 10 gold)
```

**Unlock check (on every star earned):**
```javascript
for (each locked mode) {
  if (starsPerMode[previousMode].gold >= mode.unlockedBy.gold) {
    unlock(mode);
    emit('tierUnlocked', mode);
    celebrate();
  }
}
```

### 6.2 Streak System

- Consecutive correct answers (all E) increment streak counter
- Any incorrect answer resets streak to 0
- Streak displayed with pulse animation
- Long streaks trigger additional celebration effects

### 6.3 Rank System

Based on total weighted points across all cartridges:

```
Novice (0) → Apprentice (10) → Analyst (30) → Statistician (60)
→ Expert (100) → Master (150) → Legend (250)
```

Rank-up triggers big celebration effect.

### 6.4 Unlock Mechanics

**Teacher overrides** can modify unlock requirements per cartridge:
```
PUT /api/progression-overrides/:cartridgeId/:modeId
{ goldRequired: 1-10, password }
```
Overrides broadcast via WebSocket to all connected students.

---

## 7. Ghost System

### 7.1 Ghost Profiles

**File:** `platform/core/ghost-engine.js` (623 lines)

Each student has a ghost profile per cartridge that evolves as they practice:

```javascript
{
  username: "Apple_Tiger",
  cartridge_id: "apstats-u5-sampling-dist",
  weights: [...],          // Serialized neural network weights
  buffer: [...],           // Experience replay (last 50 interactions)
  total_interactions: 247,
  proficiency_score: 0.73, // 0–1 scale
  color: "orange",         // Derived from proficiency
  opacity: 0.85,           // Derived from interactions
  version: "1.0",
  last_updated: "2026-02-28T..."
}
```

**Color progression:** white → yellow → orange → red → indigo (as proficiency increases)

**Opacity:** 0.1 (new) → 1.0 (experienced) based on interaction count

**Storage:** localStorage `ghost_{username}_{cartridgeId}` + server sync to Supabase

### 7.2 Neural Network Architecture

**File:** `platform/core/ghost-network.js` (157 lines)

```
Input Layer (10 neurons):
  [level, time, streak, accuracy, hints, problems, retries,
   session_accuracy, time_of_day, tier]

Hidden Layer 1: Dense(32, ReLU)
Hidden Layer 2: Dense(16, ReLU)

Output Layer (4 neurons):
  [time_to_answer, correct_probability, hint_probability, quick_answer_probability]
```

**Training:**
- Experience replay buffer (last 50 interactions)
- Batch size: 8
- MSE loss for regression, binary cross-entropy for probabilities
- Trains on each new interaction

**Lazy loading:** TensorFlow.js only loaded when ghost first accessed.

### 7.3 Ghost Battle Engine

**File:** `platform/core/ghost-battle-engine.js`

**Elo rating system:**
```javascript
INITIAL_RATING = 1200
K_FACTOR = 32 (40 for new ghosts < 10 battles)

// Win: Elo += K × (1 - expectedScore)
// Loss: Elo -= K × expectedScore
```

**Battle format:** 10 problems (3 easy, 4 medium, 3 hard). Ghost predicts using neural network. Player vs. ghost comparison on speed and accuracy.

**Lightweight prediction (server-side):**
```javascript
// No TensorFlow needed — simple forward pass
ghostPredict(weights, inputs)
// Architecture: 10 → 16 → 16 → 4 (ReLU activation)
```

### 7.4 3D Maze Visualization

- `ghost-maze-generator.js` (398 lines) — Procedural maze layout
- `ghost-maze-renderer.js` (2068 lines) — Three.js 3D rendering
- `ghost-terrain-renderer.js` — Terrain visualization

Visual feature showing ghost "living" in a 3D maze. Currently present but not central to v4.8 gameplay.

---

## 8. Ghost Orbits — Arcade Game

A full-screen arcade game where players battle their Shadow Self AI in a territory-claiming arena.

### 8.1 Game Modes

| Mode | Players | Duration | Win Condition |
|------|---------|----------|---------------|
| **Arena** (solo) | 1 vs Shadow | 120s | 90% territory |
| **Arena** (multi) | 2–8 players | 150s | 70% territory |
| **Trails** | 1 vs Shadow | 120s | Trail-based territory |
| **Blizzard** | Teams (up to 12) | 150s | First to 15 points |

**Entry cost:** Stars earned in practice (escalating cost per entry)

### 8.2 Physics Engine

**File:** `platform/core/ghost-orbits-physics.js` (615 lines)

```javascript
// Constants
MAX_SPEED:      2.5 px/frame
ACCELERATION:   0.08 px/frame²
FRICTION:       0.92 (dampening per frame)
COLLISION_RADIUS: 10 px
VOID_ZONE_RADIUS: 100 px (safe zone)
RESTITUTION:    0.8 (wall bounce)
```

**Movement states:**
- `FREE_FLIGHT` — Linear movement with acceleration and friction
- `ORBITING` — Circular orbit around a record (safe zone)

**Collision handling:**
- If massA > massB × 1.2 → Absorb (larger eats smaller)
- If massB > massA × 1.2 → Absorb (reverse)
- Otherwise → Elastic collision (bounce off each other)
- Wall bounce with 0.8 restitution

**Energy system:** Depletes with movement/actions, regenerates at 0.02/frame

### 8.3 Territory & Dot System

**Files:**
- `ghost-orbits-territory.js` (924 lines) — Ownership tracking
- `ghost-orbits-dots.js` (654 lines) — Dot lifecycle

**Dot configuration:**
```javascript
{
  totalDots: 50-100,
  spawnPattern: 'grid' | 'random' | 'spiral',
  respawnOnClaim: true,
  respawnDelay: 1000
}
```

**Mechanics:**
- Proximity + spacebar → claim neutral dot
- Spacebar on enemy dot → flip to yours
- Territory % = myDots / totalDots × 100
- Grid-based territory tracking (20px cells)

**Lives system:** 3 lives, 1.5s invulnerability after hit

### 8.4 Shadow AI

**File:** `platform/game/ghost-orbits-shadow-ai.js` (1049 lines)

**Learning mechanics:**
1. Record player position/movement history
2. Detect patterns (chase, dodge, territory camping)
3. Adjust strategy (intercept predicted moves)
4. Generation increases on player loss (Shadow gets smarter)

**Difficulty escalation:**
- Gen 1: Basic pursuit
- Gen 2: Pattern recognition
- Gen 3+: Strategic, unpredictable play

**Elo tracking:** Player and Shadow have separate Elo ratings.

### 8.5 Renderer

**File:** `platform/core/ghost-orbits-renderer.js` (2698 lines)

**Canvas rendering stack (bottom → top):**
1. Dark gradient background
2. Territory grid (colored cells per player)
3. Dots (white = unclaimed, colored = claimed)
4. Trails (player + shadow movement)
5. Player + Shadow circles (with glow effect)
6. Particle effects (dot capture, collision flash)

### 8.6 HUD Panel

**File:** `platform/game/ghost-orbits-panel.js` (2395 lines)

**Displays:**
- Timer (color-coded: normal → warning @60s → danger @30s)
- Round number
- Lives (♥ filled, ♡ empty)
- Dot count progress bars
- Territory distribution bar

**States:** Playing → Eliminated → Round End → Results

### 8.7 Audio System

**File:** `platform/core/ghost-orbits-audio.js` (659 lines)

SFX: dot claim ding, collision thud, life lost zap, round win/lose fanfare, background loop.

### 8.8 Multiplayer System

**Controller:** `platform/game/ghost-orbits-controller.js` (3296 lines)

**Game state machine:**
```
IDLE → CONNECTING → COUNTDOWN → PLAYING ↔ ELIMINATED
                                   ↓
                              ROUND_END → INTERMISSION
```

**Additional files:**
- `arena-mode.js` (1185 lines) — Solo vs Shadow
- `trails-mode.js` (1563 lines) — Trail variant
- `blizzard-mode.js` (981 lines) — Team mode
- `orbits-lobby.js` (1786 lines) — Matchmaking
- `orbits-network-controller.js` (861 lines) — WebSocket coordination

**Multiplayer flow:**
```
Create/Join Room → Lobby (WAITING)
  → All Ready → Countdown (3s)
  → PLAYING (60Hz physics tick, 20Hz state broadcast)
  → Win condition met → ROUND_END
  → Vote rematch → INTERMISSION → next round
```

**Input:** Arrow keys / WASD for movement, Spacebar for ability (dodge/claim)

---

## 9. Animation System

### 9.1 Manim Pipeline

```
1. Write Manim script in animations/ directory
2. Render: manim -qm --format=mp4 {file}.py {SceneName}
3. Copy MP4 to cartridges/{id}/assets/
4. Reference in manifest mode: "animation": "assets/SceneName.mp4"
5. Platform auto-plays video when mode loads
```

**Style conventions:**
- `Text()` for plain text, `MathTex()` for math
- `SurroundingRectangle` for highlighting insights
- Dark background, colorful annotations

### 9.2 Animation Inventory

**28+ Manim scripts** in `animations/` covering:

| Subject | Count | Topics |
|---------|-------|--------|
| AP Stats Unit 4 | ~10 | Probability concepts, random variables |
| AP Stats Unit 5 | ~40 | Sampling distributions, CLT, p-hat, x-bar |
| AP Stats Unit 6 | ~10 | Inference, confidence intervals |
| Algebra 2 | ~18 | Polynomials, identities, division |
| **Total** | **~70+** | |

---

## 10. Server (Railway Backend)

### 10.1 Server Architecture

**File:** `railway-server/server.js` (~3700 lines, single file)

```
Express App
├─ CORS middleware (allow all origins)
├─ JSON body parser (10MB limit)
├─ Supabase client initialization
├─ REST API routes (~40 endpoints)
├─ HTTP Server
├─ WebSocket Server (ws library)
│   ├─ Connection handler
│   ├─ Message dispatcher
│   └─ Heartbeat / stale pruning
├─ Ghost Orbits Arena Manager
└─ Ghost Orbits Multiplayer Manager
```

### 10.2 REST API — Complete Endpoint Map

#### Authentication & Users

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/users` | Create user |
| GET | `/api/users/:username` | Get user profile |
| POST | `/api/users/verify` | Login (username + password) |
| POST | `/api/auth/teacher` | Teacher authentication |

#### Progress & Sync

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/progress` | Record problem attempt (legacy) |
| GET | `/api/progress/:username` | Get all progress (legacy) |
| POST | `/api/progress/cartridge-sync` | Bidirectional cartridge sync |
| GET | `/api/progress/cartridge/:username/:cartridgeId` | Get cartridge progress |

#### Leaderboard

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/leaderboard` | Global rankings |
| GET | `/api/leaderboard/:cartridgeId` | Per-cartridge rankings |
| GET | `/api/leaderboard/class/:period` | Class period rankings |

#### AI Grading

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/grade` | Grade with AI (Groq primary, Gemini fallback) |
| POST | `/api/ai/appeal` | Student appeal of AI grade |
| GET | `/api/ai/status` | Check AI provider availability |
| POST | `/api/ai/keys/contribute` | Contribute API key to pool |

#### Teacher Review

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/teacher-review/submit` | Submit for teacher review |
| GET | `/api/teacher-review/pending` | Get pending reviews |
| POST | `/api/teacher-review/:id/grade` | Teacher grades submission |
| GET | `/api/teacher-review/stats` | Review queue statistics |

#### Time Tracking

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/time-tracking/session` | Upsert session time |
| POST | `/api/time-tracking/problem` | Record problem time |
| GET | `/api/time-tracking/user/:username` | User time summary |
| GET | `/api/time-tracking/class-summary` | Class-wide time summary (teacher) |

#### Roster Management (Teacher)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/roster` | Full class roster |
| PUT | `/api/roster/:username` | Update student info |
| POST | `/api/roster/bulk-assign` | Bulk class period assignment |

#### Progression Overrides (Teacher)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/progression-overrides/:cartridgeId` | Get overrides |
| PUT | `/api/progression-overrides/:cartridgeId/:modeId` | Set override |
| DELETE | `/api/progression-overrides/:cartridgeId/:modeId` | Remove override |
| DELETE | `/api/progression-overrides/:cartridgeId` | Clear all overrides |

#### Ghost Profiles

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ghost/:cartridgeId/sync` | Sync ghost profile |
| GET | `/api/ghost/:cartridgeId/leaderboard` | Ghost leaderboard |
| GET | `/api/ghost/:cartridgeId/:username` | Get ghost profile |

#### Settings & Misc

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Health check |
| GET | `/api/version` | Version info |
| GET/POST | `/api/settings/:username` | User settings |

### 10.3 WebSocket Protocol

**Connection:** `ws://server:PORT/` (upgrades from HTTP)

**Client → Server messages:**

| Type | Payload | Purpose |
|------|---------|---------|
| `identify` | `{username, gameId}` | Authenticate connection |
| `heartbeat` | — | Keep alive (every 30s) |
| `star_earned` | `{username, star_type, scenario_topic}` | Announce star |
| `class_time_start` | `{goal}` | Teacher starts session |
| `class_time_end` | `{stars, goalReached}` | Teacher ends session |
| `webrtc_activate` | — | Teacher enables WebRTC |
| `webrtc_signal` | `{subtype, targetUsername, payload}` | P2P signaling relay |
| `join_arena` | `{cartridgeId, periodId, ghostProfile}` | Enter Ghost Orbits arena |
| `leave_arena` | `{cartridgeId, periodId}` | Leave arena |
| `input` | `{direction: {x,y}, thrust}` | Game input (20Hz) |
| `orbits_create_room` | `{mode}` | Create multiplayer room |
| `orbits_quick_join` | `{mode}` | Auto-matchmake |
| `orbits_join_room` | `{roomCode}` | Join specific room |
| `orbits_ready` | — | Signal ready in lobby |
| `orbits_start` | — | Host starts game |
| `orbits_input` | `{action, timestamp}` | Multiplayer input |
| `orbits_leave` | — | Leave multiplayer room |

**Server → Client messages:**

| Type | Purpose |
|------|---------|
| `presence_snapshot` | Full online user list |
| `user_online` / `user_offline` | Individual presence changes |
| `star_earned` | Broadcast star announcement |
| `leaderboard_update` | Trigger refresh |
| `class_time_start` / `class_time_end` | Session events |
| `progression_override_changed` | Unlock requirement changed |
| `arena_state` | Full Ghost Orbits game state (20Hz) |
| `orbits_room_created` / `orbits_room_joined` | Room events |
| `orbits_snapshot` | Multiplayer game state (20Hz) |

**Stale connection pruning:** Every 60s, terminate connections with no heartbeat for 300s.

### 10.4 AI Provider Integration

**API Key Pool** (`api_keys_pool` table):
- Multiple keys per provider for load distribution
- Rate-limit tracking (`rate_limited_until` timestamp)
- Failure counting with auto-disable
- Community-contributed keys supported

**Provider selection:**
1. Check `preferProvider` parameter
2. Select available key from pool (not rate-limited, not failed)
3. If primary fails → try alternate provider
4. If all fail → enqueue for teacher review

### 10.5 Ghost Orbits Server Managers

#### Arena Manager (`ghost-orbits-manager.js`, 1090 lines)

Server-side physics simulation for single-player Ghost Orbits:

```javascript
ARENA_CONFIG = {
  minArenaSize: 600, maxArenaSize: 1400,
  gridSize: 20,
  tickRate: 20,        // 20Hz physics
  roundDuration: 150000,  // 2.5 minutes
  territoryThreshold: 0.7, // 70% wins
  thrustForce: 0.5, maxVelocity: 8, friction: 0.98
};
```

**Tick loop (50ms):**
1. `processInputs()` → Apply player thrust
2. `updatePhysics(dt)` → Move ghosts, apply friction
3. `updateTrails()` → Add trail segments, expire old ones
4. `checkCollisions()` → Absorption or elastic bounce
5. `updateTerritory()` → Map trails to grid cells
6. `checkEndConditions()` → Territory threshold or last ghost
7. `broadcastState()` → Send to all connected clients

#### Multiplayer Manager (`ghost-orbits-multiplayer-manager.js`)

```javascript
MULTIPLAYER_CONFIG = {
  roomCodeLength: 6,
  maxPlayersPerRoom: 8,
  tickRate: 60,          // 60Hz physics
  snapshotRate: 20,      // 20Hz network sync
  roundDuration: 180000, // 3 minutes
  dotCount: 100,
  initialLives: 3,
  winThreshold: 0.60     // 60% territory
};
```

**Room lifecycle:** LOBBY → COUNTDOWN → PLAYING → ENDED

---

## 11. Database Schema (Supabase)

### Tables

#### `users`
```sql
id              BIGSERIAL PRIMARY KEY
username        TEXT UNIQUE NOT NULL
real_name       TEXT
password        TEXT
user_type       TEXT DEFAULT 'student'   -- 'student' | 'teacher'
class_period    TEXT                     -- 'A'–'G' or NULL
created_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `user_progress` (modern, multi-cartridge)
```sql
id                    BIGSERIAL PRIMARY KEY
username              TEXT NOT NULL
cartridge_id          TEXT NOT NULL
gold_stars            INTEGER DEFAULT 0
silver_stars          INTEGER DEFAULT 0
bronze_stars          INTEGER DEFAULT 0
tin_stars             INTEGER DEFAULT 0
total_weighted_score  NUMERIC DEFAULT 0
mode_progress         JSONB DEFAULT '{}'   -- Per-mode streak data
updated_at            TIMESTAMPTZ DEFAULT NOW()
UNIQUE(username, cartridge_id)
```

#### `lsrl_progress` (legacy, individual attempts)
```sql
id                BIGSERIAL PRIMARY KEY
username          TEXT
scenario_topic    TEXT
slope_score       TEXT            -- 'E' | 'P' | 'I'
intercept_score   TEXT
correlation_score TEXT
hints_used        INTEGER
star_type         TEXT            -- 'gold' | 'silver' | 'bronze' | 'tin' | NULL
all_correct       BOOLEAN
grading_mode      TEXT            -- 'keyword' | 'ai' | 'sync'
ai_provider       TEXT            -- 'groq' | 'gemini' | NULL
level_multiplier  NUMERIC
weighted_points   NUMERIC
cartridge_id      TEXT
mode_id           TEXT
level_index       INTEGER
total_levels      INTEGER
completed_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `teacher_reviews`
```sql
id               BIGSERIAL PRIMARY KEY
username         TEXT
scenario_topic   TEXT
scenario_context JSONB
student_answers  JSONB
expected_answers JSONB
keyword_results  JSONB
cartridge_id     TEXT
cartridge_name   TEXT
mode_id          TEXT
field_ids        TEXT[]
status           TEXT DEFAULT 'pending'  -- 'pending' | 'reviewed'
submitted_at     TIMESTAMPTZ
teacher_grades   JSONB
teacher_feedback TEXT
teacher_notes    TEXT
reviewed_at      TIMESTAMPTZ
```

#### `ghost_profiles`
```sql
id                  BIGSERIAL PRIMARY KEY
username            TEXT
cartridge_id        TEXT
weights             JSONB          -- Neural network weights
buffer              JSONB          -- Experience replay buffer
total_interactions  INTEGER
proficiency_score   NUMERIC        -- 0–1
color               TEXT           -- HSL color string
opacity             NUMERIC
version             TEXT
updated_at          TIMESTAMPTZ DEFAULT NOW()
UNIQUE(username, cartridge_id)
```

#### `time_sessions`
```sql
id             BIGSERIAL PRIMARY KEY
session_id     TEXT UNIQUE
username       TEXT
session_start  TIMESTAMPTZ
active_time_ms BIGINT
total_time_ms  BIGINT
last_sync      TIMESTAMPTZ
is_complete    BOOLEAN DEFAULT FALSE
created_at     TIMESTAMPTZ DEFAULT NOW()
```

#### `time_problems`
```sql
id             BIGSERIAL PRIMARY KEY
session_id     TEXT
username       TEXT
problem_id     TEXT
cartridge_id   TEXT
mode_id        TEXT
active_time_ms BIGINT
total_time_ms  BIGINT
completed      BOOLEAN
result         JSONB
completed_at   TIMESTAMPTZ DEFAULT NOW()
```

#### `api_keys_pool`
```sql
id                 BIGSERIAL PRIMARY KEY
provider           TEXT               -- 'gemini' | 'groq'
api_key            TEXT
contributed_by     TEXT
is_active          BOOLEAN DEFAULT TRUE
rate_limited_until TIMESTAMPTZ
failure_count      INTEGER DEFAULT 0
last_used_at       TIMESTAMPTZ
created_at         TIMESTAMPTZ DEFAULT NOW()
UNIQUE(provider, api_key)
```

#### `progression_overrides`
```sql
id            BIGSERIAL PRIMARY KEY
game_id       TEXT DEFAULT 'default'
cartridge_id  TEXT
mode_id       TEXT
gold_required INTEGER        -- 1–10
updated_by    TEXT
updated_at    TIMESTAMPTZ
UNIQUE(game_id, cartridge_id, mode_id)
```

---

## 12. State Persistence

### 12.1 localStorage Keys

| Key Pattern | Component | Data |
|-------------|-----------|------|
| `driller_{cartridgeId}_gameState` | GameEngine | Full progression state |
| `ghost_{username}_{cartridgeId}` | GhostEngine | Neural network profile |
| `driller_syncQueue` | SyncQueue | Pending retry requests |
| `driller_notifications_muted` | Celebration | Boolean mute preference |
| `userIdentity` | UserSystem | `{username, realName, password}` |

### 12.2 IndexedDB (Dexie)

**Database:** `driller_user_db`
**Tables:** `meta`, `progress`, `settings`, `sync`
**Fallback:** localStorage if IndexedDB blocked (private browsing)

### 12.3 Server Sync

**Bidirectional sync** via `/api/progress/cartridge-sync`:

```javascript
// Client sends:
{
  username, cartridgeId,
  clientState: { starCounts, starsPerMode, unlockedModes },
  updated_at: "ISO timestamp"
}

// Server compares timestamps:
if (client.updated_at > server.updated_at) → use client state
if (server.updated_at > client.updated_at) → return server state
if (equal) → no-op
```

**Sync triggers:**
- On star earned
- On cartridge load (restore progress)
- On reconnect after offline period
- Failed syncs → SyncQueue (exponential backoff)

---

## 13. Build, Deploy & Infrastructure

### 13.1 Development

```bash
npm install            # Install dependencies
npm run dev            # Vite dev server → http://localhost:5173/platform/app.html
npm test               # Run all tests (vitest)
npm run build          # Production build → dist/
```

**Railway server (separate):**
```bash
cd railway-server
npm install
node server.js         # Starts on PORT (default 3000)
```

### 13.2 Production Deployment

```
GitHub Repository
    │
    ├──push──→ Vercel (auto-deploy)
    │          ├─ npm install
    │          ├─ npm run build
    │          └─ Serve dist/ at https://[project].vercel.app
    │
    └──push──→ Railway (auto-deploy)
               ├─ cd railway-server && npm install
               ├─ node server.js
               └─ HTTP + WebSocket at https://[project].up.railway.app
```

### 13.3 Environment Variables

**Railway Server:**
```
SUPABASE_URL              # https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY  # Bypasses RLS for server writes
GEMINI_API_KEY             # AIza... (optional, pool supplemented)
GROQ_API_KEY               # gsk_... (optional, pool supplemented)
TEACHER_PASSWORD           # Default: 'stats123'
PORT                       # Default: 3000
```

**Vercel Frontend:**
```
VITE_API_URL              # https://[railway-url].up.railway.app
```

### 13.4 External Dependencies

| Library | Loaded Via | Purpose |
|---------|-----------|---------|
| **KaTeX** | CDN | Math rendering ($...$, $$...$$) |
| **TensorFlow.js** | Lazy CDN | Neural network for ghost system |
| **Three.js** | npm | 3D maze visualization |
| **Dexie** | npm | IndexedDB wrapper |
| **Vite** | npm (dev) | Build tool / dev server |
| **Vitest** | npm (dev) | Test framework |
| **Express** | npm (server) | HTTP framework |
| **ws** | npm (server) | WebSocket library |
| **@supabase/supabase-js** | npm (server) | Database client |

---

## 14. Testing

### 14.1 Test Structure

```
tests/
├── core/                          # Platform engine tests
│   ├── game-engine.test.js
│   ├── grading-engine.test.js
│   ├── graph-engine.test.js
│   ├── input-renderer.test.js
│   ├── shuffle-bag.test.js
│   ├── celebration.test.js
│   ├── ghost-engine.test.js
│   ├── ghost-battle.test.js
│   └── ghost-orbits-*.test.js     # Multiple game tests
│
├── grading/                       # Cartridge grading rules
│   ├── lsrl-interpretation.test.js
│   ├── lsrl-calculations.test.js
│   ├── residuals.test.js
│   ├── leverage-points.test.js
│   ├── sampling.test.js
│   ├── apstats-u3l5.test.js
│   ├── apstats-u3-l6-7.test.js
│   ├── apstatu4l1l2.test.js
│   ├── apstats-u5-sampling-dist.test.js
│   ├── apstats-u6-inference-prop.test.js
│   ├── algebra2-radicals.test.js
│   ├── graphing-polynomials.test.js
│   ├── adding-subtracting-polynomials.test.js
│   ├── a2t3l3.test.js
│   ├── a2t3l3-quiz.test.js
│   ├── a2-dividing-polynomials.test.js
│   └── mit-6-0001-lec1.test.js
│
├── server/                        # API endpoint tests
│   ├── ai-grading-v2.0.1.test.js
│   ├── progress-sync.test.js
│   ├── teacher-review.test.js
│   └── websocket.test.js
│
└── animations/                    # Manim script validation
    └── animation-manifest.test.js
```

**Total test cases:** ~1,924

### 14.2 Test Patterns

**Grading tests** (majority of suite):
```javascript
describe('fieldId grading', () => {
  it('grades correct answer as E', () => {
    const result = gradeField('fieldId', correctAnswer, context);
    expect(result.score).toBe('E');
  });

  it('grades partial answer as P', () => {
    const result = gradeField('fieldId', partialAnswer, context);
    expect(result.score).toBe('P');
  });

  it('grades incorrect answer as I with feedback', () => {
    const result = gradeField('fieldId', wrongAnswer, context);
    expect(result.score).toBe('I');
    expect(result.feedback).toContain('expected');
  });
});
```

**Server tests:** Validate response structures, model info, provider metadata.

### 14.3 Coverage Map

| Component | Test File(s) | Cases |
|-----------|-------------|-------|
| 17 cartridge grading rules | 17 files | ~1,500 |
| Core engines | ~10 files | ~300 |
| Server API | ~4 files | ~80 |
| Animations | 1 file | ~44 |

---

## 15. Documentation Index

| File | Purpose |
|------|---------|
| `CLAUDE.md` (root) | Project overview, commands, architecture |
| `CLAUDE.md` (railway-server/) | Server setup, CLI commands |
| `CARTRIDGE-DEVELOPMENT-GUIDE.md` | Complete cartridge creation walkthrough |
| `CARTRIDGE-GENERATION-PROMPT.md` | AI prompt for generating cartridges |
| `CARTRIDGE-HANDOFF-SPEC.md` | Spec for student handoff |
| `CARTRIDGE-TEMPLATE.md` | Template structure reference |
| `DESIGN_MULTIPLAYER.md` | Multiplayer architecture design |
| `KNOWN_ISSUES.md` | Bug tracking |
| `TUNING.md` | Performance tuning parameters |
| `ghost-system-spec.md` | Ghost AI design document |
| `docs/STATE_MACHINES.md` | 142 sections covering all state transitions |
| `docs/TELEMETRY.md` | Logging & analytics |
| `docs/SYSTEM-SPEC.md` | **This document** |

---

## 16. State Machines Reference

The full state machine documentation lives in `docs/STATE_MACHINES.md` (231 H2+ sections, v4.8.0).

**Key state machines:**

| Component | States | Trigger |
|-----------|--------|---------|
| **Game Engine** | idle → loading → active → grading → feedback → next | User actions |
| **Cartridge Loader** | unloaded → loading → ready → error | loadCartridge() |
| **Grading Engine** | idle → keyword → ai → merging → complete | Submit answer |
| **Ghost Orbits** | IDLE → CONNECTING → COUNTDOWN → PLAYING → ROUND_END → INTERMISSION | Game events |
| **Multiplayer Room** | LOBBY → COUNTDOWN → PLAYING → ENDED | Room events |
| **Sync Queue** | idle → processing → retrying → failed | Network events |
| **WebSocket** | disconnected → connecting → connected → identified | connect() |

---

## 17. Data Flow Diagrams

### Problem Lifecycle

```
┌─────────────────┐
│ User selects     │
│ cartridge + mode │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│ ShuffleBag.draw()│────▶│ generator.js          │
│ (fair selection) │     │ generateProblem()     │
└─────────────────┘     │ → context, answers,   │
                        │   graphConfig          │
                        └───────────┬────────────┘
                                    │
         ┌──────────────────────────┼────────────────────┐
         ▼                          ▼                      ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ InputRenderer    │  │ GraphEngine       │  │ Animation Player │
│ render(schema,   │  │ render(config)    │  │ play(mp4)        │
│   context)       │  │                   │  │                  │
└────────┬────────┘  └──────────────────┘  └──────────────────┘
         │
         │ Student types answers
         │
         ▼
┌─────────────────┐
│ Submit clicked   │
│ getAllValues()    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│Keyword │ │ AI Grade │
│grading │ │ (server) │
│(local) │ │          │
└───┬────┘ └────┬─────┘
    │           │
    └─────┬─────┘
          ▼
   max(keyword, AI)
          │
          ▼
┌─────────────────┐
│onGradingComplete│
│  1. Award star  │
│  2. Celebrate   │
│  3. Sync server │
│  4. Train ghost │
│  5. Check unlock│
│  6. Broadcast   │
└─────────────────┘
```

### Star → Unlock → Progression

```
All fields E + 0 penalties
        │
        ▼
  Award Gold Star
        │
        ├──▶ starCounts.gold++
        ├──▶ starsPerMode[mode].gold++
        ├──▶ Celebration effects
        ├──▶ Sync to server
        ├──▶ Broadcast via WebSocket
        │
        ▼
  checkUnlocks()
        │
        ▼
  For each locked mode:
    if (previousMode.gold >= mode.unlockedBy.gold)
        │
        ▼
    Unlock mode
    Emit 'tierUnlocked'
    Celebration (rank up if threshold)
```

### Server Sync Flow

```
Client                           Server                        Supabase
  │                                │                              │
  │  POST /progress/cartridge-sync │                              │
  │  { clientState, updated_at }   │                              │
  │──────────────────────────────▶│                              │
  │                                │  SELECT * FROM user_progress │
  │                                │──────────────────────────────▶│
  │                                │◀──────────────────────────────│
  │                                │                              │
  │                                │  Compare timestamps          │
  │                                │                              │
  │                   ┌────────────┤  client newer?               │
  │                   │            │──────────────────────────────▶│
  │                   │ UPSERT     │         Supabase UPDATE      │
  │                   │            │◀──────────────────────────────│
  │                   │            │                              │
  │                   │────────────┤  server newer?               │
  │  { serverState }  │            │                              │
  │◀──────────────────┤            │                              │
  │                                │                              │
  │  Update localStorage           │                              │
```

---

## 18. File Tree

```
lrsl-driller/
├── CLAUDE.md                              # Project instructions
├── CARTRIDGE-DEVELOPMENT-GUIDE.md         # Cartridge creation guide
├── CARTRIDGE-GENERATION-PROMPT.md         # AI generation prompt
├── CARTRIDGE-HANDOFF-SPEC.md              # Handoff spec
├── CARTRIDGE-TEMPLATE.md                  # Template reference
├── DESIGN_MULTIPLAYER.md                  # Multiplayer design
├── KNOWN_ISSUES.md                        # Bug tracker
├── TUNING.md                              # Performance tuning
├── ghost-system-spec.md                   # Ghost AI spec
├── index.html                             # Legacy entry (file://)
├── package.json                           # Dependencies + scripts
├── vite.config.js                         # Build configuration
├── vitest.config.js                       # Test configuration
├── vercel.json                            # Deployment config
│
├── platform/                              # CONSOLE (topic-agnostic)
│   ├── app.html                           # Main orchestrator (~5500 LOC)
│   ├── demo.html                          # Component demo
│   ├── game-test.html                     # Ghost Orbits test
│   ├── teacher-map.html                   # Teacher admin
│   │
│   ├── core/                              # Engine modules
│   │   ├── game-engine.js                 # Progression state machine
│   │   ├── grading-engine.js              # Multi-strategy grading
│   │   ├── input-renderer.js              # Form field generation
│   │   ├── graph-engine.js                # Canvas visualization
│   │   ├── cartridge-loader.js            # Dynamic cartridge loading
│   │   ├── shuffle-bag.js                 # Fair randomization
│   │   ├── user-system.js                 # Identity + ranks
│   │   ├── sound-engine.js                # Audio effects
│   │   ├── celebration.js                 # Visual effects
│   │   ├── ai-feedback-panel.js           # AI grading display
│   │   ├── sync-queue.js                  # Retry queue
│   │   ├── websocket-client.js            # Real-time client
│   │   ├── time-tracker.js                # Session timing
│   │   ├── class-time.js                  # Teacher sessions
│   │   │
│   │   ├── ghost-engine.js                # Ghost AI orchestrator
│   │   ├── ghost-network.js               # TF.js neural network
│   │   ├── ghost-battle-engine.js         # Ghost battles + Elo
│   │   ├── ghost-battle-viz.js            # Battle UI
│   │   ├── ghost-maze-generator.js        # 3D maze layout
│   │   ├── ghost-maze-renderer.js         # Three.js rendering
│   │   ├── ghost-terrain-renderer.js      # Terrain viz
│   │   │
│   │   ├── ghost-orbits-physics.js        # Game physics
│   │   ├── ghost-orbits-renderer.js       # Game canvas rendering
│   │   ├── ghost-orbits-territory.js      # Territory tracking
│   │   ├── ghost-orbits-dots.js           # Dot lifecycle
│   │   ├── ghost-orbits-audio.js          # Game SFX
│   │   ├── ghost-orbits-nn-mapper.js      # Profile → NPC mapping
│   │   │
│   │   ├── radical-game.js                # Visual radical input
│   │   ├── radical-prime-game.js          # Prime factorization
│   │   ├── radical-complex-game.js        # Complex radicals
│   │   └── radical-visualizer.js          # Radical display
│   │
│   └── game/                              # Ghost Orbits game modes
│       ├── ghost-orbits-controller.js     # Main game controller
│       ├── ghost-orbits-panel.js          # HUD overlay
│       ├── ghost-orbits-shadow-ai.js      # Shadow opponent AI
│       ├── arena-mode.js                  # Solo vs Shadow
│       ├── trails-mode.js                 # Trail variant
│       ├── blizzard-mode.js               # Team mode
│       ├── orbits-lobby.js                # Matchmaking
│       └── orbits-network-controller.js   # Multiplayer WebSocket
│
├── cartridges/                            # CARTRIDGES (lessons)
│   ├── registry.json                      # Cartridge index
│   ├── _template/                         # Reference template
│   │
│   ├── lsrl-interpretation/               # AP Stats: LSRL
│   ├── lsrl-calculations/                 # AP Stats: LSRL Calcs
│   ├── residuals/                         # AP Stats: Residuals
│   ├── leverage-points/                   # AP Stats: Leverage
│   ├── sampling/                          # AP Stats: Data Collection
│   ├── apstats-u3l5-experimental-design/  # AP Stats: Experiments
│   ├── apstats-u3-l6-7-design-inference/  # AP Stats: Design+Inference
│   ├── apstatu4l1l2/                      # AP Stats: Probability
│   ├── apstats-u5-sampling-dist/          # AP Stats: Sampling Dists
│   ├── apstats-u6-inference-prop/         # AP Stats: Inference
│   │
│   ├── algebra2-radicals/                 # Algebra 2: Radicals
│   ├── graphing-polynomials/              # Algebra 2: Graphing
│   ├── adding-subtracting-polynomials/    # Algebra 2: Add/Sub Polys
│   ├── a2t3l3/                            # Algebra 2: Identities
│   ├── a2t3l3-quiz/                       # Algebra 2: Quiz Prep
│   ├── a2-dividing-polynomials/           # Algebra 2: Division
│   │
│   └── mit-6-0001-lec1/                   # CS: MIT 6.0001
│
├── shared/                                # Shared modules
│   └── scoring.config.js                  # Star scoring formulas
│
├── animations/                            # Manim source scripts
│   ├── apstats_u4_*.py                    # Unit 4 animations
│   ├── apstats_u5_*.py                    # Unit 5 animations
│   ├── apstats_u6_*.py                    # Unit 6 animations
│   ├── a2_*.py                            # Algebra 2 animations
│   └── ... (~28 scripts)
│
├── railway-server/                        # BACKEND
│   ├── server.js                          # Express + WebSocket (~3700 LOC)
│   ├── ghost-orbits-manager.js            # Arena physics (1090 LOC)
│   ├── ghost-orbits-multiplayer-manager.js # Multiplayer rooms
│   ├── package.json                       # Server dependencies
│   └── CLAUDE.md                          # Server instructions
│
├── tests/                                 # TEST SUITE (~1,924 cases)
│   ├── core/                              # Engine tests
│   ├── grading/                           # Cartridge grading tests
│   ├── server/                            # API tests
│   └── animations/                        # Animation validation
│
├── docs/                                  # DOCUMENTATION
│   ├── STATE_MACHINES.md                  # 142 state machine sections
│   ├── TELEMETRY.md                       # Logging spec
│   └── SYSTEM-SPEC.md                     # THIS DOCUMENT
│
└── standalone/                            # Standalone tools
    └── math-viz/
        └── index.html                     # Math visualization
```

---

*End of specification. This document maps the complete LRSL-Driller system as of v4.8.0.*
