import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'red' | 'blue' | 'green' | 'amber' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'red',
  onClick,
}) => {
  const colorMap = {
    red: 'from-red-500/10 to-transparent border-red-500/20 text-red-400 group-hover:border-red-500/40',
    blue: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-400 group-hover:border-blue-500/40',
    green: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400 group-hover:border-amber-500/40',
    purple: 'from-purple-500/10 to-transparent border-purple-500/20 text-purple-400 group-hover:border-purple-500/40',
  };

  const iconBgMap = {
    red: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
    blue: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-200 hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } bg-gradient-to-b ${colorMap[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}

          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className={trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {trend.value}
              </span>
              <span className="text-slate-500">vs last hour</span>
            </div>
          )}
        </div>

        <div className={`rounded-xl p-3 ${iconBgMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
