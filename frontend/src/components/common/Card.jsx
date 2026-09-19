import React from 'react';

export default function Card({
  children,
  variant = 'glass',
  className = '',
  glowing = false,
  glowColor = 'rgba(74, 144, 226, 0.3)',
  ...props
}) {
  const baseStyles = 'relative rounded-[12px] transition-all duration-300';

  const variants = {
    glass:
      'bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg',
    solid:
      'bg-[#0C1220] border border-white/5 shadow-md',
    hud:
      'bg-[#070B14]/85 backdrop-blur-md border border-[#00D4FF]/25 shadow-[inset_0_0_20px_rgba(0,212,255,0.05)]',
  };

  const glowStyle = glowing ? { boxShadow: `0 0 24px ${glowColor}` } : {};

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={glowStyle}
      {...props}
    >
      {variant === 'hud' && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00D4FF]/60" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00D4FF]/60" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#00D4FF]/60" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#00D4FF]/60" />
        </>
      )}
      {children}
    </div>
  );
}
