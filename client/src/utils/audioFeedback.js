/**
 * audioFeedback.js
 * Dementia-friendly synthesized Web Audio chimes
 * Zero external audio dependencies, guaranteed non-punitive, warm harmonic frequencies
 */

class CalmingAudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Gentle resonant bell chime for correct pattern completion
   * Warm Pentatonic triad (C5, E5, G5, C6) with exponential smooth decay
   */
  playSuccessChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.3);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  /**
   * Soft, comforting wooden marimba tone on dot tap/connection
   */
  playNodeConnect(index = 0) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];
      const freq = scale[index % scale.length] || 329.63;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  /**
   * Gentle, calming, non-punitive reset tone (soothing low flute warmth)
   */
  playGentleEncouragement() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [349.23, 392.00]; // F4, G4

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle'; // soft warm harmonic
        osc.frequency.setValueAtTime(freq, now + i * 0.18);

        gain.gain.setValueAtTime(0.001, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.95);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }
}

export const soundEngine = new CalmingAudioEngine();
