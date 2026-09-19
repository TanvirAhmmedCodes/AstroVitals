import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Brain,
  Calendar,
  MessageSquare,
  Users,
  Cpu,
  FileText,
  Settings,
  Shield,
  Radio,
} from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import OriAvatar from '../ori/OriAvatar';

const BASE_NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'LIVE' },
  { path: '/vitals', label: 'Live Vitals', icon: Activity },
  { path: '/neuro-shield', label: 'Neuro-Shield', icon: Brain },
  { path: '/trends', label: 'Health Trends', icon: Calendar },
  { path: '/chat', label: 'Ori', icon: MessageSquare, isOri: true, badge: 'AI' },
  { path: '/mission', label: 'Mission Control', icon: Users },
  { path: '/twin', label: 'Digital Twin', icon: Cpu },
  { path: '/reports', label: 'Medical Dossier', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const navItems = user?.role === 'admin'
    ? [...BASE_NAV_ITEMS, { path: '/admin', label: 'Admin Console', icon: Shield, badge: 'ADMIN' }]
    : BASE_NAV_ITEMS;
  return (
    <aside className="hidden md:flex flex-col flex-shrink-0 z-20 border-r border-white/10 bg-[#070B14]/80 backdrop-blur-xl transition-all duration-300 md:w-[72px] lg:w-[260px]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-[#0B3D91]/60 border border-[#00D4FF]/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            <Radio size={20} className="text-[#00D4FF]" />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-hud font-bold text-sm tracking-wider text-[#E8EDF5]">
              ASTROVITALS
            </span>
            <span className="text-[10px] font-mono text-[#00D4FF] tracking-widest uppercase">
              ORBITAL CONSOLE
            </span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-display text-sm font-medium transition-all group select-none relative ${
                  isActive
                    ? 'bg-[#0B3D91]/50 text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_16px_rgba(0,212,255,0.2)]'
                    : 'text-[#A8B2C1] hover:text-[#E8EDF5] hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.isOri ? (
                    <OriAvatar size={20} showGlow={false} className="flex-shrink-0" />
                  ) : (
                    <Icon
                      size={20}
                      className={`flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#00D4FF]' : 'text-[#6B7688] group-hover:text-[#E8EDF5]'
                      }`}
                    />
                  )}
                  <span className="hidden lg:block truncate">{item.label}</span>
                  {item.badge && (
                    <span className="hidden lg:inline-block ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#00D4FF] shadow-[0_0_8px_#00D4FF]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-white/10 hidden lg:block">
        <div className="p-3 rounded-lg bg-[#0C1220] border border-white/5 text-xs font-mono">
          <div className="flex items-center justify-between text-[#6B7688] mb-1">
            <span>TELEMETRY LINK</span>
            <span className="text-[#10B981] font-bold">100%</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
