import api from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  phoneLogin: async (payload: { phoneNumber?: string; verificationToken?: string; fullName?: string; user_json_url?: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/phone-login', payload);
    return response.data;
  },

  verifyPhoneEmail: async (userJsonUrl: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/phone-email/verify', { user_json_url: userJsonUrl });
    return response.data;
  },

  sendOtp: async (phoneNumber: string): Promise<{ success: boolean; message: string; phoneNumber: string; expiresInSeconds: number; devOtp?: string }> => {
    const response = await api.post('/auth/send-otp', { phoneNumber });
    return response.data;
  },

  verifyOtp: async (payload: { phoneNumber: string; otp: string; fullName?: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-otp', payload);
    return response.data;
  },

  register: async (userData: Partial<User> & { password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/users/profile', userData);
    return response.data;
  },
};
