import React from 'react';

export default function EarthCurvature({ visible = true }) {
  if (!visible) return null;

  return (
    <div className="relative w-full overflow-hidden pointer-events-none mt-8 pb-4 flex flex-col items-center select-none">
      {/* Label and orbital altitude */}
      <div className="relative z-10 flex items-center gap-3 text-xs font-mono tracking-widest text-[#4ADE80]/80 uppercase mb-1 bg-[#070B14]/80 px-4 py-1 rounded-full border border-[#4ADE80]/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
        <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
        <span>EARTH VISIBLE · ALTITUDE 418.5 KM</span>
      </div>

      {/* Earth atmospheric horizon SVG arc */}
      <div className="w-full max-w-4xl h-24 relative flex justify-center">
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="earthGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.4" />
              <stop offset="25%" stopColor="#00D4FF" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#0B3D91" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Curvature body fill */}
          <path
            d="M 0 120 Q 500 15 1000 120 L 1000 120 L 0 120 Z"
            fill="url(#earthGlowGrad)"
          />

          {/* Atmosphere limb glow line */}
          <path
            d="M 0 120 Q 500 15 1000 120"
            fill="none"
            stroke="#4ADE80"
            strokeWidth="2.5"
            filter="url(#glowFilter)"
            opacity="0.85"
          />

          {/* Inner blue oceanic reflection stroke */}
          <path
            d="M 50 120 Q 500 24 950 120"
            fill="none"
            stroke="#00D4FF"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
}
