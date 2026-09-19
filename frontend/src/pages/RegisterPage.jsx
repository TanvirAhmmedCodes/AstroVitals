import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Starfield from '../components/cinematic/Starfield';
import { Radio, Lock, Mail, User, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import AmbientSoundToggle from '../components/cinematic/AmbientSoundToggle';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validateName = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 64) {
      return 'Full name must be between 2 and 64 characters.';
    }
    if (!/^[A-Za-z\s\-'.]+$/.test(trimmed)) {
      return 'Full name can only contain letters, spaces, hyphens, and apostrophes.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const nameErr = validateName(fullName);
    if (nameErr) {
      setError(nameErr);
      return;
    }

    if (password.length < 8) {
      setError('Security access key must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Access keys do not match. Please re-enter.');
      return;
    }

    if (!agreedTerms) {
      setError('Please accept the mission protocol terms.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        email,
        password,
        full_name: fullName.trim(),
      });

      if (data?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030509] text-[#E8EDF5] flex relative overflow-hidden select-none font-display">
      <Starfield opacity={0.25} />

      {/* Ambient Space Sound Toggle */}
      <AmbientSoundToggle />

      {/* Left Column Visual */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10 border-r border-white/10 bg-gradient-to-br from-[#070B14]/90 via-[#0C1220]/80 to-[#030509]/95 backdrop-blur-md">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-mono text-[#10B981]">
            <CheckCircle2 size={14} className="text-[#10B981]" />
            OPEN-SOURCE ASTRONAUT ROSTER
          </div>

          <h1 className="font-hud text-3xl xl:text-4xl font-bold tracking-wide leading-tight text-white">
            JOIN THE EXPEDITION CREW
          </h1>

          <p className="text-sm text-[#A8B2C1] leading-relaxed">
            Create your astronaut profile to stream real-time physiological telemetry, receive individualized countermeasure protocols, and interact with the AI mission physician.
          </p>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs font-mono text-[#A8B2C1]">
            <div className="flex items-center gap-2 text-[#00D4FF] font-bold">
              <span>●</span>
              <span>AUTOMATIC CREW SLOT ASSIGNMENT</span>
            </div>
            <p className="text-[11px] text-[#6B7688]">
              New registrations dynamically populate Expedition 73 flight slots (CDR, MS1, MS2, MS3) and integrate directly with Mission Control.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-[#6B7688] flex justify-between items-center">
          <span>NASA SPACE APPS 2026 · TEAM ORBITRIX</span>
          <span className="text-[#A8B2C1]">Made by MD Tanvir Ahmmed</span>
        </div>
      </div>

      {/* Right Column Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 relative z-10 max-w-xl mx-auto w-full overflow-y-auto">
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
          <div className="mb-6">
            <h2 className="font-hud text-2xl font-bold text-white tracking-wider">
              NEW CREW REGISTRATION
            </h2>
            <p className="text-xs font-mono text-[#A8B2C1] mt-1.5 uppercase tracking-wider">
              ANYONE CAN JOIN · OPEN-SOURCE MISSION PLATFORM
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#FCA5A5] text-xs font-mono flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
                Full Name (Astronaut Roster)
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7688]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Commander Sarah Connor"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
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
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
                Security Access Key (Min 8 Chars)
              </label>
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

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
                Confirm Security Key
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7688]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-mono text-[#A8B2C1]">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-[#070B14] text-[#00D4FF] focus:ring-0 cursor-pointer"
                />
                <span>
                  I agree to NASA HRP medical telemetry monitoring guidelines and open-source scientific research terms.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>INITIALIZING CLEARANCE...</span>
                </>
              ) : (
                <>
                  <span>CREATE CREW ACCOUNT</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-5 border-t border-white/10">
            <p className="text-xs text-[#A8B2C1] font-mono">
              Already have an account?{' '}
              <Link to="/login" className="text-[#00D4FF] hover:underline font-bold">
                Login →
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-xs font-mono text-[#6B7688] pt-4">
          <span>Made by MD Tanvir Ahmmed · Team Orbitrix</span>
        </div>
      </div>
    </div>
  );
}
