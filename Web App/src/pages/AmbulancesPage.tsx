import React, { useEffect, useState } from 'react';
import { ambulanceApi } from '../api/ambulances';
import { hospitalApi } from '../api/hospitals';
import { useEmergencyStore } from '../store/emergencyStore';
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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newType, setNewType] = useState<'ALS' | 'BLS'>('ALS');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newHospitalId, setNewHospitalId] = useState<number>(1);
  const [newEquipment, setNewEquipment] = useState('Ventilator, Defibrillator, Oxygen');

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

  const handleSimulateMove = async (amb: Ambulance) => {
    // Simulate slight vehicle movement towards target (lat +/- 0.002)
    const newLat = (amb.latitude || 16.35) + (Math.random() - 0.5) * 0.005;
    const newLng = (amb.longitude || 80.52) + (Math.random() - 0.5) * 0.005;
    try {
      await ambulanceApi.updateLocation(amb.id, newLat, newLng);
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
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AmbulanceIcon className="h-5 w-5 text-amber-400" />
            Ambulance Fleet & GPS Dispatch Tracker
          </h2>
          <p className="text-xs text-slate-400">
            Real-time Advanced Life Support (ALS) and Basic Life Support (BLS) vehicle lifecycle
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Fleet
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Add Ambulance
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-2 backdrop-blur-md">
        {['ALL', 'AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'AT_SCENE', 'COMPLETED', 'MAINTENANCE'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* Fleet Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3 pl-2">Vehicle Plate</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Affiliated Hospital</th>
                <th className="pb-3">Driver & Contact</th>
                <th className="pb-3">Life-Support Equipment</th>
                <th className="pb-3">GPS Location</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Dispatch Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredAmbulances.map((amb) => (
                <tr key={amb.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pl-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {amb.vehicleNumber}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-black ${
                        amb.vehicleType === 'ALS'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {amb.vehicleType}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-200">
                    {amb.hospital?.name || 'AIIMS Mangalagiri'}
                  </td>
                  <td className="py-3.5">
                    <p className="text-white font-semibold flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {amb.driverName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-slate-500" />
                      {amb.driverPhone}
                    </p>
                  </td>
                  <td className="py-3.5 text-slate-300 max-w-[200px] truncate text-[11px]">
                    {amb.equipment || 'Standard First Aid'}
                  </td>
                  <td className="py-3.5 font-mono text-[11px] text-slate-400">
                    {amb.latitude?.toFixed(4)}, {amb.longitude?.toFixed(4)}
                  </td>
                  <td className="py-3.5">
                    <Badge status={amb.status} />
                  </td>
                  <td className="py-3.5 text-right pr-2 space-x-1 whitespace-nowrap">
                    {/* Status dropdown quick transition */}
                    <select
                      value={amb.status}
                      onChange={(e) =>
                        handleStatusChange(amb.id, e.target.value as AmbulanceStatus)
                      }
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="EN_ROUTE">EN_ROUTE</option>
                      <option value="AT_SCENE">AT_SCENE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>

                    <button
                      onClick={() => handleSimulateMove(amb)}
                      title="Simulate GPS movement step"
                      className="rounded-lg bg-amber-600/20 border border-amber-500/40 p-1 text-amber-300 hover:bg-amber-600 hover:text-white transition-colors"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ambulance Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Emergency Ambulance to Fleet"
        subtitle="Registers vehicle with driver info and hospital affiliation"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vehicle Registration Number
            </label>
            <input
              type="text"
              value={newVehicleNumber}
              onChange={(e) => setNewVehicleNumber(e.target.value)}
              placeholder="e.g. AP 16 TE 1085"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white uppercase focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vehicle Life-Support Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'ALS' | 'BLS')}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="ALS">Advanced Life Support (ALS)</option>
                <option value="BLS">Basic Life Support (BLS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hospital Affiliation
              </label>
              <select
                value={newHospitalId}
                onChange={(e) => setNewHospitalId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                placeholder="Driver full name"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Driver Contact Phone
              </label>
              <input
                type="text"
                value={newDriverPhone}
                onChange={(e) => setNewDriverPhone(e.target.value)}
                placeholder="+91 94401 23456"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Onboard Medical Equipment
            </label>
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="Ventilator, Defibrillator, Syringe Pump, Oxygen"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-colors shadow-md"
            >
              Register Ambulance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
