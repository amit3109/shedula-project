import axios from 'axios';

const api = axios.create({
    // Pointing to your live Render backend!
    baseURL: 'https://shedula-project.onrender.com',
});

// 🚀 THE FIX: This interceptor acts like a bouncer. 
// Before ANY request leaves React, it grabs your token and attaches it to the header!
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;