import React, { useState } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useSound } from '../components/SoundProvider';
import {
  Heart,
  Send,
  MessageCircle,
  Clock,
  ShieldCheck,
  Globe,
  Camera,
  Radio,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function FamilyPortal() {
  const { selectedAstronaut } = useMissionStore();
  const { play } = useSound();

  const [familyMessage, setFamilyMessage] = useState('');
  const [sentStatus, setSentStatus] = useState(false);
  const [pingSent, setPingSent] = useState(false);
  const [activeDeliveryStep, setActiveDeliveryStep] = useState(0);
  const [selectedTz, setSelectedTz] = useState('HOUSTON');

  const timezones = {
    HOUSTON: { label: 'Houston (CST / NASA JSC)', time: '05:18 AM', offset: 'UTC-5' },
    KENNEDY: { label: 'Cape Canaveral (EST / KSC)', time: '06:18 AM', offset: 'UTC-4' },
    UTC: { label: 'ISS Coordinated Universal (UTC)', time: '10:18 AM', offset: 'UTC+0' },
    TOKYO: { label: 'Tsukuba (JST / JAXA)', time: '19:18 PM', offset: 'UTC+9' },
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!familyMessage.trim()) return;
    setSentStatus(true);
    setActiveDeliveryStep(1);
    play('chatPing');

    setTimeout(() => setActiveDeliveryStep(2), 1200);
    setTimeout(() => setActiveDeliveryStep(3), 2400);
    setTimeout(() => {
      setActiveDeliveryStep(4);
      play('chatPing');
    }, 3600);

    setTimeout(() => {
      setFamilyMessage('');
      setSentStatus(false);
      setActiveDeliveryStep(0);
    }, 8000);
  };

  const handleHeartbeatPing = () => {
    setPingSent(true);
    play('heartbeat');
    setTimeout(() => setPingSent(false), 3500);
  };

  const albumPhotos = [
    {
      title: 'Cupola Earth Aurora',
      caption: 'Passing over southern lights at 418km altitude.',
      tag: 'CUPOLA VIEW',
      gradient: 'from-emerald-950 via-teal-900 to-black',
    },
    {
      title: 'Microgravity Crew Dinner',
      caption: 'Floating tortillas and rehydrated feast in Node 1.',
      tag: 'GALLEY ZERO-G',
      gradient: 'from-indigo-950 via-blue-900 to-black',
    },
    {
      title: 'Spacewalk EVA-42',
      caption: 'Servicing the exterior Alpha Magnetic Spectrometer.',
      tag: 'OUTSIDE ISS',
      gradient: 'from-slate-900 via-sky-950 to-black',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none font-display">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 font-semibold uppercase">
          EARTH-SIDE FAMILY CONSOLE
        </span>
        <h1 className="font-hud text-2xl sm:text-3xl font-bold tracking-wider text-[#E8EDF5]">
          ASTRONAUT WELLNESS GUARDIAN
        </h1>
        <p className="text-xs font-mono text-[#A8B2C1] uppercase tracking-wider">
          VIEWING: {selectedAstronaut?.name?.toUpperCase()} ({selectedAstronaut?.callsign}) · EXPEDITION 73
        </p>
      </div>

      {/* Large Wellness Score Card */}
      <div className="rounded-[16px] bg-gradient-to-br from-[#121A2D]/90 to-[#070B14]/95 border border-white/10 p-6 sm:p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
        {/* Timezone Switcher Widget */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/5 gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#6B7688]">
            <Globe size={14} className="text-[#00D4FF]" />
            <span className="text-white font-bold">{timezones[selectedTz].label}:</span>
            <span className="text-[#00D4FF] font-bold font-tabular">{timezones[selectedTz].time}</span>
            <span className="text-[10px] text-[#6B7688]">({timezones[selectedTz].offset})</span>
          </div>

          <div className="flex items-center gap-1 bg-[#0C1220] p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
            {Object.keys(timezones).map((tz) => (
              <button
                key={tz}
                onClick={() => setSelectedTz(tz)}
                className={`px-2 py-1 rounded transition-colors uppercase font-bold ${
                  selectedTz === tz ? 'bg-[#00D4FF]/20 text-[#00D4FF]' : 'text-[#6B7688] hover:text-white'
                }`}
              >
                {tz}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-mono text-[#A8B2C1] uppercase tracking-widest block">
          COMPOSITE CREW WELLNESS INDEX
        </span>

        {/* Big Score Display with Animated Heartbeat Pulse on Ping */}
        <div className="relative flex items-center justify-center py-2">
          {pingSent && (
            <div className="absolute w-36 h-36 rounded-full border-2 border-[#FF4D6D] animate-ping pointer-events-none" />
          )}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              pingSent
                ? 'bg-[#FF4D6D]/20 border-2 border-[#FF4D6D] shadow-[0_0_50px_#FF4D6D] scale-110'
                : 'bg-[#10B981]/15 border-2 border-[#10B981] shadow-[0_0_35px_rgba(16,185,129,0.3)]'
            }`}
          >
            <span className="font-mono font-bold text-4xl text-white font-tabular">92%</span>
          </div>
        </div>

        <h3 className="font-hud text-xl text-[#10B981] tracking-widest font-bold">
          EXCELLENT · NOMINAL VIGILANCE
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-3 border-t border-white/5 text-xs font-mono">
          <div className="p-2.5 rounded bg-white/5">
            <span className="text-[#6B7688] block">Heart Rate</span>
            <span className="font-bold text-[#FF4D6D]">72 BPM</span>
          </div>
          <div className="p-2.5 rounded bg-white/5">
            <span className="text-[#6B7688] block">Sleep Quality</span>
            <span className="font-bold text-[#10B981]">8.2 / 10</span>
          </div>
          <div className="p-2.5 rounded bg-white/5">
            <span className="text-[#6B7688] block">Activity Done</span>
            <span className="font-bold text-[#4ADE80]">45 min</span>
          </div>
          <div className="p-2.5 rounded bg-white/5">
            <span className="text-[#6B7688] block">Comms Window</span>
            <span className="font-bold text-[#00D4FF]">14:30 UTC</span>
          </div>
        </div>
      </div>

      {/* Send Message & Heartbeat Ping Section with Delivery Progress */}
      <div className="rounded-[16px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <MessageCircle size={17} className="text-[#00D4FF]" />
            <span className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              SEND A FAMILY MESSAGE TO {selectedAstronaut?.name?.toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-mono text-[#6B7688]">
            NEXT COMM WINDOW: 14:30 UTC
          </span>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-3">
          <textarea
            rows="3"
            value={familyMessage}
            onChange={(e) => setFamilyMessage(e.target.value)}
            placeholder="Write a warm note, send kids' art updates, or share encouragement..."
            className="w-full bg-[#0C1220] text-xs sm:text-sm font-body text-[#E8EDF5] placeholder-[#6B7688] p-3.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#00D4FF]/60 transition-colors"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleHeartbeatPing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-mono uppercase font-bold transition-all ${
                pingSent
                  ? 'bg-[#FF4D6D] text-white border-[#FF4D6D] shadow-[0_0_20px_#FF4D6D] scale-105'
                  : 'bg-[#FF4D6D]/20 hover:bg-[#FF4D6D]/30 text-[#FF4D6D] border-[#FF4D6D]/40'
              }`}
            >
              <Heart size={15} className={pingSent ? 'fill-white animate-ping' : ''} />
              <span>{pingSent ? 'HEARTBEAT PING SENT TO ORBIT!' : 'SEND HEARTBEAT PING'}</span>
            </button>

            <button
              type="submit"
              disabled={!familyMessage.trim() || sentStatus}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0B3D91] hover:bg-[#4A90E2] text-white font-mono text-xs uppercase font-bold disabled:opacity-40 border border-[#4A90E2]/40 transition-all shadow-md"
            >
              <Send size={14} />
              <span>Queue Message</span>
            </button>
          </div>
        </form>

        {/* Message Delivery Progress Indicator */}
        {sentStatus && (
          <div className="p-4 rounded-xl bg-[#070B14] border border-[#00D4FF]/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#00D4FF] font-bold uppercase flex items-center gap-2">
                <Radio size={14} className="animate-spin" />
                <span>Interplanetary Transmission Status</span>
              </span>
              <span className="text-white font-bold">
                {activeDeliveryStep === 4 ? 'DELIVERED TO CREW' : 'ROUTING THROUGH SPACE NETWORK'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
              {[
                { step: 1, label: '1. White Sands Uplink' },
                { step: 2, label: '2. TDRS-11 Geosync' },
                { step: 3, label: '3. ISS Zarya Antenna' },
                { step: 4, label: '4. Tablet Delivered' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-2 rounded border text-center transition-all ${
                    activeDeliveryStep >= s.step
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold'
                      : 'bg-white/5 border-white/5 text-[#6B7688]'
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orbit Photo Album Section */}
      <div className="rounded-[16px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Camera size={17} className="text-[#00D4FF]" />
            <span className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              EXPEDITION 73 CREW PHOTO DISPATCHES
            </span>
          </div>
          <span className="text-xs font-mono text-[#6B7688]">3 NEW PHOTOS THIS WEEK</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {albumPhotos.map((photo, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border border-white/10 bg-gradient-to-b ${photo.gradient} space-y-2 hover:border-[#00D4FF]/40 transition-all hover:scale-[1.02] cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#00D4FF]">
                  {photo.tag}
                </span>
                <Sparkles size={13} className="text-white/60" />
              </div>
              <h4 className="font-hud font-bold text-sm text-white">{photo.title}</h4>
              <p className="text-xs text-[#CBD5E1] font-display">{photo.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
