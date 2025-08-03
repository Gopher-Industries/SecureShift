const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            validate: {
                validator: function (value) {
                    return /^[A-Za-z0-9\s\-]+$/.test(value);
                },
                message: 'Title must only contain letters, numbers, spaces, and dashes.',
            },
        },

        date: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    const inputDate = new Date(value);
                    const today = new Date();

                    inputDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);

                    return inputDate >= today;
                },
                message: 'Shift date must be today or a future date.',
            },
        },

        startTime: {
            type: String,
            required: true,
            validate: {
                validator: function (value) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
                },
                message: 'Start time must be in 24-hour HH:MM format.',
            },
        },

        endTime: {
            type: String,
            required: true,
            validate: {
                validator: function (value) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
                },
                message: 'End time must be in 24-hour HH:MM format.',
            },
        },

        location: {
            street: { type: String, trim: true },
            suburb: { type: String, trim: true },
            state: { type: String, trim: true },
            postcode: {
                type: String,
                validate: {
                    validator: function (value) {
                        return /^\d{4}$/.test(value); // Australian postcode: exactly 4 digits
                    },
                    message: 'Postcode must be a 4-digit number.',
                },
            },
        },
        
        status: {
            type: String,
            enum: ['open', 'assigned', 'completed'],
            default: 'open',
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // should be an employer
            required: true,
        },

        urgency: {
            type: String,
            enum: ['normal', 'priority', 'last-minute'],
            default: 'normal',
        },

        acceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // should be a guard
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Shift = mongoose.model('Shift', shiftSchema);
module.exports = Shift;