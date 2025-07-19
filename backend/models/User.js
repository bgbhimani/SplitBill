const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Add this line
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Don't return password by default when querying users
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: { // URL to profile picture
        type: String,
        default: 'https://www.gravatar.com/avatar/?d=mp' // Default gravatar for generic avatar
    },
    defaultCurrency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP'] // Example common currencies
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});
// Hash password before saving the user
UserSchema.pre('save', async function(next) {
    // Only hash if the password has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    // Generate a salt
    const salt = await bcrypt.genSalt(10); // 10 is the number of rounds, a good balance between security and performance

    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


module.exports = mongoose.model('User', UserSchema);