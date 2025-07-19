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
const { getGroupExpenses } = require('../controllers/expenseController');
const {
    getGroupBalances, // <-- Import for group-specific balances
    getSimplifiedDebts // <-- Import for simplified debts
} = require('../controllers/balanceController'); // <-- Import balance controller
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect); // All group routes require authentication

router.post('/', createGroup);
router.get('/', getMyGroups);
router.get('/:id', getGroupById);
router.get('/:id/expenses', getGroupExpenses);
router.get('/:id/balances', getGroupBalances); // <-- New: Get balances for a group
router.get('/:id/simplify-debts', getSimplifiedDebts); // <-- New: Get simplified debts for a group
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.put('/:id/members', addGroupMembers);
router.put('/:id/remove-members', removeGroupMembers);

module.exports = router;