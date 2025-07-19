
// client/src/pages/DashboardPage.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from 'antd';

const DashboardPage = () => {
  const { user, logout } = useAuth(); // Get user and logout function from context

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Welcome to your Dashboard, {user ? user.username : 'Guest'}!
      </h1>
      <p className="text-lg text-gray-600 mb-8">This is your authenticated dashboard content.</p>
      <Button type="primary" size="large" onClick={logout}>Logout</Button>
    </div>
  );
};

export default DashboardPage;