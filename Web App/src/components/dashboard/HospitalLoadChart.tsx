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

interface HospitalLoadChartProps {
  hospitals: Hospital[];
}

export const HospitalLoadChart: React.FC<HospitalLoadChartProps> = ({ hospitals }) => {
  const chartData = hospitals.map((h) => ({
    name: h.name.replace('Hospital', 'Hosp.').replace('Vijayawada', 'VJA'),
    icus: h.availableIcus,
    ambulances: h.availableAmbulances,
    capacity: h.emergencyCapacity,
  }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">Hospital Emergency Readiness</h4>
          <p className="text-xs text-slate-400">Available ICU beds & rapid response ambulances</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} />
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
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
            <Bar dataKey="icus" name="Available ICU Beds" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="ambulances"
              name="Active Ambulances"
              fill="#fbbf24"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
