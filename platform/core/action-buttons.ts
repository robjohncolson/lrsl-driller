/**
 * Action Buttons — Grade, AI Review, Try Again, Next, Skip, Teacher Review
 * button event wiring for the main answer flow.
 *
 * Extracted from app.html (opportunistic extraction pass).
 */
import type { DocumentLike, PlatformLike, SoundEngineLike, GradingLevel } from './types.ts';

const AI_REVIEW_SPINNER = `
  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
  AI Reviewing...
`;

const AI_REVIEW_ICON = `
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
  </svg>
  Request AI Review
`;

export interface ActionButtonsConfig {
  documentLike?: DocumentLike | null;
  platform?: PlatformLike | null;
  soundEngine?: SoundEngineLike | null;
  setGradingLevel?: (level: GradingLevel) => void;
  updateGradingLevelIndicator?: (level: GradingLevel) => void;
  hideAllEscalationButtons?: () => void;
  hideAIFeedbackPanel?: (panel: unknown) => void;
  getAIFeedbackPanel?: () => unknown;
  updateScenarioDisplay?: () => void;
  submitForTeacherReview?: () => void;
  clearPendingTeacherReview?: () => void;
}

export class ActionButtons {
  documentLike: DocumentLike | null;
  platform: PlatformLike | null;
  soundEngine: SoundEngineLike | null;
  setGradingLevel: (level: GradingLevel) => void;
  updateGradingLevelIndicator: (level: GradingLevel) => void;
  hideAllEscalationButtons: () => void;
  hideAIFeedbackPanel: (panel: unknown) => void;
  getAIFeedbackPanel: () => unknown;
  updateScenarioDisplay: () => void;
  submitForTeacherReview: () => void;
  clearPendingTeacherReview: () => void;

  constructor(config: ActionButtonsConfig = {}) {
    this.documentLike = config.documentLike || globalThis.document || null;
    this.platform = config.platform || null;
    this.soundEngine = config.soundEngine || null;
    this.setGradingLevel = config.setGradingLevel || (() => {});
    this.updateGradingLevelIndicator = config.updateGradingLevelIndicator || (() => {});
    this.hideAllEscalationButtons = config.hideAllEscalationButtons || (() => {});
    this.hideAIFeedbackPanel = config.hideAIFeedbackPanel || (() => {});
    this.getAIFeedbackPanel = config.getAIFeedbackPanel || (() => null);
    this.updateScenarioDisplay = config.updateScenarioDisplay || (() => {});
    this.submitForTeacherReview = config.submitForTeacherReview || (() => {});
    this.clearPendingTeacherReview = config.clearPendingTeacherReview || (() => {});
  }

  getElement(id: string): HTMLElement | null {
    return this.documentLike?.getElementById?.(id) || null;
  }

  _clearTeacherReview(): void {
    this.clearPendingTeacherReview();
    this.getElement('btn-teacher-review')?.classList.add('hidden');
  }

  init(): void {
    this.getElement('btn-grade')?.addEventListener('click', async () => {
      this.soundEngine?.init?.();
      this.setGradingLevel('algorithm');
      this.updateGradingLevelIndicator('algorithm');
      this.hideAllEscalationButtons();
      await this.platform?.grade?.({ useAI: false });
    });

    this.getElement('btn-ai-review')?.addEventListener('click', async () => {
      const btn = this.getElement('btn-ai-review') as HTMLButtonElement | null;
      if (!btn) return;
      btn.disabled = true;
      btn.innerHTML = AI_REVIEW_SPINNER;

      try {
        this.setGradingLevel('ai');
        this.updateGradingLevelIndicator('ai');
        await this.platform?.grade?.({ useAI: true });
      } finally {
        btn.disabled = false;
        btn.innerHTML = AI_REVIEW_ICON;
      }
    });

    this.getElement('btn-try-again')?.addEventListener('click', () => {
      this.getElement('btn-try-again')?.classList.add('hidden');
      this.getElement('btn-grade')?.classList.remove('hidden');
      this.hideAllEscalationButtons();
      this.getElement('grading-level-indicator')?.classList.add('hidden');
      this.hideAIFeedbackPanel(this.getAIFeedbackPanel());

      this.platform?.useRetry?.();
      this.platform?.inputRenderer?.clearAllFeedback();
      this.platform?.inputRenderer?.enable();
      this._clearTeacherReview();
    });

    this.getElement('btn-next')?.addEventListener('click', async () => {
      this.getElement('btn-next')?.classList.add('hidden');
      this.getElement('btn-try-again')?.classList.add('hidden');
      this.getElement('btn-grade')?.classList.remove('hidden');
      this.hideAllEscalationButtons();
      this.getElement('grading-level-indicator')?.classList.add('hidden');
      this.hideAIFeedbackPanel(this.getAIFeedbackPanel());
      this.platform?.inputRenderer?.clearAllFeedback();
      await this.platform?.loadProblem?.();
      this.updateScenarioDisplay();
      this._clearTeacherReview();
    });

    this.getElement('btn-skip')?.addEventListener('click', async () => {
      this.platform?.inputRenderer?.clearAllFeedback();
      this.hideAllEscalationButtons();
      this.getElement('grading-level-indicator')?.classList.add('hidden');
      this.hideAIFeedbackPanel(this.getAIFeedbackPanel());
      await this.platform?.loadProblem?.();
      this.updateScenarioDisplay();
      this._clearTeacherReview();
    });

    this.getElement('btn-teacher-review')?.addEventListener('click', () => {
      this.submitForTeacherReview();
    });
  }
}
