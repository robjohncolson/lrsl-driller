# Ghost System Phase 7: Battle Visualization

Technical specification for the battle replay visualization system.

**Version**: 1.0.0
**Date**: January 2026
**Prerequisites**: Phase 1 (Ghost Profile), Phase 3 (3D Maze), Phase 6 (Battle Engine)

---

## 1. Overview

Battle Visualization provides an animated replay of ghost-vs-ghost battles. Students can watch their ghost compete against opponents, seeing each problem solved in real-time with visual feedback for correct/incorrect answers.

### Design Goals

1. **Educational**: Show students how their ghost performs under competition
2. **Engaging**: Racing animation creates excitement around drill practice
3. **Informative**: Clearly display timing, accuracy, and rating changes
4. **Performant**: Smooth animation on school laptops (30+ FPS)

### Core Concept

```
BATTLE REPLAY

  Problem 1    Problem 2    Problem 3    ...    Problem 10
     |            |            |                    |
     v            v            v                    v
  [=====]      [=====]      [=====]              [=====]

  Ghost A: [===========>                        ]  5/10 correct
  Ghost B: [==================>                 ]  6/10 correct

  Time Elapsed: 45s / 120s
  [Play] [Pause] [1x] [2x] [4x] [Skip to End]
```

---

## 2. Data Structures

### 2.1 Battle Timeline (from Phase 6)

```javascript
// Input from ghost-battle-engine.js simulateBattle()
const battleResults = {
  seed: 1706388000000,
  problems: [
    {
      index: 0,
      difficulty: 0.25,
      inputs: [/* 10 values */],
      challenger: {
        prediction: { time: 15, correctProb: 0.92, quickProb: 0.6 },
        result: { time: 12.3, correct: true }
      },
      defender: {
        prediction: { time: 18, correctProb: 0.85, quickProb: 0.4 },
        result: { time: 14.1, correct: true }
      }
    },
    // ... 9 more problems
  ],
  challenger: { totalTime: 245.3, correctCount: 8 },
  defender: { totalTime: 267.8, correctCount: 7 },
  winner: 1,  // 1 = challenger, 2 = defender, 0 = draw
  margin: 22.5
};
```

### 2.2 Replay State

```javascript
const replayState = {
  // Battle data
  battleData: null,        // battleResults from engine
  challengerName: '',      // Display name
  defenderName: '',        // Display name

  // Playback state
  isPlaying: false,
  currentTime: 0,          // Elapsed seconds in replay
  playbackSpeed: 1,        // 1x, 2x, 4x
  totalDuration: 0,        // Total battle duration

  // Problem progress
  challengerProgress: [],  // Array of { completed: bool, correct: bool, finishTime: number }
  defenderProgress: [],

  // UI state
  isVisible: false,
  showResults: false
};
```

### 2.3 Animation Keyframes

```javascript
// Computed from battle data
const keyframes = {
  challenger: [
    { time: 0, problemIndex: 0, state: 'solving' },
    { time: 12.3, problemIndex: 0, state: 'correct' },
    { time: 12.3, problemIndex: 1, state: 'solving' },
    { time: 25.1, problemIndex: 1, state: 'incorrect' },
    // ...
  ],
  defender: [
    { time: 0, problemIndex: 0, state: 'solving' },
    { time: 14.1, problemIndex: 0, state: 'correct' },
    // ...
  ]
};
```

---

## 3. UI Components

### 3.1 Battle Replay Panel

A modal overlay that displays the battle replay:

```html
<div id="battle-replay-panel" class="hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
  <div class="bg-slate-900 rounded-lg shadow-2xl w-[90%] max-w-3xl p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-cyan-400">Battle Replay</h2>
      <button id="battle-replay-close" class="text-gray-400 hover:text-white text-2xl">&times;</button>
    </div>

    <!-- Combatant Info -->
    <div class="flex justify-between mb-6">
      <div class="text-center">
        <div class="text-lg font-semibold text-blue-400" id="challenger-name">Ghost A</div>
        <div class="text-sm text-gray-400">Challenger</div>
      </div>
      <div class="text-2xl text-cyan-300">VS</div>
      <div class="text-center">
        <div class="text-lg font-semibold text-red-400" id="defender-name">Ghost B</div>
        <div class="text-sm text-gray-400">Defender</div>
      </div>
    </div>

    <!-- Race Track Visualization -->
    <div id="battle-race-track" class="mb-6">
      <!-- Canvas or DOM elements for race animation -->
    </div>

    <!-- Problem Timeline -->
    <div id="battle-timeline" class="mb-4">
      <!-- Problem dots showing progress -->
    </div>

    <!-- Playback Controls -->
    <div class="flex items-center justify-center gap-4 mb-4">
      <button id="replay-play-pause" class="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg">
        <span id="play-icon">&#9654;</span>
        <span id="pause-icon" class="hidden">&#10074;&#10074;</span>
      </button>
      <button id="replay-speed-1x" class="px-3 py-1 bg-slate-700 rounded">1x</button>
      <button id="replay-speed-2x" class="px-3 py-1 bg-slate-700 rounded">2x</button>
      <button id="replay-speed-4x" class="px-3 py-1 bg-slate-700 rounded">4x</button>
      <button id="replay-skip" class="px-3 py-1 bg-slate-700 rounded">Skip</button>
    </div>

    <!-- Time Progress -->
    <div class="text-center text-gray-400 mb-4">
      <span id="replay-current-time">0:00</span> / <span id="replay-total-time">2:30</span>
    </div>

    <!-- Results (shown after completion) -->
    <div id="battle-results" class="hidden">
      <!-- Final stats and rating changes -->
    </div>
  </div>
</div>
```

### 3.2 Race Track Visualization

A horizontal race track with two parallel lanes:

```
Problem:     1     2     3     4     5     6     7     8     9    10
           +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
Challenger |  O  |  O  |  X  |  O  |  O  |  O  |  .  |     |     |     |
           +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
Defender   |  O  |  O  |  O  |  O  |  X  |  .  |     |     |     |     |
           +-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+

Legend:
  O = Correct answer (green)
  X = Incorrect answer (red)
  . = Currently solving (pulsing)
  (empty) = Not yet reached
```

### 3.3 Progress Animation

Ghost spheres animate across the track:

```javascript
// Position calculation
function getGhostPosition(progress, trackWidth) {
  const problemWidth = trackWidth / 10;
  const completedProblems = progress.filter(p => p.completed).length;
  const currentProblemProgress = getCurrentSolvingProgress();

  return (completedProblems + currentProblemProgress) * problemWidth;
}
```

---

## 4. Animation System

### 4.1 Animation Loop

```javascript
let lastTimestamp = 0;
let animationFrameId = null;

function animate(timestamp) {
  if (!replayState.isPlaying) return;

  // Calculate delta time
  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Advance replay time
  const deltaSeconds = (deltaMs / 1000) * replayState.playbackSpeed;
  replayState.currentTime = Math.min(
    replayState.currentTime + deltaSeconds,
    replayState.totalDuration
  );

  // Update visualizations
  updateGhostPositions();
  updateProblemIndicators();
  updateTimeDisplay();

  // Check for completion
  if (replayState.currentTime >= replayState.totalDuration) {
    onReplayComplete();
  } else {
    animationFrameId = requestAnimationFrame(animate);
  }
}
```

### 4.2 Ghost Position Calculation

```javascript
function calculateGhostState(ghostTimeline, currentTime) {
  let completedProblems = 0;
  let cumulativeTime = 0;
  let currentProblemProgress = 0;
  let lastResult = null;

  for (let i = 0; i < ghostTimeline.length; i++) {
    const problem = ghostTimeline[i];
    const problemEndTime = cumulativeTime + problem.result.time;

    if (currentTime >= problemEndTime) {
      // Problem completed
      completedProblems++;
      cumulativeTime = problemEndTime;
      lastResult = problem.result.correct ? 'correct' : 'incorrect';
    } else if (currentTime >= cumulativeTime) {
      // Currently solving this problem
      const timeInProblem = currentTime - cumulativeTime;
      currentProblemProgress = timeInProblem / problem.result.time;
      break;
    }
  }

  return {
    completedProblems,
    currentProblemProgress,
    totalProgress: (completedProblems + currentProblemProgress) / 10,
    lastResult
  };
}
```

### 4.3 Flash Effects

When a ghost completes a problem, show a brief flash:

```javascript
function showAnswerFlash(ghostElement, correct) {
  const flashClass = correct ? 'flash-green' : 'flash-red';
  ghostElement.classList.add(flashClass);

  setTimeout(() => {
    ghostElement.classList.remove(flashClass);
  }, 300);
}
```

CSS:
```css
.flash-green {
  animation: flashGreen 0.3s ease-out;
}

.flash-red {
  animation: flashRed 0.3s ease-out;
}

@keyframes flashGreen {
  0% { filter: brightness(1) drop-shadow(0 0 10px #00ff00); }
  50% { filter: brightness(2) drop-shadow(0 0 20px #00ff00); }
  100% { filter: brightness(1) drop-shadow(0 0 10px #00ff00); }
}

@keyframes flashRed {
  0% { filter: brightness(1) drop-shadow(0 0 10px #ff0000); }
  50% { filter: brightness(2) drop-shadow(0 0 20px #ff0000); }
  100% { filter: brightness(1) drop-shadow(0 0 10px #ff0000); }
}
```

---

## 5. Results Display

### 5.1 Final Stats Panel

```html
<div id="battle-results" class="mt-6 p-4 bg-slate-800 rounded-lg">
  <!-- Winner Banner -->
  <div id="winner-banner" class="text-center mb-4">
    <span class="text-2xl font-bold text-yellow-400">VICTORY!</span>
    <div class="text-lg text-cyan-300" id="winner-name">Ghost A wins!</div>
  </div>

  <!-- Stats Comparison -->
  <div class="grid grid-cols-3 gap-4 text-center">
    <div class="text-blue-400">
      <div class="text-2xl font-bold" id="challenger-correct">8</div>
      <div class="text-sm text-gray-400">Correct</div>
    </div>
    <div class="text-cyan-300">
      <div class="text-lg">vs</div>
    </div>
    <div class="text-red-400">
      <div class="text-2xl font-bold" id="defender-correct">7</div>
      <div class="text-sm text-gray-400">Correct</div>
    </div>
  </div>

  <!-- Time Comparison -->
  <div class="grid grid-cols-3 gap-4 text-center mt-4">
    <div class="text-blue-400">
      <div class="text-xl" id="challenger-time">4:05</div>
      <div class="text-sm text-gray-400">Time</div>
    </div>
    <div></div>
    <div class="text-red-400">
      <div class="text-xl" id="defender-time">4:28</div>
      <div class="text-sm text-gray-400">Time</div>
    </div>
  </div>

  <!-- Rating Changes -->
  <div class="grid grid-cols-3 gap-4 text-center mt-4">
    <div>
      <div class="text-xl text-green-400" id="challenger-rating-change">+18</div>
      <div class="text-sm text-gray-400">Rating Change</div>
    </div>
    <div></div>
    <div>
      <div class="text-xl text-red-400" id="defender-rating-change">-18</div>
      <div class="text-sm text-gray-400">Rating Change</div>
    </div>
  </div>
</div>
```

### 5.2 Rating Change Animation

```javascript
function animateRatingChange(element, startValue, endValue, duration = 1000) {
  const startTime = performance.now();
  const change = endValue - startValue;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    const currentValue = Math.round(startValue + change * eased);
    const prefix = currentValue >= 0 ? '+' : '';
    element.textContent = prefix + currentValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
```

---

## 6. Implementation

### 6.1 File: `platform/core/ghost-battle-viz.js`

```javascript
/**
 * ghost-battle-viz.js
 * Battle replay visualization component
 *
 * Features:
 * - Animated race track showing ghost progress
 * - Play/pause and speed controls
 * - Correct/incorrect flash indicators
 * - Final results with rating changes
 */

// Configuration
export const VIZ_CONFIG = {
  trackWidth: 600,           // Track width in pixels
  problemCount: 10,          // Problems per battle
  ghostSize: 24,             // Ghost sphere diameter
  flashDuration: 300,        // Flash effect duration (ms)
  defaultSpeed: 1,           // Default playback speed
  speeds: [1, 2, 4],         // Available speed options
  animationFPS: 60           // Target frame rate
};

// Tron color scheme
export const COLORS = {
  challenger: '#4488ff',     // Blue
  defender: '#ff4444',       // Red
  correct: '#00ff88',        // Green
  incorrect: '#ff4444',      // Red
  track: '#1a1a2e',          // Dark track
  trackLine: '#2a2a4e',      // Track lines
  highlight: '#00ffff'       // Cyan highlight
};

/**
 * BattleViz class - orchestrates battle replay visualization
 */
export class BattleViz {
  constructor(container) { ... }

  // Core methods
  loadBattle(battleData, challengerName, defenderName, ratingChanges) { ... }
  play() { ... }
  pause() { ... }
  setSpeed(speed) { ... }
  skipToEnd() { ... }
  reset() { ... }
  dispose() { ... }

  // Internal methods
  _buildUI() { ... }
  _buildRaceTrack() { ... }
  _calculateKeyframes() { ... }
  _animate(timestamp) { ... }
  _updateGhostPositions() { ... }
  _updateProblemIndicators() { ... }
  _showAnswerFlash(ghost, correct) { ... }
  _showResults() { ... }
  _formatTime(seconds) { ... }
}

// Utility functions
export function parseTimeline(battleData) { ... }
export function calculateTotalDuration(battleData) { ... }
export function getGhostStateAtTime(timeline, time) { ... }
```

---

## 7. Integration

### 7.1 Battle History Entry

Add "Watch Replay" button to battle history:

```javascript
function renderBattleHistoryEntry(battle) {
  return `
    <div class="battle-entry p-3 bg-slate-800 rounded-lg mb-2">
      <div class="flex justify-between items-center">
        <div>
          <span class="text-cyan-400">${battle.challenger}</span>
          vs
          <span class="text-red-400">${battle.defender}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm ${battle.winner ? 'text-green-400' : 'text-gray-400'}">
            ${battle.winner || 'Draw'}
          </span>
          <button
            class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm"
            onclick="watchReplay('${battle.id}')"
          >
            Watch Replay
          </button>
        </div>
      </div>
    </div>
  `;
}
```

### 7.2 Launching Replay

```javascript
import { BattleViz } from './core/ghost-battle-viz.js';

let battleViz = null;

async function watchReplay(battleId) {
  // Fetch battle data from server
  const response = await fetch(`/api/ghost/${cartridgeId}/battle/${battleId}`);
  const battleData = await response.json();

  // Initialize or reuse viz component
  if (!battleViz) {
    const container = document.getElementById('battle-replay-panel');
    battleViz = new BattleViz(container);
  }

  // Load and start replay
  battleViz.loadBattle(
    battleData.battleLog,
    battleData.challengerUsername,
    battleData.defenderUsername,
    {
      challengerChange: battleData.challengerRatingAfter - battleData.challengerRatingBefore,
      defenderChange: battleData.defenderRatingAfter - battleData.defenderRatingBefore
    }
  );

  battleViz.play();
}
```

---

## 8. Accessibility

### 8.1 Keyboard Controls

```javascript
document.addEventListener('keydown', (e) => {
  if (!battleViz || !battleViz.isVisible()) return;

  switch (e.key) {
    case ' ':  // Space - play/pause
      e.preventDefault();
      battleViz.isPlaying ? battleViz.pause() : battleViz.play();
      break;
    case 'Escape':  // Close replay
      battleViz.hide();
      break;
    case '1':
      battleViz.setSpeed(1);
      break;
    case '2':
      battleViz.setSpeed(2);
      break;
    case '4':
      battleViz.setSpeed(4);
      break;
    case 's':  // Skip to end
      battleViz.skipToEnd();
      break;
  }
});
```

### 8.2 Screen Reader Support

```html
<div role="application" aria-label="Battle Replay">
  <div role="status" aria-live="polite" id="replay-status">
    Battle between Ghost A and Ghost B. Press space to play.
  </div>
  <!-- Controls with proper labels -->
  <button aria-label="Play or pause replay" id="replay-play-pause">...</button>
  <button aria-label="Set playback speed to 1x" id="replay-speed-1x">1x</button>
</div>
```

---

## 9. Performance Considerations

### 9.1 Optimization Strategies

1. **RequestAnimationFrame**: Use for smooth 60fps animation
2. **CSS Transforms**: Use `transform: translateX()` for ghost movement (GPU accelerated)
3. **Class Toggle**: Use class toggle for flash effects instead of inline styles
4. **Object Pool**: Reuse DOM elements for problem indicators
5. **Throttle Updates**: Update time display at 10fps, not 60fps

### 9.2 Memory Management

```javascript
dispose() {
  // Stop animation
  if (this.animationFrameId) {
    cancelAnimationFrame(this.animationFrameId);
  }

  // Remove event listeners
  this.playBtn.removeEventListener('click', this._onPlayClick);
  // ... other listeners

  // Clear references
  this.battleData = null;
  this.keyframes = null;
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```javascript
describe('BattleViz', () => {
  describe('parseTimeline', () => {
    it('should extract challenger timeline from battle data');
    it('should extract defender timeline from battle data');
    it('should calculate cumulative times');
  });

  describe('calculateTotalDuration', () => {
    it('should return the longer of two ghost times');
    it('should handle equal times');
  });

  describe('getGhostStateAtTime', () => {
    it('should return correct progress at time 0');
    it('should show problem in progress');
    it('should show completed problem');
    it('should handle exact completion time');
    it('should clamp to final state');
  });
});

describe('Animation Timing', () => {
  describe('playback speed', () => {
    it('should advance at 1x speed');
    it('should advance at 2x speed');
    it('should advance at 4x speed');
  });

  describe('skipToEnd', () => {
    it('should jump to final state');
    it('should show results immediately');
  });
});

describe('Results Display', () => {
  it('should show winner banner');
  it('should show correct counts');
  it('should show times formatted');
  it('should animate rating changes');
  it('should handle draws');
});
```

### 10.2 Integration Tests

```javascript
describe('BattleViz Integration', () => {
  it('should load from battle history');
  it('should sync with battle engine data structure');
  it('should handle escape key to close');
  it('should clean up on dispose');
});
```

---

## 11. Future Enhancements

### Phase 7.1: 3D Maze Integration
- Show ghosts racing through the actual 3D maze
- Camera follows the leading ghost
- Problems appear as checkpoints in maze

### Phase 7.2: Sound Effects
- Problem completion sounds
- Victory/defeat fanfares
- Background music during replay

### Phase 7.3: Sharing
- Export replay as video
- Generate shareable link
- Social media integration

---

*This specification is part of the Ghost System implementation. See `ghost-system-spec.md` for the overall vision.*
