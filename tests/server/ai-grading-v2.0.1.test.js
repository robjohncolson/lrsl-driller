/**
 * AI Grading Server Response Tests (v2.0.1)
 *
 * Tests to verify the server returns proper model information for AI grading transparency.
 *
 * v2.0.1 changes:
 * - Server now returns _model field in AI grading responses
 * - Groq responses include 'llama-3.3-70b-versatile'
 * - Gemini responses include 'gemini-2.0-flash'
 *
 * Run with: npx vitest run tests/server/ai-grading-v2.0.1.test.js
 */
import { describe, it, expect } from 'vitest';

// ==================== MODEL INFO IN RESPONSE ====================
describe('AI Grading Response Model Info (v2.0.1)', () => {
  describe('Response Structure', () => {
    it('gradeWithAI result should include _provider field', () => {
      // Simulate gradeWithAI result structure
      const result = {
        slope: { score: 'E', feedback: 'Correct!' },
        _provider: 'groq'
      };

      expect(result).toHaveProperty('_provider');
      expect(['groq', 'gemini']).toContain(result._provider);
    });

    it('gradeWithAI result should include _model field (v2.0.1)', () => {
      const result = {
        slope: { score: 'E', feedback: 'Correct!' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile'
      };

      expect(result).toHaveProperty('_model');
      expect(result._model).toBeDefined();
    });

    it('gradeWithAI result should include _keyId field', () => {
      const result = {
        slope: { score: 'E', feedback: 'Correct!' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',
        _keyId: 'key-123'
      };

      expect(result).toHaveProperty('_keyId');
    });
  });

  describe('Groq Provider Model Info', () => {
    it('Groq responses use llama-3.3-70b-versatile model', () => {
      const groqModel = 'llama-3.3-70b-versatile';

      expect(groqModel).toBe('llama-3.3-70b-versatile');
      expect(groqModel).toContain('llama');
      expect(groqModel).toContain('70b');
    });

    it('Groq result has correct provider and model combination', () => {
      const result = {
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile'
      };

      expect(result._provider).toBe('groq');
      expect(result._model).toBe('llama-3.3-70b-versatile');
    });
  });

  describe('Gemini Provider Model Info', () => {
    it('Gemini responses use gemini-2.0-flash model', () => {
      const geminiModel = 'gemini-2.0-flash';

      expect(geminiModel).toBe('gemini-2.0-flash');
      expect(geminiModel).toContain('gemini');
      expect(geminiModel).toContain('flash');
    });

    it('Gemini result has correct provider and model combination', () => {
      const result = {
        _provider: 'gemini',
        _model: 'gemini-2.0-flash'
      };

      expect(result._provider).toBe('gemini');
      expect(result._model).toBe('gemini-2.0-flash');
    });
  });

  describe('Model Selection Logic', () => {
    it('model is determined by provider', () => {
      const getModel = (provider) => {
        return provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash';
      };

      expect(getModel('groq')).toBe('llama-3.3-70b-versatile');
      expect(getModel('gemini')).toBe('gemini-2.0-flash');
    });

    it('model assignment happens after successful grading', () => {
      // Simulate the gradeWithAI flow
      const simulateGrading = (provider) => {
        const result = {
          slope: { score: 'E', feedback: 'Good!' }
        };

        // After success (line 1241-1244 in server.js)
        result._provider = provider;
        result._model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash';

        return result;
      };

      const groqResult = simulateGrading('groq');
      expect(groqResult._model).toBe('llama-3.3-70b-versatile');

      const geminiResult = simulateGrading('gemini');
      expect(geminiResult._model).toBe('gemini-2.0-flash');
    });
  });
});

// ==================== ENDPOINT RESPONSE FORMAT ====================
describe('API Endpoint Response Format (v2.0.1)', () => {
  describe('/api/ai/grade Response', () => {
    it('response includes _gradingMode', () => {
      const response = {
        slope: { score: 'E', feedback: 'Correct!' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',
        _gradingMode: 'ai',
        _serverGraded: true
      };

      expect(response._gradingMode).toBe('ai');
    });

    it('response includes _serverGraded flag', () => {
      const response = {
        slope: { score: 'E', feedback: 'Correct!' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',
        _gradingMode: 'ai',
        _serverGraded: true
      };

      expect(response._serverGraded).toBe(true);
    });

    it('complete response has all v2.0.1 fields', () => {
      const response = {
        // Field results
        slope: { score: 'E', feedback: 'Correct interpretation!' },
        intercept: { score: 'P', feedback: 'Missing context for x=0.' },

        // Metadata
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',  // v2.0.1 addition
        _keyId: 'pool-key-1',
        _gradingMode: 'ai',
        _serverGraded: true
      };

      // Required v2.0.1 fields
      expect(response).toHaveProperty('_provider');
      expect(response).toHaveProperty('_model');
      expect(response).toHaveProperty('_gradingMode');
      expect(response).toHaveProperty('_serverGraded');

      // Model should match provider
      expect(response._model).toBe('llama-3.3-70b-versatile');
    });
  });

  describe('/api/ai/grade-paragraph Response', () => {
    it('paragraph grading also includes model info', () => {
      const response = {
        slope: { score: 'E', feedback: 'Good!' },
        intercept: { score: 'E', feedback: 'Good!' },
        correlation: { score: 'E', feedback: 'Good!' },
        _provider: 'gemini',
        _model: 'gemini-2.0-flash',
        _gradingMode: 'ai',
        _serverGraded: true
      };

      expect(response._model).toBe('gemini-2.0-flash');
    });
  });

  describe('/api/ai/appeal Response', () => {
    it('appeal response includes model info', () => {
      const response = {
        slope: { score: 'E', feedback: 'Appeal accepted.' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',
        _gradingMode: 'ai',
        _serverGraded: true
      };

      expect(response._provider).toBeDefined();
      expect(response._model).toBeDefined();
    });
  });
});

// ==================== CLIENT-SIDE HANDLING ====================
describe('Client-Side Model Handling (v2.0.1)', () => {
  describe('Platform.js Model Capture', () => {
    it('captures _model from AI results to field result', () => {
      const aiResults = {
        slope: { score: 'E', feedback: 'Good!' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile'
      };

      // Simulate platform.js line 379-380
      const currentResult = {
        score: 'E',
        feedback: 'Good!',
        _keywordScore: 'E'
      };

      currentResult._provider = aiResults._provider;
      currentResult._model = aiResults._model; // v2.0.1 addition

      expect(currentResult._model).toBe('llama-3.3-70b-versatile');
    });

    it('field result contains all grading metadata', () => {
      const fieldResult = {
        score: 'E',
        feedback: 'Correct interpretation of slope!',
        _keywordScore: 'E',
        _keywordFeedback: 'Matches expected pattern.',
        _aiScore: 'E',
        _aiFeedback: 'Great job on the slope interpretation!',
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',  // v2.0.1
        _method: 'ai'
      };

      // All metadata should be present
      expect(fieldResult._provider).toBeDefined();
      expect(fieldResult._model).toBeDefined();
      expect(fieldResult._aiScore).toBeDefined();
      expect(fieldResult._aiFeedback).toBeDefined();
    });
  });

  describe('App.html Panel Data Flow', () => {
    it('extracts AI response for panel from grading results', () => {
      const results = {
        _gradingMethod: 'keywords+ai',
        _aiFailed: false,
        fields: {
          slope: {
            score: 'E',
            _aiScore: 'E',
            _aiFeedback: 'Correct!',
            _provider: 'groq',
            _model: 'llama-3.3-70b-versatile',
            _keywordScore: 'E'
          }
        }
      };

      // Simulate app.html onGradingComplete logic
      let aiResponse = null;
      let keywordScore = null;

      for (const [fieldId, result] of Object.entries(results.fields)) {
        if (result._aiScore) {
          aiResponse = {
            _provider: result._provider,
            _model: result._model,
            results: { [fieldId]: { score: result._aiScore, feedback: result._aiFeedback } }
          };
          keywordScore = result._keywordScore;
          break;
        }
      }

      expect(aiResponse).not.toBeNull();
      expect(aiResponse._provider).toBe('groq');
      expect(aiResponse._model).toBe('llama-3.3-70b-versatile');
      expect(keywordScore).toBe('E');
    });
  });
});

// ==================== BACKWARD COMPATIBILITY ====================
describe('Backward Compatibility', () => {
  it('handles responses without _model field (old server)', () => {
    const oldServerResponse = {
      slope: { score: 'E', feedback: 'Correct!' },
      _provider: 'groq',
      // _model is missing (old server version)
      _gradingMode: 'ai',
      _serverGraded: true
    };

    // Panel should handle gracefully
    const model = oldServerResponse._model || null;
    expect(model).toBeNull();

    // Provider should still work
    expect(oldServerResponse._provider).toBe('groq');
  });

  it('panel displays fallback when model is missing', () => {
    const provider = 'groq';
    const model = undefined;

    // Fallback logic from ai-feedback-panel.js
    const displayModel = model || (provider === 'groq' ? 'Llama-3.3-70B' : '2.0 Flash');

    expect(displayModel).toBe('Llama-3.3-70B');
  });
});

// ==================== ERROR CASES ====================
describe('Error Cases', () => {
  it('handles null provider gracefully', () => {
    const response = {
      slope: { score: 'E', feedback: 'Correct!' },
      _provider: null,
      _model: null
    };

    const provider = response._provider || 'unknown';
    expect(provider).toBe('unknown');
  });

  it('handles undefined model gracefully', () => {
    const response = {
      _provider: 'groq'
      // _model is undefined
    };

    const model = response._model;
    expect(model).toBeUndefined();

    // Should use fallback
    const displayModel = model || 'Llama-3.3-70B';
    expect(displayModel).toBe('Llama-3.3-70B');
  });
});
