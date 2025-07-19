// client/src/components/common/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Import your AuthContext

const PrivateRoute = () => {
    const { isAuthenticated, loading } = useAuth(); // Get auth state from context

    if (loading) {
        // Optional: Render a full-page loading spinner or component while checking auth status
        return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
    }

    // If authenticated, render the child routes (Outlet)
    // Otherwise, redirect to the login page
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;