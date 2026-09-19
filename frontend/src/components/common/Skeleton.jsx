import React from 'react';

export default function Skeleton({
  className = '',
  width = 'w-full',
  height = 'h-6',
  variant = 'rect',
}) {
  const baseStyles = 'bg-white/5 animate-pulse relative overflow-hidden';
  const shapeStyles = variant === 'circle' ? 'rounded-full' : 'rounded-[4px]';

  return (
    <div className={`${baseStyles} ${shapeStyles} ${width} ${height} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-sweep" />
    </div>
  );
}
