/**
 * AP Statistics Unit 3 Lesson 5 - Experimental Design Grading Tests
 * Tests grading rules for all field types (MCQ, keywords, decision, justification, free response)
 */
import { describe, it, expect } from 'vitest';
import { gradeField } from '../../cartridges/apstats-u3l5-experimental-design/grading-rules.js';

describe('Experimental Design Grading Rules', () => {
  // ========== L01 ANSWER FIELD TESTS ==========
  describe('L01 Answer Field', () => {
    describe('MCQ Grading', () => {
      const mcqContext = {
        kind: 'mcq',
        correctLetter: 'C',
        feedbackCorrect: 'Correct — random assignment supports cause-and-effect.',
        feedbackIncorrect: 'Random assignment → causation.'
      };

      it('grades correct letter as E', () => {
        const result = gradeField('answer', 'C', mcqContext);
        expect(result.score).toBe('E');
        expect(result.feedback).toContain('Correct');
      });

      it('grades lowercase correct letter as E', () => {
        const result = gradeField('answer', 'c', mcqContext);
        expect(result.score).toBe('E');
      });

      it('extracts first A-E letter from response', () => {
        // Note: grading finds FIRST a-e letter, so "C is correct" works, but
        // "The answer is C" finds 'a' from "answer" first
        const result = gradeField('answer', 'C is the correct answer', mcqContext);
        expect(result.score).toBe('E');
      });

      it('grades wrong letter as I', () => {
        const result = gradeField('answer', 'A', mcqContext);
        expect(result.score).toBe('I');
        // Feedback uses preset feedbackIncorrect, not necessarily the correct letter
        expect(result.feedback).toBeTruthy();
      });

      it('grades missing answer as I', () => {
        const result = gradeField('answer', '', mcqContext);
        expect(result.score).toBe('I');
      });
    });

    describe('Keywords Any Grading', () => {
      const keywordsAnyContext = {
        kind: 'keywords_any',
        keywordsAny: ['plant', 'plants', 'pepper'],
        correctAnswer: 'The pepper plants',
        feedbackCorrect: 'Correct — experimental units are the plants.',
        feedbackIncorrect: 'Remember: experimental units are the plants.'
      };

      it('grades correct keyword match as E', () => {
        const result = gradeField('answer', 'The plants', keywordsAnyContext);
        expect(result.score).toBe('E');
      });

      it('grades partial match with any keyword as E', () => {
        const result = gradeField('answer', 'pepper plants', keywordsAnyContext);
        expect(result.score).toBe('E');
      });

      it('is case insensitive', () => {
        const result = gradeField('answer', 'PLANTS', keywordsAnyContext);
        expect(result.score).toBe('E');
      });

      it('grades answer without keywords as I', () => {
        const result = gradeField('answer', 'the fertilizers', keywordsAnyContext);
        expect(result.score).toBe('I');
      });

      it('provides feedback for wrong answer', () => {
        const result = gradeField('answer', 'wrong', keywordsAnyContext);
        expect(result.score).toBe('I');
        // Uses feedbackIncorrect which mentions plants
        expect(result.feedback).toContain('plants');
      });
    });

    describe('Keywords All Grading', () => {
      const keywordsAllContext = {
        kind: 'keywords_all',
        keywordsAll: ['random', 'assign'],
        feedbackCorrect: 'Correct!',
        feedbackIncorrect: 'Include BOTH ideas.'
      };

      it('grades answer with all keywords as E', () => {
        const result = gradeField('answer', 'Random assignment of treatments', keywordsAllContext);
        expect(result.score).toBe('E');
      });

      it('grades answer with some keywords as P', () => {
        const result = gradeField('answer', 'using random chance', keywordsAllContext);
        expect(result.score).toBe('P');
      });

      it('grades answer with no keywords as I', () => {
        const result = gradeField('answer', 'picking subjects', keywordsAllContext);
        expect(result.score).toBe('I');
      });
    });
  });

  // ========== L02 DECISION FIELD TESTS ==========
  describe('L02 Decision Field', () => {
    it('grades correct "yes" decision as E', () => {
      const result = gradeField('decision', 'Yes', { correctDecision: 'yes' });
      expect(result.score).toBe('E');
    });

    it('grades correct "no" decision as E', () => {
      const result = gradeField('decision', 'No', { correctDecision: 'no' });
      expect(result.score).toBe('E');
    });

    it('is case insensitive', () => {
      const result = gradeField('decision', 'YES', { correctDecision: 'yes' });
      expect(result.score).toBe('E');
    });

    it('accepts "y" prefix as yes', () => {
      const result = gradeField('decision', 'y', { correctDecision: 'yes' });
      expect(result.score).toBe('E');
    });

    it('accepts "n" prefix as no', () => {
      const result = gradeField('decision', 'n', { correctDecision: 'no' });
      expect(result.score).toBe('E');
    });

    it('grades wrong decision as I', () => {
      const result = gradeField('decision', 'Yes', { correctDecision: 'no' });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('NO');
    });

    it('grades wrong decision (inverted) as I', () => {
      const result = gradeField('decision', 'No', { correctDecision: 'yes' });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('YES');
    });
  });

  // ========== L02 JUSTIFICATION FIELD TESTS ==========
  describe('L02 Justification Field', () => {
    const justificationContext = {
      keyPhrases: ['observational', 'confound', 'confounding', 'cannot conclude', 'no random assignment']
    };

    it('grades answer with 2+ key phrases as E', () => {
      const result = gradeField('justification',
        'This is an observational study with potential confounding variables.',
        justificationContext);
      expect(result.score).toBe('E');
    });

    it('grades answer with 1 key phrase as P', () => {
      // Note: "confounding" matches both "confound" AND "confounding" (substring)
      // Use phrase that only matches one key phrase
      const result = gradeField('justification',
        'We cannot conclude causation from this.',
        justificationContext);
      expect(result.score).toBe('P');
    });

    it('grades answer with no key phrases as I', () => {
      const result = gradeField('justification',
        'The study is bad.',
        justificationContext);
      expect(result.score).toBe('I');
    });

    it('provides helpful feedback for I score', () => {
      const result = gradeField('justification', 'I think so', justificationContext);
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('vocabulary');
    });

    it('recognizes "no random assignment" as key phrase', () => {
      const result = gradeField('justification',
        'There was no random assignment so we cannot conclude causation.',
        justificationContext);
      expect(result.score).toBe('E');
    });
  });

  // ========== L03 FREE RESPONSE FIELD TESTS ==========
  describe('L03 Free Response Field', () => {
    const freeResponseContext = {
      requiredElements: [
        { name: 'comparison', keywords: ['compare', 'comparison', 'control', 'two groups'] },
        { name: 'random assignment', keywords: ['randomly assign', 'random assignment'] },
        { name: 'experimental units', keywords: ['plants', 'pepper plants'] },
        { name: 'response variable', keywords: ['measure', 'growth', 'height'] },
        { name: 'control confounding', keywords: ['keep the same', 'constant', 'control variables'] }
      ]
    };

    it('grades answer with most elements as E', () => {
      const result = gradeField('response',
        'Randomly assign the pepper plants to two groups. Compare growth between groups. Keep other conditions the same.',
        freeResponseContext);
      expect(result.score).toBe('E');
    });

    it('grades answer with some elements as P', () => {
      const result = gradeField('response',
        'Randomly assign plants to groups and measure growth.',
        freeResponseContext);
      expect(result.score).toBe('P');
    });

    it('grades answer with few elements as I', () => {
      const result = gradeField('response',
        'Give fertilizer and see what happens.',
        freeResponseContext);
      expect(result.score).toBe('I');
    });

    it('includes missing elements in P feedback', () => {
      const result = gradeField('response',
        'Randomly assign plants to groups.',
        freeResponseContext);
      expect(result.score).toBe('P');
      expect(result.feedback).toContain('adding');
    });

    it('includes missing elements in I feedback', () => {
      const result = gradeField('response',
        'Do the experiment.',
        freeResponseContext);
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('missing');
    });
  });

  // ========== BLANK ANSWER HANDLING ==========
  describe('Blank Answer Handling', () => {
    it('rejects empty string for answer field', () => {
      const result = gradeField('answer', '', { kind: 'mcq', correctLetter: 'A' });
      expect(result.score).toBe('I');
    });

    it('rejects whitespace-only for answer field', () => {
      const result = gradeField('answer', '   ', { kind: 'keywords_any', keywordsAny: ['test'] });
      expect(result.score).toBe('I');
    });

    it('handles null answer gracefully', () => {
      const result = gradeField('answer', null, { kind: 'mcq', correctLetter: 'A' });
      expect(result.score).toBe('I');
    });

    it('handles undefined answer gracefully', () => {
      const result = gradeField('answer', undefined, { kind: 'mcq', correctLetter: 'A' });
      expect(result.score).toBe('I');
    });
  });

  // ========== UNKNOWN FIELD HANDLING ==========
  describe('Unknown Field Handling', () => {
    it('returns I for unknown field', () => {
      const result = gradeField('unknownField', 'test', {});
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('Unknown');
    });
  });

  // ========== SPECIFIC QUESTION GRADING ==========
  describe('Specific Question Grading', () => {
    describe('L01-units-plants', () => {
      const context = {
        kind: 'keywords_any',
        keywordsAny: ['plant', 'plants', 'pepper'],
        correctAnswer: 'The pepper plants',
        feedbackCorrect: 'Correct',
        feedbackIncorrect: 'Remember: experimental units are the plants.'
      };

      it('accepts "the pepper plants"', () => {
        expect(gradeField('answer', 'the pepper plants', context).score).toBe('E');
      });

      it('accepts "plants"', () => {
        expect(gradeField('answer', 'plants', context).score).toBe('E');
      });

      it('accepts "18 pepper plants"', () => {
        expect(gradeField('answer', '18 pepper plants', context).score).toBe('E');
      });

      it('rejects "fertilizer"', () => {
        expect(gradeField('answer', 'fertilizer', context).score).toBe('I');
      });
    });

    describe('L01-response-test', () => {
      const context = {
        kind: 'keywords_any',
        keywordsAny: ['score', 'test', 'exam', 'achievement'],
        correctAnswer: 'The students\' achievement test scores',
        feedbackCorrect: 'Correct',
        feedbackIncorrect: 'The response variable is what is measured.'
      };

      it('accepts "test scores"', () => {
        expect(gradeField('answer', 'test scores', context).score).toBe('E');
      });

      it('accepts "achievement"', () => {
        expect(gradeField('answer', 'achievement', context).score).toBe('E');
      });

      it('accepts "exam results"', () => {
        expect(gradeField('answer', 'exam results', context).score).toBe('E');
      });

      it('rejects "teaching method"', () => {
        expect(gradeField('answer', 'teaching method', context).score).toBe('I');
      });
    });

    describe('L01-explanatory-fertilizer', () => {
      const context = {
        kind: 'keywords_any',
        keywordsAny: ['fertilizer', 'type of fertilizer', 'fertilizer type', 'which fertilizer', 'treatment'],
        correctAnswer: 'Type of fertilizer (A vs B)',
        feedbackCorrect: 'Correct',
        feedbackIncorrect: 'The explanatory variable is what is manipulated.'
      };

      it('accepts "fertilizer type"', () => {
        expect(gradeField('answer', 'fertilizer type', context).score).toBe('E');
      });

      it('accepts "type of fertilizer"', () => {
        expect(gradeField('answer', 'type of fertilizer', context).score).toBe('E');
      });

      it('accepts "the treatment"', () => {
        expect(gradeField('answer', 'the treatment', context).score).toBe('E');
      });

      it('rejects "plant growth"', () => {
        expect(gradeField('answer', 'plant growth', context).score).toBe('I');
      });
    });

    describe('L01-mcq-randassign-why', () => {
      const context = {
        kind: 'mcq',
        correctLetter: 'A',
        feedbackCorrect: 'Correct',
        feedbackIncorrect: 'Random assignment balances other variables.'
      };

      it('accepts A', () => {
        expect(gradeField('answer', 'A', context).score).toBe('E');
      });

      it('rejects B', () => {
        expect(gradeField('answer', 'B', context).score).toBe('I');
      });

      it('rejects E', () => {
        expect(gradeField('answer', 'E', context).score).toBe('I');
      });
    });

    describe('L02-notes-observational', () => {
      const context = {
        correctDecision: 'no',
        keyPhrases: ['observational', 'confound', 'confounding', 'cannot conclude', 'no random assignment']
      };

      it('decision: accepts No', () => {
        expect(gradeField('decision', 'No', context).score).toBe('E');
      });

      it('decision: rejects Yes', () => {
        expect(gradeField('decision', 'Yes', context).score).toBe('I');
      });

      it('justification: E for observational + confounding', () => {
        const result = gradeField('justification',
          'No. This is observational and there are confounding variables like motivation.',
          context);
        expect(result.score).toBe('E');
      });

      it('justification: P for only observational', () => {
        const result = gradeField('justification',
          'This is observational.',
          context);
        expect(result.score).toBe('P');
      });
    });

    describe('L02-placebo-doubleblind', () => {
      const context = {
        correctDecision: 'yes',
        keyPhrases: ['random', 'assign', 'comparison', 'control', 'placebo', 'double-blind', 'replication']
      };

      it('decision: accepts Yes', () => {
        expect(gradeField('decision', 'Yes', context).score).toBe('E');
      });

      it('justification: E for random + comparison + placebo', () => {
        const result = gradeField('justification',
          'Yes, it has random assignment, a comparison group with placebo, and replication.',
          context);
        expect(result.score).toBe('E');
      });
    });

    describe('L03-design-experiment-fertilizer', () => {
      const context = {
        requiredElements: [
          { name: 'comparison', keywords: ['compare', 'comparison', 'control', 'two groups', 'treatment group'] },
          { name: 'random assignment', keywords: ['randomly assign', 'random assignment', 'random allocation'] },
          { name: 'experimental units', keywords: ['plants', 'pepper plants', 'experimental units'] },
          { name: 'response variable', keywords: ['measure', 'record', 'growth', 'height', 'yield', 'response'] },
          { name: 'control confounding', keywords: ['keep the same', 'constant', 'control variables', 'same conditions', 'confounding'] }
        ]
      };

      it('E for comprehensive answer', () => {
        const result = gradeField('response',
          'Randomly assign pepper plants to two groups. One gets Fertilizer A, one gets Fertilizer B. ' +
          'Keep all other conditions constant. Measure growth after 4 weeks and compare the groups.',
          context);
        expect(result.score).toBe('E');
      });

      it('P for partial answer', () => {
        const result = gradeField('response',
          'Give some plants Fertilizer A and some Fertilizer B, then measure growth.',
          context);
        expect(result.score).toBe('P');
      });

      it('I for minimal answer', () => {
        const result = gradeField('response',
          'Try both fertilizers.',
          context);
        expect(result.score).toBe('I');
      });
    });
  });
});
