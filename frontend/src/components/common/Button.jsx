import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon,
  onClick,
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-display font-medium uppercase tracking-wider transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-[6px]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]',
  };

  const variants = {
    primary:
      'bg-[#0B3D91] hover:bg-[#4A90E2] text-[#E8EDF5] border border-[#4A90E2]/40 shadow-[0_0_15px_rgba(74,144,226,0.3)] hover:shadow-[0_0_25px_rgba(74,144,226,0.5)] active:translate-y-px',
    ghost:
      'bg-white/5 hover:bg-white/10 text-[#A8B2C1] hover:text-[#E8EDF5] border border-white/10 hover:border-white/20 active:translate-y-px',
    danger:
      'bg-[#DC2626]/80 hover:bg-[#DC2626] text-white border border-[#EF4444] shadow-[0_0_20px_rgba(220,38,38,0.4)] active:translate-y-px',
    hud: 'bg-[#070B14]/80 hover:bg-[#0C1220] text-[#00D4FF] border border-[#00D4FF]/40 shadow-[inset_0_0_12px_rgba(0,212,255,0.15)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] active:translate-y-px',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {variant === 'hud' && (
        <>
          <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#00D4FF]" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#00D4FF]" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#00D4FF]" />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#00D4FF]" />
        </>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
