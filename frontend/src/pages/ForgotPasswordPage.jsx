import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../lib/auth';
import Starfield from '../components/cinematic/Starfield';
import { Radio, Mail, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [resetLink, setResetLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await requestPasswordReset(email);
      if (res?.reset_link) {
        setResetLink(res.reset_link);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Transmission failed. Verify network connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030509] text-[#E8EDF5] flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none font-display">
      <Starfield opacity={0.2} />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/60 border border-[#00D4FF]/40 flex items-center justify-center">
            <Radio size={20} className="text-[#00D4FF]" />
          </div>
          <span className="font-hud font-bold text-sm tracking-wider">ASTROVITALS</span>
        </div>
        <Link to="/login" className="text-xs font-mono text-[#00D4FF] hover:underline">
          ← Back to Login
        </Link>
      </div>

      {/* Main Container */}
      <div className="my-auto max-w-md w-full mx-auto relative z-10 py-12">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 backdrop-blur-xl shadow-2xl">
          {!submitted ? (
            <>
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center mx-auto mb-4 text-[#00D4FF]">
                  <Mail size={24} />
                </div>
                <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wide text-white">
                  RESET ACCESS KEY
                </h1>
                <p className="text-xs font-mono text-[#A8B2C1] mt-2 leading-relaxed">
                  Enter your mission transmission email to dispatch emergency recovery instructions.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#FCA5A5] text-xs font-mono flex items-start gap-2">
                  <ShieldAlert size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
                    Registered Mission Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7688]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="astronaut@orbitrix.org"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-[0_0_20px_rgba(0,212,255,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>DISPATCHING KEY...</span>
                    </>
                  ) : (
                    <>
                      <span>SEND RECOVERY TRANSMISSION</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto text-[#10B981]">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="font-hud text-xl font-bold text-white tracking-wider">
                TRANSMISSION DISPATCHED
              </h2>
              <p className="text-xs font-mono text-[#A8B2C1] leading-relaxed">
                If the email <strong className="text-white">{email}</strong> is registered, password reset instructions have been routed through ground communications.
              </p>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#6B7688]">
                Emergency link remains valid for 60 minutes. Check your inbox and spam folder.
              </div>

              {resetLink && (
                <div className="p-3.5 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-left space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-hud font-bold text-[#00D4FF] tracking-wider uppercase">
                      Direct Recovery Link (Backup)
                    </span>
                    <span className="text-[10px] font-mono text-[#A8B2C1]">Local / Ground Bypass</span>
                  </div>
                  <p className="text-[11px] font-mono text-[#E8EDF5] break-all select-all bg-[#070B14] p-2 rounded border border-white/10">
                    {resetLink}
                  </p>
                  <a
                    href={resetLink}
                    className="inline-flex items-center gap-1.5 text-xs font-hud font-bold text-[#00D4FF] hover:underline"
                  >
                    <span>Proceed to Password Reset</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              )}

              <Link
                to="/login"
                className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-hud text-xs tracking-wider uppercase transition-colors"
              >
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-mono text-[#6B7688] relative z-10">
        <span>Made by MD Tanvir Ahmmed · Team Orbitrix</span>
      </div>
    </div>
  );
}
