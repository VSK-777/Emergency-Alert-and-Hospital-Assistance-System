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
  ArrowRight,
} from 'lucide-react';
import { responderApi } from '../api/responders';
import { useAuthStore } from '../store/authStore';
import type { Responder, EmergencyIncident } from '../types';
import { Badge } from '../components/common/Badge';

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
      setActionSuccess('Emergency mission claimed! Proceed to the incident location.');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.fullName || 'First Responder'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                {responder?.verificationStatus || 'VERIFIED VOLUNTEER'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{responder?.organization || 'VVIT NSS Unit Volunteer'}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span>{responder?.specialization || 'Community Emergency First Responder'}</span>
            </p>
          </div>
        </div>

        {/* Live Availability Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAvailable ? 'Status: AVAILABLE' : 'Status: OFF-DUTY'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAvailable ? 'Receiving emergency alerts' : 'No alerts dispatched'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAvailability}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isAvailable ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isAvailable ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            onClick={fetchResponderData}
            title="Refresh"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Active Assignment (if in progress) */}
      {activeAssignment && (
        <div className="rounded-2xl border-2 border-emerald-500/50 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5 transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                ACTIVE RESCUE ASSIGNMENT
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {activeAssignment.patientName || 'Emergency Patient in Distress'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Reason: {activeAssignment.detectionReason || 'Critical incident reported'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${responder?.latitude || 16.352},${responder?.longitude || 80.524};${activeAssignment.latitude},${activeAssignment.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Navigate to Patient</span>
              </a>
            </div>
          </div>

          {/* Patient Quick Clinical Snapshot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">Blood Group</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {activeAssignment.bloodGroup || 'O+'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Allergies</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {activeAssignment.allergies || 'None recorded'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Pre-existing Conditions</span>
              <span className="text-slate-800 dark:text-slate-200">
                {activeAssignment.medicalConditions || 'Asthma (Mild)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Emergency Phone</span>
              <a
                href={`tel:${activeAssignment.patientPhone || '+919876543210'}`}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Phone className="h-3 w-3" />
                {activeAssignment.patientPhone || '+91 98765 43210'}
              </a>
            </div>
          </div>

          {/* Interactive Milestone Action Pipeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mission Lifecycle Progress
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {stages.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;
                return (
                  <button
                    key={stage.code}
                    onClick={() => handleUpdateMissionStatus(stage.code)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                        : isPassed
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] opacity-75">Step {idx + 1}</span>
                      <span className="text-xs font-bold leading-tight">{stage.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Nearby Emergency Dispatch Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
              Eligible Nearby Emergency Incidents ({nearbyAlerts.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Incidents within your community radius awaiting first-aid response
            </p>
          </div>
        </div>

        {nearbyAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              No unclaimed emergency incidents in your immediate vicinity. Standing by on live grid.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      #{alert.id.substring(0, 10)}
                    </span>
                    <Badge status={alert.source} variant="source" className="ml-2" />
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{alert.detectionReason}</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Victim: <strong className="text-slate-800 dark:text-slate-200">{alert.patientName || 'Citizen User'}</strong> · Blood:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">{alert.bloodGroup || 'O+'}</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Within response perimeter
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClaimAlert(alert.id)}
                      className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                    >
                      Accept Assignment
                    </button>
                    <button
                      onClick={() => handleDeclineAlert(alert.id)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
