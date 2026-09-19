import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal dialog box */}
      <div
        className={`relative z-10 w-full ${maxWidth} bg-[#070B14] border border-[#00D4FF]/40 rounded-[16px] shadow-[0_0_50px_rgba(0,212,255,0.15)] p-6 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00D4FF]" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00D4FF]" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00D4FF]" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00D4FF]" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-white/10">
          <div>
            <h3 className="font-hud text-lg tracking-wider text-[#E8EDF5] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs font-mono uppercase tracking-widest text-[#A8B2C1] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7688] hover:text-[#E8EDF5] hover:bg-white/10 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="relative z-10 max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
