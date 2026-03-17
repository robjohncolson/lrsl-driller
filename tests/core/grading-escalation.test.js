import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GradingEscalation } from '../../platform/core/grading-escalation.ts';

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...tokens) => tokens.forEach((t) => classes.add(t)),
    remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
    contains: (token) => classes.has(token)
  };
}

function createMockElement({ classes = [], textContent = '' } = {}) {
  return {
    classList: createClassList(classes),
    textContent,
    className: ''
  };
}

function createDocumentLike() {
  const elements = {
    'grading-level-indicator': createMockElement({ classes: ['hidden'] }),
    'grading-level-text': createMockElement(),
    'btn-ai-review': createMockElement(),
    'btn-teacher-review': createMockElement(),
    'btn-ai-appeal': createMockElement(),
    'ai-appeal-container': createMockElement()
  };
  return {
    getElementById: (id) => elements[id] || null,
    _elements: elements
  };
}

describe('GradingEscalation', () => {
  let escalation;
  let doc;

  beforeEach(() => {
    doc = createDocumentLike();
    escalation = new GradingEscalation({ documentLike: doc });
  });

  describe('updateIndicator', () => {
    it('should set algorithm indicator text and class', () => {
      escalation.updateIndicator('algorithm');
      expect(doc._elements['grading-level-text'].textContent).toBe('Graded by: Algorithm');
      expect(doc._elements['grading-level-text'].className).toBe('text-gray-600');
      expect(doc._elements['grading-level-indicator'].classList.contains('hidden')).toBe(false);
    });

    it('should set AI indicator text and class', () => {
      escalation.updateIndicator('ai');
      expect(doc._elements['grading-level-text'].textContent).toBe('Graded by: AI');
      expect(doc._elements['grading-level-text'].className).toBe('text-indigo-600 font-medium');
    });

    it('should set teacher indicator text and class', () => {
      escalation.updateIndicator('teacher');
      expect(doc._elements['grading-level-text'].textContent).toBe('Graded by: Teacher');
      expect(doc._elements['grading-level-text'].className).toBe('text-blue-600 font-medium');
    });

    it('should not throw when elements are missing', () => {
      const e = new GradingEscalation({ documentLike: { getElementById: () => null } });
      expect(() => e.updateIndicator('ai')).not.toThrow();
    });
  });

  describe('hideAllButtons', () => {
    it('should hide all escalation buttons and appeal container', () => {
      escalation.hideAllButtons();
      expect(doc._elements['btn-ai-review'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['btn-teacher-review'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['btn-ai-appeal'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['ai-appeal-container'].classList.contains('hidden')).toBe(true);
    });
  });

  describe('showButton', () => {
    it('should show AI review button for ai level', () => {
      escalation.showButton('ai');
      expect(doc._elements['btn-ai-review'].classList.contains('hidden')).toBe(false);
      expect(doc._elements['btn-teacher-review'].classList.contains('hidden')).toBe(true);
    });

    it('should show teacher review button for teacher level', () => {
      escalation.showButton('teacher');
      expect(doc._elements['btn-teacher-review'].classList.contains('hidden')).toBe(false);
      expect(doc._elements['btn-ai-review'].classList.contains('hidden')).toBe(true);
    });

    it('should show AI appeal button for ai-appeal level', () => {
      escalation.showButton('ai-appeal');
      expect(doc._elements['btn-ai-appeal'].classList.contains('hidden')).toBe(false);
      expect(doc._elements['btn-teacher-review'].classList.contains('hidden')).toBe(true);
    });

    it('should hide all first then show the requested button', () => {
      // First show AI review
      escalation.showButton('ai');
      expect(doc._elements['btn-ai-review'].classList.contains('hidden')).toBe(false);
      // Then show teacher - AI review should be hidden
      escalation.showButton('teacher');
      expect(doc._elements['btn-ai-review'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['btn-teacher-review'].classList.contains('hidden')).toBe(false);
    });
  });
});
