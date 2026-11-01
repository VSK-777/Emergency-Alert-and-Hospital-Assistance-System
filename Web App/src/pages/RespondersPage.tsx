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
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-emerald-400" />
            Community First Responders & Volunteer Grid
          </h2>
          <p className="text-xs text-slate-400">
            Certified NSS, NCC, and Red Cross student volunteers for immediate bystander intervention
          </p>
        </div>

        {/* Rapid Match Bar */}
        {activeIncidents.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-2 text-xs">
            <span className="text-red-300 font-bold flex items-center gap-1">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Target Emergency:
            </span>
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="rounded-lg border border-red-500/40 bg-slate-900 px-2.5 py-1 text-xs text-white focus:outline-none"
            >
              {activeIncidents.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id} ({i.patientName || 'Victim'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Responders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responders.map((resp) => {
          const skillsList = resp.skills.split(',').map((s) => s.trim());

          return (
            <div
              key={resp.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 font-black">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{resp.name}</h3>
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {resp.specialization}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      resp.isAvailable
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        resp.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                    {resp.isAvailable ? 'ON-CALL' : 'STANDBY'}
                  </span>
                </div>

                {/* Contact and Coordinates */}
                <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <p className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    {resp.phoneNumber || '+91 98765 43211'}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    GPS: {resp.latitude?.toFixed(4)}, {resp.longitude?.toFixed(4)} (Nambur Area)
                  </p>
                </div>

                {/* Skills Badges */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Certified Life-Support Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((skill, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleToggleAvailability(resp)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all ${
                    resp.isAvailable
                      ? 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700'
                      : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40'
                  }`}
                >
                  {resp.isAvailable ? 'Set Standby' : 'Set Available'}
                </button>

                {activeIncidents.length > 0 && resp.isAvailable && (
                  <button
                    onClick={() => handleDispatchResponder(resp.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/30"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Dispatch
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
