import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const SHIFT_REQUEST_TYPES = ['SWAP', 'LEAVE'];
export const SHIFT_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const shiftRequestSchema = new Schema(
  {
    type: {
      type: String,
      enum: SHIFT_REQUEST_TYPES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: SHIFT_REQUEST_STATUSES,
      default: 'PENDING',
      required: true,
      index: true,
    },
    requestingGuardId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetGuardId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      validate: {
        validator(value) {
          return this.type !== 'SWAP' || Boolean(value);
        },
        message: 'Target guard is required for shift swap requests',
      },
    },
    originalShiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
      index: true,
    },
    replacementShiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      default: null,
    },
    leaveStartDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return this.type !== 'LEAVE' || Boolean(value);
        },
        message: 'Leave start date is required for leave requests',
      },
    },
    leaveEndDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (this.type === 'LEAVE' && !value) return false;
          return !value || !this.leaveStartDate || value >= this.leaveStartDate;
        },
        message: 'Leave end date must be on or after leave start date',
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 1000,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

shiftRequestSchema.index({ requestingGuardId: 1, status: 1, createdAt: -1 });
shiftRequestSchema.index({ originalShiftId: 1, status: 1 });
shiftRequestSchema.index({ targetGuardId: 1, status: 1 });

shiftRequestSchema.virtual('isActionable').get(function () {
  return this.status === 'PENDING';
});

shiftRequestSchema.pre('validate', function (next) {
  if (this.type === 'LEAVE' && this.leaveStartDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.leaveStartDate < today) {
      return next(new Error('Leave start date cannot be in the past'));
    }
  }

  return next();
});

const ShiftRequest = model('ShiftRequest', shiftRequestSchema);
export default ShiftRequest;
