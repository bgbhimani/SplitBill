import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GroupsList from '../components/groups/GroupsList';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import MLInsights from '../components/insights/MLInsights';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [refreshGroups, setRefreshGroups] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
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
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Group
              </button>
              <button 
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Expense
              </button>
              <button 
                onClick={() => navigate('/personal-expenses')}
                className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Expenses
              </button>
              <button 
                onClick={() => navigate('/analytics')}
                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                AI Analytics
              </button>
            </div>
          </div>

          {/* Groups List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GroupsList key={refreshGroups} />
            </div>
            <div className="lg:col-span-1">
              <MLInsights />
            </div>
          </div>
        </div>

        {/* Modals */}
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onGroupCreated={() => {
            setShowCreateGroupModal(false);
            setRefreshGroups(prev => prev + 1); // Trigger refresh
          }}
        />

        <AddExpenseModal
          isOpen={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onExpenseAdded={() => {
            setShowAddExpenseModal(false);
            // You might want to refresh specific group or expenses here
          }}
        />
      </main>
    </div>
  );
};

export default Dashboard;
