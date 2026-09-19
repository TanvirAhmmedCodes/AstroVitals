import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Starfield from '../components/cinematic/Starfield';
import VideoBackground from '../components/cinematic/VideoBackground';
import { VIDEOS } from '../config/videos';
import { Radio, Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import AmbientSoundToggle from '../components/cinematic/AmbientSoundToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Read destination from query param if available
  const params = new URLSearchParams(location.search);
  const redirectTarget = params.get('redirect') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await login({ email, password });
      if (data?.user?.role === 'admin' && redirectTarget === '/dashboard') {
        navigate('/admin');
      } else {
        navigate(redirectTarget);
      }
    } catch (err) {
      setError(err.message || 'Mission authentication failed. Check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030509] text-[#E8EDF5] flex relative overflow-hidden select-none font-display">
      {/* Background canvas */}
      <Starfield opacity={0.25} />

      {/* Ambient Space Sound Toggle */}
      <AmbientSoundToggle />

      {/* Left Column: Cinematic Mission Visual (Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10 border-r border-white/10 bg-gradient-to-br from-[#070B14]/90 via-[#0C1220]/80 to-[#030509]/95 backdrop-blur-md overflow-hidden">
        {/* NASA Deep Nebula Video Background */}
        <VideoBackground
          src={VIDEOS.nebulaZoom.src}
          poster={VIDEOS.nebulaZoom.poster}
          opacity={0.35}
          overlay={true}
        />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0B3D91]/60 border border-[#00D4FF]/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)]">
            <Radio size={22} className="text-[#00D4FF]" />
          </div>
          <div>
            <span className="font-hud font-bold text-base tracking-widest text-[#E8EDF5] block">
              ASTROVITALS
            </span>
            <span className="text-[10px] font-mono text-[#00D4FF] tracking-widest uppercase">
              NEURO-SHIELD · ORBITAL EDITION
            </span>
          </div>
        </div>

        <div className="max-w-md my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-xs font-mono text-[#00D4FF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-ping" />
            TELEMETRY LINK ACTIVE · SECURE TLS
          </div>

          <h1 className="font-hud text-3xl xl:text-4xl font-bold tracking-wide leading-tight text-white">
            AUTONOMOUS HEALTH GUARDIAN FOR DEEP SPACE EXPLORATION
          </h1>

          <p className="text-sm text-[#A8B2C1] leading-relaxed">
            Real-time biometric dosimetry, NASA Human Research Program risk trajectories, and mission-critical psychological support for astronauts in microgravity.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs font-mono text-[#6B7688]">
            <div>
              <span className="text-[#00D4FF] font-bold block">NASA OSDR I4</span>
              <span>BIOMARKER NORMS</span>
            </div>
            <div>
              <span className="text-[#10B981] font-bold block">ESA COGNISPACE</span>
              <span>COGNITIVE BATTERY</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-[#6B7688] flex justify-between items-center">
          <span>MISSION SECURITY LEVEL: OMEGA-4</span>
          <span className="text-[#A8B2C1]">Made by MD Tanvir Ahmmed</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 relative z-10 max-w-xl mx-auto w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B3D91]/60 border border-[#00D4FF]/40 flex items-center justify-center">
              <Radio size={18} className="text-[#00D4FF]" />
            </div>
            <span className="font-hud font-bold text-sm tracking-wider">ASTROVITALS</span>
          </div>
          <Link to="/" className="text-xs font-mono text-[#00D4FF] hover:underline">
            ← Home
          </Link>
        </div>

        <div className="my-auto max-w-md w-full mx-auto py-8">
          <div className="mb-8">
            <h2 className="font-hud text-2xl font-bold text-white tracking-wider">
              MISSION ACCESS LOGIN
            </h2>
            <p className="text-xs font-mono text-[#A8B2C1] mt-1.5 uppercase tracking-wider">
              ENTER AUTHORIZED FLIGHT SURGEON OR OBSERVER CREDENTIALS
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#FCA5A5] text-xs font-mono flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-2">
                Mission Transmission Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7688]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="astronaut@orbitrix.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#A8B2C1]">
                  Security Access Key (Password)
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-mono text-[#00D4FF] hover:underline"
                >
                  Forgot Key?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7688]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#A8B2C1]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-[#070B14] text-[#00D4FF] focus:ring-0 cursor-pointer"
                />
                <span>Persist console authentication</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>LOGIN TO MISSION CONSOLE</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/10">
            <p className="text-xs text-[#A8B2C1] font-mono">
              New to AstroVitals?{' '}
              <Link to="/register" className="text-[#00D4FF] hover:underline font-bold">
                Create Account →
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-xs font-mono text-[#6B7688] pt-4">
          <span>Made by MD Tanvir Ahmmed · Team Orbitrix</span>
        </div>
      </div>
    </div>
  );
}
