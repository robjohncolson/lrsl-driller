/**
 * URL Deep Linking Tests
 * Tests for the URL parameter handling that allows direct access to specific levels
 * v4.3.3 - Teachers get direct access, students get access with toast notification
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the cartridge registry
const mockRegistry = {
  cartridges: [
    { id: 'apstatu4l1l2', aliases: ['prob', 'apstatu4', 'probability'] },
    { id: 'sampling', aliases: [] },
    { id: 'residuals', aliases: [] }
  ]
};

// Mock modes for apstatu4l1l2
const mockModes = [
  { id: 'l01-vocab', name: '4.1a: Random Process Vocabulary', unlockedBy: 'default' },
  { id: 'l02-outcome-event', name: '4.1b: Outcome vs Event', unlockedBy: { gold: 1 } },
  { id: 'l12-sample-space', name: '4.3a: Sample Space', unlockedBy: { gold: 11 } },
  { id: 'l17-mutually-exclusive-def', name: '4.4a: Mutually Exclusive Definition', unlockedBy: { gold: 16 } },
  { id: 'l24-mixed-44-45', name: '4.4-4.5 Capstone', unlockedBy: { gold: 23 } }
];

describe('URL Deep Linking', () => {
  describe('URL Parameter Parsing', () => {
    it('extracts cartridge parameter from URL', () => {
      const params = new URLSearchParams('?cartridge=apstatu4l1l2');
      expect(params.get('cartridge')).toBe('apstatu4l1l2');
    });

    it('extracts level parameter from URL', () => {
      const params = new URLSearchParams('?cartridge=apstatu4l1l2&level=l12-sample-space');
      expect(params.get('level')).toBe('l12-sample-space');
    });

    it('extracts start parameter from URL', () => {
      const params = new URLSearchParams('?cartridge=apstatu4l1l2&start=11');
      expect(params.get('start')).toBe('11');
    });

    it('handles combined parameters', () => {
      const params = new URLSearchParams('?cartridge=apstatu4l1l2&level=l12-sample-space&mode=practice');
      expect(params.get('cartridge')).toBe('apstatu4l1l2');
      expect(params.get('level')).toBe('l12-sample-space');
      expect(params.get('mode')).toBe('practice');
    });
  });

  describe('Cartridge ID Resolution', () => {
    function resolveCartridgeId(inputId) {
      // Find by direct ID match
      const direct = mockRegistry.cartridges.find(c => c.id === inputId);
      if (direct) return direct.id;

      // Find by alias
      const byAlias = mockRegistry.cartridges.find(c => c.aliases.includes(inputId));
      return byAlias ? byAlias.id : null;
    }

    it('resolves direct cartridge ID', () => {
      expect(resolveCartridgeId('apstatu4l1l2')).toBe('apstatu4l1l2');
    });

    it('resolves cartridge by alias "prob"', () => {
      expect(resolveCartridgeId('prob')).toBe('apstatu4l1l2');
    });

    it('resolves cartridge by alias "apstatu4"', () => {
      expect(resolveCartridgeId('apstatu4')).toBe('apstatu4l1l2');
    });

    it('resolves cartridge by alias "probability"', () => {
      expect(resolveCartridgeId('probability')).toBe('apstatu4l1l2');
    });

    it('returns null for unknown cartridge ID', () => {
      expect(resolveCartridgeId('nonexistent')).toBeNull();
    });
  });

  describe('Level Resolution by Mode ID', () => {
    function findModeByLevelId(levelId) {
      return mockModes.find(m => m.id === levelId);
    }

    it('finds mode by exact level ID', () => {
      const mode = findModeByLevelId('l12-sample-space');
      expect(mode).toBeDefined();
      expect(mode.name).toBe('4.3a: Sample Space');
    });

    it('finds default level', () => {
      const mode = findModeByLevelId('l01-vocab');
      expect(mode).toBeDefined();
      expect(mode.unlockedBy).toBe('default');
    });

    it('returns undefined for non-existent level', () => {
      const mode = findModeByLevelId('l99-fake-level');
      expect(mode).toBeUndefined();
    });
  });

  describe('Level Resolution by Start Index', () => {
    function findModeByStartIndex(index) {
      return mockModes[index];
    }

    it('finds mode by start index 0', () => {
      const mode = findModeByStartIndex(0);
      expect(mode.id).toBe('l01-vocab');
    });

    it('finds mode by start index 2', () => {
      const mode = findModeByStartIndex(2);
      expect(mode.id).toBe('l12-sample-space');
    });

    it('returns undefined for out-of-bounds index', () => {
      const mode = findModeByStartIndex(100);
      expect(mode).toBeUndefined();
    });
  });

  describe('Unlock Status Check', () => {
    // Simulate game state with unlocked tiers
    const mockGameState = {
      unlockedTiers: ['l01-vocab', 'l02-outcome-event', 'l03-independence']
    };

    function isLevelUnlockedForStudent(levelId) {
      return mockGameState.unlockedTiers.includes(levelId);
    }

    it('returns true for unlocked levels', () => {
      expect(isLevelUnlockedForStudent('l01-vocab')).toBe(true);
      expect(isLevelUnlockedForStudent('l02-outcome-event')).toBe(true);
    });

    it('returns false for locked levels', () => {
      expect(isLevelUnlockedForStudent('l12-sample-space')).toBe(false);
      expect(isLevelUnlockedForStudent('l24-mixed-44-45')).toBe(false);
    });
  });

  describe('Access Control Logic', () => {
    const mockGameState = {
      unlockedTiers: ['l01-vocab', 'l02-outcome-event']
    };

    function determineAccessBehavior(levelId, isTeacher) {
      const isUnlocked = mockGameState.unlockedTiers.includes(levelId);

      // URL deep links always allow access
      const canAccess = true;

      // Notification logic
      const showNotification = !isTeacher && !isUnlocked;

      return { canAccess, showNotification };
    }

    describe('Teacher Access', () => {
      it('allows teacher access to unlocked level without notification', () => {
        const result = determineAccessBehavior('l01-vocab', true);
        expect(result.canAccess).toBe(true);
        expect(result.showNotification).toBe(false);
      });

      it('allows teacher access to locked level without notification', () => {
        const result = determineAccessBehavior('l12-sample-space', true);
        expect(result.canAccess).toBe(true);
        expect(result.showNotification).toBe(false);
      });

      it('allows teacher access to any capstone level without notification', () => {
        const result = determineAccessBehavior('l24-mixed-44-45', true);
        expect(result.canAccess).toBe(true);
        expect(result.showNotification).toBe(false);
      });
    });

    describe('Student Access', () => {
      it('allows student access to unlocked level without notification', () => {
        const result = determineAccessBehavior('l01-vocab', false);
        expect(result.canAccess).toBe(true);
        expect(result.showNotification).toBe(false);
      });

      it('allows student access to locked level with notification', () => {
        const result = determineAccessBehavior('l12-sample-space', false);
        expect(result.canAccess).toBe(true);
        expect(result.showNotification).toBe(true);
      });

      it('allows student access to capstone level with notification', () => {
        const result = determineAccessBehavior('l24-mixed-44-45', false);
        expect(result.canAccess).toBe(true);
        expect(result.showNotification).toBe(true);
      });
    });
  });

  describe('Toast Notification Generation', () => {
    function generateToastMessage(modeName) {
      return {
        title: '📍 Direct Link Access',
        body: `Level "${modeName}" is normally locked. Complete earlier levels to unlock it in the main progression.`
      };
    }

    it('generates appropriate toast message for locked level', () => {
      const toast = generateToastMessage('4.3a: Sample Space');
      expect(toast.title).toBe('📍 Direct Link Access');
      expect(toast.body).toContain('4.3a: Sample Space');
      expect(toast.body).toContain('normally locked');
    });

    it('includes guidance about progression', () => {
      const toast = generateToastMessage('4.4a: Mutually Exclusive Definition');
      expect(toast.body).toContain('Complete earlier levels');
    });
  });

  describe('Complete URL Deep Link Flow', () => {
    function simulateDeepLinkNavigation(urlParams, isTeacher) {
      // Parse URL
      const params = new URLSearchParams(urlParams);
      const cartridgeId = params.get('cartridge');
      const levelId = params.get('level');
      const startIndex = params.get('start');

      // Simulate game state
      const unlockedTiers = ['l01-vocab', 'l02-outcome-event'];

      // Resolve target mode
      let targetMode = null;
      if (levelId) {
        targetMode = mockModes.find(m => m.id === levelId);
      } else if (startIndex !== null) {
        targetMode = mockModes[parseInt(startIndex)];
      }

      if (!targetMode) {
        return { success: false, error: 'Level not found' };
      }

      // Determine access behavior
      const isUnlocked = unlockedTiers.includes(targetMode.id);
      const showNotification = !isTeacher && !isUnlocked;

      return {
        success: true,
        cartridgeId,
        targetModeId: targetMode.id,
        targetModeName: targetMode.name,
        showNotification
      };
    }

    it('handles complete teacher deep link to locked level', () => {
      const result = simulateDeepLinkNavigation('?cartridge=apstatu4l1l2&level=l12-sample-space', true);
      expect(result.success).toBe(true);
      expect(result.targetModeId).toBe('l12-sample-space');
      expect(result.showNotification).toBe(false);
    });

    it('handles complete student deep link to locked level', () => {
      const result = simulateDeepLinkNavigation('?cartridge=apstatu4l1l2&level=l12-sample-space', false);
      expect(result.success).toBe(true);
      expect(result.targetModeId).toBe('l12-sample-space');
      expect(result.showNotification).toBe(true);
    });

    it('handles student deep link to unlocked level', () => {
      const result = simulateDeepLinkNavigation('?cartridge=apstatu4l1l2&level=l01-vocab', false);
      expect(result.success).toBe(true);
      expect(result.targetModeId).toBe('l01-vocab');
      expect(result.showNotification).toBe(false);
    });

    it('handles deep link with start index', () => {
      const result = simulateDeepLinkNavigation('?cartridge=apstatu4l1l2&start=2', false);
      expect(result.success).toBe(true);
      expect(result.targetModeId).toBe('l12-sample-space');
      expect(result.showNotification).toBe(true);
    });

    it('handles invalid level ID gracefully', () => {
      const result = simulateDeepLinkNavigation('?cartridge=apstatu4l1l2&level=invalid-level', false);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Quick Reference URLs', () => {
    // Verify quick reference URL patterns work correctly
    const quickReferenceUrls = [
      { level: 'l01-vocab', topic: '4.1a' },
      { level: 'l12-sample-space', topic: '4.3a' },
      { level: 'l17-mutually-exclusive-def', topic: '4.4a' },
      { level: 'l24-mixed-44-45', topic: 'Capstone' }
    ];

    quickReferenceUrls.forEach(({ level, topic }) => {
      it(`resolves quick reference for ${topic} (${level})`, () => {
        const mode = mockModes.find(m => m.id === level);
        expect(mode).toBeDefined();
        expect(mode.id).toBe(level);
      });
    });
  });
});
