// server/models/PersonalExpense.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PersonalExpenseSchema = new Schema({
    userId: { // The user who incurred this personal expense
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description for the personal expense'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
        min: 0.01
    },
    date: { // When the expense occurred
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    category: { // e.g., "Food", "Transport", "Shopping", "Bills"
        type: String,
        trim: true,
        default: 'Other'
    },
    type: {
        type: String,
        trim: true,
        default: 'debit'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model('PersonalExpense', PersonalExpenseSchema);