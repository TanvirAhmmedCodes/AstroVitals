import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { changeUserPassword } from '../lib/auth';
import { ShieldAlert, KeyRound, CheckCircle, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New security key must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New security keys do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New security key must be distinct from the initial temporary key.');
      return;
    }

    setLoading(true);
    try {
      const res = await changeUserPassword(oldPassword, newPassword);
      if (res.user) {
        updateUser(res.user);
      } else {
        updateUser({ password_change_required: false });
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update security key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030509] text-[#E8EDF5] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Starfield & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFB800]/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00D4FF]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="px-6 py-6 border-b border-[#1E2640]/60 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center">
            <ShieldAlert size={20} className="text-[#FFB800]" />
          </div>
          <div>
            <span className="font-hud font-bold tracking-wider text-sm block">ASTROVITALS</span>
            <span className="text-[10px] font-mono text-[#6B7688] tracking-widest uppercase">Security Protocol 04-A</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-[#00D4FF]">{user?.full_name || user?.email}</span>
          <span className="text-[10px] font-mono text-[#6B7688] block uppercase">Clearance: {user?.role || 'Observer'}</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-[#070B14]/90 border border-[#1E2640] rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/40 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={26} className="text-[#FFB800]" />
            </div>
            <h1 className="font-hud font-bold text-xl tracking-wider text-[#E8EDF5]">
              KEY ROTATION REQUIRED
            </h1>
            <p className="text-xs text-[#8A99AD] mt-2 leading-relaxed">
              Your mission profile requires setting a personal security key before telemetry and health telemetry can be unlocked.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/30 flex items-start gap-3">
              <AlertCircle size={18} className="text-[#FF453A] shrink-0 mt-0.5" />
              <div className="text-xs text-[#FF453A] font-medium leading-tight">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-[#30D158]/10 border border-[#30D158]/30 flex items-center gap-3">
              <CheckCircle size={18} className="text-[#30D158] shrink-0" />
              <div className="text-xs text-[#30D158] font-medium">
                Security key updated successfully. Launching mission console...
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Old / Temporary Password */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8A99AD] mb-2">
                Current / Initial Key
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current or temporary key"
                  className="w-full bg-[#0B101E] border border-[#1E2640] rounded-xl px-4 py-3 text-sm text-[#E8EDF5] placeholder-[#4A5568] focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7688] hover:text-[#E8EDF5] transition-colors"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8A99AD] mb-2">
                New Security Key
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#0B101E] border border-[#1E2640] rounded-xl px-4 py-3 text-sm text-[#E8EDF5] placeholder-[#4A5568] focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7688] hover:text-[#E8EDF5] transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8A99AD] mb-2">
                Confirm New Key
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new security key"
                className="w-full bg-[#0B101E] border border-[#1E2640] rounded-xl px-4 py-3 text-sm text-[#E8EDF5] placeholder-[#4A5568] focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0077FF] hover:from-[#38E1FF] hover:to-[#1A8CFF] text-[#030509] font-bold font-hud text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#00D4FF]/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#030509] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Commit Security Key</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#1E2640]/40 text-center text-xs text-[#6B7688] z-10 font-mono">
        Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
      </footer>
    </div>
  );
}
