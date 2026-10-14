/**
 * Unified Sound Engine for Dementia Care.
 * Provides soothing harmonic audio cues using Web Audio API with zero external dependencies.
 * Consolidates audioChime and audioFeedback into a single AudioContext lifecycle.
 */

class SoundEngine {
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

  // Backward compatible alias
  init() {
    return this.getAudioContext();
  }

  /**
   * Warm dual-tone chord (528 Hz - Solfeggio & 659.25 Hz - E5)
   */
  playCalmSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [528.0, 659.25];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

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
   * Gentle, soft descending bell tone (440 Hz -> 392 Hz)
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

  /**
   * Resonant bell triad (C5, E5, G5, C6) for pattern completion
   */
  playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.3);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  /**
   * Soft marimba tap on dot connect
   */
  playNodeConnect(index = 0) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];
      const freq = scale[index % scale.length] || 329.63;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  /**
   * Calming warm flute reset tone
   */
  playGentleEncouragement() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [349.23, 392.00];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.18);

        gain.gain.setValueAtTime(0.001, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.95);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }
}

export const soundEngine = new SoundEngine();
export const audioChime = soundEngine;
