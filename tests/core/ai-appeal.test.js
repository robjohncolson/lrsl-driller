import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AIAppealHandlers } from '../../platform/core/ai-appeal.js';

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...tokens) => tokens.forEach((t) => classes.add(t)),
    remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
    contains: (token) => classes.has(token)
  };
}

function createMockElement({ classes = [], value = '', textContent = '' } = {}) {
  const listeners = {};
  return {
    classList: createClassList(classes),
    value,
    textContent,
    innerHTML: '',
    placeholder: '',
    disabled: false,
    focus: vi.fn(),
    addEventListener: vi.fn((event, fn) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    }),
    _fire(event) {
      listeners[event]?.forEach((fn) => fn());
    }
  };
}

function createDocumentLike() {
  const elements = {
    'btn-ai-appeal': createMockElement(),
    'ai-appeal-container': createMockElement({ classes: ['hidden'] }),
    'ai-appeal-input': createMockElement(),
    'btn-cancel-appeal': createMockElement(),
    'btn-submit-appeal': createMockElement(),
    'grading-level-text': createMockElement(),
    'btn-try-again': createMockElement(),
    'btn-next': createMockElement({ classes: ['hidden'] })
  };
  return {
    getElementById: (id) => elements[id] || null,
    _elements: elements
  };
}

describe('AIAppealHandlers', () => {
  let handlers;
  let doc;
  let mockPlatform;
  let showEscalation;
  let hideEscalation;
  let updateIndicator;
  let updateFeedback;

  beforeEach(() => {
    doc = createDocumentLike();
    mockPlatform = {
      submitAppeal: vi.fn(),
      getState: vi.fn(() => ({ game: { potentialStar: 'gold' } })),
      inputRenderer: { displayAppealResponse: vi.fn() }
    };
    showEscalation = vi.fn();
    hideEscalation = vi.fn();
    updateIndicator = vi.fn();
    updateFeedback = vi.fn();

    handlers = new AIAppealHandlers({
      documentLike: doc,
      platform: mockPlatform,
      getLastGradingResults: () => ({ score: 0.5 }),
      updateGradingLevelIndicator: updateIndicator,
      updateAIFeedbackPanel: updateFeedback,
      getAIFeedbackPanel: () => ({}),
      soundEngine: { init: vi.fn(), starSound: vi.fn() },
      celebration: { celebrate: vi.fn() },
      showEscalationButton: showEscalation,
      hideAllEscalationButtons: hideEscalation
    });
    handlers.init();
  });

  it('should construct without errors', () => {
    expect(handlers).toBeDefined();
  });

  it('should not throw when elements are missing', () => {
    const h = new AIAppealHandlers({ documentLike: { getElementById: () => null } });
    expect(() => h.init()).not.toThrow();
  });

  describe('show appeal form', () => {
    it('should hide appeal button and show container on click', () => {
      doc._elements['btn-ai-appeal']._fire('click');
      expect(doc._elements['btn-ai-appeal'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['ai-appeal-container'].classList.contains('hidden')).toBe(false);
      expect(doc._elements['ai-appeal-input'].focus).toHaveBeenCalled();
    });
  });

  describe('cancel appeal', () => {
    it('should hide container and clear input on cancel', () => {
      doc._elements['ai-appeal-input'].value = 'some text';
      doc._elements['btn-cancel-appeal']._fire('click');
      expect(doc._elements['ai-appeal-container'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['ai-appeal-input'].value).toBe('');
      expect(doc._elements['btn-ai-appeal'].classList.contains('hidden')).toBe(false);
    });
  });

  describe('submit appeal', () => {
    it('should show validation error when input is empty', async () => {
      doc._elements['ai-appeal-input'].value = '';
      await handlers._submitAppeal();
      expect(doc._elements['ai-appeal-input'].classList.contains('border-red-500')).toBe(true);
      expect(mockPlatform.submitAppeal).not.toHaveBeenCalled();
    });

    it('should call platform.submitAppeal with text and grading results', async () => {
      doc._elements['ai-appeal-input'].value = 'I think my answer is correct because...';
      mockPlatform.submitAppeal.mockResolvedValue({ success: true, allCorrect: false });
      await handlers._submitAppeal();
      expect(mockPlatform.submitAppeal).toHaveBeenCalledWith(
        'I think my answer is correct because...',
        { score: 0.5 }
      );
    });

    it('should update grading indicator to AI on success', async () => {
      doc._elements['ai-appeal-input'].value = 'my reasoning';
      mockPlatform.submitAppeal.mockResolvedValue({ success: true, allCorrect: false });
      await handlers._submitAppeal();
      expect(updateIndicator).toHaveBeenCalledWith('ai');
      expect(doc._elements['grading-level-text'].textContent).toBe('Graded by: AI (Appeal)');
    });

    it('should show teacher escalation when appeal not all correct', async () => {
      doc._elements['ai-appeal-input'].value = 'my reasoning';
      mockPlatform.submitAppeal.mockResolvedValue({ success: true, allCorrect: false });
      await handlers._submitAppeal();
      expect(showEscalation).toHaveBeenCalledWith('teacher');
    });

    it('should celebrate when appeal results in all correct', async () => {
      doc._elements['ai-appeal-input'].value = 'my reasoning';
      mockPlatform.submitAppeal.mockResolvedValue({ success: true, allCorrect: true });
      await handlers._submitAppeal();
      expect(hideEscalation).toHaveBeenCalled();
      expect(doc._elements['btn-next'].classList.contains('hidden')).toBe(false);
    });

    it('should show teacher escalation on appeal failure', async () => {
      doc._elements['ai-appeal-input'].value = 'my reasoning';
      mockPlatform.submitAppeal.mockResolvedValue({ success: false });
      await handlers._submitAppeal();
      expect(showEscalation).toHaveBeenCalledWith('teacher');
    });

    it('should handle errors gracefully', async () => {
      doc._elements['ai-appeal-input'].value = 'my reasoning';
      mockPlatform.submitAppeal.mockRejectedValue(new Error('network error'));
      globalThis.alert = vi.fn();
      await handlers._submitAppeal();
      expect(showEscalation).toHaveBeenCalledWith('teacher');
    });

    it('should re-enable submit button after completion', async () => {
      doc._elements['ai-appeal-input'].value = 'my reasoning';
      mockPlatform.submitAppeal.mockResolvedValue({ success: true, allCorrect: false });
      await handlers._submitAppeal();
      expect(doc._elements['btn-submit-appeal'].disabled).toBe(false);
    });

    it('should update AI feedback panel when appeal has field results', async () => {
      doc._elements['ai-appeal-input'].value = 'my reasoning';
      mockPlatform.submitAppeal.mockResolvedValue({
        success: true,
        allCorrect: false,
        fields: {
          field1: { score: 'E', feedback: 'Good', _provider: 'groq' }
        }
      });
      await handlers._submitAppeal();
      expect(updateFeedback).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ _provider: 'groq' }),
        null,
        { isAppeal: true }
      );
    });
  });
});
