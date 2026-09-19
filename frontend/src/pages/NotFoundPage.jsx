import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, ShieldAlert, Radio } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#030509] text-[#E8EDF5] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Starfield & Deep Space Nebulae */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00D4FF]/5 via-[#0A1020]/40 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#FF453A]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E264008_1px,transparent_1px),linear-gradient(to_bottom,#1E264008_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top Header */}
      <header className="px-8 py-6 border-b border-[#1E2640]/50 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center group-hover:border-[#00D4FF] transition-all">
            <Radio size={20} className="text-[#00D4FF] animate-pulse" />
          </div>
          <div>
            <span className="font-hud font-bold tracking-wider text-sm block group-hover:text-[#00D4FF] transition-colors">
              ASTROVITALS
            </span>
            <span className="text-[10px] font-mono text-[#6B7688] tracking-widest uppercase">
              Neuro-Shield · Orbital Edition
            </span>
          </div>
        </Link>

        <div className="font-mono text-xs text-[#FF453A] border border-[#FF453A]/30 px-3 py-1 rounded-full bg-[#FF453A]/10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-ping" />
          SIGNAL TRAJECTORY UNRESOLVED
        </div>
      </header>

      {/* Center 404 Hero */}
      <main className="flex-1 flex items-center justify-center p-6 z-10 text-center">
        <div className="max-w-xl">
          <div className="relative inline-block mb-6">
            <div className="text-8xl sm:text-9xl font-black font-hud tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#E8EDF5] via-[#8A99AD] to-[#1E2640] drop-shadow-2xl">
              404
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF453A]/20 border border-[#FF453A]/40 text-[#FF453A] text-xs font-hud font-bold tracking-widest uppercase">
              LOST IN ORBIT
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-hud font-bold text-[#E8EDF5] mt-4 mb-3 tracking-wide">
            TRANSMISSION VECTOR DEVIATION
          </h2>

          <p className="text-sm text-[#8A99AD] max-w-md mx-auto leading-relaxed mb-8">
            The page you requested has drifted beyond mission range or coordinates were lost during orbital atmospheric transit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0077FF] hover:from-[#38E1FF] hover:to-[#1A8CFF] text-[#030509] font-bold font-hud text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#00D4FF]/25 flex items-center justify-center gap-2"
            >
              <span>Return to Mission Console</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0B101E] border border-[#1E2640] hover:border-[#00D4FF]/50 text-[#E8EDF5] font-hud text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <Compass size={16} className="text-[#00D4FF]" />
              <span>Public Docking Bay</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-[#1E2640]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7688] z-10 font-mono">
        <div>
          Made by <span className="text-[#E8EDF5]">MD Tanvir Ahmmed</span> · Team Orbitrix
        </div>
        <div className="text-[11px] text-[#4A5568]">
          NASA Space Apps Challenge 2026 · Dhaka, Bangladesh
        </div>
      </footer>
    </div>
  );
}
