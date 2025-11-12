import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Reports API
export const reportsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.jenis_kejahatan) params.append('jenis_kejahatan', filters.jenis_kejahatan);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.bounds) params.append('bounds', JSON.stringify(filters.bounds));
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    return api.get(`/reports?${params.toString()}`);
  },
  
  getById: (id) => {
    return api.get(`/reports/${id}`);
  },
  
  create: (data, photoFile) => {
    const formData = new FormData();
    formData.append('lokasi', JSON.stringify(data.lokasi));
    formData.append('tanggal_kejadian', data.tanggal_kejadian);
    formData.append('jenis_kejahatan', data.jenis_kejahatan);
    formData.append('deskripsi', data.deskripsi || '');
    if (photoFile) {
      formData.append('foto', photoFile);
    }
    
    return api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  updateStatus: (id, status) => {
    return api.put(`/reports/${id}`, { status });
  },
  
  delete: (id) => {
    return api.delete(`/reports/${id}`);
  },
};

// Zones API
export const zonesAPI = {
  getAll: () => {
    return api.get('/zones');
  },
  
  getById: (id) => {
    return api.get(`/zones/${id}`);
  },
  
  create: (data) => {
    return api.post('/zones', data);
  },
  
  update: (id, data) => {
    return api.put(`/zones/${id}`, data);
  },
  
  delete: (id) => {
    return api.delete(`/zones/${id}`);
  },
};

// Admin API
export const adminAPI = {
  login: (username, password) => {
    return api.post('/admin/login', { username, password });
  },
  
  getAnalytics: () => {
    return api.get('/admin/analytics');
  },
  
  getReports: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.jenis_kejahatan) params.append('jenis_kejahatan', filters.jenis_kejahatan);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    return api.get(`/admin/reports?${params.toString()}`);
  },
  
  getReportById: (id) => {
    return api.get(`/admin/reports/${id}`);
  },
  
  updateStatus: (id, status) => {
    return api.put(`/admin/reports/${id}`, { status });
  },
  
  delete: (id) => {
    return api.delete(`/admin/reports/${id}`);
  },
};

export default api;

