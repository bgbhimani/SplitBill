const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import your User model

const protect = async (req, res, next) => {
    let token;

    // Check if the Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer YOUR_TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user by ID from the token payload and attach to request object
            // .select('-password') ensures password is not returned
            req.user = await User.findById(decoded.id).select('-password');

            // If user is not found (e.g., deleted), throw an error
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/controller
        } catch (error) {
            console.error('Token verification error:', error); // Log the actual error for debugging
            // Specific error messages for client
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
            return res.status(401).json({ message: 'Not authorized, token invalid' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };