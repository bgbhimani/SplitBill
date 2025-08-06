import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mlServices } from '../services/mlAPI';
import { personalExpensesAPI } from '../services/api';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    predictions: null,
    budgetRecommendations: null,
    anomalies: null,
    personalExpenses: [],
    loading: true,
    error: null
  });

  const [categoryInput, setCategoryInput] = useState('');
  const [categoryPrediction, setCategoryPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true, error: null }));

      const [predictions, budgetRecs, anomalies, expenses] = await Promise.allSettled([
        mlServices.predictExpenses(user._id),
        mlServices.getBudgetRecommendations(user._id),
        mlServices.detectAnomalies(user._id),
        personalExpensesAPI.getMyPersonalExpenses()
      ]);

      setAnalytics({
        predictions: predictions.status === 'fulfilled' ? predictions.value : null,
        budgetRecommendations: budgetRecs.status === 'fulfilled' ? budgetRecs.value : null,
        anomalies: anomalies.status === 'fulfilled' ? anomalies.value : null,
        personalExpenses: expenses.status === 'fulfilled' ? expenses.value.data : [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load analytics. Please try again.'
      }));
    }
  };

  const handleCategoryPrediction = async (e) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;

    try {
      setPredicting(true);
      const result = await mlServices.predictCategory(categoryInput);
      setCategoryPrediction(result);
    } catch (error) {
      console.error('Failed to predict category:', error);
    } finally {
      setPredicting(false);
    }
  };

  const getExpenseStats = () => {
    if (!analytics.personalExpenses.length) {
      console.log('No personal expenses found');
      return null;
    }

    console.log('Personal expenses data:', analytics.personalExpenses);
    console.log('Sample expense:', analytics.personalExpenses[0]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    console.log('Current month:', currentMonth, 'Current year:', currentYear);
    console.log('Current date:', now.toISOString());
    
    // Filter for current month expenses - be more flexible with date parsing
    const thisMonthExpenses = analytics.personalExpenses.filter(expense => {
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
      
      console.log('Expense:', expense.description, 'Date:', expense.date, 'Parsed date:', expenseDate.toISOString(), 'Is current month:', isCurrentMonth, 'Type:', expense.type);
      return isCurrentMonth;
    });

    console.log('This month expenses:', thisMonthExpenses);

    const totalThisMonth = thisMonthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const averageDaily = totalThisMonth / now.getDate();

    const categoryBreakdown = thisMonthExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {});

    return {
      totalThisMonth,
      averageDaily,
      categoryBreakdown,
      expenseCount: thisMonthExpenses.length,
      allExpensesCount: analytics.personalExpenses.length
    };
  };

  const stats = getExpenseStats();

  if (analytics.loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Smart Analytics</h1>
          <p className="text-gray-600">AI-powered insights into your spending patterns</p>
        </div>

        {analytics.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {analytics.error}
          </div>
        )}

        {/* Debug Information - Only show if stats exist but totals are 0 */}
        {stats && stats.totalThisMonth === 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <h3 className="font-medium">Debug Information:</h3>
            <p>Total expenses in database: {stats.allExpensesCount}</p>
            <p>This month expenses: {stats.expenseCount}</p>
            <p>Current month: {new Date().getMonth() + 1}</p>
            <p>Current year: {new Date().getFullYear()}</p>
            <details className="mt-2">
              <summary className="cursor-pointer">Show raw expense data</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-32 bg-white p-2 rounded">
                {JSON.stringify(analytics.personalExpenses.slice(0, 3), null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">This Month Total</h3>
              <p className="text-2xl font-bold text-blue-600">₹{stats.totalThisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
              <p className="text-2xl font-bold text-green-600">₹{stats.averageDaily.toFixed(0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Expenses Count</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.expenseCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500">Top Category</h3>
              <p className="text-lg font-bold text-orange-600">
                {Object.entries(stats.categoryBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Predictions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              📈 Expense Forecast
            </h2>
            {analytics.predictions ? (
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Next Week</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{analytics.predictions.prediction?.next_week_total_expense?.toLocaleString()}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900">Next Month</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{analytics.predictions.prediction?.next_month_total_expense?.toLocaleString()}
                  </p>
                </div>
                {stats && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      Compared to this month: 
                      <span className={`ml-1 font-medium ${
                        analytics.predictions.prediction?.next_month_total_expense > stats.totalThisMonth 
                          ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {analytics.predictions.prediction?.next_month_total_expense > stats.totalThisMonth ? '↗️' : '↘️'}
                        {Math.abs(((analytics.predictions.prediction?.next_month_total_expense - stats.totalThisMonth) / stats.totalThisMonth) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Add more expenses to see predictions</p>
            )}
          </div>

          {/* Budget Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              💡 Budget Recommendations
            </h2>
            {analytics.budgetRecommendations ? (
              <div className="space-y-2">
                {analytics.budgetRecommendations.note && (
                  <p className="text-sm text-yellow-600 mb-3">
                    ⚠️ {analytics.budgetRecommendations.note}
                  </p>
                )}
                {Object.entries(analytics.budgetRecommendations.expense_recommendation || {}).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="capitalize font-medium">{category}</span>
                    <span className="text-green-600 font-bold">₹{amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Add more categorized expenses to see recommendations</p>
            )}
          </div>

          {/* Category Predictor Tool */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🤖 Category Predictor
            </h2>
            <form onSubmit={handleCategoryPrediction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter expense description:
                </label>
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="e.g., Coffee at Starbucks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={predicting || !categoryInput.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {predicting ? 'Predicting...' : 'Predict Category'}
              </button>
              {categoryPrediction && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Expense: "{categoryPrediction.expense_title}"</p>
                  <p className="text-lg font-semibold text-blue-700">
                    Predicted Category: {categoryPrediction.predicted_category}
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Anomaly Detection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🚨 Anomaly Detection
            </h2>
            {analytics.anomalies ? (
              <div>
                {analytics.anomalies.anomalies && analytics.anomalies.anomalies.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.anomalies.anomalies.map((anomaly, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">Unusual Expense Detected</p>
                        <p className="text-sm text-red-600">
                          Amount: ₹{anomaly.amount?.toLocaleString()}
                          {anomaly.category && ` | Category: ${anomaly.category}`}
                          {anomaly.date && ` | Date: ${new Date(anomaly.date).toLocaleDateString()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700">✅ No unusual spending patterns detected</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Add more expenses to detect anomalies</p>
            )}
          </div>

          {/* Category Breakdown */}
          {stats && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">📊 This Month's Category Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stats.categoryBreakdown).map(([category, amount]) => (
                  <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 capitalize">{category}</p>
                    <p className="text-lg font-bold text-gray-900">₹{amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {((amount / stats.totalThisMonth) * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchAnalytics}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
          >
            🔄 Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
