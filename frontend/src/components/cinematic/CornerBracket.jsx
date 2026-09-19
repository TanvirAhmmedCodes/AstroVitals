import React from 'react';

export default function CornerBracket({
  position = 'top-left',
  size = 24,
  color = '#00D4FF',
  className = '',
}) {
  const isTop = position.includes('top');
  const isLeft = position.includes('left');

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  }[position];

  return (
    <div
      className={`fixed ${positionClasses} pointer-events-none z-40 select-none ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]"
      >
        <path
          d={
            isTop
              ? isLeft
                ? 'M 2 24 L 2 2 L 24 2'
                : 'M 30 24 L 30 2 L 8 2'
              : isLeft
              ? 'M 2 8 L 2 30 L 24 30'
              : 'M 30 8 L 30 30 L 8 30'
          }
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="corner-draw"
        />
        {/* Corner point dot */}
        <circle
          cx={isLeft ? 2 : 30}
          cy={isTop ? 2 : 30}
          r="1.5"
          fill={color}
        />
      </svg>
    </div>
  );
}
