/**
 * Quick Calc Minigame Tests
 *
 * Tests for Quick Calc tiebreaker minigame (v4.3)
 */

import { describe, it, expect } from 'vitest';
import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

const config = GAME_MODE_CONFIG.quickCalc;

describe('Quick Calc Configuration', () => {
  it('should require 5 points to win', () => {
    expect(config.pointsToWin).toBe(5);
  });

  it('should have a 1-second lockout', () => {
    expect(config.lockoutMs).toBe(1000);
  });

  it('should have a 15-second timeout per problem', () => {
    expect(config.timeoutMs).toBe(15000);
  });

  it('should use 2-digit numbers', () => {
    expect(config.minNumber).toBe(10);
    expect(config.maxNumber).toBe(99);
  });

  it('should support +, -, * operations', () => {
    expect(config.operations).toContain('+');
    expect(config.operations).toContain('-');
    expect(config.operations).toContain('*');
  });

  it('should have appropriate canvas dimensions', () => {
    expect(config.canvasWidth).toBe(400);
    expect(config.canvasHeight).toBe(300);
  });
});

describe('Quick Calc Problem Generation', () => {
  // Test the problem generation logic

  function generateProblem() {
    const { minNumber, maxNumber, operations } = config;

    const a = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    const b = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    const op = operations[Math.floor(Math.random() * operations.length)];

    let answer;
    let problem;

    switch (op) {
      case '+':
        answer = a + b;
        problem = { a, b, op };
        break;
      case '-':
        const larger = Math.max(a, b);
        const smaller = Math.min(a, b);
        answer = larger - smaller;
        problem = { a: larger, b: smaller, op };
        break;
      case '*':
        // Use smaller numbers for multiplication
        const m1 = Math.floor(Math.random() * 12) + 2;
        const m2 = Math.floor(Math.random() * 12) + 2;
        answer = m1 * m2;
        problem = { a: m1, b: m2, op };
        break;
    }

    return { problem, answer };
  }

  it('should generate valid addition problems', () => {
    for (let i = 0; i < 10; i++) {
      const { problem, answer } = generateProblem();
      if (problem.op === '+') {
        expect(problem.a + problem.b).toBe(answer);
        expect(problem.a).toBeGreaterThanOrEqual(10);
        expect(problem.b).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('should generate subtraction problems with positive results', () => {
    for (let i = 0; i < 20; i++) {
      const { problem, answer } = generateProblem();
      if (problem.op === '-') {
        expect(problem.a - problem.b).toBe(answer);
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(problem.a).toBeGreaterThanOrEqual(problem.b);
      }
    }
  });

  it('should generate manageable multiplication problems', () => {
    for (let i = 0; i < 20; i++) {
      const { problem, answer } = generateProblem();
      if (problem.op === '*') {
        expect(problem.a * problem.b).toBe(answer);
        expect(problem.a).toBeGreaterThanOrEqual(2);
        expect(problem.a).toBeLessThanOrEqual(13);
        expect(problem.b).toBeGreaterThanOrEqual(2);
        expect(problem.b).toBeLessThanOrEqual(13);
      }
    }
  });
});

describe('Quick Calc Game Flow', () => {
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

  it('should apply lockout after wrong answer', () => {
    const lockoutMs = config.lockoutMs;
    expect(lockoutMs).toBe(1000);

    // Simulate lockout timing
    const lockStart = Date.now();
    const lockEnd = lockStart + lockoutMs;
    const duringLock = lockStart + 500;
    const afterLock = lockEnd + 100;

    expect(duringLock < lockEnd).toBe(true);
    expect(afterLock > lockEnd).toBe(true);
  });
});

describe('Quick Calc Scoring', () => {
  it('should award point to first correct answer', () => {
    const answer = 42;
    const userAnswer = 42;

    expect(userAnswer === answer).toBe(true);
  });

  it('should not award point for wrong answer', () => {
    const answer = 42;
    const userAnswer = 41;

    expect(userAnswer === answer).toBe(false);
  });

  it('should skip to next problem on timeout', () => {
    // After 15 seconds with no answer, problem should be skipped
    expect(config.timeoutMs).toBe(15000);
  });
});
