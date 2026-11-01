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
  Watch,
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
        query: incident.detectionReason || 'Fall detected by Wear OS IMU sensor',
        emergencyType: incident.source,
        patientMedicalNotes: `Blood Group: ${incident.bloodGroup || 'O+'}, Allergies: ${
          incident.allergies || 'None reported'
        }, Conditions: ${incident.medicalConditions || 'None'}`,
        latitude: incident.latitude,
        longitude: incident.longitude,
      });
      setAiTriage(response);
      setIsLoadingAi(false);
    } catch (err) {
      console.error('Failed to run AI triage:', err);
      setIsLoadingAi(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Incident Dossier: ${incident.id}`}
      subtitle={`Triggered via ${incident.source} at ${new Date(incident.createdAt).toLocaleTimeString()}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Status and Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Current Status:</span>
            <Badge status={incident.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Source:</span>
            <Badge status={incident.source} variant="source" />
          </div>
        </div>

        {/* Patient Profile & Medical Information */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-3">
            <Heart className="h-4 w-4" />
            Patient Emergency Profile
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-slate-500">Patient Name</span>
              <p className="text-xs font-bold text-white">{incident.patientName || 'Sai Krishna VSK'}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Blood Group</span>
              <p className="text-xs font-bold text-emerald-400">{incident.bloodGroup || 'O+'}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Contact Number</span>
              <p className="text-xs font-mono text-slate-200 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                {incident.patientPhone || '+91 98765 43210'}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-500">Allergies:</span>
              <p className="text-amber-300 font-medium">{incident.allergies || 'None recorded'}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Pre-existing Medical Conditions:</span>
              <p className="text-slate-300">{incident.medicalConditions || 'Asthma (Mild)'}</p>
            </div>
          </div>
        </div>

        {/* Smartwatch IMU Telemetry (if available) */}
        {incident.detectionEvent && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/15 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <Watch className="h-4 w-4" />
                Smartwatch IMU Sensor Telemetry
              </div>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                50 Hz Sensor Pipeline
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Peak Impact</span>
                <p className="text-lg font-black text-rose-400">
                  {incident.detectionEvent.accelerationMagnitude?.toFixed(2)} G
                </p>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Angular Vel.</span>
                <p className="text-lg font-black text-amber-400">
                  {incident.detectionEvent.angularVelocity?.toFixed(2)} rad/s
                </p>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Post-Impact Stillness</span>
                <p className="text-lg font-black text-purple-400">
                  {incident.detectionEvent.postImpactInactivitySec || 12} s
                </p>
              </div>
            </div>
          </div>
        )}

        {/* GPS Location & Telemetry */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
            <MapPin className="h-4 w-4" />
            Location Coordinates
          </div>
          <div className="flex items-center justify-between text-xs">
            <p className="font-mono text-slate-300">
              Latitude: <strong className="text-white">{incident.latitude.toFixed(6)}</strong> · Longitude:{' '}
              <strong className="text-white">{incident.longitude.toFixed(6)}</strong>
            </p>
            <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-300 font-mono">
              Accuracy: ±{incident.accuracyMeters || 4.5}m
            </span>
          </div>
        </div>

        {/* Coordination & Assignment Controls */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Resource Allocation & Dispatch
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Hospital Selector */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-sky-400" />
                Assign Receiving Hospital
              </label>
              <select
                value={selectedHospitalId || ''}
                onChange={(e) => setSelectedHospitalId(Number(e.target.value) || undefined)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
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
              <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-emerald-400" />
                Assign Nearby Volunteer Responder
              </label>
              <select
                value={selectedResponderId || ''}
                onChange={(e) => setSelectedResponderId(Number(e.target.value) || undefined)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {responders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ambulance Dispatch Selector */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
              <AmbulanceIcon className="h-3 w-3 text-amber-400" />
              Dispatch Dedicated Ambulance
            </label>
            <select
              value={selectedAmbulanceId || ''}
              onChange={(e) => setSelectedAmbulanceId(Number(e.target.value) || undefined)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">Select Ambulance</option>
              {ambulances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.vehicleNumber} ({a.vehicleType} - Driver: {a.driverName} - {a.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gemini AI Triage Evaluation Section */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Gemini AI Clinical Triage & Handoff Assistant
            </div>
            <button
              onClick={handleRunAiTriage}
              disabled={isLoadingAi}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Sparkles className="h-3 w-3" />
              {isLoadingAi ? 'Evaluating...' : 'Run Gemini Triage'}
            </button>
          </div>

          {aiTriage ? (
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between bg-purple-900/30 p-2.5 rounded-lg border border-purple-500/30">
                <span className="font-semibold text-purple-200">AI Priority Level:</span>
                <Badge status={aiTriage.triageLevel} variant="triage" />
              </div>
              <div>
                <p className="font-semibold text-purple-200">Clinical Evaluation:</p>
                <p className="mt-0.5 text-slate-300 leading-relaxed">{aiTriage.summary}</p>
              </div>
              <div>
                <p className="font-semibold text-purple-200">Immediate Bystander / Responder Steps:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-slate-300">
                  {aiTriage.immediateActionSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-purple-200">Hospital Receiving Preparations:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-slate-300">
                  {aiTriage.hospitalPrepRecommendations.map((prep, idx) => (
                    <li key={idx}>{prep}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;Run Gemini Triage&quot; to automatically evaluate symptoms, telemetry, and generate
              hospital trauma preparation recommendations.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUpdating || incident.status === 'CANCELLED'}
            className="flex items-center gap-1.5 rounded-xl border border-rose-800/40 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 disabled:opacity-40 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Cancel / False Alarm
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {incident.status === 'PENDING' && (
              <button
                type="button"
                onClick={() => handleStatusChange('ACKNOWLEDGED')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 shadow-md shadow-blue-600/30 transition-all"
              >
                <FileCheck className="h-4 w-4" />
                Acknowledge Incident
              </button>
            )}

            {(incident.status === 'PENDING' || incident.status === 'ACKNOWLEDGED') && (
              <button
                type="button"
                onClick={() => handleStatusChange('DISPATCHED')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 shadow-md shadow-red-600/30 animate-pulse transition-all"
              >
                <Radio className="h-4 w-4" />
                Dispatch Response Units
              </button>
            )}

            {incident.status === 'DISPATCHED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('IN_PROGRESS')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-all"
              >
                <Activity className="h-4 w-4" />
                Mark In Progress (On Scene)
              </button>
            )}

            {incident.status !== 'RESOLVED' && incident.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 shadow-md shadow-emerald-600/30 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Resolved / Patient Safe
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
