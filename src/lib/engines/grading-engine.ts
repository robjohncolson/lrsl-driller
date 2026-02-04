/**
 * Grading Engine Wrapper
 * Wraps the existing GradingEngine class with Svelte store integration
 */

import { grading, type FieldResult } from '$lib/stores';

// Import the original GradingEngine dynamically
let GradingEngineClass: typeof import('../../../platform/core/grading-engine.js').GradingEngine | null = null;

interface GradingRule {
	type: 'numeric' | 'regex' | 'rubric' | 'exact' | 'ai' | 'dual';
	expected?: string | number;
	tolerance?: number;
	required?: Array<{ id?: string; description?: string; patterns: string | string[] }>;
	forbidden?: string[];
	scoring?: { all: string; most: string; few: string };
	promptTemplate?: string;
}

interface GradingContext {
	scenario?: string;
	fieldId?: string;
	cartridgeId?: string;
	[key: string]: unknown;
}

interface GradingEngineInstance {
	gradeAnswer(answer: string, rule: GradingRule, context: GradingContext): Promise<FieldResult>;
	gradeAll(answers: Record<string, string>, rules: Record<string, GradingRule>, context: GradingContext): Promise<{
		fields: Record<string, FieldResult>;
		allCorrect: boolean;
		scores: (string | null)[];
	}>;
	serverUrl: string;
}

let engineInstance: GradingEngineInstance | null = null;

/**
 * Initialize the grading engine
 */
export async function initGradingEngine(serverUrl?: string): Promise<void> {
	if (typeof window === 'undefined') return;

	try {
		const module = await import('../../../platform/core/grading-engine.js');
		GradingEngineClass = module.GradingEngine;

		engineInstance = new GradingEngineClass({
			serverUrl: serverUrl || 'https://lrsl-driller-production.up.railway.app'
		}) as unknown as GradingEngineInstance;
	} catch (err) {
		console.error('Failed to load GradingEngine:', err);
	}
}

/**
 * Get the grading engine instance
 */
export function getGradingEngine(): GradingEngineInstance | null {
	return engineInstance;
}

/**
 * Grade a single answer
 */
export async function gradeAnswer(
	answer: string,
	rule: GradingRule,
	context: GradingContext
): Promise<FieldResult> {
	if (!engineInstance) {
		throw new Error('Grading engine not initialized');
	}

	return engineInstance.gradeAnswer(answer, rule, context);
}

/**
 * Grade all answers with dual grading (keyword + AI)
 * Updates the grading store as results come in
 */
export async function gradeAllWithDual(
	answers: Record<string, string>,
	rules: Record<string, GradingRule>,
	context: GradingContext
): Promise<{ fields: Record<string, FieldResult>; allCorrect: boolean }> {
	if (!engineInstance) {
		grading.setError('Grading engine not initialized');
		throw new Error('Grading engine not initialized');
	}

	grading.startGrading();

	try {
		// First pass: keyword/regex grading (fast)
		const keywordResults: Record<string, FieldResult> = {};

		for (const [fieldId, answer] of Object.entries(answers)) {
			const rule = rules[fieldId];
			if (!rule) continue;

			// For dual grading, run regex first
			if (rule.type === 'dual' || rule.type === 'regex' || rule.type === 'rubric') {
				try {
					const result = await engineInstance.gradeAnswer(answer, { ...rule, type: 'regex' }, {
						...context,
						fieldId
					});
					keywordResults[fieldId] = result;
				} catch (err) {
					keywordResults[fieldId] = {
						score: null,
						feedback: 'Grading error',
						correct: false,
						_error: String(err)
					};
				}
			} else {
				// For other types, grade normally
				try {
					const result = await engineInstance.gradeAnswer(answer, rule, {
						...context,
						fieldId
					});
					keywordResults[fieldId] = result;
				} catch (err) {
					keywordResults[fieldId] = {
						score: null,
						feedback: 'Grading error',
						correct: false,
						_error: String(err)
					};
				}
			}
		}

		// Update store with keyword results
		grading.setKeywordResults(keywordResults);

		// Second pass: AI grading for dual-type fields (slower, in background)
		const aiPromises: Promise<[string, FieldResult]>[] = [];

		for (const [fieldId, answer] of Object.entries(answers)) {
			const rule = rules[fieldId];
			if (!rule || rule.type !== 'dual') continue;

			aiPromises.push(
				engineInstance.gradeAnswer(answer, { ...rule, type: 'ai' }, {
					...context,
					fieldId
				}).then(result => [fieldId, result] as [string, FieldResult]).catch(err => {
					return [fieldId, {
						score: null,
						feedback: 'AI grading unavailable',
						correct: false,
						_error: String(err)
					}] as [string, FieldResult];
				})
			);
		}

		if (aiPromises.length > 0) {
			const aiResults = await Promise.all(aiPromises);
			const aiResultsMap: Record<string, FieldResult> = {};
			for (const [fieldId, result] of aiResults) {
				aiResultsMap[fieldId] = result;
			}
			grading.setAIResults(aiResultsMap);
		} else {
			grading.complete();
		}

		// Calculate final results
		const finalResults: Record<string, FieldResult> = { ...keywordResults };
		const scoreOrder: Record<string, number> = { 'E': 3, 'P': 2, 'I': 1 };

		// Merge AI results, taking best score
		for (const [fieldId] of Object.entries(answers)) {
			const rule = rules[fieldId];
			if (!rule || rule.type !== 'dual') continue;

			// AI results are already merged in the store
		}

		const allCorrect = Object.values(finalResults).every(r => r.score === 'E');

		return { fields: finalResults, allCorrect };

	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		grading.setError(errorMsg);
		throw err;
	}
}

/**
 * Grade all answers (simple, no dual grading)
 */
export async function gradeAll(
	answers: Record<string, string>,
	rules: Record<string, GradingRule>,
	context: GradingContext
): Promise<{ fields: Record<string, FieldResult>; allCorrect: boolean }> {
	if (!engineInstance) {
		throw new Error('Grading engine not initialized');
	}

	const result = await engineInstance.gradeAll(answers, rules, context);
	return {
		fields: result.fields,
		allCorrect: result.allCorrect
	};
}
