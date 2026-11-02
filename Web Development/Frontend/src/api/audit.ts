import api from './client';
import type { AuditLog } from '../types';

export const auditApi = {
  getAuditLogs: async (incidentId?: string): Promise<AuditLog[]> => {
    const params = incidentId ? { incidentId } : {};
    const response = await api.get<AuditLog[]>('/audit-logs', { params });
    return response.data;
  },

  createAuditLog: async (log: { action: string; details: string; incidentId?: string }): Promise<AuditLog> => {
    const response = await api.post<AuditLog>('/audit-logs', log);
    return response.data;
  },
};
