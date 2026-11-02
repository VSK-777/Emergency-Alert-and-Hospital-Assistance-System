import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  Building2,
  Ambulance,
  Users,
  HeartHandshake,
  Watch,
  Sparkles,
  FileText,
  Settings,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { BrandIcon } from './BrandIcon';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useAuthStore } from '../../store/authStore';

export const Sidebar: React.FC = () => {
  const { activeIncidents } = useEmergencyStore();
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getNavItems = () => {
    switch (user?.role) {
      case 'HOSPITAL_STAFF':
        return [
          { label: 'Hospital Dashboard', to: '/hospital', icon: Building2 },
          {
            label: 'Incoming Emergencies',
            to: '/emergencies',
            icon: AlertCircle,
            badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
            badgeColor: 'bg-red-600',
          },
          { label: 'Active Patients', to: '/patients', icon: Users },
          { label: 'Facility & ICUs', to: '/hospitals', icon: Building2 },
          { label: 'Ambulance Fleet', to: '/ambulances', icon: Ambulance },
          { label: 'Clinical Triage Dossier', to: '/ai-triage', icon: Sparkles },
          { label: 'Hospital Settings', to: '/settings', icon: Settings },
        ];

      case 'RESPONDER':
        return [
          { label: 'Responder Dashboard', to: '/responder', icon: HeartHandshake },
          {
            label: 'Nearby Alerts',
            to: '/emergencies',
            icon: AlertCircle,
            badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
            badgeColor: 'bg-emerald-600',
          },
          { label: 'Hospital Network', to: '/hospitals', icon: Building2 },
          { label: 'First-Aid Guide', to: '/ai-triage', icon: Sparkles },
          { label: 'Availability & Profile', to: '/settings', icon: Settings },
        ];

      case 'CITIZEN':
        return [
          { label: 'Home Dashboard', to: '/citizen', icon: HeartPulse },
          { label: 'Emergency Status & SOS', to: '/emergencies', icon: AlertCircle },
          { label: 'Nearby Hospitals', to: '/hospitals', icon: Building2 },
          { label: 'My Medical ID', to: '/patients', icon: ShieldCheck },
          { label: 'My Smartwatch', to: '/devices', icon: Watch },
          { label: 'AI First-Aid Assistant', to: '/ai-triage', icon: Sparkles },
          { label: 'Profile & Contacts', to: '/settings', icon: Settings },
        ];

      case 'ADMIN':
      default:
        return [
          { label: 'System Admin Dashboard', to: '/admin', icon: LayoutDashboard },
          {
            label: 'Live Emergencies',
            to: '/emergencies',
            icon: AlertCircle,
            badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
            badgeColor: 'bg-red-600',
          },
          { label: 'Hospital Network', to: '/hospitals', icon: Building2 },
          { label: 'Ambulance Fleet', to: '/ambulances', icon: Ambulance },
          { label: 'First Responders', to: '/responders', icon: HeartHandshake },
          { label: 'Patient Records', to: '/patients', icon: Users },
          { label: 'Smartwatch Fleet', to: '/devices', icon: Watch },
          { label: 'AI Clinical Triage', to: '/ai-triage', icon: Sparkles },
          { label: 'Audit Trail', to: '/audit-logs', icon: FileText },
          { label: 'System Governance', to: '/settings', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'System Admin';
      case 'HOSPITAL_STAFF':
        return 'Hospital Staff';
      case 'RESPONDER':
        return 'First Responder';
      case 'CITIZEN':
      default:
        return 'Citizen';
    }
  };

  return (
    <aside
      className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand & Collapse Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <BrandIcon size={38} variant="container" withGlow />
            <div className="min-w-0">
              <h2 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">
                Emergency Alert
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Hospital Assistance System
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <BrandIcon size={36} variant="container" withGlow />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Role Badge Indicator */}
      {!isCollapsed && (
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              Active Role
            </span>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 font-bold text-blue-700 dark:text-blue-300 text-[10px]">
              {getRoleDisplayName()}
            </span>
          </div>
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.to === '/admin' || item.to === '/hospital' || item.to === '/responder' || item.to === '/citizen'}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
                } rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border-l-4 border-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${item.badgeColor} animate-pulse`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">VVIT CSE CSP</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Vasireddy Venkatadri Institute of Technology
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
