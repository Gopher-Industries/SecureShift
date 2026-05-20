// models/ShiftRequest.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const shiftRequestSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['SWAP', 'LEAVE'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
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
      validate: {
        validator: function(v) {
          if (this.type === 'SWAP' && !v) return false;
          return true;
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
      validate: {
        validator: function(v) {
          if (this.type === 'LEAVE' && !v) return false;
          return true;
        },
        message: 'Leave start date is required for leave requests',
      },
    },
    leaveEndDate: {
      type: Date,
      validate: {
        validator: function(v) {
          if (this.type === 'LEAVE' && !v) return false;
          if (v && this.leaveStartDate && v < this.leaveStartDate) return false;
          return true;
        },
        message: 'Leave end date must be after start date',
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
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
    targetResponse: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
    },
    targetRespondedAt: {
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

// Compound indexes
shiftRequestSchema.index({ requestingGuardId: 1, status: 1, createdAt: -1 });
shiftRequestSchema.index({ originalShiftId: 1, status: 1 });
shiftRequestSchema.index({ targetGuardId: 1, status: 1 });
shiftRequestSchema.index({ type: 1, status: 1 });

shiftRequestSchema.virtual('isActionable').get(function() {
  return this.status === 'PENDING';
});

shiftRequestSchema.virtual('needsTargetResponse').get(function() {
  return this.type === 'SWAP' && this.status === 'PENDING' && this.targetResponse === 'PENDING';
});

shiftRequestSchema.pre('save', function(next) {
  if (this.type === 'LEAVE') {
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