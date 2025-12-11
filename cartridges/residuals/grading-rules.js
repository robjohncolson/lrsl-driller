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
  // Handle various answer formats
  let userValue;
  if (typeof answer === 'string') {
    // Remove any whitespace and handle negative signs
    userValue = parseFloat(answer.trim().replace(/\s/g, ''));
  } else if (typeof answer === 'number') {
    userValue = answer;
  } else {
    userValue = NaN;
  }

  if (isNaN(userValue)) {
    return {
      score: 'I',
      feedback: 'Please enter a numeric value'
    };
  }

  // Get expected value from context
  let expected = rule.expected;
  if (typeof expected === 'string') {
    const contextValue = context[expected];
    // Handle both direct numbers and object values like { value: 67.89 }
    if (typeof contextValue === 'object' && contextValue !== null && 'value' in contextValue) {
      expected = parseFloat(contextValue.value);
    } else {
      expected = parseFloat(contextValue);
    }
  }

  // Round both to 2 decimal places to avoid floating point issues
  userValue = Math.round(userValue * 100) / 100;
  expected = Math.round(expected * 100) / 100;

  const diff = Math.abs(userValue - expected);
  let tolerance = rule.tolerance || 0.15;

  if (rule.relativeTolerance) {
    // Use relative tolerance but with minimum absolute tolerance
    tolerance = Math.max(Math.abs(expected) * tolerance, 0.1);
  }

  // Minimum tolerance of 0.1 for small numbers
  tolerance = Math.max(tolerance, 0.1);

  console.log(`[Residuals Grading] User: ${userValue}, Expected: ${expected}, Diff: ${diff.toFixed(4)}, Tolerance: ${tolerance.toFixed(4)}`);

  if (diff <= tolerance) {
    return {
      score: 'E',
      feedback: rule.feedback.E,
      expected,
      userValue
    };
  } else if (diff <= tolerance * 2.5) {
    return {
      score: 'P',
      feedback: rule.feedback.P,
      expected,
      userValue
    };
  }

  return {
    score: 'I',
    feedback: `${rule.feedback.I} (Expected: ${expected.toFixed(2)}, Got: ${userValue.toFixed(2)})`,
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
