# App Component Map

This map uses `CLAUDE.md` as the top-level table of contents and `docs/STATE_MACHINES.md` + `cartridges/CARTRIDGE-STATE-MACHINE.md` as the authoritative state definitions. It separates current vs historical components and links each component to the state-machine sections it implements.

## Scope Legend
- **Active**: Implemented in repo and referenced by current app flow.
- **Historical**: Preserved in `STATE_MACHINES.md` but removed from active code (per v4.0 note).
- **Mismatch**: Documented in state machine but not present in repo (debug target).

## Entry Points
- **Primary UI**: `platform/app.html` (Active)
  - Orchestrates platform, cartridge loading, grading callbacks, AI feedback panel, Ghost Orbits launch.
- **Legacy UI**: `index.html` (Active but legacy)
- **Platform Orchestrator**: `platform/platform.js` (Active)

## Platform Core Components (Active)
- **GameEngine** → `platform/core/game-engine.js`
  - State refs: `STATE_MACHINES.md` §§1 (Star Earning), 4 (Star Award), 5 (Progression & Unlocks), 26 (Star Penalty Calculation), 101–107 (Overrides + Teacher Bypass).
- **GradingEngine** → `platform/core/grading-engine.js`
  - State refs: §2 (Dual Grading Pipeline), §22 (AI Grading Normalization), §31 (Prompt Template Interpolation).
- **InputRenderer** → `platform/core/input-renderer.js`
  - State refs: `CARTRIDGE-STATE-MACHINE.md` §7 (Input Types), `STATE_MACHINES.md` §7.
- **GraphEngine** → `platform/core/graph-engine.js`
  - Supports graph-rendering branches in `CARTRIDGE-STATE-MACHINE.md` §2.
- **CartridgeLoader** → `platform/core/cartridge-loader.js`
  - State refs: `CARTRIDGE-STATE-MACHINE.md` §1 (Loading).
- **ShuffleBag** → `platform/core/shuffle-bag.js`
  - State refs: `CARTRIDGE-STATE-MACHINE.md` §2 (Context selection, no repeats).
- **AI Feedback Panel** → `platform/core/ai-feedback-panel.js`
  - State refs: `STATE_MACHINES.md` §46; `CARTRIDGE-STATE-MACHINE.md` §8.
- **WebSocket Client** → `platform/core/websocket-client.js`
  - State refs: `STATE_MACHINES.md` §23 (WebSocket Client State Machine), §12 (Message Flow).
- **Leaderboard** → `platform/core/leaderboard.js`
  - State refs: `STATE_MACHINES.md` §11 (Leaderboard State Machine).
- **Roster Modal** → `platform/core/roster-modal.js`
  - State refs: `STATE_MACHINES.md` §109.
- **Ghost System Core**
  - `platform/core/ghost-engine.js`, `ghost-network.js`, `ghost-maze-generator.js`, `ghost-maze-renderer.js`, `ghost-battle-engine.js`, `ghost-battle-viz.js`, `ghost-terrain-renderer.js`
  - State refs: `STATE_MACHINES.md` §§128–134 (Ghost system phases, maze, battle, viz).
- **Ghost Orbits Core**
  - `platform/core/ghost-orbits-ai.js`, `ghost-orbits-audio.js`, `ghost-orbits-dots.js`, `ghost-orbits-nn-mapper.js`, `ghost-orbits-physics.js`, `ghost-orbits-renderer.js`, `ghost-orbits-territory.js`
  - State refs: `STATE_MACHINES.md` §§135–142.
- **User/Time/Audio Utilities**
  - `platform/core/user-system.js`, `time-tracker.js`, `class-time.js`, `sound-engine.js`, `celebration.js`.

## Platform Game Components
- **Ghost Orbits UI/Controller**
  - `platform/game/ghost-orbits-controller.js` (Active)
  - `platform/game/ghost-orbits-panel.js` (Active)
  - `platform/game/ghost-orbits-shadow-ai.js` (Active)
  - `platform/game/ghost-panel.js` (Active)
  - State refs: `STATE_MACHINES.md` §§135–142.
- **CTF/KotH/Pong UI** → **Mismatch**
  - Documented in `STATE_MACHINES.md` §§CTF (v4.0+), v4.2, v4.3, but expected client files such as `platform/game/ctf-state.js`, `ctf-panel.js`, `ctf-renderer.js`, `koth-*` are not present in repo (debug target).

## Backend (Railway Server)
- **API + WebSocket Server** → `railway-server/server.js` (Active)
  - Key endpoints: progress, AI grading, roster, progression overrides, ghost sync/battles.
  - State refs: `STATE_MACHINES.md` §§2, 22, 31, 46, 101–107, 109.
- **Ghost Orbits Arena Manager** → `railway-server/ghost-orbits-manager.js` (Active)
  - State refs: `STATE_MACHINES.md` §§135–142.
- **Prompt Utils** → `railway-server/prompt-utils.js`
  - State refs: `STATE_MACHINES.md` §31 (Prompt Template Interpolation).
- **Migrations (Supabase)** → `railway-server/migrations/*.sql`
  - Ghosts: `013_ghost_profiles.sql`, `014_ghost_battles.sql`, `015_ghost_orbits.sql`
  - Progression: `004_generic_progress.sql`, `008_progression_overrides.sql`
  - Roster: `010_class_periods.sql`
  - CTF/KotH/Tiebreaker schemas exist (`009_ctf.sql`, `011_ctf_sessions.sql`, `012_game_modes.sql`) even if client code is missing (debug target).

## Cartridges (Lessons)
- **Registry**: `cartridges/registry.json`
- **Per-cartridge files**: `manifest.json`, `generator.js`, `grading-rules.js`, `ai-grader-prompt.txt`, `contexts.json`, `assets/`
  - State refs: `cartridges/CARTRIDGE-STATE-MACHINE.md` §§1–10.
- **Template**: `cartridges/_template/`

## Shared
- **Scoring Config** → `shared/scoring.config.js`
  - State refs: `STATE_MACHINES.md` §26 (Star penalty & multipliers).

## Tests Mapping (Active)
- **Core**: `tests/core/*`
  - Game engine progression, escape key, etc.
- **Game**: `tests/game/*`
  - Ghost Orbits progression.
- **Generators/Grading**: `tests/generators/*`, `tests/grading/*`
  - Cartridge generator and grading correctness.
- **Server**: `tests/server/*`
  - AI grading, progress sync, ghost battles, roster, API quality.

## Historical Sections (Reference-Only)
Per v4.0 note in `STATE_MACHINES.md`, the following are preserved for historical reference and may not be active:
- **Sections 3–19 and 33–108**: Grid Wars, Pong Duel, and related v1–v3 flows.
- **Use only if these systems are intentionally re-enabled**.

## State Machine Section Map (All Sections)
Each section below includes the primary implementation file(s) and status.

### Current/Active or Mixed (with code references)
- **1. GAME ENGINE — Star Earning Flow** → `platform/core/game-engine.js`, `platform/app.html` (Active)
- **2. GRADING ENGINE — Dual Grading Pipeline** → `platform/core/grading-engine.js`, `railway-server/server.js` (Active)
- **22. AI GRADING NORMALIZATION** → `platform/core/grading-engine.js`, `railway-server/server.js` (Active)
- **23. WEBSOCKET CLIENT STATE MACHINE** → `platform/core/websocket-client.js`, `platform/app.html` (Active)
- **26. STAR PENALTY CALCULATION** → `platform/core/game-engine.js`, `shared/scoring.config.js` (Active)
- **31. PROMPT TEMPLATE INTERPOLATION** → `railway-server/prompt-utils.js`, `railway-server/server.js` (Active)
- **46. AI FEEDBACK PANEL STATE MACHINE** → `platform/core/ai-feedback-panel.js`, `platform/app.html` (Active)
- **101. PROGRESSION OVERRIDE STATE MACHINE** → `platform/app.html`, `railway-server/server.js` (Active)
- **102. PROGRESSION OVERRIDE API FLOW** → `railway-server/server.js` (Active)
- **103. checkUnlocks() STATE MACHINE** → `platform/core/game-engine.js`, `platform/app.html` (Active)
- **104. TEACHER PROGRESSION UI STATE MACHINE** → `platform/app.html` (Active)
- **105. WEBSOCKET PROGRESSION MESSAGES** → `platform/core/websocket-client.js`, `railway-server/server.js` (Active)
- **107. TEACHER LEVEL BYPASS STATE MACHINE** → `platform/app.html` (Active)
- **108. CARTRIDGE DEVELOPMENT (External Documentation)** → `cartridges/CARTRIDGE-STATE-MACHINE.md` (Active doc)
- **109. ROSTER MODAL STATE MACHINE** → `platform/core/roster-modal.js`, `railway-server/server.js` (Active)
- **110. STUDENT DETAIL MODAL STATE MACHINE** → `platform/app.html` (Active UI; confirm handlers in app)
- **112. URL DEEP LINKING STATE MACHINE** → `platform/app.html` (Active)
- **113. PROBABILITY CARTRIDGE LEVEL MAP** → `cartridges/apstatu4l1l2/manifest.json` (Active)
- **128. Ghost System Overview** → `platform/core/ghost-engine.js`, `ghost-network.js` (Active)
- **129. Ghost Network State Machine** → `platform/core/ghost-network.js` (Active)
- **130. Ghost Engine State Machine** → `platform/core/ghost-engine.js` (Active)
- **131. Ghost Maze Generator State Machine** → `platform/core/ghost-maze-generator.js` (Active)
- **132. Ghost Maze Renderer State Machine** → `platform/core/ghost-maze-renderer.js` (Active)
- **133. Ghost Battle Engine State Machine** → `platform/core/ghost-battle-engine.js`, `railway-server/server.js` (Active)
- **134. Ghost Battle Visualization State Machine** → `platform/core/ghost-battle-viz.js` (Active)
- **135. Ghost Orbits Controller State Machine** → `platform/game/ghost-orbits-controller.js` (Active)
- **136. Ghost Orbits Star Economy State Machine** → `platform/game/ghost-orbits-controller.js`, `platform/app.html` (Active)
- **137. Ghost Orbits Dot Territory State Machine** → `platform/core/ghost-orbits-dots.js`, `ghost-orbits-territory.js` (Active)
- **138. Ghost Orbits Lives System State Machine** → `platform/game/ghost-orbits-controller.js` (Active)
- **139. Ghost Orbits Shadow Self AI State Machine** → `platform/game/ghost-orbits-shadow-ai.js`, `platform/core/ghost-orbits-ai.js` (Active)
- **140. Ghost Orbits Movement State Machine** → `platform/core/ghost-orbits-physics.js`, `ghost-orbits-renderer.js` (Active)
- **141. Ghost Orbits Win Conditions State Machine** → `platform/game/ghost-orbits-controller.js` (Active)
- **142. Ghost Orbits Match Flow State Machine** → `platform/game/ghost-orbits-controller.js` (Active)

### Documented but Missing Client Implementation (Mismatch)
- **CTF (Capture The Flag) — Game Flow (v4.0)** → expected `platform/game/ctf-*` files (Missing); server endpoints not present in `railway-server/server.js`
- **CTF Session Management (v4.2)** → expected CTF session endpoints (Missing)
- **CTF Tiebreaker Flow (v4.2)** → expected tiebreaker endpoints (Missing)
- **v4.3 Game Mode & Tiebreaker Expansion** → expected `ctf-`/`koth-` client modules (Missing)
- **111. CTF SESSION START STATE MACHINE (v4.3.2 Enhancement)** → expected CTF session endpoints (Missing)

### Section-by-Section Index (STATE_MACHINES.md)
Each entry below maps a state-machine section to current repo code (Active), doc-only (Historical), or missing (Mismatch).

- **CTF (Capture The Flag) — Game Flow (v4.0)** → Mismatch (client/server endpoints not in repo)
- **CTF Session Management (v4.2)** → Mismatch (no `/api/ctf/*` in `railway-server/server.js`)
- **CTF Tiebreaker Flow (v4.2)** → Mismatch (no tiebreaker endpoints in `railway-server/server.js`)
- **HISTORICAL: Grid Wars & Pong Duel Documentation (Removed in v4.0)** → Historical (doc-only)
- **1. GAME ENGINE — Star Earning Flow** → `platform/core/game-engine.js`, `platform/app.html` (Active)
- **2. GRADING ENGINE — Dual Grading Pipeline** → `platform/core/grading-engine.js`, `railway-server/server.js` (Active)
- **3. GRID WARS — Territory Claim Flow (v2.0)** → Historical (Grid Wars removed)
- **4. VELOCITY TIER STATE MACHINE (v1.5)** → Historical (Grid Wars removed)
- **5. SCARCITY PHASE STATE MACHINE (v1.6)** → Historical
- **6. BOUNTY SYSTEM STATE MACHINE (v1.6)** → Historical
- **7. DIMINISHING RETURNS STATE MACHINE (v1.6)** → Historical
- **8. AFK DECAY STATE MACHINE (v1.5)** → Historical
- **9. SESSION LIFECYCLE STATE MACHINE** → Historical
- **10. PRESENCE & CONNECTION STATE MACHINE (v1.6)** → Historical
- **11. LEADERBOARD STATE MACHINE (v1.6.1)** → Historical (Grid Wars leaderboard)
- **12. WEBSOCKET MESSAGE FLOW (Complete)** → Historical (Grid Wars message flow)
- **13. CONTIGUITY BONUS CALCULATION** → Historical
- **14. COMPLETE SYSTEM FLOW (v1.6)** → Historical
- **15. IDENTIFIED ISSUES / VERIFICATION NOTES** → Historical (Grid Wars)
- **16. STATE VARIABLE INVENTORY** → Historical
- **17. API ENDPOINT INVENTORY** → Historical
- **18. INTERVAL/TIMER INVENTORY** → Historical
- **19. CONFIGURATION LOADING STATE MACHINE (v1.6.1)** → Historical
- **20. UI ELEMENT STATE MACHINE (v1.6.1)** → Historical
- **21. COMPLETE DATA FLOW (v1.6.1)** → Historical
- **22. AI GRADING NORMALIZATION (v1.6.2)** → `platform/core/grading-engine.js`, `railway-server/server.js` (Active)
- **23. WEBSOCKET CLIENT STATE MACHINE** → `platform/core/websocket-client.js`, `platform/app.html` (Active)
- **24. KEY POOL MANAGER STATE MACHINE** → `railway-server/server.js` (Active)
- **25. GRADING QUEUE STATE MACHINE** → `railway-server/server.js` (Active)
- **26. STAR PENALTY CALCULATION (Detailed)** → `platform/core/game-engine.js`, `shared/scoring.config.js` (Active)
- **27. CONFIG LOADING STATE MACHINE (v1.6.2 FIX)** → Historical
- **28. VELOCITY QUERY FIX (v1.6.2)** → Historical
- **29. VERIFICATION CHECKLIST (v1.6.2)** → Historical
- **30. STATE VARIABLE QUICK REFERENCE** → Historical
- **31. PROMPT TEMPLATE INTERPOLATION (v1.6.3)** → `railway-server/prompt-utils.js`, `railway-server/server.js` (Active)
- **32. SECTION INDEX** → Doc index only
- **33. HIERARCHICAL NAVIGATION STATE MACHINE (v2.0)** → Historical (Grid Wars)
- **34. DEVELOP ACTION STATE MACHINE (v2.0)** → Historical
- **35. DRILL ACTION STATE MACHINE (v2.0)** → Historical
- **36. ADDRESS RESOLUTION STATE MACHINE (v2.0)** → Historical
- **37. CELL CLICK ROUTER STATE MACHINE (v2.0)** → Historical
- **38. PRESENCE DOTS STATE MACHINE (v2.0)** → Historical
- **39. LEADERBOARD HIERARCHY STATE MACHINE (v2.0)** → Historical
- **40. DEVELOPED CELL INDICATOR STATE MACHINE (v2.0)** → Historical
- **41. WEBSOCKET MESSAGES (v2.0 Additions)** → Historical
- **42. API ENDPOINT INVENTORY (v2.0 Additions)** → Historical
- **43. STATE VARIABLE INVENTORY (v2.0 Additions)** → Historical
- **44. COMPLETE v2.0 FLOW DIAGRAM** → Historical
- **45. v2.0 VERIFICATION CHECKLIST** → Historical
- **46. AI FEEDBACK PANEL STATE MACHINE (v2.0.1)** → `platform/core/ai-feedback-panel.js`, `platform/app.html` (Active)
- **47. v2.0.1 VERIFICATION CHECKLIST** → Historical
- **48. GRID WARS — Territory Rendering Data Flow (v2.1.2)** → Historical
- **49. GRID WARS — Config Loading & Presence Dots Mode (v2.1.2)** → Historical
- **50. v2.1.2 VERIFICATION CHECKLIST** → Historical
- **51. v2.1.5 SUBCELL CLAIM FLOW** → Historical
- **52. v2.1.5 COORDINATE DISPLAY** → Historical
- **53. v2.1.5 ARROW KEY NAVIGATION** → Historical
- **54. v2.1.5 VERIFICATION CHECKLIST** → Historical
- **55. v2.2.2 CLICK-TO-SELECT (No Auto-Claim)** → Historical
- **56. v2.2.2 CLAIM BUTTON FLOW** → Historical
- **57. v2.2.2 SELECTION HIGHLIGHT RENDERING** → Historical
- **58. v2.2.2 GRID RENDERER DIAGNOSTICS** → Historical
- **59. v2.2.2 VERIFICATION CHECKLIST** → Historical
- **60. v2.2.3 COLOR CONSISTENCY** → Historical
- **61. v2.2.3 GIFT DROPDOWN FILTERING** → Historical
- **62. v2.2.3 ZOOM BEHAVIOR (No Auto-Zoom)** → Historical
- **63. v2.2.3 LEVEL INDICATOR STATE MACHINE** → Historical
- **64. v2.2.3 TERRITORY STATS CALCULATION** → Historical
- **65. v2.2.3 VERIFICATION CHECKLIST** → Historical
- **66. v2.2.5 LANDLORD TAX STATE MACHINE** → Historical
- **67. v2.2.5 FORTIFICATION MULTIPLIER STATE MACHINE** → Historical
- **68. v2.2.5 CLIENT FORTIFICATION UI STATE MACHINE** → Historical
- **69. v2.2.5 RENT COLLECTED WEBSOCKET FLOW** → Historical
- **70. v2.2.5 VERIFICATION CHECKLIST** → Historical
- **71. v2.2.6 HOSTILE TAKEOVER DETECTION STATE MACHINE** → Historical
- **72. v2.2.6 HOSTILE TAKEOVER COST CALCULATION** → Historical
- **73. v2.2.6 HOSTILE TAKEOVER EXECUTION** → Historical
- **74. v2.2.6 HOSTILE TAKEOVER WEBSOCKET FLOW** → Historical
- **75. v2.2.6 CLIENT TAKEOVER BUTTON STATE MACHINE** → Historical
- **76. v2.2.6 VERIFICATION CHECKLIST** → Historical
- **77. v2.2.7 TERRITORY DISPLAY STATE** → Historical
- **78. v2.2.7 UI SECTION DISTINCTION** → Historical
- **79. v2.2.7 updateTerritoryStats() STATE** → Historical
- **80. v2.2.7 updateCoordsDisplay() STATE** → Historical
- **81. v2.2.7 SERVER STATE RESPONSE** → Historical
- **82. v2.2.7 GRID STATE STORAGE** → Historical
- **83. v2.2.7 VERIFICATION CHECKLIST** → Historical
- **84. PONG DUEL - TOKEN ECONOMY STATE MACHINE (v3.0)** → Historical
- **85. PONG DUEL - CHALLENGE FLOW STATE MACHINE (v3.0)** → Historical
- **86. PONG DUEL - MATCH ENGINE STATE MACHINE (v3.0)** → Historical
- **87. PONG DUEL - MATCH OUTCOME STATE MACHINE (v3.0)** → Historical
- **88. PONG DUEL - PADDLE HEIGHT BONUS STATE MACHINE (v3.0)** → Historical
- **89. PONG DUEL - RATE LIMITING STATE MACHINE (v3.0)** → Historical
- **90. PONG DUEL - INPUT HANDLING STATE MACHINE (v3.0)** → Historical
- **91. PONG DUEL - WEBSOCKET MESSAGES STATE MACHINE (v3.0)** → Historical
- **92. PONG DUEL - SPECTATOR MODE STATE MACHINE (v3.0)** → Historical
- **93. PONG DUEL - ATTACK OPTIONS MODAL STATE MACHINE (v3.0)** → Historical
- **94. PONG DUEL - CHECKLIST (v3.0)** → Historical
- **95. PONG DUEL - PENDING CHALLENGE STATE MACHINE (v3.0.1)** → Historical
- **96. TOKEN FROM DRILLING STATE MACHINE (v3.1)** → Historical
- **97. TOKEN FALLBACK STATE MACHINE (v3.1.1-v3.1.3)** → Historical
- **98. RECORD-CORRECT ENDPOINT STATE MACHINE (v3.1)** → Historical
- **99. TOKEN PROGRESS DISPLAY STATE MACHINE (v3.1)** → Historical
- **100. v3.1 VERIFICATION CHECKLIST** → Historical
- **101. PROGRESSION OVERRIDE STATE MACHINE (v3.2)** → `platform/app.html`, `railway-server/server.js` (Active)
- **102. PROGRESSION OVERRIDE API FLOW (v3.2)** → `railway-server/server.js` (Active)
- **103. checkUnlocks() STATE MACHINE (v3.2 FIX)** → `platform/core/game-engine.js`, `platform/app.html` (Active)
- **104. TEACHER PROGRESSION UI STATE MACHINE (v3.2)** → `platform/app.html` (Active)
- **105. WEBSOCKET PROGRESSION MESSAGES (v3.2)** → `platform/core/websocket-client.js`, `railway-server/server.js` (Active)
- **106. v3.2 VERIFICATION CHECKLIST** → Historical
- **107. TEACHER LEVEL BYPASS STATE MACHINE (v3.2.1)** → `platform/app.html` (Active)
- **108. CARTRIDGE DEVELOPMENT (External Documentation)** → `cartridges/CARTRIDGE-STATE-MACHINE.md` (Active doc)
- **109. ROSTER MODAL STATE MACHINE (v4.1.0)** → `platform/core/roster-modal.js`, `railway-server/server.js` (Active)
- **v4.3 Game Mode & Tiebreaker Expansion** → Mismatch (client modules missing; migrations only)
- **110. STUDENT DETAIL MODAL STATE MACHINE (v4.3.2)** → `platform/app.html` (Active UI; confirm handlers)
- **111. CTF SESSION START STATE MACHINE (v4.3.2 Enhancement)** → Mismatch (CTF endpoints missing)
- **112. URL DEEP LINKING STATE MACHINE (v4.3.3)** → `platform/app.html` (Active)
- **113. PROBABILITY CARTRIDGE LEVEL MAP (v4.3.3)** → `cartridges/apstatu4l1l2/manifest.json` (Active)
- **128. Ghost System Overview (v4.4.0 - v4.7.0)** → `platform/core/ghost-engine.js`, `ghost-network.js` (Active)
- **129. Ghost Network State Machine (v4.4.0)** → `platform/core/ghost-network.js` (Active)
- **130. Ghost Engine State Machine (v4.4.0)** → `platform/core/ghost-engine.js` (Active)
- **131. Ghost Maze Generator State Machine (v4.5.0)** → `platform/core/ghost-maze-generator.js` (Active)
- **132. Ghost Maze Renderer State Machine (v4.5.0 - v4.7.0)** → `platform/core/ghost-maze-renderer.js` (Active)
- **133. Ghost Battle Engine State Machine (v4.6.0)** → `platform/core/ghost-battle-engine.js`, `railway-server/server.js` (Active)
- **134. Ghost Battle Visualization State Machine (v4.7.0)** → `platform/core/ghost-battle-viz.js` (Active)
- **135. Ghost Orbits Controller State Machine (v4.8.0)** → `platform/game/ghost-orbits-controller.js` (Active)
- **136. Ghost Orbits Star Economy State Machine (v4.8.0)** → `platform/game/ghost-orbits-controller.js`, `platform/app.html` (Active)
- **137. Ghost Orbits Dot Territory State Machine (v4.8.0)** → `platform/core/ghost-orbits-dots.js`, `ghost-orbits-territory.js` (Active)
- **138. Ghost Orbits Lives System State Machine (v4.8.0)** → `platform/game/ghost-orbits-controller.js` (Active)
- **139. Ghost Orbits Shadow Self AI State Machine (v4.8.0)** → `platform/game/ghost-orbits-shadow-ai.js`, `platform/core/ghost-orbits-ai.js` (Active)
- **140. Ghost Orbits Movement State Machine (v4.8.0)** → `platform/core/ghost-orbits-physics.js`, `ghost-orbits-renderer.js` (Active)
- **141. Ghost Orbits Win Conditions State Machine (v4.8.0)** → `platform/game/ghost-orbits-controller.js` (Active)
- **142. Ghost Orbits Match Flow State Machine (v4.8.0)** → `platform/game/ghost-orbits-controller.js` (Active)


