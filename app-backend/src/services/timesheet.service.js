import mongoose from 'mongoose';
import Shift from '../models/Shift.js';
import ShiftAttendance from '../models/ShiftAttendance.js';
import Timesheet from '../models/Timesheet.js';
import {
  calculateAttendanceHours,
  calculateScheduledHours,
} from './payroll.service.js';

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

const parseDateRange = ({ startDate, endDate }, { required = false } = {}) => {
  if (!startDate && !endDate && !required) return null;

  if (!startDate || !endDate) {
    throw createHttpError(400, 'startDate and endDate are required');
  }

  if (!isValidISODateOnly(startDate) || !isValidISODateOnly(endDate)) {
    throw createHttpError(400, 'startDate and endDate must be valid ISO dates in YYYY-MM-DD format');
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
    throw createHttpError(401, 'Unauthorized');
  }

  return { userId, role };
};

const ensureObjectId = (value, fieldName) => {
  if (value && !mongoose.isValidObjectId(value)) {
    throw createHttpError(400, `${fieldName} must be a valid id`);
  }
};

const buildShiftQuery = (filters, user) => {
  const { userId, role } = getUserContext(user);
  const range = parseDateRange(filters, { required: true });
  const { guardId } = filters;

  ensureObjectId(guardId, 'guardId');

  const query = {
    status: 'completed',
    acceptedBy: { $ne: null },
    date: {
      $gte: range.start,
      $lte: range.end,
    },
  };

  if (role === 'guard') {
    if (guardId && String(guardId) !== String(userId)) {
      throw createHttpError(403, 'Guards can only generate their own timesheets');
    }
    query.acceptedBy = userId;
  } else if (role === 'employer') {
    query.createdBy = userId;
    if (guardId) query.acceptedBy = guardId;
  } else if (role === 'admin') {
    if (guardId) query.acceptedBy = guardId;
  } else {
    throw createHttpError(403, 'Forbidden: unsupported role');
  }

  return query;
};

const buildTimesheetQuery = (filters, user) => {
  const { userId, role } = getUserContext(user);
  const { guardId } = filters;

  ensureObjectId(guardId, 'guardId');

  const query = {};

  if (role === 'guard') {
    if (guardId && String(guardId) !== String(userId)) {
      throw createHttpError(403, 'Guards can only access their own timesheets');
    }
    query.guardId = userId;
  } else if (role === 'employer') {
    query.employerId = userId;
    if (guardId) query.guardId = guardId;
  } else if (role === 'admin') {
    if (guardId) query.guardId = guardId;
  } else {
    throw createHttpError(403, 'Forbidden: unsupported role');
  }

  const range = parseDateRange(filters);
  if (range) {
    query.shiftDate = {
      $gte: range.start,
      $lte: range.end,
    };
  }

  return query;
};

const serializeTimesheet = (timesheet) => ({
  id: String(timesheet._id),
  shiftId: String(timesheet.shiftId?._id || timesheet.shiftId),
  guardId: String(timesheet.guardId?._id || timesheet.guardId),
  employerId: String(timesheet.employerId?._id || timesheet.employerId),
  attendanceId: String(timesheet.attendanceId?._id || timesheet.attendanceId),
  shiftDate: timesheet.shiftDate,
  checkInTime: timesheet.checkInTime,
  checkOutTime: timesheet.checkOutTime,
  scheduledHours: timesheet.scheduledHours,
  actualHours: timesheet.actualHours,
  payableHours: timesheet.payableHours,
  attendanceBased: timesheet.attendanceBased,
  generatedAt: timesheet.generatedAt,
});

const buildValidTimesheetRecord = (shift, attendance) => {
  const guardId = shift.acceptedBy?._id || shift.acceptedBy;
  const employerId = shift.createdBy?._id || shift.createdBy;
  const actualHours = calculateAttendanceHours(attendance);

  if (
    shift.status !== 'completed' ||
    !guardId ||
    !employerId ||
    !attendance?._id ||
    String(attendance.guardId) !== String(guardId) ||
    String(attendance.shiftId) !== String(shift._id) ||
    actualHours == null
  ) {
    return null;
  }

  return {
    shiftId: shift._id,
    guardId,
    employerId,
    attendanceId: attendance._id,
    shiftDate: shift.date,
    checkInTime: attendance.checkInTime,
    checkOutTime: attendance.checkOutTime,
    scheduledHours: calculateScheduledHours(shift),
    actualHours,
    payableHours: actualHours,
    attendanceBased: true,
  };
};

const populateTimesheetQuery = (query) =>
  query
    .populate('guardId', 'name email')
    .populate('employerId', 'name email')
    .populate('shiftId', 'title date startTime endTime status')
    .populate('attendanceId', 'checkInTime checkOutTime');

export const generateTimesheets = async (filters, user) => {
  const shiftQuery = buildShiftQuery(filters, user);
  const shifts = await Shift.find(shiftQuery).sort({ date: 1, startTime: 1 });

  if (!shifts.length) {
    return { generated: 0, skipped: 0, timesheets: [] };
  }

  const attendanceRecords = await ShiftAttendance.find({
    shiftId: { $in: shifts.map((shift) => shift._id) },
    checkInTime: { $ne: null },
    checkOutTime: { $ne: null },
  });
  const attendanceMap = new Map();

  for (const attendance of attendanceRecords) {
    attendanceMap.set(`${String(attendance.shiftId)}:${String(attendance.guardId)}`, attendance);
  }

  const records = shifts
    .map((shift) => {
      const guardId = shift.acceptedBy?._id || shift.acceptedBy;
      return buildValidTimesheetRecord(
        shift,
        attendanceMap.get(`${String(shift._id)}:${String(guardId)}`)
      );
    })
    .filter(Boolean);

  if (!records.length) {
    return { generated: 0, skipped: shifts.length, timesheets: [] };
  }

  await Timesheet.bulkWrite(
    records.map((record) => ({
      updateOne: {
        filter: {
          shiftId: record.shiftId,
          guardId: record.guardId,
        },
        update: {
          $set: record,
          $setOnInsert: {
            generatedAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const docs = await populateTimesheetQuery(
    Timesheet.find({
      $or: records.map((record) => ({
        shiftId: record.shiftId,
        guardId: record.guardId,
      })),
    }).sort({ shiftDate: 1, createdAt: 1 })
  );

  return {
    generated: docs.length,
    skipped: shifts.length - records.length,
    timesheets: docs.map(serializeTimesheet),
  };
};

export const listTimesheetsForUser = async (filters, user) => {
  const query = buildTimesheetQuery(filters, user);
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    populateTimesheetQuery(
      Timesheet.find(query).sort({ shiftDate: -1, createdAt: -1 }).skip(skip).limit(limit)
    ),
    Timesheet.countDocuments(query),
  ]);

  return {
    page,
    limit,
    total,
    timesheets: docs.map(serializeTimesheet),
  };
};

export const getTimesheetForUser = async (timesheetId, user) => {
  if (!mongoose.isValidObjectId(timesheetId)) {
    throw createHttpError(400, 'Invalid timesheet id');
  }

  const query = buildTimesheetQuery({}, user);
  query._id = timesheetId;

  const timesheet = await populateTimesheetQuery(Timesheet.findOne(query));

  if (!timesheet) {
    throw createHttpError(404, 'Timesheet not found');
  }

  return serializeTimesheet(timesheet);
};
