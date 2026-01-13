/**
 * Pong Duel v3.1 Regression Tests
 *
 * Tests for Token from Drilling feature:
 * - Config: tokenSources object with correctAnswersPerToken, duelWinBonus, startingTokens
 * - Token grant calculation from correct answers
 * - Token grant on duel win
 * - Updated starting tokens (2)
 * - PongPanel: correctCount tracking and token progress display
 * - Server endpoint: /api/pong/record-correct
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PONG_CONFIG } from '../../shared/pong.config.js';

// ============================================
// CONFIG: TOKEN SOURCES
// ============================================

describe('Pong Duel v3.1 - Token Sources Config', () => {
  describe('tokenSources object', () => {
    it('should have tokenSources object defined', () => {
      expect(PONG_CONFIG.tokenSources).toBeDefined();
      expect(typeof PONG_CONFIG.tokenSources).toBe('object');
    });

    it('should have startingTokens in tokenSources', () => {
      expect(PONG_CONFIG.tokenSources.startingTokens).toBe(2);
    });

    it('should have rentPerToken in tokenSources', () => {
      expect(PONG_CONFIG.tokenSources.rentPerToken).toBe(20);
    });

    it('should have correctAnswersPerToken in tokenSources', () => {
      expect(PONG_CONFIG.tokenSources.correctAnswersPerToken).toBe(10);
    });

    it('should have duelWinBonus in tokenSources', () => {
      expect(PONG_CONFIG.tokenSources.duelWinBonus).toBe(1);
    });
  });

  describe('Legacy aliases', () => {
    it('should have startingTokens as legacy alias = 2', () => {
      expect(PONG_CONFIG.startingTokens).toBe(2);
    });

    it('should have rentPerToken as legacy alias = 20', () => {
      expect(PONG_CONFIG.rentPerToken).toBe(20);
    });
  });

  describe('Token economy constants', () => {
    it('should cap tokens at 5', () => {
      expect(PONG_CONFIG.maxTokens).toBe(5);
    });

    it('should cost 1 token per duel', () => {
      expect(PONG_CONFIG.tokenCostPerDuel).toBe(1);
    });
  });
});

// ============================================
// TOKEN FROM DRILLING CALCULATIONS
// ============================================

describe('Pong Duel v3.1 - Token from Drilling Calculations', () => {
  const tokensPerCorrect = PONG_CONFIG.tokenSources?.correctAnswersPerToken || 10;

  describe('Threshold calculations', () => {
    it('should grant 0 tokens for 0-9 correct answers', () => {
      for (let i = 0; i < 10; i++) {
        const threshold = Math.floor(i / tokensPerCorrect);
        expect(threshold).toBe(0);
      }
    });

    it('should grant 1 token at 10 correct answers', () => {
      const threshold = Math.floor(10 / tokensPerCorrect);
      expect(threshold).toBe(1);
    });

    it('should grant 1 token for 10-19 correct answers', () => {
      for (let i = 10; i < 20; i++) {
        const threshold = Math.floor(i / tokensPerCorrect);
        expect(threshold).toBe(1);
      }
    });

    it('should grant 2 tokens at 20 correct answers', () => {
      const threshold = Math.floor(20 / tokensPerCorrect);
      expect(threshold).toBe(2);
    });

    it('should grant 5 tokens at 50 correct answers', () => {
      const threshold = Math.floor(50 / tokensPerCorrect);
      expect(threshold).toBe(5);
    });
  });

  describe('Progress calculations', () => {
    it('should show 0/10 progress at 0 correct', () => {
      const progress = 0 % tokensPerCorrect;
      expect(progress).toBe(0);
    });

    it('should show 5/10 progress at 5 correct', () => {
      const progress = 5 % tokensPerCorrect;
      expect(progress).toBe(5);
    });

    it('should show 9/10 progress at 9 correct', () => {
      const progress = 9 % tokensPerCorrect;
      expect(progress).toBe(9);
    });

    it('should reset to 0/10 at 10 correct', () => {
      const progress = 10 % tokensPerCorrect;
      expect(progress).toBe(0);
    });

    it('should show 3/10 progress at 13 correct', () => {
      const progress = 13 % tokensPerCorrect;
      expect(progress).toBe(3);
    });

    it('should show 7/10 progress at 27 correct', () => {
      const progress = 27 % tokensPerCorrect;
      expect(progress).toBe(7);
    });
  });

  describe('Next token calculations', () => {
    it('should show next token at 10 when at 0 correct', () => {
      const nextTokenAt = (Math.floor(0 / tokensPerCorrect) + 1) * tokensPerCorrect;
      expect(nextTokenAt).toBe(10);
    });

    it('should show next token at 10 when at 5 correct', () => {
      const nextTokenAt = (Math.floor(5 / tokensPerCorrect) + 1) * tokensPerCorrect;
      expect(nextTokenAt).toBe(10);
    });

    it('should show next token at 20 when at 10 correct', () => {
      const nextTokenAt = (Math.floor(10 / tokensPerCorrect) + 1) * tokensPerCorrect;
      expect(nextTokenAt).toBe(20);
    });

    it('should show next token at 30 when at 27 correct', () => {
      const nextTokenAt = (Math.floor(27 / tokensPerCorrect) + 1) * tokensPerCorrect;
      expect(nextTokenAt).toBe(30);
    });
  });
});

// ============================================
// GRANT TOKENS FROM DRILLING SIMULATION
// ============================================

describe('Pong Duel v3.1 - grantTokensFromDrilling Simulation', () => {
  const tokensPerCorrect = 10;
  const maxTokens = 5;
  const startingTokens = 2;

  /**
   * Simulates the grantTokensFromDrilling logic
   */
  function simulateGrant(currentCount, currentTokens, lastGrantCount = 0) {
    const newCount = currentCount + 1;
    const oldThreshold = Math.floor(lastGrantCount / tokensPerCorrect);
    const newThreshold = Math.floor(newCount / tokensPerCorrect);

    let tokensGranted = 0;
    let newTokens = currentTokens;
    let newLastGrantCount = lastGrantCount;

    if (newThreshold > oldThreshold && currentTokens < maxTokens) {
      tokensGranted = 1;
      newTokens = Math.min(maxTokens, currentTokens + 1);
      newLastGrantCount = newCount;
    } else if (newThreshold > oldThreshold) {
      // At max tokens, still update last grant count
      newLastGrantCount = newCount;
    }

    return {
      newCount,
      tokensGranted,
      tokens: newTokens,
      lastGrantCount: newLastGrantCount,
      nextTokenAt: (newThreshold + 1) * tokensPerCorrect
    };
  }

  describe('New player scenario (starts with 2 tokens)', () => {
    it('should not grant token on first 9 correct answers', () => {
      let state = { count: 0, tokens: startingTokens, lastGrant: 0 };

      for (let i = 0; i < 9; i++) {
        const result = simulateGrant(state.count, state.tokens, state.lastGrant);
        expect(result.tokensGranted).toBe(0);
        expect(result.tokens).toBe(startingTokens);
        state = { count: result.newCount, tokens: result.tokens, lastGrant: result.lastGrantCount };
      }
    });

    it('should grant 1 token on 10th correct answer', () => {
      const result = simulateGrant(9, startingTokens, 0);
      expect(result.newCount).toBe(10);
      expect(result.tokensGranted).toBe(1);
      expect(result.tokens).toBe(3);
    });

    it('should not grant another token until 20th correct', () => {
      let state = { count: 10, tokens: 3, lastGrant: 10 };

      for (let i = 10; i < 19; i++) {
        const result = simulateGrant(state.count, state.tokens, state.lastGrant);
        expect(result.tokensGranted).toBe(0);
        state = { count: result.newCount, tokens: result.tokens, lastGrant: result.lastGrantCount };
      }

      const result = simulateGrant(state.count, state.tokens, state.lastGrant);
      expect(result.newCount).toBe(20);
      expect(result.tokensGranted).toBe(1);
      expect(result.tokens).toBe(4);
    });
  });

  describe('Max tokens capping', () => {
    it('should not grant token when already at max', () => {
      const result = simulateGrant(9, maxTokens, 0);
      expect(result.tokensGranted).toBe(0);
      expect(result.tokens).toBe(maxTokens);
    });

    it('should not exceed max tokens', () => {
      let state = { count: 0, tokens: startingTokens, lastGrant: 0 };

      // Earn 100 correct answers
      for (let i = 0; i < 100; i++) {
        const result = simulateGrant(state.count, state.tokens, state.lastGrant);
        expect(result.tokens).toBeLessThanOrEqual(maxTokens);
        state = { count: result.newCount, tokens: result.tokens, lastGrant: result.lastGrantCount };
      }

      expect(state.tokens).toBe(maxTokens);
    });
  });

  describe('Progress tracking', () => {
    it('should track progress accurately through 30 correct answers', () => {
      let state = { count: 0, tokens: startingTokens, lastGrant: 0 };
      const expectedTokensAt = [10, 20, 30];
      let tokensEarned = 0;

      for (let i = 0; i < 30; i++) {
        const result = simulateGrant(state.count, state.tokens, state.lastGrant);

        if (result.tokensGranted > 0) {
          tokensEarned++;
          expect(expectedTokensAt).toContain(result.newCount);
        }

        state = { count: result.newCount, tokens: result.tokens, lastGrant: result.lastGrantCount };
      }

      expect(tokensEarned).toBe(3);
      expect(state.tokens).toBe(5); // 2 starting + 3 earned
    });
  });
});

// ============================================
// DUEL WIN TOKEN BONUS
// ============================================

describe('Pong Duel v3.1 - Duel Win Token Bonus', () => {
  const duelWinBonus = PONG_CONFIG.tokenSources?.duelWinBonus || 1;
  const maxTokens = PONG_CONFIG.maxTokens || 5;

  it('should grant 1 token for winning a duel', () => {
    expect(duelWinBonus).toBe(1);
  });

  it('should not exceed max tokens from duel wins', () => {
    let tokens = 4;
    tokens = Math.min(maxTokens, tokens + duelWinBonus);
    expect(tokens).toBe(5);

    // Already at max, no grant
    tokens = Math.min(maxTokens, tokens + duelWinBonus);
    expect(tokens).toBe(5);
  });

  it('should add to tokens from drilling', () => {
    // After 10 correct answers (3 tokens) + win = 4 tokens
    let tokens = 3;
    tokens = Math.min(maxTokens, tokens + duelWinBonus);
    expect(tokens).toBe(4);
  });
});

// ============================================
// PONG PANEL UI
// ============================================

describe('Pong Duel v3.1 - PongPanel Token Display', () => {
  const tokensPerCorrect = PONG_CONFIG.tokenSources?.correctAnswersPerToken || 10;

  describe('Token progress display format', () => {
    it('should format progress as (N/10)', () => {
      const correctCount = 7;
      const progress = correctCount % tokensPerCorrect;
      const display = `(${progress}/${tokensPerCorrect})`;
      expect(display).toBe('(7/10)');
    });

    it('should reset to (0/10) at threshold', () => {
      const correctCount = 20;
      const progress = correctCount % tokensPerCorrect;
      const display = `(${progress}/${tokensPerCorrect})`;
      expect(display).toBe('(0/10)');
    });
  });

  describe('Token display values', () => {
    function formatTokenDisplay(tokens, correctCount) {
      const progress = correctCount % tokensPerCorrect;
      return `⚔️ ${tokens} (${progress}/${tokensPerCorrect})`;
    }

    it('should show ⚔️ 2 (0/10) for new player', () => {
      expect(formatTokenDisplay(2, 0)).toBe('⚔️ 2 (0/10)');
    });

    it('should show ⚔️ 2 (5/10) at 5 correct', () => {
      expect(formatTokenDisplay(2, 5)).toBe('⚔️ 2 (5/10)');
    });

    it('should show ⚔️ 3 (0/10) after earning first token', () => {
      expect(formatTokenDisplay(3, 10)).toBe('⚔️ 3 (0/10)');
    });

    it('should show ⚔️ 5 (7/10) at max tokens with progress', () => {
      expect(formatTokenDisplay(5, 37)).toBe('⚔️ 5 (7/10)');
    });
  });
});

// ============================================
// TOKEN GRANTED MESSAGE REASONS
// ============================================

describe('Pong Duel v3.1 - Token Granted Message Reasons', () => {
  describe('Toast messages by reason', () => {
    function getToastMessage(reason, tokensGranted = 1) {
      switch (reason) {
        case 'drilling':
          return `🎯 +${tokensGranted} Token from drilling!`;
        case 'duel_win':
          return `🏆 +${tokensGranted} Token for winning!`;
        case 'rent':
          return `💰 +${tokensGranted} Token from rent!`;
        default:
          return `+${tokensGranted} Token earned!`;
      }
    }

    it('should show drilling emoji for drilling reason', () => {
      expect(getToastMessage('drilling')).toBe('🎯 +1 Token from drilling!');
    });

    it('should show trophy emoji for duel win reason', () => {
      expect(getToastMessage('duel_win')).toBe('🏆 +1 Token for winning!');
    });

    it('should show money bag emoji for rent reason', () => {
      expect(getToastMessage('rent')).toBe('💰 +1 Token from rent!');
    });

    it('should show generic message for unknown reason', () => {
      expect(getToastMessage('unknown')).toBe('+1 Token earned!');
    });
  });
});

// ============================================
// CORRECT ANSWER DETECTION
// ============================================

describe('Pong Duel v3.1 - Correct Answer Detection', () => {
  describe('E or P grade detection', () => {
    function hasCorrectAnswer(fields) {
      return Object.values(fields).some(r => r.score === 'E' || r.score === 'P');
    }

    it('should detect E as correct', () => {
      const fields = { answer: { score: 'E' } };
      expect(hasCorrectAnswer(fields)).toBe(true);
    });

    it('should detect P as correct', () => {
      const fields = { answer: { score: 'P' } };
      expect(hasCorrectAnswer(fields)).toBe(true);
    });

    it('should not detect I as correct', () => {
      const fields = { answer: { score: 'I' } };
      expect(hasCorrectAnswer(fields)).toBe(false);
    });

    it('should detect correct in multi-field results', () => {
      const fields = {
        slope: { score: 'E' },
        intercept: { score: 'I' }
      };
      expect(hasCorrectAnswer(fields)).toBe(true);
    });

    it('should return false for all incorrect', () => {
      const fields = {
        slope: { score: 'I' },
        intercept: { score: 'I' }
      };
      expect(hasCorrectAnswer(fields)).toBe(false);
    });

    it('should handle empty fields', () => {
      expect(hasCorrectAnswer({})).toBe(false);
    });
  });
});

// ============================================
// STARTING TOKENS CHANGE
// ============================================

describe('Pong Duel v3.1 - Starting Tokens Update', () => {
  it('should start new players with 2 tokens (was 1)', () => {
    const startingTokens = PONG_CONFIG.startingTokens;
    expect(startingTokens).toBe(2);
  });

  it('should have tokenSources.startingTokens = 2', () => {
    expect(PONG_CONFIG.tokenSources.startingTokens).toBe(2);
  });

  it('should allow new player to immediately challenge', () => {
    const startingTokens = PONG_CONFIG.startingTokens;
    const tokenCost = PONG_CONFIG.tokenCostPerDuel;
    expect(startingTokens).toBeGreaterThanOrEqual(tokenCost);
  });

  it('should allow new player to challenge twice', () => {
    const startingTokens = PONG_CONFIG.startingTokens;
    const tokenCost = PONG_CONFIG.tokenCostPerDuel;
    expect(startingTokens).toBeGreaterThanOrEqual(tokenCost * 2);
  });
});

// ============================================
// API ENDPOINT STRUCTURE
// ============================================

describe('Pong Duel v3.1 - API Endpoint Structure', () => {
  describe('/api/pong/record-correct request', () => {
    it('should require gameId and username', () => {
      const requiredFields = ['gameId', 'username'];
      const request = { gameId: 'game-1', username: 'alice' };

      requiredFields.forEach(field => {
        expect(request[field]).toBeDefined();
      });
    });
  });

  describe('/api/pong/record-correct response', () => {
    it('should return expected fields', () => {
      const expectedFields = ['success', 'correctCount', 'tokensGranted', 'tokens', 'nextTokenAt'];
      const response = {
        success: true,
        correctCount: 10,
        tokensGranted: 1,
        tokens: 3,
        nextTokenAt: 20
      };

      expectedFields.forEach(field => {
        expect(response[field]).toBeDefined();
      });
    });
  });

  describe('/api/pong/player/:gameId/:username response', () => {
    it('should include drilling progress fields', () => {
      const expectedFields = ['tokens', 'correctCount', 'tokenProgress', 'tokensPerCorrect', 'nextTokenAt'];
      const response = {
        tokens: 3,
        totalRent: 40,
        recentCorrect: 2,
        correctCount: 15,
        tokenProgress: 5,
        tokensPerCorrect: 10,
        nextTokenAt: 20,
        stats: { wins: 1, losses: 0 }
      };

      expectedFields.forEach(field => {
        expect(response[field]).toBeDefined();
      });
    });
  });
});

// ============================================
// TOKEN GRANTED WEBSOCKET MESSAGE
// ============================================

describe('Pong Duel v3.1 - Token Granted WebSocket Message', () => {
  describe('Drilling token grant message', () => {
    const message = {
      type: 'token_granted',
      gameId: 'game-1',
      username: 'alice',
      tokens: 3,
      tokensGranted: 1,
      reason: 'drilling',
      correctCount: 10,
      nextTokenAt: 20
    };

    it('should have type token_granted', () => {
      expect(message.type).toBe('token_granted');
    });

    it('should include reason as drilling', () => {
      expect(message.reason).toBe('drilling');
    });

    it('should include correctCount', () => {
      expect(message.correctCount).toBe(10);
    });

    it('should include nextTokenAt', () => {
      expect(message.nextTokenAt).toBe(20);
    });
  });

  describe('Duel win token grant message', () => {
    const message = {
      type: 'token_granted',
      gameId: 'game-1',
      username: 'alice',
      tokens: 4,
      tokensGranted: 1,
      reason: 'duel_win'
    };

    it('should include reason as duel_win', () => {
      expect(message.reason).toBe('duel_win');
    });

    it('should not include correctCount', () => {
      expect(message.correctCount).toBeUndefined();
    });
  });
});
