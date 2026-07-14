import mongoose from 'mongoose';
import ShiftRequest, {
  SHIFT_REQUEST_STATUSES,
  SHIFT_REQUEST_TYPES,
} from '../models/ShiftRequest.js';
import Shift from '../models/Shift.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

const TERMINAL_STATUSES = ['APPROVED', 'REJECTED'];

class ServiceError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const actorId = (user) => user?._id || user?.id;

const assertObjectId = (value, field) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new ServiceError(400, `${field} must be a valid ObjectId`);
  }
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const isPastShift = (shift) => new Date(shift.date) < startOfToday();

const objectIdEquals = (a, b) => String(a) === String(b);

const refId = (value) => value?._id || value;

const includesObjectId = (values = [], id) => (
  Array.isArray(values) && values.some((value) => objectIdEquals(value, id))
);

const isGuardAssignedToShift = (shift, guardId) => (
  includesObjectId(shift.guardIds, guardId) || objectIdEquals(shift.acceptedBy, guardId)
);

const assertGuardUser = async (guardId, message = 'Guard not found') => {
  const guard = await User.findOne({
    _id: guardId,
    role: 'guard',
    isDeleted: { $ne: true },
  }).lean();

  if (!guard) {
    throw new ServiceError(404, message);
  }

  return guard;
};

const employerShiftScopeFilter = async (employerId) => {
  const branchIds = await Branch.find({ employerId, isActive: true }).distinct('_id');

  return {
    $or: [
      { createdBy: employerId },
      { siteId: { $in: branchIds } },
    ],
  };
};

const ensureEmployerCanReviewShift = async (shiftId, user) => {
  const uid = actorId(user);

  if (user.role === 'admin') {
    return Shift.findById(shiftId);
  }

  const scopeFilter = await employerShiftScopeFilter(uid);
  return Shift.findOne({
    _id: shiftId,
    ...scopeFilter,
  });
};

export const createShiftRequest = async ({ user, payload }) => {
  const requestingGuardId = actorId(user);

  if (!requestingGuardId) {
    throw new ServiceError(401, 'Authenticated user id missing from context');
  }

  if (user.role !== 'guard') {
    throw new ServiceError(403, 'Only guards can create shift requests');
  }

  const {
    type,
    targetGuardId,
    originalShiftId,
    replacementShiftId,
    leaveStartDate,
    leaveEndDate,
    reason,
  } = payload;

  if (!SHIFT_REQUEST_TYPES.includes(type)) {
    throw new ServiceError(400, 'type must be SWAP or LEAVE');
  }
  assertObjectId(originalShiftId, 'originalShiftId');

  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    throw new ServiceError(400, 'reason must be at least 3 characters');
  }

  const originalShift = await Shift.findById(originalShiftId);
  if (!originalShift) {
    throw new ServiceError(404, 'Original shift not found');
  }

  if (!isGuardAssignedToShift(originalShift, requestingGuardId)) {
    throw new ServiceError(403, 'You are not assigned to this shift');
  }

  if (isPastShift(originalShift)) {
    throw new ServiceError(400, 'Cannot request changes for past shifts');
  }

  const existingRequest = await ShiftRequest.findOne({
    originalShiftId,
    requestingGuardId,
    status: 'PENDING',
  }).lean();

  if (existingRequest) {
    throw new ServiceError(400, 'You already have a pending request for this shift');
  }

  const requestData = {
    type,
    requestingGuardId,
    originalShiftId,
    reason: reason.trim(),
  };

  if (type === 'SWAP') {
    if (!targetGuardId) {
      throw new ServiceError(400, 'targetGuardId is required for swap requests');
    }
    assertObjectId(targetGuardId, 'targetGuardId');

    if (objectIdEquals(targetGuardId, requestingGuardId)) {
      throw new ServiceError(400, 'Cannot swap a shift with yourself');
    }

    await assertGuardUser(targetGuardId, 'Target guard not found');
    requestData.targetGuardId = targetGuardId;

    if (replacementShiftId) {
      assertObjectId(replacementShiftId, 'replacementShiftId');
      const replacementShift = await Shift.findById(replacementShiftId);

      if (!replacementShift) {
        throw new ServiceError(404, 'Replacement shift not found');
      }

      if (!isGuardAssignedToShift(replacementShift, targetGuardId)) {
        throw new ServiceError(403, 'Replacement shift must belong to the target guard');
      }

      if (isPastShift(replacementShift)) {
        throw new ServiceError(400, 'Cannot swap with past shifts');
      }

      requestData.replacementShiftId = replacementShiftId;
    }
  }

  if (type === 'LEAVE') {
    if (!leaveStartDate || !leaveEndDate) {
      throw new ServiceError(400, 'leaveStartDate and leaveEndDate are required for leave requests');
    }

    requestData.leaveStartDate = new Date(leaveStartDate);
    requestData.leaveEndDate = new Date(leaveEndDate);

    if (
      Number.isNaN(requestData.leaveStartDate.getTime()) ||
      Number.isNaN(requestData.leaveEndDate.getTime())
    ) {
      throw new ServiceError(400, 'leaveStartDate and leaveEndDate must be valid dates');
    }

    if (requestData.leaveEndDate < requestData.leaveStartDate) {
      throw new ServiceError(400, 'leaveEndDate must be on or after leaveStartDate');
    }
  }

  return ShiftRequest.create(requestData);
};

export const listShiftRequestsForUser = async ({ user, query = {} }) => {
  const uid = actorId(user);
  const filter = {};

  if (user.role === 'guard') {
    filter.requestingGuardId = uid;
  } else if (user.role === 'employer') {
    const shiftScopeFilter = await employerShiftScopeFilter(uid);
    const shiftIds = await Shift.find(shiftScopeFilter).distinct('_id');
    filter.originalShiftId = { $in: shiftIds };
  } else if (user.role !== 'admin') {
    throw new ServiceError(403, 'Forbidden');
  }

  if (query.status) {
    if (!SHIFT_REQUEST_STATUSES.includes(query.status)) {
      throw new ServiceError(400, 'Invalid status filter');
    }
    filter.status = query.status;
  }

  if (query.type) {
    if (!SHIFT_REQUEST_TYPES.includes(query.type)) {
      throw new ServiceError(400, 'Invalid type filter');
    }
    filter.type = query.type;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const requestQuery = ShiftRequest.find(filter)
    .populate('requestingGuardId', 'name email phone')
    .populate('targetGuardId', 'name email')
    .populate('originalShiftId', 'title date startTime endTime location urgency status createdBy siteId')
    .populate('replacementShiftId', 'title date startTime endTime')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const [items, total] = await Promise.all([
    requestQuery.lean(),
    ShiftRequest.countDocuments(filter),
  ]);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    items,
  };
};

export const getShiftRequestForUser = async ({ user, requestId }) => {
  assertObjectId(requestId, 'requestId');

  const request = await ShiftRequest.findById(requestId)
    .populate('requestingGuardId', 'name email phone')
    .populate('targetGuardId', 'name email')
    .populate('originalShiftId', 'title date startTime endTime location urgency status createdBy siteId')
    .populate('replacementShiftId', 'title date startTime endTime')
    .populate('reviewedBy', 'name email');

  if (!request) {
    throw new ServiceError(404, 'Shift request not found');
  }

  const uid = actorId(user);

  if (user.role === 'guard' && !objectIdEquals(refId(request.requestingGuardId), uid)) {
    throw new ServiceError(403, 'Access denied');
  }

  if (user.role === 'employer') {
    const shiftId = refId(request.originalShiftId);
    const shift = await ensureEmployerCanReviewShift(shiftId, user);

    if (!shift) {
      throw new ServiceError(403, 'Access denied');
    }
  }

  return request;
};

export const reviewShiftRequest = async ({ user, requestId, status, rejectionReason }) => {
  const uid = actorId(user);

  if (!['employer', 'admin'].includes(user.role)) {
    throw new ServiceError(403, 'Only employers or admins can approve or reject requests');
  }

  assertObjectId(requestId, 'requestId');

  if (!TERMINAL_STATUSES.includes(status)) {
    throw new ServiceError(400, 'status must be APPROVED or REJECTED');
  }

  const request = await ShiftRequest.findById(requestId);
  if (!request) {
    throw new ServiceError(404, 'Shift request not found');
  }

  if (request.status !== 'PENDING') {
    throw new ServiceError(400, `Cannot transition shift request from ${request.status} to ${status}`);
  }

  const scopedShift = await ensureEmployerCanReviewShift(request.originalShiftId, user);
  if (!scopedShift) {
    throw new ServiceError(403, 'You can only review requests for shifts in your employment scope');
  }

  request.status = status;
  request.reviewedBy = uid;
  request.reviewedAt = new Date();
  request.rejectionReason = status === 'REJECTED'
    ? (rejectionReason || 'No reason provided')
    : null;

  await request.save();
  return request;
};
