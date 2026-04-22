import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * ShiftAttendance records actual clock-in / clock-out data for a guard on a shift.
 * Used by the payroll engine to calculate actual hours worked vs. scheduled hours.
 *
 * Status lifecycle:
 *   scheduled  → guard assigned but hasn't clocked in yet
 *   present    → guard clocked in AND out (hoursWorked computed)
 *   incomplete → guard clocked in but never clocked out
 *   absent     → explicitly marked absent (or guard never clocked in)
 */
const shiftAttendanceSchema = new Schema(
  {
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
      index: true,
    },

    guard: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    clockIn: {
      type: Date,
      default: null,
    },

    clockOut: {
      type: Date,
      default: null,
    },

    /** Scheduled start (denormalised from Shift for quick queries) */
    scheduledStart: {
      type: Date,
      required: true,
    },

    /** Scheduled end (denormalised from Shift) */
    scheduledEnd: {
      type: Date,
      required: true,
    },

    /** Computed hours worked; set automatically in pre-save hook */
    hoursWorked: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ['scheduled', 'present', 'incomplete', 'absent'],
      default: 'scheduled',
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    /** Who recorded this attendance (admin/guard) */
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance records per shift/guard pair
shiftAttendanceSchema.index({ shift: 1, guard: 1 }, { unique: true });

/**
 * Auto-compute hoursWorked and status based on clockIn / clockOut.
 */
shiftAttendanceSchema.pre('save', function (next) {
  if (this.clockIn && this.clockOut) {
    if (this.clockOut <= this.clockIn) {
      return next(new Error('clockOut must be after clockIn'));
    }
    const diffMs = this.clockOut.getTime() - this.clockIn.getTime();
    this.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    this.status = 'present';
  } else if (this.clockIn && !this.clockOut) {
    this.status = 'incomplete';
    // Partial hours from clock-in to now (capped at scheduled end)
    const now = new Date();
    const cap = this.scheduledEnd || now;
    const diffMs = Math.min(now.getTime(), cap.getTime()) - this.clockIn.getTime();
    this.hoursWorked = diffMs > 0 ? Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 : 0;
  } else if (!this.clockIn) {
    this.status = 'absent';
    this.hoursWorked = 0;
  }
  next();
});

const ShiftAttendance = model('ShiftAttendance', shiftAttendanceSchema);
export default ShiftAttendance;