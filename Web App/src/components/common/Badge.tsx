import React from 'react';
import type { IncidentStatus, AmbulanceStatus, UserRole } from '../../types';

interface BadgeProps {
  status?: IncidentStatus | AmbulanceStatus | UserRole | string;
  variant?: 'status' | 'role' | 'source' | 'triage' | 'severity';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status = 'PENDING', className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Incident Statuses
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600/40 animate-pulse';
      case 'ACKNOWLEDGED':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-600/40';
      case 'ASSIGNED':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-600/40';
      case 'DISPATCHED':
        return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-600/40 animate-pulse';
      case 'IN_PROGRESS':
        return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-600/40';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600/40';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';

      // Ambulance Statuses
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600/40';
      case 'EN_ROUTE':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-600/40 animate-pulse';
      case 'AT_SCENE':
        return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-600/40';
      case 'COMPLETED':
        return 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-600/40';
      case 'MAINTENANCE':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';

      // Roles
      case 'ADMIN':
        return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-600/40 font-semibold';
      case 'HOSPITAL_STAFF':
        return 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-600/40 font-semibold';
      case 'RESPONDER':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600/40 font-semibold';
      case 'CITIZEN':
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-semibold';

      // Sources
      case 'SMARTWATCH_SENSOR':
      case 'SMARTWATCH_AUTO':
        return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-600/40 font-bold';
      case 'MOBILE_MANUAL_SOS':
      case 'MANUAL_SOS':
      case 'MOBILE_SOS':
        return 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-600/40 font-bold';
      case 'MANUAL_WEB':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-600/40';

      // Triage
      case 'CRITICAL':
        return 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-500 font-black uppercase tracking-wide';
      case 'URGENT':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-500 font-bold uppercase';
      case 'STABLE':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-500 font-semibold uppercase';

      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formattedStatus = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
      <span>{formattedStatus}</span>
    </span>
  );
};
