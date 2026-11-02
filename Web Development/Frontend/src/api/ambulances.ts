import api from './client';
import type { Ambulance, AmbulanceStatus } from '../types';

export const ambulanceApi = {
  getAmbulances: async (hospitalId?: number, status?: AmbulanceStatus): Promise<Ambulance[]> => {
    const params: Record<string, any> = {};
    if (hospitalId) params.hospitalId = hospitalId;
    if (status) params.status = status;
    const response = await api.get<Ambulance[]>('/ambulances', { params });
    return response.data;
  },

  getAmbulanceById: async (id: number): Promise<Ambulance> => {
    const response = await api.get<Ambulance>(`/ambulances/${id}`);
    return response.data;
  },

  createAmbulance: async (data: Partial<Ambulance> & { hospitalId?: number }): Promise<Ambulance> => {
    const response = await api.post<Ambulance>('/ambulances', data);
    return response.data;
  },

  updateStatus: async (id: number, status: AmbulanceStatus, incidentId?: string): Promise<Ambulance> => {
    const params: Record<string, any> = { status };
    if (incidentId) params.incidentId = incidentId;
    const response = await api.patch<Ambulance>(`/ambulances/${id}/status`, null, { params });
    return response.data;
  },

  updateLocation: async (id: number, latitude: number, longitude: number): Promise<Ambulance> => {
    const response = await api.patch<Ambulance>(`/ambulances/${id}/location`, null, {
      params: { latitude, longitude },
    });
    return response.data;
  },
};
