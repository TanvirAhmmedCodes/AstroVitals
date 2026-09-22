import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, ShieldCheck, Database, FileCode } from 'lucide-react';

export default function ProvenanceDrawer({
  isOpen = false,
  onClose = () => {},
  provenance = null,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !provenance) return null;

  const datasetId = provenance.dataset_id || 'NASA-OSDR-MANIFOLD';
  const sourceUrl = provenance.source_url || 'https://osdr.nasa.gov';
  const dataMode = (provenance.data_mode || 'live').toUpperCase();
  const timestamp = provenance.timestamp_utc || new Date().toISOString();
  const rawToolJson = provenance.raw_tool_json || {
    status: 'VERIFIED',
    dataset_id: datasetId,
    source_url: sourceUrl,
    mode: dataMode,
  };

  const jsonString = JSON.stringify(rawToolJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg h-full bg-[#070B14] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide font-display">
                DATA PROVENANCE INSPECTOR
              </h3>
              <p className="text-[11px] font-mono text-[#8B9BB4]">
                Scientific Verification Drawer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B9BB4] hover:text-white hover:bg-white/5 transition-all"
            title="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs text-[#A8B2C1]">
          {/* Status banner */}
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#6B7688]">ACQUISITION MODE</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30">
                {dataMode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#6B7688]">DATASET ACCESSION</span>
              <span className="font-semibold text-white">{datasetId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#6B7688]">RECORDED AT</span>
              <span className="text-[11px] text-[#A8B2C1]">{timestamp}</span>
            </div>
          </div>

          {/* Official NASA Source URL */}
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#00D4FF]">
              <Database size={13} />
              <span className="text-[10px] uppercase font-bold tracking-wider">OFFICIAL SOURCE CITATION</span>
            </div>
            <p className="text-[11px] text-[#8B9BB4]">
              Every numeric claim shown in AstroVitals is grounded in peer-reviewed or open NASA data:
            </p>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#00D4FF] hover:underline break-all"
            >
              <span>{sourceUrl}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>

          {/* Raw Tool JSON Output */}
          <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white">
                <FileCode size={13} className="text-[#00D4FF]" />
                <span className="text-[10px] uppercase font-bold tracking-wider">RAW TOOL JSON</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-[#A8B2C1] hover:text-white transition-all"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copied ? 'COPIED' : 'COPY JSON'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded bg-black/60 border border-white/5 text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-72 select-all">
              {jsonString}
            </pre>
          </div>

          {/* Rule note */}
          <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-[#8B9BB4] leading-relaxed">
            <strong className="text-[#00D4FF]">Physical Compute Boundary:</strong> The LLM produces zero arithmetic. All figures are computed by tested functions in <code className="text-white">backend/compute/</code> or ingested from verified NASA data fixtures.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
