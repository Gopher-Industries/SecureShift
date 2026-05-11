import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const timesheetSchema = new Schema(
  {
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
      index: true,
    },
    guardId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftAttendance',
      required: true,
    },
    shiftDate: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    actualStart: {
      type: Date,
      required: true,
    },
    actualEnd: {
      type: Date,
      required: true,
    },
    scheduledHours: {
      type: Number,
      required: true,
      min: 0,
    },
    workedHours: {
      type: Number,
      required: true,
      min: 0,
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    payRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossPay: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['generated', 'pending_review'],
      default: 'generated',
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

timesheetSchema.index({ shiftId: 1, guardId: 1 }, { unique: true });

const Timesheet = model('Timesheet', timesheetSchema);
export default Timesheet;
