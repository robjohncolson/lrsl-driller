import { describe, it, expect } from 'vitest';
import { gradeField } from '../../cartridges/a2-dividing-polynomials/grading-rules.js';

describe('a2-dividing-polynomials grading', () => {

  // ===== Numeric fields =====
  describe('numeric fields (remainder, coefficients, pa-value)', () => {
    const numericFields = ['remainder', 'coeff-x2', 'coeff-x1', 'coeff-x0', 'division-remainder', 'pa-value'];

    numericFields.forEach(fieldId => {
      describe(fieldId, () => {
        const ctx = { answers: { [fieldId]: { value: 42 } } };

        it('E for exact match', () => {
          expect(gradeField(fieldId, '42', ctx).score).toBe('E');
        });

        it('E for match with spaces', () => {
          expect(gradeField(fieldId, ' 42 ', ctx).score).toBe('E');
        });

        it('I for wrong answer', () => {
          expect(gradeField(fieldId, '99', ctx).score).toBe('I');
        });

        it('I for blank', () => {
          expect(gradeField(fieldId, '', ctx).score).toBe('I');
        });

        it('I for non-numeric', () => {
          expect(gradeField(fieldId, 'abc', ctx).score).toBe('I');
        });
      });
    });

    it('P for sign error', () => {
      const ctx = { answers: { remainder: { value: -7 } } };
      expect(gradeField('remainder', '7', ctx).score).toBe('P');
    });

    it('E for zero answer', () => {
      const ctx = { answers: { remainder: { value: 0 } } };
      expect(gradeField('remainder', '0', ctx).score).toBe('E');
    });

    it('E for negative answer', () => {
      const ctx = { answers: { 'pa-value': { value: -23 } } };
      expect(gradeField('pa-value', '-23', ctx).score).toBe('E');
    });
  });

  // ===== Verify dropdown (Mode 3) =====
  describe('verify field', () => {
    const ctx = { answers: { verify: { value: "Yes" } } };

    it('E for Yes', () => {
      expect(gradeField('verify', 'Yes', ctx).score).toBe('E');
    });

    it('I for No', () => {
      expect(gradeField('verify', 'No', ctx).score).toBe('I');
    });

    it('I for blank', () => {
      expect(gradeField('verify', '', ctx).score).toBe('I');
    });
  });

  // ===== Is-factor dropdown (Mode 6) =====
  describe('is-factor field', () => {
    it('E for correct Yes', () => {
      const ctx = {
        a: -2,
        answers: {
          'is-factor': { value: "Yes \u2014 remainder is 0" },
          'pa-value': { value: 0 }
        }
      };
      expect(gradeField('is-factor', "Yes \u2014 remainder is 0", ctx).score).toBe('E');
    });

    it('E for correct No', () => {
      const ctx = {
        a: 3,
        answers: {
          'is-factor': { value: "No \u2014 remainder is not 0" },
          'pa-value': { value: 8 }
        }
      };
      expect(gradeField('is-factor', "No \u2014 remainder is not 0", ctx).score).toBe('E');
    });

    it('I for wrong choice', () => {
      const ctx = {
        a: 3,
        answers: {
          'is-factor': { value: "No \u2014 remainder is not 0" },
          'pa-value': { value: 8 }
        }
      };
      expect(gradeField('is-factor', "Yes \u2014 remainder is 0", ctx).score).toBe('I');
    });
  });

  // ===== Factor text fields (Mode 4) =====
  describe('factor fields', () => {
    const ctx = {
      root2: 3,
      root3: -1,
      answers: {
        factor2: { value: "(x \u2212 3)" },
        factor3: { value: "(x + 1)" }
      }
    };

    it('E for correct factor (x-3)', () => {
      expect(gradeField('factor2', '(x-3)', ctx).score).toBe('E');
    });

    it('E for correct factor without parens', () => {
      expect(gradeField('factor2', 'x-3', ctx).score).toBe('E');
    });

    it('E for correct factor with spaces', () => {
      expect(gradeField('factor2', '( x - 3 )', ctx).score).toBe('E');
    });

    it('E for correct factor (x+1)', () => {
      expect(gradeField('factor3', '(x+1)', ctx).score).toBe('E');
    });

    it('E for factor in other slot (order-independent)', () => {
      // Student puts (x+1) in factor2 slot — still matches root3=-1
      expect(gradeField('factor2', '(x+1)', ctx).score).toBe('E');
    });

    it('P for sign error', () => {
      // Root is 3, factor should be (x-3), student writes (x+3) which has root -3
      expect(gradeField('factor2', '(x+3)', ctx).score).toBe('P');
    });

    it('I for wrong factor', () => {
      expect(gradeField('factor2', '(x-7)', ctx).score).toBe('I');
    });

    it('I for unparseable input', () => {
      expect(gradeField('factor2', 'hello', ctx).score).toBe('I');
    });

    it('I for blank', () => {
      expect(gradeField('factor2', '', ctx).score).toBe('I');
    });
  });

  // ===== Quotient polynomial (Mode 5) =====
  describe('quotient-poly field', () => {
    const ctx = {
      quotientCoeffs: [2, 3, -1],
      answers: {
        'quotient-poly': { value: '2x\u00b2 + 3x \u2212 1' }
      }
    };

    it('E for exact match with Unicode', () => {
      expect(gradeField('quotient-poly', '2x\u00b2 + 3x \u2212 1', ctx).score).toBe('E');
    });

    it('E for match with caret notation', () => {
      expect(gradeField('quotient-poly', '2x^2+3x-1', ctx).score).toBe('E');
    });

    it('E for match with spaces', () => {
      expect(gradeField('quotient-poly', '2x^2 + 3x - 1', ctx).score).toBe('E');
    });

    it('I for wrong quotient', () => {
      expect(gradeField('quotient-poly', 'x^2+x+1', ctx).score).toBe('I');
    });

    it('I for blank', () => {
      expect(gradeField('quotient-poly', '', ctx).score).toBe('I');
    });
  });

  // ===== Remainder fraction (Mode 5) =====
  describe('remainder-fraction field', () => {
    const ctx = {
      expectedRemainder: 5,
      a: 2,
      answers: {
        'remainder-fraction': { value: '5/(x \u2212 2)' }
      }
    };

    it('E for exact match with Unicode', () => {
      expect(gradeField('remainder-fraction', '5/(x \u2212 2)', ctx).score).toBe('E');
    });

    it('E for match with regular minus', () => {
      expect(gradeField('remainder-fraction', '5/(x-2)', ctx).score).toBe('E');
    });

    it('E for match with spaces', () => {
      expect(gradeField('remainder-fraction', '5 / (x - 2)', ctx).score).toBe('E');
    });

    it('I for wrong fraction', () => {
      expect(gradeField('remainder-fraction', '3/(x-2)', ctx).score).toBe('I');
    });

    it('handles negative remainder', () => {
      const negCtx = {
        expectedRemainder: -3,
        a: -1,
        answers: {
          'remainder-fraction': { value: '-3/(x + 1)' }
        }
      };
      expect(gradeField('remainder-fraction', '-3/(x+1)', negCtx).score).toBe('E');
    });
  });
});
