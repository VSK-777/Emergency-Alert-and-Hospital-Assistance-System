import React, { useEffect, useState } from 'react';
import { hospitalApi } from '../api/hospitals';
import { useEmergencyStore } from '../store/emergencyStore';
import type { Hospital, EmergencyIncident } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  Building2,
  Phone,
  MapPin,
  Ambulance,
  BedDouble,
  Activity,
  PlusCircle,
  Edit,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const { activeIncidents, updateStatus } = useEmergencyStore();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Edit form state
  const [editIcus, setEditIcus] = useState(0);
  const [editAmbulances, setEditAmbulances] = useState(0);
  const [editCapacity, setEditCapacity] = useState(0);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLat, setNewLat] = useState(16.35);
  const [newLng, setNewLng] = useState(80.52);

  const loadHospitals = () => {
    hospitalApi.getHospitals().then(setHospitals);
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const openEditModal = (h: Hospital) => {
    setSelectedHospital(h);
    setEditIcus(h.availableIcus);
    setEditAmbulances(h.availableAmbulances);
    setEditCapacity(h.emergencyCapacity);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      await hospitalApi.updateHospital(selectedHospital.id, {
        availableIcus: editIcus,
        availableAmbulances: editAmbulances,
        emergencyCapacity: editCapacity,
      });
      loadHospitals();
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.error('Failed to update hospital:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalApi.createHospital({
        name: newName,
        address: newAddress,
        phoneNumber: newPhone,
        latitude: newLat,
        longitude: newLng,
        emergencyCapacity: 30,
        availableIcus: 6,
        availableAmbulances: 3,
      });
      loadHospitals();
      setIsCreateModalOpen(false);
      setNewName('');
      setNewAddress('');
      setNewPhone('');
    } catch (err) {
      console.error('Failed to create hospital:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-400" />
            Hospital Network & Emergency Capacity
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ICU bed availability, rapid ambulance fleets, and incoming casualty alert queues
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 active:scale-95 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          Register Partner Hospital
        </button>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hospitals.map((hospital) => {
          const incomingCount = activeIncidents.filter(
            (i) => i.assignedHospitalId === hospital.id
          ).length;

          return (
            <div
              key={hospital.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400 ring-1 ring-sky-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  {incomingCount > 0 ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-300 animate-pulse">
                      <Radio className="h-3 w-3" />
                      {incomingCount} INCOMING
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      NORMAL LOAD
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{hospital.name}</h3>
                  <p className="mt-1 text-xs text-slate-400 flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>
                </div>

                {/* Capacity Gauges */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <BedDouble className="h-3 w-3 text-sky-400" />
                      Available ICUs
                    </span>
                    <p className="text-lg font-black text-sky-400">{hospital.availableIcus}</p>
                    <span className="text-[10px] text-slate-500">of {hospital.emergencyCapacity} beds</span>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Ambulance className="h-3 w-3 text-amber-400" />
                      Ambulances
                    </span>
                    <p className="text-lg font-black text-amber-400">{hospital.availableAmbulances}</p>
                    <span className="text-[10px] text-slate-500">Fleet Ready</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-mono text-slate-300">{hospital.phoneNumber}</span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/80">
                <button
                  onClick={() => openEditModal(hospital)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Edit className="h-3.5 w-3.5 text-slate-400" />
                  Update Bed & Fleet Capacity
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incoming Hospital Emergency Alert Queue */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-500 animate-pulse" />
              Incoming Emergency Alert Feed by Hospital
            </h3>
            <p className="text-xs text-slate-400">
              Trauma center incoming alerts with triage recommendations
            </p>
          </div>
        </div>

        {activeIncidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No incoming casualty dispatches currently in transit.
          </div>
        ) : (
          <div className="space-y-3">
            {activeIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-red-500/10 p-2 text-red-400 ring-1 ring-red-500/30">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{incident.id}</span>
                      <Badge status={incident.source} variant="source" />
                      <Badge status={incident.status} />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">
                      {incident.patientName || 'Emergency Victim'} · Blood: <strong className="text-emerald-400">{incident.bloodGroup || 'O+'}</strong>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target: <strong className="text-sky-300">{incident.assignedHospitalName || 'AIIMS Mangalagiri'}</strong>
                      {' · '}
                      Note: {incident.detectionReason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStatus(incident.id, 'IN_PROGRESS')}
                    className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Prep Trauma Unit & Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Capacity Modal */}
      {selectedHospital && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          title={`Update Capacity: ${selectedHospital.name}`}
          subtitle="Modifies live ICU and ambulance counts in the shared network"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Available ICU Beds
              </label>
              <input
                type="number"
                min="0"
                value={editIcus}
                onChange={(e) => setEditIcus(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Available Ambulances Ready
              </label>
              <input
                type="number"
                min="0"
                value={editAmbulances}
                onChange={(e) => setEditAmbulances(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Emergency Bed Capacity
              </label>
              <input
                type="number"
                min="1"
                value={editCapacity}
                onChange={(e) => setEditCapacity(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-md"
              >
                Save Live Capacity
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Partner Hospital Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register Partner Hospital"
        subtitle="Onboard a new medical center to the emergency coordination network"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hospital Full Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ramesh Hospitals Guntur"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Collector Office Road, Nagarampalem, Guntur"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Emergency Trauma Hotline Phone
            </label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 863 2345678"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={newLat}
                onChange={(e) => setNewLat(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={newLng}
                onChange={(e) => setNewLng(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-md"
            >
              Register Hospital
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
