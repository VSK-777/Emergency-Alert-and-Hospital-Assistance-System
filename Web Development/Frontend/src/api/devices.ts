import api from './client';
import type { HardwareDevice, DetectionEvent, HardwareTelemetry } from '../types';

export const deviceApi = {
  getDevices: async (): Promise<HardwareDevice[]> => {
    const response = await api.get<HardwareDevice[]>('/devices');
    return response.data;
  },

  getLatestTelemetry: async (deviceIdentifier: string): Promise<HardwareTelemetry | null> => {
    const response = await api.get<HardwareTelemetry>(`/devices/${deviceIdentifier}/telemetry/latest`);
    return response.data;
  },

  getTelemetryHistory: async (deviceIdentifier: string, limit = 50): Promise<HardwareTelemetry[]> => {
    const response = await api.get<HardwareTelemetry[]>(`/devices/${deviceIdentifier}/telemetry/history`, {
      params: { limit },
    });
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
