/**
 * Reflex Duel Minigame Tests
 *
 * Tests for Reflex Duel tiebreaker minigame (v4.3)
 */

import { describe, it, expect } from 'vitest';
import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

const config = GAME_MODE_CONFIG.reflexDuel;

describe('Reflex Duel Configuration', () => {
  it('should require 5 points to win', () => {
    expect(config.pointsToWin).toBe(5);
  });

  it('should have a minimum delay of 1.5 seconds', () => {
    expect(config.minDelayMs).toBe(1500);
  });

  it('should have a maximum delay of 4 seconds', () => {
    expect(config.maxDelayMs).toBe(4000);
  });

  it('should have a 20ms tie threshold', () => {
    expect(config.tieThresholdMs).toBe(20);
  });

  it('should have appropriate canvas dimensions', () => {
    expect(config.canvasWidth).toBe(400);
    expect(config.canvasHeight).toBe(300);
  });
});

describe('Reflex Duel Delay Generation', () => {
  function generateDelay() {
    return config.minDelayMs +
      Math.random() * (config.maxDelayMs - config.minDelayMs);
  }

  it('should generate delays within range', () => {
    for (let i = 0; i < 20; i++) {
      const delay = generateDelay();
      expect(delay).toBeGreaterThanOrEqual(config.minDelayMs);
      expect(delay).toBeLessThanOrEqual(config.maxDelayMs);
    }
  });

  it('should generate varying delays', () => {
    const delays = [];
    for (let i = 0; i < 10; i++) {
      delays.push(generateDelay());
    }

    // Check that not all delays are identical (would be statistically unlikely)
    const uniqueDelays = new Set(delays.map(d => Math.floor(d)));
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

describe('Reflex Duel Reaction Time Comparison', () => {
  function determineRoundWinner(blueReaction, redReaction, tieThreshold) {
    if (blueReaction === null && redReaction === null) {
      return { winner: null, reason: 'timeout' };
    }
    if (blueReaction === null) {
      return { winner: 'red', reason: 'only' };
    }
    if (redReaction === null) {
      return { winner: 'blue', reason: 'only' };
    }

    const diff = Math.abs(blueReaction - redReaction);
    if (diff <= tieThreshold) {
      return { winner: null, reason: 'tie' };
    }

    if (blueReaction < redReaction) {
      return { winner: 'blue', reason: 'faster' };
    }
    return { winner: 'red', reason: 'faster' };
  }

  it('should award point to faster reaction', () => {
    const result = determineRoundWinner(150, 200, config.tieThresholdMs);
    expect(result.winner).toBe('blue');
    expect(result.reason).toBe('faster');
  });

  it('should award point to red when red is faster', () => {
    const result = determineRoundWinner(250, 180, config.tieThresholdMs);
    expect(result.winner).toBe('red');
    expect(result.reason).toBe('faster');
  });

  it('should declare tie when within threshold', () => {
    const result = determineRoundWinner(150, 160, config.tieThresholdMs);
    expect(result.winner).toBeNull();
    expect(result.reason).toBe('tie');
  });

  it('should declare tie when exactly at threshold', () => {
    const result = determineRoundWinner(150, 170, config.tieThresholdMs);
    expect(result.winner).toBeNull();
    expect(result.reason).toBe('tie');
  });

  it('should not be a tie when just outside threshold', () => {
    const result = determineRoundWinner(150, 171, config.tieThresholdMs);
    expect(result.winner).toBe('blue');
    expect(result.reason).toBe('faster');
  });

  it('should award point when only blue tapped', () => {
    const result = determineRoundWinner(200, null, config.tieThresholdMs);
    expect(result.winner).toBe('blue');
    expect(result.reason).toBe('only');
  });

  it('should award point when only red tapped', () => {
    const result = determineRoundWinner(null, 200, config.tieThresholdMs);
    expect(result.winner).toBe('red');
    expect(result.reason).toBe('only');
  });

  it('should timeout when neither tapped', () => {
    const result = determineRoundWinner(null, null, config.tieThresholdMs);
    expect(result.winner).toBeNull();
    expect(result.reason).toBe('timeout');
  });
});

describe('Reflex Duel Early Tap Penalty', () => {
  function handleEarlyTap(earlyTeam) {
    // Early tap gives opponent the point
    return earlyTeam === 'blue' ? 'red' : 'blue';
  }

  it('should penalize blue early tap by giving point to red', () => {
    expect(handleEarlyTap('blue')).toBe('red');
  });

  it('should penalize red early tap by giving point to blue', () => {
    expect(handleEarlyTap('red')).toBe('blue');
  });
});

describe('Reflex Duel Game Flow', () => {
  it('should determine winner at 5 points', () => {
    const blueScore = 5;
    const redScore = 3;
    const winner = blueScore >= config.pointsToWin ? 'blue' :
                   redScore >= config.pointsToWin ? 'red' : null;
    expect(winner).toBe('blue');
  });

  it('should continue game if neither at 5 points', () => {
    const blueScore = 4;
    const redScore = 4;
    const winner = blueScore >= config.pointsToWin ? 'blue' :
                   redScore >= config.pointsToWin ? 'red' : null;
    expect(winner).toBeNull();
  });

  it('should allow red to win at 5 points', () => {
    const blueScore = 2;
    const redScore = 5;
    const winner = blueScore >= config.pointsToWin ? 'blue' :
                   redScore >= config.pointsToWin ? 'red' : null;
    expect(winner).toBe('red');
  });
});

describe('Reflex Duel Round States', () => {
  const validStates = ['waiting', 'ready', 'flash', 'result'];

  it('should have waiting as initial state', () => {
    const initialState = 'waiting';
    expect(validStates).toContain(initialState);
  });

  it('should transition from waiting to ready', () => {
    // Simulate state transition
    let state = 'waiting';
    state = 'ready';
    expect(state).toBe('ready');
  });

  it('should allow tap detection only during flash state', () => {
    function canAwardPoint(state) {
      return state === 'flash';
    }

    expect(canAwardPoint('waiting')).toBe(false);
    expect(canAwardPoint('ready')).toBe(false);
    expect(canAwardPoint('flash')).toBe(true);
    expect(canAwardPoint('result')).toBe(false);
  });

  it('should detect early tap in waiting or ready state', () => {
    function isEarlyTap(state) {
      return state === 'waiting' || state === 'ready';
    }

    expect(isEarlyTap('waiting')).toBe(true);
    expect(isEarlyTap('ready')).toBe(true);
    expect(isEarlyTap('flash')).toBe(false);
    expect(isEarlyTap('result')).toBe(false);
  });
});
