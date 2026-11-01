import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  Activity,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Building2,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import type { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, sendOtp, verifyOtp, register, isLoading, error } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Authentication Mode: Institutional / Email vs Citizen Phone
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Input states — initialized completely empty (No hardcoded credentials)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone Auth states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;
    setOtpError(null);
    setIsSendingOtp(true);
    try {
      const res = await sendOtp(phoneNumber.trim());
      setOtpSent(true);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
      setResendCooldown(30);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !otpCode.trim()) return;
    setOtpError(null);

    try {
      await verifyOtp(phoneNumber, otpCode.trim(), 'Citizen User');
      const user = useAuthStore.getState().user;
      if (user) {
        redirectByRole(user.role);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired OTP code.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cleanPhone = regPhone.trim();
    if (cleanPhone.includes('@')) {
      setRegError('Invalid Mobile Phone: An email address was entered into the phone number field. Please enter a valid phone number (e.g. +91 98765 43210).');
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setRegError('Invalid Mobile Phone: Please enter a valid phone number with 7-20 digits (e.g. +91 98765 43210).');
      return;
    }

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
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-xs">
            <Activity className="h-7 w-7" />
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
          {/* Method Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-5">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'email'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'phone'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Citizen Phone OTP</span>
            </button>
          </div>

          {/* Real Error Alert from Backend */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3.5 mb-4 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Form */}
          {authMethod === 'email' ? (
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
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
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
          ) : (
            /* Citizen Phone OTP Form */
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label htmlFor="loginPhone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Citizen Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="loginPhone"
                        name="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        required
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingOtp || !phoneNumber.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <span>{isSendingOtp ? 'Generating Security OTP...' : 'Request OTP Verification'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhone} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">Verification Code Dispatched</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        A 6-digit one-time password was issued for <span className="font-bold">{phoneNumber}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Sandbox Evaluation Helper */}
                  {devOtp && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          Sandbox / Evaluation OTP:
                        </span>
                        <span className="font-mono font-bold text-sm tracking-wider text-blue-900 dark:text-blue-100 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-700 shadow-2xs">
                          {devOtp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Carrier SMS Simulation Mode</span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(devOtp)}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                        >
                          Auto-fill Code
                        </button>
                      </div>
                    </div>
                  )}

                  {otpError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="loginOtp" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      6-Digit Security Code
                    </label>
                    <input
                      id="loginOtp"
                      name="otpCode"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 524103"
                      className="w-full text-center tracking-widest font-mono text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                      required
                      autoComplete="one-time-code"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setDevOtp(null);
                        setOtpError(null);
                        setOtpCode('');
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Change Number
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSendingOtp}
                      onClick={() => handleSendOtp()}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || otpCode.length !== 6}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <span>{isLoading ? 'Verifying...' : 'Verify & Sign In'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
                    pattern="^\+?[0-9\s\-()]{7,20}$"
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
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
