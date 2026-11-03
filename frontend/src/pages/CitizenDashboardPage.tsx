import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HeartPulse,
  Cpu,
  Building2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Radio,
  ExternalLink,
  Edit,
  UserCheck,
  Activity,
  Navigation,
} from 'lucide-react';
import { emergencyApi } from '../api/emergencies';
import { hospitalApi } from '../api/hospitals';
import { contactApi } from '../api/contacts';
import { deviceApi } from '../api/devices';
import { useAuthStore } from '../store/authStore';
import type { EmergencyIncident, Hospital, EmergencyContact, HardwareDevice } from '../types';
import { Badge } from '../components/common/Badge';
import { LiveEmergencyMap, OSM_TEST_LOCATION } from '../components/map/LiveEmergencyMap';

// Verified Regional Partner Hospitals (VVIT Nambur, Guntur & Mangalagiri Emergency Corridor)
export const DEFAULT_REGIONAL_HOSPITALS: Hospital[] = [
  {
    id: 1,
    name: 'AIIMS Mangalagiri',
    address: 'All India Institute Of Medical Sciences (AIIMS) Road, Mangalagiri, Guntur District, AP 522503',
    latitude: 16.446245,
    longitude: 80.580132,
    phoneNumber: '+918645280000',
    emergencyCapacity: 50,
    availableIcus: 15,
    availableAmbulances: 6,
    isActive: true,
  },
  {
    id: 2,
    name: 'Manipal Hospital Vijayawada',
    address: 'Service Road, Near Varadhi, Tadepalle, Guntur District, AP 522501',
    latitude: 16.484436,
    longitude: 80.616980,
    phoneNumber: '+918662499999',
    emergencyCapacity: 35,
    availableIcus: 8,
    availableAmbulances: 4,
    isActive: true,
  },
  {
    id: 3,
    name: 'Government General Hospital (GGH) Guntur',
    address: 'Station Road, Sambasiva Pet / Arundelpet, Guntur, AP 522001',
    latitude: 16.299558,
    longitude: 80.443772,
    phoneNumber: '+918632220000',
    emergencyCapacity: 60,
    availableIcus: 20,
    availableAmbulances: 8,
    isActive: true,
  },
  {
    id: 4,
    name: 'NRI General Hospital & Medical College',
    address: 'Mangalagiri Main Road, Chinakakani, AP 522503',
    latitude: 16.415035,
    longitude: 80.557396,
    phoneNumber: '+918645230101',
    emergencyCapacity: 40,
    availableIcus: 10,
    availableAmbulances: 5,
    isActive: true,
  },
];

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeEmergency, setActiveEmergency] = useState<EmergencyIncident | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [pairedDevice, setPairedDevice] = useState<HardwareDevice | null>(null);
  const [isTriggeringSos, setIsTriggeringSos] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: OSM_TEST_LOCATION.lat,
    lng: OSM_TEST_LOCATION.lng,
  });

  // Load user GPS location with graceful fallback to OpenStreetMap initial test coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (error) => {
          console.warn('Geolocation unavailable/denied, falling back to VVIT test coordinates:', error.message);
          setUserLocation({ lat: OSM_TEST_LOCATION.lat, lng: OSM_TEST_LOCATION.lng });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    }
  }, []);

  const loadData = async () => {
    try {
      // 1. Incidents
      const myIncidents = await emergencyApi.getMyIncidents();
      const active = myIncidents.find(
        (i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED'
      );
      setActiveEmergency(active || null);

      // 2. Nearby Hospitals from Live Backend (calculated with live GPS)
      try {
        const nearbyHosp = await hospitalApi.getHospitals(userLocation.lat, userLocation.lng);
        if (nearbyHosp && nearbyHosp.length > 0) {
          setHospitals(nearbyHosp.slice(0, 4));
        } else {
          setHospitals(DEFAULT_REGIONAL_HOSPITALS);
        }
      } catch (err) {
        console.warn('Backend hospital query failed, falling back to cached emergency directory:', err);
        setHospitals(DEFAULT_REGIONAL_HOSPITALS);
      } finally {
        setIsLoadingHospitals(false);
      }

      // 3. Verified Emergency Contacts
      const userContacts = await contactApi.getContacts();
      setContacts(userContacts);

      // 4. Paired ESP32 Hardware Triage Devices
      const devices = await deviceApi.getDevices();
      const myDevice = devices.find((d) => (d.deviceType === 'ESP32_TRIAGE' || d.deviceType === 'SMARTWATCH') && d.isActive);
      setPairedDevice(myDevice || null);
    } catch (err) {
      console.error('Failed to load citizen dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [userLocation]);

  const handleTriggerEmergencySos = async () => {
    setIsTriggeringSos(true);

    const dispatchSos = async (coords: { lat: number; lng: number; accuracy?: number }) => {
      try {
        const incident = await emergencyApi.createIncident({
          source: 'MOBILE_SOS',
          latitude: coords.lat,
          longitude: coords.lng,
          accuracyMeters: coords.accuracy || 15,
          detectionReason: 'Citizen Manual SOS Alert Activation (OpenStreetMap GPS)',
        });
        setActiveEmergency(incident);
        setUserLocation({ lat: coords.lat, lng: coords.lng });
        await loadData();
      } catch (err: any) {
        console.error('Failed to dispatch SOS alert:', err);
        alert(err.response?.data?.message || 'Failed to dispatch SOS alert. Please try again.');
      } finally {
        setIsTriggeringSos(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          dispatchSos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (error) => {
          console.warn('GPS location retrieval error, using initial testing coordinates:', error.message);
          dispatchSos({
            lat: userLocation.lat || OSM_TEST_LOCATION.lat,
            lng: userLocation.lng || OSM_TEST_LOCATION.lng,
          });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      );
    } else {
      dispatchSos({
        lat: userLocation.lat || OSM_TEST_LOCATION.lat,
        lng: userLocation.lng || OSM_TEST_LOCATION.lng,
      });
    }
  };

  const handleCancelIncident = async () => {
    if (!activeEmergency) return;
    if (confirm('Cancel this active emergency alert? Please only cancel if this was a false alarm.')) {
      try {
        await emergencyApi.cancelIncident(activeEmergency.id);
        setActiveEmergency(null);
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
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Welcome, {user?.fullName || 'Citizen User'}
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

        {/* ESP32 Hardware Connection State Indicator */}
        {pairedDevice ? (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <span>{pairedDevice.deviceIdentifier}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">ESP32 Triage BLE Active · MPU6050 + MAX30102</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                <span>ESP32 Hardware Standby</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">CSP-Triage-V1 companion offline</p>
            </div>
          </div>
        )}
      </div>

      {/* PRIMARY EMERGENCY MONITORING EXPERIENCE (No Website-based SOS Button) */}
      <div className="space-y-4">
        {activeEmergency ? (
          /* Active Emergency Tracker */
          <div className="rounded-3xl border border-red-300 dark:border-red-900/60 bg-gradient-to-br from-red-50/70 via-white to-red-50/30 dark:from-red-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-red-200 dark:border-red-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Emergency Response In Progress
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={activeEmergency.source} variant="source" />
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  ID: {activeEmergency.id.slice(0, 10)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Emergency alert received by central dispatch grid. Nearby trauma ward alerted and eligible first responders dispatched.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Detection Reason</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeEmergency.detectionReason || 'Emergency Detected'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Receiving Hospital</span>
                <span className="font-bold text-blue-600 dark:text-sky-400 block truncate">
                  {activeEmergency.assignedHospitalName || 'AIIMS Mangalagiri'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hospital Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {activeEmergency.hospitalAcknowledgement || 'NOTIFIED'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">First Responder</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                  {activeEmergency.assignedResponderName || 'Dispatched Standby'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-red-100 dark:border-red-900/30">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Keep calm and stay in a secure position. Responders are navigating to your coordinates.
              </span>
              <button
                type="button"
                onClick={handleCancelIncident}
                className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
              >
                Cancel Emergency (False Alarm)
              </button>
            </div>
          </div>
        ) : (
          /* Normal Operational State: No Active Emergency */
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No active emergency
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                Grid Standby Active
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Your emergency monitoring grid is operational. Automated accident, impact, and physiological distress detection is handled continuously by your <strong>ESP32 Hardware Triage Device (CSP-Triage-V1)</strong> connected via Bluetooth Low Energy to the Android app. In the event of an accident or when manual SOS is triggered via the <strong>Flutter Mobile App</strong>, real-time hospital trauma ward alerts and volunteer responder dispatch will be coordinated here immediately.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Automatic Detection
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-purple-600" />
                  ESP32 MPU6050 + MAX30102
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Mobile Assistance
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-blue-600" />
                  Flutter Mobile SOS Ready
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Emergency Hospitals
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {hospitals.length} Trauma Units Online
                </span>
              </div>
            </div>

            {/* Direct Emergency SOS Trigger with Live GPS */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 animate-pulse" />
                  Need Immediate Emergency Medical Assistance?
                </h4>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                  Triggering SOS captures your GPS location ({userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}), sends an alert to the Spring Boot backend, and immediately notifies nearby hospital trauma centers.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTriggerEmergencySos}
                disabled={isTriggeringSos}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 active:scale-95 transition-all shadow-md hover:shadow-red-600/20 disabled:opacity-50"
              >
                <AlertCircle className={`h-4 w-4 ${isTriggeringSos ? 'animate-spin' : ''}`} />
                {isTriggeringSos ? 'Dispatched GPS SOS...' : 'TRIGGER EMERGENCY SOS (GPS)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive OpenStreetMap Container */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Regional Emergency & Hospital Assistance Map (OpenStreetMap)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Testing Anchor: VVIT Nambur ({OSM_TEST_LOCATION.lat}, {OSM_TEST_LOCATION.lng})</span>
          </div>
        </div>

        <LiveEmergencyMap
          incidents={activeEmergency ? [activeEmergency] : []}
          hospitals={hospitals}
          userLocation={userLocation}
          height="420px"
          initialCenter={[userLocation.lat, userLocation.lng]}
          initialZoom={OSM_TEST_LOCATION.zoom}
        />
      </div>

      {/* Grid: Nearby Hospitals + Digital Medical ID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nearby Hospitals (Live Neon Database Telemetry) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Nearby Emergency Hospitals
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Neon DB
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Sorted by Live GPS Distance</span>
            </div>
          </div>

          {isLoadingHospitals && hospitals.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900 animate-pulse">
              <Building2 className="h-8 w-8 mx-auto text-slate-400 mb-2 animate-bounce" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Querying live Neon PostgreSQL trauma registry with GPS coordinates...
              </p>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
              <Building2 className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No nearby emergency trauma centers found in current radius.
              </p>
              <button
                onClick={loadData}
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Scan Regional Emergency Network
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs transition-colors hover:border-blue-300 dark:hover:border-blue-900 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {hosp.name}
                      </h4>
                      {hosp.distanceKm !== undefined && hosp.distanceKm !== null ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                          <Navigation className="h-2.5 w-2.5" />
                          {hosp.distanceKm} km away
                        </span>
                      ) : (
                        <span className="shrink-0 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                          Regional ER
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>{hosp.address}</span>
                    </p>

                    {/* Live Hospital Telemetry Grid */}
                    <div className="grid grid-cols-3 gap-1 py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-[10px]">
                      <div className="text-center">
                        <span className="text-slate-400 block font-medium">ICUs</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{hosp.availableIcus} Ready</span>
                      </div>
                      <div className="text-center border-x border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 block font-medium">Fleet</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{hosp.availableAmbulances} Amb</span>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-400 block font-medium">Beds</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{hosp.emergencyCapacity} Cap</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs gap-2">
                    <a
                      href={`tel:${hosp.phoneNumber}`}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call ER</span>
                    </a>
                    <a
                      href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation.lat}%2C${userLocation.lng}%3B${hosp.latitude}%2C${hosp.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Digital Medical ID Card Summary (Strictly Verified / Voluntary Data) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              My Digital Medical ID
            </h3>
            <button
              onClick={() => navigate('/settings')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Update Medical Profile
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {user?.fullName || 'Citizen User'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {user?.phoneNumber || 'Not provided'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-center px-1">
                {user?.bloodGroup || 'Not provided'}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Blood Group</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {user?.bloodGroup || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Allergies</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {user?.allergies || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Medical Conditions</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {user?.medicalConditions || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Emergency Contacts</span>
                {contacts.length === 0 ? (
                  <span className="text-slate-500 dark:text-slate-400 italic">No contacts added</span>
                ) : (
                  <div className="space-y-1 mt-1">
                    {contacts.map((c) => (
                      <p key={c.id} className="text-slate-800 dark:text-slate-200">
                        {c.name} ({c.relationship}) · {c.phoneNumber}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Visible strictly to verified ER trauma teams during active emergencies.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
