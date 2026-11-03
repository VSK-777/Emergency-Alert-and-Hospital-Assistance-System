import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { HospitalDashboardPage } from './pages/HospitalDashboardPage';
import { ResponderDashboardPage } from './pages/ResponderDashboardPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { LiveEmergenciesPage } from './pages/LiveEmergenciesPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { AmbulancesPage } from './pages/AmbulancesPage';
import { RespondersPage } from './pages/RespondersPage';
import { PatientsPage } from './pages/PatientsPage';
import { DevicesPage } from './pages/DevicesPage';
import { AiTriagePage } from './pages/AiTriagePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Dynamically routes to the correct dashboard based on backend-authenticated user role
const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <DashboardPage />;
  switch (user.role) {
    case 'HOSPITAL_STAFF':
      return <HospitalDashboardPage />;
    case 'RESPONDER':
      return <ResponderDashboardPage />;
    case 'CITIZEN':
      return <CitizenDashboardPage />;
    case 'ADMIN':
    default:
      return <DashboardPage />;
  }
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes wrapped in MainLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Main Role-Based Dynamic Dashboard */}
          <Route path="/" element={<DashboardRouter />} />

          {/* Role Dedicated Route Shortcuts */}
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/hospital" element={<HospitalDashboardPage />} />
          <Route path="/responder" element={<ResponderDashboardPage />} />
          <Route path="/citizen" element={<CitizenDashboardPage />} />

          {/* Core Ecosystem Operations */}
          <Route path="/emergencies" element={<LiveEmergenciesPage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/ambulances" element={<AmbulancesPage />} />
          <Route path="/responders" element={<RespondersPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/ai-triage" element={<AiTriagePage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
};

export default App;
