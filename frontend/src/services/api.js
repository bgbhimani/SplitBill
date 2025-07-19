// client/src/services/api.js
import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    // Vite's proxy automatically handles requests starting with /api
    // In production, this would be your deployed backend URL (e.g., process.env.VITE_API_BASE_URL)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Automatically attach JWT token to outgoing requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Get token from local storage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Attach token
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor (Optional but highly recommended for global error handling)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized errors globally, e.g., token expired/invalid
        if (error.response && error.response.status === 401) {
            console.warn('Authentication expired or invalid. Clearing token and redirecting.');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            // Using window.location.href for a full refresh to ensure all state is cleared
            // For a smoother experience, you might use `Maps('/login')` from react-router-dom
            // if this interceptor is within a React context or component, but for a global handler,
            // a full reload is often safer to reset the app state completely.
            window.location.href = '/login'; // Redirect to login page
        }
        return Promise.reject(error);
    }
);

export default api;