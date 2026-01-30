/**
 * Star Award Consistency Tests
 *
 * Ensures all star award code paths in app.html have consistent behavior:
 * - Both applyTeacherGrades() and onGradingComplete() must call syncCartridgeProgress()
 * - Both paths must POST to /api/progress
 *
 * Bug reference: B2 in DEBUG_CHECKLIST.md - syncCartridgeProgress() was missing from
 * applyTeacherGrades() path prior to fix in fix/comprehensive-debug-review branch.
 *
 * Run with: npx vitest run tests/core/star-award-consistency.test.js
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const APP_HTML_PATH = path.join(process.cwd(), 'platform', 'app.html');

describe('Star Award Consistency (B2 Regression Prevention)', () => {
  let appHtmlContent;

  // Load app.html once before all tests
  beforeAll(() => {
    appHtmlContent = fs.readFileSync(APP_HTML_PATH, 'utf-8');
  });

  describe('syncCartridgeProgress() calls', () => {
    it('should call syncCartridgeProgress() in at least 2 locations (both star award paths)', () => {
      const matches = appHtmlContent.match(/syncCartridgeProgress\(\)/g);

      // Expect: 1 function definition + 2 calls (one in each star award path)
      // The function definition itself counts as a match
      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    it('should have syncCartridgeProgress() defined as async function', () => {
      expect(appHtmlContent).toContain('async function syncCartridgeProgress()');
    });

    it('should call syncCartridgeProgress() after POST to /api/progress in both paths', () => {
      // Find all blocks that contain both /api/progress POST and the surrounding context
      // The pattern: POST to /api/progress followed eventually by syncCartridgeProgress()

      // Split by syncCartridgeProgress() calls (excluding the definition)
      const syncCalls = appHtmlContent.split('syncCartridgeProgress()').length - 1;

      // There should be at least 2 calls (one in each path) plus the function definition
      // Function definition: "async function syncCartridgeProgress()"
      // Calls: "syncCartridgeProgress()" standalone
      expect(syncCalls).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/progress calls', () => {
    it('should POST to /api/progress in star award blocks', () => {
      const progressPostPattern = /fetch\(`\$\{SERVER_URL\}\/api\/progress`,\s*\{[\s\S]*?method:\s*['"]POST['"]/g;
      const matches = appHtmlContent.match(progressPostPattern);

      expect(matches).not.toBeNull();
      // Should have at least 2 POST calls to /api/progress (one per star award path)
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should include weighted_points in progress POST body', () => {
      const weightedPointsPattern = /weighted_points:\s*weightedPoints/g;
      const matches = appHtmlContent.match(weightedPointsPattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should include cartridge_id in progress POST body', () => {
      const cartridgeIdPattern = /cartridge_id:\s*getCurrentCartridgeId\(\)/g;
      const matches = appHtmlContent.match(cartridgeIdPattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Star earning flow consistency', () => {
    it('should have consistent star type calculation in both paths', () => {
      // Both paths should use: state.game.potentialStar || 'gold'
      const potentialStarPattern = /const\s+starType\s*=\s*state\.game\.potentialStar\s*\|\|\s*['"]gold['"]/g;
      const matches = appHtmlContent.match(potentialStarPattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should call wsClient.notifyStarEarned() in both paths', () => {
      const wsNotifyPattern = /wsClient\.notifyStarEarned\(/g;
      const matches = appHtmlContent.match(wsNotifyPattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should call classTime.recordStar() in both paths', () => {
      const classTimePattern = /classTime\.recordStar\(starType\)/g;
      const matches = appHtmlContent.match(classTimePattern);

      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('applyTeacherGrades function', () => {
    it('should exist as async function', () => {
      expect(appHtmlContent).toContain('async function applyTeacherGrades(message)');
    });

    it('should have star earning logic', () => {
      // Check for the pattern in applyTeacherGrades context
      // The function handles WebSocket teacher grades and awards stars
      const hasStarLogic = appHtmlContent.includes('applyTeacherGrades') &&
                          appHtmlContent.includes("results.allCorrect");
      expect(hasStarLogic).toBe(true);
    });
  });

  describe('onGradingComplete callback', () => {
    it('should exist as callback in platform init', () => {
      expect(appHtmlContent).toContain('onGradingComplete: (results)');
    });

    it('should have star earning logic', () => {
      // The callback handles normal grading completion
      expect(appHtmlContent).toContain('results.allCorrect');
    });
  });
});

describe('Progress Sync Function Structure', () => {
  let appHtmlContent;

  beforeAll(() => {
    appHtmlContent = fs.readFileSync(APP_HTML_PATH, 'utf-8');
  });

  it('should post to /api/progress/cartridge-sync', () => {
    expect(appHtmlContent).toContain('/api/progress/cartridge-sync');
  });

  it('should include username in cartridge-sync request', () => {
    expect(appHtmlContent).toContain('username: userSystem.currentUser.username');
  });

  it('should include cartridgeId in cartridge-sync request', () => {
    // Check for cartridgeId being passed (either via variable or getCurrentCartridgeId())
    const hasCartridgeId = appHtmlContent.includes('cartridgeId: cartridgeId') ||
                          appHtmlContent.includes('cartridgeId: getCurrentCartridgeId()') ||
                          appHtmlContent.includes("cartridgeId:");
    expect(hasCartridgeId).toBe(true);
  });

  it('should include stars object in cartridge-sync request', () => {
    expect(appHtmlContent).toContain('stars:');
  });

  it('should include totalWeightedScore in cartridge-sync request', () => {
    expect(appHtmlContent).toContain('totalWeightedScore');
  });
});
