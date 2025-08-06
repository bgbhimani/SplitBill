
const PersonalExpense = require('../models/PersonalExpense');
// Optional: If you implement activity logging
// const Activity = require('../models/Activity');

// Helper function to handle common Mongoose errors
const handleMongooseError = (res, error) => {
    console.error('Mongoose Error (PersonalExpense):', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: `Invalid ID format for ${error.path}: ${error.value}` });
    }
    res.status(500).json({ message: 'Server error' });
};

// @desc    Add a new personal expense
// @route   POST /api/personal-expenses
// @access  Private
const addPersonalExpense = async (req, res) => {
    const { description, amount, date, type, notes, category } = req.body;
    const userId = req.user._id; // The authenticated user is the one adding the expense

    try {
        const newPersonalExpense = new PersonalExpense({
            userId,
            description,
            amount,
            date: date || Date.now(),
            notes,
            type,
            category
        });

        const savedPersonalExpense = await newPersonalExpense.save();

        // Optional: Log activity
        // await Activity.create({
        //     type: 'personal_expense_added',
        //     actor: userId,
        //     targetId: savedPersonalExpense._id,
        //     targetModel: 'PersonalExpense',
        //     description: `${req.user.username} added a personal expense: ${description} for $${amount}`
        // });

        res.status(201).json(savedPersonalExpense);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get all personal expenses for the authenticated user
// @route   GET /api/personal-expenses
// @access  Private
const getMyPersonalExpenses = async (req, res) => {
    const userId = req.user._id;

    try {
        const expenses = await PersonalExpense.find({ userId })
                                            .sort({ date: -1, createdAt: -1 }); // Newest first

        res.status(200).json(expenses);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get a single personal expense by ID
// @route   GET /api/personal-expenses/:id
// @access  Private
const getPersonalExpenseById = async (req, res) => {
    try {
        const expense = await PersonalExpense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Personal expense not found.' });
        }

        // Ensure the authenticated user owns this personal expense
        if (!expense.userId.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to view this personal expense.' });
        }

        res.status(200).json(expense);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Update an existing personal expense
// @route   PUT /api/personal-expenses/:id
// @access  Private
const updatePersonalExpense = async (req, res) => {
    const { description, amount, date, notes, category } = req.body;
    const userId = req.user._id;

    try {
        let expense = await PersonalExpense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Personal expense not found.' });
        }

        // Ensure the authenticated user owns this personal expense
        if (!expense.userId.equals(userId)) {
            return res.status(403).json({ message: 'Not authorized to update this personal expense.' });
        }

        expense.description = description !== undefined ? description : expense.description;
        expense.amount = amount !== undefined ? amount : expense.amount;
        expense.date = date !== undefined ? date : expense.date;
        expense.notes = notes !== undefined ? notes : expense.notes;
        expense.category = category !== undefined ? category : expense.category;
        expense.updatedAt = Date.now();

        const updatedExpense = await expense.save();

        // Optional: Log activity
        // await Activity.create({
        //     type: 'personal_expense_edited',
        //     actor: userId,
        //     targetId: updatedExpense._id,
        //     targetModel: 'PersonalExpense',
        //     description: `${req.user.username} updated personal expense: ${updatedExpense.description}`
        // });

        res.status(200).json(updatedExpense);
    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Delete a personal expense
// @route   DELETE /api/personal-expenses/:id
// @access  Private
const deletePersonalExpense = async (req, res) => {
    const userId = req.user._id;

    try {
        const expense = await PersonalExpense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Personal expense not found.' });
        }

        // Ensure the authenticated user owns this personal expense
        if (!expense.userId.equals(userId)) {
            return res.status(403).json({ message: 'Not authorized to delete this personal expense.' });
        }

        await expense.deleteOne();

        // Optional: Log activity
        // await Activity.create({
        //     type: 'personal_expense_deleted',
        //     actor: userId,
        //     targetId: expense._id,
        //     targetModel: 'PersonalExpense',
        //     description: `${req.user.username} deleted personal expense: ${expense.description}`
        // });

        res.status(200).json({ message: 'Personal expense removed.' });
    } catch (error) {
        handleMongooseError(res, error);
    }
};

module.exports = {
    addPersonalExpense,
    getMyPersonalExpenses,
    getPersonalExpenseById,
    updatePersonalExpense,
    deletePersonalExpense
};