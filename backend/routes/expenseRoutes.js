const express = require('express');
const {
    addExpense,
    getExpenseById,
    updateExpense,
    deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware'); // All expense routes are protected

const router = express.Router();

// All expense routes require authentication
router.use(protect);

router.post('/', addExpense);         // Create a new expense
router.get('/:id', getExpenseById);   // Get a specific expense by ID
router.put('/:id', updateExpense);    // Update an expense
router.delete('/:id', deleteExpense); // Delete an expense

module.exports = router;