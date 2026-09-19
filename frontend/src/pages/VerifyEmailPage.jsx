import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { verifyEmail } from '../lib/auth';
import Starfield from '../components/cinematic/Starfield';
import { Radio, CheckCircle2, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function executeVerification() {
      if (!token) {
        setError('Mission verification token is missing.');
        setLoading(false);
        return;
      }
      try {
        await verifyEmail(token);
        if (isMounted) {
          setSuccess(true);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Verification token is invalid or has expired.');
          setLoading(false);
        }
      }
    }
    executeVerification();
    return () => {
      isMounted = false;
    };
  }, [token]);

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

      {/* Content */}
      <div className="my-auto max-w-md w-full mx-auto relative z-10 py-12">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 backdrop-blur-xl shadow-2xl text-center">
          {loading && (
            <div className="py-8 space-y-4">
              <Loader2 size={36} className="text-[#00D4FF] animate-spin mx-auto" />
              <h2 className="font-hud text-lg font-bold text-white tracking-wider">
                CONFIRMING TRANSMISSION CHANNEL...
              </h2>
              <p className="text-xs font-mono text-[#A8B2C1]">
                VALIDATING ORBITAL VERIFICATION TOKEN WITH MISSION CONTROL
              </p>
            </div>
          )}

          {!loading && success && (
            <div className="py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto text-[#10B981]">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="font-hud text-2xl font-bold text-white tracking-wider">
                CLEARANCE VERIFIED
              </h2>
              <p className="text-xs font-mono text-[#A8B2C1] leading-relaxed">
                Your mission transmission channel is confirmed. Telemetry synchronization and medical alerts are active for your account.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] text-white font-hud text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              >
                <span>ENTER MISSION CONSOLE</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {!loading && error && (
            <div className="py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center mx-auto text-[#EF4444]">
                <ShieldAlert size={36} />
              </div>
              <h2 className="font-hud text-xl font-bold text-white tracking-wider">
                CLEARANCE FAILED
              </h2>
              <p className="text-xs font-mono text-[#FCA5A5] leading-relaxed">
                {error}
              </p>
              <p className="text-[11px] font-mono text-[#6B7688]">
                If you already verified this account, your credentials are valid. You may proceed to login.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-hud text-xs tracking-wider uppercase transition-colors"
              >
                Proceed to Login
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
