import React, { createContext, useContext, useEffect, useState } from 'react';
import { soundEngine } from '../lib/sounds';

const SoundContext = createContext({
  muted: false,
  toggleMute: () => {},
  volume: 0.3,
  setVolume: () => {},
  play: () => {},
});

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('astrovitals_sound_muted');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('astrovitals_sound_volume');
      return saved ? parseFloat(saved) : 0.3;
    }
    return 0.3;
  });

  useEffect(() => {
    soundEngine.setMuted(muted);
    localStorage.setItem('astrovitals_sound_muted', String(muted));
  }, [muted]);

  useEffect(() => {
    soundEngine.setVolume(volume);
    localStorage.setItem('astrovitals_sound_volume', String(volume));
  }, [volume]);

  const toggleMute = () => {
    setMuted((prev) => !prev);
  };

  const play = (soundName) => {
    if (muted) return;
    switch (soundName) {
      case 'boot':
        soundEngine.playBoot();
        break;
      case 'heartbeat':
        soundEngine.playHeartbeat();
        break;
      case 'tick':
        soundEngine.playTick();
        break;
      case 'caution':
        soundEngine.playCaution();
        break;
      case 'critical':
        soundEngine.playCritical();
        break;
      case 'anomaly':
        soundEngine.playAnomaly();
        break;
      case 'chatPing':
        soundEngine.playChatPing();
        break;
      case 'commWindow':
        soundEngine.playCommWindow();
        break;
      default:
        break;
    }
  };

  return (
    <SoundContext.Provider value={{ muted, toggleMute, volume, setVolume: setVolumeState, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
