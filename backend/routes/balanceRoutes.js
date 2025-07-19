const express = require('express');
const {
    getGroupBalances,
    getSimplifiedDebts,
    recordPayment
} = require('../controllers/balanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All balance and payment routes require authentication
router.use(protect);

// Group-specific balance routes (nested under /api/groups)
// These will be mounted directly in server.js or groupRoutes.js
// For now, let's include them as a separate set of routes to be clear.
// Actual endpoint will be /api/groups/:groupId/balances
// Actual endpoint will be /api/groups/:groupId/simplify-debts

// Payment routes
router.post('/payments', recordPayment); // Record a new payment

// You might consider adding a route for general payments (not tied to a group) here:
// router.get('/payments', getAllMyPayments);

module.exports = router;