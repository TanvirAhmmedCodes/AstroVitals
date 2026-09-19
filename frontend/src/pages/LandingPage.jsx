import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import Starfield from '../components/cinematic/Starfield';
import EarthCurvature from '../components/cinematic/EarthCurvature';
import VideoBackground from '../components/cinematic/VideoBackground';
import { VIDEOS } from '../config/videos';
import {
  Radio,
  Activity,
  Shield,
  Brain,
  Cpu,
  Heart,
  Zap,
  Globe,
  Users,
  FileText,
  Clock,
  Compass,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Database,
  ExternalLink,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Mic,
  WifiOff,
  Flame,
  Layers,
  Award,
  Volume2,
  VolumeX,
} from 'lucide-react';
import AmbientSoundToggle from '../components/cinematic/AmbientSoundToggle';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [simHeartRate, setSimHeartRate] = useState(72.4);
  const [simSpO2, setSimSpO2] = useState(98.3);
  const [simTemp, setSimTemp] = useState(36.52);
  const [simActivity, setSimActivity] = useState('rest');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mini live simulator ticker for preview section
  useEffect(() => {
    const interval = setInterval(() => {
      setSimHeartRate((prev) => +(71.0 + Math.sin(Date.now() / 1500) * 3.5 + Math.random() * 1.2).toFixed(1));
      setSimSpO2((prev) => +(98.0 + Math.sin(Date.now() / 3000) * 0.5 + (Math.random() * 0.4 - 0.2)).toFixed(1));
      setSimTemp((prev) => +(36.5 + Math.sin(Date.now() / 6000) * 0.15).toFixed(2));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#030509] text-[#E8EDF5] selection:bg-[#00D4FF]/30 selection:text-white font-display relative overflow-x-hidden">
      {/* Top Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4FF] via-[#3B82F6] to-[#8B5CF6] z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Ambient Space Sound Toggle */}
      <AmbientSoundToggle />

      {/* Sticky Top Navigation (Appears after 100px scroll) */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#070B14]/85 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl'
            : 'bg-transparent py-5 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/60 border border-[#00D4FF]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              <Radio size={19} className="text-[#00D4FF]" />
            </div>
            <div>
              <span className="font-hud font-bold text-sm tracking-wider text-white">ASTROVITALS</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-[#00D4FF] uppercase tracking-widest">
                NEURO-SHIELD
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-[#A8B2C1]">
            <a href="#briefing" className="hover:text-[#00D4FF] transition-colors">HRP HAZARDS</a>
            <a href="#preview" className="hover:text-[#00D4FF] transition-colors">LIVE PREVIEW</a>
            <a href="#data" className="hover:text-[#00D4FF] transition-colors">NASA DATA</a>
            <a href="#features" className="hover:text-[#00D4FF] transition-colors">CAPABILITIES</a>
            <a href="#tech" className="hover:text-[#00D4FF] transition-colors">AI & METRICS</a>
            <a href="#team" className="hover:text-[#00D4FF] transition-colors">TEAM</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-white/25 text-xs font-mono text-[#E8EDF5] hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white text-xs font-hud font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            >
              Launch Console
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO (100vh) */}
      {/* ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 pt-24 pb-12 overflow-hidden z-10">
        {/* NASA Public Domain Video Background: Earth from ISS */}
        <VideoBackground
          src={VIDEOS.earthFromIss.src}
          poster={VIDEOS.earthFromIss.poster}
          opacity={0.25}
          overlay={true}
        />
        <Starfield opacity={0.3} />

        {/* Ambient Nebula Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-[#0B3D91]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#00D4FF]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Top Mission Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0C1220]/80 border border-[#00D4FF]/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,212,255,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span className="text-xs font-mono tracking-widest text-[#00D4FF] uppercase font-bold">
            NASA SPACE APPS CHALLENGE 2026 · TEAM ORBITRIX
          </span>
        </motion.div>

        {/* Hero Headline & Tagline */}
        <div className="text-center max-w-4xl mx-auto my-auto space-y-6 pt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <h1 className="font-hud text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-wider leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E8EDF5] to-[#94A3B8] drop-shadow-[0_0_40px_rgba(0,212,255,0.35)]">
              ASTROVITALS
            </h1>
            <div className="mt-2 tracking-[0.3em] sm:tracking-[0.45em] font-mono text-xs sm:text-sm md:text-base text-[#00D4FF] uppercase font-semibold">
              NEURO-SHIELD · ORBITAL EDITION
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-xl md:text-2xl text-[#CBD5E1] font-normal max-w-2xl mx-auto leading-relaxed"
          >
            A wearable that reads the body.{' '}
            <span className="text-[#00D4FF] font-medium">An AI that understands the mind.</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xs sm:text-sm font-mono text-[#94A3B8] max-w-xl mx-auto"
          >
            Mission-grade physiological telemetry, NASA HRP countermeasure intelligence, and autonomous medical resilience for long-duration spaceflight.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud font-bold text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.7)] flex items-center gap-3 cursor-pointer"
            >
              <span>LAUNCH MISSION CONSOLE</span>
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/login"
              className="px-7 py-3.5 rounded-xl bg-[#0C1220]/80 hover:bg-[#121A2D] border border-white/15 hover:border-[#00D4FF]/40 text-[#E8EDF5] font-hud text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 backdrop-blur-md flex items-center gap-2"
            >
              <span>VIEW LIVE DEMO</span>
              <Sparkles size={16} className="text-[#00D4FF]" />
            </Link>
          </motion.div>
        </div>

        {/* Hero Footer Bar */}
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between text-xs font-mono text-[#6B7688] pt-6 border-t border-white/10 relative z-20">
          <div className="italic text-[#94A3B8] tracking-wide">
            Made by <span className="text-[#E8EDF5] font-semibold">MD Tanvir Ahmmed</span>
          </div>

          <a
            href="#briefing"
            className="hidden sm:flex items-center gap-1.5 text-[#00D4FF] hover:text-white transition-colors uppercase tracking-widest text-[11px] animate-bounce"
          >
            <span>EXPLORE MISSION BRIEFING</span>
            <ChevronDown size={14} />
          </a>

          <div className="text-right">
            <span>EXPEDITION 73 · ORBITAL LEO</span>
          </div>
        </div>

        {/* Earth Curvature graphic at bottom of hero */}
        <EarthCurvature />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: MISSION BRIEFING — NASA HRP 5 HAZARDS */}
      {/* ========================================================================= */}
      <section id="briefing" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-xs font-mono text-[#00D4FF] uppercase">
            <ShieldAlert size={14} />
            <span>OPERATIONAL FLIGHT DIRECTIVE</span>
          </div>
          <h2 className="font-hud text-2xl sm:text-4xl font-bold tracking-wide text-white">
            THE 5 HAZARDS OF HUMAN SPACEFLIGHT
          </h2>
          <p className="text-sm font-mono text-[#94A3B8] leading-relaxed">
            NASA Human Research Program (HRP) categorizes deep-space mission risks into five critical domains. AstroVitals Neuro-Shield deploys dedicated countermeasures for each.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: '01',
              title: 'SPACE RADIATION',
              icon: Zap,
              color: '#EF4444',
              badge: 'DOSIMETRY',
              summary: 'Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE) penetrate spacecraft hulls.',
              solution: 'Real-time dosimetric tracking, South Atlantic Anomaly (SAA) detection, and career limit (600 mSv) projection.',
            },
            {
              id: '02',
              title: 'ISOLATION & CONFINEMENT',
              icon: Brain,
              color: '#8B5CF6',
              badge: 'NEURO-SHIELD',
              summary: 'Months in confined habitats degrade circadian rhythm, alertness, and autonomic recovery.',
              solution: 'Daily ESA COGNISPACE cognitive tests, 4-7-8 autonomic cadence guidance, and mood resilience metrics.',
            },
            {
              id: '03',
              title: 'DISTANCE FROM EARTH',
              icon: Compass,
              color: '#00D4FF',
              badge: 'AUTONOMOUS AI',
              summary: 'Communication latencies up to 22 minutes eliminate real-time mission control telemedicine.',
              solution: 'Autonomous on-board AI companion grounded in NASA medical literature for emergency triage during blackouts.',
            },
            {
              id: '04',
              title: 'GRAVITY FIELDS',
              icon: Activity,
              color: '#10B981',
              badge: 'CARDIOVASCULAR',
              summary: 'Microgravity causes cephalad fluid shifts, cardiovascular deconditioning, and bone density loss.',
              solution: 'Continuous HRV monitoring, predictive cardiovascular trajectory models, and cycle ergometer protocol prompts.',
            },
            {
              id: '05',
              title: 'HOSTILE / CLOSED HABITATS',
              icon: Layers,
              color: '#F59E0B',
              badge: 'IMMUNE SURVEILLANCE',
              summary: 'Altered microbiome, acoustic stress, and air recirculators provoke latent viral reactivation.',
              solution: 'NASA OSDR multi-omics risk models predicting immune decline and recommending targeted micronutrients.',
            },
            {
              id: '06',
              title: 'EARTH-BENEFIT DUAL USE',
              icon: Globe,
              color: '#3B82F6',
              badge: 'GALACTIC IMPACT',
              summary: 'Technologies developed for orbit directly solve critical healthcare challenges on Earth.',
              solution: 'ICU autonomic telemetry, remote telemedicine for rural communities, and extreme environment worker protection.',
            },
          ].map((hazard) => {
            const Icon = hazard.icon;
            return (
              <div
                key={hazard.id}
                className="p-6 rounded-2xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 hover:border-[#00D4FF]/40 transition-all duration-300 group hover:-translate-y-1 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{ backgroundColor: `${hazard.color}15`, borderColor: `${hazard.color}40`, color: hazard.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border" style={{ backgroundColor: `${hazard.color}10`, borderColor: `${hazard.color}30`, color: hazard.color }}>
                    {hazard.badge}
                  </span>
                </div>
                <h3 className="font-hud text-lg font-bold text-white tracking-wider mb-2 group-hover:text-[#00D4FF] transition-colors">
                  {hazard.title}
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono mb-4 leading-relaxed">
                  {hazard.summary}
                </p>
                <div className="pt-3 border-t border-white/5 text-xs text-[#CBD5E1] font-display">
                  <strong className="text-white block font-mono text-[11px] mb-1">COUNTERMEASURE:</strong>
                  {hazard.solution}
                </div>
              </div>
            );
          })}
        </div>

        {/* NASA Mars Surface Descent Video Card */}
        <div className="mt-8 rounded-2xl overflow-hidden border border-[#EC4899]/30 bg-gradient-to-br from-[#0C1220] to-[#070B14] p-6 shadow-[0_0_30px_rgba(236,72,153,0.15)] flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EC4899] animate-ping" />
              <span className="font-hud text-xs font-bold text-[#EC4899] tracking-wider uppercase">
                DEEP SPACE OPERATIONAL TARGET
              </span>
            </div>
            <h3 className="font-hud text-xl sm:text-2xl font-bold text-white">
              MARTIAN DESCENT & SURFACE HABITAT RESILIENCE
            </h3>
            <p className="text-xs font-mono text-[#94A3B8] leading-relaxed">
              Autonomous medical telemetry designed for 3-year round-trip transit to Mars, compensating for communication latencies up to 22 minutes with autonomous physiological intelligence.
            </p>
          </div>
          <div className="w-full sm:w-[400px] h-[220px] sm:h-[240px] rounded-xl overflow-hidden border border-white/15 relative flex-shrink-0 shadow-2xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={VIDEOS.marsSurface.poster}
              className="w-full h-full object-cover"
            >
              <source src={VIDEOS.marsSurface.src} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
              NASA Perseverance Rover · Jezero Crater
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: LIVE DEMO PREVIEW (Interactive Widget) */}
      {/* ========================================================================= */}
      <section id="preview" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-[#0C1220]/95 via-[#070B14]/90 to-[#030509]/95 border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* NASA Astronaut EVA Loopable Video Banner */}
          <div className="mb-8 rounded-2xl overflow-hidden border border-[#00D4FF]/40 shadow-[0_0_25px_rgba(0,212,255,0.25)] relative h-36 sm:h-48 bg-black/40">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={VIDEOS.astronautWorking.poster}
              className="w-full h-full object-cover"
            >
              <source src={VIDEOS.astronautWorking.src} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/90 via-[#070B14]/40 to-transparent flex items-center p-6 pointer-events-none">
              <div className="max-w-sm space-y-1">
                <span className="text-[10px] font-mono text-[#00D4FF] tracking-widest uppercase font-bold">NASA ISS EVA OPERATIONS</span>
                <div className="font-hud text-sm sm:text-base font-bold text-white">MICROGRAVITY BIO-MONITORING</div>
                <div className="text-[11px] font-mono text-[#94A3B8]">Wearable bio-sensor validation in LEO orbital conditions.</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="font-hud text-xs tracking-widest text-[#10B981] uppercase font-bold">
                  SIMULATED SENSOR INTERFACE · ZERO CONFIGURATION
                </span>
              </div>
              <h2 className="font-hud text-xl sm:text-3xl font-bold text-white tracking-wide mt-1">
                REAL-TIME PHYSIOLOGICAL STREAM
              </h2>
            </div>
            <Link
              to="/vitals"
              className="px-4 py-2 rounded-lg bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] hover:bg-[#00D4FF]/25 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <span>Full Live Vitals Console</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 4 Interactive Live Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Heart Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="font-hud text-3xl sm:text-4xl font-bold text-[#E8EDF5] font-tabular">
                  {simHeartRate}
                </span>
                <span className="text-xs font-mono text-[#00D4FF]">BPM</span>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] block">● RSA SYNCHRONIZED</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Blood Oxygen</span>
              <div className="flex items-baseline gap-2">
                <span className="font-hud text-3xl sm:text-4xl font-bold text-[#E8EDF5] font-tabular">
                  {simSpO2}
                </span>
                <span className="text-xs font-mono text-[#10B981]">%</span>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] block">● OPTIMAL PERFUSION</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Skin Temperature</span>
              <div className="flex items-baseline gap-2">
                <span className="font-hud text-3xl sm:text-4xl font-bold text-[#E8EDF5] font-tabular">
                  {simTemp}
                </span>
                <span className="text-xs font-mono text-[#F59E0B]">°C</span>
              </div>
              <span className="text-[10px] font-mono text-[#A8B2C1] block">● HOMEOSTATIC</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Anomaly Detector</span>
              <div className="flex items-baseline gap-2">
                <span className="font-hud text-2xl sm:text-3xl font-bold text-[#10B981]">
                  NOMINAL
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8] block">ISOLATION FOREST: 0.0</span>
            </div>
          </div>

          {/* Simulated Waveform Line Display */}
          <div className="p-4 rounded-xl bg-[#030509] border border-white/10 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs font-mono text-[#6B7688] mb-2">
              <span>ECG / PHOTOPLETHYSMOGRAPHY SYNTHESIS</span>
              <span className="text-[#00D4FF]">TELEMETRY INTERVAL: 1.0 SEC</span>
            </div>
            <div className="h-16 w-full flex items-center justify-around gap-1 overflow-hidden">
              {Array.from({ length: 48 }).map((_, i) => {
                const height = Math.max(12, Math.sin(i * 0.45 + Date.now() / 300) * 28 + (i % 6 === 0 ? 55 : 20));
                return (
                  <div
                    key={i}
                    className="w-1 bg-[#00D4FF]/70 rounded-full transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: NASA DATA SHOWCASE */}
      {/* ========================================================================= */}
      <section id="data" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-xs font-mono text-[#3B82F6] uppercase">
            <Database size={14} />
            <span>GROUNDED SCIENTIFIC RIGOR</span>
          </div>
          <h2 className="font-hud text-2xl sm:text-4xl font-bold tracking-wide text-white">
            6 NASA & SPACE SCIENCE DATASETS USED
          </h2>
          <p className="text-sm font-mono text-[#94A3B8] leading-relaxed">
            AstroVitals Neuro-Shield does not use synthetic guesses. Every model, baseline, and countermeasure is calibrated on open spaceflight research data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: 'NASA OSDR INSPIRATION4',
              accession: 'OSD-569 / 570 / 571 / 575',
              features: 'Complete Blood Count, PBMC single-cell RNA, cfRNA, and serum cytokine arrays from civilian orbital flight.',
              role: 'Trained frozen cardiovascular, sleep/behavioral, and immune risk ensemble models.',
            },
            {
              name: 'NASA HRP EVIDENCE ROADMAP',
              accession: 'NASA/SP-2009-3405',
              features: 'Comprehensive human research risk catalog detailing space flight deconditioning and radiation carcinogenesis.',
              role: 'Prescribes precise operational countermeasures when composite risks exceed nominal bounds.',
            },
            {
              name: 'NASA-STD-3001',
              accession: 'NASA Technical Standard',
              features: 'Space Flight Human-System Standard Volume 1 (Crew Health) and Volume 2 (Habitability).',
              role: 'Establishes physiological alarm thresholds, oxygen partial pressures, and acoustic tolerances.',
            },
            {
              name: 'ESA COGNISPACE NORMS',
              accession: 'European Space Agency',
              features: 'Cognitive test battery baselines from parabolic flights and Antarctica Concordia isolation analogues.',
              role: 'Calibrates reaction time benchmark (mean 280 ms) and alertness scoring in Neuro-Shield.',
            },
            {
              name: 'NASA OSDR OSD-918',
              accession: 'GeneLab Omics Archive',
              features: 'Transcriptomic and mitochondrial stress data in human cardiomyocytes exposed to simulated microgravity.',
              role: 'Informs long-duration cardiovascular resilience modeling and mitochondrial decline risk.',
            },
            {
              name: 'LAUNCH LIBRARY 2 / OPEN NOTIFY',
              accession: 'Live Real-Time APIs',
              features: 'Orbital tracking vectors, ISS instantaneous coordinates, and upcoming worldwide spaceflight manifests.',
              role: 'Tracks ISS passage through the South Atlantic Anomaly (SAA) and provides global launch situational awareness.',
            },
          ].map((dataset, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0C1220]/80 border border-white/10 hover:border-[#00D4FF]/40 transition-all duration-300 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-hud font-bold text-sm text-[#00D4FF] tracking-wider">
                  {dataset.name}
                </span>
                <span className="text-[10px] font-mono text-[#A8B2C1] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {dataset.accession}
                </span>
              </div>
              <p className="text-xs text-[#CBD5E1] font-display leading-relaxed">
                {dataset.features}
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-[#94A3B8]">
                <strong className="text-white block text-[10px] uppercase mb-0.5">Platform Usage:</strong>
                {dataset.role}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: FEATURES GRID (12 Capabilities) */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-xs font-mono text-[#8B5CF6] uppercase">
            <Sliders size={14} />
            <span>MISSION CAPABILITIES</span>
          </div>
          <h2 className="font-hud text-2xl sm:text-4xl font-bold tracking-wide text-white">
            12 MISSION-GRADE FEATURES
          </h2>
          <p className="text-sm font-mono text-[#94A3B8] leading-relaxed">
            Engineered specifically for spacecraft instrument panels and high-stress microgravity operations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[
            { title: 'Live Vitals Streaming', icon: Activity, desc: 'Real-time Server-Sent Events (SSE) broadcasting continuous cardiac, oxygen, and temperature vitals.' },
            { title: 'Ensemble Risk Models', icon: Shield, desc: 'Frozen ML algorithms assessing cardiovascular, sleep/behavioral, and immune risk trajectories.' },
            { title: 'Radiation Dosimetry', icon: Zap, desc: 'Monitors cumulative microSieverts, SAA boundary passage, and tracks 600 mSv career safety limits.' },
            { title: 'Neuro-Shield Battery', icon: Brain, desc: 'Reaction time test and daily mood assessment calibrated against ESA Concordia isolation norms.' },
            { title: '7-Day Trend Heatmap', icon: Clock, desc: 'Calendar view mapping historical autonomic stability, anomaly counts, and biomarker progression.' },
            { title: 'AI Health Companion', icon: Sparkles, desc: 'Autonomous conversational assistant powered by Gemini with full live telemetry context injection.' },
            { title: 'Voice Commanding', icon: Mic, desc: 'Hands-free Web Speech API integration for astronaut operation during glove wear or task saturation.' },
            { title: 'Multi-Crew Mission Control', icon: Users, desc: 'Fleet-wide overview displaying live status, callsigns, and alert feeds across all active astronauts.' },
            { title: 'Digital Twin Simulator', icon: Cpu, desc: 'Forward-simulate countermeasure interventions to project 180-day mission health trajectories.' },
            { title: 'Earth-Side Family Portal', icon: Heart, desc: 'Transmits peace-of-mind wellness scores and bidirectional orbital heartbeat pings to Earth.' },
            { title: 'Cinematic Medical Dossier', icon: FileText, desc: 'One-click automated generation of multi-page, publication-grade PDF medical dossiers via ReportLab.' },
            { title: 'Offline PWA Resilience', icon: WifiOff, desc: 'Complete Service Worker offline caching for uninterrupted monitoring during orbital communications loss.' },
          ].map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-gradient-to-br from-[#0C1220]/80 to-[#070B14]/90 border border-white/10 hover:border-[#00D4FF]/40 transition-all duration-300 space-y-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={18} />
                </div>
                <h3 className="font-hud text-sm font-bold text-white tracking-wider group-hover:text-[#00D4FF] transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: TECHNICAL DEPTH & HONEST R2 DISCLOSURE */}
      {/* ========================================================================= */}
      <section id="tech" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0C1220]/90 to-[#070B14]/95 border border-white/10 shadow-2xl space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-mono text-[#10B981] uppercase">
              <CheckCircle2 size={14} />
              <span>SCIENTIFIC TRANSPARENCY & METHODOLOGY</span>
            </div>
            <h2 className="font-hud text-2xl sm:text-4xl font-bold tracking-wide text-white">
              HONEST MACHINE LEARNING ARCHITECTURE
            </h2>
            <p className="text-sm font-mono text-[#A8B2C1] leading-relaxed">
              In deep space medicine, honest uncertainty quantification saves lives. We proudly publish our raw validation metrics and choose scientific integrity over fabricated $R^2$ scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A8B2C1] uppercase">Cardiovascular Model</span>
                <span className="text-[#EF4444] font-bold">R² = -0.43</span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
                Ensemble of XGBoost, GradientBoosting, and RandomForest trained on Inspiration4 CBC profiles. Negative $R^2$ honestly represents small cohort sample size ($N=28$).
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A8B2C1] uppercase">Sleep / Behavioral Model</span>
                <span className="text-[#EF4444] font-bold">R² = -0.35</span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
                Calibrated on circadian rhythm misalignment and autonomic tone variance. Mean Absolute Error: 24.9 points on a 100-point deconditioning scale.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A8B2C1] uppercase">Real-Time Anomaly Detector</span>
                <span className="text-[#10B981] font-bold">PRIMARY SIGNAL</span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
                IsolationForest serves as the frontline alert mechanism, triggering instant caution banners when acute physiological deviation exceeds 3 MAD from baseline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: TEAM + CREDITS */}
      {/* ========================================================================= */}
      <section id="team" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="team-section max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 mb-6 text-center sm:text-left">
            <img
              src="/images/orbitrix_logo.png"
              alt="Team Orbitrix"
              className="w-20 h-20 rounded-full border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(74,144,226,0.3)] object-cover"
            />
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-cyan-300">
                TEAM ORBITRIX
              </h2>
              <p className="text-sm text-[#94A3B8] tracking-widest font-mono">
                NASA SPACE APPS CHALLENGE 2026 · DHAKA, BANGLADESH
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            <div className="team-member-card p-5 rounded-xl bg-[#0C1220]/80 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 text-left">
              <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Software, Model, ML</p>
              <p className="font-display text-lg font-bold text-white mt-1">MD Tanvir Ahmmed</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Team Lead · Full Stack · AI/ML Engineer</p>
            </div>
            <div className="team-member-card p-5 rounded-xl bg-[#0C1220]/80 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 text-left">
              <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Hardware</p>
              <p className="font-display text-lg font-bold text-white mt-1">Ishraq Ahmmed</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">ESP32 · Sensor Integration</p>
            </div>
            <div className="team-member-card p-5 rounded-xl bg-[#0C1220]/80 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 text-left">
              <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Hardware</p>
              <p className="font-display text-lg font-bold text-white mt-1">Suvajit Kumar Arja</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">PCB Design · Circuit Assembly</p>
            </div>
            <div className="team-member-card p-5 rounded-xl bg-[#0C1220]/80 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 text-left">
              <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Documentation & Videography</p>
              <p className="font-display text-lg font-bold text-white mt-1">Suborna Akter</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Documentation Lead</p>
            </div>
            <div className="team-member-card p-5 rounded-xl bg-[#0C1220]/80 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 text-left">
              <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Documentation & Videography</p>
              <p className="font-display text-lg font-bold text-white mt-1">Fatima Jahan Hitu</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Video Production · Storyboard</p>
            </div>
            <div className="team-member-card p-5 rounded-xl bg-[#0C1220]/80 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 text-left">
              <p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Testing</p>
              <p className="font-display text-lg font-bold text-white mt-1">Md. Afzal Hossain</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">QA · System Testing</p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[#94A3B8] italic font-display">
            Made by MD Tanvir Ahmmed · Team Orbitrix
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: FINAL CTA + FOOTER */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10 overflow-hidden rounded-3xl my-8">
        {/* NASA Orbital Launch Compilation Video Background */}
        <VideoBackground
          src={VIDEOS.launchCompilation.src}
          poster={VIDEOS.launchCompilation.poster}
          opacity={0.35}
          overlay={true}
        />
        <div className="text-center max-w-2xl mx-auto space-y-6 mb-16">
          <h2 className="font-hud text-3xl sm:text-4xl font-bold text-white tracking-wide">
            READY TO EXPLORE THE NEXT FRONTIER?
          </h2>
          <p className="text-sm font-mono text-[#94A3B8]">
            Anyone can register. Experience live telemetry streaming, take the cognitive battery, or inspect the medical dossier.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] text-white font-hud font-bold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(0,212,255,0.4)]"
          >
            <span>CREATE YOUR CREW ACCOUNT</span>
            <ArrowRight size={17} />
          </Link>
        </div>

        {/* Footer */}
        <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-[#6B7688]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0B3D91]/60 border border-[#00D4FF]/40 flex items-center justify-center">
              <Radio size={13} className="text-[#00D4FF]" />
            </div>
            <span className="font-hud font-bold text-white">ASTROVITALS NEURO-SHIELD</span>
          </div>

          <div className="text-center md:text-left">
            <span>Made by </span>
            <strong className="text-[#E8EDF5]">MD Tanvir Ahmmed</strong>
            <span> · Team Orbitrix · NASA Space Apps Challenge 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="https://github.com/TanvirAhmmedCodes/AstroVitals" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <span>GitHub</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
}
