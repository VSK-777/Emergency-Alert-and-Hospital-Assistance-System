import React from 'react';
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
  ShieldAlert,
  Heart,
} from 'lucide-react';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useAuthStore } from '../../store/authStore';

export const Sidebar: React.FC = () => {
  const { activeIncidents } = useEmergencyStore();
  const { user } = useAuthStore();

  const getNavItems = () => {
    switch (user?.role) {
      case 'HOSPITAL_STAFF':
        return [
          { label: 'Hospital Dashboard', to: '/', icon: Building2 },
          {
            label: 'Incoming Emergencies',
            to: '/emergencies',
            icon: AlertCircle,
            badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
            badgeColor: 'bg-red-600',
          },
          { label: 'Patient Clinical Intake', to: '/patients', icon: Users },
          { label: 'Facility & ICUs', to: '/hospitals', icon: Building2 },
          { label: 'Ambulance Fleet', to: '/ambulances', icon: Ambulance },
          { label: 'AI Clinical Triage', to: '/ai-triage', icon: Sparkles },
          { label: 'Audit Trail', to: '/audit-logs', icon: FileText },
          { label: 'Hospital Profile', to: '/settings', icon: Settings },
        ];

      case 'RESPONDER':
        return [
          { label: 'Responder Dashboard', to: '/', icon: HeartHandshake },
          {
            label: 'Nearby Emergency Alerts',
            to: '/emergencies',
            icon: AlertCircle,
            badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
            badgeColor: 'bg-emerald-600',
          },
          { label: 'Hospital Network', to: '/hospitals', icon: Building2 },
          { label: 'AI Emergency Guide', to: '/ai-triage', icon: Sparkles },
          { label: 'Availability & Profile', to: '/settings', icon: Settings },
        ];

      case 'CITIZEN':
        return [
          { label: 'Citizen Home Dashboard', to: '/', icon: Heart },
          { label: 'Emergency Status & SOS', to: '/emergencies', icon: AlertCircle },
          { label: 'Nearby Hospitals', to: '/hospitals', icon: Building2 },
          { label: 'My Medical ID Card', to: '/patients', icon: Users },
          { label: 'My Smartwatch', to: '/devices', icon: Watch },
          { label: 'AI First-Aid Assistant', to: '/ai-triage', icon: Sparkles },
          { label: 'Profile & Contacts', to: '/settings', icon: Settings },
        ];

      case 'ADMIN':
      default:
        return [
          { label: 'System Admin Dashboard', to: '/', icon: LayoutDashboard },
          {
            label: 'Live Emergencies',
            to: '/emergencies',
            icon: AlertCircle,
            badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
            badgeColor: 'bg-red-600',
          },
          { label: 'Hospital Network', to: '/hospitals', icon: Building2 },
          { label: 'Ambulance Fleet', to: '/ambulances', icon: Ambulance },
          { label: 'Responders Grid', to: '/responders', icon: HeartHandshake },
          { label: 'Patient Records', to: '/patients', icon: Users },
          { label: 'Smartwatch Devices', to: '/devices', icon: Watch },
          { label: 'AI Triage & Handoff', to: '/ai-triage', icon: Sparkles },
          { label: 'Audit Trail', to: '/audit-logs', icon: FileText },
          { label: 'System & Governance', to: '/settings', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur-md flex flex-col shrink-0 select-none">
      {/* Role Badge Indicator */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Navigation Mode
          </p>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-black text-slate-300">
            {user?.role || 'SYSTEM'}
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
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
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">CSP Batch 8</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-tight">
            Vasireddy Venkatadri Institute of Technology (VVIT)
          </p>
          <div className="mt-2 text-[10px] text-slate-500">
            Guide: Mr. G. Lakshmi Narayana · Prepared by VSK
          </div>
        </div>
      </div>
    </aside>
  );
};
