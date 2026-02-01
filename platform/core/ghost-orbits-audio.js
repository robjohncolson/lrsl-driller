/**
 * Ghost Orbits Audio System
 * Atari 70's Pong-esque synth sounds using Web Audio API
 *
 * Features:
 * - RetroSynth class for low-level audio generation
 * - GhostOrbitsAudio class with game-specific sounds
 * - Lazy AudioContext initialization (user gesture required)
 * - Volume control and mute toggle
 */

/**
 * Sound definitions from spec section 8.5
 */
const SOUNDS = {
  // Movement - low synth tones
  thrust: {
    type: 'sine',
    freq: 80,           // Low rumble
    duration: 50,       // Short burst (ms)
    volume: 0.3
  },

  // Trail drops - subtle blips
  trailDrop: {
    type: 'square',
    freq: 440,          // A4
    duration: 20,
    volume: 0.1
  },

  // Collisions - satisfying crunch
  bounce: {
    type: 'noise',
    freq: 220,
    duration: 80,
    decay: 0.8,
    volume: 0.4
  },

  // Absorption - descending tone
  absorb: {
    type: 'sawtooth',
    startFreq: 880,
    endFreq: 110,
    duration: 300,
    volume: 0.5
  },

  // Elimination - 8-bit death jingle
  eliminated: {
    notes: [523, 392, 330, 262],  // C5, G4, E4, C4 (descending)
    noteDuration: 100,
    type: 'square'
  },

  // Victory - triumphant arpeggio
  victory: {
    notes: [262, 330, 392, 523, 659, 784],  // C major ascending
    noteDuration: 80,
    type: 'square'
  },

  // Round start countdown
  countdown: {
    type: 'sine',
    freq: 440,
    duration: 200,
    volume: 0.6
  },

  // Round start "GO!"
  go: {
    type: 'square',
    freq: 880,
    duration: 400,
    volume: 0.7
  }
};

/**
 * RetroSynth - Low-level Web Audio API synthesizer
 * Generates Atari 70's style synth sounds
 */
class RetroSynth {
  constructor() {
    this._audioContext = null;
    this._masterGain = null;
    this._volume = 1.0;
    this._muted = false;
  }

  /**
   * Lazily initialize AudioContext (must be called after user gesture)
   * @returns {AudioContext}
   */
  _getContext() {
    if (!this._audioContext) {
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._audioContext.createGain();
      this._masterGain.connect(this._audioContext.destination);
      this._updateMasterGain();
    }

    // Resume context if suspended (browser autoplay policy)
    if (this._audioContext.state === 'suspended') {
      this._audioContext.resume();
    }

    return this._audioContext;
  }

  /**
   * Update master gain based on volume and mute state
   */
  _updateMasterGain() {
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : this._volume;
    }
  }

  /**
   * Get the AudioContext (initializes if needed)
   * @returns {AudioContext}
   */
  get context() {
    return this._getContext();
  }

  /**
   * Get the master gain node
   * @returns {GainNode}
   */
  get masterGain() {
    this._getContext(); // Ensure initialized
    return this._masterGain;
  }

  /**
   * Set master volume (0.0 to 1.0)
   * @param {number} value
   */
  setVolume(value) {
    this._volume = Math.max(0, Math.min(1, value));
    this._updateMasterGain();
  }

  /**
   * Get current volume
   * @returns {number}
   */
  getVolume() {
    return this._volume;
  }

  /**
   * Toggle mute state
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this._muted = !this._muted;
    this._updateMasterGain();
    return this._muted;
  }

  /**
   * Set mute state
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = muted;
    this._updateMasterGain();
  }

  /**
   * Check if muted
   * @returns {boolean}
   */
  isMuted() {
    return this._muted;
  }

  /**
   * Play a single tone
   * @param {number} freq - Frequency in Hz
   * @param {number} duration - Duration in milliseconds
   * @param {string} type - Oscillator type ('sine', 'square', 'sawtooth', 'triangle')
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  playTone(freq, duration, type = 'sine', volume = 0.5) {
    const ctx = this._getContext();
    const now = ctx.currentTime;
    const durationSec = duration / 1000;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(this._masterGain);

    oscillator.start(now);
    oscillator.stop(now + durationSec);
  }

  /**
   * Play a sequence of notes (jingle)
   * @param {number[]} notes - Array of frequencies
   * @param {number} noteDuration - Duration of each note in milliseconds
   * @param {string} type - Oscillator type
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  playNotes(notes, noteDuration, type = 'square', volume = 0.5) {
    const ctx = this._getContext();
    const now = ctx.currentTime;
    const noteDurationSec = noteDuration / 1000;

    notes.forEach((freq, index) => {
      const startTime = now + (index * noteDurationSec);

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDurationSec * 0.9);

      oscillator.connect(gainNode);
      gainNode.connect(this._masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDurationSec);
    });
  }

  /**
   * Play a frequency sweep (for absorb sound)
   * @param {number} startFreq - Starting frequency
   * @param {number} endFreq - Ending frequency
   * @param {number} duration - Duration in milliseconds
   * @param {string} type - Oscillator type
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  playSweep(startFreq, endFreq, duration, type = 'sawtooth', volume = 0.5) {
    const ctx = this._getContext();
    const now = ctx.currentTime;
    const durationSec = duration / 1000;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + durationSec);

    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(this._masterGain);

    oscillator.start(now);
    oscillator.stop(now + durationSec);
  }

  /**
   * Play noise-based sound (for crunch/bounce)
   * @param {number} freq - Base frequency for filtering
   * @param {number} duration - Duration in milliseconds
   * @param {number} decay - Decay factor (0.0 to 1.0)
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  playNoise(freq, duration, decay = 0.8, volume = 0.5) {
    const ctx = this._getContext();
    const now = ctx.currentTime;
    const durationSec = duration / 1000;

    // Create noise buffer
    const bufferSize = ctx.sampleRate * durationSec;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Fill with white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter around the target frequency for character
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.setValueAtTime(1, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(volume * (1 - decay) + 0.001, now + durationSec);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this._masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + durationSec);
  }
}

/**
 * Available music tracks for background music
 */
const MUSIC_TRACKS = {
  none: { id: 'none', name: 'No Music', path: null },
  final_moments: { id: 'final_moments', name: 'Final Moments', path: 'audio/music/final_moments.mp3' },
  drive: { id: 'drive', name: 'Drive', path: 'audio/music/drive.mp3' },
  longing: { id: 'longing', name: 'Longing', path: 'audio/music/longing.mp3' },
  tenuf: { id: 'tenuf', name: '10µF', path: 'audio/music/10uf.mp3' }
};

/**
 * GhostOrbitsAudio - High-level audio interface for Ghost Orbits game
 * Provides convenience methods for all game sounds
 */
class GhostOrbitsAudio {
  constructor() {
    this.synth = new RetroSynth();

    // Sound effect samples (lazy-loaded)
    this._popSound = null;
    this._popSoundLoaded = false;

    // Background music player
    this._musicPlayer = null;
    this._currentTrack = 'none';
    this._musicVolume = 0.3; // 30% default volume for music
    this._musicEnabled = false;

    // Load settings from localStorage
    this._loadMusicSettings();
  }

  /**
   * Load music settings from localStorage
   * @private
   */
  _loadMusicSettings() {
    try {
      const settings = localStorage.getItem('ghostOrbits_musicSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this._musicEnabled = parsed.enabled || false;
        this._currentTrack = parsed.track || 'none';
        this._musicVolume = parsed.volume ?? 0.3;
      }
    } catch (e) {
      console.warn('[Audio] Failed to load music settings:', e);
    }
  }

  /**
   * Save music settings to localStorage
   * @private
   */
  _saveMusicSettings() {
    try {
      localStorage.setItem('ghostOrbits_musicSettings', JSON.stringify({
        enabled: this._musicEnabled,
        track: this._currentTrack,
        volume: this._musicVolume
      }));
    } catch (e) {
      console.warn('[Audio] Failed to save music settings:', e);
    }
  }

  /**
   * Initialize audio (call on first user interaction)
   * Required due to browser autoplay policies
   */
  init() {
    // Access context to initialize it
    this.synth.context;
  }

  /**
   * Set master volume
   * @param {number} volume - 0.0 to 1.0
   */
  setVolume(volume) {
    this.synth.setVolume(volume);
  }

  /**
   * Get current volume
   * @returns {number}
   */
  getVolume() {
    return this.synth.getVolume();
  }

  /**
   * Toggle mute
   * @returns {boolean} New mute state
   */
  toggleMute() {
    return this.synth.toggleMute();
  }

  /**
   * Set mute state
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.synth.setMuted(muted);
  }

  /**
   * Check if muted
   * @returns {boolean}
   */
  isMuted() {
    return this.synth.isMuted();
  }

  /**
   * Play thrust sound - low rumble for movement
   */
  playThrust() {
    const sound = SOUNDS.thrust;
    this.synth.playTone(sound.freq, sound.duration, sound.type, sound.volume);
  }

  /**
   * Play trail drop sound - subtle blip when dropping trail segments
   */
  playTrailDrop() {
    const sound = SOUNDS.trailDrop;
    this.synth.playTone(sound.freq, sound.duration, sound.type, sound.volume);
  }

  /**
   * Play bounce sound - satisfying crunch for wall/ghost collisions
   */
  playBounce() {
    const sound = SOUNDS.bounce;
    this.synth.playNoise(sound.freq, sound.duration, sound.decay, sound.volume);
  }

  /**
   * Play absorb sound - descending sweep when absorbing another ghost
   */
  playAbsorb() {
    const sound = SOUNDS.absorb;
    this.synth.playSweep(
      sound.startFreq,
      sound.endFreq,
      sound.duration,
      sound.type,
      sound.volume
    );
  }

  /**
   * Play eliminated sound - 8-bit descending death jingle
   */
  playEliminated() {
    const sound = SOUNDS.eliminated;
    this.synth.playNotes(sound.notes, sound.noteDuration, sound.type, 0.5);
  }

  /**
   * Play victory sound - triumphant ascending C major arpeggio
   */
  playVictory() {
    const sound = SOUNDS.victory;
    this.synth.playNotes(sound.notes, sound.noteDuration, sound.type, 0.5);
  }

  /**
   * Play countdown sound - single beep for countdown numbers
   */
  playCountdown() {
    const sound = SOUNDS.countdown;
    this.synth.playTone(sound.freq, sound.duration, sound.type, sound.volume);
  }

  /**
   * Play go sound - higher pitch longer tone for "GO!"
   */
  playGo() {
    const sound = SOUNDS.go;
    this.synth.playTone(sound.freq, sound.duration, sound.type, sound.volume);
  }

  /**
   * Play pop sound - for claiming dots
   * Uses pre-recorded sample for better sound
   */
  playPop() {
    // Lazy-load the pop sound
    if (!this._popSoundLoaded) {
      this._popSound = new Audio('audio/sfx/pop.mp3');
      this._popSound.volume = 0.5;
      this._popSoundLoaded = true;
    }

    if (this._popSound && !this.synth.isMuted()) {
      // Clone and play to allow overlapping sounds
      const sound = this._popSound.cloneNode();
      sound.volume = this._popSound.volume * this.synth.getVolume();
      sound.play().catch(() => {}); // Ignore autoplay errors
    }
  }

  /**
   * Play orbit capture sound - ascending tone when entering orbit
   */
  playOrbitCapture() {
    // Quick ascending tone
    this.synth.playSweep(330, 660, 150, 'sine', 0.3);
  }

  // ============================================
  // BACKGROUND MUSIC
  // ============================================

  /**
   * Get available music tracks
   * @returns {Object} Track definitions
   */
  getMusicTracks() {
    return MUSIC_TRACKS;
  }

  /**
   * Get current music settings
   * @returns {Object} {enabled, track, volume}
   */
  getMusicSettings() {
    return {
      enabled: this._musicEnabled,
      track: this._currentTrack,
      volume: this._musicVolume
    };
  }

  /**
   * Set music enabled state
   * @param {boolean} enabled
   */
  setMusicEnabled(enabled) {
    this._musicEnabled = enabled;
    this._saveMusicSettings();

    if (enabled && this._currentTrack !== 'none') {
      this.playMusic(this._currentTrack);
    } else {
      this.stopMusic();
    }
  }

  /**
   * Set current music track
   * @param {string} trackId - Track ID from MUSIC_TRACKS
   */
  setMusicTrack(trackId) {
    this._currentTrack = trackId;
    this._saveMusicSettings();

    if (this._musicEnabled && trackId !== 'none') {
      this.playMusic(trackId);
    } else {
      this.stopMusic();
    }
  }

  /**
   * Set music volume
   * @param {number} volume - 0.0 to 1.0
   */
  setMusicVolume(volume) {
    this._musicVolume = Math.max(0, Math.min(1, volume));
    this._saveMusicSettings();

    if (this._musicPlayer) {
      this._musicPlayer.volume = this._musicVolume;
    }
  }

  /**
   * Play background music
   * @param {string} trackId - Track ID from MUSIC_TRACKS
   */
  playMusic(trackId) {
    const track = MUSIC_TRACKS[trackId];
    if (!track || !track.path) {
      this.stopMusic();
      return;
    }

    // Stop current music
    this.stopMusic();

    // Create and configure music player
    this._musicPlayer = new Audio(track.path);
    this._musicPlayer.volume = this._musicVolume;
    this._musicPlayer.loop = true;

    // Start playing
    this._musicPlayer.play().catch(err => {
      console.warn('[Audio] Music autoplay blocked:', err.message);
    });

    console.log(`[Audio] Playing music: ${track.name}`);
  }

  /**
   * Stop background music
   */
  stopMusic() {
    if (this._musicPlayer) {
      this._musicPlayer.pause();
      this._musicPlayer.currentTime = 0;
      this._musicPlayer = null;
    }
  }

  /**
   * Resume music if enabled (call after user interaction)
   */
  resumeMusic() {
    if (this._musicEnabled && this._currentTrack !== 'none') {
      if (this._musicPlayer && this._musicPlayer.paused) {
        this._musicPlayer.play().catch(() => {});
      } else if (!this._musicPlayer) {
        this.playMusic(this._currentTrack);
      }
    }
  }

  /**
   * Check if music is currently playing
   * @returns {boolean}
   */
  isMusicPlaying() {
    return this._musicPlayer && !this._musicPlayer.paused;
  }
}

// Export for ES modules
export { RetroSynth, GhostOrbitsAudio, SOUNDS, MUSIC_TRACKS };
