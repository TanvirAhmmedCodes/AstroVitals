// Emergency warning sound player
class EmergencySoundPlayer {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.volume = 0.6; // Louder - it's an emergency
  }

  init() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    this.audio = new Audio('/audios/warning_sound.mp3');
    this.audio.loop = false;
    this.audio.volume = this.volume;
    this.audio.preload = 'auto';
  }

  play() {
    this.init();
    if (!this.audio) return;
    this.audio.play().catch((err) => {
      console.warn('[Emergency] Play failed:', err.message);
    });
    this.isPlaying = true;
    this.audio.onended = () => {
      this.isPlaying = false;
    };
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }
}

export const emergencySound = new EmergencySoundPlayer();
