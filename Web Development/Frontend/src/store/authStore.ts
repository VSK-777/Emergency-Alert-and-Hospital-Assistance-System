import { create } from 'zustand';
import type { User, UserRole, AuthResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  phoneLogin: (phoneNumber: string, verificationToken?: string, fullName?: string) => Promise<void>;
  sendOtp: (phoneNumber: string) => Promise<{ success: boolean; message: string; devOtp?: string }>;
  verifyOtp: (phoneNumber: string, otp: string, fullName?: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const getStoredUser = (): User | null => {
  try {
    const item = localStorage.getItem('vvit_csp_user');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const extractAuthErrorMessage = (err: any, defaultMsg: string): string => {
  const status = err.response?.status;
  if (status === 502 || status === 503 || status === 504) {
    return `Backend service is temporarily restarting or deploying (HTTP ${status} Bad Gateway). Please wait ~30 seconds and retry.`;
  }
  if (!err.response) {
    return 'Unable to reach backend server. Please verify your connection or wait for cloud service to finish starting.';
  }
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  return defaultMsg;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('vvit_csp_token'),
  isAuthenticated: !!localStorage.getItem('vvit_csp_token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response: AuthResponse = await authApi.login(email.trim(), password);
      localStorage.setItem('vvit_csp_token', response.token);

      let user: User = {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        phoneNumber: response.phoneNumber,
        role: response.role,
      };

      try {
        const fullProfile = await authApi.getProfile();
        user = { ...user, ...fullProfile };
      } catch {
        // Fallback to base user if profile endpoint fails
      }

      localStorage.setItem('vvit_csp_user', JSON.stringify(user));

      set({
        user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const msg = extractAuthErrorMessage(err, 'Invalid email or password credentials.');
      set({ error: msg, isLoading: false, isAuthenticated: false });
      throw new Error(msg);
    }
  },

  phoneLogin: async (phoneNumber: string, verificationToken = 'VERIFIED_OTP', fullName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response: AuthResponse = await authApi.phoneLogin({
        phoneNumber: phoneNumber.trim(),
        verificationToken,
        fullName,
      });
      localStorage.setItem('vvit_csp_token', response.token);

      let user: User = {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        phoneNumber: response.phoneNumber,
        role: response.role,
      };

      try {
        const fullProfile = await authApi.getProfile();
        user = { ...user, ...fullProfile };
      } catch {
        // Fallback to base user
      }

      localStorage.setItem('vvit_csp_user', JSON.stringify(user));

      set({
        user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const msg = extractAuthErrorMessage(err, 'Phone verification failed.');
      set({ error: msg, isLoading: false, isAuthenticated: false });
      throw new Error(msg);
    }
  },

  sendOtp: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.sendOtp(phoneNumber.trim());
      set({ isLoading: false });
      return { success: res.success, message: res.message, devOtp: res.devOtp };
    } catch (err: any) {
      const msg = extractAuthErrorMessage(err, 'Failed to dispatch OTP.');
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  verifyOtp: async (phoneNumber: string, otp: string, fullName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response: AuthResponse = await authApi.verifyOtp({
        phoneNumber: phoneNumber.trim(),
        otp: otp.trim(),
        fullName,
      });
      localStorage.setItem('vvit_csp_token', response.token);

      let user: User = {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        phoneNumber: response.phoneNumber,
        role: response.role,
      };

      try {
        const fullProfile = await authApi.getProfile();
        user = { ...user, ...fullProfile };
      } catch {
        // Fallback to base user
      }

      localStorage.setItem('vvit_csp_user', JSON.stringify(user));

      set({
        user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const msg = extractAuthErrorMessage(err, 'Invalid OTP code.');
      set({ error: msg, isLoading: false, isAuthenticated: false });
      throw new Error(msg);
    }
  },

  register: async (userData: Partial<User> & { password: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response: AuthResponse = await authApi.register(userData);
      localStorage.setItem('vvit_csp_token', response.token);

      let user: User = {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        phoneNumber: response.phoneNumber,
        role: response.role,
        bloodGroup: userData.bloodGroup,
        allergies: userData.allergies,
        medicalConditions: userData.medicalConditions,
      };

      try {
        const fullProfile = await authApi.getProfile();
        user = { ...user, ...fullProfile };
      } catch {
        // Fallback
      }

      localStorage.setItem('vvit_csp_user', JSON.stringify(user));

      set({
        user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      let msg = extractAuthErrorMessage(err, 'Registration failed.');
      if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
        const fieldErrors = Object.entries(err.response.data.errors)
          .map(([field, errText]) => `${field}: ${errText}`)
          .join(', ');
        if (fieldErrors) {
          msg = `${msg} (${fieldErrors})`;
        }
      }
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  updateProfile: async (userData: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await authApi.updateProfile(userData);
      const currentUser = get().user;
      const mergedUser = { ...currentUser, ...updated };
      localStorage.setItem('vvit_csp_user', JSON.stringify(mergedUser));
      set({ user: mergedUser, isLoading: false });
      return mergedUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('vvit_csp_token');
    localStorage.removeItem('vvit_csp_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  setUser: (user: User) => {
    localStorage.setItem('vvit_csp_user', JSON.stringify(user));
    set({ user });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('vvit_csp_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const profile = await authApi.getProfile();
      localStorage.setItem('vvit_csp_user', JSON.stringify(profile));
      set({ user: profile, isAuthenticated: true });
    } catch {
      // If token expired
      localStorage.removeItem('vvit_csp_token');
      localStorage.removeItem('vvit_csp_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  hasRole: (roles: UserRole | UserRole[]) => {
    const currentRole = get().user?.role;
    if (!currentRole) return false;
    if (Array.isArray(roles)) {
      return roles.includes(currentRole);
    }
    return currentRole === roles;
  },
}));
