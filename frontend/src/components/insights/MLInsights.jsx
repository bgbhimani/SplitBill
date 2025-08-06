import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const MLInsights = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState({
    predictions: null,
    budgetRecommendations: null,
    anomalies: null,
    loading: true,
    error: null
  });

  // Simple test function to check ML service connectivity
  const testMLService = async () => {
    try {
      const response = await fetch('http://localhost:5001/predict_category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expense_title: 'coffee' })
      });
      
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const fetchMLInsights = async () => {
    try {
      setInsights(prev => ({ ...prev, loading: true, error: null }));
      
      // Test ML service first
      const isMLServiceWorking = await testMLService();
      
      if (!isMLServiceWorking) {
        setInsights(prev => ({
          ...prev,
          loading: false,
          error: 'ML service is not running. Please start the ML server on port 5001.'
        }));
        return;
      }

      if (!user?._id) {
        setInsights(prev => ({
          ...prev,
          loading: false,
          error: 'User ID not available'
        }));
        return;
      }

      // Test individual ML endpoints
      const predictions = await fetch(`http://localhost:5001/predict/${user._id}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null);

      const budgetRecs = await fetch(`http://localhost:5001/budget/${user._id}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null);

      const anomalies = await fetch(`http://localhost:5001/anomaly/${user._id}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null);

      setInsights({
        predictions,
        budgetRecommendations: budgetRecs,
        anomalies,
        loading: false,
        error: null
      });

    } catch (error) {
      setInsights(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load insights. Please try again later.'
      }));
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchMLInsights();
    } else {
      setInsights(prev => ({
        ...prev,
        loading: false,
        error: 'Please log in to see AI insights'
      }));
    }
  }, [user]);

  if (insights.loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">🤖 AI Insights</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🤖 AI Insights</h3>
        <button
          onClick={fetchMLInsights}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {insights.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="font-medium">Error:</div>
          <div>{insights.error}</div>
        </div>
      )}

      <div className="space-y-6">
        {/* Expense Predictions */}
        {insights.predictions && (
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">📈 Expense Forecast</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Next Week</p>
                <p className="text-lg font-semibold text-blue-700">
                  ₹{insights.predictions.prediction?.next_week_total_expense?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Next Month</p>
                <p className="text-lg font-semibold text-blue-700">
                  ₹{insights.predictions.prediction?.next_month_total_expense?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Recommendations */}
        {insights.budgetRecommendations && (
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">💡 Budget Recommendations</h4>
            {insights.budgetRecommendations.note && (
              <p className="text-sm text-yellow-600 mb-2">
                ⚠️ {insights.budgetRecommendations.note}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(insights.budgetRecommendations.expense_recommendation || {}).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center bg-green-50 p-2 rounded">
                  <span className="text-sm text-gray-700 capitalize">{category}</span>
                  <span className="text-sm font-medium text-green-700">₹{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomaly Detection */}
        {insights.anomalies && (
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-medium text-gray-900 mb-2">🚨 Anomaly Detection</h4>
            {insights.anomalies.anomalies && insights.anomalies.anomalies.length > 0 ? (
              <div className="space-y-2">
                {insights.anomalies.anomalies.map((anomaly, index) => (
                  <div key={index} className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700">
                      Unusual expense detected: ₹{anomaly.amount?.toLocaleString()} 
                      {anomaly.category && ` in ${anomaly.category}`}
                      {anomaly.date && ` on ${new Date(anomaly.date).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✅ No unusual spending patterns detected
              </p>
            )}
          </div>
        )}

        {/* No data message */}
        {!insights.predictions && !insights.budgetRecommendations && !insights.anomalies && !insights.error && (
          <div className="text-center py-8 text-gray-500">
            <p>Start adding personal expenses to see AI insights!</p>
            <p className="text-sm mt-2">You need at least 10 expenses for predictions to work.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MLInsights;
