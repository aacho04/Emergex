import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('emergex_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('emergex_token');
        localStorage.removeItem('emergex_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  registerHospital: (data: any) => api.post('/auth/register-hospital', data),
  verifyEmail: (email: string, otp: string) => api.post('/auth/verify-email', { email, otp }),
  resendOTP: (email: string) => api.post('/auth/resend-otp', { email }),
  createERSOfficer: (data: any) => api.post('/auth/create-ers-officer', data),
  createAmbulance: (data: any) => api.post('/auth/create-ambulance', data),
  createTrafficPolice: (data: any) => api.post('/auth/create-traffic-police', data),
};

// User APIs
export const userAPI = {
  getAll: (role?: string) => api.get(`/users${role ? `?role=${role}` : ''}`),
  getById: (id: string) => api.get(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
  getERSOfficers: () => api.get('/users/ers-officers'),
  deactivate: (id: string) => api.patch(`/users/${id}/deactivate`),
  activate: (id: string) => api.patch(`/users/${id}/activate`),
};

// Ambulance APIs
export const ambulanceAPI = {
  getAll: () => api.get('/ambulances'),
  getAvailable: () => api.get('/ambulances/available'),
  getNearby: (lat: number, lng: number) =>
    api.get(`/ambulances/nearby?lat=${lat}&lng=${lng}`),
  getMe: () => api.get('/ambulances/me'),
  toggleDuty: () => api.patch('/ambulances/toggle-duty'),
  updateLocation: (lat: number, lng: number) =>
    api.patch('/ambulances/location', { lat, lng }),
  updateStatus: (status: string, data?: any) =>
    api.patch('/ambulances/status', { status, ...data }),
};

// Hospital APIs
export const hospitalAPI = {
  getAll: () => api.get('/hospitals'),
  getNearby: (lat: number, lng: number) =>
    api.get(`/hospitals/nearby?lat=${lat}&lng=${lng}`),
  getMe: () => api.get('/hospitals/me'),
  update: (data: any) => api.put('/hospitals/me', data),
  getAllAdmin: () => api.get('/hospitals/admin/all'),
  verify: (id: string) => api.patch(`/hospitals/${id}/verify`),
};

// Volunteer APIs
export const volunteerAPI = {
  register: (data: any) => api.post('/volunteers/register', data),
  getAll: () => api.get('/volunteers'),
  getNearby: (lat: number, lng: number) =>
    api.get(`/volunteers/nearby?lat=${lat}&lng=${lng}`),
  rate: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/volunteers/${id}/rate`, data),
};

// Traffic Police APIs
export const trafficPoliceAPI = {
  getAll: () => api.get('/traffic-police'),
  getOnDuty: () => api.get('/traffic-police/on-duty'),
  getNearby: (lat: number, lng: number) =>
    api.get(`/traffic-police/nearby?lat=${lat}&lng=${lng}`),
  getMe: () => api.get('/traffic-police/me'),
  toggleDuty: () => api.patch('/traffic-police/toggle-duty'),
  updateLocation: (lat: number, lng: number) =>
    api.patch('/traffic-police/location', { lat, lng }),
};

// Emergency APIs
export const emergencyAPI = {
  create: (data: any) => api.post('/emergencies', data),
  getAll: (status?: string) =>
    api.get(`/emergencies${status ? `?status=${status}` : ''}`),
  getById: (id: string) => api.get(`/emergencies/${id}`),
  getMy: () => api.get('/emergencies/my'),
  getStats: () => api.get('/emergencies/stats'),
};
