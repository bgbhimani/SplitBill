const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const Payment = require('../models/Payment'); // Make sure you have this model defined

// Helper function to handle common Mongoose errors
const handleMongooseError = (res, error) => {
    console.error('Mongoose Error (Balance/Payment):', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: `Invalid ID format for ${error.path}: ${error.value}` });
    }
    res.status(500).json({ message: 'Server error' });
};

/**
 * Calculates raw balances (what each user paid vs. what they owe) for a given group.
 * This is an internal helper function.
 * @param {ObjectId} groupId
 * @returns {Map<string, number>} A map where key is userId (string) and value is net balance.
 * Positive balance means user is owed money, negative means they owe.
 */
const calculateRawBalances = async (groupId) => {
    const balances = new Map(); // Map<userId (string), balance (number)>

    // Fetch all expenses for the group
    const expenses = await Expense.find({ groupId });

    // Populate members of the group to ensure all members are accounted for, even if they have no expenses
    const group = await Group.findById(groupId).populate('members', '_id');
    if (group) {
        group.members.forEach(member => {
            balances.set(member._id.toString(), 0); // Initialize all members to 0 balance
        });
    }


    for (const expense of expenses) {
        const paidBy = expense.paidBy.toString();
        const amount = expense.amount;

        // User who paid gets credited the full amount
        balances.set(paidBy, (balances.get(paidBy) || 0) + amount);

        // Each user in shares owes their respective share amount
        for (const share of expense.shares) {
            const userId = share.userId.toString();
            const shareAmount = share.amount;
            balances.set(userId, (balances.get(userId) || 0) - shareAmount);
        }
    }

    // Fetch all payments/settlements within the group
    const payments = await Payment.find({ groupId });
    for (const payment of payments) {
        const payer = payment.payer.toString();
        const payee = payment.payee.toString();
        const amount = payment.amount;

        // Payer's balance decreases (they paid money)
        balances.set(payer, (balances.get(payer) || 0) - amount);
        // Payee's balance increases (they received money)
        balances.set(payee, (balances.get(payee) || 0) + amount);
    }

    return balances;
};

/**
 * Simplifies debts to minimize the number of transactions.
 * This is an internal helper function (simplified version of a min-cash-flow algorithm).
 * @param {Map<string, number>} balances
 * @returns {Array<Object>} An array of suggested payments: [{ from: userId, to: userId, amount: number }]
 */
const simplifyDebts = (balances) => {
    const payers = []; // Users with negative balance (owe money)
    const payees = []; // Users with positive balance (are owed money)

    // Separate users into payers and payees
    for (const [userId, balance] of balances.entries()) {
        if (balance < 0) {
            payers.push({ userId, amount: -balance }); // amount is how much they owe
        } else if (balance > 0) {
            payees.push({ userId, amount: balance }); // amount is how much they are owed
        }
    }

    const settlements = [];

    // Simple greedy approach (can be optimized for minimal transactions)
    // Iterate while both payers and payees lists are not empty
    let i = 0, j = 0;
    while (i < payers.length && j < payees.length) {
        const payer = payers[i];
        const payee = payees[j];

        const settledAmount = Math.min(payer.amount, payee.amount);

        settlements.push({
            from: payer.userId,
            to: payee.userId,
            amount: settledAmount
        });

        payer.amount -= settledAmount;
        payee.amount -= settledAmount;

        if (payer.amount === 0) {
            i++; // This payer has settled all their debt
        }
        if (payee.amount === 0) {
            j++; // This payee has received all their due
        }
    }

    return settlements;
};


// @desc    Get current balances for all members within a group
// @route   GET /api/groups/:groupId/balances
// @access  Private
const getGroupBalances = async (req, res) => {
    const { groupId } = req.params;
    const currentUserId = req.user._id;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        if (!group.members.some(memberId => memberId.equals(currentUserId))) {
            return res.status(403).json({ message: 'Not authorized to view balances for this group.' });
        }

        const rawBalances = await calculateRawBalances(groupId);

        // Convert Map to an array of objects for API response
        const formattedBalances = Array.from(rawBalances.entries()).map(([userId, balance]) => ({
            userId,
            balance: parseFloat(balance.toFixed(2)) // Format to 2 decimal places
        }));

        res.status(200).json(formattedBalances);

    } catch (error) {
        handleMongooseError(res, error);
    }
};

// @desc    Get simplified debt suggestions for a group
// @route   GET /api/groups/:groupId/simplify-debts
// @access  Private
const getSimplifiedDebts = async (req, res) => {
    const { groupId } = req.params;
    const currentUserId = req.user._id;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        if (!group.members.some(memberId => memberId.equals(currentUserId))) {
            return res.status(403).json({ message: 'Not authorized to view simplified debts for this group.' });
        }

        if (!group.simplifyDebts) {
            return res.status(200).json({ message: 'Debt simplification is disabled for this group.', settlements: [] });
        }

        const rawBalances = await calculateRawBalances(groupId);
        const simplifiedSettlements = simplifyDebts(rawBalances);

        // Populate user details for simplified settlements
        const userIds = new Set();
        simplifiedSettlements.forEach(s => {
            userIds.add(s.from);
            userIds.add(s.to);
        });

        const usersMap = new Map();
        if (userIds.size > 0) {
            const users = await User.find({ '_id': { $in: Array.from(userIds) } }).select('username firstName lastName');
            users.forEach(user => usersMap.set(user._id.toString(), user));
        }

        const populatedSettlements = simplifiedSettlements.map(s => ({
            from: usersMap.get(s.from) || s.from, // Populate if found, else keep ID
            to: usersMap.get(s.to) || s.to,
            amount: parseFloat(s.amount.toFixed(2))
        }));

        res.status(200).json(populatedSettlements);

    } catch (error) {
        handleMongooseError(res, error);
    }
};


// @desc    Record a payment/settlement between two users within a group
// @route   POST /api/payments
// @access  Private
const recordPayment = async (req, res) => {
    const { payer, payee, amount, groupId, notes } = req.body;
    const currentUserId = req.user._id;

    try {
        // Validate that payer and payee are distinct
        if (payer === payee) {
            return res.status(400).json({ message: 'Payer and Payee cannot be the same user.' });
        }

        // Validate group existence and current user's membership (if groupId is provided)
        let group;
        if (groupId) {
            group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Group not found for this payment.' });
            }
            if (!group.members.some(memberId => memberId.equals(currentUserId))) {
                return res.status(403).json({ message: 'Not authorized to record payments in this group.' });
            }
            // Ensure both payer and payee are members of the specified group
            if (!group.members.some(memberId => memberId.equals(payer)) || !group.members.some(memberId => memberId.equals(payee))) {
                 return res.status(400).json({ message: 'Both payer and payee must be members of the specified group.' });
            }
        } else {
             // For general payments not tied to a specific group, ensure current user is either payer or payee
             if (!currentUserId.equals(payer) && !currentUserId.equals(payee)) {
                 return res.status(403).json({ message: 'Not authorized to record this payment.' });
             }
             // Ensure payer and payee are valid users
             const [payerUser, payeeUser] = await Promise.all([User.findById(payer), User.findById(payee)]);
             if (!payerUser || !payeeUser) {
                 return res.status(400).json({ message: 'Invalid Payer or Payee User ID provided.' });
             }
        }


        const newPayment = new Payment({
            payer,
            payee,
            amount,
            groupId, // Will be null if not provided
            notes
        });

        const savedPayment = await newPayment.save();

        // Optional: Log activity
        // await Activity.create({
        //     type: 'payment_made',
        //     actor: currentUserId,
        //     targetId: savedPayment._id,
        //     targetModel: 'Payment',
        //     groupId: groupId,
        //     description: `${req.user.username} recorded a payment: ${payer} paid ${payee} $${amount}`
        // });

        res.status(201).json(savedPayment);

    } catch (error) {
        handleMongooseError(res, error);
    }
};

module.exports = {
    getGroupBalances,
    getSimplifiedDebts,
    recordPayment,
    // You might add functions for getting all payments for a user or group later
};