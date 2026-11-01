import React, { useState } from 'react';
import { aiApi } from '../api/ai';
import type { AiTriageResponse } from '../types';
import { Badge } from '../components/common/Badge';
import {
  Sparkles,
  HeartPulse,
  AlertTriangle,
  Stethoscope,
  Copy,
  Printer,
  Check,
  Send,
  Building2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

export const AiTriagePage: React.FC = () => {
  const [symptoms, setSymptoms] = useState(
    'Patient suffered high-velocity motorcycle impact. G-force 3.85G registered on Wear OS watch. Unresponsive with irregular pulse.'
  );
  const [emergencyType, setEmergencyType] = useState('FALL_IMPACT');
  const [patientProfile, setPatientProfile] = useState(
    'Age 21, Male, Blood Group: O+, Allergies: Penicillin, History: Mild Asthma'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiTriageResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await aiApi.generateTriage({
        query: symptoms,
        emergencyType,
        patientMedicalNotes: patientProfile,
      });
      setResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `
EMERGENCY MEDICAL HANDOFF DOSSIER
==============================================
Institution: Vasireddy Venkatadri Institute of Technology (VVIT) CSP
Emergency Alert and Hospital Assistance System
Prepared By: VSK · Guide: Mr. G. Lakshmi Narayana

TRIAGE ASSESSMENT: ${result.triageLevel}
AI Source: ${result.providerSource}
Evaluation Timestamp: ${new Date().toLocaleString()}

PATIENT PROFILE:
${patientProfile}

INCIDENT SUMMARY & CLINICAL NOTES:
${result.summary}

IMMEDIATE FIRST-AID / RESPONDER PROTOCOLS:
${result.immediateActionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

HOSPITAL TRAUMA UNIT PREPARATION:
${result.hospitalPrepRecommendations.map((p, i) => `[ ] ${p}`).join('\n')}
==============================================
`.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Gemini AI Clinical Triage & Handoff Assistant
          </h2>
          <p className="text-xs text-slate-400">
            Intelligent severity triage, first-responder protocol generator, and emergency department preparation reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Form */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-purple-400" />
            Emergency Incident Parameters
          </h3>

          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Emergency Type / Mechanism
              </label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="FALL_IMPACT">High-Impact Fall / Accident (Smartwatch IMU)</option>
                <option value="MOBILE_SOS">Manual Distress SOS (Mobile App)</option>
                <option value="CARDIAC_DISTRESS">Suspected Cardiac Event / Loss of Consciousness</option>
                <option value="ROAD_ACCIDENT">Vehicular Collision / Trauma</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Patient Medical Profile & Known Conditions
              </label>
              <textarea
                rows={2}
                value={patientProfile}
                onChange={(e) => setPatientProfile(e.target.value)}
                placeholder="Age, blood group, allergies, pre-existing illnesses..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Clinical Symptoms & Biomechanical Observations
              </label>
              <textarea
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe victim vitals, trauma evidence, sensor impact G-force..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              {isLoading ? 'Running Gemini AI Clinical Triage...' : 'Generate AI Triage Evaluation'}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          {result ? (
            <div className="space-y-4">
              {/* Triage Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-500/30 bg-purple-950/30 p-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                    Assessed Triage Priority
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge status={result.triageLevel} variant="triage" />
                    <span className="text-xs text-slate-300 font-mono">
                      Source: {result.providerSource}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy Dossier'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                </div>
              </div>

              {/* Clinical Summary */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 text-rose-400" />
                  Clinical Evaluation Summary
                </span>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{result.summary}</p>
              </div>

              {/* Responder Protocol */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Immediate Bystander & Volunteer Action Steps
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.immediateActionSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hospital Trauma Preparation Checklist */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-sky-400" />
                  Hospital Receiving & Trauma Unit Checklist
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.hospitalPrepRecommendations.map((prep, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FileCheck className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>{prep}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center p-8">
              <div className="rounded-full bg-purple-500/10 p-4 text-purple-400 mb-3 ring-1 ring-purple-500/20">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-white">AI Clinical Triage Ready</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Provide the incident parameters and click &quot;Generate AI Triage Evaluation&quot; to synthesize
                first-aid steps and hospital trauma preparations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
