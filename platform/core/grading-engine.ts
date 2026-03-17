/**
 * Grading Engine - Flexible grading system
 * Supports numeric, regex, and AI grading strategies
 * Topic-agnostic: cartridge provides the rules
 */

import type { EPI } from './types.js';

// ==================== Local Interfaces ====================

type RuleType = 'numeric' | 'regex' | 'rubric' | 'exact' | 'ai' | 'dual';

interface ScoringThresholds {
  all?: EPI;
  most?: EPI;
  few?: EPI;
}

interface RequiredPattern {
  id?: string;
  description?: string;
  patterns: string | string[] | Record<string, string>;
}

export interface GradingRule {
  type: RuleType;
  expected?: number | string;
  tolerance?: number;
  required?: RequiredPattern[];
  forbidden?: string[];
  scoring?: ScoringThresholds;
  promptTemplate?: string;
}

export interface GradingContext extends Record<string, unknown> {
  fieldId?: string;
  cartridgeId?: string;
  scenario?: unknown;
  sign?: number;
}

export interface GradeResult {
  score: EPI | null;
  correct: boolean | null;
  feedback?: string;
  expected?: number | string;
  userValue?: number;
  diff?: number;
  required?: Record<string, boolean>;
  forbidden?: string[];
  _aiGraded?: boolean;
  _provider?: string;
  _model?: string;
  _error?: string;
  _aiScore?: EPI | null;
  _aiFeedback?: string;
  _regexScore?: EPI;
  _bestOf?: 'ai' | 'regex';
}

interface GradeAllResult {
  fields: Record<string, GradeResult>;
  allCorrect: boolean;
  scores: (EPI | null)[];
}

interface GradingEngineConfig {
  serverUrl?: string;
  defaultTolerance?: number;
}

export class GradingEngine {
  serverUrl: string;
  defaultTolerance: number;

  constructor(config: GradingEngineConfig = {}) {
    this.serverUrl = config.serverUrl || 'https://lrsl-driller-production.up.railway.app';
    this.defaultTolerance = config.defaultTolerance || 0.1;
  }

  /**
   * Grade a single answer using the appropriate strategy
   */
  async gradeAnswer(answer: string, rule: GradingRule, context: GradingContext = {}): Promise<GradeResult> {
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
        throw new Error(`Unknown grading type: ${(rule as GradingRule).type}`);
    }
  }

  /**
   * Grade multiple answers (for multi-field inputs)
   */
  async gradeAll(
    answers: Record<string, string>,
    rules: Record<string, GradingRule>,
    context: GradingContext = {}
  ): Promise<GradeAllResult> {
    const results: Record<string, GradeResult> = {};
    const promises: Promise<{ fieldId: string; result: GradeResult }>[] = [];

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
    const allCorrect = scores.every(s => s === 'E' || s === true as unknown);

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
  gradeNumeric(answer: string, rule: GradingRule, context: GradingContext): GradeResult {
    const userValue = parseFloat(answer);

    if (isNaN(userValue)) {
      return {
        score: 'I',
        correct: false,
        feedback: 'Please enter a valid number.'
      };
    }

    // Calculate expected value (may be a formula with context)
    let expected: number | string | undefined = rule.expected;
    if (typeof expected === 'string') {
      expected = this.evaluateFormula(expected, context);
    }

    const tolerance = rule.tolerance ?? this.defaultTolerance;
    const diff = Math.abs(userValue - (expected as number));
    const correct = diff <= tolerance;

    return {
      score: correct ? 'E' : 'I',
      correct,
      expected: expected as number,
      userValue,
      diff,
      feedback: correct
        ? 'Correct!'
        : `Expected ${(expected as number).toFixed(2)}, you entered ${userValue.toFixed(2)}.`
    };
  }

  /**
   * Exact match grading
   */
  gradeExact(answer: string, rule: GradingRule, context: GradingContext): GradeResult {
    let expected: string | number | undefined = rule.expected;
    if (typeof expected === 'string' && expected.startsWith('{{')) {
      expected = this.interpolate(expected, context);
    }

    const correct = answer.toString().toLowerCase().trim() ===
                    String(expected).toLowerCase().trim();

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
  gradeRegex(answer: string, rule: GradingRule, context: GradingContext): GradeResult {
    const text = answer.toString().toLowerCase();
    const results: {
      required: Record<string, boolean>;
      forbidden: string[];
      score: EPI;
      feedback?: string;
      correct?: boolean;
    } = {
      required: {},
      forbidden: [],
      score: 'E'
    };

    // Check required patterns
    let matchedCount = 0;
    const required = rule.required || [];

    for (const req of required) {
      const patterns: (string | Record<string, string>)[] =
        Array.isArray(req.patterns) ? req.patterns : [req.patterns];
      let matched = false;

      for (const rawPattern of patterns) {
        // Interpolate context variables
        let pattern: string | Record<string, string> =
          typeof rawPattern === 'string'
            ? this.interpolate(rawPattern, context)
            : rawPattern;

        // Handle conditional patterns based on context
        if (typeof pattern === 'object') {
          const key = (context.sign as number) > 0 ? 'positive' : 'negative';
          pattern = (pattern as Record<string, string>)[key] || Object.values(pattern)[0];
        }

        const regex = new RegExp(pattern as string, 'i');
        if (regex.test(text)) {
          matched = true;
          break;
        }
      }

      results.required[req.id || req.description || ''] = matched;
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
    } else if (required.length === 0) {
      // No required patterns and no forbidden hits = essentially correct
      results.score = 'E';
      results.feedback = 'Correct!';
    } else {
      const scoring = rule.scoring || { all: 'E' as EPI, most: 'P' as EPI, few: 'I' as EPI };
      const ratio = matchedCount / required.length;

      if (ratio === 1) {
        results.score = 'E';
        results.feedback = 'Excellent! All key elements included.';
      } else if (ratio >= 0.5) {
        results.score = 'P';
        const missing = Object.entries(results.required)
          .filter(([_k, v]) => !v)
          .map(([k]) => k);
        results.feedback = `Good, but missing: ${missing.join(', ')}.`;
      } else {
        results.score = 'I';
        results.feedback = 'Missing most required elements.';
      }
    }

    results.correct = results.score === 'E';
    return results as GradeResult;
  }

  /**
   * AI grading via server
   */
  async gradeWithAI(answer: string, rule: GradingRule, context: GradingContext): Promise<GradeResult> {
    try {
      // Build prompt from template (for logging/debugging)
      const prompt = this.buildAIPrompt(rule.promptTemplate || '', answer, context);

      const response = await fetch(`${this.serverUrl}/api/ai/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: context.scenario,
          answers: { [context.fieldId as string]: answer },
          // v4.8.1: Send both prompt and template/cartridge info for server compatibility
          prompt,
          aiPromptTemplate: rule.promptTemplate,
          cartridgeId: context.cartridgeId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI grading failed');
      }

      const fieldId = context.fieldId as string;
      const fieldResult = result[fieldId] as { score?: EPI; feedback?: string } | undefined;

      return {
        score: result.score || fieldResult?.score || 'I',
        feedback: result.feedback || fieldResult?.feedback || '',
        correct: (result.score || fieldResult?.score) === 'E',
        _aiGraded: true,
        _provider: result._provider || result.provider,
        _model: result._model || result.model
      };
    } catch (err) {
      console.error('AI grading error:', err);
      return {
        score: null,
        feedback: 'AI grading unavailable.',
        correct: null,
        _error: (err as Error).message
      };
    }
  }

  /**
   * Dual grading: regex + AI, take best score
   */
  async gradeDual(answer: string, rule: GradingRule, context: GradingContext): Promise<GradeResult> {
    // Run regex grading
    const regexResult = this.gradeRegex(answer, rule, context);

    // Run AI grading in parallel
    let aiResult: GradeResult | null = null;
    try {
      aiResult = await this.gradeWithAI(answer, rule, context);
    } catch (err) {
      console.warn('AI grading failed, using regex only:', err);
    }

    // Take the better score
    const scoreOrder: Record<string, number> = { 'E': 3, 'P': 2, 'I': 1 };

    if (aiResult && aiResult.score && !aiResult._error) {
      const regexScore = scoreOrder[regexResult.score as string] || 0;
      const aiScore = scoreOrder[aiResult.score] || 0;

      if (aiScore > regexScore) {
        return {
          ...aiResult,
          _aiScore: aiResult.score,
          _aiFeedback: aiResult.feedback || '',
          _regexScore: regexResult.score as EPI,
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
  evaluateFormula(formula: string, context: GradingContext): number {
    // Replace context variables
    let expr = formula;
    for (const [key, value] of Object.entries(context)) {
      expr = expr.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Safely evaluate (basic math only)
    try {
      // Only allow: numbers, +, -, *, /, (, ), .
      if (!/^[\d\s+\-*/().]+$/.test(expr)) {
        throw new Error('Invalid formula');
      }
      return Function(`"use strict"; return (${expr})`)() as number;
    } catch (e) {
      console.error('Formula evaluation failed:', formula, e);
      return NaN;
    }
  }

  /**
   * Interpolate {{variables}} in a string
   */
  interpolate(template: string, context: GradingContext): string;
  interpolate(template: unknown, context: GradingContext): unknown;
  interpolate(template: unknown, context: GradingContext): unknown {
    if (typeof template !== 'string') return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }

  /**
   * Build AI prompt from template
   */
  buildAIPrompt(template: string, answer: string, context: GradingContext): string {
    let prompt = template || '';
    prompt = this.interpolate(prompt, context);
    prompt = prompt.replace('{{answer}}', answer);
    return prompt;
  }
}

export default GradingEngine;
