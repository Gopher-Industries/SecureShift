import Shift from '../models/Shift.js';

export const FATIGUE_RULES = {
  maxShiftsPerWeek: 5,
  maxHoursPerDay: 10,
  maxHoursPerWeek: 40,
};

const MINUTES_PER_DAY = 24 * 60;

export const timeToMinutes = (time) => {
  if (typeof time !== 'string') {
    throw new Error('Time must be a string in HH:MM format');
  }

  const match = time.match(/^([0-1]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    throw new Error('Time must be in HH:MM format');
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours * 60 + minutes;
};

export const calculateShiftHours = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const durationMinutes =
    endMinutes > startMinutes
      ? endMinutes - startMinutes
      : endMinutes - startMinutes + MINUTES_PER_DAY;

  if (durationMinutes <= 0) {
    throw new Error('Shift duration must be greater than zero');
  }

  return durationMinutes / 60;
};

const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  return start;
};

const getEndOfWeek = (date) => {
  const end = getStartOfWeek(date);

  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return end;
};

const isSameShiftDate = (shiftDate, targetDate) => {
  const first = new Date(shiftDate);
  const second = new Date(targetDate);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

export const calculateFatigueScore = ({
  shiftsThisWeek,
  hoursThisDay,
  hoursThisWeek,
}) => {
  const shiftLoad = Math.min(
    shiftsThisWeek / FATIGUE_RULES.maxShiftsPerWeek,
    1
  );

  const dailyLoad = Math.min(
    hoursThisDay / FATIGUE_RULES.maxHoursPerDay,
    1
  );

  const weeklyLoad = Math.min(
    hoursThisWeek / FATIGUE_RULES.maxHoursPerWeek,
    1
  );

  return Math.round(((shiftLoad + dailyLoad + weeklyLoad) / 3) * 100);
};

export const buildFatigueWarnings = ({
  shiftsThisWeek,
  hoursThisDay,
  hoursThisWeek,
}) => {
  const warnings = [];

  if (shiftsThisWeek > FATIGUE_RULES.maxShiftsPerWeek) {
    warnings.push(
      `Guard exceeds recommended weekly shift limit of ${FATIGUE_RULES.maxShiftsPerWeek} shifts`
    );
  }

  if (hoursThisDay > FATIGUE_RULES.maxHoursPerDay) {
    warnings.push(
      `Guard exceeds recommended daily hour limit of ${FATIGUE_RULES.maxHoursPerDay} hours`
    );
  }

  if (hoursThisWeek > FATIGUE_RULES.maxHoursPerWeek) {
    warnings.push(
      `Guard exceeds recommended weekly hour limit of ${FATIGUE_RULES.maxHoursPerWeek} hours`
    );
  }

  return warnings;
};

export const assessFatigueFromMetrics = ({
  shiftsThisWeek,
  hoursThisDay,
  hoursThisWeek,
}) => {
  const fatigueScore = calculateFatigueScore({
    shiftsThisWeek,
    hoursThisDay,
    hoursThisWeek,
  });

  const warnings = buildFatigueWarnings({
    shiftsThisWeek,
    hoursThisDay,
    hoursThisWeek,
  });

  return {
    fatigueScore,
    warnings,
    isFatigued: warnings.length > 0,
    metrics: {
      shiftsThisWeek,
      hoursThisDay,
      hoursThisWeek,
    },
  };
};

export const assessGuardFatigue = async (guardId, proposedShift) => {
  if (!guardId) {
    throw new Error('Guard ID is required for fatigue assessment');
  }

  if (!proposedShift?.date || !proposedShift?.startTime || !proposedShift?.endTime) {
    throw new Error(
      'Shift date, start time, and end time are required for fatigue assessment'
    );
  }

  const proposedDate = new Date(proposedShift.date);
  if (Number.isNaN(proposedDate.getTime())) {
    throw new Error('Shift date must be valid for fatigue assessment');
  }

  const weekStart = getStartOfWeek(proposedDate);
  const weekEnd = getEndOfWeek(proposedDate);

  const existingShifts = await Shift.find({
    acceptedBy: guardId,
    status: { $in: ['assigned', 'completed'] },
    date: {
      $gte: weekStart,
      $lte: weekEnd,
    },
  }).select('date startTime endTime status acceptedBy');

  const proposedShiftHours = calculateShiftHours(
    proposedShift.startTime,
    proposedShift.endTime
  );

  const existingWeeklyHours = existingShifts.reduce((total, shift) => {
    return total + calculateShiftHours(shift.startTime, shift.endTime);
  }, 0);

  const existingDailyHours = existingShifts
    .filter((shift) => isSameShiftDate(shift.date, proposedDate))
    .reduce((total, shift) => {
      return total + calculateShiftHours(shift.startTime, shift.endTime);
    }, 0);

  const shiftsThisWeek = existingShifts.length + 1;
  const hoursThisDay = existingDailyHours + proposedShiftHours;
  const hoursThisWeek = existingWeeklyHours + proposedShiftHours;

  return assessFatigueFromMetrics({
    shiftsThisWeek,
    hoursThisDay,
    hoursThisWeek,
  });
};
