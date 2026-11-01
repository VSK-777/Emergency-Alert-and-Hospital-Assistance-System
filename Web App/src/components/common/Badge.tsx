import React from 'react';
import type { IncidentStatus, AmbulanceStatus, UserRole } from '../../types';

interface BadgeProps {
  status?: IncidentStatus | AmbulanceStatus | UserRole | string;
  variant?: 'status' | 'role' | 'source' | 'triage' | 'severity';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status = 'PENDING', variant = 'status', className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Incident Statuses
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'ACKNOWLEDGED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'ASSIGNED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'DISPATCHED':
        return 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
      case 'IN_PROGRESS':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'CANCELLED':
        return 'bg-slate-700/50 text-slate-400 border-slate-600/40';

      // Ambulance Statuses
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'EN_ROUTE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'AT_SCENE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'COMPLETED':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'MAINTENANCE':
        return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40';

      // Roles
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold';
      case 'HOSPITAL_STAFF':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold';
      case 'RESPONDER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold';
      case 'CITIZEN':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';

      // Sources
      case 'SMARTWATCH_AUTO':
        return 'bg-rose-600/25 text-rose-300 border-rose-500/50 font-bold';
      case 'MOBILE_SOS':
        return 'bg-orange-500/25 text-orange-300 border-orange-500/50 font-bold';
      case 'MANUAL_WEB':
        return 'bg-blue-500/25 text-blue-300 border-blue-500/50';

      // Triage
      case 'CRITICAL':
        return 'bg-red-600/30 text-red-200 border-red-500 font-extrabold uppercase animate-pulse';
      case 'URGENT':
        return 'bg-amber-500/25 text-amber-200 border-amber-500 font-bold uppercase';
      case 'STABLE':
        return 'bg-emerald-500/25 text-emerald-200 border-emerald-500 font-medium uppercase';

      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide shadow-sm ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
