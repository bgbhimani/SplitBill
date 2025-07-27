import React, { useState, useEffect } from 'react';
import { expensesAPI, groupsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded, preselectedGroupId }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    groupId: preselectedGroupId || '',
    description: '',
    amount: '',
    paidBy: user?._id || '',
    splitType: 'equal',
    shares: [],
    category: 'Other'
  });
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [predictingCategory, setPredictingCategory] = useState(false);

  // Common expense categories
  const categories = [
    'Groceries',
    'Vegetable',
    'Food',
    'Taxi',
    'Fuel',
    'Rent',
    'Electricity',
    'Water',
    'Internet',
    'Other',
  ];

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      if (preselectedGroupId) {
        setFormData(prev => ({ ...prev, groupId: preselectedGroupId }));
      }
    }
  }, [isOpen, preselectedGroupId]);

  useEffect(() => {
    if (formData.groupId) {
      fetchGroupMembers(formData.groupId);
    }
  }, [formData.groupId]);

  // Debounced effect for category prediction
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.description && formData.description.trim().length >= 3) {
        predictCategory(formData.description);
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.description]);

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.getMyGroups();
      setGroups(response.data);
    } catch (err) {
      showError('Failed to fetch groups');
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      const response = await groupsAPI.getGroupById(groupId);
      setGroupMembers(response.data.members);
      
      // Initialize equal shares for all members
      if (formData.splitType === 'equal' && formData.amount) {
        const amount = parseFloat(formData.amount);
        const perPersonAmount = amount / response.data.members.length;
        const shares = response.data.members.map(member => ({
          userId: member._id,
          amount: perPersonAmount
        }));
        setFormData(prev => ({ ...prev, shares }));
      }
    } catch (err) {
      showError('Failed to fetch group members');
    }
  };

  // Function to predict category using ML API
  const predictCategory = async (expenseTitle) => {
    if (!expenseTitle || expenseTitle.trim().length < 3) {
      return; // Don't predict for very short titles
    }

    try {
      setPredictingCategory(true);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      // Create the fetch promise using environment variable
      const mlApiUrl = import.meta.env.ML_MODEL_URL || 'http://localhost:5001/';
      const fetchPromise = fetch(`${mlApiUrl}predict_category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expense_title: expenseTitle.trim()
        })
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (response.ok) {
        const data = await response.json();
        const predictedCategory = data.predicted_category;
        
        // Only update if the predicted category is in our available categories
        if (categories.includes(predictedCategory)) {
          setFormData(prev => ({
            ...prev,
            category: predictedCategory
          }));
        }
      }
    } catch (err) {
      // Log detailed error for debugging
      console.error('Category prediction failed:', {
        error: err.message,
        url: `${import.meta.env.ML_MODEL_URL || 'http://localhost:5001/'}predict_category`,
        expenseTitle: expenseTitle.trim()
      });
      // Show error to user for debugging
      showError(`ML prediction failed: ${err.message}`);
    } finally {
      setPredictingCategory(false);
    }
  };

  const handleDescriptionKeyPress = (e) => {
    if (e.key === 'Enter' && formData.description && formData.description.trim().length >= 3) {
      e.preventDefault(); // Prevent form submission
      predictCategory(formData.description);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If amount or splitType changes, recalculate shares
    if ((name === 'amount' || name === 'splitType') && formData.groupId) {
      if (name === 'amount' && formData.splitType === 'equal' && groupMembers.length > 0) {
        const amount = parseFloat(value) || 0;
        const perPersonAmount = amount / groupMembers.length;
        const shares = groupMembers.map(member => ({
          userId: member._id,
          amount: perPersonAmount
        }));
        setFormData(prev => ({ ...prev, shares }));
      }
    }
  };

  const handleShareChange = (userId, amount) => {
    setFormData(prev => ({
      ...prev,
      shares: prev.shares.map(share =>
        share.userId === userId ? { ...share, amount: parseFloat(amount) || 0 } : share
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate shares sum equals total amount
      const totalShares = formData.shares.reduce((sum, share) => sum + share.amount, 0);
      const totalAmount = parseFloat(formData.amount);
      
      if (Math.abs(totalShares - totalAmount) > 0.01) {
        showError('Sum of shares must equal the total amount');
        setLoading(false);
        return;
      }

      const response = await expensesAPI.addExpense({
        ...formData,
        amount: totalAmount
      });
      
      onExpenseAdded(response.data);
      showSuccess('Expense added successfully!');
      onClose();
      resetForm();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      groupId: preselectedGroupId || '',
      description: '',
      amount: '',
      paidBy: user?._id || '',
      splitType: 'equal',
      shares: [],
      category: 'Food'
    });
    setGroupMembers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-2">
              Group
            </label>
            <select
              id="groupId"
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a group</option>
              {groups.map(group => (
                <option key={group._id} value={group._id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                onKeyPress={handleDescriptionKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What was this expense for? (Press Enter to predict category)"
                required
              />
              {predictingCategory && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {predictingCategory && (
              <p className="text-xs text-blue-600 mt-1">Predicting category...</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
              {formData.description && formData.description.trim().length >= 3 && (
                <span className="text-xs text-blue-600 ml-2">(Auto-predicted)</span>
              )}
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Category is automatically predicted based on description, but you can change it manually.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
              Paid By
            </label>
            <select
              id="paidBy"
              name="paidBy"
              value={formData.paidBy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {groupMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.firstName} {member.lastName} ({member.username})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="splitType" className="block text-sm font-medium text-gray-700 mb-2">
              Split Type
            </label>
            <select
              id="splitType"
              name="splitType"
              value={formData.splitType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="equal">Split Equally</option>
              <option value="custom">Custom Split</option>
            </select>
          </div>

          {formData.splitType === 'custom' && groupMembers.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Shares
              </label>
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member._id} className="flex items-center space-x-2">
                    <span className="text-sm flex-1">
                      {member.firstName} {member.lastName}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shares.find(s => s.userId === member._id)?.amount || 0}
                      onChange={(e) => handleShareChange(member._id, e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
