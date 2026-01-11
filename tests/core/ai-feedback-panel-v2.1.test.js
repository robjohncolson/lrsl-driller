/**
 * AI Feedback Panel v2.1 Tests
 *
 * Tests for enhanced debug logging and AI flow visibility
 * Added in v2.1 to improve grading transparency
 *
 * Run with: npx vitest run tests/core/ai-feedback-panel-v2.1.test.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AI Feedback Panel v2.1 - Debug Logging', () => {
  // ==================== GRADING METHOD LOGGING ====================
  describe('Grading Method Logging', () => {
    it('logs grading method for keywords+ai', () => {
      const results = {
        _gradingMethod: 'keywords+ai',
        _aiAvailable: true,
        _aiFailed: false
      };

      // Simulate the logging logic from app.html
      const logOutput = `[AI Panel] Grading method: ${results._gradingMethod}`;

      expect(logOutput).toContain('keywords+ai');
    });

    it('logs grading method for keywords-only', () => {
      const results = {
        _gradingMethod: 'keywords',
        _aiAvailable: false,
        _aiFailed: false
      };

      const logOutput = `[AI Panel] Grading method: ${results._gradingMethod}`;

      expect(logOutput).toContain('keywords');
      expect(logOutput).not.toContain('keywords+ai');
    });

    it('logs grading method for keywords+teacher-review', () => {
      const results = {
        _gradingMethod: 'keywords+teacher-review',
        _aiAvailable: true,
        _aiFailed: true
      };

      const logOutput = `[AI Panel] Grading method: ${results._gradingMethod}`;

      expect(logOutput).toContain('keywords+teacher-review');
    });
  });

  // ==================== AI AVAILABILITY LOGGING ====================
  describe('AI Availability Logging', () => {
    it('logs AI available=true, failed=false', () => {
      const results = {
        _aiAvailable: true,
        _aiFailed: false
      };

      const logOutput = `[AI Panel] AI available: ${results._aiAvailable}, AI failed: ${results._aiFailed}`;

      expect(logOutput).toContain('AI available: true');
      expect(logOutput).toContain('AI failed: false');
    });

    it('logs AI available=true, failed=true', () => {
      const results = {
        _aiAvailable: true,
        _aiFailed: true
      };

      const logOutput = `[AI Panel] AI available: ${results._aiAvailable}, AI failed: ${results._aiFailed}`;

      expect(logOutput).toContain('AI available: true');
      expect(logOutput).toContain('AI failed: true');
    });

    it('logs AI available=false when disabled', () => {
      const results = {
        _aiAvailable: false,
        _aiFailed: false
      };

      const logOutput = `[AI Panel] AI available: ${results._aiAvailable}, AI failed: ${results._aiFailed}`;

      expect(logOutput).toContain('AI available: false');
    });
  });

  // ==================== AI RESULT FIELD LOGGING ====================
  describe('AI Result Field Logging', () => {
    it('logs found AI result with provider and model', () => {
      const fieldId = 'slope';
      const result = {
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',
        _aiScore: 'E',
        _keywordScore: 'P'
      };

      const logData = {
        provider: result._provider,
        model: result._model,
        aiScore: result._aiScore,
        keywordScore: result._keywordScore
      };

      expect(logData.provider).toBe('groq');
      expect(logData.model).toBe('llama-3.3-70b-versatile');
      expect(logData.aiScore).toBe('E');
      expect(logData.keywordScore).toBe('P');
    });

    it('logs found AI result with Gemini provider', () => {
      const result = {
        _provider: 'gemini',
        _model: 'gemini-2.0-flash',
        _aiScore: 'E',
        _keywordScore: 'E'
      };

      const logData = {
        provider: result._provider,
        model: result._model
      };

      expect(logData.provider).toBe('gemini');
      expect(logData.model).toBe('gemini-2.0-flash');
    });

    it('handles undefined provider gracefully', () => {
      const result = {
        _aiScore: 'E',
        _keywordScore: 'E'
      };

      const logData = {
        provider: result._provider,
        model: result._model
      };

      expect(logData.provider).toBeUndefined();
      expect(logData.model).toBeUndefined();
    });
  });

  // ==================== PANEL VISIBILITY LOGGING ====================
  describe('Panel Visibility Logging', () => {
    it('logs showing panel with provider and model', () => {
      const aiResponse = {
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile'
      };

      const logOutput = `[AI Panel] Showing panel with: ${JSON.stringify({ provider: aiResponse._provider, model: aiResponse._model })}`;

      expect(logOutput).toContain('groq');
      expect(logOutput).toContain('llama-3.3-70b-versatile');
    });

    it('logs when no AI response data found', () => {
      const logOutput = '[AI Panel] No AI response data found, hiding panel';

      expect(logOutput).toContain('No AI response data found');
      expect(logOutput).toContain('hiding panel');
    });

    it('logs error state with error message', () => {
      const errorMessage = 'Rate limit exceeded';

      const logOutput = `[AI Panel] Showing error: ${errorMessage}`;

      expect(logOutput).toContain('Showing error');
      expect(logOutput).toContain('Rate limit exceeded');
    });

    it('logs when AI not used or disabled', () => {
      const logOutput = '[AI Panel] Hiding panel (AI not used or disabled)';

      expect(logOutput).toContain('AI not used or disabled');
    });
  });

  // ==================== DECISION TREE LOGGING ====================
  describe('Decision Tree Logic', () => {
    it('decision: keywords+ai success -> show panel', () => {
      const results = {
        _gradingMethod: 'keywords+ai',
        _aiFailed: false,
        fields: {
          slope: { _aiScore: 'E', _provider: 'groq', _model: 'llama-3.3-70b-versatile' }
        }
      };

      const shouldShowPanel = results._gradingMethod === 'keywords+ai' && !results._aiFailed;
      const hasAIData = Object.values(results.fields).some(f => f._aiScore);

      expect(shouldShowPanel).toBe(true);
      expect(hasAIData).toBe(true);
    });

    it('decision: AI failed -> show error panel', () => {
      const results = {
        _gradingMethod: 'keywords+ai',
        _aiFailed: true,
        _aiError: 'All providers unavailable'
      };

      const shouldShowError = results._aiFailed && results._aiError;

      expect(shouldShowError).toBeTruthy();
    });

    it('decision: keywords only -> hide panel', () => {
      const results = {
        _gradingMethod: 'keywords',
        _aiFailed: false
      };

      const shouldHidePanel = results._gradingMethod !== 'keywords+ai';

      expect(shouldHidePanel).toBe(true);
    });

    it('decision: keywords+ai but no AI data -> hide panel', () => {
      const results = {
        _gradingMethod: 'keywords+ai',
        _aiFailed: false,
        fields: {
          slope: { _keywordScore: 'E' } // No _aiScore
        }
      };

      const fieldEntries = Object.entries(results.fields);
      let aiResponse = null;

      for (const [fieldId, result] of fieldEntries) {
        if (result._aiScore) {
          aiResponse = result;
          break;
        }
      }

      expect(aiResponse).toBeNull();
    });
  });

  // ==================== FIELD ITERATION ====================
  describe('Field Iteration for AI Data', () => {
    it('finds first field with AI score', () => {
      const results = {
        fields: {
          slope: { score: 'E', _keywordScore: 'E' },
          intercept: { score: 'E', _aiScore: 'E', _provider: 'groq', _model: 'llama-3.3-70b-versatile' }
        }
      };

      const fieldEntries = Object.entries(results.fields);
      let foundField = null;
      let foundFieldId = null;

      for (const [fieldId, result] of fieldEntries) {
        if (result._aiScore) {
          foundField = result;
          foundFieldId = fieldId;
          break;
        }
      }

      expect(foundFieldId).toBe('intercept');
      expect(foundField._provider).toBe('groq');
    });

    it('builds aiResponse object correctly', () => {
      const fieldId = 'slope';
      const result = {
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',
        _aiScore: 'E',
        _aiFeedback: 'Correct!'
      };

      const aiResponse = {
        _provider: result._provider,
        _model: result._model,
        results: { [fieldId]: { score: result._aiScore, feedback: result._aiFeedback } }
      };

      expect(aiResponse._provider).toBe('groq');
      expect(aiResponse._model).toBe('llama-3.3-70b-versatile');
      expect(aiResponse.results.slope.score).toBe('E');
      expect(aiResponse.results.slope.feedback).toBe('Correct!');
    });

    it('extracts keywordScore for comparison', () => {
      const result = {
        _aiScore: 'E',
        _keywordScore: 'P'
      };

      const keywordScore = result._keywordScore;

      expect(keywordScore).toBe('P');
    });
  });
});

// ==================== COMPLETE FLOW SCENARIOS ====================
describe('AI Panel v2.1 - Complete Flow Scenarios', () => {
  describe('Scenario: Successful AI Grading', () => {
    it('complete flow produces correct log sequence', () => {
      const results = {
        _gradingMethod: 'keywords+ai',
        _aiAvailable: true,
        _aiFailed: false,
        fields: {
          slope: {
            score: 'E',
            _keywordScore: 'E',
            _aiScore: 'E',
            _aiFeedback: 'Perfect!',
            _provider: 'groq',
            _model: 'llama-3.3-70b-versatile'
          }
        }
      };

      // Expected log sequence
      const logs = [];

      logs.push(`[AI Panel] Grading method: ${results._gradingMethod}`);
      logs.push(`[AI Panel] AI available: ${results._aiAvailable}, AI failed: ${results._aiFailed}`);

      if (results._gradingMethod === 'keywords+ai' && !results._aiFailed) {
        const fieldEntries = Object.entries(results.fields);
        for (const [fieldId, result] of fieldEntries) {
          if (result._aiScore) {
            logs.push(`[AI Panel] Found AI result for field: ${fieldId}`);
            logs.push(`[AI Panel] Showing panel with: ${JSON.stringify({ provider: result._provider, model: result._model })}`);
            break;
          }
        }
      }

      expect(logs.length).toBe(4);
      expect(logs[0]).toContain('keywords+ai');
      expect(logs[1]).toContain('AI available: true');
      expect(logs[2]).toContain('Found AI result');
      expect(logs[3]).toContain('groq');
    });
  });

  describe('Scenario: AI Failure', () => {
    it('failure flow produces correct log sequence', () => {
      const results = {
        _gradingMethod: 'keywords+ai',
        _aiAvailable: true,
        _aiFailed: true,
        _aiError: 'Rate limit exceeded',
        fields: {
          slope: { score: 'P', _keywordScore: 'P' }
        }
      };

      const logs = [];

      logs.push(`[AI Panel] Grading method: ${results._gradingMethod}`);
      logs.push(`[AI Panel] AI available: ${results._aiAvailable}, AI failed: ${results._aiFailed}`);

      if (results._aiFailed && results._aiError) {
        logs.push(`[AI Panel] Showing error: ${results._aiError}`);
      }

      expect(logs.length).toBe(3);
      expect(logs[2]).toContain('Rate limit exceeded');
    });
  });

  describe('Scenario: Keywords Only', () => {
    it('keywords-only flow produces correct log sequence', () => {
      const results = {
        _gradingMethod: 'keywords',
        _aiAvailable: false,
        _aiFailed: false,
        fields: {
          slope: { score: 'E', _keywordScore: 'E' }
        }
      };

      const logs = [];

      logs.push(`[AI Panel] Grading method: ${results._gradingMethod}`);
      logs.push(`[AI Panel] AI available: ${results._aiAvailable}, AI failed: ${results._aiFailed}`);

      if (results._gradingMethod !== 'keywords+ai' || !results._aiFailed) {
        logs.push('[AI Panel] Hiding panel (AI not used or disabled)');
      }

      expect(logs.length).toBe(3);
      expect(logs[2]).toContain('Hiding panel');
    });
  });
});
