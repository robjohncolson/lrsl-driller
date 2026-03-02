/**
 * AP Statistics Unit 6 (Topics 6.1-6.2) Grading Tests
 * Tests for inference on proportions grading rules:
 * identify evidence, two explanations, convincing evidence, identify procedure,
 * check conditions, standard error, critical values, margin of error,
 * confidence intervals, minimum sample size, capstone
 */
import { describe, it, expect } from 'vitest';
import { gradeField } from '../../cartridges/apstats-u6-inference-prop/grading-rules.js';

describe('AP Stats U6 Inference for Proportions Grading Rules', () => {
  // ========== BLANK HANDLING ==========
  describe('Blank Answer Handling', () => {
    it('rejects blank evidenceAnswer', () => {
      const result = gradeField('evidenceAnswer', '', {
        evidenceAnswer: { value: 'The sample proportion is greater than expected' }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects blank explanationAnswer', () => {
      const result = gradeField('explanationAnswer', '', {
        explanationAnswer: { value: 'Test' }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects blank convincingAnswer', () => {
      const result = gradeField('convincingAnswer', '', {
        convincingAnswer: { value: 'Yes, convincing evidence' }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects blank convincingExplain with response message', () => {
      const result = gradeField('convincingExplain', '', {});
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('response');
    });

    it('rejects blank procedureAnswer', () => {
      const result = gradeField('procedureAnswer', '', {
        procedureAnswer: { value: 'Test' }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects blank conditionsMet', () => {
      const result = gradeField('conditionsMet', '', {
        conditionsMet: { value: 'Yes, all conditions are met' }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects blank conditionsExplain with response message', () => {
      const result = gradeField('conditionsExplain', '', {});
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('response');
    });

    it('rejects blank seAnswer with number message', () => {
      const result = gradeField('seAnswer', '', {
        seAnswer: { value: 0.03 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank zStarAnswer with number message', () => {
      const result = gradeField('zStarAnswer', '', {
        zStarAnswer: { value: 1.96 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank meAnswer with number message', () => {
      const result = gradeField('meAnswer', '', {
        meAnswer: { value: 0.05 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank ciLower with number message', () => {
      const result = gradeField('ciLower', '', {
        ciLower: { value: 0.45 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank ciUpper with number message', () => {
      const result = gradeField('ciUpper', '', {
        ciUpper: { value: 0.65 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank sampleSizeAnswer with number message', () => {
      const result = gradeField('sampleSizeAnswer', '', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank capstoneConditions', () => {
      const result = gradeField('capstoneConditions', '', {
        capstoneConditions: { value: 'Yes, all conditions are met' }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('select');
    });

    it('rejects blank capstoneLower with number message', () => {
      const result = gradeField('capstoneLower', '', {
        capstoneLower: { value: 0.50 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank capstoneUpper with number message', () => {
      const result = gradeField('capstoneUpper', '', {
        capstoneUpper: { value: 0.70 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('number');
    });

    it('rejects blank capstoneExplain with response message', () => {
      const result = gradeField('capstoneExplain', '', {});
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('response');
    });

    it('rejects null answer', () => {
      const result = gradeField('evidenceAnswer', null, {
        evidenceAnswer: { value: 'Test' }
      });
      expect(result.score).toBe('I');
    });

    it('rejects undefined answer', () => {
      const result = gradeField('seAnswer', undefined, {
        seAnswer: { value: 0.03 }
      });
      expect(result.score).toBe('I');
    });

    it('rejects whitespace-only answer for choice field', () => {
      const result = gradeField('conditionsMet', '   ', {
        conditionsMet: { value: 'Yes, all conditions are met' }
      });
      expect(result.score).toBe('I');
    });
  });

  // ========== L01: Evidence (Choice) ==========
  describe('evidenceAnswer (L01 - Identify Evidence)', () => {
    it('grades correct answer as E', () => {
      const result = gradeField('evidenceAnswer',
        'The sample proportion (p̂ = 0.46) is greater than the expected proportion (0.40)',
        { evidenceAnswer: { value: 'The sample proportion (p̂ = 0.46) is greater than the expected proportion (0.40)' } }
      );
      expect(result.score).toBe('E');
      expect(result.feedback.toLowerCase()).toContain('evidence');
    });

    it('is case insensitive', () => {
      const result = gradeField('evidenceAnswer',
        'THE SAMPLE PROPORTION (P̂ = 0.46) IS GREATER THAN THE EXPECTED PROPORTION (0.40)',
        { evidenceAnswer: { value: 'The sample proportion (p̂ = 0.46) is greater than the expected proportion (0.40)' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades incorrect answer as I', () => {
      const result = gradeField('evidenceAnswer',
        'The sample size is large enough',
        { evidenceAnswer: { value: 'The sample proportion (p̂ = 0.46) is greater than the expected proportion (0.40)' } }
      );
      expect(result.score).toBe('I');
    });
  });

  // ========== L02: Explanations (Dropdown) ==========
  describe('explanationAnswer (L02 - Two Explanations)', () => {
    it('grades correct answer as E', () => {
      const correctAnswer = '(1) The higher rate happened purely by chance in this particular sample, or (2) the vaccine truly causes a higher rate of side effects';
      const result = gradeField('explanationAnswer', correctAnswer, {
        explanationAnswer: { value: correctAnswer }
      });
      expect(result.score).toBe('E');
      expect(result.feedback.toLowerCase()).toContain('chance');
    });

    it('grades incorrect answer as I', () => {
      const result = gradeField('explanationAnswer',
        '(1) The sample was biased, or (2) the measurement was inaccurate',
        { explanationAnswer: { value: '(1) The higher rate happened purely by chance, or (2) there is a real effect' } }
      );
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('chance');
    });
  });

  // ========== L03: Convincing Evidence (Choice + Textarea) ==========
  describe('convincingAnswer (L03 - Convincing Evidence)', () => {
    it('grades correct "yes" answer as E', () => {
      const result = gradeField('convincingAnswer',
        'Yes, convincing evidence',
        { convincingAnswer: { value: 'Yes, convincing evidence' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades correct "no" answer as E', () => {
      const result = gradeField('convincingAnswer',
        'No, not convincing evidence',
        { convincingAnswer: { value: 'No, not convincing evidence' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades incorrect answer as I', () => {
      const result = gradeField('convincingAnswer',
        'Yes, convincing evidence',
        { convincingAnswer: { value: 'No, not convincing evidence' } }
      );
      expect(result.score).toBe('I');
    });
  });

  describe('convincingExplain (L03 - Explanation)', () => {
    it('grades explanation with probability AND chance keywords as E', () => {
      const result = gradeField('convincingExplain',
        'Because the probability of getting this result by chance alone is only 1.5%, which is less than 5%, the evidence is convincing.',
        {}
      );
      expect(result.score).toBe('E');
    });

    it('grades explanation with just one keyword as P', () => {
      const result = gradeField('convincingExplain',
        'The simulation showed that this result is very unlikely based on the trials that were run.',
        {}
      );
      expect(result.score).toBe('P');
    });

    it('grades vague explanation as I', () => {
      const result = gradeField('convincingExplain',
        'Yes it is.',
        {}
      );
      expect(result.score).toBe('I');
    });
  });

  // ========== L04: Procedure (Dropdown) ==========
  describe('procedureAnswer (L04 - Identify Procedure)', () => {
    it('grades correct procedure as E', () => {
      const result = gradeField('procedureAnswer',
        'One-sample z-interval for a population proportion',
        { procedureAnswer: { value: 'One-sample z-interval for a population proportion' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades wrong procedure as I', () => {
      const result = gradeField('procedureAnswer',
        'Two-sample z-interval for p₁ − p₂',
        { procedureAnswer: { value: 'One-sample z-interval for a population proportion' } }
      );
      expect(result.score).toBe('I');
    });
  });

  // ========== L05: Conditions (Choice + Textarea) ==========
  describe('conditionsMet (L05 - Check Conditions)', () => {
    it('grades correct "met" answer as E', () => {
      const result = gradeField('conditionsMet',
        'Yes, all conditions are met',
        { conditionsMet: { value: 'Yes, all conditions are met' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades correct "fails" answer as E', () => {
      const result = gradeField('conditionsMet',
        'No, at least one condition fails',
        { conditionsMet: { value: 'No, at least one condition fails' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades incorrect answer as I', () => {
      const result = gradeField('conditionsMet',
        'Yes, all conditions are met',
        { conditionsMet: { value: 'No, at least one condition fails' } }
      );
      expect(result.score).toBe('I');
    });
  });

  describe('conditionsExplain (L05 - Conditions Explanation)', () => {
    it('grades explanation mentioning all 3 conditions as E', () => {
      const result = gradeField('conditionsExplain',
        'Random: the sample is a random sample of voters. 10%: 250 is less than 10% of 80,000. Large counts: np̂ = 155 ≥ 10 and n(1−p̂) = 95 ≥ 10.',
        {}
      );
      expect(result.score).toBe('E');
    });

    it('grades explanation mentioning 1 condition as P', () => {
      const result = gradeField('conditionsExplain',
        'The sample was taken using a random selection from the population of voters, so it is a random sample.',
        {}
      );
      expect(result.score).toBe('P');
    });

    it('grades vague explanation as I', () => {
      const result = gradeField('conditionsExplain',
        'All conditions are met.',
        {}
      );
      expect(result.score).toBe('I');
    });
  });

  // ========== L06: Standard Error (Number) ==========
  describe('seAnswer (L06 - Standard Error)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('seAnswer', '0.0310', {
        seAnswer: { value: 0.031 }
      });
      expect(result.score).toBe('E');
    });

    it('grades answer within tolerance as E', () => {
      const result = gradeField('seAnswer', '0.0312', {
        seAnswer: { value: 0.031 }
      });
      expect(result.score).toBe('E');
    });

    it('grades close answer as P', () => {
      const result = gradeField('seAnswer', '0.035', {
        seAnswer: { value: 0.031 }
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong answer as I', () => {
      const result = gradeField('seAnswer', '0.15', {
        seAnswer: { value: 0.031 }
      });
      expect(result.score).toBe('I');
    });

    it('detects forgot-square-root error', () => {
      // SE = 0.031, SE^2 = 0.000961
      const result = gradeField('seAnswer', '0.000961', {
        seAnswer: { value: 0.031 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('square root');
    });

    it('handles non-numeric input', () => {
      const result = gradeField('seAnswer', 'zero point three', {
        seAnswer: { value: 0.031 }
      });
      expect(result.score).toBe('I');
    });
  });

  // ========== L07: Critical Value (Number) ==========
  describe('zStarAnswer (L07 - Critical Value)', () => {
    it('grades exact z* = 1.960 for 95% as E', () => {
      const result = gradeField('zStarAnswer', '1.960', {
        zStarAnswer: { value: 1.960 }
      });
      expect(result.score).toBe('E');
    });

    it('grades exact z* = 1.645 for 90% as E', () => {
      const result = gradeField('zStarAnswer', '1.645', {
        zStarAnswer: { value: 1.645 }
      });
      expect(result.score).toBe('E');
    });

    it('grades exact z* = 2.576 for 99% as E', () => {
      const result = gradeField('zStarAnswer', '2.576', {
        zStarAnswer: { value: 2.576 }
      });
      expect(result.score).toBe('E');
    });

    it('grades close value as P', () => {
      const result = gradeField('zStarAnswer', '1.95', {
        zStarAnswer: { value: 1.960 }
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong z* as I', () => {
      const result = gradeField('zStarAnswer', '1.645', {
        zStarAnswer: { value: 1.960 }
      });
      expect(result.score).toBe('I');
    });
  });

  // ========== L08: Margin of Error (Number) ==========
  describe('meAnswer (L08 - Margin of Error)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('meAnswer', '0.0608', {
        meAnswer: { value: 0.0608 }
      });
      expect(result.score).toBe('E');
    });

    it('grades close answer as P', () => {
      const result = gradeField('meAnswer', '0.065', {
        meAnswer: { value: 0.0608 }
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong answer as I', () => {
      const result = gradeField('meAnswer', '0.15', {
        meAnswer: { value: 0.0608 }
      });
      expect(result.score).toBe('I');
    });

    it('detects SE-instead-of-ME error', () => {
      // ME = 0.0608, SE = 0.031 (student forgot to multiply by z*)
      const result = gradeField('meAnswer', '0.031', {
        meAnswer: { value: 0.0608 },
        answers: { seAnswer: { value: 0.031 } }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('standard error');
    });

    it('handles non-numeric input', () => {
      const result = gradeField('meAnswer', 'six percent', {
        meAnswer: { value: 0.06 }
      });
      expect(result.score).toBe('I');
    });
  });

  // ========== L09: Confidence Interval (Number) ==========
  describe('ciLower (L09 - CI Lower Bound)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('ciLower', '0.489', {
        ciLower: { value: 0.489 }
      });
      expect(result.score).toBe('E');
    });

    it('grades close answer as P', () => {
      const result = gradeField('ciLower', '0.480', {
        ciLower: { value: 0.489 }
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong answer as I', () => {
      const result = gradeField('ciLower', '0.350', {
        ciLower: { value: 0.489 }
      });
      expect(result.score).toBe('I');
    });

    it('detects swapped bounds (student entered upper for lower)', () => {
      const result = gradeField('ciLower', '0.711', {
        ciLower: { value: 0.489 },
        ciUpper: { value: 0.711 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('lower bound');
    });
  });

  describe('ciUpper (L09 - CI Upper Bound)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('ciUpper', '0.711', {
        ciUpper: { value: 0.711 }
      });
      expect(result.score).toBe('E');
    });

    it('grades close answer as P', () => {
      const result = gradeField('ciUpper', '0.720', {
        ciUpper: { value: 0.711 }
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong answer as I', () => {
      const result = gradeField('ciUpper', '0.900', {
        ciUpper: { value: 0.711 }
      });
      expect(result.score).toBe('I');
    });

    it('detects swapped bounds (student entered lower for upper)', () => {
      const result = gradeField('ciUpper', '0.489', {
        ciLower: { value: 0.489 },
        ciUpper: { value: 0.711 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('upper bound');
    });
  });

  // ========== L10: Minimum Sample Size (Number) ==========
  describe('sampleSizeAnswer (L10 - Minimum Sample Size)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('sampleSizeAnswer', '385', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('E');
    });

    it('grades answer within 1 as E', () => {
      const result = gradeField('sampleSizeAnswer', '386', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('E');
    });

    it('detects round-down error (P instead of E)', () => {
      const result = gradeField('sampleSizeAnswer', '384', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('P');
      expect(result.feedback.toLowerCase()).toContain('round up');
    });

    it('grades answer within 5 as P', () => {
      const result = gradeField('sampleSizeAnswer', '381', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong answer as I', () => {
      const result = gradeField('sampleSizeAnswer', '200', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('I');
    });

    it('handles non-numeric input', () => {
      const result = gradeField('sampleSizeAnswer', 'three hundred', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('I');
    });
  });

  // ========== L11: Capstone ==========
  describe('capstoneConditions (L11 - Capstone Conditions)', () => {
    it('grades correct "met" answer as E', () => {
      const result = gradeField('capstoneConditions',
        'Yes, all conditions are met',
        { capstoneConditions: { value: 'Yes, all conditions are met' } }
      );
      expect(result.score).toBe('E');
    });

    it('grades incorrect answer as I', () => {
      const result = gradeField('capstoneConditions',
        'No, at least one condition fails',
        { capstoneConditions: { value: 'Yes, all conditions are met' } }
      );
      expect(result.score).toBe('I');
    });
  });

  describe('capstoneLower (L11 - Capstone Lower)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('capstoneLower', '0.631', {
        capstoneLower: { value: 0.631 }
      });
      expect(result.score).toBe('E');
    });

    it('grades close answer as P', () => {
      const result = gradeField('capstoneLower', '0.620', {
        capstoneLower: { value: 0.631 }
      });
      expect(result.score).toBe('P');
    });

    it('grades wrong answer as I', () => {
      const result = gradeField('capstoneLower', '0.500', {
        capstoneLower: { value: 0.631 }
      });
      expect(result.score).toBe('I');
    });

    it('detects swapped bounds', () => {
      const result = gradeField('capstoneLower', '0.729', {
        capstoneLower: { value: 0.631 },
        capstoneUpper: { value: 0.729 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('lower bound');
    });
  });

  describe('capstoneUpper (L11 - Capstone Upper)', () => {
    it('grades exact answer as E', () => {
      const result = gradeField('capstoneUpper', '0.729', {
        capstoneUpper: { value: 0.729 }
      });
      expect(result.score).toBe('E');
    });

    it('grades close answer as P', () => {
      const result = gradeField('capstoneUpper', '0.740', {
        capstoneUpper: { value: 0.729 }
      });
      expect(result.score).toBe('P');
    });

    it('detects swapped bounds', () => {
      const result = gradeField('capstoneUpper', '0.631', {
        capstoneLower: { value: 0.631 },
        capstoneUpper: { value: 0.729 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('upper bound');
    });
  });

  describe('capstoneExplain (L11 - Capstone Interpretation)', () => {
    it('grades complete interpretation with confidence + bounds + context as E', () => {
      const result = gradeField('capstoneExplain',
        'We are 95% confident that the interval from 0.631 to 0.729 captures the true proportion of all high school seniors in the state who plan to attend a four-year college.',
        {}
      );
      expect(result.score).toBe('E');
    });

    it('grades interpretation missing context as P', () => {
      const result = gradeField('capstoneExplain',
        'We are 95% confident that the interval from 0.631 to 0.729 captures the true value.',
        {}
      );
      expect(result.score).toBe('P');
    });

    it('grades vague explanation as I', () => {
      const result = gradeField('capstoneExplain',
        'The interval is correct.',
        {}
      );
      expect(result.score).toBe('I');
    });

    it('detects "probability" misconception (gives P not I)', () => {
      const result = gradeField('capstoneExplain',
        'There is a 95% probability that the true proportion of all seniors who plan to attend college falls between 0.631 and 0.729.',
        {}
      );
      expect(result.score).toBe('P');
      expect(result.feedback.toLowerCase()).toContain('probability');
      expect(result.feedback.toLowerCase()).toContain('confident');
    });

    it('detects "accept the null" misconception as I', () => {
      const result = gradeField('capstoneExplain',
        'Since the interval contains the claimed value, we accept the null hypothesis and prove that the proportion is correct.',
        {}
      );
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('accept');
    });

    it('grades explanation with confidence + bounds (missing context) as P', () => {
      const result = gradeField('capstoneExplain',
        'We are 95% confident that the true value is between 0.631 and 0.729 based on our sample data.',
        {}
      );
      expect(result.score).toBe('P');
    });
  });

  // ========== CASE SENSITIVITY AND TRIMMING ==========
  describe('Case Sensitivity and Trimming', () => {
    it('is case insensitive for choice fields', () => {
      const result = gradeField('conditionsMet',
        'YES, ALL CONDITIONS ARE MET',
        { conditionsMet: { value: 'Yes, all conditions are met' } }
      );
      expect(result.score).toBe('E');
    });

    it('trims whitespace', () => {
      const result = gradeField('convincingAnswer',
        '  Yes, convincing evidence  ',
        { convincingAnswer: { value: 'Yes, convincing evidence' } }
      );
      expect(result.score).toBe('E');
    });
  });

  // ========== CONTEXT OBJECT HANDLING ==========
  describe('Context Object Handling', () => {
    it('handles object-valued context { value: "..." }', () => {
      const result = gradeField('evidenceAnswer', 'Correct', {
        evidenceAnswer: { value: 'Correct' }
      });
      expect(result.score).toBe('E');
    });

    it('handles answers property in context', () => {
      const result = gradeField('conditionsMet', 'Yes, all conditions are met', {
        answers: { conditionsMet: { value: 'Yes, all conditions are met' } }
      });
      expect(result.score).toBe('E');
    });
  });

  // ========== COMMON ERROR DETECTION ==========
  describe('Common Error Detection', () => {
    it('detects forgot-sqrt error for SE', () => {
      // If SE = 0.05, then SE^2 = 0.0025
      const result = gradeField('seAnswer', '0.0025', {
        seAnswer: { value: 0.05 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('square root');
    });

    it('detects using p0 instead of pHat for SE in CI context', () => {
      // pHat=0.80, p0=0.50, n=100
      // Correct SE = sqrt(0.80*0.20/100) = 0.0400
      // Wrong SE (using p0) = sqrt(0.50*0.50/100) = 0.0500
      // Diff = 0.01 > 0.002 threshold, so error detection triggers
      const result = gradeField('seAnswer', '0.0500', {
        seAnswer: { value: 0.0400 },
        pHat: 0.80,
        p0: 0.50,
        n: 100
      });
      expect(result.score).toBe('I');
      expect(result.feedback).toContain('0.5');
    });

    it('detects SE given instead of ME (forgot to multiply by z*)', () => {
      const result = gradeField('meAnswer', '0.0310', {
        meAnswer: { value: 0.0608 },
        answers: { seAnswer: { value: 0.031 } }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toContain('standard error');
    });

    it('detects swapped CI lower/upper bounds for ciLower', () => {
      const result = gradeField('ciLower', '0.711', {
        ciLower: { value: 0.489 },
        ciUpper: { value: 0.711 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toMatch(/lower.*upper|upper.*lower/);
    });

    it('detects swapped CI lower/upper bounds for ciUpper', () => {
      const result = gradeField('ciUpper', '0.489', {
        ciLower: { value: 0.489 },
        ciUpper: { value: 0.711 }
      });
      expect(result.score).toBe('I');
      expect(result.feedback.toLowerCase()).toMatch(/lower.*upper|upper.*lower/);
    });

    it('detects round-down for sample size', () => {
      // Expected n = 385, student gives 384 (rounded down)
      const result = gradeField('sampleSizeAnswer', '384', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('P');
      expect(result.feedback.toLowerCase()).toContain('round up');
    });
  });

  // ========== NON-NUMERIC INPUT HANDLING ==========
  describe('Non-Numeric Input Handling', () => {
    it('rejects text for seAnswer', () => {
      const result = gradeField('seAnswer', 'zero point three', {
        seAnswer: { value: 0.03 }
      });
      expect(result.score).toBe('I');
    });

    it('rejects text for zStarAnswer', () => {
      const result = gradeField('zStarAnswer', 'one point nine six', {
        zStarAnswer: { value: 1.96 }
      });
      expect(result.score).toBe('I');
    });

    it('rejects text for meAnswer', () => {
      const result = gradeField('meAnswer', 'about six percent', {
        meAnswer: { value: 0.06 }
      });
      expect(result.score).toBe('I');
    });

    it('rejects text for ciLower', () => {
      const result = gradeField('ciLower', 'point four', {
        ciLower: { value: 0.4 }
      });
      expect(result.score).toBe('I');
    });

    it('rejects text for sampleSizeAnswer', () => {
      const result = gradeField('sampleSizeAnswer', 'three hundred eighty five', {
        sampleSizeAnswer: { value: 385 }
      });
      expect(result.score).toBe('I');
    });
  });
});
