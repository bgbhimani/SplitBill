// server/server.js
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes'); // <-- Ensure this is imported

// Load environment variables (ensure this is first after initial requires)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate environment variables and connect to DB
validateEnv();
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes); // This now also handles /api/groups/:id/expenses
app.use('/api/expenses', expenseRoutes); // This handles /api/expenses, /api/expenses/:id etc.

// Basic test route (optional, can remove later)
app.get('/', (req, res) => {
    res.send('Splitwise Clone API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});