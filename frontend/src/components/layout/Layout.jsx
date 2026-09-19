import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import HUDFrame from '../cinematic/HUDFrame';
import Starfield from '../cinematic/Starfield';
import EarthCurvature from '../cinematic/EarthCurvature';
import AnomalyBar from '../cinematic/AnomalyBar';
import { OriProvider } from '../ori/OriProvider';
import OriButton from '../ori/OriButton';
import OriWelcomeModal from '../ori/OriWelcomeModal';
import OriChatDrawer from '../ori/OriChatDrawer';
import { useMissionStore } from '../../store/useMissionStore';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export default function Layout() {
  const { emergencyMode, setEmergencyMode, selectedAstronaut, vitals } = useMissionStore();

  return (
    <OriProvider>
      <HUDFrame>
        {/* Background Starfield Canvas */}
        <Starfield opacity={0.16} />

        {/* Ambient Mission Control Grid Lines Overlay (Opacity 0.02) */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #00D4FF 1px, transparent 1px), linear-gradient(to bottom, #00D4FF 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Slow-moving Ambient Nebula Gradient Overlay */}
        <div className="pointer-events-none fixed top-0 right-1/4 w-[700px] h-[500px] bg-gradient-to-br from-[#0B3D91]/10 via-[#00D4FF]/5 to-[#EC4899]/5 rounded-full blur-[160px] -z-10 animate-pulse" />

        {/* Global Anomaly Alert Bar (slides down on anomaly detection) */}
        <AnomalyBar
          anomaly={vitals?.anomaly_detected || false}
          message="IsolationForest anomaly detector flagged acute cardiovascular or autonomic deviation."
        />

        {/* Emergency Overlay Banner if triggered */}
        {emergencyMode && (
          <div className="relative z-30 bg-[#DC2626]/90 border-b border-red-500 text-white px-4 py-2 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-sm font-mono font-bold">
              <AlertTriangle size={18} />
              <span>FULL MISSION EMERGENCY DECLARED FOR {selectedAstronaut?.name?.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-3 py-1 bg-white text-red-900 rounded font-bold text-xs">
                <PhoneCall size={14} /> CALL GROUND
              </button>
              <button
                onClick={() => setEmergencyMode(false)}
                className="text-xs uppercase underline hover:text-red-200"
              >
                Stand Down
              </button>
            </div>
          </div>
        )}

        {/* Main Layout Container */}
        <div className="flex-1 flex w-full relative z-10 overflow-hidden">
          {/* Persistent/Collapsible Sidebar */}
          <Sidebar />

          {/* Content Column */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <TopBar />

            <main className="flex-1 p-4 md:p-6 pb-20 sm:pb-6 max-w-7xl w-full mx-auto">
              <Outlet />
            </main>

            {/* Mission Footer */}
            <footer className="w-full py-4 text-center border-t border-white/5 text-[11px] font-mono text-[#6B7688] relative z-20">
              <span>AstroVitals Neuro-Shield · Made by </span>
              <strong className="text-[#E8EDF5]">MD Tanvir Ahmmed</strong>
              <span> · Team Orbitrix · NASA Space Apps Challenge 2026</span>
            </footer>

            {/* Earth Curvature Arc at bottom of scrollable views */}
            <EarthCurvature />
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />

        {/* Ori AI Companion: Floating Action Button, Welcome Modal, and Slide-in Drawer */}
        <OriButton />
        <OriWelcomeModal />
        <OriChatDrawer />
      </HUDFrame>
    </OriProvider>
  );
}
