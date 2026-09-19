import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissionStore } from '../../store/useMissionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSound } from '../SoundProvider';
import { emergencySound } from '../../lib/emergencySound';
import { postEmergencyAlert } from '../../lib/api';
import ISSTrackerWidget from '../cinematic/ISSTrackerWidget';
import Modal from '../common/Modal';
import { AlertOctagon, Shield, KeyRound, LogOut, AlertTriangle } from 'lucide-react';

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { play } = useSound();
  const {
    crew,
    selectedAstronautId,
    setAstronaut,
    emergencyMode,
    setEmergencyMode,
  } = useMissionStore();

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [screenPulse, setScreenPulse] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const selectedCrew = crew.find((c) => c.id === selectedAstronautId) || crew[0];
  const getMemberName = (m) => (m.callsign === 'CDR' && user?.full_name ? user.full_name : m.name);

  const handleEmergencyTrigger = () => {
    if (emergencyMode) {
      setEmergencyMode(false);
    } else {
      setShowEmergencyModal(true);
    }
  };

  const confirmEmergency = async () => {
    setBroadcasting(true);
    try {
      await postEmergencyAlert({
        astronaut_id: selectedAstronautId,
        reason: `Acute crew distress beacon triggered by ${user?.full_name || 'Commander'}`,
      });
    } catch (e) {
      console.warn('Emergency dispatch error:', e);
    }
    setBroadcasting(false);
    setShowEmergencyModal(false);
    setEmergencyMode(true);
    
    // Play emergency sound & trigger tactile vibration
    emergencySound.play();
    play('critical');
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Red full-screen pulse animation for 2 seconds
    setScreenPulse(true);
    setTimeout(() => {
      setScreenPulse(false);
    }, 2000);
  };

  return (
    <>
      {/* Full-screen red emergency pulse for 2 seconds */}
      {screenPulse && (
        <div
          className="fixed inset-0 z-[9999] pointer-events-none bg-red-600/35 animate-pulse border-4 border-red-500 shadow-[inset_0_0_100px_rgba(220,38,38,0.9)]"
          aria-hidden="true"
        />
      )}

      <header className="h-16 w-full border-b border-white/10 bg-[#070B14]/80 backdrop-blur-xl px-4 flex items-center justify-between z-20 select-none">
        {/* Left: Mobile Title & ISS Widget */}
        <div className="flex items-center gap-4">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#0B3D91]/60 border border-[#00D4FF]/40 flex items-center justify-center">
              <span className="font-hud font-bold text-xs text-[#00D4FF]">AV</span>
            </div>
            <span className="font-hud font-bold text-sm tracking-wider">ASTROVITALS</span>
          </div>

          {/* Live ISS Widget */}
          <ISSTrackerWidget />
        </div>

        {/* Right Controls: Crew Selector, Emergency Button, User Status */}
        <div className="flex items-center gap-3">
          {/* Astronaut Selector */}
          <div className="relative flex items-center">
            <label htmlFor="astronaut-select" className="sr-only">Select Crew Member</label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0C1220] border border-white/10 hover:border-[#00D4FF]/40 transition-colors">
              {/* Status ring avatar */}
              <div className="relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border ${
                    selectedCrew.status === 'nominal'
                      ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                      : 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]'
                  }`}
                >
                  {selectedCrew.callsign}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${
                    selectedCrew.status === 'nominal' ? 'bg-[#10B981]' : 'bg-[#FBBF24]'
                  }`}
                />
              </div>

              {/* Select Dropdown */}
              <select
                id="astronaut-select"
                value={selectedAstronautId}
                onChange={(e) => setAstronaut(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-display font-medium text-[#E8EDF5] focus:outline-none cursor-pointer pr-2"
              >
                {crew.map((member) => (
                  <option key={member.id} value={member.id} className="bg-[#0C1220] text-[#E8EDF5]">
                    {getMemberName(member)} ({member.callsign})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Emergency Mode Button */}
          <button
            onClick={handleEmergencyTrigger}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
              emergencyMode
                ? 'bg-[#DC2626] text-white shadow-[0_0_20px_#DC2626] animate-pulse border border-white/30'
                : 'bg-[#DC2626]/15 hover:bg-[#DC2626]/25 text-[#EF4444] border border-[#EF4444]/40'
            }`}
          >
            <AlertOctagon size={15} />
            <span className="hidden sm:inline">{emergencyMode ? 'ALARM ACTIVE' : 'EMERGENCY'}</span>
          </button>

          {/* User / Team Orbitrix Logo & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            {/* Team Orbitrix badge */}
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#0C1220]/70 border border-white/10">
              <img src="/images/orbitrix_logo.png" alt="Team Orbitrix" className="w-6 h-6 rounded-full border border-cyan-400/40 object-cover" />
              <span className="text-xs font-mono text-[#A8B2C1] hidden md:inline">Team Orbitrix</span>
            </div>

            {user && (
              <>
                {user.role === 'admin' && (
                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-xs font-mono text-[#C4B5FD]">
                    <Shield size={13} className="text-[#A78BFA]" />
                    <span className="font-bold">ADMIN CONSOLE</span>
                    <span className="text-white/60">· Welcome, {user.full_name}</span>
                  </div>
                )}
                <button
                  onClick={() => navigate('/settings')}
                  title="Console Settings"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#A8B2C1] hover:text-[#00D4FF] transition-colors"
                >
                  <KeyRound size={16} />
                </button>
                <button
                  onClick={handleLogout}
                  title="Logout Session"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#A8B2C1] hover:text-[#EF4444] transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Emergency Confirmation Modal */}
        <Modal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          title="CRITICAL MISSION DISTRESS BEACON"
          subtitle="CONFIRM IMMEDIATE FLEET & GROUND DISPATCH"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#FCA5A5] flex items-start gap-3">
              <AlertTriangle size={20} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>WARNING:</strong> Triggering this beacon immediately transmits an acute medical emergency alert to all orbiting crew members and mission flight surgeons at ground control via satellite relay.
              </div>
            </div>

            <p className="text-[#CBD5E1]">
              Are you sure you want to declare an emergency for astronaut <strong>{getMemberName(selectedCrew)} ({selectedCrew.callsign})</strong>?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono uppercase text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEmergency}
                disabled={broadcasting}
                className="px-5 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-hud font-bold uppercase text-xs tracking-wider shadow-[0_0_15px_#DC2626] transition-all"
              >
                {broadcasting ? 'DISPATCHING BEACON...' : 'CONFIRM EMERGENCY BEACON'}
              </button>
            </div>
          </div>
        </Modal>
      </header>
    </>
  );
}
