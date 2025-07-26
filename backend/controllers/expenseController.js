const Expense = require('../models/Expense');
const Group = require('../models/Group'); // Needed to validate groupId and member IDs
const User = require('../models/User'); // Used for validating user IDs within shares/paidBy

// Helper function to handle common Mongoose errors
const handleMongooseError = (res, error) => {
    console.error('Mongoose Error (Expense):', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    // Handle specific cast errors for ObjectIDs more gracefully
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: `Invalid ID format for ${error.path}: ${error.value}` });
    }
    res.status(500).json({ message: 'Server error' });
};

// @desc    Add a new expense within a group
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
    const { groupId, description, amount, paidBy, splitType, shares, date, notes, category } = req.body;
    const currentUserId = req.user._id; // User making the request (authenticated user)

    try {
        // 1. Validate Group Existence and Current User Membership
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        if (!group.members.some(memberId => memberId.equals(currentUserId))) {
            return res.status(403).json({ message: 'Not authorized to add expenses to this group.' });
        }

        // 2. Validate 'paidBy' User (must be a member of the group)
        if (!group.members.some(memberId => memberId.equals(paidBy))) {
            return res.status(400).json({ message: 'The user who paid must be a member of the group.' });
        }

        // 3. Validate 'shares' array (users must be group members, amounts must sum correctly)
        if (!shares || !Array.isArray(shares) || shares.length === 0) {
            return res.status(400).json({ message: 'Expense must have at least one share.' });
        }

        let totalShareAmount = 0;
        for (const share of shares) {
            if (!share.userId || typeof share.amount !== 'number' || share.amount < 0) {
                return res.status(400).json({ message: 'Each share must have a valid userId and a non-negative amount.' });
            }
            if (!group.members.some(memberId => memberId.equals(share.userId))) {
                return res.status(400).json({ message: `Share user ${share.userId} is not a member of this group.` });
            }
            // For percentage split, 'amount' in shares might be the percentage, and the actual monetary amount would be calculated here.
            // For now, assume 'amount' is the final value (for 'exact' or pre-calculated 'equal').
            totalShareAmount += share.amount;
        }

        // Ensure sum of shares matches total amount (allowing for tiny floating point discrepancies)
        if (Math.abs(totalShareAmount - amount) > 0.01) { // 0.01 tolerance for floating point arithmetic
            return res.status(400).json({ message: 'Sum of shares does not match total expense amount.' });
        }

        const newExpense = new Expense({
            groupId,
            description,
            amount,
            paidBy,
            splitType,
            shares,
            date: date || Date.now(), // Allow setting custom date, default to now
            notes,
            category
        });

        const savedExpense = await newExpense.save();

        // Optional: Log activity
        // await Activity.create({
        //     type: 'expense_added',
        //     actor: currentUserId,
        //     targetId: savedExpense._id,
        //     targetModel: 'Expense',
        //     groupId: groupId,
        //     description: `${req.user.username} added an expense: ${description} for $${amount}`
        // });

        res.status(201).json(savedExpense);

    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get all expenses for a specific group
// @route   GET /api/groups/:id/expenses
// @access  Private
const getGroupExpenses = async (req, res) => {
    const groupId = req.params.id; // Changed from req.params.groupId to req.params.id
    const currentUserId = req.user._id;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        // Ensure user is a member of the group to view its expenses
        if (!group.members.some(memberId => memberId.equals(currentUserId))) {
            return res.status(403).json({ message: 'Not authorized to view expenses for this group.' });
        }

        const expenses = await Expense.find({ groupId })
                                      .populate('paidBy', 'username email firstName lastName') // Populate who paid
                                      .populate('shares.userId', 'username email firstName lastName') // Populate users in shares
                                      .sort({ date: -1, createdAt: -1 }); // Newest first

        res.status(200).json(expenses);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get a single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
                                    .populate('paidBy', 'username email firstName lastName')
                                    .populate('shares.userId', 'username email firstName lastName');

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found.' });
        }

        // Ensure the user is a member of the group this expense belongs to
        const group = await Group.findById(expense.groupId);
        if (!group || !group.members.some(memberId => memberId.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not authorized to view this expense.' });
        }

        res.status(200).json(expense);
    } catch (error) {
        handleMongooseError(res, error);
    }
};


// @desc    Update an existing expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    const { description, amount, paidBy, splitType, shares, date, notes, category } = req.body;
    const currentUserId = req.user._id;

    try {
        let expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found.' });
        }

        // Only the user who created the expense can update it (or group admin, optional)
        if (!expense.paidBy.equals(currentUserId)) {
            // OPTIONAL: You could also check if req.user._id is the group admin
            // const group = await Group.findById(expense.groupId);
            // if (!group.admin.equals(currentUserId)) {
            //      return res.status(403).json({ message: 'Not authorized to update this expense.' });
            // }
            return res.status(403).json({ message: 'Not authorized to update this expense.' });
        }

        // Re-validate group and members if paidBy or shares change
        const group = await Group.findById(expense.groupId);
        if (!group) { // Should ideally not happen if expense exists and has a valid groupId
            return res.status(404).json({ message: 'Associated group not found.' });
        }

        if (paidBy && !group.members.some(memberId => memberId.equals(paidBy))) {
            return res.status(400).json({ message: 'The new payer must be a member of the group.' });
        }

        let newTotalShareAmount = 0;
        if (shares) {
            if (!Array.isArray(shares) || shares.length === 0) {
                 return res.status(400).json({ message: 'Updated shares must be a non-empty array.' });
            }
            for (const share of shares) {
                if (!share.userId || typeof share.amount !== 'number' || share.amount < 0) {
                    return res.status(400).json({ message: 'Each updated share must have a valid userId and a non-negative amount.' });
                }
                if (!group.members.some(memberId => memberId.equals(share.userId))) {
                    return res.status(400).json({ message: `Updated share user ${share.userId} is not a member of this group.` });
                }
                newTotalShareAmount += share.amount;
            }
            // Check if updated total amount (if provided) matches sum of new shares
            // If 'amount' in req.body is provided, use that for comparison, otherwise use the existing expense.amount
            const finalAmountForComparison = amount !== undefined ? amount : expense.amount;
            if (Math.abs(newTotalShareAmount - finalAmountForComparison) > 0.01) {
                return res.status(400).json({ message: 'Sum of new shares does not match total expense amount.' });
            }
        }

        // Update fields (use provided value or keep existing)
        expense.description = description !== undefined ? description : expense.description;
        expense.amount = amount !== undefined ? amount : expense.amount;
        expense.paidBy = paidBy !== undefined ? paidBy : expense.paidBy;
        expense.splitType = splitType !== undefined ? splitType : expense.splitType;
        expense.shares = shares !== undefined ? shares : expense.shares;
        expense.date = date !== undefined ? date : expense.date;
        expense.notes = notes !== undefined ? notes : expense.notes;
        expense.category = category !== undefined ? category : expense.category;
        expense.updatedAt = Date.now();

        const updatedExpense = await expense.save();

        // Optional: Log activity
        // await Activity.create({
        //     type: 'expense_edited',
        //     actor: currentUserId,
        //     targetId: updatedExpense._id,
        //     targetModel: 'Expense',
        //     groupId: updatedExpense.groupId,
        //     description: `${req.user.username} updated expense: ${updatedExpense.description}`
        // });

        res.status(200).json(updatedExpense);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    const currentUserId = req.user._id;

    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found.' });
        }

        // Only the user who created the expense can delete it (or group admin, optional)
        if (!expense.paidBy.equals(currentUserId)) {
            // OPTIONAL: You could also check if req.user._id is the group admin
            // const group = await Group.findById(expense.groupId);
            // if (!group.admin.equals(currentUserId)) {
            //      return res.status(403).json({ message: 'Not authorized to delete this expense.' });
            // }
            return res.status(403).json({ message: 'Not authorized to delete this expense.' });
        }

        await expense.deleteOne();

        // Optional: Log activity
        // await Activity.create({
        //     type: 'expense_deleted',
        //     actor: currentUserId,
        //     targetId: expense._id,
        //     targetModel: 'Expense',
        //     groupId: expense.groupId,
        //     description: `${req.user.username} deleted expense: ${expense.description}`
        // });

        res.status(200).json({ message: 'Expense removed.' });
    } catch (error) {
        handleMongooseError(res, error);
    }
};


module.exports = {
    addExpense,
    getGroupExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense
};