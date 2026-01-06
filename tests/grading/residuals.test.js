/**
 * Residuals Cartridge Grading Tests
 * Tests numeric tolerance, exact match, and regex grading
 */
import { describe, it, expect } from 'vitest';
import { gradeField, gradeNumeric, gradeExact, gradeRegex, getRule } from '../../cartridges/residuals/grading-rules.js';

describe('Residuals Grading Rules', () => {
  // ========== NUMERIC TOLERANCE TESTS ==========
  describe('Numeric Grading (gradeNumeric)', () => {
    const predictedRule = getRule('predicted');
    const residualRule = getRule('residual');

    describe('Exact matches', () => {
      it('grades exact match as E', () => {
        const result = gradeNumeric('45.32', predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('E');
      });

      it('handles integer input', () => {
        const result = gradeNumeric('45', predictedRule, { predictedY: 45.00 });
        expect(result.score).toBe('E');
      });

      it('handles number type input', () => {
        const result = gradeNumeric(45.32, predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('E');
      });
    });

    describe('Tolerance handling', () => {
      it('accepts value within 0.1 absolute tolerance', () => {
        const result = gradeNumeric('45.35', predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('E');
      });

      it('accepts value within relative tolerance for larger numbers', () => {
        // 100 * 0.15 = 15, so 100 ± 15 should be E
        const result = gradeNumeric('110', predictedRule, { predictedY: 100 });
        expect(result.score).toBe('E');
      });

      it('gives P for values within 2.5x tolerance', () => {
        // tolerance = max(45.32 * 0.15, 0.1) = ~6.8
        // 2.5x = ~17, so 45.32 + 10 = 55.32 should be P
        const result = gradeNumeric('55', predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('P');
      });

      it('gives I for values outside 2.5x tolerance', () => {
        const result = gradeNumeric('100', predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('I');
      });
    });

    describe('Floating point precision (regression)', () => {
      it('handles 45.319999999 vs 45.32', () => {
        const result = gradeNumeric('45.32', predictedRule, { predictedY: 45.319999999 });
        expect(result.score).toBe('E');
      });

      it('handles 2.149999 vs 2.15', () => {
        const result = gradeNumeric('2.15', residualRule, { residual: 2.149999 });
        expect(result.score).toBe('E');
      });

      it('handles very small differences', () => {
        const result = gradeNumeric('0.01', residualRule, { residual: 0.0100001 });
        expect(result.score).toBe('E');
      });
    });

    describe('Zero and small number edge cases', () => {
      it('handles zero expected value', () => {
        const result = gradeNumeric('0', residualRule, { residual: 0 });
        expect(result.score).toBe('E');
      });

      it('handles zero user input', () => {
        const result = gradeNumeric('0', residualRule, { residual: 0.05 });
        expect(result.score).toBe('E'); // within 0.1 tolerance
      });

      it('applies minimum tolerance of 0.1 for small numbers', () => {
        // Even for small expected values, tolerance is at least 0.1
        const result = gradeNumeric('0.15', residualRule, { residual: 0.05 });
        expect(result.score).toBe('E');
      });
    });

    describe('Negative numbers', () => {
      it('handles negative residuals', () => {
        const result = gradeNumeric('-2.15', residualRule, { residual: -2.15 });
        expect(result.score).toBe('E');
      });

      it('handles sign mismatch (wrong)', () => {
        const result = gradeNumeric('2.15', residualRule, { residual: -2.15 });
        expect(result.score).toBe('I');
      });
    });

    describe('Object-valued context', () => {
      it('handles { value: number } context', () => {
        const result = gradeNumeric('45.32', predictedRule, {
          predictedY: { value: 45.32 }
        });
        expect(result.score).toBe('E');
      });
    });

    describe('Invalid input handling', () => {
      it('rejects non-numeric string', () => {
        const result = gradeNumeric('abc', predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('I');
        expect(result.feedback).toContain('numeric');
      });

      it('rejects empty string', () => {
        const result = gradeNumeric('', predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('I');
      });

      it('handles string with whitespace', () => {
        const result = gradeNumeric('  45.32  ', predictedRule, { predictedY: 45.32 });
        expect(result.score).toBe('E');
      });
    });
  });

  // ========== EXACT MATCH TESTS ==========
  describe('Exact Match Grading (gradeExact)', () => {
    const overUnderRule = getRule('overUnder');

    it('grades correct "Overprediction" as E', () => {
      const result = gradeExact('Overprediction', overUnderRule, {
        overUnder: 'Overprediction'
      });
      expect(result.score).toBe('E');
    });

    it('grades correct "Underprediction" as E', () => {
      const result = gradeExact('Underprediction', overUnderRule, {
        overUnder: 'Underprediction'
      });
      expect(result.score).toBe('E');
    });

    it('grades incorrect answer as I with feedback', () => {
      const result = gradeExact('Overprediction', overUnderRule, {
        overUnder: 'Underprediction'
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('residual');
    });

    it('handles object-valued expected', () => {
      const result = gradeExact('Overprediction', overUnderRule, {
        overUnder: { value: 'Overprediction' }
      });
      expect(result.score).toBe('E');
    });
  });

  // ========== REGEX GRADING TESTS ==========
  describe('Regex Grading (gradeRegex)', () => {
    const interpretationRule = getRule('interpretation');

    describe('Complete interpretations', () => {
      it('gives E for complete interpretation', () => {
        const result = gradeRegex(
          'The actual temperature was 2.5 degrees higher than predicted',
          interpretationRule,
          { yVar: 'temperature', yUnits: 'degrees', residualAbs: 2.5 }
        );
        expect(result.score).toBe('E');
      });
    });

    describe('Partial interpretations', () => {
      it('gives P for partial interpretation (missing units)', () => {
        const result = gradeRegex(
          'The actual temperature was higher than predicted',
          interpretationRule,
          { yVar: 'temperature', yUnits: 'degrees', residualAbs: 2.5 }
        );
        // Missing residual value, but has actual, comparison, yVariable
        expect(['E', 'P']).toContain(result.score);
      });
    });

    describe('Context-based patterns', () => {
      it('matches y variable from context', () => {
        const result = gradeRegex(
          'The actual price was more than predicted',
          interpretationRule,
          { yVar: 'price', yUnits: 'dollars', residualAbs: 5 }
        );
        expect(result.matched).toContain('yVariable');
      });

      it('matches residual value from context', () => {
        const result = gradeRegex(
          'The actual temp was 3.2 higher than expected',
          interpretationRule,
          { yVar: 'temp', residualAbs: 3.2 }
        );
        expect(result.matched).toContain('residualValue');
      });
    });
  });

  // ========== INTEGRATED gradeField TESTS ==========
  describe('gradeField Integration', () => {
    it('routes numeric fields to gradeNumeric', () => {
      const result = gradeField('predicted', '45.32', { predictedY: 45.32 });
      expect(result.score).toBe('E');
      expect(result).toHaveProperty('userValue');
    });

    it('routes exact fields to gradeExact', () => {
      const result = gradeField('overUnder', 'Overprediction', {
        overUnder: 'Overprediction'
      });
      expect(result.score).toBe('E');
    });

    it('routes regex fields to gradeRegex', () => {
      const result = gradeField('interpretation',
        'The actual temperature was higher than predicted',
        { yVar: 'temperature', yUnits: 'F', residualAbs: 2 }
      );
      expect(result).toHaveProperty('matched');
    });

    it('returns I for unknown field', () => {
      const result = gradeField('unknownField', 'answer', {});
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('Unknown');
    });
  });
});
