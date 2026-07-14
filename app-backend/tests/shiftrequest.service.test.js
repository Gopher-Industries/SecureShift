import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import mongoose from 'mongoose';
import {
  createShiftRequest,
  listShiftRequestsForUser,
  reviewShiftRequest,
} from '../src/services/shiftrequest.service.js';
import ShiftRequest from '../src/models/ShiftRequest.js';
import Shift from '../src/models/Shift.js';
import User from '../src/models/User.js';
import Branch from '../src/models/Branch.js';

jest.mock('../src/models/ShiftRequest.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
  SHIFT_REQUEST_TYPES: ['SWAP', 'LEAVE'],
  SHIFT_REQUEST_STATUSES: ['PENDING', 'APPROVED', 'REJECTED'],
}));
jest.mock('../src/models/Shift.js');
jest.mock('../src/models/User.js');
jest.mock('../src/models/Branch.js');

const objectId = () => new mongoose.Types.ObjectId().toString();

const leanResult = (value) => ({
  lean: jest.fn().mockResolvedValue(value),
});

const distinctResult = (value) => ({
  distinct: jest.fn().mockResolvedValue(value),
});

const requestFindChain = (items) => {
  const chain = {
    populate: jest.fn(() => chain),
    sort: jest.fn(() => chain),
    skip: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    lean: jest.fn().mockResolvedValue(items),
  };
  return chain;
};

describe('shiftrequest.service', () => {
  let guardId;
  let targetGuardId;
  let employerId;
  let shiftId;

  beforeEach(() => {
    jest.clearAllMocks();

    guardId = objectId();
    targetGuardId = objectId();
    employerId = objectId();
    shiftId = objectId();
  });

  describe('createShiftRequest', () => {
    it('creates a leave request for an assigned guard', async () => {
      const shift = {
        _id: shiftId,
        date: new Date(Date.now() + 86400000),
        guardIds: [guardId],
        acceptedBy: guardId,
      };
      const createdRequest = { _id: objectId(), type: 'LEAVE' };

      Shift.findById.mockResolvedValue(shift);
      ShiftRequest.findOne.mockReturnValue(leanResult(null));
      ShiftRequest.create.mockResolvedValue(createdRequest);

      const result = await createShiftRequest({
        user: { _id: guardId, role: 'guard' },
        payload: {
          type: 'LEAVE',
          originalShiftId: shiftId,
          leaveStartDate: '2026-12-01',
          leaveEndDate: '2026-12-02',
          reason: 'Family commitment',
        },
      });

      expect(result).toBe(createdRequest);
      expect(ShiftRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'LEAVE',
        requestingGuardId: guardId,
        originalShiftId: shiftId,
        reason: 'Family commitment',
      }));
    });

    it('blocks duplicate pending requests for the same guard and shift', async () => {
      Shift.findById.mockResolvedValue({
        _id: shiftId,
        date: new Date(Date.now() + 86400000),
        guardIds: [guardId],
      });
      ShiftRequest.findOne.mockReturnValue(leanResult({ _id: objectId() }));

      await expect(createShiftRequest({
        user: { _id: guardId, role: 'guard' },
        payload: {
          type: 'LEAVE',
          originalShiftId: shiftId,
          leaveStartDate: '2026-12-01',
          leaveEndDate: '2026-12-02',
          reason: 'Family commitment',
        },
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'You already have a pending request for this shift',
      });
    });

    it('validates swap target guards', async () => {
      Shift.findById.mockResolvedValue({
        _id: shiftId,
        date: new Date(Date.now() + 86400000),
        guardIds: [guardId],
      });
      ShiftRequest.findOne.mockReturnValue(leanResult(null));
      User.findOne.mockReturnValue(leanResult(null));

      await expect(createShiftRequest({
        user: { _id: guardId, role: 'guard' },
        payload: {
          type: 'SWAP',
          targetGuardId,
          originalShiftId: shiftId,
          reason: 'Need coverage',
        },
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Target guard not found',
      });
    });
  });

  describe('listShiftRequestsForUser', () => {
    it('lists only the guard’s own requests', async () => {
      const chain = requestFindChain([{ _id: objectId() }]);
      ShiftRequest.find.mockReturnValue(chain);
      ShiftRequest.countDocuments.mockResolvedValue(1);

      const result = await listShiftRequestsForUser({
        user: { _id: guardId, role: 'guard' },
        query: { status: 'PENDING' },
      });

      expect(ShiftRequest.find).toHaveBeenCalledWith({
        requestingGuardId: guardId,
        status: 'PENDING',
      });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('scopes employer requests to shifts they created or active branches they own', async () => {
      const scopedShiftIds = [shiftId];
      const chain = requestFindChain([]);

      Branch.find.mockReturnValue(distinctResult([objectId()]));
      Shift.find.mockReturnValue(distinctResult(scopedShiftIds));
      ShiftRequest.find.mockReturnValue(chain);
      ShiftRequest.countDocuments.mockResolvedValue(0);

      await listShiftRequestsForUser({
        user: { _id: employerId, role: 'employer' },
        query: {},
      });

      expect(Shift.find).toHaveBeenCalledWith({
        $or: [
          { createdBy: employerId },
          { siteId: { $in: expect.any(Array) } },
        ],
      });
      expect(ShiftRequest.find).toHaveBeenCalledWith({
        originalShiftId: { $in: scopedShiftIds },
      });
    });
  });

  describe('reviewShiftRequest', () => {
    it('approves a pending leave request without mutating the original shift', async () => {
      const request = {
        _id: objectId(),
        type: 'LEAVE',
        status: 'PENDING',
        originalShiftId: shiftId,
        requestingGuardId: guardId,
        save: jest.fn().mockResolvedValue(true),
      };
      const shift = {
        _id: shiftId,
        status: 'assigned',
        acceptedBy: guardId,
        guardIds: [guardId],
        applicants: [guardId],
        save: jest.fn().mockResolvedValue(true),
      };

      ShiftRequest.findById.mockResolvedValue(request);
      Branch.find.mockReturnValue(distinctResult([]));
      Shift.findOne.mockResolvedValue(shift);

      const result = await reviewShiftRequest({
        user: { _id: employerId, role: 'employer' },
        requestId: request._id,
        status: 'APPROVED',
      });

      expect(result.status).toBe('APPROVED');
      expect(result.reviewedBy).toBe(employerId);
      expect(shift.status).toBe('assigned');
      expect(shift.acceptedBy).toBe(guardId);
      expect(shift.guardIds).toEqual([guardId]);
      expect(shift.save).not.toHaveBeenCalled();
      expect(request.save).toHaveBeenCalled();
    });

    it('rejects terminal status transitions', async () => {
      const request = {
        _id: objectId(),
        type: 'LEAVE',
        status: 'APPROVED',
        originalShiftId: shiftId,
        requestingGuardId: guardId,
      };

      ShiftRequest.findById.mockResolvedValue(request);

      await expect(reviewShiftRequest({
        user: { _id: employerId, role: 'employer' },
        requestId: request._id,
        status: 'REJECTED',
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Cannot transition shift request from APPROVED to REJECTED',
      });
    });
  });
});
