/**
 * AP Statistics Unit 6 (Topics 6.1-6.2) Generator Tests
 * Tests problem generation for inference on proportions:
 * identify evidence, two explanations, convincing evidence, identify procedure,
 * check conditions, standard error, critical values, margin of error,
 * confidence intervals, minimum sample size, capstone
 */
import { describe, it, expect } from 'vitest';
import { generateProblem } from '../../cartridges/apstats-u6-inference-prop/generator.js';

describe('AP Stats U6 Inference for Proportions Generator', () => {
  // ========== BASIC STRUCTURE TESTS ==========
  describe('Problem Structure', () => {
    it('generates problem with required fields', () => {
      const problem = generateProblem('l01-identify-evidence', {}, {});

      expect(problem).toHaveProperty('scenario');
      expect(problem).toHaveProperty('context');
      expect(problem).toHaveProperty('answers');
      expect(problem.scenario).toBeTruthy();
      expect(problem.context).toBeTruthy();
    });

    it('includes topicId in context', () => {
      const problem = generateProblem('l01-identify-evidence', {}, {});
      expect(problem.context).toHaveProperty('topicId');
      expect(problem.context.topicId).toContain('6.1');
    });

    it('includes scenarioText in context', () => {
      const problem = generateProblem('l01-identify-evidence', {}, {});
      expect(problem.context).toHaveProperty('scenarioText');
      expect(problem.context.scenarioText).toBeTruthy();
    });
  });

  // ========== L01: Identify Evidence (6.1a) ==========
  describe('L01 - Identify Evidence', () => {
    it('generates choice options optA and optB', () => {
      const problem = generateProblem('l01-identify-evidence', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context.optA).toBeTruthy();
      expect(problem.context.optB).toBeTruthy();
    });

    it('provides evidenceAnswer in answers', () => {
      const problem = generateProblem('l01-identify-evidence', {}, {});
      expect(problem.answers).toHaveProperty('evidenceAnswer');
      expect(problem.answers.evidenceAnswer).toHaveProperty('value');
    });

    it('correct answer is one of the two options', () => {
      const problem = generateProblem('l01-identify-evidence', {}, {});
      const options = [problem.context.optA, problem.context.optB];
      expect(options).toContain(problem.answers.evidenceAnswer.value);
    });

    it('evidence answer references sample proportion comparison', () => {
      const problem = generateProblem('l01-identify-evidence', {}, {});
      const answer = problem.answers.evidenceAnswer.value.toLowerCase();
      expect(answer).toMatch(/sample proportion|p̂|greater|less/i);
    });
  });

  // ========== L02: Two Explanations (6.1b) ==========
  describe('L02 - Two Explanations', () => {
    it('generates dropdown options optA through optD', () => {
      const problem = generateProblem('l02-two-explanations', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('provides explanationAnswer in answers', () => {
      const problem = generateProblem('l02-two-explanations', {}, {});
      expect(problem.answers).toHaveProperty('explanationAnswer');
      expect(problem.answers.explanationAnswer).toHaveProperty('value');
    });

    it('correct answer is one of the four options', () => {
      const problem = generateProblem('l02-two-explanations', {}, {});
      const options = [
        problem.context.optA,
        problem.context.optB,
        problem.context.optC,
        problem.context.optD
      ];
      expect(options).toContain(problem.answers.explanationAnswer.value);
    });

    it('correct answer mentions chance and real effect', () => {
      const problem = generateProblem('l02-two-explanations', {}, {});
      const answer = problem.answers.explanationAnswer.value.toLowerCase();
      expect(answer).toContain('chance');
    });
  });

  // ========== L03: Convincing Evidence (6.1c) ==========
  describe('L03 - Convincing Evidence', () => {
    it('provides convincingAnswer and convincingExplain', () => {
      const problem = generateProblem('l03-convincing-evidence', {}, {});
      expect(problem.answers).toHaveProperty('convincingAnswer');
      expect(problem.answers).toHaveProperty('convincingExplain');
    });

    it('convincingAnswer is one of the two valid choices', () => {
      const problem = generateProblem('l03-convincing-evidence', {}, {});
      const value = problem.answers.convincingAnswer.value;
      expect([
        'Yes, convincing evidence',
        'No, not convincing evidence'
      ]).toContain(value);
    });

    it('context includes simulation count and total', () => {
      const problem = generateProblem('l03-convincing-evidence', {}, {});
      expect(problem.context).toHaveProperty('simCount');
      expect(problem.context).toHaveProperty('simTotal');
    });

    it('convincingExplain has a value', () => {
      const problem = generateProblem('l03-convincing-evidence', {}, {});
      expect(problem.answers.convincingExplain.value).toBeTruthy();
    });
  });

  // ========== L04: Identify Procedure (6.2a) ==========
  describe('L04 - Identify Procedure', () => {
    it('generates dropdown options optA through optD', () => {
      const problem = generateProblem('l04-identify-procedure', {}, {});
      expect(problem.context).toHaveProperty('optA');
      expect(problem.context).toHaveProperty('optB');
      expect(problem.context).toHaveProperty('optC');
      expect(problem.context).toHaveProperty('optD');
    });

    it('provides procedureAnswer in answers', () => {
      const problem = generateProblem('l04-identify-procedure', {}, {});
      expect(problem.answers).toHaveProperty('procedureAnswer');
      expect(problem.answers.procedureAnswer).toHaveProperty('value');
    });

    it('correct answer is one of the four options', () => {
      const problem = generateProblem('l04-identify-procedure', {}, {});
      const options = [
        problem.context.optA,
        problem.context.optB,
        problem.context.optC,
        problem.context.optD
      ];
      expect(options).toContain(problem.answers.procedureAnswer.value);
    });

    it('correct answer is always the one-sample z-interval for proportion', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l04-identify-procedure', {}, {});
        expect(problem.answers.procedureAnswer.value).toBe(
          'One-sample z-interval for a population proportion'
        );
      }
    });
  });

  // ========== L05: Check Conditions (6.2b) ==========
  describe('L05 - Check Conditions', () => {
    it('provides conditionsMet and conditionsExplain', () => {
      const problem = generateProblem('l05-check-conditions', {}, {});
      expect(problem.answers).toHaveProperty('conditionsMet');
      expect(problem.answers).toHaveProperty('conditionsExplain');
    });

    it('conditionsMet is one of the two valid choices', () => {
      const problem = generateProblem('l05-check-conditions', {}, {});
      const value = problem.answers.conditionsMet.value;
      expect([
        'Yes, all conditions are met',
        'No, at least one condition fails'
      ]).toContain(value);
    });

    it('context includes n, N, and pHat', () => {
      const problem = generateProblem('l05-check-conditions', {}, {});
      expect(problem.context).toHaveProperty('n');
      expect(problem.context).toHaveProperty('N');
      expect(problem.context).toHaveProperty('pHat');
    });

    it('generates both met and not-met scenarios over multiple calls', () => {
      let hasMet = false;
      let hasNotMet = false;
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem('l05-check-conditions', {}, {});
        if (problem.context.allConditionsMet) hasMet = true;
        else hasNotMet = true;
      }
      expect(hasMet).toBe(true);
      expect(hasNotMet).toBe(true);
    });
  });

  // ========== L06: Standard Error (6.2c) ==========
  describe('L06 - Standard Error', () => {
    it('provides seAnswer in answers', () => {
      const problem = generateProblem('l06-standard-error', {}, {});
      expect(problem.answers).toHaveProperty('seAnswer');
      expect(problem.answers.seAnswer).toHaveProperty('value');
    });

    it('SE is a positive number less than 1', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l06-standard-error', {}, {});
        const se = problem.answers.seAnswer.value;
        expect(typeof se).toBe('number');
        expect(se).toBeGreaterThan(0);
        expect(se).toBeLessThan(1);
      }
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l06-standard-error', {}, {});
      expect(problem.answers.seAnswer).toHaveProperty('tolerance');
    });

    it('context includes pHat and n', () => {
      const problem = generateProblem('l06-standard-error', {}, {});
      expect(problem.context).toHaveProperty('pHat');
      expect(problem.context).toHaveProperty('n');
    });

    it('SE equals sqrt(pHat*(1-pHat)/n)', () => {
      const problem = generateProblem('l06-standard-error', {}, {});
      const pHat = parseFloat(problem.context.pHat);
      const n = parseInt(problem.context.n);
      const expectedSE = Math.round(Math.sqrt(pHat * (1 - pHat) / n) * 10000) / 10000;
      expect(Math.abs(problem.answers.seAnswer.value - expectedSE)).toBeLessThan(0.001);
    });
  });

  // ========== L07: Critical Value (6.2d) ==========
  describe('L07 - Critical Value', () => {
    it('provides zStarAnswer in answers', () => {
      const problem = generateProblem('l07-critical-value', {}, {});
      expect(problem.answers).toHaveProperty('zStarAnswer');
      expect(problem.answers.zStarAnswer).toHaveProperty('value');
    });

    it('z* is one of the standard critical values', () => {
      const validZStars = [1.282, 1.645, 1.960, 2.576];
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l07-critical-value', {}, {});
        expect(validZStars).toContain(problem.answers.zStarAnswer.value);
      }
    });

    it('context includes confLevel', () => {
      const problem = generateProblem('l07-critical-value', {}, {});
      expect(problem.context).toHaveProperty('confLevel');
      const level = parseInt(problem.context.confLevel);
      expect([80, 90, 95, 99]).toContain(level);
    });

    it('generates different confidence levels over multiple calls', () => {
      const levels = new Set();
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem('l07-critical-value', {}, {});
        levels.add(problem.context.confLevel);
      }
      expect(levels.size).toBeGreaterThan(1);
    });
  });

  // ========== L08: Margin of Error (6.2e) ==========
  describe('L08 - Margin of Error', () => {
    it('provides meAnswer in answers', () => {
      const problem = generateProblem('l08-margin-of-error', {}, {});
      expect(problem.answers).toHaveProperty('meAnswer');
      expect(problem.answers.meAnswer).toHaveProperty('value');
    });

    it('ME is a positive number', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l08-margin-of-error', {}, {});
        const me = problem.answers.meAnswer.value;
        expect(typeof me).toBe('number');
        expect(me).toBeGreaterThan(0);
      }
    });

    it('context includes pHat, n, confLevel, and zStar', () => {
      const problem = generateProblem('l08-margin-of-error', {}, {});
      expect(problem.context).toHaveProperty('pHat');
      expect(problem.context).toHaveProperty('n');
      expect(problem.context).toHaveProperty('confLevel');
      expect(problem.context).toHaveProperty('zStar');
    });

    it('ME equals z* * sqrt(pHat*(1-pHat)/n)', () => {
      const problem = generateProblem('l08-margin-of-error', {}, {});
      const pHat = parseFloat(problem.context.pHat);
      const n = parseInt(problem.context.n);
      const zStar = parseFloat(problem.context.zStar);
      const se = Math.sqrt(pHat * (1 - pHat) / n);
      const expectedME = Math.round(zStar * se * 10000) / 10000;
      expect(Math.abs(problem.answers.meAnswer.value - expectedME)).toBeLessThan(0.001);
    });
  });

  // ========== L09: Confidence Interval (6.2f) ==========
  describe('L09 - Confidence Interval', () => {
    it('provides ciLower and ciUpper in answers', () => {
      const problem = generateProblem('l09-confidence-interval', {}, {});
      expect(problem.answers).toHaveProperty('ciLower');
      expect(problem.answers).toHaveProperty('ciUpper');
    });

    it('lower bound is less than upper bound', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l09-confidence-interval', {}, {});
        expect(problem.answers.ciLower.value).toBeLessThan(problem.answers.ciUpper.value);
      }
    });

    it('both bounds are between 0 and 1', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l09-confidence-interval', {}, {});
        expect(problem.answers.ciLower.value).toBeGreaterThanOrEqual(0);
        expect(problem.answers.ciLower.value).toBeLessThanOrEqual(1);
        expect(problem.answers.ciUpper.value).toBeGreaterThanOrEqual(0);
        expect(problem.answers.ciUpper.value).toBeLessThanOrEqual(1);
      }
    });

    it('includes tolerance for grading', () => {
      const problem = generateProblem('l09-confidence-interval', {}, {});
      expect(problem.answers.ciLower).toHaveProperty('tolerance');
      expect(problem.answers.ciUpper).toHaveProperty('tolerance');
    });

    it('CI is centered at pHat', () => {
      const problem = generateProblem('l09-confidence-interval', {}, {});
      const pHat = parseFloat(problem.context.pHat);
      const midpoint = (problem.answers.ciLower.value + problem.answers.ciUpper.value) / 2;
      expect(Math.abs(midpoint - pHat)).toBeLessThan(0.01);
    });
  });

  // ========== L10: Minimum Sample Size (6.2g) ==========
  describe('L10 - Minimum Sample Size', () => {
    it('provides sampleSizeAnswer in answers', () => {
      const problem = generateProblem('l10-min-sample-size', {}, {});
      expect(problem.answers).toHaveProperty('sampleSizeAnswer');
      expect(problem.answers.sampleSizeAnswer).toHaveProperty('value');
    });

    it('sample size is a positive integer', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l10-min-sample-size', {}, {});
        const n = problem.answers.sampleSizeAnswer.value;
        expect(typeof n).toBe('number');
        expect(n).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(n)).toBe(true);
      }
    });

    it('context includes desiredME, confLevel, zStar, and pHatGuess', () => {
      const problem = generateProblem('l10-min-sample-size', {}, {});
      expect(problem.context).toHaveProperty('desiredME');
      expect(problem.context).toHaveProperty('confLevel');
      expect(problem.context).toHaveProperty('zStar');
      expect(problem.context).toHaveProperty('pHatGuess');
    });

    it('sample size matches formula: ceil(pHat*(1-pHat)*(z*/ME)^2)', () => {
      const problem = generateProblem('l10-min-sample-size', {}, {});
      const pHat = parseFloat(problem.context.pHatGuess);
      const zStar = parseFloat(problem.context.zStar);
      const me = parseFloat(problem.context.desiredME);
      const expectedN = Math.ceil(pHat * (1 - pHat) * Math.pow(zStar / me, 2));
      expect(problem.answers.sampleSizeAnswer.value).toBe(expectedN);
    });
  });

  // ========== L11: Capstone 6.2 ==========
  describe('L11 - Capstone 6.2', () => {
    it('provides all four capstone fields in answers', () => {
      const problem = generateProblem('l11-capstone-62', {}, {});
      expect(problem.answers).toHaveProperty('capstoneConditions');
      expect(problem.answers).toHaveProperty('capstoneLower');
      expect(problem.answers).toHaveProperty('capstoneUpper');
      expect(problem.answers).toHaveProperty('capstoneExplain');
    });

    it('capstoneConditions is always "Yes, all conditions are met"', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l11-capstone-62', {}, {});
        expect(problem.answers.capstoneConditions.value).toBe('Yes, all conditions are met');
      }
    });

    it('capstoneLower < capstoneUpper', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l11-capstone-62', {}, {});
        expect(problem.answers.capstoneLower.value).toBeLessThan(
          problem.answers.capstoneUpper.value
        );
      }
    });

    it('both CI bounds are between 0 and 1', () => {
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l11-capstone-62', {}, {});
        expect(problem.answers.capstoneLower.value).toBeGreaterThanOrEqual(0);
        expect(problem.answers.capstoneUpper.value).toBeLessThanOrEqual(1);
      }
    });

    it('capstoneExplain value mentions confidence and proportion', () => {
      const problem = generateProblem('l11-capstone-62', {}, {});
      const explain = problem.answers.capstoneExplain.value.toLowerCase();
      expect(explain).toContain('confident');
      expect(explain).toContain('proportion');
    });

    it('context includes pHat, n, N, confLevel, zStar', () => {
      const problem = generateProblem('l11-capstone-62', {}, {});
      expect(problem.context).toHaveProperty('pHat');
      expect(problem.context).toHaveProperty('n');
      expect(problem.context).toHaveProperty('N');
      expect(problem.context).toHaveProperty('confLevel');
      expect(problem.context).toHaveProperty('zStar');
    });
  });

  // ========== SHUFFLE BAG VARIETY TESTS ==========
  describe('Shuffle Bag Variety', () => {
    it('generates different L01 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l01-identify-evidence', {}, {});
        scenarios.add(problem.context.scenarioText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L02 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l02-two-explanations', {}, {});
        scenarios.add(problem.context.scenarioText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L03 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l03-convincing-evidence', {}, {});
        scenarios.add(problem.context.scenarioText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L04 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l04-identify-procedure', {}, {});
        scenarios.add(problem.context.scenarioText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L05 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l05-check-conditions', {}, {});
        scenarios.add(problem.context.scenarioText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L06 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l06-standard-error', {}, {});
        scenarios.add(problem.scenario);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L07 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l07-critical-value', {}, {});
        scenarios.add(problem.scenario);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L08 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l08-margin-of-error', {}, {});
        scenarios.add(problem.scenario);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L09 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l09-confidence-interval', {}, {});
        scenarios.add(problem.scenario);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L10 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l10-min-sample-size', {}, {});
        scenarios.add(problem.scenario);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('generates different L11 scenarios across 5 calls', () => {
      const scenarios = new Set();
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem('l11-capstone-62', {}, {});
        scenarios.add(problem.context.scenarioText);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });
  });

  // ========== ERROR HANDLING ==========
  describe('Error Handling', () => {
    it('handles unknown mode gracefully', () => {
      expect(() => generateProblem('unknown-mode', {}, {})).not.toThrow();
    });

    it('returns fallback for unknown mode', () => {
      const problem = generateProblem('unknown-mode', {}, {});
      expect(problem.scenario).toContain('not implemented');
    });
  });
});
