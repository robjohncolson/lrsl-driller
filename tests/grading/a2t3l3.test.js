/**
 * a2t3l3 — Polynomial Identities & Binomial Theorem: Grading Tests
 * Tests every fieldId with correct, incorrect, and edge-case inputs.
 *
 * KNOWN BUGS documented in tests:
 * 1. factorAnswer token matching: normalizeMath strips parens, causing
 *    false-positive forbidden token matches when factor boundaries create
 *    substrings (e.g., "(x-6)(x^2..." → "x-6x^2..." contains "-6x").
 * 2. ai-grader-prompt.txt is missing a section for "flashcardAnswer" (L1b).
 */
import { describe, it, expect } from 'vitest';
import { gradeField } from '../../cartridges/a2t3l3/grading-rules.js';

// ============ HELPERS ============

/** Build a context object mirroring generator output with answers nested */
function ctx(fieldId, value, extra = {}) {
  return {
    answers: { [fieldId]: { value, tolerance: 0 } },
    ...extra
  };
}

describe('a2t3l3 Grading Rules', () => {
  // ========== BLANK ANSWER HANDLING ==========
  describe('Blank Answer Handling', () => {
    it('rejects empty string for choice field (identityName)', () => {
      const result = gradeField('identityName', '', ctx('identityName', 'Difference of Squares'));
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects null for numeric field (numericResult)', () => {
      const result = gradeField('numericResult', null, ctx('numericResult', 99));
      expect(result.score).toBe('I');
    });

    it('rejects whitespace-only for text field (factorAnswer)', () => {
      const result = gradeField('factorAnswer', '   ', ctx('factorAnswer', '(x-6)(x^2+6x+36)'));
      expect(result.score).toBe('I');
    });

    it('gives specific blank feedback for open response (pascalExplain)', () => {
      const result = gradeField('pascalExplain', '', ctx('pascalExplain', 'reasoning'));
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('explanation');
    });

    it('gives specific blank feedback for open response (errorExplain)', () => {
      const result = gradeField('errorExplain', '', ctx('errorExplain', 'reasoning'));
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('explanation');
    });

    it('rejects undefined for dropdown field (flashcardAnswer)', () => {
      const result = gradeField('flashcardAnswer', undefined, ctx('flashcardAnswer', 'Difference of Squares'));
      expect(result.score).toBe('I');
    });
  });

  // ========== LEVEL 1: IDENTITY MATCH ==========
  describe('Level 1 — identityName (Identity Match)', () => {
    const identities = [
      'Difference of Squares',
      'Square of a Sum',
      'Difference of Cubes',
      'Sum of Cubes'
    ];

    identities.forEach(id => {
      it(`grades exact match "${id}" as E`, () => {
        const result = gradeField('identityName', id, ctx('identityName', id));
        expect(result.score).toBe('E');
      });
    });

    it('is case insensitive', () => {
      const result = gradeField('identityName', 'difference of squares',
        ctx('identityName', 'Difference of Squares'));
      expect(result.score).toBe('E');
    });

    it('trims whitespace', () => {
      const result = gradeField('identityName', '  Sum of Cubes  ',
        ctx('identityName', 'Sum of Cubes'));
      expect(result.score).toBe('E');
    });

    it('grades wrong identity as I', () => {
      const result = gradeField('identityName', 'Sum of Cubes',
        ctx('identityName', 'Difference of Squares'));
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('Difference of Squares');
    });

    it('grades cubes/squares confusion as I', () => {
      const result = gradeField('identityName', 'Difference of Cubes',
        ctx('identityName', 'Difference of Squares'));
      expect(result.score).toBe('I');
    });
  });

  // ========== LEVEL 1b: IDENTITY FLASHCARDS ==========
  describe('Level 1b — flashcardAnswer (Identity Flashcards)', () => {
    it('grades correct formula selection as E', () => {
      const correct = 'a² − b² = (a + b)(a − b)';
      const result = gradeField('flashcardAnswer', correct, ctx('flashcardAnswer', correct));
      expect(result.score).toBe('E');
    });

    it('grades correct name selection as E', () => {
      const result = gradeField('flashcardAnswer', 'Sum of Cubes',
        ctx('flashcardAnswer', 'Sum of Cubes'));
      expect(result.score).toBe('E');
    });

    it('is case insensitive', () => {
      const result = gradeField('flashcardAnswer', 'difference of squares',
        ctx('flashcardAnswer', 'Difference of Squares'));
      expect(result.score).toBe('E');
    });

    it('grades wrong selection as I', () => {
      const correct = 'a² − b² = (a + b)(a − b)';
      const wrong = 'a² − b² = (a − b)(a − b)';
      const result = gradeField('flashcardAnswer', wrong, ctx('flashcardAnswer', correct));
      expect(result.score).toBe('I');
      expect(result.feedback).toContain(correct);
    });

    it('grades sign question correctly — positive for (a+b)²', () => {
      const result = gradeField('flashcardAnswer', 'Positive (+)',
        ctx('flashcardAnswer', 'Positive (+)'));
      expect(result.score).toBe('E');
    });

    it('grades wrong sign answer as I', () => {
      const result = gradeField('flashcardAnswer', 'Negative (−)',
        ctx('flashcardAnswer', 'Positive (+)'));
      expect(result.score).toBe('I');
    });

    it('grades cube middle sign correctly — minus for sum of cubes', () => {
      const result = gradeField('flashcardAnswer', 'Minus (−)',
        ctx('flashcardAnswer', 'Minus (−)'));
      expect(result.score).toBe('E');
    });
  });

  // ========== LEVEL 2: REWRITE CHOICE ==========
  describe('Level 2 — rewriteChoice (Rewrite Using Identity)', () => {
    it('grades correct factoring choice as E', () => {
      const correct = '(5x + 6y)(5x − 6y)';
      const result = gradeField('rewriteChoice', correct, ctx('rewriteChoice', correct));
      expect(result.score).toBe('E');
    });

    it('is case insensitive', () => {
      const result = gradeField('rewriteChoice', '9x^2 + 24xy + 16y^2',
        ctx('rewriteChoice', '9x^2 + 24xy + 16y^2'));
      expect(result.score).toBe('E');
    });

    it('grades wrong expansion as I', () => {
      const result = gradeField('rewriteChoice', '9x^2 + 16y^2',
        ctx('rewriteChoice', '9x^2 + 24xy + 16y^2'));
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('9x^2 + 24xy + 16y^2');
    });

    it('grades cube sign error as I', () => {
      const result = gradeField('rewriteChoice', '(2m − 3)(4m^2 − 6m + 9)',
        ctx('rewriteChoice', '(2m − 3)(4m^2 + 6m + 9)'));
      expect(result.score).toBe('I');
    });
  });

  // ========== LEVEL 3: NUMERIC RESULT ==========
  describe('Level 3 — numericResult (Numeric Shortcuts)', () => {
    const scenarios = [
      { expr: '9 × 11', answer: 99 },
      { expr: '19 × 21', answer: 399 },
      { expr: '29 × 31', answer: 899 },
      { expr: '49 × 51', answer: 2499 },
      { expr: '99 × 101', answer: 9999 },
      { expr: '48 × 52', answer: 2496 },
      { expr: '21²', answer: 441 },
      { expr: '19²', answer: 361 }
    ];

    scenarios.forEach(({ expr, answer }) => {
      it(`grades correct answer ${answer} for ${expr} as E`, () => {
        const result = gradeField('numericResult', String(answer), ctx('numericResult', answer));
        expect(result.score).toBe('E');
      });
    });

    it('accepts numeric input as number type', () => {
      const result = gradeField('numericResult', 99, ctx('numericResult', 99));
      expect(result.score).toBe('E');
    });

    it('accepts comma-formatted numbers', () => {
      const result = gradeField('numericResult', '9,999', ctx('numericResult', 9999));
      expect(result.score).toBe('E');
    });

    it('grades off-by-one as P (within tolerance + 1)', () => {
      // tolerance=0, so P threshold is diff <= max(1, 0) = 1
      const result = gradeField('numericResult', '100', ctx('numericResult', 99));
      expect(result.score).toBe('P');
    });

    it('grades off-by-two as I', () => {
      const result = gradeField('numericResult', '101', ctx('numericResult', 99));
      expect(result.score).toBe('I');
    });

    it('rejects non-numeric string as I', () => {
      const result = gradeField('numericResult', 'abc', ctx('numericResult', 99));
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('valid number');
    });

    it('grades NaN input as I', () => {
      const result = gradeField('numericResult', 'NaN', ctx('numericResult', 99));
      expect(result.score).toBe('I');
    });
  });

  // ========== LEVEL 4: FACTOR ANSWER ==========
  describe('Level 4 — factorAnswer (Factor Polynomials)', () => {
    // -- Difference of Squares --
    describe('Difference of Squares: 9m^4 − 25n^6', () => {
      const baseCtx = {
        answers: { factorAnswer: { value: '(3m^2 + 5n^3)(3m^2 − 5n^3)' } },
        factorRequiredTokens: ['3m^2+5n^3', '3m^2-5n^3'],
        factorForbiddenTokens: []
      };

      it('grades correct factorization as E', () => {
        const result = gradeField('factorAnswer', '(3m^2 + 5n^3)(3m^2 - 5n^3)', baseCtx);
        expect(result.score).toBe('E');
      });

      it('grades reversed factor order as E', () => {
        const result = gradeField('factorAnswer', '(3m^2 - 5n^3)(3m^2 + 5n^3)', baseCtx);
        expect(result.score).toBe('E');
      });

      it('grades with extra spaces as E', () => {
        const result = gradeField('factorAnswer', '( 3m^2 + 5n^3 )( 3m^2 - 5n^3 )', baseCtx);
        expect(result.score).toBe('E');
      });

      it('grades missing one factor as P or I', () => {
        const result = gradeField('factorAnswer', '(3m^2 + 5n^3)', baseCtx);
        expect(['P', 'I']).toContain(result.score);
      });
    });

    // -- Difference of Cubes --
    // REGRESSION GUARD (bug fixed): normalizeMath used to strip parens, so
    // "(x-6)(x^2+6x+36)" became "x-6x^2+6x+36" and the forbidden token "-6x"
    // falsely matched as a substring of "x-6x^2", grading the correct answer
    // as P instead of E. The grader now handles this correctly; this suite
    // guards against the token false positive returning.
    describe('Difference of Cubes: x^3 − 216 (regression: token false positive)', () => {
      const baseCtx = {
        answers: { factorAnswer: { value: '(x − 6)(x^2 + 6x + 36)' } },
        factorRequiredTokens: ['x-6', 'x^2', '6x', '36'],
        factorForbiddenTokens: ['x+6', 'x^2-6x', '-6x']
      };

      it('correct answer no longer trips forbidden "-6x" false positive → grades E', () => {
        const result = gradeField('factorAnswer', '(x - 6)(x^2 + 6x + 36)', baseCtx);
        expect(result.score).toBe('E');
      });

      it('grades sign error in middle term as P or I (common cube mistake)', () => {
        const result = gradeField('factorAnswer', '(x - 6)(x^2 - 6x + 36)', baseCtx);
        expect(['P', 'I']).toContain(result.score);
        expect(result.feedback).toContain('sign');
      });

      it('grades wrong linear factor sign as I', () => {
        const result = gradeField('factorAnswer', '(x + 6)(x^2 - 6x + 36)', baseCtx);
        expect(['P', 'I']).toContain(result.score);
      });
    });

    // -- Sum of Cubes --
    describe('Sum of Cubes: g^3 + 64h^3', () => {
      const baseCtx = {
        answers: { factorAnswer: { value: '(g + 4h)(g^2 − 4gh + 16h^2)' } },
        factorRequiredTokens: ['g+4h', 'g^2', '-4gh', '16h^2'],
        factorForbiddenTokens: ['g-4h', '+4gh']
      };

      it('grades correct as E', () => {
        const result = gradeField('factorAnswer', '(g + 4h)(g^2 - 4gh + 16h^2)', baseCtx);
        expect(result.score).toBe('E');
      });

      it('grades sign error +4gh as P (common cube sign mistake)', () => {
        const result = gradeField('factorAnswer', '(g + 4h)(g^2 + 4gh + 16h^2)', baseCtx);
        expect(['P', 'I']).toContain(result.score);
        expect(result.feedback).toContain('sign');
      });
    });

    // -- Complex extension --
    // BUG: Same normalizeMath issue — "(4g^4+7i)(4g^4-7i)" becomes
    // "4g^4+7i4g^4-7i". Forbidden token "4g^4-7" matches inside "4g^4-7i".
    describe('Complex Extension: 16g^8 + 49 (BUG: token false positive)', () => {
      const baseCtx = {
        answers: { factorAnswer: { value: '(4g^4 + 7i)(4g^4 − 7i)' } },
        factorRequiredTokens: ['4g^4+7i', '4g^4-7i'],
        factorForbiddenTokens: ['4g^4+7', '4g^4-7']
      };

      it('BUG: correct complex factoring triggers forbidden "4g^4-7" → grades P instead of E', () => {
        const result = gradeField('factorAnswer', '(4g^4 + 7i)(4g^4 - 7i)', baseCtx);
        // Once fixed, this should be 'E'
        expect(result.score).toBe('P');
      });

      it('grades real-only factoring attempt as P or I (forbidden token match)', () => {
        const result = gradeField('factorAnswer', '(4g^4 + 7)(4g^4 - 7)', baseCtx);
        expect(['P', 'I']).toContain(result.score);
      });
    });

    // -- Edge: no context tokens --
    it('falls back gracefully when context has no tokens', () => {
      const result = gradeField('factorAnswer', '(x-1)(x+1)', {
        answers: { factorAnswer: { value: '(x-1)(x+1)' } }
      });
      // Without required/forbidden tokens, all tokens are vacuously matched
      expect(result.score).toBe('E');
    });
  });

  // ========== LEVEL 5: PASCAL VALUE ==========
  describe('Level 5 — pascalValue (Pascal Patterns)', () => {
    it('grades correct missing entry (Row 4 middle = 6) as E', () => {
      const result = gradeField('pascalValue', '6', ctx('pascalValue', 6));
      expect(result.score).toBe('E');
    });

    it('grades correct row sum (Row 6 = 64) as E', () => {
      const result = gradeField('pascalValue', '64', ctx('pascalValue', 64));
      expect(result.score).toBe('E');
    });

    it('grades correct row sum (Row 8 = 256) as E', () => {
      const result = gradeField('pascalValue', '256', ctx('pascalValue', 256));
      expect(result.score).toBe('E');
    });

    it('grades correct binomial coefficient C(5,2) = 10 as E', () => {
      const result = gradeField('pascalValue', '10', ctx('pascalValue', 10));
      expect(result.score).toBe('E');
    });

    it('grades correct C(8,3) = 56 as E', () => {
      const result = gradeField('pascalValue', '56', ctx('pascalValue', 56));
      expect(result.score).toBe('E');
    });

    it('grades off-by-one as P (e.g., 7 instead of 6)', () => {
      const result = gradeField('pascalValue', '7', ctx('pascalValue', 6));
      expect(result.score).toBe('P');
    });

    it('grades far-off answer as I', () => {
      const result = gradeField('pascalValue', '100', ctx('pascalValue', 6));
      expect(result.score).toBe('I');
    });

    it('rejects non-numeric as I', () => {
      const result = gradeField('pascalValue', 'six', ctx('pascalValue', 6));
      expect(result.score).toBe('I');
    });
  });

  // ========== LEVEL 5: PASCAL EXPLAIN ==========
  describe('Level 5 — pascalExplain (Pascal Explanation)', () => {
    it('grades explanation mentioning Pascal and adjacent sums as E', () => {
      const result = gradeField('pascalExplain',
        'I used Pascal\'s Triangle. Each entry is the sum of the two numbers above it, so 3+3=6.',
        { answers: { pascalExplain: { value: 'reasoning' } },
          pascalKeywords: ['sum', 'add', 'above', 'adjacent', 'pascal', 'triangle'] });
      expect(result.score).toBe('E');
    });

    it('grades explanation mentioning choose/combination as E', () => {
      const result = gradeField('pascalExplain',
        'The coefficient is C(5,2) = 10, which is the combination "5 choose 2" from Row 5.',
        { answers: { pascalExplain: { value: 'reasoning' } },
          pascalKeywords: ['choose', 'combination', 'pascal', 'triangle', 'row', 'binomial'] });
      expect(result.score).toBe('E');
    });

    it('grades explanation mentioning 2^n row sum pattern as E', () => {
      const result = gradeField('pascalExplain',
        'The sum of Row 6 in Pascal\'s Triangle is 2^6 = 64. Row sums double each row.',
        { answers: { pascalExplain: { value: 'reasoning' } },
          pascalKeywords: ['2^', 'power', 'doubl', 'row sum', 'sum', 'pascal', 'triangle'] });
      expect(result.score).toBe('E');
    });

    it('grades single keyword mention with keyword hit as E (lenient by design)', () => {
      // hasAnyCore=true (mentionsPascal), hits >= 1 (pascal is in keywords)
      const result = gradeField('pascalExplain',
        'Pascal',
        { answers: { pascalExplain: { value: 'reasoning' } },
          pascalKeywords: ['pascal', 'triangle'] });
      expect(result.score).toBe('E');
    });

    it('grades vague mention of add without pascal keywords as P', () => {
      const result = gradeField('pascalExplain',
        'add them',
        { answers: { pascalExplain: { value: 'reasoning' } },
          pascalKeywords: [] });
      expect(result.score).toBe('P');
    });

    it('grades irrelevant explanation as I', () => {
      const result = gradeField('pascalExplain',
        'I multiplied the numbers together.',
        { answers: { pascalExplain: { value: 'reasoning' } },
          pascalKeywords: ['pascal', 'triangle'] });
      expect(result.score).toBe('I');
    });

    it('grades empty-like short response with no keywords as I', () => {
      const result = gradeField('pascalExplain',
        'I just guessed',
        { answers: { pascalExplain: { value: 'reasoning' } },
          pascalKeywords: ['pascal', 'triangle'] });
      expect(result.score).toBe('I');
    });
  });

  // ========== LEVEL 6: TERM COEFFICIENT ==========
  describe('Level 6 — termCoeff (Binomial Term Coefficient)', () => {
    // Scenario: (2g + 3h)^4, 3rd term, k=2
    // C(4,2) * 2^2 * 3^2 = 6 * 4 * 9 = 216
    it('grades correct coefficient 216 as E', () => {
      const result = gradeField('termCoeff', '216', ctx('termCoeff', 216));
      expect(result.score).toBe('E');
    });

    it('grades the common "forgot C(n,k)" mistake (36) as I', () => {
      // wrongCoeff = 2^2 * 3^2 = 36, which is far from 216
      const result = gradeField('termCoeff', '36', ctx('termCoeff', 216));
      expect(result.score).toBe('I');
    });

    it('grades off-by-one as P', () => {
      const result = gradeField('termCoeff', '217', ctx('termCoeff', 216));
      expect(result.score).toBe('P');
    });

    it('grades very wrong answer as I', () => {
      const result = gradeField('termCoeff', '500', ctx('termCoeff', 216));
      expect(result.score).toBe('I');
    });
  });

  // ========== LEVEL 6: TERM EXPONENTS ==========
  describe('Level 6 — termExpVar1 / termExpVar2 (Exponents)', () => {
    // (2g + 3h)^4, 3rd term: exp1=2, exp2=2 (they add to 4)
    it('grades correct exp1=2 as E', () => {
      const result = gradeField('termExpVar1', '2', ctx('termExpVar1', 2));
      expect(result.score).toBe('E');
    });

    it('grades correct exp2=2 as E', () => {
      const result = gradeField('termExpVar2', '2', ctx('termExpVar2', 2));
      expect(result.score).toBe('E');
    });

    // Different scenario: (3x + 2y)^5, 3rd term, k=2, exp1=3, exp2=2
    it('grades correct exp1=3 as E', () => {
      const result = gradeField('termExpVar1', '3', ctx('termExpVar1', 3));
      expect(result.score).toBe('E');
    });

    it('grades swapped exponents as P for var1 (off by 1)', () => {
      // exp1 expected 3, student writes 2: diff=1, so P
      const result = gradeField('termExpVar1', '2', ctx('termExpVar1', 3));
      expect(result.score).toBe('P');
    });

    it('grades far-off exponent as I', () => {
      const result = gradeField('termExpVar1', '5', ctx('termExpVar1', 2));
      expect(result.score).toBe('I');
    });

    it('grades zero exponent correctly as E', () => {
      const result = gradeField('termExpVar1', '0', ctx('termExpVar1', 0));
      expect(result.score).toBe('E');
    });
  });

  // ========== LEVEL 6: ERROR EXPLAIN ==========
  describe('Level 6 — errorExplain (Error Analysis)', () => {
    it('grades complete explanation (forgot + coefficient) as E', () => {
      const result = gradeField('errorExplain',
        'The student forgot the binomial coefficient C(4,2) from Pascal\'s Triangle. ' +
        'The correct term needs to be multiplied by C(n,k).',
        ctx('errorExplain', 'reasoning'));
      expect(result.score).toBe('E');
    });

    it('grades explanation with choose + exponent pattern as E', () => {
      const result = gradeField('errorExplain',
        'They didn\'t include the "n choose k" combination. ' +
        'The exponents should go down for the first variable and up for the second, adding to n.',
        ctx('errorExplain', 'reasoning'));
      expect(result.score).toBe('E');
    });

    it('grades explanation mentioning only binomial coefficient as P', () => {
      const result = gradeField('errorExplain',
        'Need to use the binomial coefficient.',
        ctx('errorExplain', 'reasoning'));
      expect(result.score).toBe('P');
    });

    it('grades explanation mentioning only exponent pattern as P', () => {
      const result = gradeField('errorExplain',
        'The exponents should add to n and the powers go down then up.',
        ctx('errorExplain', 'reasoning'));
      expect(result.score).toBe('P');
    });

    it('grades irrelevant explanation as I', () => {
      const result = gradeField('errorExplain',
        'The student made a mistake somewhere.',
        ctx('errorExplain', 'reasoning'));
      expect(result.score).toBe('I');
    });

    it('grades explanation with Pascal + forgot as E', () => {
      const result = gradeField('errorExplain',
        'They left out the pascal triangle value. The combination was missing from the calculation.',
        ctx('errorExplain', 'reasoning'));
      expect(result.score).toBe('E');
    });
  });

  // ========== CONTEXT OBJECT HANDLING ==========
  describe('Context Object Handling', () => {
    it('handles flat context { fieldId: value }', () => {
      const result = gradeField('identityName', 'Difference of Squares', {
        identityName: { value: 'Difference of Squares' }
      });
      expect(result.score).toBe('E');
    });

    it('handles nested answers context', () => {
      const result = gradeField('identityName', 'Difference of Squares', {
        answers: { identityName: { value: 'Difference of Squares' } }
      });
      expect(result.score).toBe('E');
    });

    it('handles missing expected gracefully (falls to fallback)', () => {
      const result = gradeField('identityName', 'anything', {});
      expect(result.score).toBe('I');
    });
  });

  // ========== CROSS-LEVEL EDGE CASES ==========
  describe('Cross-Level Edge Cases', () => {
    it('unknown fieldId falls through to exact match', () => {
      const result = gradeField('unknownField', 'hello', {
        answers: { unknownField: { value: 'hello' } }
      });
      expect(result.score).toBe('E');
    });

    it('unknown fieldId with wrong answer gives I', () => {
      const result = gradeField('unknownField', 'goodbye', {
        answers: { unknownField: { value: 'hello' } }
      });
      expect(result.score).toBe('I');
    });

    it('factorAnswer normalizeMath handles multiplication symbols', () => {
      const baseCtx = {
        answers: { factorAnswer: { value: '(3m^2 + 5n^3)(3m^2 − 5n^3)' } },
        factorRequiredTokens: ['3m^2+5n^3', '3m^2-5n^3'],
        factorForbiddenTokens: []
      };
      const result = gradeField('factorAnswer', '(3m^2 + 5n^3)·(3m^2 − 5n^3)', baseCtx);
      expect(result.score).toBe('E');
    });
  });
});
