const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate essential environment variables
const validateEnv = () => {
    const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            console.error(`Error: Environment variable ${varName} is not defined.`);
            process.exit(1);
        }
    }
    console.log('Environment variables loaded and validated.');
};

module.exports = { validateEnv };