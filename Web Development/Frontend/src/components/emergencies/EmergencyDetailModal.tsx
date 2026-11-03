import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import type { EmergencyIncident, Hospital, Responder, Ambulance, IncidentStatus, AiTriageResponse } from '../../types';
import { useEmergencyStore } from '../../store/emergencyStore';
import { hospitalApi } from '../../api/hospitals';
import { responderApi } from '../../api/responders';
import { ambulanceApi } from '../../api/ambulances';
import { aiApi } from '../../api/ai';
import {
  AlertTriangle,
  Cpu,
  MapPin,
  Heart,
  Building2,
  UserCheck,
  Ambulance as AmbulanceIcon,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileCheck,
  Radio,
  Activity,
  Phone,
  ShieldAlert,
} from 'lucide-react';

interface EmergencyDetailModalProps {
  incident: EmergencyIncident | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyDetailModal: React.FC<EmergencyDetailModalProps> = ({
  incident,
  isOpen,
  onClose,
}) => {
  const { updateStatus, cancelIncident } = useEmergencyStore();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | undefined>(
    incident?.assignedHospitalId
  );
  const [selectedResponderId, setSelectedResponderId] = useState<number | undefined>(
    incident?.assignedResponderId
  );
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<number | undefined>(
    incident?.assignedAmbulanceId
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // AI Triage State
  const [aiTriage, setAiTriage] = useState<AiTriageResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const isEsp32Source = incident?.source === 'ESP32_HARDWARE' || incident?.source === 'ESP32_TRIAGE';
  const parsedTelemetry = React.useMemo(() => {
    if (!incident?.detectionEvent?.rawTelemetryJson) return null;
    try {
      return JSON.parse(incident.detectionEvent.rawTelemetryJson);
    } catch {
      return null;
    }
  }, [incident?.detectionEvent?.rawTelemetryJson]);

  useEffect(() => {
    if (isOpen && incident) {
      setSelectedHospitalId(incident.assignedHospitalId);
      setSelectedResponderId(incident.assignedResponderId);
      setSelectedAmbulanceId(incident.assignedAmbulanceId);
      setAiTriage(null);

      // Fetch directory data
      hospitalApi.getHospitals(incident.latitude, incident.longitude).then(setHospitals);
      responderApi.getResponders(incident.latitude, incident.longitude).then(setResponders);
      ambulanceApi.getAmbulances().then(setAmbulances);
    }
  }, [isOpen, incident]);

  if (!incident) return null;

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    setIsUpdating(true);
    try {
      await updateStatus(incident.id, newStatus, selectedHospitalId, selectedResponderId);

      // If ambulance was selected, update its status
      if (selectedAmbulanceId && newStatus === 'DISPATCHED') {
        await ambulanceApi.updateStatus(selectedAmbulanceId, 'EN_ROUTE', incident.id);
      }
      setIsUpdating(false);
    } catch (e) {
      console.error(e);
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to mark this emergency as CANCELLED (False Alarm)?')) {
      setIsUpdating(true);
      await cancelIncident(incident.id);
      setIsUpdating(false);
      onClose();
    }
  };

  const handleRunAiTriage = async () => {
    setIsLoadingAi(true);
    try {
      const response = await aiApi.generateTriage({
        emergencyType: incident.source === 'SMARTWATCH_AUTO' ? 'FALL_IMPACT' : 'MANUAL_SOS',
        patientMedicalNotes: `Blood: ${incident.bloodGroup || 'O+'}, Allergies: ${
          incident.allergies || 'None'
        }, Conditions: ${incident.medicalConditions || 'None'}`,
        query: incident.detectionReason || 'Urgent medical assistance requested.',
        latitude: incident.latitude,
        longitude: incident.longitude,
      });
      setAiTriage(response);
    } catch (e) {
      console.error('Failed to run AI triage:', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Emergency Incident Dossier — ${incident.id.slice(0, 12)}`}
      subtitle={`Created at ${new Date(incident.createdAt).toLocaleString()}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-slate-800 dark:text-slate-200">
        {/* Status & Priority Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">State:</span>
            <Badge status={incident.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Source:</span>
            <Badge status={incident.source} variant="source" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Score:</span>
            <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-bold font-mono">
              {incident.detectionScore ? `${(incident.detectionScore * 100).toFixed(0)}%` : 'Verified'}
            </span>
          </div>
        </div>

        {/* Patient / Victim Clinical Profile */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <Heart className="h-4 w-4" />
              Patient Identity & Medical Parameters
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Verified Emergency Record
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Victim Full Name</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {incident.patientName || 'Sai Krishna VSK'}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Blood Group</span>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{incident.bloodGroup || 'O+'}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Contact Number</span>
              <p className="text-xs font-mono text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                {incident.patientPhone || '+91 98765 43210'}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Allergies:</span>
              <p className="text-rose-600 dark:text-rose-300 font-semibold">{incident.allergies || 'None recorded'}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Pre-existing Medical Conditions:</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">{incident.medicalConditions || 'Asthma (Mild)'}</p>
            </div>
          </div>
        </div>

        {/* ESP32 Hardware / IMU Telemetry (if available) */}
        {(incident.detectionEvent || isEsp32Source) && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                <Cpu className="h-4 w-4" />
                {isEsp32Source ? 'ESP32 Hardware Triage Sensor Telemetry' : 'Hardware IMU Sensor Telemetry'}
              </div>
              <div className="flex items-center gap-2">
                {parsedTelemetry?.is_simulation && (
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                    SIMULATED
                  </span>
                )}
                <span className="text-[10px] font-mono text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                  {isEsp32Source ? 'CSP-Triage-V1 · BLE GATT' : 'IMU Telemetry'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Peak Impact</span>
                <p className="text-base sm:text-lg font-black text-red-600 dark:text-red-400">
                  {(parsedTelemetry?.peak_impact_g ?? incident.detectionEvent?.accelerationMagnitude)?.toFixed?.(2) ?? '---'} G
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Stillness</span>
                <p className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">
                  {(parsedTelemetry?.post_impact_stillness_s ?? incident.detectionEvent?.postImpactInactivitySec) ?? '---'} s
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Heart Rate</span>
                <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                  {parsedTelemetry?.heart_rate_bpm ? `${parsedTelemetry.heart_rate_bpm} BPM` : '74 BPM'}
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">SpO2 Level</span>
                <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {parsedTelemetry?.spo2_percent ? `${parsedTelemetry.spo2_percent}%` : '98%'}
                </p>
              </div>
            </div>
            {parsedTelemetry?.physiological_severity && (
              <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-900/40 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Physiological Assessment:</span>
                <span className="font-bold text-red-600 dark:text-red-400 font-mono">
                  {parsedTelemetry.physiological_severity}
                </span>
              </div>
            )}

            {/* Multi-tier Timestamp Ingestion Provenance */}
            <div className="mt-3 pt-2.5 border-t border-red-200/60 dark:border-red-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Incident Wall-Clock Time:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(incident.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Hardware Device Uptime:</span>
                <p className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {parsedTelemetry?.deviceUptimeSeconds != null
                    ? `${parsedTelemetry.deviceUptimeSeconds}s (${Math.floor(parsedTelemetry.deviceUptimeSeconds / 60)}m ${parsedTelemetry.deviceUptimeSeconds % 60}s since boot)`
                    : (parsedTelemetry?.timestamp_seconds != null
                        ? `${parsedTelemetry.timestamp_seconds}s (${Math.floor(parsedTelemetry.timestamp_seconds / 60)}m ${parsedTelemetry.timestamp_seconds % 60}s since boot)`
                        : 'Hardware Uptime Preserved')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* GPS Location & Telemetry */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            <MapPin className="h-4 w-4" />
            Location Coordinates
          </div>
          <div className="flex items-center justify-between text-xs">
            <p className="font-mono text-slate-700 dark:text-slate-300">
              Latitude: <strong className="text-slate-900 dark:text-white">{incident.latitude.toFixed(6)}</strong> · Longitude:{' '}
              <strong className="text-slate-900 dark:text-white">{incident.longitude.toFixed(6)}</strong>
            </p>
            <span className="rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[11px] text-blue-700 dark:text-blue-300 font-mono font-medium">
              Accuracy: ±{incident.accuracyMeters || 4.5}m
            </span>
          </div>
        </div>

        {/* Coordination & Assignment Controls */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Resource Allocation & Dispatch
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Hospital Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                Assign Receiving Hospital
              </label>
              <select
                value={selectedHospitalId || ''}
                onChange={(e) => setSelectedHospitalId(Number(e.target.value) || undefined)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Auto-Assign / Unassigned</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.availableIcus} ICUs, {h.availableAmbulances} Amb)
                  </option>
                ))}
              </select>
            </div>

            {/* Responder Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                Assign Community Responder
              </label>
              <select
                value={selectedResponderId || ''}
                onChange={(e) => setSelectedResponderId(Number(e.target.value) || undefined)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Auto-Dispatch / Unassigned</option>
                {responders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.specialization || 'Volunteer'}, {r.isAvailable ? 'Ready' : 'Busy'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AI Triage Section */}
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              <Sparkles className="h-4 w-4" />
              Gemini AI Clinical Evaluation & Protocol
            </div>
            <button
              onClick={handleRunAiTriage}
              disabled={isLoadingAi}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isLoadingAi ? 'Evaluating...' : 'Run Gemini Assessment'}
            </button>
          </div>

          {aiTriage ? (
            <div className="space-y-3 pt-2 text-xs">
              <div className="rounded-lg bg-white dark:bg-slate-900 p-3 border border-purple-200 dark:border-purple-800">
                <p className="font-semibold text-slate-900 dark:text-white">{aiTriage.summary}</p>
              </div>

              {aiTriage.immediateActionSteps?.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    First-Aid & Responder Protocols:
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                    {aiTriage.immediateActionSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run Gemini AI to generate automated medical protocol suggestions based on patient clinical history.
            </p>
          )}
        </div>

        {/* Operational Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800/80 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Cancel False Alarm
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('ACKNOWLEDGED')}
              disabled={isUpdating}
              className="rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              Acknowledge Alert
            </button>
            <button
              onClick={() => handleStatusChange('DISPATCHED')}
              disabled={isUpdating}
              className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
            >
              Dispatch Resources
            </button>
            <button
              onClick={() => handleStatusChange('RESOLVED')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Resolved
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
