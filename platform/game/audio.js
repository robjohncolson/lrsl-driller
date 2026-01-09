/**
 * Grid Wars Audio Module
 * Uses Web Audio API for sound effects (no external files)
 */

let audioCtx = null;
let audioEnabled = true;

/**
 * Get or create the audio context
 * AudioContext must be created after user interaction
 */
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Resume audio context if suspended (required for autoplay policies)
 */
export function resumeAudio() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

/**
 * Enable or disable audio
 */
export function setAudioEnabled(enabled) {
  audioEnabled = enabled;
}

/**
 * Play a simple oscillator tone
 * @param {number} frequency - Frequency in Hz (e.g., 440 = A4)
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type: 'sine', 'square', 'sawtooth', 'triangle'
 * @param {number} volume - Volume (0-1), default 0.3
 */
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  if (!audioEnabled) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = frequency;
  osc.type = type;

  // Volume envelope - start at volume, fade to near-zero
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * Play two tones in sequence (chord-like effect)
 */
function playChord(freqs, duration, type = 'sine', volume = 0.2) {
  if (!audioEnabled) return;

  freqs.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration, type, volume), i * 50);
  });
}

/**
 * Sound effects collection
 */
export const sounds = {
  /**
   * Claim neutral territory - short blip (A4)
   */
  claim: () => playTone(440, 0.15, 'square', 0.25),

  /**
   * Takeover enemy territory - conquest chord (E4 → G4)
   */
  takeover: () => playChord([330, 392], 0.2, 'sawtooth', 0.2),

  /**
   * Points earned from answer - quick high beep (A5)
   */
  points: () => playTone(880, 0.1, 'sine', 0.3),

  /**
   * Territory lost alert - low warning tone (A3)
   */
  alert: () => playTone(220, 0.3, 'triangle', 0.35),

  /**
   * Movement - subtle click
   */
  move: () => playTone(600, 0.05, 'square', 0.1),

  /**
   * Error/blocked action - buzz
   */
  error: () => playTone(150, 0.15, 'sawtooth', 0.2),

  /**
   * Victory/celebration - ascending arpeggio
   */
  victory: () => playChord([523, 659, 784, 1047], 0.3, 'sine', 0.25),

  /**
   * Session end - dramatic chord
   */
  sessionEnd: () => playChord([261, 329, 392, 523], 0.5, 'triangle', 0.3)
};

/**
 * Initialize audio on first user interaction
 * Call this from any click/keydown handler
 */
export function initAudio() {
  resumeAudio();
}

export default sounds;
