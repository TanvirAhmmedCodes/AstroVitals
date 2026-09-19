import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, BellOff, Eye } from 'lucide-react';
import { useSound } from '../SoundProvider';
import { useNavigate } from 'react-router-dom';

export default function AnomalyBar({
  anomaly = false,
  message = 'Physiological anomaly detected in telemetry stream. Heart rate or HRV out of baseline.',
  onAcknowledge,
}) {
  const [visible, setVisible] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const { play } = useSound();
  const navigate = useNavigate();

  useEffect(() => {
    if (anomaly && !snoozed) {
      setVisible(true);
      play('anomaly');

      // Auto-dismiss after 30 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 30000);
      return () => clearTimeout(timer);
    } else if (!anomaly) {
      setVisible(false);
    }
  }, [anomaly, snoozed, play]);

  const handleAcknowledge = () => {
    setVisible(false);
    if (onAcknowledge) onAcknowledge();
  };

  const handleSnooze = () => {
    setVisible(false);
    setSnoozed(true);
    // Snooze for 10 minutes
    setTimeout(() => setSnoozed(false), 600000);
  };

  if (!visible) return null;

  return (
    <div className="relative z-40 w-full bg-gradient-to-r from-[#DC2626]/90 via-[#991B1B]/95 to-[#070B14]/90 border-b-2 border-[#EF4444] shadow-[0_4px_30px_rgba(239,68,68,0.5)] px-4 py-2.5 transition-all duration-300 animate-slide-down">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Warning icon and message */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-red-600/30 border border-red-400 flex items-center justify-center animate-pulse">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div>
            <span className="font-hud font-bold text-white uppercase tracking-wider mr-2">
              PHYSIOLOGICAL ANOMALY
            </span>
            <span className="text-red-100 font-body hidden sm:inline">
              {message}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/vitals')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all font-semibold uppercase text-[11px]"
          >
            <Eye size={12} />
            <span>View Waveform</span>
          </button>

          <button
            onClick={handleSnooze}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-red-200 hover:text-white border border-white/20 transition-all uppercase text-[11px]"
          >
            <BellOff size={12} />
            <span>Snooze 10m</span>
          </button>

          <button
            onClick={handleAcknowledge}
            className="flex items-center gap-1 px-3 py-1 rounded bg-white text-red-950 hover:bg-red-50 font-bold uppercase text-[11px] shadow-sm transition-all"
          >
            Acknowledge
          </button>

          <button
            onClick={() => setVisible(false)}
            className="p-1 text-red-300 hover:text-white transition-colors ml-1"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
