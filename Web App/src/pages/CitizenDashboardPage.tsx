import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Heart,
  Watch,
  Building2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  Send,
  Navigation,
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
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

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
    try {
      await emergencyApi.cancelIncident(activeEmergency.id);
      setActiveEmergency(null);
      setSosSuccess(false);
    } catch (err) {
      console.error('Failed to cancel incident:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl shadow-red-600/30 text-white font-black">
            <Heart className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                Hello, {user?.fullName || 'Citizen'}
              </h1>
              <span className="rounded-full border border-red-500/20 bg-red-950/40 px-2.5 py-0.5 text-[10px] font-bold text-red-300">
                CITIZEN EMERGENCY HUB
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>
                Current Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} (VVIT / Guntur Region)
              </span>
              <span className="text-slate-600">·</span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${userLocation.lat}&mlon=${userLocation.lng}#map=16/${userLocation.lat}/${userLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:underline font-semibold"
              >
                View on Map
              </a>
            </p>
          </div>
        </div>

        {/* Smartwatch Connection State Indicator */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Watch className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>VVIT CSP Watch</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">IMU 50Hz Fall Detection Active</p>
          </div>
        </div>
      </div>

      {/* EMERGENCY SOS SECTION */}
      <div className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-950/80 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span>IMMEDIATE EMERGENCY RESPONSE</span>
          </span>
          <h2 className="text-2xl font-black text-white">Need Urgent Medical Assistance?</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Pressing SOS alerts the nearest hospital trauma ward, dispatches eligible community responders,
            and notifies your emergency contacts with your exact GPS coordinates.
          </p>
        </div>

        {/* Giant Tactile SOS Button */}
        <div>
          <button
            type="button"
            disabled={isTriggeringSos || !!activeEmergency}
            onClick={handleManualSos}
            className={`group relative mx-auto flex h-36 w-36 items-center justify-center rounded-full text-white font-black text-xl tracking-wider transition-all duration-300 cursor-pointer ${
              activeEmergency
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-4 border-slate-700'
                : 'bg-gradient-to-b from-red-500 to-red-700 shadow-2xl shadow-red-600/50 hover:scale-105 active:scale-95 border-4 border-red-400'
            }`}
          >
            <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
            <div className="relative text-center">
              <span className="block text-2xl font-black">SOS</span>
              <span className="text-[10px] tracking-normal font-semibold opacity-90">
                {activeEmergency ? 'ACTIVE' : 'PRESS FOR HELP'}
              </span>
            </div>
          </button>
        </div>

        {/* Active Emergency Status Live Tracker */}
        {activeEmergency ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-5 text-left space-y-4 max-w-2xl mx-auto backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-ping" />
                <h3 className="text-sm font-bold text-white">Emergency Assistance In Progress</h3>
              </div>
              <span className="text-xs font-mono text-red-300">ID: {activeEmergency.id.slice(0, 12)}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Source</span>
                <span className="font-bold text-white">{activeEmergency.source}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Hospital</span>
                <span className="font-bold text-sky-400 truncate block">
                  {activeEmergency.assignedHospitalName || 'AIIMS Mangalagiri'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Hospital Ack</span>
                <span className="font-bold text-emerald-400">
                  {activeEmergency.hospitalAcknowledgement || 'NOTIFIED'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Responder</span>
                <span className="font-bold text-emerald-400 truncate block">
                  {activeEmergency.assignedResponderName || 'Dispatched'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Do not leave your location if it is safe to stay.
              </span>
              <button
                type="button"
                onClick={handleCancelSos}
                className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900 transition-colors"
              >
                Cancel Emergency (False Alarm)
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Grid: Nearby Hospitals + Medical Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nearby Hospitals */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300">
              Nearby Emergency Hospitals
            </h3>
            <span className="text-xs text-slate-500">Sorted by distance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2.5 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-white">{hosp.name}</h4>
                  <span className="rounded bg-sky-950 text-sky-400 px-2 py-0.5 text-[10px] font-bold border border-sky-500/20">
                    {hosp.availableIcus} ICUs
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{hosp.address}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-500">Contact: {hosp.phoneNumber}</span>
                  <a
                    href={`tel:${hosp.phoneNumber}`}
                    className="font-bold text-emerald-400 hover:underline"
                  >
                    Call ER
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical ID Card Summary */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Digital Medical ID Card
          </h3>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white">{user?.fullName || 'Sai Krishna VSK'}</h4>
                <p className="text-xs text-slate-400">{user?.phoneNumber || '+91 98765 43210'}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-sm">
                {user?.bloodGroup || 'O+'}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Allergies:</span>{' '}
                <span className="text-rose-300 font-semibold">{user?.allergies || 'Penicillin'}</span>
              </div>
              <div>
                <span className="text-slate-500">Medical Conditions:</span>{' '}
                <span className="text-slate-300">{user?.medicalConditions || 'Asthma (Mild)'}</span>
              </div>
              <div>
                <span className="text-slate-500">Emergency Contact:</span>{' '}
                <span className="text-slate-300">Bhargav T (Brother) · +91 98765 43220</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Visible only to verified doctors, hospital trauma staff, and assigned responders.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
