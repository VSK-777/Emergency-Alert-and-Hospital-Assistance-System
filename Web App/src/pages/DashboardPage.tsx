import React, { useEffect, useState } from 'react';
import { useEmergencyStore } from '../store/emergencyStore';
import { hospitalApi } from '../api/hospitals';
import { ambulanceApi } from '../api/ambulances';
import { responderApi } from '../api/responders';
import { deviceApi } from '../api/devices';
import type { Hospital, Ambulance, Responder, SmartwatchDevice, EmergencyIncident } from '../types';
import { StatCard } from '../components/common/StatCard';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { LiveEmergencyMap } from '../components/map/LiveEmergencyMap';
import { EmergencyTrendsChart } from '../components/dashboard/EmergencyTrendsChart';
import { HospitalLoadChart } from '../components/dashboard/HospitalLoadChart';
import { EmergencyDetailModal } from '../components/emergencies/EmergencyDetailModal';
import { Badge } from '../components/common/Badge';
import {
  AlertTriangle,
  Building2,
  Ambulance as AmbulanceIcon,
  HeartHandshake,
  Watch,
  Timer,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { activeIncidents, fetchActiveIncidents, selectedIncident, setSelectedIncident } =
    useEmergencyStore();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [devices, setDevices] = useState<SmartwatchDevice[]>([]);

  useEffect(() => {
    fetchActiveIncidents();
    hospitalApi.getHospitals().then(setHospitals);
    ambulanceApi.getAmbulances().then(setAmbulances);
    responderApi.getResponders().then(setResponders);
    deviceApi.getDevices().then(setDevices);

    const interval = setInterval(() => {
      fetchActiveIncidents();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveIncidents]);

  const totalIcus = hospitals.reduce((acc, h) => acc + h.availableIcus, 0);
  const totalAmbulancesAvailable = ambulances.filter((a) => a.status === 'AVAILABLE').length;
  const onCallResponders = responders.filter((r) => r.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <QuickActionsBar />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Active Alerts"
          value={activeIncidents.length}
          subtitle="Real-time incidents"
          icon={AlertTriangle}
          color="red"
          trend={{ value: activeIncidents.length > 0 ? '+1 active' : 'Stable', isPositive: false }}
        />
        <StatCard
          title="Wear OS Watches"
          value={devices.length > 0 ? devices.length : 1}
          subtitle="IMU 50Hz active"
          icon={Watch}
          color="purple"
        />
        <StatCard
          title="Available ICUs"
          value={totalIcus}
          subtitle="Across 4 hospitals"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Ambulances Ready"
          value={`${totalAmbulancesAvailable}/${ambulances.length}`}
          subtitle="ALS & BLS units"
          icon={AmbulanceIcon}
          color="amber"
        />
        <StatCard
          title="On-Call Responders"
          value={onCallResponders}
          subtitle="NSS / Red Cross"
          icon={HeartHandshake}
          color="green"
        />
        <StatCard
          title="Avg Response Time"
          value="4.2m"
          subtitle="AI-optimized dispatch"
          icon={Timer}
          color="blue"
          trend={{ value: '-1.4 min', isPositive: true }}
        />
      </div>

      {/* Interactive GIS Live Emergency Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Live Regional Dispatch Map (VVIT & Surrounding Network)</h3>
          </div>
          <span className="text-xs text-slate-400">Click marker for rapid coordination popup</span>
        </div>

        <LiveEmergencyMap
          incidents={activeIncidents}
          hospitals={hospitals}
          ambulances={ambulances}
          responders={responders}
          height="460px"
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />
      </div>

      {/* Analytics & Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmergencyTrendsChart />
        <HospitalLoadChart hospitals={hospitals} />
      </div>

      {/* Active Incidents Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Active Emergency Dispatch Queue ({activeIncidents.length})
            </h3>
            <p className="text-xs text-slate-400">
              Live updates received via Server-Sent Events (SSE) telemetry feed
            </p>
          </div>
          <Link
            to="/emergencies"
            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300"
          >
            <span>View All Records</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeIncidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400">All emergency corridors clear. No active alerts reported.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3 pl-2">Incident ID</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3">Victim / Patient</th>
                  <th className="pb-3">Detection Reason</th>
                  <th className="pb-3">Hospital Assigned</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {activeIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 font-mono font-bold text-white">
                      {incident.id.substring(0, 12)}
                    </td>
                    <td className="py-3">
                      <Badge status={incident.source} variant="source" />
                    </td>
                    <td className="py-3">
                      <p className="font-semibold text-white">{incident.patientName || 'Sai Krishna VSK'}</p>
                      <p className="text-[10px] text-slate-400">Blood: {incident.bloodGroup || 'O+'}</p>
                    </td>
                    <td className="py-3 max-w-[200px] truncate text-slate-300">
                      {incident.detectionReason}
                    </td>
                    <td className="py-3 text-slate-300">
                      {incident.assignedHospitalName || 'AIIMS Mangalagiri'}
                    </td>
                    <td className="py-3">
                      <Badge status={incident.status} />
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="rounded-lg bg-red-600/20 border border-red-500/40 px-3 py-1 text-[11px] font-bold text-red-300 hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Inspect & Coordinate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergency Detail Modal */}
      <EmergencyDetailModal
        incident={selectedIncident}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </div>
  );
};
