import React, { useEffect, useState } from 'react';
import { useEmergencyStore } from '../store/emergencyStore';
import { Badge } from '../components/common/Badge';
import { EmergencyDetailModal } from '../components/emergencies/EmergencyDetailModal';
import { CreateEmergencyModal } from '../components/emergencies/CreateEmergencyModal';
import type { IncidentStatus, IncidentSource, EmergencyIncident } from '../types';
import {
  AlertTriangle,
  Search,
  Filter,
  Radio,
  FileCheck,
  CheckCircle2,
  Watch,
  Smartphone,
  Eye,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';

export const LiveEmergenciesPage: React.FC = () => {
  const {
    allIncidents,
    fetchAllIncidents,
    selectedIncident,
    setSelectedIncident,
    updateStatus,
    isLoading,
  } = useEmergencyStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  useEffect(() => {
    fetchAllIncidents();
    const interval = setInterval(fetchAllIncidents, 8000);
    return () => clearInterval(interval);
  }, [fetchAllIncidents]);

  const filteredIncidents = allIncidents.filter((inc) => {
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || inc.source === sourceFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.patientName && inc.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.detectionReason && inc.detectionReason.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
            Live Emergency Incident Command
          </h2>
          <p className="text-xs text-slate-400">
            Real-time feed of all incoming smartwatch accident alerts and manual SOS requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAllIncidents()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsSosModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Trigger Emergency SOS
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by incident ID, victim name, or detection notes..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'PENDING', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Source Tabs */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <span className="text-[11px] text-slate-500 font-semibold mr-1">Source:</span>
            {['ALL', 'SMARTWATCH_AUTO', 'MOBILE_SOS'].map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                  sourceFilter === src
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {src === 'SMARTWATCH_AUTO' ? 'Watch' : src === 'MOBILE_SOS' ? 'Mobile' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3 pl-2">Incident ID</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Patient Profile</th>
                <th className="pb-3">Detection Details</th>
                <th className="pb-3">Receiving Hospital</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No emergency incidents match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-white">
                      {incident.id}
                    </td>
                    <td className="py-3.5">
                      <Badge status={incident.source} variant="source" />
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-white">{incident.patientName || 'Sai Krishna VSK'}</p>
                      <p className="text-[10px] text-slate-400">
                        {incident.bloodGroup || 'O+'} · {incident.patientPhone || '+91 98765 43210'}
                      </p>
                    </td>
                    <td className="py-3.5 max-w-[220px]">
                      <p className="truncate text-slate-200 font-medium">{incident.detectionReason}</p>
                      {incident.detectionEvent && (
                        <p className="text-[10px] text-rose-400 font-mono">
                          Peak: {incident.detectionEvent.accelerationMagnitude?.toFixed(2)}G | Gyro:{' '}
                          {incident.detectionEvent.angularVelocity?.toFixed(2)} rad/s
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {incident.assignedHospitalName || 'AIIMS Mangalagiri'}
                    </td>
                    <td className="py-3.5">
                      <Badge status={incident.status} />
                    </td>
                    <td className="py-3.5 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(incident.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 text-right pr-2 space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect
                      </button>

                      {incident.status === 'PENDING' && (
                        <button
                          onClick={() => updateStatus(incident.id, 'DISPATCHED')}
                          className="rounded-lg bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-colors"
                        >
                          Dispatch
                        </button>
                      )}

                      {incident.status === 'DISPATCHED' && (
                        <button
                          onClick={() => updateStatus(incident.id, 'RESOLVED')}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Detail Modal */}
      <EmergencyDetailModal
        incident={selectedIncident}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />

      {/* SOS Modal */}
      <CreateEmergencyModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
      />
    </div>
  );
};
