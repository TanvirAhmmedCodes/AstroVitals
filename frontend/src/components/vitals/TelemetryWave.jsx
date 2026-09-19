import React, { useEffect, useRef, useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

export default function TelemetryWave({
  hr = 72,
  spo2 = 98,
  temp = 36.5,
  motion = 0.28,
  anomaly = false,
  windowDuration = '5min',
}) {
  const canvasRef = useRef(null);
  const [isAnomalyFlash, setIsAnomalyFlash] = useState(false);

  // Trigger 300ms red flash on anomaly
  useEffect(() => {
    if (anomaly) {
      setIsAnomalyFlash(true);
      const t = setTimeout(() => setIsAnomalyFlash(false), 300);
      return () => clearTimeout(t);
    }
  }, [anomaly]);

  // Canvas waveform rendering with ECG heartbeat simulation + SpO2 pulse wave
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let offset = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 180;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Blueprint Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Threshold bands
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.setLineDash([4, 4]);
      // Upper HR limit (120 bpm line)
      ctx.beginPath();
      ctx.moveTo(0, height * 0.2);
      ctx.lineTo(width, height * 0.2);
      ctx.stroke();

      // Lower SpO2 limit (90% line)
      ctx.strokeStyle = 'rgba(77, 166, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.85);
      ctx.lineTo(width, height * 0.85);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Render Heart Rate Waveform (Neon Pink/Red ECG line)
      ctx.shadowBlur = 10;
      ctx.shadowColor = anomaly ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 77, 109, 0.6)';
      ctx.strokeStyle = anomaly ? '#EF4444' : '#FF4D6D';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY_HR = height * 0.45;
      const bpmFactor = hr / 60;

      for (let x = 0; x < width; x += 2) {
        const t = (x + offset) * 0.04 * bpmFactor;
        // Periodic P-Q-R-S-T wave model
        const cycle = t % (Math.PI * 2);
        let ecgOffset = 0;

        if (cycle > 1.2 && cycle < 1.4) {
          // P wave
          ecgOffset = -Math.sin((cycle - 1.2) * Math.PI * 5) * 8;
        } else if (cycle > 1.8 && cycle < 2.0) {
          // Q dip
          ecgOffset = 6;
        } else if (cycle >= 2.0 && cycle <= 2.2) {
          // R peak
          ecgOffset = -Math.sin((cycle - 2.0) * Math.PI * 5) * 55;
        } else if (cycle > 2.2 && cycle < 2.4) {
          // S dip
          ecgOffset = 12;
        } else if (cycle > 2.7 && cycle < 3.2) {
          // T wave
          ecgOffset = -Math.sin((cycle - 2.7) * Math.PI * 2) * 14;
        }

        const y = centerY_HR + ecgOffset;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 4. Render SpO2 Plethysmograph Waveform (Cyan/Blue soft wave)
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(77, 166, 255, 0.5)';
      ctx.strokeStyle = '#4DA6FF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      const centerY_SpO2 = height * 0.68;
      for (let x = 0; x < width; x += 2) {
        const t = (x + offset * 0.7) * 0.03;
        const pulse = Math.sin(t) * 12 + Math.sin(t * 2) * 4;
        const y = centerY_SpO2 + pulse;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // 5. Vertical Scanning Sweep Line (every 2s)
      const sweepX = (offset * 3) % width;
      const sweepGrad = ctx.createLinearGradient(sweepX - 20, 0, sweepX + 2, 0);
      sweepGrad.addColorStop(0, 'transparent');
      sweepGrad.addColorStop(0.8, 'rgba(0, 212, 255, 0.15)');
      sweepGrad.addColorStop(1, 'rgba(0, 212, 255, 0.8)');

      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sweepX - 20, 0, 22, height);

      // Sweep head line
      ctx.strokeStyle = '#00D4FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();

      offset += 1.5;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hr, spo2, anomaly]);

  return (
    <div
      className={`relative rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border shadow-lg p-5 overflow-hidden transition-all duration-300 ${
        isAnomalyFlash
          ? 'border-[#EF4444] shadow-[0_0_40px_rgba(239,68,68,0.6)] bg-red-950/20'
          : 'border-white/10'
      }`}
    >
      {/* Waveform Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#00D4FF]" />
          <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
            TELEMETRY WAVEFORM
          </h2>
          <span className="text-xs font-mono text-[#6B7688]">
            OVERLAID ECG / PLETH
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-white/5 text-[#A8B2C1]">
            {windowDuration}
          </span>
          <span className="flex items-center gap-1.5 text-[#10B981] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            LIVE
          </span>
        </div>
      </div>

      {/* Canvas Canvas Area */}
      <div className="relative w-full h-[180px]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Waveform Legend & Live Measurements Bar */}
      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF4D6D]" />
            <span className="text-[#6B7688]">HR</span>
            <span className="text-[#FF4D6D] font-tabular font-bold">{Math.round(hr)} BPM</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4DA6FF]" />
            <span className="text-[#6B7688]">SpO2</span>
            <span className="text-[#4DA6FF] font-tabular font-bold">{Math.round(spo2)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFA94D]" />
            <span className="text-[#6B7688]">Temp</span>
            <span className="text-[#FFA94D] font-tabular font-bold">{temp.toFixed(1)}°C</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
            <span className="text-[#6B7688]">Motion</span>
            <span className="text-[#4ADE80] font-tabular font-bold">{motion.toFixed(2)}g</span>
          </div>
        </div>

        <div className="text-[10px] text-[#6B7688] tracking-widest uppercase">
          SWEEP 2.0s · REAL-TIME SAMPLING 1Hz
        </div>
      </div>
    </div>
  );
}
