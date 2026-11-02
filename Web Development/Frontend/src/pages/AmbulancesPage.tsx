import React, { useEffect, useState } from 'react';
import { ambulanceApi } from '../api/ambulances';
import { hospitalApi } from '../api/hospitals';
import { useEmergencyStore } from '../store/emergencyStore';
import { useAuthStore } from '../store/authStore';
import type { Ambulance, AmbulanceStatus, Hospital } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Ambulance as AmbulanceIcon,
  Phone,
  User,
  PlusCircle,
  MapPin,
  Building2,
  Radio,
  RefreshCw,
  Gauge,
  Navigation,
} from 'lucide-react';

export const AmbulancesPage: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const { activeIncidents } = useEmergencyStore();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newType, setNewType] = useState<'ALS' | 'BLS'>('ALS');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newHospitalId, setNewHospitalId] = useState<number>(1);
  const [newEquipment, setNewEquipment] = useState('Ventilator, Defibrillator, Oxygen');

  const canManageFleet = user?.role === 'ADMIN' || user?.role === 'HOSPITAL_STAFF';

  const loadData = () => {
    ambulanceApi.getAmbulances().then(setAmbulances);
    hospitalApi.getHospitals().then(setHospitals);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: number, newStatus: AmbulanceStatus) => {
    try {
      await ambulanceApi.updateStatus(id, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ambulanceApi.createAmbulance({
        vehicleNumber: newVehicleNumber,
        vehicleType: newType,
        driverName: newDriverName,
        driverPhone: newDriverPhone,
        hospitalId: newHospitalId,
        equipment: newEquipment,
        latitude: 16.353,
        longitude: 80.523,
      });
      loadData();
      setIsCreateOpen(false);
      setNewVehicleNumber('');
      setNewDriverName('');
      setNewDriverPhone('');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAmbulances = ambulances.filter((a) =>
    statusFilter === 'ALL' ? true : a.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <AmbulanceIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Ambulance Fleet & GPS Dispatch Operations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time ambulance availability, ALS/BLS unit status, and receiving trauma hospital assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          {canManageFleet && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Register Ambulance
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['ALL', 'AVAILABLE', 'EN_ROUTE', 'AT_SCENE', 'COMPLETED', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing {filteredAmbulances.length} of {ambulances.length} vehicles
        </span>
      </div>

      {/* Ambulances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAmbulances.map((amb) => {
          return (
            <div
              key={amb.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 font-bold">
                    <AmbulanceIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {amb.vehicleNumber}
                    </h3>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {amb.vehicleType === 'ALS' ? 'Advanced Life Support (ALS)' : 'Basic Life Support (BLS)'}
                    </p>
                  </div>
                </div>
                <Badge status={amb.status} />
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Driver:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{amb.driverName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Emergency Phone:
                  </span>
                  <a href={`tel:${amb.driverPhone}`} className="text-blue-600 hover:underline font-mono">
                    {amb.driverPhone}
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Station Base:
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                    {amb.hospital?.name || 'AIIMS Mangalagiri Base'}
                  </span>
                </div>
                {amb.equipment && (
                  <div className="pt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Kit: </span>
                    {amb.equipment}
                  </div>
                )}
              </div>

              {canManageFleet && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-slate-400">Status Update:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStatusChange(amb.id, 'AVAILABLE')}
                      disabled={amb.status === 'AVAILABLE'}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 disabled:opacity-40"
                    >
                      Available
                    </button>
                    <button
                      onClick={() => handleStatusChange(amb.id, 'EN_ROUTE')}
                      disabled={amb.status === 'EN_ROUTE'}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 disabled:opacity-40"
                    >
                      En Route
                    </button>
                    <button
                      onClick={() => handleStatusChange(amb.id, 'MAINTENANCE')}
                      disabled={amb.status === 'MAINTENANCE'}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Service
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Register Ambulance Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Response Ambulance"
        subtitle="Add a licensed emergency ambulance unit to the dispatch pool"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Vehicle Registration Number
            </label>
            <input
              type="text"
              value={newVehicleNumber}
              onChange={(e) => setNewVehicleNumber(e.target.value)}
              placeholder="e.g. AP 07 TA 4421"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="ALS">Advanced Life Support (ALS)</option>
                <option value="BLS">Basic Life Support (BLS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Base Hospital
              </label>
              <select
                value={newHospitalId}
                onChange={(e) => setNewHospitalId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Driver Full Name
            </label>
            <input
              type="text"
              value={newDriverName}
              onChange={(e) => setNewDriverName(e.target.value)}
              placeholder="e.g. Venkat Reddy K"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Driver Direct Mobile Number
            </label>
            <input
              type="text"
              value={newDriverPhone}
              onChange={(e) => setNewDriverPhone(e.target.value)}
              placeholder="e.g. +91 98765 43230"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Medical Onboard Equipment
            </label>
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="e.g. Ventilator, Defibrillator, Suction, Oxygen"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
            >
              Register Ambulance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
