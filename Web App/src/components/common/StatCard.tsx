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
  const accentBorderMap = {
    red: 'border-l-red-500',
    blue: 'border-l-blue-600',
    green: 'border-l-emerald-600',
    amber: 'border-l-amber-500',
    purple: 'border-l-purple-600',
  };

  const iconBgMap = {
    red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-900/50',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-900/50',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-900/50',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 ring-1 ring-purple-200 dark:ring-purple-900/50',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all duration-200 border-l-4 ${
        accentBorderMap[color]
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium">
              <span className={trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {trend.value}
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">vs previous hr</span>
            </div>
          )}
        </div>

        <div className={`rounded-xl p-3 shrink-0 ${iconBgMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
