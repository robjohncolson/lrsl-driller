import { describe, expect, it } from 'vitest';
import { gradeField } from '../../cartridges/a2t3l5/grading-rules.js';

function ctx(fieldId, value, extra = {}) {
  return {
    answers: {
      [fieldId]: { value, tolerance: 0 }
    },
    ...extra
  };
}

describe('a2t3l5 grading rules', () => {
  describe('choice and dropdown fields', () => {
    const exactFields = [
      ['vocabAnswer', 'The x-value where f(x) = 0'],
      ['zeroChoice', '2'],
      ['multChoice', '4'],
      ['crossTouch', 'Crosses the x-axis'],
      ['complexType', 'Two real zeros'],
      ['transformChoice', 'Stretch by 4, right 1']
    ];

    exactFields.forEach(([fieldId, expected]) => {
      it(`${fieldId} grades correct answers as E`, () => {
        expect(gradeField(fieldId, expected, ctx(fieldId, expected)).score).toBe('E');
      });

      it(`${fieldId} rejects blank answers`, () => {
        expect(gradeField(fieldId, '', ctx(fieldId, expected)).score).toBe('I');
      });
    });

    it('grades wrong choice answers as I', () => {
      const result = gradeField('vocabAnswer', 'The greatest exponent', ctx('vocabAnswer', 'The x-value where f(x) = 0'));
      expect(result.score).toBe('I');
    });

    it('grades wrong dropdown answers as I', () => {
      const result = gradeField('transformChoice', 'Shift left 2', ctx('transformChoice', 'Shift right 2'));
      expect(result.score).toBe('I');
    });
  });

  describe('zerosText', () => {
    const context = ctx('zerosText', '-3, 0, 1', { expectedNumbers: [-3, 0, 1] });

    it('grades all correct zeros as E', () => {
      expect(gradeField('zerosText', '-3, 0, 1', context).score).toBe('E');
    });

    it('grades a near miss as P', () => {
      expect(gradeField('zerosText', '-3, 1', context).score).toBe('P');
    });

    it('grades factor form as I', () => {
      expect(gradeField('zerosText', 'x(x+3)(x-1)', context).score).toBe('I');
    });
  });

  describe('reportText', () => {
    const context = ctx('reportText', '(-4, 1, cross); (0, 1, cross); (1, 4, touch)', {
      expectedReports: [
        { zero: -4, mult: 1, behavior: 'cross' },
        { zero: 0, mult: 1, behavior: 'cross' },
        { zero: 1, mult: 4, behavior: 'touch' }
      ]
    });

    it('grades an exact report as E', () => {
      expect(gradeField('reportText', '(-4,1,cross); (0,1,cross); (1,4,touch)', context).score).toBe('E');
    });

    it('grades one wrong behavior as P', () => {
      expect(gradeField('reportText', '(-4,1,cross); (0,1,cross); (1,4,cross)', context).score).toBe('P');
    });

    it('grades wrong zeros as I', () => {
      expect(gradeField('reportText', '(4,1,cross); (0,1,cross); (1,4,touch)', context).score).toBe('I');
    });
  });

  describe('intervalText', () => {
    const context = ctx('intervalText', '(-3, 0) U (4, inf)', {
      expectedIntervalSet: '(-3, 0) U (4, inf)'
    });

    it('grades correct intervals as E', () => {
      expect(gradeField('intervalText', '(-3,0) U (4,inf)', context).score).toBe('E');
    });

    it('grades a partial interval answer as P', () => {
      expect(gradeField('intervalText', '(-3,0)', context).score).toBe('P');
    });

    it('grades only zeros as I', () => {
      expect(gradeField('intervalText', '-3, 0, 4', context).score).toBe('I');
    });
  });

  describe('complexResult', () => {
    const context = ctx('complexResult', '-5 + 12i', {
      expectedComplex: { real: -5, imag: 12 }
    });

    it('grades exact complex form as E', () => {
      expect(gradeField('complexResult', '-5+12i', context).score).toBe('E');
    });

    it('grades one-part mistakes as P', () => {
      expect(gradeField('complexResult', '-5-12i', context).score).toBe('P');
    });

    it('grades one correct part as P', () => {
      expect(gradeField('complexResult', '13+12i', context).score).toBe('P');
    });

    it('grades major mistakes as I', () => {
      expect(gradeField('complexResult', '25', context).score).toBe('I');
    });
  });

  describe('solutionsText', () => {
    const context = ctx('solutionsText', '-5, -1, 2', {
      expectedNumbers: [-5, -1, 2]
    });

    it('grades all solutions as E', () => {
      expect(gradeField('solutionsText', '-5, -1, 2', context).score).toBe('E');
    });

    it('grades a missing root as P', () => {
      expect(gradeField('solutionsText', '-5, 2', context).score).toBe('P');
    });

    it('grades wrong solutions as I', () => {
      expect(gradeField('solutionsText', '5, 1, -2', context).score).toBe('I');
    });
  });

  describe('inequalityText', () => {
    const context = ctx('inequalityText', '(-inf, -4] U {1}', {
      expectedIntervalSet: '(-inf, -4] U {1}'
    });

    it('grades correct endpoint and singleton notation as E', () => {
      expect(gradeField('inequalityText', '(-inf,-4] U {1}', context).score).toBe('E');
    });

    it('grades endpoint mistakes as P', () => {
      expect(gradeField('inequalityText', '(-inf,-4) U {1}', context).score).toBe('P');
    });

    it('grades opposite intervals as I', () => {
      expect(gradeField('inequalityText', '(-4,1)', context).score).toBe('I');
    });
  });

  describe('sketchExplain', () => {
    const context = ctx('sketchExplain', 'expected', {
      keywordBuckets: [
        { keywords: ['-1', '6'], minMatches: 2 },
        { keywords: ['cross', 'odd'], minMatches: 1 },
        { keywords: ['sign chart', 'test point', 'negative'], minMatches: 1 },
        { keywords: ['(-1,6)', '(-1, 6)', 'f(x)<0'], minMatches: 1 }
      ]
    });

    it('grades a complete explanation as E', () => {
      const answer = 'The zeros are -1 and 6. Both have odd multiplicity so the graph crosses at each zero. A sign chart shows the polynomial is negative on (-1, 6), so f(x) < 0 there.';
      expect(gradeField('sketchExplain', answer, context).score).toBe('E');
    });

    it('grades a partial explanation as P', () => {
      const answer = 'The zeros are -1 and 6 and both cross. The graph changes sign at those values.';
      expect(gradeField('sketchExplain', answer, context).score).toBe('P');
    });

    it('grades misconception language as I', () => {
      expect(gradeField('sketchExplain', 'Touch means odd multiplicity.', context).score).toBe('I');
    });
  });

  describe('errorExplain', () => {
    const context = ctx('errorExplain', 'expected', {
      keywordBuckets: [
        { keywords: ['middle term', 'foil', 'missing'], minMatches: 1 },
        { keywords: ['12i'], minMatches: 1 },
        { keywords: ['-5+12i', '-5 + 12i'], minMatches: 1 }
      ],
      forbiddenKeywords: ['student is correct']
    });

    it('grades a complete correction as E', () => {
      const answer = 'The error is that the student left out the middle term when using FOIL. The missing term is 12i, so the corrected result is -5 + 12i.';
      expect(gradeField('errorExplain', answer, context).score).toBe('E');
    });

    it('grades an incomplete correction as P', () => {
      const answer = 'They forgot part of FOIL and should have included 12i.';
      expect(gradeField('errorExplain', answer, context).score).toBe('P');
    });

    it('grades repeated incorrect work as I', () => {
      expect(gradeField('errorExplain', 'The student is correct.', context).score).toBe('I');
    });
  });
});
