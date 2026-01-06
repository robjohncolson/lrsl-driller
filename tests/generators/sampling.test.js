/**
 * Sampling Generator Tests
 * Tests problem generation, required fields, and uniqueness
 */
import { describe, it, expect } from 'vitest';
import { generateProblem } from '../../cartridges/sampling/generator.js';

describe('Sampling Generator', () => {
  // ========== BASIC STRUCTURE TESTS ==========
  describe('Problem Structure', () => {
    it('generates problem with required fields', () => {
      const problem = generateProblem('l01-chance-matters', {}, {});

      expect(problem).toHaveProperty('scenario');
      expect(problem).toHaveProperty('context');
      expect(problem.scenario).toBeTruthy();
      expect(problem.context).toBeTruthy();
    });

    it('context includes expected answer', () => {
      const problem = generateProblem('l01-chance-matters', {}, {});

      // L01 should have chanceTrust in context
      expect(problem.context).toHaveProperty('chanceTrust');
      // Value may be object { value: "Yes" } or raw string
      const value = problem.context.chanceTrust?.value ?? problem.context.chanceTrust;
      expect(['Yes', 'No']).toContain(value);
    });

    it('includes topicId in context', () => {
      const problem = generateProblem('l01-chance-matters', {}, {});
      expect(problem.context).toHaveProperty('topicId');
    });
  });

  // ========== MODE-SPECIFIC TESTS ==========
  describe('Mode-Specific Generation', () => {
    describe('L01 - Chance Matters', () => {
      it('generates valid Yes/No answer', () => {
        const problem = generateProblem('l01-chance-matters', {}, {});
        const value = problem.context.chanceTrust?.value ?? problem.context.chanceTrust;
        expect(['Yes', 'No']).toContain(value);
      });
    });

    describe('L02 - Population vs Sample', () => {
      it('generates valid Population/Sample answer', () => {
        const problem = generateProblem('l02-population-sample', {}, {});
        const value = problem.context.popOrSample?.value ?? problem.context.popOrSample;
        expect(['Population', 'Sample']).toContain(value);
      });
    });

    describe('L03 - Observational vs Experiment', () => {
      it('generates valid study type', () => {
        const problem = generateProblem('l03-obs-vs-exp', {}, {});
        expect(problem.context).toHaveProperty('studyType');
      });
    });

    describe('L10 - Stratified vs Cluster', () => {
      it('generates stratified and cluster features', () => {
        const problem = generateProblem('l10-strat-vs-cluster', {}, {});
        expect(problem.context).toHaveProperty('stratFeature');
        expect(problem.context).toHaveProperty('clusterFeature');
      });
    });

    describe('L11 - Systematic & Census', () => {
      it('generates valid method type', () => {
        const problem = generateProblem('l11-systematic-census', {}, {});
        expect(problem.context).toHaveProperty('methodType');
      });
    });

    describe('L12 - Identify the Method', () => {
      it('generates problem with dropdown options', () => {
        const problem = generateProblem('l12-identify-method', {}, {});
        expect(problem.context).toHaveProperty('methodId');
        // Should have options for dropdown
        expect(problem.context).toHaveProperty('optA');
        expect(problem.context).toHaveProperty('optB');
      });
    });
  });

  // ========== UNIQUENESS TESTS ==========
  describe('Problem Uniqueness', () => {
    it('generates different scenarios across multiple calls', () => {
      const scenarios = new Set();

      // Generate 10 problems
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('l01-chance-matters', {}, {});
        scenarios.add(problem.scenario);
      }

      // Should have more than 1 unique scenario
      expect(scenarios.size).toBeGreaterThan(1);
    });

    it('L10 generates stratified vs cluster problems', () => {
      // Just verify it generates valid structure
      const problem = generateProblem('l10-strat-vs-cluster', {}, {});
      expect(problem.context).toHaveProperty('stratFeature');
      expect(problem.context).toHaveProperty('clusterFeature');
    });
  });

  // ========== CONTEXT COMPLETENESS ==========
  describe('Context Completeness', () => {
    it('includes problemText for display', () => {
      const problem = generateProblem('l01-chance-matters', {}, {});
      expect(problem.context.problemText || problem.context.givenText).toBeTruthy();
    });

    it('L16 bias problems include biasType', () => {
      const problem = generateProblem('l16-sampling-bias', {}, {});
      expect(problem.context).toHaveProperty('biasType');
      const value = problem.context.biasType?.value ?? problem.context.biasType;
      expect(['Voluntary response bias', 'Undercoverage bias', 'Nonresponse bias', 'Response bias'])
        .toContain(value);
    });
  });

  // ========== ERROR HANDLING ==========
  describe('Error Handling', () => {
    it('handles unknown mode gracefully', () => {
      // Should not throw
      expect(() => generateProblem('unknown-mode', {}, {})).not.toThrow();
    });
  });
});
