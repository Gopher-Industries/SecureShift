import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const shiftRequestSchema = new Schema(
    {
        // Request type
        type: {
            type: String,
            required: true,
            enum: ['SWAP', 'LEAVE'],
            index: true,
        },

        // Status workflow
        status: {
            type: String,
            required: true,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
            index: true,
        },

        // Who requested
        requestingGuardId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // For SWAP: which guard will take the shift (optional until proposed)
        targetGuardId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            validate: {
                validator: function (v) {
                    // Required for SWAP requests, not for LEAVE
                    if (this.type === 'SWAP' && !v) return false;
                    return true;
                },
                message: 'Target guard is required for shift swap requests',
            },
        },

        // The shift being swapped or taken leave from
        originalShiftId: {
            type: Schema.Types.ObjectId,
            ref: 'Shift',
            required: true,
            index: true,
        },

        // For SWAP: the shift the target guard gives in return (optional)
        replacementShiftId: {
            type: Schema.Types.ObjectId,
            ref: 'Shift',
            validate: {
                validator: function (v) {
                    // Only required for mutual swaps, can be null for gift/cover
                    return true; // Optional field
                },
            },
        },

        // For LEAVE: date range
        leaveStartDate: {
            type: Date,
            validate: {
                validator: function (v) {
                    if (this.type === 'LEAVE' && !v) return false;
                    return true;
                },
                message: 'Leave start date is required for leave requests',
            },
        },
        leaveEndDate: {
            type: Date,
            validate: {
                validator: function (v) {
                    if (this.type === 'LEAVE' && !v) return false;
                    if (v && this.leaveStartDate && v < this.leaveStartDate) return false;
                    return true;
                },
                message: 'Leave end date must be after start date',
            },
        },

        // Reason/justification
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        // Admin/Employer approval tracking
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },

        // Target guard's response (for SWAP requests)
        targetResponse: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
            default: 'PENDING',
        },
        targetRespondedAt: {
            type: Date,
            default: null,
        },

        // Notifications tracking
        employerNotifiedAt: Date,
        adminNotifiedAt: Date,
        targetNotifiedAt: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound indexes for efficient queries
shiftRequestSchema.index({ requestingGuardId: 1, status: 1, createdAt: -1 });
shiftRequestSchema.index({ originalShiftId: 1, status: 1 });
shiftRequestSchema.index({ targetGuardId: 1, status: 1 });
shiftRequestSchema.index({ type: 1, status: 1 });

// Virtual: check if request is still actionable
shiftRequestSchema.virtual('isActionable').get(function () {
    return this.status === 'PENDING';
});

// Virtual: check if SWAP request needs target response
shiftRequestSchema.virtual('needsTargetResponse').get(function () {
    return this.type === 'SWAP' && this.status === 'PENDING' && this.targetResponse === 'PENDING';
});

// Pre-save middleware to validate dates
shiftRequestSchema.pre('save', function (next) {
    if (this.type === 'LEAVE') {
        // Ensure leave dates are in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (this.leaveStartDate < today) {
            next(new Error('Leave start date cannot be in the past'));
        }

        if (this.leaveEndDate < this.leaveStartDate) {
            next(new Error('Leave end date must be after start date'));
        }
    }
    next();
});

const ShiftRequest = model('ShiftRequest', shiftRequestSchema);
export default ShiftRequest;