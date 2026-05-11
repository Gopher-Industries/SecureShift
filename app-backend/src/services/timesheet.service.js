import Timesheet from '../models/Timesheet.js';

const roundHours = (hours) => Math.round(hours * 100) / 100;
const roundMoney = (amount) => Math.round(amount * 100) / 100;

const buildShiftDateTime = (date, time) => {
  const [hour, minute] = String(time).split(':').map(Number);
  const value = new Date(date);
  value.setHours(hour, minute, 0, 0);
  return value;
};

export const calculateTimesheetValues = (shift, attendance) => {
  if (!shift?.date || !shift?.startTime || !shift?.endTime) {
    throw new Error('Shift schedule is incomplete');
  }

  if (!attendance?.checkInTime || !attendance?.checkOutTime) {
    throw new Error('Attendance must include check-in and check-out times');
  }

  const scheduledStart = buildShiftDateTime(shift.date, shift.startTime);
  const scheduledEnd = buildShiftDateTime(shift.date, shift.endTime);

  if (scheduledEnd <= scheduledStart) {
    scheduledEnd.setDate(scheduledEnd.getDate() + 1);
  }

  const actualStart = new Date(attendance.checkInTime);
  const actualEnd = new Date(attendance.checkOutTime);

  if (Number.isNaN(actualStart.getTime()) || Number.isNaN(actualEnd.getTime())) {
    throw new Error('Attendance times are invalid');
  }

  if (actualEnd < actualStart) {
    throw new Error('Check-out time cannot be before check-in time');
  }

  const breakMinutes = Math.max(0, Number(shift.breakTime || 0));
  const scheduledHours = roundHours((scheduledEnd - scheduledStart) / (1000 * 60 * 60));
  const rawWorkedHours = (actualEnd - actualStart) / (1000 * 60 * 60);
  const workedHours = roundHours(Math.max(0, rawWorkedHours - breakMinutes / 60));
  const payRate = Math.max(0, Number(shift.payRate || 0));
  const grossPay = roundMoney(workedHours * payRate);

  return {
    scheduledStart,
    scheduledEnd,
    actualStart,
    actualEnd,
    scheduledHours,
    workedHours,
    breakMinutes,
    payRate,
    grossPay,
  };
};

export const generateTimesheetForCompletedShift = async (shift, attendance) => {
  const guardId = shift?.acceptedBy || shift?.assignedGuard;
  const employerId = shift?.createdBy;

  if (!shift?._id || !guardId || !employerId || !attendance?._id) {
    throw new Error('Shift, guard, employer, and attendance are required');
  }

  const values = calculateTimesheetValues(shift, attendance);

  return Timesheet.findOneAndUpdate(
    {
      shiftId: shift._id,
      guardId,
    },
    {
      $set: {
        employerId,
        attendanceId: attendance._id,
        shiftDate: shift.date,
        ...values,
        status: 'generated',
      },
      $setOnInsert: {
        generatedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};
