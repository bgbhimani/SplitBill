const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group', // References the Group model
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description for the expense'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
        min: 0.01 // Expense must be at least 0.01
    },
    paidBy: {
        type: Schema.Types.ObjectId,
        ref: 'User', // References the User who paid
        required: true
    },
    splitType: { // e.g., "equal", "exact", "percentage"
        type: String,
        required: [true, 'Please specify a split type'],
        enum: ['equal', 'exact', 'percentage']
    },
    shares: [ // Defines how the expense is split among members
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            // For 'equal' and 'exact' split types, this is the amount owed by the user
            // For 'percentage' split type, this is the percentage, and actual amount will be calculated
            amount: {
                type: Number,
                required: true,
                min: 0 // Amount owed can be 0 (e.g., if someone is excluded)
            },
            // Optional: only used for 'percentage' split type
            percentage: {
                type: Number,
                min: 0,
                max: 100
            }
        }
    ],
    date: { // When the expense occurred
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    category: { // e.g., "Food", "Travel", "Utilities", "Shopping", "Entertainment"
        type: String,
        trim: true,
        default: 'Other'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);