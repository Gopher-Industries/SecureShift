import mongoose from 'mongoose';
import Shift from '../models/Shift.js';
import { ACTIONS } from '../middleware/logger.js';
import { timeToMinutes, normalizeEnd } from '../utils/timeUtils.js';

// Returns true if now is at/after the shift start datetime
const isInPastOrStarted = (shift) => {
  try {
    const [sh, sm] = String(shift.startTime).split(':').map(Number);
    const start = new Date(shift.date);
    start.setHours(sh, sm, 0, 0);
    return new Date() >= start;
  } catch {
    return false;
  }
};

const serviceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const applyForShiftService = async ({ shiftId, userId, audit }) => {
  if (!mongoose.isValidObjectId(shiftId)) {
    throw serviceError(400, 'Invalid id');
  }

  if (!userId || !mongoose.isValidObjectId(String(userId))) {
    throw serviceError(401, 'Authenticated user id missing from context');
  }

  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw serviceError(404, 'Shift not found');
  }

  if (shift.status !== 'open') {
    throw serviceError(400, 'Can only apply to open shifts');
  }

  if (isInPastOrStarted(shift)) {
    throw serviceError(400, 'Cannot apply; shift already started or in the past');
  }

  if (String(shift.createdBy) === String(userId)) {
    throw serviceError(400, 'Employer cannot apply to own shift');
  }

  // sanitize & dedupe
  shift.applicants = (shift.applicants || []).filter(Boolean);
  if (shift.applicants.some(a => String(a) === String(userId))) {
    throw serviceError(400, 'Already applied');
  }

  const userShifts = await Shift.find({
    date: shift.date,
    _id: { $ne: shiftId },
    applicants: userId,
  });

  const hasOverlap = userShifts.some(existing => {
    const newStart = timeToMinutes(shift.startTime);
    const newEnd = normalizeEnd(shift.startTime, shift.endTime);
    const exStart = timeToMinutes(existing.startTime);
    const exEnd = normalizeEnd(existing.startTime, existing.endTime);
    return newStart < exEnd && newEnd > exStart;
  });

  if (hasOverlap) {
    throw serviceError(400, 'Cannot apply; shift overlaps with existing applied shift/s');
  }

  shift.applicants.push(userId);
  shift.status = 'applied';

  await shift.save();

  await audit.log(userId, ACTIONS.SHIFT_APPLIED, {
    shiftId: shift._id
  });

  return { message: 'Application submitted', shift };
};

export const approveShiftService = async ({ shiftId, guardId, keepOthers = false, user, audit }) => {
  if (!mongoose.isValidObjectId(shiftId) || !mongoose.isValidObjectId(guardId)) {
    throw serviceError(400, 'Invalid id(s)');
  }

  if (!user?._id || !mongoose.isValidObjectId(String(user._id))) {
    throw serviceError(401, 'Authenticated user id missing from context');
  }

  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw serviceError(404, 'Shift not found');
  }

  const isOwner = String(shift.createdBy) === String(user._id);
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) throw serviceError(403, 'Not allowed');

  if (['assigned', 'completed'].includes(shift.status)) {
    throw serviceError(400, `Already ${shift.status}`);
  }

  if (isInPastOrStarted(shift)) {
    throw serviceError(400, 'Cannot approve; shift already started or in the past');
  }

  if (!shift.applicants.some(a => String(a) === String(guardId))) {
    throw serviceError(400, 'Guard did not apply for this shift');
  }

  shift.assignedGuard = guardId; // virtual -> acceptedBy
  shift.status = 'assigned';

  if (!keepOthers) shift.applicants = [guardId];

  await shift.save();

  await audit.log(user._id, ACTIONS.SHIFT_APPROVED, {
    shiftId: shift._id,
    approvedGuardId: guardId,
    keepOthers
  });

  return { message: 'Guard approved', shift };
};

