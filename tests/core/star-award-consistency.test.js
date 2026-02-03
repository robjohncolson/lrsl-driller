/**
 * Star Award Consistency Tests
 *
 * Ensures all star award code paths in app.html have consistent behavior:
 * - Both applyTeacherGrades() and onGradingComplete() must call syncCartridgeProgress()
 * - Both paths must POST to /api/progress
 * - syncCartridgeProgress() must come AFTER the /api/progress POST
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

/**
 * Extract a function body from the source code
 * @param {string} source - Full source code
 * @param {string} functionSignature - Function signature to find (e.g., 'async function applyTeacherGrades(message)')
 * @returns {string|null} - Function body or null if not found
 */
function extractFunctionBody(source, functionSignature) {
  const startIndex = source.indexOf(functionSignature);
  if (startIndex === -1) return null;

  // Find the opening brace
  let braceIndex = source.indexOf('{', startIndex);
  if (braceIndex === -1) return null;

  // Count braces to find matching closing brace
  let depth = 1;
  let i = braceIndex + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }

  return source.slice(startIndex, i);
}

/**
 * Extract the onGradingComplete callback body
 * This is trickier because it's an object property callback
 */
function extractOnGradingCompleteBody(source) {
  // Find "onGradingComplete: (results)" or similar
  const pattern = /onGradingComplete:\s*\(results\)\s*=>\s*\{/;
  const match = source.match(pattern);
  if (!match) return null;

  const startIndex = match.index;
  // Find the opening brace of the arrow function
  let braceIndex = source.indexOf('{', startIndex);
  if (braceIndex === -1) return null;

  // Count braces to find matching closing brace
  let depth = 1;
  let i = braceIndex + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }

  return source.slice(startIndex, i);
}

describe('Star Award Consistency (B2 Regression Prevention)', () => {
  let appHtmlContent;
  let applyTeacherGradesBody;
  let onGradingCompleteBody;

  beforeAll(() => {
    appHtmlContent = fs.readFileSync(APP_HTML_PATH, 'utf-8');
    applyTeacherGradesBody = extractFunctionBody(appHtmlContent, 'async function applyTeacherGrades(message)');
    onGradingCompleteBody = extractOnGradingCompleteBody(appHtmlContent);
  });

  describe('Function extraction sanity checks', () => {
    it('should extract applyTeacherGrades function body', () => {
      expect(applyTeacherGradesBody).not.toBeNull();
      expect(applyTeacherGradesBody.length).toBeGreaterThan(100);
    });

    it('should extract onGradingComplete callback body', () => {
      expect(onGradingCompleteBody).not.toBeNull();
      expect(onGradingCompleteBody.length).toBeGreaterThan(100);
    });
  });

  describe('applyTeacherGrades() path', () => {
    it('should contain /api/progress POST', () => {
      // Using syncQueue.syncFetch instead of raw fetch for retry support
      expect(applyTeacherGradesBody).toMatch(/syncQueue\.syncFetch\(`\$\{SERVER_URL\}\/api\/progress`/);
    });

    it('should contain syncCartridgeProgress() call', () => {
      // Match the call, not the definition (no "function" keyword before it)
      const callPattern = /(?<!async function )syncCartridgeProgress\(\)/;
      expect(applyTeacherGradesBody).toMatch(callPattern);
    });

    it('should call syncCartridgeProgress() AFTER /api/progress POST', () => {
      const progressPostIndex = applyTeacherGradesBody.indexOf('/api/progress');
      const syncCallIndex = applyTeacherGradesBody.lastIndexOf('syncCartridgeProgress()');

      expect(progressPostIndex).toBeGreaterThan(-1);
      expect(syncCallIndex).toBeGreaterThan(-1);
      expect(syncCallIndex).toBeGreaterThan(progressPostIndex);
    });

    it('should have both calls within star earning block (results.allCorrect)', () => {
      // Find the if(results.allCorrect) block
      const allCorrectIndex = applyTeacherGradesBody.indexOf('results.allCorrect');
      expect(allCorrectIndex).toBeGreaterThan(-1);

      // The /api/progress POST and syncCartridgeProgress should come after allCorrect check
      const progressPostIndex = applyTeacherGradesBody.indexOf('/api/progress');
      const syncCallIndex = applyTeacherGradesBody.lastIndexOf('syncCartridgeProgress()');

      expect(progressPostIndex).toBeGreaterThan(allCorrectIndex);
      expect(syncCallIndex).toBeGreaterThan(allCorrectIndex);
    });

    it('should include weighted_points in progress POST body', () => {
      expect(applyTeacherGradesBody).toContain('weighted_points');
    });

    it('should include cartridge_id in progress POST body', () => {
      expect(applyTeacherGradesBody).toContain('cartridge_id');
    });
  });

  describe('onGradingComplete() path', () => {
    it('should contain /api/progress POST', () => {
      // Using syncQueue.syncFetch instead of raw fetch for retry support
      expect(onGradingCompleteBody).toMatch(/syncQueue\.syncFetch\(`\$\{SERVER_URL\}\/api\/progress`/);
    });

    it('should contain syncCartridgeProgress() call', () => {
      expect(onGradingCompleteBody).toContain('syncCartridgeProgress()');
    });

    it('should call syncCartridgeProgress() AFTER /api/progress POST', () => {
      const progressPostIndex = onGradingCompleteBody.indexOf('/api/progress');
      const syncCallIndex = onGradingCompleteBody.lastIndexOf('syncCartridgeProgress()');

      expect(progressPostIndex).toBeGreaterThan(-1);
      expect(syncCallIndex).toBeGreaterThan(-1);
      expect(syncCallIndex).toBeGreaterThan(progressPostIndex);
    });

    it('should have both calls within star earning block (results.allCorrect)', () => {
      const allCorrectIndex = onGradingCompleteBody.indexOf('results.allCorrect');
      expect(allCorrectIndex).toBeGreaterThan(-1);

      const progressPostIndex = onGradingCompleteBody.indexOf('/api/progress');
      const syncCallIndex = onGradingCompleteBody.lastIndexOf('syncCartridgeProgress()');

      expect(progressPostIndex).toBeGreaterThan(allCorrectIndex);
      expect(syncCallIndex).toBeGreaterThan(allCorrectIndex);
    });

    it('should include weighted_points in progress POST body', () => {
      expect(onGradingCompleteBody).toContain('weighted_points');
    });

    it('should include cartridge_id in progress POST body', () => {
      expect(onGradingCompleteBody).toContain('cartridge_id');
    });
  });

  describe('Star earning flow consistency between paths', () => {
    it('both paths should calculate starType the same way', () => {
      const starTypePattern = /const\s+starType\s*=\s*state\.game\.potentialStar\s*\|\|\s*['"]gold['"]/;
      expect(applyTeacherGradesBody).toMatch(starTypePattern);
      expect(onGradingCompleteBody).toMatch(starTypePattern);
    });

    it('both paths should call wsClient.notifyStarEarned()', () => {
      expect(applyTeacherGradesBody).toContain('wsClient.notifyStarEarned(');
      expect(onGradingCompleteBody).toContain('wsClient.notifyStarEarned(');
    });

    it('both paths should call classTime.recordStar()', () => {
      expect(applyTeacherGradesBody).toContain('classTime.recordStar(');
      expect(onGradingCompleteBody).toContain('classTime.recordStar(');
    });

    // Note: gameEngine.awardStar() is called internally by game-engine.js recordAttempt(),
    // not directly from app.html. Star tracking happens automatically through the grading flow.
  });
});

describe('syncCartridgeProgress() Function Structure', () => {
  let appHtmlContent;
  let syncFunctionBody;

  beforeAll(() => {
    appHtmlContent = fs.readFileSync(APP_HTML_PATH, 'utf-8');
    syncFunctionBody = extractFunctionBody(appHtmlContent, 'async function syncCartridgeProgress()');
  });

  it('should be defined as async function', () => {
    expect(syncFunctionBody).not.toBeNull();
    expect(syncFunctionBody).toContain('async function syncCartridgeProgress()');
  });

  it('should POST to /api/progress/cartridge-sync', () => {
    expect(syncFunctionBody).toContain('/api/progress/cartridge-sync');
  });

  it('should include username in request', () => {
    expect(syncFunctionBody).toContain('username');
  });

  it('should include cartridgeId in request', () => {
    expect(syncFunctionBody).toContain('cartridgeId');
  });

  it('should include stars data in request', () => {
    expect(syncFunctionBody).toContain('stars');
  });

  it('should include totalWeightedScore in request', () => {
    expect(syncFunctionBody).toContain('totalWeightedScore');
  });
});
