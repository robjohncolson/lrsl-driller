import { describe, expect, it, vi, beforeEach } from 'vitest';
import { initShareModal } from '../../platform/core/share-modal.js';

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...tokens) => tokens.forEach((t) => classes.add(t)),
    remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
    contains: (token) => classes.has(token)
  };
}

function createMockElement({ classes = [], id = '' } = {}) {
  const listeners = {};
  return {
    id,
    classList: createClassList(classes),
    addEventListener: vi.fn((event, fn) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    }),
    _fire(event, data) {
      listeners[event]?.forEach((fn) => fn(data));
    }
  };
}

describe('initShareModal', () => {
  let doc;
  let updateContents;

  beforeEach(() => {
    const elements = {
      'share-btn': createMockElement(),
      'share-modal': createMockElement({ classes: ['hidden'], id: 'share-modal' }),
      'share-modal-close': createMockElement()
    };
    doc = {
      getElementById: (id) => elements[id] || null,
      _elements: elements
    };
    updateContents = vi.fn();
    initShareModal({ documentLike: doc, updateShareModalContents: updateContents });
  });

  it('should not throw with missing elements', () => {
    expect(() => initShareModal({ documentLike: { getElementById: () => null } })).not.toThrow();
  });

  it('should open modal and call updateContents on share-btn click', () => {
    doc._elements['share-btn']._fire('click');
    expect(updateContents).toHaveBeenCalled();
    expect(doc._elements['share-modal'].classList.contains('hidden')).toBe(false);
    expect(doc._elements['share-modal'].classList.contains('flex')).toBe(true);
  });

  it('should close modal on close button click', () => {
    // Open first
    doc._elements['share-btn']._fire('click');
    // Close
    doc._elements['share-modal-close']._fire('click');
    expect(doc._elements['share-modal'].classList.contains('hidden')).toBe(true);
    expect(doc._elements['share-modal'].classList.contains('flex')).toBe(false);
  });

  it('should close modal on backdrop click', () => {
    doc._elements['share-btn']._fire('click');
    // Simulate clicking the backdrop (target.id === 'share-modal')
    doc._elements['share-modal']._fire('click', { target: { id: 'share-modal' } });
    expect(doc._elements['share-modal'].classList.contains('hidden')).toBe(true);
  });

  it('should not close on click inside modal content', () => {
    doc._elements['share-btn']._fire('click');
    doc._elements['share-modal']._fire('click', { target: { id: 'some-inner-element' } });
    expect(doc._elements['share-modal'].classList.contains('hidden')).toBe(false);
  });
});
