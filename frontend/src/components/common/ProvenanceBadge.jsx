import React from 'react';
import { ShieldCheck, Database, HardDrive } from 'lucide-react';

export default function ProvenanceBadge({
  mode = 'live',
  datasetId = 'NASA-OSDR',
  provenance = null,
  onClick = null,
  className = '',
}) {
  const cleanMode = (provenance?.data_mode || mode || 'live').toLowerCase();

  const config = {
    live: {
      label: 'LIVE',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400 animate-pulse',
      icon: ShieldCheck,
    },
    cache: {
      label: 'CACHE',
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
      icon: HardDrive,
    },
    fixture: {
      label: 'FIXTURE',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
      icon: Database,
    },
  }[cleanMode] || {
    label: 'PROV',
    bg: 'bg-slate-500/10 hover:bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
    icon: Database,
  };

  const Icon = config.icon;
  const displayId = provenance?.dataset_id || datasetId || 'NASA-DATA';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) {
          onClick(provenance || { data_mode: cleanMode, dataset_id: displayId });
        }
      }}
      title={`Data Provenance: ${config.label} (${displayId}). Click to inspect raw tool JSON.`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border transition-all cursor-pointer select-none ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      <Icon size={11} className="opacity-75" />
    </button>
  );
}
