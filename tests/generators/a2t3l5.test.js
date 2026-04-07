import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateProblem } from '../../cartridges/a2t3l5/generator.js';

const manifest = JSON.parse(
  readFileSync(
    new URL('../../cartridges/a2t3l5/manifest.json', import.meta.url),
    'utf8'
  )
);

const modeSpecs = [
  { modeId: 'l01-vocab-basics', fieldId: 'vocabAnswer', optionKeys: ['optA', 'optB', 'optC', 'optD'] },
  { modeId: 'l02-zero-from-factor', fieldId: 'zeroChoice', optionKeys: ['optA', 'optB', 'optC', 'optD'] },
  { modeId: 'l03-multiplicity-id', fieldId: 'multChoice', optionKeys: ['optA', 'optB', 'optC', 'optD'] },
  { modeId: 'l04-cross-or-touch', fieldId: 'crossTouch', optionKeys: ['optA', 'optB'] },
  { modeId: 'l05-factor-find-zeros', fieldId: 'zerosText' },
  { modeId: 'l06-multiplicity-report', fieldId: 'reportText' },
  { modeId: 'l07-sign-chart', fieldId: 'intervalText' },
  { modeId: 'l08-complex-vs-real', fieldId: 'complexType', optionKeys: ['optA', 'optB'] },
  { modeId: 'l09-complex-squaring', fieldId: 'complexResult' },
  { modeId: 'l10-equation-rewrite', fieldId: 'solutionsText' },
  { modeId: 'l11-inequality', fieldId: 'inequalityText' },
  { modeId: 'l12-transformations', fieldId: 'transformChoice', optionKeys: ['optA', 'optB', 'optC', 'optD'] },
  { modeId: 'l13-sketch-justification', fieldId: 'sketchExplain' },
  { modeId: 'l14-error-capstone', fieldId: 'errorExplain' }
];

describe('a2t3l5 generator', () => {
  it('manifest includes all 14 levels', () => {
    expect(manifest.modes).toHaveLength(14);
    expect(manifest.progression.tiers).toHaveLength(14);
  });

  modeSpecs.forEach(({ modeId, fieldId, optionKeys = [] }) => {
    describe(modeId, () => {
      it('returns the required structure and expected field', () => {
        const problem = generateProblem(modeId, null, {});

        expect(problem).toHaveProperty('scenario');
        expect(problem).toHaveProperty('context');
        expect(problem).toHaveProperty('answers');
        expect(problem.context).toHaveProperty('levelName');
        expect(problem.context).toHaveProperty('problemText');
        expect(problem.context).toHaveProperty('givenText');
        expect(problem.answers).toHaveProperty(fieldId);
        expect(problem.answers[fieldId]).toHaveProperty('value');
        expect(problem.context.answers[fieldId].value).toEqual(problem.answers[fieldId].value);

        optionKeys.forEach((key) => {
          expect(problem.context[key]).toBeTruthy();
        });
      });

      it('produces variety across 20 generations', () => {
        const variants = new Set();

        for (let count = 0; count < 20; count += 1) {
          const problem = generateProblem(modeId, null, {});
          variants.add(problem.scenario);
        }

        expect(variants.size).toBeGreaterThan(3);
      });

      if (optionKeys.length > 0) {
        it('includes the correct answer exactly once among the presented options', () => {
          const problem = generateProblem(modeId, null, {});
          const options = optionKeys.map(key => problem.context[key]);
          const expected = String(problem.answers[fieldId].value);
          const hits = options.filter(option => option === expected).length;

          expect(hits).toBe(1);
        });
      }
    });
  });

  it('provides keyword buckets for textarea levels', () => {
    const sketch = generateProblem('l13-sketch-justification', null, {});
    const error = generateProblem('l14-error-capstone', null, {});

    expect(Array.isArray(sketch.context.keywordBuckets)).toBe(true);
    expect(Array.isArray(error.context.keywordBuckets)).toBe(true);
    expect(sketch.context.expectedAnswer).toBeTruthy();
    expect(error.context.expectedAnswer).toBeTruthy();
  });
});
