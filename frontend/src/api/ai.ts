import api from './client';
import type { AiTriageRequest, AiTriageResponse } from '../types';

export const aiApi = {
  generateTriage: async (request: AiTriageRequest): Promise<AiTriageResponse> => {
    const response = await api.post<AiTriageResponse>('/ai/triage', request);
    return response.data;
  },
};
