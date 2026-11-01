import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
} from 'lucide-react';
import type { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, phoneLogin, register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // Authentication Mode: Institutional / Email vs Citizen Phone
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Input states — initialized completely empty (No hardcoded or pre-filled passwords)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone Auth states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Registration Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('CITIZEN');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setOtpSent(true);
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    try {
      await phoneLogin(phoneNumber, otpCode || 'VERIFIED_OTP', 'Citizen User');
      const user = useAuthStore.getState().user;
      if (user) {
        redirectByRole(user.role);
      } else {
        navigate('/');
      }
    } catch {
      // Error handled by store
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    try {
      await register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phoneNumber: regPhone.trim(),
        password: regPassword,
        role: regRole,
        bloodGroup: regBloodGroup,
        allergies: regAllergies.trim(),
        medicalConditions: regConditions.trim(),
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl shadow-red-600/30 text-white font-black">
            <Activity className="h-7 w-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Emergency Alert & Hospital Assistance
          </h1>
          <p className="text-xs text-slate-400">
            Vasireddy Venkatadri Institute of Technology (VVIT) · Dept of CSE
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-950/30 px-3 py-1 text-[11px] font-semibold text-red-300">
            <span>Community Service Project</span>
            <span className="text-slate-500">·</span>
            <span>Prepared by VSK</span>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
          {/* Method Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800/80">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'email'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
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
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Citizen Phone OTP</span>
            </button>
          </div>

          {/* Real Error Alert from Backend */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 mb-4 text-xs text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Form */}
          {authMethod === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none transition-colors"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none transition-colors"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-rose-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  'Verifying Credentials...'
                ) : (
                  <>
                    <span>Sign In to System</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Phone OTP Form */
            <form onSubmit={!otpSent ? handleSendOtp : handleVerifyPhone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number (India)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={otpSent}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none text-center tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-rose-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  'Verifying Phone OTP...'
                ) : otpSent ? (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <span>Send OTP via Phone.email</span>
                )}
              </button>
            </form>
          )}

          {/* Registration Trigger */}
          <div className="mt-5 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              New to Emergency Grid?{' '}
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="font-semibold text-red-400 hover:text-red-300 hover:underline inline-flex items-center gap-1"
              >
                <span>Create an Account</span>
              </button>
            </p>
          </div>
        </div>

        {/* Institutional Governance Notice */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-center text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-1 text-slate-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Role-Based Access Controlled</span>
          </div>
          <p>
            System Administrator, Hospital Staff, and First Responder privileges require institutional validation.
          </p>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-red-400" />
                <h3 className="text-base font-bold text-white">Create Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {regSuccess ? (
              <div className="py-8 text-center space-y-2">
                <ShieldCheck className="h-12 w-12 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Account Created Successfully!</p>
                <p className="text-xs text-slate-400">Redirecting to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3.5">
                {regError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{regError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Account Category
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="CITIZEN">Citizen / Patient</option>
                    <option value="RESPONDER">Community Volunteer / Responder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                    required
                    minLength={6}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={regBloodGroup}
                      onChange={(e) => setRegBloodGroup(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Known Allergies (Optional)
                    </label>
                    <input
                      type="text"
                      value={regAllergies}
                      onChange={(e) => setRegAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Existing Medical Conditions (Optional)
                  </label>
                  <input
                    type="text"
                    value={regConditions}
                    onChange={(e) => setRegConditions(e.target.value)}
                    placeholder="e.g. Diabetes, Asthma"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-rose-500 transition-all cursor-pointer"
                >
                  {isLoading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
