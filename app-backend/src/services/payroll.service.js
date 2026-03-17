import Shift from "../models/Shift.js";
import ShiftAttendance from "../models/ShiftAttendance.js";

const getWeekStart = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  date.setDate(diff);
  date.setHours(0, 0, 0, 0);

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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return "unknown";
};

export const buildPayrollSummary = async (query, user) => {
  const { startDate, endDate, periodType, guardId, site, department } = query;

  if (!startDate || !endDate || !periodType) {
    throw new Error("startDate, endDate, and periodType are required");
  }

  const allowedPeriods = ["daily", "weekly", "monthly"];
  if (!allowedPeriods.includes(periodType)) {
    throw new Error("periodType must be daily, weekly, or monthly");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid startDate or endDate");
  }

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

  if (guardId) {
    shiftQuery.acceptedBy = guardId;
  }

  if (site) {
    shiftQuery.location = site;
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

    const scheduledStart = shift.startTime ? new Date(shift.startTime) : null;
    const scheduledEnd = shift.endTime ? new Date(shift.endTime) : null;

    let scheduledHours = 0;
    if (
      scheduledStart &&
      scheduledEnd &&
      !isNaN(scheduledStart.getTime()) &&
      !isNaN(scheduledEnd.getTime())
    ) {
      scheduledHours = (scheduledEnd - scheduledStart) / (1000 * 60 * 60);
    }

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
      location: shift.location || null,
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
    requestedBy: user?._id || null,
  };
};