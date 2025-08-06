import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { personalExpensesAPI } from '../services/api';
import { mlServices } from '../services/mlAPI';
import AddPersonalExpenseModal from '../components/expenses/AddPersonalExpenseModal';

const PersonalExpenses = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [error, setError] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    fetchPersonalExpenses();
    fetchForecastData();
  }, []);

  useEffect(() => {
    // Filter expenses when category selection changes
    if (selectedCategory === 'All') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(expenses.filter(expense => expense.category === selectedCategory));
    }
  }, [expenses, selectedCategory]);

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

  const fetchForecastData = async () => {
    try {
      setForecastLoading(true);
      if (user?._id) {
        const data = await mlServices.predictExpenses(user._id);
        setForecastData(data.prediction);
      } else {
        // Fallback to general forecast if no user ID
        const data = await mlServices.getForecast();
        setForecastData(data.forecast);
      }
    } catch (error) {
      console.warn('Forecast API not available:', error.message);
    } finally {
      setForecastLoading(false);
    }
  };

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
      'Income': 'bg-emerald-100 text-emerald-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return categoryStyles[category] || 'bg-gray-100 text-gray-800';
  };

  // Get unique categories from expenses
  const getUniqueCategories = () => {
    const categories = [...new Set(expenses.map(expense => expense.category).filter(Boolean))];
    return ['All', ...categories.sort()];
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
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


  const getCurrentMonthTransactions = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const baseExpenses = selectedCategory === 'All' ? expenses : filteredExpenses;
    
    console.log('Current month transactions - base expenses:', baseExpenses.length);
    console.log('Sample expense:', baseExpenses[0]);
    console.log('Current month:', currentMonth, 'Current year:', currentYear);

    const filtered = baseExpenses.filter(expense => {
      // Handle different date formats
      let expenseDate;
      if (typeof expense.date === 'string') {
        expenseDate = new Date(expense.date);
      } else {
        expenseDate = expense.date;
      }
      
      // Check if date is valid
      if (isNaN(expenseDate.getTime())) {
        console.log('Invalid date for expense:', expense);
        return false;
      }
      
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      const isCurrentMonth = expenseMonth === currentMonth && expenseYear === currentYear;
      
      console.log('Expense:', expense.description, 'Date:', expense.date, 'Parsed:', expenseDate.toISOString(), 'Is current month:', isCurrentMonth);
      return isCurrentMonth;
    });
    
    console.log('Filtered current month transactions:', filtered.length);
    return filtered;
  };

  const getMonthlyCredits = () => {
    const monthlyTransactions = getCurrentMonthTransactions();
    return monthlyTransactions
      .filter(expense => expense.type === 'credit')
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const getMonthlyDebits = () => {
    const monthlyTransactions = getCurrentMonthTransactions();
    return monthlyTransactions
      .filter(expense => expense.type === 'debit')
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const getNetBalance = () => {
    return getMonthlyCredits() - getMonthlyDebits();
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
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Personal Transaction
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                {/* <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg> */}
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14.5 19.5V12.5M10.5 12.5V5.5M5.5 12.5H19.5M5.5 19.5H19.5V5.5H5.5V19.5Z" strokeLinejoin="round" stroke="white" stroke-width="2" />
                </svg>
                DashBoard
              </button>
            </div>
          </div>

          {/* Analysis Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">📊 AI-Powered Expense Forecast</h2>
            
            {forecastLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600">Loading AI predictions...</span>
              </div>
            ) : forecastData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">📅</span>
                    <h3 className="text-sm font-medium text-blue-900">Next Week Forecast</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    ₹{forecastData.next_week_total_expense?.toFixed(2) || forecastData.next_week_forecast_amount?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Predicted expenses for next 7 days</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">📈</span>
                    <h3 className="text-sm font-medium text-purple-900">Next Month Forecast</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    ₹{forecastData.next_month_total_expense?.toFixed(2) || forecastData.next_month_forecast_amount?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Predicted expenses for next 30 days</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-sm">AI forecast unavailable</p>
                <p className="text-xs text-gray-400">Make sure the ML service is running</p>
              </div>
            )}
            
            {forecastData && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">💡 AI Insight:</span> 
                  These predictions are based on your historical spending patterns using advanced machine learning algorithms.
                </p>
              </div>
            )}
          </div>

          {/* Debug Information - Show if no current month transactions */}
          {getCurrentMonthTransactions().length === 0 && expenses.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
              <h3 className="font-medium">Debug Information:</h3>
              <p>Total expenses: {expenses.length}</p>
              <p>Current month transactions: {getCurrentMonthTransactions().length}</p>
              <p>Current month: {new Date().getMonth() + 1}</p>
              <p>Current year: {new Date().getFullYear()}</p>
              <details className="mt-2">
                <summary className="cursor-pointer">Show sample expense data</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-32 bg-white p-2 rounded">
                  {JSON.stringify(expenses.slice(0, 2), null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              This Month's Summary
              {selectedCategory !== 'All' && <span className="text-sm text-gray-500 ml-2">({selectedCategory})</span>}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-900">💰 Credits (Income)</h3>
                <p className="text-2xl font-bold text-green-600">{formatAmount(getMonthlyCredits())}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-900">💸 Debits (Expenses)</h3>
                <p className="text-2xl font-bold text-red-600">{formatAmount(getMonthlyDebits())}</p>
              </div>
              <div className={`p-4 rounded-lg ${getNetBalance() >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <h3 className={`text-sm font-medium ${getNetBalance() >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  💯 Net Balance
                </h3>
                <p className={`text-2xl font-bold ${getNetBalance() >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatAmount(getNetBalance())}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">📊 Total Transactions</h3>
                <p className="text-2xl font-bold text-gray-600">{getCurrentMonthTransactions().length}</p>
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
              <h2 className="text-lg font-medium text-gray-900">
                My Personal Transactions ({filteredExpenses.length}{selectedCategory !== 'All' && ` of ${expenses.length}`})
              </h2>
            </div>

            {/* Category Filter */}
            {expenses.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {getUniqueCategories().map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
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

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {expenses.length === 0 ? (
                  <>
                    <p>No personal transactions found.</p>
                    <p className="text-sm">Add your first personal transaction to get started!</p>
                  </>
                ) : (
                  <>
                    <p>No transactions in "{selectedCategory}" category.</p>
                    <p className="text-sm">Try selecting a different category or add a new transaction.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <div key={expense._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <h3 className="text-base font-medium text-gray-900">
                              {expense.description}
                            </h3>
                          </div>
                          <span className={`text-lg font-semibold ${expense.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {expense.type === 'credit' ? '+' : '-'}{formatAmount(expense.amount)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {formatDate(expense.date)}
                          </span>
                          {expense.category && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(expense.category)}`}>
                              {expense.category}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expense.type === 'credit'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {expense.type === 'credit' ? 'Credit' : 'Debit'}
                          </span>
                        </div>
                        {expense.notes && (
                          <p className="mt-1 text-sm text-gray-600">{expense.notes}</p>
                        )}
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete transaction"
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
