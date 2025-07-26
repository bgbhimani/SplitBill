import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/users/me'),
};

// Groups API functions
export const groupsAPI = {
  createGroup: (groupData) => api.post('/groups', groupData),
  getMyGroups: () => api.get('/groups'),
  getGroupById: (groupId) => api.get(`/groups/${groupId}`),
  updateGroup: (groupId, updateData) => api.put(`/groups/${groupId}`, updateData),
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
  addMembers: (groupId, memberIdentifiers) => api.put(`/groups/${groupId}/members`, { newMemberIdentifiers: memberIdentifiers }),
  removeMembers: (groupId, memberIds) => api.put(`/groups/${groupId}/remove-members`, { memberIdsToRemove: memberIds }),
  getGroupExpenses: (groupId) => api.get(`/groups/${groupId}/expenses`),
  getGroupBalances: (groupId) => api.get(`/groups/${groupId}/balances`),
  getSimplifiedDebts: (groupId) => api.get(`/groups/${groupId}/simplify-debts`),
};

// Expenses API functions
export const expensesAPI = {
  addExpense: (expenseData) => api.post('/expenses', expenseData),
  getExpenseById: (expenseId) => api.get(`/expenses/${expenseId}`),
  updateExpense: (expenseId, updateData) => api.put(`/expenses/${expenseId}`, updateData),
  deleteExpense: (expenseId) => api.delete(`/expenses/${expenseId}`),
};

// Payments API functions
export const paymentsAPI = {
  recordPayment: (paymentData) => api.post('/payments', paymentData),
};

export default api;
