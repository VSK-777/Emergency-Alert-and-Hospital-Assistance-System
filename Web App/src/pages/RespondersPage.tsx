import React, { useEffect, useState } from 'react';
import { responderApi } from '../api/responders';
import { useEmergencyStore } from '../store/emergencyStore';
import type { Responder } from '../types';
import {
  HeartHandshake,
  ShieldCheck,
  Phone,
  MapPin,
  Award,
  Radio,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
  RefreshCw,
} from 'lucide-react';

export const RespondersPage: React.FC = () => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const { activeIncidents, updateStatus } = useEmergencyStore();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');

  const loadResponders = () => {
    responderApi.getResponders().then(setResponders);
  };

  useEffect(() => {
    loadResponders();
    if (activeIncidents.length > 0) {
      setSelectedIncidentId(activeIncidents[0].id);
    }
  }, [activeIncidents]);

  const handleToggleAvailability = async (r: Responder) => {
    try {
      await responderApi.updateAvailability(!r.isAvailable, r.latitude, r.longitude);
      loadResponders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispatchResponder = async (responderId: number) => {
    if (!selectedIncidentId) return;
    try {
      await updateStatus(selectedIncidentId, 'DISPATCHED', undefined, responderId);
      loadResponders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Community First Responders & Volunteer Grid
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Certified NSS, NCC, and Red Cross student volunteers for immediate bystander intervention
          </p>
        </div>

        {/* Rapid Match Bar */}
        {activeIncidents.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-2 text-xs">
            <span className="text-red-700 dark:text-red-300 font-bold flex items-center gap-1">
              <Radio className="h-3.5 w-3.5 animate-pulse text-red-600" />
              Target Alert:
            </span>
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {activeIncidents.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id.slice(0, 8)} ({i.patientName || 'Victim'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Responders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {responders.map((resp) => {
          const skillsList = resp.skills.split(',').map((s) => s.trim());

          return (
            <div
              key={resp.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-bold">
                      <HeartHandshake className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {resp.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {resp.organization || 'VVIT Volunteer'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      resp.isAvailable
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {resp.isAvailable ? 'ON CALL' : 'OFF DUTY'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specialization:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{resp.specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Direct Phone:</span>
                    <a href={`tel:${resp.phoneNumber}`} className="text-blue-600 font-mono hover:underline">
                      {resp.phoneNumber || '+91 98765 43211'}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verification:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {resp.verificationStatus || 'Verified Volunteer'}
                    </span>
                  </div>
                </div>

                {/* Skills Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleAvailability(resp)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
                >
                  {resp.isAvailable ? 'Set Off-Duty' : 'Set Available'}
                </button>

                {resp.isAvailable && activeIncidents.length > 0 && (
                  <button
                    onClick={() => handleDispatchResponder(resp.id)}
                    className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    Dispatch Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
