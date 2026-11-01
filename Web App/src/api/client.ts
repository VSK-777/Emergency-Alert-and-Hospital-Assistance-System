import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
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
