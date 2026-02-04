/**
 * Problem Store - Current problem state
 * Manages the current scenario, context, and answers
 */

import { writable, derived } from 'svelte/store';

export interface InputField {
	id: string;
	type: 'textarea' | 'number' | 'choice' | 'dropdown' | 'expression';
	label?: string;
	placeholder?: string;
	options?: string[];
	rows?: number;
}

export interface Problem {
	scenario: string;
	context: Record<string, unknown>;
	inputFields: InputField[];
	hint?: string;
	animation?: string;
}

export interface ProblemState {
	problem: Problem | null;
	modeId: string | null;
	modeName: string | null;
	answers: { [fieldId: string]: string };
	isLoading: boolean;
	error: string | null;
}

const initialState: ProblemState = {
	problem: null,
	modeId: null,
	modeName: null,
	answers: {},
	isLoading: false,
	error: null
};

function createProblemStore() {
	const { subscribe, set, update } = writable<ProblemState>(initialState);

	return {
		subscribe,

		/**
		 * Set a new problem
		 */
		setProblem: (problem: Problem, modeId: string, modeName: string) => {
			update(state => ({
				...state,
				problem,
				modeId,
				modeName,
				answers: {},
				isLoading: false,
				error: null
			}));
		},

		/**
		 * Set loading state
		 */
		setLoading: (loading: boolean) => {
			update(state => ({ ...state, isLoading: loading }));
		},

		/**
		 * Set error state
		 */
		setError: (error: string | null) => {
			update(state => ({ ...state, error, isLoading: false }));
		},

		/**
		 * Update an answer for a field
		 */
		setAnswer: (fieldId: string, value: string) => {
			update(state => ({
				...state,
				answers: { ...state.answers, [fieldId]: value }
			}));
		},

		/**
		 * Clear all answers
		 */
		clearAnswers: () => {
			update(state => ({ ...state, answers: {} }));
		},

		/**
		 * Clear the current problem
		 */
		clear: () => {
			set(initialState);
		},

		/**
		 * Get all answers
		 */
		getAnswers: () => {
			let currentAnswers: { [fieldId: string]: string } = {};
			subscribe(state => { currentAnswers = state.answers; })();
			return currentAnswers;
		}
	};
}

export const problem = createProblemStore();

// Derived stores
export const currentScenario = derived(problem, ($problem) => $problem.problem?.scenario || '');
export const hasAnswers = derived(problem, ($problem) => {
	return Object.values($problem.answers).some(a => a && a.trim().length > 0);
});
export const isComplete = derived(problem, ($problem) => {
	if (!$problem.problem) return false;
	const requiredFields = $problem.problem.inputFields.filter(f => f.type !== 'expression');
	return requiredFields.every(field => {
		const answer = $problem.answers[field.id];
		return answer && answer.trim().length > 0;
	});
});
