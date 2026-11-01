import api from './client';
import type { EmergencyContact } from '../types';

export const contactApi = {
  getContacts: async (): Promise<EmergencyContact[]> => {
    const response = await api.get<EmergencyContact[]>('/emergency-contacts');
    return response.data;
  },

  addContact: async (contact: Partial<EmergencyContact>): Promise<EmergencyContact> => {
    const response = await api.post<EmergencyContact>('/emergency-contacts', contact);
    return response.data;
  },

  deleteContact: async (id: number): Promise<void> => {
    await api.delete(`/emergency-contacts/${id}`);
  },
};
