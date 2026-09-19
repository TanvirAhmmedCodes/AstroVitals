import React, { useState } from 'react';
import { Database, ExternalLink, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';

export default function NASADataPanel() {
  const [selectedCitation, setSelectedCitation] = useState(null);

  const sources = [
    {
      id: 'osdr',
      title: 'NASA OSDR I4',
      subtitle: 'Open Science Data Repository · Inspiration4 Omics',
      summary: 'Biomarker manifolds derived from Inspiration4 mission open datasets: OSD-569 (Complete Blood Count), OSD-570 (PBMC single-cell RNA), OSD-571 (cfRNA liquid biopsy), and OSD-575 (Serum immunoassay cytokines).',
      link: 'https://osdr.nasa.gov/',
    },
    {
      id: 'hrp',
      title: 'NASA HRP',
      subtitle: 'Human Research Program (5 Spaceflight Hazards)',
      summary: 'Clinical countermeasures grounded in NASA Human Research Program mitigation protocols covering Space Radiation, Isolation & Confinement, Distance from Earth, Gravity Fields (microgravity), and Hostile/Closed Environments.',
      link: 'https://www.nasa.gov/hrp/',
    },
    {
      id: 'std3001',
      title: 'NASA-STD-3001',
      subtitle: 'Space Flight Human-System Standard Vol 1 Rev C',
      summary: 'Defines mandatory crew health standards including career effective radiation limits (600 mSv for all astronauts) and Solar Particle Event (SPE) acute limit of 250 mSv to prevent tissue reaction injury.',
      link: 'https://www.nasa.gov/hhp/standards/',
    },
    {
      id: 'cognispace',
      title: 'ESA COGNISPACE',
      subtitle: 'European Space Agency Cognitive Norms',
      summary: 'Normative human psychomotor vigilance and mental rotation benchmarks for orbital crew members (mean reaction time: 280.0 ms, standard deviation: 35.0 ms).',
      link: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Research/COGNISPACE',
    },
  ];

  return (
    <>
      <div className="w-full rounded-[12px] bg-[#070B14]/80 backdrop-blur-md border border-white/10 p-3 select-none">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#00D4FF]">
            <Database size={15} />
            <span className="font-bold tracking-wider uppercase">NASA DATA USED</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sources.map((src) => (
              <button
                key={src.id}
                onClick={() => setSelectedCitation(src)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-[#0B3D91]/40 border border-white/10 hover:border-[#00D4FF]/40 text-[#A8B2C1] hover:text-[#E8EDF5] transition-all select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="font-semibold uppercase">{src.title}</span>
              </button>
            ))}
          </div>

          <div className="text-[10px] text-[#6B7688] tracking-widest uppercase hidden lg:block">
            AUTHENTIC SCIENTIFIC GROUNDING
          </div>
        </div>
      </div>

      {/* Dataset Details Modal */}
      <Modal
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        title={selectedCitation?.title || ''}
        subtitle={selectedCitation?.subtitle || ''}
      >
        <div className="space-y-4 text-xs font-mono leading-relaxed text-[#A8B2C1]">
          <p className="text-sm font-body text-[#E8EDF5]">
            {selectedCitation?.summary}
          </p>

          <div className="p-3 rounded bg-white/5 border border-white/10 space-y-1">
            <span className="text-[#6B7688] uppercase">INTEGRATION STATUS:</span>
            <p className="text-[#10B981] font-bold">
              ✓ Active in AstroVitals feature manifold and clinical countermeasure engine.
            </p>
          </div>

          {selectedCitation?.link && (
            <div className="pt-2">
              <a
                href={selectedCitation.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#00D4FF] hover:underline"
              >
                <span>Visit Official NASA / ESA Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
