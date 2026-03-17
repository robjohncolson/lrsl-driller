import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConsoleCommands } from '../../platform/core/console-commands.js';

describe('ConsoleCommands', () => {
  let windowLike;
  let localStorageLike;
  let mockPlatform;
  let renderModeTabs;

  beforeEach(() => {
    windowLike = {};
    localStorageLike = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    mockPlatform = {
      gameEngine: { resetProgress: vi.fn(), getState: vi.fn() },
      currentCartridge: { manifest: { meta: { id: 'test-cart' } } }
    };
    renderModeTabs = vi.fn();

    const cmd = new ConsoleCommands({
      getPlatform: () => mockPlatform,
      getUserSystem: () => ({ currentUser: { username: 'alice' } }),
      renderModeTabs,
      windowLike,
      localStorageLike,
      confirmFn: vi.fn(() => true)
    });
    cmd.init();
  });

  it('should register all commands on window', () => {
    expect(typeof windowLike.resetProgress).toBe('function');
    expect(typeof windowLike.resetAllProgress).toBe('function');
    expect(typeof windowLike.setLocalServer).toBe('function');
    expect(typeof windowLike.setCloudServer).toBe('function');
    expect(typeof windowLike.getServerUrl).toBe('function');
  });

  describe('resetProgress', () => {
    it('should reset progress and call renderModeTabs when confirmed', () => {
      windowLike.resetProgress();
      expect(mockPlatform.gameEngine.resetProgress).toHaveBeenCalled();
      expect(renderModeTabs).toHaveBeenCalled();
    });

    it('should not reset when no cartridge loaded', () => {
      mockPlatform.gameEngine = null;
      windowLike.resetProgress();
      expect(renderModeTabs).not.toHaveBeenCalled();
    });

    it('should not reset when user cancels confirm', () => {
      const cmd = new ConsoleCommands({
        getPlatform: () => mockPlatform,
        getUserSystem: () => ({ currentUser: { username: 'alice' } }),
        renderModeTabs,
        windowLike,
        localStorageLike,
        confirmFn: vi.fn(() => false)
      });
      cmd.init();
      windowLike.resetProgress();
      expect(mockPlatform.gameEngine.resetProgress).not.toHaveBeenCalled();
    });
  });

  describe('resetAllProgress', () => {
    it('should clear driller_ keys from localStorage', () => {
      Object.defineProperty(localStorageLike, Symbol.iterator, {
        value: function* () { yield 'driller_a'; yield 'driller_b'; yield 'other'; }
      });
      // Need to make Object.keys work
      localStorageLike.driller_a = '1';
      localStorageLike.driller_b = '2';
      localStorageLike.other = '3';
      windowLike.resetAllProgress();
      expect(localStorageLike.removeItem).toHaveBeenCalledWith('driller_a');
      expect(localStorageLike.removeItem).toHaveBeenCalledWith('driller_b');
      expect(localStorageLike.removeItem).not.toHaveBeenCalledWith('other');
    });
  });

  describe('setLocalServer', () => {
    it('should set orbits_server_url to ws://ip:3001', () => {
      windowLike.setLocalServer('192.168.1.5');
      expect(localStorageLike.setItem).toHaveBeenCalledWith('orbits_server_url', 'ws://192.168.1.5:3001');
    });

    it('should default to localhost when no ip provided', () => {
      windowLike.setLocalServer();
      expect(localStorageLike.setItem).toHaveBeenCalledWith('orbits_server_url', 'ws://localhost:3001');
    });
  });

  describe('setCloudServer', () => {
    it('should set orbits_server_url to cloud', () => {
      windowLike.setCloudServer();
      expect(localStorageLike.setItem).toHaveBeenCalledWith('orbits_server_url', 'cloud');
    });
  });

  describe('getServerUrl', () => {
    it('should return saved custom URL', () => {
      localStorageLike.getItem.mockReturnValue('ws://192.168.1.5:3001');
      const url = windowLike.getServerUrl();
      expect(url).toBe('ws://192.168.1.5:3001');
    });

    it('should return default Railway URL when nothing saved', () => {
      localStorageLike.getItem.mockReturnValue(null);
      const url = windowLike.getServerUrl();
      expect(url).toBe('wss://lrsl-driller-production.up.railway.app');
    });
  });
});
