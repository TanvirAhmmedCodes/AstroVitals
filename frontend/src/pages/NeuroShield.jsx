import React, { useState, useEffect, useRef } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { submitCognitiveTest, fetchCognitiveNorms, fetchCognitiveHistory } from '../lib/api';
import { useSound } from '../components/SoundProvider';
import {
  Brain,
  Target,
  Smile,
  Zap,
  Activity,
  Award,
  Clock,
  RotateCcw,
  CheckCircle2,
  Share2,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export default function NeuroShield() {
  const { selectedAstronautId, selectedAstronaut } = useMissionStore();
  const { play } = useSound();

  // Cognitive Score (0-100)
  const [resilienceScore, setResilienceScore] = useState(78.5);
  const [norms, setNorms] = useState({ reaction_time_mean_ms: 280, reaction_time_sd_ms: 35 });
  const [history, setHistory] = useState([]);
  const [shared, setShared] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Reaction Test States
  const [isTestActive, setIsTestActive] = useState(false);
  const [testState, setTestState] = useState('idle'); // idle, waiting, target, falseStart, finished
  const [trial, setTrial] = useState(1);
  const [trialsData, setTrialsData] = useState([]);
  const targetStartTime = useRef(0);
  const timeoutRef = useRef(null);

  // Mood Survey (1-11 Likert)
  const [mood, setMood] = useState(7);
  const [alertness, setAlertness] = useState(6);
  const [stress, setStress] = useState(4);

  // Load norms and history
  useEffect(() => {
    let isMounted = true;
    async function init() {
      const [normsData, historyData] = await Promise.all([
        fetchCognitiveNorms(),
        fetchCognitiveHistory(selectedAstronautId),
      ]);
      if (isMounted) {
        if (normsData) setNorms(normsData);
        if (historyData) setHistory(historyData);
      }
    }
    init();
    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [selectedAstronautId]);

  // Share result to clipboard
  const handleShareResult = () => {
    const text = `AstroVitals Neuro-Shield Resilience Report:
Astronaut: ${selectedAstronaut?.name || 'Explorer'}
Cognitive Resilience Score: ${Math.round(resilienceScore)}/100 (Nominal)
ESA COGNISPACE Benchmark: +6%
Reaction Time: 268ms (Target: <280ms)
Status: Mission-Ready for Orbital Operations`;
    navigator.clipboard.writeText(text);
    setShared(true);
    play('chatPing');
    setTimeout(() => setShared(false), 3000);
  };

  // Start 5-trial Reaction Test
  const startTest = () => {
    setIsTestActive(true);
    setTrial(1);
    setTrialsData([]);
    triggerNextTrial(1);
  };

  const triggerNextTrial = (currentTrialNum) => {
    setTestState('waiting');
    // Random delay between 2000ms and 5000ms
    const delay = Math.floor(Math.random() * 3000) + 2000;
    timeoutRef.current = setTimeout(() => {
      targetStartTime.current = performance.now();
      setTestState('target');
      play('caution');
    }, delay);
  };

  const handleTap = () => {
    if (testState === 'waiting') {
      // False start (tapped before target appeared)
      clearTimeout(timeoutRef.current);
      setTestState('falseStart');
      play('critical');
      setTimeout(() => triggerNextTrial(trial), 1500);
    } else if (testState === 'target') {
      const reactionTime = Math.round(performance.now() - targetStartTime.current);
      play('tick');
      const updatedTrials = [...trialsData, reactionTime];
      setTrialsData(updatedTrials);

      if (trial < 5) {
        setTrial(trial + 1);
        triggerNextTrial(trial + 1);
      } else {
        finishTest(updatedTrials);
      }
    }
  };

  const finishTest = async (finalTrials) => {
    setTestState('finished');
    const mean = Math.round(finalTrials.reduce((a, b) => a + b, 0) / finalTrials.length);
    const variance =
      finalTrials.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / finalTrials.length;
    const sd = Math.round(Math.sqrt(variance) * 10) / 10;

    const calcScore = Math.max(
      40,
      Math.min(99, Math.round(100 - (mean - 200) * 0.25 - stress * 2 + alertness * 1.5))
    );
    setResilienceScore(calcScore);

    const payload = {
      astronaut_id: selectedAstronautId,
      reaction_time_mean_ms: mean,
      reaction_time_sd_ms: sd,
      mood_score: mood,
      alertness_score: alertness,
      stress_score: stress,
      cognitive_resilience_score: calcScore,
      timestamp_utc: new Date().toISOString(),
    };

    await submitCognitiveTest(payload);
    setHistory((prev) => [payload, ...prev]);
  };

  const closeTest = () => {
    setIsTestActive(false);
    setTestState('idle');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // HRV vs Reaction Time Scatter correlation data
  const correlationData = [
    { hrv: 45, rt: 320, subject: 'Chen (fatigue)' },
    { hrv: 55, rt: 295, subject: 'Chen (nominal)' },
    { hrv: 62, rt: 275, subject: 'Chen (alert)' },
    { hrv: 68, rt: 260, subject: 'Chen (peak)' },
    { hrv: 50, rt: 305, subject: 'Patel' },
    { hrv: 58, rt: 285, subject: 'Tanaka' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with Animated Brain & Share Result */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Animated Brain SVG Icon with Neural Pulse */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#00D4FF] overflow-visible">
              <path
                d="M12 4.5 C7 4.5 4 8 4 12 C4 15 6 18 9 19.5 C9.5 19.8 10 19.5 10 19 L10 17 C10 16 11 15 12 15 C13 15 14 16 14 17 L14 19 C14 19.5 14.5 19.8 15 19.5 C18 18 20 15 20 12 C20 8 17 4.5 12 4.5 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M12 4.5 L12 15 M8 9 C9 10 10 10 12 10 C14 10 15 10 16 9"
                stroke="#EC4899"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2 3"
                className="animate-pulse"
              />
            </svg>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] blur-sm absolute animate-ping pointer-events-none" />
          </div>
          <div>
            <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5]">
              NEURO-SHIELD COGNITIVE BATTERY
            </h1>
            <p className="text-xs font-mono text-[#A8B2C1] tracking-wider uppercase">
              ASTRONAUT: {selectedAstronaut?.name?.toUpperCase()} · PSYCHOMOTOR VIGILANCE & MOOD SPECTRUM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Share Result Button */}
          <button
            onClick={handleShareResult}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
              shared
                ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50'
                : 'bg-[#0C1220] hover:bg-white/10 text-white border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.05)]'
            }`}
          >
            {shared ? <Check size={14} /> : <Share2 size={14} />}
            <span>{shared ? 'COPIED RESULT' : 'SHARE RESULT'}</span>
          </button>

          <button
            onClick={startTest}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B3D91] hover:bg-[#4A90E2] text-white border border-[#4A90E2]/50 shadow-[0_0_20px_rgba(74,144,226,0.4)] font-display text-sm font-semibold uppercase tracking-wider transition-all select-none"
          >
            <Target size={16} />
            <span>START REACTION TEST</span>
          </button>
        </div>
      </div>

      {/* Neuro-Shield Explanatory Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#00D4FF]/10 via-[#0B3D91]/20 to-transparent border border-[#00D4FF]/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Brain className="text-[#00D4FF] shrink-0 mt-0.5" size={22} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-hud text-xs font-bold tracking-wider text-[#00D4FF] uppercase">
                Cognitive Resilience Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                ESA COGNISPACE BENCHMARK
              </span>
            </div>
            <p className="text-xs text-[#CBD5E1] mt-1 font-mono leading-relaxed max-w-3xl">
              Neuro-Shield is a cognitive resilience engine. It measures psychomotor vigilance (reaction time), cognitive accuracy, and mood to detect early signs of stress, fatigue, and cognitive decline on long missions. It uses ESA COGNISPACE norms as baseline.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4FF]/15 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/40 text-[#00D4FF] text-xs font-mono shrink-0 transition-colors cursor-pointer"
        >
          <Info size={14} />
          <span>What is this?</span>
        </button>
      </div>

      {/* Row 1: Resilience Dial & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dial Card */}
        <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-[#A8B2C1] mb-2 font-semibold">
            COGNITIVE RESILIENCE SCORE
          </span>

          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#00D4FF"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * resilienceScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 shadow-[0_0_15px_#00D4FF]"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono font-bold text-4xl text-[#E8EDF5] font-tabular">
                {Math.round(resilienceScore)}
              </span>
              <span className="text-[10px] font-mono text-[#10B981] font-bold uppercase tracking-wider">
                NOMINAL
              </span>
            </div>
          </div>

          <span className="text-xs font-mono text-[#00D4FF] font-semibold mt-1">
            +6% vs ESA COGNISPACE BENCHMARK
          </span>
        </div>

        {/* Norms Comparison Card */}
        <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="font-hud text-xs tracking-wider uppercase text-[#E8EDF5]">
              ESA COGNISPACE NORMATIVE ALIGNMENT
            </span>
            <Award size={16} className="text-[#00D4FF]" />
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[#A8B2C1] mb-1">
                <span>Reaction Time:</span>
                <span className="text-[#E8EDF5] font-bold font-tabular">268 ms (Norm: 280 ms)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#A8B2C1] mb-1">
                <span>Mental Rotation Accuracy:</span>
                <span className="text-[#E8EDF5] font-bold font-tabular">94.2% (Norm: 88.5%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-[#00D4FF] rounded-full" style={{ width: '94%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#A8B2C1] mb-1">
                <span>Reaction Variability (±SD):</span>
                <span className="text-[#E8EDF5] font-bold font-tabular">±18.4 ms (Nominal)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-[#4ADE80] rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 11-point Mood Survey Slider Card */}
        <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="font-hud text-xs tracking-wider uppercase text-[#E8EDF5]">
              DAILY MOOD SURVEY (INSPIRATION4 LIKERT)
            </span>
            <Smile size={16} className="text-[#FFA94D]" />
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[#A8B2C1]">
                <span>Overall Mood:</span>
                <span className="text-[#00D4FF] font-bold font-tabular">{mood} / 11</span>
              </div>
              <input
                type="range"
                min="1"
                max="11"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4FF] mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#A8B2C1]">
                <span>Alertness Level:</span>
                <span className="text-[#10B981] font-bold font-tabular">{alertness} / 11</span>
              </div>
              <input
                type="range"
                min="1"
                max="11"
                value={alertness}
                onChange={(e) => setAlertness(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#10B981] mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#A8B2C1]">
                <span>Stress Level:</span>
                <span className="text-[#EF4444] font-bold font-tabular">{stress} / 11</span>
              </div>
              <input
                type="range"
                min="1"
                max="11"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#EF4444] mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: HRV-Cognition Correlation Plot */}
      <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#00D4FF]" />
            <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              HRV VS REACTION TIME CORRELATION (PVT BENCHMARK)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#6B7688]">
            INSPIRATION4 AUTONOMIC DYNAMICS
          </span>
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hrv" name="HRV (ms)" unit="ms" stroke="#6B7688" tick={{ fill: '#6B7688', fontSize: 10 }} />
              <YAxis dataKey="rt" name="Reaction Time" unit="ms" domain={[240, 340]} stroke="#6B7688" tick={{ fill: '#6B7688', fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0C1220', border: '1px solid rgba(0,212,255,0.4)', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
              <ReferenceLine y={280} stroke="#4DA6FF" strokeDasharray="3 3" label={{ value: 'Norm (280ms)', fill: '#4DA6FF', fontSize: 10 }} />
              <Scatter name="Telemetry Points" data={correlationData} fill="#00D4FF" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full-Screen Reaction Test Takeover Modal */}
      {isTestActive && (
        <div className="fixed inset-0 z-50 bg-[#030509]/95 backdrop-blur-xl flex flex-col select-none p-6">
          {/* Top Test Header with Progress Ring */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {/* Circular Progress Ring */}
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#00D4FF"
                    strokeWidth="3"
                    strokeDasharray="94.2"
                    strokeDashoffset={94.2 - (94.2 * trial) / 5}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] font-bold text-white">{trial}/5</span>
              </div>
              <div>
                <span className="font-hud text-lg tracking-wider text-[#E8EDF5]">
                  REACTION TIME BATTERY
                </span>
                <span className="text-xs font-mono text-[#00D4FF] ml-3 uppercase">
                  TRIAL {trial} OF 5
                </span>
              </div>
            </div>
            <button
              onClick={closeTest}
              className="px-3 py-1 text-xs font-mono text-[#A8B2C1] hover:text-white rounded border border-white/10"
            >
              EXIT [ESC]
            </button>
          </div>

          {/* Center Interactive Tap Area */}
          <div
            onClick={handleTap}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer m-4 rounded-2xl border-2 transition-all relative overflow-hidden"
            style={{
              backgroundColor:
                testState === 'target'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : testState === 'falseStart'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(7, 11, 20, 0.6)',
              borderColor:
                testState === 'target'
                  ? '#10B981'
                  : testState === 'falseStart'
                  ? '#EF4444'
                  : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {testState === 'waiting' && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-[#00D4FF] animate-spin mx-auto" />
                <h3 className="font-hud text-xl text-white tracking-widest uppercase">
                  WAIT FOR TARGET...
                </h3>
                <p className="text-xs font-mono text-[#6B7688]">
                  DO NOT TAP YET · RANDOM 2-5s DELAY
                </p>
              </div>
            )}

            {testState === 'target' && (
              <div className="text-center space-y-2 animate-scale-up">
                <div className="w-24 h-24 rounded-full bg-[#10B981] mx-auto shadow-[0_0_50px_#10B981] flex items-center justify-center">
                  <Zap size={42} className="text-black fill-black" />
                </div>
                <h2 className="font-hud text-3xl font-black text-white tracking-widest">
                  TAP NOW!
                </h2>
              </div>
            )}

            {testState === 'falseStart' && (
              <div className="text-center space-y-2">
                <AlertTriangle size={48} className="text-[#EF4444] mx-auto animate-bounce" />
                <h3 className="font-hud text-xl text-[#EF4444] tracking-wider">
                  FALSE START!
                </h3>
                <p className="text-xs font-mono text-white/70">
                  Tapped too early. Resetting trial...
                </p>
              </div>
            )}

            {testState === 'finished' && (
              <div className="text-center space-y-4 max-w-md p-6 rounded-xl bg-[#070B14] border border-[#00D4FF]/40 shadow-[0_0_40px_rgba(0,212,255,0.2)]">
                <CheckCircle2 size={48} className="text-[#10B981] mx-auto" />
                <h2 className="font-hud text-2xl text-white tracking-wider">
                  BATTERY COMPLETE
                </h2>
                <div className="text-xs font-mono space-y-1 text-[#E8EDF5]">
                  <p>
                    Mean Reaction Time:{' '}
                    <strong className="text-[#00D4FF]">
                      {Math.round(trialsData.reduce((a, b) => a + b, 0) / trialsData.length)} ms
                    </strong>
                  </p>
                  <p>
                    Resilience Score Computed:{' '}
                    <strong className="text-[#10B981]">{resilienceScore} / 100</strong>
                  </p>
                </div>
                <button
                  onClick={closeTest}
                  className="px-6 py-2 rounded-lg bg-[#00D4FF] hover:bg-[#7DB9FF] text-black font-bold uppercase text-xs tracking-wider"
                >
                  SAVE & RETURN TO CONSOLE
                </button>
              </div>
            )}
          </div>

          {/* Bottom Trial Counter */}
          <div className="text-center text-xs font-mono text-[#6B7688]">
            TAP ANYWHERE ON SCREEN AS FAST AS POSSIBLE WHEN GREEN TARGET APPEARS
          </div>
        </div>
      )}
      {/* Neuro-Shield Information Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="ABOUT NEURO-SHIELD COGNITIVE RESILIENCE ENGINE"
        subtitle="ESA COGNISPACE & NASA HRP ARCHITECTURE"
      >
        <div className="space-y-4 text-xs font-mono text-[#CBD5E1] leading-relaxed">
          <div className="p-3.5 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#E0F2FE]">
            <strong>Neuro-Shield</strong> is an autonomous cognitive resilience and vigilance monitoring system designed for astronauts on long-duration orbital and deep-space missions.
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-xs">What It Measures:</h4>
            <ul className="list-disc pl-5 space-y-1 text-[#A8B2C1]">
              <li><strong className="text-white">Psychomotor Vigilance (PVT):</strong> Measures reaction time (ms) to detect micro-sleep lapses, circadian rhythm desynchronosis, and physical fatigue.</li>
              <li><strong className="text-white">Cognitive Stability:</strong> Benchmarked against the <strong>ESA COGNISPACE normative baseline (280 ms ± 35 ms)</strong> from parabolic and ISS bedrest studies.</li>
              <li><strong className="text-white">Multi-Dimensional Mood Spectrum:</strong> 3-axis tracking of mood, mental alertness, and acute mission stress.</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] text-[#94A3B8]">
            <strong>Clinical Safety:</strong> Detects early neurovestibular decline before high-stakes operations such as Extravehicular Activities (EVAs) or spacecraft docking.
          </div>
        </div>
      </Modal>
    </div>
  );
}
