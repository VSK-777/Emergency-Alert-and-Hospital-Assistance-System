import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { BrandIcon } from '../components/common/BrandIcon';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import type { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, register, isLoading, error } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Input states — initialized completely empty (No hardcoded credentials)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('CITIZEN');
  const [regBloodGroup, setRegBloodGroup] = useState('');
  const [regAllergies, setRegAllergies] = useState('');
  const [regConditions, setRegConditions] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'HOSPITAL_STAFF':
        navigate('/hospital');
        break;
      case 'RESPONDER':
        navigate('/responder');
        break;
      case 'CITIZEN':
      default:
        navigate('/citizen');
        break;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    try {
      await login(email.trim(), password);
      const user = useAuthStore.getState().user;
      if (user) {
        redirectByRole(user.role);
      } else {
        navigate('/');
      }
    } catch {
      // Error displayed in UI via authStore
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) return;
    setRegError(null);

    const cleanPhone = regPhone.trim();
    if (cleanPhone.includes('@')) {
      setRegError('Invalid Mobile Phone: An email address was entered into the phone number field. Please enter a valid phone number (e.g. +91 98765 43210).');
      return;
    }

    const phoneRegex = /^\+?[0-9\s\(\)\-]{7,20}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setRegError('Invalid Mobile Phone: Please enter a valid phone number with 7-20 digits (e.g. +91 98765 43210).');
      return;
    }

    setIsRegistering(true);
    try {
      await register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phoneNumber: cleanPhone,
        password: regPassword,
        role: regRole,
        bloodGroup: regBloodGroup.trim() || undefined,
        allergies: regAllergies.trim() || undefined,
        medicalConditions: regConditions.trim() || undefined,
      });
      setRegSuccess(true);
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccess(false);
        const user = useAuthStore.getState().user;
        if (user) redirectByRole(user.role);
      }, 1200);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] dark:bg-slate-950 p-4 relative overflow-hidden transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 transition-colors"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      <div className="relative w-full max-w-md space-y-6 my-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center">
            <BrandIcon size={64} variant="container" withGlow />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Emergency Alert and Hospital Assistance System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vasireddy Venkatadri Institute of Technology (VVIT) · Dept. of CSE
          </p>
        </div>

        {/* Authentication Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
          {/* Real Error Alert from Backend */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3.5 mb-4 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Sign In Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="loginEmail" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="loginEmail"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) useAuthStore.setState({ error: null });
                  }}
                  placeholder="Enter your registered email"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="loginPassword" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="loginPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) useAuthStore.setState({ error: null });
                  }}
                  placeholder="Enter account password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{isLoading ? 'Authenticating with Backend...' : 'Sign In to Emergency Grid'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Registration Trigger */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New citizen or volunteer?{' '}
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Register Emergency Profile
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create Emergency Medical Account
                </h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {regError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 mb-4">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Account created successfully! Logging you in...</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="regFullName" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="regFullName"
                  name="fullName"
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Sai Krishna VSK"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="regEmail" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="regEmail"
                    name="email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@vvit.net"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="regPhone" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="regPhone"
                    name="phoneNumber"
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    maxLength={20}
                    pattern="^\+?[0-9\s\(\)\-]{7,20}$"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="regPassword" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="regPassword"
                    name="password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label htmlFor="regRole" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="regRole"
                    name="role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="CITIZEN">Citizen / Patient</option>
                    <option value="RESPONDER">First Responder / Volunteer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="regBloodGroup" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group <span className="text-[10px] font-normal text-slate-500">(Optional)</span>
                  </label>
                  <select
                    id="regBloodGroup"
                    name="bloodGroup"
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="">Select Blood Group (Optional / Unknown)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="O-">O- (O Negative)</option>
                    <option value="A+">A+ (A Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="regAllergies" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Known Allergies <span className="text-[10px] font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    id="regAllergies"
                    name="allergies"
                    type="text"
                    value={regAllergies}
                    onChange={(e) => setRegAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="regConditions" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chronic Conditions <span className="text-[10px] font-normal text-slate-500">(Optional)</span>
                </label>
                <input
                  id="regConditions"
                  name="medicalConditions"
                  type="text"
                  value={regConditions}
                  onChange={(e) => setRegConditions(e.target.value)}
                  placeholder="e.g. Asthma, Hypertension, Diabetes"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isRegistering ? 'Registering...' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
