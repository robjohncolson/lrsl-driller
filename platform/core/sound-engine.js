/**
 * Sound Engine - Web Audio API Synthesizer
 * Generates all sounds programmatically (no audio files needed)
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    // Load enabled state from localStorage (default to true)
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        console.log('SoundEngine: AudioContext initialized, enabled:', this.enabled);
      } catch (err) {
        console.error('SoundEngine: Failed to create AudioContext', err);
      }
    }
    // Resume if suspended (needed for some browsers)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this;
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
    console.log('SoundEngine: enabled set to', enabled);
  }

  /**
   * Play a single note with envelope
   */
  playNote(freq, duration = 0.2, type = 'sine', volume = 0.3) {
    if (!this.enabled) {
      console.log('SoundEngine: playNote skipped - disabled');
      return;
    }
    if (!this.ctx) {
      console.log('SoundEngine: playNote skipped - no context, calling init()');
      this.init();
      if (!this.ctx) return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play a chord (multiple notes simultaneously)
   */
  playChord(freqs, duration = 0.3, type = 'sine') {
    freqs.forEach(f => this.playNote(f, duration, type, 0.15));
  }

  // ==================== SOUND EFFECTS ====================

  /**
   * Correct answer - happy ascending arpeggio
   */
  correct() {
    this.playNote(523, 0.15); // C5
    setTimeout(() => this.playNote(659, 0.15), 100); // E5
    setTimeout(() => this.playNote(784, 0.2), 200); // G5
  }

  /**
   * Incorrect answer - descending minor
   */
  incorrect() {
    this.playNote(400, 0.15, 'triangle');
    setTimeout(() => this.playNote(350, 0.2, 'triangle'), 100);
  }

  /**
   * Gold star earned - triumphant fanfare
   */
  goldStar() {
    this.playChord([523, 659, 784], 0.2); // C major
    setTimeout(() => this.playChord([587, 740, 880], 0.2), 200); // D major
    setTimeout(() => this.playChord([659, 830, 988], 0.4), 400); // E major
  }

  /**
   * Silver star earned
   */
  silverStar() {
    this.playChord([440, 554, 659], 0.3); // A major
  }

  /**
   * Bronze star earned
   */
  bronzeStar() {
    this.playNote(523, 0.2);
    setTimeout(() => this.playNote(659, 0.2), 150);
  }

  /**
   * Tin star earned
   */
  tinStar() {
    this.playNote(440, 0.2, 'triangle');
  }

  /**
   * Play star sound by type
   */
  starSound(starType) {
    switch (starType) {
      case 'gold': this.goldStar(); break;
      case 'silver': this.silverStar(); break;
      case 'bronze': this.bronzeStar(); break;
      case 'tin': this.tinStar(); break;
    }
  }

  /**
   * Notification chime - for others' achievements
   */
  notification() {
    this.playNote(880, 0.1, 'sine', 0.1);
    setTimeout(() => this.playNote(1100, 0.15, 'sine', 0.1), 80);
  }

  /**
   * Rank up - epic ascending progression
   */
  rankUp() {
    this.playChord([262, 330, 392], 0.15);
    setTimeout(() => this.playChord([294, 370, 440], 0.15), 150);
    setTimeout(() => this.playChord([330, 415, 494], 0.15), 300);
    setTimeout(() => this.playChord([392, 494, 587], 0.4), 450);
  }

  /**
   * Streak sound - higher pitch for higher streaks
   */
  streak(count) {
    const baseFreq = 400 + (count * 50);
    this.playNote(Math.min(baseFreq, 1200), 0.15, 'square', 0.1);
  }

  /**
   * Class time bell
   */
  classTimeBell() {
    this.playNote(659, 0.3);
    setTimeout(() => this.playNote(659, 0.3), 400);
    setTimeout(() => this.playNote(659, 0.5), 800);
  }

  /**
   * Button click
   */
  click() {
    this.playNote(800, 0.05, 'sine', 0.1);
  }

  /**
   * Mode switch
   */
  modeSwitch() {
    this.playNote(600, 0.1, 'sine', 0.15);
    setTimeout(() => this.playNote(800, 0.1, 'sine', 0.15), 50);
  }
}

// Singleton instance
export const soundEngine = new SoundEngine();
export default soundEngine;
