import React from 'react';

export default function Spinner({
  size = 'md',
  color = 'text-[#00D4FF]',
  className = '',
}) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <div
        className={`${sizes[size]} rounded-full border-transparent border-t-current ${color} animate-spin`}
      />
      <div
        className={`absolute ${sizes[size]} rounded-full border-current opacity-20 ${color}`}
      />
    </div>
  );
}
