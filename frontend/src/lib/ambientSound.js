// Real audio-file-based ambient sound player
class AmbientSoundPlayer {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.volume = 0.15; // Low volume - relaxing, not distracting
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    this.audio = new Audio('/audios/space_sound.mp3');
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.audio.preload = 'auto';
    this.initialized = true;
  }

  start() {
    if (this.isPlaying) return;
    this.init();
    if (!this.audio) return;
    this.audio.play().catch((err) => {
      console.warn('[Ambient] Play failed:', err.message);
    });
    this.isPlaying = true;
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audio) this.audio.volume = this.volume;
  }
}

export const ambientSpaceSound = new AmbientSoundPlayer();
