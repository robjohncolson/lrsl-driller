/**
 * Residuals - Grading Rules
 * Handles numeric, choice, and text-based grading for residual problems
 */

/**
 * Get grading rule for a specific field
 */
export function getRule(fieldId) {
  return rules[fieldId] || null;
}

/**
 * Grading rules by field
 */
const rules = {
  // Calculate mode - numeric answers
  predicted: {
    type: 'numeric',
    expected: 'predictedY',
    tolerance: 0.15,
    relativeTolerance: true,
    feedback: {
      E: 'Correct prediction!',
      P: 'Close, but check your calculation',
      I: 'Remember: ŷ = intercept + slope × x'
    }
  },

  residual: {
    type: 'numeric',
    expected: 'residual',
    tolerance: 0.15,
    relativeTolerance: true,
    feedback: {
      E: 'Correct residual calculation!',
      P: 'Close, but check: residual = actual - predicted',
      I: 'Remember: residual = y - ŷ (actual minus predicted)'
    }
  },

  // Interpret mode - choice and text
  overUnder: {
    type: 'exact',
    expected: 'overUnder',
    feedback: {
      E: 'Correct!',
      I: 'Positive residual = underprediction (actual > predicted). Negative = overprediction.'
    }
  },

  interpretation: {
    type: 'regex',
    rubric: [
      {
        id: 'actual',
        required: true,
        pattern: /\b(actual|observed|real|true)\b/i,
        feedback: 'Refer to the actual/observed value'
      },
      {
        id: 'comparison',
        required: true,
        pattern: /\b(more|less|higher|lower|greater|fewer|above|below)\b.*\b(than|predicted|expected)\b/i,
        feedback: 'Compare actual to predicted (more/less than predicted)'
      },
      {
        id: 'residualValue',
        required: false,
        pattern: null,
        contextPattern: (ctx) => {
          const val = Math.abs(parseFloat(ctx.residualAbs));
          return new RegExp(`\\b${val.toFixed(1)}|${val.toFixed(2)}\\b`);
        },
        feedback: 'Include the residual value'
      },
      {
        id: 'yVariable',
        required: true,
        pattern: null,
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.yVar), 'i'),
        feedback: 'Mention the response variable'
      },
      {
        id: 'units',
        required: false,
        pattern: null,
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.yUnits), 'i'),
        feedback: 'Include the units'
      }
    ],
    scoring: {
      E: { minRequired: 4, maxMissing: 1 },
      P: { minRequired: 2, maxMissing: 3 },
      I: { minRequired: 0, maxMissing: 5 }
    }
  },

  // Analyze mode - choice and text
  pattern: {
    type: 'exact',
    expected: 'pattern',
    feedback: {
      E: 'Correct pattern identification!',
      I: 'Look carefully at the shape: random scatter, curved, fan-shaped, or clustered?'
    }
  },

  appropriate: {
    type: 'exact',
    expected: 'appropriate',
    feedback: {
      E: 'Correct assessment!',
      I: 'A linear model is appropriate only when residuals show random scatter around zero'
    }
  },

  explanation: {
    type: 'regex',
    rubric: [
      {
        id: 'pattern',
        required: true,
        pattern: /\b(random|scatter|pattern|curve|fan|spread|cluster)\b/i,
        feedback: 'Describe the pattern you observe'
      },
      {
        id: 'zero',
        required: false,
        pattern: /\b(zero|0|horizontal)\b/i,
        feedback: 'Reference the zero line'
      },
      {
        id: 'conclusion',
        required: true,
        pattern: /\b(appropriate|suitable|good|fit|works|valid|not appropriate|unsuitable|poor|inappropriate)\b/i,
        feedback: 'State whether linear model is appropriate'
      },
      {
        id: 'reasoning',
        required: true,
        pattern: /\b(because|since|shows|indicates|suggests|therefore|so)\b/i,
        feedback: 'Explain your reasoning'
      }
    ],
    scoring: {
      E: { minRequired: 4, maxMissing: 0 },
      P: { minRequired: 2, maxMissing: 2 },
      I: { minRequired: 0, maxMissing: 4 }
    }
  }
};

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Grade a numeric answer
 */
export function gradeNumeric(answer, rule, context) {
  const userValue = parseFloat(answer);
  if (isNaN(userValue)) {
    return {
      score: 'I',
      feedback: 'Please enter a numeric value'
    };
  }

  // Get expected value from context
  let expected = rule.expected;
  if (typeof expected === 'string') {
    expected = parseFloat(context[expected]);
  }

  const diff = Math.abs(userValue - expected);
  let tolerance = rule.tolerance;

  if (rule.relativeTolerance) {
    tolerance = Math.abs(expected) * rule.tolerance;
  }

  // Allow some slack for very small values
  tolerance = Math.max(tolerance, 0.05);

  if (diff <= tolerance) {
    return {
      score: 'E',
      feedback: rule.feedback.E,
      expected,
      userValue
    };
  } else if (diff <= tolerance * 2) {
    return {
      score: 'P',
      feedback: rule.feedback.P,
      expected,
      userValue
    };
  }

  return {
    score: 'I',
    feedback: rule.feedback.I,
    expected,
    userValue
  };
}

/**
 * Grade an exact match answer (choice)
 */
export function gradeExact(answer, rule, context) {
  let expected = rule.expected;
  if (typeof expected === 'string' && context[expected] !== undefined) {
    expected = context[expected];
  }

  // Handle object expected values
  if (typeof expected === 'object' && expected.value !== undefined) {
    expected = expected.value;
  }

  if (answer === expected) {
    return {
      score: 'E',
      feedback: rule.feedback.E
    };
  }

  return {
    score: 'I',
    feedback: rule.feedback.I
  };
}

/**
 * Grade a regex-based answer
 */
export function gradeRegex(answer, rule, context) {
  const matched = [];
  const missing = [];
  const feedback = [];

  for (const item of rule.rubric) {
    let pattern = item.pattern;
    if (item.contextPattern) {
      pattern = item.contextPattern(context);
    }

    if (!pattern) continue;

    const match = answer.match(pattern);

    if (match) {
      matched.push(item.id);
    } else if (item.required) {
      missing.push(item.id);
      feedback.push(item.feedback);
    }
  }

  const scoring = rule.scoring;
  let score = 'I';

  if (missing.length <= scoring.E.maxMissing) {
    score = 'E';
  } else if (missing.length <= scoring.P.maxMissing) {
    score = 'P';
  }

  return {
    score,
    feedback: feedback.join('. ') || 'Good interpretation!',
    matched,
    missing
  };
}

/**
 * Grade a field using appropriate method
 */
export function gradeField(fieldId, answer, context) {
  const rule = rules[fieldId];
  if (!rule) {
    return { score: 'I', feedback: 'Unknown field' };
  }

  switch (rule.type) {
    case 'numeric':
      return gradeNumeric(answer, rule, context);
    case 'exact':
      return gradeExact(answer, rule, context);
    case 'regex':
      return gradeRegex(answer, rule, context);
    default:
      return { score: 'I', feedback: 'Unknown rule type' };
  }
}

export default { getRule, gradeField, gradeNumeric, gradeExact, gradeRegex };
