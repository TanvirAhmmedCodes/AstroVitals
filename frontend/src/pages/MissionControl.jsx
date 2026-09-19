import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMissionStore } from '../store/useMissionStore';
import { useOri } from '../components/ori/OriProvider';
import OriAvatar from '../components/ori/OriAvatar';
import { fetchAstronauts, fetchAlertsHistory } from '../lib/api';
import { useMissionCrew } from '../hooks/useFirestore';
import {
  Users,
  AlertTriangle,
  Activity,
  Shield,
  Radio,
  CheckCircle2,
  ChevronRight,
  UserPlus,
  AlertOctagon,
  Sparkles,
  HeartPulse,
  TrendingUp,
} from 'lucide-react';

export default function MissionControl() {
  const { crew, setAstronaut, selectedAstronautId, isDemoMode, setCrew } = useMissionStore();
  const { openOri } = useOri();
  const [crewList, setCrewList] = useState(crew);
  const [isDemo, setIsDemo] = useState(isDemoMode);

  // Firestore real-time crew subscription
  const { data: firestoreCrew, isLive: isFirestoreLive } = useMissionCrew();

  // Sync real-time Firestore crew when available
  useEffect(() => {
    if (firestoreCrew && firestoreCrew.length > 0) {
      const formatted = firestoreCrew.map((fc, idx) => ({
        id: fc.astronaut_id || `astronaut-${idx}`,
        name: fc.full_name || fc.name || `Crew Member ${idx + 1}`,
        role: fc.role || 'Mission Specialist',
        callsign: fc.callsign || 'MS',
        mission_day: fc.mission_day || 42,
        avatar_url: fc.avatar_url || null,
        status: fc.status || 'nominal',
        health_score: fc.health_score || 98,
        is_demo: false,
        latest_vitals: {
          heart_rate_bpm: 72.0,
          spo2_pct: 98.5,
          skin_temp_c: 36.5,
          activity_state: 'rest',
          radiation_dose_uSv: 12.5,
        },
      }));
      setCrewList(formatted);
      setIsDemo(false);
      setCrew(formatted, false);
    }
  }, [firestoreCrew, setCrew]);

  // REST API baseline load (continuous fallback)
  useEffect(() => {
    let isMounted = true;
    async function load() {
      const data = await fetchAstronauts();
      if (!isMounted) return;

      if (data?.crew && Array.isArray(data.crew)) {
        setCrewList((prev) => (isFirestoreLive && prev.length > 0 ? prev : data.crew));
        setIsDemo(!!data.is_demo);
        setCrew(data.crew, !!data.is_demo);
      } else if (Array.isArray(data)) {
        setCrewList((prev) => (isFirestoreLive && prev.length > 0 ? prev : data));
        const hasDemo = data.some((m) => m.isDemo);
        setIsDemo(hasDemo);
        setCrew(data, hasDemo);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [setCrew, isFirestoreLive]);

  // Real-time alert feed from backend /api/v1/alerts/history
  const [realAlerts, setRealAlerts] = useState([]);
  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      try {
        const res = await fetchAlertsHistory();
        if (isMounted && res?.alerts) {
          setRealAlerts(res.alerts);
        }
      } catch (e) {
        console.warn('Failed to load alert ledger:', e);
      }
    }
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);


  // Up to 4 slot grid representation
  const targetSlots = 4;
  const emptySlotsCount = isDemo ? 0 : Math.max(0, targetSlots - crewList.length);

  return (
    <div className="space-y-6 select-none font-display">
      {/* Demo Mode Notice Banner */}
      {isDemo && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-xs font-mono flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-[#FDE68A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping" />
            <strong className="uppercase">DEMO MODE ACTIVE:</strong>
            <span>Demo Crew — Register an account to see real registered astronaut data replace placeholders.</span>
          </div>
          <Link
            to="/register"
            className="px-3 py-1.5 rounded bg-[#F59E0B] text-black font-hud font-bold text-xs uppercase tracking-wider hover:bg-[#FBBF24] transition-colors flex-shrink-0"
          >
            Register to Join Crew →
          </Link>
        </div>
      )}

      {/* Ori Can Help Hint Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00D4FF]/10 via-[#0B3D91]/20 to-[#EC4899]/10 border border-[#00D4FF]/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
        <div className="flex items-center gap-3.5">
          <div className="flex-shrink-0">
            <OriAvatar size={48} showGlow={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-hud text-xs font-bold tracking-wider text-[#00D4FF] uppercase">
                Ori Can Help
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            </div>
            <p className="text-xs text-[#CBD5E1] mt-0.5">
              Need deeper multi-crew vitals analysis or NASA countermeasure protocols? Ori can synthesize telemetry and draft recommendations.
            </p>
          </div>
        </div>
        <button
          onClick={openOri}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,212,255,0.35)] flex-shrink-0"
        >
          <Sparkles size={14} />
          <span>Ask Ori About Crew</span>
        </button>
      </div>

      {/* Page Header with Global Mission Health Gauge */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0C1220]/80 border border-white/10 backdrop-blur-xl">
        <div>
          <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5] flex items-center gap-2">
            <Users className="text-[#00D4FF]" />
            <span>MISSION CONTROL · MULTI-CREW FLEET</span>
          </h1>
          <p className="text-xs font-mono text-[#A8B2C1] mt-1 tracking-wider uppercase">
            EXPEDITION 73 CREW COMPLEMENT · {crewList.length} ACTIVE ASTRONAUT{crewList.length === 1 ? '' : 'S'} IN ORBIT
          </p>
        </div>

        {/* Global Mission Health Gauge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#070B14]/80 border border-[#10B981]/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#10B981]"
                  strokeDasharray="94, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-hud text-[11px] font-bold text-white">94%</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#6B7688] uppercase block">Global Fleet Health</span>
              <span className="font-hud text-xs font-bold text-[#10B981] tracking-wider uppercase">
                NOMINAL · ALL SYSTEMS GO
              </span>
              <div className="mt-1">
                {isFirestoreLive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                    <span>Crew Sync: Firestore</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[#A8B2C1] border border-white/10 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>Crew Sync: REST API</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Astronaut Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {crewList.map((member) => {
          const isSelected = member.id === selectedAstronautId;
          const isCaution = member.status === 'caution';
          const healthScore = member.health_score || member.healthScore || (isCaution ? 82 : 96);
          const hr = member.latest_vitals?.heart_rate_bpm || (isCaution ? 78.0 : 72.0);
          const spo2 = member.latest_vitals?.spo2_pct || (isCaution ? 97.8 : 98.5);

          return (
            <div
              key={member.id}
              onClick={() => setAstronaut(member.id)}
              className={`p-5 rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                isSelected
                  ? 'border-[#00D4FF] shadow-[0_0_25px_rgba(0,212,255,0.3)] ring-1 ring-[#00D4FF]/50'
                  : 'border-white/10 hover:border-white/25 hover:shadow-lg'
              }`}
            >
              {/* Status Ring Avatar with Breathing Pulse */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 transition-transform duration-500 group-hover:scale-105 ${
                        isCaution
                          ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]'
                          : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                      }`}
                    >
                      {member.callsign || member.name?.charAt(0) || 'AST'}
                    </div>
                    {/* Breathing Pulse Halo */}
                    <div
                      className={`absolute inset-0 rounded-full blur-sm opacity-70 animate-pulse pointer-events-none ${
                        isCaution ? 'bg-[#FBBF24]/30' : 'bg-[#10B981]/30'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#E8EDF5]">
                      {member.name}
                    </h3>
                    <span className="text-[11px] font-mono text-[#6B7688] uppercase block">
                      {member.role || 'Mission Specialist'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    isCaution
                      ? 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40'
                      : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                  }`}
                >
                  {isCaution ? 'CAUTION' : 'NOMINAL'}
                </span>
              </div>

              {/* Health Score Readout */}
              <div className="my-3 flex items-baseline justify-between text-xs font-mono">
                <span className="text-[#A8B2C1]">Overall Health:</span>
                <span className="text-xl font-bold font-tabular text-[#E8EDF5]">
                  {healthScore}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isCaution ? 'bg-[#FBBF24]' : 'bg-[#10B981]'
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>

              {/* Mini Sparkline Trend Indicator */}
              <div className="mb-3 px-2 py-1.5 rounded bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-mono text-[#6B7688] uppercase">72h Trend</span>
                <svg className="w-24 h-5 overflow-visible" viewBox="0 0 100 20">
                  <path
                    d={
                      isCaution
                        ? 'M 0 14 Q 25 18, 45 10 T 70 8 T 100 16'
                        : 'M 0 10 Q 25 6, 50 11 T 75 7 T 100 8'
                    }
                    fill="none"
                    stroke={isCaution ? '#FBBF24' : '#10B981'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="100"
                    cy={isCaution ? 16 : 8}
                    r="2.5"
                    fill={isCaution ? '#FBBF24' : '#10B981'}
                    className="animate-ping"
                  />
                </svg>
              </div>

              {/* Live Vitals Mini Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#070B14]/80 p-2.5 rounded-lg border border-white/5">
                <div>
                  <span className="text-[10px] text-[#6B7688] uppercase block">Heart Rate</span>
                  <span className="font-bold text-[#E8EDF5] font-tabular">{hr} BPM</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7688] uppercase block">SpO2 Oxygen</span>
                  <span className="font-bold text-[#E8EDF5] font-tabular">{spo2}%</span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 text-[10px] font-mono text-[#00D4FF] flex items-center justify-end gap-1">
                  <span>ACTIVE CONSOLE FOCUS</span>
                  <ChevronRight size={12} />
                </div>
              )}
            </div>
          );
        })}

        {/* Empty Slots: Awaiting crew assignment */}
        {Array.from({ length: emptySlotsCount }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="p-5 rounded-[12px] bg-[#070B14]/40 border border-dashed border-white/15 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#6B7688]">
              <UserPlus size={20} />
            </div>
            <div>
              <h4 className="font-hud text-xs font-bold text-white uppercase tracking-wider">
                SLOT {crewList.length + idx + 1}
              </h4>
              <p className="text-[11px] font-mono text-[#A8B2C1] mt-1 max-w-[160px]">
                Awaiting crew assignment — register to join
              </p>
            </div>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-xs font-mono text-[#00D4FF] transition-colors"
            >
              Register Slot
            </Link>
          </div>
        ))}
      </div>

      {/* Fleet Alert Feed with Slide-In Animations */}
      <div className="rounded-[16px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-[#00D4FF]" />
            <h2 className="font-hud text-sm uppercase tracking-wider text-[#E8EDF5]">
              Expedition 73 Integrated Alert Ledger
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#6B7688] uppercase">
            LIVE COMM LINK: DIRECT ISS
          </span>
        </div>

        <div className="space-y-2">
          {realAlerts.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-[#6B7688] bg-white/5 rounded-lg border border-dashed border-white/10">
              No alerts yet · Fleet physiological telemetry envelope remains nominal.
            </div>
          ) : (
            realAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id || idx}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={`p-3 rounded-lg border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  alert.severity === 'critical'
                    ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#FCA5A5]'
                    : alert.severity === 'caution' || alert.severity === 'warning'
                    ? 'bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FDE68A]'
                    : 'bg-white/5 border-white/5 text-[#A8B2C1]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      alert.severity === 'critical'
                        ? 'bg-[#EF4444] animate-ping'
                        : alert.severity === 'caution' || alert.severity === 'warning'
                        ? 'bg-[#FBBF24]'
                        : 'bg-[#10B981]'
                    }`}
                  />
                  <span className="font-bold text-white uppercase">{alert.alert_type || alert.astronaut_id}</span>
                  <span className="text-white/40">·</span>
                  <span>{alert.message}</span>
                </div>
                <span className="text-[10px] text-white/50 flex-shrink-0">
                  {alert.sent_at ? new Date(alert.sent_at).toISOString().slice(11, 19) + ' UTC' : 'LIVE'}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
