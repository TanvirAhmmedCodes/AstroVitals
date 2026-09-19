import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

const OriContext = createContext(null);

export function useOri() {
  const ctx = useContext(OriContext);
  if (!ctx) {
    throw new Error('useOri must be used within an OriProvider');
  }
  return ctx;
}

/**
 * Web Audio API helper: Generates a gentle celestial chime
 * Plays warm melodic notes (C5 -> E5 -> G5) with exponential decay.
 */
function playCelestialChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });
  } catch (e) {
    // AudioContext blocked or not supported; fail silently
  }
}

export function OriProvider({ children }) {
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWelcoming, setIsWelcoming] = useState(false);
  const [welcomeData, setWelcomeData] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const synthRef = useRef(null);

  // Initialize SpeechSynthesis reference
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Open / Close / Toggle Drawer
  const openOri = useCallback(() => setIsDrawerOpen(true), []);
  const closeOri = useCallback(() => setIsDrawerOpen(false), []);
  const toggleOri = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  // Warm female voice text-to-speech
  const speak = useCallback(
    (text) => {
      if (!speechEnabled || !synthRef.current || !text) return;

      try {
        synthRef.current.cancel(); // Cancel any ongoing speech

        const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''));
        const voices = synthRef.current.getVoices();

        // Preference for warm female English voices
        const preferredVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('victoria') ||
                v.name.toLowerCase().includes('karen') ||
                v.name.toLowerCase().includes('zira') ||
                v.name.toLowerCase().includes('natural'))
          ) ||
          voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) ||
          voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.rate = 0.96; // Gentle cadence
        utterance.pitch = 1.1; // Friendly tone

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      } catch (e) {
        setIsSpeaking(false);
      }
    },
    [speechEnabled]
  );

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Trigger registration welcome sequence
  const triggerWelcome = useCallback(
    (targetUser) => {
      const u = targetUser || user;
      if (!u) return;

      const userKey = `astrovitals_ori_welcomed_${u.id || u.email || 'guest'}`;
      if (typeof window !== 'undefined' && (localStorage.getItem(userKey) || localStorage.getItem('ori_welcomed'))) {
        return; // Already welcomed
      }

      const firstName = u.full_name?.split(' ')[0] || 'Explorer';
      const greeting = `Hi ${firstName}! I'm Ori — your mission companion. Welcome aboard AstroVitals. I'll be right here whenever you need me. Tap the button to chat.`;

      setWelcomeData({
        firstName,
        message: greeting,
        userKey,
      });
      setIsWelcoming(true);

      // Play pleasant entry chime
      playCelestialChime();

      // Speak greeting if enabled
      speak(greeting);

      // Auto-minimize to FAB after 6 seconds
      const timer = setTimeout(() => {
        setIsWelcoming(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem(userKey, 'true');
          localStorage.setItem('ori_welcomed', 'true');
        }
      }, 6000);

      return () => clearTimeout(timer);
    },
    [user, speak]
  );

  const dismissWelcome = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (welcomeData?.userKey) {
        localStorage.setItem(welcomeData.userKey, 'true');
      }
      localStorage.setItem('ori_welcomed', 'true');
    }
    setIsWelcoming(false);
  }, [welcomeData]);

  // Check if current user needs welcome on mount or route navigation
  useEffect(() => {
    if (!user) return;
    const userKey = `astrovitals_ori_welcomed_${user.id || user.email || 'guest'}`;
    const alreadyWelcomed =
      typeof window !== 'undefined' &&
      (localStorage.getItem(userKey) || localStorage.getItem('ori_welcomed'));

    if (!alreadyWelcomed) {
      // Trigger subtle welcome after 800ms
      const timeout = setTimeout(() => {
        triggerWelcome(user);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [user, triggerWelcome]);

  return (
    <OriContext.Provider
      value={{
        isDrawerOpen,
        openOri,
        closeOri,
        toggleOri,
        isWelcoming,
        welcomeData,
        dismissWelcome,
        triggerWelcome,
        isSpeaking,
        speechEnabled,
        setSpeechEnabled,
        speak,
        stopSpeaking,
      }}
    >
      {children}
    </OriContext.Provider>
  );
}

export default OriContext;
