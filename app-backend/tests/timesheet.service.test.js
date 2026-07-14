import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import mongoose from 'mongoose';

import Branch from '../src/models/Branch.js';
import Shift from '../src/models/Shift.js';
import ShiftAttendance from '../src/models/ShiftAttendance.js';
import Timesheet from '../src/models/Timesheet.js';
import User from '../src/models/User.js';
import {
  generateTimesheets,
  getTimesheetForUser,
  listTimesheetsForUser,
} from '../src/services/timesheet.service.js';

describe('Timesheet service', () => {
  let employer;
  let otherEmployer;
  let guard;
  let otherGuard;
  let branch;

  const siteLocation = {
    type: 'Point',
    coordinates: [144.9631, -37.8136],
  };

  const createShift = (overrides = {}) =>
    Shift.create({
      title: overrides.title || 'Completed Timesheet Shift',
      date: overrides.date || new Date('2026-12-10T00:00:00.000Z'),
      startTime: overrides.startTime || '09:00',
      endTime: overrides.endTime || '17:00',
      breakTime: overrides.breakTime ?? 30,
      createdBy: overrides.createdBy || employer._id,
      acceptedBy: overrides.acceptedBy || guard._id,
      siteId: branch._id,
      location: {
        street: 'Main',
        suburb: 'CBD',
        state: 'VIC',
        postcode: '3000',
        latitude: -37.8136,
        longitude: 144.9631,
      },
      payRate: overrides.payRate ?? 45,
      shiftType: 'Day',
      status: overrides.status || 'completed',
    });

  const createAttendance = (shift, overrides = {}) =>
    ShiftAttendance.create({
      guardId: overrides.guardId || shift.acceptedBy,
      shiftId: shift._id,
      siteLocation,
      checkInTime:
        overrides.checkInTime === undefined
          ? new Date('2026-12-10T09:05:00.000Z')
          : overrides.checkInTime,
      checkOutTime:
        overrides.checkOutTime === undefined
          ? new Date('2026-12-10T17:20:00.000Z')
          : overrides.checkOutTime,
      locationVerified: true,
    });

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Promise.all([
      Shift.deleteMany({}),
      ShiftAttendance.deleteMany({}),
      Timesheet.deleteMany({}),
      Branch.deleteMany({ code: 'TS001' }),
      User.deleteMany({
        email: {
          $in: [
            'timesheet.employer@test.com',
            'timesheet.other.employer@test.com',
            'timesheet.guard@test.com',
            'timesheet.other.guard@test.com',
          ],
        },
      }),
    ]);

    employer = await User.create({
      name: 'Timesheet Employer',
      email: 'timesheet.employer@test.com',
      role: 'employer',
      password: 'Password1!',
    });

    otherEmployer = await User.create({
      name: 'Other Timesheet Employer',
      email: 'timesheet.other.employer@test.com',
      role: 'employer',
      password: 'Password1!',
    });

    guard = await User.create({
      name: 'Timesheet Guard',
      email: 'timesheet.guard@test.com',
      role: 'guard',
      password: 'Password1!',
    });

    otherGuard = await User.create({
      name: 'Other Timesheet Guard',
      email: 'timesheet.other.guard@test.com',
      role: 'guard',
      password: 'Password1!',
    });

    branch = await Branch.create({
      name: 'Timesheet Site',
      code: 'TS001',
      employerId: employer._id,
      isActive: true,
    });
  });

  beforeEach(async () => {
    await Promise.all([
      Shift.deleteMany({}),
      ShiftAttendance.deleteMany({}),
      Timesheet.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      Shift.deleteMany({}),
      ShiftAttendance.deleteMany({}),
      Timesheet.deleteMany({}),
      Branch.deleteMany({ code: 'TS001' }),
      User.deleteMany({
        email: {
          $in: [
            'timesheet.employer@test.com',
            'timesheet.other.employer@test.com',
            'timesheet.guard@test.com',
            'timesheet.other.guard@test.com',
          ],
        },
      }),
    ]);
    await mongoose.connection.close();
  });

  test('generates timesheet data from a valid completed shift and completed attendance', async () => {
    const shift = await createShift();
    const attendance = await createAttendance(shift);

    const result = await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    expect(result.generated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.timesheets[0]).toMatchObject({
      shiftId: String(shift._id),
      guardId: String(guard._id),
      employerId: String(employer._id),
      attendanceId: String(attendance._id),
      scheduledHours: 7.5,
      actualHours: 8.25,
      payableHours: 7.75,
      attendanceBased: true,
    });
  });

  test('preserves overtime by not capping payable hours at scheduled hours', async () => {
    const shift = await createShift({
      breakTime: 30,
      startTime: '09:00',
      endTime: '17:00',
    });
    await createAttendance(shift, {
      checkInTime: new Date('2026-12-10T08:30:00.000Z'),
      checkOutTime: new Date('2026-12-10T19:00:00.000Z'),
    });

    const result = await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    expect(result.timesheets[0]).toMatchObject({
      scheduledHours: 7.5,
      actualHours: 10.5,
      payableHours: 10,
    });
  });

  test('deducts shift break time from payable hours when attendance is complete', async () => {
    const shift = await createShift({ breakTime: 60 });
    await createAttendance(shift, {
      checkInTime: new Date('2026-12-10T09:00:00.000Z'),
      checkOutTime: new Date('2026-12-10T17:00:00.000Z'),
    });

    const result = await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    expect(result.timesheets[0]).toMatchObject({
      actualHours: 8,
      payableHours: 7,
    });
  });

  test('does not allow payable hours to become negative after break deduction', async () => {
    const shift = await createShift({ breakTime: 60 });
    await createAttendance(shift, {
      checkInTime: new Date('2026-12-10T09:00:00.000Z'),
      checkOutTime: new Date('2026-12-10T09:30:00.000Z'),
    });

    const result = await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    expect(result.timesheets[0]).toMatchObject({
      actualHours: 0.5,
      payableHours: 0,
    });
  });

  test('skips completed shifts with missing checkout', async () => {
    const shift = await createShift();
    await createAttendance(shift, { checkOutTime: null });

    const result = await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(await Timesheet.countDocuments()).toBe(0);
  });

  test('does not generate timesheets for incomplete shifts', async () => {
    const shift = await createShift({ status: 'assigned' });
    await createAttendance(shift);

    const result = await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    expect(result.generated).toBe(0);
    expect(await Timesheet.countDocuments()).toBe(0);
  });

  test('is idempotent for duplicate generation requests', async () => {
    const shift = await createShift();
    await createAttendance(shift);

    await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );
    const second = await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    expect(second.generated).toBe(1);
    expect(await Timesheet.countDocuments({ shiftId: shift._id, guardId: guard._id })).toBe(1);
  });

  test('scopes retrieval to employer-owned timesheets', async () => {
    const ownShift = await createShift();
    await createAttendance(ownShift);
    const otherShift = await createShift({
      title: 'Other Employer Shift',
      createdBy: otherEmployer._id,
      acceptedBy: otherGuard._id,
    });
    await createAttendance(otherShift, {
      guardId: otherGuard._id,
    });

    await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );
    await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: otherEmployer._id, role: 'employer' }
    );

    const result = await listTimesheetsForUser({}, { _id: employer._id, role: 'employer' });

    expect(result.total).toBe(1);
    expect(result.timesheets[0].employerId).toBe(String(employer._id));
  });

  test('scopes retrieval to guard-owned timesheets', async () => {
    const shift = await createShift();
    await createAttendance(shift);

    await generateTimesheets(
      { startDate: '2026-12-01', endDate: '2026-12-31' },
      { _id: employer._id, role: 'employer' }
    );

    const guardResult = await listTimesheetsForUser({}, { _id: guard._id, role: 'guard' });
    const timesheet = await getTimesheetForUser(guardResult.timesheets[0].id, {
      _id: guard._id,
      role: 'guard',
    });

    expect(guardResult.total).toBe(1);
    expect(timesheet.guardId).toBe(String(guard._id));
    await expect(
      listTimesheetsForUser({ guardId: String(otherGuard._id) }, { _id: guard._id, role: 'guard' })
    ).rejects.toMatchObject({
      message: 'Guards can only access their own timesheets',
      statusCode: 403,
    });
  });
});
