import api, { API_BASE_URL } from './client';
import type { EmergencyIncident, IncidentStatus } from '../types';

export const emergencyApi = {
  getActiveIncidents: async (): Promise<EmergencyIncident[]> => {
    const response = await api.get<EmergencyIncident[]>('/emergencies/active');
    return response.data;
  },

  getAllIncidents: async (): Promise<EmergencyIncident[]> => {
    const response = await api.get<EmergencyIncident[]>('/emergencies/all');
    return response.data;
  },

  getMyIncidents: async (): Promise<EmergencyIncident[]> => {
    const response = await api.get<EmergencyIncident[]>('/emergencies');
    return response.data;
  },

  getIncidentById: async (id: string): Promise<EmergencyIncident> => {
    const response = await api.get<EmergencyIncident>(`/emergencies/${id}`);
    return response.data;
  },

  createIncident: async (incident: Partial<EmergencyIncident>): Promise<EmergencyIncident> => {
    const response = await api.post<EmergencyIncident>('/emergencies', incident);
    return response.data;
  },

  updateStatus: async (
    id: string,
    payload: { status: IncidentStatus; hospitalId?: number; responderId?: number }
  ): Promise<EmergencyIncident> => {
    const response = await api.patch<EmergencyIncident>(`/emergencies/${id}/status`, payload);
    return response.data;
  },

  cancelIncident: async (id: string): Promise<EmergencyIncident> => {
    const response = await api.post<EmergencyIncident>(`/emergencies/${id}/cancel`);
    return response.data;
  },

  getStreamTicket: async (): Promise<string> => {
    const response = await api.post<{ ticket: string }>('/emergencies/stream-ticket');
    return response.data.ticket;
  },

  createSseSource: async (): Promise<EventSource> => {
    const token = localStorage.getItem('vvit_csp_token') || localStorage.getItem('token') || '';
    try {
      const ticket = await emergencyApi.getStreamTicket();
      return new EventSource(`${API_BASE_URL}/emergencies/stream?ticket=${encodeURIComponent(ticket)}`);
    } catch {
      return new EventSource(`${API_BASE_URL}/emergencies/stream?token=${encodeURIComponent(token)}`);
    }
  },
};
