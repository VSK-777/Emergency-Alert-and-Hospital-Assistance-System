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
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">Emergency Response Trends</h4>
          <p className="text-xs text-slate-400">24-hour incident timeline by trigger type</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Smartwatch Falls
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Mobile SOS
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Resolved
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#fff',
              }}
            />
            <Area
              type="monotone"
              dataKey="falls"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFalls)"
              name="Smartwatch Falls"
            />
            <Area
              type="monotone"
              dataKey="sos"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSos)"
              name="Manual SOS"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorResolved)"
              name="Resolved Incidents"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
