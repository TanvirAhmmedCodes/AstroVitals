import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOri } from './OriProvider';
import OriAvatar from './OriAvatar';
import { X, Sparkles, MessageSquare } from 'lucide-react';

/**
 * OriWelcomeModal - First-visit onboarding sequence for newly registered crew.
 *
 * Slides in from bottom-right, speaks welcome greeting, antenna waves,
 * and seamlessly minimizes to the floating action button.
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */
export default function OriWelcomeModal() {
  const { isWelcoming, welcomeData, dismissWelcome, openOri, isSpeaking } = useOri();

  if (!isWelcoming || !welcomeData) return null;

  const handleOpenChat = () => {
    dismissWelcome();
    openOri();
  };

  return (
    <AnimatePresence>
      {isWelcoming && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.85 }}
          transition={{ duration: 0.4, type: 'spring', damping: 25 }}
          className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-[110] max-w-sm w-[calc(100vw-2rem)] select-none"
        >
          {/* Glassmorphic Speech Container */}
          <div className="relative p-5 rounded-2xl bg-[#070B14]/95 border border-[#00D4FF]/40 shadow-[0_0_40px_rgba(0,212,255,0.35)] backdrop-blur-2xl text-[#E8EDF5]">
            {/* Header with Dismiss Button */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span className="font-hud text-xs font-bold tracking-widest text-[#00D4FF] uppercase">
                  ORI · MISSION COMPANION
                </span>
              </div>
              <button
                onClick={dismissWelcome}
                className="p-1 rounded-md text-[#6B7688] hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize Ori"
              >
                <X size={15} />
              </button>
            </div>

            {/* Avatar & Speech Bubble Layout */}
            <div className="flex items-start gap-4">
              {/* Ori Avatar with Waving Antenna */}
              <div className="flex-shrink-0 pt-1">
                <OriAvatar
                  size={56}
                  isSpeaking={isSpeaking}
                  isWaving={true}
                  showGlow={true}
                />
              </div>

              {/* Speech Bubble Content */}
              <div className="flex-1 space-y-2">
                <p className="text-xs sm:text-sm font-display text-[#CBD5E1] leading-relaxed">
                  Hi <strong className="text-[#00D4FF] font-semibold">{welcomeData.firstName}</strong>! I'm{' '}
                  <strong className="text-white font-semibold">Ori</strong> - your mission companion. Welcome aboard AstroVitals. I'll be right here whenever you need me.
                </p>
                <p className="text-[11px] font-mono text-[#94A3B8]">
                  Tap the button below or the floating orb anytime to talk.
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-[#6B7688]">
                Minimizing to orb in 6s...
              </span>
              <button
                onClick={handleOpenChat}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white text-xs font-hud font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] flex items-center gap-1.5"
              >
                <MessageSquare size={13} />
                <span>Chat with Ori</span>
              </button>
            </div>

            {/* Little Speech Bubble Tail Pointer pointing towards FAB */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[#070B14] border-r border-b border-[#00D4FF]/40 transform rotate-45" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
