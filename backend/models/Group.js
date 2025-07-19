const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please add a group name'],
        trim: true,
        minlength: 2
    },
    type: { // e.g., "Trip", "Home", "Couple", "Other"
        type: String,
        enum: ['Trip', 'Home', 'Couple', 'Other'],
        default: 'Other'
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User', // References the User model
            required: true
        }
    ],
    admin: { // The user who created the group or has admin privileges
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    simplifyDebts: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Group', GroupSchema);