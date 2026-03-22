/**
 * @file controllers/payroll.controller.js
 * @description Payroll endpoint handlers for SecureShift.
 *
 * Endpoints
 *   GET  /api/v1/payroll          – Generate / retrieve payroll summaries
 *   POST /api/v1/payroll/approve  – Approve one or more PENDING payroll records
 *   POST /api/v1/payroll/process  – Process one or more APPROVED payroll records
 *   GET  /api/v1/payroll/export   – Export payroll data as CSV or PDF
 *
 *   POST /api/v1/payroll/attendance       – Record attendance (admin / guard)
 *   GET  /api/v1/payroll/attendance/:shiftId – Get attendance for a shift
 */

import mongoose from 'mongoose';
import Payroll from '../models/Payroll.js';
import ShiftAttendance from '../models/ShiftAttendance.js';
import Shift from '../models/Shift.js';
import { ACTIONS } from '../middleware/logger.js';
import {
  generateAndPersistPayroll,
  buildDateRange,
  calcScheduledHours,
  PAYROLL_CONFIG,
} from '../services/payroll.service.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_PERIOD_TYPES = ['daily', 'weekly', 'monthly'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const round2 = (n) => Math.round((n || 0) * 100) / 100;

function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start.getTime())) return 'startDate is not a valid date';
  if (isNaN(end.getTime()))   return 'endDate is not a valid date';
  if (start > end)             return 'startDate must be before endDate';
  return null; // valid
}

function escapeCsv(val) {
  const str = val == null ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// ─── GET /api/v1/payroll ──────────────────────────────────────────────────────

/**
 * Retrieve (and generate / refresh) payroll summaries.
 *
 * Query params:
 *   startDate    – ISO date string (required)
 *   endDate      – ISO date string (required)
 *   periodType   – 'daily' | 'weekly' | 'monthly' (required)
 *   guardId      – ObjectId string (optional; guards may only view their own)
 *   department   – branch ObjectId or name (optional)
 */
export const getPayroll = async (req, res) => {
  try {
    const { startDate, endDate, periodType, guardId, department } = req.query;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    if (!periodType || !VALID_PERIOD_TYPES.includes(periodType)) {
      return res.status(400).json({
        message: `periodType must be one of: ${VALID_PERIOD_TYPES.join(', ')}`,
      });
    }

    const rangeError = validateDateRange(startDate, endDate);
    if (rangeError) return res.status(400).json({ message: rangeError });

    if (guardId && !mongoose.isValidObjectId(guardId)) {
      return res.status(400).json({ message: 'guardId is not a valid ObjectId' });
    }

    // ── Role-based scoping ─────────────────────────────────────────────────
    const { role, _id: userId } = req.user;
    let effectiveGuardId = guardId || null;

    if (role === 'guard') {
      // Guards can only see their own payroll
      effectiveGuardId = String(userId);
    }

    // ── Generate + persist ─────────────────────────────────────────────────
    const records = await generateAndPersistPayroll({
      startDate,
      endDate,
      periodType,
      guardId:    effectiveGuardId,
      department: department || null,
    });

    // ── Period summary ─────────────────────────────────────────────────────
    const summary = {
      totalGuards:        records.length,
      totalWorkedHours:   round2(records.reduce((s, r) => s + (r.totalWorkedHours    || 0), 0)),
      totalOvertimeHours: round2(records.reduce((s, r) => s + (r.totalOvertimeHours  || 0), 0)),
      totalGrossPay:      round2(records.reduce((s, r) => s + (r.grossPay            || 0), 0)),
    };

    await req.audit.log(userId, ACTIONS.PAYROLL_GENERATED, {
      periodType,
      startDate,
      endDate,
      recordCount: records.length,
    });

    return res.json({
      period:  { type: periodType, startDate, endDate },
      summary,
      records,
    });
  } catch (err) {
    console.error('[getPayroll]', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/v1/payroll/approve ─────────────────────────────────────────────

/**
 * Approve one or more PENDING payroll records.
 * Body: { payrollIds: ["id1", "id2", ...] }
 */
export const approvePayroll = async (req, res) => {
  try {
    const { payrollIds } = req.body;

    if (!Array.isArray(payrollIds) || payrollIds.length === 0) {
      return res.status(400).json({ message: 'payrollIds must be a non-empty array' });
    }

    const invalid = payrollIds.filter((id) => !mongoose.isValidObjectId(id));
    if (invalid.length) {
      return res.status(400).json({ message: `Invalid ObjectId(s): ${invalid.join(', ')}` });
    }

    // Verify all records exist and are PENDING
    const records = await Payroll.find({ _id: { $in: payrollIds } }).lean();

    if (records.length !== payrollIds.length) {
      const foundIds   = records.map((r) => r._id.toString());
      const missingIds = payrollIds.filter((id) => !foundIds.includes(id));
      return res.status(404).json({
        message: `Payroll record(s) not found: ${missingIds.join(', ')}`,
      });
    }

    const notPending = records.filter((r) => r.status !== 'PENDING');
    if (notPending.length) {
      return res.status(400).json({
        message: `Only PENDING payrolls can be approved. Non-pending record(s): ${notPending.map((r) => `${r._id} (${r.status})`).join(', ')}`,
      });
    }

    const approverId = req.user._id || req.user.id;
    const result = await Payroll.updateMany(
      { _id: { $in: payrollIds }, status: 'PENDING' },
      {
        $set: {
          status:     'APPROVED',
          approvedBy: approverId,
          approvedAt: new Date(),
        },
      }
    );

    await req.audit.log(approverId, ACTIONS.PAYROLL_APPROVED, {
      payrollIds,
      approvedCount: result.modifiedCount,
    });

    return res.json({
      message:       `${result.modifiedCount} payroll record(s) approved successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('[approvePayroll]', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/v1/payroll/process ─────────────────────────────────────────────

/**
 * Mark one or more APPROVED payroll records as PROCESSED.
 * Body: { payrollIds: ["id1", "id2", ...] }
 */
export const processPayroll = async (req, res) => {
  try {
    const { payrollIds } = req.body;

    if (!Array.isArray(payrollIds) || payrollIds.length === 0) {
      return res.status(400).json({ message: 'payrollIds must be a non-empty array' });
    }

    const invalid = payrollIds.filter((id) => !mongoose.isValidObjectId(id));
    if (invalid.length) {
      return res.status(400).json({ message: `Invalid ObjectId(s): ${invalid.join(', ')}` });
    }

    const records = await Payroll.find({ _id: { $in: payrollIds } }).lean();

    if (records.length !== payrollIds.length) {
      const foundIds   = records.map((r) => r._id.toString());
      const missingIds = payrollIds.filter((id) => !foundIds.includes(id));
      return res.status(404).json({
        message: `Payroll record(s) not found: ${missingIds.join(', ')}`,
      });
    }

    const notApproved = records.filter((r) => r.status !== 'APPROVED');
    if (notApproved.length) {
      return res.status(400).json({
        message: `Only APPROVED payrolls can be processed. Non-approved record(s): ${notApproved.map((r) => `${r._id} (${r.status})`).join(', ')}`,
      });
    }

    const processorId = req.user._id || req.user.id;
    const result = await Payroll.updateMany(
      { _id: { $in: payrollIds }, status: 'APPROVED' },
      {
        $set: {
          status:      'PROCESSED',
          processedBy: processorId,
          processedAt: new Date(),
        },
      }
    );

    await req.audit.log(processorId, ACTIONS.PAYROLL_PROCESSED, {
      payrollIds,
      processedCount: result.modifiedCount,
    });

    return res.json({
      message:       `${result.modifiedCount} payroll record(s) processed successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('[processPayroll]', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/v1/payroll/export ───────────────────────────────────────────────

/**
 * Export payroll data in CSV or PDF format.
 *
 * Query params:
 *   startDate  – ISO date string (required)
 *   endDate    – ISO date string (required)
 *   periodType – 'daily' | 'weekly' | 'monthly' (required)
 *   format     – 'csv' | 'pdf' (default: 'csv')
 *   guardId    – filter by guard (optional)
 *   department – filter by branch (optional)
 *   status     – filter by status 'PENDING'|'APPROVED'|'PROCESSED' (optional)
 */
export const exportPayroll = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      periodType,
      format     = 'csv',
      guardId,
      department,
      status,
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }
    if (!periodType || !VALID_PERIOD_TYPES.includes(periodType)) {
      return res.status(400).json({
        message: `periodType must be one of: ${VALID_PERIOD_TYPES.join(', ')}`,
      });
    }

    const rangeError = validateDateRange(startDate, endDate);
    if (rangeError) return res.status(400).json({ message: rangeError });

    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ message: "format must be 'csv' or 'pdf'" });
    }

    if (status && !['PENDING', 'APPROVED', 'PROCESSED'].includes(status)) {
      return res.status(400).json({ message: "status must be PENDING, APPROVED, or PROCESSED" });
    }

    // ── Build query for stored Payroll records ─────────────────────────────
    const { start, end } = buildDateRange(startDate, endDate);
    const query = {
      'period.type':      periodType,
      'period.startDate': { $gte: start },
      'period.endDate':   { $lte: end },
    };
    if (guardId)    query.guard             = mongoose.isValidObjectId(guardId) ? new mongoose.Types.ObjectId(guardId) : guardId;
    if (department) query.guardDepartment   = department;
    if (status)     query.status            = status;

    // Role scoping
    if (req.user.role === 'guard') {
      query.guard = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    }

    const records = await Payroll.find(query)
      .populate('approvedBy',  'name email')
      .populate('processedBy', 'name email')
      .sort({ guardName: 1 })
      .lean();

    await req.audit.log(req.user._id, ACTIONS.PAYROLL_EXPORTED, {
      format, periodType, startDate, endDate, count: records.length,
    });

    if (format === 'csv') {
      return sendCSV(res, records, periodType, startDate, endDate);
    }
    return sendPDF(res, records, periodType, startDate, endDate);
  } catch (err) {
    console.error('[exportPayroll]', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── CSV builder ──────────────────────────────────────────────────────────────

function sendCSV(res, records, periodType, startDate, endDate) {
  const lines = [];

  // ── File header ──────────────────────────────────────────────────────────
  lines.push('SecureShift Payroll Export');
  lines.push(`Period Type,${capitalize(periodType)}`);
  lines.push(`Start Date,${startDate}`);
  lines.push(`End Date,${endDate}`);
  lines.push(`Generated At,${new Date().toISOString()}`);
  lines.push('');

  // ── Period totals ────────────────────────────────────────────────────────
  const totalWorked  = round2(records.reduce((s, r) => s + (r.totalWorkedHours   || 0), 0));
  const totalOT      = round2(records.reduce((s, r) => s + (r.totalOvertimeHours || 0), 0));
  const totalPay     = round2(records.reduce((s, r) => s + (r.grossPay           || 0), 0));

  lines.push('PERIOD SUMMARY');
  lines.push(`Total Guards,${records.length}`);
  lines.push(`Total Hours Worked,${totalWorked}`);
  lines.push(`Total Overtime Hours,${totalOT}`);
  lines.push(`Total Gross Pay (AUD),$${totalPay.toFixed(2)}`);
  lines.push('');

  // ── Per-guard summary ────────────────────────────────────────────────────
  lines.push('PER-GUARD SUMMARY');
  lines.push(
    'Guard Name,Email,Role,Sched Hrs,Worked Hrs,Regular Hrs,Overtime Hrs,Gross Pay (AUD),Status,Approved By,Approved At,Processed By,Processed At'
  );

  for (const r of records) {
    lines.push(
      [
        escapeCsv(r.guardName  || ''),
        escapeCsv(r.guardEmail || ''),
        escapeCsv(r.guardRole  || ''),
        r.totalScheduledHours ?? 0,
        r.totalWorkedHours    ?? 0,
        r.totalRegularHours   ?? 0,
        r.totalOvertimeHours  ?? 0,
        (r.grossPay || 0).toFixed(2),
        r.status || '',
        escapeCsv(r.approvedBy?.name  || ''),
        r.approvedAt  ? new Date(r.approvedAt).toISOString()  : '',
        escapeCsv(r.processedBy?.name || ''),
        r.processedAt ? new Date(r.processedAt).toISOString() : '',
      ].join(',')
    );
  }

  lines.push('');

  // ── Per-shift detail ─────────────────────────────────────────────────────
  lines.push('SHIFT DETAILS');
  lines.push(
    'Guard Name,Shift Date,Sched Hrs,Actual Hrs,Regular Hrs,OT Hrs,Pay Rate ($/hr),Regular Pay,OT Pay,Total Pay,Attendance Status'
  );

  for (const r of records) {
    for (const e of r.entries || []) {
      lines.push(
        [
          escapeCsv(r.guardName || ''),
          new Date(e.shiftDate).toLocaleDateString('en-AU'),
          e.scheduledHours ?? 0,
          e.actualHours    ?? 0,
          e.regularHours   ?? 0,
          e.overtimeHours  ?? 0,
          `$${e.payRate  ?? 0}`,
          `$${(e.regularPay  || 0).toFixed(2)}`,
          `$${(e.overtimePay || 0).toFixed(2)}`,
          `$${(e.totalPay    || 0).toFixed(2)}`,
          escapeCsv(e.attendanceStatus || 'n/a'),
        ].join(',')
      );
    }
  }

  const csv = lines.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="payroll-${startDate}-to-${endDate}.csv"`
  );
  // Prepend BOM so Excel opens UTF-8 correctly
  return res.send('\uFEFF' + csv);
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

async function sendPDF(res, records, periodType, startDate, endDate) {
  // Dynamic import so the app still boots even if pdfkit is not yet installed
  let PDFDocument;
  try {
    const mod  = await import('pdfkit');
    PDFDocument = mod.default;
  } catch {
    return res.status(500).json({
      message:
        'PDF generation requires the pdfkit package. ' +
        'Run `npm install pdfkit` in app-backend/ and restart the server.',
    });
  }

  const filename = `payroll-${startDate}-to-${endDate}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // ── Title ────────────────────────────────────────────────────────────────
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('SecureShift Payroll Report', { align: 'center' });

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .font('Helvetica')
    .text(`Period: ${capitalize(periodType)}   |   ${startDate}  →  ${endDate}`)
    .text(`Generated: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);

  doc.moveDown();

  // ── Period summary ───────────────────────────────────────────────────────
  const totalWorked = round2(records.reduce((s, r) => s + (r.totalWorkedHours   || 0), 0));
  const totalOT     = round2(records.reduce((s, r) => s + (r.totalOvertimeHours || 0), 0));
  const totalPay    = round2(records.reduce((s, r) => s + (r.grossPay           || 0), 0));

  doc.fontSize(13).font('Helvetica-Bold').text('Period Summary');
  doc
    .fontSize(11)
    .font('Helvetica')
    .text(`Total Guards Included : ${records.length}`)
    .text(`Total Hours Worked    : ${totalWorked} hrs`)
    .text(`Total Overtime Hours  : ${totalOT} hrs`)
    .text(`Total Gross Pay       : $${totalPay.toFixed(2)} AUD`);

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  // ── Per-guard sections ───────────────────────────────────────────────────
  for (const r of records) {
    if (doc.y > 680) doc.addPage();

    // Guard header
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`${r.guardName || 'Unknown Guard'}  (${r.guardEmail || ''})`, { underline: true });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Role: ${r.guardRole || 'guard'}   ` +
        `Status: ${r.status}   ` +
        `Gross Pay: $${(r.grossPay || 0).toFixed(2)} AUD`
      )
      .text(
        `Scheduled: ${r.totalScheduledHours}h   ` +
        `Worked: ${r.totalWorkedHours}h   ` +
        `Regular: ${r.totalRegularHours}h   ` +
        `Overtime: ${r.totalOvertimeHours}h`
      );

    if (r.approvedBy) {
      doc.text(
        `Approved by: ${r.approvedBy.name || r.approvedBy}   ` +
        `at: ${r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('en-AU') : '-'}`
      );
    }

    // Shift detail table
    if (r.entries && r.entries.length > 0) {
      doc.moveDown(0.4);
      doc.fontSize(8).font('Helvetica-Bold');

      const COL = { date: 55, sched: 130, actual: 185, reg: 235, ot: 280, rate: 325, rPay: 375, otPay: 425, total: 475 };
      const tableHeaderY = doc.y;

      // Column headers
      doc.text('Date',       COL.date,  tableHeaderY, { continued: true });
      doc.text('Sched h',   COL.sched,  tableHeaderY, { continued: true });
      doc.text('Actual h',  COL.actual, tableHeaderY, { continued: true });
      doc.text('Reg h',     COL.reg,    tableHeaderY, { continued: true });
      doc.text('OT h',      COL.ot,     tableHeaderY, { continued: true });
      doc.text('Rate',      COL.rate,   tableHeaderY, { continued: true });
      doc.text('Reg Pay',   COL.rPay,   tableHeaderY, { continued: true });
      doc.text('OT Pay',    COL.otPay,  tableHeaderY, { continued: true });
      doc.text('Total Pay', COL.total,  tableHeaderY);

      doc.font('Helvetica').fontSize(8);

      for (const e of r.entries) {
        if (doc.y > 740) doc.addPage();
        const rowY = doc.y;

        doc.text(new Date(e.shiftDate).toLocaleDateString('en-AU'), COL.date,  rowY, { continued: true });
        doc.text(String(e.scheduledHours),                           COL.sched,  rowY, { continued: true });
        doc.text(String(e.actualHours),                              COL.actual, rowY, { continued: true });
        doc.text(String(e.regularHours),                             COL.reg,    rowY, { continued: true });
        doc.text(String(e.overtimeHours),                            COL.ot,     rowY, { continued: true });
        doc.text(`$${e.payRate}`,                                    COL.rate,   rowY, { continued: true });
        doc.text(`$${(e.regularPay  || 0).toFixed(2)}`,              COL.rPay,   rowY, { continued: true });
        doc.text(`$${(e.overtimePay || 0).toFixed(2)}`,              COL.otPay,  rowY, { continued: true });
        doc.text(`$${(e.totalPay    || 0).toFixed(2)}`,              COL.total,  rowY);
      }
    }

    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).dash(3, { space: 3 }).stroke();
    doc.undash().moveDown(0.5);
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc
    .fontSize(8)
    .fillColor('grey')
    .text(
      `SecureShift Confidential – Generated ${new Date().toISOString()}`,
      { align: 'center' }
    );

  doc.end();
}

// ─── POST /api/v1/payroll/attendance ─────────────────────────────────────────

/**
 * Create or update a ShiftAttendance record.
 * Admins/branch_admins can record on behalf of any guard.
 * Guards can only record their own attendance.
 *
 * Body:
 *   shiftId   – ObjectId (required)
 *   guardId   – ObjectId (required for admin; defaults to self for guard)
 *   clockIn   – ISO datetime string (optional)
 *   clockOut  – ISO datetime string (optional)
 *   status    – 'absent' | 'scheduled' (optional override)
 *   notes     – string (optional)
 */
export const recordAttendance = async (req, res) => {
  try {
    let { shiftId, guardId, clockIn, clockOut, status, notes } = req.body;

    if (!shiftId || !mongoose.isValidObjectId(shiftId)) {
      return res.status(400).json({ message: 'shiftId is required and must be a valid ObjectId' });
    }

    // Role scoping
    const callerRole = req.user.role;
    const callerId   = String(req.user._id || req.user.id);

    if (callerRole === 'guard') {
      guardId = callerId; // guards can only record their own attendance
    } else {
      if (!guardId || !mongoose.isValidObjectId(guardId)) {
        return res.status(400).json({ message: 'guardId is required and must be a valid ObjectId' });
      }
    }

    // Verify the shift exists and the guard is assigned to it
    const shift = await Shift.findById(shiftId).lean();
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    if (String(shift.acceptedBy) !== String(guardId)) {
      return res.status(400).json({ message: 'Guard is not assigned to this shift' });
    }

    // Build scheduled start/end Date objects
    const shiftDate = new Date(shift.date);

    const [startH, startM] = shift.startTime.split(':').map(Number);
    const scheduledStart   = new Date(shiftDate);
    scheduledStart.setHours(startH, startM, 0, 0);

    const [endH, endM] = shift.endTime.split(':').map(Number);
    const scheduledEnd = new Date(shiftDate);
    scheduledEnd.setHours(endH, endM, 0, 0);
    if (scheduledEnd <= scheduledStart) {
      scheduledEnd.setDate(scheduledEnd.getDate() + 1); // overnight
    }

    // Parse and validate clockIn / clockOut
    const parsedClockIn  = clockIn  ? new Date(clockIn)  : undefined;
    const parsedClockOut = clockOut ? new Date(clockOut) : undefined;

    if (parsedClockIn  && isNaN(parsedClockIn.getTime()))  {
      return res.status(400).json({ message: 'clockIn is not a valid datetime' });
    }
    if (parsedClockOut && isNaN(parsedClockOut.getTime())) {
      return res.status(400).json({ message: 'clockOut is not a valid datetime' });
    }
    if (parsedClockIn && parsedClockOut && parsedClockOut <= parsedClockIn) {
      return res.status(400).json({ message: 'clockOut must be after clockIn' });
    }

    // Upsert
    const update = {
      scheduledStart,
      scheduledEnd,
      recordedBy: callerId,
    };
    if (parsedClockIn  !== undefined) update.clockIn  = parsedClockIn;
    if (parsedClockOut !== undefined) update.clockOut = parsedClockOut;
    if (status)                       update.status   = status;
    if (notes  !== undefined)         update.notes    = notes;

    const attendance = await ShiftAttendance.findOneAndUpdate(
      { shift: shiftId, guard: guardId },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );

    await req.audit.log(callerId, ACTIONS.ATTENDANCE_RECORDED, {
      shiftId, guardId, status: attendance.status, hoursWorked: attendance.hoursWorked,
    });

    return res.status(200).json({
      message:    'Attendance recorded',
      attendance,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Should not reach here due to upsert, but just in case
      return res.status(409).json({ message: 'Attendance record already exists for this shift/guard' });
    }
    console.error('[recordAttendance]', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/v1/payroll/attendance/:shiftId ──────────────────────────────────

/**
 * Retrieve attendance records for a shift.
 * Admin/employer sees all guards; guard sees only their own.
 */
export const getAttendanceForShift = async (req, res) => {
  try {
    const { shiftId } = req.params;

    if (!mongoose.isValidObjectId(shiftId)) {
      return res.status(400).json({ message: 'shiftId must be a valid ObjectId' });
    }

    const shift = await Shift.findById(shiftId).lean();
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const query = { shift: shiftId };

    if (req.user.role === 'guard') {
      query.guard = req.user._id || req.user.id;
    }

    const records = await ShiftAttendance.find(query)
      .populate('guard',      'name email role')
      .populate('recordedBy', 'name email')
      .lean();

    return res.json({ shiftId, count: records.length, records });
  } catch (err) {
    console.error('[getAttendanceForShift]', err);
    return res.status(500).json({ message: err.message });
  }
};
