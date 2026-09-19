import React from 'react';
import { Construction } from 'lucide-react';

export default function PhasePlaceholder({ title, phase = 'Phase 4', description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-[#0B3D91]/30 border border-[#00D4FF]/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
        <Construction size={32} className="text-[#00D4FF]" />
      </div>
      <h2 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5]">
        {title.toUpperCase()}
      </h2>
      <span className="mt-2 text-xs font-mono px-3 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold uppercase">
        SCHEDULED FOR {phase.toUpperCase()}
      </span>
      <p className="mt-4 text-sm font-body text-[#A8B2C1] max-w-md">
        {description ||
          'Subsystem interfaces and deep space instrumentation ready for Phase 4 deployment.'}
      </p>
    </div>
  );
}
