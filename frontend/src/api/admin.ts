import api from './client';

export interface SystemStats {
  totalUsers: number;
  totalPatients: number;
  totalHospitals: number;
  totalHospitalStaff: number;
  totalAmbulances: number;
  totalResponders: number;
  availableResponders: number;
  registeredDevices: number;
  activeEmergencies: number;
  pendingEmergencies: number;
  resolvedEmergencies: number;
  pendingHospitalAcknowledgements: number;
  failedNotifications: number;
  pendingSynchronizations: number;
}

export const adminApi = {
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await api.get<SystemStats>('/admin/stats');
    return response.data;
  },

  updateUserStatus: async (userId: number, active: boolean) => {
    const response = await api.put(`/admin/users/${userId}/status`, null, {
      params: { active },
    });
    return response.data;
  },

  updateUserRole: async (userId: number, role: string) => {
    const response = await api.put(`/admin/users/${userId}/role`, null, {
      params: { role },
    });
    return response.data;
  },

  verifyResponder: async (responderId: number, status: 'VERIFIED' | 'REJECTED') => {
    const response = await api.put(`/admin/responders/${responderId}/verify`, null, {
      params: { status },
    });
    return response.data;
  },

  verifyHospital: async (hospitalId: number, active: boolean) => {
    const response = await api.put(`/admin/hospitals/${hospitalId}/verify`, null, {
      params: { active },
    });
    return response.data;
  },
};
