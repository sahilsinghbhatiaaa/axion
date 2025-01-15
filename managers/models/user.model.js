const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Custom function to generate a 10-character unique ID
const generateShortUUID = () => uuidv4().replace(/-/g, '').slice(0, 10);

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        default: generateShortUUID, // Generate a 10-character unique ID
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'readonly'],
        default: 'readonly',
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
},
{
    versionKey: false 
});

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to validate the password
userSchema.methods.isValidPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
