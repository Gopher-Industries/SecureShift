import Timesheet from "../models/Timesheet.js";

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const calculateMean = (values = []) => {
  if (!values.length) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export const calculateMedian = (values = []) => {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return round(sorted[middle]);
};

export const calculateTop20Share = (values = []) => {
  if (!values.length) return 0;

  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;

  const sortedDescending = [...values].sort((a, b) => b - a);
  const topCount = Math.max(1, Math.ceil(values.length * 0.2));
  const topTotal = sortedDescending
    .slice(0, topCount)
    .reduce((sum, value) => sum + value, 0);

  return round((topTotal / total) * 100);
};

export const calculateGini = (values = []) => {
  const nonNegativeValues = values
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (!nonNegativeValues.length) return 0;

  const total = nonNegativeValues.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;

  const sorted = [...nonNegativeValues].sort((a, b) => a - b);
  const n = sorted.length;

  const weightedSum = sorted.reduce(
    (sum, value, index) => sum + (index + 1) * value,
    0,
  );

  const gini = (2 * weightedSum) / (n * total) - (n + 1) / n;

  return round(Math.max(0, Math.min(1, gini)), 4);
};

const buildDateFilter = ({ startDate, endDate } = {}) => {
  if (!startDate && !endDate) return {};

  const shiftDate = {};

  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      const error = new Error("Invalid startDate");
      error.statusCode = 400;
      throw error;
    }
    start.setHours(0, 0, 0, 0);
    shiftDate.$gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      const error = new Error("Invalid endDate");
      error.statusCode = 400;
      throw error;
    }
    end.setHours(23, 59, 59, 999);
    shiftDate.$lte = end;
  }

  if (shiftDate.$gte && shiftDate.$lte && shiftDate.$gte > shiftDate.$lte) {
    const error = new Error("startDate must be on or before endDate");
    error.statusCode = 400;
    throw error;
  }

  return { shiftDate };
};

export const getEmployerWorkforceAnalytics = async ({
  employerId,
  startDate,
  endDate,
}) => {
  if (!employerId) {
    const error = new Error("Employer identity is required");
    error.statusCode = 401;
    throw error;
  }

  const dateFilter = buildDateFilter({ startDate, endDate });

  const timesheets = await Timesheet.find({
    employerId,
    ...dateFilter,
  })
    .populate("guardId", "name email")
    .sort({ shiftDate: 1 })
    .lean();

  const workloadMap = new Map();
  const weekdayMap = new Map([
    ["Monday", 0],
    ["Tuesday", 0],
    ["Wednesday", 0],
    ["Thursday", 0],
    ["Friday", 0],
    ["Saturday", 0],
    ["Sunday", 0],
  ]);

  let totalActualHours = 0;

  for (const timesheet of timesheets) {
    const hours = Number(timesheet.actualHours) || 0;
    totalActualHours += hours;

    const guardId = String(timesheet.guardId?._id || timesheet.guardId);
    const guardName = timesheet.guardId?.name || "Unknown guard";

    if (!workloadMap.has(guardId)) {
      workloadMap.set(guardId, {
        guardId,
        guardName,
        actualHours: 0,
        timesheetCount: 0,
      });
    }

    const guard = workloadMap.get(guardId);
    guard.actualHours += hours;
    guard.timesheetCount += 1;

    const weekday = new Date(timesheet.shiftDate).toLocaleDateString("en-AU", {
      weekday: "long",
      timeZone: "UTC",
    });

    if (weekdayMap.has(weekday)) {
      weekdayMap.set(weekday, weekdayMap.get(weekday) + hours);
    }
  }

  const guards = [...workloadMap.values()]
    .map((guard) => ({
      ...guard,
      actualHours: round(guard.actualHours),
    }))
    .sort((a, b) => b.actualHours - a.actualHours);

  const workloadValues = guards.map((guard) => guard.actualHours);

  const totalHoursRounded = round(totalActualHours);

  const guardsWithShare = guards.map((guard) => ({
    ...guard,
    workloadSharePercent:
      totalHoursRounded > 0
        ? round((guard.actualHours / totalHoursRounded) * 100)
        : 0,
  }));

  const demandByWeekday = [...weekdayMap.entries()].map(
    ([weekday, actualHours]) => ({
      weekday,
      actualHours: round(actualHours),
    }),
  );

  return {
    filters: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    dataset: {
      timesheetCount: timesheets.length,
      activeGuardCount: guards.length,
    },
    summary: {
      totalActualHours: totalHoursRounded,
      meanHoursPerGuard: calculateMean(workloadValues),
      medianHoursPerGuard: calculateMedian(workloadValues),
      top20PercentWorkloadShare: calculateTop20Share(workloadValues),
      giniCoefficient: calculateGini(workloadValues),
    },
    guards: guardsWithShare,
    demandByWeekday,
  };
};
