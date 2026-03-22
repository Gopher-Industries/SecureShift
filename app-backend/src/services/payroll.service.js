/**
 * @file services/payroll.service.js
 * @description Core payroll calculation engine for SecureShift.
 *
 * Overtime rules (Australian Fair Work standard):
 *   - Daily  : hours worked > 8 h/day  → excess is overtime
 *   - Weekly : cumulative regular hours > 38 h/week → excess is overtime
 *   Both rules are applied together; the more-generous overtime wins per shift.
 *
 * Fallback behaviour:
 *   If no ShiftAttendance record exists for a completed shift, the engine
 *   falls back to the shift's scheduled hours (startTime → endTime).
 */

import mongoose from 'mongoose';
import Shift from '../models/Shift.js';
import ShiftAttendance from '../models/ShiftAttendance.js';
import User from '../models/User.js';
import Payroll from '../models/Payroll.js';

// ─── Configuration constants ──────────────────────────────────────────────────

export const PAYROLL_CONFIG = {
  /** Default hourly rate (AUD) when Shift.payRate is not set */
  DEFAULT_HOURLY_RATE: 25,

  /** Overtime pay multiplier (1.5× = time-and-a-half) */
  OVERTIME_MULTIPLIER: 1.5,

  /** Hours per day before overtime kicks in */
  DAILY_OT_THRESHOLD: 8,

  /** Cumulative regular hours per week before weekly overtime kicks in (AU: 38 h) */
  WEEKLY_OT_THRESHOLD: 38,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Round to 2 decimal places */
const r2 = (n) => Math.round((n || 0) * 100) / 100;

/**
 * Convert "HH:MM" (24-hour) string → fractional hours since midnight.
 * Returns 0 on bad input.
 */
function hhmmToHours(hhmm) {
  if (typeof hhmm !== 'string') return 0;
  const m = hhmm.match(/^([0-1]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return 0;
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
}

/**
 * Calculate scheduled duration of a shift in hours.
 * Correctly handles overnight shifts (e.g. 22:00 → 06:00 = 8 h).
 *
 * @param {object} shift – Shift document (needs startTime, endTime)
 * @returns {number} Duration in fractional hours
 */
export function calcScheduledHours(shift) {
  const startH = hhmmToHours(shift.startTime);
  const endH   = hhmmToHours(shift.endTime);
  let duration = endH - startH;
  if (duration <= 0) duration += 24; // overnight span
  return r2(duration);
}

/**
 * Build inclusive UTC date boundaries for a query.
 * start → midnight of startDate, end → 23:59:59.999 of endDate.
 */
export function buildDateRange(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─── Overtime engine ──────────────────────────────────────────────────────────

/**
 * Apply daily and weekly overtime rules to an array of per-shift entries.
 *
 * Entries MUST be sorted by shiftDate ascending before calling this function
 * so that weekly accumulation is chronologically correct.
 *
 * @param {Array} rawEntries – Each entry needs: actualHours, payRate
 * @returns {Array} New array with regularHours, overtimeHours, regularPay,
 *                  overtimePay, totalPay filled in.
 */
function applyOvertimeRules(rawEntries) {
  const {
    OVERTIME_MULTIPLIER,
    DAILY_OT_THRESHOLD,
    WEEKLY_OT_THRESHOLD,
  } = PAYROLL_CONFIG;

  let weeklyRegularAccum = 0; // running total of regular hours this week

  return rawEntries.map((entry) => {
    const { actualHours, payRate } = entry;

    // ── 1. Daily overtime ────────────────────────────────────────────────────
    const dailyRegular = Math.min(actualHours, DAILY_OT_THRESHOLD);
    const dailyOT      = Math.max(0, actualHours - DAILY_OT_THRESHOLD);

    // ── 2. Weekly overtime on the "daily regular" portion ───────────────────
    const remainingWeeklyCap = Math.max(0, WEEKLY_OT_THRESHOLD - weeklyRegularAccum);
    const weeklyRegular      = Math.min(dailyRegular, remainingWeeklyCap);
    const weeklyOT           = dailyRegular - weeklyRegular; // part that breaches weekly cap

    // ── 3. Final: combine daily + weekly OT ─────────────────────────────────
    const finalOT      = r2(dailyOT + weeklyOT);
    const finalRegular = r2(actualHours - finalOT);

    weeklyRegularAccum += weeklyRegular; // accumulate only regular hours

    const regularPay  = r2(finalRegular * payRate);
    const overtimePay = r2(finalOT * payRate * OVERTIME_MULTIPLIER);
    const totalPay    = r2(regularPay + overtimePay);

    return {
      ...entry,
      regularHours:  finalRegular,
      overtimeHours: finalOT,
      regularPay,
      overtimePay,
      totalPay,
    };
  });
}

// ─── Guard payroll calculation ────────────────────────────────────────────────

/**
 * Calculate payroll data for a single guard over a date range.
 * Does NOT persist anything – pure calculation.
 *
 * @param {string|ObjectId} guardId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} periodType  – 'daily' | 'weekly' | 'monthly'
 * @returns {object} Payroll data object
 */
export async function calculateGuardPayroll(guardId, startDate, endDate, periodType) {
  const guard = await User.findById(guardId)
    .select('name email role branch')
    .lean();

  if (!guard) throw new Error(`Guard not found: ${guardId}`);

  // Fetch all COMPLETED shifts assigned to this guard within the date window
  const shifts = await Shift.find({
    acceptedBy: guardId,
    status: 'completed',
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 }) // chronological order for weekly OT accumulation
    .lean();

  if (!shifts.length) {
    return buildEmptyPayroll(guard, periodType, startDate, endDate);
  }

  // Fetch any attendance records for these shifts
  const shiftIds = shifts.map((s) => s._id);
  const attendances = await ShiftAttendance.find({
    shift: { $in: shiftIds },
    guard: guardId,
  }).lean();

  // Index by shift._id string for O(1) lookup
  const attByShift = {};
  for (const att of attendances) {
    attByShift[att.shift.toString()] = att;
  }

  // ── Build raw per-shift entries ──────────────────────────────────────────
  const rawEntries = shifts.map((shift) => {
    const scheduledHours     = calcScheduledHours(shift);
    const payRate            = (shift.payRate != null && shift.payRate >= 0)
      ? shift.payRate
      : PAYROLL_CONFIG.DEFAULT_HOURLY_RATE;
    const att                = attByShift[shift._id.toString()] ?? null;

    let actualHours;
    let hasAttendanceRecord = Boolean(att);
    let attendanceStatus;

    if (!att) {
      // No attendance record → use scheduled hours as best estimate
      actualHours      = scheduledHours;
      attendanceStatus = 'no_record';
    } else if (att.status === 'present' && att.hoursWorked > 0) {
      actualHours      = att.hoursWorked;
      attendanceStatus = 'present';
    } else if (att.status === 'absent') {
      actualHours      = 0;
      attendanceStatus = 'absent';
    } else if (att.status === 'incomplete') {
      // Partial clock-in: use what was captured, or fall back to scheduled
      actualHours      = att.hoursWorked > 0 ? att.hoursWorked : scheduledHours;
      attendanceStatus = 'incomplete';
    } else {
      // 'scheduled' status or anything unexpected → use scheduled
      actualHours      = scheduledHours;
      attendanceStatus = att.status || 'scheduled';
    }

    return {
      shift:               shift._id,
      attendance:          att?._id ?? null,
      shiftDate:           shift.date,
      scheduledHours:      r2(scheduledHours),
      actualHours:         r2(actualHours),
      payRate,
      // Overtime fields are placeholders; applyOvertimeRules fills them in
      regularHours:        0,
      overtimeHours:       0,
      regularPay:          0,
      overtimePay:         0,
      totalPay:            0,
      hasAttendanceRecord,
      attendanceStatus,
    };
  });

  // ── Apply overtime rules ─────────────────────────────────────────────────
  const entries = applyOvertimeRules(rawEntries);

  // ── Aggregate totals ──────────────────────────────────────────────────────
  const totals = entries.reduce(
    (acc, e) => {
      acc.totalScheduledHours += e.scheduledHours;
      acc.totalWorkedHours    += e.actualHours;
      acc.totalRegularHours   += e.regularHours;
      acc.totalOvertimeHours  += e.overtimeHours;
      acc.grossPay            += e.totalPay;
      return acc;
    },
    {
      totalScheduledHours: 0,
      totalWorkedHours:    0,
      totalRegularHours:   0,
      totalOvertimeHours:  0,
      grossPay:            0,
    }
  );

  Object.keys(totals).forEach((k) => { totals[k] = r2(totals[k]); });

  return {
    guardId:         guard._id,
    guardName:       guard.name,
    guardEmail:      guard.email,
    guardRole:       guard.role,
    guardDepartment: guard.branch?.toString() ?? null,
    period:          { type: periodType, startDate, endDate },
    entries,
    ...totals,
  };
}

/** Produces an empty payroll shell (guard has no completed shifts in the period) */
function buildEmptyPayroll(guard, periodType, startDate, endDate) {
  return {
    guardId:             guard._id,
    guardName:           guard.name,
    guardEmail:          guard.email,
    guardRole:           guard.role,
    guardDepartment:     guard.branch?.toString() ?? null,
    period:              { type: periodType, startDate, endDate },
    entries:             [],
    totalScheduledHours: 0,
    totalWorkedHours:    0,
    totalRegularHours:   0,
    totalOvertimeHours:  0,
    grossPay:            0,
  };
}

// ─── Batch generation + persistence ──────────────────────────────────────────

/**
 * Generate payroll for all matching guards and upsert PENDING records.
 * Already-APPROVED or -PROCESSED records are returned as-is (never overwritten).
 *
 * @param {object} filters – { startDate, endDate, periodType, guardId?, department? }
 * @returns {Promise<Array>} Array of Payroll documents (saved or pre-existing)
 */
export async function generateAndPersistPayroll(filters) {
  const { startDate, endDate, periodType, guardId, department } = filters;
  const { start, end } = buildDateRange(startDate, endDate);

  // Build guard filter
  const guardFilter = { role: 'guard', isDeleted: { $ne: true } };

  if (guardId) {
    if (!mongoose.isValidObjectId(guardId)) {
      throw new Error('Invalid guardId format');
    }
    guardFilter._id = new mongoose.Types.ObjectId(guardId);
  }
  if (department) {
    // department can be a branch ObjectId string or a branch name
    guardFilter.branch = mongoose.isValidObjectId(department)
      ? new mongoose.Types.ObjectId(department)
      : department;
  }

  const guards = await User.find(guardFilter).select('_id').lean();

  if (!guards.length) return [];

  const results = [];

  for (const { _id } of guards) {
    try {
      // Check if an immutable (non-PENDING) payroll already exists
      const existingLocked = await Payroll.findOne({
        guard: _id,
        'period.type':      periodType,
        'period.startDate': start,
        'period.endDate':   end,
        status:             { $in: ['APPROVED', 'PROCESSED'] },
      }).lean();

      if (existingLocked) {
        // Return as-is without touching it
        results.push(existingLocked);
        continue;
      }

      // Calculate fresh payroll
      const data = await calculateGuardPayroll(_id, start, end, periodType);

      // Skip guards with no shifts (unless a specific guard was requested)
      if (!data.entries.length && !guardId) continue;

      // Upsert PENDING record
      const saved = await Payroll.findOneAndUpdate(
        {
          guard:              _id,
          'period.type':      periodType,
          'period.startDate': start,
          'period.endDate':   end,
        },
        {
          $set: {
            entries:             data.entries,
            totalScheduledHours: data.totalScheduledHours,
            totalWorkedHours:    data.totalWorkedHours,
            totalRegularHours:   data.totalRegularHours,
            totalOvertimeHours:  data.totalOvertimeHours,
            grossPay:            data.grossPay,
            guardName:           data.guardName,
            guardEmail:          data.guardEmail,
            guardRole:           data.guardRole,
            guardDepartment:     data.guardDepartment,
            'period.type':       periodType,
            'period.startDate':  start,
            'period.endDate':    end,
            status:              'PENDING',
            // Reset workflow fields on recalculation
            approvedBy:  null,
            approvedAt:  null,
            processedBy: null,
            processedAt: null,
          },
          $setOnInsert: { guard: _id },
        },
        { upsert: true, new: true }
      );

      results.push(saved);
    } catch (err) {
      console.error(`Payroll calculation failed for guard ${_id}:`, err.message);
      // Continue processing other guards rather than aborting the whole batch
    }
  }

  return results;
}
