/**
 * Grading Engine - Flexible grading system
 * Supports numeric, regex, and AI grading strategies
 * Topic-agnostic: cartridge provides the rules
 */

export class GradingEngine {
  constructor(config = {}) {
    this.serverUrl = config.serverUrl || 'https://lrsl-driller-production.up.railway.app';
    this.defaultTolerance = config.defaultTolerance || 0.1;
  }

  /**
   * Grade a single answer using the appropriate strategy
   */
  async gradeAnswer(answer, rule, context = {}) {
    switch (rule.type) {
      case 'numeric':
        return this.gradeNumeric(answer, rule, context);
      case 'regex':
      case 'rubric':
        return this.gradeRegex(answer, rule, context);
      case 'exact':
        return this.gradeExact(answer, rule, context);
      case 'ai':
        return this.gradeWithAI(answer, rule, context);
      case 'dual':
        return this.gradeDual(answer, rule, context);
      default:
        throw new Error(`Unknown grading type: ${rule.type}`);
    }
  }

  /**
   * Grade multiple answers (for multi-field inputs)
   */
  async gradeAll(answers, rules, context = {}) {
    const results = {};
    const promises = [];

    for (const [fieldId, answer] of Object.entries(answers)) {
      const rule = rules[fieldId];
      if (!rule) continue;

      promises.push(
        this.gradeAnswer(answer, rule, context)
          .then(result => ({ fieldId, result }))
      );
    }

    const resolved = await Promise.all(promises);
    for (const { fieldId, result } of resolved) {
      results[fieldId] = result;
    }

    // Calculate composite score if needed
    const scores = Object.values(results).map(r => r.score);
    const allCorrect = scores.every(s => s === 'E' || s === true);

    return {
      fields: results,
      allCorrect,
      scores
    };
  }

  // ============== GRADING STRATEGIES ==============

  /**
   * Numeric grading with tolerance
   */
  gradeNumeric(answer, rule, context) {
    const userValue = parseFloat(answer);

    if (isNaN(userValue)) {
      return {
        score: 'I',
        correct: false,
        feedback: 'Please enter a valid number.'
      };
    }

    // Calculate expected value (may be a formula with context)
    let expected = rule.expected;
    if (typeof expected === 'string') {
      expected = this.evaluateFormula(expected, context);
    }

    const tolerance = rule.tolerance ?? this.defaultTolerance;
    const diff = Math.abs(userValue - expected);
    const correct = diff <= tolerance;

    return {
      score: correct ? 'E' : 'I',
      correct,
      expected,
      userValue,
      diff,
      feedback: correct
        ? 'Correct!'
        : `Expected ${expected.toFixed(2)}, you entered ${userValue.toFixed(2)}.`
    };
  }

  /**
   * Exact match grading
   */
  gradeExact(answer, rule, context) {
    let expected = rule.expected;
    if (typeof expected === 'string' && expected.startsWith('{{')) {
      expected = this.interpolate(expected, context);
    }

    const correct = answer.toString().toLowerCase().trim() ===
                    expected.toString().toLowerCase().trim();

    return {
      score: correct ? 'E' : 'I',
      correct,
      feedback: correct ? 'Correct!' : `Expected "${expected}".`
    };
  }

  /**
   * Regex/rubric grading
   * Checks for required patterns and forbidden words
   */
  gradeRegex(answer, rule, context) {
    const text = answer.toString().toLowerCase();
    const results = {
      required: {},
      forbidden: [],
      score: 'E'
    };

    // Check required patterns
    let matchedCount = 0;
    const required = rule.required || [];

    for (const req of required) {
      const patterns = Array.isArray(req.patterns) ? req.patterns : [req.patterns];
      let matched = false;

      for (let pattern of patterns) {
        // Interpolate context variables
        pattern = this.interpolate(pattern, context);

        // Handle conditional patterns based on context
        if (typeof pattern === 'object') {
          const key = context.sign > 0 ? 'positive' : 'negative';
          pattern = pattern[key] || Object.values(pattern)[0];
        }

        const regex = new RegExp(pattern, 'i');
        if (regex.test(text)) {
          matched = true;
          break;
        }
      }

      results.required[req.id || req.description] = matched;
      if (matched) matchedCount++;
    }

    // Check forbidden words
    const forbidden = rule.forbidden || [];
    for (const word of forbidden) {
      if (text.includes(word.toLowerCase())) {
        results.forbidden.push(word);
      }
    }

    // Determine score
    if (results.forbidden.length > 0) {
      results.score = 'I';
      results.feedback = `Avoid using "${results.forbidden[0]}" - it implies causation.`;
    } else {
      const scoring = rule.scoring || { all: 'E', most: 'P', few: 'I' };
      const ratio = matchedCount / required.length;

      if (ratio === 1) {
        results.score = 'E';
        results.feedback = 'Excellent! All key elements included.';
      } else if (ratio >= 0.5) {
        results.score = 'P';
        const missing = Object.entries(results.required)
          .filter(([k, v]) => !v)
          .map(([k]) => k);
        results.feedback = `Good, but missing: ${missing.join(', ')}.`;
      } else {
        results.score = 'I';
        results.feedback = 'Missing most required elements.';
      }
    }

    results.correct = results.score === 'E';
    return results;
  }

  /**
   * AI grading via server
   */
  async gradeWithAI(answer, rule, context) {
    try {
      // Build prompt from template
      const prompt = this.buildAIPrompt(rule.promptTemplate, answer, context);

      const response = await fetch(`${this.serverUrl}/api/ai/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: context.scenario,
          answers: { [context.fieldId]: answer },
          prompt
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI grading failed');
      }

      return {
        score: result.score || result[context.fieldId]?.score || 'I',
        feedback: result.feedback || result[context.fieldId]?.feedback || '',
        correct: (result.score || result[context.fieldId]?.score) === 'E',
        _aiGraded: true,
        _provider: result._provider
      };
    } catch (err) {
      console.error('AI grading error:', err);
      return {
        score: null,
        feedback: 'AI grading unavailable.',
        correct: null,
        _error: err.message
      };
    }
  }

  /**
   * Dual grading: regex + AI, take best score
   */
  async gradeDual(answer, rule, context) {
    // Run regex grading
    const regexResult = this.gradeRegex(answer, rule, context);

    // Run AI grading in parallel
    let aiResult = null;
    try {
      aiResult = await this.gradeWithAI(answer, rule, context);
    } catch (err) {
      console.warn('AI grading failed, using regex only:', err);
    }

    // Take the better score
    const scoreOrder = { 'E': 3, 'P': 2, 'I': 1 };

    if (aiResult && aiResult.score && !aiResult._error) {
      const regexScore = scoreOrder[regexResult.score] || 0;
      const aiScore = scoreOrder[aiResult.score] || 0;

      if (aiScore > regexScore) {
        return {
          ...aiResult,
          _regexScore: regexResult.score,
          _bestOf: 'ai'
        };
      }
    }

    return {
      ...regexResult,
      _aiScore: aiResult?.score,
      _bestOf: 'regex'
    };
  }

  // ============== HELPERS ==============

  /**
   * Evaluate a formula string with context values
   */
  evaluateFormula(formula, context) {
    // Replace context variables
    let expr = formula;
    for (const [key, value] of Object.entries(context)) {
      expr = expr.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Safely evaluate (basic math only)
    try {
      // Only allow: numbers, +, -, *, /, (, ), .
      if (!/^[\d\s+\-*/().]+$/.test(expr)) {
        throw new Error('Invalid formula');
      }
      return Function(`"use strict"; return (${expr})`)();
    } catch (e) {
      console.error('Formula evaluation failed:', formula, e);
      return NaN;
    }
  }

  /**
   * Interpolate {{variables}} in a string
   */
  interpolate(template, context) {
    if (typeof template !== 'string') return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }

  /**
   * Build AI prompt from template
   */
  buildAIPrompt(template, answer, context) {
    let prompt = template || '';
    prompt = this.interpolate(prompt, context);
    prompt = prompt.replace('{{answer}}', answer);
    return prompt;
  }
}

export default GradingEngine;
