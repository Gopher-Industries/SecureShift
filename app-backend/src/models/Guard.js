const mongoose = require('mongoose');
const User = require('./User'); // Import the base User model

// Additional fields for the 'guard' role
const guardSchema = new mongoose.Schema(
    {
        licenseNumber: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (value) {
                    // Allow only letters and numbers, no spaces or symbols
                    return /^[A-Za-z0-9]+$/.test(value);
                },
                message:
                'License number must only contain letters and numbers (no spaces or symbols).',
            },
    },

        licenseExpiry: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return value > new Date();
                },
                message: 'License expiry date must be in the future.',
            },
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        numberOfReviews: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
    timestamps: true,
    }
);

const Guard = User.discriminator('guard', guardSchema);
module.exports = Guard;