/**
 * AP Statistics Unit 4 Lessons 1-8 Generator Tests
 * Tests problem generation for probability, random variables, and distributions
 * Topics: Random processes, simulation, sample space, probability rules,
 *         mutually exclusive events, conditional probability, independent events,
 *         unions, random variables, probability distributions, mean, standard deviation
 */
import { describe, it, expect } from 'vitest';
import { generateProblem } from '../../cartridges/apstatu4l1l2/generator.js';

describe('AP Stats U4 L1-L2-L3 Generator', () => {
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

  // ========== TOPIC 4.3 TESTS ==========
  describe('L12 - Sample Space Identification', () => {
    it('generates sample space question', () => {
      const problem = generateProblem('l12-sample-space', {}, {});
      expect(problem.answers).toHaveProperty('sampleSpaceAnswer');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l12-sample-space', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('includes explanation in context', () => {
      const problem = generateProblem('l12-sample-space', {}, {});
      expect(problem.context).toHaveProperty('explanation');
    });

    it('problemText mentions sample space', () => {
      const problem = generateProblem('l12-sample-space', {}, {});
      expect(problem.context.problemText.toLowerCase()).toContain('sample space');
    });

    it('correct answer is one of the options', () => {
      const problem = generateProblem('l12-sample-space', {}, {});
      const options = [problem.context.optA, problem.context.optB, problem.context.optC, problem.context.optD];
      expect(options).toContain(problem.answers.sampleSpaceAnswer.value);
    });
  });

  describe('L13 - Valid Probability Model', () => {
    it('generates valid probability check question', () => {
      const problem = generateProblem('l13-valid-probability', {}, {});
      expect(problem.answers).toHaveProperty('validProbChoice');
      expect(problem.answers).toHaveProperty('validProbReason');
    });

    it('includes isValid flag in context', () => {
      const problem = generateProblem('l13-valid-probability', {}, {});
      expect(problem.context).toHaveProperty('isValid');
      expect(typeof problem.context.isValid).toBe('boolean');
    });

    it('includes reason in context', () => {
      const problem = generateProblem('l13-valid-probability', {}, {});
      expect(problem.context).toHaveProperty('reason');
    });

    it('answer matches isValid flag', () => {
      const problem = generateProblem('l13-valid-probability', {}, {});
      if (problem.context.isValid) {
        expect(problem.answers.validProbChoice.value).toBe('Yes, it is valid');
      } else {
        expect(problem.answers.validProbChoice.value).toBe('No, it is NOT valid');
      }
    });
  });

  describe('L14 - Complement Rule', () => {
    it('generates complement calculation problem', () => {
      const problem = generateProblem('l14-complement-rule', {}, {});
      expect(problem.answers).toHaveProperty('complementAnswer');
    });

    it('answer is numeric between 0 and 1', () => {
      const problem = generateProblem('l14-complement-rule', {}, {});
      const value = problem.answers.complementAnswer.value;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('includes givenProb in context', () => {
      const problem = generateProblem('l14-complement-rule', {}, {});
      expect(problem.context).toHaveProperty('givenProb');
    });

    it('answer equals 1 - givenProb', () => {
      const problem = generateProblem('l14-complement-rule', {}, {});
      const expected = 1 - problem.context.givenProb;
      expect(Math.abs(problem.answers.complementAnswer.value - expected)).toBeLessThan(0.001);
    });

    it('includes complementEvent label', () => {
      const problem = generateProblem('l14-complement-rule', {}, {});
      expect(problem.context).toHaveProperty('complementEvent');
    });
  });

  describe('L15 - At Least One', () => {
    it('generates at least one probability problem', () => {
      const problem = generateProblem('l15-at-least-one', {}, {});
      expect(problem.answers).toHaveProperty('atLeastOneAnswer');
    });

    it('answer is numeric between 0 and 1', () => {
      const problem = generateProblem('l15-at-least-one', {}, {});
      const value = problem.answers.atLeastOneAnswer.value;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('includes pNone in context', () => {
      const problem = generateProblem('l15-at-least-one', {}, {});
      expect(problem.context).toHaveProperty('pNone');
    });

    it('answer equals 1 - pNone', () => {
      const problem = generateProblem('l15-at-least-one', {}, {});
      const expected = 1 - problem.context.pNone;
      expect(Math.abs(problem.answers.atLeastOneAnswer.value - expected)).toBeLessThan(0.001);
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l15-at-least-one', {}, {});
      expect(problem.answers.atLeastOneAnswer).toHaveProperty('tolerance');
    });
  });

  describe('L16 - Mixed 4.3 Practice', () => {
    it('generates mixed practice problem', () => {
      const problem = generateProblem('l16-mixed-4-3', {}, {});
      expect(problem.answers).toHaveProperty('mixedAnswer');
      expect(problem.answers).toHaveProperty('mixedExplain');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l16-mixed-4-3', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('includes explanation in context', () => {
      const problem = generateProblem('l16-mixed-4-3', {}, {});
      expect(problem.context).toHaveProperty('explanation');
    });
  });

  // ========== TOPIC 4.4 TESTS (Mutually Exclusive Events) ==========
  describe('L17 - Mutually Exclusive Definition', () => {
    it('generates ME definition question', () => {
      const problem = generateProblem('l17-mutually-exclusive-def', {}, {});
      expect(problem.answers).toHaveProperty('meDefAnswer');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l17-mutually-exclusive-def', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('topicId is 4.4a', () => {
      const problem = generateProblem('l17-mutually-exclusive-def', {}, {});
      expect(problem.context.topicId).toBe('4.4a');
    });

    it('problemText mentions mutually exclusive', () => {
      const problem = generateProblem('l17-mutually-exclusive-def', {}, {});
      expect(problem.context.problemText.toLowerCase()).toContain('mutually exclusive');
    });

    it('correct answer is one of the options', () => {
      const problem = generateProblem('l17-mutually-exclusive-def', {}, {});
      const options = [problem.context.optA, problem.context.optB, problem.context.optC, problem.context.optD];
      expect(options).toContain(problem.answers.meDefAnswer.value);
    });
  });

  describe('L18 - Joint Probability', () => {
    it('generates joint probability calculation problem', () => {
      const problem = generateProblem('l18-joint-probability', {}, {});
      expect(problem.answers).toHaveProperty('jointProbAnswer');
    });

    it('answer is numeric between 0 and 1', () => {
      const problem = generateProblem('l18-joint-probability', {}, {});
      const value = problem.answers.jointProbAnswer.value;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('includes intersection and total in context', () => {
      const problem = generateProblem('l18-joint-probability', {}, {});
      expect(problem.context).toHaveProperty('intersection');
      expect(problem.context).toHaveProperty('total');
    });

    it('answer equals intersection / total', () => {
      const problem = generateProblem('l18-joint-probability', {}, {});
      const expected = problem.context.intersection / problem.context.total;
      expect(Math.abs(problem.answers.jointProbAnswer.value - expected)).toBeLessThan(0.005);
    });

    it('includes eventA and eventB in context', () => {
      const problem = generateProblem('l18-joint-probability', {}, {});
      expect(problem.context).toHaveProperty('eventA');
      expect(problem.context).toHaveProperty('eventB');
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l18-joint-probability', {}, {});
      expect(problem.answers.jointProbAnswer).toHaveProperty('tolerance');
    });
  });

  describe('L19 - Identify Mutually Exclusive', () => {
    it('generates ME identification problem', () => {
      const problem = generateProblem('l19-identify-me', {}, {});
      expect(problem.answers).toHaveProperty('identifyMEAnswer');
    });

    it('answer is valid ME choice', () => {
      const problem = generateProblem('l19-identify-me', {}, {});
      const value = problem.answers.identifyMEAnswer.value;
      expect(['Yes, mutually exclusive', 'No, NOT mutually exclusive']).toContain(value);
    });

    it('includes isME flag in context', () => {
      const problem = generateProblem('l19-identify-me', {}, {});
      expect(problem.context).toHaveProperty('isME');
      expect(typeof problem.context.isME).toBe('boolean');
    });

    it('answer matches isME flag', () => {
      const problem = generateProblem('l19-identify-me', {}, {});
      if (problem.context.isME) {
        expect(problem.answers.identifyMEAnswer.value).toBe('Yes, mutually exclusive');
      } else {
        expect(problem.answers.identifyMEAnswer.value).toBe('No, NOT mutually exclusive');
      }
    });

    it('includes explanation in context', () => {
      const problem = generateProblem('l19-identify-me', {}, {});
      expect(problem.context).toHaveProperty('explanation');
    });
  });

  // ========== TOPIC 4.5 TESTS (Conditional Probability) ==========
  describe('L20 - Conditional Probability Definition', () => {
    it('generates conditional probability definition question', () => {
      const problem = generateProblem('l20-conditional-def', {}, {});
      expect(problem.answers).toHaveProperty('condDefAnswer');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l20-conditional-def', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('topicId is 4.5a', () => {
      const problem = generateProblem('l20-conditional-def', {}, {});
      expect(problem.context.topicId).toBe('4.5a');
    });

    it('problemText mentions conditional probability', () => {
      const problem = generateProblem('l20-conditional-def', {}, {});
      expect(problem.context.problemText.toLowerCase()).toContain('conditional');
    });
  });

  describe('L21 - Conditional Probability from Tables', () => {
    it('generates conditional probability calculation problem', () => {
      const problem = generateProblem('l21-conditional-table', {}, {});
      expect(problem.answers).toHaveProperty('condTableAnswer');
    });

    it('answer is numeric between 0 and 1', () => {
      const problem = generateProblem('l21-conditional-table', {}, {});
      const value = problem.answers.condTableAnswer.value;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('includes numerator and denominator in context', () => {
      const problem = generateProblem('l21-conditional-table', {}, {});
      expect(problem.context).toHaveProperty('numerator');
      expect(problem.context).toHaveProperty('denominator');
    });

    it('answer equals numerator / denominator', () => {
      const problem = generateProblem('l21-conditional-table', {}, {});
      const expected = problem.context.numerator / problem.context.denominator;
      expect(Math.abs(problem.answers.condTableAnswer.value - expected)).toBeLessThan(0.01);
    });

    it('includes condition and target in context', () => {
      const problem = generateProblem('l21-conditional-table', {}, {});
      expect(problem.context).toHaveProperty('condition');
      expect(problem.context).toHaveProperty('target');
    });
  });

  describe('L22 - General Multiplication Rule', () => {
    it('generates multiplication rule problem', () => {
      const problem = generateProblem('l22-multiplication-rule', {}, {});
      expect(problem.answers).toHaveProperty('multRuleAnswer');
    });

    it('answer is numeric between 0 and 1', () => {
      const problem = generateProblem('l22-multiplication-rule', {}, {});
      const value = problem.answers.multRuleAnswer.value;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('includes pA and pBgivenA in context', () => {
      const problem = generateProblem('l22-multiplication-rule', {}, {});
      expect(problem.context).toHaveProperty('pA');
      expect(problem.context).toHaveProperty('pBgivenA');
    });

    it('includes explanation in context', () => {
      const problem = generateProblem('l22-multiplication-rule', {}, {});
      expect(problem.context).toHaveProperty('explanation');
    });
  });

  describe('L23 - Order Matters (P(A|B) vs P(B|A))', () => {
    it('generates order matters problem with two answers', () => {
      const problem = generateProblem('l23-order-matters', {}, {});
      expect(problem.answers).toHaveProperty('orderAgivenB');
      expect(problem.answers).toHaveProperty('orderBgivenA');
    });

    it('both answers are numeric between 0 and 1', () => {
      const problem = generateProblem('l23-order-matters', {}, {});
      const val1 = problem.answers.orderAgivenB.value;
      const val2 = problem.answers.orderBgivenA.value;
      expect(typeof val1).toBe('number');
      expect(typeof val2).toBe('number');
      expect(val1).toBeGreaterThanOrEqual(0);
      expect(val1).toBeLessThanOrEqual(1);
      expect(val2).toBeGreaterThanOrEqual(0);
      expect(val2).toBeLessThanOrEqual(1);
    });

    it('includes n_AandB, n_A, and n_B in context', () => {
      const problem = generateProblem('l23-order-matters', {}, {});
      expect(problem.context).toHaveProperty('n_AandB');
      expect(problem.context).toHaveProperty('n_A');
      expect(problem.context).toHaveProperty('n_B');
    });

    it('answers are generally different (order matters!)', () => {
      // Generate multiple problems to find one where they differ
      let foundDifferent = false;
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l23-order-matters', {}, {});
        if (Math.abs(problem.answers.orderAgivenB.value - problem.answers.orderBgivenA.value) > 0.01) {
          foundDifferent = true;
          break;
        }
      }
      expect(foundDifferent).toBe(true);
    });

    it('includes eventA and eventB in context', () => {
      const problem = generateProblem('l23-order-matters', {}, {});
      expect(problem.context).toHaveProperty('eventA');
      expect(problem.context).toHaveProperty('eventB');
    });
  });

  describe('L24 - Mixed 4.4-4.5 Capstone', () => {
    it('generates capstone problem', () => {
      const problem = generateProblem('l24-mixed-4-4-5', {}, {});
      expect(problem.answers).toHaveProperty('capstone44Answer');
      expect(problem.answers).toHaveProperty('capstone44Explain');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l24-mixed-4-4-5', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('topicId is 4.4-4.5', () => {
      const problem = generateProblem('l24-mixed-4-4-5', {}, {});
      expect(problem.context.topicId).toBe('4.4-4.5');
    });

    it('includes concept and explanation in context', () => {
      const problem = generateProblem('l24-mixed-4-4-5', {}, {});
      expect(problem.context).toHaveProperty('concept');
      expect(problem.context).toHaveProperty('explanation');
    });
  });

  // ========== TOPIC 4.4-4.5 UNIQUENESS TESTS ==========
  describe('Topic 4.4-4.5 Problem Uniqueness', () => {
    it('generates different ME definition scenarios', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l17-mutually-exclusive-def', {}, {});
        scenarios.add(problem.context.givenText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different joint probability scenarios', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l18-joint-probability', {}, {});
        scenarios.add(problem.context.eventA + problem.context.eventB);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates both ME and non-ME scenarios for L19', () => {
      let hasME = false;
      let hasNotME = false;
      for (let i = 0; i < 15; i++) {
        const problem = generateProblem('l19-identify-me', {}, {});
        if (problem.context.isME) hasME = true;
        else hasNotME = true;
      }
      expect(hasME).toBe(true);
      expect(hasNotME).toBe(true);
    });

    it('generates different conditional probability scenarios', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l21-conditional-table', {}, {});
        scenarios.add(problem.context.condition + problem.context.target);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });
  });

  // ========== TOPIC 4.3 UNIQUENESS TESTS ==========
  describe('Topic 4.3 Problem Uniqueness', () => {
    it('generates different sample space scenarios', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l12-sample-space', {}, {});
        scenarios.add(problem.context.givenText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different complement scenarios', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l14-complement-rule', {}, {});
        scenarios.add(problem.context.givenText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates both valid and invalid probability models', () => {
      let hasValid = false;
      let hasInvalid = false;
      for (let i = 0; i < 15; i++) {
        const problem = generateProblem('l13-valid-probability', {}, {});
        if (problem.context.isValid) hasValid = true;
        else hasInvalid = true;
      }
      expect(hasValid).toBe(true);
      expect(hasInvalid).toBe(true);
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

  // ========== TOPIC 4.7-4.8 TESTS ==========
  describe('L33 - Random Variable Definition', () => {
    it('generates random variable definition question', () => {
      const problem = generateProblem('l33-random-var-def', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.7a');
      expect(problem.context.problemText).toContain('random variable');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l33-random-var-def', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('provides correct answer', () => {
      const problem = generateProblem('l33-random-var-def', {}, {});
      expect(problem.answers).toHaveProperty('rvDefAnswer');
      expect(problem.answers.rvDefAnswer).toHaveProperty('value');
    });

    it('correct answer is one of the options', () => {
      const problem = generateProblem('l33-random-var-def', {}, {});
      const options = [problem.context.optA, problem.context.optB, problem.context.optC, problem.context.optD];
      expect(options).toContain(problem.answers.rvDefAnswer.value);
    });
  });

  describe('L34 - Discrete vs Continuous', () => {
    it('generates discrete/continuous question', () => {
      const problem = generateProblem('l34-discrete-continuous', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.7b');
      expect(problem.context.problemText).toContain('Discrete');
      expect(problem.context.problemText).toContain('Continuous');
    });

    it('answer is valid Discrete/Continuous choice', () => {
      const problem = generateProblem('l34-discrete-continuous', {}, {});
      expect(problem.answers).toHaveProperty('discContAnswer');
      expect(['Discrete', 'Continuous']).toContain(problem.answers.discContAnswer.value);
    });

    it('includes explanation in context', () => {
      const problem = generateProblem('l34-discrete-continuous', {}, {});
      expect(problem.context).toHaveProperty('explanation');
      expect(problem.context.explanation).toBeTruthy();
    });

    it('generates both discrete and continuous scenarios', () => {
      const types = new Set();
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem('l34-discrete-continuous', {}, {});
        types.add(problem.answers.discContAnswer.value);
      }
      expect(types.has('Discrete')).toBe(true);
      expect(types.has('Continuous')).toBe(true);
    });
  });

  describe('L35 - Valid Probability Distribution', () => {
    it('generates valid distribution check question', () => {
      const problem = generateProblem('l35-valid-prob-dist', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.7c');
    });

    it('includes table data in context', () => {
      const problem = generateProblem('l35-valid-prob-dist', {}, {});
      expect(problem.context).toHaveProperty('tableX');
      expect(problem.context).toHaveProperty('tableP');
      expect(problem.context.tableX.length).toBeGreaterThan(0);
      expect(problem.context.tableP.length).toBeGreaterThan(0);
    });

    it('includes isValid and reason in context', () => {
      const problem = generateProblem('l35-valid-prob-dist', {}, {});
      expect(problem.context).toHaveProperty('isValid');
      expect(problem.context).toHaveProperty('reason');
      expect(typeof problem.context.isValid).toBe('boolean');
    });

    it('answer matches isValid flag', () => {
      const problem = generateProblem('l35-valid-prob-dist', {}, {});
      const expected = problem.context.isValid ? 'Yes, valid' : 'No, invalid';
      expect(problem.answers.validDistAnswer.value).toBe(expected);
    });

    it('generates both valid and invalid distributions', () => {
      const validities = new Set();
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem('l35-valid-prob-dist', {}, {});
        validities.add(problem.context.isValid);
      }
      expect(validities.has(true)).toBe(true);
      expect(validities.has(false)).toBe(true);
    });
  });

  describe('L36 - Probability from Distribution', () => {
    it('generates probability calculation problem', () => {
      const problem = generateProblem('l36-prob-from-dist', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.7d');
    });

    it('answer is numeric between 0 and 1', () => {
      const problem = generateProblem('l36-prob-from-dist', {}, {});
      expect(problem.answers).toHaveProperty('probDistAnswer');
      const value = problem.answers.probDistAnswer.value;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('includes calculation and explanation in context', () => {
      const problem = generateProblem('l36-prob-from-dist', {}, {});
      expect(problem.context).toHaveProperty('calculation');
      expect(problem.context).toHaveProperty('explanation');
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l36-prob-from-dist', {}, {});
      expect(problem.answers.probDistAnswer).toHaveProperty('tolerance');
    });
  });

  describe('L37 - Describe Distribution', () => {
    it('generates distribution description question', () => {
      const problem = generateProblem('l37-describe-dist', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.7e');
    });

    it('includes distribution name and data', () => {
      const problem = generateProblem('l37-describe-dist', {}, {});
      expect(problem.context).toHaveProperty('distName');
      expect(problem.context.givenText).toBeTruthy();
    });

    it('provides shape answer', () => {
      const problem = generateProblem('l37-describe-dist', {}, {});
      expect(problem.answers).toHaveProperty('shapeAnswer');
      const value = problem.answers.shapeAnswer.value;
      expect(value).toMatch(/skewed|symmetric|uniform/i);
    });

    it('includes shape explanation', () => {
      const problem = generateProblem('l37-describe-dist', {}, {});
      expect(problem.context).toHaveProperty('shapeExplanation');
      expect(problem.context.shapeExplanation).toBeTruthy();
    });
  });

  describe('L38 - Mean (Expected Value)', () => {
    it('generates mean calculation problem', () => {
      const problem = generateProblem('l38-mean-formula', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.8a');
      expect(problem.context.problemText).toContain('Mean');
    });

    it('provides numeric answer', () => {
      const problem = generateProblem('l38-mean-formula', {}, {});
      expect(problem.answers).toHaveProperty('meanAnswer');
      expect(typeof problem.answers.meanAnswer.value).toBe('number');
    });

    it('includes calculation and interpretation', () => {
      const problem = generateProblem('l38-mean-formula', {}, {});
      expect(problem.context).toHaveProperty('calculation');
      expect(problem.context).toHaveProperty('interpretation');
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l38-mean-formula', {}, {});
      expect(problem.answers.meanAnswer).toHaveProperty('tolerance');
    });
  });

  describe('L39 - Standard Deviation', () => {
    it('generates standard deviation calculation problem', () => {
      const problem = generateProblem('l39-std-dev-formula', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.8b');
      expect(problem.context.problemText).toContain('Standard Deviation');
    });

    it('provides numeric answer', () => {
      const problem = generateProblem('l39-std-dev-formula', {}, {});
      expect(problem.answers).toHaveProperty('stdDevAnswer');
      const value = problem.answers.stdDevAnswer.value;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('includes mean in context', () => {
      const problem = generateProblem('l39-std-dev-formula', {}, {});
      expect(problem.context).toHaveProperty('mean');
      expect(typeof problem.context.mean).toBe('number');
    });

    it('includes interpretation', () => {
      const problem = generateProblem('l39-std-dev-formula', {}, {});
      expect(problem.context).toHaveProperty('interpretation');
      expect(problem.context.interpretation).toBeTruthy();
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l39-std-dev-formula', {}, {});
      expect(problem.answers.stdDevAnswer).toHaveProperty('tolerance');
    });
  });

  describe('L40 - Interpret Parameters (Capstone)', () => {
    it('generates interpretation problem', () => {
      const problem = generateProblem('l40-interpret-params', {}, {});
      expect(problem.context).toHaveProperty('topicId', '4.7-4.8');
    });

    it('provides dropdown options', () => {
      const problem = generateProblem('l40-interpret-params', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('includes concept type in context', () => {
      const problem = generateProblem('l40-interpret-params', {}, {});
      expect(problem.context).toHaveProperty('concept');
    });

    it('correct answer is one of the options', () => {
      const problem = generateProblem('l40-interpret-params', {}, {});
      const options = [problem.context.optA, problem.context.optB, problem.context.optC, problem.context.optD];
      expect(options).toContain(problem.answers.interpretAnswer.value);
    });
  });

  describe('Topic 4.7-4.8 Problem Uniqueness', () => {
    it('generates different random variable definition scenarios', () => {
      const questions = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l33-random-var-def', {}, {});
        questions.add(problem.context.givenText);
      }
      expect(questions.size).toBeGreaterThan(1);
    });

    it('generates different probability distribution scenarios', () => {
      const scenarios = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l36-prob-from-dist', {}, {});
        scenarios.add(problem.scenario);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different mean calculation scenarios', () => {
      const descriptions = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l38-mean-formula', {}, {});
        descriptions.add(problem.context.givenText);
      }
      expect(descriptions.size).toBeGreaterThan(1);
    });
  });
});
