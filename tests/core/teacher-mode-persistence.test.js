import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TeacherModeController } from '../../platform/core/teacher-mode.js';

const appHtmlPath = join(process.cwd(), 'platform', 'app.html');
const appHtmlContent = readFileSync(appHtmlPath, 'utf-8');

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    add: (...tokens) => tokens.forEach((token) => classes.add(token)),
    remove: (...tokens) => tokens.forEach((token) => classes.delete(token)),
    contains: (token) => classes.has(token)
  };
}

function createElement({ classes = [] } = {}) {
  const styleValues = {};

  return {
    classList: createClassList(classes),
    style: {
      setProperty(name, value) {
        styleValues[name] = value;
      },
      get display() {
        return styleValues.display;
      }
    },
    textContent: '',
    innerHTML: ''
  };
}

function createDocumentLike() {
  const elements = new Map([
    ['teacher-badge', createElement({ classes: ['hidden'] })],
    ['teacher-review-btn', createElement()],
    ['time-analytics-btn', createElement()],
    ['roster-btn', createElement()],
    ['webrtc-toggle-btn', createElement()],
    ['video-source-setting', createElement({ classes: ['hidden'] })],
    ['preload-animations-setting', createElement({ classes: ['hidden'] })],
    ['cartridge-shortcuts', createElement({ classes: ['hidden'] })],
    ['shortcut-list', createElement()],
    ['teacher-progression-panel', createElement()],
    ['teacher-review-panel', createElement({ classes: ['hidden', 'translate-x-full'] })],
    ['teacher-review-backdrop', createElement({ classes: ['hidden'] })],
    ['time-analytics-panel', createElement({ classes: ['hidden', 'translate-x-full'] })],
    ['time-analytics-backdrop', createElement({ classes: ['hidden'] })]
  ]);

  return {
    getElementById(id) {
      return elements.get(id) || null;
    }
  };
}

describe('Teacher mode persistence regression', () => {
  it('imports the shared teacher mode controller module', () => {
    expect(appHtmlContent).toContain("import { TeacherModeController } from './core/teacher-mode.js';");
  });

  it('restores teacher mode from cache before background revalidation', async () => {
    const events = [];
    const controller = new TeacherModeController({
      userSystem: {
        getMeta: vi.fn().mockResolvedValue({ enabled: true, password: 'secret' }),
        setMeta: vi.fn().mockResolvedValue(undefined)
      },
      getServerUrl: () => 'https://example.test',
      ensureRosterModal: vi.fn().mockResolvedValue({
        setTeacherPassword: vi.fn()
      }),
      loadPendingReviews: vi.fn(() => {
        events.push('activate');
      }),
      clearPendingReviews: vi.fn(),
      updateReviewBadge: vi.fn(),
      hideTeacherAlert: vi.fn(),
      initVideoSourceToggle: vi.fn(),
      fetchFn: vi.fn(async () => {
        events.push('validate');
        return {
          json: async () => ({ valid: true })
        };
      }),
      documentLike: createDocumentLike(),
      rtcPeerConnectionCtor: function MockPeerConnection() {}
    });

    await expect(controller.checkPersistence()).resolves.toBe(true);

    expect(events).toEqual(['activate', 'validate']);
    expect(controller.state.isTeacher).toBe(true);
    expect(controller.state.teacherPassword).toBe('secret');
  });

  it('keeps cached teacher mode active when background revalidation fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const controller = new TeacherModeController({
        userSystem: {
          getMeta: vi.fn().mockResolvedValue({ enabled: true, password: 'secret' }),
          setMeta: vi.fn().mockResolvedValue(undefined)
        },
        getServerUrl: () => 'https://example.test',
        ensureRosterModal: vi.fn().mockResolvedValue({
          setTeacherPassword: vi.fn()
        }),
        loadPendingReviews: vi.fn(),
        clearPendingReviews: vi.fn(),
        updateReviewBadge: vi.fn(),
        hideTeacherAlert: vi.fn(),
        initVideoSourceToggle: vi.fn(),
        fetchFn: vi.fn().mockRejectedValue(new Error('network down')),
        documentLike: createDocumentLike()
      });

      await expect(controller.checkPersistence()).resolves.toBe(true);
      await Promise.resolve();

      expect(controller.state.isTeacher).toBe(true);
      expect(controller.state.teacherPassword).toBe('secret');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('clears teacher-only UI and review state on deactivate', async () => {
    const userSystem = {
      getMeta: vi.fn(),
      setMeta: vi.fn().mockResolvedValue(undefined)
    };
    const updateReviewBadge = vi.fn();
    const clearPendingReviews = vi.fn();
    const hideTeacherAlert = vi.fn();
    const documentLike = createDocumentLike();
    const controller = new TeacherModeController({
      userSystem,
      getServerUrl: () => 'https://example.test',
      ensureRosterModal: vi.fn().mockResolvedValue({
        setTeacherPassword: vi.fn()
      }),
      loadPendingReviews: vi.fn(),
      clearPendingReviews,
      updateReviewBadge,
      hideTeacherAlert,
      initVideoSourceToggle: vi.fn(),
      fetchFn: vi.fn(async () => ({
        json: async () => ({ valid: true })
      })),
      documentLike,
      rtcPeerConnectionCtor: function MockPeerConnection() {}
    });

    await controller.activate('secret', false);
    await controller.deactivate(true);

    expect(controller.state.isTeacher).toBe(false);
    expect(controller.state.teacherPassword).toBeNull();
    expect(documentLike.getElementById('teacher-badge').classList.contains('hidden')).toBe(true);
    expect(documentLike.getElementById('teacher-review-btn').style.display).toBe('none');
    expect(documentLike.getElementById('time-analytics-btn').style.display).toBe('none');
    expect(documentLike.getElementById('roster-btn').style.display).toBe('none');
    expect(documentLike.getElementById('teacher-review-panel').classList.contains('hidden')).toBe(true);
    expect(documentLike.getElementById('time-analytics-panel').classList.contains('hidden')).toBe(true);
    expect(updateReviewBadge).toHaveBeenCalledWith(0);
    expect(clearPendingReviews).toHaveBeenCalledOnce();
    expect(hideTeacherAlert).toHaveBeenCalledOnce();
    expect(userSystem.setMeta).toHaveBeenLastCalledWith('teacherMode', { enabled: false, password: null });
  });
});
