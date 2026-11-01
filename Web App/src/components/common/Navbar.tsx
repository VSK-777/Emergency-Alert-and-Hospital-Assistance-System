import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { Badge } from './Badge';
import {
  Bell,
  Volume2,
  VolumeX,
  Radio,
  LogOut,
  AlertTriangle,
  Sun,
  Moon,
  Building2,
  HeartHandshake,
  Shield,
  Activity,
  User as UserIcon,
  Watch,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sseStatus, soundEnabled, toggleSound, initSseStream, activeIncidents } = useEmergencyStore();
  const { notifications, toggleDrawer } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/admin':
        return 'System Command Overview';
      case '/hospital':
        return 'Hospital Emergency Triage';
      case '/responder':
        return 'First Responder Field Command';
      case '/citizen':
        return 'Citizen Emergency Services';
      case '/emergencies':
        return 'Live Emergency Incidents';
      case '/hospitals':
        return 'Emergency Hospital Network';
      case '/ambulances':
        return 'Emergency Medical Fleet';
      case '/responders':
        return 'Volunteer Responders Grid';
      case '/patients':
        return user?.role === 'CITIZEN' ? 'My Emergency Medical ID' : 'Patient Medical Registry';
      case '/devices':
        return user?.role === 'CITIZEN' ? 'My Wear OS Smartwatch' : 'Smartwatch Fleet Management';
      case '/ai-triage':
        return user?.role === 'CITIZEN' ? 'AI Emergency & First-Aid Assistant' : 'Gemini AI Clinical Triage & Handoff';
      case '/audit-logs':
        return 'Security & Audit Logs';
      case '/settings':
        return 'Profile & Account Settings';
      default:
        return 'Emergency Grid';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[1100] flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur-md transition-colors">
        {/* Left: Breadcrumb / Page Title */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Portal /
              </span>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                {getPageTitle()}
              </h1>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time SSE Connection Indicator */}
          <div
            onClick={sseStatus !== 'CONNECTED' ? initSseStream : undefined}
            title={
              sseStatus === 'CONNECTED'
                ? 'Real-Time Telemetry Stream Online'
                : 'Click to reconnect live telemetry feed'
            }
            className={`hidden md:flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
              sseStatus === 'CONNECTED'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400'
                : sseStatus === 'CONNECTING'
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400'
                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sseStatus === 'CONNECTED'
                  ? 'bg-emerald-500 animate-pulse'
                  : sseStatus === 'CONNECTING'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <Radio className="h-3 w-3" />
            <span className="font-semibold text-[11px] tracking-wide">
              {sseStatus === 'CONNECTED'
                ? 'LIVE'
                : sseStatus === 'CONNECTING'
                ? 'CONNECTING'
                : 'RECONNECT'}
            </span>
          </div>

          {/* Role-Adapted Status & Notification Badges (No website emergency initiation) */}
          {user?.role === 'CITIZEN' ? (
            <div
              title="Paired Wear OS Smartwatch Sensor Status"
              className="flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300"
            >
              <Watch className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Watch Monitoring</span>
              <span className="sm:hidden">Watch</span>
            </div>
          ) : user?.role === 'ADMIN' ? (
            <div
              title="Live Network Incidents Monitored"
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300"
            >
              <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Grid Alerts: {activeIncidents.length}</span>
            </div>
          ) : user?.role === 'HOSPITAL_STAFF' ? (
            <button
              onClick={() => navigate('/hospital')}
              className="flex items-center gap-1.5 rounded-lg border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-sky-600" />
              <span>Incoming Triage ({activeIncidents.length})</span>
            </button>
          ) : user?.role === 'RESPONDER' ? (
            <button
              onClick={() => navigate('/responder')}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
              <span>Nearby Alerts ({activeIncidents.length})</span>
            </button>
          ) : null}

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          {/* Sound Alarm Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Emergency siren audio enabled' : 'Emergency siren muted'}
            className={`rounded-lg p-2 transition-colors ${
              soundEnabled
                ? 'text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={toggleDrawer}
            title="Notifications"
            className="relative rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {/* User profile & Role */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right lg:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                <div className="mt-0.5 flex justify-end">
                  <Badge status={user.role} variant="role" />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>
    </>
  );
};
