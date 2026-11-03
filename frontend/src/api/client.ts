import axios from 'axios';

// Resolve base URL: use configured VITE_API_BASE_URL if present, otherwise fall back to relative '/api/v1'
const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = envUrl
  ? (envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`)
  : '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vvit_csp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      // Clear token if unauthorized, but avoid redirect loops
      if (!isAuthEndpoint && window.location.pathname !== '/login') {
        localStorage.removeItem('vvit_csp_token');
        localStorage.removeItem('vvit_csp_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
