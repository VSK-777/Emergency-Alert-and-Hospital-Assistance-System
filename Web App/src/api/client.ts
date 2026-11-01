import axios from 'axios';

// Prefer same-origin relative base URL '/api/v1' for web production (Vercel edge rewrite)
// and development (Vite server proxy) to eliminate browser CORS preflight overhead.
const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const forceDirect = import.meta.env.VITE_FORCE_DIRECT_API === 'true';

export const API_BASE_URL = (forceDirect && envUrl)
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
      // Clear token if unauthorized, but avoid redirect loops
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('vvit_csp_token');
        localStorage.removeItem('vvit_csp_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
