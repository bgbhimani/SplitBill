import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { personalExpensesAPI } from '../services/api';
import AddPersonalExpenseModal from '../components/expenses/AddPersonalExpenseModal';

const PersonalExpenses = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPersonalExpenses();
  }, []);

  const fetchPersonalExpenses = async () => {
    try {
      setLoading(true);
      const response = await personalExpensesAPI.getMyPersonalExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching personal expenses:', error);
      setError('Failed to load personal expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await personalExpensesAPI.deletePersonalExpense(expenseId);
        setExpenses(expenses.filter(expense => expense._id !== expenseId));
      } catch (error) {
        console.error('Error deleting expense:', error);
        setError('Failed to delete expense');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

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
                <h1 className="text-xl font-semibold text-gray-900">Personal Expenses</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </button>
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
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Personal Expense
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">Total Expenses</h3>
                <p className="text-2xl font-bold text-blue-600">{formatAmount(getTotalExpenses())}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-900">Number of Expenses</h3>
                <p className="text-2xl font-bold text-green-600">{expenses.length}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Expenses List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">My Personal Expenses</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No personal expenses found.</p>
                <p className="text-sm">Add your first personal expense to get started!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <div key={expense._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {expense.description}
                          </h3>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatAmount(expense.amount)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {formatDate(expense.date)}
                          </span>
                          {expense.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {expense.category}
                            </span>
                          )}
                        </div>
                        {expense.notes && (
                          <p className="mt-1 text-sm text-gray-600">{expense.notes}</p>
                        )}
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete expense"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Personal Expense Modal */}
        <AddPersonalExpenseModal
          isOpen={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onExpenseAdded={() => {
            setShowAddExpenseModal(false);
            fetchPersonalExpenses(); // Refresh the list
          }}
        />
      </main>
    </div>
  );
};

export default PersonalExpenses;
