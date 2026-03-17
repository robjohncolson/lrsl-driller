import type { DocumentLike, EscalationLevel, GradingLevel } from './types';

/**
 * Grading Escalation System - UI helpers for the Algorithm -> AI -> Teacher flow.
 *
 * Manages the grading level indicator and escalation button visibility.
 * State (currentGradingLevel, lastGradingResults) stays in app.html since
 * it's read/written by the inline grading callback.
 *
 * Extracted from app.html (opportunistic extraction pass).
 */
interface GradingEscalationConfig {
  documentLike?: DocumentLike | Document | null;
}

export class GradingEscalation {
  documentLike: DocumentLike | Document | null;

  constructor(config: GradingEscalationConfig = {}) {
    this.documentLike = config.documentLike || globalThis.document || null;
  }

  getElement(id: string): HTMLElement | null {
    return this.documentLike?.getElementById?.(id) || null;
  }

  updateIndicator(level: GradingLevel): void {
    const indicator = this.getElement('grading-level-indicator');
    const text = this.getElement('grading-level-text');
    if (!text) return;

    if (level === 'algorithm') {
      text.textContent = 'Graded by: Algorithm';
      text.className = 'text-gray-600';
    } else if (level === 'ai') {
      text.textContent = 'Graded by: AI';
      text.className = 'text-indigo-600 font-medium';
    } else if (level === 'teacher') {
      text.textContent = 'Graded by: Teacher';
      text.className = 'text-blue-600 font-medium';
    }

    indicator?.classList.remove('hidden');
  }

  hideAllButtons(): void {
    this.getElement('btn-ai-review')?.classList.add('hidden');
    this.getElement('btn-teacher-review')?.classList.add('hidden');
    this.getElement('btn-ai-appeal')?.classList.add('hidden');
    this.getElement('ai-appeal-container')?.classList.add('hidden');
  }

  showButton(level: EscalationLevel): void {
    this.hideAllButtons();
    if (level === 'ai') {
      this.getElement('btn-ai-review')?.classList.remove('hidden');
    } else if (level === 'teacher') {
      this.getElement('btn-teacher-review')?.classList.remove('hidden');
    } else if (level === 'ai-appeal') {
      this.getElement('btn-ai-appeal')?.classList.remove('hidden');
    }
  }
}
