/**
 * AP Statistics Unit 3 Lesson 5 - Experimental Design Generator Tests
 * Tests problem generation for all three modes (L01, L02, L03)
 */
import { describe, it, expect } from 'vitest';
import { generateProblem } from '../../cartridges/apstats-u3l5-experimental-design/generator.js';

describe('Experimental Design Generator', () => {
  // ========== BASIC STRUCTURE TESTS ==========
  describe('Problem Structure', () => {
    it('generates problem with required fields for L01', () => {
      const problem = generateProblem('L01', {}, {});

      expect(problem).toHaveProperty('scenario');
      expect(problem).toHaveProperty('context');
      expect(problem).toHaveProperty('answers');
      expect(problem.scenario).toBeTruthy();
      expect(problem.context).toBeTruthy();
    });

    it('generates problem with required fields for L02', () => {
      const problem = generateProblem('L02', {}, {});

      expect(problem).toHaveProperty('scenario');
      expect(problem).toHaveProperty('context');
      expect(problem).toHaveProperty('answers');
      expect(problem.answers).toHaveProperty('decision');
      expect(problem.answers).toHaveProperty('justification');
    });

    it('generates problem with required fields for L03', () => {
      const problem = generateProblem('L03', {}, {});

      expect(problem).toHaveProperty('scenario');
      expect(problem).toHaveProperty('context');
      expect(problem).toHaveProperty('answers');
      expect(problem.context).toHaveProperty('requiredElements');
    });

    it('defaults to L01 for unknown mode', () => {
      const problem = generateProblem('unknown', {}, {});
      expect(problem.context.mode).toBe('L01');
    });
  });

  // ========== L01 MODE TESTS ==========
  describe('L01 - Direct Identification', () => {
    it('includes mode identifier in context', () => {
      const problem = generateProblem('L01', {}, {});
      expect(problem.context.mode).toBe('L01');
    });

    it('includes question ID', () => {
      const problem = generateProblem('L01', {}, {});
      expect(problem.context.qid).toBeTruthy();
      expect(problem.context.qid.startsWith('L01-')).toBe(true);
    });

    it('includes kind (mcq, keywords_any, or keywords_all)', () => {
      const problem = generateProblem('L01', {}, {});
      expect(['mcq', 'keywords_any', 'keywords_all']).toContain(problem.context.kind);
    });

    it('includes feedback for both correct and incorrect', () => {
      const problem = generateProblem('L01', {}, {});
      expect(problem.context.feedbackCorrect).toBeTruthy();
      expect(problem.context.feedbackIncorrect).toBeTruthy();
    });

    it('MCQ questions have correctLetter A-E', () => {
      // Generate multiple to find an MCQ
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem('L01', {}, {});
        if (problem.context.kind === 'mcq') {
          expect(['A', 'B', 'C', 'D', 'E']).toContain(problem.context.correctLetter);
          expect(problem.answers.answer.value).toBe(problem.context.correctLetter);
          return; // Found and tested
        }
      }
      // If no MCQ found after 20 tries, that's still okay (random)
    });

    it('keywords_any questions have keywordsAny array', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem('L01', {}, {});
        if (problem.context.kind === 'keywords_any') {
          expect(Array.isArray(problem.context.keywordsAny)).toBe(true);
          expect(problem.context.keywordsAny.length).toBeGreaterThan(0);
          return;
        }
      }
    });

    it('keywords_all questions have keywordsAll array', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem('L01', {}, {});
        if (problem.context.kind === 'keywords_all') {
          expect(Array.isArray(problem.context.keywordsAll)).toBe(true);
          expect(problem.context.keywordsAll.length).toBeGreaterThan(0);
          return;
        }
      }
    });

    it('includes problemText for display', () => {
      const problem = generateProblem('L01', {}, {});
      expect(problem.context.problemText).toBeTruthy();
      expect(problem.context.problemText.length).toBeGreaterThan(10);
    });
  });

  // ========== L02 MODE TESTS ==========
  describe('L02 - Decision + Justification', () => {
    it('includes mode identifier in context', () => {
      const problem = generateProblem('L02', {}, {});
      expect(problem.context.mode).toBe('L02');
    });

    it('includes question ID starting with L02', () => {
      const problem = generateProblem('L02', {}, {});
      expect(problem.context.qid.startsWith('L02-')).toBe(true);
    });

    it('has correctDecision of yes or no', () => {
      const problem = generateProblem('L02', {}, {});
      expect(['yes', 'no']).toContain(problem.context.correctDecision);
    });

    it('has keyPhrases array for justification grading', () => {
      const problem = generateProblem('L02', {}, {});
      expect(Array.isArray(problem.context.keyPhrases)).toBe(true);
      expect(problem.context.keyPhrases.length).toBeGreaterThan(0);
    });

    it('has idealJustification for reference', () => {
      const problem = generateProblem('L02', {}, {});
      expect(problem.context.idealJustification).toBeTruthy();
      expect(problem.context.idealJustification.length).toBeGreaterThan(20);
    });

    it('answers have decision and justification fields', () => {
      const problem = generateProblem('L02', {}, {});
      expect(problem.answers.decision.value).toBeTruthy();
      expect(['Yes', 'No']).toContain(problem.answers.decision.value);
      expect(problem.answers.justification.value).toBeTruthy();
    });

    it('scenario prompts for Yes/No and justification', () => {
      const problem = generateProblem('L02', {}, {});
      expect(problem.scenario).toContain('Yes/No');
    });
  });

  // ========== L03 MODE TESTS ==========
  describe('L03 - Free Response', () => {
    it('includes mode identifier in context', () => {
      const problem = generateProblem('L03', {}, {});
      expect(problem.context.mode).toBe('L03');
    });

    it('includes question ID starting with L03', () => {
      const problem = generateProblem('L03', {}, {});
      expect(problem.context.qid.startsWith('L03-')).toBe(true);
    });

    it('includes topic identifier', () => {
      const problem = generateProblem('L03', {}, {});
      expect(problem.context.topic).toContain('AP Statistics');
    });

    it('has requiredElements array with name and keywords', () => {
      const problem = generateProblem('L03', {}, {});
      expect(Array.isArray(problem.context.requiredElements)).toBe(true);
      expect(problem.context.requiredElements.length).toBeGreaterThan(0);

      const firstElement = problem.context.requiredElements[0];
      expect(firstElement).toHaveProperty('name');
      expect(firstElement).toHaveProperty('keywords');
      expect(Array.isArray(firstElement.keywords)).toBe(true);
    });

    it('has correctAnswer for reference', () => {
      const problem = generateProblem('L03', {}, {});
      expect(problem.context.correctAnswer).toBeTruthy();
      expect(problem.context.correctAnswer.length).toBeGreaterThan(20);
    });

    it('answers has empty response field (for student input)', () => {
      const problem = generateProblem('L03', {}, {});
      expect(problem.answers).toHaveProperty('response');
      expect(problem.answers.response.value).toBe('');
    });
  });

  // ========== UNIQUENESS TESTS ==========
  describe('Problem Uniqueness', () => {
    it('L01 generates different questions across calls', () => {
      const qids = new Set();
      for (let i = 0; i < 15; i++) {
        const problem = generateProblem('L01', {}, {});
        qids.add(problem.context.qid);
      }
      // Should have more than 1 unique question ID
      expect(qids.size).toBeGreaterThan(1);
    });

    it('L02 generates different scenarios across calls', () => {
      const qids = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('L02', {}, {});
        qids.add(problem.context.qid);
      }
      expect(qids.size).toBeGreaterThan(1);
    });

    it('L03 generates different prompts across calls', () => {
      const qids = new Set();
      for (let i = 0; i < 10; i++) {
        const problem = generateProblem('L03', {}, {});
        qids.add(problem.context.qid);
      }
      expect(qids.size).toBeGreaterThan(1);
    });
  });

  // ========== QUESTION BANK COVERAGE ==========
  describe('Question Bank Coverage', () => {
    it('L01 bank has at least 5 questions', () => {
      const qids = new Set();
      for (let i = 0; i < 50; i++) {
        const problem = generateProblem('L01', {}, {});
        qids.add(problem.context.qid);
      }
      expect(qids.size).toBeGreaterThanOrEqual(5);
    });

    it('L02 bank has at least 4 questions', () => {
      const qids = new Set();
      for (let i = 0; i < 40; i++) {
        const problem = generateProblem('L02', {}, {});
        qids.add(problem.context.qid);
      }
      expect(qids.size).toBeGreaterThanOrEqual(4);
    });

    it('L03 bank has at least 3 questions', () => {
      const qids = new Set();
      for (let i = 0; i < 30; i++) {
        const problem = generateProblem('L03', {}, {});
        qids.add(problem.context.qid);
      }
      expect(qids.size).toBeGreaterThanOrEqual(3);
    });
  });

  // ========== SPECIFIC QUESTION VALIDATION ==========
  describe('Question Content Validation', () => {
    it('L01 MCQ questions include letter choices in prompt', () => {
      for (let i = 0; i < 30; i++) {
        const problem = generateProblem('L01', {}, {});
        if (problem.context.kind === 'mcq') {
          expect(problem.context.problemText).toMatch(/[A-E]\)/);
          return;
        }
      }
    });

    it('L02 yes scenarios have correct decision "yes"', () => {
      for (let i = 0; i < 30; i++) {
        const problem = generateProblem('L02', {}, {});
        if (problem.context.qid === 'L02-placebo-doubleblind') {
          expect(problem.context.correctDecision).toBe('yes');
          return;
        }
      }
    });

    it('L02 no scenarios have correct decision "no"', () => {
      for (let i = 0; i < 30; i++) {
        const problem = generateProblem('L02', {}, {});
        if (problem.context.qid === 'L02-notes-observational') {
          expect(problem.context.correctDecision).toBe('no');
          return;
        }
      }
    });
  });
});
