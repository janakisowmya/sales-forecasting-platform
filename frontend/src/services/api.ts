import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    register: (email: string, password: string, role?: string) =>
        api.post('/auth/register', { email, password, role }),

    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
};

// Dataset API
export const datasetAPI = {
    upload: (formData: FormData) =>
        api.post('/datasets/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    list: (page = 1, limit = 10) =>
        api.get('/datasets', { params: { page, limit } }),

    get: (id: number) =>
        api.get(`/datasets/${id}`),

    delete: (id: number) =>
        api.delete(`/datasets/${id}`),
};

// Forecast API
export const forecastAPI = {
    run: (data: {
        datasetId: number;
        modelType: 'baseline' | 'arima' | 'xgboost';
        horizon: number;
        granularity: 'daily' | 'weekly' | 'monthly';
    }) => api.post('/forecasts/run', data),

    list: (page = 1, limit = 10) =>
        api.get('/forecasts', { params: { page, limit } }),

    get: (id: number) =>
        api.get(`/forecasts/${id}`),

    getMetrics: (id: number) =>
        api.get(`/forecasts/${id}/metrics`),
};

export default api;
