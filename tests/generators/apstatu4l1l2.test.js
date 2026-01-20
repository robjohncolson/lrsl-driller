/**
 * AP Statistics Unit 4 Lessons 1-2 Generator Tests
 * Tests problem generation for probability and simulation concepts
 */
import { describe, it, expect } from 'vitest';
import { generateProblem } from '../../cartridges/apstatu4l1l2/generator.js';

describe('AP Stats U4 L1-L2 Generator', () => {
  // ========== BASIC STRUCTURE TESTS ==========
  describe('Problem Structure', () => {
    it('generates problem with required fields', () => {
      const problem = generateProblem('l01-random-process', {}, {});

      expect(problem).toHaveProperty('scenario');
      expect(problem).toHaveProperty('context');
      expect(problem).toHaveProperty('answers');
      expect(problem.scenario).toBeTruthy();
      expect(problem.context).toBeTruthy();
    });

    it('includes topicId in context', () => {
      const problem = generateProblem('l01-random-process', {}, {});
      expect(problem.context).toHaveProperty('topicId');
      expect(problem.context.topicId).toBe('4.1a');
    });

    it('includes problemText with learning objective', () => {
      const problem = generateProblem('l01-random-process', {}, {});
      expect(problem.context).toHaveProperty('problemText');
      expect(problem.context.problemText).toContain('random process');
    });
  });

  // ========== MODE-SPECIFIC TESTS ==========
  describe('L01 - Random Process Definition', () => {
    it('generates dropdown options', () => {
      const problem = generateProblem('l01-random-process', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('provides correct answer in answers object', () => {
      const problem = generateProblem('l01-random-process', {}, {});
      expect(problem.answers).toHaveProperty('vocabAnswer');
      expect(problem.answers.vocabAnswer).toHaveProperty('value');
    });

    it('generates question about random processes', () => {
      const problem = generateProblem('l01-random-process', {}, {});
      expect(problem.context.givenText.toLowerCase()).toMatch(/random|outcome|process|predict/);
    });
  });

  describe('L02 - Outcomes vs Events', () => {
    it('generates valid Outcome/Event answer', () => {
      const problem = generateProblem('l02-outcome-event', {}, {});
      expect(problem.answers).toHaveProperty('termType');
      const value = problem.answers.termType.value;
      expect(['Outcome', 'Event']).toContain(value);
    });

    it('includes description of the term type', () => {
      const problem = generateProblem('l02-outcome-event', {}, {});
      expect(problem.context.givenText).toBeTruthy();
    });
  });

  describe('L03 - Independence / Gambler\'s Fallacy', () => {
    it('generates reasoning scenario', () => {
      const problem = generateProblem('l03-independence', {}, {});
      expect(problem.answers).toHaveProperty('independenceAnswer');
    });

    it('answer is valid choice', () => {
      const problem = generateProblem('l03-independence', {}, {});
      const value = problem.answers.independenceAnswer.value;
      expect(['Yes, the reasoning is correct', 'No, the reasoning is flawed']).toContain(value);
    });

    it('includes expected explanation in context', () => {
      const problem = generateProblem('l03-independence', {}, {});
      expect(problem.context).toHaveProperty('expectedExplanation');
    });
  });

  describe('L04 - Streaks in Random Data', () => {
    it('generates streak scenario', () => {
      const problem = generateProblem('l04-streaks', {}, {});
      expect(problem.answers).toHaveProperty('streakAnswer');
    });

    it('answer is valid surprise assessment', () => {
      const problem = generateProblem('l04-streaks', {}, {});
      const value = problem.answers.streakAnswer.value;
      expect(['Yes, this is surprising', 'No, this is normal']).toContain(value);
    });
  });

  describe('L05 - Simulation Definition', () => {
    it('generates simulation vocabulary question', () => {
      const problem = generateProblem('l05-simulation-vocab', {}, {});
      expect(problem.answers).toHaveProperty('simVocabAnswer');
      expect(problem.context).toHaveProperty('optA');
    });

    it('question relates to simulation', () => {
      const problem = generateProblem('l05-simulation-vocab', {}, {});
      expect(problem.context.givenText.toLowerCase()).toMatch(/simulat|model|random|trial/);
    });
  });

  describe('L06 - Law of Large Numbers', () => {
    it('generates LLN question', () => {
      const problem = generateProblem('l06-lln', {}, {});
      expect(problem.answers).toHaveProperty('llnAnswer');
    });

    it('problemText mentions Law of Large Numbers', () => {
      const problem = generateProblem('l06-lln', {}, {});
      expect(problem.context.problemText).toContain('Law of Large Numbers');
    });
  });

  describe('L07 - Digit Assignment', () => {
    it('generates digit assignment problem', () => {
      const problem = generateProblem('l07-digit-assignment', {}, {});
      expect(problem.answers).toHaveProperty('digitLow');
      expect(problem.answers).toHaveProperty('digitHigh');
    });

    it('low bound is always 1', () => {
      const problem = generateProblem('l07-digit-assignment', {}, {});
      expect(problem.answers.digitLow.value).toBe(1);
    });

    it('high bound matches probability', () => {
      const problem = generateProblem('l07-digit-assignment', {}, {});
      expect(problem.context).toHaveProperty('probability');
      expect(problem.answers.digitHigh.value).toBe(problem.context.probability);
    });

    it('context includes success label and failure range', () => {
      const problem = generateProblem('l07-digit-assignment', {}, {});
      expect(problem.context).toHaveProperty('successLabel');
      expect(problem.context).toHaveProperty('failureRange');
    });
  });

  describe('L08 - Trial Definition', () => {
    it('generates trial definition question', () => {
      const problem = generateProblem('l08-trial-definition', {}, {});
      expect(problem.answers).toHaveProperty('trialAnswer');
      expect(problem.context).toHaveProperty('optA');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l08-trial-definition', {}, {});
      expect(problem.context.optA).toBeTruthy();
      expect(problem.context.optB).toBeTruthy();
      expect(problem.context.optC).toBeTruthy();
      expect(problem.context.optD).toBeTruthy();
    });
  });

  describe('L09 - Relative Frequency Calculation', () => {
    it('generates calculation problem', () => {
      const problem = generateProblem('l09-relative-frequency', {}, {});
      expect(problem.answers).toHaveProperty('probAnswer');
      expect(problem.context).toHaveProperty('successes');
      expect(problem.context).toHaveProperty('total');
    });

    it('correct answer matches calculation', () => {
      const problem = generateProblem('l09-relative-frequency', {}, {});
      const expected = (problem.context.successes / problem.context.total) * 100;
      // Allow for rounding
      expect(Math.abs(problem.answers.probAnswer.value - expected)).toBeLessThan(0.5);
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l09-relative-frequency', {}, {});
      expect(problem.answers.probAnswer).toHaveProperty('tolerance');
    });
  });

  describe('L10 - Full Simulation Design', () => {
    it('generates simulation design problem', () => {
      const problem = generateProblem('l10-simulation-design', {}, {});
      expect(problem.answers).toHaveProperty('designDigits');
      expect(problem.answers).toHaveProperty('designTrial');
    });

    it('includes expected answers for open response', () => {
      const problem = generateProblem('l10-simulation-design', {}, {});
      expect(problem.context).toHaveProperty('expectedDigitAssignment');
      expect(problem.context).toHaveProperty('expectedTrialDescription');
    });

    it('includes probability for context', () => {
      const problem = generateProblem('l10-simulation-design', {}, {});
      expect(problem.context).toHaveProperty('probability');
      expect(typeof problem.context.probability).toBe('number');
    });
  });

  describe('L11 - Capstone', () => {
    it('generates capstone problem', () => {
      const problem = generateProblem('l11-capstone', {}, {});
      expect(problem.answers).toHaveProperty('capConcept');
      expect(problem.answers).toHaveProperty('capExplain');
    });

    it('provides dropdown options for concept', () => {
      const problem = generateProblem('l11-capstone', {}, {});
      expect(problem.context.optA).toBeTruthy();
      expect(problem.context.optB).toBeTruthy();
    });

    it('includes expected explanation', () => {
      const problem = generateProblem('l11-capstone', {}, {});
      expect(problem.context).toHaveProperty('expectedExplanation');
    });
  });

  // ========== UNIQUENESS TESTS ==========
  describe('Problem Uniqueness (Shuffle Bag)', () => {
    it('generates different scenarios across multiple calls for L01', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l01-random-process', {}, {});
        scenarios.add(problem.context.givenText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different scenarios for L02', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l02-outcome-event', {}, {});
        scenarios.add(problem.context.givenText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different scenarios for L07', () => {
      const probabilities = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l07-digit-assignment', {}, {});
        probabilities.add(problem.context.probability);
      }
      expect(probabilities.size).toBeGreaterThan(1);
    });
  });

  // ========== ERROR HANDLING ==========
  describe('Error Handling', () => {
    it('handles unknown mode gracefully', () => {
      expect(() => generateProblem('unknown-mode', {}, {})).not.toThrow();
    });

    it('returns fallback for unknown mode', () => {
      const problem = generateProblem('unknown-mode', {}, {});
      expect(problem.context.problemText).toContain('not implemented');
    });
  });

  // ========== CONTENT VALIDATION ==========
  describe('Content Validation', () => {
    it('independence scenarios mention key concepts', () => {
      // Generate multiple and check at least one mentions key terms
      let foundKeyTerm = false;
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l03-independence', {}, {});
        const text = problem.context.givenText.toLowerCase();
        if (text.includes('flip') || text.includes('roll') || text.includes('due') || text.includes('row')) {
          foundKeyTerm = true;
          break;
        }
      }
      expect(foundKeyTerm).toBe(true);
    });

    it('simulation scenarios include probability context', () => {
      const problem = generateProblem('l07-digit-assignment', {}, {});
      const text = problem.context.givenText.toLowerCase();
      expect(text).toMatch(/\d+%|\d+\/\d+|percent|chance|probability/);
    });
  });
});
