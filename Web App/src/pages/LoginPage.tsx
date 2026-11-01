import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Activity,
  ShieldCheck,
  Building2,
  HeartHandshake,
  User,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@vvit.net');
  const [password, setPassword] = useState('Password@123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error handled by store
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    try {
      await login(demoEmail, 'Password@123');
      navigate('/');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Header branding */}
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
          <div className="inline-block rounded-full border border-red-500/20 bg-red-950/30 px-3 py-1 text-[11px] font-semibold text-red-300">
            Community Service Project · Prepared by VSK
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vvit.net"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                  required
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-rose-500 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                'Authenticating...'
              ) : (
                <>
                  <span>Sign In to Emergency Grid</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase text-center mb-3">
              Quick 1-Click Role Demonstrator
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@vvit.net')}
                className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/20 p-2.5 text-left hover:border-purple-500/50 hover:bg-purple-950/40 transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">System Admin</p>
                  <p className="text-[10px] text-slate-400 truncate">admin@vvit.net</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hospital.admin@aiims.edu.in')}
                className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-950/20 p-2.5 text-left hover:border-sky-500/50 hover:bg-sky-950/40 transition-all"
              >
                <Building2 className="h-4 w-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Hospital Staff</p>
                  <p className="text-[10px] text-slate-400 truncate">AIIMS Mangalagiri</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('responder@vvit.net')}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-left hover:border-emerald-500/50 hover:bg-emerald-950/40 transition-all"
              >
                <HeartHandshake className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">First Responder</p>
                  <p className="text-[10px] text-slate-400 truncate">NSS Volunteer</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('patient.vsk@vvit.net')}
                className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-2.5 text-left hover:border-amber-500/50 hover:bg-amber-950/40 transition-all"
              >
                <User className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Citizen / Patient</p>
                  <p className="text-[10px] text-slate-400 truncate">Sai Krishna VSK</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer project credentials */}
        <div className="text-center text-[11px] text-slate-500">
          <p>Project Guide: Mr. G. Lakshmi Narayana, Assistant Professor</p>
          <p className="mt-0.5">Department of Computer Science & Engineering · VVIT Guntur</p>
        </div>
      </div>
    </div>
  );
};
