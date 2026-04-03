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
  const endH = hhmmToHours(shift.endTime);
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

/**
 * Get the ISO week key (Monday-start) for a given date.
 * @param {string|Date} dateValue – Date or ISO date string
 * @returns {string} ISO date string for the Monday of the week
 */
function getWeekKey(dateValue) {
  const date = new Date(dateValue);
  const utcDay = date.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = utcDay === 0 ? -6 : 1 - utcDay;

  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  return monday.toISOString().slice(0, 10);
}

// ─── Overtime engine ──────────────────────────────────────────────────────────

/**
 * Apply daily and weekly overtime rules to an array of per-shift entries.
 *
 * Entries MUST be sorted by shiftDate ascending before calling this function.
 * Weekly accumulation resets per calendar week (Monday-start).
 *
 * @param {Array} rawEntries – Each entry needs: actualHours, payRate, shiftDate
 * @returns {Array} New array with regularHours, overtimeHours, regularPay,
 *                  overtimePay, totalPay filled in.
 */
function applyOvertimeRules(rawEntries) {
  const {
    OVERTIME_MULTIPLIER,
    DAILY_OT_THRESHOLD,
    WEEKLY_OT_THRESHOLD,
  } = PAYROLL_CONFIG;

  let currentWeekKey = null;
  let weeklyRegularAccum = 0;

  return rawEntries.map((entry) => {
    const { actualHours, payRate, shiftDate } = entry;
    const weekKey = getWeekKey(shiftDate);

    if (weekKey !== currentWeekKey) {
      currentWeekKey = weekKey;
      weeklyRegularAccum = 0;
    }

    // Daily overtime calculation
    const dailyRegular = Math.min(actualHours, DAILY_OT_THRESHOLD);
    const dailyOT = Math.max(0, actualHours - DAILY_OT_THRESHOLD);

    // Weekly overtime calculation
    const remainingWeeklyCap = Math.max(0, WEEKLY_OT_THRESHOLD - weeklyRegularAccum);
    const weeklyRegular = Math.min(dailyRegular, remainingWeeklyCap);
    const weeklyOT = dailyRegular - weeklyRegular;

    // Final combination: daily + weekly OT, with the more-generous rule winning
    const finalOT = r2(dailyOT + weeklyOT);
    const finalRegular = r2(actualHours - finalOT);

    weeklyRegularAccum += weeklyRegular;

    const regularPay = r2(finalRegular * payRate);
    const overtimePay = r2(finalOT * payRate * OVERTIME_MULTIPLIER);
    const totalPay = r2(regularPay + overtimePay);

    return {
      ...entry,
      regularHours: finalRegular,
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

  // Find all completed shifts for this guard in the period
  const shifts = await Shift.find({
    acceptedBy: guardId,
    status: 'completed',
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .lean();

  if (!shifts.length) {
    return buildEmptyPayroll(guard, periodType, startDate, endDate);
  }

  // Find all attendance records for these shifts + guard (should be ≤ shifts.length)
  const shiftIds = shifts.map((s) => s._id);
  const attendances = await ShiftAttendance.find({
    shift: { $in: shiftIds },
    guard: guardId,
  }).lean();

  // Index attendance records by shift for easy lookup
  const attByShift = {};
  for (const att of attendances) {
    attByShift[att.shift.toString()] = att;
  }

  // Build raw entries with scheduled hours, actual hours (from attendance or fallback),
  // and pay rate (from shift or default). Overtime fields are filled in later.
  const rawEntries = shifts.map((shift) => {
    const scheduledHours = calcScheduledHours(shift);
    const payRate =
      shift.payRate != null && shift.payRate >= 0
        ? shift.payRate
        : PAYROLL_CONFIG.DEFAULT_HOURLY_RATE;
    const att = attByShift[shift._id.toString()] ?? null;

    let actualHours;
    const hasAttendanceRecord = Boolean(att);
    let attendanceStatus;

    if (!att) {
      actualHours = scheduledHours;
      attendanceStatus = 'no_record';
    } else if (att.status === 'present' && att.hoursWorked > 0) {
      actualHours = att.hoursWorked;
      attendanceStatus = 'present';
    } else if (att.status === 'absent') {
      actualHours = 0;
      attendanceStatus = 'absent';
    } else if (att.status === 'incomplete') {
      actualHours = att.hoursWorked > 0 ? att.hoursWorked : scheduledHours;
      attendanceStatus = 'incomplete';
    } else {
      actualHours = scheduledHours;
      attendanceStatus = att.status || 'scheduled';
    }

    return {
      shift: shift._id,
      attendance: att?._id ?? null,
      shiftDate: shift.date,
      scheduledHours: r2(scheduledHours),
      actualHours: r2(actualHours),
      payRate,
      regularHours: 0,
      overtimeHours: 0,
      regularPay: 0,
      overtimePay: 0,
      totalPay: 0,
      hasAttendanceRecord,
      attendanceStatus,
    };
  });

  // Apply overtime rules to the raw entries to get final regular/overtime split and pay calculations
  const entries = applyOvertimeRules(rawEntries);

  const totals = entries.reduce(
    (acc, e) => {
      acc.totalScheduledHours += e.scheduledHours;
      acc.totalWorkedHours += e.actualHours;
      acc.totalRegularHours += e.regularHours;
      acc.totalOvertimeHours += e.overtimeHours;
      acc.grossPay += e.totalPay;
      return acc;
    },
    {
      totalScheduledHours: 0,
      totalWorkedHours: 0,
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      grossPay: 0,
    }
  );

  Object.keys(totals).forEach((k) => {
    totals[k] = r2(totals[k]);
  });

  return {
    guardId: guard._id,
    guardName: guard.name,
    guardEmail: guard.email,
    guardRole: guard.role,
    guardDepartment: guard.branch?.toString() ?? null,
    period: { type: periodType, startDate, endDate },
    entries,
    ...totals,
  };
}

/** Produces an empty payroll shell (guard has no completed shifts in the period) */
function buildEmptyPayroll(guard, periodType, startDate, endDate) {
  return {
    guardId: guard._id,
    guardName: guard.name,
    guardEmail: guard.email,
    guardRole: guard.role,
    guardDepartment: guard.branch?.toString() ?? null,
    period: { type: periodType, startDate, endDate },
    entries: [],
    totalScheduledHours: 0,
    totalWorkedHours: 0,
    totalRegularHours: 0,
    totalOvertimeHours: 0,
    grossPay: 0,
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

  // Find all guards matching the filters (and not deleted)
  const guardFilter = { role: 'guard', isDeleted: { $ne: true } };

  if (guardId) {
    if (!mongoose.isValidObjectId(guardId)) {
      throw new Error('Invalid guardId format');
    }
    guardFilter._id = new mongoose.Types.ObjectId(guardId);
  }

  if (department) {
    guardFilter.branch = mongoose.isValidObjectId(department)
      ? new mongoose.Types.ObjectId(department)
      : department;
  }

  const guards = await User.find(guardFilter).select('_id').lean();

  if (!guards.length) return [];

  const results = [];

  for (const { _id } of guards) {
    try {
      const existingLocked = await Payroll.findOne({
        guard: _id,
        'period.type': periodType,
        'period.startDate': start,
        'period.endDate': end,
        status: { $in: ['APPROVED', 'PROCESSED'] },
      }).lean();

      if (existingLocked) {
        results.push(existingLocked);
        continue;
      }

      // Calculate payroll data for this guard + period
      const data = await calculateGuardPayroll(_id, start, end, periodType);

      if (!data.entries.length && !guardId) continue;

      // Upsert a PENDING payroll record with the calculated data, or update the existing PENDING one.
      const saved = await Payroll.findOneAndUpdate(
        {
          guard: _id,
          'period.type': periodType,
          'period.startDate': start,
          'period.endDate': end,
        },
        {
          $set: {
            entries: data.entries,
            totalScheduledHours: data.totalScheduledHours,
            totalWorkedHours: data.totalWorkedHours,
            totalRegularHours: data.totalRegularHours,
            totalOvertimeHours: data.totalOvertimeHours,
            grossPay: data.grossPay,
            guardName: data.guardName,
            guardEmail: data.guardEmail,
            guardRole: data.guardRole,
            guardDepartment: data.guardDepartment,
            'period.type': periodType,
            'period.startDate': start,
            'period.endDate': end,
            status: 'PENDING',
            approvedBy: null,
            approvedAt: null,
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
    }
  }

  return results;
}