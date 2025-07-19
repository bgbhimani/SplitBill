const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Add this line
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate environment variables first
// Call this after dotenv.config()
validateEnv();

// Connect to MongoDB
connectDB();

// Initialize Express app AFTER all configurations and imports
const app = express(); // <-- FIX: Declare and initialize 'app' here

// Middleware to parse JSON bodies
app.use(express.json());

// Mount Auth Routes
app.use('/api/auth', authRoutes); // This tells Express to use authRoutes for any requests starting with /api/auth
app.use('/api/users', userRoutes); // All routes starting with /api/users will use userRoutes

// Basic route for testing (keep for now)
app.get('/', (req, res) => {
    res.send('Splitwise Clone API is running...');
});

// Define PORT and start listening
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});