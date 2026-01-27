/**
 * Tests for ghost-battle-viz.js
 * Battle replay visualization component
 *
 * Note: BattleViz class tests are skipped because they require a browser DOM.
 * Utility functions (parseTimeline, getGhostStateAtTime, etc.) are fully tested.
 *
 * Run with: npx vitest run tests/core/ghost-battle-viz.test.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VIZ_CONFIG,
  COLORS,
  parseTimeline,
  calculateTotalDuration,
  getGhostStateAtTime,
  formatTime,
  easeOutCubic
} from '../../platform/core/ghost-battle-viz.js';

// ============================================
// TEST DATA FACTORIES
// ============================================

function createMockBattleData() {
  return {
    seed: 12345,
    problems: [
      {
        index: 0,
        difficulty: 0.2,
        challenger: {
          prediction: { time: 15, correctProb: 0.92, quickProb: 0.6 },
          result: { time: 12.0, correct: true }
        },
        defender: {
          prediction: { time: 18, correctProb: 0.85, quickProb: 0.4 },
          result: { time: 14.0, correct: true }
        }
      },
      {
        index: 1,
        difficulty: 0.3,
        challenger: {
          prediction: { time: 20, correctProb: 0.88, quickProb: 0.5 },
          result: { time: 18.0, correct: true }
        },
        defender: {
          prediction: { time: 22, correctProb: 0.80, quickProb: 0.3 },
          result: { time: 25.0, correct: false }
        }
      },
      {
        index: 2,
        difficulty: 0.5,
        challenger: {
          prediction: { time: 25, correctProb: 0.75, quickProb: 0.4 },
          result: { time: 30.0, correct: false }
        },
        defender: {
          prediction: { time: 28, correctProb: 0.70, quickProb: 0.3 },
          result: { time: 20.0, correct: true }
        }
      }
    ],
    challenger: { totalTime: 60.0, correctCount: 2 },
    defender: { totalTime: 59.0, correctCount: 2 },
    winner: 2,  // Defender wins (same correct, faster time)
    margin: 1.0
  };
}

function createFullBattleData() {
  // Create a full 10-problem battle
  const problems = [];
  let challengerTime = 0;
  let defenderTime = 0;
  let challengerCorrect = 0;
  let defenderCorrect = 0;

  // Use deterministic values for testing
  const cTimes = [15, 12, 20, 18, 22, 15, 25, 20, 18, 14];
  const dTimes = [14, 16, 18, 22, 20, 18, 20, 24, 16, 12];
  const cCorrects = [true, true, false, true, true, true, false, true, true, true];
  const dCorrects = [true, false, true, true, false, true, true, false, true, true];

  for (let i = 0; i < 10; i++) {
    problems.push({
      index: i,
      difficulty: (i % 3) * 0.3 + 0.1,
      challenger: {
        prediction: { time: cTimes[i], correctProb: 0.8, quickProb: 0.5 },
        result: { time: cTimes[i], correct: cCorrects[i] }
      },
      defender: {
        prediction: { time: dTimes[i], correctProb: 0.7, quickProb: 0.4 },
        result: { time: dTimes[i], correct: dCorrects[i] }
      }
    });

    challengerTime += cTimes[i];
    defenderTime += dTimes[i];
    if (cCorrects[i]) challengerCorrect++;
    if (dCorrects[i]) defenderCorrect++;
  }

  const winner = challengerCorrect > defenderCorrect ? 1 :
    (defenderCorrect > challengerCorrect ? 2 : 0);

  return {
    seed: 54321,
    problems,
    challenger: { totalTime: challengerTime, correctCount: challengerCorrect },
    defender: { totalTime: defenderTime, correctCount: defenderCorrect },
    winner,
    margin: Math.abs(challengerTime - defenderTime)
  };
}

// ============================================
// CONFIGURATION TESTS
// ============================================

describe('VIZ_CONFIG', () => {
  it('should have valid track dimensions', () => {
    expect(VIZ_CONFIG.trackWidth).toBeGreaterThan(0);
    expect(VIZ_CONFIG.trackHeight).toBeGreaterThan(0);
  });

  it('should have correct problem count matching battle engine', () => {
    expect(VIZ_CONFIG.problemCount).toBe(10);
  });

  it('should have valid speed options', () => {
    expect(VIZ_CONFIG.speeds).toContain(1);
    expect(VIZ_CONFIG.speeds).toContain(2);
    expect(VIZ_CONFIG.speeds).toContain(4);
    expect(VIZ_CONFIG.defaultSpeed).toBe(1);
  });

  it('should have valid animation settings', () => {
    expect(VIZ_CONFIG.animationFPS).toBeGreaterThan(0);
    expect(VIZ_CONFIG.flashDuration).toBeGreaterThan(0);
    expect(VIZ_CONFIG.ghostSize).toBeGreaterThan(0);
  });

  it('should have reasonable time display rate', () => {
    expect(VIZ_CONFIG.timeDisplayFPS).toBeGreaterThan(0);
    expect(VIZ_CONFIG.timeDisplayFPS).toBeLessThanOrEqual(VIZ_CONFIG.animationFPS);
  });
});

describe('COLORS', () => {
  it('should have all required colors defined', () => {
    expect(COLORS.challenger).toBeDefined();
    expect(COLORS.defender).toBeDefined();
    expect(COLORS.correct).toBeDefined();
    expect(COLORS.incorrect).toBeDefined();
    expect(COLORS.track).toBeDefined();
    expect(COLORS.highlight).toBeDefined();
  });

  it('should have distinct challenger and defender colors', () => {
    expect(COLORS.challenger).not.toBe(COLORS.defender);
  });

  it('should have glow colors for both combatants', () => {
    expect(COLORS.challengerGlow).toBeDefined();
    expect(COLORS.defenderGlow).toBeDefined();
  });

  it('should have hex color format', () => {
    expect(COLORS.challenger).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(COLORS.defender).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(COLORS.correct).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

// ============================================
// UTILITY FUNCTION TESTS
// ============================================

describe('parseTimeline', () => {
  it('should extract challenger timeline from battle data', () => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);

    expect(timeline.challenger).toHaveLength(3);
    expect(timeline.challenger[0].correct).toBe(true);
    expect(timeline.challenger[1].correct).toBe(true);
    expect(timeline.challenger[2].correct).toBe(false);
  });

  it('should extract defender timeline from battle data', () => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);

    expect(timeline.defender).toHaveLength(3);
    expect(timeline.defender[0].correct).toBe(true);
    expect(timeline.defender[1].correct).toBe(false);
    expect(timeline.defender[2].correct).toBe(true);
  });

  it('should calculate cumulative times correctly for challenger', () => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);

    // Challenger: 12, 18, 30 seconds
    expect(timeline.challenger[0].startTime).toBe(0);
    expect(timeline.challenger[0].endTime).toBe(12);
    expect(timeline.challenger[1].startTime).toBe(12);
    expect(timeline.challenger[1].endTime).toBe(30);  // 12 + 18
    expect(timeline.challenger[2].startTime).toBe(30);
    expect(timeline.challenger[2].endTime).toBe(60);  // 30 + 30
  });

  it('should calculate cumulative times correctly for defender', () => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);

    // Defender: 14, 25, 20 seconds
    expect(timeline.defender[0].startTime).toBe(0);
    expect(timeline.defender[0].endTime).toBe(14);
    expect(timeline.defender[1].startTime).toBe(14);
    expect(timeline.defender[1].endTime).toBe(39);  // 14 + 25
    expect(timeline.defender[2].startTime).toBe(39);
    expect(timeline.defender[2].endTime).toBe(59);  // 39 + 20
  });

  it('should calculate total duration as max of both ghosts', () => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);

    // Challenger: 12 + 18 + 30 = 60
    // Defender: 14 + 25 + 20 = 59
    expect(timeline.totalDuration).toBe(60);
  });

  it('should preserve problem difficulty', () => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);

    expect(timeline.challenger[0].difficulty).toBe(0.2);
    expect(timeline.challenger[1].difficulty).toBe(0.3);
    expect(timeline.challenger[2].difficulty).toBe(0.5);
  });

  it('should handle 10-problem battles', () => {
    const battleData = createFullBattleData();
    const timeline = parseTimeline(battleData);

    expect(timeline.challenger).toHaveLength(10);
    expect(timeline.defender).toHaveLength(10);
  });

  it('should include problem index in keyframes', () => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);

    expect(timeline.challenger[0].problemIndex).toBe(0);
    expect(timeline.challenger[1].problemIndex).toBe(1);
    expect(timeline.challenger[2].problemIndex).toBe(2);
  });

  it('should calculate total duration for 10-problem battle', () => {
    const battleData = createFullBattleData();
    const timeline = parseTimeline(battleData);

    expect(timeline.totalDuration).toBeGreaterThan(0);
    expect(timeline.totalDuration).toBe(Math.max(
      battleData.challenger.totalTime,
      battleData.defender.totalTime
    ));
  });
});

describe('calculateTotalDuration', () => {
  it('should return the longer of two ghost times', () => {
    const battleData = createMockBattleData();
    const duration = calculateTotalDuration(battleData);

    expect(duration).toBe(60);  // Challenger is slower
  });

  it('should handle equal times', () => {
    const battleData = {
      challenger: { totalTime: 100, correctCount: 8 },
      defender: { totalTime: 100, correctCount: 7 }
    };
    const duration = calculateTotalDuration(battleData);

    expect(duration).toBe(100);
  });

  it('should return defender time when longer', () => {
    const battleData = {
      challenger: { totalTime: 90, correctCount: 8 },
      defender: { totalTime: 120, correctCount: 7 }
    };
    const duration = calculateTotalDuration(battleData);

    expect(duration).toBe(120);
  });

  it('should return challenger time when longer', () => {
    const battleData = {
      challenger: { totalTime: 150, correctCount: 6 },
      defender: { totalTime: 100, correctCount: 8 }
    };
    const duration = calculateTotalDuration(battleData);

    expect(duration).toBe(150);
  });
});

describe('getGhostStateAtTime', () => {
  let keyframes;

  beforeEach(() => {
    const battleData = createMockBattleData();
    const timeline = parseTimeline(battleData);
    keyframes = timeline.challenger;
  });

  describe('progress at boundaries', () => {
    it('should return correct progress at time 0', () => {
      const state = getGhostStateAtTime(keyframes, 0);

      expect(state.completedProblems).toBe(0);
      expect(state.currentProblemIndex).toBe(0);
      expect(state.currentProblemProgress).toBe(0);
      expect(state.totalProgress).toBe(0);
    });

    it('should return completed state at end time', () => {
      const state = getGhostStateAtTime(keyframes, 60);

      expect(state.completedProblems).toBe(3);
      expect(state.totalProgress).toBeCloseTo(1.0);
    });

    it('should handle exact completion time', () => {
      // At exactly 12 seconds (end of first problem)
      const state = getGhostStateAtTime(keyframes, 12);

      expect(state.completedProblems).toBe(1);
      expect(state.results[0].completed).toBe(true);
    });

    it('should clamp to final state for times beyond end', () => {
      const state = getGhostStateAtTime(keyframes, 1000);

      expect(state.completedProblems).toBe(3);
      expect(state.totalProgress).toBeCloseTo(1.0);
      expect(state.results.every(r => r.completed)).toBe(true);
    });
  });

  describe('mid-problem progress', () => {
    it('should show problem in progress', () => {
      // At 6 seconds, halfway through first problem (12 seconds)
      const state = getGhostStateAtTime(keyframes, 6);

      expect(state.completedProblems).toBe(0);
      expect(state.currentProblemIndex).toBe(0);
      expect(state.currentProblemProgress).toBeCloseTo(0.5, 1);
      expect(state.totalProgress).toBeCloseTo(0.167, 1);  // 0.5 / 3
    });

    it('should show transition to second problem', () => {
      // At 15 seconds (after first 12s problem, into second)
      const state = getGhostStateAtTime(keyframes, 15);

      expect(state.completedProblems).toBe(1);
      expect(state.currentProblemIndex).toBe(1);
      expect(state.results[0].completed).toBe(true);
      expect(state.results[0].correct).toBe(true);
    });

    it('should calculate mid-problem progress accurately', () => {
      // Halfway through second problem
      // First problem: 0-12, Second problem: 12-30 (18 seconds long)
      // At 21 seconds: 9 seconds into 18-second problem = 50%
      const state = getGhostStateAtTime(keyframes, 21);

      expect(state.completedProblems).toBe(1);
      expect(state.currentProblemIndex).toBe(1);
      expect(state.currentProblemProgress).toBeCloseTo(0.5, 1);
    });

    it('should handle progress near problem end', () => {
      // At 11 seconds (almost done with first 12-second problem)
      const state = getGhostStateAtTime(keyframes, 11);

      expect(state.completedProblems).toBe(0);
      expect(state.currentProblemProgress).toBeCloseTo(11/12, 2);
    });
  });

  describe('results tracking', () => {
    it('should track correct/incorrect results', () => {
      const state = getGhostStateAtTime(keyframes, 60);

      expect(state.results[0].correct).toBe(true);
      expect(state.results[1].correct).toBe(true);
      expect(state.results[2].correct).toBe(false);
    });

    it('should mark incomplete problems as not completed', () => {
      const state = getGhostStateAtTime(keyframes, 15);

      expect(state.results[0].completed).toBe(true);
      expect(state.results[1].completed).toBe(false);
      expect(state.results[2].completed).toBe(false);
    });

    it('should have null correct value for incomplete problems', () => {
      const state = getGhostStateAtTime(keyframes, 6);

      expect(state.results[0].correct).toBeNull();
      expect(state.results[0].completed).toBe(false);
    });

    it('should return correct array length for results', () => {
      const state = getGhostStateAtTime(keyframes, 0);
      expect(state.results).toHaveLength(3);
    });
  });

  describe('total progress calculation', () => {
    it('should calculate totalProgress correctly at start', () => {
      const state = getGhostStateAtTime(keyframes, 0);
      expect(state.totalProgress).toBe(0);
    });

    it('should calculate totalProgress correctly at end', () => {
      const state = getGhostStateAtTime(keyframes, 60);
      expect(state.totalProgress).toBeCloseTo(1.0);
    });

    it('should calculate totalProgress as fraction of problems', () => {
      // After first problem complete (1/3 done)
      const state = getGhostStateAtTime(keyframes, 12);
      expect(state.totalProgress).toBeCloseTo(1/3, 2);
    });
  });
});

describe('formatTime', () => {
  it('should format zero seconds', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('should format seconds under a minute', () => {
    expect(formatTime(45)).toBe('0:45');
  });

  it('should format exactly one minute', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(125)).toBe('2:05');
  });

  it('should pad seconds with leading zero', () => {
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(69)).toBe('1:09');
  });

  it('should handle large times (over 10 minutes)', () => {
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(665)).toBe('11:05');
  });

  it('should handle very large times (over 1 hour)', () => {
    expect(formatTime(3661)).toBe('61:01');
  });

  it('should truncate fractional seconds', () => {
    expect(formatTime(45.7)).toBe('0:45');
    expect(formatTime(59.9)).toBe('0:59');
  });

  it('should handle edge case of 59 seconds', () => {
    expect(formatTime(59)).toBe('0:59');
  });
});

describe('easeOutCubic', () => {
  it('should return 0 at start', () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it('should return 1 at end', () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it('should be between 0 and 1 for middle values', () => {
    const testValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    for (const t of testValues) {
      const result = easeOutCubic(t);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  });

  it('should ease out (faster at start)', () => {
    // Early progress should be farther along than linear
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('should be monotonically increasing', () => {
    let prev = 0;
    const testValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    for (const t of testValues) {
      const current = easeOutCubic(t);
      expect(current).toBeGreaterThan(prev);
      prev = current;
    }
  });

  it('should follow cubic easing formula', () => {
    // easeOutCubic(t) = 1 - (1-t)^3
    const t = 0.4;
    const expected = 1 - Math.pow(1 - t, 3);
    expect(easeOutCubic(t)).toBeCloseTo(expected, 10);
  });

  it('should have significant acceleration at start', () => {
    // At 25%, should be more than 50% done
    expect(easeOutCubic(0.25)).toBeGreaterThan(0.5);
  });
});

// ============================================
// BATTLE DATA INTEGRATION TESTS
// ============================================

describe('Battle Data Integration', () => {
  it('should parse timeline matching battle engine output format', () => {
    // This tests compatibility with ghost-battle-engine.js output
    const battleData = {
      seed: 42,
      problems: [
        {
          index: 0,
          difficulty: 0.25,
          inputs: [/* 10 values */],
          challenger: {
            prediction: { time: 15, correctProb: 0.9, quickProb: 0.5 },
            result: { time: 12, correct: true }
          },
          defender: {
            prediction: { time: 18, correctProb: 0.8, quickProb: 0.4 },
            result: { time: 15, correct: true }
          }
        }
      ],
      challenger: { totalTime: 12, correctCount: 1 },
      defender: { totalTime: 15, correctCount: 1 },
      winner: 1,
      margin: 3
    };

    const timeline = parseTimeline(battleData);

    expect(timeline.challenger).toHaveLength(1);
    expect(timeline.defender).toHaveLength(1);
    expect(timeline.challenger[0].endTime).toBe(12);
    expect(timeline.defender[0].endTime).toBe(15);
  });

  it('should handle draw scenarios', () => {
    const battleData = createMockBattleData();
    battleData.winner = 0;  // Draw

    const timeline = parseTimeline(battleData);
    const duration = calculateTotalDuration(battleData);

    expect(timeline).toBeDefined();
    expect(duration).toBeGreaterThan(0);
  });

  it('should handle battles with all correct answers', () => {
    const battleData = createMockBattleData();
    battleData.problems.forEach(p => {
      p.challenger.result.correct = true;
      p.defender.result.correct = true;
    });

    const timeline = parseTimeline(battleData);

    timeline.challenger.forEach(kf => {
      expect(kf.correct).toBe(true);
    });
  });

  it('should handle battles with all incorrect answers', () => {
    const battleData = createMockBattleData();
    battleData.problems.forEach(p => {
      p.challenger.result.correct = false;
      p.defender.result.correct = false;
    });

    const timeline = parseTimeline(battleData);

    timeline.challenger.forEach(kf => {
      expect(kf.correct).toBe(false);
    });
  });
});

describe('State Calculation Edge Cases', () => {
  it('should handle very short problem times', () => {
    const keyframes = [
      { problemIndex: 0, startTime: 0, endTime: 0.5, correct: true },
      { problemIndex: 1, startTime: 0.5, endTime: 1.0, correct: true }
    ];

    const state = getGhostStateAtTime(keyframes, 0.25);

    expect(state.completedProblems).toBe(0);
    expect(state.currentProblemProgress).toBeCloseTo(0.5);
  });

  it('should handle single problem battle', () => {
    const keyframes = [
      { problemIndex: 0, startTime: 0, endTime: 30, correct: true }
    ];

    const stateStart = getGhostStateAtTime(keyframes, 0);
    const stateMid = getGhostStateAtTime(keyframes, 15);
    const stateEnd = getGhostStateAtTime(keyframes, 30);

    expect(stateStart.totalProgress).toBe(0);
    expect(stateMid.totalProgress).toBeCloseTo(0.5);
    expect(stateEnd.totalProgress).toBeCloseTo(1.0);
  });

  it('should handle negative time (should clamp to 0)', () => {
    const keyframes = [
      { problemIndex: 0, startTime: 0, endTime: 10, correct: true }
    ];

    // Negative time should behave like time 0
    const state = getGhostStateAtTime(keyframes, -5);

    expect(state.completedProblems).toBe(0);
    expect(state.results).toHaveLength(1);
  });
});
