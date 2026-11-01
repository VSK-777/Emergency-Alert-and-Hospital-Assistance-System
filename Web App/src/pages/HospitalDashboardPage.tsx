import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Bed,
  Ambulance,
  Phone,
  MapPin,
  Sparkles,
  HeartPulse,
  User,
  ShieldAlert,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { hospitalApi } from '../api/hospitals';
import { useEmergencyStore } from '../store/emergencyStore';
import type { Hospital, EmergencyIncident } from '../types';

export const HospitalDashboardPage: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);

  // Decline Modal
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('No ICU beds currently available');

  // Edit Capacity Modal
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [availableIcus, setAvailableIcus] = useState(5);
  const [availableBeds, setAvailableBeds] = useState(20);
  const [availableAmbulances, setAvailableAmbulances] = useState(3);

  const fetchHospitalData = async () => {
    setIsLoading(true);
    try {
      const myHosp = await hospitalApi.getMyHospital();
      setHospital(myHosp);
      setAvailableIcus(myHosp.availableIcus);
      setAvailableBeds(myHosp.emergencyCapacity);
      setAvailableAmbulances(myHosp.availableAmbulances);

      if (myHosp.id) {
        const hospIncidents = await hospitalApi.getHospitalEmergencies(myHosp.id);
        setIncidents(hospIncidents);
      }
    } catch (err) {
      console.error('Failed to load hospital emergencies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
    const interval = setInterval(fetchHospitalData, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (incidentId: string, action: 'ACKNOWLEDGE' | 'ACCEPT') => {
    if (!hospital) return;
    try {
      const updated = await hospitalApi.acknowledgeIncident(hospital.id, incidentId, action);
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? updated : i)));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(updated);
      }
    } catch (err) {
      console.error('Acknowledgement failed:', err);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!hospital || !selectedIncident) return;
    try {
      const updated = await hospitalApi.acknowledgeIncident(
        hospital.id,
        selectedIncident.id,
        'DECLINE',
        declineReason
      );
      setIncidents((prev) => prev.map((i) => (i.id === selectedIncident.id ? updated : i)));
      setSelectedIncident(null);
      setDeclineModalOpen(false);
    } catch (err) {
      console.error('Decline failed:', err);
    }
  };

  const handlePreparationUpdate = async (incidentId: string, status: string) => {
    if (!hospital) return;
    try {
      const updated = await hospitalApi.updatePreparationStatus(hospital.id, incidentId, status);
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? updated : i)));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(updated);
      }
    } catch (err) {
      console.error('Preparation status update failed:', err);
    }
  };

  const handleCapacitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;
    try {
      const updated = await hospitalApi.updateHospital(hospital.id, {
        emergencyCapacity: availableBeds,
        availableIcus: availableIcus,
        availableAmbulances: availableAmbulances,
      });
      setHospital(updated);
      setCapacityModalOpen(false);
    } catch (err) {
      console.error('Failed to update capacity:', err);
    }
  };

  const pendingCount = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED' && (!i.hospitalAcknowledgement || i.hospitalAcknowledgement === 'PENDING')
  ).length;

  const acceptedCount = incidents.filter(
    (i) => i.hospitalAcknowledgement === 'ACCEPTED' && i.status !== 'RESOLVED' && i.status !== 'CANCELLED'
  ).length;

  const arrivedCount = incidents.filter(
    (i) => i.status === 'ARRIVED' || i.hospitalPreparationStatus === 'PATIENT_ARRIVED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Hospital Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600/20 border border-sky-500/30 text-sky-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                {hospital?.name || 'Partner Emergency Hospital'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE EMERGENCY ADMISSION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>{hospital?.address || 'Mangalagiri, Guntur District'}</span>
              <span className="text-slate-600">·</span>
              <Phone className="h-3.5 w-3.5 text-slate-500" />
              <span>{hospital?.phoneNumber || '+91 8645 280000'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHospitalData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCapacityModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Update Bed & ICU Capacity</span>
          </button>
        </div>
      </div>

      {/* Hospital Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-red-500/20 bg-slate-900/60 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Acknowledgment
            </span>
            <AlertCircle className="h-4 w-4 text-red-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-red-400 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-slate-500">Incoming trauma / SOS</span>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Accepted Incoming
            </span>
            <HeartPulse className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2">{acceptedCount}</p>
          <span className="text-[11px] text-slate-500">En route to emergency ward</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available ICUs
            </span>
            <Bed className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            {hospital?.availableIcus ?? 0}
          </p>
          <span className="text-[11px] text-slate-500">of {hospital?.emergencyCapacity ?? 0} Total Beds</span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hospital Ambulances
            </span>
            <Ambulance className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">
            {hospital?.availableAmbulances ?? 0}
          </p>
          <span className="text-[11px] text-slate-500">Ready for dispatch</span>
        </div>
      </div>

      {/* Main Grid: Incoming Alerts + Patient Care Preparation Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
              Assigned Emergency Alerts ({incidents.length})
            </h2>
            <span className="text-xs text-slate-500">Live Auto-Updating</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/40">
              Loading emergency queue...
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">No Pending Emergencies</p>
              <p className="text-xs text-slate-500">
                Hospital emergency reception grid is active and standing by.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                const isSensor = incident.source === 'SMARTWATCH_SENSOR';

                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-slate-900/95 shadow-lg shadow-sky-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isSensor
                                ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300'
                                : 'bg-red-950/60 border border-red-500/30 text-red-300'
                            }`}
                          >
                            <ShieldAlert className="h-3 w-3" />
                            {isSensor ? 'SMARTWATCH SENSOR FALL' : 'MANUAL EMERGENCY SOS'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {incident.id.slice(0, 12)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">
                          {incident.patientName || 'Emergency Patient'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {incident.detectionReason || 'Critical emergency reported'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            incident.hospitalAcknowledgement === 'ACCEPTED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : incident.hospitalAcknowledgement === 'DECLINED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {incident.hospitalAcknowledgement || 'PENDING'}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(incident.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span>Blood: {incident.bloodGroup || 'Unknown'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {incident.hospitalAcknowledgement !== 'ACCEPTED' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(incident.id, 'ACCEPT');
                            }}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors"
                          >
                            Accept Case
                          </button>
                        )}
                        {incident.hospitalAcknowledgement !== 'DECLINED' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIncident(incident);
                              setDeclineModalOpen(true);
                            }}
                            className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors"
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Incident Detail & Patient Care Preparation */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Clinical Intake & Emergency Preparation
          </h2>

          {selectedIncident ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-5 shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">
                    {selectedIncident.patientName || 'Emergency Patient'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Contact: {selectedIncident.patientPhone || 'Not provided'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">
                    Incident ID: {selectedIncident.id}
                  </span>
                  <div className="mt-1">
                    <span className="rounded-full bg-red-950/60 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-300">
                      Status: {selectedIncident.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Profile Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <HeartPulse className="h-4 w-4 text-red-400" />
                  <span>Authorized Patient Emergency Medical Profile</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Blood Group:</span>{' '}
                    <span className="font-bold text-white">{selectedIncident.bloodGroup || 'Unspecified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Allergies:</span>{' '}
                    <span className="font-semibold text-rose-300">
                      {selectedIncident.allergies || 'None declared'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Medical Conditions:</span>{' '}
                    <span className="text-slate-300">
                      {selectedIncident.medicalConditions || 'No existing conditions on record'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Preparation Workflow Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Hospital Preparation Pipeline
                  </label>
                  <span className="text-[11px] font-mono text-sky-400">
                    Current: {selectedIncident.hospitalPreparationStatus || 'NOT_STARTED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Preparation Started', code: 'PREPARATION_STARTED' },
                    { label: 'Department Notified', code: 'DEPARTMENT_NOTIFIED' },
                    { label: 'Resources Prepared', code: 'RESOURCES_PREPARED' },
                    { label: 'Patient Expected', code: 'PATIENT_EXPECTED' },
                    { label: 'Patient Arrived', code: 'PATIENT_ARRIVED' },
                    { label: 'Patient Admitted', code: 'PATIENT_ADMITTED' },
                  ].map((step) => {
                    const isCurrent = selectedIncident.hospitalPreparationStatus === step.code;
                    return (
                      <button
                        key={step.code}
                        type="button"
                        onClick={() => handlePreparationUpdate(selectedIncident.id, step.code)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                          isCurrent
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/20'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{step.label}</span>
                          {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coordinates and OpenStreetMap view */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Incident Location:</span>{' '}
                  <span className="font-mono text-slate-300">
                    {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}
                  </span>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${selectedIncident.latitude}&mlon=${selectedIncident.longitude}#map=16/${selectedIncident.latitude}/${selectedIncident.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline font-semibold"
                >
                  View on OpenStreetMap →
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500">
              Select an emergency alert from the queue to view patient clinical data and update hospital preparation.
            </div>
          )}
        </div>
      </div>

      {/* Decline with Reason Modal */}
      {declineModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Decline Emergency Intake</h3>
              <button onClick={() => setDeclineModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Provide an official clinical/operational reason for declining incident{' '}
              <span className="font-mono text-white">{selectedIncident.id.slice(0, 8)}</span>:
            </p>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
            >
              <option value="No ICU beds currently available">No ICU beds currently available</option>
              <option value="Emergency Department at maximum critical capacity">
                Emergency Department at maximum critical capacity
              </option>
              <option value="Specialized trauma surgical unit unavailable">
                Specialized trauma surgical unit unavailable
              </option>
              <option value="Power or medical equipment maintenance in progress">
                Power or medical equipment maintenance in progress
              </option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalOpen(false)}
                className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineConfirm}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Capacity Modal */}
      {capacityModalOpen && hospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Update Hospital Live Capacity</h3>
              <button onClick={() => setCapacityModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCapacitySave} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Available ICU Beds</label>
                <input
                  type="number"
                  min="0"
                  value={availableIcus}
                  onChange={(e) => setAvailableIcus(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Total Emergency Beds</label>
                <input
                  type="number"
                  min="0"
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Available Ambulances</label>
                <input
                  type="number"
                  min="0"
                  value={availableAmbulances}
                  onChange={(e) => setAvailableAmbulances(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCapacityModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500"
                >
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
