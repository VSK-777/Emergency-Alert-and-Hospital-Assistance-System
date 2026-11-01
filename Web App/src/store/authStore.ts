import { create } from 'zustand';
import type { User, UserRole, AuthResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('vvit_csp_token'),
  isAuthenticated: !!localStorage.getItem('vvit_csp_token'),
  isLoading: false,
  error: null,

  login: async (email: string, password = 'Password@123') => {
    set({ isLoading: true, error: null });
    try {
      const response: AuthResponse = await authApi.login(email, password);
      const user: User = {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        phoneNumber: response.phoneNumber,
        role: response.role,
      };

      localStorage.setItem('vvit_csp_token', response.token);
      localStorage.setItem('vvit_csp_user', JSON.stringify(user));

      set({
        user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please verify your email and password.';
      set({ error: msg, isLoading: false, isAuthenticated: false });
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
