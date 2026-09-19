import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Heart } from 'lucide-react';

export default function VitalsTile({
  label,
  value,
  unit,
  delta,
  status = 'nominal',
  color = '#4A90E2',
  sparkline = [],
  isHeartRate = false,
}) {
  const [flash, setFlash] = useState(false);
  const [prevVal, setPrevVal] = useState(value);

  // Flash glow on value update
  useEffect(() => {
    if (value !== prevVal) {
      setFlash(true);
      setPrevVal(value);
      const t = setTimeout(() => setFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [value, prevVal]);

  const isPositiveDelta = delta >= 0;

  // Generate SVG Sparkline Path
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline) || 1;
    const range = max - min || 1;

    const width = 120;
    const height = 36;
    const step = width / (sparkline.length - 1);

    const points = sparkline.map((val, i) => {
      const x = i * step;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

    return (
      <svg
        width={width}
        height={height}
        className="overflow-visible opacity-75"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${label})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div
      className={`relative p-5 rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden transition-all duration-300 ${
        isHeartRate ? 'hover:shadow-[0_0_30px_rgba(255,77,109,0.3)]' : 'hover:shadow-[0_0_30px_rgba(74,144,226,0.2)]'
      }`}
      style={{
        borderLeft: `4px solid ${color}`,
      }}
    >
      {/* Background radial glow */}
      <div
        className="absolute -right-8 -top-8 w-28 h-28 rounded-full pointer-events-none opacity-20 blur-xl"
        style={{ background: color }}
      />

      {/* Top Header: Label & Status Indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isHeartRate ? (
            <Heart
              size={15}
              className="text-[#FF4D6D] animate-heartbeat fill-[#FF4D6D]"
            />
          ) : (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#A8B2C1] font-semibold">
            {label}
          </span>
        </div>

        {/* Delta indicator */}
        {delta !== undefined && delta !== null && (
          <div
            className={`flex items-center gap-0.5 text-xs font-mono font-bold ${
              isPositiveDelta ? 'text-[#10B981]' : 'text-[#4DA6FF]'
            }`}
          >
            {isPositiveDelta ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            <span>{isPositiveDelta ? `+${delta}` : delta}%</span>
          </div>
        )}
      </div>

      {/* Primary Value Readout (Huge 52-64px monospace font, tabular-nums) */}
      <div className="flex items-baseline gap-2 my-1">
        <span
          className={`font-mono font-bold text-4xl sm:text-5xl tracking-tight text-[#E8EDF5] font-tabular transition-all duration-100 ${
            flash ? 'brightness-150 drop-shadow-[0_0_12px_#FFF]' : ''
          } ${isHeartRate ? 'animate-heartbeat' : ''}`}
        >
          {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
        </span>
        <span className="text-sm font-mono font-semibold uppercase text-[#6B7688]">
          {unit}
        </span>
      </div>

      {/* Bottom Row: Sparkline & Sub-telemetry */}
      <div className="flex items-end justify-between mt-3 pt-2 border-t border-white/5">
        <span className="text-[10px] font-mono text-[#6B7688] uppercase tracking-wider">
          60s TREND
        </span>
        <div className="flex-shrink-0">{renderSparkline()}</div>
      </div>
    </div>
  );
}
