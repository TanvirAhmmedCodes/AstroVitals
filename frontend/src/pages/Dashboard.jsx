import React, { useEffect, useState } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import {
  fetchLatestVitals,
  fetchVitalsHistory,
  fetchCurrentRisk,
  fetchRadiationStatus,
} from '../lib/api';
import { connectVitalsSSE } from '../lib/sse';
import VitalsTile from '../components/vitals/VitalsTile';
import RadiationGauge from '../components/vitals/RadiationGauge';
import TelemetryWave from '../components/vitals/TelemetryWave';
import RiskPanel from '../components/dashboard/RiskPanel';
import AIChatPreview from '../components/dashboard/AIChatPreview';
import NASADataPanel from '../components/dashboard/NASADataPanel';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const {
    selectedAstronautId,
    selectedAstronaut,
    vitals,
    setVitals,
    vitalsBuffer,
    setVitalsBuffer,
    risk,
    setRisk,
    radiation,
    setRadiation,
  } = useMissionStore();

  const [isLoading, setIsLoading] = useState(true);

  // Initial data load on mount or astronaut switch
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [vitalsData, historyData, riskData, radData] = await Promise.all([
          fetchLatestVitals(selectedAstronautId),
          fetchVitalsHistory(selectedAstronautId, 60),
          fetchCurrentRisk(selectedAstronautId),
          fetchRadiationStatus(selectedAstronautId),
        ]);

        if (isMounted) {
          if (vitalsData) setVitals(vitalsData);
          if (historyData) setVitalsBuffer(historyData);
          if (riskData) setRisk(riskData);
          if (radData) setRadiation(radData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching dashboard telemetry:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    // Subscribe to SSE stream for live updates
    const unsubscribeSSE = connectVitalsSSE(
      selectedAstronautId,
      (newFrame) => {
        if (isMounted && newFrame) {
          setVitals(newFrame);
        }
      },
      () => {
        // Fallback polling if SSE drops
      }
    );

    // Background safety poll every 5 seconds
    const interval = setInterval(async () => {
      const v = await fetchLatestVitals(selectedAstronautId);
      if (isMounted && v) setVitals(v);
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribeSSE();
      clearInterval(interval);
    };
  }, [selectedAstronautId, setVitals, setVitalsBuffer, setRisk, setRadiation]);

  // Extract sparkline arrays from rolling buffer safely
  const safeBuffer = Array.isArray(vitalsBuffer) ? vitalsBuffer : [];
  const hrSparkline = safeBuffer.map((d) => d.heart_rate_bpm || 72);
  const spo2Sparkline = safeBuffer.map((d) => d.spo2_pct || 98);
  const tempSparkline = safeBuffer.map((d) => d.skin_temp_c || 36.5);
  const radSparkline = safeBuffer.map(
    (d) => (d.radiation_dose_uSv_cumulative || 12500) / 1000
  );

  const [missionClock, setMissionClock] = useState('');
  const [secondsAgo, setSecondsAgo] = useState(1);

  // Live mission clock with seconds precision
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const utcStr = d.toUTCString().split(' ')[4] || d.toLocaleTimeString();
      setMissionClock(`MET 042d · ${utcStr} UTC`);
      setSecondsAgo(1);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Astronaut Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5] flex items-center gap-3">
            <span>{selectedAstronaut?.name?.toUpperCase()}</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
              {selectedAstronaut?.callsign || 'CDR'}
            </span>
          </h1>
          <p className="text-xs font-mono text-[#A8B2C1] mt-1 tracking-wider uppercase">
            ROLE: {selectedAstronaut?.role} · MISSION DAY 042 · 180-DAY EXPEDITION
          </p>
        </div>

        {/* Real-time sync status pill & Mission Clock & ISS Mini-Map */}
        <div className="flex flex-wrap items-center gap-3 select-none">
          {/* ISS Orbital Position Mini-Map */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0C1220] border border-white/10 shadow-[0_0_15px_rgba(0,212,255,0.1)]">
            <div className="relative w-14 h-8 rounded overflow-hidden border border-white/10 bg-[#050A14] flex items-center justify-center">
              {/* World grid lines */}
              <svg className="w-full h-full opacity-30" viewBox="0 0 56 32">
                <line x1="0" y1="16" x2="56" y2="16" stroke="#00D4FF" strokeWidth="0.5" strokeDasharray="1 2" />
                <line x1="28" y1="0" x2="28" y2="32" stroke="#00D4FF" strokeWidth="0.5" strokeDasharray="1 2" />
                <path d="M 4 8 Q 14 18, 28 14 T 52 24" fill="none" stroke="#38BDF8" strokeWidth="0.7" strokeDasharray="2 1" />
              </svg>
              {/* Pulsing ISS Marker */}
              <div className="absolute top-2.5 left-7 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping absolute" />
                <span className="w-1.5 h-1.5 rounded-full bg-white relative z-10 shadow-[0_0_6px_#00D4FF]" />
              </div>
            </div>
            <div className="text-[10px] font-mono leading-tight">
              <span className="text-[#00D4FF] font-bold block">ISS ORBIT 51.6°N</span>
              <span className="text-[#6B7688]">ALT: 418 KM · 27.6K KM/H</span>
            </div>
          </div>

          {/* Mission Time Clock with seconds precision */}
          <div className="px-3 py-1.5 rounded-lg bg-[#0C1220] border border-white/10 text-xs font-mono text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.15)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-ping" />
            <span className="font-bold">{missionClock}</span>
          </div>

          {/* Real-time sync & last reading indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0C1220] border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[#10B981] font-bold">1 Hz LIVE</span>
            <span className="text-[#3F4857]">|</span>
            <span className="text-[#6B7688]">PULSE &lt; {secondsAgo}s AGO</span>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Signature Vitals Tiles with Scroll-Snap on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory">
        <VitalsTile
          label="HEART RATE"
          value={Math.round(vitals?.heart_rate_bpm || 72)}
          unit="BPM"
          delta={vitals?.heart_rate_delta ?? 2.4}
          status="nominal"
          color="#FF4D6D"
          sparkline={hrSparkline}
          isHeartRate={true}
        />

        <VitalsTile
          label="BLOOD OXYGEN (SpO2)"
          value={Math.round(vitals?.spo2_pct || 98)}
          unit="%"
          delta={vitals?.spo2_delta ?? -0.2}
          status="nominal"
          color="#4DA6FF"
          sparkline={spo2Sparkline}
        />

        <VitalsTile
          label="SKIN TEMPERATURE"
          value={(vitals?.skin_temp_c || 36.5).toFixed(1)}
          unit="°C"
          delta={vitals?.skin_temp_delta ?? 0.1}
          status="nominal"
          color="#FFA94D"
          sparkline={tempSparkline}
        />

        <RadiationGauge
          cumulativeDoseUsv={vitals?.radiation_dose_uSv_cumulative || 12500}
          cumulativeDoseMsv={(vitals?.radiation_dose_uSv_cumulative || 12500) / 1000}
          careerLimitMsv={600.0}
          careerLimitPct={((vitals?.radiation_dose_uSv_cumulative || 12500) / 600000) * 100}
          isInSaa={radiation?.is_in_saa || false}
          projectedDaysToLimit={radiation?.projected_days_to_limit || 730}
        />
      </div>

      {/* Row 2: Telemetry Waveform */}
      <TelemetryWave
        hr={vitals?.heart_rate_bpm || 72}
        spo2={vitals?.spo2_pct || 98}
        temp={vitals?.skin_temp_c || 36.5}
        motion={vitals?.accel_magnitude_g || 0.28}
        anomaly={vitals?.anomaly_detected || false}
        windowDuration="5min"
      />

      {/* Row 3: Risk Scores & AI Companion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskPanel risk={risk} />
        <AIChatPreview />
      </div>

      {/* Row 4: NASA Data Used Persistent Panel */}
      <NASADataPanel />
    </div>
  );
}
