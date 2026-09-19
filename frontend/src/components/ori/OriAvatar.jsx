import React, { useState } from 'react';
import './OriStyles.css';

/**
 * OriAvatar — The visual manifestation of "Ori" (Orbital Response Intelligence)
 *
 * Designed with cute, warm, feminine NASA mission aesthetics:
 * - Rounded floating astronaut helmet
 * - Soft cyan and pink celestial aura
 * - Glowing blinking cyan eyes
 * - Curved antenna with soft glowing pink beacon
 * - Speaking and waving micro-animations
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */
export default function OriAvatar({
  size = 64,
  isSpeaking = false,
  isWaving = false,
  isListening = false,
  className = '',
  onClick,
  showGlow = true,
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Dimension scaling
  const dim = typeof size === 'number' ? size : 64;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: dim, height: dim }}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-300 ${
        isHovered ? 'scale-105 rotate-2' : ''
      } ${className}`}
      title="Ori — Orbital Response Intelligence"
    >
      {/* Ambient Radial Aura */}
      {showGlow && (
        <div
          className={`absolute inset-0 rounded-full blur-md pointer-events-none transition-all duration-500 ${
            isSpeaking
              ? 'bg-gradient-to-r from-[#00D4FF]/40 to-[#EC4899]/40 ori-aura-speaking'
              : 'bg-gradient-to-r from-[#00D4FF]/25 via-[#3B82F6]/20 to-[#EC4899]/20 ori-aura-idle'
          }`}
        />
      )}

      {/* Floating Animated SVG Helmet */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full relative z-10 ${
          isSpeaking ? 'ori-aura-speaking' : 'ori-floating'
        }`}
      >
        <defs>
          {/* Outer Helmet Shell Gradient */}
          <linearGradient id="oriHelmetGrad" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E0F2FE" />
            <stop offset="70%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Visor Gradient: Deep Space with Cosmic Glass Reflections */}
          <radialGradient id="oriVisorGrad" cx="50" cy="52" r="36" fx="44" fy="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B152B" />
            <stop offset="65%" stopColor="#060C1A" />
            <stop offset="100%" stopColor="#020409" />
          </radialGradient>

          {/* Visor Glass Reflection */}
          <linearGradient id="oriGlassShine" x1="28" y1="26" x2="55" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </linearGradient>

          {/* Pink Beacon Gradient */}
          <radialGradient id="oriPinkBeacon" cx="50" cy="50" r="50" fx="40" fy="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="60%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#BE185D" />
          </radialGradient>

          {/* Cyan Eye Glow Filter */}
          <filter id="oriEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Curved Top Antenna */}
        <g className={isWaving ? 'ori-antenna-wave' : ''} style={{ transformOrigin: '50px 22px' }}>
          {/* Antenna Stem */}
          <path
            d="M 50 24 C 48 16, 54 11, 57 7"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Antenna Pink Glowing Tip */}
          <circle
            cx="57"
            cy="7"
            r="4"
            fill="url(#oriPinkBeacon)"
            filter="drop-shadow(0 0 5px rgba(244, 114, 182, 0.95))"
          />
          <circle cx="56" cy="6" r="1.2" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* 2. Ear Comm Pods (Left & Right) */}
        {/* Left Ear Pod */}
        <rect
          x="10"
          y="44"
          width="6"
          height="16"
          rx="3"
          fill="#1E293B"
          stroke="#00D4FF"
          strokeWidth="1.2"
        />
        <circle cx="13" cy="52" r="1.5" fill="#00D4FF" />

        {/* Right Ear Pod */}
        <rect
          x="84"
          y="44"
          width="6"
          height="16"
          rx="3"
          fill="#1E293B"
          stroke="#EC4899"
          strokeWidth="1.2"
        />
        <circle cx="87" cy="52" r="1.5" fill="#EC4899" />

        {/* 3. Outer Rounded Helmet */}
        <rect
          x="14"
          y="20"
          width="72"
          height="68"
          rx="34"
          fill="url(#oriHelmetGrad)"
          stroke="#00D4FF"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
        />

        {/* 4. Helmet Face Visor (Inner Mask) */}
        <rect
          x="20"
          y="26"
          width="60"
          height="56"
          rx="28"
          fill="url(#oriVisorGrad)"
          stroke="#00D4FF"
          strokeWidth="1.8"
          strokeOpacity="0.75"
        />

        {/* 5. Visor Glass Reflection Arc */}
        <path
          d="M 28 34 C 40 28, 60 28, 72 34 C 64 31, 44 31, 28 34 Z"
          fill="url(#oriGlassShine)"
        />
        <ellipse
          cx="36"
          cy="36"
          rx="10"
          ry="5"
          transform="rotate(-25 36 36)"
          fill="#FFFFFF"
          opacity="0.18"
        />

        {/* 6. Feminine Cute Anime Astronaut Girl Face Inside Visor */}
        {/* Soft Violet/Navy Hair Framing Bangs */}
        <path
          d="M 27 38 C 30 46, 35 52, 33 58 C 36 50, 42 42, 50 42 C 58 42, 64 50, 67 58 C 65 52, 70 46, 73 38 C 65 32, 35 32, 27 38 Z"
          fill="#1E293B"
          opacity="0.85"
        />
        {/* Cute side hair strands */}
        <path
          d="M 28 40 Q 25 54 28 62 Q 29 52 32 46 Z"
          fill="#334155"
          opacity="0.7"
        />
        <path
          d="M 72 40 Q 75 54 72 62 Q 71 52 68 46 Z"
          fill="#334155"
          opacity="0.7"
        />

        {/* Rosy Soft Pink Cheeks */}
        <ellipse cx="33" cy="57" rx="4" ry="2.2" fill="#F472B6" opacity="0.45" filter="url(#oriEyeGlow)" />
        <ellipse cx="67" cy="57" rx="4" ry="2.2" fill="#F472B6" opacity="0.45" filter="url(#oriEyeGlow)" />

        {/* Big Expressive Anime Eyes with Blinking Animation */}
        <g className="ori-eyes-blink" style={{ transformOrigin: '50px 49px' }}>
          {/* Left Upper Eyelash curve */}
          <path
            d="M 33 46 Q 38 43 43 47"
            stroke="#00D4FF"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            filter="url(#oriEyeGlow)"
          />
          {/* Left Eye Sclera/Iris */}
          <ellipse
            cx="38"
            cy="49.5"
            rx="4"
            ry="5.2"
            fill="#00D4FF"
            filter="url(#oriEyeGlow)"
          />
          {/* Left Pupil & Highlights */}
          <ellipse cx="38" cy="50" rx="2.5" ry="3.2" fill="#0369A1" />
          <circle cx="36.8" cy="47.5" r="1.5" fill="#FFFFFF" />
          <circle cx="39.5" cy="52" r="0.8" fill="#FFFFFF" opacity="0.9" />

          {/* Right Upper Eyelash curve */}
          <path
            d="M 57 47 Q 62 43 67 46"
            stroke="#00D4FF"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            filter="url(#oriEyeGlow)"
          />
          {/* Right Eye Sclera/Iris */}
          <ellipse
            cx="62"
            cy="49.5"
            rx="4"
            ry="5.2"
            fill="#00D4FF"
            filter="url(#oriEyeGlow)"
          />
          {/* Right Pupil & Highlights */}
          <ellipse cx="62" cy="50" rx="2.5" ry="3.2" fill="#0369A1" />
          <circle cx="60.8" cy="47.5" r="1.5" fill="#FFFFFF" />
          <circle cx="63.5" cy="52" r="0.8" fill="#FFFFFF" opacity="0.9" />
        </g>

        {/* 7. Cute Feminine Smile / Speaking Mouth Pulse */}
        {isSpeaking ? (
          /* Speaking Mouth Indicator */
          <g className="ori-mouth-speaking" style={{ transformOrigin: '50px 61px' }}>
            <ellipse
              cx="50"
              cy="61"
              rx="4"
              ry="3"
              fill="#F472B6"
              filter="url(#oriEyeGlow)"
            />
            <path d="M 47 60 Q 50 63 53 60" stroke="#FFFFFF" strokeWidth="1" fill="none" />
          </g>
        ) : (
          /* Idle Cute Sweet Smile */
          <path
            d="M 46 60 Q 50 63.5 54 60"
            stroke="#00D4FF"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            filter="url(#oriEyeGlow)"
          />
        )}

        {/* 8. Mission Badge Crest on Helmet Base */}
        <path
          d="M 46 80 L 50 77 L 54 80 L 50 82 Z"
          fill="#00D4FF"
          opacity="0.7"
        />
      </svg>

      {/* Listening Wave Pulse Indicator */}
      {isListening && (
        <span className="absolute -bottom-1 w-3 h-3 rounded-full bg-[#10B981] animate-ping" />
      )}
    </div>
  );
}
