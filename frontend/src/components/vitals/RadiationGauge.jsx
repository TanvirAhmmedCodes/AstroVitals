import React from 'react';
import { Radiation, AlertTriangle } from 'lucide-react';

export default function RadiationGauge({
  cumulativeDoseUsv = 12500,
  cumulativeDoseMsv = 12.5,
  careerLimitMsv = 600.0,
  careerLimitPct = 2.08,
  isInSaa = false,
  projectedDaysToLimit = 730,
}) {
  // SVG semicircle geometry: radius 100, center (120, 110)
  const radius = 85;
  const cx = 120;
  const cy = 105;

  // Clamp percentage between 0 and 100
  const pct = Math.min(100, Math.max(0, careerLimitPct));
  // Angle: from -180 deg (left) to 0 deg (right)
  const angleDeg = -180 + (pct / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Needle tip coordinate
  const needleLength = radius - 10;
  const needleX = cx + needleLength * Math.cos(angleRad);
  const needleY = cy + needleLength * Math.sin(angleRad);

  return (
    <div className="relative p-5 rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg flex flex-col items-center justify-between select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Radiation size={17} className="text-[#B873FF]" />
          <span className="font-hud text-xs tracking-wider uppercase text-[#E8EDF5]">
            RADIATION EXPOSURE
          </span>
        </div>

        {isInSaa ? (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#B873FF] bg-[#B873FF]/20 px-2 py-0.5 rounded border border-[#B873FF]/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B873FF]" />
            SAA ACTIVE
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
            BACKGROUND NOMINAL
          </span>
        )}
      </div>

      {/* Semicircle SVG Gauge */}
      <div className="relative w-60 h-32 flex justify-center items-center mt-2">
        <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
          <defs>
            {/* Arc gradient: green -> amber -> red */}
            <linearGradient id="radArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="85%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>

            <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Color Gradient Semicircle Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#radArcGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* SAA Warning Threshold Tick (around 70%) */}
          <line
            x1={cx + radius * Math.cos(-0.5)}
            y1={cy + radius * Math.sin(-0.5)}
            x2={cx + (radius + 6) * Math.cos(-0.5)}
            y2={cy + (radius + 6) * Math.sin(-0.5)}
            stroke="#EF4444"
            strokeWidth="2"
          />

          {/* Glowing Needle Indicator */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#E8EDF5"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#needleGlow)"
          />

          {/* Center Pivot Dot */}
          <circle cx={cx} cy={cy} r="5" fill="#0B3D91" stroke="#00D4FF" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="2" fill="#FFFFFF" />
        </svg>

        {/* Center Live Readout */}
        <div className="absolute bottom-0 text-center flex flex-col items-center">
          <span className="font-mono font-bold text-2xl text-[#E8EDF5] tracking-tight font-tabular">
            {pct.toFixed(2)}%
          </span>
          <span className="text-[10px] font-mono text-[#A8B2C1] uppercase tracking-wider">
            {cumulativeDoseMsv.toFixed(1)} / {careerLimitMsv} mSv
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#6B7688]">
          NASA-STD-3001 LIMIT: 600 mSv
        </span>
        <span className="text-[#00D4FF] font-semibold">
          Projected: {projectedDaysToLimit}d
        </span>
      </div>
    </div>
  );
}
