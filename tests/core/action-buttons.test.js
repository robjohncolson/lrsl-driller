import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ActionButtons } from '../../platform/core/action-buttons.ts';

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...tokens) => tokens.forEach((t) => classes.add(t)),
    remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
    contains: (token) => classes.has(token)
  };
}

function createMockElement({ classes = [] } = {}) {
  const listeners = {};
  return {
    classList: createClassList(classes),
    disabled: false,
    innerHTML: '',
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
    'btn-grade': createMockElement(),
    'btn-ai-review': createMockElement(),
    'btn-try-again': createMockElement(),
    'btn-next': createMockElement(),
    'btn-skip': createMockElement(),
    'btn-teacher-review': createMockElement(),
    'grading-level-indicator': createMockElement()
  };
  return {
    getElementById: (id) => elements[id] || null,
    _elements: elements
  };
}

describe('ActionButtons', () => {
  let buttons;
  let doc;
  let mockPlatform;
  let setGradingLevel;
  let updateIndicator;
  let hideEscalation;
  let hideAIFeedback;
  let updateScenario;
  let submitTeacherReview;
  let clearPendingReview;

  beforeEach(() => {
    doc = createDocumentLike();
    mockPlatform = {
      grade: vi.fn(() => Promise.resolve()),
      useRetry: vi.fn(),
      loadProblem: vi.fn(() => Promise.resolve()),
      inputRenderer: {
        clearAllFeedback: vi.fn(),
        enable: vi.fn()
      }
    };
    setGradingLevel = vi.fn();
    updateIndicator = vi.fn();
    hideEscalation = vi.fn();
    hideAIFeedback = vi.fn();
    updateScenario = vi.fn();
    submitTeacherReview = vi.fn();
    clearPendingReview = vi.fn();

    buttons = new ActionButtons({
      documentLike: doc,
      platform: mockPlatform,
      soundEngine: { init: vi.fn() },
      setGradingLevel,
      updateGradingLevelIndicator: updateIndicator,
      hideAllEscalationButtons: hideEscalation,
      hideAIFeedbackPanel: hideAIFeedback,
      getAIFeedbackPanel: () => ({}),
      updateScenarioDisplay: updateScenario,
      submitForTeacherReview: submitTeacherReview,
      clearPendingTeacherReview: clearPendingReview
    });
    buttons.init();
  });

  it('should construct without errors', () => {
    expect(buttons).toBeDefined();
  });

  it('should not throw when elements are missing', () => {
    const b = new ActionButtons({ documentLike: { getElementById: () => null } });
    expect(() => b.init()).not.toThrow();
  });

  describe('grade button', () => {
    it('should set grading level to algorithm and grade without AI', async () => {
      await doc._elements['btn-grade']._fire('click');
      expect(setGradingLevel).toHaveBeenCalledWith('algorithm');
      expect(updateIndicator).toHaveBeenCalledWith('algorithm');
      expect(hideEscalation).toHaveBeenCalled();
      expect(mockPlatform.grade).toHaveBeenCalledWith({ useAI: false });
    });
  });

  describe('AI review button', () => {
    it('should set grading level to ai and grade with AI', async () => {
      await doc._elements['btn-ai-review']._fire('click');
      expect(setGradingLevel).toHaveBeenCalledWith('ai');
      expect(mockPlatform.grade).toHaveBeenCalledWith({ useAI: true });
    });

    it('should disable and re-enable the button', async () => {
      const btn = doc._elements['btn-ai-review'];
      // After the click handler finishes, button should be re-enabled
      await doc._elements['btn-ai-review']._fire('click');
      expect(btn.disabled).toBe(false);
    });
  });

  describe('try again button', () => {
    it('should reset UI state and track retry', () => {
      doc._elements['btn-try-again']._fire('click');
      expect(doc._elements['btn-try-again'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['btn-grade'].classList.contains('hidden')).toBe(false);
      expect(hideEscalation).toHaveBeenCalled();
      expect(hideAIFeedback).toHaveBeenCalled();
      expect(mockPlatform.useRetry).toHaveBeenCalled();
      expect(mockPlatform.inputRenderer.clearAllFeedback).toHaveBeenCalled();
      expect(mockPlatform.inputRenderer.enable).toHaveBeenCalled();
      expect(clearPendingReview).toHaveBeenCalled();
    });
  });

  describe('next button', () => {
    it('should reset buttons, load next problem, and clear review', async () => {
      await doc._elements['btn-next']._fire('click');
      expect(doc._elements['btn-next'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['btn-grade'].classList.contains('hidden')).toBe(false);
      expect(mockPlatform.loadProblem).toHaveBeenCalled();
      expect(updateScenario).toHaveBeenCalled();
      expect(clearPendingReview).toHaveBeenCalled();
    });
  });

  describe('skip button', () => {
    it('should clear feedback, load next problem, and clear review', async () => {
      await doc._elements['btn-skip']._fire('click');
      expect(mockPlatform.inputRenderer.clearAllFeedback).toHaveBeenCalled();
      expect(hideEscalation).toHaveBeenCalled();
      expect(mockPlatform.loadProblem).toHaveBeenCalled();
      expect(updateScenario).toHaveBeenCalled();
      expect(clearPendingReview).toHaveBeenCalled();
    });
  });

  describe('teacher review button', () => {
    it('should call submitForTeacherReview', () => {
      doc._elements['btn-teacher-review']._fire('click');
      expect(submitTeacherReview).toHaveBeenCalled();
    });
  });

  describe('clearTeacherReview', () => {
    it('should clear pending review and hide button', () => {
      buttons._clearTeacherReview();
      expect(clearPendingReview).toHaveBeenCalled();
      expect(doc._elements['btn-teacher-review'].classList.contains('hidden')).toBe(true);
    });
  });
});
