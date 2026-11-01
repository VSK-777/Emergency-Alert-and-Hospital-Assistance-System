import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Heart,
  Watch,
  Building2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  Navigation,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { emergencyApi } from '../api/emergencies';
import { hospitalApi } from '../api/hospitals';
import { useAuthStore } from '../store/authStore';
import type { EmergencyIncident, Hospital } from '../types';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeEmergency, setActiveEmergency] = useState<EmergencyIncident | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 16.3533,
    lng: 80.5238,
  });
  const [isTriggeringSos, setIsTriggeringSos] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);

  // Load user GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to VVIT Nambur coordinates
          setUserLocation({ lat: 16.3533, lng: 80.5238 });
        }
      );
    }
  }, []);

  const loadData = async () => {
    try {
      const myIncidents = await emergencyApi.getMyIncidents();
      const active = myIncidents.find(
        (i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED'
      );
      setActiveEmergency(active || null);

      const nearbyHosp = await hospitalApi.getHospitals(userLocation.lat, userLocation.lng);
      setHospitals(nearbyHosp.slice(0, 4));
    } catch (err) {
      console.error('Failed to load citizen dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [userLocation]);

  const handleManualSos = async () => {
    setIsTriggeringSos(true);
    setSosSuccess(false);

    try {
      const incident = await emergencyApi.createIncident({
        source: 'MANUAL_SOS',
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        accuracyMeters: 5.0,
        detectionReason: 'Deliberate citizen manual emergency SOS alert',
        detectionScore: 1.0,
      });
      setActiveEmergency(incident);
      setSosSuccess(true);
    } catch (err) {
      console.error('Failed to trigger manual SOS:', err);
    } finally {
      setIsTriggeringSos(false);
    }
  };

  const handleCancelSos = async () => {
    if (!activeEmergency) return;
    if (confirm('Cancel this emergency alert? Please only cancel if this was a test or false alarm.')) {
      try {
        await emergencyApi.cancelIncident(activeEmergency.id);
        setActiveEmergency(null);
        setSosSuccess(false);
      } catch (err) {
        console.error('Failed to cancel incident:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800/40">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Welcome, {user?.fullName || 'Citizen'}
              </h1>
              <span className="rounded-full border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                CITIZEN CARE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Current Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} (VVIT / Guntur Region)
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${userLocation.lat}&mlon=${userLocation.lng}#map=16/${userLocation.lat}/${userLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                View on Map
              </a>
            </p>
          </div>
        </div>

        {/* Smartwatch Connection State Indicator */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
            <Watch className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <span>VVIT CSP Watch</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">IMU 50Hz Monitoring Active</p>
          </div>
        </div>
      </div>

      {/* EMERGENCY SOS SECTION */}
      <div className="rounded-3xl border border-red-200 dark:border-red-900/40 bg-gradient-to-br from-red-50/60 via-white to-red-50/30 dark:from-red-950/30 dark:via-slate-900 dark:to-slate-900 p-8 shadow-xs text-center space-y-6 transition-colors">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 px-3 py-1 text-xs font-bold text-red-800 dark:text-red-300">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            <span>IMMEDIATE EMERGENCY RESPONSE</span>
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Need Urgent Medical Assistance?</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Pressing SOS alerts the nearest hospital trauma ward, dispatches eligible community responders,
            and notifies your emergency contacts with your exact GPS coordinates.
          </p>
        </div>

        {/* Tactile SOS Button */}
        <div>
          <button
            type="button"
            disabled={isTriggeringSos || !!activeEmergency}
            onClick={handleManualSos}
            className={`group relative mx-auto flex h-32 w-32 items-center justify-center rounded-full text-white font-black text-xl tracking-wider transition-all duration-300 cursor-pointer ${
              activeEmergency
                ? 'bg-slate-400 dark:bg-slate-800 text-slate-200 dark:text-slate-500 cursor-not-allowed border-4 border-slate-300 dark:border-slate-700'
                : 'bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 border-4 border-white dark:border-slate-900 ring-4 ring-red-500/20'
            }`}
          >
            <div className="relative text-center">
              <span className="block text-2xl font-black">SOS</span>
              <span className="text-[10px] tracking-normal font-semibold opacity-90">
                {activeEmergency ? 'ALERT ACTIVE' : 'PRESS FOR HELP'}
              </span>
            </div>
          </button>
        </div>

        {/* Active Emergency Status Live Tracker */}
        {activeEmergency && (
          <div className="rounded-2xl border border-red-300 dark:border-red-900/60 bg-white/90 dark:bg-red-950/20 p-5 text-left space-y-4 max-w-2xl mx-auto shadow-sm backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Response In Progress</h3>
              </div>
              <span className="text-xs font-mono text-red-600 dark:text-red-400 font-semibold">
                ID: {activeEmergency.id.slice(0, 10)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Source</span>
                <span className="font-bold text-slate-800 dark:text-white">{activeEmergency.source}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Hospital</span>
                <span className="font-bold text-blue-600 dark:text-sky-400 truncate block">
                  {activeEmergency.assignedHospitalName || 'AIIMS Mangalagiri'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Hospital Ack</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {activeEmergency.hospitalAcknowledgement || 'NOTIFIED'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Responder</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                  {activeEmergency.assignedResponderName || 'Dispatched'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Stay in a safe location until responders arrive.
              </span>
              <button
                type="button"
                onClick={handleCancelSos}
                className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
              >
                Cancel Emergency (False Alarm)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Nearby Hospitals + Medical Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nearby Hospitals (Read-Only) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Nearby Emergency Hospitals
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Public ER Directory</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5 shadow-xs transition-colors"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{hosp.name}</h4>
                  <span className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                    {hosp.availableIcus} ICUs
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{hosp.address}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">ER Phone: {hosp.phoneNumber}</span>
                  <a
                    href={`tel:${hosp.phoneNumber}`}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    Call ER
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical ID Card Summary */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
            My Digital Medical ID
          </h3>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {user?.fullName || 'Sai Krishna VSK'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.phoneNumber || '+91 98765 43210'}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800/40 flex items-center justify-center font-black text-sm">
                {user?.bloodGroup || 'O+'}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Allergies:</span>{' '}
                <span className="text-rose-600 dark:text-rose-300 font-semibold">
                  {user?.allergies || 'Penicillin'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Medical Conditions:</span>{' '}
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {user?.medicalConditions || 'Asthma (Mild)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Emergency Contact:</span>{' '}
                <span className="text-slate-800 dark:text-slate-200">
                  Bhargav T (Brother) · +91 98765 43220
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Visible strictly to verified ER doctors and dispatched first responders.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
