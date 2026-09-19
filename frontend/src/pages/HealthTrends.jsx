import React, { useState } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowRight,
  Shield,
  Clock,
  Download,
  GitCompare,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function HealthTrends() {
  const { selectedAstronaut, missionDay } = useMissionStore();
  const [selectedRange, setSelectedRange] = useState('30d');
  const [selectedDay, setSelectedDay] = useState(null);
  const [compareLastMission, setCompareLastMission] = useState(false);

  // Generate simulated 30/90/180/365 days of mission history
  const totalDays =
    selectedRange === '30d'
      ? 30
      : selectedRange === '90d'
      ? 90
      : selectedRange === '1y'
      ? 365
      : 180;

  const daysData = Array.from({ length: totalDays }).map((_, i) => {
    const dayNum = i + 1;
    // Anomaly on day 15 and day 38
    const isAnomaly = dayNum === 15 || dayNum === 38;
    const isFuture = dayNum > missionDay;
    const riskScore = isFuture
      ? null
      : isAnomaly
      ? 68
      : 10 + Math.sin(i / 4) * 8 + (i % 5);

    // Baseline from previous mission (Expedition 72)
    const lastMissionRisk = isFuture ? null : Math.round(14 + Math.cos(i / 5) * 6 + (i % 3));

    return {
      day: dayNum,
      date: `D${dayNum}`,
      riskScore,
      lastMissionRisk,
      isAnomaly,
      isFuture,
      hrAvg: isAnomaly ? 88 : 72 + (dayNum % 4),
      spo2Avg: isAnomaly ? 95 : 98,
      sleepScore: isAnomaly ? 5.8 : 8.2,
      activityMins: isAnomaly ? 20 : 45 + (dayNum % 15),
    };
  });

  const getRiskColor = (item) => {
    if (item.isFuture) return 'bg-white/5 border-dashed border-white/10 opacity-30';
    if (item.isAnomaly)
      return 'bg-[#EF4444]/30 border-2 border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.5)]';
    if (item.riskScore < 20) return 'bg-[#10B981]/25 border border-[#10B981]/40';
    if (item.riskScore < 40) return 'bg-[#FBBF24]/25 border border-[#FBBF24]/40';
    return 'bg-[#F59E0B]/30 border border-[#F59E0B]/50';
  };

  const handleExportCalendar = () => {
    const rows = [
      'MissionDay,RiskScore,HRAvg,SpO2Avg,SleepScore,ActivityMins',
      ...daysData
        .filter((d) => !d.isFuture)
        .map((d) => `${d.day},${d.riskScore},${d.hrAvg},${d.spo2Avg},${d.sleepScore},${d.activityMins}`),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_calendar_${selectedAstronaut?.callsign || 'crew'}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Hourly curve data for selected day in modal
  const hourlyData = Array.from({ length: 24 }).map((_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    hr: (selectedDay?.isAnomaly ? 85 : 70) + Math.sin(h / 3) * 10 + (h % 3),
    spo2: (selectedDay?.isAnomaly ? 95 : 98) + Math.cos(h / 4) * 1,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5] flex items-center gap-2">
            <CalendarIcon className="text-[#00D4FF]" />
            <span>LONGITUDINAL HEALTH TRENDS</span>
          </h1>
          <p className="text-xs font-mono text-[#A8B2C1] mt-1 tracking-wider uppercase">
            CREW MEMBER: {selectedAstronaut?.name?.toUpperCase()} ({selectedAstronaut?.callsign}) · MULTI-WEEK AGGREGATES
          </p>
        </div>

        {/* Date Range Selector, Export & Mission Day Arc */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Compare to Last Mission Toggle */}
          <button
            onClick={() => setCompareLastMission(!compareLastMission)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono uppercase transition-all ${
              compareLastMission
                ? 'bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.2)] font-bold'
                : 'bg-[#0C1220] text-[#A8B2C1] border-white/10'
            }`}
            title="Compare vs Expedition 72 baseline"
          >
            <GitCompare size={13} />
            <span>Compare Last Mission</span>
          </button>

          {/* Export Calendar */}
          <button
            onClick={handleExportCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B3D91] hover:bg-[#1D4ED8] text-white border border-[#00D4FF]/40 text-xs font-mono font-bold uppercase transition-all shadow-[0_0_12px_rgba(0,212,255,0.2)]"
            title="Export Calendar data as CSV"
          >
            <Download size={13} />
            <span>Export Calendar</span>
          </button>

          <div className="flex items-center gap-1 bg-[#0C1220] p-1 rounded-lg border border-white/10 text-xs font-mono">
            {['30d', '90d', 'Mission', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-2.5 py-1 rounded transition-colors uppercase font-bold ${
                  selectedRange === range
                    ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40'
                    : 'text-[#A8B2C1] hover:text-[#E8EDF5]'
                }`}
              >
                [{range}]
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#0B3D91]/20 border border-[#00D4FF]/30 text-xs font-mono text-[#00D4FF] font-bold">
            DAY {missionDay} / 180 (23.3%)
          </div>
        </div>
      </div>

      {/* Mission Progress Arc Summary Bar */}
      <div className="p-4 rounded-[12px] bg-[#070B14]/80 border border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-[#A8B2C1] uppercase font-semibold">
            MISSION TIMELINE TRAJECTORY · EXPEDITION 73
          </span>
          <span className="text-[#10B981] font-bold">
            NOMINAL DRIFT · +2.4% ADAPTATION
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#00D4FF] via-[#10B981] to-[#4ADE80] shadow-[0_0_12px_#00D4FF]"
            style={{ width: `${(missionDay / 180) * 100}%` }}
          />
        </div>
      </div>

      {/* Calendar Heatmap Grid Panel */}
      <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
          <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
            DAILY COMPOSITE RISK MATRIX
          </h2>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#A8B2C1]">
              <span className="w-2.5 h-2.5 rounded bg-[#10B981]/40 border border-[#10B981]" /> Nominal
            </span>
            <span className="flex items-center gap-1.5 text-[#A8B2C1]">
              <span className="w-2.5 h-2.5 rounded bg-[#FBBF24]/40 border border-[#FBBF24]" /> Caution
            </span>
            <span className="flex items-center gap-1.5 text-[#A8B2C1]">
              <span className="w-2.5 h-2.5 rounded bg-[#EF4444]/40 border border-[#EF4444]" /> Anomaly / Event
            </span>
          </div>
        </div>

        {/* Heatmap Grid of Squares with Tooltip Details on Hover */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2.5">
          {daysData.map((item) => (
            <button
              key={item.day}
              onClick={() => setSelectedDay(item)}
              title={`Day ${item.day}: Risk ${item.riskScore ?? 'N/A'}/100 | HR ${item.hrAvg} BPM | SpO2 ${item.spo2Avg}% | Sleep ${item.sleepScore}h`}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-110 select-none relative group ${getRiskColor(
                item
              )}`}
              disabled={item.isFuture}
            >
              <span className="text-[10px] font-mono text-[#E8EDF5] font-bold">
                {item.day}
              </span>
              {item.isAnomaly && (
                <AlertTriangle size={10} className="text-[#EF4444] animate-pulse mt-0.5" />
              )}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-mono text-[#6B7688] mt-4 text-right uppercase">
          CLICK ANY DAY TO INSPECT 24-HOUR HOURLY CHRONOLOGY & COUNTERMEASURES
        </p>
      </div>

      {/* 30-Day / Trend Trajectory Area Chart */}
      <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#00D4FF]" />
            <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              RISK CURVE PROGRESSION {compareLastMission ? '· WITH EXPEDITION 72 BASELINE' : ''}
            </h2>
          </div>
          <span className="text-xs font-mono text-[#10B981]">
            CURRENT AGGREGATE RISK: 14.2 / 100
          </span>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daysData.filter((d) => !d.isFuture).slice(0, 45)}>
              <defs>
                <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0B3D91" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#6B7688" tick={{ fill: '#6B7688', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#6B7688" domain={[0, 100]} tick={{ fill: '#6B7688', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0C1220',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              />
              <Area
                type="monotone"
                dataKey="riskScore"
                name="Current Mission"
                stroke="#00D4FF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#riskAreaGrad)"
              />
              {compareLastMission && (
                <Line
                  type="monotone"
                  dataKey="lastMissionRisk"
                  name="Expedition 72 Baseline"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DayDetail Modal on click */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={`CHRONOLOGY: MISSION DAY ${selectedDay?.day || 1} (${selectedDay?.date || ''})`}
        subtitle={`ASTRONAUT ${selectedAstronaut?.name?.toUpperCase()}`}
      >
        {selectedDay && (
          <div className="space-y-4 text-xs font-mono">
            {/* Day Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <span className="text-[#6B7688] uppercase block">Mean HR</span>
                <span className="text-sm font-bold text-[#FF4D6D]">{selectedDay.hrAvg} BPM</span>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <span className="text-[#6B7688] uppercase block">Mean SpO2</span>
                <span className="text-sm font-bold text-[#4DA6FF]">{selectedDay.spo2Avg}%</span>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <span className="text-[#6B7688] uppercase block">Sleep Quality</span>
                <span className="text-sm font-bold text-[#FFA94D]">{selectedDay.sleepScore}/10</span>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <span className="text-[#6B7688] uppercase block">Physical Activity</span>
                <span className="text-sm font-bold text-[#4ADE80]">{selectedDay.activityMins} min</span>
              </div>
            </div>

            {/* Anomaly Callout if flagged */}
            {selectedDay.isAnomaly ? (
              <div className="p-3 rounded bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={15} />
                  <span>ACUTE CARDIOVASCULAR ANOMALY DETECTED AT 14:32 UTC</span>
                </div>
                <p className="text-[#E8EDF5] font-body text-xs">
                  Heart rate spiked to 112 BPM under zero-g rest state with transient HRV depression. NASA LSDA countermeasure prescribed: 20 min lower body negative pressure (Penguin suit) + 750ml electrolyte fluid protocol.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
                ✓ All physiological biosignals maintained inside nominal baseline envelope.
              </div>
            )}

            {/* Hourly Trace */}
            <div className="space-y-2">
              <span className="text-[#A8B2C1] font-semibold uppercase">24-Hour Heart Rate Profile</span>
              <div className="w-full h-40 bg-black/40 rounded p-2 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="hour" stroke="#6B7688" tick={{ fill: '#6B7688', fontSize: 9 }} />
                    <YAxis stroke="#6B7688" domain={[50, 120]} tick={{ fill: '#6B7688', fontSize: 9 }} />
                    <Area type="monotone" dataKey="hr" stroke="#FF4D6D" fill="#FF4D6D" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
