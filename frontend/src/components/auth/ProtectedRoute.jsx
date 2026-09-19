import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Radio } from 'lucide-react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, loading, initAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Attempt hydration if state is still unresolved
    if (loading && !user) {
      initAuth();
    }
  }, [loading, user, initAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030509] flex flex-col items-center justify-center text-[#E8EDF5] select-none">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-[#00D4FF]/20 border-t-[#00D4FF] animate-spin" />
          <Radio size={24} className="text-[#00D4FF] absolute animate-pulse" />
        </div>
        <div className="font-hud text-sm tracking-widest text-[#00D4FF] uppercase">
          Verifying Mission Clearance
        </div>
        <p className="text-xs font-mono text-[#6B7688] mt-2">
          SYNCHRONIZING ORBITAL BIOMETRIC KEYS...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.password_change_required && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}
