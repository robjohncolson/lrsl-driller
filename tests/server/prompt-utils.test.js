/**
 * Prompt Utils Unit Tests
 *
 * Tests for buildCartridgePrompt to prevent regressions in AI grading prompt construction.
 *
 * Bug fixed in v1.6.3: Templates using {{STUDENT_ANSWER}} (SCREAMING_SNAKE_CASE) were not
 * getting the student answer replaced, causing AI to respond "student answer is missing".
 *
 * Run with: npx vitest run tests/server/prompt-utils.test.js
 */
import { describe, it, expect } from 'vitest';

// Import the module under test
const { buildCartridgePrompt } = require('../../railway-server/prompt-utils.js');

describe('buildCartridgePrompt', () => {
  // ==================== STUDENT ANSWER PLACEHOLDERS ====================
  describe('Student Answer Placeholders (v1.6.3 regression)', () => {
    it('replaces {{STUDENT_ANSWER}} with scenario.studentAnswer', () => {
      const template = 'Student Answer:\n{{STUDENT_ANSWER}}';
      const scenario = { studentAnswer: 'random assignment' };
      const answers = { term: 'random assignment' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Student Answer:\nrandom assignment');
      expect(result).not.toContain('{{STUDENT_ANSWER}}');
    });

    it('replaces {{studentAnswer}} with scenario.studentAnswer', () => {
      const template = 'Response: {{studentAnswer}}';
      const scenario = { studentAnswer: 'stratified sampling' };
      const answers = { method: 'stratified sampling' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Response: stratified sampling');
      expect(result).not.toContain('{{studentAnswer}}');
    });

    it('handles both {{STUDENT_ANSWER}} and {{studentAnswer}} in same template', () => {
      const template = 'Primary: {{STUDENT_ANSWER}}\nSecondary: {{studentAnswer}}';
      const scenario = { studentAnswer: 'confounding variable' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Primary: confounding variable\nSecondary: confounding variable');
    });

    it('leaves {{STUDENT_ANSWER}} unreplaced when scenario.studentAnswer is missing', () => {
      const template = 'Answer: {{STUDENT_ANSWER}}';
      const scenario = {}; // No studentAnswer
      const answers = { term: 'some answer' };

      const result = buildCartridgePrompt(template, scenario, answers);

      // Should be cleaned up by the final cleanup step
      expect(result).toBe('Answer:');
    });

    it('handles empty string studentAnswer', () => {
      const template = 'Answer: {{STUDENT_ANSWER}}';
      const scenario = { studentAnswer: '' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      // Empty string is falsy, so replacement won't happen, cleanup removes placeholder
      expect(result).toBe('Answer:');
    });
  });

  // ==================== FIELD-SPECIFIC ANSWER PLACEHOLDERS ====================
  describe('Field-Specific Answer Placeholders', () => {
    it('replaces {{fieldIdAnswer}} with the corresponding answer value', () => {
      const template = 'Term answer: {{termAnswer}}';
      const scenario = {};
      const answers = { term: 'random assignment' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Term answer: random assignment');
    });

    it('replaces multiple field-specific placeholders', () => {
      const template = 'Predicted: {{predictedAnswer}}, Residual: {{residualAnswer}}';
      const scenario = {};
      const answers = { predicted: '45.2', residual: '-3.1' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Predicted: 45.2, Residual: -3.1');
    });

    it('handles missing answer values gracefully', () => {
      const template = 'Answer: {{termAnswer}}';
      const scenario = {};
      const answers = { term: null };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Answer:');
    });
  });

  // ==================== STUDENT RESPONSE (ALL ANSWERS) ====================
  describe('Student Response Placeholder', () => {
    it('replaces {{studentResponse}} with formatted answers', () => {
      const template = 'Responses:\n{{studentResponse}}';
      const scenario = {};
      const answers = { term: 'random', explanation: 'reduces bias' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toContain('term: random');
      expect(result).toContain('explanation: reduces bias');
    });

    it('handles single answer', () => {
      const template = '{{studentResponse}}';
      const scenario = {};
      const answers = { answer: 'stratified' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('answer: stratified');
    });

    it('handles empty answers object', () => {
      const template = 'Answers: {{studentResponse}}';
      const scenario = {};
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Answers:');
    });
  });

  // ==================== SCENARIO VARIABLES ====================
  describe('Scenario Variable Placeholders', () => {
    it('replaces {{topic}} with scenario.topic', () => {
      const template = 'Topic: {{topic}}';
      const scenario = { topic: 'Experimental Design' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Topic: Experimental Design');
    });

    it('replaces {{problemText}} with scenario.problemText', () => {
      const template = 'Question:\n{{problemText}}';
      const scenario = { problemText: 'Explain random assignment.' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Question:\nExplain random assignment.');
    });

    it('replaces {{expectedAnswer}} with scenario.gradingPairs', () => {
      const template = 'Expected: {{expectedAnswer}}';
      const scenario = { gradingPairs: 'term: expected=assignment, student=assignment' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Expected: term: expected=assignment, student=assignment');
    });

    it('uses default when gradingPairs is missing', () => {
      const template = '{{expectedAnswer}}';
      const scenario = {};
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('See grading pairs in context');
    });

    it('replaces multiple scenario variables', () => {
      const template = '{{topic}} - {{mode}} - {{fieldId}}';
      const scenario = { topic: 'Sampling', mode: 'identify', fieldId: 'method' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Sampling - identify - method');
    });
  });

  // ==================== PROBLEM CONTEXT ====================
  describe('Problem Context Placeholder', () => {
    it('builds problemContext from scenario fields', () => {
      const template = '{{problemContext}}';
      const scenario = {
        topic: 'LSRL',
        mode: 'interpret',
        r: 0.85,
        slope: 2.3,
        intercept: 10.5
      };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toContain('Topic: LSRL');
      expect(result).toContain('Mode: interpret');
      expect(result).toContain('r = 0.85');
      expect(result).toContain('Slope = 2.3');
      expect(result).toContain('Intercept = 10.5');
    });

    it('omits missing fields from problemContext', () => {
      const template = '{{problemContext}}';
      const scenario = { topic: 'Sampling' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Topic: Sampling');
      expect(result).not.toContain('Mode');
      expect(result).not.toContain('Slope');
    });
  });

  // ==================== CLEANUP ====================
  describe('Cleanup of Unreplaced Placeholders', () => {
    it('removes unreplaced placeholders', () => {
      const template = 'Known: {{topic}}, Unknown: {{unknownVar}}';
      const scenario = { topic: 'Test' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Known: Test, Unknown:');
      expect(result).not.toContain('{{');
      expect(result).not.toContain('}}');
    });

    it('trims whitespace from result', () => {
      const template = '  \n  Content  \n  ';
      const scenario = {};
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Content');
    });
  });

  // ==================== REAL TEMPLATE SIMULATION ====================
  describe('Real Template Simulation', () => {
    it('handles apstats-u3-l6-7-design-inference template pattern', () => {
      // Simulates the actual template that was failing
      const template = `You are an AP Statistics teacher.

Question:
{{problemText}}

Reference:
{{correctAnswer}}

Key ideas:
{{keyIdeas}}

Student Answer:
{{STUDENT_ANSWER}}

Grade using E/P/I.`;

      const scenario = {
        problemText: 'Explain why random assignment allows causal conclusions.',
        correctAnswer: 'Random assignment balances confounding variables.',
        keyIdeas: 'random assignment, confounding, causation',
        studentAnswer: 'Random assignment makes groups similar so differences are due to treatment.'
      };
      const answers = { term: 'assignment' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toContain('Explain why random assignment allows causal conclusions.');
      expect(result).toContain('Random assignment balances confounding variables.');
      expect(result).toContain('random assignment, confounding, causation');
      expect(result).toContain('Random assignment makes groups similar so differences are due to treatment.');
      expect(result).not.toContain('{{STUDENT_ANSWER}}');
    });

    it('handles sampling template pattern with camelCase', () => {
      const template = `Response: {{studentAnswer}}
Expected: {{expectedAnswer}}`;

      const scenario = {
        studentAnswer: 'stratified random sampling',
        gradingPairs: 'method: expected=stratified, student=stratified random sampling'
      };
      const answers = { method: 'stratified random sampling' };

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toContain('Response: stratified random sampling');
      expect(result).toContain('method: expected=stratified');
    });
  });

  // ==================== CONDITIONAL SECTIONS ====================
  describe('Conditional Sections', () => {
    it('keeps content when mode condition is met', () => {
      const template = '{{#if calculateMode}}Calculate the value.{{/if}}';
      const scenario = { mode: 'calculate' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Calculate the value.');
    });

    it('removes content when mode condition is not met', () => {
      const template = 'Intro {{#if calculateMode}}Calculate section{{/if}} End';
      const scenario = { mode: 'interpret' };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('Intro  End');
    });

    it('handles residualPositive conditional', () => {
      const template = '{{#if residualPositive}}above{{else}}below{{/if}} the line';
      const scenario = { residual: 5.2 };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('above the line');
    });

    it('handles negative residual conditional', () => {
      const template = '{{#if residualPositive}}above{{else}}below{{/if}} the line';
      const scenario = { residual: -3.1 };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('below the line');
    });

    it('replaces {{moreOrLess}} based on residual', () => {
      const template = 'The actual is {{moreOrLess}} than predicted.';
      const scenario = { residual: 2.5 };
      const answers = {};

      const result = buildCartridgePrompt(template, scenario, answers);

      expect(result).toBe('The actual is more than predicted.');
    });
  });
});
