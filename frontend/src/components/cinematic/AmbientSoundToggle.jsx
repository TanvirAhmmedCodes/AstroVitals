import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAmbientSound } from '../../hooks/useAmbientSound';

export default function AmbientSoundToggle({ className = 'fixed top-6 right-6 z-50' }) {
  const { isPlaying, toggleSound } = useAmbientSound();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleSound();
      }}
      className={`${className} p-2.5 rounded-full bg-[#0C1220]/80 hover:bg-[#121A2D] backdrop-blur-md border border-white/10 hover:border-[#00D4FF]/40 text-[#00D4FF] transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer select-none group flex items-center gap-2`}
      aria-label={isPlaying ? 'Mute space ambience' : 'Enable space ambience'}
      title={isPlaying ? 'Mute ambient soundscape' : 'Enable ambient soundscape'}
    >
      {isPlaying ? (
        <>
          <Volume2 size={18} className="text-[#00D4FF] group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-[#00D4FF] tracking-wider pr-1">
            AUDIO ON
          </span>
        </>
      ) : (
        <>
          <VolumeX size={18} className="text-[#6B7688] group-hover:text-white transition-colors" />
          <span className="hidden sm:inline-block text-[10px] font-mono text-[#6B7688] tracking-wider pr-1">
            MUTED
          </span>
        </>
      )}
    </button>
  );
}
