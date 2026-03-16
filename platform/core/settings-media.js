const SUPABASE_VIDEO_BASE = 'https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations';

function setClassPresence(element, className, present) {
  if (!element?.classList) return;
  if (present) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

function updateToggleUI({ dot, label, toggle, enabled, enabledText, disabledText }) {
  if (!dot || !label || !toggle) return;

  setClassPresence(dot, 'translate-x-6', enabled);
  setClassPresence(dot, 'translate-x-1', !enabled);
  label.textContent = enabled ? enabledText : disabledText;
  setClassPresence(toggle, 'bg-purple-600', enabled);
  setClassPresence(toggle, 'bg-gray-300', !enabled);
}

function getServerModeNote(provider) {
  if (provider === 'server-gemini') {
    return 'Using Gemini 2.5 Pro on server - no API key needed.';
  }
  if (provider === 'server-groq') {
    return 'Using Groq/Llama on server - no API key needed.';
  }
  return 'No API key needed - grading handled by server.';
}

function getPreferredProvider(provider) {
  if (provider === 'server-gemini') return 'gemini';
  if (provider === 'server-groq') return 'groq';
  return null;
}

export class SettingsMediaController {
  constructor(config = {}) {
    this.soundEngine = config.soundEngine || null;
    this.celebration = config.celebration || null;
    this.getAssetResolver = config.getAssetResolver || (() => null);
    this.getPlatform = config.getPlatform || (() => null);
    this.onProviderPreferenceChange = config.onProviderPreferenceChange || (() => {});
    this.importGhostOrbitsAudio = config.importGhostOrbitsAudio || (() => import('./ghost-orbits-audio.js'));
    this.documentLike = config.documentLike || globalThis.document || null;
    this.windowLike = config.windowLike || globalThis.window || globalThis;
    this.localStorageLike = config.localStorageLike || globalThis.localStorage || null;
    this.setTimeoutFn = config.setTimeoutFn || globalThis.setTimeout?.bind(globalThis);
    this.state = {
      globalMusicPlayer: null
    };
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  getStorageItem(key) {
    return this.localStorageLike?.getItem?.(key) ?? null;
  }

  setStorageItem(key, value) {
    this.localStorageLike?.setItem?.(key, String(value));
  }

  setSharedMusicPlayer(player) {
    this.state.globalMusicPlayer = player;

    if (this.windowLike) {
      this.windowLike.ghostOrbitsAudio = player;
      this.windowLike.globalMusicPlayer = player;
    }
  }

  openModal() {
    this.getElement('settings-modal')?.classList.remove('hidden');
    void this.initMusicSettings();
  }

  closeModal() {
    this.getElement('settings-modal')?.classList.add('hidden');
  }

  updateSoundUI() {
    if (!this.soundEngine) return;

    updateToggleUI({
      dot: this.getElement('sound-toggle-dot'),
      label: this.getElement('sound-toggle-label'),
      toggle: this.getElement('sound-toggle'),
      enabled: this.soundEngine.enabled,
      enabledText: 'Sound effects enabled',
      disabledText: 'Sound effects disabled'
    });
  }

  toggleSound() {
    if (!this.soundEngine) return;
    this.soundEngine.setEnabled(!this.soundEngine.enabled);
    this.updateSoundUI();
  }

  async initMusicSettings() {
    const sharedGhostAudio = this.windowLike?.ghostOrbitsAudio;
    const sharedMusicPlayer = this.windowLike?.globalMusicPlayer;

    if (sharedGhostAudio) {
      if (this.state.globalMusicPlayer && this.state.globalMusicPlayer !== sharedGhostAudio) {
        this.state.globalMusicPlayer.stopMusic?.();
      }
      this.setSharedMusicPlayer(sharedGhostAudio);
    } else if (this.state.globalMusicPlayer) {
      this.setSharedMusicPlayer(this.state.globalMusicPlayer);
    } else if (sharedMusicPlayer) {
      this.setSharedMusicPlayer(sharedMusicPlayer);
    } else {
      try {
        const module = await this.importGhostOrbitsAudio();
        const player = new module.GhostOrbitsAudio();
        player.init();
        this.setSharedMusicPlayer(player);
      } catch (err) {
        console.warn('[Music] Could not load audio module', err);
        return null;
      }
    }

    this.updateMusicUI();
    return this.state.globalMusicPlayer;
  }

  updateMusicUI() {
    const musicPlayer = this.state.globalMusicPlayer;
    if (!musicPlayer) return;

    const settings = musicPlayer.getMusicSettings();
    const trackSection = this.getElement('music-track-section');
    const trackSelect = this.getElement('music-track');
    const volumeSlider = this.getElement('music-volume');
    const volumeLabel = this.getElement('music-volume-label');

    updateToggleUI({
      dot: this.getElement('music-toggle-dot'),
      label: this.getElement('music-toggle-label'),
      toggle: this.getElement('music-toggle'),
      enabled: settings.enabled,
      enabledText: 'Music enabled',
      disabledText: 'Music disabled'
    });

    setClassPresence(trackSection, 'opacity-50', !settings.enabled);

    if (trackSelect) {
      trackSelect.disabled = !settings.enabled;
      trackSelect.value = settings.track;
    }

    if (volumeSlider) {
      volumeSlider.disabled = !settings.enabled;
      volumeSlider.value = Math.round(settings.volume * 100);
    }

    if (volumeLabel) {
      volumeLabel.textContent = `${Math.round(settings.volume * 100)}%`;
    }
  }

  toggleMusic() {
    const musicPlayer = this.state.globalMusicPlayer;
    if (!musicPlayer) return;

    const settings = musicPlayer.getMusicSettings();
    musicPlayer.setMusicEnabled(!settings.enabled);
    this.updateMusicUI();
  }

  setMusicTrack(track) {
    this.state.globalMusicPlayer?.setMusicTrack?.(track);
  }

  setMusicVolume(rawValue) {
    const musicPlayer = this.state.globalMusicPlayer;
    if (!musicPlayer) return;

    const volumePercent = Number.parseInt(rawValue, 10);
    if (Number.isNaN(volumePercent)) return;

    musicPlayer.setMusicVolume(volumePercent / 100);
    const volumeLabel = this.getElement('music-volume-label');
    if (volumeLabel) {
      volumeLabel.textContent = `${volumePercent}%`;
    }
  }

  updateNotificationsUI() {
    if (!this.celebration) return;

    const enabled = !this.celebration.notificationsMuted;
    updateToggleUI({
      dot: this.getElement('notifications-toggle-dot'),
      label: this.getElement('notifications-toggle-label'),
      toggle: this.getElement('notifications-toggle'),
      enabled,
      enabledText: 'Show when classmates earn stars',
      disabledText: 'Classmate notifications muted'
    });
  }

  toggleNotifications() {
    if (!this.celebration) return;
    const newMuted = !this.celebration.notificationsMuted;
    this.celebration.setNotificationsMuted(newMuted);
    this.updateNotificationsUI();
  }

  isUsingSupabaseVideos() {
    return this.getStorageItem('driller_useSupabaseVideos') === 'true';
  }

  initVideoSourceToggle() {
    const useSupabase = this.isUsingSupabaseVideos();

    updateToggleUI({
      dot: this.getElement('video-source-toggle-dot'),
      label: this.getElement('video-source-toggle-label'),
      toggle: this.getElement('video-source-toggle'),
      enabled: useSupabase,
      enabledText: 'Use Supabase cloud videos',
      disabledText: 'Use local videos'
    });
  }

  toggleVideoSource() {
    const useSupabase = !this.isUsingSupabaseVideos();
    this.setStorageItem('driller_useSupabaseVideos', useSupabase);
    this.initVideoSourceToggle();
    this.getAssetResolver()?.setUseSupabase?.(useSupabase);
    this.celebration?.showToast?.(
      useSupabase ? 'Using Supabase cloud videos' : 'Using local videos',
      'info'
    );
  }

  async preloadAnimations() {
    const platform = this.getPlatform();
    const manifest = platform?.currentCartridge?.manifest;
    const cartridgeId = manifest?.meta?.id;

    if (!manifest || !cartridgeId) {
      this.celebration?.showToast?.('Load a cartridge first', 'warning');
      return false;
    }

    const assetResolver = this.getAssetResolver();
    const button = this.getElement('preload-animations-btn');
    const progressContainer = this.getElement('preload-progress');
    const progressBar = this.getElement('preload-progress-bar');
    const progressText = this.getElement('preload-progress-text');

    if (!assetResolver || !button || !progressContainer || !progressBar || !progressText) {
      return false;
    }

    button.disabled = true;
    button.textContent = 'Loading...';
    progressContainer.classList.remove('hidden');

    try {
      await assetResolver.preloadCartridge(manifest, cartridgeId, (loaded, total) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        progressBar.style.width = `${pct}%`;
        progressText.textContent = `${loaded} / ${total}`;
      });

      button.textContent = 'Done!';
      button.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
      button.classList.add('bg-green-600');
      this.celebration?.showToast?.('All animations pre-loaded! Students can now get them via P2P.', 'success');

      this.setTimeoutFn?.(() => {
        button.disabled = false;
        button.textContent = 'Pre-Load Animations';
        button.classList.remove('bg-green-600');
        button.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
      }, 3000);

      return true;
    } catch (err) {
      console.error('Failed to pre-load animations:', err);
      button.disabled = false;
      button.textContent = 'Pre-Load Animations';
      progressContainer.classList.add('hidden');
      this.celebration?.showToast?.('Failed to pre-load animations', 'error');
      return false;
    }
  }

  resolveVideoUrl(manifestPath, cartridgeId, forceLocal = false) {
    if (!manifestPath || !cartridgeId) return null;

    if (!forceLocal && this.isUsingSupabaseVideos()) {
      const filename = manifestPath.replace('assets/', '');
      return `${SUPABASE_VIDEO_BASE}/${cartridgeId}/${filename}`;
    }

    return `/cartridges/${cartridgeId}/${manifestPath}`;
  }

  updateAiProviderUI(provider) {
    const keysSection = this.getElement('api-keys-section');
    const serverNote = this.getElement('server-mode-note');
    const isOwnKey = provider === 'gemini' || provider === 'groq';
    const isServer = provider?.startsWith?.('server');

    if (isOwnKey) {
      keysSection?.classList.remove('hidden');
      serverNote?.classList.add('hidden');
      return;
    }

    keysSection?.classList.add('hidden');
    if (isServer) {
      serverNote?.classList.remove('hidden');
      if (serverNote) {
        serverNote.textContent = getServerModeNote(provider);
      }
      return;
    }

    serverNote?.classList.add('hidden');
  }

  handleAiProviderChange(provider) {
    this.updateAiProviderUI(provider);
  }

  saveSettings() {
    const provider = this.getElement('ai-provider')?.value || 'server';
    const geminiKey = this.getElement('gemini-key-input')?.value || '';
    const groqKey = this.getElement('groq-key-input')?.value || '';

    this.setStorageItem('aiProvider', provider);
    if (geminiKey) this.setStorageItem('geminiApiKey', geminiKey);
    if (groqKey) this.setStorageItem('groqApiKey', groqKey);

    this.onProviderPreferenceChange(getPreferredProvider(provider));
    this.closeModal();
    this.celebration?.showToast?.('Settings saved!', 'success');

    return { provider, geminiKey, groqKey };
  }

  loadSettings() {
    const provider = this.getStorageItem('aiProvider') || 'server';
    const geminiKey = this.getStorageItem('geminiApiKey') || '';
    const groqKey = this.getStorageItem('groqApiKey') || '';

    const providerSelect = this.getElement('ai-provider');
    const geminiInput = this.getElement('gemini-key-input');
    const groqInput = this.getElement('groq-key-input');

    if (providerSelect) providerSelect.value = provider;
    if (geminiInput) geminiInput.value = geminiKey;
    if (groqInput) groqInput.value = groqKey;

    this.updateAiProviderUI(provider);
    this.updateSoundUI();
    this.updateNotificationsUI();
    this.initVideoSourceToggle();

    return { provider, geminiKey, groqKey };
  }

  installEventListeners() {
    this.getElement('settings-btn')?.addEventListener?.('click', () => this.openModal());
    this.getElement('close-settings')?.addEventListener?.('click', () => this.closeModal());
    this.getElement('sound-toggle')?.addEventListener?.('click', () => this.toggleSound());
    this.getElement('music-toggle')?.addEventListener?.('click', () => this.toggleMusic());
    this.getElement('music-track')?.addEventListener?.('change', (event) => this.setMusicTrack(event.target.value));
    this.getElement('music-volume')?.addEventListener?.('input', (event) => this.setMusicVolume(event.target.value));
    this.getElement('notifications-toggle')?.addEventListener?.('click', () => this.toggleNotifications());
    this.getElement('video-source-toggle')?.addEventListener?.('click', () => this.toggleVideoSource());
    this.getElement('preload-animations-btn')?.addEventListener?.('click', () => this.preloadAnimations());
    this.getElement('ai-provider')?.addEventListener?.('change', (event) => this.handleAiProviderChange(event.target.value));
    this.getElement('save-settings')?.addEventListener?.('click', () => this.saveSettings());
  }
}
