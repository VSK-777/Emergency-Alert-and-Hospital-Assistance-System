import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Badge } from '../components/common/Badge';
import {
  Settings,
  User,
  Heart,
  Shield,
  Save,
  CheckCircle2,
  Server,
  Sparkles,
  Watch,
  Activity,
  Award,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || 'Sai Krishna VSK');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '+91 98765 43210');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [allergies, setAllergies] = useState(user?.allergies || 'Penicillin');
  const [medicalConditions, setMedicalConditions] = useState(
    user?.medicalConditions || 'Asthma (Mild)'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedFeedback(false);

    try {
      const updated = await authApi.updateProfile({
        fullName,
        phoneNumber,
        bloodGroup,
        allergies,
        medicalConditions,
      });
      setUser(updated);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-400" />
          System Settings & Profile Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Personal emergency medical parameters and technical infrastructure overview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Profile Form */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-bold text-white">Emergency Medical Profile</h3>
            </div>
            {user && <Badge status={user.role} variant="role" />}
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {savedFeedback && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Profile and emergency clinical records saved successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ABO Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none font-bold"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Allergies & Sensitivities
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pre-existing Chronic Medical Conditions
              </label>
              <textarea
                rows={2}
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="e.g. Asthma, Diabetes, Hypertension"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving Changes...' : 'Save Emergency Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Project Dossier & Institutional Details */}
        <div className="lg:col-span-5 space-y-4">
          {/* Institutional Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 text-red-400 ring-1 ring-red-500/30 font-bold">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">
                  Emergency Alert and Hospital Assistance System
                </h4>
                <p className="text-[11px] text-red-400 font-semibold">Community Service Project (CSP)</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-500">Institution:</span>{' '}
                <strong className="text-white">Vasireddy Venkatadri Institute of Technology (VVIT)</strong>
              </div>
              <div>
                <span className="text-slate-500">Department:</span>{' '}
                <strong className="text-white">Computer Science and Engineering</strong>
              </div>
              <div>
                <span className="text-slate-500">Batch:</span>{' '}
                <strong className="text-white">Batch 8 (Community Service Project)</strong>
              </div>
              <div>
                <span className="text-slate-500">Prepared By:</span>{' '}
                <strong className="text-red-400">VSK</strong>
              </div>
              <div>
                <span className="text-slate-500">Project Guide:</span>{' '}
                <strong className="text-white">Mr. G. Lakshmi Narayana</strong>{' '}
                <span className="text-slate-400">(Assistant Professor)</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-3 text-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-sky-400" />
              Infrastructure & Runtime Grid
            </h4>

            <div className="space-y-2 pt-1 border-t border-slate-800 text-slate-400">
              <div className="flex justify-between">
                <span>Shared Backend Server:</span>
                <span className="text-emerald-400 font-mono font-bold">Online (Port 8080)</span>
              </div>
              <div className="flex justify-between">
                <span>Real-Time Broadcast:</span>
                <span className="text-emerald-400 font-mono font-bold">Server-Sent Events (SSE)</span>
              </div>
              <div className="flex justify-between">
                <span>AI Clinical Triage Engine:</span>
                <span className="text-purple-400 font-mono font-bold">Gemini 1.5 Flash (Cloud + Fallback)</span>
              </div>
              <div className="flex justify-between">
                <span>Wear OS Companion Watch:</span>
                <span className="text-emerald-400 font-mono font-bold">Wear OS Round (50Hz IMU)</span>
              </div>
              <div className="flex justify-between">
                <span>Persistence Layer:</span>
                <span className="text-sky-400 font-mono">H2 (MySQL Mode) / JPA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
