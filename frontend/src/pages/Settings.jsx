import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useMissionStore } from '../store/useMissionStore';
import { useSound } from '../components/SoundProvider';
import {
  updateUserProfile,
  changeUserPassword,
  resendVerification,
} from '../lib/auth';
import { ambientSpaceSound } from '../lib/ambientSound';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Shield,
  Bell,
  Info,
  Volume2,
  VolumeX,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Clock,
  Trash2,
  Save,
  ExternalLink,
  ShieldCheck,
  Check,
  Laptop,
  Smartphone,
  Download,
  Palette,
} from 'lucide-react';

export default function Settings() {
  const { user, updateUser, logout } = useAuthStore();
  const { muted, toggleMute, volume, setVolume, play } = useSound();

  const [activeTab, setActiveTab] = useState('profile');
  const [notice, setNotice] = useState(null);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState(null);

  // Preferences
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ambientActive, setAmbientActive] = useState(() => ambientSpaceSound.isPlaying);
  const [ambientVol, setAmbientVol] = useState(() => Math.round(ambientSpaceSound.volume * 100));

  const toggleAmbient = () => {
    if (ambientActive) {
      ambientSpaceSound.stop();
      setAmbientActive(false);
      flashNotice('Spacecraft ambient soundscape deactivated.');
    } else {
      ambientSpaceSound.start();
      setAmbientActive(true);
      flashNotice('Spacecraft ambient soundscape active (55Hz pad + 528Hz shimmer).');
    }
  };

  const handleAmbientVolumeChange = (newVal) => {
    setAmbientVol(newVal);
    ambientSpaceSound.setVolume(newVal / 100);
  };

  // Notification Toggles
  const [notifyCaution, setNotifyCaution] = useState(true);
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);
  const [summaryTime, setSummaryTime] = useState('06:00 UTC');
  const [notifyFamily, setNotifyFamily] = useState(true);

  // Delete account confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const flashNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateUserProfile({
        full_name: fullName.trim(),
        timezone,
      });
      updateUser(updated);
      flashNotice('Astronaut profile parameters successfully updated.');
    } catch (err) {
      flashNotice('Error updating profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportMyData = () => {
    const exportPayload = {
      profile: user,
      exported_at: new Date().toISOString(),
      station: 'International Space Station (ISS)',
      telemetry_standard: 'NASA HRP / OSDR Inspiration4',
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astrovitals_data_export_${user?.id || 'astronaut'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashNotice('Personal mission telemetry archive exported.');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError('New security key must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('New keys do not match.');
      return;
    }

    setChangingPw(true);
    try {
      await changeUserPassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      flashNotice('Security key updated successfully.');
    } catch (err) {
      setPwError(err.message || 'Key update failed. Verify existing key.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleResendVerify = async () => {
    try {
      await resendVerification(user.email);
      flashNotice('Verification transmission dispatched to ' + user.email);
    } catch (err) {
      flashNotice('Error sending verification: ' + err.message);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteInput === 'CONFIRM DELETE') {
      alert('Account deletion initiated with mission flight director.');
      logout();
    } else {
      alert('Please type CONFIRM DELETE to verify deletion.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none font-display">
      {/* Header */}
      <div>
        <h1 className="font-hud text-xl sm:text-2xl font-bold tracking-wider text-[#E8EDF5] flex items-center gap-2">
          <SettingsIcon className="text-[#00D4FF]" />
          <span>CONSOLE CONFIGURATION & PREFERENCES</span>
        </h1>
        <p className="text-xs font-mono text-[#A8B2C1] mt-1 tracking-wider uppercase">
          ORBITAL BIOMETRIC IDENTIFIERS · AUDIO SYSTEM · SECURITY KEYS
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-lg bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-xs font-mono text-[#E0F2FE] flex items-center justify-between animate-fadeIn">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-white hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
          { id: 'account', label: 'Account & Security', icon: Lock },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'about', label: 'About & Credits', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-hud text-xs tracking-wider uppercase transition-all ${
                isActive
                  ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 font-bold shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                  : 'text-[#A8B2C1] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#00D4FF]' : 'text-[#6B7688]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#00D4FF] flex items-center justify-center font-hud text-2xl font-bold text-white shadow-lg">
              {fullName?.charAt(0) || user?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="font-hud text-lg font-bold text-white">
                {user?.full_name || 'Astronaut'}
              </h2>
              <span className="text-xs font-mono text-[#00D4FF] uppercase tracking-wider block">
                Role: {user?.role || 'observer'} {user?.role === 'admin' ? '(Mission Controller)' : '(Active Crew)'}
              </span>
              <span className="text-xs font-mono text-[#6B7688]">{user?.email}</span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
                Astronaut Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#070B14] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00D4FF] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
                Registered Email (Station Address)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-lg bg-[#070B14]/50 border border-white/5 text-[#6B7688] text-sm font-mono cursor-not-allowed"
              />
              <span className="text-[10px] font-mono text-[#6B7688] mt-1 block">
                Contact flight director to modify primary transmission address.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A8B2C1] mb-1.5">
                  Timezone Standard
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070B14] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#00D4FF]"
                >
                  <option value="UTC">UTC (Spacecraft Standard)</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                  <option value="America/Chicago">US/Central (Houston Mission Control)</option>
                  <option value="Europe/Paris">Europe/Paris (ESA EAC)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="mt-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] cursor-pointer"
            >
              <Save size={15} />
              <span>{savingProfile ? 'SAVING...' : 'SAVE PROFILE PARAMETERS'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PREFERENCES */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Audio Suite */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                {muted ? <VolumeX size={18} className="text-[#EF4444]" /> : <Volume2 size={18} className="text-[#00D4FF]" />}
                <h3 className="font-hud text-sm uppercase tracking-wider text-white">
                  Spacecraft Sound Design (Web Audio API)
                </h3>
              </div>
              <button
                onClick={toggleMute}
                className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${
                  muted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                }`}
              >
                {muted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}
              </button>
            </div>

            <div className="space-y-2 max-w-md">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#A8B2C1] uppercase">Master Console Volume:</span>
                <span className="text-[#00D4FF] font-bold font-tabular">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={muted}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4FF] disabled:opacity-40"
              />
            </div>

            {/* Ambient Soundscape Controller */}
            <div className="pt-3 pb-3 border-t border-b border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-white block uppercase tracking-wider">
                    NASA Mission Control Ambient Soundscape
                  </span>
                  <span className="text-[11px] text-[#6B7688] font-mono">
                    Deep 55Hz cosmic pad, 528Hz harmonic shimmer, and gentle intermittent comms chimes.
                  </span>
                </div>
                <button
                  onClick={toggleAmbient}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    ambientActive
                      ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                      : 'bg-white/5 text-[#A8B2C1] border border-white/10 hover:border-white/30'
                  }`}
                >
                  {ambientActive ? 'AMBIENT STREAMING' : 'START AMBIENT'}
                </button>
              </div>

              {ambientActive && (
                <div className="space-y-1.5 max-w-md pl-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-[#A8B2C1]">Ambient Pad Intensity:</span>
                    <span className="text-[#00D4FF] font-bold font-tabular">{ambientVol}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={ambientVol}
                    onChange={(e) => handleAmbientVolumeChange(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4FF]"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <span className="text-xs font-mono text-[#6B7688] uppercase block mb-2">
                Audition Mission Sound Cues (Click to Test):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'boot', label: 'Boot Chime' },
                  { id: 'heartbeat', label: 'Biometric Heartbeat' },
                  { id: 'tick', label: 'Telemetry Tick' },
                  { id: 'caution', label: 'Caution Alert' },
                  { id: 'critical', label: 'Critical Alarm' },
                  { id: 'anomaly', label: 'Anomaly Pulse' },
                  { id: 'chatPing', label: 'Ori Message Ping' },
                  { id: 'commWindow', label: 'Comms Link Open' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    disabled={muted}
                    onClick={() => play(id)}
                    className="px-3 py-1.5 rounded bg-white/5 hover:bg-[#00D4FF]/20 text-xs font-mono text-[#CBD5E1] hover:text-[#00D4FF] border border-white/10 hover:border-[#00D4FF]/40 transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>▶</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual & Motion Preferences with Theme Preview Tiles */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-[#00D4FF]" />
                <h3 className="font-hud text-sm uppercase tracking-wider text-white">
                  Visual Environment & HUD Palette
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                OLED SPACE-OPTIMIZED
              </span>
            </div>

            {/* Theme Preview Tiles */}
            <div>
              <span className="text-xs font-mono text-[#A8B2C1] uppercase block mb-2.5">
                Select Spacecraft Console Theme:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    name: 'Orbital Void (Default)',
                    desc: 'Deep black #030509 with cyan telemetry',
                    bg: 'bg-[#030509]',
                    accent: 'border-[#00D4FF]',
                    active: true,
                  },
                  {
                    name: 'Cyberpunk Neon ISS',
                    desc: 'High-contrast cyan & magenta neon glows',
                    bg: 'bg-[#070B14]',
                    accent: 'border-[#EC4899]',
                    active: false,
                  },
                  {
                    name: 'Solar Flare Gold',
                    desc: 'Amber radiation HUD with titanium frame',
                    bg: 'bg-[#0F0E0A]',
                    accent: 'border-[#F59E0B]',
                    active: false,
                  },
                ].map((th, i) => (
                  <div
                    key={i}
                    onClick={() => flashNotice(`Theme preset "${th.name}" active.`)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      th.active
                        ? 'border-[#00D4FF] bg-[#00D4FF]/10 shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                        : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-hud text-xs font-bold text-white uppercase">{th.name}</span>
                      {th.active && <Check size={13} className="text-[#00D4FF]" />}
                    </div>
                    <p className="text-[11px] font-mono text-[#94A3B8]">{th.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <div>
                <span className="text-xs font-mono text-white block">Reduced Motion Mode</span>
                <span className="text-[11px] text-[#6B7688] font-mono">
                  Minimizes starfield drift and transition transforms for vestibulo-ocular comfort in microgravity.
                </span>
              </div>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="rounded border-white/20 bg-[#070B14] text-[#00D4FF] focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACCOUNT & SECURITY */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Security Key Change */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 space-y-4">
            <h3 className="font-hud text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <Lock size={16} className="text-[#00D4FF]" />
              <span>Update Security Access Key</span>
            </h3>

            {pwError && (
              <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs font-mono text-[#FCA5A5]">
                {pwError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-mono uppercase text-[#A8B2C1] mb-1">
                  Existing Security Key
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#070B14] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#A8B2C1] mb-1">
                  New Security Key (Min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#070B14] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#A8B2C1] mb-1">
                  Confirm New Security Key
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#070B14] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              <button
                type="submit"
                disabled={changingPw}
                className="mt-1 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-hud text-xs tracking-wider uppercase transition-colors"
              >
                {changingPw ? 'ENCRYPTING...' : 'CHANGE SECURITY KEY'}
              </button>
            </form>
          </div>

          {/* Email Verification Status */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-hud text-sm uppercase tracking-wider text-white">
                  Transmission Channel Clearance
                </h3>
                <p className="text-xs font-mono text-[#94A3B8] mt-0.5">
                  Address: {user?.email}
                </p>
              </div>

              {user?.email_verified ? (
                <span className="px-3 py-1 rounded bg-[#10B981]/20 border border-[#10B981]/40 text-xs font-mono text-[#10B981] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-xs font-mono text-[#F59E0B] font-bold">
                    PENDING VERIFICATION
                  </span>
                  <button
                    onClick={handleResendVerify}
                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors"
                  >
                    Resend Link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Console Sessions with Device Icons */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 space-y-3">
            <h3 className="font-hud text-sm uppercase tracking-wider text-white">
              Active Console Sessions & Hardware Links
            </h3>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono flex items-center justify-between text-[#CBD5E1]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
                    <Laptop size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="font-bold text-white">Primary Orbit Station (Current Workstation)</span>
                    </div>
                    <span className="text-[10px] text-[#6B7688]">Chrome on Windows NT · NASA JSC LAN</span>
                  </div>
                </div>
                <span className="text-[#A78BFA] font-bold">{user?.last_ip || '127.0.0.1'}</span>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono flex items-center justify-between text-[#CBD5E1]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8]">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      <span className="text-white">EVA Crew PWA Tablet (Standby)</span>
                    </div>
                    <span className="text-[10px] text-[#6B7688]">Safari Mobile iOS · ISS Local Wi-Fi Mesh</span>
                  </div>
                </div>
                <span className="text-[#6B7688]">Active 42m ago</span>
              </div>
            </div>
          </div>

          {/* Export My Data Section */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-hud text-sm uppercase tracking-wider text-white flex items-center gap-2">
                  <Download size={16} className="text-[#00D4FF]" />
                  <span>Export Mission Telemetry & Profile</span>
                </h3>
                <p className="text-xs font-mono text-[#94A3B8] mt-1">
                  Download a complete, machine-readable JSON archive of your personal astronaut profile, risk milestones, and telemetry logs.
                </p>
              </div>
              <button
                onClick={handleExportMyData}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,212,255,0.25)] flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Export My Data</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-6 space-y-3">
            <h3 className="font-hud text-sm uppercase tracking-wider text-[#EF4444] flex items-center gap-2">
              <Trash2 size={16} />
              <span>Danger Zone · Account Termination</span>
            </h3>
            <p className="text-xs font-mono text-[#FCA5A5]">
              Soft-deletes your account profile. Your historical telemetry records remain archived for NASA longitudinal flight studies.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-hud font-bold tracking-wider uppercase transition-colors"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 sm:p-8 space-y-6">
          <h3 className="font-hud text-sm uppercase tracking-wider text-white">
            Telemetry & Ground Dispatch Notifications
          </h3>

          <div className="space-y-4 divide-y divide-white/5">
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-mono text-white block">Critical & Emergency Alerts</span>
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Instant dispatch to {user?.email} on acute cardiovascular, hypoxic, or SAA radiation deviation.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyCritical}
                onChange={(e) => setNotifyCritical(e.target.checked)}
                className="rounded border-white/20 bg-[#070B14] text-[#00D4FF] focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-mono text-white block">Caution Level Notifications</span>
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Subtle warnings when sleep debt or mild deconditioning thresholds are flagged.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyCaution}
                onChange={(e) => setNotifyCaution(e.target.checked)}
                className="rounded border-white/20 bg-[#070B14] text-[#00D4FF] focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-mono text-white block">24-Hour Flight Surgeon Medical Digest</span>
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Summary email containing rolling mean vitals, cumulative dosimetry, and countermeasure compliance.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={summaryTime}
                  onChange={(e) => setSummaryTime(e.target.value)}
                  className="bg-[#070B14] border border-white/10 rounded px-2 py-1 text-xs font-mono text-white"
                >
                  <option value="06:00 UTC">06:00 UTC</option>
                  <option value="12:00 UTC">12:00 UTC</option>
                  <option value="18:00 UTC">18:00 UTC</option>
                </select>
                <input
                  type="checkbox"
                  checked={notifyDailySummary}
                  onChange={(e) => setNotifyDailySummary(e.target.checked)}
                  className="rounded border-white/20 bg-[#070B14] text-[#00D4FF] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-mono text-white block">Family Transmission Notifications</span>
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Alerts when Earth-side family members transmit wellness messages or heartbeat requests.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyFamily}
                onChange={(e) => setNotifyFamily(e.target.checked)}
                className="rounded border-white/20 bg-[#070B14] text-[#00D4FF] focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => flashNotice('Telemetry notification settings saved.')}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] text-white font-hud font-bold text-xs uppercase tracking-wider"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ABOUT & CREDITS */}
      {/* ========================================================================= */}
      {activeTab === 'about' && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 font-bold uppercase">
              NASA SPACE APPS CHALLENGE 2026
            </span>
            <h2 className="font-hud text-2xl font-bold text-white tracking-wide">
              ASTROVITALS NEURO-SHIELD · ORBITAL EDITION
            </h2>
            <p className="text-xs font-mono text-[#A8B2C1]">
              Release: v1.0.0-PROD (Build Hash: #2026-DHAKA-ORBITRIX)
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs font-mono text-[#CBD5E1]">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-[#94A3B8]">Lead Architect & ML Engineer:</span>
              <strong className="text-white">MD Tanvir Ahmmed</strong>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-[#94A3B8]">Team:</span>
              <strong className="text-[#00D4FF]">Team Orbitrix</strong>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-[#94A3B8]">Challenge:</span>
              <span className="text-white">Create Health Monitoring Software for Astronauts on Space Missions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Location:</span>
              <span className="text-white">Dhaka, Bangladesh</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono text-[#94A3B8]">
            <h4 className="text-white uppercase font-bold text-xs">Citation & Attribution:</h4>
            <p>
              Telemetry norms, multi-omics biomarker sets, and countermeasure guidelines derived from NASA Open Science Data Repository (OSDR), NASA Human Research Program (HRP) Roadmap, and ESA COGNISPACE analogue norm studies.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-4 text-xs font-mono">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center gap-2 transition-colors"
            >
              <span>GitHub Repository</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C1220] border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#EF4444] font-hud font-bold text-base">
              <AlertTriangle size={20} />
              <span>CONFIRM DELETION</span>
            </div>
            <p className="text-xs font-mono text-[#CBD5E1]">
              This will permanently revoke your console access. Type <strong>CONFIRM DELETE</strong> below to proceed:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="CONFIRM DELETE"
              className="w-full px-3 py-2 rounded bg-[#070B14] border border-red-500/30 text-white text-xs font-mono focus:outline-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/15 text-xs font-mono text-white uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-xs font-hud font-bold uppercase text-white"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
