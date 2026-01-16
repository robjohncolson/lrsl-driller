# Cartridge State Machine Diagram

This document describes the complete lifecycle and state transitions for a Driller Platform cartridge. Use this to ensure your cartridge is compliant with the platform's expectations.

---

## 1. CARTRIDGE LOADING STATE MACHINE

```
                         ┌────────────────────────────────────────────────────────┐
                         │               PLATFORM INITIALIZATION                   │
                         │              (app.html loadCartridge())                 │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │           CARTRIDGE DISCOVERY                           │
                         │  1. Check registry.json for cartridge list             │
                         │  2. User selects cartridge from dropdown               │
                         │  3. Platform fetches: cartridges/{id}/manifest.json    │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
              ┌─────────────────────┐                         ┌─────────────────────┐
              │   MANIFEST VALID    │                         │  MANIFEST INVALID   │
              │  (JSON parses OK)   │                         │  (syntax/structure) │
              └──────────┬──────────┘                         └──────────┬──────────┘
                         │                                               │
                         │                                               ▼
                         │                                    ┌─────────────────────┐
                         │                                    │   LOAD FAILS        │
                         │                                    │  Console error      │
                         │                                    │  Fallback UI shown  │
                         │                                    └─────────────────────┘
                         ▼
              ┌────────────────────────────────────────────────────────┐
              │              DYNAMIC MODULE LOADING                    │
              │  1. import(`cartridges/${id}/generator.js`)           │
              │  2. import(`cartridges/${id}/grading-rules.js`)       │
              │  3. fetch(`cartridges/${id}/ai-grader-prompt.txt`)    │
              │  4. (optional) fetch(`cartridges/${id}/contexts.json`)│
              └───────────────────────┬────────────────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                        ▼                           ▼
              ┌─────────────────────┐     ┌─────────────────────┐
              │   MODULES LOADED    │     │   MODULE ERROR      │
              │   All exports found │     │  (missing function) │
              └──────────┬──────────┘     └──────────┬──────────┘
                         │                           │
                         │                           ▼
                         │                 ┌─────────────────────┐
                         │                 │   LOAD FAILS        │
                         │                 │  "generateProblem   │
                         │                 │   not found"        │
                         │                 └─────────────────────┘
                         ▼
              ┌────────────────────────────────────────────────────────┐
              │                 CARTRIDGE ACTIVE                        │
              │  • manifest stored in currentManifest                  │
              │  • generator.generateProblem() callable                │
              │  • gradingRules.gradeField() callable                  │
              │  • AI prompt template loaded (if exists)               │
              │  • Mode tabs rendered                                   │
              │  • Game engine initialized with progression config     │
              └────────────────────────────────────────────────────────┘
```

---

## 2. PROBLEM GENERATION STATE MACHINE

```
                         ┌────────────────────────────────────────────────────────┐
                         │              PROBLEM GENERATION TRIGGER                 │
                         │  • Initial load of mode                                 │
                         │  • "Try Again" clicked                                  │
                         │  • "Skip" clicked                                       │
                         │  • Star earned → next problem                          │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │              SELECT CONTEXT (if applicable)             │
                         │  1. Load contexts.json (if specified in manifest)      │
                         │  2. ShuffleBag draws from context pool                 │
                         │  3. No immediate repeats (batch=12, history=4)         │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │               CALL generateProblem()                    │
                         │                                                        │
                         │  Input:                                                │
                         │    modeId  - current mode from manifest                │
                         │    context - random context or null                    │
                         │    mode    - mode config object from manifest          │
                         │                                                        │
                         │  Output: {                                             │
                         │    context: { ...variables for templates },            │
                         │    graphConfig: { type, points, labels } | null,       │
                         │    answers: { fieldId: { value, tolerance? } },        │
                         │    scenario: "Problem text for display"                │
                         │  }                                                     │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │              TEMPLATE INTERPOLATION                     │
                         │  Replace {{variableName}} in:                          │
                         │    • Input labels                                      │
                         │    • Hint text                                         │
                         │    • Info panel values                                 │
                         │    • Dropdown options (dynamic)                        │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │                RENDER UI                                │
                         │  1. Info panel with interpolated values                │
                         │  2. Graph (if showGraph: true)                         │
                         │  3. Input fields from mode.layout.inputs               │
                         │  4. Hint buttons enabled                               │
                         │  5. Submit button ready                                │
                         └────────────────────────────────────────────────────────┘
```

---

## 3. GRADING PIPELINE STATE MACHINE

```
                         ┌────────────────────────────────────────────────────────┐
                         │                STUDENT SUBMITS ANSWER                   │
                         │              (Submit button clicked)                    │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │            COLLECT FIELD VALUES                         │
                         │  For each input in mode.layout.inputs:                 │
                         │    { fieldId: studentAnswer }                          │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
              ┌────────────────────────────────────────────────────────────────────┐
              │                      DUAL GRADING PIPELINE                          │
              │                                                                    │
              │  ┌─────────────────────────────────────────────────────────────┐  │
              │  │             PHASE 1: KEYWORD GRADING (sync)                 │  │
              │  │                                                             │  │
              │  │  Call gradeField(fieldId, answer, context) for each field  │  │
              │  │                                                             │  │
              │  │  Returns: { score: 'E'|'P'|'I', feedback: "..." }          │  │
              │  └─────────────────────────────────────────────────────────────┘  │
              │                              │                                     │
              │                              ▼                                     │
              │  ┌─────────────────────────────────────────────────────────────┐  │
              │  │            PHASE 2: AI GRADING (async, if enabled)          │  │
              │  │                                                             │  │
              │  │  1. Build prompt from ai-grader-prompt.txt template        │  │
              │  │  2. Replace {{placeholders}} with context values           │  │
              │  │     • {{studentAnswer}} or {{STUDENT_ANSWER}}              │  │
              │  │     • {{expectedAnswer}}                                   │  │
              │  │     • {{fieldId}}, {{levelName}}, etc.                     │  │
              │  │  3. Send to server: POST /api/ai/grade                     │  │
              │  │  4. Server tries: Groq → Gemini → fallback to keywords     │  │
              │  │  5. Returns: { score, feedback, _provider, _model }        │  │
              │  └─────────────────────────────────────────────────────────────┘  │
              │                              │                                     │
              │                              ▼                                     │
              │  ┌─────────────────────────────────────────────────────────────┐  │
              │  │               SCORE RECONCILIATION                          │  │
              │  │                                                             │  │
              │  │  finalScore = max(keywordScore, aiScore)                   │  │
              │  │    where E > P > I                                          │  │
              │  │                                                             │  │
              │  │  AI can UPGRADE keyword score but never DOWNGRADE          │  │
              │  │  Metadata: _bestOf: 'ai' | 'keywords'                       │  │
              │  └─────────────────────────────────────────────────────────────┘  │
              └───────────────────────────────────┬────────────────────────────────┘
                                                  │
                                                  ▼
                         ┌────────────────────────────────────────────────────────┐
                         │                GRADING RESULT                           │
                         │                                                        │
                         │  Per-field results: { fieldId: { score, feedback } }   │
                         │  Overall: ALL fields must be 'E' for star              │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
              ┌─────────────────────┐                         ┌─────────────────────┐
              │   ALL FIELDS = 'E'  │                         │   ANY FIELD != 'E'  │
              │                     │                         │                     │
              │  → Star earned      │                         │  → No star          │
              │  → Streak++         │                         │  → Streak = 0       │
              │  → Check tier unlock│                         │  → Show feedback    │
              └─────────────────────┘                         └─────────────────────┘
```

---

## 4. STAR AWARD STATE MACHINE

```
                         ┌────────────────────────────────────────────────────────┐
                         │             ALL FIELDS GRADED 'E'                       │
                         │           (Essentially Correct)                         │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │            CALCULATE PENALTY COUNT                      │
                         │                                                        │
                         │  penalties = hints_used + retry_count                  │
                         │  (Both count equally toward star tier)                 │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
         ┌─────────────────────┬─────────────────┼─────────────────┬──────────────┐
         │                     │                 │                 │              │
         ▼                     ▼                 ▼                 ▼              │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    penalties=0  │  │    penalties=1  │  │    penalties=2  │  │   penalties≥3   │
│                 │  │                 │  │                 │  │                 │
│    GOLD ★★★★    │  │   SILVER ★★★    │  │   BRONZE ★★     │  │     TIN ★       │
│    4 base pts   │  │   3 base pts    │  │   2 base pts    │  │    1 base pt    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │                    │
         └────────────────────┴────────────────────┴────────────────────┘
                                         │
                                         ▼
                         ┌────────────────────────────────────────────────────────┐
                         │           APPLY LEVEL MULTIPLIER                        │
                         │                                                        │
                         │  Levels 1-10 have multipliers:                         │
                         │    L1-L2: 0.5x  │  L3-L4: 0.75x  │  L5-L6: 1.0x       │
                         │    L7-L8: 1.5x  │  L9: 2.0x      │  L10+: 3.0x        │
                         │                                                        │
                         │  finalPoints = max(1, floor(basePts × multiplier))     │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │              UPDATE GAME STATE                          │
                         │                                                        │
                         │  1. starCounts[tier]++                                 │
                         │  2. streak++                                           │
                         │  3. Save to localStorage: {cartridgeId}_stars          │
                         │  4. Sync to server: POST /api/progress/cartridge-sync  │
                         │  5. Award points to Grid Wars (if playing)             │
                         │  6. Check tier unlocks                                 │
                         │  7. Show celebration animation                         │
                         └────────────────────────────────────────────────────────┘
```

---

## 5. PROGRESSION & MODE UNLOCK STATE MACHINE

```
                         ┌────────────────────────────────────────────────────────┐
                         │              MODE TAB RENDERING                         │
                         │         (renderModeTabs() in app.html)                 │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │          FOR EACH MODE IN manifest.modes               │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                         ┌────────────────────────────────────────────────────────┐
                         │            CHECK unlockedBy CONDITION                   │
                         │                                                        │
                         │  mode.unlockedBy can be:                               │
                         │    • "default" → always unlocked                       │
                         │    • { "gold": N } → requires N gold stars             │
                         │    • (Teacher override may change requirement)         │
                         └───────────────────────┬────────────────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
              ┌─────────────────────┐                         ┌─────────────────────┐
              │    MODE UNLOCKED    │                         │    MODE LOCKED      │
              │                     │                         │                     │
              │  • Tab clickable    │                         │  • Tab grayed out   │
              │  • Normal styling   │                         │  • Shows 🔒 icon    │
              │                     │                         │  • Tooltip: "Need   │
              │                     │                         │    N gold stars"    │
              └──────────┬──────────┘                         └──────────┬──────────┘
                         │                                               │
                         │                   ┌───────────────────────────┘
                         │                   │
                         │                   ▼
                         │         ┌─────────────────────┐
                         │         │  TEACHER BYPASS     │
                         │         │  (v3.2.1)           │
                         │         │                     │
                         │         │  If isTeacher:      │
                         │         │  • Mode accessible  │
                         │         │  • Shows 🔑 icon    │
                         │         │  • "Teacher access" │
                         │         └─────────────────────┘
                         │
                         ▼
              ┌────────────────────────────────────────────────────────┐
              │                TIER UNLOCK EVENT                        │
              │                                                        │
              │  When goldStars >= mode.unlockedBy.gold:               │
              │    1. Play unlock sound                                │
              │    2. Show celebration modal                           │
              │    3. Display tier.celebrationMessage                  │
              │    4. Update tab styling                               │
              │    5. WebSocket broadcast: tier_unlocked               │
              └────────────────────────────────────────────────────────┘
```

---

## 6. HINT SYSTEM STATE MACHINE

```
              ┌────────────────────────────────────────────────────────┐
              │                  HINT REQUEST                          │
              │               (Student clicks hint)                    │
              └───────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
              ┌────────────────────────────────────────────────────────┐
              │           LOOKUP HINT IN MANIFEST                      │
              │                                                        │
              │  manifest.hints.perField[fieldId]                      │
              │    → Template string with {{variables}}                │
              └───────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
              ┌────────────────────────────────────────────────────────┐
              │           INTERPOLATE TEMPLATE                         │
              │                                                        │
              │  Replace {{variableName}} with context values          │
              │  e.g., "Simplify √{{radicand}}" → "Simplify √72"      │
              └───────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
              ┌────────────────────────────────────────────────────────┐
              │            INCREMENT PENALTY COUNTER                   │
              │                                                        │
              │  hintsUsed++                                           │
              │  (Affects star tier: 0→gold, 1→silver, 2→bronze, 3+→tin)│
              └───────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
              ┌────────────────────────────────────────────────────────┐
              │               DISPLAY HINT                             │
              │                                                        │
              │  • Show hint text below input field                    │
              │  • Hint button becomes disabled                        │
              │  • Star tier indicator updates                         │
              └────────────────────────────────────────────────────────┘
```

---

## 7. INPUT TYPES STATE MACHINE

```
              ┌────────────────────────────────────────────────────────┐
              │           INPUT RENDERER RECEIVES CONFIG               │
              │              (from mode.layout.inputs[])               │
              └───────────────────────┬────────────────────────────────┘
                                      │
      ┌───────────────┬───────────────┼───────────────┬───────────────┬───────────────┐
      │               │               │               │               │               │
      ▼               ▼               ▼               ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ textarea  │   │   text    │   │  number   │   │ dropdown  │   │  choice   │   │  visual   │
│           │   │           │   │           │   │           │   │           │   │           │
│ Multi-line│   │ Single    │   │ Numeric   │   │ <select>  │   │ Radio     │   │ Custom    │
│ text box  │   │ line text │   │ with step │   │ menu      │   │ buttons   │   │ component │
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │               │               │
      │               │               │               │               │               │
      └───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
                                      │
                                      ▼
              ┌────────────────────────────────────────────────────────┐
              │              COMMON INPUT PROPERTIES                   │
              │                                                        │
              │  id: string        - Field identifier for grading      │
              │  type: string      - One of the above types            │
              │  label: string     - Display label (supports {{vars}}) │
              │  placeholder?: str - Placeholder text                  │
              │  options?: array   - For dropdown/choice ({{vars}} OK) │
              │  rows?: number     - For textarea                      │
              │  min/max/step?     - For number inputs                 │
              └────────────────────────────────────────────────────────┘
```

---

## 8. AI FEEDBACK PANEL STATE MACHINE (v2.0.1+)

```
              ┌────────────────────────────────────────────────────────┐
              │           AI GRADING COMPLETES                         │
              │    (Response includes _provider, _model, _aiScore)     │
              └───────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
              ┌────────────────────────────────────────────────────────┐
              │           AI FEEDBACK PANEL UPDATES                    │
              │                                                        │
              │  Displays:                                             │
              │  • Provider: Groq / Gemini                            │
              │  • Model: llama-3.3-70b / gemini-2.0-flash            │
              │  • AI Score: E / P / I                                 │
              │  • Feedback text from AI                               │
              │  • Agreement: "AI agreed with keywords" or             │
              │               "AI upgraded to E (keywords gave P)"    │
              └───────────────────────┬────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
    ┌─────────────────────┐                       ┌─────────────────────┐
    │   PANEL VISIBLE     │                       │   PANEL HIDDEN      │
    │                     │                       │                     │
    │  After grading      │                       │  On Skip            │
    │  completes          │                       │  On Next Problem    │
    │                     │                       │  On Try Again       │
    └─────────────────────┘                       └─────────────────────┘
```

---

## 9. CARTRIDGE FILE VALIDATION CHECKLIST

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REQUIRED FILES & EXPORTS                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

cartridges/{id}/
  │
  ├── manifest.json            ✓ REQUIRED
  │   │
  │   ├── meta.id              Must match directory name
  │   ├── meta.name            Display name for UI
  │   ├── meta.subject         Category (AP Statistics, Algebra 2, etc.)
  │   ├── meta.description     Brief description
  │   │
  │   ├── modes[]              At least one mode required
  │   │   ├── id               Unique mode identifier
  │   │   ├── name             Display name
  │   │   ├── unlockedBy       "default" | { "gold": N }
  │   │   └── layout.inputs[]  At least one input per mode
  │   │
  │   ├── grading.rubricFile   Points to grading-rules.js
  │   ├── grading.aiPromptFile Points to ai-grader-prompt.txt (optional)
  │   │
  │   ├── hints.perField       Hint text per fieldId
  │   │
  │   └── progression.tiers[]  Must mirror modes[] for unlock UI
  │
  ├── generator.js             ✓ REQUIRED
  │   │
  │   └── export function generateProblem(modeId, context, mode)
  │       Returns: { context, graphConfig, answers, scenario }
  │
  ├── grading-rules.js         ✓ REQUIRED
  │   │
  │   └── export function gradeField(fieldId, answer, context)
  │       Returns: { score: 'E'|'P'|'I', feedback: string }
  │
  ├── ai-grader-prompt.txt     ○ OPTIONAL (enables AI grading)
  │   │
  │   └── Template with {{placeholders}}
  │       Required: {{studentAnswer}}, {{expectedAnswer}}
  │       Common: {{fieldId}}, {{levelName}}, {{problemText}}
  │
  └── contexts.json            ○ OPTIONAL (for scenario variety)
      │
      └── { contexts: [ { id, topic, ...variables } ] }


┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REGISTRY ENTRY                                                │
└─────────────────────────────────────────────────────────────────────────────────┘

Add to cartridges/registry.json:
{
  "id": "your-cartridge-id",
  "name": "Display Name",
  "subject": "Subject Area",
  "description": "Brief description",
  "shortCode": "CODE"
}

Add to platform/app.html dropdown:
<option value="your-cartridge-id">Display Name</option>
```

---

## 10. GRADING RULES PATTERNS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMMON GRADING PATTERNS                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

NUMERIC GRADING (math calculations):
───────────────────────────────────
  if (Math.abs(studentValue - expected) <= tolerance) {
    return { score: 'E', feedback: 'Correct!' };
  }
  // Consider partial credit for close answers

EXACT MATCH (dropdowns, choices):
─────────────────────────────────
  if (normalize(answer) === normalize(expected)) {
    return { score: 'E', feedback: 'Correct!' };
  }

KEYWORD/REGEX (open response):
──────────────────────────────
  const mentionsKeyword = containsAny(answer, ['keyword1', 'keyword2']);
  const mentionsContext = containsAny(answer, ['specific', 'terms']);

  if (mentionsKeyword && mentionsContext) {
    return { score: 'E', feedback: 'Excellent explanation!' };
  }
  if (mentionsKeyword || mentionsContext) {
    return { score: 'P', feedback: 'Good start, but mention X...' };
  }
  return { score: 'I', feedback: 'Remember to include...' };

BLANK ANSWER HANDLING:
──────────────────────
  if (isBlank(answer)) {
    if (isOpenResponse) {
      return { score: 'I', feedback: 'Please enter an explanation.' };
    }
    return { score: 'I', feedback: 'Please select an answer.' };
  }
```

---

## Summary: Cartridge Compliance Requirements

| Requirement | Description |
|-------------|-------------|
| `manifest.json` | Valid JSON with meta, modes, grading, hints, progression |
| `generator.js` | Exports `generateProblem(modeId, context, mode)` |
| `grading-rules.js` | Exports `gradeField(fieldId, answer, context)` returning `{score, feedback}` |
| Mode IDs | Must be unique, match between modes[] and progression.tiers[] |
| Field IDs | Must match between mode.layout.inputs[].id and hints.perField keys |
| unlockedBy | Either `"default"` or `{ "gold": number }` |
| Score values | Must be `'E'`, `'P'`, or `'I'` only |
| answers object | Keys must match field IDs from mode.layout.inputs |
| context object | Must contain all variables used in `{{placeholders}}` |
