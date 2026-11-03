import React, { useState } from 'react';
import { aiApi } from '../api/ai';
import { useAuthStore } from '../store/authStore';
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
  ShieldCheck,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const AiTriagePage: React.FC = () => {
  const { user } = useAuthStore();
  const isCitizen = user?.role === 'CITIZEN';

  // Form states
  const [symptoms, setSymptoms] = useState('');
  const [emergencyType, setEmergencyType] = useState('FALL_IMPACT');
  const [patientProfile, setPatientProfile] = useState(
    `Blood Group: ${user?.bloodGroup || 'O+'}, Allergies: ${user?.allergies || 'None'}, History: ${
      user?.medicalConditions || 'Healthy'
    }`
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiTriageResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setIsLoading(true);
    try {
      const response = await aiApi.generateTriage({
        query: symptoms.trim(),
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

TRIAGE ASSESSMENT: ${result.triageLevel}
AI Engine: ${result.providerSource}
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

  // CITIZEN VIEW: Friendly First-Aid Assistant
  if (isCitizen) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              AI Emergency & First-Aid Assistant
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immediate safety guidance, CPR assistance, and first-responder recommendations
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Emergency Guidance Ready</span>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Safety Notice:</strong> This AI assistant provides immediate first-aid guidance for emergencies. If someone is unconscious, bleeding profusely, or having difficulty breathing, call emergency services immediately or press the red <strong>DISPATCH SOS</strong> button.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-red-600 dark:text-red-400" />
              Describe the Emergency Condition
            </h3>

            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Category
                </label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="FALL_IMPACT">Accident Fall / Impact</option>
                  <option value="BLEEDING">Severe Bleeding / Cut</option>
                  <option value="FRACTURE">Suspected Fracture / Bone Injury</option>
                  <option value="BURNS">Heat Burns / Scalds</option>
                  <option value="BREATHING_DISTRESS">Breathing Difficulty / Asthma Attack</option>
                  <option value="CHOKING">Choking / Airway Obstruction</option>
                  <option value="CARDIAC_DISTRESS">Chest Pain / Unresponsiveness</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What is happening right now?
                </label>
                <textarea
                  rows={4}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Person slipped and fell, cannot stand up on left leg, complaining of intense knee pain but fully conscious."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">Common emergency presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmergencyType('BLEEDING');
                      setSymptoms('Deep laceration on forearm from broken glass, active bleeding, person is seated and conscious.');
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Deep Bleeding
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmergencyType('BURNS');
                      setSymptoms('Hot oil burn on hands, skin is red and blistering, urgent cooling advice needed.');
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Heat Burn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmergencyType('CHOKING');
                      setSymptoms('Adult person is choking on food, unable to speak or cough effectively, clutching throat.');
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Choking Adult
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isLoading ? 'Analyzing Safety Guidelines...' : 'Get Immediate First-Aid Steps'}</span>
              </button>
            </form>
          </div>

          {/* Result Output */}
          <div className="lg:col-span-7 space-y-4">
            {result ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Triage Severity:</span>
                    <Badge status={result.triageLevel} variant="triage" />
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-full">
                    {result.providerSource}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Situation Assessment
                  </h4>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Immediate Step-by-Step Actions
                  </h4>
                  <div className="space-y-2">
                    {result.immediateActionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-normal">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>AI First-Aid Guidance is provided for immediate stabilization and does not replace medical diagnosis.</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900 h-full flex flex-col items-center justify-center">
                <div className="rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 p-4 mb-3 border border-purple-200 dark:border-purple-800/40">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Guidance Ready</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Select an emergency category or describe symptoms on the left to receive immediate, structured first-aid guidance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // CLINICAL VIEW FOR ADMIN / HOSPITAL STAFF
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Gemini AI Clinical Triage & Handoff Assistant
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intelligent severity triage, first-responder protocol generator, and emergency department preparation reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Form */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-purple-600" />
            Clinical Intake Parameters
          </h3>

          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Category
              </label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="FALL_IMPACT">Wear OS Sensor Accident Impact</option>
                <option value="TRAUMA_VEHICULAR">High Velocity Collision</option>
                <option value="CARDIAC_ARREST">Cardiac Arrest / Arrhythmia</option>
                <option value="SEVERE_RESPIRATORY">Respiratory Distress / Anaphylaxis</option>
                <option value="NEUROLOGICAL_STROKE">Suspected Acute Stroke / Seizure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Observation & Symptoms
              </label>
              <textarea
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Enter verified telemetry observations, victim consciousness, pulse rate, bleeding severity..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Patient Medical Profile Notes
              </label>
              <input
                type="text"
                value={patientProfile}
                onChange={(e) => setPatientProfile(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isLoading ? 'Running Gemini Clinical Evaluation...' : 'Generate Clinical Handoff Dossier'}</span>
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Assessment:</span>
                  <Badge status={result.triageLevel} variant="triage" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-full">
                    {result.providerSource}
                  </span>
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Dossier'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Executive Clinical Summary
                </h4>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {result.immediateActionSteps.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Immediate First-Responder Protocols
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {result.immediateActionSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-purple-600 shrink-0">{idx + 1}.</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.hospitalPrepRecommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Hospital Trauma Unit Recommendations
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {result.hospitalPrepRecommendations.map((prep, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-blue-900 dark:text-blue-200 font-medium">{prep}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900 h-full flex flex-col items-center justify-center">
              <div className="rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 p-4 mb-3 border border-purple-200 dark:border-purple-800/40">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Clinical Engine Standing By</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Enter emergency parameters to generate severity triage ratings and hospital trauma bay readiness dossiers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
