import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TeacherReviewPanel } from '../../platform/core/teacher-review.ts';

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

function createElement({ classes = [], dataset = {}, textContent = '', querySelectorMap, querySelectorAllMap } = {}) {
  const styleValues = {};
  const selectorMap = querySelectorMap || new Map();
  const selectorAllMap = querySelectorAllMap || new Map();

  return {
    classList: createClassList(classes),
    dataset,
    textContent,
    innerHTML: '',
    className: '',
    style: {
      setProperty(name, value) {
        styleValues[name] = value;
      },
      get display() {
        return styleValues.display;
      },
      set display(value) {
        styleValues.display = value;
      }
    },
    querySelector(selector) {
      return selectorMap.get(selector) || null;
    },
    querySelectorAll(selector) {
      return selectorAllMap.get(selector) || [];
    }
  };
}

function createDocumentLike(extraSelectors = new Map()) {
  const emptyMessage = createElement({ textContent: '' });
  const emptyState = createElement({
    classes: ['hidden'],
    querySelectorMap: new Map([['p', emptyMessage]])
  });

  const elements = new Map([
    ['teacher-review-panel', createElement({ classes: ['translate-x-full'] })],
    ['teacher-review-backdrop', createElement({ classes: ['hidden'] })],
    ['teacher-review-loading', createElement()],
    ['teacher-review-list', createElement({ classes: ['hidden'] })],
    ['teacher-review-empty', emptyState],
    ['header-review-count', createElement()],
    ['review-count-badge', createElement({ classes: ['hidden'] })],
    ['alert-review-count', createElement({ textContent: '0' })],
    ['teacher-alert-overlay', createElement({ classes: ['hidden'] })],
    ['review-filter-pending', createElement()],
    ['review-filter-reviewed', createElement()]
  ]);

  return {
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelector(selector) {
      return extraSelectors.get(selector) || null;
    }
  };
}

function createController(overrides = {}) {
  const documentLike = overrides.documentLike || createDocumentLike();
  const celebration = overrides.celebration || { showToast: vi.fn() };

  return new TeacherReviewPanel({
    getServerUrl: overrides.getServerUrl || (() => 'https://example.test'),
    getTeacherPassword: overrides.getTeacherPassword || (() => 'secret'),
    isTeacherModeActive: overrides.isTeacherModeActive || (() => true),
    getWebRTCManager: overrides.getWebRTCManager || (() => null),
    celebration,
    playTeacherAlert: overrides.playTeacherAlert || vi.fn(),
    onLoadReviewProblem: overrides.onLoadReviewProblem || vi.fn().mockResolvedValue(undefined),
    fetchFn: overrides.fetchFn || vi.fn(),
    documentLike,
    windowLike: overrides.windowLike || {}
  });
}

describe('Teacher review panel extraction', () => {
  it('imports the shared teacher review panel module', () => {
    expect(appHtmlContent).toContain("import { TeacherReviewPanel } from './core/teacher-review.ts';");
  });

  it('loads pending reviews, caches them, and updates badge state', async () => {
    const reviews = [{
      id: 'review-1',
      username: 'alice',
      submitted_at: '2026-01-02T03:04:05Z',
      scenario_topic: 'LSRL Practice',
      scenario_context: { xVar: 'hours', xUnits: 'h', yVar: 'score', yUnits: 'pts', intercept: 1, slope: 2, r: 0.8 },
      student_answers: { slope: '2' },
      expected_answers: { slope: 2 },
      keyword_results: { slope: { score: 'E', feedback: 'Correct' } },
      teacher_grades: {},
      field_ids: ['slope'],
      cartridge_name: 'LSRL',
      status: 'pending'
    }];
    const fetchFn = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => reviews
    }));
    const documentLike = createDocumentLike();
    const controller = createController({ fetchFn, documentLike });

    await controller.loadPendingReviews();

    expect(fetchFn).toHaveBeenCalledWith('https://example.test/api/teacher-review?status=pending', {
      headers: { 'x-teacher-password': 'secret' }
    });
    expect(controller.state.pendingReviewsCache).toHaveLength(1);
    expect(documentLike.getElementById('teacher-review-list').innerHTML).toContain('alice');
    expect(documentLike.getElementById('header-review-count').textContent).toBe('1');
    expect(documentLike.getElementById('header-review-count').style.display).toBe('inline');
    expect(documentLike.getElementById('teacher-alert-overlay').classList.contains('hidden')).toBe(false);
  });

  it('installs global onclick handlers for the rendered review actions', () => {
    const windowLike = {};
    const controller = createController({ windowLike });

    controller.installGlobalHandlers();

    expect(typeof windowLike.setReviewGrade).toBe('function');
    expect(typeof windowLike.submitTeacherGrades).toBe('function');
    expect(typeof windowLike.loadReviewProblem).toBe('function');
  });

  it('submits quick grades through WebRTC and the server', async () => {
    const reviewElement = createElement({
      dataset: { fields: 'slope,intercept' }
    });
    const documentLike = createDocumentLike(new Map([
      ['[data-review-id="review-1"]', reviewElement]
    ]));
    const sendTo = vi.fn();
    const fetchFn = vi.fn(async (url, options = {}) => {
      if (options.method === 'PUT') {
        return {
          ok: true,
          status: 200,
          json: async () => ({})
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => []
      };
    });
    const celebration = { showToast: vi.fn() };
    const controller = createController({
      documentLike,
      fetchFn,
      celebration,
      getWebRTCManager: () => ({
        isActive: true,
        sendTo
      })
    });

    controller.state.pendingReviewsCache = [{ id: 'review-1', username: 'alice' }];
    controller.state.pendingGrades['review-1'] = { slope: 'E', intercept: 'P' };

    await controller.submitTeacherGrades('review-1');

    expect(sendTo).toHaveBeenCalledWith('alice', 'review_grade', {
      reviewId: 'review-1',
      grades: { slope: 'E', intercept: 'P' },
      feedback: 'Teacher reviewed your work'
    });
    expect(fetchFn).toHaveBeenCalledWith('https://example.test/api/teacher-review/review-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-teacher-password': 'secret'
      },
      body: JSON.stringify({ grades: { slope: 'E', intercept: 'P' } })
    });
    expect(celebration.showToast).toHaveBeenCalledWith('Grades submitted!', 'success');
  });

  it('tracks the active review and submits teacher grading results back to the server', async () => {
    const review = {
      id: 'review-2',
      username: 'bob',
      scenario_context: {},
      expected_answers: {}
    };
    const onLoadReviewProblem = vi.fn().mockResolvedValue(undefined);
    const celebration = { showToast: vi.fn() };
    const fetchFn = vi.fn(async (url, options = {}) => {
      if (options.method === 'PUT') {
        return {
          ok: true,
          status: 200,
          json: async () => ({})
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => []
      };
    });
    const controller = createController({
      onLoadReviewProblem,
      celebration,
      fetchFn
    });

    controller.state.pendingReviewsCache = [review];

    await controller.openReviewProblem('review-2');
    const submitted = await controller.submitActiveReviewGrades({ slope: 'E' });

    expect(onLoadReviewProblem).toHaveBeenCalledWith(review);
    expect(submitted).toBe(true);
    expect(fetchFn).toHaveBeenCalledWith('https://example.test/api/teacher-review/review-2', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-teacher-password': 'secret'
      },
      body: JSON.stringify({ grades: { slope: 'E' } })
    });
    expect(controller.state.activeReviewId).toBeNull();
    expect(celebration.showToast).toHaveBeenCalledWith('Student review submitted!', 'success');
  });
});
