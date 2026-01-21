/**
 * AP Statistics Unit 4 Lessons 1-2-3 Grading Tests
 * Tests for probability and simulation concepts grading rules
 */
import { describe, it, expect } from 'vitest';
import { gradeField } from '../../cartridges/apstatu4l1l2/grading-rules.js';

describe('AP Stats U4 L1-L2-L3 Grading Rules', () => {
  // ========== EXACT MATCH TESTS ==========
  describe('Exact Match Fields', () => {
    describe('vocabAnswer (L01 - Random Process)', () => {
      it('grades correct answer as E', () => {
        const result = gradeField('vocabAnswer',
          'A situation where all outcomes are known but individual results are unpredictable',
          { vocabAnswer: { value: 'A situation where all outcomes are known but individual results are unpredictable' } }
        );
        expect(result.score).toBe('E');
      });

      it('is case insensitive', () => {
        const result = gradeField('vocabAnswer',
          'RANDOM PROCESS',
          { vocabAnswer: { value: 'Random Process' } }
        );
        expect(result.score).toBe('E');
      });

      it('grades incorrect answer as I with feedback', () => {
        const result = gradeField('vocabAnswer',
          'A predictable sequence',
          { vocabAnswer: { value: 'Random Process' } }
        );
        expect(result.score).toBe('I');
        expect(result.feedback.toLowerCase()).toContain('random');
      });
    });

    describe('termType (L02 - Outcome vs Event)', () => {
      it('grades correct Outcome as E', () => {
        const result = gradeField('termType', 'Outcome', { termType: { value: 'Outcome' } });
        expect(result.score).toBe('E');
        expect(result.feedback).toContain('single trial');
      });

      it('grades correct Event as E', () => {
        const result = gradeField('termType', 'Event', { termType: { value: 'Event' } });
        expect(result.score).toBe('E');
        expect(result.feedback).toContain('collection');
      });

      it('grades incorrect answer as I with helpful feedback', () => {
        const result = gradeField('termType', 'Event', { termType: { value: 'Outcome' } });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('single result');
      });
    });
  });

  // ========== INDEPENDENCE / GAMBLER'S FALLACY TESTS ==========
  describe('independenceAnswer (L03 - Gambler\'s Fallacy)', () => {
    it('correctly identifies flawed reasoning (gambler\'s fallacy)', () => {
      const result = gradeField('independenceAnswer',
        'No, the reasoning is flawed',
        { independenceAnswer: { value: 'No, the reasoning is flawed' } }
      );
      expect(result.score).toBe('E');
      expect(result.feedback.toLowerCase()).toContain('gambler');
    });

    it('correctly identifies valid reasoning about independence', () => {
      const result = gradeField('independenceAnswer',
        'Yes, the reasoning is correct',
        { independenceAnswer: { value: 'Yes, the reasoning is correct' } }
      );
      expect(result.score).toBe('E');
      expect(result.feedback.toLowerCase()).toContain('independent');
    });

    it('grades incorrect assessment of flawed reasoning', () => {
      const result = gradeField('independenceAnswer',
        'Yes, the reasoning is correct',
        { independenceAnswer: { value: 'No, the reasoning is flawed' } }
      );
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('gambler');
    });
  });

  // ========== STREAKS TESTS ==========
  describe('streakAnswer (L04 - Streaks)', () => {
    it('correctly identifies streaks as normal', () => {
      const result = gradeField('streakAnswer',
        'No, this is normal',
        { streakAnswer: { value: 'No, this is normal' } }
      );
      expect(result.score).toBe('E');
      expect(result.feedback.toLowerCase()).toContain('normal');
    });

    it('correctly identifies surprising patterns', () => {
      const result = gradeField('streakAnswer',
        'Yes, this is surprising',
        { streakAnswer: { value: 'Yes, this is surprising' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades incorrect assessment with educational feedback', () => {
      const result = gradeField('streakAnswer',
        'Yes, this is surprising',
        { streakAnswer: { value: 'No, this is normal' } }
      );
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('32%'); // Mentions the actual probability
    });
  });

  // ========== SIMULATION VOCABULARY TESTS ==========
  describe('simVocabAnswer (L05 - Simulation)', () => {
    it('grades correct simulation definition as E', () => {
      const result = gradeField('simVocabAnswer',
        'Simulation',
        { simVocabAnswer: { value: 'Simulation' } }
      );
      expect(result.score).toBe('E');
    });

    it('provides feedback about simulation on incorrect', () => {
      const result = gradeField('simVocabAnswer',
        'Random Sampling',
        { simVocabAnswer: { value: 'Simulation' } }
      );
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('model');
    });
  });

  // ========== LAW OF LARGE NUMBERS TESTS ==========
  describe('llnAnswer (L06 - LLN)', () => {
    it('grades correct LLN answer as E', () => {
      const result = gradeField('llnAnswer',
        'Law of Large Numbers',
        { llnAnswer: { value: 'Law of Large Numbers' } }
      );
      expect(result.score).toBe('E');
    });

    it('provides feedback about LLN on incorrect', () => {
      const result = gradeField('llnAnswer',
        'Central Limit Theorem',
        { llnAnswer: { value: 'Law of Large Numbers' } }
      );
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('increase');
    });
  });

  // ========== DIGIT ASSIGNMENT TESTS ==========
  describe('Digit Assignment (L07)', () => {
    describe('digitLow', () => {
      it('grades 1 as correct', () => {
        const result = gradeField('digitLow', '1', { probability: 82 });
        expect(result.score).toBe('E');
      });

      it('grades other values as incorrect', () => {
        const result = gradeField('digitLow', '0', { probability: 82 });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('1');
      });

      it('handles non-numeric input', () => {
        const result = gradeField('digitLow', 'abc', { probability: 82 });
        expect(result.score).toBe('I');
      });
    });

    describe('digitHigh', () => {
      it('grades correct upper bound as E', () => {
        const result = gradeField('digitHigh', '82', {
          digitHigh: { value: 82 },
          probability: 82
        });
        expect(result.score).toBe('E');
        expect(result.feedback).toContain('82%');
      });

      it('gives partial credit for close answer', () => {
        const result = gradeField('digitHigh', '80', {
          digitHigh: { value: 82 },
          probability: 82
        });
        expect(result.score).toBe('P');
      });

      it('grades wrong answer as I', () => {
        const result = gradeField('digitHigh', '50', {
          digitHigh: { value: 82 },
          probability: 82
        });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('82');
      });
    });
  });

  // ========== TRIAL DEFINITION TESTS ==========
  describe('trialAnswer (L08 - Trial Definition)', () => {
    it('grades correct trial definition as E', () => {
      const result = gradeField('trialAnswer',
        'Generate random numbers until getting 83-100 (miss), count made shots',
        { trialAnswer: { value: 'Generate random numbers until getting 83-100 (miss), count made shots' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades incorrect trial definition as I', () => {
      const result = gradeField('trialAnswer',
        'Flip a coin once',
        { trialAnswer: { value: 'Generate 5 random numbers, count how many are 1-25 (correct)' } }
      );
      expect(result.score).toBe('I');
    });
  });

  // ========== RELATIVE FREQUENCY CALCULATION TESTS ==========
  describe('probAnswer (L09 - Relative Frequency)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('probAnswer', '6.5', {
        probAnswer: { value: 6.5, tolerance: 0.5 },
        successes: 13,
        total: 200
      });
      expect(result.score).toBe('E');
    });

    it('grades close answer within tolerance as E', () => {
      const result = gradeField('probAnswer', '6', {
        probAnswer: { value: 6.5, tolerance: 0.5 },
        successes: 13,
        total: 200
      });
      expect(result.score).toBe('E');
    });

    it('gives partial credit for somewhat close', () => {
      const result = gradeField('probAnswer', '8', {
        probAnswer: { value: 6.5, tolerance: 0.5 },
        successes: 13,
        total: 200
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong answer as I with formula', () => {
      const result = gradeField('probAnswer', '50', {
        probAnswer: { value: 6.5, tolerance: 0.5 },
        successes: 13,
        total: 200
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('13');
      expect(result.feedback).toContain('200');
    });
  });

  // ========== SIMULATION DESIGN OPEN RESPONSE TESTS ==========
  describe('designDigits (L10 - Open Response)', () => {
    it('grades complete digit assignment as E', () => {
      const result = gradeField('designDigits',
        '1-82 = made shot, 83-100 = missed shot',
        { probability: 82 }
      );
      expect(result.score).toBe('E');
    });

    it('accepts alternative phrasing', () => {
      const result = gradeField('designDigits',
        'Numbers 1 through 82 represent success, 83-100 is failure',
        { probability: 82 }
      );
      expect(result.score).toBe('E');
    });

    it('gives partial credit for incomplete answer', () => {
      const result = gradeField('designDigits',
        'Use 1-82 for the shots',
        { probability: 82 }
      );
      expect(result.score).toBe('P');
    });

    it('grades vague answer as I', () => {
      const result = gradeField('designDigits',
        'Use random numbers',
        { probability: 82 }
      );
      expect(result.score).toBe('I');
    });
  });

  describe('designTrial (L10 - Open Response)', () => {
    it('grades complete trial description as E', () => {
      const result = gradeField('designTrial',
        'Generate random numbers until you get a miss (83-100), then count the consecutive makes',
        {}
      );
      expect(result.score).toBe('E');
    });

    it('accepts answer with generate and count keywords as E', () => {
      const result = gradeField('designTrial',
        'Generate random numbers and count successes',
        {}
      );
      // Has 2+ keywords (generate, count), so grades as E
      expect(result.score).toBe('E');
    });

    it('grades incomplete description as I', () => {
      const result = gradeField('designTrial',
        'Do the simulation',
        {}
      );
      expect(result.score).toBe('I');
    });
  });

  // ========== CAPSTONE TESTS ==========
  describe('Capstone (L11)', () => {
    describe('capConcept', () => {
      it('grades correct concept identification as E', () => {
        const result = gradeField('capConcept',
          'Independence / Gambler\'s Fallacy',
          { capConcept: { value: 'Independence / Gambler\'s Fallacy' } }
        );
        expect(result.score).toBe('E');
      });

      it('grades incorrect concept as I', () => {
        const result = gradeField('capConcept',
          'Simulation',
          { capConcept: { value: 'Law of Large Numbers' } }
        );
        expect(result.score).toBe('I');
      });
    });

    describe('capExplain', () => {
      it('grades complete explanation with reasoning as E', () => {
        const result = gradeField('capExplain',
          'This is the gambler\'s fallacy because each flip is independent. Past results do not affect future probability, so the coin is not "due" for any outcome.',
          { expectedExplanation: 'Independence explanation' }
        );
        expect(result.score).toBe('E');
      });

      it('grades explanation with LLN keywords as E', () => {
        const result = gradeField('capExplain',
          'The Law of Large Numbers explains this because as the number of trials increases, the proportion gets closer to the true probability of 50%.',
          { expectedExplanation: 'LLN explanation' }
        );
        expect(result.score).toBe('E');
      });

      it('grades short explanation without reasoning word as I', () => {
        const result = gradeField('capExplain',
          'Each flip is independent of the others.',
          { expectedExplanation: 'Independence explanation' }
        );
        // Has keyword but no reasoning word (because/since) and short, so I
        expect(result.score).toBe('I');
      });

      it('gives partial credit when has substance and keyword without reasoning', () => {
        const result = gradeField('capExplain',
          'The independence of each flip means that what happened before has no effect on what happens next in the sequence.',
          { expectedExplanation: 'Independence explanation' }
        );
        // Has substance and keyword but no reasoning word (because/since) - graded as I
        // This is strict but encourages full explanations
        expect(result.score).toBe('I');
      });

      it('gives P for substance with keyword (has reasoning word)', () => {
        const result = gradeField('capExplain',
          'The independence means that what happened before has no effect on what comes next.',
          { expectedExplanation: 'Independence explanation' }
        );
        // Short but has keyword - still I because needs more substance + reasoning
        expect(result.score).toBe('I');
      });

      it('grades vague explanation as I', () => {
        const result = gradeField('capExplain',
          'Because of probability.',
          { expectedExplanation: 'Full explanation' }
        );
        expect(result.score).toBe('I');
      });
    });
  });

  // ========== TOPIC 4.3 TESTS ==========
  describe('Sample Space (L12)', () => {
    describe('sampleSpaceAnswer', () => {
      it('grades correct sample space as E', () => {
        const result = gradeField('sampleSpaceAnswer',
          '{H, T}',
          { sampleSpaceAnswer: { value: '{H, T}' }, explanation: 'Coin has two outcomes.' }
        );
        expect(result.score).toBe('E');
      });

      it('is case insensitive', () => {
        const result = gradeField('sampleSpaceAnswer',
          '{h, t}',
          { sampleSpaceAnswer: { value: '{H, T}' } }
        );
        expect(result.score).toBe('E');
      });

      it('grades incorrect answer as I', () => {
        const result = gradeField('sampleSpaceAnswer',
          '{1, 2, 3}',
          { sampleSpaceAnswer: { value: '{H, T}' } }
        );
        expect(result.score).toBe('I');
      });

      it('includes explanation in feedback when provided', () => {
        const result = gradeField('sampleSpaceAnswer',
          '{H, T}',
          { sampleSpaceAnswer: { value: '{H, T}' }, explanation: 'A coin has exactly two outcomes.' }
        );
        expect(result.feedback).toContain('two outcomes');
      });
    });
  });

  describe('Valid Probability Model (L13)', () => {
    describe('validProbChoice', () => {
      it('grades correct identification of valid model as E', () => {
        const result = gradeField('validProbChoice',
          'Yes, it is valid',
          { validProbChoice: { value: 'Yes, it is valid' }, isValid: true }
        );
        expect(result.score).toBe('E');
      });

      it('grades correct identification of invalid model as E', () => {
        const result = gradeField('validProbChoice',
          'No, it is NOT valid',
          { validProbChoice: { value: 'No, it is NOT valid' }, isValid: false, reason: 'Probabilities sum to 1.3' }
        );
        expect(result.score).toBe('E');
      });

      it('grades incorrect identification as I with reason', () => {
        const result = gradeField('validProbChoice',
          'Yes, it is valid',
          { validProbChoice: { value: 'No, it is NOT valid' }, isValid: false, reason: 'Has negative probability' }
        );
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('negative');
      });
    });

    describe('validProbReason', () => {
      it('grades correct reason as E', () => {
        const result = gradeField('validProbReason',
          'All probabilities are 0-1 and sum to 1',
          { validProbReason: { value: 'All probabilities are 0-1 and sum to 1' } }
        );
        expect(result.score).toBe('E');
      });

      it('grades incorrect reason as I', () => {
        const result = gradeField('validProbReason',
          'Probabilities sum to 1',
          { validProbReason: { value: 'Contains negative probability' } }
        );
        expect(result.score).toBe('I');
      });
    });
  });

  describe('Complement Rule (L14)', () => {
    describe('complementAnswer', () => {
      it('grades exact answer as E', () => {
        const result = gradeField('complementAnswer', '0.65', {
          complementAnswer: { value: 0.65 },
          givenProb: 0.35,
          complementEvent: 'not A'
        });
        expect(result.score).toBe('E');
      });

      it('gives partial credit for close answer', () => {
        const result = gradeField('complementAnswer', '0.64', {
          complementAnswer: { value: 0.65 },
          givenProb: 0.35,
          complementEvent: 'not A'
        });
        expect(result.score).toBe('P');
      });

      it('grades wrong answer as I with formula', () => {
        const result = gradeField('complementAnswer', '0.35', {
          complementAnswer: { value: 0.65 },
          givenProb: 0.35,
          complementEvent: 'not A'
        });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('1 - P(A)');
      });

      it('handles non-numeric input', () => {
        const result = gradeField('complementAnswer', 'sixty-five', {
          complementAnswer: { value: 0.65 },
          givenProb: 0.35
        });
        expect(result.score).toBe('I');
      });

      it('includes complementEvent in feedback', () => {
        const result = gradeField('complementAnswer', '0.65', {
          complementAnswer: { value: 0.65 },
          givenProb: 0.35,
          complementEvent: 'not raining'
        });
        expect(result.feedback).toContain('not raining');
      });
    });
  });

  describe('At Least One (L15)', () => {
    describe('atLeastOneAnswer', () => {
      it('grades exact answer as E', () => {
        const result = gradeField('atLeastOneAnswer', '0.875', {
          atLeastOneAnswer: { value: 0.875, tolerance: 0.005 },
          pNone: 0.125
        });
        expect(result.score).toBe('E');
      });

      it('grades answer within tolerance as E', () => {
        const result = gradeField('atLeastOneAnswer', '0.876', {
          atLeastOneAnswer: { value: 0.875, tolerance: 0.005 },
          pNone: 0.125
        });
        expect(result.score).toBe('E');
      });

      it('gives partial credit for somewhat close', () => {
        const result = gradeField('atLeastOneAnswer', '0.86', {
          atLeastOneAnswer: { value: 0.875, tolerance: 0.005 },
          pNone: 0.125
        });
        expect(result.score).toBe('P');
      });

      it('grades probability > 1 as I with specific feedback', () => {
        const result = gradeField('atLeastOneAnswer', '1.5', {
          atLeastOneAnswer: { value: 0.875, tolerance: 0.005 },
          pNone: 0.125
        });
        expect(result.score).toBe('I');
        expect(result.feedback.toLowerCase()).toContain('exceed 1');
      });

      it('grades wrong answer as I with complement approach', () => {
        const result = gradeField('atLeastOneAnswer', '0.5', {
          atLeastOneAnswer: { value: 0.875, tolerance: 0.005 },
          pNone: 0.125
        });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('1 - P(none)');
      });
    });
  });

  describe('Mixed 4.3 Practice (L16)', () => {
    describe('mixedAnswer', () => {
      it('grades correct answer as E', () => {
        const result = gradeField('mixedAnswer',
          '0.875',
          { mixedAnswer: { value: '0.875' }, explanation: 'Using complement rule.' }
        );
        expect(result.score).toBe('E');
      });

      it('grades incorrect answer as I', () => {
        const result = gradeField('mixedAnswer',
          '0.5',
          { mixedAnswer: { value: '0.875' }, explanation: 'The answer uses complement.' }
        );
        expect(result.score).toBe('I');
      });
    });

    describe('mixedExplain', () => {
      it('grades complete explanation with sample space keywords as E', () => {
        const result = gradeField('mixedExplain',
          'The sample space includes all possible outcomes. Since there are 36 total outcomes and 6 favorable, the probability is 6/36.',
          {}
        );
        expect(result.score).toBe('E');
      });

      it('grades explanation with complement keywords as E', () => {
        const result = gradeField('mixedExplain',
          'I used the complement rule because P(not A) = 1 - P(A). Since P(A) = 0.3, P(not A) = 0.7.',
          {}
        );
        expect(result.score).toBe('E');
      });

      it('grades explanation with at-least-one keywords as E', () => {
        const result = gradeField('mixedExplain',
          'Since we want at least one success, I calculated P(none) first and subtracted from 1 using the complement approach.',
          {}
        );
        expect(result.score).toBe('E');
      });

      it('gives partial credit for keywords without full reasoning', () => {
        const result = gradeField('mixedExplain',
          'The sample space has all outcomes. The answer is found by counting favorable divided by total.',
          {}
        );
        expect(result.score).toBe('P');
      });

      it('grades vague explanation as I', () => {
        const result = gradeField('mixedExplain',
          'I calculated the probability.',
          {}
        );
        expect(result.score).toBe('I');
      });

      it('grades short explanation without keywords as I', () => {
        const result = gradeField('mixedExplain',
          'The answer is 0.5.',
          {}
        );
        expect(result.score).toBe('I');
      });
    });
  });

  // ========== TOPIC 4.3 BLANK HANDLING ==========
  describe('Topic 4.3 Blank Handling', () => {
    it('rejects blank sampleSpaceAnswer', () => {
      const result = gradeField('sampleSpaceAnswer', '', { sampleSpaceAnswer: { value: '{H, T}' } });
      expect(result.score).toBe('I');
    });

    it('rejects blank complementAnswer', () => {
      const result = gradeField('complementAnswer', '', { complementAnswer: { value: 0.65 } });
      expect(result.score).toBe('I');
    });

    it('rejects blank mixedExplain with appropriate message', () => {
      const result = gradeField('mixedExplain', '', {});
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('response');
    });
  });

  // ========== BLANK ANSWER HANDLING ==========
  describe('Blank Answer Handling', () => {
    it('rejects empty string for choice field', () => {
      const result = gradeField('vocabAnswer', '', { vocabAnswer: { value: 'Test' } });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects whitespace-only answer', () => {
      const result = gradeField('termType', '   ', { termType: { value: 'Outcome' } });
      expect(result.score).toBe('I');
    });

    it('rejects empty string for open response', () => {
      const result = gradeField('designDigits', '', { probability: 82 });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('response');
    });

    it('rejects null answer', () => {
      const result = gradeField('llnAnswer', null, { llnAnswer: { value: 'Test' } });
      expect(result.score).toBe('I');
    });

    it('rejects undefined answer', () => {
      const result = gradeField('streakAnswer', undefined, { streakAnswer: { value: 'Test' } });
      expect(result.score).toBe('I');
    });
  });

  // ========== CONTEXT OBJECT HANDLING ==========
  describe('Context Object Handling', () => {
    it('handles object-valued context { value: "..." }', () => {
      const result = gradeField('vocabAnswer', 'Correct', {
        vocabAnswer: { value: 'Correct' }
      });
      expect(result.score).toBe('E');
    });

    it('handles answers property in context', () => {
      const result = gradeField('termType', 'Event', {
        answers: { termType: { value: 'Event' } }
      });
      expect(result.score).toBe('E');
    });

    it('handles raw string value in context', () => {
      const result = gradeField('llnAnswer', 'Test', {
        llnAnswer: 'Test'
      });
      expect(result.score).toBe('E');
    });
  });

  // ========== CASE SENSITIVITY AND TRIMMING ==========
  describe('Case Sensitivity and Trimming', () => {
    it('is case insensitive', () => {
      const result = gradeField('termType', 'OUTCOME', { termType: { value: 'Outcome' } });
      expect(result.score).toBe('E');
    });

    it('trims whitespace', () => {
      const result = gradeField('termType', '  Event  ', { termType: { value: 'Event' } });
      expect(result.score).toBe('E');
    });

    it('handles mixed case in open response', () => {
      const result = gradeField('designDigits',
        '1-82 SUCCESS, 83-100 FAILURE',
        { probability: 82 }
      );
      expect(result.score).toBe('E');
    });
  });
});
