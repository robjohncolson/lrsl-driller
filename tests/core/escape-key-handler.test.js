/**
 * Escape Key Handler Tests
 *
 * Tests to ensure all modals/panels can be closed via Escape key (v4.3)
 * Verifies correct backdrop element IDs are used throughout app.html
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read app.html content for static analysis
const appHtmlPath = join(process.cwd(), 'platform', 'app.html');
const appHtmlContent = readFileSync(appHtmlPath, 'utf-8');

describe('Escape Key Handler - Element ID Consistency', () => {
  describe('Teacher Review Panel', () => {
    it('should have teacher-review-backdrop element defined in HTML', () => {
      expect(appHtmlContent).toContain('id="teacher-review-backdrop"');
    });

    it('should use correct backdrop ID in Escape handler', () => {
      // The Escape handler should use the full ID
      expect(appHtmlContent).toContain("getElementById('teacher-review-backdrop')");
      // Should NOT use the incorrect short form
      expect(appHtmlContent).not.toMatch(/getElementById\(['"]review-backdrop['"]\)/);
    });

    it('should have backdrop click handler to close panel', () => {
      expect(appHtmlContent).toContain("getElementById('teacher-review-backdrop')?.addEventListener('click'");
    });
  });

  describe('Time Analytics Panel', () => {
    it('should have time-analytics-backdrop element defined in HTML', () => {
      expect(appHtmlContent).toContain('id="time-analytics-backdrop"');
    });

    it('should use correct backdrop ID in Escape handler', () => {
      // The Escape handler should use the full ID
      expect(appHtmlContent).toContain("getElementById('time-analytics-backdrop')");
      // Should NOT use the incorrect short form
      expect(appHtmlContent).not.toMatch(/getElementById\(['"]analytics-backdrop['"]\)/);
    });

    it('should have backdrop click handler to close panel', () => {
      expect(appHtmlContent).toContain("getElementById('time-analytics-backdrop')?.addEventListener('click'");
    });
  });

  describe('Share Modal', () => {
    it('should have share-modal element defined in HTML', () => {
      expect(appHtmlContent).toContain('id="share-modal"');
    });

    it('should check share modal in Escape handler', () => {
      expect(appHtmlContent).toContain("getElementById('share-modal')");
    });
  });

  describe('Cartridge Dropdown', () => {
    it('should have cartridge-dropdown element defined in HTML', () => {
      expect(appHtmlContent).toContain('id="cartridge-dropdown"');
    });

    it('should check cartridge dropdown in Escape handler', () => {
      expect(appHtmlContent).toContain("getElementById('cartridge-dropdown')");
    });
  });

  describe('Online Users Dropdown', () => {
    it('should have online-dropdown element defined in HTML', () => {
      expect(appHtmlContent).toContain('id="online-dropdown"');
    });

    it('should check online users dropdown in Escape handler', () => {
      expect(appHtmlContent).toContain("getElementById('online-dropdown')");
    });
  });

  describe('CTF/Game Mode Sidebar', () => {
    it('should have ctf-sidebar element defined in HTML', () => {
      expect(appHtmlContent).toContain('id="ctf-sidebar"');
    });

    it('should check CTF sidebar in Escape handler', () => {
      expect(appHtmlContent).toContain("getElementById('ctf-sidebar')");
    });
  });

  describe('Leaderboard Panel', () => {
    it('should have leaderboard-panel element defined in HTML', () => {
      expect(appHtmlContent).toContain('id="leaderboard-panel"');
    });

    it('should check leaderboard panel in Escape handler', () => {
      expect(appHtmlContent).toContain("getElementById('leaderboard-panel')");
    });
  });
});

describe('Escape Key Handler - Pattern Verification', () => {
  it('should have global Escape key event listener', () => {
    expect(appHtmlContent).toContain("e.key === 'Escape'");
  });

  it('should use translate-x-full class for slide-out panels', () => {
    // Panels use translate-x-full to slide in/out
    expect(appHtmlContent).toContain("classList.contains('translate-x-full')");
    expect(appHtmlContent).toContain("classList.add('translate-x-full')");
    expect(appHtmlContent).toContain("classList.remove('translate-x-full')");
  });

  it('should use hidden class for backdrops', () => {
    // Backdrops use hidden class to show/hide
    expect(appHtmlContent).toMatch(/backdrop.*classList\.add\('hidden'\)/s);
    expect(appHtmlContent).toMatch(/backdrop.*classList\.remove\('hidden'\)/s);
  });

  it('should return early after closing each component to prevent multiple closes', () => {
    // Each panel close block should have a return statement
    const escapeHandlerMatch = appHtmlContent.match(/if\s*\(e\.key\s*===\s*'Escape'\)\s*\{([\s\S]*?)\n\s{6}\}/);
    expect(escapeHandlerMatch).not.toBeNull();

    const escapeHandlerContent = escapeHandlerMatch[1];
    // Count return statements in the Escape handler
    const returnCount = (escapeHandlerContent.match(/return;/g) || []).length;
    // Should have returns for: share modal, cartridge dropdown, online users dropdown,
    // CTF sidebar, teacher review panel, time analytics panel, leaderboard panel
    expect(returnCount).toBeGreaterThanOrEqual(7);
  });
});

describe('Escape Key Handler - Backdrop ID Mapping', () => {
  // Verify that panel IDs and backdrop IDs follow consistent naming
  const panelBackdropPairs = [
    { panel: 'teacher-review-panel', backdrop: 'teacher-review-backdrop' },
    { panel: 'time-analytics-panel', backdrop: 'time-analytics-backdrop' }
  ];

  panelBackdropPairs.forEach(({ panel, backdrop }) => {
    it(`should have matching panel and backdrop: ${panel} -> ${backdrop}`, () => {
      expect(appHtmlContent).toContain(`id="${panel}"`);
      expect(appHtmlContent).toContain(`id="${backdrop}"`);
    });
  });
});

describe('Escape Key Handler - Accessibility', () => {
  it('should allow closing all modals/panels without mouse', () => {
    // All close buttons should have keyboard-accessible alternatives via Escape
    const closeableComponents = [
      'share-modal',
      'cartridge-dropdown',
      'online-dropdown',
      'ctf-sidebar',
      'teacher-review-panel',
      'time-analytics-panel',
      'leaderboard-panel'
    ];

    closeableComponents.forEach(component => {
      expect(appHtmlContent).toContain(`id="${component}"`);
    });
  });
});
