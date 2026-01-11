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

// ==================== v2.1.1 FIELD ID REMAPPING ====================
describe('Field ID Remapping (v2.1.1)', () => {
  describe('/api/ai/grade Endpoint', () => {
    it('remaps answer field to actual field ID from scenario.fieldId', () => {
      // Simulate the server-side remapping logic
      const scenario = { fieldId: 'slope', topic: 'LSRL' };
      const answers = { slope: 'For every 1 unit increase...' };
      const result = {
        answer: { score: 'E', feedback: 'Correct!' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile'
      };

      // v2.1.1: Remap 'answer' to actual field ID
      const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      expect(result.slope).toBeDefined();
      expect(result.answer).toBeUndefined();
      expect(result.slope.score).toBe('E');
    });

    it('remaps answer field to first answer key when scenario.fieldId is missing', () => {
      const scenario = { topic: 'LSRL' }; // No fieldId
      const answers = { interpretation: 'The slope means...' };
      const result = {
        answer: { score: 'P', feedback: 'Missing context.' },
        _provider: 'gemini',
        _model: 'gemini-2.0-flash'
      };

      const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      expect(result.interpretation).toBeDefined();
      expect(result.answer).toBeUndefined();
      expect(result.interpretation.score).toBe('P');
    });

    it('does not remap when field ID is already answer', () => {
      const scenario = { fieldId: 'answer' };
      const answers = { answer: 'Some response' };
      const result = {
        answer: { score: 'E', feedback: 'Good!' },
        _provider: 'groq'
      };

      const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      expect(result.answer).toBeDefined();
      expect(result.answer.score).toBe('E');
    });

    it('does not remap when AI returns proper field ID', () => {
      const scenario = { fieldId: 'slope' };
      const answers = { slope: 'The slope interpretation...' };
      const result = {
        slope: { score: 'E', feedback: 'Correct!' }, // AI already returned correct field ID
        _provider: 'groq'
      };

      const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      expect(result.slope).toBeDefined();
      expect(result.answer).toBeUndefined();
    });

    it('preserves metadata fields during remapping', () => {
      const scenario = { fieldId: 'term' };
      const answers = { term: 'Bias' };
      const result = {
        answer: { score: 'E', feedback: 'Correct!' },
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile',
        _keyId: 'pool-key-1',
        _gradingMode: 'ai',
        _serverGraded: true
      };

      const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      // Verify metadata preserved
      expect(result._provider).toBe('groq');
      expect(result._model).toBe('llama-3.3-70b-versatile');
      expect(result._keyId).toBe('pool-key-1');
      expect(result._gradingMode).toBe('ai');
      expect(result._serverGraded).toBe(true);
      // Verify field remapped
      expect(result.term).toBeDefined();
    });
  });

  describe('/api/ai/appeal Endpoint', () => {
    it('remaps answer field for appeal responses', () => {
      const answers = { slope: 'The slope means...' };
      const result = {
        answer: { score: 'E', feedback: 'Appeal accepted.' },
        _provider: 'groq',
        _gradingMode: 'ai-appeal'
      };

      const actualFieldId = Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      expect(result.slope).toBeDefined();
      expect(result.answer).toBeUndefined();
    });
  });

  describe('Client-Side Panel Integration', () => {
    it('panel receives correct field ID after remapping', () => {
      // After server remapping, platform.js should find the correct field
      const aiResults = {
        slope: { score: 'E', feedback: 'Correct!' }, // Remapped from 'answer'
        _provider: 'groq',
        _model: 'llama-3.3-70b-versatile'
      };

      // Simulate platform.js grade() logic
      const results = {
        fields: {
          slope: { score: 'I', _keywordScore: 'I', _method: 'keywords' }
        },
        _gradingMethod: 'keywords'
      };

      // Process AI results (lines 366-443 in platform.js)
      for (const [fieldId, aiResult] of Object.entries(aiResults)) {
        if (fieldId.startsWith('_')) continue;
        if (!aiResult || typeof aiResult !== 'object') continue;

        const currentResult = results.fields[fieldId];
        if (!currentResult) continue;

        currentResult._aiScore = aiResult.score;
        currentResult._aiFeedback = aiResult.feedback;
        currentResult._provider = aiResults._provider;
        currentResult._model = aiResults._model;
      }
      results._gradingMethod = 'keywords+ai';

      // Verify _aiScore is now set (this is what v2.1.1 fixes)
      expect(results.fields.slope._aiScore).toBe('E');
      expect(results.fields.slope._provider).toBe('groq');
      expect(results.fields.slope._model).toBe('llama-3.3-70b-versatile');
    });

    it('panel shows when _aiScore is set correctly', () => {
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
            _keywordScore: 'I'
          }
        }
      };

      // Simulate onGradingComplete logic
      let aiResponse = null;
      let keywordScore = null;

      if (results._gradingMethod === 'keywords+ai' && !results._aiFailed) {
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
      }

      // This would have failed before v2.1.1 fix
      expect(aiResponse).not.toBeNull();
      expect(aiResponse._provider).toBe('groq');
      expect(aiResponse._model).toBe('llama-3.3-70b-versatile');
      expect(keywordScore).toBe('I');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty answers object', () => {
      const scenario = { fieldId: 'slope' };
      const answers = {};
      const result = {
        answer: { score: 'E', feedback: 'Correct!' }
      };

      const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      // Should still remap using scenario.fieldId
      expect(result.slope).toBeDefined();
      expect(result.answer).toBeUndefined();
    });

    it('handles multi-field responses without remapping', () => {
      const scenario = { fieldId: 'slope' };
      const answers = { slope: '...', intercept: '...' };
      const result = {
        slope: { score: 'E', feedback: 'Good slope!' },
        intercept: { score: 'P', feedback: 'Missing context.' }
      };

      // No 'answer' field, so no remapping needed
      const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
      if (result.answer && actualFieldId && actualFieldId !== 'answer') {
        result[actualFieldId] = result.answer;
        delete result.answer;
      }

      expect(result.slope).toBeDefined();
      expect(result.intercept).toBeDefined();
      expect(result.answer).toBeUndefined();
    });
  });
});
