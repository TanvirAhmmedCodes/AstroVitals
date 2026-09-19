import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { fetchISSPosition } from '../../lib/api';

export default function ISSTrackerWidget() {
  const [issData, setIssData] = useState({
    latitude: -22.5,
    longitude: -44.2,
    altitude_km: 418.5,
    velocity_kmh: 27580,
    in_saa: false,
  });

  useEffect(() => {
    let isMounted = true;
    const update = async () => {
      const data = await fetchISSPosition();
      if (isMounted && data) {
        setIssData(data);
      }
    };
    update();
    const interval = setInterval(update, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatCoord = (val, pos, neg) => {
    if (val === undefined || val === null) return '0.0°';
    const abs = Math.abs(val).toFixed(1);
    return `${abs}° ${val >= 0 ? pos : neg}`;
  };

  return (
    <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0C1220]/80 border border-white/10 hover:border-[#00D4FF]/40 transition-all select-none">
      <div className="relative flex items-center justify-center">
        <Globe size={16} className="text-[#00D4FF] animate-spin" style={{ animationDuration: '24s' }} />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
      </div>

      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[#6B7688] uppercase tracking-wider font-semibold">ISS</span>
        <span className="text-[#E8EDF5] font-tabular">
          {formatCoord(issData.latitude, 'N', 'S')}, {formatCoord(issData.longitude, 'E', 'W')}
        </span>
        {issData.in_saa && (
          <span className="flex items-center gap-1 text-[10px] text-[#B873FF] font-bold bg-[#B873FF]/20 px-1.5 py-0.5 rounded border border-[#B873FF]/40 animate-pulse">
            SAA ACTIVE
          </span>
        )}

        {/* Live vs Simulated Telemetry Badge */}
        {issData.mode === 'SIMULATED' || issData.source === 'fallback' ? (
          <span className="flex items-center gap-1 text-[9px] text-[#F59E0B] font-bold bg-[#F59E0B]/15 px-1.5 py-0.5 rounded border border-[#F59E0B]/30 tracking-wider">
            <span className="w-1 h-1 rounded-full bg-[#F59E0B]" />
            SIMULATED
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] text-[#10B981] font-bold bg-[#10B981]/15 px-1.5 py-0.5 rounded border border-[#10B981]/30 tracking-wider">
            <span className="w-1 h-1 rounded-full bg-[#10B981] animate-ping" />
            LIVE
          </span>
        )}
      </div>
    </div>
  );
}
