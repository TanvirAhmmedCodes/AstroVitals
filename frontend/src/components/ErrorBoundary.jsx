import React, { Component } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary — Global React Error Boundary for AstroVitals Neuro-Shield.
 *
 * Catches unhandled runtime rendering errors, displays a mission-grade recovery
 * console, and provides buttons to reload the application or return to safety.
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log telemetry error to console for diagnostic triage without leaking secrets
    console.error('[AstroVitals ErrorBoundary Caught Error]:', error?.message || error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#030509] text-[#E8EDF5] flex items-center justify-center p-4 font-display select-none">
          <div className="max-w-md w-full bg-[#0C1220] border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertOctagon size={32} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#EF4444] uppercase font-bold block">
                MISSION TELEMETRY FAULT DETECTED
              </span>
              <h1 className="font-hud text-xl sm:text-2xl font-bold text-white tracking-wide">
                Display Stream Interrupted
              </h1>
              <p className="text-xs font-mono text-[#94A3B8] leading-relaxed">
                An unexpected component anomaly occurred while rendering the flight deck. Core telemetry and background operations remain safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              >
                <RefreshCw size={15} />
                <span>Reload Console</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#CBD5E1] hover:text-white font-hud text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
              >
                <Home size={15} />
                <span>Return to Orbit</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 text-[10px] font-mono text-[#6B7688]">
              AstroVitals Neuro-Shield · MD Tanvir Ahmmed · Team Orbitrix
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
