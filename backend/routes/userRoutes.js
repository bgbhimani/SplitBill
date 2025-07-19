const express = require('express');
const { getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Import your middleware

const router = express.Router();

// Apply the 'protect' middleware to this route
router.get('/me', protect, getMe);

module.exports = router;