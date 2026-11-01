import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useThemeStore } from '../../store/themeStore';

interface EmergencyTrendsChartProps {
  data?: Array<{ time: string; falls: number; sos: number; resolved: number }>;
}

const defaultData = [
  { time: '00:00', falls: 1, sos: 0, resolved: 1 },
  { time: '04:00', falls: 0, sos: 1, resolved: 1 },
  { time: '08:00', falls: 3, sos: 2, resolved: 4 },
  { time: '12:00', falls: 4, sos: 3, resolved: 6 },
  { time: '16:00', falls: 2, sos: 4, resolved: 5 },
  { time: '20:00', falls: 5, sos: 3, resolved: 7 },
  { time: 'Now', falls: 2, sos: 1, resolved: 3 },
];

export const EmergencyTrendsChart: React.FC<EmergencyTrendsChartProps> = ({
  data = defaultData,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Response Trends</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">24-hour incident timeline by trigger type</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-red-600 dark:text-rose-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-rose-500" />
            Smartwatch Falls
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-500" />
            Manual SOS
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
            Resolved
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D32F2F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16865C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16865C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
            <XAxis dataKey="time" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} />
            <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: isDark ? '#FFFFFF' : '#1F2937',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="falls"
              stroke="#D32F2F"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFalls)"
              name="Smartwatch Falls"
            />
            <Area
              type="monotone"
              dataKey="sos"
              stroke="#D97706"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSos)"
              name="Manual SOS"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke="#16865C"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorResolved)"
              name="Resolved"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
