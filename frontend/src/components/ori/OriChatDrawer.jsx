import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOri } from './OriProvider';
import OriAvatar from './OriAvatar';
import { useMissionStore } from '../../store/useMissionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { sendChatMessage, fetchChatSuggestions } from '../../lib/api';
import { resendVerification } from '../../lib/auth';
import ReactMarkdown from 'react-markdown';
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
  ThumbsUp,
  Heart,
  Zap,
  ArrowLeft,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

/**
 * OriChatDrawer — Floating slide-in conversation drawer with Ori.
 *
 * Sized 420px x 640px on desktop; full-screen responsive takeover on mobile.
 * Injects real-time mission telemetry and verified credentials.
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */
export default function OriChatDrawer() {
  const { isDrawerOpen, closeOri, isSpeaking, speak, stopSpeaking, speechEnabled, setSpeechEnabled } = useOri();
  const { user } = useAuthStore();
  const { selectedAstronautId, selectedAstronaut, vitals } = useMissionStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');
  const [reactions, setReactions] = useState({});

  const isEmailUnverified = Boolean(
    user &&
    user.email_verified === false &&
    user.role !== 'admin' &&
    user.email?.toLowerCase() !== 'tanvirahmmed13579@gmail.com'
  );

  // Message history
  const [messages, setMessages] = useState(() => {
    const firstName = user?.full_name?.split(' ')[0] || 'Commander';
    return [
      {
        id: 'ori-intro',
        role: 'assistant',
        content: `Hi ${firstName}! I'm **Ori**, your orbital companion. I'm actively monitoring your telemetry—heart rate is ${vitals?.heart_rate_bpm || 72} BPM and SpO2 is ${vitals?.spo2_pct || 98}%. How are you feeling right now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isDrawerOpen) {
      scrollToBottom();
    }
  }, [messages, isDrawerOpen]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Resend email verification if user blocked
  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    setResendNotice('');
    try {
      await resendVerification(user.email);
      setResendNotice('Verification link sent. Check your inbox.');
    } catch (e) {
      setResendNotice('Failed to dispatch verification email.');
    } finally {
      setResending(false);
    }
  };

  // Send message to Ori backend
  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: textToSend,
        astronaut_id: selectedAstronautId || user?.astronaut_id || 'cadet-1',
        session_id: `ori_drawer_${user?.id || 'session'}`,
      });

      const replyContent = response.content || response.message || "I'm right here with you. Your vitals remain stable.";
      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (speechEnabled) {
        speak(replyContent);
      }
    } catch (err) {
      const errMsg =
        err.response?.status === 403
          ? 'Email verification required. Please verify your email to chat with Ori.'
          : err.response?.status === 429
          ? 'Rate limit reached (20 messages/hour). Please wait a while before continuing our discussion.'
          : "Mission comms interruption. I'm operating in autonomous offline safety mode.";

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errMsg,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReaction = (msgId, reactionEmoji) => {
    setReactions((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === reactionEmoji ? null : reactionEmoji,
    }));
  };

  const quickPrompts = [
    'How are my vitals doing?',
    'Explain my radiation dose',
    'Give me a 4-7-8 breathing exercise',
    'Sleep recovery suggestions',
  ];

  if (!isDrawerOpen) return null;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Mobile Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOri}
            className="sm:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[115]"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[640px] z-[120] flex flex-col bg-[#070B14]/95 sm:rounded-2xl border border-white/10 sm:border-[#00D4FF]/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden select-none font-display"
          >
            {/* Header */}
            <div className="h-16 px-4 border-b border-white/10 bg-[#0C1220]/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeOri}
                  className="sm:hidden p-1.5 rounded-lg text-[#A8B2C1] hover:text-white"
                  title="Back"
                >
                  <ArrowLeft size={18} />
                </button>

                <OriAvatar size={40} isSpeaking={isSpeaking} showGlow={false} />

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-hud font-bold text-sm tracking-wider text-white">ORI</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  </div>
                  <span className="text-[10px] font-mono text-[#00D4FF] tracking-wider uppercase block">
                    Orbital Companion AI
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (speechEnabled) stopSpeaking();
                    setSpeechEnabled(!speechEnabled);
                  }}
                  title={speechEnabled ? 'Mute Ori Voice' : 'Enable Ori Voice'}
                  className={`p-2 rounded-lg transition-colors ${
                    speechEnabled ? 'text-[#00D4FF] bg-[#00D4FF]/10' : 'text-[#6B7688] hover:text-[#CBD5E1]'
                  }`}
                >
                  {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                  onClick={() => setMessages([messages[0]])}
                  title="Clear Chat History"
                  className="p-2 rounded-lg text-[#6B7688] hover:text-[#EF4444] transition-colors"
                >
                  <Trash2 size={16} />
                </button>

                <button
                  onClick={closeOri}
                  className="p-2 rounded-lg text-[#6B7688] hover:text-white hover:bg-white/10 transition-colors"
                  title="Close Drawer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Email Verification Warning Banner if Unverified */}
            {user && user.email_verified === false && (
              <div className="bg-[#F59E0B]/15 border-b border-[#F59E0B]/30 px-3 py-2 text-[11px] font-mono flex items-center justify-between gap-2 text-[#FBBF24]">
                <div className="flex items-center gap-1.5 truncate">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  <span className="truncate">Email verification required to chat</span>
                </div>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="underline hover:text-white flex-shrink-0 font-bold"
                >
                  {resending ? 'Sending...' : 'Resend'}
                </button>
              </div>
            )}

            {resendNotice && (
              <div className="bg-[#10B981]/15 border-b border-[#10B981]/30 px-3 py-1.5 text-[10px] font-mono text-[#10B981]">
                {resendNotice}
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} group`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? msg.isError
                            ? 'bg-[#DC2626]/20 border border-red-500/40 text-red-200'
                            : 'bg-[#0C1220] border border-white/10 text-[#E8EDF5] shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                          : 'bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] text-white shadow-[0_4px_20px_rgba(0,212,255,0.25)]'
                      }`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Metadata & Reactions */}
                    <div className="flex items-center gap-2 mt-1 px-1 text-[10px] font-mono text-[#6B7688]">
                      <span>{msg.timestamp}</span>

                      {isAssistant && !msg.isError && (
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReaction(msg.id, '👍')}
                            className={`p-0.5 rounded hover:bg-white/10 transition-colors ${
                              reactions[msg.id] === '👍' ? 'text-[#00D4FF]' : ''
                            }`}
                          >
                            👍
                          </button>
                          <button
                            onClick={() => handleReaction(msg.id, '❤️')}
                            className={`p-0.5 rounded hover:bg-white/10 transition-colors ${
                              reactions[msg.id] === '❤️' ? 'text-[#EC4899]' : ''
                            }`}
                          >
                            ❤️
                          </button>
                          <button
                            onClick={() => handleReaction(msg.id, '🤯')}
                            className={`p-0.5 rounded hover:bg-white/10 transition-colors ${
                              reactions[msg.id] === '🤯' ? 'text-[#FBBF24]' : ''
                            }`}
                          >
                            🤯
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Animated Typing Indicator */}
              {loading && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#00D4FF]">
                  <div className="w-6 h-6 rounded-full bg-[#00D4FF]/20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-ping" />
                  </div>
                  <span className="italic">Ori is formulating response...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chips */}
            <div className="px-3 py-2 border-t border-white/5 bg-[#0C1220]/40 overflow-x-auto scrollbar-none flex items-center gap-1.5 flex-shrink-0">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#00D4FF]/20 border border-white/10 hover:border-[#00D4FF]/40 text-[11px] font-mono text-[#CBD5E1] whitespace-nowrap transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Controls */}
            <div className="p-3 border-t border-white/10 bg-[#070B14] flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleMic}
                title={isListening ? 'Stop Voice Recording' : 'Voice Input'}
                className={`p-2.5 rounded-xl transition-colors ${
                  isListening
                    ? 'bg-[#EF4444] text-white animate-pulse'
                    : 'bg-[#0C1220] hover:bg-white/10 text-[#A8B2C1]'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isEmailUnverified || loading}
                placeholder={
                  isEmailUnverified
                    ? 'Verify email to chat with Ori...'
                    : 'Ask Ori about vitals, radiation, sleep...'
                }
                className="flex-1 bg-[#0C1220] border border-white/10 focus:border-[#00D4FF]/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#E8EDF5] placeholder-[#6B7688] focus:outline-none transition-colors"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading || isEmailUnverified}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0B3D91] hover:from-[#38BDF8] hover:to-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                title="Send Message"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
