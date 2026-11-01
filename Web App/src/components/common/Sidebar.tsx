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
} from 'lucide-react';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useAuthStore } from '../../store/authStore';

export const Sidebar: React.FC = () => {
  const { activeIncidents } = useEmergencyStore();
  const { user } = useAuthStore();

  const navItems = [
    {
      label: 'Admin Dashboard',
      to: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'RESPONDER', 'CITIZEN'],
    },
    {
      label: 'Live Emergencies',
      to: '/emergencies',
      icon: AlertCircle,
      badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
      badgeColor: 'bg-red-600',
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'RESPONDER'],
    },
    {
      label: 'Hospital Capacity',
      to: '/hospitals',
      icon: Building2,
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'RESPONDER', 'CITIZEN'],
    },
    {
      label: 'Ambulance Fleet',
      to: '/ambulances',
      icon: Ambulance,
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'RESPONDER'],
    },
    {
      label: 'Responders Grid',
      to: '/responders',
      icon: HeartHandshake,
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'RESPONDER'],
    },
    {
      label: 'Patient Records',
      to: '/patients',
      icon: Users,
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'CITIZEN'],
    },
    {
      label: 'Smartwatch Devices',
      to: '/devices',
      icon: Watch,
      roles: ['ADMIN', 'CITIZEN'],
    },
    {
      label: 'AI Triage & Handoff',
      to: '/ai-triage',
      icon: Sparkles,
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'RESPONDER', 'CITIZEN'],
    },
    {
      label: 'Audit Trail',
      to: '/audit-logs',
      icon: FileText,
      roles: ['ADMIN', 'HOSPITAL_STAFF'],
    },
    {
      label: 'System & Profile',
      to: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'HOSPITAL_STAFF', 'RESPONDER', 'CITIZEN'],
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur-md flex flex-col shrink-0 select-none">
      {/* Navigation links */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Ecosystem Modules
        </p>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
            Guide: Mr. G. Lakshmi Narayana
          </div>
        </div>
      </div>
    </aside>
  );
};
