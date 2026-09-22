import { useState, useEffect, useCallback, useRef } from "react";
import { ambientSpaceSound } from "../lib/ambientSound";

const SOUND_STORAGE_KEY = "astrovitals_ambient_sound";
const SOUND_EVENT_KEY = "astrovitals-sound-change";

export function useAmbientSound(enabled = true) {
  const [isPlaying, setIsPlaying] = useState(() => ambientSpaceSound.isPlaying);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    return saved !== "off" && enabled;
  });
  const started = useRef(false);

  const syncState = useCallback(() => {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    const isSavedOn = saved !== "off";
    setSoundEnabled(isSavedOn && enabled);
    setIsPlaying(ambientSpaceSound.isPlaying);
  }, [enabled]);

  useEffect(() => {
    window.addEventListener(SOUND_EVENT_KEY, syncState);
    return () => {
      window.removeEventListener(SOUND_EVENT_KEY, syncState);
    };
  }, [syncState]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    const shouldPlay = saved !== "off" && enabled;
    if (!shouldPlay) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    if (ambientSpaceSound.isPlaying) {
      setIsPlaying(true);
      return;
    }

    const handleInteraction = () => {
      const currentSaved = localStorage.getItem(SOUND_STORAGE_KEY);
      if (currentSaved !== "off" && enabled && !started.current) {
        ambientSpaceSound.start();
        started.current = true;
        setIsPlaying(true);
        window.dispatchEvent(new CustomEvent(SOUND_EVENT_KEY));
      }
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      // DO NOT stop audio on unmount - persists across pages
    };
  }, [enabled]);

  const toggleSound = useCallback(() => {
    if (ambientSpaceSound.isPlaying) {
      ambientSpaceSound.stop();
      localStorage.setItem(SOUND_STORAGE_KEY, "off");
      setSoundEnabled(false);
      setIsPlaying(false);
    } else {
      ambientSpaceSound.start();
      localStorage.setItem(SOUND_STORAGE_KEY, "on");
      setSoundEnabled(true);
      setIsPlaying(true);
    }
    window.dispatchEvent(new CustomEvent(SOUND_EVENT_KEY));
  }, []);

  return {
    enabled: soundEnabled,
    soundEnabled,
    isPlaying,
    toggleSound,
  };
}
