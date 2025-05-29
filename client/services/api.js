import axios from 'axios';

const API_URL = 'http://192.168.230.119:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth services
export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/me'),
    logout: () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    },
};

// Course services
export const courseService = {
    getAll: () => api.get('/courses'),
    getById: (id) => api.get(`/courses/${id}`),
    enroll: (courseId) => api.post(`/courses/${courseId}/enroll`),
    getProgress: (courseId) => api.get(`/courses/${courseId}/progress`),
    updateProgress: (courseId, lessonId) => api.post(`/courses/${courseId}/progress`, { lessonId }),
};

// User services
export const userService = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getEnrolledCourses: () => api.get('/users/courses'),
    getSubscription: () => api.get('/users/subscription'),
};

// Subscription services
export const subscriptionService = {
    getPlans: () => api.get('/subscriptions/plans'),
    subscribe: (planId) => api.post('/subscriptions/subscribe', { planId }),
    cancel: () => api.post('/subscriptions/cancel'),
    getHistory: () => api.get('/subscriptions/history'),
};

export default api; 