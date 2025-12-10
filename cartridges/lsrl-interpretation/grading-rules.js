/**
 * LSRL Interpretation - Grading Rules
 * Regex-based rubrics for slope, intercept, and correlation interpretations
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
  slope: {
    type: 'regex',
    rubric: [
      {
        id: 'prediction',
        required: true,
        pattern: /\b(predict|predicted|expect|expected|estimate|estimated|on average|average)\b/i,
        feedback: 'Use prediction language (e.g., "predicted", "on average")'
      },
      {
        id: 'direction',
        required: true,
        pattern: /\b(increase|decrease|goes up|goes down|rise|fall|higher|lower)\b/i,
        feedback: 'State the direction of change (increases/decreases)'
      },
      {
        id: 'slopeValue',
        required: true,
        pattern: null, // Dynamically generated from context
        feedback: 'Include the slope value',
        contextPattern: (ctx) => {
          const val = Math.abs(parseFloat(ctx.slope));
          const tolerance = val * 0.1;
          const min = (val - tolerance).toFixed(2);
          const max = (val + tolerance).toFixed(2);
          return new RegExp(`\\b(${escapeRegex(ctx.slopeAbs)}|\\d+\\.?\\d*)\\b`);
        },
        validate: (match, ctx) => {
          if (!match) return false;
          const found = parseFloat(match[0]);
          const expected = Math.abs(parseFloat(ctx.slope));
          return Math.abs(found - expected) <= expected * 0.15;
        }
      },
      {
        id: 'xVariable',
        required: true,
        pattern: null,
        feedback: 'Mention the x-variable',
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.xVar), 'i')
      },
      {
        id: 'yVariable',
        required: true,
        pattern: null,
        feedback: 'Mention the y-variable',
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.yVar), 'i')
      },
      {
        id: 'forEveryOne',
        required: true,
        pattern: /\b(for (every|each)|per|for (a|one)|1|one)\b.*\b(increase|unit|more)\b/i,
        feedback: 'Include "for every 1 [unit]" or "for each [unit]"'
      }
    ],
    scoring: {
      E: { minRequired: 6, maxMissing: 0 },
      P: { minRequired: 4, maxMissing: 2 },
      I: { minRequired: 0, maxMissing: 6 }
    }
  },

  intercept: {
    type: 'regex',
    rubric: [
      {
        id: 'xIsZero',
        required: true,
        pattern: /\b(when|if|at)\b.*\b(0|zero)\b/i,
        feedback: 'Reference when x equals 0'
      },
      {
        id: 'prediction',
        required: true,
        pattern: /\b(predict|predicted|expect|expected|estimate|estimated)\b/i,
        feedback: 'Use prediction language'
      },
      {
        id: 'interceptValue',
        required: false,
        pattern: null,
        contextPattern: (ctx) => {
          const val = parseFloat(ctx.intercept);
          return new RegExp(`\\b${escapeRegex(Math.abs(val).toFixed(1))}|${escapeRegex(Math.abs(val).toFixed(2))}\\b`);
        },
        feedback: 'Include the y-intercept value'
      },
      {
        id: 'yVariable',
        required: true,
        pattern: null,
        feedback: 'Mention what is being predicted (y-variable)',
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.yVar), 'i')
      },
      {
        id: 'meaningless',
        required: false,
        pattern: /\b(no meaning|not meaningful|doesn't make sense|does not make sense|meaningless|no practical|not realistic|unrealistic|outside|beyond|extrapolat)\b/i,
        feedback: 'Identify if the y-intercept has no meaningful interpretation',
        contextCondition: (ctx) => !ctx.interceptMeaningful
      }
    ],
    scoring: {
      E: { minRequired: 4, maxMissing: 0 },
      P: { minRequired: 2, maxMissing: 2 },
      I: { minRequired: 0, maxMissing: 4 }
    },
    // Special: if intercept is meaningless, check for that instead
    specialCases: {
      meaninglessIntercept: {
        condition: (ctx) => !ctx.interceptMeaningful,
        requiredPatterns: ['meaningless'],
        feedback: 'The y-intercept has no meaningful interpretation in this context'
      }
    }
  },

  correlation: {
    type: 'regex',
    rubric: [
      {
        id: 'linear',
        required: true,
        pattern: /\b(linear|line)\b/i,
        feedback: 'Describe the relationship as "linear"'
      },
      {
        id: 'strength',
        required: true,
        pattern: /\b(strong|moderate|weak)\b/i,
        feedback: 'Describe the strength (weak, moderate, or strong)',
        validate: (match, ctx) => {
          if (!match) return false;
          const found = match[0].toLowerCase();
          return found === ctx.strength.toLowerCase();
        }
      },
      {
        id: 'direction',
        required: true,
        pattern: /\b(positive|negative)\b/i,
        feedback: 'State the direction (positive or negative)',
        validate: (match, ctx) => {
          if (!match) return false;
          const found = match[0].toLowerCase();
          return found === ctx.rDirection.toLowerCase();
        }
      },
      {
        id: 'xVariable',
        required: true,
        pattern: null,
        feedback: 'Mention the x-variable',
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.xVar), 'i')
      },
      {
        id: 'yVariable',
        required: true,
        pattern: null,
        feedback: 'Mention the y-variable',
        contextPattern: (ctx) => new RegExp(escapeRegex(ctx.yVar), 'i')
      }
    ],
    scoring: {
      E: { minRequired: 5, maxMissing: 0 },
      P: { minRequired: 3, maxMissing: 2 },
      I: { minRequired: 0, maxMissing: 5 }
    }
  },

  // Paragraph mode - grades all three in one response
  paragraph: {
    type: 'composite',
    components: ['slope', 'intercept', 'correlation'],
    scoring: {
      E: { allE: true },
      P: { minE: 1 },
      I: { minE: 0 }
    }
  }
};

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Grade a single field using its rubric
 */
export function gradeField(fieldId, answer, context) {
  const rule = rules[fieldId];
  if (!rule) {
    return { score: 'I', feedback: 'Unknown field', matched: [], missing: [] };
  }

  if (rule.type === 'composite') {
    return gradeComposite(fieldId, answer, context);
  }

  const matched = [];
  const missing = [];
  const feedback = [];

  for (const item of rule.rubric) {
    // Skip items with context conditions that don't apply
    if (item.contextCondition && !item.contextCondition(context)) {
      continue;
    }

    // Get pattern (static or context-based)
    let pattern = item.pattern;
    if (item.contextPattern) {
      pattern = item.contextPattern(context);
    }

    if (!pattern) continue;

    // Test the pattern
    const match = answer.match(pattern);

    // Validate match if validator exists
    let isValid = !!match;
    if (match && item.validate) {
      isValid = item.validate(match, context);
    }

    if (isValid) {
      matched.push(item.id);
    } else if (item.required) {
      missing.push(item.id);
      feedback.push(item.feedback);
    }
  }

  // Handle special cases
  if (rule.specialCases) {
    for (const [, special] of Object.entries(rule.specialCases)) {
      if (special.condition(context)) {
        const hasRequired = special.requiredPatterns.every(p => matched.includes(p));
        if (hasRequired) {
          // Override score to E if special case is correctly identified
          return {
            score: 'E',
            feedback: special.feedback,
            matched,
            missing: []
          };
        }
      }
    }
  }

  // Determine score based on matched/missing counts
  const scoring = rule.scoring;
  let score = 'I';

  if (missing.length <= scoring.E.maxMissing) {
    score = 'E';
  } else if (missing.length <= scoring.P.maxMissing) {
    score = 'P';
  }

  return {
    score,
    feedback: feedback.join('. '),
    matched,
    missing
  };
}

/**
 * Grade a composite field (paragraph mode)
 */
function gradeComposite(fieldId, answer, context) {
  const rule = rules[fieldId];
  const componentResults = {};
  let eCount = 0;

  for (const component of rule.components) {
    const result = gradeField(component, answer, context);
    componentResults[component] = result;
    if (result.score === 'E') eCount++;
  }

  let score;
  if (eCount === rule.components.length) {
    score = 'E';
  } else if (eCount >= 1) {
    score = 'P';
  } else {
    score = 'I';
  }

  const feedback = rule.components
    .filter(c => componentResults[c].score !== 'E')
    .map(c => `${c}: ${componentResults[c].feedback}`)
    .join(' | ');

  return {
    score,
    feedback: feedback || 'All components correct!',
    components: componentResults
  };
}

export default { getRule, gradeField };
