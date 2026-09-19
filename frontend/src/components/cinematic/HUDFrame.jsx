import React, { useEffect, useState } from 'react';
import CornerBracket from './CornerBracket';
import { useMissionStore } from '../../store/useMissionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Activity, ShieldCheck, Radio, AlertTriangle, Clock } from 'lucide-react';

export default function HUDFrame({ children }) {
  const { user } = useAuthStore();
  const {
    missionDay,
    metSeconds,
    incrementMET,
    moduleName,
    vitals,
    selectedAstronaut,
    emergencyMode,
  } = useMissionStore();

  const [utcClock, setUtcClock] = useState(() => new Date().toISOString().slice(11, 19) + ' UTC');

  // Ticking MET Clock & UTC Clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      incrementMET();
      setUtcClock(new Date().toISOString().slice(11, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, [incrementMET]);

  // Compute live integer mission day from user creation or profile
  const currentMissionDay = (() => {
    if (user?.created_at) {
      const created = new Date(user.created_at);
      const diffDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    }
    return selectedAstronaut?.mission_day || missionDay || 42;
  })();

  const formatMET = (totalSecs) => {
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#030509] text-[#E8EDF5]">
      {/* 4 Animated HUD Corner Brackets */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* Top HUD Metadata Header Bar */}
      <header className="relative z-30 w-full border-b border-white/10 bg-[#070B14]/90 backdrop-blur-md px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono select-none">
        {/* Left: Mission Day, MET, UTC */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[#00D4FF]">
            <Radio size={14} className="animate-pulse text-[#00D4FF]" />
            <span className="font-semibold tracking-wider">ASTROVITALS</span>
          </div>
          <span className="text-[#3F4857]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B7688] uppercase">MISSION DAY</span>
            <span className="text-[#E8EDF5] font-tabular font-bold">
              {String(currentMissionDay).padStart(3, '0')}
            </span>
          </div>
          <span className="text-[#3F4857]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B7688] uppercase">MET</span>
            <span className="text-[#00D4FF] font-tabular font-bold tracking-wider">
              {formatMET(metSeconds)}
            </span>
          </div>
          <span className="text-[#3F4857]">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-[#A8B2C1]">
            <Clock size={12} className="text-[#10B981]" />
            <span className="font-tabular text-[11px] font-semibold tracking-wider text-[#CBD5E1]">
              {utcClock}
            </span>
          </div>
        </div>

        {/* Center: Module Location */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-0.5 rounded bg-white/5 border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[#6B7688] uppercase">MODULE</span>
          <span className="text-[#E8EDF5] font-semibold">{moduleName}</span>
        </div>

        {/* Right: Operational Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7688] uppercase">CREW</span>
            <span className="text-[#E8EDF5] font-semibold">{selectedAstronaut?.callsign || 'CDR'}</span>
          </div>
          <span className="text-[#3F4857]">|</span>
          <div className="flex items-center gap-1.5">
            {emergencyMode ? (
              <span className="flex items-center gap-1 text-[#DC2626] font-bold animate-pulse">
                <AlertTriangle size={13} />
                EMERGENCY
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#10B981] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                NOMINAL
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content Body */}
      <div className="relative z-10 flex-1 flex flex-col w-full">{children}</div>

      {/* Bottom Telemetry Ticker Marquee */}
      <footer className="relative z-30 w-full border-t border-white/10 bg-[#070B14]/90 backdrop-blur-md px-4 py-1.5 flex items-center justify-between text-[11px] font-mono select-none overflow-hidden">
        <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] animate-pulse" />
            <span className="text-[#6B7688]">HR</span>
            <span className="text-[#FF4D6D] font-tabular font-bold">
              {Math.round(vitals?.heart_rate_bpm || 72)} BPM
            </span>
          </div>
          <span className="text-[#3F4857]">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4DA6FF]" />
            <span className="text-[#6B7688]">SpO2</span>
            <span className="text-[#4DA6FF] font-tabular font-bold">
              {Math.round(vitals?.spo2_pct || 98)}%
            </span>
          </div>
          <span className="text-[#3F4857]">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFA94D]" />
            <span className="text-[#6B7688]">TEMP</span>
            <span className="text-[#FFA94D] font-tabular font-bold">
              {(vitals?.skin_temp_c || 36.5).toFixed(1)}°C
            </span>
          </div>
          <span className="text-[#3F4857]">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B873FF]" />
            <span className="text-[#6B7688]">CUMULATIVE DOSE</span>
            <span className="text-[#B873FF] font-tabular font-bold">
              {((vitals?.radiation_dose_uSv_cumulative || 12500) / 1000).toFixed(2)} mSv
            </span>
          </div>
          <span className="text-[#3F4857]">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
            <span className="text-[#6B7688]">STATE</span>
            <span className="text-[#4ADE80] font-bold uppercase">
              {vitals?.activity_state || 'REST'}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[#6B7688]">
          <span>COMMS LINK: 100% (LOS 00:48:22)</span>
          <span className="text-[#3F4857]">|</span>
          <span className="text-[#00D4FF]">TEAM ORBITRIX · NASA 2026</span>
        </div>
      </footer>
    </div>
  );
}
