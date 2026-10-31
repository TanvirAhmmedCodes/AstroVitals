import React, { useState, useRef, useMemo } from 'react';
import './OriStyles.css';

/**
 * OriAvatar - 3D Anime Astronaut Girl Avatar for Ori (Orbital Response Intelligence)
 *
 * Visual Manifestation:
 * - Cute 3D anime/Pixar astronaut girl based on NASA Space Apps mission aesthetics
 * - Expressive large brown eyes, long layered dark brown hair, star hair accessories
 * - White futuristic astronaut spacesuit with cyan and purple illuminated details
 * - Illuminated futuristic cyan and purple headphones with audio-reactive pulses
 * - Interactive 3D mouse tracking tilt with perspective depth layers
 * - Natural idle eye blinking, star clip glint, and subtle micro-floating
 * - Dynamic emotional state switching (idle, listening, speaking, thinking, heart/joy)
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */
export default function OriAvatar({
  size = 64,
  isSpeaking = false,
  isWaving = false,
  isListening = false,
  isThinking = false,
  expression = null,
  className = '',
  onClick,
  showGlow = true,
  showStatusDot = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Scaled dimensions
  const dim = typeof size === 'number' ? size : parseInt(size, 10) || 64;
  const isSmall = dim <= 28;
  const isLarge = dim > 48;

  // Resolve dynamic avatar expression image
  const avatarSrc = useMemo(() => {
    if (expression === 'heart' || expression === 'happy') {
      return '/images/ori/ori_heart.png';
    }
    if (expression === 'full') {
      return '/images/ori/ori_full.png';
    }
    if (expression === 'greeting') {
      return '/images/ori/ori_greeting.png';
    }
    if (isListening || expression === 'listening') {
      return '/images/ori/ori_listening.png';
    }
    if (isThinking || expression === 'thinking') {
      return '/images/ori/ori_thinking.png';
    }
    if (isSpeaking || isWaving || expression === 'winking') {
      return '/images/ori/ori_winking.png';
    }
    return '/images/ori/ori_face.png';
  }, [expression, isListening, isThinking, isSpeaking, isWaving]);

  // Interactive 3D tilt tracking for medium and large avatars
  const handleMouseMove = (e) => {
    if (isSmall || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Calculate rotation (-10 to +10 degrees)
    const rotateY = Math.max(-10, Math.min(10, (x / (rect.width / 2)) * 10));
    const rotateX = Math.max(-10, Math.min(10, -(y / (rect.height / 2)) * 10));
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: dim,
        height: dim,
        perspective: isSmall ? 'none' : '500px',
      }}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-200 ${
        isHovered ? 'scale-105' : ''
      } ${className}`}
      title="Ori - AstroVitals Mission AI Companion"
    >
      {/* 1. Ambient Radial Celestial Aura */}
      {showGlow && (
        <div
          className={`absolute inset-0 rounded-full blur-md pointer-events-none transition-all duration-500 ${
            isSpeaking
              ? 'bg-gradient-to-tr from-[#00D4FF]/50 via-[#A855F7]/40 to-[#EC4899]/50 ori-aura-speaking scale-110'
              : isListening
              ? 'bg-gradient-to-tr from-[#10B981]/50 via-[#00D4FF]/40 to-[#3B82F6]/50 ori-aura-idle scale-105'
              : 'bg-gradient-to-tr from-[#00D4FF]/30 via-[#8B5CF6]/20 to-[#EC4899]/25 ori-aura-idle'
          }`}
        />
      )}

      {/* 2. Holographic Orbital Ring (for medium and large sizes) */}
      {!isSmall && (
        <div
          className={`absolute -inset-1 rounded-full pointer-events-none transition-opacity duration-300 ${
            isSpeaking
              ? 'border border-[#00D4FF]/70 shadow-[0_0_12px_rgba(0,212,255,0.7)] ori-spin-halo opacity-100'
              : isHovered
              ? 'border border-[#A855F7]/60 shadow-[0_0_8px_rgba(168,85,247,0.5)] ori-spin-halo opacity-80'
              : 'border border-cyan-400/25 opacity-40'
          }`}
        />
      )}

      {/* 3. Main 3D Card / Disk Container with dynamic tilt */}
      <div
        style={{
          transform:
            !isSmall && (tilt.x !== 0 || tilt.y !== 0)
              ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px)`
              : 'none',
          transformStyle: isSmall ? 'flat' : 'preserve-3d',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        }}
        className={`w-full h-full rounded-full overflow-hidden relative z-10 bg-[#070B14] border flex items-center justify-center shadow-lg ${
          isSpeaking
            ? 'border-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.6)] ori-headphone-active'
            : isListening
            ? 'border-[#10B981] shadow-[0_0_16px_rgba(16,185,129,0.6)]'
            : 'border-[#00D4FF]/50 shadow-[0_0_10px_rgba(0,212,255,0.35)]'
        } ${!isSmall && !isSpeaking ? 'ori-avatar-3d-float' : ''}`}
      >
        {/* Character Image */}
        <img
          src={avatarSrc}
          alt="Ori - 3D Anime Astronaut AI Companion"
          className="w-full h-full object-cover object-center select-none pointer-events-none transition-all duration-300"
          loading="eager"
          decoding="async"
        />

        {/* 4. Natural Eye Blink Micro-Layer (for sizes >= 36) */}
        {dim >= 36 && (
          <div
            className="absolute top-[35%] left-[22%] right-[22%] h-[16%] rounded-full bg-[#1A1423]/90 pointer-events-none ori-blink-layer mix-blend-multiply"
            style={{ filter: 'blur(1px)' }}
          />
        )}

        {/* 5. Glowing Star Hair Clip Twinkle (for sizes >= 32) */}
        {dim >= 32 && (
          <div
            className="absolute top-[21%] left-[27%] w-2 h-2 pointer-events-none ori-star-sparkle"
            style={{ transformOrigin: 'center' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <path
                d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
                fill="#00D4FF"
                className="drop-shadow-[0_0_4px_#00D4FF]"
              />
            </svg>
          </div>
        )}

        {/* 6. Futuristic Illuminated Headphone Halo Pulsers (left and right) */}
        {dim >= 36 && (
          <>
            {/* Left earphone glow accent */}
            <div
              className={`absolute top-[28%] left-[4%] w-[12%] h-[24%] rounded-full pointer-events-none transition-opacity duration-300 ${
                isSpeaking
                  ? 'bg-[#00D4FF]/70 shadow-[0_0_8px_#00D4FF] opacity-90'
                  : 'bg-[#00D4FF]/30 opacity-60'
              }`}
            />
            {/* Right earphone glow accent */}
            <div
              className={`absolute top-[28%] right-[4%] w-[12%] h-[24%] rounded-full pointer-events-none transition-opacity duration-300 ${
                isSpeaking
                  ? 'bg-[#A855F7]/70 shadow-[0_0_8px_#A855F7] opacity-90'
                  : 'bg-[#A855F7]/30 opacity-60'
              }`}
            />
          </>
        )}

        {/* 7. Visor Glass Reflection Light Sheen (for large sizes) */}
        {isLarge && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
            <div className="w-[40%] h-[200%] bg-gradient-to-r from-transparent via-white/15 to-transparent ori-light-sheen" />
          </div>
        )}

        {/* 8. Speaking Audio Frequency Ring Overlay */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF] animate-pulse pointer-events-none" />
        )}
      </div>

      {/* 9. Soundwave Radar Ping when Listening */}
      {isListening && (
        <span className="absolute -inset-1 rounded-full border-2 border-[#10B981] ori-listening-ping pointer-events-none" />
      )}

      {/* 10. Optional Online Status Indicator Dot */}
      {showStatusDot && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[#070B14] shadow-[0_0_6px_#10B981] ${
            isSmall ? 'w-2 h-2 bg-[#10B981]' : 'w-3 h-3 bg-[#10B981]'
          }`}
        />
      )}
    </div>
  );
}
