/**
 * AstroVitals Neuro-Shield - Operating Mode Switcher & Demo Scenario Selector.
 *
 * Allows seamless, instantaneous toggling between Live ESP32 Hardware Mode
 * and Demonstration Mode with 5 NASA clinical spaceflight scenarios.
 *
 * Team Orbitrix - NASA Space Apps Challenge 2026
 * Licensed under the Apache License, Version 2.0.
 */

import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { DEMO_SCENARIOS } from '../../lib/demoScenarios';
import { Cpu, Sparkles, ChevronDown, Radio } from 'lucide-react';

export default function OperatingModeToggle() {
  const {
    operatingMode,
    setOperatingMode,
    demoScenario,
    setDemoScenario,
    hardwareStatus,
  } = useMissionStore();

  const isDemo = operatingMode === 'DEMO';
  const isLive = operatingMode === 'LIVE';
  const isHwConnected = hardwareStatus?.isConnected;

  const handleModeChange = (mode) => {
    if (mode !== operatingMode) {
      setOperatingMode(mode);
    }
  };

  const currentScenarioObj = DEMO_SCENARIOS[demoScenario] || DEMO_SCENARIOS.nominal;

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Mode Switcher Segmented Control */}
      <div className="flex items-center p-0.5 rounded-lg bg-[#070B14] border border-white/10 shadow-inner">
        {/* Live Hardware Mode Button */}
        <button
          onClick={() => handleModeChange('LIVE')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
            isLive
              ? 'bg-[#0B3D91] text-[#00D4FF] border border-[#00D4FF]/40 shadow-[0_0_12px_rgba(0,212,255,0.3)]'
              : 'text-[#6B7688] hover:text-[#A8B2C1]'
          }`}
          title="Connect to physical ESP32 wearable hardware over Wi-Fi"
        >
          <Cpu size={13} className={isLive ? 'text-[#00D4FF]' : 'text-[#6B7688]'} />
          <span>LIVE HW</span>
          {isLive && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isHwConnected ? 'bg-[#10B981] animate-ping' : 'bg-amber-400'
              }`}
            />
          )}
        </button>

        {/* Demonstration Mode Button */}
        <button
          onClick={() => handleModeChange('DEMO')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
            isDemo
              ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
              : 'text-[#6B7688] hover:text-[#A8B2C1]'
          }`}
          title="Run authentic NASA clinical scenarios with deterministic simulation"
        >
          <Sparkles size={13} className={isDemo ? 'text-[#C4B5FD]' : 'text-[#6B7688]'} />
          <span>DEMO MODE</span>
        </button>
      </div>

      {/* Scenario Selector Dropdown (Visible only in Demo Mode) */}
      {isDemo && (
        <div className="relative flex items-center">
          <label htmlFor="scenario-select" className="sr-only">
            Select Mission Scenario
          </label>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0C1220] border border-[#8B5CF6]/30 text-xs font-mono text-[#E8EDF5]">
            <Radio size={12} className="text-[#C4B5FD] animate-pulse" />
            <select
              id="scenario-select"
              value={demoScenario}
              onChange={(e) => setDemoScenario(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-[#C4B5FD] focus:outline-none cursor-pointer pr-1"
            >
              {Object.values(DEMO_SCENARIOS).map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-[#0C1220] text-[#E8EDF5]">
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
