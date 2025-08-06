import axios from 'axios';

// Create axios instance for ML service
const mlAPI = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ML API functions
export const mlServices = {
  // Expense Category Prediction
  predictCategory: async (expenseTitle) => {
    try {
      const response = await mlAPI.post('/predict_category', {
        expense_title: expenseTitle
      });
      return response.data;
    } catch (error) {
      console.error('Error predicting category:', error);
      throw error;
    }
  },

  // Expense Forecasting for specific user
  predictExpenses: async (userId) => {
    try {
      const response = await mlAPI.get(`/predict/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error predicting expenses:', error);
      throw error;
    }
  },

  // Budget Recommendations for specific user
  getBudgetRecommendations: async (userId) => {
    try {
      const response = await mlAPI.get(`/budget/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting budget recommendations:', error);
      throw error;
    }
  },

  // Anomaly Detection for specific user
  detectAnomalies: async (userId) => {
    try {
      const response = await mlAPI.get(`/anomaly/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  },

  // Legacy forecast endpoint (if you want to keep it)
  getForecast: async () => {
    try {
      const response = await mlAPI.get('/forecast_expenses');
      return response.data;
    } catch (error) {
      console.error('Error getting forecast:', error);
      throw error;
    }
  }
};

export default mlServices;
