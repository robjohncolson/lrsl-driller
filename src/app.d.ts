// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// KaTeX global
	interface Window {
		renderMathInElement: (element: HTMLElement, options?: {
			delimiters?: Array<{ left: string; right: string; display: boolean }>;
		}) => void;
	}
}

export {};
