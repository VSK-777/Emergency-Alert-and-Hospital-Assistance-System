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
  Phone,
  Lock,
  Radio,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [medicalConditions, setMedicalConditions] = useState(user?.medicalConditions || '');

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setBloodGroup(user.bloodGroup || '');
      setAllergies(user.allergies || '');
      setMedicalConditions(user.medicalConditions || '');
    }
  }, [user]);

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

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
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Profile Configuration & Account Parameters
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personal emergency medical parameters, contact details, and institutional project dossier
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Profile Form */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Medical Profile</h3>
            </div>
            {user && <Badge status={user.role} variant="role" />}
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {savedFeedback && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Profile parameters saved and synchronized successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Mobile Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="">Not provided</option>
                  <option value="A+">A+ (A Positive)</option>
                  <option value="A-">A- (A Negative)</option>
                  <option value="B+">B+ (B Positive)</option>
                  <option value="B-">B- (B Negative)</option>
                  <option value="AB+">AB+ (AB Positive)</option>
                  <option value="AB-">AB- (AB Negative)</option>
                  <option value="O+">O+ (O Positive)</option>
                  <option value="O-">O- (O Negative)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Known Drug & Food Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, Sulfa"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pre-existing Chronic Medical Conditions
              </label>
              <textarea
                rows={2}
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="e.g. Asthma, Diabetes, Hypertension"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Emergency Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Project Dossier & Accreditation */}
        <div className="lg:col-span-5 space-y-4">
          {/* Official Project Dossier */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3.5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 font-bold">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Emergency Alert and Hospital Assistance System
                </h4>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Community Service Project (CSP)</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400">Institution:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Vasireddy Venkatadri Institute of Technology (VVIT)</strong>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Computer Science and Engineering</strong>
              </div>
              <div>
                <span className="text-slate-400">Batch:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Batch 8 (Community Service Project)</strong>
              </div>
              <div>
                <span className="text-slate-400">Prepared By:</span>{' '}
                <strong className="text-blue-600 dark:text-blue-400 font-bold">VSK (Reg. No: 24BQ1A054O)</strong>
              </div>
              <div>
                <span className="text-slate-400">Project Guide:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Mr. G. Lakshmi Narayana</strong>{' '}
                <span className="text-slate-500">(Assistant Professor)</span>
              </div>
            </div>
          </div>

          {/* Admin Diagnostics Grid (Restricted to System Admins Only) */}
          {isAdmin && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3 text-xs transition-colors">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Administrative System & Telemetry Grid
              </h4>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Cloud Shared Backend:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Online (Render / Spring Boot)</span>
                </div>
                <div className="flex justify-between">
                  <span>Real-Time Broadcast:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Server-Sent Events (SSE)</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Clinical Engine:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">Gemini 1.5 Flash</span>
                </div>
                <div className="flex justify-between">
                  <span>Companion Watch Client:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Wear OS (50Hz IMU)</span>
                </div>
                <div className="flex justify-between">
                  <span>Mobile Companion App:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Flutter + Dart</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
