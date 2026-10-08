/**
 * audioChime.js
 * Dementia-Friendly Reassuring Audio Engine using Web Audio API
 * Generates gentle, soothing harmonics without jarring frequencies or harsh alerts.
 */

class AudioChimeEngine {
  constructor() {
    this.ctx = null;
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Reassuring Positive Chime (Correct selection)
   * Plays a warm, soft dual-tone chord (528 Hz - Solfeggio & 659.25 Hz - E5)
   * with smooth exponential decay.
   */
  playCalmSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [528.0, 659.25]; // C5-ish solfeggio frequency + E5 harmonic

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine'; // pure soft sine wave
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        // Gentle envelope: soft attack, warm sustain, calm release
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.7);
      });
    } catch (e) {
      console.warn('Audio chime playback omitted or unsupported:', e);
    }
  }

  /**
   * Gentle Orientation Tone (Incorrect selection)
   * Intentionally soft and calming (NO harsh buzzer, NO low jarring thump).
   * A gentle, warm chime (440 Hz -> 392 Hz soft bell) to reassure the patient
   * as the correct card is immediately highlighted.
   */
  playGentleOrientationTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(392, now + 0.35);

      // Low volume, smooth drop to prevent any startled reaction
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio chime playback omitted:', e);
    }
  }
}

export const audioChime = new AudioChimeEngine();
