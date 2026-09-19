import React, { useState } from 'react';
import { Shield, Info, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';

export default function RiskPanel({ risk = {} }) {
  const [showCountermeasures, setShowCountermeasures] = useState(false);
  const [showHonestyModal, setShowHonestyModal] = useState(false);

  const extractScore = (val, fallback) => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val?.score === 'number' && !isNaN(val.score)) return val.score;
    return fallback;
  };

  const categories = [
    {
      id: 'cardiovascular',
      label: 'Cardiovascular Deconditioning',
      score: extractScore(risk?.cardiovascular, 12.4),
      modelNote: 'Frozen Ensemble (XGB+GBR+RF) · R² = -0.43, MAE = 22.0',
      countermeasure: '30 min Penguin suit / resistance exercise + 1.0L electrolyte rehydration.',
      citation: 'NASA LSDA Bedrest & Inspiration4 OSD-569',
    },
    {
      id: 'sleep_behavioral',
      label: 'Sleep & Behavioral Health',
      score: extractScore(risk?.sleep_behavioral, 8.5),
      modelNote: 'Frozen Ensemble · R² = -0.35, MAE = 24.9',
      countermeasure: 'Fixed 22:00 UTC bedtime protocol; blue-light block visor; 4-7-8 breathing.',
      citation: 'NASA HRP Circadian Study & Actigraphy',
    },
    {
      id: 'immune',
      label: 'Immune System Dysregulation',
      score: extractScore(risk?.immune, 5.2),
      modelNote: 'Frozen Ensemble · R² = -0.17, MAE = 24.0',
      countermeasure: 'Anti-inflammatory nutritional pack, Vitamin D3 2000 IU supplement.',
      citation: 'NASA OSDR OSD-570 & OSD-575',
    },
    {
      id: 'cognitive',
      label: 'Cognitive Performance Index',
      score: extractScore(risk?.cognitive, 78.0),
      modelNote: 'Reaction time & vigilance relative to ESA COGNISPACE (280ms norm)',
      countermeasure: 'Mental rotation test refresh, micro-nap scheduled before EVA.',
      citation: 'ESA COGNISPACE & NASA WinSCAT',
    },
    {
      id: 'radiation',
      label: 'Cumulative Radiation Exposure',
      score: extractScore(risk?.radiation, 2.1),
      modelNote: 'NASA-STD-3001 600 mSv career limit / 250 mSv SPE limit',
      countermeasure: 'Crew retreat to shielded module (ISS Zvezda aft) if SPE alert fires.',
      citation: 'NASA Space Radiation Analysis Group',
    },
  ];

  const getStatus = (score) => {
    if (score < 25) return { color: '#10B981', text: 'NOMINAL', bg: 'bg-[#10B981]/15', border: 'border-[#10B981]/40' };
    if (score < 50) return { color: '#FBBF24', text: 'CAUTION', bg: 'bg-[#FBBF24]/15', border: 'border-[#FBBF24]/40' };
    return { color: '#EF4444', text: 'CRITICAL', bg: 'bg-[#EF4444]/20', border: 'border-[#EF4444]/50' };
  };

  return (
    <div className="relative rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#00D4FF]" />
            <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              RISK SCORES
            </h2>
          </div>

          <button
            onClick={() => setShowHonestyModal(true)}
            className="flex items-center gap-1 text-[11px] font-mono text-[#00D4FF] hover:text-white px-2 py-0.5 rounded bg-[#00D4FF]/10 border border-[#00D4FF]/30 transition-all select-none"
          >
            <Info size={12} />
            <span>FROZEN ML AUDIT</span>
          </button>
        </div>

        {/* 5 Risk Category Rows */}
        <div className="space-y-3.5">
          {categories.map((cat) => {
            const status = getStatus(cat.score);
            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-[#E8EDF5] font-medium">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border font-bold uppercase ${status.bg} ${status.border}`}
                      style={{ color: status.color }}
                    >
                      {status.text}
                    </span>
                    <span className="font-mono font-bold text-sm text-[#E8EDF5] font-tabular w-8 text-right">
                      {Math.round(cat.score)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, cat.score))}%`,
                      backgroundColor: status.color,
                      boxShadow: `0 0 8px ${status.color}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
        <button
          onClick={() => setShowCountermeasures(true)}
          className="flex items-center gap-1 text-xs font-mono text-[#00D4FF] hover:text-[#7DB9FF] transition-colors select-none font-semibold uppercase tracking-wider"
        >
          <span>View Countermeasures</span>
          <ArrowRight size={13} />
        </button>

        <span className="text-[10px] font-mono text-[#6B7688]">
          ISOLATION FOREST ANOMALY DETECTOR: ACTIVE
        </span>
      </div>

      {/* Countermeasures Modal */}
      <Modal
        isOpen={showCountermeasures}
        onClose={() => setShowCountermeasures(false)}
        title="NASA HRP COUNTERMEASURE PROTOCOLS"
        subtitle="AUTONOMOUS INTERVENTION MATRIX"
      >
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-lg bg-[#0C1220] border border-white/10 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold font-display text-[#E8EDF5]">
                  {cat.label}
                </span>
                <span className="text-xs font-mono text-[#00D4FF] font-bold">
                  SCORE: {Math.round(cat.score)}/100
                </span>
              </div>
              <p className="text-xs text-[#A8B2C1] font-body leading-relaxed">
                <strong className="text-[#10B981]">Prescription: </strong>
                {cat.countermeasure}
              </p>
              <div className="text-[10px] font-mono text-[#6B7688]">
                Grounding: {cat.citation}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Honest Disclosure Modal */}
      <Modal
        isOpen={showHonestyModal}
        onClose={() => setShowHonestyModal(false)}
        title="MACHINE LEARNING AUDIT & HONESTY DISCLOSURE"
        subtitle="NASA SPACE APPS CHALLENGE 2026 TRANSPARENCY"
      >
        <div className="space-y-4 text-xs font-mono leading-relaxed text-[#A8B2C1]">
          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <strong>CRITICAL ARCHITECTURE PRINCIPLE:</strong> Models in <code className="text-white">/models/</code> are strictly <strong>FROZEN</strong>. They have negative R² values by design due to small biological sample sizes (Inspiration4 n=4 across 4 missions, 55 samples total).
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#E8EDF5] text-sm">Validated Frozen Metrics:</h4>
            <ul className="list-disc pl-5 space-y-1 text-[#E8EDF5]">
              <li><strong>Cardiovascular Risk:</strong> VotingRegressor (XGB+GBR+RF) · R² = -0.43, MAE = 22.0</li>
              <li><strong>Sleep / Behavioral Risk:</strong> VotingRegressor · R² = -0.35, MAE = 24.9</li>
              <li><strong>Immune Dysregulation Risk:</strong> VotingRegressor · R² = -0.17, MAE = 24.0</li>
              <li><strong>Real-time Anomaly Detector:</strong> IsolationForest (unsupervised boundary)</li>
            </ul>
          </div>

          <p>
            Rather than fabricating inflated accuracy metrics on synthetic data, Team Orbitrix preserves honest scientific fidelity. The primary operational signal in flight is the <strong>IsolationForest anomaly detector</strong> combined with established <strong>NASA-STD-3001 physiological thresholds</strong>.
          </p>
        </div>
      </Modal>
    </div>
  );
}
