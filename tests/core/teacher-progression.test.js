import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TeacherProgressionControls } from '../../platform/core/teacher-progression.js';

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
    'teacher-progression-panel': createMockElement({ classes: ['hidden'] }),
    'progression-level-name': createMockElement(),
    'gold-req-input': createMockElement({ value: '1' }),
    'progression-override-status': createMockElement({ classes: ['hidden'] }),
    'save-gold-req-btn': createMockElement(),
    'reset-gold-req-btn': createMockElement(),
    'reset-all-overrides-btn': createMockElement()
  };
  return {
    getElementById: (id) => elements[id] || null,
    _elements: elements
  };
}

function createMockPlatform() {
  return {
    currentMode: 'level-1',
    currentCartridge: {
      manifest: {
        modes: [
          { id: 'level-1', name: 'Level 1' },
          { id: 'level-2', name: 'Level 2' }
        ]
      }
    },
    gameEngine: {
      getRequiredGold: vi.fn(() => 3),
      hasOverride: vi.fn(() => false),
      getManifestDefault: vi.fn(() => 1),
      updateOverride: vi.fn(),
      removeOverride: vi.fn()
    }
  };
}

describe('TeacherProgressionControls', () => {
  let controls;
  let doc;
  let mockPlatform;
  let celebration;
  let renderModeTabs;

  beforeEach(() => {
    doc = createDocumentLike();
    mockPlatform = createMockPlatform();
    celebration = { showToast: vi.fn() };
    renderModeTabs = vi.fn();

    controls = new TeacherProgressionControls({
      documentLike: doc,
      getPlatform: () => mockPlatform,
      getCartridgeId: () => 'test-cartridge',
      getServerUrl: () => 'http://localhost:3001',
      getTeacherPassword: () => 'secret',
      getUserSystem: () => ({ currentUser: { username: 'teacher1' } }),
      isTeacherModeActive: () => true,
      celebration,
      renderModeTabs,
      fetchFn: vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
      confirmFn: vi.fn(() => true)
    });
  });

  describe('updateControls', () => {
    it('should show panel for teacher with active platform', () => {
      controls.updateControls();
      expect(doc._elements['teacher-progression-panel'].classList.contains('hidden')).toBe(false);
      expect(doc._elements['progression-level-name'].textContent).toBe('Level 1');
    });

    it('should hide panel when not teacher', () => {
      controls.isTeacherModeActive = () => false;
      controls.updateControls();
      expect(doc._elements['teacher-progression-panel'].classList.contains('hidden')).toBe(true);
    });

    it('should hide panel when no platform mode', () => {
      mockPlatform.currentMode = null;
      controls.updateControls();
      expect(doc._elements['teacher-progression-panel'].classList.contains('hidden')).toBe(true);
    });

    it('should show override status when override exists', () => {
      mockPlatform.gameEngine.hasOverride.mockReturnValue(true);
      mockPlatform.gameEngine.getRequiredGold.mockReturnValue(5);
      mockPlatform.gameEngine.getManifestDefault.mockReturnValue(1);
      controls.updateControls();
      const status = doc._elements['progression-override-status'];
      expect(status.classList.contains('hidden')).toBe(false);
      expect(status.textContent).toContain('Override: 5');
    });

    it('should hide override status when no override', () => {
      controls.updateControls();
      expect(doc._elements['progression-override-status'].classList.contains('hidden')).toBe(true);
    });
  });

  describe('saveOverride', () => {
    it('should send PUT request and update local state', async () => {
      doc._elements['gold-req-input'].value = '5';
      await controls.saveOverride();
      expect(controls.fetchFn).toHaveBeenCalledWith(
        'http://localhost:3001/api/progression-overrides/test-cartridge/level-1',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(mockPlatform.gameEngine.updateOverride).toHaveBeenCalledWith('level-1', 5);
      expect(renderModeTabs).toHaveBeenCalled();
      expect(celebration.showToast).toHaveBeenCalledWith(expect.stringContaining('5 gold'), 'success');
    });

    it('should reject invalid gold values', async () => {
      doc._elements['gold-req-input'].value = '0';
      await controls.saveOverride();
      expect(celebration.showToast).toHaveBeenCalledWith(expect.stringContaining('between 1 and 10'), 'error');
      expect(controls.fetchFn).not.toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      doc._elements['gold-req-input'].value = '3';
      controls.fetchFn = vi.fn(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      }));
      await controls.saveOverride();
      expect(celebration.showToast).toHaveBeenCalledWith('Failed to save progression override', 'error');
    });

    it('should do nothing without mode or cartridge', async () => {
      mockPlatform.currentMode = null;
      await controls.saveOverride();
      expect(controls.fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('resetOverride', () => {
    it('should send DELETE request and update local state', async () => {
      await controls.resetOverride();
      expect(controls.fetchFn).toHaveBeenCalledWith(
        'http://localhost:3001/api/progression-overrides/test-cartridge/level-1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(mockPlatform.gameEngine.removeOverride).toHaveBeenCalledWith('level-1');
      expect(renderModeTabs).toHaveBeenCalled();
    });
  });

  describe('resetAllOverrides', () => {
    it('should show info toast when no overrides exist', async () => {
      await controls.resetAllOverrides();
      expect(celebration.showToast).toHaveBeenCalledWith('No overrides to reset', 'info');
    });

    it('should delete all overrides when confirmed', async () => {
      mockPlatform.gameEngine.hasOverride
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      await controls.resetAllOverrides();
      expect(controls.fetchFn).toHaveBeenCalledTimes(2);
      expect(celebration.showToast).toHaveBeenCalledWith(expect.stringContaining('Reset 2'), 'success');
    });

    it('should do nothing when user cancels', async () => {
      mockPlatform.gameEngine.hasOverride.mockReturnValue(true);
      controls.confirmFn = vi.fn(() => false);
      await controls.resetAllOverrides();
      expect(controls.fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('initEventListeners', () => {
    it('should register listeners without throwing', () => {
      expect(() => controls.initEventListeners()).not.toThrow();
    });

    it('should not throw with missing elements', () => {
      const c = new TeacherProgressionControls({ documentLike: { getElementById: () => null } });
      expect(() => c.initEventListeners()).not.toThrow();
    });
  });
});
