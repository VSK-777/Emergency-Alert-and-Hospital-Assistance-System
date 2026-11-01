import api from './client';
import type { User, MedicalExpense, ExpenseStatus } from '../types';

export const patientApi = {
  getPatients: async (role = 'CITIZEN'): Promise<User[]> => {
    const response = await api.get<User[]>('/users', { params: { role } });
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  getIncidentExpenses: async (incidentId: string): Promise<MedicalExpense[]> => {
    const response = await api.get<MedicalExpense[]>(`/medical-expenses/incident/${incidentId}`);
    return response.data;
  },

  getMyExpenses: async (): Promise<MedicalExpense[]> => {
    const response = await api.get<MedicalExpense[]>('/medical-expenses/my');
    return response.data;
  },

  createExpense: async (expense: Partial<MedicalExpense>): Promise<MedicalExpense> => {
    const response = await api.post<MedicalExpense>('/medical-expenses', expense);
    return response.data;
  },

  updateExpenseStatus: async (id: number, status: ExpenseStatus): Promise<MedicalExpense> => {
    const response = await api.patch<MedicalExpense>(`/medical-expenses/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },
};
