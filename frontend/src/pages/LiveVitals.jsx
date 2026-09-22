import React, { useState, useEffect, useRef } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { fetchVitalsHistory, fetchLatestVitals } from '../lib/api';
import { connectVitalsSSE } from '../lib/sse';
import { useDeviceReadings } from '../hooks/useFirestore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Brush,
} from 'recharts';
import { Activity, Clock, Download, RefreshCw, Signal, ZoomIn, ZoomOut, Eye, Layers } from 'lucide-react';

const WINDOWS = [
  { id: '1m', label: '1m', count: 30 },
  { id: '5m', label: '5m', count: 60 },
  { id: '15m', label: '15m', count: 120 },
  { id: '1h', label: '1h', count: 300 },
];

export default function LiveVitals() {
  const { selectedAstronautId, selectedAstronaut, vitals, setVitals } = useMissionStore();
  const [selectedWindow, setSelectedWindow] = useState('1m');
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBaselineOverlay, setShowBaselineOverlay] = useState(true);
  const chartContainerRef = useRef(null);

  // Firestore real-time telemetry subscription (enhancement layer)
  const { data: firestoreReadings, isLive: isFirestoreLive } = useDeviceReadings(selectedAstronautId, 50);

  // Sync real-time Firestore readings when available
  useEffect(() => {
    if (firestoreReadings && firestoreReadings.length > 0 && !isPaused) {
      const latest = firestoreReadings[0];
      setVitals({
        astronaut_id: selectedAstronautId,
        timestamp_utc: latest.timestamp,
        heart_rate_bpm: latest.heart_rate_bpm,
        spo2_pct: latest.spo2_pct,
        skin_temp_c: latest.skin_temp_c,
        accel_x_g: latest.accel_x_g,
        accel_y_g: latest.accel_y_g,
        accel_z_g: latest.accel_z_g,
        activity_state: latest.activity_state,
        radiation_dose_uSv_cumulative: latest.radiation_dose_uSv_cumulative,
        battery_pct: latest.battery_pct,
        wifi_rssi: latest.wifi_rssi,
      });

      setTelemetryLogs((prev) => {
        const formatted = firestoreReadings.map((r) => ({
          timestamp_utc: r.timestamp,
          heart_rate_bpm: r.heart_rate_bpm,
          spo2_pct: r.spo2_pct,
          skin_temp_c: r.skin_temp_c,
          activity_state: r.activity_state,
          radiation_dose_uSv_cumulative: r.radiation_dose_uSv_cumulative,
        }));
        const merged = [...formatted, ...prev];
        const seen = new Set();
        return merged
          .filter((item) => {
            const key = item.timestamp_utc;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 100);
      });
    }
  }, [firestoreReadings, isPaused, selectedAstronautId, setVitals]);

  // Load telemetry logs on mount or astronaut switch (REST + SSE baseline fallback)
  useEffect(() => {
    let isMounted = true;
    const windowDef = WINDOWS.find((w) => w.id === selectedWindow) || WINDOWS[0];

    async function loadLogs() {
      const logs = await fetchVitalsHistory(selectedAstronautId, windowDef.count);
      if (isMounted && logs && logs.length > 0) {
        setTelemetryLogs((prev) => (prev.length === 0 ? logs : prev));
      }
    }

    loadLogs();

    // Subscribe to SSE stream as continuous fallback
    const unsubscribe = connectVitalsSSE(selectedAstronautId, (newFrame) => {
      if (isMounted && !isPaused && newFrame) {
        setVitals(newFrame);
        setTelemetryLogs((prev) => [newFrame, ...prev.slice(0, 99)]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedAstronautId, selectedWindow, isPaused, setVitals]);

  // Export waveform as PNG / Snapshot
  const handleExportPNG = () => {
    const svgEl = chartContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      canvas.width = svgEl.clientWidth || 800;
      canvas.height = svgEl.clientHeight || 320;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#070B14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.download = `astrovitals_waveform_${selectedAstronautId}_${Date.now()}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      // Fallback CSV download if canvas security blocks svg
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Time,HR,SpO2,Temp\n' +
        telemetryLogs
          .map((r) => `${r.timestamp_utc || ''},${r.heart_rate_bpm},${r.spo2_pct},${r.skin_temp_c}`)
          .join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `vitals_${Date.now()}.csv`);
      link.click();
    }
  };

  // Format charts data (chronological) with optional zoom slice
  const allData = [...telemetryLogs].reverse().map((item, idx) => {
    const d = item.timestamp_utc ? new Date(item.timestamp_utc) : new Date();
    const timeStr = d.toTimeString().split(' ')[0];
    return {
      index: idx,
      time: timeStr,
      hr: Math.round(item.heart_rate_bpm || 72),
      spo2: Math.round(item.spo2_pct || 98),
      temp: parseFloat((item.skin_temp_c || 36.5).toFixed(1)),
      motion: parseFloat((item.accel_magnitude_g || 0.28).toFixed(2)),
      baselineHr: 72,
      baselineSpo2: 98,
    };
  });

  const chartData = zoomLevel > 1 ? allData.slice(-Math.floor(allData.length / zoomLevel)) : allData;

  return (
    <div className="space-y-6">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5] flex items-center gap-2">
            <Activity className="text-[#00D4FF]" />
            <span>LIVE VITALS TELEMETRY</span>
          </h1>
          <p className="text-xs font-mono text-[#A8B2C1] mt-1 tracking-wider uppercase">
            ASTRONAUT: {selectedAstronaut?.name?.toUpperCase()} ({selectedAstronaut?.callsign}) · PHYSIOLOGICAL BIOSIGNALS
          </p>
        </div>

        {/* Window Selector Tabs, Zoom, Overlay & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Baseline Overlay Toggle */}
          <button
            onClick={() => setShowBaselineOverlay(!showBaselineOverlay)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono uppercase transition-colors ${
              showBaselineOverlay
                ? 'bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.2)]'
                : 'bg-[#0C1220] text-[#A8B2C1] border-white/10'
            }`}
            title="Toggle Baseline Comparison Overlay"
          >
            <Layers size={13} />
            <span>Baseline</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#0C1220] rounded-lg border border-white/10 p-0.5 text-xs font-mono">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="p-1.5 hover:text-white text-[#A8B2C1] rounded"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 text-[11px] text-white font-bold">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
              className="p-1.5 hover:text-white text-[#A8B2C1] rounded"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B3D91] hover:bg-[#1D4ED8] text-white border border-[#00D4FF]/40 text-xs font-mono font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            title="Export Waveform as PNG"
          >
            <Download size={13} />
            <span>Export PNG</span>
          </button>

          {/* Window Buttons */}
          <div className="flex items-center gap-1 bg-[#0C1220] p-1 rounded-lg border border-white/10 text-xs font-mono">
            {WINDOWS.map((win) => (
              <button
                key={win.id}
                onClick={() => setSelectedWindow(win.id)}
                className={`px-2.5 py-1 rounded transition-colors uppercase font-bold ${
                  selectedWindow === win.id
                    ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40'
                    : 'text-[#A8B2C1] hover:text-[#E8EDF5]'
                }`}
              >
                [{win.label}]
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase font-bold transition-all select-none ${
              isPaused
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
            }`}
          >
            {isPaused ? 'STREAM PAUSED' : '● LIVE STREAM'}
          </button>

          {/* Firestore / SSE Live Badge */}
          {isFirestoreLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/40 text-xs font-mono font-bold shadow-[0_0_12px_rgba(0,212,255,0.25)] select-none">
              <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
              <span>LIVE VIA FIRESTORE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-mono font-bold select-none">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>LIVE VIA SSE</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Multi-Signal Waveform Chart Panel */}
      <div
        ref={chartContainerRef}
        className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5"
      >
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-white/5 gap-2">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#00D4FF]">
            HR / SpO2 / TEMP / MOTION - OVERLAID BIOSIGNALS
          </span>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1 text-[#FF4D6D]">
              <span className="w-2 h-2 rounded-full bg-[#FF4D6D]" /> HR (BPM)
            </span>
            <span className="flex items-center gap-1 text-[#4DA6FF]">
              <span className="w-2 h-2 rounded-full bg-[#4DA6FF]" /> SpO2 (%)
            </span>
            <span className="flex items-center gap-1 text-[#FFA94D]">
              <span className="w-2 h-2 rounded-full bg-[#FFA94D]" /> Temp (°C)
            </span>
            <span className="flex items-center gap-1 text-[#4ADE80]">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80]" /> Motion (g)
            </span>
            {showBaselineOverlay && (
              <span className="flex items-center gap-1 text-white/50 border-l border-white/10 pl-3">
                <span className="w-3 h-0.5 bg-white/40 border-dashed" /> Baseline
              </span>
            )}
          </div>
        </div>

        {/* Recharts Multi-line chart with Brush selector */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                stroke="#6B7688"
                tick={{ fill: '#6B7688', fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#6B7688"
                domain={[30, 130]}
                tick={{ fill: '#6B7688', fontSize: 10, fontFamily: 'monospace' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0C1220',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              />
              {/* Baseline Reference Lines */}
              {showBaselineOverlay && (
                <>
                  <ReferenceLine
                    y={72}
                    stroke="#FF4D6D"
                    strokeDasharray="4 4"
                    opacity={0.45}
                    label={{ value: 'Baseline HR 72', fill: '#FF4D6D', fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={98}
                    stroke="#4DA6FF"
                    strokeDasharray="4 4"
                    opacity={0.45}
                    label={{ value: 'Baseline SpO2 98%', fill: '#4DA6FF', fontSize: 10 }}
                  />
                </>
              )}

              <Line type="monotone" dataKey="hr" stroke="#FF4D6D" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="spo2" stroke="#4DA6FF" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="temp" stroke="#FFA94D" strokeWidth={1.5} dot={false} isAnimationActive={false} />

              {/* Interactive Brush Selector for Time Range */}
              {chartData.length > 10 && (
                <Brush
                  dataKey="time"
                  height={24}
                  stroke="#00D4FF"
                  fill="#070B14"
                  tickFormatter={() => ''}
                  travellerWidth={10}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raw Telemetry Data Table */}
      <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#00D4FF]" />
            <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              RAW TELEMETRY BUFFER
            </h2>
            <span className="text-xs font-mono text-[#6B7688]">
              LAST {telemetryLogs.length} FRAMES
            </span>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#6B7688] uppercase tracking-wider">
                <th className="py-2 px-3">TIMESTAMP (UTC)</th>
                <th className="py-2 px-3">HR (BPM)</th>
                <th className="py-2 px-3">SpO2 (%)</th>
                <th className="py-2 px-3">TEMP (°C)</th>
                <th className="py-2 px-3">STATE</th>
                <th className="py-2 px-3">RAD DOSE (µSv)</th>
                <th className="py-2 px-3">BUFFER</th>
                <th className="py-2 px-3">RSSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#E8EDF5] font-tabular">
              {telemetryLogs.slice(0, 15).map((row, idx) => {
                const time = row.timestamp_utc
                  ? new Date(row.timestamp_utc).toTimeString().split(' ')[0]
                  : '10:30:00';
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 text-[#00D4FF] font-semibold">{time}</td>
                    <td className="py-2 px-3 text-[#FF4D6D] font-bold">
                      {Math.round(row.heart_rate_bpm || 72)}
                    </td>
                    <td className="py-2 px-3 text-[#4DA6FF] font-bold">
                      {Math.round(row.spo2_pct || 98)}
                    </td>
                    <td className="py-2 px-3 text-[#FFA94D]">
                      {(row.skin_temp_c || 36.5).toFixed(1)}
                    </td>
                    <td className="py-2 px-3 uppercase text-[#4ADE80] font-semibold">
                      {row.activity_state || 'rest'}
                    </td>
                    <td className="py-2 px-3 text-[#B873FF]">
                      {Math.round(row.radiation_dose_uSv_cumulative || 12500)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block w-2 h-2 rounded-full border border-[#10B981] bg-[#10B981]/30" />
                    </td>
                    <td className="py-2 px-3 text-[#6B7688]">
                      {row.wifi_rssi || -45} dBm
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
