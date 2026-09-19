import React, { useState, useEffect, useRef } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useAuthStore } from '../store/useAuthStore';
import { sendChatMessage, fetchChatSuggestions } from '../lib/api';
import { resendVerification } from '../lib/auth';
import { useSound } from '../components/SoundProvider';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
  Activity,
  Shield,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  Download,
  ThumbsUp,
  Heart,
  Zap,
} from 'lucide-react';
import OriAvatar from '../components/ori/OriAvatar';

export default function ChatCompanion() {
  const { selectedAstronautId, selectedAstronaut, vitals, risk } = useMissionStore();
  const { play } = useSound();
  const { user } = useAuthStore();

  const [reactions, setReactions] = useState({});

  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`astrovitals_chat_${selectedAstronautId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    const firstName = user?.full_name?.split(' ')[0] || selectedAstronaut?.name?.split(' ')[0] || 'Explorer';
    return [
      {
        id: 'initial-1',
        role: 'assistant',
        content: `Hi ${firstName}! I'm **Ori** — your mission AI companion. Telemetry indicates your heart rate is nominal at ${vitals?.heart_rate_bpm || 72} BPM, SpO2 is ${vitals?.spo2_pct || 98}%, and circadian recovery is balanced. How can I assist your mission duties or wellness today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [speechOutputEnabled, setSpeechOutputEnabled] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  const isEmailUnverified = Boolean(
    user &&
    !user.email_verified &&
    user.role !== 'admin' &&
    user.email?.toLowerCase() !== 'tanvirahmmed13579@gmail.com'
  );

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResending(true);
    setResendNotice('');
    try {
      await resendVerification(user.email);
      setResendNotice('Verification dispatch sent. Check your inbox.');
    } catch (err) {
      setResendNotice(err.response?.data?.detail || 'Unable to dispatch verification link.');
    } finally {
      setResending(false);
    }
  };

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`astrovitals_chat_${selectedAstronautId}`, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedAstronautId]);

  // Load suggestions
  useEffect(() => {
    let isMounted = true;
    async function load() {
      const sugg = await fetchChatSuggestions(selectedAstronautId);
      if (isMounted && sugg) setSuggestions(sugg);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [selectedAstronautId]);

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = 'en-US';

        reco.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          play('tick');
        };

        reco.onerror = () => setIsListening(false);
        reco.onend = () => setIsListening(false);
        recognitionRef.current = reco;
      }
    }
  }, [play]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome/Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      play('caution');
    }
  };

  // Text-to-speech output with female voice preference
  const speakResponse = (text) => {
    if (!speechOutputEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`]/g, '').slice(0, 320);
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();

      // Preferred warm female voice
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('victoria') ||
              v.name.toLowerCase().includes('karen') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('natural'))
        ) ||
        voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) ||
        voices[0];

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.96;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const handleSend = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    play('tick');

    try {
      const response = await sendChatMessage(selectedAstronautId, textToSend);
      const aiContent = response?.response || response?.content || 'Acknowledged. Telemetry envelope remains nominal.';

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      play('chatPing');
      speakResponse(aiContent);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('Clear chat session history?')) {
      setMessages([]);
      localStorage.removeItem(`astrovitals_chat_${selectedAstronautId}`);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4 overflow-hidden select-none">
      {/* Main Chat Stream Container */}
      <div className="flex-1 flex flex-col rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
        {/* Chat Header Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#070B14]/80">
          <div className="flex items-center gap-3">
            <OriAvatar size={42} showGlow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-hud text-sm font-bold tracking-wider text-[#E8EDF5]">
                  ORI · ORBITAL RESPONSE INTELLIGENCE
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
              </div>
              <div className="text-xs font-mono text-[#00D4FF]">
                <span>NEURO-SHIELD · CONTEXT INJECTED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text = messages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ori_chat_${selectedAstronautId}_${new Date().toISOString().slice(0,10)}.txt`;
                a.click();
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A8B2C1] hover:text-[#00D4FF] border border-white/10 transition-colors"
              title="Export Conversation Transcript"
            >
              <Download size={16} />
            </button>

            <button
              onClick={() => setSpeechOutputEnabled(!speechOutputEnabled)}
              className={`p-2 rounded-lg border transition-colors ${
                speechOutputEnabled
                  ? 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/40'
                  : 'bg-white/5 text-[#6B7688] border-white/10'
              }`}
              title={speechOutputEnabled ? 'Voice output ON' : 'Voice output OFF'}
            >
              {speechOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              onClick={handleClear}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#6B7688] hover:text-[#EF4444] border border-white/10 transition-colors"
              title="Clear Session"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Unverified Email Warning Banner */}
        {isEmailUnverified && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert size={22} className="text-[#FFB800] shrink-0" />
              <div>
                <div className="text-xs font-hud font-bold text-[#FFB800] tracking-wider uppercase">
                  Verify your email to chat with Ori
                </div>
                <div className="text-[11px] text-[#8A99AD] mt-0.5 font-mono">
                  Mission security clearance requires a verified transmission channel before health interactions can proceed.
                </div>
              </div>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="px-3.5 py-1.5 rounded-lg bg-[#FFB800]/20 hover:bg-[#FFB800]/30 border border-[#FFB800]/40 text-[#FFB800] text-xs font-mono font-bold tracking-wider uppercase transition-all shrink-0 disabled:opacity-50"
            >
              {resending ? 'Transmitting...' : 'Resend verification email'}
            </button>
          </div>
        )}

        {resendNotice && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-xs font-mono text-[#00D4FF] flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{resendNotice}</span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex-shrink-0 mt-0.5">
                    <OriAvatar size={34} showGlow={false} />
                  </div>
                )}

                <div
                  className={`max-w-xl p-3.5 rounded-xl text-xs sm:text-sm font-body leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-[#0B3D91] text-white border border-[#4A90E2]/40 rounded-tr-none'
                      : 'bg-[#0C1220] text-[#E8EDF5] border border-white/10 rounded-tl-none'
                  }`}
                >
                  <div className="prose prose-invert prose-xs max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-mono">
                    {!isUser ? (
                      <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setReactions(prev => ({ ...prev, [msg.id]: prev[msg.id] === '👍' ? null : '👍' }))}
                          className={`px-1 py-0.5 rounded hover:bg-white/10 transition-colors ${reactions[msg.id] === '👍' ? 'text-[#00D4FF]' : 'text-[#6B7688]'}`}
                          title="Helpful"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => setReactions(prev => ({ ...prev, [msg.id]: prev[msg.id] === '❤️' ? null : '❤️' }))}
                          className={`px-1 py-0.5 rounded hover:bg-white/10 transition-colors ${reactions[msg.id] === '❤️' ? 'text-[#EC4899]' : 'text-[#6B7688]'}`}
                          title="Heart"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => setReactions(prev => ({ ...prev, [msg.id]: prev[msg.id] === '🤯' ? null : '🤯' }))}
                          className={`px-1 py-0.5 rounded hover:bg-white/10 transition-colors ${reactions[msg.id] === '🤯' ? 'text-[#FBBF24]' : 'text-[#6B7688]'}`}
                          title="Insightful"
                        >
                          🤯
                        </button>
                      </div>
                    ) : <span />}
                    <span className={isUser ? 'text-white/70' : 'text-[#6B7688]'}>{msg.timestamp}</span>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-mono font-bold text-white">
                    {selectedAstronaut?.callsign || 'CDR'}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs font-mono text-[#00D4FF]">
              <OriAvatar size={30} showGlow={false} isSpeaking={true} />
              <span className="animate-pulse">Ori is formulating mission guidance...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 bg-[#070B14]/60 border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-none">
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sugg)}
                className="flex-shrink-0 text-xs font-mono text-[#A8B2C1] hover:text-[#00D4FF] bg-white/5 hover:bg-[#00D4FF]/10 px-3 py-1 rounded-full border border-white/10 hover:border-[#00D4FF]/30 transition-all select-none whitespace-nowrap"
              >
                + {sugg}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-[#070B14] border-t border-white/10 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2.5 rounded-lg border transition-all ${
              isListening
                ? 'bg-[#EF4444] text-white border-red-400 animate-pulse shadow-[0_0_15px_#EF4444]'
                : 'bg-white/5 hover:bg-white/10 text-[#A8B2C1] border-white/10'
            }`}
            title="Voice input (Web Speech API)"
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <input
            type="text"
            disabled={isEmailUnverified}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isEmailUnverified
                ? 'Verify your email address to enable communications...'
                : isListening
                ? 'Listening to voice command...'
                : 'Type message or ask for countermeasures...'
            }
            className="flex-1 bg-[#0C1220] text-xs sm:text-sm font-body text-[#E8EDF5] placeholder-[#6B7688] px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#00D4FF]/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading || isEmailUnverified}
            className="p-2.5 rounded-lg bg-[#0B3D91] hover:bg-[#4A90E2] text-white disabled:opacity-40 border border-[#4A90E2]/40 transition-all shadow-md disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Context Telemetry Sidebar (desktop only) */}
      <div className="hidden lg:flex flex-col w-72 rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 p-4 space-y-4 text-xs font-mono select-none overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-[#00D4FF] font-bold uppercase tracking-wider">
          <Activity size={15} />
          <span>INJECTED TELEMETRY</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">HEART RATE</span>
            <span className="text-[#FF4D6D] font-bold">{Math.round(vitals?.heart_rate_bpm || 72)} BPM</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">SpO2</span>
            <span className="text-[#4DA6FF] font-bold">{Math.round(vitals?.spo2_pct || 98)}%</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">TEMP</span>
            <span className="text-[#FFA94D] font-bold">{(vitals?.skin_temp_c || 36.5).toFixed(1)}°C</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">ACTIVITY</span>
            <span className="text-[#4ADE80] font-bold uppercase">{vitals?.activity_state || 'rest'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-[#00D4FF] font-bold uppercase tracking-wider pt-2">
          <Shield size={15} />
          <span>RISK MARKERS</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">Cardiovascular</span>
            <span className="text-[#E8EDF5] font-bold">{Math.round(risk?.cardiovascular || 12)}/100</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">Sleep/Circadian</span>
            <span className="text-[#E8EDF5] font-bold">{Math.round(risk?.sleep_behavioral || 8)}/100</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">Immune Response</span>
            <span className="text-[#E8EDF5] font-bold">{Math.round(risk?.immune || 5)}/100</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-white/5">
            <span className="text-[#6B7688]">Cognitive Index</span>
            <span className="text-[#E8EDF5] font-bold">{Math.round(risk?.cognitive || 78)}/100</span>
          </div>
        </div>

        <div className="p-3 rounded bg-[#0B3D91]/20 border border-[#00D4FF]/30 text-[11px] text-[#A8B2C1]">
          Gemini autonomously reasons across NASA LSDA and HRP countermeasures to provide flight-surgeon tier advice.
        </div>
      </div>
    </div>
  );
}
