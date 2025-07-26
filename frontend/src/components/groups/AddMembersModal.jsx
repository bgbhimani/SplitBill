import React, { useState } from 'react';
import { groupsAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const AddMembersModal = ({ isOpen, onClose, group, onMembersAdded }) => {
  const { showSuccess, showError } = useNotification();
  const [memberInput, setMemberInput] = useState('');
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddMember = () => {
    if (!memberInput.trim()) return;
    
    const username = memberInput.trim();
    if (membersList.includes(username)) {
      showError('Username already added to the list');
      return;
    }
    
    setMembersList(prev => [...prev, username]);
    setMemberInput('');
  };

  const handleRemoveMember = (username) => {
    setMembersList(prev => prev.filter(member => member !== username));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (membersList.length === 0) {
      showError('Please add at least one member');
      return;
    }

    setLoading(true);
    try {
      const response = await groupsAPI.addMembers(group._id, membersList);
      onMembersAdded(response.data);
      showSuccess(`Successfully added ${membersList.length} member(s) to the group`);
      setMembersList([]);
      setMemberInput('');
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMembersList([]);
    setMemberInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add Members to {group?.name}</h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="memberInput" className="block text-sm font-medium text-gray-700 mb-2">
              Add Member by Username
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="memberInput"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!memberInput.trim()}
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter or click Add to add the username to the list
            </p>
          </div>

          {membersList.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Members to Add ({membersList.length})
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                {membersList.map((username, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium mr-3">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900">{username}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(username)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Members
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
              {group?.members?.map(member => (
                <div key={member._id} className="flex items-center mb-2 last:mb-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{member.username}
                      {group.admin._id === member._id && <span className="text-blue-600 ml-1">(Admin)</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading || membersList.length === 0}
            >
              {loading ? 'Adding...' : `Add ${membersList.length} Member(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMembersModal;
