/**
 * Regression tests for Student Detail Modal (v4.3.2)
 *
 * Tests the teacher-only feature that allows clicking on usernames
 * in the "Online Now" modal to view student progress details.
 *
 * Uses static file analysis to verify HTML structure and JavaScript code.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read app.html content for static analysis
const appHtmlPath = join(process.cwd(), 'platform', 'app.html');
const appHtmlContent = readFileSync(appHtmlPath, 'utf-8');
const realtimeControllerPath = join(process.cwd(), 'platform', 'core', 'realtime-controller.ts');
const realtimeControllerContent = readFileSync(realtimeControllerPath, 'utf-8');
const realtimeSurfaceContent = [appHtmlContent, realtimeControllerContent].join('\n');

describe('Student Detail Modal - HTML Structure', () => {
  describe('Modal Container', () => {
    it('should have student-detail-modal element', () => {
      expect(appHtmlContent).toContain('id="student-detail-modal"');
    });

    it('should have close button', () => {
      expect(appHtmlContent).toContain('id="student-detail-close"');
    });

    it('should have name element for title', () => {
      expect(appHtmlContent).toContain('id="student-detail-name"');
    });

    it('should have content container', () => {
      expect(appHtmlContent).toContain('id="student-detail-content"');
    });

    it('should have avatar element', () => {
      expect(appHtmlContent).toContain('id="student-detail-avatar"');
    });

    it('should have status element', () => {
      expect(appHtmlContent).toContain('id="student-detail-status"');
    });
  });

  describe('Data Display Sections', () => {
    it('should have student stats section', () => {
      expect(appHtmlContent).toContain('id="student-detail-stats"');
    });

    it('should have recent activity section', () => {
      expect(appHtmlContent).toContain('id="student-detail-recent"');
    });

    it('should have cartridge performance section', () => {
      expect(appHtmlContent).toContain('id="student-detail-cartridges"');
    });

    it('should have time breakdown section', () => {
      expect(appHtmlContent).toContain('id="student-detail-time"');
    });

    it('should have loading state element', () => {
      expect(appHtmlContent).toContain('id="student-detail-loading"');
    });

    it('should have error display element', () => {
      expect(appHtmlContent).toContain('id="student-detail-error"');
    });
  });

  describe('Modal Hidden by Default', () => {
    it('should have modal with hidden class initially', () => {
      // The modal element should have the hidden class in its declaration
      expect(appHtmlContent).toMatch(/id="student-detail-modal"[^>]*hidden/);
    });
  });
});

describe('Student Detail Modal - JavaScript Functions', () => {
  describe('openStudentDetail Function', () => {
    it('should define openStudentDetail function', () => {
      expect(appHtmlContent).toContain('async function openStudentDetail');
    });

    it('should accept username parameter', () => {
      expect(appHtmlContent).toMatch(/function openStudentDetail\s*\(\s*username/);
    });

    it('should call progress API', () => {
      expect(appHtmlContent).toContain('/api/progress/${username}');
    });

    it('should call time tracking API', () => {
      expect(appHtmlContent).toContain('/api/time-tracking/user/${username}');
    });

    it('should be exposed on window object', () => {
      expect(appHtmlContent).toContain('window.openStudentDetail = openStudentDetail');
    });
  });

  describe('closeStudentDetail Function', () => {
    it('should define closeStudentDetail function', () => {
      expect(appHtmlContent).toContain('function closeStudentDetail');
    });

    it('should hide the modal', () => {
      // Should add hidden class to modal
      expect(appHtmlContent).toMatch(/student-detail-modal.*classList\.add\(['"]hidden['"]\)/s);
    });
  });

  describe('Display Functions', () => {
    it('should define displayStudentStats function', () => {
      expect(appHtmlContent).toContain('function displayStudentStats');
    });

    it('should define displayRecentActivity function', () => {
      expect(appHtmlContent).toContain('function displayRecentActivity');
    });

    it('should define displayCartridgePerformance function', () => {
      expect(appHtmlContent).toContain('function displayCartridgePerformance');
    });

    it('should define displayTimeBreakdown function', () => {
      expect(appHtmlContent).toContain('function displayTimeBreakdown');
    });
  });
});

describe('Student Detail Modal - Event Handlers', () => {
  describe('Close Button Handler', () => {
    it('should attach click handler to close button', () => {
      expect(appHtmlContent).toContain("getElementById('student-detail-close')");
    });

    it('should call closeStudentDetail on click', () => {
      expect(appHtmlContent).toMatch(/student-detail-close.*addEventListener.*click.*closeStudentDetail/s);
    });
  });

  describe('Modal Background Click Handler', () => {
    it('should close modal when clicking outside content', () => {
      // Clicking on the modal background (not content) closes it
      expect(appHtmlContent).toMatch(/student-detail-modal.*addEventListener.*click/s);
      expect(appHtmlContent).toContain("e.target.id === 'student-detail-modal'");
    });
  });

  describe('Escape Key Handler', () => {
    it('should close modal on Escape key press', () => {
      // The global Escape handler should check for student-detail-modal
      expect(appHtmlContent).toContain("getElementById('student-detail-modal')");
      // And call closeStudentDetail
      expect(appHtmlContent).toContain('closeStudentDetail()');
    });
  });
});

describe('Student Detail Modal - Teacher Access Control', () => {
  describe('Teacher-Only Username Click', () => {
    it('should check isTeacher before adding click handler', () => {
      expect(realtimeSurfaceContent).toContain('isTeacher');
    });

    it('should add eye icon for teachers', () => {
      expect(realtimeSurfaceContent).toContain('text-indigo-400 ml-auto');
    });

    it('should set cursor pointer class for teacher clicks', () => {
      expect(realtimeSurfaceContent).toContain('cursor-pointer');
    });

    it('should add click handler with openStudentDetail', () => {
      expect(realtimeSurfaceContent).toContain("openStudentDetail('${username}')");
    });
  });
});

describe('Student Detail Modal - API Integration', () => {
  describe('Progress API Call', () => {
    it('should use fetch for progress API', () => {
      expect(appHtmlContent).toMatch(/fetch\s*\(\s*`.*\/api\/progress\//);
    });

    it('should handle progress response', () => {
      expect(appHtmlContent).toContain('progressRes');
      expect(appHtmlContent).toContain('progressData');
    });
  });

  describe('Time Tracking API Call', () => {
    it('should use fetch for time tracking API', () => {
      expect(appHtmlContent).toMatch(/fetch\s*\(\s*`.*\/api\/time-tracking\/user\//);
    });

    it('should handle time response', () => {
      expect(appHtmlContent).toContain('timeRes');
      expect(appHtmlContent).toContain('timeData');
    });
  });

  describe('Error Handling', () => {
    it('should have try-catch for API calls', () => {
      // openStudentDetail should have error handling
      expect(appHtmlContent).toMatch(/async function openStudentDetail[\s\S]*?try[\s\S]*?catch/);
    });

    it('should display error message on failure', () => {
      expect(appHtmlContent).toContain('student-detail-error');
      expect(appHtmlContent).toContain('student-detail-error-msg');
    });
  });
});

describe('Student Detail Modal - Display States', () => {
  describe('Loading State', () => {
    it('should have loading spinner element', () => {
      expect(appHtmlContent).toContain('student-detail-loading');
    });

    it('should show loading on open', () => {
      expect(appHtmlContent).toMatch(/student-detail-loading.*classList\.remove\(['"]hidden['"]\)/s);
    });

    it('should hide loading after data loads', () => {
      expect(appHtmlContent).toMatch(/student-detail-loading.*classList\.add\(['"]hidden['"]\)/s);
    });
  });

  describe('Stats Display', () => {
    it('should show stats section after loading', () => {
      expect(appHtmlContent).toMatch(/student-detail-stats.*classList\.remove\(['"]hidden['"]\)/s);
    });

    it('should have gold star stat display', () => {
      expect(appHtmlContent).toContain('id="stat-gold"');
    });

    it('should have silver star stat display', () => {
      expect(appHtmlContent).toContain('id="stat-silver"');
    });

    it('should have bronze star stat display', () => {
      expect(appHtmlContent).toContain('id="stat-bronze"');
    });

    it('should have total time stat display', () => {
      expect(appHtmlContent).toContain('id="stat-time"');
    });
  });
});

describe('Student Detail Modal - Recent Activity', () => {
  it('should show recent activity section', () => {
    expect(appHtmlContent).toMatch(/student-detail-recent.*classList\.remove\(['"]hidden['"]\)/s);
  });

  it('should have recent activity list container', () => {
    expect(appHtmlContent).toContain('id="recent-activity-list"');
  });
});

describe('Student Detail Modal - Cartridge Performance', () => {
  it('should show cartridge section', () => {
    expect(appHtmlContent).toMatch(/student-detail-cartridges.*classList\.remove\(['"]hidden['"]\)/s);
  });

  it('should have cartridge performance list container', () => {
    expect(appHtmlContent).toContain('id="cartridge-performance-list"');
  });
});

describe('Student Detail Modal - Time Breakdown', () => {
  it('should show time section', () => {
    expect(appHtmlContent).toMatch(/student-detail-time.*classList\.remove\(['"]hidden['"]\)/s);
  });

  it('should have time breakdown list container', () => {
    expect(appHtmlContent).toContain('id="time-breakdown-list"');
  });
});

