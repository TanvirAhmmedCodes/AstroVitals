import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layout & Protection
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Marketing & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Mission Console Pages
import Dashboard from './pages/Dashboard';
import LiveVitals from './pages/LiveVitals';
import HealthTrends from './pages/HealthTrends';
import NeuroShield from './pages/NeuroShield';
import ChatCompanion from './pages/ChatCompanion';
import MissionControl from './pages/MissionControl';
import DigitalTwin from './pages/DigitalTwin';
import FamilyPortal from './pages/FamilyPortal';
import MedicalDossier from './pages/MedicalDossier';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      {/* Public Landing & Marketing */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* Mandatory / Self-service Key Rotation */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Mission Console Workspace */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vitals" element={<LiveVitals />} />
        <Route path="/trends" element={<HealthTrends />} />
        <Route path="/neuro-shield" element={<NeuroShield />} />
        <Route path="/chat" element={<ChatCompanion />} />
        <Route path="/mission" element={<MissionControl />} />
        <Route path="/twin" element={<DigitalTwin />} />
        <Route path="/family" element={<FamilyPortal />} />
        <Route path="/family/:id" element={<FamilyPortal />} />
        <Route path="/reports" element={<MedicalDossier />} />
        <Route path="/settings" element={<Settings />} />

        {/* Restricted Admin Route (Exclusive to MD Tanvir Ahmmed) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all 404 Lost in Orbit Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
