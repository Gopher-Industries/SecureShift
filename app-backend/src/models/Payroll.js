import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * A single shift's payroll contribution for one guard.
 * Stored as a sub-document inside a Payroll record.
 */
const payrollEntrySchema = new Schema(
  {
    /** Reference to the completed Shift */
    shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },

    /** Reference to the ShiftAttendance record (null if no attendance was recorded) */
    attendance: { type: Schema.Types.ObjectId, ref: 'ShiftAttendance', default: null },

    shiftDate: { type: Date, required: true },

    /** Hours derived from Shift.startTime / endTime */
    scheduledHours: { type: Number, default: 0, min: 0 },

    /** Hours actually worked (from attendance or fallback to scheduled) */
    actualHours: { type: Number, default: 0, min: 0 },

    /** Regular (non-overtime) hours */
    regularHours: { type: Number, default: 0, min: 0 },

    /** Overtime hours for this shift (daily OT + weekly OT apportionment) */
    overtimeHours: { type: Number, default: 0, min: 0 },

    /** Hourly rate used (from Shift.payRate or system default) */
    payRate: { type: Number, default: 0, min: 0 },

    regularPay: { type: Number, default: 0, min: 0 },
    overtimePay: { type: Number, default: 0, min: 0 },
    totalPay: { type: Number, default: 0, min: 0 },

    /** Whether an attendance record existed for this shift */
    hasAttendanceRecord: { type: Boolean, default: false },

    /**
     * present | absent | incomplete | scheduled | no_record
     * "no_record" = shift completed but no ShiftAttendance document exists
     */
    attendanceStatus: {
      type: String,
      enum: ['present', 'absent', 'incomplete', 'scheduled', 'no_record'],
      default: 'no_record',
    },
  },
  { _id: false }
);

/**
 * Top-level Payroll document — one per guard per period.
 *
 * Status workflow:
 *   PENDING → APPROVED → PROCESSED
 *
 * Only PENDING payrolls can be regenerated / overwritten.
 * Only PENDING can be approved, only APPROVED can be processed.
 */
const payrollSchema = new Schema(
  {
    guard: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    period: {
      type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true,
      },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },

    /** Per-shift breakdown */
    entries: { type: [payrollEntrySchema], default: [] },

    // ── Aggregated totals ──────────────────────────────────────────────────
    totalScheduledHours: { type: Number, default: 0, min: 0 },
    totalWorkedHours:    { type: Number, default: 0, min: 0 },
    totalRegularHours:   { type: Number, default: 0, min: 0 },
    totalOvertimeHours:  { type: Number, default: 0, min: 0 },
    grossPay:            { type: Number, default: 0, min: 0 },

    // ── Workflow ───────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PROCESSED'],
      default: 'PENDING',
      index: true,
    },

    approvedBy:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt:  { type: Date, default: null },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },

    // ── Denormalised guard snapshot (for fast export / reporting) ──────────
    guardName:       { type: String, trim: true },
    guardEmail:      { type: String, trim: true },
    guardRole:       { type: String, trim: true },
    guardDepartment: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// One payroll record per guard × period
payrollSchema.index(
  { guard: 1, 'period.type': 1, 'period.startDate': 1, 'period.endDate': 1 },
  { unique: true }
);

const Payroll = model('Payroll', payrollSchema);
export default Payroll;
