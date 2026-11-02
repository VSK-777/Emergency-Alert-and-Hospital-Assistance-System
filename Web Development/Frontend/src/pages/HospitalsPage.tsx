import React, { useEffect, useState } from 'react';
import { hospitalApi } from '../api/hospitals';
import { useEmergencyStore } from '../store/emergencyStore';
import { useAuthStore } from '../store/authStore';
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
  Clock,
  ExternalLink,
} from 'lucide-react';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const { activeIncidents } = useEmergencyStore();
  const { user } = useAuthStore();
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

  const canManageHospitals = user?.role === 'ADMIN';
  const isHospitalStaff = user?.role === 'HOSPITAL_STAFF';

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
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Emergency Hospital Network & Readiness
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time ICU bed availability, rapid ambulance fleets, and verified trauma emergency services
          </p>
        </div>

        {canManageHospitals && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Register Partner Hospital
          </button>
        )}
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hospitals.map((hospital) => {
          const incomingCount = activeIncidents.filter(
            (i) => i.assignedHospitalId === hospital.id
          ).length;

          const canEditThisHospital =
            canManageHospitals || (isHospitalStaff && user?.hospitalId === hospital.id);

          return (
            <div
              key={hospital.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 p-2.5 border border-blue-200 dark:border-blue-800/40">
                    <Building2 className="h-5 w-5" />
                  </div>
                  {incomingCount > 0 ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 px-2.5 py-0.5 text-[10px] font-bold animate-pulse">
                      <Radio className="h-3 w-3" />
                      {incomingCount} INCOMING
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                      VERIFIED READY
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {hospital.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>
                </div>

                {/* Capacity Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold uppercase">
                      <BedDouble className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      Available ICUs
                    </span>
                    <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                      {hospital.availableIcus}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">/ {hospital.emergencyCapacity}</span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold uppercase">
                      <Ambulance className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      Ambulances
                    </span>
                    <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                      {hospital.availableAmbulances}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">On-call</span>
                    </p>
                  </div>
                </div>

                {/* Verification & Sync Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated: Just now
                  </span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${hospital.latitude}&mlon=${hospital.longitude}#map=16/${hospital.latitude}/${hospital.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium"
                  >
                    <span>Directions</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={`tel:${hospital.phoneNumber}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 py-2 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call ER ({hospital.phoneNumber})</span>
                </a>

                {canEditThisHospital && (
                  <button
                    onClick={() => openEditModal(hospital)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
                    title="Update Bed & Fleet Capacity"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Capacity Modal (Authorized Roles Only) */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Capacity — ${selectedHospital?.name}`}
        subtitle="Authorized Hospital Capacity Control"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Available ICU Beds
            </label>
            <input
              type="number"
              min="0"
              value={editIcus}
              onChange={(e) => setEditIcus(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Available Emergency Ambulances
            </label>
            <input
              type="number"
              min="0"
              value={editAmbulances}
              onChange={(e) => setEditAmbulances(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Total Emergency Capacity
            </label>
            <input
              type="number"
              min="0"
              value={editCapacity}
              onChange={(e) => setEditCapacity(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
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

      {/* Register Hospital Modal (System Admin Only) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register Partner Hospital Facility"
        subtitle="Add a licensed medical emergency trauma facility to the network grid"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hospital Full Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Apollo Hospital Emergency Center"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="e.g. NH-16, Mangalagiri Bypass Road, Guntur"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Emergency Trauma Contact Phone
            </label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. +91 863 2345678"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={newLat}
                onChange={(e) => setNewLat(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={newLng}
                onChange={(e) => setNewLng(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Register Facility
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
