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
  ArrowRight,
  Radio,
} from 'lucide-react';
import { hospitalApi } from '../api/hospitals';
import { useEmergencyStore } from '../store/emergencyStore';
import type { Hospital, EmergencyIncident } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { LiveEmergencyMap, OSM_TEST_LOCATION } from '../components/map/LiveEmergencyMap';

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

  return (
    <div className="space-y-6">
      {/* Hospital Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {hospital?.name || 'Partner Emergency Hospital'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                TRAUMA CENTER ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{hospital?.address || 'Mangalagiri, Guntur District'}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{hospital?.phoneNumber || '+91 8645 280000'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHospitalData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setCapacityModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Update Bed & ICU Capacity</span>
          </button>
        </div>
      </div>

      {/* Hospital Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 border-l-4 border-l-red-500 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Ack
            </span>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Awaiting hospital triage</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 border-l-4 border-l-blue-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Accepted Cases
            </span>
            <HeartPulse className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{acceptedCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">En route / preparing bay</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available ICUs
            </span>
            <Bed className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {hospital?.availableIcus ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">of {hospital?.emergencyCapacity ?? 0} total beds</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hospital Ambulances
            </span>
            <Ambulance className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {hospital?.availableAmbulances ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Units ready for dispatch</span>
        </div>
      </div>

      {/* Interactive OpenStreetMap: Live Emergency & Trauma Center Radar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Trauma Triage Map (OpenStreetMap)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {incidents.filter((i) => i.latitude && i.longitude).length} active casualties plotted on map
          </span>
        </div>

        <LiveEmergencyMap
          incidents={incidents}
          hospitals={hospital ? [hospital] : []}
          height="380px"
          initialCenter={
            selectedIncident?.latitude && selectedIncident?.longitude
              ? [selectedIncident.latitude, selectedIncident.longitude]
              : hospital?.latitude && hospital?.longitude
              ? [hospital.latitude, hospital.longitude]
              : [OSM_TEST_LOCATION.lat, OSM_TEST_LOCATION.lng]
          }
          initialZoom={OSM_TEST_LOCATION.zoom}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />
      </div>

      {/* Main Grid: Incoming Alerts + Patient Care Preparation Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
              Assigned Emergency Alerts ({incidents.length})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Select alert to manage trauma workflow</span>
          </div>

          {incidents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No active emergency cases assigned to this facility.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isPending = !inc.hospitalAcknowledgement || inc.hospitalAcknowledgement === 'PENDING';
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {inc.id.substring(0, 10)}
                        </span>
                        <Badge status={inc.source} variant="source" />
                      </div>
                      <Badge status={inc.status} />
                    </div>

                    <div className="mt-2 text-xs space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{inc.detectionReason}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Patient: <strong className="text-slate-800 dark:text-slate-200">{inc.patientName || 'Citizen User'}</strong> · Blood:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">{inc.bloodGroup || 'O+'}</strong>
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Ack: <strong className={inc.hospitalAcknowledgement === 'ACCEPTED' ? 'text-emerald-600' : 'text-amber-600'}>
                          {inc.hospitalAcknowledgement || 'PENDING'}
                        </strong>
                      </span>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(inc.id, 'ACCEPT');
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                          >
                            Accept Case
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIncident(inc);
                              setDeclineModalOpen(true);
                            }}
                            className="rounded-lg border border-rose-300 dark:border-rose-800 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Incident Preparation Dossier */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
            Trauma Ward Preparation & Intake Details
          </h2>

          {selectedIncident ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Case #{selectedIncident.id.slice(0, 12)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatched at {new Date(selectedIncident.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <Badge status={selectedIncident.hospitalAcknowledgement || 'PENDING'} />
              </div>

              {/* Patient Clinical Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Patient Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedIncident.patientName || 'Sai Krishna VSK'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Blood Group</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedIncident.bloodGroup || 'O+'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Allergies</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {selectedIncident.allergies || 'None recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Medical History</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {selectedIncident.medicalConditions || 'Asthma (Mild)'}
                  </span>
                </div>
              </div>

              {/* Emergency Department Preparation Milestones */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Emergency Department Preparation Progress
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'PREPARATION_STARTED', label: 'Preparation Started' },
                    { key: 'TRAUMA_NOTIFIED', label: 'Trauma Team Notified' },
                    { key: 'RESOURCES_PREPARED', label: 'ICU Bay Ready' },
                    { key: 'PATIENT_EXPECTED', label: 'Patient Inbound' },
                    { key: 'PATIENT_ARRIVED', label: 'Patient Arrived' },
                    { key: 'ADMITTED', label: 'Admitted to Ward' },
                  ].map((step) => {
                    const isCurrent = selectedIncident.hospitalPreparationStatus === step.key;
                    return (
                      <button
                        key={step.key}
                        onClick={() => handlePreparationUpdate(selectedIncident.id, step.key)}
                        className={`p-2.5 rounded-xl text-left border font-semibold text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
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
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Select an incoming alert from the queue to view clinical details and update trauma preparation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decline Reason Modal */}
      <Modal
        isOpen={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline Emergency Case"
        subtitle="Provide reason so the emergency grid can immediately reroute the patient"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Reason for Declining
            </label>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="No ICU beds currently available">No ICU beds currently available</option>
              <option value="Trauma bay at maximum capacity">Trauma bay at maximum capacity</option>
              <option value="Specialized neuro/cardiac surgical team unavailable">Specialized surgical team unavailable</option>
              <option value="Reroute recommended to tertiary AIIMS center">Reroute recommended to AIIMS</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeclineModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDeclineConfirm}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Confirm Decline & Reroute
            </button>
          </div>
        </div>
      </Modal>

      {/* Capacity Update Modal */}
      <Modal
        isOpen={capacityModalOpen}
        onClose={() => setCapacityModalOpen(false)}
        title="Update Emergency Hospital Readiness"
        subtitle="Keep available bed and fleet counts updated for live emergency routing"
        maxWidth="md"
      >
        <form onSubmit={handleCapacitySave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Available ICU Beds
            </label>
            <input
              type="number"
              min="0"
              value={availableIcus}
              onChange={(e) => setAvailableIcus(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Total Emergency Bed Capacity
            </label>
            <input
              type="number"
              min="0"
              value={availableBeds}
              onChange={(e) => setAvailableBeds(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Available Response Ambulances
            </label>
            <input
              type="number"
              min="0"
              value={availableAmbulances}
              onChange={(e) => setAvailableAmbulances(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCapacityModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Save Capacity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
