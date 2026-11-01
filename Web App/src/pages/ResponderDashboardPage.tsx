import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  AlertCircle,
  RefreshCw,
  Award,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { responderApi } from '../api/responders';
import { useAuthStore } from '../store/authStore';
import type { Responder, EmergencyIncident } from '../types';

export const ResponderDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [responder, setResponder] = useState<Responder | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<EmergencyIncident | null>(null);
  const [nearbyAlerts, setNearbyAlerts] = useState<EmergencyIncident[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchResponderData = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await responderApi.getMyProfile();
      if (data.responder) {
        setResponder(data.responder);
        setIsAvailable(data.responder.isAvailable);
      }
      if (data.activeAssignment) {
        setActiveAssignment(data.activeAssignment);
      } else {
        setActiveAssignment(null);
      }

      const alerts = await responderApi.getNearbyEmergencies();
      setNearbyAlerts(alerts);
    } catch (err: any) {
      console.error('Failed to load responder dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponderData();
    const interval = setInterval(fetchResponderData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const updated = await responderApi.updateAvailability(
              nextState,
              pos.coords.latitude,
              pos.coords.longitude
            );
            setResponder(updated);
          },
          async () => {
            const updated = await responderApi.updateAvailability(nextState, 16.352, 80.524);
            setResponder(updated);
          }
        );
      } else {
        const updated = await responderApi.updateAvailability(nextState, 16.352, 80.524);
        setResponder(updated);
      }
    } catch (err: any) {
      setIsAvailable(!nextState);
      setActionError('Failed to update availability status.');
    }
  };

  const handleClaimAlert = async (incidentId: string) => {
    setActionError(null);
    try {
      const claimed = await responderApi.claimAssignment(incidentId);
      setActiveAssignment(claimed);
      setNearbyAlerts((prev) => prev.filter((a) => a.id !== incidentId));
      setActionSuccess('Emergency mission claimed! Please proceed to the location.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Incident already claimed or unavailable.';
      setActionError(msg);
      fetchResponderData();
    }
  };

  const handleDeclineAlert = async (incidentId: string) => {
    try {
      await responderApi.declineAssignment(incidentId, 'Responder declined alert');
      setNearbyAlerts((prev) => prev.filter((a) => a.id !== incidentId));
    } catch (err) {
      console.error('Failed to decline alert:', err);
    }
  };

  const handleUpdateMissionStatus = async (status: string) => {
    if (!activeAssignment) return;
    try {
      const updated = await responderApi.updateMissionStatus(activeAssignment.id, status);
      if (status === 'COMPLETED' || status === 'UNABLE_TO_ASSIST') {
        setActiveAssignment(null);
        fetchResponderData();
      } else {
        setActiveAssignment(updated);
      }
    } catch (err: any) {
      setActionError('Failed to update mission status.');
    }
  };

  const stages = [
    { code: 'ACCEPTED', label: 'Accepted' },
    { code: 'EN_ROUTE', label: 'En Route' },
    { code: 'ARRIVED', label: 'Arrived at Scene' },
    { code: 'ASSISTANCE_STARTED', label: 'Assistance Started' },
    { code: 'COMPLETED', label: 'Mission Completed' },
  ];

  const currentStageIndex = activeAssignment
    ? stages.findIndex(
        (s) => s.code === (activeAssignment.responderAcceptanceStatus || 'ACCEPTED')
      )
    : -1;

  return (
    <div className="space-y-6">
      {/* Banner & Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
            <HeartHandshake className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                {user?.fullName || 'First Responder'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                {responder?.verificationStatus || 'VERIFIED VOLUNTEER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{responder?.organization || 'VVIT NSS Unit Volunteer'}</span>
              <span className="text-slate-600">·</span>
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>{responder?.specialization || 'Community Emergency First Responder'}</span>
            </p>
          </div>
        </div>

        {/* Live Availability Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-300">
              {isAvailable ? 'Status: AVAILABLE' : 'Status: OFF-DUTY'}
            </p>
            <p className="text-[11px] text-slate-500">
              {isAvailable ? 'Receiving emergency alerts' : 'No alerts dispatched'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAvailability}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isAvailable ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isAvailable ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            onClick={fetchResponderData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Active Assignment (if in progress) */}
      {activeAssignment && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE RESCUE ASSIGNMENT
              </span>
              <h2 className="text-xl font-black text-white mt-2">
                {activeAssignment.patientName || 'Emergency Patient in Distress'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Reason: {activeAssignment.detectionReason || 'Critical incident reported'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${responder?.latitude || 16.352},${responder?.longitude || 80.524};${activeAssignment.latitude},${activeAssignment.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
              >
                <Navigation className="h-4 w-4" />
                <span>Navigate via OpenStreetMap</span>
              </a>
            </div>
          </div>

          {/* Turn-by-Turn Mission Pipeline */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mission Progression Pipeline
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {stages.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <button
                    key={stage.code}
                    type="button"
                    onClick={() => handleUpdateMissionStatus(stage.code)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      isCurrent
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/20'
                        : isPassed
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{stage.label}</span>
                      {isPassed && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>
                Coordinates: {activeAssignment.latitude.toFixed(4)}, {activeAssignment.longitude.toFixed(4)}
              </span>
            </div>
            <button
              onClick={() => handleUpdateMissionStatus('UNABLE_TO_ASSIST')}
              className="text-rose-400 hover:underline font-semibold"
            >
              Unable to complete assistance
            </button>
          </div>
        </div>
      )}

      {/* Nearby Eligible Emergencies List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Nearby Emergency Alerts Requiring Volunteer Assistance ({nearbyAlerts.length})
          </h2>
          <span className="text-xs text-slate-500">Live Radius Matching</span>
        </div>

        {nearbyAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">No Unclaimed Incidents Nearby</p>
            <p className="text-xs text-slate-500">
              You will receive immediate alerts whenever a community emergency or fall is detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyAlerts.map((alert) => {
              const isSensor = alert.source === 'SMARTWATCH_SENSOR';

              return (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-lg hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isSensor
                            ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300'
                            : 'bg-red-950/60 border border-red-500/30 text-red-300'
                        }`}
                      >
                        {isSensor ? 'SMARTWATCH ACCIDENT SENSOR' : 'MANUAL SOS ALERT'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-2">
                        {alert.detectionReason || 'Urgent Medical Attention Required'}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Patient:{' '}
                    <span className="font-semibold text-slate-200">
                      {alert.patientName || 'Nearby Citizen'}
                    </span>
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Location: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleClaimAlert(alert.id)}
                      className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
                    >
                      Accept Assignment
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineAlert(alert.id)}
                      className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Responder Verification & Skills Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Volunteer Credentials & Verified Skills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Organization</span>
            <span className="font-bold text-white">{responder?.organization || 'VVIT NSS Unit'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Certifications</span>
            <span className="font-bold text-white">
              {responder?.certificateDetails || 'CPR Certified (Red Cross), Advanced First Aid'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Skills</span>
            <span className="font-bold text-white">{responder?.skills || 'CPR, Defibrillator, BLS'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
