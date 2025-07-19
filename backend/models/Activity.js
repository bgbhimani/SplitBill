const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    type: { // e.g., "expense_added", "payment_made", "group_created", "user_joined_group"
        type: String,
        required: true,
        enum: ['expense_added', 'payment_made', 'group_created', 'user_joined_group', 'group_deleted', 'expense_edited', 'expense_deleted']
    },
    actor: { // The user who performed the action
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetId: { // Optional: ID of the document affected (e.g., Expense ID, Group ID)
        type: Schema.Types.ObjectId,
        // No ref here, as it could refer to different collections (Expense, Group, User)
    },
    targetModel: { // Optional: Model name of the targetId
        type: String,
        enum: ['Expense', 'Group', 'User']
    },
    groupId: { // Optional: If the activity is related to a specific group
        type: Schema.Types.ObjectId,
        ref: 'Group'
    },
    description: { // A human-readable message for the activity feed
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', ActivitySchema);