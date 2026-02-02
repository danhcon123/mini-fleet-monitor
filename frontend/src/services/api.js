import axios from 'axios';

// Base URL for your backend
const API_URL = 'http://localhost:3000'

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add token to request automatically if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('Adding token to request:', config.url);
            console.log('Token preview:', token.substring(0, 30) + '...');
        } else {
            console.warn('No token found in localStorage')
        }
        return config;
    },
    (error) => {
        return Promise.reject(error)
    });

// Log response errors
api.interceptors.response.use(
    (response) =>  response,
    (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data; // Returns { access_token, user }
    },
};

// Robot API (later)
export const robotAPI = {
    getRobots: async ()  => {
        const response = await api.get('/api/robots');
        return response.data;
    },

    getRobotById: async (id) => {
        const response = await api.get(`/api/robots/${id}`);
        return response.data;
    },

    moveRobot: async (id) => {
        const response = await api.post(`/api/robots/${id}/move`);
        return response.data;
    },
};

export default api;