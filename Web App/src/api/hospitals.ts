import api from './client';
import type { Hospital } from '../types';

export const hospitalApi = {
  getHospitals: async (latitude?: number, longitude?: number): Promise<Hospital[]> => {
    const params = latitude && longitude ? { latitude, longitude } : {};
    const response = await api.get<Hospital[]>('/hospitals', { params });
    return response.data;
  },

  getHospitalById: async (id: number): Promise<Hospital> => {
    const response = await api.get<Hospital>(`/hospitals/${id}`);
    return response.data;
  },

  createHospital: async (hospital: Partial<Hospital>): Promise<Hospital> => {
    const response = await api.post<Hospital>('/hospitals', hospital);
    return response.data;
  },

  updateHospital: async (id: number, hospital: Partial<Hospital>): Promise<Hospital> => {
    const response = await api.put<Hospital>(`/hospitals/${id}`, hospital);
    return response.data;
  },

  getMyHospital: async (): Promise<Hospital> => {
    const response = await api.get<Hospital>('/hospitals/my');
    return response.data;
  },

  getHospitalEmergencies: async (hospitalId: number) => {
    const response = await api.get(`/hospitals/${hospitalId}/emergencies`);
    return response.data;
  },

  acknowledgeIncident: async (hospitalId: number, incidentId: string, action: 'ACKNOWLEDGE' | 'ACCEPT' | 'DECLINE', reason?: string) => {
    const response = await api.post(`/hospitals/${hospitalId}/emergencies/${incidentId}/acknowledge`, {
      action,
      reason,
    });
    return response.data;
  },

  updatePreparationStatus: async (hospitalId: number, incidentId: string, status: string) => {
    const response = await api.post(`/hospitals/${hospitalId}/emergencies/${incidentId}/preparation`, {
      status,
    });
    return response.data;
  },
};
