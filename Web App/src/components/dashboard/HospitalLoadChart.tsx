import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Hospital } from '../../types';
import { useThemeStore } from '../../store/themeStore';

interface HospitalLoadChartProps {
  hospitals: Hospital[];
}

export const HospitalLoadChart: React.FC<HospitalLoadChartProps> = ({ hospitals }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const chartData = hospitals.map((h) => ({
    name: h.name.replace('Hospital', 'Hosp.').replace('Vijayawada', 'VJA'),
    icus: h.availableIcus,
    ambulances: h.availableAmbulances,
    capacity: h.emergencyCapacity,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hospital Emergency Readiness</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Available ICU beds & rapid response ambulances</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
            <XAxis dataKey="name" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={10} interval={0} />
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
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => (
                <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>
              )}
            />
            <Bar dataKey="icus" name="Available ICU Beds" fill="#1565C0" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="ambulances"
              name="Active Ambulances"
              fill="#D97706"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
