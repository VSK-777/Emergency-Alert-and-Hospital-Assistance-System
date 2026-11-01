import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Badge } from './Badge';
import {
  Bell,
  Volume2,
  VolumeX,
  Radio,
  LogOut,
  AlertTriangle,
  User as UserIcon,
  Shield,
  Activity,
  PlusCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateEmergencyModal } from '../emergencies/CreateEmergencyModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sseStatus, soundEnabled, toggleSound, initSseStream } = useEmergencyStore();
  const { notifications, toggleDrawer } = useNotificationStore();
  const navigate = useNavigate();
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-[1100] flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-md shadow-red-500/20 text-white font-black tracking-wider">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white sm:text-base">
                VVIT EMERGENCY SYSTEM
              </span>
              <span className="hidden sm:inline-block rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                CSP
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              Hospital Assistance & Real-Time Alert Grid · Dept. of CSE
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Real-time SSE Connection Indicator */}
          <div
            onClick={sseStatus !== 'CONNECTED' ? initSseStream : undefined}
            title={
              sseStatus === 'CONNECTED'
                ? 'Real-Time Telemetry Stream Connected'
                : 'Click to reconnect live SSE feed'
            }
            className={`hidden md:flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
              sseStatus === 'CONNECTED'
                ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                : sseStatus === 'CONNECTING'
                ? 'border-amber-500/30 bg-amber-950/30 text-amber-400'
                : 'border-rose-500/30 bg-rose-950/30 text-rose-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sseStatus === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : sseStatus === 'CONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <Radio className="h-3 w-3" />
            <span className="tracking-wide">
              {sseStatus === 'CONNECTED'
                ? 'LIVE SSE'
                : sseStatus === 'CONNECTING'
                ? 'CONNECTING...'
                : 'RECONNECT'}
            </span>
          </div>

          {/* Quick SOS Trigger Button */}
          <button
            onClick={() => setIsSosModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 active:scale-95 transition-all"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">DISPATCH SOS</span>
            <span className="sm:hidden">SOS</span>
          </button>

          {/* Sound Alarm Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Emergency siren audio enabled' : 'Emergency siren muted'}
            className={`rounded-lg p-2 transition-colors ${
              soundEnabled
                ? 'text-red-400 hover:bg-slate-800'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={toggleDrawer}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-800" />

          {/* User profile & Role */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right lg:block">
                <p className="text-xs font-semibold text-white">{user.fullName}</p>
                <div className="mt-0.5 flex justify-end">
                  <Badge status={user.role} variant="role" />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-950/30 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* SOS Modal */}
      <CreateEmergencyModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
      />
    </>
  );
};
