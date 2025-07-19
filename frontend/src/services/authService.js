// client/src/services/authService.js
import api from './api'; // Import the configured Axios instance

// Function to handle user registration
const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    // Store user data and token in localStorage upon successful registration
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

// Function to handle user login
const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    // Store user data and token in localStorage upon successful login
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

// Function to handle user logout
const logout = () => {
    // Remove user data and token from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
};

// Function to get current user details (using the protected /api/users/me route)
const getMe = async () => {
    const response = await api.get('/api/users/me');
    return response.data;
};

const authService = {
    register,
    login,
    logout,
    getMe,
};

export default authService;