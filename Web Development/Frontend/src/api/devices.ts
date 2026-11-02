import api from './client';
import type { SmartwatchDevice, DetectionEvent } from '../types';

export const deviceApi = {
  getDevices: async (): Promise<SmartwatchDevice[]> => {
    const response = await api.get<SmartwatchDevice[]>('/devices');
    return response.data;
  },

  getDetectionEvents: async (incidentId?: string): Promise<DetectionEvent[]> => {
    const params = incidentId ? { incidentId } : {};
    const response = await api.get<DetectionEvent[]>('/devices/events', { params });
    return response.data;
  },

  pingDevice: async (id: number): Promise<{ status: string; message: string; timestamp: string }> => {
    const response = await api.post<{ status: string; message: string; timestamp: string }>(
      `/devices/${id}/ping`
    );
    return response.data;
  },
};
