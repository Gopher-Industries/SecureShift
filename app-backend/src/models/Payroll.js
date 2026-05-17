import mongoose from 'mongoose';

const payrollEntrySchema = new mongoose.Schema(
  {
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    shiftDate: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    scheduledHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    payableHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    ordinaryHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    ordinaryAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    attendanceBased: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const payrollSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    periodType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    totalScheduledHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalActualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPayableHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrdinaryHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOvertimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrdinaryAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOvertimeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PROCESSED'],
      default: 'PENDING',
      index: true,
    },
    entries: {
      type: [payrollEntrySchema],
      default: [],
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

payrollSchema.index(
  { guardId: 1, employerId: 1, periodType: 1, periodStart: 1, periodEnd: 1 },
  { unique: true }
);

payrollSchema.index({ employerId: 1, periodStart: 1, periodEnd: 1 });
payrollSchema.index({ guardId: 1, periodStart: 1, periodEnd: 1 });

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;
