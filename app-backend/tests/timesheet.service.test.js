import mongoose from 'mongoose';
import Timesheet from '../src/models/Timesheet.js';
import {
  calculateTimesheetValues,
  generateTimesheetForCompletedShift,
} from '../src/services/timesheet.service.js';

jest.mock('../src/models/Timesheet.js', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn(),
  },
}));

describe('Timesheet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates worked hours, break time, and gross pay', () => {
    const values = calculateTimesheetValues(
      {
        date: new Date('2026-05-01T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '17:00',
        breakTime: 30,
        payRate: 35,
      },
      {
        checkInTime: new Date('2026-05-01T09:05:00.000Z'),
        checkOutTime: new Date('2026-05-01T17:20:00.000Z'),
      }
    );

    expect(values.scheduledHours).toBe(8);
    expect(values.workedHours).toBe(7.75);
    expect(values.breakMinutes).toBe(30);
    expect(values.grossPay).toBe(271.25);
  });

  it('upserts one timesheet for the completed shift and guard', async () => {
    const shiftId = new mongoose.Types.ObjectId();
    const guardId = new mongoose.Types.ObjectId();
    const employerId = new mongoose.Types.ObjectId();
    const attendanceId = new mongoose.Types.ObjectId();
    const savedTimesheet = { _id: new mongoose.Types.ObjectId(), shiftId, guardId };

    Timesheet.findOneAndUpdate.mockResolvedValue(savedTimesheet);

    const result = await generateTimesheetForCompletedShift(
      {
        _id: shiftId,
        acceptedBy: guardId,
        createdBy: employerId,
        date: new Date('2026-05-01T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '17:00',
        breakTime: 0,
        payRate: 30,
      },
      {
        _id: attendanceId,
        checkInTime: new Date('2026-05-01T09:00:00.000Z'),
        checkOutTime: new Date('2026-05-01T17:00:00.000Z'),
      }
    );

    expect(result).toBe(savedTimesheet);
    expect(Timesheet.findOneAndUpdate).toHaveBeenCalledWith(
      { shiftId, guardId },
      expect.objectContaining({
        $set: expect.objectContaining({
          employerId,
          attendanceId,
          workedHours: 8,
          grossPay: 240,
          status: 'generated',
        }),
        $setOnInsert: expect.objectContaining({
          generatedAt: expect.any(Date),
        }),
      }),
      expect.objectContaining({
        new: true,
        upsert: true,
        runValidators: true,
      })
    );
  });
});
