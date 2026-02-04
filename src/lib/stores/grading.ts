/**
 * Grading Store - Manages grading state and results
 * Handles keyword + AI dual grading flow
 */

import { writable, derived } from 'svelte/store';

export type Score = 'E' | 'P' | 'I' | null;

export interface FieldResult {
	score: Score;
	feedback: string;
	correct: boolean;
	_aiGraded?: boolean;
	_aiScore?: Score;
	_regexScore?: Score;
	_bestOf?: 'ai' | 'regex';
	_provider?: string;
	_error?: string;
}

export interface GradingState {
	isGrading: boolean;
	results: { [fieldId: string]: FieldResult };
	allCorrect: boolean;
	needsTeacherReview: boolean;
	showFeedback: boolean;
	aiPending: boolean;
	error: string | null;
}

const initialState: GradingState = {
	isGrading: false,
	results: {},
	allCorrect: false,
	needsTeacherReview: false,
	showFeedback: false,
	aiPending: false,
	error: null
};

function createGradingStore() {
	const { subscribe, set, update } = writable<GradingState>(initialState);

	return {
		subscribe,

		/**
		 * Start grading process
		 */
		startGrading: () => {
			update(state => ({
				...state,
				isGrading: true,
				error: null,
				showFeedback: false
			}));
		},

		/**
		 * Set keyword (fast) grading results
		 */
		setKeywordResults: (results: { [fieldId: string]: FieldResult }) => {
			const allCorrect = Object.values(results).every(r => r.score === 'E');
			update(state => ({
				...state,
				results,
				allCorrect,
				showFeedback: true,
				aiPending: true // Still waiting for AI
			}));
		},

		/**
		 * Update with AI grading results (takes best of keyword + AI)
		 */
		setAIResults: (aiResults: { [fieldId: string]: FieldResult }) => {
			update(state => {
				const scoreOrder: Record<string, number> = { 'E': 3, 'P': 2, 'I': 1 };
				const newResults = { ...state.results };

				for (const [fieldId, aiResult] of Object.entries(aiResults)) {
					const existing = newResults[fieldId];
					if (!existing) {
						newResults[fieldId] = aiResult;
						continue;
					}

					// Take the better score
					const existingScore = scoreOrder[existing.score || 'I'] || 0;
					const aiScore = scoreOrder[aiResult.score || 'I'] || 0;

					if (aiScore > existingScore) {
						newResults[fieldId] = {
							...aiResult,
							_aiScore: aiResult.score,
							_regexScore: existing.score,
							_bestOf: 'ai'
						};
					} else {
						newResults[fieldId] = {
							...existing,
							_aiScore: aiResult.score,
							_bestOf: 'regex'
						};
					}
				}

				const allCorrect = Object.values(newResults).every(r => r.score === 'E');
				const needsTeacherReview = Object.values(newResults).some(r => r._error && r.score === null);

				return {
					...state,
					results: newResults,
					allCorrect,
					needsTeacherReview,
					aiPending: false,
					isGrading: false
				};
			});
		},

		/**
		 * Set grading error
		 */
		setError: (error: string) => {
			update(state => ({
				...state,
				error,
				isGrading: false,
				aiPending: false
			}));
		},

		/**
		 * Mark grading as complete
		 */
		complete: () => {
			update(state => ({
				...state,
				isGrading: false,
				aiPending: false
			}));
		},

		/**
		 * Clear grading state for new problem
		 */
		clear: () => {
			set(initialState);
		},

		/**
		 * Hide feedback (e.g., when starting new problem)
		 */
		hideFeedback: () => {
			update(state => ({ ...state, showFeedback: false }));
		}
	};
}

export const grading = createGradingStore();

// Derived stores
export const gradingInProgress = derived(grading, ($grading) => $grading.isGrading);
export const hasResults = derived(grading, ($grading) => Object.keys($grading.results).length > 0);
export const overallScore = derived(grading, ($grading) => {
	if (Object.keys($grading.results).length === 0) return null;
	if ($grading.allCorrect) return 'E';

	const scores = Object.values($grading.results).map(r => r.score);
	if (scores.some(s => s === 'P')) return 'P';
	return 'I';
});
