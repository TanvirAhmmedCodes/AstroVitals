import React from 'react';

export default function Badge({
  children,
  variant = 'nominal',
  pulse = false,
  className = '',
}) {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase border select-none';

  const variants = {
    nominal:
      'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    caution:
      'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
    warning:
      'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    critical:
      'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50 shadow-[0_0_14px_rgba(239,68,68,0.3)]',
    hud: 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]',
    neutral: 'bg-white/5 text-[#A8B2C1] border-white/10',
  };

  const dotColors = {
    nominal: 'bg-[#10B981]',
    caution: 'bg-[#FBBF24]',
    warning: 'bg-[#F59E0B]',
    critical: 'bg-[#EF4444]',
    hud: 'bg-[#00D4FF]',
    neutral: 'bg-[#6B7688]',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
          pulse ? 'animate-ping' : ''
        }`}
      />
      {children}
    </span>
  );
}
