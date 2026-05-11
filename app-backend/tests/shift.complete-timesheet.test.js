import mongoose from 'mongoose';
import Shift from '../src/models/Shift.js';
import { completeShift } from '../src/controllers/shift.controller.js';
import { generateTimesheetForCompletedShift } from '../src/services/timesheet.service.js';

jest.mock('../src/models/Shift.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('../src/services/timesheet.service.js', () => ({
  __esModule: true,
  generateTimesheetForCompletedShift: jest.fn(),
}));

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('completeShift timesheet generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a timesheet when a shift is completed', async () => {
    const shiftId = new mongoose.Types.ObjectId();
    const employerId = new mongoose.Types.ObjectId();
    const attendance = {
      _id: new mongoose.Types.ObjectId(),
      checkInTime: new Date('2026-05-01T09:00:00.000Z'),
      checkOutTime: new Date('2026-05-01T17:00:00.000Z'),
    };
    const shift = {
      _id: shiftId,
      createdBy: employerId,
      assignedGuard: new mongoose.Types.ObjectId(),
      status: 'assigned',
      attendance,
      hasCheckedIn: true,
      hasCheckedOut: true,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const timesheet = { _id: new mongoose.Types.ObjectId(), shiftId };

    Shift.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(shift),
    });
    generateTimesheetForCompletedShift.mockResolvedValue(timesheet);

    const req = {
      params: { id: String(shiftId) },
      user: { _id: employerId, role: 'employer' },
      audit: { log: jest.fn().mockResolvedValue(undefined) },
    };
    const res = createResponse();

    await completeShift(req, res);

    expect(shift.status).toBe('completed');
    expect(shift.save).toHaveBeenCalled();
    expect(generateTimesheetForCompletedShift).toHaveBeenCalledWith(shift, attendance);
    expect(req.audit.log).toHaveBeenCalledWith(
      employerId,
      'SHIFT_COMPLETED',
      expect.objectContaining({
        shiftId,
        timesheetId: timesheet._id,
      })
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Shift completed',
      shift,
      timesheet,
    });
  });
});
