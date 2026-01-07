/**
 * Version Comparison Tests
 * Tests the semantic version comparison logic used for update checking
 */
import { describe, it, expect } from 'vitest';

/**
 * Compare semantic versions. Returns:
 *  1 if a > b
 *  0 if a == b
 * -1 if a < b
 *
 * This is a copy of the function from app.html for testing
 */
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

describe('Version Comparison', () => {
  // ==================== BASIC COMPARISONS ====================
  describe('Basic Comparisons', () => {
    it('returns 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
      expect(compareVersions('2.3.4', '2.3.4')).toBe(0);
    });

    it('returns 1 when first version is greater', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    });

    it('returns -1 when first version is smaller', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });
  });

  // ==================== MAJOR VERSION ====================
  describe('Major Version Changes', () => {
    it('detects major version increase', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(compareVersions('10.0.0', '9.99.99')).toBe(1);
    });

    it('detects major version decrease', () => {
      expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
    });
  });

  // ==================== MINOR VERSION ====================
  describe('Minor Version Changes', () => {
    it('detects minor version increase', () => {
      expect(compareVersions('1.1.0', '1.0.9')).toBe(1);
      expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    });

    it('detects minor version decrease', () => {
      expect(compareVersions('1.0.9', '1.1.0')).toBe(-1);
    });
  });

  // ==================== PATCH VERSION ====================
  describe('Patch Version Changes', () => {
    it('detects patch version increase', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
      expect(compareVersions('1.0.10', '1.0.9')).toBe(1);
    });

    it('detects patch version decrease', () => {
      expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles versions with different lengths', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0', '1.0')).toBe(0);
      expect(compareVersions('1.0.1', '1.0')).toBe(1);
      expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    });

    it('handles single digit versions', () => {
      expect(compareVersions('1', '1')).toBe(0);
      expect(compareVersions('2', '1')).toBe(1);
      expect(compareVersions('1', '2')).toBe(-1);
    });

    it('handles zero versions', () => {
      expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
      expect(compareVersions('0.0.1', '0.0.0')).toBe(1);
    });

    it('handles large version numbers', () => {
      expect(compareVersions('100.200.300', '100.200.299')).toBe(1);
      expect(compareVersions('100.200.300', '100.200.300')).toBe(0);
    });
  });

  // ==================== REAL-WORLD SCENARIOS ====================
  describe('Real-world Scenarios', () => {
    it('detects when server has newer version', () => {
      const clientVersion = '0.0.1';
      const serverVersion = '0.0.2';

      expect(compareVersions(serverVersion, clientVersion)).toBe(1);
    });

    it('detects when client is up to date', () => {
      const clientVersion = '0.0.1';
      const serverVersion = '0.0.1';

      expect(compareVersions(serverVersion, clientVersion)).toBe(0);
    });

    it('handles major update notification', () => {
      const clientVersion = '0.9.9';
      const serverVersion = '1.0.0';

      expect(compareVersions(serverVersion, clientVersion)).toBe(1);
    });
  });
});

describe('Update Check Logic', () => {
  it('should show notification when server version > client version', () => {
    const clientVersion = '0.0.1';
    const serverVersion = '0.0.2';

    const shouldShowNotification = compareVersions(serverVersion, clientVersion) > 0;
    expect(shouldShowNotification).toBe(true);
  });

  it('should NOT show notification when versions are equal', () => {
    const clientVersion = '0.0.1';
    const serverVersion = '0.0.1';

    const shouldShowNotification = compareVersions(serverVersion, clientVersion) > 0;
    expect(shouldShowNotification).toBe(false);
  });

  it('should NOT show notification when client is newer (edge case)', () => {
    const clientVersion = '0.0.2';
    const serverVersion = '0.0.1';

    const shouldShowNotification = compareVersions(serverVersion, clientVersion) > 0;
    expect(shouldShowNotification).toBe(false);
  });
});
