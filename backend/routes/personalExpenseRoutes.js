// server/routes/personalExpenseRoutes.js
const express = require('express');
const {
    addPersonalExpense,
    getMyPersonalExpenses,
    getPersonalExpenseById,
    updatePersonalExpense,
    deletePersonalExpense
} = require('../controllers/personalExpenseController');
const { protect } = require('../middleware/authMiddleware'); // All personal expense routes are protected

const router = express.Router();

// All personal expense routes require authentication
router.use(protect);

router.post('/', addPersonalExpense);           // Add a new personal expense
router.get('/', getMyPersonalExpenses);         // Get all personal expenses for the user
router.get('/:id', getPersonalExpenseById);     // Get a specific personal expense by ID
router.put('/:id', updatePersonalExpense);      // Update a personal expense
router.delete('/:id', deletePersonalExpense);   // Delete a personal expense

module.exports = router;