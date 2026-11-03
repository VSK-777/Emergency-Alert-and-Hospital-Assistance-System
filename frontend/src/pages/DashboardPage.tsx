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
  Cpu,
  Timer,
  ExternalLink,
  Radio,
  Eye,
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
      {/* Top Coordination Header with Quick Actions */}
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
          title="ESP32 Hardware"
          value={devices.length > 0 ? devices.length : 1}
          subtitle="CSP-Triage-V1"
          icon={Cpu}
          color="purple"
        />
        <StatCard
          title="Available ICUs"
          value={totalIcus}
          subtitle="Across network"
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
          subtitle="AI-assisted dispatch"
          icon={Timer}
          color="blue"
          trend={{ value: '-1.4 min', isPositive: true }}
        />
      </div>

      {/* Interactive GIS Live Emergency Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-600 dark:text-red-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Regional Dispatch Map (VVIT & Surrounding Network)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Click marker for rapid coordination popup</span>
        </div>

        <LiveEmergencyMap
          incidents={activeIncidents}
          hospitals={hospitals}
          ambulances={ambulances}
          responders={responders}
          height="440px"
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />
      </div>

      {/* Analytics & Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmergencyTrendsChart />
        <HospitalLoadChart hospitals={hospitals} />
      </div>

      {/* Active Incidents Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              Active Emergency Dispatch Queue ({activeIncidents.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live updates received via Server-Sent Events (SSE) telemetry feed
            </p>
          </div>
          <Link
            to="/emergencies"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>View All Records</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeIncidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50 dark:bg-slate-950/40">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              All emergency corridors clear. No active alerts reported.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {activeIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-slate-900 dark:text-white">
                      {incident.id.substring(0, 12)}
                    </td>
                    <td className="py-3.5">
                      <Badge status={incident.source} variant="source" />
                    </td>
                    <td className="py-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {incident.patientName || 'Citizen User'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {incident.patientPhone || 'Phone unlisted'}
                      </div>
                    </td>
                    <td className="py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                      {incident.detectionReason}
                    </td>
                    <td className="py-3.5 font-semibold text-blue-600 dark:text-sky-400">
                      {incident.assignedHospitalName || 'Unassigned'}
                    </td>
                    <td className="py-3.5">
                      <Badge status={incident.status} />
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Inspect</span>
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
