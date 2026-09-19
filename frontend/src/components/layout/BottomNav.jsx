import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, MessageSquare, Calendar, Settings } from 'lucide-react';
import OriAvatar from '../ori/OriAvatar';

const MOBILE_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vitals', label: 'Vitals', icon: Activity },
  { path: '/chat', label: 'Ori', icon: MessageSquare, isOri: true },
  { path: '/trends', label: 'Trends', icon: Calendar },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-30 bg-[#070B14]/95 backdrop-blur-xl border-t border-white/10 px-2 flex items-center justify-around select-none">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
                isActive ? 'text-[#00D4FF]' : 'text-[#6B7688] hover:text-[#A8B2C1]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {item.isOri ? (
                    <OriAvatar size={22} showGlow={false} />
                  ) : (
                    <Icon size={20} />
                  )}
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_6px_#00D4FF]" />
                  )}
                </div>
                <span className="text-[10px] font-mono tracking-wider mt-1 uppercase">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
