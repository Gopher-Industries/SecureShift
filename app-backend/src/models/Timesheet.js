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
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
      required: true,
    },
    scheduledHours: {
      type: Number,
      required: true,
      min: 0,
    },
    actualHours: {
      type: Number,
      required: true,
      min: 0,
    },
    payableHours: {
      type: Number,
      required: true,
      min: 0,
    },
    attendanceBased: {
      type: Boolean,
      default: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

timesheetSchema.index({ shiftId: 1, guardId: 1 }, { unique: true });
timesheetSchema.index({ employerId: 1, shiftDate: -1 });
timesheetSchema.index({ guardId: 1, shiftDate: -1 });

const Timesheet = model('Timesheet', timesheetSchema);

export default Timesheet;
