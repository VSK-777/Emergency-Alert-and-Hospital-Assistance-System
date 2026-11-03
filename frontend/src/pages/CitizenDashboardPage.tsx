import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileText,
  Upload,
  Trash2,
  Download,
  Paperclip,
} from 'lucide-react';
import { emergencyApi } from '../api/emergencies';
import { hospitalApi } from '../api/hospitals';
import { contactApi } from '../api/contacts';
import { deviceApi } from '../api/devices';
import { fileApi, type MedicalDocument } from '../api/files';
import { useAuthStore } from '../store/authStore';
import type { EmergencyIncident, Hospital, EmergencyContact, HardwareDevice } from '../types';
import { Badge } from '../components/common/Badge';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeEmergency, setActiveEmergency] = useState<EmergencyIncident | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [pairedDevice, setPairedDevice] = useState<HardwareDevice | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 16.3533,
    lng: 80.5238,
  });

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
      // 1. Incidents
      const myIncidents = await emergencyApi.getMyIncidents();
      const active = myIncidents.find(
        (i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED'
      );
      setActiveEmergency(active || null);

      // 2. Nearby Hospitals
      const nearbyHosp = await hospitalApi.getHospitals(userLocation.lat, userLocation.lng);
      setHospitals(nearbyHosp.slice(0, 4));

      // 3. Verified Emergency Contacts
      const userContacts = await contactApi.getContacts();
      setContacts(userContacts);

      // 4. Paired ESP32 Hardware Triage Devices
      const devices = await deviceApi.getDevices();
      const myDevice = devices.find((d) => (d.deviceType === 'ESP32_TRIAGE' || d.deviceType === 'SMARTWATCH') && d.isActive);
      setPairedDevice(myDevice || null);

      // 5. Medical Documents & Reports (Secure Cloud Storage)
      const docs = await fileApi.getMyDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load citizen dashboard data:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB limit.');
      return;
    }
    setIsUploadingFile(true);
    setUploadError(null);
    try {
      await fileApi.uploadFile(file, 'MEDICAL_RECORD');
      const docs = await fileApi.getMyDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm('Delete this medical document from cloud storage?')) return;
    try {
      await fileApi.deleteFile(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete file');
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [userLocation]);

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
          </div>
        )}
      </div>

      {/* Grid: Nearby Hospitals + Digital Medical ID */}
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

          {/* Medical Documents & Reports (Secure Cloud Storage) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Medical Documents & Prescriptions
                </h4>
              </div>
              <label className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-xs transition-colors">
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploadingFile ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploadingFile}
                  className="hidden"
                />
              </label>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-2">
              {documents.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Paperclip className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  No medical reports uploaded yet. Upload PDF reports or photos (&lt;10MB).
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileText className="h-4 w-4 shrink-0 text-indigo-500" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {doc.originalFileName || doc.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {((doc.fileSizeBytes || 0) / 1024).toFixed(1)} KB · {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={doc.fileUrl || fileApi.getDownloadUrl(doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        title="View / Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Files are securely encrypted in cloud storage with signed access URLs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
