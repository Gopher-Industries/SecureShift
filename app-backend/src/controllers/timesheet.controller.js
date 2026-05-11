import mongoose from 'mongoose';
import Timesheet from '../models/Timesheet.js';

const buildScopedQuery = (user) => {
  if (!user?._id || !user?.role) {
    throw Object.assign(new Error('Unauthorised'), { statusCode: 401 });
  }

  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'employer') {
    return { employerId: user._id };
  }

  if (user.role === 'guard') {
    return { guardId: user._id };
  }

  throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
};

const applyFilters = (query, filters, user) => {
  const { guardId, status, startDate, endDate } = filters;

  if (guardId) {
    if (!mongoose.isValidObjectId(guardId)) {
      throw Object.assign(new Error('Invalid guardId'), { statusCode: 400 });
    }

    if (user.role === 'guard' && String(guardId) !== String(user._id)) {
      throw Object.assign(new Error('Guards can only access their own timesheets'), { statusCode: 403 });
    }

    query.guardId = guardId;
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.shiftDate = {};

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) {
        throw Object.assign(new Error('Invalid startDate'), { statusCode: 400 });
      }
      query.shiftDate.$gte = start;
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999Z`);
      if (Number.isNaN(end.getTime())) {
        throw Object.assign(new Error('Invalid endDate'), { statusCode: 400 });
      }
      query.shiftDate.$lte = end;
    }
  }

  return query;
};

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    message: statusCode === 500 ? 'Failed to retrieve timesheets' : error.message,
  });
};

export const listTimesheets = async (req, res) => {
  try {
    const query = applyFilters(buildScopedQuery(req.user), req.query, req.user);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Timesheet.find(query)
        .sort({ shiftDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('guardId', 'name email')
        .populate('employerId', 'name email')
        .populate('shiftId', 'title date startTime endTime location payRate status')
        .lean(),
      Timesheet.countDocuments(query),
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      items,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getTimesheetById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid timesheet id' });
    }

    const query = buildScopedQuery(req.user);
    query._id = id;

    const timesheet = await Timesheet.findOne(query)
      .populate('guardId', 'name email')
      .populate('employerId', 'name email')
      .populate('shiftId', 'title date startTime endTime location payRate status')
      .lean();

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    return res.status(200).json(timesheet);
  } catch (error) {
    return sendError(res, error);
  }
};
