import React, { useState } from 'react';
import { useOri } from './OriProvider';
import OriAvatar from './OriAvatar';
import './OriStyles.css';

/**
 * OriButton - Global Floating Action Button (FAB)
 *
 * Appears on every authenticated view in the bottom-right corner.
 * Clicking toggles the slide-in Ori Chat Drawer.
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */
export default function OriButton() {
  const { isDrawerOpen, toggleOri, isSpeaking } = useOri();
  const [isHovered, setIsHovered] = useState(false);

  // If the drawer is currently open, we can optionally hide the button or keep it as active toggle
  return (
    <aside
      aria-label="Ask Ori Mission AI Companion"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-[100] flex flex-col items-end pointer-events-none select-none"
    >
      {/* Tooltip Badge on Hover */}
      <div
        className={`pointer-events-none transition-all duration-300 mb-2 px-3 py-1 rounded-full bg-[#070B14]/95 border border-[#00D4FF]/40 text-xs font-mono font-semibold tracking-wider text-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.3)] backdrop-blur-md flex items-center gap-1.5 transform ${
          isHovered && !isDrawerOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
        <span>Ask Ori</span>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={toggleOri}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={isDrawerOpen ? "Close Ori Chat" : "Ask Ori"}
        className={`pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 transform group focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/60 ${
          isHovered ? 'scale-105 shadow-[0_0_35px_rgba(0,212,255,0.7)]' : 'shadow-[0_0_20px_rgba(0,212,255,0.4)]'
        } ${isSpeaking ? 'ori-fab-pulse' : 'ori-fab-pulse'}`}
        style={{
          background: 'radial-gradient(circle at 35% 35%, #00D4FF 0%, #0284C7 35%, #0B3D91 75%, #070B14 100%)',
          border: '1.5px solid rgba(0, 212, 255, 0.45)',
        }}
      >
        {/* Soft Background Radial Glow Halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00D4FF]/30 to-[#EC4899]/30 blur-md pointer-events-none group-hover:opacity-100 opacity-70 transition-opacity" />

        {/* Mini Ori Avatar */}
        <OriAvatar
          size={42}
          isSpeaking={isSpeaking}
          showGlow={false}
          className="pointer-events-none"
        />

        {/* Small Active Online Indicator Badge */}
        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-[#070B14] shadow-[0_0_6px_#10B981]" />
      </button>
    </aside>
  );
}
