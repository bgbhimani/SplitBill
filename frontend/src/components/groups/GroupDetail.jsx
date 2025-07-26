import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AddMembersModal from './AddMembersModal';
import AddExpenseModal from '../expenses/AddExpenseModal';
import GroupExpenses from '../expenses/GroupExpenses';
import GroupBalances from '../balances/GroupBalances';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await groupsAPI.getGroupById(id);
      setGroup(response.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch group details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleMembersAdded = (updatedGroup) => {
    setGroup(updatedGroup);
  };

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      const response = await groupsAPI.removeMembers(id, [memberId]);
      setGroup(response.data);
      showSuccess('Member removed successfully');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const isAdmin = group && user && group.admin._id === user._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{group.name}</h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {group.type}
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Expense
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembersModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Members
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Group Info */}
            <div className="xl:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Group Information</h2>
                
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{group.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900">{group.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Admin</dt>
                    <dd className="text-sm text-gray-900">
                      {group.admin.firstName} {group.admin.lastName}
                      {isAdmin && <span className="text-blue-600 ml-1">(You)</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Members</dt>
                    <dd className="text-sm text-gray-900">{group.members.length}</dd>
                  </div>
                </dl>
              </div>

              {/* Members List */}
              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Members ({group.members.length})</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddMembersModal(true)}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Add Member
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {group.members.map(member => (
                    <div key={member._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 text-sm">
                          {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                            {member._id === user._id && <span className="text-blue-600 ml-1">(You)</span>}
                          </h3>
                          <p className="text-xs text-gray-500">
                            @{member.username}
                            {group.admin._id === member._id && <span className="text-blue-600 ml-1">• Admin</span>}
                          </p>
                        </div>
                      </div>

                      {isAdmin && member._id !== group.admin._id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expenses and Balances */}
            <div className="xl:col-span-3 space-y-6">
              {/* Balances */}
              <GroupBalances 
                groupId={id} 
                group={group}
                key={refreshTrigger}
              />
              
              {/* Expenses */}
              <GroupExpenses 
                groupId={id} 
                onAddExpense={() => setShowAddExpenseModal(true)}
                key={refreshTrigger}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        group={group}
        onMembersAdded={handleMembersAdded}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onExpenseAdded={handleExpenseAdded}
        preselectedGroupId={id}
      />
    </div>
  );
};

export default GroupDetail;
