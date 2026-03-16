import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TimeAnalyticsPanel } from '../../platform/core/time-analytics.js';

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

function createElement({ classes = [], dataset = {}, textContent = '', querySelectorMap } = {}) {
  const selectorMap = querySelectorMap || new Map();

  return {
    classList: createClassList(classes),
    dataset,
    textContent,
    innerHTML: '',
    className: '',
    querySelector(selector) {
      return selectorMap.get(selector) || null;
    }
  };
}

function createDocumentLike() {
  const emptyMessage = createElement({ textContent: '' });
  const emptyState = createElement({
    classes: ['hidden'],
    querySelectorMap: new Map([['p', emptyMessage]])
  });
  const todayButton = createElement({ dataset: { period: 'today' } });
  const weekButton = createElement({ dataset: { period: 'week' } });

  const elements = new Map([
    ['time-analytics-panel', createElement({ classes: ['translate-x-full'] })],
    ['time-analytics-backdrop', createElement({ classes: ['hidden'] })],
    ['time-analytics-loading', createElement()],
    ['time-analytics-list', createElement({ classes: ['hidden'] })],
    ['time-analytics-empty', emptyState],
    ['total-class-time', createElement()],
    ['total-students-active', createElement()],
    ['avg-time-per-student', createElement()]
  ]);

  return {
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelectorAll(selector) {
      if (selector === '.time-period-btn') {
        return [todayButton, weekButton];
      }
      return [];
    },
    periodButtons: { todayButton, weekButton }
  };
}

function createController(overrides = {}) {
  const documentLike = overrides.documentLike || createDocumentLike();

  return new TimeAnalyticsPanel({
    getServerUrl: overrides.getServerUrl || (() => 'https://example.test'),
    getTeacherPassword: overrides.getTeacherPassword || (() => 'secret'),
    getAvatarForUsername: overrides.getAvatarForUsername || ((username) => username.slice(0, 1).toUpperCase()),
    fetchFn: overrides.fetchFn || vi.fn(),
    documentLike
  });
}

describe('Time analytics panel extraction', () => {
  it('imports the shared time analytics panel module', () => {
    expect(appHtmlContent).toContain("import { TimeAnalyticsPanel } from './core/time-analytics.js';");
  });

  it('loads analytics data, updates summary stats, and renders the list', async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        totalClassTime: 5400000,
        students: [
          {
            username: 'alice',
            totalActiveMs: 3600000,
            sessionCount: 3,
            problemsCompleted: 10,
            problemsAttempted: 12,
            lastActive: '2026-01-02T03:04:05Z'
          },
          {
            username: 'bob',
            totalActiveMs: 1800000,
            sessionCount: 2,
            problemsCompleted: 6,
            problemsAttempted: 8,
            lastActive: '2026-01-02T01:04:05Z'
          }
        ]
      })
    }));
    const documentLike = createDocumentLike();
    const controller = createController({ fetchFn, documentLike });

    await controller.loadTimeAnalytics();

    expect(fetchFn).toHaveBeenCalledWith('https://example.test/api/time-tracking/class-summary?period=today', {
      headers: { 'x-teacher-password': 'secret' }
    });
    expect(documentLike.getElementById('total-class-time').textContent).toBe('1h 30m');
    expect(documentLike.getElementById('total-students-active').textContent).toBe(2);
    expect(documentLike.getElementById('avg-time-per-student').textContent).toBe('45m');
    expect(documentLike.getElementById('time-analytics-list').innerHTML).toContain('alice');
    expect(documentLike.getElementById('time-analytics-list').innerHTML).toContain('bob');
  });

  it('switches periods and updates the active pill styling', async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        totalClassTime: 0,
        students: []
      })
    }));
    const documentLike = createDocumentLike();
    const controller = createController({ fetchFn, documentLike });

    await controller.setPeriod('week');

    expect(fetchFn).toHaveBeenCalledWith('https://example.test/api/time-tracking/class-summary?period=week', {
      headers: { 'x-teacher-password': 'secret' }
    });
    expect(documentLike.periodButtons.weekButton.className).toContain('bg-green-600');
    expect(documentLike.periodButtons.todayButton.className).toContain('bg-white');
  });

  it('opens and closes the analytics panel', async () => {
    const documentLike = createDocumentLike();
    const controller = createController({
      documentLike,
      fetchFn: vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ totalClassTime: 0, students: [] })
      }))
    });

    await controller.openPanel();
    expect(documentLike.getElementById('time-analytics-panel').classList.contains('translate-x-full')).toBe(false);
    expect(documentLike.getElementById('time-analytics-backdrop').classList.contains('hidden')).toBe(false);

    controller.closePanel();
    expect(documentLike.getElementById('time-analytics-panel').classList.contains('translate-x-full')).toBe(true);
    expect(documentLike.getElementById('time-analytics-backdrop').classList.contains('hidden')).toBe(true);
  });
});
