import { jest } from '@jest/globals';
import mongoose from 'mongoose';

import {
  createShift,
  listAvailableShifts,
  applyForShift,
  approveShift,
  completeShift,
  getMyShifts,
  rateShift,
  getShiftHistory,
} from '../src/controllers/shift.controller.js';

import Shift from '../src/models/Shift.js';

// Ensure ACTIONS global exists for audit logging calls
global.ACTIONS = {
  SHIFT_CREATED: 'shift_created',
  SHIFT_APPLIED: 'shift_applied',
  SHIFT_APPROVED: 'shift_approved',
  SHIFT_COMPLETED: 'shift_completed',
  RATINGS_SUBMITTED: 'ratings_submitted',
};

jest.mock('../src/models/Shift.js', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
    },
  };
});

describe('shift.controller (unit)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // reset mocks
    Shift.create.mockReset();
    Shift.find.mockReset();
    Shift.countDocuments.mockReset();
    Shift.findById.mockReset();

    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    // default valid object id
    jest.spyOn(mongoose, 'isValidObjectId').mockImplementation((v) => {
      // treat strings that look like hex or numbers as valid in tests
      if (!v) return false;
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createShift', () => {
    it('returns 400 when required fields missing', async () => {
      req = { body: { title: 'x' }, user: { _id: 'u1' }, audit: { log: jest.fn() } };
      await createShift(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'title, date, startTime, endTime are required' });
    });

    it('returns 400 for invalid date', async () => {
      req = {
        body: { title: 't', date: 'not-a-date', startTime: '09:00', endTime: '17:00' },
        user: { id: 'u2' },
        audit: { log: jest.fn() },
      };
      await createShift(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'date must be a valid date (YYYY-MM-DD)' });
    });

    it('returns 400 for invalid time format', async () => {
      req = {
        body: { title: 't', date: '2025-01-01', startTime: '9am', endTime: '17:00' },
        user: { id: 'u2' },
        audit: { log: jest.fn() },
      };
      await createShift(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'startTime/endTime must be HH:MM (24h)' });
    });

    it('creates shift and returns 201 on success', async () => {
      const created = { _id: 's1', title: 't', date: new Date('2025-01-01') };
      Shift.create.mockResolvedValue(created);

      const auditLog = jest.fn().mockResolvedValue(undefined);
      req = {
        body: { title: 't', date: '2025-01-01', startTime: '09:00', endTime: '17:00' },
        user: { _id: 'u2' },
        audit: { log: auditLog },
      };

      await createShift(req, res);

      expect(Shift.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
      expect(auditLog).toHaveBeenCalled();
    });
  });

  describe('listAvailableShifts', () => {
    it('guard role returns items with pagination', async () => {
      const doc = { _id: 's1', title: 't' };
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([doc]),
      };
      Shift.find.mockReturnValue(chain);
      Shift.countDocuments.mockResolvedValue(1);

      req = { user: { role: 'guard', _id: 'g1' }, query: {} };
      await listAvailableShifts(req, res);

      expect(Shift.find).toHaveBeenCalled();
      expect(Shift.countDocuments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 1, items: [doc] }));
    });

    it('employer role returns applicant counts when present', async () => {
      const doc = { _id: 's2', title: 't2', applicants: [{ _id: 'a1' }, { _id: 'a2' }] };
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([doc]),
      };
      Shift.find.mockReturnValue(chain);
      Shift.countDocuments.mockResolvedValue(1);

      req = { user: { role: 'employer', _id: 'e1' }, query: { withApplicantsOnly: 'true' } };
      await listAvailableShifts(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({
          applicantCount: 2,
          hasApplicants: true,
        })]),
      }));
    });

    it('returns 403 for unknown role', async () => {
      req = { user: { role: 'unknown', _id: 'x' }, query: {} };
      await listAvailableShifts(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });
  });

  describe('applyForShift', () => {
    it('rejects invalid id', async () => {
      jest.spyOn(mongoose, 'isValidObjectId').mockReturnValue(false);
      req = { params: { id: 'bad' }, user: { _id: 'g1' } };
      await applyForShift(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    it('returns 404 when shift not found', async () => {
      mongoose.isValidObjectId.mockReturnValue(true);
      Shift.findById.mockResolvedValue(null);
      req = { params: { id: 's1' }, user: { _id: 'g1' } };
      await applyForShift(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Shift not found' });
    });

    it('applies successfully and logs audit', async () => {
      const shift = {
        _id: 's1',
        status: 'open',
        createdBy: 'em1',
        applicants: [],
        save: jest.fn().mockResolvedValue(true),
      };
      Shift.findById.mockResolvedValue(shift);

      const auditLog = jest.fn().mockResolvedValue(undefined);
      req = { params: { id: 's1' }, user: { _id: 'g1' }, audit: { log: auditLog } };

      await applyForShift(req, res);

      expect(shift.save).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Application submitted' }));
    });
  });

  describe('approveShift', () => {
    it('returns 400 for invalid ids', async () => {
      jest.spyOn(mongoose, 'isValidObjectId').mockImplementation((v) => v === 'valid');
      req = { params: { id: 'bad' }, body: { guardId: 'alsoBad' }, user: { _id: 'u1', role: 'employer' } };
      await approveShift(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('approves successfully when owner', async () => {
      mongoose.isValidObjectId.mockReturnValue(true);
      const shift = {
        _id: 's2',
        createdBy: 'owner1',
        status: 'applied',
        applicants: ['g1', 'g2'],
        save: jest.fn().mockResolvedValue(true),
      };
      Shift.findById.mockResolvedValue(shift);

      const auditLog = jest.fn().mockResolvedValue(undefined);
      req = { params: { id: 's2' }, body: { guardId: 'g1', keepOthers: false }, user: { _id: 'owner1', role: 'employer' }, audit: { log: auditLog } };

      await approveShift(req, res);

      expect(shift.save).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Guard approved' }));
      expect(shift.status).toBe('assigned');
      expect(shift.applicants).toEqual(['g1']);
    });

    it('returns 403 if not owner/admin', async () => {
      mongoose.isValidObjectId.mockReturnValue(true);
      const shift = { _id: 's2', createdBy: 'owner1', status: 'applied', applicants: ['g1'], save: jest.fn() };
      Shift.findById.mockResolvedValue(shift);

      req = { params: { id: 's2' }, body: { guardId: 'g1' }, user: { _id: 'someoneElse', role: 'employer' }, audit: { log: jest.fn() } };
      await approveShift(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not allowed' });
    });
  });

  describe('completeShift', () => {
    it('returns 400 for invalid id', async () => {
      mongoose.isValidObjectId.mockReturnValue(false);
      req = { params: { id: 'bad' }, user: { _id: 'u1', role: 'employer' } };
      await completeShift(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('completes successfully when owner', async () => {
      mongoose.isValidObjectId.mockReturnValue(true);
      const shift = { _id: 's3', createdBy: 'owner1', assignedGuard: 'g1', status: 'assigned', save: jest.fn().mockResolvedValue(true) };
      Shift.findById.mockResolvedValue(shift);

      const auditLog = jest.fn().mockResolvedValue(undefined);
      req = { params: { id: 's3' }, user: { _id: 'owner1', role: 'employer' }, audit: { log: auditLog } };

      await completeShift(req, res);

      expect(shift.save).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Shift completed' }));
      expect(shift.status).toBe('completed');
    });
  });

  describe('getMyShifts', () => {
    it('returns shifts for guard', async () => {
      const shifts = [{ _id: 's1' }];
      const findChain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: function (resolve, reject) { return Promise.resolve(shifts).then(resolve, reject); },
      };
      Shift.find.mockReturnValue(findChain);

      req = { user: { role: 'guard', _id: 'g1' }, query: {} };
      await getMyShifts(req, res);

      expect(Shift.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(shifts);
    });
  });

  describe('rateShift', () => {
    it('returns 400 for invalid id', async () => {
      mongoose.isValidObjectId.mockReturnValue(false);
      req = { params: { id: 'bad' }, body: { rating: 5 }, user: { _id: 'u1', role: 'guard' } };
      await rateShift(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when shift not found', async () => {
      mongoose.isValidObjectId.mockReturnValue(true);
      Shift.findById.mockResolvedValue(null);
      req = { params: { id: 's4' }, body: { rating: 5 }, user: { _id: 'u1', role: 'guard' } };
      await rateShift(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('saves guard rating when assigned', async () => {
      mongoose.isValidObjectId.mockReturnValue(true);
      const shift = { _id: 's4', status: 'completed', assignedGuard: 'g1', ratedByGuard: false, save: jest.fn().mockResolvedValue(true) };
      Shift.findById.mockResolvedValue(shift);

      const auditLog = jest.fn().mockResolvedValue(undefined);
      req = { params: { id: 's4' }, body: { rating: 4 }, user: { _id: 'g1', role: 'guard' }, audit: { log: auditLog } };

      await rateShift(req, res);

      expect(shift.save).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Rating saved' }));
      expect(shift.guardRating).toBe(4);
      expect(shift.ratedByGuard).toBe(true);
    });
  });

  describe('getShiftHistory', () => {
    it('returns 403 for admin trying to view history', async () => {
      req = { user: { role: 'admin', _id: 'a1' } };
      await getShiftHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: only guards and employers can view history' });
    });

    it('returns history for guard', async () => {
      const shifts = [{ _id: 's5' }];
      const findChain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        then: function (resolve, reject) { return Promise.resolve(shifts).then(resolve, reject); },
      };
      Shift.find.mockReturnValue(findChain);

      req = { user: { role: 'guard', _id: 'g1' } };
      await getShiftHistory(req, res);

      expect(Shift.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ total: shifts.length, items: shifts });
    });
  });
});
