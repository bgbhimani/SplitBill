const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is populated by the protect middleware
    if (req.user) {
        res.json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            defaultCurrency: req.user.defaultCurrency,
            // Add other user fields you want to expose
        });
    } else {
        // This case should ideally not be reached if protect middleware works correctly
        res.status(404).json({ message: 'User not found or not authenticated.' });
    }
};

module.exports = {
    getMe
};