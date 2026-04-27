import Shift from "../models/Shift.js";
import ShiftAttendance from "../models/ShiftAttendance.js";

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidISODateOnly = (value) => {
  if (!ISO_DATE_ONLY_REGEX.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
};

const getWeekStart = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);

  date.setUTCDate(diff);
  date.setUTCHours(0, 0, 0, 0);

  return date;
};

const formatPeriodLabel = (dateValue, periodType) => {
  const date = new Date(dateValue);

  if (periodType === "daily") {
    return date.toISOString().split("T")[0];
  }

  if (periodType === "weekly") {
    const weekStart = getWeekStart(date);
    return `week-of-${weekStart.toISOString().split("T")[0]}`;
  }

  if (periodType === "monthly") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  return "unknown";
};

const calculateScheduledHours = (shift) => {
  if (!shift.startTime || !shift.endTime || !shift.date) {
    return 0;
  }

  const [startHour, startMinute] = String(shift.startTime).split(":").map(Number);
  const [endHour, endMinute] = String(shift.endTime).split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  const scheduledStart = new Date(shift.date);
  const scheduledEnd = new Date(shift.date);

  scheduledStart.setHours(startHour, startMinute, 0, 0);
  scheduledEnd.setHours(endHour, endMinute, 0, 0);

  if (scheduledEnd <= scheduledStart) {
    scheduledEnd.setDate(scheduledEnd.getDate() + 1);
  }

  return (scheduledEnd - scheduledStart) / (1000 * 60 * 60);
};

export const buildPayrollSummary = async (query, user) => {
  const { startDate, endDate, periodType, guardId, site, department } = query;

  if (!user?._id || !user?.role) {
    throw new Error("Unauthorised user context");
  }

  if (!startDate || !endDate || !periodType) {
    throw new Error("startDate, endDate, and periodType are required");
  }

  if (!isValidISODateOnly(startDate) || !isValidISODateOnly(endDate)) {
    throw new Error("startDate and endDate must be valid ISO dates in YYYY-MM-DD format");
  }

  const allowedPeriods = ["daily", "weekly", "monthly"];
  if (!allowedPeriods.includes(periodType)) {
    throw new Error("periodType must be daily, weekly, or monthly");
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  if (start > end) {
    throw new Error("startDate cannot be after endDate");
  }

  const shiftQuery = {
    status: "completed",
    date: {
      $gte: start,
      $lte: end,
    },
  };

  // Role-based access rules
  if (user.role === "admin") {
    if (guardId) {
      shiftQuery.acceptedBy = guardId;
    }
  } else if (user.role === "employer") {
    // current scoping uses shift ownership
    shiftQuery.createdBy = user._id;

    if (guardId) {
      shiftQuery.acceptedBy = guardId;
    }
  } else if (user.role === "guard") {
    shiftQuery.acceptedBy = user._id;

    if (guardId && String(guardId) !== String(user._id)) {
      throw new Error("Guards can only access their own payroll summary");
    }
  } else {
    throw new Error("Forbidden: unsupported role");
  }

  if (site) {
    shiftQuery.location = site;
  }

  // depends on current Shift model support
  if (department) {
    shiftQuery.field = department;
  }

  const shifts = await Shift.find(shiftQuery);
  const shiftIds = shifts.map((shift) => shift._id);

  const attendanceRecords = await ShiftAttendance.find({
    shiftId: { $in: shiftIds },
  });

  const attendanceMap = new Map();
  for (const record of attendanceRecords) {
    attendanceMap.set(String(record.shiftId), record);
  }

  const payrollDetails = shifts.map((shift) => {
    const attendance = attendanceMap.get(String(shift._id));

    const checkInTime = attendance?.checkInTime ? new Date(attendance.checkInTime) : null;
    const checkOutTime = attendance?.checkOutTime ? new Date(attendance.checkOutTime) : null;

    let totalHours = 0;
    let overtimeHours = 0;
    let pendingApproval = 0;
    let underworkedShift = 0;

    const scheduledHours = calculateScheduledHours(shift);

    if (checkInTime && checkOutTime) {
      totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      overtimeHours = Math.max(0, totalHours - 8);

      if (scheduledHours > 0 && totalHours < scheduledHours) {
        underworkedShift = 1;
      }
    } else {
      pendingApproval = 1;
    }

    return {
      shiftId: shift._id,
      guardId: shift.acceptedBy || null,
      guardName: shift.guardName || null,
      employerId: shift.createdBy || null,
      location: shift.location || null,
      department: shift.field || null,
      date: shift.date || null,
      scheduledHours,
      totalHours,
      overtimeHours,
      underworkedShift,
      pendingApproval,
      attendanceStatus: checkInTime && checkOutTime ? "complete" : "pending_review",
    };
  });

  const guardSummaryMap = new Map();

  for (const item of payrollDetails) {
    const key = String(item.guardId || "unassigned");

    if (!guardSummaryMap.has(key)) {
      guardSummaryMap.set(key, {
        guardId: item.guardId,
        guardName: item.guardName,
        totalShifts: 0,
        totalHours: 0,
        overtimeHours: 0,
        underworkedShifts: 0,
        pendingApproval: 0,
      });
    }

    const summary = guardSummaryMap.get(key);
    summary.totalShifts += 1;
    summary.totalHours += item.totalHours;
    summary.overtimeHours += item.overtimeHours;
    summary.underworkedShifts += item.underworkedShift;
    summary.pendingApproval += item.pendingApproval;
  }

  const guardSummaries = Array.from(guardSummaryMap.values());

  const periodSummaryMap = new Map();

  for (const item of payrollDetails) {
    const label = formatPeriodLabel(item.date, periodType);

    if (!periodSummaryMap.has(label)) {
      periodSummaryMap.set(label, {
        periodLabel: label,
        totalShifts: 0,
        totalHours: 0,
        overtimeHours: 0,
        underworkedShifts: 0,
        pendingApproval: 0,
      });
    }

    const periodSummary = periodSummaryMap.get(label);
    periodSummary.totalShifts += 1;
    periodSummary.totalHours += item.totalHours;
    periodSummary.overtimeHours += item.overtimeHours;
    periodSummary.underworkedShifts += item.underworkedShift;
    periodSummary.pendingApproval += item.pendingApproval;
  }

  const periods = Array.from(periodSummaryMap.values());

  return {
    message: "Payroll data retrieved successfully",
    accessScope: {
      requestedBy: user._id,
      role: user.role,
      guardRestrictedToSelf: user.role === "guard",
      employerRestrictedToOwnShifts: user.role === "employer",
    },
    filters: {
      startDate,
      endDate,
      periodType,
      guardId: guardId || null,
      site: site || null,
      department: department || null,
    },
    summary: {
      totalCompletedShifts: shifts.length,
      totalAttendanceRecords: attendanceRecords.length,
      totalGuards: guardSummaries.length,
      totalHours: guardSummaries.reduce((sum, guard) => sum + guard.totalHours, 0),
      totalOvertimeHours: guardSummaries.reduce((sum, guard) => sum + guard.overtimeHours, 0),
      totalPendingApproval: guardSummaries.reduce((sum, guard) => sum + guard.pendingApproval, 0),
    },
    guards: guardSummaries,
    periods,
    payrollDetails,
  };
};