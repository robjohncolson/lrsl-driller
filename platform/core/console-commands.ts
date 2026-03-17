import type { PlatformLike, StorageLike, UserSystemLike } from './types';

/**
 * Console Commands - window-level debug helpers for the browser console.
 *
 * Extracted from app.html (opportunistic extraction pass).
 */
interface ConsoleWindowLike {
  resetProgress?: () => void;
  resetAllProgress?: () => void;
  setLocalServer?: (ip?: string) => void;
  setCloudServer?: () => void;
  getServerUrl?: () => string;
}

interface StorageMapLike extends StorageLike {
  [key: string]: unknown;
}

interface ConsoleCommandsConfig {
  getPlatform?: () => PlatformLike | null;
  getUserSystem?: () => UserSystemLike | null;
  renderModeTabs?: () => void;
  windowLike?: ConsoleWindowLike;
  localStorageLike?: StorageMapLike;
  confirmFn?: (message: string) => boolean;
}

export class ConsoleCommands {
  getPlatform: () => PlatformLike | null;
  getUserSystem: () => UserSystemLike | null;
  renderModeTabs: () => void;
  windowLike: ConsoleWindowLike;
  localStorageLike: StorageMapLike;
  confirmFn?: (message: string) => boolean;

  constructor(config: ConsoleCommandsConfig = {}) {
    this.getPlatform = config.getPlatform || (() => null);
    this.getUserSystem = config.getUserSystem || (() => null);
    this.renderModeTabs = config.renderModeTabs || (() => {});
    this.windowLike = config.windowLike || (globalThis as unknown as ConsoleWindowLike);
    this.localStorageLike = config.localStorageLike || (globalThis.localStorage as StorageMapLike);
    this.confirmFn = config.confirmFn || globalThis.confirm?.bind(globalThis);
  }

  init(): void {
    const self = this;

    this.windowLike.resetProgress = function() {
      const platform = self.getPlatform();
      if (!platform?.gameEngine) {
        console.error('No cartridge loaded. Load a cartridge first.');
        return;
      }
      const cartridgeId = platform.currentCartridge?.manifest?.meta?.id || 'unknown';
      const username = self.getUserSystem()?.currentUser?.username || 'you';
      if (!self.confirmFn?.(`Reset progress for "${cartridgeId}" (affects only ${username} on this browser)?\n\nThis cannot be undone.`)) {
        console.log('Reset cancelled.');
        return;
      }
      platform.gameEngine.resetProgress();
      self.renderModeTabs();
      console.log(`Progress reset for "${cartridgeId}".`);
      console.log('  Only Level 1 is now unlocked');
      console.log('  This only affects localStorage (your browser)');
      console.log('  Server leaderboard stats are NOT affected');
      console.log('Refresh the page to continue.');
    };

    this.windowLike.resetAllProgress = function() {
      if (!self.confirmFn?.('Reset ALL progress for ALL cartridges? This cannot be undone.')) {
        console.log('Reset cancelled.');
        return;
      }
      const keys = Object.keys(self.localStorageLike).filter((k) => k.startsWith('driller_'));
      keys.forEach((k) => self.localStorageLike.removeItem(k));
      console.log(`Cleared ${keys.length} saved items. Refresh the page to start fresh.`);
    };

    this.windowLike.setLocalServer = function(ip) {
      const port = 3001;
      const url = ip ? `ws://${ip}:${port}` : 'ws://localhost:3001';
      self.localStorageLike.setItem('orbits_server_url', url);
      console.log(`Multiplayer server set to: ${url}`);
      console.log('  Refresh the page, then open multiplayer to connect to the local server.');
    };

    this.windowLike.setCloudServer = function() {
      self.localStorageLike.setItem('orbits_server_url', 'cloud');
      console.log('Multiplayer server set to Railway (cloud)');
      console.log('  This preference is saved. Auto-discovery will be skipped.');
    };

    this.windowLike.getServerUrl = function() {
      const saved = self.localStorageLike.getItem('orbits_server_url');
      if (saved === 'cloud') {
        console.log('Current server: Railway cloud (explicit preference)');
      } else if (saved) {
        console.log(`Current server: ${saved} (custom)`);
      } else {
        console.log('Current server: Auto-detect (local if available, otherwise Railway)');
      }
      return saved || 'wss://lrsl-driller-production.up.railway.app';
    };

    console.log('Console commands available:');
    console.log('  resetProgress()    - Reset progress for current cartridge');
    console.log('  resetAllProgress() - Reset ALL cartridge progress (nuclear option)');
    console.log('  setLocalServer(ip) - Connect to local LAN server (e.g., setLocalServer("192.168.1.100"))');
    console.log('  setCloudServer()   - Reset to Railway cloud server');
    console.log('  getServerUrl()     - Show current multiplayer server');
  }
}
