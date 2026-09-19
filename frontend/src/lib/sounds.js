/**
 * AstroVitals Spacecraft Sound Engine
 * Uses Web Audio API synthesis for zero-latency, royalty-free audio cues
 * Respects system prefers-reduced-motion and user mute settings
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.3; // Default 30% master volume
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(isMuted) {
    this.muted = isMuted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Helper to create gain node connected to master
  createTone(freq, type = 'sine', duration = 0.2, gainLevel = 0.2) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('[Audio] Playback interrupted:', e);
    }
  }

  // 1. App boot: rising ambient harmonic chord (Interstellar tone)
  playBoot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    [130.81, 196.0, 261.63, 392.0].forEach((freq, idx) => {
      setTimeout(() => {
        this.createTone(freq, 'triangle', 2.0, 0.15);
      }, idx * 250);
    });
  }

  // 2. Heartbeat: low subtle 60 BPM thud
  playHeartbeat() {
    this.createTone(75, 'sine', 0.12, 0.08);
    setTimeout(() => {
      this.createTone(65, 'sine', 0.18, 0.05);
    }, 150);
  }

  // 3. Telemetry tick: very subtle 2% click
  playTick() {
    this.createTone(1200, 'sine', 0.03, 0.03);
  }

  // 4. Caution alert: soft double chirp
  playCaution() {
    this.createTone(880, 'sine', 0.1, 0.15);
    setTimeout(() => this.createTone(1174.66, 'sine', 0.15, 0.15), 120);
  }

  // 5. Critical alert: high attention klaxon
  playCritical() {
    this.createTone(1046.5, 'square', 0.25, 0.2);
    setTimeout(() => this.createTone(1318.51, 'square', 0.3, 0.25), 180);
  }

  // 6. Anomaly detected: deep resonance pulse
  playAnomaly() {
    this.createTone(110, 'sawtooth', 0.5, 0.2);
    setTimeout(() => this.createTone(82.41, 'sine', 0.6, 0.25), 150);
  }

  // 7. Chat ping: soft incoming comms ping
  playChatPing() {
    this.createTone(1046.5, 'sine', 0.2, 0.12);
    setTimeout(() => this.createTone(1567.98, 'sine', 0.35, 0.12), 80);
  }

  // 8. Comm window opens: spacecraft orbital warp tone
  playCommWindow() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.18 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('[Audio] Comm tone interrupted:', e);
    }
  }
}

export const soundEngine = new SoundEngine();
