/**
 * Sampling Cartridge Grading Tests
 * Tests exact match, keyword matching, and open response grading
 */
import { describe, it, expect } from 'vitest';
import { gradeField } from '../../cartridges/sampling/grading-rules.js';

describe('Sampling Grading Rules', () => {
  // ========== EXACT MATCH TESTS ==========
  describe('Exact Match Fields', () => {
    describe('chanceTrust (L01 - Why Does Chance Matter)', () => {
      it('grades correct "Yes" answer as E', () => {
        const result = gradeField('chanceTrust', 'Yes', { chanceTrust: 'Yes' });
        expect(result.score).toBe('E');
      });

      it('grades correct "No" answer as E', () => {
        const result = gradeField('chanceTrust', 'No', { chanceTrust: 'No' });
        expect(result.score).toBe('E');
      });

      it('is case insensitive', () => {
        const result = gradeField('chanceTrust', 'yes', { chanceTrust: 'Yes' });
        expect(result.score).toBe('E');
      });

      it('trims whitespace', () => {
        const result = gradeField('chanceTrust', '  Yes  ', { chanceTrust: 'Yes' });
        expect(result.score).toBe('E');
      });

      it('grades incorrect answer as I with feedback', () => {
        const result = gradeField('chanceTrust', 'No', { chanceTrust: 'Yes' });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('chance');
      });
    });

    describe('popOrSample (L02 - Population vs Sample)', () => {
      it('grades correct "Population" as E', () => {
        const result = gradeField('popOrSample', 'Population', { popOrSample: 'Population' });
        expect(result.score).toBe('E');
      });

      it('grades correct "Sample" as E', () => {
        const result = gradeField('popOrSample', 'Sample', { popOrSample: 'Sample' });
        expect(result.score).toBe('E');
      });

      it('provides feedback for incorrect answer', () => {
        const result = gradeField('popOrSample', 'Sample', { popOrSample: 'Population' });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('POPULATION');
      });
    });

    describe('studyType (L03 - Observational vs Experiment)', () => {
      it('accepts "Observational study" for observational', () => {
        const result = gradeField('studyType', 'Observational study', { studyType: 'Observational study' });
        expect(result.score).toBe('E');
      });

      it('accepts partial match "observational"', () => {
        const result = gradeField('studyType', 'observational', { studyType: 'Observational study' });
        expect(result.score).toBe('E');
      });

      it('accepts "Experiment" for experiment', () => {
        const result = gradeField('studyType', 'Experiment', { studyType: 'Experiment' });
        expect(result.score).toBe('E');
      });
    });
  });

  // ========== KEYWORD MATCHING TESTS ==========
  describe('Keyword Matching Fields', () => {
    describe('advantage (L13 - Why This Method)', () => {
      it('accepts "low variability, low bias" for stratified (recent fix)', () => {
        const result = gradeField('advantage', 'low variability, low bias', {});
        expect(result.score).toBe('E');
      });

      it('accepts "reduces variability" for stratified', () => {
        const result = gradeField('advantage', 'reduces variability', {});
        expect(result.score).toBe('E');
      });

      it('accepts "more precise" for stratified', () => {
        const result = gradeField('advantage', 'more precise results', {});
        expect(result.score).toBe('E');
      });

      it('accepts "ensures representation" for stratified', () => {
        const result = gradeField('advantage', 'ensures every group is represented', {});
        expect(result.score).toBe('E');
      });

      it('accepts "cheaper" for cluster', () => {
        const result = gradeField('advantage', 'cheaper and more practical', {});
        expect(result.score).toBe('E');
      });

      it('accepts "simple" for SRS', () => {
        const result = gradeField('advantage', 'simple and unbiased', {});
        expect(result.score).toBe('E');
      });

      it('gives partial credit for vague answers', () => {
        const result = gradeField('advantage', 'it works better', {});
        expect(result.score).toBe('P');
      });

      it('rejects completely wrong answers', () => {
        const result = gradeField('advantage', 'I dont know', {});
        expect(result.score).toBe('I');
      });
    });

    describe('whyGeneralize (L04 - Open Response)', () => {
      it('accepts answer mentioning random selection', () => {
        const result = gradeField('whyGeneralize',
          'Random selection ensures the sample represents the population', {});
        expect(result.score).toBe('E');
      });

      it('gives partial credit for mentioning representative', () => {
        const result = gradeField('whyGeneralize',
          'The sample is representative', {});
        expect(result.score).toBe('P');
      });

      it('rejects wrong concept (random assignment)', () => {
        const result = gradeField('whyGeneralize',
          'Random assignment controls confounding', {});
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('confusing');
      });
    });
  });

  // ========== STRATIFIED VS CLUSTER TESTS ==========
  describe('Stratified vs Cluster Distinction (L10)', () => {
    describe('stratFeature', () => {
      it('grades correct stratified feature as E', () => {
        const result = gradeField('stratFeature', 'Uses ALL groups',
          { stratFeature: 'Uses ALL groups' });
        expect(result.score).toBe('E');
      });
    });

    describe('clusterFeature', () => {
      it('grades correct cluster feature as E', () => {
        const result = gradeField('clusterFeature', 'Uses SOME groups',
          { clusterFeature: 'Uses SOME groups' });
        expect(result.score).toBe('E');
      });
    });
  });

  // ========== METHOD IDENTIFICATION TESTS ==========
  describe('Method Identification (L11-L13)', () => {
    it('accepts "SRS" for simple random sample', () => {
      const result = gradeField('methodType', 'SRS', { methodType: 'SRS' });
      expect(result.score).toBe('E');
    });

    it('accepts "Simple random sample" for SRS', () => {
      const result = gradeField('methodType', 'Simple random sample',
        { methodType: 'SRS' });
      expect(result.score).toBe('E');
    });

    it('accepts "Stratified" answer', () => {
      const result = gradeField('methodType', 'Stratified',
        { methodType: 'Stratified' });
      expect(result.score).toBe('E');
    });

    it('accepts "Cluster" answer', () => {
      const result = gradeField('methodType', 'Cluster',
        { methodType: 'Cluster' });
      expect(result.score).toBe('E');
    });

    it('gives partial credit for stratified/cluster confusion', () => {
      const result = gradeField('methodType', 'Cluster',
        { methodType: 'Stratified' });
      expect(result.score).toBe('P');
      expect(result.feedback).toContain('STRATIFIED');
    });
  });

  // ========== BLANK ANSWER HANDLING ==========
  describe('Blank Answer Handling', () => {
    it('rejects empty string for choice field', () => {
      const result = gradeField('chanceTrust', '', { chanceTrust: 'Yes' });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects whitespace-only for choice field', () => {
      const result = gradeField('chanceTrust', '   ', { chanceTrust: 'Yes' });
      expect(result.score).toBe('I');
    });

    it('rejects empty string for open response field', () => {
      const result = gradeField('advantage', '', {});
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('explanation');
    });

    it('rejects null answer', () => {
      const result = gradeField('chanceTrust', null, { chanceTrust: 'Yes' });
      expect(result.score).toBe('I');
    });
  });

  // ========== CONTEXT OBJECT HANDLING ==========
  describe('Context Object Handling', () => {
    it('handles object-valued context { value: "Yes" }', () => {
      const result = gradeField('chanceTrust', 'Yes', {
        chanceTrust: { value: 'Yes' }
      });
      expect(result.score).toBe('E');
    });

    it('handles answers property in context', () => {
      const result = gradeField('chanceTrust', 'Yes', {
        answers: { chanceTrust: { value: 'Yes' } }
      });
      expect(result.score).toBe('E');
    });
  });
});
