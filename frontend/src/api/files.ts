import api from './client';

export interface MedicalDocument {
  id: number;
  userId: number;
  incidentId: string | null;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileCategory: string;
  fileUrl: string;
  createdAt: string;
}

export const fileApi = {
  getMyDocuments: async (): Promise<MedicalDocument[]> => {
    const response = await api.get<MedicalDocument[]>('/files/my');
    return response.data;
  },

  getDocumentsByIncident: async (incidentId: string): Promise<MedicalDocument[]> => {
    const response = await api.get<MedicalDocument[]>(`/files/incident/${incidentId}`);
    return response.data;
  },

  uploadFile: async (
    file: File,
    fileCategory = 'MEDICAL_REPORT',
    incidentId?: string
  ): Promise<MedicalDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', fileCategory);
    if (incidentId) {
      formData.append('incidentId', incidentId);
    }

    const response = await api.post<MedicalDocument>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFile: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/files/${id}`);
    return response.data;
  },

  getDownloadUrl: (id: number): string => {
    return `${api.defaults.baseURL || '/api/v1'}/files/${id}/download`;
  },
};
