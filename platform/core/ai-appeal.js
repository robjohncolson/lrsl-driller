/**
 * AI Appeal Handlers — show/cancel/submit appeal form for AI re-evaluation.
 *
 * Extracted from app.html (opportunistic extraction pass).
 */

const SPINNER_SVG = `
  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
  Reviewing Appeal...
`;

const SUBMIT_ICON_SVG = `
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
  </svg>
  Submit Appeal
`;

export class AIAppealHandlers {
  constructor(config = {}) {
    this.documentLike = config.documentLike || globalThis.document || null;
    this.platform = config.platform || null;
    this.getLastGradingResults = config.getLastGradingResults || (() => null);
    this.updateGradingLevelIndicator = config.updateGradingLevelIndicator || (() => {});
    this.updateAIFeedbackPanel = config.updateAIFeedbackPanel || (() => {});
    this.getAIFeedbackPanel = config.getAIFeedbackPanel || (() => null);
    this.soundEngine = config.soundEngine || null;
    this.celebration = config.celebration || null;
    this.showEscalationButton = config.showEscalationButton || (() => {});
    this.hideAllEscalationButtons = config.hideAllEscalationButtons || (() => {});
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  init() {
    // Show appeal input form when Appeal button is clicked
    this.getElement('btn-ai-appeal')?.addEventListener('click', () => {
      this.getElement('btn-ai-appeal')?.classList.add('hidden');
      this.getElement('ai-appeal-container')?.classList.remove('hidden');
      this.getElement('ai-appeal-input')?.focus();
    });

    // Cancel appeal - hide form, show buttons again
    this.getElement('btn-cancel-appeal')?.addEventListener('click', () => {
      this.getElement('ai-appeal-container')?.classList.add('hidden');
      const input = this.getElement('ai-appeal-input');
      if (input) input.value = '';
      this.getElement('btn-ai-appeal')?.classList.remove('hidden');
    });

    // Submit appeal to AI with follow-up question
    this.getElement('btn-submit-appeal')?.addEventListener('click', () => this._submitAppeal());
  }

  async _submitAppeal() {
    const appealInput = this.getElement('ai-appeal-input');
    const appealText = appealInput?.value?.trim();
    if (!appealText) {
      appealInput?.classList.add('border-red-500');
      if (appealInput) appealInput.placeholder = 'Please explain your reasoning...';
      return;
    }

    const submitBtn = this.getElement('btn-submit-appeal');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = SPINNER_SVG;
    }

    try {
      const result = await this.platform?.submitAppeal?.(appealText, this.getLastGradingResults());

      // Update grading level indicator
      this.updateGradingLevelIndicator('ai');
      const gradingText = this.getElement('grading-level-text');
      if (gradingText) gradingText.textContent = 'Graded by: AI (Appeal)';

      // Clear appeal form
      this.getElement('ai-appeal-container')?.classList.add('hidden');
      if (appealInput) appealInput.value = '';

      if (result?.success) {
        this.platform?.inputRenderer?.displayAppealResponse(result);

        // Update AI feedback panel with appeal results
        if (result.fields) {
          const fieldEntries = Object.entries(result.fields);
          for (const [fieldId, fieldResult] of fieldEntries) {
            if (fieldResult && fieldResult.score) {
              const aiResponse = {
                _provider: fieldResult._provider || 'AI',
                _model: fieldResult._model,
                results: { [fieldId]: { score: fieldResult.score, feedback: fieldResult.feedback } }
              };
              this.updateAIFeedbackPanel(this.getAIFeedbackPanel(), aiResponse, null, { isAppeal: true });
              break;
            }
          }
        }

        // If appeal was successful and all correct now, celebrate
        if (result.allCorrect) {
          const state = this.platform?.getState?.();
          const starType = state?.game?.potentialStar || 'gold';
          this.soundEngine?.init?.();
          this.soundEngine?.starSound?.(starType);
          this.celebration?.celebrate?.(starType);

          this.getElement('btn-try-again')?.classList.add('hidden');
          this.getElement('btn-next')?.classList.remove('hidden');
          this.hideAllEscalationButtons();
        } else {
          this.showEscalationButton('teacher');
        }
      } else {
        this.showEscalationButton('teacher');
      }
    } catch (err) {
      console.error('Appeal submission error:', err);
      alert('Failed to submit appeal. You can request teacher review instead.');
      this.showEscalationButton('teacher');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = SUBMIT_ICON_SVG;
      }
    }
  }
}
