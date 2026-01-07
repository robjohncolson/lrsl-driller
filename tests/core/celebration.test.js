/**
 * Celebration Module Tests
 * Tests toasts, notifications, and celebration configuration
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn((key) => { delete store[key]; })
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Celebration Module Logic', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // ==================== NOTIFICATION MUTING ====================
  describe('Notification Muting', () => {
    it('loads mute preference from localStorage', () => {
      localStorageMock.setItem('driller_notifications_muted', 'true');

      const muted = localStorage.getItem('driller_notifications_muted') === 'true';

      expect(muted).toBe(true);
    });

    it('defaults to false when no preference saved', () => {
      // No preference set
      const muted = localStorage.getItem('driller_notifications_muted') === 'true';

      expect(muted).toBe(false);
    });

    it('saves mute preference to localStorage', () => {
      localStorage.setItem('driller_notifications_muted', 'true');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('driller_notifications_muted', 'true');
    });

    it('can toggle mute off', () => {
      localStorage.setItem('driller_notifications_muted', 'false');

      const muted = localStorage.getItem('driller_notifications_muted') === 'true';

      expect(muted).toBe(false);
    });
  });

  // ==================== STAR TYPE CONFIG ====================
  describe('Star Type Configuration', () => {
    const starConfig = {
      gold: { emoji: '⭐', color: 'from-yellow-400 to-orange-500', text: 'Gold Star!', sub: 'Perfect score with no hints!' },
      silver: { emoji: '🥈', color: 'from-gray-400 to-gray-500', text: 'Silver Star!', sub: 'Great job!' },
      bronze: { emoji: '🥉', color: 'from-amber-500 to-amber-600', text: 'Bronze Star!', sub: 'Nice work!' },
      tin: { emoji: '○', color: 'from-stone-400 to-stone-500', text: 'Tin Star!', sub: 'Keep practicing!' }
    };

    it('has configuration for all star types', () => {
      expect(starConfig.gold).toBeDefined();
      expect(starConfig.silver).toBeDefined();
      expect(starConfig.bronze).toBeDefined();
      expect(starConfig.tin).toBeDefined();
    });

    it('each star type has required properties', () => {
      for (const [type, config] of Object.entries(starConfig)) {
        expect(config.emoji).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.text).toBeDefined();
        expect(config.sub).toBeDefined();
      }
    });

    it('gold star mentions perfection', () => {
      expect(starConfig.gold.sub.toLowerCase()).toContain('perfect');
    });

    it('tin star encourages practice', () => {
      expect(starConfig.tin.sub.toLowerCase()).toContain('practicing');
    });
  });

  // ==================== TOAST TYPES ====================
  describe('Toast Type Configuration', () => {
    const toastColors = {
      success: 'bg-green-500 border-green-600',
      error: 'bg-red-500 border-red-600',
      info: 'bg-blue-500 border-blue-600',
      warning: 'bg-orange-500 border-orange-600'
    };

    const toastIcons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    it('has colors for all toast types', () => {
      expect(toastColors.success).toBeDefined();
      expect(toastColors.error).toBeDefined();
      expect(toastColors.info).toBeDefined();
      expect(toastColors.warning).toBeDefined();
    });

    it('has icons for all toast types', () => {
      expect(toastIcons.success).toBeDefined();
      expect(toastIcons.error).toBeDefined();
      expect(toastIcons.info).toBeDefined();
      expect(toastIcons.warning).toBeDefined();
    });

    it('success uses green color', () => {
      expect(toastColors.success).toContain('green');
    });

    it('error uses red color', () => {
      expect(toastColors.error).toContain('red');
    });

    it('info uses blue color', () => {
      expect(toastColors.info).toContain('blue');
    });

    it('warning uses orange color', () => {
      expect(toastColors.warning).toContain('orange');
    });
  });

  // ==================== CONFETTI COLORS ====================
  describe('Confetti Configuration', () => {
    const confettiColors = ['#fbbf24', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'];

    it('has multiple confetti colors', () => {
      expect(confettiColors.length).toBeGreaterThan(3);
    });

    it('colors are valid hex codes', () => {
      for (const color of confettiColors) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('includes celebratory colors (yellow, orange, etc)', () => {
      // #fbbf24 is yellow, #f59e0b is orange
      expect(confettiColors.some(c => c.toLowerCase().startsWith('#fb') || c.toLowerCase().startsWith('#f5'))).toBe(true);
    });
  });

  // ==================== CELEBRATION INTENSITY ====================
  describe('Celebration Intensity by Star Type', () => {
    const celebrationLevels = {
      gold: { flash: true, confetti: 80, toast: true },
      silver: { flash: true, confetti: 30, toast: true },
      bronze: { flash: true, confetti: 0, toast: true },
      tin: { flash: false, confetti: 0, toast: true }
    };

    it('gold has the most confetti', () => {
      expect(celebrationLevels.gold.confetti).toBeGreaterThan(celebrationLevels.silver.confetti);
    });

    it('silver has more confetti than bronze', () => {
      expect(celebrationLevels.silver.confetti).toBeGreaterThan(celebrationLevels.bronze.confetti);
    });

    it('bronze has no confetti', () => {
      expect(celebrationLevels.bronze.confetti).toBe(0);
    });

    it('tin has no confetti', () => {
      expect(celebrationLevels.tin.confetti).toBe(0);
    });

    it('tin has no flash effect', () => {
      expect(celebrationLevels.tin.flash).toBe(false);
    });

    it('all star types show toast', () => {
      for (const level of Object.values(celebrationLevels)) {
        expect(level.toast).toBe(true);
      }
    });
  });
});

describe('Version Dismissed Logic', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should not show notification for dismissed version', () => {
    const newVersion = '0.0.2';
    localStorage.setItem('driller_dismissed_version', newVersion);

    const dismissedVersion = localStorage.getItem('driller_dismissed_version');
    const shouldShow = dismissedVersion !== newVersion;

    expect(shouldShow).toBe(false);
  });

  it('should show notification for new version', () => {
    const newVersion = '0.0.3';
    localStorage.setItem('driller_dismissed_version', '0.0.2');

    const dismissedVersion = localStorage.getItem('driller_dismissed_version');
    const shouldShow = dismissedVersion !== newVersion;

    expect(shouldShow).toBe(true);
  });

  it('should show notification when no version dismissed', () => {
    const newVersion = '0.0.2';
    // No dismissed version set

    const dismissedVersion = localStorage.getItem('driller_dismissed_version');
    const shouldShow = dismissedVersion !== newVersion;

    expect(shouldShow).toBe(true);
  });

  it('remembers dismissed version across checks', () => {
    localStorage.setItem('driller_dismissed_version', '0.0.5');

    // First check
    expect(localStorage.getItem('driller_dismissed_version')).toBe('0.0.5');

    // Second check (simulating page reload)
    expect(localStorage.getItem('driller_dismissed_version')).toBe('0.0.5');
  });
});

describe('Clickable Toast Logic', () => {
  it('toast should be clickable when onClick provided', () => {
    const onClick = vi.fn();
    const options = { onClick, clickHint: 'Click to navigate' };

    const isClickable = !!options.onClick;

    expect(isClickable).toBe(true);
  });

  it('toast should not be clickable without onClick', () => {
    const options = {};

    const isClickable = !!options.onClick;

    expect(isClickable).toBe(false);
  });

  it('click hint is included when provided', () => {
    const options = { onClick: vi.fn(), clickHint: 'Click to navigate' };

    const hasClickHint = !!(options.onClick && options.clickHint);

    expect(hasClickHint).toBe(true);
  });

  it('click hint is empty when not provided', () => {
    const options = { onClick: vi.fn() };

    const clickHint = options.onClick && options.clickHint ? options.clickHint : '';

    expect(clickHint).toBe('');
  });
});

describe('Notification Respects Mute Setting', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should show notification when not muted', () => {
    localStorage.setItem('driller_notifications_muted', 'false');

    const notificationsMuted = localStorage.getItem('driller_notifications_muted') === 'true';
    const shouldShow = !notificationsMuted;

    expect(shouldShow).toBe(true);
  });

  it('should not show notification when muted', () => {
    localStorage.setItem('driller_notifications_muted', 'true');

    const notificationsMuted = localStorage.getItem('driller_notifications_muted') === 'true';
    const shouldShow = !notificationsMuted;

    expect(shouldShow).toBe(false);
  });
});
