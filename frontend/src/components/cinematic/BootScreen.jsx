import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Starfield from './Starfield';
import CornerBracket from './CornerBracket';
import { useMissionStore } from '../../store/useMissionStore';
import { Radio, ShieldCheck } from 'lucide-react';

export default function BootScreen({ onComplete }) {
  const navigate = useNavigate();
  const { setBootSequenceFinished } = useMissionStore();

  // Sequence stages: 0 (init), 1 (title 0.5s), 2 (subtitle 1.0s), 3 (brackets 2.0s), 4 (link pulse 2.5s), 5 (done 3.0s)
  const [stage, setStage] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 2000);
    const t4 = setTimeout(() => setStage(4), 2500);
    const t5 = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setBootSequenceFinished(true);
        if (onComplete) onComplete();
        else navigate('/dashboard');
      }, 500);
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [navigate, onComplete, setBootSequenceFinished]);

  const handleSkip = () => {
    setBootSequenceFinished(true);
    if (onComplete) onComplete();
    else navigate('/dashboard');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030509] text-[#E8EDF5] overflow-hidden transition-opacity duration-700 select-none ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Drifting space starfield */}
      <Starfield opacity={0.35} />

      {/* Stage 3+: Corner HUD brackets draw in */}
      {stage >= 3 && (
        <>
          <CornerBracket position="top-left" size={36} />
          <CornerBracket position="top-right" size={36} />
          <CornerBracket position="bottom-left" size={36} />
          <CornerBracket position="bottom-right" size={36} />
        </>
      )}

      {/* Subtle blueprint grid overlay */}
      <div className="absolute inset-0 space-grid-pattern opacity-30 pointer-events-none" />

      {/* Center Cinematic Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-xl">
        {/* Radar Icon Sweep */}
        <div
          className={`mb-6 transition-all duration-700 ${
            stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <div className="relative w-16 h-16 rounded-full border border-[#00D4FF]/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.2)] bg-[#070B14]/80">
            <Radio size={28} className="text-[#00D4FF] animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-t-[#00D4FF] border-transparent animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Stage 1: ASTROVITALS Title in Orbitron font with expanding letter-spacing */}
        <h1
          className={`font-hud text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E8EDF5] to-[#7DB9FF] drop-shadow-[0_0_25px_rgba(74,144,226,0.6)] transition-all duration-1000 ${
            stage >= 1
              ? 'opacity-100 tracking-[0.25em] translate-y-0'
              : 'opacity-0 tracking-[0.6em] translate-y-4'
          }`}
        >
          ASTROVITALS
        </h1>

        {/* Stage 2: Subtitle */}
        <div
          className={`mt-4 flex items-center gap-2 text-xs sm:text-sm font-mono tracking-[0.3em] text-[#00D4FF] uppercase transition-all duration-700 ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#00D4FF]" />
          <span>NEURO-SHIELD · ORBITAL EDITION</span>
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#00D4FF]" />
        </div>

        {/* Stage 4: "MISSION LINK ESTABLISHED" pulse */}
        <div
          className={`mt-10 flex items-center gap-3 px-5 py-2 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-500 ${
            stage >= 4
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-90 translate-y-4'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
          <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-[#10B981] uppercase">
            MISSION LINK ESTABLISHED
          </span>
        </div>

        {/* Telemetry handshake readout */}
        <div
          className={`mt-6 text-[11px] font-mono text-[#6B7688] tracking-widest uppercase transition-opacity duration-500 ${
            stage >= 3 ? 'opacity-80' : 'opacity-0'
          }`}
        >
          SYNCING TELEMETRY 4/4 SENSORS · ISS ZARYA COMM 100%
        </div>
      </div>

      {/* Skip Button (top-right) */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 text-xs font-mono text-[#6B7688] hover:text-[#00D4FF] uppercase tracking-widest px-3 py-1.5 rounded border border-white/10 hover:border-[#00D4FF]/40 bg-[#070B14]/60 backdrop-blur-sm transition-all select-none"
      >
        SKIP SEQUENCE [ESC]
      </button>

      {/* Footer credits */}
      <div className="absolute bottom-6 z-10 text-[10px] font-mono text-[#3F4857] tracking-widest uppercase text-center">
        NASA SPACE APPS CHALLENGE 2026 · TEAM ORBITRIX
      </div>
    </div>
  );
}
