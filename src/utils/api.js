import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for CORS if using sessions/cookies
});

// Request interceptor to add token if you implement auth later
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add Tenant Header
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tenantCode = user.tenant_code || 'zambia';
        config.headers['x-tenant-code'] = tenantCode;
        
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
