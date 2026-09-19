import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useAuthStore } from '../store/useAuthStore';
import { fetchForecast, postForecastSimulation, apiClient } from '../lib/api';
import { useSound } from '../components/SoundProvider';
import {
  Cpu,
  Play,
  RotateCcw,
  TrendingDown,
  Sparkles,
  Dumbbell,
  Moon,
  Pill,
  Apple,
  BookmarkPlus,
  GitCompare,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function DigitalTwin() {
  const { user } = useAuthStore();
  const { selectedAstronaut } = useMissionStore();
  const { play } = useSound();

  const subjectName = (selectedAstronaut?.callsign === 'CDR' && user?.full_name)
    ? user.full_name
    : (user?.full_name || selectedAstronaut?.name || 'MD Tanvir Ahmmed');

  // Simulation Sliders
  const [exerciseHours, setExerciseHours] = useState(2.0); // 1 to 4h
  const [sleepHours, setSleepHours] = useState(7.5); // 4 to 10h
  const [medAdherence, setMedAdherence] = useState(85); // 0 to 100%
  const [nutritionQuality, setNutritionQuality] = useState(80); // 0 to 100%

  const [simulating, setSimulating] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // Generate 180-day projection curves
  const generateCurves = (ex, sl, med, nut) => {
    // Quality factor reduces decay
    const interventionFactor = (ex / 2.5) * 0.35 + (sl / 8.0) * 0.30 + (med / 100.0) * 0.20 + (nut / 100.0) * 0.15;

    return [0, 30, 60, 90, 120, 150, 180].map((day) => {
      // Unmitigated risk grows linearly in microgravity
      const noIntervention = Math.min(95, Math.round(15 + (day / 180) * 75));
      // Mitigated risk stays low or stabilizes
      const mitigated = Math.max(10, Math.min(85, Math.round(15 + (day / 180) * 75 * (1 - interventionFactor * 0.72))));
      // Conservative benchmark scenario (e.g. Standard ISS baseline)
      const standardIssBaseline = Math.max(15, Math.min(90, Math.round(15 + (day / 180) * 75 * 0.65)));

      return {
        day: `Day ${day}`,
        noIntervention,
        mitigated,
        standardIssBaseline,
      };
    });
  };

  const [projectionData, setProjectionData] = useState(() =>
    generateCurves(2.0, 7.5, 85, 80)
  );

  // Live real-time chart recalculation on slider change
  useEffect(() => {
    const updated = generateCurves(exerciseHours, sleepHours, medAdherence, nutritionQuality);
    setProjectionData(updated);
  }, [exerciseHours, sleepHours, medAdherence, nutritionQuality]);

  const handleRunSimulation = async () => {
    setSimulating(true);
    play('caution');
    try {
      const res = await postForecastSimulation({
        astronaut_id: selectedAstronaut?.id || 'astronaut-A',
        exercise_hours: exerciseHours,
        sleep_hours: sleepHours,
        med_adherence: medAdherence,
        nutrition: nutritionQuality,
      });
      if (res?.projection_data) {
        setProjectionData(res.projection_data);
      } else {
        setProjectionData(generateCurves(exerciseHours, sleepHours, medAdherence, nutritionQuality));
      }
    } catch (e) {
      setProjectionData(generateCurves(exerciseHours, sleepHours, medAdherence, nutritionQuality));
    } finally {
      setSimulating(false);
      play('chatPing');
    }
  };

  const handleSaveScenario = async () => {
    const scenario = {
      name: `Scenario ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      astronaut_id: selectedAstronaut?.id || 'astronaut-A',
      exercise_hours: exerciseHours,
      sleep_hours: sleepHours,
      med_adherence: medAdherence,
      nutrition: nutritionQuality,
      savedAt: new Date().toISOString(),
    };

    try {
      await apiClient.post('/analytics/save-scenario', scenario);
    } catch (e) {
      // Local fallback
    }

    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('astrovitals_saved_scenarios') || '[]');
      localStorage.setItem('astrovitals_saved_scenarios', JSON.stringify([scenario, ...existing.slice(0, 4)]));
    }
    setSavedNotice(true);
    play('chatPing');
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    setExerciseHours(2.0);
    setSleepHours(7.5);
    setMedAdherence(85);
    setNutritionQuality(80);
    setProjectionData(generateCurves(2.0, 7.5, 85, 80));
    play('tick');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5] flex items-center gap-2">
            <Cpu className="text-[#00D4FF]" />
            <span>DIGITAL TWIN · 180-DAY TRAJECTORY SIMULATOR</span>
          </h1>
          <p className="text-xs font-mono text-[#A8B2C1] mt-1 tracking-wider uppercase">
            ASTRONAUT: {subjectName.toUpperCase()} · AUTONOMOUS COUNTERMEASURE PROJECTION
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Compare Scenarios Toggle */}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono uppercase transition-colors ${
              compareMode
                ? 'bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.2)] font-bold'
                : 'bg-white/5 text-[#A8B2C1] border-white/10 hover:text-white'
            }`}
          >
            <GitCompare size={14} />
            <span>{compareMode ? 'Comparing' : 'Compare Standard'}</span>
          </button>

          {/* Save Scenario Button */}
          <button
            onClick={handleSaveScenario}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono uppercase transition-colors ${
              savedNotice
                ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50'
                : 'bg-white/5 text-[#A8B2C1] border-white/10 hover:text-white'
            }`}
          >
            {savedNotice ? <Check size={14} /> : <BookmarkPlus size={14} />}
            <span>{savedNotice ? 'Scenario Saved' : 'Save Scenario'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A8B2C1] border border-white/10 text-xs font-mono uppercase"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0B3D91] hover:bg-[#4A90E2] text-white border border-[#4A90E2]/50 shadow-[0_0_20px_rgba(74,144,226,0.4)] text-xs font-mono uppercase font-bold transition-all"
          >
            <Play size={14} className={simulating ? 'animate-spin' : ''} />
            <span>{simulating ? 'COMPUTING...' : 'RUN SIMULATION'}</span>
          </button>
        </div>
      </div>

      {/* Simulator Control Sliders Grid with Impact Preview Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Exercise Slider */}
        <div className="p-4 rounded-[12px] bg-[#070B14]/80 border border-white/10 backdrop-blur-md space-y-2 hover:border-[#00D4FF]/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A8B2C1] uppercase font-semibold flex items-center gap-1.5">
              <Dumbbell size={14} className="text-[#00D4FF]" />
              <span>Exercise Load:</span>
            </span>
            <span className="text-[#00D4FF] font-bold font-tabular">{exerciseHours} h/day</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.5"
            value={exerciseHours}
            onChange={(e) => setExerciseHours(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4FF]"
          />
          <span className="text-[10px] font-mono text-[#6B7688] block">
            Penguin suit / ARED resistance & T2 cycle
          </span>
        </div>

        {/* Sleep Slider */}
        <div className="p-4 rounded-[12px] bg-[#070B14]/80 border border-white/10 backdrop-blur-md space-y-2 hover:border-[#10B981]/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A8B2C1] uppercase font-semibold flex items-center gap-1.5">
              <Moon size={14} className="text-[#10B981]" />
              <span>Sleep Protocol:</span>
            </span>
            <span className="text-[#10B981] font-bold font-tabular">{sleepHours} h/night</span>
          </div>
          <input
            type="range"
            min="4.0"
            max="10.0"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
          />
          <span className="text-[10px] font-mono text-[#6B7688] block">
            Circadian light control & sleep hygiene
          </span>
        </div>

        {/* Medication Adherence Slider */}
        <div className="p-4 rounded-[12px] bg-[#070B14]/80 border border-white/10 backdrop-blur-md space-y-2 hover:border-[#FFA94D]/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A8B2C1] uppercase font-semibold flex items-center gap-1.5">
              <Pill size={14} className="text-[#FFA94D]" />
              <span>Med Adherence:</span>
            </span>
            <span className="text-[#FFA94D] font-bold font-tabular">{medAdherence}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={medAdherence}
            onChange={(e) => setMedAdherence(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FFA94D]"
          />
          <span className="text-[10px] font-mono text-[#6B7688] block">
            Antioxidant & bone-density therapeutics
          </span>
        </div>

        {/* Nutrition Quality Slider */}
        <div className="p-4 rounded-[12px] bg-[#070B14]/80 border border-white/10 backdrop-blur-md space-y-2 hover:border-[#B873FF]/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A8B2C1] uppercase font-semibold flex items-center gap-1.5">
              <Apple size={14} className="text-[#B873FF]" />
              <span>Nutrition Quality:</span>
            </span>
            <span className="text-[#B873FF] font-bold font-tabular">{nutritionQuality}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={nutritionQuality}
            onChange={(e) => setNutritionQuality(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B873FF]"
          />
          <span className="text-[10px] font-mono text-[#6B7688] block">
            Caloric balance, hydration & micronutrients
          </span>
        </div>
      </div>

      {/* 180-Day Comparative Trajectory Chart */}
      <div className="rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-white/5 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#00D4FF]" />
            <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              PROJECTED COMPOSITE RISK CURVES (0 TO 180 DAYS)
            </h2>
          </div>
          <div className="text-xs font-mono text-[#10B981] font-semibold">
            ESTIMATED HEALTH CONSERVATION: +68% AT DAY 180
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6B7688" tick={{ fill: '#6B7688', fontSize: 11 }} />
              <YAxis stroke="#6B7688" domain={[0, 100]} tick={{ fill: '#6B7688', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0C1220',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line
                type="monotone"
                dataKey="noIntervention"
                name="Baseline Trajectory (No Countermeasures)"
                stroke="#EF4444"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#EF4444' }}
              />
              <Line
                type="monotone"
                dataKey="mitigated"
                name="Optimized Protocol (With Interventions)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981' }}
              />
              {compareMode && (
                <Line
                  type="monotone"
                  dataKey="standardIssBaseline"
                  name="Standard NASA ISS Baseline"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: '#F59E0B' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
