// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom'; // For programmatic navigation

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Stores the authenticated user object
    const [loading, setLoading] = useState(true); // Indicates if authentication state is being loaded
    const navigate = useNavigate(); // Hook for navigation

    // Effect to check for stored user/token on initial app load
    useEffect(() => {
        const checkAuthStatus = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Optionally, verify token against backend to ensure it's still valid
                    // For simplicity here, we assume if token exists, user is authenticated
                    // A more robust app might call authService.getMe() here to validate the token
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                } catch (e) {
                    console.error("Failed to parse user data or validate token:", e);
                    authService.logout(); // Clear invalid data if parsing fails
                    setUser(null);
                }
            }
            setLoading(false); // Authentication state has been checked
        };

        checkAuthStatus();
    }, []); // Empty dependency array means this runs once on mount

    // Function to handle login
    const login = async (email, password) => {
        try {
            const userData = await authService.login(email, password);
            setUser(userData);
            navigate('/dashboard'); // Redirect to dashboard on successful login
            return userData;
        } catch (error) {
            console.error('Login failed in AuthContext:', error.response?.data?.message || error.message);
            throw error; // Re-throw to allow components to catch and display specific errors
        }
    };

    // Function to handle registration
    const register = async (userData) => {
        try {
            const newUser = await authService.register(userData);
            setUser(newUser);
            navigate('/dashboard'); // Redirect to dashboard on successful registration
            return newUser;
        } catch (error) {
            console.error('Registration failed in AuthContext:', error.response?.data?.message || error.message);
            throw error;
        }
    };

    // Function to handle logout
    const logout = () => {
        authService.logout();
        setUser(null); // Clear user state
        navigate('/login'); // Redirect to login page on logout
    };

    // The value provided to components consuming this context
    const value = {
        user,
        loading,
        isAuthenticated: !!user, // Convenience boolean for checking auth status
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the AuthContext in any component
export const useAuth = () => {
    return useContext(AuthContext);
};