import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Mic, Sparkles } from 'lucide-react';
import OriAvatar from '../ori/OriAvatar';

export default function AIChatPreview({ lastMessage }) {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');

  const defaultMsg =
    lastMessage ||
    "Hi Commander! I'm Ori, your mission companion. Your cardiovascular tone is steady (+2% above baseline) and sleep recovery index is 8.2/10. All markers are nominal. How are you feeling right now?";

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    navigate('/chat', { state: { initialMessage: inputText } });
  };

  return (
    <div className="relative rounded-[12px] bg-gradient-to-br from-[#121A2D]/80 to-[#070B14]/90 backdrop-blur-md border border-white/10 shadow-lg p-5 flex flex-col justify-between group hover:border-[#00D4FF]/30 transition-all">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <OriAvatar size={28} showGlow={false} />
            <h2 className="font-hud text-sm tracking-wider uppercase text-[#E8EDF5]">
              ASK ORI
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span className="font-semibold text-[11px] tracking-wider">ORBITAL AI ONLINE</span>
          </div>
        </div>

        {/* Companion Chat Bubble */}
        <div className="p-3.5 rounded-lg bg-[#0C1220]/90 border border-[#00D4FF]/20 relative">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-[#00D4FF]">
            <Sparkles size={13} />
            <span className="font-bold uppercase tracking-wider">Ori · Mission Companion</span>
          </div>
          <p className="text-xs font-body text-[#E8EDF5] leading-relaxed">
            "{defaultMsg}"
          </p>
        </div>
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Ori about vitals, radiation, sleep..."
          className="flex-1 bg-[#0C1220] text-xs font-body text-[#E8EDF5] placeholder-[#6B7688] px-3.5 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#00D4FF]/60 transition-colors"
        />

        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#A8B2C1] hover:text-[#E8EDF5] transition-colors border border-white/10"
          title="Voice input"
        >
          <Mic size={15} />
        </button>

        <button
          type="submit"
          className="p-2.5 rounded-lg bg-[#0B3D91] hover:bg-[#4A90E2] text-white transition-all shadow-[0_0_12px_rgba(74,144,226,0.4)] border border-[#4A90E2]/40"
          title="Send to Ori"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
