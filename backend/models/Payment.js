const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    payer: { // The user who made the payment
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payee: { // The user who received the payment
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please specify payment amount'],
        min: 0.01
    },
    groupId: { // Optional: if payment is specifically for a group debt
        type: Schema.Types.ObjectId,
        ref: 'Group'
    },
    date: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);