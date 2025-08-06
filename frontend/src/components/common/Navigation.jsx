import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/personal-expenses', label: 'Personal Expenses', icon: '💰' },
    { path: '/analytics', label: 'AI Analytics', icon: '📊' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary-600">
                <span className="text-lg font-bold text-white">S</span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-gray-900">Splitwise</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:ml-10 md:flex md:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                  isActive(item.path)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
