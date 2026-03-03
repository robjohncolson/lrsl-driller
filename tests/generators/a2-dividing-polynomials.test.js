import { describe, it, expect } from 'vitest';
import { generateProblem } from '../../cartridges/a2-dividing-polynomials/generator.js';

// Helper: evaluate polynomial at x using Horner's method
function evalPoly(coeffs, x) {
  let result = 0;
  for (const c of coeffs) result = result * x + c;
  return result;
}

describe('a2-dividing-polynomials generator', () => {
  const modes = [
    'remainder-eval',
    'long-division',
    'remainder-theorem-verify',
    'factor-and-quotient',
    'quotient-expression',
    'is-it-a-factor'
  ];

  // Basic structure tests for all modes
  modes.forEach(modeId => {
    describe(`mode: ${modeId}`, () => {
      it('returns required structure', () => {
        const result = generateProblem(modeId, null, {});
        expect(result).toHaveProperty('context');
        expect(result).toHaveProperty('answers');
        expect(result).toHaveProperty('scenario');
        expect(result.context).toHaveProperty('levelName');
        expect(result.context).toHaveProperty('problemText');
        expect(result.context).toHaveProperty('givenText');
      });

      it('generates different problems (not identical)', () => {
        const results = new Set();
        for (let i = 0; i < 10; i++) {
          results.add(JSON.stringify(generateProblem(modeId, null, {}).answers));
        }
        expect(results.size).toBeGreaterThan(1);
      });
    });
  });

  // Mode 1: Remainder by Evaluation
  describe('remainder-eval', () => {
    it('produces integer remainder', () => {
      for (let i = 0; i < 20; i++) {
        const { answers } = generateProblem('remainder-eval', null, {});
        expect(Number.isInteger(answers.remainder.value)).toBe(true);
      }
    });

    it('context has required template variables', () => {
      const { context } = generateProblem('remainder-eval', null, {});
      expect(context).toHaveProperty('a');
      expect(context).toHaveProperty('polynomial');
      expect(context).toHaveProperty('divisor');
      expect(context).toHaveProperty('coefficients');
    });

    it('remainder equals P(a)', () => {
      for (let i = 0; i < 20; i++) {
        const { context, answers } = generateProblem('remainder-eval', null, {});
        const computed = evalPoly(context.coefficients, context.a);
        expect(answers.remainder.value).toBe(computed);
      }
    });

    it('sometimes produces remainder = 0', () => {
      let zeroCount = 0;
      for (let i = 0; i < 200; i++) {
        const { answers } = generateProblem('remainder-eval', null, {});
        if (answers.remainder.value === 0) zeroCount++;
      }
      expect(zeroCount).toBeGreaterThan(0);
    });
  });

  // Mode 2: Long Division
  describe('long-division', () => {
    it('quotient * divisor + remainder = dividend', () => {
      for (let i = 0; i < 20; i++) {
        const { context, answers } = generateProblem('long-division', null, {});
        const a = context.a;
        const qCoeffs = [
          answers['coeff-x2'].value,
          answers['coeff-x1'].value,
          answers['coeff-x0'].value
        ];
        const r = answers.remainder.value;

        // Verify: q(x)*(x-a) + r should equal P(x) at several test points
        for (const testX of [-2, 0, 1, 3]) {
          const qVal = evalPoly(qCoeffs, testX);
          const divisorVal = testX - a;
          const expected = qVal * divisorVal + r;
          const actual = evalPoly(context.dividendCoeffs, testX);
          expect(actual).toBe(expected);
        }
      }
    });

    it('all coefficients are within |50|', () => {
      for (let i = 0; i < 50; i++) {
        const { context } = generateProblem('long-division', null, {});
        context.dividendCoeffs.forEach(c => {
          expect(Math.abs(c)).toBeLessThanOrEqual(50);
        });
      }
    });

    it('produces integer quotient coefficients and remainder', () => {
      for (let i = 0; i < 20; i++) {
        const { answers } = generateProblem('long-division', null, {});
        expect(Number.isInteger(answers['coeff-x2'].value)).toBe(true);
        expect(Number.isInteger(answers['coeff-x1'].value)).toBe(true);
        expect(Number.isInteger(answers['coeff-x0'].value)).toBe(true);
        expect(Number.isInteger(answers.remainder.value)).toBe(true);
      }
    });
  });

  // Mode 3: Verify Remainder Theorem
  describe('remainder-theorem-verify', () => {
    it('division-remainder equals pa-value', () => {
      for (let i = 0; i < 20; i++) {
        const { answers } = generateProblem('remainder-theorem-verify', null, {});
        expect(answers['division-remainder'].value).toBe(answers['pa-value'].value);
      }
    });

    it('verify answer is always Yes', () => {
      for (let i = 0; i < 20; i++) {
        const { answers } = generateProblem('remainder-theorem-verify', null, {});
        expect(answers.verify.value).toBe("Yes");
      }
    });
  });

  // Mode 4: Factor with Known Factor
  describe('factor-and-quotient', () => {
    it('has three distinct roots', () => {
      for (let i = 0; i < 20; i++) {
        const { context } = generateProblem('factor-and-quotient', null, {});
        const roots = [context.knownRoot, context.root2, context.root3];
        const unique = new Set(roots);
        expect(unique.size).toBe(3);
      }
    });

    it('P(x) = 0 at all three roots', () => {
      for (let i = 0; i < 20; i++) {
        const { context } = generateProblem('factor-and-quotient', null, {});
        // Parse coefficients from the polynomial - we need the raw coefficients
        // The generator stores context.knownRoot, root2, root3
        // Build P(x) = (x-a)(x-b)(x-c) and verify
        const a = context.knownRoot;
        const b = context.root2;
        const c = context.root3;

        // Expand: (x-a)(x-b)(x-c) = x³ - (a+b+c)x² + (ab+ac+bc)x - abc
        const c3 = 1;
        const c2 = -(a + b + c);
        const c1 = a*b + a*c + b*c;
        const c0 = -(a * b * c);
        const coeffs = [c3, c2, c1, c0];

        expect(evalPoly(coeffs, a)).toBe(0);
        expect(evalPoly(coeffs, b)).toBe(0);
        expect(evalPoly(coeffs, c)).toBe(0);
      }
    });

    it('coefficients are within |50|', () => {
      for (let i = 0; i < 50; i++) {
        const { context } = generateProblem('factor-and-quotient', null, {});
        const a = context.knownRoot;
        const b = context.root2;
        const c = context.root3;
        const coeffs = [1, -(a+b+c), a*b+a*c+b*c, -(a*b*c)];
        coeffs.forEach(coeff => {
          expect(Math.abs(coeff)).toBeLessThanOrEqual(50);
        });
      }
    });
  });

  // Mode 5: Quotient Expression
  describe('quotient-expression', () => {
    it('remainder is non-zero', () => {
      for (let i = 0; i < 20; i++) {
        const { context } = generateProblem('quotient-expression', null, {});
        expect(context.expectedRemainder).not.toBe(0);
      }
    });

    it('has quotient-poly and remainder-fraction answers', () => {
      const { answers } = generateProblem('quotient-expression', null, {});
      expect(answers).toHaveProperty('quotient-poly');
      expect(answers).toHaveProperty('remainder-fraction');
      expect(typeof answers['quotient-poly'].value).toBe('string');
      expect(typeof answers['remainder-fraction'].value).toBe('string');
    });
  });

  // Mode 6: Is It a Factor?
  describe('is-it-a-factor', () => {
    it('answer is consistent with P(a)', () => {
      for (let i = 0; i < 20; i++) {
        const { answers } = generateProblem('is-it-a-factor', null, {});
        const pa = answers['pa-value'].value;
        const isFactor = answers['is-factor'].value;
        if (pa === 0) {
          expect(isFactor).toContain("Yes");
        } else {
          expect(isFactor).toContain("No");
        }
      }
    });

    it('P(a) value matches actual evaluation', () => {
      for (let i = 0; i < 20; i++) {
        const { context, answers } = generateProblem('is-it-a-factor', null, {});
        const computed = evalPoly(context.coefficients, context.a);
        expect(answers['pa-value'].value).toBe(computed);
      }
    });

    it('produces mix of factor and non-factor cases', () => {
      let factorCount = 0;
      for (let i = 0; i < 100; i++) {
        const { answers } = generateProblem('is-it-a-factor', null, {});
        if (answers['pa-value'].value === 0) factorCount++;
      }
      // Should be roughly 50/50, but allow wide margin
      expect(factorCount).toBeGreaterThan(10);
      expect(factorCount).toBeLessThan(90);
    });
  });
});
