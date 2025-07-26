import React, { useState, useEffect } from 'react';
import { groupsAPI, expensesAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const GroupExpenses = ({ groupId, onAddExpense }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const { showError, showSuccess } = useNotification();

  // Helper function to get category styling
  const getCategoryStyle = (category) => {
    const categoryStyles = {
      'Groceries': 'bg-red-100 text-red-800',
      'Vegetable': 'bg-green-100 text-green-800',
      'Food': 'bg-orange-100 text-orange-800',
      'Taxi': 'bg-blue-100 text-blue-800',
      'Fuel': 'bg-yellow-100 text-yellow-800',
      'Rent': 'bg-purple-100 text-purple-800',
      'Electricity': 'bg-pink-100 text-pink-800',
      'Water': 'bg-teal-100 text-teal-800',
      'Internet': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return categoryStyles[category] || 'bg-gray-100 text-gray-800';
  };

  // Get unique categories from expenses
  const getUniqueCategories = () => {
    const categories = [...new Set(expenses.map(expense => expense.category).filter(Boolean))];
    return ['All', ...categories.sort()];
  };

  useEffect(() => {
    if (groupId) {
      fetchExpenses();
    }
  }, [groupId]);

  useEffect(() => {
    // Filter expenses when category selection changes
    if (selectedCategory === 'All') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(expenses.filter(expense => expense.category === selectedCategory));
    }
  }, [expenses, selectedCategory]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await groupsAPI.getGroupExpenses(groupId);
      setExpenses(response.data);
    } catch (err) {
      showError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setDeletingExpenseId(expenseId);
      await expensesAPI.deleteExpense(expenseId);
      showSuccess('Expense deleted successfully!');
      // Refresh the expenses list
      await fetchExpenses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete expense');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Expenses ({filteredExpenses.length}{selectedCategory !== 'All' && ` of ${expenses.length}`})
        </h2>
        <button
          onClick={onAddExpense}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          Add Expense
        </button>
      </div>

      {/* Category Filter */}
      {expenses.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {getUniqueCategories().map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          {expenses.length === 0 ? (
            <>
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first expense!</p>
              <button
                onClick={onAddExpense}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add First Expense
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses in "{selectedCategory}"</h3>
              <p className="text-gray-600">Try selecting a different category or add a new expense.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map(expense => (
            <div key={expense._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{expense.description}</h3>
                    {expense.category && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(expense.category)}`}>
                        {expense.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Paid by {expense.paidBy?.firstName} {expense.paidBy?.lastName}
                    <span className="mx-2">•</span>
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      ₹{expense.amount?.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.splitType}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(expense._id)}
                    disabled={deletingExpenseId === expense._id}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete expense"
                  >
                    {deletingExpenseId === expense._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Show how much each person owes */}
              {expense.shares && expense.shares.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Split between:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {expense.shares.map(share => (
                        <span key={share._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100">
                          {share.userId?.firstName} ₹{share.amount?.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupExpenses;
