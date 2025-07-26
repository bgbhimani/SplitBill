// server/server.js
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const personalExpenseRoutes = require('./routes/personalExpenseRoutes');
const cors = require('cors');

// Load environment variables (ensure this is first after initial requires)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate environment variables and connect to DB
validateEnv();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  // origin: 'http://localhost:5173',
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/', balanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/personal-expenses', personalExpenseRoutes);

// Basic test route (optional, can remove later)
app.get('/', (req, res) => {
    res.send('Splitwise Clone API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,() => {
    console.log(`Server running on port ${PORT}`);
});