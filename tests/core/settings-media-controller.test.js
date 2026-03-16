import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SettingsMediaController } from '../../platform/core/settings-media.js';

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

function createElement({ classes = [], value = '', textContent = '' } = {}) {
  const handlers = new Map();

  return {
    classList: createClassList(classes),
    value,
    textContent,
    disabled: false,
    innerHTML: '',
    style: {},
    addEventListener(eventName, handler) {
      handlers.set(eventName, handler);
    },
    dispatch(eventName, detail = {}) {
      const handler = handlers.get(eventName);
      if (handler) {
        handler({ target: this, ...detail });
      }
    }
  };
}

function createLocalStorage(initialValues = {}) {
  const store = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}

function createDocumentLike() {
  const elements = new Map([
    ['settings-modal', createElement({ classes: ['hidden'] })],
    ['ai-provider', createElement({ value: 'server' })],
    ['gemini-key-input', createElement()],
    ['groq-key-input', createElement()],
    ['api-keys-section', createElement({ classes: ['hidden'] })],
    ['server-mode-note', createElement({ classes: ['hidden'] })],
    ['sound-toggle', createElement()],
    ['sound-toggle-dot', createElement({ classes: ['translate-x-6'] })],
    ['sound-toggle-label', createElement()],
    ['music-toggle', createElement({ classes: ['bg-gray-300'] })],
    ['music-toggle-dot', createElement({ classes: ['translate-x-1'] })],
    ['music-toggle-label', createElement()],
    ['music-track-section', createElement()],
    ['music-track', createElement({ value: 'pulse' })],
    ['music-volume', createElement({ value: '50' })],
    ['music-volume-label', createElement()],
    ['notifications-toggle', createElement()],
    ['notifications-toggle-dot', createElement({ classes: ['translate-x-6'] })],
    ['notifications-toggle-label', createElement()],
    ['video-source-toggle', createElement({ classes: ['bg-gray-300'] })],
    ['video-source-toggle-dot', createElement({ classes: ['translate-x-1'] })],
    ['video-source-toggle-label', createElement()],
    ['preload-animations-btn', createElement({ classes: ['bg-indigo-600', 'hover:bg-indigo-700'], textContent: 'Pre-Load Animations' })],
    ['preload-progress', createElement({ classes: ['hidden'] })],
    ['preload-progress-bar', createElement()],
    ['preload-progress-text', createElement({ textContent: '0 / 0' })],
    ['settings-btn', createElement()],
    ['close-settings', createElement()],
    ['save-settings', createElement()]
  ]);

  return {
    getElementById(id) {
      return elements.get(id) || null;
    }
  };
}

function createController(overrides = {}) {
  const documentLike = overrides.documentLike || createDocumentLike();
  const celebration = overrides.celebration || {
    notificationsMuted: false,
    setNotificationsMuted: vi.fn(function setNotificationsMuted(muted) {
      this.notificationsMuted = muted;
    }),
    showToast: vi.fn()
  };

  return new SettingsMediaController({
    soundEngine: overrides.soundEngine || {
      enabled: true,
      setEnabled: vi.fn(function setEnabled(enabled) {
        this.enabled = enabled;
      })
    },
    celebration,
    getAssetResolver: overrides.getAssetResolver || (() => ({
      setUseSupabase: vi.fn(),
      preloadCartridge: vi.fn(async () => {})
    })),
    getPlatform: overrides.getPlatform || (() => null),
    onProviderPreferenceChange: overrides.onProviderPreferenceChange || vi.fn(),
    importGhostOrbitsAudio: overrides.importGhostOrbitsAudio || vi.fn(async () => ({
      GhostOrbitsAudio: class GhostOrbitsAudio {
        init() {}
        getMusicSettings() {
          return { enabled: true, track: 'pulse', volume: 0.35 };
        }
        setMusicEnabled() {}
        setMusicTrack() {}
        setMusicVolume() {}
      }
    })),
    documentLike,
    windowLike: overrides.windowLike || {},
    localStorageLike: overrides.localStorageLike || createLocalStorage(),
    setTimeoutFn: overrides.setTimeoutFn || vi.fn()
  });
}

describe('Settings media extraction', () => {
  it('imports and wires the shared settings media controller', () => {
    expect(appHtmlContent).toContain("import { SettingsMediaController } from './core/settings-media.js';");
    expect(appHtmlContent).toContain('settingsMediaController = new SettingsMediaController({');
    expect(appHtmlContent).toContain('settingsMediaController.installEventListeners();');
  });

  it('loads persisted AI, sound, notification, and video settings into the modal UI', () => {
    const documentLike = createDocumentLike();
    const localStorageLike = createLocalStorage({
      aiProvider: 'server-groq',
      geminiApiKey: 'gem-key',
      groqApiKey: 'groq-key',
      driller_useSupabaseVideos: 'true'
    });
    const celebration = {
      notificationsMuted: true,
      setNotificationsMuted: vi.fn(),
      showToast: vi.fn()
    };
    const soundEngine = {
      enabled: false,
      setEnabled: vi.fn()
    };
    const controller = createController({
      documentLike,
      localStorageLike,
      celebration,
      soundEngine
    });

    controller.loadSettings();

    expect(documentLike.getElementById('ai-provider').value).toBe('server-groq');
    expect(documentLike.getElementById('gemini-key-input').value).toBe('gem-key');
    expect(documentLike.getElementById('groq-key-input').value).toBe('groq-key');
    expect(documentLike.getElementById('server-mode-note').textContent).toBe('Using Groq/Llama on server - no API key needed.');
    expect(documentLike.getElementById('server-mode-note').classList.contains('hidden')).toBe(false);
    expect(documentLike.getElementById('sound-toggle-label').textContent).toBe('Sound effects disabled');
    expect(documentLike.getElementById('notifications-toggle-label').textContent).toBe('Classmate notifications muted');
    expect(documentLike.getElementById('video-source-toggle-label').textContent).toBe('Use Supabase cloud videos');
    expect(documentLike.getElementById('video-source-toggle-dot').classList.contains('translate-x-6')).toBe(true);
  });

  it('creates or reuses the shared music player and syncs the music controls', async () => {
    const documentLike = createDocumentLike();
    const windowLike = {};
    const init = vi.fn();
    const controller = createController({
      documentLike,
      windowLike,
      importGhostOrbitsAudio: vi.fn(async () => ({
        GhostOrbitsAudio: class GhostOrbitsAudio {
          init = init;
          getMusicSettings() {
            return { enabled: true, track: 'arcade', volume: 0.42 };
          }
          setMusicEnabled() {}
          setMusicTrack() {}
          setMusicVolume() {}
        }
      }))
    });

    await controller.initMusicSettings();
    controller.openModal();

    expect(documentLike.getElementById('settings-modal').classList.contains('hidden')).toBe(false);
    expect(init).toHaveBeenCalled();
    expect(windowLike.ghostOrbitsAudio).toBe(windowLike.globalMusicPlayer);
    expect(documentLike.getElementById('music-toggle-label').textContent).toBe('Music enabled');
    expect(documentLike.getElementById('music-track').value).toBe('arcade');
    expect(documentLike.getElementById('music-volume-label').textContent).toBe('42%');
  });

  it('toggles video source preference and resolves fallback animation URLs', () => {
    const documentLike = createDocumentLike();
    const localStorageLike = createLocalStorage();
    const setUseSupabase = vi.fn();
    const celebration = {
      notificationsMuted: false,
      setNotificationsMuted: vi.fn(),
      showToast: vi.fn()
    };
    const controller = createController({
      documentLike,
      localStorageLike,
      celebration,
      getAssetResolver: () => ({ setUseSupabase })
    });

    controller.toggleVideoSource();

    expect(localStorageLike.getItem('driller_useSupabaseVideos')).toBe('true');
    expect(setUseSupabase).toHaveBeenCalledWith(true);
    expect(celebration.showToast).toHaveBeenCalledWith('Using Supabase cloud videos', 'info');
    expect(controller.resolveVideoUrl('assets/demo.mp4', 'cart-1')).toBe(
      'https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart-1/demo.mp4'
    );
    expect(controller.resolveVideoUrl('assets/demo.mp4', 'cart-1', true)).toBe('/cartridges/cart-1/assets/demo.mp4');
  });

  it('saves AI settings, updates provider preference, and can preload animations for the current cartridge', async () => {
    const documentLike = createDocumentLike();
    documentLike.getElementById('ai-provider').value = 'server-gemini';
    documentLike.getElementById('gemini-key-input').value = 'new-gemini-key';
    const localStorageLike = createLocalStorage();
    const onProviderPreferenceChange = vi.fn();
    const celebration = {
      notificationsMuted: false,
      setNotificationsMuted: vi.fn(),
      showToast: vi.fn()
    };
    const preloadCartridge = vi.fn(async (manifest, cartridgeId, onProgress) => {
      onProgress(2, 4);
      onProgress(4, 4);
    });
    const controller = createController({
      documentLike,
      localStorageLike,
      celebration,
      onProviderPreferenceChange,
      getPlatform: () => ({
        currentCartridge: {
          manifest: {
            meta: { id: 'lsrl-interpretation' }
          }
        }
      }),
      getAssetResolver: () => ({ setUseSupabase: vi.fn(), preloadCartridge }),
      setTimeoutFn: vi.fn()
    });

    controller.saveSettings();
    const preloadResult = await controller.preloadAnimations();

    expect(localStorageLike.getItem('aiProvider')).toBe('server-gemini');
    expect(localStorageLike.getItem('geminiApiKey')).toBe('new-gemini-key');
    expect(onProviderPreferenceChange).toHaveBeenCalledWith('gemini');
    expect(documentLike.getElementById('settings-modal').classList.contains('hidden')).toBe(true);
    expect(preloadResult).toBe(true);
    expect(preloadCartridge).toHaveBeenCalled();
    expect(documentLike.getElementById('preload-progress').classList.contains('hidden')).toBe(false);
    expect(documentLike.getElementById('preload-progress-bar').style.width).toBe('100%');
    expect(documentLike.getElementById('preload-progress-text').textContent).toBe('4 / 4');
    expect(documentLike.getElementById('preload-animations-btn').textContent).toBe('Done!');
    expect(celebration.showToast).toHaveBeenCalledWith('All animations pre-loaded! Students can now get them via P2P.', 'success');
  });
});
