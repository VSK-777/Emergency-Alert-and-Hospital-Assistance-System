import api from './client';
import type { Responder } from '../types';

export const responderApi = {
  getResponders: async (latitude?: number, longitude?: number): Promise<Responder[]> => {
    const params = latitude && longitude ? { latitude, longitude } : {};
    const response = await api.get<Responder[]>('/responders', { params });
    return response.data;
  },

  updateAvailability: async (
    isAvailable: boolean,
    latitude?: number,
    longitude?: number
  ): Promise<Responder> => {
    const params: Record<string, any> = { isAvailable };
    if (latitude) params.latitude = latitude;
    if (longitude) params.longitude = longitude;
    const response = await api.put<Responder>('/responders/availability', null, { params });
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get('/responders/me');
    return response.data;
  },

  getNearbyEmergencies: async () => {
    const response = await api.get('/responders/nearby-emergencies');
    return response.data;
  },

  claimAssignment: async (incidentId: string) => {
    const response = await api.post(`/responders/assignments/${incidentId}/claim`);
    return response.data;
  },

  updateMissionStatus: async (incidentId: string, status: string) => {
    const response = await api.post(`/responders/assignments/${incidentId}/status`, { status });
    return response.data;
  },

  declineAssignment: async (incidentId: string, reason?: string) => {
    const response = await api.post(`/responders/assignments/${incidentId}/decline`, { reason });
    return response.data;
  },
};
