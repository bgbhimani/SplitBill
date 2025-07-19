const express = require('express');
const {
    createGroup,
    getMyGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    addGroupMembers,
    removeGroupMembers
} = require('../controllers/groupController');
const { getGroupExpenses } = require('../controllers/expenseController'); // <-- Import getGroupExpenses here!
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All group routes require authentication
router.use(protect);

router.post('/', createGroup);
router.get('/', getMyGroups);
router.get('/:id', getGroupById);
router.get('/:id/expenses', getGroupExpenses); // <-- Add this route for getting expenses by group ID
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.put('/:id/members', addGroupMembers);
router.put('/:id/remove-members', removeGroupMembers);

module.exports = router;