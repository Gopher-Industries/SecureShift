import PDFDocument from 'pdfkit';
import Payroll from '../models/Payroll.js';
import Shift from '../models/Shift.js';
import ShiftAttendance from '../models/ShiftAttendance.js';

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_PERIOD_TYPES = new Set(['daily', 'weekly', 'monthly']);

const roundHours = (value) => Math.round((Math.max(0, value) + Number.EPSILON) * 100) / 100;
const roundMoney = (value) => Math.round((Math.max(0, value) + Number.EPSILON) * 100) / 100;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidISODateOnly = (value) => {
  if (!ISO_DATE_ONLY_REGEX.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const parseDateRange = ({ startDate, endDate, periodType }) => {
  if (!startDate || !endDate || !periodType) {
    throw createHttpError(400, 'startDate, endDate, and periodType are required');
  }

  if (!isValidISODateOnly(startDate) || !isValidISODateOnly(endDate)) {
    throw createHttpError(400, 'startDate and endDate must be valid ISO dates in YYYY-MM-DD format');
  }

  if (!ALLOWED_PERIOD_TYPES.has(periodType)) {
    throw createHttpError(400, 'periodType must be one of daily, weekly, or monthly');
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  if (start > end) {
    throw createHttpError(400, 'startDate cannot be after endDate');
  }

  return { start, end };
};

const getUserContext = (user) => {
  const userId = user?._id || user?.id;
  const role = user?.role;

  if (!userId || !role) {
    throw createHttpError(401, 'Unauthorised user context');
  }

  return { userId, role };
};

const getWeekStart = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);

  date.setUTCDate(diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getPeriodBoundsForDate = (dateValue, periodType) => {
  const date = new Date(dateValue);
  date.setUTCHours(0, 0, 0, 0);

  if (periodType === 'daily') {
    const periodStart = new Date(date);
    const periodEnd = new Date(date);
    periodEnd.setUTCHours(23, 59, 59, 999);
    return { periodStart, periodEnd, label: periodStart.toISOString().slice(0, 10) };
  }

  if (periodType === 'weekly') {
    const periodStart = getWeekStart(date);
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 6);
    periodEnd.setUTCHours(23, 59, 59, 999);
    return {
      periodStart,
      periodEnd,
      label: `week-of-${periodStart.toISOString().slice(0, 10)}`,
    };
  }

  const periodStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  return {
    periodStart,
    periodEnd,
    label: `${periodStart.getUTCFullYear()}-${String(periodStart.getUTCMonth() + 1).padStart(2, '0')}`,
  };
};

const getShiftStartDateTime = (shift) => {
  const [hour, minute] = String(shift.startTime || '').split(':').map(Number);
  const start = new Date(shift.date);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return start;
  }

  start.setHours(hour, minute, 0, 0);
  return start;
};

const calculateScheduledHours = (shift) => {
  if (!shift?.date || !shift?.startTime || !shift?.endTime) {
    return 0;
  }

  const [startHour, startMinute] = String(shift.startTime).split(':').map(Number);
  const [endHour, endMinute] = String(shift.endTime).split(':').map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  const scheduledStart = new Date(shift.date);
  const scheduledEnd = new Date(shift.date);

  scheduledStart.setHours(startHour, startMinute, 0, 0);
  scheduledEnd.setHours(endHour, endMinute, 0, 0);

  if (scheduledEnd <= scheduledStart) {
    scheduledEnd.setDate(scheduledEnd.getDate() + 1);
  }

  const breakMinutes = Number.isFinite(shift.breakTime) ? shift.breakTime : 0;
  const hours = (scheduledEnd - scheduledStart) / (1000 * 60 * 60) - breakMinutes / 60;

  return roundHours(hours);
};

const calculateAttendanceHours = (attendance) => {
  if (!attendance?.checkInTime || !attendance?.checkOutTime) {
    return null;
  }

  const hours =
    (new Date(attendance.checkOutTime) - new Date(attendance.checkInTime)) / (1000 * 60 * 60);

  if (!Number.isFinite(hours) || hours <= 0) {
    return null;
  }

  return roundHours(hours);
};

const buildShiftQuery = (query, userContext, range) => {
  const { guardId, department } = query;
  const { userId, role } = userContext;

  const shiftQuery = {
    status: 'completed',
    acceptedBy: { $ne: null },
    date: {
      $gte: range.start,
      $lte: range.end,
    },
  };

  if (role === 'guard') {
    if (guardId && String(guardId) !== String(userId)) {
      throw createHttpError(403, 'Guards can only access their own payroll');
    }
    shiftQuery.acceptedBy = userId;
  } else if (role === 'employer') {
    shiftQuery.createdBy = userId;
    if (guardId) shiftQuery.acceptedBy = guardId;
  } else if (role === 'admin') {
    if (guardId) shiftQuery.acceptedBy = guardId;
  } else {
    throw createHttpError(403, 'Forbidden: unsupported role');
  }

  if (department) {
    shiftQuery.field = department;
  }

  return shiftQuery;
};

const escapeCsv = (value) => {
  const stringValue = value == null ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const ensurePayrollIds = (payrollIds) => {
  if (!Array.isArray(payrollIds) || payrollIds.length === 0 || payrollIds.some((id) => !id)) {
    throw createHttpError(400, 'payrollIds must be a non-empty array');
  }

  return payrollIds;
};

const serializePayroll = (payrollDoc) => ({
  id: String(payrollDoc._id),
  guard: payrollDoc.guardId
    ? {
        id: String(payrollDoc.guardId._id || payrollDoc.guardId),
        name: payrollDoc.guardId.name || null,
      }
    : null,
  employer: payrollDoc.employerId
    ? {
        id: String(payrollDoc.employerId._id || payrollDoc.employerId),
        name: payrollDoc.employerId.name || null,
      }
    : null,
  periodType: payrollDoc.periodType,
  periodStart: payrollDoc.periodStart,
  periodEnd: payrollDoc.periodEnd,
  totalScheduledHours: payrollDoc.totalScheduledHours,
  totalActualHours: payrollDoc.totalActualHours,
  totalPayableHours: payrollDoc.totalPayableHours,
  totalOrdinaryHours: payrollDoc.totalOrdinaryHours,
  totalOvertimeHours: payrollDoc.totalOvertimeHours,
  totalOrdinaryAmount: payrollDoc.totalOrdinaryAmount,
  totalOvertimeAmount: payrollDoc.totalOvertimeAmount,
  totalAmount: payrollDoc.totalAmount,
  status: payrollDoc.status,
  approvedAt: payrollDoc.approvedAt,
  processedAt: payrollDoc.processedAt,
  entries: payrollDoc.entries.map((entry) => ({
    shiftId: String(entry.shiftId),
    shiftDate: entry.shiftDate,
    department: entry.department || null,
    hourlyRate: entry.hourlyRate,
    scheduledHours: entry.scheduledHours,
    actualHours: entry.actualHours,
    payableHours: entry.payableHours,
    ordinaryHours: entry.ordinaryHours,
    overtimeHours: entry.overtimeHours,
    ordinaryAmount: entry.ordinaryAmount,
    overtimeAmount: entry.overtimeAmount,
    totalAmount: entry.totalAmount,
    attendanceBased: entry.attendanceBased,
  })),
});

const applyDailyOvertime = (records) => {
  const groups = new Map();

  for (const record of records) {
    const key = `${record.guardId}:${new Date(record.shiftDate).toISOString().slice(0, 10)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  for (const group of groups.values()) {
    group.sort((a, b) => a.shiftStartAt - b.shiftStartAt);
    const totalHours = group.reduce((sum, item) => sum + item.payableHours, 0);
    let remainingOvertime = Math.max(0, totalHours - 8);

    for (let index = group.length - 1; index >= 0 && remainingOvertime > 0; index -= 1) {
      const item = group[index];
      const allocated = Math.min(remainingOvertime, item.payableHours);
      item.dailyOvertimeHours = roundHours(allocated);
      item.ordinaryAfterDailyHours = roundHours(item.payableHours - item.dailyOvertimeHours);
      remainingOvertime = roundHours(remainingOvertime - allocated);
    }

    for (const item of group) {
      if (item.dailyOvertimeHours == null) item.dailyOvertimeHours = 0;
      if (item.ordinaryAfterDailyHours == null) item.ordinaryAfterDailyHours = roundHours(item.payableHours);
    }
  }
};

const applyWeeklyOvertime = (records) => {
  const groups = new Map();

  for (const record of records) {
    const weekStart = getWeekStart(record.shiftDate).toISOString().slice(0, 10);
    const key = `${record.guardId}:${weekStart}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  for (const group of groups.values()) {
    group.sort((a, b) => a.shiftStartAt - b.shiftStartAt);
    const ordinaryPool = group.reduce((sum, item) => sum + item.ordinaryAfterDailyHours, 0);
    let remainingWeeklyOvertime = Math.max(0, ordinaryPool - 38);

    for (let index = group.length - 1; index >= 0 && remainingWeeklyOvertime > 0; index -= 1) {
      const item = group[index];
      const allocated = Math.min(remainingWeeklyOvertime, item.ordinaryAfterDailyHours);
      item.weeklyOvertimeHours = roundHours(allocated);
      remainingWeeklyOvertime = roundHours(remainingWeeklyOvertime - allocated);
    }

    for (const item of group) {
      if (item.weeklyOvertimeHours == null) item.weeklyOvertimeHours = 0;
    }
  }
};

const computeDerivedAmounts = (records) => {
  for (const record of records) {
    record.overtimeHours = roundHours(record.dailyOvertimeHours + record.weeklyOvertimeHours);
    record.ordinaryHours = roundHours(record.payableHours - record.overtimeHours);
    record.ordinaryAmount = roundMoney(record.ordinaryHours * record.hourlyRate);
    record.overtimeAmount = roundMoney(record.overtimeHours * record.hourlyRate * 1.5);
    record.totalAmount = roundMoney(record.ordinaryAmount + record.overtimeAmount);
  }
};

const buildComputedEntries = (shifts, attendanceRecords) => {
  const attendanceMap = new Map();

  for (const attendance of attendanceRecords) {
    attendanceMap.set(`${String(attendance.shiftId)}:${String(attendance.guardId)}`, attendance);
  }

  const records = [];

  for (const shift of shifts) {
    const guardId = String(shift.acceptedBy?._id || shift.acceptedBy);
    if (!guardId) continue;

    const attendance = attendanceMap.get(`${String(shift._id)}:${guardId}`);
    const scheduledHours = calculateScheduledHours(shift);
    const actualHours = calculateAttendanceHours(attendance);

    records.push({
      shiftId: shift._id,
      guardId,
      employerId: String(shift.createdBy?._id || shift.createdBy),
      shiftDate: shift.date,
      shiftStartAt: getShiftStartDateTime(shift),
      department: shift.field || null,
      hourlyRate: roundMoney(Number.isFinite(shift.payRate) ? shift.payRate : 0),
      scheduledHours,
      actualHours: roundHours(actualHours ?? scheduledHours),
      payableHours: roundHours(actualHours ?? scheduledHours),
      attendanceBased: actualHours != null,
    });
  }

  applyDailyOvertime(records);
  applyWeeklyOvertime(records);
  computeDerivedAmounts(records);

  return records;
};

const buildPayrollGroups = (records, periodType) => {
  const groups = new Map();

  for (const record of records) {
    const bounds = getPeriodBoundsForDate(record.shiftDate, periodType);
    const key = [
      record.guardId,
      record.employerId,
      periodType,
      bounds.periodStart.toISOString(),
      bounds.periodEnd.toISOString(),
    ].join(':');

    if (!groups.has(key)) {
      groups.set(key, {
        guardId: record.guardId,
        employerId: record.employerId,
        periodType,
        periodStart: bounds.periodStart,
        periodEnd: bounds.periodEnd,
        periodLabel: bounds.label,
        entries: [],
        totalScheduledHours: 0,
        totalActualHours: 0,
        totalPayableHours: 0,
        totalOrdinaryHours: 0,
        totalOvertimeHours: 0,
        totalOrdinaryAmount: 0,
        totalOvertimeAmount: 0,
        totalAmount: 0,
      });
    }

    const group = groups.get(key);
    group.entries.push({
      shiftId: record.shiftId,
      shiftDate: record.shiftDate,
      department: record.department,
      hourlyRate: record.hourlyRate,
      scheduledHours: record.scheduledHours,
      actualHours: record.actualHours,
      payableHours: record.payableHours,
      ordinaryHours: record.ordinaryHours,
      overtimeHours: record.overtimeHours,
      ordinaryAmount: record.ordinaryAmount,
      overtimeAmount: record.overtimeAmount,
      totalAmount: record.totalAmount,
      attendanceBased: record.attendanceBased,
    });
    group.totalScheduledHours = roundHours(group.totalScheduledHours + record.scheduledHours);
    group.totalActualHours = roundHours(group.totalActualHours + record.actualHours);
    group.totalPayableHours = roundHours(group.totalPayableHours + record.payableHours);
    group.totalOrdinaryHours = roundHours(group.totalOrdinaryHours + record.ordinaryHours);
    group.totalOvertimeHours = roundHours(group.totalOvertimeHours + record.overtimeHours);
    group.totalOrdinaryAmount = roundMoney(group.totalOrdinaryAmount + record.ordinaryAmount);
    group.totalOvertimeAmount = roundMoney(group.totalOvertimeAmount + record.overtimeAmount);
    group.totalAmount = roundMoney(group.totalAmount + record.totalAmount);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    entries: group.entries.sort((a, b) => new Date(a.shiftDate) - new Date(b.shiftDate)),
  }));
};

const syncPayrollDocuments = async (groups) => {
  if (!groups.length) return [];

  await Payroll.bulkWrite(
    groups.map((group) => ({
      updateOne: {
        filter: {
          guardId: group.guardId,
          employerId: group.employerId,
          periodType: group.periodType,
          periodStart: group.periodStart,
          periodEnd: group.periodEnd,
        },
        update: {
          $set: {
            entries: group.entries,
            totalScheduledHours: group.totalScheduledHours,
            totalActualHours: group.totalActualHours,
            totalPayableHours: group.totalPayableHours,
            totalOrdinaryHours: group.totalOrdinaryHours,
            totalOvertimeHours: group.totalOvertimeHours,
            totalOrdinaryAmount: group.totalOrdinaryAmount,
            totalOvertimeAmount: group.totalOvertimeAmount,
            totalAmount: group.totalAmount,
          },
          $setOnInsert: {
            status: 'PENDING',
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  return Payroll.find({
    $or: groups.map((group) => ({
      guardId: group.guardId,
      employerId: group.employerId,
      periodType: group.periodType,
      periodStart: group.periodStart,
      periodEnd: group.periodEnd,
    })),
  })
    .populate('guardId', 'name')
    .populate('employerId', 'name')
    .sort({ periodStart: 1, createdAt: 1 });
};

const buildSummary = (payrollDocs) => {
  return payrollDocs.reduce(
    (summary, doc) => {
      summary.count += 1;
      summary.totalScheduledHours = roundHours(summary.totalScheduledHours + doc.totalScheduledHours);
      summary.totalActualHours = roundHours(summary.totalActualHours + doc.totalActualHours);
      summary.totalPayableHours = roundHours(summary.totalPayableHours + doc.totalPayableHours);
      summary.totalOrdinaryHours = roundHours(summary.totalOrdinaryHours + doc.totalOrdinaryHours);
      summary.totalOvertimeHours = roundHours(summary.totalOvertimeHours + doc.totalOvertimeHours);
      summary.totalOrdinaryAmount = roundMoney(summary.totalOrdinaryAmount + doc.totalOrdinaryAmount);
      summary.totalOvertimeAmount = roundMoney(summary.totalOvertimeAmount + doc.totalOvertimeAmount);
      summary.totalAmount = roundMoney(summary.totalAmount + doc.totalAmount);
      return summary;
    },
    {
      count: 0,
      totalScheduledHours: 0,
      totalActualHours: 0,
      totalPayableHours: 0,
      totalOrdinaryHours: 0,
      totalOvertimeHours: 0,
      totalOrdinaryAmount: 0,
      totalOvertimeAmount: 0,
      totalAmount: 0,
    }
  );
};

const ensureScopedPayrollDocs = async (payrollIds, user) => {
  const { userId, role } = getUserContext(user);
  const docs = await Payroll.find({ _id: { $in: ensurePayrollIds(payrollIds) } })
    .populate('guardId', 'name')
    .populate('employerId', 'name');

  if (docs.length !== payrollIds.length) {
    throw createHttpError(404, 'One or more payroll records were not found');
  }

  if (role === 'guard') {
    throw createHttpError(403, 'Guards cannot approve or process payroll');
  }

  if (role === 'employer') {
    const invalid = docs.some((doc) => String(doc.employerId._id || doc.employerId) !== String(userId));
    if (invalid) {
      throw createHttpError(403, 'Forbidden: one or more payroll records are outside your scope');
    }
  }

  return docs;
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

export const getPayrollRecords = async (query, user) => {
  const userContext = getUserContext(user);
  const range = parseDateRange(query);
  const shiftQuery = buildShiftQuery(query, userContext, range);

  const shifts = await Shift.find(shiftQuery)
    .populate('acceptedBy', 'name')
    .populate('createdBy', 'name')
    .sort({ date: 1, startTime: 1 });

  if (!shifts.length) {
    return {
      filters: {
        startDate: query.startDate,
        endDate: query.endDate,
        periodType: query.periodType,
        guardId: query.guardId || null,
        department: query.department || null,
      },
      summary: buildSummary([]),
      payroll: [],
    };
  }

  const attendanceRecords = await ShiftAttendance.find({
    shiftId: { $in: shifts.map((shift) => shift._id) },
  });

  const computedEntries = buildComputedEntries(shifts, attendanceRecords);
  const groups = buildPayrollGroups(computedEntries, query.periodType);
  const payrollDocs = await syncPayrollDocuments(groups);

  return {
    filters: {
      startDate: query.startDate,
      endDate: query.endDate,
      periodType: query.periodType,
      guardId: query.guardId || null,
      department: query.department || null,
    },
    summary: buildSummary(payrollDocs),
    payroll: payrollDocs.map(serializePayroll),
  };
};

export const approvePayrollRecords = async (payrollIds, user) => {
  const docs = await ensureScopedPayrollDocs(payrollIds, user);
  const userId = user._id || user.id;

  for (const doc of docs) {
    if (doc.status !== 'PENDING') {
      throw createHttpError(409, 'Only payroll records in PENDING status can be approved');
    }
  }

  await Payroll.updateMany(
    { _id: { $in: docs.map((doc) => doc._id) } },
    {
      $set: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    }
  );

  const updatedDocs = await Payroll.find({ _id: { $in: docs.map((doc) => doc._id) } })
    .populate('guardId', 'name')
    .populate('employerId', 'name')
    .sort({ periodStart: 1, createdAt: 1 });

  return updatedDocs.map(serializePayroll);
};

export const processPayrollRecords = async (payrollIds, user) => {
  const docs = await ensureScopedPayrollDocs(payrollIds, user);
  const userId = user._id || user.id;

  for (const doc of docs) {
    if (doc.status !== 'APPROVED') {
      throw createHttpError(409, 'Only payroll records in APPROVED status can be processed');
    }
  }

  await Payroll.updateMany(
    { _id: { $in: docs.map((doc) => doc._id) } },
    {
      $set: {
        status: 'PROCESSED',
        processedAt: new Date(),
        processedBy: userId,
      },
    }
  );

  const updatedDocs = await Payroll.find({ _id: { $in: docs.map((doc) => doc._id) } })
    .populate('guardId', 'name')
    .populate('employerId', 'name')
    .sort({ periodStart: 1, createdAt: 1 });

  return updatedDocs.map(serializePayroll);
};

export const exportPayrollCsv = async (query, user) => {
  const result = await getPayrollRecords(query, user);
  const rows = [
    [
      'payrollId',
      'guardId',
      'guardName',
      'employerId',
      'employerName',
      'periodType',
      'periodStart',
      'periodEnd',
      'status',
      'totalScheduledHours',
      'totalActualHours',
      'totalPayableHours',
      'totalOrdinaryHours',
      'totalOvertimeHours',
      'totalAmount',
      'entryCount',
    ].map(escapeCsv).join(','),
  ];

  for (const item of result.payroll) {
    rows.push(
      [
        item.id,
        item.guard?.id || '',
        item.guard?.name || '',
        item.employer?.id || '',
        item.employer?.name || '',
        item.periodType,
        item.periodStart ? new Date(item.periodStart).toISOString() : '',
        item.periodEnd ? new Date(item.periodEnd).toISOString() : '',
        item.status,
        item.totalScheduledHours,
        item.totalActualHours,
        item.totalPayableHours,
        item.totalOrdinaryHours,
        item.totalOvertimeHours,
        item.totalAmount,
        item.entries.length,
      ].map(escapeCsv).join(',')
    );
  }

  return rows.join('\n');
};

export const exportPayrollPdf = async (query, user) => {
  const result = await getPayrollRecords(query, user);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const buffers = [];

  doc.on('data', (chunk) => buffers.push(chunk));

  const finishPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });

  doc.fontSize(18).text('Payroll Report');
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Period: ${query.startDate} to ${query.endDate}`);
  doc.text(`Grouping: ${query.periodType}`);
  doc.moveDown();
  doc.text(`Payroll documents: ${result.summary.count}`);
  doc.text(`Total payable hours: ${result.summary.totalPayableHours}`);
  doc.text(`Total overtime hours: ${result.summary.totalOvertimeHours}`);
  doc.text(`Total amount: ${formatCurrency(result.summary.totalAmount)}`);
  doc.moveDown();

  for (const payroll of result.payroll) {
    doc.fontSize(12).text(
      `${payroll.guard?.name || 'Unknown guard'} | ${payroll.periodType} | ${formatCurrency(payroll.totalAmount)}`,
      { underline: true }
    );
    doc.fontSize(10).text(`Status: ${payroll.status}`);
    doc.text(`Employer: ${payroll.employer?.name || 'Unknown employer'}`);
    doc.text(
      `Period: ${new Date(payroll.periodStart).toISOString().slice(0, 10)} to ${new Date(payroll.periodEnd)
        .toISOString()
        .slice(0, 10)}`
    );
    doc.text(
      `Hours: ordinary ${payroll.totalOrdinaryHours}, overtime ${payroll.totalOvertimeHours}, payable ${payroll.totalPayableHours}`
    );
    doc.moveDown(0.25);

    for (const entry of payroll.entries) {
      doc.text(
        `- ${new Date(entry.shiftDate).toISOString().slice(0, 10)} | Shift ${entry.shiftId} | ${entry.payableHours}h | ${formatCurrency(entry.totalAmount)}`
      );
    }

    doc.moveDown();
    if (doc.y > 700) {
      doc.addPage();
    }
  }

  doc.end();
  return finishPromise;
};
